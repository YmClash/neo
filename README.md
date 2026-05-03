# 🧬 Neo — Advanced Monitoring & Control

> *Extension Chrome Manifest V3 propulsée par Rust/WASM — Inspirée du génie de Vegapunk*

## Architecture

```
neo/
├── neo-core/      🦀 Rust → WASM (Calcul intensif)
├── neo-ui/        ⚛️ React + Tailwind (Interface)
├── neo-bridge/    🌉 Service Worker + Native Messaging
├── neo-assets/    🎨 Thèmes & Icônes
└── manifest.json  📋 Configuration Manifest V3
```

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Core Logic | Rust → WASM (wasm-pack + wasm-bindgen) |
| Neural Link | TypeScript (ES2022) |
| UI | React 18 + Tailwind CSS 3 |
| Animations | Framer Motion |
| Graphiques | Recharts |
| Build | Vite 5 |
| System Bridge | Native Messaging (Python) |

## Prérequis

- **Rust** + `wasm-pack` : `cargo install wasm-pack`
- **Node.js** 18+ + npm
- **Python** 3.8+ (pour le bridge natif)
- `pip install psutil` (pour le monitoring système)

## Installation

```bash
# 1. Compiler le module WASM
cd neo-core
wasm-pack build --target web --out-dir ../neo-ui/src/wasm --out-name neo_core

# 2. Installer les dépendances
cd ..
npm install

# 3. Build complet
npm run build:all

# 4. Charger dans Chrome
# → chrome://extensions → Developer Mode → Load Unpacked → sélectionner le dossier neo/
```

## Thèmes

- 🔵 **Egghead** (défaut) — Indigo/violet tech
- 🟢 **Matrix** — Vert terminal classique
- 🔴 **Punk** — Rouge/orange cyberpunk

## Modules

| Module | Description | Status |
|--------|-------------|--------|
| ⏱️ Focus Timer | Pomodoro avancé | Phase 2 |
| 📊 System Monitor | CPU/RAM/Disk via Python | Phase 3 |
| 🕷️ Web Probes | Extraction de données web | Phase 2 |
| 📋 Task Manager | Matrice Eisenhower | Phase 2 |
| 📰 Tech Watch | Veille IA/Rust/Cyber | Phase 4 |

## Licence

MIT
