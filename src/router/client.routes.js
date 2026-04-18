const clientRoutes = [
  {
    path: '',
    name: 'Home',
    component: () => import('@/client/pages/Home.vue'),
  },
  {
    path: 'about',
    redirect: '/about/company-introduction',
    children: [
      {
        path: 'company-introduction',
        name: 'CompanyIntroduction',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
      {
        path: 'chairman-speech',
        name: 'ChairmanSpeech',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
      {
        path: 'organization-chart',
        name: 'OrganizationChart',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
      {
        path: 'corporate-culture',
        name: 'CorporateCulture',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
      {
        path: 'development-course',
        name: 'DevelopmentCourse',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
      {
        path: 'leadership-care',
        name: 'LeadershipCare',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
      {
        path: 'cooperative-partner',
        name: 'CooperativePartner',
        component: () => import('@/client/pages/about/AboutPage.vue'),
      },
    ],
  },
  {
    path: 'honors',
    name: 'Honors',
    component: () => import('@/client/pages/Honors.vue'),
  },
  {
    path: 'business-areas',
    name: 'BusinessAreas',
    component: () => import('@/client/pages/business/BusinessAreas.vue'),
  },
  {
    path: 'projects',
    name: 'Projects',
    component: () => import('@/client/pages/projects/ProjectCasePage.vue'),
  },
  {
    path: 'project-case',
    name: 'ProjectCase',
    component: () => import('@/client/pages/projects/ProjectCasePage.vue'),
  },
  {
    path: 'projects/:category',
    name: 'ProjectCategory',
    component: () => import('@/client/pages/projects/ProjectCasePage.vue'),
  },
  {
    path: 'project/:slug',
    name: 'ProjectDetail',
    component: () => import('@/client/pages/projects/ProjectDetail.vue'),
  },
  {
    path: 'video',
    name: 'Video',
    component: () => import('@/client/pages/Video.vue'),
  },
  {
    path: 'news',
    name: 'News',
    component: () => import('@/client/pages/news/NewsList.vue'),
    children: [
      {
        path: 'corporate-news',
        name: 'CorporateNews',
        component: () => import('@/client/pages/news/NewsList.vue'),
      },
      {
        path: 'industry-dynamics',
        name: 'IndustryNews',
        component: () => import('@/client/pages/news/NewsList.vue'),
      },
    ],
  },
  {
    path: 'news/:slug',
    name: 'NewsDetail',
    component: () => import('@/client/pages/news/NewsDetail.vue'),
  },
  {
    path: 'social-responsibility',
    name: 'SocialResponsibility',
    component: () => import('@/client/pages/SocialResponsibility.vue'),
  },
  {
    path: 'contact',
    name: 'Contact',
    component: () => import('@/client/pages/Contact.vue'),
  },
  {
    path: 'subsidiary',
    name: 'Subsidiary',
    component: () => import('@/client/pages/Subsidiary.vue'),
  },
  {
    path: 'subsidiary_Detail/:slug.html',
    name: 'SubsidiaryDetail',
    component: () => import('@/client/pages/SubsidiaryDetail.vue'),
  },
  {
    path: 'branch',
    name: 'Branch',
    component: () => import('@/client/pages/Branch.vue'),
  },
  {
    path: 'join-us',
    name: 'JoinUs',
    component: () => import('@/client/pages/jobs/JobList.vue'),
  },
  {
    path: 'join-us/:id',
    name: 'JobDetail',
    component: () => import('@/client/pages/jobs/JobDetail.vue'),
  },
  {
    path: 'privacy',
    name: 'Privacy',
    component: () => import('@/client/pages/Privacy.vue'),
  },
  {
    path: 'copyright',
    name: 'Copyright',
    component: () => import('@/client/pages/Copyright.vue'),
  },
  {
    path: 'security',
    name: 'Security',
    component: () => import('@/client/pages/Security.vue'),
  },
]

export default clientRoutes
