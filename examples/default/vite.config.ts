import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@react-three/uikit-lucide', '@pmndrs/uikit', '@pmndrs/uikit-lucide'],
  },
  base: '/uikit/examples/default/',
  resolve: {
    dedupe: ['@react-three/fiber', 'three', '@react-three/uikit', '@pmndrs/uikit'],
    alias: {
      '@pmndrs/uikit/webgpu': path.resolve(__dirname, '../../packages/uikit/src/webgpu/index.ts'),
      '@pmndrs/uikit': path.resolve(__dirname, '../../packages/uikit/src/index.ts'),
      '@react-three/uikit/webgpu': path.resolve(__dirname, '../../packages/react/src/webgpu/index.tsx'),
      '@react-three/uikit': path.resolve(__dirname, '../../packages/react/src/index.tsx'),
      '@pmndrs/uikit-default': path.resolve(__dirname, '../../packages/kits/default/core/src/index.ts'),
      '@react-three/uikit-default': path.resolve(__dirname, '../../packages/kits/default/react/src/index.ts'),
      '@pmndrs/uikit-lucide': path.resolve(__dirname, '../../packages/icons/lucide/core/src/index.ts'),
      '@react-three/uikit-lucide': path.resolve(__dirname, '../../packages/icons/lucide/react/src/index.ts'),
    },
  },
})
