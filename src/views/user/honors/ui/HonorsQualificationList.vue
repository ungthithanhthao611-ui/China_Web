<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import HonorCard from './HonorCard.vue'

const { t } = useI18n()

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  imageResolver: {
    type: Function,
    required: true,
  },
})

const page = ref(0)
const PAGE_SIZE = 6

const totalPages = computed(() => Math.max(1, Math.ceil(props.items.length / PAGE_SIZE)))
const pagedItems = computed(() => {
  const startIndex = page.value * PAGE_SIZE
  return props.items.slice(startIndex, startIndex + PAGE_SIZE)
})
const showPagination = computed(() => props.items.length > PAGE_SIZE)
const isFirstPage = computed(() => page.value === 0)
const isLastPage = computed(() => page.value >= totalPages.value - 1)

function prevPage() {
  if (isFirstPage.value) return
  page.value -= 1
}

function nextPage() {
  if (isLastPage.value) return
  page.value += 1
}

watch(
  () => props.items,
  () => {
    page.value = 0
  },
  { deep: true },
)
</script>

<template>
  <section id="page2" class="section section-certificate">
    <div class="section-bg"></div>
    <div class="stage">
      <header class="heading reveal-item">
        <div class="heading-copy">
          <span class="eyebrow">{{ t('user.capability.eyebrow') }}</span>
          <h2>{{ t('user.capability.factoryGallery') }}</h2>
          <p>
            {{ t('user.capability.factoryGalleryDesc') }}
          </p>
        </div>

        <div class="heading-note">
          <span>Factory Gallery</span>
          <strong>{{ items.length || 0 }}</strong>
          <p>{{ t('user.capability.imagesFromCms') }}</p>
        </div>
      </header>

      <div v-if="!items.length" class="empty">{{ t('user.capability.emptyGallery') }}</div>
      <template v-else>
        <div class="section-toolbar">
          <div class="section-toolbar__summary">
            <strong>{{ items.length }}</strong>
            <span>{{ t('user.capability.factoryImagesCount') }}</span>
          </div>

          <div v-if="showPagination" class="pager" :aria-label="t('user.capability.paginationGallery')">
            <button
              type="button"
              class="pager__btn"
              :disabled="isFirstPage"
              :aria-label="t('user.capability.prevPageGallery')"
              @click="prevPage"
            >
              <ChevronLeft :size="18" />
            </button>
            <span class="pager__status">{{ page + 1 }} / {{ totalPages }}</span>
            <button
              type="button"
              class="pager__btn"
              :disabled="isLastPage"
              :aria-label="t('user.capability.nextPageGallery')"
              @click="nextPage"
            >
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>

        <div class="grid">
          <HonorCard
            v-for="(item, index) in pagedItems"
            :key="`qualification-${item.id}`"
            :item="item"
            :image-src="imageResolver(item.image_url || item.image)"
            variant="gallery"
            class="reveal-item"
            :style="{ '--i': index }"
          />
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.section {
  position: relative;
  min-height: 100vh;
  padding: 84px 0 68px;
}

.section-bg {
  display: none;
}

.stage {
  position: relative;
  z-index: 1;
  width: min(1080px, calc(100% - 44px));
  margin: 0 auto;
}

.heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;
}

.heading-copy {
  max-width: 620px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  color: #c2410c;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.heading h2 {
  margin: 0;
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.75rem, 1.5rem + 0.8vw, 2.6rem);
  line-height: 1.1;
}

.heading p {
  margin: 8px 0 0;
  max-width: 560px;
  color: #475569;
  font-size: 13px;
  line-height: 1.58;
}

.heading-note {
  position: relative;
  display: grid;
  gap: 5px;
  min-width: 160px;
  padding: 15px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.07);
}

.heading-note::before {
  content: '';
  position: absolute;
  left: 15px;
  right: 15px;
  top: 10px;
  height: 1px;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.24), transparent);
}

.heading-note span {
  color: #b45309;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.heading-note strong {
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 28px;
  line-height: 1;
}

.heading-note p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
}

.grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.empty {
  color: #475569;
  text-align: left;
  padding: 16px 0 2px;
}

@media (max-width: 1024px) {
  .heading {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .section {
    padding: 40px 0 28px;
  }

  .stage {
    width: calc(100% - 16px);
  }

  .heading p {
    font-size: 12px;
  }

  .heading-note {
    min-width: 0;
    padding: 14px;
  }

  .heading-note strong {
    font-size: 24px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.section-toolbar__summary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #475569;
}

.section-toolbar__summary strong {
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 28px;
  line-height: 1;
}

.section-toolbar__summary span {
  color: #64748b;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.pager {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.pager__btn {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.pager__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(239, 68, 68, 0.22);
  background: rgba(254, 242, 242, 0.98);
}

.pager__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__status {
  min-width: 68px;
  text-align: center;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* ── Reveal Animations ── */
.reveal-item {
  opacity: 0;
  transform: translateY(40px);
  transition: all 1s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-active .reveal-item {
  opacity: 1;
  transform: translateY(0);
}

.is-active .grid .reveal-item {
  transition-delay: calc(var(--i, 0) * 0.1s + 0.3s);
}

.is-active .heading.reveal-item {
  transition-delay: 0.1s;
}
</style>
