<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ChevronRight,
  Home,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronDown,
  Send,
  Download,
  Play,
  Package,
  Loader2,
} from 'lucide-vue-next'
import { uiState } from '@/shared/utils/uiState'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/views/user/stores/cart'
import { useAuthStore } from '@/views/user/stores/auth'
import { getProduct } from '@/views/user/services/productsApi'
import InquiryModal from './components/InquiryModal.vue'
import { ShoppingCart, Zap, Plus, Minus } from 'lucide-vue-next'

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
})

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n({ useScope: 'global' })

const product = ref(null)
const loading = ref(true)
const error = ref(null)
const activeMediaIndex = ref(0)
const lightboxOpen = ref(false)
const showInquiry = ref(false)
const relatedPage = ref(0)
const isDescExpanded = ref(false)
const viewportWidth = ref(typeof window === 'undefined' ? 1200 : window.innerWidth)

const cartStore = useCartStore()
const authStore = useAuthStore()
const quantity = ref(1)
const isAdding = ref(false)
const cartNotice = ref('')
let cartNoticeTimer = null

const showCartNotice = () => {
  cartNotice.value = t('user.home.cartAddSuccess')
  if (cartNoticeTimer) {
    window.clearTimeout(cartNoticeTimer)
  }
  cartNoticeTimer = window.setTimeout(() => {
    cartNotice.value = ''
    cartNoticeTimer = null
  }, 2200)
}

const formatPrice = (price) => {
  if (!price) return t('user.home.contactPrice') || 'Liên hệ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const handleAddToCart = async () => {
  if (!authStore.isAuthenticated) {
    // In a real app, you'd trigger the login modal here
    alert('Vui lòng đăng nhập để thêm vào giỏ hàng')
    return
  }

  isAdding.value = true
  try {
    await cartStore.addItem(product.value.id, quantity.value)
    showCartNotice()
  } catch (err) {
    console.error(err)
  } finally {
    isAdding.value = false
  }
}

const handleBuyNow = async () => {
  try {
    await handleAddToCart()
    // Redirect to checkout or open cart
    // For now, let's just open the cart (this requires communication with AppHeader or a global state)
    // Actually, cartStore.addItem already updates the cart, so we just need to navigate to checkout
    router.push('/checkout')
  } catch (err) {
    // Error handled in handleAddToCart
  }
}

const primaryImage = computed(() => {
  const primaryUrl = String(product.value?.image_url || '').trim()
  if (primaryUrl) {
    return {
      url: primaryUrl,
      alt: `${product.value?.name || 'Sản phẩm'} - ảnh chính`,
    }
  }

  const fallbackImage = Array.isArray(product.value?.images)
    ? product.value.images.find((item) => String(item?.url || '').trim())
    : null

  if (!fallbackImage) return null

  return {
    url: String(fallbackImage.url).trim(),
    alt: fallbackImage.alt || `${product.value?.name || 'Sản phẩm'} - ảnh chính`,
  }
})

const gallery = computed(() => {
  const seen = new Set()
  const images = []
  const primaryUrl = primaryImage.value?.url || ''

  const pushImage = (item) => {
    const url = String(item?.url || '').trim()
    if (!url || url === primaryUrl || seen.has(url)) return

    seen.add(url)
    images.push({
      url,
      alt: item?.alt || `${product.value?.name || 'Sản phẩm'} - ảnh phụ`,
    })
  }

  if (product.value?.images?.length) {
    product.value.images.forEach((item) => {
      pushImage({
        url: item?.url,
        alt: item?.alt,
      })
    })
  } else if (product.value?.gallery_urls) {
    product.value.gallery_urls
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item && item.startsWith('http'))
      .forEach((url) => {
        pushImage({ url })
      })
  }

  return images
})

const isDirectVideo = (url) => {
  if (!url) return false
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)
}

const getEmbedVideoUrl = (url) => {
  const source = String(url || '').trim()
  if (!source || isDirectVideo(source)) return source

  try {
    const parsed = new URL(source)
    const hostname = parsed.hostname.replace(/^www\./, '')

    if (hostname === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube.com/embed/${id}` : source
    }

    if (hostname.includes('youtube.com')) {
      if (parsed.pathname.includes('/embed/')) return source
      const id = parsed.searchParams.get('v')
      return id ? `https://www.youtube.com/embed/${id}` : source
    }

    if (hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : source
    }
  } catch {
    return source
  }

  return source
}

const mediaItems = computed(() => {
  const items = []

  if (primaryImage.value?.url) {
    items.push({
      type: 'image',
      url: primaryImage.value.url,
      alt: primaryImage.value.alt || product.value?.name || 'Product image',
      isPrimary: true,
    })
  }

  gallery.value.forEach((item) => {
    items.push({
      type: 'image',
      url: item.url,
      alt: item.alt || product.value?.name || 'Product image',
      isPrimary: false,
    })
  })

  if (product.value?.video_url) {
    const isDirect = isDirectVideo(product.value.video_url)
    items.push({
      type: 'video',
      url: product.value.video_url,
      embedUrl: getEmbedVideoUrl(product.value.video_url),
      isDirect,
      alt: `${product.value?.name || 'Product'} video demo`,
      isPrimary: false,
    })
  }

  return items
})

const defaultMediaIndex = computed(() => {
  const videoIndex = mediaItems.value.findIndex((item) => item.type === 'video')
  return videoIndex >= 0 ? videoIndex : 0
})

const currentMedia = computed(() => mediaItems.value[activeMediaIndex.value] || null)
const videoPoster = computed(() => primaryImage.value?.url || gallery.value[0]?.url || '')
const relatedProducts = computed(() => product.value?.related_products || [])
const relatedPageSize = computed(() => (viewportWidth.value <= 560 ? 2 : 4))
const totalRelatedPages = computed(() =>
  Math.max(1, Math.ceil(relatedProducts.value.length / relatedPageSize.value)),
)
const pagedRelatedProducts = computed(() => {
  const startIndex = relatedPage.value * relatedPageSize.value
  return relatedProducts.value.slice(startIndex, startIndex + relatedPageSize.value)
})
const showRelatedPagination = computed(() => relatedProducts.value.length > relatedPageSize.value)
const isFirstRelatedPage = computed(() => relatedPage.value === 0)
const isLastRelatedPage = computed(() => relatedPage.value >= totalRelatedPages.value - 1)
const hasPdf = computed(() => !!String(product.value?.catalog_pdf_url || '').trim())

const categorySlug = computed(() => {
  return String(product.value?.category_name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
})

const productFamilyLabel = computed(() => {
  const categoryName = String(product.value?.category_name || '').trim()
  if (!categoryName) return t('user.products.familyDefault')
  return categoryName
})

const specRows = computed(() => {
  if (!product.value) return []

  return [
    { label: t('user.products.labelSize'), value: product.value.size },
    { label: t('user.products.labelMaterial'), value: product.value.material },
    { label: t('user.products.labelColor'), value: product.value.color },
  ].filter((item) => String(item.value || '').trim())
})

const activeAccordion = ref('specs')

function toggleAccordion(key) {
  activeAccordion.value = activeAccordion.value === key ? null : key
}

const descriptionText = computed(() => {
  const fullDesc = String(product.value?.full_desc || '').trim()
  if (fullDesc) return fullDesc
  const shortDesc = String(product.value?.short_desc || '').trim()
  if (shortDesc) return shortDesc
  return t('user.home.productDescriptionFallback')
})

const detailDescriptionParagraphs = computed(() => {
  return descriptionText.value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
})

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

const getRelatedProductImage = (item) => {
  if (item?.image_url) return item.image_url
  if (Array.isArray(item?.images) && item.images[0]?.url) return item.images[0].url
  return ''
}

async function fetchProduct() {
  loading.value = true
  error.value = null

  try {
    const data = await getProduct(props.slug)
    product.value = data
    activeMediaIndex.value = defaultMediaIndex.value
    relatedPage.value = 0

    if (data?.name) {
      document.title = `${data.name} | Thiên Đồng Việt`
    }
  } catch (err) {
    error.value = err.message || t('user.products.errorLoading')
    product.value = null
  } finally {
    loading.value = false
  }
}

function prevRelatedPage() {
  if (isFirstRelatedPage.value) return
  relatedPage.value -= 1
}

function nextRelatedPage() {
  if (isLastRelatedPage.value) return
  relatedPage.value += 1
}

function openLightbox(index) {
  if (mediaItems.value[index]?.type !== 'image') return
  activeMediaIndex.value = index
  lightboxOpen.value = true
}

function closeLightbox() {
  lightboxOpen.value = false
}

function prevImage() {
  const imageItems = mediaItems.value.filter((item) => item.type === 'image')
  if (!imageItems.length) return

  const total = mediaItems.value.length || 0
  activeMediaIndex.value = (activeMediaIndex.value - 1 + total) % total
  while (mediaItems.value[activeMediaIndex.value]?.type !== 'image') {
    activeMediaIndex.value = (activeMediaIndex.value - 1 + total) % total
  }
}

function nextImage() {
  const imageItems = mediaItems.value.filter((item) => item.type === 'image')
  if (!imageItems.length) return

  const total = mediaItems.value.length || 0
  activeMediaIndex.value = (activeMediaIndex.value + 1) % total
  while (mediaItems.value[activeMediaIndex.value]?.type !== 'image') {
    activeMediaIndex.value = (activeMediaIndex.value + 1) % total
  }
}

watch(
  () => route.query.inquiry,
  (val) => {
    if (val === '1') showInquiry.value = true
  },
  { immediate: true },
)

watch(
  totalRelatedPages,
  (pages) => {
    const maxPage = Math.max(0, pages - 1)
    if (relatedPage.value > maxPage) {
      relatedPage.value = maxPage
    }
  },
  { immediate: true },
)

watch(() => props.slug, fetchProduct)

onMounted(() => {
  uiState.isHeaderHidden = false
  uiState.isFooterHidden = false
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth, { passive: true })
  fetchProduct()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
  if (cartNoticeTimer) {
    window.clearTimeout(cartNoticeTimer)
  }
})
</script>

<template>
  <div class="prod-detail">
    <transition name="cart-toast">
      <div v-if="cartNotice" class="cart-success-toast" role="status" aria-live="polite">
        {{ cartNotice }}
      </div>
    </transition>

    <div v-if="loading" class="prod-detail__loading">
      <div class="loading-spinner" />
      <p>{{ t('user.products.loading') }}</p>
    </div>

    <div v-else-if="error" class="prod-detail__error">
      <Package :size="48" stroke-width="1.2" />
      <h2>{{ error }}</h2>
      <router-link to="/products" class="back-btn">← {{ t('user.products.backToList') }}</router-link>
    </div>

    <template v-else-if="product">
      <nav class="prod-detail__breadcrumb">
        <router-link to="/">{{ t('user.products.breadcrumbHome') }}</router-link>
        <ChevronRight :size="13" />
        <router-link to="/products">{{ t('user.products.breadcrumbProducts') }}</router-link>
        <ChevronRight :size="13" />
        <span class="current">{{ product.name }}</span>
      </nav>

      <section class="prod-detail__hero">
        <div class="prod-detail__shell">
          <div class="prod-gallery">
            <div
              v-if="currentMedia?.type === 'image'"
              id="product-detail-main-media"
              class="prod-gallery__main"
              @click="openLightbox(activeMediaIndex)"
            >
              <img :src="currentMedia?.url" :alt="currentMedia?.alt || product.name" />
              <div class="prod-gallery__zoom-hint">
                <ZoomIn :size="18" />
                <span>{{ t('user.products.zoomHint') }}</span>
              </div>
            </div>

            <div v-else class="prod-gallery__main prod-gallery__main--video">
              <video
                v-if="currentMedia?.isDirect"
                :src="currentMedia?.url"
                controls
                playsinline
                class="prod-gallery__direct-video"
              />
              <iframe
                v-else-if="currentMedia?.embedUrl"
                :src="currentMedia.embedUrl"
                title="Product Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
              />
              <a
                v-else
                class="prod-gallery__video-fallback"
                :href="currentMedia?.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Play :size="18" />
                {{ t('user.products.openVideo') }}
              </a>
              <div class="prod-gallery__video-hint">
                <Play :size="16" />
                <span>{{ t('user.products.videoHint') }}</span>
              </div>
            </div>

            <div v-if="mediaItems.length > 1" class="prod-gallery__thumbs">
              <button
                v-for="(media, index) in mediaItems"
                :key="`${media.type}-${index}`"
                type="button"
                :class="['thumb-btn', { active: activeMediaIndex === index }]"
                :aria-label="media.type === 'video' ? t('user.products.videoHint') : `${t('user.products.zoomHint')} ${index + 1}`"
                @click="activeMediaIndex = index"
              >
                <template v-if="media.type === 'image'">
                  <img :src="media.url" :alt="media.alt || `Ảnh ${index + 1}`" />
                </template>
                <template v-else>
                  <div class="thumb-btn__video">
                    <img v-if="videoPoster" :src="videoPoster" :alt="product.name" />
                    <div class="thumb-btn__video-overlay">
                      <Play :size="16" fill="currentColor" />
                    </div>
                  </div>
                </template>
              </button>
            </div>
          </div>

          <div class="prod-info">
            <p class="prod-info__family">{{ productFamilyLabel }}</p>
            <h1 class="prod-info__name">{{ product.name }}</h1>
            <div class="prod-info__sku-badge">{{ t('user.products.skuLabelDetail', { sku: product.sku || t('user.products.skuUpdating') }) }}</div>

            <p class="prod-info__short-desc">
              {{ product.short_desc || t('user.products.descFallback') }}
            </p>

            <div class="prod-price-box">
              <span class="price-label">Giá niêm yết:</span>
              <span class="price-value">{{ formatPrice(product.price) }}</span>
            </div>

            <div class="prod-purchase-ctrl">
              <div class="quantity-picker">
                <button type="button" @click="quantity > 1 && quantity--" :disabled="quantity <= 1">
                  <Minus :size="16" />
                </button>
                <input type="number" v-model.number="quantity" min="1" />
                <button type="button" @click="quantity++">
                  <Plus :size="16" />
                </button>
              </div>

              <div class="purchase-actions">
                <button class="btn-add-cart" @click="handleAddToCart" :disabled="isAdding">
                  <Loader2 v-if="isAdding" class="spinner" :size="18" />
                  <ShoppingCart v-else :size="18" />
                  <span>Thêm vào giỏ hàng</span>
                </button>
                <button class="btn-buy-now" @click="handleBuyNow">
                  <Zap :size="18" fill="currentColor" />
                  <span>Mua ngay</span>
                </button>
              </div>
            </div>

            <div class="prod-accordion">
              <!-- Thông số kỹ thuật -->
              <div v-if="specRows.length" class="acc-item" :class="{ 'acc-item--active': activeAccordion === 'specs' }">
                <button class="acc-item__head" type="button" @click="toggleAccordion('specs')">
                  <span>{{ t('user.products.accSpecs') }}</span>
                  <ChevronDown :size="18" />
                </button>
                <div class="acc-item__content">
                  <dl class="prod-specs__list">
                    <div v-for="item in specRows" :key="item.label" class="prod-specs__row">
                      <dt>{{ item.label }}:</dt>
                      <dd>{{ item.value }}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <!-- Ứng dụng thực tế -->
              <div v-if="product.use_case" class="acc-item" :class="{ 'acc-item--active': activeAccordion === 'usecase' }">
                <button class="acc-item__head" type="button" @click="toggleAccordion('usecase')">
                  <span>{{ t('user.products.accUseCase') }}</span>
                  <ChevronDown :size="18" />
                </button>
                <div class="acc-item__content">
                  <p class="acc-text">{{ product.use_case }}</p>
                </div>
              </div>

              <!-- Mô tả chi tiết -->
              <div v-if="detailDescriptionParagraphs.length" class="acc-item" :class="{ 'acc-item--active': activeAccordion === 'desc' }">
                <button class="acc-item__head" type="button" @click="toggleAccordion('desc')">
                  <span>{{ t('user.products.accDescription') }}</span>
                  <ChevronDown :size="18" />
                </button>
                <div class="acc-item__content">
                  <div class="acc-rich-text">
                    <p v-for="(paragraph, index) in detailDescriptionParagraphs" :key="index">
                      {{ paragraph }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="prod-actions">
              <button id="product-detail-inquiry-button" class="btn-inquiry" @click="showInquiry = true">
                <Send :size="16" />
                <span>{{ t('user.products.btnInquiry') }}</span>
              </button>

              <a
                v-if="hasPdf"
                id="product-detail-catalog-link"
                :href="product.catalog_pdf_url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-catalog"
              >
                <Download :size="16" />
                <span>{{ t('user.products.btnCatalog') }}</span>
              </a>

              <button
                v-else
                id="product-detail-catalog-button"
                type="button"
                class="btn-catalog btn-catalog--disabled"
                disabled
              >
                <Download :size="16" />
                <span>{{ t('user.products.btnCatalog') }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>


      <section v-if="relatedProducts.length" class="prod-related">
        <div class="prod-related__inner">
          <div class="prod-block-heading prod-block-heading--center">
            <span class="prod-block-heading__line" />
            <h2>{{ t('user.products.relatedTitle') }}</h2>
          </div>

          <p class="prod-related__intro">
            {{ t('user.products.relatedIntro') }}
          </p>

          <div class="prod-related__carousel">
            <button
              v-if="showRelatedPagination"
              type="button"
              class="prod-related__nav"
              :disabled="isFirstRelatedPage"
              aria-label="Trang truoc san pham cung loai"
              @click="prevRelatedPage"
            >
              <ChevronLeft :size="18" />
            </button>

            <div class="prod-related__grid">
              <article v-for="item in pagedRelatedProducts" :key="item.id" class="rel-card">
                <router-link :to="`/products/${item.slug}`" class="rel-card__img">
                  <img :src="getRelatedProductImage(item)" :alt="item.name" />
                  <div class="rel-card__overlay">
                    <span class="rel-card__overlay-chip">{{ t('user.products.relatedViewDetail') }}</span>
                  </div>
                </router-link>
                <div class="rel-card__body">
                  <div class="rel-card__meta">
                    <span class="rel-card__badge">{{ item.category_name || product.category_name || t('user.products.sidebarRootDefault') }}</span>
                    <p class="rel-card__sku">{{ item.sku }}</p>
                  </div>
                  <router-link :to="`/products/${item.slug}`" class="rel-card__name">
                    {{ item.name }}
                  </router-link>
                  <router-link :to="`/products/${item.slug}`" class="rel-card__cta">
                    {{ t('user.products.relatedViewProduct') }}
                    <ChevronRight :size="16" />
                  </router-link>
                </div>
              </article>
            </div>

            <button
              v-if="showRelatedPagination"
              type="button"
              class="prod-related__nav"
              :disabled="isLastRelatedPage"
              aria-label="Trang tiep theo san pham cung loai"
              @click="nextRelatedPage"
            >
              <ChevronRight :size="18" />
            </button>
          </div>

          <div v-if="showRelatedPagination" class="prod-related__pager">
            {{ relatedPage + 1 }} / {{ totalRelatedPages }}
          </div>
        </div>
      </section>
    </template>

    <Teleport to="body">
      <div v-if="lightboxOpen" class="lightbox" @click.self="closeLightbox">
        <button class="lightbox__close" :aria-label="t('user.products.lightboxClose')" @click="closeLightbox">
          <X :size="28" />
        </button>
        <button class="lightbox__prev" :aria-label="t('user.products.lightboxPrev')" @click="prevImage">
          <ChevronLeft :size="32" />
        </button>
        <div class="lightbox__img-wrap">
          <img :src="currentMedia?.url" :alt="currentMedia?.alt || product?.name" />
        </div>
        <button class="lightbox__next" :aria-label="t('user.products.lightboxNext')" @click="nextImage">
          <ChevronRight :size="32" />
        </button>
        <div class="lightbox__counter">{{ activeMediaIndex + 1 }} / {{ mediaItems.length }}</div>
      </div>
    </Teleport>

    <InquiryModal
      v-if="showInquiry"
      :product-name="product?.name"
      :product-sku="product?.sku"
      @close="showInquiry = false; router.replace({ query: {} })"
    />
  </div>
</template>

<style scoped>
.prod-detail {
  min-height: 100vh;
  background: #fff;
  color: #1f2937;
}

.prod-detail__loading,
.prod-detail__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 60vh;
  color: #6b7280;
}

.loading-spinner {
  width: 42px;
  height: 42px;
  border: 3px solid #ece6de;
  border-top-color: #1f1f1f;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.back-btn {
  padding: 10px 18px;
  border: 1px solid #d5d0c8;
  color: #1f2937;
  text-decoration: none;
  font-size: 14px;
}

.prod-detail__breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 1320px;
  margin: 0 auto;
  padding: 22px 24px 18px;
  color: #7b7b7b;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.prod-detail__breadcrumb a {
  color: #7b7b7b;
  text-decoration: none;
}

.prod-detail__breadcrumb a:hover {
  color: #111827;
}

.prod-detail__breadcrumb .current {
  color: #111827;
  font-weight: 600;
}

.prod-detail__hero {
  border-top: 1px solid #ece7df;
  border-bottom: 1px solid #ece7df;
}

.prod-detail__shell {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(380px, 1.04fr);
  gap: 34px;
  max-width: 1320px;
  margin: 0 auto;
  padding: 20px 24px 36px;
}

.prod-gallery {
  max-width: 560px;
}

.prod-info {
  padding-top: 8px;
  padding-left: 6px;
}

.prod-gallery__main {
  position: relative;
  aspect-ratio: 1 / 0.92;
  overflow: hidden;
  background: #f4efe7;
  cursor: zoom-in;
}

.prod-gallery__main img,
.prod-gallery__direct-video,
.prod-gallery__main--video iframe {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prod-gallery__main--video {
  position: relative;
  background: #111;
}

.prod-gallery__zoom-hint,
.prod-gallery__video-hint {
  position: absolute;
  left: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(17, 24, 39, 0.72);
  color: #fff;
  font-size: 12px;
  letter-spacing: 0.02em;
  backdrop-filter: blur(8px);
}

.prod-gallery__video-hint {
  top: 16px;
  bottom: auto;
}

.prod-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.thumb-btn {
  position: relative;
  aspect-ratio: 1 / 0.92;
  padding: 0;
  border: 1px solid #ddd6cc;
  background: #f7f3ee;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.thumb-btn img,
.thumb-btn__video img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-btn:hover,
.thumb-btn.active {
  border-color: #202020;
  box-shadow: 0 10px 22px rgba(17, 24, 39, 0.12);
}

.thumb-btn.active {
  transform: translateY(-1px);
}

.thumb-btn__video {
  position: relative;
  width: 100%;
  height: 100%;
}

.thumb-btn__video-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.52));
}

.prod-info {
  padding-top: 8px;
}

.prod-info__family {
  margin: 0 0 10px;
  color: #8a745b;
  font-size: 15px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.prod-info__name {
  margin: 0;
  color: #15233a;
  font-size: clamp(2rem, 3vw, 3.15rem);
  line-height: 1.05;
  font-weight: 700;
}

.prod-info__sku-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 16px;
  padding: 10px 14px;
  background: #f4f1ec;
  color: #4b5563;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.prod-info__short-desc {
  margin: 30px 0 0;
  padding-bottom: 24px;
  border-bottom: 1px solid #e9e2d8;
  color: #4b5563;
  font-size: 16px;
  line-height: 1.9;
}

.prod-section-title {
  margin: 0 0 14px;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
}

.prod-specs {
  margin-top: 24px;
  margin-bottom: 8px;
}

.prod-specs__list {
  margin: 0;
}

.prod-specs__row {
  display: grid;
  grid-template-columns: 138px minmax(0, 1fr);
  gap: 14px;
  margin-bottom: 12px;
}

.prod-specs__row dt {
  color: #7a7a7a;
  font-weight: 500;
}

.prod-specs__row dd {
  margin: 0;
  color: #1f2937;
  line-height: 1.7;
}

.prod-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 22px;
}


.btn-inquiry,
.btn-catalog {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 62px;
  padding: 0 22px;
  border: 1px solid #202020;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.btn-inquiry {
  background: #2b2b2b;
  color: #fff;
  border-color: #2b2b2b;
}

.btn-inquiry:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(17, 24, 39, 0.16);
}

.btn-catalog {
  background: #fff;
  color: #2b2b2b;
}

.btn-catalog:hover {
  background: #f7f4ef;
}

.btn-catalog--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.prod-detail__desc {
  padding: 54px 0 20px;
}

.prod-detail__desc-inner,
.prod-related__inner {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 24px;
}

.prod-block-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.prod-block-heading--center {
  justify-content: center;
}

.prod-block-heading__line {
  width: 44px;
  height: 2px;
  background: #8a745b;
}

.prod-block-heading h2 {
  margin: 0;
  color: #15233a;
  font-size: clamp(1.9rem, 2.5vw, 2.5rem);
  font-weight: 700;
}

.prod-detail__desc-content {
  max-width: 960px;
  color: #4b5563;
  font-size: 16px;
  line-height: 1.9;
}

.prod-detail__desc-content p {
  margin: 0 0 14px;
}

.prod-related {
  padding: 22px 0 72px;
  background: linear-gradient(180deg, #fff 0%, #faf7f2 100%);
}

.prod-related__intro {
  max-width: 760px;
  margin: 0 auto 28px;
  color: #5b6472;
  font-size: 16px;
  line-height: 1.8;
  text-align: center;
}

.prod-related__carousel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.prod-related__nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid #d8d1c7;
  background: #fff;
  color: #15233a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prod-related__nav:hover:not(:disabled) {
  border-color: #15233a;
  transform: translateY(-1px);
}

.prod-related__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.prod-related__pager {
  margin-top: 12px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.prod-related__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 16px;
}

.rel-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border: 1px solid #e9e2d8;
  background: #fff;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.rel-card:hover {
  transform: translateY(-4px);
  border-color: rgba(138, 116, 91, 0.45);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.12);
}

.rel-card__img {
  position: relative;
  display: block;
  aspect-ratio: 1 / 0.86;
  overflow: hidden;
  background: linear-gradient(135deg, #f3ede5, #e8ded2);
}

.rel-card__img img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.rel-card:hover .rel-card__img img {
  transform: scale(1.04);
}

.rel-card__overlay {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  justify-content: flex-end;
  padding: 14px;
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.42));
  opacity: 0;
  transition: opacity 0.22s ease;
}

.rel-card:hover .rel-card__overlay {
  opacity: 1;
}

.rel-card__overlay-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.95);
  color: #15233a;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rel-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 16px 16px 18px;
}

.rel-card__meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rel-card__badge {
  display: inline-flex;
  max-width: 70%;
  align-items: center;
  padding: 6px 10px;
  background: #f5f0e9;
  color: #8a745b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rel-card__name {
  display: block;
  color: #111827;
  text-decoration: none;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.rel-card__name:hover {
  color: #8a745b;
}

.rel-card__sku {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.rel-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  color: #15233a;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

/* Accordion */
.prod-accordion {
  margin: 32px 0;
  border-top: 1px solid #e2e8f0;
}

.acc-item {
  border-bottom: 1px solid #e2e8f0;
}

.acc-item__head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 0;
  background: none;
  border: none;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: color 0.2s ease;
}

.acc-item__head:hover {
  color: #8a745b;
}

.acc-item__head svg {
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.acc-item--active .acc-item__head {
  color: #8a745b;
}

.acc-item--active .acc-item__head svg {
  transform: rotate(180deg);
  color: #8a745b;
}

.acc-item__content {
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.acc-item--active .acc-item__content {
  max-height: 1000px;
  padding-bottom: 24px;
  opacity: 1;
}

.acc-text {
  margin: 0;
  color: #475569;
  line-height: 1.7;
  font-size: 15px;
}

.acc-rich-text p {
  margin: 0 0 16px;
  color: #475569;
  line-height: 1.7;
  font-size: 15px;
}

.acc-rich-text p:last-child {
  margin-bottom: 0;
}


.prod-gallery__video-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  color: #fff;
  text-decoration: none;
  font-weight: 600;
  background: radial-gradient(circle at center, rgba(196, 0, 17, 0.32), rgba(15, 23, 42, 0.98));
}

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
}

.lightbox__img-wrap {
  max-width: 90vw;
  max-height: 88vh;
}

.lightbox__img-wrap img {
  max-width: 100%;
  max-height: 88vh;
  object-fit: contain;
}

.lightbox__close,
.lightbox__prev,
.lightbox__next {
  position: fixed;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
}

.lightbox__close {
  top: 20px;
  right: 20px;
  width: 46px;
  height: 46px;
  border-radius: 50%;
}

.lightbox__prev,
.lightbox__next {
  top: 50%;
  transform: translateY(-50%);
  width: 52px;
  height: 52px;
  border-radius: 50%;
}

.lightbox__prev {
  left: 20px;
}

.lightbox__next {
  right: 20px;
}

.lightbox__counter {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
}

@media (max-width: 1100px) {
  .prod-detail__shell {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .prod-gallery {
    max-width: 100%;
  }

  .prod-gallery__main {
    aspect-ratio: 1 / 0.86;
  }
}

/* Purchase Styles */
.prod-price-box {
  margin: 24px 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #f1f5f9;

  .price-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }

  .price-value {
    font-size: 32px;
    font-weight: 800;
    color: #1e293b;
  }
}

.prod-purchase-ctrl {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
}

.quantity-picker {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1f5f9;
  padding: 6px;
  border-radius: 12px;
  width: fit-content;

  button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: #fff;
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: #e2e8f0;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  input {
    width: 50px;
    text-align: center;
    background: none;
    border: none;
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

.purchase-actions {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;

  button {
    height: 56px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
}

.btn-add-cart {
  background: #1e293b;
  color: #fff;
  border: none;

  &:hover {
    background: #0f172a;
    transform: translateY(-2px);
  }
}

.btn-buy-now {
  background: #d6b074;
  color: #0c1831;
  border: none;

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(214, 176, 116, 0.2);
  }
}

.spinner {
  animation: rotate 1s linear infinite;
}

.cart-success-toast {
  position: fixed;
  top: 92px;
  right: 24px;
  z-index: 1000;
  max-width: min(320px, calc(100vw - 32px));
  padding: 13px 18px;
  border-radius: 10px;
  background: #16a34a;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

.cart-toast-enter-active,
.cart-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cart-toast-enter-from,
.cart-toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .cart-success-toast {
    top: 76px;
    right: 16px;
    left: 16px;
    max-width: none;
    text-align: center;
  }

  .prod-detail__breadcrumb,
  .prod-detail__desc-inner,
  .prod-related__inner {
    padding-left: 16px;
    padding-right: 16px;
  }

  .prod-detail__shell {
    padding: 18px 16px 28px;
  }

  .prod-gallery__thumbs {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }

  .prod-specs__row {
    grid-template-columns: 1fr;
    gap: 4px;
    margin-bottom: 14px;
  }

  .prod-actions {
    grid-template-columns: 1fr;
  }

  .btn-inquiry,
  .btn-catalog {
    min-height: 56px;
    font-size: 16px;
  }

  .prod-related__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .prod-related__carousel {
    gap: 10px;
  }

  .prod-related__nav {
    width: 38px;
    height: 38px;
  }
}

@media (max-width: 560px) {
  .prod-info__name {
    font-size: 2.2rem;
  }

  .prod-gallery__main {
    aspect-ratio: 1 / 0.95;
  }

  .prod-gallery__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .prod-related__intro {
    margin-bottom: 20px;
    font-size: 15px;
    text-align: left;
  }

  .prod-related__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .prod-related__carousel {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 8px;
  }

  .prod-related__nav {
    width: 34px;
    height: 34px;
  }

  .rel-card__body {
    padding: 10px 10px 12px;
    gap: 8px;
  }

  .rel-card__name {
    font-size: 18px;
    line-height: 1.3;
  }

  .rel-card__cta {
    font-size: 13px;
  }

  .rel-card__meta {
    flex-direction: column;
    gap: 8px;
  }

  .rel-card__badge {
    max-width: 100%;
  }

  .lightbox__prev,
  .lightbox__next {
    top: auto;
    bottom: 20px;
    transform: none;
    width: 42px;
    height: 42px;
  }

  .lightbox__prev {
    left: 18px;
  }

  .lightbox__next {
    right: 18px;
  }

  .lightbox__counter {
    bottom: 30px;
  }
}
</style>
