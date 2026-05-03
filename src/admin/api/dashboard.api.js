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

export function getDashboardStats(token, params = {}) {
  return fetchJson('/admin/dashboard/stats', {
    headers: withAdminHeaders(token),
    query: params,
  })
}

export function getDashboardRevenue(token, params = {}) {
  return fetchJson('/admin/dashboard/revenue', {
    headers: withAdminHeaders(token),
    query: params,
  })
}

export function getPublicSiteSettings(params = {}) {
  return fetchJson('/public/site-settings', {
    query: params,
  })
}
