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
        <span style="float:left;padding-top: 8px;color: #dedefd;font-size: 12px;">第 {{(recordsFiltered>0)?(start+1):0}} 至 {{start+recordsFiltered}} 项, 共 {{recordsTotal}} 项 (本页 {{recordsFiltered}} 项)</span>
        <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pageNum"
        :page-sizes="[10, 25, 50, 100]"
        :page-size="pageSize"
        layout="sizes, prev, pager, next"
        :total="recordsTotal">
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
      'start':0,
      'pageNum': 1,
      'pageSize': 25,
      'recordsTotal':0,
      'recordsFiltered':0,
      'search': '',
    }
  },
  mounted() {
    this.showList();
  },
  'methods': {
    showList() {
      this.start = (this.pageNum - 1) * this.pageSize;
      const reqObj = {
        'draw': 1, //列表id,因为curd列表只有一个,这里写死
        'start': this.start,
        'length': this.pageSize,
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
        this.recordsTotal = reJson.recordsTotal;
        this.recordsFiltered = reJson.recordsFiltered;
        this.tableData = reJson.data;
      });
    },
    handleSizeChange(val) {
      console.log(`每页 ${val} 条`);
      this.pageSize = val;
      this.showList();
    },
    handleCurrentChange(val) {
      console.log(`当前页: ${val}`);
      this.pageNum = val;
      this.showList();
    }
  }
}
</script>