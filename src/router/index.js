import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useUserStore } from "@/stores/user"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../layout/Layout.vue'),
      redirect: '/home',
      children: [
        {
          path: 'home',
          name: 'Home',
          component: () => import('../views/HomeView.vue')
        },
        {
          path: 'recommend',
          name: 'Recommend',
          component: () => import('../views/Recommend.vue')
        },
        {
          path: 'pointsMall',
          name: 'PointsMall',
          component: () => import('../components/PointsMall.vue')
        },
        {
          path: 'personCenter',
          name: 'PersonCenter',
          component: () => import('../views/PersonCenter.vue')
        },
        {
          path: 'moviedetail/:type/:id',
          name: 'MovieDetail',
          component: () => import('../views/MovieDetail.vue')
        },
        {
          path: 'tvdetail/:type/:id',
          name: 'TvDetail',
          component: () => import('../views/MovieDetail.vue')
        },
        {
          path: 'searchresults',
          name: 'SearchResults',
          component: () => import('../components/SearchBar.vue')
        }
      ]
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue')
    },
    {
      path: '/404',
      name: '404',
      component: () => import('../views/404.vue')
    },
    {
      path: '/:pathMatch(.*)', // 匹配所有的未知路由
      redirect: '/404' // 重定向回404
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const store = useUserStore()
  const noPermissionPaths = ['/login', '/register', '/home', '/moviedetail/:type/:id', '/tvdetail/:type/:id', '/searchresults', '/404', '/']
  
  // 使用正则匹配检查路径
  const isNoPermissionPath = noPermissionPaths.some(path => {
    const regexPath = path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${regexPath}$`);
    return regex.test(to.path);
  });

  if (!store.isLoggedIn && !isNoPermissionPath) {
    next('/login')
  } else {
    if (!to.matched.length) {
      next('/404')
    } else {
      next()
    }
  }
})

export default router
