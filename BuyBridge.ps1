# BuyBridge Market Hub — start the web server and open the site in your browser

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BuyBridge Market Hub" -ForegroundColor Green
Write-Host "  Web server launcher" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Starting BuyBridge server..." -ForegroundColor Yellow
Write-Host ""

# Start the server in a new PowerShell window (background)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; node server.js" -WindowStyle Normal

# Wait for server to start
Write-Host "Waiting for server to start (3 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Opening BuyBridge Market Hub in your browser..." -ForegroundColor Yellow
Write-Host ""

# Open the app in default browser
Start-Process "http://localhost:3000"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Server is running on http://localhost:3000" -ForegroundColor Green
Write-Host "Close the server console window to stop" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to close this window"
