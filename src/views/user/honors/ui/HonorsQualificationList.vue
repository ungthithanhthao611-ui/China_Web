<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import HonorCard from './HonorCard.vue'

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
      <header class="heading">
        <div class="heading-copy">
          <span class="eyebrow">NĂNG LỰC SẢN XUẤT</span>
          <h2>Hình ảnh nhà máy</h2>
          <p>
            Hình ảnh thực tế về nhà xưởng, kho bãi và hoạt động vận hành tại hiện trường, được trình
            bày theo tinh thần showroom cao cấp.
          </p>
        </div>

        <div class="heading-note">
          <span>Factory Gallery</span>
          <strong>{{ items.length || 0 }}</strong>
          <p>Ảnh đang hiển thị từ CMS.</p>
        </div>
      </header>

      <div v-if="!items.length" class="empty">Chưa có hình ảnh nhà máy để hiển thị.</div>
      <template v-else>
        <div class="section-toolbar">
          <div class="section-toolbar__summary">
            <strong>{{ items.length }}</strong>
            <span>ảnh nhà máy từ CMS</span>
          </div>

          <div v-if="showPagination" class="pager" aria-label="Phân trang hình ảnh nhà máy">
            <button
              type="button"
              class="pager__btn"
              :disabled="isFirstPage"
              aria-label="Trang trước hình ảnh nhà máy"
              @click="prevPage"
            >
              <ChevronLeft :size="18" />
            </button>
            <span class="pager__status">{{ page + 1 }} / {{ totalPages }}</span>
            <button
              type="button"
              class="pager__btn"
              :disabled="isLastPage"
              aria-label="Trang tiếp theo hình ảnh nhà máy"
              @click="nextPage"
            >
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>

        <div class="grid">
          <HonorCard
            v-for="item in pagedItems"
            :key="`qualification-${item.id}`"
            :item="item"
            :image-src="imageResolver(item.image_url)"
            variant="gallery"
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
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(96deg, rgba(22, 15, 9, 0.94) 0%, rgba(63, 44, 26, 0.88) 42%, rgba(191, 167, 116, 0.68) 100%),
    url('https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg');
  background-size: cover;
  background-position: center right;
  filter: saturate(0.95);
}

.stage {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100% - 56px));
  margin: 0 auto;
}

.heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  align-items: end;
  margin-bottom: 30px;
}

.heading-copy {
  max-width: 760px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.heading h2 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 2rem + 1.5vw, 4.1rem);
  line-height: 1.05;
}

.heading p {
  margin: 14px 0 0;
  max-width: 700px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 16px;
  line-height: 1.75;
}

.heading-note {
  position: relative;
  display: grid;
  gap: 8px;
  min-width: 220px;
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(214, 168, 97, 0.16);
  background: rgba(17, 16, 19, 0.42);
  backdrop-filter: blur(14px);
  box-shadow: 0 22px 40px rgba(8, 7, 9, 0.18);
}

.heading-note::before {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  top: 14px;
  height: 1px;
  background: linear-gradient(90deg, rgba(214, 168, 97, 0.34), transparent);
}

.heading-note span {
  color: rgba(255, 227, 181, 0.72);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.heading-note strong {
  color: #fff8eb;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 42px;
  line-height: 1;
}

.heading-note p {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
}

.grid {
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: start;
}

.empty {
  color: rgba(255, 255, 255, 0.86);
  text-align: left;
  padding: 26px 0 6px;
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
    padding: 48px 0 34px;
  }

  .stage {
    width: calc(100% - 24px);
  }

  .heading p {
    font-size: 14px;
  }

  .heading-note {
    min-width: 0;
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
  color: rgba(255, 255, 255, 0.88);
}

.section-toolbar__summary strong {
  color: #fff8eb;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 28px;
  line-height: 1;
}

.section-toolbar__summary span {
  color: rgba(255, 255, 255, 0.72);
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
  border: 1px solid rgba(214, 168, 97, 0.22);
  background: rgba(17, 16, 19, 0.48);
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.pager__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(214, 168, 97, 0.42);
  background: rgba(117, 24, 16, 0.72);
}

.pager__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__status {
  min-width: 68px;
  text-align: center;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
</style>
