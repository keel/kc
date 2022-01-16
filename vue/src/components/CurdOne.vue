<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">显示项目</div>
      </div>
      <el-form :model="updateForm" status-icon :rules="rules" ref="updateForm" label-width="100px">
        <el-form-item label="用户名" prop="loginName">
          用户名
        </el-form-item>
        <el-form-item label="密码" prop="loginPwd">
          密码
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script>
export default {
  'name': 'CurdOne',
  data() {
    return {
      'updateForm': {
        'loginPwd': '',
        'loginName': '',
      },
      'rules': {}
    };
  },
  'methods':{

  }
}
</script>