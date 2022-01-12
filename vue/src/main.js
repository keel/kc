import Vue from 'vue';
import App from './App.vue';
import './plugins/element.js';
import './plugins/echarts.js';
import './plugins/kc.js';
import './assets/css/main.css';
import router from './router'

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
