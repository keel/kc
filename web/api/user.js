/*
用户的api
 */
'use strict';
var cck = require('cck');
// var render = require('../lib/renderTool');
var kc = require('../../lib/kc');
var iApi = kc.iApi;
var db = kc.db;
// var error = require('./error');
var vlog = require('vlog').instance(__filename);

var showLevel = 1;

var find = function(req, resp, callback) {
  var query = {
    'userName': new RegExp(req.body.userName.trim()),
    'state': {
      '$gte': 0
    }
  };
  var options = {
    'fields': {
      'userName': 1,
      'level': 1,
      'state': 1,
      'loginName': 1
    }
  };
  // vlog.log('find query:%j,options:%j, name:%j', query, options, req.body.userName);
  db.queryFromDb('user', query, options, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'find:queryOneFromDb', req.body));
    }

    callback(null, { 're': '0', 'users': re });

  });
};

var add = function(req, resp, callback) {
  var newUser = {
    'loginName': req.body.a_loginName,
    'loginPwd': req.body.a_loginPwd,
    'level': parseInt(req.body.a_level),
    'state': parseInt(req.body.a_state),
    'userName': req.body.a_userName
  };
  // vlog.log('add newUser:%j', newUser);
  db.addToDb('user', newUser, function(err, re) {
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
var setUpdateObj = function(bodyData, setArr, setPre) {
  if (!cck.checkBatch([
      [bodyData, 'notNull'],
      [setArr, 'array']
    ])) {
    return null;
  }
  var pre = setPre || '';
  var out = {};
  for (var i = 0; i < setArr.length; i++) {
    var setKey = setArr[i];
    var setVal = bodyData[pre + setKey];
    if (setVal === null || setVal === undefined) {
      continue;
    }
    out[setKey] = setVal;
  }
  return out;
};

var update = function(req, resp, callback) {
  var query = {
    '_id': db.idObj(req.body.u_id)
  };
  if (req.body.u_level) {
    req.body.u_level = parseInt(req.body.u_level);
  }
  if (req.body.u_state) {
    req.body.u_state = parseInt(req.body.u_state);
  }
  var setObj = setUpdateObj(req.body, ['loginName', 'loginPwd', 'userName', 'state', 'level'], 'u_');
  if (!setObj) {
    return callback(vlog.ee(null, 'update:setObj fail', req.body));
  }
  var set = {
    '$set':setObj
  };

  // vlog.log('update query:%j,set:%j ', query, set);
  db.updateOne('user', query, set, null, function(err, re) {
    if (err) {
      return callback(vlog.ee(err, 'update', req.body));
    }
    // vlog.log('re:%j', re);
    callback(null, { 're': '0' });
  });
};


var inputCheck = function(input) {
  var re = cck.check(input, 'strLen', [3, 18]);
  return re;
};


var iiConfig = {
  'auth':true,
  'act':{
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




exports.router = function () {

  var router = iApi.getRouter(iiConfig);

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
