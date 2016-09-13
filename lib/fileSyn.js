/*
文件结构同步
 */
'use strict';

var fs = require('fs');
var os = require('os');
var vlog = require('vlog').instance(__filename);
var process = require('child_process');

/**
 * 目录及其内部的所有子目录和文件
 * @param  {string} orgDir    源对象
 * @param  {string} targetDir 目标目录
 * @return {void}
 */
var allSync = function(orgDir, targetDir) {
  var stats = fs.statSync(orgDir);
  if (!stats.isDirectory()) {
    vlog.error('allSync not directory:%j', orgDir);
    return;
  }
  try {
    var cmd = null;
    var isWindows = os.platform().indexOf('win') > 0;
    if (!isWindows) {
      cmd = 'cp -rf ' + __dirname + '/' + orgDir + ' ' + targetDir;
    } else {
      //windows
      cmd = 'XCOPY ' + __dirname + '/' + orgDir + ' ' + targetDir + ' /S /E /Y';
    }
    process.execSync(cmd);
  } catch (e) {
    vlog.eo(e, 'synFiles read files.json failed.');
    return;
  }
};


var types = {
  'all': allSync,
  'dir': 'dir',
  'file': 'file'
};

var synFiles = function(dir) {
  var stats = fs.statSync(dir);
  if (!stats.isDirectory()) {
    vlog.error('synFiles not directory:%j', dir);
    return;
  }
  var json = null;
  try {
    json = JSON.parse(fs.readFileSync('files.json'));
  } catch (e) {
    vlog.eo(e, 'synFiles read files.json failed.');
    return;
  }
  for (var i in json) {
    var type = json[i];

  }
};


