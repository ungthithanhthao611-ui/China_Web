<script setup>
import { ChevronRight, Home } from 'lucide-vue-next'

defineProps({
  paths: {
    type: Array,
    default: () => []
  }
})
</script>

<template>
  <div class="breadcrumb-bar">
    <div class="container breadcrumb-inner">
      <ul class="breadcrumb-list">
        <li>
          <router-link to="/"><Home :size="14" /> Home</router-link>
        </li>
        <li v-for="(path, index) in paths" :key="index">
          <ChevronRight :size="14" />
          <router-link v-if="path.link" :to="path.link">{{ path.name }}</router-link>
          <span v-else>{{ path.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/assets/scss/variables" as *;

.breadcrumb-bar {
  background-color: #fcfcfc;
  border-bottom: 1px solid #f0f0f0;
  padding: 15px 0;
  font-size: 14px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #888;
  
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    
    a {
      display: flex;
      align-items: center;
      gap: 5px;
      &:hover {
        color: $primary-color;
      }
    }
    
    span {
      color: $black;
      font-weight: 500;
    }
  }
}
</style>

