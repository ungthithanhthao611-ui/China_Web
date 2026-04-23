<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, Globe, Mail, Menu, Phone, Search, X } from 'lucide-vue-next'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import { findMenuItems, normalizeMenuItems, toLinkProps } from '@/shared/utils/navigation'
import { uiState } from '@/shared/utils/uiState'
import { listProductCategories } from '@/views/user/services/productsApi'
import logoImage from '@/assets/logo-cty.png'

const isMobileMenuOpen = ref(false)
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)
const mobileExpandedGroups = ref([])
const route = useRoute()
const bootstrapStore = useBootstrapStore()

// Load product categories từ backend
const productCategories = ref([])
async function loadProductCategories() {
  try {
    const res = await listProductCategories()
    productCategories.value = res.items || []
  } catch {
    productCategories.value = []
  }
}

// Tạo danh sách children cho Sản Phẩm dựa trên backend data
const productNavChildren = computed(() => {
  const base = [{ name: 'Tất Cả Sản Phẩm', path: '/products' }]
  const fromApi = productCategories.value
    .filter(c => c.is_active)
    .map(c => ({ name: c.name, path: `/products?category=${c.slug}` }))
  return fromApi.length ? [...base, ...fromApi] : base
})

const fallbackNavItems = computed(() => [
  { name: 'Trang Chủ', path: '/' },
  {
    name: 'Giới Thiệu',
    path: '/about/company-introduction',
    children: [
      { name: 'Tổng Quan Công Ty', path: '/about/company-introduction' },
      { name: 'Lịch Sử Phát Triển', path: '/about/development-course' },
      { name: 'Tầm Nhìn & Sứ Mệnh', path: '/about/corporate-culture' },
      { name: 'Giá Trị Cốt Lõi', path: '/about/corporate-culture' },
      { name: 'Ban Lãnh Đạo', path: '/about/leadership-care' },
      { name: 'Sơ Đồ Tổ Chức', path: '/about/organization-chart' },
    ],
  },
  {
    name: 'Năng Lực',
    path: '/honors',
    children: [
      { name: 'Hình Ảnh Nhà Máy', path: '/honors' },
      { name: 'Công Nghệ Sản Xuất', path: '/honors' },
      { name: 'Chứng Nhận ISO & CE', path: '/honors' },
    ],
  },
  {
    name: 'Sản Phẩm',
    path: '/products',
    children: productNavChildren.value,
  },
  {
    name: 'Dự Án',
    path: '/project-case',
  },
  {
    name: 'Tin Tức',
    path: '/news',
  },
  { name: 'Liên Hệ', path: '/contact' },
])

const navItems = computed(() => {
  // Ưu tiên sử dụng menu tiếng Việt đã định nghĩa sẵn trong code (fallbackNavItems)
  // để đảm bảo luôn đúng yêu cầu của Sếp, bất kể dữ liệu cũ trong Database.
  return fallbackNavItems.value
})

const readSetting = (keys, fallback = '') => {
  for (const key of keys) {
    const value = bootstrapStore.settingsMap[key]
    if (value) return value
  }
  return fallback
}

const defaultLogoUrl = logoImage
const siteName = computed(() => readSetting(['site_name', 'company_name'], 'CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ THIÊN ĐỒNG VIỆT NAM'))
const siteTagline = computed(() =>
  readSetting(['site_tagline', 'company_slogan'], 'UY TÍN TỪ NHỮNG ĐIỀU NHỎ NHẤT'),
)
const companyLogoUrl = computed(() => defaultLogoUrl)
const headerEmail = computed(() =>
  readSetting(['company_email', 'contact_email', 'email'], 'thiendongintl@gmail.com'),
)
const headerPhone = computed(() =>
  readSetting(['company_phone', 'contact_phone', 'phone'], '0948.929.744'),
)
const phoneHref = computed(() => {
  const normalized = String(headerPhone.value || '').replace(/[^\d+]/g, '')
  return normalized ? `tel:${normalized}` : ''
})

const isHomeOverlay = computed(() => route.path === '/' || route.path === '/honors')
const isContactHero = computed(
  () =>
    route.path === '/contact' &&
    (!route.hash || route.hash === '#ctn1')
)
const isAboutPage = computed(() => route.path.startsWith('/about'))
const isNewsHero = computed(() => route.path.startsWith('/news'))
const isVideoHero = computed(() => false)
const isProjectCase = computed(
  () =>
    route.path === '/project-case' ||
    route.path === '/projects' ||
    route.path.startsWith('/projects/') ||
    route.path.startsWith('/project_list/')
)
const isAboutHero = computed(
  () =>
    isAboutPage.value &&
    route.path === '/about/company-introduction' &&
    (!route.hash || route.hash === '#page1')
)
const isAboutSectionOverlay = computed(() => isAboutPage.value && !isAboutHero.value)

const isLinkActive = (path) => {
  if (!path || path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return false
  }

  const normalizedPath = path.split('#')[0].split('?')[0]

  if (path === '/') {
    return route.path === '/'
  }

  if (normalizedPath === '/project-case') {
    return (
      route.path === '/project-case' ||
      route.path === '/projects' ||
      route.path.startsWith('/projects/') ||
      route.path.startsWith('/project_list/')
    )
  }

  return route.path.startsWith(normalizedPath)
}

const searchLinks = computed(() =>
  navItems.value.flatMap((item) => [item, ...(item.children || [])]).map((item) => ({
    name: item.name,
    path: item.path
  }))
)

const filteredSearchLinks = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  if (!keyword) {
    return searchLinks.value
  }

  return searchLinks.value.filter((item) => item.name.toLowerCase().includes(keyword))
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const toggleMobileGroup = (name) => {
  if (mobileExpandedGroups.value.includes(name)) {
    mobileExpandedGroups.value = mobileExpandedGroups.value.filter((item) => item !== name)
    return
  }

      mobileExpandedGroups.value = [...mobileExpandedGroups.value, name]
}

const isMobileGroupExpanded = (name) => mobileExpandedGroups.value.includes(name)
const getLinkProps = (item) => toLinkProps(item)

const setBodyLock = (locked) => {
  const isProjectCaseLocked = document.body.dataset.projectCaseScrollLock === 'true'
  document.body.style.overflow = locked || isProjectCaseLocked ? 'hidden' : ''
}

const openSearch = async () => {
  isSearchOpen.value = true
  await nextTick()
  searchInputRef.value?.focus()
}

const closeSearch = () => {
  isSearchOpen.value = false
  searchQuery.value = ''
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeSearch()
  }
}

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
    closeSearch()
  }
)

const handleScroll = () => {
  // Luôn ẩn header khi không rê chuột vào vùng trigger hoặc chính nó
  // Dù ở đỉnh trang hay cuộn xuống đều ẩn để tạo cảm giác thoáng
  uiState.isHeaderHidden = true;
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll)
  loadProductCategories()
  // Mặc định ẩn ngay khi load
  uiState.isHeaderHidden = true;
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
  setBodyLock(false)
})
</script>

<template>
  <header
    :class="[
      'header',
      {
        'is-home': isHomeOverlay || isAboutHero,
        'is-contact-hero': isContactHero,
        'is-news-hero': isNewsHero,
        'is-video-hero': isVideoHero,
        'is-project-case': isProjectCase,
        'is-about-light': isAboutSectionOverlay,
        'is-hidden': uiState.isHeaderHidden,
        'is-hovered': uiState.isHeaderHovered
      }
    ]"
    @mouseenter="uiState.isHeaderHovered = true"
    @mouseleave="uiState.isHeaderHovered = false"
  >
    <!-- Hover Trigger Zone (Active when not hovered) -->
    <div 
      class="header-trigger" 
      v-if="!uiState.isHeaderHovered"
      @mouseenter="uiState.isHeaderHovered = true"
    ></div>
    <div class="header_flx">
      <div class="brand-block">
        <router-link to="/" class="logo-link">
          <img :src="logoImage" :alt="`${siteName} logo`" loading="lazy" />
        </router-link>
      </div>

      <div class="header_r">
        <nav class="header_nav">
          <div v-for="item in navItems" :key="item.name" class="nav-group">
            <div :class="['fnt_16', 'xuan', { active: isLinkActive(item.path) }]">
              <component :is="item.external ? 'a' : 'router-link'" v-bind="getLinkProps(item)">
                {{ item.name }}
              </component>
            </div>
            <div v-if="item.children?.length" class="colum2">
              <component
                v-for="child in item.children"
                :key="child.name"
                :is="child.external ? 'a' : 'router-link'"
                v-bind="getLinkProps(child)"
              >
                {{ child.name }}
              </component>
            </div>
          </div>
        </nav>

        <!-- Desktop Only Contact -->
        <a v-if="headerEmail" :href="`mailto:${headerEmail}`" class="contact-item desktop-only">
          <div class="contact-icon">
            <Mail class="w-4 h-4" />
          </div>
          <span class="text-sm font-medium">{{ headerEmail }}</span>
        </a>
        <a v-if="phoneHref" :href="phoneHref" class="contact-item desktop-only">
          <div class="contact-icon">
            <Phone class="w-4 h-4" />
          </div>
          <span class="text-sm font-medium">{{ headerPhone }}</span>
        </a>

        <!-- Icons Container (Visible on mobile) -->
        <div class="header-icons-row">
          <button class="nav_search" type="button" aria-label="Search" @click="openSearch">
            <Search :size="24" stroke-width="1.7" />
          </button>

          <div class="lang">
            <Globe :size="24" stroke-width="1.7" />
            <span>CN</span>
          </div>

          <button class="mobile-toggle" @click="toggleMobileMenu" type="button" aria-label="Toggle menu">
            <Menu :size="28" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Backdrop -->
    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-backdrop" 
      @click="isMobileMenuOpen = false"
    ></div>

    <div :class="['mobile-nav-sidebar', { 'is-open': isMobileMenuOpen }]">
      <div class="mobile-nav-header">
        <div class="mobile-logo">
           <img :src="logoImage" :alt="siteName" />
        </div>
        <button class="mobile-close" @click="isMobileMenuOpen = false">
           <X :size="28" />
        </button>
      </div>
      
      <div class="mobile-nav-content">
        <div v-for="item in navItems" :key="`mobile-${item.name}`" class="mobile-nav-item">
          <div class="mobile-nav-head">
            <component
              :is="item.external ? 'a' : 'router-link'"
              v-bind="getLinkProps(item)"
              @click="isMobileMenuOpen = false"
            >
              {{ item.name }}
            </component>
            <button
              v-if="item.children?.length"
              type="button"
              class="mobile-nav-toggle"
              :aria-label="`Toggle ${item.name}`"
              @click="toggleMobileGroup(item.name)"
            >
              <ChevronDown
                :size="18"
                :class="{ rotated: isMobileGroupExpanded(item.name) }"
              />
            </button>
          </div>
          <div
            v-if="item.children?.length"
            class="mobile-dropdown"
            :class="{ 'is-open': isMobileGroupExpanded(item.name) }"
          >
            <component
              v-for="child in item.children"
              :key="`mobile-${child.name}`"
              :is="child.external ? 'a' : 'router-link'"
              v-bind="getLinkProps(child)"
              @click="isMobileMenuOpen = false"
            >
              {{ child.name }}
            </component>
          </div>
        </div>
      </div>
      
      <div class="mobile-nav-footer">
         <a :href="`tel:${headerPhone}`" class="mobile-contact-link">
            <Phone :size="18" /> {{ headerPhone }}
         </a>
         <a :href="`mailto:${headerEmail}`" class="mobile-contact-link">
            <Mail :size="18" /> {{ headerEmail }}
         </a>
      </div>
    </div>

    <transition name="search-fade">
      <div v-if="isSearchOpen" class="search-overlay">
        <button class="search-overlay__close" type="button" aria-label="Close search" @click="closeSearch">
          <X :size="28" />
        </button>

        <div class="search-overlay__inner">
          <p class="search-overlay__eyebrow">Tìm kiếm</p>
          <div class="search-overlay__field">
            <Search :size="22" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Tìm kiếm liên kết trang..."
            />
          </div>

          <div class="search-overlay__results">
            <router-link
              v-for="item in filteredSearchLinks"
              :key="`${item.path}-${item.name}`"
              :to="item.path"
              class="search-overlay__result"
              @click="closeSearch"
            >
              <span>{{ item.name }}</span>
              <span>{{ item.path }}</span>
            </router-link>

            <p v-if="!filteredSearchLinks.length" class="search-overlay__empty">Không tìm thấy liên kết phù hợp.</p>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 96px;
  z-index: 1000;
  display: flex;
  align-items: center;
  /* Premium smooth transition */
  transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1),
              background-color 0.4s ease,
              opacity 0.6s ease,
              height 0.4s ease;
  padding: 0 40px;
  background: transparent; 
  backdrop-filter: none;
  border-bottom: none;
  box-shadow: none;
  opacity: 0; 

  &.is-home {
    position: fixed;
    background: transparent;
    border-bottom-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
    opacity: 0; 

    &::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 180px;
      background: linear-gradient(180deg, rgba(4, 15, 38, 0.78) 0%, rgba(4, 15, 38, 0.34) 58%, rgba(4, 15, 38, 0) 100%);
      pointer-events: none;
    }
  }

  &.is-contact-hero {
    position: fixed;
    background: transparent;
    border-bottom-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
    opacity: 1;

    &::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 180px;
      background: linear-gradient(180deg, rgba(10, 20, 39, 0.56) 0%, rgba(10, 20, 39, 0.18) 62%, rgba(10, 20, 39, 0) 100%);
      pointer-events: none;
    }
  }

  &.is-news-hero,
  &.is-video-hero {
    position: fixed;
    background: transparent;
    border-bottom-color: transparent;
    box-shadow: none;
    backdrop-filter: none;
    opacity: 1;

    &::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 200px;
      background: linear-gradient(180deg, rgba(9, 20, 43, 0.62) 0%, rgba(9, 20, 43, 0.26) 58%, rgba(9, 20, 43, 0) 100%);
      pointer-events: none;
    }

    .fnt_16 a,
    .nav_search,
    .lang {
      color: #efc392;
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .fnt_16:hover a,
    .fnt_16.active a,
    .nav_search:hover,
    .lang:hover {
      color: #f6d1a7;
    }

    .colum2 {
      background: rgba(6, 18, 42, 0.96);
      border-color: rgba(214, 184, 136, 0.24);
    }
  }

  &.is-project-case {
    position: fixed;
    opacity: 1;
    background: rgba(247, 247, 247, 0.94);
    border-bottom: 1px solid rgba(226, 215, 198, 0.66);
    box-shadow: none;
    backdrop-filter: none;

    .fnt_16 a,
    .nav_search,
    .lang {
      color: #dfbd8e;
      text-shadow: none;
    }

    .fnt_16:hover a,
    .fnt_16.active a,
    .nav_search:hover,
    .lang:hover {
      color: #f1cda0;
    }

    .colum2 {
      background: rgba(255, 255, 255, 0.98);
      border-color: rgba(214, 184, 136, 0.26);
      box-shadow: 0 10px 24px rgba(29, 35, 52, 0.12);
    }
  }

  &.is-about-light {
    position: fixed;
    background: transparent;
    border-bottom-color: transparent;
    box-shadow: none;

    .fnt_16 a,
    .nav_search,
    .lang {
      color: #efc392;
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.12);
    }

    .fnt_16:hover a,
    .fnt_16.active a,
    .nav_search:hover,
    .lang:hover {
      color: #f5cfaa;
    }
  }

  &.is-hidden {
    transform: translateY(-100%);
    opacity: 0;
    /* Removed pointer-events: none; to allow header-trigger to work */
  }

  &.is-hovered {
    transform: translateY(0) !important;
    opacity: 1 !important;
    background: rgba(43, 44, 58, 0.85) !important; /* Light/faded dark color from screenshot */
    backdrop-filter: blur(12px);
    height: 80px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    
    .logo-link img {
       filter: brightness(1.1); /* Make logo pop slightly on dark bg */
    }
  }
}

.header-trigger {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 40px; /* Hover this area to show header */
  pointer-events: auto;
  background: transparent;
  z-index: 10;
}

.header_flx {
  max-width: 1760px;
  margin: 0 auto;
  min-height: 118px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 0 48px;
  position: relative;
  z-index: 1;
}

.brand-block {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo-link {
  flex-shrink: 0;

  img {
    width: clamp(164px, 13vw, 226px);
    height: auto;
  }
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  max-width: 300px;
}

.brand-name {
  color: #f1d9b3;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-tagline {
  color: #dfbd8e;
  font-size: 10px;
  line-height: 1.2;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header_r {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  min-width: 0;
  flex: 1;
}

.contact-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #dfbd8e;
  text-decoration: none;
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #f2d4a6;
    transform: translateY(-1px);
  }
}

.contact-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.header_nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(18px, 1.65vw, 38px);
  flex: 1;
}

.nav-group {
  position: relative;
  padding: 18px 0;

  &:hover .colum2 {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.fnt_16 {
  a {
    color: #dfbd8e;
    font-size: clamp(14px, 0.86vw, 16px);
    line-height: 1.2;
    font-weight: 400;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  &:hover a,
  &.active a {
    color: #f2d4a6;
  }
}

.colum2 {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 260px;
  padding: 12px 0;
  border-radius: 8px;
  background: rgba(3, 12, 30, 0.96);
  border: 1px solid rgba(214, 184, 136, 0.28);
  box-shadow: 0 12px 28px rgba(0, 8, 28, 0.36);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity 0.22s ease, transform 0.22s ease;

  a {
    display: block;
    padding: 10px 18px;
    color: #e9d1ab;
    font-size: 14px;
    line-height: 1.35;
    white-space: nowrap;

    &:hover {
      color: #f4dbb2;
      background: rgba(200, 156, 93, 0.16);
    }
  }
}

.nav_search,
.lang {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #dfbd8e;
  flex-shrink: 0;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #f2d4a6;
    transform: translateY(-1px);
  }
}

.lang {
  gap: 6px;
  text-transform: uppercase;
  font-size: 16px;
  font-weight: 400;
  white-space: nowrap;
}

.mobile-toggle {
  display: none;
  border: 0;
  background: transparent;
  color: #e8c594;
  cursor: pointer;
}

.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1500;
}

.mobile-nav-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100vh;
  background: #0f1b33;
  z-index: 1600;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);

  &.is-open {
    transform: translateX(0);
  }
}

.mobile-nav-header {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .mobile-logo img {
    height: 40px;
    width: auto;
  }

  .mobile-close {
    background: transparent;
    border: none;
    color: #fff;
    cursor: pointer;
  }
}

.mobile-nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.mobile-nav-item {
  margin-bottom: 20px;

  .mobile-nav-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    a, span {
      color: #fff;
      font-size: 17px;
      font-weight: 500;
      text-decoration: none;
    }

    .mobile-nav-toggle {
      background: transparent;
      border: none;
      color: #dfbd8e;
      padding: 4px;
      
      svg.rotated {
        transform: rotate(180deg);
      }
    }
  }
}

.mobile-dropdown {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 0;

  &.is-open {
    max-height: 500px;
    margin-top: 12px;
  }

  a {
    color: rgba(255, 255, 255, 0.7);
    font-size: 15px;
    text-decoration: none;
    padding: 4px 0;
  }
}

.mobile-nav-footer {
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;

  .mobile-contact-link {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #dfbd8e;
    text-decoration: none;
    font-size: 14px;
  }
}

@media (max-width: 1380px) {
  .header {
    background: transparent !important;
    height: 76px !important;
    margin: 0;
    width: 100%;
    /* Let the laptop behavior (is-hidden/is-hovered) control visibility */
    box-shadow: none;

    &.is-hovered {
      background: rgba(15, 27, 51, 0.9) !important;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    &::before {
      display: none !important;
    }
  }

  .header_flx {
    min-height: 76px;
    padding: 0 20px;
    gap: 12px;
  }

  .logo-link img {
    width: 160px;
  }

  .header_nav, .brand-copy {
    display: none !important;
  }

  .desktop-only {
    display: none !important;
  }

  .header-icons-row {
    display: flex;
    align-items: center;
    gap: 16px;
    color: #c4a676; /* Premium gold */
  }

  .nav_search, .lang, .mobile-toggle {
    display: flex !important;
    color: #c4a676 !important;
    padding: 4px;
    
    span {
      font-size: 14px;
      font-weight: 600;
      margin-left: 4px;
    }
  }

  .mobile-toggle {
    background: transparent !important;
    padding-right: 0;
  }
}

@media (max-width: 768px) {
  .header {
    height: 70px !important;
    width: 100%;
    margin: 0;
  }

  .header_flx {
    min-height: 70px;
    padding: 0 16px;
  }

  .logo-link img {
    width: 140px;
  }

  .header-icons-row {
    gap: 12px;
  }

  .lang span {
    display: inline !important;
    font-size: 13px;
  }
}

.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background:
    linear-gradient(135deg, rgba(8, 14, 26, 0.96), rgba(22, 33, 52, 0.94)),
    radial-gradient(circle at top right, rgba(215, 0, 15, 0.18), transparent 30%);
  backdrop-filter: blur(14px);
}

.search-overlay__close {
  position: absolute;
  top: 28px;
  right: 28px;
  border: 0;
  background: transparent;
  color: #f6d0a5;
  cursor: pointer;
}

.search-overlay__inner {
  width: min(920px, 100%);
}

.search-overlay__eyebrow {
  color: rgba(246, 208, 165, 0.78);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 12px;
}

.search-overlay__field {
  margin-top: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(246, 208, 165, 0.28);
  color: #f6d0a5;
}

.search-overlay__field input {
  flex: 1;
  border: 0;
  background: transparent;
  color: #ffffff;
  font-size: clamp(28px, 4vw, 56px);
  line-height: 1.2;
  padding: 12px 0 18px;
  outline: none;
}

.search-overlay__field input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-overlay__results {
  margin-top: 28px;
  display: grid;
  gap: 12px;
  max-height: min(52vh, 520px);
  overflow-y: auto;
}

.search-overlay__result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(246, 208, 165, 0.12);
  color: #ffffff;
}

.search-overlay__result span:last-child {
  color: rgba(246, 208, 165, 0.72);
  font-size: 14px;
}

.search-overlay__empty {
  color: rgba(255, 255, 255, 0.7);
}

.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity 0.22s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
</style>
