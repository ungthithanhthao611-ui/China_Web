<script setup>
defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  dialog: {
    type: Object,
    required: true,
  },
  confirmButtonClass: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["cancel", "accept"]);
</script>

<template>
  <transition name="confirm-fade">
    <div
      v-if="visible"
      class="action-confirm-layer"
      role="presentation"
      @click="emit('cancel')"
    >
      <article
        class="action-confirm-card"
        :class="`action-confirm-card--${dialog.tone}`"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-confirm-title"
        @click.stop
      >
        <div class="action-confirm-head">
          <div class="action-confirm-icon">
            {{ dialog.tone === "danger" ? "!" : "?" }}
          </div>
          <div>
            <p class="eyebrow">{{ dialog.eyebrow }}</p>
            <h3 id="action-confirm-title">{{ dialog.title }}</h3>
          </div>
        </div>
        <p class="action-confirm-copy">{{ dialog.message }}</p>
        <div class="action-confirm-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="emit('cancel')"
          >
            Cancel
          </button>
          <button
            type="button"
            :class="confirmButtonClass"
            @click="emit('accept')"
          >
            {{ dialog.confirmText }}
          </button>
        </div>
      </article>
    </div>
  </transition>
</template>

<style scoped>
.action-confirm-layer {
  position: fixed;
  inset: 0;
  z-index: 1450;
  display: grid;
  place-items: center;
  padding: 14px;
  background: rgba(7, 21, 36, 0.58);
  backdrop-filter: blur(10px);
}

.action-confirm-card {
  width: min(480px, calc(100vw - 28px));
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: var(--admin-card-radius, 22px);
  border: 1px solid rgba(212, 224, 238, 0.9);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 250, 255, 0.96));
  box-shadow: 0 22px 42px rgba(8, 24, 42, 0.24);
}

.action-confirm-card--danger {
  border-color: rgba(238, 188, 198, 0.92);
}

.action-confirm-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-confirm-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 18px;
  font-weight: 800;
  color: #27557a;
  background: linear-gradient(135deg, rgba(39, 158, 208, 0.2), rgba(39, 158, 208, 0.06));
  border: 1px solid rgba(39, 158, 208, 0.2);
}

.action-confirm-card--danger .action-confirm-icon {
  color: #a33447;
  background: linear-gradient(135deg, rgba(239, 188, 197, 0.3), rgba(255, 240, 242, 0.76));
  border-color: rgba(210, 97, 120, 0.28);
}

.eyebrow {
  margin: 0 0 6px;
  color: #68809a;
  font-size: var(--admin-label-size, 11px);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 800;
}

h3 {
  margin: 0;
  color: #17324d;
  font-size: 22px;
}

.action-confirm-copy {
  margin: 0;
  color: #4c6783;
  font-size: 14px;
  line-height: 1.55;
}

.action-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

:deep(.btn) {
  border-radius: var(--admin-control-radius, 14px);
  border: 1px solid transparent;
  min-height: var(--admin-button-height, 40px);
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

:deep(.btn:hover) {
  transform: translateY(-1px);
}

:deep(.btn-secondary) {
  color: #274666;
  border-color: rgba(198, 216, 233, 0.95);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 252, 0.96));
}

:deep(.btn-primary) {
  color: #fff;
  background: linear-gradient(135deg, #1f7ae0 0%, #4fa7ff 100%);
  box-shadow: 0 12px 22px rgba(31, 122, 224, 0.2);
}

:deep(.btn-danger) {
  color: #fff;
  background: linear-gradient(135deg, #d84562 0%, #f07189 100%);
  box-shadow: 0 12px 22px rgba(216, 69, 98, 0.2);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 640px) {
  .action-confirm-card {
    padding: 16px;
    border-radius: 18px;
  }

  h3 {
    font-size: 20px;
  }

  .action-confirm-actions {
    flex-direction: column;
  }

  :deep(.btn) {
    width: 100%;
  }
}
</style>
