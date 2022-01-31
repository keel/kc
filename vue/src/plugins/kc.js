/* eslint-disable object-shorthand,prefer-const,no-var */
import Vue from 'vue';
var $ = function(domId) {
  return document.getElementById(domId);
};
var llog = function() {
  var args = ['====>'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.log.apply(window, args);
};

var lerr = function() {
  var args = ['====>'];
  for (var i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  console.error.apply(window, args);
};

const clone = function(json) {
  if (Array.isArray(json)) {
    const target = [];
    for (let i = 0, len = json.length; i < len; i++) {
      target.push(clone(json[i]));
    }
    return target;
  }
  if (Object.prototype.toString.call(json) === '[object Object]') {
    const target = {};
    for (const i in json) {
      target[i] = clone(json[i]);
    }
    return target;
  }
  return json;
};


const twoInt = function(int) {
  return (int < 10) ? '0' + int : int;
};

const threeInt = function(int) {
  if (int < 10) {
    return '00' + int;
  } else if (int < 100) {
    return '0' + int;
  } else {
    return '' + int;
  }
};

/**
 * 格式化时间,为避免错误，不支持12小时制
 * @param  {int} millSec   millSeccond
 * @param  {string} formatStr 默认为 'yyyy-MM-dd HH:mm:ss'
 * @return {string}
 */
const timeFormat = function(millSec, formatStr) {
  const d = millSec ? new Date(millSec) : new Date();
  const df = {
    'YYYY': d.getFullYear(),
    'yyyy': d.getFullYear(),
    'MM': twoInt(d.getMonth() + 1),
    // 'DD': twoInt(d.getDate()),//年中的天数
    'dd': twoInt(d.getDate()),
    'HH': twoInt(d.getHours()),
    // 'hh': (d.getHours() < 12) ? twoInt(d.getHours()) : twoInt(d.getHours() - 12),//12小时制
    'mm': twoInt(d.getMinutes()),
    'ss': twoInt(d.getSeconds()),
    'SSS': threeInt(d.getMilliseconds()),
  };
  if (!formatStr) {
    formatStr = 'yyyy-MM-dd HH:mm:ss'; //默认格式
  }
  for (const i in df) {
    formatStr = formatStr.replace(new RegExp(i, 'g'), df[i]);
  }
  return formatStr;
};

const priceIntShow = function(priceInt, isDeciForce) {
  let negativeTag = '';
  if (priceInt < 0) {
    negativeTag = '-';
    priceInt = Math.abs(priceInt);
  }
  if (priceInt !== parseInt(priceInt)) {
    priceInt = Math.round(priceInt); //当priceInt非整数时，确保其为整数
  }
  if (priceInt === 0) {
    return (isDeciForce) ? '0.00' : '0';
  } else if (priceInt < 10) {
    return negativeTag + '0.0' + priceInt;
  } else if (priceInt < 100) {
    return negativeTag + '0.' + priceInt;
  }
  let out = negativeTag;
  if (priceInt % 100 === 0) {
    out += parseInt(priceInt / 100);
    return (isDeciForce) ? out + '.00' : out;
  }
  const f = priceInt / 100;
  out += f;
  const pointPo = out.indexOf('.');
  out = out.substring(0, pointPo + 3);
  return out;
};

//返回以分为单位的整数，小数只支持两位，两位以上直接截断忽略
const priceStrParse = function(priceStr) {
  priceStr = priceStr.replace(/,/g, '');
  let isNegative = false;
  if (priceStr.startsWith('-')) {
    isNegative = true;
    priceStr = priceStr.substring(1);
  }
  if (!priceStr.match(/^[\d]+[\\.]?[\d]*$/g)) {
    throw new Error('no priceStr');
  }
  const pointPo = priceStr.indexOf('.');
  const pLen = priceStr.length;
  let out = 0;
  if (pointPo < 0) {
    out = parseInt(priceStr + '00');
  } else if (pointPo === pLen - 1) {
    out = parseInt(priceStr.substring(0, pLen - 1) + '00');
  } else {
    const intNum = priceStr.substring(0, pointPo);
    let deciNumEnd = pointPo + 3;
    let deciAdd = '';
    if (pLen - pointPo === 2) {
      //1位小数特别处理
      deciNumEnd = pointPo + 2;
      deciAdd = '0';
    }
    // console.log('deciNumEnd', deciNumEnd, 'pLen', pLen, 'pointPo', pointPo);
    const deciNum = priceStr.substring(pointPo + 1, deciNumEnd);
    // console.log('intNum:', intNum, 'deciNum', deciNum);
    out = parseInt('' + intNum + deciNum + deciAdd);
  }
  if (isNegative) {
    return 0 - out;
  }
  return out;
};

const showValMap = {
  'pwd': () => { return '******'; },
  'rmb': (val) => { return priceIntShow(val); },
  'datetime': (val) => { return timeFormat(val); },
  'array':(val)=>{return JSON.stringify(val);},
  'json':(val)=>{return JSON.stringify(val);},
};

const showValue = function(val, inputObj) {
  if (!inputObj) {
    return val;
  }
  const fn = showValMap[inputObj.type];
  if (!fn) {
    return val;
  }
  return fn(val, inputObj);
};

const inputFormatMap = {
  'rmb': (val) => {
    return priceIntShow(val);
  },
};
const inputFormatBackMap = {
  'rmb': (val) => {
    return priceStrParse(val);
  },
  'pwd': (val) => {
    if (!val || (!val.trim())) {
      return null;
    }
    return val;
  },
};

const inputFormat = function(val, type) {
  if (!type) {
    return val;
  }
  const inputFormater = inputFormatMap[type];
  if (inputFormater) {
    return inputFormater(val);
  }
  return val;
};

const inputFormatBack = function(val, type) {
  if (!type) {
    return val;
  }
  const inputFormater = inputFormatBackMap[type];
  if (inputFormater) {
    return inputFormater(val);
  }
  return val;
};

const mkUpdateObj = function(newOne, inputMap) {
  const out = {};
  for (const i in newOne) {
    const thisOne = newOne[i];
    out[i] = inputFormat(thisOne, (inputMap[i] ? inputMap[i].type : null));
  }
  return out;
};
const backUpdateObj = function(updateObj, inputMap) {
  const out = {};
  for (const i in updateObj) {
    const thisOne = updateObj[i];
    out[i] = inputFormatBack(thisOne, (inputMap[i] ? inputMap[i].type : null));
  }
  return out;
};

var codeTool = function(hexcaseIn, b64padIn, chrszIn) {
  var me = {};

  var hexcase = hexcaseIn || 0; /* hex output format. 0 - lowercase; 1 - uppercase        */
  var b64pad = b64padIn || ''; /* base-64 pad character. '=' for strict RFC compliance   */
  var chrsz = chrszIn || 8; /* bits per input character. 8 - ASCII; 16 - Unicode      */
  var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  /*
   * These are the functions you'll usually want to call
   * They take string arguments and return either hex or base-64 encoded strings
   */
  me.hex_sha1 = function(s) {
    s = utf16to8(s);
    return binb2hex(core_sha1(str2binb(s), s.length * chrsz));
  };
  me.b64_sha1 = function(s) {
    return binb2b64(core_sha1(str2binb(s), s.length * chrsz));
  };
  me.str_sha1 = function(s) {
    return binb2str(core_sha1(str2binb(s), s.length * chrsz));
  };
  me.hex_hmac_sha1 = function(key, data) {
    return binb2hex(core_hmac_sha1(key, data));
  };
  me.b64_hmac_sha1 = function(key, data) {
    return binb2b64(core_hmac_sha1(key, data));
  };
  me.str_hmac_sha1 = function(key, data) {
    return binb2str(core_hmac_sha1(key, data));
  };
  me.b64 = function(strIn) {
    return binb2b64(str2binb(strIn));
  };
  me.b64_decode = function(strIn) {
    return deb64bin(b64b2bin(strIn));
  };
  me.utf16to8 = utf16to8;
  /*
   * Calculate the SHA-1 of an array of big-endian words, and a bit length
   */
  function core_sha1(x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << (24 - len % 32);
    x[((len + 64 >> 9) << 4) + 15] = len;

    var w = new Array(80);
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;
    var e = -1009589776;

    for (var i = 0; i < x.length; i += 16) {
      var olda = a;
      var oldb = b;
      var oldc = c;
      var oldd = d;
      var olde = e;

      for (var j = 0; j < 80; j++) {
        if (j < 16) w[j] = x[i + j];
        else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
        var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
          safe_add(safe_add(e, w[j]), sha1_kt(j)));
        e = d;
        d = c;
        c = rol(b, 30);
        b = a;
        a = t;
      }

      a = safe_add(a, olda);
      b = safe_add(b, oldb);
      c = safe_add(c, oldc);
      d = safe_add(d, oldd);
      e = safe_add(e, olde);
    }
    return new Array(a, b, c, d, e);

  }

  /*
   * Perform the appropriate triplet combination function for the current
   * iteration
   */
  function sha1_ft(t, b, c, d) {
    if (t < 20) return (b & c) | ((~b) & d);
    if (t < 40) return b ^ c ^ d;
    if (t < 60) return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
  }

  /*
   * Determine the appropriate additive constant for the current iteration
   */
  function sha1_kt(t) {
    return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 :
      (t < 60) ? -1894007588 : -899497514;
  }

  /*
   * Calculate the HMAC-SHA1 of a key and some data
   */
  function core_hmac_sha1(key, data) {
    var bkey = str2binb(key);
    if (bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

    var ipad = new Array(16),
      opad = new Array(16);
    for (var i = 0; i < 16; i++) {
      ipad[i] = bkey[i] ^ 0x36363636;
      opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }

    var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
    return core_sha1(opad.concat(hash), 512 + 160);
  }

  /*
   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
   * to work around bugs in some JS interpreters.
   */
  function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  /*
   * Bitwise rotate a 32-bit number to the left.
   */
  function rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  /*
   * Convert an 8-bit or 16-bit string to an array of big-endian words
   * In 8-bit function, characters >255 have their hi-byte silently ignored.
   */
  function str2binb(str) {
    var bin = new Array();
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz) {
      bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i % 32);
    }
    return bin;
  }

  /*
   * Convert an array of big-endian words to a string
   */
  function binb2str(bin) {
    var str = '';
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < bin.length * 32; i += chrsz) {
      str += String.fromCharCode((bin[i >> 5] >>> (32 - chrsz - i % 32)) & mask);
    }
    return str;
  }

  /*
   * Convert an array of big-endian words to a hex string.
   */
  function binb2hex(binarray) {
    var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
    var str = '';
    for (var i = 0; i < binarray.length * 4; i++) {
      str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
        hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
    }
    return str;
  }

  /*
   * Convert an array of big-endian words to a base-64 string
   */
  function binb2b64(binarray) {
    var str = '';
    for (var i = 0; i < binarray.length * 4; i += 3) {
      var triplet = (((binarray[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16) | (((binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4)) & 0xFF) << 8) | ((binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4)) & 0xFF);
      for (var j = 0; j < 4; j++) {
        if (i * 8 + j * 6 > binarray.length * 32) { str += b64pad; } else { str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F); }
      }
    }
    return str;
  }

  //转utf8,在包含中文的情况下与服务端保持一致
  function utf16to8(str) {
    var out, i, len, c;
    out = '';
    len = str.length;
    for (i = 0; i < len; i++) {
      c = str.charCodeAt(i);
      if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i);
      } else if (c > 0x07FF) {
        out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
        out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      } else {
        out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
        out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
      }
    }
    return out;
  }

  function deb64bin(e) {
    var t = '';
    var n = 0,
      r = 0,
      c2 = 0,
      c3 = 0;
    while (n < e.length) {
      r = e.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
        n++;
      } else if (r > 191 && r < 224) {
        c2 = e.charCodeAt(n + 1);
        t += String.fromCharCode((r & 31) << 6 | c2 & 63);
        n += 2;
      } else {
        c2 = e.charCodeAt(n + 1);
        c3 = e.charCodeAt(n + 2);
        t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
        n += 3;
      }
    }
    return t;
  }

  function b64b2bin(b64str) {
    var t = '';
    var n, r, i;
    var s, o, u, a;
    var f = 0;
    b64str = b64str.replace(/[^A-Za-z0-9+/=]/g, '');
    while (f < b64str.length) {
      s = tab.indexOf(b64str.charAt(f++));
      o = tab.indexOf(b64str.charAt(f++));
      u = tab.indexOf(b64str.charAt(f++));
      a = tab.indexOf(b64str.charAt(f++));
      n = s << 2 | o >> 4;
      r = (o & 15) << 4 | u >> 2;
      i = (u & 3) << 6 | a;
      t = t + String.fromCharCode(n);
      if (u != 64) {
        t = t + String.fromCharCode(r);
      }
      if (a != 64) {
        t = t + String.fromCharCode(i);
      }
    }
    return t;
  }

  return me;
};

function mkStyle(styleObj) {
  var styleStr = '';
  for (var k in styleObj) {
    styleStr += k + ':' + styleObj[k] + ';';
  }
  return styleStr;
}

function setStyle(el, newStyle, isReplace) {
  if (isReplace) {
    el.setAttribute('style', mkStyle(newStyle));
    return;
  }
  var styleStr = el.getAttribute('style') || '';
  var styleArr = styleStr.split(';');
  var styleObj = {};
  if (styleStr) {
    for (var i = 0; i < styleArr.length; i++) {
      var sArr = styleArr[i].split(':');
      if (sArr.length !== 2) {
        continue;
      }
      styleObj[sArr[0].trim()] = sArr[1].trim();
    }
  }
  for (var j in newStyle) {
    styleObj[j] = newStyle[j];
  }
  el.setAttribute('style', mkStyle(styleObj));
}

var kHttp = function(that, url, httpType, data, headers, callback) {
  if (headers && typeof headers === 'function') {
    callback = headers;
    headers = {};
  } else if (!headers) {
    headers = {};
  }
  if (!callback) {
    callback = function(err) {
      if (err) {
        return lerr(err);
      }
    };
  }
  const xhr = new XMLHttpRequest();
  xhr.open(httpType, url, true);
  for (const i in headers) {
    xhr.setRequestHeader(i, headers[i]);
  }
  if (httpType === 'POST') {
    if (!headers['Content-Type']) {
      xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    }
    var postData = (typeof data === 'object') ? JSON.stringify(data) : data;
    xhr.send(postData);
    // llog('kHttp data:'+postData);
  } else {
    xhr.send();
  }
  // llog('kHttp url:'+url+','+httpType);
  xhr.onload = function() {
    if (xhr.status == 200) {
      return callback.call(that, null, xhr.responseText);
    } else {
      if (xhr.status === 403 && that.$router) {
        that.$router.push('/login');
        return;
      }
      return callback.call(that, 'kHttpERR-' + xhr.status, xhr.responseText);
    }
  };
};

var kPost = function(v, url, data, headers, callback) {
  kHttp(v, url, 'POST', data, headers, callback);
};
var kGet = function(v,url, headers, callback) {
  kHttp(v, url, 'GET', null, headers, callback);
};
var pushToArr = function(data, pArr) {
  for (var i in data) {
    if (i === 'req') {
      pushToArr(data[i], pArr);
      continue;
    }
    var d = data[i];
    if (typeof d !== 'string' && typeof d !== 'number') {
      d = JSON.stringify(d);
    }
    pArr.push(i + '=' + d);
  }
};
var mkSign = function(data, key) {
  var pArr = [];
  pushToArr(data, pArr);
  pArr = pArr.sort();
  var str = '';
  for (var i = 0; i < pArr.length; i++) {
    str += '&' + pArr[i];
  }
  str = str.substring(1) + '&key=' + key;
  // console.log('mkSign', str);
  return codeTool().hex_sha1(str);
};
var mkApiReq = function(data) {
  var ts = Date.now();
  var reqData = {
    't': ts,
    'req': data
  };
  var sign = mkSign(reqData, '[#apiKey]');
  reqData.s = sign;
  return JSON.stringify(reqData);
};

var apiReq = function(v, url, data, callback) {
  kPost(v, url, mkApiReq(data), callback);
};

var postDownFile = function(params, url) {
  var form = document.createElement("form");
  form.style.display = "none";
  form.action = url;
  form.method = "post";
  document.body.appendChild(form);
  for (var key in params) {
    var input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    var val = params[key];
    if (typeof val === 'object') {
      val = JSON.stringify(val);
    }
    input.value = val;
    form.appendChild(input);
  }
  form.submit();
  form.remove();
};

Vue.prototype.$kc = {
  $,
  llog,
  lerr,
  mkStyle,
  setStyle,
  twoInt,
  threeInt,
  timeFormat,
  kHttp,
  kPost,
  kGet,
  apiReq,
  codeTool,
  clone,
  showValue,
  priceIntShow,
  priceStrParse,
  mkUpdateObj,
  backUpdateObj,
  inputFormat,
  inputFormatBack,
  postDownFile,
};