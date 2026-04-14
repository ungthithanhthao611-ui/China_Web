<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

import AppFooter from '@/client/components/layout/AppFooter.vue'
import AppHeader from '@/client/components/layout/AppHeader.vue'
import { useBootstrapStore } from '@/client/stores/bootstrap'
import { NAVIGATION_MENUS_SYNC_KEY } from '@/utils/navigationSync'
import { uiState } from '@/utils/uiState'

const bootstrapStore = useBootstrapStore()

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
  <div class="app-wrapper">
    <AppHeader v-if="!uiState.isNavHidden" />

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <AppFooter v-if="!uiState.isFooterHidden" />
  </div>
</template>

<style scoped lang="scss">
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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
