
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
