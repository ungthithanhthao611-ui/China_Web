<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  documentServerUrl: {
    type: String,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['ready', 'error'])

const containerId = `onlyoffice-editor-${Math.random().toString(36).slice(2)}`
const editorInstance = ref(null)

function loadOnlyOfficeScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      if (window.DocsAPI?.DocEditor) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load ONLYOFFICE API script.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load ONLYOFFICE API script.'))
    document.head.appendChild(script)
  })
}

async function mountEditor() {
  try {
    const scriptUrl = `${String(props.documentServerUrl || '').replace(/\/+$/, '')}/web-apps/apps/api/documents/api.js`
    await loadOnlyOfficeScript(scriptUrl)
    if (!window.DocsAPI?.DocEditor) {
      throw new Error('ONLYOFFICE Docs API is unavailable after script load.')
    }
    editorInstance.value = new window.DocsAPI.DocEditor(containerId, props.config)
    emit('ready')
  } catch (error) {
    emit('error', error)
  }
}

onMounted(mountEditor)

onBeforeUnmount(() => {
  if (editorInstance.value?.destroyEditor) {
    editorInstance.value.destroyEditor()
  }
})
</script>

<template>
  <div :id="containerId" class="onlyoffice-editor-shell"></div>
</template>

<style scoped>
.onlyoffice-editor-shell {
  width: 100%;
  min-height: calc(100vh - 220px);
  border-radius: 28px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(169, 180, 185, 0.16);
}

@media (max-width: 900px) {
  .onlyoffice-editor-shell {
    min-height: calc(100vh - 180px);
    border-radius: 20px;
  }
}
</style>
