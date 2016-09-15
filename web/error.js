/*
通用的错误码,根据情况不断追加
 */
'use strict';
var kc = require('../lib/kc');
var error = kc.error;
var err = error.err;


err['testErr'] = '404004';

exports.err = err;
exports.json = error.json;

