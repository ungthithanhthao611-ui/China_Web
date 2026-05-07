/**
 * useAboutPage.js
 *
 * Composable cho About page:
 * - Gọi API getPageDetail('about')
 * - Reuse hero banners từ bootstrap store
 * - Cache dữ liệu theo locale để render tức thì khi quay lại trang
 * - Normalize response thành view model
 * - Quản lý loading / error / aboutView
 * - Cập nhật SEO tags
 */

import { computed, onMounted, readonly, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPageDetail } from '@/views/user/services/publicApi'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import { normalizeAboutPage } from '../adapters/aboutPageNormalizer'

const ABOUT_CACHE_PREFIX = 'about-page-cache:'
const ABOUT_CACHE_TTL = 5 * 60 * 1000
const ABOUT_MEMORY_CACHE = new Map()
let inFlightRequest = null

function getCacheKey(locale) {
  return `${ABOUT_CACHE_PREFIX}${String(locale || 'vi').trim().toLowerCase() || 'vi'}`
}

function readCachedAbout(locale) {
  const cacheKey = getCacheKey(locale)
  const memoryEntry = ABOUT_MEMORY_CACHE.get(cacheKey)
  if (memoryEntry && Date.now() - memoryEntry.timestamp <= ABOUT_CACHE_TTL) {
    return memoryEntry.payload || null
  }

  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const timestamp = Number(parsed?.timestamp || 0)
    if (!timestamp || Date.now() - timestamp > ABOUT_CACHE_TTL) {
      localStorage.removeItem(cacheKey)
      ABOUT_MEMORY_CACHE.delete(cacheKey)
      return null
    }

    ABOUT_MEMORY_CACHE.set(cacheKey, {
      timestamp,
      payload: parsed?.payload || null,
    })

    return parsed?.payload || null
  } catch {
    return null
  }
}

function writeCachedAbout(locale, payload) {
  const cacheKey = getCacheKey(locale)
  const entry = {
    timestamp: Date.now(),
    payload,
  }

  ABOUT_MEMORY_CACHE.set(cacheKey, entry)

  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry))
  } catch {
    // Ignore quota / serialization errors
  }
}

function ensureImagePreloadLink(url) {
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl || typeof document === 'undefined') return

  const selector = `link[rel="preload"][as="image"][href="${normalizedUrl}"]`
  if (document.head.querySelector(selector)) return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = normalizedUrl
  document.head.appendChild(link)
}

function preloadImage(url) {
  const normalizedUrl = String(url || '').trim()
  if (!normalizedUrl || typeof window === 'undefined') return

  ensureImagePreloadLink(normalizedUrl)

  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = 'high'
  image.src = normalizedUrl
}

function preloadCriticalAboutAssets(view) {
  preloadImage(view?.cultureSection?.coverImage)
  preloadImage(view?.companyIntroduction?.coverImage)
  preloadImage('/images/nen_LSPhattrien.jpg')
}

function applySeo(view) {
  const fallbackTitle = 'Giới Thiệu | THIÊN ĐỒNG VIỆT NAM'
  const fallbackDescription =
    'Tìm hiểu về Công ty TNHH Thương mại Quốc tế Thiên Đông Việt Nam, lịch sử phát triển, văn hóa doanh nghiệp và tầm nhìn chiến lược của chúng tôi.'

  document.title = view?.metaTitle || view?.title || fallbackTitle

  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', view?.metaDescription || fallbackDescription)
  }
}

/**
 * @returns {{ loading, error, aboutView, refresh }}
 */
export function useAboutPage() {
  const { locale } = useI18n()
  const bootstrapStore = useBootstrapStore()
  const loading = ref(true)
  const error = ref(null)
  const aboutView = ref(null)
  const heroBanners = computed(() => bootstrapStore.heroBanners || [])

  function syncFromRaw(raw) {
    aboutView.value = normalizeAboutPage(raw, heroBanners.value)
    if (!aboutView.value) {
      error.value = 'About page data is empty'
    }
    preloadCriticalAboutAssets(aboutView.value)
    applySeo(aboutView.value)
  }

  async function fetchAbout({ force = false } = {}) {
    const currentLocale = locale.value
    loading.value = !aboutView.value
    error.value = null

    if (!force || !aboutView.value) {
      const cached = readCachedAbout(currentLocale)
      if (cached) {
        syncFromRaw(cached)
        loading.value = false
        if (!force) {
          return cached
        }
      }
    }

    if (inFlightRequest && !force) {
      return inFlightRequest
    }

    inFlightRequest = getPageDetail('about')
      .then((raw) => {
        writeCachedAbout(currentLocale, raw)
        syncFromRaw(raw)
        return raw
      })
      .catch((err) => {
        console.error('[useAboutPage] Failed to load about page:', err)
        error.value = err?.message || 'Failed to load page data'
        if (!aboutView.value) {
          aboutView.value = null
          applySeo(null)
        }
        throw err
      })
      .finally(() => {
        loading.value = false
        inFlightRequest = null
      })

    return inFlightRequest
  }

  onMounted(() => {
    fetchAbout().catch(() => {})
  })

  watch(locale, () => {
    fetchAbout().catch(() => {})
  })

  return {
    loading: readonly(loading),
    error: readonly(error),
    aboutView: readonly(aboutView),
    refresh: () => fetchAbout({ force: true }),
  }
}
