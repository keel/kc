<!-- 暂废弃不用 -->
<template>
  <span>
    <template v-if="conf">
      <template v-if="(conf.type == 'datetime')">
        <el-date-picker v-model="val" type="datetime" placeholder="选择日期时间"></el-date-picker>
      </template>
      <template v-else-if="(conf.type == 'rmb')">
        <el-input v-model="val"></el-input>
      </template>
      <template v-else>
        <el-input v-model="val"></el-input>
      </template>
    </template>
    <template v-else>
      <el-input v-model="val"></el-input>
    </template>
  </span>
</template>
<script>
export default {
  'name': 'CurdInput',
  'props': ['inputConf','value'],
  data() {
    return {
      'conf': this.inputConf,
      'val':this.value,
      'dateVal':null,
    };
  },
  'methods':{
    updateVal(newVal){
      this.val = newVal;
    }
  }
};
</script>