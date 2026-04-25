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

const topGallery = computed(() =>
  props.project.rightImages?.length ? props.project.rightImages : props.project.leftImages
)
</script>

<template>
  <article class="case-standard cbox-3" :class="{ 'is-active': isActive }">
    <div class="xhbottom">
      <div class="topLeft reveal" style="--delay: 0.08s">
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

      <div class="topRight reveal" style="--delay: 0.18s">
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
    </div>

    <div class="xhtop">
      <div class="sltBox reveal" style="--delay: 0.28s">
        <Swiper
          class="case-gallery gallery-right"
          :modules="galleryModules"
          :slides-per-view="1"
          :speed="800"
          :navigation="topGallery.length > 1"
          :pagination="topGallery.length > 1 ? { clickable: true } : false"
        >
          <SwiperSlide v-for="image in topGallery" :key="image">
            <div class="bottomLi">
              <img :src="image" :alt="`${project.title} detail`" loading="lazy" decoding="async" />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      <div class="bj2 reveal" style="--delay: 0.34s"></div>

      <div class="bj1 reveal" style="--delay: 0.4s">
        <img
          src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/aad8751c-0e26-4358-aa99-1e18c1f51132.png"
          alt=""
          loading="lazy"
        />
      </div>
    </div>
  </article>
</template>

<style scoped>
.case-standard {
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 12% 18%, rgba(238, 230, 218, 0.8), transparent 24%),
    linear-gradient(180deg, rgba(250, 247, 241, 0.98), rgba(243, 239, 232, 0.98));
}

.xhtop {
  height: 35%;
  display: flex;
  align-items: flex-end;
}

.sltBox {
  width: 31.4%;
  height: 100%;
}

.bj2 {
  width: 30.6%;
  height: 74%;
  position: relative;
  background:
    linear-gradient(180deg, rgba(247, 241, 231, 0.92), rgba(234, 224, 208, 0.84)),
    radial-gradient(circle at left bottom, rgba(215, 0, 15, 0.18), transparent 40%);
}

.bj2::before {
  content: '';
  position: absolute;
  left: 12%;
  right: 0;
  bottom: 0;
  top: 18%;
  background:
    radial-gradient(circle at left bottom, rgba(215, 0, 15, 0.38), transparent 54%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0));
  opacity: 0.8;
}

.bj1 {
  width: 27.4%;
  height: 100%;
}

.xhbottom {
  height: 65%;
  display: flex;
}

.topRight {
  width: 42%;
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.88);
}

.topRight::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 5vw;
  min-width: 34px;
  height: 100%;
  background: linear-gradient(180deg, rgba(22, 33, 52, 0.98), rgba(18, 28, 42, 0.92));
}

.rCenter {
  width: 100%;
  margin: auto 0;
  padding: 0 10% 0 13%;
}

.topTitle {
  margin: 0;
  color: #333333;
  font-family: var(--case-font-display);
  font-size: clamp(30px, 2.34vw, 44px);
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
  border-bottom: 1px solid #ce0021;
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

.topLeft {
  width: 58%;
  min-width: 0;
}

.bj1 img,
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
  .case-standard {
    height: auto;
    min-height: auto;
    overflow: visible;
  }

  .xhtop,
  .xhbottom {
    height: auto;
    display: block;
  }

  .sltBox,
  .topRight,
  .topLeft {
    width: 100%;
  }

  .bj2,
  .bj1 {
    display: none;
  }

  .sltBox,
  .topLeft {
    height: auto;
    min-height: 260px;
  }

  .leftLi,
  .bottomLi,
  .case-gallery {
    height: clamp(260px, 62vw, 360px);
  }

  .topRight::before {
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
