<script setup>
import { Camera, Loader2, Mail, Phone, Save, ShieldCheck, UserCircle2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

import { getAdminProfile, updateAdminProfile, uploadAdminProfileAvatar } from '@/admin/api/profile.api'
import { ADMIN_USER_STORAGE_KEY } from '@/views/admin/shared/constants/auth'

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['notify-success', 'notify-error', 'profile-updated'])

const fileInputRef = ref(null)
const loading = ref(false)
const uploading = ref(false)
const saving = ref(false)
const formErrors = reactive({
  username: '',
  email: '',
  phone: '',
})

const form = reactive({
  username: '',
  email: '',
  phone: '',
  avatar_url: '',
  role: '',
  status: '',
  last_login_at: '',
})

const avatarPreview = computed(() => String(form.avatar_url || '').trim())

function resetErrors() {
  formErrors.username = ''
  formErrors.email = ''
  formErrors.phone = ''
}

function persistProfile(profile) {
  try {
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Ignore storage issues.
  }
}

function applyProfile(profile) {
  form.username = String(profile?.username || '').trim()
  form.email = String(profile?.email || '').trim()
  form.phone = String(profile?.phone || '').trim()
  form.avatar_url = String(profile?.avatar_url || '').trim()
  form.role = String(profile?.role || '').trim()
  form.status = String(profile?.status || (profile?.is_active ? 'active' : 'inactive')).trim()
  form.last_login_at = String(profile?.last_login_at || '').trim()
}

function validateForm() {
  resetErrors()
  let valid = true

  if (String(form.username || '').trim().length < 3) {
    formErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự.'
    valid = false
  }

  const normalizedEmail = String(form.email || '').trim()
  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    formErrors.email = 'Email không hợp lệ.'
    valid = false
  }

  const digits = String(form.phone || '').replace(/\D/g, '')
  if (digits && digits.length < 10) {
    formErrors.phone = 'Số điện thoại phải có ít nhất 10 số.'
    valid = false
  }

  return valid
}

async function loadProfile() {
  const token = String(props.token || '').trim()
  if (!token) return

  loading.value = true
  try {
    const profile = await getAdminProfile(token)
    applyProfile(profile)
    persistProfile(profile)
    emit('profile-updated', profile)
  } catch (error) {
    emit('notify-error', error?.message || 'Không thể tải hồ sơ quản trị.')
  } finally {
    loading.value = false
  }
}

async function handleAvatarSelect(event) {
  const file = event?.target?.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const payload = await uploadAdminProfileAvatar(props.token, file)
    form.avatar_url = String(payload?.url || '').trim()
    emit('notify-success', 'Đã tải ảnh đại diện thành công. Nhấn lưu để cập nhật hồ sơ.')
  } catch (error) {
    emit('notify-error', error?.message || 'Không thể tải ảnh đại diện.')
  } finally {
    uploading.value = false
    if (event?.target) {
      event.target.value = ''
    }
  }
}

async function handleSubmit() {
  if (saving.value) return
  if (!validateForm()) return

  saving.value = true
  try {
    const profile = await updateAdminProfile(props.token, {
      username: form.username.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    })
    applyProfile(profile)
    persistProfile(profile)
    emit('profile-updated', profile)
    emit('notify-success', 'Cập nhật hồ sơ quản trị thành công.')
  } catch (error) {
    emit('notify-error', error?.message || 'Không thể cập nhật hồ sơ quản trị.')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.token,
  () => {
    loadProfile()
  },
)

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <section class="admin-profile-page card-shell">
    <div v-if="loading" class="admin-profile-page__loading">
      <Loader2 :size="20" class="spin" />
      <span>Đang tải hồ sơ quản trị...</span>
    </div>

    <div v-else class="admin-profile-page__content">
      <div class="admin-profile-page__hero">
        <div class="admin-profile-page__avatar">
          <img v-if="avatarPreview" :src="avatarPreview" :alt="form.username || 'Admin avatar'" />
          <UserCircle2 v-else :size="78" stroke-width="1.3" />
        </div>

        <div class="admin-profile-page__identity">
          <h1>{{ form.username || 'Quản trị viên' }}</h1>
          <p>{{ form.email || 'Chưa có email' }}</p>
          <div class="admin-profile-page__badges">
            <span class="badge badge--role">
              <ShieldCheck :size="14" />
              {{ form.role || 'admin' }}
            </span>
            <span class="badge badge--status" :class="{ 'badge--status-active': form.status === 'active' }">
              {{ form.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động' }}
            </span>
          </div>
        </div>

        <div class="admin-profile-page__upload">
          <input ref="fileInputRef" type="file" accept="image/*" hidden @change="handleAvatarSelect" />
          <button type="button" class="btn-secondary" :disabled="uploading" @click="fileInputRef?.click()">
            <Loader2 v-if="uploading" :size="16" class="spin" />
            <Camera v-else :size="16" />
            {{ uploading ? 'Đang tải ảnh...' : 'Tải ảnh đại diện' }}
          </button>
        </div>
      </div>

      <form class="admin-profile-page__form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>Tên đăng nhập</span>
          <input v-model="form.username" type="text" placeholder="Nhập tên đăng nhập" />
          <small v-if="formErrors.username" class="field__error">{{ formErrors.username }}</small>
        </label>

        <label class="field">
          <span>Email</span>
          <div class="field__input-with-icon">
            <Mail :size="16" />
            <input v-model="form.email" type="email" placeholder="admin@company.com" />
          </div>
          <small v-if="formErrors.email" class="field__error">{{ formErrors.email }}</small>
        </label>

        <label class="field">
          <span>Số điện thoại</span>
          <div class="field__input-with-icon">
            <Phone :size="16" />
            <input v-model="form.phone" type="tel" placeholder="0982 818 273" />
          </div>
          <small v-if="formErrors.phone" class="field__error">{{ formErrors.phone }}</small>
        </label>

        <label class="field">
          <span>Vai trò</span>
          <input :value="form.role || 'admin'" type="text" disabled />
        </label>

        <label class="field">
          <span>Trạng thái</span>
          <input :value="form.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'" type="text" disabled />
        </label>

        <label class="field">
          <span>Đăng nhập lần cuối</span>
          <input :value="form.last_login_at ? new Date(form.last_login_at).toLocaleString('vi-VN') : 'Chưa có dữ liệu'" type="text" disabled />
        </label>

        <div class="admin-profile-page__actions">
          <button type="submit" class="btn-primary" :disabled="saving || uploading">
            <Loader2 v-if="saving" :size="16" class="spin" />
            <Save v-else :size="16" />
            {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.admin-profile-page {
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.admin-profile-page__loading {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
}

.admin-profile-page__content {
  display: grid;
  gap: 24px;
}

.admin-profile-page__hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 18px;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(203, 213, 225, 0.7);
}

.admin-profile-page__avatar {
  width: 110px;
  height: 110px;
  border-radius: 999px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #64748b;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
}

.admin-profile-page__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-profile-page__identity h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(28px, 3vw, 38px);
}

.admin-profile-page__identity p {
  margin: 8px 0 0;
  color: #64748b;
}

.admin-profile-page__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.badge--role {
  color: #ffffff;
  background: #3b82f6;
}

.badge--status {
  color: #92400e;
  background: #fef3c7;
}

.badge--status-active {
  color: #065f46;
  background: #d1fae5;
}

.admin-profile-page__upload {
  justify-self: end;
}

.admin-profile-page__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field input {
  width: 100%;
  min-height: 50px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(203, 213, 225, 0.9);
  background: #ffffff;
  color: #0f172a;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.field input:disabled {
  color: #475569;
  background: #f8fafc;
}

.field__input-with-icon {
  position: relative;
}

.field__input-with-icon svg {
  position: absolute;
  top: 50%;
  left: 14px;
  transform: translateY(-50%);
  color: #94a3b8;
}

.field__input-with-icon input {
  padding-left: 42px;
}

.field__error {
  color: #dc2626;
  font-size: 12px;
}

.admin-profile-page__actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .admin-profile-page__hero {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .admin-profile-page__upload {
    justify-self: start;
  }

  .admin-profile-page__form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .admin-profile-page {
    padding: 18px;
  }

  .admin-profile-page__avatar {
    width: 92px;
    height: 92px;
  }

  .admin-profile-page__identity h1 {
    font-size: 26px;
  }

  .admin-profile-page__actions {
    justify-content: stretch;
  }

  .admin-profile-page__actions .btn-primary {
    width: 100%;
  }
}
</style>
