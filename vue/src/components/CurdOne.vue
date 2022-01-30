<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">{{oneTbTxt}}详情</div>
      </div>
      <el-form  v-loading="doOneLoading" :model="updateObj" status-icon :rules="rules" label-width="100px">
        <el-form-item v-for="item in oneArr" :key="item.prop" :label="item.label">
          <template v-if="(!item.hide || item.hide.indexOf('one')<0)">
            <span v-show="!isUpdate">{{$kc.showValue(item.val, item.input)}}</span>
          </template>
          <template v-if="(!item.hide || item.hide.indexOf('update')<0)">
            <!-- 这里处理input样式,逐个匹配input.type,暂未找到更合适的方法 -->
            <template v-if="item.input">
              <template v-if="(item.input.type == 'datetime')">
                <el-date-picker v-show="isUpdate" @input="$forceUpdate()" v-model="updateObj[item.prop]" type="datetime" value-format="timestamp" placeholder="选择日期时间"></el-date-picker>
              </template>
              <template v-else-if="(item.input.type == 'radio')">
                <el-radio v-show="isUpdate" @input="$forceUpdate()" v-for="radioItem in item.input.options" :key="radioItem.key" v-model="updateObj[item.prop]" :label="radioItem.val">{{radioItem.key}}</el-radio>
              </template>
              <template v-else-if="(item.input.type == 'pwd')">
                <el-input v-show="isUpdate" @input="$forceUpdate()" placeholder="请输入密码" v-model="updateObj[item.prop]" show-password></el-input>
              </template>
              <template v-else>
                <el-input v-show="isUpdate" @input="$forceUpdate()" v-model="updateObj[item.prop]"></el-input>
              </template>
            </template>
            <template v-else>
              <el-input v-show="isUpdate" @input="$forceUpdate()" v-model="updateObj[item.prop]"></el-input>
            </template>
            <!-- 处理input样式结束  -->
          </template>
        </el-form-item>
      </el-form>
      <div style="padding-left: 100px;">
        <slot></slot>
        <el-button v-show="isShowUpdate && (!isUpdate)" type="info" @click="showUpdate()">修改</el-button>
        <el-button v-show="isShowDel" type="danger" @click="doDel()" :loading="doDelLoading">删除</el-button>
        <el-button v-show="isUpdate" type="info" @click="doUpdate()" :loading="doUpdateLoading">执行修改</el-button>
        <el-button v-show="isUpdate" type="info" @click="cancelUpdate()">取消</el-button>
        <el-button type="primary" @click="showList()">返回列表</el-button>
      </div>
    </el-card>
  </div>
</template>
<script>
// import CurdInput from './CurdInput.vue';
//<CurdInput v-show="isUpdate" :inputConf="item.input" :value="updateObj[item.prop]" />
export default {
  'name': 'CurdOne',
  'props': ['tbName', 'tbTxt'],
  // 'components': {
  //   CurdInput
  // },
  data() {
    return {
      'oneArr': [],
      'updateObj': {},
      'rules': {},
      'inputMap':{},
      'isUpdate': false,
      'oneTbName': this.tbName,
      'oneTbTxt': this.tbTxt,
      'doUpdateLoading':false,
      'doDelLoading':false,
      'doOneLoading':false,
      'tableTitles':[],
      'needRefreshList':false,
      'isShowUpdate':false,
      'isShowDel':false,
    };
  },
  'methods': {
    showOneProp(id, tableTitles) {
      if (!id || !tableTitles) {
        return;
      }
      this.tableTitles = tableTitles;
      this.doOneLoading = true;
      this.$kc.kPost(this,' /' + this.tbName + '/one', { id }, (err, reData) => {
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
        //处理返回数据
        const arr = [];
        const newOne = reJson.data;
        for (let i = 0, len = tableTitles.length; i < len; i++) {
          const titleOne = tableTitles[i];
          if (titleOne.hide && (titleOne.hide.indexOf('all')>=0 ||(titleOne.hide.indexOf('one') >= 0 && titleOne.hide.indexOf('update') >= 0)) ) {
            continue;
          }
          arr.push({ 'prop': titleOne.prop, 'label': titleOne.label, 'val': newOne[titleOne.prop], 'input': titleOne.input, 'hide': titleOne.hide });
          if (titleOne.input) {
            this.inputMap[titleOne.prop] = titleOne.input;
          }
        }
        this.oneArr = arr;
        this.updateObj = this.$kc.mkUpdateObj(newOne,this.inputMap);
        this.isShowUpdate = reJson.showUpdate;
        this.isShowDel = reJson.showDel;
        if (reJson.paras) {
          this.$emit('setOneParas', reJson.paras);
        }
      });
    },
    showList(isRefresh) {
      this.isUpdate = false;
      this.$emit('showList', isRefresh || this.needRefreshList);
    },
    showUpdate() {
      this.isUpdate = true;
    },
    doUpdate() {
      this.doUpdateLoading = true;
      this.$kc.apiReq(this,'/' + this.tbName + '/update', this.$kc.backUpdateObj(this.updateObj, this.inputMap), (err, reData) => {
        this.doUpdateLoading = false;
        if (err) {
          this.$alert('更新数据处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('更新数据失败 ' + (reJson.data || ''), '更新失败');
          return;
        }
        this.$alert('更新成功!');
        this.showOneProp(this.updateObj._id,this.tableTitles);
        this.isUpdate = false;
        this.needRefreshList = true;
      });
    },
    doDel() {
      this.doDelLoading = true;
      this.$confirm('将删除此项数据, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$kc.apiReq(this,'/' + this.tbName + '/del', { '_id': '' + this.updateObj._id }, (err, reData) => {
          this.doDelLoading = false;
          if (err) {
            this.$alert('删除数据处理失败', '数据错误');
            return;
          }
          const reJson = JSON.parse('' + reData);
          if (reJson.code !== 0) {
            this.$alert('删除数据失败 ' + (reJson.data || ''), '删除失败');
            return;
          }
          this.$msgok('删除成功!');
          this.needRefreshList = true;
          this.showList(true);
        });
      }).catch(() => {
        this.doDelLoading = false;
        // this.$message({
        //   type: 'info',
        //   message: '已取消删除'
        // });
      });

    },
    cancelUpdate() {
      this.isUpdate = false;
    },
  }
}
</script>