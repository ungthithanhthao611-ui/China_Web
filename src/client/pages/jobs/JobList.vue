<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BriefcaseBusiness,
  ChevronRight,
  ChevronUp,
  House,
  Mail,
  PhoneCall,
  UserRound
} from 'lucide-vue-next'
import AppFooter from '@/client/components/layout/AppFooter.vue'
import { uiState } from '@/utils/uiState'

const route = useRoute()
const router = useRouter()
const scrollContainer = ref(null)
const activeSection = ref('ctn1')
const animatedSections = ref(['ctn1'])
const currentPage = ref(1)

const sections = [
  { id: 'ctn1', label: 'Hero' },
  { id: 'ctn2', label: 'Join Us' }
]

const contactTabs = [
  { name: 'Contact Us', path: '/contact#ctn2' },
  { name: 'Subsidiary', path: '/subsidiary#ctn2' },
  { name: 'Branch', path: '/branch' },
  { name: 'Join Us', path: '/join-us' }
]

const recruitmentTabs = [
  { key: 'social', label: 'Social Recruitment' },
  { key: 'campus', label: 'Campus Recruitment' }
]

const jobGroups = {
  social: [
    {
      id: 1,
      title: 'Qualified management specialist',
      releaseDate: '2023-09-14',
      education: 'Junior college',
      age: 'Over 28 years old',
      experience: '5-10Y',
      location: 'Beijing',
      gender: 'Unlimited',
      count: '1person',
      workNature: 'Full-time',
      department: 'Operations Management Center',
      applyUrl: 'https://www.zhaopin.com/companydetail/CZ396099720.'
    }
  ],
  campus: [
    {
      id: 2,
      title: 'Campus deepening designer',
      releaseDate: '2023-04-08',
      education: 'Undergraduate',
      age: 'Over 28 years old',
      experience: '3-4Y',
      location: 'Shanghai',
      gender: 'Male',
      count: '3person',
      workNature: 'Full-time',
      department: 'Design Department',
      applyUrl: 'mailto:hr@chinadecor.com?subject=Campus%20Recruitment%20-%20Campus%20deepening%20designer'
    }
  ]
}

const filterOptions = {
  social: {
    position: ['All', 'Qualified management specialist'],
    department: ['All', 'Operations Management Center'],
    releaseDate: ['All', '2023-09-14'],
    address: ['All', 'Beijing']
  },
  campus: {
    position: ['All', 'Campus deepening designer'],
    department: ['All', 'Design Department'],
    releaseDate: ['All', '2023-04-08'],
    address: ['All', 'Shanghai']
  }
}

const filters = ref({
  position: 'All',
  department: 'All',
  releaseDate: 'All',
  address: 'All'
})

const activeRecruitmentTab = computed(() => {
  const tab = route.query.tab
  return tab === 'campus' ? 'campus' : 'social'
})

const resetFilters = () => {
  filters.value = {
    position: 'All',
    department: 'All',
    releaseDate: 'All',
    address: 'All'
  }
}

const currentFilterOptions = computed(() => filterOptions[activeRecruitmentTab.value])

const allJobs = computed(() => jobGroups[activeRecruitmentTab.value] ?? [])

const filteredJobs = computed(() =>
  allJobs.value.filter((job) => {
    const matchPosition =
      filters.value.position === 'All' || job.title === filters.value.position
    const matchDepartment =
      filters.value.department === 'All' || job.department === filters.value.department
    const matchReleaseDate =
      filters.value.releaseDate === 'All' || job.releaseDate === filters.value.releaseDate
    const matchAddress =
      filters.value.address === 'All' || job.location === filters.value.address

    return matchPosition && matchDepartment && matchReleaseDate && matchAddress
  })
)

const pageSize = 1

const totalPages = computed(() => Math.max(1, Math.ceil(filteredJobs.value.length / pageSize)))

const pagedJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredJobs.value.slice(start, start + pageSize)
})

const activeConditions = computed(() =>
  Object.entries(filters.value)
    .filter(([, value]) => value !== 'All')
    .map(([key, value]) => ({
      key,
      label:
        key === 'position'
          ? 'Position'
          : key === 'department'
            ? 'Department'
            : key === 'releaseDate'
              ? 'Release Date'
              : 'Address',
      value
    }))
)

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

    if (container.scrollTop + container.clientHeight * 0.82 >= top) {
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

  const query = { ...route.query }
  window.history.replaceState(null, '', `${route.path}?${new URLSearchParams(query).toString()}#${id}`)
}

const goToPage = async (page, sectionId = 'ctn2') => {
  if (page < 1 || page > totalPages.value) return

  currentPage.value = page
  await nextTick()
  scrollToSection(sectionId)
}

const setRecruitmentTab = async (tabKey) => {
  await router.replace({
    path: '/join-us',
    query: { ...route.query, tab: tabKey },
    hash: '#ctn2'
  })
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

watch(
  () => route.hash,
  () => {
    syncHashSection()
  }
)

watch(
  () => route.query.tab,
  () => {
    currentPage.value = 1
    resetFilters()
  },
  { immediate: true }
)

watch(
  filteredJobs,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  },
  { immediate: true }
)

watch(
  activeSection,
  (value) => {
    uiState.isHeaderHidden = value !== 'ctn1'
    uiState.isHeaderHovered = false
    uiState.isFooterHidden = true

    const query = { ...route.query }
    window.history.replaceState(null, '', `${route.path}?${new URLSearchParams(query).toString()}#${value}`)
  },
  { immediate: true }
)

onMounted(() => {
  uiState.isFooterHidden = true
  uiState.isHeaderHidden = false
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
  <div class="joinus-clone">
    <aside class="joinus-dots" aria-label="Section navigation">
      <button
        v-for="(item, index) in sections"
        :id="`joinus-dot-${index}`"
        :key="item.id"
        class="joinus-dots__item"
        :class="{ active: activeSection === item.id }"
        type="button"
        :aria-label="`Go to ${item.label}`"
        @click="scrollToSection(item.id)"
      >
        <span></span>
      </button>
    </aside>

    <div ref="scrollContainer" class="joinus-scroll">
      <section id="ctn1" class="joinus-section joinus-hero">
        <picture class="joinus-hero__media">
          <source
            srcset="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd02907e-9924-4cb1-8464-14da86e29ba9.jpeg"
            media="(max-width: 767px)"
          />
          <img
            src="https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/2d74b3e3-5b31-406a-a3a4-febd62eddcf0.jpg"
            alt="Join Us"
          />
        </picture>

        <div class="joinus-hero__shade"></div>

        <div class="joinus-tabbar">
          <div class="joinus-tabbar__inner">
            <router-link
              v-for="tab in contactTabs"
              :key="tab.name"
              :to="tab.path"
              class="joinus-tabbar__item"
              :class="{ active: tab.name === 'Join Us' }"
            >
              {{ tab.name }}
            </router-link>
          </div>
        </div>

        <div class="joinus-hero__content" :class="{ 'is-visible': animatedSections.includes('ctn1') }">
          <div class="joinus-hero__title">
            <div class="fnt-hero">CONTACT US</div>
            <img
              src="https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png"
              alt="Accent"
            />
          </div>
          <div class="joinus-hero__line"></div>
          <div class="joinus-hero__subtitle">Work together to win the future</div>
        </div>
      </section>

      <section id="ctn2" class="joinus-section joinus-list-section">
        <div class="joinus-list-shell" :class="{ 'is-visible': animatedSections.includes('ctn2') }">
          <div class="joinus-breadcrumb">
            <House :size="16" />
            <span>Home</span>
            <ChevronRight :size="14" />
            <span>Contact Us</span>
            <ChevronRight :size="14" />
            <span class="active">Join Us</span>
          </div>

          <header class="joinus-heading">
            <div class="joinus-heading__title">
              <h2>JOIN US</h2>
              <img
                src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
                alt="Accent"
              />
            </div>
            <div class="joinus-heading__line"></div>
          </header>

          <div class="joinus-switcher" role="tablist" aria-label="Recruitment type">
            <button
              v-for="tab in recruitmentTabs"
              :id="`joinus-switch-${tab.key}`"
              :key="tab.key"
              class="joinus-switcher__item"
              :class="{ active: activeRecruitmentTab === tab.key }"
              type="button"
              :aria-selected="activeRecruitmentTab === tab.key"
              @click="setRecruitmentTab(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="joinus-filterbox">
            <div class="joinus-filters">
              <label class="joinus-filter" for="joinus-position-filter">
                <span>Select Position：</span>
                <select id="joinus-position-filter" v-model="filters.position">
                  <option v-for="item in currentFilterOptions.position" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>

              <label class="joinus-filter" for="joinus-department-filter">
                <span>Recruitment Department：</span>
                <select id="joinus-department-filter" v-model="filters.department">
                  <option v-for="item in currentFilterOptions.department" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>

              <label class="joinus-filter" for="joinus-release-filter">
                <span>Release Date：</span>
                <select id="joinus-release-filter" v-model="filters.releaseDate">
                  <option v-for="item in currentFilterOptions.releaseDate" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>

              <label class="joinus-filter" for="joinus-address-filter">
                <span>Address：</span>
                <select id="joinus-address-filter" v-model="filters.address">
                  <option v-for="item in currentFilterOptions.address" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>
            </div>

            <div class="joinus-conditionbar">
              <div class="joinus-conditionbar__left">
                <span class="joinus-conditionbar__label">condition:</span>
                <div v-if="activeConditions.length" class="joinus-conditionbar__chips">
                  <span
                    v-for="item in activeConditions"
                    :key="item.key"
                    class="joinus-conditionbar__chip"
                  >
                    {{ item.label }}: {{ item.value }}
                  </span>
                </div>
                <span v-else class="joinus-conditionbar__empty">All</span>
              </div>
              <button
                id="joinus-clear-condition"
                class="joinus-conditionbar__clear"
                type="button"
                @click="resetFilters"
              >
                clear condition
              </button>
            </div>

            <div class="joinus-contacts">
              <div class="joinus-contact-item">
                <div class="joinus-contact-item__icon">
                  <UserRound :size="28" />
                </div>
                <p>contacts:Ms. Wang</p>
              </div>

              <div class="joinus-contact-item">
                <div class="joinus-contact-item__icon">
                  <PhoneCall :size="28" />
                </div>
                <p>
                  Tel:<a href="tel:13910192308">13910192308</a>
                </p>
              </div>

              <div class="joinus-contact-item">
                <div class="joinus-contact-item__icon">
                  <Mail :size="28" />
                </div>
                <p>
                  Resume submission:<a href="mailto:hr@chinadecor.com">hr@chinadecor.com</a>
                </p>
              </div>
            </div>
          </div>

          <div v-if="pagedJobs.length" class="joinus-joblist">
            <article
              v-for="job in pagedJobs"
              :key="job.id"
              class="joinus-jobcard"
              :class="{ 'joinus-jobcard--campus': activeRecruitmentTab === 'campus' }"
            >
              <div class="joinus-jobcard__content">
                <div class="joinus-jobcard__left">
                  <h3>{{ job.title }}</h3>
                  <ul>
                    <li>Release time：{{ job.releaseDate }}</li>
                    <li>Educational requirements：{{ job.education }}</li>
                    <li>age：{{ job.age }}</li>
                    <li>Work Experience：{{ job.experience }}</li>
                    <li>Work location：{{ job.location }}</li>
                    <li>gender：{{ job.gender }}</li>
                    <li>Recruiting Numbers：{{ job.count }}</li>
                    <li>Nature of Work：{{ job.workNature }}</li>
                  </ul>
                </div>

                <div class="joinus-jobcard__right">
                  <a
                    :id="`joinus-apply-${job.id}`"
                    class="joinus-jobcard__apply"
                    :href="job.applyUrl"
                    :target="job.applyUrl.startsWith('http') ? '_blank' : undefined"
                    :rel="job.applyUrl.startsWith('http') ? 'noopener noreferrer' : undefined"
                  >
                    <span>I want to apply</span>
                    <BriefcaseBusiness :size="18" />
                  </a>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="joinus-empty">
            <p>No matching jobs found.</p>
          </div>

          <div class="joinus-pagination joinus-pagination--section">
            <button
              id="joinus-prev-page"
              class="joinus-pagination__button"
              :class="{ disabled: currentPage === 1 }"
              type="button"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              prev
            </button>

            <button
              v-for="page in totalPages"
              :id="`joinus-page-${page}`"
              :key="page"
              class="joinus-pagination__button joinus-pagination__button--page"
              :class="{ active: currentPage === page }"
              type="button"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>

            <button
              id="joinus-next-page"
              class="joinus-pagination__button"
              :class="{ disabled: currentPage === totalPages }"
              type="button"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              next
            </button>
          </div>

          <div class="joinus-footer-wrapper" :class="{ 'is-visible': animatedSections.includes('ctn2') }">
            <AppFooter :force-visible="true" />
          </div>
        </div>
      </section>
    </div>

    <button
      class="joinus-backtop"
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
.joinus-clone {
  position: relative;
  background: #f5f1ea;
}

.joinus-scroll {
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.joinus-scroll::-webkit-scrollbar {
  width: 0;
}

.joinus-section {
  position: relative;
  scroll-snap-align: start;
}

.joinus-dots {
  position: fixed;
  right: 10px;
  top: 50%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transform: translateY(-50%);
}

.joinus-dots__item {
  width: 14px;
  height: 14px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.joinus-dots__item span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(213, 0, 17, 0.68);
  transition: transform 0.25s ease, background 0.25s ease;
}

.joinus-dots__item.active span,
.joinus-dots__item:hover span {
  transform: scale(2.3);
  background: #e70012;
}

.joinus-hero {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.joinus-hero__media,
.joinus-hero__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.joinus-hero__media img {
  object-fit: cover;
}

.joinus-hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(10, 16, 29, 0.3) 0%, rgba(10, 16, 29, 0.08) 36%, rgba(10, 16, 29, 0.24) 100%),
    linear-gradient(90deg, rgba(17, 29, 52, 0.52) 0%, rgba(17, 29, 52, 0.16) 44%, rgba(17, 29, 52, 0.08) 100%);
}

.joinus-tabbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  padding: 0 36px;
}

.joinus-tabbar__inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: rgba(23, 35, 58, 0.84);
  box-shadow: 0 24px 48px rgba(6, 14, 24, 0.22);
  backdrop-filter: blur(10px);
}

.joinus-tabbar__item {
  position: relative;
  min-height: 96px;
  display: grid;
  place-items: center;
  color: #efc392;
  text-decoration: none;
  font-size: 1rem;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.joinus-tabbar__item:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 22px;
  background: rgba(239, 195, 146, 0.88);
  transform: translateY(-50%);
}

.joinus-tabbar__item.active,
.joinus-tabbar__item:hover {
  background: #f1000c;
  color: #ffffff;
}

.joinus-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  margin: 136px 0 170px;
  text-align: left;
  opacity: 0;
  transform: translateY(42px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.joinus-hero__content.is-visible,
.joinus-list-shell.is-visible,
.joinus-footer-wrapper.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.joinus-hero__title {
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

.joinus-hero__title img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.joinus-hero__line,
.joinus-heading__line {
  position: relative;
  height: 1px;
  background: #d7000f;
}

.joinus-hero__line {
  width: min(840px, 62vw);
}

.joinus-hero__line::before,
.joinus-hero__line::after,
.joinus-heading__line::before,
.joinus-heading__line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #d7000f;
  transform: translateY(-50%);
}

.joinus-hero__line::before,
.joinus-heading__line::before {
  left: -1px;
}

.joinus-hero__line::after,
.joinus-heading__line::after {
  right: -1px;
}

.joinus-hero__subtitle {
  margin-top: 68px;
  margin-left: clamp(160px, 10vw, 190px);
  color: #ffffff;
  font-size: 30px;
  letter-spacing: 0;
}

.joinus-list-section {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(247, 243, 237, 0.98) 0%, rgba(255, 255, 255, 0.99) 38%, rgba(245, 240, 233, 0.98) 100%),
    #f8f4ee;
}

.joinus-list-section::before {
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

.joinus-list-section::after {
  content: '';
  position: absolute;
  right: 18px;
  top: 104px;
  width: min(620px, 42vw);
  height: min(620px, 42vw);
  background: url('https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png')
    center / contain no-repeat;
  opacity: 0.1;
  filter: grayscale(1) brightness(2.2) contrast(0.45);
  pointer-events: none;
}

.joinus-list-shell {
  position: relative;
  z-index: 2;
  width: min(1600px, calc(100% - 72px));
  margin: 0 auto;
  padding: 16px 0 28px;
  opacity: 0;
  transform: translateY(42px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.joinus-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(1480px, 100%);
  margin: 0 auto;
  color: #74706a;
  font-size: 13px;
}

.joinus-breadcrumb .active {
  color: #d7000f;
}

.joinus-heading {
  display: grid;
  justify-items: center;
  margin-top: 30px;
}

.joinus-heading__title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.joinus-heading__title h2 {
  margin: 0;
  color: #2d2a2b;
  font-family: 'Times New Roman', serif;
  font-size: clamp(2.8rem, 2.35rem + 0.75vw, 3.35rem);
  line-height: 1;
}

.joinus-heading__title img {
  width: 36px;
  height: 36px;
}

.joinus-heading__line {
  width: min(220px, 36vw);
  margin-top: 14px;
}

.joinus-switcher {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin-top: 28px;
}

.joinus-switcher__item {
  border: 0;
  border-radius: 4px;
  padding: 10px 18px;
  min-width: 116px;
  background: #ccb08e;
  color: #ffffff;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}

.joinus-switcher__item.active {
  background: #d60016;
}

.joinus-switcher__item:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(145, 109, 62, 0.18);
}

.joinus-filterbox {
  width: min(1280px, 100%);
  margin: 40px auto 0;
}

.joinus-filters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px 120px;
  padding: 32px 100px 26px;
  background: rgba(249, 248, 247, 0.84);
  border: 1px solid rgba(240, 235, 229, 0.98);
}

.joinus-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  color: #2f241a;
  font-size: 13px;
}

.joinus-filter span {
  white-space: nowrap;
  font-weight: 600;
}

.joinus-filter select {
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid rgba(182, 172, 158, 0.9);
  background: #ffffff;
  color: #45372c;
  font-size: 11px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.joinus-filter select:focus {
  border-color: #d60016;
  box-shadow: 0 0 0 3px rgba(214, 0, 22, 0.08);
}

.joinus-conditionbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 6px 0;
  color: #6f645a;
  font-size: 11px;
}

.joinus-conditionbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.joinus-conditionbar__label {
  color: #6e665d;
}

.joinus-conditionbar__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.joinus-conditionbar__chip {
  border-radius: 999px;
  padding: 5px 10px;
  background: rgba(214, 0, 22, 0.08);
  color: #b30d1f;
}

.joinus-conditionbar__clear {
  border: 0;
  background: transparent;
  color: #7a6e64;
  cursor: pointer;
  font-size: 11px;
  transition: color 0.2s ease;
}

.joinus-conditionbar__clear:hover {
  color: #d60016;
}

.joinus-contacts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 20px;
  background: #ffffff;
}

.joinus-contact-item {
  position: relative;
  min-height: 102px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 16px 20px;
  color: #4f4337;
}

.joinus-contact-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 1px;
  height: 46px;
  background: rgba(237, 232, 227, 0.95);
  transform: translateY(-50%);
}

.joinus-contact-item__icon {
  width: 54px;
  height: 54px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(247, 213, 218, 0.72);
  color: #dd0015;
  flex-shrink: 0;
}

.joinus-contact-item p,
.joinus-contact-item a {
  color: inherit;
  font-size: 12px;
  text-decoration: none;
}

.joinus-joblist {
  width: min(1280px, 100%);
  margin: 32px auto 0;
}

.joinus-jobcard {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(232, 227, 221, 0.98);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.99) 0%, rgba(250, 248, 245, 0.99) 100%),
    #fbf8f5;
  box-shadow: none;
  transition:
    background 0.35s ease,
    border-color 0.35s ease,
    box-shadow 0.35s ease,
    transform 0.35s ease;
}

.joinus-jobcard::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(150, 0, 11, 0.1) 0%, rgba(150, 0, 11, 0) 38%),
    linear-gradient(180deg, rgba(214, 0, 22, 0.96) 0%, rgba(176, 0, 15, 0.98) 100%);
  opacity: 0;
  transition: opacity 0.35s ease;
}

.joinus-jobcard::after {
  content: '';
  position: absolute;
  right: 10px;
  bottom: 0;
  width: 46%;
  height: 100%;
  background: url('https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/5dce6c21-f652-440e-b4ce-d5cf020ebb60.png')
    right bottom / contain no-repeat;
  opacity: 0.12;
  pointer-events: none;
  transition: opacity 0.35s ease, filter 0.35s ease;
}

.joinus-jobcard:hover {
  border-color: #b80012;
  box-shadow: 0 22px 48px rgba(148, 0, 17, 0.12);
  transform: translateY(-2px);
}

.joinus-jobcard:hover::before,
.joinus-jobcard--campus::before {
  opacity: 1;
}

.joinus-jobcard:hover::after {
  opacity: 0.16;
  filter: brightness(0) invert(1);
}

.joinus-jobcard--campus {
  border-color: #b80012;
  box-shadow: none;
}

.joinus-jobcard--campus::after {
  opacity: 0;
}

.joinus-jobcard__content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 314px;
  gap: 0;
  align-items: stretch;
  padding: 0;
}

.joinus-jobcard__left {
  padding: 28px 30px 24px;
}

.joinus-jobcard__left h3 {
  margin: 0;
  color: #2d2a2b;
  font-family: 'Times New Roman', serif;
  font-size: clamp(1.2rem, 1.02rem + 0.58vw, 1.55rem);
  font-weight: 400;
  transition: color 0.35s ease;
}

.joinus-jobcard__left ul {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px 16px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.joinus-jobcard__left li {
  color: #6f6054;
  font-size: 12px;
  line-height: 1.55;
  transition: color 0.35s ease;
}

.joinus-jobcard__right {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 30px;
}

.joinus-jobcard--campus .joinus-jobcard__right::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(117, 0, 10, 0.16);
}

.joinus-jobcard__apply {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 4px;
  padding: 11px 14px;
  background: #ceb18f;
  color: #ffffff;
  text-decoration: none;
  font-size: 12px;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    box-shadow 0.25s ease,
    color 0.25s ease;
}

.joinus-jobcard:hover .joinus-jobcard__left h3,
.joinus-jobcard:hover .joinus-jobcard__left li,
.joinus-jobcard--campus .joinus-jobcard__left h3,
.joinus-jobcard--campus .joinus-jobcard__left li {
  color: #fff6f1;
}

.joinus-jobcard:hover .joinus-jobcard__apply,
.joinus-jobcard--campus .joinus-jobcard__apply {
  background: rgba(255, 220, 221, 0.92);
  color: #d60016;
  box-shadow: 0 18px 32px rgba(77, 0, 8, 0.12);
}

.joinus-jobcard__apply:hover {
  background: #d60016;
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(214, 0, 22, 0.18);
}

.joinus-jobcard:hover .joinus-jobcard__apply:hover,
.joinus-jobcard--campus .joinus-jobcard__apply:hover {
  background: #ffe7e6;
  color: #bf0014;
}

.joinus-empty {
  width: min(1280px, 100%);
  margin: 22px auto 0;
  padding: 60px 24px;
  text-align: center;
  border: 1px dashed rgba(194, 175, 151, 0.9);
  color: #6c6158;
  background: rgba(255, 255, 255, 0.72);
}

.joinus-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 0;
}

.joinus-pagination__button {
  min-width: 40px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  padding: 0 10px;
  background: rgba(245, 241, 236, 0.96);
  color: #d0c8bf;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
}

.joinus-pagination__button--page {
  min-width: 28px;
}

.joinus-pagination__button.active {
  background: #f1000c;
  color: #ffffff;
}

.joinus-pagination__button:not(.disabled):hover {
  transform: translateY(-1px);
  background: #d9ccbc;
}

.joinus-pagination__button.active:hover {
  background: #f1000c;
}

.joinus-pagination__button.disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.joinus-footer-wrapper {
  width: min(100%, 100%);
  margin: 40px auto 0;
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.joinus-backtop {
  position: fixed;
  right: 22px;
  bottom: 24px;
  z-index: 45;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(28, 37, 55, 0.9);
  color: #f0d3a8;
  box-shadow: 0 14px 34px rgba(8, 12, 18, 0.22);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: translateY(14px);
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease;
}

.joinus-backtop.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.joinus-backtop:hover {
  background: #d60016;
  color: #ffffff;
}

@media (max-width: 1280px) {
  .joinus-filters {
    gap: 22px 40px;
    padding: 28px 32px 24px;
  }

  .joinus-jobcard__content {
    grid-template-columns: minmax(0, 1fr) 220px;
  }

  .joinus-jobcard__left ul {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .joinus-tabbar {
    padding: 0;
  }

  .joinus-tabbar__item {
    min-height: 74px;
    font-size: 14px;
    text-align: center;
    padding: 0 10px;
  }

  .joinus-hero__title,
  .joinus-hero__subtitle {
    margin-left: 28px;
  }

  .joinus-filters,
  .joinus-contacts {
    grid-template-columns: 1fr;
  }

  .joinus-filterbox,
  .joinus-joblist,
  .joinus-empty {
    width: 100%;
  }

  .joinus-filter {
    flex-direction: column;
    align-items: flex-start;
  }

  .joinus-filter select {
    width: 100%;
    height: 32px;
    font-size: 12px;
  }

  .joinus-contact-item:not(:last-child)::after {
    display: none;
  }

  .joinus-jobcard__content {
    grid-template-columns: 1fr;
  }

  .joinus-jobcard__left {
    padding: 24px 22px 16px;
  }

  .joinus-jobcard__right {
    justify-content: flex-start;
    padding: 0 22px 22px;
  }

  .joinus-jobcard__left ul {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .joinus-list-shell {
    width: min(100%, calc(100% - 28px));
    padding: 18px 0 40px;
  }

  .joinus-breadcrumb {
    flex-wrap: wrap;
    gap: 6px;
    font-size: 14px;
  }

  .joinus-heading {
    margin-top: 28px;
  }

  .joinus-heading__title {
    gap: 12px;
  }

  .joinus-heading__title img {
    width: 34px;
    height: 34px;
  }

  .joinus-switcher {
    gap: 12px;
    margin-top: 28px;
  }

  .joinus-switcher__item {
    flex: 1;
    padding: 12px 10px;
    font-size: 14px;
  }

  .joinus-filters {
    padding: 24px 18px;
    gap: 18px;
  }

  .joinus-conditionbar {
    flex-direction: column;
    align-items: flex-start;
    padding-top: 14px;
  }

  .joinus-contact-item {
    min-height: 98px;
    justify-content: flex-start;
    padding: 16px;
  }

  .joinus-contact-item p,
  .joinus-contact-item a,
  .joinus-jobcard__left li,
  .joinus-jobcard__apply {
    font-size: 14px;
  }

  .joinus-pagination__button {
    min-width: 46px;
    height: 34px;
    font-size: 12px;
  }

  .joinus-backtop {
    right: 14px;
    bottom: 14px;
    width: 42px;
    height: 42px;
  }
}
</style>
