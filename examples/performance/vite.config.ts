import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@react-three/uikit'],
  },
  base: '/uikit/examples/performance/',
  resolve: {
    dedupe: ['@react-three/fiber', 'three'],
    alias: {
      '@pmndrs/uikit/webgpu': path.resolve(__dirname, '../../packages/uikit/src/webgpu/index.ts'),
      '@pmndrs/uikit': path.resolve(__dirname, '../../packages/uikit/src/index.ts'),
      '@react-three/uikit/webgpu': path.resolve(__dirname, '../../packages/react/src/webgpu/index.tsx'),
      '@react-three/uikit': path.resolve(__dirname, '../../packages/react/src/index.tsx'),
    },
  },
})
