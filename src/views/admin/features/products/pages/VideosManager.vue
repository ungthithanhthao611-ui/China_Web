<script setup>
/**
 * VideosManager — Quản lý Video.
 * Entity-key: 'videos'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])


// ═══════════════════════════════════════════════════════════
// VIDEOS-SPECIFIC LOGIC (thêm tại đây khi cần)
// Ví dụ: validate video URL, xử lý YouTube embed, v.v.
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="videos"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
