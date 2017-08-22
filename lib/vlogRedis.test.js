'use strict';

// const vlogRedis = require('./vlogRedis');
const kc = require('./kc');
const redis = kc.redis.init();
// const util = require('util');
const vlog = require('vlog').instance(__filename, kc.vlogRedis);

const obj1 = {a:'xxx',b:2323};

vlog.eo(new Error('testErr'),'ERR_name','abcd: %j, %d, fff:%j',obj1,2323,false);

redis.rpop('vlogRedis:all',(err, re) => {
  if (err) {
    return vlog.eo(err, '');
  }
  if (re) {
    re = JSON.parse(re);
    console.log(re);
  }
});

