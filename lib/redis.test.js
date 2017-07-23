'use strict';

const vlog = require('vlog').instance(__filename);
const configFile = __dirname + '/../config.json';

// =================================================
// 1. 直接指定配置文件路径初始化加载,注意此时立即调用会报init未完成
// =================================================
const redis = require('./redis').init(configFile);

const mongo = require('./mongo2').init(configFile);

mongo.c.find('user', { 'name': 'keel' }, (err, re) => console.log(err, re));
mongo.c('user').find( { 'name': 'keel' }, (err, re) => console.log(err, re));
mongo.c('user','find',{ 'name': 'keel' }, (err, re) => console.log(err, re));

//立即调用会报未初始化错误,但不会阻塞进程
redis.c.get('aaaaa', (e, j) => console.log('aaaaa1:', e, j)); //ERROR

//如果不是立即调用，而是在方法中使用，则没有问题
const testFn1 = () => {
  //set操作
  redis().set('aaaaa', 'aa_aa_aa', (err) => {

    if (err) return vlog.eo(err);


    //get操作
    redis().get('aaaaa', (e, j) => console.log('aaaaa2:', e, j));

    //反复初始化也只会返回之前初始化过的对象，不会重复初始化
    const redis2 = require('./redis').init(configFile);
    redis2().get('aaaaa', (e, j) => console.log('aaaaa3:', e, j));


  });


};

//项目启动后或过段时间等待初始化完成后，即可执行testFn1
setTimeout(testFn1, 2000);



// =================================================
// 2. 需要在初始化后立即执行的情况
// =================================================
const redis4 = require('./redis');
redis4.init(configFile, (err, cc) => {
  if (err) {
    vlog.eo(err, '');
    return;
  }
  const redisClient = cc();
  redisClient.get('aaaaa', (e1, v1) => console.log('aaaaa4:', e1, v1));

  // setWithTime为非原驱动的方法，通过kc.redis附加上
  redisClient.setWithTime('aabbccdd', '11223344', 10, (e, j) => console.log('setWithTime aabbccdd:', e, j));
  // re.get('aaaaa', (e, j) => console.log(j));
  console.log('-------- done. ---------');
});



const testFn2 = () => {
  redis4().get('aaaaa', (e, j) => console.log('aaaaa5:', e, j));

  redis4().get('aabbccdd', (e, j) => {
    console.log('aabbccdd:', e, j);

    // =================================================
    // 3. 强制重新初始化,注意第二个参数可强制从配置文件重新读取
    // =================================================

    require('./redis').reInit(configFile, true, (err) => {
      if (err) {
        vlog.eo(err, 'reInit');
        return;
      }
      console.log('--------reInit done. ---------');
      // =================================================
      // 4.通过helper可以执行关闭操作,这里关闭后需要重新执行初始化
      // =================================================

      const redis3 = require('./redis');
      redis3.helper.close();
    });

  });
};

setTimeout(testFn2, 4000);
