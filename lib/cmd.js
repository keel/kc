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
    vlog.error('error: no projectName');
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

var ver = function() {
  console.log(require(path.join(__dirname, '../package.json')).version);
};

var addApi = function(args) {
  if (args.length < 4) {
    vlog.error('error: no api name');
    return;
  }

  var apiName = args[3];

  var tplReplace = function(txt) {
    return txt.replace(/\[#apiName\]/g, apiName);
  };
  var srcFile = path.join(__dirname, '../templets/api.js');
  var destFile = path.join(dir, 'web/api', apiName + '.js');

  fileSyn.synFileSync(srcFile, destFile, tplReplace);
  console.log('api[%s], file:[%s] created.', apiName, destFile);
};

var cmdMap = {
  'init': init,
  'api': addApi,
  '-v': ver,
  'ver': ver
};

if (args.length < 3) {
  var intro = 'kc cmd list: \r\n ';
  intro += 'init <projectName> <port>: 初始化项目, 如:kc init testObj 12001 ;\r\n ';
  intro += 'api <apiName>: 新增api接口,如kc api testApi1;\r\n ';
  intro += 'ver/-v: 显示版本号;\r\n ';
  console.log(intro);
  return;
}

var cmd = args[2];
if (!cmdMap[cmd]) {
  console.error('Unknown kc command:%s', cmd);
  return;
}

cmdMap[cmd](args);
