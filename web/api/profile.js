/*
显示修改账号自身信息
 */
'use strict';
const ktool = require('ktool');
const kc = require('../../lib/kc');
const iApi = kc.iApi;
const error = require('../../lib/error');
const vlog = require('vlog').instance(__filename);

const showLevel = 0;
const userTable = 'cp';

const db = kc.mongo.init();


const update = function(req, resp, callback) {
  db.c(userTable).findOne({ '_id': db.idObj(req.userId) }, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'updateProfile:queryOneFromDb', req.body));
    }
    if (!re) {
      return error.apiErr('无此用户', callback, 'updateProfile');
    }
    const updateSet = { '$set': req.body };
    delete updateSet['$set']['createTime']; //createTime不可修改,需要参与计算loginPwd
    delete updateSet['$set']['level']; //level不可修改
    delete updateSet['$set']['state']; //state不可修改
    //密码使用sha1保存
    const loginPwd = req.body.loginPwd.trim();
    if (loginPwd) {
      const newLoginPwd = ktool.sha1(loginPwd + ',' + re.createTime);
      updateSet['$set']['loginPwd'] = newLoginPwd;
    } else {
      delete updateSet['$set']['loginPwd'];
    }
    db.c(userTable).updateOne({ '_id': db.idObj(req.userId) }, updateSet, (err) => {
      if (err) {
        return callback(vlog.ee(err, 'updateProfile'));
      }
      callback(null, { 're': '0' });
    });
  });
};

const showUpdate = function(req, resp, next) { // eslint-disable-line
  db.c(userTable).findOne({ '_id': db.idObj(req.userId) }, (err, re) => {
    if (err) {
      vlog.eo(err, 'profileShowUpdate', req.userId);
      resp.send(error.json('showId', '显示账号信息错误'));
      return;
    }
    if (re) {
      delete re.loginPwd; //不返回密码
      resp.send(JSON.stringify({ 'code': 0, 'data': re }));
      return;
    }
    //注意firstUser(配置中的临时首次登录账号), 这里仅作为演示, 无法实现修改, 正式上线可删除此段
    const firstUser = ktool.clone(kc.kconfig.get('firstUser'));
    if (firstUser && firstUser.isFirst) {
      delete firstUser.loginPwd;
      resp.send(JSON.stringify({ 'code': 0, 'data': firstUser }));
      return;
    }
    resp.send(error.json('showId', '获取账号信息失败'));
  });
};

const iiConfig = {
  'auth': true,
  'authPath':'profile',
  'authName':'账号信息',
  'act': {
    'update': {
      'showLevel': showLevel,
      'validator': {},
      'resp': update,
      'authName':'-更新',
    },
    'show': {
      'showLevel': showLevel,
      'resp': showUpdate,
      'authName':'-显示',
      'authPath': 'profile/list', //用list标记显示权限
    }
  }
};


exports.router = function() {
  const router = iApi.getRouter(iiConfig);
  router.get('*', (req, resp, next) => { resp.send(error.json('404')); });
  return router;
};