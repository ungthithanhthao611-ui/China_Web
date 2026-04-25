import { env } from '@/shared/config/env'
import { clearAdminSession } from '@/views/admin/shared/constants/auth'

export class HttpError extends Error {
  constructor(message, { status = 0, statusText = '', url = '', body = null } = {}) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.statusText = statusText
    this.url = url
    this.body = body
  }
}

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${env.apiBaseUrl}${normalizedPath}`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item))
        return
      }

      url.searchParams.set(key, String(value))
    })
  }

  return url
}

function shouldHandleAdminUnauthorized(url) {
  return url.includes('/api/v1/admin') || url.includes('/api/v1/auth/me')
}

async function parseResponse(response) {
  if (response.status === 204 || response.status === 205) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const contentLength = response.headers.get('content-length')

  if (contentLength === '0') {
    return null
  }

  if (contentType.includes('application/json')) {
    const text = await response.text()
    return text ? JSON.parse(text) : null
  }

  const text = await response.text()
  return text ? { message: text } : null
}

export async function fetchJson(path, options = {}) {
  const {
    method = 'GET',
    query,
    body,
    headers = {},
    signal,
    timeoutMs = env.httpTimeoutMs,
  } = options

  const url = buildUrl(path, query)
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  const isFormData = body instanceof FormData

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    })

    const payload = await parseResponse(response)

    if (!response.ok) {
      if (response.status === 401 && shouldHandleAdminUnauthorized(url.toString())) {
        clearAdminSession({
          broadcast: true,
          reason: 'expired',
        })
      }

      const detail = payload?.detail
      const normalizedDetail = Array.isArray(detail)
        ? detail
            .map((item) => {
              if (typeof item === 'string') return item
              if (item?.msg) {
                const path = Array.isArray(item.loc) ? item.loc.slice(1).join('.') : ''
                return path ? `${path}: ${item.msg}` : item.msg
              }
              try {
                return JSON.stringify(item)
              } catch {
                return String(item)
              }
            })
            .join('; ')
        : detail

      const message =
        normalizedDetail ||
        payload?.message ||
        `${response.status} ${response.statusText || 'Request failed'}`

      throw new HttpError(message, {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        body: payload,
      })
    }

    return payload
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    if (error?.name === 'AbortError') {
      throw new HttpError(`Request timed out after ${timeoutMs}ms`, {
        url: url.toString(),
      })
    }

    if (error instanceof TypeError) {
      throw new HttpError(`Cannot connect to API server at ${env.apiBaseUrl}.`, {
        url: url.toString(),
      })
    }

    throw new HttpError(error?.message || 'Network request failed', {
      url: url.toString(),
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
}
