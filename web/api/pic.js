/*
图片
 */
'use strict';
const kc = require('../../lib/kc');
const render = kc.render();
// const Pinyin = kc.pinyin; //引入拼音首字母便于快速检索
const vlog = require('vlog').instance(__filename);
const curd = require('./_curd');
const db = kc.mongo.init();
const upload = require('./upload');
const path = require('path');
const fs = require('fs');

const tb = 'pic';
const tbName = '图片';

const prop = {
  'tb': tb,
  'tbName': tbName,
  'col_id': '_id',
  'linkToOneColName': 'name',
  'fields': [ //
    {
      'col': 'name',
      'name': '图片名',
      'type': 'string',
      'search': 'string',
    },
    { 'col': 'url', 'name': '图片url', 'type': 'string' },
    {
      'col': 'tags',
      'name': '标签',
      'type': 'array',
      'hide': 'list',
      'default': [],
      'input': {
        'type': 'multiSelect',
        'url': '../tag/plusApi/tags', //详情页要有../，列表页无../
        //'options': [{ 'key': 'H5', 'val': 'H5' },{ 'key': 'APK', 'val': 'APK' }], //使用url或options,2选1
      },
      'search': 'string',
    },
    {
      'col': 'creatorId',
      'name': '作者',
      'type': 'string',
      'hide': 'add|update',
      'formatter': (creatorId) => {
        const caObj = kc.iCache.getSync('cp:_id:' + creatorId);
        if (!caObj) {
          return creatorId;
        }
        return caObj.name;
      }
    },
    {
      'col': 'state',
      'name': '状态',
      'type': 'int',
      'hide': 'add|list',
      'input': { 'type': 'int' }
    },
    { 'col': 'createTime', 'name': '创建时间', 'type': 'datetime', 'hide': 'add|update', 'input': { 'type': 'datetime' }, 'search': 'datetime', },
    // { 'col': 'py', 'type': 'string', 'hide': 'all' }, //拼音首字母,检索用,所有界面均不显示
  ],
  'listSort': {
    'createTime': -1,
  },

  'onAdd': function(req, reqData, callback) {
    reqData.createTime = Date.now();
    reqData.state = 0;
    // newObj.py = Pinyin.getPY(newObj.name);

    const creatorId = (req.userLevel >= 10) ? (req.body.storeId || '') : req.userId;
    reqData.creatorId = creatorId;
    callback(null, reqData);
  },
  'onUpdate': function(req, reqData, callback) {
    delete reqData.createTime;
    callback(null, reqData);
  },

  'creatorFilter': 'creatorId',
  'authPath': tb,
  'curdLevel': [0, 0, 0, 0, 9],
  'downCsv': false,

};


//文件上传示例,这里uploadImg为路径upload/uploadImg，同时也是upload.js中的act
upload.addUploadAction('uploadImg', function(file, fields, resp) {

  // vlog.log('uploadActions:datafilter: file:%j, fields:%j', file, fields);

  vlog.log('上传图片成功:', file.filepath);
  const newPath = path.join(path.dirname(file.filepath), file.originalFilename);
  fs.renameSync(file.filepath, newPath);
  vlog.log('重命名:', newPath);
  resp.send('' + newPath.substring(newPath.indexOf('uploads')));

});


const ci = curd.instance(prop);


exports.router = function() {
  ci.router.get('/:id', function(req, resp, next) { // eslint-disable-line
    const userPermission = req.sessionValue.userPermission;
    if (!userPermission[prop.tb + '/one']) {
      resp.send('无权限');
      return;
    }
    resp.send(render.detail({ 'rootPath': '../', 'tb': prop.tb, 'id': req.params.id, 'tbName': prop.tbName, 'showUpdate': !!userPermission[prop.tb + '/update'], 'showDel': !!userPermission[prop.tb + '/del'] }));
  });
  ci.router.get('*', function(req, resp, next) { // eslint-disable-line
    // console.log('userInfo====>', req.sessionValue, req.userId, req.userLevel, req.userIp);
    const userPermission = req.sessionValue.userPermission;
    if (!userPermission[prop.tb + '/list']) {
      resp.send('无权限');
      return;
    }
    resp.send(render.list({ 'tb': prop.tb, 'tbName': prop.tbName, 'hideNew': !userPermission[prop.tb + '/add'], 'isImgs': true }));
  });
  return ci.router;
};

//服务启动时检查表索引
setTimeout(function() {
  db.checkIndex(prop.tb, {
    'name_-1': { 'name': -1 },
    'tags_-1': { 'tags': -1 },
    'createTime_-1': { 'createTime': -1 },
    'creatorId_-1': { 'creatorId': -1 },
    'state_-1': { 'state': -1 },
  });
}, 1000);