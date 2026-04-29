import { createI18n } from 'vue-i18n'

import viHome from './locales/vi/user/home'
import viAbout from './locales/vi/user/about'
import viProducts from './locales/vi/user/products'
import enHome from './locales/en/user/home'
import enAbout from './locales/en/user/about'
import enProducts from './locales/en/user/products'
import zhHome from './locales/zh/user/home'
import zhAbout from './locales/zh/user/about'
import zhProducts from './locales/zh/user/products'

export const SUPPORTED_LOCALES = ['vi', 'en', 'zh']
export const DEFAULT_LOCALE = 'vi'
export const LOCALE_STORAGE_KEY = 'app_locale'

const messages = {
  vi: {
    user: {
      home: viHome,
      about: viAbout,
      products: viProducts,
    },
  },
  en: {
    user: {
      home: enHome,
      about: enAbout,
      products: enProducts,
    },
  },
  zh: {
    user: {
      home: zhHome,
      about: zhAbout,
      products: zhProducts,
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
