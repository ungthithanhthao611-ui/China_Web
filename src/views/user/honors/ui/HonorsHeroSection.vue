<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'

import { useI18n } from 'vue-i18n'

defineProps({
  hero: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['go-section'])

const { t } = useI18n()

const swiperModules = [Autoplay, Pagination, EffectFade]
</script>

<template>
  <section id="page1" class="hero" v-if="hero.is_active">
    <Swiper
      :modules="swiperModules"
      :slides-per-view="1"
      :loop="hero.banners.length > 1"
      :effect="'fade'"
      :autoplay="{
        delay: 5000,
        disableOnInteraction: false,
      }"
      :pagination="{
        clickable: true,
        dynamicBullets: true,
      }"
      class="hero-swiper"
    >
      <SwiperSlide v-for="(slide, index) in hero.banners" :key="index">
        <div class="hero-slide-content">
          <div class="hero-media">
            <picture>
              <img :src="slide.background" :alt="slide.title" loading="eager" />
            </picture>
          </div>
          <div class="shade"></div>
          <div class="hero-noise"></div>

            <div class="content__copy reveal-item">
              <div class="title-row">
                <h1 v-if="slide.title">{{ slide.title }}</h1>
                <div class="line"></div>
              </div>
            </div>
        </div>
      </SwiperSlide>
    </Swiper>

    <div class="hero-tabs reveal-item">
      <button type="button" @click="emit('go-section', 'page2')">{{ t('user.capability.factoryGallery') }}</button>
      <button type="button" @click="emit('go-section', 'page3')">{{ t('user.capability.techTitle') }}</button>
      <button type="button" @click="emit('go-section', 'page3')">{{ t('user.capability.honorsAwards') }}</button>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 0 108px;
  overflow: hidden;
}

.hero-swiper {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

.hero-slide-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-media,
.hero-media picture,
.hero-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-media {
  overflow: hidden;
}

.hero-media img {
  object-fit: cover;
  object-position: center center;
}

.shade {
  position: absolute;
  inset: 0;
  background: transparent;
}

.hero-noise {
  display: none;
}

.hero::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 86px;
  width: min(1240px, calc(100% - 60px));
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.26), transparent);
  z-index: 1;
}

.content {
  width: min(1100px, calc(100% - 48px));
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: end;
}

.content__copy {
  min-width: 0;
  max-width: 600px;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: none;
  backdrop-filter: none;
  box-shadow: none;
}

.hero-kicker {
  display: none;
}

.title-row {
  display: grid;
  gap: 12px;
}

.seal-chip {
  display: none;
}

.seal-chip img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

h1 {
  margin: 0;
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2.25rem, 1.8rem + 1.8vw, 4rem);
  font-weight: 900;
  line-height: 1.04;
  letter-spacing: -0.035em;
  max-width: 560px;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.28);
}

.line {
  margin-top: 14px;
  width: min(260px, 48vw);
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ef4444, rgba(249, 115, 22, 0.2));
}

p {
  margin: 14px 0 0;
  max-width: 500px;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero-btn {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
}

.hero-btn--primary {
  border: none;
  background: linear-gradient(135deg, #dc2626, #f97316);
  color: #fff;
  box-shadow: 0 12px 22px rgba(220, 38, 38, 0.18);
}

.hero-btn--ghost {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  backdrop-filter: blur(10px);
}

.hero-panel {
  display: none;
}

.hero-panel__card,
.hero-panel__metrics article {
  border-radius: 28px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 42px rgba(15, 23, 42, 0.12);
}

.hero-panel__card {
  display: grid;
  gap: 12px;
  padding: 24px;
}

.hero-panel__card span,
.hero-panel__metrics article span {
  color: #78522b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-panel__card strong {
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 26px;
  line-height: 1.3;
}

.hero-panel__card p {
  margin: 0;
  color: #475569;
  font-size: 14px;
  line-height: 1.8;
}

.hero-panel__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.hero-panel__metrics article {
  display: grid;
  gap: 10px;
  padding: 20px;
}

.hero-panel__metrics strong {
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 26px;
}

.hero-tabs {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(1100px, calc(100% - 48px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-radius: 22px 22px 0 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.96);
  z-index: 2;
  backdrop-filter: blur(14px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
}

.hero-tabs button {
  min-height: 64px;
  border: none;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease;
}

.hero-tabs button + button {
  border-left: 1px solid rgba(226, 232, 240, 0.96);
}

.hero-tabs button:hover {
  background: rgba(59, 130, 246, 0.06);
  color: #0f172a;
}

@media (max-width: 1199px) {
  .hero {
    min-height: auto;
    padding: 112px 0 128px;
  }

  .content {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }

  h1 {
    max-width: 560px;
  }
}

@media (max-width: 991px) {
  .hero {
    min-height: auto;
    padding: 102px 0 128px;
  }

  .hero::after {
    bottom: 108px;
    width: min(1100px, calc(100% - 36px));
  }

  .content {
    width: calc(100% - 36px);
    grid-template-columns: 1fr;
    align-items: start;
    gap: 20px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-panel__card,
  .hero-panel__metrics article {
    border-radius: 24px;
  }

  .hero-tabs {
    width: calc(100% - 36px);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .hero {
    min-height: auto;
    padding: 82px 0 170px;
  }

  .hero::after {
    bottom: 144px;
    width: calc(100% - 20px);
  }

  .content,
  .hero-tabs {
    width: calc(100% - 20px);
  }

  .content__copy {
    padding: 0;
    border-radius: 0;
    background: transparent;
  }

  .hero-kicker {
    margin-bottom: 16px;
    padding: 9px 14px;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  .title-row {
    gap: 10px;
  }

  h1 {
    max-width: 100%;
    font-size: clamp(1.85rem, 1.55rem + 2.3vw, 2.8rem);
    line-height: 1.06;
  }

  .line {
    margin-top: 10px;
    width: min(150px, 40vw);
  }

  p {
    font-size: 13px;
    line-height: 1.56;
  }

  .hero-actions,
  .hero-panel__metrics {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  .hero-btn {
    width: 100%;
    min-height: 42px;
    font-size: 11px;
  }

  .hero-panel__card {
    padding: 20px;
  }

  .hero-panel__card strong,
  .hero-panel__metrics strong {
    font-size: 22px;
  }

  .hero-tabs {
    grid-template-columns: 1fr;
    border-radius: 20px 20px 0 0;
  }

  .hero-tabs button {
    min-height: 48px;
    padding: 0 12px;
    font-size: 12px;
  }

  .hero-tabs button + button {
    border-left: none;
    border-top: 1px solid rgba(226, 232, 240, 0.96);
  }
}

@media (max-width: 479px) {
  .hero {
    padding: 84px 0 196px;
  }

  .content,
  .hero-tabs,
  .hero::after {
    width: calc(100% - 20px);
  }

  .seal-chip {
    min-height: 42px;
    padding: 0 14px;
    font-size: 12px;
  }

  .seal-chip img {
    width: 22px;
    height: 22px;
  }

  .hero-panel__metrics article,
  .hero-panel__card {
    padding: 18px;
  }
}

:deep(.swiper-pagination-bullet) {
  background: #fff;
  opacity: 0.5;
}

:deep(.swiper-pagination-bullet-active) {
  background: #d90017;
  opacity: 1;
}

:deep(.swiper-pagination) {
  bottom: 100px !important;
}

@media (max-width: 991px) {
  :deep(.swiper-pagination) {
    bottom: 130px !important;
  }
}

@media (max-width: 767px) {
  :deep(.swiper-pagination) {
    bottom: 170px !important;
  }
}

/* ── Hero Reveal Animations ── */
.reveal-item {
  animation: heroReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  opacity: 0;
}

@keyframes heroReveal {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-tabs.reveal-item {
  animation-delay: 0.4s;
}

.content__copy.reveal-item {
  animation-delay: 0.2s;
}
</style>

