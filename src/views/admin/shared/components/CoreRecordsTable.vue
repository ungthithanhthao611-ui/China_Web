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
  recordDisplayName: {
    type: Function,
    default: (r) => r?.title || r?.block_key || r?.item_key || String(r?.id || ""),
  },
  editLabel: {
    type: String,
    default: "Sửa",
  },
});

const emit = defineEmits(["edit", "delete", "set-page", "update:pageSize"]);

const richPreviewCard = (record) => props.previewCard(record) || null;
const richPreviewMedia = (record) => props.previewMedia(record) || null;

const getThumbnailFallback = (record, column) => {
  if (column !== 'image_url') return null;
  if (record.image_url) return props.resolveMediaUrl(record.image_url);
  
  if (Array.isArray(record.images) && record.images.length > 0) {
    if (record.images[0].url) return props.resolveMediaUrl(record.images[0].url);
  }
  
  if (record.gallery_urls) {
    if (Array.isArray(record.gallery_urls)) {
      const url = record.gallery_urls[0]?.url || record.gallery_urls[0];
      if (url) return props.resolveMediaUrl(url);
    }
    if (typeof record.gallery_urls === 'string') {
      const url = record.gallery_urls.split('\n')[0].trim();
      if (url) return props.resolveMediaUrl(url);
    }
  }
  return null;
};
</script>

<template>
  <div class="records-panel">
    <div class="records-panel__header">
      <div>
        <p class="eyebrow">Tổng quan dữ liệu</p>
        <h3>Danh sách nội dung</h3>
        <p class="description">
          Xem lại, xem trước và quản lý mọi bản ghi từ giao diện chuyên nghiệp.
        </p>
      </div>
      <div class="records-panel__summary">
        <div class="records-summary-card">
          <span>Tổng số</span>
          <strong>{{ totalRecords }}</strong>
        </div>
        <div class="records-summary-card">
          <span>Trang</span>
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
            <th>Xem nhanh</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading" class="table-empty-row">
            <td :colspan="tableColumns.length + 2">Đang tải dữ liệu...</td>
          </tr>
          <tr v-else-if="!records.length" class="table-empty-row">
            <td :colspan="tableColumns.length + 2">Không tìm thấy bản ghi nào.</td>
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
              <template v-else-if="column === 'image_id' || column === 'hero_image_id' || column === 'media_id' || column === 'image_url'">
                <div class="banner-media-cell">
                  <template v-if="column === 'image_url' ? getThumbnailFallback(record, column) : bannerMediaUrl({ ...record, image_id: record[column] })">
                    <video
                      v-if="isDirectVideoFile(column === 'image_url' ? getThumbnailFallback(record, column) : bannerMediaUrl({ ...record, image_id: record[column] }))"
                      :src="column === 'image_url' ? getThumbnailFallback(record, column) : bannerMediaUrl({ ...record, image_id: record[column] })"
                      muted
                      playsinline
                      preload="metadata"
                    ></video>
                    <img
                      v-else
                      :src="column === 'image_url' ? getThumbnailFallback(record, column) : bannerMediaUrl({ ...record, image_id: record[column] })"
                      :alt="column === 'image_url' ? record.name || 'Product image' : bannerMediaAlt({ ...record, image_id: record[column] })"
                      :style="isBannerEntity ? bannerImageStyle(record) : {}"
                      loading="lazy"
                    />
                  </template>
                  <div v-else class="video-table-thumb-cell__empty">Chưa có ảnh</div>
                  <small>{{ column === 'image_url' ? 'URL' : `#${record[column] || '-'}` }}</small>
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
                  <div v-else class="video-table-thumb-cell__empty">Trống</div>
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
              <template v-else-if="column === 'title' || column === 'block_key' || column === 'item_key'">
                <strong>{{ recordDisplayName(record) }}</strong>
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
                    <div v-else class="banner-preview-card__empty">Chưa có ảnh/video banner</div>
                    <div class="banner-preview-card__overlay"></div>
                  </div>
                  <div class="banner-preview-card__content">
                    <div class="banner-preview-card__meta">
                      <span>{{ bannerTypeLabel(record.banner_type) }}</span>
                      <strong>{{ bannerOrdinal(record.sort_order || record.id) }}</strong>
                    </div>
                    <h4>{{ bannerDisplayTitle(record) }}</h4>
                    <p v-if="record.subtitle">{{ record.subtitle }}</p>
                    <small>{{ record.button_text || record.link || "Chưa cấu hình nút bấm" }}</small>
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
                    Xem ảnh
                  </a>
                </div>
                <a
                  v-else-if="record.url"
                  :href="resolveMediaUrl(record.url)"
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở tệp
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
                    Xem link video
                  </a>
                  <a
                    v-if="previewRecordUrl(record)"
                    :href="previewRecordUrl(record)"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem trang công khai
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
                      Mở link video ngoài
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
                  Mở xem
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
                  {{ editLabel }}
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  :disabled="deletingId === record.id"
                  @click="emit('delete', record)"
                >
                  {{ deletingId === record.id ? "Đang xóa..." : "Xóa" }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <div class="pagination__meta">
        <span>{{ totalRecords }} bản ghi</span>
        <span class="pagination__divider"></span>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
      </div>

      <div class="pagination__actions">
        <select
          :value="pageSize"
          aria-label="Số bản ghi mỗi trang"
          @change="emit('update:pageSize', Number($event.target.value))"
        >
          <option :value="10">10 / trang</option>
          <option :value="20">20 / trang</option>
          <option :value="50">50 / trang</option>
        </select>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="currentPage <= 1"
          @click="emit('set-page', currentPage - 1)"
        >
          Trang trước
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="currentPage >= totalPages"
          @click="emit('set-page', currentPage + 1)"
        >
          Trang tiếp
        </button>
      </div>
    </div>
  </div>
</template>


<style scoped>
@import '@/views/admin/shared/components/CoreRecordsTable.css';
</style>

