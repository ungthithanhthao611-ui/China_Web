import { fetchJson } from '@/lib/http'

function withAdminHeaders(token) {
  const normalized = String(token || '').trim()
  if (!normalized) {
    throw new Error('Admin access token is required.')
  }

  return {
    Authorization: `Bearer ${normalized}`,
  }
}

export function getPostDocument(postId, token) {
  return fetchJson(`/admin/posts/${postId}/document`, {
    headers: withAdminHeaders(token),
    timeoutMs: 30000,
  })
}

export function uploadPostDocument(postId, token, file) {
  const formData = new FormData()
  formData.append('file', file)

  return fetchJson(`/admin/posts/${postId}/document`, {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: formData,
    timeoutMs: 60000,
  })
}

export function getOnlyOfficeConfig(postId, token) {
  return fetchJson(`/admin/posts/${postId}/onlyoffice-config`, {
    headers: withAdminHeaders(token),
    timeoutMs: 30000,
  })
}

export function convertPostDocumentToHtml(postId, token) {
  return fetchJson(`/admin/posts/${postId}/convert-html`, {
    method: 'POST',
    headers: withAdminHeaders(token),
    timeoutMs: 90000,
  })
}
