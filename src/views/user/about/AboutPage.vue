<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-vue-next";
import { Swiper, SwiperSlide } from "swiper/vue";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { useAboutPage } from "./composables/useAboutPage";
import { useI18n } from "vue-i18n";

const route = useRoute();
const router = useRouter();
const { locale, t } = useI18n({ useScope: 'global' });

const { loading, error, aboutView, refresh } = useAboutPage();
// ── Static decoration assets ─────────────────────────────────────────────
const repositoryImageBase = "https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image";
const repoImg = (file) => `${repositoryImageBase}/${file}`;
// const speechTitleSeal = "/images/about/chairman-speech-seal.png";
const timelineTitleIcon = repoImg("bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png");
const timelineHoverBefore = repoImg("e012bd80-11a1-4e5c-b5fa-2eda75b67d66.png");
const timelineHoverAfter = repoImg("dfc20891-e902-474e-8c93-c374b583041d.png");

const getValidText = (val, fallback) => {
  return (typeof val === 'string' && val.trim() !== '' && val.trim() !== '-') ? val : fallback;
};

const rawSectionMeta = computed(() => aboutView.value?.sectionMeta ?? []);
const sectionMeta = computed(() => {
  return rawSectionMeta.value.map((item) => {
    const keyMap = {
      'page1': 'user.about.tabIntro',
      'page2': 'user.about.tabIntro',
      'page3': 'user.about.tabVision',
      'page4': 'user.about.tabOrgChart',
      'page5': 'user.about.tabCulture',
      'page6': 'user.about.tabTimeline',
      'page7': 'user.about.tabLeadership'
    };
    const key = keyMap[item.id];
    return { ...item, title: getValidText(item.title, key ? t(key) : item.title) }
  })
});
const aboutTabs = computed(() => aboutView.value?.aboutTabs ?? []);
const translatedTabs = computed(() => {
  return aboutTabs.value.map((tab) => {
    const keyMap = {
      'page1': 'user.about.tabIntro',
      'page2': 'user.about.tabIntro',
      'page3': 'user.about.tabVision',
      'page4': 'user.about.tabOrgChart',
      'page5': 'user.about.tabCulture',
      'page6': 'user.about.tabTimeline',
      'page7': 'user.about.tabLeadership'
    };
    const key = keyMap[tab.id];
    return { ...tab, title: getValidText(tab.title, key ? t(key) : tab.title) }
  })
})
const companyIntroduction = computed(() => {
  return aboutView.value?.companyIntroduction?.paragraphs ?? []
});
const chairmanSpeech = computed(() => aboutView.value?.chairmanSpeech ?? null);
const cultureBlocks = computed(() => aboutView.value?.cultureBlocks ?? []);
const timelineEntries = computed(() => aboutView.value?.timelineEntries ?? []);
const leadershipItems = computed(() => aboutView.value?.leadershipItems ?? []);
const speechPortrait = computed(() => aboutView.value?.chairmanSpeech?.portrait ?? "");
const heroBannerImage = computed(() => aboutView.value?.hero?.coverImage || "");
const introImage = computed(() => aboutView.value?.companyIntroduction?.coverImage ?? "");
const introVideoUrl = computed(() => aboutView.value?.companyIntroduction?.videoUrl ?? "");
const orgChartImage = computed(() => aboutView.value?.organizationChart?.chartImage ?? "");
const heroHeadline = computed(() => getValidText(aboutView.value?.hero?.headline, t('user.about.heroHeadline')));
const heroDescription = computed(() => getValidText(aboutView.value?.hero?.description, t('user.about.heroDescription')));
const speechSignTitle = computed(() => aboutView.value?.chairmanSpeech?.signTitle ?? "");
const speechSignName = computed(() => aboutView.value?.chairmanSpeech?.signName ?? "");
const speechVision = computed(() => {
  return chairmanSpeech.value?.vision ?? ""
});
const speechMission = computed(() => {
  return chairmanSpeech.value?.mission ?? ""
});
const introTitle = computed(() => getValidText(aboutView.value?.introSectionTitle || aboutView.value?.companyIntroduction?.title, t('user.about.introTitle')));
const speechTitle = computed(() => getValidText(aboutView.value?.speechSectionTitle || aboutView.value?.chairmanSpeech?.title, t('user.about.visionTitle')));
const orgChartTitle = computed(() => getValidText(aboutView.value?.organizationChartSectionTitle || aboutView.value?.organizationChart?.title, t('user.about.orgChartTitle')));
const videoButtonLabel = computed(() => getValidText(aboutView.value?.companyIntroduction?.videoButtonLabel, t('user.about.videoLabel')));
const cultureTitle = computed(() => getValidText(aboutView.value?.cultureSection?.title || aboutView.value?.cultureBlocks?.[0]?.title, t('user.about.cultureTitle')));
const cultureImage = computed(
  () =>
    aboutView.value?.cultureSection?.coverImage ||
    "https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/3f9cf9fc-c3f2-4cd5-a6e7-6c1f19a596b0.jpg",
);
const timelineTitle = computed(() => getValidText(aboutView.value?.timelineSectionTitle, t('user.about.timelineTitle')));
const leadershipTitle = computed(() => getValidText(aboutView.value?.leadershipSectionTitle, t('user.about.leadershipTitle')));

const activeSection = ref("page1");
const visibleSections = ref(["page1"]);
const videoOpen = ref(false);
const chartOpen = ref(false);
const timelineSwiper = ref(null);
const timelineAtStart = ref(true);
const timelineAtEnd = ref(false);
const leadershipSwiper = ref(null);
const introScroller = ref(null);
const speechScroller = ref(null);
const syncingRouteFromSection = ref(false);

const readPreviewLocation = () => {
  if (typeof window === 'undefined') {
    return {
      adminPreview: String(route.query.adminPreview || '').trim() === '1',
      previewSection: String(route.query.previewSection || '').trim().toLowerCase(),
      hashSection: String(route.hash || '').replace('#', '').trim().toLowerCase(),
    }
  }

  const currentUrl = new URL(window.location.href)
  return {
    adminPreview: currentUrl.searchParams.get('adminPreview') === '1',
    previewSection: String(currentUrl.searchParams.get('previewSection') || '').trim().toLowerCase(),
    hashSection: String(currentUrl.hash || '').replace('#', '').trim().toLowerCase(),
  }
}

const isAdminPreview = computed(() => readPreviewLocation().adminPreview)

const previewSectionId = computed(() => {
  const { previewSection, hashSection } = readPreviewLocation()

  if (/^page[1-8]$/.test(previewSection)) {
    return previewSection
  }

  if (isAdminPreview.value && /^page[1-8]$/.test(hashSection)) {
    return hashSection
  }

  return ''
})

const isSingleSectionPreview = computed(() => Boolean(previewSectionId.value))

const filteredSectionMeta = computed(() => {
  if (!isSingleSectionPreview.value) return sectionMeta.value
  return sectionMeta.value.filter((item) => item.id === previewSectionId.value)
})

let observer = null;

const setupObserver = () => {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!visibleSections.value.includes(entry.target.id)) {
            visibleSections.value.push(entry.target.id);
          }
        }
      });
    },
    {
      root: scrollContainer.value,
      threshold: 0.15,
    }
  );

  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (activeSection.value !== entry.target.id) {
            activeSection.value = entry.target.id;
          }
        }
      });
    },
    {
      root: scrollContainer.value,
      threshold: 0.51,
    }
  );

  document.querySelectorAll(".about-section").forEach((section) => {
    observer.observe(section);
    activeObserver.observe(section);
  });
};

const normalizeText = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .trim()

const cultureDisplayBlocks = computed(() => {
  if (!cultureBlocks.value.length) {
    return [
      { title: "Giá trị cốt lõi", items: [] },
      { title: "Slogan", items: [] },
    ];
  }

  const normalizedBlocks = cultureBlocks.value.map((block) => ({
    ...block,
    nTitle: normalizeText(block.title),
  }));

  const coreValuesBlock =
    normalizedBlocks.find((item) => item.nTitle === "gia tri cot loi") ||
    normalizedBlocks.find((item) => item.nTitle.includes("cot loi")) ||
    normalizedBlocks[0];

  const sloganBlock =
    normalizedBlocks.find((item) => item.nTitle === "slogan") ||
    normalizedBlocks.find((item) => item.nTitle.includes("slogan")) ||
    normalizedBlocks.find((item) => item.title !== coreValuesBlock.title) ||
    null;

  return sloganBlock
    ? [coreValuesBlock, sloganBlock]
    : [coreValuesBlock];
});

const cultureItemText = (item) => {
  const text = String(item?.text || "").trim();
  const label = String(item?.label || "").trim();
  const content = text || label;
  
  if (locale.value === 'vi' || !content) return content;

  const n = normalizeText(content)

  if (n.includes('san pham dap ung tieu chuan cao')) return t('user.about.qualityDesc')
  if (n.includes('meets high standards')) return t('user.about.qualityDesc')
  
  if (n.includes('cam ket dung tien do') || n.includes('dung chat luong')) return t('user.about.prestigeDesc')
  if (n.includes('commitment to schedule')) return t('user.about.prestigeDesc')
  
  if (n.includes('luon cap nhat xu huong vat lieu moi')) return t('user.about.innovationDesc')
  if (n.includes('update new material trends')) return t('user.about.innovationDesc')
  
  if (n.includes('dat nhu cau cua khach hang len hang dau')) return t('user.about.customerCenterDesc')
  if (n.includes('put customer needs first')) return t('user.about.customerCenterDesc')
  
  if (n.includes('phat trien ben vung cung doi tac')) return t('user.about.longTermCoopDesc')
  if (n.includes('sustainable development with partners')) return t('user.about.longTermCoopDesc')
  
  if (n.includes('uy tin tu nhung dieu nho nhat')) return t('user.about.sloganText')
  if (n.includes('trusted from the smallest details')) return t('user.about.sloganText')
  if (n.includes('reputation from the smallest things')) return t('user.about.sloganText')
  
  return content;
};

const cultureItemLabel = (item) => {
  const label = String(item?.label || "").trim();
  if (locale.value === 'vi' || !label) return label;
  
  const n = normalizeText(label)
  const isColon = label.endsWith(':')

  if (n.includes('chat luong') || n.includes('quality')) {
    return isColon ? `${t('user.about.quality')}:` : t('user.about.quality')
  }
  if (n.includes('uy tin') || n.includes('prestige')) {
    return isColon ? `${t('user.about.prestige')}:` : t('user.about.prestige')
  }
  if (n.includes('doi moi') || n.includes('innovation')) {
    return isColon ? `${t('user.about.innovation')}:` : t('user.about.innovation')
  }
  if (n.includes('khach hang la trung tam') || n.includes('customer center') || n.includes('customer centric')) {
    return isColon ? `${t('user.about.customerCenter')}:` : t('user.about.customerCenter')
  }
  if (n.includes('hop tac lau dai') || n.includes('long term coop') || n.includes('long-term cooperation')) {
    return isColon ? `${t('user.about.longTermCoop')}:` : t('user.about.longTermCoop')
  }
  if (n.includes('slogan')) {
    return isColon ? `${t('user.about.sloganTitle')}:` : t('user.about.sloganTitle')
  }

  return label;
};

const cultureBlockTitle = (title) => {
  if (locale.value === 'vi' || !title) return title;
  const n = normalizeText(title)
  if (n.includes('gia tri cot loi') || n.includes('core values')) return t('user.about.coreValuesTitle')
  if (n.includes('slogan')) return t('user.about.sloganTitle')
  return title;
};

const cultureBlocksForRender = computed(() =>
  cultureDisplayBlocks.value.map((block) => ({
    title: cultureBlockTitle(block?.title) || t('user.about.cultureDefault'),
    items: (block?.items || []).filter((item) => cultureItemText(item)).map(item => ({
      ...item,
      displayLabel: cultureItemLabel(item)
    })),
  })),
);

const timelineSlides = computed(() =>
  timelineEntries.value.map((item) => {
    const startLabel = item.startYear
      ? [item.startYear, item.startMonth].filter(Boolean).join('.')
      : '';
    const endLabel = item.endYear
      ? [item.endYear, item.endMonth].filter(Boolean).join('.')
      : '';

    const translateTimeline = (n) => {
      if (locale.value === 'vi' || !n) return n;
      const nt = normalizeText(n)
      if (nt.includes('thanh lap cong ty')) return t('user.about.timelineFounded');
      if (nt.includes('phat trien va phan phoi')) return t('user.about.timelineExpansion');
      return n;
    }

    return {
      ...item,
      title: translateTimeline(item.title),
      description: translateTimeline(item.description),
      year: item.startYear || '',
      month: item.startMonth || '',
      day: item.startDay || '',
      endYear: item.endYear || '',
      endMonth: item.endMonth || '',
      endDay: item.endDay || '',
      displayYearLabel: endLabel ? `${startLabel} - ${endLabel}` : startLabel,
      displayMonthLabel:
        item.startDay || item.endDay
          ? [item.startDay, item.endDay].filter(Boolean).join(' - ')
          : '',
      type: item.image ? "ad-image" : "no-image"
    };
  })
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
  if (previewSectionId.value) {
    return previewSectionId.value
  }

  if (route.hash) {
    return route.hash.replace("#", "");
  }

  const matched = sectionMeta.value.find((item) => item.route === route.path && item.id !== "page1");
  if (matched && route.path !== "/about/company-introduction") {
    return matched.id;
  }

  return "page1";
};

const shouldRenderSection = (id) => !previewSectionId.value || previewSectionId.value === id;

const isSectionVisible = (id) => visibleSections.value.includes(id);

const isTabActive = (id) => {
  if (id === "page2") {
    return activeSection.value === "page1" || activeSection.value === "page2";
  }

  return activeSection.value === id;
};

const isScrolling = ref(false);
const isSyncingByClick = ref(false);
const scrollContainer = ref(null);
let scrollRafId = null;

const handleContainerScroll = () => {
  // Không làm gì cả vì IntersectionObserver đã đảm nhận việc update activeSection!
};

const scrollToSection = (id, smooth = true) => {
  const container = scrollContainer.value;
  const element = document.getElementById(id);

  if (!container || !element) return;

  isSyncingByClick.value = true;
  const top = element.offsetTop;
  activeSection.value = id;
  container.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });

  setTimeout(() => {
    isSyncingByClick.value = false;
  }, 800);
};

const handleWheel = (e) => {
  if (window.innerWidth <= 992 || isScrolling.value || isSyncingByClick.value) return;
  
  const delta = e.deltaY;
  if (Math.abs(delta) < 30) return;

  const currentIndex = filteredSectionMeta.value.findIndex(s => s.id === activeSection.value);
  
  if (delta > 0) {
    if (currentIndex < filteredSectionMeta.value.length - 1) {
      e.preventDefault();
      isScrolling.value = true;
      const nextId = filteredSectionMeta.value[currentIndex + 1].id;
      scrollToSection(nextId);
    }
  } else {
    if (currentIndex > 0) {
      e.preventDefault();
      isScrolling.value = true;
      const prevId = filteredSectionMeta.value[currentIndex - 1].id;
      scrollToSection(prevId);
    }
  }

  setTimeout(() => {
    isScrolling.value = false;
  }, 800);
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

let syncTimeout = null;
const syncActiveSectionToRoute = (id) => {
  const matched = sectionMeta.value.find((item) => item.id === id);
  if (!matched) return;

  if (route.path === matched.route && route.hash === matched.hash) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  
  syncTimeout = setTimeout(() => {
    syncingRouteFromSection.value = true;
    router.replace({ path: matched.route, hash: matched.hash }).finally(() => {
      setTimeout(() => {
        syncingRouteFromSection.value = false;
      }, 100);
    });
  }, 300);
};

const syncRouteToScroll = async () => {
  await nextTick();
  const targetId = getTargetSectionId();
  resetInnerScrollers(targetId);
  scrollToSection(targetId, false);
};

// Navigation active section sync

watch(activeSection, (id) => {
  if (!visibleSections.value.includes(id)) {
    visibleSections.value.push(id);
  }
  syncActiveSectionToRoute(id);
});
watch(
  () => route.fullPath,
  () => {
    if (syncingRouteFromSection.value || isSyncingByClick.value || isScrolling.value) {
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

watch(locale, refresh);

onMounted(async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleContainerScroll, { passive: true });
    scrollContainer.value.addEventListener('wheel', handleWheel, { passive: false });
  }
  setupObserver();
  syncRouteToScroll();
});

onBeforeUnmount(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleContainerScroll);
    scrollContainer.value.removeEventListener('wheel', handleWheel);
  }
  if (observer) {
    observer.disconnect();
  }
  if (scrollRafId) cancelAnimationFrame(scrollRafId);
});
</script>

<template>
  <div class="about-page full-page-wrapper">
    <!-- Loading state -->
    <div v-if="loading" class="about-loading">
      <div class="about-loading-spinner" />
      <p>{{ t('user.about.loading') }}</p>
    </div>

    <div v-else-if="error" class="about-error">
      <p>{{ error }}</p>
      <button type="button" class="about-retry" @click="refresh">{{ t('user.about.retry') }}</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!aboutView" class="about-empty">
      <p>{{ t('user.about.unavailable') }}</p>
      <button type="button" class="about-retry" @click="refresh">{{ t('user.about.reload') }}</button>
    </div>

    <!-- Main content -->
    <div v-else ref="scrollContainer" class="scroll-container">
      <div v-if="!isSingleSectionPreview" class="about-dots">
        <button
          v-for="dot in filteredSectionMeta"
          :key="dot.id"
          :class="['about-dot', { active: activeSection === dot.id }]"
          :aria-label="dot.title"
          type="button"
          @click="navigateToSection(dot)"
        />
      </div>

      <section v-if="shouldRenderSection('page1')" id="page1" class="about-hero section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page1') }">
        <img class="hero-image hero-image-pc" :src="heroBannerImage || '/images/banner/banner3.jpg'" alt="About us banner" />
        <img class="hero-image hero-image-mobile" :src="heroBannerImage || '/images/banner/banner3.jpg'" alt="About us mobile banner" />
        <div class="hero-overlay" />

        <div class="hero-content" data-reveal-item>
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
            v-for="tab in translatedTabs"
            :key="tab.id"
            :class="['hero-tab', { active: isTabActive(tab.id) }]"
            type="button"
            @click="navigateToSection(tab)"
          >
            {{ tab.title }}
          </button>
        </div>
      </section>

      <section v-if="shouldRenderSection('page2')" id="page2" class="about-section intro-section section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page2') }">
        <div class="section-shell">
          <div class="section-heading intro-heading" data-reveal-item>
            <h2>{{ introTitle }}</h2>
          </div>

          <div class="intro-layout">
            <div class="intro-visual visual" data-reveal-item>
              <img class="intro-main" :src="introImage" alt="Company introduction" loading="lazy" />
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

            <div ref="introScroller" class="intro-copy content" data-reveal-item>
              <p v-for="paragraph in companyIntroduction" :key="paragraph">
                {{ paragraph }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="shouldRenderSection('page3')" id="page3" class="about-section speech-section section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page3') }">
        <div class="section-shell speech-shell">
          <div class="speech-heading" data-reveal-item>
            <p class="speech-title">
              <span>{{ speechTitle }}</span>
            </p>
          </div>

          <div class="split-layout reverse speech-layout">
            <div class="speech-copy-panel content" data-reveal-item>
              <div ref="speechScroller" class="split-copy speech-scroller">
                <article v-if="speechVision" class="speech-block">
                  <h3>{{ t('user.about.visionLabel') }}</h3>
                  <p>{{ speechVision }}</p>
                </article>
                <article v-if="speechMission" class="speech-block">
                  <h3>{{ t('user.about.missionLabel') }}</h3>
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

            <div class="split-media visual" data-reveal-item>
              <img :src="speechPortrait" alt="Chairman's speech" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section v-if="shouldRenderSection('page4')" id="page4" class="about-section chart-section section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page4') }">
        <div class="section-shell chart-shell">
          <div class="section-heading chart-heading" data-reveal-item>
            <p class="chart-title">
              <span>{{ orgChartTitle }}</span>
            </p>
          </div>

          <button class="chart-card visual" data-reveal-item type="button" @click="chartOpen = true">
            <img :src="orgChartImage" alt="Organization chart" loading="lazy" />
          </button>
        </div>
      </section>

      <section v-if="shouldRenderSection('page5')" id="page5" class="about-section culture-section section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page5') }">
        <div class="section-shell">
          <div class="section-heading" data-reveal-item>
            <span class="eyebrow">{{ heroHeadline }}</span>
            <h2>{{ cultureTitle }}</h2>
          </div>

          <div class="culture-layout">
            <div class="culture-image visual" data-reveal-item>
              <img :src="cultureImage" alt="Corporate culture" />
            </div>

            <div class="culture-panel content" data-reveal-item>
              <article
                v-for="(block, blockIndex) in cultureBlocksForRender"
                :key="`${block.title}-${blockIndex}`"
                class="culture-card active"
              >
                <h3>{{ block.title }}</h3>
                <ul v-if="block.items.length">
                  <li
                    v-for="(item, itemIndex) in block.items"
                    :key="`${block.title}-${item.label}-${itemIndex}`"
                  >
                    <strong v-if="item.displayLabel">{{ item.displayLabel }}:</strong>
                    <span>{{ cultureItemText(item) }}</span>
                  </li>
                </ul>
                <p v-else class="culture-empty">{{ t('user.about.cultureEmpty') }}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section v-if="shouldRenderSection('page6')" id="page6" class="about-section timeline-section section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page6') }">
        <div class="section-shell timeline-shell">
          <div class="timeline-heading" data-reveal-item>
            <p class="timeline-title">
              <i>{{ timelineTitle }}</i>
            </p>
            <span class="timeline-heading-rule" />
          </div>

          <div class="timeline-stage page6-con visual" data-reveal-item>
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
                         <p class="year">{{ item.displayYearLabel || item.year }}</p>
                         <p v-if="item.displayMonthLabel" class="month">{{ item.displayMonthLabel }}</p>
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

      <section v-if="shouldRenderSection('page7')" id="page7" class="about-section leadership-section section-full home-reveal" :class="{ 'is-visible': isSectionVisible('page7') }">
        <div class="section-shell leadership-shell">
          <div class="leadership-heading" data-reveal-item>
            <h2 class="leadership-title">
              <span>{{ leadershipTitle }}</span>
            </h2>
          </div>

          <div class="leadership-stage visual" data-reveal-item>
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
                        <img
                          :src="item.image"
                          alt="Leadership care"
                          loading="lazy"
                          :style="{
                            objectFit: item.avatarFit || 'cover',
                            objectPosition: `${item.avatarFocusX ?? 50}% ${item.avatarFocusY ?? 50}%`,
                          }"
                        />
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
.full-page-wrapper {
  position: relative;
  width: 100%;
  height: 100svh;
  overflow: hidden;

  @media (max-width: 992px) {
    height: auto;
    overflow: visible;
  }
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  scroll-snap-stop: always;

  @media (max-width: 992px) {
    height: auto;
    overflow-y: visible;
    scroll-snap-type: none;
  }
}

.section-full {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  @media (max-width: 992px) {
    min-height: auto;
  }
}

/* Home Reveal Logic Sync */
.home-reveal {
  opacity: 1; /* Section parent is visible */
}

.home-reveal .content[data-reveal-item],
.home-reveal .hero-content[data-reveal-item] {
  opacity: 0;
  transform: translate(-80px, 60px) scale(0.98);
  transition: all 2.2s cubic-bezier(0.1, 1, 0.2, 1);
}

.home-reveal.is-visible .content[data-reveal-item],
.home-reveal.is-visible .hero-content[data-reveal-item] {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.home-reveal .visual[data-reveal-item] {
  opacity: 0;
  transform: translate(80px, 60px) scale(0.98);
  transition: all 2.2s cubic-bezier(0.1, 1, 0.2, 1);
  transition-delay: 0.4s;
}

.home-reveal.is-visible .visual[data-reveal-item] {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.home-reveal .section-heading[data-reveal-item] {
  opacity: 0;
  transform: translateY(40px);
  transition: all 1.8s cubic-bezier(0.1, 1, 0.2, 1);
}

.home-reveal.is-visible .section-heading[data-reveal-item] {
  opacity: 1;
  transform: translateY(0);
}

/* Floating Animation */
@keyframes floating {
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-12px) scale(1.005); }
  100% { transform: translateY(0px) scale(1); }
}

.home-reveal.is-visible .visual img,
.home-reveal.is-visible .chart-card img {
  animation: floating 14s ease-in-out infinite;
  animation-delay: 2.2s;
}

.about-page {
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(41, 63, 101, 0.14), transparent 34%),
    linear-gradient(180deg, #f4f0e8 0%, #f8f6f1 14%, #f4f1ea 100%);
  color: #1f2430;
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
  scroll-margin-top: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
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
  opacity: 1; /* Keep parent visible */
  will-change: transform, opacity;
  contain: content;
}

/* Animation System */
.animate-item {
  opacity: 0;
  transition: all 1s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform, opacity;

  &.slide-left { transform: translateX(-60px); }
  &.slide-right { transform: translateX(60px); }
  &.slide-up { transform: translateY(60px); }
}

@media (max-width: 768px) {
  .animate-item {
    &.slide-left { transform: translateX(-30px); }
    &.slide-right { transform: translateX(30px); }
    &.slide-up { transform: translateY(30px); }
  }
}

.is-visible .animate-item {
  opacity: 1;
  transform: translate(0, 0) !important;
}

.delay-1 { transition-delay: 0.15s; }
.delay-2 { transition-delay: 0.3s; }
.delay-3 { transition-delay: 0.45s; }

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
  bottom: 8vh;
  width: min(44vw, 830px);
  height: 85vh;
  z-index: 1;
  transform: translateX(0);
}

.intro-main {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right center;
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
  display: grid;
  grid-template-columns: 1fr 1.2fr; /* Tăng tỉ lệ cột chứa ảnh */
  gap: 40px;
  align-items: center;
  position: relative;
  min-height: calc(100vh - 204px);
}

.speech-layout .split-media {
  position: relative; /* Bỏ absolute để dễ kiểm soát kích thước */
  width: 100%; 
  height: auto;
  max-height: 80vh;
  transform: none;
  display: flex;
  justify-content: center;
}

.speech-layout .split-media img {
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: cover; /* Để ảnh tràn khung cho bự */
  border-radius: 8px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
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

.culture-empty {
  margin: 0;
  color: #8a8a8a;
  font-size: 15px;
  line-height: 1.5;
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

.timeline-swiper {
  height: 100%;
  overflow: visible;
}

.timeline-swiper :deep(.swiper-wrapper) {
  align-items: stretch;
  justify-content: center;
}

.timeline-swiper :deep(.swiper-slide) {
  width: 337px;
  height: 100%;
  display: flex;
  align-items: stretch;
  opacity: 1;
  transform: none;
  filter: none;
}

.timeline-slide-inner {
  position: relative;
  width: 100%;
  min-height: 372px;
  margin-top: 0;
  padding: 28px 24px 20px;
  display: flex;
  justify-content: center;
}

.timeline-slide.ad-image .timeline-slide-inner {
  padding: 12px 24px 20px;
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
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 18px;
  width: 100%;
  z-index: 2;
}

.timeline-slide.ad-image .sw-image,
.timeline-slide.no-image .sw-image {
  display: grid;
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
  width: 100%;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: #8f5a2d;
  opacity: 1;
  transform: none;
  text-align: center;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.85);
}

.sw-f .year,
.sw-f .month {
  margin: 0;
  font-family: "Times New Roman", Georgia, serif;
  line-height: 1;
}

.sw-f .year {
  font-size: 54px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.sw-f .month {
  font-size: 22px;
  line-height: 1.35;
  font-weight: 600;
}

.sw-i {
  width: 100%;
  padding: 0;
  opacity: 1;
  transform: none;
  display: flex;
  justify-content: center;
}

.sw-i .tit {
  margin: 0;
  max-width: 226px;
  color: #2e241d;
  font-size: 16px;
  line-height: 1.72;
  text-align: center;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.9);
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

.timeline-slide.no-image .sw-f,
.timeline-slide.no-image .sw-i {
  position: relative;
  z-index: 2;
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
  color: #fef8f2;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
}

.timeline-slide.no-image:hover .sw-f {
  transform: translateY(-2px);
}

.timeline-slide.ad-image:hover .hover_after {
  opacity: 1;
}

.timeline-slide.ad-image:hover .sw-f,
.timeline-slide.ad-image:hover .sw-i .tit {
  color: #221914;
  text-shadow: 0 3px 14px rgba(255, 255, 255, 0.92);
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

  .timeline-slide-inner {
    min-height: 348px;
    padding: 20px 18px 18px;
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
    gap: 4px;
  }

  .sw-f .year {
    font-size: 44px;
  }

  .sw-f .month {
    font-size: 20px;
  }

  .sw-i .tit {
    max-width: 210px;
    font-size: 15px;
  }

  .timeline-nav {
    top: 210px;
    width: 50px;
    height: 50px;

    &.is-prev {
      left: 10px;
    }

    &.is-next {
      right: 10px;
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
  .about-page {
    overflow-x: hidden;
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }

  .about-hero,
  .about-section {
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .about-hero {
    min-height: 100svh;
    padding-top: 0;
  }

  .hero-image-pc {
    display: none;
  }

  .hero-image-mobile {
    display: block;
  }

  .hero-content {
    padding: 104px 20px 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 50vh;
  }

  .hero-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;

    h1 {
      font-size: 38px;
      line-height: 1.1;
      text-align: left;
    }
  }

  .hero-line {
    margin-bottom: 24px;
  }

  .hero-description {
    font-size: 17px;
  }

  .about-dots {
    display: none;
  }

  .hero-tabbar {
    grid-template-columns: 1fr;
    max-height: 42vh;
    overflow-y: auto;
    padding: 0;
  }

  .hero-tab {
    min-height: 52px;
    padding: 12px 16px;
    font-size: 14px;
  }

  .about-section {
    min-height: auto;
    padding: 76px 0 54px;
    contain: none;
  }

  .section-shell {
    width: 100%;
    padding-left: 16px;
    padding-right: 16px;
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

  .timeline-swiper :deep(.swiper-slide) {
    width: 244px;
    height: 360px;
  }

  .timeline-slide-inner {
    min-height: 320px;
    padding: 18px 14px 16px;
  }

  .bg-img {
    width: 140px;
    height: 110px;
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
    gap: 4px;
    text-align: center;
    width: 100%;
  }

  .sw-f .year {
    font-size: 34px;
  }

  .sw-f .month {
    font-size: 18px;
    line-height: 1.35;
  }

  .sw-i {
    padding: 0;
    flex: none;
  }

  .sw-i .tit {
    max-width: 188px;
    font-size: 14px;
    line-height: 1.5;
    text-align: center;
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
    min-height: 0;
    height: auto;
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
    padding-top: 72px;
    padding-bottom: 42px;
  }

  .intro-layout {
    display: flex;
    flex-direction: column;
  }

  .intro-copy {
    order: 1;
    width: 100%;
    max-width: none;
  }

  .intro-visual {
    order: 2;
    min-height: 0;
    height: auto;
    width: 100%;
  }

  .intro-main {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    object-position: center;
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
    width: 100%;
    max-width: 100%;
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
    padding: 0 16px 24px;
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
    margin-left: 0;
    font-size: 32px;
    text-align: center;
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

