/**
 * useEntityManager — Composable chứa TOÀN BỘ logic động cơ quản lý entity.
 * Được gọi từ AdminCoreManager.vue hoặc bất kỳ domain wrapper nào.
 *
 * @param {Object} props - reactive props (token, entityKey, active)
 * @param {Function} emit - emit function từ defineEmits
 * @returns {Object} - tất cả state, computed, functions cần cho template
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/views/admin/shared/api/adminApi.js'
import {
  DEFAULT_STATUS_OPTIONS,
  ENTITY_MANAGER_CONFIGS,
} from '@/views/admin/shared/config/entityConfigs'
import { env } from '@/shared/config/env'
import { createEntityManagerBannerHelpers } from '@/views/admin/shared/utils/entity-manager/bannerHelpers.js'
import { FIELD_GROUPS } from '@/views/admin/shared/utils/entity-manager/constants.js'
import { createEntityManagerFormHelpers } from '@/views/admin/shared/utils/entity-manager/formHelpers'
import { createEntityManagerPreviewHelpers } from '@/views/admin/shared/utils/entity-manager/previewHelpers'

const ENTITY_KEY_ALIASES = Object.freeze({
  categories: 'product_categories',
  inquiries: 'inquiry_submissions',
})

const FALLBACK_ENTITY_CONFIG = Object.freeze({
  label: 'Bản ghi',
  eyebrow: 'Admin module',
  description:
    'Cấu hình module chưa sẵn sàng. Vui lòng kiểm tra entity-key hoặc cấu hình ENTITY_MANAGER_CONFIGS.',
  titleField: 'id',
  table: ['id'],
  fields: [],
  required: [],
})

export function useEntityManager(props, emit) {
  // ═══════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════
  const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

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
  let isComponentAlive = true
  let relationLoadRequestId = 0
  let mediaLoadRequestId = 0
  let recordsLoadRequestId = 0
  let refreshCycleRequestId = 0

  // ═══════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════
  const resolvedEntityKey = computed(() => {
    const rawEntityKey = String(props.entityKey || '').trim()
    return ENTITY_KEY_ALIASES[rawEntityKey] || rawEntityKey
  })
  const hasValidEntityConfig = computed(() =>
    Boolean(ENTITY_MANAGER_CONFIGS[resolvedEntityKey.value]),
  )
  const config = computed(
    () =>
      ENTITY_MANAGER_CONFIGS[resolvedEntityKey.value] || {
        ...FALLBACK_ENTITY_CONFIG,
        label: resolvedEntityKey.value || FALLBACK_ENTITY_CONFIG.label,
      },
  )
  const previewRecordUrl = computed(() =>
    typeof config.value?.preview === 'function' ? config.value.preview : () => '',
  )
  const tableColumns = computed(() => config.value?.table || ['id'])
  const formFields = computed(() => config.value?.fields || [])
  const visibleFormFields = computed(() => {
    const hiddenFields = new Set(config.value?.hiddenFormFields || [])
    const baseFields = isBannerEntity.value
      ? formFields.value.filter(
          (field) => !['image_id', 'focus_x', 'focus_y'].includes(field),
        )
      : formFields.value

    return baseFields.filter((field) => !hiddenFields.has(field))
  })
  const statusOptions = computed(() => {
    const source =
      Array.isArray(config.value?.statusOptions) &&
      config.value.statusOptions.length
        ? config.value.statusOptions
        : DEFAULT_STATUS_OPTIONS
    return source
      .map((option) => {
        if (typeof option === 'string') {
          return { value: option, label: option }
        }
        return {
          value: String(option?.value || '').trim(),
          label: String(option?.label || option?.value || '').trim(),
        }
      })
      .filter((option) => option.value)
  })
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalRecords.value / pageSize.value)),
  )
  const hasStatusFilter = computed(() => formFields.value.includes('status'))
  const hasMediaFields = computed(() => {
    if (config.value?.cloudinaryAssetFolder) return true
    return formFields.value.some((field) => FIELD_GROUPS.media.includes(field))
  })
  const mediaFieldOptions = computed(() => {
    const mediaFields = formFields.value.filter((field) =>
      FIELD_GROUPS.media.includes(field),
    )
    if (config.value?.cloudinaryAssetFolder) {
      const urlFields = formFields.value.filter(
        (f) => f.endsWith('_url') || f.endsWith('_pdf_url'),
      )
      return [...new Set([...mediaFields, ...urlFields])]
    }
    return mediaFields
  })
  const canCreate = computed(() => config.value?.allowCreate !== false)
  const standaloneUpload = computed(() =>
    Boolean(config.value?.standaloneUpload),
  )
  const isMediaAssetsEntity = computed(
    () => props.entityKey === 'media_assets',
  )
  const isVideosEntity = computed(() => props.entityKey === 'videos')
  const isBannerEntity = computed(() => props.entityKey === 'banners')
  const isEntityMediaEntity = computed(
    () => props.entityKey === 'entity_media',
  )
  const isProductsEntity = computed(() => props.entityKey === 'products')
  const isConfigModalEntity = computed(
    () => config.value?.editorPresentation === 'modal',
  )
  const isFormModalEntity = computed(
    () =>
      isBannerEntity.value ||
      isVideosEntity.value ||
      isProductsEntity.value ||
      isConfigModalEntity.value,
  )
  const isFormModalOpen = computed(
    () => formOpen.value && isFormModalEntity.value,
  )
  const showInlineEditor = computed(
    () => formOpen.value && !isFormModalEntity.value,
  )
  const inlineEditorPlacement = computed(
    () => config.value?.inlineEditorPlacement || 'bottom',
  )
  const slugSourceField = computed(() => {
    if (!formFields.value.includes('slug')) return ''
    if (formFields.value.includes('name')) return 'name'
    if (formFields.value.includes('title')) return 'title'
    return ''
  })
  const actionConfirmButtonClass = computed(() =>
    actionConfirmDialog.tone === 'danger'
      ? 'btn btn-danger'
      : 'btn btn-primary',
  )
  const featuredTableFields = computed(
    () => config.value?.featuredTableFields || [],
  )
  const previewMediaOptions = computed(() => {
    if (config.value?.hideMediaGallery) return []
    if (!hasMediaFields.value || !mediaOptions.value.length) return []
    if (!isBannerEntity.value) return mediaOptions.value.slice(0, 8)
    const eligible = mediaOptions.value.filter(
      (media) =>
        (isImageMedia(media) || isVideoMediaRecord(media)) &&
        !isNoiseMediaAsset(media),
    )
    const bannerOnly = eligible.filter(isBannerRelatedMedia)
    return bannerOnly.slice(0, 8)
  })
  const videoLibraryOptions = computed(() => {
    if (!mediaOptions.value.length) return []
    return mediaOptions.value.filter((media) => isVideoMediaRecord(media))
  })

  // ═══════════════════════════════════════════════════════════
  // PREVIEW HELPERS
  // ═══════════════════════════════════════════════════════════
  const previewHelpers = createEntityManagerPreviewHelpers({
    apiOrigin: API_ORIGIN,
    entityKey: computed(() => props.entityKey),
    getRelationOptions: (field) => relationOptions[field] || [],
    getRecords: () => records.value,
    getMediaOptions: () => mediaOptions.value,
  })

  const {
    resolveMediaUrl,
    safeMetadataObject,
    normalizedExternalUrl,
    relationLabelFromOptions,
    isDirectVideoFile,
    isAllowedVideoUrl,
    isVideoMediaRecord,
    isImageMedia,
    isNoiseMediaAsset,
    isBannerRelatedMedia,
    getMediaOptionById,
    previewMedia,
    previewCard,
    hasRichPreview,
    previewStatusText,
    previewStatusTone,
    mediaAssetPreviewUrl,
    mediaAssetLabel,
    rowThumbnailUrl,
    videoPreviewUrl,
    videoUrlHint,
  } = previewHelpers

  const selectedMediaAsset = (field) =>
    previewHelpers.selectedMediaAsset(form, field)

  const comparableMediaKey = (rawUrl) => {
    const normalized = normalizedExternalUrl(rawUrl)
    if (!normalized) return ''
    const resolved = resolveMediaUrl(normalized)
    try {
      const parsed = new URL(resolved, 'http://localhost')
      return `${parsed.pathname}${parsed.search}`
        .replace(/\/+$/, '')
        .toLowerCase()
    } catch {
      return resolved.replace(/\/+$/, '').toLowerCase()
    }
  }

  const extractLegacyImageUrl = (record) => {
    const metadata = safeMetadataObject(record?.metadata_json)
    return String(
      metadata?.src ||
        metadata?.image_url ||
        metadata?.image ||
        metadata?.external_source_url ||
        metadata?.source_url ||
        metadata?.thumbnail_url ||
        '',
    ).trim()
  }

  const tryResolveMediaIdFromLegacyUrl = (legacyUrl) => {
    const targetKey = comparableMediaKey(legacyUrl)
    if (!targetKey) return null
    const matched = mediaOptions.value.find(
      (media) => comparableMediaKey(media?.url) === targetKey,
    )
    return matched?.id || null
  }

  const selectedMediaPreviewUrl = (field) => {
    const primary = previewHelpers.selectedMediaPreviewUrl(form, field)
    if (primary) return primary
    if (props.entityKey === 'content_block_items' && field === 'image_id') {
      const legacyUrl = normalizedExternalUrl(form.__legacy_image_url || '')
      if (legacyUrl) return resolveMediaUrl(legacyUrl)
    }
    return ''
  }

  const selectedMediaLabel = (field) => {
    const primaryLabel = previewHelpers.selectedMediaLabel(form, field)
    if (primaryLabel !== 'No media selected') return primaryLabel
    if (props.entityKey === 'content_block_items' && field === 'image_id') {
      return String(form.__legacy_image_url || '').trim()
        ? 'Ảnh cũ (metadata)'
        : primaryLabel
    }
    return primaryLabel
  }

  // ═══════════════════════════════════════════════════════════
  // FORM HELPERS
  // ═══════════════════════════════════════════════════════════
  const formHelpers = createEntityManagerFormHelpers({
    props,
    form,
    formErrors,
    relationOptions,
    uploadTitle,
    uploadAltText,
    uploadTargetField,
    slugManuallyEdited,
    config,
    formFields,
    mediaFieldOptions,
    statusOptions,
    relationLabelFromOptions,
    isBannerEntity,
    isEntityMediaEntity,
    isVideosEntity,
    clampBannerFocus: (value) => {
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return 50
      return Math.min(100, Math.max(0, numeric))
    },
    isAllowedVideoUrl,
  })

  const {
    recordDisplayName,
    entityLabelForAction,
    fieldLabel,
    fieldPlaceholder,
    fieldHelpText,
    syncSlugFromSource,
    handleSlugSourceInput,
    handleSlugInput,
    relationSelectValue,
    updateRelationField,
    resolveRelationMap,
    selectedRelationSummary,
    relationPreviewPath,
    relationPreviewLabel,
    mediaUploadAccept,
    mediaUploadAssetFolder,
    mediaUploadPublicIdBase,
    inputType,
    isTextarea,
    isBooleanField,
    relationFetchTargetCount,
    isSelectField,
    selectOptions,
    formatCell,
    setDefaultFormValues,
    cleanPayload,
    validateForm,
  } = formHelpers

  // ═══════════════════════════════════════════════════════════
  // BANNER HELPERS
  // ═══════════════════════════════════════════════════════════
  const bannerHelpers = createEntityManagerBannerHelpers({
    form,
    isBannerEntity,
    getMediaOptionById,
    resolveMediaUrl,
    isVideoMediaRecord,
  })

  const {
    bannerMediaRecord,
    bannerFormMediaRecord,
    bannerMediaUrl,
    bannerMediaAlt,
    bannerTypeLabel,
    bannerOrdinal,
    bannerDisplayTitle,
    bannerImageStyle,
    bannerFormImageStyle,
    canAdjustBannerFocus,
    bannerFocusIndicatorStyle,
    applyBannerFocusFromPointer,
    resetBannerFocus,
  } = bannerHelpers

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

  // ═══════════════════════════════════════════════════════════
  // NOTIFICATION
  // ═══════════════════════════════════════════════════════════
  function notifySuccess(message) {
    emit('notify-success', message)
  }

  function notifyError(message) {
    emit('notify-error', message)
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIRM DIALOG
  // ═══════════════════════════════════════════════════════════
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

  function openActionConfirmDialog({
    eyebrow = 'Confirm action',
    title,
    message,
    confirmText,
    tone = 'primary',
  }) {
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
        eyebrow: 'Cập nhật bản ghi',
        title: `Cập nhật ${label}?`,
        message: 'Xác nhận để lưu các thông tin đã chỉnh sửa.',
        confirmText: 'Xác nhận cập nhật',
        tone: 'primary',
      })
    }
    if (action === 'delete') {
      return openActionConfirmDialog({
        eyebrow: 'Xóa bản ghi',
        title: `Xóa ${label}?`,
        message: 'Hành động này không thể hoàn tác.',
        confirmText: 'Xác nhận xóa',
        tone: 'danger',
      })
    }
    return true
  }

  function actionSuccessMessage(action, record = null) {
    const name = recordDisplayName(record)
    if (isBannerEntity.value) {
      if (action === 'create')
        return name
          ? `Them banner moi thanh cong: "${name}".`
          : 'Them banner moi thanh cong.'
      if (action === 'update')
        return name
          ? `Cap nhat banner thanh cong: "${name}".`
          : 'Cap nhat banner thanh cong.'
      if (action === 'delete')
        return name
          ? `Xoa banner thanh cong: "${name}".`
          : 'Xoa banner thanh cong.'
    }
    const label = String(config.value?.label || 'Record').trim()
    if (action === 'create') return `Created ${config.value.label} record.`
    if (action === 'update') {
      return name ? `Updated ${label}: "${name}".` : `Updated ${label} record.`
    }
    if (action === 'delete') {
      return name ? `Deleted ${label}: "${name}".` : `Deleted ${label} record.`
    }
    return 'Completed successfully.'
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════
  function currentFormPreviewUrl() {
    if (isEntityMediaEntity.value) return relationPreviewPath('entity_id')
    if (!formOpen.value) return ''
    if (props.entityKey === 'project_category_items')
      return relationPreviewPath('category_id')
    if (props.entityKey === 'projects' && String(form.slug || '').trim())
      return `/project/${String(form.slug).trim()}`
    if (!editingRecordId.value) return ''
    const resolver = config.value?.preview
    if (!resolver) return ''
    const previewRecord = {
      id: editingRecordId.value || '__preview__',
      ...form,
    }
    return resolver(previewRecord) || ''
  }

  function normalizedToken() {
    return String(props.token || '').trim()
  }

  function entityRequestKey() {
    return `${resolvedEntityKey.value}::${normalizedToken()}::${String(props.active)}`
  }

  function clearRelationOptions() {
    Object.keys(relationOptions).forEach((key) => delete relationOptions[key])
  }

  function resetEntityState() {
    records.value = []
    mediaOptions.value = []
    totalRecords.value = 0
    loading.value = false
    deletingId.value = null
    clearRelationOptions()
  }

  function configuredPageSize() {
    const rawValue = Number(config.value?.pageSize || 10)
    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 10
  }

  // ═══════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════
  async function loadRelationOptions() {
    const token = normalizedToken()
    const requestId = ++relationLoadRequestId
    const requestKey = entityRequestKey()
    if (!token) {
      if (
        requestId === relationLoadRequestId &&
        requestKey === entityRequestKey()
      )
        clearRelationOptions()
      return
    }
    clearRelationOptions()
    const relationMap = resolveRelationMap()
    const loadRelationRecords = async (entityName) => {
      const pageLimit = 100
      const targetCount = relationFetchTargetCount(entityName)
      const items = []
      let skip = 0
      let total = Number.POSITIVE_INFINITY
      while (items.length < targetCount && skip < total) {
        const response = await listAdminEntityRecords(entityName, token, {
          skip,
          limit: pageLimit,
        })
        const batch = response.items || []
        total = Number(response.pagination?.total || batch.length)
        items.push(...batch)
        if (!batch.length || batch.length < pageLimit) break
        skip += pageLimit
      }
      return items
    }
    try {
      const relationEntries = await Promise.all(
        Object.entries(relationMap)
          .filter(
            ([field, entityName]) =>
              formFields.value.includes(field) && entityName,
          )
          .map(async ([field, entityName]) => [
            field,
            await loadRelationRecords(entityName),
          ]),
      )
      if (
        !isComponentAlive ||
        requestId !== relationLoadRequestId ||
        requestKey !== entityRequestKey()
      )
        return
      relationEntries.forEach(([field, items]) => {
        relationOptions[field] = items
      })
      if (
        formFields.value.includes('entity_id') &&
        form.entity_id !== '' &&
        form.entity_id !== null &&
        form.entity_id !== undefined
      ) {
        const hasCurrentEntity = (relationOptions.entity_id || []).some(
          (option) => String(option.id) === String(form.entity_id),
        )
        if (!hasCurrentEntity) form.entity_id = null
      }
    } catch (error) {
      if (
        !isComponentAlive ||
        requestId !== relationLoadRequestId ||
        requestKey !== entityRequestKey()
      )
        return
      notifyError(error.message || 'Failed to load relation options.')
    }
  }

  async function loadMediaOptions() {

    const token = normalizedToken()
    const requestId = ++mediaLoadRequestId
    const requestKey = entityRequestKey()
    if (
      !token ||
      (!hasMediaFields.value && !standaloneUpload.value && !isVideosEntity.value)
    ) {
      if (
        requestId === mediaLoadRequestId &&
        requestKey === entityRequestKey()
      )
        mediaOptions.value = []
      return
    }
    try {
      let allMedia = []
      let skip = 0
      const limit = 100
      let hasMore = true
      while (hasMore) {
        const response = await listAdminEntityRecords('media_assets', token, {
          skip,
          limit,
          status: 'active',
        })
        if (
          !isComponentAlive ||
          requestId !== mediaLoadRequestId ||
          requestKey !== entityRequestKey()
        )
          return
        const items = response.items || []
        allMedia = [...allMedia, ...items]
        skip += limit
        hasMore = items.length >= limit && allMedia.length < 1000
      }
      mediaOptions.value = allMedia
    } catch (error) {
      if (
        !isComponentAlive ||
        requestId !== mediaLoadRequestId ||
        requestKey !== entityRequestKey()
      )
        return
      mediaOptions.value = []
      notifyError(
        error.message || 'Không thể tải danh sách phương tiện (media).',
      )
    }
  }

  async function loadRecords() {
    const token = normalizedToken()
    const requestId = ++recordsLoadRequestId
    const requestKey = entityRequestKey()
    if (!token) {
      if (
        requestId === recordsLoadRequestId &&
        requestKey === entityRequestKey()
      ) {
        records.value = []
        totalRecords.value = 0
        loading.value = false
      }
      return
    }
    records.value = []
    totalRecords.value = 0
    loading.value = true
    try {
      const query = {
        skip: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value,
        search: searchKeyword.value.trim() || undefined,
      }
      if (hasStatusFilter.value && statusFilter.value)
        query.status = statusFilter.value
      const response = await listAdminEntityRecords(
        resolvedEntityKey.value,
        token,
        query,
      )
      if (
        !isComponentAlive ||
        requestId !== recordsLoadRequestId ||
        requestKey !== entityRequestKey()
      )
        return
      records.value = response.items || []
      totalRecords.value = response.pagination?.total || 0
    } catch (error) {
      if (
        !isComponentAlive ||
        requestId !== recordsLoadRequestId ||
        requestKey !== entityRequestKey()
      )
        return
      records.value = []
      totalRecords.value = 0
      notifyError(error.message || 'Failed to load content records.')
    } finally {
      if (
        isComponentAlive &&
        requestId === recordsLoadRequestId &&
        requestKey === entityRequestKey()
      )
        loading.value = false
    }
  }

  async function refreshAll() {
    const requestId = ++refreshCycleRequestId
    const requestKey = entityRequestKey()
    await loadRelationOptions()
    if (
      !isComponentAlive ||
      requestId !== refreshCycleRequestId ||
      requestKey !== entityRequestKey()
    )
      return
    await loadMediaOptions()
    if (
      !isComponentAlive ||
      requestId !== refreshCycleRequestId ||
      requestKey !== entityRequestKey()
    )
      return
    await loadRecords()
  }

  // ═══════════════════════════════════════════════════════════
  // FORM OPEN / CLOSE / SUBMIT
  // ═══════════════════════════════════════════════════════════
  async function revealInlineEditor() {
    if (isFormModalEntity.value || !isComponentAlive) return
    await nextTick()
    if (!isComponentAlive) return
    const editorElement = inlineEditorRef.value
    if (!editorElement || !editorElement.isConnected) return
    editorElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const firstFocusableField = editorElement.querySelector(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
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
    if (props.entityKey === 'content_block_items') {
      const legacyImageUrl = extractLegacyImageUrl(record)
      form.__legacy_image_url = legacyImageUrl
      if (!form.image_id && legacyImageUrl) {
        const matchedMediaId = tryResolveMediaIdFromLegacyUrl(legacyImageUrl)
        if (matchedMediaId) {
          form.image_id = Number(matchedMediaId)
          form.__legacy_image_url = ''
        }
      }
    }
    if (typeof form.metadata_json === 'object' && form.metadata_json !== null)
      form.metadata_json = JSON.stringify(form.metadata_json, null, 2)
    formOpen.value = true
    void revealInlineEditor()
  }

  function handleFieldUpdate(field, value) {
    form[field] = value
    if (props.entityKey === 'content_block_items' && field === 'image_id')
      form.__legacy_image_url = ''
  }

  function closeForm() {
    formOpen.value = false
    editingRecordId.value = null
    formErrors.value = []
  }

  async function submitForm() {
    const token = normalizedToken()
    if (!token) return
    syncSlugFromSource(formMode.value, slugSourceField.value)
    if (!validateForm()) return
    if (formMode.value === 'edit') {
      const confirmedUpdate = await confirmRecordAction('update')
      if (!confirmedUpdate) return
    }
    saving.value = true
    try {
      const payload = cleanPayload()
      if (formMode.value === 'create') {
        await createAdminEntityRecord(resolvedEntityKey.value, payload, token)
        notifySuccess(actionSuccessMessage('create'))
        closeForm()
        await loadRecords()
      } else {
        const updatedRecord = await updateAdminEntityRecord(
          resolvedEntityKey.value,
          editingRecordId.value,
          payload,
          token,
        )
        records.value = records.value.map((record) =>
          String(record.id) === String(updatedRecord?.id)
            ? updatedRecord
            : record,
        )
        notifySuccess(actionSuccessMessage('update', updatedRecord))
        closeForm()
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to save record.'
      formErrors.value = [errorMsg]
      notifyError(errorMsg)
      if (
        error.status === 404 ||
        errorMsg.toLowerCase().includes('not found')
      ) {
        closeForm()
        loadRecords().catch(() => {})
      }
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
      await deleteAdminEntityRecord(resolvedEntityKey.value, record.id, token)
      notifySuccess(actionSuccessMessage('delete', record))
      await loadRecords()
    } catch (error) {
      notifyError(error.message || 'Failed to delete record.')
    } finally {
      deletingId.value = null
    }
  }


  // ═══════════════════════════════════════════════════════════
  // MEDIA UPLOAD
  // ═══════════════════════════════════════════════════════════
  function handleFileChange(event) {
    uploadFile.value = event.target.files?.[0] || null
  }

  function handleVideoFileChange(event) {
    videoUploadFile.value = event.target.files?.[0] || null
  }

  function triggerVideoUpload() {
    if (videoUploadFile.value) uploadVideoFile()
    else if (videoFileInputRef.value) videoFileInputRef.value.click()
  }

  async function uploadVideoFile() {
    const token = normalizedToken()
    if (!token || !videoUploadFile.value) {
      notifyError('Choose a video file to upload first.')
      return
    }
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-m4v',
    ]
    const file = videoUploadFile.value
    if (
      !allowedTypes.some((type) => file.type === type) &&
      !/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(file.name)
    ) {
      notifyError('Invalid video file type. Allowed: MP4, WebM, OGG, MOV.')
      return
    }
    videoUploading.value = true
    try {
      const media = await uploadAdminMediaAsset(token, videoUploadFile.value, {
        title: uploadTitle.value || form.title || videoUploadFile.value.name,
        altText:
          uploadAltText.value || form.title || videoUploadFile.value.name,
        assetFolder: mediaUploadAssetFolder(),
        publicIdBase: mediaUploadPublicIdBase(),
      })
      await loadMediaOptions()
      if (
        !mediaOptions.value.some(
          (item) => String(item.id) === String(media.id),
        )
      )
        mediaOptions.value = [media, ...mediaOptions.value]
      if ((isVideosEntity.value || isProductsEntity.value) && media.url)
        form.video_url = media.url
      videoUploadFile.value = null
      if (videoFileInputRef.value) videoFileInputRef.value.value = ''
      if (media.storage_backend === 'cloudinary')
        notifySuccess(`Uploaded video #${media.id} to Cloudinary.`)
      else if (media.fallback_reason)
        notifySuccess(
          `Uploaded video #${media.id} to local storage. Cloudinary was skipped: ${media.fallback_reason}`,
        )
      else notifySuccess(`Uploaded video #${media.id} to local storage.`)
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
      if (
        !mediaOptions.value.some(
          (item) => String(item.id) === String(media.id),
        )
      )
        mediaOptions.value = [media, ...mediaOptions.value]
      if (standaloneUpload.value) {
        await loadRecords()
      } else if (isBannerEntity.value && 'image_id' in form) {
        form.image_id = media.id
      } else if (
        uploadTargetField.value &&
        uploadTargetField.value in form
      ) {
        if (uploadTargetField.value === 'gallery_urls') {
          const existing = String(form.gallery_urls || '')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
          const newUrl = String(media.url || '').trim()
          if (newUrl && !existing.includes(newUrl))
            form.gallery_urls = [...existing, newUrl].join('\n')
        } else if (
          uploadTargetField.value.endsWith('_url') ||
          uploadTargetField.value.endsWith('_pdf_url')
        ) {
          form[uploadTargetField.value] = media.url
        } else {
          form[uploadTargetField.value] = media.id
        }
      }
      uploadFile.value = null
      uploadTitle.value = ''
      uploadAltText.value = ''
      if (media.storage_backend === 'cloudinary')
        notifySuccess(`Đã tải ảnh #${media.id} lên Cloudinary thành công.`)
      else if (media.fallback_reason)
        notifySuccess(
          `Đã tải ảnh #${media.id} lên máy chủ local. Cloudinary bị bỏ qua: ${media.fallback_reason}`,
        )
      else
        notifySuccess(`Đã tải ảnh #${media.id} lên hệ thống thành công.`)
    } catch (error) {
      notifyError(error.message || 'Failed to upload media.')
    } finally {
      uploading.value = false
    }
  }

  const productInlineUploading = ref('')
  const galleryUploadProgress = ref('')

  async function inlineUploadForField(field, filesOrFile) {
    const token = normalizedToken()
    if (!token) return
    const files =
      filesOrFile instanceof FileList
        ? Array.from(filesOrFile)
        : filesOrFile instanceof File
          ? [filesOrFile]
          : Array.isArray(filesOrFile)
            ? filesOrFile
            : []
    if (!files.length) return
    productInlineUploading.value = field
    let uploaded = 0
    const total = files.length
    try {
      for (const file of files) {
        uploaded++
        galleryUploadProgress.value = total > 1 ? `${uploaded}/${total}` : ''
        const media = await uploadAdminMediaAsset(token, file, {
          title: form.name || form.title || file.name,
          altText: form.name || form.title || '',
          assetFolder: mediaUploadAssetFolder(),
          publicIdBase: mediaUploadPublicIdBase(),
        })
        if (
          !mediaOptions.value.some(
            (item) => String(item.id) === String(media.id),
          )
        )
          mediaOptions.value = [media, ...mediaOptions.value]
        if (field === 'gallery_urls') {
          const existing = String(form.gallery_urls || '')
            .replace(/\r/g, '\n')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
          const newUrl = String(media.url || '').trim()
          if (newUrl && !existing.includes(newUrl))
            form.gallery_urls = [...existing, newUrl].join('\n')
        } else {
          form[field] = media.url
        }
      }
      await loadMediaOptions()
      notifySuccess(
        total > 1
          ? `Đã tải ${total} ảnh lên thành công → ${fieldLabel(field)}`
          : `Đã tải ảnh lên thành công → ${fieldLabel(field)}`,
      )
    } catch (error) {
      notifyError(error.message || 'Upload failed.')
    } finally {
      productInlineUploading.value = ''
      galleryUploadProgress.value = ''
    }
  }

  function removeGalleryUrl(urlToRemove) {
    const existing = String(form.gallery_urls || '')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    form.gallery_urls = existing.filter((u) => u !== urlToRemove).join('\n')
  }

  // ═══════════════════════════════════════════════════════════
  // PAGINATION & UI
  // ═══════════════════════════════════════════════════════════
  function setPage(page) {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  function toggleFormModalBodyLock(locked) {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('form-modal-open', locked)
  }

  function handleBannerConfirmEsc(event) {
    if (event.key === 'Escape' && actionConfirmDialog.visible)
      cancelActionConfirmDialog()
  }

  // ═══════════════════════════════════════════════════════════
  // WATCHERS
  // ═══════════════════════════════════════════════════════════
  watch(
    () => props.entityKey,
    async () => {
      currentPage.value = 1
      pageSize.value = configuredPageSize()
      statusFilter.value = ''
      searchKeyword.value = ''
      closeForm()
      closeActionConfirmDialog(false)
      resetEntityState()
      if (!hasValidEntityConfig.value && resolvedEntityKey.value) {
        notifyError(
          `Module "${resolvedEntityKey.value}" chưa có cấu hình quản trị hợp lệ. Vui lòng kiểm tra entity-key của wrapper hoặc ENTITY_MANAGER_CONFIGS.`,
        )
      }
      if (props.active && normalizedToken()) await refreshAll()
    },
    { immediate: true },
  )


  watch([currentPage, pageSize], () => {
    if (props.active && normalizedToken()) loadRecords()
  })

  watch(
    () => props.active,
    async (active) => {
      if (active && normalizedToken()) {
        resetEntityState()
        await refreshAll()
      } else {
        closeForm()
        closeActionConfirmDialog(false)
      }
    },
  )

  watch(
    () => props.token,
    async (value) => {
      if (!String(value || '').trim()) {
        resetEntityState()
        closeForm()
        closeActionConfirmDialog(false)
        return
      }
      if (props.active) {
        resetEntityState()
        await refreshAll()
      }
    },
  )

  watch(
    () => [props.entityKey, form.entity_type, formOpen.value],
    async ([entityKey, entityType, isOpen], previous = []) => {
      if (entityKey !== 'entity_media' || !props.active || !normalizedToken())
        return
      if (!isOpen) return
      const currentType = String(entityType || '').trim()
      const previousType = String(previous?.[1] || '').trim()
      if (!currentType) return
      if (currentType === previousType && previous?.[2] === isOpen) return
      const allowedGroupValues = selectOptions('group_name').map((option) =>
        typeof option === 'string' ? option : option.value,
      )
      if (!allowedGroupValues.includes(form.group_name))
        form.group_name = allowedGroupValues[0] || ''
      await loadRelationOptions()
    },
  )

  watch(
    isFormModalOpen,
    (open) => toggleFormModalBodyLock(open),
    { immediate: true },
  )

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  onBeforeUnmount(() => {
    isComponentAlive = false
    relationLoadRequestId += 1
    mediaLoadRequestId += 1
    recordsLoadRequestId += 1
    refreshCycleRequestId += 1
    bannerFocusDragging.value = false
    closeActionConfirmDialog(false)
    toggleFormModalBodyLock(false)
    window.removeEventListener('keydown', handleBannerConfirmEsc)
  })

  onMounted(() => {
    window.addEventListener('keydown', handleBannerConfirmEsc)
    pageSize.value = configuredPageSize()
  })

  // ═══════════════════════════════════════════════════════════
  // RETURN — tất cả bindings cho template
  // ═══════════════════════════════════════════════════════════
  return {
    // state
    records,
    mediaOptions,
    relationOptions,
    searchKeyword,
    statusFilter,
    currentPage,
    pageSize,
    totalRecords,
    loading,
    saving,
    deletingId,
    formOpen,
    formMode,
    editingRecordId,
    inlineEditorRef,
    form,
    formErrors,
    uploadFile,
    uploadTitle,
    uploadAltText,
    uploadTargetField,
    uploading,
    videoUploadFile,
    videoUploading,
    videoFileInputRef,
    bannerFocusDragging,
    actionConfirmDialog,
    productInlineUploading,
    galleryUploadProgress,
    // computed
    config,
    resolvedEntityKey,
    hasValidEntityConfig,
    previewRecordUrl,
    tableColumns,
    visibleFormFields,
    statusOptions,
    totalPages,
    hasStatusFilter,
    hasMediaFields,
    mediaFieldOptions,
    canCreate,
    standaloneUpload,
    isMediaAssetsEntity,
    isVideosEntity,
    isBannerEntity,
    isEntityMediaEntity,
    isProductsEntity,
    isFormModalEntity,
    isFormModalOpen,
    showInlineEditor,
    inlineEditorPlacement,
    slugSourceField,
    actionConfirmButtonClass,
    featuredTableFields,
    previewMediaOptions,
    videoLibraryOptions,
    // preview functions
    resolveMediaUrl,
    isDirectVideoFile,
    isAllowedVideoUrl,
    isVideoMediaRecord,
    isImageMedia,
    videoUrlHint,
    mediaAssetPreviewUrl,
    mediaAssetLabel,
    rowThumbnailUrl,
    videoPreviewUrl,
    hasRichPreview,
    previewCard,
    previewMedia,
    previewStatusText,
    previewStatusTone,
    selectedMediaPreviewUrl,
    selectedMediaAsset,
    selectedMediaLabel,
    // form functions
    fieldLabel,
    fieldPlaceholder,
    fieldHelpText,
    isTextarea,
    isBooleanField,
    inputType,
    isSelectField,
    selectOptions,
    formatCell,
    recordDisplayName,
    relationSelectValue,
    selectedRelationSummary,
    relationPreviewPath,
    relationPreviewLabel,
    updateRelationField,
    handleSlugInput,
    handleSlugSourceInput,
    mediaUploadAccept,
    // banner
    bannerMediaRecord,
    bannerFormMediaRecord,
    bannerMediaUrl,
    bannerMediaAlt,
    bannerTypeLabel,
    bannerOrdinal,
    bannerDisplayTitle,
    bannerImageStyle,
    bannerFormImageStyle,
    canAdjustBannerFocus,
    bannerFocusIndicatorStyle,
    startBannerFocusAdjust,
    onBannerFocusAdjust,
    stopBannerFocusAdjust,
    resetBannerFocus,
    // CRUD
    openCreateForm,
    openEditForm,
    handleFieldUpdate,
    closeForm,
    submitForm,
    deleteRecord,
    // media upload
    handleFileChange,
    handleVideoFileChange,
    uploadMedia,
    uploadVideoFile,
    inlineUploadForField,
    removeGalleryUrl,
    // data
    refreshAll,
    loadRecords,
    setPage,
    // dialog
    cancelActionConfirmDialog,
    acceptActionConfirmDialog,
    // misc
    currentFormPreviewUrl,
    FIELD_GROUPS,
  }
}
