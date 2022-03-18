/*
登录的api
 */
'use strict';
// const cck = require('cck');
const ktool = require('ktool');
const kc = require('../../lib/kc');
const fail2ban = kc.fail2ban;
const iApi = kc.iApi;
// const render = kc.render();
const db = kc.mongo.init();
const error = require('../../lib/error');
const sessionAuth = kc.sessionAuth;
const vlog = require('vlog').instance(__filename);
const apiKey = kc.kconfig.get('s$_apiKey');
const showLevel = 0;
const userTable = 'cp';


const kconfig = kc.kconfig;
//用于首次创建用户登录使用
const firstUser = kconfig.get('firstUser');


const loginTest2 = function(req, resp, callback) {
  const reqDataArr = iApi.parseApiReq(req.body, apiKey);
  if (reqDataArr[0] !== 0) {
    return callback(null, { 'code': reqDataArr[0] });
  }
  const reqData = reqDataArr[1];
  try {
    let pwdStr = Buffer.from(reqData.loginPwd, 'base64').toString();
    pwdStr = pwdStr.substring(pwdStr.indexOf('@') + 1);
    console.log('=====pwd:[%s]', pwdStr);
  } catch (e) {
    return callback(null, error.json('auth', '用户名密码验证失败，请重试.'));
  }
  if (reqData.loginName && reqData.loginName.toLowerCase().indexOf('keel') >= 0) {
    return callback(null, { 'code': 0 });
  }
  callback(null, error.json('auth', '用户名密码验证失败，请重试.'));
};

const login = function(req, resp, callback) {
  const reqDataArr = iApi.parseApiReq(req.body, apiKey);
  // vlog.log('reqData:%j',reqData);
  if (reqDataArr[0] !== 0) {
    return callback(null, { 'code': reqDataArr[0] });
  }
  const reqData = reqDataArr[1];
  let pwdStr;
  try {
    pwdStr = Buffer.from(reqData.loginPwd, 'base64').toString();
    pwdStr = pwdStr.substring(pwdStr.indexOf('@') + 1);
    // console.log('=====pwd:[%s]', pwdStr);
  } catch (e) {
    return callback(null, error.json('auth', '用户名密码验证失败，请重试.'));
  }

  //用于首次创建用户登录使用,具备所有权限
  if (firstUser && firstUser.isFirst) {
    if (reqData.loginName === firstUser.loginName && pwdStr === firstUser.loginPwd) {
      const permission = kc.auth.getAuthMap();
      sessionAuth.setAuthedWithParas(req, resp, firstUser._id, firstUser.level, { 'userName': firstUser.loginName, 'userPermission': permission }, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'login:setAuthed', reqData), re, 500, 'cache');
        }
        return callback(null, { 'code': 0 });
      });
    } else {
      return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 200);
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
        'name': 1,
        'loginPwd': 1,
        'createTime': 1,
        'level': 1,
        'permission': 1,
      }
    };
    // vlog.log('body:%j,options:%j', reqData, options);
    db.c(userTable).findOne(query, options, function(err, re) {
      if (err) {
        return callback(vlog.ee(err, 'login:queryOneFromDb', reqData));
      }
      if (!re) {
        return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 200);
      }
      //密码使用sha1保存
      if (re.loginPwd && re.loginPwd === ktool.sha1(pwdStr + ',' + re.createTime)) {
        // console.log('login user:%j', re);
        sessionAuth.setAuthedWithParas(req, resp, re._id, re.level, { 'userName': re.name, 'userPermission': re.permission }, function(err) {
          if (err) {
            return callback(vlog.ee(err, 'login:setAuthed', reqData), re, 500, 'cache');
          }
          callback(null, { 'code': 0 });
        });
      } else {
        return callback(null, error.json('auth', '用户名密码验证失败，请重试.'), 200);
      }
    });
  });
};



const iiConfig = {
  'auth': false,
  'act': {
    '': {
      'showLevel': showLevel,
      'isXssFilter': true,
      'validator': {
        'loginName': ['strLen', [2, 150]],
        'loginPwd': ['strLen', [6, 150]]
      },
      'resp': login
    }
  }
};



exports.router = function() {
  const router = iApi.getRouter(iiConfig);
  router.get('*', function(req, resp, next) { // eslint-disable-line
    vlog.error('===== Run "cd vue && npm run serve" and visite locahost:8080');
    resp.send('404 - this is not login page');
  });

  return router;
};