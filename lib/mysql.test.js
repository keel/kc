'use strict';

const vlog = require('vlog').instance(__filename);

const kconfig = require('ktool').kconfig;
const path = require('path');

//最简单! 一句话方式执行数据库操作,会自动进行初始化和获取collection操作
require('./mysql').init().c().query('insert into tt1 set phone = "11111111111",province="unknown",fee=0');



//正常使用,在require时可直接init指定的配置文件
const mysql = require('./mysql').init();

//同时多次初始化也只会实际调用一次初始化过程
const mysql2 = require('./mysql').init();

//不用异步方法等待初始化结束，可以直接执行操作,c方法获取collection后直接执行collection的方法
mysql.c().query('select * from tt1 limit 3', (e, re) => {
  if (e) {
    return vlog.eo(e);
  }
  console.log('re1:%j', re);
});

const test = () => {
  //init后回调中执行也能支持
  mysql2.init((e) => {
    if (e) {
      return vlog.eo(e);
    }
    console.log('init OK');
    // 注意find方法与原生驱动是不同的，返回cursor
    mysql.c().query('insert into tt1 set phone = "11111111112",province="unknown",fee=0', (e, re) => {
      if (e) {
        return vlog.eo(e);
      }
      console.log('re2:', re);
      //关闭mysql
      mysql.close((e) => {
        if (e) {
          return vlog.eo(e);
        }

        //强制重新初始化，这里会重新读取配置并强制初始化
        mysql.reInit(true);
      });
    });
  });
};

// 加载另一配置
const test2 = function test2() {
  kconfig.reInit(false, path.join(__dirname, '../config/other.json'), 'env_other_config.json', 'other');
  const otherMysql = require('./mysql').reInit(false, 'other');
  // 注意这里c方法中可增加配置参数,其他配置参数在第三个，前两个是clusterNode, clusterSelector，不可省略
  otherMysql.c(null, null, 'other').query('select * from tt1 limit 3', (e, re) => {
    if (e) {
      return vlog.eo(e);
    }
    console.log('re3:%j', re);
  });
};

//除以上方法外，还有getColl和getDb方法可以拿到原生驱动的collection和db对象,以及 mysql.newObjectId()等附加方法
test();
test2();