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
} from 'lucide-vue-next'

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
import OrdersManager from '@/views/admin/features/system/pages/OrdersManager.vue'
import UsersManager from '@/views/admin/features/system/pages/UsersManager.vue'
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

const adminSidebarGroups = [
  {
    title: 'TỔNG QUAN',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'dashboard', label: 'Bảng điều khiển', icon: Home },
    ],
  },
  {
    title: 'QUẢN LÝ NỘI DUNG',
    items: [
      { key: 'products', label: 'Sản phẩm', icon: Package },
      { key: 'product_categories', label: 'Danh mục', icon: Tags },
      { key: 'videos', label: 'Video', icon: Video },
      { key: 'news_posts', label: 'Bài viết', icon: FileText },
      { key: 'navigation', label: 'Menu', icon: ClipboardList },
      { key: 'banners', label: 'Banner & Slider', icon: SlidersHorizontal },
      { key: 'content_block_items', label: 'Giới thiệu công ty', icon: BookOpen },
      { key: 'capability_settings', label: 'Cấu hình năng lực', icon: Gauge },
      { key: 'honor_categories', label: 'Danh mục năng lực', icon: Tags },
      { key: 'honors', label: 'Năng lực / Chứng nhận', icon: Star },
      { key: 'media_assets', label: 'Thư viện ảnh', icon: Image },
      { key: 'projects', label: 'Dự án', icon: BriefcaseBusiness },
      { key: 'contacts', label: 'Thông tin liên hệ', icon: Headphones },
      { key: 'inquiry_submissions', label: 'Phản hồi từ form', icon: MessageSquare },
    ],
  },
  {
    title: 'ĐƠN HÀNG & KHÁCH HÀNG',
    items: [
      { key: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
      { key: 'users', label: 'Khách hàng', icon: Users },
      { key: 'reviews', label: 'Đánh giá', icon: Star, disabled: true },
    ],
  },
  {
    title: 'CẤU HÌNH HỆ THỐNG',
    items: [
      { key: 'site_settings', label: 'Cài đặt website', icon: Settings },
      { key: 'users', label: 'Quản lý tài khoản', icon: UserCircle },
      { key: 'activity_logs', label: 'Nhật ký hoạt động', icon: FileText, disabled: true },
    ],
  },
]

const sectionLabelOverrides = Object.fromEntries(
  adminSidebarGroups.flatMap((group) => group.items.map((item) => [item.key, item.label])),
)

const dashboardKpis = [
  {
    title: 'Tổng đơn hàng',
    value: '125',
    growth: '12.5%',
    icon: ShoppingBag,
    tone: 'blue',
  },
  {
    title: 'Tổng doanh thu',
    value: '58.450.000đ',
    growth: '18.7%',
    icon: CircleDollarSign,
    tone: 'green',
  },
  {
    title: 'Sản phẩm',
    value: '320',
    growth: '8.3%',
    icon: Box,
    tone: 'violet',
  },
  {
    title: 'Khách hàng',
    value: '476',
    growth: '10.2%',
    icon: Users,
    tone: 'orange',
  },
  {
    title: 'Đánh giá',
    value: '89',
    growth: '15.9%',
    icon: MessageSquare,
    tone: 'cyan',
  },
]

const revenuePoints = [
  { label: '24/04', value: 5.8 },
  { label: '25/04', value: 8 },
  { label: '26/04', value: 4.6 },
  { label: '27/04', value: 6.8 },
  { label: '28/04', value: 10.8 },
  { label: '29/04', value: 7.2 },
  { label: '30/04', value: 11 },
]

const latestOrders = [
  { code: '#DH2504300001', customer: 'Nguyễn Văn A', time: '10:30 AM', status: 'Chờ xác nhận', amount: '1.996.000đ', tone: 'pending' },
  { code: '#DH2504300002', customer: 'Trần Thị B', time: '09:15 AM', status: 'Đã xác nhận', amount: '950.000đ', tone: 'confirmed' },
  { code: '#DH2504300003', customer: 'Lê Văn C', time: '08:45 AM', status: 'Đang giao', amount: '2.450.000đ', tone: 'shipping' },
  { code: '#DH2504300004', customer: 'Phạm Thị D', time: '08:20 AM', status: 'Hoàn thành', amount: '780.000đ', tone: 'completed' },
  { code: '#DH2504300005', customer: 'Hoàng Văn E', time: '07:50 AM', status: 'Đã hủy', amount: '0đ', tone: 'cancelled' },
]

const topProducts = [
  { name: 'Đá hoa cương 3D', sold: 120, texture: 'granite' },
  { name: 'Travertine', sold: 85, texture: 'travertine' },
  { name: 'Đá granite tự nhiên', sold: 68, texture: 'stone' },
]

const orderStatusStats = [
  { label: 'Chờ xác nhận', value: 32, percent: '25.6%', color: '#f8b72b' },
  { label: 'Đã xác nhận', value: 28, percent: '22.4%', color: '#3b82f6' },
  { label: 'Đang giao', value: 18, percent: '14.4%', color: '#8b5cf6' },
  { label: 'Hoàn thành', value: 42, percent: '33.6%', color: '#10b981' },
  { label: 'Đã hủy', value: 5, percent: '4.0%', color: '#ef4444' },
]

const quickStats = [
  { label: 'Sản phẩm hết hàng', value: 12, tone: 'danger', icon: Box },
  { label: 'Khách hàng mới', value: 24, tone: 'success', icon: Users },
  { label: 'Bài viết', value: 15, tone: 'info', icon: FileText },
  { label: 'Video', value: 8, tone: 'blue', icon: Video },
]

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
      eyebrow: 'Tổng quan',
      description: 'Theo dõi nhanh hoạt động quản trị Thiên Đông Việt Nam.',
    }
  }

  if (activeSection.value === 'navigation') {
    return {
      label: 'Menu',
      eyebrow: 'Quản lý nội dung',
      description: 'Quản lý cây menu, nhãn, liên kết và thứ tự hiển thị.',
    }
  }

  const config = ADMIN_SECTION_INDEX[activeSection.value]
  return {
    label: sectionLabelOverrides[activeSection.value] || config?.label || 'Dashboard',
    eyebrow: config?.eyebrow || 'Admin module',
    description: config?.description || '',
  }
})

const currentTitle = computed(() => currentSectionMeta.value.label)
const currentBreadcrumb = computed(() => (activeSection.value === 'dashboard' ? 'Dashboard / Tổng quan' : `Dashboard / ${currentSectionMeta.value.label}`))
const userLabel = computed(() => currentUser.value?.full_name || currentUser.value?.username || 'Admin Admin')
const userRole = computed(() => {
  const role = String(currentUser.value?.role || '').toLowerCase()
  return role === 'admin' || !role ? 'Quản trị viên' : role
})
const isUnsupportedSection = computed(() => false) // All sections are now supported
const unsupportedSectionMeta = computed(() => null)

const revenuePolylinePoints = computed(() => {
  const maxValue = 12
  return revenuePoints
    .map((point, index) => {
      const x = 40 + index * 96
      const y = 250 - (point.value / maxValue) * 210
      return `${x},${y}`
    })
    .join(' ')
})

const revenueAreaPoints = computed(() => `40,250 ${revenuePolylinePoints.value} 616,250`)

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
      <header class="topbar">
        <div class="title-panel">
          <button class="sidebar-toggle" type="button" aria-label="Open sidebar" @click="isSidebarOpen = true">
            <Menu :size="22" />
          </button>
          <p class="breadcrumb-mini">{{ currentBreadcrumb }}</p>
        </div>

        <div class="session-panel">
          <button class="topbar-icon-btn" type="button" aria-label="Tìm kiếm">
            <Search :size="22" />
          </button>
          <button class="topbar-icon-btn topbar-icon-btn--notify" type="button" aria-label="Thông báo">
            <Bell :size="21" />
            <span>3</span>
          </button>
          <div class="admin-profile">
            <div class="admin-avatar">
              <UserCircle :size="26" />
            </div>
            <div>
              <strong>{{ userLabel }}</strong>
              <span>{{ userRole }}</span>
            </div>
            <ChevronDown :size="18" />
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
            <h1>Xin chào, Admin!</h1>
            <p>Chào mừng bạn trở lại trang quản trị Thiên Đông Việt Nam.</p>
          </div>
          <button class="date-range" type="button">
            <CalendarDays :size="18" />
            <span>30/04/2026 - 30/04/2026</span>
            <ChevronDown :size="16" />
          </button>
        </div>

        <div class="kpi-grid">
          <article v-for="card in dashboardKpis" :key="card.title" class="kpi-card" :class="`kpi-card--${card.tone}`">
            <span class="kpi-card__icon">
              <component :is="card.icon" :size="30" stroke-width="1.8" />
            </span>
            <div>
              <p>{{ card.title }}</p>
              <strong>{{ card.value }}</strong>
              <span>↑ {{ card.growth }} so với kỳ trước</span>
            </div>
          </article>
        </div>

        <div class="dashboard-main-grid">
          <article class="dashboard-card revenue-card">
            <div class="dashboard-card__head">
              <h2>Doanh thu theo ngày</h2>
              <button class="small-select" type="button">
                7 ngày qua
                <ChevronDown :size="16" />
              </button>
            </div>
            <div class="chart-wrap">
              <svg viewBox="0 0 660 300" role="img" aria-label="Biểu đồ doanh thu theo ngày">
                <defs>
                  <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.26" />
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.04" />
                  </linearGradient>
                </defs>
                <g class="chart-grid">
                  <line v-for="tick in [40, 82, 124, 166, 208, 250]" :key="`h-${tick}`" x1="40" x2="616" :y1="tick" :y2="tick" />
                  <line v-for="tick in [40, 136, 232, 328, 424, 520, 616]" :key="`v-${tick}`" :x1="tick" :x2="tick" y1="40" y2="250" />
                </g>
                <g class="chart-axis">
                  <text x="7" y="254">0</text>
                  <text x="2" y="212">2M</text>
                  <text x="2" y="170">4M</text>
                  <text x="2" y="128">6M</text>
                  <text x="2" y="86">8M</text>
                  <text x="-2" y="44">12M</text>
                  <text v-for="(point, index) in revenuePoints" :key="point.label" :x="36 + index * 96" y="284">{{ point.label }}</text>
                </g>
                <polygon :points="revenueAreaPoints" fill="url(#revenue-fill)" />
                <polyline :points="revenuePolylinePoints" fill="none" stroke="#3b82f6" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle
                  v-for="(point, index) in revenuePoints"
                  :key="`dot-${point.label}`"
                  :cx="40 + index * 96"
                  :cy="250 - (point.value / 12) * 210"
                  r="5"
                  fill="#3b82f6"
                  stroke="#fff"
                  stroke-width="2"
                />
                <g class="chart-legend">
                  <rect x="300" y="18" width="18" height="10" rx="2" fill="#3b82f6" />
                  <text x="326" y="27">Doanh thu (đ)</text>
                </g>
              </svg>
            </div>
          </article>

          <article class="dashboard-card latest-orders-card">
            <div class="dashboard-card__head">
              <h2>Đơn hàng mới nhất</h2>
              <button class="link-button" type="button" @click="handleSectionChange('orders')">Xem tất cả</button>
            </div>
            <div class="latest-order-list">
              <div v-for="item in latestOrders" :key="item.code" class="latest-order-row">
                <span class="latest-order-row__icon">
                  <ShoppingBag :size="17" />
                </span>
                <strong>{{ item.code }}</strong>
                <span>{{ item.customer }}</span>
                <span>{{ item.time }}</span>
                <em :class="`status-badge status-badge--${item.tone}`">{{ item.status }}</em>
                <b>{{ item.amount }}</b>
              </div>
            </div>
          </article>
        </div>

        <div class="dashboard-bottom-grid">
          <article class="dashboard-card top-products-card">
            <div class="dashboard-card__head">
              <h2>Sản phẩm bán chạy</h2>
              <button class="link-button" type="button" @click="handleSectionChange('products')">Xem tất cả</button>
            </div>
            <div class="top-product-list">
              <div v-for="(item, index) in topProducts" :key="item.name" class="top-product-row">
                <span class="top-product-row__rank">{{ index + 1 }}</span>
                <span class="product-thumb" :class="`product-thumb--${item.texture}`"></span>
                <div>
                  <strong>{{ item.name }}</strong>
                  <p>Đã bán: {{ item.sold }}</p>
                </div>
              </div>
            </div>
          </article>

          <article class="dashboard-card status-card">
            <h2>Đơn hàng theo trạng thái</h2>
            <div class="status-card__body">
              <div class="donut-chart" aria-hidden="true"></div>
              <div class="status-legend">
                <div v-for="item in orderStatusStats" :key="item.label">
                  <span :style="{ backgroundColor: item.color }"></span>
                  <p>{{ item.label }}</p>
                  <strong>{{ item.value }} ({{ item.percent }})</strong>
                </div>
              </div>
            </div>
          </article>

          <article class="dashboard-card quick-stats-card">
            <h2>Thống kê nhanh</h2>
            <div class="quick-stat-list">
              <div v-for="item in quickStats" :key="item.label" class="quick-stat-row" :class="`quick-stat-row--${item.tone}`">
                <span>
                  <component :is="item.icon" :size="18" />
                </span>
                <p>{{ item.label }}</p>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
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

      <SiteSettingsManager
        v-else-if="activeSection === 'site_settings'"
        :token="token"
        :active="true"
        @notify-success="setSuccess"
        @notify-error="setError"
        @clear-notify="clearMessages"
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

.admin-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}

.admin-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eef4fb;
  color: #64748b;
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
  font-size: 28px;
  line-height: 1;
  font-weight: 900;
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
</style>






