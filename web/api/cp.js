/*
CURD配置典型示例,账号管理
 */
'use strict';
const path = require('path');
const ktool = require('ktool');
const kc = require('../../lib/kc');
const vlog = require('vlog').instance(__filename);
const Pinyin = require('../../lib/pinyin'); //引入拼音首字母便于快速检索
const curd = require('./_curd');


// const db = kc.mongo.init();
//这里使用非默认mongo库, 仅在同时连接多个数据库时使用, 一般使用上面一句即可
const dbConfName = 'test2';
kc.kconfig.reInit(false, path.join(__dirname, '../../config/test2.json'), null, dbConfName);
const db = kc.mongo.reInit(false, dbConfName);


// ======>注: 除tb,fields字段必填, 其余均为选填
const prop = {
  'tb': 'cp', //表名, 必填
  'tbName': '账号', //表名显示, 不填则为tb
  'db': db, //在使用不同数据库时与dbConf共同指定, 一般使用默认mongo即可省略此项配置
  'dbConf': dbConfName, //配合db参数使用
  'fields': [ //必填
    //字段
    { 'col': 'name', 'name': '账号名', 'type': 'string', 'search': 'string', 'validator': ['strLen', [2, 30]], },
    { 'col': 'loginName', 'name': '登录名', 'type': 'string', 'search': 'string', 'validator': ['strLen', [2, 30]], },
    { 'col': 'loginPwd', 'name': '密码', 'type': 'pwd', 'hide': 'add|list', 'input': { 'type': 'pwd' }, 'validator': ['@strLen', [6, 30]], },
    { 'col': 'level', 'name': '等级', 'type': 'int', 'input': { 'type': 'int' } },

    //拼音首字母检索用
    { 'col': 'py', 'type': 'string', 'hide': 'all' },

    //以下字段建议所有表都保留
    { 'col': 'state', 'name': '状态', 'type': 'int', 'hide': 'add', 'validator': '@strInt', 'input': { 'type': 'int' } },
    { 'col': 'createTime', 'name': '创建时间', 'type': 'int', 'hide': 'add|update', 'input': { 'type': 'datetime' } },
    { 'col': 'creatorId', 'type': 'string', 'hide': 'all' },
  ],

  'listSort': {
    'createTime': -1,
  },

  'onAdd': function(req, reqData, callback) {
    reqData.state = 0;
    reqData.createTime = Date.now();
    reqData.creatorId = req.userId;
    reqData.py = (reqData.name) ? Pinyin.getPY(reqData.name) : ''; //拼音首字母检索用
    callback(null, reqData);
  },
  'onOne': function(req, oneData, callback) {
    oneData.loginPwd = ''; //置空密码不返回
    callback(null, oneData);
  },
  onUpdate(req, reqData, callback) {
    if (!reqData.loginPwd) {
      return callback(null, reqData);
    }
    const oldOne = kc.iCache.getSync('cp:_id:' + reqData._id);
    if (oldOne) {
      //重新根据缓存计算密码
      reqData.loginPwd = mkPwd(reqData.loginPwd, oldOne.createTime);
      callback(null, reqData);
    } else {
      //没有缓存则从表中查找
      db.c(prop.tb, dbConfName).findOne({ '_id': db.idObj(reqData._id) }, (err, fineOne) => {
        if (err) {
          return callback(vlog.ee(err, ''));
        }
        if (fineOne) {
          //重新根据缓存计算密码
          reqData.loginPwd = mkPwd(reqData.loginPwd, fineOne.createTime);
          return callback(null, reqData);
        } else {
          delete reqData.loginPwd;
          callback(null, reqData);
        }
      });
    }
  },

  'authPath': 'cp', //权限路径,如不配置则仅按level判定权限(仍然要登录), 若配置则需要登录且登录账号具备此路径权限才可返回数据
};

const mkPwd = function(pwdStr, createTime) {
  const newPwd = pwdStr.trim() + ',' + createTime;
  return ktool.sha1(newPwd);
};

const ci = curd.instance(prop);

exports.router = function() {
  return ci.router;
};

db.checkIndex(prop.tb, {
  'createTime_-1': { 'createTime': -1 },
  'name_-1': { 'name': -1 },
  'state_-1': { 'state': -1 },
}, false, dbConfName);

// const mk = require('../../lib/mkCurdVue.js');
// mk.make(prop);