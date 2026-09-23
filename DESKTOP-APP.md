# Abhishek OS — Desktop Application

This project is now packaged as a real desktop application using **Electron + React + Vite**. It is not only a browser website.

## Run in development

```bash
npm install
npm run electron:dev
```

Electron starts the Vite renderer automatically and opens Abhishek OS in a native desktop window.

## Build Windows installers

```bash
npm install
npm run dist:win
```

The generated installers are placed in `release/`.

For a portable `.exe`:

```bash
npm run dist:portable
```

## Desktop integration

- Native Electron window
- Frameless desktop window with custom OS UI
- Secure preload bridge (`contextIsolation: true`, `nodeIntegration: false`)
- Native minimize/maximize/close IPC
- External web links open in the system browser
- Windows NSIS installer
- Windows portable executable target
- App identity: `com.abhishekkuntare.abhishekos`
- Product/publisher identity: **Abhishek Kuntare**

The React UI remains the visual operating-system simulation, while Electron supplies the actual desktop application shell.


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
