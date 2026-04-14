<script setup>
import { Building2, Utensils, Hotel, Hospital, Plane, ShoppingBag } from 'lucide-vue-next'

const fields = [
  { icon: Hotel, title: 'Star Hotel', desc: 'Premium decoration for international luxury hotel chains.' },
  { icon: Plane, title: 'Terminal Space', desc: 'Large scale public transportation hub design and execution.' },
  { icon: Hospital, title: 'Medical Engineering', desc: 'Specialized sterile environments and healthcare facilities.' },
  { icon: Building2, title: 'Office Space', desc: 'Next-generation workspace solutions for global corporations.' },
  { icon: Utensils, title: 'High-end Dining', desc: 'Bespoke interior design for gourmet restaurants.' },
  { icon: ShoppingBag, title: 'Commercial Space', desc: 'Dynamic retail environments and lifestyle centers.' }
]
</script>

<template>
  <div class="container business-fields">
    <div class="header-center" data-aos="fade-up">
      <span class="section-tag">OUR EXPERTISE</span>
      <h2 class="section-title">Business Fields</h2>
    </div>

    <div class="fields-grid">
      <div v-for="(field, index) in fields" :key="index" class="field-card" data-aos="fade-up" :data-aos-delay="index * 100">
        <div class="icon-wrap">
          <component :is="field.icon" :size="32" />
        </div>
        <h3>{{ field.title }}</h3>
        <p>{{ field.desc }}</p>
        <router-link to="/business-areas" class="link-more">Learn More</router-link>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.header-center {
  text-align: center;
  margin-bottom: 60px;
}

.section-tag {
  color: $primary-color;
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 14px;
}

.section-title {
  font-size: 36px;
  margin-top: 10px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.field-card {
  background-color: $white;
  padding: 50px 40px;
  text-align: center;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    border-bottom-color: $primary-color;
    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    
    .icon-wrap {
      background-color: $primary-color;
      color: $white;
    }
  }

  .icon-wrap {
    width: 80px;
    height: 80px;
    background-color: #fcfcfc;
    border: 1px solid #eee;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 30px;
    color: $primary-color;
    transition: all 0.3s;
  }

  h3 {
    margin-bottom: 15px;
    font-size: 20px;
  }

  p {
    color: $text-light;
    font-size: 15px;
    line-height: 1.6;
    margin-bottom: 25px;
  }

  .link-more {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    color: $primary-color;
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background-color: $primary-color;
      transition: width 0.3s;
    }
    
    &:hover::after {
      width: 100%;
    }
  }
}
</style>

