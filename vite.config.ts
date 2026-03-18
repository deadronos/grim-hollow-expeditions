import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@react-three') || id.includes('/three/')) {
            return 'engine'
          }

          if (id.includes('/react/') || id.includes('react-dom') || id.includes('/zustand/')) {
            return 'app'
          }

          return undefined
        },
      },
    },
  },
})
