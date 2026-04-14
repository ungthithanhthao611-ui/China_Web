<script setup>
import { computed, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination } from 'swiper/modules'

const props = defineProps({
  slides: {
    type: Array,
    required: true
  },
  activeIndex: {
    type: Number,
    required: true
  },
  activeCategoryId: {
    type: String,
    required: true
  }
})

const emit = defineEmits([
  'register-hero-swiper',
  'register-thumbs-swiper',
  'slide-change',
  'select-category'
])

let heroInstance = null
let thumbsInstance = null
const heroModules = [Navigation, Pagination]

const activeSlide = computed(() => props.slides[props.activeIndex] || props.slides[0])

function handleHeroSwiper(instance) {
  heroInstance = instance
  emit('register-hero-swiper', instance)
}

function handleThumbsSwiper(instance) {
  thumbsInstance = instance
  emit('register-thumbs-swiper', instance)
}

function handleHeroSlideChange(instance) {
  emit('slide-change', instance.activeIndex)
}

function slideHero(step) {
  if (!heroInstance) return

  if (step > 0) {
    heroInstance.slideNext()
    return
  }

  heroInstance.slidePrev()
}

watch(
  () => props.activeIndex,
  (index) => {
    if (heroInstance && heroInstance.activeIndex !== index) {
      heroInstance.slideTo(index)
    }

    if (thumbsInstance) {
      thumbsInstance.slideTo(index)
    }
  }
)
</script>

<template>
  <div class="page1-hero">
    <Swiper
      class="page1-hero__media"
      :modules="heroModules"
      :slides-per-view="1"
      :speed="1000"
      @swiper="handleHeroSwiper"
      @slide-change="handleHeroSlideChange"
    >
      <SwiperSlide v-for="slide in slides" :key="slide.id">
        <article class="banLi">
          <img
            class="banLi__image banLi__image--desktop"
            :src="slide.images[0]"
            :alt="slide.title"
            loading="eager"
            decoding="async"
          />
          <img
            class="banLi__image banLi__image--mobile"
            :src="slide.images[1] || slide.images[0]"
            :alt="`${slide.title} mobile`"
            loading="eager"
            decoding="async"
          />
        </article>
      </SwiperSlide>
    </Swiper>

    <div class="banText">
      <div class="new_banner reveal" style="--delay: 0.12s">
        <div class="new_banner_top">
          <span class="fnt_36">{{ activeSlide?.title }}</span>
          <img
            src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
            alt=""
            loading="lazy"
          />
        </div>
        <div class="new_line"></div>
        <div v-if="activeSlide?.subtitle" class="new_sub">{{ activeSlide.subtitle }}</div>
        <div v-if="activeSlide?.description" class="new_des">{{ activeSlide.description }}</div>
      </div>
    </div>

    <div class="anBox reveal" style="--delay: 0.18s">
      <div class="swiper-pagination1">
        <span>{{ String(props.activeIndex + 1).padStart(2, '0') }}</span>
        <span>/</span>
        <span>{{ String(slides.length).padStart(2, '0') }}</span>
      </div>
    </div>

    <button class="swiper_but swiper-prev" type="button" @click="slideHero(-1)">
      <ChevronLeft :size="28" />
    </button>
    <button class="swiper_but swiper-next" type="button" @click="slideHero(1)">
      <ChevronRight :size="28" />
    </button>

    <div class="banFen reveal" style="--delay: 0.24s">
      <Swiper
        class="banFen_flx"
        :slides-per-view="'auto'"
        :space-between="0"
        :speed="700"
        @swiper="handleThumbsSwiper"
      >
        <SwiperSlide v-for="slide in slides" :key="`thumb-${slide.id}`" class="banFen_flx__slide">
          <button
            class="fLi"
            :class="{ 'is-active': activeCategoryId === slide.id }"
            type="button"
            @click="emit('select-category', slide.id)"
          >
            {{ slide.title }}
          </button>
        </SwiperSlide>
      </Swiper>
    </div>
  </div>
</template>

<style scoped>
.page1-hero {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: #162134;
}

.page1-hero__media,
.banLi {
  height: 100%;
}

.banLi {
  position: relative;
}

.banLi::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(6, 12, 24, 0.44) 0%, rgba(6, 12, 24, 0.06) 28%, rgba(6, 12, 24, 0) 54%),
    linear-gradient(180deg, rgba(18, 26, 40, 0.1) 0%, rgba(18, 26, 40, 0) 26%, rgba(18, 26, 40, 0.12) 100%);
}

.banLi__image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transform: scale(1.03);
  animation: case-hero-zoom 14s ease-in-out infinite alternate;
}

.banLi__image--mobile {
  display: none;
}

.banText {
  position: absolute;
  inset: 0 0 96px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 10.2%;
  color: #f0ca99;
  pointer-events: none;
}

.new_banner {
  width: min(560px, 48vw);
}

.new_banner_top {
  display: flex;
  align-items: center;
  gap: 22px;
}

.new_banner_top img {
  width: 86px;
  height: auto;
  flex-shrink: 0;
}

.fnt_36 {
  margin: 0;
  color: #efc893;
  font-family: var(--case-font-display);
  font-size: clamp(34px, 2.7vw, 52px);
  font-weight: 500;
  line-height: 1;
  text-transform: uppercase;
}

.new_line {
  width: 238px;
  max-width: 36vw;
  height: 1px;
  margin: 20px 0 0;
  background: #cb2c2b;
}

.new_sub {
  margin-top: 18px;
  color: rgba(239, 200, 147, 0.82);
  font-size: 18px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.new_des {
  margin-top: 16px;
  max-width: 440px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 16px;
  line-height: 1.9;
}

.anBox {
  position: absolute;
  left: 10.2%;
  bottom: 128px;
  z-index: 4;
}

.swiper-pagination1 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #f1e5d5;
  font-size: 18px;
  letter-spacing: 0.08em;
}

.swiper_but {
  position: absolute;
  top: 50%;
  z-index: 3;
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  transform: translateY(-50%);
  background: rgba(215, 0, 15, 0.9);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(160, 7, 24, 0.28);
  transition: background 0.3s ease, transform 0.3s ease;
}

.swiper_but:hover {
  background: rgba(20, 33, 52, 0.96);
  transform: translateY(-50%) scale(1.03);
}

.swiper-prev {
  left: 24px;
}

.swiper-next {
  right: 24px;
}

.banFen {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 4;
  height: 96px;
  display: flex;
  align-items: center;
  padding: 0 10.2%;
  background: rgba(10, 17, 30, 0.7);
  backdrop-filter: blur(10px);
}

.banFen_flx {
  width: 100%;
}

.banFen_flx__slide {
  width: auto;
}

.fLi {
  min-width: 142px;
  height: 96px;
  padding: 0 14px;
  border: 0;
  background: transparent;
  color: rgba(239, 200, 147, 0.82);
  font-size: 15px;
  line-height: 1;
  white-space: nowrap;
  position: relative;
  transition: color 0.28s ease;
}

.fLi::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 0;
  height: 3px;
  background: #d7000f;
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.fLi:hover::after,
.fLi.is-active::after {
  width: calc(100% - 28px);
}

.fLi:hover,
.fLi.is-active {
  color: #ffffff;
}

@keyframes case-hero-zoom {
  from {
    transform: scale(1.02);
  }
  to {
    transform: scale(1.08);
  }
}

@media (max-width: 1024px) {
  .banText {
    padding: 0 7%;
  }

  .anBox {
    left: 7%;
  }

  .banFen {
    padding: 0 7%;
  }
}

@media (max-width: 768px) {
  .banLi__image--desktop {
    display: none;
  }

  .banLi__image--mobile {
    display: block;
  }

  .banText {
    inset: 0 0 84px;
    padding: 0 20px;
  }

  .new_banner {
    width: 100%;
  }

  .new_banner_top {
    gap: 12px;
  }

  .new_banner_top img {
    width: 56px;
  }

  .new_line {
    width: 160px;
    margin-top: 14px;
  }

  .new_des {
    font-size: 16px;
    line-height: 1.8;
  }

  .anBox {
    left: 20px;
    bottom: 106px;
  }

  .swiper_but {
    width: 44px;
    height: 44px;
  }

  .swiper-prev {
    left: 10px;
  }

  .swiper-next {
    right: 10px;
  }

  .banFen {
    height: 84px;
    padding: 0 10px;
  }

  .fLi {
    min-width: 120px;
    height: 84px;
    font-size: 14px;
  }
}
</style>
