<script setup>
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import HeroBanner from './sections/HeroBanner.vue'
import HomeNav from './sections/HomeNav.vue'

import AppFooter from '@/views/user/layout/AppFooter.vue'
import { uiState } from '@/shared/utils/uiState'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'

const HomeAboutQuick = defineAsyncComponent(() => import('./sections/HomeAboutQuick.vue'))
const HomeCapabilityPreview = defineAsyncComponent(() => import('./sections/HomeCapabilityPreview.vue'))
const HomeProductsPreview = defineAsyncComponent(() => import('./sections/HomeProductsPreview.vue'))
const HomeProjectsPreview = defineAsyncComponent(() => import('./sections/HomeProjectsPreview.vue'))
const NewsSection = defineAsyncComponent(() => import('./sections/NewsSection.vue'))

const activeSection = ref(0)
const activeBanner = ref(0)
const scrollContainer = ref(null)
const heroRef = ref(null)
const bootstrapStore = useBootstrapStore()
const { t } = useI18n({ useScope: 'global' })

const sections = computed(() => [
  { label: t('user.home.home'), id: 'ctn1' },
  { label: t('user.home.about'), id: 'ctn2' },
  { label: t('user.home.capability'), id: 'ctn3' },
  { label: t('user.home.products'), id: 'ctn4' },
  { label: t('user.home.projects'), id: 'ctn5' },
  { label: t('user.home.news'), id: 'ctn6' },
  { label: t('user.home.contactTitle'), id: 'ctn7' },
])

const bannerCount = computed(() => {
  const count = bootstrapStore.heroBanners?.length || 0
  return count > 0 ? count : 6
})

const isSyncingByClick = ref(false)
let scrollRafId = null

watch(bannerCount, (count) => {
  if (activeBanner.value >= count) {
    activeBanner.value = 0
  }
})

const handleBannerChange = (index) => {
  activeBanner.value = index
}

const handleBannerNavigate = (index) => {
  heroRef.value?.goToSlide(index)
}

const resolveSectionTop = (index) => {
  const section = document.getElementById(sections.value[index].id)
  if (!section) return null
  return section.offsetTop
}

const updateActiveSectionFromScroll = () => {
  const container = scrollContainer.value
  if (!container) return

  const center = container.scrollTop + container.clientHeight * 0.35
  let nextActive = 0

  for (let index = 0; index < sections.value.length; index += 1) {
    const top = resolveSectionTop(index)
    if (top === null) continue
    if (center >= top) nextActive = index
  }

  activeSection.value = nextActive
}

const handleContainerScroll = () => {
  if (isSyncingByClick.value) return
  if (scrollRafId) cancelAnimationFrame(scrollRafId)
  scrollRafId = requestAnimationFrame(updateActiveSectionFromScroll)
}

const scrollToSection = (index) => {
  const container = scrollContainer.value
  const top = resolveSectionTop(index)

  if (!container || top === null) return

  isSyncingByClick.value = true
  activeSection.value = index

  container.scrollTo({ top, behavior: 'smooth' })
  window.history.replaceState(history.state, '', `#${sections.value[index].id}`)

  setTimeout(() => {
    isSyncingByClick.value = false
    updateActiveSectionFromScroll()
  }, 500)
}

const navigateToSection = (index) => {
  scrollToSection(index)
}

const handleHashChange = () => {
  const hash = window.location.hash.replace('#', '')
  const index = sections.value.findIndex((section) => section.id === hash)
  if (index !== -1) scrollToSection(index)
}

onMounted(() => {
  uiState.isHeaderHidden = false
  uiState.isNavHidden = false
  uiState.isFooterHidden = true

  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleContainerScroll, { passive: true })
    setTimeout(() => {
      handleHashChange()
      updateActiveSectionFromScroll()
    }, 160)
  }

  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleContainerScroll)
  }

  if (scrollRafId) cancelAnimationFrame(scrollRafId)

  window.removeEventListener('hashchange', handleHashChange)
  uiState.isFooterHidden = false
  uiState.isHeaderHidden = false
  uiState.isNavHidden = false
})
</script>

<template>
  <div class="full-page-wrapper">
    <HomeNav
      :sections="sections"
      :activeSection="activeSection"
      :activeBanner="activeBanner"
      :bannerCount="bannerCount"
      @navigate="navigateToSection"
      @navigate-banner="handleBannerNavigate"
    />

    <div ref="scrollContainer" class="scroll-container">
      <section id="ctn1" class="section-full section-hero">
        <HeroBanner
          ref="heroRef"
          :active="activeSection === 0"
          @scroll-next="navigateToSection(1)"
          @slide-change="handleBannerChange"
        />
      </section>

      <section id="ctn2" class="section-full">
        <HomeAboutQuick />
      </section>

      <section id="ctn3" class="section-full">
        <HomeCapabilityPreview />
      </section>

      <section id="ctn4" class="section-full">
        <HomeProductsPreview />
      </section>

      <section id="ctn5" class="section-full">
        <HomeProjectsPreview />
      </section>

      <section id="ctn6" class="section-full">
        <div class="section-inner">
          <NewsSection :active="activeSection === 5" />
        </div>
      </section>

      <section id="ctn7" class="last-section">
        <div class="section-inner partner-section">
          <AppFooter :force-visible="true" />
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.full-page-wrapper {
  --home-content-max: 870px;
  --home-section-pad: clamp(41px, 4.9vw, 70px);
  --home-grid-gap: 11px;

  --home-accent: #b20e17;
  --home-text-strong: #151f31;
  --home-text-muted: #4d596d;
  --home-surface-base: #ffffff;
  --home-surface-soft: #f7f8fa;
  --home-border-soft: rgba(17, 24, 39, 0.08);

  --home-radius-sm: 16px;
  --home-radius-md: 20px;
  --home-radius-lg: 24px;

  --home-font-display: 'Merriweather', Georgia, 'Times New Roman', serif;
  --home-font-body: 'Manrope', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;

  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;

  @media (max-width: 992px) {
    --home-content-max: 1260px;
    --home-section-pad: clamp(64px, 8vw, 108px);
    --home-grid-gap: 18px;

    height: auto;
    overflow: visible;
  }
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 992px) {
    height: auto;
    overflow-y: visible;
  }
}

.section-full {
  width: 100%;
  min-height: auto;
  display: flex;
  flex-direction: column;

  @media (max-width: 992px) {
    min-height: auto;
  }
}

.section-inner {
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.last-section {
  background-color: #f9f9f9;
  height: auto;
  min-height: auto;

  .partner-section {
    padding: 0 !important;
    flex: 0 0 auto;
  }

  @media (max-width: 992px) {
    min-height: 100vh;
  }
}

:deep(.home-reveal) {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.48s ease, transform 0.48s ease;
}

:deep(.home-reveal.is-visible) {
  opacity: 1;
  transform: translateY(0);
}

:deep(.home-reveal [data-reveal-item]) {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.44s ease, transform 0.44s ease;
}

:deep(.home-reveal.is-visible [data-reveal-item]) {
  opacity: 1;
  transform: translateY(0);
}

:deep(.home-reveal.is-visible [data-reveal-item]:nth-child(2)) {
  transition-delay: 0.08s;
}

:deep(.home-reveal.is-visible [data-reveal-item]:nth-child(3)) {
  transition-delay: 0.14s;
}

:deep(.home-reveal.is-visible [data-reveal-item]:nth-child(4)) {
  transition-delay: 0.2s;
}
</style>
