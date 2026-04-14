<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, ChevronUp, House } from 'lucide-vue-next'
import AppFooter from '@/client/components/layout/AppFooter.vue'
import { uiState } from '@/utils/uiState'

const route = useRoute()
const scrollContainer = ref(null)
const activeSection = ref('ctn1')
const animatedSections = ref(['ctn1'])

const sections = [
  { id: 'ctn1', label: 'Hero' },
  { id: 'ctn2', label: 'Contact Info' }
]

const contactTabs = [
  { name: 'Contact Us', path: '/contact#ctn2' },
  { name: 'Subsidiary', path: '/subsidiary' },
  { name: 'Branch', path: '/branch' },
  { name: 'Join Us', path: '/join-us' }
]

const companyInfo = {
  name: 'China National Decoration Co.,Ltd',
  address: '5F, Block C, Hehuamingcheng Building, No.7 Jianguomen South Street, Dongcheng District, Beijing',
  postalCode: '100005',
  phone: '010-65269998',
  email: 'CNDC@sinodecor.com'
}

const contactDetails = [
  {
    key: 'address',
    label: 'Address:',
    value: companyInfo.address,
    href: 'https://map.baidu.com/poi/%E8%8D%B7%E5%8D%8E%E6%98%8E%E5%9F%8E%E5%A4%A7%E5%8E%A6-C%E5%BA%A7/@12962304.37,4825324.01,17z?uid=66332e4f3e1ae3326040a9c3&ugc_type=3&ugc_ver=1&device_ratio=1&compat=1&pcevaname=pc4.1&querytype=detailConInfo&da_src=shareurl',
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/24d1e273-5c44-4059-923b-bf1dd1e856da.png'
  },
  {
    key: 'postalCode',
    label: 'Postal Code:',
    value: companyInfo.postalCode,
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/e7b9176d-c52b-43c5-ad9a-2d93ac52626e.png'
  },
  {
    key: 'phone',
    label: 'Tel:',
    value: companyInfo.phone,
    href: `tel:${companyInfo.phone}`,
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/406b9eba-aff3-4ca2-8e40-6c4443a11476.png'
  },
  {
    key: 'email',
    label: 'E-mail:',
    value: companyInfo.email,
    href: `mailto:${companyInfo.email}`,
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/c8bab589-8307-4f7b-92bb-4fddbb9c7003.png'
  }
]

const qrItems = [
  {
    label: 'å®˜æ–¹å¾®åš',
    image:
      'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/7bf73994-265a-4dd7-82a5-da95de2d899b.png'
  },
  {
    label: 'å®˜æ–¹å¾®ä¿¡',
    image:
      'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/dd0e6fc9-5acf-455b-9d5b-ab546cee1f2f.png'
  }
]

const mapEmbed =
  'https://www.openstreetmap.org/export/embed.html?bbox=116.4378%2C39.9087%2C116.4439%2C39.9124&layer=mapnik&marker=39.910466%2C116.44079'

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

onMounted(() => {
  uiState.isFooterHidden = false
  handleScroll()
  syncHashSection()
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
            <div class="fnt-hero">CONTACT US</div>
            <img
              src="https://omo-oss-image.thefastimg.com/portal-saas/ngc202303290005/cms/image/53e45437-3eaa-453a-87e7-5d86b6f29064.png"
              alt="Accent"
            />
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
            <span>Home</span>
            <ChevronRight :size="14" />
            <span class="active">Contact Us</span>
          </div>

          <header class="contact-heading">
            <div class="contact-heading__title">
              <h2>CONTACT US</h2>
              <div class="contact-heading__line"></div>
            </div>
            <img
              src="https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/bd97f2ca-79a8-43ee-8efa-5b6056d5b1c1.png"
              alt="Accent"
            />
          </header>

          <div class="contact-card">
            <div class="contact-card__text">
              <div class="contact-card__intro">
                <div class="contact-card__logo">
                  <img
                    src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/2e50aaed-5aa3-47dd-9440-414b3ee2128c.png"
                    alt="China Decor mark"
                  />
                </div>
                <div class="contact-card__intro-copy">
                  <div class="contact-card__company">China National Decoration</div>
                  <div class="contact-card__company">Co.,Ltd</div>
                  <div class="contact-card__rule"></div>
                </div>
              </div>

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
                <div class="contact-map__marker">
                  <div class="contact-map__brand">
                    <img src="/images/logo.png" alt="China Decor" />
                  </div>
                  <div class="contact-map__label">
                    <strong>ä¸­å›½è£…é¥°è‚¡ä»½æœ‰é™å…¬å¸</strong>
                    <span>China National Decoration Co.,Ltd</span>
                  </div>
                </div>
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
  scroll-snap-type: y mandatory;
}

.contact-section {
  position: relative;
  scroll-snap-align: start;
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
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: rgba(18, 31, 56, 0.88);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 42px rgba(8, 13, 22, 0.22);
}

.contact-tabbar__item {
  position: relative;
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
  left: 126px;
  top: 54px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 288px;
  max-width: 330px;
  padding: 14px 16px;
  background: rgba(190, 145, 92, 0.96);
  color: #ffffff;
  box-shadow: 0 16px 28px rgba(88, 58, 28, 0.2);
}

.contact-map__marker::after {
  content: '';
  position: absolute;
  left: 34px;
  bottom: -12px;
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 12px solid rgba(190, 145, 92, 0.96);
}

.contact-map__brand {
  width: 86px;
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
  gap: 2px;
  font-size: 12px;
  line-height: 1.38;
}

.contact-map__label strong {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .contact-tabbar__item {
    min-height: 62px;
    font-size: 14px;
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

  .contact-map {
    border-radius: 20px;
  }

  .contact-map__marker {
    left: 14px;
    right: 14px;
    top: 14px;
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

