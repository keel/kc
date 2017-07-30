/*
基于redis的session实现,以及常见的登录,登出,cookie校验
v1.0.1: fix session update
v1.0.2: 当type为application/json时,使用json返回,否则redirect
v1.0.3: 使用项目配置来设置rootKey,sessionPre,cookieKey,以免项目之间冲突
v1.0.4: 增加内存方式，与redis方式可选
author:Keel
 */
'use strict';
const redis = require('./redis').init(__dirname + '/../config.json');
const aes = require('aes-cross');
const ktool = require('ktool');
const error = require('./error');
const vlog = require('vlog').instance(__filename);
const kconfig = ktool.kconfig;


let expireTime = null;
//用aes加密的key
let rootKey = null;
let sessionPre = null;
let cookieKey = null;
let failLoginRedirect = null;
let encWay = 'aes';

const encWayFn = {
  'aes': function(sessionSrc) {
    return aes.encText(sessionSrc, rootKey);
  },
  'md5': function(sessionSrc) {
    return ktool.md5(sessionSrc);
  }
};

const init = function(configFile) {
  kconfig.init(configFile);
  expireTime = kconfig.getConfig().sessionExpire || 60 * 30;
  rootKey = (new Buffer(ktool.md5(kconfig.getConfig().project + kconfig.getConfig().ver + kconfig.getConfig().sessionKey))).slice(0, 16);
  sessionPre = 'sid_' + kconfig.getConfig().project + '_' + kconfig.getConfig().ver + ':';
  cookieKey = 'kie_' + kconfig.getConfig().project + '_' + kconfig.getConfig().ver;
  failLoginRedirect = kconfig.getConfig().failLoginRedirect || 'login';
  if (encWayFn[kconfig.getConfig().sessionEncWay]) {
    encWay = kconfig.getConfig().sessionEncWay;
  }
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




const sessionSet = function(resp, sid, value, cookieExpireTime, callback) {
  redis.setWithTime(sessionPre + sid, value, cookieExpireTime, function(err) {
    if (err) {
      return callback(vlog.ee(err, 'sessionSet err:' + sid + ',value:' + value));
    }
    // vlog.log('sessionSet sid:%j,value:%j',sid,value);
    //设置cookie
    resp.cookie(cookieKey, sid, {
      maxAge: (cookieExpireTime * 1000),
      httpOnly: true
    });
    callback(null, 'ok');
  });
};


const setAuthed = function(req, resp, userId, level, callback) {
  const now = new Date().getTime();
  const sessionSrc = now + '_' + userId + '_' + level + '_' + req.ip;
  // vlog.log('sessionSrc:%s',sessionSrc);
  // const sessionId = aes.encText(sessionSrc, rootKey);
  const sessionId = encWayFn[encWay](sessionSrc);

  // vlog.log('sessionId:%s',sessionId);
  sessionSet(resp, sessionId, sessionSrc, expireTime, callback);
};


const updateAuthed = function(req, resp, sid, sessionArr, callback) {
  // if (!sid) {
  //   return callback(vlog.ee(null, 'sid is null'));
  // }

  const newSrc = sessionArr.join('_');

  sessionSet(resp, sid, newSrc, expireTime, callback);

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
  redis.get(sessionPre + c, function(err, re) {
    if (err) {
      vlog.error(err.stack);
      return fail(req, resp);
    }
    if (!re) {
      return fail(req, resp);
    }
    redis.del(sessionPre + c, function(err) {
      if (err) {
        vlog.error(err.stack);
      }
      return fail(req, resp);
    });

  });
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

const redisCheck = function(sid, req, resp, callback) {

  redis.get(sessionPre + sid, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'redisCheck:cache.get', sessionPre + sid));
    }
    if (!re) {
      return callback(vlog.ee(err, 'redisCheck:no cache:', sessionPre + sid));
    }
    const sessionArr = re.split('_');
    if (sessionArr.length < 4) {
      vlog.eo(null, 'sessionArr err:' + re);
      return callback(vlog.ee(err, 'redisCheck:(sessionArr.length < 4'));
    }
    // if (sessionArr[3] !== req.ip) {
    //   return callback(vlog.ee(err,'redisCheck:ip err'));
    // }
    const now = (new Date()).getTime();
    //if (now - sessionArr[0] > 60000) {
    //
    sessionArr[0] = now;
    updateAuthed(req, resp, sid, sessionArr, function(err) {
      if (err) {
        vlog.eo(err, 'check error.');
      }

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
  redisCheck(c, req, resp, function(err, userObj) {
    if (err) {
      return failFn(req, resp);
    }
    next();
  });
};

const cookieCheck = function(req, resp, next) {
  check(req, resp, fail, next);
};

exports.redisCheck = redisCheck;
exports.cookieCheck = cookieCheck;
exports.setAuthed = setAuthed;
exports.init = init;
exports.logout = logout;