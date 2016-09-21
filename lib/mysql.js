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




exports.init = init;
exports.end = end;
exports.checkColl = checkColl;

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