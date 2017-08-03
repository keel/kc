/*
用于创建工程等全局指令
 */
'use strict';
const fileSyn = require('./fileSyn');
const vlog = require('vlog').instance(__filename);
const cck = require('cck');
const path = require('path');
const fs = require('fs');
const kconfig = require('ktool').kconfig;
const dir = process.cwd();
const args = process.argv;

let projectName = 'test';
let port = 15001;

const mkConfig = function mkConfig(args) {
  if (args.length < 4) {
    vlog.error('error: no config file name');
    return;
  }
  kconfig.init();
  const noDefaultFile = path.join(dir, 'config', args[3]);
  if (!fs.statSync(noDefaultFile).isFile()) {
    vlog.error('===== > config file is not found!!');
    return false;
  }
  const re = kconfig.encConfigFile(noDefaultFile);
  console.log('%s! 已从 [config/%s] 生成服务端配置文件: [config/%s.json]', (re) ? '成功' : '失败', args[3], kconfig.get('project'));
};

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
  'config': mkConfig,
  '-v': ver,
  'ver': ver
};

if (args.length < 3) {
  let intro = 'kc cmd list: \r\n ';
  intro += 'init <projectName> <port>: 初始化项目, 如:kc init testObj 12001 ;\r\n ';
  intro += 'api <apiName>: 新增api接口,如kc api testApi1;\r\n ';
  intro += 'config <noDefaultConfigFileName>: 创建非默认的配置文件;\r\n ';
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