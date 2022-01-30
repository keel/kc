<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">账号信息</div>
      </div>
      <el-form  v-loading="doOneLoading" :model="updateObj" status-icon :rules="rules" label-width="100px">
        <el-form-item label="账号名">
            <span v-show="!isUpdate">{{updateObj.name}}</span>
            <el-input v-show="isUpdate" v-model="updateObj.name"></el-input>
        </el-form-item>

        <el-form-item label="登录名">
            <span v-show="!isUpdate">{{updateObj.loginName}}</span>
            <el-input v-show="isUpdate" v-model="updateObj.loginName"></el-input>
        </el-form-item>

        <el-form-item label="登录密码">
            <span v-show="!isUpdate">******</span>
            <el-input v-show="isUpdate" @input="$forceUpdate()" placeholder="请输入密码" v-model="updateObj.loginPwd" show-password></el-input>
        </el-form-item>

        <el-form-item label="等级">
            <span v-show="!isUpdate">{{updateObj.level}}</span>
        </el-form-item>

        <el-form-item label="状态">
            <span v-show="!isUpdate">{{updateObj.state}}</span>
        </el-form-item>

        <el-form-item label="创建时间">
            <span v-show="!isUpdate">{{$kc.timeFormat(updateObj.createTime)}}</span>
        </el-form-item>


      </el-form>
      <div style="padding-left: 100px;">
        <el-button v-show="!isUpdate" type="info" @click="showUpdate()">修改</el-button>
        <el-button v-show="isUpdate" type="info" @click="doUpdate()" :loading="doUpdateLoading">执行修改</el-button>
        <el-button v-show="isUpdate" type="info" @click="cancelUpdate()">取消</el-button>
      </div>
    </el-card>
  </div>
</template>
<script>
export default {
  'name': 'profile',
  data() {
    return {
      'updateObj': {},
      'rules': {},
      'isUpdate': false,
      'oneTbName': 'cp',
      'doUpdateLoading':false,
      'doOneLoading':false,
    };
  },
  mounted(){
    this.showOneProp();
  },
  'methods': {
    showOneProp() {
      this.doOneLoading = true;
      this.$kc.kPost(this,' /profile/show', '{}', (err, reData) => {
        this.doOneLoading = false;
        if (err) {
          this.$alert('获取数据处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('获取数据失败 ' + (reJson.data || ''), '获取数据失败');
          return;
        }
        this.updateObj = reJson.data;
        this.updateObj.loginPwd = '';
      });
    },
    showUpdate() {
      this.isUpdate = true;
    },
    doUpdate() {
      this.doUpdateLoading = true;
      this.$kc.apiReq(this,'/profile/update', this.updateObj, (err, reData) => {
        this.doUpdateLoading = false;
        if (err) {
          this.$alert('更新数据处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('更新数据失败:' + (reJson.data || ''), '更新失败');
          return;
        }
        this.$alert('更新成功!');
        this.showOneProp();
        this.isUpdate = false;
        this.needRefreshList = true;
      });
    },
    cancelUpdate() {
      this.isUpdate = false;
    },
  }
}
</script>