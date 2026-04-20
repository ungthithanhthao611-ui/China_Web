<script setup>
import { uiState } from '@/shared/utils/uiState'

defineProps({
  active: Boolean
})

const title = "Design and Research"
const description = "China General Institute of Decoration Design Research is one of the largest interior design institutes of decoration enterprises in China, and has strategic cooperation with many design agencies at home and abroad, including: CCD (Zheng Zhong) design Office, British Fox Linton Design Office and Shanghai Linli Urban Planning and Architectural Design Co., LTD., to provide accurate navigation of the whole case design, has completed hundreds of large-scale high-end decoration design projects at home and abroad."
const image = "https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/2c6d2bf1-a049-4dc6-8b77-ef02b325b932.png"
const reversed = false
</script>

<template>
  <div class="business-section" :class="{ 'is-active': active }">
    <!-- Header trigger -->
    <div class="header-trigger" @mouseenter="uiState.isHeaderHidden = false"></div>

    <!-- Top Right Red Banner -->
    <div class="red-deco-top"></div>

    <!-- Bottom Left Red Banner -->
    <div class="red-deco-bottom-left"></div>

    <div class="container content-grid">
      <div class="text-side">
        <div class="title-group">
          <h2 class="fnt-serif">{{ title }} <span class="red-stamp">è£åœ‹ <br> é¥°å›½</span></h2>
          <div class="red-horizontal-line"></div>
        </div>

        <div class="desc-wrapper">
          <div class="gold-vertical-line"></div>
          <p class="desc">{{ description }}</p>
        </div>
      </div>

      <div class="image-side">
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
  justify-content: flex-end;

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
  /* Tráº¡ng thÃ¡i ban Ä‘áº§u Ä‘á»ƒ trÆ°á»£t tá»« pháº£i vÃ o */
  transform: translateX(100%);
  opacity: 0;
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
}

.red-deco-bottom-left {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 350px;
  height: 120px;
  background: #da1b2b;
  z-index: 1;
  /* Tráº¡ng thÃ¡i ban Ä‘áº§u Ä‘á»ƒ trÆ°á»£t tá»« trÃ¡i vÃ o */
  transform: translateX(-100%);
  opacity: 0;
  transition: all 1s cubic-bezier(0.19, 1, 0.22, 1);
}

// KÃ­ch hoáº¡t animation khi trang Active
.is-active {
  .red-deco-top {
    transform: translateX(0);
    opacity: 1;
  }
  .red-deco-bottom-left {
    transform: translateX(0);
    opacity: 1;
  }
}

// HIá»†U á»¨NG HOVER REVEAL
.red-deco-top, .red-deco-bottom-left {
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
    filter: brightness(1.1);
    box-shadow: 0 0 30px rgba(218, 27, 43, 0.4);
    &::after { transform: translateX(100%); }
  }
}

.red-deco-top:hover { width: 30px; }
.red-deco-bottom-left:hover { height: 140px; }

@media (max-width: 1024px) {
  .content-grid { flex-direction: column; text-align: center; }
  .text-side .desc-wrapper { padding-left: 0; padding-top: 20px; .gold-vertical-line { width: 100%; height: 3px; left: 0; top: 0; } }
  .red-deco-top, .red-deco-bottom-left { display: none; }
}
</style>
