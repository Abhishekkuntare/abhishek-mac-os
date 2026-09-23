# Abhishek OS

A macOS-inspired desktop experience built with React, TypeScript, Vite and Electron.

**This is a desktop application project.** Electron provides the native application shell; React renders the Abhishek OS interface inside it.

### Quick start

```bash
npm install
npm run electron:dev
```

### Windows build

```bash
npm run dist:win
```

See `DESKTOP-APP.md` for complete desktop packaging instructions.

## Windows desktop build

For a clean rebuild after updating the Electron packaging code:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run build
npm run dist:win
```

The production Electron app loads `dist/index.html` with `loadFile()` and Vite uses relative asset URLs (`base: './'`). This is required for the packaged app to render correctly from the Windows `.exe` instead of a web server.
