# ═══════════════════════════════════════════════════════════════════════════════
# Neo — Install Script : Codex Sémantique (ChromaDB + nomic-embed-text)
# Phase 5 — Exécuter une seule fois avant de recharger l'extension
# v3 : py launcher fixé → 3.13 par défaut via %LOCALAPPDATA%\py.ini
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "🧬 NEO — Installation du Codex Sémantique" -ForegroundColor Cyan
Write-Host "══════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host ""

# 1. Vérifier Python (py launcher corrigé → 3.13)
Write-Host "▸ Vérification de Python..." -ForegroundColor Yellow
try {
    $ver = & py --version 2>&1
    Write-Host "  ✓ $ver" -ForegroundColor Green
} catch {
    Write-Host "  ✗ py introuvable — utilisation du chemin absolu" -ForegroundColor Yellow
}

# Chemin Python 3.13 absolu (fallback robuste)
$PYTHON313 = "C:\Users\y_mc\AppData\Local\Programs\Python\Python313\python.exe"
if (-not (Test-Path $PYTHON313)) {
    $PYTHON313 = (Get-Command "python" -ErrorAction SilentlyContinue)?.Source
}
if (-not $PYTHON313) { Write-Host "  ✗ Python 3.13 introuvable." -ForegroundColor Red; exit 1 }

# 2. Installer chromadb
Write-Host ""
Write-Host "▸ Installation de ChromaDB..." -ForegroundColor Yellow
& $PYTHON313 -m pip install chromadb --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ chromadb installé" -ForegroundColor Green
} else {
    Write-Host "  ✗ Échec installation chromadb" -ForegroundColor Red
    exit 1
}

# 3. requests
Write-Host ""
Write-Host "▸ Vérification de requests..." -ForegroundColor Yellow
& $PYTHON313 -m pip install requests --quiet
Write-Host "  ✓ requests OK" -ForegroundColor Green

# 4. Ollama + nomic-embed-text
Write-Host ""
Write-Host "▸ Vérification d'Ollama..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction Stop | Out-Null
    Write-Host "  ✓ Ollama est en ligne" -ForegroundColor Green
    Write-Host ""
    Write-Host "▸ Téléchargement de nomic-embed-text (~274 MB)..." -ForegroundColor Yellow
    Write-Host "  (keep_alive:-1 → reste en RAM, zéro VRAM thrashing)" -ForegroundColor DarkGray
    & ollama pull nomic-embed-text
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ nomic-embed-text prêt" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Échec. Lance manuellement : ollama pull nomic-embed-text" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Ollama offline — lance-le puis : ollama pull nomic-embed-text" -ForegroundColor Yellow
}

# 5. Créer data/chroma
Write-Host ""
Write-Host "▸ Création du répertoire ChromaDB..." -ForegroundColor Yellow
$dataPath = Join-Path $PSScriptRoot "../../data/chroma"
New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
Write-Host "  ✓ $dataPath" -ForegroundColor Green

# 6. Test ChromaDB
Write-Host ""
Write-Host "▸ Test ChromaDB..." -ForegroundColor Yellow
$testResult = & $PYTHON313 -c "import chromadb; c = chromadb.Client(); c.create_collection('_neo_test'); c.delete_collection('_neo_test'); print('OK')" 2>&1
if ("$testResult" -match "OK") {
    Write-Host "  ✓ ChromaDB opérationnel" -ForegroundColor Green
} else {
    Write-Host "  ✗ Test échoué: $testResult" -ForegroundColor Red
}

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host "✅ Codex Sémantique prêt !" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor DarkGray
Write-Host "  1. Lance Ollama si pas déjà fait" -ForegroundColor DarkGray
Write-Host "  2. Recharge l'extension : chrome://extensions → bouton ↺" -ForegroundColor DarkGray
Write-Host ""
