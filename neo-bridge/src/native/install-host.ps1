# Neo Native Messaging Host — Windows Installer
# Registers the native messaging host in the Windows Registry.
# Run as Administrator: .\install-host.ps1

$ErrorActionPreference = "Stop"

$hostName = "com.neo.bridge"
$manifestPath = Join-Path $PSScriptRoot "host-manifest.json"

# Registry path
$regPath = "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\$hostName"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Neo Native Messaging Host Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check manifest exists
if (-not (Test-Path $manifestPath)) {
    Write-Host "[ERROR] Manifest not found: $manifestPath" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Host Name: $hostName" -ForegroundColor Yellow
Write-Host "[INFO] Manifest: $manifestPath" -ForegroundColor Yellow
Write-Host ""

# Create registry key
try {
    if (Test-Path $regPath) {
        Write-Host "[WARN] Registry key already exists, updating..." -ForegroundColor Yellow
    }
    New-Item -Path $regPath -Force | Out-Null
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $manifestPath
    Write-Host "[OK] Registry key created/updated successfully." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create registry key: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[REMINDER] Update host-manifest.json with your extension ID!" -ForegroundColor Magenta
Write-Host "[REMINDER] Install psutil: pip install psutil" -ForegroundColor Magenta
Write-Host ""
Write-Host "Done." -ForegroundColor Green
