/*
用户的api
 */
'use strict';
// var cck = require('cck');
// var render = require('../lib/renderTool');
var kc = require('../../lib/kc');
var iApi = kc.iApi;
// var db = require('../lib/db');
// var error = require('./error');
// var vlog = require('vlog').instance(__filename);

// var showLevel = 0;
var test = function(req, resp, callback) {
  var re = { 'hello': '你好' };



  callback(null, { 're': 'ok', 'test': re });
};

var test2 = function(req, resp, callback) {
  var re = { 'aaa': '你好' };



  callback(null, { 're': 'ok', 'test': re });
};


var iiConfig = {
  'auth': false,
  'act': {
    'test': {
      'resp': test
    },
    'test2': {
      'resp': test2
    }
  }
};




exports.router = function() {

  var router = iApi.getRouter(iiConfig);

  //get方式
  router.get('*', function(req, resp, next) {
    resp.status(200).send('{"re":"ok","test":"hello"}');
  });
  return router;
};
