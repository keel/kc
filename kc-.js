'use strict';

const kc = require('./lib/kc');
const path = require('path');
const kconfig = kc.kconfig;
const vlog = require('vlog').instance(__filename);


//生成项目express主进程
// const app = kc.createApp(__dirname);
const app = kc.createApp(__dirname);

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