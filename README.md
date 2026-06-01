# 🧬 Neo — Advanced Monitoring & Control

> *Extension Chrome Manifest V3 propulsée par Rust/WASM — Inspirée du génie de Vegapunk*
> **v0.3.0 — Phase 5 : Co-pilote Autonome & Mémoire Sémantique**

---

## Architecture

```
neo/
├── neo-core/      🦀 Rust → WASM (Calcul intensif)
├── neo-ui/        ⚛️  React + Vite (Interface)
├── neo-bridge/    🌉 Service Worker + Native Messaging + Python AI Bridge
├── neo-assets/    🎨 Thèmes & Icônes
└── manifest.json  📋 Configuration Manifest V3
```

## Stack Technique

| Couche | Technologie |
|--------|-------------|
| Core Logic | Rust → WASM (wasm-pack + wasm-bindgen) |
| Neural Link | TypeScript (ES2022) |
| UI | React 18 + Vanilla CSS (glassmorphism) |
| Animations | Framer Motion |
| Graphiques | Recharts |
| Build | Vite 5 |
| System Bridge | Native Messaging (Python 3.13) |
| AI Local | Ollama (llama3.2, phi4, gemma4...) |
| AI Cloud | Gemini · OpenAI · Claude |
| Mémoire Sémantique | ChromaDB + nomic-embed-text (Phase 5) |

## Prérequis

- **Rust** + `wasm-pack` : `cargo install wasm-pack`
- **Node.js** 18+ + npm
- **Python 3.13** (pour le bridge natif + ChromaDB)
- **Ollama** : `ollama serve` (mode local AI)
- `pip install psutil chromadb requests` (ou lancer `install-chromadb.ps1`)

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Build complet (WASM + UI + Bridge)
npm run build:all

# 3. Charger dans Chrome
# → chrome://extensions → Developer Mode → Load Unpacked → sélectionner neo/

# 4. (Optionnel) Enregistrer le bridge Python
# → Ouvrir neo-bridge/src/native/install-host.ps1 et l'exécuter

# 5. (Phase 5) Installer ChromaDB pour la mémoire sémantique
# → Ouvrir neo-bridge/src/native/install-chromadb.ps1 et l'exécuter
```

## Scripts npm

| Commande | Description |
|----------|-------------|
| `npm run build:all` | Build complet (WASM + UI + Bridge + post-processing) |
| `npm run build:ui` | UI React uniquement |
| `npm run build:bridge` | Service Worker + TypeScript Bridge uniquement |
| `npm run clean` | Nettoie `dist/`, `wasm/`, et les `.js` parasites dans `src/` |
| `npm run clean:src-js` | Supprime les `.js` générés par `tsc` dans les dossiers source |
| `npm run reset` | `clean:hard` complet + réinstallation des dépendances |
| `npm run dev` | Serveur de développement Vite (UI uniquement) |

## Modules & Fonctionnalités

| Module | Description | Phase |
|--------|-------------|-------|
| ⏱️ Focus Timer | Pomodoro avancé avec notifications | Phase 2 |
| 📊 System Monitor | CPU/RAM/Disk/Réseau temps réel via Python | Phase 3 |
| 🕷️ Web Probes | Extraction de données web + sentiment | Phase 2-3 |
| 📋 Task Manager | Matrice Eisenhower interactive | Phase 2 |
| 🤖 Neo Console | Chat AI multi-provider (Ollama/Gemini/OpenAI/Claude) | Phase 4 |
| ⚡ Panic Mode | Détection surcharge + thème Punk Hazard automatique | Phase 3 |
| 🖥 Kernel Terminal | Terminal sandboxé dans le Dashboard | Phase 3 |
| 📚 Codex Sémantique | Mémoire longue vectorielle via ChromaDB | **Phase 5** |
| 📡 Mode Proactif | Rapports IA autonomes toutes les 15min | **Phase 5** |

## Phase 5 — Neo Proactif & Codex Sémantique

### 📚 Codex (Mémoire Longue Vectorielle)

Neo peut mémoriser des informations persistantes sur toi, ton setup et tes préférences.
Ces souvenirs sont stockés dans **ChromaDB** (base vectorielle locale) et indexés par embeddings `nomic-embed-text`.

**Flux lors d'une requête AI :**
```
Message utilisateur → SW → codex_search (sémantique) → Top-3 résultats
       ↓
buildSystemPrompt(metrics, events, codexResults)
       ↓
<neo_memory>           ← balises XML strictes (évite la confusion LLM)
  <memory relevance="94%">
    <title>GPU Setup</title>
    <content>GTX 970, 4GB VRAM, mode CPU Ollama forcé</content>
  </memory>
</neo_memory>
       ↓
routeQuery → AI Provider → Réponse contextualisée
```

**Architecture double-niveau :**
- **Tier 1** — `chrome.storage.local` : affichage UI immédiat, toujours disponible
- **Tier 2** — ChromaDB via `host.py` : recherche sémantique par similarité cosinus

**Optimisation anti-VRAM thrashing :**
```python
# keep_alive:-1 garde nomic-embed-text en RAM (274MB)
# Évite le rechargement à chaque requête sur GTX 970
json={"model": "nomic-embed-text", "prompt": text, "keep_alive": -1}
```

### 📡 Mode Proactif

Neo surveille le système de manière autonome. Toggle **🔔 PROACTIF** dans la NeoConsole.

- Alarme Chrome `neo-ai-proactive` toutes les **15 minutes**
- Analyse : métriques + buffer contexte + Codex sémantique
- Génère un rapport concis : score santé /100, points critiques, action recommandée
- Notification Chrome si anomalie détectée (mots-clés : critique, surcharge, alerte...)
- Désactivé par défaut — gratuit illimité avec Ollama local

### Installation ChromaDB

```powershell
# Dans PowerShell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& "neo-bridge\src\native\install-chromadb.ps1"
```

Puis dans Ollama :
```bash
ollama pull nomic-embed-text   # ~274MB — modèle d'embeddings
```

## Thèmes

- 🔵 **Egghead** (défaut) — Indigo/violet tech
- 🟢 **Matrix** — Vert terminal classique
- 🔴 **Punk** — Rouge/orange cyberpunk

## Environnement Python

Le bridge utilise **Python 3.13** en chemin absolu pour éviter les conflits de launcher `py.exe`.

```
neo-bridge/src/native/
├── host.py                # v0.4.0 — Métriques + ChromaDB + Ollama
├── host-launcher.bat      # py -3.13 host.py (py.ini configuré → 3.13)
├── host-manifest.json     # Enregistrement Chrome Native Messaging
├── install-host.ps1       # Enregistrement du bridge dans le registre
└── install-chromadb.ps1   # Installation ChromaDB + nomic-embed-text
```

**Configuration Python Launcher** (`%LOCALAPPDATA%\py.ini`) :
```ini
[defaults]
python=3.13
```

## Données Locales (jamais commitées)

```
neo-bridge/data/chroma/    # Base vectorielle ChromaDB (données personnelles)
neo-bridge/src/native/neo-bridge.log  # Logs Python du bridge
```

## Licence

MIT — *Egghead Laboratory, Dr. Y_MC*
