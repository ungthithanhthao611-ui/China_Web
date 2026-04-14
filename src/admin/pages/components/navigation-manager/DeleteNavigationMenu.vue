<script setup>
defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['trigger'])
</script>

<template>
  <button type="button" class="btn btn-danger-outline" :disabled="disabled" @click="emit('trigger')">
    Delete Menu
  </button>
</template>
