<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { env } from '@/shared/config/env'
import { getHonorsPageData } from '@/client/services/honorsApi'
import HonorsAwardsTabs from '@/client/pages/honors/ui/HonorsAwardsTabs.vue'
import HonorsHeroSection from '@/client/pages/honors/ui/HonorsHeroSection.vue'
import HonorsQualificationList from '@/client/pages/honors/ui/HonorsQualificationList.vue'

const route = useRoute()
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const honorSections = [
  { id: 'page1', label: 'Top' },
  { id: 'page2', label: 'Qualification certificate' },
  { id: 'page3', label: 'Honorary Awards' },
]

const activeSection = ref('page1')
const loading = ref(false)

const hero = ref({
  title: 'QUALIFICATION HONOR',
  description: 'Make customers satisfied, make employees proud, let the world recognize',
  background:
    'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg',
  mobile_background:
    'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/478d7a9b-32d8-4f48-a644-7790d0ebbe19.jpeg',
  accent:
    'https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png',
})
const qualificationItems = ref([])
const corporateItems = ref([])
const projectItems = ref([])

function resolveImageUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function handleScroll() {
  const scrollCenter = window.scrollY + window.innerHeight * 0.45
  for (const item of honorSections) {
    const element = document.getElementById(item.id)
    if (!element) continue
    const top = element.offsetTop
    const bottom = top + element.offsetHeight
    if (scrollCenter >= top && scrollCenter < bottom) {
      activeSection.value = item.id
      break
    }
  }
}

function scrollToSection(id) {
  const section = document.getElementById(id)
  if (!section) return
  const top = section.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: 'smooth' })
  window.history.replaceState(null, '', `/honors#${id}`)
}

async function syncHashSection() {
  await nextTick()
  const hash = route.hash?.replace('#', '')
  if (hash && honorSections.some((item) => item.id === hash)) {
    scrollToSection(hash)
    return
  }
  handleScroll()
}

async function loadHonors() {
  loading.value = true
  try {
    const payload = await getHonorsPageData()
    hero.value = {
      ...hero.value,
      ...(payload?.hero || {}),
    }
    qualificationItems.value = payload?.sections?.qualification_certificates || []
    corporateItems.value = payload?.sections?.corporate_honors || []
    projectItems.value = payload?.sections?.project_honors || []
  } finally {
    loading.value = false
  }
}

watch(
  () => route.hash,
  () => {
    syncHashSection()
  },
)

watch(activeSection, (value) => {
  if (route.path === '/honors') {
    window.history.replaceState(null, '', `/honors#${value}`)
  }
})

onMounted(async () => {
  await loadHonors()
  handleScroll()
  syncHashSection()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <main class="honors-page">
    <aside class="dots" aria-label="Honors section navigation">
      <button
        v-for="item in honorSections"
        :key="item.id"
        class="dots__item"
        :class="{ active: activeSection === item.id }"
        type="button"
        :aria-label="`Go to ${item.label}`"
        @click="scrollToSection(item.id)"
      >
        <span></span>
      </button>
    </aside>

    <HonorsHeroSection :hero="hero" @go-section="scrollToSection" />
    <HonorsQualificationList :items="qualificationItems" :image-resolver="resolveImageUrl" />
    <HonorsAwardsTabs
      :corporate-items="corporateItems"
      :project-items="projectItems"
      :image-resolver="resolveImageUrl"
    />

    <div v-if="loading" class="loading-mask">Loading honors...</div>
  </main>
</template>

<style scoped>
.honors-page {
  position: relative;
  background: #1e1408;
  color: #fff;
}

.dots {
  position: fixed;
  top: 50%;
  right: 24px;
  transform: translateY(-50%);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dots__item {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.dots__item span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
}

.dots__item.active span,
.dots__item:hover span {
  width: 12px;
  height: 12px;
  background: #df0019;
}

.loading-mask {
  position: fixed;
  inset: auto 20px 20px auto;
  z-index: 40;
  background: rgba(11, 23, 39, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 8px 14px;
  color: #fff;
  font-size: 13px;
}

@media (max-width: 767px) {
  .dots {
    right: 8px;
    gap: 8px;
  }
}
</style>


