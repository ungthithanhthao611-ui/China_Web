<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'

import {
  createAdminEntityRecord,
  deleteAdminEntityRecord,
  listAdminEntityRecords,
  updateAdminEntityRecord,
  uploadAdminMediaAsset,
} from '@/views/admin/shared/api/adminApi.js'
import { env } from '@/shared/config/env'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const GALLERY_GROUP_OPTIONS = [
  { value: 'left_gallery', label: 'Gallery trái' },
  { value: 'right_gallery', label: 'Gallery phải' },
]

const loading = ref(false)
const savingProject = ref(false)
const deletingProject = ref(false)
const savingProductMapping = ref(false)
const deletingProductMappingId = ref(null)
const recentlySavedProductMappingId = ref(null)
const savingGallery = ref(false)
const deletingGalleryId = ref(null)
const uploadingCover = ref(false)
const uploadingGallery = ref(false)

const projectSearch = ref('')
const selectedProjectId = ref('')
const projects = ref([])
const products = ref([])
const projectProducts = ref([])
const mediaAssets = ref([])
const galleryBindings = ref([])
const languages = ref([])
const productMappingRowRefs = ref(new Map())

const projectFormErrors = ref([])
const productFormErrors = ref([])
const galleryFormErrors = ref([])

const projectForm = reactive({
  title: '',
  slug: '',
  summary: '',
  body: '',
  location: '',
  image_id: '',
  language_id: '',
  status: 'published',
  uploadTitle: '',
  uploadAltText: '',
})

const productForm = reactive({
  open: false,
  mode: 'create',
  editingId: null,
  product_id: '',
  sort_order: 10,
  note: '',
})

const galleryForm = reactive({
  open: false,
  mode: 'create',
  editingId: null,
  media_id: '',
  group_name: 'left_gallery',
  sort_order: 10,
  caption: '',
  uploadTitle: '',
  uploadAltText: '',
})

const coverUploadFile = ref(null)
const galleryUploadFile = ref(null)
const isCreatingProject = ref(false)
const currentMode = ref('list') // 'list' | 'edit'
const deletingProjectId = ref(null)

function goToList() {
  currentMode.value = 'list'
  selectedProjectId.value = ''
  resetProjectForm()
}

function goToEdit(project) {
  selectProject(project)
  currentMode.value = 'edit'
}

function goToCreate() {
  startCreateProject()
  currentMode.value = 'edit'
}

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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
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

function resolveMediaUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

const languageOptions = computed(() =>
  [...languages.value].sort((a, b) =>
    String(a.name || a.code || '').localeCompare(String(b.name || b.code || ''), 'vi'),
  ),
)

const mediaMap = computed(() => {
  const map = new Map()
  for (const item of mediaAssets.value) {
    map.set(String(item.id), item)
  }
  return map
})

const productMap = computed(() => {
  const map = new Map()
  for (const item of products.value) {
    map.set(String(item.id), item)
  }
  return map
})

const filteredProjects = computed(() => {
  const keyword = normalizeText(projectSearch.value)
  return [...projects.value]
    .filter((item) => {
      if (!keyword) return true
      return [item.title, item.location, item.slug, item.summary]
        .map((value) => normalizeText(value))
        .join(' ')
        .includes(keyword)
    })
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
})

const selectedProject = computed(() =>
  projects.value.find((item) => String(item.id) === String(selectedProjectId.value)) || null,
)

const selectedProjectCover = computed(() => {
  const media = mediaMap.value.get(String(projectForm.image_id || ''))
  return resolveMediaUrl(media?.url || '')
})

const totalProjectsCount = computed(() => projects.value.length)
const totalProductMappingsCount = computed(() => projectProducts.value.length)
const totalGalleryImagesCount = computed(() => 
  galleryBindings.value.filter(item => String(item.entity_type) === 'project').length
)

function getProjectCoverThumb(projectId) {
  const p = projects.value.find(item => String(item.id) === String(projectId))
  if(!p || !p.image_id) return ''
  const media = mediaMap.value.get(String(p.image_id))
  return resolveMediaUrl(media?.url || '')
}

const selectedProjectProducts = computed(() =>
  [...projectProducts.value]
    .filter((item) => String(item.project_id) === String(selectedProjectId.value))
    .sort((a, b) => {
      const sortDiff = Number(a.sort_order || 0) - Number(b.sort_order || 0)
      if (sortDiff !== 0) return sortDiff
      return Number(a.id || 0) - Number(b.id || 0)
    }),
)

const selectedProjectGallery = computed(() =>
  [...galleryBindings.value]
    .filter((item) => String(item.entity_type) === 'project')
    .filter((item) => String(item.entity_id) === String(selectedProjectId.value))
    .sort((a, b) => {
      const groupDiff = String(a.group_name || '').localeCompare(String(b.group_name || ''))
      if (groupDiff !== 0) return groupDiff
      const sortDiff = Number(a.sort_order || 0) - Number(b.sort_order || 0)
      if (sortDiff !== 0) return sortDiff
      return Number(a.id || 0) - Number(b.id || 0)
    }),
)

const groupedGallery = computed(() =>
  GALLERY_GROUP_OPTIONS.map((group) => ({
    ...group,
    items: selectedProjectGallery.value.filter(
      (item) => String(item.group_name) === String(group.value),
    ),
  })),
)

const selectedProjectProductsCount = computed(() => selectedProjectProducts.value.length)

const selectedProjectProductsSummary = computed(() => {
  if (!selectedProjectId.value) {
    return 'Chọn dự án trước khi tạo mapping Project → Product.'
  }
  if (!selectedProjectProducts.value.length) {
    return 'Chưa có mapping nào. Sau khi lưu, danh sách bên dưới sẽ cập nhật ngay.'
  }
  return `Đang có ${selectedProjectProducts.value.length} sản phẩm được gắn cho dự án này.`
})

const availableProductOptions = computed(() => {
  const usedIds = new Set(
    selectedProjectProducts.value
      .filter((item) =>
        productForm.mode === 'edit'
          ? String(item.id) !== String(productForm.editingId)
          : true,
      )
      .map((item) => String(item.product_id)),
  )

  return [...products.value]
    .filter((item) => !usedIds.has(String(item.id)))
    .sort((a, b) =>
      String(a.name || a.title || '').localeCompare(
        String(b.name || b.title || ''),
        'vi',
      ),
    )
})

const availableGalleryMediaOptions = computed(() => {
  const usedIds = new Set(
    selectedProjectGallery.value
      .filter((item) => String(item.group_name) === String(galleryForm.group_name))
      .filter((item) =>
        galleryForm.mode === 'edit'
          ? String(item.id) !== String(galleryForm.editingId)
          : true,
      )
      .map((item) => String(item.media_id)),
  )

  return [...mediaAssets.value]
    .filter((item) => String(item.asset_type || 'image') === 'image')
    .filter((item) => !usedIds.has(String(item.id)))
    .sort((a, b) =>
      String(a.title || a.alt_text || '').localeCompare(
        String(b.title || b.alt_text || ''),
        'vi',
      ),
    )
})

function languageLabel(language) {
  if (!language) return 'Ngôn ngữ mặc định'
  const name = String(language.name || '').trim()
  const code = String(language.code || '').trim()
  return code ? `${name || code} · ${code}` : name || 'Ngôn ngữ mặc định'
}

function productLabel(product) {
  if (!product) return 'Sản phẩm không tồn tại'
  const name = String(product.name || product.title || '').trim()
  const sku = String(product.sku || '').trim()
  return sku ? `${name} · ${sku}` : name
}

function mediaLabel(media) {
  if (!media) return 'Ảnh không tồn tại'
  return String(media.title || media.alt_text || media.url || `Media #${media.id}`)
}

function groupLabel(groupName) {
  return (
    GALLERY_GROUP_OPTIONS.find((item) => item.value === String(groupName))?.label ||
    String(groupName || '-')
  )
}

function setProductMappingRowRef(mappingId, element) {
  const key = String(mappingId || '')
  const nextMap = new Map(productMappingRowRefs.value)

  if (element) {
    nextMap.set(key, element)
  } else {
    nextMap.delete(key)
  }

  productMappingRowRefs.value = nextMap
}

async function scrollToProductMappingRow(mappingId) {
  await nextTick()
  const target = productMappingRowRefs.value.get(String(mappingId || ''))
  if (!target?.scrollIntoView) return

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  })
}

function resetProjectForm() {
  const defaultLanguageId =
    languageOptions.value[0]?.id || languages.value[0]?.id || 1

  projectForm.title = ''
  projectForm.slug = ''
  projectForm.summary = ''
  projectForm.body = ''
  projectForm.location = ''
  projectForm.image_id = ''
  projectForm.language_id = String(defaultLanguageId || 1)
  projectForm.status = 'published'
  projectForm.uploadTitle = ''
  projectForm.uploadAltText = ''
  coverUploadFile.value = null
  projectFormErrors.value = []
}

function populateProjectForm(record) {
  projectForm.title = String(record?.title || '')
  projectForm.slug = String(record?.slug || '')
  projectForm.summary = String(record?.summary || '')
  projectForm.body = String(record?.body || '')
  projectForm.location = String(record?.location || '')
  projectForm.image_id = record?.image_id ? String(record.image_id) : ''
  projectForm.language_id = String(record?.language_id || languageOptions.value[0]?.id || 1)
  projectForm.status = String(record?.status || 'published')
  projectForm.uploadTitle = ''
  projectForm.uploadAltText = ''
  coverUploadFile.value = null
  projectFormErrors.value = []
}

function startCreateProject() {
  isCreatingProject.value = true
  selectedProjectId.value = ''
  resetProjectForm()
  closeProductForm()
  closeGalleryForm()
}

function selectProject(record) {
  isCreatingProject.value = false
  selectedProjectId.value = String(record.id)
  populateProjectForm(record)
  closeProductForm()
  closeGalleryForm()
}

function validateProjectForm() {
  const errors = []
  const title = String(projectForm.title || '').trim()
  const slug = slugify(projectForm.slug || projectForm.title)

  if (!title) {
    errors.push('Tên dự án là bắt buộc.')
  }
  if (!slug) {
    errors.push('Không thể tạo slug hợp lệ từ tên dự án.')
  }
  if (!projectForm.language_id) {
    errors.push('Ngôn ngữ là bắt buộc để lưu dự án.')
  }

  const duplicate = projects.value.find(
    (item) =>
      String(item.slug || '') === String(slug) &&
      (isCreatingProject.value || String(item.id) !== String(selectedProjectId.value)),
  )

  if (duplicate) {
    errors.push('Slug dự án bị trùng. Vui lòng đổi tên dự án để sinh slug khác.')
  }

  projectFormErrors.value = errors
  return errors.length === 0
}

function buildProjectPayload() {
  const title = String(projectForm.title || '').trim()
  const slug = slugify(projectForm.slug || projectForm.title)
  return {
    title,
    slug,
    summary: String(projectForm.summary || '').trim() || null,
    body: String(projectForm.body || '').trim() || null,
    location: String(projectForm.location || '').trim() || null,
    image_id: projectForm.image_id ? Number(projectForm.image_id) : null,
    language_id: Number(projectForm.language_id || 1),
    status: 'published',
  }
}

function resetProductForm() {
  productForm.mode = 'create'
  productForm.editingId = null
  productForm.product_id = ''
  productForm.sort_order = selectedProjectProducts.value.length
    ? Math.max(...selectedProjectProducts.value.map((item) => Number(item.sort_order || 0))) + 10
    : 10
  productForm.note = ''
  productForm.open = false
  productFormErrors.value = []
}

function openCreateProductForm() {
  if (!selectedProjectId.value) {
    notifyError('Vui lòng lưu hoặc chọn dự án trước khi thêm sản phẩm sử dụng.')
    return
  }
  productForm.mode = 'create'
  productForm.editingId = null
  productForm.product_id = ''
  productForm.sort_order = selectedProjectProducts.value.length
    ? Math.max(...selectedProjectProducts.value.map((item) => Number(item.sort_order || 0))) + 10
    : 10
  productForm.note = ''
  productForm.open = true
  productFormErrors.value = []
}

function openEditProductForm(record) {
  productForm.mode = 'edit'
  productForm.editingId = record.id
  productForm.product_id = String(record.product_id)
  productForm.sort_order = Number(record.sort_order || 0)
  productForm.note = String(record.note || '')
  productForm.open = true
  productFormErrors.value = []
}

function closeProductForm() {
  productForm.open = false
  productForm.editingId = null
  productFormErrors.value = []
}

function validateProductForm() {
  const errors = []
  if (!selectedProjectId.value) {
    errors.push('Bạn phải chọn dự án.')
  }
  if (!productForm.product_id) {
    errors.push('Bạn phải chọn sản phẩm.')
  }
  if (!Number.isFinite(Number(productForm.sort_order))) {
    errors.push('Thứ tự hiển thị phải là số hợp lệ.')
  }

  const duplicate = selectedProjectProducts.value.find(
    (item) =>
      String(item.product_id) === String(productForm.product_id) &&
      (productForm.mode === 'create' || String(item.id) !== String(productForm.editingId)),
  )

  if (duplicate) {
    errors.push('Sản phẩm này đã được gắn cho dự án hiện tại.')
  }

  productFormErrors.value = errors
  return errors.length === 0
}

function buildProductPayload() {
  return {
    project_id: Number(selectedProjectId.value),
    product_id: Number(productForm.product_id),
    sort_order: Number(productForm.sort_order || 0),
    note: String(productForm.note || '').trim() || null,
  }
}

function resetGalleryForm() {
  galleryForm.mode = 'create'
  galleryForm.editingId = null
  galleryForm.media_id = ''
  galleryForm.group_name = 'left_gallery'
  galleryForm.sort_order = 10
  galleryForm.caption = ''
  galleryForm.uploadTitle = ''
  galleryForm.uploadAltText = ''
  galleryForm.open = false
  galleryUploadFile.value = null
  galleryFormErrors.value = []
}

function openCreateGalleryForm(groupName = 'left_gallery') {
  if (!selectedProjectId.value) {
    notifyError('Vui lòng lưu hoặc chọn dự án trước khi thêm hình ảnh dự án.')
    return
  }
  galleryForm.mode = 'create'
  galleryForm.editingId = null
  galleryForm.media_id = ''
  galleryForm.group_name = groupName
  const currentGroupItems = selectedProjectGallery.value.filter(
    (item) => String(item.group_name) === String(groupName),
  )
  galleryForm.sort_order = currentGroupItems.length
    ? Math.max(...currentGroupItems.map((item) => Number(item.sort_order || 0))) + 10
    : 10
  galleryForm.caption = ''
  galleryForm.uploadTitle = ''
  galleryForm.uploadAltText = ''
  galleryForm.open = true
  galleryUploadFile.value = null
  galleryFormErrors.value = []
}

function openEditGalleryForm(record) {
  galleryForm.mode = 'edit'
  galleryForm.editingId = record.id
  galleryForm.media_id = String(record.media_id)
  galleryForm.group_name = String(record.group_name || 'left_gallery')
  galleryForm.sort_order = Number(record.sort_order || 0)
  galleryForm.caption = String(record.caption || '')
  galleryForm.uploadTitle = ''
  galleryForm.uploadAltText = ''
  galleryForm.open = true
  galleryUploadFile.value = null
  galleryFormErrors.value = []
}

function closeGalleryForm() {
  galleryForm.open = false
  galleryForm.editingId = null
  galleryUploadFile.value = null
  galleryFormErrors.value = []
}

function validateGalleryForm() {
  const errors = []
  if (!selectedProjectId.value) {
    errors.push('Bạn phải chọn dự án.')
  }
  if (!galleryForm.media_id) {
    errors.push('Bạn phải chọn ảnh gallery.')
  }
  if (!galleryForm.group_name) {
    errors.push('Bạn phải chọn nhóm gallery.')
  }
  if (!Number.isFinite(Number(galleryForm.sort_order))) {
    errors.push('Thứ tự hiển thị phải là số hợp lệ.')
  }

  const duplicate = selectedProjectGallery.value.find(
    (item) =>
      String(item.group_name) === String(galleryForm.group_name) &&
      String(item.media_id) === String(galleryForm.media_id) &&
      (galleryForm.mode === 'create' || String(item.id) !== String(galleryForm.editingId)),
  )

  if (duplicate) {
    errors.push('Ảnh này đã tồn tại trong nhóm gallery hiện tại.')
  }

  galleryFormErrors.value = errors
  return errors.length === 0
}

function buildGalleryPayload() {
  return {
    entity_type: 'project',
    entity_id: Number(selectedProjectId.value),
    media_id: Number(galleryForm.media_id),
    group_name: String(galleryForm.group_name || 'left_gallery'),
    sort_order: Number(galleryForm.sort_order || 0),
    caption: String(galleryForm.caption || '').trim() || null,
  }
}

function onCoverFileSelected(event) {
  coverUploadFile.value = event.target.files?.[0] || null
}

function onGalleryFileSelected(event) {
  galleryUploadFile.value = event.target.files?.[0] || null
}

async function loadProjects() {
  const token = normalizedToken()
  const response = await listAdminEntityRecords('projects', token, {
    skip: 0,
    limit: 100,
  })
  projects.value = response.items || []
}

async function loadProducts() {
  const token = normalizedToken()
  const response = await listAdminEntityRecords('products', token, {
    skip: 0,
    limit: 100,
    status: 'published',
  })
  products.value = response.items || []
}

async function loadProjectProducts() {
  const token = normalizedToken()
  const response = await listAdminEntityRecords('project_products', token, {
    skip: 0,
    limit: 100,
  })
  projectProducts.value = response.items || []
}

async function loadMediaAssets() {
  const token = normalizedToken()
  const response = await listAdminEntityRecords('media_assets', token, {
    skip: 0,
    limit: 100,
    status: 'active',
  })
  mediaAssets.value = response.items || []
}

async function loadGalleryBindings() {
  const token = normalizedToken()
  const response = await listAdminEntityRecords('entity_media', token, {
    skip: 0,
    limit: 100,
  })
  galleryBindings.value = response.items || []
}

async function loadLanguages() {
  const token = normalizedToken()
  const response = await listAdminEntityRecords('languages', token, {
    skip: 0,
    limit: 100,
  })
  languages.value = response.items || []
}

async function refreshAll() {
  const token = normalizedToken()
  if (!token) return

  loading.value = true
  clearNotify()
  try {
    await Promise.all([
      loadProjects(),
      loadProducts(),
      loadProjectProducts(),
      loadMediaAssets(),
      loadGalleryBindings(),
      loadLanguages(),
    ])

    if (!selectedProjectId.value && projects.value.length) {
      selectProject(projects.value[0])
    } else if (selectedProject.value && !isCreatingProject.value) {
      populateProjectForm(selectedProject.value)
    } else if (isCreatingProject.value) {
      resetProjectForm()
    }
  } catch (error) {
    notifyError(error.message || 'Không thể tải dữ liệu quản trị dự án.')
  } finally {
    loading.value = false
  }
}

async function uploadCoverImage() {
  const token = normalizedToken()
  if (!token) return
  if (!coverUploadFile.value) {
    notifyError('Vui lòng chọn file ảnh đại diện trước khi tải lên.')
    return
  }

  uploadingCover.value = true
  clearNotify()
  try {
    const media = await uploadAdminMediaAsset(token, coverUploadFile.value, {
      title: projectForm.uploadTitle || projectForm.title || 'project-cover',
      altText: projectForm.uploadAltText || projectForm.title || 'project-cover',
      assetFolder: 'projects',
      publicIdBase: `${slugify(projectForm.title || 'project')}-cover`,
    })
    projectForm.image_id = String(media.id)
    projectForm.uploadTitle = ''
    projectForm.uploadAltText = ''
    coverUploadFile.value = null
    await loadMediaAssets()
    notifySuccess('Đã tải ảnh đại diện dự án lên thư viện.')
  } catch (error) {
    notifyError(error.message || 'Không thể tải ảnh đại diện dự án.')
  } finally {
    uploadingCover.value = false
  }
}

async function uploadGalleryImage() {
  const token = normalizedToken()
  if (!token) return
  if (!galleryUploadFile.value) {
    notifyError('Vui lòng chọn file ảnh gallery trước khi tải lên.')
    return
  }

  uploadingGallery.value = true
  clearNotify()
  try {
    const media = await uploadAdminMediaAsset(token, galleryUploadFile.value, {
      title: galleryForm.uploadTitle || projectForm.title || 'project-gallery',
      altText: galleryForm.uploadAltText || projectForm.title || 'project-gallery',
      assetFolder: 'projects',
      publicIdBase: `${slugify(projectForm.title || 'project')}-${galleryForm.group_name}`,
    })
    galleryForm.media_id = String(media.id)
    galleryForm.uploadTitle = ''
    galleryForm.uploadAltText = ''
    galleryUploadFile.value = null
    await loadMediaAssets()
    notifySuccess('Đã tải ảnh gallery lên thư viện và chọn sẵn cho form.')
  } catch (error) {
    notifyError(error.message || 'Không thể tải ảnh gallery lên thư viện.')
  } finally {
    uploadingGallery.value = false
  }
}

async function saveProject() {
  const token = normalizedToken()
  if (!token || !validateProjectForm()) return

  savingProject.value = true
  clearNotify()
  try {
    const payload = buildProjectPayload()
    if (isCreatingProject.value) {
      const created = await createAdminEntityRecord('projects', payload, token)
      await loadProjects()
      isCreatingProject.value = false
      selectedProjectId.value = String(created.id)
      populateProjectForm(created)
      notifySuccess('Đã tạo dự án mới.')
    } else {
      const updated = await updateAdminEntityRecord('projects', selectedProjectId.value, payload, token)
      await loadProjects()
      populateProjectForm(updated)
      notifySuccess('Đã cập nhật thông tin dự án.')
    }
  } catch (error) {
    notifyError(error.message || 'Không thể lưu thông tin dự án.')
  } finally {
    savingProject.value = false
  }
}

async function removeProject() {
  const token = normalizedToken()
  if (!token || !selectedProject.value) return

  const confirmed = window.confirm(
    `Xóa dự án "${selectedProject.value.title}"? Hành động này sẽ xóa luôn mapping sản phẩm và gallery liên quan nếu backend đang cascade.`,
  )
  if (!confirmed) return

  deletingProject.value = true
  clearNotify()
  try {
    await deleteAdminEntityRecord('projects', selectedProject.value.id, token)
    const deletedId = String(selectedProject.value.id)
    await Promise.all([loadProjects(), loadProjectProducts(), loadGalleryBindings()])
    notifySuccess('Đã xóa dự án.')
    if (projects.value.length) {
      const nextProject = projects.value.find((item) => String(item.id) !== deletedId) || projects.value[0]
      if (nextProject) {
        selectProject(nextProject)
      }
    } else {
      startCreateProject()
    }
  } catch (error) {
    notifyError(error.message || 'Không thể xóa dự án.')
  } finally {
    deletingProject.value = false
  }
}

async function saveProductMapping() {
  const token = normalizedToken()
  if (!token || !validateProductForm()) return

  savingProductMapping.value = true
  clearNotify()
  try {
    const payload = buildProductPayload()
    const isCreateMode = productForm.mode === 'create'
    const savedRecord = isCreateMode
      ? await createAdminEntityRecord('project_products', payload, token)
      : await updateAdminEntityRecord('project_products', productForm.editingId, payload, token)

    await loadProjectProducts()
    recentlySavedProductMappingId.value = String(savedRecord.id)
    closeProductForm()
    await scrollToProductMappingRow(savedRecord.id)

    const productName = productLabel(productMap.value.get(String(savedRecord.product_id)))
    notifySuccess(
      isCreateMode
        ? `Đã thêm sản phẩm "${productName}" và cập nhật danh sách ngay bên dưới.`
        : `Đã cập nhật sản phẩm "${productName}" và làm mới danh sách thành công.`,
    )

    window.setTimeout(() => {
      if (String(recentlySavedProductMappingId.value) === String(savedRecord.id)) {
        recentlySavedProductMappingId.value = null
      }
    }, 3000)
  } catch (error) {
    notifyError(error.message || 'Không thể lưu sản phẩm sử dụng.')
  } finally {
    savingProductMapping.value = false
  }
}

async function removeProductMapping(record) {
  const token = normalizedToken()
  if (!token) return
  const confirmed = window.confirm(
    `Xóa sản phẩm "${productLabel(productMap.value.get(String(record.product_id)))}" khỏi dự án hiện tại?`,
  )
  if (!confirmed) return

  deletingProductMappingId.value = record.id
  clearNotify()
  try {
    await deleteAdminEntityRecord('project_products', record.id, token)
    await loadProjectProducts()
    if (String(recentlySavedProductMappingId.value) === String(record.id)) {
      recentlySavedProductMappingId.value = null
    }
    notifySuccess('Đã xóa sản phẩm khỏi dự án và làm mới danh sách.')
    if (String(productForm.editingId) === String(record.id)) {
      closeProductForm()
    }
  } catch (error) {
    notifyError(error.message || 'Không thể xóa sản phẩm khỏi dự án.')
  } finally {
    deletingProductMappingId.value = null
  }
}

async function saveGalleryBinding() {
  const token = normalizedToken()
  if (!token || !validateGalleryForm()) return

  savingGallery.value = true
  clearNotify()
  try {
    const payload = buildGalleryPayload()
    if (galleryForm.mode === 'create') {
      await createAdminEntityRecord('entity_media', payload, token)
      notifySuccess('Đã thêm ảnh vào gallery dự án.')
    } else {
      await updateAdminEntityRecord('entity_media', galleryForm.editingId, payload, token)
      notifySuccess('Đã cập nhật ảnh gallery dự án.')
    }
    await loadGalleryBindings()
    closeGalleryForm()
  } catch (error) {
    notifyError(error.message || 'Không thể lưu hình ảnh dự án.')
  } finally {
    savingGallery.value = false
  }
}

async function removeGalleryBinding(record) {
  const token = normalizedToken()
  if (!token) return
  const confirmed = window.confirm(
    `Xóa ảnh này khỏi ${groupLabel(record.group_name)} của dự án hiện tại?`,
  )
  if (!confirmed) return

  deletingGalleryId.value = record.id
  clearNotify()
  try {
    await deleteAdminEntityRecord('entity_media', record.id, token)
    await loadGalleryBindings()
    notifySuccess('Đã xóa ảnh khỏi gallery dự án.')
    if (String(galleryForm.editingId) === String(record.id)) {
      closeGalleryForm()
    }
  } catch (error) {
    notifyError(error.message || 'Không thể xóa ảnh khỏi gallery dự án.')
  } finally {
    deletingGalleryId.value = null
  }
}

watch(
  () => props.active,
  async (active) => {
    if (active && normalizedToken()) {
      await refreshAll()
      return
    }
    closeProductForm()
    closeGalleryForm()
  },
  { immediate: true },
)

watch(
  () => props.token,
  async (token) => {
    if (String(token || '').trim() && props.active) {
      await refreshAll()
    }
  },
)
</script>

<template>
  <section class="projects-workbench">
    <header class="workbench-hero panel panel-gradient">
      <div class="hero-content-wrapper">
        <div class="hero-titles">
          <p class="eyebrow">Projects Admin Workbench</p>
          <h2>Quản trị dự án all-in-one</h2>
          <p class="subtext">
            Một màn hình duy nhất để editor quản lý thông tin dự án, sản phẩm sử dụng và
            gallery hình ảnh dự án mà không phải chuyển qua nhiều module rời rạc.
          </p>
        </div>
        
        <div class="hero-stats">
          <div class="stat-card">
            <span>Tổng dự án</span>
            <strong>{{ totalProjectsCount }}</strong>
          </div>
          <div class="stat-card">
            <span>Lượt dùng SP</span>
            <strong>{{ totalProductMappingsCount }}</strong>
          </div>
          <div class="stat-card">
            <span>Ảnh & Gallery</span>
            <strong>{{ totalGalleryImagesCount }}</strong>
          </div>
        </div>
      </div>
      <div class="hero-actions">
        <button type="button" class="btn btn-secondary" :disabled="loading" @click="refreshAll">
          {{ loading ? 'Đang tải...' : 'Làm mới dữ liệu' }}
        </button>
        <button v-if="currentMode === 'list'" type="button" class="btn btn-primary" @click="goToCreate">
          Tạo dự án mới
        </button>
        <button v-else type="button" class="btn btn-secondary" @click="goToList">
          Quay lại danh sách
        </button>
      </div>
    </header>

    <div v-if="currentMode === 'list'" class="panel section-card panel-list-view">
      <div class="section-head">
        <div>
          <h3>Tất cả dự án</h3>
          <p class="section-subtext">Nhấp vào "Sửa" để vào chế độ quản lý thông tin, sản phẩm và gallery của dự án đó.</p>
        </div>
        <label class="field-block field-block-search">
          <input
            v-model="projectSearch"
            type="search"
            placeholder="Tìm theo tên, địa điểm, slug..."
          />
        </label>
      </div>

      <div class="table-wrap projects-main-table">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 80px">ID</th>
              <th style="width: 70px">Ảnh</th>
              <th>Tên dự án</th>
              <th>Địa điểm</th>
              <th>Slug</th>
              <th style="width: 140px">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!filteredProjects.length">
              <td colspan="6" class="empty-state text-center">Không tìm thấy dự án nào.</td>
            </tr>
            <tr v-for="project in filteredProjects" :key="project.id">
              <td>#{{ project.id }}</td>
              <td>
                <div class="table-thumb">
                  <img v-if="getProjectCoverThumb(project.id)" :src="getProjectCoverThumb(project.id)" alt="thumb" />
                  <div v-else class="thumb-placeholder-small"></div>
                </div>
              </td>
              <td class="font-bold">{{ project.title }}</td>
              <td>{{ project.location || '-' }}</td>
              <td><small>{{ project.slug }}</small></td>
              <td>
                <div class="row-actions">
                  <button type="button" class="btn btn-primary btn-sm" @click="goToEdit(project)">Sửa chi tiết</button>
                  <button type="button" class="btn btn-danger btn-sm" :disabled="deletingProjectId === project.id" @click="deleteProject(project.id)">
                    {{ deletingProjectId === project.id ? 'Đang xóa...' : 'Xóa' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="workbench-layout">
      <aside class="projects-sidebar panel">
        <div class="sidebar-head">
          <div>
            <p class="eyebrow">Danh sách dự án</p>
            <h3>{{ projects.length }} dự án</h3>
          </div>
        </div>

        <label class="field-block">
          <span>Tìm dự án</span>
          <input
            v-model="projectSearch"
            type="search"
            placeholder="Nhập tên dự án, địa điểm, slug..."
          />
        </label>

        <div class="project-list">
          <button
            type="button"
            class="project-list-item project-list-item--create"
            :class="{ 'is-active': isCreatingProject }"
            @click="startCreateProject"
          >
            <div class="project-list-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            <div class="project-list-info">
              <strong>Thêm dự án mới</strong>
              <span>Tạo bản ghi trống</span>
            </div>
          </button>

          <button
            v-for="project in filteredProjects"
            :key="project.id"
            type="button"
            class="project-list-item"
            :class="{ 'is-active': !isCreatingProject && String(project.id) === String(selectedProjectId) }"
            @click="selectProject(project)"
          >
            <div class="project-list-thumb">
              <img v-if="getProjectCoverThumb(project.id)" :src="getProjectCoverThumb(project.id)" :alt="project.title" />
              <div v-else class="thumb-placeholder"></div>
            </div>
            <div class="project-list-info">
              <strong>{{ project.title }}</strong>
              <span>{{ project.location || 'Chưa định vị' }}</span>
              <small>{{ project.slug || 'no-slug' }}</small>
            </div>
          </button>
        </div>
      </aside>

      <div class="workbench-main">
        <section class="panel section-card panel-gradient-soft">
          <div class="section-head">
            <div>
              <p class="eyebrow">Project Information</p>
              <h3>
                {{ isCreatingProject ? 'Tạo dự án mới' : selectedProject?.title || 'Thông tin dự án' }}
              </h3>
              <p class="section-subtext">
                Điền các trường đúng requirement: tên dự án, hình ảnh, địa điểm, mô tả.
              </p>
            </div>
            <div class="section-actions">
              <button
                v-if="!isCreatingProject && selectedProject"
                type="button"
                class="btn btn-danger"
                :disabled="deletingProject"
                @click="removeProject"
              >
                {{ deletingProject ? 'Đang xóa...' : 'Xóa dự án' }}
              </button>
            </div>
          </div>

          <ul v-if="projectFormErrors.length" class="error-list">
            <li v-for="error in projectFormErrors" :key="error">{{ error }}</li>
          </ul>

          <div class="project-editor-grid">
            <div class="project-form-grid">
              <label class="field-block field-block--full">
                <span>Tên dự án</span>
                <input v-model="projectForm.title" type="text" placeholder="Ví dụ: Hengtong Building" />
              </label>

              <label class="field-block">
                <span>Địa điểm</span>
                <input v-model="projectForm.location" type="text" placeholder="Ví dụ: Quảng Châu, Trung Quốc" />
              </label>

              <label class="field-block">
                <span>Slug (tự sinh)</span>
                <input :value="slugify(projectForm.slug || projectForm.title)" type="text" readonly />
              </label>

              <label class="field-block field-block--full">
                <span>Mô tả ngắn</span>
                <textarea
                  v-model="projectForm.summary"
                  rows="4"
                  placeholder="Nhập mô tả ngắn cho dự án."
                />
              </label>

              <label class="field-block field-block--full">
                <span>Mô tả chi tiết</span>
                <textarea
                  v-model="projectForm.body"
                  rows="6"
                  placeholder="Nhập mô tả chi tiết cho dự án nếu cần hiển thị ở trang chi tiết."
                />
              </label>

              <label class="field-block">
                <span>Ngôn ngữ</span>
                <select v-model="projectForm.language_id">
                  <option
                    v-for="language in languageOptions"
                    :key="language.id"
                    :value="String(language.id)"
                  >
                    {{ languageLabel(language) }}
                  </option>
                </select>
              </label>


            </div>

            <div class="cover-card panel panel-inner">
              <div class="cover-preview-wrap">
                <img
                  v-if="selectedProjectCover"
                  class="cover-preview"
                  :src="selectedProjectCover"
                  :alt="projectForm.title || 'project-cover'"
                />
                <div v-else class="cover-preview cover-preview--empty">Chưa có ảnh đại diện</div>
              </div>

              <div class="upload-stack">
                <label class="field-block">
                  <span>Tải ảnh đại diện mới</span>
                  <input type="file" accept="image/*" @change="onCoverFileSelected" />
                </label>

                <button
                  type="button"
                  class="btn btn-secondary"
                  :disabled="uploadingCover || !coverUploadFile"
                  @click="uploadCoverImage"
                >
                  {{ uploadingCover ? 'Đang tải ảnh...' : 'Tải ảnh đại diện' }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="isCreatingProject ? resetProjectForm() : populateProjectForm(selectedProject)">
              Hoàn tác thay đổi
            </button>
            <button type="button" class="btn btn-primary" :disabled="savingProject" @click="saveProject">
              {{ savingProject ? 'Đang lưu...' : isCreatingProject ? 'Tạo dự án' : 'Lưu thông tin dự án' }}
            </button>
          </div>
        </section>

        <section class="two-column-grid">
          <section class="panel section-card">
            <div class="section-head">
              <div>
                <p class="eyebrow">Used Products</p>
                <h3>Sản phẩm sử dụng</h3>
                <p class="section-subtext">
                  Gắn các sản phẩm thực tế đã dùng trong dự án hiện tại.
                </p>
              </div>
              <button type="button" class="btn btn-primary" :disabled="!selectedProjectId" @click="openCreateProductForm">
                Thêm sản phẩm
              </button>
            </div>

            <ul v-if="productFormErrors.length" class="error-list">
              <li v-for="error in productFormErrors" :key="error">{{ error }}</li>
            </ul>

            <div v-if="productForm.open" class="inline-form panel panel-inner">
              <div class="inline-form-grid">
                <label class="field-block field-block--full">
                  <span>Sản phẩm</span>
                  <select v-model="productForm.product_id">
                    <option value="">Chọn sản phẩm</option>
                    <option
                      v-for="product in availableProductOptions"
                      :key="product.id"
                      :value="String(product.id)"
                    >
                      {{ productLabel(product) }}
                    </option>
                    <option
                      v-if="productForm.mode === 'edit' && productForm.product_id && !availableProductOptions.some((item) => String(item.id) === String(productForm.product_id))"
                      :value="String(productForm.product_id)"
                    >
                      {{ productLabel(productMap.get(String(productForm.product_id))) }}
                    </option>
                  </select>
                </label>

                <label class="field-block">
                  <span>Thứ tự hiển thị</span>
                  <input v-model.number="productForm.sort_order" type="number" min="0" step="10" />
                </label>

                <label class="field-block field-block--full">
                  <span>Ghi chú ứng dụng</span>
                  <textarea
                    v-model="productForm.note"
                    rows="4"
                    placeholder="Ví dụ: Dùng cho sảnh chính, vách ốp, trần hành lang..."
                  />
                </label>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="closeProductForm">Đóng</button>
                <button type="button" class="btn btn-primary" :disabled="savingProductMapping" @click="saveProductMapping">
                  {{ savingProductMapping ? 'Đang lưu...' : productForm.mode === 'create' ? 'Lưu sản phẩm' : 'Cập nhật' }}
                </button>
              </div>
            </div>

            <div class="product-mapping-summary">
              <span class="product-mapping-summary__count">
                {{ selectedProjectProductsCount }} mapping
              </span>
              <span class="product-mapping-summary__text">
                {{ selectedProjectProductsSummary }}
              </span>
            </div>

            <div v-if="!selectedProjectId" class="empty-state empty-state--neutral">
              Vui lòng chọn hoặc tạo dự án trước khi gắn sản phẩm sử dụng.
            </div>
            <div v-else-if="!selectedProjectProducts.length" class="empty-state empty-state--neutral">
              Dự án này chưa có sản phẩm sử dụng nào. Sau khi bấm <strong>Lưu sản phẩm</strong>,
              bảng bên dưới sẽ xuất hiện ngay.
            </div>
            <div v-else class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Thứ tự</th>
                    <th>Sản phẩm</th>
                    <th>SKU</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in selectedProjectProducts"
                    :key="item.id"
                    :ref="(element) => setProductMappingRowRef(item.id, element)"
                    :class="{
                      'table-row-highlight': String(recentlySavedProductMappingId) === String(item.id),
                    }"
                  >
                    <td>{{ item.sort_order || 0 }}</td>
                    <td>
                      <div class="product-cell">
                        <span>{{ productLabel(productMap.get(String(item.product_id))) }}</span>
                        <span
                          v-if="String(recentlySavedProductMappingId) === String(item.id)"
                          class="updated-badge"
                        >
                          Vừa cập nhật
                        </span>
                      </div>
                    </td>
                    <td>{{ productMap.get(String(item.product_id))?.sku || '-' }}</td>
                    <td>{{ item.note || '-' }}</td>
                    <td>
                      <div class="row-actions">
                        <button type="button" class="btn btn-secondary" @click="openEditProductForm(item)">Sửa</button>
                        <button
                          type="button"
                          class="btn btn-danger"
                          :disabled="deletingProductMappingId === item.id"
                          @click="removeProductMapping(item)"
                        >
                          {{ deletingProductMappingId === item.id ? 'Đang xóa...' : 'Xóa' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section class="panel section-card">
            <div class="section-head">
              <div>
                <p class="eyebrow">Project Gallery</p>
                <h3>Hình ảnh dự án</h3>
                <p class="section-subtext">
                  Quản lý gallery trái / phải cho dự án hiện tại ngay trong cùng một màn hình.
                </p>
              </div>
            </div>

            <ul v-if="galleryFormErrors.length" class="error-list">
              <li v-for="error in galleryFormErrors" :key="error">{{ error }}</li>
            </ul>

            <div v-if="galleryForm.open" class="inline-form panel panel-inner">
              <div class="inline-form-grid">
                <label class="field-block">
                  <span>Nhóm gallery</span>
                  <select v-model="galleryForm.group_name">
                    <option v-for="option in GALLERY_GROUP_OPTIONS" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </label>

                <label class="field-block">
                  <span>Thứ tự hiển thị</span>
                  <input v-model.number="galleryForm.sort_order" type="number" min="0" step="10" />
                </label>

                <label class="field-block field-block--full">
                  <span>Ảnh từ thư viện</span>
                  <select v-model="galleryForm.media_id">
                    <option value="">Chọn ảnh</option>
                    <option
                      v-for="media in availableGalleryMediaOptions"
                      :key="media.id"
                      :value="String(media.id)"
                    >
                      {{ mediaLabel(media) }}
                    </option>
                    <option
                      v-if="galleryForm.mode === 'edit' && galleryForm.media_id && !availableGalleryMediaOptions.some((item) => String(item.id) === String(galleryForm.media_id))"
                      :value="String(galleryForm.media_id)"
                    >
                      {{ mediaLabel(mediaMap.get(String(galleryForm.media_id))) }}
                    </option>
                  </select>
                </label>

                <label class="field-block field-block--full">
                  <span>Tải ảnh gallery mới</span>
                  <input type="file" accept="image/*" @change="onGalleryFileSelected" />
                </label>



                <div class="field-block field-block--full">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    :disabled="uploadingGallery || !galleryUploadFile"
                    @click="uploadGalleryImage"
                  >
                    {{ uploadingGallery ? 'Đang tải ảnh...' : 'Tải ảnh gallery & chọn ngay' }}
                  </button>
                </div>

                <label class="field-block field-block--full">
                  <span>Caption</span>
                  <textarea
                    v-model="galleryForm.caption"
                    rows="3"
                    placeholder="Ghi chú ngắn cho ảnh nếu cần hiển thị sau này."
                  />
                </label>
              </div>

              <div v-if="galleryForm.media_id" class="gallery-preview-card">
                <img
                  v-if="resolveMediaUrl(mediaMap.get(String(galleryForm.media_id))?.url)"
                  :src="resolveMediaUrl(mediaMap.get(String(galleryForm.media_id))?.url)"
                  :alt="mediaLabel(mediaMap.get(String(galleryForm.media_id)))"
                />
                <div>
                  <strong>{{ mediaLabel(mediaMap.get(String(galleryForm.media_id))) }}</strong>
                  <p>{{ mediaMap.get(String(galleryForm.media_id))?.url || '-' }}</p>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="closeGalleryForm">Đóng</button>
                <button type="button" class="btn btn-primary" :disabled="savingGallery" @click="saveGalleryBinding">
                  {{ savingGallery ? 'Đang lưu...' : galleryForm.mode === 'create' ? 'Lưu ảnh gallery' : 'Cập nhật' }}
                </button>
              </div>
            </div>

            <div v-if="!selectedProjectId" class="empty-state">
              Vui lòng chọn hoặc tạo dự án trước khi thêm hình ảnh dự án.
            </div>
            <div v-else class="gallery-groups">
              <section v-for="group in groupedGallery" :key="group.value" class="gallery-group panel panel-inner">
                <div class="panel-head">
                  <div>
                    <p class="eyebrow">{{ group.label }}</p>
                    <h4>{{ group.items.length }} ảnh</h4>
                  </div>
                  <button type="button" class="btn btn-primary" @click="openCreateGalleryForm(group.value)">
                    Thêm ảnh
                  </button>
                </div>

                <div v-if="!group.items.length" class="empty-state empty-state--small">
                  Chưa có ảnh nào trong {{ group.label.toLowerCase() }}.
                </div>
                <div v-else class="gallery-cards">
                  <article v-for="item in group.items" :key="item.id" class="gallery-card">
                    <img
                      v-if="resolveMediaUrl(mediaMap.get(String(item.media_id))?.url)"
                      class="gallery-thumb"
                      :src="resolveMediaUrl(mediaMap.get(String(item.media_id))?.url)"
                      :alt="mediaLabel(mediaMap.get(String(item.media_id)))"
                    />
                    <div v-else class="gallery-thumb gallery-thumb--empty">Không có ảnh</div>
                    <div class="gallery-card-body">
                      <strong>{{ mediaLabel(mediaMap.get(String(item.media_id))) }}</strong>
                      <p>STT {{ item.sort_order || 0 }}</p>
                      <p>{{ item.caption || 'Chưa có caption.' }}</p>
                    </div>
                    <div class="row-actions row-actions--end">
                      <button type="button" class="btn btn-secondary" @click="openEditGalleryForm(item)">Sửa</button>
                      <button
                        type="button"
                        class="btn btn-danger"
                        :disabled="deletingGalleryId === item.id"
                        @click="removeGalleryBinding(item)"
                      >
                        {{ deletingGalleryId === item.id ? 'Đang xóa...' : 'Xóa' }}
                      </button>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </section>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.projects-workbench {
  display: grid;
  gap: 22px;
  color: #334155;
}

.panel {
  border-radius: 26px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
  padding: 24px;
}

.panel-gradient {
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.panel-gradient-soft {
  background: linear-gradient(180deg, #ffffff, #f1f5f9);
}

.panel-inner {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  color: #0284c7;
}

.workbench-hero,
.hero-actions,
.section-head,
.section-actions,
.form-actions,
.row-actions,
.panel-head,
.sidebar-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.hero-content-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 20px;
}

.hero-titles {
  max-width: 600px;
}

.hero-stats {
  display: flex;
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 16px 24px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.stat-card span {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  margin-bottom: 6px;
}

.stat-card strong {
  font-size: 28px;
  font-weight: 800;
  color: #0284c7;
  line-height: 1;
}

.workbench-hero {
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
}

.workbench-hero h2,
.section-head h3,
.sidebar-head h3,
.panel-head h4 {
  margin: 0;
  color: #0f172a;
}

.subtext,
.section-subtext,
.gallery-card-body p {
  margin: 8px 0 0;
  color: #475569;
  line-height: 1.6;
}

.btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: wait;
  transform: none;
}

.btn-primary {
  color: #ffffff;
  background: linear-gradient(135deg, #0ea5e9, #22c55e);
}

.btn-secondary {
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
}

.btn-danger {
  color: #fff;
  background: linear-gradient(135deg, #fb7185, #f43f5e);
}

.workbench-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 22px;
}

.workbench-main,
.project-form-grid,
.inline-form-grid,
.gallery-groups,
.gallery-cards,
.two-column-grid {
  display: grid;
  gap: 20px;
}

.two-column-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.project-editor-grid {
  display: grid;
  grid-template-columns: 1.5fr minmax(280px, 0.9fr);
  gap: 20px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-block--full {
  grid-column: 1 / -1;
}

.field-block span {
  color: #475569;
  font-weight: 600;
}

.field-block input,
.field-block select,
.field-block textarea {
  width: 100%;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  padding: 12px 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.field-block input:focus,
.field-block select:focus,
.field-block textarea:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.field-block textarea {
  resize: vertical;
}

.project-list {
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 260px);
  overflow: auto;
  padding-right: 4px;
}

.project-list-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  text-align: left;
  border-radius: 18px;
  border: 1px solid #f1f5f9;
  background: #ffffff;
  color: #334155;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.project-list-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.project-list-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.project-list-info strong {
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.project-list-info span,
.project-list-info small {
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.project-list-info small {
  opacity: 0.8;
}

.project-list-thumb,
.project-list-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.project-list-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e0f2fe, #dcfce7);
}

.project-list-icon {
  color: #0284c7;
}

.project-list-item.is-active {
  border-color: #7dd3fc;
  background: #f0f9ff;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08), inset 0 0 0 1px #7dd3fc;
}

.project-list-item.is-active .project-list-thumb {
  border-color: #bae6fd;
}

.project-list-item--create {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
}

.project-list-item--create:hover {
  background: #f8fafc;
  border-color: #10b981;
}

.project-list-item--create .project-list-icon {
  border: none;
  background: #d1fae5;
  color: #10b981;
}

.cover-card,
.inline-form,
.gallery-group {
  display: grid;
  gap: 16px;
}

.cover-preview-wrap {
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
}

.cover-preview,
.gallery-thumb {
  width: 100%;
  object-fit: cover;
  border-radius: 20px;
  background: #f1f5f9;
}

.cover-preview {
  min-height: 280px;
  max-height: 280px;
}

.cover-preview--empty,
.gallery-thumb--empty,
.empty-state {
  display: grid;
  place-items: center;
  color: #64748b;
}

.upload-stack {
  display: grid;
  gap: 14px;
}

.error-list,
.empty-state {
  margin: 0;
  border-radius: 18px;
  padding: 16px 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.empty-state--small {
  padding: 14px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
 td {
  text-align: left;
  padding: 14px 12px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
  color: #334155;
}

th {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 700;
  background: #f8fafc;
}

.product-mapping-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(16, 185, 129, 0.08));
  border: 1px solid rgba(14, 165, 233, 0.18);
}

.product-mapping-summary__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 96px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #ffffff;
  color: #0369a1;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.product-mapping-summary__text {
  color: #0f172a;
  font-weight: 500;
}

.empty-state--neutral {
  background: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}

.table-row-highlight {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.08), rgba(14, 165, 233, 0.08));
  animation: product-row-flash 2.4s ease;
}

.table-row-highlight td {
  color: #0f172a;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.updated-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #dcfce7, #dbeafe);
  border: 1px solid #86efac;
  color: #166534;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

@keyframes product-row-flash {
  0% {
    background: rgba(16, 185, 129, 0.22);
  }
  100% {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.08), rgba(14, 165, 233, 0.08));
  }
}

.table-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.table-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-placeholder-small {
  width: 100%;
  height: 100%;
  background: #e2e8f0;
}

.font-bold {
  font-weight: 600;
  color: #0f172a;
}

.btn-sm {
  padding: 8px 12px;
  font-size: 12px;
  border-radius: 10px;
}

.field-block-search {
  min-width: 280px;
}

.text-center {
  text-align: center;
}

.gallery-preview-card {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.gallery-preview-card img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.gallery-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gallery-card {
  display: grid;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.gallery-thumb {
  height: 180px;
}

.gallery-card-body strong {
  color: #0f172a;
}

.row-actions--end {
  justify-content: flex-end;
}

@media (max-width: 1280px) {
  .workbench-layout,
  .two-column-grid,
  .project-editor-grid,
  .gallery-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-content-wrapper,
  .hero-stats,
  .hero-actions,
  .section-head,
  .section-actions,
  .form-actions,
  .row-actions,
  .panel-head,
  .sidebar-head,
  .gallery-preview-card {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-card {
    flex: 1;
  }

  .project-list {
    max-height: none;
  }
}
</style>
