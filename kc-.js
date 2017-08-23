'use strict';

const kc = require('./lib/kc');
const vlogRedis = require('./lib/vlogRedis');
const path = require('path');
const kconfig = require('ktool').kconfig;
const vlog = require('vlog').instance(__filename, vlogRedis);

const navMaker = function(req, resp, next) {
  // 可在此根据userId和userLevel创建导航菜单
  req.mid = {
    'groupA': {
      'menu1': 'path/to/menu1-' + req.userId,
      'menu2': 'path/to/menu2-' + req.userLevel,
      'menu4': 'path/to/menu4',
    }
  };
  next();
};
//生成项目express主进程
// const app = kc.createApp(__dirname);
const app = kc.createApp(__dirname, navMaker);

//附加有dbsInitOK事件会在redis,mongo.mysql初始化完成后触发
// app.on('dbsInitOK',function(err) {
//   if (err) {
//     vlog.eo(err, 'init:dbsInit');
//     return;
//   }
//   vlog.log('init Ok!!');
// });

//增加非api和tpl的路由,如logout,此处为express的标准用法
app.get('/logout', kc.sessionAuth.logout);

//启动进程
app.start(kconfig.get('startPort'));