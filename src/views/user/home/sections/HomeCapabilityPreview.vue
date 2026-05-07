<template>
  <section class="home-capability" ref="rootRef">
    <div class="shell home-reveal" :class="{ 'is-visible': isVisible }">
      <div class="capability-grid">
        <!-- Left: Image -->
        <div class="capability-media" data-reveal-item>
          <img
            v-if="overviewDisplayImage"
            :src="resolveImageUrl(overviewDisplayImage)"
            :alt="factoryOverview.factory_name || t('user.home.factoryImageAlt')"
            loading="lazy"
          />
          <div v-else class="media-placeholder">
             <span>{{ companyName.slice(0, 1) }}</span>
          </div>
        </div>

        <!-- Right: Content -->
        <div class="capability-content" data-reveal-item>
          <header class="content-header">
            <span class="eyebrow">{{ t('user.home.factoryEyebrow') }}</span>
            <h2>{{ factoryOverview.title }}</h2>
            <div class="description">
              <p>{{ factoryOverview.description }}</p>
            </div>
          </header>

          <nav class="capability-menu">
            <div class="menu-item" v-for="item in menuLinks" :key="item.label">
              <router-link :to="item.path" class="menu-link">
                <span class="link-label">{{ item.label }}</span>
                <ArrowRight class="link-arrow" :size="20" />
              </router-link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { env } from '@/shared/config/env'
import { useHomeBootstrap } from '@/views/user/home/composables/useHomeBootstrap'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.22 })
const { locale, t } = useI18n({ useScope: 'global' })
const { data: homeBootstrap, loading, ensureLoaded } = useHomeBootstrap()

const payload = computed(() => homeBootstrap.value?.honors || null)

function resolveImageUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

const factoryOverview = computed(() => {
  const raw = payload.value?.factory_overview || {}
  return {
    title: t('user.home.factoryOverviewTitle') || raw.title,
    description: t('user.home.factoryOverviewDescription') || raw.description,
    main_image_url: String(raw.main_image_url || '').trim(),
  }
})

const overviewDisplayImage = computed(() => {
  return factoryOverview.value.main_image_url || ''
})

const companyName = computed(() => t('user.home.brandPrimary'))

const menuLinks = computed(() => [
  { label: t('user.home.aboutUs'), path: '/about/company-introduction' },
  { label: t('user.home.capability'), path: '/honors' },
  { label: t('user.home.products'), path: '/products' },
  { label: t('user.home.projects'), path: '/du-an' },
])

ensureLoaded().catch(() => {})
</script>

<style scoped>
.home-capability {
  padding: 120px 0;
  background: #111111;
  color: #fff;
  min-height: 100vh;
  display: flex;
  align-items: center;
}

.shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 40px;
  width: 100%;
}

.capability-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.capability-media {
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 32px;
  overflow: hidden;
  background: #1a1a1a;
}

.capability-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.2s cubic-bezier(0.2, 1, 0.2, 1);
}

.capability-media:hover img {
  transform: scale(1.05);
}

.media-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 80px;
  color: #333;
}

.capability-content {
  display: flex;
  flex-direction: column;
}

.eyebrow {
  font-size: 13px;
  font-weight: 700;
  color: #ee1324;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 24px;
  display: block;
}

h2 {
  font-size: clamp(32px, 4vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 32px;
  color: #fff;
}

.description {
  margin-bottom: 48px;
}

.description p {
  font-size: 17px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.6);
  max-width: 560px;
}

.capability-menu {
  display: flex;
  flex-direction: column;
}

.menu-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.menu-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0;
  text-decoration: none;
  color: #fff;
  transition: all 0.3s ease;
}

.link-label {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.link-arrow {
  opacity: 0.4;
  transform: translateX(-10px);
  transition: all 0.3s ease;
}

.menu-link:hover {
  color: #ee1324;
  padding-left: 10px;
}

.menu-link:hover .link-arrow {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 1024px) {
  .capability-grid {
    gap: 40px;
  }
  .capability-media {
    aspect-ratio: 1;
  }
}

@media (max-width: 768px) {
  .home-capability {
    padding: 80px 0;
  }
  .capability-grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .shell {
    padding: 0 24px;
  }
  .capability-media {
    border-radius: 24px;
  }
  h2 {
    font-size: 32px;
  }
  .description p {
    font-size: 15px;
  }
  .link-label {
    font-size: 16px;
  }
}
</style>
