const adminRoutes = [
  {
    path: '',
    redirect: { name: 'AdminDashboard' },
  },
  {
    path: 'login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/pages/AdminLoginPage.vue'),
  },
  {
    path: 'dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/pages/AdminDashboardPage.vue'),
    meta: { requiresAdminAuth: true },
  },
  {
    path: 'news/new',
    name: 'AdminNewsCreate',
    component: () => import('@/views/admin/features/news/pages/NewsEditor.vue'),
    meta: { requiresAdminAuth: true },
  },
  {
    path: 'news/:id',
    name: 'AdminNewsEdit',
    component: () => import('@/views/admin/features/news/pages/NewsEditor.vue'),
    meta: { requiresAdminAuth: true },
  },
]

export default adminRoutes






