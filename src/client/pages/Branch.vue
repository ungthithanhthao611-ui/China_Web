<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, ChevronUp, House, Mail, MapPin, Phone } from 'lucide-vue-next'
import AppFooter from '@/client/components/layout/AppFooter.vue'
import { getBranches } from '@/client/services/publicApi'
import { uiState } from '@/utils/uiState'

const route = useRoute()
const scrollContainer = ref(null)
const activeSection = ref('ctn1')
const animatedSections = ref(['ctn1'])
const currentPage = ref(1)
const branchItems = ref([])
const isLoading = ref(false)
const loadError = ref('')

const sections = [
  { id: 'ctn1', label: 'Hero' },
  { id: 'ctn2', label: 'Branch' },
  { id: 'ctn3', label: 'Footer' }
]

const contactTabs = [
  { name: 'Contact Us', path: '/contact#ctn2' },
  { name: 'Subsidiary', path: '/subsidiary#ctn2' },
  { name: 'Branch', path: '/branch#ctn2' },
  { name: 'Join Us', path: '/join-us' }
]

const pageSize = 4
const fallbackCardImage =
  'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/2ddb4565-35a5-4189-ba49-dab4432c21d1.jpg'

const totalPages = computed(() => Math.max(1, Math.ceil(branchItems.value.length / pageSize)))

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return branchItems.value.slice(start, start + pageSize)
})

const hasItems = computed(() => branchItems.value.length > 0)

const cardDelay = (index) => ({
  transitionDelay: `${120 + index * 90}ms`
})

const formatAddress = (item) => {
  if (item.address) return item.address
  return [item.city, item.region].filter(Boolean).join(', ')
}

const resolveImage = (item) => item.image?.url || item.hero_image?.url || fallbackCardImage

const buildDetailRoute = (slug) => ({
  name: 'SubsidiaryDetail',
  params: { slug }
})

const markAnimated = (id) => {
  if (!animatedSections.value.includes(id)) {
    animatedSections.value = [...animatedSections.value, id]
  }
}

const syncActiveByScroll = () => {
  const container = scrollContainer.value

  if (!container) return

  const scrollCenter = container.scrollTop + container.clientHeight * 0.38

  sections.forEach((section) => {
    const element = document.getElementById(section.id)

    if (!element) return

    const top = element.offsetTop
    const bottom = top + element.offsetHeight

    if (scrollCenter >= top && scrollCenter < bottom) {
      activeSection.value = section.id
    }

    if (container.scrollTop + container.clientHeight * 0.8 >= top) {
      markAnimated(section.id)
    }
  })
}

const scrollToSection = (id) => {
  const container = scrollContainer.value
  const target = document.getElementById(id)

  if (!container || !target) return

  container.scrollTo({
    top: target.offsetTop,
    behavior: 'smooth'
  })

  window.history.replaceState(null, '', `/branch#${id}`)
}

const goToPage = async (page, sectionId = 'ctn2') => {
  if (page < 1 || page > totalPages.value) return

  currentPage.value = page
  await nextTick()
  scrollToSection(sectionId)
}

const syncHashSection = async () => {
  await nextTick()

  const hash = route.hash?.replace('#', '')

  if (hash && sections.some((item) => item.id === hash)) {
    scrollToSection(hash)
    return
  }

  scrollToSection('ctn1')
}

async function loadBranchItems() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await getBranches({ branchType: 'branch' })
    branchItems.value = Array.isArray(response?.items) ? response.items : []
    currentPage.value = 1
  } catch (error) {
    branchItems.value = []
    loadError.value = error.message || 'Failed to load branch data.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => route.hash,
  () => {
    syncHashSection()
  }
)

watch(
  activeSection,
  (value) => {
    uiState.isHeaderHidden = value !== 'ctn1'
    uiState.isHeaderHovered = false
    uiState.isFooterHidden = true
    window.history.replaceState(null, '', `/branch#${value}`)
  },
  { immediate: true }
)

watch(totalPages, (value) => {
  if (currentPage.value > value) {
    currentPage.value = value
  }
})

onMounted(async () => {
  uiState.isFooterHidden = true
  uiState.isHeaderHidden = false
  await loadBranchItems()
  syncActiveByScroll()
  syncHashSection()
  scrollContainer.value?.addEventListener('scroll', syncActiveByScroll, { passive: true })
  window.addEventListener('resize', syncActiveByScroll)
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', syncActiveByScroll)
  window.removeEventListener('resize', syncActiveByScroll)
  uiState.isHeaderHidden = false
  uiState.isHeaderHovered = false
  uiState.isFooterHidden = false
})
</script>

<template>
  <div class="subsidiary-clone">
    <aside class="subsidiary-dots" aria-label="Section navigation">
      <button
        v-for="(item, index) in sections"
        :id="`branch-dot-${index}`"
        :key="item.id"
        class="subsidiary-dots__item"
        :class="{ active: activeSection === item.id }"
        type="button"
        :aria-label="`Go to ${item.label}`"
        @click="scrollToSection(item.id)"
      >
        <span></span>
      </button>
    </aside>

    <div ref="scrollContainer" class="subsidiary-scroll">
      <section id="ctn1" class="subsidiary-section subsidiary-hero">
        <picture class="subsidiary-hero__media">
          <source
            srcset="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd02907e-9924-4cb1-8464-14da86e29ba9.jpeg"
            media="(max-width: 767px)"
          />
          <img
            src="https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/2d74b3e3-5b31-406a-a3a4-febd62eddcf0.jpg"
            alt="Contact Us"
          />
        </picture>

        <div class="subsidiary-hero__shade"></div>

        <div class="subsidiary-tabbar">
          <div class="subsidiary-tabbar__inner">
            <router-link
              v-for="tab in contactTabs"
              :key="tab.name"
              :to="tab.path"
              class="subsidiary-tabbar__item"
              :class="{ active: tab.name === 'Branch' }"
            >
              {{ tab.name }}
            </router-link>
          </div>
        </div>

        <div class="subsidiary-hero__content" :class="{ 'is-visible': animatedSections.includes('ctn1') }">
          <div class="subsidiary-hero__title">
            <div class="fnt-hero">CONTACT US</div>
            <img
              src="https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png"
              alt="Accent"
            />
          </div>
          <div class="subsidiary-hero__line"></div>
          <div class="subsidiary-hero__subtitle">Work together to win the future</div>
        </div>
      </section>

      <section id="ctn2" class="subsidiary-section subsidiary-list-section">
        <div class="subsidiary-list-shell" :class="{ 'is-visible': animatedSections.includes('ctn2') }">
          <div class="subsidiary-tab" :class="{ on: activeSection !== 'ctn1' }">
            <div class="subsidiary-tab__inner">
              <router-link
                v-for="tab in contactTabs"
                :key="`section-tab-${tab.name}`"
                :to="tab.path"
                class="subsidiary-tab__item"
                :class="{ on: tab.name === 'Branch' }"
              >
                {{ tab.name }}
              </router-link>
            </div>
          </div>

          <div class="subsidiary-breadcrumb">
            <House :size="15" class="subsidiary-breadcrumb__home" />
            <a href="/">Home</a>
            <ChevronRight :size="14" />
            <a href="/contact">Contact Us</a>
            <ChevronRight :size="14" />
            <span class="active">Branch</span>
          </div>

          <header class="subsidiary-heading">
            <div class="subsidiary-heading__title">
              <h2>BRANCH</h2>
              <img
                src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
                alt="Accent"
              />
            </div>
            <div class="subsidiary-heading__line"></div>
          </header>

          <div v-if="isLoading" class="subsidiary-feedback">Loading branch data...</div>
          <div v-else-if="loadError" class="subsidiary-feedback subsidiary-feedback--error">{{ loadError }}</div>
          <div v-else-if="!hasItems" class="subsidiary-feedback">No branch data available.</div>

          <ul v-else class="subsidiary-grid">
            <li
              v-for="(item, index) in pagedItems"
              :key="item.id"
              class="subsidiary-card"
              :style="cardDelay(index)"
            >
              <div class="subsidiary-card__content">
                <div class="subsidiary-card__content-top">
                  <h3>{{ item.name }}</h3>
                  <div class="subsidiary-card__rule"></div>

                  <div class="subsidiary-card__detail">
                    <MapPin :size="20" />
                    <span>Add: {{ formatAddress(item) || 'Updating...' }}</span>
                  </div>

                  <div class="subsidiary-card__detail">
                    <Phone :size="19" />
                    <span>Tel: {{ item.phone || 'Updating...' }}</span>
                  </div>

                  <div class="subsidiary-card__detail">
                    <Mail :size="20" />
                    <span>E-mail: {{ item.email || 'Updating...' }}</span>
                  </div>
                </div>

                <router-link
                  v-if="item.slug"
                  class="subsidiary-card__more"
                  :to="buildDetailRoute(item.slug)"
                >
                  <span>More</span>
                  <ChevronRight :size="18" />
                </router-link>
              </div>

              <div class="subsidiary-card__media">
                <div class="subsidiary-card__media-frame">
                  <img :src="resolveImage(item)" :alt="item.name" loading="lazy" />
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section id="ctn3" class="subsidiary-section subsidiary-footer-section">
        <div class="subsidiary-footer-top">
          <div class="subsidiary-footer-top__pattern"></div>

          <div class="subsidiary-pagination subsidiary-pagination--footer">
            <button
              class="subsidiary-pagination__button"
              :class="{ disabled: currentPage === 1 }"
              type="button"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1, 'ctn2')"
            >
              <ChevronLeft :size="18" />
            </button>

            <button
              v-for="page in totalPages"
              :key="`footer-page-${page}`"
              class="subsidiary-pagination__button subsidiary-pagination__button--page"
              :class="{ active: currentPage === page }"
              type="button"
              @click="goToPage(page, 'ctn2')"
            >
              {{ page }}
            </button>

            <button
              class="subsidiary-pagination__button"
              :class="{ disabled: currentPage === totalPages }"
              type="button"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1, 'ctn2')"
            >
              <ChevronRight :size="18" />
            </button>
          </div>
        </div>

        <div class="subsidiary-footer-wrapper" :class="{ 'is-visible': animatedSections.includes('ctn3') }">
          <AppFooter />
        </div>
      </section>
    </div>

    <button
      class="subsidiary-backtop"
      :class="{ visible: activeSection !== 'ctn1' }"
      type="button"
      aria-label="Back to top"
      @click="scrollToSection('ctn1')"
    >
      <ChevronUp :size="18" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.subsidiary-clone {
  position: relative;
  background: #f5f1ea;
}

.subsidiary-scroll {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.subsidiary-scroll::-webkit-scrollbar {
  width: 0;
}

.subsidiary-section {
  position: relative;
  scroll-snap-align: start;
}

.subsidiary-dots {
  position: fixed;
  right: 10px;
  top: 50%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transform: translateY(-50%);
}

.subsidiary-dots__item {
  width: 14px;
  height: 14px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.subsidiary-dots__item span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(213, 0, 17, 0.7);
  transition: transform 0.25s ease, background 0.25s ease;
}

.subsidiary-dots__item.active span,
.subsidiary-dots__item:hover span {
  transform: scale(2.3);
  background: #e70012;
}

.subsidiary-hero {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.subsidiary-hero__media,
.subsidiary-hero__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.subsidiary-hero__media img {
  object-fit: cover;
}

.subsidiary-hero__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(16, 29, 53, 0.42) 0%, rgba(16, 29, 53, 0.16) 44%, rgba(16, 29, 53, 0.08) 100%);
}

.subsidiary-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 0 36px;
}

.subsidiary-tabbar__inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: rgba(23, 35, 58, 0.84);
}

.subsidiary-tabbar__item {
  position: relative;
  min-height: 120px;
  display: grid;
  place-items: center;
  color: #efc392;
  text-decoration: none;
  font-size: 1rem;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.subsidiary-tabbar__item:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 22px;
  background: rgba(239, 195, 146, 0.88);
  transform: translateY(-50%);
}

.subsidiary-tabbar__item.active,
.subsidiary-tabbar__item:hover {
  background: #f1000c;
  color: #ffffff;
}

.subsidiary-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  margin: 136px 0 170px;
  text-align: left;
  opacity: 0;
  transform: translateY(42px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.subsidiary-hero__content.is-visible,
.subsidiary-list-shell.is-visible,
.subsidiary-footer-wrapper.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.subsidiary-hero__title {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-left: clamp(160px, 10vw, 190px);
  margin-bottom: 18px;
}

.fnt-hero {
  color: #ffffff;
  font-family: 'Times New Roman', serif;
  font-size: clamp(3.8rem, 3rem + 1.8vw, 4.75rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.subsidiary-hero__title img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.subsidiary-hero__line {
  position: relative;
  width: min(840px, 62vw);
  height: 1px;
  background: #d7000f;
}

.subsidiary-hero__line::before,
.subsidiary-hero__line::after,
.subsidiary-heading__line::before,
.subsidiary-heading__line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #d7000f;
  transform: translateY(-50%);
}

.subsidiary-hero__line::before,
.subsidiary-heading__line::before {
  left: -1px;
}

.subsidiary-hero__line::after,
.subsidiary-heading__line::after {
  right: -1px;
}

.subsidiary-hero__subtitle {
  margin-top: 68px;
  margin-left: clamp(160px, 10vw, 190px);
  color: #ffffff;
  font-size: 30px;
  letter-spacing: 0;
}

.subsidiary-list-section {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(247, 243, 237, 0.98) 0%, rgba(255, 255, 255, 0.99) 38%, rgba(245, 240, 233, 0.98) 100%),
    #f8f4ee;
}

.subsidiary-list-section::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 320px;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(228, 220, 210, 0.52) 0%, rgba(228, 220, 210, 0.12) 34%, rgba(228, 220, 210, 0) 64%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.64) 0%, rgba(255, 255, 255, 0) 100%);
  clip-path: polygon(0 0, 58% 0, 100% 100%, 0 100%);
}

.subsidiary-list-section::after {
  content: '';
  position: absolute;
  right: 18px;
  top: 104px;
  width: min(620px, 42vw);
  height: min(620px, 42vw);
  background: url('https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png')
    center / contain no-repeat;
  opacity: 0.14;
  filter: grayscale(1) brightness(2.15) contrast(0.42);
  pointer-events: none;
}

.subsidiary-list-shell {
  position: relative;
  z-index: 2;
  width: min(1600px, calc(100% - 72px));
  margin: 0 auto;
  padding: 18px 0 56px;
  opacity: 0;
  transform: translateY(42px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.subsidiary-tab {
  position: sticky;
  top: 0;
  z-index: 8;
  margin-top: -18px;
  margin-bottom: 10px;
  padding-top: 10px;
  transition: background-color 0.35s ease, box-shadow 0.35s ease;
}

.subsidiary-tab.on {
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  box-shadow: 0 10px 28px rgba(52, 47, 44, 0.08);
}

.subsidiary-tab__inner {
  display: flex;
  align-items: center;
  gap: 0;
  width: min(1600px, 100%);
  margin: 0 auto;
}

.subsidiary-tab__item {
  position: relative;
  min-width: 172px;
  padding: 18px 34px 17px;
  color: #746d67;
  text-decoration: none;
  font-size: 18px;
  line-height: 1;
  text-align: center;
  transition: color 0.25s ease, background-color 0.25s ease;
}

.subsidiary-tab__item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: transparent;
  transition: background-color 0.25s ease;
}

.subsidiary-tab__item.on,
.subsidiary-tab__item:hover {
  color: #ffffff;
  background: #d7000f;
}

.subsidiary-tab__item.on::after,
.subsidiary-tab__item:hover::after {
  background: #d7000f;
}

.subsidiary-breadcrumb {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 0 0;
  color: #74706a;
  font-size: 17px;
}

.subsidiary-breadcrumb a {
  color: inherit;
  text-decoration: none;
  transition: color 0.25s ease;
}

.subsidiary-breadcrumb a:hover {
  color: #d7000f;
}

.subsidiary-breadcrumb__home {
  color: #8f8b86;
}

.subsidiary-breadcrumb .active {
  color: #d7000f;
}

.subsidiary-heading {
  display: grid;
  justify-items: center;
  margin-top: 38px;
}

.subsidiary-heading__title {
  display: flex;
  align-items: center;
  gap: 22px;
}

.subsidiary-heading__title h2 {
  margin: 0;
  color: #2d2a2b;
  font-family: 'Times New Roman', serif;
  font-size: clamp(3rem, 2.5rem + 0.9vw, 3.85rem);
  line-height: 1;
}

.subsidiary-heading__title img {
  width: 48px;
  height: 48px;
}

.subsidiary-heading__line {
  position: relative;
  width: min(460px, 72vw);
  height: 1px;
  margin-top: 22px;
  background: #d7000f;
}

.subsidiary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 54px 56px;
  margin-top: 38px;
  padding: 0;
  list-style: none;
}

.subsidiary-feedback {
  margin-top: 34px;
  padding: 18px 20px;
  border: 1px solid rgba(25, 55, 90, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  color: #23354d;
  font-size: 16px;
}

.subsidiary-feedback--error {
  color: #ab243c;
  border-color: rgba(171, 36, 60, 0.16);
  background: rgba(255, 241, 243, 0.88);
}

.subsidiary-card {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: stretch;
  min-height: 416px;
  border: 1px solid rgba(197, 197, 197, 0.72);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 34px rgba(119, 101, 84, 0.08);
  overflow: hidden;
  opacity: 0;
  transform: translateY(40px);
  transition:
    opacity 0.65s ease,
    transform 0.65s ease,
    box-shadow 0.3s ease;
}

.subsidiary-list-shell.is-visible .subsidiary-card {
  opacity: 1;
  transform: translateY(0);
}

.subsidiary-card:hover {
  box-shadow: 0 22px 42px rgba(119, 101, 84, 0.12);
}

.subsidiary-card::before {
  content: '';
  position: absolute;
  left: 18px;
  top: -2px;
  bottom: -2px;
  width: 31px;
  border-radius: 22px;
  background: linear-gradient(180deg, #e30017 0%, #b40014 100%);
  transform: skewX(-9.2deg);
}

.subsidiary-card__content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1 1 auto;
  min-width: 0;
  padding: 42px 24px 38px 118px;
}

.subsidiary-card__content-top {
  width: 100%;
  min-width: 0;
}

.subsidiary-card__content h3 {
  margin: 0;
  width: 100%;
  color: #2d2a2b;
  font-family: 'Times New Roman', serif;
  font-size: clamp(25px, 1.18vw, 28px);
  font-weight: 400;
  line-height: 1.18;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subsidiary-card__rule {
  position: relative;
  width: min(100%, 460px);
  height: 1px;
  margin: 28px 0 12px;
  background: rgba(202, 202, 202, 0.86);
}

.subsidiary-card__rule::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: min(130px, 34%);
  height: 2px;
  background: #db0016;
  transform: translateY(-50%);
}

.subsidiary-card__detail {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  width: 100%;
  color: #72665c;
  font-size: 17px;
  line-height: 1.55;
}

.subsidiary-card__detail span {
  display: block;
  max-width: 100%;
}

.subsidiary-card__detail svg {
  flex-shrink: 0;
  margin-top: 5px;
  color: #d0b799;
}

.subsidiary-card__more {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  align-self: flex-start;
  margin-top: 26px;
  padding: 14px 22px;
  border-radius: 8px;
  background: #c8ab87;
  color: #ffffff;
  text-decoration: none;
  font-size: 18px;
  transition: background-color 0.25s ease, transform 0.25s ease;
}

.subsidiary-card__more:hover {
  background: #b9996f;
  transform: translateY(-1px);
}

.subsidiary-card__media {
  display: flex;
  flex: 0 0 260px;
  justify-content: center;
  align-items: flex-start;
  padding: 38px 34px 0 0;
}

.subsidiary-card__media-frame {
  width: 220px;
  height: 200px;
  overflow: hidden;
  background: #ffffff;
}

.subsidiary-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.subsidiary-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.subsidiary-pagination--section {
  margin-top: 16px;
}

.subsidiary-pagination--footer {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding-top: 18px;
}

.subsidiary-pagination__button {
  min-width: 42px;
  height: 42px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #7b7b7b;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 0.25s ease, background-color 0.25s ease;
}

.subsidiary-pagination__button--page {
  min-width: 34px;
  font-size: 24px;
  font-family: 'Arial', sans-serif;
  line-height: 1;
}

.subsidiary-pagination__button.active,
.subsidiary-pagination__button:hover:not(.disabled) {
  background: transparent;
  color: #e60012;
}

.subsidiary-pagination__button.disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.subsidiary-footer-section {
  background: #f8f4ee;
}

.subsidiary-footer-top {
  position: relative;
  min-height: 180px;
  padding: 78px 0 40px;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(245, 241, 234, 0.98) 0%, rgba(255, 255, 255, 0.98) 48%, rgba(235, 235, 235, 0.92) 100%),
    #f7f4ef;
}

.subsidiary-footer-top::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  background: #df0d1b;
}

.subsidiary-footer-top__pattern {
  position: absolute;
  right: 0;
  top: 0;
  width: min(260px, 22vw);
  height: 100%;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.08) 100%),
    url('/images/nendo.jpeg') center / cover no-repeat;
  border-top-right-radius: 12px;
  opacity: 0.96;
}

.subsidiary-footer-wrapper {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.subsidiary-footer-wrapper :deep(.footer.is-hidden) {
  display: block !important;
}

.subsidiary-backtop {
  position: fixed;
  right: 12px;
  bottom: 18px;
  z-index: 35;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(31, 38, 51, 0.92);
  color: #ffffff;
  cursor: pointer;
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease;
}

.subsidiary-backtop.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.subsidiary-backtop:hover {
  background: #c9a37d;
}

@media (max-width: 1366px) {
  .subsidiary-list-shell {
    width: min(1480px, calc(100% - 40px));
  }

  .subsidiary-card__content {
    padding-left: 102px;
  }

  .subsidiary-card__media {
    flex-basis: 232px;
    padding-right: 24px;
  }

  .subsidiary-card__media-frame {
    width: 194px;
    height: 176px;
  }

  .subsidiary-card__content h3 {
    font-size: 24px;
  }
}

@media (max-width: 1199px) {
  .subsidiary-grid {
    grid-template-columns: 1fr;
    gap: 26px;
  }

  .subsidiary-tab__inner {
    overflow-x: auto;
  }

  .subsidiary-tab__item {
    min-width: 156px;
  }

  .subsidiary-card {
    min-height: auto;
  }

  .subsidiary-card__content {
    padding-right: 18px;
  }

  .subsidiary-card__media {
    flex-basis: 214px;
    padding-right: 18px;
  }

  .subsidiary-card__media-frame {
    height: 170px;
  }
}

@media (max-width: 767px) {
  .subsidiary-scroll {
    height: auto;
    overflow: visible;
    scroll-snap-type: none;
  }

  .subsidiary-dots {
    display: none;
  }

  .subsidiary-hero {
    min-height: 92vh;
  }

  .subsidiary-tabbar {
    padding: 0 8px;
  }

  .subsidiary-tabbar__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subsidiary-tabbar__item {
    min-height: 62px;
    font-size: 14px;
  }

  .subsidiary-hero__content {
    margin: 116px 0 104px;
  }

  .subsidiary-hero__title {
    gap: 12px;
    margin-left: 12px;
  }

  .fnt-hero {
    font-size: 2.55rem;
  }

  .subsidiary-hero__title img {
    width: 34px;
    height: 34px;
  }

  .subsidiary-hero__line {
    width: min(360px, 92vw);
  }

  .subsidiary-hero__subtitle {
    margin-top: 28px;
    margin-left: 12px;
    font-size: 16px;
  }

  .subsidiary-list-shell {
    width: calc(100% - 20px);
    padding: 8px 0 42px;
  }

  .subsidiary-tab {
    margin-top: -8px;
    margin-bottom: 0;
    padding-top: 8px;
  }

  .subsidiary-tab__inner {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .subsidiary-tab__inner::-webkit-scrollbar {
    display: none;
  }

  .subsidiary-tab__item {
    min-width: 132px;
    padding: 14px 18px;
    font-size: 14px;
  }

  .subsidiary-breadcrumb {
    font-size: 12px;
    gap: 6px;
    padding-top: 14px;
  }

  .subsidiary-heading {
    margin-top: 24px;
  }

  .subsidiary-heading__title {
    gap: 10px;
  }

  .subsidiary-heading__title h2 {
    font-size: 2.25rem;
  }

  .subsidiary-heading__title img {
    width: 32px;
    height: 32px;
  }

  .subsidiary-heading__line {
    width: min(250px, 76vw);
  }

  .subsidiary-grid {
    margin-top: 20px;
    gap: 18px;
  }

  .subsidiary-card {
    flex-direction: column-reverse;
    min-height: 0;
    border-radius: 22px;
  }

  .subsidiary-card::before {
    left: 12px;
    width: 18px;
  }

  .subsidiary-card__content {
    padding: 0 18px 22px 72px;
  }

  .subsidiary-card__content h3 {
    font-size: 20px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .subsidiary-card__rule {
    width: 100%;
    margin: 18px 0 14px;
  }

  .subsidiary-card__rule::before {
    width: min(128px, 38%);
  }

  .subsidiary-card__detail {
    font-size: 14px;
    margin-top: 10px;
  }

  .subsidiary-card__media {
    flex-basis: auto;
    width: 100%;
    padding: 20px 18px 0 72px;
    justify-content: stretch;
  }

  .subsidiary-card__media-frame {
    width: 100%;
    height: 220px;
  }

  .subsidiary-card__media img {
    width: 100%;
    height: 100%;
  }

  .subsidiary-card__more {
    margin-top: 18px;
    padding: 12px 18px;
    font-size: 16px;
  }

  .subsidiary-pagination {
    gap: 10px;
  }

  .subsidiary-pagination__button {
    width: 40px;
    height: 40px;
  }

  .subsidiary-pagination__button--page {
    font-size: 21px;
  }

  .subsidiary-footer-top {
    min-height: 140px;
    padding: 46px 0 28px;
  }

  .subsidiary-footer-top__pattern {
    width: 120px;
  }
}
</style>


