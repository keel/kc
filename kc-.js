'use strict';

var kc = require('./lib/kc');
var app = kc.createApp(__dirname, { 'isRedisInit': true, 'isMongoInit': true });
app.get('/logout', kc.sessionAuth.logout);
app.start(15000);
