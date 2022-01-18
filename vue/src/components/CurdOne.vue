<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">{{oneTbTxt}}详情</div>
      </div>
      <el-form :model="oneObj" status-icon :rules="rules" label-width="100px">
        <el-form-item v-for="item in oneArr" :key="item.prop" :label="item.label">
          <span v-show="!isUpdate">{{item.val}}</span>
          <el-input v-model="updateObj[item.prop]" v-show="isUpdate"></el-input>
        </el-form-item>
      </el-form>
      <div style="padding-left: 100px;">
        <el-button v-show="!isUpdate" type="info" @click="showUpdate()">修改</el-button>
        <el-button type="danger" @click="doDel()">删除</el-button>
        <el-button v-show="isUpdate" type="info" @click="doUpdate()">执行修改</el-button>
        <el-button v-show="isUpdate" type="info" @click="cancelUpdate()">取消修改</el-button>
        <el-button type="primary" @click="showList()">返回列表</el-button>
      </div>
    </el-card>
  </div>
</template>
<script>
export default {
  'name': 'CurdOne',
  'props': {
    'oneObjIn': null,
    'tbName': '',
    'tbTxt': '',
  },
  data() {
    return {
      'oneArr': [],
      'oneObj': this.oneObjIn,
      'updateObj': this.$kc.clone(this.oneObjIn),
      'rules': {},
      'isUpdate': false,
      'oneTbName': this.tbName,
      'oneTbTxt': this.tbTxt,
    };
  },
  'methods': {
    showOneProp(newOne, tableTitles) {
      if (newOne) {
        this.oneObj = newOne;
        this.updateObj = this.$kc.clone(this.oneObj);
      }
      if (!this.oneObj || !tableTitles) {
        return;
      }
      const arr = [];
      for (let i = 0, len = tableTitles.length; i < len; i++) {
        const titleOne = tableTitles[i];
        arr.push({ 'prop': titleOne.prop, 'label': titleOne.label, 'val': this.oneObj[titleOne.prop] });
      }
      this.oneArr = arr;
    },
    showList(isRefresh) {
      this.isUpdate = false;
      this.$emit('showList', isRefresh);
    },
    showUpdate() {
      this.updateObj = this.$kc.clone(this.oneObj);
      this.isUpdate = true;
    },
    doUpdate() {
      this.$kc.apiReq('/' + this.tbName + '/update', this.updateObj, (err, reData) => {
        if (err) {
          this.$kc.lerr('updateERR:' + err);
          if (('' + err).indexOf('403') >= 0) {
            this.$router.push('/login');
            return;
          }
          this.$alert('更新数据处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('更新数据失败 ' + (reJson.data || ''), '更新失败');
          return;
        }
        this.$alert('更新成功!');
        this.oneObj = this.updateObj;
      });
    },
    doDel() {
      this.$confirm('将删除此项数据, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$kc.apiReq('/' + this.tbName + '/del', { '_id': '' + this.oneObj._id }, (err, reData) => {
          if (err) {
            this.$kc.lerr('delERR:' + err);
            if (('' + err).indexOf('403') >= 0) {
              this.$router.push('/login');
              return;
            }
            this.$alert('删除数据处理失败', '数据错误');
            return;
          }
          const reJson = JSON.parse('' + reData);
          if (reJson.code !== 0) {
            this.$alert('删除数据失败 ' + (reJson.data || ''), '删除失败');
            return;
          }
          this.$message({ type: 'success', 'message': '删除成功!' });
          this.showList(true);
        });
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });

    },
    cancelUpdate() {
      this.isUpdate = false;
    },
  }
}
</script>