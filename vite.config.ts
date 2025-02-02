import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Vite env variable handling
  envPrefix: 'VITE_',
  // Enable environment variables expansion
  envDir: process.cwd(),
  // Load environment variables from .env files
  envFile: true
})
