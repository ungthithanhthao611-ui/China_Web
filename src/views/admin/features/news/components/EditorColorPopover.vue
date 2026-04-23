<template>
  <div v-if="open" class="color-popover">
    <div class="color-popover__section">
      <p class="color-popover__label">Theme Colors</p>
      <div class="color-grid">
        <button
          v-for="color in themeColors"
          :key="color"
          type="button"
          class="color-swatch"
          :style="{ background: color }"
          @click="$emit('select', color)"
        />
      </div>
    </div>

    <div class="color-popover__section">
      <p class="color-popover__label">Standard Colors</p>
      <div class="color-grid">
        <button
          v-for="color in standardColors"
          :key="color"
          type="button"
          class="color-swatch"
          :style="{ background: color }"
          @click="$emit('select', color)"
        />
      </div>
    </div>

    <div class="color-popover__section color-popover__section--picker">
      <p class="color-popover__label">More Colors</p>
      <input type="color" class="color-picker-input" :value="modelValue" @input="$emit('select', $event.target.value)" />
    </div>
  </div>
</template>

<script setup>
import { STANDARD_COLORS, THEME_COLORS } from '@/views/admin/features/news/components/toolbarOptions.js'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '#111827',
  },
})

defineEmits(['select'])

const themeColors = THEME_COLORS
const standardColors = STANDARD_COLORS
</script>

<style scoped>
.color-popover {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 40;
  width: 240px;
  padding: 14px;
  border: 1px solid #dbe2ea;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  display: grid;
  gap: 14px;
}

.color-popover__section {
  display: grid;
  gap: 10px;
}

.color-popover__label {
  margin: 0;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-swatch {
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  aspect-ratio: 1;
}

.color-picker-input {
  width: 100%;
  height: 38px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}
</style>
