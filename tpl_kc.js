'use strict';

var kc = require('./lib/kc');
var app = kc.createApp(__dirname, { 'isRedisInit': false, 'isMongoInit': false });
app.get('/logout', kc.sessionAuth.logout);
app.start([#port]);
