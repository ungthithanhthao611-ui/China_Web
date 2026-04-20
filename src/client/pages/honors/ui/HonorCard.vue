<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
  imageSrc: {
    type: String,
    default: '',
  },
})

const frameImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/e936f2ab-1a31-4886-93cf-1a067c709aa5.png'
</script>

<template>
  <article class="honor-card">
    <div class="honor-card__visual">
      <img class="honor-card__frame" :src="frameImage" alt="" aria-hidden="true" />
      <div class="honor-card__inner">
        <img v-if="imageSrc" :src="imageSrc" :alt="item.title" />
      </div>
    </div>
    <h3>{{ item.title }}</h3>
    <p v-if="item.year || item.issued_by" class="meta">
      <span v-if="item.year">{{ item.year }}</span>
      <span v-if="item.issued_by">{{ item.issued_by }}</span>
    </p>
  </article>
</template>

<style scoped>
.honor-card {
  display: grid;
  gap: 10px;
}

.honor-card__visual {
  position: relative;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  filter: drop-shadow(0 14px 22px rgba(0, 0, 0, 0.2));
}

.honor-card__frame {
  width: 100%;
  display: block;
}

.honor-card__inner {
  position: absolute;
  inset: 16% 14% 18% 14%;
  overflow: hidden;
  background: rgba(255, 252, 245, 0.85);
}

.honor-card__inner img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}

.honor-card h3 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(0.92rem, 0.88rem + 0.18vw, 1.05rem);
  line-height: 1.35;
  text-align: center;
}

.meta {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  font-size: 12px;
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
