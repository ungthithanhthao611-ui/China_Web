const NEWS_WORKFLOW_FLASH_KEY = 'admin-news-workflow-flash'

export function pushNewsWorkflowFlash(type, message) {
  const normalized = String(message || '').trim()
  if (!normalized) return

  try {
    sessionStorage.setItem(
      NEWS_WORKFLOW_FLASH_KEY,
      JSON.stringify({
        type: type === 'error' ? 'error' : 'success',
        message: normalized,
      })
    )
  } catch {
    // ignore storage errors
  }
}

export function consumeNewsWorkflowFlash() {
  try {
    const raw = sessionStorage.getItem(NEWS_WORKFLOW_FLASH_KEY)
    sessionStorage.removeItem(NEWS_WORKFLOW_FLASH_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const message = String(parsed?.message || '').trim()
    if (!message) return null

    return {
      type: parsed?.type === 'error' ? 'error' : 'success',
      message,
    }
  } catch {
    sessionStorage.removeItem(NEWS_WORKFLOW_FLASH_KEY)
    return null
  }
}
