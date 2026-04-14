<script setup>
import PageBanner from '@/client/components/shared/common/PageBanner.vue'
import Breadcrumb from '@/client/components/shared/common/Breadcrumb.vue'
import SideMenu from '@/client/components/shared/about/SideMenu.vue'

const breadcrumbs = [
  { name: 'About Us', link: '/about/company-introduction' },
  { name: 'Company Introduction' }
]
</script>

<template>
  <div class="about-page">
    <PageBanner title="Company Introduction" subtitle="Building Excellence, Designing Future Since 1983" />
    <Breadcrumb :paths="breadcrumbs" />
    
    <div class="content-wrapper section-padding">
      <div class="container container-flex">
        <div class="sidebar">
          <SideMenu />
        </div>
        
        <div class="main-content">
          <div class="intro-text" data-aos="fade-up">
            <h2 class="sub-title">Shenzhen Sino-Decoration Co., Ltd.</h2>
            <p>
              Shenzhen Sino-Decoration Co., Ltd. founded in 1983, is a national high-tech enterprise integrating design, research and development, and production. We hold the first-grade qualification for Architectural Decoration Engineering Design and Construction, and are recognized as one of the Top 10 Enterprises in the Chinese Architectural Decoration Industry.
            </p>
            <p>
              Over the past 40 years, we have specialized in high-end hotel decoration, public building interior design, terminal spaces, and specialized medical engineering. Our footprint covers the entire China and extends to international markets, delivering excellence in every square meter we touch.
            </p>
          </div>

          <div class="image-gallery" data-aos="fade-up">
            <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1200" alt="Company Office">
          </div>

          <div class="vision-mission">
            <div class="box" data-aos="fade-up">
              <h3>Our Mission</h3>
              <p>To lead the decoration industry with innovative technology and artisan craftsmanship, creating sustainable and inspiring spaces for humanity.</p>
            </div>
            <div class="box" data-aos="fade-up" data-aos-delay="100">
              <h3>Our Vision</h3>
              <p>To become a world-class integrated service provider for architectural space, recognized for our integrity and excellence.</p>
            </div>
          </div>
          
          <div class="milestones-preview" data-aos="fade-up">
             <h3 class="section-title">Development Strategy</h3>
             <p>Combining industrialization, digitalization, and green building techniques, Sino-Decoration aims to set new benchmarks in the "Decoration 4.0" era.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.container-flex {
  display: flex;
  gap: 50px;
  
  @media (max-width: 992px) {
    flex-direction: column;
  }
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  @media (max-width: 992px) {
    width: 100%;
  }
}

.main-content {
  flex: 1;
  
  .intro-text {
    margin-bottom: 40px;
    h2 {
      font-size: 32px;
      margin-bottom: 25px;
      position: relative;
      padding-bottom: 15px;
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background-color: $primary-color;
      }
    }
    p {
      color: $text-light;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 20px;
    }
  }

  .image-gallery {
    margin-bottom: 40px;
    img {
      width: 100%;
      border-radius: 4px;
    }
  }

  .vision-mission {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 40px;
    
    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }

    .box {
      padding: 30px;
      background-color: #f7f7f7;
      border-left: 4px solid $primary-color;
      
      h3 {
        margin-bottom: 15px;
        font-size: 20px;
      }
      p {
        font-size: 14px;
        color: $text-light;
      }
    }
  }
  
  .section-title {
    font-size: 24px;
    margin-bottom: 20px;
  }
}
</style>


