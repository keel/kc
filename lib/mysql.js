/*
 mysql数据库操作,支持集群,其中config部分参考https://github.com/mysqljs/mysql
 author:Keel
 */

'use strict';

var mysql = require('mysql');
var cck = require('cck');
var ktool = require('ktool');
var vlog = require('vlog').instance(__filename);
var kconfig = ktool.kconfig;
var iApi = require('./iApi');

var mysqlConf = null;
var pool = null;
var isCluster = false;
var defautClusterNode = '*';
var defautClusterSelector = 'RANDOM';

var init = function(configFile, callback) {
  kconfig.init(configFile);
  var clusterConf = kconfig.getConfig().mysqlCluster;
  if (clusterConf && clusterConf.config) {
    mysqlConf = clusterConf.config;
    isCluster = true;
  }
  callback = callback || function(err) {
    if (err) {
      vlog.eo(err, 'mysql:init', configFile);
    }
  };
  if (isCluster) {
    //集群
    pool = mysql.createPoolCluster();
    var hosts = [];
    for (var i in mysqlConf) {
      hosts.push(i + ':' + mysqlConf[i].host + ' db:' + mysqlConf[i].database);
      pool.add(i, mysqlConf[i]);
    }
    pool.getConnection(function(err, connection) {
      if (err) {
        return callback(vlog.ee(err, 'mysql cluster init getConnection'));
      }
      connection.release();
      vlog.log('mysql cluster init OK. %j', hosts);
      callback(null, mysqlConf.database);
    });
    return;
  }
  //非集群
  mysqlConf = kconfig.getConfig().mysql.config;
  pool = mysql.createPool(mysqlConf);
  pool.getConnection(function(err, connection) {
    if (err) {
      return callback(vlog.ee(err, 'mysql init getConnection'));
    }
    connection.release();
    vlog.log('mysql init OK. host:[%s], database:[%s]', mysqlConf.host, mysqlConf.database);
    callback(null, mysqlConf.database);
  });
};


var end = function() {
  if (pool) {
    pool.end(function(err) {
      if (err) {
        vlog.eo(err, 'mysql pool end');
        return;
      }
    });
  }
};

var checkColl = function(clusterNodeName, selector, callback) {
  if (!pool) {
    return callback(vlog.ee(null, 'mysql is not inited.'));
  }
  if (!isCluster && !selector && !callback) {
    //非集群时取第一个参数作为callback
    callback = clusterNodeName;
    pool.getConnection(function(err, connection) {
      if (err) {
        return callback(vlog.ee(err, 'mysql checkColl getConnection'));
      }
      return callback(null, connection);
    });
    return;
  }
  if (cck.check(clusterNodeName, 'function')) {
    //第一个参数可以省略,默认随机策略选择集群节点
    callback = clusterNodeName;
    clusterNodeName = defautClusterNode;
    selector = defautClusterSelector;
  } else if (cck.check(selector, 'function')) {
    //第二个参数可以省略,默认使用随机策略选择集群节点
    callback = selector;
    selector = defautClusterSelector;
  }
  pool.getConnection(clusterNodeName, selector, function(err, connection) {
    if (err) {
      return callback(vlog.ee(err, 'mysql checkColl getConnection'));
    }
    return callback(null, connection);
  });

};

/**
 * 创建一个基于存储过程的标准API.例:
 var increase = createProcApi('proc_point_change',apiKey, function(reqBody) {
   var opType = 1;
   var channel = reqBody.c;
   var appCode = reqBody.a;
   var reqData = reqBody.req;
   return [reqData.customerId,
     reqData.pointSeq, reqData.pointReqTranSeq, reqData.pointAmount, opType, reqData.addtype, reqData.attach || '',
     channel, appCode, reqData.payType, reqData.realAmount, 0, reqData.orderSeq || '', JSON.stringify(reqData)
   ];
 }, function(rows, reqBody) {
   var reObj = {
     'pointReqTranSeq': reqBody.req.pointReqTranSeq,
     'pointId': rows[0][0].pointLogId,
     'balance': rows[0][0].ubalance
   };
   var result = cck.check(rows[0][0].result, 'notNull') ? rows[0][0].result : error.err.callProcNoResult;
   return { 'reObj': reObj, 'result': result };
 });


 var iiConfig = {
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
 * @return {function}           能直接用于iiConfig的方法
 */
var createProcApi = function(procName, apiKeyIn, parasInFn, reObjFn) {

  var parasCount = parasInFn({ 'req': {} }).length;
  var sql = 'CALL ' + procName + '(';
  var poArr = [];
  for (var i = 0, len = parasCount; i < len; i++) {
    poArr.push('?');
  }
  sql = sql + poArr.join(',') + ')';

  var procDo = function(req, resp, callback) {
    var reqDataArr = iApi.parseApiReq(req.body, apiKeyIn);
    if (reqDataArr[0] !== 0) {
      return callback(vlog.ee(new Error('createProcApi'), 'createProcApi:kc iApi req error', reqDataArr), null, 200, reqDataArr[0]);
    }
    // var reqData = reqDataArr[1];
    // var channel = req.body.c;
    // var appCode = req.body.a;
    //TODO 这里需要确定集群服务器的选择
    mysql.checkColl(function(err, conn) {
      if (err) {
        conn.release();
        return callback(vlog.ee(err, 'createProcApi:' + procName + ':checkColl'), null, 200, 'checkColl');
      }
      conn.query(sql, parasInFn(req.body), function(err, rows, fields) {
        if (err) {
          return callback(vlog.ee(err, 'createProcApi:' + procName + ':call proc', procName), null, 200, 'callProc');
        }
        conn.release();
        // vlog.log('rows:%j', rows);
        // var reObj = {
        //   'pointReqTranSeq': reqData.pointReqTranSeq,
        //   'pointId': rows[0][0].pointLogId,
        //   'balance': rows[0][0].ubalance
        // };
        var procRe = reObjFn(rows, req.body, fields);
        //这里可约定存储过程结果中的第一条数据中必须有result值来指定返回的re值
        // var result = cck.check(rows[0][0].result, 'notNull') ? rows[0][0].result : error.err.callProcNoResult;
        var result = procRe.result;
        var reObj = procRe.reObj;
        /*
         * iApi.makeApiResp:创建resp的内容
         * @param  {int} errorCode      0为成功,其他为错误码
         * @param  {object} data   返回的数据,格式不限
         * @param  {string} apiKey 用于校验请求合法性的key
         * @return {json} 需要返回的json
         */
        var respObj = iApi.makeApiResp(result, JSON.stringify(reObj), apiKeyIn);
        //返回
        callback(null, respObj);
      });
    });
  };
  return procDo;

};


exports.init = init;
exports.end = end;
exports.checkColl = checkColl;
exports.createProcApi = createProcApi;


/*
var test = function(sql) {
  init('../config.json', function(err) {
    if (err) {
      vlog.eo(err, 'init');
      return;
    }
    checkColl(function(err, conn) {
      if (err) {
        vlog.eo(err, 'checkColl');
        return;
      }
      conn.query(sql, function(err, rows, fields) {
        if (err) {
          vlog.eo(err, 'query', sql);
          return;
        }
        vlog.log('rows:%j, fields:%j', rows, fields);
        conn.release();
      });
    });
  });
};
test('select * from test');
*/