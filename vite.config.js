
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  const backendPort = env.PORT || 3010

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        }
        // ,
        // '/socket.io': {
        //   target: `http://127.0.0.1:${backendPort}`,
        //   ws: true,
        // }
      }
    }
  }
})