export function trimOrUndefined(value) {
  const normalized = String(value || '').trim()
  return normalized || undefined
}

export function toIntOrUndefined(value) {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const number = Number.parseInt(String(value), 10)
  return Number.isFinite(number) ? number : undefined
}

export function itemSlugFromUrl(url) {
  const path = String(url || '')
    .split('#')[0]
    .split('?')[0]
  const chunks = path.split('/').filter(Boolean)
  return chunks[chunks.length - 1] || 'root'
}

export function findNodeContextByCid(targetCid, nodes = []) {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node._cid === targetCid) {
      return { nodes, index, node }
    }

    const nested = findNodeContextByCid(targetCid, node.children || [])
    if (nested) {
      return nested
    }
  }
  return null
}

export function createNavigationTreeHelpers() {
  let nodeCounter = 0

  function nextNodeCid() {
    nodeCounter += 1
    return `menu-node-${nodeCounter}`
  }

  function normalizeTreeNode(node) {
    return {
      id: node.id ?? null,
      title: node.title || '',
      url: node.url || '/',
      target: node.target || '',
      item_type: node.item_type || '',
      page_id: node.page_id ?? '',
      anchor: node.anchor || '',
      sort_order: node.sort_order ?? 0,
      children: (node.children || [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((child) => normalizeTreeNode(child)),
      _cid: nextNodeCid(),
    }
  }

  function hydrateTree(nodes = []) {
    return nodes
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((node) => normalizeTreeNode(node))
  }

  function serializeTree(nodes = []) {
    return nodes.map((node, index) => ({
      ...(node.id ? { id: node.id } : {}),
      title: String(node.title || '').trim() || 'Untitled',
      url: String(node.url || '').trim() || '/',
      target: trimOrUndefined(node.target),
      item_type: trimOrUndefined(node.item_type),
      page_id: toIntOrUndefined(node.page_id),
      anchor: trimOrUndefined(node.anchor),
      sort_order: toIntOrUndefined(node.sort_order) ?? index * 10,
      children: serializeTree(node.children || []),
    }))
  }

  function createEmptyNode() {
    return {
      id: null,
      title: 'New Item',
      url: '/',
      target: '',
      item_type: '',
      page_id: '',
      anchor: '',
      sort_order: 0,
      children: [],
      _cid: nextNodeCid(),
    }
  }

  return {
    hydrateTree,
    serializeTree,
    createEmptyNode,
  }
}
