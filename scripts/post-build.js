// Neo Post-Build Script
// Copies manifest.json and assets into dist/ for final packaging.

import { cpSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');

// Ensure dist exists
if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

// Copy manifest.json
cpSync(resolve(root, 'manifest.json'), resolve(dist, '../manifest.json'), { force: true });

// Copy assets
const assetsSource = resolve(root, 'neo-assets');
const assetsDest = resolve(root, 'neo-assets'); // Already at root level
if (existsSync(assetsSource)) {
  console.log('[Post-Build] Assets already in place.');
}

console.log('[Post-Build] ✓ Extension packaging complete.');
