/*
CURD配置典型示例,账号管理
 */
'use strict';
const ktool = require('ktool');
const kc = require('../../lib/kc');
const vlog = require('vlog').instance(__filename);
const Pinyin = kc.pinyin; //引入拼音首字母便于快速检索
const curd = require('./_curd');


const db = kc.mongo.init();


const adminLevel = 10; //可进行权限配置的level等级



const mkPwd = function(pwdStr, createTime) {
  const newPwd = pwdStr.trim() + ',' + createTime;
  return ktool.sha1(newPwd);
};

//显示权限树
const authMap = function(req, resp, callback) {
  if (req.userLevel < 10) {
    return resp.send('{"code":0}');
  }
  const authMap = kc.auth.getAuthMap();
  const cp = kc.iCache.getSync('cp:_id:' + req.body.uid);
  const showUpdate = (kc.auth.auth(req, 'cp/authSave')) ? 1 : 0;
  if (!cp || !cp.permission) {
    return resp.send(JSON.stringify({ 'code': 0, 'data': authMap, showUpdate }));
  }
  if (cp.permission) {
    const permission = JSON.parse(cp.permission);
    for (const i in permission) {
      if (!authMap[i]) {
        // authMap[i] = { 'name': i };
        continue;
      }
      authMap[i].check = (permission[i]) ? 1 : 0;
      // console.log('authMap i:%j, p:%j',i,permission[i],authMap[i]);
    }
  }
  resp.send(JSON.stringify({ 'code': 0, 'data': authMap, showUpdate }));
};

//更新权限
const authSave = function(req, resp, callback) {
  if (req.userLevel < adminLevel) {
    return resp.send('{}');
  }
  const re = { 'code': 0, 'data': '权限保存成功!' };
  const cp = kc.iCache.getSync('cp:_id:' + req.body.uid);
  if (!cp) {
    re.code = 1;
    re.data = '用户不存在';
    return resp.send(re);
  }
  const data = req.body.data;
  const permission = {};
  for (let i = 0, len = data.length; i < len; i++) {
    permission[data[i]] = 1;
  }
  // console.log('save permission%j', permission);
  db.c(prop.tb).updateOne({ '_id': db.idObj(req.body.uid) }, { '$set': { 'permission': permission } }, (err) => {
    if (err) {
      vlog.eo(err, 'authSave', req.body);
      resp.send({ 'code': 2, 'data': '服务器保存失败,请联系管理员!' });
      return;
    }
    resp.send(re);
    refreshCache(req.body.uid);
  });
};

// ======>注: 除tb,fields字段必填, 其余均为选填
const prop = {
  'tb': 'cp', //表名, 必填
  'tbName': '账号管理', //表名显示, 不填则为tb
  // 'db': db, //在使用不同数据库时与dbConf共同指定, 一般使用默认mongo即可省略此项配置
  // 'dbConf': dbConfName, //配合db参数使用
  'fields': [ //必填
    //字段
    { 'col': 'name', 'name': '账号名', 'type': 'string', 'search': 'string', 'validator': ['strLen', [2, 30]], },
    {
      'col': 'loginName',
      'name': '登录名',
      'type': 'string',
      'search': 'string',
      'validator': ['strLen', [2, 30]],
    },
    {
      'col': 'loginPwd',
      'name': '密码',
      'type': 'pwd',
      'hide': 'list',
      'input': { 'type': 'pwd' },
      'validator': { 'optional': 'all', 'validator': ['strLen', [4, 30]] },
    },
    { 'col': 'level', 'name': '等级', 'type': 'int', 'input': { 'type': 'int' } },

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
    reqData.loginPwd = mkPwd(reqData.loginPwd, reqData.createTime);
    reqData.py = (reqData.name) ? Pinyin.getPY(reqData.name) : ''; //拼音首字母检索用
    callback(null, reqData);
  },
  'onOne': function(req, oneData, callback) {
    oneData.loginPwd = ''; //置空密码不返回
    let paras = null;
    if (kc.auth.auth(req, 'cp/authMap')) {
      paras = { 'authMap': 1 }; //这里用paras加入参数控制权限配置是否显示
    }
    callback(null, oneData, paras);
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
      db.c(prop.tb).findOne({ '_id': db.idObj(reqData._id) }, (err, fineOne) => {
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
  //补充的api
  'iiConf': {
    'act': {
      'authMap': {
        'showLevel': 0,
        'resp': authMap,
        'authName': '-权限配置显示',
      },
      'authSave': {
        'showLevel': 0,
        'resp': authSave,
        'authName': '-权限修改',
      },
    }
  },
  //以下参数用于mkCurdVue使用
  'listSlot': '',
  'oneSlot': '<el-button v-if="oneParas.authMap" type="danger" @click="$router.push(\'/permission/\'+oneId)">权限配置</el-button>',
  'addSlot': '',
};

const ci = curd.instance(prop);

exports.router = function() {
  return ci.router;
};


//如果引入全表缓存,则在数据变动时更新缓存数据
const refreshCache = function(pid, isDel) {
  if (!pid) {
    vlog.error('refreshCache no pid:%j', pid);
    return;
  }
  process.nextTick(function() {
    // vlog.log('refreshCache:%s',pid);
    if (isDel) {
      //清除对应缓存
      const cKey = prop.tb + ':_id:' + pid;
      const orgCache = kc.iCache.getSync(cKey);
      if (orgCache) {
        kc.iCache.set('mem', cKey, null);
      }
      return;
    }

    kc.iCache.cacheTable('mem', 'mongo', prop.tb, '_id', {
      _id: db.idObj(pid)
    }, null, function(err) {
      if (err) {
        vlog.error(err.stack);
        return;
      }
    });
  });
};

//curd事件: addOK, updateOK, hardDelOK
ci.on('addOK', function(reqBody, uId, uLevel, dbObj) {
  refreshCache('' + dbObj._id);
});
ci.on('updateOK', function(reqBody, uId, uLevel) { // eslint-disable-line
  refreshCache(reqBody.req._id);
});
ci.on('hardDelOK', function(reqBody, uId, uLevel) { // eslint-disable-line
  refreshCache(reqBody.req.id, true);
});

db.checkIndex(prop.tb, {
  'createTime_-1': { 'createTime': -1 },
  'name_-1': { 'name': -1 },
  'loginName_-1': { 'loginName': -1 },
  'level_-1': { 'level': -1 },
  'state_-1': { 'state': -1 },
  'py_-1': { 'py': -1 },
});

// const mk = kc.mkCurdVue;
// mk.make(prop, __dirname);