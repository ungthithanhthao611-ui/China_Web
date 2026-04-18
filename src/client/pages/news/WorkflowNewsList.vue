<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { listPublicWorkflowNews } from '@/admin/news-workflow/services/newsWorkflowApi'

const state = reactive({
  loading: false,
  page: 1,
  limit: 9,
  total: 0,
})
const items = ref<any[]>([])
const errorMessage = ref('')

async function fetchItems() {
  state.loading = true
  errorMessage.value = ''
  try {
    const payload = await listPublicWorkflowNews({
      page: state.page,
      limit: state.limit,
    })
    items.value = payload.items || []
    state.total = payload.pagination?.total || 0
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to load workflow news.'
  } finally {
    state.loading = false
  }
}

onMounted(fetchItems)
</script>

<template>
  <section class="workflow-news-page">
    <header class="page-header">
      <h1>News Center</h1>
      <p>Published from News Workflow Editor.</p>
    </header>

    <p v-if="errorMessage" class="alert-error">{{ errorMessage }}</p>
    <p v-if="state.loading" class="status">Loading...</p>

    <div v-else class="grid">
      <article v-for="item in items" :key="item.id" class="card">
        <RouterLink :to="`/workflow-news/${item.slug}`" class="thumb-wrap">
          <img :src="item.thumbnail_url || 'https://picsum.photos/600/360'" :alt="item.title" />
        </RouterLink>
        <div class="card-body">
          <RouterLink :to="`/workflow-news/${item.slug}`" class="title">{{ item.title }}</RouterLink>
          <p>{{ item.summary || 'No summary available.' }}</p>
          <span>{{ item.published_at ? new Date(item.published_at).toLocaleDateString() : '-' }}</span>
        </div>
      </article>
      <p v-if="!items.length" class="status">No published workflow news found.</p>
    </div>
  </section>
</template>

<style scoped>
.workflow-news-page {
  width: min(1200px, 92%);
  margin: 120px auto 80px;
}

.page-header h1 {
  margin: 0;
  color: #1f2937;
}

.page-header p {
  margin-top: 8px;
  color: #64748b;
}

.grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.thumb-wrap {
  display: block;
}

.thumb-wrap img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card-body {
  padding: 12px;
}

.title {
  display: block;
  color: #111827;
  font-weight: 700;
}

.card-body p {
  margin: 8px 0 0;
  color: #475569;
}

.card-body span {
  display: inline-block;
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
}

.status {
  color: #64748b;
}

.alert-error {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #fecaca;
  background: #fff1f2;
  color: #b91c1c;
  font-size: 13px;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

