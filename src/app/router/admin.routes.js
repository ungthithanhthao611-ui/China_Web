const adminRoutes = [
  {
    path: '',
    redirect: { name: 'AdminDashboard' },
  },
  {
    path: 'login',
    name: 'AdminLogin',
    component: () => import('@/admin/pages/AdminLoginPage.vue'),
  },
  {
    path: 'dashboard',
    name: 'AdminDashboard',
    component: () => import('@/admin/pages/AdminDashboardPage.vue'),
    meta: { requiresAdminAuth: true },
  },
  {
    path: 'posts/:id/word-editor',
    name: 'AdminPostWordEditor',
    component: () => import('@/admin/pages/posts/PostWordEditorPage.vue'),
    meta: { requiresAdminAuth: true },
    props: true,
  },
  {
    path: 'news-workflow',
    name: 'AdminNewsWorkflowList',
    component: () => import('@/admin/pages/news-workflow/NewsWorkflowListPage.vue'),
    meta: { requiresAdminAuth: true },
  },
  {
    path: 'news-workflow/new',
    name: 'AdminNewsWorkflowCreate',
    component: () => import('@/admin/pages/news-workflow/NewsWorkflowEditPage.vue'),
    meta: { requiresAdminAuth: true },
  },
  {
    path: 'news-workflow/:id',
    name: 'AdminNewsWorkflowEdit',
    component: () => import('@/admin/pages/news-workflow/NewsWorkflowEditPage.vue'),
    meta: { requiresAdminAuth: true },
    props: true,
  },
  {
    path: 'news-workflow/:id/preview',
    name: 'AdminNewsWorkflowPreview',
    component: () => import('@/admin/pages/news-workflow/NewsWorkflowPreviewPage.vue'),
    meta: { requiresAdminAuth: true },
    props: true,
  },
]

export default adminRoutes




