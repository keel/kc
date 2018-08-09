/*
登录的api
 */
'use strict';
const cck = require('cck');
const kc = require('../../lib/kc');
const fail2ban = kc.fail2ban;
const iApi = kc.iApi;
const render = kc.render();
const db = kc.mongo.init();
const error = require('../error');
const sessionAuth = kc.sessionAuth;
const vlog = require('vlog').instance(__filename);
const apiKey = kc.kconfig.get('s$_apiKey');
const showLevel = 0;
const ueserTable = 'cp';

const login = function(req, resp, callback) {
  const reqDataArr = iApi.parseApiReq(req.body, apiKey);
  // vlog.log('reqData:%j',reqData);
  if (reqDataArr[0] !== 0) {
    return callback(null, { 're': reqDataArr[0] });
  }
  const reqData = reqDataArr[1];
  fail2ban.checkBan(reqData.loginName, (err, waitHours) => {
    if (err) {
      return callback(null, error.json('fail2ban', '登录失败次数过多，请等待 ' + waitHours + ' 小时后重试.'), 200);
    }
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
      },
      'limit': 1
    };
    // vlog.log('body:%j,options:%j', reqData, options);
    db.c(ueserTable).query(query, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'login:find', reqData));
      }
      if (!re || re.length <= 0) {
        fail2ban.failOne(reqData.loginName);
        return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 200);
      }
      //sessionSet示例,存入userName
      sessionAuth.sessionSet(req, resp, 'userName', re.userName);
      fail2ban.clear(reqData.loginName);
      sessionAuth.setAuthed(req, resp, re[0]._id, re[0].level, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'login:setAuthed', reqData), re, 500, 'cache');
        }
        callback(null, { 're': '0' });
      });
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
    '': {
      'showLevel': showLevel,
      'isXssFilter':true,
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
  router.get('*', function(req, resp, next) { // eslint-disable-line
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