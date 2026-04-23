<script setup>
import { uiState } from '@/shared/utils/uiState'

defineProps({
  active: Boolean
})

const title = "Urban Renewal"
const description = "China Decoration actively participates in the construction activities of urban infrastructure and smart cities. It has established the 'Urban Renewal Research Institute' in collaboration with Shanghai Linli Company to assist in the rectification, optimization and improvement of urban spatial form and function, and to achieve the improvement of housing use, municipal facilities and public construction supporting, as well as the enhancement of industrial structure."
const image = "/images/BUSINESS FIELD/f8a3b381-108e-4d95-9212-c158344b05ed.png"
</script>

<template>
  <div class="business-section" :class="{ 'is-active': active }">
    <!-- Header trigger -->
    <div class="header-trigger" @mouseenter="uiState.isHeaderHidden = false"></div>

    <!-- Top Right Red Banner (Slide from right) -->
    <div class="red-deco-top entrance-right"></div>

    <!-- Bottom Right Large Red Banner (Slide from right) -->
    <div class="red-deco-bottom-right entrance-right"></div>

    <div class="container content-grid">
      <div class="image-side entrance-up">
        <div class="image-box">
             <img :src="image" :alt="title" class="main-img">
        </div>
      </div>

      <div class="text-side">
        <div class="title-group entrance-up" :style="{ transitionDelay: '0.2s' }">
          <h2 class="fnt-serif">
            {{ title }}
            <span class="red-stamp">ẤN</span>
          </h2>
          <div class="red-horizontal-line entrance-expand"></div>
        </div>

        <div class="desc-wrapper entrance-up" :style="{ transitionDelay: '0.4s' }">
          <div class="gold-vertical-line"></div>
          <p class="desc">{{ description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.business-section {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #fff;
  overflow: hidden;
  display: flex;
  align-items: center;

  .header-trigger {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60px;
    z-index: 2000;
  }
}

.content-grid {
  display: flex;
  width: 90%;
  margin: 0 auto;
  align-items: center;
  gap: 60px;
}

.text-side {
  flex: 0.7;
  z-index: 2;
  
  .title-group {
    margin-bottom: 30px;
    h2 {
      font-size: clamp(32px, 3.5vw, 42px);
      color: #333;
      font-family: serif;
      display: flex;
      align-items: center;
      gap: 15px;

      .red-stamp {
        background: #da1b2b;
        color: #fff;
        font-size: 12px;
        padding: 4px;
        line-height: 1.1;
      }
    }
    .red-horizontal-line {
      width: 180px;
      height: 2px;
      background: #da1b2b;
      margin-top: 15px;
    }
  }

  .desc-wrapper {
    position: relative;
    padding-left: 20px;
    p {
      color: #666;
      line-height: 1.8;
      font-size: 15px;
      text-align: justify;
    }
    .gold-vertical-line {
      position: absolute;
      left: 0;
      top: 0;
      width: 3px;
      height: 100%;
      background: #c5a47e;
    }
  }
}

.image-side {
  flex: 1.5;
  display: flex;
  justify-content: flex-start;

  .image-box {
    width: 100%;
    max-width: 850px;
    .main-img {
      width: 100%;
      height: 450px;
      object-fit: cover;
      display: block;
      box-shadow: 0 30px 60px rgba(0,0,0,0.15);
    }
  }
}

// Red Decorations
.red-deco-top {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 350px;
  background: #da1b2b;
  z-index: 1;
}

.red-deco-bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40%;
  height: 120px;
  background: #da1b2b;
  z-index: 1;
}

// PowerPoint-style Animations
.entrance-right {
  transform: translateX(100%);
  opacity: 0;
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
}

.entrance-up {
  transform: translateY(40px);
  opacity: 0;
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
}

.entrance-expand {
  width: 0 !important;
  transition: all 1s ease-out;
}

.is-active {
  .entrance-right {
    transform: translateX(0);
    opacity: 1;
  }
  .entrance-up {
    transform: translateY(0);
    opacity: 1;
  }
  .entrance-expand {
    width: 180px !important;
  }
}

// HOVER REVEAL EFFECT
.red-deco-top, .red-deco-bottom-right {
  cursor: pointer;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  &:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 35px rgba(218, 27, 43, 0.4);
    &::after { transform: translateX(100%); }
  }
}
.red-deco-top:hover { width: 32px; }
.red-deco-bottom-right:hover { height: 145px; width: 42%; }

@media (max-width: 1024px) {
  .content-grid { flex-direction: column-reverse; text-align: center; }
  .text-side .desc-wrapper { padding-left: 0; padding-top: 20px; .gold-vertical-line { width: 100%; height: 3px; left: 0; top: 0; } }
  .red-deco-top, .red-deco-bottom-right { display: none; }
}
</style>
