<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ADMIN_TOKEN_STORAGE_KEY, ADMIN_USER_STORAGE_KEY } from '@/views/admin/shared/constants/auth'
import { ADMIN_SECTION_GROUPS, ADMIN_SECTION_INDEX } from '@/views/admin/shared/config/entityConfigs'
import { getCurrentAdminUser, listAdminEntityRecords, listNavigationMenus } from '@/views/admin/shared/api/adminApi.js'
import { uiState } from '@/shared/utils/uiState'

import AboutManager from '@/views/admin/features/about/pages/AboutManager.vue'
import ContactsManager from '@/views/admin/features/contacts/pages/ContactsManager.vue'
import InquiriesManager from '@/views/admin/features/contacts/pages/InquiriesManager.vue'
import ProductsManager from '@/views/admin/features/products/pages/ProductsManager.vue'
import CategoriesManager from '@/views/admin/features/products/pages/CategoriesManager.vue'
import VideosManager from '@/views/admin/features/products/pages/VideosManager.vue'
import ProjectsManager from '@/views/admin/features/projects/pages/ProjectsManager.vue'

import BannersManager from '@/views/admin/features/system/pages/BannersManager.vue'
import SiteSettingsManager from '@/views/admin/features/system/pages/SiteSettingsManager.vue'
import MediaAssetsManager from '@/views/admin/features/system/pages/MediaAssetsManager.vue'
import HonorsManager from '@/views/admin/features/honors/pages/HonorsManager.vue'
import CapabilitySettingsManager from '@/views/admin/features/honors/pages/CapabilitySettingsManager.vue'
import NavigationMenusManager from '@/views/admin/features/navigation/pages/NavigationMenusManager.vue'
import NewsManager from '@/views/admin/features/news/pages/NewsManager.vue'


const router = useRouter()
const route = useRoute()

const availableSectionKeys = ['dashboard', 'navigation', ...Object.keys(ADMIN_SECTION_INDEX).filter((key) => key !== 'dashboard' && key !== 'navigation')]
const LEGACY_SECTION_REDIRECTS = {
  project_products: 'projects',
  entity_media: 'projects',
}

function resolveSection(value) {
  const normalized = String(value || '').trim()
  const redirected = LEGACY_SECTION_REDIRECTS[normalized] || normalized
  return availableSectionKeys.includes(redirected) ? redirected : 'dashboard'
}

function readStoredUser() {
  try {
    const value = localStorage.getItem(ADMIN_USER_STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

const token = ref(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '')
const currentUser = ref(readStoredUser())
const activeSection = ref(resolveSection(route.query.section))
const navigationManagerRef = ref(null)
const navMenuCount = ref(0)
const summary = reactive({
  videos: 0,
  honors: 0,
  products: 0,
  media_assets: 0,
})

const loadingSummary = ref(false)
const isSidebarOpen = ref(false)
const toast = reactive({
  visible: false,
  type: 'success',
  message: '',
})
let toastTimerId = null
let isDashboardAlive = true
let dashboardSummaryRequestId = 0

const currentSectionMeta = computed(() => {
  if (activeSection.value === 'dashboard') {
    return {
      label: 'Dashboard',
      eyebrow: 'Admin overview',
      description: 'Review the current CMS footprint and jump into the module you need to edit.',
    }
  }

  if (activeSection.value === 'navigation') {
    return {
      label: 'Menu Navigation',
      eyebrow: 'Navigation menus',
      description: 'Manage header and footer menu trees, labels, links, and ordering.',
    }
  }

  const config = ADMIN_SECTION_INDEX[activeSection.value]
  return {
    label: config?.label || 'Dashboard',
    eyebrow: config?.eyebrow || 'Admin module',
    description: config?.description || '',
  }
})

const currentTitle = computed(() => currentSectionMeta.value.label)
const currentBreadcrumb = computed(() => `Home / Admin / ${currentSectionMeta.value.label}`)
const userLabel = computed(() => currentUser.value?.full_name || currentUser.value?.username || 'Admin user')
const userRole = computed(() => currentUser.value?.role || 'admin')
const isUnsupportedSection = computed(() => false) // All sections are now supported
const unsupportedSectionMeta = computed(() => null)


const statCards = computed(() => [
  {
    key: 'menus',
    title: 'Nav menus',
    value: navMenuCount.value,
    subtitle: 'Header and footer trees',
    tone: 'rose',
  },
  {
    key: 'videos',
    title: 'Videos',
    value: summary.videos,
    subtitle: 'Published video entries',
    tone: 'yellow',
  },
  {
    key: 'products',
    title: 'Sản phẩm',
    value: summary.products,
    subtitle: 'Tổng số sản phẩm',
    tone: 'rose',
  },
  {
    key: 'honors',
    title: 'Honors',
    value: summary.honors,
    subtitle: 'Certificates and awards',
    tone: 'cyan',
  },
  {
    key: 'media_assets',
    title: 'Media assets',
    value: summary.media_assets,
    subtitle: 'Uploaded library items',
    tone: 'cyan',
  },
])

function setSuccess(message) {
  showToast('success', message)
}

function setError(message) {
  showToast('error', message)
}

function clearMessages() {
  clearToast()
}

function showToast(type, message) {
  const normalized = String(message || '').trim()
  if (!normalized) {
    clearToast()
    return
  }

  toast.type = type === 'error' ? 'error' : 'success'
  toast.message = normalized
  toast.visible = true

  if (toastTimerId) {
    clearTimeout(toastTimerId)
  }

  toastTimerId = setTimeout(() => {
    toast.visible = false
  }, 3200)
}

function clearToast() {
  toast.visible = false
  toast.message = ''
  if (toastTimerId) {
    clearTimeout(toastTimerId)
    toastTimerId = null
  }
}

function closeSidebar() {
  isSidebarOpen.value = false
}

function handleSectionChange(section) {
  clearMessages()
  activeSection.value = section
  if (window.innerWidth <= 1024) {
    closeSidebar()
  }
}

function hasActiveChild(item) {
  return Array.isArray(item?.children) && item.children.some((child) => String(child?.key || '') === activeSection.value)
}

function isGroupItemExpanded(item) {
  if (!Array.isArray(item?.children) || !item.children.length) {
    return false
  }
  return String(item.key || '') === activeSection.value || hasActiveChild(item)
}

function handleViewportChange() {
  if (window.innerWidth > 1024) {
    closeSidebar()
  }
}

async function loadDashboardSummary() {
  const normalizedToken = String(token.value || '').trim()
  const requestId = ++dashboardSummaryRequestId

  if (!normalizedToken) {
    if (requestId === dashboardSummaryRequestId && isDashboardAlive) {
      loadingSummary.value = false
    }
    return
  }

  loadingSummary.value = true
  try {
    const [me, menus, videos, honors, products, mediaAssets] = await Promise.all([
      getCurrentAdminUser(normalizedToken),
      listNavigationMenus(normalizedToken),
      listAdminEntityRecords('videos', normalizedToken, { skip: 0, limit: 1 }),
      listAdminEntityRecords('honors', normalizedToken, { skip: 0, limit: 1 }),
      listAdminEntityRecords('products', normalizedToken, { skip: 0, limit: 1 }),
      listAdminEntityRecords('media_assets', normalizedToken, { skip: 0, limit: 1 }),
    ])

    if (!isDashboardAlive || requestId !== dashboardSummaryRequestId) {
      return
    }

    currentUser.value = me
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(me))
    navMenuCount.value = (menus.items || []).length
    summary.videos = videos.pagination?.total || 0
    summary.honors = honors.pagination?.total || 0
    summary.products = products.pagination?.total || 0
    summary.media_assets = mediaAssets.pagination?.total || 0
  } catch (error) {
    if (!isDashboardAlive || requestId !== dashboardSummaryRequestId) {
      return
    }

    const message = error?.message || 'Failed to load admin summary.'

    if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('token')) {
      localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
      localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
      token.value = ''
      currentUser.value = null
      await router.replace({ name: 'AdminLogin' })
      return
    }

    setError(message)
  } finally {
    if (isDashboardAlive && requestId === dashboardSummaryRequestId) {
      loadingSummary.value = false
    }
  }
}

async function handleLogout() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
  token.value = ''
  currentUser.value = null
  navMenuCount.value = 0
  summary.videos = 0
  summary.honors = 0
  summary.media_assets = 0
  clearMessages()
  await router.replace({ name: 'AdminLogin' })
}

watch(activeSection, async (section) => {
  const nextQuery = { ...route.query }
  if (section === 'dashboard') {
    delete nextQuery.section
  } else {
    nextQuery.section = section
  }

  if (String(route.query.section || '') !== String(nextQuery.section || '')) {
    router.replace({ query: nextQuery })
  }

  if (section === 'dashboard' && token.value.trim()) {
    await loadDashboardSummary()
  }

  if (section === 'navigation' && token.value.trim()) {
    await nextTick()
    await navigationManagerRef.value?.refreshAll?.()
  }
})

watch(
  () => route.query.section,
  async (value) => {
    const rawSection = String(value || '').trim()
    const redirectedSection = LEGACY_SECTION_REDIRECTS[rawSection]
    if (redirectedSection && redirectedSection !== rawSection) {
      await router.replace({
        query: {
          ...route.query,
          section: redirectedSection,
        },
      })
      return
    }

    const nextSection = resolveSection(value)
    if (nextSection !== activeSection.value) {
      activeSection.value = nextSection
    }
  }
)

onMounted(async () => {
  uiState.isNavHidden = true
  uiState.isFooterHidden = true
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
  window.addEventListener('resize', handleViewportChange)

  if (!token.value.trim()) {
    await router.replace({ name: 'AdminLogin' })
    return
  }

  await loadDashboardSummary()
})

onBeforeUnmount(() => {
  isDashboardAlive = false
  dashboardSummaryRequestId += 1
  window.removeEventListener('resize', handleViewportChange)
  clearToast()
  uiState.isNavHidden = false
  uiState.isFooterHidden = false
  uiState.isHeaderHidden = false
})
</script>

<template>
  <div class="admin-shell">
    <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="closeSidebar" />

    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="brand-row">
        <div>
          <p class="brand-kicker">China</p>
          <h2>Admin</h2>
        </div>
        <button class="sidebar-close" type="button" aria-label="Close sidebar" @click="closeSidebar">
          ×
        </button>
      </div>

      <nav class="nav-groups" aria-label="Admin sections">
        <section v-for="group in ADMIN_SECTION_GROUPS" :key="group.title" class="nav-group">
          <p class="nav-group-title">{{ group.title }}</p>
          <div v-for="item in group.items" :key="item.key" class="nav-item-shell">
            <button
              type="button"
              class="nav-item"
              :class="{ active: activeSection === item.key, 'active-parent': hasActiveChild(item) }"
              @click="handleSectionChange(item.key)"
            >
              {{ item.label }}
            </button>

            <div v-if="isGroupItemExpanded(item)" class="nav-subitems">
              <button
                v-for="child in item.children"
                :key="child.key"
                type="button"
                class="nav-subitem"
                :class="{ active: activeSection === child.key }"
                @click="handleSectionChange(child.key)"
              >
                - {{ child.label }}
              </button>
            </div>
          </div>
        </section>
      </nav>
    </aside>

    <main class="workspace">
      <header class="topbar card-shell">
        <div class="title-panel">
          <button class="sidebar-toggle" type="button" aria-label="Open sidebar" @click="isSidebarOpen = true">Menu</button>
          <div v-if="activeSection === 'dashboard'">
            <p class="eyebrow">{{ currentSectionMeta.eyebrow }}</p>
            <h1>{{ currentTitle }}</h1>
            <p>{{ currentBreadcrumb }}</p>
          </div>
          <div v-else>
            <!-- Chỉ hiện Breadcrumb khi vào module để tránh 2 cái tiêu đề to đè nhau -->
            <p class="breadcrumb-mini">{{ currentBreadcrumb }}</p>
          </div>
        </div>

        <div class="session-panel">
          <div class="session-card">
            <strong>{{ userLabel }}</strong>
            <span>{{ userRole }}</span>
          </div>
          <button 
            v-if="activeSection === 'dashboard'"
            class="btn btn-secondary" 
            type="button" 
            @click="loadDashboardSummary" 
            :disabled="loadingSummary"
          >
            {{ loadingSummary ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button class="btn btn-primary" type="button" @click="handleLogout">Logout</button>
        </div>
      </header>

      <transition name="toast-pop">
        <div v-if="toast.visible" class="admin-toast" :class="`admin-toast--${toast.type}`" role="status" aria-live="polite">
          {{ toast.message }}
        </div>
      </transition>

      <section v-if="activeSection === 'dashboard'" class="dashboard-panel">
        <div class="hero-card card-shell">
          <p class="hero-eyebrow">Admin overview</p>
          <h2>Manage content by module</h2>
          <p class="hero-copy">
            Choose a module from the sidebar to manage each data type directly from database-backed records.
          </p>
        </div>

        <div class="stats">
          <article v-for="card in statCards" :key="card.key" class="stat-card" :class="`tone-${card.tone}`">
            <p class="stat-value">{{ card.value }}</p>
            <p class="stat-title">{{ card.title }}</p>
            <p class="stat-sub">{{ card.subtitle }}</p>
          </article>
        </div>
      </section>
      <NavigationMenusManager
        v-else-if="activeSection === 'navigation'"
        ref="navigationManagerRef"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <CapabilitySettingsManager
        v-else-if="activeSection === 'capability_settings'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <HonorsManager
        v-else-if="activeSection === 'honors'"
        :token="token"
        :active="true"
        view-mode="honors"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <HonorsManager
        v-else-if="activeSection === 'honor_categories'"
        :token="token"
        :active="true"
        view-mode="categories"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <NewsManager
        v-else-if="activeSection === 'news_posts'"
        :embedded="true"
      />

      <section v-else-if="isUnsupportedSection" class="unsupported-panel card-shell">
        <p class="hero-eyebrow">Module unavailable</p>
        <h2>{{ unsupportedSectionMeta?.title }}</h2>
        <p class="hero-copy">
          {{ unsupportedSectionMeta?.description }}
        </p>
      </section>

      <AboutManager
        v-else-if="activeSection === 'content_block_items'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <ContactsManager
        v-else-if="activeSection === 'contacts'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <InquiriesManager
        v-else-if="activeSection === 'inquiry_submissions'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <ProductsManager
        v-else-if="activeSection === 'products'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <CategoriesManager
        v-else-if="activeSection === 'product_categories'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <VideosManager
        v-else-if="activeSection === 'videos'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <ProjectsManager
        v-else-if="activeSection === 'projects'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />


      <BannersManager
        v-else-if="activeSection === 'banners'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <SiteSettingsManager
        v-else-if="activeSection === 'site_settings'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <MediaAssetsManager
        v-else-if="activeSection === 'media_assets'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />
    </main>
  </div>
</template>
<style scoped>
.admin-shell {
  min-height: 100vh;
  padding-left: var(--admin-sidebar-width);
  width: 100%;
  overflow-x: clip;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--admin-sidebar-width);
  height: 100vh;
  overflow-y: auto;
  padding: var(--admin-sidebar-padding) var(--admin-sidebar-padding) 14px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(10, 24, 45, 0.96) 0%, rgba(16, 39, 68, 0.94) 48%, rgba(20, 52, 88, 0.92) 100%),
    radial-gradient(circle at top right, rgba(88, 163, 255, 0.22), transparent 28%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 14px 0 30px rgba(9, 24, 42, 0.14);
  z-index: 20;
}

.sidebar::-webkit-scrollbar {
  width: 8px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(189, 215, 244, 0.2);
  border-radius: 999px;
}

.sidebar-backdrop,
.sidebar-toggle,
.sidebar-close {
  display: none;
}

.brand-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 4px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-kicker {
  margin: 0;
  color: rgba(220, 233, 249, 0.74);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 10px;
  font-weight: 800;
}

.sidebar h2 {
  margin: 6px 0 0;
  font-size: clamp(28px, 2vw, 32px);
  line-height: 0.92;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #f7fbff;
}

.nav-groups {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-group {
  padding: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(10px);
}

.nav-group-title {
  margin: 0 0 6px;
  color: rgba(209, 226, 248, 0.72);
  font-size: var(--admin-label-size);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 800;
}

.nav-item-shell {
  min-width: 0;
}

.nav-item,
.nav-subitem {
  width: 100%;
  min-width: 0;
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.nav-item {
  margin-bottom: 4px;
  min-height: var(--admin-sidebar-item-height);
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.05);
  color: #f4f8fe;
  font-size: 13px;
  font-weight: 600;
}

.nav-item:hover,
.nav-subitem:hover {
  transform: translateX(2px);
}

.nav-item:hover,
.nav-item.active-parent {
  border-color: rgba(156, 210, 255, 0.16);
  background: rgba(255, 255, 255, 0.09);
}

.nav-item.active {
  border-color: rgba(255, 255, 255, 0.16);
  background: linear-gradient(135deg, rgba(45, 129, 231, 0.9) 0%, rgba(77, 194, 238, 0.92) 100%);
  box-shadow: 0 8px 14px rgba(35, 111, 205, 0.2);
}

.nav-subitems {
  margin: -1px 0 4px;
  padding-left: 10px;
  display: grid;
  gap: 4px;
}

.nav-subitem {
  min-height: 36px;
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.025);
  color: rgba(240, 247, 255, 0.92);
  font-size: 12px;
  font-weight: 500;
}

.nav-subitem:hover {
  border-color: rgba(156, 210, 255, 0.12);
  background: rgba(255, 255, 255, 0.08);
}

.nav-subitem.active {
  color: #fff;
  font-weight: 600;
  border-color: rgba(94, 201, 241, 0.36);
  background: rgba(79, 194, 238, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.workspace {
  min-height: 100vh;
  padding: var(--admin-content-padding);
  min-width: 0;
}

.card-shell {
  position: relative;
  overflow: hidden;
  border-radius: var(--admin-card-radius-lg);
  border: var(--admin-card-border);
  background: var(--admin-card-bg);
  box-shadow:
    var(--admin-card-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.card-shell::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(107, 170, 255, 0.28), rgba(255, 255, 255, 0.95));
  pointer-events: none;
}

.topbar {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.title-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.eyebrow,
.hero-eyebrow {
  margin: 0;
  color: #6a8097;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: var(--admin-label-size);
  font-weight: 800;
}

.topbar h1 {
  margin: 4px 0 0;
  font-size: var(--admin-title-size);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #14304c;
}

.topbar p:last-child {
  margin: 6px 0 0;
  color: #67819b;
  font-size: var(--admin-body-size-sm);
  line-height: 1.55;
}

.session-panel {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.session-panel .btn {
  min-width: 88px;
}

.session-card {
  min-width: 148px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid rgba(212, 225, 239, 0.94);
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.76);
}

.session-card strong {
  color: #21415f;
  font-size: 13px;
}

.session-card span {
  color: #69829b;
  font-size: 11px;
  text-transform: capitalize;
}

.btn,
.sidebar-toggle,
.sidebar-close {
  border-radius: var(--admin-control-radius);
  padding: 0 12px;
  min-height: var(--admin-button-height);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
  white-space: nowrap;
}

.btn:hover:not(:disabled),
.sidebar-toggle:hover,
.sidebar-close:hover {
  transform: translateY(-1px);
}

.btn-primary {
  border-color: rgba(32, 114, 214, 0.22);
  background: linear-gradient(135deg, #1f7ae0 0%, #4fa7ff 100%);
  color: #fff;
  box-shadow: 0 12px 22px rgba(31, 122, 224, 0.2);
}

.btn-secondary,
.sidebar-toggle,
.sidebar-close {
  border-color: rgba(198, 216, 233, 0.95);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 252, 0.96));
  color: #294767;
}

.admin-toast {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 1400;
  max-width: min(460px, calc(100vw - 28px));
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid transparent;
  box-shadow: 0 14px 28px rgba(16, 35, 58, 0.2);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.55;
  backdrop-filter: blur(12px);
}

.admin-toast--success {
  background: rgba(232, 250, 239, 0.96);
  border-color: rgba(167, 224, 186, 0.9);
  color: #176847;
}

.admin-toast--error {
  background: rgba(255, 239, 242, 0.96);
  border-color: rgba(243, 190, 201, 0.9);
  color: #ab3348;
}

.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.dashboard-panel {
  margin-top: var(--admin-section-gap);
  display: flex;
  flex-direction: column;
  gap: var(--admin-section-gap);
}

.hero-card {
  padding: 14px 16px;
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: auto -80px -100px auto;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(79, 167, 255, 0.2), rgba(79, 167, 255, 0));
  pointer-events: none;
}

.hero-card h2 {
  position: relative;
  z-index: 1;
  margin: 6px 0 0;
  max-width: 720px;
  font-size: var(--admin-heading-size);
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: #18324e;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 8px 0 0;
  color: #58718b;
  font-size: 13px;
  line-height: 1.5;
}

.hero-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  margin-top: 18px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  min-height: var(--admin-stat-card-height);
  padding: 12px 14px;
  border-radius: 16px;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 18px rgba(20, 42, 68, 0.12);
}

.stat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.stat-card::after {
  content: '';
  position: absolute;
  width: 84px;
  height: 84px;
  border-radius: 999px;
  top: -20px;
  right: -14px;
  background: rgba(255, 255, 255, 0.14);
}

.tone-cyan {
  background: linear-gradient(135deg, #22a6d6 0%, #4fd3d1 100%);
}

.tone-blue {
  background: linear-gradient(135deg, #3a78ea 0%, #58b0ff 100%);
}

.tone-yellow {
  background: linear-gradient(135deg, #d89a16 0%, #f2c94c 100%);
}

.tone-rose {
  background: linear-gradient(135deg, #d74d78 0%, #f08f84 100%);
}

.stat-value,
.stat-title,
.stat-sub {
  position: relative;
  z-index: 1;
}

.stat-value {
  margin: 0;
  font-size: clamp(22px, 2vw, 30px);
  line-height: 1;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.stat-title {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.stat-sub {
  margin: 4px 0 0;
  font-size: 11px;
  opacity: 0.94;
  line-height: 1.45;
}

button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

@media (max-width: 1280px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .admin-shell {
    padding-left: 0;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(12, 26, 46, 0.44);
    backdrop-filter: blur(6px);
    z-index: 50;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: min(280px, 88vw);
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
    z-index: 60;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close,
  .sidebar-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    padding: 0;
  }
}

@media (max-width: 860px) {
  .workspace {
    padding: 12px;
  }

  .topbar {
    min-height: 0;
    flex-direction: column;
    align-items: stretch;
    padding: 14px;
  }

  .title-panel {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .session-panel {
    display: flex;
    justify-content: stretch;
    width: 100%;
  }

  .session-card {
    width: 100%;
    min-width: 0;
    flex: 1 1 100%;
  }

  .session-panel .btn {
    flex: 1 1 160px;
    min-width: 0;
  }
}

@media (max-width: 640px) {
  .admin-toast {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .topbar h1 {
    font-size: 22px;
  }

  .sidebar {
    width: min(320px, 100vw);
    padding: 14px 10px 16px;
  }

  .brand-row {
    align-items: center;
  }

  .sidebar h2 {
    font-size: 28px;
  }

  .nav-groups {
    margin-top: 16px;
    gap: 12px;
  }

  .nav-item {
    padding: 9px 10px;
    font-size: 12px;
  }

  .nav-subitems {
    padding-left: 10px;
  }

  .topbar {
    padding: 12px;
    gap: 12px;
  }

  .title-panel {
    align-items: flex-start;
  }

  .title-panel > div {
    min-width: 0;
  }

  .session-panel {
    grid-template-columns: 1fr;
  }

  .hero-card {
    padding: 14px;
  }
}

@media (max-width: 420px) {
  .workspace {
    padding: 10px;
  }

  .sidebar {
    width: 100vw;
  }

  .sidebar-close,
  .sidebar-toggle {
    width: 38px;
    height: 38px;
    min-height: 38px;
    font-size: 12px;
  }

  .topbar h1 {
    font-size: 24px;
  }
}

.unsupported-panel {
  display: grid;
  gap: 14px;
  padding: 20px;
}

.unsupported-panel h2 {
  margin: 0;
  color: #15314d;
  font-size: clamp(24px, 2.4vw, 30px);
}
</style>






