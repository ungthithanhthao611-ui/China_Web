import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { cloneBlock, createDefaultBlock, slugFromTitle } from '@/admin/utils/news-workflow/blockFactory.js'
import { createDefaultNewsPageConfig, createEmptyNewsContentJson } from '@/admin/models/newsWorkflow.js'

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeGalleryImages(raw = []) {
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id || `img-${index + 1}-${Date.now()}`),
      src: String(item.src || ''),
      alt: String(item.alt || ''),
      caption: String(item.caption || ''),
    }))
}

function normalizeBlock(block) {
  if (block.type === 'image') {
    const props = block.props && typeof block.props === 'object' ? deepClone(block.props) : {}
    props.caption = String(props.caption || props.captionText || '')
    if (!props.captionPosition) {
      props.captionPosition = 'outside-bottom'
    }
    return {
      ...block,
      props,
    }
  }

  if (block.type !== 'gallery') {
    return block
  }

  const props = block.props && typeof block.props === 'object' ? deepClone(block.props) : {}
  const rawImages = Array.isArray(props.images)
    ? props.images
    : Array.isArray(props.items)
      ? props.items
      : []

  props.images = normalizeGalleryImages(rawImages)
  delete props.items

  return {
    ...block,
    props,
  }
}

function normalizeBlocks(rawBlocks = []) {
  return rawBlocks.map((item) => normalizeBlock(item))
}

function createDefaultPost() {
  return {
    title: 'Untitled article',
    slug: `untitled-${Date.now()}`,
    summary: '',
    thumbnail_url: '',
    content_json: createEmptyNewsContentJson(),
    content_html: '',
    source_url: '',
    source_note: '',
    status: 'draft',
    category_ids: [],
  }
}

export const useNewsWorkflowEditorStore = defineStore('newsWorkflowEditor', () => {
  const post = ref(createDefaultPost())
  const blocks = ref([])
  const page = ref(createDefaultNewsPageConfig())
  const selectedBlockId = ref(null)
  const selectedSubItemId = ref(null)
  const isDirty = ref(false)
  const historyStack = ref([])
  const redoStack = ref([])

  const selectedBlock = computed(() => blocks.value.find((item) => item.id === selectedBlockId.value) || null)

  function markDirty(value = true) {
    isDirty.value = value
  }

  function snapshot() {
    return {
      post: deepClone(post.value),
      blocks: deepClone(blocks.value),
      page: deepClone(page.value),
    }
  }

  function saveHistory() {
    const current = snapshot()
    const previous = historyStack.value[historyStack.value.length - 1]
    if (previous && JSON.stringify(previous) === JSON.stringify(current)) {
      return
    }
    historyStack.value = [...historyStack.value, current].slice(-80)
    redoStack.value = []
  }

  function undo() {
    if (!historyStack.value.length) return
    const previous = historyStack.value[historyStack.value.length - 1]
    historyStack.value = historyStack.value.slice(0, -1)
    redoStack.value = [snapshot(), ...redoStack.value].slice(0, 80)
    post.value = deepClone(previous.post)
    blocks.value = normalizeBlocks(deepClone(previous.blocks))
    page.value = deepClone(previous.page)
    selectedBlockId.value = null
    selectedSubItemId.value = null
    markDirty(true)
  }

  function redo() {
    if (!redoStack.value.length) return
    const next = redoStack.value[0]
    redoStack.value = redoStack.value.slice(1)
    historyStack.value = [...historyStack.value, snapshot()].slice(-80)
    post.value = deepClone(next.post)
    blocks.value = normalizeBlocks(deepClone(next.blocks))
    page.value = deepClone(next.page)
    selectedBlockId.value = null
    selectedSubItemId.value = null
    markDirty(true)
  }

  function resetEditor(data) {
    post.value = {
      ...createDefaultPost(),
      ...deepClone(data || {}),
    }
    if (!post.value.slug) {
      post.value.slug = slugFromTitle(post.value.title)
    }
    blocks.value = normalizeBlocks(deepClone(post.value.content_json?.blocks || []))
    page.value = deepClone(post.value.content_json?.page || createDefaultNewsPageConfig())
    selectedBlockId.value = null
    selectedSubItemId.value = null
    historyStack.value = []
    redoStack.value = []
    markDirty(false)
  }

  function setPostField(key, value) {
    saveHistory()
    post.value[key] = value
    if (key === 'title' && !post.value.id && !post.value.slug.startsWith('untitled-')) {
      post.value.slug = slugFromTitle(String(value || ''))
    }
    markDirty(true)
  }

  function setStatus(status) {
    saveHistory()
    post.value.status = status
    markDirty(true)
  }

  function selectBlock(id) {
    if (selectedBlockId.value !== id) {
      selectedSubItemId.value = null
    }
    selectedBlockId.value = id
  }

  function selectSubItem(id) {
    selectedSubItemId.value = id
  }

  function addBlock(type) {
    saveHistory()
    const block = normalizeBlock(createDefaultBlock(type, blocks.value))
    blocks.value = [...blocks.value, block]
    selectedBlockId.value = block.id
    selectedSubItemId.value = null
    markDirty(true)
    return block
  }

  function duplicateBlock(blockId) {
    const original = blocks.value.find((item) => item.id === blockId)
    if (!original) return
    saveHistory()
    const cloned = cloneBlock(original)
    blocks.value = [...blocks.value, normalizeBlock(cloned)]
    selectedBlockId.value = cloned.id
    selectedSubItemId.value = null
    markDirty(true)
  }

  function updateBlock(blockId, patch, options = {}) {
    if (options.recordHistory !== false) {
      saveHistory()
    }
    const nextPatch = deepClone(patch)
    if (nextPatch.type === 'gallery' && nextPatch.props) {
      const source = Array.isArray(nextPatch.props.images)
        ? nextPatch.props.images
        : Array.isArray(nextPatch.props.items)
          ? nextPatch.props.items
          : null
      if (source) {
        nextPatch.props.images = normalizeGalleryImages(source)
      }
      delete nextPatch.props.items
    }

    blocks.value = blocks.value.map((item) => (item.id === blockId ? normalizeBlock({ ...item, ...nextPatch }) : item))
    markDirty(true)
  }

  function updateBlockProps(blockId, patch, options = {}) {
    const block = blocks.value.find((item) => item.id === blockId)
    if (!block) return
    const nextPatch = deepClone(patch)
    if (block.type === 'gallery') {
      const source = Array.isArray(nextPatch.images)
        ? nextPatch.images
        : Array.isArray(nextPatch.items)
          ? nextPatch.items
          : null
      if (source) {
        nextPatch.images = normalizeGalleryImages(source)
      }
      delete nextPatch.items
    }

    updateBlock(
      blockId,
      {
        props: {
          ...(block.props || {}),
          ...nextPatch,
        },
      },
      options
    )
  }

  function updateBlockContent(blockId, content, options = {}) {
    updateBlock(blockId, { content }, options)
  }

  function moveBlock(blockId, x, y, options = {}) {
    updateBlock(blockId, { x, y }, options)
  }

  function resizeBlock(blockId, w, h, options = {}) {
    updateBlock(blockId, { w, h }, options)
  }

  function deleteBlock(blockId) {
    saveHistory()
    blocks.value = blocks.value.filter((item) => item.id !== blockId)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
      selectedSubItemId.value = null
    }
    markDirty(true)
  }

  function setPage(patch) {
    saveHistory()
    page.value = {
      ...page.value,
      ...deepClone(patch),
    }
    markDirty(true)
  }

  function loadContentJson(contentJson) {
    saveHistory()
    page.value = deepClone(contentJson?.page || createDefaultNewsPageConfig())
    blocks.value = normalizeBlocks(deepClone(contentJson?.blocks || []))
    selectedBlockId.value = null
    selectedSubItemId.value = null
    markDirty(true)
  }

  function exportContentJson() {
    return {
      page: deepClone(page.value),
      blocks: deepClone(blocks.value),
    }
  }

  function exportHtml() {
    const fragments = ['<article class="news-workflow-content">']
    for (const block of blocks.value) {
      const props = block.props || {}
      if (block.type === 'text') {
        fragments.push(`<section>${block.content || ''}</section>`)
        continue
      }
      if (block.type === 'heading') {
        const tag = ['h1', 'h2', 'h3'].includes(String(props.level)) ? String(props.level) : 'h2'
        fragments.push(`<${tag}>${block.content || ''}</${tag}>`)
        continue
      }
      if (block.type === 'image' && props.src) {
        fragments.push(
          `<figure><img src="${props.src}" alt="${props.alt || ''}" />${props.caption ? `<figcaption>${props.caption}</figcaption>` : ''}</figure>`
        )
        continue
      }
      if (block.type === 'gallery') {
        const images = Array.isArray(props.images)
          ? props.images.filter((item) => String(item?.src || '').trim())
          : []
        if (!images.length) continue

        const columns = Math.max(1, Math.min(6, Number(props.columns || 3)))
        const gap = Math.max(0, Number(props.gap || 12))
        const borderRadius = Math.max(0, Number(props.borderRadius || 8))
        const objectFit = String(props.objectFit || 'cover')
        fragments.push(`<section style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:${gap}px;">`)
        for (const item of images) {
          fragments.push(
            `<figure><img src="${item.src}" alt="${item.alt || ''}" style="width:100%;height:100%;object-fit:${objectFit};border-radius:${borderRadius}px;" />${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}</figure>`
          )
        }
        fragments.push('</section>')
        continue
      }
      if (block.type === 'quote') {
        fragments.push(`<blockquote>${block.content || ''}</blockquote>`)
        continue
      }
      if (block.type === 'divider') {
        fragments.push('<hr />')
        continue
      }
      if (block.type === 'two_column') {
        fragments.push(
          `<section style="display:grid;grid-template-columns:1fr 1fr;gap:${props.gap || 24}px;"><div>${props.leftContent || ''}</div><div>${props.rightContent || ''}</div></section>`
        )
      }
    }
    fragments.push('</article>')
    return fragments.join('')
  }

  return {
    post,
    blocks,
    page,
    selectedBlockId,
    selectedSubItemId,
    selectedBlock,
    isDirty,
    historyStack,
    redoStack,
    resetEditor,
    setPostField,
    setStatus,
    selectBlock,
    selectSubItem,
    addBlock,
    duplicateBlock,
    updateBlock,
    updateBlockProps,
    updateBlockContent,
    moveBlock,
    resizeBlock,
    deleteBlock,
    setPage,
    loadContentJson,
    exportContentJson,
    exportHtml,
    undo,
    redo,
    markDirty,
    saveHistory,
  }
})
