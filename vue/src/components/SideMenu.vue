<template>
  <el-aside id="aside" width="200px">
    <div class="menu-header">
      <router-link :to="{name:'Home'}" style="color: #FFF; text-decoration: none;"><i class="el-icon-menu"></i> {{(isCollapse)?'':'控制台'}}</router-link>
    </div>
    <el-menu :collapse-transition="false" :router="true" class="menu-vertical" :collapse="isCollapse">
      <el-menu-item index="/">
        <i class="el-icon-s-home"></i>
        <template v-slot:title>首页</template>
      </el-menu-item>
      <el-submenu index="projects">
        <template v-slot:title>
          <i class="el-icon-s-order"></i><span>项目</span>
        </template>
        <el-menu-item index="proj-list"><i class="el-icon-caret-right"></i>项目列表</el-menu-item>
        <el-menu-item index="proj-search"><i class="el-icon-caret-right"></i>项目查询</el-menu-item>
      </el-submenu>
      <el-menu-item index="about"><i class="el-icon-document"></i><template v-slot:title>关于导航2</template></el-menu-item>
      <el-menu-item index="nothing"><i class="el-icon-s-data"></i><template v-slot:title>关于导航3</template></el-menu-item>
      <el-menu-item index="/login"><i class="el-icon-s-opportunity"></i><template v-slot:title>退出系统</template></el-menu-item>

    </el-menu>
  </el-aside>
</template>
<script>
export default {
  'name': 'SideMenu',
  'props': {
    'isToCollapse': false,
  },
  'data': function() {
    return {
      'isCollapse': this.isToCollapse,
    }
  },
  mounted() {
    //TODO : 根据接口返回数据生成菜单
    // this.$kc.kPost();
  },
  'methods': {

  },
  'watch': {
    isToCollapse(val) {
      this.isCollapse = val;
      const sideWidth = (this.isCollapse) ? '64px' : '200px';
      this.$kc.setStyle(this.$kc.$('aside'), { 'width': sideWidth });
    }
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.el-aside {
  background-color: #2a2a4a;
  color: #f6f6fb;
  overflow: hidden;
  border-right: solid 1px rgba(255, 255, 255, 0.1);
}

.el-menu {
  background-color: #2a2a4a;
  color: #f6f6fb;
  border-right: none;
}

.menu-vertical:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

.menu-header {
  text-align: center;
  line-height: 60px;
  border-bottom: solid 1px rgba(255, 255, 255, 0.1);
}
</style>