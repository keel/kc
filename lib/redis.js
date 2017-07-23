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

const close = (callback) => {
  if (redisClient) {
    redisClient.quit();
    vlog.log('redisClient quit...');
  }
  redisClient = null;
  if (callback) {
    callback(null);
  }
};

const appendFn = {
  'setWithTime': (client) => (cacheKey, value, expireSec, callback = (err) => (err) ? vlog.eo(err, 'setWithTime', cacheKey, value, expireSec) : null) => {
    client.set(cacheKey, value, function(err, re) {
      if (err) {
        return callback(err);
      }
      callback(null, re);
      if (expireSec) {
        client.expire(cacheKey, expireSec);
      }
    });
  }
};

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
    callback(vlog.ee(err, 'Redis on error'));
  });
  client.on('ready', function() {
    // vlog.log('redis init OK:[%s] [%d]', redisIP, redisPort);
    redisClient = client;
    initHelper.appendFnToClient(appendFn, redisClient);
    callback(null, redisClient);
  });
};


const config = {
  'name': 'redis',
  'close': close,
  'initClient': initClient
};


const helper = initHelper.create(config);

//用于缓存initHelper的getClient方法,使用时用()即可获取，将对象为null的错误转化为未初始化的错误
let getClient = new Proxy({}, {
  get(target, property) {
    if (redisClient) {
      return redisClient[property];
    }
    // console.log('property:%s',property);
    return (...paras) => {
      const pLen = paras.length;
      if (pLen > 0 && (typeof paras[pLen - 1] === 'function')) {
        paras[pLen - 1](new Error('Client not inited!'));
      }
    };
  }
});

const reInit = (configFile, isForce, callback) => {
  kconfig.init(configFile, isForce);
  getClient = helper.init(callback).getClient;
  return getClient;
};

const init = (configFile, callback) => reInit(configFile, false, callback);

exports.init = init;
exports.reInit = reInit;
exports.helper = helper;
exports.getClient = getClient;
