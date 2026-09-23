@echo off
setlocal
cd /d "%~dp0"

echo.
echo =============================================
echo       ABHISHEK OS - WINDOWS BUILD
echo =============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install Node.js LTS, then run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto :error
)

echo Building React renderer...
call npm run build:renderer
if errorlevel 1 goto :error

echo Creating Windows NSIS installer...
call npm run package:win
if errorlevel 1 goto :error

echo.
echo =============================================
echo BUILD COMPLETE
echo Installer: release\ABHISHEK-OS-Setup.exe
echo =============================================
echo.
if exist "release\ABHISHEK-OS-Setup.exe" start "" explorer.exe /select,"%CD%\release\ABHISHEK-OS-Setup.exe"
pause
exit /b 0

:error
echo.
echo BUILD FAILED. Read the error above.
pause
exit /b 1
