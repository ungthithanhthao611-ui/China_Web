<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/admin/api/adminApi.js'
import {
  DEFAULT_STATUS_OPTIONS,
  ENTITY_MANAGER_CONFIGS,
} from '@/admin/config/entityConfigs'
import { env } from '@/shared/config/env'
import EntityManagerConfirmDialog from './EntityManagerConfirmDialog.vue'
import EntityManagerEditor from './EntityManagerEditor.vue'
import EntityManagerFilters from './EntityManagerFilters.vue'
import EntityManagerRecordsTable from './EntityManagerRecordsTable.vue'
import EntityManagerToolbar from './EntityManagerToolbar.vue'
import EntityManagerUploadPanel from './EntityManagerUploadPanel.vue'
import { createEntityManagerBannerHelpers } from '@/admin/utils/entity-manager/bannerHelpers.js'
import { FIELD_GROUPS } from '@/admin/utils/entity-manager/constants.js'
import { createEntityManagerFormHelpers } from './formHelpers'
import { createEntityManagerPreviewHelpers } from './previewHelpers'

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
});

const emit = defineEmits(["notify-success", "notify-error", "clear-notify"]);

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, "");

const records = ref([]);
const mediaOptions = ref([]);
const relationOptions = reactive({});
const searchKeyword = ref("");
const statusFilter = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const totalRecords = ref(0);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const formOpen = ref(false);
const formMode = ref("create");
const editingRecordId = ref(null);
const inlineEditorRef = ref(null);
const slugManuallyEdited = ref(false);
const form = reactive({});
const formErrors = ref([]);
const uploadFile = ref(null);
const uploadTitle = ref("");
const uploadAltText = ref("");
const uploadTargetField = ref("image_id");
const uploading = ref(false);
const videoUploadFile = ref(null);
const videoUploading = ref(false);
const videoFileInputRef = ref(null);
const bannerFocusDragging = ref(false);
const actionConfirmDialog = reactive({
  visible: false,
  eyebrow: "Confirm action",
  title: "",
  message: "",
  confirmText: "Confirm",
  tone: "primary",
});
let actionConfirmResolver = null;
let isComponentAlive = true;
let relationLoadRequestId = 0;
let mediaLoadRequestId = 0;
let recordsLoadRequestId = 0;
let refreshCycleRequestId = 0;

const config = computed(() => ENTITY_MANAGER_CONFIGS[props.entityKey]);
const previewRecordUrl = computed(() =>
  typeof config.value?.preview === "function" ? config.value.preview : () => "",
);
const tableColumns = computed(() => config.value?.table || ["id"]);
const formFields = computed(() => config.value?.fields || []);
const visibleFormFields = computed(() =>
  isBannerEntity.value
    ? formFields.value.filter(
        (field) => !["image_id", "focus_x", "focus_y"].includes(field),
      )
    : formFields.value,
);
const statusOptions = computed(() => {
  const source =
    Array.isArray(config.value?.statusOptions) &&
    config.value.statusOptions.length
      ? config.value.statusOptions
      : DEFAULT_STATUS_OPTIONS;
  return source
    .map((option) => {
      if (typeof option === "string") {
        return { value: option, label: option };
      }
      return {
        value: String(option?.value || "").trim(),
        label: String(option?.label || option?.value || "").trim(),
      };
    })
    .filter((option) => option.value);
});
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalRecords.value / pageSize.value)),
);
const hasStatusFilter = computed(() => formFields.value.includes("status"));
const hasMediaFields = computed(() =>
  formFields.value.some((field) => FIELD_GROUPS.media.includes(field)),
);
const mediaFieldOptions = computed(() =>
  formFields.value.filter((field) => FIELD_GROUPS.media.includes(field)),
);
const canCreate = computed(() => config.value?.allowCreate !== false);
const standaloneUpload = computed(() =>
  Boolean(config.value?.standaloneUpload),
);
const isMediaAssetsEntity = computed(() => props.entityKey === "media_assets");
const isVideosEntity = computed(() => props.entityKey === "videos");
const isBannerEntity = computed(() => props.entityKey === "banners");
const isEntityMediaEntity = computed(() => props.entityKey === "entity_media");
const isConfigModalEntity = computed(
  () => config.value?.editorPresentation === "modal",
);
const isFormModalEntity = computed(
  () =>
    isBannerEntity.value || isVideosEntity.value || isConfigModalEntity.value,
);
const isFormModalOpen = computed(
  () => formOpen.value && isFormModalEntity.value,
);
const isBannerEditorModalOpen = computed(
  () => formOpen.value && isBannerEntity.value,
);
const showInlineEditor = computed(
  () => formOpen.value && !isFormModalEntity.value,
);
const inlineEditorPlacement = computed(
  () => config.value?.inlineEditorPlacement || "bottom",
);
const slugSourceField = computed(() => {
  if (!formFields.value.includes("slug")) return "";
  if (formFields.value.includes("name")) return "name";
  if (formFields.value.includes("title")) return "title";
  return "";
});
const actionConfirmButtonClass = computed(() =>
  actionConfirmDialog.tone === "danger" ? "btn btn-danger" : "btn btn-primary",
);
const featuredTableFields = computed(
  () => config.value?.featuredTableFields || [],
);
const previewMediaOptions = computed(() => {
  if (!hasMediaFields.value || !mediaOptions.value.length) return [];
  if (!isBannerEntity.value) return mediaOptions.value.slice(0, 8);

  const eligible = mediaOptions.value.filter(
    (media) =>
      (isImageMedia(media) || isVideoMediaRecord(media)) &&
      !isNoiseMediaAsset(media),
  );
  const bannerOnly = eligible.filter(isBannerRelatedMedia);
  return bannerOnly.slice(0, 8);
});
const videoLibraryOptions = computed(() => {
  if (!mediaOptions.value.length) return [];
  return mediaOptions.value.filter((media) => isVideoMediaRecord(media));
});

const previewHelpers = createEntityManagerPreviewHelpers({
  apiOrigin: API_ORIGIN,
  entityKey: computed(() => props.entityKey),
  getRelationOptions: (field) => relationOptions[field] || [],
  getRecords: () => records.value,
  getMediaOptions: () => mediaOptions.value,
});

const {
  resolveMediaUrl,
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
} = previewHelpers;

const selectedMediaAsset = (field) => previewHelpers.selectedMediaAsset(form, field);
const selectedMediaPreviewUrl = (field) =>
  previewHelpers.selectedMediaPreviewUrl(form, field);
const selectedMediaLabel = (field) => previewHelpers.selectedMediaLabel(form, field);

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
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 50;
    return Math.min(100, Math.max(0, numeric));
  },
  isAllowedVideoUrl,
});

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
} = formHelpers;

function notifySuccess(message) {
  emit("notify-success", message);
}

function notifyError(message) {
  emit("notify-error", message);
}

function clearNotify() {
  emit("clear-notify");
}

function closeActionConfirmDialog(confirmed = false) {
  actionConfirmDialog.visible = false;
  actionConfirmDialog.eyebrow = "Confirm action";
  actionConfirmDialog.title = "";
  actionConfirmDialog.message = "";
  actionConfirmDialog.confirmText = "Confirm";
  actionConfirmDialog.tone = "primary";

  if (actionConfirmResolver) {
    const resolve = actionConfirmResolver;
    actionConfirmResolver = null;
    resolve(Boolean(confirmed));
  }
}

function openActionConfirmDialog({
  eyebrow = "Confirm action",
  title,
  message,
  confirmText,
  tone = "primary",
}) {
  if (actionConfirmResolver) {
    actionConfirmResolver(false);
    actionConfirmResolver = null;
  }

  actionConfirmDialog.eyebrow = eyebrow;
  actionConfirmDialog.title = title;
  actionConfirmDialog.message = message;
  actionConfirmDialog.confirmText = confirmText;
  actionConfirmDialog.tone = tone;
  actionConfirmDialog.visible = true;

  return new Promise((resolve) => {
    actionConfirmResolver = resolve;
  });
}

function cancelActionConfirmDialog() {
  closeActionConfirmDialog(false);
}

function acceptActionConfirmDialog() {
  closeActionConfirmDialog(true);
}

async function confirmRecordAction(action, record = null) {
  const label = entityLabelForAction(record);
  if (action === "update") {
    return openActionConfirmDialog({
      eyebrow: "Update record",
      title: `Update ${label}?`,
      message: "Confirm to save the edited information.",
      confirmText: "Confirm Update",
      tone: "primary",
    });
  }

  if (action === "delete") {
    return openActionConfirmDialog({
      eyebrow: "Delete record",
      title: `Delete ${label}?`,
      message: "This action cannot be undone.",
      confirmText: "Confirm Delete",
      tone: "danger",
    });
  }

  return true;
}

function actionSuccessMessage(action, record = null) {
  const name = recordDisplayName(record);
  if (isBannerEntity.value) {
    if (action === "create") {
      return name
        ? `Them banner moi thanh cong: "${name}".`
        : "Them banner moi thanh cong.";
    }
    if (action === "update") {
      return name
        ? `Cap nhat banner thanh cong: "${name}".`
        : "Cap nhat banner thanh cong.";
    }
    if (action === "delete") {
      return name
        ? `Xoa banner thanh cong: "${name}".`
        : "Xoa banner thanh cong.";
    }
  }

  const label = String(config.value?.label || "Record").trim();
  if (action === "create") return `Created ${config.value.label} record.`;
  if (action === "update") {
    return name ? `Updated ${label}: "${name}".` : `Updated ${label} record.`;
  }
  if (action === "delete") {
    return name ? `Deleted ${label}: "${name}".` : `Deleted ${label} record.`;
  }
  return "Completed successfully.";
}

function currentFormPreviewUrl() {
  if (isEntityMediaEntity.value) {
    return relationPreviewPath("entity_id");
  }

  if (!formOpen.value) return "";

  if (props.entityKey === "project_category_items") {
    return relationPreviewPath("category_id");
  }

  if (props.entityKey === "projects" && String(form.slug || "").trim()) {
    return `/project/${String(form.slug).trim()}`;
  }

  if (!editingRecordId.value) return "";

  const resolver = config.value?.preview;
  if (!resolver) return "";

  const previewRecord = {
    id: editingRecordId.value || "__preview__",
    ...form,
  };

  return resolver(previewRecord) || "";
}

function normalizedToken() {
  return String(props.token || "").trim();
}

function entityRequestKey() {
  return `${props.entityKey}::${normalizedToken()}::${String(props.active)}`;
}

function clearRelationOptions() {
  Object.keys(relationOptions).forEach((key) => delete relationOptions[key]);
}

function resetEntityState() {
  records.value = [];
  mediaOptions.value = [];
  totalRecords.value = 0;
  loading.value = false;
  deletingId.value = null;
  clearRelationOptions();
}

function configuredPageSize() {
  const rawValue = Number(config.value?.pageSize || 10);
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 10;
}


const bannerHelpers = createEntityManagerBannerHelpers({
  form,
  isBannerEntity,
  getMediaOptionById,
  resolveMediaUrl,
  isVideoMediaRecord,
});

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
} = bannerHelpers;

function startBannerFocusAdjust(event) {
  if (!canAdjustBannerFocus()) return;
  bannerFocusDragging.value = true;
  applyBannerFocusFromPointer(event);
  event.currentTarget?.setPointerCapture?.(event.pointerId);
}

function onBannerFocusAdjust(event) {
  if (!bannerFocusDragging.value) return;
  applyBannerFocusFromPointer(event);
}

function stopBannerFocusAdjust(event) {
  if (!bannerFocusDragging.value) return;
  bannerFocusDragging.value = false;
  event.currentTarget?.releasePointerCapture?.(event.pointerId);
}



async function loadRelationOptions() {
  const token = normalizedToken();
  const requestId = ++relationLoadRequestId;
  const requestKey = entityRequestKey();

  if (!token) {
    if (requestId === relationLoadRequestId && requestKey === entityRequestKey()) {
      clearRelationOptions();
    }
    return;
  }

  clearRelationOptions();

  const relationMap = resolveRelationMap();

  const loadRelationRecords = async (entityName) => {
    const pageLimit = 100;
    const targetCount = relationFetchTargetCount(entityName);
    const items = [];
    let skip = 0;
    let total = Number.POSITIVE_INFINITY;

    while (items.length < targetCount && skip < total) {
      const response = await listAdminEntityRecords(entityName, token, {
        skip,
        limit: pageLimit,
      });
      const batch = response.items || [];
      total = Number(response.pagination?.total || batch.length);
      items.push(...batch);

      if (!batch.length || batch.length < pageLimit) {
        break;
      }
      skip += pageLimit;
    }

    return items;
  };

  try {
    const relationEntries = await Promise.all(
      Object.entries(relationMap)
        .filter(
          ([field, entityName]) => formFields.value.includes(field) && entityName,
        )
        .map(async ([field, entityName]) => [field, await loadRelationRecords(entityName)]),
    );

    if (
      !isComponentAlive ||
      requestId !== relationLoadRequestId ||
      requestKey !== entityRequestKey()
    ) {
      return;
    }

    relationEntries.forEach(([field, items]) => {
      relationOptions[field] = items;
    });

    if (
      formFields.value.includes("entity_id") &&
      form.entity_id !== "" &&
      form.entity_id !== null &&
      form.entity_id !== undefined
    ) {
      const hasCurrentEntity = (relationOptions.entity_id || []).some(
        (option) => String(option.id) === String(form.entity_id),
      );
      if (!hasCurrentEntity) {
        form.entity_id = null;
      }
    }
  } catch (error) {
    if (
      !isComponentAlive ||
      requestId !== relationLoadRequestId ||
      requestKey !== entityRequestKey()
    ) {
      return;
    }
    notifyError(error.message || "Failed to load relation options.");
  }
}

async function loadMediaOptions() {
  const token = normalizedToken();
  const requestId = ++mediaLoadRequestId;
  const requestKey = entityRequestKey();

  if (
    !token ||
    (!hasMediaFields.value && !standaloneUpload.value && !isVideosEntity.value)
  ) {
    if (requestId === mediaLoadRequestId && requestKey === entityRequestKey()) {
      mediaOptions.value = [];
    }
    return;
  }

  try {
    const response = await listAdminEntityRecords("media_assets", token, {
      skip: 0,
      limit: 100,
      status: "active",
    });

    if (
      !isComponentAlive ||
      requestId !== mediaLoadRequestId ||
      requestKey !== entityRequestKey()
    ) {
      return;
    }

    mediaOptions.value = response.items || [];
  } catch (error) {
    if (
      !isComponentAlive ||
      requestId !== mediaLoadRequestId ||
      requestKey !== entityRequestKey()
    ) {
      return;
    }
    mediaOptions.value = [];
    notifyError(error.message || "Failed to load media options.");
  }
}

async function loadRecords() {
  const token = normalizedToken();
  const requestId = ++recordsLoadRequestId;
  const requestKey = entityRequestKey();

  if (!token) {
    if (requestId === recordsLoadRequestId && requestKey === entityRequestKey()) {
      records.value = [];
      totalRecords.value = 0;
      loading.value = false;
    }
    return;
  }

  records.value = [];
  totalRecords.value = 0;
  loading.value = true;
  try {
    const query = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchKeyword.value.trim() || undefined,
    };
    if (hasStatusFilter.value && statusFilter.value) {
      query.status = statusFilter.value;
    }

    const response = await listAdminEntityRecords(
      props.entityKey,
      token,
      query,
    );

    if (
      !isComponentAlive ||
      requestId !== recordsLoadRequestId ||
      requestKey !== entityRequestKey()
    ) {
      return;
    }

    records.value = response.items || [];
    totalRecords.value = response.pagination?.total || 0;
  } catch (error) {
    if (
      !isComponentAlive ||
      requestId !== recordsLoadRequestId ||
      requestKey !== entityRequestKey()
    ) {
      return;
    }
    records.value = [];
    totalRecords.value = 0;
    notifyError(error.message || "Failed to load content records.");
  } finally {
    if (
      isComponentAlive &&
      requestId === recordsLoadRequestId &&
      requestKey === entityRequestKey()
    ) {
      loading.value = false;
    }
  }
}

async function refreshAll() {
  const requestId = ++refreshCycleRequestId;
  const requestKey = entityRequestKey();

  await loadRelationOptions();
  if (
    !isComponentAlive ||
    requestId !== refreshCycleRequestId ||
    requestKey !== entityRequestKey()
  ) {
    return;
  }

  await loadMediaOptions();
  if (
    !isComponentAlive ||
    requestId !== refreshCycleRequestId ||
    requestKey !== entityRequestKey()
  ) {
    return;
  }

  await loadRecords();
}

async function revealInlineEditor() {
  if (isFormModalEntity.value || !isComponentAlive) return;

  await nextTick();

  if (!isComponentAlive) return;

  const editorElement = inlineEditorRef.value;
  if (!editorElement || !editorElement.isConnected) {
    return;
  }

  editorElement.scrollIntoView({ behavior: "smooth", block: "start" });

  const firstFocusableField = editorElement.querySelector(
    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
  );

  firstFocusableField?.focus?.({ preventScroll: true });
}

function openCreateForm() {
  if (!canCreate.value) return;
  formMode.value = "create";
  editingRecordId.value = null;
  setDefaultFormValues();
  formOpen.value = true;
  void revealInlineEditor();
}

function openEditForm(record) {
  formMode.value = "edit";
  editingRecordId.value = record.id;
  setDefaultFormValues(record);
  if (typeof form.metadata_json === "object" && form.metadata_json !== null) {
    form.metadata_json = JSON.stringify(form.metadata_json, null, 2);
  }
  formOpen.value = true;
  void revealInlineEditor();
}

function closeForm() {
  formOpen.value = false;
  editingRecordId.value = null;
  formErrors.value = [];
}

async function submitForm() {
  const token = normalizedToken();
  if (!token) return;

  syncSlugFromSource();
  if (!validateForm()) return;

  if (formMode.value === "edit") {
    const confirmedUpdate = await confirmRecordAction("update");
    if (!confirmedUpdate) return;
  }

  saving.value = true;
  try {
    const payload = cleanPayload();
    if (formMode.value === "create") {
      await createAdminEntityRecord(props.entityKey, payload, token);
      notifySuccess(actionSuccessMessage("create"));
      closeForm();
      await loadRecords();
    } else {
      const updatedRecord = await updateAdminEntityRecord(
        props.entityKey,
        editingRecordId.value,
        payload,
        token,
      );
      records.value = records.value.map((record) =>
        String(record.id) === String(updatedRecord?.id)
          ? updatedRecord
          : record,
      );
      notifySuccess(actionSuccessMessage("update", updatedRecord));
      closeForm();
    }
  } catch (error) {
    formErrors.value = [error.message || "Failed to save record."];
    notifyError(error.message || "Failed to save record.");
  } finally {
    saving.value = false;
  }
}

async function deleteRecord(record) {
  const token = normalizedToken();
  if (!token) return;

  const confirmed = await confirmRecordAction("delete", record);
  if (!confirmed) return;

  deletingId.value = record.id;
  try {
    await deleteAdminEntityRecord(props.entityKey, record.id, token);
    notifySuccess(actionSuccessMessage("delete", record));
    await loadRecords();
  } catch (error) {
    notifyError(error.message || "Failed to delete record.");
  } finally {
    deletingId.value = null;
  }
}

function handleFileChange(event) {
  uploadFile.value = event.target.files?.[0] || null;
}

function handleVideoFileChange(event) {
  videoUploadFile.value = event.target.files?.[0] || null;
}

function triggerVideoUpload() {
  if (videoUploadFile.value) {
    uploadVideoFile();
  } else if (videoFileInputRef.value) {
    videoFileInputRef.value.click();
  }
}

async function uploadVideoFile() {
  const token = normalizedToken();
  if (!token || !videoUploadFile.value) {
    notifyError("Choose a video file to upload first.");
    return;
  }

  const allowedTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-m4v",
  ];
  const file = videoUploadFile.value;
  if (
    !allowedTypes.some((type) => file.type === type) &&
    !/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(file.name)
  ) {
    notifyError("Invalid video file type. Allowed: MP4, WebM, OGG, MOV.");
    return;
  }

  videoUploading.value = true;
  try {
    const media = await uploadAdminMediaAsset(token, videoUploadFile.value, {
      title: uploadTitle.value || form.title || videoUploadFile.value.name,
      altText: uploadAltText.value || form.title || videoUploadFile.value.name,
      assetFolder: mediaUploadAssetFolder(),
      publicIdBase: mediaUploadPublicIdBase(),
    });
    await loadMediaOptions();
    if (
      !mediaOptions.value.some((item) => String(item.id) === String(media.id))
    ) {
      mediaOptions.value = [media, ...mediaOptions.value];
    }
    if (isVideosEntity.value && media.url) {
      form.video_url = media.url;
    }
    videoUploadFile.value = null;
    if (videoFileInputRef.value) {
      videoFileInputRef.value.value = "";
    }
    if (media.storage_backend === "cloudinary") {
      notifySuccess(`Uploaded video #${media.id} to Cloudinary.`);
    } else if (media.fallback_reason) {
      notifySuccess(
        `Uploaded video #${media.id} to local storage. Cloudinary was skipped: ${media.fallback_reason}`,
      );
    } else {
      notifySuccess(`Uploaded video #${media.id} to local storage.`);
    }
  } catch (error) {
    notifyError(error.message || "Failed to upload video.");
  } finally {
    videoUploading.value = false;
  }
}

async function uploadMedia() {
  const token = normalizedToken();
  if (!token || !uploadFile.value) {
    notifyError("Choose a file to upload first.");
    return;
  }

  uploading.value = true;
  try {
    const media = await uploadAdminMediaAsset(token, uploadFile.value, {
      title: uploadTitle.value || form.title,
      altText: uploadAltText.value || form.title,
      assetFolder: mediaUploadAssetFolder(),
      publicIdBase: mediaUploadPublicIdBase(),
    });
    await loadMediaOptions();
    if (
      !mediaOptions.value.some((item) => String(item.id) === String(media.id))
    ) {
      mediaOptions.value = [media, ...mediaOptions.value];
    }
    if (standaloneUpload.value) {
      await loadRecords();
    } else if (isBannerEntity.value && "image_id" in form) {
      form.image_id = media.id;
    } else if (uploadTargetField.value && uploadTargetField.value in form) {
      form[uploadTargetField.value] = media.id;
    }
    uploadFile.value = null;
    uploadTitle.value = "";
    uploadAltText.value = "";
    if (media.storage_backend === "cloudinary") {
      notifySuccess(`Uploaded media #${media.id} to Cloudinary.`);
    } else if (media.fallback_reason) {
      notifySuccess(
        `Uploaded media #${media.id} to local storage. Cloudinary was skipped: ${media.fallback_reason}`,
      );
    } else {
      notifySuccess(`Uploaded media #${media.id} to local storage.`);
    }
  } catch (error) {
    notifyError(error.message || "Failed to upload media.");
  } finally {
    uploading.value = false;
  }
}

function setPage(page) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value);
}

function toggleFormModalBodyLock(locked) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("form-modal-open", locked);
}

function handleBannerConfirmEsc(event) {
  if (event.key === "Escape" && actionConfirmDialog.visible) {
    cancelActionConfirmDialog();
  }
}

watch(
  () => props.entityKey,
  async () => {
    currentPage.value = 1;
    pageSize.value = configuredPageSize();
    statusFilter.value = "";
    searchKeyword.value = "";
    closeForm();
    closeActionConfirmDialog(false);
    resetEntityState();
    if (props.active && normalizedToken()) {
      await refreshAll();
    }
  },
  { immediate: true },
);

watch([currentPage, pageSize], () => {
  if (props.active && normalizedToken()) {
    loadRecords();
  }
});

watch(
  () => props.active,
  async (active) => {
    if (active && normalizedToken()) {
      resetEntityState();
      await refreshAll();
    } else {
      closeForm();
      closeActionConfirmDialog(false);
    }
  },
);

watch(
  () => props.token,
  async (value) => {
    if (!String(value || "").trim()) {
      resetEntityState();
      closeForm();
      closeActionConfirmDialog(false);
      return;
    }
    if (props.active) {
      resetEntityState();
      await refreshAll();
    }
  },
);

watch(
  () => [props.entityKey, form.entity_type, formOpen.value],
  async ([entityKey, entityType, isOpen], previous = []) => {
    if (entityKey !== "entity_media" || !props.active || !normalizedToken())
      return;
    if (!isOpen) return;

    const currentType = String(entityType || "").trim();
    const previousType = String(previous?.[1] || "").trim();
    if (!currentType) return;
    if (currentType === previousType && previous?.[2] === isOpen) return;

    const allowedGroupValues = selectOptions("group_name").map((option) =>
      typeof option === "string" ? option : option.value,
    );
    if (!allowedGroupValues.includes(form.group_name)) {
      form.group_name = allowedGroupValues[0] || "";
    }

    await loadRelationOptions();
  },
);

watch(
  isFormModalOpen,
  (open) => {
    toggleFormModalBodyLock(open);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  isComponentAlive = false;
  relationLoadRequestId += 1;
  mediaLoadRequestId += 1;
  recordsLoadRequestId += 1;
  refreshCycleRequestId += 1;
  bannerFocusDragging.value = false;
  closeActionConfirmDialog(false);
  toggleFormModalBodyLock(false);
  window.removeEventListener("keydown", handleBannerConfirmEsc);
});

onMounted(() => {
  window.addEventListener("keydown", handleBannerConfirmEsc);
  pageSize.value = configuredPageSize();
});
</script>

<template>
  <section class="entity-manager">
    <EntityManagerToolbar
      :config="config"
      :can-create="canCreate"
      :loading="loading"
      @refresh="refreshAll"
      @create="openCreateForm"
    />

    <EntityManagerFilters
      :config="config"
      :search-keyword="searchKeyword"
      :status-filter="statusFilter"
      :has-status-filter="hasStatusFilter"
      :status-options="statusOptions"
      :loading="loading"
      @update:search-keyword="searchKeyword = $event"
      @update:status-filter="statusFilter = $event"
      @search="
        currentPage = 1;
        loadRecords();
      "
    />

    <EntityManagerUploadPanel
      v-if="standaloneUpload"
      :uploading="uploading"
      :upload-title="uploadTitle"
      :upload-alt-text="uploadAltText"
      @file-change="handleFileChange"
      @update:upload-title="uploadTitle = $event"
      @update:upload-alt-text="uploadAltText = $event"
      @upload="uploadMedia"
    />

    <div
      :class="[
        'records-panel',
        {
          'records-panel--after-inline-editor':
            showInlineEditor && inlineEditorPlacement === 'top',
        },
      ]"
    >
      <EntityManagerRecordsTable
        :records="records"
        :table-columns="tableColumns"
        :field-label="fieldLabel"
        :format-cell="formatCell"
        :loading="loading"
        :featured-table-fields="featuredTableFields"
        :is-media-assets-entity="isMediaAssetsEntity"
        :is-videos-entity="isVideosEntity"
        :is-banner-entity="isBannerEntity"
        :is-image-media-record="isImageMedia"
        :is-video-media-record="isVideoMediaRecord"
        :media-asset-preview-url="mediaAssetPreviewUrl"
        :media-asset-label="mediaAssetLabel"
        :resolve-media-url="resolveMediaUrl"
        :row-thumbnail-url="rowThumbnailUrl"
        :video-preview-url="videoPreviewUrl"
        :video-url-hint="videoUrlHint"
        :is-direct-video-file="isDirectVideoFile"
        :preview-record-url="previewRecordUrl"
        :has-rich-preview="hasRichPreview"
        :preview-card="previewCard"
        :preview-media="previewMedia"
        :preview-status-text="previewStatusText"
        :preview-status-tone="previewStatusTone"
        :banner-media-record="bannerMediaRecord"
        :banner-media-url="bannerMediaUrl"
        :banner-media-alt="bannerMediaAlt"
        :banner-image-style="bannerImageStyle"
        :banner-display-title="bannerDisplayTitle"
        :banner-type-label="bannerTypeLabel"
        :banner-ordinal="bannerOrdinal"
        :deleting-id="deletingId"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-records="totalRecords"
        :page-size="pageSize"
        @edit="openEditForm"
        @delete="deleteRecord"
        @set-page="setPage"
        @update:page-size="pageSize = $event"
      />
    </div>

    <EntityManagerEditor
      :form-open="formOpen"
      :inline-editor-ref="inlineEditorRef"
      :is-form-modal-entity="isFormModalEntity"
      :show-inline-editor="showInlineEditor"
      :inline-editor-placement="inlineEditorPlacement"
      :form-mode="formMode"
      :config="config"
      :form-errors="formErrors"
      :has-media-fields="hasMediaFields"
      :is-videos-entity="isVideosEntity"
      :is-banner-entity="isBannerEntity"
      :upload-target-field="uploadTargetField"
      :media-field-options="mediaFieldOptions"
      :field-label="fieldLabel"
      :media-upload-accept="mediaUploadAccept"
      :upload-title="uploadTitle"
      :upload-alt-text="uploadAltText"
      :uploading="uploading"
      :visible-form-fields="visibleFormFields"
      :is-textarea="isTextarea"
      :form="form"
      :is-boolean-field="isBooleanField"
      :field-help-text="fieldHelpText"
      :media-options="mediaOptions"
      :selected-media-preview-url="selectedMediaPreviewUrl"
      :selected-media-asset="selectedMediaAsset"
      :selected-media-label="selectedMediaLabel"
      :is-video-media-record="isVideoMediaRecord"
      :relation-options="relationOptions"
      :relation-select-value="relationSelectValue"
      :is-select-field="isSelectField"
      :select-options="selectOptions"
      :field-placeholder="fieldPlaceholder"
      :input-type="inputType"
      :video-uploading="videoUploading"
      :video-upload-file="videoUploadFile"
      :video-library-options="videoLibraryOptions"
      :is-allowed-video-url="isAllowedVideoUrl"
      :video-url-hint="videoUrlHint"
      :is-direct-video-file="isDirectVideoFile"
      :resolve-media-url="resolveMediaUrl"
      :selected-relation-summary="selectedRelationSummary"
      :relation-preview-path="relationPreviewPath"
      :relation-preview-label="relationPreviewLabel"
      :editing-record-id="editingRecordId"
      :banner-display-title="bannerDisplayTitle"
      :banner-type-label="bannerTypeLabel"
      :banner-ordinal="bannerOrdinal"
      :can-adjust-banner-focus="canAdjustBannerFocus"
      :banner-focus-dragging="bannerFocusDragging"
      :banner-media-url="bannerMediaUrl"
      :banner-form-media-record="bannerFormMediaRecord"
      :banner-media-alt="bannerMediaAlt"
      :banner-form-image-style="bannerFormImageStyle"
      :banner-focus-indicator-style="bannerFocusIndicatorStyle"
      :preview-media-options="previewMediaOptions"
      :is-image-media="isImageMedia"
      :current-form-preview-url="currentFormPreviewUrl"
      :saving="saving"
      :field-groups="FIELD_GROUPS"
      @close="closeForm"
      @submit="submitForm"
      @file-change="handleFileChange"
      @video-file-change="handleVideoFileChange"
      @upload-media="uploadMedia"
      @upload-video="uploadVideoFile"
      @update:upload-target-field="uploadTargetField = $event"
      @update:upload-title="uploadTitle = $event"
      @update:upload-alt-text="uploadAltText = $event"
      @update:field="(field, value) => (form[field] = value)"
      @update:relation-field="updateRelationField"
      @slug-input="handleSlugInput()"
      @slug-source-input="handleSlugSourceInput($event)"
      @video-library-select="
        form.video_url = $event;
      "
      @reset-banner-focus="resetBannerFocus"
      @banner-focus-start="startBannerFocusAdjust"
      @banner-focus-move="onBannerFocusAdjust"
      @banner-focus-stop="stopBannerFocusAdjust"
    />

    <EntityManagerConfirmDialog
      :visible="actionConfirmDialog.visible"
      :dialog="actionConfirmDialog"
      :confirm-button-class="actionConfirmButtonClass"
      @cancel="cancelActionConfirmDialog"
      @accept="acceptActionConfirmDialog"
    />
  </section>
</template>

<style scoped>
.entity-manager {
  margin-top: 18px;
  display: grid;
  gap: 18px;
}

.records-panel--after-inline-editor {
  order: 4;
}

.manager-toolbar,
.filters,
.records-panel,
.upload-panel {
  position: relative;
  border-radius: 28px;
  border: 1px solid rgba(198, 216, 233, 0.72);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 249, 255, 0.94));
  box-shadow:
    0 18px 40px rgba(18, 43, 71, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.manager-toolbar::before,
.filters::before,
.records-panel::before,
.upload-panel::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(120, 170, 235, 0.3), rgba(255, 255, 255, 0.9));
  pointer-events: none;
}

.manager-toolbar,
.upload-panel {
  padding: 20px;
}

.manager-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.manager-toolbar__content {
  display: grid;
  gap: 12px;
}

.manager-toolbar__badge-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.manager-toolbar__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(73, 147, 220, 0.12);
  border: 1px solid rgba(73, 147, 220, 0.18);
  color: #1f5f95;
  font-size: 12px;
  font-weight: 700;
}

.eyebrow {
  margin: 0;
  color: #6c839c;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 800;
}

h2,
h3 {
  margin: 0;
  color: #15314d;
}

.manager-toolbar h2 {
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.05;
}

.description {
  margin: 0;
  max-width: 920px;
  color: #5d7690;
  font-size: 14px;
  line-height: 1.65;
}

.toolbar-actions,
.filters,
.row-actions,
.form-actions,
.upload-row,
.pagination,
.pagination__actions,
.records-panel__summary,
.pagination__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filters {
  padding: 16px 18px;
  justify-content: space-between;
}

.filters__group {
  display: grid;
  gap: 8px;
}

.filters__group--search {
  flex: 1;
  min-width: 260px;
}

.filters__group--status {
  min-width: 180px;
}

.filters__label {
  color: #6a8097;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.filters__actions {
  display: flex;
  align-items: end;
  gap: 10px;
}

input,
select,
textarea {
  min-height: 48px;
  border: 1px solid rgba(198, 216, 233, 0.95);
  border-radius: 16px;
  padding: 12px 14px;
  color: #17324d;
  background: rgba(255, 255, 255, 0.98);
  font: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: rgba(63, 140, 221, 0.74);
  box-shadow: 0 0 0 4px rgba(79, 167, 255, 0.14);
}

textarea {
  resize: vertical;
}

.filters input {
  width: 100%;
}

.btn,
.icon-btn {
  border-radius: 16px;
  border: 1px solid transparent;
  min-height: 46px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.btn:hover:not(:disabled),
.icon-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #1f7ae0 0%, #4fa7ff 100%);
  box-shadow: 0 16px 30px rgba(31, 122, 224, 0.22);
}

.btn-secondary {
  color: #284767;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 252, 0.96));
  border-color: rgba(198, 216, 233, 0.95);
}

.btn-danger {
  color: #fff;
  background: linear-gradient(135deg, #d84762 0%, #ef7288 100%);
  box-shadow: 0 16px 28px rgba(216, 71, 98, 0.18);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.records-panel {
  overflow: hidden;
}

.records-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(221, 231, 242, 0.95);
  background: linear-gradient(180deg, rgba(251, 253, 255, 0.96), rgba(245, 250, 255, 0.92));
}

.records-panel__header h3 {
  margin-top: 8px;
  font-size: 22px;
}

.records-panel__summary {
  justify-content: flex-end;
}

.records-summary-card {
  min-width: 120px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(210, 223, 236, 0.95);
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  gap: 4px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.records-summary-card span {
  color: #6a8199;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 800;
}

.records-summary-card strong {
  color: #16314d;
  font-size: 24px;
  line-height: 1;
}

.table-wrap {
  overflow-x: auto;
  padding: 0 14px 14px;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0 12px;
}

th,
td {
  border: 0;
  padding: 16px 14px;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
}

th {
  padding-top: 14px;
  padding-bottom: 6px;
  color: #698199;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

tbody tr {
  background: rgba(255, 255, 255, 0.92);
}

.entity-row td:first-child {
  border-top-left-radius: 22px;
  border-bottom-left-radius: 22px;
}

.entity-row td:last-child {
  border-top-right-radius: 22px;
  border-bottom-right-radius: 22px;
}

.entity-row td {
  border-top: 1px solid rgba(220, 230, 242, 0.94);
  border-bottom: 1px solid rgba(220, 230, 242, 0.94);
  background: rgba(255, 255, 255, 0.92);
}

.entity-row td:first-child {
  border-left: 1px solid rgba(220, 230, 242, 0.94);
}

.entity-row td:last-child {
  border-right: 1px solid rgba(220, 230, 242, 0.94);
}

.table-empty-row td {
  text-align: center;
  border: 1px dashed rgba(194, 212, 230, 0.9);
  border-radius: 20px;
  background: rgba(248, 251, 255, 0.96);
  color: #647b95;
}

td a {
  color: #1b72b8;
  font-weight: 700;
  text-decoration: none;
}

td a:hover {
  text-decoration: underline;
}

.cell-featured {
  background: linear-gradient(180deg, rgba(47, 137, 238, 0.06), rgba(47, 137, 238, 0.02));
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
.selected-media-preview,
.entity-rich-preview {
  display: grid;
  gap: 8px;
}

.entity-rich-preview {
  min-width: 240px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(215, 228, 241, 0.96);
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(242, 247, 253, 0.94));
}

.entity-rich-preview__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.entity-rich-preview__badge,
.entity-rich-preview__status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.entity-rich-preview__badge {
  color: #1d5f85;
  background: rgba(39, 158, 208, 0.12);
  border: 1px solid rgba(39, 158, 208, 0.18);
  text-transform: uppercase;
}

.entity-rich-preview__status {
  color: #25704f;
  background: rgba(58, 181, 116, 0.12);
  border: 1px solid rgba(58, 181, 116, 0.16);
}

.entity-rich-preview__status.is-warning {
  color: #8a5a12;
  background: rgba(246, 192, 73, 0.16);
  border-color: rgba(246, 192, 73, 0.24);
}

.entity-rich-preview__title {
  color: #1f3850;
  font-size: 14px;
  line-height: 1.45;
}

.entity-rich-preview__summary {
  margin: 0;
  color: #5b738d;
  font-size: 12px;
  line-height: 1.55;
}

.entity-rich-preview__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.entity-rich-preview__meta span {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #edf4fb;
  color: #46627f;
  font-size: 11px;
}

.entity-rich-preview__media img,
.entity-rich-preview__media video {
  width: 100%;
  max-width: 240px;
  max-height: 140px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid rgba(216, 227, 240, 0.96);
  background: #edf3fa;
  box-shadow: 0 12px 24px rgba(20, 39, 58, 0.08);
}

.entity-rich-preview__media--video video {
  background: #09131f;
}

.entity-rich-preview__media-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed #b7cadf;
  background: #f5f9fd;
  color: #1d5f85;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.entity-rich-preview__media-label {
  color: #607893;
  font-size: 11px;
}

.entity-rich-preview__link {
  font-size: 12px;
}

.media-title-cell {
  grid-template-columns: 72px minmax(120px, 1fr);
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
  width: 72px;
  height: 56px;
  object-fit: cover;
  border-radius: 10px;
  background: #edf3fa;
  border: 1px solid rgba(216, 227, 240, 0.96);
}

.media-title-placeholder,
.video-table-thumb-cell__empty {
  width: 72px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #edf3fa;
  border: 1px solid rgba(216, 227, 240, 0.96);
  color: #607893;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
}

.media-title-cell span {
  overflow-wrap: anywhere;
}

.video-preview-cell__player,
.video-form-preview {
  width: min(240px, 100%);
  border-radius: 14px;
  overflow: hidden;
  background: #09131f;
  border: 1px solid rgba(216, 227, 240, 0.96);
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
.selected-media-preview small,
.banner-media-cell small,
.media-preview-list small {
  color: #607893;
  font-size: 11px;
}

.pagination {
  justify-content: space-between;
  padding: 18px 20px 20px;
  border-top: 1px solid rgba(221, 231, 242, 0.95);
  color: #5a718b;
}

.pagination__divider {
  width: 1px;
  height: 18px;
  background: rgba(198, 216, 233, 0.95);
}

.upload-panel {
  align-items: flex-start;
}

.upload-panel__intro {
  display: grid;
  gap: 8px;
}

.upload-row--standalone {
  flex: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr auto;
  gap: 14px;
  width: 100%;
}

.upload-field {
  display: grid;
  gap: 8px;
}

.upload-field span {
  color: #6a8097;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.upload-field--action {
  min-width: 150px;
}

.banner-preview-card {
  position: relative;
  min-width: 240px;
  min-height: 146px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(212, 224, 239, 0.95);
  background: linear-gradient(135deg, #071122, #11294a);
  box-shadow: 0 18px 34px rgba(11, 27, 44, 0.14);
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
    linear-gradient(180deg, rgba(2, 9, 19, 0.16) 0%, rgba(2, 10, 23, 0.18) 22%, rgba(2, 10, 23, 0.54) 100%),
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

.banner-focus-tools__row {
  justify-content: space-between;
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
  padding: 18px;
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
  min-height: 26px;
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
  color: #ff5267;
  font-size: 24px;
  line-height: 1;
}

.banner-preview-card__content h4,
.banner-preview-card__content p,
.banner-preview-card__content small {
  margin: 0;
}

.banner-preview-card__content h4 {
  font-size: 18px;
  line-height: 1.18;
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

.media-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.media-preview-list article {
  border: 1px solid rgba(216, 227, 240, 0.96);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  min-height: 126px;
  padding: 8px;
  display: grid;
  gap: 6px;
  align-content: start;
}

.media-preview-list img,
.media-preview-list video {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 10px;
  background: #edf3fa;
}

.media-preview-list span {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: #edf3fa;
  color: #607893;
}

@media (max-width: 1180px) {
  .upload-row--standalone {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .manager-toolbar,
  .upload-panel,
  .records-panel__header,
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-actions,
  .records-panel__summary,
  .pagination__actions {
    width: 100%;
  }
}

@media (max-width: 860px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filters__group,
  .filters__actions,
  .toolbar-actions > *,
  .filters__actions > *,
  .upload-row > * {
    width: 100%;
  }

  .row-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .table-wrap {
    overflow: visible;
    padding: 12px;
  }

  table {
    min-width: 0;
    border-spacing: 0;
  }

  thead {
    display: none;
  }

  tbody {
    display: grid;
    gap: 12px;
  }

  .entity-row {
    display: block;
    border-radius: 22px;
    overflow: hidden;
    box-shadow: 0 12px 26px rgba(17, 41, 67, 0.08);
  }

  .entity-row td,
  .entity-row td:first-child,
  .entity-row td:last-child {
    display: grid;
    grid-template-columns: minmax(120px, 38%) minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    border-radius: 0;
    border-left: 1px solid rgba(220, 230, 242, 0.94);
    border-right: 1px solid rgba(220, 230, 242, 0.94);
    border-bottom: 1px dashed rgba(220, 230, 242, 0.94);
    padding: 12px 14px;
  }

  .entity-row td:first-child {
    border-top: 1px solid rgba(220, 230, 242, 0.94);
  }

  .entity-row td:last-child {
    border-bottom: 1px solid rgba(220, 230, 242, 0.94);
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
    padding: 16px 12px;
  }

  .table-empty-row td::before {
    content: none;
  }
}

@media (max-width: 560px) {
  .manager-toolbar,
  .filters,
  .records-panel__header,
  .pagination,
  .upload-panel {
    padding: 14px;
  }

  .upload-row--standalone,
  .pagination__meta,
  .pagination__actions {
    width: 100%;
    display: grid;
    gap: 10px;
  }

  .entity-row td,
  .entity-row td:first-child,
  .entity-row td:last-child {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .pagination__divider {
    display: none;
  }
}

:global(body.form-modal-open) {
  overflow: hidden;
}
</style>

