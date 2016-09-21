/*
redis缓存操作
author:Keel

 */
'use strict';

var redis = require('redis');
var redisClient = null;
var ktool = require('ktool');

var vlog = require('vlog').instance(__filename);

var kconfig = ktool.kconfig;

var init = function(configFile, callback) {
  kconfig.init(configFile);
  callback = callback || function(err, redisIP, redisPort) {
    if (err) {
      vlog.eo(err, 'redis:init', configFile);
      return;
    }
    vlog.log('redis init OK:[%s] [%d]', redisIP, redisPort);
  };
  initRedis(callback);
};

/**
 * 初始化，以redis数据为准redis无法连接时使用config.json的数据
 * @param  {Function} callback
 * @return {}
 */
var initRedis = function(callback) {

  //先读本地配置，取redis地址
  if (redisClient) {
    redisClient.quit();
  }

  var redisIP = kconfig.getConfig().redis.redisIP;
  var redisPort = kconfig.getConfig().redis.redisPort;
  if (!redisIP || !redisPort) {
    return callback(vlog.ee(new Error('init'), 'redis read ip and port from config.json failed.'));
  }
  // vlog.log('redis will init:[%s] [%d]', redisIP, redisPort);
  redisClient = redis.createClient(redisPort, redisIP);
  redisClient.on('error', function(err) {
    vlog.eo(new Error('init'), 'redis init err');
    redisClient = null;
    callback(vlog.ee(err, 'init'));
    return;
  });
  redisClient.on('connect', function() {
    callback(null, redisIP, redisPort);
    return;
  });

};


var checkClient = function(callback) {
  if (!redisClient) {
    initRedis(function(err) {
      if (err) {
        callback(vlog.ee(err, 'checkClient'));
        return;
      } else {
        callback(null, redisClient);
      }
    });
  } else {
    callback(null, redisClient);
  }
};



var set = function(cacheKey, value, expireSec, callback) {
  checkClient(function(err, client) {
    if (err) {
      return callback(err);
    }
    client.set(cacheKey, value, function(err, re) {
      if (err) {
        return callback(err);
      }
      callback(null, re);
      if (expireSec) {
        client.expire(cacheKey, expireSec);
      }
    });
  });
};

var get = function(cacheKey, callback) {
  checkClient(function(err, client) {
    if (err) {
      return callback(err);
    }
    client.get(cacheKey, function(err, re) {
      if (err) {
        return callback(err);
      }
      return callback(null, re);
    });
  });
};

var del = function(cacheKey, callback) {
  checkClient(function(err, client) {
    if (err) {
      return callback(err);
    }
    client.del(cacheKey, function(err, re) {
      if (err) {
        return callback(err);
      }
      return callback(null, re);
    });
  });
};

var makeIncrId = function(cacheKey, callback) {
  checkClient(function(err, client) {
    if (err) {
      return callback(err);
    }
    client.incr(cacheKey, function(err, re) {
      if (err) {
        return callback(err);
      }
      return callback(null, parseInt(re));
    });
  });
};

exports.init = init;
exports.initRedis = initRedis;
// exports.readConfig = readConfig;
exports.checkClient = checkClient;
exports.set = set;
exports.get = get;
exports.del = del;
exports.makeIncrId = makeIncrId;

// set('testKey','testValue',5000,function(err, re) {
//   if (err) {
//     vlog.eo(err, 'test set cache');
//     return;
//   }
//   vlog.log('set re:%j',re);
//   get('testKey',function(err, re) {
//     if (err) {
//       vlog.eo(err, 'test get cache');
//       return;
//     }
//     vlog.log('get re:%j',re);
//   });
// });
