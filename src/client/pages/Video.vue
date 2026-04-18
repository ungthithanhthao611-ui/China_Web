<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Home, Play, Search, X } from 'lucide-vue-next'

import { getVideos } from '@/client/services/publicApi'
import { env } from '@/config/env'

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const HERO_IMAGE = 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4dc003a0-985d-4082-a4df-e3f89a455661.jpg'
const FALLBACK_THUMBNAIL = 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4dc003a0-985d-4082-a4df-e3f89a455661.jpg'
const PAGE_SIZE = 6

const LEGACY_DURATION_BY_TITLE = {
  'yangzhou welcome hotel': 176,
  'ye chun': 124,
  'building 18, phase 4 of the state guest house': 132,
  'hirayama banquet': 109,
  'fun garden plus': 118,
  'huaiyang cuisine museum': 121,
}

const searchTerm = ref('')
const currentPage = ref(1)
const loading = ref(false)
const errorMessage = ref('')
const videos = ref([])
const activeVideo = ref(null)
const metaDescriptionTag = ref(null)

const heroTabs = [
  { name: 'Business areas', path: '/business-areas#ctn1' },
  { name: 'Project Case', path: '/project-case' },
  { name: 'Video', path: '/video', active: true },
]

const resolveAssetUrl = (url) => {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized)) return normalized
  return `${API_ORIGIN}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

const normalizeTitleKey = (title) => String(title || '').trim().toLowerCase().replace(/\s+/g, ' ')

const isDirectVideoFile = (url) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(url || '').trim())

const getEmbedInfo = (url) => {
  const normalized = String(url || '').trim()
  if (!normalized) return { type: 'unknown', embedUrl: '' }

  if (isDirectVideoFile(normalized)) {
    return { type: 'file', embedUrl: resolveAssetUrl(normalized) }
  }

  try {
    const parsed = new URL(normalized)
    const host = parsed.hostname.replace(/^www\./i, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return { type: 'youtube', embedUrl: id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '' }
    }

    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop()
      return { type: 'youtube', embedUrl: id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '' }
    }

    if (host.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return { type: 'vimeo', embedUrl: id ? `https://player.vimeo.com/video/${id}?autoplay=1` : '' }
    }

    return { type: 'external', embedUrl: normalized }
  } catch {
    return { type: 'unknown', embedUrl: '' }
  }
}

const formatDurationBadge = (seconds) => {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return ''

  const mins = Math.trunc(total / 60)
  const secs = total % 60
  return `${mins}'${String(secs).padStart(2, '0')}"`
}

const normalizeVideo = (item = {}) => {
  const sourceUrl = resolveAssetUrl(item.video_url || item.video || '')
  const thumbnail = resolveAssetUrl(item.thumbnail?.url || item.thumbnail_url || item.image || '')
  const embed = getEmbedInfo(sourceUrl)

  const explicitDuration = Number(item.duration || item.duration_seconds || item.length_seconds || 0)
  const fallbackDuration = LEGACY_DURATION_BY_TITLE[normalizeTitleKey(item.title)] || 0
  const duration = Number.isFinite(explicitDuration) && explicitDuration > 0 ? explicitDuration : fallbackDuration

  return {
    id: item.id,
    title: item.title || 'Untitled video',
    description: item.description || '',
    image: thumbnail || FALLBACK_THUMBNAIL,
    video: sourceUrl,
    duration,
    durationLabel: formatDurationBadge(duration),
    embedType: embed.type,
    embedUrl: embed.embedUrl,
    isDirectFile: embed.type === 'file',
    sortOrder: Number(item.sort_order || 0),
    languageId: Number(item.language_id || 0),
  }
}

const filteredVideos = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  if (!keyword) return videos.value

  return videos.value.filter((video) => {
    const title = String(video.title || '').toLowerCase()
    const desc = String(video.description || '').toLowerCase()
    return title.includes(keyword) || desc.includes(keyword)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVideos.value.length / PAGE_SIZE)))

const pagedVideos = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredVideos.value.slice(start, start + PAGE_SIZE)
})

const gallerySlots = computed(() => ({
  hero: pagedVideos.value[0] || null,
  sideTop: pagedVideos.value[1] || null,
  sideBottom: pagedVideos.value[2] || null,
  bottom: pagedVideos.value.slice(3, 6),
}))
const sideCards = computed(() => [gallerySlots.value.sideTop, gallerySlots.value.sideBottom].filter(Boolean))

const hasVideos = computed(() => filteredVideos.value.length > 0)

function openVideo(video) {
  activeVideo.value = video || null
}

function closeVideo() {
  activeVideo.value = null
}

function goPrev() {
  if (currentPage.value > 1) currentPage.value -= 1
}

function goNext() {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

function setSeoMeta() {
  document.title = 'China Decor | Video'

  let tag = document.querySelector("meta[name='description']")
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', 'China Decor video gallery.')
  metaDescriptionTag.value = tag
}

async function loadVideos() {
  loading.value = true
  errorMessage.value = ''

  try {
    const languageCodes = [...new Set([env.languageCode, 'en', 'zh', 'vi'].filter(Boolean))]
    const merged = new Map()

    await Promise.all(languageCodes.map(async (code) => {
      try {
        const response = await getVideos({ language_code: code })
        const items = Array.isArray(response?.items) ? response.items : []
        items.forEach((item) => {
          if (!merged.has(item.id)) {
            merged.set(item.id, item)
          }
        })
      } catch {
        // Skip single-language fetch errors so page can still render remaining datasets.
      }
    }))

    const normalized = Array.from(merged.values())
      .map(normalizeVideo)
      .filter((item) => item.video)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
        return Number(b.id || 0) - Number(a.id || 0)
      })

    videos.value = normalized
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load videos.'
    videos.value = []
  } finally {
    loading.value = false
  }
}

watch(searchTerm, () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

watch(activeVideo, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
})

onMounted(async () => {
  setSeoMeta()
  await loadVideos()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  if (metaDescriptionTag.value) {
    metaDescriptionTag.value.setAttribute('content', 'China Decor official website.')
  }
})
</script>

<template>
  <div class="video-page">
    <section class="video-hero">
      <img class="video-hero__image" :src="HERO_IMAGE" alt="Video hero" />
      <div class="video-hero__overlay"></div>
      <div class="video-hero__title-wrap container">
        <h1>VIDEO</h1>
      </div>

      <div class="video-hero__tabs-wrap">
        <div class="video-hero__tabs container">
          <router-link
            v-for="tab in heroTabs"
            :key="tab.name"
            :to="tab.path"
            class="video-hero__tab"
            :class="{ 'is-active': tab.active }"
          >
            {{ tab.name }}
          </router-link>
        </div>
      </div>
    </section>

    <section class="video-content">
      <div class="video-content__bg"></div>
      <div class="video-content__inner container">
        <nav class="video-breadcrumb" aria-label="Breadcrumb">
          <router-link to="/">
            <Home :size="14" />
            <span>Home</span>
          </router-link>
          <span>›</span>
          <router-link to="/business-areas#ctn1">Business presentation</router-link>
          <span>›</span>
          <span class="is-active">Video</span>
        </nav>

        <header class="video-header">
          <h2>Video</h2>
          <div class="video-header__line"></div>
        </header>

        <div class="video-search">
          <Search :size="18" />
          <input v-model="searchTerm" type="text" placeholder="Search" />
        </div>

        <div v-if="loading" class="video-empty">Loading videos...</div>
        <div v-else-if="errorMessage" class="video-empty video-empty--error">{{ errorMessage }}</div>
        <div v-else-if="!hasVideos" class="video-empty">No videos found.</div>

        <div v-else class="video-gallery">
          <div class="video-gallery__top">
            <button
              v-if="gallerySlots.hero"
              type="button"
              class="video-card video-card--hero"
              @click="openVideo(gallerySlots.hero)"
            >
              <img :src="gallerySlots.hero.image" :alt="gallerySlots.hero.title" />
              <span v-if="gallerySlots.hero.durationLabel" class="video-card__duration">{{ gallerySlots.hero.durationLabel }}</span>
              <span class="video-card__play"><Play :size="16" fill="currentColor" /></span>
              <span class="video-card__title">{{ gallerySlots.hero.title }}</span>
            </button>

            <div class="video-gallery__side">
              <button
                v-for="slot in sideCards"
                :key="slot.id"
                type="button"
                class="video-card video-card--side"
                @click="openVideo(slot)"
              >
                <img :src="slot.image" :alt="slot.title" />
                <span v-if="slot.durationLabel" class="video-card__duration">{{ slot.durationLabel }}</span>
                <span class="video-card__play"><Play :size="14" fill="currentColor" /></span>
                <span class="video-card__title">{{ slot.title }}</span>
              </button>
            </div>
          </div>

          <div class="video-gallery__bottom" v-if="gallerySlots.bottom.length">
            <button
              v-for="video in gallerySlots.bottom"
              :key="video.id"
              type="button"
              class="video-card video-card--bottom"
              @click="openVideo(video)"
            >
              <img :src="video.image" :alt="video.title" />
              <span v-if="video.durationLabel" class="video-card__duration">{{ video.durationLabel }}</span>
              <span class="video-card__play"><Play :size="14" fill="currentColor" /></span>
              <span class="video-card__title">{{ video.title }}</span>
            </button>
          </div>
        </div>

        <div v-if="totalPages > 0" class="video-pagination">
          <button type="button" :disabled="currentPage <= 1" @click="goPrev">
            <ChevronLeft :size="16" />
            <span>prev</span>
          </button>
          <span class="video-pagination__current">{{ currentPage }}</span>
          <button type="button" :disabled="currentPage >= totalPages" @click="goNext">
            <span>next</span>
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>
    </section>

    <transition name="video-modal-fade">
      <div v-if="activeVideo" class="video-modal" @click.self="closeVideo">
        <div class="video-modal__dialog">
          <button type="button" class="video-modal__close" @click="closeVideo">
            <X :size="20" />
          </button>

          <video
            v-if="activeVideo.isDirectFile"
            :src="activeVideo.video"
            controls
            autoplay
            playsinline
            preload="metadata"
          ></video>

          <iframe
            v-else-if="activeVideo.embedUrl"
            :src="activeVideo.embedUrl"
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>

          <a
            v-else
            class="video-modal__link"
            :href="activeVideo.video"
            target="_blank"
            rel="noreferrer noopener"
          >
            Open video source
          </a>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.video-page {
  background: #f2f3f5;
}

.video-hero {
  position: relative;
  min-height: 640px;
  overflow: hidden;
}

.video-hero__image {
  width: 100%;
  height: 100%;
  min-height: 640px;
  object-fit: cover;
  display: block;
}

.video-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 33, 57, 0.45) 0%, rgba(10, 23, 43, 0.25) 38%, rgba(9, 24, 43, 0.54) 100%);
}

.video-hero__title-wrap {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-40%);
  z-index: 2;
}

.video-hero__title-wrap h1 {
  margin: 0;
  color: #ffffff;
  font-size: 52px;
  letter-spacing: 1px;
  font-family: 'Times New Roman', serif;
  text-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
}

.video-hero__tabs-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: rgba(11, 26, 47, 0.8);
}

.video-hero__tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.video-hero__tab {
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e7edf6;
  font-size: 34px;
  font-family: 'Times New Roman', serif;
  border-right: 1px solid rgba(255, 255, 255, 0.18);
}

.video-hero__tab:last-child {
  border-right: 0;
}

.video-hero__tab.is-active {
  background: #ec0a15;
  color: #ffffff;
}

.video-content {
  position: relative;
}

.video-content__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(130% 90% at 12% 18%, rgba(255, 255, 255, 0.8) 0%, rgba(235, 236, 239, 0) 55%),
    radial-gradient(100% 80% at 90% 5%, rgba(255, 255, 255, 0.78) 0%, rgba(233, 236, 240, 0) 62%),
    linear-gradient(180deg, #f7f7f8 0%, #f1f2f4 100%);
}

.video-content__inner {
  position: relative;
  z-index: 1;
  padding: 34px 0 72px;
}

.video-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #707787;
  font-size: 16px;
}

.video-breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #707787;
}

.video-breadcrumb .is-active {
  color: #de1e2f;
}

.video-header {
  margin-top: 34px;
  text-align: center;
}

.video-header h2 {
  margin: 0;
  font-size: 68px;
  color: #17243a;
  font-family: 'Times New Roman', serif;
}

.video-header__line {
  width: min(520px, 100%);
  height: 2px;
  background: #cf2e3d;
  margin: 16px auto 0;
  position: relative;
}

.video-header__line::before,
.video-header__line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cf2e3d;
  transform: translateY(-50%);
}

.video-header__line::before {
  left: -3px;
}

.video-header__line::after {
  right: -3px;
}

.video-search {
  margin-top: 28px;
  min-height: 66px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-radius: 8px;
  background: #ececed;
  border: 1px solid #d6d7dc;
}

.video-search :deep(svg) {
  color: #8f95a3;
  flex-shrink: 0;
}

.video-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 20px;
  color: #1d2a3e;
}

.video-gallery {
  margin-top: 26px;
}

.video-gallery__top {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.video-gallery__side {
  display: grid;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.video-gallery__bottom {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.video-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  padding: 0;
  border: 0;
  background: #dfe1e7;
  color: #ffffff;
  cursor: pointer;
}

.video-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.video-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 22, 38, 0.08) 0%, rgba(12, 22, 38, 0.08) 55%, rgba(9, 17, 31, 0.76) 100%);
}

.video-card:hover img {
  transform: scale(1.04);
}

.video-card--hero {
  min-height: 470px;
}

.video-card--side {
  min-height: 226px;
}

.video-card--bottom {
  min-height: 186px;
}

.video-card__duration {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(96, 103, 115, 0.92);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
}

.video-card__play {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 2;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3b7ef1;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.video-card__title {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 2;
  width: calc(100% - 84px);
  text-align: center;
  font-size: 22px;
  letter-spacing: 1px;
  font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
}

.video-pagination {
  margin-top: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.video-pagination button {
  min-height: 36px;
  min-width: 88px;
  border-radius: 999px;
  border: 1px solid #d0d2da;
  background: #ececef;
  color: #707787;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.video-pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.video-pagination__current {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ec0a15;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.video-empty {
  margin-top: 22px;
  min-height: 120px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px dashed #c8ccd7;
  color: #5f6777;
  background: #f3f4f7;
}

.video-empty--error {
  color: #9f2b46;
}

.video-modal {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(5, 10, 18, 0.86);
}

.video-modal__dialog {
  position: relative;
  width: min(960px, calc(100vw - 24px));
}

.video-modal__dialog video,
.video-modal__dialog iframe,
.video-modal__link {
  width: 100%;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: #000;
  aspect-ratio: 16 / 9;
}

.video-modal__link {
  display: grid;
  place-items: center;
  color: #8ad4ff;
  background: #0d1c33;
}

.video-modal__close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 0;
  background: #ffffff;
  color: #1d2a3e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.video-modal-fade-enter-active,
.video-modal-fade-leave-active {
  transition: opacity 0.22s ease;
}

.video-modal-fade-enter-from,
.video-modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .video-hero {
    min-height: 420px;
  }

  .video-hero__image {
    min-height: 420px;
  }

  .video-hero__tab {
    font-size: 24px;
    min-height: 66px;
  }

  .video-header h2 {
    font-size: 46px;
  }
}

@media (max-width: 900px) {
  .video-gallery__top,
  .video-gallery__bottom {
    grid-template-columns: 1fr;
  }

  .video-gallery__side {
    grid-template-rows: none;
    grid-template-columns: 1fr;
  }

  .video-card--hero,
  .video-card--side,
  .video-card--bottom {
    min-height: 220px;
  }

  .video-hero__tabs {
    grid-template-columns: 1fr;
  }

  .video-hero__tab {
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  }

  .video-hero__tab:last-child {
    border-bottom: 0;
  }
}
</style>
