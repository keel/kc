/*
用于创建工程等全局指令
 */
'use strict';
var fileSyn = require('./fileSyn');
var vlog = require('vlog').instance(__filename);
var cck = require('cck');
var path = require('path');
var dir = process.cwd();
var args = process.argv;

var projectName = 'test';
var port = 15001;


var init = function(args) {

  if (args.length < 4) {
    vlog.error('args error:%s', args);
    return;
  }
  projectName = args[3];
  if (args.length > 4 && cck.check(args[4], 'strInt')) {
    port = parseInt(args[4]);
  }

  console.log('kc init: [%s], port:[%d]', projectName, port);

  fileSyn.doSync(dir, projectName, port);
  console.log('kc init done.');
};

var ver = function(args) {
  console.log(require(path.join(__dirname,'../package.json')).version);
};

var cmdMap = {
  'init': init,
  '-v': ver,
  'ver': ver
};

if (args.length < 3) {
  console.log('kc cmd list or help info :...');
  return;
}

var cmd = args[2];
if (!cmdMap[cmd]) {
  console.error('Unknown kc command:%s', cmd);
  return;
}

cmdMap[cmd](args);
