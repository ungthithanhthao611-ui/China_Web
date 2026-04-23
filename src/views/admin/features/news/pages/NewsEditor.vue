<template>
  <div class="news-editor-shell">
    <div v-if="isCrawling" class="news-editor-shell__loading">
      <Loader2 :size="34" class="spin" />
      <p>Preparing editor content...</p>
    </div>

    <template v-else>
      <NewsEditorToolbar
        :can-undo="store.past.length > 0"
        :can-redo="store.future.length > 0"
        :bold="editorState.bold"
        :italic="editorState.italic"
        :underline="editorState.underline"
        :align="editorState.align"
        :text-style="editorState.textStyle"
        :font-family="editorState.fontFamily"
        :font-size="editorState.fontSize"
        :text-color="editorState.textColor"
        :highlight-color="editorState.highlightColor"
        :text-color-open="toolbarMenus.textColor"
        :highlight-open="toolbarMenus.highlight"
        :save-status="saveStatus"
        @back="goBack"
        @undo="handleUndo"
        @redo="handleRedo"
        @save="handleSave"
        @toggle-bold="toggleMark('bold')"
        @toggle-italic="toggleMark('italic')"
        @toggle-underline="toggleMark('underline')"
        @set-font-family="setFontFamily"
        @set-font-size="setFontSize"
        @toggle-text-color="toggleToolbarMenu('textColor')"
        @toggle-highlight-color="toggleToolbarMenu('highlight')"
        @set-text-color="setTextColor"
        @set-highlight-color="setHighlightColor"
        @set-align="setAlign"
        @set-text-style="applyTextStyle"
        @set-bullet-style="setBulletStyle"
        @set-number-style="setNumberStyle"
        @indent-down="sinkListItem"
        @indent-up="liftListItem"
      />

      <div class="news-editor-body">
        <div class="news-editor-canvas" @click="clearSelection">
          <div class="news-editor-stage">
            <div
              class="news-editor-page"
              :style="{
                width: `${store.pageConfig.width}px`,
                background: store.pageConfig.background,
                minHeight: `${canvasHeight}px`,
              }"
            >
              <div
                v-for="block in store.blocks"
                :key="block.id"
                class="news-editor-block"
                :class="{ 'news-editor-block--selected': store.selectedBlockId === block.id }"
                :style="blockStyle(block)"
                @click.stop="selectBlock(block.id)"
                @mousedown.stop="startDrag($event, block)"
              >
                <button class="news-editor-block__delete" @click.stop="store.removeBlock(block.id)">
                  <X :size="14" />
                </button>
                <button class="news-editor-block__duplicate" @click.stop="store.duplicateBlock(block.id)">
                  <Copy :size="14" />
                </button>
                <div class="news-editor-block__resize" @mousedown.stop="startResize($event, block)"></div>

                <RichTextBlock
                  v-if="isRichTextBlock(block)"
                  :ref="(el) => setBlockEditorRef(block.id, el)"
                  :block="block"
                  :selected="store.selectedBlockId === block.id"
                  :sync-key="editorSyncKey"
                  @update="updateBlockContent(block.id, $event)"
                />

                <ImageBlock
                  v-else-if="block.type === 'image'"
                  :block="block"
                  :selected="store.selectedBlockId === block.id"
                  @update-props="updateBlockProps(block.id, $event)"
                  @replace="openBlockImagePicker(block.id)"
                />

                <GalleryBlock
                  v-else-if="block.type === 'gallery'"
                  :block="block"
                  :selected-image-id="store.selectedSubItemId"
                  @add-image="openGalleryPicker(block.id)"
                  @replace-image="replaceGalleryImage(block.id, $event)"
                  @delete-image="deleteGalleryImage(block.id, $event)"
                  @update-caption="updateGalleryCaption(block.id, $event)"
                  @select-image="store.selectSubItem"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          class="news-editor-sidebar"
          :style="{ width: `${sidebarWidth}px` }"
          :class="{ 'news-editor-sidebar--resizing': sidebarResizing }"
        >
          <div class="news-editor-sidebar__resize-handle" @mousedown.prevent="startSidebarResize"></div>

          <div class="sidebar-panel">
            <div class="sidebar-panel__section">
              <div class="sidebar-panel__header">
                <p class="sidebar-panel__eyebrow">Post Settings</p>
                <h2 class="sidebar-panel__title">Article Details</h2>
              </div>

              <label class="sidebar-field">
                <span>Title</span>
                <input :value="store.post.title" type="text" @input="store.setPost({ title: $event.target.value })" />
              </label>

              <label class="sidebar-field">
                <span>Slug</span>
                <input :value="store.post.slug" type="text" @input="store.setPost({ slug: $event.target.value })" />
              </label>

              <label class="sidebar-field">
                <span>Thumbnail URL</span>
                <input :value="store.post.thumbnailUrl" type="text" placeholder="https://..." @input="store.setPost({ thumbnailUrl: $event.target.value })" />
              </label>

              <label class="sidebar-field">
                <span>Status</span>
                <select :value="store.post.status" @change="store.setPost({ status: $event.target.value })">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label class="sidebar-field">
                <span>Published At</span>
                <input
                  :value="store.post.publishedAt || ''"
                  type="datetime-local"
                  @input="store.setPost({ publishedAt: $event.target.value })"
                />
              </label>
            </div>

            <div class="sidebar-panel__section">
              <div class="sidebar-panel__header">
                <p class="sidebar-panel__eyebrow">Media Library</p>
                <h3 class="sidebar-panel__title sidebar-panel__title--small">Upload Image from Local</h3>
              </div>

              <button type="button" class="sidebar-upload-btn" @click="postImageInputRef?.click()">
                <Upload :size="16" />
                Upload Image from Local
              </button>
              <input ref="postImageInputRef" class="sr-only" type="file" accept="image/*" multiple @change="handleSidebarImageUpload" />

              <div v-if="uploadedImages.length" class="sidebar-media-grid">
                <button
                  v-for="image in uploadedImages"
                  :key="image.id"
                  type="button"
                  class="sidebar-media-card"
                  @click="insertUploadedImage(image.src)"
                >
                  <img :src="image.src" :alt="image.name" />
                  <span>{{ image.name }}</span>
                </button>
              </div>
            </div>

            <div class="sidebar-panel__section">
              <div class="sidebar-panel__header">
                <p class="sidebar-panel__eyebrow">Layout Settings</p>
                <h3 class="sidebar-panel__title sidebar-panel__title--small">Canvas</h3>
              </div>

              <label class="sidebar-field">
                <span>Page Width</span>
                <input :value="store.pageConfig.width" type="number" min="800" max="1100" @input="store.setPageConfig({ width: clampNumber($event.target.value, 800, 1100, 1000) })" />
              </label>

              <label class="sidebar-field sidebar-field--row">
                <span>Page Background</span>
                <div class="sidebar-color-row">
                  <input class="sidebar-color" :value="store.pageConfig.background" type="color" @input="store.setPageConfig({ background: $event.target.value })" />
                  <input :value="store.pageConfig.background" type="text" @input="store.setPageConfig({ background: $event.target.value })" />
                </div>
              </label>
            </div>

            <div class="sidebar-panel__section">
              <div class="sidebar-panel__header">
                <p class="sidebar-panel__eyebrow">Block Settings</p>
                <h3 class="sidebar-panel__title sidebar-panel__title--small">Selected Block</h3>
              </div>

              <div v-if="!selectedBlock" class="sidebar-empty">
                Select a block to adjust layout, styles, and media options.
              </div>

              <template v-else>
                <div class="sidebar-grid">
                  <label class="sidebar-field">
                    <span>X</span>
                    <input :value="selectedBlock.x" type="number" @input="store.updateBlock(selectedBlock.id, { x: clampNumber($event.target.value, 0, 4000, 0) })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Y</span>
                    <input :value="selectedBlock.y" type="number" @input="store.updateBlock(selectedBlock.id, { y: clampNumber($event.target.value, 0, 6000, 0) })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Width</span>
                    <input :value="selectedBlock.w" type="number" @input="store.updateBlock(selectedBlock.id, { w: clampNumber($event.target.value, 120, 2000, 320) })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Height</span>
                    <input :value="selectedBlock.h" type="number" @input="store.updateBlock(selectedBlock.id, { h: clampNumber($event.target.value, 50, 2000, 160) })" />
                  </label>
                </div>

                <template v-if="isRichTextBlock(selectedBlock)">
                  <label class="sidebar-field">
                    <span>Font Size</span>
                    <input :value="selectedBlock.props.fontSize || 16" type="number" @input="updateBlockProps(selectedBlock.id, { fontSize: clampNumber($event.target.value, 12, 72, 16) })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Text Color</span>
                    <input class="sidebar-color sidebar-color--full" :value="selectedBlock.props.color || '#111827'" type="color" @input="updateBlockProps(selectedBlock.id, { color: $event.target.value })" />
                  </label>
                </template>

                <template v-if="selectedBlock.type === 'image'">
                  <label class="sidebar-field">
                    <span>Image URL</span>
                    <input :value="selectedBlock.props.src || ''" type="text" @input="updateBlockProps(selectedBlock.id, { src: $event.target.value })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Caption</span>
                    <input :value="selectedBlock.props.captionText || ''" type="text" @input="updateBlockProps(selectedBlock.id, { captionText: $event.target.value })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Caption Position</span>
                    <select :value="selectedBlock.props.captionPosition || 'outside-bottom'" @change="updateBlockProps(selectedBlock.id, { captionPosition: $event.target.value })">
                      <option value="inside-bottom">Inside image</option>
                      <option value="outside-bottom">Outside image</option>
                    </select>
                  </label>
                </template>

                <template v-if="selectedBlock.type === 'gallery'">
                  <label class="sidebar-field">
                    <span>Columns</span>
                    <input :value="selectedBlock.props.columns || 2" type="number" min="2" max="4" @input="updateBlockProps(selectedBlock.id, { columns: clampNumber($event.target.value, 2, 4, 2) })" />
                  </label>
                  <label class="sidebar-field">
                    <span>Gap</span>
                    <input :value="selectedBlock.props.gap || 14" type="number" min="4" max="32" @input="updateBlockProps(selectedBlock.id, { gap: clampNumber($event.target.value, 4, 32, 14) })" />
                  </label>
                </template>

                <div class="sidebar-actions">
                  <button type="button" class="sidebar-action-btn sidebar-action-btn--subtle" @click="store.duplicateBlock(selectedBlock.id)">
                    Duplicate Block
                  </button>
                  <button type="button" class="sidebar-action-btn sidebar-action-btn--danger" @click="store.removeBlock(selectedBlock.id)">
                    Delete Block
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="news-editor-floating-actions">
        <button type="button" class="floating-btn" @click="addTextBlock">
          <Type :size="16" />
          Text
        </button>
        <button type="button" class="floating-btn" @click="addImageBlock">
          <ImageIcon :size="16" />
          Image
        </button>
        <button type="button" class="floating-btn" @click="addGalleryBlock">
          <LayoutGrid :size="16" />
          Gallery
        </button>
      </div>

      <input ref="blockImageInputRef" class="sr-only" type="file" accept="image/*" multiple @change="handleBlockImageSelection" />
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Copy, Image as ImageIcon, LayoutGrid, Loader2, Save, Type, Upload, X } from 'lucide-vue-next'

import { ADMIN_TOKEN_STORAGE_KEY } from '@/views/admin/shared/constants/auth'
import {
  createAdminEntityRecord,
  getAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
} from '@/views/admin/shared/api/adminApi'

import RichTextBlock from '@/views/admin/features/news/components/RichTextBlock.vue'
import ImageBlock from '@/views/admin/features/news/components/ImageBlock.vue'
import GalleryBlock from '@/views/admin/features/news/components/GalleryBlock.vue'
import NewsEditorToolbar from '@/views/admin/features/news/components/NewsEditorToolbar.vue'
import { useEditorStore } from '@/views/admin/features/news/store/editorStore.js'
import { useSidebarResize } from '@/views/admin/features/news/utils/newsEditorHelpers.js'
import { FONT_FAMILIES } from '@/views/admin/features/news/components/toolbarOptions.js'

const route = useRoute()
const router = useRouter()
const store = useEditorStore()
const token = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ''
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const isEdit = computed(() => !!route.params.id)
const sourceRecordId = computed(() => route.params.id || route.query.id || '')
const sourceRecordSlug = computed(() => route.query.slug || '')
const isCrawling = ref(false)
const saveStatus = ref('idle')
const postImageInputRef = ref(null)
const blockImageInputRef = ref(null)
const uploadedImages = ref([])
const currentImageAction = ref(null)
const editorSyncKey = ref(0)

const toolbarMenus = reactive({
  textColor: false,
  highlight: false,
})

const editorState = reactive({
  bold: false,
  italic: false,
  underline: false,
  align: 'left',
  textStyle: 'paragraph',
  fontFamily: FONT_FAMILIES[0].value,
  fontSize: 16,
  textColor: '#111827',
  highlightColor: '#fef08a',
})

const blockEditorRefs = new Map()
const { width: sidebarWidth, isResizing: sidebarResizing, startResize: startSidebarResize } = useSidebarResize({
  initialWidth: 360,
  minWidth: 280,
  maxWidth: 500,
})

const selectedBlock = computed(() => store.blocks.find((block) => block.id === store.selectedBlockId) || null)
const canvasHeight = computed(() => {
  if (!store.blocks.length) return 1400
  const maxBottom = Math.max(...store.blocks.map((block) => block.y + block.h))
  return Math.max(1400, maxBottom + 280)
})
const BLOCK_FLOW_GAP = 24

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(max, Math.max(min, numeric))
}

function getBlockMinHeight(type) {
  if (type === 'heading') return 110
  if (type === 'text') return 130
  if (type === 'image') return 220
  if (type === 'gallery') return 240
  return 100
}

function getNextBlockY() {
  if (!store.blocks.length) return 80
  const maxBottom = Math.max(...store.blocks.map((block) => block.y + block.h))
  return maxBottom + BLOCK_FLOW_GAP
}

function createBaseBlock(type, overrides = {}) {
  const defaults = {
    text: {
      w: 760,
      h: getBlockMinHeight('text'),
      content: '<p>Start writing here...</p>',
      props: {
        fontSize: 16,
        color: '#0f172a',
        fontFamily: FONT_FAMILIES[0].value,
        textAlign: 'left',
        lineHeight: 1.7,
        autoHeight: true,
      },
    },
    heading: {
      w: 760,
      h: getBlockMinHeight('heading'),
      content: '<h1>Heading</h1>',
      props: {
        fontSize: 36,
        color: '#0f172a',
        fontFamily: FONT_FAMILIES[0].value,
        textAlign: 'left',
        lineHeight: 1.25,
        fontWeight: '700',
        autoHeight: true,
      },
    },
    image: {
      w: 760,
      h: 420,
      content: '',
      props: {
        src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
        borderRadius: 18,
        captionText: 'Write a caption...',
        captionPosition: 'outside-bottom',
      },
    },
    gallery: {
      w: 760,
      h: 480,
      content: '',
      props: {
        images: [
          { id: `img-${Date.now()}-1`, src: 'https://picsum.photos/seed/gallery-1/1200/900', caption: 'Gallery caption 1' },
          { id: `img-${Date.now()}-2`, src: 'https://picsum.photos/seed/gallery-2/1200/900', caption: 'Gallery caption 2' },
        ],
        columns: 2,
        gap: 14,
      },
    },
  }

  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x: 80,
    y: getNextBlockY(),
    ...defaults[type],
    ...overrides,
  }
}

function normalizeLoadedBlocks(blocks = []) {
  const normalized = (blocks || []).map((block, index) => {
    const base = createBaseBlock(block.type || 'text', {
      id: block.id || `block-loaded-${index}`,
      x: block.x ?? 80,
      y: block.y ?? getNextBlockY(),
      w: block.w ?? 760,
      h: block.h ?? getBlockMinHeight(block.type || 'text'),
      content: block.content ?? '',
      props: {
        ...(createBaseBlock(block.type || 'text').props || {}),
        ...(block.props || {}),
      },
    })
    return {
      ...base,
      ...block,
      props: base.props,
    }
  })
  return compactBlocksLayout(normalized)
}

function compactBlocksLayout(blocks = []) {
  const pageWidth = Number(store.pageConfig.width || 1000)
  const sortedBlocks = [...(blocks || [])]
    .sort((a, b) => (Number(a?.y || 0) - Number(b?.y || 0)) || (Number(a?.x || 0) - Number(b?.x || 0)))

  let cursorY = 80
  return sortedBlocks.map((block) => {
    const minHeight = getBlockMinHeight(block.type)
    const width = clampNumber(block.w, 180, Math.max(180, pageWidth - 40), 760)
    const maxX = Math.max(20, pageWidth - width - 20)
    const safeX = clampNumber(block.x, 20, maxX, 20)
    const height = Math.max(minHeight, Number(block.h) || minHeight)
    const nextBlock = {
      ...block,
      x: safeX,
      w: width,
      h: height,
      y: cursorY,
    }
    cursorY += height + BLOCK_FLOW_GAP
    return nextBlock
  })
}

function isRichTextBlock(block) {
  return ['text', 'heading'].includes(block?.type)
}

function setBlockEditorRef(id, component) {
  if (component?.editor) {
    blockEditorRefs.set(id, component.editor)
    return
  }
  blockEditorRefs.delete(id)
}

function getActiveTextEditor() {
  if (!selectedBlock.value || !isRichTextBlock(selectedBlock.value)) return null
  return blockEditorRefs.get(selectedBlock.value.id) || null
}

function syncToolbarState() {
  const editor = getActiveTextEditor()
  if (!editor) {
    editorState.bold = false
    editorState.italic = false
    editorState.underline = false
    editorState.align = selectedBlock.value?.props?.textAlign || 'left'
    editorState.textStyle = selectedBlock.value?.type === 'heading' ? 'h1' : 'paragraph'
    editorState.fontFamily = selectedBlock.value?.props?.fontFamily || FONT_FAMILIES[0].value
    editorState.fontSize = Number(selectedBlock.value?.props?.fontSize || 16)
    editorState.textColor = selectedBlock.value?.props?.color || '#111827'
    editorState.highlightColor = selectedBlock.value?.props?.highlightColor || '#fef08a'
    return
  }

  editorState.bold = editor.isActive('bold')
  editorState.italic = editor.isActive('italic')
  editorState.underline = editor.isActive('underline')
  editorState.align = selectedBlock.value?.props?.textAlign || 'left'
  editorState.textStyle = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'paragraph'
  editorState.fontFamily = selectedBlock.value?.props?.fontFamily || FONT_FAMILIES[0].value
  editorState.fontSize = Number(selectedBlock.value?.props?.fontSize || 16)
  editorState.textColor = selectedBlock.value?.props?.color || '#111827'
  editorState.highlightColor = selectedBlock.value?.props?.highlightColor || '#fef08a'
}

function toggleToolbarMenu(name) {
  Object.keys(toolbarMenus).forEach((key) => {
    toolbarMenus[key] = key === name ? !toolbarMenus[key] : false
  })
}

function closeToolbarMenus() {
  Object.keys(toolbarMenus).forEach((key) => {
    toolbarMenus[key] = false
  })
}

function shiftFollowingBlocks(anchorId, oldBottom, deltaHeight) {
  if (Math.abs(deltaHeight) < 2) return
  const followingBlocks = store.blocks
    .filter((item) => item.id !== anchorId && item.y >= oldBottom - 2)
    .sort((a, b) => a.y - b.y)

  for (const block of followingBlocks) {
    store.updateBlock(block.id, { y: Math.max(0, block.y + deltaHeight) }, true)
  }
}

function updateBlockContent(id, payload) {
  const block = store.blocks.find((item) => item.id === id)
  if (!block) return

  const html = typeof payload === 'string'
    ? payload
    : (payload?.html ?? block.content ?? '<p></p>')
  const measuredHeight = Number(payload?.contentHeight)
  const shouldAutoFit = isRichTextBlock(block) && block?.props?.autoHeight !== false

  let nextHeight = block.h
  if (shouldAutoFit && Number.isFinite(measuredHeight) && measuredHeight > 0) {
    nextHeight = clampNumber(
      Math.ceil(measuredHeight + 8),
      getBlockMinHeight(block.type),
      2600,
      getBlockMinHeight(block.type),
    )
  }

  const contentChanged = html !== block.content
  const heightChanged = Math.abs(nextHeight - block.h) >= 2
  if (!contentChanged && !heightChanged) return

  const oldBottom = block.y + block.h
  const updates = { content: html }
  if (heightChanged) {
    updates.h = nextHeight
  }
  store.updateBlock(id, updates, true)

  if (heightChanged) {
    shiftFollowingBlocks(id, oldBottom, nextHeight - block.h)
  }
}

function updateBlockProps(id, props) {
  const block = store.blocks.find((item) => item.id === id)
  if (!block) return
  store.updateBlock(id, { props: { ...block.props, ...props } })
  syncToolbarState()
}

function selectBlock(id) {
  store.selectBlock(id)
  nextTick(syncToolbarState)
}

function clearSelection() {
  store.selectBlock(null)
  closeToolbarMenus()
}

function applyEditorCommand(command, fallbackProps = {}) {
  const editor = getActiveTextEditor()
  if (editor) {
    command(editor)
  }
  if (selectedBlock.value && Object.keys(fallbackProps).length) {
    updateBlockProps(selectedBlock.value.id, fallbackProps)
  }
  nextTick(syncToolbarState)
}

function toggleMark(type) {
  const editor = getActiveTextEditor()
  if (!editor) return
  if (type === 'bold') editor.chain().focus().toggleBold().run()
  if (type === 'italic') editor.chain().focus().toggleItalic().run()
  if (type === 'underline') editor.chain().focus().toggleUnderline().run()
  nextTick(syncToolbarState)
}

function setFontFamily(fontFamily) {
  applyEditorCommand(
    (editor) => editor.chain().focus().setFontFamily(fontFamily).run(),
    { fontFamily },
  )
}

function setFontSize(fontSize) {
  applyEditorCommand(
    (editor) => editor.chain().focus().setFontSize(fontSize).run(),
    { fontSize },
  )
}

function setTextColor(color) {
  closeToolbarMenus()
  applyEditorCommand(
    (editor) => editor.chain().focus().setColor(color).run(),
    { color },
  )
}

function setHighlightColor(color) {
  closeToolbarMenus()
  applyEditorCommand(
    (editor) => editor.chain().focus().setHighlightColor(color).run(),
    { highlightColor: color },
  )
}

function setAlign(align) {
  applyEditorCommand(
    (editor) => editor.chain().focus().setTextAlign(align).run(),
    { textAlign: align },
  )
}

function applyTextStyle(style) {
  const editor = getActiveTextEditor()
  if (!editor || !selectedBlock.value) return

  if (style === 'paragraph') {
    editor.chain().focus().setParagraph().run()
    store.updateBlock(selectedBlock.value.id, { type: 'text' })
  } else {
    const level = Number(style.replace('h', '')) || 1
    editor.chain().focus().toggleHeading({ level }).run()
    store.updateBlock(selectedBlock.value.id, { type: 'heading' })
  }

  nextTick(syncToolbarState)
}

function setBulletStyle(style) {
  const editor = getActiveTextEditor()
  if (!editor || !selectedBlock.value || !style) return
  editor.chain().focus().toggleBulletList().run()
  updateBlockProps(selectedBlock.value.id, { bulletStyle: style })
}

function setNumberStyle(style) {
  const editor = getActiveTextEditor()
  if (!editor || !selectedBlock.value || !style) return
  editor.chain().focus().toggleOrderedList().run()
  updateBlockProps(selectedBlock.value.id, { numberStyle: style })
}

function sinkListItem() {
  const editor = getActiveTextEditor()
  if (!editor) return
  editor.chain().focus().sinkListItem('listItem').run()
}

function liftListItem() {
  const editor = getActiveTextEditor()
  if (!editor) return
  editor.chain().focus().liftListItem('listItem').run()
}

function addTextBlock() {
  const block = createBaseBlock('text')
  store.addBlock(block)
  selectBlock(block.id)
}

function addImageBlock(src) {
  const baseImageBlock = createBaseBlock('image')
  const block = createBaseBlock('image', {
    props: {
      ...baseImageBlock.props,
      src: src || baseImageBlock.props.src,
    },
  })
  store.addBlock(block)
  selectBlock(block.id)
}

function addGalleryBlock() {
  const block = createBaseBlock('gallery')
  store.addBlock(block)
  selectBlock(block.id)
}

function createImageAsset(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      resolve({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        src: event.target?.result,
      })
    }
    reader.readAsDataURL(file)
  })
}

async function handleSidebarImageUpload(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  const assets = await Promise.all(files.map(createImageAsset))
  uploadedImages.value = [...assets, ...uploadedImages.value].slice(0, 24)
  event.target.value = ''
}

function insertUploadedImage(src) {
  if (selectedBlock.value?.type === 'image') {
    updateBlockProps(selectedBlock.value.id, { src })
    return
  }
  addImageBlock(src)
}

function openBlockImagePicker(blockId) {
  currentImageAction.value = { type: 'replace-image-block', blockId }
  blockImageInputRef.value?.click()
}

function openGalleryPicker(blockId) {
  currentImageAction.value = { type: 'add-gallery-image', blockId }
  blockImageInputRef.value?.click()
}

function replaceGalleryImage(blockId, imageId) {
  currentImageAction.value = { type: 'replace-gallery-image', blockId, imageId }
  blockImageInputRef.value?.click()
}

async function handleBlockImageSelection(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length || !currentImageAction.value) return
  const assets = await Promise.all(files.map(createImageAsset))
  const action = currentImageAction.value

  if (action.type === 'replace-image-block') {
    updateBlockProps(action.blockId, { src: assets[0].src })
  }

  if (action.type === 'add-gallery-image') {
    const block = store.blocks.find((item) => item.id === action.blockId)
    if (block) {
      const nextImages = [
        ...(block.props.images || []),
        ...assets.map((asset) => ({ id: asset.id, src: asset.src, caption: '' })),
      ]
      updateBlockProps(action.blockId, { images: nextImages })
    }
  }

  if (action.type === 'replace-gallery-image') {
    const block = store.blocks.find((item) => item.id === action.blockId)
    if (block) {
      const nextImages = (block.props.images || []).map((image) =>
        image.id === action.imageId
          ? { ...image, src: assets[0].src }
          : image,
      )
      updateBlockProps(action.blockId, { images: nextImages })
    }
  }

  currentImageAction.value = null
  event.target.value = ''
}

function updateGalleryCaption(blockId, payload) {
  const block = store.blocks.find((item) => item.id === blockId)
  if (!block) return
  const nextImages = (block.props.images || []).map((image) =>
    image.id === payload.id ? { ...image, caption: payload.caption } : image,
  )
  updateBlockProps(blockId, { images: nextImages })
}

function deleteGalleryImage(blockId, imageId) {
  const block = store.blocks.find((item) => item.id === blockId)
  if (!block) return
  updateBlockProps(blockId, {
    images: (block.props.images || []).filter((image) => image.id !== imageId),
  })
  if (store.selectedSubItemId === imageId) {
    store.selectSubItem(null)
  }
}

function blockStyle(block) {
  return {
    left: `${block.x}px`,
    top: `${block.y}px`,
    width: `${block.w}px`,
    height: `${block.h}px`,
  }
}

let dragState = null
function startDrag(event, block) {
  if (event.target.closest('.ProseMirror') || event.target.closest('input, textarea, button, select')) return
  dragState = {
    id: block.id,
    startX: event.clientX,
    startY: event.clientY,
    originalX: block.x,
    originalY: block.y,
  }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(event) {
  if (!dragState) return
  const deltaX = event.clientX - dragState.startX
  const deltaY = event.clientY - dragState.startY
  store.updateBlock(dragState.id, {
    x: Math.max(0, dragState.originalX + deltaX),
    y: Math.max(0, dragState.originalY + deltaY),
  }, true)
}

function stopDrag() {
  if (dragState) {
    const block = store.blocks.find((item) => item.id === dragState.id)
    if (block) {
      store.updateBlock(dragState.id, { x: block.x, y: block.y })
    }
  }
  dragState = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

let resizeState = null
function startResize(event, block) {
  resizeState = {
    id: block.id,
    type: block.type,
    startX: event.clientX,
    startY: event.clientY,
    width: block.w,
    height: block.h,
  }
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
}

function onResize(event) {
  if (!resizeState) return
  const deltaX = event.clientX - resizeState.startX
  const deltaY = event.clientY - resizeState.startY
  const minHeight = getBlockMinHeight(resizeState.type)
  store.updateBlock(resizeState.id, {
    w: Math.max(180, resizeState.width + deltaX),
    h: Math.max(minHeight, resizeState.height + deltaY),
  }, true)
}

function stopResize() {
  if (resizeState) {
    const block = store.blocks.find((item) => item.id === resizeState.id)
    if (block) {
      store.updateBlock(resizeState.id, { w: block.w, h: block.h })
    }
  }
  resizeState = null
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

function handleUndo() {
  closeToolbarMenus()
  document.activeElement?.blur()
  setTimeout(() => {
    store.undo()
    editorSyncKey.value += 1
  }, 10)
}

function handleRedo() {
  closeToolbarMenus()
  document.activeElement?.blur()
  setTimeout(() => {
    store.redo()
    editorSyncKey.value += 1
  }, 10)
}

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMinutes = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offsetMinutes * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function toApiDatetime(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderBlocksToHtml(blocks = []) {
  const normalizedBlocks = Array.isArray(blocks)
    ? [...blocks].sort((a, b) => (Number(a?.y || 0) - Number(b?.y || 0)) || (Number(a?.x || 0) - Number(b?.x || 0)))
    : []

  if (!normalizedBlocks.length) return ''

  const fragments = []
  for (const block of normalizedBlocks) {
    const type = String(block?.type || '').toLowerCase()
    const props = block?.props || {}

    if (type === 'text' || type === 'heading') {
      if (block?.content) fragments.push(String(block.content))
      continue
    }

    if (type === 'image') {
      const src = String(props.src || '').trim()
      if (!src) continue
      const alt = escapeHtml(props.alt || '')
      const caption = String(props.captionText || '').trim()
      const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
      fragments.push(`<figure class="news-block-image"><img src="${escapeHtml(src)}" alt="${alt}" />${figcaption}</figure>`)
      continue
    }

    if (type === 'gallery') {
      const images = Array.isArray(props.images)
        ? props.images
        : (Array.isArray(props.items) ? props.items : [])
      const items = images
        .map((item) => {
          const src = String(item?.src || '').trim()
          if (!src) return ''
          const alt = escapeHtml(item?.alt || '')
          const caption = String(item?.caption || '').trim()
          const figcaption = caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
          return `<figure class="news-block-gallery-item"><img src="${escapeHtml(src)}" alt="${alt}" />${figcaption}</figure>`
        })
        .filter(Boolean)
      if (items.length) {
        fragments.push(`<section class="news-block-gallery">${items.join('')}</section>`)
      }
    }
  }

  return fragments.length ? `<article class="news-workflow-content">${fragments.join('')}</article>` : ''
}

async function loadPost() {
  const recordId = String(sourceRecordId.value || '').trim()
  const recordSlug = String(sourceRecordSlug.value || '').trim()

  if (!recordId && !recordSlug) return

  try {
    const data = recordId
      ? await getAdminEntityRecord('news_posts', recordId, token)
      : await listAdminEntityRecords('news_posts', token, { slug: recordSlug })
          .then((res) => {
            const items = Array.isArray(res?.items) ? res.items : []
            return items.find((item) => item.slug === recordSlug) || null
          })

    if (!data) return

    store.setPost({
      title: data.title || '',
      slug: data.slug || '',
      summary: data.summary || '',
      thumbnailUrl: data.thumbnail_url || '',
      status: data.status || 'draft',
      publishedAt: toDatetimeLocal(data.published_at),
    })
    if (data.content_json) {
      const contentJson = typeof data.content_json === 'string'
        ? JSON.parse(data.content_json)
        : data.content_json
      store.setBlocks(normalizeLoadedBlocks(contentJson.blocks || []))
      if (contentJson.page) {
        store.setPageConfig({
          width: clampNumber(contentJson.page.width, 800, 1100, 1000),
          background: contentJson.page.background || '#ffffff',
        })
      }
    }
  } catch (error) {
    console.error('Load error:', error)
  }
}


function extractCrawlErrorMessage(json, response) {
  if (!json) {
    return response?.ok ? 'Phản hồi từ backend không hợp lệ.' : `Backend trả lỗi HTTP ${response?.status || 'unknown'}.`
  }

  const debugParts = []
  if (json.error_type) debugParts.push(`type=${json.error_type}`)
  if (json.debug?.detail) debugParts.push(json.debug.detail)
  if (json.debug?.status_code) debugParts.push(`status=${json.debug.status_code}`)

  const baseMessage = json.message || json.detail || 'Không crawl được nội dung từ URL này.'
  return debugParts.length ? `${baseMessage}\n${debugParts.join(' | ')}` : baseMessage
}

function buildFetchFailureMessage(error) {
  const base = error?.message || 'Failed to fetch'
  return [
    'Không thể gọi API crawl từ frontend.',
    `Chi tiết: ${base}`,
    'Nguyên nhân thường gặp:',
    '- Backend đang lỗi 500 hoặc bị crash giữa chừng',
    '- CORS bị chặn nên browser không đọc được response lỗi',
    '- API server không chạy hoặc sai base URL',
  ].join('\n')
}

async function handleCrawl(url) {
  isCrawling.value = true
  try {
    const response = await fetch(`${API_BASE}/admin/news/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    })

    let json = null
    try {
      json = await response.json()
    } catch {
      json = null
    }

    if (!response.ok) {
      throw new Error(extractCrawlErrorMessage(json, response))
    }

    if (json?.success && json?.data) {
      const blocks = normalizeLoadedBlocks(json.data.blocks || [])

      store.setPost({
        title: json.data.title || 'Untitled',
        slug: `article-${Date.now().toString(36)}`,
        summary: json.data.excerpt || '',
        thumbnailUrl: json.data.thumbnail_url || '',
        status: 'draft',
        publishedAt: '',
      })
      store.setBlocks(blocks, true)

      if (!blocks.length) {
        throw new Error('Crawl thành công nhưng không có block nội dung để chỉnh sửa.')
      }
    } else {
      throw new Error(extractCrawlErrorMessage(json, response))
    }
  } catch (error) {
    const message = error instanceof TypeError
      ? buildFetchFailureMessage(error)
      : (error?.message || 'Failed to fetch or parse URL.')

    store.setPost({
      title: 'Failed to Crawl',
      slug: `error-${Date.now()}`,
      summary: message,
      thumbnailUrl: '',
      status: 'draft',
      publishedAt: '',
    })
    store.setBlocks([])
    console.error('Crawl error:', error)
    alert(`Crawl from URL thất bại:\n\n${message}`)
  } finally {
    isCrawling.value = false
  }
}

async function handleSave() {
  saveStatus.value = 'saving'
  let publishedAt = toApiDatetime(store.post.publishedAt)
  if (store.post.status === 'published' && !publishedAt) {
    const now = new Date().toISOString()
    store.setPost({ publishedAt: toDatetimeLocal(now) })
    publishedAt = now
  }

  const renderedContent = renderBlocksToHtml(store.blocks)
  const payload = {
    title: store.post.title,
    slug: store.post.slug,
    summary: store.post.summary,
    thumbnail_url: store.post.thumbnailUrl,
    status: store.post.status,
    published_at: publishedAt,
    content_json: JSON.stringify({ page: store.pageConfig, blocks: store.blocks }),
    content: renderedContent || '<p></p>',
  }
  try {
    if (isEdit.value) {
      await updateAdminEntityRecord('news_posts', route.params.id, payload, token)
    } else {
      const created = await createAdminEntityRecord('news_posts', payload, token)
      if (created?.id) {
        router.replace({ name: 'AdminNewsEdit', params: { id: created.id } })
      }
    }
    saveStatus.value = 'saved'
    setTimeout(() => {
      if (saveStatus.value === 'saved') saveStatus.value = 'idle'
    }, 3000)
  } catch (error) {
    saveStatus.value = 'error'
    console.error('Save error:', error)
  }
}

function goBack() {
  router.push({ name: 'AdminDashboard', query: { section: 'news_posts' } })
}

function onKeyDown(event) {
  const target = event.target
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') return
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    event.shiftKey ? handleRedo() : handleUndo()
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault()
    handleRedo()
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    handleSave()
  }
}

watch(() => store.selectedBlockId, () => {
  nextTick(syncToolbarState)
})

watch(
  () => store.blocks,
  () => {
    nextTick(syncToolbarState)
  },
  { deep: true },
)

onMounted(async () => {
  window.addEventListener('keydown', onKeyDown)
  store.resetEditor()
  store.setPageConfig({ width: 1000, background: '#ffffff' })

  if (sourceRecordId.value || sourceRecordSlug.value) {
    await loadPost()
  } else {
    const crawlUrl = route.query.crawl

    if (crawlUrl) {
      await handleCrawl(crawlUrl)
    } else {
      store.setPost({
        title: 'Untitled',
        slug: `untitled-${Date.now()}`,
        summary: '',
        thumbnailUrl: '',
        status: 'draft',
        publishedAt: '',
      })
      store.setBlocks([])
    }
  }

  nextTick(syncToolbarState)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  stopDrag()
  stopResize()
})
</script>

<style scoped>
.news-editor-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  font-family: Inter, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
}

.news-editor-shell__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex: 1;
  color: #475569;
}

.news-editor-notice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 18px 24px 0;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(251, 191, 36, 0.28);
  background: linear-gradient(135deg, rgba(255, 251, 235, 0.96), rgba(255, 247, 237, 0.96));
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.12);
}

.news-editor-notice--info {
  border-color: rgba(59, 130, 246, 0.18);
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(240, 249, 255, 0.96));
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1);
}

.news-editor-notice__icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 15px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.news-editor-notice__content {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.news-editor-notice__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #78350f;
}

.news-editor-notice__description {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: #92400e;
}

.news-editor-notice__close {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #92400e;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.14);
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.news-editor-notice__close:hover {
  transform: translateY(-1px);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2), 0 8px 18px rgba(15, 23, 42, 0.08);
}

.news-editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.news-editor-canvas {
  flex: 1;
  min-width: 0;
  overflow: auto;
  padding: 24px 24px 96px;
}

.news-editor-stage {
  min-width: 100%;
  display: flex;
  justify-content: center;
  padding: 8px 0 40px;
}

.news-editor-page {
  position: relative;
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.news-editor-block {
  position: absolute;
  border-radius: 20px;
  outline: 1px solid transparent;
  transition: outline-color 0.18s ease, box-shadow 0.18s ease;
}

.news-editor-block:hover {
  outline-color: rgba(148, 163, 184, 0.4);
}

.news-editor-block--selected {
  outline: 2px solid #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
}

.news-editor-block__delete,
.news-editor-block__duplicate {
  position: absolute;
  top: -14px;
  z-index: 3;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.news-editor-block__delete {
  right: -14px;
  background: #ef4444;
}

.news-editor-block__duplicate {
  right: 24px;
  background: #0f172a;
}

.news-editor-block:hover .news-editor-block__delete,
.news-editor-block:hover .news-editor-block__duplicate,
.news-editor-block--selected .news-editor-block__delete,
.news-editor-block--selected .news-editor-block__duplicate {
  opacity: 1;
}

.news-editor-block__resize {
  position: absolute;
  right: -6px;
  bottom: -6px;
  z-index: 3;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #2563eb;
  cursor: nwse-resize;
  opacity: 0;
}

.news-editor-block:hover .news-editor-block__resize,
.news-editor-block--selected .news-editor-block__resize {
  opacity: 1;
}

.news-editor-sidebar {
  position: relative;
  min-width: 280px;
  max-width: 500px;
  border-left: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(16px);
  overflow: auto;
}

.news-editor-sidebar--resizing {
  user-select: none;
}

.news-editor-sidebar__resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 10px;
  height: 100%;
  cursor: col-resize;
}

.sidebar-panel {
  display: grid;
  gap: 18px;
  padding: 24px 24px 48px;
}

.sidebar-panel__section {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
}

.sidebar-panel__header {
  display: grid;
  gap: 4px;
}

.sidebar-panel__eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.sidebar-panel__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
  font-weight: 700;
  color: #0f172a;
}

.sidebar-panel__title--small {
  font-size: 15px;
}

.sidebar-field {
  display: grid;
  gap: 8px;
}

.sidebar-field span {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.sidebar-field input,
.sidebar-field select {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1px solid #dbe2ea;
  border-radius: 12px;
  outline: none;
  background: #fff;
  font-size: 13px;
  color: #0f172a;
  box-sizing: border-box;
}

.sidebar-field input:focus,
.sidebar-field select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.sidebar-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sidebar-empty {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.sidebar-color-row {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 10px;
}

.sidebar-color {
  padding: 0 !important;
  cursor: pointer;
}

.sidebar-color--full {
  width: 100%;
  height: 42px;
}

.sidebar-upload-btn,
.sidebar-action-btn {
  height: 42px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #dbe2ea;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
}

.sidebar-media-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.sidebar-media-card {
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.sidebar-media-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.sidebar-media-card span {
  display: block;
  padding: 8px 10px;
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-actions {
  display: grid;
  gap: 10px;
}

.sidebar-action-btn--subtle:hover,
.sidebar-upload-btn:hover {
  background: #f8fafc;
}

.sidebar-action-btn--danger {
  color: #dc2626;
  border-color: #fecaca;
  background: #fff5f5;
}

.news-editor-floating-actions {
  position: fixed;
  left: 28px;
  bottom: 24px;
  z-index: 20;
  display: flex;
  gap: 10px;
}

.floating-btn {
  height: 44px;
  padding: 0 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1280px) {
  .news-editor-canvas {
    padding: 20px 18px 100px;
  }
}

@media (max-width: 1100px) {
  .news-editor-body {
    flex-direction: column;
  }

  .news-editor-sidebar {
    width: 100% !important;
    max-width: none;
    min-width: 0;
    border-left: 0;
    border-top: 1px solid #e2e8f0;
  }

  .news-editor-sidebar__resize-handle {
    display: none;
  }
}
</style>
