import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': 'http://localhost:3000',
      '/.well-known/': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        secure: true
      },
      '/identitytoolkit/': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        secure: true
      },
      '/google.firestore.': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: true
      }
    },
    cors: {
      origin: [
        'https://accounts.google.com',
        'https://firestore.googleapis.com',
        'https://www.googleapis.com',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-icons',
        '@radix-ui/react-dialog',
        '@radix-ui/react-slot'
      ],
      output: {
        manualChunks: {
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage'
          ]
        }
      }
    }
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
