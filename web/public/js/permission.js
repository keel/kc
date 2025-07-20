$(document).ready(function() {

  var id = $('#id').val();

  if (!id) {
    return;
  }

  function convertAuthMapToTree(authMap) {
    const treeData = [];

    // 遍历权限映射中的每个条目
    for (const key in authMap) {
      if (authMap.hasOwnProperty(key)) {
        const item = authMap[key];
        // 分割key为层级id数组
        const idParts = key.split('/');
        // 分割name为层级标签数组
        const labelParts = item.name.split('-');
        // 转换check值为布尔类型
        const checked = item.check === 1;

        // 从根节点开始处理
        let currentLevelNodes = treeData;

        // 逐层处理每个层级
        for (let i = 0; i < idParts.length; i++) {
          const currentId = idParts[i];
          const currentLabel = labelParts[i];

          // 查找当前层级是否已存在该节点
          let existingNode = currentLevelNodes.find(node => node.id === currentId);

          // 如果不存在则创建新节点
          if (!existingNode) {
            existingNode = {
              id: currentId,
              label: currentLabel,
              children: []
            };
            currentLevelNodes.push(existingNode);
          }

          // 只有最后一层节点需要设置checked属性
          if (i === idParts.length - 1) {
            existingNode.checked = checked;
          }

          // 进入下一层级处理
          currentLevelNodes = existingNode.children;
        }
      }
    }

    // 移除所有空的children属性
    function removeEmptyChildren(nodes) {
      nodes.forEach(node => {
        if (node.children && node.children.length === 0) {
          delete node.children;
        } else if (node.children) {
          // 递归处理子节点
          removeEmptyChildren(node.children);
        }
      });
    }

    // 处理根节点
    removeEmptyChildren(treeData);

    return treeData;
  }
  window.kc.jPost('../authMap', { 'uid': id }, function(err, re) {
    if (err) {
      console.error(err);
      return;
    }
    if (!re || re.code !== 0) {
      AdminUI.toast('拉取数据错误', 'danger');
      return;
    }
    if (re.showUpdate) {
      $('#btn-save').show();
    }
    const treeData = convertAuthMapToTree(re.data);
    AdminUI.tree.init('#permission-tree', treeData, {
      checkable: true,
      cascadeCheck: true
    });

  });

  // --- 事件绑定 ---
  $('#btn-save').on('click', function() {
    var checkedIds = AdminUI.tree.getChecked('#permission-tree');
    window.kc.jPost('../authSave', { 'uid': id,'data':checkedIds }, function(err, re) {
      AdminUI.removeLoading('#btn-save');
      if (err) {
        console.error(err);
        return;
      }
      if (!re || re.code !== 0) {
        AdminUI.toast('保存数据错误', 'danger');
        return;
      }
      AdminUI.toast('保存数据成功!', 'success');
    });
  });



});