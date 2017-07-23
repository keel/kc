'use strict';

const vlog = require('vlog').instance(__filename);
const configFile = __dirname + '/../config.json';

const mongo = require('./mongo2');

const test = () => {

  mongo.init(configFile, (e) => {
    if (e) {
      return vlog.eo(e);
    }
    console.log('init OK');
    // mongo.checkColl('user').find({ 'phone': '15301588025' }, (e, cur) => {
    //   if (e) {
    //     return vlog.eo(e);
    //   }
    //   cur.toArray((e, re2) => console.log(e, re2));
    // });
    // mongo.checkColl('user').update({ 'phone': '15301588025' }, { '$set': { 'hh': 'aabb' } }, (e, re) => {
    //   if (e) {
    //     return vlog.eo(e);
    //   }
    //   console.log(e, re.result);
    // });
    mongo.c('user').query({ 'phone': '15301588025' },(e, re) => {
      if (e) {
        return vlog.eo(e);
      }
      console.log(e, re);
    });
  });
};


test();

