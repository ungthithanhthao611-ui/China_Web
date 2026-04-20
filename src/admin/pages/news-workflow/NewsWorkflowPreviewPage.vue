<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BlockRenderer from '@/admin/modules/news-workflow/ui/BlockRenderer.vue'
import NewsConfirmDialog from '@/admin/modules/news-workflow/ui/NewsConfirmDialog.vue'
import NewsToast from '@/admin/modules/news-workflow/ui/NewsToast.vue'
import {
  getAdminNews,
  listNewsVersions,
  publishAdminNews,
  unpublishAdminNews,
} from '@/admin/api/newsWorkflowApi.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const post = ref(null)
const versions = ref([])
const device = ref('desktop')
const errorMessage = ref('')

const toast = reactive({
  visible: false,
  type: 'success',
  message: '',
})

function showToast(type, message) {
  toast.type = type
  toast.message = message
  toast.visible = true
}

function closeToast() {
  toast.visible = false
}

const confirmDialog = reactive({
  open: false,
  title: '',
  message: '',
  confirmText: '',
  tone: 'primary',
  loading: false,
  action: '',
})

const previewWidth = computed(() => {
  if (!post.value?.content_json?.page?.width) return '900px'
  if (device.value === 'mobile') return '390px'
  if (device.value === 'tablet') return '768px'
  return `${Number(post.value.content_json.page.width)}px`
})

async function loadPreview() {
  loading.value = true
  errorMessage.value = ''
  try {
    const id = Number(route.params.id)
    post.value = await getAdminNews(id)
    versions.value = await listNewsVersions(id)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load preview.'
    showToast('error', errorMessage.value)
  } finally {
    loading.value = false
  }
}

function requestPublish() {
  confirmDialog.title = 'Xuất bản bài viết'
  confirmDialog.message = 'Bạn có chắc muốn xuất bản bài viết này? Bài viết sẽ hiển thị công khai.'
  confirmDialog.confirmText = 'Xuất bản'
  confirmDialog.tone = 'primary'
  confirmDialog.action = 'publish'
  confirmDialog.loading = false
  confirmDialog.open = true
}

function requestUnpublish() {
  confirmDialog.title = 'Chuyển về bản nháp'
  confirmDialog.message = 'Bạn có chắc muốn gỡ xuất bản bài viết này? Bài viết sẽ không còn hiển thị công khai.'
  confirmDialog.confirmText = 'Chuyển về nháp'
  confirmDialog.tone = 'warning'
  confirmDialog.action = 'unpublish'
  confirmDialog.loading = false
  confirmDialog.open = true
}

function cancelConfirm() {
  confirmDialog.open = false
  confirmDialog.action = ''
}

async function handleConfirm() {
  confirmDialog.loading = true
  try {
    if (confirmDialog.action === 'publish') {
      if (!post.value?.id) return
      await publishAdminNews(post.value.id)
      confirmDialog.open = false
      showToast('success', 'Xuất bản bài viết thành công!')
      await loadPreview()
    } else if (confirmDialog.action === 'unpublish') {
      if (!post.value?.id) return
      await unpublishAdminNews(post.value.id)
      confirmDialog.open = false
      showToast('success', 'Đã chuyển bài viết về bản nháp!')
      await loadPreview()
    }
  } catch (error) {
    confirmDialog.open = false
    const msg = error?.message || 'Thao tác thất bại.'
    errorMessage.value = msg
    showToast('error', msg)
  } finally {
    confirmDialog.loading = false
  }
}

function openEdit() {
  router.push({ name: 'AdminNewsWorkflowEdit', params: { id: String(post.value.id) } })
}

function goList() {
  router.push({ name: 'AdminDashboard', query: { section: 'posts' } })
}

onMounted(loadPreview)
</script>

<template>
  <section class="preview-page">
    <header class="preview-header">
      <div class="header-left">
        <button type="button" class="btn-secondary" @click="goList">Back to list</button>
        <button type="button" class="btn-secondary" @click="openEdit" v-if="post?.id">Edit</button>
      </div>
      <div class="header-right" v-if="post?.id">
        <button type="button" class="btn-secondary" @click="device = 'desktop'">Desktop</button>
        <button type="button" class="btn-secondary" @click="device = 'tablet'">Tablet</button>
        <button type="button" class="btn-secondary" @click="device = 'mobile'">Mobile</button>
        <button v-if="post.status !== 'published'" type="button" class="btn-primary" @click="requestPublish">Publish</button>
        <button v-else type="button" class="btn-warning" @click="requestUnpublish">Move to Draft</button>
      </div>
    </header>

    <p v-if="errorMessage" class="alert-error">{{ errorMessage }}</p>

    <div v-if="loading" class="loading-state">Loading preview...</div>

    <div v-else-if="post" class="preview-body">
      <main class="preview-main">
        <section class="article-meta">
          <h1>{{ post.title }}</h1>
          <p>{{ post.summary }}</p>
          <div class="meta-line">
            <span>{{ post.slug }}</span>
            <span class="status-chip" :class="`status-${post.status}`">{{ post.status }}</span>
          </div>
        </section>

        <section class="preview-canvas" :style="{ width: previewWidth }">
          <template v-for="block in post.content_json?.blocks || []" :key="block.id">
            <BlockRenderer :block="block" />
          </template>
        </section>
      </main>

      <aside class="preview-sidebar">
        <h3>Version history</h3>
        <p v-if="!versions.length" class="empty">No version snapshot yet.</p>
        <ul v-else class="version-list">
          <li v-for="item in versions" :key="item.id">
            <strong>v{{ item.version_no }}</strong>
            <span>{{ new Date(item.created_at).toLocaleString() }}</span>
          </li>
        </ul>
      </aside>
    </div>

    <NewsConfirmDialog
      :open="confirmDialog.open"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :tone="confirmDialog.tone"
      :loading="confirmDialog.loading"
      @confirm="handleConfirm"
      @cancel="cancelConfirm"
    />

    <NewsToast
      :visible="toast.visible"
      :type="toast.type"
      :message="toast.message"
      @close="closeToast"
    />
  </section>
</template>

<style scoped>
.preview-page {
  min-height: 100vh;
  background: #f4f7fb;
  padding: 16px;
}

.preview-header {
  background: #fff;
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-body {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 12px;
}

.preview-main {
  background: #fff;
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 16px;
}

.article-meta h1 {
  margin: 0;
  font-size: 36px;
  color: #0f172a;
}

.article-meta p {
  margin: 10px 0 0;
  color: #475569;
}

.meta-line {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
}

.preview-canvas {
  margin-top: 20px;
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  background: #fff;
  display: grid;
  gap: 14px;
}

.preview-sidebar {
  background: #fff;
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 12px;
}

.preview-sidebar h3 {
  margin: 0 0 10px;
  font-size: 14px;
}

.version-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.version-list li {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  display: grid;
  gap: 4px;
}

.version-list strong {
  color: #1e293b;
}

.version-list span,
.empty {
  color: #64748b;
  font-size: 12px;
}

.btn-primary,
.btn-secondary,
.btn-warning {
  border-radius: 6px;
  border: 1px solid #d6dfea;
  background: #fff;
  color: #1f2937;
  padding: 8px 11px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  color: #fff;
  border-color: #0b76d1;
  background: #0b76d1;
}

.btn-warning {
  color: #92400e;
  border-color: #fcd34d;
  background: #fef3c7;
}

.loading-state {
  margin-top: 16px;
  background: #fff;
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  min-height: 240px;
  display: grid;
  place-items: center;
  color: #64748b;
}

.status-chip {
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
}

.status-draft {
  color: #92400e;
  background: #fef3c7;
}

.status-published {
  color: #166534;
  background: #dcfce7;
}

.alert-error {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .preview-body {
    grid-template-columns: 1fr;
  }
}
</style>
