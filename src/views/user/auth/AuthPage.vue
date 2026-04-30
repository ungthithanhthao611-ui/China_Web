<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { 
  Mail, Lock, User, UserPlus, LogIn, 
  Loader2, CheckCircle2, AlertCircle, ArrowLeft,
  Phone, MapPin
} from 'lucide-vue-next'
import { useAuthStore } from '@/views/user/stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const mode = ref(route.path.includes('register') ? 'register' : 'login')
const loading = ref(false)
const success = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  confirm_password: '',
  username: '',
  phone: '',
})

const safeRedirectPath = () => {
  const redirect = String(route.query.redirect || '').trim()
  return redirect.startsWith('/') ? redirect : '/'
}

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
  router.replace(mode.value === 'login' ? '/login' : '/register')
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  try {
    if (mode.value === 'login') {
      await authStore.login({
        email: form.email,
        password: form.password,
      })
      success.value = true
      const redirectPath = safeRedirectPath()
      setTimeout(() => {
        router.push(redirectPath)
      }, 1500)
    } else {
      if (form.password !== form.confirm_password) {
        throw new Error('Mật khẩu nhập lại không khớp')
      }

      await authStore.register({
        email: form.email,
        password: form.password,
        username: form.username,
        phone: form.phone,
      })
      success.value = true
      setTimeout(() => {
        mode.value = 'login'
        success.value = false
        router.replace('/login')
      }, 2000)
    }
  } catch (err) {
    error.value = err.message || (mode.value === 'login' ? t('user.home.loginError') : t('user.home.registerError'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push(safeRedirectPath())
  }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <router-link to="/" class="back-home">
        <ArrowLeft :size="20" />
        <span>{{ t('user.home.home') }}</span>
      </router-link>

      <div class="auth-card">
        <div class="auth-visual">
          <div class="visual-content">
            <h1>THIÊN ĐỒNG VIỆT NAM</h1>
            <p>Uy tín từ những điều nhỏ nhất</p>
          </div>
          <div class="visual-overlay"></div>
        </div>

        <div class="auth-form-side">
          <div class="auth-header">
            <div class="icon-box">
              <LogIn v-if="mode === 'login'" :size="32" />
              <UserPlus v-else :size="32" />
            </div>
            <h2>{{ mode === 'login' ? t('user.home.login') : t('user.home.register') }}</h2>
            <p>{{ mode === 'login' ? 'Chào mừng bạn quay trở lại' : 'Tạo tài khoản mới để trải nghiệm' }}</p>
          </div>

          <div v-if="success" class="success-message">
            <CheckCircle2 :size="64" color="#d6b074" />
            <h3>{{ mode === 'login' ? t('user.home.loginSuccess') : t('user.home.registerSuccess') }}</h3>
            <p>Vui lòng đợi trong giây lát...</p>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="form-content">
            <div v-if="error" class="error-alert">
              <AlertCircle :size="18" />
              <span>{{ error }}</span>
            </div>

            <div class="form-group">
              <label>{{ t('user.home.email') }}</label>
              <div class="input-wrapper">
                <Mail :size="18" class="input-icon" />
                <input v-model="form.email" type="email" placeholder="example@mail.com" required />
              </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
              <label>{{ t('user.home.username') }}</label>
              <div class="input-wrapper">
                <User :size="18" class="input-icon" />
                <input v-model="form.username" type="text" placeholder="username" required />
              </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
              <label>{{ t('user.home.phone') }}</label>
              <div class="input-wrapper">
                <Phone :size="18" class="input-icon" />
                <input v-model="form.phone" type="tel" placeholder="0982xxxxxx" />
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('user.home.password') }}</label>
              <div class="input-wrapper">
                <Lock :size="18" class="input-icon" />
                <input v-model="form.password" type="password" placeholder="••••••••" required minlength="6" />
              </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
              <label>Nhập lại mật khẩu</label>
              <div class="input-wrapper">
                <Lock :size="18" class="input-icon" />
                <input v-model="form.confirm_password" type="password" placeholder="••••••••" required minlength="6" />
              </div>
            </div>

            <button type="submit" class="submit-btn" :disabled="loading">
              <Loader2 v-if="loading" class="spinner" :size="20" />
              <span v-else>{{ mode === 'login' ? t('user.home.login') : t('user.home.register') }}</span>
            </button>

            <div class="auth-footer">
              <p v-if="mode === 'login'">
                Chưa có tài khoản? 
                <button type="button" @click="toggleMode" class="switch-link">Đăng ký ngay</button>
              </p>
              <p v-else>
                Đã có tài khoản? 
                <button type="button" @click="toggleMode" class="switch-link">Đăng nhập</button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100svh;
  background: #060b1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.auth-container {
  width: 100%;
  max-width: 1100px;
  position: relative;
}

.back-home {
  position: absolute;
  top: -48px;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(230, 220, 201, 0.6);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;

  &:hover {
    color: #d6b074;
  }
}

.auth-card {
  background: #0c1831;
  border-radius: 32px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(214, 176, 116, 0.1);
  min-height: 640px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

.auth-visual {
  position: relative;
  background: url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80') center/cover no-repeat;
  display: flex;
  align-items: flex-end;
  padding: 60px;

  @media (max-width: 992px) {
    display: none;
  }

  .visual-content {
    position: relative;
    z-index: 2;
    
    h1 {
      color: #fff;
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: 2px;
    }

    p {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      letter-spacing: 1px;
    }
  }

  .visual-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(12, 24, 49, 0.95), transparent);
    z-index: 1;
  }
}

.auth-form-side {
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 576px) {
    padding: 40px 24px;
  }
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;

  .icon-box {
    width: 64px;
    height: 64px;
    background: rgba(214, 176, 116, 0.1);
    color: #d6b074;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  h2 {
    font-size: 28px;
    color: #f5efe2;
    margin-bottom: 8px;
    font-weight: 700;
  }

  p {
    color: rgba(230, 220, 201, 0.5);
    font-size: 15px;
  }
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 14px 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: 14px;
    font-weight: 600;
    color: rgba(230, 220, 201, 0.7);
    padding-left: 4px;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .input-icon {
    position: absolute;
    left: 18px;
    color: rgba(230, 220, 201, 0.3);
  }

  input {
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(214, 176, 116, 0.15);
    border-radius: 14px;
    padding: 16px 16px 16px 52px;
    color: #f5efe2;
    font-size: 15px;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.05);
      border-color: #d6b074;
      box-shadow: 0 0 0 4px rgba(214, 176, 116, 0.1);
    }
  }
}

.submit-btn {
  margin-top: 12px;
  background: #d6b074;
  color: #0c1831;
  border: none;
  border-radius: 14px;
  padding: 18px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 15px 30px rgba(214, 176, 116, 0.25);
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.auth-footer {
  text-align: center;
  margin-top: 8px;
  
  p {
    color: rgba(230, 220, 201, 0.5);
    font-size: 15px;
  }

  .switch-link {
    background: none;
    border: none;
    color: #d6b074;
    font-weight: 700;
    cursor: pointer;
    padding: 0 4px;
    text-decoration: underline;
    text-underline-offset: 4px;

    &:hover {
      filter: brightness(1.2);
    }
  }
}

.success-message {
  text-align: center;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;

  h3 {
    color: #f5efe2;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    color: rgba(230, 220, 201, 0.5);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
