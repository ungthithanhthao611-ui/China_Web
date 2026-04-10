<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, X, Search, Globe } from 'lucide-vue-next'

const isMobileMenuOpen = ref(false)
const route = useRoute()

const navItems = [
  { name: 'Home', path: '/' },
  {
    name: 'About Us',
    path: '/about/company-introduction#page1',
    children: [
      { name: 'Company Introduction', path: '/about/company-introduction#page2' },
      { name: "Chairman's Speech", path: '/about/chairman-speech#page3' },
      { name: 'Organization Chart', path: '/about/organization-chart#page4' },
      { name: 'Corporate Culture', path: '/about/corporate-culture#page5' },
      { name: 'Development Course', path: '/about/development-course#page6' },
      { name: 'Leadership Care', path: '/about/leadership-care#page7' },
      { name: 'Cooperative Partner', path: '/about/cooperative-partner#page8' }
    ]
  },
  {
    name: 'Qualification Honor',
    path: '/honors',
    children: [
      { name: 'Qualification Certificate', path: '/honors#page2' },
      { name: 'Honorary Awards', path: '/honors#page3' }
    ]
  },
  {
    name: 'Business Display',
    path: '/business-areas',
    children: [
      { name: 'Business Field', path: '/business-areas' },
      { name: 'Project Case', path: '/projects' },
      { name: 'Video', path: '/video' }
    ]
  },
  {
    name: 'News Center',
    path: '/news/enterprise',
    children: [
      { name: 'Corporate News', path: '/news/enterprise' },
      { name: 'Industry Dynamics', path: '/news/industry' }
    ]
  },
  {
    name: 'Contact Us',
    path: '/contact',
    children: [
      { name: 'Contact Us', path: '/contact' },
      { name: 'Subsidiary', path: '/subsidiary' },
      { name: 'Branch', path: '/branch' },
      { name: 'Join Us', path: '/join-us' }
    ]
  }
]

const isHomeOverlay = computed(() => route.path === '/' || route.path === '/honors')
const isAboutPage = computed(() => route.path.startsWith('/about'))
const isAboutHero = computed(
  () =>
    isAboutPage.value &&
    route.path === '/about/company-introduction' &&
    (!route.hash || route.hash === '#page1')
)
const isAboutSectionOverlay = computed(() => isAboutPage.value && !isAboutHero.value)

const isLinkActive = (path) => {
  const normalizedPath = path.split('#')[0]

  if (path === '/') {
    return route.path === '/'
  }

  return route.path.startsWith(normalizedPath)
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  }
)
</script>

<template>
  <header
    :class="[
      'header',
      {
        'is-home': isHomeOverlay || isAboutHero,
        'is-about-light': isAboutSectionOverlay
      }
    ]"
  >
    <div class="header_flx">
      <router-link to="/" class="logo-link">
        <img src="/images/logo.png" alt="China Decor logo" />
      </router-link>

      <div class="header_r">
        <nav class="header_nav">
          <div v-for="item in navItems" :key="item.name" class="nav-group">
            <div :class="['fnt_16', 'xuan', { active: isLinkActive(item.path) }]">
              <router-link :to="item.path">{{ item.name }}</router-link>
            </div>
            <div v-if="item.children?.length" class="colum2">
              <router-link
                v-for="child in item.children"
                :key="child.name"
                :to="child.path"
              >
                {{ child.name }}
              </router-link>
            </div>
          </div>
        </nav>

        <a class="nav_search" href="#" @click.prevent aria-label="Search">
          <Search :size="28" stroke-width="1.7" />
        </a>

        <a href="https://www.sinodecor.com" class="lang" target="_blank" rel="noopener noreferrer">
          <Globe :size="28" stroke-width="1.7" />
          <span>CN</span>
        </a>

        <button class="mobile-toggle" @click="toggleMobileMenu" type="button" aria-label="Toggle menu">
          <Menu v-if="!isMobileMenuOpen" :size="26" />
          <X v-else :size="26" />
        </button>
      </div>
    </div>

    <div :class="['mobile-nav', { 'is-open': isMobileMenuOpen }]">
      <div v-for="item in navItems" :key="`mobile-${item.name}`" class="mobile-nav-item">
        <router-link :to="item.path" @click="isMobileMenuOpen = false">{{ item.name }}</router-link>
        <div v-if="item.children?.length" class="mobile-dropdown">
          <router-link
            v-for="child in item.children"
            :key="`mobile-${child.name}`"
            :to="child.path"
            @click="isMobileMenuOpen = false"
          >
            {{ child.name }}
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1200;
  transition: background 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease;
  background: linear-gradient(180deg, rgba(4, 14, 35, 0.98) 0%, rgba(5, 19, 45, 0.95) 100%);
  border-bottom: 1px solid rgba(226, 189, 136, 0.14);
  box-shadow: 0 12px 28px rgba(4, 12, 28, 0.2);

  &.is-home {
    position: fixed;
    background: transparent;
    border-bottom-color: transparent;
    box-shadow: none;

    &::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 180px;
      background: linear-gradient(180deg, rgba(4, 15, 38, 0.78) 0%, rgba(4, 15, 38, 0.34) 58%, rgba(4, 15, 38, 0) 100%);
      pointer-events: none;
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

.logo-link {
  flex-shrink: 0;

  img {
    width: clamp(164px, 13vw, 226px);
    height: auto;
  }
}

.header_r {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  min-width: 0;
  flex: 1;
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

.mobile-nav {
  display: none;
}

@media (max-width: 1380px) {
  .header_flx {
    min-height: 96px;
    padding: 0 20px;
  }

  .header_nav {
    display: none;
  }

  .mobile-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .nav_search :deep(svg),
  .lang :deep(svg) {
    width: 24px;
    height: 24px;
  }

  .lang {
    font-size: 16px;
  }

  .mobile-nav {
    display: block;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.28s ease;
    border-top: 1px solid rgba(214, 184, 136, 0.2);
    background: rgba(3, 19, 50, 0.94);

    &.is-open {
      max-height: 85vh;
      overflow-y: auto;
    }
  }

  .mobile-nav-item {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(214, 184, 136, 0.12);

    > a {
      color: #e6c596;
      font-size: 18px;
    }
  }

  .mobile-dropdown {
    display: grid;
    gap: 8px;
    margin-top: 10px;
    padding-left: 12px;

    a {
      color: #e2d1b7;
      font-size: 14px;
    }
  }
}

@media (max-width: 768px) {
  .header_flx {
    min-height: 82px;
    padding: 0 16px;
  }

  .logo-link img {
    width: 158px;
  }

  .header_r {
    gap: 8px;
  }

  .lang span {
    display: none;
  }

  .nav_search {
    display: none;
  }
}
</style>
