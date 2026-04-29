<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Mail, Lock, User, UserPlus, LogIn, Loader2, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '@/views/user/stores/auth'

const props = defineProps({
  isOpen: Boolean,
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const authStore = useAuthStore()

const mode = ref('login') // 'login' or 'register'
const loading = ref(false)
const success = ref(false)
const error = ref('')

const form = reactive({
  email: '',
  password: '',
  username: '',
  full_name: '',
})

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
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
      setTimeout(() => {
        emit('close')
        success.value = false
      }, 1500)
    } else {
      await authStore.register({
        email: form.email,
        password: form.password,
        username: form.username,
        full_name: form.full_name,
      })
      mode.value = 'login'
      error.value = ''
      // Show success message or auto-login
      success.value = true
      setTimeout(() => {
        success.value = false
      }, 2000)
    }
  } catch (err) {
    error.value = err.message || (mode.value === 'login' ? t('user.home.loginError') : t('user.home.registerError'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Transition name="slide">
    <div v-if="isOpen" class="auth-overlay" @click.self="emit('close')">
      <div class="auth-drawer">
        <button class="close-btn" @click="emit('close')" aria-label="Close">
          <X :size="24" />
        </button>

        <div class="auth-content">
          <div class="auth-header">
            <div class="icon-box">
              <LogIn v-if="mode === 'login'" :size="32" />
              <UserPlus v-else :size="32" />
            </div>
            <h2>{{ mode === 'login' ? t('user.home.login') : t('user.home.register') }}</h2>
            <p>{{ mode === 'login' ? 'Chào mừng bạn quay trở lại' : 'Tạo tài khoản mới để trải nghiệm' }}</p>
          </div>

          <div v-if="success" class="success-message">
            <CheckCircle2 :size="48" color="#d6b074" />
            <p>{{ mode === 'login' ? t('user.home.loginSuccess') : t('user.home.registerSuccess') }}</p>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="auth-form">
            <div v-if="error" class="error-alert">
              <AlertCircle :size="18" />
              <span>{{ error }}</span>
            </div>

            <div class="form-group">
              <label>{{ t('user.home.email') }}</label>
              <div class="input-wrapper">
                <Mail :size="18" class="input-icon" />
                <input 
                  v-model="form.email" 
                  type="email" 
                  placeholder="example@mail.com" 
                  required
                />
              </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
              <label>{{ t('user.home.username') }}</label>
              <div class="input-wrapper">
                <User :size="18" class="input-icon" />
                <input 
                  v-model="form.username" 
                  type="text" 
                  placeholder="username" 
                  required
                />
              </div>
            </div>

            <div v-if="mode === 'register'" class="form-group">
              <label>{{ t('user.home.fullName') }}</label>
              <div class="input-wrapper">
                <User :size="18" class="input-icon" />
                <input 
                  v-model="form.full_name" 
                  type="text" 
                  placeholder="Nguyen Van A"
                />
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('user.home.password') }}</label>
              <div class="input-wrapper">
                <Lock :size="18" class="input-icon" />
                <input 
                  v-model="form.password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  minlength="6"
                />
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
  </Transition>
</template>

<style lang="scss" scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 15, 31, 0.4);
  backdrop-filter: blur(4px);
  z-index: 4000;
  display: flex;
  justify-content: flex-end;
}

.auth-drawer {
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: #0c1831;
  border-left: 1px solid rgba(214, 176, 116, 0.2);
  position: relative;
  box-shadow: -15px 0 45px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  color: rgba(230, 220, 201, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    color: #d6b074;
    transform: rotate(90deg);
  }
}

.auth-content {
  padding: 60px 40px;
  flex: 1;
  overflow-y: auto;
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
    font-size: 26px;
    color: #f5efe2;
    margin-bottom: 8px;
    font-weight: 700;
  }

  p {
    color: rgba(230, 220, 201, 0.5);
    font-size: 15px;
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.success-message {
  text-align: center;
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

  p {
    font-size: 18px;
    color: #d6b074;
    font-weight: 600;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: 14px;
    font-weight: 600;
    color: rgba(230, 220, 201, 0.7);
    padding-left: 2px;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .input-icon {
    position: absolute;
    left: 16px;
    color: rgba(230, 220, 201, 0.3);
    pointer-events: none;
  }

  input {
    width: 100%;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(214, 176, 116, 0.15);
    border-radius: 12px;
    padding: 14px 16px 14px 48px;
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
  margin-top: 8px;
  background: #d6b074;
  color: #0c1831;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(214, 176, 116, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.auth-footer {
  text-align: center;
  margin-top: 10px;
  
  p {
    color: rgba(230, 220, 201, 0.5);
    font-size: 14px;
  }

  .switch-link {
    background: none;
    border: none;
    color: #d6b074;
    font-weight: 600;
    cursor: pointer;
    padding: 0 4px;
    text-decoration: underline;
    text-underline-offset: 4px;

    &:hover {
      filter: brightness(1.2);
    }
  }
}

.spinner {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Slide Transition */
.slide-enter-active, .slide-leave-active {
  transition: opacity 0.4s ease;
  .auth-drawer {
    transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
  }
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  .auth-drawer {
    transform: translateX(100%);
  }
}

@media (max-width: 480px) {
  .auth-drawer {
    max-width: 100%;
  }
  .auth-content {
    padding: 60px 24px;
  }
}
</style>
