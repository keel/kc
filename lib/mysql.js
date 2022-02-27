/*
mysql 按配置初始化并附加方法
author:Keel

 */
'use strict';
const mysql = require('mysql');
const ktool = require('ktool');
const iApi = require('./iApi');
const vlog = require('vlog').instance(__filename);
const initHelper = require('./initHelper');
const kconfig = ktool.kconfig;


const defautClusterNode = '*';
const defautClusterSelector = 'RR';


/**
 * 创建一个基于存储过程的标准API.例:
 const increase = createProcApi('proc_point_change',apiKey, function(reqBody) {
   const opType = 1;
   const channel = reqBody.c;
   const appCode = reqBody.a;
   const reqData = reqBody.req;
   return [reqData.customerId,
     reqData.pointSeq, reqData.pointReqTranSeq, reqData.pointAmount, opType, reqData.addtype, reqData.attach || '',
     channel, appCode, reqData.payType, reqData.realAmount, 0, reqData.orderSeq || '', JSON.stringify(reqData)
   ];
 }, function(rows, reqBody) {
   const reObj = {
     'pointReqTranSeq': reqBody.req.pointReqTranSeq,
     'pointId': rows[0][0].pointLogId,
     'balance': rows[0][0].ubalance
   };
   const result = cck.check(rows[0][0].result, 'notNull') ? rows[0][0].result : error.err.callProcNoResult;
   return { 'reObj': reObj, 'result': result };
 });


 const iiConfig = {
   'auth': false,
   'act': {
     'increase': {
       'validator': {
         'pointSeq': ['strLen', [1, 100]], //
         'pointReqTranSeq': ['strLen', [1, 100]],
         'pointAmount': 'int',
         'addtype': 'int',
         '@attach': ['strLen', [0, 1000]],
         'customerId': ['strLen', [1, 100]],
         'payType': 'int',
         'realAmount': 'int'
       },
       'resp': increase
     },
 * @param  {string} procName  存储过程名
 * @param  {string} apiKeyIn  apiKey
 * @param  {function} parasInFn 创建存储过程的输入参数
 * @param  {function} reObjFn   根据存储过程结果产生API输出
  * @param  {function} beforeProc   存储过程执行前的操作
  * @return {function}           能直接用于iiConfig的方法
  */
const createProcApi = function(procName, apiKeyIn, parasInFn, reObjFn, beforeProc, clusterNode, clusterSelector, configName) {

  const parasCount = parasInFn({ 'req': {} }).length;
  let sql = 'CALL ' + procName + '(';
  const poArr = [];
  for (let i = 0, len = parasCount; i < len; i++) {
    poArr.push('?');
  }
  sql = sql + poArr.join(',') + ')';

  const procDo = function(req, resp, callback) {
    const reqDataArr = iApi.parseApiReq(req.body, apiKeyIn);
    if (reqDataArr[0] !== 0) {
      return callback(vlog.ee(new Error('createProcApi'), 'createProcApi:kc iApi req error', reqDataArr), null, 200, reqDataArr[0]);
    }
    const procThis = function() {
      // const reqData = reqDataArr[1];
      // const channel = req.body.c;
      // const appCode = req.body.a;
      checkConn(clusterNode, clusterSelector, configName).query(sql, parasInFn(req.body), function(err, rows, fields) {
        if (err) {
          return callback(vlog.ee(err, 'createProcApi:' + procName + ':call proc', procName), null, 200, 'callProc');
        }
        // vlog.log('rows:%j', rows);
        // const reObj = {
        //   'pointReqTranSeq': reqData.pointReqTranSeq,
        //   'pointId': rows[0][0].pointLogId,
        //   'balance': rows[0][0].ubalance
        // };
        const procRe = reObjFn(rows, req.body, fields);
        //这里可约定存储过程结果中的第一条数据中必须有result值来指定返回的re值
        // const result = cck.check(rows[0][0].result, 'notNull') ? rows[0][0].result : error.err.callProcNoResult;
        const result = procRe.result;
        const reObj = procRe.reObj;
        /*
         * iApi.makeApiResp:创建resp的内容
         * @param  {int} errorCode      0为成功,其他为错误码
         * @param  {object} data   返回的数据,格式不限
         * @param  {string} apiKey 用于校验请求合法性的key
         * @return {json} 需要返回的json
         */
        const respObj = iApi.makeApiResp(result, JSON.stringify(reObj), apiKeyIn);
        //返回
        callback(null, respObj);
      });
    };

    //在处理过程之前是否有事件
    if (beforeProc) {
      beforeProc(req, reqDataArr[1], function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'procDo:beforeProc'));
        }
        //beforeProc可以中断执行
        if (re[0] !== 0) {
          const respObj = iApi.makeApiResp(re[0], re[1], apiKeyIn);
          //返回
          return callback(null, respObj);
        }
        procThis();

      });
      return;
    }
    procThis();
  };
  return procDo;

};

const close = (configName = 'default', callback = ktool.defaultCallback(null, __filename)) => {
  if ('function' === typeof configName) {
    callback = configName;
    configName = 'default';
  }
  const helper = getHelper(configName);
  if (!helper.orgClient) {
    vlog.log('======> mysql has logouted. [%s]', configName);
    return callback(null);
  }
  helper.orgClient.end((e) => {
    if (e) {
      return vlog.eo(e, 'mysql end');
    }
    vlog.log('======> mysql pool end. [%s]', configName);
    callback(null);
  });
};

const dbGetConn = function dbGetConn(helper, clusterNode, clusterSelector, callback) {
  if (!kconfig.get('mysql.isCluster', helper.configName)) {
    helper.orgClient.getConnection(callback);
    return;
  }
  clusterNode = clusterNode || defautClusterNode;
  clusterSelector = clusterSelector || defautClusterSelector;
  helper.orgClient.getConnection(clusterNode, clusterSelector, callback);
};

const getConn = (helper, clusterNode, clusterSelector, callback) => {
  if (helper.orgClient) {
    dbGetConn(helper, clusterNode, clusterSelector, callback);
    return;
  }
  helper.init(false, helper.configName, (err) => {
    if (err) {
      vlog.eo(err, 'getConn:helper.init');
      return;
    }
    dbGetConn(clusterNode, clusterSelector, callback);
  });
};

const getServerOneConfig = function getServerOneConfig(serverOne) {
  const serverOneConf = {};
  for (const j in serverOne) {
    if (j.startsWith('s$_')) {
      serverOneConf[j.substring(3)] = serverOne[j];
    } else {
      serverOneConf[j] = serverOne[j];
    }
  }
  return serverOneConf;
};

const initClient = (configName, callback) => {
  const configObj = kconfig.get('mysql', configName);
  const isCluster = configObj['s$_isCluster'];
  if (!isCluster) {
    const serverOneConf = getServerOneConfig(configObj.server);
    // console.log('serverOneConf1:%j',serverOneConf);
    const pool = mysql.createPool(serverOneConf);
    vlog.log('mysql init OK. [%s]', configName);
    return callback(null, pool);
  }
  const pool = mysql.createPoolCluster();
  const hosts = [];
  for (const i in configObj.servers) {
    const serverOne = (configObj.servers)[i];
    const serverOneConf = getServerOneConfig(serverOne);
    // console.log('serverOneConf2:%j',serverOneConf);
    hosts.push(i + ':' + serverOneConf.host + ' db:' + serverOneConf.database);
    pool.add(i, serverOneConf);
  }
  vlog.log('mysql cluster init OK. [%s]', configName);
  callback(null, pool);
};


const pCheckConn = (clusterNode, clusterSelector, configName = 'default') => {
  const helper = getHelper(configName);
  return new Proxy({}, {
    get(target, action) {
      return (...paras) => {
        return new Promise((resolve, reject) => {
          getConn(helper, clusterNode, clusterSelector, (err, conn) => {
            if (err) {
              reject(vlog.eo(err, 'pCheckConn.' + action));
              return;
            }
            const pLen = paras.length;
            let orgCallback = null;
            if (pLen > 1 && ('function' === typeof paras[pLen - 1])) {
              orgCallback = paras[pLen - 1];
            }
            //手动包装最后一个callback，注入conn.release操作,所以客户端不用再release
            const callback = (err, results, fields) => {
              conn.release();
              if (orgCallback) {
                orgCallback(err, results, fields);
                return;
              }
              if (err) {
                reject(vlog.eo(err, 'pCheckConn.' + action));
                return;
              }
              resolve(results, fields);
            };
            if (orgCallback) {
              paras[pLen - 1] = callback;
            } else {
              paras.push(callback);
            }
            // console.log('paras:%s, orgCallback:%s', paras, orgCallback);
            conn[action].apply(conn, paras);
          });
        });
      };
    }
  });
};

const checkConn = (clusterNode, clusterSelector, configName = 'default') => {
  const helper = getHelper(configName);
  return new Proxy({}, {
    get(target, action) {
      return (...paras) => {
        getConn(helper, clusterNode, clusterSelector, (err, conn) => {
          if (err) {
            return vlog.eo(err, 'checkConn');
          }
          const pLen = paras.length;
          let orgCallback = null;
          if (pLen > 1 && ('function' === typeof paras[pLen - 1])) {
            orgCallback = paras[pLen - 1];
          }
          //手动包装最后一个callback，注入conn.release操作,所以客户端不用再release
          const callback = (err, results, fields) => {
            conn.release();
            // console.log('conn released.');
            if (orgCallback) {
              orgCallback(err, results, fields);
            }
          };
          if (orgCallback) {
            paras[pLen - 1] = callback;
          } else {
            paras.push(callback);
          }
          // console.log('paras:%s, orgCallback:%s', paras, orgCallback);
          conn[action].apply(conn, paras);
        });
      };
    }
  });
};

const config = {
  'initClient': initClient
};

//为支持多配置多数据库对象的情况，按配置做成map
const helperMap = {};
const addHelper = function addHelper(configName, helper) {
  helperMap[configName] = helper;
};
const getHelper = function getHelper(configName) {
  const helper = helperMap[configName];
  if (!helper) {
    throw new Error('======> mongo: configName error,can not get helper! configName:' + configName);
  }
  return helper;
};


const helper = initHelper.create(config);
addHelper('default', helper);

const pool = function pool(configName = 'default', callback) {
  if ('function' === typeof configName) {
    callback = configName;
    configName = 'default';
  }
  return getHelper(configName).getClient(configName, callback);
};

const reInit = (isForce, customConfigName = 'default', callback) => {
  kconfig.reInit(isForce);
  let helper = helperMap[customConfigName];
  if (!helper) {
    helper = initHelper.create(config);
    addHelper(customConfigName, helper);
  }
  helper.init(isForce, customConfigName, callback);
  return this;
};

const init = (callback) => reInit(false, 'default', callback);

const escape = function(val) {
  return mysql.escape(val).replace(/'/g, '');
};

exports.c = checkConn;
exports.pc = pCheckConn;
exports.pool = pool;
exports.init = init;
exports.reInit = reInit;
exports.close = close;
exports.createProcApi = createProcApi;
exports.escape = escape;