const adminRoutes = [
  {
    path: '',
    redirect: { name: 'AdminDashboard' },
  },
  {
    path: 'login',
    name: 'AdminLogin',
    component: () => import('@/admin/pages/AdminLogin.vue'),
  },
  {
    path: 'dashboard',
    name: 'AdminDashboard',
    component: () => import('@/admin/pages/AdminDashboard.vue'),
    meta: { requiresAdminAuth: true },
  },
  {
    path: 'posts/:id/word-editor',
    name: 'AdminPostWordEditor',
    component: () => import('@/admin/pages/posts/PostWordEditorPage.vue'),
    meta: { requiresAdminAuth: true },
    props: true,
  },
]

export default adminRoutes
