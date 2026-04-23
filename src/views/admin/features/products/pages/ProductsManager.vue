<script setup>
/**
 * ProductsManager — Quản lý Sản Phẩm.
 * Entity-key: 'products'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])


// ═══════════════════════════════════════════════════════════
// PRODUCTS-SPECIFIC LOGIC (thêm tại đây khi cần)
// Ví dụ: validate giá, tính toán tồn kho, v.v.
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="products"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
