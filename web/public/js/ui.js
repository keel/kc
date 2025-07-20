// 使用IIFE（立即调用函数表达式）来创建私有作用域
(function($) {
  // 严格模式
  'use strict';

  // 创建全局UI对象
  var AdminUI = {};
  AdminUI.icons = {
    menu: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <line x1="3" y1="12" x2="21" y2="12"></line> <line x1="3" y1="6" x2="21" y2="6"></line> <line x1="3" y1="18" x2="21" y2="18"></line> </svg>',
    moon: '<svg class="icon icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg class="icon icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <circle cx="12" cy="12" r="5"></circle> <line x1="12" y1="1" x2="12" y2="3"></line> <line x1="12" y1="21" x2="12" y2="23"></line> <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line> <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line> <line x1="1" y1="12" x2="3" y2="12"></line> <line x1="21" y1="12" x2="23" y2="12"></line> <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line> <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line> </svg>',
    avatar: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path> <circle cx="12" cy="7" r="4"></circle> </svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    dash: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
    management: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
    content: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    collapse: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    arrow: '<svg class="arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
    home: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    exit: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    product: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 9h6v6H9z"></path></svg>',
    project: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    upload: '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>',
    create: function(iconName, target, isHide) {
      var icon = $(AdminUI.icons[iconName] || '');
      $(target).append(icon);
      if (isHide) {
        icon.hide();
      }
      return AdminUI.icons;
    },
  };
  // --- 模拟数据 ---
  AdminUI.mockData = {

  };

  // --- 模块: 主题切换 ---
  AdminUI.theme = {
    theme: 'light',
    init: function() {
      var self = this;
      var theme = localStorage.getItem('admin-theme') || 'light';
      self.set(theme);

      $(document).on('click', '#theme-toggle', function() {
        var currentTheme = $('html').attr('data-theme');
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        self.set(newTheme);
      });

      // 初始化按钮点击事件，监听带 data-loading-text 属性的按钮
      $(document).on('click', '.ui-button[data-loading-text]', function() {
        var $button = $(this);
        if (!$button.hasClass('loading')) {
          // 保存原始文本
          $button.data('original-text', $button.html());
          // 添加 loading 类
          $button.addClass('loading');
          // 禁用按钮
          $button.prop('disabled', true);
          $button.text($button.attr('data-loading-text'));

        }
      });
    },
    update() {
      // 更新切换按钮的图标
      if (this.theme === 'dark') {
        $('#theme-toggle .icon-sun').show();
        $('#theme-toggle .icon-moon').hide();
      } else {
        $('#theme-toggle .icon-sun').hide();
        $('#theme-toggle .icon-moon').show();
      }
    },
    set: function(theme) {
      $('html').attr('data-theme', theme);
      localStorage.setItem('admin-theme', theme);
      this.theme = theme;
      this.update();
    }
  };

  // --- 模块: Toast ---
  AdminUI.toast = function(message, type, duration) {
    if (!$('#ui-toast-container').length) {
      $('body').append('<div id="ui-toast-container"></div>');
    }
    duration = duration || 3000;
    var toastClass = 'ui-toast' + (type ? ' ' + type : '');
    var $toast = $('<div class="' + toastClass + '">' + message + '</div>');

    $('#ui-toast-container').append($toast);

    setTimeout(function() {
      $toast.fadeOut(500, function() {
        $(this).remove();
      });
    }, duration);
  };


  // 添加一个方法用于移除 loading 状态
  AdminUI.removeLoading = function(buttonSelector) {
    var $button = $(buttonSelector);
    if ($button.hasClass('loading')) {
      // 恢复原始文本
      $button.html($button.data('original-text'));
      // 移除 loading 类
      $button.removeClass('loading');
      // 启用按钮
      $button.prop('disabled', false);
    }
  };
  // --- 模块: PopWin ---
  AdminUI.popWin = {
    _stack: [],
    _show: function(options) {
      var self = this;
      var zIndex = 100 + self._stack.length * 2;

      if (self._stack.length === 0) {
        self._bodyOverflow = $('body').css('overflow');
        $('body').css('overflow', 'hidden');
      }

      var buttonsHtml = '';
      if (options.buttons && options.buttons.length > 0) {
        for (var i = 0; i < options.buttons.length; i++) {
          var btn = options.buttons[i];
          var loading = btn['data-loading-text'] ? 'data-loading-text="' + btn['data-loading-text'] + '"' : '';
          buttonsHtml += '<button class="ui-button ' + (btn.className || '') + '" ' + loading + '>' + btn.text + '</button>';
        }
      }
      var id = options.id ? ' id="' + options.id + '"' : '';
      var $popWin = $(
        '<div ' + id + ' class="ui-popwin-backdrop" style="z-index: ' + zIndex + ';">' +
        '<div class="ui-popwin" style="z-index: ' + (zIndex + 1) + ';">' +
        (options.title ? '<div class="ui-popwin-header">' + options.title + '</div>' : '') +
        '<div class="ui-popwin-content">' + (options.content || '') + '</div>' +
        (buttonsHtml ? '<div class="ui-popwin-footer">' + buttonsHtml + '</div>' : '') +
        '</div>' +
        '</div>'
      );

      $('body').append($popWin);
      self._stack.push($popWin);

      // 绑定按钮事件
      if (options.buttons && options.buttons.length > 0) {
        $popWin.find('.ui-popwin-footer .ui-button').each(function(index) {
          $(this).on('click', function() {
            if (options.buttons[index].onClick) {
              var close = options.buttons[index].onClick.call($popWin, $popWin);
              if (close !== false) {
                self.close();
              }
            } else {
              self.close();
            }
          });
        });
      }

      // 点击背景关闭弹窗控制
      if (options.closeOnBackdrop !== false) {
        $popWin.on('click', function(e) {
          if ($(e.target).hasClass('ui-popwin-backdrop')) {
            self.close();
          }
        });
      }

      AdminUI.update();
    },
    // 新增自定义内容方法
    custom: function(options) {
      var defaults = {
        title: '',
        content: '',
        buttons: [],
        closeOnBackdrop: true
      };
      var settings = $.extend({}, defaults, options);
      this._show(settings);
    },
    close: function() {
      var $popWin = this._stack.pop();
      if ($popWin) {
        $popWin.remove();
      }
      if (this._stack.length === 0) {
        $('body').css('overflow', this._bodyOverflow);
      }
    },
    alert: function(content, title) {
      title = title || '提示';
      this._show({
        title: title,
        content: content,
        buttons: [{ text: '确定' }],
        closeOnBackdrop: true
      });
    },
    confirm: function(content, onConfirm, title, onCancel) {
      title = title || '确认';
      this._show({
        title: title,
        content: content,
        buttons: [
          { text: '取消', className: '', onClick: onCancel },
          { text: '确定', className: 'primary', onClick: onConfirm }
        ],
        closeOnBackdrop: true
      });
    },
    prompt: function(content, onConfirm, title, defaultValue) {
      title = title || '请输入';
      defaultValue = defaultValue || '';
      var promptContent = content + '<input type="text" class="ui-input" value="' + defaultValue + '">';
      this._show({
        title: title,
        content: promptContent,
        buttons: [
          { text: '取消', className: '' },
          {
            text: '确定',
            className: 'primary',
            onClick: function($win) {
              var value = $win.find('.ui-input').val();
              if (onConfirm) {
                onConfirm(value);
              }
            }
          }
        ],
        closeOnBackdrop: true
      });
    }
  };

  // --- 模块: Dropdown ---
  AdminUI.dropdown = {
    isInited: false,
    init: function() {
      if (this.isInited) {
        return;
      }
      this.isInited = true;
      $(document).on('click', '.ui-dropdown-toggle', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $dropdown = $(this).closest('.ui-dropdown');
        $('.ui-dropdown-menu').not($dropdown.find('.ui-dropdown-menu')).hide();
        $dropdown.find('.ui-dropdown-menu').toggle();
      });

      $(document).on('click', function() {
        $('.ui-dropdown-menu').hide();
      });

      $(document).on('click', '.ui-dropdown-menu', function(e) {
        e.stopPropagation();
      });
    }
  };

  // --- 模块: 左侧菜单 ---
  AdminUI.menu = {
    _hasActiveChild: function(item) {
      if (!item.subs) return false;

      for (var i = 0; i < item.subs.length; i++) {
        var child = item.subs[i];
        if (child.active || AdminUI.menu._hasActiveChild(child)) {
          return true;
        }
      }
      return false;
    },
    build: function(items, isSubmenu) {
      var menuHtml = isSubmenu ? '<ul class="submenu">' : '';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var hasChildren = item.subs && item.subs.length > 0;
        var activeClass = item.active ? 'active' : '';
        var openClass = '';

        // 检查子节点是否有active状态
        if (hasChildren) {
          var hasActiveChild = AdminUI.menu._hasActiveChild(item);
          if (hasActiveChild) {
            openClass = 'open';
          }
        }

        menuHtml += '<li class="' + activeClass + ' ' + openClass + '">';
        menuHtml += '<a href="' + (item.link || '#') + '">';
        if (item.icon) menuHtml += '<i class="icon">' + (AdminUI.icons[item.icon] || '') + '</i>';
        menuHtml += '<span class="menu-text">' + item.name + '</span>';
        if (hasChildren) menuHtml += AdminUI.icons.arrow;
        menuHtml += '</a>';
        if (hasChildren) {
          menuHtml += AdminUI.menu.build(item.subs, true);
        }
        menuHtml += '</li>';
      }
      menuHtml += isSubmenu ? '</ul>' : '';
      return menuHtml;
    },
    init: function() {
      // 菜单项点击
      $('#admin-sidebar .ui-menu').on('click', 'a', function(e) {
        var $li = $(this).parent('li');
        if ($li.children('.submenu').length) {
          e.preventDefault();
          e.stopPropagation();

          // 清除动画队列防止重复
          $li.siblings().find('.submenu').stop(true, true).slideUp();
          $li.siblings().removeClass('open');

          // 使用 stop() 确保动画队列被清除
          $li.children('.submenu').stop(true, true).slideToggle(
            200,
            function() {
              // 确保动画完成后才切换类
              $li.toggleClass('open', $(this).is(':visible'));
            }
          );
        }
      });

      // 菜单伸缩
      $('#menu-toggle').on('click', function() {
        if ($(window).width() > 768) { // PC端
          $('#admin-layout').toggleClass('menu-icon-only');
        } else { // 移动端
          $('#admin-layout').toggleClass('menu-mobile-show');
        }
      });

      // 点击遮罩层关闭移动端菜单
      $(document).on('click', function(e) {
        if ($(window).width() <= 768 && $('#admin-layout').hasClass('menu-mobile-show')) {
          if (!$(e.target).closest('#admin-sidebar').length && !$(e.target).closest('#menu-toggle').length) {
            $('#admin-layout').removeClass('menu-mobile-show');
          }
        }
      });
    }
  };

  // --- 模块: 加载状态 ---
  AdminUI.loading = {
    show: function(selector) {
      var $container = $(selector);
      if (!$container.length) return;
      $container.addClass('ui-loading-container');
      if ($container.find('.ui-loading-overlay').length === 0) {
        $container.append(
          '<div class="ui-loading-overlay">' +
          '<div class="ui-loading-spinner"></div>' +
          '</div>'
        );
      }
    },
    hide: function(selector) {
      $(selector).find('.ui-loading-overlay').remove();
      $(selector).removeClass('ui-loading-container');
    }
  };

  // --- 模块: DatePicker ---
  AdminUI.datePicker = {
    _currentPicker: null, // 用于跟踪当前打开的日历
    $input: null,
    init: function() {
      var self = this;
      // 自动为带有 data-ui-datepicker 的输入框添加功能
      $('input[data-ui-datepicker]').each(function() {
        var $input = $(this);
        // 包装输入框以放置图标
        if (!$input.parent().hasClass('ui-datepicker-input-container')) {
          $input.wrap('<div class="ui-datepicker-input-container"></div>');
          $input.after('<i class="icon">' + AdminUI.icons.calendar + '</i>');
        }

        $input.on('click', function(e) {
          e.stopPropagation();
          self.show(this);
        });
        self.$input = $input;
      });

      // 点击页面其他地方关闭日历
      $(document).on('click', function() {
        if (self._currentPicker) {
          self.hide();
        }
      });
    },
    show: function(input) {
      var self = this;
      self.hide(); // 先关闭其他可能打开的

      var $input = $(input);
      var dateValue = $input.val();
      var initialDate = dateValue ? new Date(dateValue) : new Date();
      if (isNaN(initialDate.getTime())) { initialDate = new Date(); }

      var year = initialDate.getFullYear();
      var month = initialDate.getMonth();

      var $picker = $(self._createHTML(year, month));
      $('body').append($picker);
      self._currentPicker = $picker;

      // 定位
      var inputPos = $input.offset();
      $picker.css({
        top: inputPos.top + $input.outerHeight() + 5,
        left: inputPos.left
      });


      self.$input = $input;

      $picker.on('click', function(e) { e.stopPropagation(); }); // 防止点击日历自身时关闭

      // 绑定事件
      self._bindEvents($picker, year, month);

      $picker.show();
    },
    hide: function() {
      if (this._currentPicker) {
        this._currentPicker.remove();
        this._currentPicker = null;
      }
    },
    _bindEvents: function($picker, year, month) {
      var self = this;

      // --- 年份导航 ---
      $picker.find('.prev-year').on('click', function() {
        year--;
        self._update($picker, year, month);
      });
      $picker.find('.next-year').on('click', function() {
        year++;
        self._update($picker, year, month);
      });

      // --- 月份导航 ---
      $picker.find('.prev-month').on('click', function() {
        month--;
        if (month < 0) {
          month = 11;
          year--;
        }
        self._update($picker, year, month);
      });
      $picker.find('.next-month').on('click', function() {
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
        self._update($picker, year, month);
      });

      // --- 日期选择 ---
      $picker.find('.ui-datepicker-day:not(.other-month, .disabled)').on('click', function() {
        var day = $(this).text();
        var selectedDate = new Date(year, month, day);
        var yyyy = selectedDate.getFullYear();
        var mm = ('0' + (selectedDate.getMonth() + 1)).slice(-2);
        var dd = ('0' + selectedDate.getDate()).slice(-2);
        self.$input.val(yyyy + '-' + mm + '-' + dd);
        self.hide();
      });
    },
    _update: function($picker, year, month) {
      var self = this;
      var newContent = $(self._createHTML(year, month)).html();
      $picker.html(newContent);
      // 需要重新绑定事件
      self._bindEvents($picker, year, month);
    },
    _createHTML: function(year, month) {
      var today = new Date();
      var firstDay = new Date(year, month, 1);
      var lastDay = new Date(year, month + 1, 0);
      var firstDayOfWeek = firstDay.getDay(); // 0 (Sun) to 6 (Sat)
      var daysInMonth = lastDay.getDate();

      var html = '<div class="ui-datepicker-container">';
      // Header with new year buttons
      html += '<div class="ui-datepicker-header">' +
        '<button class="nav-btn prev-year" title="上一年"><<</button>' +
        '<button class="nav-btn prev-month" title="上一月"><</button>' +
        '<span class="month-year">' + year + '年 ' + (month + 1) + '月</span>' +
        '<button class="nav-btn next-month" title="下一月">></button>' +
        '<button class="nav-btn next-year" title="下一年">>></button>' +
        '</div>';

      // Grid
      html += '<div class="ui-datepicker-grid">';
      var weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      for (var i = 0; i < weekdays.length; i++) {
        html += '<span class="ui-datepicker-weekday">' + weekdays[i] + '</span>';
      }

      // Days
      var dayCounter = 1;
      for (var i = 0; i < 42; i++) {
        if (i >= firstDayOfWeek && dayCounter <= daysInMonth) {
          var classes = 'ui-datepicker-day';
          if (dayCounter === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            classes += ' today';
          }
          html += '<span class="' + classes + '">' + dayCounter + '</span>';
          dayCounter++;
        } else {
          html += '<span class="ui-datepicker-day other-month"></span>';
        }
      }
      html += '</div></div>';
      return html;
    }
  };

  AdminUI.dateRangePicker = {
    _currentPicker: null,
    $input: null,
    startDate: null,
    endDate: null,
    leftYear: null,
    leftMonth: null,
    // 新增: 右侧日历的状态
    rightYear: null,
    rightMonth: null,

    init: function() {
      var self = this;
      // 自动为带有 data-ui-daterangepicker 的输入框添加功能
      $('input[data-ui-daterangepicker]').each(function() {
        var $input = $(this);
        if (!$input.parent().hasClass('ui-datepicker-input-container')) {
          $input.wrap('<div class="ui-datepicker-input-container"></div>');
          $input.after('<i class="icon">' + AdminUI.icons.calendar + '</i>');
        }
        $input.on('click', function(e) {
          e.stopPropagation();
          self.show(this);
        });
      });

      $(document).on('click', function() {
        if (self._currentPicker) {
          self.hide();
        }
      });
    },

    show: function(input) {
      var self = this;
      self.hide();

      self.$input = $(input);

      // 解析输入框中的值
      var parts = self.$input.val().split(' - ');
      self.startDate = parts[0] ? new Date(parts[0]) : null;
      self.endDate = parts[1] ? new Date(parts[1]) : null;
      if (self.startDate && isNaN(self.startDate.getTime())) self.startDate = null;
      if (self.endDate && isNaN(self.endDate.getTime())) self.endDate = null;

      var initialDate = self.startDate || new Date();
      self.leftYear = initialDate.getFullYear();
      self.leftMonth = initialDate.getMonth();

      // 初始化右侧日历状态
      var rightInitialDate = new Date(self.leftYear, self.leftMonth + 1, 1);
      self.rightYear = rightInitialDate.getFullYear();
      self.rightMonth = rightInitialDate.getMonth();


      var $picker = $(self._createHTML());
      $('body').append($picker);
      self._currentPicker = $picker;

      // 定位逻辑，增加位置自适应
      var inputPos = self.$input.offset();
      var inputHeight = self.$input.outerHeight();
      var inputWidth = self.$input.outerWidth();
      var pickerWidth = $picker.outerWidth();
      var windowWidth = $(window).width();

      var top = inputPos.top + inputHeight + 5;
      var left = inputPos.left;

      // 如果选择器超出屏幕右侧，则调整其left值
      if (left + pickerWidth > windowWidth) {
        left = inputPos.left + inputWidth - pickerWidth;
      }
      // 防止调整后超出屏幕左侧
      if (left < 5) {
        left = 5;
      }

      $picker.css({
        top: top,
        left: left
      }).show();

      $picker.on('click', function(e) { e.stopPropagation(); });

      self._bindEvents();
      self._applyDateClasses();
      self._updateNavButtons(); // 初始时更新按钮状态
    },

    hide: function() {
      if (this._currentPicker) {
        this._currentPicker.remove();
        this._currentPicker = null;
      }
    },

    _update: function() {
      var newContent = $(this._createHTML()).html();
      this._currentPicker.html(newContent);
      this._bindEvents();
      this._applyDateClasses();
      this._updateNavButtons(); // 每次更新后都要检查导航按钮状态
    },

    _createCalendarHTML: function(year, month) {
      // 复用单日历的HTML生成逻辑，但不包含外层容器
      return $(AdminUI.datePicker._createHTML(year, month)).html();
    },

    _createHTML: function() {
      // 直接使用左右日历的状态，不再动态计算右侧
      return `
            <div class="ui-daterangepicker-container">
                <div class="ui-daterangepicker-calendars">
                    <div class="ui-datepicker-container left">
                        ${this._createCalendarHTML(this.leftYear, this.leftMonth)}
                    </div>
                    <div class="ui-datepicker-container right">
                        ${this._createCalendarHTML(this.rightYear, this.rightMonth)}
                    </div>
                </div>
                <div class="ui-daterangepicker-footer">
                    <button class="ui-button cancel-btn">取消</button>
                    <button class="ui-button primary confirm-btn">确定</button>
                </div>
            </div>`;
    },

    _updateNavButtons: function() {
      var self = this;
      var $picker = self._currentPicker;

      // 获取左右日历的 Date 对象用于比较
      var leftCalDate = new Date(self.leftYear, self.leftMonth, 1);
      var rightCalDate = new Date(self.rightYear, self.rightMonth, 1);

      // 禁用左侧日历中可能导致跨越到右侧日历的 "next" 按钮
      var nextMonthLeft = new Date(self.leftYear, self.leftMonth + 1, 1);
      if (nextMonthLeft >= rightCalDate) {
        $picker.find('.left .next-month').prop('disabled', true).addClass('disabled');
      }
      var nextYearLeft = new Date(self.leftYear + 1, self.leftMonth, 1);
      if (nextYearLeft >= rightCalDate) {
        $picker.find('.left .next-year').prop('disabled', true).addClass('disabled');
      }

      // 禁用右侧日历中可能导致跨越到左侧日历的 "prev" 按钮
      var prevMonthRight = new Date(self.rightYear, self.rightMonth - 1, 1);
      if (prevMonthRight <= leftCalDate) {
        $picker.find('.right .prev-month').prop('disabled', true).addClass('disabled');
      }
      var prevYearRight = new Date(self.rightYear - 1, self.rightMonth, 1);
      if (prevYearRight <= leftCalDate) {
        $picker.find('.right .prev-year').prop('disabled', true).addClass('disabled');
      }
    },

    _bindEvents: function() {
      var self = this;
      var $picker = self._currentPicker;

      // --- 独立导航事件 ---
      // 左侧日历
      $picker.find('.left .prev-month').on('click', function() {
        self.leftMonth--;
        if (self.leftMonth < 0) {
          self.leftMonth = 11;
          self.leftYear--;
        }
        self._update();
      });
      $picker.find('.left .next-month').on('click', function() {
        if ($(this).hasClass('disabled')) return;
        self.leftMonth++;
        if (self.leftMonth > 11) {
          self.leftMonth = 0;
          self.leftYear++;
        }
        self._update();
      });
      $picker.find('.left .prev-year').on('click', function() {
        self.leftYear--;
        self._update();
      });
      $picker.find('.left .next-year').on('click', function() {
        if ($(this).hasClass('disabled')) return;
        self.leftYear++;
        self._update();
      });

      // 右侧日历
      $picker.find('.right .prev-month').on('click', function() {
        if ($(this).hasClass('disabled')) return;
        self.rightMonth--;
        if (self.rightMonth < 0) {
          self.rightMonth = 11;
          self.rightYear--;
        }
        self._update();
      });
      $picker.find('.right .next-month').on('click', function() {
        self.rightMonth++;
        if (self.rightMonth > 11) {
          self.rightMonth = 0;
          self.rightYear++;
        }
        self._update();
      });
      $picker.find('.right .prev-year').on('click', function() {
        if ($(this).hasClass('disabled')) return;
        self.rightYear--;
        self._update();
      });
      $picker.find('.right .next-year').on('click', function() {
        self.rightYear++;
        self._update();
      });

      // --- 日期点击事件 (逻辑不变) ---
      $picker.find('.ui-datepicker-day:not(.other-month, .disabled)').on('click', function() {
        var $day = $(this);
        var year = $day.closest('.ui-datepicker-container').find('.month-year').text().match(/(\d{4})年/)[1];
        var month = $day.closest('.ui-datepicker-container').find('.month-year').text().match(/(\d{1,2})月/)[1] - 1;
        var day = $day.text();
        var clickedDate = new Date(year, month, day);

        if (!self.startDate || self.endDate) {
          self.startDate = clickedDate;
          self.endDate = null;
        } else if (clickedDate < self.startDate) {
          self.startDate = clickedDate;
        } else {
          self.endDate = clickedDate;
        }
        self._applyDateClasses();
      });

      // --- 悬停事件 (逻辑不变) ---
      $picker.find('.ui-datepicker-day:not(.other-month, .disabled)').on('mouseenter', function() {
        if (!self.startDate || self.endDate) return;
        $picker.find('.in-hover-range').removeClass('in-hover-range');

        var $day = $(this);
        var year = $day.closest('.ui-datepicker-container').find('.month-year').text().match(/(\d{4})年/)[1];
        var month = $day.closest('.ui-datepicker-container').find('.month-year').text().match(/(\d{1,2})月/)[1] - 1;
        var day = $day.text();
        var hoverDate = new Date(year, month, day);

        if (hoverDate < self.startDate) return;

        $picker.find('.ui-datepicker-day:not(.other-month, .disabled)').each(function() {
          var d = new Date($(this).data('date'));
          if (d > self.startDate && d < hoverDate) {
            $(this).addClass('in-hover-range');
          }
        });
      });
      $picker.find('.ui-daterangepicker-calendars').on('mouseleave', function() {
        $picker.find('.in-hover-range').removeClass('in-hover-range');
      });


      // --- 底部按钮事件 (逻辑不变) ---
      $picker.find('.confirm-btn').on('click', function() {
        if (self.startDate && self.endDate) {
          var yyyy1 = self.startDate.getFullYear();
          var mm1 = ('0' + (self.startDate.getMonth() + 1)).slice(-2);
          var dd1 = ('0' + self.startDate.getDate()).slice(-2);

          var yyyy2 = self.endDate.getFullYear();
          var mm2 = ('0' + (self.endDate.getMonth() + 1)).slice(-2);
          var dd2 = ('0' + self.endDate.getDate()).slice(-2);

          self.$input.val(yyyy1 + '-' + mm1 + '-' + dd1 + ' - ' + yyyy2 + '-' + mm2 + '-' + dd2);
          self.hide();
        } else {
          AdminUI.toast('请选择一个完整的日期范围');
        }
      });
      $picker.find('.cancel-btn').on('click', function() {
        self.hide();
      });
    },

    _applyDateClasses: function() {
      var self = this;
      self._currentPicker.find('.range-start, .range-end, .in-range').removeClass('range-start range-end in-range');

      if (!self.startDate) return;

      var startMs = self.startDate.setHours(0, 0, 0, 0);
      var endMs = self.endDate ? self.endDate.setHours(0, 0, 0, 0) : null;

      self._currentPicker.find('.ui-datepicker-day:not(.other-month)').each(function() {
        var $day = $(this);
        var year = $day.closest('.ui-datepicker-container').find('.month-year').text().match(/(\d{4})年/)[1];
        var month = $day.closest('.ui-datepicker-container').find('.month-year').text().match(/(\d{1,2})月/)[1] - 1;
        var day = $day.text();
        var currentMs = new Date(year, month, day).getTime();

        $day.data('date', new Date(currentMs));

        if (currentMs === startMs) {
          $day.addClass('range-start');
        }

        if (endMs) {
          if (currentMs === endMs) {
            $day.addClass('range-end');
          }
          if (currentMs > startMs && currentMs < endMs) {
            $day.addClass('in-range');
          }
        }
      });
    }
  };
  // --- 模块: Tree ---
  AdminUI.tree = {
    init: function(selector, data, options) {
      var $container = $(selector);
      if (!$container.length) return;

      options = $.extend({
        checkable: false, // 是否显示复选框
        cascadeCheck: true // 是否级联选择
      }, options);

      var treeHtml = this._buildHTML(data, options);
      $container.html('<ul class="ui-tree">' + treeHtml + '</ul>');

      if (options.checkable && options.cascadeCheck) {
        this._setInitialState($container);
      }

      this._bindEvents($container, options);
    },

    _buildHTML: function(nodes, options) {
      var html = '';
      var self = this;

      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var hasChildren = node.children && node.children.length > 0;
        var isLeaf = !hasChildren;
        var liClass = 'ui-tree-item ' + (isLeaf ? 'is-leaf' : 'collapsed');

        html += '<li class="' + liClass + '" data-id="' + node.id + '">';
        html += '<div class="ui-tree-content">';
        html += '<span class="ui-tree-toggler">' + AdminUI.icons.collapse + '</span>';

        if (options.checkable) {
          var checkedAttr = node.checked ? ' checked' : '';
          html += '<label class="ui-checkbox"><input type="checkbox" class="ui-tree-checkbox" value="' + node.id + '"' + checkedAttr + '><span class="box"></span></label>';
        }

        html += '<span class="ui-tree-label">' + (node.text || node.label) + '</span>';
        html += '</div>';

        if (hasChildren) {
          html += '<ul style="display: none;">' + self._buildHTML(node.children, options) + '</ul>';
        }
        html += '</li>';
      }
      return html;
    },

    _setInitialState: function($container) {
      var self = this;
      $container.find('ul').get().reverse().forEach(function(ul) {
        var $parentLi = $(ul).closest('.ui-tree-item');
        if ($parentLi.length) {
          self._updateParentState($parentLi);
        }
      });
    },

    _updateParentState: function($parentLi) {
      if (!$parentLi || !$parentLi.length) return;

      var $parentCheckbox = $parentLi.find('> .ui-tree-content .ui-tree-checkbox');
      var $parentLabel = $parentCheckbox.closest('.ui-checkbox');

      var $childrenCheckboxes = $parentLi.find('> ul > .ui-tree-item > .ui-tree-content .ui-tree-checkbox');
      var total = $childrenCheckboxes.length;
      if (total === 0) return;

      var checkedCount = 0;
      var indeterminateCount = 0;

      $childrenCheckboxes.each(function() {
        if ($(this).prop('checked')) {
          checkedCount++;
        } else if ($(this).closest('.ui-checkbox').hasClass('indeterminate')) {
          indeterminateCount++;
        }
      });

      if (checkedCount === 0 && indeterminateCount === 0) {
        $parentCheckbox.prop('checked', false);
        $parentLabel.removeClass('indeterminate');
      } else if (checkedCount === total) {
        $parentCheckbox.prop('checked', true);
        $parentLabel.removeClass('indeterminate');
      } else {
        $parentCheckbox.prop('checked', false);
        $parentLabel.addClass('indeterminate');
      }
    },

    _bindEvents: function($container, options) {
      var self = this;

      $container.on('click', '.ui-tree-toggler', function(e) {
        e.stopPropagation();
        var $li = $(this).closest('.ui-tree-item');
        $li.children('ul').stop(true, true).slideToggle(10, function() {
          $li.toggleClass('collapsed');
        });
      });

      $container.on('click', '.ui-tree-label', function(e) {
        $(this).siblings('.ui-tree-toggler').trigger('click');
      });

      if (options.checkable && options.cascadeCheck) {
        $container.on('change', '.ui-tree-checkbox', function() {
          var $this = $(this);
          var $label = $this.closest('.ui-checkbox');
          var isChecked = $this.prop('checked');

          if ($label.hasClass('indeterminate')) {
            $label.removeClass('indeterminate');
            $this.prop('checked', true);
            isChecked = true;
          }

          var $currentItem = $this.closest('.ui-tree-item');
          var $childrenCheckboxes = $currentItem.find('ul .ui-tree-checkbox');
          $childrenCheckboxes.prop('checked', isChecked);
          $childrenCheckboxes.closest('.ui-checkbox').removeClass('indeterminate');

          $currentItem.parents('.ui-tree-item').each(function() {
            self._updateParentState($(this));
          });
        });
      }
    },

    getCheckedValues: function(selector) {
      var values = [];
      $(selector).find('.ui-tree-checkbox:checked').each(function() {
        values.push($(this).val());
      });
      return values;
    },
    getChecked: function(selector) {
      var self = this;
      var checkedItems = [];

      $(selector).find('.ui-tree-checkbox:checked').each(function() {
        var $checkbox = $(this);
        var $item = $checkbox.closest('.ui-tree-item');
        var path = self._getItemPath($item);
        checkedItems.push(path);
      });
      return checkedItems;
    },
    _getItemPath: function($item) {
      var path = [];
      var $current = $item;
      while ($current.length) {
        var id = $current.data('id');
        if (id) {
          path.unshift(id);
        }
        $current = $current.parent('ul').closest('.ui-tree-item');
      }

      return path.join('/');
    },
  };

  // --- 模块: Custom Select ---
  AdminUI.select = {
    init: function() {
      var self = this;
      $('select[data-ui-select]').each(function() {
        self.create(this);
      });

      $(document).on('click', function(e) {
        if (!$(e.target).closest('.ui-select').length) {
          $('.ui-select.is-open').removeClass('is-open').find('.ui-select-menu').hide();
        }
      });
    },

    create: function(selectElement) {
      var $originalSelect = $(selectElement);
      if ($originalSelect.parent().hasClass('ui-select')) return;

      var customSelectHtml = `
            <div class="ui-select-toggle">
                <span></span>
                ${AdminUI.icons.arrow}
            </div>
            <ul class="ui-select-menu" style="display: none;"></ul>
        `;

      $originalSelect.wrap('<div class="ui-select"></div>');
      var $container = $originalSelect.parent();
      $container.append(customSelectHtml);
      $originalSelect.hide();

      this.update(selectElement);
      this._bindEvents($container);
    },

    update: function(selector) {
      var self = this;
      $(selector).each(function() {
        var $originalSelect = $(this);
        var $container = $originalSelect.closest('.ui-select');
        if (!$container.length) return;

        var $menu = $container.find('.ui-select-menu');
        var $toggleText = $container.find('.ui-select-toggle span');

        var optionsHtml = '';
        $originalSelect.find('option').each(function() {
          var $option = $(this);
          optionsHtml += '<li class="ui-select-option" data-value="' + $option.val() + '">' + $option.text() + '</li>';
        });
        $menu.html(optionsHtml);

        var selectedText = $originalSelect.find('option:selected').text();
        $toggleText.text(selectedText);

        self._updateSelectedOptionClass($container);
      });
    },

    _bindEvents: function($container) {
      var $originalSelect = $container.find('select');
      var $toggle = $container.find('.ui-select-toggle');
      var $menu = $container.find('.ui-select-menu');

      $toggle.on('click', function(e) {
        e.stopPropagation();
        $('.ui-select.is-open').not($container).removeClass('is-open').find('.ui-select-menu').hide();
        $menu.toggle();
        $container.toggleClass('is-open');
      });

      $menu.on('click', '.ui-select-option', function() {
        var $option = $(this);
        var value = $option.data('value');
        var text = $option.text();
        $toggle.find('span').text(text);
        $originalSelect.val(value).trigger('change');
        $menu.hide();
        $container.removeClass('is-open');
        $menu.find('.ui-select-option.is-selected').removeClass('is-selected');
        $option.addClass('is-selected');
      });
    },

    _updateSelectedOptionClass: function($container) {
      var selectedValue = $container.find('select').val();
      var $menu = $container.find('.ui-select-menu');
      $menu.find('.is-selected').removeClass('is-selected');
      $menu.find('.ui-select-option[data-value="' + selectedValue + '"]').addClass('is-selected');
    }
  };
  // --- 模块: Dynamic Form,当container为空时返回html ---
  AdminUI.form = {
    render: function(container, fields, formType, data, withStatic) {
      var formHtml = '';
      data = data || {};

      fields.forEach(function(field) {
        if (formType && formType === 'search' && !field.search) {
          return;
        }
        if (field.hide && formType) {
          if (field.hide.indexOf(formType) >= 0 || field.hide === 'all') {
            return;
          }
        }
        var prop = field.prop;
        var value = data[prop];
        if (value === undefined || value === null) {
          if (formType === 'search') {
            value = '';
          } else if (field.default !== undefined) {
            value = field.default;
          } else {
            value = '';
          }
        }
        var label = field.label || prop;
        var inputConfig = field.input || { type: 'text' };
        var info = field.info || '';

        formHtml += `<div class="ui-form-item">`;
        formHtml += `<label for="${prop}" class="form-label">${label} ${info}</label>`;

        // 静态显示值
        if (withStatic) {
          var staticValueText = value;
          if (inputConfig.type === 'select' || inputConfig.type === 'radio') {
            var selectedOpt = inputConfig.options.find(o => o.val == value);
            staticValueText = selectedOpt ? selectedOpt.key : value;
          } else if (inputConfig.type === 'pwd') {
            staticValueText = '******';
          }
          formHtml += `<p id="static-${prop}" class="form-control-static">${staticValueText}</p>`;
        }

        // 编辑控件
        formHtml += `<div class="form-control-edit">`;

        switch (inputConfig.type) {
          case 'select':
            formHtml += `<select id="${prop}" data-ui-select>`;
            inputConfig.options.forEach(opt => {
              var selected = opt.val == value ? ' selected' : '';
              formHtml += `<option value="${opt.val}"${selected}>${opt.key}</option>`;
            });
            formHtml += `</select>`;
            break;

          case 'radio':
            inputConfig.options.forEach(opt => {
              var checked = opt.val == value ? ' checked' : '';
              formHtml += `
                              <label class="ui-radio">
                                  <input type="radio" name="${prop}" value="${opt.val}"${checked}>
                                  <span class="circle"></span>
                                  ${opt.key}
                              </label>
                          `;
            });
            break;

          case 'textarea':
            formHtml += `<textarea id="${prop}" class="ui-textarea">${value}</textarea>`;
            break;

          case 'datetime':
            var picker = (formType === 'search') ? 'data-ui-daterangepicker' : 'data-ui-datepicker';
            formHtml += `<input type="text" id="${prop}" class="ui-input" ${picker} value="${value}">`;
            break;

          case 'rmb':
            formHtml += `<input type="number" id="${prop}" class="ui-input" step="0.01" min="0" value="${value}">`;
            break;

          case 'pwd':
            formHtml += `<input type="password" id="${prop}" class="ui-input" value="${value}">`;
            break;

          case 'int':
            formHtml += `<input type="number" id="${prop}" class="ui-input"
                          step="1" value="${value}">`;
            break;

          default: // text
            formHtml += `<input type="text" id="${prop}" class="ui-input" value="${value}">`;
        }

        formHtml += `</div></div>`;
      });

      if (!container) {
        return formHtml;
      }

      container.html(formHtml);

      // 初始化UI组件
      AdminUI.update();
    },
    //获取form值,如果有schema则会进行类型转换
    getValues: function(containerSelector, schema, skipEmpty) {
      var values = {};
      $(containerSelector).find('.ui-form-item').each(function() {
        var $item = $(this);
        var $input = $item.find('input, select, textarea');
        if (!$input) {
          return;
        }
        var prop = $input.attr('id');
        var v = $input.val();
        if (v === '' && skipEmpty) {
          return;
        }
        if ($input.is('input[type="radio"]')) {
          v = $item.find('input[type="radio"]:checked').val();
        }
        if (schema) {
          for (let i = 0, len = schema.length; i < len; i++) {
            var one = schema[i];
            if (one.prop !== prop) {
              continue;
            }
            if (one.type === 'int') {
              if (!one.input || one.input.type !== 'datetime') {
                v = parseInt(v);
              }
            } else if (one.type === 'float') {
              v = parseFloat(v);
            } else if (one.type === 'array' || one.type === 'json') {
              if (!v) {
                return;
              }
              try {
                v = JSON.parse(v);
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
        if (v !== undefined && !Number.isNaN(v)) {
          values[prop] = v;
        }
      });
      return values;
    }
  };
  // --- 模块: PageNav 分页 ---
  AdminUI.pageNav = {
    init: function(selector, options) {
      var $container = $(selector);
      if (!$container.length || !options || !options.totalPages) return;
      $container.off('click', 'a');
      $container.off('click', '.js-page-jump');
      var defaults = {
        currentPage: 1,
        totalPages: 1,
        visiblePages: 7,
        onPageChange: function() {}
      };
      var settings = $.extend({}, defaults, options);

      if (settings.totalPages <= 1) {
        $container.empty();
        return;
      }

      var html = this._buildHTML(settings);
      $container.html(html);
      this._bindEvents($container, settings);
    },
    _buildMobileHTML: function(currentPage, totalPages, settings) {
      var html = '<ul class="ui-pagination-nav">';
      html += '<li><a href="#" class="prev-page' + (currentPage === 1 ? ' disabled' : '') + '" data-page="' + (currentPage - 1) + '">上一页</a></li>';
      html += '<li><span class="active">' + currentPage + '/' + totalPages + '</span></li>';
      html += '<li><a href="#" class="next-page' + (currentPage === totalPages ? ' disabled' : '') + '" data-page="' + (currentPage + 1) + '">下一页</a></li>';
      html += '</ul>';

      html += '<div class="ui-pagination-jump">' + '<input type="number" min="1" max="' + totalPages + '" placeholder="页" class="ui-input" value="' + currentPage + '">' + '<button class="ui-button primary js-page-jump">跳转</button>' + '</div>';

      if (settings.totalItems) {
        html = '<div class="ui-pagination-info">共 ' + settings.totalItems + ' 条记录</div>' + html;
      }

      return html;
    },
    _buildHTML: function(settings) {
      var cp = settings.currentPage;
      var total = settings.totalPages;
      var vp = settings.visiblePages;

      if ($(window).width() <= 768) {
        return this._buildMobileHTML(cp, total, settings);
      }

      var navHtml = '<ul class="ui-pagination-nav">';
      navHtml += '<li><a href="#" class="prev-page' + (cp === 1 ? ' disabled' : '') + '" data-page="' + (cp - 1) + '">上一页</a></li>';

      var pages = this._calculatePages(cp, total, vp);

      for (var i = 0; i < pages.length; i++) {
        var page = pages[i];
        if (page === '...') {
          navHtml += '<li><span class="ellipsis">...</span></li>';
        } else if (page === cp) {
          navHtml += '<li><span class="active">' + page + '</span></li>';
        } else {
          navHtml += '<li><a href="#" data-page="' + page + '">' + page + '</a></li>';
        }
      }

      navHtml += '<li><a href="#" class="next-page' + (cp === total ? ' disabled' : '') + '" data-page="' + (cp + 1) + '">下一页</a></li>';
      navHtml += '</ul>';

      var fullHtml = '';
      if (settings.totalItems) {
        fullHtml += '<div class="ui-pagination-info">共 ' + settings.totalItems + ' 条记录</div>';
      }
      fullHtml += '<div class="ui-pagination-nav-container">' + navHtml + '</div>';

      return fullHtml;
    },

    _calculatePages: function(currentPage, totalPages, visiblePages) {
      if (totalPages <= visiblePages) {
        var pages = [];
        for (var i = 1; i <= totalPages; i++) { pages.push(i); }
        return pages;
      }

      var pagesToShow = [];
      var sideWidth = Math.floor((visiblePages - 3) / 2);
      var leftWidth = sideWidth;
      var rightWidth = visiblePages - 3 - leftWidth;

      pagesToShow.push(1);

      if (currentPage > 2 + leftWidth) {
        pagesToShow.push('...');
      }

      var start = Math.max(2, currentPage - leftWidth);
      var end = Math.min(totalPages - 1, currentPage + rightWidth);

      if (currentPage - 1 <= leftWidth) {
        end = Math.min(totalPages - 1, visiblePages - 2);
      }

      if (totalPages - currentPage <= rightWidth) {
        start = Math.max(2, totalPages - visiblePages + 3);
      }

      for (var i = start; i <= end; i++) {
        pagesToShow.push(i);
      }

      if (totalPages - currentPage > 1 + rightWidth) {
        pagesToShow.push('...');
      }

      pagesToShow.push(totalPages);

      return pagesToShow;
    },

    _bindEvents: function($container, settings) {
      $container.on('click', 'a', function(e) {
        e.preventDefault();
        var $this = $(this);
        if ($this.hasClass('disabled') || $this.parent().hasClass('active')) {
          return;
        }
        var newPage = parseInt($this.data('page'), 10);
        if (newPage > 0 && newPage <= settings.totalPages) {
          settings.onPageChange(newPage);
        }
      });

      $container.on('click', '.js-page-jump', function() {
        var $input = $(this).prev('.ui-input');
        var newPage = parseInt($input.val(), 10);
        if (!isNaN(newPage) && newPage >= 1 && newPage <= settings.totalPages) {
          settings.onPageChange(newPage);
        }
      });
    }
  };
  AdminUI.multiSelect = {
    init: function() {
      var self = this;
      $('select[data-ui-multiselect]').each(function() {
        self.create(this);
      });

      $(document).on('click', function(e) {
        if (!$(e.target).closest('.ui-multiselect').length) {
          $('.ui-multiselect.is-open').removeClass('is-open').find('.ui-multiselect-menu').hide();
        }
      });
    },

    create: function(selectElement) {
      var $originalSelect = $(selectElement);
      if ($originalSelect.parent().hasClass('ui-multiselect')) return;

      var customSelectHtml = `
              <div class="ui-multiselect-toggle">
                  <div class="ui-multiselect-tags"></div>
                  ${AdminUI.icons.arrow}
              </div>
              <ul class="ui-multiselect-menu" style="display: none;"></ul>
          `;

      $originalSelect.wrap('<div class="ui-multiselect"></div>');
      var $container = $originalSelect.parent();
      $container.append(customSelectHtml);
      $originalSelect.hide();

      this.update(selectElement);
      this._bindEvents($container);
    },

    update: function(selector) {
      var self = this;
      $(selector).each(function() {
        var $originalSelect = $(this);
        var $container = $originalSelect.closest('.ui-multiselect');
        if (!$container.length) return;

        var $menu = $container.find('.ui-multiselect-menu');
        var $tagsContainer = $container.find('.ui-multiselect-tags');

        // 清空并重建菜单
        $menu.empty();
        $tagsContainer.empty();

        var selectedValues = $originalSelect.val() || [];
        if (!Array.isArray(selectedValues)) {
          selectedValues = selectedValues ? [selectedValues] : [];
        }

        $originalSelect.find('option').each(function() {
          var $option = $(this);
          var isSelected = selectedValues.includes($option.val());

          var $menuItem = $('<li class="ui-multiselect-option' + (isSelected ? ' is-selected' : '') +
            '" data-value="' + $option.val() + '">' +
            '<span class="ui-multiselect-option-checkbox"></span><span>' +
            $option.text() + '</span></li>');
          $menu.append($menuItem);
        });

        // 更新标签显示
        $originalSelect.find('option').each(function() {
          var $option = $(this);
          if (selectedValues.includes($option.val())) {
            self._addTag($container, $option.val(), $option.text());
          }
        });
      });
    },

    _bindEvents: function($container) {
      var $originalSelect = $container.find('select');
      var $toggle = $container.find('.ui-multiselect-toggle');
      var $menu = $container.find('.ui-multiselect-menu');

      $toggle.on('click', function(e) {
        if ($(e.target).closest('.ui-multiselect-tag-remove').length) {
          return;
        }
        e.stopPropagation();
        $('.ui-multiselect.is-open').not($container).removeClass('is-open').find('.ui-multiselect-menu').hide();
        $menu.toggle();
        $container.toggleClass('is-open');
      });

      $menu.on('click', '.ui-multiselect-option', function(e) {
        e.stopPropagation();
        var $option = $(this);
        var value = $option.data('value');
        var text = $option.find('span').last().text();
        var isSelected = $option.hasClass('is-selected');

        if (isSelected) {
          $option.removeClass('is-selected');
          AdminUI.multiSelect._removeTag($container, value);
        } else {
          $option.addClass('is-selected');
          AdminUI.multiSelect._addTag($container, value, text);
        }

        // 更新原始select的值
        var selectedValues = [];
        $menu.find('.is-selected').each(function() {
          selectedValues.push($(this).data('value'));
        });
        $originalSelect.val(selectedValues).trigger('change');
      });

      // 标签删除按钮事件
      $container.on('click', '.ui-multiselect-tag-remove', function(e) {
        e.stopPropagation();
        e.preventDefault(); // 阻止默认行为
        var $tag = $(this).parent();
        var value = $tag.data('value');

        AdminUI.multiSelect._removeTag($container, value);
        $menu.find('.ui-multiselect-option[data-value="' + value + '"]').removeClass('is-selected');

        // 更新原始select的值
        var selectedValues = [];
        $menu.find('.is-selected').each(function() {
          selectedValues.push($(this).data('value'));
        });
        $originalSelect.val(selectedValues).trigger('change');
      });
    },

    _addTag: function($container, value, text) {
      var $tagsContainer = $container.find('.ui-multiselect-tags');
      if ($tagsContainer.find('[data-value="' + value + '"]').length) return;

      var $tag = $('<div class="ui-multiselect-tag" data-value="' + value + '">' +
        text +
        '<span class="ui-multiselect-tag-remove">×</span></div>');
      $tagsContainer.append($tag);
    },

    _removeTag: function($container, value) {
      $container.find('.ui-multiselect-tag[data-value="' + value + '"]').remove();
    }
  };

  AdminUI.upload = {
    init: function(selector, options) {
      var self = this;
      var $container = $(selector);
      if (!$container.length) return;

      options = $.extend({
        url: '/upload', // 上传地址
        showProgress: false, // 是否显示上传进度
        accept: '*', // 接受的文件类型
        maxSize: 10 * 1024 * 1024, // 最大文件大小(10MB)
        onSuccess: function(response) {}, // 上传成功回调
        onError: function(error) {}, // 上传失败回调
        onProgress: function(percent) {} // 上传进度回调
      }, options);

      // 创建上传区域HTML
      var html = `
            <div class="ui-upload-area">
                <div class="ui-upload-icon">${AdminUI.icons.upload}</div>
                <div class="ui-upload-text">点击或拖拽文件到此处上传</div>
                <input type="file" class="ui-upload-input" ${options.accept !== '*' ? 'accept="' + options.accept + '"' : ''}>
            </div>
        `;
      $container.html(html);

      var $input = $container.find('.ui-upload-input');
      var $progress = $container.find('.ui-upload-text');
      var $area = $container.find('.ui-upload-area');

      // 点击触发文件选择
      $area.on('click', function(e) {
        if (!$(e.target).is('input')) {
          $input.trigger('click');
        }
      });

      // 文件选择处理
      $input.on('change', function() {
        var file = this.files[0];
        if (file) {
          self._validateAndUpload(file, options, $progress);
        }
      });

      // 拖拽处理
      $area.on('dragover', function(e) {
        e.preventDefault();
        $area.addClass('dragover');
      });

      $area.on('dragleave', function() {
        $area.removeClass('dragover');
      });

      $area.on('drop', function(e) {
        e.preventDefault();
        $area.removeClass('dragover');

        var file = e.originalEvent.dataTransfer.files[0];
        if (file) {
          self._validateAndUpload(file, options, $progress);
        }
      });
    },

    _validateAndUpload: function(file, options, $progress) {
      // 验证文件大小
      if (file.size > options.maxSize) {
        AdminUI.toast('文件大小不能超过 ' + (options.maxSize / 1024 / 1024) + 'MB', 'error');
        return;
      }

      // 验证文件类型
      if (options.accept !== '*' && !file.type.match(new RegExp(options.accept.replace('*', '.*')))) {
        AdminUI.toast('不支持的文件类型', 'error');
        return;
      }

      this._uploadFile(file, options, $progress);
    },

    _uploadFile: function(file, options, $text) {
      var formData = new FormData();
      formData.append('file', file);

      // 更新状态为上传中
      $text.text('上传中: 0%').removeClass('error');
      var xhr = new XMLHttpRequest();
      xhr.open('POST', options.url, true);

      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          var percent = Math.round((e.loaded / e.total) * 100);
          $text.text('上传中: ' + percent + '%');
          if (options.onProgress) {
            options.onProgress(percent);
          }
        }
      };

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          var response = xhr.responseText;
          $text.text('上传完成');
          if (options.onSuccess) {
            options.onSuccess(response);
          }
          // 3秒后恢复默认文本
          setTimeout(() => {
            $text.text('点击或拖拽文件到此处上传');
          }, 3000);
        } else {
          $text.text('上传失败').addClass('error');
          if (options.onError) {
            options.onError(xhr.responseText);
          }
        }
      };

      xhr.onerror = function() {
        $text.text('上传失败').addClass('error');
        if (options.onError) {
          options.onError({ message: '网络错误' });
        }
      };

      xhr.send(formData);
    }
  };
  // --- UI库初始化总入口 ---
  AdminUI.update = function() {
    this.datePicker.init();
    this.select.init();
    this.dateRangePicker.init();
    this.multiSelect.init();
  };
  AdminUI.init = function() {
    this.theme.init();
    this.menu.init();
    this.dropdown.init();
    AdminUI.update();
  };

  // 将AdminUI对象暴露到全局
  window.AdminUI = AdminUI;

  // 文档加载完成后执行初始化
  $(document).ready(function() {
    AdminUI.init();
  });

})(jQuery);