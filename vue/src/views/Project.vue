<template>
  <el-card class="box-card">
    <div slot="header" class="clearfix">
      <div style="width: 100%;color:#dedefd;">表格数据</div>
    </div>
    <el-table
        :data="tableData"
        :row-style="rowStyle"
        :header-row-style="headerRowStyle"
        style="width: 100%">
        <el-table-column v-for="item in tableColName" :key="item.prop"
          :prop="item.prop"
          :label="item.label"
          :width="item.width">
        </el-table-column>
      </el-table>
      <div style="text-align:right;padding-top: 10px;">
        <el-pagination
          layout="prev, pager, next"
          :total="1000">
        </el-pagination>
      </div>

  </el-card>
</template>

<script>
  export default {
    data() {
      return {
        'rowStyle':function(){
          // console.log('rowIndex',row);
          // const bgColor = (row.rowIndex % 2 === 1) ? '#1B1C3B' : '#CCC';
          return {
            'background-color': '#2a2a4a',
            'border-color': '#9595b5',
            'color':'#dedefd',
          };
        },
        'headerRowStyle':function(){
          return {
            'color':'#f6f6fb',
          };
        },
        'tableColName':[
          {'prop':'date','label':'日期','width':180},
          {'prop':'name','label':'姓名','width':180},
          {'prop':'address','label':'地址Addr'},
        ],
        tableData: [{
          date: '2016-05-02',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1518 弄'
        }, {
          date: '2016-05-04',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1517 弄'
        }, {
          date: '2016-05-01',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1519 弄'
        }, {
          date: '2016-05-03',
          name: '王小虎',
          address: '上海市普陀区金沙江路 1516 弄'
        }]
      }
    }
  }
</script>
