import { fetchJson } from '@/lib/http'

const ADMIN_TOKEN_HEADER = 'X-Admin-Token'

function withAdminHeaders(token) {
  const normalized = String(token || '').trim()
  if (!normalized) {
    throw new Error('Admin token is required.')
  }

  return {
    [ADMIN_TOKEN_HEADER]: normalized,
  }
}

export function getAdminEntities(token) {
  return fetchJson('/admin/entities', {
    headers: withAdminHeaders(token),
  })
}

export function listAdminEntityRecords(entityName, token, query = {}) {
  return fetchJson(`/admin/${entityName}`, {
    headers: withAdminHeaders(token),
    query,
  })
}

export function getAdminEntityRecord(entityName, recordId, token) {
  return fetchJson(`/admin/${entityName}/${recordId}`, {
    headers: withAdminHeaders(token),
  })
}

export function createAdminEntityRecord(entityName, payload, token) {
  return fetchJson(`/admin/${entityName}`, {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function updateAdminEntityRecord(entityName, recordId, payload, token) {
  return fetchJson(`/admin/${entityName}/${recordId}`, {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function deleteAdminEntityRecord(entityName, recordId, token) {
  return fetchJson(`/admin/${entityName}/${recordId}`, {
    method: 'DELETE',
    headers: withAdminHeaders(token),
  })
}

export function listNavigationMenus(token, query = {}) {
  return fetchJson('/admin/navigation/menus', {
    headers: withAdminHeaders(token),
    query,
  })
}

export function createNavigationMenu(token, payload) {
  return fetchJson('/admin/navigation/menus', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function updateNavigationMenu(menuId, token, payload) {
  return fetchJson(`/admin/navigation/menus/${menuId}`, {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function deleteNavigationMenu(menuId, token) {
  return fetchJson(`/admin/navigation/menus/${menuId}`, {
    method: 'DELETE',
    headers: withAdminHeaders(token),
  })
}

export function replaceNavigationMenuTree(menuId, token, items) {
  return fetchJson(`/admin/navigation/menus/${menuId}/tree`, {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: { items },
  })
}
