<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ADMIN_TOKEN_STORAGE_KEY, ADMIN_USER_STORAGE_KEY } from '@/views/admin/shared/constants/auth'
import { loginAdmin } from '@/views/admin/shared/api/adminApi.js'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirectPath = computed(() => {
  const candidate = String(route.query.redirect || '').trim()
  if (!candidate.startsWith('/admin')) {
    return '/admin/dashboard'
  }
  return candidate
})

async function handleLogin() {
  const normalizedUsername = username.value.trim()
  if (!normalizedUsername || !password.value) {
    errorMessage.value = 'Please provide username and password.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await loginAdmin(normalizedUsername, password.value)
    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, response.access_token)
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(response.user || null))
    await router.replace(redirectPath.value)
  } catch (error) {
    errorMessage.value = error.message || 'Failed to sign in admin.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="admin-login">
    <div class="login-card">
      <p class="eyebrow">Admin Access</p>
      <h1>CHINA ADMIN</h1>
      <p class="hint">Sign in with your admin account to manage menu and content data.</p>

      <label for="admin-login-username">Username</label>
      <input
        id="admin-login-username"
        v-model="username"
        type="text"
        placeholder="admin"
        autocomplete="username"
        @keyup.enter="handleLogin"
      />

      <label for="admin-login-password">Password</label>
      <input
        id="admin-login-password"
        v-model="password"
        type="password"
        placeholder="Enter password"
        autocomplete="current-password"
        @keyup.enter="handleLogin"
      />

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

      <button type="button" :disabled="loading" @click="handleLogin">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background:
    radial-gradient(560px 320px at 12% 4%, rgba(67, 180, 221, 0.18), transparent 70%),
    radial-gradient(520px 300px at 90% 100%, rgba(76, 90, 186, 0.14), transparent 72%),
    linear-gradient(180deg, #edf3fb 0%, #e4ecf8 100%);
}

.login-card {
  width: min(460px, 100%);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid #d8e3f2;
  box-shadow: 0 18px 42px rgba(23, 48, 82, 0.12);
  padding: 24px;
  display: grid;
  gap: 10px;
}

.eyebrow {
  margin: 0;
  color: #5e748f;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
  font-size: 44px;
  line-height: 0.95;
  color: #1e3650;
}

.hint {
  margin: 2px 0 6px;
  color: #617893;
  font-size: 14px;
  line-height: 1.5;
}

label {
  color: #4c627c;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

input {
  width: 100%;
  min-width: 0;
  border: 1px solid #c7d7e8;
  border-radius: 12px;
  padding: 12px 13px;
  font-size: 14px;
  color: #1f3850;
  background: #fff;
}

input:focus {
  outline: none;
  border-color: #5fbcdf;
  box-shadow: 0 0 0 3px rgba(83, 179, 216, 0.22);
}

button {
  margin-top: 4px;
  border: 1px solid #2ba8d9;
  border-radius: 12px;
  height: 44px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #2c9fd4 0%, #45bce9 100%);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 18px rgba(31, 121, 168, 0.28);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error {
  margin: 2px 0 0;
  color: #aa3648;
  background: #ffecef;
  border: 1px solid #f3bfca;
  border-radius: 10px;
  font-size: 13px;
  padding: 9px 11px;
}

@media (max-width: 560px) {
  .login-card {
    padding: 18px;
  }

  h1 {
    font-size: 36px;
  }
}
</style>
