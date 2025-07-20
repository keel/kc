// 页面特定JS
$(document).ready(function() {
  var originalUserData = null;
  var $form = $('#detail-form');
  var schema = [{'prop':'name','label':'用户名'},{'prop':'loginName','label':'登录名'},{'prop':'loginPwd','label':'密码','input':{'type':'pwd'}},{'prop':'level','label':'等级','input':{'type':'int'}},{'prop':'state','label':'状态','input':{'type':'int'}}];

  var tb = 'profile';

  function setMode(mode) {
    if (mode === 'edit') {
      $form.removeClass('view-mode').addClass('edit-mode');
      $('#btn-modify').hide();
      $('#btn-save').show();
      $('#btn-cancel').show();
    } else {
      $form.addClass('view-mode').removeClass('edit-mode');
      $('#btn-modify').show();
      $('#btn-save').hide();
      $('#btn-cancel').hide();
      $('.is-invalid').removeClass('is-invalid');
    }
  }

  // 基于 Schema 的动态验证
  function validateForm() {
    var isValid = true;
    $('.is-invalid').removeClass('is-invalid');
    $('.invalid-feedback').remove();

    for (var fieldName in schema) {
      var field = schema[fieldName];
      if (field.required) {
        var $input = $('#' + fieldName);
        if ($input.val().trim() === '') {
          $input.closest('.ui-form-item').find('.ui-input, .ui-select').addClass('is-invalid');
          $input.closest('.ui-form-item').append('<div class="invalid-feedback">' + field.label + '不能为空。</div>');
          isValid = false;
          continue;
        }
      }
      if (field.type === 'email') {
        var $input = $('#' + fieldName);
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test($input.val().trim())) {
          $input.addClass('is-invalid');
          isValid = false;
          $input.closest('.ui-form-item').append('<div class="invalid-feedback">邮箱格式不正确。</div>');
          continue;
        }
      }
    }
    return isValid;
  }



  window.kc.jPost('profile/show', {}, function(err, re) {
    if (err) {
      console.error(err);
      return;
    }
    if (!re || re.code !== 0) {
      AdminUI.toast('拉取数据错误', 'danger');
      return;
    }
    originalUserData = re.data;
    AdminUI.form.render($('#detail-form .detail-form-grid'), schema, 'one', re.data, true);
    setMode('view');
  });

  // --- 事件绑定 ---

  $('#btn-modify').on('click', () => setMode('edit'));

  $('#btn-cancel').on('click', function() {
    // 只需重新渲染即可恢复
    AdminUI.form.render($('#detail-form .detail-form-grid'), schema, 'one', originalUserData, true);
    setMode('view');
  });


  $('#btn-save').on('click', function() {
    if (validateForm()) {
      var updatedData = AdminUI.form.getValues('#detail-form', schema);
      // 更新 '原始' 数据以备下次取消
      originalUserData = updatedData;

      window.kc.jPost('../' + tb + '/update', updatedData, function(err, re) {
        if (err) {
          console.error(err);
          return;
        }
        AdminUI.removeLoading('#btn-save');
        if (!re || re.code !== 0) {
          AdminUI.popWin.alert('更新数据失败.'+(re?re.data:''),'更新失败');
          return;
        }
        // 更新并重新渲染
        AdminUI.form.render($('#detail-form .detail-form-grid'), schema, 'one', updatedData, true);
        setMode('view');
        AdminUI.toast('更新数据成功', 'success');
      });
    } else {
      AdminUI.toast('请检查表单输入', 'danger');
    }
  });

});