/*
通用的错误码,根据情况不断追加
author:Keel
 */
'use strict';
const cck = require('cck');
const vlog = require('vlog').instance(__filename);

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
  'unknown': '500001',
  'curdOne':'500101',
  'curdList':'500102',
  'curdAdd':'500103',
  'curdDel':'500104',
  'curdUpdate':'500105',
  'curdUpdateOne':'500106',
  'curdOnList':'500107',
  'curdOnAdd':'500108',
  'curdOnUpdate':'500109',
  'curdOnUpdateOne':'500110',
  'curdOnDel':'500111',
  'curdCSV':'500112',
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
    'code': e,
    'data': cck.isNotNull(data) ? data : ''
  };
  return re;
};


const apiErr = function(errMsg, callback, errorType) {
  if ('string' !== typeof errMsg) {
    return callback(vlog.ee(errMsg, errorType || 'iiResp'));
  }
  const err = new Error(errMsg);
  err.msg = errMsg;
  callback(err, { 'data': err.msg }, 200, errorType || 'iiResp');
};

exports.err = err;
exports.json = json;
exports.apiErr = apiErr;
