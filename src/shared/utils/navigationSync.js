export const NAVIGATION_MENUS_SYNC_KEY = 'china_decor.navigation.menus.updated_at'

export function readNavigationMenusRevision() {
  const rawValue = localStorage.getItem(NAVIGATION_MENUS_SYNC_KEY)
  const parsedValue = Number.parseInt(String(rawValue || ''), 10)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export function publishNavigationMenusUpdated() {
  const revision = Date.now()
  localStorage.setItem(NAVIGATION_MENUS_SYNC_KEY, String(revision))
  return revision
}
