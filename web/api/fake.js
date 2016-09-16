/*
模拟api
 */
'use strict';
// var cck = require('cck');
// var render = require('../lib/renderTool');
var iApi = require('../../lib/kc').iApi;
// var db = require('../lib/db');
// var error = require('./error');
var vlog = require('vlog').instance(__filename);
var urllib = require('url');
// var showLevel = 0;


var jsonP = function(content, req) {
  var params = urllib.parse(req.url, true);
  if (params.query.callback) {
    return params.query.callback + '(' + content + ')';
  }
  return content;
};


//-----------------以下设置模拟返回内容-----------------------


//模拟get请求,注意必须return
var fakeGet1 = function(req, resp) {
  var data = { 'hello': 'yes' };
  return iApi.makeApiResp(0, data);
};

//模拟jsonp的get请求,注意必须return
var fakeGetJsonP = function(req, resp) {
  var respObj = {
    're': 0,
    'data': 'this is get2'
  };

  return jsonP(JSON.stringify(respObj), req);
};



//模拟post请求,注意使用callback回调
var fakePost1 = function(req, resp, callback) {
  var re = { 'hello': '你好啊' };


  callback(null, { 're': 0, 'data': re });
};


var fakePost2 = function(req, resp, callback) {
  var re = { 'hello': '你好啊' };


  callback(null, { 're': 0, 'data': jsonP(re, req) });
};


var getApis = {
  'get1': fakeGet1,
  'get2': fakeGetJsonP
};

var postApis = {
  'post1': fakePost1,
  'post2': fakePost2
};


//-----------------设置模拟返回内容结束-----------------------










var makeIIConfig = function(postApis) {
  var iiConfig = {
    'auth': false,
    'act': {}
  };
  for (var path in postApis) {
    iiConfig.act[path] = {
      'resp': postApis[path]
    };
  }
  return iiConfig;
};

var makeGet = function(router, path, getApis) {
  router.get('/' + path, function(req, resp, next) {
    resp.status(200).send(getApis[path](req, resp));
  });
};

exports.router = function() {


  var iiConfig = makeIIConfig(postApis);

  // vlog.log('iiConfig:%j', iiConfig);

  var router = iApi.getRouter(iiConfig);


  //get方式
  for (var path in getApis) {
    makeGet(router, path, getApis);
  }

  return router;
};
