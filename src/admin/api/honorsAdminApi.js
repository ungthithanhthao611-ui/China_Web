import { fetchJson } from '@/shared/lib/http'

function withAdminHeaders(token) {
  const normalized = String(token || '').trim()
  if (!normalized) {
    throw new Error('Admin access token is required.')
  }
  return { Authorization: `Bearer ${normalized}` }
}

export function listHonorCategories(token, query = {}) {
  return fetchJson('/admin/honors/categories', {
    headers: withAdminHeaders(token),
    query,
  })
}

export function createHonorCategory(token, payload) {
  return fetchJson('/admin/honors/categories', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function updateHonorCategory(token, categoryId, payload) {
  return fetchJson(`/admin/honors/categories/${categoryId}`, {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function deleteHonorCategory(token, categoryId) {
  return fetchJson(`/admin/honors/categories/${categoryId}`, {
    method: 'DELETE',
    headers: withAdminHeaders(token),
  })
}

export function listHonors(token, query = {}) {
  return fetchJson('/admin/honors', {
    headers: withAdminHeaders(token),
    query,
  })
}

export function getHonor(token, honorId) {
  return fetchJson(`/admin/honors/${honorId}`, {
    headers: withAdminHeaders(token),
  })
}

export function createHonor(token, payload) {
  return fetchJson('/admin/honors', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function updateHonor(token, honorId, payload) {
  return fetchJson(`/admin/honors/${honorId}`, {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function toggleHonorActive(token, honorId, isActive) {
  return fetchJson(`/admin/honors/${honorId}/active`, {
    method: 'PATCH',
    headers: withAdminHeaders(token),
    body: { is_active: Boolean(isActive) },
  })
}

export function softDeleteHonor(token, honorId) {
  return fetchJson(`/admin/honors/${honorId}`, {
    method: 'DELETE',
    headers: withAdminHeaders(token),
  })
}

export function resyncHonorsImagesToCloudinary(token) {
  return fetchJson('/admin/honors/resync-images', {
    method: 'POST',
    headers: withAdminHeaders(token),
  })
}
