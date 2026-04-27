<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  importAdminMediaAssetFromUrl,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/views/admin/shared/api/adminApi.js'
import { getBlockSchema, generateDynamicItemKey, makeDraftFromFields } from '@/views/admin/features/about/config/aboutBlockSchemas.js'
import CoreConfirmDialog from '@/views/admin/shared/components/CoreConfirmDialog.vue'
import { env } from '@/shared/config/env'
import {
  ABOUT_SECTION_LABEL_MAP,
  ABOUT_SECTION_PREVIEW_MAP,
  getAboutSectionFromBlockKey,
  resolveAboutBlockDisplayName,
  resolveAboutItemDisplayName,
} from '@/views/admin/shared/utils/entity-manager/constants.js'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const DEFAULT_CONFIRM_DIALOG = Object.freeze({
  tone: 'primary',
  eyebrow: 'Xác nhận thao tác',
  title: 'Bạn có chắc chắn muốn tiếp tục?',
  message: 'Thao tác sẽ được thực thi ngay sau khi bạn xác nhận.',
  confirmText: 'Xác nhận',
})

const loading = ref(false)
const savingKeys = ref(new Set())
const deletingKeys = ref(new Set())
const uploadingKeys = ref(new Set())
const items = ref([])
const blocks = ref([])
const mediaAssets = ref([])
const expandedSections = ref({})
const previewRefreshToken = ref(Date.now())
const itemDrafts = reactive({})
const newItemDrafts = reactive({})
const openNewItemEditors = reactive({})
const highlightedNewItemEditors = reactive({})
const pendingUploads = reactive({})
const avatarDragState = reactive({
  active: false,
  draft: null,
})
const activeSectionFilter = ref('all')
const completenessFilter = ref('all')
const keywordFilter = ref('')
const avatarFitOptions = [
  { value: 'cover', label: 'Crop đầy khung' },
  { value: 'contain', label: 'Hiển thị trọn ảnh' },
]

const confirmDialog = reactive({
  visible: false,
  ...DEFAULT_CONFIRM_DIALOG,
})
let confirmDialogResolver = null

const sectionAccentMap = {
  hero: 'accent-hero',
  company_introduction: 'accent-company',
  chairman_speech: 'accent-speech',
  organization_chart: 'accent-org',
  corporate_culture: 'accent-culture',
  development_course: 'accent-timeline',
  leadership_care: 'accent-leadership',
}

const sectionOrder = Object.keys(ABOUT_SECTION_LABEL_MAP)
const sectionPreviewPageMap = {
  hero: 'page1',
  company_introduction: 'page2',
  chairman_speech: 'page3',
  organization_chart: 'page4',
  corporate_culture: 'page5',
  development_course: 'page6',
  leadership_care: 'page7',
}

const sectionDefinitions = sectionOrder.map((key) => ({
  key,
  label: ABOUT_SECTION_LABEL_MAP[key],
  previewHref: ABOUT_SECTION_PREVIEW_MAP[key] || '',
  previewSectionId: sectionPreviewPageMap[key] || '',
  accentClass: sectionAccentMap[key] || 'accent-default',
}))

function normalizedToken() {
  return String(props.token || '').trim()
}

function clearNotify() {
  emit('clear-notify')
}

function notifySuccess(message) {
  emit('notify-success', message)
}

function notifyError(message) {
  emit('notify-error', message)
}

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function resolvePreviewUrl(path) {
  const normalizedPath = normalizeText(path)
  if (!normalizedPath) return ''

  const [rawPath, rawHash = ''] = normalizedPath.split('#')
  const hashSection = normalizeText(rawHash)
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : API_ORIGIN
  const absoluteUrl = /^https?:\/\//i.test(rawPath)
    ? new URL(rawPath)
    : new URL(rawPath.startsWith('/') ? rawPath : `/${rawPath}`, browserOrigin)

  absoluteUrl.searchParams.set('adminPreview', '1')
  if (hashSection) {
    absoluteUrl.searchParams.set('previewSection', hashSection)
    absoluteUrl.hash = hashSection
  }

  return absoluteUrl.toString()
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeMetadataObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...value }
    : {}
}

function clampFocusPercent(value, fallback = 50) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(100, Math.max(0, numeric))
}

function focusPresetToPercentPair(value) {
  const normalized = normalizeText(value).toLowerCase()
  if (normalized === 'top-left') return { x: 0, y: 0 }
  if (normalized === 'top-right') return { x: 100, y: 0 }
  if (normalized === 'bottom-left') return { x: 0, y: 100 }
  if (normalized === 'bottom-right') return { x: 100, y: 100 }
  return { x: 50, y: 50 }
}

function normalizeAvatarFitMode(value) {
  return normalizeText(value).toLowerCase() === 'contain' ? 'contain' : 'cover'
}

function resolveAvatarFocusPoint(draft) {
  const metadata = normalizeMetadataObject(draft?.metadata_json)
  const fallbackPreset = focusPresetToPercentPair(
    draft?.avatar_focus || metadata.avatar_focus,
  )

  return {
    x: clampFocusPercent(draft?.focus_x ?? metadata.focus_x, fallbackPreset.x),
    y: clampFocusPercent(draft?.focus_y ?? metadata.focus_y, fallbackPreset.y),
  }
}

function isLeadershipAvatarBlock(block) {
  return normalizeText(block?.block_key).toLowerCase() === 'leadership_care_gallery'
}

function hydrateAvatarDraftState(draft, block = null) {
  if (!draft) return draft
  const metadata = normalizeMetadataObject(draft.metadata_json)
  draft.metadata_json = metadata

  if (isLeadershipAvatarBlock(block) || normalizeText(draft.item_key).startsWith('leader_')) {
    const focusPoint = resolveAvatarFocusPoint({ ...draft, metadata_json: metadata })
    draft.focus_x = focusPoint.x
    draft.focus_y = focusPoint.y
    draft.avatar_fit = normalizeAvatarFitMode(draft.avatar_fit || metadata.avatar_fit)
  }

  return draft
}

function avatarPreviewImageStyle(draft) {
  const focusPoint = resolveAvatarFocusPoint(draft)
  return {
    objectFit: normalizeAvatarFitMode(draft?.avatar_fit),
    objectPosition: `${focusPoint.x}% ${focusPoint.y}%`,
  }
}

function avatarFocusIndicatorStyle(draft) {
  const focusPoint = resolveAvatarFocusPoint(draft)
  return {
    left: `${focusPoint.x}%`,
    top: `${focusPoint.y}%`,
  }
}

function onAvatarPreviewClick(draft, event) {
  if (!draft || !event?.currentTarget) return
  const rect = event.currentTarget.getBoundingClientRect()
  if (!rect.width || !rect.height) return

  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  draft.focus_x = clampFocusPercent(x)
  draft.focus_y = clampFocusPercent(y)
}

function onAvatarMarkerPointerMove(event) {
  if (!avatarDragState.active || !avatarDragState.draft) return
  onAvatarPreviewClick(avatarDragState.draft, event)
}

function stopAvatarMarkerDrag() {
  avatarDragState.active = false
  avatarDragState.draft = null
  window.removeEventListener('pointermove', onAvatarMarkerPointerMove)
  window.removeEventListener('pointerup', stopAvatarMarkerDrag)
}

function startAvatarMarkerDrag(draft, event) {
  if (!draft) return
  event.preventDefault()
  event.stopPropagation()
  avatarDragState.active = true
  avatarDragState.draft = draft
  onAvatarPreviewClick(draft, event)
  window.addEventListener('pointermove', onAvatarMarkerPointerMove)
  window.addEventListener('pointerup', stopAvatarMarkerDrag)
}

onBeforeUnmount(() => {
  stopAvatarMarkerDrag()
})

function setAvatarFitMode(draft, mode) {
  if (!draft) return
  draft.avatar_fit = normalizeAvatarFitMode(mode)
}

function isEmpty(value) {
  return !normalizeText(value)
}

function hasPrimaryContent(record) {
  return !isEmpty(record?.title) || !isEmpty(record?.subtitle) || !isEmpty(record?.content)
}

function hasImage(record) {
  return Boolean(record?.image_id || record?.image?.id || record?.image_url)
}

function hasLink(record) {
  return !isEmpty(record?.link)
}

function resolveRecordBlockKey(record) {
  const directBlockKey = normalizeText(record?.block_key).toLowerCase()
  if (directBlockKey) return directBlockKey

  const blockId = Number(record?.block_id || 0)
  if (!blockId) return ''

  const blockMeta = blocks.value.find((block) => Number(block?.id || 0) === blockId)
  return normalizeText(blockMeta?.block_key).toLowerCase()
}

function schemaFieldsForRecord(record) {
  const blockKey = resolveRecordBlockKey(record)
  if (!blockKey) return []

  const schema = getBlockSchema(blockKey)
  if (!schema) return []

  const itemKey = normalizeText(record?.item_key)
  const fixedEntry = (schema.fixedItems || []).find((item) => normalizeText(item?.itemKey) === itemKey)
  if (fixedEntry?.fields?.length) return fixedEntry.fields

  if (schema.dynamicItems?.fields?.length) return schema.dynamicItems.fields
  return []
}

function fieldsRequireImage(fields = []) {
  return Array.isArray(fields) && fields.some((field) => field?.type === 'image' && field?.required)
}

function hasRequiredContentBySchema(record) {
  const fields = schemaFieldsForRecord(record)
  const requiredNonImageFields = fields.filter((field) => field?.required && field?.key !== 'image_id')
  if (!requiredNonImageFields.length) {
    return hasPrimaryContent(record)
  }

  return requiredNonImageFields.every((field) => !isEmpty(record?.[field.key]))
}

function recordRequiresImage(record) {
  const fields = schemaFieldsForRecord(record)
  if (!fields.length) return false
  return fieldsRequireImage(fields)
}

function isRecordMissingContent(record) {
  return !hasRequiredContentBySchema(record)
}

function isRecordMissingImage(record) {
  return recordRequiresImage(record) && !hasImage(record)
}

function isRecordComplete(record) {
  const contentReady = hasRequiredContentBySchema(record)
  const imageReady = !recordRequiresImage(record) || hasImage(record)
  return contentReady && imageReady
}

function matchesCompleteness(record) {
  if (completenessFilter.value === 'missing_content') return isRecordMissingContent(record)
  if (completenessFilter.value === 'missing_image') return isRecordMissingImage(record)
  if (completenessFilter.value === 'missing_link') return !hasLink(record)
  if (completenessFilter.value === 'complete') return isRecordComplete(record)
  return true
}

function matchesKeyword(record, block) {
  const keyword = normalizeText(keywordFilter.value).toLowerCase()
  if (!keyword) return true
  const haystack = [
    record?.title,
    record?.subtitle,
    record?.content,
    record?.link,
    block?.title,
    block?.subtitle,
    block?.block_key,
    block?.block_type,
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ')
  return haystack.includes(keyword)
}

function matchesKeywordOnBlock(block) {
  const keyword = normalizeText(keywordFilter.value).toLowerCase()
  if (!keyword) return true
  const haystack = [
    block?.title,
    block?.subtitle,
    block?.content,
    block?.block_key,
    block?.block_type,
  ]
    .map((value) => String(value || '').toLowerCase())
    .join(' ')
  return haystack.includes(keyword)
}

function resetFilters() {
  activeSectionFilter.value = 'all'
  completenessFilter.value = 'all'
  keywordFilter.value = ''
}

function draftKeyForRecord(recordId) {
  return `record-${recordId}`
}

function draftKeyForFixed(blockId, itemKey) {
  return `fixed-${blockId}-${itemKey}`
}

function draftKeyForBlock(blockId) {
  return `new-${blockId}`
}

function ensureUploadState(key) {
  if (!pendingUploads[key]) {
    pendingUploads[key] = {
      mode: 'file',
      file: null,
      sourceUrl: '',
      previewUrl: '',
    }
  }
  return pendingUploads[key]
}

function revokeUploadPreview(previewUrl) {
  if (previewUrl && String(previewUrl).startsWith('blob:') && typeof URL !== 'undefined') {
    URL.revokeObjectURL(previewUrl)
  }
}

function resetUploadState(key) {
  const state = pendingUploads[key]
  if (!state) return
  revokeUploadPreview(state.previewUrl)
  delete pendingUploads[key]
}

function refreshSectionPreview() {
  previewRefreshToken.value = Date.now()
}

function mediaLabel(media) {
  const title = String(media?.title || media?.alt_text || media?.file_name || '').trim()
  return title ? `#${media.id} - ${title}` : `#${media?.id || '-'} - Media`
}

function getUploadState(key) {
  return ensureUploadState(key)
}

function hasPendingUpload(key) {
  const state = pendingUploads[key]
  if (!state) return false
  if (state.mode === 'url') return Boolean(normalizeText(state.sourceUrl))
  return Boolean(state.file)
}

function getPendingPreviewUrl(key, draft) {
  const state = pendingUploads[key]
  if (state?.previewUrl) return state.previewUrl
  return getDraftPreviewImageUrl(draft)
}

const mediaOptions = computed(() =>
  mediaAssets.value.map((media) => ({
    value: media.id,
    label: mediaLabel(media),
    previewUrl: resolveMediaUrl(media.url),
  })),
)

const mediaById = computed(() => {
  const map = new Map()
  mediaAssets.value.forEach((media) => {
    map.set(media.id, media)
  })
  return map
})

function getMediaPreview(imageId) {
  if (!imageId) return null
  return mediaById.value.get(Number(imageId)) || null
}

function getDraftPreviewImageUrl(draft) {
  const media = getMediaPreview(draft?.image_id)
  if (!media?.url) return ''
  return resolveMediaUrl(media.url)
}

function createBlankDraft(block, itemKey, sortOrder, fields) {
  return hydrateAvatarDraftState(makeDraftFromFields(fields, {
    block_id: block.id,
    block_key: block.block_key,
    item_key: itemKey,
    sort_order: sortOrder,
  }), block)
}

function ensureFixedDraft(block, itemDef, record) {
  const key = draftKeyForFixed(block.id, itemDef.itemKey)
  if (!itemDrafts[key]) {
    itemDrafts[key] = record
      ? hydrateAvatarDraftState(makeDraftFromFields(itemDef.fields, {
        ...record,
        block_key: block.block_key,
      }), block)
      : createBlankDraft(block, itemDef.itemKey, itemDef.sortOrder, itemDef.fields)
  }
  return itemDrafts[key]
}

function ensureRecordDraft(record, fields, block = null) {
  const key = draftKeyForRecord(record.id)
  if (!itemDrafts[key]) {
    itemDrafts[key] = hydrateAvatarDraftState(makeDraftFromFields(fields, {
      ...record,
      block_key: block?.block_key || record?.block_key,
    }), block)
  }
  return itemDrafts[key]
}

function getDraftByKey(key) {
  return itemDrafts[key]
}

function getNewDraft(blockId) {
  return newItemDrafts[draftKeyForBlock(blockId)]
}

function dynamicFieldsForBlock(block) {
  return block.schema?.dynamicItems?.fields || [
    { key: 'title', label: 'Tiêu đề', type: 'text' },
    { key: 'subtitle', label: 'Phụ đề', type: 'text' },
    { key: 'content', label: 'Nội dung', type: 'textarea' },
    { key: 'link', label: 'Liên kết', type: 'url' },
    { key: 'image_id', label: 'Hình ảnh', type: 'image' },
  ]
}

function fieldsContainImage(fields = []) {
  return Array.isArray(fields) && fields.some((field) => field?.type === 'image')
}

function fixedEntrySupportsImage(entry) {
  return fieldsContainImage(entry?.fields)
}

function dynamicBlockSupportsImage(block) {
  return fieldsContainImage(dynamicFieldsForBlock(block))
}

function isNewItemEditorOpen(blockId) {
  return Boolean(openNewItemEditors[draftKeyForBlock(blockId)])
}

function isNewItemEditorHighlighted(blockId) {
  return Boolean(highlightedNewItemEditors[draftKeyForBlock(blockId)])
}

function firstDynamicFieldKey(block) {
  const firstField = dynamicFieldsForBlock(block).find((field) => field?.key && field.type !== 'image')
  return firstField?.key || dynamicFieldsForBlock(block)[0]?.key || 'title'
}

async function openNewItemEditor(block) {
  const dynamicSchema = block.schema?.dynamicItems
  if (!dynamicSchema) {
    notifyError('Block này không hỗ trợ thêm item động.')
    return
  }

  const key = draftKeyForBlock(block.id)
  openNewItemEditors[key] = true
  highlightedNewItemEditors[key] = true

  if (!newItemDrafts[key]) {
    const newItemKey = generateDynamicItemKey(dynamicSchema.keyPrefix, block.dynamicRecords || [])
    const nextSortOrder = (block.dynamicRecords?.length || 0) * (dynamicSchema.sortOrderStep || 10) + 10
    newItemDrafts[key] = createBlankDraft(block, newItemKey, nextSortOrder, dynamicSchema.fields)
  }

  await nextTick()

  const editorElement = typeof document !== 'undefined' ? document.getElementById(`new-item-editor-${block.id}`) : null
  if (editorElement?.scrollIntoView) {
    editorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const focusTarget = typeof document !== 'undefined'
    ? document.getElementById(`new-${block.id}-${firstDynamicFieldKey(block)}`)
    : null
  if (focusTarget?.focus) {
    focusTarget.focus({ preventScroll: true })
  }

  window.setTimeout(() => {
    delete highlightedNewItemEditors[key]
  }, 2200)
}

function cancelNewItemEditor(blockId) {
  const key = draftKeyForBlock(blockId)
  delete openNewItemEditors[key]
  delete highlightedNewItemEditors[key]
  delete newItemDrafts[key]
  resetUploadState(key)
}

const ABOUT_SECTION_FOLDER_SLUGS = Object.freeze({
  hero: 'Hero_Banner',
  company_introduction: 'Gioi_Thieu_Cong_Ty',
  chairman_speech: 'Tam_Nhin_Su_Menh',
  organization_chart: 'So_Do_To_Chuc',
  corporate_culture: 'Gia_Tri_Cot_Loi',
  development_course: 'Lich_Su_Phat_Trien',
  leadership_care: 'Ban_Lanh_Dao',
})

function sanitizeFolderSegment(value, fallback = 'general') {
  const normalized = normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized || fallback
}

function resolveBlockMetaById(blockId) {
  return sectionCards.value
    .flatMap((section) => section.blocks || [])
    .find((block) => Number(block.id) === Number(blockId)) || null
}

function resolveAboutSectionSlug(blockOrDraft) {
  const blockMeta = blockOrDraft?.block_key
    ? blockOrDraft
    : resolveBlockMetaById(blockOrDraft?.block_id)

  const sectionKey = normalizeText(blockMeta?.sectionKey || getAboutSectionFromBlockKey(blockMeta?.block_key)).toLowerCase()
  const fixedSlug = ABOUT_SECTION_FOLDER_SLUGS[sectionKey]
  const fallbackSlug = sanitizeFolderSegment(ABOUT_SECTION_LABEL_MAP[sectionKey] || sectionKey || 'general', 'general')

  return fixedSlug || fallbackSlug
}

function resolveAboutAssetFolder(blockOrDraft) {
  return `China_web/About/${resolveAboutSectionSlug(blockOrDraft)}`
}

function resolveAboutPublicIdBase(blockOrDraft, draft) {
  const sectionSlug = resolveAboutSectionSlug(blockOrDraft)
  const itemKeySlug = sanitizeFolderSegment(draft?.item_key || 'about_media', 'about_media')
  return `${sectionSlug}_${itemKeySlug}`
}

function resolveAboutStorageTarget(blockOrDraft, draft) {
  const assetFolder = resolveAboutAssetFolder(blockOrDraft)
  const publicIdBase = resolveAboutPublicIdBase(blockOrDraft, draft)
  return `${assetFolder}/${publicIdBase}`
}

function isHeroCoverEntry(block, entry) {
  return normalizeText(block?.block_key).toLowerCase() === 'hero_summary' && normalizeText(entry?.itemKey) === 'cover_image'
}

function clearDraftImageSelection(draft, key) {
  if (!draft) return
  draft.image_id = null
  resetUploadState(key)
}

function resetDraftFromRecord(block, record, fields) {
  const key = record?.id ? draftKeyForRecord(record.id) : draftKeyForFixed(block.id, record?.item_key)
  if (!key) return
  itemDrafts[key] = hydrateAvatarDraftState(makeDraftFromFields(fields, {
    ...record,
    block_key: block?.block_key,
  }), block)
  resetUploadState(key)
}

function normalizeTimelineDateValue(value) {
  const raw = normalizeText(value)
  if (!raw) return ''

  const matched = raw.match(/^(\d{4})(?:[-/.](\d{1,2}))?(?:[-/.](\d{1,2}))?$/)
  if (!matched) return raw

  const year = matched[1]
  const month = matched[2] ? String(matched[2]).padStart(2, '0') : ''
  const day = matched[3] ? String(matched[3]).padStart(2, '0') : ''

  if (year && month && day) return `${year}-${month}-${day}`
  if (year && month) return `${year}-${month}`
  return year
}

function normalizeTimelineRangeValue(startValue, endValue) {
  return {
    start: normalizeTimelineDateValue(startValue),
    end: normalizeTimelineDateValue(endValue),
  }
}

function normalizePayload(draft) {
  const normalizedBlockKey = normalizeText(draft?.block_key).toLowerCase()
  const isTimelineBlock = normalizedBlockKey === 'timeline'
  const isLeadershipBlock = normalizedBlockKey === 'leadership_care_gallery'
  const timelineRange = isTimelineBlock
    ? normalizeTimelineRangeValue(draft.subtitle, draft.link)
    : null
  const metadata = normalizeMetadataObject(draft?.metadata_json)

  if (isLeadershipBlock) {
    const focusPoint = resolveAvatarFocusPoint(draft)
    metadata.focus_x = focusPoint.x
    metadata.focus_y = focusPoint.y
    metadata.avatar_fit = normalizeAvatarFitMode(draft.avatar_fit)
    delete metadata.avatar_focus
  }

  return {
    block_id: Number(draft.block_id),
    item_key: normalizeText(draft.item_key) || null,
    title: normalizeText(draft.title) || null,
    subtitle: isTimelineBlock ? timelineRange.start || null : normalizeText(draft.subtitle) || null,
    content: normalizeText(draft.content) || null,
    link: isTimelineBlock ? timelineRange.end || null : normalizeText(draft.link) || null,
    image_id: draft.image_id ? Number(draft.image_id) : null,
    metadata_json: Object.keys(metadata).length ? metadata : null,
    sort_order: Number(draft.sort_order || 0),
  }
}

function validateTimelineDate(value) {
  const raw = normalizeTimelineDateValue(value)
  if (!raw) return false
  return /^(\d{4})(?:[-/.](\d{1,2}))?(?:[-/.](\d{1,2}))?$/.test(raw)
}

function validateDraftAgainstFields(draft, fields, block) {
  if (!Number(draft.block_id)) return 'Thiếu block cha cho mục nội dung.'
  if (!normalizeText(draft.item_key)) return 'Hệ thống chưa sinh được khóa dữ liệu cho mục này.'

  for (const field of fields) {
    if (!field.required) continue

    if (field.key === 'image_id' && !draft.image_id) {
      return `Vui lòng chọn ${field.label.toLowerCase()}.`
    }

    if (field.key !== 'image_id' && isEmpty(draft[field.key])) {
      return `Vui lòng nhập ${field.label.toLowerCase()}.`
    }
  }

  if (block.block_key === 'timeline') {
    const hasStart = !isEmpty(draft.subtitle)
    const hasEnd = !isEmpty(draft.link)

    if (!hasStart && !hasEnd) {
      return 'Vui lòng chọn ít nhất một mốc thời gian.'
    }

    if (hasStart && !validateTimelineDate(draft.subtitle)) {
      return 'Mốc thời gian bắt đầu không hợp lệ.'
    }

    if (hasEnd && !validateTimelineDate(draft.link)) {
      return 'Mốc thời gian kết thúc không hợp lệ.'
    }
  }

  if (!hasPrimaryContent(draft) && !draft.image_id && !hasLink(draft)) {
    return 'Mục đang trống hoàn toàn. Hãy nhập ít nhất nội dung, ảnh hoặc liên kết.'
  }

  return ''
}

function addSavingKey(key) {
  const next = new Set(savingKeys.value)
  next.add(key)
  savingKeys.value = next
}

function removeSavingKey(key) {
  const next = new Set(savingKeys.value)
  next.delete(key)
  savingKeys.value = next
}

function addDeletingKey(key) {
  const next = new Set(deletingKeys.value)
  next.add(key)
  deletingKeys.value = next
}

function removeDeletingKey(key) {
  const next = new Set(deletingKeys.value)
  next.delete(key)
  deletingKeys.value = next
}

function addUploadingKey(key) {
  const next = new Set(uploadingKeys.value)
  next.add(key)
  uploadingKeys.value = next
}

function removeUploadingKey(key) {
  const next = new Set(uploadingKeys.value)
  next.delete(key)
  uploadingKeys.value = next
}

function timelineDatePrecision(value) {
  const normalized = normalizeTimelineDateValue(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return 'day'
  if (/^\d{4}-\d{2}$/.test(normalized)) return 'month'
  return 'year'
}

function timelinePickerValue(value, precision) {
  const normalized = normalizeTimelineDateValue(value)

  if (precision === 'day') {
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : ''
  }

  if (precision === 'month') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized.slice(0, 7)
    }
    return /^\d{4}-\d{2}$/.test(normalized) ? normalized : ''
  }

  return /^\d{4}/.test(normalized) ? normalized.slice(0, 4) : ''
}

function setTimelineDateByPrecision(draft, fieldKey, precision, value) {
  const normalized = normalizeText(value)
  if (!normalized) {
    draft[fieldKey] = ''
    return
  }

  if (precision === 'day') {
    draft[fieldKey] = normalizeTimelineDateValue(normalized)
    return
  }

  if (precision === 'month') {
    draft[fieldKey] = normalizeTimelineDateValue(normalized)
    return
  }

  draft[fieldKey] = normalizeTimelineDateValue(normalized.slice(0, 4))
}

function onTimelinePrecisionChange(draft, fieldKey, precision) {
  const current = normalizeTimelineDateValue(draft[fieldKey])
  const year = current.slice(0, 4)
  const month = current.slice(5, 7)
  const day = current.slice(8, 10)

  if (precision === 'day') {
    draft[fieldKey] = year && month && day
      ? `${year}-${month}-${day}`
      : year && month
        ? `${year}-${month}-01`
        : year
          ? `${year}-01-01`
          : ''
    return
  }

  if (precision === 'month') {
    draft[fieldKey] = year && month
      ? `${year}-${month}`
      : year
        ? `${year}-01`
        : ''
    return
  }

  draft[fieldKey] = year || ''
}

function isTimelineRangeField(field) {
  return field?.type === 'timeline_date_start' || field?.type === 'timeline_date_end'
}

function timelineFieldClass(field) {
  return {
    'schema-field--full': field.type === 'textarea' || field.type === 'url',
    'schema-field--timeline': isTimelineRangeField(field),
    'schema-field--timeline-start': field?.type === 'timeline_date_start',
    'schema-field--timeline-end': field?.type === 'timeline_date_end',
  }
}

function onChangeUploadMode(key, mode) {
  const state = ensureUploadState(key)
  state.mode = mode === 'url' ? 'url' : 'file'
  if (state.mode === 'url') {
    state.file = null
    revokeUploadPreview(state.previewUrl)
    state.previewUrl = normalizeText(state.sourceUrl)
  } else {
    state.sourceUrl = ''
    revokeUploadPreview(state.previewUrl)
    state.previewUrl = ''
  }
}

function onSelectUploadFile(key, event) {
  const state = ensureUploadState(key)
  const file = event.target.files?.[0] || null
  state.mode = 'file'
  state.file = file
  state.sourceUrl = ''
  revokeUploadPreview(state.previewUrl)
  state.previewUrl = file && typeof URL !== 'undefined' ? URL.createObjectURL(file) : ''
}

function onChangeUploadUrl(key, value) {
  const state = ensureUploadState(key)
  state.mode = 'url'
  state.file = null
  state.sourceUrl = normalizeText(value)
  revokeUploadPreview(state.previewUrl)
  state.previewUrl = state.sourceUrl
}

async function uploadImageForDraft(draft, key, options = {}) {
  const token = normalizedToken()
  if (!token) return false

  const state = ensureUploadState(key)
  const assetFolder = resolveAboutAssetFolder(options.block || draft)
  const publicIdBase = resolveAboutPublicIdBase(options.block || draft, draft)
  const metadata = {
    title: normalizeText(draft.title) || normalizeText(draft.item_key) || 'about-media',
    altText: normalizeText(draft.title) || normalizeText(draft.item_key) || 'about-media',
    assetFolder,
    publicIdBase,
  }

  addUploadingKey(key)
  try {
    let media = null
    if (state.mode === 'url') {
      if (!normalizeText(state.sourceUrl)) {
        notifyError('Vui lòng nhập URL ảnh trước khi tải lên.')
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

    draft.image_id = media.id
    resetUploadState(key)
    await loadMediaAssets()
    refreshSectionPreview()
    if (!options.silent) {
      notifySuccess('Đã tải ảnh lên và gán trực tiếp vào mục nội dung.')
    }
    return true
  } catch (error) {
    notifyError(error.message || 'Không thể tải ảnh lên cho mục nội dung.')
    return false
  } finally {
    removeUploadingKey(key)
  }
}

function closeConfirmDialog(result = false) {
  confirmDialog.visible = false
  if (typeof confirmDialogResolver === 'function') {
    confirmDialogResolver(Boolean(result))
    confirmDialogResolver = null
  }
}

function askForConfirmation(options = {}) {
  if (typeof confirmDialogResolver === 'function') {
    confirmDialogResolver(false)
    confirmDialogResolver = null
  }

  confirmDialog.tone = options.tone || DEFAULT_CONFIRM_DIALOG.tone
  confirmDialog.eyebrow = options.eyebrow || DEFAULT_CONFIRM_DIALOG.eyebrow
  confirmDialog.title = options.title || DEFAULT_CONFIRM_DIALOG.title
  confirmDialog.message = options.message || DEFAULT_CONFIRM_DIALOG.message
  confirmDialog.confirmText = options.confirmText || DEFAULT_CONFIRM_DIALOG.confirmText
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

async function listAllAdminEntityRecords(entityName, token, query = {}, options = {}) {
  const pageSize = Math.min(Math.max(Number(options.pageSize) || 100, 1), 100)
  const maxPages = Math.max(Number(options.maxPages) || 20, 1)
  const mergedItems = []
  let skip = 0

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const response = await listAdminEntityRecords(
      entityName,
      token,
      {
        ...query,
        skip,
        limit: pageSize,
      },
      options,
    )

    const pageItems = response?.items || []
    const total = Number(response?.pagination?.total || 0)
    mergedItems.push(...pageItems)

    skip += pageSize

    if (!pageItems.length || (total > 0 && mergedItems.length >= total) || pageItems.length < pageSize) {
      break
    }
  }

  return mergedItems
}

async function loadBlocks() {
  const token = normalizedToken()
  if (!token) return

  try {
    const records = await listAllAdminEntityRecords(
      'content_blocks',
      token,
      {},
      {
        pageSize: 100,
        maxPages: 4,
        timeoutMs: 45000,
      },
    )
    blocks.value = records.filter((block) => getAboutSectionFromBlockKey(block.block_key))
  } catch (error) {
    console.warn('[AboutManager] Không thể tải content_blocks, sẽ fallback từ content_block_items.', error)
    blocks.value = []
  }
}

async function loadItems() {
  const token = normalizedToken()
  if (!token) return

  const records = await listAllAdminEntityRecords(
    'content_block_items',
    token,
    {},
    {
      pageSize: 100,
      maxPages: 10,
      timeoutMs: 45000,
    },
  )

  items.value = records
  Object.keys(itemDrafts).forEach((key) => {
    delete itemDrafts[key]
  })
}

async function loadMediaAssets() {
  const token = normalizedToken()
  if (!token) return

  mediaAssets.value = await listAllAdminEntityRecords(
    'media_assets',
    token,
    {},
    {
      pageSize: 100,
      maxPages: 3,
      timeoutMs: 30000,
    },
  )
}

async function refreshAll() {
  const token = normalizedToken()
  if (!token) return

  loading.value = true
  clearNotify()
  try {
    const [blocksResult, itemsResult] = await Promise.allSettled([
      loadBlocks(),
      loadItems(),
    ])

    if (itemsResult.status === 'rejected') {
      throw itemsResult.reason
    }

    if (blocksResult.status === 'rejected') {
      console.warn('[AboutManager] loadBlocks rejected:', blocksResult.reason)
    }

    resetExpandedSections()

    loadMediaAssets().catch((error) => {
      console.warn('[AboutManager] loadMediaAssets rejected:', error)
      notifyError('Đã tải nội dung About, nhưng thư viện ảnh đang phản hồi chậm. Bạn vẫn có thể chỉnh sửa nội dung và thử tải ảnh lại sau.')
    })
  } catch (error) {
    notifyError(error.message || 'Không thể tải màn quản lý trang Giới thiệu.')
  } finally {
    loading.value = false
  }
}

async function saveDraft(draft, block, fieldDefs, options = {}) {
  const token = normalizedToken()
  if (!token) return false

  const key = options.key || `save-${Date.now()}`

  if (hasPendingUpload(key)) {
    const uploadSuccess = await uploadImageForDraft(draft, key, {
      silent: true,
      block,
    })
    if (!uploadSuccess) {
      notifyError('Không thể lưu vì ảnh mới chưa upload thành công.')
      return false
    }
  }

  const errorMessage = validateDraftAgainstFields(draft, fieldDefs, block)
  if (errorMessage) {
    notifyError(errorMessage)
    return false
  }

  const payload = normalizePayload(draft)
  addSavingKey(key)

  try {
    if (draft.id) {
      await updateAdminEntityRecord('content_block_items', draft.id, payload, token)
      if (!options.silent) {
        notifySuccess(`Đã cập nhật ${normalizeText(draft.title) || options.label || 'mục nội dung'}.`)
      }
    } else {
      await createAdminEntityRecord('content_block_items', payload, token)
      if (!options.silent) {
        notifySuccess(`Đã tạo ${normalizeText(draft.title) || options.label || 'mục nội dung'} mới.`)
      }
    }

    await loadItems()
    refreshSectionPreview()
    if (!draft.id && options.blockId) {
      cancelNewItemEditor(options.blockId)
    }
    return true
  } catch (error) {
    notifyError(error.message || 'Không thể lưu mục nội dung.')
    return false
  } finally {
    removeSavingKey(key)
  }
}

async function saveBlockChanges(block) {
  const operations = []

  for (const entry of block.fixedEntries || []) {
    const draft = ensureFixedDraft(block, entry, entry.record)
    operations.push(() =>
      saveDraft(draft, block, entry.fields, {
        key: draftKeyForFixed(block.id, entry.itemKey),
        label: entry.label,
        silent: true,
      }),
    )
  }

  for (const record of block.dynamicRecords || []) {
    const draft = ensureRecordDraft(record, dynamicFieldsForBlock(block))
    operations.push(() =>
      saveDraft(draft, block, dynamicFieldsForBlock(block), {
        key: draftKeyForRecord(record.id),
        label: recordDisplayName(record, block),
        silent: true,
      }),
    )
  }

  if (isNewItemEditorOpen(block.id) && getNewDraft(block.id)) {
    operations.push(() =>
      saveDraft(getNewDraft(block.id), block, dynamicFieldsForBlock(block), {
        key: draftKeyForBlock(block.id),
        blockId: block.id,
        label: block.schema?.dynamicItems?.label,
        silent: true,
      }),
    )
  }

  if (!operations.length) {
    notifyError('Block này chưa có dữ liệu để lưu nhanh.')
    return
  }

  let successCount = 0
  for (const operation of operations) {
    const success = await operation()
    if (!success) {
      notifyError(`Đã dừng lưu nhanh block "${block.blockLabel}" vì có mục không hợp lệ hoặc lưu thất bại.`)
      return
    }
    successCount += 1
  }

  notifySuccess(`Đã lưu nhanh ${successCount} mục trong block "${block.blockLabel}".`)
}

async function deleteItem(record, block) {
  const token = normalizedToken()
  if (!token) return

  const confirmed = await askForConfirmation({
    tone: 'danger',
    eyebrow: 'Xóa mục nội dung',
    title: 'Xác nhận xóa mục khỏi trang Giới thiệu?',
    message: `Mục "${recordDisplayName(record, block)}" sẽ bị xóa khỏi block "${block.blockLabel}".`,
    confirmText: 'Xóa mục',
  })
  if (!confirmed) return

  const key = draftKeyForRecord(record.id)
  addDeletingKey(key)
  try {
    await deleteAdminEntityRecord('content_block_items', record.id, token)
    notifySuccess('Đã xóa mục nội dung.')
    await loadItems()
  } catch (error) {
    notifyError(error.message || 'Không thể xóa mục nội dung.')
  } finally {
    removeDeletingKey(key)
  }
}

const sectionCards = computed(() => {
  const allowedSection = activeSectionFilter.value
  const blockMetaById = new Map(blocks.value.map((block) => [Number(block.id), block]))
  const shouldIncludeEmptyBlocks =
    completenessFilter.value === 'all' && !normalizeText(keywordFilter.value)

  return sectionDefinitions
    .filter((section) => allowedSection === 'all' || allowedSection === section.key)
    .map((section) => {
      const itemGroups = new Map()

      if (shouldIncludeEmptyBlocks) {
        blocks.value.forEach((blockMeta) => {
          const blockId = Number(blockMeta.id || 0)
          if (!blockId) return

          const sectionKey =
            normalizeText(blockMeta.section_key || getAboutSectionFromBlockKey(blockMeta.block_key)).toLowerCase()
          if (sectionKey !== section.key) return
          if (!matchesKeywordOnBlock(blockMeta)) return

          itemGroups.set(blockId, {
            id: blockId,
            block_key: normalizeText(blockMeta.block_key).toLowerCase(),
            block_type: blockMeta.block_type || '',
            title: blockMeta.title || blockMeta.block_key || `Block #${blockId}`,
            subtitle: blockMeta.subtitle || '',
            content: blockMeta.content || '',
            sort_order: Number(blockMeta.sort_order ?? 0),
            items: [],
          })
        })
      }

      items.value
        .filter((record) => matchesCompleteness(record))
        .forEach((record) => {
          const blockId = Number(record.block_id || 0)
          const blockMeta = blockMetaById.get(blockId) || null
          const blockKey = normalizeText(record.block_key || blockMeta?.block_key).toLowerCase()
          const inferredSectionKey =
            normalizeText(
              record.section_key || blockMeta?.section_key || getAboutSectionFromBlockKey(blockKey),
            ).toLowerCase()

          if (inferredSectionKey !== section.key) return
          if (!matchesKeyword(record, blockMeta || { block_key: blockKey, title: record.block_title })) return

          if (!itemGroups.has(blockId)) {
            itemGroups.set(blockId, {
              id: blockId,
              block_key: blockKey,
              block_type: record.block_type || blockMeta?.block_type || '',
              title: blockMeta?.title || record.block_title || record.title || blockKey,
              subtitle: blockMeta?.subtitle || '',
              content: blockMeta?.content || '',
              sort_order: Number(blockMeta?.sort_order ?? record.sort_order ?? 0),
              items: [],
            })
          }

          itemGroups.get(blockId).items.push(record)
        })

      const sectionBlocks = [...itemGroups.values()]
        .map((block) => {
          const schema = getBlockSchema(block.block_key)
          const blockItems = [...block.items].sort((a, b) => {
            const sortDelta = Number(a.sort_order || 0) - Number(b.sort_order || 0)
            if (sortDelta !== 0) return sortDelta
            return Number(a.id || 0) - Number(b.id || 0)
          })

          const fixedItemKeys = new Set((schema?.fixedItems || []).map((item) => item.itemKey))
          const fixedEntries = (schema?.fixedItems || []).map((itemDef) => ({
            ...itemDef,
            record: blockItems.find((record) => String(record.item_key || '') === itemDef.itemKey) || null,
          }))
          const dynamicRecords = blockItems.filter((record) => !fixedItemKeys.has(String(record.item_key || '')))

          return {
            ...block,
            sectionKey: section.key,
            blockLabel: resolveAboutBlockDisplayName(block.block_key, block.title || block.block_key),
            schema,
            allItems: blockItems,
            fixedEntries,
            dynamicRecords,
            counts: {
              total: blockItems.length,
              missingContent: blockItems.filter((record) => isRecordMissingContent(record)).length,
              missingImage: blockItems.filter((record) => isRecordMissingImage(record)).length,
              missingLink: blockItems.filter((record) => !hasLink(record)).length,
            },
          }
        })
        .sort((a, b) => {
          const sortDelta = Number(a.sort_order || 0) - Number(b.sort_order || 0)
          if (sortDelta !== 0) return sortDelta
          return Number(a.id || 0) - Number(b.id || 0)
        })

      const sectionItems = sectionBlocks.flatMap((block) => block.allItems)
      return {
        ...section,
        blocks: sectionBlocks,
        counts: {
          blocks: sectionBlocks.length,
          items: sectionItems.length,
          missingContent: sectionItems.filter((record) => isRecordMissingContent(record)).length,
          missingImage: sectionItems.filter((record) => isRecordMissingImage(record)).length,
          missingLink: sectionItems.filter((record) => !hasLink(record)).length,
        },
      }
    })
    .filter((section) => section.blocks.length > 0 || !keywordFilter.value.trim())
})

const dashboardSummary = computed(() => {
  const sectionTotal = sectionCards.value.length
  const blockTotal = sectionCards.value.reduce((sum, section) => sum + section.counts.blocks, 0)
  const itemTotal = sectionCards.value.reduce((sum, section) => sum + section.counts.items, 0)
  const missingImageTotal = sectionCards.value.reduce((sum, section) => sum + section.counts.missingImage, 0)
  return {
    sections: sectionTotal,
    blocks: blockTotal,
    items: itemTotal,
    missingImage: missingImageTotal,
  }
})

function resetExpandedSections() {
  expandedSections.value = sectionDefinitions.reduce((accumulator, section) => {
    accumulator[section.key] = false
    return accumulator
  }, {})
}

function isSectionExpanded(sectionKey) {
  return Boolean(expandedSections.value[sectionKey])
}

function toggleSection(sectionKey) {
  expandedSections.value = {
    ...expandedSections.value,
    [sectionKey]: !expandedSections.value[sectionKey],
  }
}

function expandAllSections() {
  resetExpandedSections()
}

function collapseAllSections() {
  expandedSections.value = sectionDefinitions.reduce((accumulator, section) => {
    accumulator[section.key] = false
    return accumulator
  }, {})
}

function recordDisplayName(record, block) {
  return (
    resolveAboutItemDisplayName({
      blockKey: block?.block_key,
      itemKey: record?.item_key,
      title: record?.title,
      includeBlockPrefix: false,
    }) || `Mục #${record?.id || 'new'}`
  )
}

function fieldPreviewText(field, draft) {
  if (!draft) return ''
  if (field.key === 'image_id') {
    return draft.image_id ? 'Đã có ảnh' : 'Chưa có ảnh'
  }
  return normalizeText(draft[field.key])
}

function fixedEntryStatus(block, entry) {
  if (!entry.record) return 'Chưa tạo dữ liệu'
  const record = {
    ...entry.record,
    block_key: normalizeText(entry.record?.block_key) || normalizeText(block?.block_key),
  }
  const contentReady = hasRequiredContentBySchema(record)
  const imageRequired = fieldsRequireImage(entry?.fields || [])
  const imageReady = !imageRequired || hasImage(record)

  if (!contentReady && !imageReady) return 'Thiếu dữ liệu chính'
  if (!contentReady) return 'Thiếu nội dung'
  if (!imageReady) return 'Thiếu ảnh'
  return 'Đủ dữ liệu'
}

watch(
  () => props.active,
  async (active) => {
    if (active && normalizedToken()) {
      await refreshAll()
    }
  },
  { immediate: true },
)

watch(
  () => props.token,
  async (token) => {
    if (String(token || '').trim() && props.active) {
      await refreshAll()
    }
  },
)
</script>

<template>
  <section class="about-admin-shell">
    <header class="about-admin-hero panel">
      <div class="about-admin-hero__copy">
        <p class="eyebrow">About CMS Workspace</p>
        <h1>Quản lý toàn bộ trang Giới thiệu theo section</h1>
        <p class="about-admin-hero__text">
          Bản 2 đã chuyển sang form nghiệp vụ theo từng block: admin gần như không còn phải nhìn
          thấy item_key kỹ thuật, chỉ tập trung vào nội dung thật sự của từng section.
        </p>
      </div>

      <div class="about-admin-hero__stats">
        <article class="hero-stat-card">
          <span class="hero-stat-card__label">Section</span>
          <strong>{{ dashboardSummary.sections }}</strong>
        </article>
        <article class="hero-stat-card">
          <span class="hero-stat-card__label">Block</span>
          <strong>{{ dashboardSummary.blocks }}</strong>
        </article>
        <article class="hero-stat-card">
          <span class="hero-stat-card__label">Item</span>
          <strong>{{ dashboardSummary.items }}</strong>
        </article>
        <article class="hero-stat-card hero-stat-card--warning">
          <span class="hero-stat-card__label">Thiếu ảnh</span>
          <strong>{{ dashboardSummary.missingImage }}</strong>
        </article>
      </div>
    </header>

    <section class="about-admin-toolbar panel">
      <div class="toolbar-grid">
        <label class="toolbar-field" for="about-section-filter">
          <span>Section</span>
          <select id="about-section-filter" v-model="activeSectionFilter">
            <option value="all">Tất cả section</option>
            <option v-for="section in sectionDefinitions" :key="section.key" :value="section.key">
              {{ section.label }}
            </option>
          </select>
        </label>

        <label class="toolbar-field" for="about-completeness-filter">
          <span>Trạng thái dữ liệu</span>
          <select id="about-completeness-filter" v-model="completenessFilter">
            <option value="all">Tất cả</option>
            <option value="missing_content">Thiếu nội dung</option>
            <option value="missing_image">Thiếu ảnh</option>
            <option value="missing_link">Thiếu link</option>
            <option value="complete">Đủ dữ liệu chính</option>
          </select>
        </label>

        <label class="toolbar-field toolbar-field--wide" for="about-keyword-filter">
          <span>Tìm theo nội dung</span>
          <input
            id="about-keyword-filter"
            v-model="keywordFilter"
            type="text"
            placeholder="Ví dụ: sứ mệnh, lịch sử, đối tác, tổng giám đốc..."
          />
        </label>
      </div>

      <div class="toolbar-actions">
        <button type="button" class="btn btn-secondary" @click="resetFilters">Reset filter</button>
        <button type="button" class="btn btn-secondary" @click="collapseAllSections">Thu gọn tất cả</button>
        <button type="button" class="btn btn-secondary" @click="expandAllSections">Mở tất cả</button>
        <button type="button" class="btn btn-primary" :disabled="loading" @click="refreshAll">
          {{ loading ? 'Đang tải...' : 'Làm mới dữ liệu' }}
        </button>
      </div>
    </section>

    <section v-if="loading" class="about-admin-empty panel">
      <h2>Đang tải workspace About...</h2>
      <p>Hệ thống đang dựng form chuyên biệt cho từng block nội dung.</p>
    </section>

    <section v-else-if="!sectionCards.length" class="about-admin-empty panel">
      <h2>Không có dữ liệu khớp bộ lọc</h2>
      <p>Hãy đổi filter hoặc làm mới dữ liệu để tiếp tục quản trị trang Giới thiệu.</p>
    </section>

    <section v-else class="about-admin-sections">
      <article
        v-for="section in sectionCards"
        :key="section.key"
        class="section-workspace panel"
        :class="section.accentClass"
        :id="`about-section-${section.key}`"
      >
        <header class="section-workspace__header">
          <div>
            <p class="eyebrow">{{ section.label }}</p>
            <h2>{{ section.label }}</h2>
            <p class="section-workspace__summary">
              {{ section.counts.blocks }} block · {{ section.counts.items }} item ·
              {{ section.counts.missingContent }} thiếu nội dung ·
              {{ section.counts.missingImage }} thiếu ảnh
            </p>
          </div>

          <div class="section-workspace__actions">
            <a
              v-if="section.previewHref"
              :href="section.previewHref"
              class="btn btn-ghost"
              target="_blank"
              rel="noreferrer"
            >
              Xem ngoài web
            </a>
            <button
              type="button"
              class="btn btn-secondary"
              :aria-expanded="isSectionExpanded(section.key)"
              @click="toggleSection(section.key)"
            >
              {{ isSectionExpanded(section.key) ? 'Thu gọn' : 'Mở section' }}
            </button>
          </div>
        </header>

        <div v-if="isSectionExpanded(section.key)" class="section-workspace__body">
          <div v-if="section.previewHref" class="section-live-preview">
            <div class="section-live-preview__header">
              <div>
                <p class="section-live-preview__eyebrow">Preview section hiện tại</p>
                <h3>Render đúng section public đang chỉnh sửa</h3>
                <p class="section-live-preview__description">
                  Khu này chỉ hiển thị dữ liệu của section hiện tại theo giao diện người dùng để đối chiếu trước khi lưu.
                </p>
              </div>
              <a
                :href="section.previewHref"
                class="btn btn-ghost"
                target="_blank"
                rel="noreferrer"
              >
                Mở preview lớn
              </a>
            </div>
            <iframe
              :key="`section-preview-${section.key}-${previewRefreshToken}`"
              class="section-live-preview__frame"
              :src="`${resolvePreviewUrl(section.previewHref)}${resolvePreviewUrl(section.previewHref).includes('?') ? '&' : '?'}previewTs=${previewRefreshToken}`"
              :title="`Preview tổng ${section.label}`"
              loading="lazy"
            />
          </div>
          <article
            v-for="block in section.blocks"
            :key="block.id"
            class="block-workspace"
            :class="section.accentClass"
          >
            <div class="block-workspace__head">
              <div>
                <p class="block-workspace__eyebrow">{{ block.blockLabel }}</p>
                <h3>{{ block.schema?.label || block.blockLabel }}</h3>
                <p class="block-workspace__meta">
                  {{ block.counts.total }} item · {{ block.counts.missingContent }} thiếu nội dung ·
                  {{ block.counts.missingImage }} thiếu ảnh · {{ block.counts.missingLink }} thiếu link
                </p>
                <p v-if="block.schema?.description" class="block-workspace__description">
                  {{ block.schema.description }}
                </p>
              </div>

              <div class="block-workspace__toolbar">
                <button type="button" class="btn btn-secondary" @click="saveBlockChanges(block)">
                  Lưu nhanh block
                </button>
                <button
                  v-if="block.schema?.dynamicItems"
                  type="button"
                  class="btn"
                  :class="isNewItemEditorOpen(block.id) ? 'btn-secondary' : 'btn-primary'"
                  @click="isNewItemEditorOpen(block.id) ? cancelNewItemEditor(block.id) : openNewItemEditor(block)"
                >
                  {{ isNewItemEditorOpen(block.id) ? 'Đóng tạo mới' : 'Tạo mới' }}
                </button>
              </div>
            </div>


            <div v-if="block.fixedEntries.length" class="fixed-entry-grid">
              <article
                v-for="entry in block.fixedEntries"
                :key="`${block.id}-${entry.itemKey}`"
                class="schema-card"
              >
                <div class="schema-card__header">
                  <div>
                    <p class="schema-card__eyebrow">Mục cố định</p>
                    <h4>{{ entry.label }}</h4>
                    <p v-if="entry.description" class="schema-card__description">{{ entry.description }}</p>
                  </div>
                  <span class="status-chip">{{ fixedEntryStatus(block, entry) }}</span>
                </div>

                <div class="schema-form-grid">
                  <template v-for="field in entry.fields" :key="`${entry.itemKey}-${field.key}`">
                    <label
                      class="schema-field"
                      :class="timelineFieldClass(field)"
                      :for="`fixed-${block.id}-${entry.itemKey}-${field.key}`"
                    >
                      <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>

                      <textarea
                        v-if="field.type === 'textarea'"
                        :id="`fixed-${block.id}-${entry.itemKey}-${field.key}`"
                        v-model="ensureFixedDraft(block, entry, entry.record)[field.key]"
                        rows="4"
                        :placeholder="field.placeholder || ''"
                      />

                      <div
                        v-else-if="field.type === 'timeline_date_start' || field.type === 'timeline_date_end'"
                        class="timeline-date-field"
                      >
                        <div class="timeline-date-field__header">
                          <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>
                        </div>
                        <div class="timeline-date-field__row">
                          <select
                            :value="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key])"
                            @change="onTimelinePrecisionChange(ensureFixedDraft(block, entry, entry.record), field.key, $event.target.value)"
                          >
                            <option value="year">Năm</option>
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                          </select>

                          <input
                            :id="`fixed-${block.id}-${entry.itemKey}-${field.key}`"
                            :type="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'day' ? 'date' : timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'month' ? 'month' : 'number'"
                            :min="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'year' ? '1900' : undefined"
                            :max="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'year' ? '2100' : undefined"
                            :value="timelinePickerValue(ensureFixedDraft(block, entry, entry.record)[field.key], timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]))"
                            @input="setTimelineDateByPrecision(ensureFixedDraft(block, entry, entry.record), field.key, timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]), $event.target.value)"
                          />
                        </div>
                      </div>

                      <div
                        v-else-if="field.type === 'timeline_date'"
                        class="timeline-date-field"
                      >
                        <div class="timeline-date-field__header">
                          <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>
                        </div>
                        <div class="timeline-date-field__row">
                          <select
                            :value="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key])"
                            @change="onTimelinePrecisionChange(ensureFixedDraft(block, entry, entry.record), field.key, $event.target.value)"
                          >
                            <option value="year">Năm</option>
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                          </select>

                          <input
                            :id="`fixed-${block.id}-${entry.itemKey}-${field.key}`"
                            :type="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'day' ? 'date' : timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'month' ? 'month' : 'number'"
                            :min="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'year' ? '1900' : undefined"
                            :max="timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]) === 'year' ? '2100' : undefined"
                            :value="timelinePickerValue(ensureFixedDraft(block, entry, entry.record)[field.key], timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]))"
                            :placeholder="field.placeholder || ''"
                            @input="setTimelineDateByPrecision(ensureFixedDraft(block, entry, entry.record), field.key, timelineDatePrecision(ensureFixedDraft(block, entry, entry.record)[field.key]), $event.target.value)"
                          />
                        </div>
                      </div>

                      <select
                        v-else-if="field.type === 'image' && !isHeroCoverEntry(block, entry)"
                        :id="`fixed-${block.id}-${entry.itemKey}-${field.key}`"
                        v-model="ensureFixedDraft(block, entry, entry.record).image_id"
                      >
                        <option :value="null">Chưa chọn ảnh</option>
                        <option v-for="media in mediaOptions" :key="media.value" :value="media.value">
                          {{ media.label }}
                        </option>
                      </select>

                      <div
                        v-else-if="field.type === 'image' && isHeroCoverEntry(block, entry) && getDraftPreviewImageUrl(ensureFixedDraft(block, entry, entry.record))"
                        class="field-image-preview field-image-preview--hero"
                      >
                        <img :src="getDraftPreviewImageUrl(ensureFixedDraft(block, entry, entry.record))" :alt="entry.label" />
                        <span>Ảnh bìa hiện tại của Hero Banner</span>
                      </div>

                      <div v-if="field.type === 'image' && !isHeroCoverEntry(block, entry) && getDraftPreviewImageUrl(ensureFixedDraft(block, entry, entry.record))" class="field-image-preview">
                        <img :src="getDraftPreviewImageUrl(ensureFixedDraft(block, entry, entry.record))" :alt="entry.label" />
                        <span>Xem nhanh ảnh đang gán cho mục này</span>
                      </div>

                      <input
                        v-else
                        :id="`fixed-${block.id}-${entry.itemKey}-${field.key}`"
                        v-model="ensureFixedDraft(block, entry, entry.record)[field.key]"
                        :type="field.type === 'url' ? 'url' : 'text'"
                        :placeholder="field.placeholder || ''"
                      />

                      <small v-if="field.helpText" class="field-help">{{ field.helpText }}</small>
                    </label>
                  </template>

                  <div v-if="fixedEntrySupportsImage(entry)" class="schema-field schema-field--full upload-inline">
                    <span>Upload ảnh mới</span>
                    <div class="upload-mode-switch">
                      <button
                        type="button"
                        class="btn btn-secondary btn-upload-mode"
                        :class="{ 'is-active': getUploadState(draftKeyForFixed(block.id, entry.itemKey)).mode === 'file' }"
                        @click="onChangeUploadMode(draftKeyForFixed(block.id, entry.itemKey), 'file')"
                      >
                        Chọn ảnh từ thư mục
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary btn-upload-mode"
                        :class="{ 'is-active': getUploadState(draftKeyForFixed(block.id, entry.itemKey)).mode === 'url' }"
                        @click="onChangeUploadMode(draftKeyForFixed(block.id, entry.itemKey), 'url')"
                      >
                        Nhập URL ảnh
                      </button>
                    </div>

                    <input
                      v-if="getUploadState(draftKeyForFixed(block.id, entry.itemKey)).mode === 'file'"
                      :id="`fixed-upload-${block.id}-${entry.itemKey}`"
                      type="file"
                      accept="image/*"
                      @change="onSelectUploadFile(draftKeyForFixed(block.id, entry.itemKey), $event)"
                    />

                    <input
                      v-else
                      :id="`fixed-upload-url-${block.id}-${entry.itemKey}`"
                      :value="getUploadState(draftKeyForFixed(block.id, entry.itemKey)).sourceUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      @input="onChangeUploadUrl(draftKeyForFixed(block.id, entry.itemKey), $event.target.value)"
                    />

                    <div class="upload-target-preview">
                      <span class="upload-target-preview__label">Lưu vào</span>
                      <code>{{ resolveAboutStorageTarget(block, ensureFixedDraft(block, entry, entry.record)) }}</code>
                    </div>

                    <div
                      v-if="getPendingPreviewUrl(draftKeyForFixed(block.id, entry.itemKey), ensureFixedDraft(block, entry, entry.record))"
                      class="field-image-preview"
                    >
                      <img
                        :src="getPendingPreviewUrl(draftKeyForFixed(block.id, entry.itemKey), ensureFixedDraft(block, entry, entry.record))"
                        :alt="entry.label"
                      />
                      <span>Xem nhanh ảnh sẽ được gán cho mục này</span>
                    </div>

                    <button
                      type="button"
                      class="btn btn-secondary"
                      :disabled="uploadingKeys.has(draftKeyForFixed(block.id, entry.itemKey))"
                      @click="uploadImageForDraft(getDraftByKey(draftKeyForFixed(block.id, entry.itemKey)), draftKeyForFixed(block.id, entry.itemKey), { block })"
                    >
                      {{ uploadingKeys.has(draftKeyForFixed(block.id, entry.itemKey)) ? 'Đang upload...' : 'Tải ảnh & gán vào mục' }}
                    </button>
                  </div>
                </div>

                <div class="schema-card__footer">
                  <div
                    v-if="fixedEntrySupportsImage(entry) && getMediaPreview(ensureFixedDraft(block, entry, entry.record).image_id)"
                    class="media-preview-chip"
                  >
                    <img
                      :src="resolveMediaUrl(getMediaPreview(ensureFixedDraft(block, entry, entry.record).image_id)?.url)"
                      :alt="entry.label"
                    />
                    <span>{{ mediaLabel(getMediaPreview(ensureFixedDraft(block, entry, entry.record).image_id)) }}</span>
                  </div>

                  <div class="schema-card__actions">
                    <button
                      v-if="entry.record"
                      type="button"
                      class="btn btn-ghost"
                      @click="resetDraftFromRecord(block, entry.record, entry.fields)"
                    >
                      Khôi phục
                    </button>
                    <button
                      v-if="fixedEntrySupportsImage(entry) && ensureFixedDraft(block, entry, entry.record).image_id"
                      type="button"
                      class="btn btn-ghost"
                      @click="clearDraftImageSelection(ensureFixedDraft(block, entry, entry.record), draftKeyForFixed(block.id, entry.itemKey))"
                    >
                      Xóa ảnh bìa hiện tại
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary"
                      :disabled="savingKeys.has(draftKeyForFixed(block.id, entry.itemKey))"
                      @click="saveDraft(ensureFixedDraft(block, entry, entry.record), block, entry.fields, { key: draftKeyForFixed(block.id, entry.itemKey), label: entry.label })"
                    >
                      {{ savingKeys.has(draftKeyForFixed(block.id, entry.itemKey)) ? 'Đang lưu...' : entry.record ? 'Lưu thay đổi' : 'Tạo dữ liệu' }}
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-if="block.schema?.dynamicItems && isNewItemEditorOpen(block.id) && getNewDraft(block.id)"
              :id="`new-item-editor-${block.id}`"
              class="new-item-panel"
              :class="{ 'new-item-panel--highlight': isNewItemEditorHighlighted(block.id) }"
            >
              <div class="new-item-panel__header">
                <div>
                  <p class="schema-card__eyebrow">Tạo mục động mới</p>
                  <h4>{{ block.schema?.dynamicItems?.label || 'Item mới' }}</h4>
                  <p class="new-item-panel__description">
                    Form tạo nhanh hiển thị tạm thời. Nếu chưa dùng tới, bạn có thể đóng lại ngay.
                  </p>
                </div>

                <div class="new-item-panel__header-actions">
                  <span class="status-chip status-chip--creating">
                    {{ isNewItemEditorHighlighted(block.id) ? 'Đang tạo mới' : 'Form tạm thời' }}
                  </span>
                  <button
                    type="button"
                    class="btn btn-ghost new-item-panel__close"
                    @click="cancelNewItemEditor(block.id)"
                  >
                    Tắt form
                  </button>
                </div>
              </div>

              <div class="new-item-panel__body">
                <div class="schema-form-grid schema-form-grid--compact">
                  <template v-for="field in dynamicFieldsForBlock(block)" :key="`${block.id}-new-${field.key}`">
                    <label
                      class="schema-field"
                      :class="timelineFieldClass(field)"
                      :for="`new-${block.id}-${field.key}`"
                    >
                      <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>

                      <textarea
                        v-if="field.type === 'textarea'"
                        :id="`new-${block.id}-${field.key}`"
                        v-model="getNewDraft(block.id)[field.key]"
                        rows="4"
                        :placeholder="field.placeholder || ''"
                      />

                      <div
                        v-else-if="field.type === 'timeline_date_start' || field.type === 'timeline_date_end'"
                        class="timeline-date-field"
                      >
                        <div class="timeline-date-field__header">
                          <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>
                        </div>
                        <div class="timeline-date-field__row">
                          <select
                            :value="timelineDatePrecision(getNewDraft(block.id)[field.key])"
                            @change="onTimelinePrecisionChange(getNewDraft(block.id), field.key, $event.target.value)"
                          >
                            <option value="year">Năm</option>
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                          </select>

                          <input
                            :id="`new-${block.id}-${field.key}`"
                            :type="timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'day' ? 'date' : timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'month' ? 'month' : 'number'"
                            :min="timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'year' ? '1900' : undefined"
                            :max="timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'year' ? '2100' : undefined"
                            :value="timelinePickerValue(getNewDraft(block.id)[field.key], timelineDatePrecision(getNewDraft(block.id)[field.key]))"
                            @input="setTimelineDateByPrecision(getNewDraft(block.id), field.key, timelineDatePrecision(getNewDraft(block.id)[field.key]), $event.target.value)"
                          />
                        </div>
                      </div>

                      <div
                        v-else-if="field.type === 'timeline_date'"
                        class="timeline-date-field"
                      >
                        <div class="timeline-date-field__header">
                          <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>
                        </div>
                        <div class="timeline-date-field__row">
                          <select
                            :value="timelineDatePrecision(getNewDraft(block.id)[field.key])"
                            @change="onTimelinePrecisionChange(getNewDraft(block.id), field.key, $event.target.value)"
                          >
                            <option value="year">Năm</option>
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                          </select>

                          <input
                            :id="`new-${block.id}-${field.key}`"
                            :type="timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'day' ? 'date' : timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'month' ? 'month' : 'number'"
                            :min="timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'year' ? '1900' : undefined"
                            :max="timelineDatePrecision(getNewDraft(block.id)[field.key]) === 'year' ? '2100' : undefined"
                            :value="timelinePickerValue(getNewDraft(block.id)[field.key], timelineDatePrecision(getNewDraft(block.id)[field.key]))"
                            :placeholder="field.placeholder || ''"
                            @input="setTimelineDateByPrecision(getNewDraft(block.id), field.key, timelineDatePrecision(getNewDraft(block.id)[field.key]), $event.target.value)"
                          />
                        </div>
                      </div>

                      <select
                        v-else-if="field.type === 'image'"
                        :id="`new-${block.id}-${field.key}`"
                        v-model="getNewDraft(block.id).image_id"
                      >
                        <option :value="null">Chưa chọn ảnh</option>
                        <option v-for="media in mediaOptions" :key="media.value" :value="media.value">
                          {{ media.label }}
                        </option>
                      </select>

                      <div v-if="field.type === 'image' && getDraftPreviewImageUrl(getNewDraft(block.id))" class="field-image-preview field-image-preview--avatar">
                        <img :src="getDraftPreviewImageUrl(getNewDraft(block.id))" :alt="block.schema?.dynamicItems?.label || 'Preview ảnh mới'" :style="isLeadershipAvatarBlock(block) ? avatarPreviewImageStyle(getNewDraft(block.id)) : undefined" />
                        <span>Xem nhanh ảnh đang gán cho mục mới</span>
                      </div>

                      <div v-if="field.type === 'image' && isLeadershipAvatarBlock(block)" class="avatar-focus-panel">
                        <div class="avatar-focus-panel__header">
                          <span>Chạm trực tiếp lên ảnh để căn avatar</span>
                          <small>Click vào vùng bạn muốn ưu tiên hiển thị. Chấm tròn sẽ là tâm crop của ảnh.</small>
                        </div>

                        <button
                          v-if="getDraftPreviewImageUrl(getNewDraft(block.id))"
                          type="button"
                          class="avatar-focus-stage"
                          @click="onAvatarPreviewClick(getNewDraft(block.id), $event)"
                        >
                          <img
                            :src="getDraftPreviewImageUrl(getNewDraft(block.id))"
                            :alt="block.schema?.dynamicItems?.label || 'Preview ảnh mới'"
                            :style="avatarPreviewImageStyle(getNewDraft(block.id))"
                          />
                          <span
                            class="avatar-focus-stage__marker"
                            :style="avatarFocusIndicatorStyle(getNewDraft(block.id))"
                            @pointerdown="startAvatarMarkerDrag(getNewDraft(block.id), $event)"
                          ></span>
                        </button>

                        <div class="avatar-focus-panel__meta">
                          <span>X: {{ Math.round(resolveAvatarFocusPoint(getNewDraft(block.id)).x) }}%</span>
                          <span>Y: {{ Math.round(resolveAvatarFocusPoint(getNewDraft(block.id)).y) }}%</span>
                        </div>

                        <div class="avatar-fit-toggle">
                          <button
                            v-for="mode in avatarFitOptions"
                            :key="`${block.id}-${mode.value}`"
                            type="button"
                            class="avatar-fit-toggle__btn"
                            :class="{ 'is-active': normalizeAvatarFitMode(getNewDraft(block.id).avatar_fit) === mode.value }"
                            @click="setAvatarFitMode(getNewDraft(block.id), mode.value)"
                          >
                            {{ mode.label }}
                          </button>
                        </div>

                        <button
                          type="button"
                          class="btn btn-primary avatar-focus-panel__save"
                          :disabled="savingKeys.has(draftKeyForBlock(block.id))"
                          @click="saveDraft(getNewDraft(block.id), block, dynamicFieldsForBlock(block), { key: draftKeyForBlock(block.id), blockId: block.id, label: block.schema?.dynamicItems?.label })"
                        >
                          {{ savingKeys.has(draftKeyForBlock(block.id)) ? 'Đang lưu...' : 'Lưu căn ảnh' }}
                        </button>
                      </div>

                      <input
                        v-else
                        :id="`new-${block.id}-${field.key}`"
                        v-model="getNewDraft(block.id)[field.key]"
                        :type="field.type === 'url' ? 'url' : 'text'"
                        :placeholder="field.placeholder || ''"
                      />

                      <small v-if="field.helpText" class="field-help">{{ field.helpText }}</small>
                    </label>
                  </template>

                  <div v-if="dynamicBlockSupportsImage(block)" class="schema-field schema-field--full upload-inline new-item-panel__upload">
                    <span>Upload ảnh mới</span>
                    <div class="upload-mode-switch">
                      <button
                        type="button"
                        class="btn btn-secondary btn-upload-mode"
                        :class="{ 'is-active': getUploadState(draftKeyForBlock(block.id)).mode === 'file' }"
                        @click="onChangeUploadMode(draftKeyForBlock(block.id), 'file')"
                      >
                        Chọn ảnh từ thư mục
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary btn-upload-mode"
                        :class="{ 'is-active': getUploadState(draftKeyForBlock(block.id)).mode === 'url' }"
                        @click="onChangeUploadMode(draftKeyForBlock(block.id), 'url')"
                      >
                        Nhập URL ảnh
                      </button>
                    </div>

                    <input
                      v-if="getUploadState(draftKeyForBlock(block.id)).mode === 'file'"
                      :id="`new-upload-${block.id}`"
                      type="file"
                      accept="image/*"
                      @change="onSelectUploadFile(draftKeyForBlock(block.id), $event)"
                    />

                    <input
                      v-else
                      :id="`new-upload-url-${block.id}`"
                      :value="getUploadState(draftKeyForBlock(block.id)).sourceUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      @input="onChangeUploadUrl(draftKeyForBlock(block.id), $event.target.value)"
                    />

                    <div class="upload-target-preview">
                      <span class="upload-target-preview__label">Lưu vào</span>
                      <code>{{ resolveAboutStorageTarget(block, getNewDraft(block.id)) }}</code>
                    </div>

                    <div v-if="getPendingPreviewUrl(draftKeyForBlock(block.id), getNewDraft(block.id))" class="field-image-preview">
                      <img :src="getPendingPreviewUrl(draftKeyForBlock(block.id), getNewDraft(block.id))" :alt="block.schema?.dynamicItems?.label || 'Preview ảnh mới'" />
                      <span>Xem nhanh ảnh sẽ được gán cho mục mới</span>
                    </div>

                    <button
                      type="button"
                      class="btn btn-secondary"
                      :disabled="uploadingKeys.has(draftKeyForBlock(block.id))"
                      @click="uploadImageForDraft(getNewDraft(block.id), draftKeyForBlock(block.id), { block })"
                    >
                      {{ uploadingKeys.has(draftKeyForBlock(block.id)) ? 'Đang upload...' : 'Tải ảnh & gán vào mục' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="new-item-panel__footer">
                <button type="button" class="btn btn-secondary" @click="cancelNewItemEditor(block.id)">
                  Hủy tạo mới
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="savingKeys.has(draftKeyForBlock(block.id))"
                  @click="saveDraft(getNewDraft(block.id), block, dynamicFieldsForBlock(block), { key: draftKeyForBlock(block.id), blockId: block.id, label: block.schema?.dynamicItems?.label })"
                >
                  {{ savingKeys.has(draftKeyForBlock(block.id)) ? 'Đang lưu...' : 'Tạo mục mới' }}
                </button>
              </div>
            </div>

            <div v-if="block.dynamicRecords.length" class="dynamic-entry-grid">
              <article
                v-for="record in block.dynamicRecords"
                :key="record.id"
                class="schema-card"
              >
                <div class="schema-card__header">
                  <div>
                    <p class="schema-card__eyebrow">Mục động</p>
                    <h4>{{ recordDisplayName(record, block) }}</h4>
                    <p class="schema-card__description">{{ record.subtitle || 'Chưa có phụ đề' }}</p>
                  </div>
                  <span class="status-chip">{{ hasPrimaryContent(record) ? 'Có nội dung' : 'Thiếu nội dung' }}</span>
                </div>

                <div class="schema-form-grid">
                  <template
                    v-for="field in dynamicFieldsForBlock(block)"
                    :key="`${record.id}-${field.key}`"
                  >
                    <label
                      class="schema-field"
                      :class="timelineFieldClass(field)"
                      :for="`record-${record.id}-${field.key}`"
                    >
                      <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>

                      <textarea
                        v-if="field.type === 'textarea'"
                        :id="`record-${record.id}-${field.key}`"
                        v-model="ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]"
                        rows="4"
                        :placeholder="field.placeholder || ''"
                      />

                      <div
                        v-else-if="field.type === 'timeline_date_start' || field.type === 'timeline_date_end'"
                        class="timeline-date-field"
                      >
                        <div class="timeline-date-field__header">
                          <span v-if="!isTimelineRangeField(field)">{{ field.label }}</span>
                        </div>
                        <div class="timeline-date-field__row">
                          <select
                            :value="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key])"
                            @change="onTimelinePrecisionChange(ensureRecordDraft(record, dynamicFieldsForBlock(block)), field.key, $event.target.value)"
                          >
                            <option value="year">Năm</option>
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                          </select>

                          <input
                            :id="`record-${record.id}-${field.key}`"
                            :type="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'day' ? 'date' : timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'month' ? 'month' : 'number'"
                            :min="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'year' ? '1900' : undefined"
                            :max="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'year' ? '2100' : undefined"
                            :value="timelinePickerValue(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key], timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]))"
                            @input="setTimelineDateByPrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block)), field.key, timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]), $event.target.value)"
                          />
                        </div>
                      </div>

                      <div
                        v-else-if="field.type === 'timeline_date'"
                        class="timeline-date-field"
                      >
                        <div class="timeline-date-field__header">
                          <span>{{ field.label }}</span>
                        </div>
                        <div class="timeline-date-field__row">
                          <select
                            :value="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key])"
                            @change="onTimelinePrecisionChange(ensureRecordDraft(record, dynamicFieldsForBlock(block)), field.key, $event.target.value)"
                          >
                            <option value="year">Năm</option>
                            <option value="month">Tháng</option>
                            <option value="day">Ngày</option>
                          </select>

                          <input
                            :id="`record-${record.id}-${field.key}`"
                            :type="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'day' ? 'date' : timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'month' ? 'month' : 'number'"
                            :min="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'year' ? '1900' : undefined"
                            :max="timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]) === 'year' ? '2100' : undefined"
                            :value="timelinePickerValue(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key], timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]))"
                            :placeholder="field.placeholder || ''"
                            @input="setTimelineDateByPrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block)), field.key, timelineDatePrecision(ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]), $event.target.value)"
                          />
                        </div>
                      </div>

                      <select
                        v-else-if="field.type === 'image'"
                        :id="`record-${record.id}-${field.key}`"
                        v-model="ensureRecordDraft(record, dynamicFieldsForBlock(block)).image_id"
                      >
                        <option :value="null">Chưa chọn ảnh</option>
                        <option v-for="media in mediaOptions" :key="media.value" :value="media.value">
                          {{ media.label }}
                        </option>
                      </select>

                      <div v-if="field.type === 'image' && getDraftPreviewImageUrl(ensureRecordDraft(record, dynamicFieldsForBlock(block), block))" class="field-image-preview field-image-preview--avatar">
                        <img :src="getDraftPreviewImageUrl(ensureRecordDraft(record, dynamicFieldsForBlock(block), block))" :alt="recordDisplayName(record, block)" :style="isLeadershipAvatarBlock(block) ? avatarPreviewImageStyle(ensureRecordDraft(record, dynamicFieldsForBlock(block), block)) : undefined" />
                        <span>Xem nhanh ảnh đang gán cho mục này</span>
                      </div>

                      <div v-if="field.type === 'image' && isLeadershipAvatarBlock(block)" class="avatar-focus-panel">
                        <div class="avatar-focus-panel__header">
                          <span>Chạm trực tiếp lên ảnh để căn avatar</span>
                          <small>Click vào đúng vị trí gương mặt/chủ thể, sau đó bấm lưu căn ảnh.</small>
                        </div>

                        <button
                          v-if="getDraftPreviewImageUrl(ensureRecordDraft(record, dynamicFieldsForBlock(block), block))"
                          type="button"
                          class="avatar-focus-stage"
                          @click="onAvatarPreviewClick(ensureRecordDraft(record, dynamicFieldsForBlock(block), block), $event)"
                        >
                          <img
                            :src="getDraftPreviewImageUrl(ensureRecordDraft(record, dynamicFieldsForBlock(block), block))"
                            :alt="recordDisplayName(record, block)"
                            :style="avatarPreviewImageStyle(ensureRecordDraft(record, dynamicFieldsForBlock(block), block))"
                          />
                          <span
                            class="avatar-focus-stage__marker"
                            :style="avatarFocusIndicatorStyle(ensureRecordDraft(record, dynamicFieldsForBlock(block), block))"
                            @pointerdown="startAvatarMarkerDrag(ensureRecordDraft(record, dynamicFieldsForBlock(block), block), $event)"
                          ></span>
                        </button>

                        <div class="avatar-focus-panel__meta">
                          <span>X: {{ Math.round(resolveAvatarFocusPoint(ensureRecordDraft(record, dynamicFieldsForBlock(block), block)).x) }}%</span>
                          <span>Y: {{ Math.round(resolveAvatarFocusPoint(ensureRecordDraft(record, dynamicFieldsForBlock(block), block)).y) }}%</span>
                        </div>

                        <div class="avatar-fit-toggle">
                          <button
                            v-for="mode in avatarFitOptions"
                            :key="`${record.id}-${mode.value}`"
                            type="button"
                            class="avatar-fit-toggle__btn"
                            :class="{ 'is-active': normalizeAvatarFitMode(ensureRecordDraft(record, dynamicFieldsForBlock(block), block).avatar_fit) === mode.value }"
                            @click="setAvatarFitMode(ensureRecordDraft(record, dynamicFieldsForBlock(block), block), mode.value)"
                          >
                            {{ mode.label }}
                          </button>
                        </div>

                        <button
                          type="button"
                          class="btn btn-primary avatar-focus-panel__save"
                          :disabled="savingKeys.has(draftKeyForRecord(record.id))"
                          @click="saveDraft(ensureRecordDraft(record, dynamicFieldsForBlock(block), block), block, dynamicFieldsForBlock(block), { key: draftKeyForRecord(record.id), label: recordDisplayName(record, block) })"
                        >
                          {{ savingKeys.has(draftKeyForRecord(record.id)) ? 'Đang lưu...' : 'Lưu căn ảnh' }}
                        </button>
                      </div>

                      <input
                        v-else
                        :id="`record-${record.id}-${field.key}`"
                        v-model="ensureRecordDraft(record, dynamicFieldsForBlock(block))[field.key]"
                        :type="field.type === 'url' ? 'url' : 'text'"
                        :placeholder="field.placeholder || ''"
                      />

                      <small v-if="field.helpText" class="field-help">{{ field.helpText }}</small>
                    </label>
                  </template>

                  <div v-if="dynamicBlockSupportsImage(block)" class="schema-field schema-field--full upload-inline">
                    <span>Upload ảnh mới</span>
                    <div class="upload-mode-switch">
                      <button
                        type="button"
                        class="btn btn-secondary btn-upload-mode"
                        :class="{ 'is-active': getUploadState(draftKeyForRecord(record.id)).mode === 'file' }"
                        @click="onChangeUploadMode(draftKeyForRecord(record.id), 'file')"
                      >
                        Chọn ảnh từ thư mục
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary btn-upload-mode"
                        :class="{ 'is-active': getUploadState(draftKeyForRecord(record.id)).mode === 'url' }"
                        @click="onChangeUploadMode(draftKeyForRecord(record.id), 'url')"
                      >
                        Nhập URL ảnh
                      </button>
                    </div>

                    <input
                      v-if="getUploadState(draftKeyForRecord(record.id)).mode === 'file'"
                      :id="`record-upload-${record.id}`"
                      type="file"
                      accept="image/*"
                      @change="onSelectUploadFile(draftKeyForRecord(record.id), $event)"
                    />

                    <input
                      v-else
                      :id="`record-upload-url-${record.id}`"
                      :value="getUploadState(draftKeyForRecord(record.id)).sourceUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      @input="onChangeUploadUrl(draftKeyForRecord(record.id), $event.target.value)"
                    />

                    <div class="upload-target-preview">
                      <span class="upload-target-preview__label">Lưu vào</span>
                      <code>{{ resolveAboutStorageTarget(block, ensureRecordDraft(record, dynamicFieldsForBlock(block))) }}</code>
                    </div>

                    <div
                      v-if="getPendingPreviewUrl(draftKeyForRecord(record.id), ensureRecordDraft(record, dynamicFieldsForBlock(block)))"
                      class="field-image-preview"
                    >
                      <img
                        :src="getPendingPreviewUrl(draftKeyForRecord(record.id), ensureRecordDraft(record, dynamicFieldsForBlock(block)))"
                        :alt="recordDisplayName(record, block)"
                      />
                      <span>Xem nhanh ảnh sẽ được gán cho mục này</span>
                    </div>

                    <button
                      type="button"
                      class="btn btn-secondary"
                      :disabled="uploadingKeys.has(draftKeyForRecord(record.id))"
                      @click="uploadImageForDraft(getDraftByKey(draftKeyForRecord(record.id)), draftKeyForRecord(record.id), { block })"
                    >
                      {{ uploadingKeys.has(draftKeyForRecord(record.id)) ? 'Đang upload...' : 'Tải ảnh & gán vào mục' }}
                    </button>
                  </div>
                </div>

                <div class="schema-card__footer">
                  <div v-if="dynamicBlockSupportsImage(block) && getMediaPreview(ensureRecordDraft(record, dynamicFieldsForBlock(block)).image_id)" class="media-preview-chip">
                    <img
                      :src="resolveMediaUrl(getMediaPreview(ensureRecordDraft(record, dynamicFieldsForBlock(block)).image_id)?.url)"
                      :alt="recordDisplayName(record, block)"
                    />
                    <span>{{ mediaLabel(getMediaPreview(ensureRecordDraft(record, dynamicFieldsForBlock(block)).image_id)) }}</span>
                  </div>

                  <div class="schema-card__actions">
                    <button
                      type="button"
                      class="btn btn-ghost"
                      @click="resetDraftFromRecord(block, record, dynamicFieldsForBlock(block))"
                    >
                      Khôi phục
                    </button>
                    <button
                      type="button"
                      class="btn btn-danger"
                      :disabled="deletingKeys.has(draftKeyForRecord(record.id))"
                      @click="deleteItem(record, block)"
                    >
                      {{ deletingKeys.has(draftKeyForRecord(record.id)) ? 'Đang xóa...' : 'Xóa mục' }}
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary"
                      :disabled="savingKeys.has(draftKeyForRecord(record.id))"
                      @click="saveDraft(getDraftByKey(draftKeyForRecord(record.id)), block, dynamicFieldsForBlock(block), { key: draftKeyForRecord(record.id), label: recordDisplayName(record, block) })"
                    >
                      {{ savingKeys.has(draftKeyForRecord(record.id)) ? 'Đang lưu...' : 'Lưu thay đổi' }}
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <div
              v-if="!block.fixedEntries.length && !block.dynamicRecords.length && !block.schema?.dynamicItems"
              class="block-workspace__empty"
            >
              Block này chưa có schema chuyên biệt hoặc chưa có dữ liệu.
            </div>
          </article>
        </div>
      </article>
    </section>

    <CoreConfirmDialog
      :visible="confirmDialog.visible"
      :dialog="confirmDialog"
      confirm-button-class="btn btn-danger"
      @cancel="cancelConfirmDialog"
      @accept="acceptConfirmDialog"
    />
  </section>
</template>

<style scoped>
.about-admin-shell {
  display: grid;
  gap: 24px;
}

.panel {
  position: relative;
  overflow: hidden;
  border: 1px solid #dbe6f3;
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(77, 147, 255, 0.12), transparent 30%),
    linear-gradient(180deg, #ffffff, #f8fbff);
  box-shadow:
    0 20px 44px rgba(31, 55, 90, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.eyebrow,
.schema-card__eyebrow,
.block-workspace__eyebrow,
.section-live-preview__eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #5d7fa6;
}

.about-admin-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.95fr);
  gap: 24px;
  padding: 28px;
}

.about-admin-hero__copy h1 {
  margin: 0;
  color: #14314f;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.08;
}

.about-admin-hero__text {
  margin: 16px 0 0;
  max-width: 720px;
  color: #536b86;
  font-size: 15px;
  line-height: 1.7;
}

.about-admin-hero__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.hero-stat-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid #d6e4f2;
  background: linear-gradient(180deg, #ffffff, #f4f8fc);
}

.hero-stat-card strong {
  color: #14314f;
  font-size: 30px;
  line-height: 1;
}

.hero-stat-card__label {
  color: #7189a3;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hero-stat-card--warning {
  border-color: #ffd6b8;
  background: linear-gradient(180deg, #fff6ef, #fffaf5);
}

.about-admin-toolbar {
  display: grid;
  gap: 18px;
  padding: 22px 24px;
}

.toolbar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.toolbar-field,
.schema-field,
.upload-inline {
  display: grid;
  gap: 8px;
}

.toolbar-field span,
.schema-field span,
.upload-inline span {
  color: #5e7793;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.upload-target-preview {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(47, 124, 255, 0.16);
  background: linear-gradient(180deg, rgba(47, 124, 255, 0.06), rgba(85, 178, 255, 0.03));
}

.upload-target-preview__label {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2f5f95;
}

.upload-target-preview code {
  font-size: 12px;
  line-height: 1.5;
  color: #14314f;
  word-break: break-all;
}

.toolbar-field input,
.toolbar-field select,
.schema-field input,
.schema-field select,
.schema-field textarea,
.upload-inline input[type='file'] {
  width: 100%;
  border: 1px solid #d8e4f0;
  border-radius: 16px;
  background: #ffffff;
  color: #16314f;
  padding: 12px 14px;
  font: inherit;
  outline: none;
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.toolbar-field input:focus,
.toolbar-field select:focus,
.schema-field input:focus,
.schema-field select:focus,
.schema-field textarea:focus {
  border-color: #72aefc;
  box-shadow: 0 0 0 4px rgba(114, 174, 252, 0.18);
  transform: translateY(-1px);
}

.schema-field textarea {
  min-height: 116px;
  resize: vertical;
}

.toolbar-actions,
.section-workspace__actions,
.schema-card__actions,
.schema-card__footer,
.block-workspace__toolbar,
.block-preview-card__header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.block-workspace__toolbar,
.block-preview-card__header {
  align-items: flex-start;
  justify-content: space-between;
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 14px;
  min-height: 42px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease,
    background 0.22s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  color: #fff;
  border-color: rgba(79, 141, 255, 0.4);
  background: linear-gradient(135deg, #2f7cff 0%, #55b2ff 100%);
  box-shadow: 0 14px 28px rgba(47, 124, 255, 0.22);
}

.btn-secondary {
  color: #244668;
  border-color: #d5e2ee;
  background: #ffffff;
}

.btn-danger {
  color: #fff;
  border-color: rgba(236, 111, 133, 0.4);
  background: linear-gradient(135deg, #d85068 0%, #ef7891 100%);
  box-shadow: 0 14px 28px rgba(216, 80, 104, 0.18);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2268b3;
  text-decoration: none;
  border-color: #cfe1f4;
  background: #f5faff;
}

.about-admin-empty {
  padding: 32px;
  text-align: center;
}

.about-admin-empty h2 {
  margin: 0 0 10px;
  color: #16314f;
}

.about-admin-empty p {
  margin: 0;
  color: #647b95;
}

.about-admin-sections,
.section-workspace__body,
.fixed-entry-grid,
.dynamic-entry-grid {
  display: grid;
  gap: 22px;
}

.section-workspace {
  position: relative;
  display: grid;
  gap: 18px;
  padding: 24px;
}

.section-workspace::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 6px;
  border-radius: 28px 0 0 28px;
  background: var(--section-accent, #7aa8d8);
}

.section-workspace__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.section-workspace__header h2 {
  margin: 0;
  color: #16314f;
  font-size: 26px;
}

.section-workspace__summary,
.block-workspace__meta,
.block-workspace__description,
.schema-card__description,
.field-help,
.section-live-preview__description {
  margin: 10px 0 0;
  color: #637b95;
  font-size: 14px;
  line-height: 1.55;
}

.section-live-preview {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid #dbe6f2;
  background: linear-gradient(180deg, #f7fbff, #ffffff);
}

.section-live-preview__header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
}

.section-live-preview__eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #5d7fa6;
}

.section-live-preview__header h3 {
  margin: 0;
  color: #14314f;
}

.section-live-preview__frame {
  width: 100%;
  min-height: 560px;
  border: 1px solid #dbe6f2;
  border-radius: 20px;
  background: #ffffff;
}

.upload-mode-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-upload-mode {
  min-height: 38px;
}

.btn-upload-mode.is-active {
  color: #ffffff;
  border-color: rgba(47, 124, 255, 0.38);
  background: linear-gradient(135deg, #2f7cff 0%, #55b2ff 100%);
  box-shadow: 0 10px 20px rgba(47, 124, 255, 0.16);
}

.block-workspace {
  display: grid;
  gap: 18px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid #dce7f2;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  box-shadow: 0 12px 26px rgba(31, 55, 90, 0.06);
}

.block-workspace__head,
.schema-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.block-workspace__head h3,
.schema-card__header h4 {
  margin: 0;
  color: #14314f;
}

.schema-card {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid #dbe6f2;
  background: #ffffff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.new-item-panel {
  position: relative;
  display: grid;
  gap: 16px;
  width: min(920px, 100%);
  margin: 4px 0 8px;
  padding: 18px 18px 16px;
  border-radius: 22px;
  border: 1px solid rgba(101, 166, 255, 0.34);
  background:
    linear-gradient(180deg, rgba(245, 250, 255, 0.98), rgba(255, 255, 255, 0.99));
  box-shadow:
    0 22px 50px rgba(31, 86, 169, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.new-item-panel::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  border-radius: 22px 0 0 22px;
  background: linear-gradient(180deg, #2f7cff 0%, #6dbbff 100%);
}

.new-item-panel--highlight {
  animation: new-item-editor-pulse 1.15s ease 2;
}

.new-item-panel__header,
.new-item-panel__footer,
.new-item-panel__header-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.new-item-panel__header-actions,
.new-item-panel__footer {
  flex-wrap: wrap;
}

.new-item-panel__description {
  margin: 8px 0 0;
  color: #67809b;
  font-size: 13px;
  line-height: 1.55;
}

.new-item-panel__body {
  display: grid;
  gap: 14px;
}

.new-item-panel__upload {
  padding: 14px;
  border-radius: 18px;
  border: 1px dashed rgba(95, 150, 230, 0.34);
  background: rgba(248, 251, 255, 0.88);
}

.new-item-panel__close {
  min-width: 110px;
}

.schema-form-grid--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.status-chip--creating {
  color: #0f4f97;
  background: linear-gradient(180deg, #e0efff, #f3f9ff);
  box-shadow: 0 10px 22px rgba(47, 124, 255, 0.12);
}

@keyframes new-item-editor-pulse {
  0% {
    transform: translateY(0) scale(1);
    box-shadow:
      0 0 0 0 rgba(47, 124, 255, 0.22),
      0 22px 50px rgba(31, 86, 169, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.94);
  }

  50% {
    transform: translateY(-4px) scale(1.006);
    box-shadow:
      0 0 0 12px rgba(47, 124, 255, 0.08),
      0 28px 60px rgba(31, 86, 169, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.98);
  }

  100% {
    transform: translateY(0) scale(1);
    box-shadow:
      0 0 0 0 rgba(47, 124, 255, 0),
      0 22px 50px rgba(31, 86, 169, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.94);
  }
}

.schema-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.schema-field--full {
  grid-column: 1 / -1;
}

.schema-field--timeline {
  grid-column: 2 / 3;
  align-self: start;
}

.schema-field--timeline-start {
  grid-row: auto;
}

.schema-field--timeline-end {
  grid-row: auto;
}

.field-image-preview {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid #d6e4f2;
  background: #f8fbff;
}

.field-image-preview img {
  width: min(100%, 320px);
  max-height: 240px;
  border-radius: 16px;
  object-fit: cover;
  object-position: center;
  border: 1px solid #dde8f4;
  background: linear-gradient(135deg, #f6f9fc, #edf3fa);
}

.field-image-preview--avatar img {
  width: min(100%, 320px);
  height: 240px;
}

.field-image-preview span {
  font-size: 12px;
  color: #5e7896;
}

.avatar-focus-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid #d5e4f0;
  background: linear-gradient(180deg, #ffffff 0%, #f6fbff 100%);
}

.avatar-focus-panel__header {
  display: grid;
  gap: 4px;
}

.avatar-focus-panel__header span {
  font-size: 13px;
  font-weight: 800;
  color: #21496c;
}

.avatar-focus-panel__header small {
  font-size: 12px;
  line-height: 1.5;
  color: #67809a;
}

.avatar-focus-stage {
  position: relative;
  display: block;
  width: min(100%, 320px);
  height: 240px;
  padding: 0;
  border: 1px solid #cfe0ed;
  border-radius: 18px;
  overflow: hidden;
  cursor: crosshair;
  background: linear-gradient(135deg, #f6f9fc, #edf3fa);
}

.avatar-focus-stage img {
  width: 100%;
  height: 100%;
  display: block;
}

.avatar-focus-stage__marker {
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 3px solid #fff;
  background: #1f8fff;
  box-shadow: 0 8px 24px rgba(31, 143, 255, 0.32);
  transform: translate(-50%, -50%);
  cursor: grab;
  touch-action: none;
}

.avatar-focus-stage__marker:active {
  cursor: grabbing;
}

.avatar-focus-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #446887;
}

.avatar-fit-toggle__btn {
  border: 1px solid #cddced;
  background: #fff;
  color: #31506d;
  border-radius: 14px;
  min-height: 42px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.avatar-fit-toggle__btn:hover {
  border-color: #76a7d9;
  color: #0f5f93;
  transform: translateY(-1px);
}

.avatar-fit-toggle__btn.is-active {
  border-color: #2e8bd9;
  background: linear-gradient(135deg, #e9f4ff, #f7fbff);
  color: #0f5f93;
  box-shadow: 0 10px 24px rgba(46, 139, 217, 0.12);
}

.avatar-fit-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.avatar-focus-panel__save {
  width: fit-content;
}

.timeline-date-field {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid #dce7f2;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
}

.timeline-date-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.timeline-date-field__header span {
  color: #5f7b99;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.timeline-date-field__row {
  display: grid;
  grid-template-columns: minmax(140px, 180px) minmax(0, 1fr);
  gap: 10px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  color: #24517d;
  background: #edf5ff;
}

.media-preview-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 16px;
  border: 1px solid #d9e5f1;
  background: #f9fbfe;
  color: #58718c;
}

.media-preview-chip img {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  object-fit: cover;
  border: 1px solid #e1eaf3;
}

.block-workspace__empty {
  padding: 16px;
  border-radius: 18px;
  border: 1px dashed #cddceb;
  color: #69819b;
  text-align: center;
  background: #f8fbfe;
}

.accent-hero {
  --section-accent: #4f8dff;
}

.accent-company {
  --section-accent: #11b7a3;
}

.accent-speech {
  --section-accent: #9b6bff;
}

.accent-org {
  --section-accent: #ff9f43;
}

.accent-culture {
  --section-accent: #ef5da8;
}

.accent-timeline {
  --section-accent: #ff6b57;
}

.accent-leadership {
  --section-accent: #00a6c7;
}

.accent-partner {
  --section-accent: #6d8cff;
}

.accent-default {
  --section-accent: #7aa8d8;
}

.block-workspace.accent-hero,
.block-workspace.accent-company,
.block-workspace.accent-speech,
.block-workspace.accent-org,
.block-workspace.accent-culture,
.block-workspace.accent-timeline,
.block-workspace.accent-leadership,
.block-workspace.accent-partner,
.block-workspace.accent-default {
  border-top: 4px solid var(--section-accent, #7aa8d8);
}

.field-image-preview--hero img {
  width: min(100%, 420px);
  height: 190px;
  object-fit: cover;
}

@media (max-width: 1100px) {
  .about-admin-hero,
  .toolbar-grid,
  .schema-form-grid,
  .block-preview-card__hero,
  .block-preview-card__signature,
  .block-preview-card__summary-item,
  .block-preview-card__timeline-item,
  .block-preview-card__gallery-item {
    grid-template-columns: 1fr;
  }

  .about-admin-hero__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .schema-field--timeline {
    grid-column: 1 / -1;
  }

  .timeline-date-field__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 780px) {
  .about-admin-hero,
  .section-workspace__header,
  .block-workspace__head,
  .schema-card__header,
  .block-preview-card__header,
  .new-item-panel__header,
  .new-item-panel__footer,
  .new-item-panel__header-actions {
    grid-template-columns: 1fr;
    display: grid;
  }

  .about-admin-hero__stats {
    grid-template-columns: 1fr;
  }

  .toolbar-actions,
  .section-workspace__actions,
  .schema-card__actions,
  .schema-card__footer,
  .block-workspace__toolbar {
    width: 100%;
  }

  .new-item-panel {
    width: 100%;
    padding: 16px;
  }

  .new-item-panel__close,
  .new-item-panel__header-actions .status-chip {
    width: 100%;
    justify-content: center;
  }

  .btn,
  .btn-ghost {
    width: 100%;
    justify-content: center;
  }
}
</style>
