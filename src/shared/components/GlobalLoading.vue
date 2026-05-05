<script setup>
import { uiState } from '@/shared/utils/uiState'
</script>

<template>
  <div class="global-loading-system">
    <!-- Top Progress Bar - Minimal and Modern (YouTube style) -->
    <div 
      class="top-progress-bar" 
      :class="{ 'is-loading': uiState.isLoading }"
      :style="{ width: uiState.isLoading ? '100%' : '0%' }"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.global-loading-system {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10001;
  pointer-events: none;
}

.top-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #df0019, #ff4d4d, #df0019);
  background-size: 200% 100%;
  transition: width 0.4s cubic-bezier(0.1, 0.7, 1.0, 0.1), opacity 0.3s ease;
  width: 0;
  opacity: 0;
  box-shadow: 0 0 10px rgba(223, 0, 25, 0.5);

  &.is-loading {
    opacity: 1;
    animation: loading-bar-flow 2s linear infinite;
  }
}

@keyframes loading-bar-flow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
