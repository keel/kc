/*
基于redis的session实现,以及常见的登录,登出,cookie校验
v1.0.1: fix session update
v1.0.2: 当type为application/json时,使用json返回,否则redirect
v1.0.3: 使用项目配置来设置rootKey,sessionPre,cookieKey,以免项目之间冲突
v1.0.4: 增加内存方式，与redis方式可选
v2.0.90: session值改为json,从而支持userName等附加属性保存,sessionValue存入req
author:Keel
 */
'use strict';
const aes = require('aes-cross');
const ktool = require('ktool');
const error = require('./error');
const redisCreator = require('./redis');
const vlog = require('vlog').instance(__filename);
const kconfig = ktool.kconfig;

let redis;
let expireTime = null;
//用aes加密的key
let rootKey = null;
let sessionPre = null;
let cookieKey = null;
let failLoginRedirect = null;
let encWay = 'aes';
let sessionType = 'mem'; // 默认是mem模式,需要在config中配置
let sessionStore = null;
let ignoreIpCheck = false;

const defaultExpireTime = 60 * 30; //单位秒

const encWayFn = {
  'aes': function(sessionSrc) {
    return aes.encText(sessionSrc, rootKey);
  },
  'md5': function(sessionSrc) {
    return ktool.md5(sessionSrc);
  },
  'sha1': function(sessionSrc) {
    return ktool.sha1(sessionSrc);
  }
};


// 用于mem方式存储session
const memMap = {};


// 不同方式的session存储模式
const sessionStoreMap = {
  'mem': {
    'init': (callback) => callback(null),
    'del': sid => {
      delete memMap[sessionPre + sid];
    },
    'set': (sid, value, cookieExpireTime, callback) => {
      const key = sessionPre + sid;
      memMap[key] = value;
      setTimeout(() => delete memMap[key], cookieExpireTime * 1000);
      callback(null);
    },
    'get': (sid, callback) => callback(null, memMap[sessionPre + sid])
  },
  'redis': {
    'init': (callback) => {
      redis = redisCreator.init((err) => {
        if (err) {
          return callback(err);
        }
        callback(null);
      });
    },
    'del': sid => {
      redis.del(sessionPre + sid);
    },
    'set': (sid, value, cookieExpireTime, callback) => redis.setWithTime(sessionPre + sid, value, cookieExpireTime, callback),
    'get': (sid, callback) => redis.get(sessionPre + sid, callback)
  }
};

const init = function() {

  expireTime = kconfig.get('sessionExpire') || defaultExpireTime;
  ignoreIpCheck = kconfig.get('ignoreIpCheck') || false;
  const project = kconfig.get('project');
  const ver = kconfig.get('ver');
  const sessionEncWay = kconfig.get('sessionEncWay');
  const confSessionType = kconfig.get('sessionType');
  rootKey = (Buffer.from(ktool.md5(project + ver + kconfig.get('s$_sessionKey')))).slice(0, 16);
  sessionPre = 'sid_' + project + '_' + ver + ':';
  cookieKey = 'kie_' + project + '_' + ver;
  failLoginRedirect = kconfig.get('failLoginRedirect') || 'login';
  if (confSessionType) {
    sessionType = confSessionType;
  }
  sessionStore = sessionStoreMap[sessionType];
  if (!sessionStore) {
    vlog.error('===== > sessionType ERROR! ,type: %j', confSessionType);
    return;
  }
  if (sessionEncWay && encWayFn[sessionEncWay]) {
    encWay = sessionEncWay;
  }
  sessionStore.init((err) => {
    if (err) {
      vlog.eo(err, 'sessionStore init', confSessionType);
    }
  });
};

const fail = function(req, resp) {
  resp.clearCookie(cookieKey);
  if (req.method === 'POST') {
    resp.status(403).send(error.json('auth', '权限不足'));
  } else {
    resp.redirect(failLoginRedirect);
  }
};


const getIp = function(req) {
  return req.headers['x-real-ip'] || req.ip;
};

/**
 * 支持在session中存放session变量，注意这里固定采用MD5算法，超时采用expireTime
 * @param  {req}   req
 * @param  {resp}   resp
 * @param  {string}   key              session key
 * @param  {string}   value            session value
 * @param  {int}   cookieExpireTime 超时时间，单位秒
 * @param  {Function} callback
 * @return {}
 */
const sessionSet = function(req, resp, key, value, callback = ktool.defaultCallback(null, __filename)) {
  const sessionSrc = sessionPre + getIp(req) + new Date().getTime() + key + ktool.randomStr(6);
  const sessionId = encWayFn[encWay](sessionSrc);
  sessionStore.set(sessionId, value, expireTime, (err) => {
    if (err) {
      return callback(vlog.ee(err, 'sessionSet', key, value));
    }
    //设置cookie
    resp.cookie(cookieKey + '_' + key, sessionId, {
      maxAge: (expireTime * 1000),
      httpOnly: true
    });
    callback(null);
  });
};

/**
 * 从session中取变量
 * @param  {req}   req
 * @param  {resp}   resp
 * @param  {string}   key       session的key
 * @param  {Function} callback
 * @return {}
 */
const sessionGet = function(req, resp, key, callback) {
  const kie = req.get('cookie');
  if (!kie) {
    return callback(vlog.ee(new Error('no cookie'), 'sessionGet', key));
  }
  const sessionId = getCookieMap(kie)[cookieKey + '_' + key];
  if (!sessionId) {
    return callback(null, '');
  }
  sessionStore.get(sessionId, (err, value) => {
    if (err) {
      return callback(vlog.ee(err, 'sessionGet', key, value));
    }
    if (!value) {
      return callback(null, '');
    }
    //设置cookie
    resp.cookie(cookieKey + '_' + key, sessionId, {
      maxAge: (expireTime * 1000),
      httpOnly: true
    });
    callback(null, value);
  });
};

const authSessionSet = function(resp, sid, value, cookieExpireTime, callback) {
  // vlog.log('authSessionSet:%s',value);
  sessionStore.set(sid, value, cookieExpireTime, (err) => {
    if (err) {
      return callback(vlog.ee(err, 'authSessionSet', sid, value));
    }
    //设置cookie
    resp.cookie(cookieKey, sid, {
      maxAge: (cookieExpireTime * 1000),
      httpOnly: true
    });
    callback(null, value);
  });
};


const mkSid = function(sessionValue) {
  const sidSrc = sessionValue.startTime + '_' + sessionValue.userId + '_' + sessionValue.userLevel + '_' + sessionValue.userIp;
  // vlog.log('sidSrc:%s',sidSrc);
  return encWayFn[encWay](sidSrc);
};


const authSessionValueSet = function(setMap, req, resp, callback) {
  const kie = req.get('cookie');
  if (!kie) {
    return callback('no cookie');
  }
  const c = getCookieMap(kie)[cookieKey];
  // vlog.log('check c:%j, cookieKey:%s',c, cookieKey);
  if (!c) {
    return callback('no cookie from key');
  }
  sessionStore.get(c, function(err, sessionValue) {
    if (err) {
      return callback(vlog.ee(err, 'sessionCheck:cache.get', c));
    }
    if (!sessionValue) {
      return callback('no sessionValue');
    }
    if ('string' === typeof sessionValue) {
      sessionValue = JSON.parse(sessionValue);
    }
    if (!sessionValue.sessionValue) {
      sessionValue.sessionValue = {};
    }
    for(const i in setMap){
      sessionValue.sessionValue[i] = setMap[i];
    }
    const thisExpireTime = setMap.expireTime || expireTime;
    //更新session
    sessionValue.startTime = Date.now();
    authSessionSet(resp, c, JSON.stringify(sessionValue), thisExpireTime, (err, re) => {
      if (err) {
        return callback(vlog.ee(err, 'authSessionValueSet:authSessionSet'));
      }
    });
  });
};


const setAuthedWithParas = function(req, resp, userId, userLevel, moreParas, callback) {
  const sessionValue = {
    userId,
    userLevel,
    'startTime': Date.now(),
    'userIp': getIp(req),
  };
  if (moreParas) {
    sessionValue.sessionValue = moreParas;
  }
  const sessionId = mkSid(sessionValue);
  // vlog.log('sessionId:%s,sessionValue:%j',sessionId,sessionValue);
  authSessionSet(resp, sessionId, JSON.stringify(sessionValue), expireTime, callback);
};

const setAuthed = function(req, resp, userId, userLevel, callback) {
  setAuthedWithParas(req, resp, userId, userLevel, null, callback);
};


const updateAuthed = function(req, resp, sid, sessionValue, callback) {
  // if (!sid) {
  //   return callback(vlog.ee(null, 'sid is null'));
  // }
  // const newSrc = sessionArr.join('_');
  sessionValue.startTime = Date.now();
  let thisExpireTime = expireTime;
  if (sessionValue.sessionValue && sessionValue.sessionValue.expireTime) {
    thisExpireTime = sessionValue.sessionValue.expireTime;
  }
  authSessionSet(resp, sid, JSON.stringify(sessionValue), thisExpireTime, callback);
};


const logout = function(req, resp) {
  const kie = req.get('cookie');
  if (kie) {
    const c = getCookieMap(kie)[cookieKey];
    // vlog.log('logout c:%j',c);
    if (c) {
      sessionStore.del(sessionPre + c);
    }
  }
  resp.clearCookie(cookieKey);
  if (req.method === 'POST') {
    resp.send('{"code":0}');
  } else {
    resp.redirect(failLoginRedirect);
  }
};

const getCookieMap = function(cookieString) {
  const cookies = {};
  const pairs = cookieString.split(/[;,] */);
  for (let i = 0; i < pairs.length; i++) {
    let idx = pairs[i].indexOf('=');
    const key = pairs[i].substr(0, idx);
    const val = decodeURIComponent(pairs[i].substr(++idx, pairs[i].length).trim());
    cookies[key] = val;
  }
  return cookies;
};

const sessionCheck = function(sid, req, resp, callback) {
  sessionStore.get(sid, function(err, sessionValue) {
    if (err) {
      return callback(vlog.ee(err, 'sessionCheck:cache.get', sessionPre + sid));
    }
    if (!sessionValue) {
      return callback(null, 'noCache');
    }
    if ('string' === typeof sessionValue) {
      sessionValue = JSON.parse(sessionValue);
    }
    //强制IP校验，注意nginx转发需要设置X-Real-IP传递真实IP
    if (!ignoreIpCheck && sessionValue.userIp !== getIp(req)) {
      return callback(vlog.ee(err, 'sessionCheck:ip err', sessionValue.userIp, getIp(req)));
    }
    //强制时间判定
    const now = Date.now();
    if (now - parseInt(sessionValue.startTime) > expireTime * 2000) {
      return callback(vlog.ee(err, 'sessionCheck:time err', sessionValue.startTime, now));
    }
    //更新session
    updateAuthed(req, resp, sid, sessionValue, function(err) {
      if (err) {
        vlog.eo(err, 'check error.');
      }
      // sessionStore.del(sessionPre + sid);
      for (const i in sessionValue) {
        req[i] = sessionValue[i];
        // console.log('set [%s]:%j', i, sessionValue[i]);
      }
      // vlog.log('set req level:%j',req.userLevel);
      return callback(null, sessionValue);
    });
  });
};

const check = function(req, resp, next, failFn = fail) {
  const kie = req.get('cookie');
  if (!kie) {
    return failFn(req, resp);
  }
  const c = getCookieMap(kie)[cookieKey];
  // vlog.log('check c:%j, cookieKey:%s',c, cookieKey);
  if (!c) {
    return failFn(req, resp);
  }
  sessionCheck(c, req, resp, function(err, sessionValue) {
    if (err) {
      vlog.eo(err, 'sessionCheck', sessionValue);
      return failFn(req, resp);
    }
    if (sessionValue === 'noCache') {
      return failFn(req, resp);
    }
    next();
  });
};

const cookieCheck = function(req, resp, next) {
  check(req, resp, next, fail);
};

exports.sessionGet = sessionGet;
exports.sessionSet = sessionSet;
exports.sessionCheck = sessionCheck;
exports.cookieCheck = cookieCheck;
exports.setAuthed = setAuthed;
exports.setAuthedWithParas = setAuthedWithParas;
exports.getCookieMap = getCookieMap;
exports.authSessionValueSet = authSessionValueSet;

exports.init = init;
exports.logout = logout;