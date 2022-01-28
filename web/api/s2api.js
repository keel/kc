/*
按拼音字母快速检索的api,类似select2的功能
 */
'use strict';
const kc = require('../../lib/kc');
const iCache = kc.iCache;
const Pinyin = require('../../lib/pinyin');
const iApi = kc.iApi;
const vlog = require('vlog').instance(__filename);

//配置需要使用字母检索功能的表
const tableArr = [
  { 'tbName': 'product', 'letterLimit': 2, 'projection': { '_id': 1, 'name': 1 } },
];

//用于显示预先选择好的select对象
const oldData = (cachePre, txtKey = 'name', idKey = '_id') => (req, resp, callback) => {
  if (!req.body) {
    return callback(null, []);
  }
  try {
    const valArr = req.body;
    const out = [];

    for (let i = 0, len = valArr.length; i < len; i++) {
      // const cObj = iCache.getSync('ht_box:_id:' + valArr[i]);
      const cObj = iCache.getSync(cachePre + valArr[i]);
      if (cObj) {
        out.push({ 'text': cObj[txtKey], 'id': '' + cObj[idKey] });
      }
    }
    callback(null, out);
  } catch (e) {
    vlog.eo(e, 'oldData', req.body.q);
    callback(null, []);
  }

};

//按表的py字段进行快速检索
const queryData = (tbName, newLetterLimit = 2, projection = { '_id': 1, 'name': 1 }) => (req, resp, next) => { // eslint-disable-line
  if (!req.query.q || req.query.q.length < newLetterLimit) {
    resp.send('[]');
    return;
  }
  const py = req.query.q.trim();
  Pinyin.searchPY(py, tbName, projection, {}, (err, re) => {
    if (err) {
      return vlog.eo(err, '');
    }
    resp.send(JSON.stringify(re));
  });
};

const iiConfig = {
  'auth': true,
  'act': {}
};

for (let i = 0, len = tableArr.length; i < len; i++) {
  const one = tableArr[i];
  const key = one.tbName + '/oldData';
  iiConfig.act[key] = {
    'resp': oldData(one.tbName + ':_id:'),
  };
}

exports.router = function() {
  const router = iApi.getRouter(iiConfig);

  for (let i = 0, len = tableArr.length; i < len; i++) {
    const one = tableArr[i];
    router.get('/' + one.tbName, queryData(one.tbName, one.newLetterLimit, one.projection));
  }

  router.get('*', function(req, resp, next) { // eslint-disable-line
    resp.status(404).send('404');
  });

  return router;
};