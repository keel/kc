/*
curd(mysql版本),默认与vue前端配合,示例见最下方注释
暂未实现dbConf支持多个mysql源
 */
'use strict';
const kc = require('../../lib/kc');
const ktool = require('ktool');
const iApi = kc.iApi;
const error = require('../../lib/error');
const vlog = require('vlog').instance(__filename);
// const manager = require('./_curdManager');


const bigintToStr = function(strVal) {
  const len = strVal.length;
  if (len < 15) {
    return parseInt(strVal);
  }
  const pre = '' + parseInt(strVal.substring(0, 15));
  return pre + bigintToStr(strVal.substring(15));
};


const sql_type_map = {
  'string': {
    'sql_compare_val': function(sKey, sVal, compareType = '=') {
      return '`' + sKey + '`' + compareType + '"' + sVal + '" ';
    },
    'getVal': function(sKey, sVal) {
      return '"' + kc.mysql.escape(sVal) + '"';
    },
  },
  'bigint': {
    'sql_compare_val': function(sKey, sVal, compareType = '=') {
      return '`' + sKey + '`' + compareType + sVal + ' ';
    },
    'getVal': function(sKey, sVal) {
      return bigintToStr('' + sVal);
    },
  },
  'int': {
    'sql_compare_val': function(sKey, sVal, compareType = '=') {
      return '`' + sKey + '`' + compareType + sVal + ' ';
    },
    'getVal': function(sKey, sVal) {
      return '' + parseInt(sVal);
    },
  },
  'float': {
    'sql_compare_val': function(sKey, sVal, compareType = '=') {
      return '`' + sKey + '`' + compareType + sVal + ' ';
    },
    'getVal': function(sKey, sVal) {
      return '' + parseFloat(sVal);
    },
  },
};
const sql_compare = function(sKey, sVal, compareType = '=', sType = 'string') {
  return sql_type_map[sType]['sql_compare_val'](sKey, kc.mysql.escape(sVal), compareType);
};

const sql_get_val = function(me, sKey, sVal, knownType) {
  const sType = knownType || me.checkTypeMap[sKey];
  // console.log('sql_get_val sType:%j, sVal:%j', sType, sVal);
  if (!sql_type_map[sType]) {
    return kc.mysql.escape(sVal);
  }
  const out = sql_type_map[sType].getVal(sKey, sVal);
  // console.log('=======', out);
  return out;
};


const sql_where = function(queryObj) {
  if (!queryObj) {
    return '';
  }
  let append = '';
  for (const i in queryObj) {
    append += ' and `' + i + '` ' + queryObj[i] + ' ';
  }
  if (append === '') {
    return '';
  }
  return ' where ' + append.substring(4);
};

const sql_select = function(tb, queryObj, opt = {}) {
  let cols = '*';
  if (opt.projection) {
    cols = '';
    for (const i in opt.projection) {
      cols += ',' + i;
    }
    if (cols === '') {
      cols = '*';
    } else {
      cols = cols.substring(1);
    }
  }

  let out = 'select ' + cols + ' from `' + tb + '` ';
  out += sql_where(queryObj);
  if (opt.sort) {
    out += ' order by ' + opt.sort;
  }
  if (opt.limit) {
    out += ' limit ' + (opt.skip || '0') + ',' + opt.limit;
  }
  return out;
};

const sql_update = function(tb, update, queryObj) {
  let out = 'update `' + tb + '` set ';
  let udpateAppend = '';
  for (const i in update) {
    udpateAppend += ' ,' + i + '=' + update[i];
  }
  if (udpateAppend !== '') {
    udpateAppend = udpateAppend.substring(2);
  }
  out += udpateAppend + sql_where(queryObj);
  return out;
};

//prop加工处理
const processProp = function(prop) {
  const listProjection = {};
  const fieldsMap = {};
  const validatorAdd = {};
  const validatorUpdate = {};
  const checkTypeMap = {};
  const formatterArr = [];
  const tableTitles = [];
  if (!prop.linkToOneColName) {
    prop.linkToOneColName = 'name';
  }
  for (let i = 0, len = prop.fields.length; i < len; i++) {
    const item = prop.fields[i];
    fieldsMap[item.col] = item;
    if (!item.hide || (item.hide.indexOf('all') < 0)) {
      listProjection[item.col] = 1;
      const titleObj = { 'prop': item.col, 'label': item.name, 'info': item.info, 'default': item.default, 'input': item.input, 'hide': item.hide, 'search': item.search };
      if (item.width) {
        titleObj.width = item.width;
      }
      if (item.input) {
        titleObj.input = item.input;
      }
      tableTitles.push(titleObj);
    }

    if (item.validator) {
      if (item.validator.optional) {
        if (item.validator.optional.indexOf('add') >= 0 || item.validator.optional === 'all') {
          validatorAdd['@' + item.col] = item.validator.validator;
        } else {
          validatorAdd[item.col] = item.validator.validator;
        }
        validatorUpdate['@' + item.col] = item.validator.validator;
      } else {
        validatorAdd[item.col] = item.validator;
        validatorUpdate['@' + item.col] = item.validator;
      }
    }
    if (item.type) {
      checkTypeMap[item.col] = item.type;
    } else {
      checkTypeMap[item.col] = 'unknown';
    }
    if (item.formatter) {
      formatterArr.push({ 'col': item.col, 'fn': item.formatter });
    }

  }
  prop.listProjection = listProjection;
  prop.checkTypeMap = checkTypeMap;
  prop.fieldsMap = fieldsMap;
  prop.validatorAdd = validatorAdd;
  prop.validatorUpdate = validatorUpdate;
  prop.formatterArr = formatterArr;
  prop.tableTitles = tableTitles;
  //处理默认值
  if (!prop.tbName) {
    prop.tbName = prop.tb;
  }
  if (!prop.apiKey) {
    prop.apiKey = kc.kconfig.get('s$_apiKey');
  }
  if (!prop.defaultSearch) {
    prop.defaultSearch = 'name';
  }
  if (!prop.listAllState) {
    prop.listAllState = false;
  }
  if (!prop.db || !prop.dbConf) {
    prop.db = kc.mysql.init();
  }
  if (!prop.col_id) {
    prop.col_id = 'id';
  }
  if (!prop.col_id_create) {
    prop.col_id_create = () => {
      return Date.now() + ktool.randomStr(7);
    };
  }
  if (!prop.onAdd) {
    prop.onAdd = function(req, reqData, callback) { callback(null, reqData); };
  }
  if (!prop.onUpdate) {
    prop.onUpdate = function(req, reqData, callback) { callback(null, reqData); };
  }
  if (!prop.onList) {
    prop.onList = function(req, listArr, callback) { callback(null, listArr); };
  }
  if (!prop.onOne) {
    prop.onOne = function(req, oneData, callback) { callback(null, oneData); };
  }
  if (!prop.onDel) {
    prop.onDel = function(req, id, callback) { callback(null, id); };
  }
  if (!prop.beforeList) {
    prop.beforeList = function(req, query, callback) { callback(null, query); };
  }
  const curdArr = ['c', 'u', 'r', 'd', 'm'];
  const lvLen = (prop.curdLevel) ? prop.curdLevel.length : 0;
  for (let i = 0, len = curdArr.length; i < len; i++) {
    const lvVal = (lvLen <= i) ? 0 : parseInt(prop.curdLevel[i]);
    const lvKey = curdArr[i] + 'Level';
    prop[lvKey] = lvVal;
  }
  return prop;
};


const updateSetMap = {
  'int': (data) => { return parseInt(data); },
  'bigint': (data) => { return bigintToStr(data); },
  'string': (data) => { return '"' + data + '"'; },
  'float': (data) => { return parseFloat(data); },
  // 'array': (data) => { return (typeof data === 'string') ? ktool.strToArr(data) : data; },
  // 'json': (data) => { return JSON.parse(data); },
  'inc': (data, reqObj, i) => {
    let incNum = 1;
    if (data) {
      incNum = parseInt(data);
    }
    return '' + i + '+' + incNum;
  },
  'pwd': (data, reqObj, i) => {
    // const newPwd = (reqObj.createTime) ? data + ',' + reqObj.createTime : data;
    // return ktool.sha1(newPwd);
    return data;
  },
};

function instance(prop) {
  const me = processProp(prop);
  me.events = {};
  me.on = function(event, fn) {
    me.events[event] = fn;
  };

  me.setUpdate = function(reqObj) {
    const _set = {};
    const checkObj = me.checkTypeMap;
    for (const i in checkObj) {
      if (i === me.col_id) {
        continue;
      }
      if (reqObj[i] !== undefined) {
        const typeName = checkObj[i];
        const typeFn = updateSetMap[typeName];
        if (typeFn) {
          _set[i] = typeFn(reqObj[i], reqObj, i);
        } else {
          _set[i] = reqObj[i];
        }
      }
    }
    // vlog.log('_curd setUpdate:%j',out);
    return _set;
  };

  const reDataTables = function(showNew, showOne, draw, recordsTotal, recordsFiltered, data) {
    if (!data) {
      return error.json('curdList', 'listData');
    }
    if (me.formatterArr.length > 0) {
      for (let i = 0, len = data.length; i < len; i++) {
        for (const j in me.formatterArr) {
          const fm = me.formatterArr[j];
          data[i][fm.col] = fm.fn(data[i][fm.col]);
        }
      }
    }
    const re = {
      'code': 0,
      draw,
      recordsTotal,
      recordsFiltered,
      data,
      showNew,
      showOne,
      'tableTitles': me.tableTitles,
      'col_id': me.col_id,
      'link_col': me.linkToOneColName,
    };
    return re;
  };



  const showId = function(req, resp, callback) {
    if (parseInt(req.userLevel) < me.rLevel && req.body.id !== req.userId) {
      return callback(null, error.json('level'));
    }
    if (!req.body.id) {
      return error.apiErr('空id', callback, '404');
    }
    let showUpdate = true;
    let showDel = true;
    if (me.authPath) {
      // if (!kc.auth.auth(req, me.authPath + '/one')) {  //iApi会自动检测权限
      //   return callback(null, error.json('auth'));
      // }
      if (!req.sessionValue.userPermission[me.authPath + '/del']) {
        showDel = false;
      }
      if (!req.sessionValue.userPermission[me.authPath + '/update']) {
        showUpdate = false;
      }
    }
    const sql = `select * from  ${me.tb} where ${sql_compare(me.col_id, req.body.id, '=', me.checkTypeMap[me.col_id])} limit 1`;
    // console.log('showId sql', sql);
    me.db.c().query(sql, function(err, reArr) {
      if (err) {
        vlog.eo(err, 'showId', me.tb + '/' + req.body.id);
        return callback(null, error.json('curdOne'));
      }
      if (reArr.length <= 0) {
        return callback(null, { 'code': 0, 'data': [], showUpdate, showDel });
      }
      const re = reArr[0];
      if (me.formatter) {
        for (const f in me.formatter) {
          re[f] = me.formatter[f](re[f]);
        }
      }
      me.onOne(req, re, (err, reData, paras) => {
        if (err) {
          vlog.eo(err, 'showId.onOne', me.tb + '/' + req.body.id);
          return callback(null, error.json('curdOne'));
        }
        const respObj = {
          'code': 0,
          'data': reData,
          showUpdate,
          showDel,
        };
        if (paras) {
          respObj['paras'] = paras;
        }
        return callback(null, respObj);
      });

    });
  };


  const mkListQueryFromSearch = function(req, query) {
    // const search = ktool.dotSelector(req.body, 'search.value');
    const search = req.body.search;
    if (!search) {
      return;
    }
    for (const key in search) {
      const keyType = me.checkTypeMap[key];
      const val = kc.mysql.escape(search[key]);
      if (keyType) {
        if (keyType === 'int' || keyType === 'inc') {
          query[key] = '=' + parseInt(val);
        } else if (keyType === 'string') {
          query[key] = 'like "%' + val + '%"';
        } else {
          query[key] = '=' + val;
        }
      }
    }
  };


  me.doList = function(req, resp, query, callback) {
    mkListQueryFromSearch(req, query);
    // vlog.log('req.body:%j',req.body);

    const start = parseInt(req.body.start);
    const length = parseInt(req.body.length);
    const sql_count = 'SELECT COUNT(*) AS count FROM ' + me.tb + sql_where(query);
    // console.log('=====sql_count:',sql_count);
    me.db.c().query(sql_count, (err, countRe) => {
      if (err) {
        return callback(vlog.ee(err, ''));
      }
      const allCount = countRe[0].count;

      const opt = {
        'projection': me.listProjection,
        'skip': start,
        'limit': length,
      };
      if (me.listSort) {
        opt.sort = me.listSort;
      }
      const sql = sql_select(me.tb, query, opt);
      // console.log('doList sql', sql);
      me.db.c().query(sql, function(err, docs) {
        if (err) {
          vlog.error(err.stack);
          callback(null, { allCount });
          return;
        }
        // vlog.log('docs:%j',docs);
        if (docs && docs.length > 0) {
          me.onList(req, docs, (err, respData) => {
            if (err) {
              return vlog.eo(err, '');
            }
            callback(null, { allCount, 'list': respData });
          });
        } else {
          callback(null, { allCount, 'list': [] });
        }
      });


    });


  };

  const list = function(req, resp, callback) {
    let showNew = true;
    let showOne = true;
    if (me.authPath) {
      // if (!kc.auth.auth(req, me.authPath + '/list')) { //iApi会自动检测权限
      //   return callback(null, (error.json('auth')));
      // }
      if (!req.sessionValue.userPermission[me.authPath + '/add']) {
        showNew = false;
      }
      if (!req.sessionValue.userPermission[me.authPath + '/one']) {
        showOne = false;
      }
    }
    const draw = parseInt(req.body.draw);
    if (isNaN(draw)) {
      callback(null, (error.json('curdList')));
      return;
    }
    let query = (me.listAllState) ? {} : {
      'state': '>=0 ',
    };
    me.beforeList(req, query, function(err, queryRe) {
      if (err) {
        return callback(vlog.ee(err, 'beforeList'));
      }
      query = queryRe;
      if (req.userLevel < me.listAllLevel && me.creatorFilter) {
        query[me.creatorFilter] = '="' + req.userId + '"';
      }
      // console.log('list query:%j\n%s', query);
      me.doList(req, resp, query, (err, doListRe) => {
        if (err) {
          return callback(vlog.ee(err, 'doList'));
        }
        const pageCount = (doListRe.list) ? doListRe.list.length : 0;
        callback(null, reDataTables(showNew, showOne, draw, doListRe.allCount, pageCount, doListRe.list));
      });
    });
  };


  const update = function(req, resp, callback) {
    // if (me.authPath) {  //iApi会自动检测权限
    //   if (!kc.auth.auth(req, me.authPath + '/update')) {
    //     return callback(null, (error.json('auth')));
    //   }
    // }
    const reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
    if (reqDataArr[0] !== 0) {
      return error.apiErr('iApi update', callback, '' + reqDataArr[0]);
      // return callback(vlog.ee(new Error('iApi update'), 'kc iApi update error', reqDataArr), null, 200, reqDataArr[0]);
    }
    const reqData = reqDataArr[1];

    me.onUpdate(req, reqData, (err) => {
      if (err) {
        return error.apiErr(err, callback, 'curdOnUpdate');
      }
      const query = {};
      query[me.col_id] = '=' + sql_get_val(me, me.col_id, reqData[me.col_id]);
      const update = me.setUpdate(reqData);
      if (update === null) {
        resp.send(error.json('params'));
        return;
      }
      // console.log('curd update: %j,query:%j\n%s', update, query, sql_update(me.tb, update, query));
      me.db.c().query(sql_update(me.tb, update, query), function(err) {
        if (err) {
          return error.apiErr(err, callback, 'curdUpdate');
        }
        const respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
        //返回
        callback(null, respObj);
        if (me.events['updateOK']) {
          me.events['updateOK'](req.body, req.userId, req.userLevel);
        }
      });
    });
  };

  const del = function(req, resp, callback) {
    // if (me.authPath) { //iApi会自动检测权限
    //   if (!kc.auth.auth(req, me.authPath + '/del')) {
    //     return callback(null, error.json('auth'));
    //   }
    // }
    const reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
    if (reqDataArr[0] !== 0) {
      return error.apiErr('iApi del', callback, '' + reqDataArr[0]);
    }
    const reqData = reqDataArr[1];
    // vlog.log('del reqData:%j',reqData);
    const sql = 'delete from `' + me.tb + '` where `' + me.col_id + '` = ' + sql_get_val(me, me.col_id, reqData.id);
    // console.log('curd del: %j', sql);
    me.db.c().query(sql, function(err, re) {
      if (err) {
        return error.apiErr(err, callback, 'curdDel');
      }
      const respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
      callback(null, respObj);
      if (me.events['hardDelOK']) {
        me.events['hardDelOK'](req.body, req.userId, req.userLevel);
      }
    });
  };

  const add = function(req, resp, callback) {
    // if (me.authPath) { //iApi会自动检测权限
    //   if (!kc.auth.auth(req, me.authPath + '/add')) {
    //     return callback(null, error.json('auth'));
    //   }
    // }
    const reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
    if (reqDataArr[0] !== 0) {
      return error.apiErr('iApi add', callback, '' + reqDataArr[0]);
    }
    const reqData = reqDataArr[1];
    // vlog.log('curd add req body:%j',req.body);

    me.onAdd(req, reqData, function(err, dbObj) {
      if (err) {
        return error.apiErr(err, callback, 'curdOnAdd');
      }
      if (!dbObj) {
        //无添加对象时，直接按添加成功结束处理
        const respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
        callback(null, respObj);
        if (me.events['addOK']) {
          me.events['addOK'](req.body, req.userId, req.userLevel, dbObj);
        }
        return;
      }
      if (!dbObj[me.col_id]) {
        dbObj[me.col_id] = me.col_id_create();
      }
      // vlog.log('dbObj:%j',dbObj);
      let sql = 'insert into ' + me.tb + ' (';
      let keyAppend = '';
      let valAppend = '';
      for (const i in dbObj) {
        keyAppend += ',' + i;
        valAppend += ',' + sql_get_val(me, i, dbObj[i]);
      }
      if (keyAppend !== '') {
        keyAppend = keyAppend.substring(1);
      }
      if (valAppend !== '') {
        valAppend = valAppend.substring(1);
      }
      sql += keyAppend + ') values (' + valAppend + ')';
      // console.log('add sql:', sql);
      me.db.c().query(sql, function(err, re) {
        if (err) {
          return error.apiErr(err, callback, 'curdAdd');
        }
        // vlog.log('curd add re:%s',re);
        const respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
        callback(null, respObj);
        if (me.events['addOK']) {
          me.events['addOK'](req.body, req.userId, req.userLevel, dbObj);
        }
      });
    });
  };



  /**
   * outCsv
   * @param  {array} colArr  [{prop:'name','label':'名称'},{prop:'age','label':'年龄'}]
   * @param  {array} dataArr [{'name':'Mike','age':23},{'name':'Jerry','age'32}]
   * @param  {response} resp
   * @return {void}
   */
  const outCsv = function(colArr, dataArr, csvName, resp) {
    let outStr = '';
    const firstLine = [];
    const keyArr = [];
    for (let i = 0, len = colArr.length; i < len; i++) {
      keyArr.push(colArr[i].prop);
      firstLine.push(colArr[i].label.replace(/,/g, '，'));
    }
    outStr += firstLine.join(',') + '\r\n';
    for (let i = 0, len = dataArr.length; i < len; i++) {
      const dataOne = dataArr[i];
      const lineArr = [];
      for (let j = 0, len = keyArr.length; j < len; j++) {
        let oneValue = dataOne[keyArr[j]];
        if (Array.isArray(oneValue)) {
          oneValue = oneValue.join('，');
        } else if (typeof oneValue === 'object') {
          oneValue = JSON.stringify(oneValue);
        }
        if (typeof oneValue !== 'number' || isNaN(oneValue)) {
          oneValue = ('' + oneValue).replace(/,/g, '，');
        }
        lineArr.push(oneValue);
      }
      outStr += lineArr.join(',') + '\r\n';
    }
    const outBuffer = Buffer.from('\uFEFF' + outStr, { 'encoding': 'utf8' });
    // const fileName = 'out_' + new Date().getTime() + '.csv';
    resp.header['Content-Type'] = 'application/octet-stream';
    resp.header['Content-Disposition'] = 'attachment; filename=' + csvName;
    resp.header['Content-Length'] = outBuffer.length;
    resp.send(outBuffer);
  };


  const downloadCsv = function(req, resp, callback) {
    let query = (me.listAllState) ? {} : {
      'state': '>=0'
    };
    // console.log('csv ==> req.params:%j',req.params);
    // console.log('csv ==> req.body:%j',req.body);
    if (req.body.search) {
      req.body.search = JSON.parse(req.body.search);
    }
    me.beforeList(req, query, function(err, queryRe) {
      if (err) {
        return callback(vlog.ee(err, 'beforeList'));
      }
      query = queryRe;
      if (req.userLevel < me.listAllLevel && me.creatorFilter) {
        query[me.creatorFilter] = req.userId;
      }
      // console.log('query:%j',query);
      me.doList(req, resp, query, (err, doListRe) => {
        if (err) {
          return callback(vlog.ee(err, 'downloadCsv.doList'));
        }
        if (!doListRe.list) {
          return error.apiErr(err, callback, 'curdCSV');
        }
        const csvName = req.params.csv || me.tbName + '_' + Date.now() + '.csv';
        outCsv(me.tableTitles, doListRe.list, csvName, resp);
      });
    });
  };


  const iiConfig = {
    'auth': true,
    'authPath': me.authPath,
    'authName': me.authName || me.tbName,
    'act': {
      'list': {
        'showLevel': me.rLevel,
        // 'isXssFilter': true,
        'resp': list,
        'authName': '-列表',
      },
      'add': {
        'showLevel': me.cLevel,
        'validator': me.validatorAdd,
        // 'isXssFilter': true,
        'resp': add,
        'authName': '-新建',
      },
      'update': {
        'showLevel': me.uLevel,
        'validator': me.validatorUpdate,
        // 'isXssFilter': true,
        'resp': update,
        'authName': '-修改',
      },
      // 'updateOne': { //单项修改用于在列表的表格中双击某单元格直接修改,这里暂不实现
      //   'showLevel': me.uLevel,
      //   'validator': me.validatorUpdate,
      //   // 'isXssFilter': true,
      //   'resp': updateOne,
      //   'authName': '-单项修改',
      // },
      'del': {
        'showLevel': me.dLevel,
        // 'validator': me.validatorDel,
        // 'isXssFilter': true,
        'resp': del,
        'authName': '-硬删除',
      },
      'one': {
        'showLevel': me.rLevel,
        // 'validator': me.validatorDel,
        // 'isXssFilter': true,
        'resp': showId,
        'authName': '-详情页',
      },
      'csv/:csvName': {
        'bodyParserType': 'urlencoded',
        'bodyParserTypeOption': { 'extended': true },
        'showLevel': me.rLevel,
        // 'validator': me.validatorDel,
        // 'isXssFilter': true,
        'resp': downloadCsv,
        'authName': '-导出csv',
        'authPath': me.authPath + '/csv', //定义authPath,覆盖路径定义
      },
    }
  };

  if (me.iiConf) {
    ktool.merge(iiConfig, me.iiConf);
  }

  //由以上配置生成router
  const router = iApi.getRouter(iiConfig);


  me.router = router;
  // if (prop.manager === 'yes') {
  //   const mi = manager.instance(me);
  //   me.manager = mi;
  //   router.use('/manage', mi.router);
  // }
  router.get('*', function(req, resp, next) {
    resp.send(error.json('404'));
  });
  return me;
}
exports.instance = instance;


// const db = kc.mysql.init();
// db.c().query('SELECT COUNT(*) AS count FROM base_jczinfo', (err, countRe) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log('%j', countRe);

// });

//