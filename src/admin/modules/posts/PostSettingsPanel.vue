<script setup>
import { reactive, ref } from 'vue'

import { createAdminEntityRecord } from '@/admin/api/adminApi.js'

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    default: 'manual',
  },
  form: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
  statusOptions: {
    type: Array,
    default: () => ['draft', 'published', 'archived'],
  },
  languages: {
    type: Array,
    default: () => [],
  },
  mediaOptions: {
    type: Array,
    default: () => [],
  },
  selectedImageUrl: {
    type: String,
    default: '',
  },
  sourceForm: {
    type: Object,
    required: true,
  },
  sourcePreview: {
    type: Object,
    default: null,
  },
  sourceLoading: {
    type: Boolean,
    default: false,
  },
  importState: {
    type: Object,
    required: true,
  },
  importLoading: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
  publicationWarnings: {
    type: Array,
    default: () => [],
  },
  publicationReady: {
    type: Boolean,
    default: false,
  },
  expectedLanguageCode: {
    type: String,
    default: 'en',
  },
})

const emit = defineEmits([
  'source-fetch',
  'source-apply',
  'import-file-change',
  'import-apply',
  'upload-cover',
  'cover-file-change',
  'submit',
  'save-draft',
  'manage-categories',
  'category-created',
])

const creatingCategory = ref(false)
const categoryCreateError = ref('')
const categoryCreateSuccess = ref('')
const categoryDraft = reactive({
  name: '',
  slug: '',
  description: '',
})

function seoTone() {
  if (props.form.meta_title || props.form.meta_description) return 'good'
  return 'low'
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function resetCategoryDraft() {
  categoryDraft.name = ''
  categoryDraft.slug = ''
  categoryDraft.description = ''
}

function onCategoryNameInput() {
  if (!String(categoryDraft.slug || '').trim()) {
    categoryDraft.slug = slugify(categoryDraft.name)
  }
}

function onCategorySlugInput() {
  categoryDraft.slug = slugify(categoryDraft.slug)
}

function resolveStatusOptionValue(option) {
  if (typeof option === 'string') return option
  return String(option?.value || '').trim()
}

function resolveStatusOptionLabel(option) {
  if (typeof option === 'string') return option
  return String(option?.label || option?.value || '').trim()
}

function handleStatusChange(event) {
  const value = String(event?.target?.value || '').trim() || 'draft'
  props.form.status = value
  if (value === 'published' && !props.form.published_at) {
    props.form.published_at = new Date().toISOString().slice(0, 16)
  }
}

async function createQuickCategory() {
  const normalizedToken = String(props.token || '').trim()
  if (!normalizedToken) return

  categoryCreateError.value = ''
  categoryCreateSuccess.value = ''

  const name = String(categoryDraft.name || '').trim()
  const slug = slugify(categoryDraft.slug || name)
  const description = String(categoryDraft.description || '').trim()

  if (!name) {
    categoryCreateError.value = 'Tên danh mục là bắt buộc.'
    return
  }
  if (!slug) {
    categoryCreateError.value = 'Slug danh mục chưa hợp lệ.'
    return
  }

  creatingCategory.value = true
  try {
    const created = await createAdminEntityRecord(
      'post_categories',
      {
        name,
        slug,
        description: description || null,
        status: 'active',
        sort_order: 0,
      },
      normalizedToken
    )
    emit('category-created', created)
    categoryCreateSuccess.value = `Đã tạo danh mục "${created.name}".`
    resetCategoryDraft()
  } catch (error) {
    categoryCreateError.value = error?.message || 'Không thể tạo danh mục mới.'
  } finally {
    creatingCategory.value = false
  }
}
</script>

<template>
  <aside class="settings-panel">
    <section class="settings-card">
      <div class="card-head">
        <h4>{{ mode === 'manual' ? 'Publish Settings' : mode === 'reference' ? 'Draft Configuration' : 'Publishing Info' }}</h4>
      </div>

      <div class="info-list">
        <div class="info-row">
          <span>Status</span>
          <strong class="status-tag">{{ form.status || 'draft' }}</strong>
        </div>
        <label class="field">
          <span>Tùy chỉnh status</span>
          <select :value="form.status || 'draft'" @change="handleStatusChange">
            <option
              v-for="status in statusOptions"
              :key="resolveStatusOptionValue(status)"
              :value="resolveStatusOptionValue(status)"
            >
              {{ resolveStatusOptionLabel(status) }}
            </option>
          </select>
        </label>
        <div class="info-row">
          <span>Visibility</span>
          <strong>Public</strong>
        </div>
        <div class="info-row">
          <span>{{ mode === 'reference' ? 'Schedule' : 'Publish date' }}</span>
          <strong class="text-link">{{ form.published_at || 'Immediately' }}</strong>
        </div>
      </div>

      <button
        id="settings_publish_button"
        type="button"
        class="primary-action"
        :disabled="saving"
        @click="$emit('submit')"
      >
        {{ saving ? 'Đang lưu...' : mode === 'manual' ? 'Publish Post' : mode === 'import' ? 'Publish Post' : 'Apply Workflow' }}
      </button>
      <button
        v-if="mode === 'import'"
        id="settings_save_draft_button"
        type="button"
        class="secondary-action"
        :disabled="saving"
        @click="$emit('save-draft')"
      >
        Save Draft
      </button>

      <div class="publication-visibility" :class="publicationReady ? 'publication-visibility--ready' : 'publication-visibility--warning'">
        <strong>
          {{ publicationReady ? 'Bài này đã sẵn sàng hiển thị ở giao diện người dùng.' : 'Bài này sẽ chưa xuất hiện ở giao diện người dùng.' }}
        </strong>
        <ul v-if="publicationWarnings.length" class="publication-warning-list">
          <li v-for="warning in publicationWarnings" :key="warning">{{ warning }}</li>
        </ul>
        <p v-else class="publication-helper-copy">
          Category và language hiện tại đã phù hợp với frontend public ({{ expectedLanguageCode }}).
        </p>
      </div>
    </section>

    <section v-if="mode === 'reference'" class="settings-card settings-card--workflow">
      <div class="card-head">
        <h4>Source Reference</h4>
      </div>

      <label class="field">
        <span>Source URL</span>
        <input v-model="sourceForm.url" type="url" placeholder="https://example.com/reference-article" />
      </label>
      <label class="field">
        <span>Source Name</span>
        <input v-model="sourceForm.name" type="text" placeholder="WSJ, Reuters, đối tác..." />
      </label>
      <label class="field">
        <span>Internal Notes</span>
        <textarea v-model="sourceForm.note" rows="5" placeholder="Synthesize key arguments here..."></textarea>
      </label>

      <div class="stack-actions">
        <button id="reference_fetch_button" type="button" class="secondary-action" :disabled="sourceLoading" @click="$emit('source-fetch')">
          {{ sourceLoading ? 'Fetching...' : 'Fetch Content' }}
        </button>
        <button id="reference_apply_button" type="button" class="primary-action primary-action--soft" @click="$emit('source-apply')">
          Create Draft
        </button>
      </div>

      <p class="helper-copy">
        Chỉ dùng cho biên tập tham khảo, không sao chép nguyên văn hay sử dụng theo hướng vi phạm bản quyền.
      </p>

      <div v-if="sourcePreview" class="source-preview-card">
        <strong>{{ sourcePreview.title || 'Source Preview' }}</strong>
        <p>{{ sourcePreview.summary || sourcePreview.excerpt || 'Nguồn tham khảo đã sẵn sàng để dựng nháp.' }}</p>
      </div>
    </section>

    <section v-if="mode === 'import'" class="settings-card settings-card--workflow">
      <div class="card-head">
        <h4>Import File</h4>
      </div>

      <label class="upload-dropzone" for="post_import_file_input">
        <input id="post_import_file_input" type="file" accept=".docx,.txt,.md,.html,.pdf" @change="$emit('import-file-change', $event)" />
        <div class="upload-icon">⇪</div>
        <strong>Drag and drop your file here</strong>
        <span>Support for .docx, .txt, .md, .html and .pdf</span>
      </label>

      <div v-if="importState.fileName" class="source-preview-card">
        <strong>{{ importState.fileName }}</strong>
        <p>{{ importState.message || 'Ready to map content into the post editor.' }}</p>
      </div>

      <button id="import_apply_button" type="button" class="primary-action" :disabled="importLoading || !importState.fileName" @click="$emit('import-apply')">
        {{ importLoading ? 'Importing...' : 'Map imported content' }}
      </button>
    </section>

    <section class="settings-card">
      <div class="card-head">
        <h4>{{ mode === 'manual' ? 'Featured Image' : mode === 'import' ? 'Featured Image' : 'SEO / Media' }}</h4>
      </div>

      <label v-if="mode !== 'import'" class="field">
        <span>Post Title</span>
        <input v-model="form.title" type="text" placeholder="Enter a compelling headline..." />
      </label>
      <label v-if="mode !== 'import'" class="field">
        <span>Slug</span>
        <input v-model="form.slug" type="text" placeholder="my-awesome-post" />
      </label>
      <label class="field">
        <span>Category</span>
        <select v-model.number="form.category_id">
          <option :value="null">Select category</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
      </label>
      <div class="category-quick-tools">
        <button id="manage_post_categories_button" type="button" class="link-action" @click="$emit('manage-categories')">
          Quản lý danh mục
        </button>
      </div>
      <div class="quick-category-card">
        <p class="quick-category-title">Tạo danh mục nhanh</p>
        <label class="field">
          <span>Tên danh mục</span>
          <input v-model="categoryDraft.name" type="text" placeholder="Ví dụ: Corporate News" @input="onCategoryNameInput" />
        </label>
        <label class="field">
          <span>Slug</span>
          <input v-model="categoryDraft.slug" type="text" placeholder="corporate-news" @input="onCategorySlugInput" />
        </label>
        <label class="field">
          <span>Mô tả</span>
          <textarea v-model="categoryDraft.description" rows="2" placeholder="Mô tả ngắn cho danh mục..."></textarea>
        </label>
        <button
          id="create_post_category_button"
          type="button"
          class="secondary-action"
          :disabled="creatingCategory"
          @click="createQuickCategory"
        >
          {{ creatingCategory ? 'Đang tạo...' : 'Tạo danh mục' }}
        </button>
        <p v-if="categoryCreateError" class="quick-category-feedback quick-category-feedback--error">{{ categoryCreateError }}</p>
        <p v-else-if="categoryCreateSuccess" class="quick-category-feedback quick-category-feedback--success">{{ categoryCreateSuccess }}</p>
      </div>
      <label class="field">
        <span>Language</span>
        <select v-model.number="form.language_id">
          <option v-for="language in languages" :key="language.id" :value="language.id">{{ language.name || language.code }}</option>
        </select>
      </label>
      <label v-if="mode !== 'import'" class="field">
        <span>Short Description</span>
        <textarea v-model="form.summary" rows="3" placeholder="Brief summary for social cards and listings..."></textarea>
      </label>

      <div class="image-picker">
        <label class="image-dropzone">
          <input type="file" accept="image/*" @change="$emit('cover-file-change', $event)" />
          <img v-if="selectedImageUrl" :src="selectedImageUrl" alt="Selected cover" />
          <template v-else>
            <span class="upload-icon">🖼</span>
            <small>Select image</small>
          </template>
        </label>
        <button id="upload_cover_button" type="button" class="secondary-action" @click="$emit('upload-cover')">Upload cover</button>
      </div>
    </section>

    <section class="settings-card">
      <div class="card-head card-head--between">
        <h4>{{ mode === 'manual' ? 'SEO Analysis' : 'SEO Preview' }}</h4>
        <span class="seo-dot" :class="`seo-dot--${seoTone()}`"></span>
      </div>

      <label class="field">
        <span>Meta title</span>
        <input v-model="form.meta_title" type="text" placeholder="SEO title" />
      </label>
      <label class="field">
        <span>Meta description</span>
        <textarea v-model="form.meta_description" rows="3" placeholder="SEO description"></textarea>
      </label>

      <div class="seo-preview-box">
        <strong>{{ form.meta_title || form.title || 'Tiêu đề SEO sẽ hiển thị tại đây' }}</strong>
        <span>newsroom.cms/posts/{{ form.slug || 'your-post-slug' }}</span>
        <p>{{ form.meta_description || form.summary || 'Mô tả SEO của bài viết sẽ hiển thị tại đây.' }}</p>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.settings-panel {
  display: grid;
  gap: 18px;
}

.settings-card {
  background: #ffffff;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 8px 30px rgba(42, 52, 57, 0.05);
  display: grid;
  gap: 14px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-head--between {
  justify-content: space-between;
}

.card-head h4 {
  margin: 0;
  color: #2a3439;
  font-size: 15px;
  font-weight: 800;
}

.info-list,
.stack-actions {
  display: grid;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #566166;
  font-size: 13px;
}

.info-row strong {
  color: #2a3439;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 8px;
  background: #d3e4fe;
  color: #435368;
  font-size: 11px;
  text-transform: uppercase;
}

.text-link {
  color: #005ac2 !important;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #566166;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.category-quick-tools {
  display: flex;
  justify-content: flex-end;
  margin-top: -4px;
}

.link-action {
  border: none;
  background: transparent;
  color: #005ac2;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
}

.quick-category-card {
  border: 1px solid rgba(169, 180, 185, 0.28);
  border-radius: 14px;
  padding: 12px;
  background: #fbfdff;
  display: grid;
  gap: 10px;
}

.quick-category-title {
  margin: 0;
  color: #2a3439;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.quick-category-feedback {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.quick-category-feedback--error {
  color: #a73447;
}

.quick-category-feedback--success {
  color: #1d7740;
}

input,
select,
textarea {
  width: 100%;
  min-height: 46px;
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  background: #f0f4f7;
  color: #2a3439;
  font: inherit;
}

textarea {
  resize: vertical;
}

.primary-action,
.secondary-action {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 12px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.primary-action {
  background: linear-gradient(145deg, #005ac2 0%, #004fab 100%);
  color: #f7f7ff;
}

.primary-action--soft {
  background: rgba(0, 90, 194, 0.1);
  color: #005ac2;
}

.secondary-action {
  background: #f0f4f7;
  color: #435368;
}

.helper-copy {
  margin: 0;
  color: #566166;
  font-size: 12px;
  line-height: 1.6;
}

.source-preview-card {
  border-radius: 14px;
  padding: 14px;
  background: #f7f9fb;
  color: #566166;
  display: grid;
  gap: 8px;
}

.source-preview-card strong {
  color: #2a3439;
}

.upload-dropzone,
.image-dropzone {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  gap: 8px;
  border-radius: 16px;
  border: 2px dashed rgba(169, 180, 185, 0.35);
  background: #f0f4f7;
  text-align: center;
  cursor: pointer;
}

.upload-dropzone {
  min-height: 220px;
  padding: 18px;
}

.image-dropzone {
  min-height: 180px;
}

.upload-dropzone input,
.image-dropzone input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: rgba(216, 226, 255, 0.65);
  color: #005ac2;
  font-size: 24px;
  font-weight: 800;
}

.image-picker {
  display: grid;
  gap: 12px;
}

.image-dropzone img {
  width: 100%;
  height: 100%;
  max-height: 240px;
  object-fit: cover;
}

.seo-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.seo-dot--good {
  background: #22c55e;
}

.seo-dot--low {
  background: #9f403d;
}

.seo-preview-box {
  display: grid;
  gap: 4px;
}

.seo-preview-box strong {
  color: #005ac2;
  font-size: 14px;
}

.seo-preview-box span {
  color: #16a34a;
  font-size: 11px;
}

.seo-preview-box p {
  margin: 0;
  color: #566166;
  font-size: 11px;
  line-height: 1.5;
}

.publication-visibility {
  border-radius: 14px;
  padding: 14px;
  display: grid;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;
}

.publication-visibility strong {
  font-size: 13px;
}

.publication-visibility--ready {
  background: rgba(31, 155, 85, 0.08);
  border: 1px solid rgba(31, 155, 85, 0.18);
  color: #17784a;
}

.publication-visibility--warning {
  background: rgba(201, 103, 24, 0.08);
  border: 1px solid rgba(201, 103, 24, 0.18);
  color: #9a5417;
}

.publication-warning-list {
  margin: 0;
  padding-left: 18px;
}

.publication-helper-copy {
  margin: 0;
}
</style>
