<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Extension } from '@tiptap/core'

const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {}
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  editable: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: 'Bắt đầu soạn nội dung bài viết ở đây...',
  },
})

const emit = defineEmits(['update:modelValue', 'editor-state'])

const editor = useEditor({
  content: props.modelValue || '',
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    TextStyle,
    Color,
    FontSize,
    Link.configure({
      openOnClick: false,
      autolink: true,
      protocols: ['http', 'https', 'mailto', 'tel'],
    }),
    Image.configure({
      inline: false,
      allowBase64: true,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
      defaultAlignment: 'left',
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', currentEditor.getHTML())
    emitEditorState()
  },
  onSelectionUpdate: () => {
    emitEditorState()
  },
  onCreate: () => {
    emitEditorState()
  },
})

const editorState = computed(() => {
  const instance = editor.value

  if (!instance) {
    return {
      isReady: false,
      canUndo: false,
      canRedo: false,
      active: {},
      currentHeading: 'paragraph',
      currentAlign: 'left',
      currentColor: '#2a3439',
      currentFontSize: '16px',
    }
  }

  const active = {
    bold: instance.isActive('bold'),
    italic: instance.isActive('italic'),
    underline: instance.isActive('underline'),
    bulletList: instance.isActive('bulletList'),
    orderedList: instance.isActive('orderedList'),
    blockquote: instance.isActive('blockquote'),
    link: instance.isActive('link'),
    table: instance.isActive('table'),
  }

  const currentHeading = [1, 2, 3].find((level) => instance.isActive('heading', { level }))
  const currentAlign = ['left', 'center', 'right', 'justify'].find((align) => instance.isActive({ textAlign: align }))
  const textStyle = instance.getAttributes('textStyle')

  return {
    isReady: true,
    canUndo: instance.can().chain().focus().undo().run(),
    canRedo: instance.can().chain().focus().redo().run(),
    active,
    currentHeading: currentHeading ? `h${currentHeading}` : 'paragraph',
    currentAlign: currentAlign || 'left',
    currentColor: textStyle.color || '#2a3439',
    currentFontSize: textStyle.fontSize || '16px',
  }
})

function emitEditorState() {
  emit('editor-state', editorState.value)
}

watch(
  () => props.modelValue,
  (value) => {
    const instance = editor.value
    if (!instance) return

    const nextValue = value || ''
    if (nextValue === instance.getHTML()) return

    const { from, to } = instance.state.selection
    instance.commands.setContent(nextValue, false)
    instance.commands.setTextSelection({ from, to })
    emitEditorState()
  }
)

watch(
  () => props.editable,
  (value) => {
    editor.value?.setEditable(value)
    emitEditorState()
  }
)

function focusEditor() {
  editor.value?.chain().focus().run()
}

function runCommand(payload) {
  const instance = editor.value
  if (!instance || !payload?.command) return

  const chain = instance.chain().focus()
  const { command, value } = payload

  switch (command) {
    case 'bold':
      chain.toggleBold().run()
      break
    case 'italic':
      chain.toggleItalic().run()
      break
    case 'underline':
      chain.toggleUnderline().run()
      break
    case 'align-left':
      chain.setTextAlign('left').run()
      break
    case 'align-center':
      chain.setTextAlign('center').run()
      break
    case 'align-right':
      chain.setTextAlign('right').run()
      break
    case 'align-justify':
      chain.setTextAlign('justify').run()
      break
    case 'bullet-list':
      chain.toggleBulletList().run()
      break
    case 'ordered-list':
      chain.toggleOrderedList().run()
      break
    case 'blockquote':
      chain.toggleBlockquote().run()
      break
    case 'undo':
      chain.undo().run()
      break
    case 'redo':
      chain.redo().run()
      break
    case 'paragraph':
      chain.setParagraph().run()
      break
    case 'heading-1':
      chain.toggleHeading({ level: 1 }).run()
      break
    case 'heading-2':
      chain.toggleHeading({ level: 2 }).run()
      break
    case 'heading-3':
      chain.toggleHeading({ level: 3 }).run()
      break
    case 'font-size':
      if (value) {
        chain.setFontSize(value).run()
      }
      break
    case 'text-color':
      if (value) {
        chain.setColor(value).run()
      }
      break
    default:
      break
  }

  emitEditorState()
}

function setLink(url) {
  const instance = editor.value
  if (!instance) return

  const chain = instance.chain().focus().extendMarkRange('link')
  if (!url) {
    chain.unsetLink().run()
  } else {
    chain.setLink({ href: url, target: '_blank', rel: 'noopener noreferrer nofollow' }).run()
  }

  emitEditorState()
}

function insertImage(url) {
  if (!url) return
  editor.value?.chain().focus().setImage({ src: url, alt: 'Embedded image' }).run()
  emitEditorState()
}

function insertTable(options = {}) {
  editor.value
    ?.chain()
    .focus()
    .insertTable({ rows: options.rows || 3, cols: options.cols || 3, withHeaderRow: true })
    .run()
  emitEditorState()
}

defineExpose({
  focusEditor,
  runCommand,
  setLink,
  insertImage,
  insertTable,
  editor,
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="tiptap-surface" :class="{ 'tiptap-surface--readonly': !editable }">
    <EditorContent :editor="editor" class="tiptap-content" />
    <p v-if="editable && !(modelValue || '').trim()" class="tiptap-placeholder">{{ placeholder }}</p>
  </div>
</template>

<style scoped>
.tiptap-surface {
  position: relative;
  min-height: 720px;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
  box-shadow:
    inset 0 0 0 1px rgba(169, 180, 185, 0.18),
    0 20px 45px rgba(42, 52, 57, 0.04);
}

.tiptap-placeholder {
  position: absolute;
  top: 28px;
  left: 28px;
  margin: 0;
  color: #97a1a8;
  pointer-events: none;
}

.tiptap-content :deep(.ProseMirror) {
  min-height: 720px;
  padding: 28px;
  color: #2a3439;
  line-height: 1.9;
  outline: none;
}

.tiptap-content :deep(.ProseMirror > *:first-child) {
  margin-top: 0;
}

.tiptap-content :deep(h1),
.tiptap-content :deep(h2),
.tiptap-content :deep(h3) {
  margin: 28px 0 12px;
  color: #2a3439;
  line-height: 1.16;
  letter-spacing: -0.03em;
}

.tiptap-content :deep(h1) {
  font-size: clamp(2rem, 3vw, 2.75rem);
}

.tiptap-content :deep(h2) {
  font-size: clamp(1.6rem, 2.4vw, 2.1rem);
}

.tiptap-content :deep(h3) {
  font-size: clamp(1.3rem, 2vw, 1.6rem);
}

.tiptap-content :deep(p) {
  margin: 0 0 1rem;
}

.tiptap-content :deep(blockquote) {
  margin: 20px 0;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f0f4f7;
  color: #566166;
  border-left: 4px solid #c3d4ff;
}

.tiptap-content :deep(ul),
.tiptap-content :deep(ol) {
  padding-left: 1.4rem;
}

.tiptap-content :deep(a) {
  color: #005ac2;
  text-decoration: underline;
}

.tiptap-content :deep(img) {
  display: block;
  max-width: 100%;
  margin: 22px auto;
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(42, 52, 57, 0.1);
}

.tiptap-content :deep(table) {
  width: 100%;
  margin: 22px 0;
  border-collapse: collapse;
  overflow: hidden;
  border-radius: 16px;
}

.tiptap-content :deep(th),
.tiptap-content :deep(td) {
  border: 1px solid rgba(169, 180, 185, 0.24);
  padding: 12px 14px;
  vertical-align: top;
}

.tiptap-content :deep(th) {
  background: #f0f4f7;
  font-weight: 800;
}

.tiptap-content :deep(.selectedCell::after) {
  background: rgba(0, 90, 194, 0.08);
}

@media (max-width: 768px) {
  .tiptap-surface,
  .tiptap-content :deep(.ProseMirror) {
    min-height: 520px;
  }

  .tiptap-content :deep(.ProseMirror) {
    padding: 18px;
  }

  .tiptap-placeholder {
    top: 18px;
    left: 18px;
  }
}
</style>
