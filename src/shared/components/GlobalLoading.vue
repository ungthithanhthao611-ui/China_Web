<script setup>
import { uiState } from '@/shared/utils/uiState'
</script>

<template>
  <div class="global-loading-system">
    <!-- Top Progress Bar (YouTube style but more vibrant) -->
    <div 
      class="top-progress-bar" 
      :class="{ 'is-loading': uiState.isLoading }"
      :style="{ width: uiState.isLoading ? '100%' : '0%' }"
    ></div>

    <!-- Minimal Floating Indicator (Bottom Right) -->
    <transition name="slide-fade">
      <div v-if="uiState.isLoading" class="floating-loading">
        <div class="spinner-dot"></div>
        <span class="loading-label">Đang tải dữ liệu...</span>
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
  z-index: 10001;
  pointer-events: none;
}

.top-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 4px; // Thicker for visibility
  background: linear-gradient(90deg, #df0019, #ffbaba, #df0019);
  background-size: 200% 100%;
  transition: width 0.6s cubic-bezier(0.1, 0.7, 1.0, 0.1), opacity 0.4s ease;
  width: 0;
  opacity: 0;
  box-shadow: 0 0 15px rgba(223, 0, 25, 0.6);

  &.is-loading {
    opacity: 1;
    animation: loading-bar-flow 1.5s linear infinite;
  }
}

.floating-loading {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 10px 18px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(223, 0, 25, 0.1);
  pointer-events: auto;
  z-index: 10002;
}

.spinner-dot {
  width: 12px;
  height: 12px;
  background: #df0019;
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 2px solid #df0019;
    border-radius: 50%;
    animation: pulse-ring 1.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
}

.loading-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.5px;
}

@keyframes loading-bar-flow {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

@keyframes pulse-ring {
  0% { transform: scale(0.33); opacity: 0.8; }
  80%, 100% { transform: scale(1.2); opacity: 0; }
}

// Animations
.slide-fade-enter-active {
  transition: all 0.4s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
