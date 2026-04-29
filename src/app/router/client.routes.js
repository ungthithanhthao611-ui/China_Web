const clientRoutes = [
  {
    path: '',
    name: 'Home',
    component: () => import('@/views/user/home/HomePage.vue'),
  },
  {
    path: 'about',
    redirect: '/about/company-introduction',
    children: [
      {
        path: 'company-introduction',
        name: 'CompanyIntroduction',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
      {
        path: 'chairman-speech',
        name: 'ChairmanSpeech',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
      {
        path: 'organization-chart',
        name: 'OrganizationChart',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
      {
        path: 'corporate-culture',
        name: 'CorporateCulture',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
      {
        path: 'development-course',
        name: 'DevelopmentCourse',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
      {
        path: 'leadership-care',
        name: 'LeadershipCare',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
      {
        path: 'cooperative-partner',
        name: 'CooperativePartner',
        component: () => import('@/views/user/about/AboutPage.vue'),
      },
    ],
  },
  {
    path: 'honors',
    name: 'Honors',
    component: () => import('@/views/user/honors/HonorsPage.vue'),
  },
  {
    path: 'business-areas',
    name: 'BusinessAreas',
    component: () => import('@/views/user/business/BusinessAreasPage.vue'),
  },
  {
    path: 'du-an',
    name: 'Projects',
    alias: ['/projects', '/project-case'],
    component: () => import('@/views/user/projects/ProjectCasePage.vue'),
  },
  {
    path: 'projects/:category',
    name: 'ProjectCategory',
    component: () => import('@/views/user/projects/ProjectCasePage.vue'),
  },
  {
    path: 'project_list/:categoryId.html',
    name: 'ProjectListLegacy',
    component: () => import('@/views/user/projects/ProjectCasePage.vue'),
  },
  {
    path: 'du-an/:slug',
    name: 'ProjectDetail',
    alias: ['/project/:slug'],
    component: () => import('@/views/user/projects/ProjectDetailPage.vue'),
  },
  {
    path: 'products',
    name: 'Products',
    component: () => import('@/views/user/products/ProductListPage.vue'),
  },
  {
    path: 'products/:slug',
    name: 'ProductDetail',
    component: () => import('@/views/user/products/ProductDetailPage.vue'),
    props: true,
  },
  {
    path: 'cart',
    name: 'Cart',
    component: () => import('@/views/user/cart/CartPage.vue'),
  },
  {
    path: 'news',
    name: 'News',
    component: () => import('@/views/user/news/NewsListPage.vue'),
  },
  {
    path: 'news/:slug',
    name: 'NewsDetail',
    component: () => import('@/views/user/news/NewsDetailPage.vue'),
  },
  {
    path: 'contact',
    name: 'Contact',
    component: () => import('@/views/user/contact/ContactPage.vue'),
  },
  {
    path: 'login',
    name: 'Login',
    component: () => import('@/views/user/auth/AuthPage.vue'),
  },
  {
    path: 'register',
    name: 'Register',
    component: () => import('@/views/user/auth/AuthPage.vue'),
  },
]

export default clientRoutes



