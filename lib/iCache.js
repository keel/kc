/**
 * 用于缓存mongo的数据到mem或redis
 */
'use strict';
const ktool = require('ktool');
const vlog = require('vlog').instance(__filename);

const memCacheMap = {};
const dbMap = {
  'redis': null,
  'mongo': null,
  'mysql': null
};

const cacheTypeMap = {
  'redis': {
    'dbName': 'redis',
    'set': (key, val, callback) => dbMap.redis.hmset(key, val, callback),
    'get': (key, callback) => dbMap.redis.hgetall(key, callback),
    'isInit': false
  },
  'mem': {
    'set': (key, val, callback) => {
      memCacheMap[key] = val;
      callback(null);
    },
    'get': (key, callback) => callback(null, memCacheMap[key]),
    'getSync': key => memCacheMap[key],
    'isInit': true
  }
};

const dbTypeMap = {
  'mongo': {
    'fetchData': (tableName, query, options, callback) => {
      if (!options.limit) {
        options.limit = Number.MAX_SAFE_INTEGER;
      }
      dbMap.mongo.c(tableName).query(query, options, callback);
    },
    'dbName': 'mongo',
    'isInit': false
  },
  'mysql': {
    'fetchData': (tableName, query, options, callback) => dbMap.mysql.c().query(query, options, callback),
    'dbName': 'mysql',
    'isInit': false
  }
};

const cacheTable = function(cacheType, dbType, tableName, cacheKey, query = {}, options = {}, callback = ktool.defaultCallback) {
  const cacheObj = cacheTypeMap[cacheType];
  const dbObj = dbTypeMap[dbType];
  if (cacheObj === undefined || dbObj === undefined) {
    return callback(vlog.ee(new Error('cacheType or dbType error'), cacheType, dbType, tableName, cacheKey));
  }
  if (!cacheObj.isInit) {
    dbMap[cacheObj.dbName] = require('./' + cacheObj.dbName).init();
    cacheObj.isInit = true;
  }
  if (!dbObj.isInit) {
    dbMap[dbObj.dbName] = require('./' + dbObj.dbName).init();
    dbObj.isInit = true;
  }
  dbObj.fetchData(tableName, query, options, (err, docs) => {
    if (err) {
      vlog.eo(err, 'cacheTable:find:' + JSON.stringify(query));
      return callback(vlog.ee(err, 'cacheTable:find:' + JSON.stringify(query)));
    }
    const sum = docs.length;
    if (sum <= 0) {
      vlog.log('cache [%s] ok. key: [%s] , sum: [%d]', tableName, cacheKey, sum);
      return callback(null);
    }
    // vlog.log('sum:%d,tableName:%s,cacheKey:%s,query:%j,options:%j',sum,tableName,cacheKey,query,options);
    let done = sum;
    docs.forEach(doc => {
      for (const i in doc) {
        doc[i] = doc[i] + '';
      }
      cacheObj.set(tableName + ':' + cacheKey + ':' + doc[cacheKey], doc, err => {
        done--;
        if (err) {
          return callback(vlog.ee(err, 'cacheTable:hmset:' + 'cacheTable error!' + tableName + ':' + cacheKey + ':' + doc[cacheKey] + ',id:' + doc._id));
        }
        // vlog.log('done:%d',done);
        if (done <= 0) {
          vlog.log('cache [%s] ok. key: [%s] , sum: [%d]', tableName, cacheKey, sum);
          callback(null);
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
const cacheMake = function(cacheType, dbType, tableParasArr, callback) {
  if (tableParasArr.length === 0) {
    callback(null);
    return;
  }
  const tableParas = tableParasArr.pop();
  const arr = tableParas.split('#');
  if (arr.length < 2) {
    callback(vlog.ee(new Error('db'), 'tableParas error:' + tableParas));
    return;
  }
  const tableName = arr[0];
  const key = arr[1];
  const query = (arr.length >= 3) ? JSON.parse(arr[2]) : {};
  const options = (arr.length >= 4) ? JSON.parse(arr[3]) : {};
  // vlog.log('tableName:%s,key:%s,query:%j,options:%j',tableName,key,query,options);
  cacheTable(cacheType, dbType, tableName, key, query, options, function(err) {
    if (err) {
      return callback(vlog.ee(err, 'cacheMake:cacheTable:' + JSON.stringify(tableParasArr)));
    }
    cacheMake(cacheType, dbType, tableParasArr, callback);
  });
};

const get = function get(cacheType, key, callback) {
  const cacheObj = cacheTypeMap[cacheType];
  if (!cacheObj) {
    return callback(vlog.ee(new Error('cacheType or dbType error'), cacheType, key));
  }
  cacheObj.get(key, callback);
};

const getSync = function getSync(key) {
  return cacheTypeMap.mem.get(key);
};


exports.getSync = getSync;
exports.get = get;
exports.cacheMake = cacheMake;
exports.cacheTable = cacheTable;