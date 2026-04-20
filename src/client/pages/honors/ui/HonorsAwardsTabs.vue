<script setup>
import { ref } from 'vue'

import HonorCard from './HonorCard.vue'

defineProps({
  corporateItems: {
    type: Array,
    default: () => [],
  },
  projectItems: {
    type: Array,
    default: () => [],
  },
  imageResolver: {
    type: Function,
    required: true,
  },
})

const activeTab = ref('corporate')
</script>

<template>
  <section id="page3" class="section section-awards">
    <div class="section-bg"></div>
    <div class="stage">
      <header class="heading">
        <h2>Honorary Awards</h2>
      </header>

      <div class="tabs" role="tablist" aria-label="Honor awards tabs">
        <button
          type="button"
          :class="{ active: activeTab === 'corporate' }"
          role="tab"
          :aria-selected="activeTab === 'corporate'"
          @click="activeTab = 'corporate'"
        >
          Corporate Honors
        </button>
        <button
          type="button"
          :class="{ active: activeTab === 'project' }"
          role="tab"
          :aria-selected="activeTab === 'project'"
          @click="activeTab = 'project'"
        >
          Project Honors
        </button>
      </div>

      <div v-if="activeTab === 'corporate'">
        <div v-if="!corporateItems.length" class="empty">No corporate honors available.</div>
        <div v-else class="grid">
          <HonorCard
            v-for="item in corporateItems"
            :key="`corporate-${item.id}`"
            :item="item"
            :image-src="imageResolver(item.image_url)"
          />
        </div>
      </div>

      <div v-else>
        <div v-if="!projectItems.length" class="empty">No project honors available.</div>
        <div v-else class="grid">
          <HonorCard
            v-for="item in projectItems"
            :key="`project-${item.id}`"
            :item="item"
            :image-src="imageResolver(item.image_url)"
          />
        </div>
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
    linear-gradient(90deg, rgba(34, 21, 8, 0.96) 0%, rgba(76, 52, 24, 0.94) 34%, rgba(164, 138, 86, 0.74) 100%),
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
  margin-bottom: 18px;
}

.heading h2 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 1.55rem + 1.2vw, 3rem);
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 22px;
}

.tabs button {
  min-width: 190px;
  min-height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  cursor: pointer;
}

.tabs button.active {
  background: #d90017;
  border-color: #d90017;
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

  .tabs {
    flex-wrap: wrap;
  }

  .tabs button {
    min-width: 140px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
