<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import { Pagination } from "swiper/modules";
import AOS from "aos";
import { ChevronLeft, ChevronRight, Home } from "lucide-vue-next";
import { uiState } from "@/shared/utils/uiState";
import { getNewsList } from "@/views/user/services/publicApi";
import { newsHero } from "./data/newsData";

const pageSize = 6;
const featuredSize = 2;
const currentPage = ref(1);
const listSection = ref(null);

const items = ref([]);
const featured = ref([]);
const total = ref(0);
const loading = ref(false);
const error = ref(null);

const sliderModules = [Pagination];
const featuredItems = computed(() => featured.value);
const pagedItems = computed(() => items.value);
const displayTotalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize)),
);

const imageUrl = (item) =>
  item?.thumbnail_url || item?.image?.url || item?.image || "";

const paginationItems = computed(() => {
  const t = displayTotalPages.value;
  const current = currentPage.value;

  if (t <= 6) {
    return Array.from({ length: t }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, "ellipsis-end", t];
  }

  if (current >= t - 3) {
    return [1, "ellipsis-start", t - 3, t - 2, t - 1, t];
  }

  return [
    1,
    "ellipsis-start",
    current - 1,
    current,
    current + 1,
    "ellipsis-end",
    t,
  ];
});

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
};

function normalizeNewsItem(item = {}) {
  return {
    ...item,
    content_html: item?.content_html || item?.content || "",
    body: item?.body || item?.content || "",
  };
}

async function fetchFeatured() {
  try {
    const res = await getNewsList({ skip: 0, limit: featuredSize });
    featured.value = Array.isArray(res?.items)
      ? res.items.map(normalizeNewsItem)
      : [];
  } catch {
    featured.value = [];
  }
}

async function fetchPage() {
  loading.value = true;
  error.value = null;

  try {
    const skip = (currentPage.value - 1) * pageSize;
    const res = await getNewsList({ skip, limit: pageSize });
    items.value = Array.isArray(res?.items)
      ? res.items.map(normalizeNewsItem)
      : [];
    total.value = Number(res?.total || 0);
  } catch (err) {
    error.value = err?.message || "Failed to load news";
    items.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

const refreshAnimations = async () => {
  await nextTick();
  AOS.refreshHard();
};

const scrollToSection = (target) => {
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 16;
  window.scrollTo({ top, behavior: "smooth" });
};

const goToPage = async (page) => {
  if (page < 1 || page > displayTotalPages.value || page === currentPage.value)
    return;
  currentPage.value = page;
  await fetchPage();
  await refreshAnimations();
  scrollToSection(listSection.value);
};

const animationDelay = (index) => `${index * 100}`;

onMounted(async () => {
  uiState.isHeaderHovered = false;
  uiState.isHeaderHidden = false;
  uiState.isFooterHidden = false;
  await Promise.all([fetchFeatured(), fetchPage()]);
  await refreshAnimations();
});

onBeforeUnmount(() => {
  uiState.isHeaderHidden = false;
});
</script>

<template>
  <div class="news-center-page">
    <section class="news-hero">
      <div class="hero-media">
        <img
          class="hero-banner hero-banner--pc"
          :src="newsHero.bannerImage"
          :alt="newsHero.title"
        />
        <img
          class="hero-banner hero-banner--mobile"
          :src="newsHero.mobileBannerImage"
          :alt="newsHero.title"
        />
      </div>

      <div class="hero-info">
        <div class="news-shell hero-shell">
          <div class="hero-copy" data-aos="fade-up">
            <div class="hero-title-row">
              <h1>{{ newsHero.title }}</h1>
              <img :src="newsHero.stampImage" alt="News Center decoration" />
            </div>
            <div class="hero-line"></div>
            <p>{{ newsHero.subtitle }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="news-breadcrumb">
      <div class="news-shell breadcrumb-shell">
        <div class="breadcrumb-list">
          <router-link to="/">
            <Home :size="15" />
            <span>Home</span>
          </router-link>
          <span class="separator">></span>
          <span class="current">News</span>
        </div>
      </div>

      <div class="breadcrumb-decoration">
        <img :src="newsHero.breadcrumbImage" alt="News decoration" />
      </div>
    </section>

    <section
      v-if="featuredItems.length"
      class="featured-section"
      :style="{ backgroundImage: `url(${newsHero.featuredBackground})` }"
    >
      <div class="news-shell featured-shell">
        <header class="section-heading" data-aos="fade-down">
          <div class="section-heading-top">
            <h2>News Center</h2>
            <img :src="newsHero.sectionDecoration" alt="Section decoration" />
          </div>
          <p>Latest updates</p>
          <div class="section-line"></div>
        </header>

        <Swiper
          class="featured-slider"
          :modules="sliderModules"
          :pagination="{ clickable: true }"
          :speed="600"
        >
          <SwiperSlide v-for="item in featuredItems" :key="item.slug">
            <article class="featured-card" data-aos="fade-up">
              <router-link :to="`/news/${item.slug}`" class="featured-image">
                <img :src="imageUrl(item)" :alt="item.title" />
              </router-link>

              <div class="featured-copy">
                <span class="featured-date">{{
                  formatDate(item.published_at || item.created_at)
                }}</span>
                <router-link :to="`/news/${item.slug}`" class="featured-title">
                  {{ item.title }}
                </router-link>
                <div class="featured-divider"></div>
                <p>{{ item.summary }}</p>
              </div>
            </article>
          </SwiperSlide>
        </Swiper>
      </div>
    </section>

    <section
      ref="listSection"
      class="news-list-section"
      :style="{ backgroundImage: `url(${newsHero.listBackground})` }"
    >
      <div class="news-shell list-shell">
        <div v-if="loading" class="news-status-card">
          <p>Loading news...</p>
        </div>

        <div v-else-if="error" class="news-status-card news-status-card--error">
          <p>{{ error }}</p>
        </div>

        <div v-else class="news-grid">
          <article
            v-for="(item, index) in pagedItems"
            :key="item.slug"
            class="news-card"
            data-aos="fade-up"
            :data-aos-delay="animationDelay(index)"
          >
            <router-link :to="`/news/${item.slug}`" class="news-card-image">
              <img :src="imageUrl(item)" :alt="item.title" />
            </router-link>

            <div class="news-card-body">
              <router-link :to="`/news/${item.slug}`" class="news-card-title">
                {{ item.title }}
              </router-link>
              <span class="news-card-date">{{
                formatDate(item.published_at || item.created_at)
              }}</span>
              <div class="news-card-line"></div>
            </div>
          </article>

          <div
            v-if="!pagedItems.length"
            class="news-status-card news-status-card--empty"
          >
            <p>No news articles found.</p>
          </div>
        </div>

        <div v-if="displayTotalPages > 1" class="pagination-bar">
          <button
            type="button"
            class="page-arrow"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <ChevronLeft :size="18" />
          </button>

          <template v-for="item in paginationItems" :key="`page-${item}`">
            <span v-if="typeof item === 'string'" class="page-ellipsis"
              >...</span
            >
            <button
              v-else
              type="button"
              :class="['page-number', { active: currentPage === item }]"
              @click="goToPage(item)"
            >
              {{ item }}
            </button>
          </template>

          <button
            type="button"
            class="page-arrow"
            :disabled="currentPage === displayTotalPages"
            @click="goToPage(currentPage + 1)"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.news-center-page {
  background: #fff;
}

.news-shell {
  width: 1440px;
  margin: 0 auto;
}

.news-hero {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.hero-media,
.hero-info {
  position: absolute;
  inset: 0;
}

.hero-media::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(18, 29, 52, 0.18) 0%,
      rgba(18, 29, 52, 0.06) 42%,
      rgba(18, 29, 52, 0.45) 100%
    ),
    linear-gradient(
      90deg,
      rgba(17, 27, 47, 0.18) 0%,
      rgba(17, 27, 47, 0.04) 34%,
      rgba(17, 27, 47, 0.04) 100%
    );
}

.hero-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-banner--mobile {
  display: none;
}

.hero-info {
  z-index: 1;
  display: flex;
  align-items: center;
}

.hero-shell {
  width: 100%;
}

.hero-copy {
  color: #fff;
  padding-top: 96px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  line-height: 1;
  margin-left: 160px;

  h1 {
    margin: 0;
    font-family: "Times New Roman", serif;
    font-size: 2.25rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    background: transparent;
    padding: 0;
  }

  img {
    width: auto;
    height: 42px;
    margin-left: 70px;
  }
}

.hero-line {
  position: relative;
  width: 28.56%;
  min-width: 320px;
  height: 1px;
  margin: 8px 0 38px;
  background: #bb272b;

  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 50%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #bb272b;
    transform: translate(50%, -50%);
  }
}

.hero-copy p {
  max-width: 50%;
  margin: 0;
  margin-left: 160px;
  font-size: 1.125rem;
  line-height: 1.6;
}

.hero-tabs-bar {
  position: relative;
  z-index: 4;
  margin-top: -80px;
  background: rgba(22, 33, 52, 0.9);
}

.hero-tabs {
  display: flex;
  align-items: stretch;
  height: 80px;

  button {
    position: relative;
    flex: 1 1 50%;
    border: 0;
    background: transparent;
    color: #ebc8a7;
    font-size: 1rem;
    letter-spacing: 0.8px;
    cursor: pointer;
    transition:
      background-color 0.3s ease,
      color 0.3s ease;

    &::after {
      content: "";
      position: absolute;
      right: 0;
      top: 50%;
      width: 1px;
      height: 12px;
      background: #ebc8a7;
      transform: translateY(-50%);
    }

    &:last-child::after {
      display: none;
    }

    &:hover,
    &.active {
      background: #e9010e;
      color: #fff;
    }
  }
}

.news-breadcrumb {
  position: relative;
  overflow: hidden;
  background: #fff;
}

.breadcrumb-shell {
  position: relative;
  z-index: 1;
  padding: 1.5% 0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  color: #666;
  font-size: 1rem;

  a,
  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #666;
    border: 0;
    background: transparent;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }

  .separator {
    color: #999;
  }

  .current {
    color: #ce0021;
  }
}

.breadcrumb-decoration {
  position: absolute;
  right: 0;
  top: 0;
  width: 39.58%;

  img {
    width: 100%;
    height: auto;
  }
}

.industry-strip {
  position: absolute;
  top: 0;
  right: 0;
  width: min(44vw, 846px);
  height: 72px;
  background: repeating-linear-gradient(
    90deg,
    rgba(193, 0, 0, 0.9) 0 3px,
    rgba(193, 0, 0, 0.72) 3px 6px,
    rgba(214, 0, 0, 0.95) 6px 110px
  );
  overflow: hidden;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 120px;
    background: repeating-linear-gradient(
      90deg,
      rgba(121, 0, 0, 0.18) 0 2px,
      rgba(121, 0, 0, 0.55) 2px 4px,
      transparent 4px 8px
    );
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.featured-section {
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
}

.featured-shell {
  padding: 58px 0 62px;
}

.section-heading {
  margin-bottom: 38px;
  text-align: center;
}

.section-heading-top {
  display: flex;
  align-items: center;
  justify-content: center;

  h2 {
    margin: 0;
    color: #333;
    font-family: "Times New Roman", serif;
    font-size: 4rem;
    font-weight: 700;
    line-height: 1;
  }

  img {
    width: auto;
    height: 38px;
    margin-left: 42px;
  }
}

.section-heading p {
  margin: 18px 0 0;
  color: #333;
  font-family: Arial, sans-serif;
  font-size: 1.5rem;
  line-height: 1.2;
}

.section-line {
  position: relative;
  width: 350px;
  height: 2px;
  margin: 20px auto 0;
  background: #bb272b;

  &::before,
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #bb272b;
    transform: translateY(-50%);
  }

  &::before {
    left: 0;
    transform: translate(-50%, -50%);
  }

  &::after {
    right: 0;
    transform: translate(50%, -50%);
  }
}

.featured-slider {
  width: 100%;
  overflow: hidden;
  padding-bottom: 30px;
}

.featured-card {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.featured-image {
  flex: 0 0 60%;
  padding-right: 2vw;

  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.featured-copy {
  flex: 1 1 40%;
  min-width: 0;
}

.featured-date,
.news-card-date,
.industry-item-date {
  display: block;
  min-height: 20px;
  color: #8b6e5d;
  font-size: 1.1rem;
}

.featured-date {
  margin-top: 2vw;
}

.featured-title,
.news-card-title,
.industry-item-title {
  display: -webkit-box;
  overflow: hidden;
  color: #333;
  font-weight: 700;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  transition: color 0.5s ease;

  &:hover {
    color: #b92b2f;
  }
}

.featured-title {
  margin-top: 1.5vw;
  font-size: 2rem;
  -webkit-line-clamp: 1;
}

.featured-divider,
.news-card-line {
  position: relative;
  width: 90%;
  height: 1px;
  margin-top: 18px;
  background: #d8d8d8;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: -2px;
    width: 20%;
    height: 4px;
    background: #b92b2f;
  }
}

.featured-copy p {
  display: -webkit-box;
  height: 6em;
  margin-top: 1.5vw;
  overflow: hidden;
  color: #8b6e5d;
  font-size: 1rem;
  line-height: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.featured-slider :deep(.swiper-pagination-bullet) {
  width: 12px;
  height: 12px;
  opacity: 1;
  background: #e8bc94;
}

.featured-slider :deep(.swiper-pagination-bullet-active) {
  background: #d7000f;
}

.news-list-section {
  min-height: 300px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.list-shell {
  padding-top: 80px;
}

.industry-heading {
  margin-bottom: 72px;
}

.news-list-section--industry {
  background-color: #fff;
  background-size: contain;
  background-position: right top;
}

.news-list-section--industry .list-shell {
  padding-top: 58px;
  padding-bottom: 90px;
}

.news-list-section--industry .section-heading {
  margin-bottom: 72px;
}

.news-list-section--industry .section-heading-top h2 {
  font-size: 3.9rem;
}

.news-list-section--industry .section-heading-top img {
  height: 48px;
  margin-left: 28px;
}

.news-list-section--industry .section-heading p {
  display: none;
}

.news-list-section--industry .section-line {
  width: 630px;
  margin-top: 22px;
}

.news-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.news-card {
  position: relative;
  width: calc((100% - 80px) / 3);
  margin-bottom: 40px;
  background: #fff;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
}

.news-card-image {
  display: block;
  position: relative;
  height: 0;
  overflow: hidden;
  padding-bottom: 56%;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
}

.news-card:hover .news-card-image img {
  transform: scale(1.05);
}

.news-card-body {
  position: relative;
  padding: 2vw 2vw 2.5vw;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 4px;
    background: #d7000f;
    transition: width 0.4s linear;
  }
}

.news-card:hover .news-card-body::after {
  width: 100%;
}

.news-card-title {
  height: 3em;
  margin-bottom: 1.5vw;
  font-size: 1.45rem;
  -webkit-line-clamp: 2;
}

.news-card-date {
  margin-top: 0;
}

.industry-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 30px;
  padding-bottom: 36px;
}

.industry-item {
  min-width: 0;
  padding: 0;
  background: #fff;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
}

.industry-item-link {
  display: block;
  padding: 0 30px 28px;
}

.industry-item-topline {
  width: calc(100% + 60px);
  height: 4px;
  margin-left: -30px;
  background: #d7000f;
}

.industry-item-title {
  display: -webkit-box;
  min-height: 2.9em;
  margin-top: 42px;
  overflow: hidden;
  font-size: 1.38rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.industry-item-date {
  margin-top: 22px;
}

.industry-item p {
  display: -webkit-box;
  min-height: 5.8em;
  margin-top: 24px;
  overflow: hidden;
  color: #97a1b0;
  font-size: 0.96rem;
  line-height: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 8px 0 86px;
}

.page-arrow,
.page-number,
.page-ellipsis {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: #666;
  font-size: 1rem;
  line-height: 38px;
  text-align: center;
}

.page-arrow,
.page-number {
  border: 1px solid #c7c7c8;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover:not(:disabled) {
    border-color: #ec0000;
    color: #ec0000;
  }

  &.active {
    border-color: #ec0000;
    background: #ec0000;
    color: #fff;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.page-ellipsis {
  border: 1px solid #c7c7c8;
}

.news-status-card {
  width: 100%;
  padding: 28px 24px;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(215, 0, 15, 0.08);
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.06);
  text-align: center;

  p {
    margin: 0;
    color: #5b6473;
    font-size: 1rem;
    line-height: 1.7;
  }
}

.news-status-card--error {
  border-color: rgba(215, 0, 15, 0.18);

  p {
    color: #b42318;
  }
}

.news-status-card--empty {
  margin-top: 10px;
}

@media (max-width: 1600px) {
  .news-shell {
    width: 80%;
  }

  .hero-title-row img {
    margin-left: 60px;
  }
}

@media (max-width: 1200px) {
  .news-shell {
    width: 90%;
  }

  .hero-title-row img {
    margin-left: 20px;
  }

  .hero-copy p {
    max-width: 100%;
  }

  .featured-card {
    flex-direction: column;
    gap: 28px;
  }

  .featured-image {
    flex-basis: 100%;
    padding-right: 0;
  }

  .news-card {
    width: calc((100% - 24px) / 2);
    margin-bottom: 24px;
  }

  .industry-item {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .news-hero {
    min-height: auto;
  }

  .hero-media,
  .hero-info {
    position: relative;
  }

  .hero-media {
    height: 400px;
  }

  .hero-banner--pc {
    display: none;
  }

  .hero-banner--mobile {
    display: block;
  }

  .hero-info {
    margin-top: -400px;
    min-height: 400px;
    padding-bottom: 40px;
  }

  .hero-copy {
    padding-top: 120px;
  }

  .hero-title-row {
    align-items: flex-start;
    margin-left: 24px;

    h1 {
      font-size: 2.2rem;
      padding: 6px 12px 8px;
    }

    img {
      height: 34px;
      margin-left: 16px;
    }
  }

  .hero-line {
    width: 44%;
    min-width: 180px;
    margin-bottom: 30px;
  }

  .hero-copy p {
    max-width: 100%;
    margin-left: 24px;
    font-size: 1.25rem;
  }

  .hero-tabs-bar {
    margin-top: -40px;
  }

  .hero-tabs {
    height: 40px;

    button {
      font-size: 0.95rem;
    }
  }

  .breadcrumb-decoration {
    display: none;
  }

  .industry-strip {
    height: 40px;
    width: 52vw;
  }

  .section-heading-top h2 {
    font-size: 2.4rem;
  }

  .section-heading-top img {
    height: 28px;
    margin-left: 20px;
  }

  .section-heading p {
    font-size: 1.1rem;
  }

  .section-line {
    width: 90%;
    max-width: 350px;
  }

  .featured-shell {
    padding: 38px 0 40px;
  }

  .featured-title {
    font-size: 1.35rem;
    -webkit-line-clamp: 2;
  }

  .list-shell {
    padding-top: 20px;
  }

  .news-list-section--industry .list-shell {
    padding-top: 26px;
    padding-bottom: 56px;
  }

  .news-list-section--industry .section-heading-top h2 {
    font-size: 2.3rem;
  }

  .news-list-section--industry .section-heading-top img {
    height: 34px;
  }

  .news-list-section--industry .section-line {
    width: calc(100% - 24px);
  }

  .news-card {
    width: 100%;
  }

  .news-card-body {
    padding: 20px;
  }

  .news-card-title {
    height: auto;
    font-size: 1.15rem;
  }

  .pagination-bar {
    flex-wrap: wrap;
    gap: 10px;
    padding-bottom: 56px;
  }

  .industry-list {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .industry-item-link {
    padding: 0 20px 22px;
  }

  .industry-item-topline {
    width: calc(100% + 40px);
    margin-left: -20px;
  }

  .industry-item-title {
    margin-top: 26px;
    font-size: 1.15rem;
  }
}
</style>
