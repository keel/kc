/*
通用的错误码,根据情况不断追加
author:Keel
 */
'use strict';
const cck = require('cck');
const err = {
  'params': '403001',
  'auth': '403002',
  'level': '403003',
  'fail2ban': '403008',
  'server': '500000',
  'db': '500002',
  'cache': '500003',
  'iiReq': '403004',
  'iiReqSign': '403005',
  'iiReqEmpty': '403006',
  'iiReqKey': '403007',
  'iiNoActResp': '500031',
  'iiResp': '500032',
  '404': '404',
  'unknown': '500001'
};


const json = function(errorType, data) {
  let e = err[errorType];
  if (!e) {
    if (cck.check(errorType, 'strInt')) {
      e = errorType;
    } else {
      e = err['unknown'];
    }
  }
  const re = {
    're': e,
    'data': cck.isNotNull(data) ? data : ''
  };
  return re;
};

exports.err = err;
exports.json = json;
