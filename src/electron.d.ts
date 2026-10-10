declare global {
  const __ARLO_APP_VERSION__: string;

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

  interface AuthorizedSearchResult {
    name: string;
    path: string;
    extension: string;
    snippet: string;
    score: number;
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

  interface SystemMediaState {
    brightness: number | null;
    volume: number | null;
  }

  interface NotchDeviceActivity {
    kind: 'power' | 'usb' | 'display' | 'headphones' | 'controller' | 'storage' | 'bluetooth';
    deviceName: string;
    connected: boolean;
  }

  interface NotchClipboardActivity {
    preview: string;
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

  interface GhostAITranscript {
    text: string;
    language: string;
  }

  interface GhostAIContext {
    displayName: string;
    availableApps: Array<{ id: string; name: string }>;
    detective: {
      name: string;
      role: string;
      personality: string;
      description: string;
      skills: string[];
      instructions: string;
      permittedTools: string[];
    };
  }

  interface GhostAIToolCall {
    id: string;
    name: string;
    args: Record<string, unknown>;
    thoughtSignature?: string;
  }

  interface GhostAIToolResult {
    id: string;
    name: string;
    success: boolean;
    result: string;
  }

  type GhostAIChatResponse =
    | { success: true; kind: 'message'; message: string }
    | { success: true; kind: 'tool_calls'; toolCalls: GhostAIToolCall[] }
    | { success: false; code: string; message: string; details?: string };

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
      updateChannel: () => Promise<'store' | 'direct' | 'development'>;
      openStoreUpdates: () => Promise<boolean>;
      checkForUpdates: () => Promise<{
        success: boolean;
        reason?: 'store-managed' | 'development';
        version?: string | null;
        error?: string;
      }>;
      installUpdate: () => Promise<boolean>;
      onUpdate: (callback: (event: {
        channel: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
        version?: string;
        percent?: number;
        message?: string;
      }) => void) => () => void;
      getConnectivityState: () => Promise<ConnectivityState>;
      getBatteryStatus: () => Promise<SystemBatteryStatus>;
      getSystemMediaState: () => Promise<SystemMediaState>;
      sendWindowsMediaCommand: (command: 'previous' | 'playPause' | 'next') => Promise<void>;
      onSystemMediaState: (callback: (state: SystemMediaState) => void) => () => void;
      setNotchClipboardMonitoring: (enabled: boolean) => Promise<void>;
      setNotchDeviceMonitoring: (enabled: boolean) => Promise<void>;
      onNotchClipboardActivity: (callback: (activity: NotchClipboardActivity) => void) => () => void;
      onNotchDeviceActivity: (callback: (activity: NotchDeviceActivity) => void) => () => void;
      setWifiEnabled: (enabled: boolean) => Promise<ConnectivityState>;
      setBluetoothEnabled: (enabled: boolean) => Promise<ConnectivityState>;
      scanWifiNetworks: () => Promise<NearbyWifiNetwork[]>;
      connectWifi: (ssid: string) => Promise<void>;
      selectBluetoothDevice: (deviceId: string) => Promise<boolean>;
      openBluetoothSettings: () => Promise<void>;
      onBluetoothDevices: (callback: (devices: NearbyBluetoothDevice[]) => void) => () => void;
      onBrowserOpenUrl: (callback: (url: string) => void) => () => void;
      chooseLocalFolders: () => Promise<{ canceled: boolean; folders: LocalFolderGrant[] }>;
      chooseLocalApplication: () => Promise<{ canceled: boolean; application?: { name: string; path: string; iconUrl?: string } }>;
      getLocalFolders: () => Promise<LocalFolderGrant[]>;
      grantAllDrives: () => Promise<LocalFolderGrant[]>;
      revokeAllDrives: () => Promise<LocalFolderGrant[]>;
      removeLocalFolder: (folderPath: string) => Promise<LocalFolderGrant[]>;
      listLocalFolder: (folderPath: string) => Promise<LocalFolderEntry[]>;
      searchAuthorizedFiles: (terms: string[]) => Promise<AuthorizedSearchResult[]>;
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
        model?: 'gemini-3.8-flash';
        requestId: string;
        messages: GhostAIMessage[];
        context: GhostAIContext;
        pendingToolCalls?: GhostAIToolCall[];
        toolResults?: GhostAIToolResult[];
      }) => Promise<GhostAIChatResponse>;
      ghostAISynthesizeSpeech: (text: string) => Promise<string>;
      ghostAICancelChat: (requestId: string) => Promise<boolean>;
      ghostAISetGlobalShortcut: (shortcut: 'ctrl-shift-space' | 'ctrl-alt-space' | 'ctrl-shift-g') => Promise<boolean>;
      onGhostAIToggle: (callback: () => void) => () => void;
      ghostAIWakeDetected: () => Promise<void>;
      ghostAIStartWakeListener: () => Promise<boolean>;
      ghostAIStopWakeListener: () => Promise<void>;
      ghostAISetWakePaused: (paused: boolean) => Promise<void>;
      onGhostAITranscript: (callback: (transcript: GhostAITranscript) => void) => () => void;
      onGhostAIWakeState: (callback: (state: {
        status: 'starting' | 'ready' | 'paused' | 'stopped' | 'error';
        message?: string;
      }) => void) => () => void;
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
