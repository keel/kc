<template>
  <div id="app" v-cloak>
    <el-container>
      <SideMenu :isToCollapse="menuCollapse" />
      <el-container>
        <el-header id="elHeader">
          <el-row>
            <el-col :span="4"><el-link :underline="false" icon="el-icon-s-fold" @click="menuFold()"></el-link></el-col>
            <el-col :span="20" style="text-align: right;" id="nav">
              <router-link :to="{path:'/'}">Main</router-link> |
              <router-link :to="{name:'About'}">About</router-link> |
              <router-link :to="{name:'Nothing'}">Nothing</router-link>
            </el-col>
          </el-row>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>
<script>
import SideMenu from '../components/SideMenu.vue';

export default {
  'name': 'Main',
  'components': {
    SideMenu,
  },
  'data': function() {
    return {
      'menuCollapse':false,
    }
  },
  mounted(){
    this.$kc.$('elHeader').removeAttribute("style"); //清除el-header的bug
    // if(this.$router.currentRoute.name === 'Main'){
    //   this.$router.push('/home');
    // }
  },
  'methods': {
    menuFold() {
      this.menuCollapse = !this.menuCollapse;
    }
  },
}
</script>
<style>
#nav {
  padding:0 30px;
}

#nav a {
  font-weight: bold;
  color: #f6f6fb;
}

#nav a.router-link-exact-active {
  color: #6c5ffc;
  text-decoration: none;
}

.el-header, .el-footer {
  background-color: #2a2a4a;
  color: #f6f6fb;
  line-height: 60px;
  border-bottom: solid 1px rgba(255, 255, 255, 0.1);
}

.el-main {
  background-color: #1B1C3B;
  color: #f6f6fb;
}


</style>