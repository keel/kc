'use strict';

const vlog = require('vlog').instance(__filename);

// =================================================
// 1. 直接指定配置文件路径初始化加载,注意此时立即调用会报init未完成
// =================================================
const redis = require('./redis').init();

redis.set('bbbb', 'aa_aa_aa', (err) => {

  if (err) return vlog.eo(err);


  //get操作
  redis.get('bbbb', (e, j) => console.log('aaaaa2:', e, j));

  //自定义的带超时的set方法
  redis.setWithTime('bbbb', 'hhhhh', 20 * 1000, (e, j) => console.log('aaaaa3:', e, j));

  // //反复初始化也只会返回之前初始化过的对象，不会重复初始化
  // const redis2 = require('./redis').init(configFile);
  // redis2.c.get('aaaaa', (e, j) => console.log('aaaaa3:', e, j));


});
//立即调用会报未初始化错误,但不会阻塞进程
redis.get('aaaaa', (e, j) => console.log('aaaaa1:', e, j));