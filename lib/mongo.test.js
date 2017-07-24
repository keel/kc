'use strict';

const vlog = require('vlog').instance(__filename);
const configFile = __dirname + '/../config.json';


//最简单! 一句话方式执行数据库操作,会自动进行初始化和获取collection操作
require('./mongo').init(configFile).c('user').insert({ 'phone': '13311112222', 'createTime': new Date().getTime() });



//正常使用,在require时可直接init指定的配置文件
const mongo = require('./mongo').init(configFile);

//同时多次初始化也只会实际调用一次初始化过程
const mongo2 = require('./mongo').init(configFile);

//不用异步方法等待初始化结束，可以直接执行操作,c方法获取collection后直接执行collection的方法
mongo.c('user').query({ 'phone': '18954202777' }, (e, re) => {
  if (e) {
    return vlog.eo(e);
  }
  console.log(re);
});

const test = () => {
  //init后回调中执行也能支持
  mongo2.init(configFile, (e) => {
    if (e) {
      return vlog.eo(e);
    }
    console.log('init OK');
    // 注意find方法与原生驱动是不同的，返回cursor
    mongo.c('user').find({ 'phone': '18954202777' }, (e, cur) => {
      if (e) {
        return vlog.eo(e);
      }
      //这里需要toArray
      cur.toArray((e, re2) => console.log(e, re2));
    });


    //直接调用原生驱动
    mongo.c('user').update({ 'phone': '18954202777' }, { '$set': { 'hh': 'aabb' } }, (e, re) => {
      if (e) {
        return vlog.eo(e);
      }
      console.log(re.result);
    });


    //新增加query方法补充原find方法，与find作用相同，内部会自动toArray，默认limit为20，如果超过需要指定
    mongo.c('user').query({ 'phone': '18954202777' }, { 'limit': 30 }, (e, re) => {
      if (e) {
        return vlog.eo(e);
      }
      console.log(re);

      //关闭mongo
      mongo.close((e) => {
        if (e) {
          return vlog.eo(e);
        }

        //强制重新初始化，这里会重新读取配置并强制初始化
        mongo.reInit(configFile, true);
      });
    });
  });
};


//除以上方法外，还有getColl和getDb方法可以拿到原生驱动的collection和db对象,以及 mongo.newObjectId()等附加方法

test();


