<script setup>
/**
 * CategoriesManager — Quản lý Danh Mục Sản Phẩm.
 * Entity-key: 'product_categories'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

// ═══════════════════════════════════════════════════════════
// PRODUCT-CATEGORIES-SPECIFIC LOGIC (thêm tại đây khi cần)
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="product_categories"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
