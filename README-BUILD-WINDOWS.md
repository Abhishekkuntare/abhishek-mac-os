# Abhishek OS — Windows installer build

## Requirements
- Windows 10/11 64-bit
- Node.js LTS
- npm

## Build the installer

From this folder run:

```powershell
npm install
npm run dist:win
```

Or double-click `build-windows.bat`.

The installer is generated at:

```text
release\ABHISHEK-OS-Setup.exe
```

## Development

```powershell
npm run dev
```

For Electron development:

```powershell
npm run electron:dev
```

## Important

`npm run build` only creates the React/Vite web bundle in `dist/`.
It does **not** create a Windows installer.

`npm run dist:win` first builds `dist/`, then runs Electron Builder with the NSIS target to create the installable `.exe`.
