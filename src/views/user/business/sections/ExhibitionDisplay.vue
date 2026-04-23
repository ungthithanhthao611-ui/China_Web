<script setup>
import { uiState } from '@/shared/utils/uiState'

defineProps({
  active: Boolean
})

const title = "Exhibition Display"
const description = "Through years of industry precipitation and experience accumulation, China Decoration can accurately grasp the concept of Chen exhibition, and use digital technology to integrate traditional Chinese culture, modern consciousness and space art in practice, and constantly create a unique and distinctive exhibition project, to provide high-quality Chen exhibition services for customers of the national cultural and exhibition system."
const image = "/images/BUSINESS FIELD/8ca87fd0-cd7e-4487-a834-d03293f1539c.jpg"
</script>

<template>
  <div class="business-section" :class="{ 'is-active': active }">
    <div class="header-trigger" @mouseenter="uiState.isHeaderHidden = false"></div>

    <!-- Red Panel sliding from left -->
    <div class="red-deco-left entrance-left"></div>

    <div class="container content-grid">
      <div class="image-side entrance-up">
        <div class="image-box">
          <div class="dark-deco-box"></div>
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
          <p class="desc">{{ description }}</p>
          <div class="gold-vertical-line"></div>
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
  width: 90%; // Mở rộng container
  margin: 0 auto;
  align-items: center;
  gap: 60px;
  z-index: 5;
}

.text-side {
  flex: 0.7; // Thu nhỏ cột chữ
  z-index: 2;
  
  .title-group {
    margin-bottom: 30px;
    h2 {
      font-size: clamp(32px, 3.5vw, 44px);
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
    padding-right: 25px;
    p {
      color: #666;
      line-height: 1.9;
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
  flex: 1.5; // Mở rộng cột ảnh
  display: flex;
  justify-content: flex-start;

  .image-box {
    position: relative;
    width: 100%;
    max-width: 850px; // Tăng chiều rộng tối đa

    .main-img {
      width: 100%;
      height: 450px; // Ép dáng ngang dài
      object-fit: cover; // Giữ tỉ lệ chuẩn
      box-shadow: 0 30px 60px rgba(0,0,0,0.15);
      position: relative;
      z-index: 2;
    }

    .dark-deco-box {
      position: absolute;
      top: -30px;
      right: -30px;
      width: 140px;
      height: 140px;
      background: #12213a; // Xanh đen mẫu
      z-index: 1;
    }
  }
}

// Animations
.entrance-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 16%;
  height: 100%;
  background: #da1b2b;
  z-index: 1;
  transform: translateX(-100%);
  opacity: 0;
  transition: all 1.2s cubic-bezier(0.19, 1, 0.22, 1);
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
  .entrance-left {
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
.entrance-left {
  cursor: pointer;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    z-index: 2;
  }
  &:hover {
    width: 20%;
    filter: brightness(1.1);
    box-shadow: 10px 0 40px rgba(218, 27, 43, 0.4);
    &::before { transform: translateX(100%); }
  }
}

@media (max-width: 1024px) {
  .content-grid { flex-direction: column-reverse; text-align: center; gap: 40px; }
  .text-side .desc-wrapper { padding-right: 0; padding-top: 20px; .gold-vertical-line { width: 100%; height: 3px; left: 0; top: 0; } }
  .entrance-left { width: 25%; }
  .dark-deco-box { display: none; }
}
</style>
