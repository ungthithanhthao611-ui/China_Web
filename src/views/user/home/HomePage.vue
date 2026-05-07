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

const isScrolling = ref(false)

const handleWheel = (e) => {
  if (window.innerWidth <= 992 || isScrolling.value || isSyncingByClick.value) return
  
  const delta = e.deltaY
  if (Math.abs(delta) < 30) return // Ignore small scrolls

  if (delta > 0) {
    if (activeSection.value < sections.value.length - 1) {
      e.preventDefault()
      isScrolling.value = true
      scrollToSection(activeSection.value + 1)
    }
  } else {
    if (activeSection.value > 0) {
      e.preventDefault()
      isScrolling.value = true
      scrollToSection(activeSection.value - 1)
    }
  }

  setTimeout(() => {
    isScrolling.value = false
  }, 800)
}

onMounted(() => {
  uiState.isHeaderHidden = false
  uiState.isNavHidden = false
  uiState.isFooterHidden = true

  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleContainerScroll, { passive: true })
    scrollContainer.value.addEventListener('wheel', handleWheel, { passive: false })
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
    scrollContainer.value.removeEventListener('wheel', handleWheel)
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

      <section id="ctn7" class="last-section section-full">
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
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  scroll-snap-stop: always;

  @media (max-width: 992px) {
    height: auto;
    overflow-y: visible;
    scroll-snap-type: none;
  }
}

.section-full {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  @media (max-width: 992px) {
    min-height: auto;
  }
}

#ctn1 { background: #000; }
#ctn2 { background: #f0f7ff; } /* Light Blue */
#ctn4 { background: #fdfaf6; } /* Light Cream */
#ctn5 { background: #f0fff4; } /* Light Green */
#ctn6 { background: #fdfdfb; } /* Match Project section Ivory */

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
  transition: opacity 0.8s ease;
}

:deep(.home-reveal.is-visible) {
  opacity: 1;
}

/* Flying Entrance - Left (for text/content) */
:deep(.home-reveal .content[data-reveal-item]),
:deep(.home-reveal .explorer-list[data-reveal-item]) {
  opacity: 0;
  transform: translate(-80px, 60px) scale(0.98);
  transition: all 2.2s cubic-bezier(0.1, 1, 0.2, 1);
}

:deep(.home-reveal.is-visible .content[data-reveal-item]),
:deep(.home-reveal.is-visible .explorer-list[data-reveal-item]) {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

/* Flying Entrance - Right (for visual/media) */
:deep(.home-reveal .visual[data-reveal-item]),
:deep(.home-reveal .projects-slider-wrapper[data-reveal-item]),
:deep(.home-reveal .section-inner[data-reveal-item]),
:deep(.home-reveal .explorer-visual[data-reveal-item]),
:deep(.home-reveal .visual[data-reveal-item]) {
  opacity: 0;
  transform: translate(80px, 60px) scale(0.98);
  transition: all 2.2s cubic-bezier(0.1, 1, 0.2, 1);
  transition-delay: 0.4s;
}

:deep(.home-reveal.is-visible .visual[data-reveal-item]),
:deep(.home-reveal.is-visible .projects-slider-wrapper[data-reveal-item]),
:deep(.home-reveal.is-visible .section-inner[data-reveal-item]),
:deep(.home-reveal.is-visible .explorer-visual[data-reveal-item]) {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

/* Floating Animation - More subtle for high-end feel */
@keyframes floating {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-10px) scale(1.01); }
  100% { transform: translateY(0px) scale(1); }
}

:deep(.home-reveal.is-visible .visual img),
:deep(.home-reveal.is-visible .project-card),
:deep(.home-reveal.is-visible .explorer-visual img),
:deep(.home-reveal.is-visible .news-item img) {
  animation: floating 12s ease-in-out infinite;
}

:deep(.home-reveal.is-visible .visual img),
:deep(.home-reveal.is-visible .explorer-visual img),
:deep(.home-reveal.is-visible .news-item img) {
  animation-delay: 2.2s;
}
</style>
