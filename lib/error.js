/*
通用的错误码,根据情况不断追加
author:Keel
 */
'use strict';
var err = {
  'params': '403001',
  'auth': '403002',
  'level': '403003',
  'server': '500000',
  'db': '500002',
  'cache': '500003',
  'iiReq': '403004',
  'iiReqSign': '403005',
  'iiNoActResp': '500031',
  'iiResp': '500032',
  '404': '404',
  'unknown': '500001'
};


var json = function(errorType, info) {
  var e = err[errorType] || err['unknown'];
  var re = {
    're': e,
    'info': info
  };
  return re;
};

exports.err = err;
exports.json = json;

// var cck = require('cck');
// var vali = function(inputValue,checkr) {
//   return cck.check(inputValue, checkr[0], checkr[1]);
// };
// var ss = '小明';
// console.log('re:%j',vali(ss,['strLen',[1,18]]));
// console.log('check:%j',cck.check(ss,'strLen', [1, 18]));
