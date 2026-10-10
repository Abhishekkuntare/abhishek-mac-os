export type ThemeMode = 'dark' | 'light' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'cyan' | 'amber';
export type UIStyle = 'balanced' | 'compact' | 'spacious';
export type AnimationLevel = 'full' | 'reduced' | 'minimal';
export type DockPosition = 'top' | 'bottom' | 'left' | 'right';
export type DockSize = 'small' | 'medium' | 'large';
export type CursorStyle = 'system' | 'arrow' | 'crosshair';
export type BatteryIconStyle = 'classic' | 'rounded' | 'square' | 'circle';
export type GhostShortcut = 'ctrl-shift-space' | 'ctrl-alt-space' | 'ctrl-shift-g';
export type NotificationStyle = 'glass' | 'midnight' | 'aurora';
export type NotchMusicArtworkShape = 'rounded' | 'square' | 'circle';
export type JellyNotchAnimation =
  | 'spring'
  | 'fade'
  | 'bounce'
  | 'slide'
  | 'zoom'
  | 'flip'
  | 'elastic'
  | 'pop'
  | 'swoop'
  | 'gentle';

export interface UserProfile {
  fullName: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string;
  avatarType: 'preset' | 'upload' | 'initials';
  avatarPreset?: string;
  roles: string[];
  bio: string;
  pin: string;
}

export interface Wallpaper {
  id: string;
  name: string;
  category: 'abstract' | 'nature' | 'city' | 'minimal' | 'abhishek' | 'custom';
  url: string;
  thumbnail: string;
  isLive?: boolean;
  liveType?: 'aurora' | 'particles' | 'gradient' | 'stars' | 'mesh';
  liveVideoId?: string;
  themePreference?: 'dark' | 'light';
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  desktopSpaceId: string;
  preMaximizedBounds?: { x: number; y: number; width: number; height: number };
}

export type WindowSnapType =
  | 'left'
  | 'right'
  | 'top'
  | 'maximize'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'left-third'
  | 'center-third'
  | 'right-third';

export interface AppMetadata {
  id: string;
  name: string;
  category: 'productivity' | 'development' | 'system' | 'media' | 'utility';
  description: string;
  iconName: string; // Lucide icon name or custom identifier
  iconColor: string;
  iconBg: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
  inDock: boolean;
  installed: boolean;
  version: string;
}

export interface DesktopSpace {
  id: string;
  name: string;
  wallpaperId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  appId?: string;
  appName?: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  type: 'system' | 'message' | 'calendar' | 'download' | 'update';
}

export interface VirtualFile {
  id: string;
  hostPath?: string;
  name: string;
  path: string;
  size: number;
  type: 'folder' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'app';
  extension?: string;
  content?: string;
  previewUrl?: string;
  mediaBlobId?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
  trashGroupId?: string;
  waveform?: number[];
}

export interface DesktopIcon {
  id: string;
  title: string;
  type: 'file' | 'folder' | 'app';
  targetId: string;
  x: number;
  y: number;
}

export interface SystemSettings {
  theme: ThemeMode;
  accent: AccentColor;
  jellyNotchEnabled: boolean;
  jellyNotchDashboard: boolean;
  jellyNotchAnimation: JellyNotchAnimation;
  jellyNotchShape: JellyNotchShape;
  jellyNotchWidth: number;
  jellyNotchHeight: number;
  jellyNotchStyle: JellyNotchStyle;
  jellyNotchOpacity: number;
  jellyNotchBlur: number;
  notchMusicHoverControls: boolean;
  notchMusicVisualizer: NotchMusicVisualizer;
  notchMusicArtworkShape: NotchMusicArtworkShape;
  jamendoClientId: string;
  jellyNotchWidgets: {
    fileTray: boolean;
    music: boolean;
    calendar: boolean;
    notifications: boolean;
    timer: boolean;
    pomodoro: boolean;
    health: boolean;
    stopwatch: boolean;
    todos: boolean;
    notes: boolean;
    screenTime: boolean;
    lowBattery: boolean;
    translation: boolean;
    windowSnap: boolean;
    clipboard: boolean;
    deviceActivity: boolean;
    weather: boolean;
    workspaces: boolean;
    systemStatus: boolean;
    camera: boolean;
    dayProgress: boolean;
    ghostAI: boolean;
  };
  dayProgress: {
    sources: {
      calendar: boolean;
      reminders: boolean;
      tasks: boolean;
    };
    bedtimeMarkerEnabled: boolean;
    bedtimeTime: string;
    showSummaryColumn: boolean;
  };
  health: {
    waterGoalGlasses: number;
    breakGoal: number;
    mindfulGoalMinutes: number;
    breakIntervalMinutes: number;
    movementBreakMinutes: number;
    breathingPattern: 'box' | 'calm';
    windDownEnabled: boolean;
    windDownTime: string;
    hearingWarningsEnabled: boolean;
    hearingWarningThresholdPercent: number;
    eyeBreakRemindersEnabled: boolean;
    eyeBreakIntervalMinutes: number;
    eyeBreakDurationSeconds: number;
  };
  uiStyle: UIStyle;
  animationLevel: AnimationLevel;
  soundEffects: boolean;
  soundVolume: number;
  glassEffects: boolean;
  glassIntensity: number; // 0.2 to 1
  liveWallpapers: boolean;
  liveWallpaperAudio: boolean;
  dockPosition: DockPosition;
  dockSize: DockSize;
  dockAutoHide: boolean;
  dockMagnification: boolean;
  menuBarPosition: DockPosition;
  fontFamily: string;
  cursorStyle: CursorStyle;
  cursorColor: string;
  mascotStyle: number;
  mascotColor: string;
  brightness: number; // 20 to 100
  nightShift: boolean;
  wifiEnabled: boolean;
  wifiConnected: boolean;
  wifiNetwork: string;
  bluetoothEnabled: boolean;
  bluetoothConnected: boolean;
  bluetoothDeviceName: string;
  doNotDisturb: boolean;
  notificationStyle: NotificationStyle;
  airDropEnabled: boolean;
  batteryLevel: number;
  batteryCharging: boolean;
  batteryPlugged: boolean;
  batteryAvailable: boolean;
  batteryIconStyle: BatteryIconStyle;
  lowPowerMode: boolean;
  language: string;
  region: string;
  clock24h: boolean;
  desktopWidgets: {
    weather: boolean;
    music: boolean;
    system: boolean;
    clock: boolean;
  };
  developerMode: boolean;
  performanceMode: 'balanced' | 'quality' | 'batterySaver';
  ghostShortcut: GhostShortcut;
  ghostWakeEnabled: boolean;
  ghostVoiceResponses: boolean;
  ghostVoice: 'lily';
}

export type JellyNotchWidget = keyof SystemSettings['jellyNotchWidgets'];

export type JellyNotchShape =
  | 'capsule'
  | 'rounded'
  | 'square'
  | 'circle'
  | 'oval'
  | 'superellipse'
  | 'compact'
  | 'wide'
  | 'orb'
  | 'split'
  | 'double'
  | 'custom';

export type JellyNotchStyle = 'glass' | 'solid' | 'transparent' | 'aurora';
export type NotchMusicVisualizer = 'bars' | 'spectrum';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl: string;
  synthesizerPreset?: 'ambient' | 'chillhop' | 'synthwave' | 'classical';
  audioUrl?: string;
  sourceUrl?: string;
  licenseUrl?: string;
}
