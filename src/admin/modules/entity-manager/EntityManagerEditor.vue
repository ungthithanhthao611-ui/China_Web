<script setup>
const props = defineProps({
  formOpen: {
    type: Boolean,
    required: true,
  },
  inlineEditorRef: {
    type: Object,
    default: null,
  },
  isFormModalEntity: {
    type: Boolean,
    required: true,
  },
  showInlineEditor: {
    type: Boolean,
    required: true,
  },
  inlineEditorPlacement: {
    type: String,
    required: true,
  },
  formMode: {
    type: String,
    required: true,
  },
  config: {
    type: Object,
    required: true,
  },
  formErrors: {
    type: Array,
    required: true,
  },
  hasMediaFields: {
    type: Boolean,
    required: true,
  },
  isVideosEntity: {
    type: Boolean,
    required: true,
  },
  isBannerEntity: {
    type: Boolean,
    required: true,
  },
  uploadTargetField: {
    type: String,
    required: true,
  },
  mediaFieldOptions: {
    type: Array,
    required: true,
  },
  fieldLabel: {
    type: Function,
    required: true,
  },
  mediaUploadAccept: {
    type: Function,
    required: true,
  },
  uploadTitle: {
    type: String,
    required: true,
  },
  uploadAltText: {
    type: String,
    required: true,
  },
  uploading: {
    type: Boolean,
    required: true,
  },
  visibleFormFields: {
    type: Array,
    required: true,
  },
  isTextarea: {
    type: Function,
    required: true,
  },
  form: {
    type: Object,
    required: true,
  },
  isBooleanField: {
    type: Function,
    required: true,
  },
  fieldHelpText: {
    type: Function,
    required: true,
  },
  mediaOptions: {
    type: Array,
    required: true,
  },
  selectedMediaPreviewUrl: {
    type: Function,
    required: true,
  },
  selectedMediaAsset: {
    type: Function,
    required: true,
  },
  selectedMediaLabel: {
    type: Function,
    required: true,
  },
  isVideoMediaRecord: {
    type: Function,
    required: true,
  },
  relationOptions: {
    type: Object,
    required: true,
  },
  relationSelectValue: {
    type: Function,
    required: true,
  },
  isSelectField: {
    type: Function,
    required: true,
  },
  selectOptions: {
    type: Function,
    required: true,
  },
  fieldPlaceholder: {
    type: Function,
    required: true,
  },
  inputType: {
    type: Function,
    required: true,
  },
  videoUploading: {
    type: Boolean,
    required: true,
  },
  videoUploadFile: {
    type: Object,
    default: null,
  },
  videoLibraryOptions: {
    type: Array,
    required: true,
  },
  isAllowedVideoUrl: {
    type: Function,
    required: true,
  },
  videoUrlHint: {
    type: Function,
    required: true,
  },
  isDirectVideoFile: {
    type: Function,
    required: true,
  },
  resolveMediaUrl: {
    type: Function,
    required: true,
  },
  selectedRelationSummary: {
    type: Function,
    required: true,
  },
  relationPreviewPath: {
    type: Function,
    required: true,
  },
  relationPreviewLabel: {
    type: Function,
    required: true,
  },
  editingRecordId: {
    type: [String, Number, null],
    default: null,
  },
  bannerDisplayTitle: {
    type: Function,
    required: true,
  },
  bannerTypeLabel: {
    type: Function,
    required: true,
  },
  bannerOrdinal: {
    type: Function,
    required: true,
  },
  canAdjustBannerFocus: {
    type: Function,
    required: true,
  },
  bannerFocusDragging: {
    type: Boolean,
    required: true,
  },
  bannerMediaUrl: {
    type: Function,
    required: true,
  },
  bannerFormMediaRecord: {
    type: Function,
    required: true,
  },
  bannerMediaAlt: {
    type: Function,
    required: true,
  },
  bannerFormImageStyle: {
    type: Function,
    required: true,
  },
  bannerFocusIndicatorStyle: {
    type: Function,
    required: true,
  },
  previewMediaOptions: {
    type: Array,
    required: true,
  },
  isImageMedia: {
    type: Function,
    required: true,
  },
  currentFormPreviewUrl: {
    type: Function,
    required: true,
  },
  saving: {
    type: Boolean,
    required: true,
  },
  fieldGroups: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits([
  "close",
  "submit",
  "file-change",
  "video-file-change",
  "upload-media",
  "upload-video",
  "update:uploadTargetField",
  "update:uploadTitle",
  "update:uploadAltText",
  "update:field",
  "update:relation-field",
  "slug-input",
  "slug-source-input",
  "video-library-select",
  "reset-banner-focus",
  "banner-focus-start",
  "banner-focus-move",
  "banner-focus-stop",
]);
</script>

<template>
  <div
    v-if="formOpen"
    ref="inlineEditorRef"
    :class="[
      'editor-shell',
      {
        'editor-shell--modal': isFormModalEntity,
        'editor-shell--inline-top':
          showInlineEditor && inlineEditorPlacement === 'top',
      },
    ]"
    @click.self="isFormModalEntity && emit('close')"
  >
    <aside :class="['editor-panel', { 'editor-panel--modal': isFormModalEntity }]">
      <div class="editor-head">
        <div class="editor-head__content">
          <div class="editor-head__badge-wrap">
            <p class="eyebrow">{{ formMode === "create" ? "Create" : "Edit" }}</p>
            <span class="editor-head__badge">{{ config.label }}</span>
          </div>
          <h3>{{ formMode === "create" ? `Create ${config.label}` : `Edit ${config.label}` }}</h3>
          <p class="editor-head__copy">
            Update content details, metadata, preview assets, and publishing inputs from one focused workspace.
          </p>
        </div>
        <button
          type="button"
          class="icon-btn"
          aria-label="Close editor"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div v-if="formErrors.length" class="form-errors">
        <p v-for="error in formErrors" :key="error">{{ error }}</p>
      </div>

      <div v-if="hasMediaFields" class="upload-box">
        <div class="upload-box__head">
          <div>
            <p class="eyebrow">Direct upload</p>
            <strong>{{ isVideosEntity ? "Thumbnail uploader" : "Media uploader" }}</strong>
            <p class="upload-box__copy">
              {{
                isVideosEntity
                  ? "Upload the thumbnail directly here and it will be assigned to the Thumbnail field automatically."
                  : isBannerEntity
                    ? "Upload banner media here. The uploaded file will be assigned automatically and shown in Live Preview."
                    : "Upload media and assign it to the selected form field."
              }}
            </p>
          </div>
        </div>
        <div class="upload-row">
          <label v-if="!isBannerEntity" class="editor-field editor-field--compact">
            <span>Target field</span>
            <select
              :value="uploadTargetField"
              aria-label="Upload target field"
              @change="emit('update:uploadTargetField', $event.target.value)"
            >
              <option v-for="field in mediaFieldOptions" :key="field" :value="field">
                {{ fieldLabel(field) }}
              </option>
            </select>
          </label>
          <label class="editor-field editor-field--compact">
            <span>Source file</span>
            <input type="file" :accept="mediaUploadAccept()" @change="emit('file-change', $event)" />
          </label>
        </div>
        <div class="upload-row">
          <label class="editor-field editor-field--compact">
            <span>Media title</span>
            <input
              :value="uploadTitle"
              type="text"
              placeholder="Media title"
              @input="emit('update:uploadTitle', $event.target.value)"
            />
          </label>
          <label class="editor-field editor-field--compact">
            <span>Alt text</span>
            <input
              :value="uploadAltText"
              type="text"
              placeholder="Alt text"
              @input="emit('update:uploadAltText', $event.target.value)"
            />
          </label>
          <div class="editor-field editor-field--compact editor-field--action">
            <span>Upload</span>
            <button
              type="button"
              class="btn btn-secondary"
              :disabled="uploading"
              @click="emit('upload-media')"
            >
              {{ uploading ? "Uploading..." : isVideosEntity ? "Upload Thumbnail" : "Upload" }}
            </button>
          </div>
        </div>
      </div>

      <form class="dynamic-form" @submit.prevent="emit('submit')">
        <label
          v-for="field in visibleFormFields"
          :key="field"
          :class="[
            'editor-field',
            {
              wide:
                isTextarea(field) ||
                (isVideosEntity && (field === 'video_url' || field === 'thumbnail_id')),
            },
          ]"
        >
          <span>{{ fieldLabel(field) }}</span>

          <input
            v-if="isBooleanField(field)"
            :checked="Boolean(form[field])"
            type="checkbox"
            @change="emit('update:field', field, $event.target.checked)"
          />

          <div v-else-if="fieldGroups.media.includes(field)" class="field-stack">
            <select
              :value="form[field] ?? null"
              @change="emit('update:field', field, $event.target.value === 'null' ? null : Number($event.target.value))"
            >
              <option :value="'null'">No media</option>
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
              <img
                v-else
                :src="selectedMediaPreviewUrl(field)"
                :alt="selectedMediaLabel(field)"
                loading="lazy"
              />
              <div>
                <strong>{{ selectedMediaLabel(field) }}</strong>
                <small>#{{ form[field] }}</small>
              </div>
            </div>
          </div>

          <select
            v-else-if="relationOptions[field]"
            :value="relationSelectValue(field)"
            @change="emit('update:relation-field', field, $event.target.value)"
          >
            <option value="">None</option>
            <option
              v-for="option in relationOptions[field]"
              :key="option.id"
              :value="String(option.id)"
            >
              #{{ option.id }} -
              {{ option.title || option.name || option.slug || option.config_key || option.code }}
            </option>
          </select>

          <select
            v-else-if="isSelectField(field)"
            :value="form[field]"
            @change="emit('update:field', field, $event.target.value)"
          >
            <option value="">None</option>
            <option
              v-for="option in selectOptions(field)"
              :key="typeof option === 'string' ? option : option.value"
              :value="typeof option === 'string' ? option : option.value"
            >
              {{ typeof option === "string" ? option : option.label }}
            </option>
          </select>

          <textarea
            v-else-if="isTextarea(field)"
            :value="form[field]"
            rows="5"
            :placeholder="fieldPlaceholder(field)"
            @input="emit('update:field', field, $event.target.value)"
          ></textarea>

          <div v-else-if="isVideosEntity && field === 'video_url'" class="field-stack">
            <div class="video-url-section">
              <div class="video-url-row">
                <input
                  :value="form[field]"
                  :type="inputType(field)"
                  placeholder="https://... or select from library"
                  @input="emit('update:field', field, $event.target.value)"
                />
                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="videoUploading"
                  @click="emit('upload-video')"
                >
                  {{ videoUploading ? "Uploading..." : "Upload" }}
                </button>
              </div>
              <div class="video-file-row">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,.mp4,.webm,.ogg,.mov,.m4v"
                  @change="emit('video-file-change', $event)"
                />
                <span class="video-file-row__name">
                  {{ videoUploadFile?.name || "Chưa chọn file video" }}
                </span>
              </div>
              <small class="field-help">
                Chọn file video từ máy tính rồi bấm Upload để tự động đưa link vào Video URL.
              </small>
              <div class="video-library-select">
                <select @change="emit('video-library-select', $event.target.value)">
                  <option value="">-- Select from Media Library --</option>
                  <option v-for="media in videoLibraryOptions" :key="media.id" :value="media.url">
                    #{{ media.id }} - {{ media.title || media.file_name }}
                  </option>
                </select>
                <small v-if="videoLibraryOptions.length">
                  Or choose from {{ videoLibraryOptions.length }} uploaded videos
                </small>
              </div>
            </div>
            <small v-if="fieldHelpText(field)" class="field-help">{{ fieldHelpText(field) }}</small>
            <div
              v-if="form.video_url"
              class="video-url-helper"
              :class="{
                'is-valid': isAllowedVideoUrl(form.video_url),
                'is-invalid': !isAllowedVideoUrl(form.video_url),
              }"
            >
              <span>
                {{ isAllowedVideoUrl(form.video_url) ? "Valid video source" : "Invalid video source" }}
              </span>
              <small>
                {{ videoUrlHint(form.video_url) || "Supported: MP4/WebM, YouTube, Vimeo" }}
              </small>
            </div>
            <video
              v-if="isDirectVideoFile(form.video_url)"
              class="video-form-preview"
              :src="resolveMediaUrl(form.video_url)"
              muted
              controls
              playsinline
              preload="metadata"
            ></video>
            <a
              v-else-if="isAllowedVideoUrl(form.video_url)"
              class="video-form-link"
              :href="resolveMediaUrl(form.video_url)"
              target="_blank"
              rel="noreferrer noopener"
            >
              Open video source
            </a>
          </div>

          <input
            v-else
            :value="form[field]"
            :type="inputType(field)"
            :placeholder="field === 'slug' ? fieldPlaceholder(field) || 'auto-generated-from-name' : fieldPlaceholder(field)"
            @input="field === 'slug'
              ? emit('slug-input')
              : emit('slug-source-input', field)"
          />

          <small
            v-if="!fieldGroups.media.includes(field) && fieldHelpText(field)"
            class="field-help"
          >
            {{ fieldHelpText(field) }}
          </small>
          <small
            v-if="relationOptions[field] && selectedRelationSummary(field)"
            class="field-help field-help--selected"
          >
            {{ selectedRelationSummary(field) }}
          </small>
          <a
            v-if="relationOptions[field] && relationPreviewPath(field)"
            class="field-help field-help--selected"
            :href="relationPreviewPath(field)"
            target="_blank"
            rel="noreferrer noopener"
          >
            {{ relationPreviewLabel(field) }}
          </a>
        </label>

        <div v-if="isBannerEntity" class="banner-form-preview">
          <p class="eyebrow">Live Preview</p>
          <div class="banner-preview-card banner-preview-card--editor">
            <div
              class="banner-preview-card__media"
              :class="{
                'banner-preview-card__media--interactive': canAdjustBannerFocus(),
                'is-dragging': bannerFocusDragging,
              }"
              @pointerdown="emit('banner-focus-start', $event)"
              @pointermove="emit('banner-focus-move', $event)"
              @pointerup="emit('banner-focus-stop', $event)"
              @pointercancel="emit('banner-focus-stop', $event)"
              @pointerleave="emit('banner-focus-stop', $event)"
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
              <div
                v-if="canAdjustBannerFocus()"
                class="banner-focus-indicator"
                :style="bannerFocusIndicatorStyle()"
              ></div>
              <div v-else class="banner-preview-card__empty">Select or upload banner media</div>
              <div class="banner-preview-card__overlay"></div>
            </div>
            <div class="banner-preview-card__content">
              <div class="banner-preview-card__meta">
                <span>{{ bannerTypeLabel(form.banner_type) }}</span>
                <strong>{{ bannerOrdinal(form.sort_order || editingRecordId || 1) }}</strong>
              </div>
              <h4>
                {{ form.title || bannerDisplayTitle({ ...form, id: editingRecordId || 1 }) }}
              </h4>
              <p v-if="form.subtitle">{{ form.subtitle }}</p>
              <small>{{ form.button_text || form.link || "CTA text or link will appear here" }}</small>
            </div>
          </div>
          <div v-if="canAdjustBannerFocus()" class="banner-focus-tools">
            <small>Click or drag directly on preview to choose the visible crop area.</small>
            <div class="banner-focus-tools__row">
              <small>
                X: {{ Math.round(form.focus_x ?? 50) }}% / Y: {{ Math.round(form.focus_y ?? 50) }}%
              </small>
              <button
                type="button"
                class="btn btn-secondary"
                @click="emit('reset-banner-focus')"
              >
                Center
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="!isBannerEntity && !isVideosEntity && previewMediaOptions.length"
          class="media-preview-list"
        >
          <article v-for="media in previewMediaOptions" :key="media.id">
            <img
              v-if="isImageMedia(media)"
              :src="resolveMediaUrl(media.url)"
              :alt="media.alt_text || media.title || ''"
            />
            <video
              v-else-if="isVideoMediaRecord(media)"
              :src="resolveMediaUrl(media.url)"
              muted
              playsinline
              preload="metadata"
            ></video>
            <span v-else>{{ media.asset_type }}</span>
            <small>#{{ media.id }} {{ media.title || media.file_name }}</small>
          </article>
        </div>

        <div v-if="currentFormPreviewUrl()" class="selected-media-preview selected-media-preview--link">
          <div>
            <strong>Public Preview</strong>
            <small>{{ currentFormPreviewUrl() }}</small>
          </div>
          <a :href="currentFormPreviewUrl()" target="_blank" rel="noreferrer noopener">
            Open current preview
          </a>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? "Saving..." : "Save Record" }}
          </button>
        </div>
      </form>
    </aside>
  </div>
</template>

<style scoped>
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
  padding: 20px;
  background: rgba(7, 18, 34, 0.56);
  backdrop-filter: blur(12px);
}

.editor-panel {
  border-radius: 28px;
  border: 1px solid rgba(180, 202, 225, 0.58);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 250, 255, 0.94));
  box-shadow: 0 32px 72px rgba(15, 37, 63, 0.16);
  padding: 22px;
}

.editor-panel--modal {
  width: min(1200px, calc(100vw - 40px));
  max-height: calc(100vh - 36px);
  overflow-y: auto;
}

.editor-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(216, 229, 243, 0.9);
}

.editor-head__content {
  display: grid;
  gap: 8px;
}

.editor-head__badge-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.editor-head__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(73, 147, 220, 0.22);
  background: rgba(73, 147, 220, 0.1);
  color: #22567d;
  font-size: 12px;
  font-weight: 700;
}

.eyebrow {
  margin: 0;
  color: #67809a;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 800;
}

.editor-head h3 {
  margin: 0;
  color: #17324d;
  font-size: clamp(24px, 3vw, 32px);
  line-height: 1.05;
}

.editor-head__copy {
  margin: 0;
  max-width: 720px;
  color: #5c7490;
  font-size: 14px;
  line-height: 1.6;
}

.icon-btn,
.btn {
  border-radius: 16px;
  border: 1px solid transparent;
  min-height: 46px;
  padding: 0 16px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.icon-btn {
  width: 46px;
  padding: 0;
  background: rgba(247, 250, 254, 0.95);
  border-color: rgba(202, 219, 236, 0.95);
  color: #35516d;
  font-size: 24px;
  line-height: 1;
}

.icon-btn:hover,
.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #1f7ae0 0%, #4fa7ff 100%);
  box-shadow: 0 16px 30px rgba(31, 122, 224, 0.24);
}

.btn-secondary {
  color: #274666;
  border-color: rgba(198, 216, 233, 0.95);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 252, 0.96));
}

.form-errors {
  margin-bottom: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(240, 184, 193, 0.95);
  background: linear-gradient(180deg, rgba(255, 243, 246, 0.98), rgba(255, 236, 240, 0.96));
  color: #9e2f43;
}

.form-errors p {
  margin: 4px 0;
}

.upload-box {
  margin-bottom: 18px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(186, 209, 232, 0.8);
  background:
    linear-gradient(135deg, rgba(245, 250, 255, 0.98), rgba(236, 245, 255, 0.96));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.upload-box__head {
  margin-bottom: 16px;
}

.upload-box__head strong {
  color: #17324d;
  font-size: 18px;
}

.upload-box__copy {
  margin: 8px 0 0;
  color: #5a7390;
  font-size: 13px;
  line-height: 1.6;
}

.upload-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.dynamic-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.editor-field {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(220, 230, 242, 0.92);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.editor-field > span {
  color: #3c5975;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.editor-field--compact {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.editor-field--action {
  align-content: end;
}

.editor-field.wide,
.media-preview-list,
.form-actions,
.banner-form-preview {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  width: 100%;
  min-height: 48px;
  border-radius: 16px;
  border: 1px solid rgba(198, 216, 233, 0.95);
  background: rgba(255, 255, 255, 0.96);
  color: #17324d;
  padding: 12px 14px;
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
  border-color: rgba(63, 140, 221, 0.72);
  box-shadow: 0 0 0 4px rgba(79, 167, 255, 0.14);
}

textarea {
  min-height: 140px;
  resize: vertical;
}

input[type="checkbox"] {
  width: 22px;
  min-height: 22px;
  accent-color: #2f89ee;
  box-shadow: none;
}

.field-stack,
.video-url-section,
.video-library-select,
.banner-focus-tools {
  display: grid;
  gap: 10px;
}

.field-help,
.selected-media-preview small,
.video-file-row__name,
.video-library-select small,
.video-url-helper small,
.banner-focus-tools small {
  color: #627b97;
  font-size: 12px;
  line-height: 1.5;
}

.field-help--selected {
  color: #1f6eb4;
  font-weight: 700;
}

.selected-media-preview {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(215, 228, 241, 0.95);
  background: linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(242, 247, 253, 0.96));
}

.selected-media-preview--link {
  grid-template-columns: minmax(0, 1fr) auto;
}

.selected-media-preview img,
.selected-media-preview video {
  width: 88px;
  height: 68px;
  object-fit: cover;
  border-radius: 14px;
  background: #edf3fb;
  border: 1px solid rgba(216, 227, 240, 0.96);
}

.video-url-row,
.video-file-row,
.banner-focus-tools__row,
.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.video-url-row > :first-child,
.video-file-row input[type="file"] {
  flex: 1;
  min-width: 220px;
}

.video-file-row__name {
  display: inline-flex;
  align-items: center;
  min-height: 46px;
  padding: 0 14px;
  border-radius: 16px;
  border: 1px solid rgba(216, 227, 240, 0.96);
  background: rgba(248, 251, 255, 0.96);
}

.video-url-helper {
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(216, 227, 240, 0.96);
  background: rgba(248, 251, 255, 0.96);
  color: #32506f;
}

.video-url-helper.is-valid {
  border-color: rgba(47, 157, 118, 0.34);
  background: rgba(233, 250, 243, 0.95);
  color: #176347;
}

.video-url-helper.is-invalid {
  border-color: rgba(194, 89, 110, 0.34);
  background: rgba(255, 240, 243, 0.95);
  color: #a03549;
}

.video-form-preview,
.video-form-link {
  width: min(360px, 100%);
}

.video-form-preview {
  border-radius: 18px;
  background: #08111e;
  box-shadow: 0 16px 32px rgba(9, 22, 39, 0.16);
}

.media-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.media-preview-list article {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid rgba(220, 230, 242, 0.92);
  background: rgba(255, 255, 255, 0.9);
}

.media-preview-list img,
.media-preview-list video {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 14px;
  background: #edf3fb;
}

.banner-form-preview {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(214, 226, 240, 0.94);
  background: linear-gradient(180deg, rgba(251, 253, 255, 0.98), rgba(244, 249, 255, 0.96));
}

.banner-preview-card {
  position: relative;
  overflow: hidden;
  min-height: 248px;
  border-radius: 24px;
  background: linear-gradient(135deg, #061221 0%, #102744 58%, #18385f 100%);
  box-shadow: 0 24px 48px rgba(10, 26, 43, 0.22);
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

.banner-preview-card__overlay {
  background:
    linear-gradient(180deg, rgba(3, 9, 18, 0.18) 0%, rgba(3, 9, 18, 0.22) 38%, rgba(3, 9, 18, 0.72) 100%),
    radial-gradient(circle at 78% 18%, rgba(82, 157, 255, 0.26) 0%, rgba(82, 157, 255, 0) 42%);
}

.banner-preview-card__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(243, 248, 255, 0.86);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.banner-preview-card__content {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 10px;
  align-content: end;
  min-height: inherit;
  padding: 20px;
  color: #fff;
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
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 234, 213, 0.96);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.banner-preview-card__meta strong {
  color: #ff5368;
  font-size: 24px;
  line-height: 1;
}

.banner-preview-card__content h4,
.banner-preview-card__content p,
.banner-preview-card__content small {
  margin: 0;
}

.banner-preview-card__content h4 {
  font-size: clamp(20px, 3vw, 28px);
  line-height: 1.12;
}

.banner-preview-card__content p {
  color: rgba(244, 248, 255, 0.88);
  font-size: 13px;
  line-height: 1.6;
}

.banner-preview-card__content small {
  color: rgba(255, 222, 188, 0.95);
  font-size: 12px;
  font-weight: 700;
}

.banner-focus-indicator {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.94);
  box-shadow:
    0 0 0 4px rgba(255, 80, 105, 0.36),
    0 8px 20px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
}

.form-actions {
  justify-content: flex-end;
  margin-top: 8px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 960px) {
  .editor-panel,
  .editor-panel--modal {
    width: 100%;
  }

  .dynamic-form,
  .upload-row {
    grid-template-columns: 1fr;
  }

  .selected-media-preview,
  .selected-media-preview--link {
    grid-template-columns: 1fr;
  }

  .selected-media-preview img,
  .selected-media-preview video {
    width: 100%;
    height: 180px;
  }
}

@media (max-width: 640px) {
  .editor-shell--modal {
    padding: 10px;
  }

  .editor-panel {
    padding: 14px;
    border-radius: 22px;
  }

  .editor-head {
    align-items: flex-start;
  }

  .editor-head h3 {
    font-size: 22px;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
