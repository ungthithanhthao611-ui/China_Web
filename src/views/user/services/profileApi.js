import { fetchJson } from '@/shared/lib/http'

function getAuthHeader() {
  const token = localStorage.getItem('user_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getMyProfile() {
  return fetchJson('/user/auth/me', {
    headers: getAuthHeader(),
  })
}

export function updateMyProfile(payload) {
  return fetchJson('/user/auth/me', {
    method: 'PUT',
    headers: getAuthHeader(),
    body: payload,
  })
}

export function changeMyPassword(payload) {
  return fetchJson('/user/auth/me/change-password', {
    method: 'POST',
    headers: getAuthHeader(),
    body: payload,
  })
}

export function uploadMyAvatar(file, metadata = {}) {
  const formData = new FormData()
  formData.append('file', file)
  if (metadata.title) {
    formData.append('title', metadata.title)
  }

  return fetchJson('/user/auth/me/avatar', {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
    timeoutMs: 60000,
  })
}

export function getMyOrderHistory() {
  return fetchJson('/user/auth/me/orders', {
    headers: getAuthHeader(),
  })
}
