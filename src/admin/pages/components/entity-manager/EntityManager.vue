<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/admin/services/adminApi'
import { ENTITY_MANAGER_CONFIGS } from '@/admin/config/entityConfigs'
import { env } from '@/config/env'

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
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

const STATUS_OPTIONS = ['published', 'draft', 'archived', 'active', 'inactive', 'new', 'in_progress', 'resolved']
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const FIELD_GROUPS = {
  content: ['summary', 'body', 'description', 'content', 'message'],
  media: ['image_id', 'hero_image_id', 'thumbnail_id', 'media_id'],
}

const RELATION_ENTITIES = {
  language_id: 'languages',
  category_id: null,
  project_id: 'projects',
  branch_id: 'branches',
  page_id: 'pages',
  parent_id: null,
  block_id: 'content_blocks',
}

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
const form = reactive({})
const formErrors = ref([])
const uploadFile = ref(null)
const uploadTitle = ref('')
const uploadAltText = ref('')
const uploadTargetField = ref('image_id')
const uploading = ref(false)

const config = computed(() => ENTITY_MANAGER_CONFIGS[props.entityKey])
const tableColumns = computed(() => config.value?.table || ['id'])
const formFields = computed(() => config.value?.fields || [])
const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / pageSize.value)))
const hasStatusFilter = computed(() => formFields.value.includes('status'))
const hasMediaFields = computed(() => formFields.value.some((field) => FIELD_GROUPS.media.includes(field)))
const mediaFieldOptions = computed(() => formFields.value.filter((field) => FIELD_GROUPS.media.includes(field)))
const canCreate = computed(() => config.value?.allowCreate !== false)
const standaloneUpload = computed(() => Boolean(config.value?.standaloneUpload))

function normalizedToken() {
  return String(props.token || '').trim()
}

function notifySuccess(message) {
  emit('notify-success', message)
}

function notifyError(message) {
  emit('notify-error', message)
}

function clearNotify() {
  emit('clear-notify')
}

function fieldLabel(field) {
  return field.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function inputType(field) {
  if (['sort_order', 'language_id', 'category_id', 'project_id', 'branch_id', 'page_id', 'parent_id', 'block_id', 'entity_id', 'award_year', 'project_year', 'width', 'height', 'size', 'image_id', 'hero_image_id', 'thumbnail_id', 'media_id'].includes(field)) {
    return 'number'
  }
  if (field === 'email') return 'email'
  if (field.endsWith('_url') || field === 'url' || field === 'link' || field === 'video_url') return 'url'
  if (field.endsWith('_at')) return 'datetime-local'
  return 'text'
}

function isTextarea(field) {
  return FIELD_GROUPS.content.includes(field) || field === 'meta_description' || field === 'config_value' || field === 'metadata_json'
}

function isBooleanField(field) {
  return field === 'is_active' || field === 'is_primary' || field === 'is_default'
}

function isSelectField(field) {
  return field === 'status' || field === 'asset_type' || field === 'banner_type' || field === 'branch_type' || field === 'contact_type'
}

function selectOptions(field) {
  const options = {
    status: STATUS_OPTIONS,
    asset_type: ['image', 'video', 'document', 'file'],
    banner_type: ['hero', 'page', 'section', 'footer'],
    branch_type: ['subsidiary', 'branch', 'office'],
    contact_type: ['headquarters', 'branch', 'sales', 'support'],
  }
  return options[field] || []
}

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function previewPath(record) {
  const resolver = config.value?.preview
  if (!resolver || !record?.id) return ''
  return resolver(record)
}

function previewUrl(record) {
  const path = previewPath(record)
  if (!path) return ''
  return path.startsWith('http') ? path : path
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' && value.length > 80) return `${value.slice(0, 80)}...`
  return value
}

function normalizeDatetimeForInput(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

function setDefaultFormValues(record = {}) {
  Object.keys(form).forEach((key) => delete form[key])

  formFields.value.forEach((field) => {
    if (field in record) {
      form[field] = field.endsWith('_at') ? normalizeDatetimeForInput(record[field]) : record[field]
      return
    }

    if (isBooleanField(field)) {
      form[field] = field === 'is_active'
      return
    }
    if (field === 'status') {
      form[field] = props.entityKey.includes('categor') || props.entityKey === 'media_assets' ? 'active' : 'published'
      return
    }
    if (field === 'language_id') {
      form[field] = relationOptions.language_id?.[0]?.id || 1
      return
    }
    if (field === 'sort_order') {
      form[field] = 0
      return
    }
    form[field] = ''
  })

  uploadTargetField.value = mediaFieldOptions.value[0] || 'image_id'
  formErrors.value = []
}

function cleanPayload() {
  const payload = {}

  formFields.value.forEach((field) => {
    const value = form[field]
    if (value === '') {
      payload[field] = null
      return
    }

    if (field === 'metadata_json' && typeof value === 'string') {
      payload[field] = value.trim() ? JSON.parse(value) : null
      return
    }

    if (inputType(field) === 'number') {
      payload[field] = value === null || value === undefined ? null : Number(value)
      return
    }

    payload[field] = value
  })

  return payload
}

function validateForm() {
  const errors = []
  const requiredFields = config.value?.required || []

  requiredFields.forEach((field) => {
    if (form[field] === null || form[field] === undefined || String(form[field]).trim() === '') {
      errors.push(`${fieldLabel(field)} is required.`)
    }
  })

  if (form.slug && !SLUG_PATTERN.test(String(form.slug))) {
    errors.push('Slug must be lowercase, use numbers or hyphen, and cannot contain spaces.')
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email))) {
    errors.push('Email format is invalid.')
  }

  formFields.value.forEach((field) => {
    if (inputType(field) === 'number' && form[field] !== '' && form[field] !== null && !Number.isFinite(Number(form[field]))) {
      errors.push(`${fieldLabel(field)} must be a number.`)
    }
  })

  if (form.metadata_json && typeof form.metadata_json === 'string') {
    try {
      JSON.parse(form.metadata_json)
    } catch {
      errors.push('Metadata JSON must be valid JSON.')
    }
  }

  formErrors.value = errors
  return errors.length === 0
}

async function loadRelationOptions() {
  const token = normalizedToken()
  if (!token) return

  Object.keys(relationOptions).forEach((key) => delete relationOptions[key])

  const relationMap = { ...RELATION_ENTITIES }
  relationMap.category_id = props.entityKey === 'posts' ? 'post_categories' : props.entityKey === 'projects' ? 'project_categories' : null
  relationMap.parent_id = props.entityKey === 'pages' ? 'pages' : props.entityKey === 'branches' ? 'branches' : props.entityKey.includes('categor') ? props.entityKey : null

  await Promise.all(
    Object.entries(relationMap)
      .filter(([field, entityName]) => formFields.value.includes(field) && entityName)
      .map(async ([field, entityName]) => {
        const response = await listAdminEntityRecords(entityName, token, { skip: 0, limit: 100 })
        relationOptions[field] = response.items || []
      })
  )
}

async function loadMediaOptions() {
  const token = normalizedToken()
  if (!token || (!hasMediaFields.value && !standaloneUpload.value)) return

  const response = await listAdminEntityRecords('media_assets', token, { skip: 0, limit: 100, status: 'active' })
  mediaOptions.value = response.items || []
}

async function loadRecords() {
  const token = normalizedToken()
  if (!token) return

  loading.value = true
  clearNotify()
  try {
    const query = {
      skip: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
      search: searchKeyword.value.trim() || undefined,
    }
    if (hasStatusFilter.value && statusFilter.value) {
      query.status = statusFilter.value
    }

    const response = await listAdminEntityRecords(props.entityKey, token, query)
    records.value = response.items || []
    totalRecords.value = response.pagination?.total || 0
  } catch (error) {
    notifyError(error.message || 'Failed to load content records.')
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await loadRelationOptions()
  await loadMediaOptions()
  await loadRecords()
}

function openCreateForm() {
  if (!canCreate.value) return
  formMode.value = 'create'
  editingRecordId.value = null
  setDefaultFormValues()
  formOpen.value = true
}

function openEditForm(record) {
  formMode.value = 'edit'
  editingRecordId.value = record.id
  setDefaultFormValues(record)
  if (typeof form.metadata_json === 'object' && form.metadata_json !== null) {
    form.metadata_json = JSON.stringify(form.metadata_json, null, 2)
  }
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingRecordId.value = null
  formErrors.value = []
}

async function submitForm() {
  const token = normalizedToken()
  if (!token || !validateForm()) return

  saving.value = true
  try {
    const payload = cleanPayload()
    if (formMode.value === 'create') {
      await createAdminEntityRecord(props.entityKey, payload, token)
      notifySuccess(`Created ${config.value.label} record.`)
    } else {
      await updateAdminEntityRecord(props.entityKey, editingRecordId.value, payload, token)
      notifySuccess(`Updated ${config.value.label} record.`)
    }
    closeForm()
    await loadRecords()
  } catch (error) {
    notifyError(error.message || 'Failed to save record.')
  } finally {
    saving.value = false
  }
}

async function deleteRecord(record) {
  const token = normalizedToken()
  if (!token) return

  const confirmed = window.confirm(`Delete "${record[config.value.titleField] || record.slug || record.name || `#${record.id}`}"?`)
  if (!confirmed) return

  deletingId.value = record.id
  try {
    await deleteAdminEntityRecord(props.entityKey, record.id, token)
    notifySuccess('Record deleted.')
    await loadRecords()
  } catch (error) {
    notifyError(error.message || 'Failed to delete record.')
  } finally {
    deletingId.value = null
  }
}

function handleFileChange(event) {
  uploadFile.value = event.target.files?.[0] || null
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
      title: uploadTitle.value,
      altText: uploadAltText.value,
    })
    await loadMediaOptions()
    if (standaloneUpload.value) {
      await loadRecords()
    } else if (uploadTargetField.value && uploadTargetField.value in form) {
      form[uploadTargetField.value] = media.id
    }
    uploadFile.value = null
    uploadTitle.value = ''
    uploadAltText.value = ''
    notifySuccess(`Uploaded media #${media.id}.`)
  } catch (error) {
    notifyError(error.message || 'Failed to upload media.')
  } finally {
    uploading.value = false
  }
}

function setPage(page) {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value)
}

watch(
  () => props.entityKey,
  async () => {
    currentPage.value = 1
    statusFilter.value = ''
    searchKeyword.value = ''
    closeForm()
    if (props.active && normalizedToken()) {
      await refreshAll()
    }
  },
  { immediate: true }
)

watch([currentPage, pageSize], () => {
  if (props.active && normalizedToken()) {
    loadRecords()
  }
})

watch(
  () => props.active,
  async (active) => {
    if (active && normalizedToken()) {
      await refreshAll()
    } else {
      closeForm()
    }
  }
)

watch(
  () => props.token,
  async (value) => {
    if (!String(value || '').trim()) {
      records.value = []
      totalRecords.value = 0
      closeForm()
      return
    }
    if (props.active) {
      await refreshAll()
    }
  }
)

onMounted(() => {
  if (props.active && normalizedToken()) {
    refreshAll()
  }
})
</script>

<template>
  <section class="entity-manager">
    <div class="manager-toolbar">
      <div>
        <p class="eyebrow">{{ config.eyebrow }}</p>
        <h2>{{ config.label }}</h2>
        <p class="description">{{ config.description }}</p>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="refreshAll">Refresh</button>
        <button v-if="canCreate" type="button" class="btn btn-primary" @click="openCreateForm">New Record</button>
      </div>
    </div>

    <div class="filters">
      <input v-model="searchKeyword" type="search" :placeholder="`Search ${config.label.toLowerCase()}...`" @keyup.enter="currentPage = 1; loadRecords()" />
      <select v-if="hasStatusFilter" v-model="statusFilter" aria-label="Status filter">
        <option value="">All statuses</option>
        <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
      </select>
      <button type="button" class="btn btn-secondary" :disabled="loading" @click="currentPage = 1; loadRecords()">Search</button>
    </div>

    <div v-if="standaloneUpload" class="upload-panel">
      <div>
        <p class="eyebrow">Upload Media</p>
        <h3>Media Upload</h3>
      </div>
      <div class="upload-row">
        <input type="file" accept="image/*,video/*,application/pdf" @change="handleFileChange" />
        <input v-model="uploadTitle" type="text" placeholder="Media title" />
        <input v-model="uploadAltText" type="text" placeholder="Alt text" />
        <button type="button" class="btn btn-primary" :disabled="uploading" @click="uploadMedia">
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>
      </div>
    </div>

    <div class="records-panel">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th v-for="column in tableColumns" :key="column">{{ fieldLabel(column) }}</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td :colspan="tableColumns.length + 2">Loading records...</td>
            </tr>
            <tr v-else-if="!records.length">
              <td :colspan="tableColumns.length + 2">No records found.</td>
            </tr>
            <tr v-for="record in records" v-else :key="record.id">
              <td v-for="column in tableColumns" :key="`${record.id}-${column}`">{{ formatCell(record[column]) }}</td>
              <td>
                <a v-if="previewUrl(record)" :href="previewUrl(record)" target="_blank" rel="noreferrer">Open</a>
                <span v-else>-</span>
              </td>
              <td>
                <div class="row-actions">
                  <button type="button" class="btn btn-secondary" @click="openEditForm(record)">Edit</button>
                  <button type="button" class="btn btn-danger" :disabled="deletingId === record.id" @click="deleteRecord(record)">
                    {{ deletingId === record.id ? 'Deleting...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <span>{{ totalRecords }} records</span>
        <select v-model.number="pageSize" aria-label="Page size">
          <option :value="10">10 / page</option>
          <option :value="20">20 / page</option>
          <option :value="50">50 / page</option>
        </select>
        <button type="button" class="btn btn-secondary" :disabled="currentPage <= 1" @click="setPage(currentPage - 1)">Prev</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button type="button" class="btn btn-secondary" :disabled="currentPage >= totalPages" @click="setPage(currentPage + 1)">Next</button>
      </div>
    </div>

    <aside v-if="formOpen" class="editor-panel">
      <div class="editor-head">
        <div>
          <p class="eyebrow">{{ formMode === 'create' ? 'Create' : 'Edit' }}</p>
          <h3>{{ config.label }}</h3>
        </div>
        <button type="button" class="icon-btn" aria-label="Close editor" @click="closeForm">x</button>
      </div>

      <div v-if="formErrors.length" class="form-errors">
        <p v-for="error in formErrors" :key="error">{{ error }}</p>
      </div>

      <div v-if="hasMediaFields" class="upload-box">
        <div class="upload-row">
          <select v-model="uploadTargetField" aria-label="Upload target field">
            <option v-for="field in mediaFieldOptions" :key="field" :value="field">{{ fieldLabel(field) }}</option>
          </select>
          <input type="file" accept="image/*,video/*,application/pdf" @change="handleFileChange" />
        </div>
        <div class="upload-row">
          <input v-model="uploadTitle" type="text" placeholder="Media title" />
          <input v-model="uploadAltText" type="text" placeholder="Alt text" />
          <button type="button" class="btn btn-secondary" :disabled="uploading" @click="uploadMedia">
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </div>
      </div>

      <form class="dynamic-form" @submit.prevent="submitForm">
        <label v-for="field in formFields" :key="field" :class="{ wide: isTextarea(field) }">
          <span>{{ fieldLabel(field) }}</span>

          <input v-if="isBooleanField(field)" v-model="form[field]" type="checkbox" />

          <select v-else-if="FIELD_GROUPS.media.includes(field)" v-model.number="form[field]">
            <option :value="null">No media</option>
            <option v-for="media in mediaOptions" :key="media.id" :value="media.id">
              #{{ media.id }} - {{ media.title || media.file_name || media.url }}
            </option>
          </select>

          <select v-else-if="relationOptions[field]" v-model.number="form[field]">
            <option :value="null">None</option>
            <option v-for="option in relationOptions[field]" :key="option.id" :value="option.id">
              #{{ option.id }} - {{ option.title || option.name || option.slug || option.config_key || option.code }}
            </option>
          </select>

          <select v-else-if="isSelectField(field)" v-model="form[field]">
            <option value="">None</option>
            <option v-for="option in selectOptions(field)" :key="option" :value="option">{{ option }}</option>
          </select>

          <textarea v-else-if="isTextarea(field)" v-model="form[field]" rows="5"></textarea>

          <input v-else v-model="form[field]" :type="inputType(field)" />
        </label>

        <div v-if="hasMediaFields && mediaOptions.length" class="media-preview-list">
          <article v-for="media in mediaOptions.slice(0, 8)" :key="media.id">
            <img v-if="media.asset_type === 'image'" :src="resolveMediaUrl(media.url)" :alt="media.alt_text || media.title || ''" />
            <span v-else>{{ media.asset_type }}</span>
            <small>#{{ media.id }} {{ media.title || media.file_name }}</small>
          </article>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="closeForm">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save Record' }}</button>
        </div>
      </form>
    </aside>
  </section>
</template>

<style scoped>
.entity-manager {
  margin-top: 14px;
  display: grid;
  gap: 12px;
}

.manager-toolbar,
.filters,
.records-panel,
.editor-panel,
.upload-panel {
  border: 1px solid #d8e3f0;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 24px rgba(29, 55, 86, 0.08);
}

.manager-toolbar,
.upload-panel {
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.eyebrow {
  margin: 0 0 4px;
  color: #647891;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

h2,
h3 {
  margin: 0;
  color: #1f3850;
}

.description {
  margin: 6px 0 0;
  color: #5b738d;
  font-size: 13px;
}

.toolbar-actions,
.filters,
.pagination,
.row-actions,
.form-actions,
.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filters {
  border-radius: 8px;
  padding: 10px;
}

input,
select,
textarea {
  min-height: 38px;
  border: 1px solid #c8d8ea;
  border-radius: 8px;
  padding: 8px 10px;
  color: #1f3850;
  background: #fff;
  font: inherit;
}

textarea {
  resize: vertical;
}

.filters input {
  flex: 1;
  min-width: 240px;
}

.btn,
.icon-btn {
  border-radius: 8px;
  border: 1px solid transparent;
  min-height: 38px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
  white-space: nowrap;
}

.btn-primary {
  background: #279ed0;
  border-color: #1f90bf;
  color: #fff;
}

.btn-secondary {
  background: #f2f6fb;
  border-color: #c8d8ea;
  color: #31506f;
}

.btn-danger {
  background: #fff0f2;
  border-color: #efbcc5;
  color: #a33447;
}

button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.records-panel {
  border-radius: 8px;
  overflow: hidden;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 860px;
}

th,
td {
  border-bottom: 1px solid #e1eaf4;
  padding: 10px;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
}

th {
  background: #f2f6fb;
  color: #4c6480;
  font-size: 12px;
  text-transform: uppercase;
}

td a {
  color: #167aa6;
  font-weight: 700;
}

.pagination {
  justify-content: flex-end;
  padding: 10px;
  color: #5a718b;
}

.editor-panel {
  border-radius: 8px;
  padding: 14px;
}

.editor-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.icon-btn {
  width: 38px;
  padding: 0;
  background: #f5f8fc;
  border-color: #cddbea;
  color: #32506e;
}

.form-errors {
  background: #fff0f2;
  border: 1px solid #efbcc5;
  border-radius: 8px;
  color: #9d2f42;
  padding: 8px 10px;
  margin-bottom: 10px;
}

.form-errors p {
  margin: 2px 0;
}

.upload-panel {
  align-items: center;
}

.upload-box {
  border: 1px dashed #a8c8e6;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;
  display: grid;
  gap: 8px;
  background: #f8fbff;
}

.dynamic-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dynamic-form label {
  display: grid;
  gap: 5px;
  color: #445d77;
  font-size: 12px;
  font-weight: 700;
}

.dynamic-form label.wide,
.media-preview-list,
.form-actions {
  grid-column: 1 / -1;
}

.dynamic-form input[type='checkbox'] {
  width: 20px;
  min-height: 20px;
}

.media-preview-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.media-preview-list article {
  border: 1px solid #d8e3f0;
  border-radius: 8px;
  background: #fff;
  min-height: 116px;
  padding: 6px;
  display: grid;
  gap: 5px;
  align-content: start;
}

.media-preview-list img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
  background: #edf3fa;
}

.media-preview-list span {
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  background: #edf3fa;
  color: #607893;
}

.media-preview-list small {
  color: #607893;
  overflow-wrap: anywhere;
}

.form-actions {
  justify-content: flex-end;
  padding-top: 4px;
}

@media (max-width: 1024px) {
  .manager-toolbar,
  .upload-panel {
    flex-direction: column;
  }
}

@media (max-width: 860px) {
  .toolbar-actions > *,
  .filters > *,
  .upload-row > * {
    width: 100%;
  }

  .dynamic-form {
    grid-template-columns: 1fr;
  }
}
</style>

