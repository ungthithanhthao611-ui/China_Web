<script setup>
const props = defineProps({
  previewMode: {
    type: Boolean,
    default: false,
  },
  autosaveLabel: {
    type: String,
    default: 'Autosave chưa kích hoạt',
  },
  editorState: {
    type: Object,
    default: () => ({
      isReady: false,
      canUndo: false,
      canRedo: false,
      active: {},
      currentHeading: 'paragraph',
      currentAlign: 'left',
      currentColor: '#2a3439',
      currentFontSize: '16px',
    }),
  },
})

const emit = defineEmits(['apply-command', 'insert-link', 'insert-image', 'insert-table', 'toggle-preview', 'save-draft'])

function handleCommand(command, value = null) {
  emit('apply-command', { command, value })
}

function isActive(key, expectedValue = true) {
  if (!props.editorState?.active) return false
  return props.editorState.active[key] === expectedValue
}
</script>

<template>
  <div class="post-toolbar">
    <div class="toolbar-main">
      <div class="toolbar-group">
        <button id="toolbar_bold" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('bold') }" @click="handleCommand('bold')"><strong>B</strong></button>
        <button id="toolbar_italic" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('italic') }" @click="handleCommand('italic')"><em>I</em></button>
        <button id="toolbar_underline" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('underline') }" @click="handleCommand('underline')"><u>U</u></button>
      </div>

      <div class="toolbar-group">
        <button id="toolbar_align_left" type="button" class="tool-btn" :class="{ 'tool-btn--active': props.editorState.currentAlign === 'left' }" @click="handleCommand('align-left')">☰</button>
        <button id="toolbar_align_center" type="button" class="tool-btn" :class="{ 'tool-btn--active': props.editorState.currentAlign === 'center' }" @click="handleCommand('align-center')">≣</button>
        <button id="toolbar_align_right" type="button" class="tool-btn" :class="{ 'tool-btn--active': props.editorState.currentAlign === 'right' }" @click="handleCommand('align-right')">☷</button>
        <button id="toolbar_align_justify" type="button" class="tool-btn" :class="{ 'tool-btn--active': props.editorState.currentAlign === 'justify' }" @click="handleCommand('align-justify')">☵</button>
      </div>

      <div class="toolbar-group">
        <select id="toolbar_heading" class="toolbar-select" :value="props.editorState.currentHeading" @change="handleCommand($event.target.value)">
          <option value="paragraph">Đoạn văn</option>
          <option value="heading-1">Heading 1</option>
          <option value="heading-2">Heading 2</option>
          <option value="heading-3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <select id="toolbar_font_size" class="toolbar-select" :value="props.editorState.currentFontSize" @change="handleCommand('font-size', $event.target.value)">
          <option value="14px">Nhỏ</option>
          <option value="16px">Chuẩn</option>
          <option value="18px">Lớn</option>
          <option value="20px">Rất lớn</option>
          <option value="24px">Headline</option>
        </select>
      </div>

      <div class="toolbar-group">
        <label class="color-picker">
          <span>T</span>
          <input id="toolbar_color" type="color" :value="props.editorState.currentColor" @input="handleCommand('text-color', $event.target.value)" />
        </label>
        <button id="toolbar_bullets" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('bulletList') }" @click="handleCommand('bullet-list')">•⋮</button>
        <button id="toolbar_numbers" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('orderedList') }" @click="handleCommand('ordered-list')">1⋮</button>
      </div>

      <div class="toolbar-group toolbar-group--media">
        <button id="toolbar_image" type="button" class="tool-btn" @click="$emit('insert-image')">▣</button>
        <button id="toolbar_link" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('link') }" @click="$emit('insert-link')">🔗</button>
        <button id="toolbar_table" type="button" class="tool-btn" :class="{ 'tool-btn--active': isActive('table') }" @click="$emit('insert-table')">⌗</button>
      </div>
    </div>

    <div class="toolbar-side">
      <button id="toolbar_undo" type="button" class="tool-btn" :disabled="!props.editorState.canUndo" @click="handleCommand('undo')">↺</button>
      <button id="toolbar_redo" type="button" class="tool-btn" :disabled="!props.editorState.canRedo" @click="handleCommand('redo')">↻</button>
      <button id="toolbar_preview" type="button" class="tool-link" @click="$emit('toggle-preview')">
        {{ previewMode ? 'Back to editor' : 'Preview' }}
      </button>
      <button id="toolbar_save_draft" type="button" class="tool-pill" @click="$emit('save-draft')">Save Draft</button>
    </div>
  </div>

  <div class="toolbar-foot">
    <span class="autosave-dot"></span>
    <span>{{ props.autosaveLabel }}</span>
  </div>
</template>

<style scoped>
.post-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(169, 180, 185, 0.14);
  background: linear-gradient(180deg, rgba(240, 244, 247, 0.72), rgba(240, 244, 247, 0.46));
}

.toolbar-main,
.toolbar-side,
.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-main {
  flex: 1;
}

.toolbar-group {
  padding-right: 12px;
  margin-right: 2px;
  border-right: 1px solid rgba(169, 180, 185, 0.16);
}

.toolbar-group--media {
  border-right: none;
  padding-right: 0;
}

.tool-btn,
.toolbar-select,
.color-picker {
  min-height: 38px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #566166;
  font: inherit;
}

.tool-btn,
.tool-link,
.tool-pill {
  cursor: pointer;
}

.tool-btn {
  min-width: 38px;
  padding: 8px 11px;
  font-weight: 700;
}

.tool-btn:hover,
.toolbar-select:hover,
.color-picker:hover {
  background: #e1e9ee;
  color: #2a3439;
}

.tool-btn--active {
  background: rgba(216, 226, 255, 0.9);
  color: #005ac2;
}

.tool-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar-select {
  padding: 0 12px;
}

.color-picker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-weight: 700;
}

.color-picker input {
  width: 18px;
  height: 18px;
  border: 0;
  padding: 0;
  background: transparent;
}

.tool-link {
  border: none;
  background: transparent;
  color: #005ac2;
  padding: 8px 10px;
  border-radius: 12px;
  font-weight: 700;
}

.tool-link:hover {
  background: rgba(216, 226, 255, 0.55);
}

.tool-pill {
  border: none;
  border-radius: 14px;
  padding: 10px 16px;
  background: #d3e4fe;
  color: #435368;
  font-weight: 800;
}

.toolbar-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 18px 0;
  color: #566166;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.autosave-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #005ac2;
}

@media (max-width: 900px) {
  .post-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-side {
    justify-content: flex-end;
  }
}
</style>
