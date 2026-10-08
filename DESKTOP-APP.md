# ARLO OS — Desktop Application

This project is now packaged as a real desktop application using **Electron + React + Vite**. It is not only a browser website.

## Run in development

```bash
npm install
npm run electron:dev
```

Electron starts the Vite renderer automatically and opens ARLO OS in a native desktop window.

## Build installers

### Windows

```bash
npm install
npm run dist:win
```

The Windows installers are placed in `release/`.

For a portable `.exe`:

```bash
npm run dist:portable
```

### macOS

On a Mac, install the dependencies and build the universal app:

```bash
npm install
npm run package:mac
```

This creates a `.dmg`, `.zip`, and updater metadata in `release/` for both
Apple Silicon and Intel Macs. macOS releases are currently unsigned and
not notarized; macOS may require using **Open** from the app's Finder context
menu on first launch. The tagged GitHub Release workflow builds and publishes
both Windows and macOS installers.

## Desktop integration

- Native Electron window
- Frameless desktop window with custom OS UI
- Secure preload bridge (`contextIsolation: true`, `nodeIntegration: false`)
- Native minimize/maximize/close IPC
- External web links open in the system browser
- macOS universal `.dmg` and `.zip` packages
- Windows NSIS installer
- Windows portable executable target
- App identity: `com.abhishekkuntare.abhishekos`
- Product/publisher identity: **Abhishek Kuntare**

The React UI remains the visual operating-system simulation, while Electron supplies the actual desktop application shell.

On macOS, Finder can access folders explicitly selected by the user. Windows
system controls, Windows-only runtime installation, and the bundled offline
Hey Ghost wake listener are not available in the macOS build.


### Windows EINVAL fix

The Electron development launcher starts Vite through `cmd.exe` on Windows to avoid Node's `spawn EINVAL` error when spawning `npx.cmd` directly. If you received `Error: spawn EINVAL` from `electron-main.mjs`, replace the project with this updated version and run:

```powershell
npm install
npm run electron:dev
```

For a production Windows installer:

```powershell
npm run dist:win
```
