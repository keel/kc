# KC 标准API系统

## UPDATE:
* v2.0.8: 去除 iCache 和 showFilter对kc的引用
* v2.0.7: db类可同时加载多个配置,如mongo可使用两个配置在同一项目中连接两个库，使用时指定用哪个配置
* v2.0.6: ktool升级,db类可支持使用指定的配置,如mongo可使用另一配置在同一项目中连接两个库
* v2.0.6: 增加kc.iCache接口
* v2.0.5: 增加kc.showFilter接口
* v2.0.4: config指令增加结果说明
* v2.0.1:
  ES6:代码用ES6重构,mongo redis myql全面重写,初始化及使用方式重大改变;
  ktool: 升级到1.0.3;
  session: 增加mem和redis可选，支持set和get变量，安全性增强;
  配置升级:配置文件调整。去除初始化时传入的配置文件路径，安全性增强,增加config指令;
  增加iCache和showFilter;
  大量优化及模板修改;
  增加测试用例文件;

* v1.0.58: mongo redis myql的init修正,kc初始化dbsInitOK修正
* v1.0.57: mongo redis增加close,已经init后不再重复
* v1.0.54: fix dbsInitOK,注意与之前版本的mongoInitOK事件会有不兼容
* v1.0.53: mysql 增加query
* v1.0.52: iApi callback参数在err时可定义返回内容
* v1.0.50: fix iApi showLevel无效
* v1.0.49: fix redis.hmset
* v1.0.48: mongo连接增加重试次数为最大int值的参数
* v1.0.47: userLevel转为数字,readme改为模板
* v1.0.46: mongo增加logToDb
* v1.0.45: mysql的createProcApi增加beforeProc
* v1.0.44: redis增加密码验证
* v1.0.41: 升级cck,ktool库,kc api模板调整,.jsbeautifyrc模板调整
* v1.0.39: 修正createProcDo
* v1.0.38: 在mysql中增加createProcDo方法创建基于存储过程的标准API响应
* v1.0.37: 修正mongo.js中的checkColl
* v1.0.36: mkSign错误时会提示原文,parseApiReq会提示不同错误码,调整前端js代码
* v1.0.31: redis增加hmset和hgetall
* v1.0.30: 初始化时增加redisInitOK,mongoInitOK,mysqlInitOK三个事件
* v1.0.27-29: 修复小bug,mongo增加addMany方法
* v1.0.26: 增加mongo.del
* v1.0.25: 调整api模板及iApi小bug
* v1.0.24: sessionAuth的fail适配content-type全小写;
* v1.0.23: 增加testapi错误码说明,修正mysqlCluster启动错误,增加validatorFailStateCode配置
* v1.0.22: 完成mysql驱动,支持集群,调整了配置文件格式
* v1.0.18: 增加api指令

## TODO:
* 完善文档
* 增加后台模板
* 增加使用mysql的存储过程样例
* session的增强

## 使用方法
1. 安装nodejs6.4或以上版本
2. 安装kc库

  ```
  npm install kc -g
  ```

3. 生成项目结构

  ```
  kc init projectName port
  npm install
  git init
  git add .
  git add -f web/render/index.js
  git commit -m 'init'
  ```

4. config/default.json配置说明
4. package.json配置说明
4. process.json配置说明

4. 启动项目,如使用deploy的方式启动,需要pm2新版本

  ```
  pm2 startOrRestart process.json
  ```

5. 增加接口 && api目录说明

  ```
  kc api apiName
  ```

  可自动生成新api的框架代码在web/api/apiName.js中
6. 增加页面 && tpls目录说明

## API接口规范
* 协议:http post/get,一般情况下建议使用post,内部接口统一全部使用post
* 编码统一使用utf-8
* 默认Content-Type: application/json
* URL:接模块定义一级路径,按功能定义二级路径,GET方式的API使用url带参数
* POST使用body,在body中传json内容，注意json为严格模式，key必须加双引号
* 参数名:使用小写加_连接方式,如:find_user_list

## API接口定义
### 请求与响应格式
在请求和响应的json中，参数共分为系统参数和接口参数两个部分，系统参数在每个请求和响应中都存在，接口参数根据接口的不同而有所不同。系统参数使用单个字母方式体现，接口参数通常使用小写英文加下划线作为参数名。
一个典型的请求如下：

  ```javascript
  {
    "v":1,
    "m":"testMethod",
    "a":"b3c3856da",
    "c":"10010",
    "t":14323424423,
    "s":"",
    "req":{
      {"user_id":"abc123"}
    }
  }
  ```

其中参数意义如下：

字段  |名称  |类型  |必填  |说明
------|-----|------|------|--------
v     |API版本号         |int           |是 |接口版本号，无特殊说明填1
m     |Method，方法名     |string        |是 |由具体接口定义
a     |appCode，应用标识  |string        |是 |由平台提供,用于区分请求的不同应用
c     |channel,渠道id    |string        |是 |由平台提供
t     |timeStamp,时间戳  |int            |是 |取当前时间毫秒数(自 UTC 时间 1970-01-01 00:00:00 经过的毫秒数)
s     |Sign，签名        |string         |是 |签名，算法见后
req   |接口参数的key      |Object/array  |是 |由具体接口定义,这个参数的值可以是对象也可以是数组

一个典型的响应如下：

  ```javascript
  {
    "re":0,
    "t":14323424423,
    "data":{
      {"user_name":"hello"}
    }
  }
  ```

字段  |名称  |类型  |必填  |值
------|-----|------|------|--------
re  |错误码或状态  |int |是 |0为成功，其他为错误码
t |timeStamp,时间戳 |int |是 |取当前时间毫秒数(自 UTC 时间 1970-01-01 00:00:00 经过的毫秒数)
s |Sign,签名 |string  |是 |签名，算法见后
data  |响应的数据内容 |Object/Array  |是 |响应的具体数据内容，由接口约定

### 签名计算方法：
1. 对所有API请求参数（包括系统参数和接口参数），根据参数名称的ASCII码表的顺序排序。如：foo=1, bar=2, foo_bar=3, foobar=4排序后的顺序是bar=2, foo=1, foo_bar=3, foobar=4。 s参数（sign签名）不加入签名原文； req参数名不需要加入签名原文； Object和Array类型的字段不加入签名原文；
2. 将排序好的参数名和参数值拼装在一起，根据上面的示例得到的结果为：bar=2&foo=1&foo_bar=3&foobar=4。
3. 把上一步拼装的字符串后加上平台app对应的key得到签名的原文，对原文进行utf-8编码后的字节流使用MD5算法进行摘要，如：

  ```
  md5(bar=2&foo=1&foo_bar=3&foobar=4&key=hello)；
  ```

4. 将摘要得到的字节流结果使用十六进制(hex)表示，并保持大写，如：hex(“helloworld”.getBytes(“utf-8”)) = “68656C6C6F776F726C64”

签名样例:
------
1. 系统参数：

  ```
  v=1
  m=testMethod
  a=b3c3856da
  c=10010
  t=14323424423
  ```

2. 接口参数：

  ```
  user_id=abc123
  user_age=30
  app_level=2
  ```

3. 按ascii排序：

  ```
  a=b3c3856da
  app_level=2
  c=10010
  m=testMethod
  t= 1463103383681
  user_age=30
  user_id=abc123
  v=1
  ```

4. 拼接参数名与参数值 

  ```
  a=b3c3856da&app_level=2&c=10010&m=testMethod&t=1463103383681&user_age=30&user_id=abc123&v=1
  ```

5. 添加key并通过md5生成签名，设key为hello： 

  ```
  hex(md5("a=b3c3856da&app_level=2&c=10010&m=testMethod&t=1463103383681&user_age=30&user_id=abc123&v=1&key=hello"))
  ```

6. 签名结果(需要转成大写)：
  **A03C6E80E909950CAF7FAF88EBD8A322**


-----



