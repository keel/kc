/*
登录的api
 */
'use strict';
const cck = require('cck');
const kc = require('../../lib/kc');
const iApi = kc.iApi;
const render = kc.render();
const db = kc.mongo;
const error = require('../error');
const sessionAuth = kc.sessionAuth;
const vlog = require('vlog').instance(__filename);

const showLevel = 0;
const ueserTable = 'userapi';

const login = function(req, resp, callback) {
  const reqDataArr = iApi.parseApiReq(req.body, 'test_client_key');
  // vlog.log('reqData:%j',reqData);
  if (reqDataArr[0] !== 0) {
    return callback(null, { 're': reqDataArr[0] });
  }
  const reqData = reqDataArr[1];
  const query = {
    'loginName': reqData.loginName,
    'loginPwd': reqData.loginPwd,
    'state': {
      '$gte': 0
    }
  };
  const options = {
    'fields': {
      'userName': 1,
      'level': 1
    }
  };
  // vlog.log('body:%j,options:%j', reqData, options);
  db.queryOneFromDb(ueserTable, query, options, function(err, re) {
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

const inputCheck = function(input) {
  const re = cck.check(input, 'strLen', [3, 18]);
  return re;
};


const iiConfig = {
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



exports.router = function() {

  const router = iApi.getRouter(iiConfig);

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
