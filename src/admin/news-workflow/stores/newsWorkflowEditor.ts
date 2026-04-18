import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { NewsContentJson, NewsEditorBlock, NewsPageConfig, NewsPostModel, NewsStatus } from '@/admin/news-workflow/types/newsWorkflow'
import { cloneBlock, createDefaultBlock, slugFromTitle } from '@/admin/news-workflow/utils/blockFactory'

interface Snapshot {
  post: NewsPostModel
  blocks: NewsEditorBlock[]
  page: NewsPageConfig
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function normalizeGalleryImages(raw: any[]): Record<string, any>[] {
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id || `img-${index + 1}-${Date.now()}`),
      src: String(item.src || ''),
      alt: String(item.alt || ''),
      caption: String(item.caption || ''),
    }))
}

function normalizeBlock(block: NewsEditorBlock): NewsEditorBlock {
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

function normalizeBlocks(rawBlocks: NewsEditorBlock[] = []): NewsEditorBlock[] {
  return rawBlocks.map((item) => normalizeBlock(item))
}

function createDefaultPost(): NewsPostModel {
  return {
    title: 'Untitled article',
    slug: `untitled-${Date.now()}`,
    summary: '',
    thumbnail_url: '',
    content_json: {
      page: { width: 900, background: '#ffffff' },
      blocks: [],
    },
    content_html: '',
    source_url: '',
    source_note: '',
    status: 'draft',
    category_ids: [],
  }
}

export const useNewsWorkflowEditorStore = defineStore('newsWorkflowEditor', () => {
  const post = ref<NewsPostModel>(createDefaultPost())
  const blocks = ref<NewsEditorBlock[]>([])
  const page = ref<NewsPageConfig>({ width: 900, background: '#ffffff' })
  const selectedBlockId = ref<string | null>(null)
  const selectedSubItemId = ref<string | null>(null)
  const isDirty = ref(false)
  const historyStack = ref<Snapshot[]>([])
  const redoStack = ref<Snapshot[]>([])

  const selectedBlock = computed(() => blocks.value.find((item) => item.id === selectedBlockId.value) || null)

  function markDirty(value = true) {
    isDirty.value = value
  }

  function snapshot(): Snapshot {
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

  function resetEditor(data?: Partial<NewsPostModel>) {
    post.value = {
      ...createDefaultPost(),
      ...deepClone(data || {}),
    }
    if (!post.value.slug) {
      post.value.slug = slugFromTitle(post.value.title)
    }
    blocks.value = normalizeBlocks(deepClone(post.value.content_json?.blocks || []))
    page.value = deepClone(post.value.content_json?.page || { width: 900, background: '#ffffff' })
    selectedBlockId.value = null
    selectedSubItemId.value = null
    historyStack.value = []
    redoStack.value = []
    markDirty(false)
  }

  function setPostField<K extends keyof NewsPostModel>(key: K, value: NewsPostModel[K]) {
    saveHistory()
    ;(post.value[key] as NewsPostModel[K]) = value
    if (key === 'title' && !post.value.id && !post.value.slug.startsWith('untitled-')) {
      post.value.slug = slugFromTitle(String(value || ''))
    }
    markDirty(true)
  }

  function setStatus(status: NewsStatus) {
    saveHistory()
    post.value.status = status
    markDirty(true)
  }

  function selectBlock(id: string | null) {
    if (selectedBlockId.value !== id) {
      selectedSubItemId.value = null
    }
    selectedBlockId.value = id
  }

  function selectSubItem(id: string | null) {
    selectedSubItemId.value = id
  }

  function addBlock(type: NewsEditorBlock['type']) {
    saveHistory()
    const block = normalizeBlock(createDefaultBlock(type, blocks.value))
    blocks.value = [...blocks.value, block]
    selectedBlockId.value = block.id
    selectedSubItemId.value = null
    markDirty(true)
    return block
  }

  function duplicateBlock(blockId: string) {
    const original = blocks.value.find((item) => item.id === blockId)
    if (!original) return
    saveHistory()
    const cloned = cloneBlock(original)
    blocks.value = [...blocks.value, normalizeBlock(cloned)]
    selectedBlockId.value = cloned.id
    selectedSubItemId.value = null
    markDirty(true)
  }

  function updateBlock(blockId: string, patch: Partial<NewsEditorBlock>, options: { recordHistory?: boolean } = {}) {
    if (options.recordHistory !== false) {
      saveHistory()
    }
    const nextPatch = deepClone(patch)
    if (nextPatch.type === 'gallery' && nextPatch.props) {
      const source = Array.isArray((nextPatch.props as any).images)
        ? (nextPatch.props as any).images
        : Array.isArray((nextPatch.props as any).items)
          ? (nextPatch.props as any).items
          : null
      if (source) {
        ;(nextPatch.props as any).images = normalizeGalleryImages(source)
      }
      delete (nextPatch.props as any).items
    }

    blocks.value = blocks.value.map((item) => (item.id === blockId ? normalizeBlock({ ...item, ...nextPatch }) : item))
    markDirty(true)
  }

  function updateBlockProps(blockId: string, patch: Record<string, any>, options: { recordHistory?: boolean } = {}) {
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

  function updateBlockContent(blockId: string, content: string, options: { recordHistory?: boolean } = {}) {
    updateBlock(blockId, { content }, options)
  }

  function moveBlock(blockId: string, x: number, y: number, options: { recordHistory?: boolean } = {}) {
    updateBlock(blockId, { x, y }, options)
  }

  function resizeBlock(blockId: string, w: number, h: number, options: { recordHistory?: boolean } = {}) {
    updateBlock(blockId, { w, h }, options)
  }

  function deleteBlock(blockId: string) {
    saveHistory()
    blocks.value = blocks.value.filter((item) => item.id !== blockId)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
      selectedSubItemId.value = null
    }
    markDirty(true)
  }

  function setPage(patch: Partial<NewsPageConfig>) {
    saveHistory()
    page.value = {
      ...page.value,
      ...deepClone(patch),
    }
    markDirty(true)
  }

  function loadContentJson(contentJson: NewsContentJson) {
    saveHistory()
    page.value = deepClone(contentJson?.page || { width: 900, background: '#ffffff' })
    blocks.value = normalizeBlocks(deepClone(contentJson?.blocks || []))
    selectedBlockId.value = null
    selectedSubItemId.value = null
    markDirty(true)
  }

  function exportContentJson(): NewsContentJson {
    return {
      page: deepClone(page.value),
      blocks: deepClone(blocks.value),
    }
  }

  function exportHtml(): string {
    const fragments: string[] = ['<article class="news-workflow-content">']
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
          `<figure><img src="${props.src}" alt="${props.alt || ''}" />${
            props.caption ? `<figcaption>${props.caption}</figcaption>` : ''
          }</figure>`
        )
        continue
      }
      if (block.type === 'gallery') {
        const images = Array.isArray(props.images)
          ? props.images.filter((item: any) => String(item?.src || '').trim())
          : []
        if (!images.length) continue

        const columns = Math.max(1, Math.min(6, Number(props.columns || 3)))
        const gap = Math.max(0, Number(props.gap || 12))
        const borderRadius = Math.max(0, Number(props.borderRadius || 8))
        const objectFit = String(props.objectFit || 'cover')
        fragments.push(`<section style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:${gap}px;">`)
        for (const item of images) {
          fragments.push(
            `<figure><img src="${item.src}" alt="${item.alt || ''}" style="width:100%;height:100%;object-fit:${objectFit};border-radius:${borderRadius}px;" />${
              item.caption ? `<figcaption>${item.caption}</figcaption>` : ''
            }</figure>`
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
          `<section style="display:grid;grid-template-columns:1fr 1fr;gap:${props.gap || 24}px;"><div>${
            props.leftContent || ''
          }</div><div>${props.rightContent || ''}</div></section>`
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
