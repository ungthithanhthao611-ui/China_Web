
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import NewsConfirmDialog from '@/admin/news-workflow/components/NewsConfirmDialog.vue'
import NewsToast from '@/admin/news-workflow/components/NewsToast.vue'
import { deleteAdminNews, importWorkflowFile, listAdminNews, listNewsCategories } from '@/admin/news-workflow/services/newsWorkflowApi'
import type { NewsCategoryOption } from '@/admin/news-workflow/types/newsWorkflow'
import { persistImportedDraft } from '@/admin/news-workflow/utils/importedDraft'
import { consumeNewsWorkflowFlash } from '@/admin/news-workflow/utils/newsWorkflowFlash'

const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const router = useRouter()
const state = reactive({ loading: false, importingFile: false, page: 1, limit: 10, total: 0 })
const items = ref<any[]>([])
const categoryOptions = ref<NewsCategoryOption[]>([])
const errorMessage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const showCrawlModal = ref(false)
const crawlUrl = ref('')
const filters = reactive({
  keyword: '',
  status: '',
  category_id: '',
})

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

/* ── Confirm dialog state ── */
const confirmDialog = reactive({
  open: false,
  title: '',
  message: '',
  confirmText: '',
  tone: 'danger' as 'danger' | 'warning' | 'primary',
  loading: false,
})
const pendingDeleteId = ref<number | null>(null)

const pageClassName = computed(() => ({
  'page-shell': true,
  'page-shell--embedded': props.embedded,
}))

async function fetchNews() {
  state.loading = true
  errorMessage.value = ''
  try {
    const payload = await listAdminNews({
      page: state.page,
      limit: state.limit,
      keyword: filters.keyword.trim() || undefined,
      status: filters.status || undefined,
      category_id: filters.category_id || undefined,
    })
    items.value = payload.items || []
    state.total = payload.pagination?.total || 0
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to load news list.'
    showToast('error', errorMessage.value)
  } finally {
    state.loading = false
  }
}

function openCreatePage() {
  router.push({ name: 'AdminNewsWorkflowCreate' })
}

function applyFilters() {
  state.page = 1
  fetchNews()
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.category_id = ''
  state.page = 1
  fetchNews()
}

function openEditPage(id: number) {
  router.push({ name: 'AdminNewsWorkflowEdit', params: { id } })
}

function openPreviewPage(id: number) {
  router.push({ name: 'AdminNewsWorkflowPreview', params: { id } })
}

function requestDelete(id: number) {
  const record = items.value.find((item) => item.id === id)
  const label = record?.title || `#${id}`
  pendingDeleteId.value = id
  confirmDialog.title = 'Xoá bài viết'
  confirmDialog.message = `Bạn có chắc muốn xoá bài viết "${label}"? Thao tác này không thể hoàn tác.`
  confirmDialog.confirmText = 'Xác nhận xoá'
  confirmDialog.tone = 'danger'
  confirmDialog.loading = false
  confirmDialog.open = true
}

function cancelDelete() {
  confirmDialog.open = false
  pendingDeleteId.value = null
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  confirmDialog.loading = true
  try {
    await deleteAdminNews(pendingDeleteId.value)
    confirmDialog.open = false
    pendingDeleteId.value = null
    showToast('success', 'Xoá bài viết thành công!')
    await fetchNews()
  } catch (error: any) {
    confirmDialog.open = false
    pendingDeleteId.value = null
    const msg = error?.message || 'Xoá bài viết thất bại.'
    errorMessage.value = msg
    showToast('error', msg)
  } finally {
    confirmDialog.loading = false
  }
}

function openFilePicker() {
  if (state.importingFile) return
  fileInputRef.value?.click()
}

function submitCrawl() {
  const rawUrl = String(crawlUrl.value || '').trim()
  const url = rawUrl && !/^https?:\/\//i.test(rawUrl) ? `https://${rawUrl}` : rawUrl
  if (!url) return
  showCrawlModal.value = false
  crawlUrl.value = ''
  router.push({ name: 'AdminNewsWorkflowCreate', query: { crawl: url } })
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) return

  state.importingFile = true
  errorMessage.value = ''
  try {
    const preview = await importWorkflowFile(file)
    persistImportedDraft(preview?.data || preview)
    showToast('success', 'Import file thành công! Đang mở trình soạn thảo...')
    router.push({ name: 'AdminNewsWorkflowCreate', query: { import: 'true' } })
  } catch (error: any) {
    const msg = error?.message || 'Import file thất bại.'
    errorMessage.value = msg
    showToast('error', msg)
  } finally {
    state.importingFile = false
    if (target) target.value = ''
  }
}

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat('en-GB').format(new Date(value)) : '--'
}

function formatCategories(item: any) {
  const categories = Array.isArray(item?.categories) ? item.categories : []
  return categories.length ? categories.map((category: any) => category?.name).filter(Boolean).join(', ') : '--'
}

onMounted(async () => {
  /* consume flash message from other pages (e.g. after save/publish) */
  const flash = consumeNewsWorkflowFlash()
  if (flash) {
    showToast(flash.type, flash.message)
  }

  try {
    categoryOptions.value = await listNewsCategories()
  } catch (error) {
    console.error(error)
  }
  await fetchNews()
})
</script>
<template>
  <section :class="pageClassName">
    <header class="page-header">
      <h1>News Management</h1>
      <div class="header-actions">
        <button type="button" class="btn-secondary" @click="showCrawlModal = true">Crawl from URL</button>
        <button type="button" class="btn-secondary" :disabled="state.importingFile" @click="openFilePicker">
          {{ state.importingFile ? 'Importing...' : 'Import File' }}
        </button>
        <button type="button" class="btn-primary" @click="openCreatePage">Create Article</button>
      </div>
    </header>

    <p v-if="errorMessage" class="alert-error">{{ errorMessage }}</p>

    <input ref="fileInputRef" class="hidden-file-input" type="file" accept=".docx,.pdf" @change="handleFileImport" />

    <div class="filter-bar">
      <input
        v-model="filters.keyword"
        class="filter-input filter-input--search"
        type="text"
        placeholder="Search by title or summary..."
        @keydown.enter.prevent="applyFilters"
      />
      <select v-model="filters.category_id" class="filter-input" @change="applyFilters">
        <option value="">All categories</option>
        <option v-for="category in categoryOptions" :key="category.id" :value="String(category.id)">
          {{ category.name }}
        </option>
      </select>
      <select v-model="filters.status" class="filter-input" @change="applyFilters">
        <option value="">All status</option>
        <option value="draft">draft</option>
        <option value="published">published</option>
      </select>
      <button type="button" class="btn-secondary" @click="applyFilters">Filter</button>
      <button type="button" class="btn-secondary" @click="resetFilters">Reset</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Category</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="state.loading"><td colspan="6" class="center">Loading...</td></tr>
          <tr v-else-if="!items.length"><td colspan="6" class="center">No articles found. Create one to get started.</td></tr>
          <tr v-for="item in items" :key="item.id" class="data-row">
            <td data-label="Image"><img class="thumb" :src="item.thumbnail_url || `https://picsum.photos/seed/${item.id}/200/200`" :alt="item.title" /></td>
            <td data-label="Title"><strong class="title-text">{{ item.title }}</strong></td>
            <td data-label="Category" class="category-cell">{{ formatCategories(item) }}</td>
            <td data-label="Status"><span class="status-chip" :class="`status-${item.status}`">{{ item.status }}</span></td>
            <td data-label="Created At">{{ formatDate(item.created_at) }}</td>
            <td data-label="Actions" class="row-actions">
              <button type="button" class="icon-btn" @click="openPreviewPage(item.id)">View</button>
              <button type="button" class="icon-btn" @click="openEditPage(item.id)">Edit</button>
              <button type="button" class="icon-btn icon-btn-danger" @click="requestDelete(item.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="showCrawlModal" class="modal-backdrop" @click.self="showCrawlModal = false">
      <div class="modal-card">
        <h2>Crawl Article from URL</h2>
        <p>Enter the URL of the article you want to import:</p>
        <input v-model="crawlUrl" type="url" placeholder="https://example.com/article" @keydown.enter.prevent="submitCrawl" />
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="showCrawlModal = false">Cancel</button>
          <button type="button" class="btn-primary" :disabled="!crawlUrl.trim()" @click="submitCrawl">Start Crawling</button>
        </div>
      </div>
    </div>

    <NewsConfirmDialog
      :open="confirmDialog.open"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      :tone="confirmDialog.tone"
      :loading="confirmDialog.loading"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
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
.page-shell { min-height: 100vh; background: #f5f7fb; padding: 24px; min-width: 0; }
.page-shell--embedded { min-height: auto; padding: 0; background: transparent; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
.page-header h1 { margin: 0; font-size: 28px; color: #101828; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.filter-bar { display: grid; grid-template-columns: minmax(220px, 1.5fr) minmax(180px, 1fr) 140px auto auto; gap: 10px; margin-bottom: 14px; }
.filter-input { width: 100%; min-height: 40px; border: 1px solid #d6dfea; border-radius: 6px; padding: 9px 12px; font-size: 13px; background: #fff; color: #1f2937; }
.filter-input--search { min-width: 0; }
.btn-primary, .btn-secondary, .btn-danger { border-radius: 6px; border: 1px solid #d9dee7; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-secondary { background: #fff; color: #1f2937; }
.btn-primary { background: #1473e6; border-color: #1473e6; color: #fff; }
.btn-danger { background: #d92d20; border-color: #d92d20; color: #fff; }
.table-wrap { background: #fff; border: 1px solid #dbdee6; border-radius: 8px; overflow: auto; }
table { width: 100%; border-collapse: collapse; min-width: 760px; }
th, td { border-bottom: 1px solid #e9edf3; padding: 12px 16px; text-align: left; font-size: 13px; }
th { color: #7a8699; font-size: 11px; text-transform: uppercase; }
.data-row:hover { background: #fafbfc; }
.thumb { width: 42px; height: 42px; border-radius: 4px; object-fit: cover; border: 1px solid #e5e7eb; }
.title-text { color: #101828; }
.category-cell { color: #475467; }
.status-chip { display: inline-flex; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.status-draft { color: #e06700; background: #fff3e0; }
.status-published { color: #2e7d32; background: #e8f5e9; }
.row-actions { display: flex; justify-content: flex-end; gap: 8px; }
.icon-btn { border: 0; background: transparent; color: #344054; cursor: pointer; }
.icon-btn-danger { color: #d92d20; }
.hidden-file-input { display: none; }
.center { text-align: center; color: #667085; }
.alert-error { margin: 0 0 12px; padding: 10px; border-radius: 6px; border: 1px solid #fecaca; background: #fff1f2; color: #b91c1c; font-size: 13px; }
.modal-backdrop { position: fixed; inset: 0; z-index: 2200; display: grid; place-items: center; background: rgba(15, 23, 42, 0.55); padding: 16px; }
.modal-card { width: min(520px, 100%); border-radius: 8px; background: #fff; box-shadow: 0 20px 48px rgba(15, 23, 42, 0.28); padding: 18px; display: grid; gap: 10px; }
.modal-card h2 { margin: 0; font-size: 18px; color: #111827; }
.modal-card p { margin: 0; color: #667085; }
.modal-card input { border: 1px solid #d6dfea; border-radius: 6px; padding: 10px 12px; font-size: 13px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
@media (max-width: 1180px) {
  .filter-bar { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .page-shell { padding: 16px; }
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { width: 100%; }
  .header-actions > * { flex: 1 1 180px; }
  .filter-bar { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 720px) {
  .page-shell { padding: 12px; }
  .filter-bar { grid-template-columns: 1fr; }
  .header-actions > * { width: 100%; }
}
@media (max-width: 760px) {
  .table-wrap { overflow: visible; }
  table { min-width: 0; display: block; }
  thead { display: none; }
  tbody { display: grid; gap: 10px; padding: 10px; }
  .data-row { display: block; border: 1px solid #e5e9f0; border-radius: 10px; background: #fff; overflow: hidden; }
  .data-row td { display: grid; grid-template-columns: minmax(96px, 38%) minmax(0, 1fr); gap: 10px; align-items: start; padding: 10px 12px; border-bottom: 1px dashed #e8edf4; }
  .data-row td:last-child { border-bottom: 0; }
  .data-row td::before { content: attr(data-label); color: #7a8699; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; line-height: 1.4; padding-top: 2px; }
  .center { display: block; padding: 16px 12px; }
  .row-actions { justify-content: flex-start; flex-wrap: wrap; }
}
@media (max-width: 520px) {
  .page-header h1 { font-size: 24px; }
  .modal-card { padding: 16px; }
  .modal-actions { display: grid; }
  .modal-actions > * { width: 100%; }
  .data-row td { grid-template-columns: 1fr; gap: 6px; }
}
</style>
