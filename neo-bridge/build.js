// ─── Neo Bridge Build Script ──────────────────────────────────────────────────
// Uses esbuild to bundle TypeScript into Chrome extension-compatible JS.

import * as esbuild from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  // Build service worker
  await esbuild.build({
    entryPoints: [resolve(__dirname, 'src/background/service-worker.ts')],
    bundle: true,
    outfile: resolve(__dirname, '../dist/service-worker.js'),
    format: 'esm',
    target: 'esnext',
    platform: 'browser',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
  });

  // Build content script
  await esbuild.build({
    entryPoints: [resolve(__dirname, 'src/content-scripts/probe-injector.ts')],
    bundle: true,
    outfile: resolve(__dirname, '../dist/content-script.js'),
    format: 'iife',
    target: 'esnext',
    platform: 'browser',
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV !== 'production',
  });

  console.log('[Neo Bridge] Build complete ✓');
}

build().catch((err) => {
  console.error('[Neo Bridge] Build failed:', err);
  process.exit(1);
});
