<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { uiState } from '@/shared/utils/uiState'
import BusinessHero from './ui/BusinessHero.vue'
import BusinessSideNav from './ui/BusinessSideNav.vue'

// Import Individual Sections
import ArchitecturalDecoration from './sections/ArchitecturalDecoration.vue'
import DesignResearch from './sections/DesignResearch.vue'
import UrbanRenewal from './sections/UrbanRenewal.vue'
import EcologicalEnvironment from './sections/EcologicalEnvironment.vue'
import ExhibitionDisplay from './sections/ExhibitionDisplay.vue'
import DigitalTechnology from './sections/DigitalTechnology.vue'
import IntelligentManufacturing from './sections/IntelligentManufacturing.vue'
import IndustrialCollege from './sections/IndustrialCollege.vue'

const activeSection = ref(0)

// Update URL hash when section changes (1-indexed: ctn1, ctn2...)
watch(activeSection, (newVal) => {
  const hash = `#ctn${newVal + 1}`
  window.history.replaceState(history.state, '', window.location.pathname + hash)
  
  // áº¨n menu vÃ  footer há»‡ thá»‘ng khi á»Ÿ trang nÃ y
  uiState.isHeaderHidden = newVal > 0
  uiState.isFooterHidden = true 
}, { immediate: true })

onUnmounted(() => {
  // Hiá»‡n láº¡i menu vÃ  footer khi rá»i khá»i trang Business Areas
  uiState.isHeaderHidden = false
  uiState.isFooterHidden = false
})

const isScrolling = ref(false)
const totalSections = 9 // Hero + 8 Sections

const sectionsData = [
  { label: 'Hero', type: 'hero' },
  { label: 'Architectural Decoration' },
  { label: 'Design R & D' },
  { label: 'Urban Renewal' },
  { label: 'Ecological Environment' },
  { label: 'Exhibition' },
  { label: 'Digital Technology' },
  { label: 'Intelligent Manufacturing' },
  { label: 'Industrial College' }
]

const scrollToSection = (index) => {
  if (typeof index === 'string') {
    index = sectionsData.findIndex(s => s.label === index)
  }
  if (index >= 0 && index < totalSections) {
    activeSection.value = index
  }
}

const handleScroll = (e) => {
  // Náº¿u Ä‘ang á»Ÿ section cuá»‘i, hÃ£y kiá»ƒm tra xem cÃ³ nÃªn Ä‘á»ƒ nÃ³ cuá»™n ná»™i dung bÃªn trong (xem footer) khÃ´ng
  if (activeSection.value === totalSections - 1 && e.deltaY > 0) {
     // Cho phÃ©p cuá»™n tá»± nhiÃªn cá»§a trÃ¬nh duyá»‡t Ä‘á»ƒ xem footer
     return 
  }

  // Cháº·n cuá»™n máº·c Ä‘á»‹nh Ä‘á»ƒ thá»±c hiá»‡n snap transition
  if (isScrolling.value) {
    e.preventDefault()
    return
  }
  
  if (e.deltaY > 0) {
    if (activeSection.value < totalSections - 1) {
      e.preventDefault()
      isScrolling.value = true
      activeSection.value++
    }
  } else {
    // Náº¿u Ä‘ang á»Ÿ section cuá»‘i vÃ  khÃ´ng á»Ÿ Ä‘á»‰nh Ä‘áº§u cá»§a nÃ³, hÃ£y Ä‘á»ƒ nÃ³ cuá»™n lÃªn tá»± nhiÃªn trÆ°á»›c khi snap vá» section trÆ°á»›c
    const lastSectionEl = document.querySelector('.last-section-wrapper')
    if (activeSection.value === totalSections - 1 && lastSectionEl && lastSectionEl.scrollTop > 10) {
      return
    }

    if (activeSection.value > 0) {
      e.preventDefault()
      isScrolling.value = true
      activeSection.value--
    }
  }
  
  if (isScrolling.value) {
    setTimeout(() => {
      isScrolling.value = false
    }, 1200) // Khá»›p vá»›i thá»i gian transition 1s + Ä‘á»‡m
  }
}

onMounted(() => {
  // Sync with hash on load
  const hash = window.location.hash
  if (hash && hash.startsWith('#ctn')) {
    const sectionIndex = parseInt(hash.replace('#ctn', '')) - 1
    if (sectionIndex >= 0 && sectionIndex < totalSections) {
      activeSection.value = sectionIndex
    }
  }
  window.addEventListener('wheel', handleScroll, { passive: false })
})

onUnmounted(() => {
  window.removeEventListener('wheel', handleScroll)
})
</script>

<template>
  <div class="business-areas-page">
    <!-- Fixed Navigation -->
    <BusinessSideNav 
      :current="activeSection" 
      :total="totalSections" 
      @navigate="scrollToSection"
    />

    <div class="sections-container" :style="{ transform: `translateY(-${activeSection * 100}vh)` }">
      <!-- Section 0: Hero -->
      <BusinessHero 
        :active="activeSection === 0"
        :sections="sectionsData"
        @navigateTo="scrollToSection"
      />

      <!-- Section 1: Architectural Decoration -->
      <ArchitecturalDecoration :active="activeSection === 1" />

      <!-- Section 2: Design R & D -->
      <DesignResearch :active="activeSection === 2" />

      <!-- Section 3: Urban Renewal -->
      <UrbanRenewal :active="activeSection === 3" />

      <!-- Section 4: Ecological Environment -->
      <EcologicalEnvironment :active="activeSection === 4" />

      <!-- Section 5: Exhibition -->
      <ExhibitionDisplay :active="activeSection === 5" />

      <!-- Section 6: Digital Technology -->
      <DigitalTechnology :active="activeSection === 6" />

      <!-- Section 7: Intelligent Manufacturing -->
      <IntelligentManufacturing :active="activeSection === 7" />

      <!-- Section 8: Industrial College -->
      <IndustrialCollege :active="activeSection === 8" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.business-areas-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.sections-container {
  width: 100%;
  height: 100%;
  transition: transform 1s cubic-bezier(0.86, 0, 0.07, 1);
}
</style>
