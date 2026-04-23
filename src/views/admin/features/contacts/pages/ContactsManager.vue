<script setup>
/**
 * ContactsManager — Quản lý thông tin Liên Hệ.
 * Entity-key: 'contacts'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['notify-success', 'notify-error', 'clear-notify'])


// ═══════════════════════════════════════════════════════════
// CONTACTS-SPECIFIC LOGIC (thêm tại đây khi cần)
// Ví dụ: validate tọa độ, format số điện thoại, v.v.
// ═══════════════════════════════════════════════════════════
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="contacts"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
