<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  BookOpen,
  Box,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  Headphones,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Tags,
  UserCircle,
  Users,
  Video,
  Globe,
  Languages,
} from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { LOCALE_STORAGE_KEY } from '@/i18n'

import RevenueChart from '@/admin/components/RevenueChart.vue'
import SidebarHeader from '@/admin/components/SidebarHeader.vue'
import AdminProfilePage from '@/admin/pages/AdminProfilePage.vue'
import { getDashboardStats } from '@/admin/api/dashboard.api'
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
import AdminSiteSettings from '@/admin/pages/AdminSiteSettings.vue'
import MediaAssetsManager from '@/views/admin/features/system/pages/MediaAssetsManager.vue'
import OrdersManager from '@/views/admin/features/system/pages/OrdersManager.vue'
import UsersManager from '@/views/admin/features/system/pages/UsersManager.vue'
import AdminUsersManager from '@/views/admin/features/system/pages/AdminUsersManager.vue'


import HonorsManager from '@/views/admin/features/honors/pages/HonorsManager.vue'
import CapabilitySettingsManager from '@/views/admin/features/honors/pages/CapabilitySettingsManager.vue'
import NavigationMenusManager from '@/views/admin/features/navigation/pages/NavigationMenusManager.vue'
import NewsManager from '@/views/admin/features/news/pages/NewsManager.vue'


const router = useRouter()
const route = useRoute()
const { t, locale } = useI18n()

const availableSectionKeys = ['dashboard', 'navigation', ...Object.keys(ADMIN_SECTION_INDEX).filter((key) => key !== 'dashboard' && key !== 'navigation')]
const LEGACY_SECTION_REDIRECTS = {
  project_products: 'projects',
  entity_media: 'projects',
}

const adminSidebarGroups = ADMIN_SECTION_GROUPS

const sectionLabelOverrides = Object.fromEntries(
  adminSidebarGroups.flatMap((group) => group.items.map((item) => [item.key, item.label])),
)

const dashboardKpis = ref([])

const latestOrders = ref([])

const topProducts = ref([])

const orderStats = ref([])

const quickStats = ref([])

const KPI_ICONS = {
  total_orders: ShoppingBag,
  total_revenue: CircleDollarSign,
  products: Package,
  customers: Users,
  reviews: MessageSquare
}

const QUICK_STAT_ICONS = {
  out_of_stock: Box,
  new_customers: Users,
  posts: FileText,
  videos: Video
}

const STATUS_MAP = {
  pending_confirmation: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
}

const dashboardFilters = reactive({
  range: '30d',
  from: '',
  to: '',
})

function syncDateRange() {
  if (dashboardFilters.range === 'custom') return
  const end = new Date()
  const start = new Date()
  
  if (dashboardFilters.range === '1d') {
    start.setDate(end.getDate())
  } else if (dashboardFilters.range === '7d') {
    start.setDate(end.getDate() - 6)
  } else if (dashboardFilters.range === '30d') {
    start.setDate(end.getDate() - 29)
  }
  
  const offset = start.getTimezoneOffset()
  dashboardFilters.from = new Date(start.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
  dashboardFilters.to = new Date(end.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
}

syncDateRange()

async function onDateFilterChange() {
  syncDateRange()
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

const isLangOpen = ref(false)
const supportedLanguages = [
  { code: 'vi', label: 'Tiếng Việt', flag: 'VN' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'zh', label: '中文', flag: 'ZH' },
]

function switchLanguage(code) {
  locale.value = code
  localStorage.setItem(LOCALE_STORAGE_KEY, code)
  isLangOpen.value = false
}

function closeLangDropdown(event) {
  if (!isLangOpen.value) return
  if (!event.target.closest('.lang-switcher')) {
    isLangOpen.value = false
  }
}

const isProfileOpen = ref(false)

function closeProfileDropdown(event) {
  if (!isProfileOpen.value) return
  if (!event.target.closest('.admin-profile-wrapper')) {
    isProfileOpen.value = false
  }
}

const isDesktopSidebarCollapsed = ref(false)

function toggleSidebar() {
  if (window.innerWidth <= 1024) {
    isSidebarOpen.value = true
  } else {
    isDesktopSidebarCollapsed.value = !isDesktopSidebarCollapsed.value
  }
}

const currentSectionMeta = computed(() => {
  if (activeSection.value === 'dashboard') {
    return {
      label: t('admin.sidebar.dashboard'),
      eyebrow: t('admin.sidebar.overview'),
      description: t('admin.dashboard.welcome_subtitle'),
    }
  }

  if (activeSection.value === 'navigation') {
    return {
      label: t('admin.sidebar.navigation'),
      eyebrow: t('admin.sidebar.content'),
      description: t('admin.navigation.subtitle'),
    }
  }

  const config = ADMIN_SECTION_INDEX[activeSection.value]
  return {
    label: sectionLabelOverrides[activeSection.value] || (config?.label ? t(config.label) : 'Dashboard'),
    eyebrow: config?.eyebrow ? t(config.eyebrow) : t('admin.common.admin_profile'),
    description: config?.description || '',
  }
})

const currentTitle = computed(() => currentSectionMeta.value.label)
const currentBreadcrumb = computed(() => {
  if (activeSection.value === 'dashboard') return 'admin.sidebar.dashboard'
  const config = ADMIN_SECTION_INDEX[activeSection.value]
  return config?.label || activeSection.value
})
const userLabel = computed(() => currentUser.value?.full_name || currentUser.value?.username || 'Admin Admin')
const userRole = computed(() => {
  const role = String(currentUser.value?.role || '').toLowerCase()
  return role === 'admin' || !role ? t('admin.common.admin_profile') : role
})
const isUnsupportedSection = computed(() => false) 
const unsupportedSectionMeta = computed(() => null)

const pieChartStyle = computed(() => {
  if (!orderStats.value || orderStats.value.length === 0) return { background: '#e2e8f0' }
  
  let stops = []
  let currentPct = 0
  for (const item of orderStats.value) {
    stops.push(`${item.color} ${currentPct}% ${currentPct + item.value}%`)
    currentPct += item.value
  }
  return { background: `conic-gradient(${stops.join(', ')})` }
})

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

function handleProfileUpdated(profile) {
  currentUser.value = profile
  localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(profile))
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

function isSidebarItemActive(item) {
  if (item?.disabled) return false
  if (activeSection.value !== item?.key) return false
  if (item?.key === 'dashboard') return item?.label === 'Dashboard'
  return true
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

async function loadDashboardStats() {
  const normalizedToken = String(token.value || '').trim()
  if (!normalizedToken) return

  try {
    const dashboardStats = await getDashboardStats(normalizedToken, {
      start_date: dashboardFilters.from,
      end_date: dashboardFilters.to,
    })

    if (!isDashboardAlive) return

    if (dashboardStats) {
      dashboardKpis.value = (dashboardStats.kpis || []).map(kpi => ({ ...kpi, icon: KPI_ICONS[kpi.key] || Box }))
      latestOrders.value = dashboardStats.latestOrders || []
      topProducts.value = dashboardStats.topProducts || []
      orderStats.value = dashboardStats.orderStats || []
      quickStats.value = (dashboardStats.quickStats || []).map(stat => ({ ...stat, icon: QUICK_STAT_ICONS[stat.key] || Box }))
    }
  } catch (err) {
    console.error('[Dashboard Stats Error]', err)
    if (isDashboardAlive) {
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.')
    }
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

    // Gọi dashboard stats riêng để lỗi biểu đồ không ảnh hưởng phần admin core.
    await loadDashboardStats()
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
  () => [dashboardFilters.range, dashboardFilters.from, dashboardFilters.to],
  async ([range, from, to]) => {
    if (!token.value.trim() || activeSection.value !== 'dashboard') return
    if (range === 'custom' && (!from || !to)) return
    await loadDashboardStats()
  },
)

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
  window.addEventListener('click', closeLangDropdown)
  window.addEventListener('click', closeProfileDropdown)

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
  window.removeEventListener('click', closeLangDropdown)
  window.removeEventListener('click', closeProfileDropdown)
  clearToast()
  uiState.isNavHidden = false
  uiState.isFooterHidden = false
  uiState.isHeaderHidden = false
})
</script>

<template>
  <div class="admin-shell" :class="{ 'sidebar-collapsed': isDesktopSidebarCollapsed }">
    <div v-if="isSidebarOpen" class="sidebar-backdrop" @click="closeSidebar" />

    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <SidebarHeader @close="closeSidebar" />
      <nav class="nav-groups" aria-label="Admin sections">
        <section v-for="group in ADMIN_SECTION_GROUPS" :key="group.title" class="nav-group">
          <p class="nav-group-title">{{ $t(group.title) }}</p>
          <div v-for="item in group.items" :key="item.key" class="nav-item-shell">
            <button
              type="button"
              class="nav-item"
              :class="{ active: activeSection === item.key, 'active-parent': hasActiveChild(item) }"
              @click="handleSectionChange(item.key)"
            >
              {{ $t(item.label) }}
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
                - {{ $t(child.label) }}
              </button>
            </div>
          </div>
        </section>
      </nav>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="title-panel">
          <button class="sidebar-toggle" type="button" aria-label="Toggle sidebar" @click="toggleSidebar">
            <Menu :size="22" />
          </button>
          <p class="breadcrumb-mini">{{ $t(currentBreadcrumb) }}</p>
        </div>

        <div class="session-panel">
          <div class="lang-switcher">
            <button
              class="topbar-icon-btn"
              type="button"
              :aria-label="$t('admin.dashboard.language')"
              @click="isLangOpen = !isLangOpen"
            >
              <Globe :size="21" />
            </button>
            <transition name="dropdown">
              <div v-if="isLangOpen" class="lang-dropdown shadow-xl">
                <button
                  v-for="lang in supportedLanguages"
                  :key="lang.code"
                  type="button"
                  class="lang-item"
                  :class="{ active: locale === lang.code }"
                  @click="switchLanguage(lang.code)"
                >
                  <span class="lang-flag">{{ lang.flag }}</span>
                  <span class="lang-label">{{ lang.label }}</span>
                </button>
              </div>
            </transition>
          </div>
          <button class="topbar-icon-btn" type="button" :aria-label="$t('admin.common.search')">
            <Search :size="22" />
          </button>
          <button class="topbar-icon-btn topbar-icon-btn--notify" type="button" :aria-label="$t('admin.common.notifications')">
            <Bell :size="21" />
            <span>3</span>
          </button>
          <div class="admin-profile-wrapper">
            <button class="admin-profile" type="button" @click="isProfileOpen = !isProfileOpen">
              <div class="admin-avatar">
                <img v-if="currentUser?.avatar_url" :src="currentUser.avatar_url" :alt="userLabel" class="admin-avatar__image" />
                <UserCircle v-else :size="26" />
              </div>
              <div>
                <strong>{{ userLabel }}</strong>
                <span>{{ userRole }}</span>
              </div>
              <ChevronDown :size="18" />
            </button>
            <transition name="dropdown">
              <div v-if="isProfileOpen" class="profile-dropdown shadow-xl">
                <button type="button" class="profile-item profile-info" @click="handleSectionChange('admin_profile'); isProfileOpen = false">

                  <div class="profile-info-text">
                    <strong>{{ userLabel }}</strong>
                    <span>{{ currentUser?.email || 'Chưa cập nhật email' }}</span>
                  </div>
                </button>
                <div class="dropdown-divider"></div>
                <button type="button" class="profile-item logout-btn" @click="handleLogout">
                  <LogOut :size="16" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </transition>
          </div>
        </div>
      </header>

      <transition name="toast-pop">
        <div v-if="toast.visible" class="admin-toast" :class="`admin-toast--${toast.type}`" role="status" aria-live="polite">
          {{ toast.message }}
        </div>
      </transition>

      <section v-if="activeSection === 'dashboard'" class="dashboard-panel">
        <div class="welcome-card">
          <div>
            <h1>{{ $t('admin.dashboard.welcome_title') }}</h1>
            <p>{{ $t('admin.dashboard.welcome_subtitle') }}</p>
          </div>
          <div class="date-filter-group">
            <select v-model="dashboardFilters.range" @change="onDateFilterChange" class="date-preset-select">
              <option value="1d">Hôm nay</option>
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
              <option value="custom">Chọn khoảng ngày</option>
            </select>

            <div v-if="dashboardFilters.range === 'custom'" class="custom-date-inputs">
              <input v-model="dashboardFilters.from" type="date" class="date-input" />
              <span>-</span>
              <input v-model="dashboardFilters.to" type="date" class="date-input" />
            </div>
          </div>
        </div>

        <div class="kpi-grid">
          <article v-for="card in dashboardKpis" :key="card.key" class="kpi-card" :class="`kpi-card--${card.tone}`">
            <span class="kpi-card__icon">
              <component :is="card.icon" :size="30" stroke-width="1.8" />
            </span>
            <div>
              <p>{{ $t(`admin.dashboard.${card.key}`) }}</p>
              <strong>{{ card.value }}</strong>
              <span :style="{ color: card.growth.startsWith('-') ? '#ef4444' : '#10b981' }">
                {{ card.growth.startsWith('-') ? '↓' : '↑' }} {{ card.growth.replace(/^[+-]/, '') }} {{ $t('admin.dashboard.growth_suffix') }}
              </span>
            </div>
          </article>
        </div>

        <div class="dashboard-main-grid">
          <section class="dashboard-card chart-card">
            <div class="card-header">
              <h2>{{ $t('admin.dashboard.revenue_chart_title') }}</h2>
            </div>
            <div class="chart-wrap">
              <RevenueChart :token="token" :filters="dashboardFilters" />
            </div>
          </section>

          <section class="dashboard-card table-card">
            <div class="card-header">
              <h2>{{ $t('admin.dashboard.latest_orders') }}</h2>
              <button class="view-all-btn" type="button" @click="handleSectionChange('orders')">
                {{ $t('admin.dashboard.view_all') }}
              </button>
            </div>
            <div class="latest-order-list">
              <div v-if="!latestOrders.length" class="empty-state">
                <p>Chưa có đơn hàng mới trong khoảng thời gian này</p>
              </div>
              <article v-else v-for="order in latestOrders" :key="order.code" class="latest-order-row">
                <span class="latest-order-row__icon">
                  <ClipboardList :size="18" />
                </span>
                <strong>#{{ order.code }}</strong>
                <span>{{ order.customer }}</span>
                <span>{{ order.time }}</span>
                <span class="status-badge" :class="`status-badge--${order.statusKey}`">
                  {{ STATUS_MAP[order.statusKey] || order.statusKey }}
                </span>
                <b>{{ order.amount }}</b>
              </article>
            </div>
          </section>
        </div>

        <div class="dashboard-bottom-grid">
          <section class="dashboard-card product-card">
            <div class="card-header">
              <h2>{{ $t('admin.dashboard.top_selling_products') }}</h2>
            </div>
            <div class="top-product-list">
              <div v-if="!topProducts.length" class="empty-state">
                <p>Chưa có dữ liệu sản phẩm bán chạy trong khoảng thời gian này</p>
              </div>
              <article v-else v-for="(product, idx) in topProducts" :key="product.name" class="top-product-row">
                <span class="top-product-row__rank">#{{ idx + 1 }}</span>
                <div class="product-thumb">
                  <img v-if="product.image_url" :src="product.image_url" :alt="product.name" />
                  <div v-else class="product-thumb-placeholder"><Package :size="16" stroke-width="1.5" /></div>
                </div>
                <div class="product-info-wrap">
                  <div class="product-info-main">
                    <strong>{{ product.name }}</strong>
                    <p>{{ product.sold }} đã bán | Còn: {{ product.stock_quantity }}</p>
                  </div>
                  <div class="product-revenue">
                    <strong>{{ product.revenue.toLocaleString('vi-VN') }}đ</strong>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section class="dashboard-card status-card">
            <div class="card-header">
              <h2>{{ $t('admin.dashboard.orders_by_status') }}</h2>
            </div>
            <div class="status-card__body">
              <div v-if="!orderStats.length" class="empty-state">
                <p>Chưa có đơn hàng trong khoảng thời gian này</p>
              </div>
              <template v-else>
                <div class="donut-chart" :style="pieChartStyle"></div>
                <div class="status-legend">
                  <div v-for="item in orderStats" :key="item.key">
                    <span :style="{ background: item.color }"></span>
                    <p>{{ STATUS_MAP[item.key] || item.key }}</p>
                    <strong>{{ item.value }}% ({{ item.count }})</strong>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <section class="dashboard-card quick-stat-card">
            <div class="card-header">
              <h2>{{ $t('admin.dashboard.quick_stats') }}</h2>
            </div>
            <div class="quick-stat-list">
              <article v-for="stat in quickStats" :key="stat.key" class="quick-stat-row" :class="`quick-stat-row--${stat.tone}`">
                <span>
                  <component :is="stat.icon" :size="18" />
                </span>
                <p>{{ $t(`admin.dashboard.${stat.key}`) }}</p>
                <strong>{{ stat.value }}</strong>
              </article>
            </div>
          </section>
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
        <p class="hero-eyebrow">{{ $t('admin.common.module_unavailable') }}</p>
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

      <OrdersManager
        v-else-if="activeSection === 'orders'"
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

      <AdminSiteSettings
        v-else-if="activeSection === 'site_settings'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <AdminUsersManager
        v-else-if="activeSection === 'admin_users'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
      />

      <AdminProfilePage
        v-else-if="activeSection === 'admin_profile'"
        :token="token"
        @notify-success="setSuccess"
        @notify-error="setError"
        @profile-updated="handleProfileUpdated"
      />

      <UsersManager
        v-else-if="activeSection === 'users'"
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
  transition: padding-left 0.3s ease;
}

.admin-shell.sidebar-collapsed {
  padding-left: 0;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--admin-sidebar-width);
  height: 100vh;
  overflow-y: auto;
  padding: 24px 16px;
  color: #fff;
  background: #0f172a;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 20;
  transition: transform 0.3s ease;
}

.admin-shell.sidebar-collapsed .sidebar {
  transform: translateX(-100%);
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
  font-weight: 600;
}

.sidebar h2 {
  margin: 6px 0 0;
  font-size: clamp(28px, 2vw, 32px);
  line-height: 0.92;
  font-weight: 600;
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
  padding: 0;
  background: transparent;
  border: 0;
}

.nav-group-title {
  margin: 0 0 6px;
  color: rgba(209, 226, 248, 0.72);
  font-size: var(--admin-label-size);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 600;
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
  font-weight: 500;
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
  background: #3b82f6;
  color: #fff;
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
  font-weight: 500;
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
  font-weight: 500;
}

.topbar h1 {
  margin: 4px 0 0;
  font-size: var(--admin-title-size);
  line-height: 1;
  font-weight: 600;
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
  font-weight: 500;
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
  font-weight: 600;
  letter-spacing: -0.04em;
}

.stat-title {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 500;
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

.workspace {
  min-height: 100vh;
  padding: 28px 30px 32px;
  border-top-left-radius: 34px;
  background: #f6f9fc;
}

.topbar {
  min-height: 44px;
  padding: 0;
  margin-bottom: 24px;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.title-panel {
  gap: 24px;
}

.sidebar-toggle,
.topbar-icon-btn {
  width: 42px;
  height: 42px;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #07152b;
  cursor: pointer;
}

.breadcrumb-mini {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
}

.session-panel {
  gap: 14px;
  flex-wrap: nowrap;
}

.topbar-icon-btn {
  position: relative;
}

.topbar-icon-btn--notify span {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 17px;
  height: 17px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}

.admin-profile-wrapper {
  position: relative;
}

.admin-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 12px;
  transition: background 0.2s;
}

.admin-profile:hover {
  background: rgba(0, 0, 0, 0.04);
}

.admin-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eef4fb;
  color: #64748b;
  overflow: hidden;
}

.admin-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin-profile strong,
.admin-profile span {
  display: block;
  white-space: nowrap;
}

.admin-profile strong {
  font-size: 14px;
  font-weight: 900;
}

.admin-profile span {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 100;
  padding: 8px;
  transform-origin: top right;
}

.profile-info {
  align-items: flex-start;
  color: #0f172a;
}

.profile-info-text {
  text-align: left;
  min-width: 0;
  width: 100%;
}

.profile-info strong {
  display: block;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-info span {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.06);
  margin: 4px 0;
}

.profile-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.profile-item.logout-btn {
  color: #ef4444;
}

.profile-item.logout-btn:hover {
  background: #fef2f2;
}

.profile-info:hover {
  background: rgba(0, 0, 0, 0.04);
}

.dashboard-panel {
  margin-top: 0;
  gap: 20px;
}

.welcome-card,
.dashboard-card,
.kpi-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.06);
}

.welcome-card {
  min-height: 112px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
  background:
    linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%);
}

.welcome-card h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0;
}

.welcome-card p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 15px;
  font-weight: 600;
}

.date-range,
.small-select {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-weight: 700;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
}

.kpi-card {
  min-height: 116px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 18px;
}

.kpi-card__icon {
  width: 62px;
  height: 62px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  flex: 0 0 auto;
}

.kpi-card p {
  margin: 0;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
}

.kpi-card strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: clamp(18px, 1.6vw, 24px);
  line-height: 1.2;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kpi-card div > span {
  display: block;
  margin-top: 10px;
  color: #10b981;
  font-size: 13px;
  font-weight: 800;
}

.kpi-card--blue .kpi-card__icon {
  background: #dbeafe;
  color: #2563eb;
}

.kpi-card--green .kpi-card__icon {
  background: #dff8ea;
  color: #10b981;
}

.kpi-card--violet .kpi-card__icon {
  background: #ede5ff;
  color: #7c3aed;
}

.kpi-card--orange .kpi-card__icon {
  background: #ffedd5;
  color: #f59e0b;
}

.kpi-card--cyan .kpi-card__icon {
  background: #e0f7ff;
  color: #0ea5e9;
}

.dashboard-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(420px, 0.95fr);
  gap: 20px;
}

.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: minmax(280px, 0.95fr) minmax(360px, 1fr) minmax(280px, 0.95fr);
  gap: 20px;
}

.dashboard-card {
  padding: 22px;
}

.dashboard-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.dashboard-card h2,
.dashboard-card__head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 17px;
  font-weight: 900;
}

.link-button {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.chart-wrap {
  width: 100%;
  overflow: hidden;
}

.chart-wrap svg {
  width: 100%;
  min-height: 290px;
  display: block;
}

.chart-grid line {
  stroke: #e5e7eb;
  stroke-width: 1;
}

.chart-axis text,
.chart-legend text {
  fill: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.latest-order-list {
  display: grid;
  gap: 18px;
}

.latest-order-row {
  display: grid;
  grid-template-columns: 34px 1.05fr 1fr 0.75fr auto 0.85fr;
  align-items: center;
  gap: 12px;
  color: #334155;
  font-size: 13px;
}

.latest-order-row strong,
.latest-order-row b {
  color: #0f172a;
  font-weight: 900;
}

.latest-order-row b {
  text-align: right;
}

.latest-order-row__icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f3f7fb;
  color: #64748b;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-style: normal;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-badge--pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge--confirmed {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge--shipping {
  background: #ede9fe;
  color: #7c3aed;
}

.status-badge--completed {
  background: #d1fae5;
  color: #059669;
}

.status-badge--cancelled {
  background: #fee2e2;
  color: #ef4444;
}

.top-product-list,
.quick-stat-list {
  display: grid;
  gap: 14px;
}

.top-product-row {
  display: grid;
  grid-template-columns: 24px 50px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
}

.top-product-row__rank {
  color: #0f172a;
  font-weight: 900;
  text-align: center;
}

.product-thumb {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.06)),
    repeating-linear-gradient(45deg, #cfc8bc 0 8px, #aaa397 8px 12px);
}

.product-thumb--travertine {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.04)),
    repeating-linear-gradient(0deg, #ddd3c7 0 7px, #c7b9a8 7px 11px);
}

.product-thumb--stone {
  background:
    radial-gradient(circle at 30% 25%, #b6b3ad 0 3px, transparent 4px),
    radial-gradient(circle at 70% 55%, #8c8984 0 4px, transparent 5px),
    #9d9a94;
}

.top-product-row strong {
  color: #0f172a;
  font-size: 15px;
}

.top-product-row p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.status-card__body {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr);
  align-items: center;
  gap: 20px;
}

.donut-chart {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: conic-gradient(#f8b72b 0 25.6%, #3b82f6 25.6% 48%, #8b5cf6 48% 62.4%, #10b981 62.4% 96%, #ef4444 96% 100%);
  position: relative;
}

.donut-chart::after {
  content: '';
  position: absolute;
  inset: 42px;
  border-radius: 50%;
  background: #fff;
}

.status-legend {
  display: grid;
  gap: 12px;
}

.status-legend div {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
}

.status-legend span {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.status-legend p,
.status-legend strong {
  margin: 0;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.quick-stat-row {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.quick-stat-row:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.quick-stat-row span {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
}

.quick-stat-row p {
  margin: 0;
  color: #334155;
  font-weight: 700;
}

.quick-stat-row strong {
  font-weight: 900;
}

.quick-stat-row--danger span {
  background: #fee2e2;
  color: #ef4444;
}

.quick-stat-row--danger strong {
  color: #ef4444;
}

.quick-stat-row--success span {
  background: #dcfce7;
  color: #16a34a;
}

.quick-stat-row--success strong {
  color: #16a34a;
}

.quick-stat-row--info span {
  background: #e0f2fe;
  color: #0ea5e9;
}

.quick-stat-row--info strong {
  color: #2563eb;
}

.quick-stat-row--blue span {
  background: #dbeafe;
  color: #2563eb;
}

.quick-stat-row--blue strong {
  color: #2563eb;
}

.lang-switcher {
  position: relative;
}

.lang-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 12px;
  width: 180px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 8px;
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.lang-item:hover {
  background: #f3f7fb;
}

.lang-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.lang-flag {
  font-size: 18px;
}

.lang-label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.lang-item.active .lang-label {
  color: #2563eb;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-main-grid,
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }

  .latest-order-row {
    grid-template-columns: 34px 1fr 1fr 0.8fr auto 0.8fr;
  }
}

@media (max-width: 1024px) {
  .admin-shell {
    padding-left: 0;
  }

  .workspace {
    border-top-left-radius: 0;
  }
}

@media (max-width: 768px) {
  .workspace {
    padding: 18px 14px 28px;
  }

  .topbar {
    align-items: flex-start;
    gap: 14px;
  }

  .session-panel {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .welcome-card {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px 18px;
  }

  .date-range {
    width: 100%;
    justify-content: center;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .latest-order-row {
    grid-template-columns: 34px minmax(0, 1fr) auto;
    padding-bottom: 14px;
    border-bottom: 1px solid #e5e7eb;
  }

  .latest-order-row span:nth-child(3),
  .latest-order-row span:nth-child(4),
  .latest-order-row b {
    grid-column: 2 / -1;
    text-align: left;
  }

  .status-badge {
    grid-column: 3;
    grid-row: 1;
  }

  .status-card__body {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .status-legend {
    width: 100%;
  }

  .admin-profile div:not(.admin-avatar) {
    display: none;
  }
}

@media (max-width: 480px) {
  .dashboard-card {
    padding: 18px 14px;
  }

  .welcome-card h1 {
    font-size: 24px;
  }

  .kpi-card {
    padding: 18px 14px;
  }

  .chart-wrap {
    overflow-x: auto;
  }

  .chart-wrap svg {
    width: 640px;
  }
}

.date-filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.date-preset-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.custom-date-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-input {
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  outline: none;
  font-family: inherit;
}

.product-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f1f5f9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-thumb-placeholder {
  color: #94a3b8;
}

.product-info-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.product-info-main p {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.product-revenue strong {
  color: #10b981;
  font-size: 14px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
}

@media (max-width: 768px) {
  .date-filter-group {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .date-preset-select {
    width: 100%;
  }

  .custom-date-inputs {
    width: 100%;
    justify-content: space-between;
  }
}

/* Profile Panel Styles */
.profile-panel {
  padding: 40px;
  max-width: 900px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #e2e8f0;
}

.profile-avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  border: 4px solid #fff;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.profile-title-text h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.profile-title-text p {
  color: #64748b;
  font-size: 16px;
  margin-bottom: 12px;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #3b82f6;
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
}

.profile-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.detail-item label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.025em;
}

.detail-item p {
  font-size: 16px;
  color: #334155;
  font-weight: 500;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.profile-actions {
  display: flex;
  gap: 16px;
}

.btn-primary {
  padding: 12px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-outline {
  padding: 12px 24px;
  background: #fff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.logout-btn-profile {
  color: #ef4444;
}

.logout-btn-profile:hover {
  background: #fef2f2;
  border-color: #fee2e2;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  .profile-details-grid {
    grid-template-columns: 1fr;
  }
  .profile-actions {
    flex-direction: column;
  }
}
</style>








