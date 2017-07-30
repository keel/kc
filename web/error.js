/*
通用的错误码,根据情况不断追加
 */
'use strict';
const kc = require('../lib/kc');
const error = kc.error;
const err = error.err;


err.testErr = '404004';

exports.err = err;
exports.json = error.json;

