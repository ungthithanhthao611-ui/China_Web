<script setup>
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-vue-next'
import { uiState } from '../../utils/uiState'

const currentYear = new Date().getFullYear()

const footerLinks = [
  {
    title: 'About Us',
    links: [
      { name: 'Company Profile', path: '/about/company-introduction' },
      { name: "Chairman's Speech", path: '/about/chairman-speech' },
      { name: 'Corporate Culture', path: '/about/corporate-culture' },
      { name: 'Development Course', path: '/about/development-course' }
    ]
  },
  {
    title: 'Qualification Honor',
    links: [
      { name: 'Qualification Certificate', path: '/honors#page2' },
      { name: 'Honorary Awards', path: '/honors#page3' }
    ]
  },
  {
    title: 'Resources',
    links: [
      { name: 'Business Areas', path: '/business-areas' },
      { name: 'Project Case', path: '/projects' },
      { name: 'Video Center', path: '/video' },
      { name: 'News Center', path: '/news/enterprise' }
    ]
  }
]
</script>

<template>
  <footer class="footer" :class="{ 'is-hidden': uiState.isFooterHidden }">
    <div class="container footer-top">
      <div class="footer-grid">
        <div class="footer-info">
          <div class="footer-logo">
            <span class="logo-text">SINO</span>
            <span class="logo-sub">DECORATION</span>
          </div>
          <p class="footer-desc">
            Shenzhen Sino-Decoration Co., Ltd. is a national high-tech enterprise integrating design, research and development, and production.
          </p>
          <div class="social-links">
            <a href="#"><Facebook :size="20" /></a>
            <a href="#"><Twitter :size="20" /></a>
            <a href="#"><Linkedin :size="20" /></a>
            <a href="#"><Instagram :size="20" /></a>
          </div>
        </div>

        <div v-for="group in footerLinks" :key="group.title" class="footer-link-group">
          <h3>{{ group.title }}</h3>
          <ul>
            <li v-for="link in group.links" :key="link.name">
              <router-link :to="link.path">{{ link.name }}</router-link>
            </li>
          </ul>
        </div>

        <div class="footer-contact">
          <h3>Contact Us</h3>
          <ul class="contact-list">
            <li>
              <MapPin :size="18" />
              <span>Building A, Sinodecor Industrial Park, Shenzhen, China</span>
            </li>
            <li>
              <Phone :size="18" />
              <span>+86-755-82705555</span>
            </li>
            <li>
              <Mail :size="18" />
              <span>info@sinodecor.com</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <div class="container footer-bottom-inner">
        <p>&copy; {{ currentYear }} Shenzhen Sino-Decoration Co., Ltd. All Rights Reserved.</p>
        <div class="footer-bottom-links">
          <router-link to="/privacy">Privacy Policy</router-link>
          <router-link to="/copyright">Copyright Notice</router-link>
          <router-link to="/security">Security</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
@use "sass:color";
@use '../../assets/scss/variables' as *;

.footer {
  background-color: $black;
  color: #ccc;
  padding-top: 80px;

  &.is-hidden {
    display: none !important;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr 1fr 1.5fr;
    gap: 40px;
    padding-bottom: 60px;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr 1fr 1fr;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .footer-logo {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;

    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: $white;
    }

    .logo-sub {
      font-size: 9px;
      color: #999;
      letter-spacing: 2px;
    }
  }

  .footer-desc {
    font-size: 14px;
    line-height: 1.8;
    margin-bottom: 25px;
  }

  .social-links {
    display: flex;
    gap: 15px;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background-color: #333;
      border-radius: 50%;
      color: $white;
      transition: all 0.3s;

      &:hover {
        background-color: $primary-color;
        transform: translateY(-3px);
      }
    }
  }

  h3 {
    color: $white;
    font-size: 18px;
    margin-bottom: 25px;
    position: relative;
    padding-bottom: 10px;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 40px;
      height: 2px;
      background-color: $primary-color;
    }
  }

  .footer-link-group {
    ul {
      display: flex;
      flex-direction: column;
      gap: 12px;

      li {
        a {
          font-size: 14px;

          &:hover {
            color: $white;
            padding-left: 5px;
          }
        }
      }
    }
  }

  .contact-list {
    display: flex;
    flex-direction: column;
    gap: 15px;

    li {
      display: flex;
      gap: 12px;
      font-size: 14px;
      align-items: flex-start;

      svg {
        color: $primary-color;
        flex-shrink: 0;
      }
    }
  }

  .footer-bottom {
    background-color: color.adjust($black, $lightness: -5%);
    padding: 25px 0;
    font-size: 13px;
    border-top: 1px solid #222;

    .footer-bottom-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 15px;
        text-align: center;
      }
    }

    .footer-bottom-links {
      display: flex;
      gap: 20px;

      a:hover {
        color: $white;
      }
    }
  }
}
</style>
