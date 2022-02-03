# KC web系统快速构建工具
web项目骨架, 集成ktool,vlog工具库,集成express,集成dot模板引擎, 集成对redis、mongodb、mysql的直接使用

v3版本说明:
为更方便使用, 引入vue2(vue2.6,暂不使用v3版本)和element-ui组合形成基础的单页前端以实现一个基础的管理后台, 使之开箱可用.原dot模板生成页面的逻辑转为可选.
可能缺失了原来的灵活性(绑定了vue和element-ui), 但使用上更为便捷, 也可以在初始化时控制参数去掉引入前端组件(只使用核心lib部分).
vue的部分加入了自定义的插件, 以实现类jquery和ajax相关的功能, 非管理后台的web项目也可以使用.
受限于vue2.6和element-ui, npm安装时会产生一些vulnerabilities, 暂时只能忽略.

前端vue开发:
1. 进入vue目录, npm i 安装所需要的库, 在此目录下执行npm run serve进行调试(可先启动主进程至15001端口作为后端服务);
2. 使用npm run build编译到web/public中;
3. 默认会自动生成web/api/product.js(完整示例), cp, proj_p典型的curd表管理样例, 可根据情况修改或使用;

## UPDATE:
* v3.0.2 加入vue和element-ui结合的前端实现


## 特性:
* 与jenkins,pm2配合，集成开发，生产等各种环境的加密配置发布, 可集成自动化部署新版，快速回退到任何版本
* 快速json api生成(/web/api直接写api,注:_开头的文件会忽略)
* 快速jst模板页面生成(/web/tpls直接写jst,注:p_或pa_开头的文件自动生成页面,其中pa_为验证session页面)
* 集成各类数据库驱动(redis,mongodb,mysql,influx等)，超简易的使用(运用proxy封装)
* 自带登录与验证体系，并可定制，支持fail2ban配置
* 自带内存或redis缓存功能(iCache, showFilter)
* 自主实现的session,支持存放于redis,支持强安全配置
* 日志可自定义输出(基于vlog,如输出到redis等),便于es分析
* 自定义错误码,每个项目自动生成相关key等


## 关于数据库使用:
先在config中配置好连接参数.
### redis

```
const kc = require('kc');
const redis = kc.redis.init(); //自动处理配置载入,异步初始化转为同步
redis.set('key1','val1', (err) => console.log('done')); //支持redis驱动的所有方法
redis.get('key1', (err, val) => console.log('key1:', err, val));

//自定义的带超时的set方法
redis.setWithTime('bbbb', 'hhhhh', 20, (e, j) => console.log('setWithTime:', e, j));

//通过ktool.promi转为await使用
const val = await ktool.promi(kc.redis.get)('key1'); //要求最新版ktool

//多个redis连接同时使用见lib/redis.test.js
```

### mongodb

```
const kc = require('kc');
const mongo = kc.mongo.init(); //自动处理配置载入,异步初始化转为同步

//c后面跟collection名,再后面跟mongo原生驱动(非moogose)的方法,此方法是保证初始化完成的关键
mongo.c('user').insertOne({ 'phone': '12345678901' },  (e, re) => {console.log('re:%j', re.result); });

//pc后面跟collection名则返回promise,pQuery为自定义的query方法,直接使用find返回array(原生驱动返回cursor,需要再toArray,注意query默认只返回20条记录)
const reArr = await mongo.pc('user').pQuery({'phone':'12345678901'});

//自定义aggr方法,因为3.x版本的aggregate不再返回array，这里用自定义的aggr还原为返回array
const pipeline = [
  { '$match': { 'phone': '12345678901' } },
  { '$group': { '_id': '$phone', 'count': { '$sum': 1 } } }
];
const re = await mongo.pc('user').pAggr(pipeline);
console.log('pAggr', re);

//因为mongo驱动的方法均返回promise，也同时支持callback，所以mongo.pc('user').后可以跟所有的原生驱动方法

//自定方法包括query/aggr/logToDb,对应promise为pQuery/pAggr/pLogToDb

//多mongo连接同时支持见lib/mongo.test.js

```

### mysql

```
const kc = require('kc');
const mysql = kc.mysql.init(); //自动处理配置载入,异步初始化转为同步

//c()方法参数为c(clusterNode, clusterSelector, configName)，这也是保证初始化完成的关键，不可省略。
//conn.release();已经封装在内，无需再次调用
mysql.c().query('insert into tt1 set phone = "11111111111",name="aabb"');

mysql.c().query('select * from tt1 limit 3', (e, re) => {console.log('re:%j', re); });

//mysql.pc()方法支持await,暂未测试

```

## 使用方法
1. 安装nodejs;
2. 安装kc库;

  ```
  npm install kc -g
  ```

3. kc init指令:生成项目结构;

  ```
  kc init [projectName] [port]
  npm i
  ```

4. config/default.json修改本地配置(配置可参考config/test.json),正式参数可放入product.json(命名随意);
5. kc config指令:生成远端加密配置文件

  ```
  kc config product.json
  ```
  product.json放置在config目录下,为标准JSON格式,生成的配置文件密文为config/项目名.js,通过jenkins发布到指定服务端,git上不保存product.json等非default.json文件

6. 前端vue开发, 进入vue目录, npm i 安装所需要的库, 在此目录下执行npm run serve进行调试(可先启动主进程至15001端口,将作为后端服务), 使用npm run build编译到web/public中.
7. process.json配置进程

8. 启动项目,如使用deploy的方式启动,需要pm2新版本

  ```
  pm2 startOrRestart process.json
  ```

9. kc api指令:增加接口 && api目录说明

  ```
  kc api apiName
  ```

  可自动生成新api的框架代码在web/api/apiName.js中

10. 增加页面 && tpls目录(暂缺说明)

## api说明(见IAPI.md)

-----



