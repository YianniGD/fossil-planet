import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'docs',
  },
  plugins: [react()],
  base: '/Fossil-Planet/',

  resolve: {
    alias: {
      'lottie-web': 'lottie-web/build/player/lottie_light.js',
    },
  },
})