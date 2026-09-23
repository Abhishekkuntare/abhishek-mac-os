import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { vfs } from '../services/virtualFileSystem';
import { musicEngine } from '../services/musicEngine';

const STORAGE_KEYS = {
  USER: 'abhishek_os_user_v1',
  SETTINGS: 'abhishek_os_settings_v1',
  WALLPAPER: 'abhishek_os_wallpaper_v1',
  SETUP_DONE: 'abhishek_os_setup_completed_v1',
  SPACES: 'abhishek_os_spaces_v1',
  DOCK_APPS: 'abhishek_os_dock_apps_v1',
};

const DEFAULT_USER: UserProfile = {
  fullName: 'Abhishek Kuntare',
  displayName: 'Abhishek',
  username: 'abhishek',
  email: 'abhishekkuntare02@gmail.com',
  avatarUrl: '',
  avatarType: 'initials',
  roles: ['Developer', 'Designer', 'Creator'],
  bio: 'Architecting Abhishek OS — a desktop experience built for you.',
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
  brightness: 100,
  nightShift: false,
  wifiEnabled: true,
  wifiConnected: true,
  wifiNetwork: 'Abhishek-HyperFiber-5G',
  bluetoothEnabled: true,
  bluetoothConnected: true,
  doNotDisturb: false,
  airDropEnabled: true,
  batteryLevel: 94,
  batteryCharging: true,
  language: 'English',
  region: 'India',
  clock24h: false,
  developerMode: false,
  performanceMode: 'balanced',
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
    title: 'Abhishek OS 1.0 Ready',
    message: 'Welcome to your tailored desktop environment. All native applications loaded.',
    appName: 'System',
    timestamp: 'Just now',
    read: false,
    type: 'system',
  },
  {
    id: 'notif-2',
    title: 'Velosa Studio Message',
    message: 'Simon Pickford: Super happy to lock this rough cut for our color session!',
    appId: 'messages',
    appName: 'Messages',
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
  showCommandPalette: boolean;
  setShowCommandPalette: (open: boolean) => void;
  quickLookFile: VirtualFile | null;
  setQuickLookFile: (file: VirtualFile | null) => void;

  // User & Settings
  user: UserProfile;
  updateUser: (fields: Partial<UserProfile>) => void;
  settings: SystemSettings;
  updateSettings: (fields: Partial<SystemSettings>) => void;

  // Wallpaper
  currentWallpaper: Wallpaper;
  setWallpaper: (wp: Wallpaper) => void;
  uploadCustomWallpaper: (dataUrl: string, name: string) => void;

  // Spaces
  spaces: DesktopSpace[];
  activeSpaceId: string;
  setActiveSpaceId: (id: string) => void;
  addSpace: (name?: string) => void;
  removeSpace: (id: string) => void;

  // Window Management
  windows: WindowState[];
  openApp: (appId: string, initialTitle?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
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
  togglePlayMusic: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setMusicProgress: (pct: number) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

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
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [quickLookFile, setQuickLookFile] = useState<VirtualFile | null>(null);

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
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

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

  // Spaces
  const [spaces, setSpaces] = useState<DesktopSpace[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SPACES);
      return stored ? JSON.parse(stored) : INITIAL_SPACES;
    } catch {
      return INITIAL_SPACES;
    }
  });
  const [activeSpaceId, setActiveSpaceId] = useState<string>('space-1');

  // Windows
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(100);

  // Dock items
  const [dockAppIds, setDockAppIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DOCK_APPS);
      return stored
        ? JSON.parse(stored)
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
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Save changes
  const updateUser = useCallback((fields: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const updateSettings = useCallback((fields: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...fields };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const setWallpaper = useCallback((wp: Wallpaper) => {
    setCurrentWallpaper(wp);
    try {
      localStorage.setItem(STORAGE_KEYS.WALLPAPER, JSON.stringify(wp));
    } catch {}
  }, []);

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
    updateUser(newUser);
    updateSettings(newSettings);
    setHasCompletedSetup(true);
    try {
      localStorage.setItem(STORAGE_KEYS.SETUP_DONE, 'true');
    } catch {}

    // Boot chime!
    sound.playStartup();

    // Default open Finder window for immediate delight!
    setTimeout(() => {
      openApp('finder');
    }, 600);
  }, [updateUser, updateSettings]);

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
    setIsBooting(true);
    setWindows([]);
    setTimeout(() => {
      setIsBooting(false);
      sound.playStartup();
    }, 2800);
  }, []);

  const shutdownSystem = useCallback(() => {
    setIsShuttingDown(true);
    setShowPowerDialog(false);
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
    [windows, maxZIndex, activeSpaceId, focusWindow, triggerAppBounce]
  );

  const closeWindow = useCallback((id: string) => {
    sound.playWindowClose();
    setWindows(prev => prev.filter(w => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    sound.playClick();
    setWindows(prev => prev.map(w => (w.id === id ? { ...w, isMinimized: true, isFocused: false } : w)));
  }, []);

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
    setSpaces(prev => {
      const nextNum = prev.length + 1;
      const newSpace: DesktopSpace = {
        id: `space-${Date.now()}`,
        name: name || `Desktop ${nextNum}`,
      };
      const updated = [...prev, newSpace];
      try {
        localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const removeSpace = useCallback(
    (id: string) => {
      if (spaces.length <= 1) return;
      setSpaces(prev => {
        const updated = prev.filter(s => s.id !== id);
        try {
          localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      // Move any windows on that space to the first space
      setWindows(prev =>
        prev.map(w => (w.desktopSpaceId === id ? { ...w, desktopSpaceId: spaces[0].id } : w))
      );
      if (activeSpaceId === id) {
        setActiveSpaceId(spaces[0].id);
      }
    },
    [spaces, activeSpaceId]
  );

  // Dock items
  const toggleDockPin = useCallback((appId: string) => {
    setDockAppIds(prev => {
      const exists = prev.includes(appId);
      const updated = exists ? prev.filter(id => id !== appId) : [...prev, appId];
      try {
        localStorage.setItem(STORAGE_KEYS.DOCK_APPS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const reorderDockApps = useCallback((newOrder: string[]) => {
    setDockAppIds(newOrder);
    try {
      localStorage.setItem(STORAGE_KEYS.DOCK_APPS, JSON.stringify(newOrder));
    } catch {}
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
      } catch {}
      return updated;
    });
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Notifications
  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    sound.playNotification();
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

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
    setUserTracks(prev => [track, ...prev]);
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
      nextTrack();
    });
    return () => {
      unsubProgress();
      unsubEnd();
    };
  }, [currentTrackIndex, allTracks.length]);

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

  const nextTrack = useCallback(() => {
    sound.playClick();
    const nextIdx = (currentTrackIndex + 1) % allTracks.length;
    setCurrentTrackIndex(nextIdx);
    setMusicProgress(0);
    const nextT = allTracks[nextIdx];
    if (isPlayingMusic) {
      musicEngine.playTrack(nextT, 0);
    }
  }, [currentTrackIndex, allTracks, isPlayingMusic]);

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
        title: 'Files Imported to Abhishek OS',
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Space for QuickLook (when focused on Finder or Desktop and an item is selected)
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (quickLookFile) {
          e.preventDefault();
          setQuickLookFile(null);
        }
      }

      // Cmd/Ctrl + Space -> Spotlight
      if (isMod && e.code === 'Space') {
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

      // Cmd/Ctrl + Up -> Mission Control
      if (isMod && e.code === 'ArrowUp') {
        e.preventDefault();
        setShowMissionControl(prev => !prev);
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
        if (quickLookFile) {
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    windows,
    showSpotlight,
    showCommandPalette,
    showControlCenter,
    showNotificationCenter,
    showMissionControl,
    showPowerDialog,
    showAboutModal,
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
        showCommandPalette,
        setShowCommandPalette,
        quickLookFile,
        setQuickLookFile,

        user,
        updateUser,
        settings,
        updateSettings,

        currentWallpaper,
        setWallpaper,
        uploadCustomWallpaper,

        spaces,
        activeSpaceId,
        setActiveSpaceId,
        addSpace,
        removeSpace,

        windows,
        openApp,
        closeWindow,
        minimizeWindow,
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
        togglePlayMusic,
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
