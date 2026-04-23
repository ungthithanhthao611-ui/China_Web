import { fetchJson } from '@/shared/lib/http'

const ADMIN_ENTITY_ALIASES = Object.freeze({
  categories: 'product_categories',
  inquiries: 'inquiry_submissions',
})

function withAdminHeaders(token) {
  const normalized = String(token || '').trim()
  if (!normalized) {
    throw new Error('Admin access token is required.')
  }

  return {
    Authorization: `Bearer ${normalized}`,
  }
}

function normalizeAdminEntityName(entityName) {
  const normalized = String(entityName || '').trim()
  return ADMIN_ENTITY_ALIASES[normalized] || normalized
}

export function loginAdmin(username, password) {
  return fetchJson('/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function getCurrentAdminUser(token) {
  return fetchJson('/auth/me', {
    headers: withAdminHeaders(token),
  })
}

export function getAdminEntities(token) {
  return fetchJson('/admin/entities', {
    headers: withAdminHeaders(token),
  })
}

export function listAdminEntityRecords(entityName, token, query = {}, options = {}) {
  const timeoutMs = Number(options.timeoutMs)
  const normalizedEntityName = normalizeAdminEntityName(entityName)
  return fetchJson(`/admin/${normalizedEntityName}`, {
    headers: withAdminHeaders(token),
    query,
    ...(Number.isFinite(timeoutMs) && timeoutMs > 0 ? { timeoutMs } : {}),
  })
}

export function getAdminEntityRecord(entityName, recordId, token) {
  const normalizedEntityName = normalizeAdminEntityName(entityName)
  return fetchJson(`/admin/${normalizedEntityName}/${recordId}`, {
    headers: withAdminHeaders(token),
  })
}

export function createAdminEntityRecord(entityName, payload, token) {
  const normalizedEntityName = normalizeAdminEntityName(entityName)
  return fetchJson(`/admin/${normalizedEntityName}`, {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function updateAdminEntityRecord(entityName, recordId, payload, token) {
  const normalizedEntityName = normalizeAdminEntityName(entityName)
  return fetchJson(`/admin/${normalizedEntityName}/${recordId}`, {
    method: 'PUT',
    headers: withAdminHeaders(token),
    body: payload,
  })
}

export function deleteAdminEntityRecord(entityName, recordId, token) {
  const normalizedEntityName = normalizeAdminEntityName(entityName)
  return fetchJson(`/admin/${normalizedEntityName}/${recordId}`, {
    method: 'DELETE',
    headers: withAdminHeaders(token),
  })
}

export function uploadAdminMediaAsset(token, file, metadata = {}) {
  const formData = new FormData()
  formData.append('file', file)
  if (metadata.title) {
    formData.append('title', metadata.title)
  }
  if (metadata.altText) {
    formData.append('alt_text', metadata.altText)
  }
  if (metadata.assetFolder) {
    formData.append('asset_folder', metadata.assetFolder)
  }
  if (metadata.publicIdBase) {
    formData.append('public_id_base', metadata.publicIdBase)
  }

  return fetchJson('/admin/media/upload', {
    method: 'POST',
    headers: withAdminHeaders(token),
    body: formData,
    timeoutMs: 60000,
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
