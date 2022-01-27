<template>
  <div>
    <div style="padding:20px">
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tbTxt }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <el-card class="box-card">
      <el-row :gutter="10">
        <el-col :span="12">
          <el-input size="small" placeholder="请输入查询内容" v-model="searchInput" class="input-with-select">
            <el-select v-model="searchKey" slot="prepend" placeholder="查询字段">
              <el-option v-for="searchItem in searchArr" :key="searchItem.key" :label="searchItem.label" :value="searchItem.key"></el-option>
            </el-select>
            <el-button :loading="searchLoading" slot="append" icon="el-icon-search" @click="doSearch()"></el-button>
          </el-input>
        </el-col>
        <el-col :span="12">
          <el-button size="small" type="danger" @click="showAdd()">新建</el-button>
          <el-button size="small" type="info" @click="downCsv()">导出</el-button>
        </el-col>
      </el-row>
    </el-card>
    <CurdList v-show="(this.showContent === 'list')" ref="curdList" :tbName="tbName" :tbTxt="tbTxt" @showOne="showOne" @setTableTitles="setTableTitles" />
    <CurdOne v-show="(this.showContent === 'one')" ref="curdOne" :tbName="tbName" :tbTxt="tbTxt" @showList="showListNow" />
    <CurdAdd v-show="(this.showContent === 'add')" ref="curdAdd" :tbName="tbName" :tbTxt="tbTxt" @showList="showListNow" />
  </div>
</template>
<script>
import CurdList from '../../components/CurdList.vue';
import CurdAdd from '../../components/CurdAdd.vue';
import CurdOne from '../../components/CurdOne.vue';
export default {
  'name': 'product',
  'components': {
    CurdList,
    CurdAdd,
    CurdOne,
  },
  'data': function() {
    return {
      'tbName': 'product',
      'tbTxt': '产品',
      'showContent': 'list',
      'tableTitles': null,
      'searchInput': '',
      'searchKey': '',
      'searchArr': [],
      'searchLoading': false,
    };
  },
  'methods': {
    showOne(id) {
      // console.log('=====showOne:',id);
      this.showContent = 'one';
      this.$refs.curdOne.showOneProp(id, this.tableTitles);
    },
    showListNow(isRefresh) {
      // console.log('=====showListNow',isRefresh);
      this.showContent = 'list';
      if (isRefresh) {
        this.$refs.curdList.showList();
      }
    },
    showAdd() {
      this.$refs.curdAdd.showAddProp(this.tableTitles);
      this.showContent = 'add';
    },
    mkSearchObj() {
      let searchObj = {};
      if (this.searchKey && this.searchInput) {
        searchObj[this.searchKey] = this.searchInput;
      } else {
        searchObj = null;
      }
      return searchObj;
    },
    downCsv() {
      const postUrl = '/' + this.tbName + '/csv/' + this.tbTxt + '_' + (Date.now()) + '.csv';
      this.$kc.postDownFile(this.$refs.curdList.mkListReq(this.mkSearchObj()), postUrl);
    },
    doSearch() {
      this.showContent = 'list';
      this.searchLoading = true;
      this.$refs.curdList.showList(this.mkSearchObj(), () => { this.searchLoading = false; });
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
      if (this.searchArr.length > 0) {
        this.searchKey = this.searchArr[0].key;
      }
    }
  }
}
</script>
<style>
.el-select .el-input {
  width: 100px;
}

.el-icon-search,
.el-input-group__prepend div.el-select .el-input__inner,
.el-select-dropdown__item.selected,
.el-select-dropdown__item.hover,
.el-input-group__append,
.el-input-group__prepend {
  color: #FFF;
}
</style>