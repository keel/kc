/*
标签
 */
'use strict';
const kc = require('../../lib/kc');
const render = kc.render();
// const Pinyin = kc.pinyin; //引入拼音首字母便于快速检索
const vlog = require('vlog').instance(__filename);
const curd = require('./_curd');
const db = kc.mongo.init();

const tb = 'tag';
const tbName = '标签';

const prop = {
  'tb': tb,
  'tbName': tbName,
  'col_id': '_id',
  'linkToOneColName': 'tag',
  'fields': [ //
    {
      'col': 'tag',
      'name': '标签名',
      'type': 'string',
      'search': 'string',
    },
    { 'col': 'desc', 'name': '说明', 'type': 'string', 'default': '' },
    {
      'col': 'creatorId',
      'name': '创建者',
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
  'listAllLevel': 5,
  'creatorFilter': 'creatorId',
  'authPath': tb,
  'curdLevel': [0, 0, 0, 0, 9],
  'downCsv': false,
  'plusApi': (req, resp, callback) => {
    const act = req.params.act;
    if (act === 'tags') {
      const selected = req.body.selected;
      const query = {'state': { '$gte': 0 } };
      if (req.userLevel < 10) {
        query.creatorId = req.userId;
      }
      db.c(prop.tb).query(query, { limit: 10000 }, (err, queryRe) => {
        if (err) {
          return callback(vlog.ee(err, 'tag.plusApi.tags'));
        }
        const out = [];
        if (queryRe && queryRe.length > 0) {
          for (let i = 0, len = queryRe.length; i < len; i++) {
            const one = queryRe[i];
            const item = { 'key': one.tag, 'val': one.tag, 'desc': one.desc };
            if (selected && selected.indexOf(one.tag) >= 0) {
              item.selected = 1;
            }
            out.push(item);
          }
        }
        callback(null, { 'code': 0, 'data': out });
      });
    } else {
      callback(null, { 'code': -1 });
    }
  },
};



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
    resp.send(render.list({ 'tb': prop.tb, 'tbName': prop.tbName, 'hideNew': !userPermission[prop.tb + '/add'] }));
  });
  return ci.router;
};

//服务启动时检查表索引
setTimeout(function() {
  db.checkIndex(prop.tb, {
    'tag_-1': { 'tag': -1 },
    'createTime_-1': { 'createTime': -1 },
    'creatorId_-1': { 'creatorId': -1 },
    'state_-1': { 'state': -1 },
  });
}, 1000);