<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import Breadcrumb from '@/views/user/news/ui/Breadcrumb.vue'
import { uiState } from '@/shared/utils/uiState'
import { getNewsDetail, getNewsList } from '@/views/user/services/publicApi'

import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n({ useScope: 'global' })
const route = useRoute()
const defaultNewsRoute = '/news'

const article = ref(null)
const relatedNews = ref([])
const loading = ref(true)
const error = ref(null)

const breadcrumbs = computed(() => {
  if (!article.value) {
    return [{ name: t('user.news.breadcrumbNews'), link: defaultNewsRoute }, { name: t('user.news.breadcrumbArticle') }]
  }

  return [
    { name: t('user.news.breadcrumbNews'), link: defaultNewsRoute },
    { name: article.value.title || t('user.news.breadcrumbArticle') },
  ]
})

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', {
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
    error.value = err?.message || t('user.news.errorLoadFailed')
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

watch(locale, () => {
  if (route.params.slug) loadArticle(route.params.slug)
})

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
        <p style="color: #667085; margin-top: 60px">{{ t('user.news.loading') }}</p>
      </div>
    </section>

    <!-- Error -->
    <section v-else-if="error" class="detail-empty">
      <div class="container">
        <h1>{{ t('user.news.errorNotFound') }}</h1>
        <p>{{ error }}</p>
        <router-link :to="defaultNewsRoute" class="empty-link"
          >{{ t('user.news.btnBackToCenter') }}</router-link
        >
      </div>
    </section>

    <!-- Article -->
    <template v-else-if="article">
      <section class="detail-hero">
        <div class="hero-media">
          <img :src="imageUrl(article)" :alt="article.title" class="hero-img" />
          <div class="hero-overlay"></div>
        </div>
        <div class="container detail-hero-inner">
          <div class="hero-copy" data-aos="fade-up">
            <router-link :to="defaultNewsRoute" class="back-link">
              <ArrowLeft :size="16" />
              <span>{{ t('user.projects.backHome') }}</span>
            </router-link>
            <div class="detail-meta">
              <span class="detail-category">{{ t('user.home.news') }}</span>
              <span class="detail-date">{{ formatDate(article.published_at || article.created_at) }}</span>
            </div>
            <h1>{{ article.title }}</h1>
          </div>
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

          <aside class="related-section" data-aos="fade-left">
            <h3 class="related-title">{{ t('user.news.relatedTitle') || 'Tin liên quan' }}</h3>
            <div class="related-list">
              <router-link
                v-for="item in relatedNews"
                :key="item.slug"
                :to="`/news/${item.slug}`"
                class="related-card-small"
              >
                <div class="related-thumb">
                  <img v-if="imageUrl(item)" :src="imageUrl(item)" :alt="item.title" />
                  <div v-else class="thumb-placeholder"></div>
                </div>
                <div class="related-info">
                  <span class="related-date">{{ formatDate(item.published_at || item.created_at) }}</span>
                  <strong class="related-name">{{ item.title }}</strong>
                </div>
              </router-link>
            </div>
          </aside>
        </div>
      </section>
    </template>

    <!-- Article không tồn tại -->
    <section v-else class="detail-empty">
      <div class="container">
        <h1>{{ t('user.news.errorNotFound') }}</h1>
        <p>{{ t('user.news.errorLoadFailed') }}</p>
        <router-link :to="defaultNewsRoute" class="empty-link"
          >{{ t('user.news.btnBackToCenter') }}</router-link
        >
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.news-detail-page {
  background: #fdfdfd;
  color: #1a1a1a;
}

.detail-hero {
  position: relative;
  height: 540px;
  background: #0f172a;
  display: flex;
  align-items: center;
  overflow: hidden;

  .hero-media {
    position: absolute;
    inset: 0;
    .hero-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.45;
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%);
    }
  }

  .detail-hero-inner {
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 32px;
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.8;
    transition: opacity 0.3s ease, transform 0.3s ease;

    &:hover {
      opacity: 1;
      transform: translateX(-4px);
    }
  }

  .detail-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .detail-category {
    background: #df0019;
    color: #fff;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-date {
    color: rgba(255, 255, 255, 0.7);
    font-size: 15px;
    font-weight: 500;
  }

  h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 800;
    line-height: 1.15;
    max-width: 900px;
    font-family: 'Outfit', sans-serif;
  }
}

.detail-body-section {
  padding: 80px 0 120px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 60px;
  align-items: start;
}

.article-card {
  background: #fff;
  border-radius: 24px;
  padding: 48px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 20px 50px rgba(0,0,0,0.03);
}

.article-image {
  margin-bottom: 40px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0,0,0,0.1);

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.article-content {
  .article-meta {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid #f1f5f9;

    .article-main-title {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin-bottom: 12px;
      font-family: 'Outfit', sans-serif;
    }

    .article-publish-date {
      color: #df0019;
      font-weight: 700;
      font-size: 15px;
    }
  }

  .lead {
    font-size: 18px;
    line-height: 1.8;
    color: #475569;
    font-weight: 500;
    margin-bottom: 32px;
  }

  .article-body {
    font-size: 17px;
    line-height: 1.85;
    color: #1e293b;

    :deep(p) { margin-bottom: 24px; }
    :deep(h2) { 
      font-size: 24px; 
      font-weight: 800; 
      margin: 48px 0 24px; 
      color: #0f172a;
    }
    :deep(img) {
      max-width: 100%;
      border-radius: 12px;
      margin: 32px 0;
    }
  }
}

/* Related Section */
.related-section {
  position: sticky;
  top: 120px;

  .related-title {
    font-size: 20px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #df0019;
    display: inline-block;
  }
}

.related-list {
  display: grid;
  gap: 20px;
}

.related-card-small {
  display: flex;
  gap: 16px;
  text-decoration: none;
  group: hover;

  .related-thumb {
    flex: 0 0 100px;
    height: 75px;
    border-radius: 12px;
    overflow: hidden;
    background: #f1f5f9;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
  }

  .related-info {
    flex: 1;

    .related-date {
      display: block;
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 4px;
    }

    .related-name {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 15px;
      line-height: 1.4;
      color: #1e293b;
      transition: color 0.3s ease;
    }
  }

  &:hover {
    .related-thumb img { transform: scale(1.1); }
    .related-name { color: #df0019; }
  }
}

@media (max-width: 1024px) {
  .detail-grid { grid-template-columns: 1fr; }
  .related-section { position: static; margin-top: 60px; }
}

@media (max-width: 768px) {
  .detail-hero { height: 400px; }
  .article-card { padding: 24px; }
}

</style>
