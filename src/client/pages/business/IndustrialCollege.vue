<script setup>
import { uiState } from '@/utils/uiState'
import AppFooter from '@/client/components/layout/AppFooter.vue'

defineProps({
  active: Boolean
})

const title = "Industrial College"
const description = "Talent cultivation enables scientific and technological innovation and development. In order to further strengthen the reserve of front-line workers in the intelligent industry, China Decoration and Yangzhou Technician College in Jiangsu Province jointly established the 'China Decoration Intelligent Assembly Industry College' to jointly sort out the course content, course system, talent training mode, and jointly train a new generation of applied technical skills talents."
const image = "/images/BUSINESS FIELD/2484a544-4856-4253-9415-04681c12f22b.png"
</script>

<template>
  <div class="last-section-wrapper" :class="{ 'is-active': active }">
    <div class="business-section main-content">
      <div class="header-trigger" @mouseenter="uiState.isHeaderHidden = false"></div>

      <!-- Red Reveal Block (Left) -->
      <div class="red-reveal-block entrance-left"></div>

      <!-- Gray Pattern Block (Right Top) -->
      <div class="gray-pattern-block entrance-right"></div>

      <!-- New Gray Pattern Block (Left Bottom) -->
      <div class="gray-pattern-bottom entrance-left"></div>

      <div class="container content-grid">
        <!-- Cột Ảnh (Bên Trái) -->
        <div class="image-side entrance-up" :style="{ transitionDelay: '0.1s' }">
          <div class="image-box">
             <!-- Khối vàng trang trí sau ảnh như mẫu -->
             <div class="gold-deco-box"></div>
             <img :src="image" :alt="title" class="main-img">
          </div>
        </div>

        <!-- Cột Chữ (Bên Phải) -->
        <div class="text-side">
          <div class="title-group entrance-up" :style="{ transitionDelay: '0.2s' }">
            <h2 class="fnt-serif">
              {{ title }}
              <span class="red-stamp">裝国 <br> 饰国</span>
            </h2>
            <div class="red-horizontal-line entrance-expand"></div>
          </div>

          <div class="desc-wrapper entrance-up" :style="{ transitionDelay: '0.4s' }">
            <p class="desc">{{ description }}</p>
            <div class="gold-vertical-line"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cố định Footer ở cuối trang -->
    <AppFooter id="business-footer" />
  </div>
</template>

<style lang="scss" scoped>
.last-section-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto; // Cho phép cuộn nội bộ để xem Footer
  background: #fff;
  scroll-snap-align: start;
}

.business-section {
  position: relative;
  width: 100%;
  min-height: 100vh; // Đảm bảo chiếm ít nhất 1 màn hình
  display: flex;
  align-items: center;
  overflow: hidden;

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
  justify-content: flex-start;

  .image-box {
    position: relative;
    width: 100%;
    max-width: 850px;
    
    .main-img {
      width: 100%;
      height: 450px;
      object-fit: cover;
      display: block;
      box-shadow: 0 30px 60px rgba(0,0,0,0.12);
      position: relative;
      z-index: 2;
    }

    .gold-deco-box {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 160px;
      height: 160px;
      background: #c5a47e; // Màu vàng đồng mẫu
      opacity: 0.8;
      z-index: 1;
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

// GRAY PATTERN BLOCK (TOP)
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

// NEW GRAY PATTERN BLOCK (BOTTOM)
.gray-pattern-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 150px;
  height: 150px;
  background: #f4f4f4;
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 12px 12px;
  z-index: 1;
  opacity: 0.8;
}

// Entrance Animations (Triggered by .is-active)
.is-active {
  .entrance-left { transform: translateX(0); }
  .entrance-right { transform: translateX(0); }
  .entrance-up {
    transform: translateY(0);
    opacity: 1;
  }
  .entrance-expand {
    width: 180px !important;
  }
}

.entrance-left { transform: translateX(-100%); transition: all 1s ease; }
.entrance-right { transform: translateX(100%); transition: all 1s ease; }
.entrance-up { transform: translateY(50px); opacity: 0; transition: all 1.2s ease; }
.entrance-expand { width: 0 !important; transition: all 1s ease; }

@media (max-width: 1024px) {
  .content-grid { flex-direction: column-reverse; text-align: center; }
  .gray-pattern-block, .gold-deco-box { display: none; }
}
</style>
