/*
doT使用类,必须有
 */
'use strict';
var render = null;
var init = function(rootDir) {
  var renderDir = rootDir + '/web/render';
  var tplDir = rootDir + '/web/tpls';
  require('dot').process({ global: '_page.render', destination: renderDir, path: (tplDir) });
  render = require(renderDir);
  return render;
};

exports.init = init;
exports.render = function() {
  return render;
};
