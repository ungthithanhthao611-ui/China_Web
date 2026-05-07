<template>
  <section class="home-projects" ref="rootRef">
    <div class="shell home-reveal" :class="{ 'is-visible': isVisible }">
      <header class="section-head" data-reveal-item>
        <span class="eyebrow">{{ t('user.home.projectEyebrow') }}</span>
        <h2 class="section-title">{{ t('user.home.projectsTitle') }}</h2>
      </header>

      <div v-if="loading" class="projects-grid">
        <div v-for="index in 4" :key="`project-skeleton-${index}`" class="project-skeleton">
          <div class="skeleton-visual"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--sm"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </div>

      <div v-else-if="items.length" class="projects-slider-wrapper" data-reveal-item>
        <swiper
          :modules="modules"
          :slides-per-view="1.1"
          :space-between="24"
          :centered-slides="true"
          :loop="items.length > 1"
          :autoplay="{ delay: 5000, disableOnInteraction: false }"
          :navigation="{
            prevEl: '.nav-prev',
            nextEl: '.nav-next'
          }"
          :breakpoints="{
            768: { slidesPerView: 1.4, spaceBetween: 40 },
            1280: { slidesPerView: 1.6, spaceBetween: 60 }
          }"
          class="projects-swiper"
        >
          <swiper-slide v-for="(item, index) in items" :key="item.id">
            <article class="project-card">
              <router-link :to="`/projects/${item.slug}`" class="card-visual">
                <img :src="item.image" :alt="item.title" loading="lazy" />
                <div class="card-index">{{ String(index + 1).padStart(2, '0') }}</div>
                
                <!-- Info Overlay -->
                <div class="card-overlay">
                  <div class="card-info">
                    <span v-if="item.location" class="location">{{ item.location }}</span>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <div class="card-link">
                      {{ t('user.home.viewMore') }}
                      <ArrowRight :size="14" />
                    </div>
                  </div>
                </div>
              </router-link>
            </article>
          </swiper-slide>
        </swiper>

        <!-- Custom Navigation Buttons -->
        <div class="slider-controls">
          <button class="nav-prev" :aria-label="t('user.common.previous')">
            <ArrowLeft :size="20" />
          </button>
          <button class="nav-next" :aria-label="t('user.common.next')">
            <ArrowRight :size="20" />
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>{{ t('user.home.aboutEmpty') }}</p>
      </div>

      <div class="action-footer" data-reveal-item>
        <router-link to="/projects" class="btn-text">
          <span>{{ t('user.home.viewAllProjects') }}</span>
          <ArrowRight :size="16" />
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight, ArrowLeft } from 'lucide-vue-next'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Navigation } from 'swiper/modules'

import { env } from '@/shared/config/env'
import { useHomeBootstrap } from '@/views/user/home/composables/useHomeBootstrap'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'

import 'swiper/css'
import 'swiper/css/navigation'

const items = ref([])
const modules = [Autoplay, Navigation]
const { locale, t } = useI18n({ useScope: 'global' })
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.24 })
const { data: homeBootstrap, loading, ensureLoaded } = useHomeBootstrap()
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

function resolveAssetUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

function resolveProjectImage(project) {
  return resolveAssetUrl(
    project?.hero_image?.url ||
      project?.image?.url ||
      project?.image_url ||
      '',
  )
}

function syncProjects() {
  const rows = Array.isArray(homeBootstrap.value?.projects?.items) ? homeBootstrap.value.projects.items : []
  items.value = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    location: row.location || '',
    image: resolveProjectImage(row),
  }))
}

watch([homeBootstrap, locale], syncProjects, { immediate: true })
ensureLoaded().catch(() => {})
</script>

<style scoped>
.home-projects {
  padding: 100px 0;
  background: #fdfdfb;
  position: relative;
  overflow: hidden;
}

.shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 40px;
}

.section-head {
  text-align: center;
  margin-bottom: 64px;
}

.eyebrow {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #ee1324;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  margin-bottom: 12px;
}

.section-title {
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.projects-slider-wrapper {
  position: relative;
  margin: 0 -10px;
  padding: 10px;
}

.slider-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 4%;
  pointer-events: none;
  z-index: 20;
}

.nav-prev,
.nav-next {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.nav-prev:hover,
.nav-next:hover {
  background: #ee1324;
  border-color: #ee1324;
  transform: scale(1.1);
  box-shadow: 0 15px 40px rgba(238, 19, 36, 0.3);
}

.nav-prev.swiper-button-disabled,
.nav-next.swiper-button-disabled {
  opacity: 0.3;
  cursor: not-allowed;
  pointer-events: none;
}

.projects-swiper {
  padding-bottom: 20px;
  overflow: visible !important;
}

@media (max-width: 1024px) {
  .slider-controls {
    display: none; /* Hide on mobile to avoid clutter, swipe is better */
  }
}

.swiper-slide {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.4;
  transform: scale(0.9);
}

.swiper-slide-active {
  opacity: 1;
  transform: scale(1);
}

.slider-nav {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 0px;
}

.nav-btn {
  position: relative;
  width: 64px;
  height: 64px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  outline: none;
}

.btn-circle {
  width: 48px;
  height: 48px;
  background: #1a1a1a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 2;
  transition: transform 0.3s ease;
}

.btn-ring {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-top-color: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  z-index: 1;
  animation: spin 3s linear infinite;
  transition: border-top-color 0.3s ease;
}

.nav-btn:hover .btn-circle {
  transform: scale(1.1);
  background: #000;
}

.nav-btn:hover .btn-ring {
  border-top-color: #ee1324;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.project-card {
  display: flex;
  flex-direction: column;
}

.card-visual {
  position: relative;
  width: 100%;
  aspect-ratio: 18 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f2f2;
}

.card-visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.2, 1, 0.2, 1);
}

.project-card:hover .card-visual img {
  transform: scale(1.08);
}

.card-index {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  color: #000;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 10;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 32px;
  z-index: 5;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover .card-overlay {
  opacity: 1;
  transform: translateY(0);
  background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 70%, transparent 100%);
}

.card-info {
  width: 100%;
  color: #fff;
  transform: translateY(20px);
  transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover .card-info {
  transform: translateY(0);
}

.location {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #ee1324;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.6s ease 0.1s;
}

.project-card:hover .location {
  opacity: 1;
  transform: translateY(0);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0 0 16px 0;
  color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0;
  transform: translateY(15px);
  transition: all 0.6s ease 0.2s;
}

.project-card:hover .card-title {
  opacity: 1;
  transform: translateY(0);
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0;
  transform: translateY(15px);
  transition: all 0.6s ease 0.3s;
}

.project-card:hover .card-link {
  opacity: 1;
  transform: translateY(0);
}

.card-link:hover {
  gap: 12px;
}

.action-footer {
  margin-top: 40px;
  text-align: center;
}

.btn-text {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #1a1a1a;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}

.btn-text:hover {
  color: #ee1324;
  transform: translateX(5px);
}

.project-skeleton {
  display: flex;
  flex-direction: column;
}

.skeleton-visual {
  width: 100%;
  aspect-ratio: 4/5;
  border-radius: 12px;
  background: #f2f2f2;
}

.skeleton-content {
  padding-top: 16px;
}

.skeleton-line {
  height: 10px;
  background: #f2f2f2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.skeleton-line--sm { width: 40%; }

@media (max-width: 1024px) {
  .shell {
    padding: 0 24px;
  }
}

@media (max-width: 768px) {
  .home-projects {
    padding: 64px 0;
  }
  .section-title {
    font-size: 24px;
  }
  .slider-nav {
    gap: 20px;
  }
  .nav-btn {
    width: 54px;
    height: 54px;
  }
  .btn-circle {
    width: 40px;
    height: 40px;
  }
  .card-overlay {
    padding: 16px;
  }
  .card-title {
    font-size: 14px;
  }
}
</style>
