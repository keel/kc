/*
CURD配置典型示例
 */
'use strict';
const cck = require('cck');
const path = require('path');
const kc = require('../../lib/kc');
// const db = kc.mongo.init();
const Pinyin = require('../../lib/pinyin'); //引入拼音首字母便于快速检索
const curd = require('./_curd');

//注: 这里使用非默认mongo库, 仅在同时连接多个数据库时使用, 一般不需要
kc.kconfig.reInit(false, path.join(__dirname, '../../config/test2.json'), null, 'test2');
const otherMongo = kc.mongo.reInit(false, 'test2');

// ======>注: 除tb,fields字段必填, 其余均为选填
const prop = {
  'tb': 'proj_p', //表名, 必填
  'tbName': '项目', //表名显示, 不填则为tb
  'db': otherMongo, //在使用不同数据库时与dbConf共同指定, 一般使用默认mongo即可省略此项配置
  'dbConf': 'test2', //配合db参数使用
  'fields': [ //必填
    //字段
    { 'col': 'name', 'name': '项目名', 'type': 'string' },
    { 'col': 'gameType', 'name': '类型', 'type': 'string' },
    { 'col': 'channel', 'name': '渠道', 'type': 'string' },

    //拼音首字母检索用
    { 'col': 'py', 'type': 'string', 'hide': 'all' },

    //以下字段建议所有表都保留
    { 'col': 'createTime', 'name': '创建时间', 'type': 'int', 'hide': 'add|update', 'formatter': (data) => { return cck.msToTime(data); } },
    { 'col': 'state', 'name': '状态', 'type': 'int', 'hide': 'add', 'validator': '@strInt' },
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

  'authPath': 'project', //权限路径,如不配置则仅按level判定权限(仍然要登录), 若配置则需要登录且登录账号具备此路径权限才可返回数据
};



const ci = curd.instance(prop);

exports.router = function() {
  return ci.router;
};




// const mk = require('../../lib/mkCurd.js');
// mk.make(prop);