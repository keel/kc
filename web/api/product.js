/*
CURD配置,完整示例
 */
'use strict';
const cck = require('cck');
const kc = require('../../lib/kc');
const Pinyin = kc.pinyin; //引入拼音首字母便于快速检索
const vlog = require('vlog').instance(__filename);
const curd = require('./_curd');

const db = kc.mongo.init();


// ======>注: 除tb,fields字段必填, 其余均为选填
const prop = {
  'tb': 'product', //表名, 必填
  'tbName': '产品', //表名显示, 不填则为tb
  // 'db': db, //在使用不同数据库时与dbConf共同指定, 使用默认mongo可省略此项配置
  // 'dbConf': dbConfName, //配合db参数使用
  // 'apiKey': kc.kconfig.get('s$_apiKey'), //标准API协议所用到的key,可根据情况从配置文件,数据库或其他位置获取,不填则为kconfig.get('s$_apiKey')
  // 'defaultSearch': 'name',//默认搜索字段, 不填则为"name"
  'fields': [ //必填
    //字段
    {
      'col': 'name', //数据表字段值
      'name': '产品名', //显示名
      'type': 'string', //类型: string,int,float,inc(自动增1),array,json,pwd,不填则默认为unknown; 这里影响服务端接收前端参数后的转换;
      'default': '', //默认值
      'validator': ['strLen', [2, 30]], //校验器,格式同iApi,在add和update中使用,不填则不校验
      'width': 180, //显示list时此字段的宽度
      'hide': null, //在哪些界面不显示: list,add,one,update,all,用|号分隔
      'info': null, //补充说明文字
      'input': null, //输入类型,为空则为input,这里会影响前端的展示,json类型,如{type,options...};
      'formatter': null, //返回到前端之前进行格式处理的方法, 注意这里主要是面向安全性的服务端的处理, 若只是调整格式请使用input从前端调整, 如:'formatter': (data) => { return ktool.sha1(data); }
      'search': 'string', //可作为查询条件,格式为string
    },
    { 'col': 'fee', 'name': '资费(元)', 'type': 'int', 'validator': 'strInt', 'input': { 'type': 'rmb' }, 'search': 'int' },
    {
      'col': 'feeType',
      'name': '计费类型',
      'type': 'string',
      'info': '(以元为单位)',
      'default': '包月',
      'input': { //input与前端配合可以约定不同的参数,将在list接口中作为titles参数传到前端
        'type': 'radio', //显示为radio, //可以是date(日期显示),time(时间显示),datetime(时间显示),int(整数显示,input只能填整数),rmb(人民币显示),float(浮点数),textarea,radio等等
        'pickNum': 1, //默认选中
        'options': [ //radio列表
          { 'key': '点播', 'val': '点播' },
          { 'key': '包月', 'val': '包月' },
          { 'key': '按天收取', 'val': '按天收取' },
        ]
      },
      'validator': ['strLen', [1, 30]],
      'search': 'string',
    },
    {
      'col': 'cpid',
      'name': '产品管理员',
      'type': 'array',
      'default': [],
      'input': {
        'type': 'select2',
        'url': '/s2api/cp?q=', //显示通过字母查找的选项
        'initUrl': '/s2api/cp/oldData/', //为显示原有数据填充选项
        'lessLetter': 2, //触发检索最少字母数
        'single': false, //是否单选
      },
      'hide': 'list',
    },
    {
      'col': 'cpid2', //演示多个select2并存时的情况
      'name': '二级管理员',
      'type': 'array',
      'default': [],
      'input': {
        'type': 'select2',
        'url': '/s2api/cp?q=',
        'initUrl': '/s2api/cp/oldData/',
        'lessLetter': 3,
        'single': false,
      },
      'hide': 'list',
    },
    { 'col': 'feeCut', 'name': '分成比例', 'type': 'int', 'info': '(>=0且<=100的整数,表示百分比)', 'default': 100, 'validator': 'strInt' },
    { 'col': 'creatorId', 'type': 'string', 'hide': 'all' }, //创建人id
    {
      'col': 'state',
      'name': '状态',
      'type': 'int',
      'hide': 'add|list',
      'validator': { 'optional': 'all', 'validator': 'strInt' },//validator用optional表示可选状态的校验(可配置为all或add,update始终为可选)
      'input': { 'type': 'int' }
    },
    { 'col': 'createTime', 'name': '创建时间', 'type': 'int', 'hide': 'add|update', 'input': { 'type': 'datetime' } },
    { 'col': 'py', 'type': 'string', 'hide': 'all' }, //拼音首字母,检索用,所有界面均不显示
  ],
  'listSort': {
    'createTime': -1,
  },

  'onAdd': function(req, reqData, callback) {
    const now = Date.now();
    const newObj = {
      'name': reqData.name.trim(),
      'feeType': reqData.feeType.trim(),
      'fee': cck.priceStrParse('' + reqData.fee),
      'feeCut': parseInt(reqData.feeCut.trim()),
      'state': 0,
      'createTime': now,
      'creatorId': req.userId,
    };
    if (kc.iCache.getSync('product:name:' + newObj.name)) {
      return callback('重复产品名称: ' + newObj.name);
    }
    newObj.py = Pinyin.getPY(newObj.name);
    callback(null, newObj);
  },
  'onUpdate': function(req, reqData, callback) {
    // const cacheOne = kc.iCache.getSync('product:name:' + reqData.name);
    // if (cacheOne && '' + cacheOne._id !== reqData.c_id) {
    //   return callback('已存在重复产品名称: ' + reqData.name, callback, 'alreadyExists');
    // }
    // reqData.fee = cck.priceStrParse('' + reqData.fee);
    delete reqData.createTime;
    callback(null, reqData);
  },
  // 'beforeList' : function(req, query, callback) { callback(null, query); }; //执行list的query之前
  // 'onList':function(req, listArr, callback) { callback(null, listArr); }, //执行list数据输出之前
  // 'onDel':function(req, id, callback) { callback(null, id); },
  // 'onOne':function(req, oneData, callback) { callback(null, oneData); },
  'creatorFilter': 'creatorId', //用于判断当前登录用户是否是自己,此值为当前表中包含的对应用户ID的字段,管理员不需要
  'authPath': 'product', //权限路径,若配置则需要登录且登录账号具备此路径权限才可返回数据
  // 'authName':'产品', //权限名,不配置则为tbName
  'curdLevel': [0, 0, 0, 0, 9], //level级别的权限, 默认均为0, 数组依次为:c,u,r,d,m(审批权限,暂无用)


  //以下参数用于mkCurdVue使用
  'listSlot': '',
  'oneSlot': '',
  'addSlot': '',
  'downCsv': true, //是否支持CSV导出
};



const ci = curd.instance(prop);


//如果引入全表缓存,则在数据变动时更新缓存数据
const refreshCache = function(pid, isDel) {
  if (!pid) {
    vlog.error('refreshCache no pid:%j', pid);
    return;
  }
  process.nextTick(function() {
    // vlog.log('refreshCache:%s',pid);
    if (isDel) {
      //清除对应缓存
      const cKey = prop.tb + ':_id:' + pid;
      const orgCache = kc.iCache.getSync(cKey);
      if (orgCache) {
        kc.iCache.set('mem', cKey, null);
        kc.iCache.set('mem', prop.tb + ':name:' + orgCache.name, null);
      }
      return;
    }

    kc.iCache.cacheTable('mem', 'mongo', prop.tb, '_id,name', {
      _id: db.idObj(pid)
    }, null, function(err) {
      if (err) {
        vlog.error(err.stack);
        return;
      }
    });
  });
};

//curd事件: addOK, updateOK, hardDelOK
ci.on('addOK', function(reqBody, uId, uLevel, dbObj) {
  refreshCache('' + dbObj._id);
});
ci.on('updateOK', function(reqBody, uId, uLevel) { // eslint-disable-line
  refreshCache(reqBody.req._id);
});
ci.on('hardDelOK', function(reqBody, uId, uLevel) { // eslint-disable-line
  refreshCache(reqBody.req._id, true);
});

exports.router = function() {
  return ci.router;
};

//服务启动时检查表索引
setTimeout(function() {
  //停1秒等待db初始化结束,若使用默认mongo则不需要后两个参数(false,dbConfName)
  db.checkIndex(prop.tb, {
    'createTime_-1': { 'createTime': -1 },
    'name_-1': { 'name': -1 },
    'state_-1': { 'state': -1 },
    'py_-1': { 'py': -1 },
  });
}, 1000);

// 以下注释打开执行,即可生成前端页面
// const mk = kc.mkCurdVue;
// mk.make(prop, __dirname);