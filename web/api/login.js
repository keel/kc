/*
登录的api
 */
'use strict';
var cck = require('cck');
var kc = require('../../lib/kc');
var iApi = kc.iApi;
var render = kc.render();
var db = kc.db;
var error = require('../error');
var sessionAuth = kc.sessionAuth;
var vlog = require('vlog').instance(__filename);

var showLevel = 0;

var login = function(req, resp, callback) {
  var reqData = iApi.parseApiReq(req.body,'test_client_key','test_client_secret');
// vlog.log('reqData:%j',reqData);
  var query = {
    'loginName': reqData.loginName,
    'loginPwd': reqData.loginPwd,
    'state': {
      '$gte': 0
    }
  };
  var options = {
    'fields': {
      'userName': 1,
      'level': 1
    }
  };
  // vlog.log('body:%j,options:%j', reqData, options);
  db.queryOneFromDb('user', query, options, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'login:queryOneFromDb', reqData));
    }
    if (!re) {
      return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 403);
    }
    sessionAuth.setAuthed(req, resp, re._id, re.level, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'login:setAuthed', reqData), re, 500, 'cache');
      }
      callback(null, { 're': '0' });
    });
  });
};

var inputCheck = function(input) {
  var re = cck.check(input, 'strLen', [3, 18]);
  return re;
};


var iiConfig = {
  'auth': false,
  'act': {
    //空字符串表示仅有一个顶级动作,无二级动作
    '': {
      'showLevel': showLevel,
      'validator': {
        'loginName': inputCheck,
        'loginPwd': inputCheck
      },
      'resp': login
    }
  }
};



exports.router = function () {

  var router = iApi.getRouter(iiConfig);

  router.get('*', function(req, resp, next) {
    resp.send(render.login());
    // if (req.userLevel < showLevel) {
    //   resp.status(404).send('40401');
    //   return;
    // }
    // resp.send(render.user({
    //   level: req.userLevel,
    //   cpid: req.userId
    // }));
  });

  return router;
};
