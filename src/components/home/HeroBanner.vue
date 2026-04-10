<script setup>
import { nextTick, ref } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'

const slides = [
  {
    type: 'image',
    src: '/images/5b410cd6-2314-4dd5-bf3c-0a947c63008f.png',
    alt: 'China Decor hero banner'
  },
  {
    type: 'image',
    src: '/images/banner/banner2.jpg',
    alt: 'China Decor banner 2'
  },
  {
    type: 'image',
    src: '/images/banner/banner3.jpg',
    alt: 'China Decor banner 3'
  },
  {
    type: 'image',
    src: '/images/banner/banner4.jpg',
    alt: 'China Decor banner 4'
  },
  {
    type: 'image',
    src: '/images/banner/banner5.jpg',
    alt: 'China Decor banner 5'
  },
  {
    type: 'video',
    src: '/images/banner/vd.banner6.mp4',
    poster: '/images/banner/banner5.jpg',
    alt: 'China Decor banner video'
  }
]

const emit = defineEmits(['scroll-next'])

const modules = [Autoplay, EffectFade]
const activeSlide = ref(0)
const swiperRef = ref(null)
const videoRefs = ref([])

const setVideoRef = (element, index) => {
  if (!element) {
    return
  }

  videoRefs.value[index] = element
}

const syncVideos = () => {
  videoRefs.value.forEach((video, index) => {
    if (!video) {
      return
    }

    if (slides[index]?.type === 'video' && index === activeSlide.value) {
      const playAttempt = video.play()

      if (playAttempt?.catch) {
        playAttempt.catch(() => {})
      }
    } else {
      video.pause()
      video.currentTime = 0
    }
  })
}

const handleSwiper = (swiper) => {
  swiperRef.value = swiper
  activeSlide.value = swiper.realIndex
  nextTick(syncVideos)
}

const handleSlideChange = (swiper) => {
  activeSlide.value = swiper.realIndex
  nextTick(syncVideos)
}

const goToSlide = (index) => {
  swiperRef.value?.slideToLoop(index)
}

const goToNextSection = () => {
  emit('scroll-next')
}
</script>

<template>
  <section class="hero-banner">
    <swiper
      :modules="modules"
      :slides-per-view="1"
      :loop="true"
      :effect="'fade'"
      :fade-effect="{ crossFade: true }"
      :autoplay="{ delay: 5000, disableOnInteraction: false }"
      :speed="1800"
      class="hero-swiper"
      @swiper="handleSwiper"
      @slideChange="handleSlideChange"
    >
      <swiper-slide v-for="(slide, index) in slides" :key="index">
        <div class="hero-media">
          <img v-if="slide.type === 'image'" :src="slide.src" :alt="slide.alt" />
          <video
            v-else
            :ref="(element) => setVideoRef(element, index)"
            :src="slide.src"
            :poster="slide.poster"
            muted
            playsinline
            preload="metadata"
          ></video>
        </div>

        <div class="overlay"></div>
      </swiper-slide>
    </swiper>

    <div class="hero-pagination" aria-label="Banner pagination">
      <button
        v-for="(slide, index) in slides"
        :key="`pagination-${index}`"
        :class="['hero-page', { active: activeSlide === index }]"
        type="button"
        @click="goToSlide(index)"
      >
        <span class="page-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="page-dot"></span>
      </button>
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
  height: 100vh;
  min-height: 720px;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #010917;
}

.hero-swiper {
  height: 100%;
  width: 100%;
}

.hero-media {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 1;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 7s linear;
  }
}

:deep(.swiper-slide-active) .hero-media img,
:deep(.swiper-slide-active) .hero-media video {
  transform: scale(1.06);
}

.overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(2, 10, 23, 0.34) 0%, rgba(2, 10, 23, 0.08) 22%, rgba(2, 10, 23, 0.12) 62%, rgba(2, 10, 23, 0.34) 100%),
    radial-gradient(circle at center, rgba(8, 30, 74, 0.08) 0%, rgba(2, 10, 23, 0) 52%);
  z-index: 2;
}

.hero-pagination {
  position: absolute;
  top: 50%;
  right: 54px;
  transform: translateY(-50%);
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero-page {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 22px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.page-number {
  min-width: 38px;
  text-align: right;
  font-size: 17px;
  line-height: 1;
  color: rgba(223, 189, 142, 0.92);
  transition: color 0.25s ease, transform 0.25s ease;
}

.page-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.48);
  transition: background 0.25s ease, transform 0.25s ease;
}

.hero-page.active .page-number {
  color: #e10012;
  transform: translateX(-4px);
}

.hero-page.active .page-dot {
  background: #e10012;
  transform: scale(1.55);
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

@media (max-width: 768px) {
  .hero-banner {
    min-height: 540px;
  }

  .hero-pagination {
    top: auto;
    right: 20px;
    bottom: 26px;
    transform: none;
    gap: 14px;
  }

  .hero-page {
    gap: 12px;
  }

  .page-number {
    font-size: 13px;
  }

  .page-dot {
    width: 7px;
    height: 7px;
  }

  .hero-scroll {
    display: none;
  }
}
</style>
