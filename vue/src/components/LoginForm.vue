<template>
  <el-row type="flex" justify="center" align="middle" style="height: 100%;">
    <el-col :xs="24" :sm="12" :md="10" :lg="8" :xl="6">
      <el-card class="box-card" style="width: 100%;background-color: #FFF;">
        <div slot="header" class="clearfix">
          <div style="text-align:center;width: 100%;color:#000;">登录</div>
        </div>
        <el-form :model="oneForm" status-icon :rules="rules" ref="oneForm" label-width="100px">
          <el-form-item label="用户名" prop="loginName">
            <el-input v-model="oneForm.loginName" autocomplete="off"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="loginPwd">
            <el-input v-model="oneForm.loginPwd" autocomplete="off" show-password></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm('oneForm')">登录</el-button>
            <el-button @click="resetForm('oneForm')">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
  </el-row>
</template>
<script>
export default {
  'name': 'LoginForm',
  data() {
    var validatePass = (rule, value, callback) => {
      if (!value || value.length < 6) {
        callback(new Error('请正确输入密码'));
      } else {
        if (this.oneForm.loginName !== '') {
          this.$refs.oneForm.validateField('loginName');
        }
        callback();
      }
    };
    var validateLoginName = (rule, value, callback) => {
      if (!value || value.length < 4) {
        callback(new Error('用户名长度不够'));
      } else {
        callback();
      }
    };
    return {
      oneForm: {
        loginPwd: '',
        loginName: '',
      },
      rules: {
        loginPwd: [
          { validator: validatePass, trigger: 'blur' }
        ],
        loginName: [
          { validator: validateLoginName, trigger: 'blur' }
        ],
      }
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (!valid) {
          console.log('error valid!!');
          return false;
        }
        this.$kc.kPost('/login', { 'loginName': this.oneForm.loginName, 'loginPwd': this.oneForm.loginPwd }, (err, reData) => {
          if (err) {
            console.error('login Fail:' + reData);
            return;
          }
          const reJson = JSON.parse('' + reData);
          if (reJson.code === 0) {
            this.$router.push('/home');
          }else{
            console.error('login Fail:' + reData);
          }
        });
      });
    },
    resetForm(formName) {
      this.$refs[formName].resetFields();
    }
  }
}
</script>