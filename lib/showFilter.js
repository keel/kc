/*
基于内存,使用cache方式转换某些字段的显示,比如把productId显示成productName等

初始化:
const cacheConfigArr = [{
  'tableName': 'cp',
  'cacheKeyArr': ['_id'],
  'options': {'limit':2000}
}, {
  'tableName': 'product',
  'cacheKeyArr': ['_id', 'key', 'ismpPid'],
  'options': {'limit':2000}
},{
  'tableName': 'spProduct',
  'cacheKeyArr': ['ismpPid'],
  'options': {'limit':2000}
}];
showFilter.init(cacheConfigArr);

使用:
resp.send(render.complaintRatio({
  'userLevel': req.userLevel,
  'userName': showFilter.convertOne('cp:_id', req.userId, 'name')
}));

或:
var respObj = (req.body.fm) ? showFilter.convert(req.body.fm, re) : re;
 */
'use strict';

const mongo = require('./mongo');
const vlog = require('vlog').instance(__filename);
const cck = require('cck');
const ktool = require('ktool');

const cacheData = {};

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
  const cacheObj = cacheData[keyPre + ':' + val];
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

const setCache = function(keyPre, value, cacheObj) {
  cacheData[keyPre + ':' + value] = cacheObj;
};
/**
 * 从数据库获取数据
 * @param  {Array}   cacheKeyArr 如[_id,pid]
 * @param  {string}   tableName
 * @param  {object}   query
 * @param  {object}   options
 * @param  {} callback
 * @return {}
 */
const fetchData = function(cacheKeyArr, tableName, query, options, callback) {
  const db = mongo.init();
  db.c(tableName).query(query, options, function(err, reArr) {
    if (err) {
      return callback(vlog.ee(err, 'fetchData', tableName));
    }
    if (!reArr) {
      vlog.error('fetchData get nothing:%j', tableName);
      return callback(null, 'ok');
    }
    const len = reArr.length;
    for (let i = 0; i < len; i++) {
      const reObj = reArr[i];
      for (let j = 0; j < cacheKeyArr.length; j++) {
        const keyPre = cacheKeyArr[j];
        if (!reObj.hasOwnProperty(keyPre)) {
          vlog.ee(new Error('fetchData dbObj do not have prop'), keyPre, reObj);
          continue;
          // return callback(vlog.ee(null,'fetchData dbObj do not have prop',keyPre,reObj));
        }
        setCache(tableName + ':' + keyPre, reObj[keyPre], reObj);
      }
    }
    vlog.log('showFilter load %s: %j ok.', tableName, cacheKeyArr);
    callback(null, 'ok');
  });
};

/**
 * 递归载入缓存数据
 * @param  {Array}   configArr
 * @param  {Function} callback
 * @return {}
 */
const load = function(configArr, callback) {
  if (!configArr || configArr.length < 1) {
    return callback(null, 'ok');
  }
  const config = configArr.shift();
  const tableName = config.tableName;
  if (!cck.isNotNull(tableName)) {
    return callback(vlog.ee('load', configArr));
  }
  const cacheKeyArr = config.cacheKeyArr;
  const query = config.query || {};
  const options = config.options || {};
  fetchData(cacheKeyArr, tableName, query, options, function(err) {
    if (err) {
      return callback(vlog.ee(err, 'load:fetchData'));
    }
    load(configArr, callback);
  });
};

const init = function(cacheConfigArr, callback) {
  const tempConfigArr = cacheConfigArr.slice(0);
  load(tempConfigArr, function(err) {
    if (err) {
      vlog.eo(err, 'init');
      return;
    }
    vlog.log('showFilter load cache done. %j', new Date());
    if (callback) {
      callback(null, 'ok');
    }
  });
};

exports.init = init;
exports.convert = convert;
exports.convertOne = convertOne;

// const cacheConfigArr = [{
//   'tableName': 'cp',
//   'cacheKeyArr': ['_id'],
//   'options': { 'limit': 2000 }
// }, {
//   'tableName': 'product',
//   'cacheKeyArr': ['_id', 'key', 'ismpPid'],
//   'options': { 'limit': 2000 }
// }, {
//   'tableName': 'spProduct',
//   'cacheKeyArr': ['ismpPid'],
//   'options': { 'limit': 2000 }
// }, {
//   'tableName': 'channel',
//   'cacheKeyArr': ['_id'],
//   'options': { 'limit': 2000 }
// }, {
//   'tableName': 'monthCallback',
//   'cacheKeyArr': ['productID'],
//   'options': { 'limit': 2000 }
// }];
// init(cacheConfigArr);

