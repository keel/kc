/*
权限框架:
* api代码中通过addAuth注入权限点;
* 启动时会自动生成一个权限树,通过getAuthMap可以得到副本;
* login时放置用户的权限到sessionValue.userPermission;
* 操作时通过auth(req, authPath)进行鉴权;
* 通过树形前端配置,可后台定义每个用户的权限;
 */

'use strict';
const ktool = require('ktool');

//格式为 path/authName 如: testapi/list,testapi/list
const authMap = {};

//由iApi上报权限,系统启动后即生成权限表
const addAuth = function(authPath, authName, authInfo) {
  authMap[authPath] = {
    'name': authName || authPath,
    'info': authInfo || '',
  };
};

//检测权限
const auth = function(req, authPath) {
  if (!req.sessionValue || !req.sessionValue.userPermission || !req.sessionValue.userPermission[authPath]) {
    return false;
  }
  return true;
};

const getAuthMap = function() {
  return ktool.clone(authMap);
};

//暂时无用
const getAuthTree = function() {
  const amap = ktool.clone(authMap);
  const tree = {};
  for (const authPath in amap) {
    const pathArr = authPath.split('/');
    let node = tree;
    for (let i = 0, len = pathArr.length; i < len; i++) {
      const pOne = pathArr[i];
      if (!node[pOne]) {
        node[pOne] = {};
      }
      node = node[pOne];
    }
  }
  return tree;
};


exports.addAuth = addAuth;
exports.auth = auth;
exports.getAuthMap = getAuthMap;
exports.getAuthTree = getAuthTree;



// const t1 = function() {
//   addAuth('root/list');
//   addAuth('root/update');
//   addAuth('root/del');
//   addAuth('root/one');
//   addAuth('root/path1/list');
//   addAuth('root/path1/del');
//   addAuth('root/path2/list');
//   addAuth('root/path2/del');
//   addAuth('root/path3/subPath/list');
//   addAuth('root/path3/subPath/del');
//   console.log('tree:%j',getAuthTree());
// };
// t1();