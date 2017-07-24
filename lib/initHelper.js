/*
用于初始化数据库等需要异步的对象，返回所需要的db等client，同时可以添加更多的辅助方法
这里的init用来保证无论在同步还是异步调用的情况下，只初始化一次
 */
'use strict';


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
  const initCallbacks = [];
  let isInitStart = false;
  me.orgClient = null;



  const callbackInits = (err, re1, re2) => {
    while (initCallbacks.length > 0) {
      initCallbacks.shift()(err, re1, re2);
    }
    isInitStart = false;
  };

  const notInitedClient = new Proxy({}, {
    get() {
      // console.log('property:%s',property);
      return (...paras) => {
        const pLen = paras.length;
        if (pLen > 0 && (typeof paras[pLen - 1] === 'function')) {
          paras[pLen - 1](new Error('Client not inited!'));
        }
      };
    }
  });

  //用于输出,外部调用时用()即可获取orgClient，将对象为null的错误转化为未初始化的错误
  me.client = {
    getClient() {
      if (me.orgClient) {
        return me.orgClient;
      }
      return notInitedClient;
    }
  };

  me.init = (isForce,callback) => {
    if (isInitStart && !isForce) {
      if (callback) {
        initCallbacks.push(callback);
      }
      return me.client;
    }
    isInitStart = true;
    if (callback) {
      initCallbacks.push(callback);
    }
    if (me.orgClient && !isForce) {
      callbackInits(null, me.client);
      return me.client;
    }
    config.initClient(function(err, re) {
      if (err) {
        callbackInits(err);
        return me.client;
      }
      me.orgClient = re;
      callbackInits(null, me.client);
      isInitStart = false;
    });
    return me.client;
  };


  return me;
};


exports.create = create;
exports.appendFnToClient = appendFnToClient;
