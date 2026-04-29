<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAboutPage } from '@/views/user/about/composables/useAboutPage'
import { useSectionReveal } from '@/views/user/home/composables/useSectionReveal'

const { aboutView, loading } = useAboutPage()
const { rootRef, isVisible } = useSectionReveal({ threshold: 0.24 })
const { locale, t } = useI18n({ useScope: 'global' })

const intro = computed(() => aboutView.value?.companyIntroduction || null)
const title = computed(() => {
  if (locale.value === 'vi') return intro.value?.title || aboutView.value?.introSectionTitle || t('user.home.aboutTitle')
  return t('user.home.aboutTitle')
})
const paragraphs = computed(() => {
  if (locale.value !== 'vi') {
    return [t('user.home.aboutDescription1'), t('user.home.aboutDescription2')]
  }
  const rows = Array.isArray(intro.value?.paragraphs) ? intro.value.paragraphs : []
  return rows.filter((item) => String(item || '').trim())
})

const imageUrl = computed(() => String(intro.value?.coverImage || '').trim())
</script>

<template>
  <section class="home-about-quick" ref="rootRef">
    <div class="shell home-reveal" :class="{ 'is-visible': isVisible }">
      <div class="content" data-reveal-item>
        <p class="eyebrow">{{ t('user.home.about') }}</p>
        <h2>{{ title }}</h2>
        <span class="divider"></span>

        <div class="summary">
          <template v-if="paragraphs.length">
            <p v-for="(paragraph, index) in paragraphs" :key="`${index}-${paragraph.slice(0, 20)}`">
              {{ paragraph }}
            </p>
          </template>
          <p v-else>{{ loading ? t('user.home.aboutLoading') : t('user.home.aboutEmpty') }}</p>
        </div>

        <div class="stats">
          <div class="stat">
            <strong>20+</strong>
            <span>{{ t('user.home.productSamples') }}</span>
          </div>

          <div class="stat">
            <strong>2024</strong>
            <span>{{ t('user.home.foundedYear') }}</span>
          </div>
        </div>
      </div>

      <div class="visual" data-reveal-item>
        <img v-if="imageUrl" :src="imageUrl" :alt="title" loading="lazy" />
        <div v-else class="placeholder"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-about-quick {
  min-height: 100vh;
  padding-top: 132px;
  padding-bottom: 72px;
  background: #f3f3f5;
}

.shell {
  width: 100%;
  max-width: none;
  padding-left: 196px;
  padding-right: 0;
  display: grid;
  grid-template-columns: minmax(420px, 1fr) minmax(620px, 1fr);
  gap: clamp(28px, 4vw, 56px);
  align-items: start;
}

.content {
  max-width: 760px;
  padding-top: 34px;
}

.eyebrow {
  margin: 0;
  color: #b7ad9b;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h2 {
  margin: 8px 0 0;
  color: #33363d;
  font-size: clamp(40px, 3.2vw, 60px);
  line-height: 1.08;
  font-family: var(--home-font-body, 'Manrope', 'Segoe UI', Arial, sans-serif);
  font-weight: 700;
}

.divider {
  margin-top: 16px;
  display: block;
  width: min(580px, 30vw);
  height: 2px;
  background: #8f8c87;
}

.summary {
  margin: 20px 0 0;
  max-width: 680px;
  display: grid;
  gap: 10px;
}

.summary p {
  margin: 0;
  color: #896f56;
  font-size: clamp(16px, 1vw, 17px);
  line-height: 2;
  letter-spacing: 0.01em;
  word-spacing: 0.1em;
  text-align: justify;
}

.stats {
  margin-top: 30px;
  display: flex;
  gap: clamp(28px, 4vw, 48px);
  align-items: flex-start;
}

.stat {
  display: grid;
  gap: 6px;
}

.stat strong {
  color: #33363d;
  font-size: clamp(34px, 2.5vw, 48px);
  line-height: 1;
  font-weight: 700;
}

.stat span {
  color: #a19f9a;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
}

.visual {
  position: relative;
  width: min(44vw, 830px);
  height: clamp(360px, 58vh, 700px);
  margin-top: clamp(34px, 3vw, 52px);
  justify-self: end;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
}

.visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.placeholder {
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(
      -28deg,
      rgba(255, 255, 255, 0.08) 0 8px,
      rgba(0, 0, 0, 0.1) 8px 16px
    );
}

@media (max-width: 1400px) {
  .shell {
    padding-left: 80px;
    grid-template-columns: minmax(380px, 1fr) minmax(520px, 1fr);
  }
}

@media (max-width: 991px) {
  .home-about-quick {
    min-height: auto;
    padding: 56px 0;
  }

  .shell {
    width: calc(100% - 28px);
    padding: 0;
    margin: 0 auto;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .content {
    max-width: 100%;
    padding-top: 0;
  }

  .divider {
    width: 84px;
  }

  h2 {
    font-size: clamp(28px, 6.4vw, 36px);
  }

  .summary p {
    font-size: 15.5px;
    line-height: 1.62;
  }

  .visual {
    width: 100%;
    height: auto;
    margin-top: 0;
    aspect-ratio: 16 / 9;
    justify-self: stretch;
  }

  .stats {
    margin-top: 22px;
    gap: 20px;
  }

  .stat strong {
    font-size: clamp(30px, 8vw, 36px);
  }
}
</style>
