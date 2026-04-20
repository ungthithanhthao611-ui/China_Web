<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  startValue: {
    type: Number,
    default: 0
  },
  endValue: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 700 // Match the 700ms transition feel
  },
  suffix: {
    type: String,
    default: ''
  }
})

const displayValue = ref(props.startValue)
const observerTarget = ref(null)
const hasAnimated = ref(false)

const startCounter = () => {
  if (hasAnimated.value) return
  hasAnimated.value = true
  
  const start = props.startValue
  const end = props.endValue
  const startTime = performance.now()
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.duration, 1)
    
    // Ease out quad formula
    const easeProgress = progress * (2 - progress)
    
    displayValue.value = Math.floor(start + (end - start) * easeProgress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      displayValue.value = end
    }
  }
  
  requestAnimationFrame(animate)
}

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      startCounter()
    }
  }, { threshold: 0.1 })
  
  if (observerTarget.value) {
    observer.observe(observerTarget.value)
  }
})
</script>

<template>
  <div ref="observerTarget" class="count-up">
    {{ displayValue }}{{ suffix }}
  </div>
</template>

<style scoped>
.count-up {
  display: inline-block;
}
</style>
