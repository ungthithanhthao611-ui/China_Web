<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import OnlyOfficeEditor from '@/admin/components/onlyoffice/OnlyOfficeEditor.vue'
import { ADMIN_TOKEN_STORAGE_KEY } from '@/admin/constants/auth'
import { getAdminEntityRecord } from '@/admin/services/adminApi'
import { convertPostDocumentToHtml, getOnlyOfficeConfig, getPostDocument, uploadPostDocument } from '@/admin/services/onlyofficeApi'

const route = useRoute()
const router = useRouter()

const token = ref(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '')
const post = ref(null)
const documentMeta = ref(null)
const editorPayload = ref(null)
const previewHtml = ref('')
const loading = ref(true)
const refreshing = ref(false)
const converting = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const editorInstanceKey = ref(0)

const postId = computed(() => {
  const value = Number(route.params.id)
  return Number.isFinite(value) && value > 0 ? value : null
})

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function setError(message) {
  errorMessage.value = message
  successMessage.value = ''
}

function setSuccess(message) {
  successMessage.value = message
  errorMessage.value = ''
}

async function loadEditorData({ silent = false } = {}) {
  if (!postId.value) {
    setError('Invalid post id.')
    return
  }

  if (!silent) {
    loading.value = true
  } else {
    refreshing.value = true
  }
  clearMessages()

  try {
    const [postResponse, documentResponse, configResponse] = await Promise.all([
      getAdminEntityRecord('posts', postId.value, token.value),
      getPostDocument(postId.value, token.value),
      getOnlyOfficeConfig(postId.value, token.value),
    ])

    post.value = postResponse
    documentMeta.value = documentResponse
    editorPayload.value = configResponse
    previewHtml.value = String(postResponse.content_html || postResponse.body || '')
    editorInstanceKey.value += 1
  } catch (error) {
    setError(error?.message || 'Failed to load ONLYOFFICE editor.')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function handleBack() {
  router.push({
    name: 'AdminDashboard',
    query: {
      section: 'posts',
      postView: 'editor',
      postId: postId.value,
      mode: 'manual',
    },
  })
}

async function handleConvertHtml() {
  if (!postId.value) return
  converting.value = true
  clearMessages()
  try {
    const response = await convertPostDocumentToHtml(postId.value, token.value)
    previewHtml.value = response.content_html || ''
    setSuccess('DOCX converted to HTML.')
  } catch (error) {
    setError(error?.message || 'Failed to convert DOCX to HTML.')
  } finally {
    converting.value = false
  }
}

async function handleUploadChange(event) {
  const file = event?.target?.files?.[0]
  if (!file || !postId.value) return

  uploading.value = true
  clearMessages()
  try {
    documentMeta.value = await uploadPostDocument(postId.value, token.value, file)
    setSuccess('Word document uploaded.')
    await loadEditorData({ silent: true })
  } catch (error) {
    setError(error?.message || 'Failed to upload DOCX document.')
  } finally {
    uploading.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

onMounted(() => {
  loadEditorData()
})
</script>

<template>
  <section class="word-editor-page">
    <header class="word-editor-page__header">
      <div class="word-editor-page__copy">
        <p class="eyebrow">OnlyOffice Docs</p>
        <h1>{{ post?.title || 'Word editor' }}</h1>
        <p class="word-editor-page__meta">
          <span>Post #{{ postId }}</span>
          <span v-if="documentMeta">Version {{ documentMeta.version }}</span>
          <span v-if="documentMeta?.file_name">{{ documentMeta.file_name }}</span>
        </p>
      </div>

      <div class="word-editor-page__actions">
        <button type="button" class="btn btn-secondary" :disabled="refreshing" @click="loadEditorData({ silent: true })">
          {{ refreshing ? 'Refreshing...' : 'Refresh editor' }}
        </button>
        <button type="button" class="btn btn-secondary" :disabled="converting" @click="handleConvertHtml">
          {{ converting ? 'Converting...' : 'Convert to HTML' }}
        </button>
        <label class="btn btn-secondary word-editor-page__upload" :class="{ 'is-disabled': uploading }">
          <input ref="fileInput" type="file" accept=".docx" :disabled="uploading" @change="handleUploadChange" />
          {{ uploading ? 'Uploading...' : 'Replace DOCX' }}
        </label>
        <button type="button" class="btn btn-primary" @click="handleBack">Back to post</button>
      </div>
    </header>

    <p v-if="errorMessage" class="word-editor-page__alert word-editor-page__alert--error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="word-editor-page__alert word-editor-page__alert--success">{{ successMessage }}</p>

    <section class="word-editor-page__layout">
      <div class="word-editor-page__editor-card">
        <div v-if="loading" class="word-editor-page__loading">Loading ONLYOFFICE editor...</div>
        <OnlyOfficeEditor
          v-else-if="editorPayload?.config"
          :key="editorInstanceKey"
          :document-server-url="editorPayload.document_server_url"
          :config="editorPayload.config"
          @error="setError($event?.message || 'ONLYOFFICE editor failed to load.')"
        />
      </div>

      <aside class="word-editor-page__sidebar">
        <section class="word-editor-page__panel">
          <p class="eyebrow">Document</p>
          <dl v-if="documentMeta" class="word-editor-page__facts">
            <div>
              <dt>Version</dt>
              <dd>{{ documentMeta.version }}</dd>
            </div>
            <div>
              <dt>Key</dt>
              <dd>{{ documentMeta.document_key }}</dd>
            </div>
            <div>
              <dt>Last synced</dt>
              <dd>{{ documentMeta.last_synced_at || 'Not synced yet' }}</dd>
            </div>
          </dl>
        </section>

        <section class="word-editor-page__panel">
          <p class="eyebrow">HTML preview</p>
          <div v-if="previewHtml" class="word-editor-page__preview" v-html="previewHtml"></div>
          <p v-else class="word-editor-page__empty">No generated HTML yet. Convert the DOCX first.</p>
        </section>
      </aside>
    </section>
  </section>
</template>

<style scoped>
.word-editor-page {
  min-height: 100vh;
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(216, 226, 255, 0.78), transparent 22%),
    linear-gradient(180deg, #edf4fb 0%, #f8fbff 100%);
  color: #2a3439;
}

.word-editor-page__header,
.word-editor-page__editor-card,
.word-editor-page__panel {
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 18px 44px rgba(42, 52, 57, 0.08);
}

.word-editor-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 26px 28px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #587aa6;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.word-editor-page__header h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.02;
}

.word-editor-page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0 0;
  color: #607180;
  font-size: 14px;
}

.word-editor-page__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

.word-editor-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 360px);
  gap: 20px;
  align-items: start;
}

.word-editor-page__editor-card {
  padding: 18px;
}

.word-editor-page__sidebar {
  display: grid;
  gap: 18px;
}

.word-editor-page__panel {
  padding: 20px;
}

.word-editor-page__facts {
  display: grid;
  gap: 12px;
  margin: 0;
}

.word-editor-page__facts div {
  display: grid;
  gap: 4px;
}

.word-editor-page__facts dt {
  color: #7a8791;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.word-editor-page__facts dd {
  margin: 0;
  word-break: break-word;
}

.word-editor-page__preview {
  max-height: 420px;
  overflow: auto;
  color: #33404b;
  line-height: 1.7;
}

.word-editor-page__loading,
.word-editor-page__empty {
  padding: 28px;
  color: #607180;
}

.word-editor-page__alert {
  margin: 0 0 14px;
  padding: 14px 16px;
  border-radius: 18px;
}

.word-editor-page__alert--error {
  background: #ffe4e0;
  color: #a34740;
}

.word-editor-page__alert--success {
  background: #e3f6ea;
  color: #1e7a47;
}

.btn {
  border: none;
  border-radius: 16px;
  padding: 12px 18px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  background: #005ac2;
  color: #ffffff;
}

.btn-secondary {
  background: #eef3f8;
  color: #32414c;
}

.word-editor-page__upload {
  position: relative;
  overflow: hidden;
}

.word-editor-page__upload input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.word-editor-page__upload.is-disabled {
  opacity: 0.7;
  pointer-events: none;
}

@media (max-width: 1100px) {
  .word-editor-page__layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .word-editor-page {
    padding: 18px;
  }

  .word-editor-page__header {
    flex-direction: column;
  }

  .word-editor-page__actions {
    width: 100%;
    justify-content: stretch;
  }
}
</style>
