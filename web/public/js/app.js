$(document).ready(function() {

  AdminUI.icons.create('menu', '#menu-toggle').create('avatar', '#avatar').create('moon', '#theme-toggle').create('sun', '#theme-toggle');
  AdminUI.theme.update();

  // --- 动态生成菜单 ---
  $('#main-menu').html(AdminUI.buildMenu(AdminUI.mockData.menuData, false));

});