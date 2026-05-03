
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carga el .env de la raíz del proyecto (un nivel arriba de /front-tickets)
  const env = loadEnv(mode, '../', '')
  const backendPort = env.PORT || 3000

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        }
      }
    }
  }
})