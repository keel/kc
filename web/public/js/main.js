// 页面特定JS
$(document).ready(function() {

  $('#bt1').click(() => {
    AdminUI.toast('测试');
  });
  // --- Tree 控件数据和初始化 ---
  var permissionData = [{
      id: 'system',
      label: '系统管理',
      checked: true,
      children: [{
          id: 'user',
          label: '用户管理',
          checked: true,
          children: [
            { id: 'user-add', label: '新增用户', checked: true },
            { id: 'user-edit', label: '编辑用户', checked: true },
            { id: 'user-delete', label: '删除用户', checked: false }
          ]
        },
        { id: 'role', label: '角色管理', checked: true }
      ]
    },
    {
      id: 'content',
      label: '内容管理',
      children: [
        { id: 'article', label: '文章管理' },
        { id: 'comment', label: '评论管理' }
      ]
    }
  ];

  var fileData = [{
      id: 'd1',
      label: 'Documents',
      children: [
        { id: 'f1', label: 'report.docx' },
        { id: 'f2', label: 'notes.txt' }
      ]
    },
    {
      id: 'd2',
      label: 'Images',
      children: [
        { id: 'p1', label: 'photo1.jpg' },
        { id: 'p2', label: 'logo.png' }
      ]
    },
    { id: 'f3', label: 'index.html' }
  ];
  // 初始化带复选框的树
  AdminUI.tree.init('#permission-tree', permissionData, {
    checkable: true,
    cascadeCheck: true
  });

  // 初始化仅用于展示的树
  AdminUI.tree.init('#file-tree', fileData, {
    checkable: false
  });

  // 获取选中项按钮的点击事件
  $('#get-checked-btn').on('click', function() {
    var checkedIds = AdminUI.tree.getChecked('#permission-tree');
    AdminUI.popWin.alert('选中的权限ID: ' + checkedIds.join(', '));
  });


  AdminUI.upload.init('#upload-area', {
    url: '/upload/uploadImg',
    showProgress: true,
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024, // 5MB
    onSuccess: function(response) {
      if (response.indexOf('{"code":-') >= 0) {
        console.error('上传失败', response);
        AdminUI.toast('上传失败', 'danger');
        return;
      }
      imgUrl = response;
      console.log('上传成功', response);
      AdminUI.toast('文件上传成功', 'success');
      $('#upload-area').html('<div><img src="' + imgUrl + '" style="height:180px;" /></div>');
    },
    onError: function(error) {
      console.error('上传失败', error);
      AdminUI.toast(error.message || '上传失败', 'danger');
    },
    onProgress: function(percent) {
      console.log('上传进度:', percent + '%');
    }
  });


});