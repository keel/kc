<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">{{oneTbTxt}}详情</div>
      </div>
      <el-form :model="updateObj" status-icon :rules="rules" label-width="100px">
        <el-form-item v-for="item in oneArr" :key="item.prop" :label="item.label">
          <span v-show="!isUpdate">{{$kc.showValue(item.val, item.input)}}</span>
          <!-- 这里处理input样式,逐个匹配input.type,暂未找到更合适的方法 -->
          <template v-if="item.input">
            <template v-if="(item.input.type == 'datetime')">
              <el-date-picker v-show="isUpdate" @input="$forceUpdate()" v-model="updateObj[item.prop]" type="datetime" value-format="timestamp" placeholder="选择日期时间"></el-date-picker>
            </template>
            <template v-else-if="(item.input.type == 'radio')">
              <el-radio v-show="isUpdate" @input="$forceUpdate()" v-for="radioItem in item.input.options" :key="radioItem.key" v-model="updateObj[item.prop]" :label="radioItem.val">{{radioItem.key}}</el-radio>
            </template>
            <template v-else>
              <el-input v-show="isUpdate" @input="$forceUpdate()" v-model="updateObj[item.prop]"></el-input>
            </template>
          </template>
          <template v-else>
            <el-input v-show="isUpdate" @input="$forceUpdate()" v-model="updateObj[item.prop]"></el-input>
          </template>
          <!-- 处理input样式结束  -->
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
      'inputFormatMap': {
        'datetimeBAK': (val) => { //通过value-format定义解决了
          return new Date(val);
        },
        'rmb': (val) => {
          return this.$kc.priceIntShow(val);
        },
      },
      'inputFormatBackMap': {
        'datetimeBAK': (val) => { //通过value-format定义解决了
          return val.getTime();
        },
        'rmb': (val) => {
          return this.$kc.priceStrParse(val);
        },
      },
    };
  },
  'methods': {
    cloneOneObj(newOne) {
      this.updateObj = {};
      for (const i in newOne) {
        const thisOne = newOne[i];
        this.updateObj[i] = thisOne;
        if (this.inputMap[i]) {
          const inputFormater = this.inputFormatMap[this.inputMap[i].type];
          if (inputFormater) {
            this.updateObj[i] = inputFormater(thisOne);
          }
        }
      }
    },
    mkUpdateObj(){
      const out = {};
      for (const i in this.updateObj) {
        const thisOne = this.updateObj[i];
        out[i] = thisOne;
        if (this.inputMap[i]) {
          const inputFormater = this.inputFormatBackMap[this.inputMap[i].type];
          if (inputFormater) {
            out[i] = inputFormater(thisOne);
          }
        }
      }
      return out;
    },
    showOneProp(newOne, tableTitles) {
      if (!newOne || !tableTitles) {
        return;
      }
      const arr = [];
      for (let i = 0, len = tableTitles.length; i < len; i++) {
        const titleOne = tableTitles[i];
        arr.push({ 'prop': titleOne.prop, 'label': titleOne.label, 'val': newOne[titleOne.prop], 'input': titleOne.input });
        if (titleOne.input) {
          this.inputMap[titleOne.prop] = titleOne.input;
        }
      }
      this.oneArr = arr;
      this.cloneOneObj(newOne);
    },
    showList(isRefresh) {
      this.isUpdate = false;
      this.$emit('showList', isRefresh);
    },
    showUpdate() {
      this.isUpdate = true;
    },
    doUpdate() {
      this.$kc.apiReq('/' + this.tbName + '/update', this.mkUpdateObj(), (err, reData) => {
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
        this.showList(true);
      });
    },
    doDel() {
      this.$confirm('将删除此项数据, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$kc.apiReq('/' + this.tbName + '/del', { '_id': '' + this.updateObj._id }, (err, reData) => {
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
          this.$msgok('删除成功!');
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