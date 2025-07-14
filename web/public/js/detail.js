// 页面特定JS
$(document).ready(function() {
  var originalUserData = null;
  var $form = $('#detail-form');
  var schema = AdminUI.mockData.userSchema;

  var id = $('#tbid').val();
  var tb = $('#tb').val();
  console.log('id',id, 'tb',tb);

  function setMode(mode) {
    if (mode === 'edit') {
      $form.removeClass('view-mode').addClass('edit-mode');
      $('#btn-modify').hide();
      $('#btn-back').hide();
      $('#btn-save').show();
      $('#btn-cancel').show();
    } else {
      $form.addClass('view-mode').removeClass('edit-mode');
      $('#btn-modify').show();
      $('#btn-back').show();
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

  // 基于 Schema 动态收集数据
  function collectFormData() {
    var formData = {};
    for (var fieldName in schema) {
      formData[fieldName] = $('#' + fieldName).val();
    }
    return formData;
  }


  var userId = id;
  if (userId) {
    originalUserData = AdminUI.mockData.users.find(u => u.id == userId);
    if (originalUserData) {
      // 动态渲染表单
      AdminUI.form.render('#detail-form .detail-form-grid', schema, originalUserData);
    } else {
      // ... error handling
    }
  } else {
    // ... error handling
  }

  // --- 事件绑定 ---
  $('#btn-back').on('click', () => window.location.href = '../../' + tb);
  $('#btn-modify').on('click', () => setMode('edit'));

  $('#btn-cancel').on('click', function() {
    // 只需重新渲染即可恢复
    AdminUI.form.render('#detail-form .detail-form-grid', schema, originalUserData);
    setMode('view');
  });

  $('#btn-save').on('click', function() {
    if (validateForm()) {
      var updatedData = collectFormData();
      updatedData.id = originalUserData.id; // 保持ID不变

      // 更新 '原始' 数据以备下次取消
      originalUserData = updatedData;

      // 更新并重新渲染
      AdminUI.form.render('#detail-form .detail-form-grid', schema, updatedData);
      setMode('view');
      AdminUI.toast('用户信息已保存', 'success');
    } else {
      AdminUI.toast('请检查表单输入', 'danger');
    }
  });

});