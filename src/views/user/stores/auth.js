import { defineStore } from 'pinia'
import { login as loginApi, register as registerApi, getMe } from '@/views/user/services/authApi'

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

    async fetchUser() {
      if (!this.token) return
      try {
        this.user = await getMe()
      } catch (err) {
        this.logout()
      }
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
    }
  },
})
