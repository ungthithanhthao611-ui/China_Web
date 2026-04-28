<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  canCreate: {
    type: Boolean,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['refresh', 'create'])

const safeEyebrow = computed(() => props.config?.eyebrow || 'Mô-đun quản trị')
const safeLabel = computed(() => props.config?.label || 'Bản ghi')
const safeDescription = computed(
  () => props.config?.description || 'Quản lý dữ liệu từ giao diện quản trị.',
)
</script>

<template>
  <div class="manager-toolbar">
    <div class="manager-toolbar__content">
      <div class="manager-toolbar__badge-wrap">
        <p class="eyebrow">{{ safeEyebrow }}</p>
        <span class="manager-toolbar__badge">Mô-đun CMS</span>
      </div>

      <div class="manager-toolbar__heading">
        <h2>{{ safeLabel }}</h2>
        <p class="description">{{ safeDescription }}</p>
      </div>
    </div>

    <div class="toolbar-actions">
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="loading"
        @click="emit('refresh')"
      >
        {{ loading ? '...' : 'Làm mới' }}
      </button>
      <button
        v-if="canCreate"
        type="button"
        class="btn btn-primary btn-sm"
        @click="emit('create')"
      >
        Thêm mới
      </button>
    </div>
  </div>
</template>

<style scoped>
.manager-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.manager-toolbar__content {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.manager-toolbar__badge-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.manager-toolbar__badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(73, 147, 220, 0.12);
  border: 1px solid rgba(73, 147, 220, 0.18);
  color: #1f5f95;
  font-size: 11px;
  font-weight: 600;
}

.eyebrow {
  margin: 0;
  color: #6c839c;
  font-size: var(--admin-label-size, 11px);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 500;
}

.manager-toolbar__heading {
  display: grid;
  gap: 4px;
}

h2 {
  margin: 0;
  color: #15314d;
  font-size: var(--admin-heading-size, clamp(22px, 2vw, 30px));
  line-height: 1.08;
}

.description {
  margin: 0;
  max-width: 920px;
  color: #5d7690;
  font-size: var(--admin-body-size, 14px);
  line-height: 1.5;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border-radius: var(--admin-control-radius, 14px);
  border: 1px solid transparent;
  min-height: var(--admin-button-height, 40px);
  padding: 0 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary {
  color: #fff;
  background: #3b82f6;
}

.btn-secondary {
  color: #475569;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 1024px) {
  .manager-toolbar {
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
  }
}

@media (max-width: 860px) {
  .toolbar-actions > * {
    width: 100%;
  }
}
</style>
