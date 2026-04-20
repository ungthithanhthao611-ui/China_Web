const FALLBACK_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'
const FALLBACK_LANGUAGE_CODE = 'en'
const FALLBACK_HTTP_TIMEOUT_MS = 15000
const FALLBACK_ONLYOFFICE_DOCS_URL = 'http://127.0.0.1:8082'
const FALLBACK_ONLYOFFICE_CALLBACK_PROXY_URL = 'http://127.0.0.1:8000'

function normalizeBaseUrl(value) {
  return String(value || FALLBACK_API_BASE_URL).replace(/\/+$/, '')
}

function parseTimeout(value) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : FALLBACK_HTTP_TIMEOUT_MS
}

export const env = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  languageCode: String(import.meta.env.VITE_LANGUAGE_CODE || FALLBACK_LANGUAGE_CODE),
  httpTimeoutMs: parseTimeout(import.meta.env.VITE_HTTP_TIMEOUT_MS),
  onlyOfficeDocsUrl: normalizeBaseUrl(import.meta.env.VITE_ONLYOFFICE_DOCS_URL || FALLBACK_ONLYOFFICE_DOCS_URL),
  onlyOfficeCallbackProxyUrl: normalizeBaseUrl(
    import.meta.env.VITE_ONLYOFFICE_CALLBACK_PROXY_URL || FALLBACK_ONLYOFFICE_CALLBACK_PROXY_URL
  ),
  isDev: import.meta.env.DEV,
}
