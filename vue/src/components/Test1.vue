<template>
  <div id="test1">
    <el-button type="info" @click="visible = true">Button</el-button>
    <el-button type="primary" @click="visible = true">Button</el-button>
    <el-button type="success" @click="visible = true">Button</el-button>
    <el-button type="danger" @click="visible = true">Button</el-button>
    <el-button type="warning" @click="visible = true">Button</el-button>
    <el-input v-model="input" placeholder="请输入内容"></el-input>
    <span class="el-icon-edit"></span>
    <span class="el-icon-delete"></span>
    <div class="block">
        <span class="demonstration">默认</span>
        <el-date-picker
          v-model="value1"
          type="date"
          placeholder="选择日期">
        </el-date-picker>
      </div>
    <el-dialog :visible.sync="visible" title="Hello world">
      <p>Try Element</p>
    </el-dialog>
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
    <el-row :gutter="10">
      <el-col :span="24">
        <el-card class="box-card">
          <div id="chart1" :style="{width: '600px', height: '500px'}"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  'name': 'Test1',
  'data': function() {
    return {
      'visible': false,
      'input': '',
      'value1':'value1',
    }
  },

  mounted(){
    this.drawLine();
  },
  'methods': {
    drawLine(){
      console.log('drawLine');
        // 基于准备好的dom，初始化echarts实例
        // const myChart = this.$echarts.init($('chart1'),'dark')
        // // 绘制图表
        // myChart.setOption({
        //     title: { text: '在Vue中使用echarts' },
        //     tooltip: {},
        //     xAxis: {
        //         data: ["衬衫","羊毛衫","雪纺衫","裤子","高跟鞋","袜子"]
        //     },
        //     yAxis: {},
        //     series: [{
        //         name: '销量',
        //         type: 'bar',
        //         data: [5, 20, 36, 10, 10, 20]
        //     }]
        // });
        var myChart = this.$echarts.init(this.$kc.$('chart1'),'dark');

        var option;



        // prettier-ignore
        var hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a',
            '7a', '8a', '9a', '10a', '11a',
            '12p', '1p', '2p', '3p', '4p', '5p',
            '6p', '7p', '8p', '9p', '10p', '11p'];
        // prettier-ignore
        var days = ['100', '200', '300',
            '400', '500', '600', '700', '800'];
        // prettier-ignore
        var data = [[0, 0, 5], [0, 1, 1], [0, 2, 0], [0, 3, 0], [0, 4, 0], [0, 5, 0], [0, 6, 0], [0, 7, 0], [0, 8, 0], [0, 9, 0], [0, 10, 0], [0, 11, 2], [0, 12, 4], [0, 13, 1], [0, 14, 1], [0, 15, 3], [0, 16, 4], [0, 17, 6], [0, 18, 4], [0, 19, 4], [0, 20, 3], [0, 21, 3], [0, 22, 2], [0, 23, 5], [1, 0, 7], [1, 1, 0], [1, 2, 0], [1, 3, 0], [1, 4, 0], [1, 5, 0], [1, 6, 0], [1, 7, 0], [1, 8, 0], [1, 9, 0], [1, 10, 5], [1, 11, 2], [1, 12, 2], [1, 13, 6], [1, 14, 9], [1, 15, 11], [1, 16, 6], [1, 17, 7], [1, 18, 8], [1, 19, 12], [1, 20, 5], [1, 21, 5], [1, 22, 7], [1, 23, 2], [2, 0, 1], [2, 1, 1], [2, 2, 0], [2, 3, 0], [2, 4, 0], [2, 5, 0], [2, 6, 0], [2, 7, 0], [2, 8, 0], [2, 9, 0], [2, 10, 3], [2, 11, 2], [2, 12, 1], [2, 13, 9], [2, 14, 8], [2, 15, 10], [2, 16, 6], [2, 17, 5], [2, 18, 5], [2, 19, 5], [2, 20, 7], [2, 21, 4], [2, 22, 2], [2, 23, 4], [3, 0, 7], [3, 1, 3], [3, 2, 0], [3, 3, 0], [3, 4, 0], [3, 5, 0], [3, 6, 0], [3, 7, 0], [3, 8, 1], [3, 9, 0], [3, 10, 5], [3, 11, 4], [3, 12, 7], [3, 13, 14], [3, 14, 13], [3, 15, 12], [3, 16, 9], [3, 17, 5], [3, 18, 5], [3, 19, 10], [3, 20, 6], [3, 21, 4], [3, 22, 4], [3, 23, 1], [4, 0, 1], [4, 1, 3], [4, 2, 0], [4, 3, 0], [4, 4, 0], [4, 5, 1], [4, 6, 0], [4, 7, 0], [4, 8, 0], [4, 9, 2], [4, 10, 4], [4, 11, 4], [4, 12, 2], [4, 13, 4], [4, 14, 4], [4, 15, 14], [4, 16, 12], [4, 17, 1], [4, 18, 8], [4, 19, 5], [4, 20, 3], [4, 21, 7], [4, 22, 3], [4, 23, 0], [5, 0, 2], [5, 1, 1], [5, 2, 0], [5, 3, 3], [5, 4, 0], [5, 5, 0], [5, 6, 0], [5, 7, 0], [5, 8, 2], [5, 9, 0], [5, 10, 4], [5, 11, 1], [5, 12, 5], [5, 13, 10], [5, 14, 5], [5, 15, 7], [5, 16, 11], [5, 17, 6], [5, 18, 0], [5, 19, 5], [5, 20, 3], [5, 21, 4], [5, 22, 2], [5, 23, 0], [6, 0, 1], [6, 1, 0], [6, 2, 0], [6, 3, 0], [6, 4, 0], [6, 5, 0], [6, 6, 0], [6, 7, 0], [6, 8, 0], [6, 9, 0], [6, 10, 1], [6, 11, 0], [6, 12, 2], [6, 13, 1], [6, 14, 3], [6, 15, 4], [6, 16, 0], [6, 17, 0], [6, 18, 0], [6, 19, 0], [6, 20, 1], [6, 21, 2], [6, 22, 2], [6, 23, 6], [7, 0, 3] , [7, 1, 0] , [7, 2, 0] , [7, 3, 0] , [7, 4, 0] , [7, 5, 0] , [7, 6, 0] , [7, 7, 0] , [7, 8, 0] , [7, 9, 0], [7, 10, 3] , [7, 11, 0] , [7, 12, 0] , [7, 13, 0] , [7, 14, 0] , [7, 15, 0] , [7, 16, 0] , [7, 17, 0] , [7, 18, 0] , [7, 19, 0], [7, 20, 3] , [7, 21, 0] , [7, 22, 0] , [7, 23, 0]];
        option = {
          tooltip: {},
          visualMap: {
            max: 20,
            inRange: {
              color: [
                '#313695',
                '#4575b4',
                '#74add1',
                '#abd9e9',
                '#e0f3f8',
                '#ffffbf',
                '#fee090',
                '#fdae61',
                '#f46d43',
                '#d73027',
                '#a50026'
              ]
            }
          },
          xAxis3D: {
            type: 'category',
            data: hours
          },
          yAxis3D: {
            type: 'category',
            data: days
          },
          zAxis3D: {
            type: 'value'
          },
          grid3D: {
            boxWidth: 200,
            boxDepth: 180,
            viewControl: {
              distance: 300
            },
            light: {
              main: {
                intensity: 1.2
              },
              ambient: {
                intensity: 0.3
              }
            }
          },
          series: [
            {
              type: 'bar3D',
              data: data.map(function (item) {
                return {
                  value: [item[1], item[0], item[2]]
                };
              }),
              shading: 'color',
              label: {
                show: false,
                fontSize: 16,
                borderWidth: 1
              },
              itemStyle: {
                opacity: 0.4
              },
              emphasis: {
                label: {
                  fontSize: 20,
                  color: '#900'
                },
                itemStyle: {
                  color: '#900'
                }
              }
            }
          ]
        };

        myChart.setOption(option);

        //
        //
        //
        this.$kc.llog('kc llog');
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#map {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
}
.myDivIcon {
  font-size: 20px;
  color: red;
}
</style>
