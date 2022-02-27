/*
CURD配置典型示例,简略示例
 */
'use strict';
const kc = require('../../lib/kc');
const Pinyin = kc.pinyin; //引入拼音首字母便于快速检索
const curd = require('./_curd');


// ======>注: 除tb,fields字段必填, 其余均为选填
const prop = {
  'tb': 'proj_p', //表名, 必填
  'tbName': '项目', //表名显示, 不填则为tb
  // 'db': db, //在使用不同数据库时与dbConf共同指定, 一般使用默认mongo即可省略此项配置
  // 'dbConf': dbConfName, //配合db参数使用
  'fields': [ //必填
    //字段
    { 'col': 'name', 'name': '项目名', 'type': 'string', 'search': 'string', 'validator': ['strLen', [2, 30]], },
    {
      'col': 'gameType',
      'name': '类型',
      'type': 'string',
      'input': {
        'type': 'radio',
        'pickNum': 0,
        'options': [
          { 'key': 'APK', 'val': 'APK' },
          { 'key': 'H5', 'val': 'H5' },
        ]
      },
    },
    { 'col': 'channel', 'name': '渠道', 'type': 'string' },

    //拼音首字母检索用
    { 'col': 'py', 'type': 'string', 'hide': 'all' },

    //以下字段建议所有表都保留
    { 'col': 'state', 'name': '状态', 'type': 'int', 'hide': 'add', 'validator': { 'optional': 'all', 'validator': 'strInt' }, 'input': { 'type': 'int' } },
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

  'authPath': 'proj_p', //权限路径,如不配置则仅按level判定权限(仍然要登录), 若配置则需要登录且登录账号具备此路径权限才可返回数据
};



const ci = curd.instance(prop);

exports.router = function() {
  return ci.router;
};

const db = kc.mongo.init();

//服务启动时检查表索引
db.checkIndex(prop.tb, {
  'createTime_-1': { 'createTime': -1 },
  'name_-1': { 'name': -1 },
  'state_-1': { 'state': -1 },
  'py_-1': { 'py': -1 },
});


// const mk = kc.mkCurdVue;
// mk.make(prop, __dirname);