<script setup>
import { computed } from 'vue'
import { useBootstrapStore } from '@/client/stores/bootstrap'
import { findMenuItems, normalizeMenuItems, toLinkProps } from '@/shared/utils/navigation'
import { uiState } from '@/shared/utils/uiState'

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
    title: 'About Us',
    titlePath: '/about/company-introduction#page2',
    links: [
      { name: 'Company Introduction', path: '/about/company-introduction#page2' },
      { name: "Chairmanâ€™s Speech", path: '/about/chairman-speech#page3' },
      { name: 'Organization Chart', path: '/about/organization-chart#page4' },
      { name: 'Corporate Culture', path: '/about/corporate-culture#page5' },
      { name: 'Development Course', path: '/about/development-course#page6' },
      { name: 'Leadership Care', path: '/about/leadership-care#page7' },
      { name: 'Cooperative Partner', path: '/about/cooperative-partner#page8' }
    ]
  },
  {
    title: 'Qualification Honor',
    titlePath: '/honors#page2',
    links: [
      { name: 'Qualification Certificate', path: '/honors#page2' },
      { name: 'Honorary Awards', path: '/honors#page3' }
    ]
  },
  {
    title: 'Business Display',
    titlePath: '/business-areas#ctn1',
    links: [
      { name: 'Business Field', path: '/business-areas#ctn1' },
      { name: 'Project Case', path: '/project-case' },
      { name: 'Video', path: '/video' }
    ]
  },
  {
    title: 'News Center',
    titlePath: '/news/corporate-news',
    links: [
      { name: 'Corporate News', path: '/news/corporate-news' },
      { name: 'Industry Dynamics', path: '/news/industry-dynamics' }
    ]
  },
  {
    title: 'Social Responsibility',
    titlePath: '/social-responsibility',
    links: [{ name: 'Social Responsibility', path: '/social-responsibility' }]
  },
  {
    title: 'Contact Us',
    titlePath: '/contact#ctn2',
    links: [
      { name: 'Contact Us', path: '/contact#ctn2' },
      { name: 'Subsidiary', path: '/subsidiary#ctn2' },
      { name: 'Branch', path: '/branch' },
      { name: 'Join Us', path: '/join-us' }
    ]
  }
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

const socialItems = [
  {
    name: 'wechat',
    href: '#',
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/07d4f28d-1dc0-4f6c-a387-820025a3de76.png',
    qr: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/675e6578-004d-4d09-bda7-fd6d57af218d.jpeg'
  },
  {
    name: 'weibo',
    href: 'https://weibo.com/u/5705681276',
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/2519511a-7e4d-4f4d-b708-fc4821cc59ff.png'
  },
  {
    name: 'channel',
    href: '#',
    icon: 'https://en.sinodecor.com/repository/repository/portal-local/ngc202304190002/cms/image/ca068339-ec52-4181-8281-afe11cc0a744.png',
    qr: 'https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/1f5f7088-c0d0-404b-bfff-c3a511768b81.jpg'
  }
]

const siteName = computed(() => bootstrapStore.settingsMap.site_name || 'China Decor')
const siteTagline = computed(() => bootstrapStore.settingsMap.site_tagline || 'Corporate Website API')

const contactItems = computed(() => {
  const fallbackAddressLines = [
    'Add:5F, Block C,',
    'Hehuamingcheng Building, No.7',
    'Jianguomen South Street,',
    'Dongcheng District, Beijing'
  ]
  const fallbackPhone = '(86)010-65269998'
  const fallbackEmail = 'CNDC@sinodecor.com'

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
      text: `Tel:${phone}`,
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
  { name: 'Links', path: '/about/cooperative-partner#page8' },
  { name: 'Copyright Notice', path: '/copyright' },
  { name: 'Privacy & Security', path: '/privacy' },
  { name: 'Contact', path: '/contact#ctn2' }
])

const copyrightText = computed(
  () => readSetting(['copyright_text'], `Copyright ${siteName.value}`)
)
const technicalSupportText = computed(
  () => readSetting(['technical_support_text'], `Technical Support: ${siteTagline.value}`)
)
const beianText = computed(() => readSetting(['beian_text'], 'äº¬ICPå¤‡12048675å·-1'))
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
                src="https://en.sinodecor.com/repository/portal-local/ngc202304190002/cms/image/5287e5c5-e561-4bfc-80fb-dd45ce6b8191.png"
                :alt="siteName"
              />
            </router-link>

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
                <img :src="item.icon" :alt="item.name" />
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
                <img :src="item.icon" :alt="item.id" class="foot_contact__icon" />

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
  padding: 38px 58px 10px;
}

.foot_top {
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  gap: 22px 58px;
  min-height: 282px;
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

.share {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 23px;
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
  display: grid;
  gap: 7px;
  margin-top: 28px;
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
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 22px 36px;
  padding-top: 1px;
}

.foot_nav__group {
  min-width: 0;
}

.foot_nav_tit {
  color: #d8b581;
  text-decoration: none;
  font-size: 15px;
  line-height: 1.55;
  transition: color 0.24s ease;
}

.foot_nav_tit:hover {
  color: #f1cc97;
}

.foot_nav__accent {
  width: 23px;
  height: 2px;
  margin: 12px 0 15px;
  background: #e6081d;
}

.colum_two {
  display: grid;
  gap: 10px;
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
  gap: 20px;
  margin-top: 2px;
  color: rgba(184, 193, 207, 0.46);
  font-size: 12px;
  line-height: 1.45;
}

.friends_lk {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

.friends_lk a,
.foot_btm__meta a {
  color: inherit;
  text-decoration: none;
  transition: color 0.24s ease;
}

.friends_lk a:hover,
.foot_btm__meta a:hover {
  color: #ffffff;
}

.friends_lk > div:not(:last-child)::after {
  content: '|';
  margin: 0 10px;
  color: rgba(255, 255, 255, 0.17);
}

.foot_btm__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px 14px;
}

@media (max-width: 1360px) {
  .footer__container {
    padding: 36px 30px 12px;
  }

  .foot_top {
    grid-template-columns: 235px minmax(0, 1fr);
    gap: 20px 36px;
  }

  .foot_nav {
    gap: 20px 24px;
  }
}

@media (max-width: 1160px) {
  .foot_top {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .foot_left {
    max-width: 320px;
  }

  .foot_nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .foot_btm {
    flex-direction: column;
    align-items: flex-start;
  }

  .foot_btm__meta {
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .footer__bg--top {
    width: 250px;
    height: 148px;
    opacity: 0.13;
  }

  .footer__bg--bottom {
    width: 230px;
    height: 102px;
    bottom: 84px;
    opacity: 0.11;
  }

  .footer__container {
    width: min(100%, calc(100% - 20px));
    padding: 30px 10px 14px;
  }

  .foot_logo {
    width: 160px;
  }

  .share {
    margin-top: 18px;
  }

  .share__item {
    width: 36px;
    height: 36px;
  }

  .foot_contact {
    margin-top: 22px;
  }

  .foot_nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 16px;
  }

  .foot_nav_tit {
    font-size: 14px;
  }

  .colum_two a,
  .foot_contact__item,
  .foot_btm {
    font-size: 11px;
  }
}

@media (max-width: 520px) {
  .foot_nav {
    grid-template-columns: 1fr;
  }
}
</style>
