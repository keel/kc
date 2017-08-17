'use strict';
const kc = require('./kc');
const vlog = require('vlog').instance(__filename);
const redisCreator = require('./redis');

let banRedisKeyPre = 'f2ban:';
let banTimes = 5;
let expireSec = 60 * 60 * 3; //默认3小时
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

const getIp = function getIp(req) {
  return req.headers['x-real-ip'] || req.ip;
};

const checkBan = function checkBan(req, callback) {
  if (!kc.kconfig.get('fail2ban')) {
    return callback(null);
  }
  const ip = getIp(req);
  redis.get(banRedisKeyPre + ip, (err, banRe) => {
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

const failOne = function failOne(req) {
  if (!kc.kconfig.get('fail2ban')) {
    return;
  }
  const ip = getIp(req);
  const key = banRedisKeyPre + ip;
  redis.incr(key, (err) => {
    if (err) {
      return vlog.eo(err, 'failOne:incr', ip);
    }
    redis.expire(key, expireSec);
  });
};

exports.init = init;
exports.checkBan = checkBan;
exports.failOne = failOne;