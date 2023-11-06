import { App } from 'vue'
import * as VueRouter from 'vue-router'

// 1. Define the routing component.
// You can also import from other files
const Home = { template: '<div>Home</div>' }
const About = { template: '<div>About</div>' }

// 2. Define some routes
// Each route needs to be mapped to a component.
// We will discuss nested routing later.
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

// 3. Create a routing instance and pass the `routes` configuration
// You can enter more configuration here, but here we are
// Keep it simple for now
const router = VueRouter.createRouter({
  // 4. The implementation of history mode is provided internally. For simplicity, we use hash mode here.
  history: VueRouter.createWebHashHistory(),
  routes // Abbreviation for `routes: routes`
})

// Configure routing
export const setupRouter = (app: App<Element>) => {
  //Make sure _use_ the route instance uses
  //The entire application supports routing.
  app.use(router)
}
