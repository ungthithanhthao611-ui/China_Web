<script setup>
import { ArrowRight, Play } from 'lucide-vue-next'
import CountUp from '@/components/common/CountUp.vue'

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
          src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/f1225086-4996-4f1d-88f9-08f4228a378e.png"
          alt="Building"
        />
        <div class="building-mask"></div>
      </div>

      <div class="container">
        <!-- LEFT CONTENT -->
        <div class="content-left" :class="{ 'reveal-content': active }">
          <div class="tit">
            <div class="tit-row">
              <h2>ABOUT US</h2>
              <img
                src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
                alt="About icon"
                class="title-icon"
              />
            </div>
            <div class="title-line"></div>
          </div>

          <div class="des">
            China National Decoration Co., LTD. was established in 1984 with the
            approval of the State Economic Commission and the Ministry of Light
            Industry. It is the first batch of large-scale and high-grade
            decoration enterprises with Grade A qualification of indoor and outdoor
            building decoration construction and design. Large-scale cross-regional,
            cross-industry digital assembly type construction joint-stock decoration
            backbone enterprises.
          </div>

          <div class="two_btn">
            <router-link class="more more-red" to="/about">
              <div class="me_btn">
                <img
                  src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4407f1e1-9209-4baa-9a9b-52e2e8262e37.png"
                  alt="Button bg"
                />
                <div class="ic">
                  <ArrowRight :size="14" color="#ffffff" />
                </div>
              </div>
              <span>MORE +</span>
            </router-link>

            <a class="more more-gold" href="javascript:;">
              <div class="me_btn">
                <img
                  src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/4407f1e1-9209-4baa-9a9b-52e2e8262e37.png"
                  alt="Button bg"
                />
                <div class="ic">
                  <Play :size="13" color="#ffffff" fill="currentColor" />
                </div>
              </div>
              <span>VIDEO +</span>
            </a>
          </div>
        </div>

        <!-- YEAR -->
        <div v-if="active" class="numCount">
          <div class="cloud-bg"></div>
          <CountUp
            class="numCX"
            :startValue="2023"
            :endValue="1984"
            :duration="2200"
          />
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
    #f5f5f3;
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
  filter: grayscale(100%);
  opacity: 0; /* Start hidden */
  transform: translateX(120px); /* Slide from further right */
  transition:
    opacity 1.5s cubic-bezier(0.25, 1, 0.5, 1),
    transform 1.5s cubic-bezier(0.25, 1, 0.5, 1);
  transition-delay: 0.2s; /* Matches content delay */
}

.reveal-building .building-img {
  opacity: 0.75;
  transform: translateX(0);
}

.building-mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to right,
      #f5f5f3 0%,
      rgba(245, 245, 243, 0.985) 12%,
      rgba(245, 245, 243, 0.93) 22%,
      rgba(245, 245, 243, 0.82) 32%,
      rgba(245, 245, 243, 0.58) 42%,
      rgba(245, 245, 243, 0.20) 55%,
      rgba(245, 245, 243, 0) 68%
    ),
    linear-gradient(
      to bottom,
      rgba(245, 245, 243, 0.16) 0%,
      rgba(245, 245, 243, 0.04) 18%,
      rgba(245, 245, 243, 0) 56%,
      rgba(245, 245, 243, 0.10) 100%
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

/* YEAR */
.numCount {
  position: absolute;
  left: 43%;
  top: 28%;
  transform: translate(-50%, -50%);
  z-index: 2;
  opacity: 0;
  animation: floatReveal 1.1s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  animation-delay: 0.3s;
}

@keyframes floatReveal {
  from {
    opacity: 0;
    transform: translate(-50%, -44%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.cloud-bg {
  position: absolute;
  left: 50%;
  top: 54%;
  transform: translate(-50%, -50%);
  width: 340px;
  height: 210px;
  background: radial-gradient(
    circle at center,
    rgba(160, 160, 160, 0.16),
    rgba(160, 160, 160, 0.06) 58%,
    transparent 72%
  );
  filter: blur(8px);
}

.numCX {
  position: relative;
  z-index: 2;
  font-family: "Arial Black", "Segoe UI", sans-serif;
  font-size: clamp(100px, 8vw, 145px);
  line-height: 0.9;
  font-weight: 900;
  letter-spacing: -4px;
  color: #c59a69;
}

/* BUTTONS */
.two_btn {
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

.more-gold::after {
  background: #c59a69;
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

.more-gold .me_btn {
  filter: sepia(0.65) saturate(0.7) brightness(1.02);
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
    opacity: 0.18;
    transform: none; /* No transform on mobile */
  }

  .reveal-building .building-img {
    opacity: 0.18;
    transform: none;
  }

  .building-mask {
    background: linear-gradient(
      to top,
      rgba(245, 245, 243, 0.10),
      #f5f5f3 72%
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

  .numCount {
    left: 50%;
    top: 80px;
    transform: translateX(-50%);
  }

  .numCX {
    font-size: 76px;
    letter-spacing: -2px;
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