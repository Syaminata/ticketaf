import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/remote-api': {
        target: 'https://ticket-taf.itea.africa',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/remote-api/, '/api'),
        secure: false,
      },
      '/uploads': {
        target: 'https://ticket-taf.itea.africa',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
