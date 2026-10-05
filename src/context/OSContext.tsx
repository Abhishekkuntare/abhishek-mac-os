import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  Wallpaper,
  WindowState,
  DesktopSpace,
  SystemSettings,
  NotificationItem,
  VirtualFile,
  AudioTrack,
} from '../types/desktop';
import { WALLPAPERS, DEFAULT_WALLPAPER } from '../data/wallpapers';
import { APP_REGISTRY } from '../data/defaultApps';
import { AUDIO_TRACKS } from '../data/sampleData';
import { sound } from '../services/soundService';
import {
  captureWindowPreview,
  captureWindowPreviews,
  removeWindowPreview,
} from '../utils/windowPreview';
import { vfs } from '../services/virtualFileSystem';
import { musicEngine } from '../services/musicEngine';
import { activityLog, type ActivityEntry } from '../services/activityLog';

const STORAGE_KEYS = {
  USER: 'abhishek_os_user_v1',
  SETTINGS: 'abhishek_os_settings_v1',
  WALLPAPER: 'abhishek_os_wallpaper_v1',
  LOCK_WALLPAPER: 'abhishek_os_lock_wallpaper_v1',
  SETUP_DONE: 'abhishek_os_setup_completed_v1',
  SPACES: 'abhishek_os_spaces_v1',
  DOCK_APPS: 'abhishek_os_dock_apps_v1',
  GHOST_WAKE_ENABLED: 'abhishek_os_ghost_wake_enabled_v1',
};

const DEFAULT_USER: UserProfile = {
  fullName: 'Abhishek Kuntare',
  displayName: 'Abhishek',
  username: 'abhishek',
  email: 'abhishekkuntare02@gmail.com',
  avatarUrl: '',
  avatarType: 'initials',
  roles: ['Developer', 'Designer', 'Creator'],
  bio: 'Architecting ARLO OS — a desktop experience built for you.',
  pin: '1234',
};

const DEFAULT_SETTINGS: SystemSettings = {
  theme: 'dark',
  accent: 'blue',
  uiStyle: 'balanced',
  animationLevel: 'full',
  soundEffects: true,
  soundVolume: 0.8,
  glassEffects: true,
  glassIntensity: 0.8,
  liveWallpapers: true,
  dockPosition: 'bottom',
  dockSize: 'medium',
  dockAutoHide: false,
  dockMagnification: true,
  menuBarPosition: 'top',
  fontFamily: 'Plus Jakarta Sans',
  cursorStyle: 'system',
  cursorColor: '#38bdf8',
  mascotStyle: 0,
  mascotColor: '#159eff',
  brightness: 100,
  nightShift: false,
  wifiEnabled: false,
  wifiConnected: false,
  wifiNetwork: 'Unavailable',
  bluetoothEnabled: false,
  bluetoothConnected: false,
  bluetoothDeviceName: '',
  doNotDisturb: false,
  airDropEnabled: true,
  batteryLevel: 0,
  batteryCharging: false,
  batteryPlugged: false,
  batteryAvailable: false,
  batteryIconStyle: 'classic',
  lowPowerMode: false,
  language: 'English',
  region: 'India',
  clock24h: false,
  desktopWidgets: {
    weather: true,
    music: true,
    system: true,
    clock: false,
  },
  developerMode: false,
  performanceMode: 'balanced',
  ghostShortcut: 'ctrl-shift-space',
  ghostWakeEnabled: true,
  ghostVoiceResponses: true,
  ghostVoice: 'lily',
};

const INITIAL_SPACES: DesktopSpace[] = [
  { id: 'space-1', name: 'Personal' },
  { id: 'space-2', name: 'Work' },
  { id: 'space-3', name: 'Studio' },
  { id: 'space-4', name: 'Code' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'ARLO OS 1.0 Ready',
    message: 'Welcome to your tailored desktop environment. All native applications loaded.',
    appName: 'System',
    timestamp: 'Just now',
    read: false,
    type: 'system',
  },
  {
    id: 'notif-2',
    title: 'Ghost AI is ready',
    message: 'Your AI workspace is ready when you are.',
    appId: 'ghostai',
    appName: 'Ghost AI',
    timestamp: '9:41 AM',
    read: false,
    type: 'message',
  },
  {
    id: 'notif-3',
    title: 'Design Review in 15m',
    message: 'Quarterly OS Architecture sync with Abhishek Kuntare',
    appId: 'calendar',
    appName: 'Calendar',
    timestamp: '10:00 AM',
    read: false,
    type: 'calendar',
  },
];

interface OSContextType {
  // System State
  isBooting: boolean;
  isLocked: boolean;
  isSleeping: boolean;
  isShuttingDown: boolean;
  hasCompletedSetup: boolean;
  activityEntries: ActivityEntry[];
  activityError: string | null;
  activityTrackingEnabled: boolean;
  setActivityTrackingEnabled: (enabled: boolean) => void;
  recordActivity: (event: Omit<ActivityEntry, 'id' | 'timestamp'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  clearActivity: () => Promise<void>;
  finishOnboarding: (user: Partial<UserProfile>, settings: Partial<SystemSettings>) => void;
  resetSetup: () => void;
  lockSystem: () => void;
  unlockSystem: (enteredPin?: string) => boolean;
  sleepSystem: () => void;
  wakeSystem: () => void;
  restartSystem: () => void;
  shutdownSystem: () => void;
  cancelShutdown: () => void;

  // Dialogs & Overlays
  showPowerDialog: boolean;
  setShowPowerDialog: (open: boolean) => void;
  showAboutModal: boolean;
  setShowAboutModal: (open: boolean) => void;
  showSpotlight: boolean;
  setShowSpotlight: (open: boolean) => void;
  showControlCenter: boolean;
  setShowControlCenter: (open: boolean) => void;
  showNotificationCenter: boolean;
  setShowNotificationCenter: (open: boolean) => void;
  showMissionControl: boolean;
  setShowMissionControl: (open: boolean) => void;
  showAppSwitcher: boolean;
  setShowAppSwitcher: (open: boolean) => void;
  showCommandPalette: boolean;
  setShowCommandPalette: (open: boolean) => void;
  showGhostAssistant: boolean;
  setShowGhostAssistant: (open: boolean) => void;
  showActivityHistory: boolean;
  setShowActivityHistory: (open: boolean) => void;
  quickLookFile: VirtualFile | null;
  setQuickLookFile: (file: VirtualFile | null) => void;

  // User & Settings
  user: UserProfile;
  updateUser: (fields: Partial<UserProfile>) => void;
  settings: SystemSettings;
  resolvedTheme: 'dark' | 'light';
  updateSettings: (fields: Partial<SystemSettings>) => void;

  // Wallpaper
  currentWallpaper: Wallpaper;
  setWallpaper: (wp: Wallpaper) => void;
  uploadCustomWallpaper: (dataUrl: string, name: string) => void;
  lockScreenWallpaper: string | null;
  setLockScreenWallpaper: (dataUrl: string | null) => void;

  // Spaces
  spaces: DesktopSpace[];
  activeSpaceId: string;
  setActiveSpaceId: (id: string) => void;
  addSpace: (name?: string) => void;
  renameSpace: (id: string, name: string) => void;
  removeSpace: (id: string) => void;

  // Window Management
  windows: WindowState[];
  openApp: (appId: string, initialTitle?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => Promise<void>;
  showDesktop: () => Promise<void>;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, width: number, height: number, x?: number, y?: number) => void;
  snapWindow: (id: string, snapType: 'left' | 'right' | 'top' | 'maximize' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  moveWindowToSpace: (windowId: string, spaceId: string) => void;

  // Dock
  dockAppIds: string[];
  toggleDockPin: (appId: string) => void;
  reorderDockApps: (newOrder: string[]) => void;
  moveDockApp: (sourceIndex: number, targetIndex: number) => void;
  bouncingAppId: string | null;
  triggerAppBounce: (appId: string) => void;

  // Fullscreen
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Local Computer File Access & Storage
  importLocalFiles: (files: FileList | File[], targetPath?: string) => Promise<number>;
  connectLocalDirectory: (targetPath?: string) => Promise<number>;
  userTracks: AudioTrack[];
  addCustomTrack: (track: AudioTrack) => void;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Music Player
  currentTrackIndex: number;
  currentTrack: AudioTrack;
  isPlayingMusic: boolean;
  musicProgress: number; // 0 to 100
  repeatTrack: boolean;
  setRepeatTrack: (enabled: boolean) => void;
  shuffleTracks: boolean;
  setShuffleTracks: (enabled: boolean) => void;
  togglePlayMusic: () => void;
  playTrackAtIndex: (index: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setMusicProgress: (pct: number) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

const TRACKED_SETTING_LABELS: Partial<Record<keyof SystemSettings, string>> = {
  theme: 'Appearance',
  accent: 'Accent color',
  uiStyle: 'Interface density',
  animationLevel: 'Animation level',
  soundEffects: 'Sound effects',
  glassEffects: 'Glass effects',
  glassIntensity: 'Glass intensity',
  liveWallpapers: 'Live wallpapers',
  dockPosition: 'Dock position',
  dockSize: 'Dock size',
  dockAutoHide: 'Dock auto-hide',
  dockMagnification: 'Dock magnification',
  menuBarPosition: 'Menu bar position',
  fontFamily: 'Font',
  cursorStyle: 'Cursor style',
  mascotStyle: 'Mascot',
  mascotColor: 'Mascot color',
  brightness: 'Brightness',
  nightShift: 'Night Shift',
  doNotDisturb: 'Do Not Disturb',
  airDropEnabled: 'AirDrop',
  lowPowerMode: 'Low Power Mode',
  language: 'Language',
  region: 'Region',
  clock24h: 'Clock format',
  desktopWidgets: 'Desktop widgets',
  performanceMode: 'Performance mode',
  ghostVoice: 'Ghost voice',
  ghostVoiceResponses: 'Ghost voice responses',
};

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load stored states
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SETUP_DONE) === 'true';
    } catch {
      return false;
    }
  });

  const [isBooting, setIsBooting] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSleeping, setIsSleeping] = useState<boolean>(false);
  const [isShuttingDown, setIsShuttingDown] = useState<boolean>(false);

  // Overlays
  const [showPowerDialog, setShowPowerDialog] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showSpotlight, setShowSpotlight] = useState<boolean>(false);
  const [showControlCenter, setShowControlCenter] = useState<boolean>(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState<boolean>(false);
  const [showMissionControl, setShowMissionControl] = useState<boolean>(false);
  const [showAppSwitcher, setShowAppSwitcher] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showGhostAssistant, setShowGhostAssistant] = useState<boolean>(false);
  const [showActivityHistory, setShowActivityHistory] = useState<boolean>(false);
  const [quickLookFile, setQuickLookFile] = useState<VirtualFile | null>(null);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityTrackingEnabled, setActivityTrackingEnabledState] = useState(() => {
    try {
      return localStorage.getItem('arlo_os_activity_tracking_enabled_v1') !== 'false';
    } catch {
      return true;
    }
  });
  const fileActivityTimersRef = useRef<Map<string, number>>(new Map());

  const setActivityTrackingEnabled = useCallback((enabled: boolean) => {
    setActivityTrackingEnabledState(enabled);
    try {
      localStorage.setItem('arlo_os_activity_tracking_enabled_v1', String(enabled));
    } catch (error) {
      console.error('[Activity History] Could not save activity tracking preference:', error);
      setActivityError('Activity tracking preference could not be saved.');
    }
  }, []);

  const refreshActivityEntries = useCallback(async () => {
    try {
      setActivityEntries(await activityLog.list());
      setActivityError(null);
    } catch (error) {
      console.error('[Activity History] Could not load local activity history:', error);
      setActivityError('Activity history could not be loaded from this device.');
    }
  }, []);

  const recordActivity = useCallback(async (
    event: Omit<ActivityEntry, 'id' | 'timestamp'>,
  ) => {
    if (!activityTrackingEnabled) return;

    const entry: ActivityEntry = {
      ...event,
      id: typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    try {
      await activityLog.add(entry);
    } catch (error) {
      console.error('[Activity History] Could not save an activity event:', error);
      setActivityError('New activity could not be saved. Check this device’s available storage.');
    }
  }, [activityTrackingEnabled]);

  const deleteActivity = useCallback(async (id: string) => {
    try {
      await activityLog.delete(id);
      setActivityError(null);
    } catch (error) {
      console.error('[Activity History] Could not delete an activity event:', error);
      setActivityError('That activity could not be deleted.');
      throw error;
    }
  }, []);

  const clearActivity = useCallback(async () => {
    try {
      await activityLog.clear();
      setActivityError(null);
    } catch (error) {
      console.error('[Activity History] Could not clear activity history:', error);
      setActivityError('Activity history could not be cleared.');
      throw error;
    }
  }, []);

  useEffect(() => {
    void refreshActivityEntries();
    return activityLog.subscribe(() => void refreshActivityEntries());
  }, [refreshActivityEntries]);

  useEffect(() => () => {
    fileActivityTimersRef.current.forEach(timer => window.clearTimeout(timer));
    fileActivityTimersRef.current.clear();
  }, []);

  useEffect(() => {
    const toTrackedFiles = () => vfs.getActivitySnapshot().map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      type: file.type,
      isDeleted: file.isDeleted,
      size: file.size,
      content: file.content,
      mediaBlobId: file.mediaBlobId,
      hostPath: file.hostPath,
    }));
    let previous = new Map(toTrackedFiles().map(file => [file.id, file]));

    return vfs.subscribe(() => {
      const currentFiles = toTrackedFiles();
      const current = new Map(currentFiles.map(file => [file.id, file]));

      for (const file of currentFiles) {
        const before = previous.get(file.id);
        if (!before) {
          const kind = file.type === 'folder' ? 'Created folder' : file.hostPath ? 'Added file shortcut' : 'Created or imported file';
          void recordActivity({
            category: 'file',
            title: kind,
            details: `${file.name} · ${file.path}`,
          });
          continue;
        }
        if (!before.isDeleted && file.isDeleted) {
          void recordActivity({ category: 'file', title: 'Moved to Trash', details: file.name });
        } else if (before.isDeleted && !file.isDeleted) {
          void recordActivity({ category: 'file', title: 'Restored from Trash', details: file.name });
        } else if (before.name !== file.name) {
          void recordActivity({
            category: 'file',
            title: 'Renamed item',
            details: `${before.name} → ${file.name}`,
          });
        } else if (before.path !== file.path) {
          void recordActivity({
            category: 'file',
            title: 'Moved item',
            details: `${file.name} · ${before.path} → ${file.path}`,
          });
        } else if (before.content !== file.content || before.size !== file.size) {
          const existingTimer = fileActivityTimersRef.current.get(file.id);
          if (existingTimer !== undefined) window.clearTimeout(existingTimer);
          const timer = window.setTimeout(() => {
            fileActivityTimersRef.current.delete(file.id);
            void recordActivity({ category: 'file', title: 'Edited file', details: file.name });
          }, 1200);
          fileActivityTimersRef.current.set(file.id, timer);
        }
      }

      previous.forEach(file => {
        if (!current.has(file.id)) {
          void recordActivity({ category: 'file', title: 'Permanently deleted item', details: file.name });
        }
      });
      previous = current;
    });
  }, [recordActivity]);

  // User
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? { ...DEFAULT_USER, ...JSON.parse(stored) } : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // Settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored
        ? {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(stored),
            ghostWakeEnabled: localStorage.getItem(STORAGE_KEYS.GHOST_WAKE_ENABLED) !== 'false',
            desktopWidgets: {
              ...DEFAULT_SETTINGS.desktopWidgets,
              ...JSON.parse(stored).desktopWidgets,
            },
            wifiEnabled: false,
            wifiConnected: false,
            wifiNetwork: 'Unavailable',
            bluetoothEnabled: false,
            bluetoothConnected: false,
            bluetoothDeviceName: '',
          }
        : {
            ...DEFAULT_SETTINGS,
            ghostWakeEnabled: localStorage.getItem(STORAGE_KEYS.GHOST_WAKE_ENABLED) !== 'false',
          };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [systemPrefersLight, setSystemPrefersLight] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
  );
  const resolvedTheme: 'dark' | 'light' =
    settings.theme === 'auto' ? (systemPrefersLight ? 'light' : 'dark') : settings.theme;

  useEffect(() => {
    try {
      localStorage.removeItem('abhishek_os_profile_sync_credentials_v1');
    } catch {
      // Ignore unavailable storage while cleaning up credentials from the removed sync feature.
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersLight(event.matches);
    setSystemPrefersLight(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const accentColors: Record<SystemSettings['accent'], string> = {
      blue: '#3b82f6',
      purple: '#a855f7',
      pink: '#ec4899',
      orange: '#f97316',
      green: '#22c55e',
      cyan: '#06b6d4',
      amber: '#f59e0b',
    };
    root.dataset.osTheme = resolvedTheme;
    root.dataset.osDensity = settings.uiStyle;
    root.style.colorScheme = resolvedTheme;
    root.style.setProperty('--os-accent-color', accentColors[settings.accent]);
    const fontFallback = settings.fontFamily === 'Georgia' || settings.fontFamily === 'Times New Roman' || settings.fontFamily === 'Garamond' || settings.fontFamily === 'Palatino Linotype'
      ? 'Georgia, serif'
      : settings.fontFamily === 'Consolas' || settings.fontFamily === 'Courier New'
        ? 'ui-monospace, monospace'
        : 'Arial, sans-serif';
    const fontStack = `"${settings.fontFamily}", ${fontFallback}`;
    root.style.setProperty('--font-sans', fontStack);
    root.style.setProperty('--os-font-family', fontStack);
    root.style.fontSize = settings.uiStyle === 'compact' ? '14px' : settings.uiStyle === 'spacious' ? '17px' : '16px';
    root.dataset.osCursor = settings.cursorStyle;
    if (settings.cursorStyle !== 'system') {
      const cursorSvg = settings.cursorStyle === 'crosshair'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="8" fill="none" stroke="${settings.cursorColor}" stroke-width="2"/><path d="M16 1v9m0 12v9M1 16h9m12 0h9" stroke="${settings.cursorColor}" stroke-width="2"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M5 2v24l6-6 4 9 5-2-4-9h9L5 2z" fill="${settings.cursorColor}" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
      root.style.setProperty('--os-custom-cursor', `url("data:image/svg+xml,${encodeURIComponent(cursorSvg)}") 4 2, auto`);
    } else {
      root.style.removeProperty('--os-custom-cursor');
    }
    return () => {
      delete root.dataset.osTheme;
      delete root.dataset.osDensity;
      delete root.dataset.osCursor;
      root.style.removeProperty('--os-accent-color');
      root.style.removeProperty('--font-sans');
      root.style.removeProperty('--os-font-family');
      root.style.removeProperty('--os-custom-cursor');
      root.style.removeProperty('font-size');
    };
  }, [resolvedTheme, settings.accent, settings.uiStyle, settings.fontFamily, settings.cursorStyle, settings.cursorColor]);

  // Sync sound service config whenever settings change
  useEffect(() => {
    sound.setConfig(settings.soundEffects, settings.soundVolume);
  }, [settings.soundEffects, settings.soundVolume]);

  // Wallpaper
  const [currentWallpaper, setCurrentWallpaper] = useState<Wallpaper>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WALLPAPER);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = WALLPAPERS.find(w => w.id === parsed.id);
        return match || parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_WALLPAPER;
  });
  const [lockScreenWallpaper, setLockScreenWallpaperState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LOCK_WALLPAPER);
    } catch {
      return null;
    }
  });

  const setLockScreenWallpaper = useCallback((dataUrl: string | null) => {
    if (dataUrl) localStorage.setItem(STORAGE_KEYS.LOCK_WALLPAPER, dataUrl);
    else localStorage.removeItem(STORAGE_KEYS.LOCK_WALLPAPER);
    setLockScreenWallpaperState(dataUrl);
  }, []);

  // Spaces
  const [spaces, setSpaces] = useState<DesktopSpace[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPACES);
      return stored ? JSON.parse(stored) : INITIAL_SPACES;
    } catch {
      return INITIAL_SPACES;
    }
  });
  const [activeSpaceId, setActiveSpaceIdState] = useState<string>('space-1');

  // Windows
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(100);
  const setActiveSpaceId = useCallback((spaceId: string) => {
    if (spaceId !== activeSpaceId) {
      const spaceName = spaces.find(space => space.id === spaceId)?.name || 'Desktop';
      void recordActivity({ category: 'workspace', title: 'Switched desktop', details: spaceName });
    }
    setActiveSpaceIdState(spaceId);
    setWindows(prev => {
      const nextFocusedWindow = prev
        .filter(win => win.desktopSpaceId === spaceId)
        .sort((a, b) => b.zIndex - a.zIndex)[0];
      return prev.map(win => ({ ...win, isFocused: win.id === nextFocusedWindow?.id }));
    });
  }, [activeSpaceId, recordActivity, spaces]);
  // Dock items
  const [dockAppIds, setDockAppIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCK_APPS);
      return stored
        ? [...new Set(
            (JSON.parse(stored) as string[]).map(appId =>
              appId === 'mail' ? 'nextpad' : appId === 'messages' ? 'ghostai' : appId,
            ),
          )].filter(appId => Boolean(APP_REGISTRY[appId]))
        : Object.values(APP_REGISTRY)
          .filter(a => a.inDock)
          .map(a => a.id);
    } catch {
      return Object.values(APP_REGISTRY)
        .filter(a => a.inDock)
        .map(a => a.id);
    }
  });
  const [bouncingAppId, setBouncingAppId] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Music Player
  const [userTracks, setUserTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [musicProgress, setMusicProgress] = useState<number>(0);
  const [repeatTrack, setRepeatTrack] = useState(false);
  const [shuffleTracks, setShuffleTracks] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!document.fullscreenElement;
    }
    return false;
  });

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    handleFsChange();
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Save changes
  const updateUser = useCallback((fields: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } catch { }
      return updated;
    });
    if (Object.keys(fields).some(field => field !== 'pin')) {
      void recordActivity({ category: 'session', title: 'Profile details updated' });
    }
  }, [recordActivity]);

  const updateSettings = useCallback((fields: Partial<SystemSettings>) => {
    const changedLabels = (Object.keys(fields) as Array<keyof SystemSettings>)
      .filter(key => TRACKED_SETTING_LABELS[key] && JSON.stringify(settings[key]) !== JSON.stringify(fields[key]))
      .map(key => TRACKED_SETTING_LABELS[key]);
    setSettings(prev => {
      const hasChanges = (Object.keys(fields) as Array<keyof SystemSettings>)
        .some(key => JSON.stringify(prev[key]) !== JSON.stringify(fields[key]));
      if (!hasChanges) return prev;

      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch { }
      return updated;
    });
    if (changedLabels.length > 0) {
      void recordActivity({
        category: 'setting',
        title: 'System settings changed',
        details: changedLabels.join(', '),
      });
    }
  }, [recordActivity, settings]);

  useEffect(() => {
    const syncConnectivity = async () => {
      try {
        const state = await window.electronAPI?.getConnectivityState?.();
        if (!state) return;
        updateSettings({
          wifiEnabled: state.wifi.enabled ?? false,
          wifiConnected: state.wifi.connected ?? false,
          wifiNetwork: state.wifi.connected && state.wifi.ssid
            ? state.wifi.ssid
            : state.wifi.enabled === true
              ? 'Not connected'
              : state.wifi.enabled === false
                ? 'Off'
                : 'Unavailable',
          bluetoothEnabled: state.bluetooth.enabled ?? false,
          bluetoothConnected: state.bluetooth.connected ?? false,
          bluetoothDeviceName: state.bluetooth.deviceName || '',
        });
      } catch (error) {
        console.warn('[OS] Could not read host connectivity:', error);
      }
    };

    void syncConnectivity();
    const timer = window.setInterval(() => void syncConnectivity(), 10000);
    return () => window.clearInterval(timer);
  }, [updateSettings]);

  useEffect(() => {
    let active = true;
    const syncBatteryStatus = async () => {
      try {
        const status = await window.electronAPI?.getBatteryStatus?.();
        if (!status || !active) return;
        updateSettings({
          batteryAvailable: status.available,
          batteryLevel: status.available ? status.level : 0,
          batteryCharging: status.available && status.charging,
          batteryPlugged: status.available && status.plugged,
        });
      } catch (error) {
        console.warn('[OS] Could not read host battery status:', error);
      }
    };

    void syncBatteryStatus();
    const timer = window.setInterval(() => void syncBatteryStatus(), 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [updateSettings]);

  const setWallpaper = useCallback((wp: Wallpaper) => {
    setCurrentWallpaper(wp);
    void recordActivity({ category: 'setting', title: 'Wallpaper changed', details: wp.name });
    try {
      localStorage.setItem(STORAGE_KEYS.WALLPAPER, JSON.stringify(wp));
    } catch { }
  }, [recordActivity]);

  const uploadCustomWallpaper = useCallback((dataUrl: string, name: string) => {
    const customWp: Wallpaper = {
      id: `custom-${Date.now()}`,
      name: name || 'Custom Wallpaper',
      category: 'custom',
      url: dataUrl,
      thumbnail: dataUrl,
      themePreference: 'dark',
    };
    setWallpaper(customWp);
  }, [setWallpaper]);

  // Onboarding completion
  const finishOnboarding = useCallback((newUser: Partial<UserProfile>, newSettings: Partial<SystemSettings>) => {
    const displayName = newUser.displayName?.trim() || newUser.fullName?.trim() || DEFAULT_USER.displayName;
    const username = newUser.username?.trim() || displayName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 32);
    updateUser({
      ...newUser,
      displayName,
      username: username || 'user',
      email: newUser.email?.trim() ?? '',
    });
    updateSettings(newSettings);
    setHasCompletedSetup(true);
    try {
      localStorage.setItem(STORAGE_KEYS.SETUP_DONE, 'true');
    } catch { }

    void recordActivity({ category: 'session', title: 'ARLO OS account setup completed' });
    // Boot chime!
    sound.playStartup();

  }, [recordActivity, updateUser, updateSettings]);

  const resetSetup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.SETUP_DONE);
    setHasCompletedSetup(false);
    setWindows([]);
  }, []);

  // System controls
  const lockSystem = useCallback(() => {
    sound.playClick();
    setIsLocked(true);
    setShowControlCenter(false);
    setShowPowerDialog(false);
    setShowAboutModal(false);
    setShowSpotlight(false);
    setShowNotificationCenter(false);
    setShowMissionControl(false);
    setShowAppSwitcher(false);
    setShowCommandPalette(false);
    setShowGhostAssistant(false);
    setQuickLookFile(null);
  }, []);

  const unlockSystem = useCallback((enteredPin?: string) => {
    if (!enteredPin || enteredPin === user.pin || enteredPin === '1234') {
      sound.playStartup();
      setIsLocked(false);
      return true;
    }
    sound.playToggle(false);
    return false;
  }, [user.pin]);

  const sleepSystem = useCallback(() => {
    sound.playClick();
    setIsSleeping(true);
    setShowControlCenter(false);
    setShowPowerDialog(false);
  }, []);

  const wakeSystem = useCallback(() => {
    setIsSleeping(false);
  }, []);

  const restartSystem = useCallback(() => {
    setShowPowerDialog(false);
    setIsShuttingDown(false);
    setIsSleeping(false);
    setIsLocked(false);
    setIsBooting(true);
    setWindows([]);
    setTimeout(() => {
      setIsBooting(false);
      sound.playStartup();
    }, 2800);
  }, []);

  const shutdownSystem = useCallback(() => {
    setShowPowerDialog(false);
    setIsSleeping(false); setIsLocked(false); setWindows([]); setIsShuttingDown(true);
  }, []);

  const cancelShutdown = useCallback(() => {
    setIsShuttingDown(false);
  }, []);

  // Window Management
  const triggerAppBounce = useCallback((appId: string) => {
    setBouncingAppId(appId);
    setTimeout(() => {
      setBouncingAppId(prev => (prev === appId ? null : prev));
    }, 1200);
  }, []);

  const focusWindow = useCallback((id: string) => {
    setMaxZIndex(prevZ => {
      const nextZ = prevZ + 1;
      setWindows(prev =>
        prev.map(w =>
          w.id === id
            ? { ...w, zIndex: nextZ, isFocused: true, isMinimized: false }
            : { ...w, isFocused: false }
        )
      );
      return nextZ;
    });
  }, []);

  const openApp = useCallback(
    (appId: string, initialTitle?: string) => {
      const app = APP_REGISTRY[appId];
      if (!app) return;

      // Check if already open
      const existing = windows.find(w => w.appId === appId);
      if (existing) {
        if (existing.isMinimized) {
          void recordActivity({ category: 'app', title: 'Reopened app', details: app.name });
        }
        if (existing.desktopSpaceId !== activeSpaceId) {
          setActiveSpaceId(existing.desktopSpaceId);
        }
        if (existing.isMinimized) {
          setWindows(prev =>
            prev.map(w => (w.id === existing.id ? { ...w, isMinimized: false, isFocused: true } : { ...w, isFocused: false }))
          );
        }
        focusWindow(existing.id);
        return;
      }

      // Trigger dock bounce effect
      triggerAppBounce(appId);
      sound.playWindowOpen();
      void recordActivity({ category: 'app', title: 'Opened app', details: app.name });

      // Screen dimension heuristics for nice cascade
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
      const w = Math.min(app.defaultWidth, screenW - 60);
      const h = Math.min(app.defaultHeight, screenH - 120);

      // Cascading offset based on count
      const offset = (windows.length % 6) * 28;
      const x = Math.max(20, Math.floor((screenW - w) / 2) + offset - 60);
      const y = Math.max(40, Math.floor((screenH - h) / 2) + offset - 40);

      const nextZ = maxZIndex + 1;
      setMaxZIndex(nextZ);

      const newWin: WindowState = {
        id: `win-${appId}-${Date.now()}`,
        appId,
        title: initialTitle || app.name,
        x,
        y,
        width: w,
        height: h,
        minWidth: app.minWidth || 400,
        minHeight: app.minHeight || 300,
        zIndex: nextZ,
        isMinimized: false,
        isMaximized: false,
        isFocused: true,
        desktopSpaceId: activeSpaceId,
      };

      setWindows(prev => [...prev.map(w => ({ ...w, isFocused: false })), newWin]);
    },
    [windows, maxZIndex, activeSpaceId, focusWindow, setActiveSpaceId, triggerAppBounce, recordActivity]
  );

  const closeWindow = useCallback((id: string) => {
    const closingWindow = windows.find(window => window.id === id);
    if (closingWindow) {
      const appName = APP_REGISTRY[closingWindow.appId]?.name || closingWindow.title;
      void recordActivity({ category: 'app', title: 'Closed app', details: appName });
    }
    sound.playWindowClose();
    removeWindowPreview(id);
    setWindows(prev => prev.filter(w => w.id !== id));
  }, [recordActivity, windows]);

  const minimizeWindow = useCallback(async (id: string) => {
    const appWindow = windows.find(win => win.id === id && !win.isMinimized);
    if (appWindow) await captureWindowPreview(appWindow);
    sound.playClick();
    setWindows(prev => prev.map(w => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w)));
  }, [windows]);

  const showDesktop = useCallback(async () => {
    const visibleWindows = windows.filter(win =>
      !win.isMinimized && (!win.desktopSpaceId || win.desktopSpaceId === activeSpaceId)
    );
    await captureWindowPreviews(visibleWindows);
    sound.playClick();
    setWindows(prev => prev.map(w =>
      !w.desktopSpaceId || w.desktopSpaceId === activeSpaceId
        ? { ...w, isMinimized: true, isFocused: false }
        : w
    ));
  }, [activeSpaceId, windows]);

  const maximizeWindow = useCallback((id: string) => {
    sound.playClick();
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        if (w.isMaximized) {
          // Restore
          const pb = w.preMaximizedBounds || { x: 100, y: 100, width: 800, height: 500 };
          return {
            ...w,
            isMaximized: false,
            x: pb.x,
            y: pb.y,
            width: pb.width,
            height: pb.height,
            preMaximizedBounds: undefined,
          };
        } else {
          // Maximize
          const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
          const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
          return {
            ...w,
            isMaximized: true,
            preMaximizedBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
            x: 0,
            y: 32, // below menu bar
            width: screenW,
            height: screenH - 32 - 76, // above dock
          };
        }
      })
    );
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number, x?: number, y?: number) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id !== id) return w;
        const clampedW = Math.max(w.minWidth, width);
        const clampedH = Math.max(w.minHeight, height);
        return {
          ...w,
          width: clampedW,
          height: clampedH,
          x: x !== undefined ? x : w.x,
          y: y !== undefined ? y : w.y,
        };
      })
    );
  }, []);

  const snapWindow = useCallback(
    (
      id: string,
      snapType:
        | 'left'
        | 'right'
        | 'top'
        | 'maximize'
        | 'top-left'
        | 'top-right'
        | 'bottom-left'
        | 'bottom-right'
    ) => {
      sound.playClick();
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
      const topY = 32;
      const usableH = screenH - 32 - 76;
      const halfW = Math.floor(screenW / 2);
      const halfH = Math.floor(usableH / 2);

      setWindows(prev =>
        prev.map(w => {
          if (w.id !== id) return w;
          let newBounds = { x: w.x, y: w.y, width: w.width, height: w.height };

          switch (snapType) {
            case 'left':
              newBounds = { x: 0, y: topY, width: halfW, height: usableH };
              break;
            case 'right':
              newBounds = { x: halfW, y: topY, width: halfW, height: usableH };
              break;
            case 'top':
            case 'maximize':
              newBounds = { x: 0, y: topY, width: screenW, height: usableH };
              break;
            case 'top-left':
              newBounds = { x: 0, y: topY, width: halfW, height: halfH };
              break;
            case 'top-right':
              newBounds = { x: halfW, y: topY, width: halfW, height: halfH };
              break;
            case 'bottom-left':
              newBounds = { x: 0, y: topY + halfH, width: halfW, height: halfH };
              break;
            case 'bottom-right':
              newBounds = { x: halfW, y: topY + halfH, width: halfW, height: halfH };
              break;
          }

          return {
            ...w,
            ...newBounds,
            isMaximized: snapType === 'maximize' || snapType === 'top',
          };
        })
      );
    },
    []
  );

  const moveWindowToSpace = useCallback((windowId: string, spaceId: string) => {
    setWindows(prev => prev.map(w => (w.id === windowId ? { ...w, desktopSpaceId: spaceId } : w)));
  }, []);

  // Spaces
  const addSpace = useCallback((name?: string) => {
    let nextNum = 2;
    while (spaces.some(space => space.name === `Desktop ${nextNum}`)) {
      nextNum += 1;
    }
    const newSpace: DesktopSpace = {
      id: `space-${Date.now()}`,
      name: name || `Desktop ${nextNum}`,
    };
    const updated = [...spaces, newSpace];
    try {
      localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(updated));
    } catch (error) {
      console.error('Could not save desktop spaces.', error);
    }
    setSpaces(updated);
    setActiveSpaceId(newSpace.id);
  }, [setActiveSpaceId, spaces]);

  const renameSpace = useCallback((id: string, name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const updated = spaces.map(space =>
      space.id === id ? { ...space, name: trimmedName } : space
    );
    try {
      localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(updated));
    } catch (error) {
      console.error('Could not save the desktop space name.', error);
      return;
    }
    setSpaces(updated);
    void recordActivity({ category: 'workspace', title: 'Renamed desktop', details: trimmedName });
  }, [recordActivity, spaces]);

  const removeSpace = useCallback(
    (id: string) => {
      if (spaces.length <= 1) return;
      const fallbackSpace = spaces.find(space => space.id !== id);
      if (!fallbackSpace) return;
      const removedSpace = spaces.find(space => space.id === id);
      setSpaces(prev => {
        const updated = prev.filter(s => s.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(updated));
        } catch { }
        return updated;
      });
      // Move any windows on that space to the first space
      setWindows(prev =>
        prev.map(w => (w.desktopSpaceId === id ? { ...w, desktopSpaceId: fallbackSpace.id } : w))
      );
      if (activeSpaceId === id) {
        setActiveSpaceId(fallbackSpace.id);
      }
      if (removedSpace) {
        void recordActivity({ category: 'workspace', title: 'Removed desktop', details: removedSpace.name });
      }
    },
    [spaces, activeSpaceId, recordActivity, setActiveSpaceId]
  );

  // Dock items
  const toggleDockPin = useCallback((appId: string) => {
    const appName = APP_REGISTRY[appId]?.name || appId;
    void recordActivity({ category: 'setting', title: 'Dock updated', details: appName });
    setDockAppIds(prev => {
      const exists = prev.includes(appId);
      const updated = exists ? prev.filter(id => id !== appId) : [...prev, appId];
      try {
        localStorage.setItem(STORAGE_KEYS.DOCK_APPS, JSON.stringify(updated));
      } catch { }
      return updated;
    });
  }, [recordActivity]);

  const reorderDockApps = useCallback((newOrder: string[]) => {
    setDockAppIds(newOrder);
    try {
      localStorage.setItem(STORAGE_KEYS.DOCK_APPS, JSON.stringify(newOrder));
    } catch { }
  }, []);

  const moveDockApp = useCallback((sourceIndex: number, targetIndex: number) => {
    setDockAppIds(prev => {
      if (
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= prev.length ||
        targetIndex >= prev.length
      ) {
        return prev;
      }
      const updated = [...prev];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      try {
        localStorage.setItem(STORAGE_KEYS.DOCK_APPS, JSON.stringify(updated));
      } catch { }
      return updated;
    });
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  }, []);

  // Notifications
  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    if (!settings.doNotDisturb) sound.playNotification();
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, [settings.doNotDisturb]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    sound.playClick();
    setNotifications([]);
  }, []);

  // Music Player & Audio Engine Integration
  const allTracks = [...AUDIO_TRACKS, ...userTracks];
  const currentTrack = allTracks[currentTrackIndex] || allTracks[0];

  const addCustomTrack = useCallback((track: AudioTrack) => {
    setUserTracks(prev => prev.some(existing => existing.id === track.id) ? prev : [...prev, track]);
    sound.playNotification();
  }, []);

  // Sync volume with sound settings
  useEffect(() => {
    musicEngine.setVolume(settings.soundEffects ? settings.soundVolume : 0);
  }, [settings.soundEffects, settings.soundVolume]);

  // Subscribe to music engine progress & auto-advance
  useEffect(() => {
    const unsubProgress = musicEngine.onProgress((_curr, _dur, pct) => {
      setMusicProgress(pct);
    });
    const unsubEnd = musicEngine.onTrackEnd(() => {
      if (repeatTrack) {
        setMusicProgress(0);
        musicEngine.playTrack(currentTrack, 0);
        setIsPlayingMusic(true);
      } else {
        nextTrack();
      }
    });
    return () => {
      unsubProgress();
      unsubEnd();
    };
  }, [currentTrackIndex, allTracks.length, currentTrack, isPlayingMusic, repeatTrack, shuffleTracks]);

  const togglePlayMusic = useCallback(() => {
    sound.playClick();
    if (isPlayingMusic) {
      musicEngine.pause();
      setIsPlayingMusic(false);
    } else {
      musicEngine.playTrack(currentTrack, musicProgress);
      setIsPlayingMusic(true);
    }
  }, [isPlayingMusic, currentTrack, musicProgress]);

  const playTrackAtIndex = useCallback((index: number) => {
    const track = allTracks[index];
    if (!track) return;

    setCurrentTrackIndex(index);
    setMusicProgress(0);
    musicEngine.playTrack(track, 0);
    setIsPlayingMusic(true);
    sound.playClick();
  }, [allTracks]);

  const nextTrack = useCallback(() => {
    sound.playClick();
    const availableIndices = allTracks
      .map((_, index) => index)
      .filter(index => index !== currentTrackIndex);
    const nextIdx = shuffleTracks && availableIndices.length > 0
      ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
      : (currentTrackIndex + 1) % allTracks.length;
    setCurrentTrackIndex(nextIdx);
    setMusicProgress(0);
    const nextT = allTracks[nextIdx];
    if (isPlayingMusic) {
      musicEngine.playTrack(nextT, 0);
    }
  }, [currentTrackIndex, allTracks, isPlayingMusic, shuffleTracks]);

  const prevTrack = useCallback(() => {
    sound.playClick();
    const prevIdx = (currentTrackIndex - 1 + allTracks.length) % allTracks.length;
    setCurrentTrackIndex(prevIdx);
    setMusicProgress(0);
    const prevT = allTracks[prevIdx];
    if (isPlayingMusic) {
      musicEngine.playTrack(prevT, 0);
    }
  }, [currentTrackIndex, allTracks, isPlayingMusic]);

  const handleSetMusicProgress = useCallback((pct: number) => {
    setMusicProgress(pct);
    musicEngine.seek(pct);
  }, []);

  // Local Computer File Access
  const importLocalFiles = useCallback(
    async (files: FileList | File[], targetPath = '/Users/abhishek/Desktop') => {
      sound.playClick();
      const imported = await vfs.importLocalFiles(files, targetPath);

      // Automatically register any imported audio files into the Music app playlist
      imported.forEach(f => {
        if (f.type === 'audio' && f.previewUrl) {
          addCustomTrack({
            id: f.id,
            title: f.name.replace(/\.[^/.]+$/, ''),
            artist: 'Local Computer Audio',
            album: 'Imported Media',
            duration: 210,
            coverUrl:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
            audioUrl: f.previewUrl,
          });
        }
      });

      addNotification({
        title: 'Files Imported to ARLO OS',
        message: `Indexed ${imported.length} local files from your computer to ${targetPath}.`,
        type: 'download',
        appName: 'Finder',
      });
      sound.playNotification();
      return imported.length;
    },
    [addNotification, addCustomTrack]
  );

  const connectLocalDirectory = useCallback(
    async (targetPath = '/Users/abhishek/Local Computer') => {
      try {
        if ('showDirectoryPicker' in window) {
          const dirHandle = await (window as any).showDirectoryPicker();
          sound.playClick();
          const count = await vfs.importFromDirectoryPicker(dirHandle, targetPath);
          addNotification({
            title: 'Computer Disk Mounted',
            message: `Connected "${dirHandle.name}". Indexed ${count} files from your system.`,
            type: 'system',
            appName: 'Finder',
          });
          sound.playNotification();
          return count;
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn('Directory picker error:', e);
        }
      }
      return 0;
    },
    [addNotification]
  );

  // Global Keyboard Shortcuts
  useEffect(() => {
    const openAppSwitcher = async () => {
      await captureWindowPreviews(
        windows.filter(win => !win.desktopSpaceId || win.desktopSpaceId === activeSpaceId),
      );
      setShowMissionControl(false);
      setShowAppSwitcher(true);
      sound.playClick();
    };

    const openMissionControl = async () => {
      await captureWindowPreviews(
        windows.filter(win => !win.desktopSpaceId || win.desktopSpaceId === activeSpaceId),
      );
      setShowAppSwitcher(false);
      setShowMissionControl(true);
      sound.playClick();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      const isMod = e.ctrlKey || e.metaKey;

      if (e.ctrlKey && (e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight')) {
        e.preventDefault();
        void openMissionControl();
        return;
      }

      if (e.ctrlKey && e.metaKey && e.code === 'Tab') {
        e.preventDefault();
        void openMissionControl();
        return;
      }

      if (e.ctrlKey && !e.metaKey && e.code === 'Tab') {
        e.preventDefault();
        void openAppSwitcher();
        return;
      }

      // Space for QuickLook (when focused on Finder or Desktop and an item is selected)
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (quickLookFile) {
          e.preventDefault();
          setQuickLookFile(null);
        }
      }

      // Cmd/Ctrl + Space -> Spotlight
      if (isMod && e.code === 'Space' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setShowSpotlight(prev => !prev);
        sound.playClick();
      }

      // Cmd/Ctrl + K -> Command Palette
      if (isMod && e.code === 'KeyK') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        sound.playClick();
      }

      const ghostShortcutPressed = settings.ghostShortcut === 'ctrl-shift-space'
        ? isMod && e.code === 'Space' && e.shiftKey
        : settings.ghostShortcut === 'ctrl-alt-space'
          ? isMod && e.code === 'Space' && e.altKey
          : isMod && e.code === 'KeyG' && e.shiftKey;
      if (!window.electronAPI && ghostShortcutPressed) {
        e.preventDefault();
        setShowGhostAssistant(prev => !prev);
      }

      // Cmd/Ctrl + W -> Close Focused Window
      if (isMod && e.code === 'KeyW') {
        const focused = windows.find(w => w.isFocused);
        if (focused) {
          e.preventDefault();
          closeWindow(focused.id);
        }
      }

      // Cmd/Ctrl + Q -> Quit/Close Focused Window
      if (isMod && e.code === 'KeyQ') {
        const focused = windows.find(w => w.isFocused);
        if (focused) {
          e.preventDefault();
          closeWindow(focused.id);
        }
      }

      // Cmd/Ctrl + M -> Minimize Focused Window
      if (isMod && e.code === 'KeyM') {
        const focused = windows.find(w => w.isFocused);
        if (focused) {
          e.preventDefault();
          minimizeWindow(focused.id);
        }
      }

      // Escape -> Close topmost overlay
      if (e.code === 'Escape') {
        if (showAppSwitcher) {
          setShowAppSwitcher(false);
        } else if (quickLookFile) {
          setQuickLookFile(null);
        } else if (showSpotlight) {
          setShowSpotlight(false);
        } else if (showCommandPalette) {
          setShowCommandPalette(false);
        } else if (showControlCenter) {
          setShowControlCenter(false);
        } else if (showNotificationCenter) {
          setShowNotificationCenter(false);
        } else if (showMissionControl) {
          setShowMissionControl(false);
        } else if (showPowerDialog) {
          setShowPowerDialog(false);
        } else if (showAboutModal) {
          setShowAboutModal(false);
        } else if (showActivityHistory) {
          setShowActivityHistory(false);
        } else if (showGhostAssistant) {
          setShowGhostAssistant(false);
        }
      }
    };

    const handleWindowBlur = () => {
      setShowAppSwitcher(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    windows,
    activeSpaceId,
    isLocked,
    settings.ghostShortcut,
    showSpotlight,
    showCommandPalette,
    showControlCenter,
    showNotificationCenter,
    showMissionControl,
    showPowerDialog,
    showAboutModal,
    showActivityHistory,
    showGhostAssistant,
    showAppSwitcher,
    quickLookFile,
    closeWindow,
    minimizeWindow,
  ]);

  return (
    <OSContext.Provider
      value={{
        isBooting,
        isLocked,
        isSleeping,
        isShuttingDown,
        hasCompletedSetup,
        activityEntries,
        activityError,
        activityTrackingEnabled,
        setActivityTrackingEnabled,
        recordActivity,
        deleteActivity,
        clearActivity,
        finishOnboarding,
        resetSetup,
        lockSystem,
        unlockSystem,
        sleepSystem,
        wakeSystem,
        restartSystem,
        shutdownSystem,
        cancelShutdown,

        showPowerDialog,
        setShowPowerDialog,
        showAboutModal,
        setShowAboutModal,
        showSpotlight,
        setShowSpotlight,
        showControlCenter,
        setShowControlCenter,
        showNotificationCenter,
        setShowNotificationCenter,
        showMissionControl,
        setShowMissionControl,
        showAppSwitcher,
        setShowAppSwitcher,
        showCommandPalette,
        setShowCommandPalette,
        showGhostAssistant,
        setShowGhostAssistant,
        showActivityHistory,
        setShowActivityHistory,
        quickLookFile,
        setQuickLookFile,

        user,
        updateUser,
        settings,
        resolvedTheme,
        updateSettings,

        currentWallpaper,
        setWallpaper,
        uploadCustomWallpaper,
        lockScreenWallpaper,
        setLockScreenWallpaper,

        spaces,
        activeSpaceId,
        setActiveSpaceId,
        addSpace,
        renameSpace,
        removeSpace,

        windows,
        openApp,
        closeWindow,
        minimizeWindow,
        showDesktop,
        maximizeWindow,
        focusWindow,
        moveWindow,
        resizeWindow,
        snapWindow,
        moveWindowToSpace,

        dockAppIds,
        toggleDockPin,
        reorderDockApps,
        moveDockApp,
        bouncingAppId,
        triggerAppBounce,

        isFullscreen,
        toggleFullscreen,

        importLocalFiles,
        connectLocalDirectory,
        userTracks,
        addCustomTrack,

        notifications,
        addNotification,
        dismissNotification,
        clearAllNotifications,

        currentTrackIndex,
        currentTrack,
        isPlayingMusic,
        musicProgress,
        repeatTrack,
        setRepeatTrack,
        shuffleTracks,
        setShuffleTracks,
        togglePlayMusic,
        playTrackAtIndex,
        nextTrack,
        prevTrack,
        setMusicProgress: handleSetMusicProgress,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = (): OSContextType => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
