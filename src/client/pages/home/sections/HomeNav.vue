<script setup>
import { computed } from 'vue'
import { uiState } from '@/shared/utils/uiState'

const props = defineProps({
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
  },
  bannerCount: {
    type: Number,
    default: 6
  }
})

const emit = defineEmits(['navigate', 'navigate-banner'])

const bannerItems = computed(() => Array.from({ length: Math.max(0, props.bannerCount || 0) }, (_, index) => index))

const navigate = (index) => {
  emit('navigate', index)
}

const navigateBanner = (index) => {
  if (props.activeSection !== 0) {
    emit('navigate', 0)
  }

  emit('navigate-banner', index)
}
</script>

<template>
  <div class="home-nav" v-if="!uiState.isNavHidden">
    <div class="nav-cluster">
      <div
        class="banner-nav"
        :class="{ 'is-hidden': activeSection !== 0 }"
        aria-label="Banner navigation"
      >
        <button
          v-for="bannerIndex in bannerItems"
          :id="`home-banner-nav-${bannerIndex + 1}`"
          :key="`banner-${bannerIndex}`"
          type="button"
          class="banner-nav__item"
          :class="{ 'is-active': activeSection === 0 && activeBanner === bannerIndex }"
          @click="navigateBanner(bannerIndex)"
        >
          {{ String(bannerIndex + 1).padStart(2, '0') }}
        </button>
      </div>

      <div class="section-nav" aria-label="Section navigation">
        <div class="section-nav__line"></div>

        <button
          v-for="(section, index) in sections"
          :id="`home-section-nav-${section.id}`"
          :key="section.id"
          type="button"
          class="section-nav__item"
          :class="{ 'is-active': activeSection === index }"
          :aria-label="section.label"
          @click="navigate(index)"
        >
          <span class="section-nav__dot"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-nav {
  position: fixed;
  top: 50%;
  right: 34px;
  z-index: 1005;
  transform: translateY(-50%);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.nav-cluster {
  display: flex;
  align-items: flex-start;
  gap: 18px;
}

.banner-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 18px;
  padding-top: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.banner-nav.is-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateX(8px);
}

.banner-nav__item {
  border: 0;
  background: transparent;
  padding: 0;
  min-width: 30px;
  text-align: right;
  cursor: pointer;
  color: rgba(207, 170, 120, 0.8);
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.02em;
  transition: color 0.25s ease, transform 0.25s ease, opacity 0.25s ease;
}

.banner-nav__item:hover {
  color: rgba(255, 220, 170, 0.96);
}

.banner-nav__item.is-active {
  color: #ff1020;
  font-size: 28px;
  font-weight: 500;
  transform: translateX(-2px);
}

.banner-nav__item.is-dimmed {
  opacity: 0.7;
}

.section-nav {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 11px;
  padding: 9px 0 8px;
  min-height: 252px;
}

.section-nav__line {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-50%);
}

.section-nav__item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.section-nav__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(198, 198, 198, 0.86);
  transition: transform 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease;
}

.section-nav__item:hover .section-nav__dot {
  transform: scale(1.18);
  background: rgba(255, 255, 255, 0.95);
}

.section-nav__item.is-active .section-nav__dot {
  width: 10px;
  height: 10px;
  background: #ff1020;
  box-shadow: 0 0 0 4px rgba(255, 16, 32, 0.18);
}

@media (max-width: 1200px) {
  .home-nav {
    right: 20px;
  }

  .nav-cluster {
    gap: 14px;
  }

  .banner-nav {
    gap: 16px;
  }

  .banner-nav__item {
    font-size: 15px;
  }

  .banner-nav__item.is-active {
    font-size: 24px;
  }
}

@media (max-width: 992px) {
  .home-nav {
    display: none;
  }
}
</style>
