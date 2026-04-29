import i18n from '@/i18n'
import { fetchJson } from '@/shared/lib/http'

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

async function fetchWithLanguageFallback(path, queryBuilder, fallbackLanguages = ['vi']) {
  const currentLang = getCurrentLanguageCode()
  const languages = [...new Set([currentLang, ...fallbackLanguages])]
    .map((v) => String(v || '').trim())
    .filter(Boolean)

  let lastError = null

  for (const languageCode of languages) {
    try {
      const result = await fetchJson(path, {
        query: queryBuilder(languageCode),
      })
      if (result) return result
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

// ─── Product Categories ───────────────────────────────────────────────────────

/**
 * GET /public/product-categories
 * Returns { items: ProductCategory[], pagination: { total: number } }
 */
export function listProductCategories() {
  return fetchWithLanguageFallbackNonEmpty('/public/product-categories', (languageCode) => ({
    language_code: languageCode,
  }))
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /public/products
 * Params: category_slug?, skip?, limit?
 * Returns { items: Product[], pagination: { skip, limit, total } }
 */
export function listProducts({ categorySlug = '', skip = 0, limit = 12 } = {}) {
  return fetchWithLanguageFallbackNonEmpty('/public/products', (languageCode) => ({
    language_code: languageCode,
    category_slug: categorySlug,
    skip,
    limit,
  }))
}

/**
 * GET /public/products/:slug
 * Returns Product + related_products[]
 */
export function getProduct(slug) {
  return fetchWithLanguageFallback(`/public/products/${slug}`, (languageCode) => ({
    language_code: languageCode,
  }))
}

// ─── Inquiry ──────────────────────────────────────────────────────────────────

/**
 * POST /public/inquiries
 * Body: { full_name, email, phone?, company?, subject?, message, source_page?, product_id? }
 * Returns { success: true, id, message }
 */
export function submitInquiry(payload) {
  return fetchJson('/public/inquiries', {
    method: 'POST',
    body: payload,
  })
}

