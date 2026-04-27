<script setup>
import { computed } from 'vue'

import {
  ABOUT_SECTION_LABEL_MAP,
  getAboutSectionFromBlockKey,
  resolveAboutBlockDisplayName,
  resolveAboutItemDisplayName,
} from '@/views/admin/shared/utils/entity-manager/constants.js'
import { getBlockSchema } from '@/views/admin/features/about/config/aboutBlockSchemas.js'

const props = defineProps({
  records: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  deletingId: {
    type: [Number, String, null],
    default: null,
  },
  previewMedia: {
    type: Function,
    required: true,
  },
  resolveMediaUrl: {
    type: Function,
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
  recordDisplayName: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

const sectionOrder = Object.keys(ABOUT_SECTION_LABEL_MAP)

const normalizeText = (value) => String(value || '').trim()

const schemaFieldsForRecord = (record) => {
  const blockKey = normalizeText(record?.block_key || record?.block?.block_key).toLowerCase()
  if (!blockKey) return []

  const schema = getBlockSchema(blockKey)
  if (!schema) return []

  const itemKey = normalizeText(record?.item_key)
  const fixedEntry = (schema.fixedItems || []).find((item) => normalizeText(item?.itemKey) === itemKey)
  if (fixedEntry?.fields?.length) return fixedEntry.fields

  return schema.dynamicItems?.fields || []
}

const mediaDescriptor = (record) => {
  const media = props.previewMedia(record)
  if (!media) return null

  return {
    kind: props.isVideoMediaRecord(media) ? 'video' : props.isImageMediaRecord(media) ? 'image' : 'other',
    url: media.url ? props.resolveMediaUrl(media.url) : '',
    label: media.title || media.file_name || media.url || '',
  }
}

const contentHealth = (record) => {
  const title = normalizeText(record?.title)
  const subtitle = normalizeText(record?.subtitle)
  const content = normalizeText(record?.content)
  const link = normalizeText(record?.link)
  const media = mediaDescriptor(record)
  const schemaFields = schemaFieldsForRecord(record)
  const requiredNonImageFields = schemaFields.filter((field) => field?.required && field?.key !== 'image_id')
  const requiresImage = schemaFields.some((field) => field?.type === 'image' && field?.required)

  const hasMainContent = requiredNonImageFields.length
    ? requiredNonImageFields.every((field) => normalizeText(record?.[field.key]))
    : Boolean(title || subtitle || content)
  const hasImage = Boolean(media?.kind === 'image' || media?.kind === 'video')
  const hasLink = Boolean(link)

  const missing = []
  if (!hasMainContent) missing.push('Thiếu nội dung')
  if (requiresImage && !hasImage) missing.push('Thiếu ảnh')
  if (!hasLink) missing.push('Chưa có link')

  return {
    hasMainContent,
    hasImage,
    hasLink,
    isComplete: hasMainContent && (!requiresImage || hasImage),
    summary: missing.length ? missing.join(' • ') : 'Đã có dữ liệu chính',
    tone: missing.length ? 'warning' : 'success',
  }
}

const groupedSections = computed(() => {
  const buckets = new Map()

  sectionOrder.forEach((sectionKey) => {
    buckets.set(sectionKey, {
      key: sectionKey,
      label: ABOUT_SECTION_LABEL_MAP[sectionKey],
      blocks: [],
    })
  })

  const orphanSection = {
    key: 'unmapped',
    label: 'Khối chưa map section',
    blocks: [],
  }

  const blockMap = new Map()

  props.records.forEach((record) => {
    const blockKey = normalizeText(record?.block_key || record?.block?.block_key).toLowerCase()
    const sectionKey = getAboutSectionFromBlockKey(blockKey)
    const sectionBucket = buckets.get(sectionKey) || orphanSection
    const blockIdentity = `${sectionBucket.key}::${blockKey || record?.block_id || record?.id}`

    if (!blockMap.has(blockIdentity)) {
      const blockEntry = {
        key: blockIdentity,
        blockKey,
        blockLabel: resolveAboutBlockDisplayName(blockKey, normalizeText(record?.block?.title || record?.title || record?.block_id)),
        records: [],
      }
      blockMap.set(blockIdentity, blockEntry)
      sectionBucket.blocks.push(blockEntry)
    }

    blockMap.get(blockIdentity).records.push(record)
  })

  const sections = [...buckets.values(), orphanSection]
    .map((section) => ({
      ...section,
      blocks: section.blocks
        .map((block) => ({
          ...block,
          records: [...block.records].sort(
            (left, right) => Number(left?.sort_order || 0) - Number(right?.sort_order || 0),
          ),
        }))
        .sort((left, right) => left.blockLabel.localeCompare(right.blockLabel, 'vi')),
    }))
    .filter((section) => section.blocks.length)

  return sections
})
</script>

<template>
  <section class="about-grouped-view">
    <header class="about-grouped-view__header">
      <div>
        <p class="eyebrow">Quản lý theo section</p>
        <h3>Toàn bộ nội dung trang Giới thiệu</h3>
        <p class="description">
          Gom nhóm item theo page và block để dễ rà soát nội dung thiếu, hình ảnh và thứ tự hiển thị.
        </p>
      </div>
      <div class="about-grouped-view__summary">
        <span>{{ records.length }} mục</span>
        <span>{{ groupedSections.length }} section</span>
      </div>
    </header>

    <div v-if="loading" class="about-grouped-view__empty">
      Đang tải dữ liệu trang Giới thiệu...
    </div>

    <div v-else-if="!groupedSections.length" class="about-grouped-view__empty">
      Chưa có bản ghi phù hợp với bộ lọc hiện tại.
    </div>

    <div v-else class="about-grouped-view__sections">
      <article
        v-for="section in groupedSections"
        :key="section.key"
        class="about-section-card"
      >
        <div class="about-section-card__head">
          <div>
            <p class="eyebrow">{{ section.key }}</p>
            <h4>{{ section.label }}</h4>
          </div>
          <span class="about-section-card__count">{{ section.blocks.length }} block</span>
        </div>

        <div class="about-section-card__blocks">
          <section
            v-for="block in section.blocks"
            :key="block.key"
            class="about-block-card"
          >
            <div class="about-block-card__head">
              <div>
                <strong>{{ block.blockLabel }}</strong>
                <small v-if="block.blockKey">block_key: {{ block.blockKey }}</small>
              </div>
              <span>{{ block.records.length }} item</span>
            </div>

            <div class="about-block-card__items">
              <article
                v-for="record in block.records"
                :key="record.id"
                class="about-item-row"
              >
                <div class="about-item-row__media">
                  <template v-if="mediaDescriptor(record)?.url && mediaDescriptor(record)?.kind === 'image'">
                    <img
                      :src="mediaDescriptor(record)?.url"
                      :alt="mediaDescriptor(record)?.label || recordDisplayName(record)"
                      loading="lazy"
                    />
                  </template>
                  <template v-else-if="mediaDescriptor(record)?.url && mediaDescriptor(record)?.kind === 'video'">
                    <video :src="mediaDescriptor(record)?.url" muted playsinline preload="metadata"></video>
                  </template>
                  <div v-else class="about-item-row__media-empty">No media</div>
                </div>

                <div class="about-item-row__content">
                  <div class="about-item-row__title-row">
                    <strong>{{ recordDisplayName(record) }}</strong>
                    <span
                      class="about-item-row__status"
                      :class="`is-${contentHealth(record).tone}`"
                    >
                      {{ contentHealth(record).summary }}
                    </span>
                  </div>

                  <div class="about-item-row__meta">
                    <span>#{{ record.id }}</span>
                    <span v-if="record.item_key">item_key: {{ record.item_key }}</span>
                    <span>sort: {{ record.sort_order ?? 0 }}</span>
                  </div>

                  <p v-if="record.subtitle" class="about-item-row__subtitle">{{ record.subtitle }}</p>
                  <p v-if="record.content" class="about-item-row__excerpt">{{ record.content }}</p>
                  <a
                    v-if="record.link"
                    :href="record.link"
                    target="_blank"
                    rel="noreferrer noopener"
                    class="about-item-row__link"
                  >
                    {{ record.link }}
                  </a>
                </div>

                <div class="about-item-row__actions">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    @click="emit('edit', record)"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger"
                    :disabled="String(deletingId) === String(record.id)"
                    @click="emit('delete', record)"
                  >
                    {{ String(deletingId) === String(record.id) ? 'Đang xóa...' : 'Xóa' }}
                  </button>
                </div>
              </article>
            </div>
          </section>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.about-grouped-view {
  display: grid;
  gap: 16px;
  padding: 14px;
}

.about-grouped-view__header,
.about-section-card,
.about-block-card,
.about-item-row {
  border: 1px solid rgba(216, 227, 240, 0.96);
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  box-shadow: 0 18px 30px rgba(18, 39, 64, 0.07);
}

.about-grouped-view__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 18px;
  background: linear-gradient(180deg, rgba(251, 253, 255, 0.98), rgba(244, 249, 255, 0.94));
}

.about-grouped-view__summary,
.about-item-row__meta,
.about-item-row__actions,
.about-section-card__head,
.about-block-card__head,
.about-item-row__title-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.about-grouped-view__summary span,
.about-section-card__count,
.about-block-card__head span,
.about-item-row__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: #edf4fb;
  color: #46627f;
  font-size: 11px;
  font-weight: 700;
}

.about-grouped-view__sections,
.about-section-card__blocks,
.about-block-card__items {
  display: grid;
  gap: 14px;
}

.about-section-card {
  padding: 16px;
}

.about-section-card__head {
  justify-content: space-between;
  margin-bottom: 14px;
}

.about-section-card__head h4,
.about-block-card__head strong {
  margin: 4px 0 0;
  color: #15314d;
}

.about-block-card {
  padding: 14px;
  background: linear-gradient(180deg, rgba(252, 254, 255, 0.98), rgba(246, 250, 255, 0.95));
}

.about-block-card__head {
  justify-content: space-between;
  margin-bottom: 12px;
}

.about-block-card__head small,
.about-item-row__subtitle,
.about-item-row__excerpt,
.about-item-row__link {
  color: #5d7690;
}

.about-item-row {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  gap: 14px;
  padding: 14px;
}

.about-item-row__media {
  width: 92px;
  min-height: 78px;
}

.about-item-row__media img,
.about-item-row__media video,
.about-item-row__media-empty {
  width: 100%;
  height: 78px;
  border-radius: 14px;
  object-fit: cover;
  border: 1px solid rgba(216, 227, 240, 0.96);
  background: #edf3fa;
}

.about-item-row__media-empty {
  display: grid;
  place-items: center;
  color: #607893;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.about-item-row__content {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.about-item-row__title-row strong {
  color: #16314d;
  font-size: 14px;
}

.about-item-row__status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.about-item-row__status.is-success {
  color: #25704f;
  background: rgba(58, 181, 116, 0.12);
}

.about-item-row__status.is-warning {
  color: #8a5a12;
  background: rgba(246, 192, 73, 0.18);
}

.about-item-row__subtitle,
.about-item-row__excerpt {
  margin: 0;
  line-height: 1.5;
}

.about-item-row__excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.about-item-row__link {
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.about-item-row__actions {
  align-self: center;
  justify-content: flex-end;
}

.about-grouped-view__empty {
  padding: 24px;
  text-align: center;
  border: 1px dashed rgba(194, 212, 230, 0.9);
  border-radius: 18px;
  color: #647b95;
  background: rgba(248, 251, 255, 0.96);
}

.btn {
  border-radius: 14px;
  border: 1px solid transparent;
  min-height: 40px;
  padding: 0 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.btn-secondary {
  color: #284767;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 252, 0.96));
  border-color: rgba(198, 216, 233, 0.95);
}

.btn-danger {
  color: #fff;
  background: linear-gradient(135deg, #d84762 0%, #ef7288 100%);
}

@media (max-width: 960px) {
  .about-item-row {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .about-item-row__actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .about-grouped-view__header,
  .about-item-row {
    grid-template-columns: 1fr;
  }

  .about-grouped-view__header {
    display: grid;
  }

  .about-item-row__media {
    width: 100%;
  }
}
</style>
