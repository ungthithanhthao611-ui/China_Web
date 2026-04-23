<script setup>
import { computed } from 'vue'

import { useEntityManager } from '@/views/admin/shared/composables/useEntityManager.js'
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
  records, mediaOptions, relationOptions, searchKeyword, statusFilter,
  currentPage, pageSize, totalRecords, loading, saving, deletingId,
  formOpen, formMode, editingRecordId, inlineEditorRef, form, formErrors,
  uploadFile, uploadTitle, uploadAltText, uploadTargetField, uploading,
  videoUploadFile, videoUploading, bannerFocusDragging, actionConfirmDialog,
  productInlineUploading, galleryUploadProgress,
  config, resolvedEntityKey, hasValidEntityConfig, previewRecordUrl, tableColumns, visibleFormFields, statusOptions,
  totalPages, hasStatusFilter, hasMediaFields, mediaFieldOptions, canCreate,
  standaloneUpload, isMediaAssetsEntity, isVideosEntity, isBannerEntity,
  isProductsEntity, isFormModalEntity, showInlineEditor, inlineEditorPlacement,
  slugSourceField, actionConfirmButtonClass, featuredTableFields,
  previewMediaOptions, videoLibraryOptions,
  resolveMediaUrl, isDirectVideoFile, isAllowedVideoUrl, isVideoMediaRecord,
  isImageMedia, videoUrlHint, mediaAssetPreviewUrl, mediaAssetLabel,
  rowThumbnailUrl, videoPreviewUrl, hasRichPreview, previewCard, previewMedia,
  previewStatusText, previewStatusTone, selectedMediaPreviewUrl,
  selectedMediaAsset, selectedMediaLabel,
  fieldLabel, fieldPlaceholder, fieldHelpText, isTextarea, isBooleanField,
  inputType, isSelectField, selectOptions, formatCell, recordDisplayName,
  relationSelectValue, selectedRelationSummary, relationPreviewPath,
  relationPreviewLabel, updateRelationField, handleSlugInput,
  handleSlugSourceInput, mediaUploadAccept,
  bannerMediaRecord, bannerFormMediaRecord, bannerMediaUrl, bannerMediaAlt,
  bannerTypeLabel, bannerOrdinal, bannerDisplayTitle, bannerImageStyle,
  bannerFormImageStyle, canAdjustBannerFocus, bannerFocusIndicatorStyle,
  startBannerFocusAdjust, onBannerFocusAdjust, stopBannerFocusAdjust,
  resetBannerFocus,
  openCreateForm, openEditForm, handleFieldUpdate, closeForm, submitForm,
  deleteRecord, handleFileChange, handleVideoFileChange, uploadMedia,
  uploadVideoFile, inlineUploadForField, removeGalleryUrl,
  refreshAll, loadRecords, setPage,
  cancelActionConfirmDialog, acceptActionConfirmDialog,
  currentFormPreviewUrl, FIELD_GROUPS,
} = useEntityManager(props, emit)

const safeEditLabel = computed(() => config?.value?.editLabel || 'Sửa')
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
          :edit-label="safeEditLabel"
          :record-display-name="recordDisplayName"
          @edit="openEditForm"
          @delete="deleteRecord"
          @set-page="setPage"
          @update:page-size="pageSize = $event"
        />
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
        @video-library-select="
          form.video_url = $event;
        "
        @reset-banner-focus="resetBannerFocus"
        @banner-focus-start="startBannerFocusAdjust"
        @banner-focus-move="onBannerFocusAdjust"
        @banner-focus-stop="stopBannerFocusAdjust"
        @inline-upload="(field, files) => inlineUploadForField(field, files)"
        @remove-gallery-url="removeGalleryUrl"
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
</style>

