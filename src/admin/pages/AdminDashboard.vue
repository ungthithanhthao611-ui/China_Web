<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ADMIN_TOKEN_STORAGE_KEY } from '@/admin/constants/auth'
import { getAdminEntities, listAdminEntityRecords, listNavigationMenus } from '@/admin/services/adminApi'
import { uiState } from '@/utils/uiState'
import NavigationMenusManager from './components/navigation-manager/NavigationMenusManager.vue'

const router = useRouter()
const route = useRoute()

function resolveSection(value) {
  return value === 'navigation' ? 'navigation' : 'dashboard'
}

const token = ref(localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '')
const activeSection = ref(resolveSection(route.query.section))
const entities = ref([])
const selectedEntity = ref('')
const records = ref([])
const pagination = reactive({
  skip: 0,
  limit: 20,
  total: 0,
})
const navMenuCount = ref(0)

const loadingEntities = ref(false)
const loadingRecords = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isSidebarOpen = ref(false)

const selectedEntityLabel = computed(() => selectedEntity.value || 'No entity')
const currentTitle = computed(() => (activeSection.value === 'navigation' ? 'Navigation Menus' : 'Dashboard'))
const currentBreadcrumb = computed(() =>
  activeSection.value === 'navigation' ? 'Home / Admin / Navigation Menus' : 'Home / Admin / Dashboard'
)

const statCards = computed(() => [
  {
    key: 'loaded',
    title: 'Records loaded',
    value: records.value.length,
    subtitle: selectedEntityLabel.value,
    tone: 'cyan',
  },
  {
    key: 'total',
    title: 'Total records',
    value: pagination.total,
    subtitle: 'Current entity',
    tone: 'blue',
  },
  {
    key: 'entities',
    title: 'Entities',
    value: entities.value.length,
    subtitle: 'Admin registry',
    tone: 'yellow',
  },
  {
    key: 'menus',
    title: 'Nav menus',
    value: navMenuCount.value,
    subtitle: activeSection.value === 'navigation' ? 'Navigation manager' : 'From backend',
    tone: 'rose',
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
  activeSection.value = section
  if (window.innerWidth <= 1024) {
    closeSidebar()
  }
}

function handleViewportChange() {
  if (window.innerWidth > 1024) {
    closeSidebar()
  }
}

async function loadEntities() {
  const normalizedToken = token.value.trim()
  if (!normalizedToken) {
    setError('Please provide admin token first.')
    return
  }

  loadingEntities.value = true
  try {
    const response = await getAdminEntities(normalizedToken)
    entities.value = response.entities || []
    if (entities.value.length && !selectedEntity.value) {
      selectedEntity.value = entities.value[0]
    }
  } finally {
    loadingEntities.value = false
  }
}

async function loadRecords() {
  const normalizedToken = token.value.trim()
  if (!normalizedToken || !selectedEntity.value) {
    records.value = []
    pagination.total = 0
    return
  }

  loadingRecords.value = true
  try {
    const response = await listAdminEntityRecords(selectedEntity.value, normalizedToken, {
      skip: pagination.skip,
      limit: pagination.limit,
    })
    records.value = response.items || []
    pagination.total = response.pagination?.total || 0
  } catch (error) {
    setError(error.message || 'Failed to load summary records.')
  } finally {
    loadingRecords.value = false
  }
}

async function loadNavigationCount() {
  const normalizedToken = token.value.trim()
  if (!normalizedToken) {
    navMenuCount.value = 0
    return
  }

  try {
    const response = await listNavigationMenus(normalizedToken)
    navMenuCount.value = (response.items || []).length
  } catch {
    navMenuCount.value = 0
  }
}

async function connectAdmin() {
  clearMessages()
  const normalizedToken = token.value.trim()

  if (!normalizedToken) {
    setError('Please provide admin token first.')
    return
  }

  try {
    await loadEntities()
    await loadRecords()
    await loadNavigationCount()
    setSuccess('Connected to admin API.')
  } catch (error) {
    setError(error.message || 'Failed to connect admin API.')
  }
}

async function handleLogout() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
  token.value = ''
  entities.value = []
  selectedEntity.value = ''
  records.value = []
  pagination.total = 0
  navMenuCount.value = 0
  clearMessages()
  await router.replace({ name: 'AdminLogin' })
}

watch(token, (value) => {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, value)
})

watch(selectedEntity, () => {
  pagination.skip = 0
  if (activeSection.value === 'dashboard') {
    loadRecords()
  }
})

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

  if (!token.value.trim()) {
    return
  }
  if (section === 'dashboard') {
    await loadRecords()
  } else {
    await loadNavigationCount()
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

  if (token.value.trim()) {
    await connectAdmin()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportChange)
  uiState.isNavHidden = false
  uiState.isFooterHidden = false
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
})
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-open': isSidebarOpen }">
    <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="closeSidebar"></div>

    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <div class="sidebar-top">
        <div class="brand">CHINA ADMIN</div>
        <button type="button" class="sidebar-close" aria-label="Close admin sidebar" @click="closeSidebar">x</button>
      </div>

      <div class="sidebar-section">
        <button
          type="button"
          class="menu-item"
          :class="{ active: activeSection === 'dashboard' }"
          @click="handleSectionChange('dashboard')"
        >
          Dashboard
        </button>
        <button
          type="button"
          class="menu-item"
          :class="{ active: activeSection === 'navigation' }"
          @click="handleSectionChange('navigation')"
        >
          Menu Navigation
        </button>
      </div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="title-panel">
          <button type="button" class="sidebar-toggle" aria-label="Open admin sidebar" :aria-expanded="isSidebarOpen ? 'true' : 'false'" @click="isSidebarOpen = !isSidebarOpen">Menu</button>
          <div>
            <h1>{{ currentTitle }}</h1>
            <p>{{ currentBreadcrumb }}</p>
          </div>
        </div>

        <div class="auth-panel">
          <input id="admin-token" v-model="token" type="password" placeholder="X-Admin-Token" />
          <button type="button" class="btn btn-primary" :disabled="loadingEntities" @click="connectAdmin">
            {{ loadingEntities ? 'Loading...' : 'Connect' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="handleLogout">Logout</button>
        </div>
      </header>

      <p v-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="notice success">{{ successMessage }}</p>

      <section v-if="activeSection === 'dashboard'" class="stats">
        <article
          v-for="card in statCards"
          :key="card.key"
          class="stat-card"
          :class="`tone-${card.tone}`"
        >
          <p class="stat-value">{{ card.value }}</p>
          <p class="stat-title">{{ card.title }}</p>
          <p class="stat-sub">{{ card.subtitle }}</p>
        </article>
      </section>

      <NavigationMenusManager
        v-if="activeSection === 'navigation'"
        :token="token"
        :active="activeSection === 'navigation'"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
        @menus-count="navMenuCount = $event"
      />
    </main>
  </div>
</template>

<style scoped>
.admin-shell {
  --bg-page: #eef3fa;
  --bg-sidebar-top: #1f3146;
  --bg-sidebar-bottom: #2d4767;
  --text-primary: #16324a;
  --text-muted: #6c8098;
  --line-soft: #d9e4f1;
  --line-strong: #c6d7e8;
  --shadow-soft: 0 12px 32px rgba(33, 61, 98, 0.08);
  --shadow-card: 0 10px 24px rgba(26, 51, 84, 0.12);
  min-height: 100vh;
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr);
  background:
    radial-gradient(800px 420px at 85% -10%, rgba(64, 178, 215, 0.14), transparent 65%),
    linear-gradient(180deg, var(--bg-page) 0%, #e8eef6 100%);
  color: var(--text-primary);
  font-family: Manrope, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.sidebar-backdrop {
  display: none;
}

.sidebar {
  background: linear-gradient(180deg, var(--bg-sidebar-top) 0%, var(--bg-sidebar-bottom) 100%);
  border-right: 1px solid rgba(172, 196, 224, 0.22);
  color: #e8f0f7;
  padding: 18px 12px;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 3;
}

.sidebar-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.sidebar-close {
  display: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(161, 192, 222, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(420px 260px at 90% -10%, rgba(102, 180, 232, 0.16), transparent 70%);
  pointer-events: none;
}

.brand {
  font-size: 36px;
  font-weight: 700;
  line-height: 0.82;
  letter-spacing: 0.04em;
  margin: 14px 10px 20px;
  color: #fff;
  text-shadow: 0 8px 28px rgba(11, 20, 36, 0.42);
}

.sidebar-section {
  display: grid;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.menu-item {
  width: 100%;
  text-align: left;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  color: #d4e4f4;
  border-radius: 10px;
  padding: 11px 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.22s ease;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(166, 200, 236, 0.34);
}

.menu-item.active {
  background: linear-gradient(135deg, #2a9bd3 0%, #3db6e7 100%);
  border-color: rgba(132, 214, 255, 0.6);
  color: #fff;
  box-shadow: 0 10px 22px rgba(15, 74, 116, 0.35);
}

.workspace {
  padding: 14px 18px 18px;
  min-width: 0;
}

.topbar {
  min-height: 78px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  box-shadow: var(--shadow-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  backdrop-filter: blur(8px);
}

.title-panel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.sidebar-toggle {
  display: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cddceb;
  background: #fff;
  color: #244260;
  font-size: 19px;
  cursor: pointer;
}

.topbar h1 {
  margin: 0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(32px, 4vw, 42px);
  line-height: 1;
  color: #1f3850;
}

.topbar p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.auth-panel {
  width: min(470px, 100%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.auth-panel input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  padding: 9px 10px;
  font-size: 13px;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.auth-panel input:focus {
  outline: none;
  border-color: #6ebfe5;
  box-shadow: 0 0 0 3px rgba(67, 177, 219, 0.2);
}

.btn {
  border-radius: 10px;
  padding: 9px 14px;
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
  box-shadow: 0 10px 20px rgba(34, 146, 190, 0.28);
}

.notice {
  margin: 10px 0 0;
  border-radius: 10px;
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

.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.stat-card {
  padding: 16px;
  color: #fff;
  min-height: 116px;
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  box-shadow: var(--shadow-card);
}

.stat-card::after {
  content: '';
  position: absolute;
  width: 118px;
  height: 118px;
  border-radius: 999px;
  top: -18px;
  right: -20px;
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
  font-size: 42px;
  line-height: 1;
  font-weight: 700;
}

.stat-title {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 600;
}

.stat-sub {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

button:disabled {
  opacity: 0.56;
  cursor: not-allowed;
  box-shadow: none !important;
  transform: none !important;
}

@media (max-width: 1200px) {
  .admin-shell {
    grid-template-columns: 228px minmax(0, 1fr);
  }

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
    border-right: 1px solid rgba(172, 196, 224, 0.22);
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
  }
}

@media (max-width: 860px) {
  .topbar {
    min-height: 0;
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .title-panel {
    align-items: center;
  }

  .auth-panel {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn {
    min-height: 40px;
  }

  .stat-value {
    font-size: 38px;
  }
}

@media (max-width: 640px) {
  .workspace {
    padding: 12px;
  }

  .auth-panel input {
    width: 100%;
  }

  .auth-panel .btn {
    width: 100%;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .topbar h1 {
    font-size: 30px;
  }
}
</style>

