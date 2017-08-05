/*
用于初始化数据库等需要异步的对象，返回所需要的db等client，同时可以添加更多的辅助方法
这里的init用来保证无论在同步还是异步调用的情况下，只初始化一次
 */
'use strict';

const vlog = require('vlog').instance(__filename);

// 附加方法,一般用于原生client
const appendFnToClient = (appendFn, targetClient) => {
  if (appendFn) {
    for (const i in appendFn) {
      targetClient[i] = appendFn[i](targetClient);
    }
  }
};

const create = (config) => {
  const me = {};


  // 并发初始化时控制只初始化一次
  me._initCallbacks = [];
  me._isInitStart = false;
  me.orgClient = null;
  me.config = config;
  me.configName = 'default';

  me.getClient = (callback) => {
    if (me.orgClient) {
      return callback(null, me.orgClient);
    }
    me.init(false, me.configName, (err, client) => {
      if (err) {
        callback(vlog.ee(err, 'getClient:init'));
        return;
      }
      callback(null, client);
    });
  };

  me.checkClient = new Proxy({}, {
    get(target, action) {
      return (...paras) => {
        me.getClient((err, client) => {
          if (err) {
            return vlog.eo(err, 'checkClient');
          }
          // console.log('action:%s', action);
          client[action].apply(client, paras);
        });
      };
    }
  });


  const callbackInits = (err, re1, re2) => {
    while (me._initCallbacks.length > 0) {
      me._initCallbacks.shift()(err, re1, re2);
    }
    me._isInitStart = false;
  };


  me.init = (isForce, configName, callback) => {
    if (me._isInitStart && !isForce) {
      if (callback) {
        me._initCallbacks.push(callback);
      }
      return me.checkClient;
    }
    me._isInitStart = true;
    me.configName = configName;
    if (callback) {
      me._initCallbacks.push(callback);
    }
    if (me.orgClient && !isForce) {
      callbackInits(null, me.orgClient);
      return me.checkClient;
    }
    me.config.initClient(configName, function(err, re) {
      if (err) {
        callbackInits(err);
        return me.checkClient;
      }
      me.orgClient = re;
      callbackInits(null, me.orgClient);
      me._isInitStart = false;
    });
    return me.checkClient;
  };


  return me;
};


exports.create = create;
exports.appendFnToClient = appendFnToClient;