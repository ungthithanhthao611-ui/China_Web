const SITE_ROOT = 'https://en.sinodecor.com'
const BANNER_IMAGE =
  `${SITE_ROOT}/portal-local/ngc202304190002/cms/image/bb102e9a-bc5a-40e6-95f6-ff9c8ab0af94.jpg`
const MOBILE_BANNER_IMAGE =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/24cc6d79-516b-4e0a-a7ae-4b6dcb0bdccc.jpeg`
const BREADCRUMB_IMAGE =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/f516113d-048d-45e0-b42e-3c0cd58d723d.jpeg`
const STAMP_IMAGE =
  'https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png'
const SECTION_DECORATION =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png`
const FEATURED_BACKGROUND =
  `${SITE_ROOT}/repository/portal-local/ngc202304190001/cms/image/9e08c7c1-16d5-44b5-be95-e80b099bc97f.jpg`
const LIST_BACKGROUND =
  `${SITE_ROOT}/repository/portal-local/ngc202304190002/cms/image/dabcc14d-2fa9-4e02-80f3-db7fde9020e0.jpeg`

export const newsCategoryMeta = {
  'corporate-news': {
    key: 'corporate-news',
    label: 'Corporate News',
    heading: 'CORPORATE NEWS',
    route: '/news/corporate-news',
    sourceType: 'news_Detail',
    sourceTotalPages: 72,
    sourceTotalItems: 431
  },
  'industry-dynamics': {
    key: 'industry-dynamics',
    label: 'Industry dynamics',
    heading: 'INDUSTRY DYNAMICS',
    route: '/news/industry-dynamics',
    sourceType: 'news_Detail2',
    sourceTotalPages: 6,
    sourceTotalItems: 34,
    breadcrumbParentLabel: 'Social Responsibility',
    breadcrumbParentRoute: '/social-responsibility'
  }
}

export const newsHero = {
  title: 'NEWS CENTER',
  subtitle: 'Record every step of our progress with news',
  bannerImage: BANNER_IMAGE,
  mobileBannerImage: MOBILE_BANNER_IMAGE,
  breadcrumbImage: BREADCRUMB_IMAGE,
  stampImage: STAMP_IMAGE,
  sectionDecoration: SECTION_DECORATION,
  featuredBackground: FEATURED_BACKGROUND,
  listBackground: LIST_BACKGROUND
}
