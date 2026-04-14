import { createRouter, createWebHistory } from 'vue-router'

import { ADMIN_TOKEN_STORAGE_KEY } from '@/admin/constants/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ClientLayout from '@/layouts/ClientLayout.vue'
import adminRoutes from './admin.routes'
import clientRoutes from './client.routes'

const routes = [
  {
    path: '/',
    component: ClientLayout,
    children: clientRoutes,
  },
  {
    path: '/admin',
    component: AdminLayout,
    children: adminRoutes,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const isAdminLogin = to.name === 'AdminLogin'
  const adminToken = String(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '').trim()

  if (to.meta.requiresAdminAuth && !adminToken) {
    return {
      name: 'AdminLogin',
      query: { redirect: to.fullPath },
    }
  }

  if (isAdminLogin && adminToken) {
    const redirectPath = String(to.query.redirect || '').trim()
    if (redirectPath.startsWith('/admin')) {
      return redirectPath
    }
    return { name: 'AdminDashboard' }
  }

  return true
})

export default router
