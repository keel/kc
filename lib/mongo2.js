/*
mongo按配置初始化并附加方法
author:Keel
 */
'use strict';

const mongodb = require('mongodb');
const ktool = require('ktool');
const vlog = require('vlog').instance(__filename);
const initHelper = require('./initHelper');

const kconfig = ktool.kconfig;

const mongo = mongodb.MongoClient;
let db;


const close = (callback) => {
  if (db) {
    db.logout(callback);
    vlog.log('mongo db logout...');
  }
  db = null;
};

const colls = {};

const dbGetColl = (tableName, callback) => {
  db.collection(tableName, function(err, coll) {
    if (err) {
      callback(vlog.ee(err, 'getColl', tableName));
      return;
    }
    initHelper.appendFnToClient(config.appendFn, coll);
    // console.log('dbGetColl:%j', tableName);
    callback(null, coll);
    colls[tableName] = coll;
  });
};



const getColl = (tableName, callback = (err) => (err) ? vlog.eo(err, 'getColl', tableName) : null) => {
  const cl = colls[tableName];

  if (cl) {
    return callback(null, cl);
  }
  if (db) {
    dbGetColl(tableName, callback);
    return;
  }
  config.initClient(kconfig.getConfig(), (err) => {
    if (err) {
      callback(vlog.ee(err, 'getColl:initClient', tableName));
      return;
    }
    dbGetColl(tableName, callback);
  });
};



const initClient = (callback) => {
  const configObj = kconfig.getConfig().mongo;
  const dbName = configObj.mongoDbName;
  const mongoUrl = configObj.mongoUrl;
  const options = configObj.options || { 'server': { reconnectTries: Number.MAX_VALUE } };
  if (!dbName || !mongoUrl) {
    return callback(vlog.ee(new Error('init'), 'mongodb read config from config.json failed.'));
  }
  mongo.connect(mongoUrl, options, (err, database) => {
    // assert.equal(null, err);
    if (err) {
      callback(vlog.ee(new Error('mongo db'), 'initClient:connect:', mongoUrl, dbName));
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
      // vlog.log('mongo inited OK.');
      callback(null, db);
    });
  });
};


const query = (coll) => (q, options, callback) => {
  // console.log('q:%j,options:%j,', q, options);
  if (!options && callback) {
    options = { 'limit': 20 };
  }else if('function' === typeof options){
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

const config = {
  'name': 'mongodb',
  'close': close,
  'initClient': initClient,
  'appendFn': {
    'query': query
  }
};


const helper = initHelper.create(config);

//用于缓存initHelper的getClient方法,使用时用()即可获取，将对象为null的错误转化为未初始化的错误
// let getClient = null;

//mongo.checkColl('user').find( { 'name': 'keel' }, (err, re) => console.log(err, re));


//对于find之类返回cursor的操作，实际上是同步方法，需要转化为异步
const returnCursorMap = {
  'find': true
};

const checkColl = (tableName) => {
  return new Proxy({}, {
    get(target, action) {
      // console.log('action:%s', action);
      return (...paras) => {
        getColl(tableName, (e, coll) => {
          if (e) {
            return vlog.eo(e);
          }
          // console.log('paras:%j ', paras[0]);
          const cursorReturn = returnCursorMap[action];
          if (cursorReturn) {
            const pLen = paras.length;
            if (pLen > 1 && ('function' === typeof paras[pLen - 1])) {
              const callback = paras.pop();
              return callback(null, coll[action].apply(coll, paras));
            }
            vlog.eo(new Error(`cursorReturn error paras ${action}`), 'mongo:checkColl', tableName, paras);
            return;
          }
          coll[action].apply(coll, paras);
        });
      };
    }
  });
};

const reInit = (configFile, isForce, callback) => {
  kconfig.init(configFile, isForce);
  return helper.init(callback);
};

const init = (configFile, callback) => reInit(configFile, false, callback);

exports.init = init;
exports.reInit = reInit;
exports.helper = helper;
exports.getColl = getColl;
exports.c = checkColl;
