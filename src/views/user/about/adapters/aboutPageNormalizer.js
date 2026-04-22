/**
 * aboutPageNormalizer.js
 *
 * Map raw API response từ /public/pages/about thành view model
 * dễ render cho AboutPage.vue.
 */

import { env } from '@/shared/config/env'

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const resolveUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Tìm block theo block_key trong mảng blocks */
const findBlock = (blocks, key) =>
  blocks.find((b) => b.block_key === key) || null

const findSection = (sections, anchor) =>
  (sections || []).find((section) => section?.anchor === anchor) || null

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

/** Lấy URL ảnh ưu tiên từ media asset (upload) rồi mới đến metadata (link cũ) */
const itemImage = (item, metaField = 'src') => {
  if (!item) return ''
  const mediaUrl = item.media?.url || item.image?.url
  if (mediaUrl) return resolveUrl(mediaUrl)

  const meta = itemMeta(item)
  const metaUrl = meta[metaField] || meta.src || meta.image_url || meta.image
  return metaUrl ? resolveUrl(metaUrl) : ''
}

const sectionTitle = (sections, anchor, fallback = '') =>
  findSection(sections, anchor)?.title || fallback

const sectionImage = (sections, anchor) => {
  const section = findSection(sections, anchor)
  const directUrl = section?.image?.url || section?.image_url || ''
  return directUrl ? resolveUrl(directUrl) : ''
}

// ---------------------------------------------------------------------------
// Section normalizers
// ---------------------------------------------------------------------------

function normalizeHero(blocks, banners = []) {
  const headline = findItem(blocks, 'hero_summary', 'headline')
  const description = findItem(blocks, 'hero_summary', 'description')
  // Priority: 1. Banner from Banners module, 2. Item in hero_summary
  let coverImage = ''

  if (banners.length > 0) {
    const banner = banners.find(b => b.banner_type === 'hero') || banners[0]
    coverImage = banner.image?.url || banner.image_url || ''
    if (coverImage && !coverImage.startsWith('http')) {
      coverImage = resolveUrl(coverImage)
    }
  }

  if (!coverImage) {
    const coverItem = findItem(blocks, 'hero_summary', 'cover_image')
    coverImage = itemImage(coverItem)
  }
  
  if (!coverImage) {
    const allHeroItems = blockItems(blocks, 'hero_summary')
    for (const it of allHeroItems) {
      const img = itemImage(it)
      if (img) {
        coverImage = img
        break
      }
    }
  }

  const navItems = blockItems(blocks, 'hero_nav').map((item) => ({
    key: item.item_key,
    title: itemStr(item),
    targetAnchor: itemMeta(item).target_anchor || item.item_key,
  }))

  return {
    headline: itemStr(headline),
    description: itemStr(description, 'content'),
    coverImage,
    navItems,
  }
}

function normalizeCompanyIntroduction(blocks) {
  const block = blocks.find((b) => b.block_key === 'intro_media' || b.block_key === 'intro_paragraphs')
  const coverItem = findItem(blocks, 'intro_media', 'cover_image')
  const videoButtonItem = findItem(blocks, 'intro_video', 'video_button')
  const videoUrlItem = findItem(blocks, 'intro_video', 'video_url')
  const paragraphs = blockItems(blocks, 'intro_paragraphs').map(
    (it) => it.content || it.title || '',
  )

  return {
    title: block?.title || 'Giới thiệu công ty',
    coverImage: itemImage(coverItem),
    videoButtonLabel: itemStr(videoButtonItem) || 'XEM VIDEO +',
    videoUrl: videoUrlItem?.link || '',
    paragraphs,
  }
}

function normalizeChairmanSpeech(blocks) {
  const block = blocks.find((b) => b.block_key === 'speech_profile' || b.block_key === 'speech_body')
  const portraitItem = findItem(blocks, 'speech_profile', 'portrait')
  const speechItems = blockItems(blocks, 'speech_body')
  const speechTexts = speechItems
    .map((it) => it.content || it.title || '')
    .filter(Boolean)
  const visionItem = findItem(blocks, 'speech_body', 'vision')
  const missionItem = findItem(blocks, 'speech_body', 'mission')
  const vision = itemStr(visionItem, 'content') || itemStr(visionItem) || speechTexts[0] || ''
  const mission = itemStr(missionItem, 'content') || itemStr(missionItem) || speechTexts[1] || ''
  const signTitle = findItem(blocks, 'speech_signature', 'sign_title')
  const signName = findItem(blocks, 'speech_signature', 'sign_name')
  const signatureImage = findItem(blocks, 'speech_signature', 'signature_image')

  return {
    title: block?.title || 'Tầm nhìn & Sứ mệnh',
    portrait: itemImage(portraitItem),
    vision,
    mission,
    paragraphs: [vision, mission].filter(Boolean),
    signTitle: itemStr(signTitle),
    signName: itemStr(signName),
    signatureImage: itemImage(signatureImage),
  }
}

function normalizeOrganizationChart(blocks) {
  const block = blocks.find((b) => b.block_key === 'org_chart_image')
  const chartItem = findItem(blocks, 'org_chart_image', 'main_chart')
  return {
    title: block?.title || 'Sơ đồ tổ chức',
    chartImage: itemImage(chartItem),
  }
}

function normalizeCorporateCulture(blocks) {
  const blockDefs = [
    { key: 'culture_values', fallbackTitle: 'Giá trị cốt lõi' },
    { key: 'culture_purpose', fallbackTitle: 'Mục tiêu doanh nghiệp' },
    { key: 'culture_mission', fallbackTitle: 'Sứ mệnh doanh nghiệp' },
    { key: 'culture_spirit', fallbackTitle: 'Tinh thần doanh nghiệp' },
  ]

  const normalized = blockDefs
    .map(({ key, fallbackTitle }) => {
      const block = findBlock(blocks, key)
      const items = blockItems(blocks, key)
        .filter((it) => (it.title || it.content || '').trim() !== '')
        .map((it) => ({
          label: it.title || '',
          text: it.content || '',
        }))

      if (!items.length) return null
      return {
        title: block?.title || fallbackTitle,
        items,
      }
    })
    .filter(Boolean)

  if (normalized.length) return normalized
  return [{ title: 'Giá trị cốt lõi', items: [] }]
}

function normalizeDevelopmentCourse(blocks) {
  const parseTimelineSubtitle = (subtitle) => {
    const raw = String(subtitle || '').trim()
    if (!raw) return { year: '', month: '' }

    const matched = raw.match(/^(\d{4})(?:[-/.](\d{1,2}))?$/)
    if (!matched) return { year: '', month: '' }
    return {
      year: matched[1] || '',
      month: matched[2] ? String(matched[2]).padStart(2, '0') : '',
    }
  }

  const parseYearFromTitle = (title) => {
    const raw = String(title || '').trim()
    const matched = raw.match(/^(\d{4})/)
    return matched?.[1] || ''
  }

  return blockItems(blocks, 'timeline').map((it) => {
    const meta = itemMeta(it)
    const subtitleMeta = parseTimelineSubtitle(it.subtitle)
    const titleYear = parseYearFromTitle(it.title)
    const year = String(meta.year ?? subtitleMeta.year ?? titleYear ?? '').trim()
    const monthRaw = meta.month ?? subtitleMeta.month ?? ''
    return {
      year,
      month: (monthRaw && String(monthRaw).trim() !== '') ? String(monthRaw).padStart(2, '0') : '',
      title: it.title || '',
      image: itemImage(it, 'image_url'),
    }
  })
}



function normalizeLeadershipCare(blocks) {
  return blockItems(blocks, 'leadership_care_gallery').map((it) => {
    const meta = itemMeta(it)
    return {
      name: it.title || '',
      role: it.subtitle || meta.role || meta.position || meta.year || '',
      image: itemImage(it, 'image_url'),
      text: it.title || '',
    }
  })
}

// ---------------------------------------------------------------------------
// Section meta builder (cho navigation dots + tabs)
// ---------------------------------------------------------------------------

const SECTION_CONFIG = [
  { anchor: 'hero', id: 'page1', title: 'Trang chủ', routeSuffix: 'company-introduction', hash: '#page1' },
  { anchor: 'company_introduction', id: 'page2', title: 'Giới thiệu', routeSuffix: 'company-introduction', hash: '#page2' },
  { anchor: 'chairman_speech', id: 'page3', title: 'Tầm nhìn', routeSuffix: 'chairman-speech', hash: '#page3' },
  { anchor: 'organization_chart', id: 'page4', title: 'Sơ đồ tổ chức', routeSuffix: 'organization-chart', hash: '#page4' },
  { anchor: 'corporate_culture', id: 'page5', title: 'Giá trị cốt lõi', routeSuffix: 'corporate-culture', hash: '#page5' },
  { anchor: 'development_course', id: 'page6', title: 'Lịch sử phát triển', routeSuffix: 'development-course', hash: '#page6' },
  { anchor: 'leadership_care', id: 'page7', title: 'Ban lãnh đạo', routeSuffix: 'leadership-care', hash: '#page7' },
]

function buildSectionMeta(sections) {
  return SECTION_CONFIG.map((cfg) => {
    const section = sections.find((s) => s.anchor === cfg.anchor)
    return {
      id: cfg.id,
      title: section?.title || cfg.title,
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
export function normalizeAboutPage(raw, banners = []) {
  if (!raw) {
    return null
  }

  const blocks = raw.blocks || []
  const sections = raw.sections || []

  const sectionMeta = buildSectionMeta(sections)
  const cultureCoverItem = findItem(blocks, 'culture_values', 'cover_image')
  const cultureCoverFallbackItem =
    blockItems(blocks, 'culture_values').find((item) => itemImage(item)) || null

  return {
    // Page meta
    slug: raw.slug || 'about',
    title: raw.title || 'Giới Thiệu',
    metaTitle: raw.meta_title || raw.title || 'Giới Thiệu',
    metaDescription: raw.meta_description || raw.summary || '',

    // Navigation
    sectionMeta,
    aboutTabs: sectionMeta.slice(1),

    // Section data
    hero: normalizeHero(blocks, banners),
    companyIntroduction: normalizeCompanyIntroduction(blocks),
    chairmanSpeech: normalizeChairmanSpeech(blocks),
    organizationChart: normalizeOrganizationChart(blocks),
    cultureBlocks: normalizeCorporateCulture(blocks),
    cultureSection: {
      title: sectionTitle(sections, 'corporate_culture', 'Giá trị cốt lõi'),
      coverImage:
        sectionImage(sections, 'corporate_culture') ||
        itemImage(cultureCoverItem) ||
        itemImage(cultureCoverFallbackItem),
    },
    timelineEntries: normalizeDevelopmentCourse(blocks),
    timelineSectionTitle: sectionTitle(sections, 'development_course', 'Lịch sử phát triển'),
    leadershipItems: normalizeLeadershipCare(blocks),
    leadershipSectionTitle: sectionTitle(sections, 'leadership_care', 'Ban lãnh đạo'),
  }
}
