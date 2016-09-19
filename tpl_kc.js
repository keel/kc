'use strict';

var kc = require('kc');
var path = require('path');
var kconfig = require('ktool').kconfig;
//初始化配置
kconfig.init(path.join(__dirname, 'config.json'));

//生成项目express主进程
var app = kc.createApp(__dirname, { 'isRedisInit': false, 'isMongoInit': false });


//增加非api和tpl的路由,如logout,此处为express的标准用法
app.get('/logout', kc.sessionAuth.logout);

//启动进程
app.start(kconfig.getConfig().startPort);
