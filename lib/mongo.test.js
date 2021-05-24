'use strict';

const vlog = require('vlog').instance(__filename);
const kconfig = require('ktool').kconfig;
const path = require('path');

//指定test2.json为测试用配置
kconfig.reInit(false, path.join(__dirname, '../config/test2.json'), 'default.json', 'default');

//最简单! 一句话方式执行数据库操作,会自动进行初始化和获取collection操作,logToDb为附加方法
require('./mongo').init().c('user').logToDb({ 'phone': '13311112223', 'name': 'hello' });



// //正常使用,在require时可直接init指定的配置文件
const mongo = require('./mongo').init();

// //同时多次初始化也只会实际调用一次初始化过程
const mongo2 = require('./mongo').init();

//不用异步方法等待初始化结束，可以直接执行操作,c方法获取collection后直接执行collection的方法
mongo.c('user').query({ 'phone': '13311112223' }, { limit: 3 }, (e, re) => {
  if (e) {
    return vlog.eo(e);
  }
  console.log('re1:%j', re);
});

const test = () => {
  //init后回调中执行也能支持
  mongo2.init((e) => {
    if (e) {
      return vlog.eo(e);
    }
    console.log('init OK');
    // 注意find方法与原生驱动是不同的，返回cursor
    mongo.c('user').find({ 'phone': '13311112223' }, { 'limit': 5 }, (e, cur) => {
      if (e) {
        return vlog.eo(e);
      }
      //这里需要toArray
      cur.toArray((e, re2) => console.log('re2:%j', re2));
    });

    //直接调用原生驱动
    mongo.c('user').updateOne({ 'phone': '18954202777' }, { '$set': { 'hh': 'aabb' } }, (e, re) => {
      if (e) {
        return vlog.eo(e);
      }
      console.log('re3:%j', re.result);
    });


    //新增加query方法补充原find方法，与find作用相同，内部会自动toArray，默认limit为20，如果超过需要指定
    mongo.c('user').query({ 'phone': '18954202777' }, { 'limit': 5 }, (e, re) => {
      if (e) {
        return vlog.eo(e);
      }
      console.log('re4:%j', re);

      //关闭mongo
      mongo.close((e) => {
        if (e) {
          return vlog.eo(e);
        }

        //强制重新初始化，这里会重新读取配置并强制初始化
        mongo.reInit(true);
      });
    });
  });
};


const test2 = function test2() {
  kconfig.reInit(false, path.join(__dirname, '../config/other.json'), 'env_other_config.json', 'other');
  const otherMongo = require('./mongo').reInit(false, 'other');
  // 注意这里c方法中要增加配置参数
  otherMongo.c('user', 'other').query({ 'phone': '13311112223' }, { limit: 2 }, (e, re) => {
    if (e) {
      return vlog.eo(e);
    }
    console.log('otherMongo:');
    console.log('re5:%j', re);
  });

};


const test3 = function test3() {
  (async function() {
    const re = await mongo.pc('user').pQuery({ 'phone': '13311112223' });
    console.log('pQuery re', re);
  })().catch((err) => {
    console.error(err);
  });
};

const test4 = function test4() {
  const pipeline = [
    { '$match': { 'phone': '13311112223' } },
    { '$group': { '_id': '$phone', 'count': { '$sum': 1 } } }
  ];

  (async function() {
    const re = await mongo.pc('user').pAggr(pipeline);
    console.log('pAggr', re);
  })().catch((err) => {
    console.error(err);
  });
};

//除以上方法外，还有getColl和getDb方法可以拿到原生驱动的collection和db对象,以及 mongo.newObjectId(),logToDb等附加方法

// test4();

// test2();

const test5 = function() {
  mongo.checkIndex('testbbb', {
    'createTime_-1': { 'createTime': -1 },
    'game_user_name_-1': { 'game_user_name': -1 },
    'game_user_pwd_-1': { 'game_user_pwd': -1 },
    'game_id_-1': { 'game_id': -1 },
  });
};
// test5();





//