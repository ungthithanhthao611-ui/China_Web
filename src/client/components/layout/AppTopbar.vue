<script setup>
import { Mail, Phone, Globe } from 'lucide-vue-next'
</script>

<template>
  <div class="topbar">
    <div class="container topbar-inner">
      <div class="topbar-left">
        <div class="contact-item">
          <Mail :size="14" />
          <span>info@sinodecor.com</span>
        </div>
        <div class="contact-item">
          <Phone :size="14" />
          <span>+86-755-82705555</span>
        </div>
      </div>
      <div class="topbar-right">
        <router-link to="/contact">Contact Us</router-link>
        <router-link to="/subsidiary">Subsidiary</router-link>
        <router-link to="/branch">Branch</router-link>
        <router-link to="/join-us">Join Us</router-link>
        <div class="lang-switch">
          <Globe :size="14" />
          <span>English</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "../../assets/scss/variables" as *;

.topbar {
  background-color: #f0f0f0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  padding: 8px 0;
  color: #666;

  .topbar-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .topbar-left, .topbar-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .topbar-right {
    a {
      &:hover {
        color: $primary-color;
      }
    }
  }

  .lang-switch {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-weight: 600;
    
    &:hover {
      color: $primary-color;
    }
  }
}

@media (max-width: 768px) {
  .topbar-left {
    display: none;
  }
  .topbar-right {
    width: 100%;
    justify-content: center;
    font-size: 10px;
    gap: 10px;
  }
}
</style>
