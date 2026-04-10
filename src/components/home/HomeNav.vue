<script setup>
defineProps({
  sections: {
    type: Array,
    required: true
  },
  activeSection: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['navigate'])

const navigate = (index) => {
  emit('navigate', index)
}
</script>

<template>
  <div class="home-nav">
    <ul>
      <li v-for="(section, index) in sections" :key="index">
        <button 
          :class="{ 'active': activeSection === index }"
          @click="navigate(index)"
        >
          <span class="dot"></span>
          <span class="label">{{ section.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.home-nav {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1005;

  ul {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  li {
    position: relative;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0;
    flex-direction: row-reverse;

    .dot {
      width: 8px;
      height: 8px;
      background-color: rgba(255, 255, 255, 0.56);
      border-radius: 50%;
      transition: all 0.3s ease;
    }

    .label {
      display: none;
    }

    &.active {
      .dot {
        width: 16px;
        height: 16px;
        background-color: #e10012;
        box-shadow: 0 0 0 5px rgba(225, 0, 18, 0.12);
      }
    }
  }
}

@media (max-width: 768px) {
  .home-nav {
    display: none;
  }
}
</style>
