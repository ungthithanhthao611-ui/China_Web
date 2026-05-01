<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Eye,
  Info,
  Loader2,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
} from 'lucide-vue-next'

import { useAuthStore } from '@/views/user/stores/auth'
import { useCartStore } from '@/views/user/stores/cart'
import { createMyOrder } from '@/views/user/services/ordersApi'
import { resolveImageWithFallback, applyImageFallback } from '@/views/user/utils/imageFallback'
import { resolveProductDisplayPrice, resolveStockQuantity } from '@/views/user/utils/productPricing'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const cartStore = useCartStore()

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const successOrder = ref(null)
const submitAttempted = ref(false)
const checkoutRequestId = ref('')

const form = reactive({
  fullName: '',
  address: '',
  phone: '',
  email: '',
  note: '',
  paymentMethod: 'cod',
})

const touched = reactive({
  fullName: false,
  address: false,
  phone: false,
  email: false,
  note: false,
})

const noteText = 'Nhân viên tư vấn sẽ liên hệ để xác nhận giá, phí vận chuyển và phương thức thanh toán phù hợp.'

const paymentMethodOptions = [
  {
    value: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Kiểm tra hàng và thanh toán trực tiếp khi đơn được giao tới nơi nhận.',
    icon: Truck,
    available: true,
    badge: 'Khuyến nghị',
  },
  {
    value: 'vnpay',
    label: 'Thanh toán qua VNPAY',
    description: 'Thanh toán online qua QR/ATM/thẻ. Tính năng sẽ được kích hoạt ở bước tiếp theo.',
    icon: CreditCard,
    available: false,
    badge: 'Sắp hỗ trợ',
  },
]

const paymentMethodLabels = {
  cod: 'Thanh toán khi nhận hàng',
  vnpay: 'Thanh toán qua VNPAY',
}

const assuranceItems = [
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
    icon: Phone,
  },
  {
    title: 'Thanh toán an toàn',
    description: 'Hệ thống thanh toán bảo mật',
    icon: CreditCard,
  },
]

const orderStatusLabels = {
  pending_confirmation: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Hoàn thành',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

const paymentStatusLabels = {
  unpaid: 'Chưa thanh toán',
  pending: 'Đang chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền',
}

const hasItems = computed(() => cartStore.items.length > 0)
const outOfStockItems = computed(() =>
  cartStore.items.filter((item) => resolveStockQuantity(item?.product) <= 0),
)
const exceededStockItems = computed(() =>
  cartStore.items.filter((item) => Number(item?.quantity || 0) > resolveStockQuantity(item?.product)),
)
const hasStockIssue = computed(
  () => outOfStockItems.value.length > 0 || exceededStockItems.value.length > 0,
)

const validationErrors = computed(() => {
  const errors = {
    fullName: '',
    address: '',
    phone: '',
    email: '',
    note: '',
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.'
  }

  if (!form.address.trim()) {
    errors.address = 'Vui lòng nhập địa chỉ nhận hàng.'
  }

  if (!form.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại.'
  } else if (!/^[0-9+\s().-]{8,20}$/.test(form.phone.trim())) {
    errors.phone = 'Số điện thoại không hợp lệ.'
  }

  if (!form.email.trim()) {
    errors.email = 'Vui lòng nhập email.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Email không hợp lệ.'
  }

  return errors
})

const isFormValid = computed(() => Object.values(validationErrors.value).every((value) => !value))
const hasContactPrice = computed(() => cartStore.items.some((item) => getUnitPrice(item) === null))
const subtotalAmount = computed(() =>
  cartStore.items.reduce((sum, item) => {
    const unitPrice = getUnitPrice(item)
    if (unitPrice === null) return sum
    return sum + unitPrice * Number(item?.quantity || 0)
  }, 0),
)
const subtotalText = computed(() =>
  hasContactPrice.value ? t('user.home.contactPrice') || 'Liên hệ báo giá' : formatPrice(subtotalAmount.value),
)
const canSubmit = computed(
  () => hasItems.value && isFormValid.value && !hasStockIssue.value && !submitting.value && !cartStore.loading,
)
const pageTitle = computed(() => (successOrder.value ? 'Thanh toán thành công' : 'Thanh toán'))
const successOrderItemCount = computed(() => getOrderItemCount(successOrder.value))
const successOrderTotalText = computed(() => getSuccessOrderTotalText(successOrder.value))
const successOrderStatusText = computed(() => getOrderStatusText(successOrder.value?.status))
const successPaymentStatusText = computed(() => getPaymentStatusText(successOrder.value?.payment_status))
const successPaymentMethodText = computed(() => getPaymentMethodText(successOrder.value?.payment_method))

function parsePrice(price) {
  const normalized = Number(price)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : null
}

function formatPrice(price) {
  const normalized = Number(price)
  if (!Number.isFinite(normalized)) {
    return t('user.home.contactPrice') || 'Liên hệ báo giá'
  }

  return `${new Intl.NumberFormat('vi-VN').format(normalized)}đ`
}

function normalizeStatusKey(value) {
  return String(value ?? '').trim().toLowerCase()
}

function getOrderStatusText(statusValue) {
  return orderStatusLabels[normalizeStatusKey(statusValue)] || 'Chờ xác nhận'
}

function getPaymentStatusText(statusValue) {
  return paymentStatusLabels[normalizeStatusKey(statusValue)] || 'Chưa thanh toán'
}

function getPaymentMethodText(methodValue) {
  return paymentMethodLabels[normalizeStatusKey(methodValue)] || 'Thanh toán khi nhận hàng'
}

function getOrderItemCount(order) {
  const directCount = Number(order?.item_count)
  if (Number.isFinite(directCount) && directCount > 0) {
    return directCount
  }

  return (Array.isArray(order?.items) ? order.items : []).reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0,
  )
}

function hasContactPriceItems(order) {
  const items = Array.isArray(order?.items) ? order.items : []
  return items.some((item) => {
    const unitPrice = Number(item?.unit_price)
    const lineTotal = Number(item?.line_total)
    return (!Number.isFinite(unitPrice) || unitPrice <= 0) && (!Number.isFinite(lineTotal) || lineTotal <= 0)
  })
}

function getSuccessOrderTotalText(order) {
  const amount = Number(order?.total_amount)
  if ((!Number.isFinite(amount) || amount <= 0) && hasContactPriceItems(order)) {
    return 'Liên hệ'
  }

  return formatPrice(Number.isFinite(amount) ? amount : 0)
}

function getDisplayPrice(product) {
  return resolveProductDisplayPrice(product)
}

function getUnitPrice(item) {
  const price = getDisplayPrice(item?.product).finalPrice
  return price > 0 ? price : null
}

function getLinePrice(item) {
  const unitPrice = getUnitPrice(item)
  if (unitPrice === null) {
    return t('user.home.contactPrice') || 'Liên hệ báo giá'
  }

  return formatPrice(unitPrice * Number(item?.quantity || 0))
}

function getFieldError(field) {
  if (!submitAttempted.value && !touched[field]) {
    return ''
  }

  return validationErrors.value[field]
}

function markFieldTouched(field) {
  touched[field] = true
}

function touchAllFields() {
  Object.keys(touched).forEach((field) => {
    touched[field] = true
  })
}

function getProductImage(item) {
  return resolveImageWithFallback(
    item?.product?.image_url,
    item?.product?.primary_image_url,
  )
}

function buildCheckoutRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `checkout-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function resetCheckoutRequestId() {
  checkoutRequestId.value = buildCheckoutRequestId()
}

function getStockQuantity(item) {
  return resolveStockQuantity(item?.product)
}

function getStockLabel(item) {
  const stockQuantity = getStockQuantity(item)
  if (stockQuantity <= 0) {
    return 'Hết hàng'
  }

  return `Còn ${stockQuantity} sản phẩm`
}

function hasItemStockExceeded(item) {
  return Number(item?.quantity || 0) > getStockQuantity(item)
}

function hydrateFormFromUser() {
  const user = authStore.user || {}
  form.fullName = String(user.full_name || user.username || '').trim()
  form.phone = String(user.phone || '').trim()
  form.email = String(user.email || '').trim()
  form.address = String(user.address || '').trim()
}

async function loadCheckoutData() {
  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.initialize()
    if (!authStore.isAuthenticated) {
      router.replace({ path: '/login', query: { redirect: '/checkout' } })
      return
    }

    await authStore.fetchUser({
      logoutOnError: false,
      throwOnError: true,
    })
    hydrateFormFromUser()
    await cartStore.fetchCart()
    resetCheckoutRequestId()
  } catch (error) {
    errorMessage.value = error?.message || 'Không thể tải thông tin thanh toán.'
  } finally {
    loading.value = false
  }
}

async function submitOrder() {
  errorMessage.value = ''
  submitAttempted.value = true
  touchAllFields()

  if (!isFormValid.value) {
    return
  }

  if (!hasItems.value) {
    errorMessage.value = 'Giỏ hàng đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.'
    return
  }

  if (hasStockIssue.value) {
    errorMessage.value = 'Một số sản phẩm đã vượt tồn kho hoặc hết hàng. Vui lòng cập nhật lại giỏ hàng trước khi thanh toán.'
    await cartStore.fetchCart()
    return
  }

  submitting.value = true

  try {
    if (!checkoutRequestId.value) {
      resetCheckoutRequestId()
    }

    const createdOrder = await createMyOrder({
      customer_name: form.fullName.trim(),
      customer_phone: form.phone.trim(),
      customer_email: form.email.trim(),
      shipping_address: form.address.trim(),
      note: form.note.trim(),
      payment_method: form.paymentMethod,
      client_request_id: checkoutRequestId.value,
    })

    successOrder.value = createdOrder
    resetCheckoutRequestId()
    await cartStore.fetchCart()
  } catch (error) {
    errorMessage.value = error?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.'
    await cartStore.fetchCart()
  } finally {
    submitting.value = false
  }
}

function goToProfileOrders() {
  router.push('/profile?tab=orders')
}

function goToOrderDetail() {
  if (!successOrder.value?.id) {
    router.push('/profile?tab=orders')
    return
  }

  router.push(`/orders/${successOrder.value.id}`)
}

watch(
  () => authStore.user,
  () => {
    if (!successOrder.value) {
      hydrateFormFromUser()
    }
  },
)

onMounted(() => {
  loadCheckoutData()
})
</script>

<template>
  <main class="checkout-page">
    <section class="checkout-hero">
      <div class="checkout-container checkout-hero__content">
        <nav class="checkout-breadcrumb" aria-label="Breadcrumb">
          <router-link to="/">Trang chủ</router-link>
          <span>/</span>
          <span class="is-current">Thanh toán</span>
        </nav>
        <h1>{{ pageTitle }}</h1>
      </div>
    </section>

    <section class="checkout-shell">
      <div v-if="loading" class="checkout-state">
        <Loader2 class="spin" :size="34" />
        <p>Đang tải dữ liệu thanh toán...</p>
      </div>

      <div v-else-if="successOrder" class="checkout-success-wrap">
        <section class="checkout-success">
          <div class="checkout-success__icon-wrap" aria-hidden="true">
            <span class="checkout-success__dot checkout-success__dot--green"></span>
            <span class="checkout-success__dot checkout-success__dot--gold"></span>
            <span class="checkout-success__halo checkout-success__halo--outer"></span>
            <span class="checkout-success__halo checkout-success__halo--middle"></span>
            <span class="checkout-success__icon">
              <CheckCircle2 :size="54" stroke-width="2.6" />
            </span>
          </div>

          <div class="checkout-success__badge">
            <BadgeCheck :size="18" />
            <span>Đơn hàng đã được tạo thành công</span>
          </div>

          <h2>Đặt hàng thành công!</h2>
          <p class="checkout-success__description">
            Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được thông tin đơn hàng của bạn.
          </p>

          <div class="checkout-success__code-box">
            <span>Mã đơn hàng</span>
            <strong>{{ successOrder.code }}</strong>
          </div>

          <div class="checkout-success__note">
            <Info :size="20" />
            <p>{{ noteText }}</p>
          </div>

          <div class="checkout-success__grid">
            <article>
              <span class="checkout-success__stat-icon">
                <ClipboardList :size="24" />
              </span>
              <span class="checkout-success__stat-label">Trạng thái đơn</span>
              <strong class="checkout-status-pill">{{ successOrderStatusText }}</strong>
            </article>
            <article>
              <span class="checkout-success__stat-icon">
                <CreditCard :size="24" />
              </span>
              <span class="checkout-success__stat-label">Trạng thái thanh toán</span>
              <strong class="checkout-status-pill checkout-status-pill--payment">{{ successPaymentStatusText }}</strong>
            </article>
            <article>
              <span class="checkout-success__stat-icon">
                <Truck :size="24" />
              </span>
              <span class="checkout-success__stat-label">Phương thức thanh toán</span>
              <strong class="checkout-status-pill checkout-status-pill--method">{{ successPaymentMethodText }}</strong>
            </article>
            <article>
              <span class="checkout-success__stat-icon">
                <CircleDollarSign :size="24" />
              </span>
              <span class="checkout-success__stat-label">Tổng thanh toán</span>
              <strong>{{ successOrderTotalText }}</strong>
            </article>
            <article>
              <span class="checkout-success__stat-icon">
                <Package :size="24" />
              </span>
              <span class="checkout-success__stat-label">Số sản phẩm</span>
              <strong>{{ successOrderItemCount }}</strong>
            </article>
          </div>

          <div class="checkout-success__actions">
            <button type="button" class="checkout-primary checkout-primary--inline" @click="goToProfileOrders">
              <ClipboardList :size="18" />
              <span>XEM LỊCH SỬ ĐƠN HÀNG</span>
            </button>
            <button type="button" class="checkout-secondary" @click="goToOrderDetail">
              <Eye :size="18" />
              <span>XEM CHI TIẾT ĐƠN HÀNG</span>
            </button>
            <button type="button" class="checkout-secondary" @click="router.push('/products')">
              <ShoppingBag :size="18" />
              <span>TIẾP TỤC MUA SẮM</span>
            </button>
          </div>
        </section>

        <section class="checkout-assurance checkout-assurance--success">
          <article v-for="item in assuranceItems" :key="item.title" class="checkout-assurance__item">
            <span class="checkout-assurance__icon">
              <component :is="item.icon" :size="24" />
            </span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </section>
      </div>

      <div v-else-if="!hasItems" class="checkout-empty">
        <Package :size="42" />
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Hãy chọn thêm sản phẩm trước khi tạo đơn hàng.</p>
        <button type="button" class="checkout-primary checkout-primary--inline" @click="router.push('/products')">
          Đi đến danh sách sản phẩm
        </button>
      </div>

      <template v-else>
        <div class="checkout-grid">
          <section class="checkout-card checkout-card--form">
            <div class="checkout-card__title">
              <span class="checkout-card__icon">
                <User :size="22" />
              </span>
              <h2>THÔNG TIN THANH TOÁN</h2>
            </div>

            <div v-if="errorMessage" class="checkout-alert">
              <AlertCircle :size="18" />
              <span>{{ errorMessage }}</span>
            </div>

            <div v-if="hasStockIssue" class="checkout-alert checkout-alert--stock">
              <CircleAlert :size="18" />
              <div>
                <strong>Một số sản phẩm trong giỏ cần được cập nhật.</strong>
                <p v-if="outOfStockItems.length">Có sản phẩm đã hết hàng.</p>
                <p v-if="exceededStockItems.length">Có sản phẩm đang vượt quá số lượng tồn kho hiện tại.</p>
              </div>
            </div>

            <form id="checkout-form" class="checkout-form" novalidate @submit.prevent="submitOrder">
              <label class="checkout-field">
                <span>Họ và Tên <em class="required-mark">*</em></span>
                <div class="checkout-control">
                  <input
                    v-model="form.fullName"
                    type="text"
                    placeholder="Nhập họ và tên của bạn"
                    @blur="markFieldTouched('fullName')"
                  />
                </div>
                <small v-if="getFieldError('fullName')" class="checkout-field__error">{{ getFieldError('fullName') }}</small>
              </label>

              <label class="checkout-field">
                <span>Địa chỉ <em class="required-mark">*</em></span>
                <div class="checkout-control">
                  <input
                    v-model="form.address"
                    type="text"
                    placeholder="Nhập địa chỉ nhận hàng"
                    @blur="markFieldTouched('address')"
                  />
                </div>
                <small v-if="getFieldError('address')" class="checkout-field__error">{{ getFieldError('address') }}</small>
              </label>

              <label class="checkout-field">
                <span>Số điện thoại <em class="required-mark">*</em></span>
                <div class="checkout-control checkout-control--icon-right">
                  <input
                    v-model="form.phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    @blur="markFieldTouched('phone')"
                  />
                  <Phone :size="18" />
                </div>
                <small v-if="getFieldError('phone')" class="checkout-field__error">{{ getFieldError('phone') }}</small>
              </label>

              <label class="checkout-field">
                <span>Email <em class="required-mark">*</em></span>
                <div class="checkout-control checkout-control--icon-right">
                  <input
                    v-model="form.email"
                    type="email"
                    placeholder="Nhập email của bạn"
                    @blur="markFieldTouched('email')"
                  />
                  <Mail :size="18" />
                </div>
                <small v-if="getFieldError('email')" class="checkout-field__error">{{ getFieldError('email') }}</small>
              </label>

              <div class="checkout-subtitle">PHƯƠNG THỨC THANH TOÁN</div>

              <div class="checkout-payment-methods" role="radiogroup" aria-label="Phương thức thanh toán">
                <button
                  v-for="method in paymentMethodOptions"
                  :id="`checkout-payment-${method.value}`"
                  :key="method.value"
                  type="button"
                  class="checkout-payment-card"
                  :class="{
                    'is-active': form.paymentMethod === method.value,
                    'is-disabled': !method.available,
                  }"
                  :disabled="!method.available"
                  @click="form.paymentMethod = method.value"
                >
                  <span class="checkout-payment-card__icon">
                    <component :is="method.icon" :size="18" />
                  </span>
                  <span class="checkout-payment-card__content">
                    <span class="checkout-payment-card__head">
                      <strong>{{ method.label }}</strong>
                      <em>{{ method.badge }}</em>
                    </span>
                    <small>{{ method.description }}</small>
                  </span>
                </button>
              </div>

              <div class="checkout-info-box checkout-info-box--payment">
                <Info :size="18" />
                <p>
                  COD đang hoạt động hoàn chỉnh. VNPAY sẽ được triển khai ở bước tiếp theo sau khi hoàn tất API tạo giao dịch,
                  URL callback và luồng đối soát trạng thái thanh toán.
                </p>
              </div>

              <div class="checkout-subtitle">THÔNG TIN BỔ SUNG</div>

              <label class="checkout-field">
                <span>Ghi chú đơn hàng (tuỳ chọn)</span>
                <div class="checkout-control checkout-control--textarea">
                  <textarea
                    v-model="form.note"
                    rows="5"
                    placeholder="Nhập ghi chú cho đơn hàng (ví dụ: thời gian giao hàng, yêu cầu khác...)"
                    @blur="markFieldTouched('note')"
                  ></textarea>
                </div>
              </label>

              <div class="checkout-info-box">
                <Info :size="18" />
                <p>{{ noteText }}</p>
              </div>
            </form>
          </section>

          <aside class="checkout-card checkout-card--summary">
            <div class="checkout-card__title">
              <span class="checkout-card__icon">
                <ShoppingBag :size="22" />
              </span>
              <h2>ĐƠN HÀNG CỦA BẠN</h2>
            </div>

            <div class="checkout-summary-head">
              <span>SẢN PHẨM</span>
              <span>TẠM TÍNH</span>
            </div>

            <div class="checkout-summary-list">
              <article v-for="item in cartStore.items" :key="item.id" class="checkout-summary-item">
                <img :src="getProductImage(item)" :alt="item.product?.name || 'Sản phẩm'" @error="applyImageFallback" />
                <div class="checkout-summary-item__content">
                  <h3>{{ item.product?.name || 'Sản phẩm' }}</h3>
                  <p>x {{ item.quantity }}</p>
                  <small
                    class="checkout-summary-item__stock"
                    :class="{ 'checkout-summary-item__stock--danger': hasItemStockExceeded(item) || getStockQuantity(item) <= 0 }"
                  >
                    {{ getStockLabel(item) }}
                  </small>
                  <div class="checkout-summary-item__price">
                    <span class="checkout-summary-item__price-label">{{ t('user.products.priceLabel') }}</span>
                    <div v-if="getDisplayPrice(item.product).hasSale" class="checkout-summary-item__price-badges">
                      <span class="checkout-summary-item__price-badge checkout-summary-item__price-badge--sale">Giá khuyến mãi</span>
                      <span class="checkout-summary-item__price-badge checkout-summary-item__price-badge--original">Giá gốc</span>
                    </div>
                    <span
                      :class="{ 'checkout-summary-item__price-current--sale': getDisplayPrice(item.product).hasSale }"
                    >
                      {{ formatPrice(getUnitPrice(item)) }}{{ t('user.products.unitPriceSuffix') }}
                    </span>
                    <small v-if="getDisplayPrice(item.product).hasSale">
                      {{ formatPrice(getDisplayPrice(item.product).originalPrice) }}
                    </small>
                  </div>
                </div>
                <strong>{{ getLinePrice(item) }}</strong>
              </article>
            </div>

            <div class="checkout-total-row">
              <span>{{ t('user.home.subtotal') }}</span>
              <strong>{{ subtotalText }}</strong>
            </div>

            <div class="checkout-total-row checkout-total-row--grand">
              <span>Tổng</span>
              <strong>{{ subtotalText }}</strong>
            </div>

            <div class="checkout-summary-note">
              <Info :size="18" />
              <p>{{ noteText }}</p>
            </div>

            <button
              form="checkout-form"
              type="submit"
              class="checkout-primary"
              :disabled="!canSubmit"
            >
              <Loader2 v-if="submitting" class="spin" :size="18" />
              <ShoppingBag v-else :size="18" />
              <span>{{ submitting ? 'Đang gửi đơn...' : 'ĐẶT HÀNG' }}</span>
            </button>
          </aside>
        </div>

        <section class="checkout-assurance">
          <article v-for="item in assuranceItems" :key="item.title" class="checkout-assurance__item">
            <span class="checkout-assurance__icon">
              <component :is="item.icon" :size="20" />
            </span>
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #132238;
}

.checkout-container,
.checkout-shell {
  width: calc(100% - 104px);
  max-width: 860px;
  margin: 0 auto;
}

.checkout-hero {
  min-height: 132px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #07152b 0%, #0f172a 100%);
}

.checkout-hero__content {
  padding: 18px 0;
}

.checkout-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 600;
}

.checkout-breadcrumb a {
  color: #ffffff;
  text-decoration: none;
}

.checkout-breadcrumb .is-current {
  color: #d8ad62;
}

.checkout-hero h1 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(28px, 2.6vw, 40px);
  line-height: 1.12;
  font-weight: 800;
}

.checkout-shell {
  padding: 24px 0 32px;
}

.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(260px, 0.94fr);
  gap: 18px;
  align-items: start;
}

.checkout-card,
.checkout-state,
.checkout-empty,
.checkout-success,
.checkout-assurance {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.checkout-card--form,
.checkout-card--summary,
.checkout-state,
.checkout-empty,
.checkout-success {
  padding: 20px;
}

.checkout-card--summary {
  position: sticky;
  top: 100px;
}

.checkout-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.checkout-card__title h2 {
  margin: 0;
  color: #14213d;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.checkout-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #d8ad62;
}

.checkout-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 12px;
  line-height: 1.55;
}

.checkout-alert--stock {
  border-color: #fde68a;
  background: #fff8db;
  color: #92400e;
}

.checkout-alert--stock p {
  margin: 4px 0 0;
}

.checkout-form {
  display: grid;
  gap: 14px;
}

.checkout-field {
  display: grid;
  gap: 6px;
}

.checkout-field > span,
.checkout-subtitle {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.required-mark {
  color: #dc2626;
  font-style: normal;
}

.checkout-subtitle {
  margin-top: 4px;
  letter-spacing: 0.02em;
}

.checkout-control {
  display: flex;
  align-items: center;
  min-height: 40px;
  border: 1px solid #d9dee7;
  border-radius: 6px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.checkout-control--icon-right {
  padding-right: 12px;
}

.checkout-control--icon-right svg {
  flex-shrink: 0;
  color: #64748b;
}

.checkout-control--textarea {
  min-height: 96px;
}

.checkout-control:focus-within {
  border-color: #d8ad62;
  box-shadow: 0 0 0 4px rgba(216, 173, 98, 0.14);
}

.checkout-control input,
.checkout-control textarea {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
  font: inherit;
}

.checkout-control input {
  height: 40px;
  padding: 0 12px;
  font-size: 13px;
}

.checkout-control textarea {
  min-height: 96px;
  padding: 10px 12px;
  font-size: 13px;
  resize: vertical;
}

.checkout-control input::placeholder,
.checkout-control textarea::placeholder {
  color: #94a3b8;
}

.checkout-field__error {
  color: #dc2626;
  font-size: 11px;
  line-height: 1.45;
}

.checkout-info-box,
.checkout-summary-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.65;
}

.checkout-info-box {
  border: 1px solid #f3d9ab;
  background: #fff7e8;
  color: #7c4a03;
}

.checkout-info-box--payment {
  border-color: #d7e4ff;
  background: linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%);
  color: #1e3a8a;
}

.checkout-payment-methods {
  display: grid;
  gap: 12px;
}

.checkout-payment-card {
  width: 100%;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px;
  border: 1px solid #d9dee7;
  border-radius: 14px;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease,
    opacity 0.2s ease;
}

.checkout-payment-card:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #d8ad62;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.checkout-payment-card.is-active {
  border-color: #d8ad62;
  background: linear-gradient(135deg, #fffaf0 0%, #ffffff 100%);
  box-shadow: 0 0 0 4px rgba(216, 173, 98, 0.14);
}

.checkout-payment-card.is-disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.checkout-payment-card__icon {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #fff7ed;
  color: #d97706;
}

.checkout-payment-card__content {
  display: grid;
  gap: 6px;
}

.checkout-payment-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.checkout-payment-card__head strong {
  color: #0f172a;
  font-size: 14px;
  line-height: 1.5;
}

.checkout-payment-card__head em {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.checkout-payment-card__content small {
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
}

.checkout-info-box p,
.checkout-summary-note p {
  margin: 0;
}

.checkout-summary-head,
.checkout-total-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.checkout-summary-head {
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.checkout-summary-list {
  display: grid;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #e5e7eb;
}

.checkout-summary-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.checkout-summary-item img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.checkout-summary-item__content {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.checkout-summary-item__content h3 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 700;
}

.checkout-summary-item__content p {
  margin: 0;
  color: #475569;
  font-size: 12px;
}

.checkout-summary-item__stock {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.checkout-summary-item__stock--danger {
  color: #b91c1c;
}

.checkout-summary-item__price {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.checkout-summary-item__price-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.checkout-summary-item__price-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.checkout-summary-item__price-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.checkout-summary-item__price-badge--sale {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.checkout-summary-item__price-badge--original {
  background: #e2e8f0;
  color: #475569;
}

.checkout-summary-item__price span {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.checkout-summary-item__price-current--sale {
  color: #dc2626 !important;
}

.checkout-summary-item__price small {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-decoration: line-through;
}

.checkout-summary-item strong,
.checkout-total-row strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}

.checkout-total-row {
  padding: 14px 0;
  border-bottom: 1px solid #e5e7eb;
  color: #334155;
  font-size: 13px;
}

.checkout-total-row--grand {
  padding-top: 16px;
  padding-bottom: 16px;
}

.checkout-total-row--grand span,
.checkout-total-row--grand strong {
  font-size: 15px;
  font-weight: 800;
}

.checkout-summary-note {
  margin: 10px 0 14px;
  border: 1px dashed #d7dde8;
  background: #fbfcfe;
  color: #475569;
}

.checkout-primary,
.checkout-secondary {
  width: 100%;
  min-height: 42px;
  border: 0;
  border-radius: 6px;
  font: inherit;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
}

.checkout-primary {
  color: #ffffff;
  background: #f07824;
}

.checkout-primary:hover:not(:disabled) {
  background: #df6b45;
  transform: translateY(-1px);
}

.checkout-primary:disabled,
.checkout-secondary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.checkout-primary--inline,
.checkout-secondary {
  width: auto;
  padding: 0 16px;
}

.checkout-secondary {
  border: 1px solid #d9dee7;
  background: #ffffff;
  color: #0f172a;
}

.checkout-secondary:hover:not(:disabled) {
  background: #f8fafc;
}

.checkout-assurance {
  margin-top: 18px;
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.checkout-assurance__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.checkout-assurance__icon {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 999px;
  background: #fff6e7;
  color: #d8ad62;
}

.checkout-assurance__item h3 {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}

.checkout-assurance__item p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.checkout-state,
.checkout-empty,
.checkout-success {
  text-align: center;
}

.checkout-state,
.checkout-empty {
  display: grid;
  gap: 14px;
  place-items: center;
}

.checkout-state p,
.checkout-empty p,
.checkout-success > p {
  margin: 0;
  color: #475569;
  line-height: 1.65;
}

.checkout-empty h2,
.checkout-success h2 {
  margin: 0;
  color: #0f172a;
}

.checkout-success {
  text-align: left;
}

.checkout-success__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  background: #eefbf4;
  color: #15803d;
  font-weight: 700;
}

.checkout-success h2 {
  margin: 18px 0 10px;
  font-size: 30px;
}

.checkout-success__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.checkout-success__grid article {
  padding: 18px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.checkout-success__grid span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
}

.checkout-success__grid strong {
  color: #0f172a;
  font-size: 18px;
}

.checkout-success__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }

  .checkout-card--summary {
    position: static;
  }

  .checkout-assurance {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .checkout-container,
  .checkout-shell {
    width: calc(100% - 84px);
    max-width: 780px;
  }

  .checkout-grid {
    grid-template-columns: minmax(0, 1.68fr) minmax(230px, 0.92fr);
    gap: 14px;
  }

  .checkout-card--form,
  .checkout-card--summary {
    padding: 16px;
  }
}

@media (min-width: 1280px) {
  .checkout-container,
  .checkout-shell {
    width: calc(100% - 176px);
    max-width: 660px;
  }

  .checkout-hero {
    min-height: 96px;
  }

  .checkout-hero__content {
    padding: 8px 0;
  }

  .checkout-hero h1 {
    font-size: clamp(20px, 1.45vw, 24px);
  }

  .checkout-breadcrumb {
    margin-bottom: 6px;
    font-size: 11px;
  }

  .checkout-grid {
    grid-template-columns: minmax(0, 1.64fr) minmax(200px, 0.88fr);
    gap: 12px;
  }

  .checkout-card--form,
  .checkout-card--summary,
  .checkout-state,
  .checkout-empty,
  .checkout-success {
    padding: 10px;
  }

  .checkout-card__title {
    gap: 7px;
    margin-bottom: 10px;
  }

  .checkout-card__title h2 {
    font-size: 12px;
  }

  .checkout-field > span,
  .checkout-subtitle,
  .checkout-total-row,
  .checkout-summary-item__content p,
  .checkout-summary-note,
  .checkout-info-box {
    font-size: 10px;
  }

  .checkout-control {
    min-height: 30px;
  }

  .checkout-control input {
    height: 30px;
    font-size: 11px;
  }

  .checkout-control textarea {
    min-height: 68px;
    font-size: 11px;
  }

  .checkout-summary-item {
    grid-template-columns: 38px minmax(0, 1fr) auto;
    gap: 7px;
  }

  .checkout-summary-item img {
    width: 38px;
    height: 38px;
  }

  .checkout-summary-item__content h3 {
    font-size: 10px;
  }

  .checkout-summary-item strong,
  .checkout-total-row strong {
    font-size: 11px;
  }

  .checkout-total-row--grand span,
  .checkout-total-row--grand strong {
    font-size: 12px;
  }

  .checkout-primary,
  .checkout-secondary {
    min-height: 34px;
    font-size: 11px;
  }

  .checkout-assurance {
    padding: 10px;
    gap: 7px;
  }

  .checkout-assurance__icon {
    width: 30px;
    height: 30px;
  }

  .checkout-assurance__item h3 {
    font-size: 11px;
  }

  .checkout-assurance__item p {
    font-size: 9px;
  }
}

@media (min-width: 1700px) {
  .checkout-container,
  .checkout-shell {
    width: calc(100% - 260px);
    max-width: 600px;
  }

  .checkout-grid {
    gap: 10px;
  }

  .checkout-card--form,
  .checkout-card--summary {
    padding: 9px;
  }
}

@media (max-width: 640px) {
  .checkout-shell,
  .checkout-container {
    width: min(1180px, calc(100% - 24px));
  }

  .checkout-hero {
    min-height: 140px;
  }

  .checkout-card--form,
  .checkout-card--summary,
  .checkout-state,
  .checkout-empty,
  .checkout-success {
    padding: 22px 18px;
  }

  .checkout-breadcrumb {
    gap: 8px;
    font-size: 14px;
    flex-wrap: wrap;
  }

  .checkout-summary-item {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .checkout-summary-item strong {
    grid-column: 2;
    justify-self: start;
    text-align: left;
  }

  .checkout-assurance {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .checkout-success__grid {
    grid-template-columns: 1fr;
  }

  .checkout-success__actions {
    flex-direction: column;
  }

  .checkout-primary--inline,
  .checkout-secondary {
    width: 100%;
  }
}

.checkout-page {
  background: #f6f7fb;
}

.checkout-container {
  width: min(1180px, calc(100% - 48px));
  max-width: 1180px;
}

.checkout-shell {
  width: min(1080px, calc(100% - 48px));
  max-width: 1080px;
  padding: 36px 0 40px;
}

.checkout-hero {
  min-height: 150px;
  background: #07152b;
}

.checkout-hero__content {
  padding: 22px 0;
}

.checkout-breadcrumb {
  margin-bottom: 14px;
  font-size: 14px;
  letter-spacing: 0;
}

.checkout-breadcrumb a {
  color: #ffffff;
}

.checkout-breadcrumb .is-current {
  color: #d8ad62;
}

.checkout-hero h1 {
  font-size: clamp(34px, 3vw, 46px);
  font-weight: 800;
}

.checkout-success-wrap {
  display: grid;
  gap: 24px;
}

.checkout-success {
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 48px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.checkout-success__icon-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 22px;
  display: grid;
  place-items: center;
}

.checkout-success__halo,
.checkout-success__icon {
  position: absolute;
  border-radius: 999px;
}

.checkout-success__halo--outer {
  inset: 0;
  background: #dcfce7;
  opacity: 0.5;
}

.checkout-success__halo--middle {
  inset: 14px;
  background: #bbf7d0;
}

.checkout-success__icon {
  inset: 28px;
  display: grid;
  place-items: center;
  background: #16a34a;
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(22, 163, 74, 0.24);
}

.checkout-success__dot {
  position: absolute;
  z-index: 2;
  width: 12px;
  height: 12px;
  border-radius: 999px;
}

.checkout-success__dot--green {
  top: 18px;
  right: 4px;
  background: #22c55e;
}

.checkout-success__dot--gold {
  left: 6px;
  bottom: 24px;
  width: 10px;
  height: 10px;
  background: #d8ad62;
}

.checkout-success__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 15px;
  font-weight: 700;
}

.checkout-success h2 {
  margin: 24px 0 12px;
  color: #0f172a;
  font-size: clamp(28px, 3.2vw, 40px);
  line-height: 1.15;
  font-weight: 800;
}

.checkout-success__description {
  max-width: 680px;
  margin: 0 auto;
  color: #64748b;
  font-size: 16px;
  line-height: 1.7;
}

.checkout-success__code-box {
  width: min(420px, 100%);
  margin: 26px auto 0;
  padding: 18px 32px;
  border: 1px solid #d9dee7;
  border-radius: 8px;
  background: #ffffff;
}

.checkout-success__code-box span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.checkout-success__code-box strong {
  display: block;
  color: #16a34a;
  font-size: clamp(24px, 2.8vw, 30px);
  line-height: 1.2;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.checkout-success__note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px 20px;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  background: #fff7ed;
  color: #9a3412;
  text-align: left;
}

.checkout-success__note svg {
  flex: 0 0 auto;
  color: #f97316;
}

.checkout-success__note p {
  margin: 0;
  color: #7c2d12;
  font-size: 15px;
  line-height: 1.65;
}

.checkout-success__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.checkout-success__grid article {
  min-width: 0;
  padding: 24px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
  text-align: center;
}

.checkout-success__stat-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eef2ff;
  color: #0f172a;
}

.checkout-success__stat-label {
  display: block;
  margin-bottom: 10px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.35;
}

.checkout-success__grid strong {
  color: #111827;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.checkout-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309 !important;
  font-size: 14px !important;
}

.checkout-status-pill--payment {
  background: #ffedd5;
  color: #ea580c !important;
}

.checkout-status-pill--method {
  background: #e0f2fe;
  color: #0369a1 !important;
}

.checkout-success__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding-top: 28px;
  border-top: 1px solid #e5e7eb;
}

.checkout-success__actions .checkout-primary,
.checkout-success__actions .checkout-secondary {
  width: auto;
  min-height: 50px;
  padding: 0 24px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.checkout-success__actions .checkout-primary {
  border: 1px solid #f97316;
  background: #f97316;
  color: #ffffff;
}

.checkout-success__actions .checkout-primary:hover:not(:disabled) {
  background: #ea580c;
  border-color: #ea580c;
}

.checkout-success__actions .checkout-secondary {
  border: 1px solid #0f172a;
  background: #ffffff;
  color: #0f172a;
}

.checkout-success__actions .checkout-secondary:hover:not(:disabled) {
  background: #0f172a;
  color: #ffffff;
}

.checkout-assurance--success {
  width: min(1000px, 100%);
  margin: 0 auto;
  padding: 28px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.08);
}

.checkout-assurance--success .checkout-assurance__item {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 0 22px;
  text-align: center;
}

.checkout-assurance--success .checkout-assurance__item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 8px;
  right: 0;
  width: 1px;
  height: calc(100% - 16px);
  background: #e5e7eb;
}

.checkout-assurance--success .checkout-assurance__icon {
  width: 56px;
  height: 56px;
  background: #fff7ed;
  color: #d8ad62;
}

.checkout-assurance--success .checkout-assurance__item h3 {
  margin: 0 0 6px;
  font-size: 16px;
}

.checkout-assurance--success .checkout-assurance__item p {
  max-width: 190px;
  margin: 0 auto;
  font-size: 13px;
  line-height: 1.55;
}

@media (max-width: 900px) {
  .checkout-container,
  .checkout-shell {
    width: min(100% - 32px, 1080px);
  }

  .checkout-success {
    padding: 36px 28px;
  }

  .checkout-success__grid,
  .checkout-assurance--success {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .checkout-success__actions {
    flex-wrap: wrap;
  }

  .checkout-success__actions .checkout-primary,
  .checkout-success__actions .checkout-secondary {
    flex: 1 1 calc(50% - 12px);
  }

  .checkout-assurance--success .checkout-assurance__item {
    padding: 18px;
  }

  .checkout-assurance--success .checkout-assurance__item:not(:last-child)::after {
    display: none;
  }
}

@media (max-width: 600px) {
  .checkout-container,
  .checkout-shell {
    width: min(100% - 24px, 1080px);
  }

  .checkout-shell {
    padding: 32px 0 36px;
  }

  .checkout-hero {
    min-height: 150px;
  }

  .checkout-hero h1 {
    font-size: 28px;
  }

  .checkout-success {
    padding: 20px;
  }

  .checkout-success__icon-wrap {
    width: 104px;
    height: 104px;
  }

  .checkout-success__icon {
    inset: 24px;
  }

  .checkout-success__badge {
    padding: 10px 14px;
    font-size: 13px;
  }

  .checkout-success h2 {
    font-size: 28px;
  }

  .checkout-success__description,
  .checkout-success__note p {
    font-size: 14px;
  }

  .checkout-success__code-box {
    padding: 16px;
  }

  .checkout-success__grid,
  .checkout-assurance--success {
    grid-template-columns: 1fr;
  }

  .checkout-payment-card {
    grid-template-columns: 1fr;
  }

  .checkout-payment-card__icon {
    width: 40px;
    height: 40px;
  }

  .checkout-success__actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .checkout-success__actions .checkout-primary,
  .checkout-success__actions .checkout-secondary {
    width: 100%;
    flex-basis: auto;
  }

  .checkout-assurance--success {
    padding: 22px 18px;
  }
}
</style>
