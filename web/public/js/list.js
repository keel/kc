// 页面特定JS
$(document).ready(function() {

  var tb = $('#tb').val();
  console.log('tb', tb);

  var state = {
    init: false,
    currentPage: 1,
    itemsPerPage: 3, // 为了演示效果，每页显示3条
    tableData: AdminUI.mockData.users, // 完整的模拟数据
    tableSchema: {
      'name': '用户列表',
      'col_id': 'id',
      'link_col': 'username',
      'cols': [{
          "prop": "id",
          "label": "id",
          "search": "int",
          "hide": 'all',
        }, {
          "prop": "username",
          "label": "用户名",
          "default": "",
          "search": "string",
          "toOne": 1,
        },
        {
          "prop": "email",
          "label": "邮箱",
          "default": "",
          "search": "string",
        },
        {
          "prop": "role",
          "label": "角色",
          "default": "",
          // "hide": "list",
          'search': 'select',
          'input': {
            'type': 'select',
            'data': [
              { val: 'Admin', label: '管理员' },
              { val: 'Editor', label: '编辑' },
              { val: 'Viewer', label: '查看者' },
            ]
          }
        },
        {
          "prop": "status",
          "label": "状态",
          "default": "",
          'search': 'select',
          "input": {
            "type": "select",
            'data': [
              { val: 'Active', label: 'Active' },
              { val: 'Inactive', label: 'Inactive' },
              { val: 'Banned', label: 'Banned' },
            ]
          },
          // "hide": "list"
        },
        {
          "prop": "created_at",
          "label": "创建时间",
          "default": "",
          "search": "datetime",
          "input": {
            "type": "datetime",
          },
          // "hide": "list"
        },
      ]
    }
  };

  function renderSearch(tableSchema) {
    var str = '';
    for (let i = 0, len = tableSchema.cols.length; i < len; i++) {
      var one = tableSchema.cols[i];
      if (!one.search) {
        continue;
      }
      str += '<div class="ui-form-item" style="margin: 0;"><label>' + one.label + '</label>';
      if (one.search === 'int') {
        str += '<input id="search_' + one.prop + '" name="search_' + one.prop + '" type="number" class="ui-input" placeholder="输入' + one.label + '">';
      } else if (one.search === 'select') {
        str += '<select id="search_' + one.prop + '" name="search_' + one.prop + '"  class="ui-input" data-ui-select>';
        for (let j = 0, len = one.input.data.length; j < len; j++) {
          var vOne = one.input.data[j];
          str += '<option value="' + vOne.val + '">' + vOne.label + '</option>';
        }
        str += '</select>';
      } else if (one.search === 'datetime') {
        str += '<input id="search_' + one.prop + '" name="search_' + one.prop + '" type="text" class="ui-input" placeholder="选择日期范围" data-ui-daterangepicker />';
      } else {
        str += '<input id="search_' + one.prop + '" name="search_' + one.prop + '" type="text" class="ui-input" placeholder="输入' + one.label + '">';
      }
      str += '</div>';
    }
    $('#tableSearch').html(str);


    AdminUI.datePicker.init();
    AdminUI.select.init();
    AdminUI.dateRangePicker.init();
  }

  function renderTableAndPagination(page) {
    state.currentPage = page || 1;

    // 模拟加载动画
    AdminUI.loading.show('#user-list-container');



    // 模拟AJAX延迟
    setTimeout(function() {
      var tableData = state.tableData;
      var tableSchema = state.tableSchema;
      if (!state.init) {
        state.init = true;
        // $('#tableTitle').text(tableSchema.name);
        renderSearch(tableSchema);
      }

      var start = (state.currentPage - 1) * state.itemsPerPage;
      var end = start + state.itemsPerPage;
      var pageData = tableData.slice(start, end);
      var tableHead = '<table class="ui-table" id="list-table"> <thead> <tr> ';
      for (let i = 0, len = tableSchema.cols.length; i < len; i++) {
        var one = tableSchema.cols[i];
        if (one.hide && (one.hide.indexOf('list') >= 0 || one.hide.indexOf('all') >= 0)) {
          continue;
        }
        tableHead += '<th>' + one.label + '</th>';
      }

      tableHead += '</tr> </thead> <tbody>';

      // 渲染表格
      var tableBody = '';
      for (var i = 0; i < pageData.length; i++) {
        tableBody += '<tr>';
        var pData = pageData[i];

        for (let j = 0, len = tableSchema.cols.length; j < len; j++) {
          var sOne = tableSchema.cols[j];
          if (sOne.hide && (sOne.hide.indexOf('list') >= 0 || sOne.hide.indexOf('all') >= 0)) {
            continue;
          }
          if (sOne.toOne) {
            tableBody += '<td><a href="' + tb + '/detail/' + pData[tableSchema.col_id] + '">' + pData[sOne.prop] + '</a></td>';
            continue;
          }
          tableBody += '<td>' + pData[sOne.prop] + '</td>';
        }
        tableBody += '</tr>';
      }
      $('#listTable').html(tableHead + tableBody + '</tbody></table>');

      // 渲染分页
      AdminUI.pageNav.init('#pagination-container', {
        currentPage: state.currentPage,
        totalPages: Math.ceil(tableData.length / state.itemsPerPage),
        totalItems: tableData.length,
        onPageChange: function(newPage) {
          // 当点击分页按钮时，此回调函数被触发
          renderTableAndPagination(newPage);
        }
      });


      // 隐藏加载动画
      AdminUI.loading.hide('#user-list-container');

    }, 300); // 模拟网络延迟
  }

  renderTableAndPagination();

  $('#search-btn').on('click', renderTableAndPagination); // 模拟查询

});