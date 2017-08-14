/*
基于redis的session实现,以及常见的登录,登出,cookie校验
v1.0.1: fix session update
v1.0.2: 当type为application/json时,使用json返回,否则redirect
v1.0.3: 使用项目配置来设置rootKey,sessionPre,cookieKey,以免项目之间冲突
v1.0.4: 增加内存方式，与redis方式可选
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

const defaultExpireTime = 60 * 30;

const encWayFn = {
  'aes': function(sessionSrc) {
    return aes.encText(sessionSrc, rootKey);
  },
  'md5': function(sessionSrc) {
    return ktool.md5(sessionSrc);
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
    'get': (sid, callback) => callback(null, memMap[sid])
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
    'get': (sid, callback) => redis.get(sid, callback)
  }
};

const init = function() {

  expireTime = kconfig.get('sessionExpire') || defaultExpireTime;
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
  if ((req.headers['Content-Type'] || req.headers['content-type']) === 'application/json') {
    resp.status(403).send(error.json('auth'));
  } else {
    resp.redirect(failLoginRedirect);
  }
  resp.end();
  return;
};


const getIp = function getIp(req) {
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
const sessionSet = function sessionSet(req, resp, key, value, callback) {
  const sessionSrc = sessionPre + getIp(req) + new Date().getTime() + key + ktool.randomStr(6);
  const sessionId = encWayFn.md5(sessionSrc);
  sessionStore.set(sessionId, value, expireTime * 1000, (err) => {
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
 * @param  {string}   sessionId session在cookie中的value
 * @param  {Function} callback
 * @return {}
 */
const sessionGet = function sessionSet(req, resp, key, sessionId, callback) {
  sessionStore.get(sessionId, (err, value) => {
    if (err) {
      return callback(vlog.ee(err, 'sessionGet', key, value));
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
  sessionStore.set(sid, value, cookieExpireTime, (err) => {
    if (err) {
      return callback(vlog.ee(err, 'authSessionSet', sid, value));
    }
    //设置cookie
    resp.cookie(cookieKey, sid, {
      maxAge: (cookieExpireTime * 1000),
      httpOnly: true
    });
    callback(null);
  });
};




const setAuthed = function(req, resp, userId, level, callback) {
  const now = new Date().getTime();
  const sessionSrc = now + '_' + userId + '_' + level + '_' + getIp(req);
  // vlog.log('sessionSrc:%s',sessionSrc);
  // const sessionId = aes.encText(sessionSrc, rootKey);
  const sessionId = encWayFn[encWay](sessionSrc);

  // vlog.log('sessionId:%s',sessionId);
  authSessionSet(resp, sessionId, sessionSrc, expireTime, callback);
};


const updateAuthed = function(req, resp, sid, sessionArr, callback) {
  // if (!sid) {
  //   return callback(vlog.ee(null, 'sid is null'));
  // }

  const newSrc = sessionArr.join('_');

  authSessionSet(resp, sid, newSrc, expireTime, callback);

};





const logout = function(req, resp) {
  const kie = req.get('cookie');
  if (!kie) {
    return fail(req, resp);
  }
  const c = getCookieMap(kie)[cookieKey];
  // vlog.log('c:%j',c);
  if (!c) {
    return fail(req, resp);
  }

  sessionStore.del(sessionPre + c);
  resp.clearCookie(cookieKey);
  fail(req, resp);
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

  sessionStore.get(sessionPre + sid, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'sessionCheck:cache.get', sessionPre + sid));
    }
    if (!re) {
      return callback(null, 'noCache');
    }
    const sessionArr = re.split('_');
    if (sessionArr.length < 4) {
      vlog.eo(null, 'sessionArr err:' + re);
      return callback(vlog.ee(err, 'sessionCheck:(sessionArr.length < 4'));
    }
    //强制IP校验，注意nginx转发需要设置X-Real-IP传递真实IP
    if (sessionArr[3] !== getIp(req)) {
      return callback(vlog.ee(err, 'sessionCheck:ip err', sessionArr[3], getIp(req)));
    }
    //强制时间判定
    const now = (new Date()).getTime();
    if (now - parseInt(sessionArr[0]) > expireTime * 2000) {
      return callback(vlog.ee(err, 'sessionCheck:time err', sessionArr[0], now));
    }
    //更新session
    sessionArr[0] = now;
    updateAuthed(req, resp, sid, sessionArr, function(err) {
      if (err) {
        vlog.eo(err, 'check error.');
      }
      sessionStore.del(sessionPre + sid);
      req.userId = sessionArr[1];
      req.userLevel = parseInt(sessionArr[2]);
      // vlog.log('set req level:%j',req.userLevel);
      return callback(null, { 'userId': req.userId, 'userLevel': req.userLevel });
    });
    return;
    // }else{
    //   req.userId = sessionArr[1];
    //   req.userLevel = sessionArr[2];
    //   return callback(null,{'userId':req.userId,'userLevel':req.userLevel});
    // }

  });
};
const check = function(req, resp, failFn, next) {
  const kie = req.get('cookie');
  if (!kie) {
    return failFn(req, resp);
  }
  const c = getCookieMap(kie)[cookieKey];
  // vlog.log('c:%j',c);
  if (!c) {
    return failFn(req, resp);
  }
  sessionCheck(c, req, resp, function(err, userObj) {
    if (err) {
      vlog.eo(err, 'sessionCheck', userObj);
      return failFn(req, resp);
    }
    if (userObj === 'noCache') {
      return failFn(req, resp);
    }
    next();
  });
};

const cookieCheck = function(req, resp, next) {
  check(req, resp, fail, next);
};

exports.sessionGet = sessionGet;
exports.sessionSet = sessionSet;
exports.sessionCheck = sessionCheck;
exports.cookieCheck = cookieCheck;
exports.setAuthed = setAuthed;
exports.getCookieMap = getCookieMap;

exports.init = init;
exports.logout = logout;