<script setup>
import { computed, onMounted, ref } from 'vue'

import { listNewsCategories, listNewsImages, uploadNewsImage } from '@/admin/api/newsWorkflowApi.js'
import { useNewsWorkflowEditorStore } from '@/admin/state/newsWorkflowEditor.js'

const store = useNewsWorkflowEditorStore()
const uploading = ref(false)
const loadingLibrary = ref(false)
const libraryOpen = ref(false)
const imageLibrary = ref([])
const categoryOptions = ref([])

const selectedBlock = computed(() => store.selectedBlock)

const selectedGalleryIndex = computed(() => {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return -1
  const images = getGalleryImages()
  return images.findIndex((image) => String(image?.id || '') === String(store.selectedSubItemId || ''))
})

function createGalleryImage(patch = {}) {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    src: '',
    alt: '',
    caption: '',
    ...patch,
  }
}

function updatePostField(key, value) {
  store.setPostField(key, value)
}

function updateCategory(categoryId) {
  const normalized = Number(categoryId)
  store.setPostField('category_ids', Number.isFinite(normalized) && normalized > 0 ? [normalized] : [])
}

function getGalleryImages() {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return []
  return Array.isArray(selectedBlock.value.props?.images) ? [...selectedBlock.value.props.images] : []
}

function setGalleryImages(images, recordHistory = true) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return
  store.updateBlockProps(selectedBlock.value.id, { images }, { recordHistory })
}

async function toggleLibrary() {
  libraryOpen.value = !libraryOpen.value
  if (!libraryOpen.value || imageLibrary.value.length) return
  loadingLibrary.value = true
  try {
    const payload = await listNewsImages({ page: 1, limit: 30 })
    imageLibrary.value = payload.items || []
  } catch (error) {
    console.error(error)
  } finally {
    loadingLibrary.value = false
  }
}

function applyImage(url) {
  if (!selectedBlock.value) return

  if (selectedBlock.value.type === 'image') {
    store.updateBlockProps(selectedBlock.value.id, { src: url }, { recordHistory: true })
    return
  }

  if (selectedBlock.value.type === 'gallery') {
    const images = getGalleryImages()
    if (selectedGalleryIndex.value >= 0) {
      images[selectedGalleryIndex.value] = createGalleryImage({
        ...(images[selectedGalleryIndex.value] || {}),
        src: url,
      })
      setGalleryImages(images, true)
      return
    }
    const image = createGalleryImage({ src: url })
    setGalleryImages([...images, image], true)
    store.selectSubItem(image.id)
  }
}

async function handleImageUpload(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file || !selectedBlock.value || (selectedBlock.value.type !== 'image' && selectedBlock.value.type !== 'gallery')) return

  uploading.value = true
  try {
    const uploaded = await uploadNewsImage(file, {
      title: store.post.title,
      altText: selectedBlock.value.type === 'image' ? selectedBlock.value.props?.alt || '' : '',
    })

    if (selectedBlock.value.type === 'image') {
      store.updateBlockProps(selectedBlock.value.id, { src: uploaded.file_url }, { recordHistory: true })
      return
    }

    const images = getGalleryImages()
    if (selectedGalleryIndex.value >= 0) {
      images[selectedGalleryIndex.value] = createGalleryImage({
        ...(images[selectedGalleryIndex.value] || {}),
        src: uploaded.file_url,
      })
      setGalleryImages(images, true)
      return
    }

    const image = createGalleryImage({ src: uploaded.file_url })
    setGalleryImages([...images, image], true)
    store.selectSubItem(image.id)
  } catch (error) {
    console.error(error)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function replaceGalleryItemFile(index, event) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return
  const input = event.target
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const uploaded = await uploadNewsImage(file, {
      title: store.post.title,
      altText: '',
    })
    const images = getGalleryImages()
    images[index] = createGalleryImage({
      ...(images[index] || {}),
      src: uploaded.file_url,
    })
    setGalleryImages(images, true)
  } catch (error) {
    console.error(error)
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function addGalleryItem() {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return
  const image = createGalleryImage()
  const images = [...getGalleryImages(), image]
  setGalleryImages(images, true)
  store.selectSubItem(image.id)
}

function updateGalleryItem(index, patch) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return
  const images = getGalleryImages()
  images[index] = createGalleryImage({
    ...(images[index] || {}),
    ...patch,
  })
  setGalleryImages(images, true)
}

function moveGalleryItem(index, direction) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return
  const images = getGalleryImages()
  if (!images.length) return

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= images.length) return

  const moved = images[index]
  images[index] = images[targetIndex]
  images[targetIndex] = moved
  setGalleryImages(images, true)
}

function removeGalleryItem(index) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'gallery') return
  const images = getGalleryImages()
  const removing = images[index]
  const nextImages = images.filter((_, itemIndex) => itemIndex !== index)
  setGalleryImages(nextImages, true)

  if (!nextImages.length) {
    store.selectSubItem(null)
    return
  }

  if (String(store.selectedSubItemId || '') === String(removing?.id || '')) {
    const nextIndex = Math.max(0, Math.min(index, nextImages.length - 1))
    store.selectSubItem(String(nextImages[nextIndex]?.id || ''))
  }
}

async function loadCategories() {
  try {
    categoryOptions.value = await listNewsCategories()
  } catch (error) {
    console.error(error)
  }
}

onMounted(loadCategories)
</script>

<template>
  <aside class="editor-sidebar">
    <section class="panel">
      <h3>Post settings</h3>
      <label class="field">
        <span>Title</span>
        <input :value="store.post.title" type="text" @input="updatePostField('title', $event.target.value)" />
      </label>
      <label class="field">
        <span>Slug</span>
        <input :value="store.post.slug" type="text" @input="updatePostField('slug', $event.target.value)" />
      </label>
      <label class="field">
        <span>Summary</span>
        <textarea :value="store.post.summary" rows="3" @input="updatePostField('summary', $event.target.value)" />
      </label>
      <label class="field">
        <span>Thumbnail URL</span>
        <input :value="store.post.thumbnail_url" type="text" placeholder="https://..." @input="updatePostField('thumbnail_url', $event.target.value)" />
      </label>
      <label class="field">
        <span>Status</span>
        <select :value="store.post.status" @change="store.setStatus($event.target.value)">
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </label>
      <label class="field">
        <span>Category</span>
        <select :value="String(store.post.category_ids?.[0] || '')" @change="updateCategory($event.target.value)">
          <option value="">No category</option>
          <option v-for="category in categoryOptions" :key="category.id" :value="String(category.id)">{{ category.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>Source URL</span>
        <input :value="store.post.source_url" type="text" @input="updatePostField('source_url', $event.target.value)" />
      </label>
      <label class="field">
        <span>Source note</span>
        <textarea :value="store.post.source_note" rows="3" @input="updatePostField('source_note', $event.target.value)" />
      </label>
    </section>

    <section class="panel">
      <h3>Layout settings</h3>
      <label class="field">
        <span>Page width</span>
        <input :value="store.page.width" type="number" min="600" max="1600" @input="store.setPage({ width: Number($event.target.value || 900) })" />
      </label>
      <label class="field">
        <span>Background</span>
        <div class="field-inline">
          <input :value="store.page.background" type="color" @input="store.setPage({ background: $event.target.value })" />
          <input :value="store.page.background" type="text" @input="store.setPage({ background: $event.target.value })" />
        </div>
      </label>
    </section>

    <section class="panel">
      <h3>Block properties</h3>
      <p v-if="!selectedBlock" class="placeholder">Select a block to edit properties.</p>

      <template v-else>
        <label class="field">
          <span>Type</span>
          <input :value="selectedBlock.type" type="text" disabled />
        </label>

        <div class="grid-two">
          <label class="field">
            <span>X</span>
            <input :value="selectedBlock.x" type="number" @input="store.moveBlock(selectedBlock.id, Number($event.target.value), selectedBlock.y)" />
          </label>
          <label class="field">
            <span>Y</span>
            <input :value="selectedBlock.y" type="number" @input="store.moveBlock(selectedBlock.id, selectedBlock.x, Number($event.target.value))" />
          </label>
          <label class="field">
            <span>W</span>
            <input :value="selectedBlock.w" type="number" @input="store.resizeBlock(selectedBlock.id, Number($event.target.value), selectedBlock.h)" />
          </label>
          <label class="field">
            <span>H</span>
            <input :value="selectedBlock.h" type="number" @input="store.resizeBlock(selectedBlock.id, selectedBlock.w, Number($event.target.value))" />
          </label>
        </div>

        <template v-if="selectedBlock.type === 'text' || selectedBlock.type === 'heading' || selectedBlock.type === 'quote'">
          <label class="field">
            <span>Font family</span>
            <input :value="selectedBlock.props?.fontFamily || ''" type="text" @input="store.updateBlockProps(selectedBlock.id, { fontFamily: $event.target.value })" />
          </label>
          <div class="grid-two">
            <label class="field">
              <span>Font size</span>
              <input :value="selectedBlock.props?.fontSize || 16" type="number" @input="store.updateBlockProps(selectedBlock.id, { fontSize: Number($event.target.value || 16) })" />
            </label>
            <label class="field">
              <span>Line height</span>
              <input :value="selectedBlock.props?.lineHeight || 1.6" type="number" step="0.1" @input="store.updateBlockProps(selectedBlock.id, { lineHeight: Number($event.target.value || 1.6) })" />
            </label>
          </div>
          <label class="field">
            <span>Align</span>
            <select :value="selectedBlock.props?.textAlign || 'left'" @change="store.updateBlockProps(selectedBlock.id, { textAlign: $event.target.value })">
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
              <option value="justify">justify</option>
            </select>
          </label>
          <label class="field">
            <span>Text color</span>
            <input :value="selectedBlock.props?.color || '#111827'" type="color" @input="store.updateBlockProps(selectedBlock.id, { color: $event.target.value })" />
          </label>
          <label class="field">
            <span>Highlight</span>
            <input :value="selectedBlock.props?.backgroundColor || '#ffffff'" type="color" @input="store.updateBlockProps(selectedBlock.id, { backgroundColor: $event.target.value })" />
          </label>
        </template>

        <template v-if="selectedBlock.type === 'image'">
          <label class="field">
            <span>Image URL</span>
            <input :value="selectedBlock.props?.src || ''" type="text" @input="store.updateBlockProps(selectedBlock.id, { src: $event.target.value })" />
          </label>
          <label class="field">
            <span>Upload image</span>
            <input type="file" accept="image/*" :disabled="uploading" @change="handleImageUpload" />
          </label>
          <button type="button" class="btn-secondary" @click="toggleLibrary">
            {{ libraryOpen ? 'Hide image library' : 'Open image library' }}
          </button>
          <div v-if="libraryOpen" class="library">
            <p v-if="loadingLibrary" class="placeholder">Loading images...</p>
            <div v-else class="library-grid">
              <button v-for="asset in imageLibrary" :key="asset.id" type="button" class="library-item" @click="applyImage(asset.file_url)">
                <img :src="asset.file_url" :alt="asset.alt_text || asset.file_name || ''" />
              </button>
            </div>
          </div>
          <label class="field">
            <span>Alt text</span>
            <input :value="selectedBlock.props?.alt || ''" type="text" @input="store.updateBlockProps(selectedBlock.id, { alt: $event.target.value })" />
          </label>
          <label class="field">
            <span>Caption</span>
            <input :value="selectedBlock.props?.caption || ''" type="text" @input="store.updateBlockProps(selectedBlock.id, { caption: $event.target.value })" />
          </label>
          <div class="grid-two">
            <label class="field">
              <span>Border radius</span>
              <input :value="selectedBlock.props?.borderRadius || 0" type="number" @input="store.updateBlockProps(selectedBlock.id, { borderRadius: Number($event.target.value || 0) })" />
            </label>
            <label class="field">
              <span>Object fit</span>
              <select :value="selectedBlock.props?.objectFit || 'cover'" @change="store.updateBlockProps(selectedBlock.id, { objectFit: $event.target.value })">
                <option value="cover">cover</option>
                <option value="contain">contain</option>
                <option value="fill">fill</option>
                <option value="none">none</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>Align</span>
            <select :value="selectedBlock.props?.align || 'center'" @change="store.updateBlockProps(selectedBlock.id, { align: $event.target.value })">
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </label>
        </template>

        <template v-if="selectedBlock.type === 'gallery'">
          <div class="grid-two">
            <label class="field">
              <span>Columns</span>
              <input :value="selectedBlock.props?.columns || 2" type="number" min="1" max="6" @input="store.updateBlockProps(selectedBlock.id, { columns: Number($event.target.value || 2) })" />
            </label>
            <label class="field">
              <span>Gap</span>
              <input :value="selectedBlock.props?.gap || 12" type="number" min="0" @input="store.updateBlockProps(selectedBlock.id, { gap: Number($event.target.value || 12) })" />
            </label>
          </div>
          <div class="grid-two">
            <label class="field">
              <span>Border radius</span>
              <input :value="selectedBlock.props?.borderRadius || 8" type="number" min="0" @input="store.updateBlockProps(selectedBlock.id, { borderRadius: Number($event.target.value || 8) })" />
            </label>
            <label class="field">
              <span>Object fit</span>
              <select :value="selectedBlock.props?.objectFit || 'cover'" @change="store.updateBlockProps(selectedBlock.id, { objectFit: $event.target.value })">
                <option value="cover">cover</option>
                <option value="contain">contain</option>
                <option value="fill">fill</option>
                <option value="none">none</option>
              </select>
            </label>
          </div>

          <label class="field">
            <span>Upload image</span>
            <input type="file" accept="image/*" :disabled="uploading" @change="handleImageUpload" />
          </label>
          <button type="button" class="btn-secondary" @click="toggleLibrary">
            {{ libraryOpen ? 'Hide image library' : 'Open image library' }}
          </button>
          <div v-if="libraryOpen" class="library">
            <p v-if="loadingLibrary" class="placeholder">Loading images...</p>
            <div v-else class="library-grid">
              <button v-for="asset in imageLibrary" :key="asset.id" type="button" class="library-item" @click="applyImage(asset.file_url)">
                <img :src="asset.file_url" :alt="asset.alt_text || asset.file_name || ''" />
              </button>
            </div>
          </div>

          <div class="gallery-list-header">
            <span>Images</span>
            <button type="button" class="btn-link" @click="addGalleryItem">Add</button>
          </div>

          <div class="gallery-list">
            <article
              v-for="(image, index) in (Array.isArray(selectedBlock.props?.images) ? selectedBlock.props.images : [])"
              :key="String(image?.id || `${selectedBlock.id}-gallery-${index}`)"
              class="gallery-item-editor"
              :class="{ selected: String(store.selectedSubItemId || '') === String(image?.id || '') }"
              @click="store.selectSubItem(String(image?.id || ''))"
            >
              <div class="gallery-item-main">
                <img :src="image?.src || ''" alt="" />
                <div class="gallery-item-fields">
                  <input :value="image?.src || ''" type="text" placeholder="Image URL..." @input="updateGalleryItem(index, { src: $event.target.value })" />
                  <input :value="image?.caption || ''" type="text" placeholder="Caption..." @input="updateGalleryItem(index, { caption: $event.target.value })" />
                </div>
                <div class="gallery-item-actions">
                  <button type="button" :disabled="index === 0" @click.stop="moveGalleryItem(index, 'up')">&uarr;</button>
                  <button type="button" :disabled="index === ((selectedBlock.props?.images?.length || 0) - 1)" @click.stop="moveGalleryItem(index, 'down')">&darr;</button>
                  <button type="button" class="danger" @click.stop="removeGalleryItem(index)">&times;</button>
                </div>
              </div>
              <label class="field">
                <span>Alt text</span>
                <input :value="image?.alt || ''" type="text" @input="updateGalleryItem(index, { alt: $event.target.value })" />
              </label>
              <label class="field">
                <span>Replace image</span>
                <input type="file" accept="image/*" :disabled="uploading" @change="replaceGalleryItemFile(index, $event)" />
              </label>
            </article>
          </div>
        </template>

        <template v-if="selectedBlock.type === 'two_column'">
          <label class="field">
            <span>Gap</span>
            <input :value="selectedBlock.props?.gap || 24" type="number" min="0" @input="store.updateBlockProps(selectedBlock.id, { gap: Number($event.target.value || 24) })" />
          </label>
        </template>

        <div class="actions">
          <button type="button" class="btn-secondary" @click="store.duplicateBlock(selectedBlock.id)">Duplicate block</button>
          <button type="button" class="btn-danger" @click="store.deleteBlock(selectedBlock.id)">Delete block</button>
        </div>
      </template>
    </section>
  </aside>
</template>

<style scoped>
.editor-sidebar {
  flex: 0 0 360px;
  width: 360px;
  min-width: 360px;
  max-width: 360px;
  align-self: flex-start;
  position: sticky;
  top: 72px;
  max-height: calc(100vh - 72px);
  border-left: 1px solid #dbe2ec;
  background: #fff;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  box-sizing: border-box;
}

.panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  flex: 0 0 auto;
}

.panel h3 {
  margin: 0 0 4px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field span {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  border: 1px solid #d6dfea;
  border-radius: 6px;
  padding: 8px 9px;
  font-size: 12px;
  outline: none;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: #0b76d1;
}

.field-inline {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 8px;
}

.grid-two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: start;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-secondary,
.btn-danger {
  border-radius: 6px;
  border: 1px solid #d6dfea;
  background: #f8fafc;
  color: #1f2937;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 10px;
  cursor: pointer;
}

.btn-danger {
  border-color: #f1b6b6;
  color: #b91c1c;
  background: #fff8f8;
}

.placeholder {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.library {
  border: 1px solid #d6dfea;
  border-radius: 6px;
  padding: 8px;
  max-height: 220px;
  overflow: auto;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.library-item {
  border: 1px solid #d6dfea;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  padding: 0;
  cursor: pointer;
}

.library-item img {
  width: 100%;
  height: 66px;
  object-fit: cover;
  display: block;
}

.gallery-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn-link {
  border: 0;
  background: transparent;
  color: #0b76d1;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  padding: 0;
}

.gallery-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gallery-item-editor {
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 8px;
  display: grid;
  gap: 6px;
}

.gallery-item-editor.selected {
  border-color: #0b76d1;
  box-shadow: 0 0 0 1px rgba(11, 118, 209, 0.2);
  background: #f8fbff;
}

.gallery-item-main {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 8px;
  align-items: center;
}

.gallery-item-main img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #d6dfea;
  background: #f8fafc;
}

.gallery-item-fields {
  display: grid;
  gap: 4px;
}

.gallery-item-fields input {
  border: 1px solid #d6dfea;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 11px;
}

.gallery-item-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gallery-item-actions button {
  border: 1px solid #d6dfea;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 6px;
  cursor: pointer;
}

.gallery-item-actions button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gallery-item-actions button.danger {
  color: #b91c1c;
  border-color: #efb2b2;
}

@media (max-width: 1280px) {
  .editor-sidebar {
    flex-basis: 320px;
    width: 320px;
    min-width: 320px;
    max-width: 320px;
  }
}
</style>



