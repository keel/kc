import Vue from 'vue';
import VueRouter from 'vue-router';
import Main from '../views/Main.vue';
import Home from '../views/Home.vue';

Vue.use(VueRouter);


const routes = [{
    path: '/',
    component: Main,
    children: [
      { 'path': '', 'component': Home },
      { 'name': 'Home', 'path': 'home', 'component': Home },
      { 'name': 'Nothing', 'path': 'nothing', component: () => import( /* webpackChunkName: "about" */ '../views/Nothing.vue') },
      { 'name': 'About', 'path': 'about', component: () => import( /* webpackChunkName: "about" */ '../views/About.vue') },
    ],
  },
  {
    path: '/logout',
    name: 'Logout',
    component: () => import( /* webpackChunkName: "about" */ '../views/Logout.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import( /* webpackChunkName: "about" */ '../views/Login.vue'),
  },
  { 'path': '*', 'component': () => import('../views/NotFound.vue') },
];

//自动添加curd目录下的所有vue到routes
const contexts = require.context('../views/curd', false, /\.vue$/);
contexts.keys().forEach((fileName) => {
  const routePath = fileName.split('/').pop().replace(/\.vue$/, '');
  routes[0].children.push({
    'path': routePath,
    'name': routePath,
    'component': () => import('../views/curd/' + routePath),
  });

});

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;