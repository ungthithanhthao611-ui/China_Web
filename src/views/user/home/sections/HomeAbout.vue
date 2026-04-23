<script setup>
import { ArrowRight } from 'lucide-vue-next'

defineProps({
  active: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <section class="home-about-section">
    <div class="grain"></div>

    <div class="ctn">
      <!-- BUILDING LAYER -->
      <div class="building-layer" :class="{ 'reveal-building': active }">
        <img
          class="building-img"
          src="https://res.cloudinary.com/db1b15yn4/image/upload/f_auto,q_auto/v1776694061/Image_20260418142414_10_3_rj9klh.jpg"
          alt="Building"
        />
        <div class="building-mask"></div>
      </div>

      <div class="container">
        <!-- LEFT CONTENT -->
        <div class="content-left" :class="{ 'reveal-content': active }">
          <div class="tit">
            <div class="tit-row">
              <h2>VỀ CHÚNG TÔI</h2>
            </div>
            <div class="title-line"></div>
          </div>

          <div class="des">
            CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ THIÊN ĐỒNG VIỆT NAM chuyên cung cấp các dòng đá mềm – tấm ốp linh hoạt cao cấp, ứng dụng trong trang trí nội thất và ngoại thất hiện đại. Chúng tôi cam kết mang đến những giải pháp vật liệu ốp lát bền đẹp, tối ưu chi phí, giúp khách hàng nâng tầm không gian sống và công trình xây dựng.
          </div>


        </div>
      </div>

      <!-- DECORATIVE BOTTOM-LEFT -->
      <div class="corner-sketch"></div>
    </div>
  </section>
</template>

<style scoped>
.home-about-section {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 720px;
  overflow: hidden;
  background:
    linear-gradient(to right, rgba(255, 255, 255, 0.97), rgba(255, 255, 255, 0.93)),
    #ffffff;
  font-family: "Segoe UI", Arial, sans-serif;
}

/* texture nền nhẹ */
.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.08;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(0, 0, 0, 0.18) 0.5px, transparent 0.7px),
    radial-gradient(circle at 80% 30%, rgba(0, 0, 0, 0.12) 0.5px, transparent 0.8px),
    radial-gradient(circle at 40% 70%, rgba(0, 0, 0, 0.12) 0.5px, transparent 0.8px);
  background-size: 12px 12px, 14px 14px, 16px 16px;
}

.ctn {
  position: relative;
  width: 100%;
  height: 100%;
}

.container {
  position: relative;
  z-index: 3;
  width: min(1480px, calc(100% - 120px));
  height: 100%;
  margin: 0 auto;
  isolation: isolate;
}

/* BUILDING - chìm vào nền thay vì thành 1 block riêng */
.building-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.building-img {
  position: absolute;
  right: -3%;
  top: 1%;
  width: 58%;
  height: 98%;
  object-fit: contain;
  object-position: right top;

  opacity: 0; /* Start hidden */
  transform: translateX(120px); /* Slide from further right */
  transition:
    opacity 1.5s cubic-bezier(0.25, 1, 0.5, 1),
    transform 1.5s cubic-bezier(0.25, 1, 0.5, 1);
  transition-delay: 0.2s; /* Matches content delay */
}

.reveal-building .building-img {
  opacity: 0.95;
  transform: translateX(0);
}

.building-mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to right,
      #ffffff 0%,
      rgba(255, 255, 255, 0.985) 12%,
      rgba(255, 255, 255, 0.93) 22%,
      rgba(255, 255, 255, 0.82) 32%,
      rgba(255, 255, 255, 0.58) 42%,
      rgba(255, 255, 255, 0.2) 55%,
      rgba(255, 255, 255, 0) 68%
    ),
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(255, 255, 255, 0.04) 18%,
      rgba(255, 255, 255, 0) 56%,
      rgba(255, 255, 255, 0.10) 100%
    );
}

/* CONTENT */
.content-left {
  position: absolute;
  left: 8%;
  top: 50%;
  width: 420px;
  z-index: 4;
  opacity: 0;
  transform: translate(-40px, -50%);
  transition:
    opacity 1.2s cubic-bezier(0.25, 1, 0.5, 1),
    transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
  transition-delay: 0.25s;
}

.content-left.reveal-content {
  opacity: 1;
  transform: translate(0, -50%);
}

.tit {
  margin-bottom: 42px;
}

.tit-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tit h2 {
  margin: 0;
  font-family: "Times New Roman", serif;
  font-size: 34px;
  line-height: 1;
  letter-spacing: 0.4px;
  font-weight: 400;
  color: #2b2b2b;
}

.title-icon {
  height: 24px;
  width: auto;
  object-fit: contain;
  display: block;
}

.title-line {
  position: relative;
  width: 270px;
  height: 1px;
  background: #d91f26;
  margin-top: 18px;
}

.title-line::after {
  content: '';
  position: absolute;
  right: -1px;
  top: 50%;
  width: 4px;
  height: 4px;
  transform: translateY(-50%);
  border-radius: 50%;
  background: #d91f26;
}

.des {
  color: #666;
  font-size: 16px;
  line-height: 1.92;
  font-weight: 300;
  text-align: left;
  max-width: 410px;
  margin-bottom: 62px;
}





.one_btn {
  display: flex;
  align-items: center;
  gap: 72px;
}

.more {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
}

.more span {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.6px;
  color: #666;
}

.more::after {
  content: '';
  position: absolute;
  left: 62px;
  bottom: -4px;
  width: 52px;
  height: 1px;
  transition: all 0.35s ease;
}

.more-red::after {
  background: #d91f26;
}

.me_btn {
  position: relative;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
}

.me_btn img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.more-red .me_btn {
  filter: hue-rotate(0deg) saturate(1.2);
}

.ic {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.more:hover .me_btn img {
  transform: rotate(90deg);
}

.more:hover::after {
  width: 72px;
}

/* góc trái dưới phác họa nhẹ */
.corner-sketch {
  position: absolute;
  left: -30px;
  bottom: -20px;
  width: 220px;
  height: 180px;
  opacity: 0.12;
  z-index: 0;
  background:
    radial-gradient(circle at 70% 50%, transparent 64%, #bfbfbf 65%, transparent 66%),
    linear-gradient(35deg, transparent 48%, #bfbfbf 49%, transparent 50%),
    linear-gradient(62deg, transparent 48%, #bfbfbf 49%, transparent 50%);
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .content-left {
    left: 6%;
    width: 380px;
  }

  .numCount {
    left: 45%;
    top: 26%;
  }

  .building-img {
    width: 62%;
    right: -4%;
  }
}

@media (max-width: 992px) {
  .home-about-section {
    min-height: 760px;
  }

  .container {
    width: calc(100% - 40px);
  }

  .building-layer {
    opacity: 1 !important;
    transform: none !important;
  }

  .building-img {
    right: -8%;
    top: auto;
    bottom: 0;
    width: 110%;
    height: 56%;
    object-fit: contain;
    object-position: center bottom;
    opacity: 0.85;
    transform: none; /* No transform on mobile */
  }

  .reveal-building .building-img {
    opacity: 0.85;
    transform: none;
  }

  .building-mask {
    background: linear-gradient(
      to top,
      rgba(255, 255, 255, 0.10),
      #ffffff 72%
    );
  }

  .content-left {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    padding-top: 110px;
    opacity: 1;
    transform: none;
  }

  .content-left.reveal-content {
    transform: none;
  }



  .tit h2 {
    font-size: 28px;
  }

  .title-icon {
    height: 20px;
  }

  .title-line {
    width: 220px;
  }

  .two_btn {
    gap: 34px;
  }
}
</style>


