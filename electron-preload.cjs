const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  platform: () => ipcRenderer.invoke('app:platform'),
  version: () => ipcRenderer.invoke('app:version'),
});
