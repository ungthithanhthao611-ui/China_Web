<script setup>
import PageBanner from '@/client/components/shared/common/PageBanner.vue'
import Breadcrumb from '@/client/components/shared/common/Breadcrumb.vue'
import SideMenu from '@/client/components/shared/about/SideMenu.vue'

const breadcrumbs = [
  { name: 'About Us', link: '/about/company-introduction' },
  { name: 'Chairman\'s Speech' }
]
</script>

<template>
  <div class="about-page">
    <PageBanner title="Chairman's Speech" subtitle="Integrity, Innovation, and Interconnectivity" />
    <Breadcrumb :paths="breadcrumbs" />
    
    <div class="content-wrapper section-padding">
      <div class="container container-flex">
        <div class="sidebar">
          <SideMenu />
        </div>
        
        <div class="main-content">
          <div class="speech-wrap" data-aos="fade-up">
            <div class="chairman-info">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" alt="Chairman">
              <div class="info">
                <h4>Ye Yuanxi</h4>
                <p>Chairman of Sino-Decoration</p>
              </div>
            </div>

            <div class="speech-content">
              <h3 class="quote-start">"Decades of dedication, building a century-old brand."</h3>
              
              <p>Dear Friends and Colleagues,</p>
              <p>
                Since our founding in 1983, Sino-Decoration has walked a path of transformation and transcendence. We began during China's reform and opening up, grew with the urbanization of our nation, and are now evolving in the era of high-tech and sustainable development.
              </p>
              <p>
                To us, decoration is more than just aesthetics; it is an engineering science that demands precision, a cultural expression that requires soul, and a commitment to safety that needs integrity. We have always adhered to the philosophy of "Sincerity as the foundation, Quality as the priority."
              </p>
              <p>
                Looking ahead, we will continue to embrace "Decoration 4.0," integrating BIM, green materials, and intelligent systems into our projects. We are not just building spaces; we are building trust and enduring value for our clients and society.
              </p>
              
              <div class="signature">
                <p>Sincerely,</p>
                <div class="sig-image">Ye Yuanxi</div>
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

.chairman-info {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 50px;
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 8px;
  
  img {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid $white;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  h4 {
    font-size: 24px;
    margin-bottom: 5px;
  }
  
  p {
    color: $primary-color;
    font-weight: 600;
  }
}

.speech-content {
  line-height: 2;
  color: $text-light;
  
  .quote-start {
    font-size: 28px;
    font-style: italic;
    color: $black;
    margin-bottom: 40px;
    border-left: 5px solid $primary-color;
    padding-left: 20px;
  }
  
  p {
    margin-bottom: 25px;
    font-size: 16px;
  }
  
  .signature {
    margin-top: 50px;
    text-align: right;
    .sig-image {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      color: $black;
      margin-top: 10px;
    }
  }
}
</style>


