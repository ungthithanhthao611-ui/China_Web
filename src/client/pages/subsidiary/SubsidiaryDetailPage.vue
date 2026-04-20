<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, House } from 'lucide-vue-next'

import { getBranchDetail } from '@/client/services/publicApi'

const route = useRoute()
const branchDetail = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const entityLabel = computed(() => {
  const type = branchDetail.value?.branch_type
  return type === 'subsidiary' ? 'Subsidiary' : 'Branch'
})

const paragraphs = computed(() => {
  const body = String(branchDetail.value?.body || branchDetail.value?.summary || '').trim()
  if (!body) return []

  return body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
})

const heroImage = computed(
  () =>
    branchDetail.value?.hero_image?.url ||
    branchDetail.value?.image?.url ||
    'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/25d8d8e5-5327-4af5-98da-df5e57990185.jpg'
)

async function loadBranchDetail() {
  const slug = String(route.params.slug || '').trim()
  if (!slug) {
    branchDetail.value = null
    errorMessage.value = 'Branch slug is missing.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    branchDetail.value = await getBranchDetail(slug)
  } catch (error) {
    branchDetail.value = null
    errorMessage.value = error.message || 'Failed to load detail content.'
  } finally {
    isLoading.value = false
  }
}

watch(() => route.params.slug, loadBranchDetail)

onMounted(loadBranchDetail)
</script>

<template>
  <main class="subsidiary-detail">
    <section class="subsidiary-detail__shell">
      <nav class="subsidiary-detail__breadcrumb">
        <House :size="16" />
        <router-link to="/">Home</router-link>
        <ChevronRight :size="14" />
        <router-link to="/contact">Contact Us</router-link>
        <ChevronRight :size="14" />
        <router-link :to="entityLabel === 'Subsidiary' ? '/subsidiary#ctn2' : '/branch#ctn2'">{{ entityLabel }}</router-link>
        <ChevronRight :size="14" />
        <span>{{ branchDetail?.name || entityLabel }} Detail</span>
      </nav>

      <template v-if="isLoading">
        <h1 class="subsidiary-detail__title">Loading {{ entityLabel.toLowerCase() }} detail...</h1>
        <div class="subsidiary-detail__line"></div>
      </template>

      <template v-else-if="branchDetail">
        <h1 class="subsidiary-detail__title">{{ branchDetail.name }}</h1>
        <div class="subsidiary-detail__line"></div>

        <div class="subsidiary-detail__meta">
          <span v-if="branchDetail.address">Address: {{ branchDetail.address }}</span>
          <span v-if="branchDetail.phone">Phone: {{ branchDetail.phone }}</span>
          <span v-if="branchDetail.email">Email: {{ branchDetail.email }}</span>
        </div>

        <div class="subsidiary-detail__content">
          <p v-for="(paragraph, idx) in paragraphs" :key="`paragraph-${idx}`">
            {{ paragraph }}
          </p>
          <p v-if="!paragraphs.length">Detailed profile is being updated.</p>
        </div>

        <div class="subsidiary-detail__image-wrap">
          <img :src="heroImage" :alt="branchDetail.name" />
        </div>
      </template>

      <template v-else>
        <h1 class="subsidiary-detail__title">{{ entityLabel }} Detail</h1>
        <div class="subsidiary-detail__line"></div>
        <div class="subsidiary-detail__content">
          <p>{{ errorMessage || 'The requested detail content was not found.' }}</p>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped lang="scss">
.subsidiary-detail {
  min-height: 100vh;
  padding: 92px 22px 76px;
  background:
    linear-gradient(180deg, rgba(246, 245, 243, 0.98), rgba(244, 243, 241, 0.98)),
    url('https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/ff34f837-0ea5-4775-a85b-7620d8d7f7ec.jpg')
      center / cover no-repeat;
}

.subsidiary-detail__shell {
  width: min(1280px, calc(100% - 20px));
  margin: 0 auto;
}

.subsidiary-detail__breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666666;
  font-size: 17px;
  flex-wrap: wrap;
}

.subsidiary-detail__breadcrumb a {
  color: #555555;
  text-decoration: none;
}

.subsidiary-detail__breadcrumb span {
  color: #d60010;
}

.subsidiary-detail__title {
  margin: 56px 0 0;
  text-align: center;
  color: #212121;
  font-size: clamp(36px, 2.2vw, 52px);
  font-weight: 600;
  line-height: 1.18;
}

.subsidiary-detail__line {
  height: 1px;
  margin: 26px 0 34px;
  background: rgba(142, 142, 142, 0.48);
}

.subsidiary-detail__meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
  color: #384a62;
  font-size: 18px;
}

.subsidiary-detail__content p {
  margin: 0 0 12px;
  color: #222f44;
  font-size: clamp(20px, 1.03vw, 23px);
  line-height: 1.88;
}

.subsidiary-detail__image-wrap {
  margin: 34px auto 0;
  width: min(800px, 100%);
}

.subsidiary-detail__image-wrap img {
  width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 767px) {
  .subsidiary-detail {
    padding: 80px 12px 42px;
  }

  .subsidiary-detail__breadcrumb {
    gap: 6px;
    font-size: 14px;
  }

  .subsidiary-detail__title {
    margin-top: 28px;
    font-size: 30px;
  }

  .subsidiary-detail__line {
    margin: 16px 0 20px;
  }

  .subsidiary-detail__meta {
    font-size: 15px;
  }

  .subsidiary-detail__content p {
    font-size: 17px;
    line-height: 1.7;
  }
}
</style>
