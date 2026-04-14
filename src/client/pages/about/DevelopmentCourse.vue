<script setup>
import PageBanner from '@/client/components/shared/common/PageBanner.vue'
import Breadcrumb from '@/client/components/shared/common/Breadcrumb.vue'
import SideMenu from '@/client/components/shared/about/SideMenu.vue'

const breadcrumbs = [
  { name: 'About Us', link: '/about/company-introduction' },
  { name: 'Development Course' }
]

const years = [
  { year: '1983', title: 'Foundation', desc: 'Sino-Decoration was founded in Shenzhen, becoming one of the first professional decoration companies in China.' },
  { year: '1995', title: 'Expansion', desc: 'Obtained First-Grade Qualification for Engineering and Design. Expanded services nationwide.' },
  { year: '2005', title: 'Innovation Lead', desc: 'Pioneered "Factory Production, On-site Installation" model, leading the industry industrialization.' },
  { year: '2015', title: 'Digital Transformation', desc: 'Introduction of BIM technology and intelligent construction management systems.' },
  { year: '2023', title: '40th Anniversary', desc: 'Ranked in the Top 10 of China Architectural Decoration Industry. Looking towards a greener future.' }
]
</script>

<template>
  <div class="about-page">
    <PageBanner title="Development Course" subtitle="Four Decades of Growth and Engineering Excellence" />
    <Breadcrumb :paths="breadcrumbs" />
    
    <div class="content-wrapper section-padding">
      <div class="container container-flex">
        <div class="sidebar">
          <SideMenu />
        </div>
        
        <div class="main-content">
          <div class="timeline">
            <div v-for="(item, index) in years" :key="index" class="timeline-item" data-aos="fade-up">
              <div class="year-flag">{{ item.year }}</div>
              <div class="timeline-content">
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
              </div>
            </div>
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
}

.main-content {
  flex: 1;
}

.timeline {
  position: relative;
  padding-left: 50px;
  
  &::before {
    content: '';
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #eee;
  }
}

.timeline-item {
  position: relative;
  margin-bottom: 60px;
  
  &::before {
    content: '';
    position: absolute;
    left: -37px;
    top: 10px;
    width: 16px;
    height: 16px;
    background-color: $white;
    border: 3px solid $primary-color;
    border-radius: 50%;
    z-index: 1;
  }
  
  .year-flag {
    display: inline-block;
    background-color: $primary-color;
    color: $white;
    padding: 5px 15px;
    font-weight: 800;
    font-size: 18px;
    margin-bottom: 15px;
    border-radius: 4px;
  }
  
  .timeline-content {
    background-color: #f9f9f9;
    padding: 30px;
    border-radius: 8px;
    h3 {
      font-size: 20px;
      margin-bottom: 15px;
      color: $black;
    }
    p {
      color: $text-light;
      line-height: 1.6;
    }
  }
}
</style>


