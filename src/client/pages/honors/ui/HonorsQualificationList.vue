<script setup>
import HonorCard from './HonorCard.vue'

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  imageResolver: {
    type: Function,
    required: true,
  },
})
</script>

<template>
  <section id="page2" class="section section-certificate">
    <div class="section-bg"></div>
    <div class="stage">
      <header class="heading">
        <h2>Qualification Certificate</h2>
      </header>
      <div v-if="!items.length" class="empty">No qualification certificates available.</div>
      <div v-else class="grid">
        <HonorCard
          v-for="item in items"
          :key="`qualification-${item.id}`"
          :item="item"
          :image-src="imageResolver(item.image_url)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  position: relative;
  min-height: 100vh;
  padding: 56px 0 40px;
}

.section-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(90deg, rgba(49, 30, 12, 0.96) 0%, rgba(91, 64, 29, 0.92) 36%, rgba(176, 148, 92, 0.72) 100%),
    url('https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg');
  background-size: cover;
  background-position: center right;
}

.stage {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100% - 50px));
  margin: 0 auto;
}

.heading {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.heading h2 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 1.55rem + 1.2vw, 3rem);
}

.grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.empty {
  color: rgba(255, 255, 255, 0.86);
  text-align: center;
  padding: 16px;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .section {
    padding: 36px 0 24px;
  }

  .stage {
    width: calc(100% - 22px);
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
