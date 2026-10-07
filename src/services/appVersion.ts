export const APP_VERSION = __ARLO_APP_VERSION__;

export const getInstalledAppVersion = async () => {
  const getVersion = window.electronAPI?.version;
  if (!getVersion) return APP_VERSION;

  try {
    return await getVersion();
  } catch (error) {
    console.error('[ARLO OS] Could not read the installed application version:', error);
    return APP_VERSION;
  }
};
