<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/admin/services/adminApi'
import { POST_STATUS_OPTIONS } from '@/admin/config/entityConfigs'
import { fetchPostSourcePreview, importPostSourceFile } from '@/admin/services/postWorkflowApi'
import { env } from '@/config/env'
import PostEditorToolbar from './PostEditorToolbar.vue'
import PostSettingsPanel from './PostSettingsPanel.vue'
import PostStatsCards from './PostStatsCards.vue'
import PostsTable from './PostsTable.vue'
import TiptapPostEditor from './TiptapPostEditor.vue'

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

const route = useRoute()
const router = useRouter()

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const AUTOSAVE_PREFIX = 'china-admin-post-draft'
const LOOKUP_TIMEOUT_MS = 45000
const POSTS_TIMEOUT_MS = 30000
const DELETE_BATCH_SIZE = 8
const POST_STATUS_SELECT_OPTIONS = POST_STATUS_OPTIONS
const DEFAULT_POST_STATUS = String(POST_STATUS_SELECT_OPTIONS[0]?.value || 'draft')

const records = ref([])
const categories = ref([])
const languages = ref([])
const mediaOptions = ref([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const deletingAll = ref(false)
const uploading = ref(false)
const sourceLoading = ref(false)
const importLoading = ref(false)
const composerOpen = ref(false)
const previewMode = ref(false)
const loadingComposer = ref(false)
const apiOffline = ref(false)
const currentCreateMode = ref('manual')
const formMode = ref('create')
const editingRecordId = ref(null)
const formErrors = ref([])
const searchKeyword = ref('')
const statusFilter = ref('')
const publicReadinessFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const autosaveLabel = ref('Chưa có bản nháp tự động')
const coverUploadFile = ref(null)
const bodyEditor = ref(null)
const editorState = ref({
  isReady: false,
  canUndo: false,
  canRedo: false,
  active: {},
  currentHeading: 'paragraph',
  currentAlign: 'left',
  currentColor: '#2a3439',
  currentFontSize: '16px',
})

const form = reactive({
  title: '',
  slug: '',
  category_id: null,
  summary: '',
  body: '',
  published_at: '',
  author: '',
  image_id: null,
  language_id: 1,
  status: DEFAULT_POST_STATUS,
  meta_title: '',
  meta_description: '',
})

const sourceForm = reactive({
  url: '',
  name: '',
  note: '',
})

const importState = reactive({
  file: null,
  fileName: '',
  message: '',
})

const sourcePreview = ref(null)
const detailRecord = ref(null)
const loadingDetail = ref(false)
let lookupRequestPromise = null
let recordsRequestPromise = null

const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pageSize.value)))
const selectedImage = computed(() => mediaOptions.value.find((item) => item.id === Number(form.image_id)) || null)
const selectedImageUrl = computed(() => (selectedImage.value?.url ? resolveMediaUrl(selectedImage.value.url) : ''))
const selectedCategory = computed(() => categories.value.find((item) => item.id === Number(form.category_id)) || null)
const selectedCategoryName = computed(() => selectedCategory.value?.name || '')
const selectedLanguage = computed(() => languages.value.find((item) => item.id === Number(form.language_id)) || null)
const selectedLanguageName = computed(() => selectedLanguage.value?.name || selectedLanguage.value?.code || '')
const expectedPublicLanguageCode = computed(() => String(env.languageCode || 'en').trim())
const publicationWarnings = computed(() => {
  const warnings = []
  if (String(form.status || '').trim() !== 'published') {
    warnings.push('Trạng thái hiện tại là draft hoặc chưa publish.')
  }

  const categorySlug = String(selectedCategory.value?.slug || '').trim()
  if (!categorySlug) {
    warnings.push('Bài chưa có category nên sẽ rơi vào Uncategorized.')
  } else if (!['corporate-news', 'industry-dynamics'].includes(categorySlug)) {
    warnings.push(`Category hiện tại (${categorySlug}) chưa khớp nhóm news public.`)
  }

  const languageCode = String(selectedLanguage.value?.code || '').trim()
  if (!languageCode) {
    warnings.push('Bài chưa có language hợp lệ.')
  } else if (languageCode !== expectedPublicLanguageCode.value) {
    warnings.push(`Language hiện tại là ${languageCode}, nhưng frontend public đang dùng ${expectedPublicLanguageCode.value}.`)
  }

  return warnings
})
const publicationReady = computed(() => publicationWarnings.value.length === 0)

function resolveRecordLanguageCode(record) {
  if (record.language?.code) return String(record.language.code).trim()
  if (record.language_code) return String(record.language_code).trim()
  const language = languages.value.find((item) => item.id === Number(record.language_id))
  return String(language?.code || '').trim()
}

function resolveRecordPublicIssues(record) {
  const issues = []
  const status = String(record.status || '').trim().toLowerCase()
  const categorySlug = String(record.category?.slug || record.category_slug || '').trim()
  const languageCode = resolveRecordLanguageCode(record)
  const validPublicCategories = ['corporate-news', 'industry-dynamics']

  if (status !== 'published') {
    issues.push('draft')
  }

  if (!categorySlug || !validPublicCategories.includes(categorySlug)) {
    issues.push('wrong-category')
  }

  if (!languageCode || languageCode !== expectedPublicLanguageCode.value) {
    issues.push('wrong-language')
  }

  if (!issues.length) {
    issues.push('ready')
  }

  return issues
}

const filteredRecords = computed(() => {
  const filter = String(publicReadinessFilter.value || '').trim()
  if (!filter) return records.value
  return records.value.filter((record) => resolveRecordPublicIssues(record).includes(filter))
})
const postView = computed(() => {
  const rawView = String(route.query.postView || '').trim()
  return ['editor', 'detail'].includes(rawView) ? rawView : 'list'
})
const editorRouteMode = computed(() => {
  const rawMode = String(route.query.mode || '').trim()
  return ['manual', 'reference', 'import'].includes(rawMode) ? rawMode : 'manual'
})
const routePostId = computed(() => {
  const rawValue = Number(route.query.postId)
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null
})
const wordsCount = computed(() => {
  const plain = stripHtml(form.body || '')
  if (!plain) return 0
  return plain.split(/\s+/).filter(Boolean).length
})
const readingTime = computed(() => Math.max(1, Math.ceil(wordsCount.value / 220)))
const statsCards = computed(() => {
  const published = records.value.filter((item) => item.status === 'published').length
  const draft = records.value.filter((item) => item.status === 'draft').length
  return [
    {
      key: 'total',
      label: 'Tổng bài viết',
      badge: 'All posts',
      value: totalRecords.value,
      description: 'Tổng số bài ghi đang được quản lý trong CMS.',
      tone: 'primary',
    },
    {
      key: 'published',
      label: 'Đã xuất bản',
      badge: 'Published',
      value: published,
      description: 'Số bài đã được publish trong trang hiện tại.',
      tone: 'success',
    },
    {
      key: 'draft',
      label: 'Bản nháp',
      badge: 'Draft',
      value: draft,
      description: 'Các bài đang được biên tập và chưa phát hành.',
      tone: 'warning',
    },
  ]
})

function normalizedToken() {
  return String(props.token || '').trim()
}

function notifySuccess(message) {
  emit('notify-success', message)
}

function notifyError(message) {
  emit('notify-error', message)
}

function clearNotify() {
  emit('clear-notify')
}

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDateForInput(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function autosaveKey() {
  return editingRecordId.value ? `${AUTOSAVE_PREFIX}-${editingRecordId.value}` : `${AUTOSAVE_PREFIX}-new-${currentCreateMode.value}`
}

function resetSourceWorkflow() {
  sourceForm.url = ''
  sourceForm.name = ''
  sourceForm.note = ''
  sourcePreview.value = null
}

function resetImportWorkflow() {
  importState.file = null
  importState.fileName = ''
  importState.message = ''
}

function getPreferredCategoryId() {
  const preferredCategory = categories.value.find((item) => String(item.slug || '').trim() === 'corporate-news')
  return preferredCategory?.id || categories.value[0]?.id || null
}

function applySuggestedCategory(suggestedSlug) {
  const normalizedSlug = String(suggestedSlug || '').trim()
  if (!normalizedSlug) return false

  const matchedCategory = categories.value.find((item) => String(item.slug || '').trim() === normalizedSlug)
  if (!matchedCategory?.id) return false

  form.category_id = matchedCategory.id
  return true
}

async function openPostCategoriesManager() {
  const nextQuery = { ...route.query, section: 'post_categories' }
  delete nextQuery.postView
  delete nextQuery.mode
  delete nextQuery.postId
  await router.replace({ query: nextQuery })
}

function handleCategoryCreated(createdCategory) {
  if (!createdCategory?.id) return

  const existing = categories.value.find((item) => Number(item.id) === Number(createdCategory.id))
  if (!existing) {
    categories.value = [...categories.value, createdCategory].sort((a, b) =>
      String(a?.name || '').localeCompare(String(b?.name || ''), 'vi')
    )
  } else {
    Object.assign(existing, createdCategory)
  }

  form.category_id = Number(createdCategory.id)
  notifySuccess(`Đã tạo danh mục "${createdCategory.name}" và gán cho bài viết hiện tại.`)
}

function ensureWorkflowDefaults(options = {}) {
  const { autoPublish = false, suggestedCategorySlug = '' } = options

  const appliedSuggestedCategory = applySuggestedCategory(suggestedCategorySlug)
  if (!form.category_id || (!appliedSuggestedCategory && String(selectedCategory.value?.slug || '').trim() === 'needs-review')) {
    form.category_id = getPreferredCategoryId()
  }

  const expectedLanguage = languages.value.find((item) => String(item.code || '').trim() === expectedPublicLanguageCode.value)
  if (expectedLanguage?.id) {
    form.language_id = expectedLanguage.id
  }

  if (!form.status) {
    form.status = DEFAULT_POST_STATUS
  }

  if (autoPublish) {
    form.status = 'published'
    if (!form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 16)
    }
  }
}

function resetForm() {
  form.title = ''
  form.slug = ''
  form.category_id = getPreferredCategoryId()
  form.summary = ''
  form.body = ''
  form.published_at = ''
  form.author = ''
  form.image_id = null
  form.language_id = languages.value[0]?.id || 1
  form.status = DEFAULT_POST_STATUS
  form.meta_title = ''
  form.meta_description = ''
  formErrors.value = []
  previewMode.value = false
  coverUploadFile.value = null
  resetSourceWorkflow()
  resetImportWorkflow()
}

function updateEditorState(nextState) {
  editorState.value = {
    ...editorState.value,
    ...(nextState || {}),
  }
}

function focusEditor() {
  bodyEditor.value?.focusEditor?.()
}


async function goToListView() {
  const nextQuery = { ...route.query }
  delete nextQuery.postView
  delete nextQuery.mode
  delete nextQuery.postId
  await router.replace({ query: nextQuery })
}

async function goToEditorView({ mode = 'manual', postId = null } = {}) {
  const nextQuery = {
    ...route.query,
    postView: 'editor',
    mode,
  }

  if (postId) {
    nextQuery.postId = String(postId)
  } else {
    delete nextQuery.postId
  }

  await router.replace({ query: nextQuery })
}

async function goToDetailView(postId) {
  const nextQuery = {
    ...route.query,
    postView: 'detail',
    postId: String(postId),
  }
  delete nextQuery.mode
  await router.replace({ query: nextQuery })
}

async function openComposer(mode = 'manual') {
  await goToEditorView({ mode })
}

async function openDetail(record) {
  await goToDetailView(record.id)
}

async function startCreateComposer(mode = 'manual') {
  currentCreateMode.value = mode
  composerOpen.value = true
  previewMode.value = false
  formMode.value = 'create'
  editingRecordId.value = null
  resetForm()
  restoreAutosaveDraft()
}

async function openEditForm(record) {
  await goToEditorView({ mode: 'manual', postId: record.id })
}

function openWordEditor() {
  if (!editingRecordId.value) {
    notifyError('Save the post first, then open the Word editor.')
    return
  }

  router.push({
    name: 'AdminPostWordEditor',
    params: { id: String(editingRecordId.value) },
  })
}

async function startEditComposer(record) {
  currentCreateMode.value = 'manual'
  formMode.value = 'edit'
  editingRecordId.value = record.id
  composerOpen.value = true
  previewMode.value = false
  loadingComposer.value = true

  try {
    form.title = record.title || ''
    form.slug = record.slug || ''
    form.category_id = record.category_id || null
    form.summary = record.summary || ''
    form.body = record.body || ''
    form.published_at = formatDateForInput(record.published_at)
    form.author = record.author || ''
    form.image_id = record.image_id || null
    form.language_id = record.language_id || languages.value[0]?.id || 1
    form.status = record.status || DEFAULT_POST_STATUS
    form.meta_title = record.meta_title || ''
    form.meta_description = record.meta_description || ''
    formErrors.value = []
    restoreAutosaveDraft()
  } finally {
    loadingComposer.value = false
  }
}

function closeDetailState() {
  detailRecord.value = null
  loadingDetail.value = false
}

async function loadDetailRecord(postId) {
  if (!postId) return null

  const localRecord = records.value.find((item) => item.id === postId)
  if (localRecord) {
    detailRecord.value = localRecord
    return localRecord
  }

  loadingDetail.value = true
  try {
    const response = await listAdminEntityRecords('posts', normalizedToken(), {
      skip: 0,
      limit: 100,
      search: undefined,
      status: undefined,
    })
    const matchedRecord = (response.items || []).find((item) => item.id === postId) || null
    detailRecord.value = matchedRecord
    return matchedRecord
  } finally {
    loadingDetail.value = false
  }
}

function closeComposerState() {
  composerOpen.value = false
  previewMode.value = false
  formErrors.value = []
}

async function closeComposer() {
  closeComposerState()
  await goToListView()
}

function applyEditorCommand(payload) {
  bodyEditor.value?.runCommand?.(payload)
  focusEditor()
}

function insertLink() {
  const existingHref = editorState.value?.active?.link ? undefined : ''
  const url = window.prompt('Nhập URL liên kết', existingHref || 'https://')
  if (url === null) return
  bodyEditor.value?.setLink?.(url.trim())
}

function insertImage() {
  const url = selectedImageUrl.value || window.prompt('Nhập URL ảnh để chèn vào nội dung')
  if (!url) return
  bodyEditor.value?.insertImage?.(url)
}

function insertTable() {
  bodyEditor.value?.insertTable?.({ rows: 3, cols: 3 })
}


function handleTitleInput() {
  if (!form.slug || formMode.value === 'create') {
    form.slug = slugify(form.title)
  }
}

function handleSlugInput() {
  form.slug = slugify(form.slug)
}

function validateForm() {
  const errors = []
  if (!String(form.title || '').trim()) errors.push('Tiêu đề là bắt buộc.')
  if (!String(form.slug || '').trim()) errors.push('Slug là bắt buộc.')
  if (!form.language_id) errors.push('Ngôn ngữ là bắt buộc.')
  if (!/^([a-z0-9]+(?:-[a-z0-9]+)*)$/.test(String(form.slug || ''))) {
    errors.push('Slug chỉ được gồm chữ thường, số và dấu gạch nối.')
  }
  formErrors.value = errors
  return errors.length === 0
}

function cleanPayload() {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    category_id: form.category_id ? Number(form.category_id) : null,
    summary: form.summary.trim() || null,
    body: form.body || null,
    published_at: form.published_at || null,
    author: form.author.trim() || null,
    image_id: form.image_id ? Number(form.image_id) : null,
    language_id: Number(form.language_id),
    status: form.status || DEFAULT_POST_STATUS,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
  }
}

function markApiOffline(error) {
  const message = String(error?.message || '')
  apiOffline.value = message.includes('Cannot connect to API server')
}

function resetLookupData() {
  categories.value = []
  languages.value = []
  mediaOptions.value = []
}


async function loadLookups() {
  const token = normalizedToken()
  if (!token) return

  if (lookupRequestPromise) {
    return lookupRequestPromise
  }

  lookupRequestPromise = (async () => {
    const [categoryResponse, languageResponse, mediaResponse] = await Promise.all([
      listAdminEntityRecords('post_categories', token, { skip: 0, limit: 100 }, { timeoutMs: LOOKUP_TIMEOUT_MS }),
      listAdminEntityRecords('languages', token, { skip: 0, limit: 100 }, { timeoutMs: LOOKUP_TIMEOUT_MS }),
      listAdminEntityRecords(
        'media_assets',
        token,
        { skip: 0, limit: 100, status: 'active' },
        { timeoutMs: LOOKUP_TIMEOUT_MS }
      ),
    ])

    categories.value = categoryResponse.items || []
    languages.value = languageResponse.items || []
    mediaOptions.value = mediaResponse.items || []
    apiOffline.value = false
  })()

  try {
    await lookupRequestPromise
  } catch (error) {
    resetLookupData()
    markApiOffline(error)
    notifyError(error.message || 'Không thể tải dữ liệu lookup.')
  } finally {
    lookupRequestPromise = null
  }
}

async function loadRecords() {
  const token = normalizedToken()
  if (!token) return

  if (recordsRequestPromise) {
    return recordsRequestPromise
  }

  recordsRequestPromise = (async () => {
    const response = await listAdminEntityRecords(
      'posts',
      token,
      {
        skip: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value,
        search: searchKeyword.value.trim() || undefined,
        status: statusFilter.value || undefined,
      },
      { timeoutMs: POSTS_TIMEOUT_MS }
    )

    records.value = response.items || []
    totalRecords.value = response.pagination?.total || 0
    apiOffline.value = false
  })()

  loading.value = true
  clearNotify()
  try {
    await recordsRequestPromise
  } catch (error) {
    records.value = []
    totalRecords.value = 0
    markApiOffline(error)
    notifyError(error.message || 'Không thể tải danh sách bài viết.')
  } finally {
    recordsRequestPromise = null
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.allSettled([loadLookups(), loadRecords()])
}

function persistAutosaveDraft() {
  if (!composerOpen.value) return
  const payload = {
    form: { ...form },
    mode: currentCreateMode.value,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(autosaveKey(), JSON.stringify(payload))
  autosaveLabel.value = `Tự lưu lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
}

function restoreAutosaveDraft() {
  const raw = localStorage.getItem(autosaveKey())
  if (!raw) return
  try {
    const payload = JSON.parse(raw)
    Object.assign(form, payload.form || {})
    autosaveLabel.value = `Đã khôi phục nháp lúc ${new Date(payload.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  } catch {
    autosaveLabel.value = 'Không thể khôi phục bản nháp tự động'
  }
}

async function saveDraftLocally() {
  persistAutosaveDraft()
  notifySuccess('Đã lưu bản nháp cục bộ.')
}

async function submitWorkflowPublish() {
  ensureWorkflowDefaults({ autoPublish: true })
  await submitForm()
}

async function submitForm() {
  const token = normalizedToken()
  if (!token || !validateForm()) return

  saving.value = true
  try {
    const payload = cleanPayload()
    if (formMode.value === 'create') {
      await createAdminEntityRecord('posts', payload, token)
      notifySuccess('Tạo bài viết thành công.')
    } else {
      await updateAdminEntityRecord('posts', editingRecordId.value, payload, token)
      notifySuccess('Cập nhật bài viết thành công.')
    }
    localStorage.removeItem(autosaveKey())
    closeComposerState()
    await goToListView()
    await loadRecords()
  } catch (error) {
    notifyError(error.message || 'Không thể lưu bài viết.')
  } finally {
    saving.value = false
  }
}

async function deleteRecord(record) {
  const token = normalizedToken()
  if (!token) return
  const confirmed = window.confirm(`Bạn có chắc muốn xoá bài "${record.title || `#${record.id}`}"?`)
  if (!confirmed) return

  deletingId.value = record.id
  try {
    await deleteAdminEntityRecord('posts', record.id, token)
    notifySuccess('Đã xoá bài viết.')
    await loadRecords()
  } catch (error) {
    notifyError(error.message || 'Không thể xoá bài viết.')
  } finally {
    deletingId.value = null
  }
}

async function collectAllPostIds(token) {
  const ids = []
  let skip = 0
  const limit = 100
  let total = 0

  while (true) {
    const response = await listAdminEntityRecords(
      'posts',
      token,
      { skip, limit },
      { timeoutMs: POSTS_TIMEOUT_MS }
    )

    const items = response.items || []
    if (skip === 0) {
      total = Number(response.pagination?.total || items.length || 0)
    }

    ids.push(...items.map((item) => Number(item.id)).filter((id) => Number.isFinite(id) && id > 0))
    if (!items.length || ids.length >= total) break
    skip += limit
  }

  return [...new Set(ids)]
}

async function deleteAllPosts() {
  const token = normalizedToken()
  if (!token || deletingAll.value) return

  if (!totalRecords.value) {
    notifyError('Khong co bai viet de xoa.')
    return
  }

  const confirmed = window.confirm('Ban sap xoa TOAN BO bai viet. Hanh dong nay khong the hoan tac. Tiep tuc?')
  if (!confirmed) return

  const keyword = window.prompt('Nhap DELETE-ALL de xac nhan xoa toan bo bai viet:')
  if (String(keyword || '').trim().toUpperCase() !== 'DELETE-ALL') {
    notifyError('Da huy thao tac xoa toan bo.')
    return
  }

  deletingAll.value = true
  clearNotify()
  try {
    const ids = await collectAllPostIds(token)
    if (!ids.length) {
      notifyError('Khong tim thay bai viet de xoa hang loat.')
      return
    }

    let successCount = 0
    let failedCount = 0
    for (let index = 0; index < ids.length; index += DELETE_BATCH_SIZE) {
      const chunk = ids.slice(index, index + DELETE_BATCH_SIZE)
      const results = await Promise.allSettled(chunk.map((id) => deleteAdminEntityRecord('posts', id, token)))

      for (const result of results) {
        if (result.status === 'fulfilled') successCount += 1
        else failedCount += 1
      }
    }

    currentPage.value = 1
    await loadRecords()

    if (failedCount === 0) {
      notifySuccess(`Da xoa toan bo bai viet (${successCount}).`)
    } else {
      notifyError(`Da xoa ${successCount} bai, that bai ${failedCount} bai.`)
    }
  } catch (error) {
    notifyError(error.message || 'Khong the xoa toan bo bai viet.')
  } finally {
    deletingAll.value = false
  }
}

function handleCoverFileChange(event) {
  coverUploadFile.value = event.target.files?.[0] || null
}

async function uploadCover() {
  const token = normalizedToken()
  if (!token || !coverUploadFile.value) {
    notifyError('Hãy chọn file ảnh cover trước khi upload.')
    return
  }

  uploading.value = true
  try {
    const media = await uploadAdminMediaAsset(token, coverUploadFile.value, {
      title: form.title || coverUploadFile.value.name,
      altText: form.title || coverUploadFile.value.name,
    })
    await loadLookups()
    form.image_id = media.id
    coverUploadFile.value = null
    notifySuccess(`Đã upload cover #${media.id}.`)
  } catch (error) {
    notifyError(error.message || 'Upload cover thất bại.')
  } finally {
    uploading.value = false
  }
}

async function fetchReferenceSource() {
  const token = normalizedToken()
  if (!token) return
  if (!sourceForm.url.trim()) {
    notifyError('Bạn cần nhập URL nguồn tham khảo.')
    return
  }

  sourceLoading.value = true
  try {
    const preview = await fetchPostSourcePreview(token, {
      url: sourceForm.url.trim(),
      source_name: sourceForm.name.trim() || null,
      note: sourceForm.note.trim() || null,
    })
    sourcePreview.value = preview
    notifySuccess('Đã lấy dữ liệu nguồn tham khảo từ API.')
  } catch (error) {
    notifyError(error.message || 'Không thể lấy nguồn tham khảo.')
  } finally {
    sourceLoading.value = false
  }
}


function applyReferenceSource() {
  if (!sourcePreview.value?.draft) {
    notifyError('Chưa có dữ liệu nguồn để tạo nháp.')
    return
  }

  const draft = sourcePreview.value.draft
  form.title = draft.title || form.title
  form.slug = draft.slug || form.slug || slugify(draft.title)
  form.summary = draft.summary || form.summary
  form.body = draft.body || form.body
  form.meta_title = draft.meta_title || form.meta_title
  form.meta_description = draft.meta_description || form.meta_description
  form.author = draft.author || form.author
  ensureWorkflowDefaults({
    autoPublish: true,
    suggestedCategorySlug: sourcePreview.value.suggested_category_slug,
  })
  notifySuccess('Đã map dữ liệu nguồn tham khảo vào editor, tự gợi ý category và chuẩn bị publish.')
}


function handleImportFileChange(event) {
  const file = event.target.files?.[0] || null
  importState.file = file
  importState.fileName = file?.name || ''
  importState.message = file ? 'Đã nhận file. Sẵn sàng map dữ liệu vào form bài viết.' : ''
}

async function applyImportedFile() {
  const token = normalizedToken()
  if (!token) return
  if (!importState.file) {
    notifyError('Bạn cần chọn file trước khi import.')
    return
  }

  importLoading.value = true
  try {
    const preview = await importPostSourceFile(token, importState.file)
    form.title = form.title.trim() || preview.draft.title
    form.slug = form.slug.trim() || preview.draft.slug
    form.summary = form.summary.trim() || preview.draft.summary || ''
    form.body = preview.draft.body || form.body
    form.meta_title = preview.draft.meta_title || form.meta_title
    form.meta_description = preview.draft.meta_description || form.meta_description
    ensureWorkflowDefaults({
      autoPublish: true,
      suggestedCategorySlug: preview.suggested_category_slug,
    })
    importState.message = `Đã map nội dung ${preview.file.detected_format.toUpperCase()} vào editor. Hệ thống đã tự gợi ý category, language và chuẩn bị trạng thái publish.`
    notifySuccess('Đã import file vào editor từ API.')
  } catch (error) {
    notifyError(error.message || 'Không thể import file này.')
  } finally {
    importLoading.value = false
  }
}


function setPage(page) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

watch(
  () => form.title,
  () => {
    if (formMode.value === 'create') {
      handleTitleInput()
    }
  }
)

watch(
  () => form.slug,
  () => {
    form.slug = slugify(form.slug)
  }
)

watch(
  () => form.body,
  () => {
    if (composerOpen.value) {
      window.clearTimeout(window.__chinaPostAutosaveTimer)
      window.__chinaPostAutosaveTimer = window.setTimeout(() => {
        persistAutosaveDraft()
      }, 1200)
    }
  }
)

watch(
  () => props.active,
  async (active) => {
    if (active && normalizedToken()) {
      await refreshAll()
    } else {
      closeComposerState()
    }
  },
  { immediate: true }
)

watch([currentPage, pageSize], async () => {
  if (props.active && normalizedToken()) {
    await loadRecords()
  }
})

watch(
  () => [postView.value, editorRouteMode.value, routePostId.value, props.active, props.token],
  async ([view, mode, postId, active, tokenValue]) => {
    if (!active || !String(tokenValue || '').trim()) return

    if (view === 'list') {
      closeComposerState()
      closeDetailState()
      return
    }

    if (view === 'detail') {
      closeComposerState()
      if (!postId) {
        notifyError('Không tìm thấy bài viết để xem chi tiết.')
        await goToListView()
        return
      }

      try {
        const record = await loadDetailRecord(postId)
        if (!record) {
          notifyError('Không tìm thấy bài viết để xem chi tiết.')
          await goToListView()
        }
      } catch (error) {
        markApiOffline(error)
        notifyError(error.message || 'Không thể tải chi tiết bài viết.')
      }
      return
    }

    closeDetailState()
    await loadLookups()

    if (apiOffline.value) {
      composerOpen.value = true
      loadingComposer.value = false
      return
    }

    if (postId) {
      const localRecord = records.value.find((item) => item.id === postId)
      if (localRecord) {
        await startEditComposer(localRecord)
        return
      }

      try {
        const response = await listAdminEntityRecords('posts', normalizedToken(), {
          skip: 0,
          limit: 100,
          search: undefined,
          status: undefined,
        })
        const matchedRecord = (response.items || []).find((item) => item.id === postId)
        if (matchedRecord) {
          await startEditComposer(matchedRecord)
          return
        }
        notifyError('Không tìm thấy bài viết cần chỉnh sửa.')
        await goToListView()
      } catch (error) {
        markApiOffline(error)
        notifyError(error.message || 'Không thể mở bài viết để chỉnh sửa.')
      }
      return
    }

    await startCreateComposer(mode)
  },
  { immediate: true }
)


watch(
  () => props.token,
  async (value) => {
    if (!String(value || '').trim()) {
      apiOffline.value = false
      records.value = []
      totalRecords.value = 0
      resetLookupData()
      closeDetailState()
      closeComposerState()
      return
    }
    if (props.active) {
      await refreshAll()
    }
  }
)

onBeforeUnmount(() => {
  if (window.__chinaPostAutosaveTimer) {
    window.clearTimeout(window.__chinaPostAutosaveTimer)
  }
})
</script>

<template>
  <section class="posts-cms">
    <div v-if="apiOffline" class="api-offline-banner">
      Cannot connect to API server at {{ env.apiBaseUrl }}.
    </div>

    <template v-if="postView === 'list'">
      <section class="hero-shell">
        <div class="hero-copy">
          <p class="eyebrow">Editorial dashboard</p>
          <h2>Quản trị bài đăng tin tức theo workflow CMS hiện đại</h2>
          <p>
            Quản lý toàn bộ vòng đời bài viết trong một newsroom studio gồm 3 luồng chính: dựng nháp từ nguồn tham
            khảo, import tài liệu và soạn bài thủ công. Mỗi hành động sẽ mở một màn hình biên tập riêng để xem trước,
            chỉnh sửa và xuất bản chuyên nghiệp hơn.
          </p>
          <div class="hero-inline-meta">
            <span>{{ totalRecords }} bài viết</span>
            <span>{{ records.filter((item) => item.status === 'published').length }} đã xuất bản</span>
            <span>{{ records.filter((item) => item.status === 'draft').length }} bản nháp</span>
          </div>
        </div>
        <div class="hero-actions">
          <div class="create-options">
            <button id="create_reference_post_button" type="button" class="create-option create-option--reference" @click="openComposer('reference')">
              <span class="create-option-index">01</span>
              <div class="create-option-copy">
                <strong>Crawl nguon tin tham khao</strong>
                <small>Lay noi dung tu URL, tao nhap bien tap theo quy dinh ban quyen, sau do chuyen vao trang chinh sua tin tuc.</small>
              </div>
            </button>

            <button id="create_import_post_button" type="button" class="create-option create-option--import" @click="openComposer('import')">
              <span class="create-option-index">02</span>
              <div class="create-option-copy">
                <strong>Import file -> chuyen HTML</strong>
                <small>Nhap docx, txt, md, html hoac pdf, map noi dung thanh HTML va mo trang xem truoc de chinh sua.</small>
              </div>
            </button>

            <button id="create_manual_post_button" type="button" class="create-option create-option--manual" @click="openComposer('manual')">
              <span class="create-option-index">03</span>
              <div class="create-option-copy">
                <strong>Tao moi tin tuc</strong>
                <small>Vao thang trang soan bai tin tuc de viet, xem truoc va xuat ban.</small>
              </div>
            </button>
          </div>
        </div>
      </section>

      <PostStatsCards :cards="statsCards" />

      <PostsTable
        :records="filteredRecords"
        :loading="loading"
        :deleting-all="deletingAll"
        :total-records="publicReadinessFilter ? filteredRecords.length : totalRecords"
        :current-page="currentPage"
        :total-pages="totalPages"
        :page-size="pageSize"
        :search-keyword="searchKeyword"
        :status-filter="statusFilter"
        :status-options="POST_STATUS_SELECT_OPTIONS"
        :public-readiness-filter="publicReadinessFilter"
        :languages="languages"
        :expected-public-language-code="expectedPublicLanguageCode"
        @update:search-keyword="searchKeyword = $event"
        @update:status-filter="statusFilter = $event"
        @update:public-readiness-filter="publicReadinessFilter = $event"
        @update:page-size="pageSize = $event"
        @search="currentPage = 1; loadRecords()"
        @view="openDetail"
        @edit="openEditForm"
        @delete="deleteRecord"
        @delete-all="deleteAllPosts"
        @page-change="setPage"
      />
    </template>

    <section v-else-if="postView === 'detail'" class="composer-shell composer-shell--page detail-shell">
      <div class="composer-topbar">
        <div>
          <p class="eyebrow">Post detail</p>
          <h3>
            Xem chi tiết bài viết
            <span class="mode-chip">read only</span>
          </h3>
        </div>
        <div class="composer-topbar-actions">
          <button id="detail_back_to_posts_list_button" type="button" class="btn btn-secondary" @click="goToListView">
            Quay lại danh sách
          </button>
          <button
            v-if="detailRecord"
            id="detail_edit_post_button"
            type="button"
            class="btn btn-primary"
            @click="openEditForm(detailRecord)"
          >
            Chỉnh sửa bài viết
          </button>
        </div>
      </div>

      <div v-if="loadingDetail" class="editor-loading">Đang tải chi tiết bài viết...</div>

      <article v-else-if="detailRecord" class="detail-card">
        <div class="detail-hero">
          <div class="detail-copy">
            <div class="detail-meta-line">
              <span class="preview-badge">{{ detailRecord.status || 'draft' }}</span>
              <span class="detail-slug">/{{ detailRecord.slug || detailRecord.id }}</span>
            </div>
            <h1>{{ detailRecord.title || `Bài viết #${detailRecord.id}` }}</h1>
            <p class="detail-summary">{{ detailRecord.summary || 'Bài viết này chưa có mô tả ngắn.' }}</p>
            <div class="detail-facts">
              <span><strong>Tác giả:</strong> {{ detailRecord.author || 'Editorial team' }}</span>
              <span><strong>Danh mục:</strong> {{ detailRecord.category?.name || detailRecord.category_name || detailRecord.category_id || 'Uncategorized' }}</span>
              <span><strong>Ngôn ngữ:</strong> {{ detailRecord.language?.name || detailRecord.language_code || detailRecord.language_id || '-' }}</span>
              <span><strong>Xuất bản:</strong> {{ detailRecord.published_at || detailRecord.updated_at || detailRecord.created_at || '-' }}</span>
            </div>
          </div>
          <div v-if="resolveMediaUrl(detailRecord.image?.url || detailRecord.image_url)" class="detail-cover-wrap">
            <img
              :src="resolveMediaUrl(detailRecord.image?.url || detailRecord.image_url)"
              :alt="detailRecord.title || 'Post cover'"
              class="detail-cover"
            />
          </div>
        </div>

        <div class="detail-grid">
          <aside class="detail-sidebar">
            <div class="detail-panel">
              <p class="eyebrow">Thông tin bài viết</p>
              <dl class="detail-definition-list">
                <div>
                  <dt>ID</dt>
                  <dd>#{{ detailRecord.id }}</dd>
                </div>
                <div>
                  <dt>Slug</dt>
                  <dd>{{ detailRecord.slug || '-' }}</dd>
                </div>
                <div>
                  <dt>Meta title</dt>
                  <dd>{{ detailRecord.meta_title || '-' }}</dd>
                </div>
                <div>
                  <dt>Meta description</dt>
                  <dd>{{ detailRecord.meta_description || '-' }}</dd>
                </div>
                <div>
                  <dt>Nguồn</dt>
                  <dd>{{ detailRecord.source_url || detailRecord.import_file_name || 'Tạo thủ công' }}</dd>
                </div>
              </dl>
            </div>
          </aside>

          <section class="detail-body-shell">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="detail-body" v-html="detailRecord.body || '<p>Bài viết chưa có nội dung.</p>'"></div>
          </section>
        </div>
      </article>

      <div v-else class="editor-loading">Không tìm thấy dữ liệu bài viết.</div>
    </section>

    <section v-else-if="composerOpen" class="composer-shell composer-shell--page">
      <div class="composer-topbar">
        <div>
          <p class="eyebrow">Editorial studio</p>
          <h3>
            {{ formMode === 'create' ? 'Tạo bài viết mới' : 'Chỉnh sửa bài viết' }}
            <span class="mode-chip">{{ currentCreateMode }}</span>
          </h3>
        </div>
        <div class="composer-topbar-actions">
          <span class="editor-meta">{{ wordsCount }} từ • {{ readingTime }} phút đọc</span>
          <button
            id="open_word_editor_button"
            type="button"
            class="btn btn-secondary"
            :disabled="!editingRecordId"
            @click="openWordEditor"
          >
            Open Word Editor
          </button>
          <button id="back_to_posts_list_button" type="button" class="btn btn-secondary" @click="closeComposer">Quay lại danh sách</button>
          <button id="save_post_button" type="button" class="btn btn-primary" :disabled="saving" @click="submitForm">
            {{ saving ? 'Đang lưu...' : 'Lưu bài viết' }}
          </button>
        </div>
      </div>

      <div v-if="formErrors.length" class="form-errors">
        <p v-for="error in formErrors" :key="error">{{ error }}</p>
      </div>

      <div class="composer-grid">
        <section class="editor-column">
          <div class="editor-card">
            <div class="editor-heading-row">
              <div>
                <p class="eyebrow">Rich editor</p>
                <h4>Soạn thảo nội dung</h4>
              </div>
              <div class="quick-meta">
                <span>{{ selectedCategoryName || 'Chưa chọn danh mục' }}</span>
                <span>{{ selectedLanguageName || 'Ngôn ngữ' }}</span>
              </div>
            </div>

            <PostEditorToolbar
              :preview-mode="previewMode"
              :autosave-label="autosaveLabel"
              :editor-state="editorState"
              @apply-command="applyEditorCommand"
              @insert-link="insertLink"
              @insert-image="insertImage"
              @insert-table="insertTable"
              @toggle-preview="previewMode = !previewMode"
              @save-draft="saveDraftLocally"
            />

            <div v-if="loadingComposer" class="editor-loading">Đang chuẩn bị dữ liệu bài viết...</div>

            <template v-else>
              <div v-if="!previewMode" class="editor-surface-wrap">
                <TiptapPostEditor
                  id="post_body_editor"
                  ref="bodyEditor"
                  v-model="form.body"
                  :editable="true"
                  placeholder="Bắt đầu soạn nội dung bài viết ở đây..."
                  @editor-state="updateEditorState"
                />
              </div>

              <div v-else class="preview-surface">
                <span v-if="selectedCategoryName" class="preview-badge">{{ selectedCategoryName }}</span>
                <h1>{{ form.title || 'Tiêu đề bài viết sẽ hiển thị ở đây' }}</h1>
                <p class="preview-meta-row">
                  <span>{{ form.author || 'Chưa có tác giả' }}</span>
                  <span>•</span>
                  <span>{{ form.published_at || 'Chưa có lịch xuất bản' }}</span>
                  <span>•</span>
                  <span>{{ selectedLanguageName || 'Ngôn ngữ' }}</span>
                </p>
                <p class="preview-summary">{{ form.summary || 'Tóm tắt bài viết sẽ hiển thị ở đây.' }}</p>
                <div v-if="selectedImageUrl" class="preview-cover">
                  <img :src="selectedImageUrl" :alt="form.title || 'Preview cover'" />
                </div>
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div class="preview-body" v-html="form.body || '<p>Nội dung đang chờ biên tập...</p>'"></div>
              </div>
            </template>
          </div>
        </section>

        <PostSettingsPanel
          :token="token"
          :mode="currentCreateMode"
          :form="form"
          :categories="categories"
          :status-options="POST_STATUS_SELECT_OPTIONS"
          :languages="languages"
          :media-options="mediaOptions"
          :selected-image-url="selectedImageUrl"
          :source-form="sourceForm"
          :source-preview="sourcePreview"
          :source-loading="sourceLoading"
          :import-state="importState"
          :import-loading="importLoading"
          :saving="saving"
          :publication-warnings="publicationWarnings"
          :publication-ready="publicationReady"
          :expected-language-code="expectedPublicLanguageCode"
          @source-fetch="fetchReferenceSource"
          @source-apply="applyReferenceSource"
          @import-file-change="handleImportFileChange"
          @import-apply="applyImportedFile"
          @cover-file-change="handleCoverFileChange"
          @upload-cover="uploadCover"
          @submit="currentCreateMode === 'manual' ? submitForm() : submitWorkflowPublish()"
          @save-draft="saveDraftLocally"
          @manage-categories="openPostCategoriesManager"
          @category-created="handleCategoryCreated"
        />
      </div>
    </section>
  </section>
</template>

<style scoped>
.posts-cms {
  margin-top: 12px;
  display: grid;
  gap: 22px;
  color: #2a3439;
}

.api-offline-banner {
  border: 1px solid #f0b7b2;
  border-radius: 14px;
  background: #ffe8e5;
  color: #a34740;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
}

.hero-shell,
.composer-shell {
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(216, 226, 255, 0.78), transparent 26%),
    linear-gradient(180deg, #ffffff 0%, #f7f9fb 100%);
  box-shadow: 0 10px 34px rgba(42, 52, 57, 0.05);
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.16fr) minmax(380px, 0.9fr);
  gap: 22px;
  padding: 28px;
}

.composer-shell--page {
  min-height: calc(100vh - 220px);
  padding: 24px;
  display: grid;
  gap: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #566166;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-weight: 800;
}

.hero-copy {
  display: grid;
  align-content: start;
  gap: 14px;
}

.hero-copy h2,
.composer-topbar h3,
.editor-heading-row h4 {
  margin: 0;
  color: #2a3439;
}

.hero-copy h2 {
  font-size: clamp(34px, 4vw, 46px);
  line-height: 1.04;
  letter-spacing: -0.045em;
}

.hero-copy p:last-child {
  margin: 0;
  max-width: 70ch;
  color: #566166;
  line-height: 1.78;
}

.hero-inline-meta,
.composer-topbar,
.composer-topbar-actions,
.quick-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-inline-meta {
  margin-top: 8px;
}

.hero-inline-meta span,
.quick-meta span,
.editor-meta,
.mode-chip,
.preview-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-inline-meta span,
.quick-meta span,
.editor-meta {
  background: #f0f4f7;
  color: #566166;
}

.mode-chip,
.preview-badge {
  background: #d8e2ff;
  color: #005ac2;
}

.hero-actions {
  display: grid;
  gap: 12px;
}

.create-main-button {
  border: none;
  border-radius: 18px;
  padding: 16px 18px;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(145deg, #005ac2 0%, #004fab 100%);
  color: #f7f7ff;
  display: grid;
  gap: 4px;
}

.create-main-title {
  font-size: 17px;
  font-weight: 800;
}

.create-main-subtitle {
  opacity: 0.9;
  line-height: 1.6;
}

.create-options {
  display: grid;
  gap: 10px;
}

.create-option {
  border: none;
  border-radius: 16px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.create-option:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(42, 52, 57, 0.1);
}

.create-option-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  color: #2a3439;
  font-weight: 800;
}

.create-option-copy {
  display: grid;
  gap: 4px;
}

.create-option-copy strong {
  color: #2a3439;
  font-size: 15px;
  line-height: 1.4;
}

.create-option-copy small {
  color: #566166;
  line-height: 1.6;
}

.create-option--reference {
  background: #d8e2ff;
}

.create-option--import {
  background: #d3ceef;
}

.create-option--manual {
  background: #d3e4fe;
}

.composer-topbar {
  justify-content: space-between;
}

.composer-topbar h3 {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.btn {
  min-height: 46px;
  border: none;
  border-radius: 14px;
  padding: 0 18px;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.btn-primary {
  background: linear-gradient(145deg, #005ac2 0%, #004fab 100%);
  color: #f7f7ff;
}

.btn-secondary {
  background: #f0f4f7;
  color: #435368;
}

.form-errors {
  border-radius: 18px;
  background: #ffe4e1;
  padding: 14px 16px;
}

.form-errors p {
  margin: 0;
  color: #9f403d;
  line-height: 1.6;
}

.composer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(332px, 0.8fr);
  gap: 20px;
  align-items: start;
}

.editor-column {
  min-width: 0;
}

.editor-card {
  overflow: hidden;
  border-radius: 26px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(42, 52, 57, 0.05);
}

.editor-heading-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
}

.editor-loading {
  padding: 32px 20px;
  color: #566166;
}

.editor-surface-wrap {
  padding: 14px 20px 20px;
}

.preview-surface {
  min-height: 720px;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
  padding: 28px;
  box-shadow:
    inset 0 0 0 1px rgba(169, 180, 185, 0.18),
    0 20px 45px rgba(42, 52, 57, 0.04);
}

.preview-surface h1 {
  margin: 14px 0 10px;
  font-size: clamp(36px, 4vw, 50px);
  line-height: 1.04;
  letter-spacing: -0.05em;
  color: #2a3439;
}

.preview-meta-row,
.preview-summary {
  color: #566166;
}

.preview-meta-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-cover {
  margin: 18px 0;
  overflow: hidden;
  border-radius: 18px;
}

.preview-cover img {
  display: block;
  width: 100%;
  max-height: 380px;
  object-fit: cover;
}

.preview-body {
  color: #435368;
  line-height: 1.9;
}

.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3) {
  color: #2a3439;
  margin: 24px 0 12px;
  line-height: 1.16;
}

.preview-body :deep(blockquote) {
  margin: 18px 0;
  padding: 16px 18px;
  border-radius: 16px;
  background: #f0f4f7;
  color: #566166;
}

.preview-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 22px 0;
}

.preview-body :deep(th),
.preview-body :deep(td) {
  border: 1px solid rgba(169, 180, 185, 0.24);
  padding: 12px 14px;
}

.detail-shell {
  gap: 20px;
}

.detail-card {
  display: grid;
  gap: 22px;
}

.detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.8fr);
  gap: 20px;
  align-items: stretch;
}

.detail-copy,
.detail-panel,
.detail-body-shell {
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(42, 52, 57, 0.05);
}

.detail-copy {
  padding: 28px;
  display: grid;
  gap: 14px;
}

.detail-meta-line,
.detail-facts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.detail-slug {
  color: #566166;
  font-size: 12px;
  font-weight: 700;
}

.detail-copy h1 {
  margin: 0;
  color: #2a3439;
  font-size: clamp(34px, 4vw, 48px);
  line-height: 1.04;
  letter-spacing: -0.045em;
}

.detail-summary,
.detail-facts span {
  color: #566166;
  line-height: 1.8;
}

.detail-cover-wrap {
  overflow: hidden;
  border-radius: 24px;
  background: #eef3f8;
  min-height: 320px;
  box-shadow: 0 8px 30px rgba(42, 52, 57, 0.05);
}

.detail-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.74fr) minmax(0, 1.6fr);
  gap: 20px;
  align-items: start;
}

.detail-sidebar {
  display: grid;
}

.detail-panel {
  padding: 22px;
}

.detail-definition-list {
  display: grid;
  gap: 16px;
  margin: 0;
}

.detail-definition-list div {
  display: grid;
  gap: 6px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(169, 180, 185, 0.18);
}

.detail-definition-list div:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-definition-list dt {
  color: #566166;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-definition-list dd {
  margin: 0;
  color: #2a3439;
  line-height: 1.7;
}

.detail-body-shell {
  padding: 28px;
}

.detail-body {
  color: #435368;
  line-height: 1.9;
}

.detail-body :deep(h1),
.detail-body :deep(h2),
.detail-body :deep(h3) {
  color: #2a3439;
  margin: 28px 0 14px;
  line-height: 1.16;
}

.detail-body :deep(p),
.detail-body :deep(ul),
.detail-body :deep(ol) {
  margin: 0 0 16px;
}

.detail-body :deep(blockquote) {
  margin: 20px 0;
  padding: 18px 20px;
  border-radius: 18px;
  background: #f0f4f7;
  color: #566166;
}

.detail-body :deep(img) {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 18px;
  margin: 18px 0;
}

.detail-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 22px 0;
}

.detail-body :deep(th),
.detail-body :deep(td) {
  border: 1px solid rgba(169, 180, 185, 0.24);
  padding: 12px 14px;
}

.detail-body :deep(th) {
  background: #f0f4f7;
}

@media (max-width: 1200px) {
  .hero-shell,
  .composer-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-shell,
  .composer-shell--page {
    padding: 16px;
  }

  .composer-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .editor-heading-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-surface {
    min-height: 460px;
    padding: 18px;
  }
}
</style>


