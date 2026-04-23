<script setup>
/**
 * MediaAssetsManager — Quản lý Tài Nguyên Media.
 * Entity-key: 'media_assets'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])


// ═══════════════════════════════════════════════════════════
// MEDIA-ASSETS-SPECIFIC LOGIC (thêm tại đây khi cần)
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="media_assets"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
