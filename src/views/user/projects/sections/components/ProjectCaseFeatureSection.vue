<script setup>
import { computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination } from 'swiper/modules'

const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

const galleryModules = [Navigation, Pagination]

const sideGallery = computed(() =>
  props.project.rightImages?.length
    ? props.project.rightImages
    : props.project.leftImages?.slice(1).length
      ? props.project.leftImages.slice(1)
      : props.project.leftImages
)
</script>

<template>
  <article class="case-feature alLi li01" :class="{ 'is-active': isActive }">
    <div class="alTop">
      <div class="topRight reveal" style="--delay: 0.1s">
        <div class="rCenter">
          <h2 class="topTitle">{{ project.title }}</h2>
          <div class="topTitle1"></div>
          <div class="tLine"></div>
          <p class="topSum">{{ project.summary }}</p>

          <a
            v-if="project.moreLink"
            class="almore"
            :href="project.moreLink"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="me_btn">
              <img
                src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/4407f1e1-9209-4baa-9a9b-52e2e8262e37.png"
                alt=""
                loading="lazy"
              />
              <span class="ic">›</span>
            </span>
            <span class="almore_text">More +</span>
          </a>
        </div>
      </div>

      <div class="topLeft reveal" style="--delay: 0.22s">
        <Swiper
          class="case-gallery gallery-left"
          :modules="galleryModules"
          :slides-per-view="1"
          :speed="800"
          :navigation="project.leftImages.length > 1"
          :pagination="project.leftImages.length > 1 ? { clickable: true } : false"
        >
          <SwiperSlide v-for="image in project.leftImages" :key="image">
            <div class="leftLi">
              <img :src="image" :alt="project.title" loading="lazy" decoding="async" />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>

    <div class="alBottom">
      <div class="bj1 reveal" style="--delay: 0.3s">
        <img
          src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/aad8751c-0e26-4358-aa99-1e18c1f51132.png"
          alt=""
          loading="lazy"
        />
      </div>

      <div class="bj2 reveal" style="--delay: 0.36s">
        <img
          src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/fe02b20e-9f6d-4bef-aaf7-f084abe985dc.png"
          alt=""
          loading="lazy"
        />
      </div>

      <div class="sltBox reveal" style="--delay: 0.44s">
        <Swiper
          class="case-gallery gallery-right"
          :modules="galleryModules"
          :slides-per-view="1"
          :speed="800"
          :navigation="sideGallery.length > 1"
          :pagination="sideGallery.length > 1 ? { clickable: true } : false"
        >
          <SwiperSlide v-for="image in sideGallery" :key="image">
            <div class="bottomLi">
              <img :src="image" :alt="`${project.title} detail`" loading="lazy" decoding="async" />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  </article>
</template>

<style scoped>
.case-feature {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f4ee;
}

.alTop {
  height: 65%;
  display: flex;
  overflow: hidden;
}

.topLeft {
  width: 58%;
  min-width: 0;
  height: 100%;
}

.topRight {
  width: 42%;
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
}

.topRight::before {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  width: 2.08vw;
  min-width: 26px;
  height: 72%;
  background: #162134;
}

.rCenter {
  width: 100%;
  margin: auto 0;
  padding: 0 8% 0 11%;
}

.topTitle {
  margin: 0;
  color: #333333;
  font-family: var(--case-font-display);
  font-size: clamp(32px, 2.52vw, 46px);
  font-weight: 500;
  line-height: 1.05;
  text-transform: uppercase;
}

.topTitle1 {
  min-height: 22px;
}

.tLine {
  width: 126px;
  height: 2px;
  margin: 0 0 34px;
  background: #1a2232;
}

.topSum {
  margin: 0;
  color: #666666;
  font-size: 16px;
  line-height: 2;
  text-align: justify;
  display: -webkit-box;
  -webkit-line-clamp: 7;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.almore {
  width: 188px;
  margin-top: 38px;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  color: #666666;
}

.almore_text {
  padding-bottom: 2px;
  border-bottom: 1px solid #cf0021;
  transition: transform 0.36s ease;
}

.me_btn {
  position: relative;
  width: 82px;
  height: 82px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.me_btn img {
  width: 100%;
  height: 100%;
  display: block;
}

.ic {
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  font-weight: 400;
  transition: transform 0.8s ease;
}

.almore:hover .almore_text {
  transform: translateX(8px);
}

.almore:hover .ic {
  transform: translateX(4px);
}

.alBottom {
  position: relative;
  height: 35%;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bj1 {
  width: 27.4%;
  height: 100%;
  background: #d7000f;
}

.bj2 {
  width: 30.6%;
  height: 64%;
  background: #efe9de;
}

.sltBox {
  width: 31.4%;
  height: 100%;
}

.bj1 img,
.bj2 img,
.leftLi img,
.bottomLi img,
.case-gallery :deep(img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.leftLi,
.bottomLi,
.case-gallery {
  height: 100%;
}

.case-gallery :deep(.swiper-button-prev),
.case-gallery :deep(.swiper-button-next) {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  color: #212939;
  box-shadow: 0 14px 20px rgba(22, 33, 52, 0.14);
}

.case-gallery :deep(.swiper-button-prev::after),
.case-gallery :deep(.swiper-button-next::after) {
  font-size: 18px;
  font-weight: 700;
}

.case-gallery :deep(.swiper-pagination) {
  bottom: 14px;
}

.case-gallery :deep(.swiper-pagination-bullet) {
  width: 10px;
  height: 10px;
  background: rgba(255, 255, 255, 0.74);
  opacity: 1;
}

.case-gallery :deep(.swiper-pagination-bullet-active) {
  background: #d7000f;
}

@media (max-width: 1180px) {
  .rCenter {
    padding-right: 7%;
  }
}

@media (max-width: 768px) {
  .case-feature {
    height: auto;
    min-height: auto;
    overflow: visible;
  }

  .alTop,
  .alBottom {
    height: auto;
    display: block;
  }

  .topLeft,
  .topRight,
  .bj1,
  .bj2,
  .sltBox {
    width: 100%;
  }

  .topLeft,
  .sltBox {
    height: auto;
    min-height: 260px;
  }

  .leftLi,
  .bottomLi,
  .case-gallery {
    height: clamp(260px, 62vw, 360px);
  }

  .topRight::before,
  .bj1,
  .bj2 {
    display: none;
  }

  .rCenter {
    padding: 26px 20px 20px;
  }

  .topSum {
    display: block;
    text-align: left;
  }

  .almore {
    width: auto;
    margin-top: 24px;
  }

  .me_btn {
    width: 58px;
    height: 58px;
  }
}
</style>
