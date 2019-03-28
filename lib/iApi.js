/*
API核心实现.生成json请求的router,只包含post请求处理,使用此router可用get制作界面
// config样例
const iiConfig = {
  'auth':false, //可选
  'validatorFailStateCode':403, //可选
  'testAct': {
    'bodyParserType':'json',//可选
    'showLevel': 0,//可选
    'validator': { //可选
      'phone': 'mobileCN',
      'age': ['intRang', [10, 100]],
      '@state': ['intRang', [0, 99]],  //可选验证
      'txt': function(inputVal) {
        if (inputVal === 'hello') {
          return true;
        } else {
          return false;
        }
      }
    },
    'resp': function(req, resp, callback) { //必选
      return { 're': 'ok,' + req.body };
    }
  }
};
 */
'use strict';
const express = require('express');

const sessionAuth = require('./sessionAuth');
const error = require('./error');
const cck = require('cck');
const ktool = require('ktool');
const bodyParser = require('body-parser');
const vlog = require('vlog').instance(__filename);

//validator验证失败时默认http状态码,这里设为200,以前按rest风格为403,非验证的错误可由Actor在返回错误时,在后面参数中跟上状态码
let validatorFailStateCode = 200;

const init = function() {
  sessionAuth.init();
};
/*
{
//系统级参数,参数名使用字母简写
  "v":1, //version,API版本号
  "m":"action_name",  //method,动作名称,开发阶段直接使用有意义的名称,如"login","findUserList"等,生产环境使用ID方式
  "k":"test", //key,用于后期鉴权,默认情况使用"test"填充,也可移入header
  "a":"adsfsadfas", //appCode,用于区分请求的不同应用,
  "c":"10010",  //channel,渠道id,默认使用10010
  "t":14323424423, //timeStamp,时间戳,取当前时间毫秒数,即:ktool.timeStamp()
  "s":"md5...", //sign,通常使用系统
//应用级参数,参数名使用英文加_连接
  "req":[
    {"user_name":"hello"},
    {"user_age":23}
  ]
}
 */


const mkSign = function(data, key) {
  let pArr = [];

  const pushToArr = function(data) {
    for (const i in data) {
      if (i === 'req') {
        pushToArr(data['req']);
      }
      const d = data[i];
      if (cck.check(d, 'string') || cck.check(d, 'number')) {
        pArr.push(i + '=' + d);
      }
    }
  };
  pushToArr(data);
  // vlog.log('pArr:%j',pArr);
  pArr = pArr.sort();
  // vlog.log('pArr sorted:%j',pArr);
  let str = '';
  for (let i = 0; i < pArr.length; i++) {
    str += '&' + pArr[i];
  }
  str = str.substring(1) + '&key=' + key;
  // vlog.log('str:%s',str);
  return [str, ktool.md5(str)];
};

const makeApiReq = function(method, data, key, appCode, channel, ver) {
  const timeStamp = ktool.timeStamp();
  const v = (ver || '0');
  const a = (appCode || 'dev');
  const c = (channel || '10010');
  const reqData = {
    'v': v,
    'm': method,
    'a': a,
    'c': c,
    't': timeStamp,
    'req': data
  };
  const signArr = mkSign(reqData, key);
  reqData.s = signArr[1];
  return reqData;
};


// const key = 'xlzz5ApjPxjr';
// const data = makeApiReq('wxLogin',{'phone':'15301588025','wx_id':'234qfasfda'},key,'57a3fc7c8c76b6bf6ae7bb79','100024',1);
// vlog.log('req data:%j',data);
// const key = 'testkey';
// const data = makeApiReq('increase',{'userName':'aa'},key,'jquer','12001',1);
// vlog.log('req data:%j',data);
// delete data.s;
// const sign = mkSign(data,key);
// console.log(sign);
// {"a":"jquer","c":"12001","s":"f91718736db3216a485125006ce91d7e","t":1473751722907,"v":1,"m":"increase","req":{"userName":"aa"}}
// {"v":1,"m":"increase","a":"jquer","c":"12001","t":1473751722907,"req":{"userName":"aa"},"s":"90ea6caa5f477d024982467db1566c6e"}


/**
 * 解析标准API请求并校验签名
 * @param  {json} data 请求的json数据
 * @param  {string} key  签名校验的key
 * @return {json}      返回请求中的req部分
 */
const parseApiReq = function(data, key) {
  if (!data) {
    return [error.err['iiReqEmpty']];
  }
  if (!key) {
    return [error.err['iiReqKey']];
  }
  if (data.v && data.m && data.a && data.c && data.t && data.s) {
    const reqSign = data.s;
    delete data.s;
    const signArr = mkSign(data, key);
    if (signArr[1] !== reqSign) {
      vlog.error('parseApiReq sign error.sign:%j, reqSign:%j,data:%j', signArr, reqSign, data);
      return [error.err['iiReqSign'], signArr];
    }
    return [0, data.req];
  }
  vlog.error('parseApiReq req error.data:%j', data);
  return [error.err['iiReq']];
};


const makeApiResp = function(state, data, key) {
  const timeStamp = ktool.timeStamp();
  const k = key || 'test';
  const respData = {
    're': state,
    't': timeStamp,
    'data': data
  };
  const signArr = mkSign(respData, k);
  respData.s = signArr[1];
  return respData;
};


const initAct = function(actName, showLevel, reqCheckerMap, respMaker, router, isXssFilter) {
  if (!respMaker) {
    vlog.eo(null, 'iApi:no respMaker', actName);
    return;
  }
  if (!reqCheckerMap) {
    vlog.eo(null, 'iApi:no reqCheckerMap', actName);
    return;
  }
  if (actName === null || actName === undefined) {
    vlog.eo(null, 'iApi:no actName', actName);
    return;
  }
  router.post('/' + actName, function(req, resp, next) {
    if (parseInt(req.userLevel) < showLevel) {
      resp.status(validatorFailStateCode).send(error.json('level'));
      return;
    }
    // req._reqStart = new Date().getTime();
    // vlog.log('actName:%s,body:%j,params:%j',actName,req.body,req.params);

    //过滤请求
    const checkRe = reqCheck(req, reqCheckerMap);
    if (checkRe !== 'ok') {
      vlog.error('iApi:req error act:%s ,body:%j, re:%j', actName, req.body, checkRe);
      if (reqCheckerMap.respFn) {
        reqCheckerMap.respFn.func(resp, checkRe);
        return;
      }
      resp.status(validatorFailStateCode).send(error.json('iiReq', checkRe));
      return;
    }

    respMaker(req, resp, function(err, re, status, errTag) {
      const errJsonTag = errTag || 'iiResp';
      let respCode = status || 200;
      if (err) {
        vlog.eo(err, 'iApi:respMaker', req.body);
        respCode = status || 500;
        resp.status(respCode).send(error.json(errJsonTag, re));
        return;
      }
      if (isXssFilter) {
        re = ktool.xssFilter(re);
      }
      // const costTime = (new Date().getTime()) - req._reqStart;
      // re.costTime = costTime;
      resp.status(respCode).send(re);
    });

  });
};


const createCheckObj = function(ckName, canIgnore, checkrDefine) {
  const checkObj = { 'ckName': ckName };
  if (cck.check(checkrDefine, 'string')) {
    checkObj['define'] = checkrDefine;
    if (canIgnore) {
      checkObj['doCheck'] = function(inputValue) {
        if (!cck.isNotNull(inputValue)) {
          return true;
        }
        return cck.check(inputValue, this.define);
      };
    } else {
      checkObj['doCheck'] = function(inputValue) {
        return cck.check(inputValue, this.define);
      };
    }
    return checkObj;
  } else if (cck.check(checkrDefine, 'array')) {
    if (checkrDefine.length !== 2 || !cck.check(checkrDefine[0], 'string') || !cck.check(checkrDefine[1], 'array')) {
      vlog.error('iiConfig:checker error:%j', checkrDefine);
      return null;
    }
    checkObj['define'] = checkrDefine;
    if (canIgnore) {
      checkObj['doCheck'] = function(inputValue) {
        if (!cck.isNotNull(inputValue)) {
          return true;
        }
        return cck.check(inputValue, this.define[0], this.define[1]);
      };
    } else {
      checkObj['doCheck'] = function(inputValue) {
        return cck.check(inputValue, this.define[0], this.define[1]);
      };
    }
    return checkObj;
  } else if (cck.check(checkrDefine, 'function')) {
    checkObj['define'] = 'function';
    checkObj['func'] = checkrDefine;
    if (canIgnore) {
      checkObj['doCheck'] = function(inputValue) {
        if (!cck.isNotNull(inputValue)) {
          return true;
        }
        return checkrDefine(inputValue);
      };
    } else {
      checkObj['doCheck'] = checkrDefine;
    }
    return checkObj;
  } else {
    vlog.error('iiConfig:unknown checkrDefine:%j, ck:%j', checkrDefine, ckName);
    return null;
  }
};

const initChecker = function(validatorObj) {
  const checkMap = {};

  // const ccc = '';
  for (let ck in validatorObj) {
    // ccc = ck;
    let canIgnore = false;
    const checkr = validatorObj[ck];
    // vlog.log('ck:%j,checkr:%s',ck,checkr);
    if (ck[0] === '@') {
      ck = ck.substring(1);
      canIgnore = true;
    }
    const oneCheckObj = createCheckObj(ck, canIgnore, checkr);
    if (oneCheckObj) {
      checkMap[ck] = oneCheckObj;
    }
  }
  // vlog.log('checkMap:%s fn:%s',ccc,checkMap[ccc]);
  return checkMap;
};



const reqCheck = function(req, rFilter) {
  //TODO 解析header的key
  try {

    //获取body
    let rBody = req.body;
    if (rBody['req']) {
      rBody = rBody.req;
    }
    // vlog.log('rBody:%j', rBody);
    const checkFailArr = [];
    for (const ck in rFilter) {
      if (ck === 'respFn') {
        continue;
      }
      const ckCheckr = rFilter[ck];
      if (!ckCheckr.doCheck(rBody[ck])) {
        // vlog.log('reqCheck fail, para:%j, val:%j', ck, rBody[ck]);
        checkFailArr.push(ck);
      }
    }

    if (checkFailArr.length > 0) {
      return checkFailArr;
    }

    return 'ok';
  } catch (e) {
    vlog.eo(e, 'reqCheck', req.body);
    return ['httpbody'];
  }

};



const getRouter = function(iiConfig) {
  const router = express.Router();
  //默认需要auth,除非配置强制设置为false
  if (iiConfig.auth !== false) {
    router.use(sessionAuth.cookieCheck);
  }
  //validator验证失败时返回的错误码可由iiconfig配置
  if (iiConfig.validatorFailStateCode) {
    validatorFailStateCode = iiConfig.validatorFailStateCode;
  }
  //根据配置设定是否指定type
  if (!iiConfig.bodyParserType) {
    router.use(bodyParser.json({
      type: 'application/json'
    }));
  } else {
    if (!iiConfig.bodyParserTypeOption) {
      router.use(bodyParser[iiConfig.bodyParserType]());
    } else {
      router.use(bodyParser[iiConfig.bodyParserType](iiConfig.bodyParserTypeOption));
    }
  }
  const actions = iiConfig['act'];
  if (!actions) {
    vlog.error('iiConfig have no act', iiConfig);
    return null;
  }
  // vlog.log('actions:%j',actions);
  for (const act in actions) {
    const iiObj = actions[act];
    if (!iiObj['resp']) {
      vlog.error('iiConfig para err:%j', act);
      continue;
    }
    // vlog.log('iiConfig:%j',iiConfig);
    const validators = initChecker(iiObj['validator']);
    if (!validators) {
      vlog.warn('iiConfig have no validator:%j', act);
      continue;
    }
    const resper = iiObj['resp'];
    if (!cck.check(resper, 'function')) {
      vlog.error('iiConfig resp err:%j', act);
      continue;
    }
    const showLevel = iiObj.showLevel || 0;

    initAct(act, showLevel, validators, resper, router, iiObj.isXssFilter);
  }
  return router;
};

exports.init = init;
exports.getRouter = getRouter;
exports.makeApiReq = makeApiReq;
exports.makeApiResp = makeApiResp;
exports.parseApiReq = parseApiReq;