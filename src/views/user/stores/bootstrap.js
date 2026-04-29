import { defineStore } from 'pinia'

import { env } from '@/shared/config/env'
import { getBootstrap, getHealth } from '@/views/user/services/publicApi'
import { readNavigationMenusRevision } from '@/shared/utils/navigationSync'

export const useBootstrapStore = defineStore('bootstrap', {
  state: () => ({
    initialized: false,
    loading: false,
    error: null,
    health: null,
    language: null,
    menus: {},
    settings: [],
    heroBanners: [],
    rawBootstrap: null,
    initializedAt: null,
    menusRevision: 0,
    _inFlight: null,
  }),

  getters: {
    settingsMap(state) {
      return Object.fromEntries(
        state.settings.map((item) => [item.config_key, item.config_value])
      )
    },

    hasBootstrap(state) {
      return Boolean(state.rawBootstrap)
    },
  },

  actions: {
    async initialize(force = false) {
      const latestMenusRevision = readNavigationMenusRevision()
      const hasFreshMenusRevision = latestMenusRevision > this.menusRevision

      if (this.loading && this._inFlight) {
        return this._inFlight
      }

      if (this.initialized && !force && !hasFreshMenusRevision) {
        return {
          health: this.health,
          bootstrap: this.rawBootstrap,
        }
      }

      this.loading = true
      this.error = null

      this._inFlight = Promise.all([
        getHealth(),
        getBootstrap({ language_code: localStorage.getItem('user-locale') || env.languageCode }),
      ])
        .then(([health, bootstrap]) => {
          this.health = health
          this.language = bootstrap.language || null
          this.menus = bootstrap.menus || {}
          this.settings = bootstrap.settings || []
          this.heroBanners = bootstrap.hero_banners || []
          this.rawBootstrap = bootstrap
          this.initialized = true
          this.initializedAt = new Date().toISOString()
          this.menusRevision = latestMenusRevision || Date.now()
          return { health, bootstrap }
        })
        .catch((error) => {
          // ── Graceful degradation: khi BE offline, FE vẫn render với fallback data ──
          console.warn('[bootstrap] Backend không kết nối được, dùng fallback data:', error?.message)
          this.error = error
          this.initialized = true  // cho phép FE render với fallbackNavItems / fallbackFooterGroups
          this.menus = {}
          this.settings = []
          this.heroBanners = []
          // KHÔNG throw để ClientLayout không bị crash
        })
        .finally(() => {
          this.loading = false
          this._inFlight = null
        })

      return this._inFlight
    },
  },
})
