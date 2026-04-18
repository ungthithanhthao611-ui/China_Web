import axios, { AxiosError } from 'axios'

import { ADMIN_TOKEN_STORAGE_KEY } from '@/admin/constants/auth'
import { env } from '@/config/env'

type Params = Record<string, any>

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

function toApiError(error: unknown): Error {
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

function unwrap<T>(payload: any): T {
  if (payload?.success) {
    return payload.data as T
  }
  throw new Error(payload?.message || 'Request failed.')
}

export async function listAdminNews(params: Params = {}) {
  try {
    const res = await client.get('/admin/news', { params })
    return unwrap<{ items: any[]; pagination: { total: number; page: number; limit: number } }>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listNewsCategories() {
  try {
    const res = await client.get('/admin/news/categories')
    return unwrap<any[]>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getAdminNews(postId: number | string) {
  try {
    const res = await client.get(`/admin/news/${postId}`)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createAdminNews(payload: any) {
  try {
    const res = await client.post('/admin/news', payload)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateAdminNews(postId: number | string, payload: any) {
  try {
    const res = await client.put(`/admin/news/${postId}`, payload)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteAdminNews(postId: number | string) {
  try {
    const res = await client.delete(`/admin/news/${postId}`)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function publishAdminNews(postId: number | string) {
  try {
    const res = await client.post(`/admin/news/${postId}/publish`, {
      force_generate_html: true,
    })
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function unpublishAdminNews(postId: number | string) {
  try {
    const res = await client.post(`/admin/news/${postId}/unpublish`)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function archiveAdminNews(postId: number | string) {
  try {
    const res = await client.post(`/admin/news/${postId}/archive`)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listNewsVersions(postId: number | string) {
  try {
    const res = await client.get(`/admin/news/${postId}/versions`)
    return unwrap<any[]>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function uploadNewsImage(file: File, options: { title?: string; altText?: string } = {}) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    if (options.title) formData.append('title', options.title)
    if (options.altText) formData.append('alt_text', options.altText)

    const res = await client.post('/admin/media/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listNewsImages(params: Params = {}) {
  try {
    const res = await client.get('/admin/media/images', { params })
    return unwrap<{ items: any[]; pagination: { total: number; page: number; limit: number } }>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function importSource(payload: { source_url: string; source_note?: string }) {
  try {
    const res = await client.post('/admin/news/import-source', payload)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getImportSourceJob(jobId: number | string) {
  try {
    const res = await client.get(`/admin/news/import-source/${jobId}`)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function applyImportSourceJob(
  jobId: number | string,
  payload: {
    post_id?: number
    source_note?: string
  } = {}
) {
  try {
    const res = await client.post(`/admin/news/import-source/${jobId}/apply`, payload)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function importWorkflowFile(file: File) {
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
export async function listPublicWorkflowNews(params: Params = {}) {
  try {
    const res = await client.get('/news', { params })
    return unwrap<{ items: any[]; pagination: { total: number; page: number; limit: number } }>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getPublicWorkflowNewsDetail(slug: string) {
  try {
    const res = await client.get(`/news/${slug}`)
    return unwrap<any>(res.data)
  } catch (error) {
    throw toApiError(error)
  }
}


