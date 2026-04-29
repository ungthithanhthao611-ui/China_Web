import i18n from '@/i18n'
import { fetchJson } from '@/shared/lib/http'

/**
 * Lấy language code hiện tại từ i18n state.
 * Vue-i18n locale là reactive nên cần .value nếu dùng composition API,
 * ở đây ta dùng global.locale (có thể là ref hoặc string tùy config).
 */
function getCurrentLanguageCode() {
  const locale = i18n.global.locale
  return typeof locale === 'string' ? locale : locale.value
}

function withLanguage(query = {}) {
  return {
    language_code: getCurrentLanguageCode(),
    ...query,
  }
}

/**
 * Thử lấy dữ liệu theo ngôn ngữ hiện tại, nếu lỗi hoặc rỗng thì thử fallback.
 * Mặc định fallback về 'vi' (Tiếng Việt) theo yêu cầu.
 */
async function fetchWithLanguageFallback(path, queryBuilder, fallbackLanguages = ['vi']) {
  const currentLang = getCurrentLanguageCode()
  
  // Danh sách ngôn ngữ để thử: [ngôn ngữ hiện tại, ...fallbacks]
  // Dedupe để tránh loop vô tận
  const languages = [...new Set([currentLang, ...fallbackLanguages])]
    .map((v) => String(v || '').trim())
    .filter(Boolean)

  let lastError = null

  for (const languageCode of languages) {
    try {
      const result = await fetchJson(path, {
        query: queryBuilder(languageCode),
      })
      
      // Nếu là detail object và có nội dung, hoặc list có items
      if (result) return result
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

/**
 * Tương tự fetchWithLanguageFallback nhưng kiểm tra list items.
 */
async function fetchWithLanguageFallbackNonEmpty(path, queryBuilder, fallbackLanguages = ['vi']) {
  const currentLang = getCurrentLanguageCode()
  const languages = [...new Set([currentLang, ...fallbackLanguages])]
    .map((v) => String(v || '').trim())
    .filter(Boolean)

  let lastResult = null
  let lastError = null

  for (const languageCode of languages) {
    try {
      const result = await fetchJson(path, {
        query: queryBuilder(languageCode),
      })

      const items = result?.items
      if (Array.isArray(items) && items.length > 0) {
        return result
      }

      if (!lastResult) lastResult = result
    } catch (error) {
      lastError = error
    }
  }

  if (lastResult) return lastResult
  if (lastError) throw lastError

  return { items: [] }
}

export function getHealth() {
  return fetchJson('/health')
}

export function getBootstrap(query = {}) {
  return fetchJson('/public/bootstrap', { query: withLanguage(query) })
}

export function getBanners({ bannerType, ...query } = {}) {
  return fetchWithLanguageFallback(
    '/public/banners',
    (languageCode) => ({
      language_code: languageCode,
      banner_type: bannerType,
      ...query,
    })
  )
}

export function getPageDetail(slug, query = {}) {
  return fetchWithLanguageFallback(
    `/public/pages/${slug}`,
    (languageCode) => ({
      language_code: languageCode,
      ...query,
    })
  )
}

export function getProjects({ categorySlug, year, skip, limit, ...query } = {}) {
  return fetchWithLanguageFallbackNonEmpty(
    '/public/projects',
    (languageCode) => ({
      language_code: languageCode,
      category_slug: categorySlug,
      year,
      skip,
      limit,
      ...query,
    })
  )
}

export function getProjectDetail(slug, query = {}) {
  return fetchWithLanguageFallback(
    `/public/projects/${slug}`,
    (languageCode) => ({
      language_code: languageCode,
      ...query,
    })
  )
}

export function getProjectCasePage(categoryId, query = {}) {
  const normalizedCategoryId = String(categoryId || '').trim()
  const isNumericCategoryId = /^\d+$/.test(normalizedCategoryId)

  const path = isNumericCategoryId
    ? `/public/project-case/${normalizedCategoryId}`
    : '/public/project-case'

  return fetchJson(path, {
    query: withLanguage(query),
  })
}

export function getHonors({ awardYear, ...query } = {}) {
  return fetchWithLanguageFallbackNonEmpty(
    '/public/honors',
    (languageCode) => ({
      language_code: languageCode,
      award_year: awardYear,
      ...query,
    })
  )
}

export function getBranches({ branchType, ...query } = {}) {
  return fetchJson('/public/branches', {
    query: withLanguage({
      branch_type: branchType,
      ...query,
    }),
  })
}

export function getBranchDetail(slug, query = {}) {
  return fetchJson(`/public/branches/${slug}`, { query: withLanguage(query) })
}

export function getContacts(query = {}) {
  return fetchJson('/public/contacts', { query: withLanguage(query) })
}

export function getVideos(query = {}) {
  return fetchJson('/public/videos', { query: withLanguage(query) })
}

// ─── News ─────────────────────────────────────────────────────────────────

export function getNewsList({ skip, limit, keyword, ...query } = {}) {
  return fetchWithLanguageFallbackNonEmpty(
    '/public/news',
    (languageCode) => ({
      language_code: languageCode,
      skip,
      limit,
      keyword,
      ...query,
    })
  )
}

export function getNewsDetail(slug, query = {}) {
  return fetchWithLanguageFallback(
    `/public/news/${slug}`,
    (languageCode) => ({
      language_code: languageCode,
      ...query,
    })
  )
}

