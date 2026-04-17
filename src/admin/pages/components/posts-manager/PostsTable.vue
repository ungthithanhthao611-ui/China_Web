<script setup>
const props = defineProps({
  records: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  deletingAll: {
    type: Boolean,
    default: false,
  },
  totalRecords: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
  searchKeyword: {
    type: String,
    default: '',
  },
  statusFilter: {
    type: String,
    default: '',
  },
  statusOptions: {
    type: Array,
    default: () => ['draft', 'published', 'archived'],
  },
  publicReadinessFilter: {
    type: String,
    default: '',
  },
  languages: {
    type: Array,
    default: () => [],
  },
  expectedPublicLanguageCode: {
    type: String,
    default: 'en',
  },
})

const emit = defineEmits([
  'update:searchKeyword',
  'update:statusFilter',
  'update:publicReadinessFilter',
  'update:pageSize',
  'search',
  'view',
  'edit',
  'delete',
  'delete-all',
  'page-change',
])

function formatDateForDisplay(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function resolveStatusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'published') return 'status-published'
  if (normalized === 'draft') return 'status-draft'
  if (normalized === 'pending' || normalized === 'reviewing') return 'status-reviewing'
  return 'status-neutral'
}

function resolveCategory(record) {
  return record.category?.name || record.category_name || record.category_id || 'Uncategorized'
}

function resolveAuthor(record) {
  return record.author || 'Editorial team'
}

function resolveSource(record) {
  if (record.source_url) return 'rss'
  if (record.import_file_name) return 'file'
  return 'manual'
}

function resolveThumbnail(record) {
  return record.image?.url || record.image_url || ''
}

function resolveRecordLanguageCode(record) {
  if (record.language?.code) return String(record.language.code).trim()
  if (record.language_code) return String(record.language_code).trim()
  const language = props.languages.find((item) => item.id === Number(record.language_id))
  return String(language?.code || '').trim()
}

function resolvePublicBadges(record) {
  const badges = []
  const status = String(record.status || '').trim().toLowerCase()
  const categorySlug = String(record.category?.slug || record.category_slug || '').trim()
  const languageCode = resolveRecordLanguageCode(record)
  const validPublicCategories = ['corporate-news', 'industry-dynamics']

  if (status !== 'published') {
    badges.push({ label: 'Draft', tone: 'draft' })
  }

  if (!categorySlug || !validPublicCategories.includes(categorySlug)) {
    badges.push({ label: 'Wrong Category', tone: 'category' })
  }

  if (!languageCode || languageCode !== props.expectedPublicLanguageCode) {
    badges.push({ label: 'Wrong Language', tone: 'language' })
  }

  if (!badges.length) {
    badges.push({ label: 'Ready for Public', tone: 'ready' })
  }

  return badges
}

function resolvePublicBadgeClass(tone) {
  if (tone === 'ready') return 'public-badge--ready'
  if (tone === 'draft') return 'public-badge--draft'
  if (tone === 'language') return 'public-badge--language'
  if (tone === 'category') return 'public-badge--category'
  return 'public-badge--neutral'
}

function pageWindow() {
  const pages = []
  const current = props.currentPage
  const total = props.totalPages

  if (total <= 5) {
    for (let i = 1; i <= total; i += 1) pages.push(i)
    return pages
  }

  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i += 1) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

function resolveStatusOptionValue(option) {
  if (typeof option === 'string') return option
  return String(option?.value || '').trim()
}

function resolveStatusOptionLabel(option) {
  if (typeof option === 'string') return option
  return String(option?.label || option?.value || '').trim()
}
</script>

<template>
  <section class="records-wrap">
    <div class="filters-panel">
      <div class="filter-item filter-item--wide">
        <label for="posts_search_keyword">Search title</label>
        <input
          id="posts_search_keyword"
          :value="searchKeyword"
          type="search"
          placeholder="Keywords..."
          @input="$emit('update:searchKeyword', $event.target.value)"
          @keyup.enter="$emit('search')"
        />
      </div>

      <div class="filter-item">
        <label for="posts_status_filter">Status</label>
        <select id="posts_status_filter" :value="statusFilter" @change="$emit('update:statusFilter', $event.target.value)">
          <option value="">All Statuses</option>
          <option
            v-for="status in statusOptions"
            :key="resolveStatusOptionValue(status)"
            :value="resolveStatusOptionValue(status)"
          >
            {{ resolveStatusOptionLabel(status) }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label for="posts_public_readiness_filter">Public readiness</label>
        <select
          id="posts_public_readiness_filter"
          :value="publicReadinessFilter"
          @change="$emit('update:publicReadinessFilter', $event.target.value)"
        >
          <option value="">All</option>
          <option value="ready">Ready for Public</option>
          <option value="draft">Draft</option>
          <option value="wrong-language">Wrong Language</option>
          <option value="wrong-category">Wrong Category</option>
        </select>
      </div>

      <div class="filter-item">
        <label for="posts_page_size">Display</label>
        <select id="posts_page_size" :value="pageSize" @change="$emit('update:pageSize', Number($event.target.value))">
          <option :value="10">10 posts</option>
          <option :value="20">20 posts</option>
          <option :value="50">50 posts</option>
        </select>
      </div>

      <div class="filter-actions">
        <button id="posts_search_button" type="button" class="btn btn-primary" @click="$emit('search')">Search</button>
        <button
          id="posts_reset_button"
          type="button"
          class="btn btn-ghost"
          @click="
            $emit('update:searchKeyword', '');
            $emit('update:statusFilter', '');
            $emit('update:publicReadinessFilter', '');
            $emit('search')
          "
        >
          Reset
        </button>
        <button
          id="posts_delete_all_button"
          type="button"
          class="btn btn-danger"
          :disabled="loading || deletingAll || !totalRecords"
          @click="$emit('delete-all')"
        >
          {{ deletingAll ? 'Dang xoa...' : 'Xoa het bai viet' }}
        </button>
      </div>
    </div>

    <div class="table-shell">
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Post details</th>
              <th>Category</th>
              <th>Source</th>
              <th>Status</th>
              <th>Public</th>
              <th>Author</th>
              <th>Dates</th>
              <th class="align-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="table-empty-row">
              <td colspan="9" class="empty-state">Đang tải dữ liệu bài viết...</td>
            </tr>
            <tr v-else-if="!records.length" class="table-empty-row">
              <td colspan="9" class="empty-state">Chưa có bài viết nào phù hợp bộ lọc hiện tại.</td>
            </tr>
            <tr v-for="record in records" v-else :key="record.id" class="table-row">
              <td data-label="Thumbnail">
                <div class="thumb-box">
                  <img v-if="resolveThumbnail(record)" :src="resolveThumbnail(record)" :alt="record.title || 'thumbnail'" />
                  <div v-else class="thumb-fallback">▣</div>
                </div>
              </td>
              <td data-label="Post details">
                <div class="post-cell">
                  <button type="button" class="post-title-button" @click="$emit('view', record)">
                    {{ record.title || `Post #${record.id}` }}
                  </button>
                  <span>{{ record.slug || '-' }}</span>
                  <small>{{ stripHtml(record.summary || record.body).slice(0, 70) || 'No excerpt available.' }}</small>
                </div>
              </td>
              <td data-label="Category">
                <span class="category-chip">{{ resolveCategory(record) }}</span>
              </td>
              <td data-label="Source">
                <span class="source-icon">{{ resolveSource(record) === 'rss' ? '◔' : resolveSource(record) === 'file' ? '◫' : '✎' }}</span>
              </td>
              <td data-label="Status">
                <span class="status-pill" :class="resolveStatusClass(record.status)">
                  <span class="status-dot"></span>
                  {{ record.status || 'draft' }}
                </span>
              </td>
              <td data-label="Public">
                <div class="public-badge-list">
                  <span
                    v-for="badge in resolvePublicBadges(record)"
                    :key="`${record.id}-${badge.label}`"
                    class="public-badge"
                    :class="resolvePublicBadgeClass(badge.tone)"
                  >
                    {{ badge.label }}
                  </span>
                </div>
              </td>
              <td data-label="Author">
                <div class="author-cell">
                  <div class="author-avatar">{{ resolveAuthor(record).slice(0, 2).toUpperCase() }}</div>
                  <span>{{ resolveAuthor(record) }}</span>
                </div>
              </td>
              <td data-label="Dates">
                <div class="date-cell">
                  <strong>{{ formatDateForDisplay(record.published_at || record.updated_at || record.created_at) }}</strong>
                  <span>Updated recently</span>
                </div>
              </td>
              <td data-label="Actions">
                <div class="row-actions">
                  <button type="button" class="icon-btn" @click="$emit('view', record)">View</button>
                  <button type="button" class="icon-btn" @click="$emit('edit', record)">Edit</button>
                  <button type="button" class="icon-btn icon-btn--danger" @click="$emit('delete', record)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <div class="pagination-summary">
          Showing
          <strong>{{ Math.max(1, (currentPage - 1) * pageSize + 1) }}-{{ Math.min(totalRecords, currentPage * pageSize) }}</strong>
          of
          <strong>{{ totalRecords }}</strong>
          posts
        </div>

        <div class="pagination-actions">
          <button type="button" class="page-arrow" :disabled="currentPage <= 1" @click="$emit('page-change', 1)">|‹</button>
          <button type="button" class="page-arrow" :disabled="currentPage <= 1" @click="$emit('page-change', currentPage - 1)">‹</button>

          <template v-for="page in pageWindow()" :key="`page-${page}`">
            <span v-if="page === '...'" class="page-ellipsis">...</span>
            <button
              v-else
              type="button"
              class="page-chip"
              :class="{ 'page-chip--active': page === currentPage }"
              @click="$emit('page-change', page)"
            >
              {{ page }}
            </button>
          </template>

          <button type="button" class="page-arrow" :disabled="currentPage >= totalPages" @click="$emit('page-change', currentPage + 1)">›</button>
          <button type="button" class="page-arrow" :disabled="currentPage >= totalPages" @click="$emit('page-change', totalPages)">›|</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.records-wrap {
  display: grid;
  gap: 16px;
}

.filters-panel {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) repeat(2, minmax(180px, 1fr)) auto;
  gap: 14px;
  padding: 20px;
  border-radius: 20px;
  background: #e8eff3;
}

.filter-item {
  display: grid;
  gap: 8px;
}

.filter-item--wide {
  min-width: 0;
}

.filter-item label {
  color: #566166;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.filter-item input,
.filter-item select {
  min-height: 48px;
  border: none;
  border-radius: 10px;
  padding: 0 14px;
  background: #ffffff;
  color: #2a3439;
  font: inherit;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.btn {
  min-height: 48px;
  border: none;
  border-radius: 10px;
  padding: 0 18px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(145deg, #005ac2 0%, #004fab 100%);
  color: #f7f7ff;
}

.btn-ghost {
  min-width: 48px;
  background: #d9e4ea;
  color: #2a3439;
}

.btn-danger {
  background: linear-gradient(145deg, #b4233a 0%, #961d31 100%);
  color: #fff4f6;
}

.table-shell {
  overflow: hidden;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 8px 30px rgba(42, 52, 57, 0.05);
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
 td {
  padding: 20px;
  text-align: left;
  vertical-align: top;
}

th {
  background: rgba(240, 244, 247, 0.45);
  color: #566166;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.align-right {
  text-align: right;
}

.table-row {
  transition: background 0.2s ease;
}

.table-row:hover {
  background: #f0f4f7;
}

.table-row + .table-row td {
  border-top: 1px solid rgba(169, 180, 185, 0.16);
}

.table-empty-row td {
  text-align: center;
}

.empty-state {
  padding: 42px 20px;
  color: #566166;
  text-align: center;
}

.thumb-box {
  width: 54px;
  height: 36px;
  overflow: hidden;
  border-radius: 8px;
  background: #e8eff3;
}

.thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #566166;
  font-weight: 800;
}

.post-cell,
.author-cell,
.date-cell,
.row-actions {
  display: grid;
  gap: 5px;
}

.post-cell strong,
.date-cell strong {
  color: #2a3439;
}

.post-cell strong {
  font-size: 15px;
  line-height: 1.45;
}

.post-cell span,
.post-cell small,
.date-cell span {
  color: #566166;
}

.post-cell span {
  font-size: 12px;
}

.post-cell small,
.date-cell span {
  font-size: 11px;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: #d3e4fe;
  color: #435368;
  font-size: 11px;
  font-weight: 700;
}

.source-icon {
  color: #566166;
  font-size: 24px;
  line-height: 1;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #566166;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}

.status-published {
  color: #005ac2;
}

.status-draft {
  color: #5f5c78;
}

.status-reviewing {
  color: #506076;
}

.status-neutral {
  color: #717c82;
}

.author-cell {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
}

.public-badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.public-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.public-badge--ready {
  background: rgba(31, 155, 85, 0.12);
  color: #17784a;
}

.public-badge--draft {
  background: rgba(95, 92, 120, 0.12);
  color: #5f5c78;
}

.public-badge--language {
  background: rgba(0, 90, 194, 0.12);
  color: #005ac2;
}

.public-badge--category {
  background: rgba(201, 103, 24, 0.12);
  color: #9a5417;
}

.public-badge--neutral {
  background: rgba(86, 97, 102, 0.12);
  color: #566166;
}

.author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #d8e2ff;
  color: #005ac2;
  font-size: 10px;
  font-weight: 800;
}

.author-cell span {
  color: #2a3439;
  font-size: 12px;
  font-weight: 500;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: #566166;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.icon-btn:hover {
  color: #005ac2;
}

.post-title-button {
  border: none;
  padding: 0;
  background: transparent;
  color: #005ac2;
  font: inherit;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
}

.post-title-button:hover {
  color: #00408c;
  text-decoration: underline;
}

.icon-btn--danger:hover {
  color: #9f403d;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  background: rgba(240, 244, 247, 0.26);
}

.pagination-summary {
  color: #566166;
  font-size: 12px;
}

.pagination-summary strong {
  color: #2a3439;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-arrow,
.page-chip {
  min-width: 34px;
  height: 34px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #2a3439;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.page-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-chip--active {
  background: #005ac2;
  color: #f7f7ff;
}

.page-ellipsis {
  padding: 0 4px;
  color: #566166;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .filters-panel {
    grid-template-columns: 1fr 1fr;
  }

  .filter-actions {
    align-items: stretch;
  }
}

@media (max-width: 768px) {
  .filters-panel,
  .pagination-bar {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: stretch;
  }

  th,
  td {
    padding: 14px;
  }
}

@media (max-width: 700px) {
  .table-shell {
    overflow: visible;
    background: transparent;
    box-shadow: none;
    border-radius: 0;
  }

  .table-scroll {
    overflow: visible;
  }

  thead {
    display: none;
  }

  table {
    display: block;
  }

  tbody {
    display: grid;
    gap: 10px;
  }

  .table-row {
    display: block;
    border: 1px solid #d6e2ec;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  .table-row td {
    display: grid;
    grid-template-columns: minmax(110px, 40%) minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    padding: 10px 12px;
    border-top: 0;
    border-bottom: 1px dashed rgba(169, 180, 185, 0.24);
  }

  .table-row td:last-child {
    border-bottom: 0;
  }

  .table-row td::before {
    content: attr(data-label);
    color: #566166;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    line-height: 1.4;
    padding-top: 2px;
  }

  .table-empty-row {
    display: block;
  }

  .table-empty-row td {
    display: block;
    border: 1px solid #d6e2ec;
    border-radius: 12px;
    background: #fff;
  }

  .table-empty-row td::before {
    content: none;
  }

  .row-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .author-cell {
    grid-template-columns: 24px 1fr;
    gap: 8px;
  }

  .thumb-box {
    width: 100%;
    max-width: 120px;
    height: 72px;
  }
}
</style>
