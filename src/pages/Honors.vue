<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, House } from 'lucide-vue-next'
import {
  corporateHonors,
  honorsHero,
  honorPageSections,
  projectHonors,
  qualificationCertificates
} from '../components/honors/honorsData'

const route = useRoute()
const activeHonorTab = ref('corporate')
const activeSection = ref('page1')
const animatedSections = ref(['page1'])
const currentCertificatePage = ref(0)
const currentCorporatePage = ref(0)
const currentProjectPage = ref(0)

const honorTabs = [
  { key: 'corporate', label: 'Corporate Honors' },
  { key: 'project', label: 'Project Honors' }
]

const sectionNavItems = [
  { id: 'page2', label: 'Qualification certificate' },
  { id: 'page3', label: 'Honorary Awards' }
]

const activeHonorList = computed(() =>
  activeHonorTab.value === 'corporate' ? corporateHonors : projectHonors
)

const chunkItems = (items, size = 6) =>
  items.reduce((chunks, item, index) => {
    if (index % size === 0) {
      chunks.push([])
    }

    chunks[chunks.length - 1].push(item)
    return chunks
  }, [])

const certificatePages = computed(() => chunkItems(qualificationCertificates, 6))
const corporateHonorPages = computed(() => chunkItems(corporateHonors, 6))
const projectHonorPages = computed(() => chunkItems(projectHonors, 6))

const visibleCertificateItems = computed(
  () => certificatePages.value[currentCertificatePage.value] ?? []
)

const visibleCorporateHonorItems = computed(
  () => corporateHonorPages.value[currentCorporatePage.value] ?? []
)

const visibleProjectHonorItems = computed(
  () => projectHonorPages.value[currentProjectPage.value] ?? []
)

const cyclePage = (direction, pageRef, pageCount) => {
  if (!pageCount) return

  const nextIndex = pageRef.value + direction

  if (nextIndex < 0) {
    pageRef.value = pageCount - 1
    return
  }

  if (nextIndex >= pageCount) {
    pageRef.value = 0
    return
  }

  pageRef.value = nextIndex
}

const goToCertificatePage = (direction) => {
  cyclePage(direction, currentCertificatePage, certificatePages.value.length)
}

const goToCorporatePage = (direction) => {
  cyclePage(direction, currentCorporatePage, corporateHonorPages.value.length)
}

const goToProjectPage = (direction) => {
  cyclePage(direction, currentProjectPage, projectHonorPages.value.length)
}

const markAnimated = (id) => {
  if (!animatedSections.value.includes(id)) {
    animatedSections.value = [...animatedSections.value, id]
  }
}

const handleScroll = () => {
  const sectionIds = honorPageSections.map((item) => item.id)
  const scrollCenter = window.scrollY + window.innerHeight * 0.38

  sectionIds.forEach((id) => {
    const element = document.getElementById(id)

    if (!element) return

    const top = element.offsetTop
    const bottom = top + element.offsetHeight

    if (scrollCenter >= top && scrollCenter < bottom) {
      activeSection.value = id
    }

    if (window.scrollY + window.innerHeight * 0.82 >= top) {
      markAnimated(id)
    }
  })
}

const scrollToSection = (id) => {
  const element = document.getElementById(id)

  if (!element) return

  const headerOffset = id === 'page1' ? 0 : 92
  const position = element.getBoundingClientRect().top + window.scrollY - headerOffset

  window.scrollTo({
    top: position,
    behavior: 'smooth'
  })

  window.history.replaceState(null, '', `/honors#${id}`)
}

const syncHashSection = async () => {
  await nextTick()

  const hash = route.hash?.replace('#', '')

  if (hash && honorPageSections.some((item) => item.id === hash)) {
    scrollToSection(hash)
  } else {
    handleScroll()
  }
}

watch(
  () => route.hash,
  () => {
    syncHashSection()
  }
)

watch(activeHonorTab, () => {
  currentCorporatePage.value = 0
  currentProjectPage.value = 0
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

      <div class="hero-overlay"></div>
      <div class="hero-glow hero-glow--left"></div>
      <div class="hero-glow hero-glow--right"></div>

      <div class="hero-shell">
        <div class="hero-panel" :class="{ 'is-visible': animatedSections.includes('page1') }">
          <div class="hero-breadcrumb">
            <router-link id="honors-breadcrumb-home" to="/">Home</router-link>
            <ChevronRight :size="14" />
            <span>Qualification Honor</span>
          </div>

          <div class="hero-title-row">
            <h1 id="honors-page-title">Qualification Honor</h1>
            <img :src="honorsHero.accent" alt="Honors accent" class="hero-accent" />
          </div>

          <span class="hero-line"></span>

          <p class="hero-description">
            {{ honorsHero.description }}
          </p>
        </div>
      </div>
    </section>

    <nav class="section-nav">
      <div class="section-nav__inner">
        <button
          v-for="item in sectionNavItems"
          :id="`section-nav-${item.id}`"
          :key="item.id"
          class="section-nav__item"
          :class="{ active: activeSection === item.id }"
          type="button"
          @click="scrollToSection(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
    </nav>

    <section id="page2" class="honors-section honors-screen honors-section--certificate">
      <div class="section-backdrop section-backdrop--certificate"></div>
      <div class="section-grid"></div>

      <div class="shell shell--narrow section-shell" :class="{ 'is-visible': animatedSections.includes('page2') }">
        <div class="breadcrumb breadcrumb--dark">
          <House :size="16" />
          <router-link to="/">Home</router-link>
          <ChevronRight :size="14" />
          <span>Qualification honor</span>
        </div>

        <header class="section-heading section-heading--light">
          <div>
            <h2>Qualification Certificate</h2>
            <span class="section-line"></span>
          </div>
          <img
            src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
            alt="Section accent"
          />
        </header>

        <div class="slider-block slider-block--angled">
          <div class="honors-gallery honors-gallery--certificate">
            <article
              v-for="item in visibleCertificateItems"
              :key="`${item.title}-${item.image}`"
              class="honor-card honor-card--certificate"
            >
              <div class="honor-card__sparks">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="honor-card__outer">
                <div class="honor-card__frame">
                  <img class="honor-card__image" :src="item.image" :alt="item.title" />
                </div>
              </div>
              <h3>{{ item.title }}</h3>
            </article>
          </div>

          <div class="gallery-side-dots" aria-hidden="true">
            <button
              v-for="(_, index) in certificatePages"
              :id="`certificate-page-dot-${index}`"
              :key="`certificate-page-dot-${index}`"
              class="gallery-side-dots__item"
              :class="{ active: currentCertificatePage === index }"
              type="button"
              @click="currentCertificatePage = index"
            ></button>
          </div>

          <button id="cert-prev" class="slider-arrow cert-prev" type="button" aria-label="Previous certificate" @click="goToCertificatePage(-1)">
            <img
              src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/cd7207b7-4985-4449-9ffd-acc5ff653fac.png"
              alt="Previous"
            />
          </button>
          <button id="cert-next" class="slider-arrow slider-arrow--next cert-next" type="button" aria-label="Next certificate" @click="goToCertificatePage(1)">
            <img
              src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/1bd7e198-70b1-453e-b508-6b9b9cb84b26.png"
              alt="Next"
            />
          </button>
        </div>
      </div>
    </section>

    <section id="page3" class="honors-section honors-screen honors-section--awards">
      <div class="section-backdrop section-backdrop--awards"></div>
      <div class="section-grid"></div>

      <div class="shell shell--narrow section-shell" :class="{ 'is-visible': animatedSections.includes('page3') }">
        <header class="section-heading section-heading--light">
          <div>
            <h2>Honorary Awards</h2>
            <span class="section-line"></span>
          </div>
          <img
            src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
            alt="Section accent"
          />
        </header>

        <div class="tab-switcher">
          <button
            v-for="tab in honorTabs"
            :id="`honor-tab-${tab.key}`"
            :key="tab.key"
            class="tab-switcher__item"
            :class="{ active: activeHonorTab === tab.key }"
            type="button"
            @click="activeHonorTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <transition name="fade-up" mode="out-in">
          <div :key="activeHonorTab" class="slider-block slider-block--angled slider-block--awards">
            <div v-if="activeHonorTab === 'corporate'" class="honors-gallery honors-gallery--awards">
              <article
                v-for="item in visibleCorporateHonorItems"
                :key="`${activeHonorTab}-${item.title}-${item.image}`"
                class="honor-card honor-card--award"
              >
                <div class="honor-card__sparks">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="honor-card__outer">
                  <div class="honor-card__frame">
                    <img class="honor-card__image" :src="item.image" :alt="item.title" />
                  </div>
                </div>
                <h3>{{ item.title }}</h3>
              </article>
            </div>

            <div v-else class="honors-gallery honors-gallery--awards honors-gallery--project">
              <article
                v-for="item in visibleProjectHonorItems"
                :key="`${activeHonorTab}-${item.title}-${item.image}`"
                class="honor-card honor-card--project"
              >
                <div class="honor-card__sparks">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="honor-card__outer">
                  <div class="honor-card__frame">
                    <img class="honor-card__image" :src="item.image" :alt="item.title" />
                  </div>
                </div>
                <h3>{{ item.title }}</h3>
              </article>
            </div>

            <div class="gallery-side-dots" aria-hidden="true">
              <button
                v-for="(_, index) in activeHonorTab === 'corporate' ? corporateHonorPages : projectHonorPages"
                :id="`awards-page-dot-${activeHonorTab}-${index}`"
                :key="`awards-page-dot-${activeHonorTab}-${index}`"
                class="gallery-side-dots__item"
                :class="{
                  active:
                    (activeHonorTab === 'corporate' ? currentCorporatePage : currentProjectPage) === index
                }"
                type="button"
                @click="
                  activeHonorTab === 'corporate'
                    ? (currentCorporatePage = index)
                    : (currentProjectPage = index)
                "
              ></button>
            </div>

            <template v-if="activeHonorTab === 'corporate'">
              <button
                id="corp-prev"
                class="slider-arrow corp-prev"
                type="button"
                aria-label="Previous corporate honor"
                @click="goToCorporatePage(-1)"
              >
                <img
                  src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/cd7207b7-4985-4449-9ffd-acc5ff653fac.png"
                  alt="Previous"
                />
              </button>
              <button
                id="corp-next"
                class="slider-arrow slider-arrow--next corp-next"
                type="button"
                aria-label="Next corporate honor"
                @click="goToCorporatePage(1)"
              >
                <img
                  src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/1bd7e198-70b1-453e-b508-6b9b9cb84b26.png"
                  alt="Next"
                />
              </button>
            </template>

            <template v-else>
              <button
                id="proj-prev"
                class="slider-arrow proj-prev"
                type="button"
                aria-label="Previous project honor"
                @click="goToProjectPage(-1)"
              >
                <img
                  src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/cd7207b7-4985-4449-9ffd-acc5ff653fac.png"
                  alt="Previous"
                />
              </button>
              <button
                id="proj-next"
                class="slider-arrow slider-arrow--next proj-next"
                type="button"
                aria-label="Next project honor"
                @click="goToProjectPage(1)"
              >
                <img
                  src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/1bd7e198-70b1-453e-b508-6b9b9cb84b26.png"
                  alt="Next"
                />
              </button>
            </template>
          </div>
        </transition>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.honors-page {
  position: relative;
  color: #fff;
  background: #1a1208;
  overflow: clip;
}

.shell {
  width: min(1600px, calc(100% - 48px));
  margin: 0 auto;

  &--narrow {
    width: min(1420px, calc(100% - 64px));
  }
}

.honors-screen {
  position: relative;
  min-height: 100vh;
}

.honors-dots {
  position: fixed;
  right: 18px;
  top: 50%;
  z-index: 35;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transform: translateY(-50%);
}

.honors-dots__item {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
}

.honors-dots__item span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  transition: all 0.25s ease;
}

.honors-dots__item.active span,
.honors-dots__item:hover span {
  width: 8px;
  height: 8px;
  background: #ed1c24;
  box-shadow: 0 0 14px rgba(237, 28, 36, 0.45);
}

.honors-hero {
  display: flex;
  align-items: center;
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
  transform: scale(1.02);
  animation: heroPan 12s ease-in-out infinite alternate;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(18, 12, 4, 0.82) 0%, rgba(22, 16, 6, 0.58) 34%, rgba(22, 16, 6, 0.12) 72%, rgba(22, 16, 6, 0.08) 100%),
    linear-gradient(180deg, rgba(14, 10, 4, 0.06) 0%, rgba(14, 10, 4, 0.18) 100%);
}

.hero-glow {
  position: absolute;
  pointer-events: none;
  filter: blur(18px);
  opacity: 0.35;
}

.hero-glow--left {
  left: -120px;
  bottom: 8%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(188, 35, 32, 0.38), transparent 68%);
}

.hero-glow--right {
  right: -100px;
  top: 14%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(198, 162, 98, 0.28), transparent 70%);
}

.hero-shell {
  position: relative;
  z-index: 2;
  width: min(1440px, calc(100% - 64px));
  margin: 0 auto;
}

.hero-panel {
  max-width: 650px;
  padding-top: 110px;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.9s ease, transform 0.9s ease;
}

.hero-panel.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 15px;
  margin-bottom: 24px;
}

.hero-breadcrumb a:hover {
  color: #ffffff;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hero-title-row h1 {
  margin: 0;
  font-family: 'Times New Roman', serif;
  font-size: clamp(2.4rem, 1.64rem + 1.7vw, 3.7rem);
  line-height: 1.08;
  font-weight: 400;
  letter-spacing: 0.01em;
}

.hero-accent {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.hero-line,
.section-line {
  display: block;
  width: min(270px, 55vw);
  height: 2px;
  margin-top: 16px;
  background: #ed1c24;
  box-shadow: 0 0 16px rgba(237, 28, 36, 0.4);
}

.hero-description {
  max-width: 510px;
  margin-top: 34px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 19px;
  line-height: 1.9;
}

.section-nav {
  position: sticky;
  top: 0;
  z-index: 28;
  margin-top: -74px;
}

.section-nav__inner {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(1020px, calc(100% - 32px));
  margin: 0 auto;
  background: rgba(38, 28, 14, 0.88);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(198, 162, 102, 0.12);
  box-shadow: 0 18px 40px rgba(12, 8, 2, 0.35);
}

.section-nav__item {
  min-height: 72px;
  border: none;
  background: transparent;
  color: rgba(255, 244, 228, 0.78);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.section-nav__item.active,
.section-nav__item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

.honors-section {
  display: flex;
  align-items: center;
  padding: 120px 0 96px;
}

.section-backdrop,
.section-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.section-backdrop--certificate {
  background:
    radial-gradient(ellipse at 12% 88%, rgba(198, 162, 98, 0.18), transparent 40%),
    radial-gradient(ellipse at 88% 18%, rgba(230, 196, 132, 0.18), transparent 24%),
    radial-gradient(circle at 84% 46%, rgba(231, 196, 126, 0.1), transparent 18%),
    radial-gradient(circle at 50% 50%, rgba(198, 162, 98, 0.05), transparent 48%),
    linear-gradient(180deg, #21170b 0%, #2b1f10 30%, #23180b 58%, #1a1208 100%);
}

.section-backdrop--awards {
  background:
    radial-gradient(ellipse at 14% 88%, rgba(198, 162, 98, 0.16), transparent 36%),
    radial-gradient(ellipse at 90% 16%, rgba(228, 193, 124, 0.18), transparent 24%),
    radial-gradient(circle at 84% 44%, rgba(238, 198, 120, 0.1), transparent 18%),
    radial-gradient(circle at 52% 48%, rgba(198, 162, 98, 0.04), transparent 46%),
    linear-gradient(180deg, #1d1409 0%, #271d0f 32%, #201707 58%, #18120a 100%);
}

.section-grid {
  background-image: none;
  opacity: 0;
}

.section-shell {
  position: relative;
  z-index: 2;
  max-width: 1140px;
  opacity: 0;
  transform: translateY(48px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.section-shell.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  font-size: 14px;
}

.breadcrumb--dark {
  color: rgba(255, 255, 255, 0.74);
}

.breadcrumb--dark a {
  color: #ed1c24;
}

.breadcrumb--dark svg {
  color: rgba(255, 255, 255, 0.5);
}

.breadcrumb--dark a:hover {
  color: #ff474d;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 14px;
  margin-bottom: 28px;
  text-align: center;
}

.section-heading--light h2 {
  margin: 0;
  color: #ffffff;
  font-family: 'Times New Roman', serif;
  font-size: clamp(2.08rem, 1.7rem + 0.7vw, 2.75rem);
  font-weight: 700;
  line-height: 1.08;
}

.section-heading img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  margin-bottom: 8px;
}

.slider-block {
  position: relative;
  padding-inline: 76px;
}

.slider-block--angled::before {
  content: '';
  position: absolute;
  left: 76px;
  right: 76px;
  top: 48%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  transform: translateY(-50%);
}

.honors-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px 30px;
  align-items: start;
  min-height: 452px;
}

.honors-gallery--certificate {
  gap: 26px 34px;
}

.honors-gallery--awards {
  gap: 22px 30px;
}

.gallery-side-dots {
  position: absolute;
  top: 48%;
  right: 20px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 7px;
  transform: translateY(-50%);
}

.gallery-side-dots__item {
  width: 7px;
  height: 7px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
  cursor: pointer;
  transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
}

.gallery-side-dots__item.active,
.gallery-side-dots__item:hover {
  background: #ffffff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  transform: scale(1.12);
}

.honor-card {
  position: relative;
  padding-bottom: 4px;
}

.honor-card__sparks span {
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.28);
}

.honor-card__sparks span:nth-child(1) {
  width: 4px;
  height: 4px;
  left: 14px;
  bottom: 58px;
}

.honor-card__sparks span:nth-child(2) {
  width: 4px;
  height: 4px;
  right: 14px;
  top: 38%;
}

.honor-card__sparks span:nth-child(3) {
  width: 4px;
  height: 4px;
  left: 50%;
  bottom: 52px;
  transform: translateX(-50%);
}

.honor-card__outer {
  position: relative;
  padding: 12px;
  border-radius: 3px;
  background: linear-gradient(145deg, rgba(226, 232, 239, 0.42), rgba(118, 128, 145, 0.22));
  border: 1px solid rgba(218, 224, 233, 0.56);
  box-shadow:
    0 14px 28px rgba(0, 0, 0, 0.24),
    inset 1px 1px 0 rgba(255, 255, 255, 0.42),
    inset -1px -1px 0 rgba(72, 82, 96, 0.42);
  transform: perspective(1100px) rotateY(-10deg) skewY(-0.55deg);
  transition: transform 0.38s ease, box-shadow 0.38s ease;
}

.honor-card__outer::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.34), transparent 22%, transparent 74%, rgba(255, 255, 255, 0.08));
  pointer-events: none;
}

.honor-card__frame {
  position: relative;
  overflow: hidden;
  border-radius: 2px;
  aspect-ratio: 0.72;
  background: linear-gradient(180deg, #fffefb 0%, #ece8df 100%);
  box-shadow:
    inset 0 0 0 1px rgba(176, 184, 196, 0.56),
    inset 0 0 0 8px rgba(245, 244, 240, 0.98),
    0 7px 16px rgba(10, 6, 2, 0.16);
}

.honor-card__frame::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(184, 164, 126, 0.22);
  pointer-events: none;
}

.honor-card__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
  transition: transform 0.42s ease, filter 0.42s ease;
}

.honor-card h3 {
  margin: 12px 2px 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  line-height: 1.48;
  font-weight: 400;
  min-height: 34px;
  text-transform: uppercase;
  letter-spacing: 0.012em;
}

.honor-card--project h3 {
  min-height: 48px;
  font-size: 12px;
}

.honor-card:hover .honor-card__outer {
  transform: perspective(1100px) rotateY(-5deg) translateY(-4px);
  box-shadow:
    0 18px 32px rgba(0, 0, 0, 0.28),
    inset 1px 1px 0 rgba(255, 255, 255, 0.36);
}

.honor-card:hover .honor-card__image {
  transform: scale(1.01);
  filter: brightness(1.01);
}

.tab-switcher {
  display: inline-flex;
  gap: 10px;
  margin: 0 auto 20px;
  justify-content: center;
  width: 100%;
}

.tab-switcher__item {
  min-width: 138px;
  min-height: 32px;
  padding: 0 16px;
  border-radius: 1px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: transparent;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.25s ease;
}

.tab-switcher__item.active,
.tab-switcher__item:hover {
  background: #e41218;
  border-color: #e41218;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(200, 22, 26, 0.16);
}

.slider-arrow {
  position: absolute;
  top: 48%;
  left: 26px;
  z-index: 4;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: rgba(34, 21, 7, 0.84);
  backdrop-filter: blur(6px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transform: translateY(-50%);
  transition: transform 0.25s ease, background 0.25s ease;
}

.slider-arrow--next {
  right: 26px;
  left: auto;
}

.slider-arrow img {
  width: 10px;
  height: 10px;
  object-fit: contain;
}

.slider-arrow:hover {
  background: rgba(56, 37, 12, 0.98);
  transform: translateY(-50%) scale(1.06);
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-up-enter-from,
.fade-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@keyframes heroPan {
  from {
    transform: scale(1.02) translateX(0);
  }
  to {
    transform: scale(1.08) translateX(1.2%);
  }
}

@media (max-width: 1199px) {
  .honors-screen {
    min-height: auto;
  }

  .honors-section {
    padding: 96px 0 78px;
  }

  .section-shell {
    max-width: 1000px;
  }

  .slider-block {
    padding-inline: 46px;
  }
}

@media (max-width: 991px) {
  .honors-dots {
    display: none;
  }

  .section-nav {
    margin-top: -38px;
  }

  .section-nav__item {
    min-height: 62px;
    font-size: 16px;
  }

  .hero-description {
    font-size: 17px;
  }

  .section-heading {
    justify-content: center;
  }

  .slider-block {
    padding-inline: 44px;
  }

  .slider-block--angled::before {
    left: 44px;
    right: 44px;
  }

  .honors-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 20px;
    min-height: auto;
  }

  .gallery-side-dots {
    right: 6px;
  }

  .honor-card__outer {
    transform: perspective(1200px) rotateY(-6deg);
  }
}

@media (max-width: 767px) {
  .shell--narrow,
  .hero-shell {
    width: min(100%, calc(100% - 28px));
  }

  .honors-hero {
    min-height: 720px;
    align-items: flex-start;
  }

  .hero-panel {
    padding-top: 132px;
  }

  .hero-title-row {
    align-items: flex-end;
  }

  .hero-title-row h1 {
    font-size: 2.1rem;
  }

  .hero-description {
    max-width: 320px;
    font-size: 15px;
    margin-top: 26px;
  }

  .section-nav__inner {
    width: calc(100% - 14px);
  }

  .section-nav__item {
    min-height: 54px;
    font-size: 14px;
    padding: 0 10px;
  }

  .honors-section {
    padding: 78px 0 68px;
  }

  .section-heading {
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  .section-heading--light h2 {
    font-size: 1.85rem;
  }

  .slider-block {
    padding-inline: 0;
  }

  .slider-block--angled::before,
  .slider-arrow,
  .gallery-side-dots {
    display: none;
  }

  .honors-gallery {
    grid-template-columns: 1fr;
    gap: 16px;
    min-height: auto;
  }

  .tab-switcher {
    display: grid;
    width: 100%;
  }

  .tab-switcher__item {
    width: 100%;
    min-width: 0;
  }

  .honor-card__outer {
    padding: 14px;
    transform: none;
  }

  .honor-card:hover .honor-card__outer {
    transform: translateY(-4px);
  }

  .honor-card h3 {
    margin-top: 14px;
    font-size: 13px;
  }
}
</style>
