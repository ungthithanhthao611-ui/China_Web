import { fetchJson } from '@/shared/lib/http'

export function register(payload) {
  return fetchJson('/user/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export function login(payload) {
  return fetchJson('/user/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function getMe() {
  const token = localStorage.getItem('user_token')
  if (!token) return Promise.reject(new Error('No token found'))
  
  return fetchJson('/user/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
