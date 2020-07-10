/*
登录的api
 */
'use strict';
const cck = require('cck');
const ktool = require('ktool');
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
const userTable = 'cp';


//用于首次创建用户登录使用
const firstUser = kc.kconfig.get('firstUser');

const login = function(req, resp, callback) {
  const reqDataArr = iApi.parseApiReq(req.body, apiKey);
  // vlog.log('reqData:%j',reqData);
  if (reqDataArr[0] !== 0) {
    return callback(null, { 're': reqDataArr[0] });
  }
  const reqData = reqDataArr[1];



  //用于首次创建用户登录使用
  if (firstUser && firstUser.isFirst) {
    if (reqData.loginName === firstUser.loginName && reqData.loginPwd === firstUser.loginPwd) {
      sessionAuth.setAuthed(req, resp, firstUser._id, firstUser.level, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'login:setAuthed', reqData), re, 500, 'cache');
        }
        return callback(null, { 're': '0' });
      });
    }else{
      return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 403);
    }
    return;
  }


  fail2ban.checkBan(reqData.loginName, (err, waitHours) => {
    if (err) {
      return callback(null, error.json('fail2ban', '登录失败次数过多，请等待 ' + waitHours + ' 小时后重试.'), 200);
    }
    const query = {
      'loginName': reqData.loginName,
      // 'loginPwd': reqData.loginPwd,
      'state': {
        '$gte': 0
      }
    };
    const options = {
      'projection': {
        'userName': 1,
        'loginPwd': 1,
        'createTime': 1,
        'level': 1
      }
    };
    // vlog.log('body:%j,options:%j', reqData, options);
    db.c(userTable).findOne(query, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'login:queryOneFromDb', reqData));
      }
      if (!re) {
        return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 403);
      }
      //密码使用sha1保存
      if (re.loginPwd && re.loginPwd === ktool.sha1(reqData.loginPwd + ',')) {
        sessionAuth.setAuthed(req, resp, re._id, re.level, function(err, re) {
          if (err) {
            return callback(vlog.ee(err, 'login:setAuthed', reqData), re, 500, 'cache');
          }
          callback(null, { 're': '0' });
        });
      } else {
        return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 403);
      }
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
      'isXssFilter': true,
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