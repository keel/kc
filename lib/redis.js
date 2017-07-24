/*
redis按配置初始化并附加方法
author:Keel

 */
'use strict';
const redis = require('redis');
const ktool = require('ktool');
const vlog = require('vlog').instance(__filename);
const initHelper = require('./initHelper');

const kconfig = ktool.kconfig;


let redisClient;

//-------------------- 新自定义方法 --------------------

const setWithTime = (client) => (cacheKey, value, expireSec, callback = (err) => (err) ? vlog.eo(err, 'setWithTime', cacheKey, value, expireSec) : null) => {
  client.set(cacheKey, value, function(err, re) {
    if (err) {
      return callback(err);
    }
    callback(null, re);
    if (expireSec) {
      client.expire(cacheKey, expireSec);
    }
  });
};


//-------------------- 新自定义方法结束 --------------------

const initClient = (callback) => {
  const redisConfig = kconfig.getConfig().redis;
  const redisIP = redisConfig.redisIP;
  const redisPort = redisConfig.redisPort;
  if (!redisIP || !redisPort) {
    return callback(vlog.ee(new Error('init'), 'redis read ip and port from config.json failed.'));
  }
  // vlog.log('redis will init:[%s] [%d]', redisIP, redisPort);
  const opts = {
    'host': redisIP,
    'port': redisPort
  };
  if (redisConfig.pwd) {
    opts.password = redisConfig.pwd;
  }

  const client = redis.createClient(opts);
  client.on('error', function(err) {
    redisClient = null;
    callback(vlog.ee(err, 'Redis error'));
  });
  client.on('ready', function() {
    // vlog.log('redis init OK:[%s] [%d]', redisIP, redisPort);
    redisClient = client;
    initHelper.appendFnToClient(config.appendFn, redisClient);
    callback(null, redisClient);
  });
};


const config = {
  'initClient': initClient,
  'appendFn': {
    'setWithTime': setWithTime
  }
};


const helper = initHelper.create(config);

//用于缓存initHelper的getClient方法,使用时用()即可获取，将对象为null的错误转化为未初始化的错误
const getClient = (callback) => {
  if (redisClient) {
    return callback(null, redisClient);
  }
  helper.init(false, (err, client) => {
    if (err) {
      callback(vlog.ee(err, 'getClient:helper.init'));
      return;
    }
    callback(null, client);
  });
};

const checkClient = new Proxy({}, {
  get(target, action) {
    return (...paras) => {
      getClient((err, client) => {
        if (err) {
          return vlog.eo(err, 'checkClient');
        }
        // console.log('action:%s', action);
        client[action].apply(client, paras);
      });
    };
  }
});

const reInit = (configFile, isForce, callback) => {
  kconfig.init(configFile, isForce);
  helper.init(isForce, callback);
  return checkClient;
};


const init = (configFile, callback) => reInit(configFile, false, callback);

exports.init = init;
exports.reInit = reInit;
exports.getClient = getClient;
