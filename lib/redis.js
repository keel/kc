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

const setWithTime = (client) => (cacheKey, value, expireSec, callback = ktool.defaultCallback) => {
  client.set(cacheKey, value, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'setWithTime', cacheKey, value, expireSec));
    }
    callback(null, re);
    if (expireSec) {
      client.expire(cacheKey, expireSec);
    }
  });
};


//-------------------- 新自定义方法结束 --------------------

const initClient = (callback) => {
  const redisConfig = kconfig.get('redis');
  const redisIP = redisConfig['s!_redisIP'];
  const redisPort = redisConfig['s!_redisPort'];
  if (!redisIP || !redisPort) {
    return callback(vlog.ee(new Error('init'), 'redis read ip and port from config.json failed.'));
  }
  // vlog.log('redis will init:[%s] [%d]', redisIP, redisPort);
  const opts = {
    'host': redisIP,
    'port': redisPort
  };
  if (redisConfig['s!_pwd']) {
    opts.password = redisConfig['s!_pwd'];
  }

  const client = redis.createClient(opts);
  client.on('error', function(err) {
    redisClient = null;
    callback(vlog.ee(err, 'Redis error'));
  });
  client.on('ready', function() {
    vlog.log('redis init OK:[%s] [%d]', redisIP, redisPort);
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


const reInit = (isForce, callback) => {
  kconfig.reInit(isForce);
  return helper.init(isForce, callback);
};


const init = (callback) => reInit(false, callback);

exports.init = init;
exports.reInit = reInit;
exports.getClient = helper.getClient;