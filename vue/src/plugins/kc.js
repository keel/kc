/* eslint-disable object-shorthand,prefer-const,no-var */
import Vue from 'vue';
var $ = function(domId) {
  return document.getElementById(domId);
};
var llog = function() {
  var args = ['====>'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.log.apply(window, args);
};

var lerr = function() {
  var args = ['====>'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.error.apply(window, args);
};

function mkStyle(styleObj) {
  var styleStr = '';
  for (var k in styleObj) {
    styleStr += k + ':' + styleObj[k] + ';';
  }
  return styleStr;
}

function setStyle(el, newStyle, isReplace) {
  if (isReplace) {
    el.setAttribute('style', mkStyle(newStyle));
    return;
  }
  var styleStr = el.getAttribute('style') || '';
  var styleArr = styleStr.split(';');
  var styleObj = {};
  if (styleStr) {
    for (var i = 0; i < styleArr.length; i++) {
      var sArr = styleArr[i].split(':');
      if (sArr.length !== 2) {
        continue;
      }
      styleObj[sArr[0].trim()] = sArr[1].trim();
    }
  }
  for (var j in newStyle) {
    styleObj[j] = newStyle[j];
  }
  el.setAttribute('style', mkStyle(styleObj));
}

var twoInt = function(int) {
  return (int < 10) ? '0' + int : int;
};

var threeInt = function(int) {
  if (int < 10) {
    return '00' + int;
  } else if (int < 100) {
    return '0' + int;
  } else {
    return '' + int;
  }
};

var timeFormat = function(formatStr, millSec) {
  const d = millSec ? new Date(millSec) : new Date();
  const df = {
    'YYYY': d.getFullYear(),
    'yyyy': d.getFullYear(),
    'MM': twoInt(d.getMonth() + 1),
    // 'DD': twoInt(d.getDate()),//年中的天数
    'dd': twoInt(d.getDate()),
    'HH': twoInt(d.getHours()),
    // 'hh': (d.getHours() < 12) ? twoInt(d.getHours()) : twoInt(d.getHours() - 12),//12小时制
    'mm': twoInt(d.getMinutes()),
    'ss': twoInt(d.getSeconds()),
    'SSS': threeInt(d.getMilliseconds()),
  };
  if (!formatStr) {
    formatStr = 'yyyy-MM-dd HH:mm:ss'; //默认格式
  }
  for (const i in df) {
    formatStr = formatStr.replace(new RegExp(i, 'g'), df[i]);
  }
  return formatStr;
};

var kHttp = function(url, httpType, data, headers, callback) {
  if (headers && typeof headers === 'function') {
    callback = headers;
    headers = {};
  } else if (!headers) {
    headers = {};
  }
  if (!callback) {
    callback = function(err) {
      if (err) {
        return lerr(err);
      }
    };
  }
  const xhr = new XMLHttpRequest();
  xhr.open(httpType, url, true);
  for (const i in headers) {
    xhr.setRequestHeader(i, headers[i]);
  }
  if (httpType === 'POST') {
    if (!headers['Content-Type']) {
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    var postData = (typeof data === 'object') ? JSON.stringify(data) : data;
    xhr.send(postData);
    // llog('kHttp data:'+postData);
  } else {
    xhr.send();
  }
  // llog('kHttp url:'+url+','+httpType);
  xhr.onload = function() {
    if (xhr.status == 200) {
      return callback(null, xhr.responseText);
    } else {
      return callback('kHttpERR-' + xhr.status, xhr.responseText, xhr);
    }
  };
};

var kPost = function(url, data, headers, callback) {
  kHttp(url, 'POST', data, headers, callback);
};
var kGet = function(url, headers, callback) {
  kHttp(url, 'GET', null, headers, callback);
};

Vue.prototype.$kc = {
  $,
  llog,
  lerr,
  mkStyle,
  setStyle,
  twoInt,
  threeInt,
  timeFormat,
  kHttp,
  kPost,
  kGet,
};