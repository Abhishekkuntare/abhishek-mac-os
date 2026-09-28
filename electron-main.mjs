
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  nativeTheme,
} from 'electron';

import electronUpdater from 'electron-updater';



import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

const { autoUpdater } = electronUpdater;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow = null;
let viteProcess = null;

/* =========================================================
   WAIT FOR VITE
========================================================= */

function waitForServer(url, timeout = 30000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();

        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }

        retry();
      });

      req.on('error', retry);

      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - started > timeout) {
        reject(
          new Error(`Timed out waiting for ${url}`)
        );
        return;
      }

      setTimeout(check, 250);
    };

    check();
  });
}

/* =========================================================
   DEVELOPMENT SERVER
========================================================= */

async function startDevServer() {
  const port =
    process.env.ELECTRON_VITE_PORT || '5173';

  const viteCli = path.join(
    __dirname,
    'node_modules',
    'vite',
    'bin',
    'vite.js'
  );

  console.log(
    '[Abhishek OS] Starting Vite development server...'
  );

  console.log(
    '[Abhishek OS] Vite:',
    viteCli
  );

  viteProcess = spawn(
    process.execPath,
    [
      viteCli,
      '--host',
      '127.0.0.1',
      '--port',
      port,
    ],
    {
      cwd: __dirname,
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
      env: {
        ...process.env,
        BROWSER: 'none',
      },
    }
  );

  viteProcess.on('error', (error) => {
    console.error(
      '[Abhishek OS] Vite process error:',
      error
    );
  });

  viteProcess.on('exit', (code, signal) => {
    console.log(
      `[Abhishek OS] Vite exited: code=${code}, signal=${signal}`
    );
  });

  const url = `http://127.0.0.1:${port}`;

  await waitForServer(url);

  return url;
}

/* =========================================================
   SEND UPDATE EVENT TO REACT
========================================================= */

function sendUpdateEvent(channel, payload = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(
    'app:update',
    {
      channel,
      ...payload,
    }
  );
}

/* =========================================================
   AUTOMATIC UPDATE SYSTEM
========================================================= */

function setupAutoUpdater() {
  /*
   * Never run the updater while developing.
   */
  if (!app.isPackaged) {
    console.log(
      '[Abhishek OS] Auto updater disabled in development.'
    );

    return;
  }

  console.log(
    '[Abhishek OS] Automatic updater enabled.'
  );

  /*
   * Download updates automatically in the background.
   */
  autoUpdater.autoDownload = true;

  /*
   * Install the downloaded update when the
   * application quits/restarts.
   */
  autoUpdater.autoInstallOnAppQuit = true;

  /*
   * Don't install silently while the application
   * is being used.
   */
  autoUpdater.allowPrerelease = false;

  /* -------------------------------------------------------
     CHECKING
  ------------------------------------------------------- */

  autoUpdater.on(
    'checking-for-update',
    () => {
      console.log(
        '[Abhishek OS] Checking for updates...'
      );

      sendUpdateEvent(
        'checking'
      );
    }
  );

  /* -------------------------------------------------------
     UPDATE AVAILABLE
  ------------------------------------------------------- */

  autoUpdater.on(
    'update-available',
    (info) => {
      console.log(
        '[Abhishek OS] Update available:',
        info.version
      );

      sendUpdateEvent(
        'available',
        {
          version: info.version,
        }
      );
    }
  );

  /* -------------------------------------------------------
     NO UPDATE
  ------------------------------------------------------- */

  autoUpdater.on(
    'update-not-available',
    (info) => {
      console.log(
        '[Abhishek OS] Already up to date:',
        info.version
      );

      sendUpdateEvent(
        'not-available',
        {
          version: info.version,
        }
      );
    }
  );

  /* -------------------------------------------------------
     DOWNLOAD PROGRESS
  ------------------------------------------------------- */

  autoUpdater.on(
    'download-progress',
    (progress) => {
      const percent = Math.round(
        progress.percent
      );

      console.log(
        `[Abhishek OS] Downloading update: ${percent}%`
      );

      sendUpdateEvent(
        'downloading',
        {
          percent,
          transferred: progress.transferred,
          total: progress.total,
          bytesPerSecond:
            progress.bytesPerSecond,
        }
      );
    }
  );

  /* -------------------------------------------------------
     UPDATE DOWNLOADED
  ------------------------------------------------------- */

  autoUpdater.on(
    'update-downloaded',
    (info) => {
      console.log(
        '[Abhishek OS] Update downloaded:',
        info.version
      );

      sendUpdateEvent(
        'downloaded',
        {
          version: info.version,
        }
      );
    }
  );

  /* -------------------------------------------------------
     UPDATE ERROR
  ------------------------------------------------------- */

  autoUpdater.on(
    'error',
    (error) => {
      console.error(
        '[Abhishek OS] Auto update error:',
        error
      );

      sendUpdateEvent(
        'error',
        {
          message:
            error?.message ||
            'Unable to update Abhishek OS.',
        }
      );
    }
  );

  /*
   * Wait until the application has fully loaded
   * before checking GitHub.
   *
   * This prevents update activity from affecting
   * the startup experience.
   */
  setTimeout(() => {
    autoUpdater
      .checkForUpdates()
      .catch((error) => {
        console.error(
          '[Abhishek OS] Update check failed:',
          error
        );
      });
  }, 10000);
}

/* =========================================================
   CREATE WINDOW
========================================================= */

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,

    minWidth: 1000,
    minHeight: 650,

    show: false,

    backgroundColor: '#05070b',

    frame: false,

    title: 'Abhishek OS',

    // Application icon
    icon: path.join(__dirname, 'build', 'icon.ico'),

    webPreferences: {
      preload: path.join(
        __dirname,
        'electron-preload.cjs'
      ),

      contextIsolation: true,

      nodeIntegration: false,

      sandbox: true,

      spellcheck: true,
    },
  });

  /* =======================================================
     WINDOW EVENTS
  ======================================================= */

  mainWindow.on(
    'ready-to-show',
    () => {
      mainWindow?.show();
    }
  );

  mainWindow.on(
    'closed',
    () => {
      mainWindow = null;
    }
  );

  /* =======================================================
     EXTERNAL LINKS
  ======================================================= */

  mainWindow.webContents.setWindowOpenHandler(
    ({ url }) => {
      if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }

      return {
        action: 'deny',
      };
    }
  );

  /* =======================================================
     DEVELOPMENT
  ======================================================= */

  if (isDev) {
    try {
      const url =
        await startDevServer();

      console.log(
        '[Abhishek OS] Development renderer:',
        url
      );

      await mainWindow.loadURL(url);
    } catch (error) {
      console.error(
        '[Abhishek OS] Failed to start development server:',
        error
      );

      app.quit();
    }

    return;
  }

  /* =======================================================
     PRODUCTION
  ======================================================= */

  const productionIndex = path.join(
    __dirname,
    'dist',
    'index.html'
  );

  console.log(
    '[Abhishek OS] Production renderer:',
    productionIndex
  );

  try {
    await mainWindow.loadFile(
      productionIndex
    );

    console.log(
      '[Abhishek OS] Production renderer loaded successfully.'
    );
  } catch (error) {
    console.error(
      '[Abhishek OS] FAILED TO LOAD PRODUCTION RENDERER:',
      error
    );

    app.quit();
  }

  /* =======================================================
     RENDERER DEBUG
  ======================================================= */

  mainWindow.webContents.on(
    'did-finish-load',
    () => {
      console.log(
        '[Abhishek OS] Renderer finished loading.'
      );

      console.log(
        '[Abhishek OS] Packaged:',
        app.isPackaged
      );

      console.log(
        '[Abhishek OS] App path:',
        app.getAppPath()
      );

      console.log(
        '[Abhishek OS] Version:',
        app.getVersion()
      );
    }
  );

  mainWindow.webContents.on(
    'did-fail-load',
    (
      _event,
      errorCode,
      errorDescription,
      validatedURL
    ) => {
      console.error(
        '[Abhishek OS] Renderer failed to load:',
        {
          errorCode,
          errorDescription,
          validatedURL,
        }
      );
    }
  );
}

/* =========================================================
   ELECTRON READY
========================================================= */

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';

  /* =======================================================
     WINDOW CONTROLS
  ======================================================= */

  ipcMain.handle(
    'window:minimize',
    () => {
      mainWindow?.minimize();
    }
  );

  ipcMain.handle(
    'window:maximize',
    () => {
      if (!mainWindow) {
        return false;
      }

      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }

      return mainWindow.isMaximized();
    }
  );

  ipcMain.handle(
    'window:close',
    () => {
      mainWindow?.close();
    }
  );

  ipcMain.handle(
    'window:isMaximized',
    () => {
      return (
        mainWindow?.isMaximized() ??
        false
      );
    }
  );

  /* =======================================================
     EXTERNAL URL
  ======================================================= */

  ipcMain.handle(
    'app:openExternal',
    (_event, url) => {
      if (
        typeof url === 'string' &&
        /^https?:\/\//i.test(url)
      ) {
        return shell.openExternal(url);
      }

      return false;
    }
  );

  /* =======================================================
     APP INFORMATION
  ======================================================= */

  ipcMain.handle(
    'app:platform',
    () => process.platform
  );

  ipcMain.handle(
    'app:version',
    () => app.getVersion()
  );

  /* =======================================================
     UPDATE CONTROLS
  ======================================================= */

  /*
   * Allow React to manually check for an update.
   */

  ipcMain.handle(
    'app:checkForUpdates',
    async () => {
      if (!app.isPackaged) {
        return {
          success: false,
          reason: 'development',
        };
      }

      try {
        const result =
          await autoUpdater.checkForUpdates();

        return {
          success: true,
          version:
            result?.updateInfo?.version ||
            null,
        };
      } catch (error) {
        console.error(
          '[Abhishek OS] Manual update check failed:',
          error
        );

        return {
          success: false,
          error:
            error?.message ||
            'Update check failed.',
        };
      }
    }
  );

  /*
   * Restart the application and install the
   * downloaded update.
   */

  ipcMain.handle(
    'app:installUpdate',
    () => {
      if (!app.isPackaged) {
        return false;
      }

      console.log(
        '[Abhishek OS] Installing update and restarting...'
      );

      autoUpdater.quitAndInstall(
        false,
        true
      );

      return true;
    }
  );

  /* =======================================================
     CREATE APPLICATION
  ======================================================= */

  await createWindow();

  /* =======================================================
     START AUTOMATIC UPDATER
  ======================================================= */

  setupAutoUpdater();

  /* =======================================================
     MACOS
  ======================================================= */

  app.on(
    'activate',
    () => {
      if (
        BrowserWindow.getAllWindows()
          .length === 0
      ) {
        createWindow();
      }
    }
  );
});

/* =========================================================
   CLOSE
========================================================= */

app.on(
  'window-all-closed',
  () => {
    if (viteProcess) {
      viteProcess.kill();
      viteProcess = null;
    }

    if (
      process.platform !== 'darwin'
    ) {
      app.quit();
    }
  }
);

/* =========================================================
   BEFORE QUIT
========================================================= */

app.on(
  'before-quit',
  () => {
    if (viteProcess) {
      viteProcess.kill();
      viteProcess = null;
    }
  }
);
