export type ThemeMode = 'dark' | 'light' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'cyan' | 'amber';
export type UIStyle = 'balanced' | 'compact' | 'spacious';
export type AnimationLevel = 'full' | 'reduced' | 'minimal';
export type DockPosition = 'bottom' | 'left' | 'right';
export type DockSize = 'small' | 'medium' | 'large';

export interface UserProfile {
  fullName: string;
  displayName: string;
  username: string;
  email: string;
  avatarUrl: string;
  avatarType: 'preset' | 'upload' | 'initials';
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
  name: string;
  path: string;
  size: number;
  type: 'folder' | 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'app';
  extension?: string;
  content?: string;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  isDeleted?: boolean;
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
  uiStyle: UIStyle;
  animationLevel: AnimationLevel;
  soundEffects: boolean;
  soundVolume: number;
  glassEffects: boolean;
  glassIntensity: number; // 0.2 to 1
  liveWallpapers: boolean;
  dockPosition: DockPosition;
  dockSize: DockSize;
  dockAutoHide: boolean;
  dockMagnification: boolean;
  brightness: number; // 20 to 100
  nightShift: boolean;
  wifiEnabled: boolean;
  wifiConnected: boolean;
  wifiNetwork: string;
  bluetoothEnabled: boolean;
  bluetoothConnected: boolean;
  doNotDisturb: boolean;
  airDropEnabled: boolean;
  batteryLevel: number;
  batteryCharging: boolean;
  language: string;
  region: string;
  clock24h: boolean;
  developerMode: boolean;
  performanceMode: 'balanced' | 'quality' | 'batterySaver';
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl: string;
  synthesizerPreset?: 'ambient' | 'chillhop' | 'synthwave' | 'classical';
  audioUrl?: string;
}
