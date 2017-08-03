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
const collectionCache = {};
let db;



//-------------------- 新自定义方法 --------------------

const logToDb = (coll) => (logObj, callback = ktool.defaultCallback) => {
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


const query = (coll) => (q, options, callback) => {
  // console.log('q:%j,options:%j,', q, options);
  if (!options && callback) {
    options = { 'limit': 20 };
  } else if ('function' === typeof options) {
    callback = options;
    options = { 'limit': 20 };
  }
  coll.find(q, options).toArray(function(err, docs) {
    if (err) {
      return callback(vlog.ee(err, 'mongo.query', q, options));
    }
    return callback(null, docs);
  });
};


const newObjectId = () => new mongodb.ObjectID();

/*
如果是objectId的string，则进行转化，否则作为纯数字返回
 */
const idObj = (idHex) => {
  if (isNaN(idHex)) {
    return mongodb.ObjectID.createFromHexString(idHex);
  } else {
    return parseInt(idHex);
  }
};


//-------------------- 新自定义方法结束 --------------------


const clearCollCache = () => {
  for (const i in collectionCache) {
    delete collectionCache[i];
  }
};

const close = (callback = ktool.defaultCallback) => {
  clearCollCache();
  if (!db) {
    vlog.log('======> mongo db has logouted...');
    return callback(null);
  }
  db.logout((e) => {
    if (e) {
      return vlog.eo(e, 'mongo close');
    }
    vlog.log('======> mongo db logout...');
    callback(null);
  });
};


const dbGetColl = (tableName, callback) => {
  db.collection(tableName, function(err, coll) {
    if (err) {
      callback(vlog.ee(err, 'getColl', tableName));
      return;
    }
    initHelper.appendFnToClient(config.appendFn, coll);
    // console.log('dbGetColl:%j', tableName);
    callback(null, coll);
    collectionCache[tableName] = coll;
  });
};



const getColl = (tableName, callback = (err) => (err) ? vlog.eo(err, 'getColl', tableName) : null) => {
  const cl = collectionCache[tableName];
  if (cl) {
    return callback(null, cl);
  }
  if (db) {
    dbGetColl(tableName, callback);
    return;
  }
  helper.init(false, (err) => {
    if (err) {
      callback(vlog.ee(err, 'getColl:helper.init', tableName));
      return;
    }
    dbGetColl(tableName, callback);
  });
};


const initClient = (callback) => {
  const configObj = kconfig.get('mongo');
  const dbName = configObj['s!_mongoDbName'];
  const mongoUrl = configObj['s!_mongoUrl'];
  const options = configObj['s!_options'] || {};
  options.server = { reconnectTries: Number.MAX_VALUE };
  if (!dbName || !mongoUrl) {
    return callback(vlog.ee(new Error('init'), 'mongodb read config from config.json failed.'));
  }
  mongo.connect(mongoUrl, options, (err, database) => {
    if (err) {
      callback(vlog.ee(new Error('mongo db'), 'initClient:connect:', dbName));
      return;
    }
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
      db = database;
      vlog.log('mongo init OK.');
      callback(null, db);
    });
  });
};



const config = {
  'initClient': initClient,
  'appendFn': {
    'query': query,
    'logToDb': logToDb,
  }
};


const helper = initHelper.create(config);


//对于find之类返回cursor的操作，实际上是同步方法，需要转化为异步
const returnCursorMap = {
  'find': true
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
const checkColl = (tableName) => {
  return new Proxy({}, {
    get(target, action) {
      // console.log('action:%s', action);
      return (...paras) => {
        getColl(tableName, (e, coll) => {
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



const reInit = (isForce, callback) => {
  kconfig.reInit(isForce);
  helper.init(isForce, callback);
  return this;
};

const init = (callback) => reInit(false, callback);

exports.init = init;
exports.reInit = reInit;
exports.close = close;
exports.getColl = getColl;
exports.getDb = helper.getClient;
exports.newObjectId = newObjectId;
exports.idObj = idObj;
exports.c = checkColl;