<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Minus, Plus } from 'lucide-vue-next'
import { projectCaseData } from './projectCaseData'
import { uiState } from '@/utils/uiState'

const route = useRoute()
const router = useRouter()

const FALLBACK_CATEGORY_ID = '1676767239059300352'
const categories = projectCaseData.categories
const ACTIVE_HERO_ORDER = [
  '1704497077341675520',
  '1676767239059300352',
  '1676767170574704640',
  '1676767113616056320',
  '1676767038802255872',
  '1676766907172413440',
  '1676518259805151232',
  '1676518105735782400',
  '1676518209716772864',
  '1676517942061457408'
]

const shellRef = ref(null)
const sideScrollRef = ref(null)
const sectionRefs = reactive(new Map())
const sidebarOpen = ref(true)
const activeCategoryId = ref(FALLBACK_CATEGORY_ID)
const expandedIds = ref([FALLBACK_CATEGORY_ID])
const activeSectionId = ref('hero')
const heroImageIndex = ref(0)
const projectImageCursor = reactive({})

const categoryById = computed(() =>
  Object.fromEntries(categories.map((category) => [category.id, category]))
)

const orderedCategories = computed(() => {
  const mapped = ACTIVE_HERO_ORDER.map((id) => categoryById.value[id]).filter(Boolean)
  const remaining = categories.filter((category) => !ACTIVE_HERO_ORDER.includes(category.id))
  return [...mapped, ...remaining]
})

const activeCategory = computed(
  () => categoryById.value[activeCategoryId.value] || categoryById.value[FALLBACK_CATEGORY_ID]
)

const activeProjects = computed(() => activeCategory.value?.projects ?? [])

const sectionIds = computed(() => ['hero', ...activeProjects.value.map((project) => project.id)])

const heroSlides = computed(() =>
  orderedCategories.value.map((category) => {
    const match = projectCaseData.heroSlides.find(
      (slide) => normalizeText(slide.title) === normalizeText(category.name)
    )

    return {
      id: category.id,
      name: category.name,
      images: match?.images?.length ? match.images : [fallbackProjectImage(category)]
    }
  })
)

const activeHeroSlide = computed(
  () => heroSlides.value.find((slide) => slide.id === activeCategoryId.value) || heroSlides.value[0]
)

const progressSegments = computed(() => sectionIds.value)

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
}

function fallbackProjectImage(category) {
  const firstProject = category?.projects?.[0]
  return firstProject?.leftImages?.[0] || firstProject?.rightImages?.[0] || ''
}

function ensureExpanded(id) {
  if (!expandedIds.value.includes(id)) {
    expandedIds.value = [...expandedIds.value, id]
  }
}

function toggleCategory(id) {
  if (expandedIds.value.includes(id)) {
    expandedIds.value = expandedIds.value.filter((value) => value !== id)
    return
  }

  expandedIds.value = [...expandedIds.value, id]
}

function isExpanded(id) {
  return expandedIds.value.includes(id)
}

function resolveCategoryFromRoute() {
  const raw = Array.isArray(route.params.category) ? route.params.category[0] : route.params.category

  if (!raw) return FALLBACK_CATEGORY_ID
  if (categoryById.value[raw]) return raw

  const normalized = normalizeText(decodeURIComponent(raw))
  const fromSlug = categories.find((category) => normalizeText(category.name) === normalized)
  return fromSlug?.id || FALLBACK_CATEGORY_ID
}

function resetProjectCursor() {
  Object.keys(projectImageCursor).forEach((key) => delete projectImageCursor[key])
}

function sectionAnchor(projectId, side) {
  return `${projectId}-${side}`
}

function currentProjectImage(project, side) {
  const images = side === 'left' ? project.leftImages : project.rightImages
  if (!images?.length) {
    return side === 'right'
      ? project.leftImages?.[0] || activeHeroSlide.value?.images?.[0] || ''
      : activeHeroSlide.value?.images?.[0] || ''
  }

  const cursor = projectImageCursor[sectionAnchor(project.id, side)] ?? 0
  return images[cursor % images.length]
}

function stepProjectImage(project, side, direction) {
  const images = side === 'left' ? project.leftImages : project.rightImages
  if (!images?.length || images.length < 2) return

  const key = sectionAnchor(project.id, side)
  const current = projectImageCursor[key] ?? 0
  projectImageCursor[key] = (current + direction + images.length) % images.length
}

function setSectionRef(id, el) {
  if (el) {
    sectionRefs.set(id, el)
    return
  }

  sectionRefs.delete(id)
}

function updateSeo() {
  const categoryName = activeCategory.value?.name || 'Project Case'
  document.title = `${categoryName}_China Decor`

  const description = `Project case - ${categoryName} - China Decor`
  const keywords = `Project Case, ${categoryName}, China Decor`

  upsertMeta('description', description)
  upsertMeta('keywords', keywords)
}

function upsertMeta(name, content) {
  let tag = document.head.querySelector(`meta[name="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function setActiveCategory(id, options = {}) {
  if (!categoryById.value[id]) return

  const { scrollTo = 'hero', updateUrl = true } = options

  activeCategoryId.value = id
  heroImageIndex.value = heroSlides.value.findIndex((slide) => slide.id === id)
  activeSectionId.value = 'hero'
  ensureExpanded(id)
  resetProjectCursor()
  updateSeo()

  if (updateUrl) {
    router.replace({
      path: `/projects/${id}`,
      hash: scrollTo && scrollTo !== 'hero' ? `#${scrollTo}` : ''
    })
  }

  nextTick(() => {
    if (scrollTo === 'hero') {
      scrollToSection('hero', false)
      return
    }

    scrollToSection(scrollTo, false)
  })
}

function scrollToSection(id, smooth = true) {
  const el = sectionRefs.get(id)
  if (!el) return

  el.scrollIntoView({
    behavior: smooth ? 'smooth' : 'auto',
    block: 'start'
  })
}

function openCase(categoryId, projectId) {
  if (activeCategoryId.value !== categoryId) {
    setActiveCategory(categoryId, { scrollTo: projectId, updateUrl: true })
    return
  }

  activeSectionId.value = projectId
  router.replace({ path: `/projects/${categoryId}`, hash: `#${projectId}` })
  nextTick(() => scrollToSection(projectId))
}

function goToAll() {
  setActiveCategory(FALLBACK_CATEGORY_ID, { scrollTo: 'hero', updateUrl: true })
}

function goToProgress(id) {
  activeSectionId.value = id

  router.replace({
    path: `/projects/${activeCategoryId.value}`,
    hash: id !== 'hero' ? `#${id}` : ''
  })

  nextTick(() => scrollToSection(id))
}

function syncActiveSection() {
  const entries = [...sectionRefs.entries()]
  if (!entries.length) return

  const viewportMiddle = window.innerHeight * 0.38
  let closest = entries[0][0]
  let closestDistance = Number.POSITIVE_INFINITY

  entries.forEach(([id, el]) => {
    const rect = el.getBoundingClientRect()
    const distance = Math.abs(rect.top - viewportMiddle)

    if (distance < closestDistance) {
      closestDistance = distance
      closest = id
    }
  })

  activeSectionId.value = closest
}

function scrollSide(direction) {
  if (!sideScrollRef.value) return

  sideScrollRef.value.scrollBy({
    top: direction * 220,
    behavior: 'smooth'
  })
}

function prevHero() {
  const total = heroSlides.value.length
  if (!total) return

  const nextIndex = (heroImageIndex.value - 1 + total) % total
  heroImageIndex.value = nextIndex
  setActiveCategory(heroSlides.value[nextIndex].id, { scrollTo: 'hero', updateUrl: true })
}

function nextHero() {
  const total = heroSlides.value.length
  if (!total) return

  const nextIndex = (heroImageIndex.value + 1) % total
  heroImageIndex.value = nextIndex
  setActiveCategory(heroSlides.value[nextIndex].id, { scrollTo: 'hero', updateUrl: true })
}

function syncFromRoute() {
  const resolvedCategoryId = resolveCategoryFromRoute()
  const rawHash = route.hash?.replace('#', '') || 'hero'
  const targetSection = rawHash === 'hero' ? 'hero' : rawHash

  setActiveCategory(resolvedCategoryId, {
    scrollTo: targetSection,
    updateUrl: false
  })
}

watch(
  () => route.fullPath,
  () => {
    syncFromRoute()
  }
)

watch(activeCategoryId, () => {
  updateSeo()
})

onMounted(() => {
  uiState.isNavHidden = false
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
  uiState.isFooterHidden = true

  syncFromRoute()
  window.addEventListener('scroll', syncActiveSection, { passive: true })
  nextTick(syncActiveSection)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', syncActiveSection)
  uiState.isNavHidden = false
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
  uiState.isFooterHidden = false
})
</script>

<template>
  <div ref="shellRef" class="project-case-shell" :class="{ collapsed: !sidebarOpen }">
    <aside class="case-nav">
      <div id="project-case-all" class="case-nav-all" @click="goToAll">All</div>

      <div ref="sideScrollRef" class="case-nav-scroll">
        <section
          v-for="category in orderedCategories"
          :key="category.id"
          class="case-group"
          :class="{ 'is-active': activeCategoryId === category.id }"
        >
          <button
            :id="`project-case-category-${category.id}`"
            class="case-group-head"
            type="button"
            @click="setActiveCategory(category.id, { scrollTo: 'hero', updateUrl: true })"
          >
            <span>{{ category.name }}</span>
            <span class="case-group-icon" @click.stop="toggleCategory(category.id)">
              <Minus v-if="isExpanded(category.id)" :size="16" />
              <Plus v-else :size="16" />
            </span>
          </button>

          <transition name="expand">
            <div v-if="isExpanded(category.id)" class="case-group-body">
              <div class="case-group-count">
                <span>{{ category.projects.length }}</span>
                <span>project cases in total</span>
              </div>

              <button
                v-for="project in category.projects"
                :id="`project-case-item-${project.id}`"
                :key="`${category.id}-${project.id}`"
                class="case-item"
                :class="{ active: activeCategoryId === category.id && activeSectionId === project.id }"
                type="button"
                @click="openCase(category.id, project.id)"
              >
                {{ project.title }}
              </button>
            </div>
          </transition>
        </section>
      </div>

      <div class="case-nav-actions">
        <button id="project-case-side-up" type="button" @click="scrollSide(-1)">
          <ChevronUp :size="24" />
        </button>
        <button id="project-case-side-down" type="button" @click="scrollSide(1)">
          <ChevronDown :size="24" />
        </button>
      </div>

      <button
        id="project-case-nav-toggle"
        class="case-nav-toggle"
        type="button"
        @click="sidebarOpen = !sidebarOpen"
      >
        <ChevronLeft v-if="sidebarOpen" :size="24" />
        <ChevronRight v-else :size="24" />
      </button>
    </aside>

    <main class="case-main">
      <section
        :ref="(el) => setSectionRef('hero', el)"
        class="hero-panel case-section"
        :class="{ active: activeSectionId === 'hero' }"
      >
        <div class="hero-stage">
          <div class="hero-media">
            <img
              class="hero-image desktop"
              :src="activeHeroSlide?.images?.[0]"
              :alt="activeHeroSlide?.name || activeCategory.name"
              draggable="false"
            />
            <img
              class="hero-image mobile"
              :src="activeHeroSlide?.images?.[1] || activeHeroSlide?.images?.[0]"
              :alt="`${activeHeroSlide?.name || activeCategory.name} mobile`"
              draggable="false"
            />
          </div>

          <div class="hero-copy">
            <div class="hero-copy-inner">
              <h1 id="project-case-title">{{ activeCategory.name }}</h1>
              <div class="hero-line"></div>
              <p>{{ activeProjects.length }} premium project cases</p>
            </div>
          </div>

          <button id="project-case-hero-prev" class="hero-arrow prev" type="button" @click="prevHero">
            <ChevronLeft :size="28" />
          </button>
          <button id="project-case-hero-next" class="hero-arrow next" type="button" @click="nextHero">
            <ChevronRight :size="28" />
          </button>
        </div>

        <nav class="hero-category-strip" aria-label="Project categories">
          <button
            v-for="category in orderedCategories"
            :id="`project-case-strip-${category.id}`"
            :key="`strip-${category.id}`"
            type="button"
            class="hero-category-pill"
            :class="{ active: activeCategoryId === category.id }"
            @click="setActiveCategory(category.id, { scrollTo: 'hero', updateUrl: true })"
          >
            {{ category.name }}
          </button>
        </nav>
      </section>

      <section
        v-for="(project, index) in activeProjects"
        :id="project.id"
        :ref="(el) => setSectionRef(project.id, el)"
        :key="`${activeCategory.id}-${project.id}`"
        class="project-panel case-section"
        :class="[`layout-${index % 2 === 0 ? 'a' : 'b'}`, { active: activeSectionId === project.id }]"
      >
        <div class="project-ornament top"></div>

        <div class="project-layout">
          <div class="project-text-card">
            <div class="project-text-inner">
              <h2 :id="`project-title-${project.id}`">{{ project.title }}</h2>
              <div class="project-line"></div>
              <p>{{ project.summary }}</p>

              <a
                v-if="project.moreLink"
                :id="`project-more-${project.id}`"
                class="project-more"
                :href="project.moreLink"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="project-more-icon">›</span>
                <span>More +</span>
              </a>
            </div>
          </div>

          <div class="project-media-card media-primary">
            <img :src="currentProjectImage(project, 'left')" :alt="project.title" draggable="false" />
            <div v-if="project.leftImages.length > 1" class="media-controls">
              <button
                :id="`project-left-prev-${project.id}`"
                type="button"
                @click="stepProjectImage(project, 'left', -1)"
              >
                <ChevronLeft :size="20" />
              </button>
              <button
                :id="`project-left-next-${project.id}`"
                type="button"
                @click="stepProjectImage(project, 'left', 1)"
              >
                <ChevronRight :size="20" />
              </button>
            </div>
          </div>

          <div class="project-media-card media-secondary">
            <img
              :src="currentProjectImage(project, 'right')"
              :alt="`${project.title} detail`"
              draggable="false"
            />
            <div v-if="project.rightImages.length > 1" class="media-controls secondary">
              <button
                :id="`project-right-prev-${project.id}`"
                type="button"
                @click="stepProjectImage(project, 'right', -1)"
              >
                <ChevronLeft :size="18" />
              </button>
              <button
                :id="`project-right-next-${project.id}`"
                type="button"
                @click="stepProjectImage(project, 'right', 1)"
              >
                <ChevronRight :size="18" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="case-right-nav" aria-label="Section navigation">
        <button
          v-for="id in progressSegments"
          :id="`project-case-progress-${id}`"
          :key="`progress-${id}`"
          type="button"
          :class="{ active: activeSectionId === id }"
          @click="goToProgress(id)"
        ></button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.project-case-shell {
  --header-offset: 96px;
  --sidebar-width: 184px;
  --navy: #1f2b3f;
  --navy-deep: #152033;
  --accent: #d7000f;
  --accent-dark: #9c0010;
  --gold: #e8d0b4;
  --paper: #f9f7f2;
  --text: #2c2c2c;
  position: relative;
  display: flex;
  width: 100%;
  min-height: calc(100vh - var(--header-offset));
  margin-top: var(--header-offset);
  background:
    radial-gradient(circle at top left, rgba(244, 240, 232, 0.95), rgba(255, 255, 255, 0.98) 48%),
    linear-gradient(180deg, #ffffff, #f5f1ea 90%);
}

.case-nav {
  position: sticky;
  top: var(--header-offset);
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: calc(100vh - var(--header-offset));
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--navy), var(--navy-deep));
  color: var(--gold);
  z-index: 30;
  transition: width 0.45s ease, min-width 0.45s ease;
  box-shadow: 18px 0 44px rgba(15, 21, 34, 0.18);
}

.project-case-shell.collapsed {
  --sidebar-width: 0px;
}

.project-case-shell.collapsed .case-nav > :not(.case-nav-toggle) {
  opacity: 0;
  pointer-events: none;
}

.case-nav-all {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 28px;
  background: linear-gradient(90deg, var(--accent), #c10414 58%, #9c0010 100%);
  color: #fff2e6;
  font-size: 16px;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.case-nav-scroll {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.case-nav-scroll::-webkit-scrollbar {
  width: 0;
}

.case-group {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.case-group-head {
  width: 100%;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0 18px 0 28px;
  text-align: left;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;
}

.case-group.is-active .case-group-head {
  background: linear-gradient(90deg, rgba(215, 0, 15, 0.92), rgba(122, 6, 18, 0.92));
  color: #fff4e8;
}

.case-group-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 237, 219, 0.84);
}

.case-group-body {
  background: linear-gradient(180deg, rgba(215, 0, 15, 0.92), rgba(154, 5, 18, 0.92));
  padding: 14px 0 18px;
}

.case-group-count {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 28px 14px;
  color: rgba(255, 239, 223, 0.84);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.case-group-count span:first-child {
  font-size: 18px;
  color: #fff8f1;
}

.case-item {
  width: calc(100% - 56px);
  margin: 0 28px 14px;
  border: 0;
  background: transparent;
  color: rgba(255, 236, 216, 0.92);
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.3;
  transition: transform 0.25s ease, color 0.25s ease;
}

.case-item:hover,
.case-item.active {
  color: #ffffff;
  transform: translateX(4px);
}

.case-nav-actions {
  height: 80px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 28px;
  background: rgba(9, 17, 30, 0.96);
}

.case-nav-actions button,
.case-nav-toggle {
  border: 0;
  cursor: pointer;
}

.case-nav-actions button {
  background: transparent;
  color: #f6f6f6;
}

.case-nav-toggle {
  position: absolute;
  top: 50%;
  right: -40px;
  width: 40px;
  height: 40px;
  border-radius: 0 12px 12px 0;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(180deg, var(--accent), #b40011);
  box-shadow: 10px 16px 24px rgba(145, 3, 17, 0.22);
}

.case-main {
  position: relative;
  flex: 1;
  min-width: 0;
}

.case-section {
  position: relative;
  min-height: calc(100vh - var(--header-offset));
  scroll-margin-top: var(--header-offset);
}

.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background: linear-gradient(180deg, #102036 0%, #17263a 22%, #f7f4ee 22%, #f6f2eb 100%);
}

.hero-stage {
  position: relative;
  min-height: calc(100vh - var(--header-offset) - 92px);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  align-items: stretch;
}

.hero-media {
  position: relative;
  overflow: hidden;
}

.hero-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(14, 24, 39, 0.08), transparent 40%, rgba(255, 255, 255, 0.08));
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: heroZoom 12s ease-in-out infinite alternate;
}

.hero-image.mobile {
  display: none;
}

.hero-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6vw 5vw;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(249, 246, 240, 0.98)),
    radial-gradient(circle at top left, rgba(224, 218, 206, 0.45), transparent 48%);
}

.hero-copy-inner {
  max-width: 360px;
}

.hero-copy h1,
.project-text-inner h2 {
  margin: 0;
  font-family: 'Times New Roman', Georgia, serif;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #343434;
}

.hero-copy h1 {
  font-size: clamp(42px, 4vw, 62px);
}

.hero-line,
.project-line {
  width: 86px;
  height: 4px;
  margin: 18px 0 22px;
  background: linear-gradient(90deg, var(--accent), #b90010);
}

.hero-copy p {
  margin: 0;
  color: #666;
  font-size: 18px;
  line-height: 1.8;
}

.hero-arrow {
  position: absolute;
  top: 50%;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(215, 0, 15, 0.88);
  color: #fff;
  box-shadow: 0 18px 32px rgba(177, 12, 26, 0.28);
}

.hero-arrow.prev {
  left: 24px;
}

.hero-arrow.next {
  right: 24px;
}

.hero-category-strip {
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 34px;
  overflow-x: auto;
  background: linear-gradient(180deg, rgba(24, 35, 53, 0.98), rgba(13, 23, 38, 0.98));
}

.hero-category-strip::-webkit-scrollbar {
  height: 6px;
}

.hero-category-strip::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
}

.hero-category-pill {
  border: 0;
  padding: 14px 22px;
  white-space: nowrap;
  background: transparent;
  color: rgba(232, 208, 180, 0.92);
  font-size: 15px;
  cursor: pointer;
  transition: color 0.25s ease, background 0.25s ease;
}

.hero-category-pill.active {
  color: #fff;
  background: linear-gradient(90deg, rgba(215, 0, 15, 0.9), rgba(117, 5, 17, 0.9));
}

.project-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36px 44px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 241, 233, 0.98)),
    radial-gradient(circle at top left, rgba(231, 224, 212, 0.45), transparent 44%);
}

.project-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 15% 20%, rgba(219, 210, 196, 0.22), transparent 25%),
    radial-gradient(circle at 85% 78%, rgba(222, 214, 201, 0.2), transparent 28%);
}

.project-layout {
  position: relative;
  z-index: 1;
  width: min(1380px, 100%);
  display: grid;
  grid-template-columns: minmax(280px, 0.44fr) minmax(0, 0.56fr);
  grid-template-areas:
    'text primary'
    'text secondary';
  gap: 22px 30px;
  align-items: center;
}

.project-panel.layout-b .project-layout {
  grid-template-columns: minmax(0, 0.56fr) minmax(280px, 0.44fr);
  grid-template-areas:
    'primary text'
    'secondary text';
}

.project-text-card {
  grid-area: text;
  align-self: stretch;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 28px 60px rgba(24, 34, 53, 0.08);
}

.project-text-inner {
  width: 100%;
  max-width: 410px;
  margin: 0 auto;
  padding: 56px 42px;
}

.project-text-inner h2 {
  font-size: clamp(34px, 3.1vw, 52px);
  text-transform: uppercase;
}

.project-text-inner p {
  margin: 0;
  color: #656565;
  font-size: 18px;
  line-height: 2;
}

.project-more {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  color: #5d5d5d;
  text-decoration: none;
  font-size: 17px;
}

.project-more-icon {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 241, 233, 0.96));
  color: #fff;
  box-shadow: inset 0 0 0 10px rgba(241, 237, 229, 0.95), 0 16px 28px rgba(207, 207, 207, 0.22);
  position: relative;
}

.project-more-icon::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--accent), #bc0010);
  z-index: -1;
}

.project-media-card {
  position: relative;
  overflow: hidden;
  background: #e9e5dd;
  box-shadow: 0 28px 60px rgba(24, 34, 53, 0.12);
}

.project-media-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.media-primary {
  grid-area: primary;
  min-height: 500px;
}

.media-secondary {
  grid-area: secondary;
  justify-self: end;
  width: min(52%, 420px);
  min-height: 260px;
}

.project-panel.layout-b .media-secondary {
  justify-self: start;
}

.media-controls {
  position: absolute;
  inset-inline: 22px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.media-controls.secondary {
  inset-inline: 14px;
}

.media-controls button {
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
  background: rgba(215, 0, 15, 0.84);
  color: #fff;
  box-shadow: 0 16px 28px rgba(190, 22, 36, 0.24);
}

.media-controls.secondary button {
  width: 42px;
  height: 42px;
}

.project-ornament.top {
  position: absolute;
  top: 20%;
  width: 260px;
  height: 32px;
  background: linear-gradient(90deg, var(--accent), #b10212 38%, #7c0715 100%);
  box-shadow: 0 18px 38px rgba(164, 19, 30, 0.18);
}

.project-panel.layout-a .project-ornament.top {
  right: 9%;
}

.project-panel.layout-b .project-ornament.top {
  left: 9%;
}

.case-right-nav {
  position: fixed;
  top: 50%;
  right: 14px;
  transform: translateY(-50%);
  z-index: 20;
  width: 8px;
  padding: 8px 0;
  border-radius: 999px;
  background: rgba(27, 40, 63, 0.18);
  backdrop-filter: blur(10px);
}

.case-right-nav button {
  width: 100%;
  height: 32px;
  border: 0;
  display: block;
  background: transparent;
  cursor: pointer;
  position: relative;
}

.case-right-nav button::after {
  content: '';
  position: absolute;
  left: 1px;
  right: 1px;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: rgba(31, 43, 63, 0.28);
}

.case-right-nav button.active::after {
  background: linear-gradient(180deg, var(--accent), #a90412);
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.28s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 880px;
  opacity: 1;
}

@keyframes heroZoom {
  from {
    transform: scale(1.01);
  }
  to {
    transform: scale(1.08);
  }
}

@media (max-width: 1440px) {
  .project-text-inner {
    padding: 46px 32px;
  }

  .project-text-inner p {
    font-size: 17px;
  }

  .media-primary {
    min-height: 430px;
  }
}

@media (max-width: 1180px) {
  .project-case-shell {
    --header-offset: 88px;
  }

  .hero-stage {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    padding: 34px 24px 40px;
  }

  .project-panel,
  .project-panel.layout-b {
    padding: 24px 18px;
  }

  .project-layout,
  .project-panel.layout-b .project-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'primary'
      'secondary'
      'text';
  }

  .media-secondary,
  .project-panel.layout-b .media-secondary {
    width: min(72%, 420px);
    justify-self: center;
  }

  .project-ornament.top {
    top: 14%;
  }
}

@media (max-width: 1024px) {
  .project-case-shell {
    --sidebar-width: 0px;
  }

  .case-nav {
    position: fixed;
    left: 0;
    top: var(--header-offset);
    width: 260px;
    min-width: 260px;
    transform: translateX(-100%);
    transition: transform 0.35s ease;
  }

  .project-case-shell:not(.collapsed) .case-nav {
    transform: translateX(0);
  }

  .project-case-shell.collapsed .case-nav > :not(.case-nav-toggle) {
    opacity: 1;
    pointer-events: auto;
  }

  .case-nav-toggle {
    right: -52px;
    width: 52px;
    height: 52px;
  }

  .hero-image.desktop {
    display: none;
  }

  .hero-image.mobile {
    display: block;
  }

  .case-right-nav {
    right: 8px;
  }
}

@media (max-width: 768px) {
  .project-case-shell {
    --header-offset: 82px;
  }

  .hero-category-strip {
    min-height: 82px;
    padding: 12px 16px;
  }

  .hero-category-pill {
    padding: 12px 18px;
    font-size: 14px;
  }

  .hero-arrow {
    width: 46px;
    height: 46px;
  }

  .media-primary {
    min-height: 320px;
  }

  .media-secondary,
  .project-panel.layout-b .media-secondary {
    width: min(84%, 340px);
    min-height: 200px;
  }

  .project-text-inner {
    padding: 34px 22px;
  }

  .project-text-inner p {
    font-size: 16px;
    line-height: 1.9;
  }
}
</style>
