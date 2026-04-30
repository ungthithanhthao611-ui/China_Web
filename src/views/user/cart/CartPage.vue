<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Headset,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/views/user/stores/auth'
import { useCartStore } from '@/views/user/stores/cart'
import { resolveProductDisplayPrice, resolveStockQuantity } from '@/views/user/utils/productPricing'

const SELECTED_CART_IMAGES_KEY = 'selected_cart_images'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const cartStore = useCartStore()
const galleryItem = ref(null)
const galleryIndex = ref(0)
const pendingGalleryIndex = ref(0)
const selectedImages = ref(loadSelectedImages())
const quantityError = ref('')

const summaryPrice = computed(() => formatPrice(cartStore.totalPrice))

function loadSelectedImages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SELECTED_CART_IMAGES_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveSelectedImages() {
  localStorage.setItem(SELECTED_CART_IMAGES_KEY, JSON.stringify(selectedImages.value))
}

function getDisplayPrice(product) {
  return resolveProductDisplayPrice(product)
}

function getUnitPrice(item) {
  return getDisplayPrice(item?.product).finalPrice
}

const formatPrice = (price) => {
  const normalized = Number(price)
  if (!Number.isFinite(normalized) || normalized <= 0) return t('user.home.contactPrice') || 'Liên hệ báo giá'
  return `${new Intl.NumberFormat('vi-VN').format(normalized)}đ`
}

const getLineTotal = (item) => formatPrice(getUnitPrice(item) * Number(item?.quantity || 0))

const getProductImages = (item) => {
  const product = item?.product || {}
  const images = []
  const seen = new Set()

  const pushImage = (url, alt = product.name) => {
    const normalized = String(url || '').trim()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    images.push({ url: normalized, alt: alt || product.name || '' })
  }

  pushImage(product.image_url || product.primary_image_url)
  ;(product.images || []).forEach((image) => pushImage(image.url, image.alt))

  return images.length ? images : [{ url: '/images/logo.png', alt: product.name || 'Sản phẩm' }]
}

const resolveImage = (item) => selectedImages.value[item?.id] || getProductImages(item)[0]?.url || '/images/logo.png'

const openGallery = (item, index = 0) => {
  galleryItem.value = item
  const images = getProductImages(item)
  const selectedUrl = selectedImages.value[item?.id]
  const selectedIndex = images.findIndex((image) => image.url === selectedUrl)
  const initialIndex = selectedIndex >= 0 ? selectedIndex : index
  galleryIndex.value = initialIndex
  pendingGalleryIndex.value = initialIndex
}

const closeGallery = () => {
  galleryItem.value = null
  galleryIndex.value = 0
  pendingGalleryIndex.value = 0
}

const showPrevImage = () => {
  const total = activeGalleryImages.value.length
  if (!total) return
  pendingGalleryIndex.value = (pendingGalleryIndex.value - 1 + total) % total
}

const showNextImage = () => {
  const total = activeGalleryImages.value.length
  if (!total) return
  pendingGalleryIndex.value = (pendingGalleryIndex.value + 1) % total
}

const selectGalleryImage = (index) => {
  const image = activeGalleryImages.value[index]
  if (!galleryItem.value || !image) return
  pendingGalleryIndex.value = index
}

const confirmGalleryImage = () => {
  const image = activeGalleryImages.value[pendingGalleryIndex.value]
  if (!galleryItem.value || !image) return
  galleryIndex.value = pendingGalleryIndex.value
  selectedImages.value = {
    ...selectedImages.value,
    [galleryItem.value.id]: image.url,
  }
  saveSelectedImages()
  closeGallery()
}

const activeGalleryImages = computed(() => getProductImages(galleryItem.value))
const activeGalleryImage = computed(() => activeGalleryImages.value[pendingGalleryIndex.value] || null)

const getStockQuantity = (item) => resolveStockQuantity(item?.product)
const getStockText = (item) => {
  const stockQuantity = getStockQuantity(item)
  if (stockQuantity <= 0) return 'Hết hàng'
  return `Còn ${stockQuantity} sản phẩm`
}
const isIncreaseDisabled = (item) => cartStore.loading || item.quantity >= getStockQuantity(item)
const isOutOfStock = (item) => getStockQuantity(item) <= 0

const handleUpdateQuantity = async (item, delta) => {
  quantityError.value = ''
  const nextQuantity = item.quantity + delta
  if (nextQuantity <= 0) {
    await cartStore.removeItem(item.id)
    return
  }

  const stockQuantity = getStockQuantity(item)
  if (nextQuantity > stockQuantity) {
    quantityError.value = stockQuantity > 0
      ? `Sản phẩm "${item?.product?.name || 'này'}" chỉ còn ${stockQuantity} sản phẩm trong kho.`
      : `Sản phẩm "${item?.product?.name || 'này'}" hiện đã hết hàng.`
    await cartStore.fetchCart()
    return
  }

  try {
    await cartStore.updateItem(item.id, nextQuantity)
  } catch (error) {
    quantityError.value = error?.message || 'Không thể cập nhật số lượng sản phẩm.'
    await cartStore.fetchCart()
  }
}

const handleRefreshCart = async () => {
  await cartStore.fetchCart()
}

const handleCheckout = () => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/checkout' } })
    return
  }

  router.push('/checkout')
}

onMounted(async () => {
  await authStore.initialize()
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: '/cart' } })
    return
  }
  await cartStore.fetchCart()
})
</script>

<template>
  <main class="cart-page">
    <section class="cart-hero">
      <div class="cart-hero__inner">
        <nav class="cart-breadcrumb" aria-label="Breadcrumb">
          <router-link to="/">Trang chủ</router-link>
          <span>/</span>
          <span>Giỏ hàng</span>
        </nav>
        <h1>Giỏ hàng</h1>
      </div>
    </section>

    <section class="cart-shell">
      <div v-if="cartStore.loading && !cartStore.cart" class="cart-state">
        <Loader2 class="cart-spinner" :size="34" />
        <p>Đang tải...</p>
      </div>

      <div v-else-if="cartStore.items.length === 0" class="cart-empty">
        <div class="cart-empty__icon">
          <ShieldCheck :size="34" />
        </div>
        <h2>Giỏ hàng của bạn đang trống</h2>
        <p>Hãy thêm sản phẩm vào giỏ để tiếp tục mua sắm.</p>
        <router-link to="/products" class="cart-outline-btn cart-outline-btn--empty">
          <ArrowLeft :size="18" />
          <span>TIẾP TỤC MUA SẮM</span>
        </router-link>
      </div>

      <div v-else class="cart-grid">
        <section class="cart-panel">
          <div v-if="quantityError" class="cart-inline-alert">
            <strong>Cập nhật số lượng chưa thành công.</strong>
            <span>{{ quantityError }}</span>
          </div>
          <div class="cart-table">
            <div class="cart-table__head">
              <span>SẢN PHẨM</span>
              <span>GIÁ</span>
              <span>SỐ LƯỢNG</span>
              <span>TẠM TÍNH</span>
            </div>

            <article v-for="item in cartStore.items" :key="item.id" class="cart-row">
              <div class="cart-row__product" data-label="SẢN PHẨM">
                <button
                  class="cart-row__remove"
                  type="button"
                  :disabled="cartStore.loading"
                  aria-label="Xóa sản phẩm"
                  @click="cartStore.removeItem(item.id)"
                >
                  <X :size="14" />
                </button>

                <button type="button" class="cart-row__image" @click="openGallery(item)">
                  <img :src="resolveImage(item)" :alt="item.product.name" />
                  <span class="cart-row__zoom">
                    <Search :size="16" />
                  </span>
                </button>

                <div class="cart-row__details">
                  <router-link :to="`/products/${item.product.slug}`" class="cart-row__name">
                    {{ item.product.name }}
                  </router-link>
                  <p v-if="item.product.sku" class="cart-row__sku">{{ item.product.sku }}</p>
                  <p class="cart-row__stock" :class="{ 'cart-row__stock--danger': isOutOfStock(item) || item.quantity > getStockQuantity(item) }">
                    {{ getStockText(item) }}
                  </p>
                </div>
              </div>

              <div class="cart-row__cell cart-row__price" data-label="GIÁ">
                <div class="cart-price-block">
                  <span class="cart-price-block__label">{{ t('user.products.priceLabel') }}</span>
                  <div v-if="getDisplayPrice(item.product).hasSale" class="cart-price-block__badges">
                    <span class="cart-price-block__badge cart-price-block__badge--sale">Giá khuyến mãi</span>
                    <span class="cart-price-block__badge cart-price-block__badge--original">Giá gốc</span>
                  </div>
                  <strong :class="{ 'cart-price-block__current--sale': getDisplayPrice(item.product).hasSale }">
                    {{ formatPrice(getUnitPrice(item)) }}
                  </strong>
                  <span v-if="getDisplayPrice(item.product).hasSale" class="cart-price-block__original">
                    {{ formatPrice(getDisplayPrice(item.product).originalPrice) }}
                  </span>
                </div>
              </div>

              <div class="cart-row__cell cart-row__quantity" data-label="SỐ LƯỢNG">
                <div class="quantity-control">
                  <button type="button" :disabled="cartStore.loading" @click="handleUpdateQuantity(item, -1)">
                    <Minus :size="15" />
                  </button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" :disabled="isIncreaseDisabled(item)" @click="handleUpdateQuantity(item, 1)">
                    <Plus :size="15" />
                  </button>
                </div>
              </div>

              <div class="cart-row__cell cart-row__subtotal" data-label="TẠM TÍNH">
                <strong>{{ getLineTotal(item) }}</strong>
              </div>
            </article>
          </div>

          <div class="cart-actions">
            <router-link to="/products" class="cart-outline-btn">
              <ArrowLeft :size="18" />
              <span>TIẾP TỤC XEM SẢN PHẨM</span>
            </router-link>

            <button class="cart-muted-btn" type="button" :disabled="cartStore.loading" @click="handleRefreshCart">
              CẬP NHẬT GIỎ HÀNG
            </button>
          </div>
        </section>

        <aside class="cart-summary">
          <h2>TỔNG CỘNG GIỎ HÀNG</h2>

          <div class="cart-summary__row">
            <span>{{ t('user.home.subtotal') }}</span>
            <strong>{{ summaryPrice }}</strong>
          </div>

          <div class="cart-summary__row cart-summary__row--total">
            <span>Tổng</span>
            <strong>{{ summaryPrice }}</strong>
          </div>

          <button class="checkout-btn" type="button" @click="handleCheckout">
            TIẾN HÀNH THANH TOÁN
          </button>

          <div class="cart-benefits">
            <div class="cart-benefit">
              <div class="cart-benefit__icon">
                <ShieldCheck :size="20" />
              </div>
              <div>
                <strong>Bảo mật thông tin</strong>
                <p>Thông tin của bạn được bảo mật tuyệt đối</p>
              </div>
            </div>

            <div class="cart-benefit">
              <div class="cart-benefit__icon">
                <Headset :size="20" />
              </div>
              <div>
                <strong>Hỗ trợ 24/7</strong>
                <p>Đội ngũ hỗ trợ luôn sẵn sàng</p>
              </div>
            </div>

            <div class="cart-benefit">
              <div class="cart-benefit__icon">
                <LockKeyhole :size="20" />
              </div>
              <div>
                <strong>{{ t('user.home.checkout') }} an toàn</strong>
                <p>Hệ thống thanh toán bảo mật</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="galleryItem" class="image-gallery" @click.self="closeGallery">
        <div class="image-gallery__dialog">
          <button class="image-gallery__close" type="button" aria-label="Đóng" @click="closeGallery">
            <X :size="24" />
          </button>

          <h2>Ảnh sản phẩm - {{ galleryItem.product.name }}</h2>

          <div class="image-gallery__stage">
            <button
              class="image-gallery__nav image-gallery__nav--prev"
              type="button"
              :disabled="activeGalleryImages.length <= 1"
              aria-label="Ảnh trước"
              @click="showPrevImage"
            >
              <ChevronLeft :size="34" />
            </button>

            <img v-if="activeGalleryImage" :src="activeGalleryImage.url" :alt="activeGalleryImage.alt" />

            <button
              class="image-gallery__nav image-gallery__nav--next"
              type="button"
              :disabled="activeGalleryImages.length <= 1"
              aria-label="Ảnh tiếp theo"
              @click="showNextImage"
            >
              <ChevronRight :size="34" />
            </button>
          </div>

          <div v-if="activeGalleryImages.length > 1" class="image-gallery__thumbs">
            <button
              v-for="(image, index) in activeGalleryImages"
              :key="image.url"
              type="button"
              :class="['image-gallery__thumb', { 'is-active': index === pendingGalleryIndex }]"
              @click="selectGalleryImage(index)"
            >
              <img :src="image.url" :alt="image.alt" />
            </button>
          </div>

          <div class="image-gallery__actions">
            <button class="image-gallery__cancel" type="button" @click="closeGallery">
              Hủy
            </button>
            <button class="image-gallery__ok" type="button" @click="confirmGalleryImage">
              OK
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<style lang="scss" scoped>
.cart-page {
  min-height: 100vh;
  background: #f6f7fb;
  color: #111827;
}

.cart-hero {
  min-height: 116px;
  display: flex;
  align-items: flex-end;
  padding: 78px 24px 18px;
  background: linear-gradient(135deg, #07152b 0%, #0f172a 100%);
  color: #fff;
}

.cart-hero__inner,
.cart-shell {
  width: min(940px, calc(100% - 56px));
  margin: 0 auto;
}

.cart-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;

  a {
    color: #fff;
    text-decoration: none;
  }

  span:last-child {
    color: #d8ad62;
  }
}

.cart-hero__inner h1 {
  margin: 0;
  font-size: clamp(22px, 2.6vw, 28px);
  line-height: 1.1;
  font-weight: 800;
}

.cart-shell {
  padding-top: 20px;
  padding-bottom: 48px;
}

.cart-state,
.cart-empty,
.cart-panel,
.cart-summary {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.cart-state,
.cart-empty {
  min-height: 330px;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 12px;
  padding: 40px 24px;
}

.cart-empty h2,
.cart-empty p {
  margin: 0;
}

.cart-empty h2 {
  font-size: 28px;
}

.cart-empty p {
  max-width: 460px;
  color: #64748b;
}

.cart-empty__icon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(223, 107, 69, 0.1);
  color: #df6b45;
}

.cart-spinner {
  animation: spin 1s linear infinite;
  color: #d8ad62;
}

.cart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 286px;
  gap: 18px;
  align-items: start;
}

.cart-panel {
  min-height: 330px;
  padding: 16px;
}

.cart-table {
  width: 100%;
}

.cart-table__head,
.cart-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px 124px 108px;
  gap: 12px;
}

.cart-table__head {
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.cart-row {
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e5e7eb;
}

.cart-row__product {
  display: grid;
  grid-template-columns: auto 66px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.cart-row__remove {
  width: 22px;
  height: 22px;
  border: 1px solid #d9dee7;
  border-radius: 999px;
  background: #fff;
  color: #8c97a8;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cart-row__remove:hover:not(:disabled) {
  border-color: #df6b45;
  color: #df6b45;
}

.cart-row__image {
  width: 66px;
  height: 66px;
  position: relative;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
  padding: 0;
  cursor: zoom-in;
}

.cart-row__image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cart-row__zoom {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.14);
}

.cart-row__details {
  min-width: 0;
}

.cart-row__name {
  display: inline-block;
  color: #111827;
  text-decoration: none;
  font-size: 14px;
  line-height: 1.45;
  font-weight: 600;
}

.cart-row__sku {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 11px;
}

.cart-row__stock {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.cart-row__stock--danger {
  color: #b91c1c;
}

.cart-row__cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 34px;
}

.cart-price-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.cart-price-block__label {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.cart-price-block__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cart-price-block__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}

.cart-price-block__badge--sale {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.cart-price-block__badge--original {
  background: #e2e8f0;
  color: #475569;
}

.cart-price-block__current--sale {
  color: #dc2626;
}

.cart-price-block__original {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-decoration: line-through;
}

.cart-row__price strong,
.cart-row__subtotal strong {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

.cart-inline-alert {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 12px;
  line-height: 1.5;
}

.quantity-control {
  display: inline-grid;
  grid-template-columns: 34px minmax(40px, auto) 34px;
  align-items: center;
}

.quantity-control button,
.quantity-control span {
  height: 34px;
  border: 1px solid #d9dee7;
  background: #fff;
}

.quantity-control button {
  color: #334155;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.quantity-control button:first-child {
  border-right: 0;
  border-radius: 8px 0 0 8px;
}

.quantity-control button:last-child {
  border-left: 0;
  border-radius: 0 8px 8px 0;
}

.quantity-control button:hover:not(:disabled) {
  border-color: #07152b;
  color: #07152b;
}

.quantity-control span {
  min-width: 40px;
  padding: 0 8px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #111827;
}

.cart-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
}

.cart-outline-btn,
.cart-muted-btn,
.checkout-btn {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cart-outline-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #07152b;
  background: #fff;
  color: #07152b;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.cart-outline-btn:hover {
  background: #07152b;
  color: #fff;
}

.cart-outline-btn--empty {
  margin-top: 6px;
}

.cart-muted-btn {
  border: 1px solid #8493a7;
  background: #8493a7;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.cart-muted-btn:hover:not(:disabled) {
  background: #708197;
  border-color: #708197;
}

.cart-outline-btn:disabled,
.cart-muted-btn:disabled,
.checkout-btn:disabled,
.cart-row__remove:disabled,
.quantity-control button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cart-summary {
  position: sticky;
  top: 100px;
  padding: 16px;
}

.cart-summary h2 {
  margin: 0 0 14px;
  font-size: 18px;
  line-height: 1.2;
  font-weight: 800;
  color: #1f2937;
}

.cart-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
}

.cart-summary__row--total {
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.cart-summary__row span {
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}

.cart-summary__row strong {
  color: #111827;
  font-size: 16px;
  font-weight: 800;
}

.checkout-btn {
  width: 100%;
  border: 1px solid #df6b45;
  background: #df6b45;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.checkout-btn:hover:not(:disabled) {
  background: #c85e3c;
  border-color: #c85e3c;
}

.cart-benefits {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
}

.cart-benefit {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.cart-benefit__icon {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(223, 107, 69, 0.1);
  color: #df6b45;
}

.cart-benefit strong {
  display: block;
  margin-bottom: 3px;
  color: #1f2937;
  font-size: 13px;
}

.cart-benefit p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.image-gallery {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(3px);
}

.image-gallery__dialog {
  width: min(920px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 10px;
  background: #1f1f1f;
  color: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
  padding: 24px 28px 22px;
  display: flex;
  flex-direction: column;
}

.image-gallery__dialog h2 {
  margin: 0 44px 18px;
  text-align: center;
  font-size: 18px;
  line-height: 1.35;
}

.image-gallery__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.image-gallery__stage {
  position: relative;
  height: min(560px, 58vh);
  min-height: 280px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  overflow: hidden;
}

.image-gallery__stage img {
  max-width: calc(100% - 96px);
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.image-gallery__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
}

.image-gallery__nav:disabled {
  opacity: 0.3;
  cursor: default;
}

.image-gallery__nav--prev {
  left: 0;
}

.image-gallery__nav--next {
  right: 0;
}

.image-gallery__thumbs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.image-gallery__thumb {
  width: 78px;
  height: 58px;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  background: #fff;
  cursor: pointer;
}

.image-gallery__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-gallery__thumb.is-active {
  border-color: #df6b45;
}

.image-gallery__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
  margin-top: 18px;
  padding: 14px 0 0;
  background: #1f1f1f;
}

.image-gallery__cancel,
.image-gallery__ok {
  min-width: 92px;
  height: 42px;
  border-radius: 8px;
  border: 0;
  font-weight: 800;
  cursor: pointer;
}

.image-gallery__cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.image-gallery__ok {
  background: #d8ad62;
  color: #0c1831;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .cart-hero__inner,
  .cart-shell {
    width: min(940px, calc(100% - 32px));
  }

  .cart-grid {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
  }
}

@media (max-width: 820px) {
  .cart-table__head {
    display: none;
  }

  .cart-panel {
    padding: 16px;
  }

  .cart-row {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 18px 0;
  }

  .cart-row__product {
    grid-template-columns: auto 84px minmax(0, 1fr);
    align-items: start;
  }

  .cart-row__image {
    width: 84px;
    height: 84px;
  }

  .cart-row__cell {
    justify-content: space-between;
    gap: 12px;
    padding-left: 44px;
  }

  .cart-row__cell::before {
    content: attr(data-label);
    color: #334155;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .cart-actions {
    flex-direction: column;
  }

  .cart-outline-btn,
  .cart-muted-btn {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .cart-hero {
    min-height: 144px;
    padding: 92px 16px 24px;
  }

  .cart-hero__inner,
  .cart-shell {
    width: min(940px, calc(100% - 24px));
  }

  .cart-shell {
    padding-top: 24px;
    padding-bottom: 52px;
  }

  .cart-empty h2,
  .cart-summary h2 {
    font-size: 24px;
  }

  .cart-row__product {
    grid-template-columns: 28px 76px minmax(0, 1fr);
    gap: 12px;
  }

  .cart-row__image {
    width: 76px;
    height: 76px;
  }

  .cart-row__name {
    font-size: 16px;
  }

  .cart-row__cell {
    padding-left: 0;
  }

  .cart-row__price strong,
  .cart-row__subtotal strong,
  .cart-summary__row strong {
    font-size: 20px;
  }

  .quantity-control {
    grid-template-columns: 40px minmax(46px, auto) 40px;
  }

  .cart-summary {
    padding: 20px 18px;
  }

  .cart-benefit {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .image-gallery {
    padding: 12px;
  }

  .image-gallery__dialog {
    padding: 20px 14px 18px;
  }

  .image-gallery__dialog h2 {
    margin: 0 34px 14px;
    font-size: 15px;
  }

  .image-gallery__stage {
    height: 48vh;
    min-height: 240px;
  }

  .image-gallery__stage img {
    max-width: calc(100% - 70px);
  }

  .image-gallery__thumb {
    width: 64px;
    height: 48px;
  }

  .image-gallery__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
</style>
