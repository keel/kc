<template>
  <div>
    <div style="padding:20px">
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tbTxt }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <el-card v-show="(showContent === 'list')" class="box-card">
      <el-select v-model="searchKey" placeholder="查询字段">
        <el-option v-for="searchItem in searchArr" :key="searchItem.key" :label="searchItem.label" :value="searchItem.key"></el-option>
      </el-select>
      <el-input placeholder="请输入查询内容" v-model="searchInput"></el-input>
      [#{inputTime]
      <el-date-picker v-model="input_time" placeholder="时间段" type="daterange" start-placeholder="开始日期" unlink-panels="unlink-panels" value-format="yyyy-MM-dd" end-placeholder="结束日期" style="width: 230px; margin-left: 20px"></el-date-picker>
      [#}inputTime]
      <el-button size="small" type="info" :loading="searchLoading" @click="doSearch()">查询</el-button>
      <el-button size="small" type="danger" @click="showAdd()">新建</el-button>
      [#{downCsv]<el-button size="small" type="info" @click="downCsv()">导出</el-button>[#}downCsv]
    </el-card>
    <CurdList v-show="(showContent === 'list')" ref="curdList" :tbName="tbName" :tbTxt="tbTxt" @showOne="showOne" @setTableTitles="setTableTitles">[#listSlot]</CurdList>
    <CurdOne v-show="(showContent === 'one')" ref="curdOne" :tbName="tbName" :tbTxt="tbTxt" @setOneParas="setOneParas" @showList="showListNow">[#oneSlot]</CurdOne>
    <CurdAdd v-show="(showContent === 'add')" ref="curdAdd" :tbName="tbName" :tbTxt="tbTxt" @showList="showListNow">[#addSlot]</CurdAdd>
  </div>
</template>
<script>
import CurdList from '../components/CurdList.vue';
import CurdAdd from '../components/CurdAdd.vue';
import CurdOne from '../components/CurdOne.vue';
export default {
  'name': '[#tb]',
  'components': {
    CurdList,
    CurdAdd,
    CurdOne,
  },
  'data': function() {
    return {
      'tbName': '[#tb]',
      'tbTxt': '[#tbName]',
      'showContent': 'list',
      'tableTitles': null,
      'searchInput': '',
      'searchKey': '',
      'input_time': null,
      'searchArr': [],
      'searchLoading': false,
      'oneId':null,
      'oneParas':{},//保存CurdOne回传的其他参数
    };
  },
  'methods': {
    showOne(id) {
      this.oneId = id;
      this.showContent = 'one';
      this.$refs.curdOne.showOneProp(id, this.tableTitles);
    },
    showListNow(isRefresh) {
      this.showContent = 'list';
      if (isRefresh) {
        this.$refs.curdList.showList();
      }
    },
    showAdd() {
      this.$refs.curdAdd.showAddProp(this.tableTitles, this.oneParas);
      this.showContent = 'add';
    },
    mkSearchObj() {
      let searchObj = {};
      let hasSearchVal = false;
      if (this.searchKey && this.searchInput) {
        searchObj[this.searchKey] = this.searchInput;
        hasSearchVal = true;
      }
      [#{inputTime]
      if (this.input_time) {
        searchObj.createTime = this.input_time; //直接定key为createTime
        hasSearchVal = true;
      }
      [#}inputTime]
      if (!hasSearchVal) {
        searchObj = null;
      }
      return searchObj;
    },
    [#{downCsv]
    downCsv() {
      const postUrl = this.tbName + '/csv/' + this.tbTxt + '_' + (Date.now()) + '.csv';
      this.$kc.postDownFile(this.$refs.curdList.mkListReq(this.mkSearchObj()), postUrl);
    },
    [#}downCsv]
    doSearch() {
      this.showContent = 'list';
      this.searchLoading = true;
      const curSearchKey = this.searchKey;
      this.$refs.curdList.showList(this.mkSearchObj(), () => {
       this.searchLoading = false;
       this.searchKey = curSearchKey;
      });
    },
    setTableTitles(tableTitles) {
      this.tableTitles = tableTitles;
      this.searchArr = [];
      for (let i = 0, len = tableTitles.length; i < len; i++) {
        const one = tableTitles[i];
        if (one.search) {
          this.searchArr.push({ 'label': one.label, 'key': one.prop, 'type': one.search });
        }
      }
      if (!this.searchKey && this.searchArr.length > 0) {
        this.searchKey = this.searchArr[0].key;
      }
    },
    setOneParas(paras){
      if(!paras){
        return;
      }
      this.oneParas = paras;
    },

  }
}
</script>