import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  nativeTheme,
} from 'electron';

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow = null;
let viteProcess = null;

/* -------------------------------------------------------
   WAIT FOR VITE
------------------------------------------------------- */

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

/* -------------------------------------------------------
   DEVELOPMENT SERVER
------------------------------------------------------- */

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

  console.log('Starting Vite development server...');
  console.log('Vite:', viteCli);

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
      'Vite process error:',
      error
    );
  });

  viteProcess.on('exit', (code, signal) => {
    console.log(
      `Vite exited: code=${code}, signal=${signal}`
    );
  });

  const url = `http://127.0.0.1:${port}`;

  await waitForServer(url);

  return url;
}

/* -------------------------------------------------------
   CREATE WINDOW
------------------------------------------------------- */

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

  /* -----------------------------------------------------
     WINDOW EVENTS
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     EXTERNAL LINKS
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     DEVELOPMENT
  ----------------------------------------------------- */

  if (isDev) {
    try {
      const url = await startDevServer();

      console.log(
        'Development renderer:',
        url
      );

      await mainWindow.loadURL(url);
    } catch (error) {
      console.error(
        'Failed to start development server:',
        error
      );

      app.quit();
    }

    return;
  }

  /* -----------------------------------------------------
     PRODUCTION
     
     THIS IS THE IMPORTANT PART.
     
     Electron loads the NEW dist/index.html
     that was created by:
     
     npm run build:renderer
     
     electron-builder then packages this dist folder.
  ----------------------------------------------------- */

  const productionIndex = path.join(
    __dirname,
    'dist',
    'index.html'
  );

  console.log(
    'Production renderer:',
    productionIndex
  );

  try {
    await mainWindow.loadFile(
      productionIndex
    );

    console.log(
      'Abhishek OS production renderer loaded successfully.'
    );
  } catch (error) {
    console.error(
      'FAILED TO LOAD PRODUCTION RENDERER:',
      error
    );

    app.quit();
  }

  /* -----------------------------------------------------
     RENDERER LOAD DEBUG
  ----------------------------------------------------- */

  mainWindow.webContents.on(
    'did-finish-load',
    () => {
      console.log(
        'Renderer finished loading.'
      );

      console.log(
        'Packaged:',
        app.isPackaged
      );

      console.log(
        'App path:',
        app.getAppPath()
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
        'Renderer failed to load:',
        {
          errorCode,
          errorDescription,
          validatedURL,
        }
      );
    }
  );
}

/* -------------------------------------------------------
   ELECTRON READY
------------------------------------------------------- */

app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';

  /* -----------------------------------------------------
     WINDOW CONTROLS
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     EXTERNAL URL
  ----------------------------------------------------- */

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

  /* -----------------------------------------------------
     APP INFORMATION
  ----------------------------------------------------- */

  ipcMain.handle(
    'app:platform',
    () => process.platform
  );

  ipcMain.handle(
    'app:version',
    () => app.getVersion()
  );

  /* -----------------------------------------------------
     CREATE APP
  ----------------------------------------------------- */

  await createWindow();

  /* -----------------------------------------------------
     MACOS
  ----------------------------------------------------- */

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

/* -------------------------------------------------------
   CLOSE
------------------------------------------------------- */

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

/* -------------------------------------------------------
   BEFORE QUIT
------------------------------------------------------- */

app.on(
  'before-quit',
  () => {
    if (viteProcess) {
      viteProcess.kill();
      viteProcess = null;
    }
  }
);