/**
 * aboutPageNormalizer.js
 *
 * Map raw API response từ /public/pages/about thành view model
 * dễ render cho AboutPage.vue.
 *
 * Nguyên tắc:
 * - FE không render raw blocks/items trực tiếp
 * - Mọi field đều có fallback an toàn ([], '', null)
 * - Giữ shape tương thích 100% với template cũ
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tìm block theo block_key trong mảng blocks */
const findBlock = (blocks, key) =>
  blocks.find((b) => b.block_key === key) || null

/** Lấy tất cả items của 1 block, đã sort theo sort_order */
const blockItems = (blocks, key) => {
  const block = findBlock(blocks, key)
  if (!block?.items?.length) return []
  return [...block.items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

/** Lấy 1 item cụ thể theo item_key trong block */
const findItem = (blocks, blockKey, itemKey) => {
  const items = blockItems(blocks, blockKey)
  return items.find((it) => it.item_key === itemKey) || null
}

/** Lấy string an toàn từ item */
const itemStr = (item, field = 'title') => (item ? item[field] || '' : '')

/** Lấy metadata_json an toàn */
const itemMeta = (item) => (item?.metadata_json ? item.metadata_json : {})

// ---------------------------------------------------------------------------
// Section normalizers
// ---------------------------------------------------------------------------

function normalizeHero(blocks) {
  const headline = findItem(blocks, 'hero_summary', 'headline')
  const description = findItem(blocks, 'hero_summary', 'description')
  const navItems = blockItems(blocks, 'hero_nav').map((item) => ({
    key: item.item_key,
    title: itemStr(item),
    targetAnchor: itemMeta(item).target_anchor || item.item_key,
  }))

  return {
    headline: itemStr(headline),
    description: itemStr(description, 'content'),
    navItems,
  }
}

function normalizeCompanyIntroduction(blocks) {
  const coverItem = findItem(blocks, 'intro_media', 'cover_image')
  const videoButtonItem = findItem(blocks, 'intro_video', 'video_button')
  const videoUrlItem = findItem(blocks, 'intro_video', 'video_url')
  const paragraphs = blockItems(blocks, 'intro_paragraphs').map(
    (it) => it.content || it.title || '',
  )

  return {
    coverImage: itemMeta(coverItem).src || '',
    videoButtonLabel: itemStr(videoButtonItem) || 'VIDEO +',
    videoUrl: videoUrlItem?.link || '',
    paragraphs,
  }
}

function normalizeChairmanSpeech(blocks) {
  const portraitItem = findItem(blocks, 'speech_profile', 'portrait')
  const paragraphs = blockItems(blocks, 'speech_body').map(
    (it) => it.content || it.title || '',
  )
  const signTitle = findItem(blocks, 'speech_signature', 'sign_title')
  const signName = findItem(blocks, 'speech_signature', 'sign_name')
  const signatureImage = findItem(blocks, 'speech_signature', 'signature_image')

  return {
    portrait: itemMeta(portraitItem).src || '',
    paragraphs,
    signTitle: itemStr(signTitle),
    signName: itemStr(signName),
    signatureImage: itemMeta(signatureImage).src || '',
  }
}

function normalizeOrganizationChart(blocks) {
  const chartItem = findItem(blocks, 'org_chart_image', 'main_chart')
  return {
    chartImage: itemMeta(chartItem).src || '',
  }
}

function normalizeCorporateCulture(blocks) {
  const mapBlock = (key) =>
    blockItems(blocks, key).map((it) => ({
      label: itemStr(it),
      text: it.content || '',
    }))

  const block = (key) => findBlock(blocks, key)

  return [
    { title: block('culture_purpose')?.title || 'Corporate Purpose', items: mapBlock('culture_purpose') },
    { title: block('culture_mission')?.title || 'Corporate Mission', items: mapBlock('culture_mission') },
    { title: block('culture_spirit')?.title || 'Enterprise Spirit', items: mapBlock('culture_spirit') },
    { title: block('culture_values')?.title || 'Value', items: mapBlock('culture_values') },
  ]
}

function normalizeDevelopmentCourse(blocks) {
  return blockItems(blocks, 'timeline').map((it) => {
    const meta = itemMeta(it)
    return {
      year: String(meta.year ?? ''),
      month: String(meta.month ?? '').padStart(2, '0'),
      title: it.title || '',
      image: meta.image_url || '',
    }
  })
}

function normalizeLeadershipCare(blocks) {
  return blockItems(blocks, 'leadership_care_gallery').map((it) => {
    const meta = itemMeta(it)
    return {
      year: meta.year || '',
      image: meta.image_url || '',
      text: it.title || '',
    }
  })
}

function normalizeCooperativePartner(blocks) {
  // Categories
  const categoryItems = blockItems(blocks, 'partner_categories')
  const categories = categoryItems.map((it) => ({
    key: it.item_key,
    name: itemStr(it),
  }))

  // Logos grouped by category
  const logoItems = blockItems(blocks, 'partner_logos')

  // Build partnerCategories array giống format cũ
  const partnerCategories = categories.map((cat) => ({
    key: cat.key,
    name: cat.name,
    logos: logoItems
      .filter((it) => itemMeta(it).category === cat.key)
      .map((it) => ({
        href: it.link || itemMeta(it).website || '#',
        image: itemMeta(it).image_url || '',
      })),
  }))

  return {
    categories,
    partnerCategories,
  }
}

// ---------------------------------------------------------------------------
// Section meta builder (cho navigation dots + tabs)
// ---------------------------------------------------------------------------

const SECTION_CONFIG = [
  { anchor: 'hero', id: 'page1', routeSuffix: 'company-introduction', hash: '#page1' },
  { anchor: 'company_introduction', id: 'page2', routeSuffix: 'company-introduction', hash: '#page2' },
  { anchor: 'chairman_speech', id: 'page3', routeSuffix: 'chairman-speech', hash: '#page3' },
  { anchor: 'organization_chart', id: 'page4', routeSuffix: 'organization-chart', hash: '#page4' },
  { anchor: 'corporate_culture', id: 'page5', routeSuffix: 'corporate-culture', hash: '#page5' },
  { anchor: 'development_course', id: 'page6', routeSuffix: 'development-course', hash: '#page6' },
  { anchor: 'leadership_care', id: 'page7', routeSuffix: 'leadership-care', hash: '#page7' },
  { anchor: 'cooperative_partner', id: 'page8', routeSuffix: 'cooperative-partner', hash: '#page8' },
]

function buildSectionMeta(sections) {
  return SECTION_CONFIG.map((cfg) => {
    const section = sections.find((s) => s.anchor === cfg.anchor)
    return {
      id: cfg.id,
      title: section?.title || cfg.anchor.replace(/_/g, ' '),
      route: `/about/${cfg.routeSuffix}`,
      hash: cfg.hash,
    }
  })
}

// ---------------------------------------------------------------------------
// Main normalizer
// ---------------------------------------------------------------------------

/**
 * @param {object} raw - Raw API response từ /public/pages/about
 * @returns {object} View model cho AboutPage.vue
 */
export function normalizeAboutPage(raw) {
  if (!raw) {
    return null
  }

  const blocks = raw.blocks || []
  const sections = raw.sections || []

  const sectionMeta = buildSectionMeta(sections)

  return {
    // Page meta
    slug: raw.slug || 'about',
    title: raw.title || 'About Us',
    metaTitle: raw.meta_title || raw.title || 'About Us',
    metaDescription: raw.meta_description || raw.summary || '',

    // Navigation
    sectionMeta,
    aboutTabs: sectionMeta.slice(1),

    // Section data
    hero: normalizeHero(blocks),
    companyIntroduction: normalizeCompanyIntroduction(blocks),
    chairmanSpeech: normalizeChairmanSpeech(blocks),
    organizationChart: normalizeOrganizationChart(blocks),
    cultureBlocks: normalizeCorporateCulture(blocks),
    timelineEntries: normalizeDevelopmentCourse(blocks),
    leadershipItems: normalizeLeadershipCare(blocks),
    partnerCategories: normalizeCooperativePartner(blocks).partnerCategories,
  }
}
