<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

import { getNewsList } from '@/views/user/services/publicApi'

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const { locale, t } = useI18n({ useScope: 'global' })
const loading = ref(true)
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

async function fetchNews() {
  loading.value = true
  try {
    const response = await getNewsList({ skip: 0, limit: MAX_NEWS_ITEMS })
    const rows = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : []

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
  } catch {
    newsList.value = []
  } finally {
    loading.value = false
  }
}

watch(locale, fetchNews)
onMounted(fetchNews)

</script>

<template>
  <section class="news-section" :class="{ 'is-active': props.active }">
    <div class="news-shell container">
      <header class="news-header" :class="{ 'is-active': props.active }">
        <div class="news-title-wrap">
          <p class="eyebrow">{{ t('user.home.newsEyebrow') }}</p>
          <h2>{{ t('user.home.newsTitle') }}</h2>
          <p class="subtitle">{{ t('user.home.newsSubtitle') }}</p>
        </div>

        <button class="view-all" type="button" @click="goTo('/news')">
          <span>{{ t('user.home.viewAllNews') }}</span>
          <span class="view-all-icon">→</span>
        </button>
      </header>

      <div v-if="loading" class="news-grid news-grid--loading">
        <article v-for="index in ITEMS_PER_PAGE" :key="`loading-${index}`" class="news-card news-card--skeleton">
          <div class="skeleton-media"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-line--sm"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
          </div>
        </article>
      </div>

      <div v-else-if="pagedNews.length" class="news-grid" :class="{ 'is-active': props.active }">
        <article v-for="item in pagedNews" :key="item.id" class="news-card" @click="goTo(item.link)">
          <div class="news-media">
            <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
            <div v-else class="news-media-fallback">{{ t('user.home.newsFallbackTitle') }}</div>

            <div class="date-badge" aria-label="Ngày đăng">
              <span class="day">{{ item.day }}</span>
              <span class="month">{{ item.month }}</span>
              <span class="year">{{ item.year }}</span>
            </div>
          </div>

          <div class="news-body">
            <p class="category">• {{ item.category }}</p>
            <h3 class="news-title">{{ item.title }}</h3>
            <p class="news-summary">{{ item.summary }}</p>

            <div class="news-action">
              <span>{{ t('user.home.viewMore') }}</span>
              <span class="line"></span>
              <ArrowRight :size="16" />
            </div>
          </div>
        </article>
      </div>

      <div v-else class="news-empty">
        <p>{{ t('user.home.newsEmpty') }}</p>
      </div>

      <div v-if="totalPages > 1 && !loading" class="news-pagination" :aria-label="t('user.home.newsPagination')">
        <button
          class="page-btn page-btn--nav"
          type="button"
          :disabled="currentPage === 1"
          :aria-label="t('user.home.prevPage')"
          @click="goPrevPage"
        >
          &lt;
        </button>

        <button
          v-for="page in pageNumbers"
          :key="`page-${page}`"
          class="page-btn page-btn--number"
          :class="{ 'is-active': currentPage === page }"
          type="button"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          class="page-btn page-btn--nav"
          type="button"
          :disabled="currentPage === totalPages"
          :aria-label="t('user.home.nextPage')"
          @click="goNextPage"
        >
          &gt;
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.news-section {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: clamp(34px, 4.6vw, 66px) 0;
  background:
    radial-gradient(circle at 14% 4%, rgba(205, 0, 0, 0.05), transparent 25%),
    radial-gradient(circle at 90% 92%, rgba(16, 36, 60, 0.05), transparent 24%),
    linear-gradient(180deg, #ffffff 0%, #f8f9fc 100%);
}

.news-section::before,
.news-section::after {
  content: '';
  position: absolute;
  width: 130px;
  height: 130px;
  opacity: 0.45;
  background-image: radial-gradient(circle, rgba(205, 0, 0, 0.28) 2px, transparent 2px);
  background-size: 14px 14px;
  pointer-events: none;
}

.news-section::before {
  top: 20px;
  right: max(2vw, 20px);
}

.news-section::after {
  left: max(1vw, 8px);
  bottom: 20px;
}

.news-shell {
  position: relative;
  z-index: 1;
  width: min(var(--home-content-max, 1260px), calc(100% - 40px));
  margin: 0 auto;
}

.news-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: clamp(20px, 2.4vw, 34px);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}

.news-header.is-active {
  opacity: 1;
  transform: translateY(0);
}

.eyebrow {
  margin: 0;
  color: #cd0000;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-weight: 700;
}

.news-title-wrap h2 {
  margin: 10px 0 10px;
  color: #0b1528;
  font-size: clamp(1.9rem, 2.8vw, 3.4rem);
  line-height: 1.08;
  font-weight: 800;
}

.subtitle {
  margin: 0;
  max-width: 60ch;
  color: #5f6675;
  font-size: clamp(13px, 0.92vw, 17px);
  line-height: 1.5;
}

.view-all {
  margin-top: 10px;
  flex-shrink: 0;
  border: 0;
  background: #f3f4f6;
  color: #4b5563;
  min-height: 52px;
  padding: 0 8px 0 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
}

.view-all-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #cd0000;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.view-all:hover {
  color: #cd0000;
  transform: translateY(-1px);
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1vw, 14px);
}

.news-card {
  background: #fff;
  border: 1px solid rgba(12, 22, 40, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(12, 22, 40, 0.07);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.news-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 34px rgba(12, 22, 40, 0.1);
}

.news-media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.news-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.news-media-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #6b7280;
  background: linear-gradient(145deg, #eef2f7, #e4e9f1);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.date-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.day {
  display: block;
  background: #cd0000;
  color: #fff;
  font-size: 29px;
  line-height: 1;
  font-weight: 800;
  padding: 9px 0 7px;
}

.month {
  display: block;
  color: #4b5563;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding-top: 7px;
}

.year {
  display: block;
  color: #4b5563;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.1;
  padding: 2px 0 8px;
}

.news-body {
  padding: clamp(12px, 1vw, 16px);
  display: grid;
  gap: 8px;
}

.category {
  margin: 0;
  color: #cd0000;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.news-title {
  margin: 0;
  color: #111827;
  font-size: clamp(17px, 1.35vw, 26px);
  line-height: 1.32;
  font-weight: 800;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-summary {
  margin: 0;
  color: #4b5563;
  font-size: 15px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-action {
  margin-top: 4px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #cd0000;
  font-size: 15px;
  font-weight: 700;
}

.news-action .line {
  width: 32px;
  height: 1px;
  background: #cd0000;
}

.news-empty {
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  color: #6b7280;
  font-size: 16px;
}

.news-pagination {
  margin-top: clamp(16px, 2vw, 24px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.page-btn {
  min-width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(17, 24, 39, 0.15);
  background: #fff;
  color: #344054;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn--number.is-active {
  border-color: #cd0000;
  background: #cd0000;
  color: #fff;
}

.page-btn:not(:disabled):hover {
  border-color: #cd0000;
  color: #cd0000;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.news-grid--loading .news-card--skeleton {
  pointer-events: none;
}

.skeleton-media {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: linear-gradient(90deg, #f2f4f7 20%, #e9edf3 50%, #f2f4f7 80%);
  background-size: 220% 100%;
  animation: newsShimmer 1.4s infinite;
}

.skeleton-body {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.skeleton-line {
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f2f4f7 20%, #e9edf3 50%, #f2f4f7 80%);
  background-size: 220% 100%;
  animation: newsShimmer 1.4s infinite;
}

.skeleton-line--sm {
  width: 36%;
}

@keyframes newsShimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1100px) {
  .news-header {
    flex-direction: column;
    gap: 14px;
  }

  .view-all {
    margin-top: 0;
  }
}

@media (max-width: 767px) {
  .news-section {
    padding: 40px 0;
  }

  .news-shell {
    width: calc(100% - 20px);
  }

  .news-grid {
    gap: 10px;
  }

  .news-title-wrap h2 {
    font-size: clamp(28px, 7.2vw, 36px);
  }

  .subtitle {
    font-size: 12px;
  }

  .view-all {
    min-height: 42px;
    padding: 0 6px 0 14px;
    font-size: 13px;
    gap: 10px;
  }

  .view-all-icon {
    width: 30px;
    height: 30px;
  }

  .day {
    font-size: 22px;
    padding: 6px 0 5px;
  }

  .month {
    font-size: 7px;
    padding-top: 5px;
  }

  .year {
    font-size: 14px;
    padding-bottom: 6px;
  }

  .date-badge {
    width: 50px;
    top: 8px;
    left: 8px;
  }

  .news-body {
    padding: 10px;
    gap: 6px;
  }

  .category {
    font-size: 9px;
  }

  .news-title {
    font-size: clamp(12px, 3.2vw, 15px);
    -webkit-line-clamp: 3;
  }

  .news-summary {
    font-size: 11px;
    line-height: 1.45;
    -webkit-line-clamp: 3;
  }

  .news-action {
    font-size: 12px;
    gap: 6px;
  }

  .news-action .line {
    width: 18px;
  }

  .page-btn {
    min-width: 34px;
    height: 34px;
    font-size: 13px;
  }
}
</style>
