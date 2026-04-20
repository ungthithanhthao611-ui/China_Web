<script setup>
defineProps({
  current: Number,
  total: Number
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="business-side-nav">
    <div 
      v-for="i in total" 
      :key="i"
      class="nav-dot"
      :class="{ active: current === i - 1 }"
      @click="emit('navigate', i - 1)"
    >
      <div class="dot-inner"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.business-side-nav {
  position: fixed;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px; // Tighter gap like screenshot
  z-index: 1000;
  
  .nav-dot {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    
    .dot-inner {
      width: 7px;
      height: 7px;
      background: rgba(128, 128, 128, 0.8); // Grey like screenshot
      border-radius: 50%;
      transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
    }
    
    &.active {
      .dot-inner {
        background: #c8161d; // Red like screenshot
        width: 12px;
        height: 12px;
        transform: scale(1);
      }
    }

    &:hover:not(.active) {
      .dot-inner {
        background: #fff;
        transform: scale(1.2);
      }
    }
  }
}
</style>
