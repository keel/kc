<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">新增{{oneTbTxt}}</div>
      </div>
      <el-form :model="oneObj" status-icon :rules="rules" label-width="100px">
        <el-form-item v-for="item in oneArr" :key="item.prop" :label="item.label">
          <el-input v-model="oneObj[item.prop]"></el-input>
        </el-form-item>
      </el-form>
      <div style="padding-left: 100px;">
        <el-button type="info" @click="addNew()">新增</el-button>
        <el-button type="primary" @click="showList()">返回列表</el-button>
      </div>
    </el-card>
  </div>
</template>
<script>
export default {
  'name': 'CurdAdd',
  'props': {
    'oneObjIn': null,
    'oneTitle': '',
    'tbName': '',
    'tbTxt': '',
  },
  data() {
    return {
      'oneArr': [],
      'oneTbName': this.tbName,
      'oneTbTxt': this.tbTxt,
      'oneObj':{},
      'rules':{},
    };
  },
  'methods': {
    showAddProp(tableTitles) {
      if (!tableTitles) {
        return;
      }
      const arr = [];
      for (let i = 0, len = tableTitles.length; i < len; i++) {
        const titleOne = tableTitles[i];
        arr.push({ 'prop': titleOne.prop, 'label': titleOne.label});
      }
      this.oneArr = arr;
    },
    showList(isRefresh) {
      this.$emit('showList',isRefresh);
    },
    addNew(){
      this.$kc.apiReq('/' + this.tbName + '/add', this.oneObj, (err, reData) => {
        if (err) {
          this.$kc.lerr('addERR:' + err);
          if (('' + err).indexOf('403') >= 0) {
            this.$router.push('/login');
            return;
          }
          this.$alert('新增数据处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('新增数据失败 ' + (reJson.data || ''), '新增失败');
          return;
        }
        this.$msgok('新增成功!');
        this.showList(true);
      });
    }
  },
}
</script>