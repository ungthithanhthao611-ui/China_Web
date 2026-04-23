<script setup>
/**
 * AboutManager — Quản lý nội dung trang Giới Thiệu (About).
 * Gọi trực tiếp composable useEntityManager với entity-key 'content_block_items'.
 * Thêm logic riêng cho About tại đây khi cần mở rộng.
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

// Gọi composable trực tiếp — logic nằm ở đây, không phải core

// ═══════════════════════════════════════════════════════════
// ABOUT-SPECIFIC LOGIC (thêm tại đây khi cần)
// Ví dụ: custom validation, computed riêng cho about, v.v.
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <!-- Sử dụng AdminCoreManager như layout template chia sẻ -->
  <AdminCoreManager
    :token="token"
    entity-key="content_block_items"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
