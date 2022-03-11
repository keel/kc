/*
主入口,集成express
 */
'use strict';

const ktool = require('ktool');
const kconfig = ktool.kconfig;
const vlogClient = require('vlog');
let vlog = vlogClient.instance(__filename);
//直接初始化,注意这里kconfig初始化的信息不会在log插件中输出
kconfig.init();

if (kconfig.get('vlogRedisLevel')) {
  //如果配置了vlorRedisLevel，将使用这个作为vlog全局插件
  const vlogRedis = require('./vlogRedis').toRedisPlug(kconfig.get('vlogRedisLevel'));
  vlogClient.setPlugin(vlogRedis);
  vlog = vlogClient.instance(__filename);
  vlog.redisLog('config', kconfig.show());
}

const express = require('express');
const cck = require('cck');
const path = require('path');
const fs = require('fs');
const sessionAuth = require('./sessionAuth');
const renderTool = require('./renderTool');
const error = require('./error');
const iApi = require('./iApi');
const redis = require('./redis');
const mongo = require('./mongo');
const mysql = (kconfig.get('mysql') && kconfig.get('mysql.init')) ? require('./mysql') : null;
const influx = (kconfig.get('influx') && kconfig.get('influx.init')) ? require('./influx') : null;
const showFilter = require('./showFilter');
const iCache = require('./iCache');
const fail2ban = require('./fail2ban');
const auth = require('./auth');

const port = 15001;


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
const loadPages = function(dir, app, pageMiddleWare) {

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
    if (fArr.length < 2 || (fArr[0] !== 'p' && fArr[0] !== 'pa' && fArr[0] !== 'paa')) {
      return;
    }
    const router = express.Router();
    if (fArr[0].indexOf('pa') === 0) {
      router.use(sessionAuth.cookieCheck);
    }
    if (pageMiddleWare) {
      router.use(pageMiddleWare);
    }
    const pathName = basename.substring(basename.indexOf('_') + 1);
    if (fArr[0] === 'paa') {
      auth.addAuth(pathName);
    }
    router.get('*', function(req, resp, next) { // eslint-disable-line
      if (fArr[0] === 'paa' && req.sessionValue && req.sessionValue.userPermission && !req.sessionValue.userPermission[pathName]) {
        return resp.status(403).send(error.err.auth);
      }
      resp.send(renderTool.render()[basename]({ kc_userLevel: req.userLevel, kc_userId: req.userId, kc_mid: req.mid, kc_sessionValue: req.sessionValue }));
    });

    app.use('/' + pathName, router);
    vlog.log('loadPages:%j done.', pathName);
  });
};

const createApp = function(dir, pageMiddleWare) {

  //初始化相关组件
  const app = express();
  app.disable('x-powered-by');

  sessionAuth.init();
  fail2ban.init();

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

  let initDoneCout = 0;
  for (let i = 0,len = initsArr.length; i < len; i++) {
    const dbObj = initsArr[i];
    dbObj.init(function(err) {
      if (err) {
        vlog.eo(err, '');
        return;
      }
      initDoneCout++;
      if (initDoneCout >= len) {
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
      // 'maxAge': '1d'
    }));

    const p = appPort || port;

    loadApis(dirName + '/web/api', app);
    loadPages(dirName + '/web/tpls', app, pageMiddleWare);

    app.use('/', express.Router().all('*', function(req, res, next) { // eslint-disable-line
      res.status(404).send('KC404');
    }));
    app.use(function(err, req, res, next) { // eslint-disable-line
      vlog.error(err.stack);
      res.status(500).send('500001');
    });
    app.listen(p, function(err) {
      if (err) {
        vlog.error(err.stack);
      }
      vlog.info('==== kc ===> [%s] started at: [%d]', kconfig.get('project'), p);
      callback(null);
    });


  };
  return app;
};


exports.auth = auth;
exports.kconfig = kconfig;
exports.iCache = iCache;
exports.showFilter = showFilter;
exports.createApp = createApp;
exports.redis = redis;
exports.mongo = mongo;
if (kconfig.get('mysql') && kconfig.get('mysql.init')) {
  exports.mysql = mysql;
}
if (kconfig.get('influx') && kconfig.get('influx.init')) {
  exports.influx = influx;
}
exports.iApi = iApi;
exports.sessionAuth = sessionAuth;
exports.error = error;
exports.fail2ban = fail2ban;
exports.render = renderTool.render;
exports.doT = require('./doT');