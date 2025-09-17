import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command }) => {
  const config = {
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
        },
        '/login/google': {
          target: 'http://localhost:5117',
          changeOrigin: true,
        }
      },
      allowedHosts: [
        'localhost',
        'e4c2-86-33-89-246.ngrok-free.app'
      ],
      port: 5888
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
  }

  if (command === 'build') {
    config.base = '/'
  }

  return config
})
