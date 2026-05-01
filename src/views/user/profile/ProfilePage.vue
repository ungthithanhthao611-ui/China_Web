<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Headset,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Upload,
  User,
  UserCircle2,
  Wallet,
  XCircle,
} from 'lucide-vue-next'

import { useAuthStore } from '@/views/user/stores/auth'
import { getMyOrders } from '@/views/user/services/ordersApi'
import {
  changeMyPassword,
  updateMyProfile,
  uploadMyAvatar,
} from '@/views/user/services/profileApi'
import { resolveImageWithFallback, applyImageFallback } from '@/views/user/utils/imageFallback'
import {
  cleanText,
  formatCurrencyVnd,
  formatDate,
  formatDateTime,
  formatProductCount,
  getOrderItemCount,
  getOrderRecipientName,
  getOrderStatusMeta,
  getOrderTotalLabel,
  getPaymentStatusMeta,
  resolveOrderItemDisplayPrice,
} from '@/views/user/orders/orderUi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const VALID_TABS = ['overview', 'edit', 'security', 'orders']
const ORDER_PAGE_SIZE = 4
const FALLBACK_TEXT = 'Chưa cập nhật'

const loading = ref(true)
const pageErrorMessage = ref('')
const successMessage = ref('')
const orderErrorMessage = ref('')
const avatarFailed = ref(false)
const avatarUploading = ref(false)
const profileSaving = ref(false)
const passwordSaving = ref(false)
const ordersLoading = ref(false)

const activeTab = ref('overview')
const orderHistory = ref([])
const orderHistoryTotal = ref(0)
const currentOrderPage = ref(1)

const profileForm = ref({
  email: '',
  username: '',
  full_name: '',
  phone: '',
  address: '',
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const tabs = [
  { id: 'overview', label: 'Tổng quan', icon: UserCircle2 },
  { id: 'edit', label: 'Chỉnh sửa thông tin', icon: Save },
  { id: 'security', label: 'Đổi mật khẩu', icon: KeyRound },
  { id: 'orders', label: 'Đơn hàng / mua hàng', icon: ShoppingBag },
]

const supportItems = [
  {
    title: 'Bảo mật thông tin',
    description: 'Thông tin của bạn được bảo mật tuyệt đối',
    icon: ShieldCheck,
  },
  {
    title: 'Giao hàng toàn quốc',
    description: 'Đơn hàng được giao nhanh chóng',
    icon: Truck,
  },
  {
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ hỗ trợ luôn sẵn sàng',
    icon: Headset,
  },
  {
    title: 'Thanh toán an toàn',
    description: 'Hệ thống thanh toán bảo mật',
    icon: Wallet,
  },
]

const user = computed(() => authStore.user || null)
const hasProfile = computed(() => Boolean(user.value?.id || user.value?.email))
const loginHistory = computed(() =>
  Array.isArray(user.value?.login_history) ? user.value.login_history : [],
)
const loginHistoryCount = computed(() =>
  Number(user.value?.login_history_count || loginHistory.value.length || 0),
)

const displayName = computed(() => {
  return (
    cleanText(user.value?.full_name) ||
    cleanText(user.value?.username) ||
    cleanText(user.value?.email) ||
    'Nguyễn Văn A'
  )
})

const displayEmail = computed(() => cleanText(user.value?.email) || FALLBACK_TEXT)
const username = computed(() => cleanText(user.value?.username) || FALLBACK_TEXT)
const fullName = computed(() => cleanText(user.value?.full_name) || FALLBACK_TEXT)
const phone = computed(() => cleanText(user.value?.phone) || FALLBACK_TEXT)
const address = computed(() => cleanText(user.value?.address) || FALLBACK_TEXT)
const role = computed(() => cleanText(user.value?.role) || 'Người dùng')
const avatarUrl = computed(() => resolveImageWithFallback(user.value?.avatar_url))
const createdAt = computed(() => formatDateTime(user.value?.created_at))
const updatedAt = computed(() => formatDateTime(user.value?.updated_at))
const lastLoginAt = computed(() => formatDateTime(user.value?.last_login_at))

const accountStatus = computed(() => {
  if (user.value?.is_active === true) return 'Đang hoạt động'
  if (user.value?.is_active === false) return 'Đã bị khóa'
  return FALLBACK_TEXT
})

const isActiveAccount = computed(() => user.value?.is_active === true)
const profileInitial = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')

const accountInfoRows = computed(() => [
  {
    key: 'username',
    icon: User,
    label: 'Tên đăng nhập',
    value: username.value,
  },
  {
    key: 'full_name',
    icon: UserCircle2,
    label: 'Họ và tên',
    value: fullName.value,
  },
  {
    key: 'email',
    icon: Mail,
    label: 'Email',
    value: displayEmail.value,
  },
  {
    key: 'phone',
    icon: Phone,
    label: 'Số điện thoại',
    value: phone.value,
  },
  {
    key: 'address',
    icon: MapPin,
    label: 'Địa chỉ',
    value: address.value,
  },
  {
    key: 'created_at',
    icon: CalendarDays,
    label: 'Ngày tạo tài khoản',
    value: createdAt.value,
  },
  {
    key: 'updated_at',
    icon: Clock3,
    label: 'Cập nhật gần nhất',
    value: updatedAt.value,
  },
  {
    key: 'status',
    icon: isActiveAccount.value ? CheckCircle2 : XCircle,
    label: 'Trạng thái tài khoản',
    value: accountStatus.value,
    tone: isActiveAccount.value ? 'success' : 'danger',
  },
  {
    key: 'role',
    icon: ShieldCheck,
    label: 'Phân quyền',
    value: role.value,
  },
])

const getOrderItemDisplayPrice = (item) => resolveOrderItemDisplayPrice(item)

const getOrderPreviewPricing = (order) => {
  const items = Array.isArray(order?.items) ? order.items : []
  const previewItem = items.find((entry) => getOrderItemDisplayPrice(entry).finalPrice > 0) || null

  if (!previewItem) {
    return {
      productName: '',
      extraItems: Math.max(0, items.length - 1),
      finalPriceLabel: '',
      originalPriceLabel: '',
      hasSale: false,
      hasPrice: false,
    }
  }

  const displayPrice = getOrderItemDisplayPrice(previewItem)

  return {
    productName: cleanText(previewItem?.product_name) || 'Sản phẩm trong đơn',
    extraItems: Math.max(0, items.length - 1),
    finalPriceLabel: formatCurrencyVnd(displayPrice.finalPrice),
    originalPriceLabel: displayPrice.hasSale ? formatCurrencyVnd(displayPrice.originalPrice) : '',
    hasSale: displayPrice.hasSale,
    hasPrice: displayPrice.finalPrice > 0,
  }
}

const normalizedOrders = computed(() =>
  orderHistory.value.map((item) => {
    const orderStatus = getOrderStatusMeta(item?.status)
    const paymentStatus = getPaymentStatusMeta(item?.payment_status)
    const itemCount = getOrderItemCount(item)
    const previewPricing = getOrderPreviewPricing(item)

    return {
      ...item,
      recipientName: getOrderRecipientName(item, displayName.value),
      itemCount,
      itemCountLabel: formatProductCount(itemCount),
      placedAtLabel: formatDateTime(item?.placed_at || item?.created_at),
      totalLabel: getOrderTotalLabel(item),
      orderStatus,
      paymentStatus,
      paymentLabel: paymentStatus.label,
      previewPricing,
    }
  }),
)

const totalOrderPages = computed(() => {
  return Math.max(1, Math.ceil(normalizedOrders.value.length / ORDER_PAGE_SIZE))
})

const paginatedOrders = computed(() => {
  const startIndex = (currentOrderPage.value - 1) * ORDER_PAGE_SIZE
  return normalizedOrders.value.slice(startIndex, startIndex + ORDER_PAGE_SIZE)
})

const orderPages = computed(() =>
  Array.from({ length: totalOrderPages.value }, (_, index) => index + 1),
)

const orderCountLabel = computed(() => {
  const total = Number(orderHistoryTotal.value || normalizedOrders.value.length || 0)
  return `${total} đơn hàng`
})

watch(
  () => normalizedOrders.value.length,
  () => {
    if (currentOrderPage.value > totalOrderPages.value) {
      currentOrderPage.value = totalOrderPages.value
    }
  },
)

watch(
  () => route.query.tab,
  (tabValue) => {
    const normalizedTab = cleanText(tabValue).toLowerCase()
    activeTab.value = VALID_TABS.includes(normalizedTab) ? normalizedTab : 'overview'
  },
  { immediate: true },
)

function setActiveTab(tabId) {
  if (!VALID_TABS.includes(tabId)) return

  activeTab.value = tabId
  const nextQuery = tabId === 'overview' ? {} : { tab: tabId }
  router.replace({ path: '/profile', query: nextQuery })
}

function clearMessages() {
  pageErrorMessage.value = ''
  successMessage.value = ''
}

function fillProfileForm() {
  profileForm.value = {
    email: user.value?.email || '',
    username: user.value?.username || '',
    full_name: user.value?.full_name || '',
    phone: user.value?.phone || '',
    address: user.value?.address || '',
  }
}

function resetPasswordForm() {
  passwordForm.value = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  }
}

function isAuthError(error) {
  return [401, 403, 404].includes(Number(error?.status))
}

function redirectToLogin() {
  router.replace({
    path: '/login',
    query: { redirect: route.fullPath || '/profile' },
  })
}

async function loadOrders() {
  ordersLoading.value = true
  orderErrorMessage.value = ''

  try {
    const response = await getMyOrders()
    orderHistory.value = Array.isArray(response?.items) ? response.items : []
    orderHistoryTotal.value = Number(response?.total || orderHistory.value.length || 0)
    currentOrderPage.value = 1
  } catch (error) {
    orderHistory.value = []
    orderHistoryTotal.value = 0
    orderErrorMessage.value =
      error?.message || 'Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.'
  } finally {
    ordersLoading.value = false
  }
}

async function loadProfile() {
  loading.value = true
  clearMessages()
  avatarFailed.value = false

  if (!authStore.token) {
    redirectToLogin()
    return
  }

  try {
    const profile = await authStore.fetchUser({
      logoutOnError: false,
      throwOnError: true,
    })

    authStore.setUser(profile)
    fillProfileForm()
    await loadOrders()
  } catch (error) {
    if (isAuthError(error)) {
      authStore.logout()
      redirectToLogin()
      return
    }

    pageErrorMessage.value =
      error?.message || 'Không thể tải thông tin trang cá nhân. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}

async function handleProfileSubmit() {
  clearMessages()
  profileSaving.value = true

  try {
    const updatedUser = await updateMyProfile(profileForm.value)
    authStore.setUser(updatedUser)
    fillProfileForm()
    successMessage.value = 'Cập nhật thông tin cá nhân thành công.'
    setActiveTab('overview')
  } catch (error) {
    pageErrorMessage.value =
      error?.message || 'Không thể cập nhật thông tin cá nhân.'
  } finally {
    profileSaving.value = false
  }
}

async function handlePasswordSubmit() {
  clearMessages()

  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    pageErrorMessage.value = 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
    return
  }

  passwordSaving.value = true

  try {
    const response = await changeMyPassword(passwordForm.value)
    successMessage.value = response?.message || 'Đổi mật khẩu thành công.'
    resetPasswordForm()
    setActiveTab('overview')
  } catch (error) {
    pageErrorMessage.value = error?.message || 'Không thể đổi mật khẩu.'
  } finally {
    passwordSaving.value = false
  }
}

async function handleAvatarChange(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  clearMessages()
  avatarUploading.value = true

  try {
    const updatedUser = await uploadMyAvatar(file, {
      title: displayName.value || 'avatar',
    })
    authStore.setUser(updatedUser)
    successMessage.value = 'Cập nhật ảnh đại diện thành công.'
  } catch (error) {
    pageErrorMessage.value = error?.message || 'Không thể tải ảnh đại diện lên.'
  } finally {
    avatarUploading.value = false
    if (event?.target) {
      event.target.value = ''
    }
  }
}

function goToOrderDetail(orderId) {
  router.push({
    name: 'OrderDetail',
    params: { id: orderId },
  })
}

function changeOrderPage(page) {
  if (page < 1 || page > totalOrderPages.value) return
  currentOrderPage.value = page
}

onMounted(loadProfile)
</script>

<template>
  <main class="profile-page">
    <section class="profile-hero">
      <div class="profile-hero__inner">
        <nav class="profile-breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/">Trang chủ</RouterLink>
          <span>/</span>
          <strong>Tài khoản</strong>
        </nav>
        <h1>Tài khoản của tôi</h1>
      </div>
    </section>

    <section class="profile-shell">
      <div v-if="loading" class="profile-state">
        <LoaderCircle class="profile-spinner" :size="30" />
        <p>Đang tải thông tin tài khoản...</p>
      </div>

      <div v-else-if="pageErrorMessage && !hasProfile" class="profile-state profile-state--error">
        <AlertCircle :size="34" />
        <h2>Không thể tải trang profile</h2>
        <p>{{ pageErrorMessage }}</p>
        <button type="button" class="profile-dark-btn" @click="loadProfile">
          Thử lại
        </button>
      </div>

      <div v-else-if="!hasProfile" class="profile-state">
        <User :size="34" />
        <h2>Chưa có dữ liệu tài khoản</h2>
        <p>Thông tin cá nhân của bạn hiện chưa sẵn sàng.</p>
      </div>

      <div v-else class="profile-layout">
        <aside class="profile-sidebar profile-surface">
          <div class="profile-sidebar__head">
            <div class="profile-sidebar__avatar">
              <img
                v-if="avatarUrl && !avatarFailed"
                :src="avatarUrl"
                :alt="displayName"
                @error="(event) => { avatarFailed = true; applyImageFallback(event) }"
              />
              <span v-else>{{ profileInitial }}</span>
            </div>

            <h2>{{ displayName }}</h2>
            <p>{{ displayEmail }}</p>

            <label class="profile-avatar-action" for="profile-avatar-input">
              <Upload :size="15" />
              <span>{{ avatarUploading ? 'Đang tải...' : 'Cập nhật ảnh' }}</span>
            </label>
            <input
              id="profile-avatar-input"
              class="profile-hidden-input"
              type="file"
              accept="image/*"
              :disabled="avatarUploading"
              @change="handleAvatarChange"
            />
          </div>

          <nav class="profile-nav">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              class="profile-nav__item"
              :class="{ 'is-active': activeTab === tab.id }"
              @click="setActiveTab(tab.id)"
            >
              <component :is="tab.icon" :size="18" />
              <span>{{ tab.label }}</span>
            </button>
          </nav>
        </aside>

        <div class="profile-content">
          <div v-if="pageErrorMessage || successMessage" class="profile-flash-stack">
            <div v-if="pageErrorMessage" class="profile-flash profile-flash--error">
              <AlertCircle :size="18" />
              <span>{{ pageErrorMessage }}</span>
            </div>
            <div v-if="successMessage" class="profile-flash profile-flash--success">
              <CheckCircle2 :size="18" />
              <span>{{ successMessage }}</span>
            </div>
          </div>

          <section v-if="activeTab === 'overview'" class="profile-card profile-card--content">
            <div class="profile-section-head">
              <div>
                <p class="profile-section-head__eyebrow">Thông tin tài khoản</p>
                <h3>Tổng quan</h3>
              </div>
              <button type="button" class="profile-outline-btn" @click="loadProfile">
                Làm mới
              </button>
            </div>

            <div class="profile-panels-grid">
              <section class="profile-panel">
                <div class="profile-panel__header">
                  <h4>Chi tiết tài khoản</h4>
                </div>

                <div class="profile-details">
                  <article v-for="row in accountInfoRows" :key="row.key" class="profile-detail">
                    <div class="profile-detail__icon">
                      <component :is="row.icon" :size="18" />
                    </div>
                    <div class="profile-detail__content">
                      <span>{{ row.label }}</span>
                      <strong :class="row.tone ? `is-${row.tone}` : ''">{{ row.value }}</strong>
                    </div>
                  </article>
                </div>
              </section>

              <section class="profile-panel">
                <div class="profile-panel__header">
                  <h4>Lịch sử đăng nhập</h4>
                  <span class="profile-pill">{{ loginHistoryCount }} bản ghi</span>
                </div>

                <div v-if="loginHistory.length" class="profile-timeline">
                  <article
                    v-for="item in loginHistory"
                    :key="item.id"
                    class="profile-timeline__item"
                  >
                    <div class="profile-timeline__dot"></div>
                    <div class="profile-timeline__body">
                      <div class="profile-timeline__row">
                        <strong>{{ formatDateTime(item.login_at) }}</strong>
                        <span>{{ cleanText(item.login_method) || 'password' }}</span>
                      </div>
                      <p><b>IP:</b> {{ cleanText(item.ip_address) || FALLBACK_TEXT }}</p>
                      <p><b>User-Agent:</b> {{ cleanText(item.user_agent) || FALLBACK_TEXT }}</p>
                    </div>
                  </article>
                </div>
                <div v-else class="profile-inline-empty">
                  <p>Chưa có dữ liệu lịch sử đăng nhập.</p>
                </div>
              </section>
            </div>
          </section>

          <section v-else-if="activeTab === 'edit'" class="profile-card profile-card--content">
            <div class="profile-section-head">
              <div>
                <p class="profile-section-head__eyebrow">Chỉnh sửa hồ sơ</p>
                <h3>Chỉnh sửa thông tin</h3>
              </div>
            </div>

            <form class="profile-form" @submit.prevent="handleProfileSubmit">
              <label class="profile-field">
                <span>Email</span>
                <input v-model="profileForm.email" type="email" required />
              </label>

              <label class="profile-field">
                <span>Tên đăng nhập</span>
                <input v-model="profileForm.username" type="text" />
              </label>

              <label class="profile-field">
                <span>Họ và tên</span>
                <input v-model="profileForm.full_name" type="text" />
              </label>

              <label class="profile-field">
                <span>Số điện thoại</span>
                <input v-model="profileForm.phone" type="text" />
              </label>

              <label class="profile-field profile-field--full">
                <span>Địa chỉ</span>
                <textarea v-model="profileForm.address" rows="5"></textarea>
              </label>

              <div class="profile-form__actions">
                <button type="button" class="profile-outline-btn" @click="fillProfileForm">
                  Khôi phục
                </button>
                <button type="submit" class="profile-dark-btn" :disabled="profileSaving">
                  <LoaderCircle v-if="profileSaving" :size="16" class="profile-spinner" />
                  <Save v-else :size="16" />
                  <span>{{ profileSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
                </button>
              </div>
            </form>
          </section>

          <section v-else-if="activeTab === 'security'" class="profile-card profile-card--content">
            <div class="profile-section-head">
              <div>
                <p class="profile-section-head__eyebrow">Bảo mật đăng nhập</p>
                <h3>Đổi mật khẩu</h3>
              </div>
            </div>

            <form class="profile-form" @submit.prevent="handlePasswordSubmit">
              <label class="profile-field profile-field--full">
                <span>Mật khẩu hiện tại</span>
                <input v-model="passwordForm.current_password" type="password" required />
              </label>

              <label class="profile-field">
                <span>Mật khẩu mới</span>
                <input v-model="passwordForm.new_password" type="password" required />
              </label>

              <label class="profile-field">
                <span>Nhập lại mật khẩu mới</span>
                <input v-model="passwordForm.confirm_password" type="password" required />
              </label>

              <div class="profile-security-note">
                <ShieldCheck :size="18" />
                <span>Sử dụng mật khẩu mạnh, tối thiểu 6 ký tự và khác mật khẩu hiện tại.</span>
              </div>

              <div class="profile-form__actions">
                <button type="button" class="profile-outline-btn" @click="resetPasswordForm">
                  Xóa nhanh
                </button>
                <button type="submit" class="profile-dark-btn" :disabled="passwordSaving">
                  <LoaderCircle v-if="passwordSaving" :size="16" class="profile-spinner" />
                  <KeyRound v-else :size="16" />
                  <span>{{ passwordSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu' }}</span>
                </button>
              </div>
            </form>
          </section>

          <template v-else>
            <section class="profile-card profile-card--content">
              <div class="profile-section-head profile-section-head--orders">
                <div>
                  <p class="profile-section-head__eyebrow">LỊCH SỬ GIAO DỊCH</p>
                  <h3>Đơn hàng / lịch sử mua hàng</h3>
                </div>

                <span class="profile-orders-badge">
                  <ShoppingBag :size="16" />
                  {{ orderCountLabel }}
                </span>
              </div>

              <div v-if="ordersLoading" class="profile-orders-state">
                <LoaderCircle class="profile-spinner" :size="26" />
                <p>Đang tải lịch sử đơn hàng...</p>
              </div>

              <div v-else-if="orderErrorMessage" class="profile-orders-state profile-orders-state--error">
                <AlertCircle :size="26" />
                <p>{{ orderErrorMessage }}</p>
                <button type="button" class="profile-outline-btn" @click="loadOrders">
                  Thử lại
                </button>
              </div>

              <div v-else-if="normalizedOrders.length" class="profile-orders-board">
                <div class="profile-orders-table-head">
                  <span>MÃ ĐƠN HÀNG</span>
                  <span>NGƯỜI NHẬN</span>
                  <span>TỔNG THANH TOÁN</span>
                  <span>TRẠNG THÁI</span>
                  <span>THAO TÁC</span>
                </div>

                <article
                  v-for="item in paginatedOrders"
                  :key="item.id"
                  class="profile-order-row"
                >
                  <div class="profile-order-cell profile-order-cell--code">
                    <span class="profile-order-cell__label">Mã đơn hàng</span>
                    <strong>{{ cleanText(item.code) || `#${item.id}` }}</strong>
                    <small>
                      <CalendarDays :size="14" />
                      {{ item.placedAtLabel }}
                    </small>
                  </div>

                  <div class="profile-order-cell">
                    <span class="profile-order-cell__label">Người nhận</span>
                    <strong>{{ item.recipientName }}</strong>
                    <small>
                      <Package :size="14" />
                      {{ item.itemCountLabel }}
                    </small>
                  </div>

                  <div class="profile-order-cell">
                    <span class="profile-order-cell__label">Tổng thanh toán</span>
                    <strong>{{ item.totalLabel }}</strong>
                    <small class="profile-order-cell__payment">
                      {{ item.paymentLabel }}
                    </small>
                    <div v-if="item.previewPricing.hasPrice" class="profile-order-price-preview">
                      <span class="profile-order-price-preview__label">Giá sản phẩm</span>
                      <p class="profile-order-price-preview__name">
                        {{ item.previewPricing.productName }}
                        <span v-if="item.previewPricing.extraItems > 0">
                          + {{ item.previewPricing.extraItems }} sản phẩm khác
                        </span>
                      </p>
                      <div
                        v-if="item.previewPricing.hasSale"
                        class="profile-order-price-preview__badges"
                      >
                        <span class="profile-order-price-preview__badge profile-order-price-preview__badge--sale">Giá khuyến mãi</span>
                        <span class="profile-order-price-preview__badge profile-order-price-preview__badge--original">Giá gốc</span>
                      </div>
                      <strong
                        class="profile-order-price-preview__current"
                        :class="{ 'profile-order-price-preview__current--sale': item.previewPricing.hasSale }"
                      >
                        {{ item.previewPricing.finalPriceLabel }}
                      </strong>
                      <small v-if="item.previewPricing.hasSale" class="profile-order-price-preview__original">
                        {{ item.previewPricing.originalPriceLabel }}
                      </small>
                    </div>
                  </div>

                  <div class="profile-order-cell profile-order-cell--status">
                    <span class="profile-order-cell__label">Trạng thái</span>
                    <div class="profile-order-status-stack">
                      <span
                        class="profile-order-status-pill"
                        :style="{
                          background: item.orderStatus.background,
                          color: item.orderStatus.color,
                        }"
                      >
                        {{ item.orderStatus.label }}
                      </span>
                      <span
                        class="profile-order-status-pill"
                        :style="{
                          background: item.paymentStatus.background,
                          color: item.paymentStatus.color,
                        }"
                      >
                        {{ item.paymentStatus.label }}
                      </span>
                    </div>
                  </div>

                  <div class="profile-order-cell profile-order-cell--action">
                    <span class="profile-order-cell__label">Thao tác</span>
                    <button
                      type="button"
                      class="profile-dark-btn profile-dark-btn--order"
                      @click="goToOrderDetail(item.id)"
                    >
                      <Eye :size="16" />
                      <span>Xem chi tiết</span>
                    </button>
                  </div>
                </article>

                <div class="profile-pagination">
                  <button
                    type="button"
                    class="profile-pagination__btn"
                    :disabled="currentOrderPage === 1"
                    @click="changeOrderPage(currentOrderPage - 1)"
                  >
                    <ArrowLeft :size="16" />
                  </button>

                  <button
                    v-for="page in orderPages"
                    :key="page"
                    type="button"
                    class="profile-pagination__btn"
                    :class="{ 'is-active': page === currentOrderPage }"
                    @click="changeOrderPage(page)"
                  >
                    {{ page }}
                  </button>

                  <button
                    type="button"
                    class="profile-pagination__btn"
                    :disabled="currentOrderPage === totalOrderPages"
                    @click="changeOrderPage(currentOrderPage + 1)"
                  >
                    <ArrowRight :size="16" />
                  </button>
                </div>
              </div>

              <div v-else class="profile-orders-state">
                <Package :size="28" />
                <h4>Bạn chưa có đơn hàng nào</h4>
                <p>Hãy mua sắm để tạo đơn hàng đầu tiên.</p>
                <RouterLink class="profile-dark-btn profile-dark-btn--link" to="/products">
                  Tiếp tục mua sắm
                </RouterLink>
              </div>
            </section>

            <section class="profile-card profile-card--promise">
              <article
                v-for="item in supportItems"
                :key="item.title"
                class="profile-promise"
              >
                <div class="profile-promise__icon">
                  <component :is="item.icon" :size="22" />
                </div>
                <h4>{{ item.title }}</h4>
                <p>{{ item.description }}</p>
              </article>
            </section>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #0f172a;
}

.profile-hero {
  background:
    radial-gradient(circle at right top, rgba(30, 41, 59, 0.54), transparent 34%),
    linear-gradient(135deg, #07152b 0%, #0f172a 100%);
  padding: 118px 24px 94px;
}

.profile-hero__inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.profile-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 15px;
  font-weight: 700;
}

.profile-breadcrumb a {
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
}

.profile-breadcrumb strong {
  color: #fbbf24;
}

.profile-hero h1 {
  margin: 18px 0 0;
  color: #fff;
  font-size: clamp(34px, 5vw, 50px);
  line-height: 1.12;
}

.profile-shell {
  width: min(1180px, calc(100% - 32px));
  margin: -46px auto 72px;
}

.profile-layout {
  display: grid;
  grid-template-columns: minmax(260px, 290px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.profile-content {
  display: grid;
  gap: 24px;
}

.profile-surface,
.profile-card,
.profile-state,
.profile-flash {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.profile-sidebar {
  overflow: hidden;
}

.profile-sidebar__head {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 28px 24px 24px;
  text-align: center;
  border-bottom: 1px solid #edf2f7;
}

.profile-sidebar__avatar {
  width: 132px;
  height: 132px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 28px;
  border: 4px solid #f8fafc;
  background:
    radial-gradient(circle at 65% 28%, rgba(251, 191, 36, 0.24), transparent 18%),
    linear-gradient(135deg, #eff6ff 0%, #fff7ed 100%);
  color: #0f172a;
  font-size: 48px;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.8);
}

.profile-sidebar__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-sidebar__head h2 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 18px;
  line-height: 1.4;
  word-break: break-word;
}

.profile-sidebar__head p {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  word-break: break-word;
}

.profile-avatar-action {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
  padding: 0 14px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.profile-avatar-action:hover {
  border-color: #cbd5e1;
  background: #fff;
}

.profile-hidden-input {
  display: none;
}

.profile-nav {
  display: grid;
  gap: 8px;
  padding: 16px;
}

.profile-nav__item {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #334155;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.profile-nav__item:hover {
  transform: translateY(-1px);
  background: #f8fafc;
}

.profile-nav__item.is-active {
  background: #0f172a;
  color: #fff;
}

.profile-card--content {
  padding: 32px;
}

.profile-card--promise {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  overflow: hidden;
}

.profile-promise {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 28px 22px;
  text-align: center;
}

.profile-promise + .profile-promise {
  border-left: 1px solid #edf2f7;
}

.profile-promise__icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #fff7ed;
  color: #d8ad62;
}

.profile-promise h4 {
  margin: 0;
  color: #0f172a;
  font-size: 18px;
}

.profile-promise p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.profile-section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
}

.profile-section-head--orders {
  align-items: center;
}

.profile-section-head__eyebrow {
  margin: 0 0 10px;
  color: #b58133;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.profile-section-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.15;
}

.profile-panels-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
  gap: 24px;
}

.profile-panel {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.profile-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.profile-panel__header h4 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.profile-details {
  display: grid;
  gap: 14px;
}

.profile-detail {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.profile-detail__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #fff7ed;
  color: #b58133;
}

.profile-detail__content span {
  display: block;
  margin-bottom: 6px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-detail__content strong {
  color: #0f172a;
  line-height: 1.7;
  word-break: break-word;
}

.profile-timeline {
  display: grid;
  gap: 16px;
}

.profile-timeline__item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 14px;
}

.profile-timeline__dot {
  width: 10px;
  height: 10px;
  margin-top: 9px;
  border-radius: 999px;
  background: #d8ad62;
  box-shadow: 0 0 0 6px rgba(216, 173, 98, 0.18);
}

.profile-timeline__body {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.profile-timeline__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.profile-timeline__row strong {
  color: #0f172a;
}

.profile-timeline__row span {
  color: #b58133;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-timeline__body p,
.profile-inline-empty p {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.7;
  word-break: break-word;
}

.profile-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.profile-field {
  display: grid;
  gap: 10px;
}

.profile-field span {
  color: #334155;
  font-size: 13px;
  font-weight: 800;
}

.profile-field input,
.profile-field textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid #d9dee7;
  background: #fff;
  color: #0f172a;
  font: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.profile-field input:focus,
.profile-field textarea:focus {
  border-color: #c7d2e1;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.06);
}

.profile-field textarea {
  resize: vertical;
}

.profile-field--full,
.profile-security-note,
.profile-form__actions {
  grid-column: 1 / -1;
}

.profile-security-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 14px;
  background: #fff7ed;
  border: 1px solid #f5dfb4;
  color: #8a5f1d;
}

.profile-form__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
}

.profile-dark-btn,
.profile-outline-btn,
.profile-avatar-action,
.profile-pagination__btn {
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.profile-dark-btn,
.profile-outline-btn {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: 10px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.profile-dark-btn {
  border: 0;
  background: #0f172a;
  color: #fff;
}

.profile-dark-btn:hover {
  background: #16233a;
  transform: translateY(-1px);
}

.profile-dark-btn--link {
  display: inline-flex;
}

.profile-dark-btn--order {
  min-width: 150px;
  border-radius: 999px;
}

.profile-outline-btn {
  border: 1px solid #d9dee7;
  background: #fff;
  color: #0f172a;
}

.profile-outline-btn:hover,
.profile-pagination__btn:hover:not(:disabled) {
  border-color: #c3ccd8;
  background: #f8fafc;
  transform: translateY(-1px);
}

.profile-flash-stack {
  display: grid;
  gap: 12px;
}

.profile-flash {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
}

.profile-flash--error {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fff7f7;
}

.profile-flash--success {
  color: #166534;
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.profile-pill,
.profile-orders-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: #fff7ed;
  color: #b58133;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.profile-orders-board {
  display: grid;
  gap: 16px;
}

.profile-orders-table-head,
.profile-order-row {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(0, 1.15fr) minmax(0, 1.1fr) minmax(0, 1.18fr) minmax(0, 0.92fr);
  gap: 18px;
  align-items: center;
}

.profile-orders-table-head {
  padding: 18px 22px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.profile-orders-table-head span {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.profile-order-row {
  min-height: 104px;
  padding: 20px 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.profile-order-cell {
  min-width: 0;
}

.profile-order-cell strong {
  display: block;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.5;
  word-break: break-word;
}

.profile-order-cell small {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.profile-order-cell__payment {
  color: #ea580c;
  font-weight: 600;
}

.profile-order-price-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.profile-order-price-preview__label {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.profile-order-price-preview__name {
  margin: 0;
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
}

.profile-order-price-preview__name span {
  color: #64748b;
  font-weight: 700;
}

.profile-order-price-preview__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.profile-order-price-preview__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.profile-order-price-preview__badge--sale {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.profile-order-price-preview__badge--original {
  background: #e2e8f0;
  color: #475569;
}

.profile-order-price-preview__current {
  display: block;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.4;
}

.profile-order-price-preview__current--sale {
  color: #dc2626;
}

.profile-order-price-preview__original {
  margin-top: 0 !important;
  color: #94a3b8 !important;
  font-size: 12px !important;
  font-weight: 700;
  text-decoration: line-through;
}

.profile-order-status-stack {
  display: grid;
  gap: 10px;
}

.profile-order-status-pill {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
}

.profile-order-cell--action {
  display: flex;
  justify-content: flex-end;
}

.profile-order-cell__label {
  display: none;
}

.profile-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.profile-pagination__btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid #d9dee7;
  background: #fff;
  color: #64748b;
  font-weight: 700;
  cursor: pointer;
}

.profile-pagination__btn.is-active {
  border-color: #0f172a;
  background: #0f172a;
  color: #fff;
}

.profile-pagination__btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.profile-orders-state,
.profile-state,
.profile-inline-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  text-align: center;
}

.profile-orders-state p,
.profile-state p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.profile-orders-state h4,
.profile-state h2 {
  margin: 0;
  color: #0f172a;
}

.profile-state {
  min-height: 320px;
  padding: 32px;
}

.profile-state--error,
.profile-orders-state--error {
  color: #b91c1c;
}

.profile-spinner {
  animation: profile-spin 1s linear infinite;
}

.is-success {
  color: #15803d;
}

.is-danger {
  color: #dc2626;
}

@keyframes profile-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1080px) {
  .profile-hero {
    padding: 104px 22px 82px;
  }

  .profile-shell {
    width: min(100% - 28px, 980px);
    margin-top: -40px;
  }

  .profile-card--content {
    padding: 28px 24px;
  }

  .profile-panels-grid,
  .profile-form {
    grid-template-columns: 1fr;
  }

  .profile-card--promise {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .profile-promise:nth-child(3),
  .profile-promise:nth-child(4) {
    border-top: 1px solid #edf2f7;
  }

  .profile-promise:nth-child(3) {
    border-left: 0;
  }
}

@media (max-width: 900px) {
  .profile-hero {
    padding: 92px 18px 72px;
  }

  .profile-hero h1 {
    font-size: clamp(28px, 4.8vw, 38px);
  }

  .profile-shell {
    width: min(100% - 24px, 820px);
    margin-top: -34px;
    margin-bottom: 48px;
  }

  .profile-layout {
    grid-template-columns: 1fr;
    gap: 18px;
    max-width: 760px;
    margin: 0 auto;
  }

  .profile-sidebar__head {
    padding: 22px 18px 18px;
  }

  .profile-sidebar__avatar {
    width: 96px;
    height: 96px;
    border-radius: 22px;
    font-size: 34px;
  }

  .profile-sidebar__head h2 {
    font-size: 17px;
  }

  .profile-sidebar__head p {
    font-size: 14px;
  }

  .profile-nav {
    gap: 6px;
    padding: 12px;
  }

  .profile-nav__item {
    min-height: 46px;
    padding: 0 14px;
    font-size: 14px;
  }

  .profile-card--content {
    padding: 24px 20px;
  }

  .profile-section-head {
    margin-bottom: 20px;
  }

  .profile-section-head h3 {
    font-size: clamp(24px, 4.2vw, 32px);
  }

  .profile-panel {
    padding: 18px;
  }

  .profile-detail {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
  }

  .profile-detail__icon {
    width: 40px;
    height: 40px;
  }

  .profile-orders-badge,
  .profile-pill {
    min-height: 38px;
    padding: 0 14px;
    font-size: 13px;
  }

  .profile-orders-table-head {
    display: none;
  }

  .profile-order-row {
    grid-template-columns: 1fr;
    gap: 14px;
    min-height: 0;
    padding: 16px 18px;
  }

  .profile-order-cell__label {
    display: block;
    margin-bottom: 6px;
    color: #64748b;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .profile-order-cell strong {
    font-size: 15px;
  }

  .profile-order-cell small {
    margin-top: 6px;
    font-size: 12px;
  }

  .profile-order-price-preview {
    margin-top: 10px;
    padding: 12px 14px;
  }

  .profile-order-price-preview__name {
    font-size: 12px;
  }

  .profile-order-price-preview__current {
    font-size: 14px;
  }

  .profile-order-status-pill {
    min-height: 30px;
    padding: 0 10px;
    font-size: 12px;
  }

  .profile-order-cell--action {
    justify-content: stretch;
  }

  .profile-dark-btn--order {
    width: 100%;
    min-width: 0;
    border-radius: 10px;
  }

  .profile-card--promise {
    max-width: 760px;
    margin: 0 auto;
  }

  .profile-promise {
    padding: 22px 18px;
  }

  .profile-promise h4 {
    font-size: 16px;
  }

  .profile-promise p {
    font-size: 14px;
  }
}

@media (max-width: 640px) {
  .profile-hero {
    padding: 82px 14px 62px;
  }

  .profile-shell {
    width: min(100% - 20px, 720px);
    margin-top: -26px;
    margin-bottom: 42px;
  }

  .profile-card--content {
    padding: 18px 16px;
  }

  .profile-card--promise {
    grid-template-columns: 1fr;
  }

  .profile-promise + .profile-promise,
  .profile-promise:nth-child(3),
  .profile-promise:nth-child(4) {
    border-left: 0;
    border-top: 1px solid #edf2f7;
  }

  .profile-sidebar__head {
    padding-left: 16px;
    padding-right: 16px;
  }

  .profile-sidebar__avatar {
    width: 82px;
    height: 82px;
    border-radius: 20px;
    font-size: 28px;
  }

  .profile-section-head,
  .profile-panel__header,
  .profile-timeline__row,
  .profile-form__actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-section-head h3 {
    font-size: 22px;
  }

  .profile-order-row {
    padding: 14px;
  }

  .profile-order-status-stack {
    gap: 6px;
  }

  .profile-pagination {
    flex-wrap: wrap;
  }

  .profile-pagination__btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    font-size: 13px;
  }

  .profile-dark-btn,
  .profile-outline-btn {
    width: 100%;
    min-height: 42px;
    font-size: 14px;
  }

  .profile-promise {
    padding: 18px 16px;
  }

  .profile-promise__icon {
    width: 46px;
    height: 46px;
  }

  .profile-promise h4 {
    font-size: 15px;
  }

  .profile-promise p {
    font-size: 13px;
    line-height: 1.6;
  }
}

@media (max-width: 480px) {
  .profile-hero h1 {
    font-size: 24px;
  }

  .profile-breadcrumb {
    font-size: 13px;
    gap: 8px;
  }

  .profile-card--content {
    padding: 16px 14px;
  }

  .profile-section-head__eyebrow {
    font-size: 11px;
    margin-bottom: 8px;
  }

  .profile-panel {
    padding: 14px;
  }

  .profile-detail {
    padding: 12px;
  }

  .profile-order-cell strong {
    font-size: 14px;
  }

  .profile-order-cell small {
    font-size: 11px;
  }

  .profile-order-price-preview {
    padding: 10px 12px;
  }

  .profile-order-price-preview__badge {
    min-height: 20px;
    font-size: 9px;
  }

  .profile-order-price-preview__current {
    font-size: 13px;
  }

  .profile-order-price-preview__original {
    font-size: 11px !important;
  }

  .profile-order-status-pill {
    min-height: 28px;
    font-size: 11px;
  }

  .profile-orders-badge,
  .profile-pill {
    min-height: 34px;
    padding: 0 12px;
    font-size: 12px;
  }
}
</style>
