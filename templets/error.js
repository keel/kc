/*
通用的错误码,根据情况不断追加
 */
'use strict';
const error = require('kc').error;
const vlog = require('vlog').instance(__filename);

//新增错误码

error.err['testErr'] = '404004';
error.err['curdNoUser'] = '404001';
error.err['cpAdd'] = '500004';
error.err['cpOne'] = '500005';
error.err['cpUpdate'] = '500006';
error.err['cpDel'] = '500007';
error.err['curdAdd'] = '500008';
error.err['showId'] = '500009';
error.err['curdUpdate'] = '500010';
error.err['hardDel'] = '500011';
error.err['passNew'] = '500012';
error.err['denyNew'] = '500013';
error.err['managerUpdate'] = '500014';
error.err['reviewUpdate'] = '500015';
error.err['reviewUpdate1'] = '500016';
error.err['reviewUpdate2'] = '500017';
error.err['reviewUpdate3'] = '500018';
error.err['denyUpdate'] = '500019';
error.err['downLine'] = '500020';
error.err['softDel'] = '500021';
error.err['managerUpdate1'] = '500022';
error.err['denyUpdate1'] = '500023';
error.err['passUpdate1'] = '500024';
error.err['passUpdate2'] = '500025';
error.err['modifyNew'] = '500026';
error.err['modifyNew1'] = '500027';
error.err['modifyNew2'] = '500028';
error.err['modifyNew3'] = '500029';
error.err['curdAdd1'] = '500030';
error.err['curdManagerSetState'] = '500031';
error.err['searchList'] = '500032';

//注意这里使用新的code与msg结构
const json = function(errorType, data) {
  let e = error.err[errorType];
  if (!e) {
    e = error.err['unknown'];
  }
  const re = {
    'code': e,
    'msg': (data) ? data : errorType
  };
  return re;
};

/*
web/api中使用,示例:
if (err) {
  return error.apiErr(err, callback, 'curdUpdate');
}
 */
const apiErr = function(errMsg, callback, errorType) {
  if ('string' !== typeof errMsg) {
    return callback(vlog.ee(errMsg, errorType || 'iiResp'));
  }
  const err = new Error(errMsg);
  err.msg = errMsg;
  // vlog.eo(err, errMsg, errorType);
  callback(err, { 'msg': err.msg }, 200, errorType || 'iiResp');
};

exports.err = error.err;
exports.json = json;
exports.apiErr = apiErr;