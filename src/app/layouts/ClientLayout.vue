<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from '@/views/user/layout/AppFooter.vue'
import AppHeader from '@/views/user/layout/AppHeader.vue'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import { NAVIGATION_MENUS_SYNC_KEY } from '@/shared/utils/navigationSync'
import { uiState } from '@/shared/utils/uiState'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n({ useScope: 'global' })
const route = useRoute()
const bootstrapStore = useBootstrapStore()

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

function logBootstrapError(error) {
  if (import.meta.env.DEV) {
    console.error('[bootstrap] Failed to initialize FE bootstrap payload', error)
  }
}

function handleNavigationMenusUpdated(event) {
  if (event.key !== NAVIGATION_MENUS_SYNC_KEY || !event.newValue || event.newValue === event.oldValue) {
    return
  }

  bootstrapStore.initialize(true).catch(logBootstrapError)
}

onMounted(() => {
  bootstrapStore.initialize().catch(logBootstrapError)
  window.addEventListener('storage', handleNavigationMenusUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleNavigationMenusUpdated)
})
</script>

<template>
  <div class="app-wrapper" :class="{ 'app-wrapper--admin-preview': isAdminPreviewMode }">
    <AppHeader v-if="!uiState.isNavHidden && !isAdminPreviewMode" />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
