import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize bundle size
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Monaco Editor in separate chunk
          'monaco': ['monaco-editor'],
          // React core
          'react-vendor': ['react', 'react-dom'],
          // Terminal
          'terminal': ['xterm', 'xterm-addon-fit', 'socket.io-client'],
          // Icons
          'icons': ['lucide-react']
        },
        // Optimize chunk size
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Sourcemaps only in dev
    sourcemap: false
  },
  optimizeDeps: {
    // Pre-bundle dependencies
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: ['monaco-editor'] // Monaco is large, load on demand
  },
  server: {
    // Faster HMR
    hmr: {
      overlay: false // Disable error overlay for faster dev
    }
  }
})
