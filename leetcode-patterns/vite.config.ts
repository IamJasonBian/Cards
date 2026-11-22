import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sdContextPlugin } from './vite-plugin-sd-context'

export default defineConfig({
  plugins: [react(), tailwindcss(), sdContextPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
