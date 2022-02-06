<template>
  <div id="app" v-cloak>
    <el-container>
      <SideMenu :isToCollapse="menuCollapse" />
      <el-container>
        <el-header id="elHeader">
          <el-row>
            <el-col :span="4"><el-link :underline="false" icon="el-icon-s-fold" @click="menuFold()"></el-link></el-col>
            <el-col :span="20" style="text-align: right;" id="headerNav">
              <router-link :to="{path:'/'}">Main</router-link> |
              <router-link :to="{name:'Profile'}">Profile</router-link> |
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
  },
  'methods': {
    menuFold() {
      this.menuCollapse = !this.menuCollapse;
    }
  },
}
</script>