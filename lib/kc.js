/*
主入口,集成express
 */
'use strict';


const express = require('express');
const cck = require('cck');
const path = require('path');
const fs = require('fs');
const ktool = require('ktool');
const vlog = require('vlog').instance(__filename);
const sessionAuth = require('./sessionAuth');
const renderTool = require('./renderTool');
const error = require('./error');
const iApi = require('./iApi');
const redis = require('./redis');
const mongo = require('./mongo');
const mysql = require('./mysql');
const kconfig = ktool.kconfig;

const port = 16001;

//直接初始化
kconfig.init();

/**
 * 遍历指定目录下的.js文件(下划线开头的文件会忽略),进行require并use其router方法
 * @param  {string} dir
 * @param  {express()} app
 * @return {void}
 */
const loadApis = function(dir, app) {

  const req = function(fileName) {
    const api = require(path.relative(__dirname, dir + '/' + fileName));
    if (!cck.check(api.router, 'function')) {
      vlog.error('loadApis failed:%j', fileName);
      return;
    }
    const basename = path.basename(fileName, '.js');
    app.use('/' + basename, api.router());
    vlog.log('loadApis:%j done.', basename);
  };

  fs.readdirSync(dir).forEach(function(file) {
    if (file[0] === '_') {
      return;
    }
    const ext = path.extname(file);
    const stats = fs.statSync(dir + '/' + file);
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
const loadPages = function(dir, app) {

  fs.readdirSync(dir).forEach(function(file) {
    const stats = fs.statSync(dir + '/' + file);
    if (!stats.isFile()) {
      return;
    }
    if (path.extname(file) !== '.jst') {
      return;
    }
    const basename = path.basename(file, '.jst');
    const fArr = basename.split('_');
    if (fArr.length < 2 || (fArr[0] !== 'p' && fArr[0] !== 'pa')) {
      return;
    }
    const router = express.Router();
    if (fArr[0] === 'pa') {
      router.use(sessionAuth.cookieCheck);
    }
    const pathName = basename.substring(basename.indexOf('_') + 1);
    router.get('*', function(req, resp, next) {
      resp.send(renderTool.render()[basename]({ kc_userLevel: req.userLevel, kc_userId: req.userId }));
    });

    app.use('/' + pathName, router);
    vlog.log('loadPages:%j done.', pathName);
  });
};

const createApp = function(dir) {

  //初始化相关组件
  const app = express();


  sessionAuth.init();

  const initsArr = [];
  if (kconfig.get('redis') && kconfig.get('redis.init')) {
    initsArr.push(redis);
  }
  if (kconfig.get('mongo') && kconfig.get('mongo.init')) {
    initsArr.push(mongo);
  }
  if (kconfig.get('mysql') && kconfig.get('mysql.init')) {
    initsArr.push(mysql);
  }

  for (let i = 0, len = initsArr.length; i < len; i++) {
    const dbObj = initsArr[i];
    dbObj.init(function(err) {
      if (err) {
        vlog.eo(err, '');
        return;
      }
      initsArr.shift();
      if (initsArr.length <= 0) {
        app.emit('dbsInitOK');
      }
    });
  }


  iApi.init();
  renderTool.init(dir);
  //初始步结束

  const dirName = dir || __dirname;

  app.start = function(appPort, callback) {
    callback = callback || function(err) {
      if (err) {
        return vlog.eo(err, 'app.start');
      }
    };
    app.use(express.static(dirName + '/web/public', {
      'maxAge': '1d'
    }));

    const p = appPort || port;

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
      vlog.log('==== kc ===> [%s] started at: [%d]', kconfig.get('project'), p);
      callback(null);
    });


  };
  return app;
};



exports.createApp = createApp;
exports.redis = redis;
exports.mongo = mongo;
exports.mysql = mysql;
exports.iApi = iApi;
exports.sessionAuth = sessionAuth;
exports.error = error;
exports.render = renderTool.render;