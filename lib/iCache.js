/**
 * 用于缓存mongo的数据到mem或redis
 */
'use strict';
const ktool = require('ktool');
const cck = require('cck');
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
      if (!options) {
        options = { limit: Number.MAX_SAFE_INTEGER };
      }else if (!options.limit) {
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

const cacheByKey = function(cacheObj, keyArr, docs, tableName, callback) {
  if (keyArr.length <= 0) {
    return callback();
  }
  const cacheKey = keyArr.pop();
  const sum = docs.length;
  let done = sum;
  if (sum <= 0) {
    vlog.log('cache [%s] ok. key: [%s] , sum: [%d]', tableName, cacheKey, sum);
    return cacheByKey(cacheObj, keyArr, docs, tableName, callback);
  }
  for (let i = 0; i < sum; i++) {
    const doc = docs[i];
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
        cacheByKey(cacheObj, keyArr, docs, tableName, callback);
      }
    });
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
    const keyArr = cacheKey.split(',');
    cacheByKey(cacheObj, keyArr, docs, tableName, callback);
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

const get = function (cacheType, key, callback) {
  const cacheObj = cacheTypeMap[cacheType];
  if (!cacheObj) {
    return callback(vlog.ee(new Error('cacheType or dbType error'), cacheType, key));
  }
  cacheObj.get(key, callback);
};

const getSync = function (key) {
  return cacheTypeMap.mem.getSync(key);
};

const getMemCache = function () {
  return memCacheMap;
};

const innerFn = {
  'msToTime': cck.msToTime,
  'timeToMS': cck.timeToMS,
  'msToTimeWithMs': cck.msToTimeWithMs
};

/**
 * 从{'keyPre:val',value},定位到cacheData['keyPre:val':value]
 * @param  {string} keyPre      表名:字段名
 * @param  {string} val         查找的目标表中匹配此字段的值
 * @param  {string/array} newPropName 需要转换后的的属性名,这里可以用数据来支持多个属性叠加(逗号分开)
 * @return {string}             cacheData中的对应值
 */
const convertOne = function(keyPre, val, newPropName) {
  if (cck.check(newPropName, 'array')) {
    let out = '';
    for (let i = 0; i < newPropName.length; i++) {
      out += ',' + convertOne(keyPre, val, newPropName[i]);
    }
    return out.length > 1 ? out.substring(1) : '';
  }
  if (newPropName[0] === '@') {
    return innerFn[newPropName.substring(1)](val);
  }
  const cacheObj = memCacheMap[keyPre + ':' + val];
  if (!cck.isNotNull(cacheObj)) {
    return val;
  }
  return cacheObj[newPropName];
};


/**
 * 将指定的属性转换为对应值,转换后原值另保存为_$prop,
 * 注意如果对象的指定属性不存在,则不会发生转换,
 * 如果对象指定属性在cache中找不到能转换的值,也不会发生转换;
 * 例子见本js末尾注释相关行;
 * @param  {object} convertKeyMap {'productID':['spProduct:ismpPid','name'],'createTime':['@FN','@msToTime']}
 * @param  {Array} dataArr
 * @return {Array}               转换后的dataArr
 */
const convert = function(convertKeyMap, dataArr) {
  const dataArrLen = dataArr.length;
  // vlog.log('convert from :%j',dataArr);
  for (let i = 0; i < dataArrLen; i++) {
    const oneData = dataArr[i];
    for (const p in convertKeyMap) {
      const fromToArr = convertKeyMap[p];
      if (!cck.check(fromToArr, 'array') || fromToArr.length !== 2) {
        vlog.error('convertKeyMap error:%j', convertKeyMap);
        return dataArr;
      }
      const subPropVal = ktool.json.getSubProp(oneData, p);
      if (subPropVal === null) {
        //对象的subProp不存在,这里做跳过处理
        continue;
      }
      const newVal = convertOne(fromToArr[0], subPropVal, fromToArr[1]);
      if (newVal === subPropVal) {
        //没有真正发生变化
        continue;
      }
      const pArr = p.split('.');
      const lastPArr = pArr[pArr.length - 1];
      pArr[pArr.length - 1] = '_$' + lastPArr;
      const oldP = pArr.join('.');
      // vlog.log('oldP:%j',oldP);
      ktool.json.setSubProp(oneData, oldP, subPropVal);
      ktool.json.setSubProp(oneData, p, newVal);
      // vlog.log('newVal:%j\noneData:%j', newVal, oneData);
    }
    // vlog.log('oneData:%j', oneData);
  }
  // vlog.log('convert to :%j',dataArr);
  return dataArr;
};


exports.getMemCache = getMemCache;
exports.getSync = getSync;
exports.get = get;
exports.cacheMake = cacheMake;
exports.cacheTable = cacheTable;
exports.convert = convert;
exports.convertOne = convertOne;