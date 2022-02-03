const error = require('kc').error;

//新增错误码
error.err.server = '500500';

exports.err = error.err;
exports.json = error.json;
exports.apiErr = error.apiErr;