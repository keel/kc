<template>
  <el-card class="box-card">
    <div slot="header" class="clearfix">
      <div style="width: 100%;color:#dedefd;">权限配置</div>
    </div>
    <el-tree :data="treeData" show-checkbox node-key="id" :default-expanded-keys="[2, 3]" :default-checked-keys="[5]" :props="defaultProps">
    </el-tree>


    <div style="padding: 20px;">
      <slot></slot>
      <el-button type="danger" >保存权限配置</el-button>
      <el-button type="primary" >返回列表</el-button>
    </div>
  </el-card>
</template>
<script>
export default {
  'name': 'CurdList',
  data() {
    return {
      'treeData': [{
        id: 1,
        label: '一级 1',
        children: [{
          id: 4,
          label: '二级 1-1',
          children: [{
            id: 9,
            label: '三级 1-1-1'
          }, {
            id: 10,
            label: '三级 1-1-2'
          }]
        }]
      }, {
        id: 2,
        label: '一级 2',
        children: [{
          id: 5,
          label: '二级 2-1'
        }, {
          id: 6,
          label: '二级 2-2'
        }]
      }, {
        id: 3,
        label: '一级 3',
        children: [{
          id: 7,
          label: '二级 3-1'
        }, {
          id: 8,
          label: '二级 3-2'
        }]
      }],
      defaultProps: {
        children: 'children',
        label: 'label'
      }
    };
  }
}
</script>