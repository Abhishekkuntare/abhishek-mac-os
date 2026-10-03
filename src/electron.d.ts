declare global {
  interface ConnectivityState {
    supported: boolean;
    wifi: {
      enabled: boolean | null;
      connected: boolean | null;
      ssid: string | null;
    };
    bluetooth: {
      enabled: boolean | null;
      connected: boolean | null;
      deviceName: string | null;
    };
  }

  interface NearbyBluetoothDevice {
    deviceId: string;
    deviceName: string;
    deviceType: number;
    paired: boolean;
    connected: boolean;
  }

  interface NearbyWifiNetwork {
    ssid: string;
    signal: number;
    security: string;
    connected: boolean;
    saved: boolean;
  }

  interface LocalFolderGrant {
    path: string;
    label: string;
    isDriveRoot?: boolean;
  }

  interface LocalFolderEntry {
    name: string;
    hostPath: string;
    isDirectory: boolean;
    size: number;
    extension: string;
    createdAt: string;
    updatedAt: string;
  }

  interface LocalTrashEntry {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'image' | 'video' | 'audio' | 'code' | 'archive';
    extension: string;
    size: number;
    deletedAt: string;
    originalLocation: string;
  }

  interface SystemResourceUsage {
    cpuPercent: number | null;
    memoryUsedBytes: number | null;
    memoryTotalBytes: number | null;
  }

  interface SystemBatteryStatus {
    available: boolean;
    level: number;
    charging: boolean;
    plugged: boolean;
  }

  interface CodeExecutionRequest {
    language: 'javascript' | 'python' | 'c' | 'cpp' | 'java';
    code: string;
    stdin: string;
  }

  interface CodeExecutionResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    outputExceeded: boolean;
    signal?: string | null;
  }

  interface GhostAIMessage {
    role: 'user' | 'assistant';
    content: string;
  }

  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      captureWindowPreview: (bounds: { x: number; y: number; width: number; height: number }) => Promise<string>;
      openExternal: (url: string) => Promise<unknown>;
      platform: () => Promise<string>;
      version: () => Promise<string>;
      getConnectivityState: () => Promise<ConnectivityState>;
      getBatteryStatus: () => Promise<SystemBatteryStatus>;
      setWifiEnabled: (enabled: boolean) => Promise<ConnectivityState>;
      setBluetoothEnabled: (enabled: boolean) => Promise<ConnectivityState>;
      scanWifiNetworks: () => Promise<NearbyWifiNetwork[]>;
      connectWifi: (ssid: string) => Promise<void>;
      selectBluetoothDevice: (deviceId: string) => Promise<boolean>;
      openBluetoothSettings: () => Promise<void>;
      onBluetoothDevices: (callback: (devices: NearbyBluetoothDevice[]) => void) => () => void;
      onBrowserOpenUrl: (callback: (url: string) => void) => () => void;
      chooseLocalFolders: () => Promise<{ canceled: boolean; folders: LocalFolderGrant[] }>;
      getLocalFolders: () => Promise<LocalFolderGrant[]>;
      grantAllDrives: () => Promise<LocalFolderGrant[]>;
      revokeAllDrives: () => Promise<LocalFolderGrant[]>;
      removeLocalFolder: (folderPath: string) => Promise<LocalFolderGrant[]>;
      listLocalFolder: (folderPath: string) => Promise<LocalFolderEntry[]>;
      openLocalPath: (targetPath: string) => Promise<string>;
      openLocalCodeFile: (targetPath: string) => Promise<{ opened: boolean; content?: string }>;
      openLocalCodePath: (targetPath: string) => Promise<{ opened: boolean; content?: string }>;
      readLocalImage: (targetPath: string) => Promise<string>;
      getMediaUrl: (targetPath: string) => Promise<string>;
      createLocalEntry: (parentPath: string, name: string, isDirectory: boolean) => Promise<string>;
      renameLocalEntry: (targetPath: string, newName: string) => Promise<string>;
      trashLocalEntry: (targetPath: string) => Promise<void>;
      listLocalTrash: () => Promise<LocalTrashEntry[]>;
      restoreLocalTrashEntry: (id: string) => Promise<string>;
      deleteLocalTrashEntry: (id: string) => Promise<boolean>;
      emptyLocalTrash: () => Promise<number>;
      getResourceUsage: () => Promise<SystemResourceUsage>;
      transferLocalEntries: (sourcePaths: string[], destinationPath: string, move: boolean) => Promise<string[]>;
      openLocalTerminal: (targetPath: string) => Promise<void>;
      runCode: (request: CodeExecutionRequest) => Promise<CodeExecutionResult>;
      installCodeRuntime: (language: 'cpp' | 'java') => Promise<string>;
      ghostAIIsConfigured: () => Promise<boolean>;
      ghostAISetApiKey: (apiKey: string) => Promise<boolean>;
      ghostAIRemoveApiKey: () => Promise<boolean>;
      ghostAIChat: (request: {
        model: string;
        messages: GhostAIMessage[];
      }) => Promise<string>;
      readClipboardText: () => Promise<string>;
      writeClipboardText: (text: string) => Promise<void>;
      setAirDropEnabled?: (enabled: boolean) => Promise<void>;
      setFocus?: (enabled: boolean) => Promise<void>;
      setBrightness?: (brightness: number) => Promise<void>;
      setVolume?: (volume: number) => Promise<void>;
    };
  }
}
export {};
