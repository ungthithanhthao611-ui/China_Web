<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { useHomeBootstrap } from '@/views/user/home/composables/useHomeBootstrap'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const { locale, t } = useI18n({ useScope: 'global' })
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.1 })
const { data: homeBootstrap, loading } = useHomeBootstrap()
const newsList = ref([])
const currentPage = ref(1)
const ITEMS_PER_PAGE = 4
const MAX_NEWS_ITEMS = 8

const totalPages = computed(() => {
  if (!newsList.value.length) return 0
  return Math.ceil(newsList.value.length / ITEMS_PER_PAGE)
})

const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1))

const pagedNews = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return newsList.value.slice(start, start + ITEMS_PER_PAGE)
})

watch(totalPages, (value) => {
  if (value === 0) {
    currentPage.value = 1
    return
  }
  if (currentPage.value > value) currentPage.value = value
})

function goTo(path) {
  if (!path) return
  router.push(path)
}

function goPrevPage() {
  if (currentPage.value <= 1) return
  currentPage.value -= 1
}

function goNextPage() {
  if (currentPage.value >= totalPages.value) return
  currentPage.value += 1
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function formatDate(dateStr) {
  if (!dateStr) return { day: '01', month: 'JANUARY', year: '2026' }
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return { day: '01', month: 'JANUARY', year: '2026' }

  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
    year: String(date.getFullYear()),
  }
}

function resolveCategory(item) {
  return (
    item?.category_name ||
    item?.category?.name ||
    item?.topic ||
    item?.tag ||
    t('user.home.newsCategory')
  )
}

function resolveSummary(item) {
  return (
    item?.short_desc ||
    item?.summary ||
    item?.excerpt ||
    t('user.home.newsSubtitle')
  )
}

function resolveImage(item) {
  return item?.thumbnail_url || item?.image?.url || item?.image || ''
}

function syncNews() {
  const rows = Array.isArray(homeBootstrap.value?.news?.items) ? homeBootstrap.value.news.items : []
  newsList.value = rows.slice(0, MAX_NEWS_ITEMS).map((item) => {
    const dateParts = formatDate(item?.published_at || item?.created_at)
    return {
      ...item,
      ...dateParts,
      category: resolveCategory(item),
      summary: resolveSummary(item),
      image: resolveImage(item),
      link: `/news/${item.slug}`,
    }
  })
  currentPage.value = 1
}

watch([homeBootstrap, locale], syncNews, { immediate: true })

</script>

<template>
  <section class="news-section" :id="props.id" ref="rootRef">
    <div class="news-shell home-reveal" :class="{ 'is-visible': isVisible }">
      <header class="news-header content" data-reveal-item>
        <div class="header-content">
          <h2 class="section-title">{{ t('user.home.newsTitle') }}</h2>
          <router-link to="/news" class="title-arrow" :aria-label="t('user.home.viewAllNews')">
            <ArrowRight :size="32" />
          </router-link>
        </div>
      </header>

      <div v-if="loading" class="news-grid news-grid--loading">
        <div v-for="index in 4" :key="`loading-${index}`" class="news-skeleton">
          <div class="skeleton-media"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-line--sm"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </div>
      </div>

      <div v-else-if="newsList.length" class="news-grid visual" data-reveal-item>
        <article
          v-for="item in newsList.slice(0, 4)"
          :key="item.id"
          class="news-item"
          @click="goTo(item.link)"
        >
          <div class="item-media">
            <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
            <div v-else class="item-media-fallback">{{ t('user.home.newsFallbackTitle') }}</div>
          </div>

          <div class="item-content">
            <div class="item-top">
              <span class="item-tag">{{ item.category }}</span>
            </div>
            <h3 class="item-title">{{ item.title }}</h3>
            <p v-if="item.summary" class="item-summary">{{ item.summary }}</p>
            <div class="item-footer">
              <span class="read-more">
                {{ t('user.home.viewMore') }}
                <ArrowRight :size="16" />
              </span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="news-empty">
        <p>{{ t('user.home.newsEmpty') }}</p>
      </div>

    </div>
  </section>
</template>

<style scoped>
.news-section {
  background: transparent;
  color: #1a1a1a;
  padding: 120px 0;
  position: relative;
  z-index: 1;
}

.news-shell {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 40px;
}

.news-header {
  margin-bottom: 56px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.title-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #1a1a1a;
  transition: all 0.3s ease;
}

.title-arrow:hover {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
  transform: translateX(8px);
}

.section-title {
  font-size: clamp(24px, 4vw, 48px);
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.1;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 60px 80px;
}

.news-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
  padding-bottom: 40px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.4s ease;
}

.news-item:hover .item-media img {
  transform: scale(1.05);
}

.news-item:hover .item-title {
  color: #ee1324;
}

.item-media {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  background: #eee;
}

.item-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s cubic-bezier(0.2, 1, 0.2, 1);
}

.item-media-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.item-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.item-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  color: #ee1324;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 12px;
}

.item-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 12px 0;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

.item-summary {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(0, 0, 0, 0.7);
}

.news-footer-action {
  margin-top: 80px;
  text-align: center;
}

.btn-all {
  background: transparent;
  color: #1a1a1a;
  border: 1px solid rgba(0, 0, 0, 0.2);
  padding: 16px 48px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-all:hover {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
  transform: translateY(-3px);
}

/* Skeletons */
.news-skeleton {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 32px;
}

.skeleton-media {
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.skeleton-line {
  height: 12px;
  background: rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
  border-radius: 2px;
}

.skeleton-line--sm { width: 30%; }

@media (max-width: 1200px) {
  .news-grid {
    gap: 40px 60px;
  }
}

@media (max-width: 992px) {
  .news-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .news-shell {
    padding: 0 24px;
  }
}

@media (max-width: 768px) {
  .news-section {
    padding: 80px 0;
  }
  .section-title {
    font-size: 28px;
  }
  .news-item {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .item-media {
    aspect-ratio: 16/9;
  }
  .item-title {
    font-size: 18px;
  }
}
</style>
