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

const safeEyebrow = computed(() => props.config?.eyebrow || 'Admin module')
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
        <span class="manager-toolbar__badge">CMS Module</span>
      </div>

      <div class="manager-toolbar__heading">
        <h2>{{ safeLabel }}</h2>
        <p class="description">{{ safeDescription }}</p>
      </div>
    </div>

    <div class="toolbar-actions">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="emit('refresh')"
      >
        {{ loading ? "Refreshing..." : "Refresh" }}
      </button>
      <button
        v-if="canCreate"
        type="button"
        class="btn btn-primary"
        @click="emit('create')"
      >
        New Record
      </button>
    </div>
  </div>
</template>

<style scoped>
.manager-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.manager-toolbar__content {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.manager-toolbar__badge-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.manager-toolbar__badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(73, 147, 220, 0.12);
  border: 1px solid rgba(73, 147, 220, 0.18);
  color: #1f5f95;
  font-size: 12px;
  font-weight: 600;
}

.eyebrow {
  margin: 0;
  color: #6c839c;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-weight: 500;
}

.manager-toolbar__heading {
  display: grid;
  gap: 8px;
}

h2 {
  margin: 0;
  color: #15314d;
  font-size: clamp(28px, 3vw, 38px);
  line-height: 1.05;
}

.description {
  margin: 0;
  max-width: 920px;
  color: #5d7690;
  font-size: 14px;
  line-height: 1.65;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  border-radius: 16px;
  border: 1px solid transparent;
  min-height: 46px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
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
  background: linear-gradient(135deg, #1f7ae0 0%, #4fa7ff 100%);
  box-shadow: 0 16px 30px rgba(31, 122, 224, 0.22);
}

.btn-secondary {
  color: #284767;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 247, 252, 0.96));
  border-color: rgba(198, 216, 233, 0.95);
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
