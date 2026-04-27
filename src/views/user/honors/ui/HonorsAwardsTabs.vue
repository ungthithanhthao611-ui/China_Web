<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import HonorCard from './HonorCard.vue'

const props = defineProps({
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
const corporatePage = ref(0)
const projectPage = ref(0)
const PAGE_SIZE = 6

const corporateTotalPages = computed(() => Math.max(1, Math.ceil(props.corporateItems.length / PAGE_SIZE)))
const projectTotalPages = computed(() => Math.max(1, Math.ceil(props.projectItems.length / PAGE_SIZE)))
const pagedCorporateItems = computed(() => {
  const startIndex = corporatePage.value * PAGE_SIZE
  return props.corporateItems.slice(startIndex, startIndex + PAGE_SIZE)
})
const pagedProjectItems = computed(() => {
  const startIndex = projectPage.value * PAGE_SIZE
  return props.projectItems.slice(startIndex, startIndex + PAGE_SIZE)
})
const showCorporatePagination = computed(() => props.corporateItems.length > PAGE_SIZE)
const showProjectPagination = computed(() => props.projectItems.length > PAGE_SIZE)
const isCorporateFirstPage = computed(() => corporatePage.value === 0)
const isCorporateLastPage = computed(() => corporatePage.value >= corporateTotalPages.value - 1)
const isProjectFirstPage = computed(() => projectPage.value === 0)
const isProjectLastPage = computed(() => projectPage.value >= projectTotalPages.value - 1)

function prevCorporatePage() {
  if (isCorporateFirstPage.value) return
  corporatePage.value -= 1
}

function nextCorporatePage() {
  if (isCorporateLastPage.value) return
  corporatePage.value += 1
}

function prevProjectPage() {
  if (isProjectFirstPage.value) return
  projectPage.value -= 1
}

function nextProjectPage() {
  if (isProjectLastPage.value) return
  projectPage.value += 1
}

watch(
  () => props.corporateItems,
  () => {
    corporatePage.value = 0
  },
  { deep: true },
)

watch(
  () => props.projectItems,
  () => {
    projectPage.value = 0
  },
  { deep: true },
)

watch(activeTab, () => {
  if (activeTab.value === 'corporate') {
    corporatePage.value = Math.min(corporatePage.value, corporateTotalPages.value - 1)
    return
  }

  projectPage.value = Math.min(projectPage.value, projectTotalPages.value - 1)
})
</script>

<template>
  <section id="page3b" class="section section-awards">
    <div class="section-bg"></div>
    <div class="stage">
      <header class="section-top">
        <div class="section-top__copy">
          <span class="eyebrow">CÔNG NGHỆ - CHỨNG NHẬN</span>
          <h2>Chứng nhận & Năng lực</h2>
          <p>
            Máy móc, quy trình sản xuất, công suất vận hành và các chứng chỉ ISO, CE theo tiêu chuẩn
            dự án được trình bày trong một giao diện đồng bộ.
          </p>
        </div>

        <div class="section-top__aside">
          <div class="tabs" role="tablist" aria-label="Honor awards tabs">
            <button
              type="button"
              :class="{ active: activeTab === 'corporate' }"
              role="tab"
              :aria-selected="activeTab === 'corporate'"
              @click="activeTab = 'corporate'"
            >
              Công nghệ sản xuất
            </button>
            <button
              type="button"
              :class="{ active: activeTab === 'project' }"
              role="tab"
              :aria-selected="activeTab === 'project'"
              @click="activeTab = 'project'"
            >
              ISO & CE
            </button>
          </div>
        </div>
      </header>

      <div v-if="activeTab === 'corporate'">
        <div v-if="!corporateItems.length" class="empty">Chưa có nội dung công nghệ sản xuất.</div>
        <template v-else>
          <div class="section-toolbar">
            <div class="section-toolbar__summary">
              <strong>{{ corporateItems.length }}</strong>
              <span>mục công nghệ sản xuất</span>
            </div>

            <div v-if="showCorporatePagination" class="pager" aria-label="Phân trang công nghệ sản xuất">
              <button
                type="button"
                class="pager__btn"
                :disabled="isCorporateFirstPage"
                aria-label="Trang trước công nghệ sản xuất"
                @click="prevCorporatePage"
              >
                <ChevronLeft :size="18" />
              </button>
              <span class="pager__status">{{ corporatePage + 1 }} / {{ corporateTotalPages }}</span>
              <button
                type="button"
                class="pager__btn"
                :disabled="isCorporateLastPage"
                aria-label="Trang tiếp theo công nghệ sản xuất"
                @click="nextCorporatePage"
              >
                <ChevronRight :size="18" />
              </button>
            </div>
          </div>

          <div class="grid">
            <HonorCard
              v-for="item in pagedCorporateItems"
              :key="`corporate-${item.id}`"
              :item="item"
              :image-src="imageResolver(item.image_url)"
              variant="frame"
            />
          </div>
        </template>
      </div>

      <div v-else>
        <div v-if="!projectItems.length" class="empty">Chưa có chứng nhận ISO & CE.</div>
        <template v-else>
          <div class="section-toolbar">
            <div class="section-toolbar__summary">
              <strong>{{ projectItems.length }}</strong>
              <span>chứng nhận ISO & CE</span>
            </div>

            <div v-if="showProjectPagination" class="pager" aria-label="Phân trang chứng nhận ISO và CE">
              <button
                type="button"
                class="pager__btn"
                :disabled="isProjectFirstPage"
                aria-label="Trang trước chứng nhận ISO và CE"
                @click="prevProjectPage"
              >
                <ChevronLeft :size="18" />
              </button>
              <span class="pager__status">{{ projectPage + 1 }} / {{ projectTotalPages }}</span>
              <button
                type="button"
                class="pager__btn"
                :disabled="isProjectLastPage"
                aria-label="Trang tiếp theo chứng nhận ISO và CE"
                @click="nextProjectPage"
              >
                <ChevronRight :size="18" />
              </button>
            </div>
          </div>

          <div class="grid">
            <HonorCard
              v-for="item in pagedProjectItems"
              :key="`project-${item.id}`"
              :item="item"
              :image-src="imageResolver(item.image_url)"
              variant="frame"
            />
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  position: relative;
  min-height: 100vh;
  padding: 72px 0 56px;
}

.section-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(96deg, rgba(22, 17, 11, 0.94) 0%, rgba(60, 48, 35, 0.88) 38%, rgba(164, 142, 105, 0.68) 100%),
    url('https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/ee391405-cb7a-4434-91fa-fcf427544b97.jpg');
  background-size: cover;
  background-position: center right;
  filter: saturate(0.92);
}

.stage {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100% - 56px));
  margin: 0 auto;
}

.section-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px 24px;
  align-items: end;
  margin-bottom: 24px;
}

.section-top__copy {
  max-width: 780px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.section-top h2 {
  margin: 0;
  color: #fff;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2.3rem, 1.9rem + 1.2vw, 3.5rem);
  line-height: 1.08;
}

.section-top p {
  margin: 14px 0 0;
  max-width: 680px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 16px;
  line-height: 1.72;
}

.section-top__aside {
  display: grid;
  gap: 14px;
}

.tabs {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.tabs button {
  min-width: 170px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid rgba(214, 168, 97, 0.16);
  background: rgba(17, 16, 19, 0.42);
  color: #fff;
  cursor: pointer;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.tabs button.active {
  background: linear-gradient(135deg, #751810, #c24726);
  border-color: transparent;
  box-shadow: 0 12px 28px rgba(114, 30, 17, 0.24);
}

.tabs button:hover {
  transform: translateY(-1px);
  border-color: rgba(214, 168, 97, 0.28);
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
  padding: 22px 0 6px;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .section-top {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .tabs {
    justify-content: flex-start;
  }
}

@media (max-width: 767px) {
  .section {
    padding: 48px 0 34px;
  }

  .stage {
    width: calc(100% - 24px);
  }

  .tabs button {
    width: 100%;
    min-width: 0;
  }

  .section-top p {
    font-size: 14px;
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
