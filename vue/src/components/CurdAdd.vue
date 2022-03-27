<template>
  <div>
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <div style="width: 100%;color:#dedefd;">新增{{oneTbTxt}}</div>
      </div>
      <el-form id="curdAdd" :model="updateObj" status-icon :rules="rules" label-width="190px">
        <el-form-item v-for="item in oneArr" :key="item.prop" :label="item.label+item.info">
          <!-- 这里处理input样式,逐个匹配input.type,暂未找到更合适的方法 -->
          <template v-if="item.input">
            <template v-if="(item.input.type == 'datetime')">
              <el-date-picker @input="$forceUpdate()" v-model="updateObj[item.prop]" type="datetime" value-format="timestamp" placeholder="选择日期时间"></el-date-picker>
            </template>
            <template v-else-if="(item.input.type == 'radio')">
              <el-radio @input="$forceUpdate()" v-for="radioItem in item.input.options" :key="radioItem.key" v-model="updateObj[item.prop]" :label="radioItem.val">{{radioItem.key}}</el-radio>
            </template>
            <template v-else-if="(item.input.type == 'multiSelect')">
              <el-select @input="$forceUpdate()" v-model="updateObj[item.prop]" multiple>
                <el-option v-for="item in (paras || {})[item.input.parasKey]" :key="item.val" :label="item.name" :value="item.val"></el-option>
              </el-select>
            </template>
            <template v-else-if="(item.input.type == 'select2')">
              <el-select @input="$forceUpdate()" :id="item.prop" v-model="updateObj[item.prop]" :multiple="!item.input.single" filterable remote placeholder="请输入拼音首字母" :remote-method="select2(item.prop)">
                <el-option v-for="a_item in arrMap[item.prop]" :key="a_item.value" :label="a_item.label" :value="a_item.value">
                </el-option>
              </el-select>
            </template>
            <template v-else>
              <el-input @input="$forceUpdate()" v-model="updateObj[item.prop]"></el-input>
            </template>
          </template>
          <template v-else>
            <el-input @input="$forceUpdate()" v-model="updateObj[item.prop]"></el-input>
          </template>
          <!-- 处理input样式结束  -->
        </el-form-item>
      </el-form>
      <div style="padding-left: 100px;">
        <slot></slot>
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
    'tbName': '',
    'tbTxt': '',
  },
  data() {
    return {
      'oneArr': [],
      'oneTbName': this.tbName,
      'oneTbTxt': this.tbTxt,
      'updateObj': {},
      'rules': {},
      'inputMap': {}, //为更多的input参数预留使用
      'arrMap': {},
      'vm': this,
      'paras': null,
    };
  },
  'methods': {
    showAddProp(tableTitles, oneParas) {
      if (!tableTitles) {
        return;
      }
      const needParas = {};
      const arr = [];
      for (let i = 0, len = tableTitles.length; i < len; i++) {
        const titleOne = tableTitles[i];
        if (titleOne.hide && titleOne.hide.indexOf('add') >= 0) {
          continue;
        }
        arr.push({ 'prop': titleOne.prop, 'label': titleOne.label, 'input': titleOne.input, 'info': (titleOne.info || '') });
        if (titleOne.input) {
          titleOne.input.vm = this;
          titleOne.input.prop = titleOne.prop;
          this.arrMap[titleOne.prop] = [];
          this.inputMap[titleOne.prop] = titleOne.input;
          if (titleOne.input.type === 'multiSelect' && titleOne.input.parasKey !== undefined) {
            if (!needParas['multiSelect']) {
              needParas.multiSelect = [];
            }
            needParas.multiSelect.push(titleOne.input.parasKey);
          }
        }
        if (titleOne.default !== undefined) {
          this.updateObj[titleOne.prop] = titleOne.default;
        }
      }
      this.oneArr = arr;
      if (!needParas || this.paras) {
        return;
      }
      //下面补充multiSelect备选值
      this.emp = function() {};
      if (oneParas) {
        const tmp = { 't': () => {} };
        for (const i in oneParas) {
          this.paras = oneParas;
          tmp.t(i);
          return;
        }
        this.$kc.kPost(this, ' /' + this.tbName + '/plusApi', { 'act': 'curdAdd', needParas }, (err, reData) => {
          if (err) {
            console.error('获取plusApi数据失败');
            return;
          }
          const reJson = JSON.parse('' + reData);
          if (reJson.code !== 0) {
            console.error('获取plusApi数据失败', reJson);
            return;
          }
          this.paras = reJson.data || {};
        });
      }
    },
    showList(isRefresh) {
      this.$emit('showList', isRefresh);
    },
    addNew() {
      this.$kc.apiReq(this, '/' + this.tbName + '/add', this.updateObj, (err, reData) => {
        if (err) {
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
    },
    select2(s2prop) {
      const vm = this;
      return function(query) {
        const inputObj = vm.inputMap[s2prop];
        if (query.length < inputObj.lessLetter) {
          return;
        }
        vm.$kc.kGet(vm, inputObj.url + query, (err, reData) => {
          if (err) {
            vm.$message.error('检索数据处理失败');
            return;
          }
          const reArr = JSON.parse('' + reData);
          vm.arrMap[inputObj.prop] = [];
          for (let i = 0, len = reArr.length; i < len; i++) {
            vm.arrMap[inputObj.prop].push({ 'label': reArr[i].name, 'value': reArr[i]._id });
          }
          vm.$forceUpdate();
        });
      }
    },
  },
}
</script>