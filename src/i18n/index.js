import { createI18n } from 'vue-i18n'

import viHome from './locales/vi/user/home'
import viAbout from './locales/vi/user/about'
import viProducts from './locales/vi/user/products'
import viCart from './locales/vi/user/cart'
import viCheckout from './locales/vi/user/checkout'
import viProjects from './locales/vi/user/projects'
import viContact from './locales/vi/user/contact'
import viNews from './locales/vi/user/news'
import viCapability from './locales/vi/user/capability'
import viProfile from './locales/vi/user/profile'
import viAdminSidebar from './locales/vi/admin/sidebar'
import viAdminDashboard from './locales/vi/admin/dashboard'
import viAdminNavigation from './locales/vi/admin/navigation'
import viAdminCommon from './locales/vi/admin/common'
import viAdminEntities from './locales/vi/admin/entities'
import viAdminAbout from './locales/vi/admin/about'
import viAdminCapability from './locales/vi/admin/capability'
import viAdminMedia from './locales/vi/admin/media'
import viAdminNews from './locales/vi/admin/news'
import viFooter from './locales/vi/user/footer'

import enHome from './locales/en/user/home'
import enAbout from './locales/en/user/about'
import enProducts from './locales/en/user/products'
import enCart from './locales/en/user/cart'
import enCheckout from './locales/en/user/checkout'
import enProjects from './locales/en/user/projects'
import enContact from './locales/en/user/contact'
import enNews from './locales/en/user/news'
import enCapability from './locales/en/user/capability'
import enProfile from './locales/en/user/profile'
import enAdminSidebar from './locales/en/admin/sidebar'
import enAdminDashboard from './locales/en/admin/dashboard'
import enAdminNavigation from './locales/en/admin/navigation'
import enAdminCommon from './locales/en/admin/common'
import enAdminEntities from './locales/en/admin/entities'
import enAdminAbout from './locales/en/admin/about'
import enAdminCapability from './locales/en/admin/capability'
import enAdminMedia from './locales/en/admin/media'
import enAdminNews from './locales/en/admin/news'
import enFooter from './locales/en/user/footer'

import zhHome from './locales/zh/user/home'
import zhAbout from './locales/zh/user/about'
import zhProducts from './locales/zh/user/products'
import zhCart from './locales/zh/user/cart'
import zhCheckout from './locales/zh/user/checkout'
import zhProjects from './locales/zh/user/projects'
import zhContact from './locales/zh/user/contact'
import zhNews from './locales/zh/user/news'
import zhCapability from './locales/zh/user/capability'
import zhProfile from './locales/zh/user/profile'
import zhAdminSidebar from './locales/zh/admin/sidebar'
import zhAdminDashboard from './locales/zh/admin/dashboard'
import zhAdminNavigation from './locales/zh/admin/navigation'
import zhAdminCommon from './locales/zh/admin/common'
import zhAdminEntities from './locales/zh/admin/entities'
import zhAdminAbout from './locales/zh/admin/about'
import zhAdminCapability from './locales/zh/admin/capability'
import zhAdminMedia from './locales/zh/admin/media'
import zhAdminNews from './locales/zh/admin/news'
import zhFooter from './locales/zh/user/footer'

export const SUPPORTED_LOCALES = ['vi', 'en', 'zh']
export const DEFAULT_LOCALE = 'vi'
export const LOCALE_STORAGE_KEY = 'app_locale'

const messages = {
  vi: {
    user: {
      home: viHome,
      about: viAbout,
      products: viProducts,
      cart: viCart,
      checkout: viCheckout,
      projects: viProjects,
      contact: viContact,
      news: viNews,
      capability: viCapability,
      profile: viProfile,
      footer: viFooter,
    },
    admin: {
      sidebar: viAdminSidebar,
      dashboard: viAdminDashboard,
      navigation: viAdminNavigation,
      common: viAdminCommon,
      entities: viAdminEntities,
      about: viAdminAbout,
      capability: viAdminCapability,
      media: viAdminMedia,
      news: viAdminNews,
    },
  },
  en: {
    user: {
      home: enHome,
      about: enAbout,
      products: enProducts,
      cart: enCart,
      checkout: enCheckout,
      projects: enProjects,
      contact: enContact,
      news: enNews,
      capability: enCapability,
      profile: enProfile,
      footer: enFooter,
    },
    admin: {
      sidebar: enAdminSidebar,
      dashboard: enAdminDashboard,
      navigation: enAdminNavigation,
      common: enAdminCommon,
      entities: enAdminEntities,
      about: enAdminAbout,
      capability: enAdminCapability,
      media: enAdminMedia,
      news: enAdminNews,
    },
  },
  zh: {
    user: {
      home: zhHome,
      about: zhAbout,
      products: zhProducts,
      cart: zhCart,
      checkout: zhCheckout,
      projects: zhProjects,
      contact: zhContact,
      news: zhNews,
      capability: zhCapability,
      profile: zhProfile,
      footer: zhFooter,
    },
    admin: {
      sidebar: zhAdminSidebar,
      dashboard: zhAdminDashboard,
      navigation: zhAdminNavigation,
      common: zhAdminCommon,
      entities: zhAdminEntities,
      about: zhAdminAbout,
      capability: zhAdminCapability,
      media: zhAdminMedia,
      news: zhAdminNews,
    },
  },
}

function resolveInitialLocale() {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCALE

  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
  return SUPPORTED_LOCALES.includes(savedLocale) ? savedLocale : DEFAULT_LOCALE
}

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
})

export default i18n
