import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProjectCasePage } from '@/client/services/publicApi'
import { adaptProjectCaseResponse, FALLBACK_CATEGORY_ID, resolveCategoryIdFromRouteToken } from '../adapters/projectCaseAdapter'
import { uiState } from '@/shared/utils/uiState'

export function useProjectCasePage() {
  const route = useRoute()
  const router = useRouter()

  const projectCaseState = ref(adaptProjectCaseResponse(null))
  const loading = ref(false)
  const error = ref(null)
  const hasLoadedApiData = ref(false)

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
  let scrollRequestToken = 0
  const categoryRequestMap = new Map()

  const categoryById = computed(() =>
    Object.fromEntries((projectCaseState.value.categories || []).map((category) => [String(category.id), category]))
  )

  const orderedCategories = computed(() => projectCaseState.value.categories || [])
  const orderedCategoryIndexes = computed(
    () => new Map(orderedCategories.value.map((category, index) => [String(category.id), index]))
  )
  const heroSlides = computed(() => projectCaseState.value.heroSlides || [])
  const sidebarCategories = computed(() =>
    orderedCategories.value.map((category) => ({
      ...category,
      projects: getCategoryCases(category.id),
    }))
  )

  const activeCategory = computed(() => {
    const primary = categoryById.value[String(activeCategoryId.value)]
    if (primary) return primary

    const currentFromApi = categoryById.value[String(projectCaseState.value.currentCategoryId || '')]
    if (currentFromApi) return currentFromApi

    return orderedCategories.value[0] || null
  })

  const activeCategoryIndex = computed(() => orderedCategoryIndexes.value.get(String(activeCategoryId.value)) ?? 0)

  const activeSections = computed(() =>
    getCategoryCases(activeCategory.value?.id).map((project, index) => {
      const layoutVariant = String(project.layoutVariant || '').toLowerCase()
      const pattern = layoutVariant.includes('standard')
        ? 'standard'
        : layoutVariant.includes('feature')
          ? 'feature'
          : index % 2 === 0
            ? 'feature'
            : 'standard'

      return {
        ...project,
        pattern,
        pageClass: `page-${index + 2}`,
      }
    })
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

  function getRouteCategoryToken() {
    const rawCategory = Array.isArray(route.params.category) ? route.params.category[0] : route.params.category
    const rawLegacyCategory = Array.isArray(route.params.categoryId) ? route.params.categoryId[0] : route.params.categoryId
    return String(rawLegacyCategory || rawCategory || '').trim()
  }

  function buildCategoryPath(categoryId) {
    const normalizedCategoryId = String(categoryId || '').trim()
    if (route.path.startsWith('/project_list/')) {
      return `/project_list/${normalizedCategoryId}.html`
    }
    return `/projects/${normalizedCategoryId}`
  }

  function getCategoryCases(categoryId) {
    const normalizedCategoryId = String(categoryId || '').trim()
    if (!normalizedCategoryId) return []

    const cachedCases = projectCaseState.value.caseMap?.[normalizedCategoryId]
    return Array.isArray(cachedCases) ? cachedCases : []
  }

  function hasLoadedCategoryCases(categoryId) {
    const normalizedCategoryId = String(categoryId || '').trim()
    return Boolean(normalizedCategoryId) && Array.isArray(projectCaseState.value.caseMap?.[normalizedCategoryId])
  }

  function mergeProjectCaseState(nextState) {
    const previousState = projectCaseState.value || adaptProjectCaseResponse(null)
    const mergedCaseMap = {
      ...(previousState.caseMap || {}),
      ...(nextState.caseMap || {}),
    }

    projectCaseState.value = {
      ...nextState,
      categories: nextState.categories || [],
      caseMap: mergedCaseMap,
    }
    hasLoadedApiData.value = nextState.source === 'api'
  }

  async function loadProjectCaseData(requestedCategoryId = null) {
    loading.value = true
    error.value = null

    try {
      const payload = await getProjectCasePage(requestedCategoryId)
      const adapted = adaptProjectCaseResponse(payload)
      mergeProjectCaseState(adapted)
      return adapted
    } catch (err) {
      error.value = err?.message || 'Failed to load project case data.'
      if (!hasLoadedApiData.value) {
        projectCaseState.value = adaptProjectCaseResponse(null)
      }
      return projectCaseState.value
    } finally {
      loading.value = false
    }
  }

  async function ensureCategoryCasesLoaded(categoryId) {
    const normalizedCategoryId = String(categoryId || '').trim()
    if (!normalizedCategoryId) return projectCaseState.value
    if (hasLoadedCategoryCases(normalizedCategoryId)) return projectCaseState.value

    const existingRequest = categoryRequestMap.get(normalizedCategoryId)
    if (existingRequest) {
      return existingRequest
    }

    const request = loadProjectCaseData(normalizedCategoryId)
      .finally(() => {
        categoryRequestMap.delete(normalizedCategoryId)
      })

    categoryRequestMap.set(normalizedCategoryId, request)
    return request
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
      ['keywords', `China Decor, project case, ${title}`],
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
    const categoryId = String(activeCategoryId.value || '').trim()
    if (!categoryId) return

    router.replace({
      path: buildCategoryPath(categoryId),
      hash: sectionId && sectionId !== 'hero' ? `#${sectionId}` : '',
    })
  }

  function scrollToSection(sectionId, behavior = 'smooth') {
    if (sectionId === 'hero') {
      window.scrollTo({
        top: 0,
        behavior,
      })
      return true
    }

    const target = sectionRefs.get(sectionId)
    if (!target?.isConnected) return false

    const top = window.scrollY + target.getBoundingClientRect().top

    window.scrollTo({
      top,
      behavior,
    })
    return true
  }

  function scheduleSectionScroll(sectionId, behavior = 'smooth', attempt = 0) {
    const normalizedSectionId = String(sectionId || 'hero').trim() || 'hero'
    const requestToken = ++scrollRequestToken

    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = 0
    }

    nextTick(() => {
      if (requestToken !== scrollRequestToken) return

      const didScroll = scrollToSection(normalizedSectionId, behavior)
      if (didScroll || attempt >= 18) {
        return
      }

      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0
        if (requestToken !== scrollRequestToken) return
        scheduleSectionScroll(normalizedSectionId, behavior, attempt + 1)
      })
    })
  }

  function revealSection(sectionId) {
    if (visibleSectionIds.value.has(sectionId)) return
    visibleSectionIds.value = new Set([...visibleSectionIds.value, sectionId])
  }

  function setActiveCategory(categoryId, options = {}) {
    const normalizedCategoryId = String(categoryId || '').trim()
    const fallbackCategoryId = String(orderedCategories.value[0]?.id || FALLBACK_CATEGORY_ID)
    const finalCategoryId = categoryById.value[normalizedCategoryId] ? normalizedCategoryId : fallbackCategoryId

    if (!categoryById.value[finalCategoryId]) return

    const {
      scrollTo = 'hero',
      updateUrl = true,
      syncSwiper = true,
      behavior = 'auto',
    } = options

    activeCategoryId.value = finalCategoryId
    activeSectionId.value = scrollTo
    visibleSectionIds.value = new Set(['hero', scrollTo].filter(Boolean))
    ensureExpanded(finalCategoryId)
    updateSeo()

    if (updateUrl) {
      updateRoute(scrollTo)
    }

    nextTick(() => {
      if (syncSwiper) {
        syncHeroSwipers()
      }
      scheduleSectionScroll(scrollTo, behavior)
    })
  }

  async function syncFromRoute() {
    const routeCategoryToken = getRouteCategoryToken()
    const routeCategoryId = /^\d+$/.test(routeCategoryToken) ? routeCategoryToken : null
    const shouldReload =
      !hasLoadedApiData.value ||
      (routeCategoryId && String(projectCaseState.value.currentCategoryId || '') !== routeCategoryId)

    if (shouldReload) {
      await loadProjectCaseData(routeCategoryId)
    }

    const resolvedRouteCategoryId = resolveCategoryIdFromRouteToken(
      routeCategoryToken,
      orderedCategories.value
    ) || routeCategoryId || String(projectCaseState.value.currentCategoryId || '') || String(orderedCategories.value[0]?.id || FALLBACK_CATEGORY_ID)

    if (
      resolvedRouteCategoryId &&
      /^\d+$/.test(resolvedRouteCategoryId) &&
      String(projectCaseState.value.currentCategoryId || '') !== resolvedRouteCategoryId
    ) {
      await loadProjectCaseData(resolvedRouteCategoryId)
    }

    await ensureCategoryCasesLoaded(resolvedRouteCategoryId)

    const sectionId = route.hash?.replace('#', '') || 'hero'
    setActiveCategory(resolvedRouteCategoryId, {
      scrollTo: sectionId,
      updateUrl: false,
      behavior: 'auto',
    })
  }

  async function openAllCategories() {
    const targetCategoryId = String(orderedCategories.value[0]?.id || FALLBACK_CATEGORY_ID)
    await ensureCategoryCasesLoaded(targetCategoryId)
    setActiveCategory(targetCategoryId, {
      scrollTo: 'hero',
      updateUrl: true,
      behavior: 'smooth',
    })
    closeSidebarOnMobile()
  }

  async function openCategory(categoryId) {
    const targetCategoryId = String(categoryId || '').trim()
    if (!targetCategoryId) return

    await ensureCategoryCasesLoaded(targetCategoryId)
    setActiveCategory(targetCategoryId, {
      scrollTo: 'hero',
      updateUrl: true,
      behavior: 'smooth',
    })
    closeSidebarOnMobile()
  }

  async function openProject(categoryId, projectId) {
    const targetCategoryId = String(categoryId || '').trim()
    const targetProjectId = String(projectId || '').trim()
    if (!targetCategoryId || !targetProjectId) return

    await ensureCategoryCasesLoaded(targetCategoryId)

    if (String(activeCategoryId.value) !== targetCategoryId) {
      setActiveCategory(targetCategoryId, {
        scrollTo: targetProjectId,
        updateUrl: true,
        behavior: 'smooth',
      })
      closeSidebarOnMobile()
      return
    }

    activeSectionId.value = targetProjectId
    revealSection(targetProjectId)
    updateRoute(targetProjectId)
    scheduleSectionScroll(targetProjectId)
    closeSidebarOnMobile()
  }

  async function handleHeroSlideChange(index) {
    const slide = heroSlides.value[index]
    if (!slide || String(slide.id) === String(activeCategoryId.value)) return

    await ensureCategoryCasesLoaded(String(slide.id))
    setActiveCategory(String(slide.id), {
      scrollTo: 'hero',
      updateUrl: true,
      syncSwiper: false,
      behavior: 'smooth',
    })
  }

  function goToProgress(sectionId) {
    activeSectionId.value = sectionId
    revealSection(sectionId)
    updateRoute(sectionId)
    scheduleSectionScroll(sectionId)
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
        threshold: 0.18,
      }
    )

    sectionRefs.forEach((element) => revealObserver.observe(element))
  }

  function handleResize() {
    if (isMobileViewport()) {
      sidebarOpen.value = false
      return
    }

    sidebarOpen.value = activeSectionId.value !== 'hero'
  }

  watch(
    () => [route.params.category, route.params.categoryId],
    () => {
      syncFromRoute()
    }
  )

  watch(
    () => route.hash,
    (hash) => {
      const sectionId = hash?.replace('#', '') || 'hero'
      activeSectionId.value = sectionId
      revealSection(sectionId)
      scheduleSectionScroll(sectionId, 'auto')
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

  onMounted(async () => {
    sidebarOpen.value = false
    uiState.isNavHidden = false
    uiState.isHeaderHidden = false
    uiState.isHeaderHovered = false
    uiState.isFooterHidden = true

    await syncFromRoute()

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
    sidebarCategories,
    heroSlides,
    activeSections,
    progressSections,
    progressPercentage,
    expandedCategoryIds,
    visibleSectionIds,
    loading,
    error,
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
    handleScrollerScroll,
  }
}



