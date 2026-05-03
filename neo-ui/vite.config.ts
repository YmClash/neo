import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// ─── Vite Configuration for Neo Chrome Extension ──────────────────────────────
// Multi-entry build: popup + dashboard
// WASM support via wasm-unsafe-eval CSP

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@popup': resolve(__dirname, 'src/popup'),
      '@dashboard': resolve(__dirname, 'src/dashboard'),
      '@themes': resolve(__dirname, 'src/themes'),
      '@wasm': resolve(__dirname, 'src/wasm'),
    },
  },

  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: false, // Don't clear — bridge builds into same dir
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        dashboard: resolve(__dirname, 'src/dashboard/dashboard.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Chrome extensions must have all code bundled
    target: 'esnext',
    minify: 'terser',
    sourcemap: process.env.NODE_ENV === 'development',
  },

  // Dev server configuration (for development preview only)
  server: {
    port: 5173,
    hmr: true,
  },
});
