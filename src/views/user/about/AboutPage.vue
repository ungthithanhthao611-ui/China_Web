<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-vue-next";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { useAboutPage } from "./composables/useAboutPage";

const route = useRoute();
const router = useRouter();

const { loading, error, aboutView, refresh } = useAboutPage();
// ── Static decoration assets ─────────────────────────────────────────────
const repositoryImageBase = "https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image";
const repoImg = (file) => `${repositoryImageBase}/${file}`;
// const speechTitleSeal = "/images/about/chairman-speech-seal.png";
const timelineTitleIcon = repoImg("bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png");
const timelineHoverBefore = repoImg("e012bd80-11a1-4e5c-b5fa-2eda75b67d66.png");
const timelineHoverAfter = repoImg("dfc20891-e902-474e-8c93-c374b583041d.png");

// ── Computed data ────────────────────────────────────────────────────────
const sectionMeta = computed(() => aboutView.value?.sectionMeta ?? []);
const aboutTabs = computed(() => aboutView.value?.aboutTabs ?? []);
const companyIntroduction = computed(() => aboutView.value?.companyIntroduction?.paragraphs ?? []);
const chairmanSpeech = computed(() => aboutView.value?.chairmanSpeech ?? null);
const cultureBlocks = computed(() => aboutView.value?.cultureBlocks ?? []);
const timelineEntries = computed(() => aboutView.value?.timelineEntries ?? []);
const leadershipItems = computed(() => aboutView.value?.leadershipItems ?? []);
const speechPortrait = computed(() => aboutView.value?.chairmanSpeech?.portrait ?? "");
const heroBannerImage = computed(() => aboutView.value?.hero?.coverImage || "");
const introImage = computed(() => aboutView.value?.companyIntroduction?.coverImage ?? "");
const introVideoUrl = computed(() => aboutView.value?.companyIntroduction?.videoUrl ?? "");
const orgChartImage = computed(() => aboutView.value?.organizationChart?.chartImage ?? "");
const heroHeadline = computed(() => aboutView.value?.hero?.headline ?? "VỀ CHÚNG TÔI");
const heroDescription = computed(() => aboutView.value?.hero?.description ?? "");
const speechSignTitle = computed(() => aboutView.value?.chairmanSpeech?.signTitle ?? "");
const speechSignName = computed(() => aboutView.value?.chairmanSpeech?.signName ?? "");
const speechVision = computed(() => chairmanSpeech.value?.vision ?? "");
const speechMission = computed(() => chairmanSpeech.value?.mission ?? "");
const introTitle = computed(() => aboutView.value?.companyIntroduction?.title ?? "Giới thiệu công ty");
const speechTitle = computed(() => aboutView.value?.chairmanSpeech?.title ?? "Tầm nhìn & Sứ mệnh");
const orgChartTitle = computed(() => aboutView.value?.organizationChart?.title ?? "Sơ đồ tổ chức");
const videoButtonLabel = computed(
  () => aboutView.value?.companyIntroduction?.videoButtonLabel || "VIDEO +",
);
const cultureTitle = computed(
  () =>
    aboutView.value?.cultureSection?.title ||
    aboutView.value?.cultureBlocks?.[0]?.title ||
    "Giá trị cốt lõi",
);
const cultureImage = computed(
  () =>
    aboutView.value?.cultureSection?.coverImage ||
    "https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/3f9cf9fc-c3f2-4cd5-a6e7-6c1f19a596b0.jpg",
);
const timelineTitle = computed(
  () => aboutView.value?.timelineSectionTitle || "Lịch sử phát triển",
);
const leadershipTitle = computed(
  () => aboutView.value?.leadershipSectionTitle || "Ban lãnh đạo",
);

const activeSection = ref("page1");
const activeCultureTitle = ref("Giá trị cốt lõi");
const visibleSections = ref(new Set(["page1"]));
const videoOpen = ref(false);
const chartOpen = ref(false);
const timelineSwiper = ref(null);
const timelineAtStart = ref(true);
const timelineAtEnd = ref(false);
const leadershipSwiper = ref(null);
const introScroller = ref(null);
const speechScroller = ref(null);
const syncingRouteFromSection = ref(false);

let observer;

const activeCultureTitleInit = computed(() => cultureBlocks.value?.[0]?.title ?? "");
watch(activeCultureTitleInit, (val) => {
  if (val && !cultureBlocks.value.some((item) => item.title === activeCultureTitle.value)) {
    activeCultureTitle.value = val;
  }
}, { immediate: true });

const currentCultureBlock = computed(
  () => cultureBlocks.value.find((item) => item.title === activeCultureTitle.value) ?? cultureBlocks.value[0] ?? { title: '', items: [] }
);

const timelineSlides = computed(() =>
  timelineEntries.value.map((item) => ({
    ...item,
    type: item.image ? "ad-image" : "no-image"
  }))
);

const timelineModules = [Autoplay];

const updateTimelineSwiperState = (instance) => {
  if (!instance) {
    return;
  }

  timelineAtStart.value = instance.isBeginning;
  timelineAtEnd.value = instance.isEnd;
};

const bindTimelineSwiper = (instance) => {
  timelineSwiper.value = instance;
  updateTimelineSwiperState(instance);
};

const slideTimeline = (direction) => {
  const instance = timelineSwiper.value;
  if (!instance) {
    return;
  }

  if (direction < 0) {
    instance.slidePrev();
  } else {
    instance.slideNext();
  }
};

const bindLeadershipSwiper = (instance) => {
  leadershipSwiper.value = instance;
};

const slideLeadership = (direction) => {
  const instance = leadershipSwiper.value;
  if (!instance) {
    return;
  }

  if (direction < 0) {
    instance.slidePrev();
  } else {
    instance.slideNext();
  }
};

const getTargetSectionId = () => {
  if (route.hash) {
    return route.hash.replace("#", "");
  }

  const matched = sectionMeta.value.find((item) => item.route === route.path && item.id !== "page1");
  if (matched && route.path !== "/about/company-introduction") {
    return matched.id;
  }

  return "page1";
};

const isSectionVisible = (id) => visibleSections.value.has(id);

const isTabActive = (id) => {
  if (id === "page2") {
    return activeSection.value === "page1" || activeSection.value === "page2";
  }

  return activeSection.value === id;
};

const scrollToSection = (id, smooth = true) => {
  const element = document.getElementById(id);
  if (!element) {
    return;
  }

  activeSection.value = id;
  element.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
};

const resetInnerScrollers = (id) => {
  if (id === "page2" && introScroller.value) {
    introScroller.value.scrollTop = 0;
  }

  if (id === "page3" && speechScroller.value) {
    speechScroller.value.scrollTop = 0;
  }
};

const navigateToSection = async (meta) => {
  await router.push({ path: meta.route, hash: meta.hash });
  await nextTick();
  resetInnerScrollers(meta.id);
  scrollToSection(meta.id, true);
};

const syncActiveSectionToRoute = async (id) => {
  const matched = sectionMeta.value.find((item) => item.id === id);
  if (!matched) {
    return;
  }

  if (route.path === matched.route && route.hash === matched.hash) {
    return;
  }

  syncingRouteFromSection.value = true;

  try {
    await router.replace({ path: matched.route, hash: matched.hash });
    await nextTick();
  } finally {
    syncingRouteFromSection.value = false;
  }
};

const syncRouteToScroll = async () => {
  await nextTick();
  const targetId = getTargetSectionId();
  resetInnerScrollers(targetId);
  scrollToSection(targetId, false);
};

const updateVisibleSections = (entries) => {
  const nextSet = new Set(visibleSections.value);

  entries.forEach((entry) => {
    const id = entry.target.id;

    if (entry.isIntersecting) {
      nextSet.add(id);
    } else {
      nextSet.delete(id);
    }
  });

  visibleSections.value = nextSet;

  const bestEntry = entries
    .filter((entry) => entry.isIntersecting)
    .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

  if (bestEntry?.target?.id) {
    activeSection.value = bestEntry.target.id;
  }
};

const setupObserver = () => {
  observer?.disconnect();
  observer = new IntersectionObserver(updateVisibleSections, {
    threshold: [0.2, 0.35, 0.55, 0.75],
    rootMargin: "-12% 0px -18% 0px"
  });

  sectionMeta.value.forEach((section) => {
    const element = document.getElementById(section.id);
    if (element) {
      observer.observe(element);
    }
  });
};

watch(activeSection, (id) => {
  syncActiveSectionToRoute(id);
});
watch(
  () => route.fullPath,
  () => {
    if (syncingRouteFromSection.value) {
      return;
    }

    syncRouteToScroll();
  },
  { immediate: true }
);

// Re-setup observer when API data arrives (sections now exist in DOM)
watch(aboutView, async (val) => {
  if (val) {
    await nextTick();
    setupObserver();
    syncRouteToScroll();
  }
});

onMounted(async () => {
  await nextTick();
  if (aboutView.value) {
    setupObserver();
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <div class="about-page">
    <!-- Loading state -->
    <div v-if="loading" class="about-loading">
      <div class="about-loading-spinner" />
      <p>Loading...</p>
    </div>

    <div v-else-if="error" class="about-error">
      <p>{{ error }}</p>
      <button type="button" class="about-retry" @click="refresh">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!aboutView" class="about-empty">
      <p>About page content is currently unavailable.</p>
      <button type="button" class="about-retry" @click="refresh">Reload</button>
    </div>

    <!-- Main content -->
    <template v-else>
    <div class="about-dots">
      <button
        v-for="dot in sectionMeta"
        :key="dot.id"
        :class="['about-dot', { active: activeSection === dot.id }]"
        :aria-label="dot.title"
        type="button"
        @click="navigateToSection(dot)"
      />
    </div>

    <section id="page1" class="about-hero">
      <img class="hero-image hero-image-pc" :src="heroBannerImage || '/images/banner/banner3.jpg'" alt="About us banner" />
      <img class="hero-image hero-image-mobile" :src="heroBannerImage || '/images/banner/banner3.jpg'" alt="About us mobile banner" />
      <div class="hero-overlay" />

      <div :class="['hero-content', { 'is-visible': isSectionVisible('page1') }]">
        <div class="hero-title-row">
          <h1>{{ heroHeadline }}</h1>
        </div>
        <div class="hero-line" />
        <p class="hero-description">
          {{ heroDescription }}
        </p>
      </div>

      <div class="hero-tabbar">
        <button
          v-for="tab in aboutTabs"
          :key="tab.id"
          :class="['hero-tab', { active: isTabActive(tab.id) }]"
          type="button"
          @click="navigateToSection(tab)"
        >
          {{ tab.title }}
        </button>
      </div>
    </section>

    <section id="page2" :class="['about-section intro-section', { 'is-visible': isSectionVisible('page2') }]">
      <div class="section-shell">
        <div class="section-heading intro-heading">
          <h2>{{ introTitle }}</h2>
        </div>

        <div class="intro-layout">
          <div class="intro-visual">
            <img class="intro-main" :src="introImage" alt="Company introduction" />
            <div class="intro-watermark" />
            <div class="intro-bottom">
              <button
                class="video-trigger"
                type="button"
                :disabled="!introVideoUrl"
                @click="introVideoUrl && (videoOpen = true)"
              >
                <span class="video-icon">
                  <Play :size="16" fill="currentColor" />
                </span>
                <span>{{ videoButtonLabel }}</span>
              </button>
            </div>
          </div>

          <div ref="introScroller" class="intro-copy intro-scroller">
            <p v-for="paragraph in companyIntroduction" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section id="page3" :class="['about-section speech-section', { 'is-visible': isSectionVisible('page3') }]">
      <div class="section-shell speech-shell">
        <div class="speech-heading">
          <p class="speech-title">
            <span>{{ speechTitle }}</span>
          </p>
        </div>

        <div class="split-layout reverse speech-layout">
          <div class="speech-copy-panel">
            <div ref="speechScroller" class="split-copy speech-scroller">
              <article v-if="speechVision" class="speech-block">
                <h3>Tầm nhìn</h3>
                <p>{{ speechVision }}</p>
              </article>
              <article v-if="speechMission" class="speech-block">
                <h3>Sứ mệnh</h3>
                <p>{{ speechMission }}</p>
              </article>
              <div class="speech-signoff">
                <div class="signature-block">
                  <span>{{ speechSignTitle }}</span>
                  <strong>{{ speechSignName }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="split-media">
            <img :src="speechPortrait" alt="Chairman's speech" />
          </div>

          <!-- <img class="signature-mark speech-signature-outside" :src="speechSignature" alt="Signature" /> -->
        </div>
      </div>
    </section>

    <section id="page4" :class="['about-section chart-section', { 'is-visible': isSectionVisible('page4') }]">
      <div class="section-shell chart-shell">
        <div class="section-heading chart-heading">
          <p class="chart-title">
            <span>{{ orgChartTitle }}</span>
          </p>
        </div>

        <button class="chart-card" type="button" @click="chartOpen = true">
          <img :src="orgChartImage" alt="Organization chart" />
        </button>
      </div>
    </section>

    <section id="page5" :class="['about-section culture-section', { 'is-visible': isSectionVisible('page5') }]">
      <div class="section-shell">
        <div class="section-heading">
          <span class="eyebrow">{{ heroHeadline }}</span>
          <h2>{{ cultureTitle }}</h2>
        </div>

        <div class="culture-layout">
          <div class="culture-image">
            <img :src="cultureImage" alt="Corporate culture" />
          </div>

          <div class="culture-panel">
            <article class="culture-card active">
              <h3>{{ currentCultureBlock.title }}</h3>
              <ul>
                <li v-for="item in currentCultureBlock.items" :key="item.label">
                  <strong>{{ item.label }}:</strong>
                  <span>{{ item.text }}</span>
                </li>
              </ul>
            </article>

            <div class="culture-tabs">
              <button
                v-for="block in cultureBlocks"
                :key="block.title"
                :class="['culture-tab', { active: activeCultureTitle === block.title }]"
                type="button"
                @click="activeCultureTitle = block.title"
              >
                {{ block.title }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="page6" :class="['about-section timeline-section', { 'is-visible': isSectionVisible('page6') }]">
      <div class="section-shell timeline-shell">
        <div class="timeline-heading">
          <p class="timeline-title">
            <i>{{ timelineTitle }}</i>
          </p>
          <span class="timeline-heading-rule" />
        </div>

        <div class="timeline-stage page6-con">
          <button
            type="button"
            :class="['timeline-nav is-prev', { disabled: timelineAtStart }]"
            aria-label="Previous slide"
            :disabled="timelineAtStart"
            @click="slideTimeline(-1)"
          >
            <ChevronLeft :size="24" />
          </button>
          <button
            type="button"
            :class="['timeline-nav is-next', { disabled: timelineAtEnd }]"
            aria-label="Next slide"
            :disabled="timelineAtEnd"
            @click="slideTimeline(1)"
          >
            <ChevronRight :size="24" />
          </button>

          <div class="timeline-track">
            <div class="timeline-wave" aria-hidden="true" />
            <Swiper
              class="timeline-swiper"
              :modules="timelineModules"
              :slides-per-view="1"
              :speed="700"
              :space-between="30"
              :autoplay="{ delay: 3200, disableOnInteraction: false, pauseOnMouseEnter: true }"
              :breakpoints="{ 
                768: { slidesPerView: 2, spaceBetween: 50 },
                1025: { slidesPerView: timelineSlides.length <= 2 ? 2 : 5, spaceBetween: 80 } 
              }"
              :grab-cursor="true"
              @swiper="bindTimelineSwiper"
              @slideChange="updateTimelineSwiperState"
              @transitionEnd="updateTimelineSwiperState"
            >
              <SwiperSlide
                v-for="item in timelineSlides"
                :key="`${item.year}-${item.month}-${item.title}`"
                :class="['timeline-slide', item.type]"
              >
                <div class="timeline-slide-inner">
                  <div class="slide-bg" />
                  <div class="sw-image">
                    <div class="bg-img">
                      <template v-if="item.image">
                        <div class="img_con">
                          <img :src="item.image" :alt="item.title" class="h_pics" loading="lazy" />
                        </div>
                        <img :src="timelineHoverBefore" alt="" class="hover_before" />
                        <img :src="timelineHoverAfter" alt="" class="hover_after" />
                      </template>
                      <div v-else class="bg-img-bg" />
                    </div>

                    <div class="sw-f">
                       <p class="year">{{ item.year }}{{ item.month ? '.' : '' }}</p>
                       <p v-if="item.month" class="month">{{ item.month }}</p>
                    </div>

                    <div class="sw-i">
                      <p class="tit">{{ item.title }}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>
    </section>

    <section id="page7" :class="['about-section leadership-section', { 'is-visible': isSectionVisible('page7') }]">
      <div class="section-shell leadership-shell">
        <div class="leadership-heading">
          <h2 class="leadership-title">
            <span>{{ leadershipTitle }}</span>
          </h2>
        </div>

        <div class="leadership-stage">
          <div v-if="leadershipItems.length > 1" class="leadership-nav">
            <button type="button" class="is-prev" @click="slideLeadership(-1)">
              <ChevronLeft :size="34" />
            </button>
            <button type="button" class="is-next" @click="slideLeadership(1)">
              <ChevronRight :size="34" />
            </button>
          </div>

          <div class="leadership-fade" />

          <div class="leadership-carousel">
            <Swiper
              class="leadership-swiper"
              :slides-per-view="1"
              :space-between="0"
              :speed="700"
              :breakpoints="{
                768: { slidesPerView: 'auto', spaceBetween: 50 },
                1600: { slidesPerView: 'auto', spaceBetween: 100 }
              }"
              @swiper="bindLeadershipSwiper"
            >
              <SwiperSlide v-for="item in leadershipItems" :key="`${item.name}-${item.role}-${item.image}`">
                <article class="leadership-card">
                  <div class="leadership-card-frame">
                    <div class="leadership-photo">
                      <img :src="item.image" alt="Leadership care" />
                    </div>
                    <strong class="leadership-year">{{ item.role }}</strong>
                  </div>
                  <p class="leadership-copy">{{ item.name }}</p>
                </article>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </div>
    </section>


    <div v-if="videoOpen && introVideoUrl" class="about-modal" @click.self="videoOpen = false">
      <button class="close-button" type="button" @click="videoOpen = false">
        <X :size="22" />
      </button>
      <video controls autoplay playsinline :src="introVideoUrl" />
    </div>

    <div v-if="chartOpen" class="about-modal light" @click.self="chartOpen = false">
      <button class="close-button" type="button" @click="chartOpen = false">
        <X :size="22" />
      </button>
      <img class="chart-modal-image" :src="orgChartImage" alt="Organization chart large" />
    </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.about-page {
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(41, 63, 101, 0.14), transparent 34%),
    linear-gradient(180deg, #f4f0e8 0%, #f8f6f1 14%, #f4f1ea 100%);
  color: #1f2430;
  overflow: clip;
}

.about-dots {
  position: fixed;
  right: 34px;
  top: 50%;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transform: translateY(-50%);
}

.about-dot {
  width: 11px;
  height: 11px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 0 0 1px rgba(186, 157, 118, 0.55);
  cursor: pointer;
  transition: transform 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;

  &.active {
    background: #d6171f;
    box-shadow: 0 0 0 6px rgba(214, 23, 31, 0.12);
    transform: scale(1.16);
  }
}

.about-hero,
.about-section {
  position: relative;
  scroll-margin-top: 96px;
}

.about-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: #10243c;
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-image-mobile {
  display: none;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(12, 27, 51, 0.86) 0%, rgba(19, 35, 55, 0.78) 31%, rgba(17, 31, 48, 0.48) 54%, rgba(14, 26, 41, 0.16) 100%),
    linear-gradient(180deg, rgba(5, 12, 22, 0.36) 0%, rgba(5, 12, 22, 0.1) 46%, rgba(5, 12, 22, 0.34) 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: min(100%, 1680px);
  margin: 0 auto;
  padding: 180px 96px 180px;
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.8s ease, transform 0.8s ease;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 18px;

  h1 {
    margin: 0;
    color: #fff;
    font-size: clamp(40px, 3.5vw, 68px);
    line-height: 0.96;
    font-weight: 500;
    letter-spacing: 0.02em;
    font-family: "Times New Roman", Georgia, serif;
  }

  img {
    width: clamp(48px, 3.5vw, 68px);
    height: auto;
  }
}

.hero-line {
  width: min(650px, 52vw);
  height: 2px;
  background: linear-gradient(90deg, rgba(198, 26, 33, 0.96) 0%, rgba(198, 26, 33, 0.9) 80%, rgba(198, 26, 33, 0.18) 100%);
  margin-bottom: 52px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    right: -6px;
    top: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c61a21;
    transform: translateY(-50%);
  }
}

.hero-description {
  margin: 0;
  max-width: 760px;
  color: rgba(255, 255, 255, 0.96);
  font-size: clamp(17px, 1.16vw, 26px);
  line-height: 1.7;
}

.hero-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0;
  padding: 0 28px;
  background: rgba(10, 23, 42, 0.78);
  backdrop-filter: blur(12px);
  border-top: 1px solid rgba(226, 198, 163, 0.12);
}

.hero-tab {
  min-height: 112px;
  padding: 22px 16px;
  border: 0;
  border-right: 1px solid rgba(226, 198, 163, 0.24);
  background: transparent;
  color: #e2bd8e;
  font-size: clamp(14px, 0.96vw, 18px);
  line-height: 1.35;
  cursor: pointer;
  transition: color 0.24s ease, background 0.24s ease;

  &:last-child {
    border-right: 0;
  }

  &:hover,
  &.active {
    color: #f1d3ab;
    background: rgba(255, 255, 255, 0.04);
  }
}

.about-section {
  min-height: 100vh;
  padding: 80px 0;
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateY(48px);
  transition: opacity 0.78s ease, transform 0.78s ease;

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-shell {
  width: min(100%, 1660px);
  margin: 0 auto;
  padding: 0 64px;
}

.section-heading {
  margin-bottom: 42px;

  &.with-controls {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
  }

  h2 {
    display: inline-flex;
    align-items: center;
    gap: 18px;
    margin: 12px 0 0;
    color: #1f2430;
    font-size: clamp(28px, 2.2vw, 42px);
    line-height: 1.06;
    font-weight: 500;
    font-family: "Times New Roman", Georgia, serif;

    // &::after {
    //   content: "";
    //   width: 44px;
    //   height: 44px;
    //   background: url("/images/daumoc.png") center/contain no-repeat;
    //   flex: none;
    // }
  }

  &::after {
    content: "";
    display: block;
    width: min(580px, 48vw);
    height: 2px;
    margin-top: 14px;
    background: linear-gradient(90deg, rgba(198, 26, 33, 0.96) 0%, rgba(198, 26, 33, 0.9) 84%, rgba(198, 26, 33, 0.22) 100%);
  }
}

.eyebrow {
  color: #c49a6d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.36em;
  text-transform: uppercase;
}

.slider-controls {
  display: inline-flex;
  gap: 12px;

  button {
    width: 46px;
    height: 46px;
    border: 1px solid rgba(180, 140, 93, 0.28);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.76);
    color: #7d5a38;
    cursor: pointer;
    transition: background 0.24s ease, color 0.24s ease, transform 0.24s ease;

    &:hover {
      background: #0f2238;
      color: #e5c494;
      transform: translateY(-1px);
    }
  }
}

.intro-section {
  min-height: 100vh;
  padding-top: 132px;
  padding-bottom: 0;
  background:
    url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/984d29d8-d072-49f8-97ea-0fc988e58dda.jpeg")
      no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 116px;
    width: 108px;
    height: 230px;
    background:
      url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/162aa6b5-0cd1-4ba4-b475-00319e4e4d50.jpeg")
        no-repeat center center / cover;
  }

  &::after {
    display: none;
  }
}

.intro-heading {
  position: relative;
  z-index: 2;
  margin-bottom: 30px;

  h2 {
    font-size: clamp(34px, 3vw, 48px);
    letter-spacing: 0;
  }

  &::after {
    width: min(580px, 30vw);
    margin-top: 16px;
    position: relative;
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ce0021;
  }
}

.intro-section .section-shell {
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 0;
}

.intro-layout {
  position: relative;
  min-height: calc(100vh - 248px);
}

.intro-visual {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(44vw, 830px);
  height: 85vh;
  z-index: 1;
  transform: translateX(0);
}

.intro-main {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right bottom;
}

.intro-watermark {
  display: none;
}

.intro-bottom {
  position: absolute;
  left: -9%;
  bottom: 2%;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 2;
}

.intro-decoration {
  display: none;
}

.video-trigger {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #757575;
  cursor: pointer;
  box-shadow: none;
  font-size: 16px;
  letter-spacing: 0.02em;
}

.video-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 68px;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  box-shadow: none;
  background-image: url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4407f1e1-9209-4baa-9a9b-52e2e8262e37.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  position: relative;

  :deep(svg) {
    width: 12px;
    height: 12px;
    position: absolute;
    top: 59%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #f3c7a2;
    border-radius: 999px;
    padding: 10px;
    box-sizing: content-box;
  }
}

.intro-copy,
.split-copy {
  display: grid;
  gap: 18px;

  p {
    margin: 0;
    color: #aa8760;
    font-size: 20px;
    line-height: 2;
  }
}

.intro-copy {
  position: relative;
  z-index: 2;
  width: 35%;
  max-width: none;
  margin-left: 60px;
  padding: 0 0 8px 40px;
  position: relative;
  direction: rtl;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 16px;
    width: 6px;
    background: linear-gradient(180deg, #c6a277 0 22%, #ececec 22% 100%);
  }

  p {
    color: #896f56;
    font-size: 17px;
    line-height: 2;
    letter-spacing: 0.01em;
    word-spacing: 0.1em;
    direction: ltr;
    text-align: justify;
  }
}

.intro-scroller {
  max-height: 50vh;
  overflow-y: auto;
  padding-right: 0;
  scrollbar-width: thin;
  scrollbar-color: #bf9a78 #e4e4e4;

  &::-webkit-scrollbar {
    width: 4px;
    background: #e4e4e4;
  }

  &::-webkit-scrollbar-thumb {
    background: #bf9a78;
    border-radius: 999px;
  }
}

.speech-copy-panel {
  width: 60.41%;
  max-width: none;
  margin-left: 0;
  min-height: 0;
}

.speech-layout .split-copy {
  width: min(100%, 820px);
  max-width: none;
  margin-left: 0;
  padding-left: 40px;
  position: relative;
  direction: ltr;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 0;
    width: 6px;
    background: linear-gradient(180deg, #c6a277 0 20%, #ececec 20% 100%);
  }
}

.speech-scroller {
  display: block;
  margin-top: clamp(42px, 8vh, 92px);
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  p {
    margin: 0;
    color: #896f56;
    font-size: 18px;
    line-height: 2;
    text-align: justify;
  }
}

.speech-signoff {
  display: grid;
  justify-items: end;
  gap: 4px;
  margin-top: 26px;
  padding-right: 14px;
}

.speech-intro {
  display: grid;
  gap: 2px;
  margin-bottom: 6px;

  p {
    color: #c49a6d;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.8;
  }
}

.speech-section,
.culture-section,
.timeline-section {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 245, 239, 0.94)),
    radial-gradient(circle at 85% 28%, rgba(212, 205, 194, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(220, 214, 206, 0.16) 0%, transparent 36%);
}

.timeline-section {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.82)),
    url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/ee74b14e-1476-4876-9329-4584b1c40a41.jpg")
      no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 16% 34%, rgba(226, 223, 216, 0.28), transparent 26%),
      radial-gradient(circle at 84% 62%, rgba(223, 218, 210, 0.16), transparent 24%);
    opacity: 0.58;
  }
}

.speech-section {
  position: relative;
  min-height: 100vh;
  padding-top: 118px;
  padding-bottom: 44px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.22)),
    url("/images/about/chairman-speech-bg.jpg") no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 61.405%;
    height: 40px;
    background: #949494;
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 38.595%;
    height: 40px;
    background: #9d000b;
  }
}

.speech-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 140px;
}

.speech-heading {
  margin-bottom: 0;
}

.speech-title {
  display: inline-flex;
  align-items: center;
  gap: 35px;
  margin: 0;
  padding: 0 5% 16px 0;
  border-bottom: 1px solid #ce0021;
  position: relative;

  span {
    color: #333333;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(34px, 3vw, 52px);
    line-height: 1.08;
  }

  img {
    width: 40px;
    flex: 0 0 auto;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ce0021;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.split-layout {
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  gap: 54px;
  align-items: center;

  &.reverse {
    grid-template-columns: 1.08fr 0.92fr;
  }
}

.split-media img {
  width: 100%;
  min-height: 500px;
  max-height: 75vh;
  object-fit: cover;
  border-radius: 0;
  box-shadow: none;
}

.speech-layout.reverse {
  grid-template-columns: 60.41% 31.2%;
  gap: 0;
  align-items: center;
  position: relative;
  min-height: calc(100vh - 204px);
}

.speech-layout .split-media {
  position: absolute;
  right: 7.395%;
  top: 50%;
  width: 31.2%;
  height: 86%;
  transform: translateY(-50%);
}

.speech-layout .split-media img {
  width: 100%;
  height: 100%;
  min-height: 0;
  object-fit: contain;
  background: transparent;
}

.signature-block {
  display: grid;
  justify-items: end;
  gap: 4px;
  color: #c49a6d;

  span {
    font-size: 17px;
    font-weight: 700;
  }

  strong {
    font-size: 22px;
    font-weight: 700;
  }
}

.signature-mark {
  width: 108px;
  opacity: 0.9;
}

.speech-signature-outside {
  position: absolute;
  left: calc(60.41% - 94px);
  bottom: 34px;
  width: 118px;
}

.chart-section {
  position: relative;
  min-height: 100vh;
  padding-top: 118px;
  padding-bottom: 44px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.18)),
    url("/images/about/organization-chart-bg.jpg") no-repeat center center / cover;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 61.405%;
    height: 40px;
    background: #949494;
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: 0;
    width: 38.595%;
    height: 40px;
    background: #9d000b;
  }
}

.chart-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 140px;
}

.chart-heading {
  margin-bottom: 0;
}

.chart-title {
  display: inline-flex;
  align-items: center;
  gap: 35px;
  margin: 0;
  padding: 0 5% 16px 0;
  border-bottom: 1px solid #ce0021;
  position: relative;

  span {
    color: #333333;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(34px, 3vw, 52px);
    line-height: 1.08;
  }

  img {
    width: 40px;
    flex: 0 0 auto;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: -3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ce0021;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.chart-card {
  width: 100%;
  margin-top: clamp(34px, 6vh, 72px);
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  cursor: zoom-in;
  box-shadow: none;
  position: relative;

  img {
    width: 64%;
    max-width: 64%;
    max-height: 62vh;
    height: auto;
    display: block;
    margin: 3vw auto 0;
    object-fit: contain;
  }
}

.culture-section {
  color: #2b2d31;
}

.culture-layout {
  display: grid;
  grid-template-columns: 1.06fr 0.94fr;
  gap: 40px;
  align-items: start;
}

.culture-image img {
  width: 100%;
  min-height: 500px;
  max-height: 70vh;
  object-fit: cover;
  border-radius: 0;
}

.culture-panel {
  display: grid;
  gap: 24px;
}

.culture-card {
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;

  h3 {
    margin: 0 0 16px;
    color: #292c32;
    font-size: 20px;
    font-weight: 500;
    padding-bottom: 12px;
    border-bottom: 2px solid #d21a28;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 16px;
  }

  li {
    display: grid;
    gap: 1px;
    color: #6f6f6f;
    font-size: 15px;
    line-height: 1.4;
  }

  strong {
    color: #141414;
    font-weight: 600;
  }
}

.culture-tabs {
  display: grid;
  gap: 18px;
}

.culture-tab {
  text-align: left;
  padding: 0 0 12px;
  border: 0;
  border-bottom: 1px solid rgba(179, 179, 179, 0.4);
  background: transparent;
  color: #a3a3a3;
  font-size: 18px;
  cursor: pointer;
  transition: color 0.24s ease;

  &.active {
    color: #6b6b6b;
  }
}

.partner-section {
  background: linear-gradient(180deg, #beaa8c 0%, #bca788 100%);
}

.timeline-stage {
  position: relative;
  min-height: 70vh;
  padding: 18px 0 0;
}

.timeline-track {
  position: relative;
  overflow: visible;
  height: 70vh;
  margin-top: 40px;
  padding: 0 0 12px;
}

.timeline-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
}

.timeline-heading {
  display: grid;
  justify-items: center;
  margin-bottom: 24px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.timeline-section.is-visible .timeline-heading {
  opacity: 1;
  transform: translateY(0);
}

.timeline-title {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin: 0;

  i {
    color: #2c3038;
    font-style: normal;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(40px, 4vw, 60px);
    line-height: 1;
  }
}

.timeline-title-icon {
  width: clamp(42px, 2.6vw, 54px);
  height: clamp(42px, 2.6vw, 54px);
  object-fit: contain;
}

.timeline-heading-rule {
  position: relative;
  display: block;
  width: min(620px, 44vw);
  height: 2px;
  margin-top: 16px;
  background: linear-gradient(90deg, rgba(198, 26, 33, 0) 0%, rgba(198, 26, 33, 0.94) 7%, rgba(198, 26, 33, 0.94) 93%, rgba(198, 26, 33, 0) 100%);
  transform: scaleX(0.72);
  transform-origin: center;
  transition: transform 0.9s ease 0.1s;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c61a21;
    transform: translateY(-50%);
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.timeline-section.is-visible .timeline-heading-rule {
  transform: scaleX(1);
}

.page6-con {
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 1s ease 0.4s, transform 1s ease 0.4s;
}

.timeline-section.is-visible .page6-con {
  opacity: 1;
  transform: translateY(0);
}

.timeline-wave {
  position: absolute;
  left: 0;
  right: 0;
  top: 48%;
  height: 112px;
  pointer-events: none;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 420 120'%3E%3Cpath d='M0 70 C50 30 110 30 160 70 S270 110 320 70 S390 30 420 70' fill='none' stroke='%23131313' stroke-width='8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
      0 50% / 420px 118px repeat-x;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s;
  filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.12));
}

.timeline-section.is-visible .timeline-wave {
  opacity: 0.92;
  transform: translateY(0);
}

.timeline-swiper {
  height: 100%;
  overflow: visible;
}

.timeline-swiper :deep(.swiper-wrapper) {
  align-items: flex-start;
  justify-content: center;
}

.timeline-swiper :deep(.swiper-slide) {
  width: 337px;
  height: 100%;
  display: flex;
  align-items: flex-start;
  opacity: 1;
  transform: none;
  filter: none;
}

.timeline-swiper :deep(.swiper-slide:nth-child(2n)) {
  align-items: flex-end;
}

.timeline-swiper :deep(.swiper-slide:nth-child(2n)) .timeline-slide-inner {
  margin-bottom: 40px;
}

.timeline-slide-inner {
  position: relative;
  width: 100%;
  margin-top: 40px;
  padding: 40px;
}

.timeline-slide.ad-image .timeline-slide-inner {
  margin-top: 0;
  padding: 0;
}

.slide-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  background: url("https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/feaced7b-b8ad-4ded-9680-7576697e7ba6.png")
    no-repeat center center / 100% 100%;
  transform: translate(-50%, -50%);
  transition: width 0.8s ease, height 0.8s ease;
}

.sw-image {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  height: auto;
  z-index: 2;
}

.timeline-slide.ad-image .sw-image {
  align-items: flex-start;
}

.timeline-slide.no-image .sw-image {
  display: block;
}

.bg-img {
  position: relative;
  width: 226px;
  height: 176px;
  margin-bottom: 0;
  transform: none;
  transition: none;
}

.img_con {
  position: absolute;
  left: 14%;
  top: 16.8%;
  z-index: 2;
  width: 74%;
  height: 69%;
  border-radius: 0;
  overflow: hidden;
  transform: none;
  box-shadow: none;
}

.h_pics {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: none;
  filter: none;
}

.hover_before,
.hover_after,
.bg-img-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hover_before,
.hover_after {
  pointer-events: none;
  object-fit: contain;
  transition: opacity 0.5s ease;
}

.hover_before {
  opacity: 1;
  visibility: visible;
}

.hover_after {
  z-index: 3;
  opacity: 0;
}

.bg-img-bg {
  background:
    radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.88), rgba(248, 246, 241, 0.92) 58%, rgba(223, 220, 214, 0.55) 70%, rgba(223, 220, 214, 0) 100%);
}

.sw-f,
.sw-i {
  transition: color 0.35s ease;
}

.sw-f {
  flex: 0 0 30%;
  display: block;
  color: #b48b61;
  opacity: 1;
  transform: none;
}

.sw-f .year,
.sw-f .month {
  margin: 0;
  font-family: "Times New Roman", Georgia, serif;
  line-height: 0.92;
}

.sw-f .year {
  font-size: 60px;
  font-weight: 600;
}

.sw-f .month {
  font-size: 46px;
}

.sw-i {
  flex: 1;
  padding: 0 0 0 20px;
  opacity: 1;
  transform: none;
}

.sw-i .tit {
  margin: 0;
  color: #6c6964;
  font-size: 16px;
  line-height: 1.66;
  text-align: left;
  font-weight: 400;
  margin-top: 24px;
}

.timeline-slide.no-image .bg-img {
  width: 172px;
  height: 172px;
  background: transparent;
  box-shadow: none;
}

.timeline-slide.no-image .bg-img-bg {
  background: transparent;
  opacity: 0;
  box-shadow: none;
}

.timeline-slide.no-image .sw-f {
  display: block;
}

.timeline-slide.no-image .sw-i {
  padding: 0;
}

.timeline-slide.ad-image .sw-i .tit {
  margin-top: 0;
}

.timeline-nav {
  position: absolute;
  top: 40%;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 18px 34px rgba(112, 49, 44, 0.16);
  cursor: pointer;
  transition:
    transform 0.25s ease,
    opacity 0.25s ease,
    background 0.25s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled,
  &.disabled {
    cursor: default;
    opacity: 0.46;
  }

  &.is-prev {
    left: -60px;
    background: #d7000f;
  }

  &.is-next {
    right: -60px;
    background: #d7000f;
  }

  svg {
    width: 30px;
    height: 30px;
  }
}

.timeline-nav.disabled,
.timeline-nav:disabled {
  background: #b3b3b4;
  opacity: 0.6;
}

.timeline-slide.no-image:hover .slide-bg {
  width: 320px;
  height: 320px;
}

.timeline-slide.no-image:hover .sw-f p,
.timeline-slide.no-image:hover .sw-i .tit {
  color: #ffffff;
}

.timeline-slide.ad-image:hover .hover_after {
  opacity: 1;
}

.leadership-stage {
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 190px);
  padding: 4px 0 12px;

  &::before {
    content: "";
    position: absolute;
    left: 18%;
    top: -28%;
    z-index: 0;
    width: 24vw;
    min-width: 280px;
    height: 135%;
    border-radius: 48%;
    background: rgba(255, 255, 255, 0.96);
    transform: rotate(32deg);
  }

  &::after {
    content: "";
    position: absolute;
    right: -10%;
    top: -8%;
    z-index: 0;
    width: 38vw;
    min-width: 420px;
    height: 112%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0) 72%);
    transform: rotate(16deg);
    transform-origin: top right;
  }
}

.leadership-section {
  position: relative;
  min-height: calc(100vh - 88px);
  padding-top: 72px;
  padding-bottom: 0;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.985), rgba(247, 245, 239, 0.96));

  &::before {
    content: "";
    position: absolute;
    left: -12%;
    top: -16%;
    z-index: 0;
    width: 48%;
    height: 72%;
    border-radius: 0 0 70% 0 / 0 0 100% 0;
    background: rgba(214, 214, 214, 0.95);
  }

  &::after {
    content: "";
    position: absolute;
    left: -18%;
    bottom: -18%;
    z-index: 0;
    width: 44%;
    height: 46%;
    border-radius: 0 100% 0 0 / 0 100% 0 0;
    background: rgba(176, 156, 131, 0.98);
  }
}

.leadership-shell {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  padding: 0;
}

.leadership-heading {
  display: grid;
  justify-items: center;
  margin-bottom: 18px;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.leadership-section.is-visible .leadership-heading {
  opacity: 1;
  transform: translateY(0);
}

.leadership-title {
  display: inline-flex;
  align-items: center;
  gap: 34px;
  margin: 0;
  padding: 0 5% 10px;
  border-bottom: 1px solid #ce0021;
  position: relative;

  span {
    color: #333333;
    font-family: "Times New Roman", Georgia, serif;
    font-size: clamp(34px, 2.8vw, 50px);
    line-height: 1.08;
  }

  img {
    width: 40px;
    flex: 0 0 auto;
  }

  &::before,
  &::after {
    content: "";
    position: absolute;
    bottom: -3px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ce0021;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.leadership-nav {
  position: absolute;
  left: clamp(108px, 9.5vw, 190px);
  top: 36.5%;
  z-index: 4;
  display: inline-flex;
  gap: 28px;

  button {
    width: 84px;
    height: 84px;
    border: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: transform 0.24s ease, opacity 0.24s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .is-prev,
  .is-next {
    background: #e23642;
  }
}

.leadership-fade {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  width: 15vw;
  min-width: 180px;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(247, 245, 239, 0) 0%, rgba(247, 245, 239, 0.98) 78%);
}

.leadership-carousel {
  position: relative;
  z-index: 2;
  overflow: hidden;
  padding: 6px 0 0 clamp(330px, 27vw, 520px);
  opacity: 0;
  transform: translateY(34px);
  transition: opacity 0.85s ease 0.12s, transform 0.85s ease 0.12s;

  &:not(:has(.swiper-slide:nth-child(2))) {
    padding-left: 0;
    display: flex;
    justify-content: center;
  }
}

.leadership-section.is-visible .leadership-carousel {
  opacity: 1;
  transform: translateY(0);
}

.leadership-swiper {
  overflow: hidden;

  :deep(.swiper-wrapper) {
    align-items: stretch;
  }

  :deep(.swiper-slide) {
    position: relative;
    height: auto;
    width: clamp(470px, 28vw, 530px);
    padding-right: clamp(24px, 2.7vw, 44px);
  }

  :deep(.swiper-slide)::after {
    content: "";
    position: absolute;
    top: 18px;
    right: 0;
    width: 1px;
    height: calc(100% - 56px);
    background: rgba(207, 196, 179, 0.78);
  }
}

.leadership-card {
  display: grid;
  gap: 16px;
  align-content: start;
  min-height: 100%;
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.leadership-section.is-visible .leadership-card {
  opacity: 1;
  transform: translateY(0);
}

.leadership-section.is-visible .leadership-swiper :deep(.swiper-slide:nth-child(2)) .leadership-card {
  transition-delay: 0.08s;
}

.leadership-section.is-visible .leadership-swiper :deep(.swiper-slide:nth-child(3)) .leadership-card {
  transition-delay: 0.16s;
}

.leadership-card-frame {
  padding: 18px;
  border: 1px solid rgba(204, 191, 173, 0.96);
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 0 0 18px rgba(255, 255, 255, 0.16);
}

.leadership-photo {
  display: grid;
  justify-items: center;
  padding: 18px 16px 0;
  min-height: 176px;
  background: #fff;
  border: 1px solid rgba(214, 203, 188, 0.9);

  img {
    width: 100%;
    max-width: 400px;
    height: auto;
    aspect-ratio: 4/3;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
}

.leadership-card:hover .leadership-photo img {
  transform: scale(1.05);
}

.leadership-year {
  display: block;
  margin: 14px 0 10px 0;
  text-align: center;
  color: #b08961;
  font-family: "Times New Roman", Georgia, serif;
  font-size: clamp(26px, 1.9vw, 34px);
  font-weight: 400;
  line-height: 1;
}

.leadership-copy {
  margin: 0;
  max-width: 520px;
  width: 100%;
  text-align: center;
  color: #7d7d7d;
  font-size: clamp(16px, 1.1vw, 20px);
  font-weight: 500;
  line-height: 1.58;
  letter-spacing: 0.03em;
}

.partner-heading {
  text-align: center;

  h2 {
    color: #fff;
  }

  .eyebrow {
    color: rgba(255, 255, 255, 0.72);
  }
}

.partner-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 0 auto 42px;
  max-width: 1250px;
}

.partner-tab {
  min-height: 58px;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 6px;
  background: transparent;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.24s ease;

  &:hover,
  &.active {
    background: #d40012;
    border-color: #d40012;
    color: #fff;
  }
}

.partner-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 26px;
}

.partner-card {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88px;
  padding: 14px;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
  transition: transform 0.24s ease, box-shadow 0.24s ease;

  &:hover {
    transform: translateY(-2px);
  }

  img {
    width: 100%;
    max-width: 220px;
    max-height: 62px;
    object-fit: contain;
  }
}

.about-modal {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: rgba(4, 10, 18, 0.82);

  video,
  .chart-modal-image {
    width: min(100%, 1180px);
    max-height: min(86vh, 920px);
    border-radius: 24px;
    background: #000;
    box-shadow: 0 36px 100px rgba(0, 0, 0, 0.38);
  }

  &.light {
    background: rgba(15, 21, 31, 0.72);
  }
}

.close-button {
  position: absolute;
  top: 28px;
  right: 28px;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

@media (max-width: 1200px) {
  .section-shell,
  .hero-content {
    padding-left: 28px;
    padding-right: 28px;
  }

  .hero-tabbar {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .intro-layout,
  .split-layout,
  .culture-layout {
    grid-template-columns: 1fr;
  }

  .intro-layout {
    min-height: auto;
    display: grid;
    gap: 32px;
  }

  .intro-section .section-shell {
    padding-left: 120px;
    padding-right: 24px;
  }

  .speech-shell {
    padding-left: 120px;
    padding-right: 48px;
  }

  .intro-visual {
    position: relative;
    right: auto;
    top: auto;
    bottom: auto;
    width: 100%;
    min-height: 520px;
  }

  .split-media img,
  .culture-image img,
  .intro-main {
    min-height: 520px;
  }

  .intro-bottom {
    left: 28px;
    bottom: -20px;
  }

  .intro-copy {
    width: min(100%, 720px);
    max-width: none;
    margin-left: 0;
    padding-left: 42px;
  }

  .culture-grid,
  .partner-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .speech-layout.reverse {
    grid-template-columns: 1fr;
    gap: 24px;
    min-height: auto;
  }

  .speech-layout .split-media {
    position: relative;
    right: auto;
    top: auto;
    width: min(100%, 500px);
    height: auto;
    margin-left: auto;
    transform: none;
  }

  .speech-copy-panel {
    width: min(100%, 760px);
    min-height: auto;
    padding-bottom: 0;
  }

  .speech-layout .split-copy {
    width: 100%;
    max-width: none;
  }

  .chart-shell {
    padding-left: 120px;
    padding-right: 48px;
  }

  .chart-card img {
    width: 76%;
    max-width: 76%;
    max-height: 58vh;
  }

  .speech-signoff {
    margin-top: 24px;
    justify-items: start;
    padding-right: 0;
  }

  .speech-signature-outside {
    position: static;
    margin-top: 14px;
    margin-left: auto;
  }

  .timeline-track {
    padding-left: 74px;
    padding-right: 74px;
  }

  .timeline-nav {
    top: 236px;
    width: 70px;
    height: 70px;

    &.is-prev {
      left: -18px;
    }

    &.is-next {
      right: -18px;
    }
  }

  .timeline-swiper :deep(.swiper-slide) {
    width: 320px;
  }

  .sw-f .year {
    font-size: 54px;
  }

  .sw-f .month {
    font-size: 40px;
  }

  .leadership-nav {
    left: 34px;
    top: 34%;

    button {
      width: 68px;
      height: 68px;
    }
  }

  .leadership-carousel {
    padding: 8px 0 12px 220px;
  }

  .leadership-swiper :deep(.swiper-slide) {
    width: 420px;
    padding-right: 28px;
  }

  .leadership-swiper :deep(.swiper-slide)::after {
    height: calc(100% - 48px);
  }

  .leadership-photo {
    min-height: 208px;
    padding: 26px 24px 0;

    img {
      height: 156px;
    }
  }
}

@media (max-width: 900px) {
  .about-dots {
    right: 16px;
    gap: 12px;
  }

  .hero-content {
    padding-top: 150px;
    padding-bottom: 170px;
  }

  .hero-line {
    width: min(430px, 78vw);
    margin-bottom: 34px;
  }

  .hero-tabbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 0 12px;
  }

  .hero-tab {
    min-height: 74px;
    border-bottom: 1px solid rgba(226, 198, 163, 0.16);
  }

  .about-section {
    padding: 78px 0;
  }

  .section-shell {
    padding: 0 20px;
  }

  .intro-section .section-shell {
    padding-left: 64px;
    padding-right: 20px;
  }

  .speech-shell {
    padding-left: 64px;
    padding-right: 20px;
  }

  .chart-shell {
    padding-left: 64px;
    padding-right: 20px;
  }

  .section-heading.with-controls {
    align-items: start;
    flex-direction: column;
  }

  .culture-grid,
  .partner-grid {
    grid-template-columns: 1fr;
  }

  .intro-section {
    padding-top: 118px;
  }

  .intro-heading {
    margin-bottom: 24px;
  }

  .intro-layout {
    display: grid;
    gap: 24px;
  }

  .intro-visual {
    min-height: 420px;
    height: auto;
  }

  .intro-copy {
    width: 100%;
    padding-left: 30px;
  }

  .speech-section {
    padding-top: 108px;
  }

  .speech-heading {
    margin-bottom: 24px;
  }

  .chart-card {
    margin-top: 28px;
  }

  .timeline-heading-rule {
    width: min(420px, 76vw);
  }

  .timeline-stage {
    min-height: 590px;
    padding-top: 12px;
  }

  .timeline-track {
    padding: 18px 48px 28px;
  }

  .timeline-wave {
    top: 238px;
    height: 104px;
    background-size: 360px 104px;
  }

  .timeline-title i {
    font-size: 42px;
  }

  .timeline-title-icon {
    width: 40px;
    height: 40px;
  }

  .timeline-swiper :deep(.swiper-slide) {
    width: 280px;
    height: 390px;
  }

  .bg-img {
    width: 196px;
    height: 156px;
  }

  .timeline-slide.no-image .bg-img {
    width: 150px;
    height: 150px;
    background: transparent;
  }

  .img_con {
    top: 24px;
    width: 132px;
    height: 132px;
  }

  .sw-f {
    padding-left: 24px;
  }

  .sw-f .year {
    font-size: 48px;
  }

  .sw-f .month {
    font-size: 36px;
  }

  .sw-i {
    padding: 10px 18px 0 24px;
  }

  .sw-i .tit {
    font-size: 15px;
  }

  .timeline-nav {
    top: 224px;
    width: 58px;
    height: 58px;

    &.is-prev {
      left: -6px;
    }

    &.is-next {
      right: -6px;
    }
  }

  .speech-layout .split-copy {
    width: 100%;
    padding-left: 30px;
    margin-top: 0;
  }

  .speech-signoff {
    margin-top: 18px;
  }

  .intro-scroller,
  .speech-scroller {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .signature-block {
    justify-items: start;
  }

  .speech-signature-outside {
    margin-left: 0;
  }

  .leadership-section {
    padding-top: 108px;

    &::before {
      width: 78%;
      height: 42%;
      top: -7%;
      left: -28%;
    }

    &::after {
      width: 86%;
      height: 28%;
      left: -34%;
      bottom: -6%;
    }
  }

  .leadership-heading {
    margin-bottom: 24px;
  }

  .leadership-title {
    gap: 18px;
    padding: 0 24px 10px;

    span {
      font-size: 30px;
    }

    img {
      width: 30px;
    }
  }

  .leadership-stage {
    min-height: auto;
    padding-top: 62px;

    &::before {
      left: 6%;
      top: -18%;
      width: 40vw;
      min-width: 160px;
      height: 92%;
    }

    &::after {
      right: -24%;
      width: 56vw;
      min-width: 220px;
      height: 100%;
    }
  }

  .leadership-nav {
    left: 20px;
    top: 18px;
    gap: 14px;
  }

  .leadership-carousel {
    padding: 0 26px 10px 26px;

    &:not(:has(.swiper-slide:nth-child(2))) {
      padding-left: 18px;
      padding-right: 18px;
    }
  }

  .leadership-swiper :deep(.swiper-slide) {
    width: auto;
    padding-right: 0;
  }

  .leadership-swiper :deep(.swiper-slide)::after {
    display: none;
  }

  .leadership-fade {
    display: none;
  }
}

@media (max-width: 640px) {
  .about-hero {
    min-height: auto;
    padding-top: 82px;
  }

  .hero-image-pc {
    display: none;
  }

  .hero-image-mobile {
    display: block;
  }

  .hero-content {
    padding-top: 86px;
    padding-bottom: 132px;
  }

  .hero-title-row {
    align-items: end;
    gap: 14px;
  }

  .hero-description {
    font-size: 17px;
  }

  .about-dots {
    display: none;
  }

  .leadership-carousel {
    padding-left: 18px;
    padding-right: 18px;
  }

  .timeline-shell {
    padding-left: 0;
    padding-right: 0;
  }

  .timeline-title {
    gap: 12px;
  }

  .timeline-title i {
    font-size: 32px;
  }

  .timeline-heading-rule {
    width: min(280px, 72vw);
  }

  .timeline-stage {
    min-height: 520px;
    padding-top: 18px;
  }

  .timeline-track {
    padding: 12px 22px 22px;
  }

  .timeline-wave {
    top: 224px;
    height: 92px;
    background-size: 300px 92px;
  }

  .timeline-swiper :deep(.swiper-slide) {
    width: 244px;
    height: 360px;
  }

  .bg-img {
    width: 178px;
    height: 144px;
  }

  .timeline-slide.no-image .bg-img {
    width: 138px;
    height: 138px;
    background: transparent;
  }

  .img_con {
    top: 23px;
    width: 118px;
    height: 118px;
  }

  .sw-f {
    padding-left: 18px;
  }

  .sw-f .year {
    font-size: 42px;
  }

  .sw-f .month {
    font-size: 32px;
  }

  .sw-i {
    padding: 10px 12px 0 18px;
  }

  .sw-i .tit {
    font-size: 14px;
    line-height: 1.55;
  }

  .timeline-nav {
    top: 212px;
    width: 48px;
    height: 48px;

    &.is-prev {
      left: 2px;
    }

    &.is-next {
      right: 2px;
    }

    svg {
      width: 24px;
      height: 24px;
    }
  }

  .split-media img,
  .culture-image img,
  .intro-main {
    min-height: 360px;
  }

  .intro-section .section-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .speech-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .chart-shell {
    padding-left: 20px;
    padding-right: 20px;
  }

  .intro-section {
    padding-top: 108px;
  }

  .intro-heading h2 {
    font-size: 28px;
  }

  .intro-heading::after {
    width: min(300px, 72vw);
  }

  .speech-title {
    gap: 18px;
    padding-right: 24px;
    padding-bottom: 10px;

    span {
      font-size: 28px;
    }

    img {
      width: 30px;
    }
  }

  .chart-title {
    gap: 18px;
    padding-right: 24px;
    padding-bottom: 10px;

    span {
      font-size: 28px;
    }

    img {
      width: 30px;
    }
  }

  .chart-card {
    margin-top: 22px;
  }

  .chart-card img {
    width: 94%;
    max-width: 94%;
    max-height: none;
    margin-top: 18px;
  }

  .leadership-nav {
    position: static;
    justify-content: center;
    margin-bottom: 18px;

    button {
      width: 58px;
      height: 58px;
    }
  }

  .leadership-stage {
    padding-top: 0;
  }

  .leadership-carousel {
    padding: 0 20px 24px;
  }

  .leadership-card {
    gap: 18px;
  }

  .leadership-card-frame {
    padding: 12px;
  }

  .leadership-photo {
    min-height: 170px;
    padding: 18px 12px 0;

    img {
      height: 128px;
    }
  }

  .leadership-year {
    margin-left: 26px;
    font-size: 32px;
  }

  .leadership-copy {
    padding: 0 6px;
    font-size: 14px;
    line-height: 1.55;
    letter-spacing: 0.02em;
  }

  .intro-copy {
    padding-left: 18px;
    padding-right: 0;

    p {
      font-size: 16px;
      line-height: 1.95;
      word-spacing: normal;
    }
  }

  .intro-decoration {
    width: 110px;
  }

  .intro-bottom {
    position: static;
    margin-top: 18px;
    align-items: center;
    justify-content: flex-start;
    gap: 14px;
  }

  .video-trigger {
    font-size: 15px;
  }

  .video-icon {
    width: 52px;
    height: 52px;
  }

  .speech-layout .split-copy {
    padding-left: 18px;
    margin-top: 0;

    &::before {
      width: 5px;
    }
  }

  .speech-signoff {
    gap: 8px;
  }

  .signature-block {
    span {
      font-size: 15px;
    }

    strong {
      font-size: 19px;
    }
  }

  .signature-mark {
    width: 84px;
  }

  .close-button {
    top: 14px;
    right: 14px;
  }
}

.about-loading,
.about-error,
.about-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  color: #555;
  font-size: 15px;
}

.about-loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #ddd;
  border-top-color: #ba9d76;
  border-radius: 50%;
  animation: about-spin 0.8s linear infinite;
}

@keyframes about-spin {
  to { transform: rotate(360deg); }
}

.about-retry {
  padding: 8px 24px;
  border: 1px solid #ba9d76;
  border-radius: 4px;
  background: transparent;
  color: #ba9d76;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #ba9d76;
    color: #fff;
  }
}
</style>

