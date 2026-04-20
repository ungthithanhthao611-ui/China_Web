<script setup>
defineProps({
  sections: {
    type: Array,
    required: true
  },
  activeSectionId: {
    type: String,
    required: true
  },
  progressPercentage: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['select'])
</script>

<template>
  <nav class="case-progress" aria-label="Section progress">
    <div class="case-progress__track"></div>
    <div class="case-progress__fill" :style="{ height: `${progressPercentage}%` }"></div>

    <button
      v-for="sectionId in sections"
      :key="sectionId"
      class="case-progress__step"
      :class="{ 'is-active': activeSectionId === sectionId }"
      type="button"
      @click="emit('select', sectionId)"
    ></button>
  </nav>
</template>

<style scoped>
.case-progress {
  position: fixed;
  top: 50%;
  right: 10px;
  z-index: 20;
  width: 14px;
  height: 36%;
  display: flex;
  flex-direction: column;
  transform: translateY(-50%);
}

.case-progress__track,
.case-progress__fill {
  position: absolute;
  right: 3px;
  width: 8px;
  border-radius: 999px;
}

.case-progress__track {
  top: 0;
  bottom: 0;
  background: rgba(44, 53, 69, 0.86);
}

.case-progress__fill {
  top: 0;
  background: #d7000f;
  transition: height 0.35s ease;
}

.case-progress__step {
  position: relative;
  flex: 1;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.case-progress__step.is-active::after {
  content: '';
  position: absolute;
  right: 2px;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translateY(-50%);
  border: 2px solid #ffffff;
  background: #d7000f;
}

@media (max-width: 768px) {
  .case-progress {
    right: 8px;
    width: 12px;
  }
}
</style>
