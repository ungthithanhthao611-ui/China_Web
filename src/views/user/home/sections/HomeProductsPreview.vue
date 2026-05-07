<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from 'lucide-vue-next'

import { env } from '@/shared/config/env'
import { useHomeBootstrap } from '@/views/user/home/composables/useHomeBootstrap'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'

const items = ref([])
const activeIndex = ref(0)
const { locale, t } = useI18n({ useScope: 'global' })
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.1 })
const { data: homeBootstrap, loading } = useHomeBootstrap()
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

function resolveAssetUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')

function resolveProductImage(product) {
  const primary = String(product?.image_url || '').trim()
  if (primary) return resolveAssetUrl(primary)

  const gallery = Array.isArray(product?.images) ? product.images : []
  return resolveAssetUrl(gallery[0]?.url || '')
}

function syncProducts() {
  const rows = Array.isArray(homeBootstrap.value?.products?.items) ? homeBootstrap.value.products.items : []
  items.value = rows.map((row) => {
    let category = row.category_name
    let name = row.name

    if (locale.value !== 'vi') {
      const nCat = normalizeText(category).toUpperCase()
      if (nCat.includes('VAN DA')) category = t('user.products.catStone') || 'Stone Texture'
      else if (nCat.includes('VAN VAI')) category = t('user.products.catFabric') || 'Fabric Texture'
      else if (nCat.includes('3D')) category = t('user.products.cat3D') || '3D Texture'
      else if (nCat.includes('XI MANG')) category = t('user.products.catCement') || 'Cement Texture'
      else if (nCat.includes('GACH THE')) category = t('user.products.catBrick') || 'Brick Texture'
      else if (nCat.includes('LINH HOAT')) category = t('user.products.catFlexible') || 'Flexible Cladding'

      const n = normalizeText(name)
      let prefix = ''
      if (n.includes('da phien')) prefix = locale.value === 'en' ? 'Slate' : '石板'
      else if (n.includes('da travertine')) prefix = locale.value === 'en' ? 'Travertine' : '洞石'
      else if (n.includes('da xe ranh')) prefix = locale.value === 'en' ? 'Grooved Stone' : '开槽石材'
      else if (n.includes('da van song')) prefix = locale.value === 'en' ? 'Wave Stone' : '波浪纹石材'
      else if (n.includes('da nuoc chay')) prefix = locale.value === 'en' ? 'Water Flow Stone' : '流水石材'
      else if (n.includes('da dacit')) prefix = locale.value === 'en' ? 'Dacite Stone' : '安山岩'
      else if (n.includes('da ') || n.startsWith('da ')) prefix = locale.value === 'en' ? 'Stone' : '石材'
      else if (n.includes('dat nen')) prefix = locale.value === 'en' ? 'Earth Texture' : '地表纹理'
      else if (n.includes('dan tre')) prefix = locale.value === 'en' ? 'Bamboo Woven' : '竹编纹理'
      else if (n.includes('van vai')) prefix = locale.value === 'en' ? 'Fabric Texture' : '织物纹理'
      else if (n.includes('van soi')) prefix = locale.value === 'en' ? 'Fiber Texture' : '纤维纹理'
      else if (n.includes('be tong')) prefix = locale.value === 'en' ? 'Concrete' : '混凝土'

      if (prefix) {
        if (n.includes('3d')) name = prefix + ' 3D'
        else name = prefix
      } else if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(name)) {
        name = normalizeText(name).toUpperCase()
      }
    }

    return {
      id: row.id,
      name,
      slug: row.slug,
      category,
      summary: locale.value === 'vi' ? (row.short_desc || '') : t('user.home.productDescriptionFallback'),
      image: resolveProductImage(row),
    }
  })
}

const currentProduct = computed(() => items.value[activeIndex.value] || null)

watch([homeBootstrap, locale], syncProducts, { immediate: true })
</script>

<template>
  <section class="home-products" ref="rootRef">
    <div class="shell home-reveal" :class="{ 'is-visible': isVisible }">
      <header class="section-head" data-reveal-item>
        <h2>{{ t('user.home.productsTitle') }}</h2>
      </header>

      <div v-if="loading" class="explorer-skeleton">
        <div class="skeleton-list">
          <div v-for="i in 6" :key="i" class="skeleton-item"></div>
        </div>
        <div class="skeleton-visual"></div>
      </div>

      <div v-else-if="items.length" class="products-explorer">
        <div class="explorer-list" data-reveal-item>
          <div
            v-for="(item, index) in items.slice(0, 8)"
            :key="item.id"
            class="explorer-item"
            :class="{ 'is-active': activeIndex === index }"
            @mouseenter="activeIndex = index"
          >
            <div class="item-index">{{ String(index + 1).padStart(2, '0') }}.</div>
            <div class="item-name">{{ item.name }}</div>
            <ArrowRight class="item-arrow" :size="18" />
          </div>
        </div>

        <div class="explorer-visual" data-reveal-item>
          <Transition name="fade-slide" mode="out-in">
            <router-link
              v-if="currentProduct"
              :key="currentProduct.id"
              :to="`/products/${currentProduct.slug}`"
              class="visual-box"
            >
              <img :src="currentProduct.image" :alt="currentProduct.name" />
              <div class="visual-overlay">
                <span class="view-detail-badge">{{ t('user.home.viewMore') }}</span>
                <div class="visual-info">
                  <h3>{{ currentProduct.name }}</h3>
                  <p>{{ currentProduct.category }}</p>
                </div>
              </div>
            </router-link>
          </Transition>
        </div>
      </div>

      <div v-else class="home-products__empty" data-reveal-item>
        <p>{{ t('user.home.aboutEmpty') }}</p>
      </div>

      <div class="foot-actions" data-reveal-item>
        <router-link to="/products" class="btn-primary">
          {{ t('user.home.viewAllProducts') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-products {
  padding: 100px 0;
  background: transparent;
  color: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.section-head {
  text-align: center;
  margin-bottom: 80px;
}

.section-head h2 {
  color: #1a1a1a;
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 400;
  margin-bottom: 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.products-explorer {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 60px;
  min-height: 500px;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
}

/* List Side */
.explorer-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.explorer-item {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.2, 1, 0.2, 1);
  position: relative;
}

.item-index {
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.3);
  width: 40px;
  font-family: serif;
}

.item-name {
  font-size: 22px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.6);
  flex: 1;
  transition: all 0.4s ease;
  letter-spacing: 0.02em;
}

.item-arrow {
  color: #ee1324;
  opacity: 0;
  transform: translateX(-15px);
  transition: all 0.4s ease;
}

.explorer-item:hover .item-name,
.explorer-item.is-active .item-name {
  color: #ee1324;
  font-weight: 500;
  transform: translateX(15px);
}

.explorer-item.is-active {
  background: rgba(0, 0, 0, 0.02);
  padding-left: 20px;
  padding-right: 20px;
  margin-left: -20px;
  margin-right: -20px;
}

.explorer-item.is-active .item-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* Visual Side */
.explorer-visual {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.08);
  background: #fff;
  aspect-ratio: 4 / 3;
  width: 100%;
  max-height: 480px;
}

.visual-box {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
  text-decoration: none;
}

.visual-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.2, 1, 0.2, 1);
}

.visual-box:hover img {
  transform: scale(1.08);
}

.visual-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 50%);
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  opacity: 0;
  transition: all 0.6s ease;
}

.visual-box:hover .visual-overlay {
  opacity: 1;
}

.view-detail-badge {
  position: absolute;
  top: 40px;
  right: 40px;
  background: #ee1324;
  color: #fff;
  padding: 12px 24px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  transform: translateY(-20px);
  transition: all 0.5s ease;
}

.visual-box:hover .view-detail-badge {
  transform: translateY(0);
}

.visual-info h3 {
  font-size: 32px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.visual-box:hover .visual-info h3 {
  transform: translateY(0);
}

.visual-info p {
  color: #fff;
  font-size: 13px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.8;
  transform: translateY(20px);
  transition: all 0.5s ease 0.1s;
}

.visual-box:hover .visual-info p {
  transform: translateY(0);
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.2, 1, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: scale(1.05) translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: scale(0.95) translateX(-30px);
}

/* Skeletons */
.explorer-skeleton {
  display: grid;
  grid-template-columns: 1fr 1.8fr;
  gap: 80px;
}

.skeleton-item {
  height: 64px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.02) 25%, rgba(0, 0, 0, 0.04) 50%, rgba(0, 0, 0, 0.02) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-visual {
  height: 580px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.foot-actions {
  margin-top: 80px;
  text-align: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  background: transparent;
  color: #1a1a1a;
  padding: 16px 48px;
  border-radius: 100px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(0, 0, 0, 0.2);
  transition: all 0.4s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 13px;
}

.btn-primary:hover {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
  transform: translateY(-3px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

@media (max-width: 992px) {
  .products-explorer {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .explorer-visual {
    height: 440px;
    order: -1;
  }
  .section-head {
    text-align: center;
  }
}
</style>
