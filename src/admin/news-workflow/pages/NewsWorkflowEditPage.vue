<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ImportSourceDialog from '@/admin/news-workflow/components/ImportSourceDialog.vue'
import NewsConfirmDialog from '@/admin/news-workflow/components/NewsConfirmDialog.vue'
import NewsEditorCanvas from '@/admin/news-workflow/components/NewsEditorCanvas.vue'
import NewsEditorSidebar from '@/admin/news-workflow/components/NewsEditorSidebar.vue'
import NewsEditorToolbar from '@/admin/news-workflow/components/NewsEditorToolbar.vue'
import NewsToast from '@/admin/news-workflow/components/NewsToast.vue'
import {
  applyImportSourceJob,
  createAdminNews,
  getAdminNews,
  getImportSourceJob,
  importSource,
  publishAdminNews,
  updateAdminNews,
} from '@/admin/news-workflow/services/newsWorkflowApi'
import { useNewsWorkflowEditorStore } from '@/admin/news-workflow/stores/newsWorkflowEditor'
import { slugFromTitle } from '@/admin/news-workflow/utils/blockFactory'
import { consumeImportedDraft } from '@/admin/news-workflow/utils/importedDraft'

const router = useRouter()
const route = useRoute()
const store = useNewsWorkflowEditorStore()

const loading = ref(true)
const loadingMessage = ref('Loading editor...')
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const errorMessage = ref('')
const importDialogOpen = ref(false)
const importDialogLoading = ref(false)

/* ── Toast state ── */
const toast = reactive({
  visible: false,
  type: 'success' as 'success' | 'error' | 'warning',
  message: '',
})

function showToast(type: 'success' | 'error' | 'warning', message: string) {
  toast.type = type
  toast.message = message
  toast.visible = true
}

function closeToast() {
  toast.visible = false
}

/* ── Confirm dialog state (for publish) ── */
const confirmDialog = reactive({
  open: false,
  title: '',
  message: '',
  confirmText: '',
  tone: 'primary' as 'danger' | 'warning' | 'primary',
  loading: false,
})

const postId = computed(() => {
  const raw = Number(route.params.id)
  return Number.isFinite(raw) && raw > 0 ? raw : null
})

let autoSaveTimer: number | null = null

function buildPayload() {
  if (!store.post.slug) {
    store.setPostField('slug', slugFromTitle(store.post.title))
  }
  return {
    title: store.post.title,
    slug: store.post.slug,
    summary: store.post.summary,
    thumbnail_url: store.post.thumbnail_url,
    content_json: store.exportContentJson(),
    content_html: store.exportHtml(),
    source_url: store.post.source_url || undefined,
    source_note: store.post.source_note || undefined,
    status: store.post.status,
    category_ids: store.post.category_ids,
  }
}

async function loadExistingPost(id: number) {
  loading.value = true
  errorMessage.value = ''
  try {
    const payload = await getAdminNews(id)
    store.resetEditor({
      ...payload,
      content_json: payload.content_json || { page: { width: 900, background: '#ffffff' }, blocks: [] },
      category_ids: payload.category_ids || [],
    })
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to load news post.'
    showToast('error', errorMessage.value)
  } finally {
    loading.value = false
  }
}

async function loadCreateMode(options: { importJobId?: string | null; crawlUrl?: string | null }) {
  const importedDraft = consumeImportedDraft()
  store.resetEditor(importedDraft || undefined)
  if (importedDraft) {
    loadingMessage.value = 'Loading editor...'
    loading.value = false
    return
  }

  const rawCrawlUrl = String(options.crawlUrl || '').trim()
  const crawlUrl = rawCrawlUrl && !/^https?:\/\//i.test(rawCrawlUrl) ? `https://${rawCrawlUrl}` : rawCrawlUrl
  if (crawlUrl) {
    loadingMessage.value = 'Crawling article data from URL...'
    try {
      const crawled = await importSource({ source_url: crawlUrl })
      if (crawled?.parsed_json) {
        store.loadContentJson(crawled.parsed_json)
      }
      if (crawled?.raw_title) {
        store.setPostField('title', crawled.raw_title)
        store.setPostField('slug', slugFromTitle(crawled.raw_title))
      }
      if (crawled?.source_url) {
        store.setPostField('source_url', crawled.source_url)
      }
      const plainText = String(crawled?.raw_text || '').trim()
      if (plainText) {
        store.setPostField('summary', plainText.slice(0, 240))
      }
      showToast('success', 'Crawl bài viết thành công!')
    } catch (error: any) {
      errorMessage.value = error?.message || 'Failed to crawl article from URL.'
      showToast('error', errorMessage.value)
    } finally {
      loadingMessage.value = 'Loading editor...'
      loading.value = false
    }
    return
  }

  const importJobId = String(options.importJobId || '').trim()
  if (importJobId) {
    try {
      const job = await getImportSourceJob(importJobId)
      if (job?.parsed_json) {
        store.loadContentJson(job.parsed_json)
        if (job.raw_title) {
          store.setPostField('title', job.raw_title)
          store.setPostField('slug', slugFromTitle(job.raw_title))
        }
        store.setPostField('source_url', job.source_url || '')
      }
    } catch (error: any) {
      errorMessage.value = error?.message || 'Failed to apply imported source draft.'
      showToast('error', errorMessage.value)
    }
  }

  loadingMessage.value = 'Loading editor...'
  loading.value = false
}

async function saveDraft() {
  saveStatus.value = 'saving'
  errorMessage.value = ''
  try {
    const payload = buildPayload()
    let saved: any
    if (postId.value) {
      saved = await updateAdminNews(postId.value, payload)
    } else {
      saved = await createAdminNews(payload)
      await router.replace({
        name: 'AdminNewsWorkflowEdit',
        params: { id: String(saved.id) },
      })
    }
    store.resetEditor({
      ...saved,
      content_json: saved.content_json || payload.content_json,
      category_ids: saved.category_ids || [],
    })
    saveStatus.value = 'saved'
    showToast('success', postId.value ? 'Đã lưu bài viết thành công!' : 'Tạo bài viết mới thành công!')
    window.setTimeout(() => {
      if (saveStatus.value === 'saved') saveStatus.value = 'idle'
    }, 1400)
  } catch (error: any) {
    saveStatus.value = 'error'
    errorMessage.value = error?.message || 'Failed to save draft.'
    showToast('error', errorMessage.value)
  }
}

function requestPublish() {
  confirmDialog.title = 'Xuất bản bài viết'
  confirmDialog.message = 'Bạn có chắc muốn xuất bản bài viết này? Bài viết sẽ hiển thị công khai sau khi xuất bản.'
  confirmDialog.confirmText = 'Xuất bản'
  confirmDialog.tone = 'primary'
  confirmDialog.loading = false
  confirmDialog.open = true
}

function cancelPublish() {
  confirmDialog.open = false
}

async function confirmPublish() {
  confirmDialog.loading = true
  try {
    await saveDraft()
    const id = Number(route.params.id)
    if (!id) {
      confirmDialog.open = false
      return
    }
    const published = await publishAdminNews(id)
    store.setStatus('published')
    store.setPostField('published_at', published.published_at || null)
    confirmDialog.open = false
    showToast('success', 'Xuất bản bài viết thành công!')
  } catch (error: any) {
    confirmDialog.open = false
    errorMessage.value = error?.message || 'Failed to publish post.'
    showToast('error', errorMessage.value)
  } finally {
    confirmDialog.loading = false
  }
}

async function openPreview() {
  if (!postId.value) {
    await saveDraft()
  }
  const id = Number(route.params.id)
  if (!id) return
  router.push({ name: 'AdminNewsWorkflowPreview', params: { id: String(id) } })
}

async function handleImportSource(payload: { source_url: string; source_note?: string }) {
  importDialogLoading.value = true
  try {
    const imported = await importSource(payload)
    const applied = await applyImportSourceJob(imported.id, {
      post_id: postId.value || undefined,
      source_note: payload.source_note,
    })
    if (applied.content_json) {
      store.loadContentJson(applied.content_json)
    }
    if (applied.source_url) {
      store.setPostField('source_url', applied.source_url)
    }
    if (applied.source_note) {
      store.setPostField('source_note', applied.source_note)
    }
    importDialogOpen.value = false
    showToast('success', 'Import nguồn bài viết thành công!')
  } catch (error: any) {
    errorMessage.value = error?.message || 'Import source failed.'
    showToast('error', errorMessage.value)
  } finally {
    importDialogLoading.value = false
  }
}

watch(
  () => [store.post, store.blocks, store.page, postId.value],
  () => {
    if (!postId.value || !store.isDirty) return
    if (autoSaveTimer) {
      window.clearTimeout(autoSaveTimer)
    }
    autoSaveTimer = window.setTimeout(() => {
      saveDraft()
    }, 1800)
  },
  { deep: true }
)

onMounted(async () => {
  const importJobId = String(route.query.importJobId || '').trim()
  const crawlUrl = String(route.query.crawl || '').trim()
  if (postId.value) {
    await loadExistingPost(postId.value)
    return
  }
  await loadCreateMode({
    importJobId: importJobId || null,
    crawlUrl: crawlUrl || null,
  })
})

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }
})
</script>

<template>
  <section class="edit-page">
    <NewsEditorToolbar
      :save-status="saveStatus"
      @save="saveDraft"
      @publish="requestPublish"
      @preview="openPreview"
      @import-source="importDialogOpen = true"
    />

    <p v-if="errorMessage" class="alert-error">{{ errorMessage }}</p>

    <div v-if="loading" class="loading-state">{{ loadingMessage }}</div>
    <div v-else class="editor-layout">
      <NewsEditorCanvas />
      <NewsEditorSidebar />
    </div>

    <ImportSourceDialog
      :open="importDialogOpen"
      :loading="importDialogLoading"
      @close="importDialogOpen = false"
      @submit="handleImportSource"
    />

    <NewsConfirmDialog
      :open="confirmDialog.open"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :tone="confirmDialog.tone"
      :loading="confirmDialog.loading"
      @confirm="confirmPublish"
      @cancel="cancelPublish"
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
.edit-page {
  min-height: 100vh;
  background: #f4f7fb;
}

.editor-layout {
  display: flex;
  min-height: calc(100vh - 56px);
  align-items: flex-start;
}

.loading-state {
  min-height: calc(100vh - 56px);
  display: grid;
  place-items: center;
  color: #64748b;
}

.alert-error {
  margin: 12px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 13px;
}
</style>

