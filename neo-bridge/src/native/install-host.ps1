# Neo Native Messaging Host -- Windows Installer v2.0
# Registers the native messaging host in the Windows Registry.
# Run: powershell -ExecutionPolicy Bypass -File install-host.ps1

$ErrorActionPreference = "Stop"

$hostName    = "com.neo.bridge"
$manifestPath = Join-Path $PSScriptRoot "host-manifest.json"
$regPath     = "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\$hostName"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Neo Native Messaging Host Installer   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check manifest
Write-Host "[1/5] Checking manifest..." -ForegroundColor Yellow
if (-not (Test-Path $manifestPath)) {
    Write-Host "  [ERROR] Manifest not found: $manifestPath" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Manifest found." -ForegroundColor Green

# Step 2: Validate Extension ID
Write-Host "[2/5] Validating Extension ID..." -ForegroundColor Yellow
$manifestContent = Get-Content $manifestPath -Raw | ConvertFrom-Json
$origins = $manifestContent.allowed_origins
$placeholder = $false
foreach ($origin in $origins) {
    if ($origin -like "*YOUR_EXTENSION_ID*" -or $origin -like "*<*>*") {
        $placeholder = $true
    }
}
if ($placeholder) {
    Write-Host "  [ERROR] Extension ID is still a placeholder in host-manifest.json!" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Extension ID: $($origins[0])" -ForegroundColor Green

# Step 3: Check Python 3.13
Write-Host "[3/5] Checking Python 3.13..." -ForegroundColor Yellow
try {
    $pyVersion = & py -3.13 "--version" 2>&1
    Write-Host "  [OK] $pyVersion" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Python 3.13 not found via 'py -3.13'." -ForegroundColor Red
    exit 1
}

# Step 4: Check/install psutil
Write-Host "[4/5] Checking psutil..." -ForegroundColor Yellow
$psutilCheck = & py -3.13 "-c" "import psutil; print(psutil.__version__)" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [INFO] psutil missing -- installing..." -ForegroundColor Yellow
    & py -3.13 -m pip install psutil --quiet
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] psutil install failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] psutil installed." -ForegroundColor Green
} else {
    Write-Host "  [OK] psutil $psutilCheck already installed." -ForegroundColor Green
}

# Step 5: Register in Windows Registry
Write-Host "[5/5] Writing to Windows Registry..." -ForegroundColor Yellow
try {
    if (Test-Path $regPath) {
        Write-Host "  [INFO] Key exists -- updating..." -ForegroundColor Yellow
    }
    New-Item -Path $regPath -Force | Out-Null
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $manifestPath
    Write-Host "  [OK] Registry key created/updated." -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Failed to create registry key: $_" -ForegroundColor Red
    exit 1
}

# Connectivity test
Write-Host ""
Write-Host "-- Connectivity Test ----------------------------" -ForegroundColor Cyan
$hostPy = Join-Path $PSScriptRoot "host.py"
try {
    $testScript = "import sys, struct, json, subprocess; msg=json.dumps({'action':'ping'}).encode(); payload=struct.pack('@I',len(msg))+msg; proc=subprocess.run(['py','-3.13',r'$hostPy'],input=payload,capture_output=True,timeout=5); length=struct.unpack('@I',proc.stdout[:4])[0] if len(proc.stdout)>=4 else 0; print(json.loads(proc.stdout[4:4+length]) if length else 'No response')"
    $result = & py -3.13 -c $testScript 2>&1
    Write-Host "  HOST: $result" -ForegroundColor Cyan
} catch {
    Write-Host "  [WARN] Connectivity test failed (may be normal on first run)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation complete!                " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Reload extension at chrome://extensions" -ForegroundColor Magenta
Write-Host "then open Neo Dashboard -- BRIDGE ONLINE badge should light up." -ForegroundColor Magenta
Write-Host ""
