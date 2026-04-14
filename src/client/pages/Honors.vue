<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, House } from 'lucide-vue-next'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Grid, Navigation } from 'swiper/modules'
import 'swiper/css/grid'
import {
  corporateHonors,
  honorsHero,
  honorPageSections,
  projectHonors,
  qualificationCertificates
} from '@/client/components/shared/honors/honorsData'

const route = useRoute()

const swiperModules = [Autoplay, Grid, Navigation]
const activeHonorTab = ref('corporate')
const activeSection = ref('page1')
const animatedSections = ref(['page1'])

const certificateSwiper = ref(null)
const corporateSwiper = ref(null)
const projectSwiper = ref(null)

const frameImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/e936f2ab-1a31-4886-93cf-1a067c709aa5.png'
const accentImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png'
const prevArrowImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/cd7207b7-4985-4449-9ffd-acc5ff653fac.png'
const nextArrowImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/1bd7e198-70b1-453e-b508-6b9b9cb84b26.png'

const honorTabs = [
  { key: 'corporate', label: 'Corporate Honors' },
  { key: 'project', label: 'Project Honors' }
]

const honorsBreakpoints = {
  320: {
    slidesPerView: 2,
    slidesPerGroup: 4,
    spaceBetween: 18
  },
  768: {
    slidesPerView: 3,
    slidesPerGroup: 6,
    spaceBetween: 28
  }
}

const certificateInitialSlide = 8

const markAnimated = (id) => {
  if (!animatedSections.value.includes(id)) {
    animatedSections.value = [...animatedSections.value, id]
  }
}

const handleScroll = () => {
  const scrollCenter = window.scrollY + window.innerHeight * 0.42

  honorPageSections.forEach((item) => {
    const element = document.getElementById(item.id)

    if (!element) return

    const top = element.offsetTop
    const bottom = top + element.offsetHeight

    if (scrollCenter >= top && scrollCenter < bottom) {
      activeSection.value = item.id
    }

    if (window.scrollY + window.innerHeight * 0.8 >= top) {
      markAnimated(item.id)
    }
  })
}

const scrollToSection = (id) => {
  const element = document.getElementById(id)

  if (!element) return

  const top = element.getBoundingClientRect().top + window.scrollY

  window.scrollTo({
    top,
    behavior: 'smooth'
  })

  window.history.replaceState(null, '', `/honors#${id}`)
}

const syncHashSection = async () => {
  await nextTick()

  const hash = route.hash?.replace('#', '')

  if (hash && honorPageSections.some((item) => item.id === hash)) {
    scrollToSection(hash)
    return
  }

  handleScroll()
}

const bindCertificateSwiper = (instance) => {
  certificateSwiper.value = instance
}

const bindCorporateSwiper = (instance) => {
  corporateSwiper.value = instance
}

const bindProjectSwiper = (instance) => {
  projectSwiper.value = instance
}

const slideCertificates = (direction) => {
  if (!certificateSwiper.value) return
  direction > 0 ? certificateSwiper.value.slideNext() : certificateSwiper.value.slidePrev()
}

const slideCorporate = (direction) => {
  if (!corporateSwiper.value) return
  direction > 0 ? corporateSwiper.value.slideNext() : corporateSwiper.value.slidePrev()
}

const slideProject = (direction) => {
  if (!projectSwiper.value) return
  direction > 0 ? projectSwiper.value.slideNext() : projectSwiper.value.slidePrev()
}

watch(
  () => route.hash,
  () => {
    syncHashSection()
  }
)

watch(activeHonorTab, async (value) => {
  await nextTick()

  if (value === 'corporate') {
    corporateSwiper.value?.slideTo(0)
    return
  }

  projectSwiper.value?.slideTo(0)
})

watch(activeSection, (value) => {
  if (route.path === '/honors') {
    window.history.replaceState(null, '', `/honors#${value}`)
  }
})

onMounted(() => {
  handleScroll()
  syncHashSection()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <div class="honors-page">
    <aside class="honors-dots" aria-label="Section navigation">
      <button
        v-for="(item, index) in honorPageSections"
        :id="`honor-dot-${index}`"
        :key="item.id"
        class="honors-dots__item"
        :class="{ active: activeSection === item.id }"
        :aria-label="`Go to ${item.label}`"
        type="button"
        @click="scrollToSection(item.id)"
      >
        <span></span>
      </button>
    </aside>

    <section id="page1" class="honors-hero honors-screen">
      <picture class="hero-media">
        <source :srcset="honorsHero.mobileBackground" media="(max-width: 767px)" />
        <img :src="honorsHero.background" :alt="honorsHero.title" />
      </picture>

      <div class="hero-shade"></div>
      <div class="hero-shimmer"></div>

      <div class="hero-shell" :class="{ 'is-visible': animatedSections.includes('page1') }">
        <div class="hero-panel">
          <div class="hero-title">
            <span>{{ honorsHero.title }}</span>
            <img :src="honorsHero.accent" alt="Honor accent" />
          </div>
          <div class="hero-line"></div>
          <p>{{ honorsHero.description }}</p>
        </div>
      </div>

      <div class="hero-tabs">
        <button type="button" @click="scrollToSection('page2')">Qualification certificate</button>
        <button type="button" @click="scrollToSection('page3')">Honorary Awards</button>
      </div>
    </section>

    <section id="page2" class="honors-section honors-section--certificate honors-screen">
      <div class="honors-bg honors-bg--certificate"></div>
      <div class="honors-glow honors-glow--certificate"></div>

      <div class="honors-stage" :class="{ 'is-visible': animatedSections.includes('page2') }">
        <div class="honors-breadcrumb">
          <House :size="16" />
          <router-link id="honors-home-link" to="/">Home</router-link>
          <ChevronRight :size="14" />
          <span>Qualification honor</span>
        </div>

        <header class="honors-heading">
          <div class="honors-heading__title">
            <h2 id="honors-cert-title">Qualification Certificate</h2>
            <div class="honors-heading__line"></div>
          </div>
          <img :src="accentImage" alt="Section accent" />
        </header>

        <div class="honors-carousel">
          <button
            id="honors-cert-prev"
            class="slider-arrow slider-arrow--prev cert-swiper-prev"
            type="button"
            aria-label="Previous certificate"
            @click="slideCertificates(-1)"
          >
            <img :src="prevArrowImage" alt="Previous" />
          </button>

          <Swiper
            class="honors-swiper honors-swiper--certificate"
            :modules="swiperModules"
            :initial-slide="certificateInitialSlide"
            :observer="true"
            :observe-parents="true"
            :slides-per-view="3"
            :slides-per-group="6"
            :space-between="28"
            :speed="2000"
            :grid="{ rows: 2, fill: 'column' }"
            :navigation="{ nextEl: '.cert-swiper-next', prevEl: '.cert-swiper-prev' }"
            :autoplay="{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }"
            :breakpoints="honorsBreakpoints"
            @swiper="bindCertificateSwiper"
          >
            <SwiperSlide
              v-for="item in qualificationCertificates"
              :key="`certificate-${item.title}-${item.image}`"
            >
              <article class="frame-card">
                <div class="frame-card__visual">
                  <img class="frame-card__shell" :src="frameImage" alt="" aria-hidden="true" />
                  <div class="frame-card__inner">
                    <img :src="item.image" :alt="item.title" />
                  </div>
                </div>
                <h3>{{ item.title }}</h3>
              </article>
            </SwiperSlide>
          </Swiper>

          <button
            id="honors-cert-next"
            class="slider-arrow slider-arrow--next cert-swiper-next"
            type="button"
            aria-label="Next certificate"
            @click="slideCertificates(1)"
          >
            <img :src="nextArrowImage" alt="Next" />
          </button>
        </div>
      </div>
    </section>

    <section id="page3" class="honors-section honors-section--awards honors-screen">
      <div class="honors-bg honors-bg--awards"></div>
      <div class="honors-glow honors-glow--awards"></div>

      <div class="honors-stage" :class="{ 'is-visible': animatedSections.includes('page3') }">
        <header class="honors-heading honors-heading--awards">
          <div class="honors-heading__title">
            <h2>Honorary Awards</h2>
            <div class="honors-heading__line"></div>
          </div>
          <img :src="accentImage" alt="Section accent" />
        </header>

        <div class="awards-tabs" role="tablist" aria-label="Honor categories">
          <button
            v-for="tab in honorTabs"
            :id="`honor-tab-${tab.key}`"
            :key="tab.key"
            class="awards-tabs__item"
            :class="{ active: activeHonorTab === tab.key }"
            type="button"
            role="tab"
            :aria-selected="activeHonorTab === tab.key"
            @click="activeHonorTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-show="activeHonorTab === 'corporate'" class="honors-carousel honors-carousel--awards">
          <button
            id="honors-corp-prev"
            class="slider-arrow slider-arrow--prev corp-swiper-prev"
            type="button"
            aria-label="Previous corporate honor"
            @click="slideCorporate(-1)"
          >
            <img :src="prevArrowImage" alt="Previous" />
          </button>

          <Swiper
            class="honors-swiper honors-swiper--awards honors-swiper--corporate"
            :modules="swiperModules"
            :observer="true"
            :observe-parents="true"
            :slides-per-view="3"
            :slides-per-group="6"
            :space-between="28"
            :speed="2000"
            :grid="{ rows: 2, fill: 'column' }"
            :navigation="{ nextEl: '.corp-swiper-next', prevEl: '.corp-swiper-prev' }"
            :autoplay="{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }"
            :breakpoints="honorsBreakpoints"
            @swiper="bindCorporateSwiper"
          >
            <SwiperSlide
              v-for="item in corporateHonors"
              :key="`corporate-${item.title}-${item.image}`"
            >
              <article class="frame-card">
                <div class="frame-card__visual">
                  <img class="frame-card__shell" :src="frameImage" alt="" aria-hidden="true" />
                  <div class="frame-card__inner">
                    <img :src="item.image" :alt="item.title" />
                  </div>
                </div>
                <h3>{{ item.title }}</h3>
              </article>
            </SwiperSlide>
          </Swiper>

          <button
            id="honors-corp-next"
            class="slider-arrow slider-arrow--next corp-swiper-next"
            type="button"
            aria-label="Next corporate honor"
            @click="slideCorporate(1)"
          >
            <img :src="nextArrowImage" alt="Next" />
          </button>
        </div>

        <div v-show="activeHonorTab === 'project'" class="honors-carousel honors-carousel--awards">
          <button
            id="honors-proj-prev"
            class="slider-arrow slider-arrow--prev proj-swiper-prev"
            type="button"
            aria-label="Previous project honor"
            @click="slideProject(-1)"
          >
            <img :src="prevArrowImage" alt="Previous" />
          </button>

          <Swiper
            class="honors-swiper honors-swiper--awards honors-swiper--project"
            :modules="swiperModules"
            :observer="true"
            :observe-parents="true"
            :slides-per-view="3"
            :slides-per-group="6"
            :space-between="28"
            :speed="2000"
            :grid="{ rows: 2, fill: 'column' }"
            :navigation="{ nextEl: '.proj-swiper-next', prevEl: '.proj-swiper-prev' }"
            :autoplay="{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }"
            :breakpoints="honorsBreakpoints"
            @swiper="bindProjectSwiper"
          >
            <SwiperSlide
              v-for="item in projectHonors"
              :key="`project-${item.title}-${item.image}`"
            >
              <article class="frame-card">
                <div class="frame-card__visual">
                  <img class="frame-card__shell" :src="frameImage" alt="" aria-hidden="true" />
                  <div class="frame-card__inner">
                    <img :src="item.image" :alt="item.title" />
                  </div>
                </div>
                <h3>{{ item.title }}</h3>
              </article>
            </SwiperSlide>
          </Swiper>

          <button
            id="honors-proj-next"
            class="slider-arrow slider-arrow--next proj-swiper-next"
            type="button"
            aria-label="Next project honor"
            @click="slideProject(1)"
          >
            <img :src="nextArrowImage" alt="Next" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.honors-page {
  position: relative;
  overflow: clip;
  background: #1e1408;
  color: #fff;
}

.honors-screen {
  position: relative;
  min-height: 100vh;
}

.honors-dots {
  position: fixed;
  top: 50%;
  right: 26px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transform: translateY(-50%);
}

.honors-dots__item {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.honors-dots__item span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  transition: all 0.24s ease;
}

.honors-dots__item.active span,
.honors-dots__item:hover span {
  width: 12px;
  height: 12px;
  background: #df0019;
  box-shadow: 0 0 12px rgba(223, 0, 25, 0.35);
}

.honors-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 96px;
}

.hero-media,
.hero-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-media img {
  object-fit: cover;
}

.hero-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(13, 8, 3, 0.16) 0%, rgba(13, 8, 3, 0.48) 100%),
    linear-gradient(90deg, rgba(36, 22, 8, 0.74) 0%, rgba(36, 22, 8, 0.34) 38%, rgba(36, 22, 8, 0.08) 100%);
}

.hero-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 42%, rgba(255, 255, 255, 0.08) 50%, transparent 58%);
  animation: heroShimmer 9s linear infinite;
}

.hero-shell {
  position: relative;
  z-index: 2;
  width: min(1320px, calc(100% - 96px));
  padding: 140px 0 96px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}

.hero-shell.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-panel {
  max-width: 640px;
  text-align: left;
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 18px;
  color: #fff;
}

.hero-title span {
  font-family: 'Times New Roman', serif;
  font-size: clamp(2.2rem, 1.6rem + 1.7vw, 3.3rem);
  font-weight: 700;
  line-height: 1.06;
  letter-spacing: 0.01em;
}

.hero-title img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  margin-left: 10px;
}

.hero-line,
.honors-heading__line {
  position: relative;
  display: block;
  width: min(460px, 56vw);
  height: 1px;
  background: #d90017;
}

.hero-line::before,
.hero-line::after,
.honors-heading__line::before,
.honors-heading__line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #d90017;
  transform: translateY(-50%);
}

.hero-line::before,
.honors-heading__line::before {
  left: -2px;
}

.hero-line::after,
.honors-heading__line::after {
  right: -2px;
}

.hero-panel p {
  max-width: 540px;
  margin: 30px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 18px;
  line-height: 1.85;
}

.hero-tabs {
  position: absolute;
  left: 50%;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(1320px, calc(100% - 96px));
  background: rgba(18, 31, 54, 0.92);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transform: translateX(-50%);
}

.hero-tabs button {
  min-height: 80px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  font-size: 18px;
  cursor: pointer;
  transition: background 0.24s ease, color 0.24s ease;
}

.hero-tabs button:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

@media (max-width: 1400px) {
  .hero-shell {
    width: min(1180px, calc(100% - 72px));
  }

  .hero-tabs {
    width: min(1180px, calc(100% - 72px));
  }
}

.hero-tabs button + button {
  border-left: 1px solid rgba(255, 255, 255, 0.18);
}

.honors-section {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 56px 0 34px;
}

.honors-bg,
.honors-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.honors-bg--certificate,
.honors-bg--awards {
  background-image:
    linear-gradient(90deg, rgba(49, 30, 12, 0.97) 0%, rgba(91, 64, 29, 0.94) 36%, rgba(176, 148, 92, 0.76) 100%),
    url('https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg');
  background-repeat: no-repeat;
  background-size: cover, cover;
  background-position: center, right center;
}

.honors-bg--awards {
  background-image:
    linear-gradient(90deg, rgba(34, 21, 8, 0.97) 0%, rgba(76, 52, 24, 0.95) 34%, rgba(164, 138, 86, 0.74) 100%),
    url('https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg');
}

.honors-glow::before,
.honors-glow::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  filter: blur(22px);
}

.honors-glow--certificate::before,
.honors-glow--awards::before {
  right: -10%;
  top: 10%;
  width: 42vw;
  height: 80vh;
  background:
    linear-gradient(90deg, rgba(255, 235, 189, 0) 0%, rgba(255, 233, 173, 0.18) 40%, rgba(255, 238, 201, 0.36) 100%),
    url('https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: right center;
  opacity: 0.9;
  transform: scale(1.06);
}

.honors-glow--certificate::after,
.honors-glow--awards::after {
  right: 8%;
  top: 22%;
  width: 14vw;
  height: 14vw;
  background: radial-gradient(circle, rgba(255, 242, 213, 0.48), transparent 70%);
}

.honors-stage {
  position: relative;
  z-index: 2;
  width: min(1460px, calc(100% - 68px));
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.honors-stage.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.honors-breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 36px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 15px;
}

.honors-breadcrumb a {
  color: #fff;
  text-decoration: none;
}

.honors-breadcrumb a:hover {
  color: #ffd9d9;
}

.honors-heading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 28px;
}

.honors-heading--awards {
  margin-top: 24px;
}

.honors-heading__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.honors-heading h2 {
  margin: 0;
  color: #fff;
  font-family: 'Times New Roman', serif;
  font-size: clamp(2.1rem, 1.5rem + 1.2vw, 3.4rem);
  font-weight: 700;
  line-height: 1.08;
  text-align: center;
}

.honors-heading img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.honors-carousel {
  position: relative;
  padding: 0 112px;
}

.honors-carousel--awards {
  margin-top: 22px;
}

.slider-arrow {
  position: absolute;
  top: 50%;
  z-index: 3;
  width: 66px;
  height: 66px;
  border: none;
  border-radius: 999px;
  background: rgba(48, 31, 12, 0.68);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
  display: grid;
  place-items: center;
  cursor: pointer;
  transform: translateY(-50%);
  transition: transform 0.24s ease, background 0.24s ease, opacity 0.24s ease;
}

.slider-arrow--prev {
  left: 6px;
}

.slider-arrow--next {
  right: 6px;
}

.slider-arrow img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.slider-arrow:hover {
  background: rgba(31, 18, 5, 0.88);
  transform: translateY(-50%) scale(1.04);
}

.awards-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
}

.awards-tabs__item {
  min-width: 188px;
  min-height: 46px;
  padding: 0 20px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.88);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.24s ease, color 0.24s ease, border-color 0.24s ease;
}

.awards-tabs__item.active,
.awards-tabs__item:hover {
  background: #d90017;
  border-color: #d90017;
  color: #fff;
}

:deep(.honors-swiper) {
  height: min(700px, calc(100vh - 230px));
  overflow: hidden;
}

:deep(.honors-swiper .swiper-wrapper) {
  align-items: stretch;
}

:deep(.honors-swiper .swiper-slide) {
  display: flex;
  height: auto;
}

.frame-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
}

.frame-card__visual {
  position: relative;
  width: min(100%, 330px);
  margin: 0 auto;
  filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 0.16));
  transition: transform 0.28s ease, filter 0.28s ease;
}

.frame-card__shell {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
}

.frame-card__inner {
  position: absolute;
  inset: 16% 14% 18% 14%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 252, 245, 0.8);
  overflow: hidden;
}

.frame-card__inner img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fffefb;
}

.frame-card h3 {
  max-width: 95%;
  margin: 0;
  color: #fff;
  font-family: 'Times New Roman', serif;
  font-size: clamp(0.9rem, 0.86rem + 0.16vw, 1.02rem);
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
}

.frame-card:hover .frame-card__visual {
  transform: translateY(-4px) scale(1.01);
  filter: drop-shadow(0 22px 28px rgba(0, 0, 0, 0.18));
}

@keyframes heroShimmer {
  0% {
    transform: translateX(-18%);
  }

  100% {
    transform: translateX(18%);
  }
}

@media (max-width: 1199px) {
  .honors-stage {
    width: calc(100% - 44px);
  }

  .honors-carousel {
    padding: 0 88px;
  }

  .slider-arrow {
    width: 58px;
    height: 58px;
  }

  :deep(.honors-swiper) {
    height: min(680px, calc(100vh - 260px));
  }

  .frame-card__visual {
    width: min(100%, 332px);
  }
}

@media (max-width: 767px) {
  .honors-dots {
    right: 10px;
    gap: 9px;
  }

  .hero-shell {
    width: calc(100% - 28px);
    padding: 112px 0 64px;
  }

  .hero-title {
    gap: 12px;
  }

  .hero-title img {
    width: 26px;
    height: 26px;
  }

  .hero-panel p {
    font-size: 15px;
    line-height: 1.72;
  }

  .hero-tabs {
    margin-top: 42px;
  }

  .hero-tabs button {
    min-height: 58px;
    font-size: 16px;
  }

  .honors-section {
    padding: 34px 0 24px;
  }

  .honors-stage {
    width: calc(100% - 22px);
  }

  .honors-breadcrumb {
    margin-bottom: 22px;
    font-size: 13px;
    flex-wrap: wrap;
  }

  .honors-heading {
    gap: 10px;
    margin-bottom: 24px;
  }

  .honors-heading img {
    width: 28px;
    height: 28px;
  }

  .honors-heading__title {
    gap: 14px;
  }

  .honors-heading__line,
  .hero-line {
    width: min(290px, 72vw);
  }

  .honors-carousel {
    padding: 0 16px;
  }

  .honors-carousel--awards {
    margin-top: 18px;
  }

  .slider-arrow {
    width: 46px;
    height: 46px;
    top: auto;
    bottom: -8px;
    transform: none;
  }

  .slider-arrow--prev {
    left: calc(50% - 54px);
  }

  .slider-arrow--next {
    right: calc(50% - 54px);
  }

  .slider-arrow:hover {
    transform: scale(1.04);
  }

  :deep(.honors-swiper) {
    height: auto;
    padding-bottom: 74px;
  }

  .frame-card {
    gap: 12px;
  }

  .frame-card__visual {
    width: min(100%, 240px);
  }

  .frame-card h3 {
    font-size: 1rem;
    line-height: 1.34;
  }

  .awards-tabs {
    flex-wrap: wrap;
    gap: 10px;
  }

  .awards-tabs__item {
    min-width: 148px;
    min-height: 40px;
    font-size: 14px;
  }

  .honors-glow--certificate::before,
  .honors-glow--awards::before {
    right: -34%;
    width: 70vw;
    opacity: 0.55;
  }

  .honors-glow--certificate::after,
  .honors-glow--awards::after {
    width: 24vw;
    height: 24vw;
  }
}
</style>

