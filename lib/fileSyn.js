/*
文件结构同步
 */
'use strict';

const fs = require('fs');
const path = require('path');
const ktool = require('ktool');
const os = require('os');
const vlog = require('vlog').instance(__filename);
const process = require('child_process');


const tplPre = 'tpl_';
const tplPreLen = tplPre.length;
const s$_apiKey = ktool.randomStr(16);
/**
 * 目录及其内部的所有子目录和文件
 * @param  {string} orgDir    源对象
 * @param  {string} targetDir 目标目录
 * @return {void}
 */
const synDirAllSync = function(orgDir, targetDir) {
  const stats = fs.statSync(orgDir);
  if (!stats.isDirectory()) {
    vlog.error('synDirAllSync not directory:%j', orgDir);
    return;
  }
  try {
    let cmd = null;
    const isWindows = os.platform().indexOf('win') === 0;
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
const replaceKcLib = function(txt) {
  return txt.replace(/require\('[../]*lib\/kc'\)/g, 'require(\'kc\')');
};

const replaceProjectAndPort = function(txt, projectName, port) {
  let t = txt.replace(/\[#projectName\]/g, projectName).replace(/\[#port\]/g, port).replace(/\[#apiKey\]/g, s$_apiKey);
  while (t.indexOf('[#random]') >= 0) {
    t = t.replace('[#random]', ktool.randomStr(16));
  }
  t = t.replace(new RegExp('\\/\\/\\[#\\{comm\\]','g'), '/*');
  t = t.replace(new RegExp('\\/\\/\\[#\\}comm\\]','g'), '*/');
  return replaceKcLib(t);
};

const synFileSync = function(srcFile, destFile, fn, confObj) {
  try {
    const destPath = path.dirname(destFile);
    fs.mkdirSync(destPath, { 'recursive': true });
    let txt = fs.readFileSync(srcFile, 'utf-8');
    txt = fn ? fn(txt, confObj) : txt;
    fs.writeFileSync(destFile, txt);
  } catch (e) {
    vlog.eo(e, 'synFileSync error', srcFile, destFile);
    return;
  }
};

const synTplSync = function(srcFile, destFile, fn, projectName, port) {
  try {
    const destPath = path.dirname(destFile);
    fs.mkdirSync(destPath, { 'recursive': true });
    let txt = fs.readFileSync(srcFile, 'utf-8');
    txt = fn ? fn(txt, projectName, port) : txt;
    fs.writeFileSync(destFile, txt);
  } catch (e) {
    vlog.eo(e, 'synTplSync error', srcFile, destFile);
    return;
  }
};

const exFiles = {
  '.DS_Store': true
};

const exDirs = {
  'node_modules': true,
  'dist': true,
};

const walkDir = function(dir, fn) {
  const dirList = fs.readdirSync(dir);
  dirList.forEach(function(item) {
    if (fs.statSync(path.join(dir, item)).isDirectory()) {
      if (exDirs[item]) {
        return;
      }
      walkDir(path.join(dir, item), fn);
    } else {
      // console.log('dir:%s,item:%s, fn:%s', dir, item, fn);
      if (!exFiles[item]) {
        fn(dir, item);
      }
    }
  });
};

const synDirSync = function(srcDir, destDir, fn, projectName, port) {
  const synOne = function(onePath, oneFile) {
    const destPath = path.resolve(destDir, path.relative(srcDir, onePath));
    // console.log('destPath:%s, onePath:%s, relative:%s', destPath, onePath, path.relative(srcDir, onePath));
    synTplSync(path.join(onePath, oneFile), path.join(destPath, oneFile), fn, projectName, port);
  };
  walkDir(srcDir, synOne);
};



const typesFn = {
  'all': synDirAllSync,
  'dir': synDirSync,
  'tpl': synTplSync,
  'file': synFileSync
};


const doSync = function(dir, projectName, port) {
  const rootDir = path.join(__dirname, '..');
  // console.log('rootDir:%s,dir:%s',rootDir,dir);
  fs.mkdirSync(dir, { 'recursive': true });
  let json = null;
  try {
    json = JSON.parse(fs.readFileSync(path.join(__dirname, 'files.json')));
  } catch (e) {
    vlog.eo(e, 'synFileSyncs read files.json failed.');
    return;
  }
  for (const i in json) {
    const type = json[i];
    let destPath = path.join(dir, i);
    if (type === 'tpl') {
      const destFile = path.basename(i);
      let realDest = destFile.substring(tplPreLen);
      if (destFile === 'kc-.js') {
        realDest = projectName + '.js';
      }
      destPath = path.join(path.dirname(destPath), realDest);
    }
    const typeFn = typesFn[type];
    // console.log('rootDir:%s, src:%s, dest:%s',rootDir, path.join(rootDir, i), destPath);
    typeFn(path.join(rootDir, i), destPath, replaceProjectAndPort, projectName, port);
  }
  //最后更新lyapp.src.js的apiKey
  const jsNeedSetKey = path.join(__dirname, '../vue/src/plugins/kc.js');
  if (fs.existsSync(jsNeedSetKey)) {
    synFileSync(jsNeedSetKey, path.join(dir, 'vue/src/plugins/kc.js'), replaceProjectAndPort);
  }
  //增加lib/error.js文件
  const srcFile = path.join(__dirname, '../templets/error.js');
  const destFile = path.join(dir, 'lib/error.js');
  synFileSync(srcFile, destFile);
};


// synFileSync('../web/api/fake.js', '../web1/api/fake2.js', replaceKcLib);
// synTplSync('../tpl_package.json', '../web1/pacage1.json', replaceProjectAndPort,'testProj',12345);
// synDirSync('../web', '../web1/dir1', replaceProjectAndPort, 'testProj', 12345);
// doSync('/Users/keel/dev/proj4', 'proj3', 112155);

exports.doSync = doSync;
exports.synFileSync = synFileSync;