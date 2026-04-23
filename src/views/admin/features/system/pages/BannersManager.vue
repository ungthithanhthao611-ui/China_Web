<script setup>
/**
 * BannersManager — Quản lý Banner.
 * Entity-key: 'banners'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])


// ═══════════════════════════════════════════════════════════
// BANNERS-SPECIFIC LOGIC (thêm tại đây khi cần)
// Ví dụ: banner focus validation, banner ordering, v.v.
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="banners"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
