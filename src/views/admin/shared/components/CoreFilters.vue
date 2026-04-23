<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  searchKeyword: {
    type: String,
    required: true,
  },
  statusFilter: {
    type: String,
    required: true,
  },
  hasStatusFilter: {
    type: Boolean,
    required: true,
  },
  statusOptions: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'update:searchKeyword',
  'update:statusFilter',
  'search',
])

const safeLabel = computed(() => props.config?.label || 'bản ghi')
const searchPlaceholder = computed(
  () => `Search ${String(safeLabel.value).toLowerCase()}...`,
)
</script>

<template>
  <div class="filters">
    <div class="filters__group filters__group--search">
      <span class="filters__label">Keyword</span>
      <input
        :value="searchKeyword"
        type="search"
        :placeholder="searchPlaceholder"
        @input="emit('update:searchKeyword', $event.target.value)"
        @keyup.enter="emit('search')"
      />
    </div>

    <div v-if="hasStatusFilter" class="filters__group filters__group--status">
      <span class="filters__label">Status</span>
      <select
        :value="statusFilter"
        aria-label="Status filter"
        @change="emit('update:statusFilter', $event.target.value)"
      >
        <option value="">All statuses</option>
        <option
          v-for="status in statusOptions"
          :key="status.value"
          :value="status.value"
        >
          {{ status.label }}
        </option>
      </select>
    </div>

    <div class="filters__actions">
      <button
        type="button"
        class="btn btn-secondary"
        :disabled="loading"
        @click="emit('search')"
      >
        {{ loading ? "Searching..." : "Search" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.filters__group {
  display: grid;
  gap: 8px;
}

.filters__group--search {
  flex: 1;
  min-width: 260px;
}

.filters__group--status {
  min-width: 180px;
}

.filters__label {
  color: #6a8097;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.filters__actions {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

input,
select {
  min-height: 48px;
  border: 1px solid rgba(198, 216, 233, 0.95);
  border-radius: 16px;
  padding: 12px 14px;
  color: #17324d;
  background: rgba(255, 255, 255, 0.98);
  font: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

input {
  width: 100%;
}

input:focus,
select:focus {
  outline: none;
  border-color: rgba(63, 140, 221, 0.74);
  box-shadow: 0 0 0 4px rgba(79, 167, 255, 0.14);
}

.btn {
  border-radius: 16px;
  border: 1px solid transparent;
  min-height: 46px;
  padding: 0 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
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

@media (max-width: 860px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filters__group,
  .filters__actions,
  .filters__actions > * {
    width: 100%;
  }
}
</style>
