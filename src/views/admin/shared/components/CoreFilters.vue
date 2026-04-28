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
  hasAdvancedAboutFilters: {
    type: Boolean,
    default: false,
  },
  aboutFilterConfig: {
    type: Object,
    default: null,
  },
  aboutSectionFilter: {
    type: String,
    default: '',
  },
  aboutBlockFilter: {
    type: String,
    default: '',
  },
  aboutCompletenessFilter: {
    type: String,
    default: '',
  },
  aboutMediaFilter: {
    type: String,
    default: '',
  },
  aboutViewMode: {
    type: String,
    default: 'table',
  },
  aboutViewModeOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'update:searchKeyword',
  'update:statusFilter',
  'update:aboutSectionFilter',
  'update:aboutBlockFilter',
  'update:aboutCompletenessFilter',
  'update:aboutMediaFilter',
  'update:aboutViewMode',
  'search',
  'reset-about-filters',
])

const safeLabel = computed(() => props.config?.label || 'bản ghi')
const searchPlaceholder = computed(
  () => `Tìm kiếm ${String(safeLabel.value).toLowerCase()}...`,
)

const sectionOptions = computed(
  () => props.aboutFilterConfig?.sectionOptions || [],
)
const blockOptions = computed(
  () => props.aboutFilterConfig?.blockOptions || [],
)
const completenessOptions = computed(
  () => props.aboutFilterConfig?.completenessOptions || [],
)
const mediaStateOptions = computed(() => [
  { value: 'with_media', label: 'Có media' },
  { value: 'without_media', label: 'Chưa có media' },
])
</script>

<template>
  <div class="filters">
    <div class="filters__main-grid">
      <div class="filters__group filters__group--search">
        <span class="filters__label">Từ khóa</span>
        <input
          id="about-filter-keyword"
          :value="searchKeyword"
          type="search"
          :placeholder="searchPlaceholder"
          @input="emit('update:searchKeyword', $event.target.value)"
          @keyup.enter="emit('search')"
        />
      </div>

      <div v-if="hasStatusFilter" class="filters__group filters__group--status">
        <span class="filters__label">Trạng thái</span>
        <select
          id="about-filter-status"
          :value="statusFilter"
          aria-label="Lọc trạng thái"
          @change="emit('update:statusFilter', $event.target.value)"
        >
          <option value="">Tất cả trạng thái</option>
          <option
            v-for="status in statusOptions"
            :key="status.value"
            :value="status.value"
          >
            {{ status.label }}
          </option>
        </select>
      </div>

      <div
        v-if="hasAdvancedAboutFilters"
        class="filters__group filters__group--view-mode"
      >
        <span class="filters__label">Chế độ xem</span>
        <select
          id="about-filter-view-mode"
          :value="aboutViewMode"
          aria-label="Chế độ xem About"
          @change="emit('update:aboutViewMode', $event.target.value)"
        >
          <option
            v-for="option in aboutViewModeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="hasAdvancedAboutFilters" class="filters__advanced-grid">
      <div class="filters__group">
        <span class="filters__label">Section</span>
        <select
          id="about-filter-section"
          :value="aboutSectionFilter"
          aria-label="Lọc theo section"
          @change="emit('update:aboutSectionFilter', $event.target.value)"
        >
          <option value="">Tất cả section</option>
          <option
            v-for="option in sectionOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="filters__group">
        <span class="filters__label">Block</span>
        <select
          id="about-filter-block"
          :value="aboutBlockFilter"
          aria-label="Lọc theo block"
          @change="emit('update:aboutBlockFilter', $event.target.value)"
        >
          <option value="">Tất cả block</option>
          <option
            v-for="option in blockOptions"
            :key="`${option.value}-${option.label}`"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="filters__group">
        <span class="filters__label">Tình trạng dữ liệu</span>
        <select
          id="about-filter-completeness"
          :value="aboutCompletenessFilter"
          aria-label="Lọc tình trạng dữ liệu"
          @change="emit('update:aboutCompletenessFilter', $event.target.value)"
        >
          <option value="">Tất cả</option>
          <option
            v-for="option in completenessOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="filters__group">
        <span class="filters__label">Media</span>
        <select
          id="about-filter-media"
          :value="aboutMediaFilter"
          aria-label="Lọc media"
          @change="emit('update:aboutMediaFilter', $event.target.value)"
        >
          <option value="">Tất cả</option>
          <option
            v-for="option in mediaStateOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="filters__actions">
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="loading"
        @click="emit('search')"
      >
        {{ loading ? '...' : 'Áp dụng' }}
      </button>

      <button
        v-if="hasAdvancedAboutFilters"
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="loading"
        @click="emit('reset-about-filters')"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: grid;
  gap: 12px;
}

.filters__main-grid,
.filters__advanced-grid {
  display: grid;
  gap: 10px;
}

.filters__main-grid {
  grid-template-columns: minmax(260px, 1.6fr) repeat(2, minmax(180px, 0.9fr));
}

.filters__advanced-grid {
  grid-template-columns: repeat(4, minmax(160px, 1fr));
}

.filters__group {
  display: grid;
  gap: 6px;
}

.filters__label {
  color: #6a8097;
  font-size: var(--admin-label-size, 11px);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.filters__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

input,
select {
  min-height: var(--admin-control-height, 42px);
  border: 1px solid rgba(198, 216, 233, 0.95);
  border-radius: var(--admin-control-radius, 14px);
  padding: 8px 10px;
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
  border-radius: var(--admin-control-radius, 14px);
  border: 1px solid transparent;
  min-height: var(--admin-button-height, 40px);
  padding: 0 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-secondary {
  color: #475569;
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.btn-ghost {
  color: #64748b;
  background: #fff;
  border-color: #e2e8f0;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 1080px) {
  .filters__main-grid,
  .filters__advanced-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .filters__main-grid,
  .filters__advanced-grid {
    grid-template-columns: 1fr;
  }

  .filters__actions,
  .filters__actions > * {
    width: 100%;
  }
}
</style>
