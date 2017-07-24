'use strict';

const vlog = require('vlog').instance(__filename);
const configFile = __dirname + '/../config.json';

const redis = require('./redis').init(configFile);

redis.set('bbbb', 'bbbb_bbb', (err) => {

  if (err) return vlog.eo(err);


  //get操作
  redis.get('bbbb', (e, j) => console.log('bbb2:', e, j));

  // //反复初始化也只会返回之前初始化过的对象，不会重复初始化
  // const redis2 = require('./redis').init(configFile);
  // redis2.c.get('aaaaa', (e, j) => console.log('aaaaa3:', e, j));


});
//立即调用会报未初始化错误,但不会阻塞进程
redis.get('aaaaa', (e, j) => console.log('aaaaa1:', e, j));

