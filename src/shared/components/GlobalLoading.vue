<script setup>
import { uiState } from '@/shared/utils/uiState'
</script>

<template>
  <div class="global-loading-system">
    <!-- Chỉ giữ lại thanh tiến trình siêu mỏng ở trên cùng, gần như vô hình -->
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
  z-index: 10005;
  pointer-events: none;
}

.top-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px; // Siêu mỏng
  background: #df0019;
  transition: width 0.4s ease, opacity 0.3s ease;
  width: 0;
  opacity: 0;

  &.is-loading {
    opacity: 0.6; // Mờ đi để không gây chú ý
  }
}
</style>
