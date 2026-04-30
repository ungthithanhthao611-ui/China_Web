<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AboutGroupedView from '@/views/admin/features/about/pages/AboutGroupedView.vue'
import { useEntityManager } from '@/views/admin/shared/composables/useEntityManager.js'
import { getAdminEntityRecord } from '@/views/admin/shared/api/adminApi'
import EntityManagerConfirmDialog from '@/views/admin/shared/components/CoreConfirmDialog.vue'
import EntityManagerEditor from '@/views/admin/shared/components/AdminCoreEditor.vue'
import EntityManagerFilters from '@/views/admin/shared/components/CoreFilters.vue'
import EntityManagerRecordsTable from '@/views/admin/shared/components/CoreRecordsTable.vue'
import EntityManagerToolbar from '@/views/admin/shared/components/CoreToolbar.vue'
import EntityManagerUploadPanel from '@/views/admin/shared/components/CoreUploadPanel.vue'

const props = defineProps({
  token: { type: String, required: true },
  entityKey: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

const {
  records,
  mediaOptions,
  relationOptions,
  searchKeyword,
  statusFilter,
  productStockFilter,
  aboutSectionFilter,
  aboutBlockFilter,
  aboutCompletenessFilter,
  aboutMediaFilter,
  aboutViewMode,
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
  bannerFocusDragging,
  actionConfirmDialog,
  productInlineUploading,
  galleryUploadProgress,
  config,
  resolvedEntityKey,
  hasValidEntityConfig,
  previewRecordUrl,
  tableColumns,
  visibleFormFields,
  statusOptions,
  totalPages,
  hasStatusFilter,
  hasProductStockFilter,
  productStockFilterOptions,
  hasMediaFields,
  mediaFieldOptions,
  canCreate,
  standaloneUpload,
  isMediaAssetsEntity,
  isVideosEntity,
  isBannerEntity,
  isProductsEntity,
  isFormModalEntity,
  showInlineEditor,
  inlineEditorPlacement,
  slugSourceField,
  actionConfirmButtonClass,
  featuredTableFields,
  previewMediaOptions,
  videoLibraryOptions,
  isAboutContentBlockItemsEntity,
  aboutFilterConfig,
  aboutViewModeOptions,
  hasAdvancedAboutFilters,
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
  openCreateForm,
  openEditForm,
  handleFieldUpdate,
  closeForm,
  submitForm,
  deleteRecord,
  autoTranslate,
  handleFileChange,
  handleVideoFileChange,
  uploadMedia,
  uploadVideoFile,
  inlineUploadForField,
  removeGalleryUrl,
  refreshAll,
  loadRecords,
  setPage,
  cancelActionConfirmDialog,
  acceptActionConfirmDialog,
  currentFormPreviewUrl,
  FIELD_GROUPS,
} = useEntityManager(props, emit)

const router = useRouter()

const safeEditLabel = computed(() => config?.value?.editLabel || 'Sửa')
const isUsersEntity = computed(() => resolvedEntityKey.value === 'users')
const shouldUseAboutGroupedView = computed(
  () => isAboutContentBlockItemsEntity.value && aboutViewMode.value === 'grouped',
)
const inlineUserDetailLoading = ref(false)
const inlineUserDetailError = ref('')
const inlineUserDetailRecord = ref(null)
const inlineUserDetailOpen = ref(false)

const inlineUserAvatarUrl = computed(() => {
  const raw = String(inlineUserDetailRecord.value?.avatar_url || '').trim()
  if (raw) return raw

  const fallbackName = String(
    inlineUserDetailRecord.value?.username ||
      inlineUserDetailRecord.value?.email ||
      'User',
  )

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=f2e8d5&color=7a5d2e&size=256`
})

const inlineUserLoginHistory = computed(() =>
  Array.isArray(inlineUserDetailRecord.value?.login_history)
    ? inlineUserDetailRecord.value.login_history
    : [],
)

const inlineUserLoginHistoryCount = computed(() =>
  Number(
    inlineUserDetailRecord.value?.login_history_count ||
      inlineUserLoginHistory.value.length ||
      0,
  ),
)

const inlineUserDetailFields = computed(() => {
  if (!inlineUserDetailRecord.value) return []

  return [
    {
      key: 'username',
      label: 'Tên đăng nhập',
      value: inlineUserDetailRecord.value.username,
    },
    {
      key: 'full_name',
      label: 'Họ và tên',
      value: inlineUserDetailRecord.value.full_name,
    },
    {
      key: 'email',
      label: 'Email',
      value: inlineUserDetailRecord.value.email,
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      value: inlineUserDetailRecord.value.phone,
    },
    {
      key: 'address',
      label: 'Địa chỉ',
      value: inlineUserDetailRecord.value.address,
    },
    {
      key: 'created_at',
      label: 'Ngày tạo tài khoản',
      value: formatInlineUserDateTime(inlineUserDetailRecord.value.created_at),
    },
    {
      key: 'updated_at',
      label: 'Cập nhật gần nhất',
      value: formatInlineUserDateTime(inlineUserDetailRecord.value.updated_at),
    },
    {
      key: 'status',
      label: 'Trạng thái tài khoản',
      value: inlineUserDetailRecord.value.is_active ? 'Đang hoạt động' : 'Đã bị khóa',
      tone: inlineUserDetailRecord.value.is_active ? 'success' : 'danger',
    },
    {
      key: 'role',
      label: 'Phân quyền',
      value: inlineUserDetailRecord.value.role,
    },
  ]
})

function formatInlineUserDateTime(value) {
  if (!value) return 'Chưa cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function normalizeInlineUserValue(value) {
  return String(value ?? '').trim() || 'Chưa cập nhật'
}

function applyFilters() {
  currentPage.value = 1
  loadRecords()
}

function resetAboutFilters() {
  aboutSectionFilter.value = ''
  aboutBlockFilter.value = ''
  aboutCompletenessFilter.value = ''
  aboutMediaFilter.value = ''
  aboutViewMode.value = aboutViewModeOptions.value[1]?.value || aboutViewModeOptions.value[0]?.value || 'table'
  applyFilters()
}

function closeInlineUserDetail() {
  inlineUserDetailOpen.value = false
  inlineUserDetailError.value = ''
  inlineUserDetailRecord.value = null
}

async function openDetail(record) {
  if (!record?.id) return

  if (isUsersEntity.value) {
    inlineUserDetailLoading.value = true
    inlineUserDetailError.value = ''
    inlineUserDetailOpen.value = true

    try {
      inlineUserDetailRecord.value = await getAdminEntityRecord(
        'users',
        record.id,
        props.token,
      )
    } catch (error) {
      inlineUserDetailError.value =
        error?.message || 'Không thể tải chi tiết tài khoản người dùng.'
    } finally {
      inlineUserDetailLoading.value = false
    }
    return
  }

  openEditForm(record)
}

</script>

<template>
  <section class="entity-manager">
    <div
      v-if="!hasValidEntityConfig"
      class="entity-manager__config-warning"
      role="alert"
    >
      <p class="entity-manager__config-warning-eyebrow">Cấu hình module không hợp lệ</p>
      <h3>Không thể khởi tạo module quản trị</h3>
      <p>
        Entity key hiện tại: <strong>{{ resolvedEntityKey || props.entityKey }}</strong>.
        Vui lòng kiểm tra wrapper manager và cấu hình trong <code>ENTITY_MANAGER_CONFIGS</code>.
      </p>
    </div>

    <template v-else>
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
        :product-stock-filter="productStockFilter"
        :has-status-filter="hasStatusFilter"
        :has-product-stock-filter="hasProductStockFilter"
        :product-stock-filter-options="productStockFilterOptions"
        :status-options="statusOptions"
        :loading="loading"
        :has-advanced-about-filters="hasAdvancedAboutFilters"
        :about-filter-config="aboutFilterConfig"
        :about-section-filter="aboutSectionFilter"
        :about-block-filter="aboutBlockFilter"
        :about-completeness-filter="aboutCompletenessFilter"
        :about-media-filter="aboutMediaFilter"
        :about-view-mode="aboutViewMode"
        :about-view-mode-options="aboutViewModeOptions"
        @update:search-keyword="searchKeyword = $event"
        @update:status-filter="statusFilter = $event"
        @update:product-stock-filter="productStockFilter = $event"
        @update:about-section-filter="aboutSectionFilter = $event"
        @update:about-block-filter="aboutBlockFilter = $event"
        @update:about-completeness-filter="aboutCompletenessFilter = $event"
        @update:about-media-filter="aboutMediaFilter = $event"
        @update:about-view-mode="aboutViewMode = $event"
        @search="applyFilters"
        @reset-about-filters="resetAboutFilters"
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
        <AboutGroupedView
          v-if="shouldUseAboutGroupedView"
          :records="records"
          :loading="loading"
          :deleting-id="deletingId"
          :preview-media="previewMedia"
          :resolve-media-url="resolveMediaUrl"
          :is-image-media-record="isImageMedia"
          :is-video-media-record="isVideoMediaRecord"
          :record-display-name="recordDisplayName"
          @edit="openEditForm"
          @delete="deleteRecord"
        />

        <EntityManagerRecordsTable
          v-else
          :entity-key="resolvedEntityKey"
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
          :edit-label="safeEditLabel"
          :record-display-name="recordDisplayName"
          @view="openDetail"
          @edit="openEditForm"
          @delete="deleteRecord"
          @set-page="setPage"
          @update:page-size="pageSize = $event"
        />
      </div>

      <div
        v-if="isUsersEntity && inlineUserDetailOpen"
        class="inline-user-detail-modal"
        @click.self="closeInlineUserDetail"
      >
        <section class="inline-user-detail-modal__dialog">
          <div class="inline-user-detail__header">
            <div>
              <p class="inline-user-detail__eyebrow">Quản lý tài khoản</p>
              <h3>Chi tiết tài khoản người dùng</h3>
            </div>
            <div class="inline-user-detail__actions">
              <button
                type="button"
                class="inline-user-detail__button inline-user-detail__button--ghost"
                @click="closeInlineUserDetail"
              >
                Đóng
              </button>
              <button
                type="button"
                class="inline-user-detail__button inline-user-detail__button--primary"
                :disabled="inlineUserDetailLoading || !inlineUserDetailRecord?.id"
                @click="openDetail(inlineUserDetailRecord)"
              >
                {{ inlineUserDetailLoading ? 'Đang tải...' : 'Làm mới' }}
              </button>
            </div>
          </div>

          <div v-if="inlineUserDetailLoading" class="inline-user-detail__state">
            Đang tải chi tiết tài khoản...
          </div>

          <div
            v-else-if="inlineUserDetailError"
            class="inline-user-detail__state inline-user-detail__state--error"
          >
            {{ inlineUserDetailError }}
          </div>

          <div v-else-if="inlineUserDetailRecord" class="inline-user-detail__grid">
            <article class="inline-user-card">
              <div class="inline-user-card__head">
                <div class="inline-user-card__avatar">
                  <img
                    :src="inlineUserAvatarUrl"
                    :alt="normalizeInlineUserValue(inlineUserDetailRecord.username || inlineUserDetailRecord.email)"
                  />
                </div>
                <div class="inline-user-card__title">
                  <p>Thông tin đầy đủ</p>
                  <h4>
                    {{ normalizeInlineUserValue(inlineUserDetailRecord.username || inlineUserDetailRecord.email) }}
                  </h4>
                  <span>{{ normalizeInlineUserValue(inlineUserDetailRecord.email) }}</span>
                </div>
              </div>

              <div class="inline-user-card__section-head">
                <div>
                  <p class="inline-user-detail__eyebrow">Thông tin đầy đủ</p>
                  <h5>Chi tiết tài khoản</h5>
                </div>
              </div>

              <div class="inline-user-card__details">
                <article
                  v-for="field in inlineUserDetailFields"
                  :key="field.key"
                  class="inline-user-card__detail-item"
                >
                  <span>{{ field.label }}</span>
                  <strong :class="field.tone ? `is-${field.tone}` : ''">
                    {{ normalizeInlineUserValue(field.value) }}
                  </strong>
                </article>
              </div>
            </article>

            <article class="inline-user-history">
              <div class="inline-user-card__section-head">
                <div>
                  <p class="inline-user-detail__eyebrow">Bảo mật tài khoản</p>
                  <h5>Lịch sử đăng nhập</h5>
                </div>
                <span class="inline-user-history__count">
                  {{ inlineUserLoginHistoryCount }} bản ghi
                </span>
              </div>

              <div
                v-if="inlineUserLoginHistory.length"
                class="inline-user-history__list"
              >
                <article
                  v-for="item in inlineUserLoginHistory"
                  :key="item.id"
                  class="inline-user-history__item"
                >
                  <div class="inline-user-history__dot"></div>
                  <div class="inline-user-history__body">
                    <div class="inline-user-history__row">
                      <strong>{{ formatInlineUserDateTime(item.login_at) }}</strong>
                      <span>
                        {{ normalizeInlineUserValue(item.login_method).toUpperCase() }}
                      </span>
                    </div>
                    <p><b>IP:</b> {{ normalizeInlineUserValue(item.ip_address) }}</p>
                    <p>
                      <b>User-Agent:</b>
                      {{ normalizeInlineUserValue(item.user_agent) }}
                    </p>
                  </div>
                </article>
              </div>

              <div v-else class="inline-user-history__empty">
                Chưa có dữ liệu lịch sử đăng nhập.
              </div>
            </article>
          </div>
        </section>
      </div>

      <EntityManagerEditor
        :entity-key="props.entityKey"
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
        :is-products-entity="isProductsEntity"
        :is-banner-entity="isBannerEntity"
        :upload-target-field="uploadTargetField"
        :media-field-options="mediaFieldOptions"
        :field-label="fieldLabel"
        :media-upload-accept="mediaUploadAccept"
        :upload-title="uploadTitle"
        :upload-alt-text="uploadAltText"
        :uploading="uploading"
        :upload-file-name="uploadFile?.name || ''"
        :upload-file-exists="!!uploadFile"
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
        :product-inline-uploading="productInlineUploading"
        :gallery-upload-progress="galleryUploadProgress"
        @close="closeForm"
        @submit="submitForm"
        @file-change="handleFileChange"
        @video-file-change="handleVideoFileChange"
        @upload-media="uploadMedia"
        @upload-video="uploadVideoFile"
        @update:upload-target-field="uploadTargetField = $event"
        @update:upload-title="uploadTitle = $event"
        @update:upload-alt-text="uploadAltText = $event"
        @update:field="handleFieldUpdate"
        @update:relation-field="updateRelationField"
        @slug-input="handleSlugInput(slugSourceField, formMode)"
        @slug-source-input="handleSlugSourceInput($event, slugSourceField, formMode)"
        @video-library-select="form.video_url = $event"
        @reset-banner-focus="resetBannerFocus"
        @banner-focus-start="startBannerFocusAdjust"
        @banner-focus-move="onBannerFocusAdjust"
        @banner-focus-stop="stopBannerFocusAdjust"
        @inline-upload="(field, files) => inlineUploadForField(field, files)"
        @remove-gallery-url="removeGalleryUrl"
        @auto-translate="autoTranslate"
      />

      <EntityManagerConfirmDialog
        :visible="actionConfirmDialog.visible"
        :dialog="actionConfirmDialog"
        :confirm-button-class="actionConfirmButtonClass"
        @cancel="cancelActionConfirmDialog"
        @accept="acceptActionConfirmDialog"
      />
    </template>
  </section>
</template>

<style scoped>
@import '@/views/admin/shared/components/AdminCoreManager.css';

.inline-user-detail-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 24px;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.38);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.inline-user-detail-modal__dialog {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 24px;
  border: 1px solid rgba(180, 151, 103, 0.18);
  border-radius: 28px;
  background: linear-gradient(180deg, #fdfaf4 0%, #fff 100%);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.18);
}

.inline-user-detail__header,
.inline-user-card__head,
.inline-user-card__section-head,
.inline-user-history__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.inline-user-detail__eyebrow {
  margin: 0 0 8px;
  color: #b78134;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.inline-user-detail__header h3,
.inline-user-card__title h4,
.inline-user-card__section-head h5 {
  margin: 0;
  color: #111827;
}

.inline-user-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.inline-user-detail__button {
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.inline-user-detail__button--primary {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #203a66, #385487);
}

.inline-user-detail__button--ghost {
  border: 1px solid rgba(17, 24, 39, 0.12);
  color: #243041;
  background: rgba(255, 255, 255, 0.82);
}

.inline-user-detail__state {
  margin-top: 18px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  color: #374151;
}

.inline-user-detail__state--error {
  color: #b91c1c;
}

.inline-user-detail__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 24px;
  margin-top: 20px;
}

.inline-user-card,
.inline-user-history {
  padding: 22px;
  border: 1px solid rgba(180, 151, 103, 0.14);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
}

.inline-user-card__avatar {
  width: 78px;
  height: 78px;
  overflow: hidden;
  border-radius: 22px;
  border: 4px solid #fff;
  background: linear-gradient(135deg, #f2e8d5, #f8f2e5);
  box-shadow: 0 12px 30px rgba(111, 86, 48, 0.12);
}

.inline-user-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inline-user-card__title p {
  margin: 0 0 6px;
  color: #b78134;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.inline-user-card__title span {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  word-break: break-word;
}

.inline-user-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.inline-user-card__detail-item {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid #ece5d8;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf9 0%, #fbf7ef 100%);
}

.inline-user-card__detail-item span {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.inline-user-card__detail-item strong {
  color: #111827;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.inline-user-history__count {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(214, 193, 154, 0.22);
  color: #8c672b;
  font-size: 12px;
  font-weight: 800;
}

.inline-user-history__list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.inline-user-history__item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 12px;
}

.inline-user-history__dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 999px;
  background: #9a7232;
  box-shadow: 0 0 0 5px rgba(214, 193, 154, 0.22);
}

.inline-user-history__body {
  padding: 16px;
  border: 1px solid #ece5d8;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf9 0%, #fbf7ef 100%);
}

.inline-user-history__row {
  align-items: flex-start;
  margin-bottom: 10px;
}

.inline-user-history__row strong {
  color: #111827;
}

.inline-user-history__row span {
  color: #8c672b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.inline-user-history__body p {
  margin: 6px 0 0;
  color: #4b5563;
  line-height: 1.6;
  word-break: break-word;
}

.inline-user-history__empty {
  min-height: 200px;
  display: grid;
  place-items: center;
  margin-top: 18px;
  border: 1px dashed #e7dcc8;
  border-radius: 20px;
  background: rgba(251, 247, 239, 0.72);
  color: #6b7280;
  text-align: center;
}

.is-success {
  color: #15803d !important;
}

.is-danger {
  color: #b91c1c !important;
}

@media (max-width: 1080px) {
  .inline-user-detail__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .inline-user-detail-modal {
    padding: 16px;
  }

  .inline-user-detail-modal__dialog {
    padding: 18px;
    border-radius: 22px;
  }

  .inline-user-detail__header,
  .inline-user-card__head,
  .inline-user-card__section-head,
  .inline-user-history__row {
    flex-direction: column;
    align-items: flex-start;
  }

  .inline-user-card__details {
    grid-template-columns: 1fr;
  }
}
</style>
