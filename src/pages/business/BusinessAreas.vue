<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { uiState } from '@/utils/uiState'
import BusinessHero from './BusinessHero.vue'
import BusinessSideNav from './BusinessSideNav.vue'

// Import Individual Sections
import ArchitecturalDecoration from './ArchitecturalDecoration.vue'
import DesignResearch from './DesignResearch.vue'
import UrbanRenewal from './UrbanRenewal.vue'
import EcologicalEnvironment from './EcologicalEnvironment.vue'
import ExhibitionDisplay from './ExhibitionDisplay.vue'
import DigitalTechnology from './DigitalTechnology.vue'
import IntelligentManufacturing from './IntelligentManufacturing.vue'
import IndustrialCollege from './IndustrialCollege.vue'

const activeSection = ref(0)

// Update URL hash when section changes (1-indexed: ctn1, ctn2...)
watch(activeSection, (newVal) => {
  const hash = `#ctn${newVal + 1}`
  window.history.replaceState(history.state, '', window.location.pathname + hash)
  
  // Ẩn menu và footer hệ thống khi ở trang này
  uiState.isHeaderHidden = newVal > 0
  uiState.isFooterHidden = true 
}, { immediate: true })

onUnmounted(() => {
  // Hiện lại menu và footer khi rời khỏi trang Business Areas
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
  // Nếu đang ở section cuối, hãy kiểm tra xem có nên để nó cuộn nội dung bên trong (xem footer) không
  if (activeSection.value === totalSections - 1 && e.deltaY > 0) {
     // Cho phép cuộn tự nhiên của trình duyệt để xem footer
     return 
  }

  // Chặn cuộn mặc định để thực hiện snap transition
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
    // Nếu đang ở section cuối và không ở đỉnh đầu của nó, hãy để nó cuộn lên tự nhiên trước khi snap về section trước
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
    }, 1200) // Khớp với thời gian transition 1s + đệm
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
