<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown, Mail, MapPin, Menu, Phone, Search, X } from 'lucide-vue-next'
import { useBootstrapStore } from '@/views/user/stores/bootstrap'
import { findMenuItems, normalizeMenuItems, toLinkProps } from '@/shared/utils/navigation'
import { uiState } from '@/shared/utils/uiState'
import { listProductCategories } from '@/views/user/services/productsApi'
import logoImage from '@/assets/logo-cty.png'

const HEADER_CONTACT_FALLBACK = Object.freeze({
  email: 'Thiendongvnit@gmail.com',
  phone: '0982 818 273',
  phoneSecondary: '0968 297 104',
  location: '52 Ấp Đồng Chinh, Xã Phước Hoà, Huyện Phú Giáo, Tỉnh Bình Dương',
  brandPrimary: 'THIÊN ĐỒNG',
  brandSecondary: 'VIỆT NAM',
})

const isMobileMenuOpen = ref(false)
const isSearchOpen = ref(false)
const searchQuery = ref('')
const searchInputRef = ref(null)
const mobileExpandedGroups = ref([])
const route = useRoute()
const bootstrapStore = useBootstrapStore()

const productCategories = ref([])

const normalizeNavPath = (value) => String(value || '').split('#')[0].split('?')[0]

const compareProductCategories = (left, right) => {
  const leftSort = Number(left?.sort_order)
  const rightSort = Number(right?.sort_order)
  const normalizedLeftSort = Number.isFinite(leftSort) ? leftSort : Number.MAX_SAFE_INTEGER
  const normalizedRightSort = Number.isFinite(rightSort) ? rightSort : Number.MAX_SAFE_INTEGER
  if (normalizedLeftSort !== normalizedRightSort) return normalizedLeftSort - normalizedRightSort

  const leftName = String(left?.name || '').trim()
  const rightName = String(right?.name || '').trim()
  if (leftName !== rightName) return leftName.localeCompare(rightName, 'vi')

  return Number(left?.id || 0) - Number(right?.id || 0)
}

const normalizeProductCategoryTree = (nodes = []) => (
  [...nodes]
    .sort(compareProductCategories)
    .map((category) => ({
      ...category,
      children: normalizeProductCategoryTree(category.children || []),
    }))
)

const isProductNavItem = (item) => normalizeNavPath(item?.path) === '/products'

const buildProductNavNodes = (nodes = [], depth = 0) => nodes
  .filter((category) => category?.slug && category?.is_active !== false)
  .map((category) => ({
    name: category.name,
    path: `/products?category=${category.slug}`,
    depth,
    isProductCategory: true,
    children: buildProductNavNodes(category.children || [], depth + 1),
  }))

const flattenProductNavNodes = (nodes = []) => nodes.flatMap((node) => {
  const current = {
    ...node,
    children: undefined,
  }
  return [current, ...flattenProductNavNodes(node.children || [])]
})

const mobileDropdownChildren = (item) => {
  if (!isProductNavItem(item)) return item.children || []
  return flattenProductNavNodes(item.children || [])
}

async function loadProductCategories() {
  try {
    const res = await listProductCategories()
    productCategories.value = normalizeProductCategoryTree(res.items || [])
  } catch {
    productCategories.value = []
  }
}

const productNavChildren = computed(() => {
  const base = [{ name: 'Tất Cả Sản Phẩm', path: '/products', depth: 0, isProductCategory: true, children: [] }]
  const fromApi = buildProductNavNodes(productCategories.value)
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
    name: 'Sản Phẩm',
    path: '/products',
    children: productNavChildren.value,
  },
  {
    name: 'Dự Án',
    path: '/du-an',
  },
  {
    name: 'Tin Tức',
    path: '/news',
  },
  { name: 'Liên Hệ', path: '/contact' },
])

const headerMenuItems = computed(() =>
  normalizeMenuItems(
    findMenuItems(bootstrapStore.menus, ['header', 'main', 'primary', 'nav', 'navigation', 'top'])
  )
)

const navItems = computed(() => {
  const sourceItems = headerMenuItems.value.length ? headerMenuItems.value : fallbackNavItems.value

  return sourceItems.map((item) => {
    const normalizedPath = normalizeNavPath(item.path)

    if (normalizedPath !== '/products') {
      return item
    }

    return {
      ...item,
      children: productNavChildren.value.length ? productNavChildren.value : (item.children || []),
    }
  })
})

const readSetting = (keys, fallback = '') => {
  for (const key of keys) {
    const value = bootstrapStore.settingsMap[key]
    if (value) return value
  }
  return fallback
}

const siteName = computed(() =>
  readSetting(['site_name', 'company_name'], 'CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ THIÊN ĐỒNG VIỆT NAM'),
)
const brandPrimary = computed(() =>
  readSetting(['site_short_name', 'company_short_name', 'brand_name'], HEADER_CONTACT_FALLBACK.brandPrimary),
)
const brandSecondary = computed(() =>
  readSetting(['site_short_region', 'brand_region', 'country_name'], HEADER_CONTACT_FALLBACK.brandSecondary),
)
const companyLogoUrl = computed(() => logoImage)
const headerEmail = computed(() =>
  readSetting(['company_email', 'contact_email', 'email'], HEADER_CONTACT_FALLBACK.email),
)
const headerPhone = computed(() =>
  readSetting(['company_phone', 'contact_phone', 'phone'], HEADER_CONTACT_FALLBACK.phone),
)
const headerPhoneSecondary = computed(() =>
  readSetting(
    ['company_phone_secondary', 'contact_phone_secondary', 'phone_secondary', 'secondary_phone'],
    HEADER_CONTACT_FALLBACK.phoneSecondary,
  ),
)
const headerLocation = computed(() =>
  readSetting(
    ['company_address', 'contact_address', 'address', 'office_address'],
    HEADER_CONTACT_FALLBACK.location,
  ),
)

const createTelHref = (value) => {
  const normalized = String(value || '').replace(/[^\d+]/g, '')
  return normalized ? `tel:${normalized}` : ''
}

const phoneHref = computed(() => createTelHref(headerPhone.value))
const secondaryPhoneHref = computed(() => createTelHref(headerPhoneSecondary.value))
const emailHref = computed(() => {
  const email = String(headerEmail.value || '').trim()
  return email ? `mailto:${email}` : ''
})

const isLinkActive = (path) => {
  if (!path || path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return false
  }

  const normalizedPath = path.split('#')[0].split('?')[0]

  if (path === '/') {
    return route.path === '/'
  }

  if (normalizedPath === '/du-an' || normalizedPath === '/project-case') {
    return (
      route.path === '/du-an' ||
      route.path === '/project-case' ||
      route.path === '/projects' ||
      route.path.startsWith('/du-an/') ||
      route.path.startsWith('/projects/') ||
      route.path.startsWith('/project/') ||
      route.path.startsWith('/project_list/')
    )
  }

  return route.path.startsWith(normalizedPath)
}

const flattenNavItemsForSearch = (items = []) => items.flatMap((item) => [
  item,
  ...flattenNavItemsForSearch(item.children || []),
])

const searchLinks = computed(() =>
  flattenNavItemsForSearch(navItems.value).map((item) => ({
    name: item.name,
    path: item.path,
  })),
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
  if (typeof document === 'undefined') return
  const isProjectCaseLocked = document.body.dataset.projectCaseScrollLock === 'true'
  const isSearchLocked = isSearchOpen.value
  const needsLock = locked || isProjectCaseLocked || isSearchLocked
  
  document.body.style.overflow = needsLock ? 'hidden' : ''
  document.body.style.paddingRight = needsLock ? `${window.innerWidth - document.documentElement.clientWidth}px` : ''
}

const syncHeaderOffset = () => {
  const width = window.innerWidth
  let nextOffset = '126px'

  if (width <= 767) {
    nextOffset = '94px'
  } else if (width <= 1023) {
    nextOffset = '102px'
  }

  document.documentElement.style.setProperty('--site-header-offset', nextOffset)
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

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    closeSearch()
    closeMobileMenu()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
    closeSearch()
  },
)

watch(isMobileMenuOpen, (isOpen) => {
  setBodyLock(isOpen)
  if (isOpen) {
    uiState.isHeaderHidden = false
  }
})

const handleScroll = () => {
  uiState.isHeaderHidden = true
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', syncHeaderOffset)
  loadProductCategories()
  syncHeaderOffset()
  uiState.isHeaderHidden = true
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', syncHeaderOffset)
  setBodyLock(false)
})
</script>

<template>
  <header
    :class="[
      'header',
      {
        'is-hidden': uiState.isHeaderHidden,
        'is-hovered': uiState.isHeaderHovered,
      },
    ]"
    @mouseenter="uiState.isHeaderHovered = true"
    @mouseleave="uiState.isHeaderHovered = false"
  >
    <div
      v-if="!uiState.isHeaderHovered"
      class="header-trigger"
      @mouseenter="uiState.isHeaderHovered = true"
    />

    <div class="header-stack">
      <div class="header-topbar">
        <div class="header-topbar__inner">
          <div class="header-topbar__group header-topbar__group--left">
            <a v-if="phoneHref" :href="phoneHref" class="topbar-link">
              <Phone :size="15" />
              <span>{{ headerPhone }}</span>
            </a>
            <a v-if="emailHref" :href="emailHref" class="topbar-link">
              <Mail :size="15" />
              <span>{{ headerEmail }}</span>
            </a>
          </div>

          <div v-if="headerLocation" class="header-topbar__group header-topbar__group--right">
            <span class="topbar-link topbar-link--static">
              <MapPin :size="15" />
              <span>{{ headerLocation }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="header-main">
        <div class="header-main__inner">
          <div class="brand-block">
            <router-link to="/" class="logo-link" aria-label="Thiên Đồng Việt Nam">
              <img :src="companyLogoUrl" :alt="`${siteName} logo`" loading="lazy" />
              <span class="brand-copy">
                <strong>{{ brandPrimary }}</strong>
                <small>{{ brandSecondary }}</small>
              </span>
            </router-link>
          </div>

          <nav class="header_nav" aria-label="Main navigation">
            <div v-for="item in navItems" :key="item.name" class="nav-group">
              <div :class="['nav-link', { active: isLinkActive(item.path) }]">
                <component :is="item.external ? 'a' : 'router-link'" v-bind="getLinkProps(item)">
                  {{ item.name }}
                </component>
              </div>
              <div v-if="item.children?.length" :class="['colum2', { 'colum2--product': isProductNavItem(item) }]">
                <template v-if="isProductNavItem(item)">
                  <div
                    v-for="child in item.children"
                    :key="`${child.path || ''}-${child.name}`"
                    :class="['product-dropdown-row', { 'has-children': child.children?.length }]"
                  >
                    <component
                      :is="child.external ? 'a' : 'router-link'"
                      v-bind="getLinkProps(child)"
                      class="dropdown-link dropdown-link--product-parent"
                    >
                      <span class="dropdown-link__text">{{ child.name }}</span>
                      <span v-if="child.children?.length" class="product-parent-indicator" aria-hidden="true" />
                    </component>

                    <div v-if="child.children?.length" class="colum3">
                      <component
                        v-for="grandChild in child.children"
                        :key="`${grandChild.path || ''}-${grandChild.name}`"
                        :is="grandChild.external ? 'a' : 'router-link'"
                        v-bind="getLinkProps(grandChild)"
                        class="dropdown-link dropdown-link--product-child"
                      >
                        <span class="dropdown-link__branch" aria-hidden="true" />
                        <span class="dropdown-link__text">{{ grandChild.name }}</span>
                      </component>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <component
                    v-for="child in item.children"
                    :key="`${child.path || ''}-${child.name}`"
                    :is="child.external ? 'a' : 'router-link'"
                    v-bind="getLinkProps(child)"
                    class="dropdown-link"
                  >
                    <span class="dropdown-link__text">{{ child.name }}</span>
                  </component>
                </template>
              </div>
            </div>
          </nav>

          <div class="header_actions">
            <button class="mobile-toggle" type="button" aria-label="Toggle menu" @click="toggleMobileMenu">
              <X v-if="isMobileMenuOpen" :size="24" />
              <Menu v-else :size="24" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isMobileMenuOpen" class="mobile-backdrop" @click="closeMobileMenu" />

    <aside class="mobile-nav-sidebar" :class="{ 'is-open': isMobileMenuOpen }">
      <div class="mobile-nav-header">
        <router-link to="/" class="mobile-logo" @click="closeMobileMenu">
          <img :src="companyLogoUrl" :alt="siteName" />
          <span>
            <strong>{{ brandPrimary }}</strong>
            <small>{{ brandSecondary }}</small>
          </span>
        </router-link>
        <button class="mobile-close" type="button" @click="closeMobileMenu">
          <X :size="24" />
        </button>
      </div>

      <div class="mobile-nav-content">
        <div v-for="item in navItems" :key="`mobile-${item.name}`" class="mobile-nav-item">
          <div class="mobile-nav-head">
            <component
              :is="item.external ? 'a' : 'router-link'"
              v-bind="getLinkProps(item)"
              @click="closeMobileMenu"
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
              <ChevronDown :size="18" :class="{ rotated: isMobileGroupExpanded(item.name) }" />
            </button>
          </div>

          <div
            v-if="item.children?.length"
            class="mobile-dropdown"
            :class="{ 'is-open': isMobileGroupExpanded(item.name) }"
          >
            <component
              v-for="child in mobileDropdownChildren(item)"
              :key="`mobile-${child.path || ''}-${child.name}`"
              :is="child.external ? 'a' : 'router-link'"
              v-bind="getLinkProps(child)"
              :class="[
                'dropdown-link',
                {
                  'dropdown-link--product': isProductNavItem(item) && child.isProductCategory,
                  'is-parent': isProductNavItem(item) && child.isProductCategory && Number(child.depth || 0) === 0,
                  'is-child': isProductNavItem(item) && child.isProductCategory && Number(child.depth || 0) > 0,
                },
              ]"
              :style="isProductNavItem(item) && child.isProductCategory ? { '--depth': Number(child.depth || 0) } : null"
              @click="closeMobileMenu"
            >
              <span
                v-if="isProductNavItem(item) && child.isProductCategory && Number(child.depth || 0) > 0"
                class="dropdown-link__branch"
                aria-hidden="true"
              />
              <span class="dropdown-link__text">{{ child.name }}</span>
            </component>
          </div>
        </div>
      </div>

      <div class="mobile-nav-footer">
        <a v-if="phoneHref" :href="phoneHref" class="mobile-contact-link">
          <Phone :size="16" />
          <span>{{ headerPhone }}</span>
        </a>
        <a v-if="secondaryPhoneHref" :href="secondaryPhoneHref" class="mobile-contact-link">
          <Phone :size="16" />
          <span>{{ headerPhoneSecondary }}</span>
        </a>
        <a v-if="emailHref" :href="emailHref" class="mobile-contact-link">
          <Mail :size="16" />
          <span>{{ headerEmail }}</span>
        </a>
        <span v-if="headerLocation" class="mobile-contact-link mobile-contact-link--static">
          <MapPin :size="16" />
          <span>{{ headerLocation }}</span>
        </span>
        <button class="mobile-contact-link mobile-contact-link--button" type="button" @click="openSearch">
          <Search :size="16" />
          <span>Tìm kiếm nhanh</span>
        </button>
      </div>
    </aside>

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
  --header-bg-top: rgba(12, 24, 49, 0.96);
  --header-bg-bottom: rgba(20, 35, 67, 0.94);
  --header-surface: rgba(16, 29, 55, 0.94);
  --header-surface-strong: rgba(11, 22, 43, 0.98);
  --header-border: rgba(214, 176, 116, 0.16);
  --header-text: #f5efe2;
  --header-muted: rgba(230, 220, 201, 0.78);
  --header-accent: #d6b074;
  --header-accent-strong: #f2ca84;
  --header-shadow: 0 18px 38px rgba(6, 15, 31, 0.24);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 2200;
  opacity: 0;
  transition:
    transform 0.22s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s ease;

  &.is-hidden {
    transform: translateY(calc(-100% - 12px));
    opacity: 0;
  }

  &.is-hovered {
    transform: translateY(0) !important;
    opacity: 1 !important;
  }
}

.header-trigger {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  height: 62px;
  background: transparent;
}

.header-stack {
  background: linear-gradient(90deg, var(--header-bg-top), var(--header-bg-bottom));
  border-bottom: 1px solid var(--header-border);
  box-shadow: var(--header-shadow);
  backdrop-filter: blur(14px);
}

.header-topbar {
  background: transparent;
  color: var(--header-text);
}

.header-topbar__inner,
.header-main__inner {
  width: min(1320px, calc(100% - 40px));
  margin: 0 auto;
}

.header-topbar__inner {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 6px 0;
}

.header-topbar__group {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 0;
  flex-wrap: wrap;
}

.header-topbar__group--right {
  justify-content: flex-end;
  margin-left: auto;
}

.topbar-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--header-muted);
  text-decoration: none;
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
  transition: color 0.2s ease;

  &:hover {
    color: var(--header-accent-strong);
  }

  svg {
    flex-shrink: 0;
    color: var(--header-accent);
  }
}

.topbar-link--static {
  cursor: default;
}

.header-main {
  background: transparent;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.header-main__inner {
  min-height: 86px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand-block {
  flex: 0 0 auto;
  min-width: 0;
}

.logo-link {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  color: var(--header-text);
  text-decoration: none;

  img {
    width: 68px;
    height: 68px;
    object-fit: contain;
    flex-shrink: 0;
  }
}

.brand-copy {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  text-transform: uppercase;

  strong {
    font-size: 20px;
    line-height: 1;
    letter-spacing: 0.08em;
    color: var(--header-text);
  }

  small {
    font-size: 13px;
    line-height: 1.1;
    letter-spacing: 0.22em;
    color: var(--header-accent);
  }
}

.header_nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(18px, 2vw, 34px);
  flex: 1;
  min-width: 0;
}

.nav-group {
  position: relative;
  padding: 28px 0;

  &:hover .colum2 {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  &:nth-last-child(-n + 2) .colum2 {
    left: auto;
    right: 0;
  }
}

.nav-link {
  a {
    color: var(--header-text);
    font-size: 16px;
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
    transition: color 0.2s ease;
  }

  &:hover a,
  &.active a {
    color: var(--header-accent-strong);
  }
}

.colum2 {
  position: absolute;
  top: calc(100% - 4px);
  left: 0;
  z-index: 2250;
  min-width: 240px;
  max-width: min(340px, calc(100vw - 32px));
  padding: 10px 0;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(13, 24, 48, 0.98), rgba(18, 33, 62, 0.96));
  border: 1px solid rgba(214, 176, 116, 0.14);
  box-shadow: 0 20px 34px rgba(5, 12, 24, 0.34);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity 0.22s ease, transform 0.22s ease;
  backdrop-filter: blur(16px);

  .dropdown-link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    color: var(--header-muted);
    font-size: 14px;
    line-height: 1.4;
    text-decoration: none;

    &:hover {
      color: var(--header-accent-strong);
      background: rgba(214, 176, 116, 0.08);
    }
  }
}

.colum2--product {
  min-width: 260px;
  max-width: 280px;
  overflow: visible;
}

.product-dropdown-row {
  position: relative;
}

.dropdown-link--product-parent {
  justify-content: space-between;
  color: var(--header-text);
  font-weight: 600;
}

.product-parent-indicator {
  position: relative;
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
}

.product-parent-indicator::before,
.product-parent-indicator::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  width: 7px;
  height: 1px;
  background: currentColor;
  border-radius: 999px;
  transform-origin: right center;
}

.product-parent-indicator::before {
  transform: translateY(-50%) rotate(38deg);
}

.product-parent-indicator::after {
  transform: translateY(-50%) rotate(-38deg);
}

.colum3 {
  position: absolute;
  top: -6px;
  left: calc(100% - 2px);
  z-index: 2260;
  min-width: 240px;
  max-width: min(320px, calc(100vw - 32px));
  padding: 10px 0;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(11, 21, 43, 0.98), rgba(18, 33, 62, 0.96));
  border: 1px solid rgba(214, 176, 116, 0.14);
  box-shadow: 0 20px 34px rgba(5, 12, 24, 0.34);
  opacity: 0;
  visibility: hidden;
  transform: translateX(8px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.product-dropdown-row:hover > .colum3 {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.dropdown-link--product-child {
  color: var(--header-muted);
  font-weight: 500;
}

.dropdown-link__branch {
  position: relative;
  width: 12px;
  height: 12px;
  flex: 0 0 12px;
  color: rgba(214, 176, 116, 0.82);
}

.dropdown-link__branch::before,
.dropdown-link__branch::after {
  content: '';
  position: absolute;
  background: currentColor;
  border-radius: 999px;
}

.dropdown-link__branch::before {
  left: 2px;
  top: 0;
  width: 1px;
  height: 10px;
}

.dropdown-link__branch::after {
  left: 2px;
  top: 9px;
  width: 8px;
  height: 1px;
}

.dropdown-link__text {
  min-width: 0;
}

.header_actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: 0 0 auto;
}


.mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(214, 176, 116, 0.28);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--header-accent-strong);
  cursor: pointer;
}

.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(3px);
  z-index: 2300;
}

.mobile-nav-sidebar {
  position: fixed;
  top: 0;
  right: 0;
  width: min(360px, calc(100vw - 20px));
  height: 100dvh;
  background: linear-gradient(180deg, rgba(10, 21, 42, 0.99), rgba(19, 33, 61, 0.98));
  z-index: 2400;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.32s ease;
  box-shadow: -18px 0 32px rgba(15, 23, 42, 0.16);

  &.is-open {
    transform: translateX(0);
  }
}

.mobile-nav-header {
  padding: 18px 18px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(214, 176, 116, 0.16);
}

.mobile-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--header-text);
  text-decoration: none;

  img {
    width: 52px;
    height: 52px;
    object-fit: contain;
    flex-shrink: 0;
  }

  span {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-transform: uppercase;
  }

  strong {
    font-size: 17px;
    letter-spacing: 0.08em;
    color: var(--header-text);
  }

  small {
    font-size: 11px;
    letter-spacing: 0.16em;
    color: var(--header-accent);
  }
}

.mobile-close {
  background: transparent;
  border: 0;
  color: var(--header-accent-strong);
  cursor: pointer;
}

.mobile-nav-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
}

.mobile-nav-item + .mobile-nav-item {
  margin-top: 14px;
}

.mobile-nav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  a,
  span {
    color: var(--header-text);
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
  }
}

.mobile-nav-toggle {
  border: 0;
  background: transparent;
  color: var(--header-accent);
  padding: 4px;

  svg.rotated {
    transform: rotate(180deg);
  }
}

.mobile-dropdown {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.26s ease;
  padding-left: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 0;

  &.is-open {
    max-height: 500px;
    margin-top: 12px;
  }

  .dropdown-link {
    --depth: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--header-muted);
    font-size: 14px;
    text-decoration: none;
  }

  .dropdown-link--product {
    padding-left: calc(var(--depth) * 16px);
  }

  .dropdown-link--product.is-parent {
    color: var(--header-text);
    font-weight: 600;
  }

  .dropdown-link__branch {
    color: rgba(214, 176, 116, 0.78);
  }
}

.mobile-nav-footer {
  padding: 16px 18px 20px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(214, 176, 116, 0.14);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-contact-link {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--header-muted);
  text-decoration: none;
  font-size: 14px;
  line-height: 1.45;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.mobile-contact-link--static {
  cursor: default;
}

.mobile-contact-link--button {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}


.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 2500;
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

@media (max-width: 1180px) {
  .header-topbar__inner,
  .header-main__inner {
    width: min(100%, calc(100% - 32px));
  }

  .header_nav {
    gap: 18px;
  }

  .nav-link a {
    font-size: 15px;
  }
}

@media (max-width: 1023px) {
  .header {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  .header-trigger {
    display: none;
  }

  .header-topbar__inner,
  .header-main__inner {
    width: calc(100% - 24px);
  }

  .header-topbar__inner {
    min-height: 0;
    justify-content: flex-start;
    gap: 8px 16px;
  }

  .header-topbar__group--right {
    display: none;
  }

  .topbar-link {
    font-size: 13px;
  }

  .header-main__inner {
    min-height: 72px;
    gap: 12px;
  }

  .header_nav,
  .desktop-only {
    display: none !important;
  }

  .logo-link {
    gap: 10px;

    img {
      width: 56px;
      height: 56px;
    }
  }

  .brand-copy strong {
    font-size: 18px;
  }

  .brand-copy small {
    font-size: 11px;
  }

  .mobile-toggle {
    display: inline-flex;
  }
}

@media (max-width: 767px) {
  .header-topbar__inner,
  .header-main__inner {
    width: calc(100% - 20px);
  }

  .header-topbar__inner {
    padding: 7px 0;
  }

  .header-main__inner {
    min-height: 66px;
  }

  .topbar-link {
    font-size: 12px;
  }

  .topbar-link--static {
    display: none;
  }

  .logo-link img {
    width: 52px;
    height: 52px;
  }

  .brand-copy strong {
    font-size: 16px;
  }

  .brand-copy small {
    font-size: 10px;
    letter-spacing: 0.14em;
  }

  .mobile-nav-sidebar {
    width: min(340px, calc(100vw - 12px));
  }

  .search-overlay {
    padding: 24px 18px;
  }

  .search-overlay__result {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .header-topbar__group--left {
    gap: 6px 14px;
  }

  .brand-copy {
    max-width: 120px;
  }

  .mobile-nav-header,
  .mobile-nav-content,
  .mobile-nav-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
