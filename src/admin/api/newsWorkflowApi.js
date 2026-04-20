import axios, { AxiosError } from 'axios'

import { ADMIN_TOKEN_STORAGE_KEY } from '@/admin/constants/auth'
import { env } from '@/shared/config/env'

const client = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.httpTimeoutMs,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = String(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '').trim()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function toApiError(error) {
  if (error instanceof AxiosError) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Request failed.'
    return new Error(message)
  }

  return error instanceof Error ? error : new Error('Unexpected request error.')
}

function unwrap(payload) {
  if (payload?.success) {
    return payload.data
  }
  throw new Error(payload?.message || 'Request failed.')
}

export async function listAdminNews(params = {}) {
  try {
    const res = await client.get('/admin/news', { params })
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listNewsCategories() {
  try {
    const res = await client.get('/admin/news/categories')
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getAdminNews(postId) {
  try {
    const res = await client.get(`/admin/news/${postId}`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createAdminNews(payload) {
  try {
    const res = await client.post('/admin/news', payload)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateAdminNews(postId, payload) {
  try {
    const res = await client.put(`/admin/news/${postId}`, payload)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteAdminNews(postId) {
  try {
    const res = await client.delete(`/admin/news/${postId}`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function publishAdminNews(postId) {
  try {
    const res = await client.post(`/admin/news/${postId}/publish`, {
      force_generate_html: true,
    })
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function unpublishAdminNews(postId) {
  try {
    const res = await client.post(`/admin/news/${postId}/unpublish`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function archiveAdminNews(postId) {
  try {
    const res = await client.post(`/admin/news/${postId}/archive`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listNewsVersions(postId) {
  try {
    const res = await client.get(`/admin/news/${postId}/versions`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function uploadNewsImage(file, options = {}) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (options.title) formData.append('title', options.title)
    if (options.altText) formData.append('alt_text', options.altText)

    const res = await client.post('/admin/media/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listNewsImages(params = {}) {
  try {
    const res = await client.get('/admin/media/images', { params })
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function importSource(payload) {
  try {
    const res = await client.post('/admin/news/import-source', payload)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getImportSourceJob(jobId) {
  try {
    const res = await client.get(`/admin/news/import-source/${jobId}`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function applyImportSourceJob(jobId, payload = {}) {
  try {
    const res = await client.post(`/admin/news/import-source/${jobId}/apply`, payload)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function importWorkflowFile(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await client.post('/admin/posts/import-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000,
    })
    return res.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listPublicWorkflowNews(params = {}) {
  try {
    const res = await client.get('/news', { params })
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getPublicWorkflowNewsDetail(slug) {
  try {
    const res = await client.get(`/news/${slug}`)
    return unwrap(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}
