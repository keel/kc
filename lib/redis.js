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

const initClient = (configName, callback) => {
  const redisConfig = kconfig.get('redis', configName);
  // console.log('configName:%s, redisConfig:%j', configName, redisConfig);
  const redisIP = redisConfig['s$_redisIP'];
  const redisPort = redisConfig['s$_redisPort'];
  if (!redisIP || !redisPort) {
    return callback(vlog.ee(new Error('init'), 'redis read ip and port from config.json failed.'));
  }
  // vlog.log('redis will init:[%s] [%d]', redisIP, redisPort);
  const opts = {
    'host': redisIP,
    'port': redisPort
  };
  if (redisConfig['s$_pwd']) {
    opts.password = redisConfig['s$_pwd'];
  }
  if (redisConfig.no_ready_check) {
    opts.no_ready_check = redisConfig.no_ready_check;
  }else{
    opts.no_ready_check = true;
  }

  const client = redis.createClient(opts);
  client.on('error', function(err) {
    callback(vlog.ee(err, 'Redis error'));
  });
  client.on('ready', function() {
    vlog.log('redis init OK. [%s]', configName);
    initHelper.appendFnToClient(config.appendFn, client);
    callback(null, client);
  });
};


const config = {
  'initClient': initClient,
  'appendFn': {
    'setWithTime': setWithTime
  }
};

//为支持多配置多数据库对象的情况，按配置做成map
const helperMap = {};

const helper = initHelper.create(config);
helperMap['default'] = helper;

const reInit = (isForce, customConfigName = 'default', callback) => {
  kconfig.reInit(isForce);
  let helper = helperMap[customConfigName];
  if (!helper) {
    helper = initHelper.create(config);
    helperMap[customConfigName] = helper;
  }
  return helper.init(isForce, customConfigName, callback);
};


const init = (callback) => reInit(false, 'default', callback);

exports.init = init;
exports.reInit = reInit;
exports.getClient = helper.getClient;