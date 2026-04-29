<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AlertCircle, CheckCircle, ChevronRight, ChevronUp, House, Loader2, Send } from 'lucide-vue-next'
import { getContacts } from '@/views/user/services/publicApi'
import { submitInquiry } from '@/views/user/services/productsApi'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import {
  buildGoogleMapsEmbedUrl,
  normalizeGoogleMapUrl,
  parseCoordinateValue,
} from '@/shared/utils/maps'
import { uiState } from '@/shared/utils/uiState'
import { useI18n } from 'vue-i18n'
import logoImage from '@/assets/logo-cty.png'

const { locale, t } = useI18n({ useScope: 'global' })

const route = useRoute()
const bootstrapStore = useBootstrapStore()
const scrollContainer = ref(null)
const activeSection = ref('ctn1')
const animatedSections = ref(['ctn1'])
const contacts = ref([])
const isLoadingContacts = ref(false)
const contactError = ref('')
const contactForm = ref({
  full_name: '',
  email: '',
  phone: '',
  company: '',
  subject: '',
  message: '',
})
const contactFormStatus = ref('idle')
const contactFormError = ref('')

const sections = [
  { id: 'ctn1', label: 'Hero' },
  { id: 'ctn2', label: 'Contact Info' }
]

const contactTabs = [
  { name: 'Liên Hệ Chúng Tôi', path: '/contact#ctn2' },
]

const fallbackMapEmbed = 'https://www.google.com/maps?q=Vietnam&hl=vi&z=6&output=embed'
const defaultLogoUrl = logoImage

const contactIcons = {
  address:
    'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/24d1e273-5c44-4059-923b-bf1dd1e856da.png',
  postalCode:
    'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/e7b9176d-c52b-43c5-ad9a-2d93ac52626e.png',
  phone:
    'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/406b9eba-aff3-4ca2-8e40-6c4443a11476.png',
  email:
    'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/c8bab589-8307-4f7b-92bb-4fddbb9c7003.png'
}

const qrItems = []

const readSetting = (keys, fallback = '') => {
  for (const key of keys) {
    const value = bootstrapStore.settingsMap[key]
    if (value) return value
  }
  return fallback
}

const companyLogoUrl = computed(() => defaultLogoUrl)

const primaryContact = computed(() => {
  if (!contacts.value.length) {
    return null
  }

  return contacts.value.find((item) => item?.is_primary) || contacts.value[0]
})

const companyName = computed(() => {
  const name = primaryContact.value?.name || ''
  if (!name || name.toLowerCase().includes('china national decoration')) {
    return t('user.footer.companyName')
  }
  return name
})

const companyNameLines = computed(() => {
  const name = companyName.value.trim()

  if (name === 'CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ THIÊN ĐỒNG VIỆT NAM') {
    return ['CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ', 'THIÊN ĐỒNG VIỆT NAM']
  }

  if (name.includes(',')) {
    const parts = name
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    return parts.length ? parts : [name]
  }

  return [name]
})

const contactDetails = computed(() => {
  const selectedContact = primaryContact.value

  if (!selectedContact) {
    return []
  }

  const details = []

  if (selectedContact.address) {
    details.push({
      key: 'address',
      label: 'Địa chỉ:',
      value: selectedContact.address,
      icon: contactIcons.address,
    })
  }

  if (selectedContact.postal_code) {
    details.push({
      key: 'postalCode',
      label: 'Mã bưu điện:',
      value: selectedContact.postal_code,
      icon: contactIcons.postalCode,
    })
  }

  if (selectedContact.phone) {
    details.push({
      key: 'phone',
      label: 'SĐT:',
      value: selectedContact.phone,
      href: `tel:${selectedContact.phone}`,
      icon: contactIcons.phone,
    })
  }

  if (selectedContact.email) {
    details.push({
      key: 'email',
      label: 'E-mail:',
      value: selectedContact.email,
      href: `mailto:${selectedContact.email}`,
      icon: contactIcons.email,
    })
  }

  return details
})

const mapEmbed = computed(() => {
  const contact = primaryContact.value
  if (!contact) {
    return fallbackMapEmbed
  }

  const latitude = parseCoordinateValue(contact.latitude, 'lat')
  const longitude = parseCoordinateValue(contact.longitude, 'lng')
  if (latitude !== null && longitude !== null) {
    return buildGoogleMapsEmbedUrl(latitude, longitude, { language: 'vi', zoom: 16 })
  }

  return normalizeGoogleMapUrl(contact.map_url, { language: 'vi', zoom: 16 }) || fallbackMapEmbed
})

const hasContactData = computed(() => Boolean(primaryContact.value && contactDetails.value.length))

const isContactFormValid = computed(() =>
  contactForm.value.full_name.trim() &&
  contactForm.value.email.trim() &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.value.email) &&
  contactForm.value.message.trim()
)

const handleContactSubmit = async () => {
  if (!isContactFormValid.value || contactFormStatus.value === 'loading') return

  contactFormStatus.value = 'loading'
  contactFormError.value = ''

  try {
    await submitInquiry({
      ...contactForm.value,
      subject: contactForm.value.subject.trim() || 'Liên hệ từ trang Contact',
      source_page: 'contact',
    })
    contactForm.value = {
      full_name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: '',
    }
    contactFormStatus.value = 'success'
  } catch (error) {
    contactFormStatus.value = 'error'
    contactFormError.value = error?.message || 'Gửi thất bại. Vui lòng thử lại.'
  }
}

const fetchContactData = async () => {
  isLoadingContacts.value = true
  contactError.value = ''

  try {
    const response = await getContacts()
    contacts.value = Array.isArray(response?.items) ? response.items : []

    if (!contacts.value.length) {
      contactError.value = 'Chưa có dữ liệu liên hệ trong hệ thống.'
    }
  } catch (error) {
    contactError.value = error?.message || 'Không thể tải dữ liệu liên hệ từ máy chủ.'
    contacts.value = []
  } finally {
    isLoadingContacts.value = false
  }
}

const markAnimated = (id) => {
  if (!animatedSections.value.includes(id)) {
    animatedSections.value = [...animatedSections.value, id]
  }
}

const handleScroll = () => {
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

  window.history.replaceState(null, '', `/contact#${id}`)
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

watch(locale, fetchContactData)

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
    uiState.isFooterHidden = false
    window.history.replaceState(null, '', `/contact#${value}`)
  },
  { immediate: true }
)

onMounted(async () => {
  uiState.isFooterHidden = false
  handleScroll()
  await fetchContactData()
  await syncHashSection()
  scrollContainer.value?.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
  uiState.isHeaderHidden = false
  uiState.isFooterHidden = false
})
</script>

<template>
  <div class="contact-clone">
    <aside class="contact-dots" aria-label="Section navigation">
      <button
        v-for="(item, index) in sections"
        :id="`contact-dot-${index}`"
        :key="item.id"
        class="contact-dots__item"
        :class="{ active: activeSection === item.id }"
        type="button"
        :aria-label="`Go to ${item.label}`"
        @click="scrollToSection(item.id)"
      >
        <span></span>
      </button>
    </aside>

    <div ref="scrollContainer" class="contact-scroll">
      <section id="ctn1" class="contact-section contact-hero">
        <picture class="contact-hero__media">
          <source
            srcset="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/bd02907e-9924-4cb1-8464-14da86e29ba9.jpeg"
            media="(max-width: 767px)"
          />
          <img
            src="https://en.sinodecor.com/portal-local/ngc202304190002/cms/image/2d74b3e3-5b31-406a-a3a4-febd62eddcf0.jpg"
            alt="Contact Us"
          />
        </picture>

        <div class="contact-hero__shade"></div>

        <div class="contact-tabbar">
          <div class="contact-tabbar__inner">
            <router-link
              v-for="tab in contactTabs"
              :key="tab.name"
              :to="tab.path"
              class="contact-tabbar__item"
              :class="{ active: tab.name === 'Contact Us' }"
            >
              {{ tab.name }}
            </router-link>
          </div>
        </div>

        <div class="contact-hero__content" :class="{ 'is-visible': animatedSections.includes('ctn1') }">
          <div class="contact-hero__title">
            <div class="fnt-hero">LIÊN HỆ</div>
          </div>
          <div class="contact-hero__line"></div>
          <div class="contact-hero__subtitle">Work together to win the future</div>
        </div>
      </section>

      <section id="ctn2" class="contact-section contact-info-section">
        <img
          class="contact-info-section__bg contact-info-section__bg--photo"
          src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/cc082e2f-9960-4952-9a40-348928fa1711.jpg"
          alt=""
          aria-hidden="true"
        />
        <img
          class="contact-info-section__bg contact-info-section__bg--ink"
          src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/5dce6c21-f652-440e-b4ce-d5cf020ebb60.png"
          alt=""
          aria-hidden="true"
        />

        <div class="contact-info-shell" :class="{ 'is-visible': animatedSections.includes('ctn2') }">
          <div class="contact-breadcrumb">
            <House :size="16" />
            <span>Trang chủ</span>
            <ChevronRight :size="14" />
            <span class="active">Liên hệ</span>
          </div>

          <header class="contact-heading">
            <div class="contact-heading__title">
              <h2>LIÊN HỆ</h2>
            </div>
            <div class="contact-heading__line"></div>
          </header>

          <div class="contact-card">
            <div class="contact-card__text">
              <div class="contact-card__intro">
                <div class="contact-card__intro-copy">
                  <div v-for="(line, index) in companyNameLines" :key="`${line}-${index}`" class="contact-card__company">
                    {{ line }}
                  </div>
                  <div class="contact-card__rule"></div>
                </div>
              </div>

              <div v-if="isLoadingContacts" class="contact-status-card">
                {{ t('user.home.loading') }}
              </div>

              <div v-else-if="contactError && !hasContactData" class="contact-status-card contact-status-card--error">
                {{ contactError }}
              </div>

              <div v-else>
                <div class="contact-details">
                  <component
                    :is="item.href ? 'a' : 'div'"
                    v-for="item in contactDetails"
                    :key="item.key"
                    class="contact-detail"
                    :href="item.href || undefined"
                    :target="item.href?.startsWith('http') ? '_blank' : undefined"
                    :rel="item.href?.startsWith('http') ? 'noopener noreferrer' : undefined"
                  >
                    <img :src="item.icon" :alt="item.label" class="contact-detail__icon" />
                    <span><strong>{{ item.label }}</strong>{{ item.value }}</span>
                  </component>
                </div>

                <p v-if="contactError && hasContactData" class="contact-inline-note">
                  {{ contactError }}
                </p>
              </div>

              <div class="contact-qr">
                <div v-for="item in qrItems" :key="item.label" class="contact-qr__item">
                  <img :src="item.image" :alt="item.label" />
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>

            <div class="contact-card__map">
              <div class="contact-map">
                <iframe :src="mapEmbed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                <div v-if="primaryContact" class="contact-map__marker">
                  <div class="contact-map__brand">
                    <img :src="logoImage" :alt="primaryContact.name || 'Company logo'" />
                  </div>
                  <div class="contact-map__label">
                    <strong>{{ companyName }}</strong>
                    <span>{{ primaryContact.address || 'Địa chỉ đang được cập nhật.' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-form-panel">
            <div class="contact-form-panel__header">
              <p class="contact-form-panel__eyebrow">Mẫu liên hệ</p>
              <h3 class="contact-form-panel__title">Gửi yêu cầu liên hệ</h3>
              <p class="contact-form-panel__desc">
                Điền thông tin bên dưới, chúng tôi sẽ phản hồi qua email hoặc số điện thoại của bạn.
              </p>
            </div>

            <form v-if="contactFormStatus !== 'success'" class="contact-form" @submit.prevent="handleContactSubmit" novalidate>
              <div class="contact-form__row">
                <div class="contact-field">
                  <label for="contact-name">Họ và tên <span class="req">*</span></label>
                  <input id="contact-name" v-model="contactForm.full_name" type="text" placeholder="Nguyễn Văn A" :disabled="contactFormStatus === 'loading'" autocomplete="name" required />
                </div>
                <div class="contact-field">
                  <label for="contact-email">Email <span class="req">*</span></label>
                  <input id="contact-email" v-model="contactForm.email" type="email" placeholder="email@example.com" :disabled="contactFormStatus === 'loading'" autocomplete="email" required />
                </div>
              </div>

              <div class="contact-form__row">
                <div class="contact-field">
                  <label for="contact-phone">Số điện thoại</label>
                  <input id="contact-phone" v-model="contactForm.phone" type="tel" placeholder="0901 234 567" :disabled="contactFormStatus === 'loading'" autocomplete="tel" />
                </div>
                <div class="contact-field">
                  <label for="contact-company">Công ty / Tổ chức</label>
                  <input id="contact-company" v-model="contactForm.company" type="text" placeholder="Tên công ty của bạn" :disabled="contactFormStatus === 'loading'" autocomplete="organization" />
                </div>
              </div>

              <div class="contact-field">
                <label for="contact-subject">Chủ đề</label>
                <input id="contact-subject" v-model="contactForm.subject" type="text" placeholder="Nhập chủ đề liên hệ" :disabled="contactFormStatus === 'loading'" />
              </div>

              <div class="contact-field contact-field--full">
                <label for="contact-message">Nội dung <span class="req">*</span></label>
                <textarea id="contact-message" v-model="contactForm.message" rows="5" placeholder="Mô tả nhu cầu, sản phẩm quan tâm, thời gian cần phản hồi..." :disabled="contactFormStatus === 'loading'" required />
              </div>

              <div v-if="contactFormStatus === 'error'" class="contact-form__alert contact-form__alert--error">
                <AlertCircle :size="16" />
                <span>{{ contactFormError }}</span>
              </div>

              <div class="contact-form__footer">
                <p class="contact-form__note">Thông tin của bạn sẽ được chuyển đến bộ phận phụ trách liên hệ.</p>
                <button type="submit" class="contact-form__submit" :disabled="!isContactFormValid || contactFormStatus === 'loading'">
                  <Loader2 v-if="contactFormStatus === 'loading'" :size="16" class="spin" />
                  <Send v-else :size="16" />
                  {{ contactFormStatus === 'loading' ? 'Đang gửi...' : 'Gửi liên hệ' }}
                </button>
              </div>
            </form>

            <div v-else class="contact-form__success">
              <CheckCircle :size="22" />
              <div>
                <strong>Đã gửi thành công.</strong>
                <p>Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>

    <button
      class="contact-backtop"
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
.contact-clone {
  position: relative;
  background: #f5f1ea;
}

.contact-scroll {
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  /* Hide scrollbar */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

.contact-section {
  position: relative;
}

.contact-dots {
  position: fixed;
  top: 50%;
  right: 14px;
  z-index: 35;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transform: translateY(-50%);
}

.contact-dots__item {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.contact-dots__item span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(198, 17, 29, 0.55);
  transition: all 0.2s ease;
}

.contact-dots__item.active span,
.contact-dots__item:hover span {
  width: 10px;
  height: 10px;
  background: #d7000f;
}

.contact-hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.contact-hero__media,
.contact-hero__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.contact-hero__media img {
  object-fit: cover;
}

.contact-hero__shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(10, 16, 29, 0.34) 0%, rgba(10, 16, 29, 0.08) 36%, rgba(10, 16, 29, 0.22) 100%),
    linear-gradient(90deg, rgba(18, 24, 36, 0.54) 0%, rgba(18, 24, 36, 0.14) 48%, rgba(18, 24, 36, 0.04) 100%);
}

.contact-tabbar {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 3;
  width: 100%;
  background: linear-gradient(180deg, rgba(14, 22, 38, 0) 0%, rgba(14, 22, 38, 0.56) 42%, rgba(14, 22, 38, 0.88) 100%);
}

.contact-tabbar__inner {
  width: min(1600px, calc(100% - 12px));
  margin: 0 auto;
  display: flex;
  background: rgba(18, 31, 56, 0.88);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 42px rgba(8, 13, 22, 0.22);
}

.contact-tabbar__item {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.84);
  text-decoration: none;
  font-size: 22px;
  transition: background 0.25s ease, color 0.25s ease;
}

.contact-tabbar__item:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 1px;
  height: 18px;
  background: rgba(244, 214, 164, 0.92);
  transform: translateY(-50%);
}

.contact-tabbar__item.active,
.contact-tabbar__item:hover {
  background: #f1000c;
  color: #ffffff;
}

.contact-hero__content {
  position: relative;
  z-index: 2;
  width: 100%;
  margin: 136px 0 170px;
  text-align: left;
  opacity: 0;
  transform: translateY(42px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.contact-hero__content.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.contact-hero__title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  margin-left: clamp(120px, 10vw, 190px);
  margin-bottom: 18px;
}

.fnt-hero {
  color: #ffffff;
  font-family: 'Times New Roman', serif;
  font-size: clamp(4rem, 3.1rem + 2vw, 5rem);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.contact-hero__title img {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.contact-hero__line,
.contact-heading__line {
  position: relative;
  width: min(830px, 58vw);
  height: 1px;
  background: #d7000f;
}

.contact-hero__line::before,
.contact-hero__line::after,
.contact-heading__line::before,
.contact-heading__line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d7000f;
  transform: translateY(-50%);
}

.contact-hero__line::before,
.contact-heading__line::before {
  left: -1px;
}

.contact-hero__line::after,
.contact-heading__line::after {
  right: -1px;
}

.contact-hero__subtitle {
  margin-top: 68px;
  margin-left: clamp(120px, 10vw, 190px);
  color: #ffffff;
  font-size: 30px;
  letter-spacing: 0;
}

.contact-info-section {
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(245, 241, 234, 0.98) 0%, rgba(255, 255, 255, 0.98) 40%, rgba(246, 243, 238, 0.98) 100%),
    #f8f4ee;
}

.contact-info-section__bg {
  position: absolute;
  pointer-events: none;
}

.contact-info-section__bg--photo {
  top: 0;
  left: 0;
  width: 78px;
  height: 182px;
  object-fit: cover;
  object-position: left top;
  opacity: 1;
}

.contact-info-section__bg--ink {
  right: 0;
  top: 0;
  width: min(18vw, 260px);
  opacity: 0.13;
}

.contact-info-section::before,
.contact-info-section::after {
  content: '';
  position: absolute;
  left: 0;
  pointer-events: none;
}

.contact-info-section::before {
  top: 182px;
  width: 78px;
  height: 116px;
  background: #bb000f;
}

.contact-info-section::after {
  bottom: 0;
  width: 78px;
  height: 10px;
  background: #c40011;
}

.contact-info-shell {
  position: relative;
  z-index: 2;
  width: min(1600px, calc(100% - 84px));
  margin: 0 auto;
  padding: 74px 0 82px;
  opacity: 0;
  transform: translateY(36px);
  transition: opacity 0.85s ease, transform 0.85s ease;
}

.contact-info-shell.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.contact-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 82px;
  color: #909090;
  font-size: 14px;
}

.contact-breadcrumb .active {
  color: #d7000f;
}

.contact-heading {
  margin-top: 44px;
  text-align: center;
}

.contact-heading__title {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  color: #202020;
}

.contact-heading__title h2 {
  margin: 0;
  font-family: 'Times New Roman', serif;
  font-size: clamp(2.6rem, 2rem + 0.95vw, 3.3rem);
  font-weight: 700;
  letter-spacing: 0;
}

.contact-heading img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.contact-heading__line {
  margin: 17px auto 0;
  width: min(244px, 35vw);
}

.contact-card {
  position: relative;
  margin: 34px auto 0;
  width: min(1460px, calc(100% - 120px));
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.15fr);
  gap: 46px;
  align-items: stretch;
  padding: 26px 30px 22px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(207, 197, 184, 0.72);
  box-shadow: 0 10px 30px rgba(77, 61, 43, 0.08);
}

.contact-card__text {
  padding: 0;
}

.contact-card__intro {
  display: flex;
  align-items: center;
  gap: 22px;
  margin-bottom: 26px;
}

.contact-card__logo {
  width: 74px;
  flex-shrink: 0;
}

.contact-card__logo img {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.contact-card__intro-copy {
  flex: 1;
}

.contact-card__company {
  color: #33302d;
  font-size: 25px;
  line-height: 1.05;
  font-family: 'Times New Roman', serif;
}

.contact-card__rule {
  width: min(214px, 100%);
  height: 1px;
  margin-top: 12px;
  background: linear-gradient(90deg, #ff2633 0%, rgba(163, 163, 163, 0.85) 48%, rgba(163, 163, 163, 0.35) 100%);
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 420px;
}

.contact-detail {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  color: #5e5043;
  font-size: 15px;
  line-height: 1.55;
  text-decoration: none;
}

.contact-detail strong {
  font-weight: 400;
}

.contact-detail__icon {
  width: 17px;
  height: 17px;
  margin-top: 4px;
  object-fit: contain;
  flex-shrink: 0;
}

.contact-qr {
  display: flex;
  gap: 22px;
  margin-top: 30px;
}

.contact-status-card {
  padding: 16px 18px;
  border-radius: 16px;
  background: rgba(245, 241, 234, 0.9);
  border: 1px solid rgba(207, 197, 184, 0.82);
  color: #5e5043;
  font-size: 15px;
  line-height: 1.6;
}

.contact-status-card--error {
  background: rgba(255, 240, 240, 0.92);
  border-color: rgba(205, 81, 81, 0.26);
  color: #a12d2d;
}

.contact-inline-note {
  margin: 14px 0 0;
  color: #a12d2d;
  font-size: 13px;
  line-height: 1.5;
}

.contact-qr__item {
  width: 56px;
  text-align: center;
}

.contact-qr__item img {
  width: 100%;
  display: block;
}

.contact-qr__item span {
  display: block;
  margin-top: 7px;
  color: #615447;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
}

.contact-card__map {
  min-height: 278px;
}

.contact-form-panel {
  margin-top: 34px;
  padding: 28px;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 245, 240, 0.98));
  box-shadow: 0 18px 44px rgba(23, 30, 46, 0.08);
  border: 1px solid rgba(215, 0, 15, 0.08);
}

.contact-form-panel__header {
  margin-bottom: 18px;
}

.contact-form-panel__eyebrow {
  margin: 0 0 6px;
  color: #d7000f;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.contact-form-panel__title {
  margin: 0;
  color: #202020;
  font-family: 'Times New Roman', serif;
  font-size: clamp(1.7rem, 1.3rem + 0.8vw, 2.4rem);
}

.contact-form-panel__desc {
  margin: 8px 0 0;
  color: #6a5f54;
  line-height: 1.6;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-form__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.contact-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-field--full {
  grid-column: 1 / -1;
}

.contact-field label {
  color: #202020;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.contact-field input,
.contact-field textarea {
  width: 100%;
  border: 1px solid rgba(215, 0, 15, 0.16);
  border-radius: 16px;
  padding: 14px 16px;
  background: #fff;
  color: #1f2735;
  font: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.contact-field textarea {
  resize: vertical;
  min-height: 150px;
}

.contact-field input:focus,
.contact-field textarea:focus {
  border-color: rgba(215, 0, 15, 0.5);
  box-shadow: 0 0 0 4px rgba(215, 0, 15, 0.08);
}

.contact-form__alert {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 14px;
  font-size: 14px;
}

.contact-form__alert--error {
  background: rgba(215, 0, 15, 0.08);
  color: #b40e1a;
}

.contact-form__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.contact-form__note {
  margin: 0;
  color: #6a5f54;
  font-size: 14px;
}

.contact-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 160px;
  border: 0;
  border-radius: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #d7000f, #b40012);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 12px 30px rgba(215, 0, 15, 0.18);
}

.contact-form__submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.contact-form__success {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 16px;
  background: rgba(20, 158, 77, 0.08);
  color: #186a3b;
}

.contact-form__success p {
  margin: 4px 0 0;
  color: inherit;
}

.contact-map {
  position: relative;
  height: 100%;
  min-height: 278px;
  overflow: hidden;
  border: 1px solid #d2a66b;
  border-radius: 26px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.32);
}

.contact-map iframe {
  width: 100%;
  height: 100%;
  border: 0;
}

.contact-map__marker {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(25px, -50%);
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
  max-width: 300px;
  padding: 10px 14px;
  background: rgba(190, 145, 92, 0.94);
  color: #ffffff;
  box-shadow: 0 12px 24px rgba(88, 58, 28, 0.25);
  pointer-events: none;
  border-radius: 4px;
}

.contact-map__marker::after {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 10px solid rgba(190, 145, 92, 0.94);
}

.contact-map__brand {
  width: 54px;
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
  gap: 1px;
  font-size: 11px;
  line-height: 1.3;
}

.contact-map__label strong {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 2px;
}

.contact-footer-section {
  scroll-snap-align: none;
}

.contact-footer-section :deep(.footer) {
  padding-top: 0;
}

.contact-backtop {
  position: fixed;
  right: 12px;
  bottom: 18px;
  z-index: 35;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(31, 38, 51, 0.92);
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(9, 13, 20, 0.2);
  cursor: pointer;
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease, background 0.25s ease;
}

.contact-backtop.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.contact-backtop:hover {
  background: #c9a37d;
}

@media (max-width: 1366px) {
  .contact-card {
    width: min(1420px, calc(100% - 80px));
    gap: 34px;
  }

  .contact-map__marker {
    left: 72px;
  }
}

@media (max-width: 1199px) {
  .contact-info-shell {
    width: calc(100% - 36px);
    padding: 72px 0 58px;
  }

  .contact-breadcrumb {
    padding-left: 0;
  }

  .contact-card {
    width: 100%;
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 24px;
  }

  .contact-card__map,
  .contact-map {
    min-height: 380px;
  }

  .contact-map__marker {
    left: 30px;
    top: 30px;
  }

  .contact-form-panel {
    padding: 22px;
  }
}

@media (max-width: 767px) {
  .contact-scroll {
    height: auto;
    overflow: visible;
    scroll-snap-type: none;
  }

  .contact-dots {
    display: none;
  }

  .contact-hero {
    min-height: 88vh;
  }

  .contact-tabbar__inner {
    width: calc(100% - 16px);
    flex-wrap: wrap;
  }

  .contact-tabbar__item {
    flex: 1 1 100%;
    min-height: 62px;
    font-size: 14px;
    padding: 0 12px;
    text-align: center;
  }

  .contact-hero__content {
    width: calc(100% - 24px);
    margin: 116px auto 104px;
  }

  .fnt-hero {
    font-size: 2.55rem;
  }

  .contact-hero__title {
    gap: 12px;
    margin-left: 12px;
  }

  .contact-hero__title img {
    width: 34px;
    height: 34px;
  }

  .contact-hero__line {
    width: min(360px, 92vw);
  }

  .contact-hero__subtitle {
    margin-top: 28px;
    margin-left: 12px;
    font-size: 16px;
  }

  .contact-info-section__bg--photo {
    width: 88px;
    height: 168px;
  }

  .contact-info-section::before {
    top: 52px;
    width: 52px;
    height: 168px;
  }

  .contact-info-section::after {
    width: 52px;
  }

  .contact-info-shell {
    width: calc(100% - 20px);
    padding: 64px 0 42px;
  }

  .contact-breadcrumb {
    font-size: 12px;
  }

  .contact-heading {
    margin-top: 26px;
  }

  .contact-heading__title {
    gap: 10px;
  }

  .contact-heading__title h2 {
    font-size: 2rem;
  }

  .contact-heading img {
    width: 28px;
    height: 28px;
  }

  .contact-heading__line {
    width: 200px;
  }

  .contact-card {
    margin-top: 24px;
    padding: 18px;
    gap: 22px;
    width: 100%;
  }

  .contact-card__intro {
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 22px;
  }

  .contact-card__logo {
    width: 52px;
  }

  .contact-card__company {
    font-size: 19px;
  }

  .contact-card__rule {
    width: 150px;
    margin-top: 10px;
  }

  .contact-detail {
    gap: 10px;
    font-size: 14px;
  }

  .contact-qr {
    gap: 16px;
  }

  .contact-qr__item {
    width: 54px;
  }

  .contact-card__map,
  .contact-map {
    min-height: 320px;
  }

  .contact-form-panel {
    margin-top: 24px;
    padding: 18px;
    border-radius: 20px;
  }

  .contact-form__row {
    grid-template-columns: 1fr;
  }

  .contact-form__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .contact-form__submit {
    width: 100%;
  }

  .contact-map {
    border-radius: 20px;
  }

  .contact-map__marker {
    left: 14px;
    right: 14px;
    top: 14px;
    transform: none;
    min-width: 0;
    max-width: none;
    padding: 12px;
  }

  .contact-map__marker::after {
    left: 26px;
  }

  .contact-map__brand {
    width: 64px;
  }

  .contact-map__label strong {
    font-size: 13px;
  }

  .contact-map__label {
    font-size: 11px;
  }

  .contact-backtop {
    right: 10px;
    bottom: 10px;
    width: 34px;
    height: 34px;
  }
}
</style>

