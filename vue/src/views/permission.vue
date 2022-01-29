<template>
  <el-card class="box-card">
    <div slot="header" class="clearfix">
      <div style="width: 100%;color:#dedefd;">权限配置</div>
    </div>
    <el-tree ref="tree" :loading="treeLoading" :data="treeData" show-checkbox node-key="path" :default-checked-keys="checkedKeys" :props="defaultProps">
    </el-tree>
    <div style="padding: 20px;">
      <slot></slot>
      <el-button v-show="showUpdate" :loading="saveLoading" type="danger" @click="saveTree()">保存权限配置</el-button>
      <el-button type="primary" @click="$router.push('/cp')">返回列表</el-button>
    </div>
  </el-card>
</template>
<script>
export default {
  'name': 'CurdList',
  data() {
    return {
      'checkedKeys': [],
      'treeData': [],
      'defaultProps': {
        'children': 'subs',
        'label': 'name'
      },
      'treeLoading': false,
      'saveLoading': false,
      'showUpdate': false,
    };
  },
  mounted() {
    if (!this.$route.params.uid) {
      this.$router.push('/cp');
      return;
    }
    this.showTree();
  },
  'methods': {
    getFatherNode(fatherPath, tree, fatherName) {
      if (tree.subs[fatherPath]) {
        if (fatherName) {
          tree.subs[fatherPath].name = fatherName;
        }
        return tree.subs[fatherPath];
      }
      const pathPo = fatherPath.lastIndexOf('/');
      if (pathPo > 0) {
        const newFatherPath = fatherPath.substring(0, pathPo);
        const thisFatherPath = fatherPath.substring(pathPo + 1);
        const newFatherNode = this.getFatherNode(newFatherPath, tree);
        const myFatherNode = newFatherNode.subs[thisFatherPath];
        if (!myFatherNode.subs) {
          myFatherNode.subs = {};
        }
        return myFatherNode;
      }
      tree.subs[fatherPath] = { 'path': fatherPath, 'name': fatherName || fatherPath, 'subs': {} };
      return tree.subs[fatherPath];
    },
    mkTree(authMap) {
      const tree = { 'path': 'root', 'name': '根权限', 'index': 0, 'subs': {} };
      for (const path in authMap) {
        const node = authMap[path];
        node.path = path;
        let myPath = node.path;
        const pathPo = myPath.lastIndexOf('/');
        let fatherNode = tree;
        if (pathPo > 0) {
          const fatherPath = myPath.substring(0, pathPo);
          const fatherName = (node.name.indexOf('-')) ? node.name.substring(0, node.name.lastIndexOf('-')) : null;
          fatherNode = this.getFatherNode(fatherPath, tree, fatherName);
          myPath = myPath.substring(pathPo + 1);
        }
        if (!fatherNode.subs[myPath]) {
          fatherNode.subs[myPath] = node;
        } else {
          fatherNode.subs[myPath].check = node.check || 0;
        }
      }
      return tree;
    },
    treeToArr(tree, arr = [], checkArr = []) {
      if (!tree.subs) {
        return arr;
      }
      for (const i in tree.subs) {
        const node = tree.subs[i];
        const item = { 'path': node.path, 'name': node.name };
        arr.push(item);
        if (node.check) {
          checkArr.push(node.path);
        }
        if (!node.subs) {
          continue;
        }
        item['subs'] = [];
        this.treeToArr(node, item.subs, checkArr);
      }
      return arr;
    },
    showTree() {
      this.treeLoading = true;
      this.$kc.kPost(this,' ../cp/authMap', { 'uid': this.$route.params.uid }, (err, reData) => {
        this.treeLoading = false;
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
        this.treeData = [];
        this.checkedKeys = [];
        if (!reJson.data) {
          return;
        }
        this.treeToArr(this.mkTree(reJson.data), this.treeData, this.checkedKeys);
        this.showUpdate = reJson.showUpdate;
      });
    },
    saveTree() {
      this.saveLoading = true;
      this.$kc.kPost(this,' ../cp/authSave', { 'uid': this.$route.params.uid, 'data':this.$refs.tree.getCheckedKeys() }, (err, reData) => {
        this.saveLoading = false;
        if (err) {
          this.$alert('保存数据处理失败', '数据错误');
          return;
        }
        const reJson = JSON.parse('' + reData);
        if (reJson.code !== 0) {
          this.$alert('保存配置失败 ' + (reJson.data || ''), '保存配置失败');
          return;
        }
        //处理返回数据
        this.$msgok('保存配置成功');
      });
    },
  }
}
</script>