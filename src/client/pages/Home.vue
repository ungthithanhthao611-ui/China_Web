<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import HeroBanner from './home/HeroBanner.vue'
import HomeAbout from './home/HomeAbout.vue'
import StatsSection from './home/StatsSection.vue'
import BusinessDisplay from './home/BusinessDisplay.vue'
import ProjectSection from './home/ProjectSection.vue'
import NewsSection from './home/NewsSection.vue'
import IndustrialDistribution from './home/IndustrialDistribution.vue'
import HomeNav from './home/HomeNav.vue'
import AppFooter from '@/client/components/layout/AppFooter.vue'
import { uiState } from '@/utils/uiState'

const activeSection = ref(0)
const activeBanner = ref(0)

// Watch activeSection to control UI visibility
watch(activeSection, (newVal) => {
  uiState.isHeaderHidden = newVal > 0
  uiState.isNavHidden = false
  uiState.isFooterHidden = true
}, { immediate: true })

onUnmounted(() => {
  uiState.isFooterHidden = false
  uiState.isHeaderHidden = false
  uiState.isNavHidden = false
})
const scrollContainer = ref(null)
const heroRef = ref(null)

const sections = [
  { label: 'Home', id: 'ctn1' },
  { label: 'About Us', id: 'ctn2' },
  { label: 'Business Display', id: 'ctn3' },
  { label: 'Project Case', id: 'ctn4' },
  { label: 'News Center', id: 'ctn5' },
  { label: 'Industrial Distribution', id: 'ctn6' },
  { label: 'Partners', id: 'ctn7' }
]

const isScrolling = ref(false)

const handleBannerChange = (index) => {
  activeBanner.value = index
}

const handleBannerNavigate = (index) => {
  if (heroRef.value) {
    heroRef.value.goToSlide(index)
  }
}

const handleWheel = (e) => {
  if (isScrolling.value || window.innerWidth <= 992) return
  
  if (Math.abs(e.deltaY) < 30) return // Threshold to avoid micro-scrolls

  if (e.deltaY > 0) {
    if (activeSection.value < sections.length - 1) {
      scrollToSection(activeSection.value + 1)
    }
  } else {
    if (activeSection.value > 0) {
      scrollToSection(activeSection.value - 1)
    }
  }
}

const scrollToSection = (index) => {
  isScrolling.value = true
  activeSection.value = index
  
  const height = window.innerHeight
  scrollContainer.value.scrollTo({
    top: index * height,
    behavior: 'smooth'
  })

  // Hash update
  const newHash = sections[index].id
  window.history.replaceState(history.state, '', `#${newHash}`)

  // Cooldown to match 700ms transition
  setTimeout(() => {
    isScrolling.value = false
  }, 800)
}

const navigateToSection = (index) => {
  scrollToSection(index)
}

const handleHashChange = () => {
  const hash = window.location.hash.replace('#', '')
  const index = sections.findIndex(s => s.id === hash)
  if (index !== -1 && index !== activeSection.value) {
    scrollToSection(index)
  }
}

onMounted(() => {
  if (scrollContainer.value) {
    window.addEventListener('wheel', handleWheel, { passive: false })
    // Initial hash
    setTimeout(handleHashChange, 500)
  }
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <div class="full-page-wrapper">
    <!-- Side Nav Dots -->
    <HomeNav
      :sections="sections"
      :activeSection="activeSection"
      :activeBanner="activeBanner"
      @navigate="navigateToSection"
      @navigate-banner="handleBannerNavigate"
    />

    <!-- Main Scroll Container -->
    <div ref="scrollContainer" class="scroll-container">
      <section id="ctn1" class="section-full">
        <HeroBanner 
          ref="heroRef" 
          :active="activeSection === 0" 
          @scroll-next="navigateToSection(1)" 
          @slide-change="handleBannerChange"
        />
      </section>

      <section id="ctn2" class="section-full">
        <HomeAbout :active="activeSection === 1" />
      </section>

      <section id="ctn3" class="section-full">
        <BusinessDisplay :active="activeSection === 2" />
      </section>

      <section id="ctn4" class="section-full bg-light">
        <div class="section-inner projects-full">
          <ProjectSection :active="activeSection === 3" />
        </div>
      </section>

      <section id="ctn5" class="section-full">
        <div class="section-inner">
          <NewsSection :active="activeSection === 4" />
        </div>
      </section>

      <section id="ctn6" class="section-full">
        <IndustrialDistribution :active="activeSection === 5" />
      </section>

      <section id="ctn7" class="section-full last-section">
        <div class="section-inner partner-section">
          <AppFooter :force-visible="true" />
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.full-page-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  
  @media (max-width: 992px) {
    height: auto;
    overflow: visible;
  }
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width: none; // Hide scrollbar for Firefox
  
  &::-webkit-scrollbar {
    display: none; // Hide scrollbar for Chrome/Safari
  }

  @media (max-width: 992px) {
    height: auto;
    overflow-y: visible;
    scroll-snap-type: none;
  }
}

.section-full {
  width: 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 992px) {
    height: auto;
    min-height: 100vh;
  }
}

.section-inner {
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.bg-light { background-color: $bg-light; }

.projects-full {
  padding: 0 !important;
}

.last-section {
  background-color: #f9f9f9;
  height: auto !important;
  min-height: auto;
  
  .partner-section {
    padding: 0 !important;
    justify-content: flex-start !important;
    flex: 0 0 auto;
  }

  @media (max-width: 992px) {
    min-height: 100vh;
  }
}
</style>


