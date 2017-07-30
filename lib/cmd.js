/*
用于创建工程等全局指令
 */
'use strict';
const fileSyn = require('./fileSyn');
const vlog = require('vlog').instance(__filename);
const cck = require('cck');
const path = require('path');
const dir = process.cwd();
const args = process.argv;

let projectName = 'test';
let port = 15001;


const init = function(args) {

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

const ver = function() {
  console.log(require(path.join(__dirname, '../package.json')).version);
};

const addApi = function(args) {
  if (args.length < 4) {
    vlog.error('error: no api name');
    return;
  }

  const apiName = args[3];

  const tplReplace = function(txt) {
    return txt.replace(/\[#apiName\]/g, apiName);
  };
  const srcFile = path.join(__dirname, '../templets/api.js');
  const destFile = path.join(dir, 'web/api', apiName + '.js');

  fileSyn.synFileSync(srcFile, destFile, tplReplace);
  console.log('api[%s], file:[%s] created.', apiName, destFile);
};

const cmdMap = {
  'init': init,
  'api': addApi,
  '-v': ver,
  'ver': ver
};

if (args.length < 3) {
  let intro = 'kc cmd list: \r\n ';
  intro += 'init <projectName> <port>: 初始化项目, 如:kc init testObj 12001 ;\r\n ';
  intro += 'api <apiName>: 新增api接口,如kc api testApi1;\r\n ';
  intro += 'ver/-v: 显示版本号;\r\n ';
  console.log(intro);
  return;
}

const cmd = args[2];
if (!cmdMap[cmd]) {
  console.error('Unknown kc command:%s', cmd);
  return;
}

cmdMap[cmd](args);
