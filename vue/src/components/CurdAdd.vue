<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">新增{{oneTbTxt}}</div>
      </div>
      <el-form :model="updateObj" status-icon :rules="rules" label-width="100px">
        <el-form-item v-for="item in oneArr" :key="item.prop" :label="item.label">


          <!-- 这里处理input样式,逐个匹配input.type,暂未找到更合适的方法 -->
          <template v-if="item.input">
            <template v-if="(item.input.type == 'datetime')">
              <el-date-picker v-model="updateObj[item.prop]" type="datetime" value-format="timestamp" placeholder="选择日期时间"></el-date-picker>
            </template>
            <template v-else-if="(item.input.type == 'radio')">
              <el-radio v-for="radioItem in item.input.options" :key="radioItem.key" v-model="updateObj[item.prop]" :label="radioItem.val">{{radioItem.key}}</el-radio>
            </template>
            <template v-else>
              <el-input v-model="updateObj[item.prop]"></el-input>
            </template>
          </template>
          <template v-else>
            <el-input v-model="updateObj[item.prop]"></el-input>
          </template>
          <!-- 处理input样式结束  -->


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
    'oneTitle': '',
    'tbName': '',
    'tbTxt': '',
  },
  data() {
    return {
      'oneArr': [],
      'oneTbName': this.tbName,
      'oneTbTxt': this.tbTxt,
      'updateObj':{},
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
        if (titleOne.hide && titleOne.hide.indexOf('add') >= 0) {
          continue;
        }
        arr.push({ 'prop': titleOne.prop, 'label': titleOne.label, 'input': titleOne.input});
      }
      this.oneArr = arr;
    },
    showList(isRefresh) {
      this.$emit('showList',isRefresh);
    },
    addNew(){
      this.$kc.apiReq('/' + this.tbName + '/add', this.updateObj, (err, reData) => {
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