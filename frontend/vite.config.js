import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco': ['monaco-editor']
        }
      }
    },
    worker: {
      format: 'es'
    }
  },
  optimizeDeps: {
    exclude: ['@wailsjs/runtime']
  },
  server: {
    fs: {
      strict: false
    }
  },
  publicDir: 'public',
  base: './'
})
