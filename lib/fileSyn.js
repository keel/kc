/*
文件结构同步
 */
'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var os = require('os');
var vlog = require('vlog').instance(__filename);
var process = require('child_process');


var tplPre = 'tpl_';
var tplPreLen = tplPre.length;
/**
 * 目录及其内部的所有子目录和文件
 * @param  {string} orgDir    源对象
 * @param  {string} targetDir 目标目录
 * @return {void}
 */
var synDirAllSync = function(orgDir, targetDir) {
  var stats = fs.statSync(orgDir);
  if (!stats.isDirectory()) {
    vlog.error('synDirAllSync not directory:%j', orgDir);
    return;
  }
  try {
    var cmd = null;
    var isWindows = os.platform().indexOf('win') === 0;
    if (!isWindows) {
      cmd = 'cp -rf ' + orgDir + ' ' + targetDir;
    } else {
      //windows
      cmd = 'XCOPY ' + orgDir + ' ' + targetDir + ' /S /E /Y';
    }
    process.execSync(cmd);
  } catch (e) {
    vlog.eo(e, 'synDirAllSync read files.json failed.', orgDir, targetDir);
    return;
  }
};

//注意需要把require('../../lib/kc')替换为require('kc')
var replaceKcLib = function(txt) {
  return txt.replace(/require\(\'[\.\.\/]*lib\/kc\'\)/g, 'require\(\'kc\'\)');
};

var replaceProjectAndPort = function(txt, projectName, port) {
  var t = txt.replace(/\[\#projectName\]/g, projectName).replace(/\[\#port\]/g, port);
  return replaceKcLib(t);
};

var synFileSync = function(srcFile, destFile, fn) {
  try {
    var destPath = path.dirname(destFile);
    mkdirp.sync(destPath);
    var txt = fs.readFileSync(srcFile, 'utf-8');
    txt = fn ? fn(txt) : txt;
    fs.writeFileSync(destFile, txt);
  } catch (e) {
    vlog.eo(e, 'synFileSync error', srcFile, destFile);
    return;
  }
};

var synTplSync = function(srcFile, destFile, fn, projectName, port) {
  try {
    var destPath = path.dirname(destFile);
    mkdirp.sync(destPath);
    var txt = fs.readFileSync(srcFile, 'utf-8');
    txt = fn ? fn(txt, projectName, port) : txt;
    fs.writeFileSync(destFile, txt);
  } catch (e) {
    vlog.eo(e, 'synTplSync error', srcFile, destFile);
    return;
  }
};

var exFiles = {
  '.DS_Store': true
};

var walkDir = function(dir, fn) {
  var dirList = fs.readdirSync(dir);
  dirList.forEach(function(item) {
    if (fs.statSync(path.join(dir, item)).isDirectory()) {
      walkDir(path.join(dir, item), fn);
    } else {
      // console.log('dir:%s,item:%s, fn:%s', dir, item, fn);
      if (!exFiles[item]) {
        fn(dir, item);
      }
    }
  });
};

var synDirSync = function(srcDir, destDir, fn, projectName, port) {
  var synOne = function(onePath, oneFile) {
    var destPath = path.resolve(destDir, path.relative(srcDir, onePath));
    // console.log('destPath:%s, onePath:%s, relative:%s', destPath, onePath, path.relative(srcDir, onePath));
    synTplSync(path.join(onePath, oneFile), path.join(destPath, oneFile), fn, projectName, port);
  };
  walkDir(srcDir, synOne);
};



var typesFn = {
  'all': synDirAllSync,
  'dir': synDirSync,
  'tpl': synTplSync,
  'file': synFileSync
};


var doSync = function(dir, projectName, port) {
  var rootDir = path.join(__dirname, '..');
  // console.log('rootDir:%s,dir:%s',rootDir,dir);
  mkdirp.sync(dir);
  var json = null;
  try {
    json = JSON.parse(fs.readFileSync(path.join(__dirname,'files.json')));
  } catch (e) {
    vlog.eo(e, 'synFileSyncs read files.json failed.');
    return;
  }
  for (var i in json) {
    var type = json[i];
    var destPath = path.join(dir,i);
    if (type === 'tpl') {
      var destFile = path.basename(i);
      var realDest = destFile.substring(tplPreLen);
      if (realDest === 'kc.js') {
        realDest = projectName + '.js';
      }
      destPath = path.join(path.dirname(destPath), realDest);
    }
    var typeFn = typesFn[type];
    // console.log('rootDir:%s, src:%s, dest:%s',rootDir, path.join(rootDir, i), destPath);
    typeFn(path.join(rootDir, i), destPath, replaceProjectAndPort, projectName, port);
  }
};


// synFileSync('../web/api/fake.js', '../web1/api/fake2.js', replaceKcLib);
// synTplSync('../tpl_package.json', '../web1/pacage1.json', replaceProjectAndPort,'testProj',12345);
// synDirSync('../web', '../web1/dir1', replaceProjectAndPort, 'testProj', 12345);
// doSync('/Users/keel/dev/proj4', 'proj3', 112155);

exports.doSync = doSync;
exports.synFileSync = synFileSync;
