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
    <div class="hero-media">
      <img :src="hero.background" :alt="hero.title" loading="eager" decoding="async" />
    </div>
    <div class="shade"></div>
    <div class="hero-noise"></div>

    <div class="content">
      <div class="content__copy">
        <span class="hero-kicker">China Decor / Capability Profile</span>

        <div class="title-row">
          <div class="seal-chip">
            <img v-if="hero.accent" :src="hero.accent" alt="" aria-hidden="true" />
            <span>{{ hero.seal_text || '资质' }}</span>
          </div>
          <h1>{{ hero.title }}</h1>
        </div>

        <div class="line"></div>
        <p>{{ hero.description }}</p>

        <div class="hero-actions">
          <button type="button" class="hero-btn hero-btn--primary" @click="emit('go-section', 'page2')">
            Khám phá nhà máy
          </button>
          <button type="button" class="hero-btn hero-btn--ghost" @click="emit('go-section', 'page3')">
            Xem chứng nhận
          </button>
        </div>
      </div>

      <aside class="hero-panel">
        <div class="hero-panel__card">
          <span>Factory Showcase</span>
          <strong>Thiết kế không gian trưng bày năng lực theo phong cách premium.</strong>
          <p>
            Tổng hợp hình ảnh nhà máy, quy trình, công nghệ và chứng chỉ trong một trải nghiệm
            liền mạch.
          </p>
        </div>
        <div class="hero-panel__metrics">
          <article>
            <span>Section</span>
            <strong>04+</strong>
          </article>
          <article>
            <span>Profile</span>
            <strong>Live CMS</strong>
          </article>
        </div>
      </aside>
    </div>

    <div class="hero-tabs">
      <button type="button" @click="emit('go-section', 'page2')">Hình ảnh nhà máy</button>
      <button type="button" @click="emit('go-section', 'page2c')">Công nghệ sản xuất</button>
      <button type="button" @click="emit('go-section', 'page3')">Chứng nhận & Năng lực</button>
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
  padding: 120px 0 108px;
  overflow: hidden;
}

.hero-media,
.hero-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-media {
  overflow: hidden;
}

.hero-media img {
  object-fit: cover;
  object-position: center center;
}

.shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(16, 10, 5, 0.9) 0%, rgba(16, 10, 5, 0.58) 42%, rgba(16, 10, 5, 0.18) 100%),
    linear-gradient(180deg, rgba(13, 8, 3, 0.18) 0%, rgba(13, 8, 3, 0.68) 100%);
}

.hero-noise {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 20%, rgba(196, 144, 79, 0.22), transparent 22%),
    radial-gradient(circle at 82% 18%, rgba(223, 0, 25, 0.16), transparent 18%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 86px;
  width: min(1240px, calc(100% - 60px));
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(214, 168, 97, 0.28), transparent);
  z-index: 1;
}

.content {
  width: min(1240px, calc(100% - 60px));
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(320px, 0.45fr);
  gap: 28px;
  align-items: end;
}

.content__copy {
  min-width: 0;
}

.hero-kicker {
  display: inline-flex;
  margin-bottom: 22px;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid rgba(214, 168, 97, 0.18);
  background: rgba(17, 16, 19, 0.42);
  color: rgba(255, 243, 227, 0.88);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
}

.title-row {
  display: grid;
  gap: 18px;
}

.seal-chip {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  gap: 10px;
  min-height: 48px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(123, 18, 14, 0.76);
  color: #fff0ea;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  box-shadow: 0 14px 28px rgba(97, 18, 12, 0.24);
}

.seal-chip img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

h1 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(3rem, 2.25rem + 2.8vw, 5.7rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
  max-width: 700px;
}

.line {
  margin-top: 22px;
  width: min(470px, 72vw);
  height: 1px;
  background: linear-gradient(90deg, #d90017, rgba(217, 0, 23, 0.1));
}

p {
  margin: 24px 0 0;
  max-width: 620px;
  color: rgba(255, 248, 240, 0.88);
  font-size: 18px;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}

.hero-btn {
  min-height: 54px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease,
    border-color 0.25s ease;
}

.hero-btn:hover {
  transform: translateY(-2px);
}

.hero-btn--primary {
  border: none;
  background: linear-gradient(135deg, #74180f, #c34725);
  color: #fff;
  box-shadow: 0 18px 34px rgba(114, 30, 17, 0.24);
}

.hero-btn--ghost {
  border: 1px solid rgba(214, 168, 97, 0.18);
  background: rgba(17, 16, 19, 0.4);
  color: #fff4e0;
  backdrop-filter: blur(10px);
}

.hero-panel {
  display: grid;
  gap: 16px;
}

.hero-panel__card,
.hero-panel__metrics article {
  border-radius: 28px;
  border: 1px solid rgba(214, 168, 97, 0.18);
  background: rgba(17, 16, 19, 0.46);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 40px rgba(7, 7, 9, 0.2);
}

.hero-panel__card {
  display: grid;
  gap: 12px;
  padding: 24px;
}

.hero-panel__card span,
.hero-panel__metrics article span {
  color: rgba(255, 232, 196, 0.74);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.hero-panel__card strong {
  color: #fff7ec;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 26px;
  line-height: 1.3;
}

.hero-panel__card p {
  margin: 0;
  color: rgba(255, 248, 240, 0.76);
  font-size: 14px;
  line-height: 1.8;
}

.hero-panel__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.hero-panel__metrics article {
  display: grid;
  gap: 10px;
  padding: 20px;
}

.hero-panel__metrics strong {
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 26px;
}

.hero-tabs {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(1240px, calc(100% - 60px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-radius: 26px 26px 0 0;
  overflow: hidden;
  background: rgba(12, 22, 38, 0.84);
  border: 1px solid rgba(214, 168, 97, 0.14);
  z-index: 2;
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 42px rgba(5, 5, 7, 0.22);
}

.hero-tabs button {
  min-height: 78px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.25s ease, color 0.25s ease;
}

.hero-tabs button + button {
  border-left: 1px solid rgba(214, 168, 97, 0.12);
}

.hero-tabs button:hover {
  background: rgba(214, 168, 97, 0.08);
  color: #fff;
}

@media (max-width: 1199px) {
  .hero {
    min-height: auto;
    padding: 116px 0 132px;
  }

  .content {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.42fr);
    gap: 22px;
  }

  h1 {
    max-width: 620px;
  }
}

@media (max-width: 991px) {
  .hero {
    min-height: auto;
    padding: 108px 0 136px;
  }

  .hero::after {
    bottom: 116px;
    width: min(1240px, calc(100% - 40px));
  }

  .content {
    width: calc(100% - 40px);
    grid-template-columns: 1fr;
    align-items: start;
    gap: 24px;
  }

  .hero-panel {
    grid-template-columns: 1fr;
  }

  .hero-panel__card,
  .hero-panel__metrics article {
    border-radius: 24px;
  }

  .hero-tabs {
    width: calc(100% - 40px);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .hero {
    min-height: auto;
    padding: 88px 0 184px;
  }

  .hero::after {
    bottom: 156px;
    width: calc(100% - 24px);
  }

  .content,
  .hero-tabs {
    width: calc(100% - 24px);
  }

  .hero-kicker {
    margin-bottom: 16px;
    padding: 9px 14px;
    font-size: 11px;
    letter-spacing: 0.14em;
  }

  .title-row {
    gap: 14px;
  }

  h1 {
    max-width: 100%;
    font-size: clamp(2.35rem, 1.8rem + 4vw, 3.9rem);
    line-height: 1.02;
  }

  .line {
    margin-top: 18px;
    width: min(280px, 72vw);
  }

  p {
    font-size: 15px;
    line-height: 1.7;
  }

  .hero-actions,
  .hero-panel__metrics {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    display: grid;
    gap: 12px;
    margin-top: 24px;
  }

  .hero-btn {
    width: 100%;
    min-height: 50px;
  }

  .hero-panel__card {
    padding: 20px;
  }

  .hero-panel__card strong,
  .hero-panel__metrics strong {
    font-size: 22px;
  }

  .hero-tabs {
    grid-template-columns: 1fr;
    border-radius: 22px 22px 0 0;
  }

  .hero-tabs button {
    min-height: 58px;
    padding: 0 16px;
    font-size: 14px;
  }

  .hero-tabs button + button {
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
}

@media (max-width: 479px) {
  .hero {
    padding: 84px 0 196px;
  }

  .content,
  .hero-tabs,
  .hero::after {
    width: calc(100% - 20px);
  }

  .seal-chip {
    min-height: 42px;
    padding: 0 14px;
    font-size: 12px;
  }

  .seal-chip img {
    width: 22px;
    height: 22px;
  }

  .hero-panel__metrics article,
  .hero-panel__card {
    padding: 18px;
  }
}
</style>

