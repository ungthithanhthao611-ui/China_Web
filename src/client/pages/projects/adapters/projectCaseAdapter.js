import { projectCaseData } from '@/client/pages/projects/projectCaseData'

const FALLBACK_CATEGORY_ID = '1676767239059300352'

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function normalizeCaseItem(rawCase = {}, index = 0) {
  const anchor = String(rawCase.anchor || rawCase.id || `ctn${index + 2}`)
  const leftImages = Array.isArray(rawCase.leftGallery)
    ? rawCase.leftGallery.filter(Boolean)
    : Array.isArray(rawCase.leftImages)
      ? rawCase.leftImages.filter(Boolean)
      : []
  const rightImages = Array.isArray(rawCase.rightGallery)
    ? rawCase.rightGallery.filter(Boolean)
    : Array.isArray(rawCase.rightImages)
      ? rawCase.rightImages.filter(Boolean)
      : []

  return {
    id: anchor,
    title: rawCase.title || '',
    summary: rawCase.summary || '',
    leftImages,
    rightImages,
    moreLink: rawCase.detailHref || rawCase.moreLink || '',
    legacyMoreLink: rawCase.legacyDetailHref || '',
    layoutVariant: rawCase.layoutVariant || '',
  }
}

function normalizeHeroSlide(rawSlide = {}, fallbackCategory = null) {
  const desktopImage = rawSlide.desktopImage || rawSlide.image || ''
  const mobileImage = rawSlide.mobileImage || desktopImage || ''
  const title = rawSlide.title || fallbackCategory?.name || ''

  return {
    id: String(rawSlide.categoryId || fallbackCategory?.id || ''),
    title,
    subtitle: rawSlide.subtitle || '',
    description: rawSlide.summary || rawSlide.description || '',
    images: [desktopImage, mobileImage].filter(Boolean),
  }
}

function buildFallbackState() {
  const fallbackCategories = (projectCaseData.categories || []).map((category) => {
    const normalizedId = String(category.id || '')
    return {
      id: normalizedId,
      name: category.name || '',
      slug: category.slug || normalizeText(category.name || ''),
      projects: Array.isArray(category.projects)
        ? category.projects.map((project, index) => normalizeCaseItem(project, index))
        : [],
    }
  })

  const caseMap = Object.fromEntries(
    fallbackCategories.map((category) => [category.id, category.projects || []])
  )

  return {
    source: 'fallback',
    currentCategoryId: FALLBACK_CATEGORY_ID,
    categories: fallbackCategories.map(({ projects, ...category }) => category),
    heroSlides: (projectCaseData.heroSlides || []).map((slide) => ({
      id: String(
        fallbackCategories.find(
          (category) => normalizeText(category.name) === normalizeText(slide.title)
        )?.id || ''
      ),
      title: slide.title || '',
      subtitle: '',
      description: '',
      images: Array.isArray(slide.images) ? slide.images.filter(Boolean) : [],
    })),
    caseMap,
  }
}

export function adaptProjectCaseResponse(payload) {
  if (!payload || typeof payload !== 'object') {
    return buildFallbackState()
  }

  const categories = Array.isArray(payload.categories) ? payload.categories : []
  if (!categories.length) {
    return buildFallbackState()
  }

  const currentCategoryId = String(payload.currentCategory?.id || categories[0]?.id || FALLBACK_CATEGORY_ID)
  const normalizedCategories = categories.map((category) => ({
    id: String(category.id),
    name: category.name || '',
    slug: category.slug || '',
  }))
  const categoryById = Object.fromEntries(normalizedCategories.map((category) => [category.id, category]))
  const caseMap = {}

  if (Array.isArray(payload.cases) && categoryById[currentCategoryId]) {
    caseMap[currentCategoryId] = payload.cases.map((item, index) => normalizeCaseItem(item, index))
  }

  const heroSlides = (Array.isArray(payload.heroSlides) ? payload.heroSlides : []).map((slide) =>
    normalizeHeroSlide(slide, categoryById[String(slide.categoryId)])
  )

  if (!heroSlides.length) {
    normalizedCategories.forEach((category) => {
      const firstProject = caseMap[category.id]?.[0]
      const images = [
        firstProject?.leftImages?.[0] || firstProject?.rightImages?.[0] || '',
        firstProject?.rightImages?.[0] || firstProject?.leftImages?.[0] || '',
      ].filter(Boolean)

      heroSlides.push({
        id: category.id,
        title: category.name,
        subtitle: '',
        description: '',
        images,
      })
    })
  }

  return {
    source: 'api',
    currentCategoryId: categoryById[currentCategoryId] ? currentCategoryId : normalizedCategories[0].id,
    categories: normalizedCategories,
    heroSlides,
    caseMap,
  }
}

export function resolveCategoryIdFromRouteToken(token, categories) {
  const normalizedToken = String(token || '').trim()
  if (!normalizedToken) {
    return null
  }

  const categoryById = Object.fromEntries((categories || []).map((category) => [String(category.id), category]))
  if (categoryById[normalizedToken]) {
    return normalizedToken
  }

  const normalizedSlug = normalizeText(decodeURIComponent(normalizedToken))
  const matched = (categories || []).find(
    (category) => normalizeText(category.slug || category.name) === normalizedSlug
  )
  return matched ? String(matched.id) : null
}

export { FALLBACK_CATEGORY_ID }
