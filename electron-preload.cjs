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

    captureWindowPreview: (bounds) =>
      ipcRenderer.invoke(
        'window:capturePreview',
        bounds
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

    getConnectivityState: () =>
      ipcRenderer.invoke(
        'system:getConnectivityState'
      ),

    getBatteryStatus: () =>
      ipcRenderer.invoke('system:getBatteryStatus'),

    setWifiEnabled: (enabled) =>
      ipcRenderer.invoke('system:setWifiEnabled', enabled),

    setBluetoothEnabled: (enabled) =>
      ipcRenderer.invoke('system:setBluetoothEnabled', enabled),

    scanWifiNetworks: () =>
      ipcRenderer.invoke('system:scanWifiNetworks'),

    connectWifi: (ssid) =>
      ipcRenderer.invoke('system:connectWifi', ssid),

    selectBluetoothDevice: (deviceId) =>
      ipcRenderer.invoke('system:selectBluetoothDevice', deviceId),

    openBluetoothSettings: () =>
      ipcRenderer.invoke('system:openBluetoothSettings'),

    getResourceUsage: () =>
      ipcRenderer.invoke('system:getResourceUsage'),

    onBluetoothDevices: (callback) => {
      const listener = (_event, devices) => callback(devices);
      ipcRenderer.on('system:bluetooth-devices', listener);
      return () => ipcRenderer.removeListener('system:bluetooth-devices', listener);
    },

    onBrowserOpenUrl: (callback) => {
      const listener = (_event, url) => callback(url);
      ipcRenderer.on('browser:open-url', listener);
      return () => ipcRenderer.removeListener('browser:open-url', listener);
    },

    chooseLocalFolders: () =>
      ipcRenderer.invoke('files:chooseFolders'),

    getLocalFolders: () =>
      ipcRenderer.invoke('files:getFolders'),

    grantAllDrives: () =>
      ipcRenderer.invoke('files:grantAllDrives'),

    revokeAllDrives: () =>
      ipcRenderer.invoke('files:revokeAllDrives'),

    removeLocalFolder: (folderPath) =>
      ipcRenderer.invoke('files:removeFolder', folderPath),

    listLocalFolder: (folderPath) =>
      ipcRenderer.invoke('files:listFolder', folderPath),

    openLocalPath: (targetPath) =>
      ipcRenderer.invoke('files:openPath', targetPath),

    openLocalCodeFile: (targetPath) =>
      ipcRenderer.invoke('files:openCodeFile', targetPath),

    openLocalCodePath: (targetPath) =>
      ipcRenderer.invoke('files:openCodePath', targetPath),

    readLocalImage: (targetPath) =>
      ipcRenderer.invoke('files:readImage', targetPath),

    getMediaUrl: (targetPath) =>
      ipcRenderer.invoke('files:getMediaUrl', targetPath),

    createLocalEntry: (parentPath, name, isDirectory) =>
      ipcRenderer.invoke('files:createEntry', parentPath, name, isDirectory),

    renameLocalEntry: (targetPath, newName) =>
      ipcRenderer.invoke('files:renameEntry', targetPath, newName),

    trashLocalEntry: (targetPath) =>
      ipcRenderer.invoke('files:trashEntry', targetPath),

    listLocalTrash: () =>
      ipcRenderer.invoke('files:listTrash'),

    restoreLocalTrashEntry: (id) =>
      ipcRenderer.invoke('files:restoreTrashEntry', id),

    deleteLocalTrashEntry: (id) =>
      ipcRenderer.invoke('files:deleteTrashEntry', id),

    emptyLocalTrash: () =>
      ipcRenderer.invoke('files:emptyTrash'),

    transferLocalEntries: (sourcePaths, destinationPath, move) =>
      ipcRenderer.invoke('files:transferEntries', sourcePaths, destinationPath, move),

    openLocalTerminal: (targetPath) =>
      ipcRenderer.invoke('files:openTerminal', targetPath),

    runCode: (request) =>
      ipcRenderer.invoke('code:run', request),

    installCodeRuntime: (language) =>
      ipcRenderer.invoke('code:installRuntime', language),

    ghostAIIsConfigured: () =>
      ipcRenderer.invoke('ghost-ai:isConfigured'),

    ghostAISetApiKey: (apiKey) =>
      ipcRenderer.invoke('ghost-ai:setApiKey', apiKey),

    ghostAIRemoveApiKey: () =>
      ipcRenderer.invoke('ghost-ai:removeApiKey'),

    ghostAIChat: (request) =>
      ipcRenderer.invoke('ghost-ai:chat', request),

    ghostAICancelChat: (requestId) =>
      ipcRenderer.invoke('ghost-ai:cancelChat', requestId),

    ghostAISetGlobalShortcut: (shortcut) =>
      ipcRenderer.invoke('ghost-ai:setGlobalShortcut', shortcut),

    ghostAIWakeDetected: () =>
      ipcRenderer.invoke('ghost-ai:wakeDetected'),

    ghostAIStartWakeListener: () =>
      ipcRenderer.invoke('ghost-ai:startWakeListener'),

    ghostAIStopWakeListener: () =>
      ipcRenderer.invoke('ghost-ai:stopWakeListener'),

    ghostAISetWakePaused: (paused) =>
      ipcRenderer.invoke('ghost-ai:setWakePaused', paused),

    onGhostAITranscript: (callback) => {
      const listener = (_event, transcript) => callback(transcript);
      ipcRenderer.on('ghost-ai:transcript', listener);
      return () => ipcRenderer.removeListener('ghost-ai:transcript', listener);
    },

    onGhostAIWakeState: (callback) => {
      const listener = (_event, state) => callback(state);
      ipcRenderer.on('ghost-ai:wakeState', listener);
      return () => ipcRenderer.removeListener('ghost-ai:wakeState', listener);
    },

    onGhostAIToggle: (callback) => {
      const listener = () => callback();
      ipcRenderer.on('ghost-ai:toggle', listener);
      return () => ipcRenderer.removeListener('ghost-ai:toggle', listener);
    },

    readClipboardText: () =>
      ipcRenderer.invoke('studio:clipboardRead'),

    writeClipboardText: (text) =>
      ipcRenderer.invoke('studio:clipboardWrite', text),

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
     * Restart ARLO OS and install the
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
