import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/app': resolve(__dirname, 'src/app'),
      '@/auth': resolve(__dirname, 'src/auth'),
      '@/expenses': resolve(__dirname, 'src/expenses'),
      '@/categories': resolve(__dirname, 'src/categories'),
      '@/analytics': resolve(__dirname, 'src/analytics'),
      '@/currency': resolve(__dirname, 'src/currency'),
      '@/voice': resolve(__dirname, 'src/voice'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/three': resolve(__dirname, 'src/three'),
      '@/pwa': resolve(__dirname, 'src/pwa'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/store': resolve(__dirname, 'src/store'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },

  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          // Future chunks for code splitting
          // three: ['three', '@react-three/fiber', '@react-three/drei'],
          // charts: ['recharts'],
        },
      },
    },
  },

  server: {
    port: 3000,
    host: true,
  },

  preview: {
    port: 3000,
    host: true,
  },

  define: {
    global: 'globalThis',
  },
});
