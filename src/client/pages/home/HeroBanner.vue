<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, EffectFade } from 'swiper/modules'

import { useBootstrapStore } from '@/client/stores/bootstrap'
import { env } from '@/config/env'

import 'swiper/css'
import 'swiper/css/effect-fade'

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['scroll-next', 'slide-change'])

const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
const bootstrapStore = useBootstrapStore()
const modules = [Autoplay, EffectFade]
const activeSlide = ref(0)
const swiperRef = ref(null)
const videoRefs = ref([])

const defaultSlides = [
  {
    type: 'image',
    src: '/images/5b410cd6-2314-4dd5-bf3c-0a947c63008f.png',
    alt: 'China Decor hero banner',
    eyebrow: 'China Decor',
    title: 'China Decoration',
    subtitle: 'Premium business interiors with integrated delivery.',
    body: 'From flagship office environments to landmark public spaces, China Decor turns ambitious briefs into high-standard built results.',
    buttonText: 'Explore Services',
    link: '/business-areas#ctn1',
  },
  {
    type: 'image',
    src: '/images/banner/banner2.jpg',
    alt: 'China Decor banner 2',
    eyebrow: 'Business Display',
    title: 'Complex Projects, Controlled Delivery',
    subtitle: 'Design, engineering, and execution aligned from day one.',
    body: 'Coordinate scope, timeline, and premium finishing standards through one disciplined project workflow.',
    buttonText: 'View Projects',
    link: '/project-case',
  },
  {
    type: 'image',
    src: '/images/banner/banner3.jpg',
    alt: 'China Decor banner 3',
    eyebrow: 'Interior Systems',
    title: 'Corporate Environments Built To Last',
    subtitle: 'Flagship workplaces shaped for brand, function, and speed.',
    body: 'Deliver premium corporate spaces with stronger planning, tighter execution, and better operational readiness.',
    buttonText: 'About Us',
    link: '/about/company-introduction#page1',
  },
  {
    type: 'image',
    src: '/images/banner/banner4.jpg',
    alt: 'China Decor banner 4',
    eyebrow: 'Qualification Honor',
    title: 'Certified Capability Across Key Sectors',
    subtitle: 'Built on compliance, execution quality, and national-scale experience.',
    body: 'Review awards, certifications, and delivery credentials that support large enterprise and public projects.',
    buttonText: 'See Honors',
    link: '/honors',
  },
  {
    type: 'image',
    src: '/images/banner/banner5.jpg',
    alt: 'China Decor banner 5',
    eyebrow: 'News Center',
    title: 'Follow Current Projects And Corporate Updates',
    subtitle: 'A clearer view of what the team is building now.',
    body: 'Track the latest project milestones, company developments, and sector-facing announcements from China Decor.',
    buttonText: 'Read News',
    link: '/news/corporate-news',
  },
  {
    type: 'video',
    src: '/images/banner/vd.banner6.mp4',
    poster: '/images/banner/banner5.jpg',
    alt: 'China Decor banner video',
    eyebrow: 'Video Library',
    title: 'See Signature Work In Motion',
    subtitle: 'Project storytelling, site footage, and premium visual presentations.',
    body: 'Browse curated videos that show delivery quality, design atmosphere, and execution detail beyond still images.',
    buttonText: 'Open Video',
    link: '/video',
  },
]

function resolveAssetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function cloudinaryVideoPoster(url) {
  const normalized = String(url || '').trim()
  if (!/res\.cloudinary\.com\/.+\/video\/upload\//i.test(normalized)) {
    return ''
  }

  const [base, query = ''] = normalized.split('?')
  const posterBase = base
    .replace('/video/upload/', '/video/upload/so_0/')
    .replace(/\.(mp4|webm|ogg|mov|m4v)$/i, '.jpg')

  return query ? `${posterBase}?${query}` : posterBase
}

function isVideoAsset(banner = {}) {
  if (String(banner?.image?.asset_type || '').toLowerCase() === 'video') {
    return true
  }

  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(banner?.image?.url || '').trim())
}

const slides = computed(() => {
  const banners = bootstrapStore.heroBanners || []

  if (!banners.length) {
    return defaultSlides
  }

  return banners.map((banner, index) => {
    const fallbackSlide = defaultSlides[index % defaultSlides.length]
    const mediaUrl = resolveAssetUrl(banner.image?.url || fallbackSlide.src || '')
    const isVideo = banner.image?.url ? isVideoAsset(banner) : fallbackSlide.type === 'video'
    const posterUrl = isVideo
      ? resolveAssetUrl(banner.image?.thumbnail_url || banner.image?.poster || '') || cloudinaryVideoPoster(mediaUrl) || ''
      : mediaUrl

    return {
      type: isVideo ? 'video' : 'image',
      src: mediaUrl,
      poster: isVideo ? posterUrl : mediaUrl,
      alt: banner.image?.alt_text || banner.title || fallbackSlide.alt || `China Decor banner ${index + 1}`,
      eyebrow: String(banner.eyebrow || '').trim(),
      title: String(banner.title || '').trim(),
      subtitle: String(banner.subtitle || '').trim(),
      body: String(banner.body || '').trim(),
      link: banner.link || '',
      buttonText: String(banner.button_text || '').trim(),
      hasCopy: Boolean(
        String(banner.eyebrow || '').trim()
        || String(banner.title || '').trim()
        || String(banner.subtitle || '').trim()
        || String(banner.body || '').trim()
        || (String(banner.button_text || '').trim() && String(banner.link || '').trim())
      ),
      fallback: fallbackSlide,
    }
  })
})

const currentSlide = computed(() => slides.value[activeSlide.value] || slides.value[0] || defaultSlides[0])

const setVideoRef = (element, index) => {
  if (!element) return
  videoRefs.value[index] = element
}

const syncVideos = () => {
  videoRefs.value.forEach((video, index) => {
    if (!video) return

    if (slides.value[index]?.type === 'video' && index === activeSlide.value) {
      const playAttempt = video.play()
      if (playAttempt?.catch) {
        playAttempt.catch(() => {})
      }
      return
    }

    video.pause()
    video.currentTime = 0
  })
}

const handleSwiper = (swiper) => {
  swiperRef.value = swiper
  activeSlide.value = swiper.realIndex
  emit('slide-change', swiper.realIndex)
  nextTick(syncVideos)
}

const handleSlideChange = (swiper) => {
  activeSlide.value = swiper.realIndex
  emit('slide-change', swiper.realIndex)
  nextTick(syncVideos)
}

const goToSlide = (index) => {
  if (!swiperRef.value) return

  if (slides.value.length > 1) {
    swiperRef.value.slideToLoop(index)
    return
  }

  swiperRef.value.slideTo(index)
}

const goToNextSection = () => {
  emit('scroll-next')
}

const isExternalLink = (link) => /^https?:\/\//i.test(String(link || '').trim())
const bannerLinkProps = (link) => (isExternalLink(link) ? { href: link, target: '_blank', rel: 'noreferrer noopener' } : { to: link })

watch(
  slides,
  () => {
    if (activeSlide.value >= slides.value.length) {
      activeSlide.value = 0
    }
    nextTick(syncVideos)
  },
  { deep: true }
)

defineExpose({ goToSlide })
</script>

<template>
  <section class="hero-banner">
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="slides.length > 1"
      :effect="'fade'"
      :fade-effect="{ crossFade: true }"
      :autoplay="slides.length > 1 ? { delay: 5000, disableOnInteraction: false } : false"
      :speed="1800"
      class="hero-swiper"
      @swiper="handleSwiper"
      @slideChange="handleSlideChange"
    >
      <swiper-slide v-for="(slide, index) in slides" :key="`${slide.src || 'banner'}-${index}`">
        <div class="hero-media">
          <img v-if="slide.type === 'image'" :src="slide.src" :alt="slide.alt" />
          <video
            v-else
            :ref="(element) => setVideoRef(element, index)"
            :src="slide.src"
            :poster="slide.poster || undefined"
            muted
            playsinline
            preload="metadata"
            loop
          ></video>
        </div>

        <div class="overlay"></div>
        <div class="overlay overlay--grain"></div>
      </swiper-slide>
    </swiper>

    <div class="hero-copy-shell">
      <div v-if="currentSlide.hasCopy" class="hero-copy">
        <p v-if="currentSlide.eyebrow" class="hero-copy__eyebrow">{{ currentSlide.eyebrow }}</p>
        <div v-if="currentSlide.eyebrow" class="hero-copy__crest">
          <span class="hero-copy__crest-line"></span>
          <span>China Decor</span>
        </div>
        <h1 v-if="currentSlide.title">{{ currentSlide.title }}</h1>
        <p v-if="currentSlide.subtitle" class="hero-copy__subtitle">{{ currentSlide.subtitle }}</p>
        <div v-if="currentSlide.title || currentSlide.subtitle" class="hero-copy__divider">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p v-if="currentSlide.body" class="hero-copy__body">{{ currentSlide.body }}</p>
        <component
          :is="isExternalLink(currentSlide.link) ? 'a' : 'router-link'"
          v-if="currentSlide.link"
          class="hero-copy__cta"
          v-bind="bannerLinkProps(currentSlide.link)"
        >
          {{ currentSlide.buttonText || 'Discover More' }}
        </component>
      </div>
    </div>

    <button class="hero-scroll" type="button" aria-label="Scroll to next section" @click="goToNextSection">
      <span class="hero-scroll__dot"></span>
      <span class="hero-scroll__line"></span>
      <span class="hero-scroll__arrow"></span>
    </button>
  </section>
</template>

<style scoped>
.hero-banner {
  position: relative;
  height: 100vh;
  min-height: 720px;
  width: 100%;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 75%, rgba(30, 101, 255, 0.38), rgba(7, 17, 33, 0) 34%),
    linear-gradient(180deg, #030b18 0%, #030a17 60%, #020713 100%);
}

.hero-swiper {
  height: 100%;
  width: 100%;
}

.hero-media,
.hero-media img,
.hero-media video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-media img,
.hero-media video {
  object-fit: cover;
  transition: transform 7s linear, filter 0.5s ease;
}

:deep(.swiper-slide-active) .hero-media img,
:deep(.swiper-slide-active) .hero-media video {
  transform: scale(1.05);
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(180deg, rgba(2, 10, 23, 0.28) 0%, rgba(2, 10, 23, 0.08) 18%, rgba(2, 10, 23, 0.2) 60%, rgba(2, 10, 23, 0.4) 100%),
    radial-gradient(circle at 50% 100%, rgba(57, 149, 255, 0.45), rgba(57, 149, 255, 0) 27%);
}

.overlay--grain {
  background:
    radial-gradient(circle at 15% 22%, rgba(255, 255, 255, 0.12) 0, rgba(255, 255, 255, 0) 1px),
    radial-gradient(circle at 75% 32%, rgba(255, 255, 255, 0.1) 0, rgba(255, 255, 255, 0) 1px),
    radial-gradient(circle at 62% 72%, rgba(0, 170, 255, 0.28) 0, rgba(0, 170, 255, 0) 5px),
    radial-gradient(circle at 22% 82%, rgba(0, 170, 255, 0.22) 0, rgba(0, 170, 255, 0) 4px);
  background-size: 180px 180px, 220px 220px, auto, auto;
  mix-blend-mode: screen;
  opacity: 0.7;
}

.hero-copy-shell {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  padding: 140px 108px 110px;
  pointer-events: none;
}

.hero-copy {
  display: grid;
  gap: 16px;
  max-width: 680px;
  color: #f4f7fb;
  pointer-events: auto;
}

.hero-copy__eyebrow,
.hero-copy__crest {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.24em;
}

.hero-copy__eyebrow {
  color: rgba(255, 219, 179, 0.84);
  font-size: 12px;
  font-weight: 700;
}

.hero-copy__crest {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: rgba(232, 89, 101, 0.92);
  font-size: 11px;
  font-weight: 700;
}

.hero-copy__crest-line {
  width: 86px;
  height: 1px;
  background: linear-gradient(90deg, rgba(225, 0, 18, 0), rgba(225, 0, 18, 0.95));
}

.hero-copy h1,
.hero-copy__subtitle,
.hero-copy__body {
  margin: 0;
}

.hero-copy h1 {
  max-width: 12ch;
  font-size: clamp(44px, 5vw, 76px);
  line-height: 0.96;
  letter-spacing: -0.04em;
  text-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
}

.hero-copy__subtitle {
  max-width: 32ch;
  color: rgba(246, 248, 252, 0.88);
  font-size: clamp(18px, 1.7vw, 24px);
  line-height: 1.35;
}

.hero-copy__divider {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero-copy__divider span:nth-child(1) {
  width: 92px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.hero-copy__divider span:nth-child(2),
.hero-copy__divider span:nth-child(3) {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid #e10012;
}

.hero-copy__body {
  max-width: 52ch;
  color: rgba(231, 237, 245, 0.8);
  font-size: 15px;
  line-height: 1.8;
}

.hero-copy__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  background: rgba(225, 0, 18, 0.92);
  color: #fff7f7;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 16px 34px rgba(225, 0, 18, 0.24);
  transition: transform 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease;
}

.hero-copy__cta:hover {
  transform: translateY(-2px);
  background: #ff1f32;
  box-shadow: 0 20px 40px rgba(225, 0, 18, 0.3);
}

.hero-scroll {
  position: absolute;
  right: 78px;
  bottom: 66px;
  z-index: 4;
  width: 58px;
  height: 96px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.hero-scroll__dot {
  position: absolute;
  top: 0;
  left: 50%;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  transform: translateX(-50%);
  background: #e10012;
  box-shadow: 0 12px 30px rgba(225, 0, 18, 0.3);
}

.hero-scroll__line {
  position: absolute;
  top: 29px;
  left: 50%;
  width: 1px;
  height: 52px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
}

.hero-scroll__arrow {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  transform: translateX(-50%) rotate(45deg);
}

@media (max-width: 1200px) {
  .hero-copy-shell {
    padding: 132px 76px 104px;
  }
}

@media (max-width: 992px) {
  .hero-banner {
    min-height: 680px;
  }

  .hero-copy-shell {
    padding: 132px 32px 96px;
    align-items: flex-end;
  }

  .hero-copy h1 {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .hero-banner {
    min-height: 600px;
  }

  .hero-copy-shell {
    padding: 118px 22px 58px;
  }

  .hero-copy {
    gap: 14px;
    max-width: 100%;
  }

  .hero-copy__subtitle {
    font-size: 17px;
  }

  .hero-copy__body {
    font-size: 14px;
    line-height: 1.65;
  }

  .hero-copy__cta {
    min-height: 44px;
    padding: 0 18px;
    font-size: 12px;
  }

  .hero-scroll {
    display: none;
  }
}
</style>
