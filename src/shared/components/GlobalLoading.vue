<script setup>
import { uiState } from '@/shared/utils/uiState'
</script>

<template>
  <div class="global-loading-system">
    <!-- Thanh tiến trình trên cùng (YouTube Style) - Chỉ cái này là đủ -->
    <div 
      class="top-progress-bar" 
      :class="{ 'is-loading': uiState.isLoading }"
      :style="{ width: uiState.isLoading ? '100%' : '0%' }"
    ></div>
    
    <!-- Một Spinner cực nhỏ ở góc để báo hiệu ngầm, không chặn tầm nhìn -->
    <transition name="fade">
      <div v-if="uiState.isLoading" class="mini-status-indicator">
        <div class="pulse-dot"></div>
        <span>Đang đồng bộ DB...</span>
      </div>
    </transition>
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
  height: 3px;
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

.mini-status-indicator {
  position: fixed;
  top: 80px; // Dưới header một chút
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid rgba(223, 0, 25, 0.1);

  span {
    font-size: 11px;
    font-weight: 600;
    color: #df0019;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #df0019;
  border-radius: 50%;
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.5; }
}

@keyframes loading-bar-flow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
