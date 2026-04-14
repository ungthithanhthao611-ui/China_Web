<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ExternalLink } from 'lucide-vue-next'
import Breadcrumb from '@/client/components/shared/common/Breadcrumb.vue'
import { uiState } from '@/utils/uiState'
import { allNewsItems, getNewsById, newsCategoryMeta, newsHero } from './newsData'

const route = useRoute()

const article = computed(() => getNewsById(route.params.id))

const relatedNews = computed(() => {
  if (!article.value) {
    return []
  }

  return allNewsItems
    .filter(
      (item) =>
        item.category === article.value.category &&
        item.id !== article.value.id
    )
    .slice(0, 3)
})

const breadcrumbs = computed(() => {
  if (!article.value) {
    return [{ name: 'News', link: newsCategoryMeta.enterprise.route }, { name: 'Article' }]
  }

  return [
    { name: 'News', link: newsCategoryMeta.enterprise.route },
    {
      name: newsCategoryMeta[article.value.category].label,
      link: newsCategoryMeta[article.value.category].route
    },
    { name: 'Article' }
  ]
})

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))

onMounted(() => {
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
  uiState.isFooterHidden = false
})
</script>

<template>
  <div class="news-detail-page">
    <template v-if="article">
      <section
        class="detail-hero"
        :style="{ backgroundImage: `url(${article.image || newsHero.bannerImage})` }"
      >
        <div class="detail-overlay"></div>
        <div class="container detail-hero-inner">
          <router-link :to="newsCategoryMeta[article.category].route" class="back-link">
            <ArrowLeft :size="16" />
            Back to {{ newsCategoryMeta[article.category].label }}
          </router-link>
          <span class="detail-category">{{ newsCategoryMeta[article.category].label }}</span>
          <h1>{{ article.title }}</h1>
          <p>{{ formatDate(article.date) }}</p>
        </div>
      </section>

      <Breadcrumb :paths="breadcrumbs" />

      <section class="detail-body-section">
        <div class="container detail-grid">
          <article class="article-card">
            <div v-if="article.image" class="article-image">
              <img :src="article.image" :alt="article.title" />
            </div>

            <div class="article-content">
              <p class="lead">{{ article.excerpt }}</p>
              <p v-for="(paragraph, index) in article.content" :key="index">
                {{ paragraph }}
              </p>
            </div>

            <a
              class="source-link"
              :href="article.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              View original article
              <ExternalLink :size="16" />
            </a>
          </article>

          <aside class="related-card">
            <h2>More News</h2>
            <div class="related-list">
              <router-link
                v-for="item in relatedNews"
                :key="item.id"
                :to="`/news/${item.id}`"
                class="related-item"
              >
                <span>{{ formatDate(item.date) }}</span>
                <strong>{{ item.title }}</strong>
              </router-link>
            </div>
          </aside>
        </div>
      </section>
    </template>

    <section v-else class="detail-empty">
      <div class="container">
        <h1>Article not found</h1>
        <p>The requested news item is not available in the current mirrored dataset.</p>
        <router-link to="/news/enterprise" class="empty-link">Back to News Center</router-link>
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
  min-height: 480px;
  background-position: center;
  background-size: cover;
  color: $white;
}

.detail-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 15, 36, 0.68) 0%, rgba(5, 15, 36, 0.42) 40%, rgba(5, 15, 36, 0.82) 100%),
    linear-gradient(90deg, rgba(5, 15, 36, 0.48) 0%, rgba(5, 15, 36, 0.12) 55%);
}

.detail-hero-inner {
  position: relative;
  z-index: 1;
  min-height: 480px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: 140px;
  padding-bottom: 72px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 26px;
  color: rgba(255, 255, 255, 0.84);
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
  margin-top: 18px;
  max-width: 980px;
  font-size: clamp(2.1rem, 3.8vw, 4rem);
  line-height: 1.12;
}

.detail-hero p {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 1rem;
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

  .lead {
    font-size: 1.18rem;
    line-height: 1.82;
    color: #202738;
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
  padding: 26px 22px;
  position: sticky;
  top: 120px;
}

.related-card h2 {
  font-size: 1.5rem;
  color: #1d273a;
  margin-bottom: 18px;
}

.related-list {
  display: grid;
  gap: 14px;
}

.related-item {
  padding: 16px 0;
  border-top: 1px solid rgba(29, 39, 58, 0.08);

  &:first-child {
    border-top: 0;
    padding-top: 0;
  }

  span {
    display: block;
    color: #9a7d69;
    font-size: 0.9rem;
    margin-bottom: 8px;
  }

  strong {
    display: block;
    color: #293246;
    font-weight: 600;
    line-height: 1.5;
  }

  &:hover strong {
    color: #cc0000;
  }
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
  }

  .related-card {
    position: static;
  }
}

@media (max-width: 768px) {
  .detail-hero-inner {
    padding-top: 124px;
    padding-bottom: 48px;
  }

  .detail-body-section {
    padding: 40px 0 72px;
  }

  .article-card {
    padding: 18px;
  }
}
</style>


