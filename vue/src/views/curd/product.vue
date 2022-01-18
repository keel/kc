<template>
  <div>
    <div style="padding:20px">
      <el-breadcrumb separator-class="el-icon-arrow-right">
        <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tbTxt }}</el-breadcrumb-item>
        <el-breadcrumb-item>{{ tbTxt }}列表</el-breadcrumb-item>
      </el-breadcrumb>
      <div style="padding-top: 20px;">
        <el-button size="small" type="primary" @click="showAdd()">新建</el-button>
      </div>
    </div>
    <CurdList v-show="(this.showContent === 'list')" ref="curdList" :tbName="tbName" :tbTxt="tbTxt"  @showOne="showOne" @setTableTitles="setTableTitles" />
    <CurdOne v-show="(this.showContent === 'one')" ref="curdOne" :tbName="tbName" :tbTxt="tbTxt" :oneObjIn="oneObj" @showList="showListNow" />
    <CurdAdd v-show="(this.showContent === 'add')" ref="curdAdd" :tbName="tbName" :tbTxt="tbTxt" @showList="showListNow" />
  </div>
</template>
<script>
  import CurdList from '../../components/CurdList.vue';
  import CurdAdd from '../../components/CurdAdd.vue';
  import CurdOne from '../../components/CurdOne.vue';
  export default {
    'name': 'product',
    'components':{
      CurdList,
      CurdAdd,
      CurdOne,
    },
    'data':function () {
      return {
        'tbName':'product',
        'tbTxt':'产品',
        'showContent':'list',
        'oneObj':null,
        'tableTitles':null,
      };
    },
    'methods':{
      showOne(oneObj){
        // console.log('=====showOne:',oneObj);
        this.oneObj = oneObj;
        this.showContent = 'one';
        this.$refs.curdOne.showOneProp(this.oneObj,this.tableTitles);
      },
      showListNow(isRefresh){
        // console.log('=====showListNow',isRefresh);
        this.showContent = 'list';
        this.oneObj = null;
        if (isRefresh) {
          this.$refs.curdList.showList();
        }
      },
      showAdd(){
        this.$refs.curdAdd.showAddProp(this.tableTitles);
        this.showContent = 'add';
      },
      setTableTitles(tableTitles){
        this.tableTitles = tableTitles;
      }
    }
  }
</script>