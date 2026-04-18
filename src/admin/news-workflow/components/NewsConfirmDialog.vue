<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    tone?: 'danger' | 'warning' | 'primary'
    loading?: boolean
  }>(),
  {
    title: 'Xác nhận thao tác',
    message: 'Bạn có chắc muốn tiếp tục?',
    confirmText: 'Xác nhận',
    cancelText: 'Huỷ',
    tone: 'primary',
    loading: false,
  }
)

const emit = defineEmits<{
  (event: 'confirm'): void
  (event: 'cancel'): void
}>()

const show = ref(props.open)

watch(
  () => props.open,
  (val) => {
    show.value = val
  }
)

function handleConfirm() {
  if (props.loading) return
  emit('confirm')
}

function handleCancel() {
  if (props.loading) return
  emit('cancel')
}

function handleOverlayClick() {
  if (props.loading) return
  emit('cancel')
}
</script>

<template>
  <Teleport to="body">
    <transition name="nw-confirm-fade">
      <div v-if="show" class="nw-confirm-overlay" @click.self="handleOverlayClick" />
    </transition>
    <transition name="nw-confirm-pop">
      <div
        v-if="show"
        class="nw-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="'nw-confirm-title'"
      >
        <div class="nw-confirm-modal__icon" :class="`nw-confirm-modal__icon--${props.tone}`">
          <template v-if="props.tone === 'danger'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6m0-6 6 6" />
            </svg>
          </template>
          <template v-else-if="props.tone === 'warning'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
            </svg>
          </template>
        </div>

        <h3 id="nw-confirm-title">{{ props.title }}</h3>
        <p>{{ props.message }}</p>

        <div class="nw-confirm-modal__actions">
          <button
            type="button"
            class="nw-confirm-btn nw-confirm-btn--ghost"
            :disabled="props.loading"
            @click="handleCancel"
          >
            {{ props.cancelText }}
          </button>
          <button
            type="button"
            class="nw-confirm-btn"
            :class="props.tone === 'danger' ? 'nw-confirm-btn--danger' : 'nw-confirm-btn--primary'"
            :disabled="props.loading"
            @click="handleConfirm"
          >
            <span v-if="props.loading" class="nw-confirm-spinner" />
            {{ props.confirmText }}
          </button>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.nw-confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
}

.nw-confirm-modal {
  position: fixed;
  z-index: 9991;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(440px, calc(100vw - 32px));
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 24px 64px rgba(15, 23, 42, 0.22),
    0 4px 16px rgba(15, 23, 42, 0.08);
  padding: 28px 24px 22px;
  text-align: center;
}

.nw-confirm-modal__icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

.nw-confirm-modal__icon svg {
  width: 26px;
  height: 26px;
}

.nw-confirm-modal__icon--danger {
  background: #fee2e2;
  color: #dc2626;
}

.nw-confirm-modal__icon--warning {
  background: #fef3c7;
  color: #d97706;
}

.nw-confirm-modal__icon--primary {
  background: #dbeafe;
  color: #2563eb;
}

.nw-confirm-modal h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.nw-confirm-modal p {
  margin: 0 0 20px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.nw-confirm-modal__actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.nw-confirm-btn {
  min-width: 110px;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.nw-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nw-confirm-btn--ghost {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.nw-confirm-btn--ghost:hover:not(:disabled) {
  background: #e5e7eb;
}

.nw-confirm-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #2563eb;
  color: #fff;
}

.nw-confirm-btn--primary:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

.nw-confirm-btn--danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: #dc2626;
  color: #fff;
}

.nw-confirm-btn--danger:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
  transform: translateY(-1px);
}

.nw-confirm-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: nw-spin 0.6s linear infinite;
}

@keyframes nw-spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.nw-confirm-fade-enter-active,
.nw-confirm-fade-leave-active {
  transition: opacity 0.25s ease;
}

.nw-confirm-fade-enter-from,
.nw-confirm-fade-leave-to {
  opacity: 0;
}

.nw-confirm-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nw-confirm-pop-leave-active {
  transition: all 0.2s ease-in;
}

.nw-confirm-pop-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.88);
}

.nw-confirm-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.94);
}
</style>
