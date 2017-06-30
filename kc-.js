'use strict';

var kc = require('./lib/kc');
var path = require('path');
var kconfig = require('ktool').kconfig;
//初始化配置
kconfig.init(path.join(__dirname, 'config.json'));

//生成项目express主进程
// var app = kc.createApp(__dirname, { 'configFile': path.join(__dirname, 'config.json') });
var app = kc.createApp(__dirname);

//附加有dbsInitOK事件会在redis,mongo.mysql初始化完成后触发
// app.on('dbsInitOK',function(err) {
//   if (err) {
//     console.error(err);
//     return;
//   }
//   console.log('init Ok!!');
// });

//增加非api和tpl的路由,如logout,此处为express的标准用法
app.get('/logout', kc.sessionAuth.logout);

//启动进程
app.start(kconfig.getConfig().startPort);
