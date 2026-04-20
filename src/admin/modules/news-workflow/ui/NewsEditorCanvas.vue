<script setup>
import { computed, onBeforeUnmount } from 'vue'

import { useNewsWorkflowEditorStore } from '@/admin/state/newsWorkflowEditor.js'

const store = useNewsWorkflowEditorStore()

const pointerState = {
  mode: null,
  blockId: '',
  startClientX: 0,
  startClientY: 0,
  originX: 0,
  originY: 0,
  originW: 0,
  originH: 0,
}

const canvasHeight = computed(() => {
  if (!store.blocks.length) return 1080
  const maxBottom = Math.max(...store.blocks.map((block) => block.y + block.h))
  return Math.max(1080, maxBottom + 180)
})

const selectedId = computed(() => store.selectedBlockId)
const selectedSubId = computed(() => store.selectedSubItemId)

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value))
}

function startDrag(event, block) {
  event.preventDefault()
  event.stopPropagation()
  pointerState.mode = 'drag'
  pointerState.blockId = block.id
  pointerState.startClientX = event.clientX
  pointerState.startClientY = event.clientY
  pointerState.originX = block.x
  pointerState.originY = block.y
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
}

function startResize(event, block) {
  event.preventDefault()
  event.stopPropagation()
  pointerState.mode = 'resize'
  pointerState.blockId = block.id
  pointerState.startClientX = event.clientX
  pointerState.startClientY = event.clientY
  pointerState.originW = block.w
  pointerState.originH = block.h
  window.addEventListener('mousemove', onPointerMove)
  window.addEventListener('mouseup', onPointerUp)
}

function onPointerMove(event) {
  const block = store.blocks.find((item) => item.id === pointerState.blockId)
  if (!block || !pointerState.mode) return

  const dx = event.clientX - pointerState.startClientX
  const dy = event.clientY - pointerState.startClientY

  if (pointerState.mode === 'drag') {
    const maxX = Math.max(0, store.page.width - block.w)
    const nextX = clamp(Math.round(pointerState.originX + dx), 0, maxX)
    const nextY = clamp(Math.round(pointerState.originY + dy), 0, 24000)
    store.moveBlock(block.id, nextX, nextY, { recordHistory: false })
    return
  }

  const nextW = clamp(Math.round(pointerState.originW + dx), 80, 1400)
  const nextH = clamp(Math.round(pointerState.originH + dy), 36, 1800)
  store.resizeBlock(block.id, nextW, nextH, { recordHistory: false })
}

function onPointerUp() {
  const block = store.blocks.find((item) => item.id === pointerState.blockId)
  if (block && pointerState.mode === 'drag') {
    store.moveBlock(block.id, block.x, block.y, { recordHistory: true })
  }
  if (block && pointerState.mode === 'resize') {
    store.resizeBlock(block.id, block.w, block.h, { recordHistory: true })
  }
  pointerState.mode = null
  pointerState.blockId = ''
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
}

function updateEditableContent(block, html) {
  store.updateBlockContent(block.id, html, { recordHistory: false })
}

function flushEditableContent(block, html) {
  store.updateBlockContent(block.id, html, { recordHistory: true })
}

function updateTwoColumn(block, key, html, commit = false) {
  store.updateBlockProps(block.id, { [key]: html }, { recordHistory: commit })
}

function selectBlock(event, blockId) {
  event.stopPropagation()
  store.selectBlock(blockId)
}

function selectGalleryItem(event, blockId, itemId) {
  event.stopPropagation()
  store.selectBlock(blockId)
  store.selectSubItem(itemId)
}

function removeGalleryItem(event, block, itemId) {
  event.stopPropagation()
  const images = Array.isArray(block.props?.images) ? [...block.props.images] : []
  const nextImages = images.filter((item) => String(item?.id || '') !== itemId)
  store.updateBlockProps(block.id, { images: nextImages }, { recordHistory: true })
  if (store.selectedSubItemId === itemId) {
    store.selectSubItem(null)
  }
}

function deleteBlock(blockId) {
  store.deleteBlock(blockId)
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPointerMove)
  window.removeEventListener('mouseup', onPointerUp)
})

function getImageCaption(block) {
  return String(block.props?.caption || block.props?.captionText || '')
}
</script>

<template>
  <div class="canvas-shell" @click="store.selectBlock(null)">
    <div class="canvas-page" :style="{ width: `${store.page.width}px`, minHeight: `${canvasHeight}px`, background: store.page.background }">
      <div
        v-for="block in store.blocks"
        :key="block.id"
        class="canvas-block"
        :class="{ 'is-selected': selectedId === block.id }"
        :style="{ left: `${block.x}px`, top: `${block.y}px`, width: `${block.w}px`, height: `${block.h}px` }"
        @click="selectBlock($event, block.id)"
      >
        <div class="block-actions" v-if="selectedId === block.id">
          <button type="button" class="block-action-btn" @mousedown="startDrag($event, block)">Move</button>
          <button type="button" class="block-action-btn danger" @click.stop="deleteBlock(block.id)">Delete</button>
        </div>

        <template v-if="block.type === 'text' || block.type === 'heading' || block.type === 'quote'">
          <div
            class="editable-block"
            :style="{
              fontFamily: String(block.props?.fontFamily || ''),
              fontSize: block.props?.fontSize ? `${Number(block.props.fontSize)}px` : undefined,
              lineHeight: block.props?.lineHeight ? String(block.props.lineHeight) : undefined,
              color: String(block.props?.color || ''),
              textAlign: String(block.props?.textAlign || ''),
              fontWeight: String(block.props?.fontWeight || ''),
              fontStyle: String(block.props?.fontStyle || ''),
              textDecoration: String(block.props?.textDecoration || ''),
              backgroundColor: String(block.props?.backgroundColor || ''),
            }"
            contenteditable="true"
            spellcheck="false"
            :innerHTML="block.content"
            @input="updateEditableContent(block, $event.target.innerHTML)"
            @blur="flushEditableContent(block, $event.target.innerHTML)"
          />
        </template>

        <template v-else-if="block.type === 'image'">
          <figure class="image-block" :class="`align-${block.props?.align || 'left'}`">
            <div class="image-media">
              <img
                v-if="block.props?.src"
                :src="block.props.src"
                :alt="block.props?.alt || ''"
                :style="{
                  borderRadius: `${Number(block.props?.borderRadius || 0)}px`,
                  objectFit: String(block.props?.objectFit || 'cover'),
                  opacity: String(block.props?.opacity ?? 1),
                }"
              />
              <div v-else class="image-placeholder">No image selected</div>
            </div>
            <figcaption v-if="getImageCaption(block)">{{ getImageCaption(block) }}</figcaption>
          </figure>
        </template>

        <template v-else-if="block.type === 'gallery'">
          <section
            class="gallery-block"
            :class="`align-${block.props?.align || 'center'}`"
            :style="{
              gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, Number(block.props?.columns || 3)))}, minmax(0, 1fr))`,
              gap: `${Number(block.props?.gap || 12)}px`,
            }"
          >
            <figure
              v-for="(item, index) in (Array.isArray(block.props?.images) ? block.props.images : [])"
              :key="`${block.id}-${item?.id || index}`"
              class="gallery-item"
              :class="{ 'is-selected': selectedSubId === String(item?.id || '') }"
              @click="selectGalleryItem($event, block.id, String(item?.id || ''))"
            >
              <button
                v-if="selectedId === block.id && selectedSubId === String(item?.id || '')"
                type="button"
                class="gallery-item-delete"
                title="Remove from gallery"
                @click="removeGalleryItem($event, block, String(item?.id || ''))"
              >
                Ã—
              </button>
              <div class="gallery-item-media">
                <img
                  v-if="item?.src"
                  :src="item.src"
                  :alt="item?.alt || ''"
                  :style="{
                    borderRadius: `${Number(block.props?.borderRadius || 0)}px`,
                    objectFit: String(block.props?.objectFit || 'cover'),
                  }"
                />
                <div v-else class="image-placeholder">No image selected</div>
              </div>
              <figcaption v-if="item?.caption">{{ item.caption }}</figcaption>
            </figure>
          </section>
        </template>

        <template v-else-if="block.type === 'divider'">
          <hr />
        </template>

        <template v-else-if="block.type === 'two_column'">
          <div class="two-column-block" :style="{ gap: `${Number(block.props?.gap || 24)}px` }">
            <div
              class="editable-column"
              contenteditable="true"
              spellcheck="false"
              :innerHTML="block.props?.leftContent || ''"
              @input="updateTwoColumn(block, 'leftContent', $event.target.innerHTML, false)"
              @blur="updateTwoColumn(block, 'leftContent', $event.target.innerHTML, true)"
            />
            <div
              class="editable-column"
              contenteditable="true"
              spellcheck="false"
              :innerHTML="block.props?.rightContent || ''"
              @input="updateTwoColumn(block, 'rightContent', $event.target.innerHTML, false)"
              @blur="updateTwoColumn(block, 'rightContent', $event.target.innerHTML, true)"
            />
          </div>
        </template>

        <button
          type="button"
          class="resize-handle"
          @mousedown="startResize($event, block)"
          aria-label="Resize block"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-shell {
  flex: 1;
  overflow: auto;
  background: #f4f6f9;
  padding: 32px;
  display: flex;
  justify-content: center;
}

.canvas-page {
  position: relative;
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.14);
  border-radius: 4px;
}

.canvas-block {
  position: absolute;
  box-sizing: border-box;
  border: 1px dashed transparent;
  padding: 8px;
}

.canvas-block.is-selected {
  border-color: #0b76d1;
  box-shadow: 0 0 0 2px rgba(11, 118, 209, 0.2);
}

.block-actions {
  position: absolute;
  top: -34px;
  left: 0;
  display: flex;
  gap: 6px;
}

.block-action-btn {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1f2937;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 8px;
  cursor: pointer;
}

.block-action-btn.danger {
  border-color: #efb2b2;
  color: #b91c1c;
}

.editable-block {
  width: 100%;
  height: 100%;
  outline: none;
  overflow: auto;
}

.editable-block :deep(p) {
  margin: 0 0 10px;
}

.image-block {
  margin: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.image-media {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.image-block img {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  border: 1px dashed #cbd5e1;
  display: grid;
  place-items: center;
  color: #64748b;
  font-size: 12px;
}

.image-block figcaption {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.gallery-block {
  width: 100%;
  height: 100%;
  display: grid;
  align-content: start;
  min-width: 0;
  min-height: 0;
}

.gallery-item {
  margin: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  min-width: 0;
  min-height: 0;
}

.gallery-item.is-selected {
  box-shadow: 0 0 0 2px #0b76d1 inset;
}

.gallery-item-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
}

.gallery-item img {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 120px;
  max-height: 100%;
}

.gallery-item-media {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  border-radius: 8px;
}

.gallery-item figcaption {
  margin-top: 6px;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}

.two-column-block {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.editable-column {
  border: 1px dashed #d7dee8;
  min-height: 100%;
  padding: 10px;
  outline: none;
  overflow: auto;
}

.resize-handle {
  position: absolute;
  right: -8px;
  bottom: -8px;
  width: 14px;
  height: 14px;
  border: 1px solid #0b76d1;
  background: #fff;
  border-radius: 999px;
  cursor: nwse-resize;
}
</style>




