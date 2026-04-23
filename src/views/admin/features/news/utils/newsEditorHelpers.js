import { onBeforeUnmount, ref } from 'vue'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'

import { FontFamily, FontSize, TextHighlight } from '@/views/admin/features/news/utils/textStyleExtensions.js'

export function createBlockEditorExtensions() {
  return [
    StarterKit.configure({
      history: false,
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    TextStyle,
    Color,
    FontFamily,
    FontSize,
    TextHighlight,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
  ]
}

export function useSidebarResize(options = {}) {
  const minWidth = options.minWidth ?? 280
  const maxWidth = options.maxWidth ?? 500
  const width = ref(options.initialWidth ?? 360)
  const isResizing = ref(false)

  let startX = 0
  let startWidth = width.value

  function onMouseMove(event) {
    if (!isResizing.value) return
    const delta = startX - event.clientX
    width.value = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
  }

  function stopResize() {
    isResizing.value = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', stopResize)
  }

  function startResize(event) {
    startX = event.clientX
    startWidth = width.value
    isResizing.value = true
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopResize)
  }

  onBeforeUnmount(() => {
    stopResize()
  })

  return {
    width,
    isResizing,
    startResize,
  }
}
