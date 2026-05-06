<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from '@/views/user/layout/AppFooter.vue'
import AppHeader from '@/views/user/layout/AppHeader.vue'
import logoImage from '@/assets/logo-cty.png'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import { NAVIGATION_MENUS_SYNC_KEY } from '@/shared/utils/navigationSync'
import { uiState } from '@/shared/utils/uiState'
import { useI18n } from 'vue-i18n'

const MIN_SPLASH_MS = 450
const MAX_SPLASH_MS = 2500

const { locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const bootstrapStore = useBootstrapStore()
const isSplashVisible = ref(true)
const splashStartedAt = Date.now()
let splashTimerId = null
let splashFallbackTimerId = null

watch(locale, () => {
  bootstrapStore.initialize(true).catch(logBootstrapError)
})

const readAdminPreviewMode = () => {
  if (typeof window === 'undefined') {
    return String(route.query.adminPreview || '').trim() === '1'
  }

  return new URL(window.location.href).searchParams.get('adminPreview') === '1'
}

const isAdminPreviewMode = computed(() => readAdminPreviewMode())
const shouldShowSplash = computed(() => isSplashVisible.value && !isAdminPreviewMode.value)
const hasRenderableShell = computed(() => bootstrapStore.hasRenderableBootstrapShell || (bootstrapStore.initialized && !bootstrapStore.loading))

function logBootstrapError(error) {
  if (import.meta.env.DEV) {
    console.error('[bootstrap] Failed to initialize FE bootstrap payload', error)
  }
}

bootstrapStore.initialize().catch(logBootstrapError)

function hideSplashWhenReady() {
  if (!isSplashVisible.value) return

  const elapsed = Date.now() - splashStartedAt
  const delay = Math.max(0, MIN_SPLASH_MS - elapsed)

  if (splashTimerId) window.clearTimeout(splashTimerId)
  splashTimerId = window.setTimeout(() => {
    isSplashVisible.value = false
  }, delay)
}

function handleNavigationMenusUpdated(event) {
  if (event.key !== NAVIGATION_MENUS_SYNC_KEY || !event.newValue || event.newValue === event.oldValue) {
    return
  }

  bootstrapStore.initialize(true).catch(logBootstrapError)
}

onMounted(() => {
  window.addEventListener('storage', handleNavigationMenusUpdated)
  splashFallbackTimerId = window.setTimeout(hideSplashWhenReady, MAX_SPLASH_MS)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleNavigationMenusUpdated)
  if (splashTimerId) window.clearTimeout(splashTimerId)
  if (splashFallbackTimerId) window.clearTimeout(splashFallbackTimerId)
})

watch(
  hasRenderableShell,
  (ready) => {
    if (ready) hideSplashWhenReady()
  },
  { immediate: true }
)
</script>

<template>
  <div class="app-wrapper" :class="{ 'app-wrapper--admin-preview': isAdminPreviewMode }">
    <transition name="app-splash">
      <div v-if="shouldShowSplash" class="app-splash" role="status" aria-live="polite">
        <div class="app-splash__content">
          <img class="app-splash__logo" :src="logoImage" alt="Thiên Đồng Việt Nam" />
          <div class="app-splash__bar">
            <span></span>
          </div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    </transition>

    <AppHeader v-if="!uiState.isNavHidden && !isAdminPreviewMode" />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>

    <AppFooter v-if="!uiState.isFooterHidden && !isAdminPreviewMode" />
  </div>
</template>

<style scoped lang="scss">
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-wrapper--admin-preview {
  min-height: auto;
}

.main-content {
  flex: 1;
}

.app-splash {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: grid;
  place-items: center;
  background: #ffffff;
}

.app-splash__content {
  display: grid;
  justify-items: center;
  gap: 18px;
  transform: translateY(-4vh);
}

.app-splash__logo {
  width: min(168px, 42vw);
  height: auto;
  background: none;
  animation: none;
}

.app-splash__bar {
  position: relative;
  width: min(220px, 54vw);
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef0f4;
}

.app-splash__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 46%;
  border-radius: inherit;
  background: #d7a64b;
  animation: app-splash-progress 1.05s ease-in-out infinite;
}

.app-splash p {
  margin: 0;
  color: #8d94a3;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-splash-enter-active,
.app-splash-leave-active {
  transition: opacity 0.35s ease;
}

.app-splash-enter-from,
.app-splash-leave-to {
  opacity: 0;
}

@keyframes app-splash-progress {
  0% {
    transform: translateX(-110%);
  }

  50% {
    transform: translateX(70%);
  }

  100% {
    transform: translateX(250%);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
