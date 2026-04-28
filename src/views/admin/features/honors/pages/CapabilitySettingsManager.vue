<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

import { env } from '@/shared/config/env'
import CoreConfirmDialog from '@/views/admin/shared/components/CoreConfirmDialog.vue'
import {
  createAdminEntityRecord,
  importAdminMediaAssetFromUrl,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/views/admin/shared/api/adminApi.js'

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

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const SETTING_META = {
  capability_hero_title: {
    group_name: 'capability',
    description: 'Tiêu đề hero module Năng lực',
  },
  capability_hero_subtitle: {
    group_name: 'capability',
    description: 'Mô tả ngắn hero module Năng lực',
  },
  capability_hero_background_image_url: {
    group_name: 'capability',
    description: 'Ảnh nền desktop hero module Năng lực',
  },
  capability_seal_text: {
    group_name: 'capability',
    description: 'Nội dung badge seal của hero module Năng lực',
  },
  capability_seal_image_url: {
    group_name: 'capability',
    description: 'Ảnh badge seal của hero module Năng lực',
  },
  capability_hero_is_active: {
    group_name: 'capability',
    description: 'Trạng thái hiển thị hero module Năng lực',
  },
  capability_hero_banners_json: {
    group_name: 'capability',
    description: 'JSON danh sách các banner trượt (Hero slider)',
  },
  capability_hero_banners_version: {
    group_name: 'capability',
    description: 'Version cache-busting cho banner trượt module Năng lực',
  },
  capability_factory_overview_title: {
    group_name: 'capability',
    description: 'Tiêu đề section tổng quan nhà máy',
  },
  factory_name: {
    group_name: 'capability',
    description: 'Tên nhà máy hiển thị trên module Năng lực',
  },
  factory_address: {
    group_name: 'capability',
    description: 'Địa chỉ nhà máy hiển thị trên module Năng lực',
  },
  factory_location: {
    group_name: 'capability',
    description: 'Nhãn vị trí nhà máy',
  },
  factory_overview_description: {
    group_name: 'capability',
    description: 'Mô tả tổng quan nhà máy',
  },
  factory_technology: {
    group_name: 'capability',
    description: 'Thông tin công nghệ sản xuất',
  },
  machinery_process: {
    group_name: 'capability',
    description: 'Thông tin máy móc và quy trình',
  },
  factory_capacity: {
    group_name: 'capability',
    description: 'Thông tin công suất sản xuất',
  },
  factory_output_description: {
    group_name: 'capability',
    description: 'Mô tả đầu ra / năng lực cung ứng',
  },
  factory_main_image_url: {
    group_name: 'capability',
    description: 'Ảnh chính section tổng quan nhà máy',
  },
  factory_stats_json: {
    group_name: 'capability',
    description: 'JSON thống kê nhà máy',
  },
  production_capabilities_json: {
    group_name: 'capability',
    description: 'JSON các thẻ năng lực sản xuất',
  },
  capability_factory_gallery_json: {
    group_name: 'capability',
    description: 'JSON gallery ảnh nhà máy cho module Năng lực',
  },
}

const HIDDEN_FACTORY_STATS_LABELS = new Set(['Dây chuyền sản xuất', 'Chứng nhận', 'Chứng nhận quốc tế'])

const defaultFactoryStats = () => [
  { label: 'Diện tích nhà máy', value: '' },
  { label: 'Công suất mỗi năm', value: '' },
]

const defaultHeroBanners = () => [
  {
    title: 'NĂNG LỰC',
    subtitle: 'Hình ảnh nhà máy, công nghệ sản xuất, công suất thực tế và các chứng nhận tiêu chuẩn.',
    background_image_url: '',
    is_active: true,
  },
]

const defaultProductionCards = () => [
  {
    title: 'Dây chuyền sản xuất hiện đại',
    description: '',
    icon: 'factory',
    sort_order: 0,
    is_active: true,
  },
  {
    title: 'Máy móc tự động',
    description: '',
    icon: 'cog',
    sort_order: 1,
    is_active: true,
  },
]

const defaultGallery = () => [
  {
    id: 'factory-gallery-1',
    title: 'Hình ảnh nhà máy 1',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  },
  {
    id: 'factory-gallery-2',
    title: 'Hình ảnh nhà máy 2',
    description: '',
    image_url: '',
    sort_order: 1,
    is_active: true,
  },
]

const loading = ref(false)
const saving = ref(false)
const existingSettings = ref([])
const lastLoadedAt = ref('')
const activeSection = ref('hero')
const imageUploadStates = reactive({})
const confirmDialog = reactive({
  visible: false,
  tone: 'primary',
  eyebrow: 'Xác nhận thao tác',
  title: 'Bạn có chắc chắn muốn tiếp tục?',
  message: '',
  confirmText: 'Xác nhận',
})
let confirmDialogResolver = null

const form = reactive({
  capability_hero_is_active: true,
  hero_banners: defaultHeroBanners(),
  capability_factory_overview_title: 'Tổng quan nhà máy',
  factory_name: '',
  factory_address: '',
  factory_location: 'Location',
  factory_overview_description: '',
  factory_technology: '',
  machinery_process: '',
  factory_capacity: '',
  factory_output_description: '',
  factory_main_image_url: '',
  factory_stats: defaultFactoryStats(),
  production_capabilities: defaultProductionCards(),
  factory_gallery: defaultGallery(),
})

const listEditorState = reactive({
  stats: {},
  production: {},
  gallery: {},
  banners: {},
})

const hasUnsavedListEdits = computed(() => (
  Object.values(listEditorState).some((bucket) =>
    Object.values(bucket || {}).some((entry) => entry?.editing),
  ) || itemModal.visible
))

const itemModal = reactive({
  visible: false,
  type: '', // 'stats' | 'production' | 'gallery'
  item: null,
  index: -1,
  isNew: false,
  title: '',
})

const galleryBatchUploadState = reactive({
  uploading: false,
  total: 0,
  completed: 0,
  source: '',
})

const galleryBatchInputRef = ref(null)
const galleryFolderInputRef = ref(null)



function normalizedToken() {
  return String(props.token || '').trim()
}

const MAX_FACTORY_OVERVIEW_THUMBS = 4

function normalizeText(value) {
  return String(value || '').trim()
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

function closeConfirmDialog(result = false) {
  confirmDialog.visible = false
  if (typeof confirmDialogResolver === 'function') {
    confirmDialogResolver(Boolean(result))
    confirmDialogResolver = null
  }
}

function askForConfirmation(options = {}) {
  const {
    tone = 'primary',
    eyebrow = 'Xác nhận thao tác',
    title = 'Bạn có chắc chắn muốn tiếp tục?',
    message = 'Thao tác sẽ được thực thi ngay sau khi bạn xác nhận.',
    confirmText = 'Xác nhận',
  } = options

  if (typeof confirmDialogResolver === 'function') {
    confirmDialogResolver(false)
    confirmDialogResolver = null
  }

  confirmDialog.tone = tone === 'danger' ? 'danger' : 'primary'
  confirmDialog.eyebrow = String(eyebrow || 'Xác nhận thao tác')
  confirmDialog.title = String(title || 'Bạn có chắc chắn muốn tiếp tục?')
  confirmDialog.message = String(message || 'Thao tác sẽ được thực thi ngay sau khi bạn xác nhận.')
  confirmDialog.confirmText = String(confirmText || 'Xác nhận')
  confirmDialog.visible = true

  return new Promise((resolve) => {
    confirmDialogResolver = resolve
  })
}

function acceptConfirmDialog() {
  closeConfirmDialog(true)
}

function cancelConfirmDialog() {
  closeConfirmDialog(false)
}

function createImageUploadState() {
  return {
    mode: 'file',
    file: null,
    sourceUrl: '',
    previewUrl: '',
    uploading: false,
    storageBackend: '',
    fallbackReason: '',
  }
}

function ensureImageUploadState(key) {
  const normalizedKey = normalizeText(key)
  if (!normalizedKey) {
    return createImageUploadState()
  }
  if (!imageUploadStates[normalizedKey]) {
    imageUploadStates[normalizedKey] = createImageUploadState()
  }
  return imageUploadStates[normalizedKey]
}

function revokePreviewUrl(url) {
  if (typeof URL === 'undefined') return
  if (String(url || '').startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

function resolvePreviewUrl(url) {
  const normalized = normalizeText(url)
  if (!normalized) return ''
  if (
    /^https?:\/\//i.test(normalized)
    || normalized.startsWith('blob:')
    || normalized.startsWith('data:')
  ) {
    return normalized
  }
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

function imageUploadKey(fieldKey) {
  return `capability-image:${normalizeText(fieldKey)}`
}

function galleryImageUploadKey(item, index) {
  return `capability-gallery:${normalizeText(item?.id) || index}`
}

function bannerImageUploadKey(item, index, type = 'pc') {
  return `capability-banner-${type}:${index}`
}

function imagePreviewSource(key, currentValue = '') {
  const state = ensureImageUploadState(key)
  return resolvePreviewUrl(state.previewUrl || currentValue)
}

function imageUploadMode(key) {
  return ensureImageUploadState(key).mode
}

function imageUploadStateMeta(key) {
  return ensureImageUploadState(key)
}

function imageActionLabel(key) {
  const state = ensureImageUploadState(key)
  if (state.uploading) {
    return state.mode === 'url' ? 'Đang import...' : 'Đang tải lên...'
  }
  return state.mode === 'url' ? 'Import từ URL' : 'Tải ảnh lên'
}

function setImageUploadMode(key, mode, currentValue = '') {
  const state = ensureImageUploadState(key)
  const nextMode = mode === 'url' ? 'url' : 'file'
  state.mode = nextMode
  state.file = null
  state.storageBackend = ''
  state.fallbackReason = ''

  revokePreviewUrl(state.previewUrl)

  if (nextMode === 'url') {
    state.previewUrl = normalizeText(state.sourceUrl) || normalizeText(currentValue)
  } else {
    state.sourceUrl = ''
    state.previewUrl = ''
  }
}

function onSelectImageFile(key, event) {
  const state = ensureImageUploadState(key)
  const file = event.target.files?.[0] || null
  state.mode = 'file'
  state.file = file
  state.sourceUrl = ''
  state.storageBackend = ''
  state.fallbackReason = ''
  revokePreviewUrl(state.previewUrl)
  state.previewUrl = file && typeof URL !== 'undefined' ? URL.createObjectURL(file) : ''
}

function onChangeImageUrl(key, value) {
  const state = ensureImageUploadState(key)
  state.mode = 'url'
  state.file = null
  state.sourceUrl = normalizeText(value)
  state.storageBackend = ''
  state.fallbackReason = ''
  revokePreviewUrl(state.previewUrl)
  state.previewUrl = state.sourceUrl
}

async function submitImageAsset({
  key,
  currentValue = '',
  assetFolder,
  publicIdBase,
  title,
  altText,
  onSuccess,
}) {
  const token = normalizedToken()
  if (!token) return false

  const state = ensureImageUploadState(key)
  const metadata = {
    title: normalizeText(title) || 'capability-image',
    altText: normalizeText(altText) || normalizeText(title) || 'capability-image',
    assetFolder,
    publicIdBase,
  }

  state.uploading = true
  state.storageBackend = ''
  state.fallbackReason = ''

  try {
    let media = null

    if (state.mode === 'url') {
      if (!normalizeText(state.sourceUrl)) {
        notifyError('Vui lòng nhập URL ảnh trước khi import.')
        return false
      }
      media = await importAdminMediaAssetFromUrl(token, {
        source_url: normalizeText(state.sourceUrl),
        title: metadata.title,
        alt_text: metadata.altText,
        asset_folder: metadata.assetFolder,
        public_id_base: metadata.publicIdBase,
      })
    } else {
      if (!state.file) {
        notifyError('Vui lòng chọn file ảnh trước khi tải lên.')
        return false
      }
      media = await uploadAdminMediaAsset(token, state.file, metadata)
    }

    const nextUrl = normalizeText(media?.url)
    onSuccess(nextUrl)

    revokePreviewUrl(state.previewUrl)
    state.mode = 'url'
    state.file = null
    state.sourceUrl = nextUrl
    state.previewUrl = nextUrl
    state.storageBackend = String(media?.storage_backend || '').toLowerCase()
    state.fallbackReason = String(media?.fallback_reason || '')

    if (state.storageBackend === 'cloudinary') {
      notifySuccess('Đã tải ảnh lên Cloudinary và gán vào cấu hình.')
    } else if (state.fallbackReason) {
      notifySuccess(`Đã gán ảnh vào cấu hình. Cloudinary bị bỏ qua: ${state.fallbackReason}`)
    } else {
      notifySuccess('Đã tải ảnh và gán vào cấu hình thành công.')
    }

    return true
  } catch (error) {
    notifyError(error.message || 'Không thể tải ảnh cho cấu hình này.')
    return false
  } finally {
    state.uploading = false
  }
}

function uploadImageForField(fieldKey, options = {}) {
  const key = imageUploadKey(fieldKey)
  return submitImageAsset({
    key,
    currentValue: form[fieldKey],
    assetFolder: options.assetFolder,
    publicIdBase: options.publicIdBase,
    title: options.title,
    altText: options.altText,
    onSuccess: (url) => {
      form[fieldKey] = url
    },
  })
}

function uploadGalleryImage(item, index) {
  const key = galleryImageUploadKey(item, index)
  return submitImageAsset({
    key,
    currentValue: item.image_url,
    assetFolder: 'capability/gallery',
    publicIdBase: normalizeText(item.title) || `factory-gallery-${index + 1}`,
    title: normalizeText(item.title) || `Hình ảnh nhà máy ${index + 1}`,
    altText: normalizeText(item.description) || normalizeText(item.title) || `Hình ảnh nhà máy ${index + 1}`,
    onSuccess: (url) => {
      item.image_url = url
    },
  })
}

function uploadBannerImage() {
  if (!itemModal.item) {
    notifyError('Không tìm thấy dữ liệu banner để tải ảnh lên.')
    return false
  }

  const key = bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')
  const bannerTitle = normalizeText(itemModal.item.title) || `banner-${itemModal.index + 1}`

  return submitImageAsset({
    key,
    currentValue: itemModal.item.background_image_url,
    assetFolder: 'capability/hero',
    publicIdBase: `${bannerTitle}-desktop`,
    title: `${bannerTitle} desktop`,
    altText: normalizeText(itemModal.item.subtitle) || bannerTitle,
    onSuccess: (url) => {
      itemModal.item.background_image_url = url
    },
  })
}

function hasPendingBannerImageUpload() {
  if (!itemModal.item || itemModal.type !== 'banners') {
    return false
  }

  const state = imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'))
  if (state.file) {
    return true
  }

  if (state.mode === 'url' && normalizeText(state.sourceUrl) && normalizeText(state.sourceUrl) !== normalizeText(itemModal.item.background_image_url)) {
    return true
  }

  return false
}

function hasPendingFieldImageUpload(fieldKey, currentValue = '') {
  const state = imageUploadStateMeta(imageUploadKey(fieldKey))
  if (state.file) {
    return true
  }

  return state.mode === 'url'
    && normalizeText(state.sourceUrl)
    && normalizeText(state.sourceUrl) !== normalizeText(currentValue)
}

function hasPendingGalleryItemUpload(item, index) {
  const state = imageUploadStateMeta(galleryImageUploadKey(item, index))
  if (state.file) {
    return true
  }

  return state.mode === 'url'
    && normalizeText(state.sourceUrl)
    && normalizeText(state.sourceUrl) !== normalizeText(item?.image_url)
}

async function flushPendingOverviewUploads() {
  if (hasPendingFieldImageUpload('factory_main_image_url', form.factory_main_image_url)) {
    const uploadedMainImage = await uploadImageForField('factory_main_image_url', {
      assetFolder: 'capability/factory',
      publicIdBase: normalizeText(form.factory_name) || 'factory-overview',
      title: normalizeText(form.factory_name) || 'Factory overview',
      altText: normalizeText(form.factory_name) || 'Factory overview',
    })

    if (!uploadedMainImage) {
      throw new Error('Không thể tải ảnh lớn chính của tổng quan nhà máy trước khi lưu.')
    }
  }

  for (const [index, item] of form.factory_gallery.entries()) {
    if (!hasPendingGalleryItemUpload(item, index)) {
      continue
    }

    const uploadedGalleryImage = await uploadGalleryImage(item, index)
    if (!uploadedGalleryImage) {
      throw new Error(`Không thể tải ảnh gallery #${index + 1} trước khi lưu.`)
    }
  }
}

function resetGalleryBatchUploadState() {
  galleryBatchUploadState.uploading = false
  galleryBatchUploadState.total = 0
  galleryBatchUploadState.completed = 0
  galleryBatchUploadState.source = ''
}

function normalizeGalleryTitleFromFileName(fileName = '', fallbackIndex = 0) {
  const baseName = String(fileName || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return baseName || `Hình ảnh nhà máy ${fallbackIndex + 1}`
}

function buildGalleryIdFromFileName(fileName = '', fallbackIndex = 0) {
  const slug = String(fileName || '')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug ? `factory-gallery-${slug}` : `factory-gallery-${Date.now()}-${fallbackIndex + 1}`
}

function createGalleryItemFromUpload(file, url, index) {
  const title = normalizeGalleryTitleFromFileName(file?.name, index)
  return {
    id: buildGalleryIdFromFileName(file?.name, index),
    title,
    description: '',
    image_url: normalizeText(url),
    sort_order: form.factory_gallery.length + index,
    is_active: true,
  }
}

function openGalleryBatchPicker() {
  galleryBatchInputRef.value?.click()
}

function openGalleryFolderPicker() {
  galleryFolderInputRef.value?.click()
}

async function uploadGalleryBatchFiles(fileList, sourceLabel = 'nhiều ảnh') {
  const token = normalizedToken()
  if (!token) return

  const availableSlots = Math.max(MAX_FACTORY_OVERVIEW_THUMBS - form.factory_gallery.length, 0)
  if (!availableSlots) {
    notifyError(`Gallery overview chỉ cho phép tối đa ${MAX_FACTORY_OVERVIEW_THUMBS} ảnh nhỏ.`)
    return
  }

  const files = Array.from(fileList || []).filter((file) => String(file?.type || '').startsWith('image/'))
  if (!files.length) {
    notifyError('Không tìm thấy file ảnh hợp lệ để tải lên.')
    return
  }

  const limitedFiles = files.slice(0, availableSlots)
  if (limitedFiles.length < files.length) {
    notifySuccess(`Chỉ lấy ${limitedFiles.length}/${files.length} ảnh đầu tiên vì gallery overview tối đa ${MAX_FACTORY_OVERVIEW_THUMBS} ảnh nhỏ.`)
  }

  galleryBatchUploadState.uploading = true
  galleryBatchUploadState.total = limitedFiles.length
  galleryBatchUploadState.completed = 0
  galleryBatchUploadState.source = sourceLabel

  const uploadedItems = []

  try {
    for (const [index, file] of limitedFiles.entries()) {
      const media = await uploadAdminMediaAsset(token, file, {
        title: normalizeGalleryTitleFromFileName(file.name, index),
        altText: normalizeGalleryTitleFromFileName(file.name, index),
        assetFolder: 'capability/gallery',
        publicIdBase: buildGalleryIdFromFileName(file.name, index),
      })

      uploadedItems.push(createGalleryItemFromUpload(file, media?.url, index))
      galleryBatchUploadState.completed = index + 1
    }

    form.factory_gallery.push(...uploadedItems)
    reindexListCollection('gallery')
    notifySuccess(`Đã tải ${uploadedItems.length} ảnh từ ${sourceLabel}. Hãy bấm "Lưu section này" để lưu cấu hình.`)
  } catch (error) {
    notifyError(error.message || 'Không thể tải ảnh hàng loạt cho gallery.')
  } finally {
    resetGalleryBatchUploadState()
  }
}

async function onSelectGalleryBatchFiles(event) {
  const files = event?.target?.files || []
  await uploadGalleryBatchFiles(files, 'danh sách ảnh')
  if (event?.target) {
    event.target.value = ''
  }
}

async function onSelectGalleryFolder(event) {
  const files = event?.target?.files || []
  await uploadGalleryBatchFiles(files, 'thư mục')
  if (event?.target) {
    event.target.value = ''
  }
}

function cloneListItem(item) {
  return JSON.parse(JSON.stringify(item || {}))
}

function getListEditorBucket(type) {
  return listEditorState[type] || {}
}

function listItemEditKey(type, item, index) {
  if (type === 'gallery') {
    return normalizeText(item?.id) || `gallery-${index}`
  }
  return `${type}-${index}`
}

function isEditingListItem(type, item, index) {
  return Boolean(getListEditorBucket(type)[listItemEditKey(type, item, index)]?.editing)
}

function beginListItemEdit(type, item, index, options = {}) {
  const key = listItemEditKey(type, item, index)
  getListEditorBucket(type)[key] = {
    editing: true,
    isNew: Boolean(options.isNew),
    snapshot: options.snapshot === null ? null : cloneListItem(options.snapshot || item),
  }
}

function clearListItemEdit(type, item, index) {
  const key = listItemEditKey(type, item, index)
  delete getListEditorBucket(type)[key]
}

function listCollectionByType(type) {
  if (type === 'stats') return form.factory_stats
  if (type === 'production') return form.production_capabilities
  if (type === 'banners') return form.hero_banners
  return form.factory_gallery
}

function reindexListCollection(type) {
  const collection = listCollectionByType(type)
  if (!Array.isArray(collection)) return

  if (type === 'production' || type === 'gallery' || type === 'banners') {
    collection.forEach((item, index) => {
      item.sort_order = index
    })
  }
}

function listTypeMeta(type) {
  if (type === 'stats') {
    return {
      singular: 'chỉ số',
      plural: 'danh sách chỉ số',
      block: 'block thống kê',
      validate: (item) => normalizeText(item?.label) && normalizeText(item?.value),
      restore: (target, snapshot) => {
        target.label = normalizeText(snapshot?.label)
        target.value = normalizeText(snapshot?.value)
      },
      createDuplicate: (item) => ({
        label: normalizeText(item?.label) ? `${normalizeText(item.label)} (bản sao)` : '',
        value: normalizeText(item?.value),
      }),
    }
  }

  if (type === 'production') {
    return {
      singular: 'card năng lực',
      plural: 'danh sách card năng lực',
      block: 'block năng lực sản xuất',
      validate: (item) => normalizeText(item?.title) || normalizeText(item?.description),
      restore: (target, snapshot) => {
        target.title = normalizeText(snapshot?.title)
        target.description = normalizeText(snapshot?.description)
        target.icon = normalizeText(snapshot?.icon || 'factory') || 'factory'
        target.sort_order = Number.isFinite(Number(snapshot?.sort_order)) ? Number(snapshot.sort_order) : 0
        target.is_active = Boolean(snapshot?.is_active)
      },
      createDuplicate: (item, index) => ({
        title: normalizeText(item?.title) ? `${normalizeText(item.title)} (bản sao)` : '',
        description: normalizeText(item?.description),
        icon: normalizeText(item?.icon || 'factory') || 'factory',
        sort_order: index + 1,
        is_active: Boolean(item?.is_active),
      }),
    }
  }

  if (type === 'banners') {
    return {
      singular: 'banner',
      plural: 'danh sách banner',
      block: 'block hero slider',
      validate: (item) => normalizeText(item?.background_image_url),
      restore: (target, snapshot) => {
        target.title = normalizeText(snapshot?.title)
        target.subtitle = normalizeText(snapshot?.subtitle)
        target.background_image_url = normalizeText(snapshot?.background_image_url)
        target.is_active = Boolean(snapshot?.is_active)
      },
      createDuplicate: (item) => ({
        ...cloneListItem(item),
        title: normalizeText(item?.title) ? `${normalizeText(item.title)} (bản sao)` : '',
      }),
    }
  }

  // Default: gallery
  return {
    singular: 'ảnh gallery',
    plural: 'danh sách ảnh gallery',
    block: 'block gallery',
    validate: (item) => normalizeText(item?.title) && normalizeText(item?.image_url),
    restore: (target, snapshot) => {
      target.id = normalizeText(snapshot?.id)
      target.title = normalizeText(snapshot?.title)
      target.description = normalizeText(snapshot?.description)
      target.image_url = normalizeText(snapshot?.image_url)
      target.sort_order = Number.isFinite(Number(snapshot?.sort_order)) ? Number(snapshot.sort_order) : 0
      target.is_active = Boolean(snapshot?.is_active)
    },
    createDuplicate: (item, index) => ({
      id: `${normalizeText(item?.id || `factory-gallery-${index + 1}`)}-copy-${Date.now()}`,
      title: normalizeText(item?.title) ? `${normalizeText(item.title)} (bản sao)` : `Hình ảnh nhà máy ${index + 2}`,
      description: normalizeText(item?.description),
      image_url: normalizeText(item?.image_url),
      sort_order: index + 1,
      is_active: Boolean(item?.is_active),
    }),
  }
}

async function ensureNoUnsavedListEdits(nextActionLabel = 'thao tác này') {
  if (!hasUnsavedListEdits.value) return true

  return askForConfirmation({
    tone: 'danger',
    eyebrow: 'Có thay đổi chưa lưu',
    title: 'Bạn vẫn còn item đang chỉnh sửa',
    message: `Nếu tiếp tục ${nextActionLabel}, các item đang ở chế độ chỉnh sửa có thể mất thay đổi chưa được lưu xuống DB.`,
    confirmText: 'Vẫn tiếp tục',
  })
}

async function duplicateListItem(type, item, index) {
  const meta = listTypeMeta(type)
  const confirmed = await askForConfirmation({
    eyebrow: 'Nhân bản item',
    title: `Xác nhận nhân bản ${meta.singular}?`,
    message: `Một bản sao mới sẽ được tạo trong ${meta.block} và chuyển ngay sang chế độ chỉnh sửa.`,
    confirmText: 'Nhân bản',
  })
  if (!confirmed) return

  const collection = listCollectionByType(type)
  const newItem = meta.createDuplicate(item, index)
  collection.splice(index + 1, 0, newItem)
  reindexListCollection(type)
  beginListItemEdit(type, newItem, index + 1, { isNew: true, snapshot: null })
  notifySuccess(`Đã nhân bản ${meta.singular} thành công.`)
}

async function moveListItem(type, index, direction) {
  const collection = listCollectionByType(type)
  const nextIndex = direction === 'up' ? index - 1 : index + 1
  if (nextIndex < 0 || nextIndex >= collection.length) return

  const meta = listTypeMeta(type)
  const directionLabel = direction === 'up' ? 'lên trên' : 'xuống dưới'
  const confirmed = await askForConfirmation({
    eyebrow: 'Sắp xếp item',
    title: `Xác nhận di chuyển ${meta.singular}?`,
    message: `${meta.singular.charAt(0).toUpperCase() + meta.singular.slice(1)} sẽ được chuyển ${directionLabel} trong ${meta.block}.`,
    confirmText: 'Di chuyển',
  })
  if (!confirmed) return

  const [movedItem] = collection.splice(index, 1)
  collection.splice(nextIndex, 0, movedItem)
  reindexListCollection(type)
  notifySuccess(`Đã di chuyển ${meta.singular} ${directionLabel}.`)
}


async function editListItem(type, item, index) {
  const meta = listTypeMeta(type)
  
  itemModal.type = type
  itemModal.index = index
  itemModal.item = cloneListItem(item)
  itemModal.isNew = false
  itemModal.title = `Chỉnh sửa ${meta.singular}`
  itemModal.visible = true
}

function closeItemModal() {
  itemModal.visible = false
  itemModal.item = null
}

async function saveModalItem() {
  const { type, index, item } = itemModal
  const meta = listTypeMeta(type)

  if (type === 'banners' && hasPendingBannerImageUpload()) {
    const uploaded = await uploadBannerImage()
    if (!uploaded) {
      notifyError('Không thể tải ảnh banner mới lên. Vui lòng kiểm tra lại file hoặc URL ảnh.')
      return
    }
  }

  if (!meta.validate(item)) {
    const message = type === 'banners'
      ? 'Vui lòng tải ảnh banner lên thành công trước khi lưu.'
      : `Vui lòng nhập đầy đủ thông tin bắt buộc trước khi lưu ${meta.singular}.`
    notifyError(message)
    return
  }

  const confirmed = await askForConfirmation({
    eyebrow: 'Lưu thay đổi',
    title: `Xác nhận lưu ${meta.singular}?`,
    message: `Các thay đổi sẽ được áp dụng vào danh sách và lưu xuống hệ thống.`,
    confirmText: 'Lưu',
  })
  if (!confirmed) return

  const collection = listCollectionByType(type)
  if (itemModal.isNew) {
    collection.push(item)
  } else {
    collection[index] = item
  }

  reindexListCollection(type)
  closeItemModal()

  await persistCapabilitySettings(`Đã lưu ${meta.singular} thành công.`)
}

async function cancelListItemEdit(type, item, index) {
  const bucket = getListEditorBucket(type)
  const key = listItemEditKey(type, item, index)
  const entry = bucket[key]
  if (!entry?.editing) return

  const meta = listTypeMeta(type)
  const confirmed = await askForConfirmation({
    tone: 'danger',
    eyebrow: 'Hủy chỉnh sửa',
    title: `Xác nhận hủy chỉnh sửa ${meta.singular}?`,
    message: entry.isNew
      ? `${meta.singular.charAt(0).toUpperCase() + meta.singular.slice(1)} mới sẽ bị loại bỏ khỏi ${meta.block}.`
      : `Các thay đổi chưa lưu của ${meta.singular} này sẽ bị hoàn tác.`,
    confirmText: 'Hủy',
  })
  if (!confirmed) return

  const collection = listCollectionByType(type)
  if (entry.isNew) {
    collection.splice(index, 1)
  } else if (entry.snapshot) {
    listTypeMeta(type).restore(item, entry.snapshot)
  }

  clearListItemEdit(type, item, index)
  notifySuccess(`Đã hủy chỉnh sửa ${meta.singular}.`)
}

async function saveListItem(type, item, index) {
  const meta = listTypeMeta(type)
  if (!meta.validate(item)) {
    notifyError(`Vui lòng nhập đầy đủ thông tin bắt buộc trước khi lưu ${meta.singular}.`)
    return
  }

  const confirmed = await askForConfirmation({
    eyebrow: 'Lưu item',
    title: `Xác nhận lưu ${meta.singular}?`,
    message: `Các thay đổi của ${meta.singular} này sẽ được lưu thật xuống DB trong ${meta.block}.`,
    confirmText: 'Lưu item',
  })
  if (!confirmed) return

  const saved = await persistCapabilitySettings(`Đã lưu ${meta.singular} xuống DB thành công.`)
  if (saved) {
    clearListItemEdit(type, item, index)
  }
}

function handleBeforeUnload(event) {
  if (!hasUnsavedListEdits.value) return
  event.preventDefault()
  event.returnValue = ''
}

watch(
  hasUnsavedListEdits,
  (value) => {
    if (typeof window === 'undefined') return
    if (value) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('beforeunload', handleBeforeUnload)
})


function resetForm() {
  Object.assign(form, {
    capability_hero_is_active: true,
    hero_banners: defaultHeroBanners(),
    capability_factory_overview_title: 'Tổng quan nhà máy',
    factory_name: '',
    factory_address: '',
    factory_location: 'Location',
    factory_overview_description: '',
    factory_technology: '',
    machinery_process: '',
    factory_capacity: '',
    factory_output_description: '',
    factory_main_image_url: '',
    factory_stats: defaultFactoryStats(),
    production_capabilities: defaultProductionCards(),
    factory_gallery: defaultGallery(),
  })
}

function parseBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (value === null || value === undefined || value === '') return fallback
  const normalized = String(value).trim().toLowerCase()
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false
  return fallback
}

function sanitizeFactoryStats(items = []) {
  return items
    .filter((item) => !HIDDEN_FACTORY_STATS_LABELS.has(normalizeText(item?.label)))
    .slice(0, 2)
}

function parseJsonArray(rawValue, fallbackFactory) {
  if (!normalizeText(rawValue)) {
    return fallbackFactory()
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed) ? parsed : fallbackFactory()
  } catch {
    return fallbackFactory()
  }
}

function toStatsPayload(items = []) {
  return sanitizeFactoryStats(items)
    .map((item) => ({
      label: normalizeText(item?.label),
      value: normalizeText(item?.value),
    }))
    .filter((item) => item.label || item.value)
}

function toCapabilitiesPayload(items = []) {
  return items
    .map((item, index) => ({
      title: normalizeText(item?.title),
      description: normalizeText(item?.description),
      icon: normalizeText(item?.icon || 'factory') || 'factory',
      sort_order: Number.isFinite(Number(item?.sort_order))
        ? Number(item.sort_order)
        : index,
      is_active: Boolean(item?.is_active),
    }))
    .filter((item) => item.title || item.description)
}

function toGalleryPayload(items = []) {
  return items
    .map((item) => ({
      id: normalizeText(item?.id),
      title: normalizeText(item?.title),
      description: normalizeText(item?.description),
      image_url: normalizeText(item?.image_url),
      sort_order: Number(item?.sort_order || 0),
      is_active: Boolean(item?.is_active),
    }))
    .filter((item) => item.image_url)
}

function toBannersPayload(items = []) {
  return items
    .map((item) => ({
      title: normalizeText(item?.title),
      subtitle: normalizeText(item?.subtitle),
      background_image_url: normalizeText(item?.background_image_url),
      is_active: Boolean(item?.is_active),
    }))
    .filter((item) => item.background_image_url)
}

function applySettingsToForm(records = []) {
  resetForm()
  records.forEach((record) => {
    const key = record.config_key
    const value = record.config_value

    if (key === 'capability_hero_is_active') {
      form.capability_hero_is_active = parseBoolean(value)
    } else if (key === 'factory_stats_json') {
      form.factory_stats = sanitizeFactoryStats(parseJsonArray(value, defaultFactoryStats))
    } else if (key === 'production_capabilities_json') {
      form.production_capabilities = parseJsonArray(value, defaultProductionCards)
    } else if (key === 'capability_factory_gallery_json') {
      form.factory_gallery = parseJsonArray(value, defaultGallery)
    } else if (key === 'capability_hero_banners_json') {
      form.hero_banners = parseJsonArray(value, defaultHeroBanners)
    } else if (Object.prototype.hasOwnProperty.call(form, key)) {
      form[key] = value
    }
  })
}

async function loadCapabilitySettings() {
  const token = normalizedToken()
  if (!token || !props.active) return

  loading.value = true
  clearNotify()

  try {
    const items = []
    let skip = 0
    const limit = 100
    let total = Number.POSITIVE_INFINITY

    while (skip < total) {
      const response = await listAdminEntityRecords('site_settings', token, {
        skip,
        limit,
      })
      const batch = response.items || []
      total = Number(response.pagination?.total || batch.length)
      items.push(...batch)
      if (!batch.length || batch.length < limit) {
        break
      }
      skip += limit
    }

    const capabilityItems = items.filter((item) => {
      const key = normalizeText(item.config_key)
      return Object.prototype.hasOwnProperty.call(SETTING_META, key)
    })

    existingSettings.value = capabilityItems
    applySettingsToForm(capabilityItems)
    lastLoadedAt.value = new Date().toLocaleString('vi-VN')
  } catch (error) {
    notifyError(error.message || 'Không thể tải cấu hình module Năng lực.')
  } finally {
    loading.value = false
  }
}

async function addFactoryStat() {
  const meta = listTypeMeta('stats')
  itemModal.type = 'stats'
  itemModal.index = form.factory_stats.length
  itemModal.item = { label: '', value: '' }
  itemModal.isNew = true
  itemModal.title = `Thêm ${meta.singular} mới`
  itemModal.visible = true
}

async function addHeroBanner() {
  const meta = listTypeMeta('banners')
  itemModal.type = 'banners'
  itemModal.index = form.hero_banners.length
  itemModal.item = {
    title: '',
    subtitle: '',
    background_image_url: '',
    is_active: true,
  }
  itemModal.isNew = true
  itemModal.title = `Thêm ${meta.singular} mới`
  itemModal.visible = true
}

async function removeHeroBanner(index) {
  const item = form.hero_banners[index]
  const itemLabel = normalizeText(item?.title) || `Banner ${index + 1}`
  const confirmed = await askForConfirmation({
    tone: 'danger',
    eyebrow: 'Xóa banner',
    title: 'Xác nhận xóa banner?',
    message: `${itemLabel} sẽ bị xóa khỏi hero slider.`,
    confirmText: 'Xóa banner',
  })
  if (!confirmed) return

  form.hero_banners.splice(index, 1)
  notifySuccess(`Đã xóa ${itemLabel.toLowerCase()} khỏi hero slider.`)
}

async function removeFactoryStat(index) {
  const item = form.factory_stats[index]
  const itemLabel = normalizeText(item?.label) || `Chỉ số ${index + 1}`
  const confirmed = await askForConfirmation({
    tone: 'danger',
    eyebrow: 'Xóa chỉ số',
    title: 'Xác nhận xóa chỉ số?',
    message: `${itemLabel} sẽ bị xóa khỏi block thống kê nhà máy.`,
    confirmText: 'Xóa chỉ số',
  })
  if (!confirmed) return

  form.factory_stats.splice(index, 1)
  clearListItemEdit('stats', item, index)
  notifySuccess(`Đã xóa ${itemLabel.toLowerCase()} khỏi block thống kê.`)
}

async function addCapabilityCard() {
  const meta = listTypeMeta('production')
  itemModal.type = 'production'
  itemModal.index = form.production_capabilities.length
  itemModal.item = {
    title: '',
    description: '',
    icon: 'factory',
    sort_order: form.production_capabilities.length,
    is_active: true,
  }
  itemModal.isNew = true
  itemModal.title = `Thêm ${meta.singular} mới`
  itemModal.visible = true
}

async function removeCapabilityCard(index) {
  const item = form.production_capabilities[index]
  const itemLabel = normalizeText(item?.title) || `Card ${index + 1}`
  const confirmed = await askForConfirmation({
    tone: 'danger',
    eyebrow: 'Xóa card năng lực',
    title: 'Xác nhận xóa card năng lực?',
    message: `${itemLabel} sẽ bị xóa khỏi block năng lực sản xuất.`,
    confirmText: 'Xóa card',
  })
  if (!confirmed) return

  form.production_capabilities.splice(index, 1)
  clearListItemEdit('production', item, index)
  notifySuccess(`Đã xóa ${itemLabel.toLowerCase()} khỏi block năng lực sản xuất.`)
}

async function addGalleryItem() {
  if (form.factory_gallery.length >= MAX_FACTORY_OVERVIEW_THUMBS) {
    notifyError(`Gallery overview chỉ cho phép tối đa ${MAX_FACTORY_OVERVIEW_THUMBS} ảnh nhỏ.`)
    return
  }

  const meta = listTypeMeta('gallery')
  itemModal.type = 'gallery'
  itemModal.index = form.factory_gallery.length
  itemModal.item = {
    id: `factory-gallery-${Date.now()}`,
    title: `Hình ảnh nhà máy ${form.factory_gallery.length + 1}`,
    description: '',
    image_url: '',
    sort_order: form.factory_gallery.length,
    is_active: true,
  }
  itemModal.isNew = true
  itemModal.title = `Thêm ${meta.singular} mới`
  itemModal.visible = true
}

async function removeGalleryItem(index) {
  const item = form.factory_gallery[index]
  const itemLabel = normalizeText(item?.title) || `Ảnh ${index + 1}`
  const confirmed = await askForConfirmation({
    tone: 'danger',
    eyebrow: 'Xóa ảnh gallery',
    title: 'Xác nhận xóa ảnh khỏi gallery?',
    message: `${itemLabel} sẽ bị xóa khỏi block gallery nhà máy.`,
    confirmText: 'Xóa ảnh',
  })
  if (!confirmed) return

  form.factory_gallery.splice(index, 1)
  clearListItemEdit('gallery', item, index)
  notifySuccess(`Đã xóa ${itemLabel.toLowerCase()} khỏi block gallery.`)
}

function validateBeforeSave() {
  const errors = []

  if (!normalizeText(form.capability_factory_overview_title)) {
    errors.push('Tiêu đề tổng quan nhà máy không được để trống.')
  }

  if (!form.hero_banners.some(b => b.is_active && normalizeText(b.background_image_url))) {
    errors.push('Cần ít nhất 1 banner được kích hoạt.')
  }

  if (!normalizeText(form.factory_name)) {
    errors.push('Tên nhà máy không được để trống.')
  }

  if (form.factory_gallery.length > MAX_FACTORY_OVERVIEW_THUMBS) {
    errors.push(`Gallery overview chỉ cho phép tối đa ${MAX_FACTORY_OVERVIEW_THUMBS} ảnh nhỏ.`)
  }

  const hasMainGalleryImage = form.factory_gallery.some((item) =>
    normalizeText(item.image_url),
  )
  if (!hasMainGalleryImage && !normalizeText(form.factory_main_image_url)) {
    errors.push('Cần ít nhất 1 ảnh chính hoặc 1 ảnh trong gallery nhà máy.')
  }

  if (errors.length) {
    throw new Error(errors.join(' '))
  }
}

function buildPayloadMap() {
  const heroBannersVersion = new Date().toISOString()

  return {
    capability_hero_is_active: form.capability_hero_is_active ? 'true' : 'false',
    capability_hero_banners_json: JSON.stringify(toBannersPayload(form.hero_banners), null, 2),
    capability_hero_banners_version: heroBannersVersion,
    capability_factory_overview_title: normalizeText(
      form.capability_factory_overview_title,
    ),
    factory_name: normalizeText(form.factory_name),
    factory_address: normalizeText(form.factory_address),
    factory_location: normalizeText(form.factory_location),
    factory_overview_description: normalizeText(form.factory_overview_description),
    factory_technology: normalizeText(form.factory_technology),
    machinery_process: normalizeText(form.machinery_process),
    factory_capacity: normalizeText(form.factory_capacity),
    factory_output_description: normalizeText(form.factory_output_description),
    factory_main_image_url: normalizeText(form.factory_main_image_url),
    factory_stats_json: JSON.stringify(toStatsPayload(form.factory_stats), null, 2),
    production_capabilities_json: JSON.stringify(
      toCapabilitiesPayload(form.production_capabilities),
      null,
      2,
    ),
    capability_factory_gallery_json: JSON.stringify(
      toGalleryPayload(form.factory_gallery),
      null,
      2,
    ),
  }
}

async function persistCapabilitySettings(successMessage) {
  const token = normalizedToken()
  if (!token) return false

  saving.value = true
  clearNotify()

  try {
    await flushPendingOverviewUploads()
    validateBeforeSave()

    const payloadMap = buildPayloadMap()
    const existingMap = new Map(
      existingSettings.value.map((record) => [record.config_key, record]),
    )

    for (const [configKey, configValue] of Object.entries(payloadMap)) {
      const metadata = SETTING_META[configKey] || {
        group_name: 'capability',
        description: 'Cấu hình module Năng lực',
      }
      const existing = existingMap.get(configKey)
      const body = {
        config_key: configKey,
        config_value: configValue,
        group_name: metadata.group_name,
        description: metadata.description,
      }

      if (existing?.id) {
        await updateAdminEntityRecord('site_settings', existing.id, body, token)
      } else {
        await createAdminEntityRecord('site_settings', body, token)
      }
    }

    // We don't necessarily need to reload everything if we just updated site_settings
    // but we update the existingSettings to match the new state
    // await loadCapabilitySettings()
    notifySuccess(
      successMessage
      || 'Đã lưu cấu hình module Năng lực thành công. Dữ liệu public và admin đã được đồng bộ từ site_settings.',
    )
    return true
  } catch (error) {
    notifyError(error.message || 'Không thể lưu cấu hình module Năng lực.')
    return false
  } finally {
    saving.value = false
  }
}

async function saveCapabilitySettings() {
  const confirmed = await askForConfirmation({
    eyebrow: 'Lưu toàn bộ cấu hình',
    title: 'Xác nhận lưu toàn bộ page Năng lực?',
    message: 'Toàn bộ các block của page Năng lực sẽ được ghi xuống site_settings và đồng bộ ra trang public.',
    confirmText: 'Lưu toàn bộ',
  })
  if (!confirmed) return

  await persistCapabilitySettings(
    'Đã lưu toàn bộ cấu hình page Năng lực thành công. Dữ liệu public và admin đã được đồng bộ từ site_settings.',
  )
}

async function saveCapabilitySection(sectionKey) {
  const section = capabilitySections.value.find((item) => item.key === sectionKey)
  const sectionTitle = section?.title || 'section này'
  const confirmed = await askForConfirmation({
    eyebrow: 'Lưu block cấu hình',
    title: `Xác nhận lưu ${sectionTitle}?`,
    message: `Các thay đổi trong block ${sectionTitle.toLowerCase()} sẽ được ghi xuống site_settings.`,
    confirmText: 'Lưu block',
  })
  if (!confirmed) return

  await persistCapabilitySettings(`Đã lưu thành công block ${sectionTitle.toLowerCase()}.`)
}


async function openSection(key) {
  if (activeSection.value === key) return
  const canContinue = await ensureNoUnsavedListEdits('mở section khác')
  if (!canContinue) return
  activeSection.value = key
}

async function toggleSection(key) {
  const canContinue = await ensureNoUnsavedListEdits(
    activeSection.value === key ? 'thu gọn section này' : 'mở section này',
  )
  if (!canContinue) return
  activeSection.value = activeSection.value === key ? '' : key
}


function openPreview(path) {
  if (typeof window === 'undefined') return
  const target = new URL(path, window.location.origin)
  window.open(target.toString(), '_blank', 'noopener,noreferrer')
}

const summaryCards = computed(() => {
  const activeGallery = form.factory_gallery.filter(
    (item) => normalizeText(item.image_url) && item.is_active,
  ).length
  const activeCapabilities = form.production_capabilities.filter(
    (item) => (normalizeText(item.title) || normalizeText(item.description)) && item.is_active,
  ).length
  const activeStats = sanitizeFactoryStats(form.factory_stats).filter(
    (item) => normalizeText(item.label) && normalizeText(item.value),
  ).length

  return [
    {
      key: 'gallery',
      label: 'Ảnh gallery đang dùng',
      value: activeGallery,
      hint: 'Hiển thị ở tab Hình ảnh nhà máy',
    },
    {
      key: 'production',
      label: 'Thẻ năng lực sản xuất',
      value: activeCapabilities,
      hint: 'Render ở section công nghệ & năng lực',
    },
    {
      key: 'stats',
      label: 'Chỉ số tổng quan',
      value: activeStats,
      hint: 'Render thành cụm stat trong overview',
    },
  ]
})

const overviewMetricCards = computed(() => {
  const fallbackCards = [
    {
      value: '20,000',
      unit: 'm²',
      label: 'Diện tích nhà máy',
      icon: Building2,
    },
    {
      value: '500+',
      unit: '',
      label: 'Nhân sự có kinh nghiệm',
      icon: Users,
    },
  ]
  const stats = sanitizeFactoryStats(form.factory_stats)
  return stats.length >= 2 ? stats.slice(0, 2) : fallbackCards
})

function sectionCompletion(sectionKey) {
  if (sectionKey === 'hero') {
    const score = form.hero_banners.filter(b => b.is_active && b.background_image_url).length
    if (score >= 1) return 'complete'
    return 'empty'
  }

  if (sectionKey === 'overview') {
    const score = [
      normalizeText(form.capability_factory_overview_title),
      normalizeText(form.factory_name),
      normalizeText(form.factory_address),
      normalizeText(form.factory_overview_description),
      normalizeText(form.factory_main_image_url),
    ].filter(Boolean).length
    if (score >= 4) return 'complete'
    if (score >= 1) return 'partial'
    return 'empty'
  }

  if (sectionKey === 'stats') {
    const total = sanitizeFactoryStats(form.factory_stats).filter(
      (item) => normalizeText(item.label) && normalizeText(item.value),
    ).length
    if (total >= 2) return 'complete'
    if (total >= 1) return 'partial'
    return 'empty'
  }

  if (sectionKey === 'production') {
    const total = form.production_capabilities.filter(
      (item) => (normalizeText(item.title) || normalizeText(item.description)) && item.is_active,
    ).length
    if (total >= 2) return 'complete'
    if (total >= 1) return 'partial'
    return 'empty'
  }

  if (sectionKey === 'gallery') {
    const total = form.factory_gallery.filter(
      (item) => normalizeText(item.image_url) && item.is_active,
    ).length
    if (total >= 2) return 'complete'
    if (total >= 1) return 'partial'
    return 'empty'
  }

  return 'empty'
}

function sectionStatusMeta(sectionKey) {
  const state = sectionCompletion(sectionKey)
  if (state === 'complete') {
    return { label: 'Đã sẵn sàng', tone: 'success' }
  }
  if (state === 'partial') {
    return { label: 'Đang bổ sung', tone: 'warning' }
  }
  return { label: 'Chưa có dữ liệu', tone: 'muted' }
}

function firstNonEmptyGalleryImage() {
  return form.factory_gallery.find((item) => normalizeText(item.image_url) && item.is_active)?.image_url || ''
}

function previewImageForSection(sectionKey) {
  if (sectionKey === 'hero') {
    return normalizeText(form.hero_banners[0]?.background_image_url)
      || firstNonEmptyGalleryImage()
  }

  if (sectionKey === 'overview') {
    return normalizeText(form.factory_main_image_url) || firstNonEmptyGalleryImage()
  }

  if (sectionKey === 'gallery') {
    return firstNonEmptyGalleryImage() || normalizeText(form.factory_main_image_url)
  }

  return normalizeText(form.factory_main_image_url)
    || firstNonEmptyGalleryImage()
}

function previewCaptionForSection(sectionKey) {
  if (sectionKey === 'hero') {
    return normalizeText(form.hero_banners[0]?.title) || 'Hero slider'
  }
  if (sectionKey === 'overview') {
    return normalizeText(form.factory_name) || 'Factory overview'
  }
  if (sectionKey === 'stats') {
    return `${summaryCards.value.find((item) => item.key === 'stats')?.value || 0} stats`
  }
  if (sectionKey === 'production') {
    return `${summaryCards.value.find((item) => item.key === 'production')?.value || 0} cards`
  }
  return `${summaryCards.value.find((item) => item.key === 'gallery')?.value || 0} images`
}

function previewMetricForSection(sectionKey) {
  if (sectionKey === 'hero') {
    return form.capability_hero_is_active ? 'Hero bật' : 'Hero tắt'
  }
  if (sectionKey === 'overview') {
    return normalizeText(form.factory_address) || 'Chưa có địa chỉ'
  }
  if (sectionKey === 'stats') {
    return `${summaryCards.value.find((item) => item.key === 'stats')?.value || 0} chỉ số`
  }
  if (sectionKey === 'hero') {
    return `${form.hero_banners.length} banner`
  }
  return `${summaryCards.value.find((item) => item.key === 'gallery')?.value || 0} ảnh hoạt động`
}

function isListSection(sectionKey) {
  return ['hero', 'stats', 'production'].includes(sectionKey)
}

function listSectionCount(sectionKey) {
  if (sectionKey === 'hero') return form.hero_banners.length
  if (sectionKey === 'stats') return form.factory_stats.length
  if (sectionKey === 'production') return form.production_capabilities.length
  return 0
}

function listSectionEditingCount(sectionKey) {
  const bucket = listEditorState[sectionKey] || {}
  return Object.values(bucket).filter((entry) => entry?.editing).length
}

function listSectionAddLabel(sectionKey) {
  if (sectionKey === 'hero') return 'Thêm banner'
  if (sectionKey === 'stats') return 'Thêm chỉ số'
  if (sectionKey === 'production') return 'Thêm card'
  return 'Thêm item'
}

async function addListItemFromSection(sectionKey) {
  if (sectionKey === 'hero') {
    await addHeroBanner()
    return
  }
  if (sectionKey === 'stats') {
    await addFactoryStat()
    return
  }
  if (sectionKey === 'production') {
    await addCapabilityCard()
  }
}


const capabilitySections = computed(() => [
  {
    key: 'hero',
    eyebrow: 'Page 1 Hero',
    title: 'Banner trượt (Slider)',
    description:
      'Quản lý danh sách các slide banner đầu trang. Mỗi slide có ảnh riêng, tiêu đề và mô tả riêng.',
    previewLabel: 'Xem ngoài web',
    previewPath: '/honors#page1',
    stats: [
      `${form.hero_banners.length} banner`,
      `${form.hero_banners.filter(b => b.is_active).length} đang bật`,
      `${form.capability_hero_is_active ? 'Hero đang bật' : 'Hero đang tắt'}`,
    ],
  },
  {
    key: 'overview',
    eyebrow: 'Page 2 Tổng quan',
    title: 'Tổng quan nhà máy',
    description:
      'Nơi nhập tên nhà máy, địa chỉ, mô tả tổng quan, công nghệ, quy trình cùng 1 ảnh lớn và nhiều ảnh nhỏ cho block overview.',
    previewLabel: 'Xem ngoài web',
    previewPath: '/honors#page2b',
    stats: [
      normalizeText(form.factory_name) || 'Chưa có tên nhà máy',
      normalizeText(form.factory_address) || 'Chưa có địa chỉ nhà máy',
      (firstNonEmptyGalleryImage() || normalizeText(form.factory_main_image_url)) ? 'Có ảnh overview' : 'Thiếu ảnh overview',
    ],
  },
  {
    key: 'stats',
    eyebrow: 'Page 2 Stats',
    title: 'Thống kê nổi bật',
    description:
      'Các chỉ số ngắn hiển thị cạnh phần tổng quan như diện tích và công suất nổi bật của nhà máy.',
    previewLabel: 'Xem ngoài web',
    previewPath: '/honors#page2b',
    stats: [`${summaryCards.value.find((item) => item.key === 'stats')?.value || 0} chỉ số hợp lệ`],
  },
  {
    key: 'production',
    eyebrow: 'Page 3 Công nghệ',
    title: 'Năng lực sản xuất',
    description:
      'Quản lý các card mô tả dây chuyền, máy móc, công suất hoặc thế mạnh sản xuất hiển thị ở phần capability.',
    previewLabel: 'Xem ngoài web',
    previewPath: '/honors#page2c',
    stats: [`${summaryCards.value.find((item) => item.key === 'production')?.value || 0} card đang hoạt động`],
  },
])

watch(
  () => [props.active, props.token],
  ([active, token]) => {
    if (active && String(token || '').trim()) {
      loadCapabilitySettings()
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="capability-page">
    <div class="ultimate-clean-workspace">
      <!-- 1. Header & Stats Combined -->
      <header class="intro-card">
        <div class="intro-copy">
          <p class="intro-eyebrow">CAPABILITY ADMIN</p>
          <h2>Quản lý cấu hình trang Năng lực</h2>
          <p>Hỗ trợ quản lý ảnh 2 chế độ: tải file hoặc import từ URI, có preview realtime trước khi lưu.</p>
        </div>

        <div class="intro-actions">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="loading || saving"
            @click="loadCapabilitySettings"
          >
            Tải lại dữ liệu
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="loading || saving"
            @click="saveCapabilitySettings"
          >
            {{ saving ? 'Đang lưu...' : 'Lưu toàn bộ cấu hình' }}
          </button>
        </div>
      </header>

      <section class="summary-grid-unified">
        <article
          v-for="card in summaryCards"
          :key="card.key"
          class="summary-card-clean"
        >
          <span class="summary-value">{{ card.value }}</span>
          <strong>{{ card.label }}</strong>
          <p>{{ card.hint }}</p>
        </article>
      </section>

      <!-- 2. List Sections Unified -->
      <div v-if="loading" class="loading-card-clean">
        <p>Đang tải cấu hình module Năng lực...</p>
      </div>

      <div v-else class="section-list-unified">
        <article
          v-for="section in capabilitySections"
          :key="section.key"
          class="section-workspace"
          :class="[{ 'section-workspace--active': activeSection === section.key }, `accent-${section.key}`]"
          :id="`capability-section-${section.key}`"
        >
          <header class="section-card__summary">
            <div class="section-card__main">
              <div class="section-thumb-clean" :class="{ 'section-thumb-clean--empty': !previewImageForSection(section.key) }">
                <img
                  v-if="previewImageForSection(section.key)"
                  :src="resolvePreviewUrl(previewImageForSection(section.key))"
                  :alt="section.title"
                />
                <div v-else class="section-thumb-clean__placeholder">
                  <span>{{ section.title.slice(0, 1) }}</span>
                </div>
              </div>

              <div class="section-card__info">
                <p class="section-card__eyebrow">{{ section.eyebrow }}</p>
                <h2>{{ section.title }}</h2>
                <div class="section-card__stats">
                  <span
                    v-for="item in section.stats"
                    :key="item"
                    class="section-chip"
                  >
                    {{ item }}
                  </span>
                </div>
              </div>
            </div>

            <div class="section-card__actions">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                @click="openPreview(section.previewPath)"
              >
                Xem
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="toggleSection(section.key)"
              >
                {{ activeSection === section.key ? 'Thu gọn' : 'Chỉnh sửa' }}
              </button>
            </div>
          </header>

        <div v-if="activeSection === section.key" class="section-card__editor">
          <template v-if="section.key === 'hero'">
            <div class="editor-head">
              <div>
                <p class="editor-eyebrow">Hero Slider</p>
                <h4>Danh sách Banner trượt</h4>
              </div>
              <button type="button" class="btn btn-inline" @click="addHeroBanner">
                + Thêm Banner
              </button>
            </div>

            <div class="field-grid">
              <label class="field field--toggle">
                <span>Kích hoạt Hero Section</span>
                <input v-model="form.capability_hero_is_active" type="checkbox" />
              </label>
            </div>

            <div class="stack-list">
              <div
                v-for="(item, index) in form.hero_banners"
                :key="`hero-banner-${index}`"
                class="editor-item"
              >
                <div class="editor-item__head">
                  <div class="editor-item__title-wrap">
                    <img v-if="item.background_image_url" :src="resolvePreviewUrl(item.background_image_url)" class="item-mini-thumb" />
                    <strong>{{ item.title || `Slide ${index + 1}` }}</strong>
                    <div class="editor-item__badges">
                      <span v-if="!item.is_active" class="item-badge item-badge--disabled">Đã tắt</span>
                    </div>
                  </div>
                  <div class="editor-item__actions">
                    <button type="button" class="btn btn-secondary-inline" @click="editListItem('banners', item, index)">
                      Sửa
                    </button>
                    <button type="button" class="btn btn-danger-inline" @click="removeHeroBanner(index)">
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="section.key === 'overview'">
            <div class="editor-head">
              <div>
                <p class="editor-eyebrow">Factory Overview</p>
                <h4>Tổng quan nhà máy</h4>
              </div>
              <span class="editor-hint">Mô tả quy mô, vị trí, công nghệ và ảnh chính của nhà máy.</span>
            </div>

            <div class="field-grid field-grid--two">
              <label class="field">
                <span>Tiêu đề section</span>
                <input
                  v-model="form.capability_factory_overview_title"
                  type="text"
                  placeholder="Tổng quan nhà máy"
                />
              </label>
              <label class="field">
                <span>Tên nhà máy</span>
                <input v-model="form.factory_name" type="text" placeholder="China Factory" />
              </label>
            </div>

            <div class="field-grid field-grid--two">
              <label class="field">
                <span>Địa chỉ nhà máy</span>
                <input v-model="form.factory_address" type="text" placeholder="Địa chỉ nhà máy" />
              </label>
              <label class="field">
                <span>Nhãn vị trí</span>
                <input v-model="form.factory_location" type="text" placeholder="Location" />
              </label>
            </div>

            <label class="field">
              <span>Mô tả tổng quan</span>
              <textarea
                v-model="form.factory_overview_description"
                rows="4"
                placeholder="Giới thiệu ngắn về quy mô, quy trình, thế mạnh nhà máy..."
              />
            </label>

            <div class="field-grid field-grid--two">
              <label class="field">
                <span>Công nghệ sản xuất</span>
                <textarea
                  v-model="form.factory_technology"
                  rows="4"
                  placeholder="Ví dụ: hệ thống ép, phủ bề mặt, xử lý cạnh..."
                />
              </label>
              <label class="field">
                <span>Máy móc / quy trình</span>
                <textarea
                  v-model="form.machinery_process"
                  rows="4"
                  placeholder="Ví dụ: CNC, tự động hóa, kiểm định chất lượng..."
                />
              </label>
            </div>

            <div class="field-grid field-grid--two">
              <label class="field">
                <span>Công suất</span>
                <textarea
                  v-model="form.factory_capacity"
                  rows="3"
                  placeholder="Ví dụ: 1.000.000 m² / năm"
                />
              </label>
              <label class="field">
                <span>Mô tả đầu ra</span>
                <textarea
                  v-model="form.factory_output_description"
                  rows="3"
                  placeholder="Ví dụ: đáp ứng đơn hàng OEM/ODM số lượng lớn"
                />
              </label>
            </div>

            <div class="image-manager image-manager--overview-gallery">
              <div class="image-manager__head image-manager__head--split">
                <div>
                  <span>Hệ ảnh tổng quan nhà máy</span>
                  <p class="editor-hint">Thiết lập 1 ảnh gốc hiển thị to và nhiều ảnh nhỏ phía dưới ngay trong block tổng quan nhà máy.</p>
                </div>
                <div class="overview-gallery-admin__toolbar">
                  <input
                    ref="galleryBatchInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    @change="onSelectGalleryBatchFiles"
                  />
                  <input
                    ref="galleryFolderInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    webkitdirectory
                    directory
                    class="sr-only"
                    @change="onSelectGalleryFolder"
                  />
                  <button type="button" class="btn btn-soft" :disabled="galleryBatchUploadState.uploading" @click="openGalleryBatchPicker">
                    Chọn nhiều ảnh
                  </button>
                  <button type="button" class="btn btn-soft" :disabled="galleryBatchUploadState.uploading" @click="openGalleryFolderPicker">
                    Tải từ thư mục
                  </button>
                  <button
                    type="button"
                    class="btn btn-inline"
                    :disabled="galleryBatchUploadState.uploading || form.factory_gallery.length >= MAX_FACTORY_OVERVIEW_THUMBS"
                    @click="addGalleryItem"
                  >
                    + Thêm ảnh nhỏ
                  </button>
                </div>
              </div>

              <p v-if="galleryBatchUploadState.uploading" class="image-upload-feedback image-upload-feedback--strong">
                Đang tải {{ galleryBatchUploadState.completed }}/{{ galleryBatchUploadState.total }} ảnh từ {{ galleryBatchUploadState.source }}...
              </p>
              <p class="editor-hint">
                Bên ngoài user sẽ hiển thị <strong>1 ảnh lớn + tối đa {{ MAX_FACTORY_OVERVIEW_THUMBS }} ảnh nhỏ</strong>.
              </p>

              <div class="image-preview-card image-preview-card--overview-hero" :class="{ 'image-preview-card--empty': !imagePreviewSource(imageUploadKey('factory_main_image_url'), form.factory_main_image_url) }">
                <img
                  v-if="imagePreviewSource(imageUploadKey('factory_main_image_url'), form.factory_main_image_url)"
                  :src="imagePreviewSource(imageUploadKey('factory_main_image_url'), form.factory_main_image_url)"
                  alt="Factory overview preview"
                />
                <div v-else class="image-preview-card__placeholder">Chưa có ảnh lớn overview</div>
              </div>

              <div class="image-manager__head">
                <span>Ảnh lớn chính</span>
                <div class="image-mode-switch">
                  <button
                    type="button"
                    class="image-mode-btn"
                    :class="{ 'image-mode-btn--active': imageUploadMode(imageUploadKey('factory_main_image_url')) === 'file' }"
                    @click="setImageUploadMode(imageUploadKey('factory_main_image_url'), 'file', form.factory_main_image_url)"
                  >
                    Tải file
                  </button>
                  <button
                    type="button"
                    class="image-mode-btn"
                    :class="{ 'image-mode-btn--active': imageUploadMode(imageUploadKey('factory_main_image_url')) === 'url' }"
                    @click="setImageUploadMode(imageUploadKey('factory_main_image_url'), 'url', form.factory_main_image_url)"
                  >
                    Import URL
                  </button>
                </div>
              </div>

              <div v-if="imageUploadMode(imageUploadKey('factory_main_image_url')) === 'file'" class="image-control-stack">
                <input type="file" accept="image/*" @change="onSelectImageFile(imageUploadKey('factory_main_image_url'), $event)" />
              </div>
              <div v-else class="image-control-stack">
                <input
                  :value="imageUploadStateMeta(imageUploadKey('factory_main_image_url')).sourceUrl"
                  type="url"
                  placeholder="https://..."
                  @input="onChangeImageUrl(imageUploadKey('factory_main_image_url'), $event.target.value)"
                />
              </div>

              <input
                :value="form.factory_main_image_url"
                type="text"
                readonly
                placeholder="URL đã gán sẽ hiển thị ở đây sau khi lưu block"
              />

              <p class="image-upload-feedback image-upload-feedback--strong">
                Ảnh lớn sẽ tự động tải lên khi bạn bấm <strong>Lưu section này</strong>.
              </p>

              <p
                v-if="imageUploadStateMeta(imageUploadKey('factory_main_image_url')).storageBackend"
                class="image-upload-feedback"
              >
                Đích lưu: {{ imageUploadStateMeta(imageUploadKey('factory_main_image_url')).storageBackend }}
                <span v-if="imageUploadStateMeta(imageUploadKey('factory_main_image_url')).fallbackReason">
                  • Fallback: {{ imageUploadStateMeta(imageUploadKey('factory_main_image_url')).fallbackReason }}
                </span>
              </p>

              <div class="overview-gallery-admin">
                <div
                  v-for="(item, index) in form.factory_gallery"
                  :key="item.id || `overview-gallery-${index}`"
                  class="overview-gallery-admin__item"
                >
                  <div class="overview-gallery-admin__preview">
                    <img
                      v-if="imagePreviewSource(galleryImageUploadKey(item, index), item.image_url)"
                      :src="imagePreviewSource(galleryImageUploadKey(item, index), item.image_url)"
                      :alt="item.title || `Ảnh nhỏ ${index + 1}`"
                    />
                    <div v-else class="image-preview-card__placeholder">Chưa có ảnh nhỏ</div>
                  </div>

                  <div class="overview-gallery-admin__body">
                    <div class="field-grid field-grid--three">
                      <label class="field">
                        <span>Tiêu đề</span>
                        <input v-model="item.title" type="text" placeholder="Ảnh nhà máy" />
                      </label>
                      <label class="field">
                        <span>ID kỹ thuật</span>
                        <input v-model="item.id" type="text" placeholder="factory-gallery-1" />
                      </label>
                      <label class="field">
                        <span>Sort order</span>
                        <input v-model.number="item.sort_order" type="number" min="0" step="1" />
                      </label>
                    </div>

                    <div class="image-mode-switch overview-gallery-admin__switch">
                      <button
                        type="button"
                        class="image-mode-btn"
                        :class="{ 'image-mode-btn--active': imageUploadMode(galleryImageUploadKey(item, index)) === 'file' }"
                        @click="setImageUploadMode(galleryImageUploadKey(item, index), 'file', item.image_url)"
                      >
                        Tải file
                      </button>
                      <button
                        type="button"
                        class="image-mode-btn"
                        :class="{ 'image-mode-btn--active': imageUploadMode(galleryImageUploadKey(item, index)) === 'url' }"
                        @click="setImageUploadMode(galleryImageUploadKey(item, index), 'url', item.image_url)"
                      >
                        Import URL
                      </button>
                    </div>

                    <div v-if="imageUploadMode(galleryImageUploadKey(item, index)) === 'file'" class="image-control-stack">
                      <input type="file" accept="image/*" @change="onSelectImageFile(galleryImageUploadKey(item, index), $event)" />
                    </div>
                    <div v-else class="image-control-stack">
                      <input
                        :value="imageUploadStateMeta(galleryImageUploadKey(item, index)).sourceUrl"
                        type="url"
                        placeholder="https://..."
                        @input="onChangeImageUrl(galleryImageUploadKey(item, index), $event.target.value)"
                      />
                    </div>

                    <input
                      :value="item.image_url"
                      type="text"
                      readonly
                      placeholder="URL đã gán sẽ hiển thị ở đây"
                    />

                    <label class="field">
                      <span>Mô tả</span>
                      <textarea v-model="item.description" rows="2" placeholder="Mô tả ngắn cho ảnh này..." />
                    </label>

                    <div class="overview-gallery-admin__footer">
                      <label class="field field--toggle overview-gallery-admin__toggle">
                        <span>Hiển thị ảnh này</span>
                        <input v-model="item.is_active" type="checkbox" />
                      </label>

                      <div class="overview-gallery-admin__actions">
                        <p class="image-upload-feedback image-upload-feedback--strong">
                          Ảnh nhỏ sẽ tự động tải lên khi bấm <strong>Lưu section này</strong>.
                        </p>
                        <button type="button" class="btn btn-danger-inline" @click="removeGalleryItem(index)">
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="section.key === 'stats'">
            <div class="editor-head">
              <div>
                <p class="editor-eyebrow">Factory Stats</p>
                <h4>Thống kê nổi bật</h4>
              </div>
              <button type="button" class="btn btn-inline" @click="addFactoryStat">
                + Thêm chỉ số
              </button>
            </div>


            <div class="stack-list">
              <div
                v-for="(item, index) in form.factory_stats"
                :key="`stat-${index}`"
                class="editor-item"
                :class="{ 'editor-item--editing': isEditingListItem('stats', item, index) }"
              >
                <div class="editor-item__head">
                  <strong>Stat {{ index + 1 }}</strong>
                  <div class="editor-item__actions">
                    <button
                      v-if="!isEditingListItem('stats', item, index)"
                      type="button"
                      class="btn btn-secondary-inline"
                      @click="editListItem('stats', item, index)"
                    >
                      Sửa
                    </button>
                    <button
                      v-if="isEditingListItem('stats', item, index)"
                      type="button"
                      class="btn btn-inline"
                      @click="saveListItem('stats', item, index)"
                    >
                      Lưu item
                    </button>
                    <button
                      v-if="isEditingListItem('stats', item, index)"
                      type="button"
                      class="btn btn-soft-inline"
                      @click="cancelListItemEdit('stats', item, index)"
                    >
                      Hủy
                    </button>
                    <button type="button" class="btn btn-danger-inline" @click="removeFactoryStat(index)">
                      Xóa
                    </button>
                  </div>
                </div>


                <div class="field-grid field-grid--two">
                  <label class="field">
                    <span>Nhãn</span>
                    <input
                      v-model="item.label"
                      :disabled="!isEditingListItem('stats', item, index)"
                      type="text"
                      placeholder="Ví dụ: Công suất mỗi năm"
                    />
                  </label>
                  <label class="field">
                    <span>Giá trị</span>
                    <input
                      v-model="item.value"
                      :disabled="!isEditingListItem('stats', item, index)"
                      type="text"
                      placeholder="Ví dụ: 1.000.000 m²"
                    />
                  </label>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="section.key === 'production'">
            <div class="editor-head">
              <div>
                <p class="editor-eyebrow">Production Cards</p>
                <h4>Năng lực sản xuất</h4>
              </div>
              <button type="button" class="btn btn-inline" @click="addCapabilityCard">
                + Thêm card
              </button>
            </div>


            <div class="stack-list">
              <div
                v-for="(item, index) in form.production_capabilities"
                :key="`capability-${index}`"
                class="editor-item"
                :class="{ 'editor-item--editing': isEditingListItem('production', item, index) }"
              >
                <div class="editor-item__head">
                  <strong>Card {{ index + 1 }}</strong>
                  <div class="editor-item__actions">
                    <button
                      v-if="!isEditingListItem('production', item, index)"
                      type="button"
                      class="btn btn-secondary-inline"
                      @click="editListItem('production', item, index)"
                    >
                      Sửa
                    </button>
                    <button
                      v-if="isEditingListItem('production', item, index)"
                      type="button"
                      class="btn btn-inline"
                      @click="saveListItem('production', item, index)"
                    >
                      Lưu item
                    </button>
                    <button
                      v-if="isEditingListItem('production', item, index)"
                      type="button"
                      class="btn btn-soft-inline"
                      @click="cancelListItemEdit('production', item, index)"
                    >
                      Hủy
                    </button>
                    <button type="button" class="btn btn-danger-inline" @click="removeCapabilityCard(index)">
                      Xóa
                    </button>
                  </div>
                </div>


                <div class="field-grid field-grid--three">
                  <label class="field">
                    <span>Tiêu đề</span>
                    <input
                      v-model="item.title"
                      :disabled="!isEditingListItem('production', item, index)"
                      type="text"
                      placeholder="Dây chuyền hiện đại"
                    />
                  </label>
                  <label class="field">
                    <span>Icon</span>
                    <input
                      v-model="item.icon"
                      :disabled="!isEditingListItem('production', item, index)"
                      type="text"
                      placeholder="factory / cog / shield"
                    />
                  </label>
                  <label class="field">
                    <span>Sort order</span>
                    <input
                      v-model.number="item.sort_order"
                      :disabled="!isEditingListItem('production', item, index)"
                      type="number"
                      min="0"
                      step="1"
                    />
                  </label>
                </div>

                <label class="field">
                  <span>Mô tả</span>
                  <textarea
                    v-model="item.description"
                    :disabled="!isEditingListItem('production', item, index)"
                    rows="3"
                    placeholder="Mô tả ngắn cho thẻ năng lực sản xuất..."
                  />
                </label>

                <label class="field field--toggle">
                  <span>Hiển thị card này</span>
                  <input
                    v-model="item.is_active"
                    :disabled="!isEditingListItem('production', item, index)"
                    type="checkbox"
                  />
                </label>
              </div>
            </div>
          </template>


          <div class="editor-footer">
            <div class="editor-footer__status">
              <span v-if="lastLoadedAt">Cập nhật: {{ lastLoadedAt }}</span>
              <span v-else>Chưa có dữ liệu</span>
            </div>

            <div class="editor-footer__actions">
              <button type="button" class="btn btn-soft btn-sm" @click="openSection('')">
                Thu gọn
              </button>
              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="loading || saving"
                @click="saveCapabilitySection(section.key)"
              >
                {{ saving ? 'Đang lưu...' : 'Lưu section' }}
              </button>
            </div>
          </div>
        </div>
        </article>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="itemModal.visible" class="item-modal-overlay" @click.self="closeItemModal">
        <div class="item-modal">
          <header class="item-modal__head">
            <h3>{{ itemModal.title }}</h3>
            <button type="button" class="btn-close" @click="closeItemModal">✕</button>
          </header>
          
          <div class="item-modal__body">
            <template v-if="itemModal.type === 'stats' && itemModal.item">
              <div class="field-grid">
                <label class="field">
                  <span>Nhãn chỉ số</span>
                  <input v-model="itemModal.item.label" type="text" placeholder="Ví dụ: Diện tích" />
                </label>
                <label class="field">
                  <span>Giá trị</span>
                  <input v-model="itemModal.item.value" type="text" placeholder="Ví dụ: 50.000 m2" />
                </label>
              </div>
            </template>

            <template v-else-if="itemModal.type === 'production' && itemModal.item">
              <div class="field-grid">
                <label class="field">
                  <span>Tiêu đề năng lực</span>
                  <input v-model="itemModal.item.title" type="text" placeholder="Dây chuyền hiện đại" />
                </label>
                <label class="field">
                  <span>Icon</span>
                  <input v-model="itemModal.item.icon" type="text" placeholder="factory / cog / shield" />
                </label>
              </div>
              <label class="field">
                <span>Mô tả chi tiết</span>
                <textarea v-model="itemModal.item.description" rows="4" placeholder="Nhập mô tả cho card năng lực này..." />
              </label>
              <label class="field field--toggle">
                <span>Trạng thái hiển thị</span>
                <input v-model="itemModal.item.is_active" type="checkbox" />
              </label>
            </template>

            <template v-else-if="itemModal.type === 'gallery' && itemModal.item">
              <div class="field-grid">
                <label class="field">
                  <span>Tiêu đề ảnh</span>
                  <input v-model="itemModal.item.title" type="text" placeholder="Khu vực sản xuất" />
                </label>
                <label class="field">
                   <span>ID kỹ thuật</span>
                   <input v-model="itemModal.item.id" type="text" />
                </label>
              </div>
              
              <div class="image-manager">
                 <div class="image-preview-card">
                   <img v-if="itemModal.item.image_url" :src="resolvePreviewUrl(itemModal.item.image_url)" alt="Preview" />
                   <div v-else class="image-preview-card__placeholder">Chưa có ảnh</div>
                 </div>
                 <div class="field">
                   <span>URL ảnh</span>
                   <input v-model="itemModal.item.image_url" type="text" placeholder="https://..." />
                 </div>
              </div>

              <label class="field">
                <span>Mô tả ảnh</span>
                <textarea v-model="itemModal.item.description" rows="3" placeholder="Nhập mô tả ngắn cho ảnh..." />
              </label>
              <label class="field field--toggle">
                <span>Trạng thái hiển thị</span>
                <input v-model="itemModal.item.is_active" type="checkbox" />
              </label>
            </template>

            <template v-else-if="itemModal.type === 'banners' && itemModal.item">
              <div class="field-grid">
                <label class="field">
                  <span>Tiêu đề Slide</span>
                  <input v-model="itemModal.item.title" type="text" placeholder="NĂNG LỰC" />
                </label>
                <label class="field">
                  <span>Subtitle</span>
                  <input v-model="itemModal.item.subtitle" type="text" placeholder="Mô tả ngắn..." />
                </label>
              </div>

              <div class="image-manager image-manager--banner-modal">
                <div class="image-manager__head">
                  <span>Ảnh PC (Desktop)</span>
                  <div class="image-mode-switch">
                    <button
                      type="button"
                      class="image-mode-btn"
                      :class="{ 'image-mode-btn--active': imageUploadMode(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')) === 'file' }"
                      @click="setImageUploadMode(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), 'file', itemModal.item.background_image_url)"
                    >
                      Tải file
                    </button>
                    <button
                      type="button"
                      class="image-mode-btn"
                      :class="{ 'image-mode-btn--active': imageUploadMode(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')) === 'url' }"
                      @click="setImageUploadMode(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), 'url', itemModal.item.background_image_url)"
                    >
                      Import URL
                    </button>
                  </div>
                </div>

                <div
                  class="image-preview-card image-preview-card--banner-modal"
                  :class="{ 'image-preview-card--empty': !imagePreviewSource(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), itemModal.item.background_image_url) }"
                >
                  <img
                    v-if="imagePreviewSource(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), itemModal.item.background_image_url)"
                    :src="imagePreviewSource(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), itemModal.item.background_image_url)"
                    alt="PC Preview"
                  />
                  <div v-else class="image-preview-card__placeholder">Chưa có ảnh PC</div>
                </div>

                <div
                  v-if="imageUploadMode(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')) === 'file'"
                  class="image-control-stack"
                >
                  <input
                    type="file"
                    accept="image/*"
                    @change="onSelectImageFile(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), $event)"
                  />
                </div>
                <div v-else class="image-control-stack">
                  <input
                    :value="imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')).sourceUrl"
                    type="url"
                    placeholder="https://..."
                    @input="onChangeImageUrl(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc'), $event.target.value)"
                  />
                </div>

                <input
                  :value="itemModal.item.background_image_url"
                  type="text"
                  readonly
                  placeholder="URL ảnh PC đã gán sẽ hiển thị ở đây"
                />

                <button
                  type="button"
                  class="btn btn-inline"
                  :disabled="imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')).uploading"
                  @click="uploadBannerImage('pc')"
                >
                  {{ imageActionLabel(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')) }}
                </button>

                <p
                  v-if="imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')).storageBackend"
                  class="image-upload-feedback"
                >
                  Đích lưu: {{ imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')).storageBackend }}
                  <span v-if="imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')).fallbackReason">
                    • Fallback: {{ imageUploadStateMeta(bannerImageUploadKey(itemModal.item, itemModal.index, 'pc')).fallbackReason }}
                  </span>
                </p>
              </div>

              <label class="field field--toggle">
                <span>Kích hoạt slide này</span>
                <input v-model="itemModal.item.is_active" type="checkbox" />
              </label>
            </template>
          </div>

          <footer class="item-modal__footer">
            <button type="button" class="btn btn-soft" @click="closeItemModal">Hủy bỏ</button>
            <button type="button" class="btn btn-primary" @click="saveModalItem">
              {{ itemModal.isNew ? 'Thêm mới' : 'Lưu thay đổi' }}
            </button>
          </footer>
        </div>
      </div>
    </Teleport>

    <CoreConfirmDialog
      :visible="confirmDialog.visible"
      :dialog="confirmDialog"
      :confirm-button-class="confirmDialog.tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary'"
      @accept="acceptConfirmDialog"
      @cancel="cancelConfirmDialog"
    />
  </section>
</template>

<style scoped>
.capability-page {
  display: grid;
  gap: 22px;
}

.intro-card,
.summary-card,
.loading-card,
.section-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(191, 219, 254, 0.68);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(248, 250, 252, 0.98)),
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.12), transparent 34%);
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.intro-card,
.section-card,
.loading-card {
  border-radius: 30px;
}

.intro-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 30px 32px;
}

.intro-copy h2 {
  margin: 4px 0 8px;
  color: #1a3353;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.intro-copy p {
  margin: 0;
  max-width: 800px;
  color: #64748b;
  line-height: 1.5;
  font-size: 13px;
}

.intro-eyebrow,
.section-card__eyebrow,
.editor-eyebrow {
  margin: 0;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  font-weight: 500;
}

.intro-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.intro-actions .btn {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}

.summary-grid-unified {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 32px 32px;
  border-bottom: 1px solid rgba(198, 216, 233, 0.3);
  gap: 18px;
}

.summary-grid-unified {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 32px 32px;
  border-bottom: 1px solid #f1f5f9;
  gap: 16px;
}

.summary-card-clean {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.summary-value {
  display: block;
  margin-bottom: 2px;
  color: #2563eb;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.summary-card-clean strong {
  display: block;
  margin-bottom: 4px;
  color: #334155;
  font-size: 14px;
  font-weight: 500;
}

.summary-card-clean p {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.loading-card {
  padding: 30px 32px;
  color: #37506f;
}

/* --- Ultimate Clean Design --- */
.ultimate-clean-workspace {
  background: #fff;
  border-radius: var(--admin-card-radius, 16px);
  border: 1px solid rgba(198, 216, 233, 0.5);
  box-shadow: 0 8px 32px rgba(18, 43, 71, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.intro-card {
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
}

.section-list-unified {
  display: flex;
  flex-direction: column;
}

.section-workspace:not(:last-child) {
  border-bottom: 1px solid rgba(198, 216, 233, 0.3);
}

.section-card__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  gap: 20px;
}

.section-card__main {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.section-workspace:hover {
  background: rgba(248, 251, 255, 0.6);
}

.section-card__info h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
}

.section-thumb-clean {
  width: 80px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
}

.section-thumb-clean img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-workspace:hover {
  background: #f8fafc;
}

.section-workspace--active {
  background: #f1f5f9;
  border-left-color: #3b82f6;
}

.accent-hero, .accent-overview, .accent-stats, .accent-production, .accent-gallery {
  border-left-color: #cbd5e1;
}

.section-workspace--active.accent-hero,
.section-workspace--active.accent-overview,
.section-workspace--active.accent-stats,
.section-workspace--active.accent-production,
.section-workspace--active.accent-gallery {
  border-left-color: #3b82f6;
}

.section-thumb {
  position: relative;
  height: 132px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 12px 28px rgba(59, 130, 246, 0.12);
}

.section-thumb img,
.section-thumb__placeholder {
  width: 100%;
  height: 100%;
}

.section-thumb img {
  display: block;
  object-fit: cover;
}

.section-thumb__placeholder {
  display: grid;
  place-items: center;
  color: #94a3b8;
  font-size: 32px;
  font-weight: 500;
}

.section-thumb__overlay {
  position: absolute;
  inset: auto 0 0 0;
  display: grid;
  gap: 2px;
  padding: 14px 14px 12px;
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.78));
  color: #fff;
}

.section-thumb__overlay strong {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.3;
}

.section-thumb__overlay span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.82);
}

.section-card__content {
  min-width: 0;
}

.section-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-card__header h3,
.editor-head h4 {
  margin: 7px 0 0;
  color: #102443;
  font-size: clamp(28px, 2.3vw, 35px);
  line-height: 1.06;
  letter-spacing: -0.042em;
}

.section-card__description {
  margin: 12px 0 0;
  color: #556d86;
  line-height: 1.72;
  font-size: 14px;
}

.section-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.section-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 400;
}


.section-card__actions {
  display: flex;
  flex-direction: row; /* Chuyển về hàng ngang */
  align-items: center;
  gap: 8px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
  height: 32px;
  min-width: auto; /* Không cho phép nút bị kéo bự */
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge--success {
  background: rgba(220, 252, 231, 0.92);
  border-color: rgba(134, 239, 172, 0.75);
  color: #166534;
}

.status-badge--warning {
  background: rgba(254, 243, 199, 0.95);
  border-color: rgba(253, 230, 138, 0.8);
  color: #92400e;
}

.status-badge--muted {
  background: rgba(241, 245, 249, 0.95);
  border-color: rgba(203, 213, 225, 0.8);
  color: #475569;
}

.section-card__editor {
  padding: 0 24px 24px 50px;
  border-top: 1px solid rgba(191, 219, 254, 0.65);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(248, 250, 252, 0.94));
}

.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 0 20px;
}

.editor-hint {
  color: #697f95;
  font-size: 13px;
  font-weight: 700;
}

.field-grid {
  display: grid;
  gap: 14px;
}

.field-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.field span {
  color: #193450;
  font-size: 13px;
  font-weight: 800;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid rgba(191, 219, 254, 0.95);
  background: rgba(255, 255, 255, 0.98);
  color: #102443;
  border-radius: 18px;
  padding: 13px 15px;
  outline: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease,
    background 0.2s ease;
}

.field input:disabled,
.field textarea:disabled {
  cursor: not-allowed;
  background: rgba(241, 245, 249, 0.95);
  color: #6b7f96;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #97a7ba;
}

.field input:focus,
.field textarea:focus {
  border-color: rgba(59, 130, 246, 0.56);
  box-shadow:
    0 0 0 4px rgba(59, 130, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
  transform: translateY(-1px);
}

.field textarea {
  resize: vertical;
  min-height: 96px;
}

.image-manager {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(191, 219, 254, 0.82);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.editor-item {
  padding: 18px;
  border: 1px solid rgba(191, 219, 254, 0.72);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
}

.editor-item--editing {
  border-color: rgba(59, 130, 246, 0.62);
  box-shadow: 0 16px 40px rgba(59, 130, 246, 0.12);
}

.editor-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.editor-item__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn.btn-secondary-inline,
.btn.btn-soft-inline,
.btn.btn-danger-inline,
.btn.btn-inline {
  min-height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
}

.btn-danger-inline {
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fee2e2;
}

.btn-danger-inline:hover {
  background: #fee2e2;
}

.btn-secondary-inline {
  color: #6366f1;
  background: #eef2ff;
  border: 1px solid #e0e7ff;
}

.btn-secondary-inline:hover {
  background: #e0e7ff;
}

.image-manager--compact {
  gap: 14px;
}

.image-manager--overview-gallery {
  gap: 18px;
}

.image-manager__head--split {
  justify-content: space-between;
  align-items: flex-start;
}

.image-preview-card--overview-hero {
  height: 260px;
}

.overview-gallery-admin {
  display: grid;
  gap: 16px;
}

.overview-gallery-admin__item {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 16px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(191, 219, 254, 0.78);
  background: rgba(255, 255, 255, 0.92);
}

.overview-gallery-admin__preview {
  height: 180px;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.9), rgba(239, 246, 255, 0.96));
}

.overview-gallery-admin__preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.overview-gallery-admin__body {
  display: grid;
  gap: 12px;
}

.overview-gallery-admin__switch {
  justify-content: flex-start;
}

.overview-gallery-admin__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.overview-gallery-admin__toggle {
  min-width: 220px;
}

.overview-gallery-admin__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.image-upload-feedback--strong {
  font-weight: 700;
  color: #1d4f91;
}

.image-manager__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-manager__head span {
  color: #193450;
  font-size: 13px;
  font-weight: 800;
}

.image-mode-switch {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(219, 234, 254, 0.55);
}

.image-mode-btn {
  border: 0;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: transparent;
  color: #476887;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.image-mode-btn--active {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.2);
}

.image-control-stack {
  display: grid;
  gap: 10px;
}

.image-preview-card {
  position: relative;
  height: 190px;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(191, 219, 254, 0.8);
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.9), rgba(239, 246, 255, 0.96));
}

.image-preview-card--empty {
  display: grid;
  place-items: center;
}

.image-preview-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-card__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #5b7490;
  font-size: 13px;
  font-weight: 700;
}

.image-upload-feedback {
  margin: 0;
  color: #4b6481;
  font-size: 12px;
  line-height: 1.6;
}

.field--toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 54px;
  padding: 0 16px;
  border-radius: 18px;
  border: 1px solid rgba(191, 219, 254, 0.95);
  background: rgba(255, 255, 255, 0.98);
}

.field--toggle input {
  width: 18px;
  height: 18px;
}

.stack-list {
  display: grid;
  gap: 14px;
}

.editor-item {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(191, 219, 254, 0.78);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.editor-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.editor-item__head strong {
  color: #102443;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 12px;
  padding-top: 20px;
  border-top: 1px dashed rgba(148, 163, 184, 0.3);
}

.editor-footer__status {
  color: #536b82;
}

.editor-footer__actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: 0;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-primary,
.btn-soft,
.btn-outline,
.btn-section,
.btn-inline,
.btn-danger-inline {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 16px;
  font-weight: 800;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  box-shadow: 0 16px 30px rgba(37, 99, 235, 0.22);
}

.workspace-filters {
  background: #fff;
  border-radius: var(--admin-card-radius, 16px);
  border: 1px solid rgba(198, 216, 233, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  margin-bottom: 24px;
}

.filters-head {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(198, 216, 233, 0.3);
}

.filters-body {
  padding: 24px;
}

.btn-soft,
.btn-outline,
.btn-section,
.btn-inline {
  border: 1px solid rgba(191, 219, 254, 0.95);
  background: rgba(255, 255, 255, 0.96);
  color: #1d4f91;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.btn-section {
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(219, 234, 254, 0.96));
  box-shadow: 0 10px 22px rgba(59, 130, 246, 0.12);
}

.btn-danger-inline {
  border: 1px solid rgba(254, 202, 202, 0.95);
  background: rgba(254, 242, 242, 0.95);
  color: #b91c1c;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .section-card__summary {
    grid-template-columns: 6px 160px minmax(0, 1fr);
  }

  .section-card__actions {
    grid-column: 2 / -1;
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 900px) {
  .intro-card,
  .editor-head,
  .editor-footer,
  .section-card__header,
  .field--toggle,
  .editor-item__head,
  .image-manager__head,
  .crud-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .intro-actions,
  .editor-footer__actions {
    width: 100%;
  }

  .section-card__summary {
    grid-template-columns: 6px 1fr;
    padding: 20px;
  }

  .section-thumb {
    grid-column: 2;
  }

  .section-card__content,
  .section-card__actions {
    grid-column: 2;
  }

  .section-card__actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .section-card__editor {
    padding: 0 20px 20px 20px;
  }

  .field-grid--two,
  .field-grid--three {
    grid-template-columns: 1fr;
  }

  .overview-gallery-admin__item,
  .overview-gallery-admin__footer {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  .overview-gallery-admin__toggle,
  .overview-gallery-admin__actions,
  .overview-gallery-admin__toolbar {
    width: 100%;
  }

  .image-preview-card {
    height: 170px;
  }

  .image-preview-card--overview-hero {
    height: 220px;
  }
}

.item-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.item-modal {
  width: min(100%, 880px);
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.24);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-modal__head {
  padding: 24px 32px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.workspace-header h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.1;
  color: #1a3353;
  font-weight: 500; /* Bỏ in đậm */
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
}

.item-modal__body {
  padding: 32px;
  overflow-y: auto;
  display: grid;
  gap: 20px;
}

.item-modal__footer {
  padding: 24px 32px;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.image-preview-card {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  background: #f1f5f9;
  overflow: hidden;
  margin-bottom: 16px;
}

.image-manager--banner-modal {
  padding: 22px;
}

.image-preview-card--banner-modal {
  min-height: 280px;
}

.image-preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-card__placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  color: #94a3b8;
}

.item-mini-thumb {
  width: 48px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 12px;
  background: #f1f5f9;
}
</style>
