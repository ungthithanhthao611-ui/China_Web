<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronRight, Home, Play, Search, X, SlidersHorizontal } from 'lucide-vue-next'
import { uiState } from '@/shared/utils/uiState'
import { listProductCategories, listProducts } from '@/views/user/services/productsApi'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/views/user/stores/cart'
import { useAuthStore } from '@/views/user/stores/auth'
import { ShoppingCart, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n({ useScope: 'global' })

const products = ref([])
const categoryTree = ref([])
const loadingProducts = ref(false)
const loadingCategories = ref(false)
const activeCategorySlug = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const viewportWidth = ref(typeof window === 'undefined' ? 1200 : window.innerWidth)
const categoryPanelOpen = ref(false)

const cartStore = useCartStore()
const authStore = useAuthStore()
const addingProductId = ref(null)
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

const handleAddToCart = async (product) => {
  if (!authStore.isAuthenticated) {
    alert('Vui lòng đăng nhập để thêm vào giỏ hàng')
    return
  }

  addingProductId.value = product.id
  try {
    await cartStore.addItem(product.id, 1)
    showCartNotice()
  } catch (err) {
    console.error(err)
  } finally {
    addingProductId.value = null
  }
}

const MOBILE_BREAKPOINT = 560
const DESKTOP_PAGE_SIZE = 9
const MOBILE_PAGE_SIZE = 6

const flattenCategoryTree = (nodes, depth = 0) => nodes.flatMap((node) => {
  const currentNode = {
    ...node,
    depth,
  }
  const children = flattenCategoryTree(node.children || [], depth + 1)
  return [currentNode, ...children]
})

const allCategories = computed(() => flattenCategoryTree(categoryTree.value))

const rootCategory = computed(() => categoryTree.value[0] || null)

const sidebarCategories = computed(() => allCategories.value.filter((category) => (
  category.slug && category.id !== rootCategory.value?.id
)))

const activeSidebarCategory = computed(() => {
  if (!activeCategorySlug.value) {
    return {
      slug: '',
      name: t('user.products.sidebarAll'),
      description: locale.value === 'vi' ? (rootCategory.value?.description || '') : '',
      product_count: rootCategory.value?.product_count || products.value.length,
    }
  }

  const found = sidebarCategories.value.find((category) => category.slug === activeCategorySlug.value)
  if (found) return found

  return {
    slug: '',
    name: t('user.products.sidebarAll'),
    description: '',
    product_count: rootProductCount.value,
  }
})

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value

  const query = String(searchQuery.value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  return products.value.filter((product) => {
    const searchableText = String([
      product?.name,
      product?.sku,
      product?.short_desc,
      product?.material,
      product?.category_name,
    ].join(' ')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
    return searchableText.includes(query)
  })
})

const totalProducts = computed(() => filteredProducts.value.length)
const isMobileView = computed(() => viewportWidth.value <= MOBILE_BREAKPOINT)
const currentPageSize = computed(() => (isMobileView.value ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE))
const totalPages = computed(() => Math.max(1, Math.ceil(totalProducts.value / currentPageSize.value)))
const rootProductCount = computed(() => rootCategory.value?.product_count || products.value.length)

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * currentPageSize.value
  return filteredProducts.value.slice(start, start + currentPageSize.value)
})

const hasVideoUrl = (product) => Boolean(String(product?.video_url || '').trim())

async function fetchCategoryTree() {
  loadingCategories.value = true
  try {
    const res = await listProductCategories()
    categoryTree.value = res.items || []
  } catch {
    categoryTree.value = []
  } finally {
    loadingCategories.value = false
  }
}

async function fetchProducts() {
  loadingProducts.value = true
  try {
    const res = await listProducts({
      categorySlug: activeCategorySlug.value,
      skip: 0,
      limit: 100,
    })
    products.value = res.items || []
  } catch {
    products.value = []
  } finally {
    loadingProducts.value = false
  }
}

function isKnownCategorySlug(slug) {
  if (!slug) return true
  return sidebarCategories.value.some((category) => category.slug === slug)
}

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth
}

function toggleCategoryPanel() {
  if (!isMobileView.value) return
  categoryPanelOpen.value = !categoryPanelOpen.value
}

function syncActiveCategoryFromRoute() {
  const categoryFromQuery = typeof route.query.category === 'string' ? route.query.category : ''
  activeCategorySlug.value = isKnownCategorySlug(categoryFromQuery) ? categoryFromQuery : ''
}

function selectCategory(slug) {
  const nextSlug = isKnownCategorySlug(slug) ? slug : ''
  activeCategorySlug.value = nextSlug
  currentPage.value = 1
  if (isMobileView.value) {
    categoryPanelOpen.value = false
  }
  router.replace({ query: nextSlug ? { category: nextSlug } : {} })
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  window.scrollTo({ top: 400, behavior: 'smooth' })
}

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) {
    currentPage.value = pageCount
  }
})

watch(
  isMobileView,
  (mobile) => {
    categoryPanelOpen.value = !mobile
  },
  { immediate: true },
)

watch(
  () => route.query.category,
  async () => {
    syncActiveCategoryFromRoute()
    await fetchProducts()
  },
)

watch(locale, async () => {
  await fetchCategoryTree()
  await fetchProducts()
})

onMounted(async () => {
  uiState.isHeaderHidden = false
  uiState.isFooterHidden = false
  updateViewportWidth()
  window.addEventListener('resize', updateViewportWidth, { passive: true })
  await fetchCategoryTree()
  syncActiveCategoryFromRoute()
  await fetchProducts()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
  if (cartNoticeTimer) {
    window.clearTimeout(cartNoticeTimer)
  }
})
</script>

<template>
  <div class="products-page">
    <transition name="cart-toast">
      <div v-if="cartNotice" class="cart-success-toast" role="status" aria-live="polite">
        {{ cartNotice }}
      </div>
    </transition>

    <!-- Hero -->
    <section class="prod-hero">
      <div class="prod-hero__overlay" />
      <div class="prod-hero__content">
        <p class="prod-hero__eyebrow">{{ t('user.products.heroEyebrow') }}</p>
        <h1 class="prod-hero__title">{{ t('user.products.heroTitle') }}</h1>
        <div class="prod-hero__line" />
        <p class="prod-hero__sub">{{ t('user.products.heroSub') }}</p>
      </div>
      <!-- Breadcrumb -->
      <nav class="prod-hero__breadcrumb" aria-label="Breadcrumb">
        <router-link to="/"><Home :size="14" />{{ t('user.products.breadcrumbHome') }}</router-link>
        <ChevronRight :size="13" />
        <span>{{ t('user.products.breadcrumbProducts') }}</span>
      </nav>
    </section>

    <!-- Main layout -->
    <div class="prod-shell">
      <!-- Sidebar: Categories -->
      <aside class="prod-sidebar">
        <div class="prod-sidebar__header">
          <div class="prod-sidebar__header-main">
            <SlidersHorizontal :size="16" />
            <span>{{ t('user.products.sidebarTitle') }}</span>
          </div>
          <button
            v-if="isMobileView"
            type="button"
            class="prod-sidebar__toggle"
            @click="toggleCategoryPanel"
          >
            <span>{{ activeSidebarCategory.name }}</span>
            <span class="prod-cat-count">{{ rootProductCount }}</span>
            <ChevronDown :size="14" :class="['prod-sidebar__toggle-icon', { open: categoryPanelOpen }]" />
          </button>
        </div>

        <div v-if="categoryPanelOpen" class="prod-sidebar__tree">
          <div class="prod-cat-root">
            <div>
              <span class="prod-cat-root__label">{{ t('user.products.sidebarTitle') }}</span>
              <strong class="prod-cat-root__title">{{ rootCategory?.name || t('user.products.sidebarRootDefault') }}</strong>
            </div>
            <span class="prod-cat-count">{{ rootProductCount }}</span>
          </div>

          <ul class="prod-cat-tree">
            <li>
              <button
                :class="['prod-cat-item', { active: !activeCategorySlug }]"
                @click="selectCategory('')"
              >
                <span class="prod-cat-item__branch" aria-hidden="true" />
                <span class="prod-cat-item__label">{{ t('user.products.allProducts') }}</span>
                <span class="prod-cat-count">{{ rootProductCount }}</span>
              </button>
            </li>
            <li v-for="cat in sidebarCategories" :key="cat.slug || cat.id">
              <button
                :class="['prod-cat-item', { active: activeCategorySlug === cat.slug }]"
                :style="{ '--depth': cat.depth }"
                @click="selectCategory(cat.slug)"
              >
                <span class="prod-cat-item__branch" aria-hidden="true" />
                <span class="prod-cat-item__label">{{ cat.name }}</span>
                <span class="prod-cat-count">{{ cat.product_count }}</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main -->
      <main class="prod-main">
        <!-- Toolbar -->
        <div class="prod-toolbar">
          <div class="prod-toolbar__info">
            <span>
              <strong>{{ activeSidebarCategory.name }}</strong> — {{ t('user.products.toolbarProductCount', { name: '', count: totalProducts }) }}
            </span>
          </div>
          <div class="prod-search">
            <Search :size="16" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('user.products.searchPlaceholder')"
              :aria-label="t('user.products.searchPlaceholder')"
            />
            <button v-if="searchQuery" class="prod-search__clear" @click="searchQuery = ''" :aria-label="t('user.products.searchClear')">
              <X :size="14" />
            </button>
          </div>
        </div>

        <!-- Category Description -->
        <div v-if="activeSidebarCategory?.description" class="prod-cat-desc">
          <p>{{ activeSidebarCategory.description }}</p>
        </div>

        <!-- Loading -->
        <div v-if="loadingProducts" class="prod-status">
          <div class="prod-spinner" />
          <span>{{ t('user.products.loading') }}</span>
        </div>

        <!-- Empty -->
        <div v-else-if="!filteredProducts.length" class="prod-status prod-status--empty">
          <p>{{ t('user.products.empty') }}</p>
        </div>

        <!-- Grid -->
        <div v-else class="prod-grid">
          <article
            v-for="product in paginatedProducts"
            :key="product.id"
            class="prod-card"
          >
            <router-link :to="`/products/${product.slug}`" class="prod-card__img-wrap">
              <img
                :src="product.image_url || product.images?.[0]?.url || ''"
                :alt="product.name"
                loading="lazy"
              />
              <div class="prod-card__badge">{{ product.category_name }}</div>
            </router-link>
            <div class="prod-card__body">
              <p class="prod-card__sku">{{ product.sku }}</p>
              <router-link :to="`/products/${product.slug}`" class="prod-card__name">
                {{ product.name }}
              </router-link>
              <p class="prod-card__desc">
                {{ product.short_desc || t('user.home.productDescriptionFallback') }}
              </p>
              <div class="prod-card__specs" v-if="product.size || product.material">
                <span v-if="product.material">
                  <strong>{{ t('user.products.labelMaterial') }}:</strong> {{ product.material }}
                </span>
                <span v-if="product.size">
                  <strong>{{ t('user.products.labelSize') }}:</strong> {{ product.size }}
                </span>
              </div>
              <a
                v-if="hasVideoUrl(product)"
                :href="product.video_url"
                class="prod-card__video"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="prod-card__video-icon">
                  <Play :size="14" fill="currentColor" />
                </span>
                <span class="prod-card__video-text">
                  <strong>{{ t('user.products.videoDemo') }}</strong>
                  <small>{{ t('user.products.videoDemoSub') }}</small>
                </span>
              </a>
              <div class="prod-card__price-row">
                <span class="prod-card__price">{{ formatPrice(product.price) }}</span>
              </div>
              <div class="prod-card__footer">
                <router-link :to="`/products/${product.slug}`" class="prod-card__detail-btn">
                  {{ t('user.products.viewDetails') }}
                </router-link>
                <button 
                  class="prod-card__cart-btn" 
                  @click="handleAddToCart(product)"
                  :disabled="addingProductId === product.id"
                >
                  <Loader2 v-if="addingProductId === product.id" class="spinner" :size="16" />
                  <ShoppingCart v-else :size="16" />
                </button>
              </div>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="prod-pagination">
          <button
            class="prod-page-arrow"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
            :aria-label="t('user.products.prevPage')"
          >←</button>
          <button
            v-if="!isMobileView"
            v-for="page in totalPages"
            :key="page"
            :class="['prod-page-num', { active: currentPage === page }]"
            @click="goToPage(page)"
          >{{ page }}</button>
          <span v-else class="prod-page-summary">
            {{ currentPage }} / {{ totalPages }}
          </span>
          <button
            class="prod-page-arrow"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
            :aria-label="t('user.products.nextPage')"
          >→</button>
        </div>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/_variables.scss" as *;

/* ── Page wrapper ── */
.products-page {
  min-height: 100vh;
  background: $bg-page;
}

/* ── Hero ── */
.prod-hero {
  position: relative;
  height: 52vh;
  min-height: 320px;
  max-height: 480px;
  background: url('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&q=80') center/cover no-repeat;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.prod-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(10,17,32,0.72) 0%, rgba(10,17,32,0.38) 60%, rgba(10,17,32,0.18) 100%);
}

.prod-hero__content {
  position: relative;
  z-index: 1;
  padding-left: clamp(28px, 8vw, 160px);
  padding-top: 20px;
}

.prod-hero__eyebrow {
  margin: 0 0 4px;
  color: rgba(214,184,136,0.9);
  font-size: 13px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.prod-hero__title {
  margin: 0;
  color: $white;
  font-family: $font-title;
  font-size: clamp(2.2rem, 5vw, 3.8rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.prod-hero__line {
  width: 60px;
  height: 2px;
  margin: 14px 0;
  background: $primary-color;
}

.prod-hero__sub {
  margin: 0;
  color: rgba(255,255,255,0.72);
  font-size: clamp(14px, 1.2vw, 16px);
}

.prod-hero__breadcrumb {
  position: absolute;
  bottom: 20px;
  left: clamp(28px, 8vw, 160px);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.68);
  font-size: 13px;
}

.prod-hero__breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: rgba(255,255,255,0.68);
  text-decoration: none;
  transition: color 0.2s;
}
.prod-hero__breadcrumb a:hover { color: #fff; }
.prod-hero__breadcrumb span { color: #d6b888; }

/* ── Shell ── */
.prod-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 32px;
  max-width: $max-width-container;
  margin: 0 auto;
  padding: 40px $container-padding-desktop 60px;
}

/* ── Sidebar ── */
.prod-sidebar {
  position: sticky;
  top: 112px;
  align-self: start;
}

.prod-sidebar__header {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #1d283d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.prod-sidebar__header-main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.prod-sidebar__toggle {
  display: none;
}

.prod-sidebar__toggle-icon {
  transition: transform 0.2s ease;
}

.prod-sidebar__toggle-icon.open {
  transform: rotate(180deg);
}

.prod-sidebar__tree {
  padding: 24px 20px;
  border-radius: 24px;
  border: 1px solid rgba(29, 40, 61, 0.08);
  background:
    radial-gradient(circle at top left, rgba(196, 0, 17, 0.08), transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 245, 239, 0.96));
  box-shadow:
    0 20px 45px rgba(29, 40, 61, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.prod-cat-root {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(29, 40, 61, 0.08);
}

.prod-cat-root__label {
  display: block;
  margin-bottom: 6px;
  color: #7a6652;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.prod-cat-root__title {
  display: block;
  color: #1d283d;
  font-family: $font-title;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
}

.prod-cat-tree {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.prod-cat-item {
  --depth: 0;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  padding-left: calc(12px + (var(--depth) * 18px));
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: #4a5568;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.prod-cat-item__branch {
  position: relative;
  width: 14px;
  height: 14px;
  opacity: 0.65;
}

.prod-cat-item__branch::before,
.prod-cat-item__branch::after {
  content: '';
  position: absolute;
  background: currentColor;
  border-radius: 999px;
}

.prod-cat-item__branch::before {
  left: 2px;
  top: 0;
  width: 1px;
  height: 12px;
}

.prod-cat-item__branch::after {
  left: 2px;
  top: 11px;
  width: 10px;
  height: 1px;
}

.prod-cat-item__label {
  min-width: 0;
}

.prod-cat-item:hover {
  transform: translateX(2px);
  background: rgba(196, 0, 17, 0.06);
  border-color: rgba(196, 0, 17, 0.1);
  color: #1d283d;
}

.prod-cat-item.active {
  background: linear-gradient(135deg, #c40011, #8f1120);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 16px 24px rgba(196, 0, 17, 0.2);
}

.prod-cat-item.active .prod-cat-item__branch {
  opacity: 1;
}

.prod-cat-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(29, 40, 61, 0.06);
  color: #7a6652;
  font-size: 11px;
  font-weight: 700;
}

.prod-cat-item.active .prod-cat-count {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

/* ── Main ── */
.prod-main {
  min-width: 0;
}

/* ── Toolbar ── */
.prod-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.prod-toolbar__info {
  color: $text-light;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.prod-toolbar__info strong {
  color: $navy-dark;
  font-size: 18px;
  font-family: $font-title;
  font-weight: 700;
}

.prod-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  border: 1px solid $border-soft;
  border-radius: 99px; /* Tròn trịa hiện đại hơn */
  background: $white;
  color: $text-light;
  min-width: min(320px, 100%);
  max-width: 100%;
  transition: $transition-base;
  box-shadow: 0 2px 6px rgba($navy-dark, 0.02);
}

.prod-search:focus-within {
  border-color: $primary-color;
  color: $primary-color;
  box-shadow: 0 4px 12px rgba($primary-color, 0.08);
}

.prod-search input {
  border: none;
  outline: none;
  background: transparent;
  color: $navy-dark;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.prod-search input::placeholder { color: #b8c1cf; }

.prod-search__clear {
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.2s;
}
.prod-search__clear:hover { color: #c40011; }

/* ── Category Description ── */
.prod-cat-desc {
  margin-bottom: 32px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #ffffff 0%, #fcfaf7 100%);
  border-radius: 16px;
  border: 1px solid rgba(212, 181, 138, 0.25);
  box-shadow: 
    0 4px 20px rgba(29, 40, 61, 0.03),
    0 1px 2px rgba(212, 181, 138, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(to bottom, $primary-color, #ff4d5a);
  }
}

.prod-cat-desc p {
  margin: 0;
  color: $navy-dark;
  font-size: 15px;
  line-height: 1.7;
  font-weight: 400;
  white-space: pre-wrap;
  letter-spacing: 0.01em;
}

.prod-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  color: $text-light;
  font-size: 15px;
}

.prod-status--empty p { margin: 0; }

.prod-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #f0ebe3;
  border-top-color: #c40011;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Grid ── */
.prod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* ── Card ── */
.prod-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(29,40,61,0.07);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  display: flex;
  flex-direction: column;
}

.prod-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(29,40,61,0.13);
}

.prod-card__img-wrap {
  position: relative;
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, #f3ede5, #e8ded2);
}

.prod-card__img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.prod-card:hover .prod-card__img-wrap img {
  transform: scale(1.06);
}

.prod-card__badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(196,0,17,0.88);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  backdrop-filter: blur(4px);
}

.prod-card__body {
  padding: 18px 18px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.prod-card__sku {
  margin: 0 0 4px;
  color: #9ca3af;
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.prod-card__name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #1d283d;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
  margin-bottom: 8px;
  transition: color 0.2s;
}
.prod-card__name:hover { color: #c40011; }

.prod-card__desc {
  margin: 0 0 10px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.prod-card__specs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
  padding: 10px 12px;
  background: #faf8f5;
  border-radius: 6px;
}

.prod-card__specs span {
  color: #6b7280;
  font-size: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prod-card__specs strong {
  color: #4a5568;
  font-weight: 600;
}

.prod-card__video {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(196, 0, 17, 0.18);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(196, 0, 17, 0.08), rgba(255, 255, 255, 0.96));
  color: #1d283d;
  text-decoration: none;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.prod-card__video:hover {
  transform: translateY(-1px);
  border-color: rgba(196, 0, 17, 0.34);
  background: linear-gradient(135deg, rgba(196, 0, 17, 0.12), rgba(255, 255, 255, 0.98));
}

.prod-card__video-icon {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #c40011;
  color: #fff;
  box-shadow: 0 6px 16px rgba(196, 0, 17, 0.22);
}

.prod-card__video-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.prod-card__video-text strong {
  color: #c40011;
  font-size: 13px;
  line-height: 1.2;
}

.prod-card__video-text small {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.35;
}

.prod-card__footer {
  display: flex;
  gap: 8px;
}

.prod-card__detail-btn,
.prod-card__inquiry-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.prod-card__detail-btn {
  border: 1.5px solid #ddd5c8;
  color: #4a5568;
  background: transparent;
}
.prod-card__detail-btn:hover {
  border-color: #1d283d;
  color: #1d283d;
  background: #f5f1ea;
}

.prod-card__inquiry-btn {
  border: 1.5px solid #c40011;
  color: #c40011;
  background: transparent;
}
.prod-card__inquiry-btn:hover {
  background: #c40011;
  color: #fff;
}

/* ── Pagination ── */
.prod-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 40px;
}

.prod-page-arrow,
.prod-page-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1.5px solid #ddd5c8;
  background: #fff;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.prod-page-summary {
  min-width: 74px;
  text-align: center;
  color: #4a5568;
  font-size: 13px;
  font-weight: 700;
}

.prod-page-num:hover,
.prod-page-arrow:hover:not(:disabled) {
  border-color: #c40011;
  color: #c40011;
}

.prod-page-num.active {
  background: #c40011;
  border-color: #c40011;
  color: #fff;
  font-weight: 700;
}

.prod-page-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Responsive ── */
@media (max-width: $bp-laptop) {
  .prod-shell {
    grid-template-columns: 200px 1fr;
    gap: 20px;
    padding: 30px $container-padding-desktop;
  }
}

@media (max-width: $bp-tablet) {
  .prod-shell {
    grid-template-columns: 1fr;
    padding: 24px $container-padding-mobile;
  }

  .prod-sidebar {
    position: static;
    margin-bottom: 24px;
  }

  .prod-hero {
    min-height: 300px;
    height: 42svh;
  }

  .prod-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .prod-toolbar {
    align-items: stretch;
  }

  .prod-search {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .prod-shell {
    gap: 16px;
    padding-top: 18px;
  }

  .prod-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 10px;
    gap: 10px;
    letter-spacing: 0.12em;
  }

  .prod-sidebar__toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    max-width: 70%;
    padding: 7px 10px;
    border: 1px solid rgba(29, 40, 61, 0.15);
    border-radius: 999px;
    background: #fff;
    color: #1d283d;
    font-size: 11px;
    font-weight: 700;
    text-transform: none;
  }

  .prod-sidebar__toggle > span:first-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .prod-sidebar__tree {
    padding: 14px 12px;
    border-radius: 16px;
  }

  .prod-cat-root {
    margin-bottom: 10px;
    padding-bottom: 10px;
  }

  .prod-cat-root__title {
    font-size: 18px;
  }

  .prod-cat-tree {
    gap: 4px;
  }

  .prod-cat-item {
    padding: 8px 10px;
    padding-left: calc(10px + (var(--depth) * 14px));
    border-radius: 10px;
    font-size: 13px;
  }

  .prod-hero__content {
    width: 100%;
    padding-left: 18px;
    padding-right: 18px;
  }

  .prod-hero__breadcrumb {
    left: 18px;
    right: 18px;
    flex-wrap: wrap;
  }

  .prod-cat-item {
    gap: 8px;
    grid-template-columns: 16px minmax(0, 1fr) auto;
    align-items: center;
  }

  .prod-cat-item__label {
    min-width: 0;
  }

  .prod-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .prod-card__body {
    padding: 10px;
  }

  .prod-card__desc,
  .prod-card__specs,
  .prod-card__video {
    display: none;
  }

  .prod-card__name {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .prod-card__footer {
    flex-direction: column;
  }

  .prod-card__detail-btn,
  .prod-card__inquiry-btn {
    padding: 7px 8px;
    font-size: 12px;
  }

  .prod-pagination {
    margin-top: 24px;
    gap: 10px;
  }

  .prod-page-arrow {
    width: 34px;
    height: 34px;
    border-radius: 999px;
  }
}


.prod-card__price-row {
  margin: 12px 0;
}

.prod-card__price {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.prod-card__cart-btn {
  background: #f1f5f9;
  border: none;
  color: #1e293b;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1e293b;
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

@media (max-width: 560px) {
  .cart-success-toast {
    top: 76px;
    right: 16px;
    left: 16px;
    max-width: none;
    text-align: center;
  }

  .prod-card__cart-btn {
    width: 34px;
    height: 34px;
  }
  
  .prod-card__price {
    font-size: 15px;
  }
}
</style>
