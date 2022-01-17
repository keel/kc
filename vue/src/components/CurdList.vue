<template>
  <div>
    <div style="padding:20px">
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tbTxt }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tbTxt }}列表</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">{{ tbTxt }}列表</div>
      </div>
      <el-table :data="tableData" :row-style="rowStyle" :header-row-style="headerRowStyle" style="width: 100%">
        <el-table-column v-for="item in tableTitles" :key="item.prop" :prop="item.prop" :label="item.label" :width="item.width">
        </el-table-column>
      </el-table>
      <div style="text-align:right;padding-top: 10px;">
        <el-pagination layout="sizes, prev, pager, next" :total="1000">
        </el-pagination>
      </div>
    </el-card>
  </div>
</template>
<script>
export default {
  'name': 'CurdList',
  'props': {
    'tbName': '',
    'tbTxt': '',
  },
  data() {
    return {
      'tb': this.tbName,
      'rowStyle': function() {
        // console.log('rowIndex',row);
        // const bgColor = (row.rowIndex % 2 === 1) ? '#1B1C3B' : '#CCC';
        return {
          'background-color': '#2a2a4a',
          'border-color': '#9595b5',
          'color': '#dedefd',
        };
      },
      'headerRowStyle': {
        'color': '#f6f6fb',
      },
      'tableTitles': [],
      'tableData': [],
      'start': 0,
      'length': 20,
      'search': '',
    }
  },
  mounted() {
    this.showList();
  },
  'methods': {
    showList(pageNum, pageLen) {
      if (!pageNum || pageNum <= 0) {
        pageNum = 1;
      }
      if (!pageLen || pageLen <= 0) {
        pageLen = 20;
      }
      this.start = (pageNum - 1) * pageLen;
      this.length = pageLen;
      const reqObj = {
        'draw': 1, //列表id,因为curd列表只有一个,这里写死
        'start': this.start,
        'length': this.length,
        'search': this.search,
      };
      this.$kc.kPost('/' + this.tb + '/list', JSON.stringify(reqObj), (err, reData) => {
        if (err) {
          this.$kc.lerr('listERR:'+err);
          if (('' + err).indexOf('403') >= 0) {
            this.$router.push('/login');
            return;
          }
          this.$alert('列表数据获取处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('列表数据获取失败 ' + (reJson.data || ''), '列表错误');
          return;
        }
        this.tableTitles = reJson.tableTitles;
        this.tableData = reJson.data;
      });
    },
  }
}
</script>