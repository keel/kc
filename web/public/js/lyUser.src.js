'use strict';

$(function() {

  $('#findUserBt').click(function() {
    var searchUserName = $('#userNameInput').val();
    if (!checkStrLen(searchUserName, 2)) {
      alert('请至少输入两位字符.');
      return false;
    }
    var data = '{ "userName":"' + searchUserName + '"}';
    jsonReq('/user/find', data, function(err, re) {
      if (err) {
        alert('查询失败!');
        return false;
      }
      if (re.re === '0') {
        var tableTitle = {'_id':'ID','userName':'用户名','loginName':'登录名','level':'等级','state':'状态'};
        var ht = showTable(tableTitle,re.users);
        $('#f_userRe').html(ht);
        return false;
      } else {
        console.log(re);
        $('#f_userRe').html('查询失败,请联系管理员.');
        return false;
      }
    });
    return false;
  });

  $('#a_userForm').submit(function() {
    var a_loginName = $('#a_loginNameInput').val();
    var a_loginPwd = $('#a_loginPwdInput').val();
    var a_userName = $('#a_userNameInput').val();
    if (!checkStrLen(a_loginName, 3, 18) || !checkStrLen(a_loginPwd, 4, 18)|| !checkStrLen(a_userName, 2, 18)) {
      alert('用户信息输入不完整');
      return false;
    }
    var data = formToJson('#a_userForm',false);
    jsonReq('/user/add', data, function(err, re) {
      if (err) {
        alert('添加失败,请检查参数!');
        return false;
      }
      if (re.re === '0') {
        $('#a_userRe').html('添加成功!');
        return false;
      } else {
        alert('添加失败!请联系管理员.');
        return false;
      }
    });
    return false;
  });
  $('#uf_userBt').click(function() {
    var uf_userName = $('#uf_userNameInput').val();
    if (!checkStrLen(uf_userName, 2)) {
      alert('请至少输入两位字符.');
      return false;
    }
    var data = '{ "userName":"' + uf_userName + '"}';
    jsonReq('/user/find', data, function(err, re) {
      if (err) {
        alert('查询失败!');
        return false;
      }
      if (re.re === '0') {
        var userOne = re.users[0];
        $('#u_idShow').html(userOne._id);
        $('#u_idInput').val(userOne._id);
        $('#u_userNameInput').val(userOne.userName);
        $('#u_loginNameInput').val(userOne.loginName);
        $('#u_loginPwdInput').val(userOne.loginPwd);
        $('#u_levelInput').val(userOne.level);
        $('#u_stateInput').val(userOne.state);
        return false;
      } else {
        console.log(re);
        $('#u_userRe').html('查询失败,请联系管理员.');
        return false;
      }
    });
    return false;
  });
  $('#u_userForm').submit(function() {
    var data = formToJson('#u_userForm',true);
    jsonReq('/user/update', data, function(err, re) {
      if (err) {
        alert('添加失败,请检查参数!');
        return false;
      }
      if (re.re === '0') {
        $('#u_userRe').html('更新成功!');
        return false;
      } else {
        alert('添加失败!请联系管理员.');
        return false;
      }
    });
    return false;
  });
});
