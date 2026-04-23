import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: "@use '@/assets/scss/_variables.scss' as *;",
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/')) return 'vendor-vue'
          if (id.includes('/lucide-vue-next/') || id.includes('/aos/') || id.includes('/swiper/')) return 'vendor-ui'
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
})

