<script setup>
/**
 * InquiriesManager — Quản lý yêu cầu liên hệ.
 * Entity-key: 'inquiry_submissions'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])

// ═══════════════════════════════════════════════════════════
// INQUIRY-SUBMISSIONS-SPECIFIC LOGIC (thêm tại đây khi cần)
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="inquiry_submissions"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
