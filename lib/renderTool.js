/*
doT使用类,必须有
 */
'use strict';
let render = null;
const init = function(rootDir) {
  const renderDir = rootDir + '/web/render';
  const tplDir = rootDir + '/web/tpls';
  require('./doTm').process({ global: '_page.render', destination: renderDir, path: (tplDir) });
  render = require(renderDir);
  return render;
};

exports.init = init;
exports.render = function() {
  return render;
};
