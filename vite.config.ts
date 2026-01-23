import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Motor 3D y React básico
          'three-core': ['three', '@react-three/fiber', '@react-three/drei'],
          // Motor de Física (pesado)
          'physics': ['@react-three/rapier'],
          // Comunicación y Utilidades
          'comms': ['socket.io-client', 'peerjs', 'qrcode.react'],
          // Framework base
          'vendor': ['react', 'react-dom']
        }
      }
    }
  }
})
