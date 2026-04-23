<script setup>
import { computed } from 'vue'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import { findMenuItems, normalizeMenuItems, toLinkProps } from '@/shared/utils/navigation'
import { uiState } from '@/shared/utils/uiState'
import logoImage from '@/assets/logo-cty.png'

const props = defineProps({
  forceVisible: {
    type: Boolean,
    default: false
  }
})

const isHidden = computed(() => !props.forceVisible && uiState.isFooterHidden)
const bootstrapStore = useBootstrapStore()

const fallbackFooterGroups = [
  {
    title: 'Giới Thiệu',
    titlePath: '/about/company-introduction',
    links: [
      { name: 'Tổng Quan Công Ty', path: '/about/company-introduction' },
      { name: 'Lịch Sử Phát Triển', path: '/about/development-course' },
      { name: 'Tầm Nhìn & Sứ Mệnh', path: '/about/corporate-culture' },
      { name: 'Giá Trị Cốt Lõi', path: '/about/corporate-culture' },
      { name: 'Ban Lãnh Đạo', path: '/about/leadership-care' },
      { name: 'Sơ Đồ Tổ Chức', path: '/about/organization-chart' },
    ],
  },
  {
    title: 'Năng Lực',
    titlePath: '/honors',
    links: [
      { name: 'Hình Ảnh Nhà Máy', path: '/honors' },
      { name: 'Công Nghệ Sản Xuất', path: '/honors' },
      { name: 'Chứng Nhận ISO & CE', path: '/honors' },
    ],
  },
  {
    title: 'Sản Phẩm',
    titlePath: '/products',
    links: [
      { name: 'Danh Mục Sản Phẩm', path: '/products' },
    ],
  },
  {
    title: 'Dự Án',
    titlePath: '/project-case',
    links: [
      { name: 'Dự Án Tiêu Biểu', path: '/project-case' },
    ],
  },
  {
    title: 'Tin Tức',
    titlePath: '/news',
    links: [
      { name: 'Tin Tức Mới Nhất', path: '/news' },
    ],
  },
  {
    title: 'Liên Hệ',
    titlePath: '/contact',
    links: [
      { name: 'Liên Hệ Chúng Tôi', path: '/contact' },
    ],
  },
]

const readSetting = (keys, fallback = '') => {
  for (const key of keys) {
    const value = bootstrapStore.settingsMap[key]
    if (value) {
      return value
    }
  }

  return fallback
}

const toAddressLines = (value, fallbackLines) => {
  if (!value) {
    return fallbackLines
  }

  return String(value)
    .split(/\r?\n|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const headerMenuItems = computed(() =>
  normalizeMenuItems(
    findMenuItems(bootstrapStore.menus, ['header', 'main', 'primary', 'nav', 'navigation', 'top'])
  )
)

const footerMenuItems = computed(() =>
  normalizeMenuItems(findMenuItems(bootstrapStore.menus, ['footer', 'bottom', 'secondary']))
)

const footerGroups = computed(() => {
  const sourceItems = footerMenuItems.value.length ? footerMenuItems.value : headerMenuItems.value

  if (!sourceItems.length) {
    return fallbackFooterGroups
  }

  return sourceItems.map((item) => ({
    title: item.name,
    titlePath: item.path,
    titleExternal: item.external,
    titleTarget: item.target,
    links: (item.children?.length ? item.children : [item]).map((child) => ({
      name: child.name,
      path: child.path,
      external: child.external,
      target: child.target,
    })),
  }))
})

const socialItems = []

const defaultLogoUrl = logoImage
const siteName = computed(() =>
  readSetting(
    ['site_name', 'company_name'],
    'CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ THIÊN ĐỒNG VIỆT NAM',
  ),
)
const siteTagline = computed(() =>
  readSetting(['site_tagline', 'company_slogan'], 'UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT'),
)
const companyLogoUrl = computed(() => defaultLogoUrl)

const contactItems = computed(() => {
  const fallbackAddressLines = [
    'Địa chỉ: 52 Ấp Đồng Chinh, Phước Hòa,',
    'Huyện Phú Giáo, Tỉnh Bình Dương'
  ]
  const fallbackPhone = '0948.929.744'
  const fallbackEmail = 'thiendongintl@gmail.com'

  const address = readSetting(['company_address', 'address'], '')
  const addressUrl = readSetting(
    ['company_map_url', 'map_url'],
    'https://map.baidu.com/poi/%E8%8D%B7%E5%8D%8E%E6%98%8E%E5%9F%8E%E5%A4%A7%E5%8E%A6-C%E5%BA%A7/@12962304.37,4825324.01,17z?uid=66332e4f3e1ae3326040a9c3&ugc_type=3&ugc_ver=1&device_ratio=1&compat=1&pcevaname=pc4.1&querytype=detailConInfo&da_src=shareurl'
  )
  const phone = readSetting(['company_phone', 'contact_phone', 'phone'], fallbackPhone)
  const email = readSetting(['company_email', 'contact_email', 'email'], fallbackEmail)

  return [
    {
      id: 'address',
      href: addressUrl,
      external: true,
      icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/72384eda-85c5-448d-91bb-451ba699887a.png',
      lines: toAddressLines(address, fallbackAddressLines),
    },
    {
      id: 'phone',
      href: `tel:${phone}`,
      icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/31d75566-b8ab-42d0-9b35-630efac0ef74.png',
      text: `SĐT:${phone}`,
    },
    {
      id: 'email',
      href: `mailto:${email}`,
      icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/63634a49-8e79-496c-801f-36592f0d3431.png',
      text: `E-mail:${email}`,
    },
  ]
})

const legalLinks = computed(() => [
  { name: 'Liên Hệ', path: '/contact' },
])

const copyrightText = computed(
  () => readSetting(['copyright_text'], `Bản quyền © ${siteName.value}`)
)
const technicalSupportText = computed(
  () => readSetting(['technical_support_text'], `Hỗ trợ kỹ thuật: ${siteTagline.value}`)
)
const beianText = computed(() => readSetting(['beian_text'], ''))
const beianHref = computed(() =>
  readSetting(['beian_url'], 'https://beian.miit.gov.cn/#/Integrated/index')
)
const getLinkProps = (item) => toLinkProps(item)
</script>

<template>
  <footer class="footer" :class="{ 'is-hidden': isHidden }">
    <div class="footer__topline"></div>

    <div class="footer__shell">
      <div class="footer__bg footer__bg--top" aria-hidden="true"></div>
      <div class="footer__bg footer__bg--bottom" aria-hidden="true"></div>

      <div class="footer__container">
        <div class="foot_top">
          <div class="foot_left">
            <router-link id="footer-logo-link" class="foot_logo" to="/">
              <img
                :src="logoImage"
                :alt="siteName"
                loading="lazy"
              />
            </router-link>
            <div class="foot_brand">
              <strong>{{ siteName }}</strong>
              <span>{{ siteTagline }}</span>
            </div>

            <div class="share">
              <a
                v-for="item in socialItems"
                :id="`footer-social-${item.name}`"
                :key="item.name"
                :href="item.href"
                class="share__item"
                :class="{ 'has-qr': item.qr }"
                :target="item.href.startsWith('http') ? '_blank' : undefined"
                :rel="item.href.startsWith('http') ? 'noopener noreferrer' : undefined"
                :aria-label="item.name"
              >
                <img :src="item.icon" :alt="item.name" loading="lazy" />
                <span v-if="item.qr" class="share__qr">
                  <img :src="item.qr" :alt="`${item.name} qr`" />
                </span>
              </a>
            </div>

            <div class="foot_contact">
              <a
                v-for="item in contactItems"
                :id="`footer-contact-${item.id}`"
                :key="item.id"
                class="foot_contact__item"
                :href="item.href"
                :target="item.external ? '_blank' : undefined"
                :rel="item.external ? 'noopener noreferrer' : undefined"
              >
                <img :src="item.icon" :alt="item.id" class="foot_contact__icon" loading="lazy" />

                <span v-if="item.lines" class="foot_contact__text foot_contact__text--stacked">
                  <span v-for="line in item.lines" :key="line">{{ line }}</span>
                </span>

                <span v-else class="foot_contact__text">{{ item.text }}</span>
              </a>
            </div>
          </div>

          <div class="foot_nav">
            <div v-for="group in footerGroups" :key="group.title" class="foot_nav__group">
              <component
                :id="`footer-group-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`"
                :is="group.titleExternal ? 'a' : 'router-link'"
                v-bind="getLinkProps({ path: group.titlePath, external: group.titleExternal, target: group.titleTarget })"
                class="foot_nav_tit"
              >
                {{ group.title }}
              </component>

              <div class="foot_nav__accent"></div>

              <div class="colum_two">
                <div v-for="link in group.links" :key="link.name">
                  <component
                    :id="`footer-link-${link.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`"
                    :is="link.external ? 'a' : 'router-link'"
                    v-bind="getLinkProps(link)"
                  >
                    {{ link.name }}
                  </component>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer__wave" aria-hidden="true"></div>

        <div class="foot_btm">
        <div class="friends_lk">
          <div v-for="link in legalLinks" :key="link.name">
            <component
              :id="`footer-legal-${link.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`"
              :is="link.external ? 'a' : 'router-link'"
              v-bind="getLinkProps(link)"
            >
              {{ link.name }}
            </component>
          </div>
        </div>

        <div class="foot_btm__meta">
          <span>{{ copyrightText }}</span>
          <a
            id="footer-beian"
            :href="beianHref"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ beianText }}
          </a>
          <span class="foot_btm__tagline">{{ siteTagline }}</span>
          <span>{{ technicalSupportText }}</span>
        </div>
      </div>
    </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  overflow: hidden;
  background: #1d283d;
  color: rgba(203, 210, 222, 0.68);
}

.footer.is-hidden {
  display: none !important;
}

.footer__topline {
  height: 4px;
  background: #ee1324;
}

.footer__shell {
  position: relative;
  background: #1d283d;
}

.footer__bg {
  position: absolute;
  left: 0;
  pointer-events: none;
  background: url('https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/5dce6c21-f652-440e-b4ce-d5cf020ebb60.png')
    no-repeat;
  background-size: contain;
}

.footer__bg--top {
  top: 8px;
  width: 378px;
  height: 216px;
  opacity: 0.21;
  background-position: left top;
}

.footer__bg--bottom {
  left: -12px;
  bottom: 64px;
  width: 355px;
  height: 168px;
  opacity: 0.16;
  background-position: left bottom;
  transform: scaleY(-1);
}

.footer__container {
  position: relative;
  z-index: 1;
  width: min(1600px, calc(100% - 4px));
  margin: 0 auto;
  padding: 24px 58px 0;
}
.foot_top {
  display: grid;
  grid-template-columns: 320px 1fr; /* Rộng hơn cho phần bên trái */
  gap: 40px 80px;
  min-height: auto;
}

.foot_left {
  min-width: 0;
}

.foot_logo {
  display: inline-flex;
  width: 178px;
}

.foot_logo img {
  display: block;
  width: 100%;
  height: auto;
}

.foot_brand {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    color: #ffffff;
    font-size: 13px; /* Giảm từ 14px xuống 13px */
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.01em;
  }

  span {
    color: #d4b58a;
    font-size: 10px; /* Giảm từ 11px xuống 10px */
    font-weight: 500;
    line-height: 1.3;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
}

.share {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.share__item {
  position: relative;
  display: inline-flex;
  width: 40px;
  height: 40px;
  transition: transform 0.24s ease, filter 0.24s ease;
}

.share__item:hover {
  transform: scale(1.08);
  filter: brightness(1.06);
}

.share__item > img {
  display: block;
  width: 100%;
  height: 100%;
}

.share__qr {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  width: 106px;
  padding: 6px;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(8px);
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.share__qr::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 10px;
  height: 10px;
  background: #ffffff;
  transform: translateX(-50%) rotate(45deg);
}

.share__qr img {
  display: block;
  width: 100%;
  border-radius: 6px;
}

.share__item.has-qr:hover .share__qr {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.foot_contact {
  gap: 6px;
  margin-top: 16px;
  max-width: 218px;
}

.foot_contact__item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: rgba(201, 208, 220, 0.64);
  text-decoration: none;
  font-size: 12px;
  line-height: 1.55;
  transition: color 0.24s ease;
}

.foot_contact__item:hover {
  color: rgba(255, 255, 255, 0.9);
}

.foot_contact__icon {
  width: 13px;
  height: 13px;
  margin-top: 2px;
  flex-shrink: 0;
}

.foot_contact__text {
  display: inline-block;
}

.foot_contact__text--stacked {
  display: flex;
  flex-direction: column;
}

.foot_nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)); /* Giảm từ 6 xuống 4 cột cho đặc hơn */
  gap: 30px 40px;
  padding-top: 4px;
}

.foot_nav__group {
  min-width: 0;
}

.foot_nav_tit {
  color: #d8b581;
  text-decoration: none;
  font-size: 14px; /* Giảm từ 15px xuống 14px */
  font-weight: 600;
  line-height: 1.4;
  transition: color 0.24s ease;
}

.foot_nav_tit:hover {
  color: #f1cc97;
}

.foot_nav__accent {
  width: 23px;
  height: 2px;
  margin: 8px 0 10px;
  background: #e6081d;
}

.colum_two {
  display: grid;
  gap: 6px; /* Giảm từ 10px xuống 6px */
}

.colum_two a {
  color: rgba(194, 202, 214, 0.56);
  text-decoration: none;
  font-size: 13px;
  line-height: 1.48;
  transition: color 0.24s ease;
  word-break: break-word;
}

.colum_two a:hover {
  color: #ffffff;
}

.footer__wave {
  width: 100%;
  height: 22px;
  margin-top: 4px;
  opacity: 0.34;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='22' viewBox='0 0 1440 22'%3E%3Cpath d='M0 11c7 0 7-3 14-3s7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3 7 3 14 3 7-3 14-3' fill='none' stroke='%239da6b7' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-position: left center;
  background-size: auto 18px;
}

.foot_btm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-top: 8px;
  padding: 10px 0 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(184, 193, 207, 0.45);
  font-size: 12px;
}

.friends_lk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.friends_lk a,
.foot_btm__meta a {
  color: inherit;
  text-decoration: none;
  transition: color 0.24s ease;
}

.friends_lk a:hover,
.foot_btm__meta a:hover {
  color: #d4b58a;
}

.friends_lk > div:not(:last-child)::after {
  content: '';
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 4px;
}

.foot_btm__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px 24px;
}

.foot_btm__tagline {
  color: #d4b58a;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (max-width: 992px) {
  .footer__container {
    padding: 20px 30px 0;
  }
  .foot_top {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .foot_left {
    max-width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    align-items: flex-start;
  }
  .foot_contact {
    margin-top: 0;
    max-width: none;
    flex: 1;
    min-width: 250px;
  }
  .foot_nav {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .footer__container {
    padding: 20px 15px;
  }
  .foot_left {
    flex-direction: column;
    gap: 15px;
  }
  .foot_contact {
    min-width: 100%;
  }
  .foot_nav {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 10px;
  }
  .foot_nav__accent {
    margin: 6px 0 8px;
  }
  .foot_btm {
    padding: 10px 0;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .foot_nav {
    grid-template-columns: repeat(2, 1fr); /* Giữ 2 cột cho gọn */
    gap: 15px 10px;
  }
}
</style>
