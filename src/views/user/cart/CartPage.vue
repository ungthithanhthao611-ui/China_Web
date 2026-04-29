<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useAuthStore } from '@/views/user/stores/auth'
import { useCartStore } from '@/views/user/stores/cart'

const SELECTED_CART_IMAGES_KEY = 'selected_cart_images'

const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const cartStore = useCartStore()
const galleryItem = ref(null)
const galleryIndex = ref(0)
const pendingGalleryIndex = ref(0)
const selectedImages = ref(loadSelectedImages())

const activeGalleryImages = computed(() => getProductImages(galleryItem.value))
const activeGalleryImage = computed(() => activeGalleryImages.value[pendingGalleryIndex.value] || null)

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

const formatPrice = (price) => {
  if (!price) return t('user.home.contactPrice')
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

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

  return images.length ? images : [{ url: '/images/logo.png', alt: product.name || 'Product' }]
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

const handleUpdateQuantity = async (item, delta) => {
  const nextQuantity = item.quantity + delta
  if (nextQuantity <= 0) {
    await cartStore.removeItem(item.id)
    return
  }
  await cartStore.updateItem(item.id, nextQuantity)
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
        <p>{{ t('user.home.cart') }}</p>
        <h1>{{ t('user.home.cart') }}</h1>
      </div>
    </section>

    <section class="cart-shell">
      <div v-if="cartStore.loading && !cartStore.cart" class="cart-state">
        <Loader2 class="cart-spinner" :size="34" />
        <p>{{ t('user.home.loading') }}</p>
      </div>

      <div v-else-if="cartStore.items.length === 0" class="cart-empty">
        <ShoppingBag :size="64" stroke-width="1.5" />
        <h2>{{ t('user.home.cartEmpty') }}</h2>
        <p>{{ t('user.home.cartEmptyHint') }}</p>
        <router-link to="/products" class="cart-primary-link">
          <ArrowLeft :size="18" />
          <span>{{ t('user.home.continueShopping') }}</span>
        </router-link>
      </div>

      <div v-else class="cart-grid">
        <div class="cart-list">
          <article v-for="item in cartStore.items" :key="item.id" class="cart-item">
            <button type="button" class="cart-item__image" @click="openGallery(item)">
              <img :src="resolveImage(item)" :alt="item.product.name" />
              <span class="cart-item__zoom">
                <Search :size="18" />
              </span>
            </button>

            <div class="cart-item__body">
              <div>
                <router-link :to="`/products/${item.product.slug}`" class="cart-item__name">
                  {{ item.product.name }}
                </router-link>
                <p class="cart-item__sku">{{ item.product.sku }}</p>
                <p class="cart-item__price">{{ formatPrice(item.product.price) }}</p>
              </div>

              <div class="cart-item__actions">
                <div class="quantity-control">
                  <button type="button" :disabled="cartStore.loading" @click="handleUpdateQuantity(item, -1)">
                    <Minus :size="15" />
                  </button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" :disabled="cartStore.loading" @click="handleUpdateQuantity(item, 1)">
                    <Plus :size="15" />
                  </button>
                </div>

                <button class="cart-remove" type="button" :disabled="cartStore.loading" @click="cartStore.removeItem(item.id)">
                  <Trash2 :size="17" />
                  <span>{{ t('user.home.remove') }}</span>
                </button>
              </div>
            </div>
          </article>
        </div>

        <aside class="cart-summary">
          <h2>{{ t('user.home.orderSummary') }}</h2>
          <div class="summary-row">
            <span>{{ t('user.home.subtotal') }}</span>
            <strong>{{ formatPrice(cartStore.totalPrice) }}</strong>
          </div>
          <p>{{ t('user.home.shippingNote') }}</p>
          <button class="checkout-btn" type="button">
            <span>{{ t('user.home.checkout') }}</span>
            <ArrowRight :size="18" />
          </button>
          <router-link to="/products" class="continue-link">
            {{ t('user.home.continueShopping') }}
          </router-link>
        </aside>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="galleryItem" class="image-gallery" @click.self="closeGallery">
        <div class="image-gallery__dialog">
          <button class="image-gallery__close" type="button" @click="closeGallery" aria-label="Close">
            <X :size="24" />
          </button>

          <h2>{{ t('user.home.productImageCollection') }} - {{ galleryItem.product.name }}</h2>

          <div class="image-gallery__stage">
            <button
              class="image-gallery__nav image-gallery__nav--prev"
              type="button"
              :disabled="activeGalleryImages.length <= 1"
              @click="showPrevImage"
              aria-label="Previous image"
            >
              <ChevronLeft :size="34" />
            </button>

            <img v-if="activeGalleryImage" :src="activeGalleryImage.url" :alt="activeGalleryImage.alt" />

            <button
              class="image-gallery__nav image-gallery__nav--next"
              type="button"
              :disabled="activeGalleryImages.length <= 1"
              @click="showNextImage"
              aria-label="Next image"
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
              {{ t('user.home.cancel') }}
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
  background: #f7f8fb;
  color: #111827;
}

.cart-hero {
  padding: 120px 24px 42px;
  background: #0f172a;
  color: #fff;
}

.cart-hero__inner {
  width: min(1120px, 100%);
  margin: 0 auto;

  p {
    margin: 0 0 8px;
    color: #d6b074;
    font-weight: 700;
    text-transform: uppercase;
    font-size: 13px;
  }

  h1 {
    margin: 0;
    font-size: clamp(32px, 5vw, 54px);
    line-height: 1.05;
  }
}

.cart-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 32px auto 72px;
}

.cart-state,
.cart-empty {
  min-height: 360px;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 14px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 40px 20px;
}

.cart-spinner {
  animation: spin 1s linear infinite;
  color: #d6b074;
}

.cart-empty {
  color: #64748b;

  h2 {
    margin: 0;
    color: #111827;
  }

  p {
    margin: 0;
  }
}

.cart-primary-link,
.checkout-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 800;
  text-decoration: none;
}

.cart-primary-link {
  margin-top: 8px;
  background: #111827;
  color: #fff;
}

.cart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 24px;
  align-items: start;
}

.cart-list {
  display: grid;
  gap: 16px;
}

.cart-item,
.cart-summary {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.cart-item {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
}

.cart-item__image {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  border: 0;
  padding: 0;
  cursor: zoom-in;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cart-item__zoom {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
}

.cart-item__body {
  display: flex;
  justify-content: space-between;
  gap: 18px;
}

.cart-item__name {
  color: #111827;
  font-size: 18px;
  font-weight: 800;
  text-decoration: none;
}

.cart-item__sku {
  margin: 7px 0;
  color: #64748b;
  font-size: 13px;
}

.cart-item__price {
  margin: 0;
  color: #d6b074;
  font-weight: 800;
}

.cart-item__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border-radius: 8px;
  background: #f1f5f9;

  button {
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 6px;
    background: #fff;
    color: #111827;
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  span {
    min-width: 26px;
    text-align: center;
    font-weight: 800;
  }
}

.cart-remove {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: #dc2626;
  font-weight: 700;
  cursor: pointer;
}

.cart-summary {
  position: sticky;
  top: 96px;
  padding: 22px;

  h2 {
    margin: 0 0 20px;
    font-size: 22px;
  }

  p {
    margin: 14px 0 20px;
    color: #64748b;
    font-size: 14px;
  }
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;

  span {
    color: #64748b;
    font-weight: 700;
  }

  strong {
    font-size: 22px;
  }
}

.checkout-btn {
  width: 100%;
  border: 0;
  background: #d6b074;
  color: #0c1831;
  cursor: pointer;
}

.continue-link {
  display: block;
  margin-top: 14px;
  text-align: center;
  color: #111827;
  font-weight: 800;
  text-decoration: none;
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
  border-radius: 8px;
  background: #1f1f1f;
  color: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
  padding: 24px 28px 22px;
  display: flex;
  flex-direction: column;

  h2 {
    margin: 0 44px 18px;
    text-align: center;
    font-size: 18px;
    line-height: 1.35;
    text-transform: uppercase;
  }
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

  img {
    max-width: calc(100% - 96px);
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
  }
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

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
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

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.image-gallery__thumb.is-active {
  border-color: #ef4444;
}

.image-gallery__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
  margin-top: 18px;
  padding: 14px 0 0;
  background: #1f1f1f;
  position: relative;
  z-index: 3;
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
  background: #d6b074;
  color: #0c1831;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 860px) {
  .cart-grid {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
  }
}

@media (max-width: 560px) {
  .cart-hero {
    padding-top: 96px;
  }

  .cart-item {
    grid-template-columns: 96px minmax(0, 1fr);
    padding: 14px;
  }

  .cart-item__body,
  .cart-item__actions {
    display: grid;
    justify-items: start;
  }

  .image-gallery {
    padding: 12px;
  }

  .image-gallery__dialog {
    padding: 20px 14px 18px;

    h2 {
      margin: 0 34px 14px;
      font-size: 15px;
    }
  }

  .image-gallery__stage {
    height: 48vh;
    min-height: 240px;

    img {
      max-width: calc(100% - 70px);
    }
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
