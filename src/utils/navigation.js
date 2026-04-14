function normalizePath(value) {
  const raw = String(value || '').trim()

  if (!raw) {
    return '/'
  }

  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:')
  ) {
    return raw
  }

  if (raw.startsWith('#')) {
    return raw
  }

  return raw.startsWith('/') ? raw : `/${raw}`
}

function appendAnchor(path, anchor) {
  if (!anchor) {
    return path
  }

  const normalizedAnchor = anchor.startsWith('#') ? anchor : `#${anchor}`

  if (path.includes('#')) {
    return path
  }

  return `${path}${normalizedAnchor}`
}

export function isExternalPath(path) {
  return /^(https?:\/\/|mailto:|tel:)/i.test(String(path || ''))
}

export function normalizeMenuItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => {
      const path = appendAnchor(normalizePath(item.url || item.path), item.anchor)

      return {
        name: item.title || item.name || 'Untitled',
        path,
        target: item.target || '',
        external: isExternalPath(path),
        children: normalizeMenuItems(item.children || []),
      }
    })
}

export function findMenuItems(menus = {}, aliases = []) {
  const entries = Object.entries(menus || {})
  if (!entries.length) {
    return []
  }

  const normalizedAliases = aliases.map((alias) => alias.toLowerCase())

  const exactMatch = entries.find(([key]) => normalizedAliases.includes(key.toLowerCase()))
  if (exactMatch) {
    return exactMatch[1]?.items || []
  }

  const nameMatch = entries.find(([, value]) =>
    normalizedAliases.includes(String(value?.name || '').toLowerCase())
  )
  if (nameMatch) {
    return nameMatch[1]?.items || []
  }

  const includesMatch = entries.find(([key]) =>
    normalizedAliases.some((alias) => key.toLowerCase().includes(alias))
  )
  if (includesMatch) {
    return includesMatch[1]?.items || []
  }

  return entries[0]?.[1]?.items || []
}

export function toLinkProps(item) {
  if (item?.external) {
    return {
      href: item.path,
      target: item.target || '_blank',
      rel: 'noopener noreferrer',
    }
  }

  return {
    to: item?.path || '/',
    target: item?.target || undefined,
  }
}
