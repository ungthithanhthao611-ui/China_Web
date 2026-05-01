<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ADMIN_SESSION_EXPIRED_EVENT } from '@/views/admin/shared/constants/auth'

const router = useRouter()
const route = useRoute()

function handleAdminSessionExpired(event) {
  if (route.name === 'AdminLogin') {
    return
  }

  const redirect = String(route.fullPath || '/admin/dashboard').startsWith('/admin')
    ? route.fullPath
    : '/admin/dashboard'

  router.replace({
    name: 'AdminLogin',
    query: {
      redirect,
      reason: event?.detail?.reason || 'expired',
    },
  })
}

onMounted(() => {
  document.body.classList.add('admin-body')
  window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, handleAdminSessionExpired)
})

onBeforeUnmount(() => {
  document.body.classList.remove('admin-body')
  window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, handleAdminSessionExpired)
})
</script>

<template>
  <div class="admin-layout">
    <router-view />
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  color: #0f172a;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --admin-sidebar-width: clamp(210px, 14vw, 220px);
  --admin-sidebar-padding: clamp(10px, 1vw, 12px);
  --admin-content-padding: clamp(12px, 1.2vw, 16px);
  --admin-panel-padding: clamp(14px, 1.4vw, 18px);
  --admin-section-gap: clamp(12px, 1.2vw, 14px);
  --admin-card-radius: 16px;
  --admin-card-radius-lg: 20px;
  --admin-card-radius-sm: 10px;
  --admin-card-border: 1px solid rgba(198, 216, 233, 0.64);
  --admin-card-shadow: 0 8px 18px rgba(18, 43, 71, 0.05);
  --admin-card-shadow-soft: 0 6px 12px rgba(17, 41, 67, 0.04);
  --admin-card-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 251, 255, 0.96));
  --admin-title-size: clamp(22px, 2.1vw, 30px);
  --admin-heading-size: clamp(18px, 1.5vw, 22px);
  --admin-subheading-size: clamp(16px, 1.3vw, 20px);
  --admin-body-size: 13px;
  --admin-body-size-sm: 12px;
  --admin-label-size: 10.5px;
  --admin-control-height: 38px;
  --admin-control-radius: 10px;
  --admin-button-height: 36px;
  --admin-sidebar-item-height: 36px;
  --admin-stat-card-height: 98px;
}

:global(body.admin-body) {
  background: #f6f9fc;
}
</style>
