# APIS

## API接口规范
* 协议:http post/get,一般情况下建议使用post,内部接口统一全部使用post
* 编码统一使用utf-8
* 默认Content-Type: application/json
* URL:接模块定义一级路径,按功能定义二级路径,GET方式的API使用url带参数,POST使用body
* 参数名:使用小写加_连接方式,如:find_user_list
* 请求:

```
{
//系统级参数,参数名使用字母简写
  "v":1, //version,API版本号
  "m":"action_name",  //method,动作名称,开发阶段直接使用有意义的名称,如"login","find_user_list"等,生产环境使用ID方式
  "k":"test", //key,用于后期鉴权,默认情况使用"test"填充,也可移入header
  "a":"adsfsadfas", //appCode,用于区分请求的不同应用,默认为dev
  "c":"10010",  //channel,渠道id,默认使用10010
  "t":14323424423, //timeStamp,时间戳,取当前时间毫秒数,即:ktool.timeStamp()
  "s":"sha1...", //sign,签名,使用sha1
//应用级参数,参数名使用英文加_连接
  "req_data_array":[
    {"user_name":"hello"},
    {"user_age":23}
  ]
}
```

* 响应,状态码: 200:正常, 403:无权限, 500:处理错误, 404:无资源

```
{
  "re":0 //0为正确,其他为错误码,
  "sign":"md5asdfsa",
  "data":""
}
```


## 项目开发流程
1. 功能需求与原型设计
2. API设计与UI设计, 建立项目专属的fake.js
3. 前后端分工与开发
4. 代码抓取,开发,合并,提交,测试
5. 部署与上线


## 后端开发流程
1. 创建功能模块的js文件,require相关库
2. 创建iiConfig配置及相关实现,文档见lib/iApi.js
3. 使用iApi和上面的iiConfig创建router并导出
4. 添加到app.js


## 前端开发流程
1. 纯前端文件在web/public中,可在此创建html,css,js,image文件等
2. 模板方式:在tpls中创建相关的模板库
3. 注意引入web/public/js/lyapp.src.js,使用其中的jsonReq方法发起api请求
4. 可根据API接口文档制作假的服务端接口用于本地测试


## APIS安装与使用
1. git clone http://git.oschina.net/loyoo/apis/tree/master
2. 安装最新版nodejs
3. 在apis目录下执行npm install(必须操作,否则无法运行)
4. 执行node api-web.js启动

## 主体目录与文件说明
* README.md: 说明文档
* .eslintrc, .jsbeautifyrc: 用于sublime3的代码着色与格式化
* .gitignore: git忽略配置
* config.json: 配置文件,可配置redis与mongodb的参数,根据实际情况添加其他参数
* package.json: 项目包管理(npm)的配置文件
* lib: 可跨项目使用的库
* node_modules: 由npm install生成的第三方库,无需关注
* test: 测试用例
* web: 本项目主体业务逻辑,大的项目可在此目录下按功能块分子目录
* web/pulbic: 静态请求目录
* web/render: 模板编译目录,请勿直接修改其中任何文件
* web/tpls: 模板目录,其中.def为代码片段,可多层嵌套
* web/app.js: 进程实际入口,router配置入口
* api-web.js: 启动入口,可根据需要创建更多的启动入口,便于pm2启动使用
* web/error.js: 错误码,可不断增加
* web/main.js: 登录后的页面逻辑,可修改
* web/testapi.js: 最简api样例
* web/fake.js: 用于制作模拟接口
* web/login.js: 登录AIP样例
* web/user.js: 增删改查样例

## 可控第三方库,可以在node_modules中对应库目录的lib下查看相关文件代码说明
* cck 用于校验
* vlog 用于日志
* ktool 用于常见功能
* aes-cross AES加解密


## 更新说明
* 2016.4.8 增加api规范,修改客服端js和服务端返回的ok为0
* 2016.4.8 app.js中增加端口控制
* 2016.4.11 增加api规范的辅助实现

##TODO
* 配置抽出,支持多配置文件,支持环境变量
* 创建API规范的helper
* 完善fake
