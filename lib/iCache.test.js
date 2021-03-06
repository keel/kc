'use strict';
const iCache = require('./iCache');
const vlog = require('vlog').instance(__filename);
const path = require('path');
const cck = require('cck');


const cacheTables = [
  'product#key#{"state":{"$gte":10}}#{}',
  'provinceSeq#seq'
];


iCache.cacheMake('mem', 'mongo', cacheTables, (err) => {
  if (err) {
    return vlog.eo(err, '');
  }
  console.log('------- cacheMake done.');
  iCache.get('product:key:IpFFFsJ7bMta', (err, re) => {
    if (err) {
      return vlog.eo(err, '');
    }
    console.log('re:%j', re);
  });
  iCache.get('provinceSeq:seq:1530158', (err, re) => {
    if (err) {
      return vlog.eo(err, '');
    }
    console.log('re2:%j', re);
  });


  console.log('getSync:%j',iCache.getSync('provinceSeq:seq:1530158'));
});


