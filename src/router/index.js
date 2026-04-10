import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  {
    path: '/about',
    redirect: '/about/company-introduction',
    children: [
      {
        path: 'company-introduction',
        name: 'CompanyIntroduction',
        component: () => import('../pages/about/AboutPage.vue')
      },
      {
        path: 'chairman-speech',
        name: 'ChairmanSpeech',
        component: () => import('../pages/about/AboutPage.vue')
      },
      {
        path: 'organization-chart',
        name: 'OrganizationChart',
        component: () => import('../pages/about/AboutPage.vue')
      },
      {
        path: 'corporate-culture',
        name: 'CorporateCulture',
        component: () => import('../pages/about/AboutPage.vue')
      },
      {
        path: 'development-course',
        name: 'DevelopmentCourse',
        component: () => import('../pages/about/AboutPage.vue')
      },
      {
        path: 'leadership-care',
        name: 'LeadershipCare',
        component: () => import('../pages/about/AboutPage.vue')
      },
      {
        path: 'cooperative-partner',
        name: 'CooperativePartner',
        component: () => import('../pages/about/AboutPage.vue')
      }
    ]
  },
  {
    path: '/honors',
    name: 'Honors',
    component: () => import('../pages/Honors.vue')
  },
  {
    path: '/business-areas',
    name: 'BusinessAreas',
    component: () => import('../pages/business/BusinessAreas.vue')
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../pages/projects/ProjectList.vue')
  },
  {
    path: '/projects/:category',
    name: 'ProjectCategory',
    component: () => import('../pages/projects/ProjectList.vue')
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: () => import('../pages/projects/ProjectDetail.vue')
  },
  {
    path: '/video',
    name: 'Video',
    component: () => import('../pages/Video.vue')
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('../pages/news/NewsList.vue'),
    children: [
      { path: 'enterprise', name: 'EnterpriseNews', component: () => import('../pages/news/NewsList.vue') },
      { path: 'industry', name: 'IndustryNews', component: () => import('../pages/news/NewsList.vue') }
    ]
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: () => import('../pages/news/NewsDetail.vue')
  },
  {
    path: '/social-responsibility',
    name: 'SocialResponsibility',
    component: () => import('../pages/SocialResponsibility.vue')
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../pages/Contact.vue')
  },
  {
    path: '/subsidiary',
    name: 'Subsidiary',
    component: () => import('../pages/Subsidiary.vue')
  },
  {
    path: '/branch',
    name: 'Branch',
    component: () => import('../pages/Branch.vue')
  },
  {
    path: '/join-us',
    name: 'JoinUs',
    component: () => import('../pages/jobs/JobList.vue')
  },
  {
    path: '/join-us/:id',
    name: 'JobDetail',
    component: () => import('../pages/jobs/JobDetail.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../pages/Privacy.vue')
  },
  {
    path: '/copyright',
    name: 'Copyright',
    component: () => import('../pages/Copyright.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    } else {
      return { top: 0 }
    }
  }
})

export default router
