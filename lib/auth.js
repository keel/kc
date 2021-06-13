/*
权限框架



权限按资源名_CURD进行标识, 每个权限组只拥有唯一一个标识, 即同一个权限;

权限表:
.记录所有登录后请求的权限名;
.每个带鉴权的jst和iApi请求主动注册权限到权限表;
.权限值格式为 path/authName, 权限表带一个可选的备注字段;

权限组:
.根据需要将权限表中的项目进行分组,标记组名和备注;
.权限组支持包含和排除操作,保存包含对象和排除对象(均为数组),但实际内部仍为具体权限值的管理;
.未归组的权限值无法使用;

用户:
.每个用户对应一个具体的权限组,没有权限组的用户无法执行任何操作(除了登录);

用户组(角色):
.多个用户使用同一权限组时,可定义为用户组;
.用户组支持包含与排除;
.每个用户组对应唯一的权限组;


每个用户组一个Set集合,


公司组,权限 高
部门组, 中
项目组, 低


产品表: 项目A, 部门X, 公司S


userA: 项目组 >


按用户从数据表中取出其对应用户组的所有数据:
先找到包含此用户的所有用户组，然后在数据表中用in查询用户组字段;

在显示产品表时,当登录用户组最高为


首期实现:
1. 权限表生成
2. 每个用户配置权限表
3. 权限校验,及可视校验


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


const addPermission = function(userObj, authPath) {
  const authOne = authMap[authPath];
  if (!authOne) {
    return false;
  }
  if (!userObj.permission) {
    userObj.permission = {};
  }
  const permission = ktool.clone(authOne);
  userObj.permission[authPath] = permission;
  return true;
};

const auth = function(authPath, userPermission) {
  const authOne = authMap[authPath];
  if (!authOne || !userPermission || !userPermission[authPath]) {
    return false;
  }
  return true;
};

const getAuthMap = function() {
  return ktool.clone(authMap);
};

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
exports.addPermission = addPermission;



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