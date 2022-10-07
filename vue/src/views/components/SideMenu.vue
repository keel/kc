<template>
  <el-aside id="aside" width="200px">
    <div class="menu-header">
      <router-link :to="{name:'Home'}" style="color: #FFF; text-decoration: none;"><i class="el-icon-menu"></i> {{(isCollapse)?'':'控制台'}}</router-link>
    </div>
    <el-menu :collapse-transition="false" :router="true" class="menu-vertical" :collapse="isCollapse">
      <template v-for="mItem in menuArr">
        <template v-if="mItem.subs">
          <el-submenu :index="mItem.link" :key="mItem.link">
            <template v-slot:title>
              <i  :class="mItem.icon"></i><span>{{ mItem.name }}</span>
            </template>
            <el-menu-item  v-for="subItem in mItem.subs" :index="subItem.link" :key="subItem.link"><i class="el-icon-caret-right"></i><template v-slot:title>{{ subItem.name }}</template></el-menu-item>
          </el-submenu>
        </template>
        <template v-else>
          <el-menu-item :index="mItem.link" :key="mItem.link"><i :class="mItem.icon"></i><template v-slot:title>{{ mItem.name }}</template></el-menu-item>
        </template>
      </template>

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
      'menuArr':[],
    }
  },
  mounted() {
    this.$kc.kPost(this,' /sideMenu/showMenu','{}',(err, reData) => {
      if (err) {
        this.$kc.lerr(err);
        return;
      }
      const reJson = JSON.parse('' + reData);
      this.menuArr = reJson.data;
    });
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
  min-height: 700px;
}

.menu-header {
  text-align: center;
  line-height: 60px;
  border-bottom: solid 1px rgba(255, 255, 255, 0.1);
}
</style>