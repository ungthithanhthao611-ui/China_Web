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

export function getAdminProfile(token) {
  return fetchJson('/admin/profile', {
    headers: withAdminHeaders(token),
  })
}

export function updateAdminProfile(token, payload) {
  return fetchJson('/admin/profile', {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function uploadAdminProfileAvatar(token, file) {
  const formData = new FormData()
  formData.append('file', file)

  return fetchJson('/upload/image', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: formData,
    timeoutMs: 60000,
  })
}
