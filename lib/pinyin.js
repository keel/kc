/*
中文拼音首字母处理,需要引入pinyin-pro库
 */
'use strict';
const kc = require('./kc');
const db = kc.mongo.init();
const vlog = require('vlog').instance(__filename);
const Pinyin = require('pinyin-pro');

//获取拼音首字母
const getPY = function(cnTxt) {
  return Pinyin.pinyin(cnTxt, { 'pattern': 'first', 'toneType': 'none', 'type': 'array' }).join('');
};

//检索最大数量
const maxSearch = 9999999999;

//配合进行拼音首字母查询
const searchPY = function(py, tableName, fields, query, callback) {
  const opt = { 'limit': maxSearch };
  if (fields) {
    opt.projection = fields;
  }
  py = py.trim().toLowerCase();
  if (!query) {
    query = { py: new RegExp(py) };
  } else {
    query.py = new RegExp(py);
  }
  db.c(tableName).query(query, opt, (err, searchRe) => {
    if (err) {
      return callback(vlog.ee(err, 'searchPY', py));
    }
    callback(null, searchRe);
  });
};

//对表按name字段批量生成py字段
const mkPY = function(tableName, callback) {
  const field = 'name';
  db.c(tableName).query({}, { 'limit': maxSearch }, (err, tReArr) => {
    if (err) {
      return callback(vlog.ee(err, 'mkPY', tableName));
    }
    if (tReArr.length <= 0) {
      return callback();
    }
    db.getColl(tableName, function(err, coll) {
      if (err || !coll) {
        callback(vlog.ee(err, 'getColl'));
        return;
      }
      const bulk = coll.initializeUnorderedBulkOp();
      for (let i = 0, len = tReArr.length; i < len; i++) {
        const pyStr = getPY(tReArr[i][field]);
        bulk.find({ '_id': tReArr[i]._id }).updateOne({ '$set': { 'py': pyStr } });
        // db.c(tableName).updateOne({ '_id': tReArr[i]._id }, { '$set': { 'py': pyStr } });
      }
      bulk.execute().then((re) => {
        callback(null, re);
      });
    });
  });
};

exports.getPY = getPY;
exports.mkPY = mkPY;
exports.searchPY = searchPY;

// mkPY('ht_media', (err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log('re:%j', re);
//   console.log('end');
// });

// searchPY('cs', 'ht_media', { '_id': 1, 'name': 1 },null, (err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log(re);
// });