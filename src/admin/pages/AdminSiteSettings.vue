<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  Building2,
  Upload,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Globe
} from 'lucide-vue-next'
import { getPublicSiteSettings } from '@/admin/api/dashboard.api'
import { env } from '@/shared/config/env'
import { updateSiteSettings, uploadImage } from '@/views/admin/shared/api/adminApi'
import { uiState } from '@/shared/utils/uiState'

const props = defineProps({
  token: { type: String, required: true },
  active: { type: Boolean, default: false }
})

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const message = reactive({
  text: '',
  type: '' // 'success' | 'error'
})

const form = reactive({
  site_name: '',
  logo_url: ''
})

const fileInput = ref(null)
const apiOrigin = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')

function resolveAssetUrl(url) {
  const normalized = String(url || '').trim()
  if (!normalized) return ''
  if (/^(https?:|data:|blob:)/i.test(normalized)) return normalized
  return `${apiOrigin}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}

const previewLogoUrl = computed(() => resolveAssetUrl(form.logo_url))

async function loadSettings() {
  loading.value = true
  try {
    const data = await getPublicSiteSettings()
    form.site_name = data.site_name || ''
    form.logo_url = data.logo_url || ''
  } catch (err) {
    message.text = 'Không thể tải cài đặt website'
    message.type = 'error'
  } finally {
    loading.value = false
  }
}

function triggerFileUpload() {
  if (loading.value || uploading.value) return
  fileInput.value?.click()
}

async function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    message.text = 'Vui lòng chọn tệp hình ảnh'
    message.type = 'error'
    return
  }

  uploading.value = true
  message.text = ''
  
  try {
    const res = await uploadImage(file, props.token)
    if (res.url) {
      form.logo_url = res.url
      message.text = 'Tải ảnh lên thành công'
      message.type = 'success'
    }
  } catch (err) {
    message.text = 'Lỗi tải ảnh lên: ' + (err.message || 'Không xác định')
    message.type = 'error'
  } finally {
    uploading.value = false
    // Reset file input
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removeLogo() {
  form.logo_url = ''
}

async function handleSave() {
  saving.value = true
  message.text = ''
  
  try {
    await updateSiteSettings(props.token, {
      site_name: form.site_name,
      logo_url: form.logo_url
    })
    
    message.text = 'Cập nhật cài đặt thành công'
    message.type = 'success'
    
    // Sync with sidebar/UI
    localStorage.setItem('china_admin_sidebar_brand_v1', JSON.stringify({
      site_name: form.site_name,
      logo_url: form.logo_url
    }))
    
    // Trigger re-fetch in other components if needed
    if (uiState.siteSettingsVersion !== undefined) {
      uiState.siteSettingsVersion++
    } else {
      uiState.siteSettingsVersion = 1
    }
    
    setTimeout(() => {
      if (message.text === 'Cập nhật cài đặt thành công') {
        message.text = ''
      }
    }, 5000)
  } catch (err) {
    message.text = 'Lỗi lưu cài đặt: ' + (err.message || 'Không xác định')
    message.type = 'error'
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="site-settings">
    <header class="settings-header">
      <div class="header-content">
        <p class="kicker">Hệ thống</p>
        <h1>Cài đặt Website</h1>
        <p class="description">Quản lý tên thương hiệu và logo hiển thị trên toàn hệ thống.</p>
      </div>
      
      <button 
        class="save-button" 
        :disabled="saving || loading" 
        @click="handleSave"
      >
        <Loader2 v-if="saving" class="animate-spin" :size="18" />
        <Save v-else :size="18" />
        <span>{{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
      </button>
    </header>

    <div v-if="message.text" class="status-alert" :class="`is-${message.type}`">
      <CheckCircle v-if="message.type === 'success'" :size="18" />
      <AlertCircle v-else :size="18" />
      <span>{{ message.text }}</span>
    </div>

    <main class="settings-grid">
      <section class="settings-card">
        <div class="card-title">
          <Building2 :size="20" />
          <h2>Thông tin chung</h2>
        </div>

        <div class="form-group">
          <label for="site-name">Tên Website / Công ty</label>
          <div class="input-wrapper">
            <Globe class="input-icon" :size="18" />
            <input 
              id="site-name"
              v-model="form.site_name" 
              type="text" 
              placeholder="Nhập tên công ty hoặc website..."
              :disabled="loading"
            />
          </div>
          <p class="field-hint">Tên này sẽ hiển thị ở Sidebar và tiêu đề trang.</p>
        </div>
      </section>

      <section class="settings-card">
        <div class="card-title">
          <Upload :size="20" />
          <h2>Logo thương hiệu</h2>
        </div>

        <div
          class="logo-upload-area"
          :class="{ 'is-busy': uploading }"
        >
          <button
            type="button"
            class="logo-preview-box"
            :class="{ 'is-empty': !form.logo_url, 'is-uploading': uploading }"
            :disabled="uploading || loading"
            @click="triggerFileUpload"
          >
            <img v-if="previewLogoUrl" :src="previewLogoUrl" alt="Logo preview" />
            <div v-else class="logo-placeholder">
              <Building2 :size="48" stroke-width="1" />
              <span>Chưa có logo</span>
            </div>

            <div class="logo-preview-box__hint">
              <Upload :size="16" />
              <span>{{ uploading ? 'Đang tải ảnh...' : 'Bấm vào ảnh để chọn logo' }}</span>
            </div>
            
            <div v-if="uploading" class="upload-overlay">
              <Loader2 class="animate-spin" :size="32" />
              <span>Đang tải lên...</span>
            </div>
          </button>

          <div class="upload-controls">
            <input 
              ref="fileInput"
              type="file" 
              class="hidden-input" 
              accept="image/*"
              @change="handleFileUpload"
            />
            
            <button 
              type="button"
              class="action-button primary" 
              :disabled="uploading || loading"
              @click="triggerFileUpload"
            >
              <Upload :size="16" />
              {{ form.logo_url ? 'Chọn ảnh khác' : 'Chọn logo từ máy' }}
            </button>
            
            <button 
              v-if="form.logo_url"
              type="button"
              class="action-button danger" 
              :disabled="uploading || loading"
              @click="removeLogo"
            >
              <Trash2 :size="16" />
              Gỡ bỏ
            </button>
          </div>
          
          <div class="upload-tips">
            <p>Bạn có thể bấm trực tiếp vào khung ảnh để chọn file tải lên.</p>
            <p>Khuyến nghị: Định dạng PNG hoặc SVG, nền trong suốt.</p>
            <p>Kích thước tối ưu: 200x200px hoặc tỷ lệ 1:1.</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.site-settings {
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  gap: 24px;
}

.kicker {
  color: #b78134;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 12px;
  font-weight: 800;
  margin-bottom: 8px;
}

.settings-header h1 {
  font-size: 36px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.description {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.save-button {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgba(30, 58, 138, 0.2);
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(30, 58, 138, 0.3);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.status-alert {
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease;
}

.status-alert.is-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-alert.is-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.settings-card {
  background: white;
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  color: #334155;
}

.card-title h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: #94a3b8;
}

.input-wrapper input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 16px;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #3b82f6;
  background: white;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.field-hint {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

/* Logo Upload Styles */
.logo-upload-area {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.logo-upload-area.is-busy {
  pointer-events: none;
}

.logo-preview-box {
  width: 180px;
  height: 180px;
  background: #f1f5f9;
  border-radius: 24px;
  display: grid;
  place-items: center;
  overflow: hidden;
  position: relative;
  border: 2px dashed #cbd5e1;
  padding: 0;
  appearance: none;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.logo-preview-box:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #60a5fa;
  box-shadow: 0 18px 40px -24px rgba(37, 99, 235, 0.45);
}

.logo-preview-box:disabled {
  cursor: not-allowed;
}

.logo-preview-box.is-empty {
  border-color: #94a3b8;
}

.logo-preview-box.is-uploading {
  border-color: #3b82f6;
}

.logo-preview-box img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.logo-preview-box__hint {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
}

.logo-placeholder span {
  font-size: 14px;
  font-weight: 600;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #1e3a8a;
  backdrop-filter: blur(4px);
}

.upload-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hidden-input {
  display: none;
}

.action-button {
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button.primary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.action-button.primary:hover {
  background: #e2e8f0;
}

.action-button.danger {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.action-button.danger:hover {
  background: #fee2e2;
}

.upload-tips {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.upload-tips p {
  font-size: 13px;
  color: #94a3b8;
  margin: 4px 0;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .logo-upload-area {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .upload-controls {
    width: 100%;
  }
  
  .action-button {
    justify-content: center;
  }
}
</style>
