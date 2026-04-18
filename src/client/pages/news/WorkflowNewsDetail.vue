<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getPublicWorkflowNewsDetail } from '@/admin/news-workflow/services/newsWorkflowApi'

const route = useRoute()

const loading = ref(true)
const post = ref<any>(null)
const errorMessage = ref('')

async function loadArticle(slug: string) {
  loading.value = true
  errorMessage.value = ''
  try {
    post.value = await getPublicWorkflowNewsDetail(slug)
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to load article.'
    post.value = null
  } finally {
    loading.value = false
  }
}

watch(
  () => String(route.params.slug || ''),
  (slug) => {
    if (!slug) return
    loadArticle(slug)
  },
  { immediate: true }
)

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'auto' })
})
</script>

<template>
  <section class="detail-page">
    <div v-if="loading" class="status">Loading article...</div>
    <div v-else-if="errorMessage" class="alert-error">{{ errorMessage }}</div>

    <article v-else-if="post" class="article-shell">
      <img v-if="post.thumbnail_url" class="hero-image" :src="post.thumbnail_url" :alt="post.title" />
      <h1>{{ post.title }}</h1>
      <p class="summary">{{ post.summary }}</p>
      <p class="meta">
        Published:
        {{ post.published_at ? new Date(post.published_at).toLocaleString() : 'N/A' }}
      </p>
      <div class="article-html" v-html="post.content_html" />
    </article>
  </section>
</template>

<style scoped>
.detail-page {
  width: min(980px, 92%);
  margin: 120px auto 90px;
}

.article-shell {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
  padding: 24px;
}

.hero-image {
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  border-radius: 8px;
}

.article-shell h1 {
  margin: 16px 0 0;
  color: #111827;
}

.summary {
  margin-top: 10px;
  color: #475569;
  font-size: 18px;
}

.meta {
  margin-top: 8px;
  color: #64748b;
  font-size: 13px;
}

.article-html {
  margin-top: 18px;
  color: #1f2937;
  line-height: 1.75;
}

.article-html :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.status {
  color: #64748b;
}

.alert-error {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 13px;
}
</style>

