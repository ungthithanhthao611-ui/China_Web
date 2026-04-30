<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  LoaderCircle,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-vue-next'

import { useAuthStore } from '@/views/user/stores/auth'
import { getMyOrderById } from '@/views/user/services/ordersApi'
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
  getPaymentMethodLabel,
  getPaymentStatusMeta,
  resolveOrderItemDisplayPrice,
} from '@/views/user/orders/orderUi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const errorMessage = ref('')
const order = ref(null)

const orderId = computed(() => String(route.params.id || '').trim())
const orderStatus = computed(() => getOrderStatusMeta(order.value?.status))
const paymentStatus = computed(() => getPaymentStatusMeta(order.value?.payment_status))
const itemCount = computed(() => getOrderItemCount(order.value))
const recipientName = computed(() => getOrderRecipientName(order.value))

function redirectToLogin() {
  router.replace({
    path: '/login',
    query: { redirect: route.fullPath },
  })
}

function getOrderItemDisplayPrice(item) {
  return resolveOrderItemDisplayPrice(item)
}

function getOrderItemImage(item) {
  return resolveImageWithFallback(item?.product_image_url)
}

function productUnitPrice(item) {
  return getOrderItemDisplayPrice(item).finalPrice
}

function productLineTotal(item) {
  const storedTotal = Number(item?.line_total)
  if (Number.isFinite(storedTotal) && storedTotal > 0) {
    return formatCurrencyVnd(storedTotal)
  }

  return formatCurrencyVnd(productUnitPrice(item) * Number(item?.quantity || 0))
}

async function loadOrderDetail() {
  loading.value = true
  errorMessage.value = ''

  if (!authStore.token) {
    redirectToLogin()
    return
  }

  try {
    const record = await getMyOrderById(orderId.value)

    if (!record) {
      errorMessage.value = 'Không tìm thấy đơn hàng này hoặc bạn không có quyền xem.'
      return
    }

    order.value = record
  } catch (error) {
    if ([401, 403].includes(Number(error?.status))) {
      authStore.logout()
      redirectToLogin()
      return
    }

    errorMessage.value = error?.message || 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.'
  } finally {
    loading.value = false
  }
}

onMounted(loadOrderDetail)
</script>

<template>
  <main class="order-detail-page">
    <section class="order-detail-hero">
      <div class="order-detail-hero__inner">
        <nav class="order-detail-breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/">Trang chủ</RouterLink>
          <span>/</span>
          <RouterLink to="/profile?tab=orders">Tài khoản</RouterLink>
          <span>/</span>
          <strong>Chi tiết đơn hàng</strong>
        </nav>
        <h1>Chi tiết đơn hàng</h1>
      </div>
    </section>

    <section class="order-detail-shell">
      <div v-if="loading" class="order-detail-state">
        <LoaderCircle class="spin" :size="28" />
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>

      <div v-else-if="errorMessage" class="order-detail-state order-detail-state--error">
        <AlertCircle :size="28" />
        <p>{{ errorMessage }}</p>
        <div class="order-detail-state__actions">
          <button type="button" class="order-detail-btn order-detail-btn--ghost" @click="router.push('/profile?tab=orders')">
            Quay lại tài khoản
          </button>
          <button type="button" class="order-detail-btn" @click="loadOrderDetail">
            Thử lại
          </button>
        </div>
      </div>

      <div v-else-if="order" class="order-detail-content">
        <section class="order-detail-card">
          <div class="order-detail-card__header">
            <div>
              <p class="order-detail-card__eyebrow">Đơn hàng của bạn</p>
              <h2>{{ cleanText(order.code) || `#${order.id}` }}</h2>
              <span class="order-detail-card__date">
                <CalendarDays :size="16" />
                {{ formatDateTime(order.placed_at || order.created_at) }}
              </span>
            </div>

            <div class="order-detail-card__header-actions">
              <span
                class="order-status-pill"
                :style="{ background: orderStatus.background, color: orderStatus.color }"
              >
                {{ orderStatus.label }}
              </span>
              <span
                class="order-status-pill"
                :style="{ background: paymentStatus.background, color: paymentStatus.color }"
              >
                {{ paymentStatus.label }}
              </span>
            </div>
          </div>

          <div class="order-detail-summary">
            <article class="order-detail-summary__item">
              <span>Tổng thanh toán</span>
              <strong>{{ getOrderTotalLabel(order) }}</strong>
            </article>
            <article class="order-detail-summary__item">
              <span>Số lượng sản phẩm</span>
              <strong>{{ formatProductCount(itemCount) }}</strong>
            </article>
            <article class="order-detail-summary__item">
              <span>Thanh toán</span>
              <strong>{{ getPaymentMethodLabel(order) }}</strong>
            </article>
            <article class="order-detail-summary__item">
              <span>Cập nhật gần nhất</span>
              <strong>{{ formatDate(order.updated_at || order.created_at) }}</strong>
            </article>
          </div>
        </section>

        <section class="order-detail-grid">
          <article class="order-detail-card">
            <div class="order-detail-section-head">
              <User :size="18" />
              <h3>Thông tin người nhận</h3>
            </div>

            <div class="order-detail-list">
              <div class="order-detail-list__item">
                <span>Họ và tên</span>
                <strong>{{ recipientName }}</strong>
              </div>
              <div class="order-detail-list__item">
                <span>Số điện thoại</span>
                <strong>{{ cleanText(order.customer_phone) || 'Chưa cập nhật' }}</strong>
              </div>
              <div class="order-detail-list__item">
                <span>Email</span>
                <strong>{{ cleanText(order.customer_email) || 'Chưa cập nhật' }}</strong>
              </div>
            </div>
          </article>

          <article class="order-detail-card">
            <div class="order-detail-section-head">
              <CreditCard :size="18" />
              <h3>Thanh toán và ghi chú</h3>
            </div>

            <div class="order-detail-list">
              <div class="order-detail-list__item">
                <span>Phương thức thanh toán</span>
                <strong>{{ getPaymentMethodLabel(order) }}</strong>
              </div>
              <div class="order-detail-list__item">
                <span>Trạng thái thanh toán</span>
                <strong>{{ paymentStatus.label }}</strong>
              </div>
              <div class="order-detail-list__item order-detail-list__item--full">
                <span>Ghi chú</span>
                <strong>{{ cleanText(order.note) || 'Không có ghi chú cho đơn hàng này.' }}</strong>
              </div>
            </div>
          </article>
        </section>

        <section class="order-detail-card">
          <div class="order-detail-section-head">
            <MapPin :size="18" />
            <h3>Địa chỉ giao hàng</h3>
          </div>

          <p class="order-detail-address">
            {{ cleanText(order.shipping_address) || 'Chưa cập nhật địa chỉ giao hàng.' }}
          </p>

          <div class="order-detail-contact-row">
            <span>
              <Phone :size="15" />
              {{ cleanText(order.customer_phone) || 'Chưa cập nhật' }}
            </span>
            <span>
              <Mail :size="15" />
              {{ cleanText(order.customer_email) || 'Chưa cập nhật' }}
            </span>
          </div>
        </section>

        <section class="order-detail-card">
          <div class="order-detail-card__header order-detail-card__header--compact">
            <div class="order-detail-section-head">
              <ShoppingBag :size="18" />
              <h3>Sản phẩm trong đơn</h3>
            </div>
            <span class="order-detail-card__small-badge">{{ formatProductCount(itemCount) }}</span>
          </div>

          <div v-if="order.items?.length" class="order-products">
            <article v-for="item in order.items" :key="item.id" class="order-product-card">
              <div class="order-product-card__media">
                <img
                  v-if="cleanText(item.product_image_url)"
                  :src="getOrderItemImage(item)"
                  :alt="item.product_name"
                  @error="applyImageFallback"
                />
                <span v-else>{{ item.product_name?.charAt(0) || 'P' }}</span>
              </div>

              <div class="order-product-card__body">
                <div class="order-product-card__top">
                  <div>
                    <strong>{{ cleanText(item.product_name) || 'Sản phẩm đang cập nhật' }}</strong>
                    <p v-if="cleanText(item.product_sku)">SKU: {{ item.product_sku }}</p>
                    <p v-if="cleanText(item.product_slug)">Slug: {{ item.product_slug }}</p>
                  </div>
                  <strong class="order-product-card__line-total">{{ productLineTotal(item) }}</strong>
                </div>

                <div class="order-product-card__meta">
                  <span>Số lượng: {{ Number(item.quantity || 0) }}</span>
                  <div class="order-product-card__price-meta">
                    <span class="order-product-card__price-label">Đơn giá</span>
                    <div v-if="getOrderItemDisplayPrice(item).hasSale" class="order-product-card__price-badges">
                      <span class="order-product-card__price-badge order-product-card__price-badge--sale">Giá khuyến mãi</span>
                      <span class="order-product-card__price-badge order-product-card__price-badge--original">Giá gốc</span>
                    </div>
                    <strong :class="{ 'order-product-card__price-current--sale': getOrderItemDisplayPrice(item).hasSale }">
                      {{ formatCurrencyVnd(productUnitPrice(item)) }}
                    </strong>
                    <small v-if="getOrderItemDisplayPrice(item).hasSale">
                      {{ formatCurrencyVnd(getOrderItemDisplayPrice(item).originalPrice) }}
                    </small>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="order-detail-state order-detail-state--embedded">
            <Package :size="24" />
            <p>Đơn hàng này chưa có sản phẩm hiển thị.</p>
          </div>
        </section>

        <div class="order-detail-actions">
          <button type="button" class="order-detail-btn order-detail-btn--ghost" @click="router.push('/profile?tab=orders')">
            <ArrowLeft :size="16" />
            Quay lại lịch sử đơn hàng
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #0f172a;
}

.order-detail-hero {
  background:
    radial-gradient(circle at right top, rgba(30, 41, 59, 0.6), transparent 36%),
    linear-gradient(135deg, #07152b 0%, #0f172a 100%);
  padding: 116px 24px 92px;
}

.order-detail-hero__inner {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.order-detail-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  font-weight: 700;
}

.order-detail-breadcrumb a {
  color: rgba(255, 255, 255, 0.78);
  text-decoration: none;
}

.order-detail-breadcrumb strong {
  color: #fbbf24;
}

.order-detail-hero h1 {
  margin: 20px 0 0;
  color: #fff;
  font-size: clamp(32px, 5vw, 48px);
  line-height: 1.1;
}

.order-detail-shell {
  width: min(1180px, calc(100% - 32px));
  margin: -48px auto 72px;
}

.order-detail-content {
  display: grid;
  gap: 24px;
}

.order-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.order-detail-card,
.order-detail-state {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.order-detail-card {
  padding: 28px 32px;
}

.order-detail-state {
  min-height: 240px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
  color: #475569;
}

.order-detail-state--error {
  color: #b91c1c;
}

.order-detail-state--embedded {
  min-height: 180px;
  box-shadow: none;
}

.order-detail-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.order-detail-card__header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.order-detail-card__header--compact {
  align-items: center;
}

.order-detail-card__eyebrow {
  margin: 0 0 10px;
  color: #b58133;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.order-detail-card__header h2 {
  margin: 0;
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1.15;
  word-break: break-word;
}

.order-detail-card__date {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  color: #64748b;
  font-size: 15px;
}

.order-detail-card__header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.order-detail-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.order-detail-summary__item {
  padding: 18px 20px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.order-detail-summary__item span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.order-detail-summary__item strong {
  color: #0f172a;
  font-size: 17px;
  line-height: 1.5;
}

.order-detail-section-head {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
}

.order-detail-section-head h3 {
  margin: 0;
  font-size: 20px;
}

.order-detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.order-detail-list__item {
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.order-detail-list__item--full {
  grid-column: 1 / -1;
}

.order-detail-list__item span {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.order-detail-list__item strong {
  color: #0f172a;
  line-height: 1.7;
  word-break: break-word;
}

.order-detail-address {
  margin: 18px 0 0;
  color: #334155;
  font-size: 16px;
  line-height: 1.8;
}

.order-detail-contact-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 18px;
}

.order-detail-contact-row span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-weight: 600;
}

.order-detail-card__small-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: #fff7ed;
  color: #b58133;
  font-size: 14px;
  font-weight: 800;
}

.order-products {
  display: grid;
  gap: 16px;
  margin-top: 22px;
}

.order-product-card {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.order-product-card__media {
  width: 96px;
  height: 96px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  color: #b58133;
  font-size: 32px;
  font-weight: 800;
}

.order-product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-product-card__body {
  min-width: 0;
}

.order-product-card__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.order-product-card__top strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.5;
}

.order-product-card__top p {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.5;
  word-break: break-word;
}

.order-product-card__line-total {
  white-space: nowrap;
}

.order-product-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.order-product-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.order-product-card__price-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.order-product-card__price-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.order-product-card__price-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.order-product-card__price-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.order-product-card__price-badge--sale {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.order-product-card__price-badge--original {
  background: #e2e8f0;
  color: #475569;
}

.order-product-card__price-meta strong {
  color: #0f172a;
  font-size: 15px;
  line-height: 1.4;
}

.order-product-card__price-current--sale {
  color: #dc2626 !important;
}

.order-product-card__price-meta small {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-decoration: line-through;
}

.order-detail-actions {
  display: flex;
  justify-content: flex-start;
}

.order-detail-btn {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #0f172a;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.order-detail-btn:hover {
  background: #16233a;
  transform: translateY(-1px);
}

.order-detail-btn--ghost {
  background: #fff;
  color: #0f172a;
  border: 1px solid #d9dee7;
}

.order-status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .order-detail-hero {
    padding: 94px 18px 76px;
  }

  .order-detail-shell {
    width: min(100% - 24px, 820px);
    margin-top: -34px;
    margin-bottom: 50px;
  }

  .order-detail-grid,
  .order-detail-summary,
  .order-detail-list {
    grid-template-columns: 1fr;
  }

  .order-detail-content {
    gap: 18px;
    max-width: 760px;
    margin: 0 auto;
  }

  .order-detail-card {
    padding: 22px 20px;
  }

  .order-detail-card__header {
    flex-direction: column;
  }

  .order-detail-card__header h2 {
    font-size: clamp(24px, 4.2vw, 32px);
  }

  .order-detail-card__header-actions {
    justify-content: flex-start;
  }

  .order-detail-summary__item,
  .order-detail-list__item {
    padding: 14px 16px;
  }

  .order-detail-section-head h3 {
    font-size: 18px;
  }

  .order-product-card {
    gap: 14px;
    padding: 14px;
  }

  .order-product-card__media {
    width: 82px;
    height: 82px;
    border-radius: 16px;
    font-size: 26px;
  }

  .order-product-card__top strong {
    font-size: 16px;
  }

  .order-status-pill,
  .order-detail-card__small-badge {
    min-height: 34px;
    padding: 0 12px;
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .order-detail-hero {
    padding: 82px 14px 62px;
  }

  .order-detail-shell {
    width: min(100% - 20px, 720px);
    margin-top: -26px;
    margin-bottom: 42px;
  }

  .order-detail-card {
    padding: 18px 16px;
  }

  .order-product-card {
    grid-template-columns: 1fr;
  }

  .order-product-card__media {
    width: 100%;
    height: 150px;
  }

  .order-product-card__top {
    flex-direction: column;
  }

  .order-product-card__line-total {
    white-space: normal;
  }

  .order-detail-actions,
  .order-detail-state__actions {
    flex-direction: column;
  }

  .order-detail-btn {
    width: 100%;
    min-height: 42px;
    font-size: 14px;
  }

  .order-detail-section-head h3 {
    font-size: 17px;
  }

  .order-detail-address {
    font-size: 14px;
    line-height: 1.7;
  }

  .order-detail-contact-row span,
  .order-product-card__meta span {
    font-size: 12px;
  }

  .order-product-card__top strong {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .order-detail-breadcrumb {
    font-size: 13px;
    gap: 8px;
  }

  .order-detail-hero h1 {
    font-size: 24px;
  }

  .order-detail-card {
    padding: 16px 14px;
  }

  .order-detail-summary__item span,
  .order-detail-list__item span {
    font-size: 11px;
  }

  .order-detail-summary__item strong,
  .order-detail-list__item strong {
    font-size: 14px;
  }

  .order-product-card {
    padding: 12px;
  }

  .order-product-card__media {
    height: 128px;
  }

  .order-status-pill,
  .order-detail-card__small-badge {
    min-height: 30px;
    font-size: 11px;
  }
}
</style>
