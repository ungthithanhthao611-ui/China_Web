import { fetchJson } from '@/shared/lib/http'

function withAdminHeaders(token) {
  const normalized = String(token || '').trim()
  if (!normalized) {
    throw new Error('Admin access token is required.')
  }

  return {
    Authorization: `Bearer ${normalized}`,
  }
}

export function fetchPostSourcePreview(token, payload) {
  return fetchJson('/admin/posts/source-preview', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: payload,
    timeoutMs: 45000,
  })
}

export function importPostSourceFile(token, file) {
  const formData = new FormData()
  formData.append('file', file)

  return fetchJson('/admin/posts/import-preview', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: formData,
    timeoutMs: 90000,
  })
}
