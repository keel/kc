/*
账号登录失败次数到达banTimes时，锁定该账号登录expireSec时间
 */
'use strict';
const kc = require('./kc');
const vlog = require('vlog').instance(__filename);
const redisCreator = require('./redis');

let banRedisKeyPre = 'f2ban:';
let banTimes = 5; // 默认5次失败触发锁定
let expireSec = 60 * 60 * 3; // 默认时长为3小时
let redis = null;


const init = function init() {
  if (kc.kconfig.get('fail2ban')) {
    banRedisKeyPre = 'f2ban:' + kc.kconfig.get('project') + ':';
    banTimes = kc.kconfig.get('fail2banTimes') || 5;
    expireSec = kc.kconfig.get('fail2ban') || 60 * 60 * 3; //默认3小时
    redis = redisCreator.init();
    vlog.log('fail2ban inited. fail2banTimes:%d, expireSec:%d', kc.kconfig.get('fail2banTimes'), kc.kconfig.get('fail2ban'));
  }
};


const clear = function clear(userId) {
  if (!kc.kconfig.get('fail2ban')) {
    return;
  }
  redis.del(banRedisKeyPre + userId);
};


const checkBan = function checkBan(userId, callback) {
  if (!kc.kconfig.get('fail2ban')) {
    return callback(null);
  }
  redis.get(banRedisKeyPre + userId, (err, banRe) => {
    if (err) {
      return callback(vlog.ee(err, 'checkBan:redis.get'));
    }
    // console.log('banRe:%j',banRe);
    if (!banRe) {
      return callback(null);
    }
    if (banTimes <= parseInt(banRe)) {
      return callback(new Error('banTimes reached'), expireSec / 60 / 60);
    }
    return callback(null);
  });
};

const failOne = function failOne(userId) {
  if (!kc.kconfig.get('fail2ban')) {
    return;
  }
  const key = banRedisKeyPre + userId;
  redis.incr(key, (err) => {
    if (err) {
      return vlog.eo(err, 'failOne:incr', userId);
    }
    redis.expire(key, expireSec);
  });
};

exports.init = init;
exports.clear = clear;
exports.checkBan = checkBan;
exports.failOne = failOne;