// 页面特定JS
$(document).ready(function() {

  var tb = $('#tb').val();

  var state = {
    init: false,
    currentPage: 1,
    itemsPerPage: 3, // 为了演示效果，每页显示3条
    recordsTotal: 0,
    recordsFiltered: 0,
    col_id: 0,
    tableData: AdminUI.mockData.users, // 完整的模拟数据
    tableSchema: [],
    isSearch:false,
  };

  function renderSearch(tableSchema) {
    AdminUI.form.render($('#tableSearch'), tableSchema,'search');
  }

  function renderTableAndPagination() {
    // state.currentPage = page || 1;


    var pageData = state.tableData;
    var tableSchema = state.tableSchema;
    if (!state.init) {
      state.init = true;
      // $('#tableTitle').text(tableSchema.name);
      renderSearch(tableSchema);
    }

    // var start = (state.currentPage - 1) * state.itemsPerPage;
    // var end = start + state.itemsPerPage;
    // var pageData = tableData.slice(start, end);
    var tableHead = '<table class="ui-table" id="list-table"> <thead> <tr> ';
    for (let i = 0, len = tableSchema.length; i < len; i++) {
      var one = tableSchema[i];
      if (one.hide && (one.hide.indexOf('list') >= 0 || one.hide.indexOf('all') >= 0)) {
        continue;
      }
      tableHead += '<th>' + one.label + '</th>';
    }

    tableHead += '</tr> </thead> <tbody>';

    // 渲染表格
    var tableBody = '';
    if (pageData.length <= 0) {
      tableBody = '<tr><td colspan="' + tableSchema.length + '"><div style="text-align:center;padding:5vw;">暂无数据</td></tr>';
    } else {
      for (var i = 0; i < pageData.length; i++) {
        tableBody += '<tr>';
        var pData = pageData[i];

        for (let j = 0, len = tableSchema.length; j < len; j++) {
          var sOne = tableSchema[j];
          if (sOne.hide && (sOne.hide.indexOf('list') >= 0 || sOne.hide.indexOf('all') >= 0)) {
            continue;
          }
          if (sOne.toOne) {
            tableBody += '<td><a href="' + tb + '/' + pData[state.col_id] + '">' + pData[sOne.prop] + '</a></td>';
            continue;
          }
          tableBody += '<td>' + pData[sOne.prop] + '</td>';
        }
        tableBody += '</tr>';
      }
    }
    $('#listTable').html(tableHead + tableBody + '</tbody></table>');

    // 渲染分页
    AdminUI.pageNav.init('#pagination-container', {
      currentPage: state.currentPage,
      totalPages: Math.ceil(state.recordsTotal / state.itemsPerPage),
      totalItems: state.recordsTotal,
      onPageChange: function(newPage) {
        // 当点击分页按钮时，此回调函数被触发
        state.currentPage = newPage;
        showList();
      }
    });


  }

  function showList() {

    // 模拟加载动画
    AdminUI.loading.show('#user-list-container');
    var reqObj = { 'start': (state.currentPage - 1) * state.itemsPerPage, 'length': state.itemsPerPage };
    if (state.isSearch) {
      const paras = AdminUI.form.getValues('#tableSearch',state.tableSchema,true);
      reqObj.search = paras;
    }
    // var searchVal =
    window.kc.jPost(tb + '/list', reqObj, function(err, re) {
      AdminUI.loading.hide('#user-list-container');
      if (err) {
        console.error(err);
        return;
      }
      if (re.code !== 0) {
        console.log('拉取list数据错误');
        return;
      }
      state.recordsTotal = re.recordsTotal;
      state.recordsFiltered = re.recordsFiltered;
      state.col_id = re.col_id;
      state.tableSchema = re.tableTitles;
      state.tableData = re.data;

      renderTableAndPagination();
    });
  }

  showList();

  function showAdd() {
    function formSubmit() {
      var formData = AdminUI.form.getValues('#addWin', state.tableSchema);
      window.kc.jPost(tb + '/add', formData, function(err, re) {
        if (err) {
          console.error(err);
          return;
        }
        if (!re || re.code !== 0) {
          AdminUI.popWin.alert('新增数据错误，请检查输入.'+(re?re.data:''),'新增失败');
          return;
        }
        AdminUI.toast('新增成功！', 'success');
        AdminUI.popWin.close();
        showList();
      });
    }

    // 显示弹窗
    AdminUI.popWin.custom({
      id:'addWin',
      title: '新增',
      content: AdminUI.form.render(null, state.tableSchema, 'add'),
      buttons: [
        { text: '取消', className: '' ,onClick:function(){
          AdminUI.popWin.close();
        }},
        { text: '确定', className: 'primary','data-loading-text':'处理中...', onClick: function () {
          formSubmit();
        }}
      ],
      closeOnBackdrop: false // 点击背景不关闭弹窗
    });
  }

  $('#search-btn').on('click', ()=>{
    state.isSearch = true;
    showList();
  });
  $('#add-btn').on('click', showAdd);

});