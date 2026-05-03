<script setup>
import { Building2 } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { getPublicSiteSettings } from '@/admin/api/dashboard.api'
import { env } from '@/shared/config/env'
import { uiState } from '@/shared/utils/uiState'

const emit = defineEmits(['close'])

const BRAND_CACHE_KEY = 'china_admin_sidebar_brand_v1'

const { locale, t } = useI18n({ useScope: 'global' })

const loading = ref(false)
const siteName = ref('')
const logoUrl = ref('')
const apiOrigin = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

const resolvedSiteName = computed(() => {
  return String(siteName.value || '').trim() || t('admin.common.brand_name')
})

const resolvedLogoUrl = computed(() => {
  const normalized = String(logoUrl.value || '').trim()
  if (!normalized) return ''
  if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized
  return `${apiOrigin}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
})

const hasLogo = computed(() => Boolean(resolvedLogoUrl.value))

function hydrateFromCache() {
  try {
    const raw = localStorage.getItem(BRAND_CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    siteName.value = String(parsed?.site_name || '').trim()
    logoUrl.value = String(parsed?.logo_url || '').trim()
  } catch {
    // Ignore invalid cache and fetch fresh data below.
  }
}

function persistCache(payload) {
  try {
    localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage quota issues.
  }
}

async function loadBrand() {
  loading.value = true
  try {
    const payload = await getPublicSiteSettings({ language_code: locale.value })
    siteName.value = String(payload?.site_name || '').trim()
    logoUrl.value = String(payload?.logo_url || '').trim()
    persistCache({
      site_name: siteName.value,
      logo_url: logoUrl.value,
    })
  } catch {
    // Keep cache or i18n fallback when the request fails.
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  hydrateFromCache()
  loadBrand()
})

watch(() => uiState.siteSettingsVersion, () => {
  hydrateFromCache()
  loadBrand()
})
</script>

<template>
  <div class="sidebar-brand">
    <div class="sidebar-brand__main">
      <div class="sidebar-brand__logo" :class="{ 'sidebar-brand__logo--placeholder': !hasLogo }">
        <img v-if="hasLogo" :src="resolvedLogoUrl" :alt="resolvedSiteName" />
        <Building2 v-else :size="26" />
      </div>

      <div class="sidebar-brand__copy">
        <p v-if="t('admin.common.brand_kicker')" class="sidebar-brand__kicker">{{ t('admin.common.brand_kicker') }}</p>
        <h2 :title="resolvedSiteName">{{ resolvedSiteName }}</h2>
        <p v-if="loading" class="sidebar-brand__status">Đang tải thương hiệu...</p>
      </div>
    </div>

    <button class="sidebar-brand__close" type="button" aria-label="Đóng thanh bên" @click="emit('close')">
      ×
    </button>
  </div>
</template>

<style scoped>
.sidebar-brand {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 4px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-brand__main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-brand__logo {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
  display: grid;
  place-items: center;
  color: #dbeafe;
}

.sidebar-brand__logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.sidebar-brand__logo--placeholder {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(37, 99, 235, 0.12));
}

.sidebar-brand__copy {
  min-width: 0;
}

.sidebar-brand__kicker {
  margin: 0;
  color: rgba(220, 233, 249, 0.74);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 10px;
  font-weight: 600;
}

.sidebar-brand__copy h2 {
  margin: 6px 0 0;
  color: #f8fbff;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.03em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sidebar-brand__status {
  margin: 6px 0 0;
  color: rgba(203, 213, 225, 0.78);
  font-size: 11px;
}

.sidebar-brand__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(198, 216, 233, 0.2);
  background: rgba(255, 255, 255, 0.06);
  color: #e2e8f0;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 640px) {
  .sidebar-brand__copy h2 {
    font-size: 22px;
  }
}
</style>
