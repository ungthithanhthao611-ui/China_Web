<script setup>
import { uiState } from '@/utils/uiState'

defineProps({
  sections: {
    type: Array,
    required: true
  },
  activeSection: {
    type: Number,
    required: true
  },
  activeBanner: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['navigate', 'navigate-banner'])

const navigate = (index) => {
  emit('navigate', index)
}

const navigateBanner = (index) => {
  emit('navigate-banner', index)
}
</script>

<template>
  <div class="home-nav" v-if="!uiState.isNavHidden">
    <div class="nav-container">
      <!-- Unified List -->
      <div class="nav-list">
        <!-- Banner Items (representing Section 0) -->
        <div 
          v-for="i in 6" 
          :key="`banner-${i}`"
          class="nav-item banner-type"
          :class="{ 'active': activeSection === 0 && activeBanner === i - 1 }"
          @click="navigateBanner(i - 1)"
        >
          <span class="number">{{ String(i).padStart(2, '0') }}</span>
          <span class="dot-wrapper">
            <span class="dot"></span>
          </span>
        </div>

        <!-- Section Items (representing Sections 1-6) -->
        <div 
          v-for="(section, index) in sections" 
          :key="`section-${index}`"
          v-show="index > 0" 
          class="nav-item section-type"
          :class="{ 'active': activeSection === index }"
          @click="navigate(index)"
        >
          <span class="label">{{ section.label }}</span>
          <span class="dot-wrapper">
             <span class="dot"></span>
          </span>
        </div>
      </div>

      <!-- Connector Line -->
      <div class="connector-line"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-nav {
  position: fixed;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1005;
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);

  &.is-hidden {
    transform: translateY(-50%) translateX(100px);
    opacity: 0;
    pointer-events: none;
  }
}

.nav-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.connector-line {
  position: absolute;
  right: 4px;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
  z-index: 1;
}

.nav-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 15px; /* Consistent gap throughout */
  z-index: 2;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  position: relative;
  min-height: 20px;
  
  .dot-wrapper {
    width: 9px;
    height: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .number {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.35);
    transition: all 0.3s ease;
    font-family: 'Outfit', sans-serif;
    transform: translateY(1px);
  }

  .label {
    position: absolute;
    right: 40px;
    font-size: 12px;
    color: #fff;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.3s ease;
    background: rgba(0, 0, 0, 0.7);
    padding: 3px 10px;
    border-radius: 4px;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  &:hover {
    .dot {
      background: rgba(255, 255, 255, 0.9);
      transform: scale(1.4);
    }
    .number {
      color: rgba(255, 255, 255, 0.9);
    }
    .label {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Banner-specific spacing */
  &.banner-type {
    margin-bottom: 4px;
    .number { width: 24px; text-align: right; }
  }

  /* Section-specific spacing */
  &.section-type {
    margin: 2px 0;
  }

  &.active {
    .dot {
      background: #e10012;
      transform: scale(1.6);
      box-shadow: 0 0 12px rgba(225, 0, 18, 0.6);
    }
    
    &.section-type .dot {
      width: 14px;
      height: 6px;
      border-radius: 3px; /* Capsule shape */
    }

    .number {
      font-size: 20px;
      font-weight: 700;
      color: #e10012;
      transform: translateX(-4px);
    }
    
    .dot {
       opacity: 1;
    }
  }
}

@media (max-width: 992px) {
  .home-nav {
    display: none;
  }
}
</style>
