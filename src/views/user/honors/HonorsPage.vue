<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { env } from '@/shared/config/env'
import { getContacts } from '@/views/user/services/publicApi'
import { getHonorsPageData } from '@/views/user/services/honorsApi'
import { submitInquiry } from '@/views/user/services/productsApi'
import HonorsAwardsTabs from '@/views/user/honors/ui/HonorsAwardsTabs.vue'
import HonorsHeroSection from '@/views/user/honors/ui/HonorsHeroSection.vue'
import HonorsQualificationList from '@/views/user/honors/ui/HonorsQualificationList.vue'
import logoImage from '@/assets/logo-cty.png'

const route = useRoute()
const API_ORIGIN = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const honorSections = [
  { id: 'page1', label: 'Top' },
  { id: 'page2', label: 'Hình ảnh nhà máy' },
  { id: 'page2b', label: 'Tổng quan nhà máy' },
  { id: 'page2c', label: 'Công nghệ sản xuất' },
  { id: 'page3', label: 'Chứng nhận & Năng lực' },
  { id: 'page4', label: 'Liên hệ' },
]

const activeSection = ref('page1')
const loading = ref(false)
const contacts = ref([])
const primaryContact = ref(null)
const activeCertificateTab = ref('all')

const hero = ref({
  title: 'NĂNG LỰC',
  description: 'Hình ảnh nhà máy, công nghệ sản xuất, công suất thực tế và các chứng nhận ISO, CE.',
  background: '',
  mobile_background: '',
  accent: '',
  seal_text: '资质',
})
const factoryOverview = ref({
  title: 'Tổng quan nhà máy',
  factory_name: '',
  factory_address: '',
  factory_location: 'Location',
  description: '',
  production_technology: '',
  machinery_process: '',
  production_capacity: '',
  output_description: '',
  main_image_url: '',
  stats: [],
})
const factoryGallery = ref([])
const productionCapabilities = ref([])
const certificateItems = ref([])
const corporateItems = ref([])
const projectItems = ref([])
const contactInfo = ref({
  address: '',
  email: '',
  phone: '',
  working_hours: '',
  map_embed: '',
  google_map_url: '',
  contact_name: '',
})
const inquiryForm = ref({
  full_name: '',
  email: '',
  phone: '',
  company: '',
  subject: '',
  message: '',
})
const inquiryStatus = ref('idle')
const inquiryError = ref('')

const fallbackMapEmbed = 'https://www.google.com/maps?q=Vietnam&hl=vi&z=6&output=embed'

const companyName = computed(() => {
  const preferredName =
    factoryOverview.value.factory_name ||
    contactInfo.value.contact_name ||
    primaryContact.value?.name ||
    ''

  if (!preferredName || preferredName.toLowerCase().includes('china national decoration')) {
    return 'CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ THIÊN ĐỒNG VIỆT NAM'
  }

  return preferredName
})

const resolvedMapEmbed = computed(() => contactInfo.value.map_embed || fallbackMapEmbed)
const hasFactoryStats = computed(() => Array.isArray(factoryOverview.value.stats) && factoryOverview.value.stats.length > 0)
const filteredCertificates = computed(() => {
  if (activeCertificateTab.value === 'all') {
    return certificateItems.value
  }
  return certificateItems.value.filter((item) => {
    const normalizedCategory = String(item.category || '').toLowerCase()
    if (activeCertificateTab.value === 'qualification') {
      return normalizedCategory.includes('qualification') || normalizedCategory.includes('năng lực')
    }
    if (activeCertificateTab.value === 'corporate') {
      return normalizedCategory.includes('corporate') || normalizedCategory.includes('iso') || normalizedCategory.includes('ce')
    }
    if (activeCertificateTab.value === 'project') {
      return normalizedCategory.includes('project') || normalizedCategory.includes('dự án')
    }
    return true
  })
})
const isInquiryFormValid = computed(() =>
  inquiryForm.value.full_name.trim() &&
  inquiryForm.value.email.trim() &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiryForm.value.email) &&
  inquiryForm.value.message.trim(),
)
const overviewHighlights = computed(() => [
  {
    label: 'Tên nhà máy',
    value: companyName.value,
  },
  {
    label: 'Địa chỉ',
    value:
      contactInfo.value.address ||
      factoryOverview.value.factory_address ||
      'Đang cập nhật địa chỉ nhà máy.',
  },
  {
    label: 'Công suất',
    value:
      factoryOverview.value.production_capacity ||
      'Đang cập nhật công suất thực tế.',
  },
])
const capabilityNarratives = computed(() =>
  [
    {
      key: 'technology',
      label: 'Công nghệ sản xuất',
      value:
        factoryOverview.value.production_technology ||
        'Ứng dụng dây chuyền hiện đại, kiểm soát chất lượng đồng bộ và tối ưu tốc độ hoàn thiện.',
    },
    {
      key: 'process',
      label: 'Máy móc & quy trình',
      value:
        factoryOverview.value.machinery_process ||
        'Quy trình vận hành được chuẩn hóa từ tiếp nhận đơn hàng, sản xuất, nghiệm thu đến bàn giao.',
    },
    {
      key: 'output',
      label: 'Năng lực đầu ra',
      value:
        factoryOverview.value.output_description ||
        'Đáp ứng linh hoạt các đơn hàng dự án, OEM/ODM và chuỗi cung ứng cho công trình quy mô lớn.',
    },
  ],
)

function resolveImageUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

function buildGoogleEmbedFromCoordinates(latitude, longitude) {
  const marker = encodeURIComponent(`${latitude.toFixed(6)},${longitude.toFixed(6)}`)
  return `https://www.google.com/maps?q=${marker}&hl=vi&z=16&output=embed`
}

function normalizeGoogleMapUrl(mapUrl) {
  const rawValue = String(mapUrl ?? '').trim()
  if (!rawValue) {
    return ''
  }

  try {
    const parsedUrl = new URL(rawValue)
    const hostname = parsedUrl.hostname.toLowerCase()
    const pathname = parsedUrl.pathname.toLowerCase()

    if (!hostname.includes('google.') && !hostname.includes('goo.gl')) {
      return ''
    }

    if (pathname.includes('/maps/embed')) {
      return rawValue
    }

    const queryCandidate =
      parsedUrl.searchParams.get('q') ||
      parsedUrl.searchParams.get('query') ||
      parsedUrl.searchParams.get('ll') ||
      parsedUrl.searchParams.get('center')

    if (queryCandidate) {
      return `https://www.google.com/maps?q=${encodeURIComponent(queryCandidate)}&hl=vi&z=16&output=embed`
    }

    const markerMatch = rawValue.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
    if (markerMatch) {
      return `https://www.google.com/maps?q=${encodeURIComponent(`${markerMatch[1]},${markerMatch[2]}`)}&hl=vi&z=16&output=embed`
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(rawValue)}&hl=vi&z=16&output=embed`
  } catch {
    return `https://www.google.com/maps?q=${encodeURIComponent(rawValue)}&hl=vi&z=16&output=embed`
  }
}

function parseCoordinate(value, axis) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return null
  if (axis === 'lat' && (parsed < -90 || parsed > 90)) return null
  if (axis === 'lng' && (parsed < -180 || parsed > 180)) return null
  return parsed
}

function buildFactoryMapEmbed() {
  if (contactInfo.value.map_embed) {
    return contactInfo.value.map_embed
  }

  if (primaryContact.value) {
    const lat = parseCoordinate(primaryContact.value.latitude, 'lat')
    const lng = parseCoordinate(primaryContact.value.longitude, 'lng')
    if (lat !== null && lng !== null) {
      return buildGoogleEmbedFromCoordinates(lat, lng)
    }
    return normalizeGoogleMapUrl(primaryContact.value.map_url) || fallbackMapEmbed
  }

  return fallbackMapEmbed
}

function handleScroll() {
  const scrollCenter = window.scrollY + window.innerHeight * 0.45
  for (const item of honorSections) {
    const element = document.getElementById(item.id)
    if (!element) continue
    const top = element.offsetTop
    const bottom = top + element.offsetHeight
    if (scrollCenter >= top && scrollCenter < bottom) {
      activeSection.value = item.id
      break
    }
  }
}

function scrollToSection(id) {
  const section = document.getElementById(id)
  if (!section) return
  const top = section.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: 'smooth' })
  window.history.replaceState(null, '', `/honors#${id}`)
}

async function syncHashSection() {
  await nextTick()
  const hash = route.hash?.replace('#', '')
  if (hash && honorSections.some((item) => item.id === hash)) {
    scrollToSection(hash)
    return
  }
  handleScroll()
}

async function loadHonors() {
  loading.value = true
  try {
    const contactsPayload = await getContacts()
    contacts.value = Array.isArray(contactsPayload?.items) ? contactsPayload.items : []
    primaryContact.value = contacts.value.find((item) => item?.is_primary) || contacts.value[0] || null

    const payload = await getHonorsPageData()

    const heroBackground =
      payload.hero_banner?.background_image_url || payload.hero?.background || hero.value.background

    hero.value = {
      title: payload.hero_banner?.title || payload.hero?.title || hero.value.title,
      description: payload.hero_banner?.subtitle || payload.hero?.description || hero.value.description,
      background: heroBackground,
      mobile_background:
        payload.hero_banner?.mobile_background_image_url || payload.hero?.mobile_background || heroBackground,
      accent: payload.hero_banner?.seal_image_url || payload.hero?.accent || '',
      seal_text: payload.hero_banner?.seal_text || payload.hero?.seal_text || '资质',
    }

    factoryOverview.value = {
      ...factoryOverview.value,
      ...(payload.factory_overview || {}),
      stats: Array.isArray(payload.factory_overview?.stats) ? payload.factory_overview.stats : [],
    }
    factoryGallery.value = Array.isArray(payload.factory_gallery) ? payload.factory_gallery : []
    productionCapabilities.value = Array.isArray(payload.production_capabilities) ? payload.production_capabilities : []
    certificateItems.value = Array.isArray(payload.certificates) ? payload.certificates : []
    corporateItems.value = (payload.sections?.corporate_honors || []).length
      ? payload.sections.corporate_honors
      : certificateItems.value.filter((item) => String(item.category || '').toLowerCase().includes('corporate'))
    projectItems.value = (payload.sections?.project_honors || []).length
      ? payload.sections.project_honors
      : certificateItems.value.filter((item) => String(item.category || '').toLowerCase().includes('project'))
    contactInfo.value = {
      ...contactInfo.value,
      ...(payload.contact_info || {}),
      map_embed: payload.contact_info?.map_embed || '',
    }

    if (!contactInfo.value.address && primaryContact.value?.address) {
      contactInfo.value.address = primaryContact.value.address
    }
    if (!contactInfo.value.phone && primaryContact.value?.phone) {
      contactInfo.value.phone = primaryContact.value.phone
    }
    if (!contactInfo.value.email && primaryContact.value?.email) {
      contactInfo.value.email = primaryContact.value.email
    }
    if (!contactInfo.value.contact_name && primaryContact.value?.name) {
      contactInfo.value.contact_name = primaryContact.value.name
    }
    contactInfo.value.map_embed = buildFactoryMapEmbed()
  } finally {
    loading.value = false
  }
}

async function handleInquirySubmit() {
  if (!isInquiryFormValid.value || inquiryStatus.value === 'loading') return

  inquiryStatus.value = 'loading'
  inquiryError.value = ''

  try {
    await submitInquiry({
      ...inquiryForm.value,
      subject: inquiryForm.value.subject.trim() || 'Liên hệ từ trang Năng lực',
      source_page: 'honors',
    })
    inquiryForm.value = {
      full_name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: '',
    }
    inquiryStatus.value = 'success'
  } catch (error) {
    inquiryStatus.value = 'error'
    inquiryError.value = error?.message || 'Gửi thất bại. Vui lòng thử lại.'
  }
}

watch(
  () => route.hash,
  () => {
    syncHashSection()
  },
)

watch(activeSection, (value) => {
  if (route.path === '/honors') {
    window.history.replaceState(null, '', `/honors#${value}`)
  }
})

onMounted(async () => {
  await loadHonors()
  handleScroll()
  syncHashSection()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})
</script>

<template>
  <main class="honors-page">
    <div class="honors-page__ambience honors-page__ambience--left"></div>
    <div class="honors-page__ambience honors-page__ambience--right"></div>
    <aside class="dots" aria-label="Honors section navigation">
      <button
        v-for="item in honorSections"
        :id="`honors-dot-${item.id}`"
        :key="item.id"
        class="dots__item"
        :class="{ active: activeSection === item.id }"
        type="button"
        :aria-label="`Đi tới ${item.label}`"
        @click="scrollToSection(item.id)"
      >
        <span></span>
      </button>
    </aside>

    <HonorsHeroSection :hero="hero" @go-section="scrollToSection" />
    <HonorsQualificationList :items="factoryGallery" :image-resolver="resolveImageUrl" />

    <section
      id="page2b"
      class="capability-section capability-section--light capability-section--overview"
    >
      <div class="stage capability-stage capability-stage--overview">
        <div class="capability-overview__media-shell">
          <div class="capability-overview__media">
            <img
              v-if="factoryOverview.main_image_url"
              :src="resolveImageUrl(factoryOverview.main_image_url)"
              :alt="factoryOverview.factory_name || 'Nhà máy sản xuất'"
            />
            <div v-else class="capability-overview__placeholder">
              <span>{{ companyName.slice(0, 1) }}</span>
            </div>
            <div class="capability-overview__floating-card">
              <span>{{ factoryOverview.factory_location || 'Factory Location' }}</span>
              <strong>{{ contactInfo.address || factoryOverview.factory_address || 'Địa chỉ đang cập nhật' }}</strong>
            </div>
          </div>
        </div>

        <div class="capability-overview__content">
          <header class="capability-heading capability-heading--dark-text">
            <span class="eyebrow">NĂNG LỰC NHÀ MÁY</span>
            <h2>{{ factoryOverview.title || 'Tổng quan nhà máy' }}</h2>
            <p>
              {{
                factoryOverview.description ||
                'Không gian vận hành, năng lực cung ứng và quy trình kiểm soát chất lượng được chuẩn hóa cho các dự án quy mô lớn.'
              }}
            </p>
          </header>

          <div class="overview-highlights">
            <article
              v-for="item in overviewHighlights"
              :key="item.label"
              class="overview-highlight"
            >
              <span class="overview-highlight__label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>

          <div v-if="hasFactoryStats" class="output-grid output-grid--light">
            <div
              v-for="(metric, index) in factoryOverview.stats"
              :key="`${metric.label}-${index}`"
              class="output-card output-card--light"
            >
              <strong>{{ metric.value }}</strong>
              <span>{{ metric.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="page2c" class="capability-section capability-section--dark capability-section--full">
      <div class="stage capability-stage capability-stage--tech">
        <header class="capability-heading capability-heading--split capability-heading--split-dark">
          <div>
            <span class="eyebrow">CÔNG NGHỆ SẢN XUẤT</span>
            <h2>Hệ năng lực vận hành</h2>
          </div>
          <p>
            {{
              factoryOverview.production_technology ||
              factoryOverview.machinery_process ||
              'Các module công nghệ, máy móc và quy trình được chuẩn hóa để đáp ứng tiến độ và chất lượng dự án.'
            }}
          </p>
        </header>

        <div class="capability-story-grid">
          <article
            v-for="item in capabilityNarratives"
            :key="item.key"
            class="capability-story-card"
          >
            <span>{{ item.label }}</span>
            <p>{{ item.value }}</p>
          </article>
        </div>

        <div v-if="productionCapabilities.length" class="capability-feature-grid">
          <article
            v-for="(item, index) in productionCapabilities"
            :key="`${item.title}-${index}`"
            class="capability-feature-card"
          >
            <div class="capability-feature-card__index">0{{ index + 1 }}</div>
            <div class="capability-feature-card__body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description || 'Đang cập nhật mô tả chi tiết cho hạng mục năng lực sản xuất này.' }}</p>
            </div>
          </article>
        </div>

        <div v-else class="empty-state empty-state--dark">Chưa có dữ liệu công nghệ sản xuất.</div>
      </div>
    </section>

    <section
      id="page3"
      class="capability-section capability-section--light capability-section--certificates"
    >
      <div class="stage capability-stage">
        <header class="capability-heading capability-heading--dark-text capability-heading--split">
          <div>
            <span class="eyebrow">CHỨNG NHẬN & NĂNG LỰC</span>
            <h2>Hồ sơ chứng nhận nổi bật</h2>
            <p>
              Các chứng chỉ, hồ sơ năng lực và thành tựu dự án được quản lý tập trung từ admin và
              phản ánh trực tiếp trên trang public.
            </p>
          </div>

          <div class="certificate-filters" role="tablist" aria-label="Lọc chứng nhận năng lực">
            <button
              id="capability-filter-all"
              type="button"
              :class="{ active: activeCertificateTab === 'all' }"
              @click="activeCertificateTab = 'all'"
            >
              Tất cả
            </button>
            <button
              id="capability-filter-qualification"
              type="button"
              :class="{ active: activeCertificateTab === 'qualification' }"
              @click="activeCertificateTab = 'qualification'"
            >
              Hồ sơ năng lực
            </button>
            <button
              id="capability-filter-corporate"
              type="button"
              :class="{ active: activeCertificateTab === 'corporate' }"
              @click="activeCertificateTab = 'corporate'"
            >
              ISO & CE
            </button>
            <button
              id="capability-filter-project"
              type="button"
              :class="{ active: activeCertificateTab === 'project' }"
              @click="activeCertificateTab = 'project'"
            >
              Dự án tiêu biểu
            </button>
          </div>
        </header>

        <div v-if="filteredCertificates.length" class="capability-grid capability-grid--certificates">
          <article
            v-for="item in filteredCertificates"
            :key="item.id"
            class="certificate-card"
          >
            <div class="certificate-card__visual">
              <img :src="resolveImageUrl(item.image_url)" :alt="item.title" />
              <span class="certificate-card__category">{{ item.category || 'Certificate' }}</span>
            </div>
            <div class="certificate-card__content">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description || 'Đang cập nhật mô tả chứng nhận.' }}</p>
              <div class="certificate-card__meta">
                <span v-if="item.year">{{ item.year }}</span>
                <span v-if="item.issuer || item.issued_by">{{ item.issuer || item.issued_by }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">Chưa có dữ liệu chứng nhận để hiển thị.</div>
      </div>
    </section>

    <HonorsAwardsTabs
      :corporate-items="corporateItems"
      :project-items="projectItems"
      :image-resolver="resolveImageUrl"
    />

    <section id="page4" class="capability-section capability-section--contact">
      <div class="stage capability-stage capability-stage--contact">
        <div class="contact-panel">
          <div class="contact-panel__map">
            <iframe
              :src="resolvedMapEmbed"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <div v-if="companyName" class="contact-map__marker">
              <div class="contact-map__brand">
                <img :src="logoImage" :alt="companyName" />
              </div>
              <div class="contact-map__label">
                <strong>{{ companyName }}</strong>
                <span>{{ contactInfo.address || 'Địa chỉ đang được cập nhật.' }}</span>
              </div>
            </div>
          </div>

          <div class="contact-panel__content">
            <header class="capability-heading capability-heading--dark-text">
              <span class="eyebrow">LIÊN HỆ HỢP TÁC</span>
              <h2>Sẵn sàng kết nối dự án</h2>
              <p>
                Gửi yêu cầu tư vấn về năng lực sản xuất, hồ sơ nhà máy hoặc chứng nhận chất lượng.
                Đội ngũ sẽ phản hồi nhanh qua email hoặc điện thoại.
              </p>
            </header>

            <div class="contact-info-grid">
              <article class="contact-info-card">
                <span>Email</span>
                <strong>{{ contactInfo.email || 'Đang cập nhật' }}</strong>
              </article>
              <article class="contact-info-card">
                <span>Điện thoại</span>
                <strong>{{ contactInfo.phone || 'Đang cập nhật' }}</strong>
              </article>
              <article class="contact-info-card">
                <span>Giờ làm việc</span>
                <strong>{{ contactInfo.working_hours || 'Thứ 2 - Thứ 7' }}</strong>
              </article>
            </div>

            <form
              v-if="inquiryStatus !== 'success'"
              class="capability-form"
              @submit.prevent="handleInquirySubmit"
              novalidate
            >
              <div class="capability-form__row">
                <label>
                  <span>Họ và tên *</span>
                  <input
                    id="capability-contact-name"
                    v-model="inquiryForm.full_name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label>
                  <span>Email *</span>
                  <input
                    id="capability-contact-email"
                    v-model="inquiryForm.email"
                    type="email"
                    placeholder="email@example.com"
                  />
                </label>
              </div>
              <div class="capability-form__row">
                <label>
                  <span>Số điện thoại</span>
                  <input
                    id="capability-contact-phone"
                    v-model="inquiryForm.phone"
                    type="tel"
                    placeholder="0901 234 567"
                  />
                </label>
                <label>
                  <span>Công ty</span>
                  <input
                    id="capability-contact-company"
                    v-model="inquiryForm.company"
                    type="text"
                    placeholder="Tên công ty"
                  />
                </label>
              </div>
              <label>
                <span>Chủ đề</span>
                <input
                  id="capability-contact-subject"
                  v-model="inquiryForm.subject"
                  type="text"
                  placeholder="Tư vấn hồ sơ năng lực"
                />
              </label>
              <label>
                <span>Nội dung *</span>
                <textarea
                  id="capability-contact-message"
                  v-model="inquiryForm.message"
                  rows="5"
                  placeholder="Mô tả nhu cầu, số lượng, hạng mục quan tâm..."
                ></textarea>
              </label>
              <p v-if="inquiryStatus === 'error'" class="capability-form__error">{{ inquiryError }}</p>
              <div class="capability-form__footer">
                <p>Thông tin sẽ được gửi trực tiếp tới bộ phận phụ trách năng lực sản xuất.</p>
                <button
                  id="capability-contact-submit"
                  type="submit"
                  :disabled="!isInquiryFormValid || inquiryStatus === 'loading'"
                >
                  {{ inquiryStatus === 'loading' ? 'Đang gửi...' : 'Gửi yêu cầu' }}
                </button>
              </div>
            </form>

            <div v-else class="capability-form__success">
              <strong>Đã gửi thành công.</strong>
              <p>Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="loading" class="loading-mask">Đang tải dữ liệu năng lực...</div>
  </main>
</template>

<style scoped>
.honors-page {
  position: relative;
  background:
    radial-gradient(circle at top, rgba(183, 132, 74, 0.16), transparent 26%),
    linear-gradient(180deg, #120c07 0%, #1d130a 28%, #120c07 100%);
  color: #fff;
  overflow: clip;
}

.honors-page__ambience {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(180deg, transparent, rgba(214, 168, 97, 0.3), transparent);
  opacity: 0.5;
  pointer-events: none;
  z-index: 1;
}

.honors-page__ambience--left {
  left: 38px;
}

.honors-page__ambience--right {
  right: 38px;
}

.dots {
  position: fixed;
  top: 50%;
  right: 24px;
  transform: translateY(-50%);
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dots__item {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.dots__item span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.42);
  transition: all 0.25s ease;
}

.dots__item.active span,
.dots__item:hover span {
  width: 12px;
  height: 12px;
  background: #df0019;
  box-shadow: 0 0 0 5px rgba(223, 0, 25, 0.14);
}

.loading-mask {
  position: fixed;
  inset: auto 20px 20px auto;
  z-index: 40;
  background: rgba(11, 23, 39, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 8px 14px;
  color: #fff;
  font-size: 13px;
}

.capability-section {
  position: relative;
  min-height: 100vh;
  padding: 84px 0 64px;
  display: flex;
  align-items: center;
}

.capability-section::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  width: min(1320px, calc(100% - 56px));
  height: 1px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(214, 168, 97, 0.22), transparent);
}

.capability-section::after {
  content: '';
  position: absolute;
  inset: 24px 24px auto 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
  pointer-events: none;
}

.capability-section--light {
  background:
    linear-gradient(180deg, rgba(23, 15, 10, 0.98), rgba(40, 26, 17, 0.98)),
    radial-gradient(circle at top right, rgba(170, 112, 57, 0.22), transparent 32%);
}

.capability-section--dark {
  background:
    linear-gradient(180deg, rgba(24, 16, 10, 0.98), rgba(53, 36, 20, 0.98)),
    radial-gradient(circle at top left, rgba(214, 168, 97, 0.18), transparent 30%);
}

.capability-stage {
  width: min(1320px, calc(100% - 56px));
  margin: 0 auto;
}

.capability-stage--overview {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.04fr);
  gap: 32px;
  align-items: center;
}

.capability-stage--tech,
.capability-stage--contact {
  display: grid;
  gap: 30px;
}

.capability-heading {
  margin-bottom: 24px;
}

.capability-heading .eyebrow {
  display: inline-block;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.capability-heading h2 {
  margin: 0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(2.35rem, 1.8rem + 1.5vw, 4rem);
  line-height: 1.05;
}

.capability-heading--dark-text .eyebrow {
  color: #d7a56b;
}

.capability-section--light .capability-heading h2,
.capability-section--light .capability-heading p {
  color: rgba(255, 245, 230, 0.92);
}

.capability-section--dark .capability-heading h2,
.capability-section--dark .capability-heading p,
.capability-section--dark .capability-heading .eyebrow {
  color: rgba(255, 255, 255, 0.92);
}

.capability-heading p {
  margin: 14px 0 0;
  max-width: 760px;
  font-size: 15px;
  line-height: 1.78;
}

.capability-heading--split {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(214, 168, 97, 0.12);
}

.capability-heading--split p {
  margin: 0;
  max-width: 520px;
}

.capability-overview__media-shell {
  min-width: 0;
}

.capability-overview__media {
  position: relative;
  min-height: 680px;
  border-radius: 34px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    linear-gradient(135deg, #7c4f29, #2b1b12);
  box-shadow:
    0 32px 80px rgba(8, 5, 3, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
}

.capability-overview__media img,
.capability-overview__placeholder {
  width: 100%;
  height: 100%;
}

.capability-overview__media img {
  display: block;
  object-fit: cover;
}

.capability-overview__placeholder {
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.88);
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(4rem, 3rem + 4vw, 7rem);
}

.capability-overview__floating-card {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(17, 16, 19, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(14px);
}

.capability-overview__floating-card span {
  color: rgba(255, 255, 255, 0.74);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.capability-overview__floating-card strong {
  color: #fff;
  font-size: 18px;
  line-height: 1.45;
}

.capability-overview__content {
  position: relative;
  min-width: 0;
}

.capability-overview__content::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background: linear-gradient(180deg, rgba(214, 168, 97, 0), rgba(214, 168, 97, 0.28), rgba(214, 168, 97, 0));
}

.overview-highlights {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.overview-highlight {
  display: grid;
  gap: 8px;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(214, 168, 97, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  box-shadow: 0 18px 40px rgba(8, 5, 3, 0.18);
}

.overview-highlight__label {
  color: #d7a56b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.overview-highlight strong {
  color: rgba(255, 245, 230, 0.94);
  font-size: 18px;
  line-height: 1.6;
}

.output-grid {
  display: grid;
  gap: 18px;
}

.output-grid--light {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.output-card {
  padding: 24px 22px;
  border-radius: 26px;
  text-align: left;
}

.output-card--light {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(214, 168, 97, 0.18);
  box-shadow:
    0 20px 48px rgba(8, 5, 3, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.output-card strong {
  display: block;
  color: #fff2dc;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.8rem, 1.4rem + 1.5vw, 3rem);
  line-height: 1;
}

.output-card span {
  display: block;
  margin-top: 10px;
  color: rgba(255, 233, 201, 0.72);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.capability-story-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.capability-story-card {
  position: relative;
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(232, 202, 154, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.capability-story-card::before {
  content: '';
  position: absolute;
  left: 22px;
  right: 22px;
  top: 16px;
  height: 1px;
  background: linear-gradient(90deg, rgba(214, 168, 97, 0.26), transparent);
}

.capability-story-card span {
  display: inline-flex;
  margin-bottom: 12px;
  color: #f1cf9b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.capability-story-card p {
  margin: 0;
  color: rgba(255, 245, 230, 0.84);
  line-height: 1.75;
}

.capability-feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.capability-feature-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 18px;
  padding: 24px;
  border-radius: 30px;
  border: 1px solid rgba(228, 190, 135, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05)),
    radial-gradient(circle at top right, rgba(214, 168, 97, 0.16), transparent 30%);
  box-shadow:
    0 26px 56px rgba(4, 4, 6, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.capability-feature-card__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(214, 168, 97, 0.18), rgba(214, 168, 97, 0.32));
  color: #f6dbb2;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 24px;
  font-weight: 700;
}

.capability-feature-card__body {
  min-width: 0;
}

.capability-feature-card h3 {
  margin: 0 0 12px;
  color: #fff4e0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 26px;
  line-height: 1.18;
}

.capability-feature-card p {
  margin: 0;
  color: rgba(255, 245, 230, 0.78);
  line-height: 1.75;
}

.capability-grid--certificates {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.certificate-filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.certificate-filters button {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(214, 168, 97, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 236, 212, 0.88);
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    background 0.25s ease,
    color 0.25s ease,
    box-shadow 0.25s ease;
}

.certificate-filters button:hover,
.certificate-filters button.active {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #6c180f, #b84125);
  color: #fff;
  box-shadow: 0 16px 30px rgba(113, 38, 18, 0.18);
}

.certificate-card {
  overflow: hidden;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(214, 168, 97, 0.14);
  box-shadow:
    0 20px 48px rgba(8, 5, 3, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.certificate-card__visual {
  position: relative;
  aspect-ratio: 0.92;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(132, 83, 38, 0.22), rgba(255, 255, 255, 0.32));
}

.certificate-card__visual img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.certificate-card__category {
  position: absolute;
  left: 18px;
  top: 18px;
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(27, 17, 11, 0.72);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.certificate-card__content {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.certificate-card__content h3 {
  margin: 0;
  color: #fff0d8;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 22px;
  line-height: 1.3;
}

.certificate-card__content p {
  margin: 0;
  color: rgba(255, 235, 208, 0.7);
  line-height: 1.7;
}

.certificate-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.certificate-card__meta span {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(214, 168, 97, 0.12);
  color: #efc98f;
  font-size: 12px;
  font-weight: 700;
}

.contact-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
  gap: 28px;
  align-items: stretch;
}

.contact-panel__map,
.contact-panel__content {
  position: relative;
  border-radius: 32px;
  overflow: hidden;
}

.contact-panel__map {
  min-height: 720px;
  border: 1px solid rgba(214, 168, 97, 0.2);
  box-shadow: 0 28px 68px rgba(10, 8, 6, 0.2);
}

.contact-panel__map iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.contact-map__marker {
  position: absolute;
  left: 28px;
  right: 28px;
  bottom: 28px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 24px;
  background: rgba(17, 16, 19, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #ffffff;
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 32px rgba(21, 12, 6, 0.28);
  z-index: 10;
}

.contact-map__marker::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 10px;
  height: 1px;
  background: linear-gradient(90deg, rgba(214, 168, 97, 0.3), transparent);
}

.contact-map__brand {
  width: 62px;
  flex-shrink: 0;
}

.contact-map__brand img {
  width: 100%;
  height: auto;
  display: block;
}

.contact-map__label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.contact-map__label strong {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.3;
}

.contact-map__label span {
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
  line-height: 1.5;
}

.contact-panel__content {
  padding: 30px;
  background:
    linear-gradient(180deg, rgba(25, 18, 12, 0.98), rgba(42, 29, 19, 0.98)),
    radial-gradient(circle at top right, rgba(170, 112, 57, 0.18), transparent 32%);
  border: 1px solid rgba(214, 168, 97, 0.14);
  box-shadow:
    0 28px 70px rgba(8, 5, 3, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.contact-info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.contact-info-card {
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(214, 168, 97, 0.14);
}

.contact-info-card span {
  color: #d7a56b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.contact-info-card strong {
  color: rgba(255, 245, 230, 0.92);
  font-size: 16px;
  line-height: 1.55;
}

.capability-form {
  display: grid;
  gap: 16px;
}

.capability-form label {
  display: grid;
  gap: 8px;
}

.capability-form label > span {
  color: rgba(255, 242, 223, 0.92);
  font-size: 13px;
  font-weight: 800;
}

.capability-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.capability-form input,
.capability-form textarea {
  width: 100%;
  border: 1px solid rgba(214, 168, 97, 0.14);
  border-radius: 18px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  color: #fff0d8;
  font: inherit;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.capability-form input::placeholder,
.capability-form textarea::placeholder {
  color: rgba(255, 229, 192, 0.36);
}

.capability-form input:focus,
.capability-form textarea:focus {
  outline: none;
  border-color: rgba(214, 168, 97, 0.32);
  box-shadow: 0 0 0 4px rgba(214, 168, 97, 0.08);
  transform: translateY(-1px);
}

.capability-form textarea {
  resize: vertical;
  min-height: 128px;
}

.capability-form__error {
  margin: 0;
  color: #f2897e;
  font-weight: 700;
}

.capability-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.capability-form__footer p {
  margin: 0;
  color: rgba(255, 235, 208, 0.68);
  line-height: 1.7;
}

.capability-form__footer button {
  min-width: 170px;
  min-height: 50px;
  padding: 0 22px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #731810, #c24726);
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(114, 32, 17, 0.2);
  transition:
    transform 0.25s ease,
    opacity 0.25s ease,
    box-shadow 0.25s ease;
}

.capability-form__footer button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 34px rgba(114, 32, 17, 0.24);
}

.capability-form__footer button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.capability-form__success {
  display: grid;
  gap: 10px;
  padding: 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(214, 168, 97, 0.14);
}

.capability-form__success strong {
  color: #9ee3b4;
  font-size: 18px;
}

.capability-form__success p {
  margin: 0;
  color: rgba(255, 235, 208, 0.68);
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 180px;
  border-radius: 28px;
  border: 1px dashed rgba(214, 168, 97, 0.22);
  color: rgba(255, 235, 208, 0.64);
  background: rgba(255, 255, 255, 0.04);
}

.empty-state--dark {
  border-color: rgba(232, 202, 154, 0.2);
  color: rgba(255, 245, 230, 0.72);
  background: rgba(255, 255, 255, 0.04);
}

@media (max-width: 1199px) {
  .capability-stage--overview,
  .contact-panel {
    grid-template-columns: 1fr;
  }

  .capability-overview__media {
    min-height: 560px;
  }

  .capability-story-grid,
  .capability-grid--certificates,
  .contact-info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 991px) {
  .capability-heading--split,
  .capability-form__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .capability-feature-grid,
  .capability-story-grid,
  .output-grid--light,
  .capability-grid--certificates,
  .contact-info-grid,
  .capability-form__row {
    grid-template-columns: 1fr;
  }

  .capability-feature-card {
    grid-template-columns: 1fr;
  }

  .capability-overview__media {
    min-height: 460px;
  }
}

@media (max-width: 767px) {
  .honors-page__ambience {
    display: none;
  }

  .dots {
    right: 8px;
    gap: 8px;
  }

  .capability-section {
    min-height: auto;
    padding: 48px 0 34px;
  }

  .capability-section::after {
    inset: 16px 12px auto 12px;
  }

  .capability-stage {
    width: calc(100% - 24px);
  }

  .capability-heading h2 {
    font-size: clamp(2rem, 1.5rem + 2vw, 2.8rem);
  }

  .capability-heading p,
  .capability-feature-card p,
  .capability-story-card p,
  .capability-form__footer p {
    font-size: 14px;
  }

  .capability-overview__media {
    min-height: 340px;
    border-radius: 24px;
  }

  .capability-overview__floating-card {
    left: 14px;
    right: 14px;
    bottom: 14px;
    padding: 14px;
    border-radius: 18px;
  }

  .overview-highlight,
  .output-card,
  .contact-panel__content,
  .contact-info-card,
  .capability-story-card,
  .capability-feature-card,
  .certificate-card {
    border-radius: 22px;
  }

  .contact-panel__map {
    min-height: 360px;
    border-radius: 24px;
  }

  .contact-map__marker {
    left: 14px;
    right: 14px;
    bottom: 14px;
    padding: 12px;
    border-radius: 18px;
  }

  .contact-map__brand {
    width: 50px;
  }

  .certificate-filters {
    justify-content: flex-start;
  }

  .certificate-filters button,
  .capability-form__footer button {
    width: 100%;
  }
}
</style>
