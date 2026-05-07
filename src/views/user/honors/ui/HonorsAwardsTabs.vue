<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import HonorCard from './HonorCard.vue'

const { t } = useI18n()

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
  <section id="page3" class="section section-awards">
    <div class="section-bg"></div>
    <div class="stage">
      <header class="section-top reveal-item">
        <div class="section-top__copy">
          <span class="eyebrow">{{ t('user.capability.techTitle') }}</span>
          <h2>{{ t('user.capability.honorsAwards') }}</h2>
          <p>
            {{ t('user.capability.honorsAwardsDesc') || 'Máy móc, quy trình sản xuất, công suất vận hành và các chứng chỉ ISO, CE.' }}
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
              {{ t('user.capability.techTitle') }}
            </button>
            <button
              type="button"
              :class="{ active: activeTab === 'project' }"
              role="tab"
              :aria-selected="activeTab === 'project'"
              @click="activeTab = 'project'"
            >
              {{ t('user.capability.certifications') || 'ISO & CE' }}
            </button>
          </div>
        </div>
      </header>

      <div v-if="activeTab === 'corporate'">
        <div v-if="!corporateItems.length" class="empty">{{ t('user.capability.emptyGallery') || 'Chưa có nội dung công nghệ sản xuất.' }}</div>
        <template v-else>
          <div class="section-toolbar">
            <div class="section-toolbar__summary">
              <strong>{{ corporateItems.length }}</strong>
              <span>{{ t('user.capability.itemsCount') }} {{ t('user.capability.techTitle').toLowerCase() }}</span>
            </div>

            <div v-if="showCorporatePagination" class="pager" aria-label="Phân trang công nghệ sản xuất">
              <button
                type="button"
                class="pager__btn"
                :disabled="isCorporateFirstPage"
                :aria-label="t('user.capability.prevPageTechnology')"
                @click="prevCorporatePage"
              >
                <ChevronLeft :size="18" />
              </button>
              <span class="pager__status">{{ corporatePage + 1 }} / {{ corporateTotalPages }}</span>
              <button
                type="button"
                class="pager__btn"
                :disabled="isCorporateLastPage"
                :aria-label="t('user.capability.nextPageTechnology')"
                @click="nextCorporatePage"
              >
                <ChevronRight :size="18" />
              </button>
            </div>
          </div>

          <div class="grid">
            <HonorCard
              v-for="(item, index) in pagedCorporateItems"
              :key="`corporate-${item.id}`"
              :item="item"
              :image-src="imageResolver(item.image_url || item.image)"
              variant="frame"
              class="reveal-item"
              :style="{ '--i': index }"
            />
          </div>
        </template>
      </div>

      <div v-else>
        <div v-if="!projectItems.length" class="empty">{{ t('user.capability.emptyCertifications') }}</div>
        <template v-else>
          <div class="section-toolbar">
            <div class="section-toolbar__summary">
              <strong>{{ projectItems.length }}</strong>
              <span>{{ t('user.capability.certifications') }}</span>
            </div>

            <div v-if="showProjectPagination" class="pager" :aria-label="t('user.capability.paginationCertifications')">
              <button
                type="button"
                class="pager__btn"
                :disabled="isProjectFirstPage"
                :aria-label="t('user.capability.prevPageCertifications')"
                @click="prevProjectPage"
              >
                <ChevronLeft :size="18" />
              </button>
              <span class="pager__status">{{ projectPage + 1 }} / {{ projectTotalPages }}</span>
              <button
                type="button"
                class="pager__btn"
                :disabled="isProjectLastPage"
                :aria-label="t('user.capability.nextPageCertifications')"
                @click="nextProjectPage"
              >
                <ChevronRight :size="18" />
              </button>
            </div>
          </div>

          <div class="grid">
            <HonorCard
              v-for="(item, index) in pagedProjectItems"
              :key="`project-${item.id}`"
              :item="item"
              :image-src="imageResolver(item.image_url || item.image)"
              variant="frame"
              class="reveal-item"
              :style="{ '--i': index }"
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
  display: none;
}

.stage {
  position: relative;
  z-index: 1;
  width: min(1080px, calc(100% - 44px));
  margin: 0 auto;
}

.section-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px 16px;
  align-items: end;
  margin-bottom: 16px;
}

.section-top__copy {
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

.section-top h2 {
  margin: 0;
  color: #0f172a;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.7rem, 1.45rem + 0.8vw, 2.45rem);
  line-height: 1.1;
}

.section-top p {
  margin: 8px 0 0;
  max-width: 560px;
  color: #475569;
  font-size: 13px;
  line-height: 1.58;
}

.section-top__aside {
  display: grid;
  gap: 10px;
}

.tabs {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.tabs button {
  min-width: 132px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  cursor: pointer;
  border-radius: 999px;
  backdrop-filter: blur(10px);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.01em;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.tabs button.active {
  background: linear-gradient(135deg, #dc2626, #f97316);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 8px 18px rgba(220, 38, 38, 0.14);
}

.tabs button:hover {
  transform: translateY(-1px);
  border-color: rgba(239, 68, 68, 0.18);
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
  padding: 14px 0 2px;
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
    padding: 40px 0 28px;
  }

  .stage {
    width: calc(100% - 16px);
  }

  .tabs button {
    width: 100%;
    min-width: 0;
  }

  .section-top p {
    font-size: 12px;
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

.is-active .section-top.reveal-item {
  transition-delay: 0.1s;
}
</style>
