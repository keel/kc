/*
curd,默认与vue前端配合,示例见最下方注释
 */
'use strict';
const kc = require('../../lib/kc');
const ktool = require('ktool');
const iApi = kc.iApi;
const error = require('../../lib/error');
const vlog = require('vlog').instance(__filename);
// const manager = require('./_curdManager');



//prop加工处理
const processProp = function(prop) {
  const listProjection = {};
  const fieldsMap = {};
  const validatorAdd = {};
  const validatorUpdate = {};
  const checkTypeMap = {};
  const formatterArr = [];
  const tableTitles = [];
  for (let i = 0, len = prop.fields.length; i < len; i++) {
    const item = prop.fields[i];
    fieldsMap[item.col] = item;
    if (!item.hide || (item.hide.indexOf('all') < 0)) {
      listProjection[item.col] = 1;
      const titleObj = { 'prop': item.col, 'label': item.name, 'input': item.input, 'hide': item.hide, 'search': item.search };
      if (item.width) {
        titleObj.width = item.width;
      }
      if (item.input) {
        titleObj.input = item.input;
      }
      tableTitles.push(titleObj);
    }

    if (item.validator) {
      if (typeof item.validator === 'string' && item.validator.charAt(0) === '@') {
        const valKey = item.col;
        const valiVal = item.validator.substring(1);
        validatorAdd['@' + valKey] = valiVal;
        validatorUpdate['@' + valKey] = valiVal;
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
    prop.db = kc.mongo.init();
    prop.dbConf = 'default';
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
  'string': (data) => { return '' + data; },
  'float': (data) => { return parseFloat(data); },
  'array': (data) => { return (typeof data === 'string') ? ktool.strToArr(data) : data; },
  'json': (data) => { return JSON.parse(data); },
  'inc': (data) => {
    let incNum = 1;
    if (data) {
      incNum = parseInt(data);
    }
    return incNum;
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
    let _inc = null;
    const checkObj = me.checkTypeMap;
    for (const i in checkObj) {
      if (reqObj[i] !== undefined) {
        const typeName = checkObj[i];
        const typeFn = updateSetMap[typeName];
        if (typeFn) {
          if (typeName === 'inc') {
            if (!_inc) {
              _inc = {};
            }
            _inc[i] = typeFn(reqObj[i], reqObj, i);
          } else {
            _set[i] = typeFn(reqObj[i], reqObj, i);
          }
        } else {
          _set[i] = reqObj[i];
        }
      }
    }
    const out = { '$set': _set };
    if (_inc) {
      out['$inc'] = _inc;
    }
    // vlog.log('_curd setUpdate:%j',out);
    return out;
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
    me.db.c(me.tb, me.dbConf).findOne({ '_id': me.db.idObj(req.body.id) }, function(err, re) {
      if (err) {
        vlog.eo(err, 'showId', me.tb + '/' + req.body.id);
        return callback(null, error.json('curdOne'));
      }
      if (re) {
        if (me.formatter) {
          for (const f in me.formatter) {
            re[f] = me.formatter[f](re[f]);
          }
        }
        me.onOne(req, re, (err, reData) => {
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

          return callback(null, respObj);
        });

      } else {
        resp.send(error.json('404'));
      }
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
      const val = search[key];
      if (keyType) {
        if (keyType === 'int' || keyType === 'inc') {
          query[key] = parseInt(val);
        } else if (keyType === 'array') {
          query[key] = { '$all': ktool.strToArr(val) };
        } else {
          query[key] = {
            '$regex': val
          };
        }
      }
    }


    // let po;
    // try {
    //   po = JSON.parse(search);
    // } catch (e) {
    //   po = search;
    // }
    // if (typeof po == 'object') {
    //   for (const key in po) {
    //     const keyType = me.checkTypeMap(key);
    //     const val = po[key];
    //     if (keyType) {
    //       // vlog.log('search value:%s',val);
    //       if (keyType === 'int' || keyType === 'inc') {
    //         query[key] = parseInt(val);
    //       } else if (keyType === 'array') {
    //         query[key] = { '$all': ktool.strToArr(val) };
    //       } else {
    //         query[key] = {
    //           '$regex': val
    //         };
    //       }
    //     }
    //   }
    // } else {
    //   const po = search.indexOf(':');
    //   const key = (po < 0) ? me.defaultSearch : search.substring(0, po).trim();
    //   const val = (po < 0) ? search.trim() : search.substring(po + 1).trim();
    //   // vlog.log('search key:%s',key);
    //   const keyType = me.checkTypeMap(key);
    //   if (keyType) {
    //     // vlog.log('search value:%s',val);
    //     if (keyType === 'int' || keyType === 'inc') {
    //       query[key] = parseInt(val);
    //     } else if (keyType === 'array') {
    //       query[key] = { '$all': ktool.strToArr(val) };
    //     } else {
    //       query[key] = {
    //         '$regex': val
    //       };
    //     }
    //   }
    // }
  };


  me.doList = function(req, resp, query, callback) {
    mkListQueryFromSearch(req, query);
    // vlog.log('req.body:%j',req.body);

    const start = parseInt(req.body.start);
    const length = parseInt(req.body.length);

    me.db.getColl(me.tb, me.dbConf, function(err, coll) {
      if (err) {
        return callback(vlog.ee(err, 'count checkColl'));
      }
      coll.countDocuments(query, {}, function(err, allCount) {
        if (err) {
          return callback(vlog.ee(err, 'count'));
        }
        const opt = {
          'projection': me.listProjection,
          'skip': start,
          'limit': length,
        };
        if (me.listSort) {
          opt.sort = me.listSort;
        }
        me.db.c(me.tb, me.dbConf).query(query, opt, function(err, docs) {
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
      'state': {
        '$gte': 0
      }
    };
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
      const query = {
        '_id': me.db.idObj(reqData._id)
      };
      const update = me.setUpdate(reqData);
      if (update === null) {
        resp.send(error.json('params'));
        return;
      }
      // vlog.log('curd update: %j,query:%j',update,query);
      me.db.c(me.tb, me.dbConf).updateOne(query, update, { 'upsert': false }, function(err) {
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
    const query = {
      _id: me.db.idObj(reqData._id)
    };
    // vlog.log('curd del: %j',query);
    me.db.c(me.tb, me.dbConf).deleteOne(query, null, function(err, re) {
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
      if (!dbObj._id) {
        const objId = me.db.newObjectId();
        dbObj['_id'] = objId;
      }
      // vlog.log('dbObj:%j',dbObj);
      me.db.c(me.tb, me.dbConf).insertOne(dbObj, function(err, re) {
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


  const updateOne = function(req, resp, callback) {
    // if (me.authPath) { //iApi会自动检测权限
    //   if (!kc.auth.auth(req, me.authPath + '/updateOne')) {
    //     return callback(null, error.json('auth'));
    //   }
    // }
    const reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
    if (reqDataArr[0] !== 0) {
      return error.apiErr('iApi updateOne', callback, '' + reqDataArr[0]);
    }
    const reqData = reqDataArr[1];
    const editType = reqData.type;
    const editCol = reqData.col;
    const editVal = reqData.val;
    const listFiles = me.listProjection;
    const listKeys = Object.keys(listFiles);
    const editKey = listKeys[editCol];
    reqData.editKey = editKey;
    reqData[editKey] = editVal;

    me.onUpdateOne(req, reqData, (err) => {
      if (err) {
        return error.apiErr(err, callback, 'curdOnUpdateOne');
      }
      // vlog.log('curd updateOne reqData:%j', reqData);
      const query = {
        _id: me.db.idObj(reqData._id)
      };

      const update = me.setUpdate(reqData);
      if (update === null) {
        callback(null, error.json('params'));
        return;
      }

      if (editType === 'del') {
        //直接删除!!
        me.db.c(me.tb, me.dbConf).deleteOne(query, function(err) {
          if (err) {
            return error.apiErr(err, callback, 'curdUpdateOne');
          }
          const respObj = iApi.makeApiResp(0, { 'code': 'ok' }, me.apiKey);

          callback(null, respObj);
        });
        // me.db.c(me.tb, me.dbConf).updateOne(query, { '$set': { 'state': -1 } }, { 'upsert': false }, function(err) {
        //   if (err) {
        //     return error.apiErr(err, callback, 'onUpdateOne');
        //   }
        //   const respObj = iApi.makeApiResp(0, { 'code': 'ok' }, me.apiKey);
        //   //返回
        //   callback(null, respObj);
        // });
        return;
      }
      // vlog.log('curd updateOne: %j,query:%j', update, query);
      me.db.c(me.tb, me.dbConf).updateOne(query, update, { 'upsert': false }, function(err, re) {
        if (err) {
          return error.apiErr(err, callback, 'curdUpdateOne');
        }
        const changeIndexs = [4, 13, 14];
        const listFiles = me.listProjection;
        const listKeys = Object.keys(listFiles);

        const result = {};
        for (const i in changeIndexs) {
          result[changeIndexs[i]] = update['$set'][listKeys[changeIndexs[i]]];
        }

        const respObj = iApi.makeApiResp(0, result, me.apiKey);
        //返回
        callback(null, respObj);
        if (me.events['updateOK']) {
          me.events['updateOK'](req.body, req.userId, req.userLevel);
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
      'state': {
        '$gte': 0
      }
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
      'updateOne': {
        'showLevel': me.uLevel,
        'validator': me.validatorUpdate,
        // 'isXssFilter': true,
        'resp': updateOne,
        'authName': '-单项修改',
      },
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
        'authPath': me.authPath + '/csv',
      },
    }
  };

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

//