/*
vlog同时输出到redis的插件,需要事先初始化redis
 */
'use strict';
const util = require('util');
const path = require('path');
const kconfig = require('ktool').kconfig;
const redisClient = require('./redis').init();

const processName = path.basename(process.argv[process.argv.length - 1], '.js');
const projectName = kconfig.get('project');
const ver = kconfig.get('ver');
const _index = 'vlog';
const redisKey = kconfig.get('vlogRedisKey') || 'vlogRedis:all';


const logLevel = {
  'log': 1,
  'info': 2,
  'warn': 3,
  'error': 4,
  'config': 5 //一般在初始化时使用附加的redisLog方法调用，这里可以认为是应用重启了，所以为level等级较高
};

const sendToRedis = function sendToRedis(type, args, plug) {
  const saveObj = {
    'index': _index,
    'type': type,
    'body': {
      'process': processName,
      'logLevel': logLevel[type] || 0,
      'file': plug.file || '',
      'msg': util.format.apply(null, args),
      'project': projectName,
      'ver': ver,
      'added':new Date().getTime()
    }
  };
  redisClient.lpush(redisKey, JSON.stringify(saveObj));
};

/*
只有大于等于vlogRedisLevel的配置进入插件,如果vlogRedisLevel设为error，则level小于4的日志不会进入redis
 */
const setLogFn = function setLogFn(plug, level, logName) {
  if (level <= logLevel[logName]) {
    plug[logName] = function(...args) {
      console[logName].apply(null, args);
      sendToRedis(logName, args, plug);
    };
  }
};

const toRedisPlug = function toRedisPlug(levelName) {
  const level = logLevel[levelName];
  if (!level) {
    return null;
  }
  const plug = {
    'file': '',
    'level': level,
    init(vlogInstance) {
      this.file = vlogInstance.file;
      //为vlog增加一个redisLog方式，可不输出到控制台直接输出到redis
      vlogInstance.redisLog = (type, ...args) => {
        sendToRedis(type, args, this);
      };
    }
  };
  setLogFn(plug, level, 'log');
  setLogFn(plug, level, 'info');
  setLogFn(plug, level, 'warn');
  if (level <= logLevel.error) {
    plug.error = function(...args) {
      console.error.apply(null, args);
      //这里将ee的情况排除，防止入redis两次
      if (args[0] && args[0].startsWith('--------- ERR:')) {
        return;
      }
      sendToRedis('error', args, plug);
    };
  }
  plug.ee = function(err, orgMsg, errName, file, paras) {
    const saveObj = {
      'index': _index,
      'type': 'error',
      'body': {
        'process': processName,
        'logLevel': logLevel.error,
        'file': file,
        'msg': err.stack,
        'error': errName,
        'paras': [],
        'project': projectName,
        'ver': ver,
        'added':new Date().getTime()
      }
    };
    for (let i = 0, len = paras.length; i < len; i++) {
      const p1 = paras[i];
      if ('string' === typeof p1) {
        saveObj.body.paras.push(p1);
      } else {
        saveObj.body.paras.push(JSON.stringify(p1));
      }
    }
    redisClient.lpush(redisKey, JSON.stringify(saveObj));
  };
  return plug;
};


exports.toRedisPlug = toRedisPlug;