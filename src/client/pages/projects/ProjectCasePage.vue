<script setup>
import { computed } from 'vue'
import { useProjectCasePage } from './project-case/useProjectCasePage'
import ProjectCaseFeatureSection from './project-case/components/ProjectCaseFeatureSection.vue'
import ProjectCaseHeroSection from './project-case/components/ProjectCaseHeroSection.vue'
import ProjectCaseSidebar from './project-case/components/ProjectCaseSidebar.vue'
import ProjectCaseStandardSection from './project-case/components/ProjectCaseStandardSection.vue'

const {
  sidebarOpen,
  activeCategoryId,
  activeCategoryIndex,
  activeSectionId,
  orderedCategories,
  heroSlides,
  activeSections,
  expandedCategoryIds,
  visibleSectionIds,
  registerHeroSwiper,
  registerThumbsSwiper,
  handleHeroSlideChange,
  setSectionRef,
  toggleCategory,
  openAllCategories,
  openCategory,
  openProject
} = useProjectCasePage()

const visibleLookup = computed(() => visibleSectionIds.value)

function isVisible(sectionId) {
  return visibleLookup.value.has(sectionId)
}
</script>

<template>
  <div class="project-case-page">
    <ProjectCaseSidebar
      :categories="orderedCategories"
      :active-category-id="activeCategoryId"
      :active-section-id="activeSectionId"
      :expanded-category-ids="expandedCategoryIds"
      :is-open="sidebarOpen"
      @select-all="openAllCategories"
      @select-category="openCategory"
      @select-project="openProject"
      @toggle-category="toggleCategory"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />

    <main class="project-case-page__main">
      <section
        :ref="(element) => setSectionRef('hero', element)"
        data-section-id="hero"
        class="project-case-page__section project-case-page__section--hero"
        :class="{
          'is-active': activeSectionId === 'hero',
          'is-visible': isVisible('hero')
        }"
      >
        <ProjectCaseHeroSection
          :slides="heroSlides"
          :active-index="activeCategoryIndex"
          :active-category-id="activeCategoryId"
          @register-hero-swiper="registerHeroSwiper"
          @register-thumbs-swiper="registerThumbsSwiper"
          @slide-change="handleHeroSlideChange"
          @select-category="openCategory"
        />
      </section>

      <section
        v-for="project in activeSections"
        :key="`${activeCategoryId}-${project.id}`"
        :ref="(element) => setSectionRef(project.id, element)"
        :data-section-id="project.id"
        class="project-case-page__section"
        :class="{
          'is-active': activeSectionId === project.id,
          'is-visible': isVisible(project.id)
        }"
      >
        <ProjectCaseFeatureSection
          v-if="project.pattern === 'feature'"
          :project="project"
          :is-active="activeSectionId === project.id"
        />

        <ProjectCaseStandardSection
          v-else
          :project="project"
          :is-active="activeSectionId === project.id"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.project-case-page {
  --case-sidebar-width: 188px;
  --case-font-display: "Cormorant Garamond", "Times New Roman", Georgia, serif;
  --case-font-sans: "Helvetica Neue", Arial, sans-serif;
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 16%, rgba(236, 228, 215, 0.72), transparent 20%),
    radial-gradient(circle at 88% 84%, rgba(235, 226, 212, 0.68), transparent 18%),
    #f6f3ed;
}

.project-case-page__main {
  position: relative;
}

.project-case-page__section {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.project-case-page__section :deep(.reveal) {
  opacity: 0;
  transform: translateY(46px);
  transition: opacity 0.9s ease, transform 0.9s ease;
  transition-delay: var(--delay, 0s);
}

.project-case-page__section.is-visible :deep(.reveal) {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 1024px) {
  .project-case-page {
    --case-sidebar-width: 170px;
  }
}

@media (max-width: 768px) {
  .project-case-page {
    --case-sidebar-width: 0px;
  }
}
</style>
