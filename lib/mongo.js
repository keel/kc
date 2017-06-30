/*
 数据库操作,包含与cache结合的CRUD操作
 v1.0.1: 处理updateMt时同时更新mo表
 v1.0.2: 新增mapReduce统计方法
 author:Keel
 */

'use strict';

var mongodb = require('mongodb');
var ktool = require('ktool');
var cck = require('cck');
var mongo = mongodb.MongoClient;
var redis = require('./redis');
var vlog = require('vlog').instance(__filename);
var kconfig = ktool.kconfig;

var db = null;
var colls = {};

var close = function() {
  db.close(true, function(err) {
    if (err) {
      vlog.eo(err, 'close');
    }
    db = null;
    mongo = null;
  });
};

var init = function(configFile, callback) {
  callback = callback || function(err) {
    if (err) {
      vlog.eo(err, 'mongo:init', configFile);
    }
  };
  if (db) {
    //已经初始化过了，不需要再初始化
    callback(null, 'ok');
  }
  db = {}; // 这里准备初始化
  kconfig.init(configFile);
  initDB(kconfig.getConfig().mongo.mongoDbName, kconfig.getConfig().mongo.mongoUrl, function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, 'ok');
  });
};

var initDB = function(dbName, mongoUrl, callback) {

  mongo.connect(mongoUrl, { 'server': { reconnectTries: Number.MAX_VALUE } }, function(err, database) {
    // assert.equal(null, err);
    if (err) {
      // vlog.eo(err,'initDB:connect');
      callback(vlog.ee(new Error('db'), 'initDB:connect:' + mongoUrl + ',' + dbName));
      return;
    }
    db = database;
    db.stats(function(err, stats) {
      if (err) {
        vlog.eo(err, 'initDB:db.stats');
        callback(vlog.ee(new Error('db'), 'initDB:mongo connected but db stats error.' + stats));
        return;
      }
      // vlog.log('mongo stats:%j', stats);
      if (!stats || stats.ok !== 1) {
        vlog.error('mongo stats error %j', stats);
        callback(vlog.ee(new Error('db'), 'initDB:mongo stats error:' + stats));
        return;
      }
      vlog.log('mongo inited OK.');
      callback(null, 'ok');
    });
  });

};




var checkColl = function(name, callback) {

  // console.log('__readTimes:%j',kconfig.getConfig().__readTimes);
  var cl = colls[name];
  if (cl) {
    return callback(null, cl);
  }
  if (!db) {
    initDB(kconfig.getConfig().mongo.mongoDbName, kconfig.getConfig().mongo.mongoUrl, function(err) {
      if (err) {
        return callback(vlog.ee(err, 'checkColl:init'));
      }
      db.collection(name, function(err, coll) {
        if (err) {
          callback(vlog.ee(err, 'checkColl:init:2'));
          return;
        }
        callback(null, coll);
        colls[name] = coll;
      });
    });
  } else {
    db.collection(name, function(err, coll) {
      if (err) {
        callback(vlog.ee(err, 'checkColl:3'));
        return;
      }
      callback(null, coll);
      colls[name] = coll;
    });
  }
};



var mapReduce = function(tableName, map, reduce, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'mapReduce:1'));
    }
    coll.mapReduce(map, reduce, options, function(err, re, stats) {
      if (err) {
        return callback(vlog.ee(err, 'mapReduce:2'));
      }
      callback(null, re, stats);
    });
  });
};

var trimListFromCache = function(key, start, end, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      if (!callback) {
        vlog.eo(err, 'trimListFromCache:checkClient');
        return;
      }
      return callback(vlog.ee(err, 'trimListFromCache:checkClient'));
    }
    client.ltrim(key, start, end, function(err, doc) {
      if (err) {
        if (!callback) {
          vlog.eo(err, 'trimListFromCache:ltrim:' + key + ',' + start + ',' + end);
          return;
        }
        return callback(vlog.ee(err, 'trimListFromCache:ltrim' + key + ',' + start + ',' + end));
      }
      if (callback) {
        callback(null, doc);
      }
    });

  });
};

var findFromCache = function(tableName, key, value, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'findFromCache:checkClient:' + tableName + ',' + key + ',' + value));
    }
    var cacheKey = tableName + ':' + key + ':' + value;
    client.hgetall(cacheKey, function(err, doc) {
      if (err) {
        return callback(vlog.ee(err, 'findFromCache:hgetall:' + cacheKey));
      }
      callback(null, doc);
    });

  });
};
var findFromDb = function(tableName, key, value, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'findFromDb:checkColl:' + tableName));
    }
    var query = {};
    query[key] = value;
    // vlog.log('query:%j',query);
    coll.findOne(query, function(err, dbObj) {
      if (err) {
        return callback(vlog.ee(err, 'findFromDb:findOne:' + JSON.stringify(query)));
      }
      return callback(null, dbObj);
    });
  });
};


var queryOneFromDb = function(tableName, query, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(err);
    }
    // vlog.log('query:%j',query);
    if (!options) {
      options = {};
    }
    coll.findOne(query, options, function(err, dbObj) {
      if (err) {
        return callback(err);
      }
      return callback(null, dbObj);
    });
  });
};

var queryFromDb = function(tableName, query, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(err);
    }
    // vlog.log('query:%j,options:%j',query,options);
    if (!options) {
      options = {
        limit: 20
      };
    } else if (!options.limit) {
      options.limit = 20;
    }
    coll.find(query, options).toArray(function(err, docs) {
      if (err) {
        return callback(err);
      }
      return callback(null, docs);
    });
  });
};


var addToCache = function(cacheKey, value, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'addToCache:checkClient'));
    }
    client.hmset(cacheKey, value, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'addToCache:hmset:' + cacheKey + ',' + value));
      }
      return callback(null, re);
    });
  });
};

var addToDb = function(tableName, dbObj, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'addToDb:checkColl:' + tableName));
    }
    coll.insertOne(dbObj, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'addToDb:insertOne:' + JSON.stringify(dbObj)));
      }
      return callback(null, re);
    });
  });
};
/**
 * 先从cache获取，获取不到从DB查询
 * @param  {string}   tableName
 * @param  {string}   key
 * @param  {object}   value
 * @param  {} callback
 * @return {}
 */
var findObject = function(tableName, key, value, callback) {
  if (!tableName || !key || (!value && value !== 0)) {
    return callback(vlog.ee(new Error('para'), 'findObject para error.[' + tableName + '][' + key + '][' + value + ']'));
  }

  findFromCache(tableName, key, value, function(err, doc) {
    if (err) {
      // vlog.error('findFromCache hgetall error:[%s]:[%s]:[%s],will find from db.',tableName,key,value);
      vlog.eo(err, 'findObject:findFromCache:' + tableName + ',' + key + ',' + value + ':will find from db.');
      doc = null;
    }
    if (doc) {
      // vlog.log('find from cache ok.');
      return callback(null, doc);
    } else {
      // vlog.log('can not find from redis.');
      findFromDb(tableName, key, value, function(err, dbObj) {
        if (err) {
          return callback(vlog.ee(err, 'findObject:findFromDb:' + tableName + ',' + key + ',' + value));
        }
        callback(null, dbObj);
        //如果db中找到但cache中没有则刷入cache
        if (dbObj) {
          var cacheKey = tableName + ':' + key + ':' + value;
          addToCache(cacheKey, dbObj, function(err, re) {
            if (err) {
              vlog.eo(err, 'findObject:addToCache:' + cacheKey + ',' + JSON.stringify(re));
            }
          });
        }
        return;
      });
    }
  });
};

var getFromCache = function(key, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'getFromCache:checkClient:' + key));
    }
    client.get(key, function(err, doc) {
      if (err) {
        return callback(vlog.ee(err, 'getFromCache:get:' + key));
      }
      callback(null, doc);
    });
  });
};

var hgetFromCache = function(key, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'hgetFromCache:checkClient:' + key));
    }
    client.hgetall(key, function(err, doc) {
      if (err) {
        return callback(vlog.ee(err, 'hgetFromCache:hgetall:' + key));
      }
      callback(null, doc);
    });
  });
};
var setToCache = function(key, value, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      if (!callback) {
        vlog.log(err.stack);
        return;
      }
      return callback(vlog.ee(err, 'setToCache:checkClient:' + key + ',' + value));
    }
    client.set(key, value, function(err, re) {
      if (err) {
        if (!callback) {
          vlog.eo(new Error('redis'), 'setToCache:set:' + key + ',' + value);
          return;
        }
        return callback(vlog.ee(err, 'setToCache:set:' + key + ',' + value));
      }
      if (!callback) {
        return;
      }
      callback(null, re);
    });

  });
};


var popFromCache = function(key, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'popFromCache:checkClient:' + key));
    }
    client.rpop(key, function(err, doc) {
      if (err) {
        return callback(vlog.ee(err, 'popFromCache:rpop:' + key));
      }
      var value = JSON.parse(doc);
      return callback(null, value);
    });

  });
};
var popFromDb = function(tableName, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'popFromDb:checkColl:' + tableName));
    }
    coll.findOneAndDelete({}, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'popFromDb:findOneAndDelete:' + tableName));
      }
      return callback(null, re.value);
    });
  });
};
var popList = function(tableName, callback) {
  if (!tableName) {
    return callback(vlog.ee(new Error('para'), 'popList:' + tableName));
  }
  popFromCache(tableName, function(err, doc) {
    if (err) {
      vlog.eo(err, 'popList:popFromCache:' + tableName);
      doc = null;
    }
    if (doc) {
      return callback(null, doc);
    } else {
      popFromDb(tableName, function(err, dbObj) {
        if (err) {
          return callback(vlog.ee(err, 'popList:popFromDb:' + tableName));
        }
        return callback(null, dbObj);
      });
    }
  });
};
var pushToCache = function(key, obj, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'pushToCache:checkClient:' + key + ',' + JSON.stringify(obj)));
    }
    var value = JSON.stringify(obj);
    client.lpush(key, value, function(err, re) {
      if (err) {
        //这里访问cache失败可继续从db查询
        return callback(vlog.ee(err, 'pushToCache:lpush:' + key + ',' + value));
      }
      return callback(null, re);
    });

  });
};
var rangeListFromCache = function(key, rangeStart, rangeEnd, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'rangeListFromCache:checkClient:' + key));
    }
    client.lrange(key, rangeStart, rangeEnd, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'rangeListFromCache:lrange:' + key + ',' + rangeStart + ',' + rangeEnd));
      }
      return callback(null, re);
    });
  });
};
var pushToDb = function(tableName, obj, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'pushToDb:checkColl:' + tableName));
    }
    coll.insertOne(obj, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'pushToDb:insertOne:' + tableName + ',' + JSON.stringify(obj)));
      }
      return callback(null, re);
    });
  });
};

/**
 * 如果cache可用则直接用cache，否则使用db
 * @param  {string}   tableName
 * @param  {Object}   obj
 * @param  {Function} callback
 * @return {}
 */
var pushList = function(tableName, obj, callback) {
  if (!tableName) {
    return callback(vlog.ee(new Error('para'), 'pushList:' + tableName));
  }
  pushToCache(tableName, obj, function(err, re) {
    if (err) {
      vlog.eo(err, 'pushList:pushToCache:' + tableName);
      re = null;
    }
    if (re) {
      return callback(null, re);
    } else {
      pushToDb(tableName, obj, function(err, dbRe) {
        if (err) {
          return callback(vlog.ee(err, 'pushList:pushToDb:' + tableName + ',' + JSON.stringify(obj)));
        }
        return callback(null, dbRe);
      });
    }
  });
};

//注意是updateMany
var update = function(tableName, query, updateMap, options, callback) {
  //更新db
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'update:checkColl:' + tableName));
    }
    coll.updateMany(query, updateMap, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'update:updateMany:' + JSON.stringify(query) + ',' + JSON.stringify(updateMap)));
      }
      return callback(null, re);
    });
  });
};

var updateOne = function(tableName, query, updateMap, options, callback) {
  //更新db
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'updateOne:checkColl:' + tableName));
    }
    coll.updateOne(query, updateMap, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'updateOne:updateOne:' + JSON.stringify(query) + ',' + JSON.stringify(updateMap)));
      }
      return callback(null, re);
    });
  });
};

var updateObject = function(tableName, cacheKey, keyMap, valueMap, callback) {
  //先更新db,再刷新cache
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'updateObject:checkColl:' + tableName));
    }
    coll.updateOne(keyMap, {
      $set: valueMap
    }, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'updateObject:updateOne:' + JSON.stringify(keyMap) + ',' + JSON.stringify(valueMap)));
      }
      redis.checkClient(function(err, client) {
        if (err) {
          return callback(vlog.ee(err, 'updateObject:checkClient'));
        }
        client.hmset(cacheKey, valueMap, function(err, re) {
          if (err) {
            return callback(vlog.ee(err, 'updateObject:hmset:' + cacheKey + ',' + JSON.stringify(valueMap)));
          }
          return callback(null, re);
        });

      });
    });
  });
};
var delFromCache = function(cacheKey, callback) {
  redis.checkClient(function(err, client) {
    if (err) {
      return callback(vlog.ee(err, 'delFromCache:checkClient:' + cacheKey));
    }
    client.del(cacheKey, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'delFromCache:del:' + cacheKey));
      }
      return callback(null, re);
    });

  });
};

var delObject = function(tableName, cacheKey, keyMap, callback) {
  //先更新db,再刷新cache
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'delObject:checkColl:' + tableName));
    }
    coll.deleteOne(keyMap, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'delObject:deleteOne:' + JSON.stringify(keyMap)));
      }
      redis.checkClient(function(err, client) {
        if (err) {
          return callback(vlog.ee(err, 'delObject:checkClient:' + cacheKey));
        }
        client.del(cacheKey, function(err, re) {
          if (err) {
            return callback(vlog.ee(err, 'delObject:del:' + cacheKey));
          }
          return callback(null, re);
        });

      });
    });
  });
};

var del = function(tableName, query, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'del:checkColl:' + tableName));
    }
    coll.deleteMany(query, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'del:deleteMany:' + JSON.stringify(query)));
      }
      return callback(null, re);
    });
  });
};


var addObject = function(tableName, cacheKey, valueMap, callback) {
  //先更新db,再刷新cache
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'addObject:checkColl:' + tableName));
    }
    coll.insertOne(valueMap, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'addObject:insertOne:' + JSON.stringify(valueMap)));
      }
      redis.checkClient(function(err, client) {
        if (err) {
          return callback(vlog.ee(err, 'addObject:checkClient:' + cacheKey));
        }
        client.hmset(cacheKey, valueMap, function(err, re) {
          if (err) {
            return callback(vlog.ee(err, 'addObject:hmset:' + cacheKey + ',' + JSON.stringify(valueMap)));
          }
          return callback(null, re);
        });

      });
    });
  });
};

var cacheTable = function(tableName, cacheKey, query, options, callback) {
  // var sum = 0;
  // var count = function(isEnd){
  //  if (isEnd) {
  //    vlog.log('cache %s ok. key:%s, sum:%d',tableName,cacheKey,sum);
  //    callback(null,'ok');
  //  }else{
  //    ++sum;
  //  }
  // };
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'cacheTable:checkColl:' + tableName));
    }
    redis.checkClient(function(err, client) {
      if (err) {
        return callback(vlog.ee(err, 'cacheTable:checkClient:' + cacheKey));
      }
      if (!query) {
        query = {};
      }
      if (!options) {
        options = {};
      }
      var sum = 0;

      // vlog.log('sum:%d,tableName:%s,cacheKey:%s,query:%j,options:%j',sum,tableName,cacheKey,query,options);
      coll.find(query, options).each(function(err, doc) {
        if (err) {
          vlog.eo(err, 'cacheTable:find:' + JSON.stringify(query));
          return callback(vlog.ee(err, 'cacheTable:find:' + JSON.stringify(query)));
        }
        if (doc) {
          sum++;
          //转换成string
          for (var i in doc) {
            doc[i] = doc[i] + '';
          }
          client.hmset(tableName + ':' + cacheKey + ':' + doc[cacheKey], doc, function(err, re) {
            if (err) {
              // vlog.error(vlog.eo(err,'cacheTable:hmset:'+'cacheTable error!'+tableName+':'+cacheKey+':'+doc[cacheKey]+',id:'+doc._id));
              return callback(vlog.ee(err, 'cacheTable:hmset:' + 'cacheTable error!' + tableName + ':' + cacheKey + ':' + doc[cacheKey] + ',id:' + doc._id));
            }
            // vlog.log('cached %s:%s,%s sum:%d',tableName,doc[cacheKey],doc._id,sum);
          });
        } else {
          //end of each
          vlog.log('cache [%s] ok. key: [%s] , sum: [%d]', tableName, cacheKey, sum);
          callback(null, 'ok');
          return;
        }

      });

    });
  });
};

/**
 * 缓存db到cache,循环回调将tableParasArr处理完为止
 * @param  {Array}   tableParasArr 4个表参数以#号分隔，如:'mtTemplet#pid#{"state":{"$gte":0}}#{}'
 * @param  {Function} callback
 */
var cacheMake = function(tableParasArr, callback) {
  if (tableParasArr.length === 0) {
    callback(null, 'ok');
    return;
  }
  var tableParas = tableParasArr.pop();
  var arr = tableParas.split('#');
  if (arr.length < 2) {
    callback(vlog.ee(new Error('db'), 'tableParas error:' + tableParas));
    return;
  }
  var tableName = arr[0];
  var key = arr[1];
  var query = (arr.length >= 3) ? JSON.parse(arr[2]) : {};
  var options = (arr.length >= 4) ? JSON.parse(arr[3]) : {};
  // vlog.log('tableName:%s,key:%s,query:%j,options:%j',tableName,key,query,options);
  cacheTable(tableName, key, query, options, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'cacheMake:cacheTable:' + JSON.stringify(tableParasArr)));
    }
    cacheMake(tableParasArr, callback);
  });
};

var ObjectID = mongodb.ObjectID;

var idObj = function(idHex) {
  if (isNaN(idHex)) {
    return ObjectID.createFromHexString(idHex);
  } else {
    return parseInt(idHex);
  }
};

var newObjectId = function() {
  return new ObjectID();
};


var count = function(tableName, query, options, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(err);
    }
    //vlog.log('query:%j,options:%j',query,options);
    coll.count(query, options, function(err, docs) {
      return callback(null, docs);
    });
  });

};

var addMany = function(tableName, dbObjArray, callback) {
  checkColl(tableName, function(err, coll) {
    if (err) {
      return callback(vlog.ee(err, 'addMany:checkColl:' + tableName));
    }
    coll.insertMany(dbObjArray, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'addMany:insertMany:' + dbObjArray));
      }
      return callback(null, re);
    });
  });
};


var logToDb = function(tableName, logObj, callback) {
  if (!callback) {
    callback = function(e) {
      if (e) {
        vlog.eo(e);
      }
    };
  }
  process.nextTick(function() {
    var nowMs = (new Date()).getTime();
    logObj.createTime = nowMs;
    logObj.cTime = cck.msToTime(nowMs);
    addToDb(tableName, logObj, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'logToDb', logObj));
      }
      callback(null, re);
    });
  });
};

exports.logToDb = logToDb;
exports.count = count;
exports.newObjectId = newObjectId;
exports.idObj = idObj;
exports.cacheMake = cacheMake;
exports.delFromCache = delFromCache;
exports.delObject = delObject;
exports.del = del;
exports.findObject = findObject;
exports.findFromCache = findFromCache;
exports.findFromDb = findFromDb;
exports.queryOneFromDb = queryOneFromDb;
exports.queryFromDb = queryFromDb;
exports.popList = popList;
exports.pushList = pushList;
exports.pushToCache = pushToCache;
exports.rangeListFromCache = rangeListFromCache;
exports.updateObject = updateObject;
exports.addObject = addObject;
exports.cacheTable = cacheTable;
exports.addToDb = addToDb;
exports.addMany = addMany;
exports.mapReduce = mapReduce;
exports.setToCache = setToCache;
exports.getFromCache = getFromCache;
exports.hgetFromCache = hgetFromCache;
exports.trimListFromCache = trimListFromCache;
exports.init = init;
exports.update = update;
exports.updateOne = updateOne;
exports.checkColl = checkColl;
exports.close = close;


// var q = {'_id':idObj('56f80d7ad54fbc59352a26ec')};

// updateOne('user',q,{'$set':{'loginName':'sike'}},null,function(err, re) {
//   if (err) {
//     vlog.eo(err, 'e');
//     return;
//   }
//   vlog.log('re:%j',re);
// });

// var obj = {
//  type:1,
//  phNum:'13301588025',
//  info:'test info'
// };
// var tb = 'black';

// pushList(tb,obj,function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return ;
//  }
//  vlog.log('re:%j',re);
// });

// popList(tb,function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return ;
//  }
//  vlog.log('re:%j',re);
// });

// addObject(tb,tb+':phNum:'+obj.phNum,obj,function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return;
//  }
//  vlog.log('re:%j',re);
// });

// updateObject(tb,tb+':phNum:'+obj.phNum,{phNum:'13301588025'},{phNum:'18901588025'},function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return;
//  }
//  vlog.log('re:%j',re);
// });

// findObject(tb,'phNum','13301588025',function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return;
//  }
//  vlog.log('re:%j',re);
// });


// cacheTable('spProduct','moToNum',null,null,function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return;
//  }
//  vlog.log('cache ok:%s',re);
// });

// init('../config.json',function (err,re) {
//  if (err) {
//    vlog.eo(err);
//    return;
//  }
//  vlog.log('re:%s',re);
// });
