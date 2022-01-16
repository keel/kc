<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">新增项目</div>
      </div>
      <el-form :model="addForm" status-icon :rules="rules" ref="addForm" label-width="100px">
        <el-form-item label="用户名" prop="loginName">
          <el-input v-model="addForm.loginName" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="loginPwd">
          <el-input v-model="addForm.loginPwd" autocomplete="off" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm('addForm')">登录</el-button>
          <el-button @click="resetForm('addForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script>
export default {
  'name': 'CurdAdd',
  data() {
    return {
      'addForm': {
        'loginPwd': '',
        'loginName': '',
      },
      'rules': {}
    };
  },
}
</script>