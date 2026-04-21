import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "state-vendor": ["@reduxjs/toolkit", "react-redux", "redux", "redux-persist"],
          "ui-vendor": ["framer-motion", "lucide-react", "react-hot-toast", "react-helmet-async"],
          "map-vendor": ["leaflet", "react-leaflet"],
          "network-vendor": ["axios", "socket.io-client"],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
