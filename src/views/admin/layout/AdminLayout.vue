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
  color: #17324d;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --admin-sidebar-width: clamp(220px, 16vw, 232px);
  --admin-sidebar-padding: clamp(12px, 1.1vw, 14px);
  --admin-content-padding: clamp(10px, 1.15vw, 14px);
  --admin-panel-padding: clamp(12px, 1.15vw, 14px);
  --admin-section-gap: clamp(10px, 1vw, 12px);
  --admin-card-radius: 18px;
  --admin-card-radius-lg: 22px;
  --admin-card-radius-sm: 12px;
  --admin-card-border: 1px solid rgba(198, 216, 233, 0.72);
  --admin-card-shadow: 0 10px 22px rgba(18, 43, 71, 0.07);
  --admin-card-shadow-soft: 0 8px 18px rgba(17, 41, 67, 0.06);
  --admin-card-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(244, 249, 255, 0.94));
  --admin-title-size: clamp(24px, 2.3vw, 34px);
  --admin-heading-size: clamp(19px, 1.6vw, 24px);
  --admin-subheading-size: clamp(18px, 1.45vw, 22px);
  --admin-body-size: 13px;
  --admin-body-size-sm: 12px;
  --admin-label-size: 11px;
  --admin-control-height: 38px;
  --admin-control-radius: 12px;
  --admin-button-height: 36px;
  --admin-sidebar-item-height: 36px;
  --admin-stat-card-height: 102px;
}

:global(body.admin-body) {
  background:
    radial-gradient(circle at 12% 18%, rgba(91, 160, 255, 0.18), transparent 28%),
    radial-gradient(circle at 88% 84%, rgba(79, 205, 196, 0.14), transparent 24%),
    linear-gradient(180deg, #edf4fb 0%, #e8f0fa 100%);
}
</style>
