/*
[#apiName]的api
 */
'use strict';
const kc = require('kc');
const ktool = require('ktool');
const iApi = kc.iApi;
const error = require('../../lib/error');
const vlog = require('vlog').instance(__filename);

//标准API协议所用到的key,可根据情况从配置文件,数据库或其他位置获取,这里仅作为示例
const apiKey = ktool.kconfig.get('s$_apiKey');

/**
 * 子接口方法,callback第二个参数即为resp返回的body
 * @param  {http.req}   req
 * @param  {http.resp}   resp
 * @param  {Function} callback 接口响应回调
 * @return {void}
 */
const test = function(req, resp, callback) {
  const re = { 'hello': '你好' };
  callback(null, { 're': 0, 'data': re });
};

/**
 * 标准api协议接口方法,详情见README
 * @param  {http.req}   req
 * @param  {http.resp}   resp
 * @param  {Function} callback
 * @return {}
 */
const testApi = function(req, resp, callback) {
  /*
   * 解析标准API请求并校验签名
   * @param  {json} data 请求的json数据
   * @param  {string} key  签名校验的key
   * @return {json}      返回请求中的req部分,失败则返回null
   */
  const reqDataArr = iApi.parseApiReq(req.body, apiKey);
  if (reqDataArr[0] !== 0) {
    //如果报错时,可定义状态码和返回错误码,如下403表示http返回403状态码,iiReq会返回错误error.json['iiReq']的内容
    return callback(vlog.ee(new Error('iApi req'), 'kc iApi req error', reqDataArr), null, 403, reqDataArr[0]);
  }
  const reqData = reqDataArr[1];
  /*
   * iApi.makeApiResp:创建resp的内容
   * @param  {int} errorCode      0为成功,其他为错误码
   * @param  {object} data   返回的数据,格式不限
   * @param  {string} apiKey 用于校验请求合法性的key
   * @return {json} 需要返回的json
   */
  const respObj = iApi.makeApiResp(0, 'ok', apiKey);
  //返回
  callback(null, respObj);
};



const iiConfig = {
  'auth': false, //[auth]:是否需要登录验证,默认需要auth,除非配置强制设置为false
  // 'validatorFailStateCode':403, //[validatorFailStateCode]:当validator验证失败时返回的http状态码,默认为200,此处可以进行全局修改
  // 'type': 'application/json', //[type]:http请求头的type,可选,默认'application/json'
  'act': {
    //接口1,地址如:http://localhost:16000/[#apiName]/testAct
    'test': {
      /*
      'crossDomain':true, //本接口可跨域,也可为function形式限制过滤条件(参考iApi的defaultCrossDomain)
      'showLevel': 0, //[showLevel]:如果需要验证,此处为用户最可访问的最低level,可选,默认0
      'validator': { //[validator]:参数校验器,可选
        'phone': 'mobileCN', //手机号参数验证示例,详细校验参数可参见cck项目
        'age': ['intRang', [10, 100]], //数字范围验证示例
        '@state': ['intRang', [0, 99]], //带@符号开头的参数表示此字段可以不存在,如存在则按此条件校验
        'txt': function(inputVal) { //自定义校验方法,return true为通过
          if (inputVal === 'hello') {
            return true;
          } else {
            return false;
          }
        }
      },
      'bodyParserType':'urlencoded' //application/x-www-form-urlencoded
      'bodyParserTypeOption':{extended:false}
      */
      'resp': test //接口实现方法,必须有
    },
    //另一个接口,地址如:http://localhost:16000/[#apiName]/testApi
    'testApi': {
      'validator':{
        phone:'mobileCN'
      },
      'crossDomain':true, //可支持跨域
      'resp': testApi
    }
  }
};



exports.router = function() {

  //由以上配置生成router
  const router = iApi.getRouter(iiConfig);

  //声明get方式的响应,可以在此使用tpls中的模板
  /*
  router.get('/get1', function(req, resp, next) {
    resp.send(render.login({title:'登录'}));
  });
  */
  router.get('*', function(req, resp, next) {
    resp.status(404).send(error.json('404', '[#apiName]'));
  });
  return router;
};

