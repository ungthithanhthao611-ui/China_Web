<script setup>
/**
 * AdminUsersManager — Quản lý tài khoản quản trị.
 * Entity-key: 'admin_users'
 */
import AdminCoreManager from '@/views/admin/shared/components/AdminCoreManager.vue'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false },
})

defineEmits(['notify-success', 'notify-error', 'clear-notify'])
</script>

<template>
  <AdminCoreManager
    :token="token"
    entity-key="admin_users"
    :active="active"
    @notify-success="$emit('notify-success', $event)"
    @notify-error="$emit('notify-error', $event)"
    @clear-notify="$emit('clear-notify')"
  />
</template>
