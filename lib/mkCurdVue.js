/*
用于使用web/api/_curd生成的api，结合templets/curd.vue, 创建出对应的vue文件
使用时在创建好的web/api/abc.js中直接引用并执行make方法即可:
const mk = require('../../lib/mkCurdVue.js');
mk.make(prop);
 */

'use strict';
const Path = require('path');
const fileSyn = require('./fileSyn');

const tplPath = Path.join(__dirname, '../templets/curd.vue');


//这里定义需要处理的标签
const replaceTagArr = ['tb', 'tbName', 'listSlot', 'oneSlot', 'addSlot'];
const boolTagArr = ['downCsv'];


const replaceTag = function(tplStr, tagName, confObj) {
  if (confObj[tagName] === undefined) {
    confObj[tagName] = '';
  }
  const rex = new RegExp('\\[#' + tagName + '\\]', 'g');
  return tplStr.replace(rex, confObj[tagName]);
};


const strCutTag = function(strIn, po1, po2, po1Len = 0, po2Len = 0, newStr = undefined) {
  // console.log('po1:%d, po2:%d, po1Len:%d, po2Len:%d, newStr:%j', po1, po2, po1Len, po2Len, newStr);
  const preStr = strIn.substring(0, po1);
  const tailStr = strIn.substring(po2 + po2Len);
  const centerStr = strIn.substring(po1 + po1Len, po2);
  if (newStr !== undefined) {
    return preStr + newStr + tailStr;
  }
  return preStr + centerStr + tailStr;
};

const boolTag = function(tplStr, tagName, confObj) {
  const tagPreStr = '[#{' + tagName + ']';
  const tagEndStr = '[#}' + tagName + ']';
  const po1 = tplStr.indexOf(tagPreStr);
  let po2 = -1;
  if (po1 >= 0) {
    po2 = tplStr.indexOf(tagEndStr, po1);
    if (po2 >= 0) {
      if (confObj[tagName]) {
        //有值, 需要保留此段内容
        tplStr = strCutTag(tplStr, po1, po2, tagPreStr.length, tagEndStr.length);
      } else {
        //无值, 需要去除此段内容
        tplStr = strCutTag(tplStr, po1, po2, tagPreStr.length, tagEndStr.length, '');
      }
      return boolTag(tplStr, tagName, confObj);
    }
  }
  return tplStr;
};


// const s = '<el-col :span="12">[#{downCsv]<el-button size="small" type="info" @click="downCsv()">导出</el-button>[#}downCsv]</el-col>';
// console.log(strCutTag(s, s.indexOf('[#{downCsv]'), s.indexOf('[#}downCsv]'), '[#{downCsv]'.length,'[#{downCsv]'.length));
// console.log(boolTag(s, 'downCsv', { 'downCsv': false }));


const doTplTags = function(strIn, confObj) {
  for (let i = 0, len = replaceTagArr.length; i < len; i++) {
    strIn = replaceTag(strIn, replaceTagArr[i], confObj);
  }
  for (let i = 0, len = boolTagArr.length; i < len; i++) {
    strIn = boolTag(strIn, boolTagArr[i], confObj);
  }
  return strIn;
};


const make = function(confObj, src_dir) {
  const destFile = Path.join(src_dir, 'views/curd', confObj.tb + '.vue');
  fileSyn.synFileSync(tplPath, destFile, doTplTags, confObj);
  console.log('CURD vue created OK: ' + destFile);
};

exports.make = make;