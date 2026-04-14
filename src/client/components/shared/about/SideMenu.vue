<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { name: 'Company Introduction', path: '/about/company-introduction' },
  { name: 'Chairman\'s Speech', path: '/about/chairman-speech' },
  { name: 'Organization Chart', path: '/about/organization-chart' },
  { name: 'Corporate Culture', path: '/about/corporate-culture' },
  { name: 'Development Course', path: '/about/development-course' },
  { name: 'Leadership Care', path: '/about/leadership-care' }
]
</script>

<template>
  <aside class="side-menu">
    <div class="menu-header">
      <h3>About Us</h3>
    </div>
    <ul class="menu-list">
      <li v-for="item in menuItems" :key="item.name">
        <router-link :to="item.path" :class="{ 'active': route.path === item.path }">
          {{ item.name }}
          <span class="indicator"></span>
        </router-link>
      </li>
    </ul>
    
    <div class="side-contact">
      <h4>Contact Us</h4>
      <p>Tel: +86-755-82705555</p>
      <p>Email: info@sinodecor.com</p>
      <router-link to="/contact" class="link-btn">Online Consultation</router-link>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.side-menu {
  background-color: $white;
  border: 1px solid #f0f0f0;
  
  .menu-header {
    background-color: $black;
    color: $white;
    padding: 20px 30px;
    h3 {
      font-size: 20px;
      margin: 0;
    }
  }

  .menu-list {
    li {
      border-bottom: 1px solid #f0f0f0;
      a {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 30px;
        font-weight: 500;
        transition: all 0.3s;
        
        .indicator {
          width: 0;
          height: 2px;
          background-color: $primary-color;
          transition: width 0.3s;
        }

        &.active, &:hover {
          background-color: $bg-light;
          color: $primary-color;
          .indicator {
            width: 20px;
          }
        }
      }
    }
  }

  .side-contact {
    padding: 30px;
    background-color: #f9f9f9;
    
    h4 {
      margin-bottom: 15px;
      color: $black;
    }
    
    p {
      font-size: 14px;
      color: $text-light;
      margin-bottom: 5px;
    }
    
    .link-btn {
      display: block;
      margin-top: 20px;
      padding: 12px;
      background-color: $primary-color;
      color: $white;
      text-align: center;
      font-weight: 600;
      font-size: 14px;
    }
  }
}
</style>

