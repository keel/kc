/*
用于初始化数据库等需要异步的对象，返回所需要的db等client，同时可以添加更多的辅助方法

 */
'use strict';


// 附加方法,一般用于原生client
const appendFnToClient = (appendFn, targetClient) => {
  if (appendFn) {
    for (let i in appendFn) {
      targetClient[i] = appendFn[i](targetClient);
    }
  }
};

const create = (config) => {
  const me = {};
  me.name = config.name;
  me.close = config.close;

  //add helpers plus
  if (config.plus) {
    for (let i in config.plus) {
      me[i] = config.plus[i];
    }
  }

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

  me.init = (callback) => {
    if (callback) {
      initCallbacks.push(callback);
    }
    if (isInitStart) {
      return me.client;
    }
    isInitStart = true;
    if (me.orgClient) {
      callbackInits(null, me.client.getClient);
      return me.client;
    }
    config.initClient(function(err, re) {
      if (err) {
        callbackInits(err);
        return me.client;
      }
      me.orgClient = re;
      callbackInits(null, me.client.getClient);
      isInitStart = false;
    });
    return me.client;
  };


  return me;
};


exports.create = create;
exports.appendFnToClient = appendFnToClient;
