window.kc = {
  chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  randomStr(len, charArr) {
    const charTable = charArr || this.chars;
    const charTableLen = charTable.length;
    const randomBytes = crypto.randomBytes(len);
    const result = new Array(len);
    let cursor = 0;
    for (let i = 0; i < len; i++) {
      cursor += randomBytes[i];
      result[i] = charTable[cursor % charTableLen];
    }
    return result.join('');
  },
  getUrlPara(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  },
  randomInt(lowerValue, upperValue) {
    return Math.floor(Math.random() * (upperValue - lowerValue + 1) + lowerValue);
  },
  base64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(_, hex) {
      return String.fromCharCode(parseInt(hex, 16));
    }));
  },
  deBase64(b64) {
    return decodeURIComponent(atob(b64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  },
  clone(json) {
    if (Array.isArray(json)) {
      const target = [];
      for (let i = 0, len = json.length; i < len; i++) {
        target.push(window.kc.clone(json[i]));
      }
      return target;
    }
    if (Object.prototype.toString.call(json) === '[object Object]') {
      const target = {};
      for (const i in json) {
        target[i] = window.kc.clone(json[i]);
      }
      return target;
    }
    return json;
  },
  jHttp(url, httpType, data, headers, callback) {
    if (headers && typeof headers === 'function') {
      callback = headers;
      headers = {};
    } else if (!headers) {
      headers = {};
    }
    if (!callback) {
      callback = function(err) {
        if (err) {
          return console.error(err);
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
      const postData = (typeof data === 'object') ? JSON.stringify(data) : data;
      xhr.send(postData);
      // llog('kHttp data:'+postData);
    } else {
      xhr.send();
    }
    // llog('kHttp url:'+url+','+httpType);
    xhr.onload = function() {
      if (xhr.status == 200) {
        return callback(null, JSON.parse(xhr.responseText));
      } else {
        if (xhr.status === 403) {
          window.location = '/login';
          return;
        }
        return callback('kHttpERR-' + xhr.status, xhr.responseText);
      }
    };
  },
  jPost(url, data, headers, callback) {
    this.jHttp(url, 'POST', data, headers, callback);
  },
  jGet(url, headers, callback) {
    this.jHttp(url, 'GET', null, headers, callback);
  },
  randomChoose(arr, num) {
    if (!num || num === 1) {
      return [arr[Math.floor((Math.random() * arr.length))]];
    }
    //方法1
    // const shuffledArr = shuffle(arr.slice(0));
    // return shuffledArr.slice(0, num);
    //方法2
    const shuffled = arr.slice(0);
    if (num > arr.length) {
      return shuffled;
    }
    let temp = 0;
    let index = 0;
    let i = arr.length;
    const min = i - num;
    while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
    }
    return shuffled.slice(min);
  },
  twoInt(int) {
    return (int < 10) ? '0' + int : int;
  },

  threeInt(int) {
    if (int < 10) {
      return '00' + int;
    } else if (int < 100) {
      return '0' + int;
    } else {
      return '' + int;
    }
  },

  timeFormat(millSec, formatStr) {
    const d = millSec ? new Date(millSec) : new Date();
    const df = {
      'YYYY': d.getFullYear(),
      'yyyy': d.getFullYear(),
      'MM': this.twoInt(d.getMonth() + 1),
      // 'DD': this.twoInt(d.getDate()),//年中的天数
      'dd': this.twoInt(d.getDate()),
      'HH': this.twoInt(d.getHours()),
      // 'hh': (d.getHours() < 12) ? this.twoInt(d.getHours()) : this.twoInt(d.getHours() - 12),//12小时制
      'mm': this.twoInt(d.getMinutes()),
      'ss': this.twoInt(d.getSeconds()),
      'SSS': this.threeInt(d.getMilliseconds()),
    };
    if (!formatStr) {
      formatStr = 'yyyy-MM-dd HH:mm:ss'; //默认格式
    }
    for (const i in df) {
      formatStr = formatStr.replace(new RegExp(i, 'g'), df[i]);
    }
    return formatStr;
  },
  timeFormatParse(timeStr, formatStr) {
    if (timeStr.length != formatStr.length) {
      throw new Error('[ERR]timeFormatParse timeStr:' + timeStr + '|formatStr:' + formatStr + ';');
    }
    const d = new Date(0);
    d.setHours(0);
    const df = {
      'YYYY': (t) => d.setFullYear(parseInt(t)),
      'yyyy': (t) => d.setFullYear(parseInt(t)),
      'MM': (t) => d.setMonth(parseInt(t) - 1),
      'dd': (t) => d.setDate(parseInt(t)),
      'HH': (t) => d.setHours(parseInt(t)),
      'mm': (t) => d.setMinutes(parseInt(t)),
      'ss': (t) => d.setSeconds(parseInt(t)),
      'SSS': (t) => d.setMilliseconds(parseInt(t)),
    };

    for (const i in df) {
      const tIndex = formatStr.indexOf(i);
      // console.log('tIndex', tIndex, i, '[' + formatStr + ']', '[' + timeStr + ']', i.length);
      if (tIndex >= 0) {
        const t = timeStr.substring(tIndex, tIndex + i.length);
        // console.log('t', t);
        df[i](t);
        timeStr = timeStr.substring(0, tIndex) + timeStr.substring(tIndex + i.length);
        formatStr = formatStr.substring(0, tIndex) + formatStr.substring(tIndex + i.length);
      }
    }
    return d;
  },
  priceIntShow(priceInt, isDeciForce) {
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
  },

  //返回以分为单位的整数，小数只支持两位，两位以上直接截断忽略
  priceStrParse(priceStr) {
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
  },
};