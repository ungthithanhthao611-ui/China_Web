import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { uiState } from '@/utils/uiState'
import { projectCaseData } from '../projectCaseData'

const FALLBACK_CATEGORY_ID = '1676767239059300352'
const CATEGORY_ORDER = [
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

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

export function useProjectCasePage() {
  const route = useRoute()
  const router = useRouter()

  const scrollerRef = ref(null)
  const sidebarOpen = ref(false)
  const activeCategoryId = ref(FALLBACK_CATEGORY_ID)
  const activeSectionId = ref('hero')
  const expandedCategoryIds = ref([FALLBACK_CATEGORY_ID])
  const visibleSectionIds = ref(new Set(['hero']))
  const hasAutoOpenedSidebar = ref(false)

  const heroSwiperRef = ref(null)
  const thumbsSwiperRef = ref(null)
  const sectionRefs = new Map()

  let revealObserver = null
  let scrollFrame = 0

  const categoryById = computed(() =>
    Object.fromEntries(projectCaseData.categories.map((category) => [category.id, category]))
  )

  const orderedCategories = computed(() => {
    const ordered = CATEGORY_ORDER.map((id) => categoryById.value[id]).filter(Boolean)
    const remaining = projectCaseData.categories.filter((category) => !CATEGORY_ORDER.includes(category.id))
    return [...ordered, ...remaining]
  })

  const orderedCategoryIndexes = computed(
    () => new Map(orderedCategories.value.map((category, index) => [category.id, index]))
  )

  const activeCategory = computed(
    () => categoryById.value[activeCategoryId.value] || categoryById.value[FALLBACK_CATEGORY_ID]
  )

  const heroSlides = computed(() =>
    orderedCategories.value.map((category) => {
      const source =
        projectCaseData.heroSlides.find(
          (slide) => normalizeText(slide.title) === normalizeText(category.name)
        ) || {}

      const firstProject = category.projects?.[0]
      const fallbackImages = [
        firstProject?.leftImages?.[0] || firstProject?.rightImages?.[0] || '',
        firstProject?.rightImages?.[0] || firstProject?.leftImages?.[0] || ''
      ].filter(Boolean)

      return {
        id: category.id,
        title: category.name,
        subtitle: '',
        description: '',
        images: source.images?.length ? source.images : fallbackImages
      }
    })
  )

  const activeCategoryIndex = computed(() => orderedCategoryIndexes.value.get(activeCategoryId.value) ?? 0)

  const activeSections = computed(() =>
    (activeCategory.value?.projects || []).map((project, index) => ({
      ...project,
      pattern: index % 2 === 0 ? 'feature' : 'standard',
      pageClass: `page-${index + 2}`
    }))
  )

  const progressSections = computed(() => ['hero', ...activeSections.value.map((project) => project.id)])
  const progressPercentage = computed(() => {
    const total = progressSections.value.length || 1
    const index = Math.max(progressSections.value.indexOf(activeSectionId.value), 0)
    return ((index + 1) / total) * 100
  })

  function isMobileViewport() {
    return typeof window !== 'undefined' && window.innerWidth <= 1024
  }

  function isExpanded(categoryId) {
    return expandedCategoryIds.value.includes(categoryId)
  }

  function ensureExpanded(categoryId) {
    if (!isExpanded(categoryId)) {
      expandedCategoryIds.value = [...expandedCategoryIds.value, categoryId]
    }
  }

  function toggleCategory(categoryId) {
    if (isExpanded(categoryId)) {
      expandedCategoryIds.value = expandedCategoryIds.value.filter((id) => id !== categoryId)
      return
    }

    ensureExpanded(categoryId)
  }

  function setSectionRef(sectionId, element) {
    if (element) {
      sectionRefs.set(sectionId, element)
      return
    }

    sectionRefs.delete(sectionId)
  }

  function registerHeroSwiper(instance) {
    heroSwiperRef.value = instance
  }

  function registerThumbsSwiper(instance) {
    thumbsSwiperRef.value = instance
  }

  function updateSeo() {
    const title = activeCategory.value?.name || 'Project Case'
    document.title = `${title}_China Decor`

    const metaPairs = [
      ['description', `Project case showcase for ${title} on China Decor.`],
      ['keywords', `China Decor, project case, ${title}`]
    ]

    metaPairs.forEach(([name, content]) => {
      let tag = document.head.querySelector(`meta[name="${name}"]`)

      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }

      tag.setAttribute('content', content)
    })
  }

  function closeSidebarOnMobile() {
    if (isMobileViewport()) {
      sidebarOpen.value = false
    }
  }

  function syncHeroSwipers() {
    const index = activeCategoryIndex.value

    if (heroSwiperRef.value && heroSwiperRef.value.activeIndex !== index) {
      heroSwiperRef.value.slideTo(index)
    }

    if (thumbsSwiperRef.value) {
      thumbsSwiperRef.value.slideTo(index)
    }
  }

  function updateRoute(sectionId = 'hero') {
    router.replace({
      path: `/projects/${activeCategoryId.value}`,
      hash: sectionId && sectionId !== 'hero' ? `#${sectionId}` : ''
    })
  }

  function scrollToSection(sectionId, behavior = 'smooth') {
    const target = sectionRefs.get(sectionId)

    if (!target) return

    const top = window.scrollY + target.getBoundingClientRect().top

    window.scrollTo({
      top,
      behavior
    })
  }

  function revealSection(sectionId) {
    if (visibleSectionIds.value.has(sectionId)) return
    visibleSectionIds.value = new Set([...visibleSectionIds.value, sectionId])
  }

  function resolveCategoryFromRoute() {
    const raw = Array.isArray(route.params.category) ? route.params.category[0] : route.params.category

    if (!raw) return FALLBACK_CATEGORY_ID
    if (categoryById.value[raw]) return raw

    const normalized = normalizeText(decodeURIComponent(raw))
    const matched = orderedCategories.value.find((category) => normalizeText(category.name) === normalized)

    return matched?.id || FALLBACK_CATEGORY_ID
  }

  function setActiveCategory(categoryId, options = {}) {
    if (!categoryById.value[categoryId]) return

    const {
      scrollTo = 'hero',
      updateUrl = true,
      syncSwiper = true,
      behavior = 'auto'
    } = options

    activeCategoryId.value = categoryId
    activeSectionId.value = scrollTo
    visibleSectionIds.value = new Set(['hero', scrollTo].filter(Boolean))
    ensureExpanded(categoryId)
    updateSeo()

    if (updateUrl) {
      updateRoute(scrollTo)
    }

    nextTick(() => {
      if (syncSwiper) {
        syncHeroSwipers()
      }

      scrollToSection(scrollTo, behavior)
    })
  }

  function openAllCategories() {
    setActiveCategory(FALLBACK_CATEGORY_ID, {
      scrollTo: 'hero',
      updateUrl: true,
      behavior: 'smooth'
    })
    closeSidebarOnMobile()
  }

  function openCategory(categoryId) {
    setActiveCategory(categoryId, {
      scrollTo: 'hero',
      updateUrl: true,
      behavior: 'smooth'
    })
    closeSidebarOnMobile()
  }

  function openProject(categoryId, projectId) {
    if (activeCategoryId.value !== categoryId) {
      setActiveCategory(categoryId, {
        scrollTo: projectId,
        updateUrl: true,
        behavior: 'smooth'
      })
      closeSidebarOnMobile()
      return
    }

    activeSectionId.value = projectId
    revealSection(projectId)
    updateRoute(projectId)
    nextTick(() => scrollToSection(projectId))
    closeSidebarOnMobile()
  }

  function handleHeroSlideChange(index) {
    const slide = heroSlides.value[index]
    if (!slide || slide.id === activeCategoryId.value) return

    setActiveCategory(slide.id, {
      scrollTo: 'hero',
      updateUrl: true,
      syncSwiper: false,
      behavior: 'smooth'
    })
  }

  function goToProgress(sectionId) {
    activeSectionId.value = sectionId
    revealSection(sectionId)
    updateRoute(sectionId)
    nextTick(() => scrollToSection(sectionId))
  }

  function refreshActiveSection() {
    if (!sectionRefs.size) return

    const marker = window.innerHeight * 0.45
    let closestSection = 'hero'
    let closestDistance = Number.POSITIVE_INFINITY

    for (const [sectionId, element] of sectionRefs.entries()) {
      const distance = Math.abs(element.getBoundingClientRect().top - marker)

      if (distance < closestDistance) {
        closestDistance = distance
        closestSection = sectionId
      }
    }

    activeSectionId.value = closestSection
    revealSection(closestSection)
  }

  function handleScrollerScroll() {
    if (scrollFrame) return

    scrollFrame = window.requestAnimationFrame(() => {
      refreshActiveSection()
      scrollFrame = 0
    })
  }

  function reconnectRevealObserver() {
    revealObserver?.disconnect()

    if (typeof IntersectionObserver === 'undefined') return

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealSection(entry.target.dataset.sectionId)
          }
        })
      },
      {
        root: null,
        threshold: 0.18
      }
    )

    sectionRefs.forEach((element) => revealObserver.observe(element))
  }

  function syncFromRoute() {
    const categoryId = resolveCategoryFromRoute()
    const sectionId = route.hash?.replace('#', '') || 'hero'

    setActiveCategory(categoryId, {
      scrollTo: sectionId,
      updateUrl: false,
      behavior: 'auto'
    })
  }

  function handleResize() {
    if (isMobileViewport()) {
      sidebarOpen.value = false
      return
    }

    sidebarOpen.value = activeSectionId.value !== 'hero'
  }

  watch(
    () => route.fullPath,
    () => {
      syncFromRoute()
    }
  )

  watch(
    activeSections,
    async () => {
      await nextTick()
      reconnectRevealObserver()
      refreshActiveSection()
    },
    { deep: true }
  )

  watch(
    activeSectionId,
    (value) => {
      const isHero = value === 'hero'
      uiState.isHeaderHidden = !isHero
      uiState.isHeaderHovered = false

      if (isMobileViewport()) {
        sidebarOpen.value = false
        return
      }

      if (isHero) {
        sidebarOpen.value = false
        return
      }

      if (!hasAutoOpenedSidebar.value) {
        sidebarOpen.value = true
        hasAutoOpenedSidebar.value = true
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    sidebarOpen.value = false
    uiState.isNavHidden = false
    uiState.isHeaderHidden = false
    uiState.isHeaderHovered = false
    uiState.isFooterHidden = true

    syncFromRoute()

    nextTick(() => {
      reconnectRevealObserver()
      refreshActiveSection()
    })

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleScrollerScroll, { passive: true })
  })

  onBeforeUnmount(() => {
    revealObserver?.disconnect()

    if (scrollFrame) {
      window.cancelAnimationFrame(scrollFrame)
    }

    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScrollerScroll)

    uiState.isNavHidden = false
    uiState.isHeaderHidden = false
    uiState.isHeaderHovered = false
    uiState.isFooterHidden = false
  })

  return {
    FALLBACK_CATEGORY_ID,
    scrollerRef,
    sidebarOpen,
    activeCategoryId,
    activeCategory,
    activeCategoryIndex,
    activeSectionId,
    orderedCategories,
    heroSlides,
    activeSections,
    progressSections,
    progressPercentage,
    expandedCategoryIds,
    visibleSectionIds,
    registerHeroSwiper,
    registerThumbsSwiper,
    handleHeroSlideChange,
    setSectionRef,
    isExpanded,
    toggleCategory,
    openAllCategories,
    openCategory,
    openProject,
    goToProgress,
    handleScrollerScroll
  }
}
