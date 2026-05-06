import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

// ─── Vite Configuration for Neo Chrome Extension ──────────────────────────────
// Multi-entry build: popup + dashboard
// WASM support via wasm-unsafe-eval CSP
// CRITICAL: Chrome extensions need relative paths (no leading /)

export default defineConfig({
  plugins: [
    react(),
    // Post-build: copy HTML files to dist root for flat structure
    {
      name: 'neo-flatten-html',
      closeBundle() {
        const distDir = resolve(__dirname, '../dist');
        const srcPopup = resolve(distDir, 'src/popup/popup.html');
        const srcDash = resolve(distDir, 'src/dashboard/dashboard.html');

        if (existsSync(srcPopup)) {
          copyFileSync(srcPopup, resolve(distDir, 'popup.html'));
          console.log('[Neo] Copied popup.html to dist root');
        }
        if (existsSync(srcDash)) {
          copyFileSync(srcDash, resolve(distDir, 'dashboard.html'));
          console.log('[Neo] Copied dashboard.html to dist root');
        }
      },
    },
  ],

  // CRITICAL for Chrome extensions: use relative paths
  base: '',

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
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
  },

  // Dev server configuration (for development preview only)
  server: {
    port: 5173,
    hmr: true,
  },
});
