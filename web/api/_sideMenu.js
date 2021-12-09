/**
 * 用于生成页面左边导航
 */
'use strict';
// const ktool = require('ktool');

const addByPermission = function(nav, subs, permission) {
  for (let i = 0, len = subs.length; i < len; i++) {
    const one = subs[i];
    if (permission[one.link + '/list'] || permission[one.link]) {
      nav.subs.push(one);
    }
  }
  if (nav.subs.length === 0) {
    return null;
  }
  return nav;
};

const productNav = function(userLevel, permission) {
  if (userLevel < 1) {
    return null;
  }
  const subs = [
    { 'name': '业务配置', 'link': 'product', 'icon': 'icon-energy' },
  ];
  const nav = {
    'name': '订单管理',
    'subs': []
  };
  return addByPermission(nav, subs, permission);
};


const adminNav = function(userLevel, permission) {
  const subs = [
    { 'name': '账号信息', 'link': 'profile', 'icon': 'icon-users' },
  ];
  if (userLevel > 9) {
    subs.push({ 'name': '账号管理', 'link': 'cp', 'icon': 'icon-users' });
  }
  const nav = {
    'name': '系统信息',
    'subs': subs
  };
  //这里不进行权限配置校验
  return nav;
};

const addNav = function(menu, nav) {
  if (nav) {
    menu.push(nav);
  }
};

const createNav = function(req, resp, next) {
  const userLv = (req.userLevel === undefined) ? -1 : req.userLevel;
  const menu = [];
  if (userLv >= 0) {
    menu.push({ 'name': '首页', 'link': 'main', 'icon': 'icon-home' });
  }
  const permission = req.sessionValue ? req.sessionValue.userPermission : {};
  addNav(menu, productNav(userLv, permission));
  addNav(menu, adminNav(userLv, permission));
  if (userLv >= 0) {
    const exit = {
      'name': '退出账号',
      'subs': [
        { 'name': '退出登录', 'link': 'logout', 'icon': 'icon-logout' }
      ]
    };
    menu.push(exit);
  }
  req.mid = {
    'nav': menu
  };
  next();
};



/**
 * 这里不用，用于在parts.jst.def中定义后生成导航菜单
 */
function showIcon(navObj) {
  if (navObj.icon) {
    return '<i class="glyphicon ' + navObj.icon + '"></i>';
  }
  return '';
}

/**
 * 这里不用，用于在parts.jst.def中定义后生成导航菜单
 */
function showNav(navObj, rootPath) { // eslint-disable-line
  let out = '';
  if (!navObj) {
    return out;
  }
  if (!rootPath) {
    rootPath = '';
  }
  if (Object.prototype.toString.call(navObj) === '[object Object]') {
    if (!navObj.name) {
      return out;
    }
    if (navObj.link) {
      out += '<li> <a href="' + rootPath + navObj.link +
        '" class="auto"> ' + showIcon(navObj) +
        ' <span' + (navObj.id ? (' id=' + navObj.id) : '') + '>' + navObj.name + '</span> </a> </li>';
      return out;
    }
    if (navObj.subs && Object.prototype.toString.call(navObj.subs) === '[object Array]') {
      if (navObj.isInclude) {
        out += '<li> <a class="auto"> <span class="pull-right text-muted"> <i class="fa fa-fw fa-angle-right text"></i> <i class="fa fa-fw fa-angle-down text-active"></i> </span> ' + showIcon(navObj) + ' <span>' + navObj.name + '</span> </a> <ul class="nav nav-sub dk">';
      } else {
        out += '<li class="hidden-folded padder m-t m-b-sm text-muted text-xs"> <span>' + navObj.name + '</span> </li>';
      }
      for (let i = 0, len = navObj.subs.length; i < len; i++) {
        out += showNav(navObj.subs[i], rootPath);
      }
      if (navObj.isInclude) {
        out += '</ul></li>';
      }
    }
  } else if (Object.prototype.toString.call(navObj) === '[object Array]') {
    for (let i = 0, len = navObj.length; i < len; i++) {
      out += showNav(navObj[i], rootPath);
    }
  }
  return out;
}


// const nav = showNav(menu);
// console.log(nav);

exports.createNav = createNav;