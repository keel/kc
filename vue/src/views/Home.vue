<template>
  <div id="home">
  <el-row>
    <el-card class="box-card">
      <el-button type="info" @click="visible = true">Button</el-button>
      <el-button type="primary" @click="visible = true">Button</el-button>
      <el-button type="success" @click="visible = true">Button</el-button>
      <el-button type="danger" @click="visible = true">Button</el-button>
      <el-button type="warning" @click="visible = true">Button</el-button>
      <el-input v-model="input" placeholder="请输入内容" style="padding-top: 10px;"></el-input>
  </el-card>
  </el-row>
    <el-row :gutter="10">
      <el-col :span="18">
        <el-card class="box-card">
          <div v-for="o in 4" :key="o" class="">
            {{'列表内容 ' + o }}
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="box-card">
          <div v-for="o in 4" :key="o" class="">
            {{'列表内容 ' + o }}
          </div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>
<script>
export default {
  'name': 'Home',
  data() {
    return {
      'input':'',
    }
  },
}
</script>