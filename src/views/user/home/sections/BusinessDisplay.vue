<script setup>
import { ArrowRight } from 'lucide-vue-next'

defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const businessItems = [
  {
    title: 'Trang Trí Kiến Trúc',
    image:
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/164a0d3e-43ce-4b18-b3fb-833322a8df9d.jpg',
    desc: `China Decor đã gắn bó sâu sắc trong lĩnh vực trang trí tòa nhà gần 40 năm, liên tục nằm trong Top 100 doanh nghiệp hàng đầu ngành trang trí Trung Quốc. Chúng tôi đã thực hiện nhiều dự án trọng điểm, sở hữu năng lực thiết kế và thi công toàn diện từ nội thất, vách kính, trang trí nghệ thuật đến lắp ghép thông minh.`,
    link: '/BusinessAreas.html#ctn2'
  },
  {
    title: 'Chỉnh Trang Đô Thị',
    image:
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/a7cfaf80-ec43-4d6f-9ff1-b49687cfd094.jpg',
    link: '/BusinessAreas.html#ctn4'
  },
  {
    title: 'Môi Trường Sinh Thái',
    image:
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/87007cbc-55bd-48e8-acfd-8b1c32d35745.jpg',
    link: '/BusinessAreas.html#ctn5'
  },
  {
    title: 'Thiết Kế & Nghiên Cứu',
    image:
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/02d89cee-b4d8-42a8-9abe-a4b285d9f863.jpg',
    desc: `Viện Nghiên cứu Thiết kế Trang trí Tổng hợp là một trong những viện thiết kế nội thất lớn nhất của các doanh nghiệp trang trí tại Trung Quốc, hợp tác chiến lược với nhiều đơn vị quốc tế. Chúng tôi cung cấp giải pháp thiết kế toàn diện cho hàng trăm dự án cao cấp quy mô lớn.`,
    link: '/BusinessAreas.html#ctn3'
  },
  {
    title: 'Trưng Bày Triển Lãm',
    image:
      'https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/c8f38a36-ce9e-4a2f-9b6e-0bfaadab066c.jpg',
    link: '/BusinessAreas.html#ctn6'
  }
]

const goTo = (url) => {
  window.location.href = url
}
</script>

<template>
  <section class="business-display-section" :class="{ 'is-active': active }">
    <!-- nền tổng -->
    <div class="bg-light"></div>

    <!-- mảng đỏ lớn bên trái -->
    <div class="left-red-bg">
      <div class="left-red-overlay"></div>
      <div class="left-red-lines"></div>
      <div class="left-red-block red-block-1"></div>
      <div class="left-red-block red-block-2"></div>
      <div class="left-red-block red-block-3"></div>
    </div>

    <!-- các hình mờ nền trắng bên phải -->
    <div class="right-shape"></div>

    <div class="content-wrap">
      <div class="business-grid">
        <!-- Header -->
        <div class="grid-item header-card">
          <div class="header-pattern"></div>
          <div class="header-content">
            <h2>LĨNH VỰC</h2>
            <h2>HOẠT ĐỘNG</h2>

            <div class="header-line-wrap">
              <span class="line-dot"></span>
              <span class="line"></span>
              <span class="stamp-box">TRANG<br />TRÍ</span>
            </div>
          </div>
        </div>

        <!-- Urban -->
        <div class="grid-item image-card item-urban" @click="goTo(businessItems[1].link)">
          <div
            class="image-bg"
            :style="{ backgroundImage: `url(${businessItems[1].image})` }"
          ></div>
          <div class="overlay light"></div>
          <div class="card-content small-card">
            <h3>{{ businessItems[1].title }}</h3>
          </div>
        </div>

        <!-- Eco -->
        <div class="grid-item image-card item-eco" @click="goTo(businessItems[2].link)">
          <div
            class="image-bg"
            :style="{ backgroundImage: `url(${businessItems[2].image})` }"
          ></div>
          <div class="overlay light"></div>
          <div class="card-content small-card">
            <h3>{{ businessItems[2].title }}</h3>
          </div>
        </div>

        <!-- Architectural -->
        <div class="grid-item image-card item-arch" @click="goTo(businessItems[0].link)">
          <div
            class="image-bg"
            :style="{ backgroundImage: `url(${businessItems[0].image})` }"
          ></div>
          <div class="overlay dark"></div>
          <div class="card-content arch-card">
            <h3>{{ businessItems[0].title }}</h3>
            <div class="desc-wrapper" v-if="businessItems[0].desc">
              <div class="desc-inner">
                <div class="desc-line"></div>
                <p>{{ businessItems[0].desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Design -->
        <div class="grid-item image-card item-design" @click="goTo(businessItems[3].link)">
          <div
            class="image-bg"
            :style="{ backgroundImage: `url(${businessItems[3].image})` }"
          ></div>
          <div class="overlay design"></div>
          <div class="card-content design-card">
            <h3>{{ businessItems[3].title }}</h3>
            <div class="desc-wrapper" v-if="businessItems[3].desc">
              <div class="desc-inner">
                <div class="desc-line"></div>
                <p>{{ businessItems[3].desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Digital Technology: panel xám chứ không phải ảnh -->
        <div class="grid-item digital-panel" @click="goTo('/BusinessAreas.html#ctn7')">
          <div class="digital-art"></div>
          <div class="digital-text">Công Nghệ Số</div>
        </div>

        <!-- Exhibition -->
        <div class="grid-item image-card item-exhibit" @click="goTo(businessItems[4].link)">
          <div
            class="image-bg"
            :style="{ backgroundImage: `url(${businessItems[4].image})` }"
          ></div>
          <div class="overlay light"></div>
          <div class="card-content exhibit-card">
            <h3>{{ businessItems[4].title }}</h3>
          </div>
        </div>

        <!-- More -->
        <div class="grid-item more-card" @click="goTo('/BusinessAreas.html')">
          <div class="more-shape"></div>

          <div class="more-inner">
            <div class="more-btn">
              <ArrowRight :size="18" />
            </div>
            <span>XEM THÊM +</span>
          </div>

          <div class="bottom-red-strip"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.business-display-section {
  position: relative;
  height: 100%;
  width: 100%;
  background: #f5f5f5;
  overflow: hidden;
}

/* nền sáng chung */
.bg-light {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,244,244,0.96)),
    #f5f5f5;
}

/* ===== ANIMATIONS ===== */
.left-red-bg {
  position: absolute;
  left: 0;
  top: 0;
  width: 37%;
  height: 100%;
  background: linear-gradient(180deg, #c40014 0%, #ab0010 45%, #98000e 100%);
  overflow: hidden;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1);
}

.is-active .left-red-bg {
  transform: scaleX(1);
}

.header-card {
  grid-column: 2 / 4;
  grid-row: 1;
  background: linear-gradient(90deg, #a80010 0%, #98000e 100%);
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.8s cubic-bezier(0.25, 1, 0.5, 1) 0.2s; /* delay after left-red-bg starts */
}

.is-active .header-card {
  opacity: 1;
  transform: translateX(0);
}

/* Card Initial State for Slide-in */
.image-card, .digital-panel, .more-card {
  opacity: 0;
  transform: translateX(80px);
  will-change: opacity, transform;
  transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1);
}

/* Staggered Delays for elements */
.reveal-anim {
  opacity: 0;
  transform: translateY(40px);
  will-change: transform, opacity;
  transition: opacity 1s cubic-bezier(0.25, 1, 0.5, 1), transform 1s cubic-bezier(0.25, 1, 0.5, 1);
}

.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }
.reveal-delay-5 { transition-delay: 0.5s; }

.is-active .reveal-anim {
  opacity: 1;
  transform: translateY(0);
}

.is-active .image-card,
.is-active .digital-panel,
.is-active .more-card {
  opacity: 1;
  transform: translateX(0);
}

.is-active .item-urban { transition-delay: 0.4s; }
.is-active .item-eco { transition-delay: 0.5s; }
.is-active .item-arch { transition-delay: 0.6s; }
.is-active .item-design { transition-delay: 0.7s; }
.is-active .digital-panel { transition-delay: 0.8s; }
.is-active .item-exhibit { transition-delay: 0.9s; }
.is-active .more-card { transition-delay: 1.0s; }
/* ====================== */

.left-red-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.06), transparent 45%),
    linear-gradient(180deg, transparent, rgba(0,0,0,0.12));
}

.left-red-lines {
  position: absolute;
  left: 0;
  top: 0;
  width: 180px;
  height: 100%;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.08) 0 2px,
      transparent 2px 8px
    );
  opacity: 0.95;
}

.left-red-block {
  position: absolute;
  background: rgba(120, 0, 10, 0.16);
}

.red-block-1 {
  left: 48px;
  top: 58px;
  width: 220px;
  height: 210px;
}

.red-block-2 {
  left: 90px;
  top: 255px;
  width: 230px;
  height: 110px;
}

.red-block-3 {
  left: 36px;
  top: 360px;
  width: 270px;
  height: 150px;
}

/* nền xám trắng bên phải */
.right-shape {
  position: absolute;
  right: 0;
  top: 0;
  width: 34%;
  height: 100%;
  background:
    linear-gradient(145deg, transparent 0 25%, rgba(0,0,0,0.018) 25% 38%, transparent 38%),
    linear-gradient(200deg, transparent 0 52%, rgba(0,0,0,0.02) 52% 64%, transparent 64%);
  opacity: 0.8;
}

.content-wrap {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  max-width: 1920px;
  margin: 0 auto;
}

.business-grid {
  display: grid;
  width: 100%;
  height: 100%;
  /* Convert fixed pixels to proportions to fit screen perfectly */
  grid-template-columns: 1.6fr 2.7fr 1.5fr 2fr 2.2fr;
  grid-template-rows: 2fr 4.7fr 2.2fr; 
  /* roughly matches original 190/470/220 rows and 310/520/280/390/430 columns */
}

.grid-item {
  position: relative;
  overflow: hidden;
}

/* header đỏ (Styles move up with Animation block, keeping only what remains if any) */
.header-pattern {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.14)),
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.07) 0 2px,
      transparent 2px 8px
    );
  opacity: 0.8;
}

.header-content {
  position: relative;
  z-index: 2;
  padding: 58px 0 0 56px;
  color: #fff;
}

.header-content h2 {
  margin: 0;
  font-family: "Times New Roman", serif;
  font-size: 42px;
  font-weight: 500;
  line-height: 1.15;
}

.header-line-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}

.line {
  width: 170px;
  height: 1px;
  background: rgba(255, 255, 255, 0.8);
}

.stamp-box {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255,255,255,0.8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 9px;
  line-height: 1;
  color: #f2c7b6;
}

/* image cards */
.image-card {
  cursor: pointer;
}

.image-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 1s ease;
}

.image-card:hover .image-bg {
  transform: scale(1.05);
}

.overlay {
  position: absolute;
  inset: 0;
}

.overlay.light {
  background: linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0.05));
}

.overlay.dark {
  background: linear-gradient(to top, rgba(0,0,0,0.42), rgba(0,0,0,0.08));
}

.overlay.design {
  background: linear-gradient(
    90deg,
    rgba(0,0,0,0.48) 0%,
    rgba(0,0,0,0.26) 48%,
    rgba(120,0,10,0.16) 100%
  );
}

.card-content {
  position: absolute;
  z-index: 2;
  color: #fff;
  transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.card-content h3 {
  margin: 0;
  font-size: 21px;
  font-weight: 400;
  line-height: 1.3;
}

.desc-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.desc-inner {
  overflow: hidden;
}

.image-card:hover .desc-wrapper {
  grid-template-rows: 1fr;
  opacity: 1;
}

.image-card:hover .card-content {
  transform: translateY(-10px);
}

.small-card {
  left: 24px;
  bottom: 18px;
}

.arch-card {
  left: 28px;
  bottom: 20px;
}

.design-card {
  left: 28px;
  right: 28px;
  bottom: 36px;
  max-width: 78%;
}

.desc-line {
  width: 38px;
  height: 2px;
  margin: 16px 0 18px;
  background: rgba(255,255,255,0.95);
}

.card-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.82;
  color: rgba(255,255,255,0.94);
  /* Truncate texts to 4 lines maximum to prevent blowing up the card */
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.exhibit-card {
  left: 26px;
  bottom: 18px;
}

/* vị trí */
.item-urban {
  grid-column: 4;
  grid-row: 1;
}

.item-eco {
  grid-column: 5;
  grid-row: 1;
}

.item-arch {
  grid-column: 2 / 4;
  grid-row: 2;
}

.item-design {
  grid-column: 4 / 6;
  grid-row: 2;
}

.item-exhibit {
  grid-column: 4;
  grid-row: 3;
}

/* Digital panel */
.digital-panel {
  grid-column: 1 / 4;
  grid-row: 3;
  background: #efefef;
  cursor: pointer;
}

.digital-art {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 8% 82%, rgba(0,0,0,0.04) 0 10%, transparent 10.3%),
    linear-gradient(135deg, rgba(255,255,255,0.85), rgba(0,0,0,0.03));
  opacity: 0.75;
}

.digital-text {
  position: absolute;
  right: 120px;
  bottom: 18px;
  font-size: 21px;
  color: #dadada;
  font-weight: 300;
}

/* More card */
.more-card {
  grid-column: 5;
  grid-row: 3;
  background:
    linear-gradient(145deg, rgba(255,255,255,0.85), rgba(0,0,0,0.03)),
    #f4f4f4;
  cursor: pointer;
}

.more-shape {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(145deg, transparent 0 32%, rgba(0,0,0,0.018) 32% 44%, transparent 44%),
    linear-gradient(200deg, transparent 0 55%, rgba(0,0,0,0.02) 55% 65%, transparent 65%);
}

.more-inner {
  position: absolute;
  left: 54%;
  top: 43%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 16px;
  color: #555;
  font-size: 14px;
  z-index: 2;
}

.more-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #c30012;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(194, 0, 18, 0.18);
  transition: transform 0.3s ease;
}

.more-card:hover .more-btn {
  transform: scale(1.08);
}

.bottom-red-strip {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 58px;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.07) 0 2px,
      transparent 2px 8px
    ),
    linear-gradient(90deg, #af0010 0%, #c10012 100%);
}

/* responsive */
@media (max-width: 1400px) {
  .content-wrap {
    width: 100%;
    padding: 20px 20px 0;
  }

  .business-grid {
    grid-template-columns: 240px 1fr 0.8fr 1fr 1fr;
  }
}

@media (max-width: 1200px) {
  .left-red-bg {
    width: 100%;
    height: 360px;
  }

  .right-shape {
    display: none;
  }

  .business-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 180px 180px 320px 320px 180px 180px;
    min-height: auto;
  }

  .header-card {
    grid-column: 1 / 3;
    grid-row: 1;
  }

  .item-urban {
    grid-column: 1;
    grid-row: 2;
  }

  .item-eco {
    grid-column: 2;
    grid-row: 2;
  }

  .item-arch {
    grid-column: 1 / 3;
    grid-row: 3;
  }

  .item-design {
    grid-column: 1 / 3;
    grid-row: 4;
  }

  .digital-panel {
    grid-column: 1;
    grid-row: 5;
  }

  .item-exhibit {
    grid-column: 2;
    grid-row: 5;
  }

  .more-card {
    grid-column: 1 / 3;
    grid-row: 6;
  }
}

@media (max-width: 768px) {
  .business-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 150px 170px 170px 280px 320px 160px 170px 150px;
  }

  .header-card,
  .item-urban,
  .item-eco,
  .item-arch,
  .item-design,
  .digital-panel,
  .item-exhibit,
  .more-card {
    grid-column: 1;
  }

  .header-card { grid-row: 1; }
  .item-urban { grid-row: 2; }
  .item-eco { grid-row: 3; }
  .item-arch { grid-row: 4; }
  .item-design { grid-row: 5; }
  .digital-panel { grid-row: 6; }
  .item-exhibit { grid-row: 7; }
  .more-card { grid-row: 8; }

  .header-content {
    padding: 38px 0 0 24px;
  }

  .header-content h2 {
    font-size: 30px;
  }

  .line {
    width: 120px;
  }

  .design-card {
    max-width: 100%;
  }

  .digital-text {
    right: 20px;
    bottom: 14px;
    font-size: 18px;
  }
}
</style>
