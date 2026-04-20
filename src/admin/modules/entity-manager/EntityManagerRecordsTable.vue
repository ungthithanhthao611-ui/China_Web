<script setup>
const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
  tableColumns: {
    type: Array,
    required: true,
  },
  fieldLabel: {
    type: Function,
    required: true,
  },
  formatCell: {
    type: Function,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  featuredTableFields: {
    type: Array,
    required: true,
  },
  isMediaAssetsEntity: {
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
  isImageMediaRecord: {
    type: Function,
    required: true,
  },
  isVideoMediaRecord: {
    type: Function,
    required: true,
  },
  mediaAssetPreviewUrl: {
    type: Function,
    required: true,
  },
  mediaAssetLabel: {
    type: Function,
    required: true,
  },
  resolveMediaUrl: {
    type: Function,
    required: true,
  },
  rowThumbnailUrl: {
    type: Function,
    required: true,
  },
  videoPreviewUrl: {
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
  previewRecordUrl: {
    type: Function,
    required: true,
  },
  hasRichPreview: {
    type: Function,
    required: true,
  },
  previewCard: {
    type: Function,
    required: true,
  },
  previewMedia: {
    type: Function,
    required: true,
  },
  previewStatusText: {
    type: Function,
    required: true,
  },
  previewStatusTone: {
    type: Function,
    required: true,
  },
  bannerMediaRecord: {
    type: Function,
    required: true,
  },
  bannerMediaUrl: {
    type: Function,
    required: true,
  },
  bannerMediaAlt: {
    type: Function,
    required: true,
  },
  bannerImageStyle: {
    type: Function,
    required: true,
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
  deletingId: {
    type: [String, Number, null],
    default: null,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  totalRecords: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["edit", "delete", "set-page", "update:pageSize"]);

const richPreviewCard = (record) => props.previewCard(record) || null;
const richPreviewMedia = (record) => props.previewMedia(record) || null;
</script>

<template>
  <div class="records-panel">
    <div class="records-panel__header">
      <div>
        <p class="eyebrow">Records Overview</p>
        <h3>Content listing</h3>
        <p class="description">
          Review, preview, and manage every record from a cleaner editorial workspace.
        </p>
      </div>
      <div class="records-panel__summary">
        <div class="records-summary-card">
          <span>Total</span>
          <strong>{{ totalRecords }}</strong>
        </div>
        <div class="records-summary-card">
          <span>Page</span>
          <strong>{{ currentPage }}/{{ totalPages }}</strong>
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th v-for="column in tableColumns" :key="column">
              {{ fieldLabel(column) }}
            </th>
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
                  <div v-else class="media-title-placeholder">
                    {{ record.asset_type || "file" }}
                  </div>
                  <span>{{ mediaAssetLabel(record) }}</span>
                </div>
              </template>
              <template v-else-if="isBannerEntity && column === 'title'">
                {{ bannerDisplayTitle(record) }}
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
                  <small>#{{ record.image_id || "-" }}</small>
                </div>
              </template>
              <template v-else-if="isVideosEntity && column === 'thumbnail_id'">
                <div class="video-table-thumb-cell">
                  <img
                    v-if="rowThumbnailUrl(record)"
                    :src="rowThumbnailUrl(record)"
                    :alt="record.title || 'Video thumbnail'"
                    loading="lazy"
                  />
                  <div v-else class="video-table-thumb-cell__empty">No thumbnail</div>
                  <small>#{{ record.thumbnail_id || "-" }}</small>
                </div>
              </template>
              <template v-else-if="isVideosEntity && column === 'video_url'">
                <div class="video-link-cell">
                  <a
                    :href="videoPreviewUrl(record)"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {{ formatCell(record[column]) }}
                  </a>
                  <small v-if="videoUrlHint(record[column])">
                    {{ videoUrlHint(record[column]) }}
                  </small>
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
                    <h4>{{ bannerDisplayTitle(record) }}</h4>
                    <p v-if="record.subtitle">{{ record.subtitle }}</p>
                    <small>{{ record.button_text || record.link || "No CTA configured" }}</small>
                  </div>
                </div>
              </template>
              <template v-else-if="isMediaAssetsEntity">
                <div v-if="isImageMediaRecord(record)" class="media-preview-cell">
                  <a
                    :href="mediaAssetPreviewUrl(record)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      class="media-preview-thumb"
                      :src="mediaAssetPreviewUrl(record)"
                      :alt="record.alt_text || mediaAssetLabel(record)"
                      loading="lazy"
                    />
                  </a>
                  <a
                    :href="mediaAssetPreviewUrl(record)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </div>
                <a
                  v-else-if="record.url"
                  :href="resolveMediaUrl(record.url)"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
                <span v-else>-</span>
              </template>
              <template v-else-if="isVideosEntity">
                <div class="video-preview-cell">
                  <video
                    v-if="isDirectVideoFile(record.video_url)"
                    class="video-preview-cell__player"
                    :src="videoPreviewUrl(record)"
                    muted
                    playsinline
                    preload="metadata"
                    controls
                  ></video>
                  <a
                    v-else-if="record.video_url"
                    :href="videoPreviewUrl(record)"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Preview Link
                  </a>
                  <a
                    v-if="previewRecordUrl(record)"
                    :href="previewRecordUrl(record)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Public Page
                  </a>
                </div>
              </template>
              <template v-else-if="hasRichPreview(record)">
                <div class="entity-rich-preview">
                  <div class="entity-rich-preview__head">
                    <span class="entity-rich-preview__badge">
                      {{ richPreviewCard(record)?.badge }}
                    </span>
                    <span
                      :class="[
                        'entity-rich-preview__status',
                        previewStatusTone(record),
                      ]"
                    >
                      {{ previewStatusText(record) }}
                    </span>
                  </div>
                  <div
                    v-if="richPreviewMedia(record)"
                    class="entity-rich-preview__media"
                    :class="`entity-rich-preview__media--${richPreviewMedia(record).kind}`"
                  >
                    <img
                      v-if="richPreviewMedia(record).kind === 'image'"
                      :src="richPreviewMedia(record).url"
                      :alt="richPreviewMedia(record).label"
                      loading="lazy"
                    />
                    <video
                      v-else-if="richPreviewMedia(record).kind === 'video'"
                      :src="richPreviewMedia(record).url"
                      muted
                      controls
                      playsinline
                      preload="metadata"
                    ></video>
                    <a
                      v-else
                      class="entity-rich-preview__media-link"
                      :href="richPreviewMedia(record).url"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Open external video source
                    </a>
                    <small class="entity-rich-preview__media-label">
                      {{ richPreviewMedia(record).label }}
                    </small>
                  </div>
                  <strong class="entity-rich-preview__title">
                    {{ richPreviewCard(record)?.title }}
                  </strong>
                  <p class="entity-rich-preview__summary">
                    {{ richPreviewCard(record)?.summary }}
                  </p>
                  <div
                    v-if="richPreviewCard(record)?.meta?.length"
                    class="entity-rich-preview__meta"
                  >
                    <span v-for="meta in richPreviewCard(record).meta" :key="meta">
                      {{ meta }}
                    </span>
                  </div>
                  <a
                    v-if="richPreviewCard(record)?.href"
                    class="entity-rich-preview__link"
                    :href="richPreviewCard(record).href"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ richPreviewCard(record).linkLabel }}
                  </a>
                </div>
              </template>
              <template v-else>
                <a
                  v-if="previewRecordUrl(record)"
                  :href="previewRecordUrl(record)"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
                <span v-else>-</span>
              </template>
            </td>
            <td data-label="Actions">
              <div class="row-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="emit('edit', record)"
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  :disabled="deletingId === record.id"
                  @click="emit('delete', record)"
                >
                  {{ deletingId === record.id ? "Deleting..." : "Delete" }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <div class="pagination__meta">
        <span>{{ totalRecords }} records</span>
        <span class="pagination__divider"></span>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
      </div>

      <div class="pagination__actions">
        <select
          :value="pageSize"
          aria-label="Page size"
          @change="emit('update:pageSize', Number($event.target.value))"
        >
          <option :value="10">10 / page</option>
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
        </select>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="currentPage <= 1"
          @click="emit('set-page', currentPage - 1)"
        >
          Prev
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="currentPage >= totalPages"
          @click="emit('set-page', currentPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.eyebrow {
  margin: 0;
  color: #6c839c;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 800;
}

h3 {
  margin: 8px 0 0;
  color: #15314d;
  font-size: 22px;
}

.description {
  margin: 8px 0 0;
  color: #5d7690;
  font-size: 14px;
  line-height: 1.65;
}

.records-panel__summary,
.row-actions,
.pagination,
.pagination__actions,
.pagination__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
  overflow-y: hidden;
  padding: 0 14px 14px;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0 12px;
  table-layout: auto;
}

th,
td {
  border: 0;
  padding: 16px 14px;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

th {
  padding-top: 14px;
  padding-bottom: 6px;
  color: #698199;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  white-space: nowrap;
}

tbody tr {
  background: rgba(255, 255, 255, 0.92);
}

.entity-row td {
  border-top: 1px solid rgba(220, 230, 242, 0.94);
  border-bottom: 1px solid rgba(220, 230, 242, 0.94);
  background: rgba(255, 255, 255, 0.92);
}

.entity-row td:first-child {
  border-top-left-radius: 22px;
  border-bottom-left-radius: 22px;
  border-left: 1px solid rgba(220, 230, 242, 0.94);
}

.entity-row td:last-child {
  border-top-right-radius: 22px;
  border-bottom-right-radius: 22px;
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
.entity-rich-preview {
  display: grid;
  gap: 8px;
}

.media-title-cell {
  grid-template-columns: 72px minmax(120px, 1fr);
  align-items: center;
}

.media-title-thumb,
.media-preview-thumb,
.banner-media-cell img,
.banner-media-cell video,
.video-table-thumb-cell img {
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

.video-link-cell a,
.media-title-cell span {
  overflow-wrap: anywhere;
}

.video-link-cell small,
.video-table-thumb-cell small,
.banner-media-cell small,
.entity-rich-preview__media-label {
  color: #607893;
  font-size: 11px;
}

.media-preview-thumb {
  width: 96px;
  height: 72px;
}

.video-preview-cell {
  min-width: 180px;
}

.video-preview-cell__player {
  width: min(220px, 100%);
  border-radius: 14px;
  overflow: hidden;
  background: #09131f;
  border: 1px solid rgba(216, 227, 240, 0.96);
  box-shadow: 0 10px 24px rgba(20, 39, 58, 0.08);
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

.banner-preview-card {
  position: relative;
  min-width: 220px;
  min-height: 146px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(212, 224, 239, 0.95);
  background: linear-gradient(135deg, #071122, #11294a);
  box-shadow: 0 18px 34px rgba(11, 27, 44, 0.14);
}

.banner-preview-card__media,
.banner-preview-card__media img,
.banner-preview-card__media video,
.banner-preview-card__overlay {
  position: absolute;
  inset: 0;
}

.banner-preview-card__media img,
.banner-preview-card__media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-preview-card__overlay {
  background:
    linear-gradient(180deg, rgba(2, 9, 19, 0.16) 0%, rgba(2, 10, 23, 0.18) 22%, rgba(2, 10, 23, 0.54) 100%),
    radial-gradient(circle at 72% 22%, rgba(38, 115, 208, 0.26) 0%, rgba(38, 115, 208, 0) 38%);
  pointer-events: none;
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

.btn {
  border-radius: 16px;
  border: 1px solid transparent;
  min-height: 42px;
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

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
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

.pagination__actions select {
  min-height: 42px;
  border: 1px solid rgba(198, 216, 233, 0.95);
  border-radius: 14px;
  padding: 0 12px;
  color: #17324d;
  background: rgba(255, 255, 255, 0.98);
  font: inherit;
}

.pagination__actions select:focus {
  outline: none;
  border-color: rgba(63, 140, 221, 0.74);
  box-shadow: 0 0 0 4px rgba(79, 167, 255, 0.14);
}

@media (max-width: 1024px) {
  .records-panel__header,
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .records-panel__summary,
  .pagination__actions {
    width: 100%;
  }
}

@media (max-width: 860px) {
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

  .video-preview-cell__player,
  .entity-rich-preview,
  .banner-preview-card {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 560px) {
  .records-panel__header,
  .pagination {
    padding: 14px;
  }

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

  .row-actions,
  .row-actions > * {
    width: 100%;
  }

  .pagination__divider {
    display: none;
  }
}
</style>
