// 同时适配图片列表和视频列表
$(document).ready(function () {

  var tb = $('#tb').val();

  var isImgs = !!$('#isImgs').val();
  var isVideos = !!$('#isVideos').val();

  var imgUrl = null;
  var videoUrl = null;

  var state = {
    init: false,
    currentPage: 1,
    itemsPerPage: 20,
    recordsTotal: 0,
    recordsFiltered: 0,
    col_id: 0,
    tableData: [],
    tableSchema: [],
    isSearch: false,
    imgs: [],
    isVideos: false // 新增视频标识
  };


  window.doDelImg = function () {
    var curObj = state.tableData[AdminUI.img.curIndex];
    if (AdminUI.img.curIndex < 0 || !curObj || undefined === curObj._id) {
      AdminUI.toast('错误的图片id', 'danger');
      return;
    }
    AdminUI.popWin.confirm('确认要删除吗?', () => {
      window.kc.jPost('../' + tb + '/del', { 'id': curObj._id }, function (err, re) {
        if (err) {
          console.error(err);
          return;
        }

        AdminUI.toast('删除成功', 'success');
        AdminUI.img.lightbox.remove();
        showList();
      });
    }, '删除确认');
  };

  function renderSearch(tableSchema) {
    AdminUI.form.render($('#tableSearch'), tableSchema, 'search');
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

    if (isImgs) {
      $('#listTable').html('<div id="imgContainer"></div>');
      AdminUI.img.init('#imgContainer', state.tableData, {
        picWidth: 150, // 可选，设置缩略图宽度
        showName: true, // 可选，是否显示图片名称
        'moreButtons': '<button id="del-img-btn" onclick="doDelImg()" class="ui-button">删除</button>',
      });

    } else if (isVideos) {
      // 视频列表处理
      $('#listTable').html('<div class="ui-video-grid"></div>');
      state.tableData.forEach(function (video, index) {
        var $videoItem = $(
          '<div class="ui-video-item" data-index="' + index + '">' +
          '   <div class="ui-video-thumb-container">' +
          '       <video class="ui-video-thumb" src="' + video.url + '"></video>' +
          '       <div class="ui-video-play-icon">▶</div>' +
          '   </div>' +
          '   <div class="ui-video-name">' + video.name + '</div>' +
          '</div>'
        );
        $('.ui-video-grid').append($videoItem);
        // 自动生成视频缩略图
        var videoElement = $videoItem.find('.ui-video-thumb')[0];
        videoElement.addEventListener('loadedmetadata', function () {
          this.currentTime = Math.min(1, this.duration / 2); // 取视频中间帧
        });
        videoElement.addEventListener('seeked', function () {
          var canvas = document.createElement('canvas');
          canvas.width = this.videoWidth;
          canvas.height = this.videoHeight;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
          $(this).parent().css('background-image', 'url(' + canvas.toDataURL() + ')');
          $(this).hide(); // 隐藏视频元素，只显示缩略图
        });
        // 点击视频跳转到视频URL
        $videoItem.on('click', function () {
          window.open(video.url, '_blank');
        });
      });
    } else {
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
            var val = pData[sOne.prop];
            if (sOne.input && sOne.input.type === 'datetime' && typeof val === 'number') {
              val = window.kc.timeFormat(val);
            }
            tableBody += '<td>' + val + '</td>';
          }
          tableBody += '</tr>';
        }
      }
      $('#listTable').html(tableHead + tableBody + '</tbody></table>');
    }

    // 渲染分页
    AdminUI.pageNav.init('#pagination-container', {
      currentPage: state.currentPage,
      totalPages: Math.ceil(state.recordsTotal / state.itemsPerPage),
      totalItems: state.recordsTotal,
      onPageChange: function (newPage) {
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
      const paras = AdminUI.form.getValues('#tableSearch', state.tableSchema, true);
      reqObj.search = paras;
    }
    // var searchVal =
    window.kc.jPost(tb + '/list', reqObj, function (err, re) {
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
      if (isImgs) {
        if (!imgUrl) {
          AdminUI.toast('请上传图片', 'danger');
          setTimeout(function () {
            AdminUI.removeLoading('.popOK');
          }, 100);
          return false; //不关闭弹窗
        } else {
          formData.url = imgUrl;
        }
      } else if (isVideos) {
        if (!videoUrl) {
          AdminUI.toast('请上传视频', 'danger');
          setTimeout(function () {
            AdminUI.removeLoading('.popOK');
          }, 100);
          return false;
        } else {
          formData.url = videoUrl;
        }
      }
      window.kc.jPost(tb + '/add', formData, function (err, re) {
        if (err) {
          console.error(err);
          return;
        }
        if (!re || re.code !== 0) {
          AdminUI.popWin.alert('新增数据错误，请检查输入.' + (re ? re.data : ''), '新增失败');
          setTimeout(function () {
            AdminUI.removeLoading('.popOK');
          }, 100);
          return;
        }
        AdminUI.toast('新增成功！', 'success');
        AdminUI.popWin.close();
        showList();
      });

      return false;
    }


    // 显示弹窗
    var schema = state.tableSchema;
    var appendHtml = '';
    if (isImgs) {
      imgUrl = null;
      schema = schema.filter(item => item.prop !== 'url');
      appendHtml = '<div id="upload-area"></div>';
    } else if (isVideos) {
      videoUrl = null;
      schema = schema.filter(item => item.prop !== 'url');
      appendHtml = '<div id="upload-area"></div>';
    }
    AdminUI.popWin.custom({
      id: 'addWin',
      title: '新增',
      content: '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">' + AdminUI.form.render(null, schema, 'add') + '</div>' + appendHtml,
      buttons: [{
        text: '取消',
        className: '',
        onClick: function () {
          AdminUI.popWin.close();
        }
      },
      {
        text: '确定',
        className: 'primary popOK',
        'data-loading-text': '处理中...',
        onClick: formSubmit,
      }
      ],
      closeOnBackdrop: false // 点击背景不关闭弹窗
    });
    if (isImgs) {
      AdminUI.upload.init('#upload-area', {
        url: 'upload/uploadImg',
        showProgress: true,
        accept: 'image/*',
        maxSize: 20 * 1024 * 1024, //20MB
        onSuccess: function (response) {
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
        onError: function (error) {
          console.error('上传失败', error);
          AdminUI.toast(error.message || '上传失败', 'danger');
        },
        onProgress: function (percent) {
          console.log('上传进度:', percent + '%');
        }
      });
    } else if (isVideos) {
      AdminUI.upload.init('#upload-area', {
        url: 'upload/uploadVideo',
        showProgress: true,
        accept: 'video/*',
        maxSize: 100 * 1024 * 1024, // 100MB
        onSuccess: function (response) {
          if (response.indexOf('{"code":-') >= 0) {
            console.error('上传失败', response);
            AdminUI.toast('上传失败', 'danger');
            return;
          }
          videoUrl = response;
          AdminUI.toast('视频上传成功', 'success');
          $('#upload-area').html(
            '<div><video src="' + videoUrl + '" style="max-height:180px;" controls></video></div>'
          );
        },
        onError: function (error) {
          AdminUI.toast(error.message || '上传失败', 'danger');
        }
      });
    }
  }

  $('#search-btn').on('click', () => {
    state.isSearch = true;
    showList();
  });
  $('#add-btn').on('click', showAdd);

});