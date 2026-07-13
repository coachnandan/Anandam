import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react')) return 'ui';
            if (id.includes('recharts')) return 'charts';
            return 'vendor-other';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    css: true,
    exclude: ['node_modules', 'dist', 'e2e/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  }
})

