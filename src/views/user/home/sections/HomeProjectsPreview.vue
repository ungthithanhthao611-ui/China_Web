<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MapPin, ArrowRight } from 'lucide-vue-next'

import { env } from '@/shared/config/env'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'
import { getProjects } from '@/views/user/services/publicApi'

const loading = ref(true)
const items = ref([])
const { locale, t } = useI18n({ useScope: 'global' })
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.24 })
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

async function loadProjects() {
  loading.value = true
  try {
    const payload = await getProjects({ skip: 0, limit: 4 })
    const rows = Array.isArray(payload?.items) ? payload.items : []
    items.value = rows.map((row, idx) => ({
      id: row.id,
      title: locale.value === 'vi' ? row.title : (t('user.home.projects') + ' ' + (idx + 1)),
      slug: row.slug,
      summary: locale.value === 'vi' ? (row.summary || '') : t('user.home.projectDescriptionFallback'),
      location: row.location || '',
      image: resolveProjectImage(row),
    }))
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(locale, loadProjects)
onMounted(loadProjects)
</script>

<template>
  <section class="home-projects" ref="rootRef">
    <div class="container shell home-reveal" :class="{ 'is-visible': isVisible }">
      <header class="section-head" data-reveal-item>
        <p>{{ t('user.home.projectEyebrow') }}</p>
        <span class="head-line"></span>
        <h2>{{ t('user.home.projectsTitle') }}</h2>
        <span class="sub-head">{{ t('user.home.projectSubtitle') }}</span>
      </header>

      <div v-if="items.length" class="grid">
        <article v-for="(item, index) in items" :key="item.id" class="card" data-reveal-item>
          <div class="card-inner">
            <router-link :to="`/projects/${item.slug}`" class="visual">
              <img :src="item.image" :alt="item.title" loading="lazy" />
              <div class="overlay">
                <span class="index">{{ String(index + 1).padStart(2, '0') }}</span>
              </div>
            </router-link>

            <div class="content">
              <div class="meta">
                <MapPin :size="12" />
                <span>{{ item.location || 'TP.HCM, VIỆT NAM' }}</span>
              </div>

              <h3>
                <router-link :to="`/projects/${item.slug}`">{{ item.title }}</router-link>
              </h3>

              <p class="summary">{{ item.summary }}</p>

              <router-link :to="`/projects/${item.slug}`" class="more">
                <div class="more-icon">
                  <ArrowRight :size="16" />
                </div>
                <span>{{ t('user.home.viewMore') }}</span>
              </router-link>
            </div>
          </div>
        </article>
      </div>

      <div class="foot-actions" data-reveal-item>
        <router-link to="/projects" class="btn-more">
          {{ t('user.home.viewAllProjects') }}
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-projects {
  padding: 120px 0;
  background: #fff;
  position: relative;
}

.section-head {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 80px;
}

.section-head p {
  color: #1d283d;
  font-size: 24px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.head-line {
  display: block;
  width: 60px;
  height: 4px;
  background: #ee1324;
  margin: 0 auto 24px;
}

.section-head h2 {
  display: none;
}

.sub-head {
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
}

.card {
  background: #f8faff;
  border-radius: 30px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.card-inner {
  display: flex;
  height: 100%;
}

.visual {
  width: 40%;
  position: relative;
  overflow: hidden;
}

.visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.overlay {
  position: absolute;
  top: 15px;
  right: 15px;
}

.index {
  background: #fff;
  color: #1d283d;
  font-size: 13px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.content {
  width: 60%;
  padding: 32px;
  display: flex;
  flex-direction: column;
}

.meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ee1324;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.content h3 {
  font-size: 20px;
  font-weight: 800;
  color: #1d283d;
  line-height: 1.4;
  margin-bottom: 16px;
}

.content h3 a {
  color: inherit;
  text-decoration: none;
}

.summary {
  font-size: 14px;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 24px;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #ee1324;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.more-icon {
  width: 32px;
  height: 32px;
  border: 1px solid #ee1324;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.more:hover .more-icon {
  background: #ee1324;
  color: #fff;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.card:hover .visual img {
  transform: scale(1.05);
}

.foot-actions {
  margin-top: 60px;
  text-align: center;
}

.btn-more {
  display: inline-flex;
  align-items: center;
  background: #ee1324;
  color: #fff;
  padding: 16px 40px;
  border-radius: 100px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(238, 19, 36, 0.2);
}

.btn-more:hover {
  background: #d0101f;
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(238, 19, 36, 0.3);
}

@media (max-width: 1200px) {
  .grid {
    gap: 30px;
  }
}

@media (max-width: 992px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .card-inner {
    flex-direction: column;
  }
  .visual, .content {
    width: 100%;
  }
  .visual {
    aspect-ratio: 16/9;
  }
  .section-head p {
    font-size: 20px;
  }
}
</style>
