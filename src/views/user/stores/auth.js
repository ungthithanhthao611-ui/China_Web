import { defineStore } from 'pinia'
import { login as loginApi, register as registerApi } from '@/views/user/services/authApi'
import { getMyProfile } from '@/views/user/services/profileApi'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('user_token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
  },

  actions: {
    async login(payload) {
      this.loading = true
      this.error = null
      try {
        const response = await loginApi(payload)
        this.token = response.access_token
        localStorage.setItem('user_token', this.token)
        this.user = response.user || null
        await this.fetchUser()
        return response
      } catch (err) {
        this.error = err.message || 'Đăng nhập thất bại'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(payload) {
      this.loading = true
      this.error = null
      try {
        const response = await registerApi(payload)
        return response
      } catch (err) {
        this.error = err.message || 'Đăng ký thất bại'
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchUser(options = {}) {
      const { logoutOnError = true, throwOnError = false } = options
      if (!this.token) return null
      try {
        this.user = await getMyProfile()
        return this.user
      } catch (err) {
        if (logoutOnError) {
          this.logout()
        }
        if (throwOnError) {
          throw err
        }
        return null
      }
    },

    setUser(user) {
      this.user = user || null
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('user_token')
    },

    async initialize() {
      if (this.token) {
        await this.fetchUser()
      }
    },
  },
})
