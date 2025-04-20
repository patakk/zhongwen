import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  server: {
    watch: {
      usePolling: true
    },
    hmr: {
      overlay: true
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5117',
        changeOrigin: true, 
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/login': {
        target: 'http://localhost:5117',
        changeOrigin: true,
      }
    },
    allowedHosts: [
      'localhost',
      'e4c2-86-33-89-246.ngrok-free.app'
    ],
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
