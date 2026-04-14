<script setup>
defineProps({
  title: String,
  subtitle: String,
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=2070'
  }
})
</script>

<template>
  <div class="page-banner" :style="{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${image})` }">
    <div class="container banner-inner">
      <h1 data-aos="fade-up">{{ title }}</h1>
      <p v-if="subtitle" data-aos="fade-up" data-aos-delay="100">{{ subtitle }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.page-banner {
  height: 400px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  color: $white;
  margin-bottom: 0;
  
  @media (max-width: 768px) {
    height: 300px;
  }

  .banner-inner {
    h1 {
      font-size: 48px;
      font-weight: 800;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      
      @media (max-width: 768px) {
        font-size: 32px;
      }
    }
    
    p {
      font-size: 18px;
      max-width: 600px;
      opacity: 0.9;
    }
  }
}
</style>

