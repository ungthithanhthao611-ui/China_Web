<script setup>
import { uiState } from '@/shared/utils/uiState'

defineProps({
  active: Boolean
})

const title = "Ecological Environment"
const description = "In the context of the national strategy of 'carbon peak, carbon neutrality', ecological environment protection and restoration is the trend of The Times, and green, healthy and intelligent have become the key direction leading scientific and technological innovation. China Decoration actively explores the field of ecological technology business, and established China Decoration Ecological (Beijing) Environment Co., Ltd. in September 2022, which is committed to environmental protection."
const image = "/images/BUSINESS FIELD/87007cbc-55bd-48e8-acfd-8b1c32d35745.jpg"
</script>

<template>
  <div class="business-section" :class="{ 'is-active': active }">
    <div class="header-trigger" @mouseenter="uiState.isHeaderHidden = false"></div>

    <!-- Red Reveal Block (Left) -->
    <div class="red-reveal-block entrance-left"></div>

    <!-- Gray Pattern Block (Right) -->
    <div class="gray-pattern-block entrance-right"></div>

    <div class="container content-grid">
      <div class="text-side">
        <div class="title-group entrance-up" :style="{ transitionDelay: '0.2s' }">
          <h2 class="fnt-serif">
            {{ title }}
            <span class="red-stamp">ẤN</span>
          </h2>
          <div class="red-horizontal-line entrance-expand"></div>
        </div>

        <div class="desc-wrapper entrance-up" :style="{ transitionDelay: '0.4s' }">
          <p class="desc">{{ description }}</p>
          <div class="gold-vertical-line"></div>
        </div>
      </div>

      <div class="image-side entrance-up" :style="{ transitionDelay: '0.1s' }">
        <div class="image-box">
             <img :src="image" :alt="title" class="main-img">
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
    top: 0; left: 0;
    width: 100%; height: 60px;
    z-index: 2000;
  }
}

.content-grid {
  display: flex;
  width: 90%;
  margin: 0 auto;
  align-items: center;
  gap: 60px;
  z-index: 5;
}

.text-side {
  flex: 0.7;
  z-index: 2;
  
  .title-group {
    margin-bottom: 30px;
    h2 {
      font-size: clamp(32px, 3.5vw, 44px);
      color: #333;
      font-family: serif;
      line-height: 1.2;
      display: flex;
      align-items: center;
      gap: 15px;

      .red-stamp {
        background: #da1b2b;
        color: #fff;
        font-size: 11px;
        padding: 4px;
        line-height: 1;
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
    padding-right: 30px;
    p {
      color: #666;
      line-height: 2;
      font-size: 15px;
      text-align: justify;
    }
    .gold-vertical-line {
      position: absolute;
      right: 0;
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
  justify-content: flex-end;

  .image-box {
    width: 100%;
    max-width: 850px;
    .main-img {
      width: 100%;
      height: 450px;
      object-fit: cover;
      display: block;
      box-shadow: 0 30px 60px rgba(0,0,0,0.12);
    }
  }
}

// RED BLOCK WITH HOVER REVEAL
.red-reveal-block {
  position: absolute;
  top: 0;
  left: 0;
  width: 120px;
  height: 140px;
  background: #da1b2b;
  z-index: 10;
  cursor: pointer;
  transition: all 0.7s cubic-bezier(0.19, 1, 0.22, 1);
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover {
    width: 250px;
    box-shadow: 0 10px 40px rgba(218, 27, 43, 0.4);
    &::before { transform: translateX(100%); }
  }
}

// GRAY PATTERN BLOCK
.gray-pattern-block {
  position: absolute;
  top: 0;
  right: 0;
  width: 110px;
  height: 220px;
  background: #ececec;
  background-image: radial-gradient(#d1d1d1 1px, transparent 1px);
  background-size: 10px 10px;
  z-index: 1;
}

// Entrance Animations
.entrance-left {
  transform: translateX(-100%);
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
}

.entrance-right {
  transform: translateX(100%);
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
}

.entrance-up {
  transform: translateY(50px);
  opacity: 0;
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
}

.entrance-expand {
  width: 0 !important;
  transition: all 1s ease-out;
}

.is-active {
  .entrance-left, .entrance-right { transform: translateX(0); }
  .entrance-up {
    transform: translateY(0);
    opacity: 1;
  }
  .entrance-expand {
    width: 180px !important;
  }
}

@media (max-width: 1024px) {
  .content-grid { flex-direction: column-reverse; text-align: center; }
  .green-pattern-mobile { display: none; }
  .gray-pattern-block { display: none; }
}
</style>
