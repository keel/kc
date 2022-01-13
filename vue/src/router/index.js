import Vue from 'vue'
import VueRouter from 'vue-router'
import Main from '../views/Main.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Main',
    component: Main,
    children:[
      {'name':'Project','path':'project',component: () => import(/* webpackChunkName: "about" */ '../views/Project.vue')},
      {'name':'Product','path':'product',component: () => import(/* webpackChunkName: "about" */ '../views/Product.vue')},
      {'name':'Nothing','path':'nothing',component: () => import(/* webpackChunkName: "about" */ '../views/Nothing.vue')},
      {'name':'About','path':'about',component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')},
      {'name':'Home','path':'home',component: () => import(/* webpackChunkName: "about" */ '../views/Home.vue')},
    ],
  },
  {
    path: '/logout',
    name: 'Logout',
    component: () => import(/* webpackChunkName: "about" */ '../views/Logout.vue')
  },
  {
    path: '/login',
    name: 'Login',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Login.vue')
  },
  {'path':'*','component':() => import('../views/NotFound.vue')},
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
