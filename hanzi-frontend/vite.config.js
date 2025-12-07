import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  const config = {
    server: {
      watch: {
        usePolling: true,
      },
      hmr: {
        overlay: true,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5117',
          changeOrigin: true,
        },
        '/login/google': {
          target: 'http://localhost:5117',
          changeOrigin: true,
        },
      },
      allowedHosts: [
        'localhost',
        'e4c2-86-33-89-246.ngrok-free.app',
      ],
      port: 5888,
    },

    plugins: [
      vue(),
      !isBuild && vueDevTools(),      // dev only
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    build: {
      rollupOptions: {
        plugins: isBuild
          ? [
              visualizer({
                filename: 'stats.html',
                gzipSize: true,
                brotliSize: true,
                open: true,
              }),
            ]
          : [],
      },
    },
  }

  if (isBuild) {
    config.base = '/'
  }

  return config
})
