<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, MapPin, CalendarDays, Package2, ArrowUpRight } from 'lucide-vue-next'
import { getProjectDetail } from '@/views/user/services/publicApi'
import { uiState } from '@/shared/utils/uiState'

const route = useRoute()

const project = ref(null)
const loading = ref(true)
const error = ref(null)

const imageUrl = (media) => media?.url || ''
const galleryUrl = (item) => item?.media?.url || ''
const usedProducts = computed(() => project.value?.used_products || [])

const formatYear = (value) => {
  if (!value) return ''
  return String(value)
}

async function loadProject(slug) {
  loading.value = true
  error.value = null
  try {
    project.value = await getProjectDetail(slug)
    if (project.value?.meta_title) {
      document.title = project.value.meta_title
    } else if (project.value?.title) {
      document.title = `${project.value.title} | China Decor`
    }

    const description = project.value?.meta_description || project.value?.summary || ''
    let meta = document.head.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  } catch (err) {
    error.value = err?.message || 'Failed to load project.'
    project.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    if (slug) {
      loadProject(slug)
    }
  },
  { immediate: true }
)

onMounted(() => {
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
  uiState.isFooterHidden = false
})
</script>

<template>
  <div class="project-detail-page">
    <section v-if="loading" class="project-state">
      <div class="container project-state__inner">
        <p>Loading project...</p>
      </div>
    </section>

    <section v-else-if="error" class="project-state project-state--error">
      <div class="container project-state__inner">
        <h1>Project not found</h1>
        <p>{{ error }}</p>
        <router-link to="/projects" class="project-back-link">Back to Projects</router-link>
      </div>
    </section>

    <template v-else-if="project">
      <section
        class="project-hero"
        :style="{ backgroundImage: imageUrl(project.hero_image) ? `url(${imageUrl(project.hero_image)})` : 'none' }"
      >
        <div class="project-hero__overlay"></div>
        <div class="container project-hero__content">
          <router-link to="/projects" class="project-back-link project-back-link--hero">
            <ArrowLeft :size="16" />
            Back to Projects
          </router-link>

          <div class="project-hero__meta-row">
            <span v-if="project.category?.name" class="project-badge">{{ project.category.name }}</span>
            <span v-if="project.project_year" class="project-badge project-badge--muted">
              <CalendarDays :size="14" />
              {{ formatYear(project.project_year) }}
            </span>
            <span v-if="project.location" class="project-badge project-badge--muted">
              <MapPin :size="14" />
              {{ project.location }}
            </span>
          </div>

          <h1>{{ project.title }}</h1>
          <p v-if="project.summary" class="project-hero__summary">{{ project.summary }}</p>
        </div>
      </section>

      <section class="project-content">
        <div class="container project-content__grid">
          <article class="project-main-card">
            <div v-if="imageUrl(project.image)" class="project-cover-image">
              <img :src="imageUrl(project.image)" :alt="project.title" />
            </div>

            <div class="project-main-copy">
              <div class="project-info-list">
                <div v-if="project.category?.name" class="project-info-item">
                  <span class="label">Category</span>
                  <strong>{{ project.category.name }}</strong>
                </div>
                <div v-if="project.project_year" class="project-info-item">
                  <span class="label">Year</span>
                  <strong>{{ formatYear(project.project_year) }}</strong>
                </div>
                <div v-if="project.location" class="project-info-item">
                  <span class="label">Location</span>
                  <strong>{{ project.location }}</strong>
                </div>
              </div>

              <p v-if="project.summary" class="project-lead">{{ project.summary }}</p>

              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-if="project.body" class="project-body" v-html="project.body"></div>
            </div>
          </article>

          <aside class="project-side-card">
            <div class="project-side-card__header">
              <span class="project-side-card__eyebrow">Project Overview</span>
              <h2>Tổng quan dự án</h2>
            </div>
            <p>
              Nội dung dự án được tải trực tiếp từ CMS/public API. Khi dữ liệu mapping được khai báo,
              phần sản phẩm sử dụng bên dưới sẽ hiển thị hoàn toàn động theo từng dự án.
            </p>
            <router-link to="/projects" class="project-back-link">Explore all projects</router-link>
          </aside>
        </div>
      </section>

      <section class="project-products">
        <div class="container">
          <div class="project-products__heading">
            <div>
              <span class="project-products__eyebrow">Mapping Product</span>
              <h2>Sản phẩm sử dụng</h2>
              <p>
                Theo requirement, mỗi dự án cần thể hiện rõ các sản phẩm đã ứng dụng trong công trình.
              </p>
            </div>
          </div>

          <div v-if="usedProducts.length" class="project-products__grid">
            <article v-for="item in usedProducts" :key="item.id" class="used-product-card">
              <div class="used-product-card__media">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" />
                <div v-else class="used-product-card__placeholder">
                  <Package2 :size="28" />
                  <span>CMS image pending</span>
                </div>
              </div>

              <div class="used-product-card__body">
                <div class="used-product-card__meta">
                  <span class="used-product-card__order">#{{ item.sort_order ?? 0 }}</span>
                </div>
                <h3>{{ item.name }}</h3>
                <p v-if="item.short_desc">{{ item.short_desc }}</p>
                <p v-else class="used-product-card__fallback">
                  Chưa có mô tả ngắn cho sản phẩm này trong CMS.
                </p>
                <p v-if="item.note" class="used-product-card__note">{{ item.note }}</p>
                <router-link :to="item.href || `/products/${item.slug}`" class="used-product-card__link">
                  Xem chi tiết sản phẩm
                  <ArrowUpRight :size="16" />
                </router-link>
              </div>
            </article>
          </div>

          <div v-else class="project-products__empty">
            <Package2 :size="30" />
            <h3>Chưa có dữ liệu mapping sản phẩm</h3>
            <p>
              File Excel hiện chưa có dữ liệu dự án thực tế, nên section này đang chờ business bổ sung
              mapping Project → Product trong CMS.
            </p>
          </div>
        </div>
      </section>

      <section v-if="project.gallery?.length" class="project-gallery">
        <div class="container">
          <div class="project-gallery__heading">
            <h2>Project Gallery</h2>
            <p>Images attached from the CMS gallery for this project.</p>
          </div>

          <div class="project-gallery__grid">
            <figure v-for="item in project.gallery" :key="item.id" class="gallery-card">
              <img :src="galleryUrl(item)" :alt="item.caption || project.title" />
              <figcaption v-if="item.caption">{{ item.caption }}</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.project-detail-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(206, 0, 33, 0.06), transparent 22%),
    radial-gradient(circle at bottom right, rgba(24, 39, 75, 0.08), transparent 24%),
    linear-gradient(180deg, #f7f8fb 0%, #ffffff 30%, #f4f6f9 100%);
}

.project-state {
  min-height: 70vh;
  display: flex;
  align-items: center;
}

.project-state__inner {
  text-align: center;
}

.project-state__inner h1 {
  margin-bottom: 12px;
  font-size: clamp(2rem, 4vw, 3rem);
  color: #1d273a;
}

.project-state__inner p {
  margin-bottom: 18px;
  color: #667085;
  font-size: 1rem;
}

.project-state--error p {
  color: #b42318;
}

.project-hero {
  position: relative;
  min-height: 520px;
  background-size: cover;
  background-position: center;
  color: #fff;
}

.project-hero__overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(8, 18, 38, 0.55) 0%, rgba(8, 18, 38, 0.38) 38%, rgba(8, 18, 38, 0.78) 100%),
    linear-gradient(90deg, rgba(8, 18, 38, 0.72) 0%, rgba(8, 18, 38, 0.12) 60%);
}

.project-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 520px;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: 140px;
  padding-bottom: 72px;
}

.project-hero__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.project-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 9px 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  font-size: 0.95rem;
}

.project-badge--muted {
  background: rgba(9, 16, 32, 0.24);
}

.project-hero h1 {
  max-width: 860px;
  margin: 0;
  font-size: clamp(2.4rem, 5vw, 4.3rem);
  line-height: 1.08;
}

.project-hero__summary {
  max-width: 760px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 1.08rem;
  line-height: 1.8;
}

.project-content {
  padding: 56px 0 40px;
}

.project-content__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
  gap: 28px;
  align-items: start;
}

.project-main-card,
.project-side-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  box-shadow: 0 24px 60px rgba(14, 26, 52, 0.08);
}

.project-main-card {
  overflow: hidden;
}

.project-cover-image img {
  display: block;
  width: 100%;
  max-height: 520px;
  object-fit: cover;
}

.project-main-copy {
  padding: 30px;
}

.project-info-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 22px;
}

.project-info-item {
  min-width: 140px;
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #f9fafb 0%, #f2f4f7 100%);
}

.project-info-item .label {
  display: block;
  margin-bottom: 8px;
  color: #667085;
  font-size: 0.86rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.project-info-item strong {
  color: #18274b;
  font-size: 1rem;
}

.project-lead {
  margin: 0 0 22px;
  color: #1d2939;
  font-size: 1.1rem;
  line-height: 1.9;
}

.project-body {
  color: #475467;
  line-height: 1.85;
}

.project-body :deep(p + p) {
  margin-top: 16px;
}

.project-body :deep(h2),
.project-body :deep(h3) {
  margin-top: 28px;
  margin-bottom: 12px;
  color: #18274b;
}

.project-side-card__header {
  margin-bottom: 14px;
}

.project-side-card__eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  color: #ce0021;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.project-products {
  padding: 0 0 64px;
}

.project-products__heading {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.project-products__eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  color: #ce0021;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.project-products__heading h2 {
  margin: 0 0 10px;
  color: #1d273a;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
}

.project-products__heading p {
  max-width: 720px;
  margin: 0;
  color: #667085;
  line-height: 1.8;
}

.project-products__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.used-product-card {
  overflow: hidden;
  border: 1px solid rgba(24, 39, 75, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 60px rgba(14, 26, 52, 0.08);
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.used-product-card:hover {
  transform: translateY(-6px);
  border-color: rgba(206, 0, 33, 0.18);
  box-shadow: 0 30px 70px rgba(14, 26, 52, 0.12);
}

.used-product-card__media {
  position: relative;
  aspect-ratio: 4 / 3;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f6 100%);
}

.used-product-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.used-product-card__placeholder {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #667085;
}

.used-product-card__body {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  padding: 22px;
}

.used-product-card__meta {
  margin-bottom: 10px;
}

.used-product-card__order {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(206, 0, 33, 0.08);
  color: #b21734;
  padding: 6px 10px;
  font-size: 0.8rem;
  font-weight: 700;
}

.used-product-card h3 {
  margin: 0 0 12px;
  color: #1d273a;
  font-size: 1.2rem;
}

.used-product-card p {
  margin: 0 0 12px;
  color: #667085;
  line-height: 1.75;
}

.used-product-card__fallback {
  font-style: italic;
}

.used-product-card__note {
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff7f8 0%, #fff1f3 100%);
  color: #7a2231;
}

.used-product-card__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  color: #ce0021;
  font-weight: 700;
}

.project-products__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 24px;
  border: 1px dashed rgba(24, 39, 75, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  text-align: center;
}

.project-products__empty h3 {
  margin: 0;
  color: #1d273a;
}

.project-products__empty p {
  max-width: 700px;
  margin: 0;
  color: #667085;
  line-height: 1.8;
}

.gallery-card {
  overflow: hidden;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 50px rgba(14, 26, 52, 0.08);
}

.gallery-card img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.gallery-card figcaption {
  padding: 14px 16px 18px;
  color: #667085;
  font-size: 0.94rem;
  line-height: 1.7;
}

@media (max-width: 1024px) {
  .project-content__grid {
    grid-template-columns: 1fr;
  }

  .project-side-card {
    position: static;
  }

  .project-products__grid,
  .project-gallery__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .project-hero__content {
    min-height: 440px;
    padding-top: 120px;
    padding-bottom: 52px;
  }

  .project-main-copy {
    padding: 20px;
  }

  .project-info-list {
    flex-direction: column;
  }

  .project-products__heading {
    display: block;
  }

  .project-products__grid,
  .project-gallery__grid {
    grid-template-columns: 1fr;
  }

  .used-product-card__body {
    min-height: auto;
  }
}
</style>

