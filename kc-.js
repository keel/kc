'use strict';

const kc = require('./lib/kc');
const kconfig = kc.kconfig;
const vlog = require('vlog').instance(__filename);
// const path = require('path');

//为方便本地测试, 这里使用测试配置文件替代原default.json
//[#{comm]
kconfig.setDefaultConf('test2.json');
kconfig.reInit(true);
//[#}comm]

//生成项目express主进程
const app = kc.createApp(__dirname);
// const app = kc.createApp(__dirname, pageMiddleWare);

//附加有dbsInitOK事件会在redis,mongo.mysql初始化完成后触发
//载入全表缓存
app.on('dbsInitOK', function(err) {
  if (err) {
    vlog.eo(err, 'init:dbsInit');
    return;
  }
  const cacheTables = [
    'product#_id,name#{"state":{"$gte":0}}#{}',
    'cp#_id#{"state":{"$gte":0}}#{}',
  ];
  kc.iCache.cacheMake('mem', 'mongo', cacheTables, function(err) {
  // kc.iCache.cacheMakeWithConf('mem', 'mongo', cacheTables, dbConfName, function(err) { //这里使用了非默认mongo配置test2,一般使用cacheMake即可
    if (err) {
      vlog.eo(err, 'cacheMake', cacheTables);
      return;
    }
    vlog.log('===> cacheTables done.');
    //打印所有权限
    vlog.log('===> authMap:%j',kc.auth.getAuthMap());
  });
});

//增加非api和tpl的路由,如logout,此处为express的标准用法
app.post('/logout', kc.sessionAuth.logout);

//启动进程
app.start(kconfig.get('startPort'));