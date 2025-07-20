$(document).ready(function() {

  AdminUI.icons.create('menu', '#menu-toggle').create('avatar', '#avatar').create('moon', '#theme-toggle').create('sun', '#theme-toggle');
  AdminUI.theme.update();

  function findMenuName(link, data) {
    if (!link) {
      return true;
    }
    for (var i = 0, len = data.length; i < len; i++) {
      var one = data[i];
      if (one.subs) {
        if (findMenuName(link, one.subs)) {
          return true;
        }
      }
      if (one.link === '/'+link) {
        data[i].active = 1;
        return true;
      }
    }
    return false;
  }

  // --- 动态生成菜单 ---
  window.kc.jPost($('#rootPath').val() + 'sideMenu/showMenu', {}, function(err, re) {
    if (err) {
      console.error(err);
      return;
    }
    if (!re || re.code !== 0) {
      AdminUI.toast('拉取菜单错误', 'danger');
      return;
    }
    findMenuName($('#rootPath').attr('data-link'), re.data);
    $('#top_userName').text(re.userName);
    $('#main-menu').html(AdminUI.menu.build(re.data, false));
  });

});