<script setup>
defineProps({
  hero: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['go-section'])
</script>

<template>
  <section id="page1" class="hero">
    <picture class="hero-media">
      <source :srcset="hero.mobile_background" media="(max-width: 767px)" />
      <img :src="hero.background" :alt="hero.title" />
    </picture>
    <div class="shade"></div>

    <div class="content">
      <div class="title-row">
        <h1>{{ hero.title }}</h1>
        <img :src="hero.accent" alt="" aria-hidden="true" />
      </div>
      <div class="line"></div>
      <p>{{ hero.description }}</p>
    </div>

    <div class="hero-tabs">
      <button type="button" @click="emit('go-section', 'page2')">Qualification certificate</button>
      <button type="button" @click="emit('go-section', 'page3')">Honorary Awards</button>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px 0 92px;
}

.hero-media,
.hero-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-media img {
  object-fit: cover;
}

.shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(27, 16, 4, 0.84) 0%, rgba(27, 16, 4, 0.4) 45%, rgba(27, 16, 4, 0.15) 100%),
    linear-gradient(180deg, rgba(13, 8, 3, 0.2) 0%, rgba(13, 8, 3, 0.58) 100%);
}

.content {
  width: min(1240px, calc(100% - 60px));
  position: relative;
  z-index: 2;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

h1 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2rem, 1.6rem + 1.7vw, 3.2rem);
  line-height: 1.1;
}

.title-row img {
  width: 34px;
  height: 34px;
}

.line {
  margin-top: 16px;
  width: min(420px, 65vw);
  height: 1px;
  background: #d90017;
}

p {
  margin: 20px 0 0;
  max-width: 560px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 18px;
  line-height: 1.7;
}

.hero-tabs {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(1240px, calc(100% - 60px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: rgba(16, 32, 56, 0.9);
  z-index: 2;
}

.hero-tabs button {
  min-height: 76px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  cursor: pointer;
}

.hero-tabs button + button {
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-tabs button:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 767px) {
  .hero {
    padding: 90px 0 72px;
  }

  .content {
    width: calc(100% - 26px);
  }

  p {
    font-size: 15px;
  }

  .hero-tabs {
    width: calc(100% - 26px);
  }

  .hero-tabs button {
    min-height: 56px;
    font-size: 14px;
  }
}
</style>
