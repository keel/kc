'use strict';

// const vlogRedis = require('./vlogRedis');
const kc = require('./kc');
const redis = kc.redis.init();
// const util = require('util');
// const vlog = require('vlog').instance(__filename, kc.vlogRedis);
const vlog = require('vlog').instance(__filename); //这里需要确定在config中已经配置过vlogRedisLevel才能自动载入vlogRedis插件

const obj1 = { a: 'yyy', b: 2323 };

vlog.log('aaaa:%j',obj1);

// vlog.eo(new Error('testErr'), 'ERR_name', obj1, 2323, false);

// redis.rpop('vlogRedis:all', (err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   if (re) {
//     re = JSON.parse(re);
//     console.log(re);
//   }
// });