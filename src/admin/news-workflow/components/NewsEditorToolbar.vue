<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useNewsWorkflowEditorStore } from '@/admin/news-workflow/stores/newsWorkflowEditor'

const props = defineProps<{
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
}>()

const emit = defineEmits<{
  (event: 'save'): void
  (event: 'publish'): void
  (event: 'preview'): void
  (event: 'import-source'): void
}>()

const store = useNewsWorkflowEditorStore()
const router = useRouter()
const fontFamily = ref('Arial')
const fontSize = ref('16')
const textColor = ref('#b42318')
const highlightColor = ref('#facc15')
const textColorInput = ref<HTMLInputElement | null>(null)
const highlightColorInput = ref<HTMLInputElement | null>(null)
const importInputRef = ref<HTMLInputElement | null>(null)
const selectedBlock = computed(() => store.selectedBlock)

const canUndo = computed(() => store.historyStack.length > 0)
const canRedo = computed(() => store.redoStack.length > 0)

function applyCommand(command: string, value?: string) {
  ;(document as any).execCommand(command, false, value)
}

function addBlock(type: 'text' | 'heading' | 'image' | 'gallery' | 'quote' | 'divider' | 'two_column') {
  store.addBlock(type)
}

function createGalleryImage(patch: Record<string, any> = {}) {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    src: '',
    alt: '',
    caption: '',
    ...patch,
  }
}

function formatHeading(level: string) {
  if (!level) return
  applyCommand('formatBlock', level)
}

function applyFontFamily(value: string) {
  fontFamily.value = value
  applyCommand('fontName', value)
}

function applyFontSize(value: string) {
  fontSize.value = value
  const selected = store.selectedBlock
  if (selected) {
    store.updateBlockProps(selected.id, { fontSize: Number(value) })
  }
}

function onBack() {
  router.push({ name: 'AdminDashboard', query: { section: 'posts' } })
}

function openColorPicker(target: 'text' | 'highlight') {
  const input = target === 'text' ? textColorInput.value : highlightColorInput.value
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker()
    return
  }
  input.click()
}

function applyTextColor(value: string) {
  textColor.value = value
  applyCommand('foreColor', value)
}

function applyHighlightColor(value: string) {
  highlightColor.value = value
  applyCommand('hiliteColor', value)
}

function onTextHeadingChange(event: Event) {
  const select = event.target as HTMLSelectElement
  formatHeading(select.value)
  select.selectedIndex = 0
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function openImportPicker() {
  importInputRef.value?.click()
}

async function handleImportImages(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  try {
    const urls = (await Promise.all(files.map((file) => readFileAsDataUrl(file)))).filter(Boolean)
    if (!urls.length) return

    if (selectedBlock.value?.type === 'gallery') {
      const images = Array.isArray(selectedBlock.value.props?.images) ? [...selectedBlock.value.props.images] : []
      for (const url of urls) {
        images.push(createGalleryImage({ src: url }))
      }
      store.updateBlockProps(selectedBlock.value.id, { images }, { recordHistory: true })
      const last = images[images.length - 1]
      if (last?.id) {
        store.selectSubItem(String(last.id))
      }
      return
    }

    for (const url of urls) {
      const imageBlock = store.addBlock('image')
      if (!imageBlock) continue
      store.updateBlockProps(imageBlock.id, { src: url }, { recordHistory: false })
    }
  } catch (error) {
    console.error(error)
  } finally {
    input.value = ''
  }
}
</script>

<template>
  <div class="toolbar-shell">
    <div class="toolbar-main">
      <div class="toolbar-groups">
        <div class="toolbar-group toolbar-group--compact">
          <button type="button" class="btn-ghost" @click="onBack">Back</button>
          <button type="button" class="btn-tool" :disabled="!canUndo" @click="store.undo()">Undo</button>
          <button type="button" class="btn-tool" :disabled="!canRedo" @click="store.redo()">Redo</button>
        </div>

        <div class="toolbar-group">
          <span class="group-label">Blocks</span>
          <button type="button" class="btn-tool btn-tool--with-icon" @click="addBlock('text')">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h14M6 5v10M14 5v10M4.5 15h11" /></svg>
            Text Block
          </button>
          <button type="button" class="btn-tool btn-tool--with-icon" @click="addBlock('image')">
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="4.5" width="13" height="11" rx="1.5" /><path d="m5.5 13.5 3.8-3.8 2.5 2.5 2.7-2.7 1.8 1.8" /><circle cx="7.2" cy="7.8" r="1.1" /></svg>
            Image
          </button>
          <button type="button" class="btn-tool btn-tool--with-icon" @click="addBlock('gallery')">
            <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="4.5" width="4.2" height="4.2" rx="0.8" /><rect x="8.9" y="4.5" width="4.2" height="4.2" rx="0.8" /><rect x="14.3" y="4.5" width="2.2" height="4.2" rx="0.8" /><rect x="3.5" y="9.9" width="4.2" height="4.2" rx="0.8" /><rect x="8.9" y="9.9" width="4.2" height="4.2" rx="0.8" /><rect x="14.3" y="9.9" width="2.2" height="4.2" rx="0.8" /></svg>
            Gallery
          </button>
          <button type="button" class="btn-tool btn-tool--with-icon" @click="openImportPicker">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3.5v8m0 0 3-3m-3 3-3-3M4.5 12.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" /></svg>
            Import
          </button>
          <input ref="importInputRef" class="input-hidden" type="file" accept="image/*" multiple @change="handleImportImages" />
          <select class="toolbar-select toolbar-select--wide" @change="onTextHeadingChange">
            <option value="">Text Heading...</option>
            <option value="H1">Heading 1</option>
            <option value="H2">Heading 2</option>
            <option value="H3">Heading 3</option>
            <option value="P">Normal paragraph</option>
          </select>
        </div>

        <div class="toolbar-group">
          <span class="group-label">Layout</span>
          <button type="button" class="btn-tool" @click="addBlock('heading')">Heading Block</button>
          <button type="button" class="btn-tool" @click="addBlock('quote')">Quote Block</button>
          <button type="button" class="btn-tool" @click="addBlock('divider')">Divider</button>
          <button type="button" class="btn-tool" @click="addBlock('two_column')">Two column</button>
          <button type="button" class="btn-tool" @click="emit('import-source')">Import URL</button>
        </div>

        <div class="toolbar-group toolbar-group--compact">
          <span class="group-label">Text</span>
          <select class="toolbar-select toolbar-select--wide" :value="fontFamily" @change="applyFontFamily(($event.target as HTMLSelectElement).value)">
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="'Times New Roman'">Times New Roman</option>
            <option value="Verdana">Verdana</option>
          </select>

          <select class="toolbar-select" :value="fontSize" @change="applyFontSize(($event.target as HTMLSelectElement).value)">
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
            <option value="20">20</option>
            <option value="24">24</option>
            <option value="32">32</option>
          </select>
        </div>

        <div class="toolbar-group toolbar-group--compact">
          <span class="group-label">Format</span>
          <button type="button" class="btn-tool btn-tool--icon" @click="applyCommand('bold')"><strong>B</strong></button>
          <button type="button" class="btn-tool btn-tool--icon" @click="applyCommand('italic')"><em>I</em></button>
          <button type="button" class="btn-tool btn-tool--icon" @click="applyCommand('underline')"><u>U</u></button>
          <button
            type="button"
            class="btn-tool btn-tool--color"
            title="Text Highlight Color"
            aria-label="Text Highlight Color"
            @click="openColorPicker('highlight')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 13.5 6.7-6.7 2.8 2.8-6.7 6.7H5v-2.8Z" />
              <path d="M4 18h12" />
            </svg>
            <span class="color-swatch-line" :style="{ background: highlightColor }" />
            <input
              ref="highlightColorInput"
              type="color"
              class="color-input-hidden"
              :value="highlightColor"
              @input="applyHighlightColor(($event.target as HTMLInputElement).value)"
            />
          </button>
          <button
            type="button"
            class="btn-tool btn-tool--color"
            title="Font Color"
            aria-label="Font Color"
            @click="openColorPicker('text')"
          >
            <span class="font-color-icon">A</span>
            <span class="color-swatch-line" :style="{ background: textColor }" />
            <input
              ref="textColorInput"
              type="color"
              class="color-input-hidden"
              :value="textColor"
              @input="applyTextColor(($event.target as HTMLInputElement).value)"
            />
          </button>
          <button type="button" class="btn-tool btn-tool--icon" @click="applyCommand('removeFormat')">Clear</button>
        </div>

        <div class="toolbar-group toolbar-group--compact">
          <span class="group-label">Align</span>
          <button
            type="button"
            class="btn-tool btn-tool--icon"
            title="Align Left"
            aria-label="Align Left"
            @click="applyCommand('justifyLeft')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 5h12M3 8.5h9M3 12h12M3 15.5h9" />
            </svg>
          </button>
          <button
            type="button"
            class="btn-tool btn-tool--icon"
            title="Center"
            aria-label="Center"
            @click="applyCommand('justifyCenter')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 5h12M6 8.5h8M4 12h12M6 15.5h8" />
            </svg>
          </button>
          <button
            type="button"
            class="btn-tool btn-tool--icon"
            title="Align Right"
            aria-label="Align Right"
            @click="applyCommand('justifyRight')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5h12M8 8.5h9M5 12h12M8 15.5h9" />
            </svg>
          </button>
          <button
            type="button"
            class="btn-tool btn-tool--icon"
            title="Justify"
            aria-label="Justify"
            @click="applyCommand('justifyFull')"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 5h14M3 8.5h14M3 12h14M3 15.5h14" />
            </svg>
          </button>
        </div>

        <div class="toolbar-group toolbar-group--compact">
          <span class="group-label">Headings</span>
          <button type="button" class="btn-tool" @click="formatHeading('H1')">H1</button>
          <button type="button" class="btn-tool" @click="formatHeading('H2')">H2</button>
          <button type="button" class="btn-tool" @click="formatHeading('H3')">H3</button>
          <button type="button" class="btn-tool" @click="formatHeading('BLOCKQUOTE')">Quote</button>
        </div>
      </div>

      <div class="toolbar-actions">
        <span v-if="props.saveStatus === 'saving'" class="status">Saving...</span>
        <span v-else-if="props.saveStatus === 'saved'" class="status status-success">Saved</span>
        <span v-else-if="props.saveStatus === 'error'" class="status status-error">Error</span>

        <button type="button" class="btn-secondary" @click="emit('preview')">Preview</button>
        <button type="button" class="btn-secondary" @click="emit('save')">Save Draft</button>
        <button type="button" class="btn-primary" @click="emit('publish')">Publish</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-shell {
  position: sticky;
  top: 0;
  z-index: 40;
  background: #ffffff;
  border-bottom: 1px solid #dbe2ec;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
}

.toolbar-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
}

.toolbar-groups {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
}

.toolbar-group--compact {
  gap: 5px;
}

.group-label {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 6px 0 2px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 250px;
  padding-top: 2px;
}

.btn-tool,
.btn-ghost,
.btn-secondary,
.btn-primary,
.toolbar-select {
  min-height: 32px;
  border-radius: 8px;
  border: 1px solid #d6dfea;
  background: #fff;
  color: #1f2937;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 10px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-tool--icon {
  min-width: 32px;
  padding: 7px 8px;
}

.btn-tool--with-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-tool--icon svg {
  width: 14px;
  height: 14px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.btn-tool--with-icon svg {
  width: 13px;
  height: 13px;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.btn-tool--color {
  position: relative;
  width: 32px;
  min-width: 32px;
  padding: 4px 4px 5px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.btn-tool--color svg {
  width: 15px;
  height: 15px;
  display: block;
  fill: none;
  stroke: #1f2937;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.font-color-icon {
  font-size: 14px;
  line-height: 1;
  font-weight: 700;
  color: #1f2937;
}

.color-swatch-line {
  width: 16px;
  height: 4px;
  border-radius: 999px;
}

.btn-tool:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-tool:hover,
.btn-ghost:hover,
.btn-secondary:hover,
.toolbar-select:hover {
  background: #f2f6fb;
}

.btn-primary {
  background: #0b76d1;
  color: #fff;
  border-color: #0b76d1;
}

.btn-primary:hover {
  background: #0768b7;
}

.toolbar-select {
  min-width: 82px;
}

.toolbar-select--wide {
  min-width: 124px;
}

.color-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.input-hidden {
  display: none;
}

.status {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  white-space: nowrap;
}

.status-success {
  color: #15803d;
}

.status-error {
  color: #b91c1c;
}

@media (max-width: 1280px) {
  .toolbar-main {
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
    min-width: 0;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .toolbar-shell {
    position: static;
  }

  .toolbar-main {
    padding: 10px;
    gap: 12px;
  }

  .toolbar-groups {
    gap: 8px;
  }

  .toolbar-group {
    width: 100%;
  }

  .toolbar-actions {
    gap: 6px;
  }

  .btn-tool,
  .btn-ghost,
  .btn-secondary,
  .btn-primary,
  .toolbar-select {
    font-size: 11px;
    padding: 6px 9px;
  }
}
</style>
