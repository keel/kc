'use strict';

$(function() {

  var checkStrLen = function(strIn, min, max) {
    if (!strIn) {
      return false;
    }
    if (min && strIn.length < min) {
      return false;
    }
    if (max && strIn.length > max) {
      return false;
    }
    return true;
  };

  $('#loginForm').submit(function() {
    var loginName = $('#loginName').val();
    var loginPwd = $('#loginPwd').val();
    var data = { 'loginName': loginName, 'loginPwd': loginPwd };
    // var data = '{ "loginName":"' + loginName + '","loginPwd":"' + loginPwd + '"}';
    if (!checkStrLen(loginName, 4, 18) || !checkStrLen(loginPwd, 4, 18)) {
      alert('用户名输入错误');
      return false;
    }
    var reqData = makeApiReq('login', data, 'test_client_key');
    // console.log('reqData:', reqData);
    jsonReq('login', reqData, function(err, re) {
      if (err || !re.re) {
        alert('登录失败!');
        return false;
      }
      if (re.re === '0') {
        window.location = 'main';
        return false;
      } else {
        alert('登录失败!');
        return false;
      }
    });
    return false;
  });

});
