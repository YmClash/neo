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

// Extension is loaded directly from the neo/ root folder, 
// so we don't need to copy manifest.json or assets into dist/.
// The manifest.json paths already point to dist/ files.
console.log('[Post-Build] ✓ Extension packaging complete.');
