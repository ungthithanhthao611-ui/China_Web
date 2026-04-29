<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getProjects } from '@/views/user/services/publicApi'
import { uiState } from '@/shared/utils/uiState'

const projects = ref([])
const loading = ref(true)
const error = ref(null)
const { locale, t } = useI18n({ useScope: 'global' })

const imageUrl = (media) => media?.url || ''

const heroImage = computed(() => {
  const first = projects.value[0]
  return imageUrl(first?.hero_image) || imageUrl(first?.image) || ''
})

async function loadProjects() {
  loading.value = true
  error.value = null
  try {
    const res = await getProjects({ limit: 50 })
    projects.value = res?.items || []
  } catch (err) {
    error.value = err?.message || t('user.home.errorLoading')
    projects.value = []
  } finally {
    loading.value = false
  }
}

watch(locale, loadProjects)

onMounted(() => {
  document.title = t('user.home.projects') + ' | Thiên Đồng Việt Nam'
  uiState.isHeaderHidden = false
  uiState.isFooterHidden = false
  loadProjects()
})
</script>

<template>
  <div class="pj-list">
    <!-- ── Hero Banner ─────────────────────────────────── -->
    <section
      class="pj-hero"
      :style="{ backgroundImage: heroImage ? `url(${heroImage})` : 'none' }"
    >
      <div class="pj-hero__overlay" />
      <div class="pj-hero__content">
        <h1 class="pj-hero__title">{{ t('user.home.projectsTitle') }}</h1>
        <p class="pj-hero__sub">
          {{ t('user.home.projectSubtitle') }}
        </p>
      </div>
    </section>

    <!-- ── Loading / Error ──────────────────────────────── -->
    <section v-if="loading" class="pj-state" aria-live="polite">
      <div class="pj-state__card">
        <div class="pj-state__spinner" />
        <p>{{ t('user.home.loading') || 'Đang tải danh sách dự án…' }}</p>
      </div>
    </section>

    <section v-else-if="error" class="pj-state pj-state--error" aria-live="assertive">
      <div class="pj-state__card">
        <p>{{ error }}</p>
        <router-link to="/" class="pj-state__link">{{ t('user.home.backHome') || 'Quay về trang chủ' }}</router-link>
      </div>
    </section>

    <section v-else-if="!projects.length" class="pj-state">
      <div class="pj-state__card">
        <p>{{ t('user.home.newsEmpty') || 'Hiện chưa có dự án nào. Vui lòng quay lại sau.' }}</p>
        <router-link to="/" class="pj-state__link">{{ t('user.home.backHome') || 'Quay về trang chủ' }}</router-link>
      </div>
    </section>

    <!-- ── Grid ─────────────────────────────────────────── -->
    <section v-else class="pj-grid-section">
      <div class="container">
        <div class="pj-grid">
          <router-link
            v-for="project in projects"
            :key="project.id"
            :to="`/du-an/${project.slug}`"
            class="pj-card"
          >
            <div class="pj-card__media">
              <img
                :src="imageUrl(project.image) || imageUrl(project.hero_image)"
                :alt="project.title"
                loading="lazy"
              />
            </div>
            <div class="pj-card__overlay">
              <span v-if="project.category?.name" class="pj-card__cat">
                {{ project.category.name }}
              </span>
              <h2 class="pj-card__title">{{ project.title }}</h2>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Hero ──────────────────────────────────────────────── */
.pj-hero {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  background-color: #1a1a1a;
}

.pj-hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10, 14, 22, 0.62) 0%,
    rgba(10, 14, 22, 0.48) 40%,
    rgba(10, 14, 22, 0.72) 100%
  );
}

.pj-hero__content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 140px 24px 80px;
  max-width: 780px;
}

.pj-hero__title {
  margin: 0 0 20px;
  font-family: 'Cormorant Garamond', 'Times New Roman', Georgia, serif;
  font-size: clamp(2.6rem, 5vw, 4.5rem);
  font-weight: 600;
  font-style: italic;
  color: #fff;
  letter-spacing: 0.04em;
  line-height: 1.15;
}

.pj-hero__sub {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: clamp(0.95rem, 1.6vw, 1.12rem);
  line-height: 1.85;
}

/* ── State (loading / error / empty) ───────────────────── */
.pj-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.pj-state__card {
  text-align: center;
  padding: 40px 28px;
  max-width: 560px;
}

.pj-state__card p {
  margin: 0;
  color: #475467;
  font-size: 1rem;
  line-height: 1.85;
}

.pj-state--error p {
  color: #b42318;
}

.pj-state__link {
  display: inline-block;
  margin-top: 18px;
  padding: 12px 24px;
  border-radius: 999px;
  background: #1d273a;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.92rem;
  transition: background 0.25s;
}

.pj-state__link:hover {
  background: #2d3a52;
}

.pj-state__spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto 16px;
  border: 3px solid rgba(24, 39, 75, 0.12);
  border-top-color: #1d273a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Grid ──────────────────────────────────────────────── */
.pj-grid-section {
  padding: 56px 0 80px;
  background: #ffffff;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.pj-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* ── Card ──────────────────────────────────────────────── */
.pj-card {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 8px;
  text-decoration: none;
  aspect-ratio: 4 / 3;
  background: #eef2f6;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.pj-card__media {
  position: absolute;
  inset: 0;
}

.pj-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s ease;
}

.pj-card:hover .pj-card__media img {
  transform: scale(1.06);
}

.pj-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 24px;
  background: linear-gradient(
    180deg,
    transparent 40%,
    rgba(0, 0, 0, 0.65) 100%
  );
  color: #fff;
  transition: background 0.35s;
}

.pj-card:hover .pj-card__overlay {
  background: linear-gradient(
    180deg,
    transparent 20%,
    rgba(0, 0, 0, 0.78) 100%
  );
}

.pj-card__cat {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.88);
}

.pj-card__title {
  margin: 0;
  font-size: clamp(1rem, 1.6vw, 1.25rem);
  font-weight: 600;
  line-height: 1.35;
}

/* ── Responsive ────────────────────────────────────────── */
@media (max-width: 1024px) {
  .pj-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 640px) {
  .pj-hero {
    min-height: 420px;
  }

  .pj-hero__content {
    padding: 120px 20px 60px;
  }

  .pj-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .pj-grid-section {
    padding: 36px 0 60px;
  }
}
</style>
