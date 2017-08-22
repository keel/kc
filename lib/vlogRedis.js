/*
vlog同时输出到redis的插件
 */
'use strict';
const util = require('util');
const kconfig = require('ktool').kconfig;
let redisClient = null;

const _index = kconfig.get('project');
const redisKey = kconfig.get('vlogRedisKey') || 'vlogRedis:all';

const sendToRedis = function sendToRedis(type, args) {
  if (!redisClient) {
    redisClient = require('./redis').init();
  }
  const saveObj = {
    'index': _index,
    'type': type,
    'body': util.format.apply(null, args)
  };
  redisClient.lpush(redisKey, JSON.stringify(saveObj));
};

const toRedis = {
  'log': function(...args) {
    console.log.apply(null, args);
    sendToRedis('log', args);
  },
  'info': function(...args) {
    console.log.apply(null, args);
    sendToRedis('info', args);
  },
  'warn': function(...args) {
    console.log.apply(null, args);
    sendToRedis('warn', args);
  },
  'error': function(...args) {
    console.error.apply(null, args);
    //这里将ee的情况排除，防止入redis两次
    if (args[0] && args[0].startsWith('--------- ERR:')) {
      return;
    }
    sendToRedis('error', args);
  },
  ee(err, orgMsg, errName, file, args) {
    const saveObj = {
      'index': _index,
      'type': 'error',
      'body': {
        'file': file,
        'stack': err.stack,
        'error': errName,
        'args': util.format.apply(null, args)
      }
    };
    redisClient.lpush(redisKey, JSON.stringify(saveObj));
  }
};

module.exports = toRedis;