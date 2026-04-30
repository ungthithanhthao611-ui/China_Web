<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserCircle2,
} from 'lucide-vue-next'

import { HttpError } from '@/shared/lib/http'
import { getAdminEntityRecord } from '@/views/admin/shared/api/adminApi'
import {
  clearAdminSession,
  getStoredAdminToken,
} from '@/views/admin/shared/constants/auth'

const route = useRoute()
const router = useRouter()

const token = ref(getStoredAdminToken())
const loading = ref(true)
const errorMessage = ref('')
const userRecord = ref(null)
const avatarFailed = ref(false)

const userId = computed(() => String(route.params.id || '').trim())
const loginHistory = computed(() =>
  Array.isArray(userRecord.value?.login_history) ? userRecord.value.login_history : [],
)
const loginHistoryCount = computed(() =>
  Number(userRecord.value?.login_history_count || loginHistory.value.length || 0),
)

const avatarUrl = computed(() => {
  const raw = String(userRecord.value?.avatar_url || '').trim()
  if (raw) return raw

  const fallbackName = String(
    userRecord.value?.username || userRecord.value?.email || 'User',
  )

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=f2e8d5&color=7a5d2e&size=256`
})

const detailFields = computed(() => {
  if (!userRecord.value) return []

  return [
    {
      key: 'username',
      icon: User,
      label: 'Tên đăng nhập',
      value: userRecord.value.username,
    },
    {
      key: 'full_name',
      icon: UserCircle2,
      label: 'Họ và tên',
      value: userRecord.value.full_name,
    },
    {
      key: 'email',
      icon: Mail,
      label: 'Email',
      value: userRecord.value.email,
    },
    {
      key: 'phone',
      icon: Phone,
      label: 'Số điện thoại',
      value: userRecord.value.phone,
    },
    {
      key: 'address',
      icon: MapPin,
      label: 'Địa chỉ',
      value: userRecord.value.address,
    },
    {
      key: 'created_at',
      icon: CalendarDays,
      label: 'Ngày tạo tài khoản',
      value: formatDateTime(userRecord.value.created_at),
    },
    {
      key: 'updated_at',
      icon: RefreshCw,
      label: 'Cập nhật gần nhất',
      value: formatDateTime(userRecord.value.updated_at),
    },
    {
      key: 'status',
      icon: ShieldCheck,
      label: 'Trạng thái tài khoản',
      value: userRecord.value.is_active ? 'Đang hoạt động' : 'Đã bị khóa',
      tone: userRecord.value.is_active ? 'success' : 'danger',
    },
    {
      key: 'role',
      icon: ShieldCheck,
      label: 'Phân quyền',
      value: userRecord.value.role,
    },
  ]
})

function cleanValue(value) {
  return String(value ?? '').trim() || 'Chưa cập nhật'
}

function formatDateTime(value) {
  if (!value) return 'Chưa cập nhật'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

async function loadUserRecord() {
  loading.value = true
  errorMessage.value = ''
  avatarFailed.value = false

  try {
    if (!token.value.trim()) {
      clearAdminSession()
      await router.replace({
        name: 'AdminLogin',
        query: { redirect: route.fullPath },
      })
      return
    }

    userRecord.value = await getAdminEntityRecord('users', userId.value, token.value)
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      clearAdminSession({ broadcast: true, reason: 'expired' })
      await router.replace({
        name: 'AdminLogin',
        query: { redirect: route.fullPath },
      })
      return
    }

    errorMessage.value = error?.message || 'Không thể tải chi tiết tài khoản.'
  } finally {
    loading.value = false
  }
}

function goBackToUsers() {
  router.push({
    name: 'AdminDashboard',
    query: { section: 'users' },
  })
}

onMounted(() => {
  loadUserRecord()
})
</script>

<template>
  <section class="user-detail-page">
    <header class="page-header">
      <div>
        <p class="page-kicker">Quản lý tài khoản</p>
        <h1 id="admin-user-detail-title">Chi tiết tài khoản người dùng</h1>
      </div>

      <div class="page-actions">
        <button
          id="user-detail-back"
          class="secondary-button"
          type="button"
          @click="goBackToUsers"
        >
          ← Quay lại danh sách
        </button>
        <button
          id="user-detail-refresh"
          class="primary-button"
          type="button"
          :disabled="loading"
          @click="loadUserRecord"
        >
          {{ loading ? 'Đang tải...' : 'Làm mới' }}
        </button>
      </div>
    </header>

    <section v-if="loading" class="state-card">
      <p>Đang tải thông tin tài khoản...</p>
    </section>

    <section v-else-if="errorMessage" class="state-card state-card--error">
      <p>{{ errorMessage }}</p>
    </section>

    <section v-else class="content-grid">
      <article class="account-card">
        <div class="account-card__head">
          <div class="account-avatar">
            <img
              v-if="avatarUrl && !avatarFailed"
              :src="avatarUrl"
              :alt="cleanValue(userRecord?.username || userRecord?.email)"
              @error="avatarFailed = true"
            />
            <span v-else>
              {{ cleanValue(userRecord?.username || userRecord?.email).charAt(0).toUpperCase() }}
            </span>
          </div>

          <div class="account-title">
            <p>Thông tin đầy đủ</p>
            <h2>{{ cleanValue(userRecord?.username || userRecord?.email) }}</h2>
            <span>{{ cleanValue(userRecord?.email) }}</span>
          </div>
        </div>

        <div class="section-header">
          <div>
            <p class="section-kicker">Thông tin đầy đủ</p>
            <h3>Chi tiết tài khoản</h3>
          </div>
          <button
            class="mini-button"
            type="button"
            :disabled="loading"
            @click="loadUserRecord"
          >
            Làm mới
          </button>
        </div>

        <div class="details-grid">
          <article
            v-for="field in detailFields"
            :key="field.key"
            class="detail-item"
          >
            <div class="detail-item__icon">
              <component :is="field.icon" :size="18" />
            </div>
            <div class="detail-item__copy">
              <span>{{ field.label }}</span>
              <strong :class="field.tone ? `is-${field.tone}` : ''">
                {{ cleanValue(field.value) }}
              </strong>
            </div>
          </article>
        </div>
      </article>

      <article class="history-card">
        <div class="section-header">
          <div>
            <p class="section-kicker">Bảo mật tài khoản</p>
            <h3>Lịch sử đăng nhập</h3>
          </div>
          <span class="count-badge">{{ loginHistoryCount }} bản ghi</span>
        </div>

        <div v-if="loginHistory.length" class="history-list">
          <article
            v-for="item in loginHistory"
            :key="item.id"
            class="history-item"
          >
            <div class="history-item__dot"></div>
            <div class="history-item__body">
              <div class="history-item__row">
                <strong>{{ formatDateTime(item.login_at) }}</strong>
                <span>{{ String(item.login_method || 'password').toUpperCase() }}</span>
              </div>
              <p><b>IP:</b> {{ cleanValue(item.ip_address) }}</p>
              <p><b>User-Agent:</b> {{ cleanValue(item.user_agent) }}</p>
            </div>
          </article>
        </div>

        <div v-else class="empty-state">
          <p>Chưa có dữ liệu lịch sử đăng nhập.</p>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.user-detail-page {
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(180deg, #f5efe5 0%, #f8f6f2 48%, #fbfaf8 100%);
  color: #1f2937;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}

.page-kicker,
.section-kicker {
  margin: 0 0 8px;
  color: #b78134;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.page-header h1,
.section-header h3,
.account-title h2 {
  margin: 0;
}

.page-header h1 {
  font-size: 32px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #111827;
}

.page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.primary-button,
.secondary-button,
.mini-button {
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.primary-button:hover,
.secondary-button:hover,
.mini-button:hover {
  transform: translateY(-1px);
}

.primary-button:disabled,
.secondary-button:disabled,
.mini-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  padding: 0 18px;
}

.primary-button {
  border: 0;
  color: #fff;
  background: linear-gradient(135deg, #203a66, #385487);
  box-shadow: 0 14px 28px rgba(32, 58, 102, 0.18);
}

.secondary-button {
  border: 1px solid rgba(17, 24, 39, 0.12);
  color: #243041;
  background: rgba(255, 255, 255, 0.76);
}

.mini-button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(17, 24, 39, 0.1);
  background: rgba(255, 255, 255, 0.74);
  color: #243041;
}

.state-card,
.account-card,
.history-card {
  border: 1px solid rgba(180, 151, 103, 0.18);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  box-shadow: 0 24px 54px rgba(111, 86, 48, 0.08);
}

.state-card {
  padding: 32px 24px;
  text-align: center;
}

.state-card--error {
  color: #b91c1c;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 24px;
  align-items: start;
}

.account-card,
.history-card {
  padding: 24px;
}

.account-card__head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.account-avatar {
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 24px;
  border: 4px solid #fff;
  background: linear-gradient(135deg, #f2e8d5, #f8f2e5);
  color: #8b6a34;
  font-size: 30px;
  font-weight: 800;
  box-shadow: 0 12px 30px rgba(111, 86, 48, 0.12);
}

.account-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.account-title p {
  margin: 0 0 6px;
  color: #b78134;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.account-title h2 {
  color: #111827;
  font-size: 28px;
  line-height: 1.1;
}

.account-title span {
  display: block;
  margin-top: 6px;
  color: #6b7280;
  word-break: break-word;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px;
  border: 1px solid #ece5d8;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf9 0%, #fbf7ef 100%);
}

.detail-item__icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: rgba(214, 193, 154, 0.2);
  color: #9a7232;
}

.detail-item__copy {
  min-width: 0;
}

.detail-item__copy span {
  display: block;
  margin-bottom: 6px;
  color: #9ca3af;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-item__copy strong {
  color: #111827;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(214, 193, 154, 0.22);
  color: #8c672b;
  font-size: 12px;
  font-weight: 800;
}

.history-list {
  display: grid;
  gap: 14px;
}

.history-item {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  gap: 12px;
}

.history-item__dot {
  width: 10px;
  height: 10px;
  margin-top: 8px;
  border-radius: 999px;
  background: #9a7232;
  box-shadow: 0 0 0 5px rgba(214, 193, 154, 0.22);
}

.history-item__body {
  padding: 16px;
  border: 1px solid #ece5d8;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffdf9 0%, #fbf7ef 100%);
}

.history-item__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.history-item__row strong {
  color: #111827;
}

.history-item__row span {
  color: #8c672b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.history-item__body p {
  margin: 6px 0 0;
  color: #4b5563;
  line-height: 1.6;
  word-break: break-word;
}

.empty-state {
  min-height: 220px;
  display: grid;
  place-items: center;
  border: 1px dashed #e7dcc8;
  border-radius: 20px;
  background: rgba(251, 247, 239, 0.72);
}

.empty-state p {
  margin: 0;
  color: #6b7280;
  text-align: center;
}

.is-success {
  color: #15803d !important;
}

.is-danger {
  color: #b91c1c !important;
}

@media (max-width: 1080px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .user-detail-page {
    padding: 18px;
  }

  .page-header,
  .section-header,
  .account-card__head,
  .history-item__row {
    flex-direction: column;
    align-items: flex-start;
  }

  .details-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .account-title h2 {
    font-size: 24px;
  }
}
</style>
