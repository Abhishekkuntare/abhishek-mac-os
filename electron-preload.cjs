const {
  contextBridge,
  ipcRenderer,
} = require('electron');

/*
 * Keep all Electron communication behind
 * contextBridge.
 *
 * Renderer code never gets direct access
 * to ipcRenderer.
 */

contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    /* =====================================================
       WINDOW CONTROLS
    ===================================================== */

    minimize: () =>
      ipcRenderer.invoke(
        'window:minimize'
      ),

    maximize: () =>
      ipcRenderer.invoke(
        'window:maximize'
      ),

    close: () =>
      ipcRenderer.invoke(
        'window:close'
      ),

    isMaximized: () =>
      ipcRenderer.invoke(
        'window:isMaximized'
      ),

    /* =====================================================
       EXTERNAL LINKS
    ===================================================== */

    openExternal: (url) =>
      ipcRenderer.invoke(
        'app:openExternal',
        url
      ),

    /* =====================================================
       APP INFORMATION
    ===================================================== */

    platform: () =>
      ipcRenderer.invoke(
        'app:platform'
      ),

    version: () =>
      ipcRenderer.invoke(
        'app:version'
      ),

    /* =====================================================
       AUTOMATIC UPDATES
    ===================================================== */

    /*
     * Manually check GitHub for a new version.
     */

    checkForUpdates: () =>
      ipcRenderer.invoke(
        'app:checkForUpdates'
      ),

    /*
     * Restart Abhishek OS and install the
     * downloaded update.
     */

    installUpdate: () =>
      ipcRenderer.invoke(
        'app:installUpdate'
      ),

    /*
     * Listen for update events coming from
     * electron-main.mjs.
     *
     * Returns a cleanup function so React
     * can remove the listener when a component
     * unmounts.
     */

    onUpdate: (callback) => {
      if (
        typeof callback !==
        'function'
      ) {
        return () => { };
      }

      const listener = (
        _event,
        data
      ) => {
        callback(data);
      };

      ipcRenderer.on(
        'app:update',
        listener
      );

      return () => {
        ipcRenderer.removeListener(
          'app:update',
          listener
        );
      };
    },
  }
);
