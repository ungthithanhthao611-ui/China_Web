<template>
  <div class="cms-toolbar">
    <div class="cms-toolbar__group">
      <button class="cms-toolbar__btn cms-toolbar__btn--ghost" @click="$emit('back')">← Back</button>
      <button class="cms-toolbar__icon" :disabled="!canUndo" @click="$emit('undo')">↶</button>
      <button class="cms-toolbar__icon" :disabled="!canRedo" @click="$emit('redo')">↷</button>
    </div>

    <div class="cms-toolbar__divider"></div>

    <div class="cms-toolbar__group">
      <select class="cms-toolbar__select" :value="fontFamily" @change="$emit('set-font-family', $event.target.value)">
        <option v-for="font in fontFamilies" :key="font.value" :value="font.value">{{ font.label }}</option>
      </select>
      <select class="cms-toolbar__select cms-toolbar__select--size" :value="fontSize" @change="$emit('set-font-size', Number($event.target.value))">
        <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}</option>
      </select>
    </div>

    <div class="cms-toolbar__divider"></div>

    <div class="cms-toolbar__group">
      <button class="cms-toolbar__icon" :class="{ active: bold }" @click="$emit('toggle-bold')"><strong>B</strong></button>
      <button class="cms-toolbar__icon" :class="{ active: italic }" @click="$emit('toggle-italic')"><em>I</em></button>
      <button class="cms-toolbar__icon" :class="{ active: underline }" @click="$emit('toggle-underline')"><u>U</u></button>
    </div>

    <div class="cms-toolbar__divider"></div>

    <div class="cms-toolbar__group cms-toolbar__group--relative">
      <button class="cms-toolbar__btn" @click="$emit('toggle-text-color')">
        Text Color
        <span class="cms-toolbar__color-preview" :style="{ background: textColor }"></span>
      </button>
      <EditorColorPopover :open="textColorOpen" :model-value="textColor" @select="$emit('set-text-color', $event)" />
    </div>

    <div class="cms-toolbar__group cms-toolbar__group--relative">
      <button class="cms-toolbar__btn" @click="$emit('toggle-highlight-color')">
        Highlight
        <span class="cms-toolbar__color-preview" :style="{ background: highlightColor }"></span>
      </button>
      <EditorColorPopover :open="highlightOpen" :model-value="highlightColor" @select="$emit('set-highlight-color', $event)" />
    </div>

    <div class="cms-toolbar__divider"></div>

    <div class="cms-toolbar__group cms-toolbar__group--alignment" aria-label="Paragraph Alignment">
      <button class="cms-toolbar__icon cms-toolbar__icon--align" :class="{ active: align === 'left' }" title="Align Left" @click="$emit('set-align', 'left')">
        <span class="align-icon align-icon--left" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      </button>
      <button class="cms-toolbar__icon cms-toolbar__icon--align" :class="{ active: align === 'center' }" title="Center" @click="$emit('set-align', 'center')">
        <span class="align-icon align-icon--center" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      </button>
      <button class="cms-toolbar__icon cms-toolbar__icon--align" :class="{ active: align === 'right' }" title="Align Right" @click="$emit('set-align', 'right')">
        <span class="align-icon align-icon--right" aria-hidden="true">
          <span></span><span></span><span></span>
        </span>
      </button>
    </div>

    <div class="cms-toolbar__divider"></div>

    <div class="cms-toolbar__group">
      <select class="cms-toolbar__select" :value="textStyle" @change="$emit('set-text-style', $event.target.value)">
        <option value="paragraph">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>
      <select class="cms-toolbar__select" @change="$emit('set-bullet-style', $event.target.value)">
        <option value="">Bullet Library</option>
        <option v-for="item in bulletStyles" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select class="cms-toolbar__select" @change="$emit('set-number-style', $event.target.value)">
        <option value="">Numbering Library</option>
        <option v-for="item in numberStyles" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <button class="cms-toolbar__icon" @click="$emit('indent-down')">⇤</button>
      <button class="cms-toolbar__icon" @click="$emit('indent-up')">⇥</button>
    </div>

    <div class="cms-toolbar__spacer"></div>

    <div class="cms-toolbar__group">
      <span v-if="saveStatus === 'saving'" class="cms-toolbar__status">Saving...</span>
      <span v-else-if="saveStatus === 'saved'" class="cms-toolbar__status cms-toolbar__status--ok">Saved</span>
      <span v-else-if="saveStatus === 'error'" class="cms-toolbar__status cms-toolbar__status--error">Save failed</span>
      <button class="cms-toolbar__save" @click="$emit('save')">Save Article</button>
    </div>
  </div>
</template>

<script setup>
import EditorColorPopover from '@/views/admin/features/news/components/EditorColorPopover.vue'
import {
  BULLET_STYLES,
  FONT_FAMILIES,
  FONT_SIZES,
  NUMBER_STYLES,
} from '@/views/admin/features/news/components/toolbarOptions.js'

defineProps({
  canUndo: Boolean,
  canRedo: Boolean,
  bold: Boolean,
  italic: Boolean,
  underline: Boolean,
  align: {
    type: String,
    default: 'left',
  },
  textStyle: {
    type: String,
    default: 'paragraph',
  },
  fontFamily: {
    type: String,
    default: FONT_FAMILIES[0].value,
  },
  fontSize: {
    type: Number,
    default: 16,
  },
  textColor: {
    type: String,
    default: '#111827',
  },
  highlightColor: {
    type: String,
    default: '#fef08a',
  },
  textColorOpen: Boolean,
  highlightOpen: Boolean,
  saveStatus: {
    type: String,
    default: 'idle',
  },
})

defineEmits([
  'back', 'undo', 'redo', 'save',
  'toggle-bold', 'toggle-italic', 'toggle-underline',
  'set-font-family', 'set-font-size',
  'toggle-text-color', 'toggle-highlight-color',
  'set-text-color', 'set-highlight-color',
  'set-align', 'set-text-style', 'set-bullet-style', 'set-number-style',
  'indent-down', 'indent-up',
])

const fontFamilies = FONT_FAMILIES
const fontSizes = FONT_SIZES
const bulletStyles = BULLET_STYLES
const numberStyles = NUMBER_STYLES
</script>

<style scoped>
.cms-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 68px;
  padding: 12px 18px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
  flex-wrap: wrap;
  overflow: visible;
}

.cms-toolbar__group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cms-toolbar__group--relative {
  position: relative;
  z-index: 30;
}

.cms-toolbar__group--alignment {
  gap: 0;
  padding: 3px;
  border: 1px solid #dbe2ea;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.cms-toolbar__divider {
  width: 1px;
  height: 28px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.cms-toolbar__btn,
.cms-toolbar__icon,
.cms-toolbar__select,
.cms-toolbar__save {
  height: 40px;
  border-radius: 12px;
  border: 1px solid #dbe2ea;
  background: #fff;
  color: #0f172a;
}

.cms-toolbar__btn,
.cms-toolbar__save {
  padding: 0 14px;
  font-size: 13px;
  font-weight: 600;
}

.cms-toolbar__icon {
  width: 40px;
  font-size: 14px;
  font-weight: 700;
}

.cms-toolbar__icon.active,
.cms-toolbar__btn:hover,
.cms-toolbar__icon:hover,
.cms-toolbar__select:hover {
  background: #f8fafc;
}

.cms-toolbar__icon--align {
  border: 0;
  width: 42px;
  height: 38px;
  border-radius: 10px;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cms-toolbar__icon--align.active {
  background: #eef4ff;
  box-shadow: inset 0 0 0 1px #c7d8ff;
}

.cms-toolbar__select {
  padding: 0 12px;
  min-width: 144px;
}

.cms-toolbar__select--size {
  min-width: 76px;
}

.cms-toolbar__save {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.cms-toolbar__status {
  font-size: 12px;
  color: #64748b;
}

.cms-toolbar__status--ok {
  color: #16a34a;
}

.cms-toolbar__status--error {
  color: #dc2626;
}

.cms-toolbar__spacer {
  flex: 1;
}

.cms-toolbar__color-preview {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  display: inline-block;
  margin-left: 8px;
}

.align-icon {
  width: 18px;
  display: grid;
  gap: 3px;
}

.align-icon span {
  height: 2px;
  border-radius: 999px;
  background: #334155;
}

.align-icon--left span:nth-child(1) {
  width: 100%;
}

.align-icon--left span:nth-child(2) {
  width: 78%;
}

.align-icon--left span:nth-child(3) {
  width: 58%;
}

.align-icon--center {
  justify-items: center;
}

.align-icon--center span:nth-child(1) {
  width: 100%;
}

.align-icon--center span:nth-child(2) {
  width: 78%;
}

.align-icon--center span:nth-child(3) {
  width: 58%;
}

.align-icon--right {
  justify-items: end;
}

.align-icon--right span:nth-child(1) {
  width: 100%;
}

.align-icon--right span:nth-child(2) {
  width: 78%;
}

.align-icon--right span:nth-child(3) {
  width: 58%;
}
</style>
