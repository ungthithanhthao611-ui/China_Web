import { computed, ref, watch } from 'vue'

import i18n from '@/i18n'
import { getHomeBootstrap } from '@/views/user/services/publicApi'

const HOME_BOOTSTRAP_CACHE_TTL = 5 * 60 * 1000

const createEmptyPayload = () => ({
  products: { items: [], pagination: { skip: 0, limit: 4, total: 0 } },
  projects: { items: [], pagination: { skip: 0, limit: 4, total: 0 } },
  news: { items: [], total: 0, skip: 0, limit: 8 },
  honors: {
    factory_overview: null,
  },
})

const sharedData = ref(createEmptyPayload())
const sharedLoading = ref(false)
const sharedError = ref(null)
const payloadCache = new Map()
const inflightCache = new Map()
const CACHE_KEY_PREFIX = 'home_bootstrap_'

function getStoredCache(lang) {
  try {
    const data = localStorage.getItem(CACHE_KEY_PREFIX + lang)
    if (!data) return null

    const parsed = JSON.parse(data)
    if (!parsed || typeof parsed !== 'object') return null

    const timestamp = Number(parsed.timestamp || 0)
    if (!timestamp || Date.now() - timestamp > HOME_BOOTSTRAP_CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY_PREFIX + lang)
      return null
    }

    return parsed.payload || null
  } catch (e) {
    return null
  }
}

function setStoredCache(lang, data) {
  try {
    localStorage.setItem(
      CACHE_KEY_PREFIX + lang,
      JSON.stringify({
        timestamp: Date.now(),
        payload: data,
      }),
    )
  } catch (e) {}
}

function getCurrentLanguageCode() {
  if (!i18n || !i18n.global) return 'vi'
  const locale = i18n.global.locale
  return typeof locale === 'string' ? locale : (locale?.value || 'vi')
}

function normalizePayload(payload) {
  const fallback = createEmptyPayload()

  return {
    ...fallback,
    ...payload,
    products: payload?.products || fallback.products,
    projects: payload?.projects || fallback.projects,
    news: payload?.news || fallback.news,
    honors: {
      ...fallback.honors,
      ...(payload?.honors || {}),
    },
  }
}

async function loadHomeBootstrap(force = false) {
  const languageCode = getCurrentLanguageCode()

  if (!force && payloadCache.has(languageCode)) {
    sharedData.value = payloadCache.get(languageCode)
    return sharedData.value
  }

  if (!force && !sharedLoading.value && sharedData.value.products.items.length === 0) {
    const cached = getStoredCache(languageCode)
    if (cached) {
      const normalized = normalizePayload(cached)
      sharedData.value = normalized
      payloadCache.set(languageCode, normalized)
    }
  }

  if (!force && inflightCache.has(languageCode)) {
    return inflightCache.get(languageCode)
  }

  sharedLoading.value = true
  sharedError.value = null

  const request = getHomeBootstrap()
    .then((payload) => {
      const normalized = normalizePayload(payload)
      payloadCache.set(languageCode, normalized)
      setStoredCache(languageCode, normalized)
      sharedData.value = normalized
      return normalized
    })
    .catch((error) => {
      sharedError.value = error
      if (sharedData.value.products.items.length === 0) {
        sharedData.value = createEmptyPayload()
      }
      throw error
    })
    .finally(() => {
      inflightCache.delete(languageCode)
      sharedLoading.value = false
    })

  inflightCache.set(languageCode, request)
  return request
}

watch(
  () => getCurrentLanguageCode(),
  () => {
    loadHomeBootstrap(true).catch(() => {})
  },
)

export function useHomeBootstrap() {
  return {
    data: computed(() => sharedData.value),
    loading: computed(() => sharedLoading.value),
    error: computed(() => sharedError.value),
    ensureLoaded: loadHomeBootstrap,
  }
}
