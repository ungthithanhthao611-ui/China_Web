<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/admin/services/adminApi'
import { DEFAULT_STATUS_OPTIONS, ENTITY_MANAGER_CONFIGS } from '@/admin/config/entityConfigs'
import { env } from '@/config/env'

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
  entityKey: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const FIELD_GROUPS = {
  content: ['summary', 'body', 'description', 'content', 'message'],
  media: ['image_id', 'hero_image_id', 'thumbnail_id', 'media_id'],
}

const BANNER_MEDIA_KEYWORDS = ['banner', 'hero', 'slider', 'slide', 'cover', 'homepage']
const MEDIA_NOISE_KEYWORDS = ['screenshot', 'screen-shot', 'screen shot', 'capture', 'tmp', 'temp']

const RELATION_ENTITIES = {
  language_id: 'languages',
  category_id: null,
  project_id: 'projects',
  branch_id: 'branches',
  page_id: 'pages',
  parent_id: null,
  block_id: 'content_blocks',
}

const records = ref([])
const mediaOptions = ref([])
const relationOptions = reactive({})
const searchKeyword = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalRecords = ref(0)
const loading = ref(false)
const saving = ref(false)
const deletingId = ref(null)
const formOpen = ref(false)
const formMode = ref('create')
const editingRecordId = ref(null)
const inlineEditorRef = ref(null)
const slugManuallyEdited = ref(false)
const form = reactive({})
const formErrors = ref([])
const uploadFile = ref(null)
const uploadTitle = ref('')
const uploadAltText = ref('')
const uploadTargetField = ref('image_id')
const uploading = ref(false)
const videoUploadFile = ref(null)
const videoUploading = ref(false)
const videoFileInputRef = ref(null)
const bannerFocusDragging = ref(false)
const actionConfirmDialog = reactive({
  visible: false,
  eyebrow: 'Confirm action',
  title: '',
  message: '',
  confirmText: 'Confirm',
  tone: 'primary',
})
let actionConfirmResolver = null

const config = computed(() => ENTITY_MANAGER_CONFIGS[props.entityKey])
const tableColumns = computed(() => config.value?.table || ['id'])
const formFields = computed(() => config.value?.fields || [])
const visibleFormFields = computed(() => (
  isBannerEntity.value
    ? formFields.value.filter((field) => !['image_id', 'focus_x', 'focus_y'].includes(field))
    : formFields.value
))
const statusOptions = computed(() => {
  const source = Array.isArray(config.value?.statusOptions) && config.value.statusOptions.length
    ? config.value.statusOptions
    : DEFAULT_STATUS_OPTIONS
  return source.map((option) => {
    if (typeof option === 'string') {
      return { value: option, label: option }
    }
    return {
      value: String(option?.value || '').trim(),
      label: String(option?.label || option?.value || '').trim(),
    }
  }).filter((option) => option.value)
})
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pageSize.value)))
const hasStatusFilter = computed(() => formFields.value.includes('status'))
const hasMediaFields = computed(() => formFields.value.some((field) => FIELD_GROUPS.media.includes(field)))
const mediaFieldOptions = computed(() => formFields.value.filter((field) => FIELD_GROUPS.media.includes(field)))
const canCreate = computed(() => config.value?.allowCreate !== false)
const standaloneUpload = computed(() => Boolean(config.value?.standaloneUpload))
const isMediaAssetsEntity = computed(() => props.entityKey === 'media_assets')
const isVideosEntity = computed(() => props.entityKey === 'videos')
const isBannerEntity = computed(() => props.entityKey === 'banners')
const isConfigModalEntity = computed(() => config.value?.editorPresentation === 'modal')
const isFormModalEntity = computed(() => isBannerEntity.value || isVideosEntity.value || isConfigModalEntity.value)
const isFormModalOpen = computed(() => formOpen.value && isFormModalEntity.value)
const isBannerEditorModalOpen = computed(() => formOpen.value && isBannerEntity.value)
const showInlineEditor = computed(() => formOpen.value && !isFormModalEntity.value)
const inlineEditorPlacement = computed(() => config.value?.inlineEditorPlacement || 'bottom')
const slugSourceField = computed(() => {
  if (!formFields.value.includes('slug')) return ''
  if (formFields.value.includes('name')) return 'name'
  if (formFields.value.includes('title')) return 'title'
  return ''
})
const actionConfirmButtonClass = computed(() => (actionConfirmDialog.tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'))
const featuredTableFields = computed(() => config.value?.featuredTableFields || [])
const previewMediaOptions = computed(() => {
  if (!hasMediaFields.value || !mediaOptions.value.length) return []
  if (!isBannerEntity.value) return mediaOptions.value.slice(0, 8)

  const eligible = mediaOptions.value.filter((media) => (isImageMedia(media) || isVideoMediaRecord(media)) && !isNoiseMediaAsset(media))
  const bannerOnly = eligible.filter(isBannerRelatedMedia)
  return bannerOnly.slice(0, 8)
})
const videoLibraryOptions = computed(() => {
  if (!mediaOptions.value.length) return []
  return mediaOptions.value.filter((media) => isVideoMediaRecord(media))
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

function recordDisplayName(record = null) {
  const source = record || form
  return String(
    source?.[config.value?.titleField]
    || source?.title
    || source?.name
    || source?.slug
    || ''
  ).trim()
}

function recordDisplayLabel(record = null) {
  const name = recordDisplayName(record)
  if (name) return name
  const fallbackId = record?.id || editingRecordId.value
  return fallbackId ? `#${fallbackId}` : '#record'
}

function entityLabelForAction(record = null) {
  const configLabel = String(config.value?.label || 'Record').trim()
  const singular = configLabel.endsWith('s') ? configLabel.slice(0, -1) : configLabel
  return recordDisplayName(record) || singular || 'Record'
}

function closeActionConfirmDialog(confirmed = false) {
  actionConfirmDialog.visible = false
  actionConfirmDialog.eyebrow = 'Confirm action'
  actionConfirmDialog.title = ''
  actionConfirmDialog.message = ''
  actionConfirmDialog.confirmText = 'Confirm'
  actionConfirmDialog.tone = 'primary'

  if (actionConfirmResolver) {
    const resolve = actionConfirmResolver
    actionConfirmResolver = null
    resolve(Boolean(confirmed))
  }
}

function openActionConfirmDialog({ eyebrow = 'Confirm action', title, message, confirmText, tone = 'primary' }) {
  if (actionConfirmResolver) {
    actionConfirmResolver(false)
    actionConfirmResolver = null
  }

  actionConfirmDialog.eyebrow = eyebrow
  actionConfirmDialog.title = title
  actionConfirmDialog.message = message
  actionConfirmDialog.confirmText = confirmText
  actionConfirmDialog.tone = tone
  actionConfirmDialog.visible = true

  return new Promise((resolve) => {
    actionConfirmResolver = resolve
  })
}

function cancelActionConfirmDialog() {
  closeActionConfirmDialog(false)
}

function acceptActionConfirmDialog() {
  closeActionConfirmDialog(true)
}

async function confirmRecordAction(action, record = null) {
  const label = entityLabelForAction(record)
  if (action === 'update') {
    return openActionConfirmDialog({
      eyebrow: 'Update record',
      title: `Update ${label}?`,
      message: 'Confirm to save the edited information.',
      confirmText: 'Confirm Update',
      tone: 'primary',
    })
  }

  if (action === 'delete') {
    return openActionConfirmDialog({
      eyebrow: 'Delete record',
      title: `Delete ${label}?`,
      message: 'This action cannot be undone.',
      confirmText: 'Confirm Delete',
      tone: 'danger',
    })
  }

  return true
}

function actionSuccessMessage(action, record = null) {
  const name = recordDisplayName(record)
  if (isBannerEntity.value) {
    if (action === 'create') {
      return name ? `Them banner moi thanh cong: "${name}".` : 'Them banner moi thanh cong.'
    }
    if (action === 'update') {
      return name ? `Cap nhat banner thanh cong: "${name}".` : 'Cap nhat banner thanh cong.'
    }
    if (action === 'delete') {
      return name ? `Xoa banner thanh cong: "${name}".` : 'Xoa banner thanh cong.'
    }
  }

  const label = String(config.value?.label || 'Record').trim()
  if (action === 'create') return `Created ${config.value.label} record.`
  if (action === 'update') return name ? `Updated ${label}: "${name}".` : `Updated ${label} record.`
  if (action === 'delete') return name ? `Deleted ${label}: "${name}".` : `Deleted ${label} record.`
  return 'Completed successfully.'
}

function fieldLabel(field) {
  return config.value?.fieldLabels?.[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function fieldPlaceholder(field) {
  return config.value?.placeholders?.[field] || ''
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

function syncSlugFromSource() {
  if (formMode.value !== 'create') return
  if (!slugSourceField.value || !('slug' in form)) return
  if (slugManuallyEdited.value) return
  form.slug = slugify(form[slugSourceField.value])
}

function handleSlugSourceInput(field) {
  if (field !== slugSourceField.value) return
  syncSlugFromSource()
}

function handleSlugInput() {
  const normalizedSlug = slugify(form.slug)
  form.slug = normalizedSlug
  slugManuallyEdited.value = Boolean(normalizedSlug)

  if (!normalizedSlug) {
    slugManuallyEdited.value = false
    syncSlugFromSource()
  }
}

function fieldHelpText(field) {
  return config.value?.helpText?.[field] || ''
}

function mediaUploadAccept() {
  return config.value?.mediaUploadAccept || 'image/*,video/*,application/pdf'
}

function mediaUploadAssetFolder() {
  return String(config.value?.cloudinaryAssetFolder || '').trim()
}

function mediaUploadPublicIdBase() {
  const seed = uploadTitle.value || form.title || uploadFile.value?.name || ''
  return String(seed)
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function previewPath(record) {
  const resolver = config.value?.preview
  if (!resolver || !record?.id) return ''
  return resolver(record)
}

function previewUrl(record) {
  const path = previewPath(record)
  if (!path) return ''
  return path.startsWith('http') ? path : path
}

function isImageMediaRecord(record) {
  return props.entityKey === 'media_assets' && record?.asset_type === 'image' && record?.url
}

function mediaAssetPreviewUrl(record) {
  return isImageMediaRecord(record) ? resolveMediaUrl(record.url) : ''
}

function mediaAssetLabel(record) {
  return record?.title || record?.file_name || record?.url || '-'
}

function getMediaOptionById(mediaId) {
  return mediaOptions.value.find((item) => String(item.id) === String(mediaId)) || null
}

function selectedMediaAsset(field) {
  return getMediaOptionById(form[field])
}

function selectedMediaPreviewUrl(field) {
  const media = selectedMediaAsset(field)
  return media?.url ? resolveMediaUrl(media.url) : ''
}

function selectedMediaLabel(field) {
  const media = getMediaOptionById(form[field])
  return media ? mediaAssetLabel(media) : 'No media selected'
}

function rowThumbnailUrl(record) {
  if (!isVideosEntity.value) return ''
  return resolveMediaUrl(record?.thumbnail?.url || record?.thumbnail_url || '')
}

function videoPreviewUrl(record) {
  if (!record?.video_url) return ''
  return resolveMediaUrl(record.video_url)
}

function isDirectVideoFile(url) {
  const normalized = String(url || '').trim().toLowerCase()
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/.test(normalized)
}

function isAllowedVideoUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return false

  try {
    const parsed = new URL(normalized)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    return (
      isDirectVideoFile(normalized)
      || /(^|\.)youtube\.com$/i.test(parsed.hostname)
      || /(^|\.)youtu\.be$/i.test(parsed.hostname)
      || /(^|\.)vimeo\.com$/i.test(parsed.hostname)
      || parsed.pathname.includes('/video/')
    )
  } catch {
    return false
  }
}

function videoUrlHint(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (isDirectVideoFile(normalized)) return 'Direct video file detected'
  if (/youtube\.com|youtu\.be/i.test(normalized)) return 'YouTube link detected'
  if (/vimeo\.com/i.test(normalized)) return 'Vimeo link detected'
  return 'External video link detected'
}

function isVideoMediaRecord(record) {
  if (!record) return false
  if (String(record.asset_type || '').toLowerCase() === 'video') return true
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(record.url || '').trim())
}

function isImageMedia(record) {
  return Boolean(record) && !isVideoMediaRecord(record)
}

function mediaSearchText(record) {
  return [
    record?.title,
    record?.file_name,
    record?.alt_text,
    record?.storage_path,
    record?.url,
  ].filter(Boolean).join(' ').toLowerCase()
}

function isNoiseMediaAsset(record) {
  const text = mediaSearchText(record)
  return MEDIA_NOISE_KEYWORDS.some((keyword) => text.includes(keyword))
}

function isBannerRelatedMedia(record) {
  const text = mediaSearchText(record)
  return BANNER_MEDIA_KEYWORDS.some((keyword) => text.includes(keyword))
}

function bannerMediaRecord(record) {
  return record?.image || getMediaOptionById(record?.image_id) || null
}

function bannerFormMediaRecord() {
  return getMediaOptionById(form.image_id)
}

function bannerMediaUrl(record) {
  const media = typeof record === 'object' && 'url' in (record || {}) && 'asset_type' in (record || {})
    ? record
    : bannerMediaRecord(record)

  return media?.url ? resolveMediaUrl(media.url) : ''
}

function bannerMediaAlt(record) {
  const media = typeof record === 'object' && 'url' in (record || {}) && 'asset_type' in (record || {})
    ? record
    : bannerMediaRecord(record)

  return media?.alt_text || media?.title || record?.title || 'Banner media'
}

function bannerTypeLabel(value) {
  const labels = {
    hero: 'Hero',
    cta: 'CTA',
    page: 'Page',
    section: 'Section',
    footer: 'Footer',
  }

  return labels[String(value || '').trim().toLowerCase()] || String(value || 'Banner').trim() || 'Banner'
}

function bannerOrdinal(value) {
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) {
    return String(Math.trunc(numeric)).padStart(2, '0')
  }
  return '00'
}

function bannerAdminLabel(record) {
  if (String(record?.title || '').trim()) {
    return String(record.title).trim()
  }

  return `${bannerTypeLabel(record?.banner_type)} ${bannerOrdinal(record?.sort_order || record?.id)}`
}

function clampBannerFocus(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 50
  return Math.min(100, Math.max(0, numeric))
}

function bannerObjectPositionFromRecord(record) {
  return `${clampBannerFocus(record?.focus_x)}% ${clampBannerFocus(record?.focus_y)}%`
}

function bannerObjectPositionFromForm() {
  return `${clampBannerFocus(form.focus_x)}% ${clampBannerFocus(form.focus_y)}%`
}

function bannerImageStyle(record) {
  return { objectPosition: bannerObjectPositionFromRecord(record) }
}

function bannerFormImageStyle() {
  return { objectPosition: bannerObjectPositionFromForm() }
}

function canAdjustBannerFocus() {
  const media = bannerFormMediaRecord()
  return (
    isBannerEntity.value
    && Boolean(media)
    && Boolean(bannerMediaUrl(media))
    && !isVideoMediaRecord(media)
    && 'focus_x' in form
    && 'focus_y' in form
  )
}

function bannerFocusIndicatorStyle() {
  return {
    left: `${clampBannerFocus(form.focus_x)}%`,
    top: `${clampBannerFocus(form.focus_y)}%`,
  }
}

function applyBannerFocusFromPointer(event) {
  if (!canAdjustBannerFocus()) return
  const card = event.currentTarget
  if (!card || typeof card.getBoundingClientRect !== 'function') return

  const rect = card.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const nextX = ((event.clientX - rect.left) / rect.width) * 100
  const nextY = ((event.clientY - rect.top) / rect.height) * 100

  form.focus_x = clampBannerFocus(nextX)
  form.focus_y = clampBannerFocus(nextY)
}

function startBannerFocusAdjust(event) {
  if (!canAdjustBannerFocus()) return
  bannerFocusDragging.value = true
  applyBannerFocusFromPointer(event)
  event.currentTarget?.setPointerCapture?.(event.pointerId)
}

function onBannerFocusAdjust(event) {
  if (!bannerFocusDragging.value) return
  applyBannerFocusFromPointer(event)
}

function stopBannerFocusAdjust(event) {
  if (!bannerFocusDragging.value) return
  bannerFocusDragging.value = false
  event.currentTarget?.releasePointerCapture?.(event.pointerId)
}

function resetBannerFocus() {
  if (!isBannerEntity.value) return
  form.focus_x = 50
  form.focus_y = 50
}

function inputType(field) {
  if (['sort_order', 'language_id', 'category_id', 'project_id', 'branch_id', 'page_id', 'parent_id', 'block_id', 'entity_id', 'award_year', 'project_year', 'width', 'height', 'size', 'image_id', 'hero_image_id', 'thumbnail_id', 'media_id', 'focus_x', 'focus_y'].includes(field)) {
    return 'number'
  }
  if (field === 'email') return 'email'
  if (field.endsWith('_url') || field === 'url' || field === 'link' || field === 'video_url') return 'url'
  if (field.endsWith('_at')) return 'datetime-local'
  return 'text'
}

function isTextarea(field) {
  return FIELD_GROUPS.content.includes(field) || field === 'meta_description' || field === 'config_value' || field === 'metadata_json'
}

function isBooleanField(field) {
  return field === 'is_active' || field === 'is_primary' || field === 'is_default'
}

function isSelectField(field) {
  return field === 'status' || field === 'asset_type' || field === 'banner_type' || field === 'branch_type' || field === 'contact_type'
}

function selectOptions(field) {
  const options = {
    status: statusOptions.value,
    asset_type: ['image', 'video', 'document', 'file'],
    banner_type: ['hero', 'cta', 'page', 'section', 'footer'],
    branch_type: ['subsidiary', 'branch', 'office'],
    contact_type: ['headquarters', 'branch', 'sales', 'support'],
  }
  return options[field] || []
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' && value.length > 80) return `${value.slice(0, 80)}...`
  return value
}

function normalizeDatetimeForInput(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function setDefaultFormValues(record = {}) {
  Object.keys(form).forEach((key) => delete form[key])

  formFields.value.forEach((field) => {
    if (field in record) {
      form[field] = field.endsWith('_at') ? normalizeDatetimeForInput(record[field]) : record[field]
      return
    }

    if (isBooleanField(field)) {
      form[field] = field === 'is_active'
      return
    }
    if (field === 'status') {
      form[field] = config.value?.defaultStatus || statusOptions.value[0]?.value || 'draft'
      return
    }
    if (field === 'language_id') {
      form[field] = relationOptions.language_id?.[0]?.id || 1
      return
    }
    if (field === 'sort_order') {
      form[field] = 0
      return
    }
    form[field] = ''
  })

  uploadTargetField.value = isBannerEntity.value
    ? 'image_id'
    : config.value?.mediaUploadTargetField || mediaFieldOptions.value[0] || 'image_id'

  if (isBannerEntity.value) {
    form.focus_x = clampBannerFocus(form.focus_x)
    form.focus_y = clampBannerFocus(form.focus_y)
  }

  uploadTitle.value = record?.title || ''
  uploadAltText.value = record?.title || ''
  formErrors.value = []
  slugManuallyEdited.value = Boolean(record?.id && String(record?.slug || '').trim())
}

function cleanPayload() {
  const payload = {}

  formFields.value.forEach((field) => {
    const value = form[field]
    if (value === '') {
      payload[field] = null
      return
    }

    if (field === 'metadata_json' && typeof value === 'string') {
      payload[field] = value.trim() ? JSON.parse(value) : null
      return
    }

    if (inputType(field) === 'number') {
      payload[field] = value === null || value === undefined ? null : Number(value)
      return
    }

    payload[field] = value
  })

  return payload
}

function validateForm() {
  const errors = []
  const requiredFields = config.value?.required || []

  requiredFields.forEach((field) => {
    if (form[field] === null || form[field] === undefined || String(form[field]).trim() === '') {
      errors.push(`${fieldLabel(field)} is required.`)
    }
  })

  if (form.slug && !SLUG_PATTERN.test(String(form.slug))) {
    errors.push('Slug must be lowercase, use numbers or hyphen, and cannot contain spaces.')
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email))) {
    errors.push('Email format is invalid.')
  }

  if (isVideosEntity.value && form.video_url && !isAllowedVideoUrl(form.video_url)) {
    errors.push('Video URL must be a valid http/https direct video link, YouTube URL, or Vimeo URL.')
  }

  formFields.value.forEach((field) => {
    if (inputType(field) === 'number' && form[field] !== '' && form[field] !== null && !Number.isFinite(Number(form[field]))) {
      errors.push(`${fieldLabel(field)} must be a number.`)
    }
  })

  if (form.metadata_json && typeof form.metadata_json === 'string') {
    try {
      JSON.parse(form.metadata_json)
    } catch {
      errors.push('Metadata JSON must be valid JSON.')
    }
  }

  formErrors.value = errors
  return errors.length === 0
}

async function loadRelationOptions() {
  const token = normalizedToken()
  if (!token) return

  Object.keys(relationOptions).forEach((key) => delete relationOptions[key])

  const relationMap = { ...RELATION_ENTITIES }
  relationMap.category_id = props.entityKey === 'posts' ? 'post_categories' : props.entityKey === 'projects' ? 'project_categories' : null
  relationMap.parent_id = props.entityKey === 'pages' ? 'pages' : props.entityKey === 'branches' ? 'branches' : props.entityKey.includes('categor') ? props.entityKey : null

  await Promise.all(
    Object.entries(relationMap)
      .filter(([field, entityName]) => formFields.value.includes(field) && entityName)
      .map(async ([field, entityName]) => {
        const response = await listAdminEntityRecords(entityName, token, { skip: 0, limit: 100 })
        relationOptions[field] = response.items || []
      })
  )
}

async function loadMediaOptions() {
  const token = normalizedToken()
  if (!token || (!hasMediaFields.value && !standaloneUpload.value && !isVideosEntity.value)) return

  const response = await listAdminEntityRecords('media_assets', token, { skip: 0, limit: 100, status: 'active' })
  mediaOptions.value = response.items || []
}

async function loadRecords() {
  const token = normalizedToken()
  if (!token) return

  loading.value = true
  try {
    const query = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchKeyword.value.trim() || undefined,
    }
    if (hasStatusFilter.value && statusFilter.value) {
      query.status = statusFilter.value
    }

    const response = await listAdminEntityRecords(props.entityKey, token, query)
    records.value = response.items || []
    totalRecords.value = response.pagination?.total || 0
  } catch (error) {
    notifyError(error.message || 'Failed to load content records.')
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await loadRelationOptions()
  await loadMediaOptions()
  await loadRecords()
}

async function revealInlineEditor() {
  if (isFormModalEntity.value) return

  await nextTick()

  inlineEditorRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const firstFocusableField = inlineEditorRef.value?.querySelector(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
  )

  firstFocusableField?.focus?.({ preventScroll: true })
}

function openCreateForm() {
  if (!canCreate.value) return
  formMode.value = 'create'
  editingRecordId.value = null
  setDefaultFormValues()
  formOpen.value = true
  void revealInlineEditor()
}

function openEditForm(record) {
  formMode.value = 'edit'
  editingRecordId.value = record.id
  setDefaultFormValues(record)
  if (typeof form.metadata_json === 'object' && form.metadata_json !== null) {
    form.metadata_json = JSON.stringify(form.metadata_json, null, 2)
  }
  formOpen.value = true
  void revealInlineEditor()
}

function closeForm() {
  formOpen.value = false
  editingRecordId.value = null
  formErrors.value = []
}

async function submitForm() {
  const token = normalizedToken()
  if (!token) return

  syncSlugFromSource()
  if (!validateForm()) return

  if (formMode.value === 'edit') {
    const confirmedUpdate = await confirmRecordAction('update')
    if (!confirmedUpdate) return
  }

  saving.value = true
  try {
    const payload = cleanPayload()
    if (formMode.value === 'create') {
      await createAdminEntityRecord(props.entityKey, payload, token)
      notifySuccess(actionSuccessMessage('create'))
      closeForm()
      await loadRecords()
    } else {
      const updatedRecord = await updateAdminEntityRecord(props.entityKey, editingRecordId.value, payload, token)
      records.value = records.value.map((record) => (String(record.id) === String(updatedRecord?.id) ? updatedRecord : record))
      notifySuccess(actionSuccessMessage('update', updatedRecord))
      closeForm()
    }
  } catch (error) {
    notifyError(error.message || 'Failed to save record.')
  } finally {
    saving.value = false
  }
}

async function deleteRecord(record) {
  const token = normalizedToken()
  if (!token) return

  const confirmed = await confirmRecordAction('delete', record)
  if (!confirmed) return

  deletingId.value = record.id
  try {
    await deleteAdminEntityRecord(props.entityKey, record.id, token)
    notifySuccess(actionSuccessMessage('delete', record))
    await loadRecords()
  } catch (error) {
    notifyError(error.message || 'Failed to delete record.')
  } finally {
    deletingId.value = null
  }
}

function handleFileChange(event) {
  uploadFile.value = event.target.files?.[0] || null
}

function handleVideoFileChange(event) {
  videoUploadFile.value = event.target.files?.[0] || null
}

function triggerVideoUpload() {
  if (videoUploadFile.value) {
    uploadVideoFile()
  } else if (videoFileInputRef.value) {
    videoFileInputRef.value.click()
  }
}

async function uploadVideoFile() {
  const token = normalizedToken()
  if (!token || !videoUploadFile.value) {
    notifyError('Choose a video file to upload first.')
    return
  }

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-m4v']
  const file = videoUploadFile.value
  if (!allowedTypes.some((type) => file.type === type) && !/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(file.name)) {
    notifyError('Invalid video file type. Allowed: MP4, WebM, OGG, MOV.')
    return
  }

  videoUploading.value = true
  try {
    const media = await uploadAdminMediaAsset(token, videoUploadFile.value, {
      title: uploadTitle.value || form.title || videoUploadFile.value.name,
      altText: uploadAltText.value || form.title || videoUploadFile.value.name,
      assetFolder: mediaUploadAssetFolder(),
      publicIdBase: mediaUploadPublicIdBase(),
    })
    await loadMediaOptions()
    if (!mediaOptions.value.some((item) => String(item.id) === String(media.id))) {
      mediaOptions.value = [media, ...mediaOptions.value]
    }
    if (isVideosEntity.value && media.url) {
      form.video_url = media.url
    }
    videoUploadFile.value = null
    if (videoFileInputRef.value) {
      videoFileInputRef.value.value = ''
    }
    if (media.storage_backend === 'cloudinary') {
      notifySuccess(`Uploaded video #${media.id} to Cloudinary.`)
    } else if (media.fallback_reason) {
      notifySuccess(`Uploaded video #${media.id} to local storage. Cloudinary was skipped: ${media.fallback_reason}`)
    } else {
      notifySuccess(`Uploaded video #${media.id} to local storage.`)
    }
  } catch (error) {
    notifyError(error.message || 'Failed to upload video.')
  } finally {
    videoUploading.value = false
  }
}

async function uploadMedia() {
  const token = normalizedToken()
  if (!token || !uploadFile.value) {
    notifyError('Choose a file to upload first.')
    return
  }

  uploading.value = true
  try {
    const media = await uploadAdminMediaAsset(token, uploadFile.value, {
      title: uploadTitle.value || form.title,
      altText: uploadAltText.value || form.title,
      assetFolder: mediaUploadAssetFolder(),
      publicIdBase: mediaUploadPublicIdBase(),
    })
    await loadMediaOptions()
    if (!mediaOptions.value.some((item) => String(item.id) === String(media.id))) {
      mediaOptions.value = [media, ...mediaOptions.value]
    }
    if (standaloneUpload.value) {
      await loadRecords()
    } else if (isBannerEntity.value && 'image_id' in form) {
      form.image_id = media.id
    } else if (uploadTargetField.value && uploadTargetField.value in form) {
      form[uploadTargetField.value] = media.id
    }
    uploadFile.value = null
    uploadTitle.value = ''
    uploadAltText.value = ''
    if (media.storage_backend === 'cloudinary') {
      notifySuccess(`Uploaded media #${media.id} to Cloudinary.`)
    } else if (media.fallback_reason) {
      notifySuccess(`Uploaded media #${media.id} to local storage. Cloudinary was skipped: ${media.fallback_reason}`)
    } else {
      notifySuccess(`Uploaded media #${media.id} to local storage.`)
    }
  } catch (error) {
    notifyError(error.message || 'Failed to upload media.')
  } finally {
    uploading.value = false
  }
}

function setPage(page) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

function toggleFormModalBodyLock(locked) {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('form-modal-open', locked)
}

function handleBannerConfirmEsc(event) {
  if (event.key === 'Escape' && actionConfirmDialog.visible) {
    cancelActionConfirmDialog()
  }
}

watch(
  () => props.entityKey,
  async () => {
    currentPage.value = 1
    statusFilter.value = ''
    searchKeyword.value = ''
    closeForm()
    closeActionConfirmDialog(false)
    if (props.active && normalizedToken()) {
      await refreshAll()
    }
  },
  { immediate: true }
)

watch([currentPage, pageSize], () => {
  if (props.active && normalizedToken()) {
    loadRecords()
  }
})

watch(
  () => props.active,
  async (active) => {
    if (active && normalizedToken()) {
      await refreshAll()
    } else {
      closeForm()
      closeActionConfirmDialog(false)
    }
  }
)

watch(
  () => props.token,
  async (value) => {
    if (!String(value || '').trim()) {
      records.value = []
      totalRecords.value = 0
      closeForm()
      closeActionConfirmDialog(false)
      return
    }
    if (props.active) {
      await refreshAll()
    }
  }
)

watch(
  isFormModalOpen,
  (open) => {
    toggleFormModalBodyLock(open)
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  closeActionConfirmDialog(false)
  toggleFormModalBodyLock(false)
  window.removeEventListener('keydown', handleBannerConfirmEsc)
})

onMounted(() => {
  window.addEventListener('keydown', handleBannerConfirmEsc)
  if (props.active && normalizedToken()) {
    refreshAll()
  }
})
</script>

<template>
  <section class="entity-manager">
    <div class="manager-toolbar">
      <div>
        <p class="eyebrow">{{ config.eyebrow }}</p>
        <h2>{{ config.label }}</h2>
        <p class="description">{{ config.description }}</p>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="refreshAll">Refresh</button>
        <button v-if="canCreate" type="button" class="btn btn-primary" @click="openCreateForm">New Record</button>
      </div>
    </div>

    <div class="filters">
      <input v-model="searchKeyword" type="search" :placeholder="`Search ${config.label.toLowerCase()}...`" @keyup.enter="currentPage = 1; loadRecords()" />
      <select v-if="hasStatusFilter" v-model="statusFilter" aria-label="Status filter">
        <option value="">All statuses</option>
        <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.label }}</option>
      </select>
      <button type="button" class="btn btn-secondary" :disabled="loading" @click="currentPage = 1; loadRecords()">Search</button>
    </div>

    <div v-if="standaloneUpload" class="upload-panel">
      <div>
        <p class="eyebrow">Upload Media</p>
        <h3>Media Upload</h3>
      </div>
      <div class="upload-row">
        <input type="file" accept="image/*,video/*,application/pdf" @change="handleFileChange" />
        <input v-model="uploadTitle" type="text" placeholder="Media title" />
        <input v-model="uploadAltText" type="text" placeholder="Alt text" />
        <button type="button" class="btn btn-primary" :disabled="uploading" @click="uploadMedia">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
    </div>

    <div :class="['records-panel', { 'records-panel--after-inline-editor': showInlineEditor && inlineEditorPlacement === 'top' }]">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="column in tableColumns" :key="column">{{ fieldLabel(column) }}</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="table-empty-row">
              <td :colspan="tableColumns.length + 2">Loading records...</td>
            </tr>
            <tr v-else-if="!records.length" class="table-empty-row">
              <td :colspan="tableColumns.length + 2">No records found.</td>
            </tr>
            <tr v-for="record in records" v-else :key="record.id" class="entity-row">
              <td
                v-for="column in tableColumns"
                :key="`${record.id}-${column}`"
                :data-label="fieldLabel(column)"
                :class="{ 'cell-featured': featuredTableFields.includes(column) }"
              >
                <template v-if="isMediaAssetsEntity && column === 'title'">
                  <div class="media-title-cell">
                    <img
                      v-if="isImageMediaRecord(record)"
                      class="media-title-thumb"
                      :src="mediaAssetPreviewUrl(record)"
                      :alt="record.alt_text || mediaAssetLabel(record)"
                      loading="lazy"
                    />
                    <div v-else class="media-title-placeholder">{{ record.asset_type || 'file' }}</div>
                    <span>{{ mediaAssetLabel(record) }}</span>
                  </div>
                </template>
                <template v-else-if="isBannerEntity && column === 'title'">
                  {{ bannerAdminLabel(record) }}
                </template>
                <template v-else-if="isBannerEntity && column === 'image_id'">
                  <div class="banner-media-cell">
                    <template v-if="bannerMediaUrl(record)">
                      <video
                        v-if="isVideoMediaRecord(bannerMediaRecord(record))"
                        :src="bannerMediaUrl(record)"
                        muted
                        playsinline
                        preload="metadata"
                      ></video>
                      <img
                        v-else
                        :src="bannerMediaUrl(record)"
                        :alt="bannerMediaAlt(record)"
                        :style="bannerImageStyle(record)"
                        loading="lazy"
                      />
                    </template>
                    <div v-else class="video-table-thumb-cell__empty">No media</div>
                    <small>#{{ record.image_id || '-' }}</small>
                  </div>
                </template>
                <template v-else-if="isVideosEntity && column === 'thumbnail_id'">
                  <div class="video-table-thumb-cell">
                    <img v-if="rowThumbnailUrl(record)" :src="rowThumbnailUrl(record)" :alt="record.title || 'Video thumbnail'" loading="lazy" />
                    <div v-else class="video-table-thumb-cell__empty">No thumbnail</div>
                    <small>#{{ record.thumbnail_id || '-' }}</small>
                  </div>
                </template>
                <template v-else-if="isVideosEntity && column === 'video_url'">
                  <div class="video-link-cell">
                    <a :href="videoPreviewUrl(record)" target="_blank" rel="noreferrer noopener">{{ formatCell(record[column]) }}</a>
                    <small v-if="videoUrlHint(record[column])">{{ videoUrlHint(record[column]) }}</small>
                  </div>
                </template>
                <template v-else>
                  {{ formatCell(record[column]) }}
                </template>
              </td>
              <td data-label="Preview">
                <template v-if="isBannerEntity">
                  <div class="banner-preview-card">
                    <div class="banner-preview-card__media">
                      <video
                        v-if="bannerMediaUrl(record) && isVideoMediaRecord(bannerMediaRecord(record))"
                        :src="bannerMediaUrl(record)"
                        muted
                        playsinline
                        preload="metadata"
                        autoplay
                        loop
                      ></video>
                      <img
                        v-else-if="bannerMediaUrl(record)"
                        :src="bannerMediaUrl(record)"
                        :alt="bannerMediaAlt(record)"
                        :style="bannerImageStyle(record)"
                        loading="lazy"
                      />
                      <div v-else class="banner-preview-card__empty">No banner media</div>
                      <div class="banner-preview-card__overlay"></div>
                    </div>
                    <div class="banner-preview-card__content">
                      <div class="banner-preview-card__meta">
                        <span>{{ bannerTypeLabel(record.banner_type) }}</span>
                        <strong>{{ bannerOrdinal(record.sort_order || record.id) }}</strong>
                      </div>
                      <h4>{{ bannerAdminLabel(record) }}</h4>
                      <p v-if="record.subtitle">{{ record.subtitle }}</p>
                      <small>{{ record.button_text || record.link || 'No CTA configured' }}</small>
                    </div>
                  </div>
                </template>
                <template v-else-if="isMediaAssetsEntity">
                  <div v-if="isImageMediaRecord(record)" class="media-preview-cell">
                    <a :href="mediaAssetPreviewUrl(record)" target="_blank" rel="noreferrer">
                      <img
                        class="media-preview-thumb"
                        :src="mediaAssetPreviewUrl(record)"
                        :alt="record.alt_text || mediaAssetLabel(record)"
                        loading="lazy"
                      />
                    </a>
                    <a :href="mediaAssetPreviewUrl(record)" target="_blank" rel="noreferrer">Open</a>
                  </div>
                  <a v-else-if="record.url" :href="resolveMediaUrl(record.url)" target="_blank" rel="noreferrer">Open</a>
                  <span v-else>-</span>
                </template>
                <template v-else-if="isVideosEntity">
                  <div class="video-preview-cell">
                    <video v-if="isDirectVideoFile(record.video_url)" class="video-preview-cell__player" :src="videoPreviewUrl(record)" muted playsinline preload="metadata" controls></video>
                    <a v-else-if="record.video_url" :href="videoPreviewUrl(record)" target="_blank" rel="noreferrer noopener">Preview Link</a>
                    <a v-if="previewUrl(record)" :href="previewUrl(record)" target="_blank" rel="noreferrer">Public Page</a>
                  </div>
                </template>
                <template v-else>
                  <a v-if="previewUrl(record)" :href="previewUrl(record)" target="_blank" rel="noreferrer">Open</a>
                  <span v-else>-</span>
                </template>
              </td>
              <td data-label="Actions">
                <div class="row-actions">
                  <button type="button" class="btn btn-secondary" @click="openEditForm(record)">Edit</button>
                  <button type="button" class="btn btn-danger" :disabled="deletingId === record.id" @click="deleteRecord(record)">
                    {{ deletingId === record.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span>{{ totalRecords }} records</span>
        <select v-model.number="pageSize" aria-label="Page size">
          <option :value="10">10 / page</option>
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
        </select>
        <button type="button" class="btn btn-secondary" :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">Prev</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button type="button" class="btn btn-secondary" :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">Next</button>
      </div>
    </div>

    <div
      v-if="formOpen"
      ref="inlineEditorRef"
      :class="[
        'editor-shell',
        {
          'editor-shell--modal': isFormModalEntity,
          'editor-shell--inline-top': showInlineEditor && inlineEditorPlacement === 'top',
        },
      ]"
      @click.self="isFormModalEntity && closeForm()"
    >
      <aside :class="['editor-panel', { 'editor-panel--modal': isFormModalEntity }]">
      <div class="editor-head">
        <div>
          <p class="eyebrow">{{ formMode === 'create' ? 'Create' : 'Edit' }}</p>
          <h3>{{ config.label }}</h3>
        </div>
        <button type="button" class="icon-btn" aria-label="Close editor" @click="closeForm">x</button>
      </div>

      <div v-if="formErrors.length" class="form-errors">
        <p v-for="error in formErrors" :key="error">{{ error }}</p>
      </div>

      <div v-if="hasMediaFields" class="upload-box">
        <div class="upload-box__head">
          <div>
            <p class="eyebrow">Direct upload</p>
            <strong>{{ isVideosEntity ? 'Thumbnail uploader' : 'Media uploader' }}</strong>
            <p class="upload-box__copy">
              {{
                isVideosEntity
                  ? 'Upload the thumbnail directly here and it will be assigned to the Thumbnail field automatically.'
                  : isBannerEntity
                    ? 'Upload banner media here. The uploaded file will be assigned automatically and shown in Live Preview.'
                    : 'Upload media and assign it to the selected form field.'
              }}
            </p>
          </div>
        </div>
        <div class="upload-row">
          <select v-if="!isBannerEntity" v-model="uploadTargetField" aria-label="Upload target field">
            <option v-for="field in mediaFieldOptions" :key="field" :value="field">{{ fieldLabel(field) }}</option>
          </select>
          <input type="file" :accept="mediaUploadAccept()" @change="handleFileChange" />
        </div>
        <div class="upload-row">
          <input v-model="uploadTitle" type="text" placeholder="Media title" />
          <input v-model="uploadAltText" type="text" placeholder="Alt text" />
          <button type="button" class="btn btn-secondary" :disabled="uploading" @click="uploadMedia">
            {{ uploading ? 'Uploading...' : isVideosEntity ? 'Upload Thumbnail' : 'Upload' }}
          </button>
        </div>
      </div>

      <form class="dynamic-form" @submit.prevent="submitForm">
        <label v-for="field in visibleFormFields" :key="field" :class="{ wide: isTextarea(field) || (isVideosEntity && (field === 'video_url' || field === 'thumbnail_id')) }">
          <span>{{ fieldLabel(field) }}</span>

          <input v-if="isBooleanField(field)" v-model="form[field]" type="checkbox" />

          <div v-else-if="FIELD_GROUPS.media.includes(field)" class="field-stack">
            <select v-model.number="form[field]">
              <option :value="null">No media</option>
              <option v-for="media in mediaOptions" :key="media.id" :value="media.id">
                #{{ media.id }} - {{ media.title || media.file_name || media.url }}
              </option>
            </select>
            <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
            <div v-if="selectedMediaPreviewUrl(field)" class="selected-media-preview">
              <video
                v-if="isVideoMediaRecord(selectedMediaAsset(field))"
                :src="selectedMediaPreviewUrl(field)"
                muted
                controls
                playsinline
                preload="metadata"
              ></video>
              <img v-else :src="selectedMediaPreviewUrl(field)" :alt="selectedMediaLabel(field)" loading="lazy" />
              <div>
                <strong>{{ selectedMediaLabel(field) }}</strong>
                <small>#{{ form[field] }}</small>
              </div>
            </div>
          </div>

          <select v-else-if="relationOptions[field]" v-model.number="form[field]">
            <option :value="null">None</option>
            <option v-for="option in relationOptions[field]" :key="option.id" :value="option.id">
              #{{ option.id }} - {{ option.title || option.name || option.slug || option.config_key || option.code }}
            </option>
          </select>

          <select v-else-if="isSelectField(field)" v-model="form[field]">
            <option value="">None</option>
            <option
              v-for="option in selectOptions(field)"
              :key="typeof option === 'string' ? option : option.value"
              :value="typeof option === 'string' ? option : option.value"
            >
              {{ typeof option === 'string' ? option : option.label }}
            </option>
          </select>

          <textarea v-else-if="isTextarea(field)" v-model="form[field]" rows="5" :placeholder="fieldPlaceholder(field)"></textarea>

          <div v-else-if="isVideosEntity && field === 'video_url'" class="field-stack">
            <div class="video-url-section">
              <div class="video-url-row">
                <input v-model="form[field]" :type="inputType(field)" placeholder="https://... or select from library" />
                <button type="button" class="btn btn-secondary" :disabled="videoUploading" @click="uploadVideoFile">
                  {{ videoUploading ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
              <div class="video-file-row">
                <input
                  ref="videoFileInputRef"
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,.mp4,.webm,.ogg,.mov,.m4v"
                  @change="handleVideoFileChange"
                />
                <span class="video-file-row__name">{{ videoUploadFile?.name || 'Chưa chọn file video' }}</span>
              </div>
              <small class="field-help">Chọn file video từ máy tính rồi bấm Upload để tự động đưa link vào Video URL.</small>
              <div class="video-library-select">
                <select @change="form.video_url = $event.target.value; $event.target.value = ''">
                  <option value="">-- Select from Media Library --</option>
                  <option v-for="media in videoLibraryOptions" :key="media.id" :value="media.url">
                    #{{ media.id }} - {{ media.title || media.file_name }}
                  </option>
                </select>
                <small v-if="videoLibraryOptions.length">Or choose from {{ videoLibraryOptions.length }} uploaded videos</small>
              </div>
            </div>
            <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
            <div v-if="form.video_url" class="video-url-helper" :class="{ 'is-valid': isAllowedVideoUrl(form.video_url), 'is-invalid': !isAllowedVideoUrl(form.video_url) }">
              <span>{{ isAllowedVideoUrl(form.video_url) ? 'Valid video source' : 'Invalid video source' }}</span>
              <small>{{ videoUrlHint(form.video_url) || 'Supported: MP4/WebM, YouTube, Vimeo' }}</small>
            </div>
            <video v-if="isDirectVideoFile(form.video_url)" class="video-form-preview" :src="resolveMediaUrl(form.video_url)" muted controls playsinline preload="metadata"></video>
            <a v-else-if="isAllowedVideoUrl(form.video_url)" class="video-form-link" :href="resolveMediaUrl(form.video_url)" target="_blank" rel="noreferrer noopener">Open video source</a>
          </div>

          <input
            v-else
            v-model="form[field]"
            :type="inputType(field)"
            :placeholder="field === 'slug' ? (fieldPlaceholder(field) || 'auto-generated-from-name') : fieldPlaceholder(field)"
            @input="field === 'slug' ? handleSlugInput() : handleSlugSourceInput(field)"
          />

          <small v-if="!FIELD_GROUPS.media.includes(field) && fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
        </label>

        <div v-if="isBannerEntity" class="banner-form-preview">
          <p class="eyebrow">Live Preview</p>
          <div class="banner-preview-card banner-preview-card--editor">
            <div
              class="banner-preview-card__media"
              :class="{ 'banner-preview-card__media--interactive': canAdjustBannerFocus(), 'is-dragging': bannerFocusDragging }"
              @pointerdown="startBannerFocusAdjust"
              @pointermove="onBannerFocusAdjust"
              @pointerup="stopBannerFocusAdjust"
              @pointercancel="stopBannerFocusAdjust"
              @pointerleave="stopBannerFocusAdjust"
            >
              <video
                v-if="bannerMediaUrl(bannerFormMediaRecord()) && isVideoMediaRecord(bannerFormMediaRecord())"
                :src="bannerMediaUrl(bannerFormMediaRecord())"
                muted
                playsinline
                preload="metadata"
                autoplay
                loop
              ></video>
              <img
                v-else-if="bannerMediaUrl(bannerFormMediaRecord())"
                :src="bannerMediaUrl(bannerFormMediaRecord())"
                :alt="bannerMediaAlt(bannerFormMediaRecord())"
                :style="bannerFormImageStyle()"
                loading="lazy"
              />
              <div v-if="canAdjustBannerFocus()" class="banner-focus-indicator" :style="bannerFocusIndicatorStyle()"></div>
              <div v-else class="banner-preview-card__empty">Select or upload banner media</div>
              <div class="banner-preview-card__overlay"></div>
            </div>
            <div class="banner-preview-card__content">
              <div class="banner-preview-card__meta">
                <span>{{ bannerTypeLabel(form.banner_type) }}</span>
                <strong>{{ bannerOrdinal(form.sort_order || editingRecordId || 1) }}</strong>
              </div>
              <h4>{{ form.title || `${bannerTypeLabel(form.banner_type)} ${bannerOrdinal(form.sort_order || editingRecordId || 1)}` }}</h4>
              <p v-if="form.subtitle">{{ form.subtitle }}</p>
              <small>{{ form.button_text || form.link || 'CTA text or link will appear here' }}</small>
            </div>
          </div>
          <div v-if="canAdjustBannerFocus()" class="banner-focus-tools">
            <small>Click or drag directly on preview to choose the visible crop area.</small>
            <div class="banner-focus-tools__row">
              <small>X: {{ Math.round(clampBannerFocus(form.focus_x)) }}% / Y: {{ Math.round(clampBannerFocus(form.focus_y)) }}%</small>
              <button type="button" class="btn btn-secondary" @click="resetBannerFocus">Center</button>
            </div>
          </div>
        </div>

        <div v-if="!isBannerEntity && !isVideosEntity && previewMediaOptions.length" class="media-preview-list">
          <article v-for="media in previewMediaOptions" :key="media.id">
            <img v-if="isImageMedia(media)" :src="resolveMediaUrl(media.url)" :alt="media.alt_text || media.title || ''" />
            <video v-else-if="isVideoMediaRecord(media)" :src="resolveMediaUrl(media.url)" muted playsinline preload="metadata"></video>
            <span v-else>{{ media.asset_type }}</span>
            <small>#{{ media.id }} {{ media.title || media.file_name }}</small>
          </article>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Record' }}</button>
        </div>
      </form>
      </aside>
    </div>

    <transition name="confirm-fade">
      <div
        v-if="actionConfirmDialog.visible"
        class="action-confirm-layer"
        role="presentation"
        @click="cancelActionConfirmDialog"
      >
        <article
          class="action-confirm-card"
          :class="`action-confirm-card--${actionConfirmDialog.tone}`"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-confirm-title"
          @click.stop
        >
          <div class="action-confirm-head">
            <div class="action-confirm-icon">{{ actionConfirmDialog.tone === 'danger' ? '!' : '?' }}</div>
            <div>
              <p class="eyebrow">{{ actionConfirmDialog.eyebrow }}</p>
              <h3 id="action-confirm-title">{{ actionConfirmDialog.title }}</h3>
            </div>
          </div>
          <p class="action-confirm-copy">{{ actionConfirmDialog.message }}</p>
          <div class="action-confirm-actions">
            <button type="button" class="btn btn-secondary" @click="cancelActionConfirmDialog">Cancel</button>
            <button type="button" :class="actionConfirmButtonClass" @click="acceptActionConfirmDialog">
              {{ actionConfirmDialog.confirmText }}
            </button>
          </div>
        </article>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.entity-manager {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.editor-shell {
  display: block;
}

.editor-shell--inline-top {
  order: 3;
}

.editor-shell--modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(8, 22, 38, 0.54);
  backdrop-filter: blur(2px);
}

.action-confirm-layer {
  position: fixed;
  inset: 0;
  z-index: 1450;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(7, 21, 36, 0.5);
  backdrop-filter: blur(4px);
}

.action-confirm-card {
  width: min(460px, calc(100vw - 28px));
  display: grid;
  gap: 12px;
  border-radius: 16px;
  border: 1px solid #d5e2ef;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(247, 251, 255, 0.96));
  box-shadow: 0 28px 56px rgba(7, 22, 38, 0.28);
  padding: 16px;
}

.action-confirm-card--danger {
  border-color: #efc1ca;
}

.action-confirm-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-confirm-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  color: #27557a;
  background: linear-gradient(135deg, rgba(39, 158, 208, 0.22), rgba(39, 158, 208, 0.08));
  border: 1px solid rgba(39, 158, 208, 0.28);
}

.action-confirm-card--danger .action-confirm-icon {
  color: #a33447;
  background: linear-gradient(135deg, rgba(239, 188, 197, 0.34), rgba(255, 240, 242, 0.74));
  border-color: rgba(210, 97, 120, 0.34);
}

.action-confirm-copy {
  margin: 0;
  color: #496582;
  font-size: 14px;
  line-height: 1.5;
}

.action-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.manager-toolbar,
.filters,
.records-panel,
.editor-panel,
.upload-panel {
  border: 1px solid #d8e3f0;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 24px rgba(29, 55, 86, 0.08);
}

.manager-toolbar,
.upload-panel {
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #647891;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

h2,
h3 {
  margin: 0;
  color: #1f3850;
}

.description {
  margin: 6px 0 0;
  color: #5b738d;
  font-size: 13px;
}

.toolbar-actions,
.filters,
.pagination,
.row-actions,
.form-actions,
.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filters {
  border-radius: 8px;
  padding: 10px;
}

.records-panel--after-inline-editor {
  order: 4;
}

input,
select,
textarea {
  min-height: 38px;
  border: 1px solid #c8d8ea;
  border-radius: 8px;
  padding: 8px 10px;
  color: #1f3850;
  background: #fff;
  font: inherit;
}

textarea {
  resize: vertical;
}

.filters input {
  flex: 1;
  min-width: 240px;
}

.btn,
.icon-btn {
  border-radius: 8px;
  border: 1px solid transparent;
  min-height: 38px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
}

.btn-primary {
  background: #279ed0;
  border-color: #1f90bf;
  color: #fff;
}

.btn-secondary {
  background: #f2f6fb;
  border-color: #c8d8ea;
  color: #31506f;
}

.btn-danger {
  background: #fff0f2;
  border-color: #efbcc5;
  color: #a33447;
}

button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.records-panel {
  border-radius: 8px;
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

th,
td {
  border-bottom: 1px solid #e1eaf4;
  padding: 10px;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
}

.table-empty-row td {
  text-align: center;
}

th {
  background: #f2f6fb;
  color: #4c6480;
  font-size: 12px;
  text-transform: uppercase;
}

td a {
  color: #167aa6;
  font-weight: 700;
}

.cell-featured {
  background: linear-gradient(180deg, rgba(39, 158, 208, 0.05), rgba(39, 158, 208, 0.01));
}

.media-title-cell,
.media-preview-cell,
.banner-media-cell,
.banner-preview-card,
.video-preview-cell,
.video-table-thumb-cell,
.video-link-cell,
.field-stack,
.banner-form-preview,
.selected-media-preview {
  display: grid;
  gap: 6px;
}

.media-title-cell {
  grid-template-columns: 68px minmax(120px, 1fr);
  align-items: center;
}

.media-title-thumb,
.media-preview-thumb,
.banner-media-cell img,
.banner-media-cell video,
.video-preview-cell__poster,
.selected-media-preview video,
.video-table-thumb-cell img,
.selected-media-preview img {
  width: 68px;
  height: 52px;
  object-fit: cover;
  border-radius: 6px;
  background: #edf3fa;
  border: 1px solid #d8e3f0;
}

.media-title-placeholder,
.video-table-thumb-cell__empty {
  width: 68px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #edf3fa;
  border: 1px solid #d8e3f0;
  color: #607893;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
}

.media-title-cell span {
  overflow-wrap: anywhere;
}

.media-preview-cell,
.banner-media-cell,
.video-preview-cell,
.video-table-thumb-cell {
  align-content: start;
}

.video-preview-cell__player,
.video-form-preview {
  width: min(240px, 100%);
  border-radius: 10px;
  overflow: hidden;
  background: #09131f;
  border: 1px solid #d8e3f0;
  box-shadow: 0 10px 24px rgba(20, 39, 58, 0.08);
}

.video-link-cell a,
.video-form-link {
  overflow-wrap: anywhere;
}

.video-link-cell small,
.video-table-thumb-cell small,
.field-help,
.video-url-helper small,
.selected-media-preview small {
  color: #607893;
  font-size: 11px;
}

.field-stack {
  gap: 8px;
}

.video-url-section {
  display: grid;
  gap: 8px;
}

.video-url-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.video-url-row > :first-child {
  flex: 1;
  min-width: 200px;
}

.video-url-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.video-url-actions input[type='file'] {
  display: none;
}

.video-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.video-file-row input[type='file'] {
  flex: 0 1 auto;
}

.video-file-row__name {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #d8e3f0;
  background: #f8fbff;
  color: #4b647f;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.video-library-select {
  display: grid;
  gap: 4px;
}

.video-library-select select {
  width: 100%;
}

.selected-media-preview {
  grid-template-columns: 68px minmax(0, 1fr);
  align-items: center;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid #dbe7f2;
  background: #f8fbff;
}

.selected-media-preview img {
  width: 100%;
  height: 62px;
}

.selected-media-preview video {
  width: 100%;
  height: 62px;
}

.banner-media-cell video {
  background: #09131f;
}

.banner-form-preview {
  grid-column: 1 / -1;
}

.banner-preview-card {
  position: relative;
  min-width: 220px;
  min-height: 132px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(212, 224, 239, 0.95);
  background: linear-gradient(135deg, #071122, #11294a);
  box-shadow: 0 16px 32px rgba(11, 27, 44, 0.14);
}

.banner-preview-card--editor {
  min-height: 220px;
}

.banner-preview-card__media,
.banner-preview-card__media img,
.banner-preview-card__media video,
.banner-preview-card__overlay {
  position: absolute;
  inset: 0;
}

.banner-preview-card__media--interactive {
  cursor: crosshair;
  touch-action: none;
}

.banner-preview-card__media--interactive.is-dragging {
  cursor: grabbing;
}

.banner-preview-card__media img,
.banner-preview-card__media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-preview-card__media video {
  background: #09131f;
}

.banner-preview-card__overlay {
  background:
    linear-gradient(180deg, rgba(2, 9, 19, 0.22) 0%, rgba(2, 10, 23, 0.16) 22%, rgba(2, 10, 23, 0.42) 100%),
    radial-gradient(circle at 72% 22%, rgba(38, 115, 208, 0.26) 0%, rgba(38, 115, 208, 0) 38%);
  pointer-events: none;
}

.banner-focus-indicator {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 3px rgba(225, 0, 18, 0.5), 0 8px 20px rgba(0, 0, 0, 0.25);
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
}

.banner-focus-tools {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.banner-focus-tools small {
  color: #607893;
  font-size: 11px;
}

.banner-focus-tools__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.banner-preview-card__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(238, 245, 255, 0.84);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  z-index: 1;
}

.banner-preview-card__content {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 8px;
  align-content: end;
  min-height: inherit;
  padding: 16px;
  color: #f5f8fd;
  pointer-events: none;
}

.banner-preview-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.banner-preview-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: rgba(255, 233, 205, 0.94);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.banner-preview-card__meta strong {
  color: #ff4459;
  font-size: 22px;
  line-height: 1;
}

.banner-preview-card__content h4,
.banner-preview-card__content p,
.banner-preview-card__content small {
  margin: 0;
}

.banner-preview-card__content h4 {
  font-size: 18px;
  line-height: 1.15;
}

.banner-preview-card__content p {
  color: rgba(242, 247, 255, 0.86);
  font-size: 12px;
  line-height: 1.45;
}

.banner-preview-card__content small {
  color: rgba(255, 221, 179, 0.92);
  font-size: 11px;
  font-weight: 700;
}

.video-url-helper {
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d8e3f0;
  background: #f8fbff;
  color: #31506f;
}

.video-url-helper.is-valid {
  border-color: rgba(38, 153, 114, 0.3);
  background: rgba(38, 153, 114, 0.08);
  color: #176347;
}

.video-url-helper.is-invalid {
  border-color: rgba(187, 70, 92, 0.28);
  background: rgba(255, 240, 242, 0.9);
  color: #9d2f42;
}

.pagination {
  justify-content: flex-end;
  padding: 10px;
  color: #5a718b;
}

.editor-panel {
  border-radius: 8px;
  padding: 14px;
}

.editor-panel--modal {
  width: min(1160px, calc(100vw - 32px));
  max-height: calc(100vh - 28px);
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 24px 48px rgba(7, 21, 36, 0.24);
}

.editor-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.icon-btn {
  width: 38px;
  padding: 0;
  background: #f5f8fc;
  border-color: #cddbea;
  color: #32506e;
}

.form-errors {
  background: #fff0f2;
  border: 1px solid #efbcc5;
  border-radius: 8px;
  color: #9d2f42;
  padding: 8px 10px;
  margin-bottom: 10px;
}

.form-errors p {
  margin: 2px 0;
}

.upload-panel {
  align-items: center;
}

.upload-box {
  border: 1px dashed #a8c8e6;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  display: grid;
  gap: 8px;
  background: #f8fbff;
}

.upload-box__copy {
  margin: 4px 0 0;
  color: #607893;
  font-size: 12px;
}

.dynamic-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dynamic-form label {
  display: grid;
  gap: 5px;
  color: #445d77;
  font-size: 12px;
  font-weight: 700;
}

.dynamic-form label.wide,
.media-preview-list,
.form-actions {
  grid-column: 1 / -1;
}

.dynamic-form input[type='checkbox'] {
  width: 20px;
  min-height: 20px;
}

.media-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.media-preview-list article {
  border: 1px solid #d8e3f0;
  border-radius: 8px;
  background: #fff;
  min-height: 116px;
  padding: 6px;
  display: grid;
  gap: 5px;
  align-content: start;
}

.media-preview-list img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  background: #edf3fa;
}

.media-preview-list video {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  background: #09131f;
}

.media-preview-list span {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  background: #edf3fa;
  color: #607893;
}

.media-preview-list small {
  color: #607893;
  overflow-wrap: anywhere;
}

.form-actions {
  justify-content: flex-end;
  padding-top: 4px;
}

@media (max-width: 1024px) {
  .manager-toolbar,
  .upload-panel {
    flex-direction: column;
    padding: 12px;
  }

  .toolbar-actions {
    width: 100%;
  }
}

@media (max-width: 860px) {
  .toolbar-actions > *,
  .filters > *,
  .upload-row > * {
    width: 100%;
  }

  .dynamic-form {
    grid-template-columns: 1fr;
  }

  .selected-media-preview {
    grid-template-columns: 1fr;
  }

  .banner-preview-card {
    min-width: 0;
  }

  .video-preview-cell__player,
  .video-form-preview {
    width: 100%;
  }

  .row-actions {
    justify-content: flex-start;
  }

  .editor-shell--modal {
    padding: 10px;
    place-items: end center;
  }

  .editor-panel--modal {
    max-height: calc(100vh - 20px);
  }

  .pagination {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .table-wrap {
    overflow: visible;
  }

  table {
    min-width: 0;
  }

  thead {
    display: none;
  }

  tbody {
    display: grid;
    gap: 10px;
    padding: 10px;
  }

  .entity-row {
    display: block;
    border: 1px solid #d8e3f0;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  .entity-row td {
    display: grid;
    grid-template-columns: minmax(110px, 38%) minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    border-bottom: 1px dashed #e2ebf5;
    padding: 10px 12px;
  }

  .entity-row td:last-child {
    border-bottom: 0;
  }

  .entity-row td::before {
    content: attr(data-label);
    color: #607893;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    line-height: 1.4;
    padding-top: 2px;
  }

  .table-empty-row {
    display: block;
  }

  .table-empty-row td {
    display: block;
    text-align: center;
    border: 1px solid #d8e3f0;
    border-radius: 10px;
    background: #fff;
    padding: 14px 12px;
  }

  .table-empty-row td::before {
    content: none;
  }

  .banner-preview-card {
    min-width: 0;
  }

  .row-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}

@media (max-width: 560px) {
  .manager-toolbar,
  .filters,
  .pagination,
  .editor-panel,
  .upload-panel {
    padding: 10px;
  }

  .editor-head,
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .entity-row td {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .pagination > * {
    width: 100%;
  }

  .action-confirm-card,
  .editor-panel--modal {
    width: min(calc(100vw - 16px), 100%);
  }
}

:global(body.form-modal-open) {
  overflow: hidden;
}
</style>
