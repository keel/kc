/*
mongo按配置初始化并附加方法
author:Keel
 */
'use strict';

const mongodb = require('mongodb');
const ktool = require('ktool');
const cck = require('cck');
const vlog = require('vlog').instance(__filename);
const initHelper = require('./initHelper');

const kconfig = ktool.kconfig;
const mongo = mongodb.MongoClient;


//-------------------- 新自定义方法 --------------------


const logToDb = (coll) => (logObj, callback = ktool.defaultCallback(null, __filename)) => {
  const nowMs = (new Date()).getTime();
  logObj.createTime = nowMs;
  logObj.cTime = cck.msToTime(nowMs);
  coll.insertOne(logObj, (err, re) => {
    if (err) {
      return callback(vlog.ee(err, 'logToDb', logObj));
    }
    callback(null, re);
  });
};

const aggr = (coll) => (pipeline, options, callback) => {
  if (!options && callback) {
    options = {};
  } else if ('function' === typeof options) {
    callback = options;
    options = {};
  }
  // console.log('pipeline:%j,options:%j,', pipeline, options);
  coll.aggregate(pipeline, options, (err, reCursor) => {
    if (err) {
      return callback(vlog.ee(err, 'aggregate', pipeline));
    }
    reCursor.toArray((err, re) => {
      if (err) {
        return callback(vlog.ee(err, 'aggregate.toArray'));
      }
      callback(null, re);
    });
  });
};


const query = (coll) => (q, options, callback) => {
  // console.log('q:%j,options:%j,', q, options);
  if (!options && callback) {
    options = { 'limit': 20 };
  } else if ('function' === typeof options) {
    callback = options;
    options = { 'limit': 20 };
  }
  if (!options.limit) {
    options.limit = 20;
  }
  coll.find(q, options).toArray(function(err, docs) {
    if (err) {
      return callback(vlog.ee(err, 'mongo.query', q, options));
    }
    return callback(null, docs);
  });
};

const pQuery = (coll) => (q, options) => {
  return new Promise((resolve, reject) => {
    query(coll)(q, options, (e, re) => {
      if (e) {
        reject(vlog.ee(e, 'pQuery', q, options));
        return;
      }
      resolve(re);
    });
  });
};

const pLogToDb = (coll) => (logObj) => {
  return new Promise((resolve, reject) => {
    logToDb(coll)(logObj, (e, re) => {
      if (e) {
        reject(vlog.ee(e, 'pLogToDb', logObj));
        return;
      }
      resolve(re);
    });
  });
};

const pAggr = (coll) => (q, options) => {
  return new Promise((resolve, reject) => {
    aggr(coll)(q, options, (e, re) => {
      if (e) {
        reject(vlog.ee(e, 'pAggr', q, options));
        return;
      }
      resolve(re);
    });
  });
};

const newObjectId = () => new mongodb.ObjectID();

/*
如果是objectId的string，则进行转化，否则作为纯数字返回
 */
const idObj = (idHex) => {
  if (idHex instanceof mongodb.ObjectID) {
    return idHex;
  }
  if (isNaN(idHex)) {
    try {
      return mongodb.ObjectID.createFromHexString(idHex);
    } catch (e) {
      console.error('=====> ERR-idObj-createFromHexString:[' + idHex + ']');
      return null;
    }
  } else {
    return parseInt(idHex);
  }
};

//-------------------- 新自定义方法结束 --------------------

//为支持多配置多数据库对象的情况，按配置做成map
const helperMap = {};
const addHelper = function(configName, helper) {
  helper.collectionCache = {};
  helperMap[configName] = helper;
};
const getHelper = function(configName) {
  const helper = helperMap[configName];
  if (!helper) {
    throw new Error('======> mongo: configName error,can not get helper! configName:' + configName);
  }
  return helper;
};

const clearCollCache = (collectionCache) => {
  for (const i in collectionCache) {
    collectionCache[i] = undefined;
  }
};


const initClient = (configName, callback) => {
  const configObj = kconfig.get('mongo', configName);
  if (!configObj) {
    return callback(vlog.ee(new Error('init'), 'config have no mongo node'));
  }
  const dbName = configObj['s$_mongoDbName'];
  const mongoUrl = configObj['s$_mongoUrl'];
  const options = configObj['s$_options'] || { 'useNewUrlParser': true, 'authSource': dbName, 'useUnifiedTopology': true };
  // options.reconnectTries = Number.MAX_VALUE;
  if (!dbName || !mongoUrl) {
    return callback(vlog.ee(new Error('init'), 'mongodb read config from config.json failed.'));
  }
  mongo.connect(mongoUrl, options, (err, client) => {
    if (err) {
      callback(vlog.ee(err, 'initClient:connect:', dbName));
      return;
    }
    if (!client.isConnected) {
      callback(vlog.ee(new Error('mongo db'), 'initClient:isConnected:', dbName));
      return;
    }
    const database = client.db(dbName);
    database.stats((err, stats) => {
      if (err) {
        vlog.eo(err, 'initDB:db.stats');
        callback(vlog.ee(new Error('db'), 'initDB:mongo connected but db stats error.', stats));
        return;
      }
      // vlog.log('mongo stats:%j', stats);
      if (!stats || stats.ok !== 1) {
        vlog.error('mongo stats error %j', stats);
        callback(vlog.ee(new Error('db'), 'initDB:mongo stats error:', stats));
        return;
      }
      vlog.log('mongo init OK. [%s]', configName);
      callback(null, database);
    });
  });
};


const config = {
  'initClient': initClient,
  'appendToColl': {
    'query': query,
    'pQuery': pQuery,
    'aggr': aggr,
    'pAggr': pAggr,
    'pLogToDb': pLogToDb,
    'logToDb': logToDb,
  }
};


const helper = initHelper.create(config);
addHelper('default', helper);


//对于find之类返回cursor的操作，实际上是同步方法，需要转化为异步
const returnCursorMap = {
  'find': true
};

const dbGetColl = (helper, tableName, callback) => {
  helper.orgClient.collection(tableName, function(err, coll) {
    if (err) {
      callback(vlog.ee(err, 'getColl', tableName));
      return;
    }
    initHelper.appendFnToClient(config.appendToColl, coll);
    callback(null, coll);
    helper.collectionCache[tableName] = coll;
  });
};



const instance = function(newConfigName = 'default') {
  const me = {
    'configName':newConfigName,
  };

  me.close = (configName, callback = ktool.defaultCallback(null, __filename)) => {
    if ('function' === typeof configName) {
      callback = configName;
      configName = me.configName;
    }else if(!configName){
      configName = me.configName;
    }
    const helper = getHelper(configName);
    clearCollCache(helper.collectionCache);
    if (!helper.orgClient) {
      vlog.log('======> mongo db has logouted. [%s]', configName);
      return callback(null);
    }
    helper.orgClient.logout((e) => {
      if (e) {
        return vlog.eo(e, 'mongo close');
      }
      vlog.log('======> mongo db logout. [%s]', configName);
      callback(null);
    });
  };




  me.getColl = (tableName, configName, callback = ktool.defaultCallback(null, __filename)) => {
    if ('function' === typeof configName) {
      callback = configName;
      configName = me.configName;
    }else if(!configName){
      configName = me.configName;
    }
    const helper = getHelper(configName);
    const cl = helper.collectionCache[tableName];
    if (cl) {
      return callback(null, cl);
    }
    if (helper.orgClient) {
      dbGetColl(helper, tableName, callback);
      return;
    }
    helper.init(false, configName, (err) => {
      if (err) {
        callback(vlog.ee(err, 'getColl:helper.init', tableName));
        return;
      }
      dbGetColl(helper, tableName, callback);
    });
  };



  /*
  通过Proxy拦截coll的请求，自动初始化并包装成类似同步的方法来执行具体要对coll执行的方法,注意find方法与原生驱动有所区别
   checkColl('user').find({ 'phone': '153011112222' }, (e, cur) => {
     if (e) {
       return vlog.eo(e);
     }
     cur.toArray((e, re2) => console.log(e, re2));
   });
   */
  me.c = (tableName, configName) => {
    return new Proxy({}, {
      get(target, action) {
        // console.log('action:%s', action, tableName, configName);
        return (...paras) => {
          me.getColl(tableName, configName || me.configName, (e, coll) => {
            if (e) {
              return vlog.eo(e, 'checkColl');
            }
            // console.log('paras:%j ', paras[0]);
            const cursorReturn = returnCursorMap[action];
            if (!cursorReturn) {
              coll[action].apply(coll, paras);
              return;
            }
            //对于find等同步方法，需要特殊处理
            const pLen = paras.length;
            if (pLen > 1 && ('function' === typeof paras[pLen - 1])) {
              const callback = paras.pop();
              return callback(null, coll[action].apply(coll, paras));
            }
            vlog.eo(new Error(`cursorReturn error paras ${action}`), 'mongo:checkColl', tableName, paras);
          });
        };
      }
    });
  };

  /*
  同checkColl，但返回的是Promise对象
   */
  me.pc = (tableName, configName) => {
    return new Proxy({}, {
      get(target, action) {
        // console.log('action:%s', action, tableName, configName);
        return (...paras) => {
          return new Promise((resolve, reject) => {
            me.getColl(tableName, configName || me.configName, (e, coll) => {
              if (e) {
                reject(vlog.eo(e, 'pCheckColl'));
                return;
              }
              // console.log('paras:%j ', paras);
              resolve(coll[action].apply(coll, paras));
            });
          });

        };
      }
    });
  };

  me.getDb = function(configName, callback) {
    if ('function' === typeof configName) {
      callback = configName;
      configName = me.configName;
    }
    return getHelper(configName || me.configName).getClient(callback);
  };


  //用于进程启动时确认相关index是否创建
  //如:
  // checkIndex(fangcmGameTable, {
  //   'createTime_-1': { 'createTime': -1 },
  //   'game_user_name_-1': { 'game_user_name': -1 },
  //   'game_user_pwd_-1': { 'game_user_pwd': -1 },
  //   'game_id_-1': { 'game_id': -1 },
  // });
  me.checkIndex = function(tableName, newIndexes, isFirst, configName) {
    if (isFirst) {
      // vlog.log('first create indexes');
      for (const i in newIndexes) {
        const targetIndex = newIndexes[i];
        me.c(tableName).createIndex(targetIndex);
        vlog.log('[%s] index created: %j', tableName, targetIndex);
      }
      return;
    }
    if (!configName) {
      configName = me.configName;
    }
    me.c(tableName, configName).indexes((err, indexRe) => {
      if (err) {
        vlog.eo(err, 'checkIndex');
        //一般是未创建表,这里直接使用首次创建模式
        me.checkIndex(tableName, newIndexes, true, configName);
        return;
      }
      // vlog.log('org indexes:%j',indexRe);
      for (let i = 0, len = indexRe.length; i < len; i++) {
        const indexOne = indexRe[i];
        if (newIndexes[indexOne.name]) {
          delete newIndexes[indexOne.name];
        }
      }
      for (const i in newIndexes) {
        const targetIndex = newIndexes[i];
        me.c(tableName, configName).createIndex(targetIndex);
        vlog.log('[%s] index created: %j', tableName, targetIndex);
      }
    });
  };
  me.newObjectId = newObjectId;
  me.idObj = idObj;
  return me;
};


const reInit = (isForce, customConfigName = 'default', callback) => {
  kconfig.reInit(isForce);
  let helper = helperMap[customConfigName];
  if (!helper) {
    helper = initHelper.create(config);
    addHelper(customConfigName, helper);
  }
  helper.init(isForce, customConfigName, callback);
  return instance(customConfigName);
};

const init = (callback) => reInit(false, 'default', callback);

exports.init = init;
exports.reInit = reInit;
exports.newObjectId = newObjectId;
exports.idObj = idObj;
