export const ADMIN_TOKEN_STORAGE_KEY = 'china_web_admin_token'
export const ADMIN_USER_STORAGE_KEY = 'china_web_admin_user'
export const ADMIN_SESSION_EXPIRED_EVENT = 'china-admin-session-expired'

export function getStoredAdminToken() {
  return String(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '').trim()
}

export function clearAdminSession({ broadcast = false, reason = 'unauthorized' } = {}) {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY)

  if (broadcast) {
    window.dispatchEvent(
      new CustomEvent(ADMIN_SESSION_EXPIRED_EVENT, {
        detail: {
          reason,
        },
      }),
    )
  }
}
