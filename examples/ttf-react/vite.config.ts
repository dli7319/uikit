import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/uikit/examples/ttf-react/',
  plugins: [react()],
  resolve: {
    dedupe: ['@react-three/fiber', 'three'],
    alias: {
      '@pmndrs/uikit/webgpu': path.resolve(__dirname, '../../packages/uikit/src/webgpu/index.ts'),
      '@pmndrs/uikit': path.resolve(__dirname, '../../packages/uikit/src/index.ts'),
      '@react-three/uikit/webgpu': path.resolve(__dirname, '../../packages/react/src/webgpu/index.tsx'),
      '@react-three/uikit': path.resolve(__dirname, '../../packages/react/src/index.tsx'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
  build: {
    target: 'esnext',
  },
})
