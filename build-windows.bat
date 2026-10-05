@echo off
setlocal
cd /d "%~dp0"

echo.
echo =============================================
echo       ARLO OS - WINDOWS BUILD
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

echo Creating Windows installer and Microsoft Store package...
call npm run dist:win
if errorlevel 1 goto :error

echo.
echo =============================================
echo BUILD COMPLETE
echo Installer: release\ARLO-OS-Setup.exe
echo Store package: release\ARLO-OS-Setup.appx
echo =============================================
echo.
if exist "release" start "" explorer.exe "%CD%\release"
pause
exit /b 0

:error
echo.
echo BUILD FAILED. Read the error above.
pause
exit /b 1
