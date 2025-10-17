import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
        },
      },
    },
    commonjsOptions: {
      include: [/chart\.js/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['chart.js', 'react-chartjs-2'],
  },
})