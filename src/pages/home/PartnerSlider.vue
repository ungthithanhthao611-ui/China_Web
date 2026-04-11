<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'

const partners = [
  'Grand Hyatt', 'Marriott', 'Hilton', 'InterContinental', 'Wanda Group', 'Vanke', 'Evergrande', 'Country Garden'
]

const modules = [Autoplay]
</script>

<template>
  <div class="container partner-section">
    <div class="header-center" data-aos="fade-up">
      <span class="section-tag">COLLABORATION</span>
      <h2 class="section-title">Cooperative Partners</h2>
    </div>

    <div class="partners-wrap" data-aos="fade-up">
      <swiper
        :modules="modules"
        :slides-per-view="2"
        :space-between="30"
        :loop="true"
        :autoplay="{ delay: 2500, disableOnInteraction: false }"
        :breakpoints="{
          '640': { slidesPerView: 3 },
          '1024': { slidesPerView: 5 },
          '1200': { slidesPerView: 6 }
        }"
        class="partner-swiper"
      >
        <swiper-slide v-for="(partner, index) in partners" :key="index">
          <div class="partner-logo">
            <span>{{ partner }}</span>
          </div>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/scss/variables" as *;

.header-center {
  text-align: center;
  margin-bottom: 50px;
}

.section-tag {
  color: $primary-color;
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 14px;
}

.section-title {
  font-size: 32px;
  margin-top: 10px;
}

.partner-logo {
  height: 100px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  transition: all 0.3s;
  
  &:hover {
    background-color: $white;
    color: $primary-color;
    border-color: $primary-color;
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  }
}
</style>
