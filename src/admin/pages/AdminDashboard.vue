<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ADMIN_TOKEN_STORAGE_KEY, ADMIN_USER_STORAGE_KEY } from '@/admin/constants/auth'
import { ADMIN_SECTION_GROUPS, ADMIN_SECTION_INDEX } from '@/admin/config/entityConfigs'
import { getCurrentAdminUser, listAdminEntityRecords, listNavigationMenus } from '@/admin/services/adminApi'
import { uiState } from '@/utils/uiState'
import EntityManager from './components/entity-manager/EntityManager.vue'
import HonorsManager from './components/honors-manager/HonorsManager.vue'
import NavigationMenusManager from './components/navigation-manager/NavigationMenusManager.vue'
import PostsManager from './components/posts-manager/PostsManager.vue'

const router = useRouter()
const route = useRoute()

const availableSectionKeys = ['dashboard', 'navigation', ...Object.keys(ADMIN_SECTION_INDEX).filter((key) => key !== 'dashboard' && key !== 'navigation')]

function resolveSection(value) {
  return availableSectionKeys.includes(String(value || '')) ? String(value) : 'dashboard'
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
  posts: 0,
  videos: 0,
  honors: 0,
  media_assets: 0,
})

const loadingSummary = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSidebarOpen = ref(false)

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

const statCards = computed(() => [
  {
    key: 'menus',
    title: 'Nav menus',
    value: navMenuCount.value,
    subtitle: 'Header and footer trees',
    tone: 'rose',
  },
  {
    key: 'posts',
    title: 'Posts',
    value: summary.posts,
    subtitle: 'News records',
    tone: 'blue',
  },
  {
    key: 'videos',
    title: 'Videos',
    value: summary.videos,
    subtitle: 'Published video entries',
    tone: 'yellow',
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
  successMessage.value = message
  errorMessage.value = ''
}

function setError(message) {
  errorMessage.value = message
  successMessage.value = ''
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
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
  if (!normalizedToken) {
    return
  }

  loadingSummary.value = true
  try {
    const [me, menus, posts, videos, honors, mediaAssets] = await Promise.all([
      getCurrentAdminUser(normalizedToken),
      listNavigationMenus(normalizedToken),
      listAdminEntityRecords('posts', normalizedToken, { skip: 0, limit: 1 }),
      listAdminEntityRecords('videos', normalizedToken, { skip: 0, limit: 1 }),
      listAdminEntityRecords('honors', normalizedToken, { skip: 0, limit: 1 }),
      listAdminEntityRecords('media_assets', normalizedToken, { skip: 0, limit: 1 }),
    ])

    currentUser.value = me
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(me))
    navMenuCount.value = (menus.items || []).length
    summary.posts = posts.pagination?.total || 0
    summary.videos = videos.pagination?.total || 0
    summary.honors = honors.pagination?.total || 0
    summary.media_assets = mediaAssets.pagination?.total || 0
  } catch (error) {
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
    loadingSummary.value = false
  }
}

async function handleLogout() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  localStorage.removeItem(ADMIN_USER_STORAGE_KEY)
  token.value = ''
  currentUser.value = null
  navMenuCount.value = 0
  summary.posts = 0
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
  (value) => {
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
  window.removeEventListener('resize', handleViewportChange)
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
                {{ child.label }}
              </button>
            </div>
          </div>
        </section>
      </nav>
    </aside>

    <main class="workspace">
      <header class="topbar card-shell">
        <div class="title-panel">
          <button class="sidebar-toggle" type="button" aria-label="Open sidebar" @click="isSidebarOpen = true">
            ?
          </button>
          <div>
            <p class="eyebrow">{{ currentSectionMeta.eyebrow }}</p>
            <h1>{{ currentTitle }}</h1>
            <p>{{ currentBreadcrumb }}</p>
          </div>
        </div>

        <div class="session-panel">
          <div class="session-card">
            <strong>{{ userLabel }}</strong>
            <span>{{ userRole }}</span>
          </div>
          <button class="btn btn-secondary" type="button" @click="loadDashboardSummary" :disabled="loadingSummary">
            {{ loadingSummary ? 'Refreshing...' : 'Refresh' }}
          </button>
          <button class="btn btn-primary" type="button" @click="handleLogout">Logout</button>
        </div>
      </header>

      <div v-if="errorMessage" class="notice error">{{ errorMessage }}</div>
      <div v-else-if="successMessage" class="notice success">{{ successMessage }}</div>

      <section v-if="activeSection === 'dashboard'" class="dashboard-panel">
        <div class="hero-card card-shell">
          <p class="hero-eyebrow">Admin overview</p>
          <h2>Quản lý nội dung theo từng module</h2>
          <p class="hero-copy">
            Chọn đúng module bên trái để quản lý từng loại dữ liệu — Pages, Posts, Projects, Media Library,
            Contacts hoặc Inquiries — và thao tác trực tiếp trên danh sách thật từ database.
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

      <HonorsManager
        v-else-if="activeSection === 'honors'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <PostsManager
        v-else-if="activeSection === 'posts'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <EntityManager
        v-else
        :token="token"
        :entity-key="activeSection"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  background:
    radial-gradient(circle at left top, rgba(117, 197, 232, 0.26), transparent 35%),
    radial-gradient(circle at right bottom, rgba(180, 207, 246, 0.24), transparent 32%),
    #edf3fa;
}

.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 272px minmax(0, 1fr);
  align-items: start;
}

.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  background: linear-gradient(180deg, #23344c 0%, #2b4463 100%);
  color: #fff;
  padding: 20px 18px 24px;
  box-shadow: 12px 0 24px rgba(21, 39, 64, 0.12);
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
}

.brand-kicker {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: rgba(235, 245, 255, 0.78);
}

.sidebar h2 {
  margin: 6px 0 0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 42px;
  line-height: 0.95;
}

.nav-groups {
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.nav-group-title {
  margin: 0 0 8px;
  color: rgba(215, 230, 250, 0.76);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.nav-item {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 11px 12px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #f7fbff;
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(164, 208, 234, 0.28);
}

.nav-item.active-parent {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(164, 208, 234, 0.28);
}

.nav-item.active {
  background: linear-gradient(135deg, #2fa8da 0%, #4dc2ee 100%);
  border-color: rgba(255, 255, 255, 0.16);
}

.nav-subitems {
  margin: -2px 0 6px;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.nav-subitem {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(240, 248, 255, 0.94);
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.nav-subitem:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(164, 208, 234, 0.22);
}

.nav-subitem.active {
  background: rgba(77, 194, 238, 0.24);
  border-color: rgba(77, 194, 238, 0.45);
  color: #ffffff;
}

.workspace {
  padding: 18px;
}

.card-shell {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #d9e7f4;
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(26, 52, 84, 0.08);
}

.topbar {
  min-height: 106px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
}

.title-panel {
  display: flex;
  align-items: center;
  gap: 14px;
}

.eyebrow {
  margin: 0;
  color: #5f7e9f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 700;
}

.topbar h1 {
  margin: 4px 0 0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(30px, 4vw, 44px);
  line-height: 1;
  color: #1f3850;
}

.topbar p:last-child {
  margin: 8px 0 0;
  color: #67829d;
  font-size: 13px;
}

.session-panel {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.session-card {
  min-width: 160px;
  padding: 10px 12px;
  border: 1px solid #d7e3ef;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-card strong {
  color: #244260;
  font-size: 14px;
}

.session-card span {
  color: #68819a;
  font-size: 12px;
  text-transform: capitalize;
}

.btn {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary {
  border-color: #2ca9d9;
  background: linear-gradient(135deg, #30a9dc 0%, #4ac0ec 100%);
  color: #fff;
}

.btn-secondary {
  border-color: #c8d8ea;
  background: #f2f6fc;
  color: #335171;
}

.btn-secondary:hover {
  background: #e8f0fa;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(34, 146, 190, 0.22);
}

.notice {
  margin: 12px 0 0;
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 10px 12px;
  font-size: 13px;
}

.notice.error {
  background: #ffecef;
  border-color: #f4bfca;
  color: #a73447;
}

.notice.success {
  background: #e9f9ee;
  border-color: #bde7ca;
  color: #1d7740;
}

.dashboard-panel {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero-card {
  padding: 18px 20px;
}

.hero-eyebrow {
  margin: 0;
  color: #5f7e9f;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  font-weight: 700;
}

.hero-card h2 {
  margin: 8px 0 0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(24px, 3vw, 34px);
  color: #1f3850;
}

.hero-copy {
  max-width: 780px;
  margin: 10px 0 0;
  color: #567089;
  font-size: 14px;
  line-height: 1.6;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
  color: #fff;
  min-height: 112px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 18px 36px rgba(26, 52, 84, 0.16);
}

.stat-card::after {
  content: '';
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 999px;
  top: -20px;
  right: -24px;
  background: rgba(255, 255, 255, 0.17);
}

.tone-cyan {
  background: linear-gradient(135deg, #36b3dc 0%, #52c3e9 100%);
}

.tone-blue {
  background: linear-gradient(135deg, #49a8e1 0%, #5cbef0 100%);
}

.tone-yellow {
  background: linear-gradient(135deg, #e8bb1a 0%, #f4cd36 100%);
}

.tone-rose {
  background: linear-gradient(135deg, #e46c75 0%, #ef8f95 100%);
}

.stat-value {
  margin: 0;
  font-size: 40px;
  line-height: 1;
  font-weight: 700;
}

.stat-title {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 700;
}

.stat-sub {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.92;
}

button:disabled {
  opacity: 0.56;
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
    grid-template-columns: 1fr;
  }

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(18, 33, 54, 0.42);
    z-index: 50;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: min(320px, 84vw);
    height: 100vh;
    overflow-y: auto;
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
    height: 40px;
    border: 1px solid #d7e3ef;
    border-radius: 8px;
    background: #fff;
    color: #244260;
    font-size: 18px;
    cursor: pointer;
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
  }

  .session-panel {
    justify-content: stretch;
  }

  .session-card,
  .session-panel .btn {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .topbar h1 {
    font-size: 28px;
  }
}
</style>
