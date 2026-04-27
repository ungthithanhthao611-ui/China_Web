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
  variant: {
    type: String,
    default: 'frame',
  },
})

const frameImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/e936f2ab-1a31-4886-93cf-1a067c709aa5.png'
</script>

<template>
  <article :class="['honor-card', `honor-card--${variant}`]">
    <div class="honor-card__visual">
      <div class="honor-card__image-shell">
        <template v-if="variant === 'frame'">
          <img class="honor-card__frame" :src="frameImage" alt="" aria-hidden="true" />
          <div class="honor-card__inner">
            <img v-if="imageSrc" :src="imageSrc" :alt="item.title" />
          </div>
        </template>
        <template v-else>
          <div class="honor-card__gallery">
            <img v-if="imageSrc" :src="imageSrc" :alt="item.title" />
            <div class="honor-card__gallery-overlay">
              <span>Factory Space</span>
              <strong>{{ item.title }}</strong>
            </div>
          </div>
        </template>
      </div>
      <div class="honor-card__badge" :class="{ 'honor-card__badge--gallery': variant === 'gallery' }">
        <span>{{ variant === 'gallery' ? 'Factory' : 'Certificate' }}</span>
      </div>
    </div>
    <div class="honor-card__content">
      <h3>{{ item.title }}</h3>
      <p v-if="item.year || item.issued_by" class="meta">
        <span v-if="item.year">{{ item.year }}</span>
        <span v-if="item.issued_by">{{ item.issued_by }}</span>
      </p>
      <p v-if="item.short_description || item.description" class="summary">
        {{ item.short_description || item.description }}
      </p>
    </div>
  </article>
</template>

<style scoped>
.honor-card {
  display: grid;
  gap: 16px;
}

.honor-card__visual {
  position: relative;
  width: 100%;
  margin: 0 auto;
  display: grid;
  place-items: center;
}

.honor-card__image-shell {
  position: relative;
  width: 100%;
  max-width: 420px;
  transition: transform 0.28s ease, box-shadow 0.28s ease;
}

.honor-card--frame .honor-card__image-shell {
  padding: 18px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03)),
    radial-gradient(circle at top left, rgba(214, 168, 97, 0.14), transparent 36%);
  border: 1px solid rgba(214, 168, 97, 0.16);
  box-shadow:
    0 18px 40px rgba(8, 5, 3, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.honor-card:hover .honor-card__image-shell {
  transform: translateY(-5px);
}

.honor-card--frame:hover .honor-card__image-shell {
  box-shadow:
    0 24px 46px rgba(28, 18, 5, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.honor-card--gallery .honor-card__image-shell {
  border-radius: 26px;
  overflow: hidden;
  background: rgba(17, 16, 19, 0.42);
  box-shadow: 0 18px 40px rgba(19, 14, 5, 0.18);
}

.honor-card--gallery:hover .honor-card__image-shell {
  box-shadow: 0 24px 44px rgba(19, 14, 5, 0.22);
}

.honor-card__frame {
  display: none;
}

.honor-card__inner {
  position: relative;
  aspect-ratio: 1.08 / 0.82;
  overflow: hidden;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(35, 24, 16, 0.98), rgba(22, 15, 10, 0.98));
  box-shadow: inset 0 0 0 1px rgba(214, 168, 97, 0.16);
}

.honor-card__gallery {
  position: relative;
  width: 100%;
  aspect-ratio: 0.88;
  overflow: hidden;
  background: rgba(17, 16, 19, 0.34);
}

.honor-card__gallery img,
.honor-card__inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.honor-card__gallery-overlay {
  position: absolute;
  inset: auto 0 0 0;
  display: grid;
  gap: 6px;
  padding: 18px;
  background: linear-gradient(180deg, transparent, rgba(13, 10, 7, 0.8));
}

.honor-card__gallery-overlay span {
  color: rgba(255, 225, 177, 0.82);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.honor-card__gallery-overlay strong {
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 22px;
  line-height: 1.3;
}

.honor-card__badge {
  position: absolute;
  left: 18px;
  top: 18px;
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(18, 28, 42, 0.72);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.honor-card__badge--gallery {
  background: rgba(123, 18, 14, 0.84);
}

.honor-card__content {
  display: grid;
  gap: 10px;
  padding: 0 6px;
}

.honor-card h3 {
  margin: 0;
  color: #fff0d8;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.05rem, 0.96rem + 0.28vw, 1.2rem);
  line-height: 1.38;
  text-align: left;
}

.meta {
  margin: 0;
  color: rgba(255, 235, 208, 0.72);
  text-align: left;
  font-size: 12px;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.meta span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(214, 168, 97, 0.1);
}

.summary {
  margin: 0;
  color: rgba(255, 235, 208, 0.76);
  font-size: 13px;
  line-height: 1.65;
}
</style>
