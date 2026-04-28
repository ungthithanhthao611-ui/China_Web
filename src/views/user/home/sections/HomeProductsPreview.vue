<script setup>
import { onMounted, ref } from 'vue'

import { env } from '@/shared/config/env'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'
import { listProducts } from '@/views/user/services/productsApi'

const loading = ref(true)
const items = ref([])
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.24 })
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

function resolveAssetUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

function resolveProductImage(product) {
  const primary = String(product?.image_url || '').trim()
  if (primary) return resolveAssetUrl(primary)

  const gallery = Array.isArray(product?.images) ? product.images : []
  return resolveAssetUrl(gallery[0]?.url || '')
}

async function loadProducts() {
  loading.value = true
  try {
    const payload = await listProducts({ skip: 0, limit: 4 })
    const rows = Array.isArray(payload?.items) ? payload.items : []
    items.value = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      category: row.category_name,
      summary: row.short_desc || '',
      image: resolveProductImage(row),
    }))
  } catch (error) {
    console.warn('[home] failed to load products:', error?.message || error)
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadProducts)
</script>

<template>
  <section class="home-products" ref="rootRef">
    <div class="shell home-reveal" :class="{ 'is-visible': isVisible }">
      <header class="section-head" data-reveal-item>
        <p>Sản phẩm chủ lực</p>
        <h2>Sản phẩm nổi bật mới nhất</h2>
        <span class="sub-head">Giải pháp vật liệu trang trí hiện đại - Bền đẹp - Linh hoạt - Thẩm mỹ cao</span>
      </header>

      <div v-if="items.length" class="grid">
        <article v-for="item in items" :key="item.id" class="card" data-reveal-item>
          <router-link :to="`/products/${item.slug}`" class="visual-link">
            <div class="visual">
              <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
              <span class="cat-badge">{{ item.category || 'Sản phẩm' }}</span>
              <div v-if="!item.image" class="placeholder">P</div>
            </div>
          </router-link>

          <div class="body">
            <p class="category">{{ item.category || 'Product' }}</p>
            <h3>
              <router-link :to="`/products/${item.slug}`">{{ item.name }}</router-link>
            </h3>
            <p class="summary">{{ item.summary || 'Thông tin sản phẩm đang được cập nhật.' }}</p>
            <div class="card-foot">
              <router-link :to="`/products/${item.slug}`" class="detail-link">
                <span class="dot-arrow">→</span>
                <span>Xem chi tiết</span>
              </router-link>
              <span class="stack-icon">◈</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty" data-reveal-item>
        <p>{{ loading ? 'Đang tải sản phẩm...' : 'Chưa có dữ liệu sản phẩm.' }}</p>
      </div>

      <div class="section-action" data-reveal-item>
        <router-link to="/products" class="btn-all">Xem tất cả sản phẩm</router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-products {
  padding: var(--home-section-pad, clamp(64px, 8vw, 108px)) 0;
  background:
    radial-gradient(circle at 20% 8%, rgba(178, 14, 23, 0.04), transparent 28%),
    linear-gradient(180deg, #fdfdfe, #f7f8fa);
}

.shell {
  width: 100%;
  max-width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
  padding: 0;
}

.section-head {
  position: relative;
  display: grid;
  justify-items: center;
  text-align: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-head::before,
.section-head::after {
  content: '';
  position: absolute;
  top: 52%;
  width: 58px;
  height: 16px;
  opacity: 0.5;
  background-image: radial-gradient(circle, #d8dbe1 2px, transparent 2px);
  background-size: 12px 12px;
}

.section-head::before {
  left: calc(50% - min(31vw, 480px));
}

.section-head::after {
  right: calc(50% - min(31vw, 480px));
}

.section-head p {
  margin: 0;
  color: var(--home-accent, #b20e17);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.section-head h2 {
  margin: 4px 0 0;
  color: var(--home-text-strong, #151f31);
  font-size: clamp(1.55rem, 1.8vw, 2.5rem);
  line-height: 1.06;
  font-family: var(--home-font-body, 'Manrope', 'Segoe UI', Arial, sans-serif);
  font-weight: 800;
  text-transform: uppercase;
}

.sub-head {
  color: #667085;
  font-size: clamp(11px, 0.66vw, 14px);
  line-height: 1.5;
}

/* ── Product card row – pure Flexbox ── */
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 32px;
  align-items: stretch;
}

.card {
  /* Desktop: 4 cột — trừ gap 3×16px = 48px chia cho 4 */
  flex: 1 1 calc(25% - 12px);
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  border: 1px solid rgba(17, 24, 39, 0.06);
  background: #fff;
  overflow: hidden;
  box-shadow: 0 14px 32px rgba(17, 24, 39, 0.06);
  transition: box-shadow 0.22s ease, transform 0.22s ease;
}

.card:hover {
  box-shadow: 0 20px 48px rgba(17, 24, 39, 0.12);
  transform: translateY(-3px);
}

.visual {
  position: relative;
  aspect-ratio: 4/3;
  background: linear-gradient(160deg, #f3f5f8, #e9edf3);
  flex-shrink: 0;
}

.visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #a0a8b6;
  font-size: 38px;
  font-weight: 700;
}

.cat-badge {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(17, 24, 39, 0.08);
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 8px;
  padding: 14px 14px 12px;
}

.category {
  display: none;
  margin: 0;
  color: #7e8898;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.body h3 {
  margin: 0;
  font-size: clamp(18px, 0.98vw, 24px);
  line-height: 1.28;
  font-family: var(--home-font-body, 'Manrope', 'Segoe UI', Arial, sans-serif);
  font-weight: 800;
}

.body h3 a {
  color: var(--home-text-strong, #151f31);
  text-decoration: none;
}

.summary {
  flex: 1;
  margin: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.7;
  font-family: var(--home-font-body, 'Segoe UI', Arial, sans-serif);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.card-foot {
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  text-decoration: none;
  font-weight: 600;
}

.dot-arrow {
  display: inline-flex;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
  background: var(--home-accent, #b20e17);
  color: #fff;
  line-height: 1;
  font-size: 16px;
}

.stack-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #9ca3af;
}

.empty {
  margin-top: 18px;
  padding: 18px 20px;
  border-radius: 14px;
  background: #f6f7f9;
  color: var(--home-text-muted, #4d596d);
}

.section-action {
  margin-top: 34px;
  display: flex;
  justify-content: center;
}

.btn-all {
  display: inline-flex;
  align-items: center;
  min-height: 52px;
  padding: 0 34px;
  border-radius: 999px;
  background: var(--home-accent, #b20e17);
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  font-weight: 800;
}

/* ── Tablet: 2 cột ── */
@media (max-width: 900px) {
  .card {
    flex: 1 1 calc(50% - 8px);
  }

  .section-head::before,
  .section-head::after {
    display: none;
  }

  .body h3 {
    font-size: clamp(17px, 2.4vw, 21px);
  }
}

/* ── Mobile chung ── */
@media (max-width: 767px) {
  .home-products {
    padding: 44px 0 54px;
  }

  .shell {
    width: calc(100% - 24px);
  }

  .section-head {
    gap: 6px;
    margin-bottom: 4px;
  }

  .section-head p {
    font-size: 10px;
    letter-spacing: 0.18em;
  }

  .section-head h2 {
    font-size: 36px;
    line-height: 1;
  }

  .sub-head {
    font-size: 12px;
    line-height: 1.4;
    max-width: 34ch;
  }

  .grid {
    gap: 12px;
    margin-top: 16px;
  }

  .card {
    border-radius: 14px;
  }

  .body {
    padding: 12px;
    gap: 6px;
  }

  .body h3 {
    font-size: 16px;
    line-height: 1.2;
  }

  .summary {
    font-size: 11.5px;
    line-height: 1.5;
    -webkit-line-clamp: 4;
    overflow: hidden;
  }

  .cat-badge {
    left: 8px;
    bottom: 8px;
    min-height: 26px;
    padding: 0 9px;
    font-size: 9px;
  }

  .detail-link {
    gap: 6px;
    font-size: 12px;
  }

  .dot-arrow {
    width: 24px;
    height: 24px;
    font-size: 13px;
  }

  .stack-icon {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }

  .btn-all {
    min-height: 40px;
    font-size: 14px;
    padding: 0 18px;
  }
}

/* ── Mobile nhỏ: 1 cột ── */
@media (max-width: 600px) {
  .card {
    flex: 1 1 100%;
  }

  .section-head h2 {
    font-size: 30px;
  }

  .visual {
    aspect-ratio: 16/9;
  }

  .summary {
    -webkit-line-clamp: 3;
  }
}
</style>
