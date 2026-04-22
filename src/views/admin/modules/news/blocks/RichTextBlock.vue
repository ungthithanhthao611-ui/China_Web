<template>
  <div class="rich-text-block" :class="{ 'rich-text-block--active': selected }" @mousedown.stop>
    <EditorContent :editor="editor" class="rich-text-block__content" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { createBlockEditorExtensions } from '../editor/newsEditorHelpers'

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  syncKey: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update'])

function measureContentHeight(instance) {
  const dom = instance?.view?.dom
  if (!dom) return 0
  return Math.ceil(dom.scrollHeight)
}

function emitEditorPayload(instance) {
  if (!instance) return
  emit('update', {
    html: instance.getHTML(),
    contentHeight: measureContentHeight(instance),
  })
}

const editor = new Editor({
  extensions: createBlockEditorExtensions(),
  content: props.block.content || '<p></p>',
  editorProps: {
    attributes: {
      class: 'prose prose-news-editor',
    },
  },
  onUpdate: ({ editor: instance }) => {
    emitEditorPayload(instance)
  },
})

const content = computed(() => props.block.content || '<p></p>')

watch(content, (value) => {
  if (value !== editor.getHTML()) {
    editor.commands.setContent(value, false)
    nextTick(() => {
      emitEditorPayload(editor)
    })
  }
})

watch(
  () => props.selected,
  (value) => {
    if (value) {
      editor.commands.focus()
    }
  },
)

watch(
  () => props.syncKey,
  () => {
    if (content.value !== editor.getHTML()) {
      editor.commands.setContent(content.value, false)
    }
    nextTick(() => {
      emitEditorPayload(editor)
    })
  },
)

onMounted(() => {
  nextTick(() => {
    emitEditorPayload(editor)
  })
})

onBeforeUnmount(() => {
  editor.destroy()
})

defineExpose({
  editor,
})
</script>

<style scoped>
.rich-text-block {
  width: 100%;
  min-height: 100%;
}

.rich-text-block__content {
  width: 100%;
  min-height: 100%;
}

:deep(.ProseMirror) {
  width: 100%;
  height: auto;
  min-height: 90px;
  padding: 12px 14px;
  outline: none;
  color: #0f172a;
  overflow: hidden;
  box-sizing: border-box;
  word-break: break-word;
}

:deep(.ProseMirror p) {
  margin: 0 0 0.8em;
}

:deep(.ProseMirror h1),
:deep(.ProseMirror h2),
:deep(.ProseMirror h3) {
  margin: 0 0 0.65em;
  line-height: 1.2;
  color: #0f172a;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.4em;
}
</style>
