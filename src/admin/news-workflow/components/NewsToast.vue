<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    type?: 'success' | 'error' | 'warning'
    message?: string
    duration?: number
  }>(),
  { type: 'success', message: '', duration: 3200 }
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const show = ref(props.visible)
let timerId: number | null = null

function clearTimer() {
  if (timerId !== null) {
    window.clearTimeout(timerId)
    timerId = null
  }
}

function startTimer() {
  clearTimer()
  if (props.duration > 0) {
    timerId = window.setTimeout(() => {
      show.value = false
      emit('close')
    }, props.duration)
  }
}

watch(
  () => props.visible,
  (val) => {
    show.value = val
    if (val) {
      startTimer()
    } else {
      clearTimer()
    }
  }
)

function handleClose() {
  show.value = false
  clearTimer()
  emit('close')
}

onBeforeUnmount(clearTimer)
</script>

<template>
  <Teleport to="body">
    <transition name="nw-toast-slide">
      <div
        v-if="show"
        class="nw-toast"
        :class="`nw-toast--${props.type}`"
        role="status"
        aria-live="polite"
      >
        <span class="nw-toast__icon">
          <template v-if="props.type === 'success'">✓</template>
          <template v-else-if="props.type === 'error'">✕</template>
          <template v-else>⚠</template>
        </span>
        <span class="nw-toast__message">{{ props.message }}</span>
        <button type="button" class="nw-toast__close" aria-label="Đóng" @click="handleClose">×</button>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.nw-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  min-width: 320px;
  max-width: min(520px, calc(100vw - 40px));
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  box-shadow:
    0 8px 32px rgba(15, 23, 42, 0.18),
    0 2px 8px rgba(15, 23, 42, 0.08);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  backdrop-filter: blur(8px);
}

.nw-toast--success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #a7f3d0;
  color: #065f46;
}

.nw-toast--error {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border-color: #fca5a5;
  color: #991b1b;
}

.nw-toast--warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-color: #fcd34d;
  color: #92400e;
}

.nw-toast__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.nw-toast--success .nw-toast__icon {
  background: #10b981;
  color: #fff;
}

.nw-toast--error .nw-toast__icon {
  background: #ef4444;
  color: #fff;
}

.nw-toast--warning .nw-toast__icon {
  background: #f59e0b;
  color: #fff;
}

.nw-toast__message {
  flex: 1;
  min-width: 0;
}

.nw-toast__close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.nw-toast__close:hover {
  background: rgba(0, 0, 0, 0.12);
}

.nw-toast-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nw-toast-slide-leave-active {
  transition: all 0.25s ease-in;
}

.nw-toast-slide-enter-from {
  opacity: 0;
  transform: translateX(80px) scale(0.92);
}

.nw-toast-slide-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.96);
}
</style>
