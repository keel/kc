<template>
  <el-row type="flex" justify="center" align="middle" style="height: 100%;">
    <el-col :xs="24" :sm="16" :md="12" :lg="8" :xl="6">
      <el-card class="box-card" style="width: 100%;background-color: #FFF;color: #9595b5;">
        <div slot="header" class="clearfix">
          <div style="text-align:center;width: 100%;">登录</div>
        </div>
        <el-form id="loginForm" :model="oneForm" status-icon :rules="rules" ref="oneForm" label-width="100px">
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
    return {
      'oneForm': {
        'loginPwd': '',
        'loginName': '',
      },
      'rules': {}
    };
  },

  mounted() {
    this.rules = {
      'loginPwd': [{
        'validator': (rule, value, callback) => {
          if (value === '') {
            return callback();
          }
          if (value.length < 6) {
            callback(new Error('请正确输入密码'));
          } else {
            if (this.oneForm.loginName !== '') {
              this.$refs.oneForm.validateField('loginName');
            }
            callback();
          }
        },
        'trigger': 'blur'
      }],
      'loginName': [{
        'validator': (rule, value, callback) => {
          if (value === '') {
            return callback();
          }
          if (value.length < 4) {
            callback(new Error('用户名长度不够'));
          } else {
            callback();
          }
        },
        'trigger': 'blur'
      }],
    };
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (!valid || !this.oneForm.loginPwd || !this.oneForm.loginName) {
          this.$alert('请检查输入', '登录失败');
          return false;
        }
        this.$kc.apiReq(this,'/login', { 'loginName': this.oneForm.loginName, 'loginPwd': this.$kc.codeTool().b64(Date.now() + '@' + this.oneForm.loginPwd) }, (err, reData) => {
          if (err) {
            this.$alert((reData ? reData : '请检查输入'), '登录失败');
            return;
          }
          const reJson = JSON.parse('' + reData);
          if ('' + reJson.code === '0') {
            this.$router.push('/');
          } else {
            this.$alert(reJson.data || '请检查输入', '登录失败');
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

