import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Alternativa sin CORS: descomenta este proxy y define
    // VITE_API_BASE_URL=/api en tu .env para usar rutas relativas.
    // proxy: {
    //   '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    // },
  },
})
