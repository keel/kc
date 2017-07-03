/*
主入口,集成express
 */
'use strict';


var express = require('express');
var cck = require('cck');
var path = require('path');
var fs = require('fs');
var ktool = require('ktool');
var vlog = require('vlog').instance(__filename);
var sessionAuth = require('./sessionAuth');
var renderTool = require('./renderTool');
var mongo = require('./mongo');
var mysql = require('./mysql');
var redis = require('./redis');
var error = require('./error');
var iApi = require('./iApi');


var port = 16001;

/**
 * 遍历指定目录下的.js文件(下划线开头的文件会忽略),进行require并use其router方法
 * @param  {string} dir
 * @param  {express()} app
 * @return {void}
 */
var loadApis = function(dir, app) {

  var req = function(fileName) {
    var api = require(path.relative(__dirname, dir + '/' + fileName));
    if (!cck.check(api.router, 'function')) {
      vlog.error('loadApis failed:%j', fileName);
      return;
    }
    var basename = path.basename(fileName, '.js');
    app.use('/' + basename, api.router());
    vlog.log('loadApis:%j done.', basename);
  };

  fs.readdirSync(dir).forEach(function(file) {
    if (file[0] === '_') {
      return;
    }
    var ext = path.extname(file);
    var stats = fs.statSync(dir + '/' + file);
    if (!stats.isFile()) {
      return;
    }
    if (stats.isFile() && !(ext in require.extensions)) {
      return;
    }
    req(file);
  });
};


/**
 * 载入普通的页面
 * @param  {string} dir 目录
 * @param  {express} app
 * @return {void}
 */
var loadPages = function(dir, app) {

  fs.readdirSync(dir).forEach(function(file) {
    var stats = fs.statSync(dir + '/' + file);
    if (!stats.isFile()) {
      return;
    }
    if (path.extname(file) !== '.jst') {
      return;
    }
    var basename = path.basename(file, '.jst');
    var fArr = basename.split('_');
    if (fArr.length < 2 || (fArr[0] !== 'p' && fArr[0] !== 'pa')) {
      return;
    }
    var router = express.Router();
    if (fArr[0] === 'pa') {
      router.use(sessionAuth.cookieCheck);
    }
    var pathName = basename.substring(basename.indexOf('_') + 1);
    router.get('*', function(req, resp, next) {
      resp.send(renderTool.render()[basename]({ kc_userLevel: req.userLevel, kc_userId: req.userId }));
    });

    app.use('/' + pathName, router);
    vlog.log('loadPages:%j done.', pathName);
  });
};

var createApp = function(dir, options) {
  var configFile;
  if (!options || !options.configFile) {
    configFile = dir + '/config.json';
  }
  var configFileStats = fs.statSync(configFile);
  if (!configFileStats.isFile()) {
    vlog.error('configFile not exist! configFile:%s', configFile);
    return;
  }
  //初始化相关组件
  var app = express();

  var config = ktool.kconfig.init(configFile);
  sessionAuth.init(configFile);

  var inits = [];
  if (config.redis && config.redis.init) {
    inits.push(redis);
  }
  if (config.mongo && config.mongo.init) {
    inits.push(mongo);
  }
  if ((config.mysql && config.mysql.init) || (config.mysqlCluster && config.mysqlCluster.init)) {
    inits.push(mysql);
  }
  for (var i = 0; i < inits.length; i++) {
    inits[i].init(configFile, function(err) {
      if (err) {
        vlog.eo(err, '');
        return;
      }
      inits.shift();
      if (inits.length <= 0) {
        app.emit('dbsInitOK');
      }
    });
  }


  iApi.init(configFile);
  renderTool.init(dir);
  //初始步结束

  var dirName = dir || __dirname;

  app.start = function(appPort, callback) {
    callback = callback || function(err) {
      if (err) {
        return vlog.eo(err, 'app.start');
      }
    };
    app.use(express.static(dirName + '/web/public', {
      'maxAge': '1d'
    }));

    var p = appPort || port;

    loadApis(dirName + '/web/api', app);
    loadPages(dirName + '/web/tpls', app);

    app.use('/', express.Router().all('*', function(req, res, next) {
      res.status(404).send('KC404');
    }));
    app.use(function(err, req, res, next) {
      vlog.error(err.stack);
      res.status(500).send('500001');
    });
    app.listen(p, function(err) {
      if (err) {
        vlog.error(err.stack);
      }
      vlog.log('==== kc ===> [%s] started at: [%d]', config.project, p);
      callback(null);
    });


  };
  return app;
};



exports.createApp = createApp;
exports.mongo = mongo;
exports.mysql = mysql;
exports.redis = redis;
exports.iApi = iApi;
exports.sessionAuth = sessionAuth;
exports.error = error;
exports.render = renderTool.render;
