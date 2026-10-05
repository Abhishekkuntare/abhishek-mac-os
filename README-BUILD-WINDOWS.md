# ARLO OS — Windows installer build

## Requirements
- Windows 10/11 64-bit
- Node.js LTS
- npm
- Python 3.10 or newer (only needed to build/run from source)

## Build the installer

From this folder run:

```powershell
npm install
python -m pip install -r voice-requirements.txt
npm run dist:win
```

Or double-click `build-windows.bat`.

The first voice build downloads the multilingual Whisper base model and bundles
it with the Python listener into the Windows app. This adds a larger model and
uses more CPU than the old English-only recognizer. Installed builds do not need
Python or an internet connection for speech recognition.

The installer is generated at:

```text
release\ARLO-OS-Setup.exe
```

Windows installer icons use `build\icon.ico`; Microsoft Store tile icons use
the ARLO PNG artwork in `build\appx\`. Keep the existing Partner Center identity
in `electron-builder-store.cjs` when publishing updates to the same Store listing.

## Development

```powershell
npm run electron:dev
```

This command builds the bundled offline voice listener when needed, then starts
the Electron app and its Vite development server. To run only the browser preview,
use `npm run dev`; microphone wake listening requires Electron.

Install the Python build dependencies before the first Electron launch with
`python -m pip install -r voice-requirements.txt`.

The microphone must be available to desktop apps in Windows privacy settings.
Recognition is offline and includes English, Hindi, and Marathi transcription.
The selected Brad or Lily name and Ghost wake phrase are supported. Common actions
include opening/closing apps, creating/renaming desktop items, reading local time
and battery state, showing the desktop, and toggling Focus Mode. Gemini must be
configured for open-ended answers and additional natural-language tool planning.
Ghost does not have unrestricted control of the PC; high-risk tools remain disabled.

## Important

`npm run build` only creates the React/Vite web bundle in `dist/`.
It does **not** create a Windows installer.

`npm run dist:win` first builds `dist/`, then runs Electron Builder with the NSIS target to create the installable `.exe`.
