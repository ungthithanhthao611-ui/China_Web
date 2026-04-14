import { env } from '@/config/env'

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

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
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

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    const payload = await parseResponse(response)

    if (!response.ok) {
      const message =
        payload?.detail ||
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
