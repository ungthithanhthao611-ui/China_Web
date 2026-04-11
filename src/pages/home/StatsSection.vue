<script setup>
import CountUp from '@/components/common/CountUp.vue'

defineProps({
  active: {
    type: Boolean,
    default: false
  }
})

const stats = [
  { value: 1984, label: 'Established In', suffix: '' },
  { value: 100, label: 'Billion Assets', suffix: '+' },
  { value: 50, label: 'Major Cities', suffix: '+' },
  { value: 1000, label: 'Technical Staff', suffix: '+' }
]
</script>

<template>
  <section class="stats-section">
    <!-- Overlay for better text readability -->
    <div class="dark-overlay"></div>
    
    <div class="container relative-inner">
      <div v-if="active" class="stats-grid">
        <div v-for="(stat, index) in stats" :key="index" class="stat-item" data-aos="fade-up" :data-aos-delay="index * 150">
          <div class="num-wrap">
            <CountUp :endValue="stat.value" :suffix="stat.suffix" />
          </div>
          <div class="line"></div>
          <p class="label">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use "../../assets/scss/variables" as *;

.stats-section {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2000');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1;
}

.relative-inner {
  position: relative;
  z-index: 2;
  width: 100%;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
  gap: 30px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 60px;
  }
}

.stat-item {
  flex: 1;
  
  .num-wrap {
    font-size: 64px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 20px;
    font-family: 'Times New Roman', serif;
    color: $primary-color;

    @media (max-width: 992px) {
      font-size: 48px;
    }
  }

  .line {
    width: 40px;
    height: 2px;
    background-color: #fff;
    margin: 0 auto 20px;
    opacity: 0.5;
  }

  .label {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #ccc;
    font-weight: 600;
  }
}
</style>
