import { App } from 'vue'
import * as VueRouter from 'vue-router'

// 1. 定义路由组件.
// 也可以从其他文件导入
const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

// 2. 定义一些路由
// 每个路由都需要映射到一个组件。
// 我们后面再讨论嵌套路由。
const routes = [
  { path: '/', component: () => import('../views/home/index.vue') },
  {
    path: '/serial',
    component: () => import('../views/upload/big-file-upload-serial.vue')
  },
  {
    path: '/concurrent',
    component: () => import('../views/upload/big-file-upload-concurrent.vue')
  },
  {
    path: '/queue',
    component: () => import('../views/upload/big-file-upload-queue.vue')
  },
  {
    path: '/hook',
    component: () => import('../views/upload/big-file-upload-hook.vue')
  },
  {
    path: '/task',
    component: () => import('../views/upload/big-file-upload-task.vue')
  },
  {
    path: '/store',
    component: () => import('../views/upload/big-file-upload-store.vue')
  }
]

// 3. 创建路由实例并传递 `routes` 配置
// 你可以在这里输入更多的配置，但我们在这里
// 暂时保持简单
const router = VueRouter.createRouter({
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  history: VueRouter.createWebHashHistory(),
  routes // `routes: routes` 的缩写
})

// 配置路由
export const setupRouter = (app: App<Element>) => {
  //确保 _use_ 路由实例使
  //整个应用支持路由。
  app.use(router)
}
