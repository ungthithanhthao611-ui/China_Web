<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Play, Search, ChevronLeft, ChevronRight, Home, Sparkles, Clapperboard, MonitorPlay, X } from 'lucide-vue-next'

import { getVideos } from '@/client/services/publicApi'
import { env } from '@/config/env'

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const FALLBACK_THUMBNAIL =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4dc003a0-985d-4082-a4df-e3f89a455661.jpg'
const HERO_IMAGE =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4dc003a0-985d-4082-a4df-e3f89a455661.jpg'
const pageSize = 6

const searchTerm = ref('')
const currentPage = ref(1)
const activeVideo = ref(null)
const hoverPreviewId = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const videos = ref([])
const previewVideoRefs = ref({})
const metaDescriptionTag = ref(null)

const heroTabs = [
  { name: 'Business areas', path: '/business-areas#ctn1' },
  { name: 'Project Case', path: '/project-case' },
  { name: 'Video', path: '/video', active: true },
]

const heroHighlights = [
  {
    icon: Sparkles,
    label: 'Premium Showcase',
    value: 'Brand stories & signature project films',
  },
  {
    icon: Clapperboard,
    label: 'Managed Assets',
    value: 'Cloudinary thumbnails with continuously improved playback delivery',
  },
  {
    icon: MonitorPlay,
    label: 'Instant Preview',
    value: 'Hover to preview direct-hosted clips before opening',
  },
]

const resolveAssetUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

const formatDuration = (seconds) => {
  const normalizedSeconds = Number(seconds)

  if (!Number.isFinite(normalizedSeconds) || normalizedSeconds <= 0) {
    return ''
  }

  const hours = Math.trunc(normalizedSeconds / 3600)
  const minutes = Math.trunc((normalizedSeconds % 3600) / 60)
  const remain = normalizedSeconds % 60

  if (hours > 0) {
    return [hours, minutes, remain].map((part) => String(part).padStart(2, '0')).join(':')
  }

  return [minutes, remain].map((part) => String(part).padStart(2, '0')).join(':')
}

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
      const videoId = parsed.pathname.split('/').filter(Boolean)[0]
      return {
        type: 'youtube',
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : '',
      }
    }

    if (host.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).pop()
      return {
        type: 'youtube',
        embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : '',
      }
    }

    if (host.includes('vimeo.com')) {
      const videoId = parsed.pathname.split('/').filter(Boolean).pop()
      return {
        type: 'vimeo',
        embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : '',
      }
    }
  } catch {
    return { type: 'unknown', embedUrl: '' }
  }

  return { type: 'external', embedUrl: normalized }
}

const normalizeVideo = (item = {}) => {
  const sourceUrl = resolveAssetUrl(item.video_url || item.video || '')
  const embed = getEmbedInfo(sourceUrl)
  const thumbnailUrl = resolveAssetUrl(item.thumbnail?.url || item.thumbnail_url || item.image || '')
  const normalizedDuration = Number(item.duration || item.duration_seconds || item.length_seconds || 0)
  const videoSourceLabel = sourceUrl.includes('res.cloudinary.com')
    ? 'Cloudinary CDN'
    : sourceUrl.includes('sinodecor.com')
      ? 'Original source'
      : embed.type === 'file'
        ? 'Direct source'
        : 'External source'

  return {
    id: item.id,
    title: item.title || 'Untitled video',
    description: item.description || 'Khám phá thêm nội dung video nổi bật của China Decor.',
    duration: Number.isFinite(normalizedDuration) ? normalizedDuration : 0,
    image: thumbnailUrl || FALLBACK_THUMBNAIL,
    video: sourceUrl,
    thumbnail: item.thumbnail || null,
    thumbnailSourceLabel: thumbnailUrl.includes('res.cloudinary.com') ? 'Cloudinary image' : 'Original image',
    status: item.status || 'published',
    isDirectFile: embed.type === 'file',
    embedType: embed.type,
    embedUrl: embed.embedUrl,
    videoSourceLabel,
    isCloudinaryVideo: sourceUrl.includes('res.cloudinary.com'),
  }
}

const filteredVideos = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  if (!keyword) {
    return videos.value
  }

  return videos.value.filter((item) => {
    const title = String(item.title || '').toLowerCase()
    const description = String(item.description || '').toLowerCase()
    return title.includes(keyword) || description.includes(keyword)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVideos.value.length / pageSize)))

const pagedVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredVideos.value.slice(start, start + pageSize)
})

const hasVideos = computed(() => videos.value.length > 0)
const featuredVideo = computed(() => videos.value[0] || null)
const totalVideosLabel = computed(() => `${videos.value.length}`.padStart(2, '0'))
const directPreviewCount = computed(() => videos.value.filter((item) => item.isDirectFile).length)

function setSeoMeta() {
  document.title = 'Premium Video Gallery | China Decor'

  let tag = document.querySelector("meta[name='description']")
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', 'description')
    document.head.appendChild(tag)
  }

  tag.setAttribute(
    'content',
    'Explore the premium China Decor video gallery featuring brand stories, project showcases, and curated visual presentations with modern playback and search experience.',
  )

  metaDescriptionTag.value = tag
}

async function loadVideos() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getVideos()
    const items = Array.isArray(response?.items) ? response.items : []
    videos.value = items.map(normalizeVideo).filter((item) => item.video)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load videos from server.'
    videos.value = []
  } finally {
    loading.value = false
  }
}

function setPreviewVideoRef(id, element) {
  if (!id) return

  if (element) {
    previewVideoRefs.value[id] = element
  } else {
    delete previewVideoRefs.value[id]
  }
}

async function startHoverPreview(video) {
  if (!video?.isDirectFile) return
  hoverPreviewId.value = video.id

  const player = previewVideoRefs.value[video.id]
  if (!player) return

  try {
    player.currentTime = 0
    await player.play()
  } catch {
    // Ignore autoplay restrictions for preview.
  }
}

function stopHoverPreview(video) {
  if (!video?.isDirectFile) return
  if (hoverPreviewId.value === video.id) {
    hoverPreviewId.value = null
  }

  const player = previewVideoRefs.value[video.id]
  if (!player) return

  player.pause()
  player.currentTime = 0
}

watch(searchTerm, () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

watch(activeVideo, (video) => {
  document.body.style.overflow = video ? 'hidden' : ''
})

const openVideo = (video) => {
  activeVideo.value = video
}

const closeVideo = () => {
  activeVideo.value = null
}

const goPrev = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const goNext = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

onMounted(async () => {
  setSeoMeta()
  await loadVideos()
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  if (metaDescriptionTag.value) {
    metaDescriptionTag.value.setAttribute(
      'content',
      'China Decor official website.',
    )
  }
})
</script>

<template>
  <div class="video-page">
    <section class="video-hero">
      <div class="video-hero__media">
        <img :src="HERO_IMAGE" alt="China Decor premium video hero" />
      </div>
      <div class="video-hero__overlay"></div>
      <div class="video-hero__glow video-hero__glow--one"></div>
      <div class="video-hero__glow video-hero__glow--two"></div>

      <div class="video-hero__content container">
        <div class="video-hero__copy" data-aos="fade-up" data-aos-duration="900">
          <span class="video-hero__eyebrow">Premium video library</span>
          <h1 id="video-page-title">A cinematic archive of China Decor stories, projects, and brand moments.</h1>
          <p class="video-hero__description">
            Explore a curated collection of project showcases, brand narratives, and presentation films with a more immersive search,
            preview, and playback experience.
          </p>

          <div class="video-hero__actions">
            <a id="video-hero-browse-button" class="video-hero__cta video-hero__cta--primary" href="#video-gallery-section">
              Browse gallery
            </a>
            <button
              id="video-hero-featured-button"
              type="button"
              class="video-hero__cta video-hero__cta--secondary"
              :disabled="!featuredVideo"
              @click="featuredVideo && openVideo(featuredVideo)"
            >
              <Play :size="16" fill="currentColor" />
              <span>Watch featured</span>
            </button>
          </div>

          <div class="video-hero__stats">
            <article>
              <strong>{{ totalVideosLabel }}</strong>
              <span>Published videos</span>
            </article>
            <article>
              <strong>{{ String(directPreviewCount).padStart(2, '0') }}</strong>
              <span>Instant hover previews</span>
            </article>
            <article>
              <strong>{{ featuredVideo ? 'Live' : 'Soon' }}</strong>
              <span>Premium playback overlay</span>
            </article>
          </div>
        </div>

        <div class="video-hero__spotlight" data-aos="fade-left" data-aos-duration="950">
          <article class="spotlight-card">
            <div class="spotlight-card__media">
              <img :src="featuredVideo?.image || FALLBACK_THUMBNAIL" :alt="featuredVideo?.title || 'Featured video'" />
              <button
                id="video-hero-spotlight-play"
                type="button"
                class="spotlight-card__play"
                :disabled="!featuredVideo"
                @click="featuredVideo && openVideo(featuredVideo)"
              >
                <Play :size="20" fill="currentColor" />
              </button>
            </div>
            <div class="spotlight-card__body">
              <span class="spotlight-card__badge">Featured release</span>
              <h2>{{ featuredVideo?.title || 'Video showcase is updating' }}</h2>
              <p>
                {{
                  featuredVideo?.description ||
                  'The newest published video from the CMS will appear here automatically with premium playback.'
                }}
              </p>
              <div class="spotlight-card__meta">
                <span>{{ featuredVideo?.duration ? formatDuration(featuredVideo.duration) : 'Fresh update' }}</span>
                <span>{{ featuredVideo?.videoSourceLabel || 'Playback ready' }}</span>
                <span>{{ featuredVideo?.thumbnailSourceLabel || 'Premium artwork' }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="video-hero__highlights container">
        <article v-for="item in heroHighlights" :key="item.label" class="video-highlight-card">
          <component :is="item.icon" :size="18" />
          <div>
            <strong>{{ item.label }}</strong>
            <p>{{ item.value }}</p>
          </div>
        </article>
      </div>

      <div class="video-hero__tabs">
        <div class="video-hero__tabs-inner container">
          <router-link
            v-for="tab in heroTabs"
            :id="`video-hero-tab-${tab.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`"
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

    <section id="video-gallery-section" class="video-content">
      <div class="video-content__bg"></div>
      <div class="video-content__inner container">
        <nav class="video-breadcrumb" aria-label="Breadcrumb" data-aos="fade-up" data-aos-duration="700">
          <router-link id="video-breadcrumb-home" to="/">
            <Home :size="14" />
            <span>Home</span>
          </router-link>
          <span class="video-breadcrumb__sep">›</span>
          <router-link id="video-breadcrumb-business" to="/business-areas#ctn1">Business presentation</router-link>
          <span class="video-breadcrumb__sep">›</span>
          <span class="video-breadcrumb__current">Video</span>
        </nav>

        <header class="video-heading" data-aos="fade-up" data-aos-duration="900">
          <span class="video-heading__eyebrow">Curated collection</span>
          <h2>Discover our premium video gallery</h2>
          <p>
            Search by title or description, preview direct-hosted clips on hover, and open each item in a richer video overlay.
          </p>
        </header>

        <section class="video-toolbar" data-aos="fade-up" data-aos-delay="80" data-aos-duration="900">
          <div class="video-search">
            <Search :size="18" />
            <input
              id="video-search-input"
              v-model="searchTerm"
              type="text"
              placeholder="Search video title or teaser"
            />
          </div>

          <div class="video-toolbar__meta">
            <span>{{ filteredVideos.length }} result{{ filteredVideos.length === 1 ? '' : 's' }}</span>
            <span>{{ totalPages }} page{{ totalPages === 1 ? '' : 's' }}</span>
          </div>
        </section>

        <div v-if="loading" class="video-empty" data-aos="fade-up">
          <p>Loading videos...</p>
        </div>

        <div v-else-if="errorMessage" class="video-empty video-empty--error" data-aos="fade-up">
          <p>{{ errorMessage }}</p>
        </div>

        <div v-else-if="pagedVideos.length" class="video-list">
          <div class="video-grid">
            <article
              v-for="(video, index) in pagedVideos"
              :id="`video-card-${video.id}`"
              :key="video.id"
              class="video-card"
              :class="{
                'is-featured': index === 0,
                'is-compact': index > 0,
              }"
              :data-aos="'fade-up'"
              :data-aos-delay="index * 70"
              @mouseenter="startHoverPreview(video)"
              @mouseleave="stopHoverPreview(video)"
            >
              <button
                :id="`video-card-open-${video.id}`"
                type="button"
                class="video-card__button"
                :aria-label="`Open ${video.title}`"
                @click="openVideo(video)"
              >
                <div class="video-card__media">
                  <img
                    v-if="!video.isDirectFile || hoverPreviewId !== video.id"
                    :src="video.image"
                    :alt="video.title"
                    class="video-card__poster"
                  />
                  <video
                    v-else
                    :ref="(element) => setPreviewVideoRef(video.id, element)"
                    class="video-card__preview"
                    :src="video.video"
                    muted
                    playsinline
                    loop
                    preload="metadata"
                  ></video>
                  <div class="video-card__veil"></div>
                  <span v-if="video.duration" class="video-card__duration">{{ formatDuration(video.duration) }}</span>
                  <span class="video-card__tag">{{ video.isDirectFile ? 'Hover preview' : 'Open overlay' }}</span>
                  <span class="video-card__play">
                    <Play :size="20" fill="currentColor" />
                  </span>
                </div>

                <div class="video-card__body">
                  <h3>{{ video.title }}</h3>
                  <p>{{ video.description }}</p>
                  <div class="video-card__footer">
                    <span>{{ video.videoSourceLabel }}</span>
                    <span>{{ video.thumbnailSourceLabel }}</span>
                    <span>{{ video.isCloudinaryVideo ? 'CDN optimized' : 'Source linked' }}</span>
                  </div>
                </div>
              </button>
            </article>
          </div>

          <div v-if="totalPages > 1" class="video-pagination" data-aos="fade-up" data-aos-delay="120">
            <button
              id="video-pagination-prev"
              type="button"
              class="video-pagination__btn"
              :disabled="currentPage === 1"
              @click="goPrev"
            >
              <ChevronLeft :size="14" />
              <span>Prev</span>
            </button>

            <button
              v-for="page in totalPages"
              :id="`video-pagination-page-${page}`"
              :key="page"
              type="button"
              class="video-pagination__page"
              :class="{ 'is-active': page === currentPage }"
              @click="currentPage = page"
            >
              {{ page }}
            </button>

            <button
              id="video-pagination-next"
              type="button"
              class="video-pagination__btn"
              :disabled="currentPage === totalPages"
              @click="goNext"
            >
              <span>Next</span>
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <div v-else class="video-empty" data-aos="fade-up">
          <p>
            {{
              hasVideos
                ? 'No matching videos found.'
                : 'No published videos available yet.'
            }}
          </p>
        </div>
      </div>
    </section>

    <transition name="video-modal-fade">
      <div
        v-if="activeVideo"
        id="video-modal-overlay"
        class="video-modal"
        @click.self="closeVideo"
      >
        <div class="video-modal__dialog">
          <button
            id="video-modal-close"
            type="button"
            class="video-modal__close"
            aria-label="Close video"
            @click="closeVideo"
          >
            <X :size="18" />
          </button>

          <div class="video-modal__content">
            <div class="video-modal__player">
              <video
                v-if="activeVideo.embedType === 'file'"
                :src="activeVideo.video"
                controls
                autoplay
                playsinline
                preload="auto"
              ></video>

              <iframe
                v-else-if="activeVideo.embedUrl"
                :src="activeVideo.embedUrl"
                :title="activeVideo.title"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowfullscreen
              ></iframe>

              <div v-else class="video-modal__fallback">
                <p>Video source preview is unavailable.</p>
                <a :href="activeVideo.video" target="_blank" rel="noreferrer noopener">Open source in new tab</a>
              </div>
            </div>

            <aside class="video-modal__sidebar">
              <span class="video-modal__badge">Now playing</span>
              <h3>{{ activeVideo.title }}</h3>
              <p>{{ activeVideo.description }}</p>
              <div class="video-modal__facts">
                <span>{{ activeVideo.duration ? formatDuration(activeVideo.duration) : 'Featured clip' }}</span>
                <span>{{ activeVideo.videoSourceLabel }}</span>
                <span>{{ activeVideo.thumbnailSourceLabel }}</span>
              </div>
              <a
                id="video-modal-open-source"
                class="video-modal__link"
                :href="activeVideo.video"
                target="_blank"
                rel="noreferrer noopener"
              >
                Open original video source
              </a>
            </aside>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/scss/variables' as *;

.video-page {
  background:
    radial-gradient(circle at top, rgba(72, 117, 255, 0.12), transparent 30%),
    linear-gradient(180deg, #07111f 0%, #0a1325 18%, #f6f8fc 18%, #f6f8fc 100%);
}

.video-hero {
  position: relative;
  min-height: 100vh;
  color: #ffffff;
  overflow: hidden;
}

.video-hero__media,
.video-hero__media img,
.video-hero__overlay,
.video-hero__glow {
  position: absolute;
  inset: 0;
}

.video-hero__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.04);
  animation: heroSlowZoom 10s ease-out forwards;
}

.video-hero__overlay {
  background:
    linear-gradient(180deg, rgba(4, 11, 24, 0.72) 0%, rgba(4, 11, 24, 0.36) 35%, rgba(4, 11, 24, 0.74) 100%),
    linear-gradient(120deg, rgba(68, 110, 255, 0.24), rgba(109, 232, 255, 0.06));
}

.video-hero__glow {
  pointer-events: none;
  filter: blur(16px);
}

.video-hero__glow--one {
  background: radial-gradient(circle at 20% 25%, rgba(102, 123, 255, 0.38), transparent 18%);
}

.video-hero__glow--two {
  background: radial-gradient(circle at 78% 30%, rgba(75, 220, 255, 0.22), transparent 16%);
}

.video-hero__content {
  position: relative;
  z-index: 2;
  min-height: calc(100vh - 120px);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
  gap: 40px;
  align-items: center;
  padding-top: 120px;
  padding-bottom: 160px;
}

.video-hero__copy {
  max-width: 700px;
}

.video-hero__eyebrow,
.video-heading__eyebrow,
.spotlight-card__badge,
.video-modal__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.88);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.video-hero__copy h1 {
  margin: 20px 0 18px;
  max-width: 12ch;
  font-size: clamp(2.8rem, 2.2rem + 2.3vw, 5rem);
  line-height: 0.96;
  letter-spacing: -0.03em;
}

.video-hero__description {
  max-width: 620px;
  margin: 0;
  color: rgba(233, 240, 255, 0.82);
  font-size: 1.05rem;
  line-height: 1.75;
}

.video-hero__actions,
.video-hero__stats,
.video-hero__tabs-inner,
.video-pagination,
.video-card__footer,
.video-toolbar {
  display: flex;
  align-items: center;
}

.video-hero__actions {
  gap: 14px;
  margin-top: 28px;
  flex-wrap: wrap;
}

.video-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 20px;
  border-radius: 16px;
  font-weight: 700;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease,
    background-color 0.3s ease;
}

.video-hero__cta:hover:not(:disabled) {
  transform: translateY(-2px);
}

.video-hero__cta--primary {
  background: linear-gradient(135deg, #7f7cff, #44d3ff);
  color: #06111d;
  box-shadow: 0 18px 40px rgba(83, 149, 255, 0.3);
}

.video-hero__cta--secondary {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  backdrop-filter: blur(16px);
}

.video-hero__stats {
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 30px;
}

.video-hero__stats article,
.video-highlight-card,
.spotlight-card,
.video-card,
.video-search,
.video-toolbar__meta,
.video-empty,
.video-modal__sidebar {
  backdrop-filter: blur(16px);
}

.video-hero__stats article {
  min-width: 160px;
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(8, 17, 34, 0.48);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.16);
}

.video-hero__stats strong {
  display: block;
  font-size: 1.6rem;
  line-height: 1;
}

.video-hero__stats span {
  display: block;
  margin-top: 6px;
  color: rgba(234, 239, 255, 0.72);
  font-size: 0.92rem;
}

.video-hero__spotlight {
  display: flex;
  justify-content: flex-end;
}

.spotlight-card {
  position: relative;
  overflow: hidden;
  width: min(100%, 460px);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(12, 23, 45, 0.82), rgba(8, 16, 32, 0.94));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
}

.spotlight-card__media {
  position: relative;
  aspect-ratio: 16 / 10;
}

.spotlight-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight-card__media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 17, 31, 0) 10%, rgba(7, 17, 31, 0.88) 100%);
}

.spotlight-card__play {
  position: absolute;
  inset: auto auto 20px 20px;
  z-index: 1;
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #7f7cff, #44d3ff);
  color: #04101c;
  box-shadow: 0 16px 36px rgba(77, 160, 255, 0.34);
}

.spotlight-card__body {
  padding: 22px;
}

.spotlight-card__badge,
.video-modal__badge {
  background: rgba(127, 124, 255, 0.16);
  border-color: rgba(127, 124, 255, 0.32);
  color: #d9dcff;
}

.spotlight-card__body h2,
.video-modal__sidebar h3,
.video-card__body h3,
.video-heading h2 {
  margin: 12px 0 10px;
}

.spotlight-card__body h2 {
  font-size: 1.45rem;
  line-height: 1.28;
}

.spotlight-card__body p,
.video-modal__sidebar p,
.video-card__body p,
.video-heading p {
  margin: 0;
  line-height: 1.7;
}

.spotlight-card__body p {
  color: rgba(227, 233, 244, 0.78);
}

.spotlight-card__meta,
.video-modal__facts {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.spotlight-card__meta span,
.video-modal__facts span,
.video-card__footer span,
.video-toolbar__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
}

.spotlight-card__meta span,
.video-modal__facts span {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(231, 238, 248, 0.8);
}

.video-hero__highlights {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: -120px;
  margin-bottom: 48px;
}

.video-highlight-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(10, 21, 40, 0.74);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #f3f7ff;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.18);
}

.video-highlight-card :deep(svg) {
  flex-shrink: 0;
  color: #67d0ff;
}

.video-highlight-card strong {
  display: block;
  margin-bottom: 4px;
}

.video-highlight-card p {
  margin: 0;
  color: rgba(230, 236, 246, 0.72);
  font-size: 0.92rem;
  line-height: 1.55;
}

.video-hero__tabs {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  background: rgba(8, 16, 31, 0.76);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
}

.video-hero__tabs-inner {
  justify-content: stretch;
}

.video-hero__tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 66px;
  color: rgba(227, 234, 245, 0.72);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.video-hero__tab:last-child {
  border-right: 0;
}

.video-hero__tab:hover,
.video-hero__tab.is-active {
  color: #ffffff;
  background: rgba(127, 124, 255, 0.18);
}

.video-content {
  position: relative;
  overflow: hidden;
}

.video-content__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 10%, rgba(87, 129, 255, 0.12), transparent 16%),
    radial-gradient(circle at 90% 12%, rgba(78, 210, 255, 0.12), transparent 18%),
    linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.72) 12%, #f6f8fc 100%);
  pointer-events: none;
}

.video-content__inner {
  position: relative;
  z-index: 1;
  padding-top: 46px;
  padding-bottom: 96px;
}

.video-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #6b7890;
  font-size: 14px;
}

.video-breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6b7890;
}

.video-breadcrumb a:hover,
.video-breadcrumb__current {
  color: #4355ff;
}

.video-heading {
  max-width: 700px;
  margin-top: 30px;
}

.video-heading__eyebrow {
  background: rgba(67, 85, 255, 0.08);
  border-color: rgba(67, 85, 255, 0.18);
  color: #4355ff;
}

.video-heading h2 {
  color: #0d1728;
  font-size: clamp(2rem, 1.8rem + 0.9vw, 3.1rem);
  line-height: 1.08;
}

.video-heading p {
  margin-top: 12px;
  color: #60708a;
  max-width: 620px;
}

.video-toolbar {
  justify-content: space-between;
  gap: 18px;
  margin-top: 30px;
  margin-bottom: 34px;
  flex-wrap: wrap;
}

.video-search {
  flex: 1;
  min-width: min(100%, 320px);
  gap: 12px;
  min-height: 62px;
  padding: 0 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(154, 171, 196, 0.28);
  box-shadow: 0 18px 50px rgba(16, 30, 58, 0.08);
}

.video-search:focus-within {
  border-color: rgba(67, 85, 255, 0.3);
  box-shadow: 0 22px 55px rgba(67, 85, 255, 0.14);
}

.video-search :deep(svg) {
  color: #8592a8;
  flex-shrink: 0;
}

.video-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #253248;
  font-size: 1rem;
}

.video-toolbar__meta {
  gap: 10px;
  flex-wrap: wrap;
}

.video-toolbar__meta span {
  background: rgba(255, 255, 255, 0.82);
  color: #4f5f79;
  border: 1px solid rgba(154, 171, 196, 0.18);
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.video-card {
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(151, 168, 191, 0.18);
  box-shadow: 0 26px 60px rgba(18, 31, 56, 0.1);
  transition:
    transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.42s ease,
    border-color 0.42s ease;
}

.video-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 34px 78px rgba(18, 31, 56, 0.16);
  border-color: rgba(96, 119, 255, 0.24);
}

.video-card.is-featured {
  grid-column: 1 / span 2;
}

.video-card__button {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}

.video-card__media {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.video-card__poster,
.video-card__preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}

.video-card:hover .video-card__poster,
.video-card:hover .video-card__preview {
  transform: scale(1.06);
}

.video-card__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 13, 28, 0.06) 0%, rgba(6, 13, 28, 0.12) 42%, rgba(6, 13, 28, 0.78) 100%);
}

.video-card__duration,
.video-card__tag {
  position: absolute;
  top: 16px;
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  z-index: 1;
  font-size: 12px;
  font-weight: 700;
}

.video-card__duration {
  right: 16px;
  background: rgba(7, 17, 31, 0.74);
  color: #ffffff;
}

.video-card__tag {
  left: 16px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f5f8ff;
  backdrop-filter: blur(12px);
}

.video-card__play {
  position: absolute;
  left: 22px;
  bottom: 20px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(127, 124, 255, 0.96), rgba(68, 211, 255, 0.92));
  color: #07111e;
  box-shadow: 0 16px 36px rgba(90, 151, 255, 0.34);
}

.video-card__body {
  padding: 22px 22px 20px;
}

.video-card__body h3 {
  color: #0d1728;
  font-size: 1.18rem;
  line-height: 1.35;
}

.video-card__body p {
  color: #60708a;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-card__footer {
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.video-card__footer span {
  background: rgba(68, 85, 255, 0.06);
  color: #4e5f7a;
}

.video-pagination {
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 42px;
}

.video-pagination__btn,
.video-pagination__page {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(151, 168, 191, 0.22);
  background: rgba(255, 255, 255, 0.86);
  color: #4c5d77;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background-color 0.25s ease,
    color 0.25s ease;
}

.video-pagination__page {
  width: 42px;
  padding: 0;
}

.video-pagination__btn:hover:not(:disabled),
.video-pagination__page:hover:not(.is-active) {
  transform: translateY(-2px);
  border-color: rgba(67, 85, 255, 0.28);
  color: #4355ff;
}

.video-pagination__page.is-active {
  border-color: transparent;
  background: linear-gradient(135deg, #7f7cff, #44d3ff);
  color: #06111d;
}

.video-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(151, 168, 191, 0.16);
  color: #60708a;
  text-align: center;
  box-shadow: 0 24px 50px rgba(16, 30, 58, 0.06);
}

.video-empty--error {
  color: #9f3550;
}

.video-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(5, 10, 19, 0.86);
  backdrop-filter: blur(10px);
}

.video-modal__dialog {
  position: relative;
  width: min(1240px, 100%);
}

.video-modal__content {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 18px;
}

.video-modal__player,
.video-modal__sidebar {
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(9, 18, 34, 0.9);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.34);
}

.video-modal__player {
  overflow: hidden;
}

.video-modal__player video,
.video-modal__player iframe {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  background: #000000;
}

.video-modal__sidebar {
  padding: 24px;
  color: #f3f7ff;
}

.video-modal__sidebar p {
  color: rgba(226, 234, 245, 0.78);
}

.video-modal__fallback a,
.video-modal__link {
  margin-top: 12px;
  color: #7fd4ff;
}

.video-modal__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 14px;
  background: rgba(127, 124, 255, 0.14);
  border: 1px solid rgba(127, 124, 255, 0.24);
  font-weight: 700;
}

.video-modal__close {
  position: absolute;
  top: -14px;
  right: -14px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #0e1728;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
}

.video-modal-fade-enter-active,
.video-modal-fade-leave-active {
  transition: opacity 0.28s ease;
}

.video-modal-fade-enter-from,
.video-modal-fade-leave-to {
  opacity: 0;
}

@keyframes heroSlowZoom {
  from {
    transform: scale(1.08);
  }
  to {
    transform: scale(1.03);
  }
}

@media (max-width: 1200px) {
  .video-hero__content,
  .video-modal__content {
    grid-template-columns: 1fr;
  }

  .video-hero__spotlight {
    justify-content: flex-start;
  }

  .video-hero__highlights {
    grid-template-columns: 1fr;
    margin-top: -80px;
  }

  .video-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .video-card.is-featured {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .video-hero {
    min-height: auto;
  }

  .video-hero__content {
    min-height: auto;
    padding-top: 98px;
    padding-bottom: 120px;
  }

  .video-hero__copy h1 {
    max-width: none;
    font-size: clamp(2.2rem, 1.8rem + 2.6vw, 3.2rem);
  }

  .video-hero__stats {
    flex-direction: column;
    align-items: stretch;
  }

  .video-hero__stats article {
    width: 100%;
  }

  .video-hero__tabs-inner {
    flex-direction: column;
  }

  .video-hero__tab {
    min-height: 54px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .video-hero__tab:last-child {
    border-bottom: 0;
  }

  .video-content__inner {
    padding-top: 36px;
    padding-bottom: 70px;
  }

  .video-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .video-search {
    min-height: 56px;
  }

  .video-card__play {
    width: 52px;
    height: 52px;
  }

  .video-modal {
    padding: 14px;
  }

  .video-modal__close {
    top: -10px;
    right: -4px;
  }

  .video-modal__sidebar {
    padding: 18px;
  }
}
</style>
