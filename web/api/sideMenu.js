/*
vue前端使用的sideMenu, 除level在adminLevel及以上的管理员, 其他按permission配置显示菜单, 除"首页"外的菜单项目通过menuArr定义
 */
'use strict';
const kc = require('../../lib/kc');
// const ktool = require('ktool');
const iApi = kc.iApi;
const error = require('../../lib/error');
// const vlog = require('vlog').instance(__filename);

const adminLevel = 10;
const isTest = true;

const homeLink = { 'name': '首页', 'link': '/', 'icon': 'el-icon-s-home' };
const logoutLink = { 'name': '退出系统', 'link': '/logout', 'icon': 'el-icon-s-opportunity' };
const menuArr = [
  {
    'name': '项目',
    'link': '/proj_p/list',
    'icon': 'el-icon-s-order',
    'subs': [
      { 'name': '项目列表', 'link': '/proj_p' },
      { 'name': '项目查询', 'link': '/proj-search' },
      { 'name': '项目统计', 'link': '/proj-assis' },
    ]
  },
  {
    'name': '产品',
    'link': '/product',
    'icon': 'el-icon-s-data',
  },
  {
    'name': '关于信息',
    'link': '/profile',
    'icon': 'el-icon-document',
  },
  {
    'name': '账号管理',
    'link': '/cp',
    'icon': 'el-icon-user-solid',
  },

];


const addByPermission = function(navArr, subs, permission) {
  for (let i = 0, len = subs.length; i < len; i++) {
    const one = subs[i];
    const path = one.link.substring(1);
    if (permission[path + '/list'] || permission[path]) {
      navArr.push(one);
      if (one.subs) {
        const tmpArr = [];
        addByPermission(tmpArr, one.subs, permission);
        one.subs = tmpArr;
      }
    }
  }
};



const showMenu = function(req, resp, callback) {

  const userLv = (req.userLevel === undefined) ? -1 : req.userLevel;
  const menu = [];
  if (userLv >= 0 || isTest) {
    menu.push(homeLink);
  }
  //管理员直接返回所有菜单
  // if (userLv >= adminLevel || isTest) {
  //   return callback(null, { 'code': 0, 'data': menu.concat(menuArr) });
  // }
  const permission = req.sessionValue ? req.sessionValue.userPermission : {};
  // console.log('req.sessionValue',req.sessionValue);
  addByPermission(menu, menuArr, permission);
  menu.push(logoutLink);
  callback(null, { 'code': 0, 'data': menu });
};


const iiConfig = {
  'auth': true,
  'act': {
    'showMenu': {
      'resp': showMenu
    },
  }
};


exports.router = function() {

  const router = iApi.getRouter(iiConfig);
  router.get('*', function(req, resp, next) { // eslint-disable-line
    resp.status(404).send(error.json('404', 'sideMenu'));
  });
  return router;
};