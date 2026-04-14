<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Play, Search, ChevronLeft, ChevronRight, Home } from 'lucide-vue-next'

const pageSize = 6
const searchTerm = ref('')
const currentPage = ref(1)
const activeVideo = ref(null)

const heroTabs = [
  { name: 'Business areas', path: '/business-areas#ctn1' },
  { name: 'Project Case', path: '/project-case' },
  { name: 'Video', path: '/video', active: true }
]

const videos = [
  {
    id: 1,
    title: 'Yangzhou Welcome Hotel',
    duration: 176,
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/b3a83348-f62b-4281-aadf-1c439e2e47fe.jpg',
    video: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/vedio/b4f77a09-9605-48e1-9a91-91cd93eff740.mp4'
  },
  {
    id: 2,
    title: 'Ye Chun',
    duration: 124,
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/06a7d205-f13a-4f40-924b-b7c85e99344e.jpg',
    video: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/vedio/b47e53a9-60b2-41ac-ab4f-8152ef3f782d.mp4'
  },
  {
    id: 3,
    title: 'Building 18, Phase 4 Of The State Guest House',
    duration: 132,
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/79d9152f-08c2-4ec1-b388-a56e947ffb27.jpg',
    video: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/vedio/721fee48-4586-42cd-887d-d34ca824b3cd.mp4'
  },
  {
    id: 4,
    title: 'Hirayama Banquet',
    duration: 109,
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/53c90c13-7015-476f-8cf9-b56f23e9dcf8.jpg',
    video: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/vedio/f7de182f-2588-4d2a-a293-c08bf2ff1dad.mp4'
  },
  {
    id: 5,
    title: 'Fun Garden PLUS',
    duration: 118,
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/f716b670-7f01-4abe-87c6-5c51c3d5b653.jpg',
    video: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/vedio/91dbef69-6052-4202-9514-df9fc72fd9c0.mp4'
  },
  {
    id: 6,
    title: 'Huaiyang Cuisine Museum',
    duration: 121,
    image: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/3d3c0ec4-64bb-4176-8967-1b913e4ca88e.jpg',
    video: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/vedio/8f357e93-7e07-468f-ac2a-9c4a339b5d97.mp4'
  }
]

const formatDuration = (seconds) => {
  const minutes = Math.trunc(seconds / 60)
  const remain = seconds % 60

  return minutes > 0 ? `${minutes}â€²${remain}â€³` : `${remain}â€³`
}

const filteredVideos = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  if (!keyword) {
    return videos
  }

  return videos.filter((item) => item.title.toLowerCase().includes(keyword))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVideos.value.length / pageSize)))

const pagedVideos = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredVideos.value.slice(start, start + pageSize)
})

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

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="video-page">
    <section class="video-hero">
      <div class="video-hero__media">
        <img
          src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4dc003a0-985d-4082-a4df-e3f89a455661.jpg"
          alt="Video banner"
        >
      </div>
      <div class="video-hero__overlay"></div>

      <div class="video-hero__content container">
        <div class="video-hero__title-wrap" data-aos="fade-up" data-aos-duration="900">
          <h1 id="video-page-title">VIDEO</h1>
          <img
            class="video-hero__mark"
            src="https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png"
            alt="Decor mark"
          >
        </div>
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

    <section class="video-content">
      <div class="video-content__bg"></div>
      <div class="video-content__inner container">
        <nav class="video-breadcrumb" aria-label="Breadcrumb" data-aos="fade-up" data-aos-duration="700">
          <router-link id="video-breadcrumb-home" to="/">
            <Home :size="14" />
            <span>Home</span>
          </router-link>
          <span class="video-breadcrumb__sep">â€º</span>
          <router-link id="video-breadcrumb-business" to="/business-areas#ctn1">Business presentation</router-link>
          <span class="video-breadcrumb__sep">â€º</span>
          <span class="video-breadcrumb__current">Video</span>
        </nav>

        <header class="video-heading" data-aos="fade-up" data-aos-duration="900">
          <h2>Video</h2>
          <div class="video-heading__line"></div>
        </header>

        <div class="video-search" data-aos="fade-up" data-aos-delay="80" data-aos-duration="900">
          <Search :size="18" />
          <input
            id="video-search-input"
            v-model="searchTerm"
            type="text"
            placeholder="Search"
          >
        </div>

        <div v-if="pagedVideos.length" class="video-list">
          <div class="video-grid">
            <article
              v-for="(video, index) in pagedVideos"
              :id="`video-card-${video.id}`"
              :key="video.id"
              class="video-card"
              :class="{
                'is-featured': index === 0,
                'is-tall': index === 1 || index === 2
              }"
              :data-aos="index < 3 ? 'fade-up' : 'fade-up'"
              :data-aos-delay="index * 80"
              @click="openVideo(video)"
            >
              <div class="video-card__media">
                <img :src="video.image" :alt="video.title">
                <div class="video-card__veil"></div>
                <span class="video-card__duration">{{ formatDuration(video.duration) }}</span>
                <button
                  :id="`video-play-${video.id}`"
                  class="video-card__play"
                  type="button"
                  :aria-label="`Play ${video.title}`"
                >
                  <Play :size="22" fill="currentColor" />
                </button>
              </div>
              <div class="video-card__title">{{ video.title }}</div>
            </article>
          </div>

          <div class="video-pagination" data-aos="fade-up" data-aos-delay="120">
            <button
              id="video-pagination-prev"
              type="button"
              class="video-pagination__btn"
              :disabled="currentPage === 1"
              @click="goPrev"
            >
              <ChevronLeft :size="14" />
              <span>prev</span>
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
              <span>next</span>
              <ChevronRight :size="14" />
            </button>
          </div>
        </div>

        <div v-else class="video-empty" data-aos="fade-up">
          <p>No matching videos found.</p>
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
        <div class="video-modal__dialog" data-aos="zoom-in" data-aos-duration="300">
          <button
            id="video-modal-close"
            type="button"
            class="video-modal__close"
            aria-label="Close video"
            @click="closeVideo"
          >
            Ã—
          </button>
          <div class="video-modal__player">
            <video :src="activeVideo.video" controls autoplay playsinline preload="auto"></video>
          </div>
          <div class="video-modal__caption">{{ activeVideo.title }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.video-page {
  background: #ffffff;
}

.video-hero {
  position: relative;
  min-height: 100vh;
  color: #ffffff;
  overflow: hidden;
}

.video-hero__media,
.video-hero__media img,
.video-hero__overlay {
  position: absolute;
  inset: 0;
}

.video-hero__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.03);
  animation: heroSlowZoom 9s ease-out forwards;
}

.video-hero__overlay {
  background:
    linear-gradient(180deg, rgba(10, 20, 44, 0.52) 0%, rgba(10, 20, 44, 0.16) 28%, rgba(10, 20, 44, 0.1) 56%, rgba(10, 20, 44, 0.38) 100%),
    radial-gradient(circle at 50% 12%, rgba(109, 203, 255, 0.44) 0%, rgba(109, 203, 255, 0) 46%);
}

.video-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding-top: 120px;
  padding-bottom: 160px;
}

.video-hero__title-wrap {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: 52px;
}

.video-hero__title-wrap h1 {
  font-family: 'Times New Roman', Georgia, serif;
  font-size: clamp(2.4rem, 2rem + 1.6vw, 3.6rem);
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.video-hero__mark {
  width: 34px;
  height: auto;
  object-fit: contain;
  opacity: 0.95;
}

.video-hero__tabs {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  background: rgba(17, 27, 46, 0.86);
  backdrop-filter: blur(9px);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.video-hero__tabs-inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.video-hero__tab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 64px;
  color: #d7c7a4;
  font-size: 18px;
  letter-spacing: 0.02em;
  transition: background-color 0.35s ease, color 0.35s ease;
}

.video-hero__tab:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-50%);
}

.video-hero__tab:hover,
.video-hero__tab.is-active {
  background: #ef0018;
  color: #ffffff;
}

.video-content {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, #f8f7f5 0%, #ffffff 14%, #ffffff 100%);
}

.video-content__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 18%, rgba(199, 191, 180, 0.28) 0%, rgba(199, 191, 180, 0) 22%),
    radial-gradient(circle at 80% 16%, rgba(210, 207, 201, 0.34) 0%, rgba(210, 207, 201, 0) 24%),
    linear-gradient(120deg, rgba(225, 223, 218, 0.22) 0%, rgba(225, 223, 218, 0) 36%, rgba(214, 211, 205, 0.18) 52%, rgba(214, 211, 205, 0) 74%),
    linear-gradient(90deg, transparent 0, transparent calc(33.333% - 0.5px), rgba(220, 216, 210, 0.5) calc(33.333% - 0.5px), rgba(220, 216, 210, 0.5) calc(33.333% + 0.5px), transparent calc(33.333% + 0.5px), transparent calc(66.666% - 0.5px), rgba(220, 216, 210, 0.5) calc(66.666% - 0.5px), rgba(220, 216, 210, 0.5) calc(66.666% + 0.5px), transparent calc(66.666% + 0.5px));
  opacity: 0.9;
  pointer-events: none;
}

.video-content__inner {
  position: relative;
  z-index: 1;
  padding-top: 74px;
  padding-bottom: 96px;
}

.video-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #8b8b8b;
  font-size: 14px;
}

.video-breadcrumb a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8b8b8b;
}

.video-breadcrumb a:hover {
  color: #d6001c;
}

.video-breadcrumb__sep {
  color: #b9b9b9;
}

.video-breadcrumb__current {
  color: #dd0015;
}

.video-heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 34px;
}

.video-heading h2 {
  font-family: 'Times New Roman', Georgia, serif;
  font-size: clamp(2.1rem, 1.95rem + 0.6vw, 2.75rem);
  font-weight: 700;
  color: #2c2b32;
}

.video-heading__line {
  position: relative;
  width: min(232px, 58vw);
  height: 2px;
  margin-top: 18px;
  background: #dd0015;
}

.video-heading__line::before,
.video-heading__line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 4px;
  height: 4px;
  background: #dd0015;
  border-radius: 50%;
  transform: translateY(-50%);
}

.video-heading__line::before {
  left: 0;
}

.video-heading__line::after {
  right: 0;
}

.video-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(100%, 1000px);
  margin: 34px auto 48px;
  padding: 0 20px;
  min-height: 54px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(228, 228, 228, 0.92);
  border-radius: 4px;
  box-shadow: 0 12px 30px rgba(28, 28, 28, 0.05);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.video-search:focus-within {
  border-color: rgba(221, 0, 21, 0.4);
  box-shadow: 0 18px 40px rgba(221, 0, 21, 0.1);
}

.video-search :deep(svg) {
  color: #9d9d9d;
  flex-shrink: 0;
}

.video-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #555555;
  font-size: 16px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.video-card {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  cursor: pointer;
  background: #e9e9e9;
  box-shadow: 0 18px 36px rgba(22, 26, 38, 0.08);
  transform: translateZ(0);
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease;
}

.video-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 48px rgba(22, 26, 38, 0.16);
}

.video-card.is-featured {
  grid-column: 1 / span 2;
  grid-row: span 2;
}

.video-card.is-featured .video-card__media {
  min-height: 364px;
}

.video-card.is-tall .video-card__media {
  min-height: 172px;
}

.video-card:not(.is-featured):not(.is-tall) .video-card__media {
  min-height: 142px;
}

.video-card__media {
  position: relative;
  min-height: 160px;
}

.video-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.75s cubic-bezier(0.22, 1, 0.36, 1), filter 0.45s ease;
}

.video-card__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.06) 48%, rgba(0, 0, 0, 0.46) 100%);
}

.video-card__duration {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 20px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(114, 114, 114, 0.92);
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  z-index: 2;
}

.video-card__play {
  position: absolute;
  top: 50%;
  left: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  backdrop-filter: blur(8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.84);
  transition: opacity 0.35s ease, transform 0.35s ease, background-color 0.35s ease;
  z-index: 2;
  pointer-events: none;
}

.video-card:hover .video-card__play {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.video-card:hover .video-card__media img {
  transform: scale(1.07);
  filter: saturate(1.06);
}

.video-card:hover .video-card__play {
  background: rgba(221, 0, 21, 0.86);
}

.video-card__title {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
  z-index: 2;
  padding: 0 18px;
  color: #ffffff;
  text-align: center;
  font-size: clamp(1rem, 0.96rem + 0.2vw, 1.2rem);
  line-height: 1.15;
  letter-spacing: 0.05em;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.32);
}

.video-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 44px;
}

.video-pagination__btn,
.video-pagination__page {
  border: 1px solid #ececec;
  background: rgba(255, 255, 255, 0.96);
  color: #818181;
  transition: all 0.28s ease;
}

.video-pagination__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 78px;
  height: 26px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
}

.video-pagination__page {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  font-size: 12px;
}

.video-pagination__btn:hover:not(:disabled),
.video-pagination__page:hover:not(.is-active) {
  color: #dd0015;
  border-color: rgba(221, 0, 21, 0.32);
  transform: translateY(-1px);
}

.video-pagination__page.is-active {
  background: #dd0015;
  border-color: #dd0015;
  color: #ffffff;
}

.video-pagination__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.video-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #777777;
  font-size: 18px;
}

.video-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(9, 12, 19, 0.82);
  backdrop-filter: blur(6px);
}

.video-modal__dialog {
  position: relative;
  width: min(1100px, 100%);
}

.video-modal__player {
  border-radius: 16px;
  overflow: hidden;
  background: #000000;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.42);
}

.video-modal__player video {
  display: block;
  width: 100%;
  max-height: min(76vh, 820px);
  background: #000000;
}

.video-modal__caption {
  margin-top: 14px;
  color: #ffffff;
  text-align: center;
  font-size: 18px;
  letter-spacing: 0.03em;
}

.video-modal__close {
  position: absolute;
  top: -18px;
  right: -18px;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #111111;
  font-size: 30px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  transition: transform 0.25s ease, background-color 0.25s ease;
}

.video-modal__close:hover {
  transform: scale(1.08) rotate(90deg);
  background: #f4f4f4;
}

.video-modal-fade-enter-active,
.video-modal-fade-leave-active {
  transition: opacity 0.3s ease;
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
    transform: scale(1.02);
  }
}

@media (max-width: 1200px) {
  .video-hero__title-wrap {
    margin-left: 20px;
  }

  .video-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .video-card.is-featured {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .video-card.is-featured .video-card__media {
    min-height: 320px;
  }
}

@media (max-width: 768px) {
  .video-hero {
    min-height: 72vh;
  }

  .video-hero__content {
    min-height: 72vh;
    padding-top: 92px;
    padding-bottom: 112px;
  }

  .video-hero__title-wrap {
    margin-left: 0;
    gap: 12px;
  }

  .video-hero__mark {
    width: 28px;
  }

  .video-hero__tabs-inner {
    grid-template-columns: 1fr;
  }

  .video-hero__tab {
    min-height: 54px;
    font-size: 15px;
  }

  .video-hero__tab:not(:last-child)::after {
    display: none;
  }

  .video-content__inner {
    padding-top: 38px;
    padding-bottom: 64px;
  }

  .video-heading {
    margin-top: 22px;
  }

  .video-search {
    margin: 26px auto 28px;
    min-height: 48px;
    padding: 0 14px;
  }

  .video-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .video-card.is-featured,
  .video-card.is-tall {
    grid-column: auto;
    grid-row: auto;
  }

  .video-card.is-featured .video-card__media,
  .video-card.is-tall .video-card__media,
  .video-card:not(.is-featured):not(.is-tall) .video-card__media {
    min-height: 220px;
  }

  .video-card__title {
    padding: 0 14px;
    bottom: 10px;
    font-size: 16px;
  }

  .video-card__play {
    opacity: 1;
    width: 54px;
    height: 54px;
    transform: translate(-50%, -50%) scale(1);
    background: rgba(221, 0, 21, 0.78);
  }

  .video-pagination {
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 30px;
  }

  .video-modal {
    padding: 16px;
  }

  .video-modal__close {
    top: -12px;
    right: -4px;
    width: 36px;
    height: 36px;
    font-size: 26px;
  }
}
</style>

