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

The Windows installer and Microsoft Store package are generated together in:

```text
release\ARLO-OS-Setup.exe
release\ARLO-OS-Setup.appx
```

The application version comes from `package.json` and is displayed in About and
Settings. Increase it before each Microsoft Store submission so Partner Center
receives a package with a new, unique package full name. Microsoft Store builds
update through the Store; after a submission is published, users can open
**Settings → About → Software updates → Open Store updates** and choose **Get
updates** in the Store Library. Store review and rollout must complete before a
new package is offered.

The desktop app defaults to `https://arlo-os.onrender.com` for optional cloud
profile analytics. Set `VITE_ANALYTICS_API_ORIGIN` before building only if the
release should use a different HTTPS service origin.

Windows installer icons use `build\icon.ico`; Microsoft Store tile icons use
the ARLO PNG artwork in `build\appx\`. Keep the existing Partner Center identity
in `electron-builder-release.cjs` and `electron-builder-store.cjs` when publishing
updates to the same Store listing.

## Development

```powershell
npm run electron:dev
```

This starts the Electron app and its Vite development server. To run only the
browser preview, use `npm run dev`; microphone wake listening requires Electron.

Install the Python build dependencies before the first Electron launch with
`python -m pip install -r voice-requirements.txt`.

The microphone must be available to desktop apps in Windows privacy settings.
Recognition is offline and includes English, Hindi, and Marathi transcription.
Say “Hey Lily” or “Hey Ghost” to activate the Lily assistant. Common actions
include opening/closing apps, creating/renaming desktop items, reading local time
and battery state, showing the desktop, and toggling Focus Mode. Gemini must be
configured for open-ended answers and additional natural-language tool planning.
When spoken replies are enabled, Lily uses Gemini's online TTS service, so the
reply text is sent to Google and requires internet access. Ghost does not have
unrestricted control of the PC; high-risk tools remain disabled.

## Important

`npm run build` only creates the React/Vite web bundle in `dist/`.
It does **not** create a Windows installer.

`npm run dist:win` cleans previous generated `dist/` and `release/` outputs,
builds the renderer and offline voice listener, then runs Electron Builder once
for both NSIS and AppX targets. It creates both the Windows installer `.exe` and
the Store upload `.appx` in `release/`.
