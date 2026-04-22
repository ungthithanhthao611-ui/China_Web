<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import Breadcrumb from '@/views/user/news/ui/Breadcrumb.vue'
import { uiState } from '@/shared/utils/uiState'
import { getNewsDetail, getNewsList } from '@/views/user/services/publicApi'

const route = useRoute()
const defaultNewsRoute = '/news'

const article = ref(null)
const relatedNews = ref([])
const loading = ref(true)
const error = ref(null)

const breadcrumbs = computed(() => {
  if (!article.value) {
    return [{ name: 'News', link: defaultNewsRoute }, { name: 'Article' }]
  }

  return [
    { name: 'News', link: defaultNewsRoute },
    { name: article.value.title || 'Article' },
  ]
})

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))
}

const imageUrl = (item) => item?.thumbnail_url || item?.image?.url || item?.image || ''

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseContentJson(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  if (typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function renderBlocksToHtml(contentJson) {
  const blocks = Array.isArray(contentJson?.blocks)
    ? [...contentJson.blocks].sort((a, b) => (Number(a?.y || 0) - Number(b?.y || 0)) || (Number(a?.x || 0) - Number(b?.x || 0)))
    : []
  if (!blocks.length) return ''

  const fragments = []
  for (const block of blocks) {
    const type = String(block?.type || '').toLowerCase()
    const props = block?.props || {}

    if (type === 'text' || type === 'heading') {
      if (block?.content) fragments.push(String(block.content))
      continue
    }

    if (type === 'image') {
      const src = String(props.src || '').trim()
      if (!src) continue
      const alt = escapeHtml(props.alt || '')
      const caption = String(props.captionText || '').trim()
      fragments.push(
        `<figure class="news-block-image"><img src="${escapeHtml(src)}" alt="${alt}" />${
          caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
        }</figure>`
      )
      continue
    }

    if (type === 'gallery') {
      const images = Array.isArray(props.images)
        ? props.images
        : (Array.isArray(props.items) ? props.items : [])
      const items = images
        .map((item) => {
          const src = String(item?.src || '').trim()
          if (!src) return ''
          const alt = escapeHtml(item?.alt || '')
          const caption = String(item?.caption || '').trim()
          return `<figure class="news-block-gallery-item"><img src="${escapeHtml(src)}" alt="${alt}" />${
            caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''
          }</figure>`
        })
        .filter(Boolean)

      if (items.length) {
        fragments.push(`<section class="news-block-gallery">${items.join('')}</section>`)
      }
    }
  }

  return fragments.length ? `<article class="news-workflow-content">${fragments.join('')}</article>` : ''
}

const contentHtml = computed(() => {
  const directContent = article.value?.content_html || article.value?.body || article.value?.content || ''
  if (directContent && !/Generated from block editor/i.test(directContent)) {
    return directContent
  }
  const generatedContent = renderBlocksToHtml(parseContentJson(article.value?.content_json))
  return generatedContent || directContent
})

function normalizeNewsItem(item = {}) {
  return {
    ...item,
    content_html: item?.content_html || item?.content || '',
    body: item?.body || item?.content || '',
  }
}

async function loadArticle(slug) {
  loading.value = true
  error.value = null

  try {
    const foundArticle = normalizeNewsItem(await getNewsDetail(slug))
    article.value = foundArticle

    const relatedResponse = await getNewsList({ skip: 0, limit: 4 })
    relatedNews.value = Array.isArray(relatedResponse?.items)
      ? relatedResponse.items.map(normalizeNewsItem).filter((item) => item.slug !== slug).slice(0, 3)
      : []
  } catch (err) {
    error.value = err?.message || 'Failed to load article'
    article.value = null
    relatedNews.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    if (slug) loadArticle(slug)
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
  <div class="news-detail-page">
    <!-- Loading -->
    <section v-if="loading" class="detail-empty">
      <div class="container">
        <p style="color: #667085; margin-top: 60px">Loading articleâ€¦</p>
      </div>
    </section>

    <!-- Error -->
    <section v-else-if="error" class="detail-empty">
      <div class="container">
        <h1>Article not found</h1>
        <p>{{ error }}</p>
        <router-link :to="defaultNewsRoute" class="empty-link"
          >Back to News Center</router-link
        >
      </div>
    </section>

    <!-- Article -->
    <template v-else-if="article">
      <section
        class="detail-hero"
        :style="{ backgroundImage: `url(${imageUrl(article)})` }"
      >
        <div class="detail-overlay"></div>
        <div class="container detail-hero-inner">
          <router-link :to="defaultNewsRoute" class="back-link">
            <ArrowLeft :size="16" />
            Back to News
          </router-link>
          <span class="detail-category">News</span>
          <h1>{{ article.title }}</h1>
          <p>{{ formatDate(article.published_at || article.created_at) }}</p>
        </div>
      </section>

      <Breadcrumb :paths="breadcrumbs" />

      <section class="detail-body-section">
        <div class="container detail-grid">
          <article class="article-card">
            <div v-if="imageUrl(article)" class="article-image">
              <img :src="imageUrl(article)" :alt="article.title" />
            </div>

            <div class="article-content">
              <header class="article-meta">
                <h2 class="article-main-title">{{ article.title }}</h2>
                <p class="article-publish-date">
                  {{ formatDate(article.published_at || article.created_at) }}
                </p>
              </header>
              <p v-if="article.summary" class="lead">{{ article.summary }}</p>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                v-if="contentHtml"
                class="article-body"
                v-html="contentHtml"
              ></div>
            </div>
          </article>

          <aside class="related-card">
            <h2>More News</h2>
            <div v-if="relatedNews.length" class="related-list">
              <router-link
                v-for="item in relatedNews"
                :key="item.slug"
                :to="`/news/${item.slug}`"
                class="related-item"
              >
                <div class="related-thumb" :class="{ 'related-thumb--empty': !imageUrl(item) }">
                  <img
                    v-if="imageUrl(item)"
                    :src="imageUrl(item)"
                    :alt="item.title"
                  />
                </div>
                <div class="related-copy">
                  <span>{{ formatDate(item.published_at || item.created_at) }}</span>
                  <strong>{{ item.title }}</strong>
                </div>
              </router-link>
            </div>
            <p v-else style="color: #9a7d69; font-size: 0.9rem">
              No related articles found.
            </p>
          </aside>
        </div>
      </section>
    </template>

    <!-- Article khÃ´ng tá»“n táº¡i -->
    <section v-else class="detail-empty">
      <div class="container">
        <h1>Article not found</h1>
        <p>The requested article could not be loaded.</p>
        <router-link :to="defaultNewsRoute" class="empty-link"
          >Back to News Center</router-link
        >
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.news-detail-page {
  background: linear-gradient(180deg, #eff1f5 0%, #ffffff 22%, #f6f7f9 100%);
}

.detail-hero {
  position: relative;
  min-height: 560px;
  background-position: center;
  background-size: cover;
  color: $white;
}

.detail-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(5, 15, 36, 0.68) 0%,
      rgba(5, 15, 36, 0.42) 40%,
      rgba(5, 15, 36, 0.82) 100%
    ),
    linear-gradient(90deg, rgba(5, 15, 36, 0.48) 0%, rgba(5, 15, 36, 0.12) 55%);
}

.detail-hero-inner {
  position: relative;
  z-index: 1;
  min-height: 560px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: 190px;
  padding-bottom: 82px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  color: rgba(255, 255, 255, 0.84);
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(8px);
}

.detail-category {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  backdrop-filter: blur(10px);
  letter-spacing: 0.04em;
}

.detail-hero h1 {
  margin-top: 16px;
  max-width: min(980px, 22ch);
  font-size: clamp(2rem, 4.6vw, 4.35rem);
  line-height: 1.08;
  font-family: "Noto Serif", "Times New Roman", serif;
  text-shadow: 0 8px 24px rgba(2, 6, 23, 0.42);
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.detail-hero p {
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 1.02rem;
  letter-spacing: 0.02em;
}

.detail-body-section {
  padding: 56px 0 96px;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
  gap: 32px;
  align-items: start;
}

.article-card,
.related-card {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  box-shadow: 0 22px 52px rgba(10, 24, 54, 0.08);
}

.article-card {
  padding: 28px;
}

.article-image {
  overflow: hidden;
  border-radius: 4px;
  margin-bottom: 28px;

  img {
    width: 100%;
    height: auto;
    object-fit: cover;
  }
}

.article-content {
  color: #444f63;
  font-family: "Be Vietnam Pro", "Segoe UI", "Noto Sans", sans-serif;

  .article-meta {
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(29, 39, 58, 0.08);
  }

  .article-main-title {
    margin: 0;
    color: #1c2535;
    font-size: clamp(1.5rem, 2.2vw, 2.1rem);
    line-height: 1.35;
    font-family: "Noto Serif", "Times New Roman", serif;
    text-wrap: balance;
  }

  .article-publish-date {
    margin: 8px 0 0;
    color: #8b6d5b;
    font-size: 0.94rem;
  }

  .lead {
    font-size: 1.12rem;
    line-height: 1.88;
    color: #202738;
  }

  .article-body {
    margin-top: 20px;
    font-size: 1.08rem;
    line-height: 1.95;
    color: #2b3446;
    letter-spacing: 0.002em;
  }

  .article-body :deep(h1),
  .article-body :deep(h2),
  .article-body :deep(h3),
  .article-body :deep(h4) {
    margin: 1.15em 0 0.45em;
    color: #182033;
    line-height: 1.35;
  }

  .article-body :deep(p),
  .article-body :deep(ul),
  .article-body :deep(ol) {
    margin: 0.8em 0;
  }

  .article-body :deep(figure) {
    margin: 1.25em 0;
  }

  .article-body :deep(img) {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 6px;
  }

  .article-body :deep(figcaption) {
    margin-top: 8px;
    font-size: 0.92rem;
    color: #69758a;
    text-align: center;
  }

  .article-body :deep(.news-block-gallery) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
  }

  p + p {
    margin-top: 18px;
  }
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  color: #cc0000;
  font-weight: 600;
}

.related-card {
  padding: 20px 18px;
  position: sticky;
  top: 98px;
  border: 1px solid rgba(226, 232, 240, 0.75);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}

.related-card h2 {
  font-size: 1.95rem;
  font-family: "Noto Serif", "Times New Roman", serif;
  color: #1d273a;
  margin-bottom: 14px;
}

.related-list {
  display: grid;
  gap: 12px;
}

.related-item {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid rgba(29, 39, 58, 0.08);

  &:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .related-copy span {
    display: block;
    color: #9a7d69;
    font-size: 0.86rem;
    margin-bottom: 6px;
  }

  .related-copy strong {
    display: block;
    color: #293246;
    font-weight: 600;
    line-height: 1.42;
    font-size: 1.08rem;
  }

  &:hover .related-copy strong {
    color: #cc0000;
  }
}

.related-thumb {
  width: 112px;
  aspect-ratio: 4 / 3;
  border-radius: 8px;
  overflow: hidden;
  background: #f1f5f9;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.22);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.related-thumb--empty::before {
  content: "";
  display: block;
  width: 100%;
  height: 100%;
  background:
    linear-gradient(130deg, rgba(203, 213, 225, 0.6) 0%, rgba(226, 232, 240, 0.18) 100%),
    repeating-linear-gradient(
      -45deg,
      rgba(148, 163, 184, 0.2) 0 8px,
      rgba(203, 213, 225, 0.2) 8px 16px
    );
}

.detail-empty {
  min-height: 60vh;
  display: flex;
  align-items: center;
  text-align: center;

  h1 {
    font-size: 2rem;
    margin-bottom: 12px;
  }

  p {
    color: #667085;
  }
}

.empty-link {
  display: inline-flex;
  margin-top: 20px;
  color: #cc0000;
  font-weight: 600;
}

@media (max-width: 960px) {
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .related-card {
    order: -1;
    top: 84px;
    z-index: 6;
    max-height: calc(100vh - 102px);
    overflow: auto;
    padding: 14px;
  }

  .related-card h2 {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .related-item {
    grid-template-columns: 94px minmax(0, 1fr);
    gap: 10px;
    padding: 10px 0;
  }

  .related-thumb {
    width: 94px;
    border-radius: 6px;
  }

  .related-item .related-copy strong {
    font-size: 0.98rem;
  }
}

@media (max-width: 768px) {
  .detail-hero-inner {
    min-height: 500px;
    padding-top: 156px;
    padding-bottom: 44px;
  }

  .back-link {
    margin-bottom: 14px;
    padding: 7px 10px;
  }

  .detail-category {
    padding: 6px 12px;
    font-size: 0.78rem;
  }

  .detail-hero h1 {
    margin-top: 12px;
    font-size: clamp(1.7rem, 8.2vw, 2.55rem);
    line-height: 1.14;
  }

  .detail-hero p {
    margin-top: 10px;
    font-size: 0.92rem;
  }

  .detail-body-section {
    padding: 40px 0 72px;
  }

  .article-card {
    padding: 18px;
  }

  .article-content {
    .article-main-title {
      font-size: 1.75rem;
      line-height: 1.25;
    }

    .lead {
      font-size: 1.03rem;
      line-height: 1.82;
    }

    .article-body {
      font-size: 1rem;
      line-height: 1.84;
    }
  }
}
</style>
