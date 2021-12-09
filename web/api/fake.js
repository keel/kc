/*
模拟api
 */
'use strict';
// const cck = require('cck');
// const render = require('../lib/renderTool');
const iApi = require('../../lib/kc').iApi;
// const db = require('../lib/db');
const vlog = require('vlog').instance(__filename);  // eslint-disable-line
const urllib = require('url');
// const showLevel = 0;


const jsonP = function(content, req) {
  const params = urllib.parse(req.url, true);
  if (params.query.callback) {
    return params.query.callback + '(' + content + ')';
  }
  return content;
};


//-----------------以下设置模拟返回内容-----------------------


//模拟get请求,注意必须return
const fakeGet1 = function(req, resp) {  // eslint-disable-line
  const data = { 'hello': 'yes' };
  return iApi.makeApiResp(0, data);
};

//模拟jsonp的get请求,注意必须return
const fakeGetJsonP = function(req, resp) {  // eslint-disable-line
  const respObj = {
    're': 0,
    'data': 'this is get2'
  };

  return jsonP(JSON.stringify(respObj), req);
};



//模拟post请求,注意使用callback回调
const fakePost1 = function(req, resp, callback) {
  const re = { 'hello': '你好啊1' };


  callback(null, { 're': 0, 'data': re });
};


const fakePost2 = function(req, resp, callback) {
  const re = { 'hello': '你好啊2' };


  callback(null, { 're': 0, 'data': jsonP(re, req) });
};


const getApis = {
  'get1': fakeGet1,
  'get2': fakeGetJsonP
};

const postApis = {
  'post1': fakePost1,
  'post2': fakePost2
};


//-----------------设置模拟返回内容结束-----------------------










const makeIIConfig = function(postApis) {
  const iiConfig = {
    'auth': false,
    'act': {}
  };
  for (const path in postApis) {
    iiConfig.act[path] = {
      'resp': postApis[path]
    };
  }
  return iiConfig;
};

const makeGet = function(router, path, getApis) {
  router.get('/' + path, function(req, resp, next) {  // eslint-disable-line
    resp.status(200).send(getApis[path](req, resp));
  });
};

exports.router = function() {


  const iiConfig = makeIIConfig(postApis);

  // vlog.log('fake iiConfig:%j', iiConfig);

  const router = iApi.getRouter(iiConfig);


  //get方式
  for (const path in getApis) {
    makeGet(router, path, getApis);
  }

  return router;
};