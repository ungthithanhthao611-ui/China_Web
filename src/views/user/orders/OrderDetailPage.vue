<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  FileText,
  Headphones,
  Info,
  LoaderCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  User,
} from 'lucide-vue-next'

import { useAuthStore } from '@/views/user/stores/auth'
import { getMyOrderById } from '@/views/user/services/ordersApi'
import { resolveImageWithFallback, applyImageFallback } from '@/views/user/utils/imageFallback'
import {
  cleanText,
  formatCurrencyVnd,
  formatDateTime,
  getOrderItemCount,
  getOrderRecipientName,
  getOrderStatusMeta,
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
const recipientName = computed(() => getOrderRecipientName(order.value, 'Chưa cập nhật'))
const orderCode = computed(() => cleanText(order.value?.code) || `DH${order.value?.id || orderId.value}`)
const orderCodeWithHash = computed(() => {
  const code = orderCode.value
  return code.startsWith('#') ? code : `#${code}`
})
const orderPlacedAt = computed(() => formatDateTime(order.value?.placed_at || order.value?.created_at))
const canCancelOrder = computed(() => cleanText(order.value?.status).toLowerCase() === 'pending_confirmation')
const hasOrderItems = computed(() => Array.isArray(order.value?.items) && order.value.items.length > 0)
const subtotalAmount = computed(() => Number(order.value?.subtotal_amount || 0))
const totalAmount = computed(() => Number(order.value?.total_amount || 0))
const subtotalLabel = computed(() => formatMoneyOrContact(subtotalAmount.value))
const totalLabel = computed(() => formatMoneyOrContact(totalAmount.value))

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
    icon: Headphones,
  },
  {
    title: 'Thanh toán an toàn',
    description: 'Hệ thống thanh toán bảo mật',
    icon: ShoppingBag,
  },
]

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

function formatMoneyOrContact(value, options = {}) {
  const amount = Number(value)
  const allowZero = options.allowZero === true

  if (!Number.isFinite(amount) || (!allowZero && amount <= 0)) {
    return 'Liên hệ'
  }

  if (amount === 0 && allowZero) {
    return '0 đ'
  }

  return formatCurrencyVnd(amount)
}

function productUnitPrice(item) {
  return getOrderItemDisplayPrice(item).finalPrice
}

function productUnitPriceLabel(item) {
  return formatMoneyOrContact(productUnitPrice(item))
}

function productLineTotalLabel(item) {
  const storedTotal = Number(item?.line_total)
  if (Number.isFinite(storedTotal) && storedTotal > 0) {
    return formatCurrencyVnd(storedTotal)
  }

  const unitPrice = productUnitPrice(item)
  const quantity = Number(item?.quantity || 0)
  if (!Number.isFinite(unitPrice) || unitPrice <= 0 || quantity <= 0) {
    return 'Liên hệ'
  }

  return formatCurrencyVnd(unitPrice * quantity)
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
          <RouterLink to="/profile?tab=orders">Lịch sử đơn hàng</RouterLink>
          <span>/</span>
          <strong>Chi tiết đơn hàng</strong>
        </nav>
        <h1>Chi tiết đơn hàng</h1>
      </div>
    </section>

    <section class="order-detail-shell">
      <div v-if="loading" class="order-detail-state">
        <LoaderCircle class="spin" :size="30" />
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>

      <div v-else-if="errorMessage" class="order-detail-state order-detail-state--error">
        <AlertCircle :size="30" />
        <p>{{ errorMessage }}</p>
        <div class="order-detail-state__actions">
          <button type="button" class="order-action order-action--navy" @click="router.push('/profile?tab=orders')">
            <ArrowLeft :size="17" />
            Quay lại lịch sử
          </button>
          <button type="button" class="order-action order-action--orange" @click="loadOrderDetail">
            Thử lại
          </button>
        </div>
      </div>

      <div v-else-if="order" class="order-detail-content">
        <section class="order-status-card">
          <div class="order-status-card__main">
            <div class="order-status-card__icon">
              <ShoppingBag :size="38" stroke-width="1.8" />
            </div>

            <div class="order-status-card__copy">
              <h2>Đơn hàng {{ orderCodeWithHash }}</h2>
              <p>Ngày đặt hàng: {{ orderPlacedAt }}</p>
            </div>

            <span class="order-status-badge">
              <Clock3 :size="18" />
              {{ orderStatus.label }}
            </span>
          </div>

          <div class="order-status-card__notice">
            <Info :size="18" />
            <span>Nhân viên tư vấn sẽ liên hệ để xác nhận giá, phí vận chuyển và phương thức thanh toán phù hợp.</span>
          </div>
        </section>

        <section class="order-info-grid">
          <article class="order-info-card">
            <div class="order-section-title">
              <FileText :size="23" />
              <h2>THÔNG TIN ĐƠN HÀNG</h2>
            </div>

            <dl class="order-info-list">
              <div>
                <dt>Mã đơn hàng</dt>
                <dd>{{ orderCodeWithHash }}</dd>
              </div>
              <div>
                <dt>Thời gian đặt hàng</dt>
                <dd>{{ orderPlacedAt }}</dd>
              </div>
              <div>
                <dt>Phương thức thanh toán</dt>
                <dd>{{ getPaymentMethodLabel(order) }}</dd>
              </div>
              <div>
                <dt>Phương thức vận chuyển</dt>
                <dd>Giao hàng tiêu chuẩn</dd>
              </div>
              <div>
                <dt>Trạng thái thanh toán</dt>
                <dd>
                  <span class="payment-badge">{{ paymentStatus.label }}</span>
                </dd>
              </div>
              <div>
                <dt>Ghi chú đơn hàng</dt>
                <dd>{{ cleanText(order.note) || 'Không có ghi chú' }}</dd>
              </div>
            </dl>
          </article>

          <article class="order-info-card">
            <div class="order-section-title">
              <User :size="24" />
              <h2>THÔNG TIN NGƯỜI NHẬN</h2>
            </div>

            <dl class="order-info-list">
              <div>
                <dt>Họ và tên</dt>
                <dd>{{ recipientName }}</dd>
              </div>
              <div>
                <dt>Số điện thoại</dt>
                <dd>{{ cleanText(order.customer_phone) || 'Chưa cập nhật' }}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{{ cleanText(order.customer_email) || 'Chưa cập nhật' }}</dd>
              </div>
              <div>
                <dt>Địa chỉ nhận hàng</dt>
                <dd>{{ cleanText(order.shipping_address) || 'Chưa cập nhật địa chỉ nhận hàng' }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section class="order-products-card">
          <div class="order-section-title order-section-title--products">
            <ShoppingBag :size="23" />
            <h2>SẢN PHẨM ĐÃ ĐẶT</h2>
          </div>

          <div v-if="hasOrderItems" class="order-products-table-wrap">
            <table class="order-products-table">
              <thead>
                <tr>
                  <th>SẢN PHẨM</th>
                  <th>ĐƠN GIÁ</th>
                  <th>SỐ LƯỢNG</th>
                  <th>TẠM TÍNH</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in order.items" :key="item.id">
                  <td>
                    <div class="order-product">
                      <div class="order-product__image">
                        <img
                          v-if="cleanText(item.product_image_url)"
                          :src="getOrderItemImage(item)"
                          :alt="cleanText(item.product_name) || 'Sản phẩm'"
                          @error="applyImageFallback"
                        />
                        <Package v-else :size="28" />
                      </div>
                      <div class="order-product__text">
                        <strong>{{ cleanText(item.product_name) || 'Sản phẩm đang cập nhật' }}</strong>
                        <span>Mã: {{ cleanText(item.product_sku) || cleanText(item.product_slug) || 'Đang cập nhật' }}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="ĐƠN GIÁ">{{ productUnitPriceLabel(item) }}</td>
                  <td data-label="SỐ LƯỢNG">x {{ Number(item.quantity || 0) }}</td>
                  <td data-label="TẠM TÍNH">{{ productLineTotalLabel(item) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="order-total-panel">
              <div>
                <span>Tạm tính</span>
                <strong>{{ subtotalLabel }}</strong>
              </div>
              <div class="order-total-panel__grand">
                <span>Tổng cộng</span>
                <strong>{{ totalLabel }}</strong>
              </div>
            </div>
          </div>

          <div v-else class="order-detail-state order-detail-state--embedded">
            <Package :size="26" />
            <p>Đơn hàng này chưa có sản phẩm hiển thị.</p>
          </div>

          <div class="order-actions-row">
            <button type="button" class="order-action order-action--navy" @click="router.push('/profile?tab=orders')">
              <ArrowLeft :size="17" />
              QUAY LẠI LỊCH SỬ
            </button>

            <button type="button" class="order-action order-action--orange" @click="router.push('/products')">
              <ShoppingBag :size="17" />
              TIẾP TỤC MUA SẮM
            </button>

            <button v-if="canCancelOrder" type="button" class="order-action order-action--danger">
              <Trash2 :size="17" />
              HỦY ĐƠN HÀNG
            </button>
          </div>

          <p class="order-cancel-note">* Chức năng hủy đơn hàng chỉ khả dụng khi đơn hàng ở trạng thái Chờ xác nhận.</p>
        </section>

        <section class="order-assurance-card" aria-label="Cam kết dịch vụ">
          <article v-for="item in assuranceItems" :key="item.title" class="order-assurance-item">
            <span class="order-assurance-item__icon">
              <component :is="item.icon" :size="26" stroke-width="1.8" />
            </span>
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </article>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
.order-detail-page {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}

.order-detail-hero {
  min-height: 142px;
  display: flex;
  align-items: center;
  background: #07152b;
  padding: 28px 24px 30px;
}

.order-detail-hero__inner {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.order-detail-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  color: rgba(255, 255, 255, 0.86);
  font-size: 15px;
  font-weight: 700;
}

.order-detail-breadcrumb a {
  color: rgba(255, 255, 255, 0.86);
  text-decoration: none;
}

.order-detail-breadcrumb strong {
  color: #d8ad62;
}

.order-detail-hero h1 {
  margin: 22px 0 0;
  color: #fff;
  font-size: clamp(34px, 5vw, 42px);
  line-height: 1.15;
  letter-spacing: 0;
}

.order-detail-shell {
  width: min(1080px, calc(100% - 40px));
  margin: 26px auto 56px;
}

.order-detail-content {
  display: grid;
  gap: 24px;
}

.order-status-card,
.order-info-card,
.order-products-card,
.order-assurance-card,
.order-detail-state {
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.order-status-card {
  padding: 28px;
}

.order-status-card__main {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
}

.order-status-card__icon {
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff4e1;
  color: #d98a00;
  flex: 0 0 auto;
}

.order-status-card__copy {
  min-width: 0;
}

.order-status-card__copy h2 {
  margin: 0;
  color: #0f172a;
  font-size: 23px;
  line-height: 1.35;
  word-break: break-word;
}

.order-status-card__copy p {
  margin: 12px 0 0;
  color: #64748b;
  font-size: 16px;
  font-weight: 600;
}

.order-status-badge,
.payment-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border-radius: 8px;
  background: #fff7e6;
  border: 1px solid #fde6b8;
  color: #e28a00;
  font-size: 16px;
  font-weight: 800;
  white-space: nowrap;
}

.order-status-badge {
  padding: 0 18px;
}

.payment-badge {
  min-height: 30px;
  padding: 3px 12px;
  font-size: 14px;
}

.order-status-card__notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 26px;
  padding: 18px 20px;
  border: 1px solid #d7dde8;
  border-radius: 6px;
  color: #475569;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.55;
}

.order-status-card__notice svg {
  flex: 0 0 auto;
  color: #d89a2b;
  fill: rgba(216, 154, 43, 0.16);
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.order-info-card,
.order-products-card {
  padding: 24px;
}

.order-section-title {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 24px;
  color: #d89a2b;
}

.order-section-title h2 {
  margin: 0;
  color: #0f172a;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: 0;
}

.order-section-title--products {
  margin-bottom: 20px;
}

.order-info-list {
  display: grid;
  gap: 18px;
  margin: 0;
}

.order-info-list div {
  display: grid;
  grid-template-columns: minmax(145px, 0.9fr) minmax(0, 1.1fr);
  gap: 18px;
  align-items: start;
}

.order-info-list dt {
  color: #64748b;
  font-size: 16px;
  font-weight: 500;
}

.order-info-list dd {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.55;
  text-align: right;
  overflow-wrap: anywhere;
}

.order-products-table-wrap {
  overflow-x: auto;
}

.order-products-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.order-products-table th {
  padding: 0 4px 20px;
  border-bottom: 1px solid #e5e7eb;
  color: #475569;
  font-size: 14px;
  font-weight: 800;
  text-align: left;
}

.order-products-table th:nth-child(2),
.order-products-table th:nth-child(3),
.order-products-table th:nth-child(4),
.order-products-table td:nth-child(2),
.order-products-table td:nth-child(3),
.order-products-table td:nth-child(4) {
  text-align: right;
}

.order-products-table td {
  padding: 28px 4px;
  border-bottom: 1px solid #e5e7eb;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  vertical-align: middle;
}

.order-product {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}

.order-product__image {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 8px;
  background: #f8fafc;
  color: #c9891d;
}

.order-product__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-product__text {
  min-width: 0;
}

.order-product__text strong {
  display: block;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.order-product__text span {
  display: block;
  margin-top: 8px;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.order-total-panel {
  width: min(420px, 100%);
  display: grid;
  gap: 18px;
  margin: 18px 0 0 auto;
}

.order-total-panel div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #0f172a;
  font-size: 16px;
}

.order-total-panel span {
  color: #334155;
  font-weight: 600;
}

.order-total-panel strong {
  color: #0f172a;
  font-weight: 800;
  text-align: right;
}

.order-total-panel__grand {
  margin-top: 2px;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

.order-total-panel__grand span {
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
}

.order-total-panel__grand strong {
  color: #0a0a0a;
  font-size: 28px;
  line-height: 1.1;
}

.order-actions-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 28px;
  padding-top: 28px;
  border-top: 1px solid #e5e7eb;
}

.order-actions-row .order-action--danger {
  margin-left: auto;
}

.order-action {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 24px;
  border-radius: 5px;
  background: #fff;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    border-color 0.2s ease;
}

.order-action:hover {
  transform: translateY(-1px);
}

.order-action--navy {
  border: 1px solid #0f2345;
  color: #0f2345;
}

.order-action--navy:hover {
  background: #0f2345;
  color: #fff;
}

.order-action--orange {
  border: 1px solid #e59643;
  color: #df7f1e;
}

.order-action--orange:hover {
  background: #fff7ed;
}

.order-action--danger {
  border: 1px solid #ef4444;
  color: #ef3340;
}

.order-action--danger:hover {
  background: #fff1f2;
}

.order-cancel-note {
  margin: 20px 0 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.order-assurance-card {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 26px 22px;
}

.order-assurance-item {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 0 20px;
  text-align: center;
}

.order-assurance-item + .order-assurance-item {
  border-left: 1px solid #e5e7eb;
}

.order-assurance-item__icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #fff4df;
  color: #cc8614;
}

.order-assurance-item strong {
  color: #0f172a;
  font-size: 16px;
  line-height: 1.35;
}

.order-assurance-item p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.order-detail-state {
  min-height: 240px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  padding: 32px;
  text-align: center;
  color: #475569;
}

.order-detail-state p {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.order-detail-state--error {
  color: #b91c1c;
}

.order-detail-state--embedded {
  min-height: 160px;
  box-shadow: none;
}

.order-detail-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 6px;
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
    min-height: 132px;
    padding-inline: 18px;
  }

  .order-detail-shell {
    width: min(100% - 28px, 760px);
    margin-top: 22px;
  }

  .order-info-grid,
  .order-assurance-card {
    grid-template-columns: 1fr;
  }

  .order-assurance-item {
    padding: 22px 10px;
  }

  .order-assurance-item + .order-assurance-item {
    border-left: 0;
    border-top: 1px solid #e5e7eb;
  }

  .order-status-card__main {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .order-status-badge {
    grid-column: 1 / -1;
    justify-self: start;
  }
}

@media (max-width: 760px) {
  .order-products-table {
    min-width: 0;
  }

  .order-products-table thead {
    display: none;
  }

  .order-products-table,
  .order-products-table tbody,
  .order-products-table tr,
  .order-products-table td {
    display: block;
    width: 100%;
  }

  .order-products-table tr {
    padding: 18px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .order-products-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 10px 0;
    border-bottom: 0;
    text-align: right !important;
  }

  .order-products-table td:first-child {
    display: block;
    text-align: left !important;
  }

  .order-products-table td:not(:first-child)::before {
    content: attr(data-label);
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    text-align: left;
  }

  .order-product {
    gap: 14px;
  }
}

@media (max-width: 640px) {
  .order-detail-hero {
    min-height: 126px;
    padding: 22px 14px;
  }

  .order-detail-shell {
    width: min(100% - 20px, 560px);
    margin-bottom: 42px;
  }

  .order-detail-breadcrumb {
    gap: 9px;
    font-size: 13px;
  }

  .order-detail-hero h1 {
    margin-top: 16px;
    font-size: 28px;
  }

  .order-status-card,
  .order-info-card,
  .order-products-card {
    padding: 20px 16px;
  }

  .order-status-card__main {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .order-status-card__icon {
    width: 76px;
    height: 76px;
  }

  .order-status-card__copy h2 {
    font-size: 20px;
  }

  .order-status-card__copy p {
    font-size: 14px;
  }

  .order-status-badge {
    justify-self: stretch;
  }

  .order-status-card__notice {
    align-items: flex-start;
    padding: 14px;
    font-size: 14px;
  }

  .order-section-title {
    align-items: flex-start;
    gap: 10px;
  }

  .order-section-title h2 {
    font-size: 17px;
  }

  .order-info-list div {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .order-info-list dt,
  .order-info-list dd {
    font-size: 14px;
    text-align: left;
  }

  .payment-badge {
    justify-content: flex-start;
  }

  .order-product {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .order-product__image {
    width: 56px;
    height: 56px;
  }

  .order-product__text strong,
  .order-products-table td {
    font-size: 14px;
  }

  .order-product__text span {
    font-size: 13px;
  }

  .order-total-panel {
    width: 100%;
  }

  .order-total-panel__grand span {
    font-size: 18px;
  }

  .order-total-panel__grand strong {
    font-size: 23px;
  }

  .order-actions-row,
  .order-detail-state__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .order-actions-row .order-action--danger {
    margin-left: 0;
  }

  .order-action {
    width: 100%;
    min-height: 46px;
  }
}

@media (max-width: 375px) {
  .order-detail-shell {
    width: min(100% - 16px, 360px);
  }

  .order-status-card,
  .order-info-card,
  .order-products-card {
    padding: 18px 12px;
  }

  .order-detail-breadcrumb {
    font-size: 12px;
  }

  .order-detail-hero h1 {
    font-size: 25px;
  }

  .order-status-card__copy h2 {
    font-size: 18px;
  }

  .order-products-table td {
    gap: 10px;
  }

  .order-action {
    padding: 0 14px;
    font-size: 13px;
  }
}
</style>
