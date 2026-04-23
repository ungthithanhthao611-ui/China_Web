<script setup>
/**
 * SiteSettingsManager — Quản lý Cài Đặt Website.
 * Entity-key: 'site_settings'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])


// ═══════════════════════════════════════════════════════════
// SITE-SETTINGS-SPECIFIC LOGIC (thêm tại đây khi cần)
// Ví dụ: validate config keys, preview settings, v.v.
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="site_settings"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
