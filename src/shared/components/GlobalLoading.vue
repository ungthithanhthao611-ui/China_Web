<script setup>
import { uiState } from '@/shared/utils/uiState'
</script>

<template>
  <div class="global-loading-system">
    <!-- CHỈ CÒN DUY NHẤT THANH TIẾN TRÌNH MỎNG TRÊN CÙNG -->
    <div 
      class="top-progress-bar" 
      :class="{ 'is-loading': uiState.isLoading }"
      :style="{ width: uiState.isLoading ? '100%' : '0%' }"
    ></div>
    
    <!-- KHÔNG CÒN LỚP MÀN MỜ (OVERLAY) NÀO Ở ĐÂY NỮA -->
  </div>
</template>

<style scoped lang="scss">
.global-loading-system {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 99999;
  pointer-events: none;
}

.top-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px;
  background: linear-gradient(90deg, #df0019, #ffbaba, #df0019);
  background-size: 200% 100%;
  transition: width 0.4s ease, opacity 0.3s ease;
  width: 0;
  opacity: 0;

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
