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

const config = { 'name': 'redis' };

config.close = (callback) => {
  if (redisClient) {
    redisClient.quit();
    vlog.log('redisClient quit...');
  }
  redisClient = null;
  if (callback) {
    callback(null);
  }
};

config.initClient = (configObj, callback) => {
  const redisIP = configObj.redis.redisIP;
  const redisPort = configObj.redis.redisPort;
  if (!redisIP || !redisPort) {
    return callback(vlog.ee(new Error('init'), 'redis read ip and port from config.json failed.'));
  }
  // vlog.log('redis will init:[%s] [%d]', redisIP, redisPort);
  const opts = {
    'host': redisIP,
    'port': redisPort
  };
  if (configObj.redis.pwd) {
    opts.password = configObj.redis.pwd;
  }

  const client = redis.createClient(opts);
  client.on('error', function(err) {
    redisClient = null;
    callback(vlog.ee(err, 'Redis on error'));
  });
  client.on('ready', function() {
    // vlog.log('redis init OK:[%s] [%d]', redisIP, redisPort);
    redisClient = client;
    callback(null, client);
  });
};


config.appendFn = {
  setWithTime(cacheKey, value, expireSec, callback = (err) => (err) ? vlog.eo(err, 'setWithTime', cacheKey, value, expireSec) : null) {
    redisClient.set(cacheKey, value, function(err, re) {
      if (err) {
        return callback(err);
      }
      callback(null, re);
      if (expireSec) {
        redisClient.expire(cacheKey, expireSec);
      }
    });
  }
};

const helper = initHelper.create(config);

//用于缓存initHelper的getClient方法,使用时用()即可获取，将对象为null的错误转化为未初始化的错误
let getClient = null;

const reInit = (configFile, isForce, callback) => {
  if (!isForce && getClient) {
    return getClient;
  }
  return helper.init(kconfig.init(configFile, isForce), callback).getClient;
};

const init = (configFile, callback) => reInit(configFile, false, callback);

exports.init = init;
exports.reInit = reInit;
exports.helper = helper;
