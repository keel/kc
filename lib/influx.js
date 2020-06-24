/*
基于 @influxdata/influxdb-client 封装的influxDB 读写操作
 */
'use strict';
const ktool = require('ktool');
const vlog = require('vlog').instance(__filename);
const { InfluxDB, Point } = require('@influxdata/influxdb-client');


const influxConf = ktool.kconfig.get('influx') || {};
const token = influxConf['s$_token'];
const org = influxConf.org;
const bucket = influxConf.bucket;
const influxUrl = influxConf.url;

const client = (token) ? new InfluxDB({ url: influxUrl, 'token': token }) : null;
const timeAccuracy = 'ns'; //默认时间精度是纳秒

const getWriteApi = function() {
  return client.getWriteApi(org, bucket, timeAccuracy);
};

const getQueryApi = function() {
  return client.getQueryApi(org, bucket, timeAccuracy);
};

const writeData = function(data, callback) {
  const writeApi = getWriteApi();

  // const data = 'mem,host=host1 used_percent=23.43234543'; // Line protocol string
  writeApi.writeRecord(data);
  writeApi
    .close()
    .then(() => {
      callback(null, 'ok');
    })
    .catch(e => {
      callback(vlog.ee(e, 'influxLib.queryData.writeData'));
    });
};

// const fieldTypes = {
//   'int': 'intField',
//   'string': 'stringField',
//   'float': 'floatField',
//   'boolean': 'booleanField',
// };

//pointDataArr: [{'tags':{'gid':'aaaaaa','bid':'bbbbbb'},'fields':{'userName':'haha','int@age':23}}]
const writePoints = function(measurement, pointDataArr, callback) {
  const writeApi = getWriteApi();

  for (let i = 0, len = pointDataArr.length; i < len; i++) {
    const pOne = pointDataArr[i];
    const pointObj = new Point(measurement);
    if (pOne.tags) {
      for (const j in pOne.tags) {
        pointObj.tag(j, pOne.tags[j]);
      }
    }
    if (pOne.fields) {
      for (const j in pOne.fields) {
        const fArr = j.split('@');
        let fType = 'string';
        let fKey = fArr[0];
        if (fArr.length > 1) {
          fType = fArr[0];
          fKey = fArr[1];
        }
        if (pointObj[fType + 'Field']) {
          pointObj[fType + 'Field'](fKey, pOne.fields[j]);
        }
      }
    }
    writeApi.writePoint(pointObj);
  }

  writeApi
    .close()
    .then(() => {
      callback(null, 'ok');
    })
    .catch(e => {
      callback(vlog.ee(e, 'influxLib.queryData.writePoints', measurement));
    });
};


const mkQuery = function(measurement, startTime, endTime) {
  const queryObj = {};
  startTime = (typeof startTime === 'number') ? new Date(startTime).toISOString() : startTime;
  queryObj.query = `from(bucket: "${bucket}")\n|> range(start: ${startTime}`;
  if (endTime) {
    endTime = (typeof endTime === 'number') ? new Date(endTime).toISOString() : endTime;
    queryObj.query += ', stop: ' + endTime;
  }
  queryObj.query += ')';
  queryObj.filter = (filterObj) => {
    if (!filterObj) {
      return queryObj;
    }
    queryObj.query += '\n|> filter(fn: (r) => ';
    for (const i in filterObj) {
      const iArr = i.split('@');
      if (iArr.length > 1) {
        queryObj.query += `r["${iArr[1]}"] ${iArr[0]} "${filterObj[i]}" and `;
      } else {
        queryObj.query += `r["${i}"] == "${filterObj[i]}" and `;
      }
    }
    queryObj.query = queryObj.query.substring(0, queryObj.query.lastIndexOf('and'));
    queryObj.query += ')';
    return queryObj;
  };
  queryObj.filter({ '_measurement': measurement });
  queryObj.group = (groupArr) => {
    if (!groupArr || groupArr.length <= 0) {
      queryObj.query += '\n|> group()';
      return queryObj;
    }
    queryObj.query += '\n|> group(columns: [';
    let gStr = '';
    for (let i = 0, len = groupArr.length; i < len; i++) {
      gStr += ',"' + groupArr[i] + '"';
    }
    gStr = gStr.substring(1); //去掉开始,号
    queryObj.query += gStr + '])';
    return queryObj;
  };
  queryObj.drop = (dropArr) => {
    if (!dropArr || dropArr.length <= 0) {
      queryObj.query += '\n|> drop()';
      return queryObj;
    }
    queryObj.query += '\n|> drop(columns: [';
    let gStr = '';
    for (let i = 0, len = dropArr.length; i < len; i++) {
      gStr += ',"' + dropArr[i] + '"';
    }
    gStr = gStr.substring(1); //去掉开始,号
    queryObj.query += gStr + '])';
    return queryObj;
  };
  queryObj.count = (countStr) => {
    if (!countStr) {
      queryObj.query += '\n|> count()';
      return queryObj;
    }
    queryObj.query += '\n|> count(column: "' + countStr + '")';
    return queryObj;
  };
  queryObj.sum = (sumStr) => {
    if (!sumStr) {
      queryObj.query += '\n|> sum()';
      return queryObj;
    }
    queryObj.query += '\n|> sum(column: "' + sumStr + '")';
    return queryObj;
  };
  queryObj.distinct = (distinctStr) => {
    if (!distinctStr) {
      queryObj.query += '\n|> distinct()';
      return queryObj;
    }
    queryObj.query += '\n|> distinct(column: "' + distinctStr + '")';
    return queryObj;
  };
  queryObj.limit = (limitInt, offset) => {
    if (!limitInt) {
      return queryObj;
    }
    queryObj.query += '\n|> limit(n: ' + limitInt;
    if (offset) {
      queryObj.query += ',offset:' + offset;
    }
    queryObj.query += ')';
    return queryObj;
  };

  queryObj.sort = (sortArr, isDesc) => {
    if (!sortArr || sortArr.length <= 0) {
      queryObj.query += '\n|> sort()';
      return queryObj;
    }
    queryObj.query += '\n|> sort(columns: [';
    let gStr = '';
    for (let i = 0, len = sortArr.length; i < len; i++) {
      gStr += ',"' + sortArr[i] + '"';
    }
    gStr = gStr.substring(1); //去掉开始,号
    queryObj.query += gStr + ']';
    if (isDesc) {
      queryObj.query += ',desc:true';
    }
    queryObj.query += ')';
    return queryObj;
  };

  queryObj.append = (appendStr) => {
    if (!appendStr) {
      return queryObj;
    }
    queryObj.query += '\n|> ' + appendStr;
    return queryObj;
  };

  return queryObj;
};

const queryData = function(query, callback) {
  const queryApi = getQueryApi();
  const out = [];
  // const query = `from(bucket: "${bucket}") |> range(start: -1h)`;
  queryApi.queryRows(query, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);
      out.push(o);
      // console.log('====> %j', o);
    },
    error(error) {
      callback(vlog.ee(error, 'influxLib.queryData.queryRows', query));
    },
    complete() {
      callback(null, out);
    },
  });
};



exports.getWriteApi = getWriteApi;
exports.getQueryApi = getQueryApi;
exports.mkQuery = mkQuery;
exports.writeData = writeData;
exports.queryData = queryData;
exports.writePoints = writePoints;



// const q = mkQuery('ht_nav','-30d').filter({'_field':'fromUid','gid':'5de0e3598107b824ff7a1104','navType':1}).distinct('fromUid').group(['mid']).count().group().sort(['_value'],true);
// console.log(q.query);

// const pointDataArr = [
//   { 'tags': { 'gid': 'aaaaaa', 'bid': 'bbbbbb' }, 'fields': { 'userName': 'haha', 'int@age': 23 } },
//   { 'tags': { 'gid': 'aaaaaa', 'bid': 'cccccc' }, 'fields': { 'userName': 'user2', 'int@age': 33 } },
// ];

// writePoints('test1',pointDataArr,(err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log('re:%j',re);
// });


// const testData = `ht_test,navType=1,gid=5de0e3598107b824ff7a1104,bid=5e207b52f2454e4f90ff2b39,mid=5ea2d557f5cd2504fa953064 fromUid="aabbc2",toUid=""
// ht_test,navType=0,gid=5e8e96c1c6b7ad774765e749,bid=5e8e96ddc6b7ad774765e74a,mid=5e26c1ccdb216f23a9698570 fromUid="aadd",toUid=""
// ht_test,navType=1,gid=5de0e3598107b824ff7a1104,bid=5de0e3da8107b824ff7a1107,mid=5e737a2f76ac86468cef1581 fromUid="aaasdf",toUid=""
// ht_test,navType=1,gid=5e64818fc42f642f44af7eeb,bid=5e6482e2c42f642f44af7eee,mid=5e737a2f76ac86468cef1581 fromUid="asfa3",toUid=""
// ht_test,navType=1,gid=5e8e96c1c6b7ad774765e749,bid=5e6482e2c42f642f44af7eee,mid=5e737a2f76ac86468cef1581 fromUid="asfa3",toUid=""
// `;
// writeData(testData, (err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log('DONE.' + re);
// });


// const q2 = `from(bucket: "${bucket}")
//   |> range(start: 1577808000000000000, stop: 1580486400000000000)
//   |> filter(fn: (r) => r["_measurement"] == "ht_nav" and  r["_field"] == "fromUid")
//   |> distinct(column: "fromUid")
//   |> group(columns: ["gid"])
//   |> count()
//   |> group()
//   |> sort(columns:["_value"],desc: true)
//   |> yield()`;


// queryData(q2, (err, re) => {
//   if (err) {
//     return vlog.eo(err, '');
//   }
//   console.log('===> queryData:%j', re);
// });



//