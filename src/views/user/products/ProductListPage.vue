<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Home, Play, Search, X, SlidersHorizontal } from 'lucide-vue-next'
import { uiState } from '@/shared/utils/uiState'
import { listProductCategories, listProducts } from '@/views/user/services/productsApi'

const route = useRoute()
const router = useRouter()

const categories = ref([])
const products = ref([])
const totalProducts = ref(0)
const loadingCats = ref(false)
const loadingProducts = ref(false)
const activeCategorySlug = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 9

const totalPages = computed(() => Math.max(1, Math.ceil(totalProducts.value / PAGE_SIZE)))
const activeCategory = computed(() => categories.value.find(c => c.slug === activeCategorySlug.value) || null)
const hasVideoUrl = (product) => Boolean(String(product?.video_url || '').trim())

async function fetchCategories() {
  loadingCats.value = true
  try {
    const res = await listProductCategories()
    categories.value = res.items || []
  } catch {
    categories.value = []
  } finally {
    loadingCats.value = false
  }
}

async function fetchProducts() {
  loadingProducts.value = true
  try {
    const res = await listProducts({
      categorySlug: activeCategorySlug.value,
      skip: (currentPage.value - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
    products.value = res.items || []
    totalProducts.value = res.pagination?.total || 0
  } catch {
    products.value = []
    totalProducts.value = 0
  } finally {
    loadingProducts.value = false
  }
}

function selectCategory(slug) {
  activeCategorySlug.value = slug
  currentPage.value = 1
  router.replace({ query: slug ? { category: slug } : {} })
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  window.scrollTo({ top: 400, behavior: 'smooth' })
}

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return products.value
  const q = searchQuery.value.toLowerCase()
  return products.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    p.short_desc.toLowerCase().includes(q)
  )
})

watch(activeCategorySlug, fetchProducts)
watch(currentPage, fetchProducts)

onMounted(async () => {
  uiState.isHeaderHidden = false
  uiState.isFooterHidden = false
  const catFromQuery = route.query.category || ''
  activeCategorySlug.value = catFromQuery
  await fetchCategories()
  await fetchProducts()
})
</script>

<template>
  <div class="products-page">
    <!-- Hero -->
    <section class="prod-hero">
      <div class="prod-hero__overlay" />
      <div class="prod-hero__content">
        <p class="prod-hero__eyebrow">THIÊN ĐỒNG VIỆT NAM</p>
        <h1 class="prod-hero__title">Sản Phẩm</h1>
        <div class="prod-hero__line" />
        <p class="prod-hero__sub">Khám phá bộ sưu tập vật liệu nội thất cao cấp của chúng tôi</p>
      </div>
      <!-- Breadcrumb -->
      <nav class="prod-hero__breadcrumb" aria-label="Breadcrumb">
        <router-link to="/"><Home :size="14" />Trang Chủ</router-link>
        <ChevronRight :size="13" />
        <span>Sản Phẩm</span>
      </nav>
    </section>

    <!-- Main layout -->
    <div class="prod-shell">
      <!-- Sidebar: Categories -->
      <aside class="prod-sidebar">
        <div class="prod-sidebar__header">
          <SlidersHorizontal :size="16" />
          <span>Danh Mục</span>
        </div>
        <ul class="prod-cat-list">
          <li>
            <button
              :class="['prod-cat-item', { active: !activeCategorySlug }]"
              @click="selectCategory('')"
            >
              Tất Cả Sản Phẩm
              <span class="prod-cat-count">{{ categories.reduce((s, c) => s + (c.product_count || 0), 0) }}</span>
            </button>
          </li>
          <li v-for="cat in categories" :key="cat.id">
            <button
              :class="['prod-cat-item', { active: activeCategorySlug === cat.slug }]"
              @click="selectCategory(cat.slug)"
            >
              <img
                v-if="cat.image_url"
                class="prod-cat-thumb"
                :src="cat.image_url"
                :alt="cat.name"
                loading="lazy"
              />
              <span v-else class="prod-cat-thumb prod-cat-thumb--fallback" aria-hidden="true">
                {{ cat.name?.charAt(0) || 'C' }}
              </span>
              {{ cat.name }}
              <span class="prod-cat-count">{{ cat.product_count }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <!-- Main -->
      <main class="prod-main">
        <!-- Toolbar -->
        <div class="prod-toolbar">
          <div class="prod-toolbar__info">
            <span v-if="activeCategory">
              <strong>{{ activeCategory.name }}</strong> — {{ totalProducts }} sản phẩm
            </span>
            <span v-else>Tất cả — <strong>{{ totalProducts }}</strong> sản phẩm</span>
          </div>
          <div class="prod-search">
            <Search :size="16" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm sản phẩm, mã SKU..."
              aria-label="Tìm kiếm sản phẩm"
            />
            <button v-if="searchQuery" class="prod-search__clear" @click="searchQuery = ''" aria-label="Xóa tìm kiếm">
              <X :size="14" />
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingProducts" class="prod-status">
          <div class="prod-spinner" />
          <span>Đang tải sản phẩm...</span>
        </div>

        <!-- Empty -->
        <div v-else-if="!filteredProducts.length" class="prod-status prod-status--empty">
          <p>Không tìm thấy sản phẩm phù hợp.</p>
        </div>

        <!-- Grid -->
        <div v-else class="prod-grid">
          <article
            v-for="product in filteredProducts"
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
              <p class="prod-card__desc">{{ product.short_desc }}</p>
              <div class="prod-card__specs" v-if="product.size || product.material">
                <span v-if="product.material">
                  <strong>Chất liệu:</strong> {{ product.material }}
                </span>
                <span v-if="product.size">
                  <strong>Kích thước:</strong> {{ product.size }}
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
                  <strong>Video Demo</strong>
                  <small>Xem ngay nÃ´i dung video cá»§a sáº£n pháº©m</small>
                </span>
              </a>
              <div class="prod-card__footer">
                <router-link :to="`/products/${product.slug}`" class="prod-card__detail-btn">
                  Xem Chi Tiết
                </router-link>
                <router-link
                  :to="{ path: `/products/${product.slug}`, query: { inquiry: '1' } }"
                  class="prod-card__inquiry-btn"
                >
                  Gửi Yêu Cầu
                </router-link>
              </div>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1 && !searchQuery" class="prod-pagination">
          <button
            class="prod-page-arrow"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
            aria-label="Trang trước"
          >←</button>
          <button
            v-for="page in totalPages"
            :key="page"
            :class="['prod-page-num', { active: currentPage === page }]"
            @click="goToPage(page)"
          >{{ page }}</button>
          <button
            class="prod-page-arrow"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
            aria-label="Trang sau"
          >→</button>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Page wrapper ── */
.products-page {
  min-height: 100vh;
  background: #faf8f5;
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
  color: #fff;
  font-family: 'Times New Roman', serif;
  font-size: clamp(2rem, 3vw, 3.2rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.prod-hero__line {
  width: 60px;
  height: 2px;
  margin: 14px 0;
  background: #c40011;
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
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 32px;
  max-width: 1480px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

/* ── Sidebar ── */
.prod-sidebar {
  position: sticky;
  top: 112px;
  align-self: start;
}

.prod-sidebar__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 12px;
  margin-bottom: 8px;
  border-bottom: 2px solid #c40011;
  color: #1d283d;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.prod-cat-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prod-cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #4a5568;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.prod-cat-item > :not(.prod-cat-count) {
  flex-shrink: 0;
}

.prod-cat-thumb {
  width: 34px;
  height: 34px;
  margin-right: 10px;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(10, 17, 32, 0.08);
  box-shadow: inset 0 0 0 1px rgba(10, 17, 32, 0.08);
}

.prod-cat-thumb--fallback {
  display: grid;
  place-items: center;
  color: #c40011;
  font-size: 13px;
  font-weight: 700;
  background: rgba(196, 0, 17, 0.08);
}

.prod-cat-item:hover {
  background: #f0ebe3;
  color: #1d283d;
}

.prod-cat-item.active {
  background: #c40011;
  color: #fff;
  font-weight: 600;
}

.prod-cat-item.active .prod-cat-count {
  background: rgba(255,255,255,0.22);
  color: #fff;
}

.prod-cat-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #f0ebe3;
  color: #7a6652;
  font-size: 11px;
  font-weight: 600;
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
  color: #6b7280;
  font-size: 14px;
}

.prod-toolbar__info strong {
  color: #1d283d;
}

.prod-search {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid #ddd5c8;
  border-radius: 8px;
  background: #fff;
  color: #999;
  min-width: 240px;
  transition: border-color 0.2s;
}

.prod-search:focus-within {
  border-color: #c40011;
  color: #c40011;
}

.prod-search input {
  border: none;
  outline: none;
  background: transparent;
  color: #1d283d;
  font-size: 14px;
  flex: 1;
}

.prod-search input::placeholder { color: #bbb; }

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

/* ── Status ── */
.prod-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 20px;
  color: #9ca3af;
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
@media (max-width: 900px) {
  .prod-shell {
    grid-template-columns: 1fr;
  }
  .prod-sidebar {
    position: static;
  }
  .prod-cat-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .prod-cat-item {
    flex: 0 0 auto;
    padding: 8px 14px;
  }
}

@media (max-width: 600px) {
  .prod-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .prod-search { min-width: auto; }
  .prod-grid {
    grid-template-columns: 1fr;
  }
  .prod-hero { height: 45vh; }
}
</style>
