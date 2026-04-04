@echo off
REM BuyBridge Market Hub - Desktop App Launcher
REM This script starts the server and opens the app in your default browser

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo ========================================
echo   BuyBridge Market Hub
echo   Desktop Application Launcher
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Starting server...
echo.

REM Start the server in a new window
start cmd /k "cd /d "%~dp0" && node server.js"

REM Wait a bit for the server to start
timeout /t 3 /nobreak

echo.
echo Opening BuyBridge Market Hub in your browser...
echo.

REM Open the app in default browser
start http://localhost:3000

echo.
echo ========================================
echo Server is running on http://localhost:3000
echo Close this window to stop the server
echo ========================================
echo.

pause
