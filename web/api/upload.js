/*
文件上传处理,支持elementui的upload组件,需要formidable.

在web/api/xxx中使用:
const Upload = require('./upload');
const Path = require('path');
Upload.addUploadAction('img_big', function(file, fields, resp) {
  // console.log('uploadActions:file:%j, fields:%j', file, fields);
  const filePath = file.path;
  resp.status(200).send({ 're': 0, 'file': Path.basename(filePath) });
  //processPic(filePath);
});

 */
'use strict';


const vlog = require('vlog').instance(__filename);
const error = require('../../lib/error');
const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const kconfig = require('kc').kconfig;
kconfig.init();


// const tempDir = __dirname + '/../uploads/';
let tempDir = path.join(__dirname, kconfig.get('uploadDir') || '../../uploads/');
const fileExts = {
  '.txt': true,
  '.jpg': true,
  '.png': true,
  '.gif': true,
  '.zip': true,
  '.RAR': true,
  '.rar': true,
  '.mp3': true,
  '.wma': true,
  '.wav': true,
  '.doc': true,
  '.docx': true,
  '.xls': true,
  '.xlsx': true
};


/**
 * 递归创建多级目录
 * @param  {string} dirPath 绝对路径
 * @return {boolean}         是否创建成功
 */
const mkDirs = function(dirPath) {
  try {
    fs.statSync(dirPath);
  } catch (e) {
    if (mkDirs(path.dirname(dirPath))) {
      try {
        fs.mkdirSync(dirPath);
      } catch (e1) {
        vlog.error(e1, 'mkDirs');
        return false;
      }
    }
  }
  return true;
};



const uploadActions = {
  'noAct': function(file, fields, resp) {
    // vlog.log('uploadActions:noAct: file:%j, fields:%j', file, fields);
    resp.status(200).send('noAct');
  }
};

const addUploadAction = function(actName, actFunc) {
  uploadActions[actName] = actFunc;
};

const onUploadFinished = function(act, file, fields, resp) {
  // vlog.log('file:', file);
  const fileExt = file.originalFilename.substring(file.originalFilename.lastIndexOf('.'));
  if (!fileExts[fileExt]) {
    vlog.error('文件类型错误,不进行处理:', fileExt);
    return false;
  }
  file.path = file.filepath;
  if (!uploadActions[act]) {
    vlog.error('文件参数错误,不进行处理:', file.filepath, fields);
    return false;
  }
  uploadActions[act](file, fields, resp);
};

/**
 * 上传解析
 * @param  {object}   req
 * @param  {object}   resp
 * @param  {Function} next
 * @return {}
 */
const uploadParse = function(req, resp, next) {
  const form = new formidable.IncomingForm({
    'maxFieldsSize' : 150 * 1024 * 1024, //文件大小限制为最大150M
    'maxFileSize' : 150 * 1024 * 1024,
    'keepExtensions' : true, //保持文件的原扩展
  });
  const reqPath = req.path.substring(1, (req.path.indexOf('?') > 0) ? req.path.indexOf('?') : req.path.length);
  const uploadPath = reqPath.split('/');
  const act = (uploadPath.length >= 1) ? uploadPath[0] : 'noAct';
  const uploadDir = path.join(tempDir, reqPath);
  if (mkDirs(uploadDir)) {
    form.uploadDir = uploadDir; //文件保存的临时目录
  } else {
    form.uploadDir = tempDir; //文件保存的临时目录
  }
  // console.log('act=====:%j,uploadDir:%j', act, form.uploadDir);

  let state = 200;
  let respContent = error.json('ok');
  //文件上传开始
  form.on('fileBegin', function(name, file) {

    // vlog.log('file:%j,name:%j',file,name);

    // const filaName = file['name'];

    // const fileExt = filaName.substring(filaName.lastIndexOf('.'));
    // //判断文件类型是否允许上传
    // if (!fileExts[fileExt]) {
    //   vlog.error('--------> error file ext:%j',fileExt);
    //   return;
    // }
  });


  //文件上传中事件
  // form.on('progress', function(bytesReceived, bytesExpected) {
  // console.log('progress!' + bytesReceived + '____' + bytesExpected);
  // 百分比
  // const percent = Math.round(bytesReceived / bytesExpected * 100);
  // vlog.log('percent:%j', percent);
  // });

  form.on('error', function(err) {
    vlog.eo(err, 'upload err');
    state = 404;
    respContent = error.json('upload');
    resp.status(404).send(error.json('upload'));
    return;
  });
  form.on('aborted', function() {
    state = 404;
    respContent = error.json('uploadAbort');
    resp.status(404).send(error.json('uploadAbort'));
    return;
  });
  form.on('end', function() {
    // vlog.log('--> form.end');
    // resp.status(state).send(respContent); //在parse中回复
  });

  form.parse(req, function(err, fields, file) {
    if (err) {
      return;
    }
    // vlog.log('----> upload file:%j, fields:%j', file, fields);
    fields = fields || {};
    //这里将req.path得到的数组传入fields,以方便后续程序处理
    fields.uploadPathArr = uploadPath;
    //这里处理上传结束
    // process.nextTick(function() {
    onUploadFinished(act, file.file, fields, resp);

    // });


  });

};

const createUploadServer = function(dirs) {
  const router = express.Router();
  if (dirs) {
    if (dirs['tempDir']) {
      tempDir = dirs['tempDir'];
    }
  }
  mkDirs(tempDir);
  router.post('*', function(req, resp, next) {
    uploadParse(req, resp, next);
  });
  router.get('*', function(req, resp, next) {
    resp.status(404).send(error.json('uploadGet'));
  });
  return router;
};

exports.router = createUploadServer;
exports.createUploadServer = createUploadServer;
exports.addUploadAction = addUploadAction;
