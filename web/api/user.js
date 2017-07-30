/*
用户的api
 */
'use strict';
const cck = require('cck');
// const render = require('../lib/renderTool');
const kc = require('../../lib/kc');
const iApi = kc.iApi;
const db = kc.mongo.init(__dirname + '/../config.json');
// const error = require('./error');
const vlog = require('vlog').instance(__filename);

const showLevel = 1;
const userTable = 'userapi';

const find = function(req, resp, callback) {
  const query = {
    'userName': new RegExp(req.body.userName.trim()),
    'state': {
      '$gte': 0
    }
  };
  const options = {
    'fields': {
      'userName': 1,
      'level': 1,
      'state': 1,
      'loginName': 1
    }
  };
  // vlog.log('find query:%j,options:%j, name:%j', query, options, req.body.userName);
  db.c(userTable).query(query, options, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'find', req.body));
    }

    callback(null, { 're': '0', 'users': re });

  });
};




const add = function(req, resp, callback) {
  const newUser = {
    'loginName': req.body.a_loginName,
    'loginPwd': req.body.a_loginPwd,
    'level': parseInt(req.body.a_level),
    'state': parseInt(req.body.a_state),
    'userName': req.body.a_userName
  };
  // vlog.log('add newUser:%j', newUser);
  db.c(userTable).insert(newUser, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'add:queryOneFromDb', req.body));
    }
    callback(null, { 're': '0' });
  });
};

/**
 * 根据请求的参数拼接更新的对象
 * @param {object} bodyData 请求的body
 * @param {array} setArr   对应数据表的字段名数组
 * @param {string} [setPre]   请求表单中字段名前缀,可选
 */
const setUpdateObj = function(bodyData, setArr, setPre) {
  const paraCheckRe = cck.checkBatch([
    [bodyData, 'notNull'],
    [setArr, 'array']
  ]);
  if (paraCheckRe.length > 0) {
    return null;
  }
  const pre = setPre || '';
  const out = {};
  for (let i = 0; i < setArr.length; i++) {
    const setKey = setArr[i];
    const setVal = bodyData[pre + setKey];
    if (setVal === null || setVal === undefined) {
      continue;
    }
    out[setKey] = setVal;
  }
  return out;
};

const update = function(req, resp, callback) {
  const query = {
    '_id': db.idObj(req.body.u_id)
  };
  if (req.body.u_level) {
    req.body.u_level = parseInt(req.body.u_level);
  }
  if (req.body.u_state) {
    req.body.u_state = parseInt(req.body.u_state);
  }
  const setObj = setUpdateObj(req.body, ['loginName', 'loginPwd', 'userName', 'state', 'level'], 'u_');
  if (!setObj) {
    return callback(vlog.ee(null, 'update:setObj fail', req.body));
  }
  const set = {
    '$set': setObj
  };

  // vlog.log('update query:%j,set:%j ', query, set);
  db.c(userTable).update(query, set, null, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'update', req.body));
    }
    // vlog.log('re:%j', re);
    callback(null, { 're': '0' });
  });
};


const inputCheck = function(input) {
  const re = cck.check(input, 'strLen', [3, 18]);
  return re;
};


const iiConfig = {
  'auth': true,
  'act': {
    'find': {
      'showLevel': showLevel,
      'validator': {
        'userName': ['strLen', [1, 18]]
      },
      'resp': find
    },
    'add': {
      'showLevel': showLevel,
      'validator': {
        'a_loginName': inputCheck,
        'a_loginPwd': inputCheck,
        'a_level': ['strIntRange', [0, 99]],
        'a_userName': ['strLen', [1, 18]],
        'a_state': ['strIntRange', [0, 99]]
      },
      'resp': add
    },
    'update': {
      'showLevel': showLevel,
      'validator': {
        'u_id': ['strLen', [24]],
        '@u_loginName': inputCheck,
        '@u_loginPwd': inputCheck,
        '@u_level': ['strIntRange', [0, 99]],
        '@u_userName': ['strLen', [1, 18]],
        '@u_state': ['strIntRange', [0, 99]]
      },
      'resp': update
    }
  }
};




exports.router = function() {

  const router = iApi.getRouter(iiConfig);

  router.get('*', function(req, resp, next) {
    resp.status(404).send('404');
    // resp.send(render.login());
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