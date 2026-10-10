import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Activity,
  Battery,
  Bell,
  Bluetooth,
  Bot,
  Camera,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Coffee,
  Copy,
  Cloud,
  CloudRain,
  CloudSun,
  Circle,
  Droplets,
  Eye,
  ExternalLink,
  File as FileIcon,
  FileArchive,
  FileImage,
  FileText,
  Footprints,
  Folder,
  FolderOpen,
  Gamepad2,
  HardDrive,
  Heart,
  Headphones,
  Images,
  Languages,
  Layers,
  LoaderCircle,
  ListTodo,
  Maximize2,
  Minimize2,
  Move,
  Music2,
  Monitor,
  Minus,
  Pause,
  Play,
  PlugZap,
  Plus,
  RotateCcw,
  Repeat2,
  Settings,
  Settings2,
  Send,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Smartphone,
  Timer,
  Usb,
  Volume2,
  VolumeX,
  Wifi,
  Video,
  Wind,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useDragControls, useReducedMotion, type Transition } from 'motion/react';

import { useOS } from '../../context/OSContext';
import type { JellyNotchAnimation, JellyNotchShape, JellyNotchStyle, JellyNotchWidget, NotchMusicArtworkShape, VirtualFile } from '../../types/desktop';
import { fetchWeather, getWeatherVisual, searchLocations, WEATHER_LOCATION_STORAGE_KEY, WEATHER_LOCATION_UPDATED_EVENT, type WeatherData } from '../../services/weatherService';
import { vfs } from '../../services/virtualFileSystem';
import { APP_REGISTRY } from '../../data/defaultApps';
import { addPhotoToLibrary, addVideoToLibrary } from '../../services/photoLibrary';
import { AppIcon } from './AppIcon';
import { sound } from '../../services/soundService';
import { musicEngine } from '../../services/musicEngine';
import { runGhostChat } from '../../services/ghostChatClient';
import { routeGhostRequest } from '../../services/ghostOrchestrator';
import {
  createGhostDesktopItem,
  deleteGhostDesktopItem,
  getGhostLocalTime,
  renameGhostDesktopItem,
  searchGhostAuthorizedFiles,
} from '../../services/ghostDesktopActions';
import { GhostChatError } from '../../types/ghostAgent';
import type { GhostMessage, GhostToolHost } from '../../types/ghostAgent';
import { GHOST_CHAT_STORAGE_KEY, GHOST_CHAT_UPDATED_EVENT } from '../../services/ghostChatHistory';
import { NOTES_UPDATED_EVENT } from '../../services/notesService';
import {
  pauseStopwatch,
  resetStopwatch,
  startStopwatch,
  useStopwatch,
} from '../../services/stopwatch';
import {
  NOTCH_CAMERA_CAPTURE_REQUEST_EVENT,
  type NotchCameraCaptureKind,
  type NotchCameraCaptureRequest,
} from '../../services/notchCameraBridge';
import {
  calculateHealthStreak,
  getHealthDateKey,
  getHealthDay,
  readHealthHistory,
  saveHealthHistory,
  type HealthDay,
  type HealthHistory,
} from '../../services/healthService';
import {
  OPEN_POMODORO_EVENT,
  POMODORO_STORAGE_KEY,
  savePomodoroState,
  type PomodoroPhase,
} from '../../services/pomodoroService';
import {
  DAY_PROGRESS_TASKS_KEY,
  notifyDayProgressUpdated,
} from '../../services/dayProgressService';
import { DayProgressPanel } from './DayProgressPanel';
import { DetectiveAvatar } from './DetectiveAvatar';
import {
  EMBER_COLORS,
  MINT_COLORS,
  MOCHA_COLORS,
  DETECTIVES,
  PETAL_COLORS,
  VIOLET_COLORS,
  SUNNY_COLORS,
  RUBY_COLORS,
  getEmberIdlePath,
  getMintIdlePath,
  getMochaIdlePath,
  getPetalIdlePath,
  getVioletIdlePath,
  getSunnyIdlePath,
  getRubyIdlePath,
  DETECTIVE_CONFIG_UPDATED_EVENT,
  getDetective,
  getScoutIdlePath,
  isEmberColor,
  isMintColor,
  isMochaColor,
  isPetalColor,
  isVioletColor,
  isSunnyColor,
  isRubyColor,
  isScoutColor,
  loadDetectiveConfig,
  saveDetectiveConfig,
  SCOUT_COLORS,
  SUPPORTED_DETECTIVE_TOOLS,
  type CustomDetective,
  type DetectiveConfig,
} from './detectiveModel';

type NotchView = 'overview' | 'music' | 'timer' | 'pomodoro' | 'health' | 'stopwatch' | 'notifications' | 'calendar' | 'weather' | 'spaces' | 'tasks' | 'notes' | 'screenTime' | 'lowBattery' | 'translation' | 'windowSnap' | 'dayProgress' | 'ghostAI';
type NotchSettingsTab = 'general' | 'widgets' | 'detectives' | 'appearance' | 'files';
type SnapZone = 'top-left' | 'bottom-left' | 'left' | 'maximize' | 'right' | 'top-right' | 'bottom-right' | 'left-third' | 'center-third' | 'right-third';
const NOTCH_TRAY_PATH = '/Users/abhishek/Files Tray';
const DESKTOP_PATH = '/Users/abhishek/Desktop';
const NOTCH_TASKS_STORAGE_KEY = DAY_PROGRESS_TASKS_KEY;
const NOTES_STORAGE_KEY = 'abhishek-os-notes';
const SCREEN_TIME_STORAGE_KEY = 'arlo_dynamic_workspace_screen_time_v1';
const MYMEMORY_TRANSLATE_URL = 'https://api.mymemory.translated.net/get';

const TRANSLATION_LANGUAGES = [
  { code: 'auto', label: 'Detect language' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'hi', label: 'Hindi' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
];

const SNAP_ZONES: { id: SnapZone; label: string; cells: number[] }[] = [
  { id: 'top-left', label: 'Top left', cells: [0] },
  { id: 'bottom-left', label: 'Bottom left', cells: [3] },
  { id: 'left', label: 'Left half', cells: [0, 3] },
  { id: 'maximize', label: 'Maximize', cells: [0, 1, 2, 3, 4, 5] },
  { id: 'right', label: 'Right half', cells: [1, 2, 4, 5] },
  { id: 'top-right', label: 'Top right', cells: [2] },
  { id: 'bottom-right', label: 'Bottom right', cells: [5] },
  { id: 'left-third', label: 'Left third', cells: [0, 3] },
  { id: 'center-third', label: 'Center third', cells: [1, 4] },
  { id: 'right-third', label: 'Right third', cells: [2, 5] },
];

interface DashboardNote {
  id: string;
  title: string;
  body: string;
  folder?: string;
  date?: string;
  pinned?: boolean;
}

interface NotchGhostMessage extends GhostMessage {
  id: string;
  createdAt: number;
}

const readNotchGhostChat = (): NotchGhostMessage[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(GHOST_CHAT_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((message): message is NotchGhostMessage =>
      typeof message === 'object' && message !== null &&
      'id' in message && typeof message.id === 'string' &&
      'role' in message && (message.role === 'user' || message.role === 'assistant') &&
      'content' in message && typeof message.content === 'string' &&
      'createdAt' in message && typeof message.createdAt === 'number');
  } catch (error) {
    console.warn('[Dynamic Workspace] Could not restore Ghost chat:', error);
    return [];
  }
};

type ScreenTimeDays = Record<string, Record<string, number>>;

type HealthActivity =
  | { kind: 'move' | 'stretch'; startedAt: number; endsAt: number; durationSeconds: number }
  | { kind: 'breathe'; startedAt: number; endsAt: number; durationSeconds: number; pattern: 'box' | 'calm' };

const POMODORO_PHASE_META: Record<PomodoroPhase, { label: string; icon: typeof Timer; color: string }> = {
  work: { label: 'Work', icon: Timer, color: '#f0b982' },
  shortBreak: { label: 'Short Break', icon: Coffee, color: '#7dd3c7' },
  longBreak: { label: 'Long Break', icon: Coffee, color: '#9b9df5' },
};

interface PomodoroState {
  phase: PomodoroPhase;
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
  sessionsCompleted: number;
  sessionDate: string;
  remainingMs: number;
  endAt: number | null;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  completionSound: boolean;
  showDoneOverlay: boolean;
}

const createDefaultPomodoro = (): PomodoroState => ({
  phase: 'work',
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  sessionsCompleted: 0,
  sessionDate: getLocalDateKey(new Date()),
  remainingMs: 25 * 60_000,
  endAt: null,
  autoStartBreaks: false,
  autoStartWork: false,
  completionSound: true,
  showDoneOverlay: true,
});

const readPomodoroState = (): PomodoroState => {
  try {
    const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!stored) return createDefaultPomodoro();
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Saved Pomodoro state is invalid.');
    }
    const defaults = createDefaultPomodoro();
    const value = parsed as Partial<PomodoroState>;
    const phase: PomodoroPhase = value.phase === 'shortBreak' || value.phase === 'longBreak' ? value.phase : 'work';
    const workMinutes = Number.isInteger(value.workMinutes) ? Math.min(180, Math.max(1, value.workMinutes!)) : defaults.workMinutes;
    const shortBreakMinutes = Number.isInteger(value.shortBreakMinutes) ? Math.min(60, Math.max(1, value.shortBreakMinutes!)) : defaults.shortBreakMinutes;
    const longBreakMinutes = Number.isInteger(value.longBreakMinutes) ? Math.min(90, Math.max(1, value.longBreakMinutes!)) : defaults.longBreakMinutes;
    const phaseMinutes = phase === 'work' ? workMinutes : phase === 'shortBreak' ? shortBreakMinutes : longBreakMinutes;
    const sessionDate = typeof value.sessionDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.sessionDate)
      ? value.sessionDate
      : defaults.sessionDate;
    const today = getLocalDateKey(new Date());
    return {
      ...defaults,
      phase,
      workMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      longBreakEvery: Number.isInteger(value.longBreakEvery) ? Math.min(12, Math.max(2, value.longBreakEvery!)) : defaults.longBreakEvery,
      sessionsCompleted: sessionDate === today && Number.isInteger(value.sessionsCompleted) ? Math.max(0, value.sessionsCompleted!) : 0,
      sessionDate: today,
      remainingMs: Number.isFinite(value.remainingMs) ? Math.min(phaseMinutes * 60_000, Math.max(0, value.remainingMs!)) : phaseMinutes * 60_000,
      endAt: Number.isFinite(value.endAt) ? value.endAt! : null,
      autoStartBreaks: typeof value.autoStartBreaks === 'boolean' ? value.autoStartBreaks : defaults.autoStartBreaks,
      autoStartWork: typeof value.autoStartWork === 'boolean' ? value.autoStartWork : defaults.autoStartWork,
      completionSound: typeof value.completionSound === 'boolean' ? value.completionSound : defaults.completionSound,
      showDoneOverlay: typeof value.showDoneOverlay === 'boolean' ? value.showDoneOverlay : defaults.showDoneOverlay,
    };
  } catch (error) {
    console.warn('[Dynamic Workspace] Could not restore Pomodoro state:', error);
    return createDefaultPomodoro();
  }
};

const getLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const readDashboardNotes = (): DashboardNote[] => {
  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Saved notes are not a list.');
    return parsed.filter((note): note is DashboardNote =>
      typeof note === 'object'
      && note !== null
      && typeof note.id === 'string'
      && typeof note.title === 'string'
      && typeof note.body === 'string',
    );
  } catch (error) {
    console.warn('[Dynamic Workspace] Could not read Notes data:', error);
    return [];
  }
};

const readScreenTimeDays = (): ScreenTimeDays => {
  try {
    const stored = localStorage.getItem(SCREEN_TIME_STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Saved screen time data is invalid.');
    }
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([date, apps]) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof apps !== 'object' || apps === null || Array.isArray(apps)) return [];
        const validApps: Record<string, number> = {};
        Object.entries(apps).forEach(([appId, duration]) => {
          if (typeof duration === 'number' && Number.isFinite(duration) && duration >= 0) {
            validApps[appId] = duration;
          }
        });
        return [[date, validApps]];
      }),
    );
  } catch (error) {
    console.warn('[Dynamic Workspace] Could not restore screen time:', error);
    return {};
  }
};

const getNotePreview = (body: string) => {
  const document = new DOMParser().parseFromString(body, 'text/html');
  return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
};

const formatDuration = (milliseconds: number) => {
  const totalMinutes = Math.floor(milliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

interface DashboardTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

const readDashboardTasks = (): DashboardTask[] => {
  try {
    const stored = localStorage.getItem(NOTCH_TASKS_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Saved dashboard tasks are not a list.');
    return parsed.filter((task): task is DashboardTask =>
      typeof task === 'object'
      && task !== null
      && typeof task.id === 'string'
      && typeof task.title === 'string'
      && typeof task.completed === 'boolean'
      && typeof task.createdAt === 'number',
    );
  } catch (error) {
    console.warn('[Dynamic Workspace] Could not restore dashboard tasks:', error);
    return [];
  }
};

interface NotchTrayItem {
  id: string;
  name: string;
  relativePath: string;
  type: string;
  size: number;
  isDirectory: boolean;
  appId?: string;
  desktopItemId?: string;
  virtualFileId?: string;
  file?: File;
  objectUrl?: string;
  previewUrl?: string;
}

interface NotchDragPreview {
  id: string;
  name: string;
  type: string;
  isDirectory: boolean;
  appId?: string;
  previewUrl?: string;
}

interface PendingCameraRequest {
  kind: NotchCameraCaptureKind;
  durationSeconds?: number;
  resolve: NotchCameraCaptureRequest['resolve'];
}

const SHAPE_SIZES: Record<JellyNotchShape, { width: number; height: number; radius: number | string }> = {
  capsule: { width: 284, height: 40, radius: 20 },
  rounded: { width: 340, height: 54, radius: 15 },
  square: { width: 54, height: 54, radius: 12 },
  circle: { width: 54, height: 54, radius: '50%' },
  oval: { width: 340, height: 56, radius: '28px' },
  superellipse: { width: 340, height: 54, radius: '16px' },
  compact: { width: 240, height: 48, radius: 16 },
  wide: { width: 420, height: 54, radius: 18 },
  orb: { width: 56, height: 56, radius: '50%' },
  split: { width: 340, height: 54, radius: 18 },
  double: { width: 360, height: 54, radius: 18 },
  custom: { width: 284, height: 40, radius: 20 },
};

const TIMER_PRESETS = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '15 min', seconds: 900 },
  { label: '25 min', seconds: 1500 },
];

const NOTCH_STYLES: { id: JellyNotchStyle; label: string; background: string }[] = [
  { id: 'glass', label: 'Liquid glass', background: 'linear-gradient(145deg, rgba(55,65,81,.88), rgba(5,7,12,.76))' },
  { id: 'solid', label: 'Midnight', background: 'linear-gradient(145deg, #16181e, #030406)' },
  { id: 'transparent', label: 'Clear glass', background: 'linear-gradient(145deg, rgba(255,255,255,.24), rgba(15,20,30,.28))' },
  { id: 'aurora', label: 'Aurora', background: 'linear-gradient(135deg, rgba(14,165,233,.44), rgba(91,33,182,.38), rgba(3,4,8,.86))' },
];

const NOTCH_OPEN_ANIMATIONS: { id: JellyNotchAnimation; label: string; description: string }[] = [
  { id: 'spring', label: 'Spring', description: 'Balanced natural movement' },
  { id: 'fade', label: 'Fade', description: 'Soft opacity transition' },
  { id: 'bounce', label: 'Bounce', description: 'Playful settling motion' },
  { id: 'slide', label: 'Slide', description: 'Drops smoothly into place' },
  { id: 'zoom', label: 'Zoom', description: 'Subtle scale transition' },
  { id: 'flip', label: 'Flip', description: 'Gentle perspective tilt' },
  { id: 'elastic', label: 'Elastic', description: 'Quick elastic spring' },
  { id: 'pop', label: 'Pop', description: 'Fast, crisp expansion' },
  { id: 'swoop', label: 'Swoop', description: 'Short upward glide' },
  { id: 'gentle', label: 'Gentle', description: 'Quiet ease-out motion' },
];

const NOTCH_ANIMATION_STATES: Record<
  JellyNotchAnimation,
  (expanded: boolean) => { opacity: number; scale: number; y: number; rotateX: number }
> = {
  spring: expanded => ({ opacity: 1, scale: expanded ? 1.015 : 1, y: 0, rotateX: 0 }),
  fade: expanded => ({ opacity: expanded ? 1 : 0.94, scale: 1, y: 0, rotateX: 0 }),
  bounce: expanded => ({ opacity: 1, scale: expanded ? 1.025 : 1, y: expanded ? 1 : 0, rotateX: 0 }),
  slide: expanded => ({ opacity: 1, scale: 1, y: expanded ? 5 : 0, rotateX: 0 }),
  zoom: expanded => ({ opacity: 1, scale: expanded ? 1 : 0.975, y: 0, rotateX: 0 }),
  flip: expanded => ({ opacity: 1, scale: 1, y: 0, rotateX: expanded ? 0 : -5 }),
  elastic: expanded => ({ opacity: 1, scale: expanded ? 1.02 : 1, y: 0, rotateX: 0 }),
  pop: expanded => ({ opacity: 1, scale: expanded ? 1 : 0.94, y: 0, rotateX: 0 }),
  swoop: expanded => ({ opacity: 1, scale: 1, y: expanded ? 0 : -3, rotateX: 0 }),
  gentle: () => ({ opacity: 1, scale: 1, y: 0, rotateX: 0 }),
};

const NOTCH_ANIMATION_TRANSITIONS: Record<JellyNotchAnimation, Transition> = {
  spring: { type: 'spring', stiffness: 300, damping: 30, mass: 0.72 },
  fade: { duration: 0.2, ease: 'easeOut' },
  bounce: { type: 'spring', stiffness: 420, damping: 18, mass: 0.65 },
  slide: { type: 'spring', stiffness: 260, damping: 28, mass: 0.85 },
  zoom: { duration: 0.19, ease: [0.22, 1, 0.36, 1] },
  flip: { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] },
  elastic: { type: 'spring', stiffness: 520, damping: 16, mass: 0.55 },
  pop: { type: 'spring', stiffness: 500, damping: 30, mass: 0.55 },
  swoop: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  gentle: { duration: 0.26, ease: 'easeOut' },
};

const NOTCH_SHAPES: { id: JellyNotchShape; label: string }[] = [
  { id: 'capsule', label: 'Capsule' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'square', label: 'Square' },
  { id: 'circle', label: 'Circle' },
  { id: 'oval', label: 'Oval' },
  { id: 'superellipse', label: 'Superellipse' },
  { id: 'compact', label: 'Compact pill' },
  { id: 'wide', label: 'Wide pill' },
  { id: 'orb', label: 'Floating orb' },
  { id: 'split', label: 'Split capsule' },
  { id: 'double', label: 'Double capsule' },
  { id: 'custom', label: 'Custom' },
];

const NOTCH_WIDGETS: { id: JellyNotchWidget; label: string; description: string; icon: typeof Music2 }[] = [
  { id: 'ghostAI', label: 'Ghost AI', description: 'Chat with Ghost from the Dynamic Workspace', icon: Bot },
  { id: 'music', label: 'Music player', description: 'Artwork, track details, and playback controls', icon: Music2 },
  { id: 'pomodoro', label: 'Pomodoro', description: 'Work and break sessions with progress and completion alerts', icon: Coffee },
  { id: 'screenTime', label: 'Screen Time', description: 'Track foreground app usage on this device', icon: Smartphone },
  { id: 'todos', label: 'To-do list', description: 'Keep a short task list in the dashboard', icon: ListTodo },
  { id: 'notes', label: 'Notes', description: 'Browse and preview your saved notes', icon: FileText },
  { id: 'fileTray', label: 'Files tray', description: 'Drop files, folders, and apps into the island', icon: FolderOpen },
  { id: 'deviceActivity', label: 'Device connections', description: 'Animate charger, USB, display, audio, and controller changes', icon: Usb },
  { id: 'clipboard', label: 'Clipboard activity', description: 'Show a preview when text is copied', icon: ClipboardCheck },
  { id: 'health', label: 'Health', description: 'Breaks, hydration, mindful minutes and eye rest', icon: Heart },
  { id: 'translation', label: 'Translation', description: 'Translate up to 500 characters; submitted text is sent to MyMemory', icon: Languages },
  { id: 'dayProgress', label: 'Day Progress', description: 'Today’s calendar, reminders, tasks and bedtime timeline', icon: CalendarDays },
  { id: 'calendar', label: 'Date & clock', description: 'Today’s date, weekday, and local time', icon: CalendarDays },
  { id: 'notifications', label: 'Notifications', description: 'Show your unread alert count', icon: Bell },
  { id: 'timer', label: 'Focus timer', description: 'See and control your running timer', icon: Timer },
  { id: 'stopwatch', label: 'Stopwatch', description: 'Keep a live stopwatch in the island', icon: Timer },
  { id: 'lowBattery', label: 'Low battery alerts', description: 'Show a live warning when battery falls to 20% or lower', icon: Battery },
  { id: 'windowSnap', label: 'Window snap zones', description: 'Snap the focused app to halves, quadrants, or thirds', icon: Monitor },
  { id: 'weather', label: 'Weather', description: 'Current conditions for your region', icon: CloudSun },
  { id: 'workspaces', label: 'Workspaces', description: 'Show the active desktop workspace', icon: ExternalLink },
  { id: 'systemStatus', label: 'System status', description: 'Battery, Wi-Fi, and Bluetooth at a glance', icon: Battery },
  { id: 'camera', label: 'Camera', description: 'Circular live preview, photo capture, and video recording', icon: Camera },
];

const formatTemperature = (temperature: number) => `${Math.round(temperature)}°`;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const getMusicArtworkRadius = (shape: NotchMusicArtworkShape) =>
  shape === 'circle' ? 'rounded-full' : shape === 'square' ? 'rounded-[2px]' : 'rounded-[17px]';

const formatStopwatch = (milliseconds: number) => {
  const centiseconds = Math.floor(milliseconds / 10);
  const hours = Math.floor(centiseconds / 360000);
  const minutes = Math.floor((centiseconds % 360000) / 6000);
  const seconds = Math.floor((centiseconds % 6000) / 100);
  const hundredths = centiseconds % 100;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const toTrayItem = (file: VirtualFile): NotchTrayItem => ({
  id: `vfs:${file.id}`,
  name: file.name,
  relativePath: file.name,
  type: file.type,
  size: file.size,
  isDirectory: file.type === 'folder',
  virtualFileId: file.id,
  previewUrl: file.previewUrl,
});

const hasSupportedDrop = (dataTransfer: DataTransfer) =>
  dataTransfer.types.includes('Files') || dataTransfer.types.includes('application/x-abhishek-os-items');

type SystemIndicatorState =
  | { kind: 'brightness'; value: number }
  | { kind: 'volume'; value: number }
  | { kind: 'lowBattery'; value: number }
  | { kind: 'pomodoroComplete'; phase: PomodoroPhase }
  | { kind: 'bluetooth'; enabled: boolean; connected: boolean; deviceName: string }
  | { kind: 'device'; deviceKind: NotchDeviceActivity['kind']; connected: boolean; deviceName: string }
  | { kind: 'clipboard'; preview: string }
  | { kind: 'timerComplete' };

const DeviceActivityIcon = ({ kind, className }: { kind: NotchDeviceActivity['kind']; className?: string }) => {
  const Icon = kind === 'power' ? PlugZap
    : kind === 'display' ? Monitor
      : kind === 'headphones' ? Headphones
        : kind === 'controller' ? Gamepad2
          : kind === 'storage' ? HardDrive
            : kind === 'bluetooth' ? Bluetooth
              : Usb;
  return <Icon className={className} />;
};

const AirPodsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M7.25 3.5a2.75 2.75 0 0 0-2.75 2.75v1.1a1.6 1.6 0 0 0 1.6 1.6h.2v7.8a1.2 1.2 0 0 0 2.4 0V6.25A2.75 2.75 0 0 0 7.25 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16.75 3.5a2.75 2.75 0 0 1 2.75 2.75v1.1a1.6 1.6 0 0 1-1.6 1.6h-.2v7.8a1.2 1.2 0 0 1-2.4 0V6.25a2.75 2.75 0 0 1 2.75-2.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SystemIndicatorHUD: React.FC<{
  indicator: SystemIndicatorState;
  reduceMotion: boolean;
}> = ({ indicator, reduceMotion }) => {
  const isBluetooth = indicator.kind === 'bluetooth';
  const isLowBatteryAlert = indicator.kind === 'lowBattery';
  const isPomodoroAlert = indicator.kind === 'pomodoroComplete';
  const isActivity = indicator.kind === 'device' || indicator.kind === 'clipboard' || indicator.kind === 'timerComplete' || isPomodoroAlert;
  const value = indicator.kind === 'brightness' || indicator.kind === 'volume' || isLowBatteryAlert ? indicator.value : 100;
  const label = indicator.kind === 'brightness'
    ? 'DISPLAY'
    : indicator.kind === 'volume'
      ? 'SOUND'
      : isLowBatteryAlert
        ? 'LOW BATTERY'
      : isPomodoroAlert
        ? `${POMODORO_PHASE_META[indicator.phase].label.toUpperCase()} DONE`
      : indicator.kind === 'device'
        ? `${indicator.deviceName || indicator.deviceKind} ${indicator.connected ? 'CONNECTED' : 'DISCONNECTED'}`
        : indicator.kind === 'clipboard'
          ? 'COPIED'
          : indicator.kind === 'timerComplete'
            ? 'TIMER COMPLETE'
              : indicator.connected
                ? indicator.deviceName || 'HEADPHONES CONNECTED'
                : indicator.enabled
                  ? 'BLUETOOTH ON'
                  : 'BLUETOOTH OFF';
  const Icon = indicator.kind === 'brightness'
    ? Sun
    : indicator.kind === 'volume'
      ? value > 0 ? Volume2 : VolumeX
      : indicator.kind === 'device'
        ? Usb
        : indicator.kind === 'clipboard'
          ? Copy
          : indicator.kind === 'timerComplete'
            ? Check
            : isLowBatteryAlert
              ? Battery
              : isPomodoroAlert
                ? POMODORO_PHASE_META[indicator.phase].icon
              : indicator.connected ? Headphones : Bluetooth;

  return (
    <motion.div
      key={indicator.kind}
      role="status"
      aria-live="polite"
      aria-label={
        indicator.kind === 'brightness' || indicator.kind === 'volume' || isLowBatteryAlert
          ? `${isLowBatteryAlert ? 'Low battery' : indicator.kind === 'brightness' ? 'Brightness' : 'Volume'} ${Math.round(value)} percent`
          : label
      }
      initial={{ opacity: 0, y: -5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 28 }}
      className="flex h-full w-full items-center gap-3 px-5"
    >
      <motion.div
        animate={reduceMotion
          ? {}
          : isActivity
            ? { scale: [1, 1.08, 1] }
            : indicator.kind === 'bluetooth'
            ? { rotateY: [0, 180, 360], scale: [1, 1.05, 1] }
            : indicator.kind === 'brightness'
              ? { rotate: [0, 18, 0], scale: [1, 1.08, 1] }
              : { scale: [1, 1.12, 1] }}
        transition={{ duration: indicator.kind === 'bluetooth' ? 2.8 : 1.3, repeat: Infinity, ease: 'easeInOut' }}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_32%_24%,rgba(255,255,255,.25),rgba(255,255,255,.04)_55%,rgba(56,189,248,.12))] shadow-[inset_0_1px_3px_rgba(255,255,255,.14),0_0_18px_rgba(56,189,248,.14)] ${isLowBatteryAlert ? 'text-amber-300' : 'text-sky-100'}`}
        style={{ perspective: 180, transformStyle: 'preserve-3d' }}
      >
        {indicator.kind === 'device'
          ? <DeviceActivityIcon kind={indicator.deviceKind} className="h-4 w-4 text-sky-100" />
          : indicator.kind === 'bluetooth' && indicator.connected
            ? <AirPodsIcon className="h-4 w-4 text-sky-100" />
          : <Icon className={`h-4 w-4 ${indicator.kind === 'brightness' || isLowBatteryAlert ? 'text-amber-100' : 'text-sky-100'}`} />}
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[8px] font-semibold uppercase tracking-[.16em] text-slate-300/90">{label}</span>
          {(indicator.kind === 'brightness' || indicator.kind === 'volume' || isLowBatteryAlert) && <span className={`font-mono text-[9px] tabular-nums ${isLowBatteryAlert ? 'text-amber-300' : 'text-slate-200'}`}>{Math.round(value)}%</span>}
        </div>
        {isLowBatteryAlert ? (
          <>
            <div className="mb-1 text-[8px] text-slate-400">Plug in a power adapter</div>
            <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.13] shadow-[inset_0_1px_2px_rgba(0,0,0,.4)]">
              <motion.div
                animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                transition={reduceMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 220, damping: 25 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-200 shadow-[0_0_10px_rgba(251,191,36,.5)]"
              />
            </div>
          </>
        ) : isActivity ? (
          <div className="truncate text-[9px] text-slate-400">
            {indicator.kind === 'device'
              ? indicator.deviceName || (indicator.connected ? 'Ready to use' : 'Disconnected safely')
              : indicator.kind === 'clipboard'
                ? indicator.preview
                : isPomodoroAlert
                  ? indicator.phase === 'work' ? 'Focus session complete · take a break' : 'Break complete · ready to focus'
                  : 'Your focus timer has finished'}
          </div>
        ) : (
          <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.13] shadow-[inset_0_1px_2px_rgba(0,0,0,.4)]">
            <motion.div
              animate={{ width: `${value}%` }}
              transition={reduceMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 220, damping: 25 }}
              className={`h-full rounded-full ${indicator.kind === 'brightness' ? 'bg-gradient-to-r from-amber-200 to-white' : 'bg-gradient-to-r from-sky-300 to-white'} shadow-[0_0_10px_rgba(125,211,252,.55)]`}
            />
          </div>
        )}
      </div>

      {indicator.kind === 'volume' ? (
        <div className="flex h-6 w-7 shrink-0 items-center justify-center gap-[3px]" aria-hidden="true">
          {[9, 17, 12].map((height, index) => (
            <motion.span
              key={index}
              animate={reduceMotion
                ? { height: Math.max(3, height * value / 100) }
                : { height: [Math.max(3, height * value / 100), Math.max(4, height * value / 100 - 3), Math.max(3, height * value / 100)] }}
              transition={{ duration: 0.9 + index * 0.16, delay: index * 0.08, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
              className="w-[3px] rounded-full bg-sky-200 shadow-[0_0_8px_rgba(125,211,252,.45)]"
            />
          ))}
        </div>
      ) : indicator.kind === 'bluetooth' ? (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${indicator.connected ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.65)]' : 'bg-slate-500'}`} />
      ) : indicator.kind === 'device' ? (
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${indicator.connected ? 'bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.65)]' : 'bg-slate-500'}`} />
      ) : null}
    </motion.div>
  );
};

export const JellyNotch: React.FC = () => {
  const {
    settings,
      windows,
      currentTrack,
    isPlayingMusic,
    musicProgress,
    repeatTrack,
    setRepeatTrack,
    shuffleTracks,
    setShuffleTracks,
    togglePlayMusic,
    nextTrack,
    prevTrack,
    setMusicProgress,
    updateSettings,
    notifications,
    dismissNotification,
    addNotification,
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    setShowControlCenter,
    openApp,
    closeWindow,
    showDesktop,
    snapWindow,
    user,
    setShowGhostAssistant,
  } = useOS();
  const reduceMotion = useReducedMotion();
  const [detectiveConfig, setDetectiveConfig] = useState<DetectiveConfig>(loadDetectiveConfig);
  const [appearanceDetective, setAppearanceDetective] = useState<DetectiveConfig['selectedId']>('scout');
  const selectedDetective = getDetective(detectiveConfig);
  const selectedDetectiveAvatarId = 'avatarId' in selectedDetective ? selectedDetective.avatarId : selectedDetective.id;
  const appearanceColors = appearanceDetective === 'scout'
    ? SCOUT_COLORS.map(option => ({ ...option, idlePath: getScoutIdlePath(option.id) }))
    : appearanceDetective === 'ember'
      ? EMBER_COLORS.map(option => ({ ...option, idlePath: getEmberIdlePath(option.id) }))
      : appearanceDetective === 'mint'
        ? MINT_COLORS.map(option => ({ ...option, idlePath: getMintIdlePath(option.id) }))
        : appearanceDetective === 'ruby'
          ? RUBY_COLORS.map(option => ({ ...option, idlePath: getRubyIdlePath(option.id) }))
          : appearanceDetective === 'petal'
            ? PETAL_COLORS.map(option => ({ ...option, idlePath: getPetalIdlePath(option.id) }))
            : appearanceDetective === 'violet'
              ? VIOLET_COLORS.map(option => ({ ...option, idlePath: getVioletIdlePath(option.id) }))
              : appearanceDetective === 'sunny'
                ? SUNNY_COLORS.map(option => ({ ...option, idlePath: getSunnyIdlePath(option.id) }))
                : MOCHA_COLORS.map(option => ({ ...option, idlePath: getMochaIdlePath(option.id) }));
  const appearanceColor = appearanceDetective === 'scout'
    ? detectiveConfig.scoutColor
    : appearanceDetective === 'ember'
      ? detectiveConfig.emberColor
      : appearanceDetective === 'mint'
        ? detectiveConfig.mintColor
        : appearanceDetective === 'ruby'
          ? detectiveConfig.rubyColor
          : appearanceDetective === 'petal'
            ? detectiveConfig.petalColor
            : appearanceDetective === 'violet'
              ? detectiveConfig.violetColor
              : appearanceDetective === 'sunny' ? detectiveConfig.sunnyColor : detectiveConfig.mochaColor;
  const appearanceIdlePath = appearanceDetective === 'scout'
    ? getScoutIdlePath(detectiveConfig.scoutColor)
    : appearanceDetective === 'ember'
      ? getEmberIdlePath(detectiveConfig.emberColor)
      : appearanceDetective === 'mint'
        ? getMintIdlePath(detectiveConfig.mintColor)
        : appearanceDetective === 'ruby'
          ? getRubyIdlePath(detectiveConfig.rubyColor)
          : appearanceDetective === 'petal'
            ? getPetalIdlePath(detectiveConfig.petalColor)
            : appearanceDetective === 'violet'
              ? getVioletIdlePath(detectiveConfig.violetColor)
              : appearanceDetective === 'sunny'
                ? getSunnyIdlePath(detectiveConfig.sunnyColor)
                : getMochaIdlePath(detectiveConfig.mochaColor);
  const updateDetectiveConfig = (patch: Partial<DetectiveConfig>) => {
    const next = { ...detectiveConfig, ...patch };
    setDetectiveConfig(next);
    saveDetectiveConfig(next);
  };
  const selectedCustomDetective = detectiveConfig.customDetectives.find(profile => profile.id === selectedDetective.id);
  const updateCustomDetective = (patch: Partial<CustomDetective>) => {
    if (!selectedCustomDetective) return;
    updateDetectiveConfig({
      customDetectives: detectiveConfig.customDetectives.map(profile =>
        profile.id === selectedCustomDetective.id ? { ...profile, ...patch } : profile,
      ),
    });
  };
  const createCustomDetective = () => {
    const profile: CustomDetective = {
      id: `custom-${crypto.randomUUID()}`,
      name: 'New detective',
      instructions: '',
      description: 'A user-configured ARLO OS assistant.',
      avatarId: DETECTIVES[0].id,
      permittedTools: [],
    };
    updateDetectiveConfig({
      selectedId: profile.id,
      customDetectives: [...detectiveConfig.customDetectives, profile],
    });
  };

  useEffect(() => {
    const handleDetectiveConfig = (event: Event) => {
      const config = (event as CustomEvent<DetectiveConfig>).detail;
      if (config) setDetectiveConfig(config);
    };
    window.addEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, handleDetectiveConfig);
    return () => window.removeEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, handleDetectiveConfig);
  }, []);
  const [expanded, setExpanded] = useState(false);
  const [musicSpectrumData, setMusicSpectrumData] = useState<number[]>(() => Array.from({ length: 24 }, () => 4));
  const notchContainerRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;
  const [launchIntroActive, setLaunchIntroActive] = useState(false);
  const launchIntroTriggeredRef = useRef(false);
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const [notchSettingsOpen, setNotchSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<NotchSettingsTab>('general');
  const notchSettingsOverlayRef = useRef<HTMLDivElement | null>(null);
  const launchIntroTimerRef = useRef<number | null>(null);
  const hoverExpandTimerRef = useRef<number | null>(null);
  const notchSettingsResizeRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const notchSettingsDragControls = useDragControls();
  const [notchSettingsSize, setNotchSettingsSize] = useState({ width: 940, height: 700 });
  const [notchSettingsMaximized, setNotchSettingsMaximized] = useState(false);
  useEffect(() => () => {
    if (launchIntroTimerRef.current !== null) {
      window.clearTimeout(launchIntroTimerRef.current);
    }
    if (hoverExpandTimerRef.current !== null) {
      window.clearTimeout(hoverExpandTimerRef.current);
    }
  }, []);
  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);
  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);
  useEffect(() => {
    if (!expanded && !pinned && !launchIntroActive) return;
    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || notchContainerRef.current?.contains(target)) return;
      if (launchIntroTimerRef.current !== null) {
        window.clearTimeout(launchIntroTimerRef.current);
        launchIntroTimerRef.current = null;
      }
      if (launchIntroActive) {
        setLaunchIntroActive(false);
        updateSettings({ jellyNotchStyle: 'transparent' });
      }
      hoveredRef.current = false;
      pinnedRef.current = false;
      setHovered(false);
      setPinned(false);
      setExpanded(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointerDown);
  }, [expanded, launchIntroActive, pinned, updateSettings]);
  const [view, setView] = useState<NotchView>('overview');
  const widgetStripRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (settings.notchMusicVisualizer !== 'spectrum' || !isPlayingMusic) {
      setMusicSpectrumData(Array.from({ length: 24 }, () => 4));
      return;
    }
    const updateSpectrum = () => setMusicSpectrumData(musicEngine.getVisualizerData());
    updateSpectrum();
    const interval = window.setInterval(updateSpectrum, 90);
    return () => window.clearInterval(interval);
  }, [isPlayingMusic, settings.notchMusicVisualizer]);
  const [dashboardTasks, setDashboardTasks] = useState<DashboardTask[]>(readDashboardTasks);
  const [newDashboardTask, setNewDashboardTask] = useState('');
  const [dashboardNotes, setDashboardNotes] = useState<DashboardNote[]>(readDashboardNotes);
  const [ghostMessages, setGhostMessages] = useState<NotchGhostMessage[]>(readNotchGhostChat);
  const [ghostPrompt, setGhostPrompt] = useState('');
  const [ghostBusy, setGhostBusy] = useState(false);
  const [ghostError, setGhostError] = useState('');
  const ghostRequestIdRef = useRef<string | null>(null);
  const ghostEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedDashboardNoteId, setSelectedDashboardNoteId] = useState<string | null>(null);
  const [screenTimeDays, setScreenTimeDays] = useState<ScreenTimeDays>(readScreenTimeDays);
  const [healthHistory, setHealthHistory] = useState<HealthHistory>(readHealthHistory);
  const [healthActivity, setHealthActivity] = useState<HealthActivity | null>(null);
  const [eyeBreakEndAt, setEyeBreakEndAt] = useState<number | null>(null);
  const screenTimeTickRef = useRef(Date.now());
  const completedPomodoroEndAtRef = useRef<number | null>(null);
  const completedHealthActivityRef = useRef<number | null>(null);
  const completedEyeBreakRef = useRef<number | null>(null);
  const healthSessionStartRef = useRef({ date: getHealthDateKey(), at: Date.now() });
  const eyeBreakAnchorRef = useRef({ date: getHealthDateKey(), at: Date.now() });
  const previousEyeBreakEnabledRef = useRef(settings.health.eyeBreakRemindersEnabled);
  const healthReminderRef = useRef('');
  const hearingWarningActiveRef = useRef(false);
  const windDownReminderRef = useRef('');
  const eyeBreakReminderRef = useRef('');
  const lowBatteryAlertedRef = useRef(false);
  const translationAbortRef = useRef<AbortController | null>(null);
  const [translationSource, setTranslationSource] = useState('en');
  const [translationTarget, setTranslationTarget] = useState('de');
  const [translationInput, setTranslationInput] = useState('');
  const [translationOutput, setTranslationOutput] = useState('');
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationCopied, setTranslationCopied] = useState(false);
  const isLowBattery = settings.batteryAvailable && settings.batteryLevel <= 20 && !settings.batteryCharging;
  const [timerPreset, setTimerPreset] = useState(300);
  const [timerRemainingMs, setTimerRemainingMs] = useState(300_000);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [pomodoro, setPomodoro] = useState<PomodoroState>(readPomodoroState);
  const [pomodoroNow, setPomodoroNow] = useState(() => Date.now());
  const [clockMode, setClockMode] = useState<'timer' | 'stopwatch'>('timer');
  const stopwatch = useStopwatch();
  const stopwatchElapsedMs = stopwatch.elapsedMs;
  const stopwatchStartedAt = stopwatch.startedAt;
  const [favoriteTrackId, setFavoriteTrackId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [systemIndicator, setSystemIndicator] = useState<SystemIndicatorState | null>(null);
  const hostMediaBaseline = useRef<SystemMediaState | null>(null);
  const [trayItems, setTrayItems] = useState<NotchTrayItem[]>(() => vfs.getFiles(NOTCH_TRAY_PATH).map(toTrayItem));
  const [trayDragActive, setTrayDragActive] = useState(false);
  const [trayDragPreview, setTrayDragPreview] = useState<NotchDragPreview[]>([]);
  const [trayDragPointer, setTrayDragPointer] = useState({ x: 50, y: 50 });
  const [trayDropComplete, setTrayDropComplete] = useState('');
  const [trayDropFailed, setTrayDropFailed] = useState(false);
  const [lastDeviceActivity, setLastDeviceActivity] = useState<NotchDeviceActivity | null>(null);
  const [trayError, setTrayError] = useState('');
  const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [cameraPreviewElement, setCameraPreviewElement] = useState<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraChunksRef = useRef<Blob[]>([]);
  const cameraRecordingTimeoutRef = useRef<number | null>(null);
  const cameraRecordingStartedAtRef = useRef<number | null>(null);
  const cameraRequestResolverRef = useRef<PendingCameraRequest['resolve'] | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPreviewPlaying, setCameraPreviewPlaying] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraFeedback, setCameraFeedback] = useState('');
  const [cameraRecording, setCameraRecording] = useState(false);
  const [cameraRecordingSeconds, setCameraRecordingSeconds] = useState(0);
  const [pendingCameraRequest, setPendingCameraRequest] = useState<PendingCameraRequest | null>(null);
  const setCameraPreviewNode = useCallback((element: HTMLVideoElement | null) => {
    cameraPreviewRef.current = element;
    setCameraPreviewElement(element);
  }, []);
  const trayItemsRef = useRef<NotchTrayItem[]>([]);
  trayItemsRef.current = trayItems;
  const trayDragPreviewRef = useRef<NotchDragPreview[]>([]);
  const trayDropActive = useRef(false);
  const trayDropTimeout = useRef<number | null>(null);
  const previousSystemSettings = useRef({
    brightness: settings.brightness,
    soundVolume: settings.soundVolume,
    bluetoothEnabled: settings.bluetoothEnabled,
    bluetoothConnected: settings.bluetoothConnected,
    bluetoothDeviceName: settings.bluetoothDeviceName,
  });
  const systemIndicatorTimeout = useRef<number | null>(null);
  const showSystemIndicator = useCallback((indicator: SystemIndicatorState, durationMs = 2400) => {
    setSystemIndicator(indicator);
    if (systemIndicatorTimeout.current !== null) {
      window.clearTimeout(systemIndicatorTimeout.current);
    }
    systemIndicatorTimeout.current = window.setTimeout(() => {
      setSystemIndicator(null);
      systemIndicatorTimeout.current = null;
    }, durationMs);
  }, []);

  const updateHealthDay = useCallback((update: (day: HealthDay) => HealthDay) => {
    setHealthHistory(history => {
      const dateKey = getHealthDateKey();
      return { ...history, [dateKey]: update(getHealthDay(history)) };
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(NOTCH_TASKS_STORAGE_KEY, JSON.stringify(dashboardTasks));
      notifyDayProgressUpdated();
    } catch (error) {
      console.warn('[Dynamic Workspace] Could not save dashboard tasks:', error);
    }
  }, [dashboardTasks]);

  useEffect(() => {
    try {
      localStorage.setItem(GHOST_CHAT_STORAGE_KEY, JSON.stringify(ghostMessages));
      window.dispatchEvent(new Event(GHOST_CHAT_UPDATED_EVENT));
    } catch (error) {
      console.error('[Dynamic Workspace] Could not save Ghost chat:', error);
      setGhostError('Could not save this chat on your device.');
    }
  }, [ghostMessages]);

  useEffect(() => {
    const refreshGhostChat = () => {
      const nextMessages = readNotchGhostChat();
      setGhostMessages(current =>
        JSON.stringify(current) === JSON.stringify(nextMessages) ? current : nextMessages);
    };
    window.addEventListener(GHOST_CHAT_UPDATED_EVENT, refreshGhostChat);
    window.addEventListener('storage', refreshGhostChat);
    return () => {
      window.removeEventListener(GHOST_CHAT_UPDATED_EVENT, refreshGhostChat);
      window.removeEventListener('storage', refreshGhostChat);
    };
  }, []);

  useEffect(() => {
    ghostEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [ghostMessages, ghostBusy]);

  useEffect(() => () => {
    const requestId = ghostRequestIdRef.current;
    if (requestId) {
      void window.electronAPI?.ghostAICancelChat(requestId).catch(error => {
        console.error('[Dynamic Workspace] Could not cancel Ghost chat:', error);
      });
    }
  }, []);

  useEffect(() => {
    const refreshNotes = () => {
      const nextNotes = readDashboardNotes();
      setDashboardNotes(current => JSON.stringify(current) === JSON.stringify(nextNotes) ? current : nextNotes);
    };
    refreshNotes();
    window.addEventListener('storage', refreshNotes);
    window.addEventListener(NOTES_UPDATED_EVENT, refreshNotes);
    return () => {
      window.removeEventListener('storage', refreshNotes);
      window.removeEventListener(NOTES_UPDATED_EVENT, refreshNotes);
    };
  }, []);

  useEffect(() => {
    const persistScreenTime = () => {
      try {
        localStorage.setItem(SCREEN_TIME_STORAGE_KEY, JSON.stringify(screenTimeDays));
      } catch (error) {
        console.warn('[Dynamic Workspace] Could not save screen time:', error);
      }
    };
    persistScreenTime();
  }, [screenTimeDays]);

  useEffect(() => {
    savePomodoroState(pomodoro);
  }, [pomodoro]);

  useEffect(() => saveHealthHistory(healthHistory), [healthHistory]);

  useEffect(() => {
    const refreshHealth = () => setHealthHistory(readHealthHistory());
    window.addEventListener('storage', refreshHealth);
    return () => window.removeEventListener('storage', refreshHealth);
  }, []);

  useEffect(() => {
    if (pomodoro.endAt === null) return;
    const interval = window.setInterval(() => setPomodoroNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [pomodoro.endAt]);

  useEffect(() => {
    const endAt = pomodoro.endAt;
    if (endAt === null || endAt > pomodoroNow || completedPomodoroEndAtRef.current === endAt) return;
    completedPomodoroEndAtRef.current = endAt;

    const completedPhase = pomodoro.phase;
    const sessionsCompleted = (pomodoro.sessionDate === getLocalDateKey(new Date()) ? pomodoro.sessionsCompleted : 0)
      + (completedPhase === 'work' ? 1 : 0);
    const nextPhase: PomodoroPhase = completedPhase === 'work'
      ? sessionsCompleted % pomodoro.longBreakEvery === 0 ? 'longBreak' : 'shortBreak'
      : 'work';
    const nextMinutes = nextPhase === 'work'
      ? pomodoro.workMinutes
      : nextPhase === 'shortBreak'
        ? pomodoro.shortBreakMinutes
        : pomodoro.longBreakMinutes;
    const autoStart = nextPhase === 'work' ? pomodoro.autoStartWork : pomodoro.autoStartBreaks;
    const nextStartAt = autoStart ? Date.now() + nextMinutes * 60_000 : null;

    setPomodoro(current => ({
      ...current,
      phase: nextPhase,
      sessionsCompleted,
      sessionDate: getLocalDateKey(new Date()),
      remainingMs: nextMinutes * 60_000,
      endAt: nextStartAt,
    }));
    if (pomodoro.completionSound) sound.playNotification();
    addNotification({
      appName: 'Pomodoro',
      title: `${POMODORO_PHASE_META[completedPhase].label} complete`,
      message: completedPhase === 'work'
        ? `Focus session ${sessionsCompleted} complete. ${POMODORO_PHASE_META[nextPhase].label} is next.`
        : 'Break complete. You are ready for another focus session.',
      type: 'system',
    });
    if (pomodoro.showDoneOverlay) {
      setPinned(false);
      setHovered(false);
      setExpanded(false);
      showSystemIndicator({ kind: 'pomodoroComplete', phase: completedPhase }, 6500);
    }
  }, [addNotification, pomodoro, pomodoroNow, showSystemIndicator]);

  useEffect(() => {
    if (!healthActivity || healthActivity.endsAt > now.getTime() || completedHealthActivityRef.current === healthActivity.startedAt) return;
    completedHealthActivityRef.current = healthActivity.startedAt;
    if (healthActivity.kind === 'breathe') {
      const mindfulMinutes = Math.max(1, Math.round(healthActivity.durationSeconds / 60));
      updateHealthDay(day => ({ ...day, mindfulMinutes: day.mindfulMinutes + mindfulMinutes }));
      addNotification({
        appName: 'Health',
        title: 'Breathing session complete',
        message: `${mindfulMinutes} mindful ${mindfulMinutes === 1 ? 'minute' : 'minutes'} added to today's progress.`,
        type: 'system',
      });
    } else {
      updateHealthDay(day => ({
        ...day,
        breakCount: day.breakCount + 1,
        lastBreakAt: Date.now(),
      }));
      addNotification({
        appName: 'Health',
        title: 'Movement break complete',
        message: 'Nice work. Your break has been added to today’s wellbeing rings.',
        type: 'system',
      });
    }
    setHealthActivity(null);
  }, [addNotification, healthActivity, now, updateHealthDay]);

  useEffect(() => {
    if (eyeBreakEndAt === null || eyeBreakEndAt > now.getTime() || completedEyeBreakRef.current === eyeBreakEndAt) return;
    const completedAt = eyeBreakEndAt;
    completedEyeBreakRef.current = completedAt;
    setEyeBreakEndAt(null);
    updateHealthDay(day => ({
      ...day,
      breakCount: day.breakCount + 1,
      lastBreakAt: completedAt,
      lastEyeBreakAt: completedAt,
    }));
  }, [eyeBreakEndAt, now, updateHealthDay]);

  useEffect(() => {
    if (eyeBreakEndAt === null) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEyeBreakEndAt(null);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [eyeBreakEndAt]);

  useEffect(() => {
    if (!settings.jellyNotchWidgets.health) return;
    const currentDay = getHealthDay(healthHistory, now);
    const dateKey = getHealthDateKey(now);
    if (healthSessionStartRef.current.date !== dateKey) {
      healthSessionStartRef.current = { date: dateKey, at: now.getTime() };
    }
    const anchor = currentDay.lastBreakAt ?? healthSessionStartRef.current.at;
    const intervalMs = settings.health.breakIntervalMinutes * 60_000;
    const elapsed = now.getTime() - anchor;
    if (elapsed < intervalMs) return;
    const dueIndex = Math.floor(elapsed / intervalMs);
    const reminderKey = `${getHealthDateKey(now)}:${anchor}:${dueIndex}`;
    if (healthReminderRef.current === reminderKey) return;
    healthReminderRef.current = reminderKey;
    addNotification({
      appName: 'Health',
      title: 'Time for a desk break',
      message: 'Stand, stretch, or take a short walk. Your movement break is ready in the notch.',
      type: 'system',
    });
  }, [addNotification, healthHistory, now, settings.health.breakIntervalMinutes, settings.jellyNotchWidgets.health]);

  useEffect(() => {
    if (!settings.health.hearingWarningsEnabled) {
      hearingWarningActiveRef.current = false;
      return;
    }
    const volumePercent = Math.round(settings.soundVolume * 100);
    if (volumePercent < settings.health.hearingWarningThresholdPercent) {
      hearingWarningActiveRef.current = false;
      return;
    }
    if (hearingWarningActiveRef.current) return;
    hearingWarningActiveRef.current = true;
    addNotification({
      appName: 'Health',
      title: 'High output volume',
      message: `ARLO's output is at ${volumePercent}%. Lower the volume to protect your hearing.`,
      type: 'system',
    });
  }, [addNotification, settings.health.hearingWarningThresholdPercent, settings.health.hearingWarningsEnabled, settings.soundVolume]);

  useEffect(() => {
    if (!settings.health.windDownEnabled) return;
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime !== settings.health.windDownTime) return;
    const reminderKey = `${getHealthDateKey(now)}:${currentTime}`;
    if (windDownReminderRef.current === reminderKey) return;
    windDownReminderRef.current = reminderKey;
    addNotification({
      appName: 'Health',
      title: 'Wind-down time',
      message: 'Your evening wind-down reminder is here. Consider taking a moment away from your desk.',
      type: 'system',
    });
  }, [addNotification, now, settings.health.windDownEnabled, settings.health.windDownTime]);

  useEffect(() => {
    const wasEnabled = previousEyeBreakEnabledRef.current;
    previousEyeBreakEnabledRef.current = settings.health.eyeBreakRemindersEnabled;
    if (!settings.health.eyeBreakRemindersEnabled) return;
    if (!wasEnabled) {
      eyeBreakAnchorRef.current = { date: getHealthDateKey(), at: Date.now() };
      eyeBreakReminderRef.current = '';
      return;
    }
    if (eyeBreakEndAt !== null) return;
    const today = getHealthDay(healthHistory, now);
    const dateKey = getHealthDateKey(now);
    if (eyeBreakAnchorRef.current.date !== dateKey) {
      eyeBreakAnchorRef.current = { date: dateKey, at: now.getTime() };
    }
    const baseline = Math.max(today.lastEyeBreakAt ?? 0, eyeBreakAnchorRef.current.at);
    const elapsedMinutes = Math.floor((now.getTime() - baseline) / 60_000);
    const dueIndex = Math.floor(elapsedMinutes / settings.health.eyeBreakIntervalMinutes);
    if (dueIndex < 1) return;
    const reminderKey = `${getHealthDateKey(now)}:${baseline}:${dueIndex}`;
    if (eyeBreakReminderRef.current === reminderKey) return;
    eyeBreakReminderRef.current = reminderKey;
    setEyeBreakEndAt(now.getTime() + settings.health.eyeBreakDurationSeconds * 1000);
  }, [eyeBreakEndAt, healthHistory, now, settings.health.eyeBreakDurationSeconds, settings.health.eyeBreakIntervalMinutes, settings.health.eyeBreakRemindersEnabled]);

  useEffect(() => {
    screenTimeTickRef.current = Date.now();
    if (!settings.jellyNotchWidgets.screenTime) return;

    const interval = window.setInterval(() => {
      const nowMs = Date.now();
      const elapsedMs = Math.min(5000, Math.max(0, nowMs - screenTimeTickRef.current));
      screenTimeTickRef.current = nowMs;
      const focusedWindow = windows.find(windowState =>
        windowState.isFocused
        && !windowState.isMinimized
        && (!windowState.desktopSpaceId || windowState.desktopSpaceId === activeSpaceId),
      );
      if (!focusedWindow || elapsedMs === 0) return;

      setScreenTimeDays(current => {
        const dateKey = getLocalDateKey(new Date(nowMs));
        const today = current[dateKey] ?? {};
        return {
          ...current,
          [dateKey]: {
            ...today,
            [focusedWindow.appId]: (today[focusedWindow.appId] ?? 0) + elapsedMs,
          },
        };
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeSpaceId, settings.jellyNotchWidgets.screenTime, windows]);

  useEffect(() => {
    if (!settings.jellyNotchWidgets.lowBattery) {
      lowBatteryAlertedRef.current = false;
      return;
    }
    if (!isLowBattery) {
      lowBatteryAlertedRef.current = false;
      return;
    }
    if (lowBatteryAlertedRef.current) return;

    lowBatteryAlertedRef.current = true;
    showSystemIndicator({ kind: 'lowBattery', value: settings.batteryLevel });
    addNotification({
      appId: 'settings',
      title: 'Low battery',
      message: `${settings.batteryLevel}% battery remaining. Plug in a power adapter to keep using your device.`,
      type: 'system',
    });
  }, [addNotification, isLowBattery, settings.batteryLevel, settings.jellyNotchWidgets.lowBattery, showSystemIndicator]);

  useEffect(() => () => translationAbortRef.current?.abort(), []);

  const translateText = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = translationInput.trim();
    if (!text) {
      setTranslationError('Enter text to translate.');
      return;
    }
    if (translationSource !== 'auto' && translationSource === translationTarget) {
      setTranslationError('Choose two different languages.');
      return;
    }

    translationAbortRef.current?.abort();
    const controller = new AbortController();
    translationAbortRef.current = controller;
    setTranslationLoading(true);
    setTranslationError(null);
    setTranslationOutput('');
    setTranslationCopied(false);
    try {
      const params = new URLSearchParams({
        q: text,
        langpair: `${translationSource === 'auto' ? 'autodetect' : translationSource}|${translationTarget}`,
      });
      const response = await fetch(`${MYMEMORY_TRANSLATE_URL}?${params.toString()}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Translation service returned ${response.status}.`);
      const result: unknown = await response.json();
      if (typeof result !== 'object' || result === null || !('responseStatus' in result) || !('responseData' in result)) {
        throw new Error('Translation service returned an invalid response.');
      }
      const responseData = result.responseData;
      if ('quotaFinished' in result && result.quotaFinished === true) {
        throw new Error('The public translation service has reached its daily quota. Try again later.');
      }
      if (result.responseStatus !== 200
        || typeof responseData !== 'object'
        || responseData === null
        || !('translatedText' in responseData)
        || typeof responseData.translatedText !== 'string') {
        throw new Error('responseDetails' in result && typeof result.responseDetails === 'string'
          ? result.responseDetails
          : 'The translation service could not translate this language pair.');
      }
      setTranslationOutput(responseData.translatedText);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.warn('[Dynamic Workspace] Translation request failed:', error);
      setTranslationError(error instanceof TypeError
        ? 'Could not reach the translation service. Check your internet connection and try again.'
        : error instanceof Error
          ? error.message
          : 'Translation could not be completed.');
    } finally {
      if (translationAbortRef.current === controller) {
        translationAbortRef.current = null;
        setTranslationLoading(false);
      }
    }
  };

  const copyTranslation = async () => {
    if (!translationOutput) return;
    try {
      await navigator.clipboard.writeText(translationOutput);
      setTranslationCopied(true);
      window.setTimeout(() => setTranslationCopied(false), 1400);
      setTranslationError(null);
    } catch (error) {
      console.warn('[Dynamic Workspace] Could not copy translated text:', error);
      setTranslationError('Clipboard access was denied. Select and copy the translated text instead.');
    }
  };

  const addDashboardTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = newDashboardTask.trim();
    if (!title) return;
    setDashboardTasks(tasks => [{ id: `task-${Date.now()}`, title, completed: false, createdAt: Date.now() }, ...tasks]);
    setNewDashboardTask('');
  };

  const sendGhostMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = ghostPrompt.trim();
    if (!content || ghostBusy) return;
    const requestDetective = routeGhostRequest(content, selectedDetective);
    const userMessage: NotchGhostMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    const nextMessages = [...ghostMessages, userMessage];
    setGhostMessages(nextMessages);
    setGhostPrompt('');
    setGhostError('');
    setGhostBusy(true);
    const requestId = crypto.randomUUID();
    ghostRequestIdRef.current = requestId;
    const host: GhostToolHost = {
      openApp: appId => {
        if (!Object.hasOwn(APP_REGISTRY, appId) || !APP_REGISTRY[appId].installed || appId === 'trash') return false;
        openApp(appId);
        return true;
      },
      closeApp: appId => {
        const target = [...windows].reverse().find(win =>
          (appId ? win.appId === appId : win.isFocused) && !win.isMinimized,
        );
        if (!target) return false;
        closeWindow(target.id);
        return true;
      },
      createDesktopItem: createGhostDesktopItem,
      renameDesktopItem: renameGhostDesktopItem,
      deleteDesktopItem: deleteGhostDesktopItem,
      showDesktop,
      getLocalTime: getGhostLocalTime,
      getBatteryStatus: () => ({
        available: settings.batteryAvailable,
        level: settings.batteryLevel,
        charging: settings.batteryCharging,
        plugged: settings.batteryPlugged,
      }),
      setFocusMode: enabled => updateSettings({ doNotDisturb: enabled }),
      searchAuthorizedFiles: searchGhostAuthorizedFiles,
      getSystemInfo: async () => {
        if (!window.electronAPI?.getResourceUsage) throw new Error('System resource information is unavailable.');
        const usage = await window.electronAPI.getResourceUsage();
        const cpu = usage.cpuPercent === null ? 'unavailable' : `${Math.round(usage.cpuPercent)}%`;
        const memory = usage.memoryUsedBytes === null || usage.memoryTotalBytes === null
          ? 'unavailable'
          : `${(usage.memoryUsedBytes / 1024 ** 3).toFixed(1)} GB of ${(usage.memoryTotalBytes / 1024 ** 3).toFixed(1)} GB`;
        return `CPU usage: ${cpu}. Memory: ${memory}.`;
      },
      arrangeWindow: (appId, position) => {
        const candidates = windows.filter(win => win.appId === appId && !win.isMinimized);
        const focused = candidates.filter(win => win.isFocused);
        const target = focused.length === 1 ? focused[0] : candidates.length === 1 ? candidates[0] : null;
        if (!target) {
          return {
            success: false,
            result: candidates.length
              ? `There are multiple open ${APP_REGISTRY[appId as keyof typeof APP_REGISTRY]?.name ?? 'app'} windows. Specify which one to arrange.`
              : 'That app does not have an open window.',
          };
        }
        snapWindow(target.id, position);
        return { success: true, result: `${APP_REGISTRY[appId as keyof typeof APP_REGISTRY].name} moved to ${position}.` };
      },
    };
    try {
      const answer = await runGhostChat(
        nextMessages.slice(-20).map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        user.displayName,
        host,
        {
          name: requestDetective.name,
          role: requestDetective.role,
          personality: requestDetective.personality,
          description: requestDetective.description,
          skills: [...requestDetective.skills],
          instructions: 'instructions' in requestDetective ? requestDetective.instructions : '',
          permittedTools: [...requestDetective.permittedTools],
        },
        requestId,
      );
      setGhostMessages(current => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        createdAt: Date.now(),
      }]);
    } catch (error) {
      console.error('[Dynamic Workspace] Ghost chat request failed:', error);
      setGhostError(error instanceof GhostChatError
        ? error.message
        : error instanceof Error ? error.message : 'Ghost could not complete that request.');
    } finally {
      if (ghostRequestIdRef.current === requestId) ghostRequestIdRef.current = null;
      setGhostBusy(false);
    }
  };

  const latestNotification = notifications.find(item => !item.read) ?? notifications[0];
  const unreadCount = notifications.filter(item => !item.read).length;
  const size = SHAPE_SIZES[settings.jellyNotchShape];
  const compactWidth = settings.jellyNotchShape === 'custom' ? settings.jellyNotchWidth : size.width;
  const compactHeight = settings.jellyNotchShape === 'custom' ? settings.jellyNotchHeight : size.height;
  const enabledWidgetCount = NOTCH_WIDGETS.filter(widget =>
    widget.id !== 'fileTray'
      && (settings.jellyNotchWidgets[widget.id] || (widget.id === 'stopwatch' && stopwatchStartedAt !== null)),
  ).length;
  const todayKey = getLocalDateKey(now);
  const todayScreenTime = screenTimeDays[todayKey] ?? {};
  const screenTimeRanking = Object.entries(todayScreenTime)
    .map(([appId, duration]) => ({ appId, duration, app: APP_REGISTRY[appId] }))
    .filter((item): item is { appId: string; duration: number; app: (typeof APP_REGISTRY)[string] } => !!item.app)
    .sort((left, right) => right.duration - left.duration);
  const totalScreenTimeMs = Object.values(todayScreenTime).reduce((total, duration) => total + duration, 0);
  const healthToday = getHealthDay(healthHistory, now);
  const healthStreak = calculateHealthStreak(healthHistory, now);
  const breakSinceText = healthToday.lastBreakAt === null
    ? 'No break logged yet'
    : `${formatDuration(Math.max(0, now.getTime() - healthToday.lastBreakAt))} since your last break`;
  const healthRingValues = [
    { label: 'Breaks', value: healthToday.breakCount, goal: settings.health.breakGoal, color: '#5ee0a0', icon: Footprints },
    { label: 'Water', value: healthToday.waterGlasses, goal: settings.health.waterGoalGlasses, color: '#6ccafa', icon: Droplets },
    { label: 'Mindful', value: healthToday.mindfulMinutes, goal: settings.health.mindfulGoalMinutes, color: '#b699ff', icon: Wind },
  ];
  const healthActivityRemainingSeconds = healthActivity
    ? Math.max(0, Math.ceil((healthActivity.endsAt - now.getTime()) / 1000))
    : 0;
  const eyeBreakRemainingSeconds = eyeBreakEndAt === null
    ? 0
    : Math.max(0, Math.ceil((eyeBreakEndAt - now.getTime()) / 1000));
  const breathPattern = healthActivity?.kind === 'breathe'
    ? healthActivity.pattern === 'box'
      ? [{ label: 'Breathe in', seconds: 4 }, { label: 'Hold', seconds: 4 }, { label: 'Breathe out', seconds: 4 }, { label: 'Hold', seconds: 4 }]
      : [{ label: 'Breathe in', seconds: 4 }, { label: 'Hold', seconds: 2 }, { label: 'Breathe out', seconds: 6 }]
    : [];
  const breathElapsedSeconds = healthActivity?.kind === 'breathe'
    ? Math.max(0, Math.floor((now.getTime() - healthActivity.startedAt) / 1000))
    : 0;
  const breathCycleSeconds = breathPattern.reduce((total, stage) => total + stage.seconds, 0);
  const breathCyclePosition = breathCycleSeconds > 0 ? breathElapsedSeconds % breathCycleSeconds : 0;
  let breathStageOffset = 0;
  const breathStage = breathPattern.find(stage => {
    const includes = breathCyclePosition < breathStageOffset + stage.seconds;
    breathStageOffset += stage.seconds;
    return includes;
  });
  const breathStageRemaining = breathStage ? Math.max(1, breathStageOffset - breathCyclePosition) : 0;
  const healthActivityLabel = healthActivity?.kind === 'move'
    ? 'Movement break'
    : healthActivity?.kind === 'stretch'
      ? ['Neck & shoulders', 'Shoulder rolls', 'Standing stretch'][Math.min(2, Math.floor((healthActivity.durationSeconds - healthActivityRemainingSeconds) / Math.max(1, healthActivity.durationSeconds / 3)))]
      : 'Guided breathing';
  const pomodoroPhaseMinutes = pomodoro.phase === 'work'
    ? pomodoro.workMinutes
    : pomodoro.phase === 'shortBreak'
      ? pomodoro.shortBreakMinutes
      : pomodoro.longBreakMinutes;
  const pomodoroRemainingMs = pomodoro.endAt === null
    ? pomodoro.remainingMs
    : Math.max(0, pomodoro.endAt - pomodoroNow);
  const pomodoroSeconds = Math.ceil(pomodoroRemainingMs / 1000);
  const pomodoroProgress = pomodoroPhaseMinutes > 0
    ? Math.min(1, Math.max(0, 1 - pomodoroRemainingMs / (pomodoroPhaseMinutes * 60_000)))
    : 0;
  const pomodoroSessionsToday = pomodoro.sessionDate === todayKey ? pomodoro.sessionsCompleted : 0;
  const focusedWindow = useMemo(() => windows.find(windowState =>
    windowState.isFocused
    && !windowState.isMinimized
    && (!windowState.desktopSpaceId || windowState.desktopSpaceId === activeSpaceId),
  ) ?? null, [activeSpaceId, windows]);
  const selectedDashboardNote = dashboardNotes.find(note => note.id === selectedDashboardNoteId) ?? dashboardNotes[0] ?? null;
  const noteCount = dashboardNotes.length;
  const expandedWidth = settings.jellyNotchDashboard
    ? Math.min(680, Math.max(360, window.innerWidth - 24))
    : 480;
  const timerSeconds = Math.ceil(timerRemainingMs / 1000);
  const timerProgress = timerPreset > 0
    ? Math.max(0, Math.min(1, 1 - timerRemainingMs / (timerPreset * 1000)))
    : 0;

  const stopCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    cameraStreamRef.current = null;
    setCameraReady(false);
    setCameraPreviewPlaying(false);
  };

  const captureNotchPhoto = async (): Promise<{ success: boolean; result: string }> => {
    const video = cameraPreviewRef.current;
    if (!cameraStreamRef.current || !cameraPreviewPlaying || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return { success: false, result: 'The notch camera is not ready. No photo was taken.' };
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context || !canvas.width || !canvas.height) throw new Error('Camera preview has no image to capture.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not encode the camera photo.')), 'image/jpeg', 0.94);
      });
      await addPhotoToLibrary(photo, {
        width: canvas.width,
        height: canvas.height,
        facingMode: 'user',
        source: 'Dynamic Workspace camera',
      });
      setCameraFeedback('Photo saved to Photos');
      addNotification({
        appId: 'camera',
        title: 'Photo saved',
        message: 'Your notch camera photo was saved to Photos.',
        type: 'system',
      });
      return { success: true, result: 'Photo captured and saved to Photos. The image was not shared with Ghost.' };
    } catch (error) {
      console.error('[Dynamic Workspace] Could not save camera photo:', error);
      setCameraFeedback(error instanceof Error ? error.message : 'Could not save the camera photo.');
      return { success: false, result: error instanceof Error ? error.message : 'Could not save the camera photo.' };
    }
  };

  const startNotchVideoRecording = (durationSeconds?: number): Promise<{ success: boolean; result: string }> =>
    new Promise(resolve => {
      const stream = cameraStreamRef.current;
      if (!stream || !cameraPreviewPlaying || typeof MediaRecorder === 'undefined') {
        resolve({ success: false, result: 'Video recording is unavailable. No video was recorded.' });
        return;
      }
      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : '';
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        cameraChunksRef.current = [];
        recorder.ondataavailable = event => {
          if (event.data.size > 0) cameraChunksRef.current.push(event.data);
        };
        recorder.onerror = event => {
          console.error('[Dynamic Workspace] Camera video recording failed:', event);
          if (cameraRecordingTimeoutRef.current !== null) window.clearTimeout(cameraRecordingTimeoutRef.current);
          cameraRecordingTimeoutRef.current = null;
          setCameraRecording(false);
          setCameraFeedback('Camera recording failed');
          resolve({ success: false, result: 'Camera video recording failed.' });
        };
        recorder.onstop = async () => {
          if (cameraRecordingTimeoutRef.current !== null) window.clearTimeout(cameraRecordingTimeoutRef.current);
          cameraRecordingTimeoutRef.current = null;
          setCameraRecording(false);
          setCameraRecordingSeconds(0);
          const blob = new Blob(cameraChunksRef.current, { type: recorder.mimeType || 'video/webm' });
          cameraChunksRef.current = [];
          if (!blob.size) {
            setCameraFeedback('The recording was empty');
            resolve({ success: false, result: 'The camera recording was empty and was not saved.' });
            return;
          }
          try {
            await addVideoToLibrary(blob, {
              facingMode: 'user',
              duration: cameraRecordingStartedAtRef.current
                ? Math.max(1, Math.round((Date.now() - cameraRecordingStartedAtRef.current) / 1000))
                : undefined,
              source: 'Dynamic Workspace camera',
            });
            setCameraFeedback('Video saved to Photos');
            addNotification({
              appId: 'camera',
              title: 'Video saved',
              message: 'Your notch camera recording was saved to Photos.',
              type: 'system',
            });
            resolve({ success: true, result: 'Video recorded and saved to Photos. It was not shared with Ghost.' });
          } catch (error) {
            console.error('[Dynamic Workspace] Could not save camera video:', error);
            setCameraFeedback(error instanceof Error ? error.message : 'Could not save the camera video.');
            resolve({ success: false, result: error instanceof Error ? error.message : 'Could not save the camera video.' });
          }
        };
        recorder.start();
        cameraRecorderRef.current = recorder;
        cameraRecordingStartedAtRef.current = Date.now();
        setCameraFeedback('');
        setCameraRecording(true);
        setCameraRecordingSeconds(0);
        if (durationSeconds !== undefined) {
          cameraRecordingTimeoutRef.current = window.setTimeout(() => {
            if (recorder.state !== 'inactive') recorder.stop();
          }, durationSeconds * 1000);
        }
      } catch (error) {
        console.error('[Dynamic Workspace] Could not start camera video recording:', error);
        setCameraFeedback(error instanceof Error ? error.message : 'Could not start camera video recording.');
        resolve({ success: false, result: error instanceof Error ? error.message : 'Could not start camera video recording.' });
      }
    });

  const cancelPendingCameraRequest = () => {
    pendingCameraRequest?.resolve({ success: false, result: 'Camera capture was declined. No media was recorded.' });
    cameraRequestResolverRef.current = null;
    setPendingCameraRequest(null);
    setPinned(false);
    setExpanded(false);
  };

  const approvePendingCameraRequest = async () => {
    const request = pendingCameraRequest;
    if (!request || !cameraPreviewPlaying) return;
    setPendingCameraRequest(null);
    const result = request.kind === 'photo'
      ? await captureNotchPhoto()
      : await startNotchVideoRecording(request.durationSeconds ?? 10);
    request.resolve(result);
    cameraRequestResolverRef.current = null;
    setPinned(false);
  };

  useEffect(() => {
    const enabled = settings.jellyNotchEnabled && settings.jellyNotchWidgets.camera;
    if (!enabled) {
      if (cameraRecorderRef.current?.state !== 'inactive') cameraRecorderRef.current?.stop();
      stopCameraStream();
      setCameraError('');
      return;
    }
    let active = true;
    setCameraError('');
    setCameraReady(false);
    setCameraPreviewPlaying(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable in this window.');
      return;
    }
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        cameraStreamRef.current = stream;
        setCameraReady(true);
      })
      .catch(error => {
        console.error('[Dynamic Workspace] Could not start the camera preview:', error);
        if (active) setCameraError(error instanceof Error && error.name === 'NotAllowedError'
          ? 'Allow camera access to show the preview.'
          : 'Camera unavailable. Check that it is connected and not in use.');
      });
    return () => {
      active = false;
      if (cameraRecorderRef.current?.state !== 'inactive') cameraRecorderRef.current?.stop();
      stopCameraStream();
    };
  }, [settings.jellyNotchEnabled, settings.jellyNotchWidgets.camera]);

  useEffect(() => {
    const preview = cameraPreviewElement;
    const stream = cameraStreamRef.current;
    if (!cameraReady || !preview || !stream) return;

    let disposed = false;
    const markPlaying = () => {
      if (disposed) return;
      setCameraPreviewPlaying(true);
      setCameraError('');
    };
    const markNotPlaying = () => {
      if (!disposed) setCameraPreviewPlaying(false);
    };
    const startPlayback = () => {
      if (disposed) return;
      void preview.play().catch(error => {
        if (disposed) return;
        setCameraPreviewPlaying(false);
        setCameraError(error instanceof Error && error.name === 'NotAllowedError'
          ? 'Camera preview playback was blocked.'
          : 'Camera is connected, but its live preview did not start.');
        console.error('[Dynamic Workspace] Camera preview playback did not start:', error);
      });
    };

    preview.muted = true;
    preview.playsInline = true;
    preview.addEventListener('loadedmetadata', startPlayback);
    preview.addEventListener('loadeddata', startPlayback);
    preview.addEventListener('canplay', startPlayback);
    preview.addEventListener('playing', markPlaying);
    preview.addEventListener('pause', markNotPlaying);
    preview.addEventListener('emptied', markNotPlaying);
    preview.addEventListener('error', markNotPlaying);
    preview.srcObject = stream;
    startPlayback();

    return () => {
      disposed = true;
      preview.removeEventListener('loadedmetadata', startPlayback);
      preview.removeEventListener('loadeddata', startPlayback);
      preview.removeEventListener('canplay', startPlayback);
      preview.removeEventListener('playing', markPlaying);
      preview.removeEventListener('pause', markNotPlaying);
      preview.removeEventListener('emptied', markNotPlaying);
      preview.removeEventListener('error', markNotPlaying);
      if (preview.srcObject === stream) {
        preview.pause();
        preview.srcObject = null;
      }
    };
  }, [cameraReady, cameraPreviewElement]);

  useEffect(() => {
    if (!cameraRecording) return;
    const timer = window.setInterval(() => {
      if (cameraRecordingStartedAtRef.current !== null) {
        setCameraRecordingSeconds(Math.floor((Date.now() - cameraRecordingStartedAtRef.current) / 1000));
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [cameraRecording]);

  useEffect(() => {
    const handleCameraCaptureRequest = (event: Event) => {
      const request = (event as CustomEvent<NotchCameraCaptureRequest>).detail;
      if (!request || !settings.jellyNotchEnabled || !settings.jellyNotchWidgets.camera) {
        request?.resolve({ success: false, result: 'Enable the notch Camera widget first. No camera capture was made.' });
        return;
      }
      if (cameraRequestResolverRef.current) {
        request.resolve({ success: false, result: 'Another camera approval is already waiting.' });
        return;
      }
      cameraRequestResolverRef.current = request.resolve;
      setPendingCameraRequest(request);
      setPinned(true);
      setHovered(false);
      setExpanded(true);
    };
    window.addEventListener(NOTCH_CAMERA_CAPTURE_REQUEST_EVENT, handleCameraCaptureRequest);
    return () => {
      window.removeEventListener(NOTCH_CAMERA_CAPTURE_REQUEST_EVENT, handleCameraCaptureRequest);
      cameraRequestResolverRef.current?.({ success: false, result: 'Camera widget was disabled before approval. No capture was made.' });
      cameraRequestResolverRef.current = null;
    };
  }, [settings.jellyNotchEnabled, settings.jellyNotchWidgets.camera]);

  useEffect(() => {
    const liveHealthTimer = healthActivity !== null || eyeBreakEndAt !== null;
    if (liveHealthTimer) {
      const clock = window.setInterval(() => setNow(new Date()), 1000);
      return () => window.clearInterval(clock);
    }
    const firstMinuteTick = 60_000 - (Date.now() % 60_000);
    let minuteClock: number | null = null;
    const firstTick = window.setTimeout(() => {
      setNow(new Date());
      minuteClock = window.setInterval(() => setNow(new Date()), 60_000);
    }, firstMinuteTick);
    return () => {
      window.clearTimeout(firstTick);
      if (minuteClock !== null) window.clearInterval(minuteClock);
    };
  }, [healthActivity, eyeBreakEndAt]);

  useEffect(() => {
    const openPomodoro = () => {
      setView('pomodoro');
      setPinned(true);
      setHovered(false);
      setExpanded(true);
    };
    window.addEventListener(OPEN_POMODORO_EVENT, openPomodoro);
    return () => window.removeEventListener(OPEN_POMODORO_EVENT, openPomodoro);
  }, []);

  useEffect(() => vfs.subscribe(() => {
    const trayFiles = vfs.getFiles(NOTCH_TRAY_PATH).map(toTrayItem);
    setTrayItems(current => {
      const externalItems = current.filter(item => !item.virtualFileId);
      const knownIds = new Set(trayFiles.map(item => item.virtualFileId));
      return [...trayFiles, ...externalItems.filter(item => !knownIds.has(item.virtualFileId))];
    });
  }), []);

  useEffect(() => {
    if (timerEndAt === null) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, timerEndAt - Date.now());
      setTimerRemainingMs(remaining);
      if (remaining === 0) {
        setTimerEndAt(null);
        if (settings.jellyNotchWidgets.timer) {
          setPinned(false);
          setHovered(false);
          setExpanded(false);
          showSystemIndicator({ kind: 'timerComplete' });
        }
        addNotification({
          title: 'Timer complete',
          message: 'Your Dynamic Workspace timer has finished.',
          type: 'system',
          appName: 'Clock',
        });
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [addNotification, settings.jellyNotchWidgets.timer, showSystemIndicator, timerEndAt]);

  useEffect(() => {
    const previous = previousSystemSettings.current;
    const brightnessChanged = previous.brightness !== settings.brightness;
    const volumeChanged = previous.soundVolume !== settings.soundVolume;
    const bluetoothChanged = previous.bluetoothEnabled !== settings.bluetoothEnabled
      || previous.bluetoothConnected !== settings.bluetoothConnected
      || previous.bluetoothDeviceName !== settings.bluetoothDeviceName;

    previousSystemSettings.current = {
      brightness: settings.brightness,
      soundVolume: settings.soundVolume,
      bluetoothEnabled: settings.bluetoothEnabled,
      bluetoothConnected: settings.bluetoothConnected,
      bluetoothDeviceName: settings.bluetoothDeviceName,
    };

    if (bluetoothChanged) {
      showSystemIndicator({
        kind: 'bluetooth',
        enabled: settings.bluetoothEnabled,
        connected: settings.bluetoothConnected,
        deviceName: settings.bluetoothDeviceName,
      });
    } else if (brightnessChanged) {
      showSystemIndicator({ kind: 'brightness', value: settings.brightness });
    } else if (volumeChanged) {
      showSystemIndicator({ kind: 'volume', value: settings.soundVolume * 100 });
    } else {
      return;
    }
  }, [
    settings.brightness,
    settings.soundVolume,
    settings.bluetoothEnabled,
    settings.bluetoothConnected,
    settings.bluetoothDeviceName,
    showSystemIndicator,
  ]);

  useEffect(() => {
    if (!settings.jellyNotchEnabled || !settings.jellyNotchWidgets.clipboard) return;
    const api = window.electronAPI;
    if (!api) return;
    const unsubscribe = api.onNotchClipboardActivity(activity => {
      showSystemIndicator({ kind: 'clipboard', preview: activity.preview || 'Text copied' });
    });
    void api.setNotchClipboardMonitoring(true).catch(error => {
      console.warn('[Dynamic Workspace] Could not start clipboard activity monitoring:', error);
    });
    return () => {
      unsubscribe();
      void api.setNotchClipboardMonitoring(false).catch(error => {
        console.warn('[Dynamic Workspace] Could not stop clipboard activity monitoring:', error);
      });
    };
  }, [settings.jellyNotchEnabled, settings.jellyNotchWidgets.clipboard, showSystemIndicator]);

  useEffect(() => {
    if (!settings.jellyNotchEnabled || !settings.jellyNotchWidgets.deviceActivity) return;
    const api = window.electronAPI;
    if (!api) return;
    const unsubscribe = api.onNotchDeviceActivity(activity => {
      setLastDeviceActivity(activity);
      showSystemIndicator({
        kind: 'device',
        deviceKind: activity.kind,
        connected: activity.connected,
        deviceName: activity.deviceName,
      });
    });
    void api.setNotchDeviceMonitoring(true).catch(error => {
      console.warn('[Dynamic Workspace] Could not start device activity monitoring:', error);
    });
    return () => {
      unsubscribe();
      void api.setNotchDeviceMonitoring(false).catch(error => {
        console.warn('[Dynamic Workspace] Could not stop device activity monitoring:', error);
      });
    };
  }, [settings.jellyNotchEnabled, settings.jellyNotchWidgets.deviceActivity, showSystemIndicator]);

  useEffect(() => {
    let active = true;
    const handleHostMediaState = (state: SystemMediaState) => {
      const previous = hostMediaBaseline.current;
      if (!previous) {
        hostMediaBaseline.current = state;
        return;
      }

      const brightnessChanged = state.brightness !== null
        && previous.brightness !== null
        && state.brightness !== previous.brightness;
      const volumeChanged = state.volume !== null
        && previous.volume !== null
        && state.volume !== previous.volume;
      hostMediaBaseline.current = {
        brightness: state.brightness ?? previous.brightness,
        volume: state.volume ?? previous.volume,
      };

      if (brightnessChanged) {
        showSystemIndicator({ kind: 'brightness', value: state.brightness ?? previous.brightness ?? 0 });
      } else if (volumeChanged) {
        showSystemIndicator({ kind: 'volume', value: state.volume ?? previous.volume ?? 0 });
      }
    };
    const unsubscribe = window.electronAPI?.onSystemMediaState?.(handleHostMediaState);
    void window.electronAPI?.getSystemMediaState?.().then(state => {
      if (active && hostMediaBaseline.current === null) hostMediaBaseline.current = state;
    }).catch(error => {
      console.warn('[Dynamic Workspace] Could not read native brightness and volume:', error);
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [showSystemIndicator]);

  useEffect(() => () => {
    if (systemIndicatorTimeout.current !== null) {
      window.clearTimeout(systemIndicatorTimeout.current);
    }
    if (trayDropTimeout.current !== null) window.clearTimeout(trayDropTimeout.current);
    trayItemsRef.current.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    trayDragPreviewRef.current.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }, []);

  const clearDragPreview = () => {
    trayDragPreviewRef.current.forEach(item => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    trayDragPreviewRef.current = [];
    setTrayDragPreview([]);
  };

  const updateDragPreview = (dataTransfer: DataTransfer) => {
    const previews: NotchDragPreview[] = [];
    const files = Array.from(dataTransfer.files);
    files.forEach((file, index) => {
      previews.push({
        id: `${file.name}:${file.lastModified}:${index}`,
        name: file.name,
        type: file.type,
        isDirectory: false,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      });
    });

    if (previews.length === 0 && dataTransfer.types.includes('application/x-abhishek-os-items')) {
      try {
        const payload = JSON.parse(dataTransfer.getData('application/x-abhishek-os-items')) as {
          items?: Array<{ id?: string; name?: string; type?: string; size?: number }>;
        };
        payload.items?.forEach((item, index) => {
          if (typeof item.name !== 'string') return;
          previews.push({
            id: item.id || `${item.name}:${index}`,
            name: item.name,
            type: item.type || 'file',
            isDirectory: item.type === 'folder',
          });
        });
      } catch {
        // Some operating systems withhold drag metadata until drop.
      }
    }

    const fingerprint = previews.map(item => `${item.id}:${item.name}:${item.type}`).join('|');
    const currentFingerprint = trayDragPreviewRef.current.map(item => `${item.id}:${item.name}:${item.type}`).join('|');
    if (fingerprint === currentFingerprint) {
      previews.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return;
    }
    clearDragPreview();
    trayDragPreviewRef.current = previews;
    setTrayDragPreview(previews);
  };

  const beginTrayDrag = (dataTransfer: DataTransfer) => {
    setTrayDragActive(true);
    setExpanded(true);
    updateDragPreview(dataTransfer);
  };

  const endTrayDrag = () => {
    setTrayDragActive(false);
    clearDragPreview();
  };

  const addDroppedItems = async (dataTransfer: DataTransfer) => {
    const collected: NotchTrayItem[] = [];
    const moveErrors: string[] = [];
    if (dataTransfer.types.includes('application/x-abhishek-os-items')) {
      let payload: { items?: Array<{ id?: string; name?: string; type?: string; size?: number; extension?: string }> } | undefined;
      try {
        payload = JSON.parse(dataTransfer.getData('application/x-abhishek-os-items')) as typeof payload;
      } catch (error) {
        console.error('[Dynamic Workspace] Could not parse ARLO dragged items:', error);
        moveErrors.push('Could not read the dragged ARLO item details.');
      }
      payload?.items?.forEach((item, index) => {
        try {
          if (typeof item.name !== 'string') return;
          const virtualFile = item.id ? vfs.getFileById(item.id) : undefined;
          if (virtualFile && !virtualFile.isDeleted) {
            const moved = virtualFile.path === NOTCH_TRAY_PATH
              ? { moved: [virtualFile] }
              : vfs.moveFiles([virtualFile.id], NOTCH_TRAY_PATH);
            if (moved.error) throw new Error(moved.error);
            collected.push(toTrayItem(moved.moved[0]));
            return;
          }
          const isDirectory = item.type === 'folder';
          collected.push({
            id: `arlo:${item.id || item.name}:${Date.now()}:${index}`,
            name: item.name,
            relativePath: item.name,
            type: isDirectory ? 'folder' : item.type || 'application/octet-stream',
            size: typeof item.size === 'number' ? item.size : 0,
            isDirectory,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Could not move this item into the Files Tray.';
          console.error(`[Dynamic Workspace] Could not move "${item.name || 'item'}" into the Files Tray:`, error);
          moveErrors.push(message);
        }
      });
    }
    const readEntry = async (entry: FileSystemEntry, parentPath = ''): Promise<void> => {
      const relativePath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
      if (entry.isFile) {
        const file = await new Promise<File>((resolve, reject) => {
          (entry as FileSystemFileEntry).file(resolve, reject);
        });
        const objectUrl = URL.createObjectURL(file);
        collected.push({
          id: `${relativePath}:${file.lastModified}:${Math.random().toString(36).slice(2)}`,
          name: file.name,
          relativePath,
          type: file.type || 'application/octet-stream',
          size: file.size,
          isDirectory: false,
          file,
          objectUrl,
          previewUrl: file.type.startsWith('image/') ? objectUrl : undefined,
        });
        return;
      }
      if (!entry.isDirectory) return;
      collected.push({
        id: `${relativePath}:${Math.random().toString(36).slice(2)}`,
        name: entry.name,
        relativePath,
        type: 'folder',
        size: 0,
        isDirectory: true,
      });
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const children: FileSystemEntry[] = [];
      while (true) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject);
        });
        if (batch.length === 0) break;
        children.push(...batch);
      }
      await Promise.all(children.map(child => readEntry(child, relativePath)));
    };

    try {
      for (const item of Array.from(dataTransfer.items)) {
        const entry = item.webkitGetAsEntry?.();
        if (entry) {
          await readEntry(entry);
          continue;
        }
        const file = item.getAsFile();
        if (file) {
          const objectUrl = URL.createObjectURL(file);
          collected.push({
            id: `${file.name}:${file.lastModified}:${Math.random().toString(36).slice(2)}`,
            name: file.name,
            relativePath: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
            isDirectory: false,
            file,
            objectUrl,
            previewUrl: file.type.startsWith('image/') ? objectUrl : undefined,
          });
        }
      }
      if (collected.length > 0) {
        setTrayItems(current => {
          const knownIds = new Set(current.map(item => item.virtualFileId).filter(Boolean));
          return [...current, ...collected.filter(item => !item.virtualFileId || !knownIds.has(item.virtualFileId))];
        });
        setTrayError(moveErrors[0] || '');
        setTrayDropComplete(`${collected.length} ${collected.length === 1 ? 'item added' : 'items added'}`);
        if (trayDropTimeout.current !== null) window.clearTimeout(trayDropTimeout.current);
        trayDropTimeout.current = window.setTimeout(() => {
          setTrayDropComplete('');
          setTrayDropFailed(false);
          trayDropTimeout.current = null;
        }, 1400);
      } else {
        setTrayError(moveErrors[0] || 'This item could not be added to the tray.');
      }
    } catch (error) {
      collected.forEach(item => {
        if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
      });
      console.error('[Dynamic Workspace] Could not read dropped files:', error);
      setTrayError('Some dropped items could not be read. Try dropping them again.');
    }
  };

  useEffect(() => {
    if (!settings.jellyNotchEnabled || !settings.jellyNotchWidgets.fileTray) return;
    const handleDesktopDrag = (event: Event) => {
      const detail = (event as CustomEvent<{
        overNotch: boolean;
        item?: { id: string; name: string; type: string; isDirectory: boolean; appId?: string };
        clientX?: number;
        clientY?: number;
      }>).detail;
      if (!detail?.overNotch) {
        endTrayDrag();
        if (!trayDropActive.current) setExpanded(pinned);
        return;
      }
      setHovered(true);
      setTrayDragActive(true);
      setExpanded(true);
      if (typeof detail.clientX === 'number' && typeof detail.clientY === 'number') {
        setTrayDragPointer({
          x: Math.max(0, Math.min(100, ((detail.clientX - (window.innerWidth / 2 - 240)) / 480) * 100)),
          y: Math.max(0, Math.min(100, (detail.clientY / 118) * 100)),
        });
      }
      if (detail.item) {
        const preview: NotchDragPreview = {
          id: detail.item.id,
          name: detail.item.name,
          type: detail.item.type,
          isDirectory: detail.item.isDirectory,
          appId: detail.item.appId,
        };
        clearDragPreview();
        trayDragPreviewRef.current = [preview];
        setTrayDragPreview([preview]);
      }
    };
    const handleDesktopDrop = (event: Event) => {
      const item = (event as CustomEvent<{
        id: string;
        name: string;
        type: string;
        isDirectory: boolean;
        size: number;
        appId?: string;
        virtualFileId?: string;
        success?: boolean;
        error?: string;
      }>).detail;
      if (!item?.name) return;
      if (item.success === false) {
        trayDropActive.current = true;
        endTrayDrag();
        setTrayDropFailed(true);
        setTrayDropComplete(item.error || `Could not move ${item.name}`);
        if (trayDropTimeout.current !== null) window.clearTimeout(trayDropTimeout.current);
        trayDropTimeout.current = window.setTimeout(() => {
          setTrayDropComplete('');
          setTrayDropFailed(false);
          trayDropTimeout.current = null;
          trayDropActive.current = false;
          setHovered(false);
          setExpanded(pinned);
        }, 1600);
        return;
      }
      trayDropActive.current = true;
      endTrayDrag();
      const virtualFile = item.virtualFileId ? vfs.getFileById(item.virtualFileId) : undefined;
      setTrayItems(current => {
        if (item.virtualFileId && current.some(candidate => candidate.virtualFileId === item.virtualFileId)) return current;
        return [...current, virtualFile
          ? toTrayItem(virtualFile)
          : {
              id: `desktop:${item.id}:${Date.now()}`,
              name: item.name,
              relativePath: item.name,
              type: item.isDirectory ? 'folder' : item.appId ? 'app' : item.type,
              size: item.size,
              isDirectory: item.isDirectory,
              appId: item.appId,
              desktopItemId: item.id,
            }];
      });
      setTrayError('');
      setTrayDropFailed(false);
      setTrayDropComplete(`${item.name} added`);
      if (trayDropTimeout.current !== null) window.clearTimeout(trayDropTimeout.current);
      trayDropTimeout.current = window.setTimeout(() => {
        setTrayDropComplete('');
        trayDropTimeout.current = null;
        trayDropActive.current = false;
        setHovered(false);
        setExpanded(pinned);
      }, 1400);
    };
    window.addEventListener('desktop:item-drag-over-notch', handleDesktopDrag);
    window.addEventListener('desktop:item-drop-to-notch', handleDesktopDrop);
    return () => {
      window.removeEventListener('desktop:item-drag-over-notch', handleDesktopDrag);
      window.removeEventListener('desktop:item-drop-to-notch', handleDesktopDrop);
      endTrayDrag();
    };
  }, [settings.jellyNotchEnabled, settings.jellyNotchWidgets.fileTray, pinned]);

  const returnTrayItemToDesktop = (item: NotchTrayItem) => {
    if (item.virtualFileId) {
      const result = vfs.moveFiles([item.virtualFileId], DESKTOP_PATH);
      if (result.error) {
        setTrayError(result.error);
        return;
      }
      removeTrayItem(item.id);
      return;
    }
    if (item.appId && item.desktopItemId) {
      window.dispatchEvent(new CustomEvent('desktop:restore-app-shortcut', {
        detail: { id: item.desktopItemId, appId: item.appId, name: item.name },
      }));
      removeTrayItem(item.id);
    }
  };

  const removeTrayItem = (id: string) => {
    const item = trayItemsRef.current.find(candidate => candidate.id === id);
    if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
    setTrayItems(current => {
      return current.filter(candidate => candidate.id !== id);
    });
  };

  const clearTray = () => {
    trayItems.forEach(item => {
      if (item.virtualFileId || item.appId) {
        returnTrayItemToDesktop(item);
      } else {
        removeTrayItem(item.id);
      }
    });
  };

  useEffect(() => {
    if (!notchSettingsOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotchSettingsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [notchSettingsOpen]);

  const displayedTime = useMemo(
    () => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now),
    [now],
  );
  const calendarTitle = useMemo(
    () => new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth),
    [calendarMonth],
  );
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const offset = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [calendarMonth]);

  useEffect(() => {
    if (!settings.jellyNotchWidgets.weather || weather) return;
    let active = true;
    const load = async () => {
      setWeatherLoading(true);
      setWeatherError(false);
      try {
        let data: WeatherData | null = null;
        const savedLocation = localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY);
        if (savedLocation) {
          try {
            const location = JSON.parse(savedLocation) as WeatherData['location'];
            if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
              data = await fetchWeather(location.latitude, location.longitude, location);
            }
          } catch (error) {
            console.warn('[Dynamic Workspace] Could not load the saved weather location:', error);
          }
        }
        if (!data) {
          const locations = await searchLocations(settings.region?.trim() || 'Pune');
          const location = locations[0];
          if (!location) throw new Error('No weather location found for this region.');
          data = await fetchWeather(location.latitude, location.longitude, location);
        }
        if (active) setWeather(data);
      } catch (error) {
        console.error('[Dynamic Workspace] Could not load weather:', error);
        if (active) setWeatherError(true);
      } finally {
        if (active) setWeatherLoading(false);
      }
    };
    void load();
    const refresh = () => {
      setWeather(null);
      setWeatherError(false);
    };
    window.addEventListener(WEATHER_LOCATION_UPDATED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(WEATHER_LOCATION_UPDATED_EVENT, refresh);
    };
  }, [settings.jellyNotchWidgets.weather, settings.region, weather]);

  if (!settings.jellyNotchEnabled) return null;

  const close = () => {
    hoveredRef.current = false;
    pinnedRef.current = false;
    setHovered(false);
    setPinned(false);
    setExpanded(false);
  };

  const finishLaunchIntro = () => {
    if (!launchIntroActive) return;
    if (launchIntroTimerRef.current !== null) return;
    launchIntroTimerRef.current = window.setTimeout(() => {
      launchIntroTimerRef.current = null;
      setLaunchIntroActive(false);
      updateSettings({ jellyNotchStyle: 'transparent' });
      setExpanded(hoveredRef.current || pinnedRef.current);
    }, 1000);
  };

  const handlePointerEnter = () => {
    if (notchSettingsOpen) return;
    if (hoverExpandTimerRef.current !== null) {
      window.clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
    hoveredRef.current = true;
    setHovered(true);
    if (settings.notchMusicHoverControls && isPlayingMusic) {
      hoverExpandTimerRef.current = window.setTimeout(() => {
        hoverExpandTimerRef.current = null;
        setExpanded(true);
      }, 700);
    } else {
      setExpanded(true);
    }
    if (!launchIntroTriggeredRef.current) {
      launchIntroTriggeredRef.current = true;
      setLaunchIntroActive(true);
    }
  };

  const handleNotchClick = () => {
    if (notchSettingsOpen) return;
    pinnedRef.current = true;
    setPinned(true);
    setExpanded(true);
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    if (hoverExpandTimerRef.current !== null) {
      window.clearTimeout(hoverExpandTimerRef.current);
      hoverExpandTimerRef.current = null;
    }
    hoveredRef.current = false;
    setHovered(false);
    pinnedRef.current = false;
    setPinned(false);
    if (launchIntroActive) return;
    setExpanded(false);
  };

  const startTimer = () => {
    if (timerRemainingMs <= 0) setTimerRemainingMs(timerPreset * 1000);
    setTimerEndAt(Date.now() + (timerRemainingMs > 0 ? timerRemainingMs : timerPreset * 1000));
  };

  const pauseTimer = () => {
    if (timerEndAt !== null) {
      setTimerRemainingMs(Math.max(0, timerEndAt - Date.now()));
      setTimerEndAt(null);
    }
  };

  const resetTimer = () => {
    setTimerEndAt(null);
    setTimerRemainingMs(timerPreset * 1000);
  };

  const startPomodoro = () => {
    setPomodoro(current => {
      const phaseMinutes = current.phase === 'work'
        ? current.workMinutes
        : current.phase === 'shortBreak'
          ? current.shortBreakMinutes
          : current.longBreakMinutes;
      const remainingMs = current.remainingMs > 0 ? current.remainingMs : phaseMinutes * 60_000;
      return { ...current, remainingMs, endAt: Date.now() + remainingMs };
    });
  };

  const pausePomodoro = () => {
    if (pomodoro.endAt !== null && pomodoro.endAt <= Date.now()) {
      setPomodoroNow(Date.now());
      return;
    }
    setPomodoro(current => current.endAt === null
      ? current
      : { ...current, remainingMs: Math.max(0, current.endAt - Date.now()), endAt: null });
  };

  const resetPomodoro = () => {
    setPomodoro(current => ({
      ...current,
      remainingMs: (current.phase === 'work'
        ? current.workMinutes
        : current.phase === 'shortBreak'
          ? current.shortBreakMinutes
          : current.longBreakMinutes) * 60_000,
      endAt: null,
    }));
  };

  const selectPomodoroPhase = (phase: PomodoroPhase) => {
    setPomodoro(current => ({
      ...current,
      phase,
      remainingMs: (phase === 'work'
        ? current.workMinutes
        : phase === 'shortBreak'
          ? current.shortBreakMinutes
          : current.longBreakMinutes) * 60_000,
      endAt: null,
    }));
  };

  const updatePomodoroDuration = (key: 'workMinutes' | 'shortBreakMinutes' | 'longBreakMinutes', value: number) => {
    const maximum = key === 'workMinutes' ? 180 : key === 'shortBreakMinutes' ? 60 : 90;
    const minutes = Math.min(maximum, Math.max(1, Math.round(value)));
    setPomodoro(current => {
      const updated = { ...current, [key]: minutes };
      if ((key === 'workMinutes' && current.phase === 'work')
        || (key === 'shortBreakMinutes' && current.phase === 'shortBreak')
        || (key === 'longBreakMinutes' && current.phase === 'longBreak')) {
        return { ...updated, remainingMs: minutes * 60_000, endAt: null };
      }
      return updated;
    });
  };

  const startHealthActivity = (kind: HealthActivity['kind']) => {
    const startedAt = Date.now();
    if (kind === 'breathe') {
      const durationSeconds = 6 * (settings.health.breathingPattern === 'box' ? 16 : 12);
      setHealthActivity({
        kind,
        startedAt,
        endsAt: startedAt + durationSeconds * 1000,
        durationSeconds,
        pattern: settings.health.breathingPattern,
      });
    } else {
      const durationSeconds = kind === 'move' ? settings.health.movementBreakMinutes * 60 : 120;
      setHealthActivity({ kind, startedAt, endsAt: startedAt + durationSeconds * 1000, durationSeconds });
    }
    setView('health');
    setPinned(true);
    setExpanded(true);
  };

  const startEyeBreak = () => {
    setEyeBreakEndAt(Date.now() + settings.health.eyeBreakDurationSeconds * 1000);
    setPinned(true);
    setExpanded(true);
    setView('health');
  };

  const skipEyeBreak = () => setEyeBreakEndAt(null);

  const stopClick = (event: React.MouseEvent) => event.stopPropagation();
  const expandedHeight = settings.jellyNotchDashboard || view !== 'overview' ? 430 : 118;
  const surfaceOpacity = settings.jellyNotchOpacity / 100;
  const surfaceBackground = settings.jellyNotchStyle === 'solid'
    ? `rgba(0,0,0,${surfaceOpacity})`
    : settings.jellyNotchStyle === 'transparent'
      ? `linear-gradient(145deg, rgba(235,242,255,${surfaceOpacity * 0.2}), rgba(10,14,22,${surfaceOpacity * 0.36}))`
      : settings.jellyNotchStyle === 'aurora'
        ? `radial-gradient(ellipse at 18% 0%, rgba(14,165,233,${surfaceOpacity * 0.44}), transparent 56%), radial-gradient(ellipse at 100% 10%, rgba(124,58,237,${surfaceOpacity * 0.34}), transparent 52%), rgba(3,5,10,${surfaceOpacity * 0.9})`
        : `linear-gradient(145deg, rgba(35,40,51,${surfaceOpacity * 0.82}), rgba(4,6,10,${surfaceOpacity * 0.9}) 72%)`;
  const shapeRadius = typeof size.radius === 'number' ? `${size.radius}px` : size.radius;
  const menuBarSurface = settings.jellyNotchStyle === 'solid'
    ? `rgba(0,0,0,${surfaceOpacity})`
    : settings.jellyNotchStyle === 'transparent'
      ? `rgba(18,22,30,${surfaceOpacity * 0.38})`
      : settings.jellyNotchStyle === 'aurora'
        ? `linear-gradient(90deg, rgba(5,10,18,.92), rgba(7,12,24,.86), rgba(5,10,18,.92))`
        : `rgba(8,10,15,${surfaceOpacity * 0.94})`;
  const openNotchSettings = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPinned(false);
    setExpanded(false);
    setHovered(false);
    setSettingsTab('appearance');
    setNotchSettingsOpen(true);
  };
  const dashboardTabs: { id: NotchView; label: string; icon: typeof Music2 }[] = [
    { id: 'overview', label: 'Home', icon: Activity },
    ...(settings.jellyNotchWidgets.dayProgress ? [{ id: 'dayProgress' as const, label: 'Day Progress', icon: CalendarDays }] : []),
    ...(settings.jellyNotchWidgets.ghostAI ? [{ id: 'ghostAI' as const, label: 'Ghost AI', icon: Bot }] : []),
    { id: 'music', label: 'Music', icon: Music2 },
    { id: 'timer', label: 'Timer', icon: Timer },
    ...(settings.jellyNotchWidgets.pomodoro ? [{ id: 'pomodoro' as const, label: 'Pomodoro', icon: Coffee }] : []),
    ...(settings.jellyNotchWidgets.health ? [{ id: 'health' as const, label: 'Health', icon: Heart }] : []),
    { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
    { id: 'notifications', label: `Alerts${unreadCount ? ` · ${unreadCount}` : ''}`, icon: Bell },
    { id: 'calendar', label: 'Date', icon: CalendarDays },
    { id: 'weather', label: 'Weather', icon: CloudSun },
  ];
  if (settings.jellyNotchWidgets.lowBattery) {
    dashboardTabs.push({ id: 'lowBattery', label: 'Battery', icon: Battery });
  }
  if (settings.jellyNotchWidgets.translation) {
    dashboardTabs.push({ id: 'translation', label: 'Translate', icon: Languages });
  }
  if (settings.jellyNotchWidgets.windowSnap) {
    dashboardTabs.push({ id: 'windowSnap', label: 'Snap Zones', icon: Monitor });
  }
  if (settings.jellyNotchWidgets.notes) {
    dashboardTabs.push({ id: 'notes', label: `Notes${noteCount ? ` · ${noteCount}` : ''}`, icon: FileText });
  }
  if (settings.jellyNotchWidgets.screenTime) {
    dashboardTabs.push({ id: 'screenTime', label: 'Screen Time', icon: Smartphone });
  }
  if (settings.jellyNotchWidgets.todos) {
    const activeTaskCount = dashboardTasks.filter(task => !task.completed).length;
    dashboardTabs.push({
      id: 'tasks',
      label: `Tasks${activeTaskCount ? ` · ${activeTaskCount}` : ''}`,
      icon: ListTodo,
    });
  }
  dashboardTabs.push({ id: 'spaces', label: 'Spaces', icon: ExternalLink });

  return (
    <>
      <div
        ref={notchContainerRef}
        className="pointer-events-auto fixed left-1/2 top-0 z-[10001] -translate-x-1/2"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onClickCapture={handleNotchClick}
        onFocus={() => {
          setHovered(true);
          if (!notchSettingsOpen) setExpanded(true);
        }}
        onDragEnter={event => {
          if (settings.jellyNotchWidgets.fileTray && hasSupportedDrop(event.dataTransfer)) {
            event.preventDefault();
            beginTrayDrag(event.dataTransfer);
          }
        }}
        onDragOver={event => {
          if (settings.jellyNotchWidgets.fileTray && hasSupportedDrop(event.dataTransfer)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            beginTrayDrag(event.dataTransfer);
          }
        }}
        onDragLeave={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) endTrayDrag();
        }}
        onDrop={event => {
          if (settings.jellyNotchWidgets.fileTray && hasSupportedDrop(event.dataTransfer)) {
            event.preventDefault();
            event.stopPropagation();
            endTrayDrag();
            void addDroppedItems(event.dataTransfer);
          }
        }}
        onContextMenu={openNotchSettings}
        onWheel={event => {
          const strip = widgetStripRef.current;
          if (strip && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            strip.scrollLeft += event.deltaY;
          }
        }}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHovered(false);
            setExpanded(pinned);
          }
        }}
      >
        <motion.section
        layout
        initial={false}
        animate={{
          width: expanded ? expandedWidth : compactWidth,
          height: expanded ? expandedHeight : compactHeight,
          borderRadius: expanded ? '0 0 22px 22px' : `0 0 ${shapeRadius} ${shapeRadius}`,
          ...((reduceMotion || settings.lowPowerMode || settings.animationLevel !== 'full')
            ? { opacity: 1, scale: 1, y: 0, rotateX: 0 }
            : NOTCH_ANIMATION_STATES[settings.jellyNotchAnimation](expanded)),
          boxShadow: expanded
            ? '0 20px 44px rgba(0,0,0,.42), 0 8px 18px rgba(0,0,0,.24)'
            : '0 12px 30px rgba(0,0,0,.34), 0 3px 10px rgba(0,0,0,.2)',
        }}
        transition={reduceMotion || settings.lowPowerMode || settings.animationLevel !== 'full'
          ? { duration: 0.16, ease: 'easeOut' }
          : NOTCH_ANIMATION_TRANSITIONS[settings.jellyNotchAnimation]}
        onKeyDown={event => {
          if (event.key === 'Escape') close();
        }}
        tabIndex={0}
        aria-label="Arlo Dynamic Workspace"
        aria-expanded={expanded}
        className="group relative z-10 overflow-hidden bg-[#050609] text-white outline-none"
        style={{
          maxWidth: 'calc(100vw - 20px)',
          background: launchIntroActive ? '#000' : expanded ? surfaceBackground : menuBarSurface,
          backdropFilter: launchIntroActive ? 'none' : `blur(${settings.jellyNotchStyle === 'solid' ? 0 : settings.jellyNotchBlur}px) saturate(155%)`,
          WebkitBackdropFilter: launchIntroActive ? 'none' : `blur(${settings.jellyNotchStyle === 'solid' ? 0 : settings.jellyNotchBlur}px) saturate(155%)`,
          transition: 'background 700ms ease, backdrop-filter 700ms ease',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!expanded ? (
            <motion.div
              key="compact"
              tabIndex={0}
              aria-label={stopwatchStartedAt !== null
                ? `Stopwatch running: ${formatStopwatch(stopwatchElapsedMs)}`
                : pomodoro.endAt !== null
                  ? `Pomodoro running: ${POMODORO_PHASE_META[pomodoro.phase].label}, ${formatTime(pomodoroSeconds)} remaining`
                : isPlayingMusic ? `Playing ${currentTrack.title}` : 'Dynamic Workspace'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              onKeyDown={event => {
                if ((event.key === 'Enter' || event.key === ' ') && event.shiftKey) {
                  event.preventDefault();
                  setPinned(true);
                  setExpanded(true);
                }
              }}
              className="group/compact relative h-full w-full"
            >
              <AnimatePresence mode="wait" initial={false}>
                {systemIndicator ? (
                  <SystemIndicatorHUD key={systemIndicator.kind} indicator={systemIndicator} reduceMotion={!!reduceMotion || settings.lowPowerMode} />
                ) : (
                  <motion.div
                    key="compact-content"
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: reduceMotion || settings.lowPowerMode ? 0.1 : 0.18 }}
                    className="flex h-full w-full items-center justify-center gap-2.5 px-3 text-left"
                  >
                    {!isPlayingMusic && stopwatchStartedAt === null && pomodoro.endAt === null ? (
                      <button
                        type="button"
                        aria-label={`Open ${selectedDetective.name} Detective`}
                        title={`Ask ${selectedDetective.name}`}
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          setShowGhostAssistant(true);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
                      >
                        <DetectiveAvatar
                          shape={selectedDetective.shape}
                          color={selectedDetective.color}
                          className="h-12 w-12 drop-shadow-[0_0_8px_rgba(56,189,248,.38)]"
                          animated={['scout', 'ember', 'mint', 'ruby', 'petal', 'violet', 'sunny', 'mocha'].includes(selectedDetectiveAvatarId)}
                          loading="eager"
                          fetchPriority="high"
                          detectiveId={selectedDetectiveAvatarId}
                          scoutColor={detectiveConfig.scoutColor}
                          emberColor={detectiveConfig.emberColor}
                          mintColor={detectiveConfig.mintColor}
                          rubyColor={detectiveConfig.rubyColor}
                          petalColor={detectiveConfig.petalColor}
                          violetColor={detectiveConfig.violetColor}
                          sunnyColor={detectiveConfig.sunnyColor}
                          mochaColor={detectiveConfig.mochaColor}
                        />
                      </button>
                    ) : settings.jellyNotchShape === 'circle' || settings.jellyNotchShape === 'orb' || settings.jellyNotchShape === 'square' ? (
                      <div className="relative flex h-full w-full items-center justify-center">
                        {stopwatchStartedAt !== null
                          ? <Timer className="h-5 w-5 text-sky-200" />
                          : pomodoro.endAt !== null ? <Timer className="h-5 w-5 text-amber-200" />
                          : isPlayingMusic ? (
                            <button
                              type="button"
                              aria-label={`Open music controls for ${currentTrack.title}`}
                              onClick={() => setView('music')}
                              className={`h-full w-full overflow-hidden ${getMusicArtworkRadius(settings.notchMusicArtworkShape)} transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200`}
                            >
                              <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" />
                            </button>
                          ) : <span className="h-2 w-2 rounded-full bg-white/60" />}
                        {unreadCount > 0 && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,.8)]" />}
                      </div>
                    ) : (
                      <>
                        <div className={`relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden ${getMusicArtworkRadius(settings.notchMusicArtworkShape)} bg-white/[0.08]`}>
                          {stopwatchStartedAt !== null
                            ? <Timer className="h-3 w-3 text-sky-200" />
                            : pomodoro.endAt !== null ? <Timer className="h-3 w-3 text-amber-200" />
                            : isPlayingMusic ? (
                              <button
                                type="button"
                                aria-label={`Open music controls for ${currentTrack.title}`}
                                onClick={() => setView('music')}
                                className={`h-full w-full ${getMusicArtworkRadius(settings.notchMusicArtworkShape)} transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200`}
                              >
                                <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" />
                              </button>
                            ) : <Activity className="h-3 w-3 text-slate-300" />}
                          {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-sky-400" />}
                        </div>
                        {pomodoro.endAt !== null && <span className="max-w-16 truncate text-[8px] font-semibold text-amber-100">{POMODORO_PHASE_META[pomodoro.phase].label}</span>}
                        {isPlayingMusic && <span className="max-w-24 truncate text-[10px] font-semibold">{currentTrack.title}</span>}
                        {(stopwatchStartedAt !== null || pomodoro.endAt !== null || !isPlayingMusic) && (
                          <span className={`font-mono text-[10px] ${stopwatchStartedAt !== null ? 'font-semibold text-sky-100' : pomodoro.endAt !== null ? 'font-semibold text-amber-100' : 'text-slate-300'}`}>
                            {stopwatchStartedAt !== null ? formatStopwatch(stopwatchElapsedMs) : pomodoro.endAt !== null ? formatTime(pomodoroSeconds) : displayedTime}
                          </span>
                        )}
                        {!isPlayingMusic && settings.wifiEnabled && <Wifi className="h-3 w-3 text-emerald-300" />}
                        {isPlayingMusic && (
                          <div
                            className={`ml-auto flex h-5 w-6 shrink-0 items-center justify-center gap-[3px] ${
                              reduceMotion || settings.lowPowerMode ? '' : 'notch-music-bars-animated'
                            }`}
                            role="img"
                            aria-label={`Now playing ${currentTrack.title}`}
                          >
                            {[0, 1, 2].map((bar, index) => (
                              <span
                                key={bar}
                                className={`h-3 w-[3px] origin-bottom rounded-full bg-sky-200 shadow-[0_0_6px_rgba(125,211,252,.55)] ${
                                  settings.notchMusicVisualizer === 'spectrum' || reduceMotion || settings.lowPowerMode ? '' : `notch-music-bar notch-music-bar-${index + 1}`
                                }`}
                                style={settings.notchMusicVisualizer === 'spectrum'
                                  ? { height: `${musicSpectrumData[bar * 7] ?? 4}px` }
                                  : undefined}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {settings.notchMusicHoverControls && isPlayingMusic && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3 bg-slate-950/65 opacity-0 backdrop-blur-md transition duration-200 group-hover/compact:pointer-events-auto group-hover/compact:opacity-100 group-focus-within/compact:pointer-events-auto group-focus-within/compact:opacity-100">
                  <button
                    type="button"
                    aria-label="Previous track"
                    onClick={event => { event.stopPropagation(); prevTrack(); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 transition hover:scale-110 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <SkipBack className="h-4 w-4 fill-current" />
                  </button>
                  <button
                    type="button"
                    aria-label="Open music player"
                    onClick={event => { event.stopPropagation(); setView('music'); }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <Music2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next track"
                    onClick={event => { event.stopPropagation(); nextTrack(); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 transition hover:scale-110 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  >
                    <SkipForward className="h-4 w-4 fill-current" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={reduceMotion || settings.lowPowerMode
                ? { duration: 0.12 }
                : { type: 'spring', stiffness: 300, damping: 28, mass: 0.72 }}
              className="flex h-full flex-col px-3 pb-2.5 pt-2"
              onClick={stopClick}
            >
              {launchIntroActive ? (
                <motion.div
                  key="launch-intro"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985 }}
                  transition={reduceMotion || settings.lowPowerMode
                    ? { duration: 0.18 }
                    : { type: 'spring', stiffness: 300, damping: 28 }}
                  className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-b-[18px] bg-black"
                >
                  <video
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    src={`${import.meta.env.BASE_URL}hello.mp4`}
                    aria-label="ARLO OS welcome animation"
                    onEnded={finishLaunchIntro}
                    onError={() => {
                      console.error('[Dynamic Workspace] The launch animation could not be played.');
                      finishLaunchIntro();
                    }}
                    className="h-auto max-h-[88px] w-full max-w-[380px] object-contain"
                  />
                </motion.div>
              ) : trayDragActive || trayDropComplete ? (
                <motion.div
                  key="tray-drop-preview"
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.98 }}
                  transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 330, damping: 28 }}
                  className={`flex min-h-0 flex-1 items-center gap-2 overflow-hidden rounded-[18px] border px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_8px_24px_rgba(0,0,0,.18)] ${
                    trayDropFailed
                      ? 'border-rose-300/35 bg-gradient-to-r from-rose-400/[0.08] via-white/[0.025] to-orange-300/[0.06]'
                      : 'border-sky-300/35 bg-gradient-to-r from-sky-400/[0.08] via-white/[0.025] to-indigo-300/[0.06]'
                  }`}
                  aria-label={trayDropComplete ? trayDropComplete : 'Drop files into Dynamic Workspace'}
                >
                  <div className={`flex h-full w-[82px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed ${
                    trayDropComplete
                      ? trayDropFailed
                        ? 'border-rose-200/35 bg-rose-300/[0.07] text-rose-100'
                        : 'border-emerald-200/35 bg-emerald-300/[0.07] text-emerald-100'
                      : 'border-sky-200/40 bg-sky-300/[0.07] text-sky-100'
                  }`}>
                    {trayDropComplete ? trayDropFailed ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />}
                    <span className="text-[8px] font-semibold tracking-wide">{trayDropComplete ? trayDropFailed ? 'Not moved' : 'Added' : 'Drop here'}</span>
                  </div>
                  <div className="relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl px-1">
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-xl"
                      animate={{ opacity: trayDragActive ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        background: `radial-gradient(circle at ${trayDragPointer.x}% ${trayDragPointer.y}%, rgba(125,211,252,.19), transparent 48%)`,
                      }}
                    />
                    {!trayDropComplete && trayDragPreview.length > 0 ? trayDragPreview.slice(0, 5).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.035, type: 'spring', stiffness: 360, damping: 25 }}
                        className="relative z-10 flex min-w-0 flex-1 flex-col items-center gap-1"
                      >
                        {item.previewUrl ? (
                          <img src={item.previewUrl} alt="" className="h-10 w-full max-w-[56px] rounded-lg border border-white/15 object-cover shadow-[0_3px_10px_rgba(0,0,0,.22)]" />
                        ) : (
                          <span className="flex h-10 w-full max-w-[56px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-sky-100 shadow-[0_3px_10px_rgba(0,0,0,.18)]">
                            {item.isDirectory ? <Folder className="h-4 w-4" /> : item.type === 'app' ? <Layers className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
                          </span>
                        )}
                        <span className="w-full truncate text-center text-[8px] font-medium text-slate-200">{item.name}</span>
                      </motion.div>
                    )) : trayDropComplete ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.82, filter: 'blur(5px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 420, damping: 24 }}
                        className={`relative z-10 flex flex-1 items-center justify-center gap-2 text-[10px] font-semibold ${trayDropFailed ? 'text-rose-100' : 'text-emerald-100'}`}
                      >
                        {trayDropFailed ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        <span className="max-w-full truncate">{trayDropComplete}</span>
                      </motion.div>
                    ) : (
                      <div className="relative z-10 flex flex-1 items-center justify-center gap-2 text-[10px] font-medium text-slate-300">
                        <span className="flex h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />
                        Release to add
                      </div>
                    )}
                    {!trayDropComplete && trayDragPreview.length > 5 && <span className="shrink-0 text-[9px] font-medium text-slate-400">+{trayDragPreview.length - 5}</span>}
                  </div>
                </motion.div>
              ) : pendingCameraRequest ? (
                <motion.section
                  key="camera-approval"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex min-h-0 flex-1 items-center justify-between gap-3 rounded-2xl border border-amber-200/20 bg-amber-200/[0.045] px-4 py-2"
                  aria-live="assertive"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-amber-100">
                      <Camera className="h-3.5 w-3.5" />
                      Ghost requests {pendingCameraRequest.kind === 'photo' ? 'a photo' : 'a video'}
                    </div>
                    <p className="mt-1 text-[8px] leading-relaxed text-slate-400">
                      {pendingCameraRequest.kind === 'video'
                        ? `Record up to ${pendingCameraRequest.durationSeconds ?? 10} seconds? The recording is saved to Photos and is not shared with Ghost.`
                        : 'Take one photo? It is saved to Photos and is not shared with Ghost.'}
                    </p>
                    {!cameraPreviewPlaying && <p className="mt-1 text-[8px] text-rose-200">{cameraError || 'Waiting for live camera preview…'}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button type="button" onClick={cancelPendingCameraRequest} className="rounded-xl px-3 py-2 text-[9px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
                      Decline
                    </button>
                    <button type="button" disabled={!cameraPreviewPlaying} onClick={() => void approvePendingCameraRequest()} className="rounded-xl bg-amber-200 px-3 py-2 text-[9px] font-semibold text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40">
                      Approve
                    </button>
                  </div>
                </motion.section>
              ) : (
              <div ref={widgetStripRef} className={`flex snap-x snap-proximity items-center gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-none py-1 ${settings.jellyNotchDashboard || view !== 'overview' ? 'h-[90px] shrink-0' : 'min-h-0 flex-1'}`} aria-label="Enabled notch widgets">
                <AnimatePresence initial={false}>
                {NOTCH_WIDGETS
                  .filter(widget => widget.id !== 'fileTray'
                    && (settings.jellyNotchWidgets[widget.id] || (widget.id === 'stopwatch' && stopwatchStartedAt !== null)))
                  .sort((left, right) => Number(right.id === 'camera') - Number(left.id === 'camera'))
                  .map(widget => (
                  <motion.div
                    key={widget.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    whileHover={{ y: -2, scale: 1.025 }}
                    whileTap={{ scale: 0.97 }}
                    transition={reduceMotion || settings.lowPowerMode
                      ? { duration: 0.12 }
                      : { type: 'spring', stiffness: 360, damping: 22, mass: 0.58 }}
                    className={`h-[82px] shrink-0 snap-start overflow-hidden rounded-[17px] bg-white/[0.035] ${
                      settings.jellyNotchDashboard ? 'p-2' : widget.id === 'music' ? enabledWidgetCount === 1 ? 'min-w-[202px] flex-1 p-2' : 'w-[202px] p-2' : widget.id === 'camera' ? 'w-[148px] px-2.5 py-2' : widget.id === 'calendar' ? 'w-[108px] px-2.5 py-2' : 'w-[112px] px-2.5 py-2'
                    }`}
                    style={settings.jellyNotchDashboard ? { width: Math.max(96, (expandedWidth - 44) / 3) } : undefined}
                  >
                    {widget.id === 'music' && (
                      <div className="flex h-full items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Open music player for ${currentTrack.title}`}
                          onClick={() => setView('music')}
                          className={`group/cover relative h-[62px] w-[62px] shrink-0 overflow-hidden ${getMusicArtworkRadius(settings.notchMusicArtworkShape)} bg-white/[0.06] shadow-[0_6px_18px_rgba(0,0,0,.22)] outline-none ring-sky-200/0 transition duration-200 hover:scale-[1.04] hover:shadow-[0_8px_24px_rgba(56,189,248,.24)] focus-visible:ring-2 focus-visible:ring-sky-200`}
                        >
                          {currentTrack.coverUrl ? <img src={currentTrack.coverUrl} alt={`${currentTrack.album} cover`} className="h-full w-full object-cover" /> : <MusicGlyph />}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition duration-200 group-hover/cover:bg-black/30 group-hover/cover:opacity-100">
                            <Play className="h-5 w-5 fill-current drop-shadow" />
                          </span>
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setView('music')}
                            className="block min-w-0 max-w-full text-left outline-none focus-visible:text-sky-100"
                          >
                            <span className="block text-[7px] font-semibold uppercase tracking-[.14em] text-sky-200/80">{isPlayingMusic ? 'Now playing' : 'Music'}</span>
                            <span className="mt-1 block truncate text-[10px] font-semibold text-white">{currentTrack.title}</span>
                            <span className="block truncate text-[8px] text-slate-400">{currentTrack.artist}</span>
                          </button>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <button type="button" aria-label="Previous track" onClick={prevTrack} className="text-slate-400 transition-colors hover:text-white"><SkipBack className="h-3 w-3" /></button>
                            <button type="button" aria-label={isPlayingMusic ? 'Pause music' : 'Play music'} onClick={togglePlayMusic} className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-950 transition-transform hover:scale-105">
                              {isPlayingMusic ? <Pause className="h-2.5 w-2.5 fill-current" /> : <Play className="h-2.5 w-2.5 fill-current" />}
                            </button>
                            <button type="button" aria-label="Next track" onClick={nextTrack} className="text-slate-400 transition-colors hover:text-white"><SkipForward className="h-3 w-3" /></button>
                            <input
                              type="range"
                              aria-label="Seek music track"
                              min="0"
                              max="100"
                              step="0.1"
                              value={musicProgress}
                              onChange={event => setMusicProgress(Number(event.currentTarget.value))}
                              onClick={stopClick}
                              className="ml-1 h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-sky-300"
                              style={{
                                background: `linear-gradient(to right, rgb(125 211 252) ${musicProgress}%, rgba(255,255,255,.12) ${musicProgress}%)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {widget.id === 'calendar' && (
                      <div className="flex h-full items-center gap-2">
                        <div>
                          <div className="text-[7px] font-semibold uppercase tracking-[.14em] text-slate-500">{new Intl.DateTimeFormat(undefined, { month: 'short' }).format(now)}</div>
                          <div className="text-[25px] font-semibold leading-none tracking-tight text-white">{now.getDate()}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[9px] font-semibold text-slate-200">{new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(now)}</div>
                          <div className="mt-1 font-mono text-[9px] text-slate-400">{displayedTime}</div>
                        </div>
                      </div>
                    )}
                    {widget.id === 'dayProgress' && (
                      <button
                        type="button"
                        onClick={() => setView('dayProgress')}
                        className="flex h-full w-full items-center gap-2 text-left"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-300/10 text-sky-200">
                          <CalendarDays className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[9px] font-semibold text-slate-100">Day Progress</span>
                          <span className="mt-1 block truncate text-[8px] text-slate-500">Open today’s timeline</span>
                        </span>
                      </button>
                    )}
                    {widget.id === 'notifications' && (
                      <div className="flex h-full flex-col justify-center">
                        <div className="flex items-center gap-1.5 text-sky-200"><Bell className="h-3.5 w-3.5" /><span className="text-lg font-semibold">{unreadCount}</span></div>
                        <div className="mt-1 text-[9px] font-medium text-slate-200">Unread alerts</div>
                        <div className="truncate text-[8px] text-slate-500">{latestNotification?.title ?? 'You are all caught up'}</div>
                      </div>
                    )}
                    {widget.id === 'timer' && (
                      <div className="flex h-full items-center justify-between gap-2">
                        <button type="button" onClick={() => setView('timer')} className="min-w-0 text-left">
                          <div className="text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Focus timer</div>
                          <div className="mt-1 font-mono text-[16px] font-semibold tracking-tight">{formatTime(timerSeconds)}</div>
                          <div className="text-[7px] text-slate-500">{timerEndAt !== null ? 'Running' : 'Tap to set'}</div>
                        </button>
                        <button
                          type="button"
                          aria-label={timerEndAt === null ? 'Start focus timer' : 'Pause focus timer'}
                          onClick={() => timerEndAt === null ? startTimer() : pauseTimer()}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-white transition-colors hover:bg-white/[0.16]"
                        >
                          {timerEndAt === null ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                        </button>
                      </div>
                    )}
                    {widget.id === 'pomodoro' && (
                      <button
                        type="button"
                        onClick={() => setView('pomodoro')}
                        className="flex h-full w-full items-center justify-between gap-2 text-left"
                        aria-label={`Open Pomodoro, ${POMODORO_PHASE_META[pomodoro.phase].label}, ${pomodoro.endAt !== null ? 'running' : 'paused'}`}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-amber-100/75"><Coffee className="h-3 w-3" /> Pomodoro</span>
                          <span className="mt-1 block truncate font-mono text-[14px] font-semibold tracking-tight text-white">{formatTime(pomodoroSeconds)}</span>
                          <span className="block truncate text-[7px] text-slate-500">{POMODORO_PHASE_META[pomodoro.phase].label} · {pomodoroSessionsToday} sessions today</span>
                          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/[0.08]">
                            <motion.span
                              className="block h-full rounded-full"
                              style={{ backgroundColor: POMODORO_PHASE_META[pomodoro.phase].color }}
                              animate={{ width: `${pomodoroProgress * 100}%` }}
                              transition={{ duration: 0.35 }}
                            />
                          </span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-200/15 bg-amber-200/[0.07] text-amber-100">
                          {pomodoro.endAt !== null ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                        </span>
                      </button>
                    )}
                    {widget.id === 'health' && (
                      <button
                        type="button"
                        onClick={() => setView('health')}
                        className="flex h-full w-full items-center justify-between gap-2 text-left"
                        aria-label="Open Health wellbeing dashboard"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-emerald-200/80"><Heart className="h-3 w-3" /> Health</span>
                          <span className="mt-1 block truncate font-mono text-[12px] font-semibold tracking-tight text-white">{healthToday.waterGlasses}/{settings.health.waterGoalGlasses} glasses</span>
                          <span className="block truncate text-[7px] text-slate-500">{healthToday.breakCount} breaks · {healthToday.mindfulMinutes} mindful min</span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-200/15 bg-emerald-200/[0.07] text-emerald-200">
                          <Heart className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    )}
                    {widget.id === 'stopwatch' && (
                      <button type="button" onClick={() => { setClockMode('stopwatch'); setView('timer'); }} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="block text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Stopwatch</span>
                          <span className="mt-1 block truncate font-mono text-[12px] font-semibold tracking-tight">{formatStopwatch(stopwatchElapsedMs)}</span>
                          <span className="block text-[7px] text-slate-500">{stopwatchStartedAt !== null ? 'Running · tap to open' : 'Tap to open'}</span>
                        </span>
                        <Timer className={`h-4 w-4 shrink-0 ${stopwatchStartedAt !== null ? 'text-sky-200' : 'text-slate-500'}`} />
                      </button>
                    )}
                    {widget.id === 'todos' && (
                      <button type="button" onClick={() => setView('tasks')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500"><ListTodo className="h-3 w-3" /> To-do list</span>
                          <span className="mt-1 block truncate font-mono text-[13px] font-semibold tracking-tight">{dashboardTasks.filter(task => !task.completed).length} remaining</span>
                          <span className="block text-[7px] text-slate-500">{dashboardTasks.length ? `${dashboardTasks.filter(task => task.completed).length} completed` : 'Add your first task'}</span>
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 -rotate-90 shrink-0 text-slate-500" />
                      </button>
                    )}
                    {widget.id === 'notes' && (
                      <button type="button" onClick={() => setView('notes')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500"><FileText className="h-3 w-3" /> Notes</span>
                          <span className="mt-1 block truncate font-mono text-[13px] font-semibold tracking-tight">{noteCount} saved</span>
                          <span className="block truncate text-[7px] text-slate-500">{selectedDashboardNote?.title ?? 'Your notes at a glance'}</span>
                        </span>
                        <AppIcon appId="notes" className="h-7 w-7 shrink-0 rounded-lg object-cover shadow-md" />
                      </button>
                    )}
                    {widget.id === 'screenTime' && (
                      <button type="button" onClick={() => setView('screenTime')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500"><Smartphone className="h-3 w-3" /> Screen Time</span>
                          <span className="mt-1 block truncate font-mono text-[13px] font-semibold tracking-tight">{formatDuration(totalScreenTimeMs)}</span>
                          <span className="block text-[7px] text-slate-500">{screenTimeRanking.length} apps today</span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-200"><Smartphone className="h-4 w-4" /></span>
                      </button>
                    )}
                    {widget.id === 'ghostAI' && (
                      <button type="button" onClick={() => setView('ghostAI')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-violet-200"><Bot className="h-3 w-3" /> Ghost AI</span>
                          <span className="mt-1 block truncate text-[10px] font-semibold tracking-tight text-slate-100">Chat with Ghost</span>
                          <span className="block truncate text-[7px] text-slate-500">{ghostMessages.length ? `${ghostMessages.length} messages` : 'Ask, plan or get help'}</span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200"><Sparkles className="h-4 w-4" /></span>
                      </button>
                    )}
                    {widget.id === 'lowBattery' && (
                      <button type="button" onClick={() => setView('lowBattery')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className={`flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] ${isLowBattery ? 'text-amber-200' : 'text-slate-500'}`}><Battery className="h-3 w-3" />{isLowBattery ? 'Low battery' : 'Battery'}</span>
                          <span className={`mt-1 block truncate font-mono text-[13px] font-semibold tracking-tight ${isLowBattery ? 'text-amber-100' : 'text-slate-100'}`}>{settings.batteryAvailable ? `${settings.batteryLevel}%` : '—'}</span>
                          <span className="block truncate text-[7px] text-slate-500">{!settings.batteryAvailable ? 'No battery sensor' : settings.batteryCharging ? 'Charging' : isLowBattery ? 'Plug in power adapter' : 'Tap for battery status'}</span>
                        </span>
                        <Battery className={`h-5 w-5 shrink-0 ${isLowBattery ? 'text-amber-300' : 'text-emerald-300'}`} />
                      </button>
                    )}
                    {widget.id === 'translation' && (
                      <button type="button" onClick={() => setView('translation')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500"><Languages className="h-3 w-3" /> Translation</span>
                          <span className="mt-1 block truncate text-[10px] font-semibold tracking-tight text-slate-100">Translate text</span>
                          <span className="block truncate text-[7px] text-slate-500">{translationSource.toUpperCase()} → {translationTarget.toUpperCase()}</span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200"><Languages className="h-4 w-4" /></span>
                      </button>
                    )}
                    {widget.id === 'windowSnap' && (
                      <button type="button" onClick={() => setView('windowSnap')} className="flex h-full w-full items-center justify-between gap-2 text-left">
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500"><Monitor className="h-3 w-3" /> Window Snap</span>
                          <span className="mt-1 block truncate text-[10px] font-semibold tracking-tight text-slate-100">Snap zones</span>
                          <span className="block truncate text-[7px] text-slate-500">{focusedWindow ? focusedWindow.title : 'No active window'}</span>
                        </span>
                        <span className="grid h-7 w-8 shrink-0 grid-cols-3 grid-rows-2 gap-[2px] rounded-md border border-white/[0.08] p-1">
                          {[0, 1, 2, 3, 4, 5].map(cell => <span key={cell} className="rounded-[2px] bg-sky-300/50" />)}
                        </span>
                      </button>
                    )}
                    {widget.id === 'clipboard' && (
                      <div className="flex h-full items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 shrink-0 text-sky-200" />
                        <div className="min-w-0">
                          <div className="text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Clipboard</div>
                          <div className="mt-1 truncate text-[9px] font-medium text-slate-200">Ready when you copy</div>
                          <div className="text-[7px] text-slate-500">Preview appears briefly</div>
                        </div>
                      </div>
                    )}
                    {widget.id === 'deviceActivity' && (
                      <div className="flex h-full items-center gap-2">
                        {lastDeviceActivity
                          ? <DeviceActivityIcon kind={lastDeviceActivity.kind} className={`h-4 w-4 shrink-0 ${lastDeviceActivity.connected ? 'text-emerald-200' : 'text-slate-400'}`} />
                          : <Usb className="h-4 w-4 shrink-0 text-sky-200" />}
                        <div className="min-w-0">
                          <div className="text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Devices</div>
                          <div className="mt-1 truncate text-[9px] font-medium text-slate-200">{lastDeviceActivity?.deviceName ?? 'Listening for changes'}</div>
                          <div className="text-[7px] text-slate-500">{lastDeviceActivity ? lastDeviceActivity.connected ? 'Connected' : 'Disconnected' : 'USB · audio · display'}</div>
                        </div>
                      </div>
                    )}
                    {widget.id === 'weather' && (
                      <div className="flex h-full items-center gap-2">
                        <CloudSun className="h-6 w-6 shrink-0 text-amber-200" />
                        <div className="min-w-0">
                          <div className="text-[18px] font-semibold leading-none">{weather ? formatTemperature(weather.current.temperature) : '--°'}</div>
                          <div className="mt-1 truncate text-[8px] text-slate-400">{weather?.location.name ?? (weatherLoading ? 'Loading weather' : weatherError ? 'Unavailable' : settings.region)}</div>
                        </div>
                      </div>
                    )}
                    {widget.id === 'workspaces' && (
                      <div className="flex h-full flex-col justify-center">
                        <div className="text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Workspace</div>
                        <div className="mt-1 truncate text-[10px] font-semibold">{spaces.find(space => space.id === activeSpaceId)?.name ?? 'Desktop'}</div>
                        <div className="mt-1 flex gap-1">
                          {spaces.map((space, index) => (
                            <button key={space.id} type="button" aria-label={`Switch to ${space.name}`} onClick={() => setActiveSpaceId(space.id)} className={`h-1.5 w-1.5 rounded-full transition-colors ${space.id === activeSpaceId ? 'bg-sky-300' : 'bg-white/20 hover:bg-white/50'}`} />
                          ))}
                        </div>
                      </div>
                    )}
                    {widget.id === 'systemStatus' && (
                      <div className="flex h-full flex-col justify-center gap-2">
                        <div className="flex items-center gap-1.5 text-[8px]">
                          <Wifi className={`h-3 w-3 ${settings.wifiConnected ? 'text-emerald-300' : 'text-slate-500'}`} />
                          <span className="truncate text-slate-300">{settings.wifiConnected ? settings.wifiNetwork : settings.wifiEnabled ? 'Connecting' : 'Wi-Fi off'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px]">
                          <Battery className={`h-3 w-3 ${settings.batteryAvailable ? 'text-emerald-300' : 'text-slate-500'}`} />
                          <span className="truncate text-slate-300">{settings.batteryAvailable ? `${settings.batteryLevel}%${settings.batteryCharging ? ' · Charging' : ''}` : 'Battery unavailable'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[8px]">
                          {settings.bluetoothConnected
                            ? <AirPodsIcon className="h-3 w-3 text-sky-300" />
                            : <Bluetooth className="h-3 w-3 text-slate-500" />}
                          <span className="truncate text-slate-300">{settings.bluetoothConnected ? settings.bluetoothDeviceName || 'Bluetooth connected' : 'Bluetooth off'}</span>
                        </div>
                      </div>
                    )}
                    {widget.id === 'camera' && (
                      <div className="flex h-full items-center gap-2">
                        <button
                          type="button"
                          aria-label="Open camera captures in Photos"
                          title="Open Photos library"
                          onClick={() => openApp('photos')}
                          className="group/camera relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full bg-black text-left shadow-[0_0_18px_rgba(56,189,248,.12)] ring-1 ring-white/10 transition duration-200 hover:scale-105 hover:ring-sky-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                        >
                          <video
                            ref={setCameraPreviewNode}
                            muted
                            autoPlay
                            playsInline
                            aria-label="Circular live camera preview"
                            className={`h-full w-full scale-x-[-1] object-cover transition-opacity duration-300 ${cameraPreviewPlaying ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {!cameraPreviewPlaying && (
                            <span className="absolute inset-0 flex items-center justify-center text-slate-500">
                              {cameraError ? <Camera className="h-4 w-4" /> : <span className="h-3 w-3 animate-pulse rounded-full bg-white/15" />}
                            </span>
                          )}
                          {cameraRecording && <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,.8)]" />}
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover/camera:opacity-100">
                            <Images className="h-4 w-4" />
                          </span>
                        </button>
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <div className="truncate text-[8px] font-semibold text-white">Camera</div>
                          <div className={`mt-0.5 truncate text-[7px] ${cameraError ? 'text-rose-200' : cameraRecording ? 'text-rose-200' : 'text-slate-500'}`}>
                            {cameraError || cameraFeedback || (cameraRecording ? `Recording ${formatTime(cameraRecordingSeconds)}` : cameraPreviewPlaying ? 'Live preview' : cameraReady ? 'Starting live preview…' : 'Starting camera…')}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="Take photo"
                              disabled={!cameraPreviewPlaying || cameraRecording}
                              onClick={() => void captureNotchPhoto()}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-white transition hover:scale-105 hover:bg-white/[0.16] disabled:opacity-40"
                            >
                              <Camera className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={cameraRecording ? 'Stop video recording' : 'Start video recording'}
                              disabled={!cameraPreviewPlaying}
                              onClick={() => cameraRecording
                                ? cameraRecorderRef.current?.state !== 'inactive' && cameraRecorderRef.current?.stop()
                                : void startNotchVideoRecording()}
                              className={`flex h-7 w-7 items-center justify-center rounded-full transition hover:scale-105 disabled:opacity-40 ${
                                cameraRecording ? 'bg-rose-400/15 text-rose-200' : 'bg-white/[0.08] text-white hover:bg-white/[0.16]'
                              }`}
                            >
                              {cameraRecording ? <span className="h-2.5 w-2.5 rounded-sm bg-rose-300" /> : <Circle className="h-3.5 w-3.5 fill-rose-400 text-rose-400" />}
                            </button>
                            {(cameraFeedback === 'Photo saved to Photos' || cameraFeedback === 'Video saved to Photos') && (
                              <button
                                type="button"
                                onClick={() => openApp('photos')}
                                className="rounded-full border border-sky-200/15 bg-sky-300/10 px-2 py-1 text-[7px] font-semibold text-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-300/20"
                              >
                                View in Photos
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                </AnimatePresence>
                {enabledWidgetCount === 0 && (
                  <div className="flex h-full w-full items-center justify-center gap-2 text-[9px] text-slate-400">
                    <Activity className="h-3.5 w-3.5 text-slate-500" />
                    <span>No widgets enabled</span>
                    <button type="button" onClick={openNotchSettings} className="text-sky-200 transition-colors hover:text-white">Choose widgets</button>
                  </div>
                )}
              </div>
              )}
              <div className="mx-1 h-px shrink-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              <header className={`${settings.jellyNotchDashboard || view !== 'overview' ? 'flex' : 'hidden'} h-7 shrink-0 items-center justify-between px-1`}>
                <div className="flex h-7 items-center">
                  {settings.jellyNotchDashboard ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-200">
                      <Activity className="h-3 w-3 text-sky-300" />
                      Dashboard
                      <span className="text-slate-500">·</span>
                      <span className="font-normal text-slate-400">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</span>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setView('overview')} className="flex items-center gap-1.5 rounded-md py-1 pr-2 text-[9px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
                      <ChevronDown className="h-3 w-3 rotate-90" />
                      Back to widgets
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Open ${selectedDetective.name} Detective`}
                    onClick={() => setShowGhostAssistant(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-full transition hover:scale-110 hover:bg-white/[0.08]"
                  >
                    <DetectiveAvatar
                      shape={selectedDetective.shape}
                      color={selectedDetective.color}
                      className="h-6 w-6"
                      detectiveId={selectedDetectiveAvatarId}
                      scoutColor={detectiveConfig.scoutColor}
                      emberColor={detectiveConfig.emberColor}
                      mintColor={detectiveConfig.mintColor}
                      rubyColor={detectiveConfig.rubyColor}
                      petalColor={detectiveConfig.petalColor}
                      violetColor={detectiveConfig.violetColor}
                      sunnyColor={detectiveConfig.sunnyColor}
                      mochaColor={detectiveConfig.mochaColor}
                    />
                  </button>
                  <span className="mr-1 font-mono text-[10px] text-slate-500">{displayedTime}</span>
                  <button
                    type="button"
                    aria-label="Collapse Dynamic Workspace"
                    onClick={close}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <nav
                className={`${settings.jellyNotchDashboard ? 'flex' : 'hidden'} scrollbar-none mt-2 shrink-0 snap-x snap-proximity gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-white/[0.06] bg-black/25 p-1`}
                aria-label="Dashboard features"
                role="tablist"
              >
                {dashboardTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = tab.id === 'stopwatch'
                    ? view === 'timer' && clockMode === 'stopwatch'
                    : view === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        if (tab.id === 'stopwatch') {
                          setClockMode('stopwatch');
                          setView('timer');
                        } else {
                          setView(tab.id);
                        }
                      }}
                      className={`group flex h-9 flex-none snap-start items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-[10px] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.08] ${
                        active ? 'bg-white/[0.12] text-sky-100 shadow-[0_2px_12px_rgba(56,189,248,.12)]' : 'text-slate-400 hover:text-slate-100'
                      }`}
                      title={tab.label}
                    >
                      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className={`${settings.jellyNotchDashboard || view !== 'overview' ? 'flex' : 'hidden'} min-h-0 flex-1 overflow-y-auto pt-2`}>
                <AnimatePresence mode="wait" initial={false}>
                  {view === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="grid h-full w-full grid-cols-2 grid-rows-[1fr_1fr_auto_auto] gap-2">
                      <button type="button" onClick={() => setView('music')} className="group flex min-h-[76px] min-w-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/20 hover:bg-white/[0.07]">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/10">
                          {currentTrack.coverUrl ? <img src={currentTrack.coverUrl} alt="" className="h-full w-full object-cover" /> : <MusicGlyph />}
                        </div>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1 text-[8px] font-semibold tracking-wide text-slate-500">{isPlayingMusic ? 'NOW PLAYING' : 'MUSIC'}</span>
                          <span className="mt-1 block truncate text-[12px] font-semibold group-hover:text-sky-100">{currentTrack.title}</span>
                          <span className="mt-0.5 block truncate text-[9px] text-slate-500">{currentTrack.artist}</span>
                        </span>
                      </button>
                      <button type="button" onClick={() => setView('timer')} className="group flex min-h-[76px] flex-col justify-center rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:border-sky-300/20 hover:bg-white/[0.07]">
                        <span className="flex items-center gap-1.5 text-[8px] font-semibold tracking-wide text-slate-500"><Timer className="h-3 w-3" /> FOCUS TIMER</span>
                        <span className="mt-1.5 block font-mono text-2xl font-semibold tracking-wide tabular-nums group-hover:text-sky-100">{formatTime(timerSeconds)}</span>
                        <span className="mt-0.5 text-[8px] text-slate-500">{timerEndAt !== null ? 'In progress' : 'Open timer controls'}</span>
                      </button>
                      <div className="col-span-2 flex min-h-[68px] items-center justify-around rounded-2xl border border-white/[0.07] bg-gradient-to-r from-white/[0.045] via-white/[0.025] to-white/[0.045] px-3 py-2.5">
                        <StatusItem icon={Battery} label="Battery" value={settings.batteryAvailable ? `${settings.batteryLevel}%${settings.batteryCharging ? ' · Charging' : ''}` : 'Unavailable'} />
                        <span className="mx-2 h-9 w-px bg-white/[0.08]" />
                        <StatusItem icon={Wifi} label="Wi-Fi" value={settings.wifiConnected ? settings.wifiNetwork : settings.wifiEnabled ? 'Connecting' : 'Off'} />
                        <span className="mx-2 h-9 w-px bg-white/[0.08]" />
                        <StatusItem icon={settings.bluetoothConnected ? AirPodsIcon : Bluetooth} label="Bluetooth" value={settings.bluetoothConnected ? settings.bluetoothDeviceName || 'Connected' : 'Off'} />
                      </div>
                      {latestNotification && (
                        <button type="button" onClick={() => setView('notifications')} className="col-span-2 flex min-w-0 items-center gap-2 rounded-xl px-1 text-left transition hover:bg-white/[0.04]">
                          <Bell className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                          <span className="truncate text-[9px] text-slate-400">{latestNotification.title}: {latestNotification.message}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowControlCenter(true)}
                        className="col-span-2 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-left transition hover:border-sky-300/20 hover:bg-white/[0.07]"
                      >
                        <span className="text-[9px] font-medium text-slate-300">Quick system controls</span>
                        <ExternalLink className="h-3 w-3 text-slate-500" />
                      </button>
                    </motion.div>
                  )}
                  {view === 'dayProgress' && settings.jellyNotchWidgets.dayProgress && (
                    <motion.div key="dayProgress" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="h-full min-h-0 w-full">
                      <DayProgressPanel
                        now={now}
                        settings={settings.dayProgress}
                        tasks={dashboardTasks}
                        onToggleTask={taskId => setDashboardTasks(tasks => tasks.map(task => task.id === taskId ? { ...task, completed: !task.completed } : task))}
                      />
                    </motion.div>
                  )}
                  {view === 'ghostAI' && settings.jellyNotchWidgets.ghostAI && (
                    <motion.section
                      key="ghostAI"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-violet-300/10 bg-gradient-to-br from-violet-300/[0.045] via-white/[0.02] to-sky-300/[0.025]"
                    >
                      <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200/15 bg-violet-300/10 text-violet-100">
                            <Bot className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block text-[10px] font-semibold text-white">Ghost AI</span>
                            <span className="block text-[8px] text-slate-500">Your ARLO assistant</span>
                          </span>
                        </div>
                        <button type="button" onClick={() => openApp('ghostai')} className="rounded-lg px-2 py-1 text-[8px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
                          Open full chat
                        </button>
                      </header>
                      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2">
                        {ghostMessages.length === 0 ? (
                          <div className="flex min-h-full flex-col items-center justify-center text-center">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-200/15 bg-violet-300/[0.08] text-violet-100">
                              <Sparkles className="h-5 w-5" />
                            </span>
                            <p className="mt-2 text-[10px] font-semibold text-slate-100">What can I help with?</p>
                            <p className="mt-1 max-w-[260px] text-[8px] leading-relaxed text-slate-500">Ask a question or tell Ghost to open an app. Your conversation stays on this device.</p>
                            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                              {['Plan my day', 'Help me focus'].map(suggestion => (
                                <button key={suggestion} type="button" onClick={() => setGhostPrompt(suggestion)} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1.5 text-[8px] text-slate-400 transition hover:border-violet-200/20 hover:bg-violet-300/[0.06] hover:text-violet-100">
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : ghostMessages.slice(-30).map(message => (
                          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-xl px-2.5 py-2 text-[9px] leading-relaxed ${message.role === 'user' ? 'rounded-br-sm border border-sky-200/15 bg-sky-300/[0.09] text-sky-50' : 'rounded-bl-sm border border-white/[0.06] bg-white/[0.035] text-slate-200'}`}>
                              {message.content}
                            </div>
                          </div>
                        ))}
                        {ghostBusy && (
                          <div className="flex items-center gap-2 text-[8px] text-violet-200/80" aria-live="polite">
                            <LoaderCircle className="h-3 w-3 animate-spin" /> Ghost is thinking…
                          </div>
                        )}
                        <div ref={ghostEndRef} />
                      </div>
                      {ghostError && <p role="alert" className="mx-3 mb-1 text-[8px] text-rose-200">{ghostError}</p>}
                      <form onSubmit={sendGhostMessage} className="flex shrink-0 items-end gap-2 border-t border-white/[0.06] p-2">
                        <textarea
                          aria-label="Message Ghost AI"
                          value={ghostPrompt}
                          onChange={event => setGhostPrompt(event.currentTarget.value)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                              event.preventDefault();
                              event.currentTarget.form?.requestSubmit();
                            }
                          }}
                          rows={1}
                          maxLength={4000}
                          placeholder="Message Ghost…"
                          className="max-h-16 min-h-9 min-w-0 flex-1 resize-none rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-[9px] text-white outline-none transition placeholder:text-slate-600 focus:border-violet-200/25"
                        />
                        <button type="submit" aria-label="Send message to Ghost" disabled={!ghostPrompt.trim() || ghostBusy} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-200 text-slate-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-35">
                          {ghostBusy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </button>
                      </form>
                    </motion.section>
                  )}

                  {view === 'tasks' && settings.jellyNotchWidgets.todos && (
                    <motion.section
                      key="tasks"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-black/20 p-3"
                    >
                      <header className="mb-2 flex shrink-0 items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200"><ListTodo className="h-3.5 w-3.5" /></span>
                          <div>
                            <h3 className="text-[11px] font-semibold text-white">To-do list</h3>
                            <p className="text-[8px] text-slate-500">{dashboardTasks.filter(task => !task.completed).length} active · {dashboardTasks.filter(task => task.completed).length} completed</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[8px] font-medium text-slate-400">
                          {dashboardTasks.length ? `${Math.round((dashboardTasks.filter(task => task.completed).length / dashboardTasks.length) * 100)}% done` : 'Ready'}
                        </span>
                      </header>
                      <form onSubmit={addDashboardTask} className="mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 p-1.5 transition focus-within:border-sky-300/35 focus-within:bg-black/30">
                        <input
                          aria-label="New task"
                          value={newDashboardTask}
                          onChange={event => setNewDashboardTask(event.target.value)}
                          placeholder="Add a task to your list…"
                          className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600"
                        />
                        <button
                          type="submit"
                          disabled={!newDashboardTask.trim()}
                          aria-label="Add task"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-300 text-slate-950 transition hover:scale-105 hover:bg-sky-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </form>
                      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
                        <AnimatePresence initial={false}>
                          {dashboardTasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 14, scale: 0.98 }}
                              transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 400, damping: 28 }}
                              className="group flex min-h-9 items-center gap-2 rounded-xl border border-white/[0.045] bg-white/[0.025] px-2.5 py-1.5 transition-colors hover:border-sky-300/15 hover:bg-white/[0.055]"
                            >
                              <button
                                type="button"
                                aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}
                                aria-pressed={task.completed}
                                onClick={() => setDashboardTasks(tasks => tasks.map(item => item.id === task.id ? { ...item, completed: !item.completed } : item))}
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all hover:scale-110 ${
                                  task.completed ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-200' : 'border-slate-500/70 text-transparent hover:border-sky-300 hover:text-sky-200/70'
                                }`}
                              >
                                {task.completed && <Check className="h-2.5 w-2.5" />}
                              </button>
                              <span className={`min-w-0 flex-1 truncate text-[9px] transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {task.title}
                              </span>
                              <span className="text-[7px] text-slate-600">{index === 0 && !task.completed ? 'NEXT' : ''}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        {dashboardTasks.length === 0 && (
                          <div className="flex h-full min-h-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] text-center">
                            <ListTodo className="h-5 w-5 text-slate-600" />
                            <p className="mt-1 text-[9px] font-medium text-slate-300">A clear list, a clear mind</p>
                            <p className="mt-0.5 text-[8px] text-slate-600">Add a task above to get started.</p>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}

                  {view === 'notes' && settings.jellyNotchWidgets.notes && (
                    <motion.section
                      key="notes"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="flex h-full w-full min-h-0 overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-black/25"
                    >
                      <aside className="flex w-[38%] min-w-[128px] max-w-[220px] shrink-0 flex-col border-r border-white/[0.07] bg-black/10 p-2.5">
                        <header className="mb-2 flex items-center justify-between gap-2 px-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <AppIcon appId="notes" className="h-6 w-6 rounded-md object-cover" />
                            <span className="truncate text-[10px] font-semibold">Notes <span className="text-slate-500">{noteCount}</span></span>
                          </div>
                          <button type="button" aria-label="Open Notes app" onClick={() => openApp('notes')} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.08] hover:text-white">
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        </header>
                        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
                          {dashboardNotes.map(note => (
                            <button
                              key={note.id}
                              type="button"
                              aria-pressed={selectedDashboardNote?.id === note.id}
                              onClick={() => setSelectedDashboardNoteId(note.id)}
                              className={`group w-full rounded-xl border px-2 py-2 text-left transition-all duration-150 hover:-translate-y-px ${
                                selectedDashboardNote?.id === note.id
                                  ? 'border-sky-300/20 bg-sky-300/[0.08]'
                                  : 'border-transparent bg-white/[0.015] hover:border-white/[0.07] hover:bg-white/[0.045]'
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                {note.pinned && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,.6)]" />}
                                <span className="truncate text-[9px] font-semibold text-slate-200">{note.title || 'Untitled note'}</span>
                              </span>
                              <span className="mt-1 block truncate text-[7px] text-slate-500">{note.folder ?? 'Notes'}{note.date ? ` · ${note.date}` : ''}</span>
                            </button>
                          ))}
                          {dashboardNotes.length === 0 && (
                            <button type="button" onClick={() => openApp('notes')} className="flex h-full min-h-20 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-2 text-center transition hover:border-sky-300/20 hover:bg-white/[0.025]">
                              <FileText className="h-4 w-4 text-slate-600" />
                              <span className="mt-1 text-[8px] text-slate-500">Create your first note</span>
                            </button>
                          )}
                        </div>
                      </aside>
                      <div className="flex min-w-0 flex-1 flex-col p-3.5">
                        {selectedDashboardNote ? (
                          <>
                            <header className="flex shrink-0 items-start justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                              <div className="min-w-0">
                                <div className="text-[7px] font-semibold uppercase tracking-[.16em] text-sky-300">{selectedDashboardNote.folder ?? 'Notes'}</div>
                                <h3 className="mt-1 truncate text-[12px] font-semibold text-white">{selectedDashboardNote.title || 'Untitled note'}</h3>
                              </div>
                              <button type="button" aria-label="Edit in Notes app" onClick={() => openApp('notes')} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] text-slate-400 transition hover:border-sky-300/20 hover:bg-sky-300/[0.08] hover:text-sky-100">
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </header>
                            <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap pt-2.5 text-[9px] leading-relaxed text-slate-300/85">
                              {getNotePreview(selectedDashboardNote.body) || 'This note is empty. Open Notes to add something.'}
                            </div>
                            <div className="mt-2 flex shrink-0 items-center gap-1.5 text-[7px] text-slate-600">
                              <span className="h-1 w-1 rounded-full bg-emerald-300/70" /> Saved on this device
                            </div>
                          </>
                        ) : (
                          <button type="button" onClick={() => openApp('notes')} className="flex h-full flex-col items-center justify-center text-center transition hover:text-sky-100">
                            <FileText className="h-6 w-6 text-slate-600" />
                            <span className="mt-2 text-[9px] font-medium text-slate-400">Select a note or add one</span>
                            <span className="mt-1 text-[8px] text-slate-600">Your Notes app content appears here.</span>
                          </button>
                        )}
                      </div>
                    </motion.section>
                  )}

                  {view === 'screenTime' && settings.jellyNotchWidgets.screenTime && (
                    <motion.section
                      key="screenTime"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="flex h-full w-full min-h-0 gap-3 overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-black/25 p-3"
                    >
                      <aside className="flex w-[145px] shrink-0 flex-col rounded-2xl border border-white/[0.06] bg-black/15 p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200"><Smartphone className="h-3.5 w-3.5" /></span>
                          <div>
                            <h3 className="text-[10px] font-semibold">Screen Time</h3>
                            <p className="text-[7px] text-slate-500">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(now)}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-2">
                          <div className="text-[7px] font-semibold uppercase tracking-[.13em] text-slate-500">Today</div>
                          <div className="mt-1 font-mono text-[19px] font-semibold tracking-tight text-white">{formatDuration(totalScreenTimeMs)}</div>
                          <div className="mt-0.5 text-[7px] text-slate-600">Foreground app time</div>
                        </div>
                        <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                          <div className="mb-1 text-[7px] font-semibold uppercase tracking-[.13em] text-slate-600">Categories</div>
                          {[
                            { label: 'Productivity', ids: ['notes', 'calendar', 'reminders', 'nextpad', 'codestudio'], color: '#38bdf8' },
                            { label: 'Utilities', ids: ['settings', 'finder', 'clock', 'calculator', 'terminal'], color: '#a78bfa' },
                            { label: 'Browsing', ids: ['browser'], color: '#34d399' },
                            { label: 'Entertainment', ids: ['music', 'tv', 'doomscroll'], color: '#f472b6' },
                            { label: 'Other', ids: [], color: '#94a3b8' },
                          ].map(category => {
                            const duration = screenTimeRanking
                              .filter(item => category.ids.includes(item.appId) || (category.label === 'Other' && !['notes', 'calendar', 'reminders', 'nextpad', 'codestudio', 'settings', 'finder', 'clock', 'calculator', 'terminal', 'browser', 'music', 'tv', 'doomscroll'].includes(item.appId)))
                              .reduce((total, item) => total + item.duration, 0);
                            return (
                              <div key={category.label} className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 transition hover:bg-white/[0.04]">
                                <span className="flex min-w-0 items-center gap-1.5 text-[8px] text-slate-400"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />{category.label}</span>
                                <span className="shrink-0 font-mono text-[7px] text-slate-500">{formatDuration(duration)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </aside>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2">
                          <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full border border-white/[0.06] shadow-[inset_0_0_24px_rgba(0,0,0,.25)]" style={{
                            background: totalScreenTimeMs
                              ? `radial-gradient(circle at center, #0b0d12 0 52%, transparent 54%), conic-gradient(#38bdf8 0deg, #38bdf8 ${Math.max(10, screenTimeRanking[0]?.duration / totalScreenTimeMs * 360 || 0)}deg, #a78bfa ${Math.max(10, screenTimeRanking[0]?.duration / totalScreenTimeMs * 360 || 0)}deg, #a78bfa 220deg, #34d399 220deg, #34d399 300deg, #f472b6 300deg, #f472b6 360deg)`
                              : 'radial-gradient(circle at center, #0b0d12 0 52%, transparent 54%), conic-gradient(#334155 0deg 360deg)',
                          }}>
                            <span className="font-mono text-[12px] font-semibold text-white">{formatDuration(totalScreenTimeMs)}</span>
                            <span className="mt-0.5 text-[7px] uppercase tracking-[.12em] text-slate-500">Today</span>
                          </div>
                          <div className="flex min-w-0 flex-col justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025] px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[7px] font-semibold uppercase tracking-[.13em] text-slate-500">Usage this week</span>
                              <span className="text-[7px] text-slate-600">Last 7 days</span>
                            </div>
                            <div className="mt-2 flex h-11 items-end gap-1">
                              {Array.from({ length: 7 }, (_, index) => {
                                const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - index));
                                const key = getLocalDateKey(day);
                                const total = Object.values(screenTimeDays[key] ?? {}).reduce((sum, value) => sum + value, 0);
                                const maximum = Math.max(3_600_000, ...Object.values(screenTimeDays).map(apps => Object.values(apps).reduce((sum, value) => sum + value, 0)));
                                return (
                                  <div key={key} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                                    <motion.div
                                      initial={false}
                                      animate={{ height: `${Math.max(4, Math.min(100, total / maximum * 100))}%` }}
                                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 260, damping: 22 }}
                                      title={`${new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(day)}: ${formatDuration(total)}`}
                                      className={`w-full max-w-5 rounded-t-md ${index === 6 ? 'bg-gradient-to-t from-sky-500/70 to-cyan-300' : 'bg-gradient-to-t from-violet-500/45 to-sky-300/75'} transition-[filter] group-hover:brightness-125`}
                                    />
                                    <span className="text-[6px] text-slate-600">{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(day)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                          <header className="flex shrink-0 items-center justify-between border-b border-white/[0.05] px-2.5 py-2">
                            <span className="text-[8px] font-semibold uppercase tracking-[.13em] text-slate-400">Most used apps</span>
                            <span className="text-[7px] text-slate-600">{screenTimeRanking.length} apps today</span>
                          </header>
                          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5">
                            {screenTimeRanking.slice(0, 5).map((item, index) => (
                              <div key={item.appId} className="group flex items-center gap-2 rounded-xl px-1.5 py-1 transition-all hover:bg-white/[0.055]">
                                <span className="w-3 shrink-0 text-right font-mono text-[7px] text-slate-600">{index + 1}</span>
                                <AppIcon appId={item.appId} className="h-6 w-6 shrink-0 rounded-md object-cover shadow-sm transition-transform group-hover:scale-110" />
                                <span className="min-w-0 flex-1 truncate text-[8px] font-medium text-slate-300">{item.app.name}</span>
                                <span className="w-[25%] shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
                                  <motion.span
                                    initial={false}
                                    animate={{ width: `${Math.max(4, item.duration / (screenTimeRanking[0]?.duration ?? 1) * 100)}%` }}
                                    transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 280, damping: 25 }}
                                    className="block h-1 rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                                  />
                                </span>
                                <span className="w-9 shrink-0 text-right font-mono text-[7px] text-slate-400">{formatDuration(item.duration)}</span>
                              </div>
                            ))}
                            {screenTimeRanking.length === 0 && (
                              <div className="flex h-full min-h-14 items-center justify-center px-3 text-center text-[8px] text-slate-600">
                                App time will appear here while you use ARLO OS.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {view === 'music' && (
                    <motion.div
                      key="music"
                      initial={{ opacity: 0, y: 8, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.99 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="relative flex h-full w-full min-h-0 flex-col justify-between overflow-hidden rounded-[18px] border border-white/[0.16] bg-white/[0.055] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_12px_36px_rgba(15,10,35,.12)]"
                      style={{
                        background: settings.jellyNotchStyle === 'solid'
                          ? 'rgba(255,255,255,.07)'
                          : settings.jellyNotchStyle === 'aurora'
                            ? 'linear-gradient(135deg, rgba(232,121,249,.13), rgba(167,139,250,.13), rgba(255,255,255,.045))'
                            : settings.jellyNotchStyle === 'transparent'
                              ? 'linear-gradient(135deg, rgba(255,255,255,.12), rgba(205,190,255,.065) 58%, rgba(255,255,255,.035))'
                              : 'rgba(255,255,255,.085)',
                        backdropFilter: 'blur(28px) saturate(165%)',
                        WebkitBackdropFilter: 'blur(28px) saturate(165%)',
                      }}
                    >
                      <motion.img
                        aria-hidden="true"
                        src={currentTrack.coverUrl}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.07] blur-2xl"
                        animate={isPlayingMusic && !reduceMotion && !settings.lowPowerMode ? { scale: [1.1, 1.18, 1.1] } : { scale: 1.1 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.075] via-violet-200/[0.025] to-fuchsia-200/[0.045]" />
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-fuchsia-400/[0.14] blur-3xl"
                        animate={isPlayingMusic && !reduceMotion && !settings.lowPowerMode ? { opacity: [0.45, 0.85, 0.45], scale: [0.9, 1.12, 0.9] } : { opacity: 0.35, scale: 1 }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <div className="relative flex min-h-0 items-center gap-3">
                        <motion.div
                          animate={isPlayingMusic && !reduceMotion && !settings.lowPowerMode ? { y: [0, -2, 0] } : { y: 0 }}
                          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
                          className={`h-[76px] w-[76px] shrink-0 overflow-hidden ${getMusicArtworkRadius(settings.notchMusicArtworkShape)} bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 shadow-[0_8px_30px_rgba(168,85,247,.24)] ring-1 ring-white/15 transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(192,132,252,.32)]`}
                        >
                          {currentTrack.coverUrl ? <img src={currentTrack.coverUrl} alt={`${currentTrack.album} album artwork`} className="h-full w-full object-cover" /> : <MusicGlyph />}
                        </motion.div>
                        <div className="relative min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[8px] font-semibold tracking-[.16em] text-cyan-300">
                            <Music2 className="h-3 w-3 text-violet-300" />
                            {isPlayingMusic ? 'NOW PLAYING' : 'READY TO PLAY'}
                          </div>
                          <div className="mt-1 truncate text-[15px] font-bold tracking-tight text-white">{currentTrack.title}</div>
                          <div className="mt-0.5 truncate text-[10px] text-slate-300/75">{currentTrack.artist} <span className="text-violet-200/50">·</span> {currentTrack.album}</div>
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="font-mono text-[8px] text-slate-500">{formatTime(Math.round(currentTrack.duration * musicProgress / 100))}</span>
                            <input
                              aria-label="Track progress"
                              type="range"
                              min="0"
                              max="100"
                              value={musicProgress}
                              onChange={event => setMusicProgress(Number(event.target.value))}
                              className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-cyan-300"
                              style={{
                                background: `linear-gradient(to right, rgb(103 232 249) ${musicProgress}%, rgba(255,255,255,.16) ${musicProgress}%)`,
                              }}
                            />
                            <span className="font-mono text-[8px] text-slate-500">{formatTime(currentTrack.duration)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative flex items-center justify-between gap-3">
                        <button type="button" aria-label="Toggle shuffle" aria-pressed={shuffleTracks} onClick={() => setShuffleTracks(!shuffleTracks)} className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 ${shuffleTracks ? 'bg-sky-300/10 text-sky-300' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}>
                          <span className="text-[11px]">⇄</span>
                        </button>
                        <div className="flex items-center gap-3">
                          <button type="button" aria-label="Previous track" onClick={prevTrack} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 transition-all hover:scale-110 hover:bg-white/10"><SkipBack className="h-4 w-4 fill-current" /></button>
                          <button type="button" aria-label={isPlayingMusic ? 'Pause music' : 'Play music'} onClick={togglePlayMusic} className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-[0_4px_18px_rgba(196,181,253,.28)] transition duration-200 hover:scale-110 active:scale-95">
                          {isPlayingMusic ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                          </button>
                          <button type="button" aria-label="Next track" onClick={nextTrack} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-200 transition-all hover:scale-110 hover:bg-white/10"><SkipForward className="h-4 w-4 fill-current" /></button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" aria-label="Toggle repeat" aria-pressed={repeatTrack} onClick={() => setRepeatTrack(!repeatTrack)} className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 ${repeatTrack ? 'bg-sky-300/10 text-sky-300' : 'text-slate-500 hover:bg-white/10 hover:text-white'}`}><Repeat2 className="h-4 w-4" /></button>
                          <button type="button" aria-label="Add track to favorites" aria-pressed={favoriteTrackId === currentTrack.id} onClick={() => setFavoriteTrackId(favoriteTrackId === currentTrack.id ? null : currentTrack.id)} className={`flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 ${favoriteTrackId === currentTrack.id ? 'text-pink-400' : 'text-slate-500 hover:text-pink-300'}`}><Heart className={`h-3.5 w-3.5 ${favoriteTrackId === currentTrack.id ? 'fill-current' : ''}`} /></button>
                        </div>
                      </div>
                      <div className="flex h-8 items-end justify-center gap-1 overflow-hidden rounded-lg border-t border-violet-200/[0.08] bg-[#0b0815]/25 px-2 pt-1.5" aria-label={isPlayingMusic ? 'Music visualizer active' : 'Music visualizer idle'}>
                        {Array.from({ length: 36 }, (_, index) => {
                          const liveSpectrum = musicSpectrumData[index % musicSpectrumData.length] ?? 4;
                          const useSpectrum = settings.notchMusicVisualizer === 'spectrum';
                          const animateBars = isPlayingMusic && !reduceMotion && !settings.lowPowerMode && !useSpectrum;
                          return (
                            <motion.span
                              key={index}
                              className="w-full max-w-2 rounded-t-full bg-gradient-to-t from-violet-400/25 via-fuchsia-300/55 to-cyan-200/90"
                              style={{
                                height: useSpectrum ? `${Math.max(3, liveSpectrum)}px` : `${18 + ((index * 37) % 65)}%`,
                                transformOrigin: 'bottom',
                              }}
                              animate={useSpectrum
                                ? { opacity: isPlayingMusic ? 0.9 : 0.3 }
                                : animateBars
                                  ? { scaleY: [0.2, 0.55 + ((index * 13) % 40) / 50, 0.2], opacity: [0.35, 0.9, 0.35] }
                                  : { scaleY: 0.12, opacity: 0.3 }}
                              transition={animateBars
                                ? { duration: 0.7 + (index % 5) * 0.13, delay: (index % 7) * 0.04, ease: 'easeInOut', repeat: Infinity }
                                : { duration: useSpectrum ? 0.08 : 0.2 }}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {view === 'timer' && (
                    <motion.div key="timer" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex h-full w-full flex-col items-center justify-center">
                      <div className="mb-2 flex rounded-full bg-white/[0.05] p-0.5">
                        {(['timer', 'stopwatch'] as const).map(mode => (
                          <button
                            key={mode}
                            type="button"
                            aria-pressed={clockMode === mode}
                            onClick={() => setClockMode(mode)}
                            className={`rounded-full px-3 py-1 text-[9px] capitalize transition ${clockMode === mode ? 'bg-white/[0.12] text-white' : 'text-slate-500 hover:text-slate-200'}`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      {clockMode === 'timer' ? (
                        <>
                          <div className="relative flex h-24 w-24 items-center justify-center">
                            <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
                              <circle cx="56" cy="56" r="49" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
                              <motion.circle
                                cx="56" cy="56" r="49" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 49}
                                animate={{ strokeDashoffset: 2 * Math.PI * 49 * (1 - timerProgress) }}
                                transition={{ duration: 0.2 }}
                              />
                            </svg>
                            <div className="text-center">
                              <div className="font-mono text-2xl font-semibold tracking-wider">{formatTime(timerSeconds)}</div>
                              <div className="mt-1 text-[8px] uppercase tracking-[.2em] text-slate-500">{timerEndAt !== null ? 'Running' : timerRemainingMs === 0 ? 'Complete' : 'Focus timer'}</div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5">
                            {TIMER_PRESETS.map(preset => (
                              <button
                                key={preset.seconds}
                                type="button"
                                aria-pressed={timerPreset === preset.seconds}
                                onClick={() => {
                                  setTimerPreset(preset.seconds);
                                  setTimerEndAt(null);
                                  setTimerRemainingMs(preset.seconds * 1000);
                                }}
                                className={`rounded-full px-2.5 py-1 text-[9px] transition ${timerPreset === preset.seconds ? 'bg-sky-400/15 text-sky-200' : 'text-slate-500 hover:bg-white/[0.06] hover:text-white'}`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <button type="button" aria-label="Cancel timer" onClick={resetTimer} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={timerEndAt !== null ? pauseTimer : startTimer} className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-full bg-sky-400 px-4 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300">
                              {timerEndAt !== null ? <><Pause className="h-3 w-3 fill-current" /> Pause</> : <><Play className="h-3 w-3 fill-current" /> Start</>}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mt-3 font-mono text-[27px] font-semibold tracking-wider">{formatStopwatch(stopwatchElapsedMs)}</div>
                          <div className="mt-1 text-[8px] uppercase tracking-[.2em] text-slate-500">{stopwatchStartedAt !== null ? 'Running' : 'Stopwatch'}</div>
                          <div className="mt-5 flex items-center gap-3">
                            <button
                              type="button"
                              aria-label="Reset stopwatch"
                              onClick={() => {
                                resetStopwatch();
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (stopwatchStartedAt !== null) pauseStopwatch();
                                else startStopwatch();
                              }}
                              className="flex h-9 min-w-24 items-center justify-center gap-2 rounded-full bg-sky-400 px-4 text-[10px] font-bold text-slate-950 transition hover:bg-sky-300"
                            >
                              {stopwatchStartedAt !== null ? <><Pause className="h-3 w-3 fill-current" /> Pause</> : <><Play className="h-3 w-3 fill-current" /> Start</>}
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {view === 'pomodoro' && settings.jellyNotchWidgets.pomodoro && (
                    <motion.section
                      key="pomodoro"
                      initial={{ opacity: 0, y: 7, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.99 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="grid h-full w-full min-h-0 grid-cols-[1fr_1.08fr_1fr] gap-2 overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.045] via-black/20 to-amber-200/[0.035] p-2.5"
                    >
                      <div className="flex min-w-0 flex-col justify-center">
                        <div className="mb-2 flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[.16em] text-slate-500">
                          <Sparkles className="h-3 w-3 text-amber-200" /> Session
                        </div>
                        <div className="space-y-1">
                          {(['work', 'shortBreak', 'longBreak'] as const).map(phase => {
                            const PhaseIcon = POMODORO_PHASE_META[phase].icon;
                            const active = pomodoro.phase === phase;
                            return (
                              <button
                                key={phase}
                                type="button"
                                aria-pressed={active}
                                onClick={() => selectPomodoroPhase(phase)}
                                className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-all hover:-translate-y-px hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/60 ${active ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-200'}`}
                              >
                                <PhaseIcon className="h-3 w-3 shrink-0" style={{ color: active ? POMODORO_PHASE_META[phase].color : undefined }} />
                                <span className="min-w-0 flex-1 truncate text-[8px] font-medium">{POMODORO_PHASE_META[phase].label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 border-t border-white/[0.06] pt-2">
                          <span className="text-[7px] font-medium uppercase tracking-[.12em] text-slate-600">Duration · min</span>
                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Decrease phase duration"
                              disabled={pomodoroPhaseMinutes <= 1}
                              onClick={() => updatePomodoroDuration(
                                pomodoro.phase === 'work' ? 'workMinutes' : pomodoro.phase === 'shortBreak' ? 'shortBreakMinutes' : 'longBreakMinutes',
                                pomodoroPhaseMinutes - 1,
                              )}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.12] disabled:opacity-35"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-0 flex-1 text-center font-mono text-[11px] font-semibold text-white">{pomodoroPhaseMinutes}</span>
                            <button
                              type="button"
                              aria-label="Increase phase duration"
                              disabled={pomodoroPhaseMinutes >= (pomodoro.phase === 'work' ? 180 : pomodoro.phase === 'shortBreak' ? 60 : 90)}
                              onClick={() => updatePomodoroDuration(
                                pomodoro.phase === 'work' ? 'workMinutes' : pomodoro.phase === 'shortBreak' ? 'shortBreakMinutes' : 'longBreakMinutes',
                                pomodoroPhaseMinutes + 1,
                              )}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.12] disabled:opacity-35"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col items-center justify-center border-x border-white/[0.06] px-1">
                        <div className="mb-2 flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[.16em]" style={{ color: POMODORO_PHASE_META[pomodoro.phase].color }}>
                          <span className={`h-1.5 w-1.5 rounded-full ${pomodoro.endAt !== null ? 'animate-pulse' : ''}`} style={{ backgroundColor: POMODORO_PHASE_META[pomodoro.phase].color }} />
                          {pomodoro.endAt !== null ? 'In session' : POMODORO_PHASE_META[pomodoro.phase].label}
                        </div>
                        <div className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center">
                          <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
                            <circle cx="56" cy="56" r="49" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="4" />
                            <motion.circle
                              cx="56"
                              cy="56"
                              r="49"
                              fill="none"
                              stroke={POMODORO_PHASE_META[pomodoro.phase].color}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 49}
                              animate={{ strokeDashoffset: 2 * Math.PI * 49 * (1 - pomodoroProgress) }}
                              transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { duration: 0.45, ease: 'easeOut' }}
                            />
                          </svg>
                          <div className="text-center">
                            <div className="font-mono text-[25px] font-semibold leading-none tracking-tight text-white">{formatTime(pomodoroSeconds)}</div>
                            <div className="mt-1.5 text-[7px] uppercase tracking-[.18em] text-slate-500">{pomodoro.endAt !== null ? 'Remaining' : 'Ready when you are'}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Reset Pomodoro phase"
                            onClick={resetPomodoro}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/60"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={pomodoro.endAt !== null ? pausePomodoro : startPomodoro}
                            className="flex h-8 min-w-[82px] items-center justify-center gap-1.5 rounded-full px-3 text-[9px] font-semibold text-slate-950 shadow-[0_4px_18px_rgba(240,185,130,.16)] transition hover:scale-[1.04] active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-100/70"
                            style={{ backgroundColor: POMODORO_PHASE_META[pomodoro.phase].color }}
                          >
                            {pomodoro.endAt !== null ? <><Pause className="h-3 w-3 fill-current" /> Pause</> : <><Play className="h-3 w-3 fill-current" /> Start</>}
                          </button>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col justify-center gap-2">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2">
                          <div className="text-[7px] font-semibold uppercase tracking-[.14em] text-slate-500">Today</div>
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className="font-mono text-[21px] font-semibold leading-none text-white">{pomodoroSessionsToday}</span>
                            <span className="text-[8px] text-slate-500">focus sessions</span>
                          </div>
                          <div className="mt-2 flex gap-1">
                            {Array.from({ length: pomodoro.longBreakEvery }, (_, index) => (
                              <span key={index} className={`h-1 flex-1 rounded-full transition-colors ${index < pomodoroSessionsToday % pomodoro.longBreakEvery || pomodoroSessionsToday > 0 && pomodoroSessionsToday % pomodoro.longBreakEvery === 0 ? 'bg-amber-200/80' : 'bg-white/[0.08]'}`} />
                            ))}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-1 text-[7px] text-slate-600">
                            <span>Long break every</span>
                            <span className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Decrease sessions before long break"
                                disabled={pomodoro.longBreakEvery <= 2}
                                onClick={() => setPomodoro(current => ({ ...current, longBreakEvery: Math.max(2, current.longBreakEvery - 1) }))}
                                className="flex h-4 w-4 items-center justify-center rounded bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.12] disabled:opacity-35"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <span className="min-w-3 text-center font-mono text-slate-300">{pomodoro.longBreakEvery}</span>
                              <button
                                type="button"
                                aria-label="Increase sessions before long break"
                                disabled={pomodoro.longBreakEvery >= 12}
                                onClick={() => setPomodoro(current => ({ ...current, longBreakEvery: Math.min(12, current.longBreakEvery + 1) }))}
                                className="flex h-4 w-4 items-center justify-center rounded bg-white/[0.05] text-slate-300 transition hover:bg-white/[0.12] disabled:opacity-35"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          </div>
                        </div>
                        <label className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg px-1 py-1 text-[7px] text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200">
                          <span>Completion sound</span>
                          <input
                            type="checkbox"
                            checked={pomodoro.completionSound}
                            onChange={event => {
                              const completionSound = event.currentTarget.checked;
                              setPomodoro(current => ({ ...current, completionSound }));
                            }}
                            className="h-3 w-3 accent-amber-200"
                          />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg px-1 py-1 text-[7px] text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200" title="Shows a brief completion banner inside the notch only when a phase finishes.">
                          <span>Timer Done overlay · notch only</span>
                          <input
                            type="checkbox"
                            checked={pomodoro.showDoneOverlay}
                            onChange={event => {
                              const showDoneOverlay = event.currentTarget.checked;
                              setPomodoro(current => ({ ...current, showDoneOverlay }));
                            }}
                            className="h-3 w-3 accent-amber-200"
                          />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg px-1 py-1 text-[7px] text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200">
                          <span>Auto-start breaks</span>
                          <input
                            type="checkbox"
                            checked={pomodoro.autoStartBreaks}
                            onChange={event => {
                              const autoStartBreaks = event.currentTarget.checked;
                              setPomodoro(current => ({ ...current, autoStartBreaks }));
                            }}
                            className="h-3 w-3 accent-amber-200"
                          />
                        </label>
                        <label className="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg px-1 py-1 text-[7px] text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200">
                          <span>Auto-start focus</span>
                          <input
                            type="checkbox"
                            checked={pomodoro.autoStartWork}
                            onChange={event => {
                              const autoStartWork = event.currentTarget.checked;
                              setPomodoro(current => ({ ...current, autoStartWork }));
                            }}
                            className="h-3 w-3 accent-amber-200"
                          />
                        </label>
                      </div>
                    </motion.section>
                  )}

                  {view === 'health' && settings.jellyNotchWidgets.health && (
                    <motion.section
                      key="health"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="grid h-full w-full min-h-0 grid-cols-[.82fr_1.04fr_1.24fr] overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.045] via-black/20 to-emerald-200/[0.035]"
                    >
                      <div className="flex min-w-0 flex-col border-r border-white/[0.06] p-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white">
                          <Heart className="h-3 w-3 fill-rose-300/20 text-rose-300" /> Health
                        </div>
                        <p className="mt-0.5 truncate text-[7px] text-slate-500">{breakSinceText}</p>
                        <div className="mt-2 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-600">Today</div>
                        <div className="mt-1.5 space-y-2">
                          {healthRingValues.map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex min-w-0 items-center gap-1.5 text-[8px]">
                              <Icon className="h-3 w-3 shrink-0 text-slate-500" />
                              <span className="min-w-0 flex-1 truncate text-slate-400">{label}</span>
                              <span className="shrink-0 font-mono text-slate-200">{value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-auto border-t border-white/[0.06] pt-2">
                          <div className="text-[7px] uppercase tracking-[.12em] text-slate-600">Wellbeing streak</div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-amber-200" />
                            <span className="font-mono text-[14px] font-semibold text-white">{healthStreak}</span>
                            <span className="text-[7px] text-slate-500">{healthStreak === 1 ? 'day' : 'days'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col items-center justify-center border-r border-white/[0.06] px-1.5 py-2">
                        <div className="relative flex h-[112px] w-[112px] shrink-0 items-center justify-center">
                          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" role="img" aria-label="Daily Health progress rings">
                            {healthRingValues.map((ring, index) => {
                              const radius = 42 - index * 10;
                              const circumference = 2 * Math.PI * radius;
                              const progress = Math.min(1, ring.value / Math.max(1, ring.goal));
                              return (
                                <g key={ring.label}>
                                  <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="5" />
                                  <motion.circle
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="none"
                                    stroke={ring.color}
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    animate={{ strokeDashoffset: circumference * (1 - progress) }}
                                    transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 150, damping: 24 }}
                                  />
                                </g>
                              );
                            })}
                          </svg>
                          <div className="text-center">
                            <div className="font-mono text-[17px] font-semibold leading-none text-white">{Math.round(healthRingValues.reduce((total, ring) => total + Math.min(1, ring.value / Math.max(1, ring.goal)), 0) / 3 * 100)}%</div>
                            <div className="mt-1 text-[6px] uppercase tracking-[.16em] text-slate-500">Daily goals</div>
                          </div>
                        </div>
                        <div className="mt-1 flex w-full items-center justify-center gap-2">
                          {healthRingValues.map(ring => (
                            <span key={ring.label} className="flex items-center gap-1 text-[6px] text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ring.color }} />
                              {ring.label}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex w-full items-center justify-between gap-1 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1.5">
                          <span className="flex min-w-0 items-center gap-1 text-[7px] text-slate-400"><Droplets className="h-3 w-3 shrink-0 text-sky-300" /> Water</span>
                          <span className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Log one fewer glass of water"
                              disabled={healthToday.waterGlasses <= 0}
                              onClick={() => updateHealthDay(day => ({ ...day, waterGlasses: Math.max(0, day.waterGlasses - 1) }))}
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.06] text-slate-300 transition hover:bg-white/[0.13] disabled:opacity-35"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-7 text-center font-mono text-[8px] text-white">{healthToday.waterGlasses}/{settings.health.waterGoalGlasses}</span>
                            <button
                              type="button"
                              aria-label="Log one glass of water"
                              onClick={() => updateHealthDay(day => ({ ...day, waterGlasses: Math.min(99, day.waterGlasses + 1) }))}
                              className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-300/10 text-sky-200 transition hover:bg-sky-300/20"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col justify-center gap-1.5 p-2">
                        {healthActivity ? (
                          <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-emerald-200/10 bg-emerald-200/[0.035] p-2 text-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200/[0.09] text-emerald-200">
                              {healthActivity.kind === 'breathe' ? <Wind className="h-4 w-4" /> : <Footprints className="h-4 w-4" />}
                            </div>
                            {healthActivity.kind === 'breathe' ? (
                              <>
                                <motion.div
                                  animate={{ scale: breathStage?.label === 'Breathe in' ? [0.82, 1.08] : breathStage?.label === 'Breathe out' ? [1.08, 0.82] : 1 }}
                                  transition={{ duration: breathStage?.seconds ?? 1, ease: 'easeInOut' }}
                                  className="mt-2 flex h-14 w-14 items-center justify-center rounded-full border border-violet-200/25 bg-violet-300/[0.08] shadow-[0_0_24px_rgba(167,139,250,.12)]"
                                >
                                  <div>
                                    <div className="text-[8px] font-semibold text-white">{breathStage?.label ?? 'Breathe'}</div>
                                    <div className="mt-0.5 font-mono text-[12px] text-violet-200">{breathStageRemaining}</div>
                                  </div>
                                </motion.div>
                                <div className="mt-1.5 text-[7px] text-slate-500">Cycle {Math.min(6, Math.floor(breathElapsedSeconds / Math.max(1, breathCycleSeconds)) + 1)} of 6</div>
                              </>
                            ) : (
                              <>
                                <div className="mt-2 text-[9px] font-semibold text-white">{healthActivityLabel}</div>
                                <div className="mt-1 font-mono text-[19px] font-semibold leading-none text-emerald-100">{formatTime(healthActivityRemainingSeconds)}</div>
                                <div className="mt-1 text-[7px] text-slate-500">{healthActivity.kind === 'stretch' ? 'Follow along at a comfortable pace.' : 'Stand up and move around.'}</div>
                              </>
                            )}
                            <div className="mt-2 flex gap-1.5">
                              {healthActivity.kind !== 'breathe' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHealthActivity(null);
                                    updateHealthDay(day => ({ ...day, breakCount: day.breakCount + 1, lastBreakAt: Date.now() }));
                                  }}
                                  className="rounded-full bg-emerald-200/15 px-2.5 py-1 text-[7px] font-medium text-emerald-100 transition hover:bg-emerald-200/25"
                                >
                                  <Check className="mr-1 inline h-2.5 w-2.5" />Done
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setHealthActivity(null)}
                                className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[7px] font-medium text-slate-300 transition hover:bg-white/[0.12]"
                              >
                                <X className="mr-1 inline h-2.5 w-2.5" />Stop
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mb-0.5 flex items-center gap-1.5 text-[7px] font-semibold uppercase tracking-[.13em] text-slate-500">
                              <Footprints className="h-3 w-3 text-emerald-200" /> Take a break
                            </div>
                            <button
                              type="button"
                              onClick={() => startHealthActivity('move')}
                              className="group flex items-center gap-2 rounded-lg border border-emerald-200/[0.1] bg-emerald-200/[0.035] px-2 py-1.5 text-left transition hover:-translate-y-px hover:border-emerald-200/25 hover:bg-emerald-200/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-200/60"
                            >
                              <Footprints className="h-3 w-3 shrink-0 text-emerald-200" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[8px] font-semibold text-slate-100">Move</span>
                                <span className="block text-[6px] text-slate-500">{settings.health.movementBreakMinutes} min</span>
                              </span>
                              <Play className="h-3 w-3 shrink-0 text-emerald-200 transition-transform group-hover:translate-x-0.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startHealthActivity('breathe')}
                              className="group flex items-center gap-2 rounded-lg border border-violet-200/[0.1] bg-violet-200/[0.035] px-2 py-1.5 text-left transition hover:-translate-y-px hover:border-violet-200/25 hover:bg-violet-200/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-200/60"
                            >
                              <Wind className="h-3 w-3 shrink-0 text-violet-200" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[8px] font-semibold text-slate-100">Breathe</span>
                                <span className="block text-[6px] text-slate-500">{settings.health.breathingPattern === 'box' ? '4–4–4–4' : '4–2–6'} · 6 cycles</span>
                              </span>
                              <Play className="h-3 w-3 shrink-0 text-violet-200 transition-transform group-hover:translate-x-0.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startHealthActivity('stretch')}
                              className="group flex items-center gap-2 rounded-lg border border-teal-200/[0.1] bg-teal-200/[0.035] px-2 py-1.5 text-left transition hover:-translate-y-px hover:border-teal-200/25 hover:bg-teal-200/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-200/60"
                            >
                              <Activity className="h-3 w-3 shrink-0 text-teal-200" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[8px] font-semibold text-slate-100">Stretch</span>
                                <span className="block text-[6px] text-slate-500">Neck · shoulders · stand</span>
                              </span>
                              <Play className="h-3 w-3 shrink-0 text-teal-200 transition-transform group-hover:translate-x-0.5" />
                            </button>
                            <button
                              type="button"
                              onClick={startEyeBreak}
                              className="group flex items-center gap-2 rounded-lg border border-sky-200/[0.1] bg-sky-200/[0.035] px-2 py-1.5 text-left transition hover:-translate-y-px hover:border-sky-200/25 hover:bg-sky-200/[0.08] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-200/60"
                            >
                              <Eye className="h-3 w-3 shrink-0 text-sky-200" />
                              <span className="min-w-0 flex-1">
                                <span className="block text-[8px] font-semibold text-slate-100">Eye rest</span>
                                <span className="block text-[6px] text-slate-500">20-20-20 · {settings.health.eyeBreakDurationSeconds}s</span>
                              </span>
                              <Play className="h-3 w-3 shrink-0 text-sky-200 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            openApp('settings');
                            window.setTimeout(() => window.dispatchEvent(new Event('arlo:open-health-settings')), 120);
                          }}
                          className="mt-0.5 flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-[7px] text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200"
                        >
                          <Settings2 className="h-3 w-3" /> Health settings
                        </button>
                      </div>
                    </motion.section>
                  )}

                  {view === 'lowBattery' && settings.jellyNotchWidgets.lowBattery && (
                    <motion.section
                      key="lowBattery"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className={`flex h-full w-full flex-col justify-between overflow-hidden rounded-[18px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] ${
                        isLowBattery ? 'border-amber-200/20 bg-gradient-to-br from-amber-300/[0.1] via-white/[0.025] to-black/25' : 'border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-black/25'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <motion.span
                            animate={isLowBattery && !reduceMotion && !settings.lowPowerMode ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                            transition={{ duration: 1.8, repeat: isLowBattery && !reduceMotion && !settings.lowPowerMode ? Infinity : 0, ease: 'easeInOut' }}
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                              isLowBattery ? 'border-amber-200/20 bg-amber-300/10 text-amber-300 shadow-[0_0_28px_rgba(251,191,36,.13)]' : 'border-white/[0.08] bg-white/[0.04] text-slate-300'
                            }`}
                          >
                            <Battery className="h-6 w-6" />
                          </motion.span>
                          <div className="min-w-0">
                            <h3 className={`truncate text-[14px] font-semibold ${isLowBattery ? 'text-amber-100' : 'text-white'}`}>
                              {!settings.batteryAvailable ? 'Battery unavailable' : isLowBattery ? 'Low battery' : 'Battery status'}
                            </h3>
                            <p className="mt-1 truncate text-[9px] text-slate-400">
                              {!settings.batteryAvailable
                                ? 'This device does not report a battery level.'
                                : settings.batteryCharging
                                  ? 'Power adapter connected · Charging'
                                  : isLowBattery
                                    ? 'Plug in a power adapter to keep working.'
                                    : settings.batteryPlugged
                                      ? 'Power adapter connected.'
                                      : 'Battery level is healthy.'}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`font-mono text-[34px] font-semibold leading-none tracking-tight ${isLowBattery ? 'text-amber-300' : 'text-white'}`}>
                            {settings.batteryAvailable ? `${settings.batteryLevel}%` : '--'}
                          </div>
                          <div className="mt-1 text-[7px] font-semibold uppercase tracking-[.15em] text-slate-500">
                            {settings.batteryCharging ? 'Charging' : settings.batteryPlugged ? 'Plugged in' : settings.batteryAvailable ? 'On battery' : 'No sensor'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                          <motion.div
                            initial={false}
                            animate={{ width: `${settings.batteryAvailable ? Math.max(0, Math.min(100, settings.batteryLevel)) : 0}%` }}
                            transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 220, damping: 24 }}
                            className={`h-full rounded-full ${isLowBattery ? 'bg-gradient-to-r from-amber-500 to-amber-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-200'}`}
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-[8px] text-slate-500">{settings.batteryAvailable ? `Low battery alert at 20%${settings.batteryCharging ? ' · Alert paused while charging' : ''}` : 'Battery alerts require a device battery sensor'}</span>
                          <button type="button" onClick={() => openApp('settings')} className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[8px] font-medium text-slate-200 transition hover:-translate-y-px hover:border-amber-200/20 hover:bg-white/[0.08]">
                            Power settings
                          </button>
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {view === 'translation' && settings.jellyNotchWidgets.translation && (
                    <motion.section
                      key="translation"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-black/25 p-3"
                    >
                      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200"><Languages className="h-3.5 w-3.5" /></span>
                          <div>
                            <h3 className="text-[11px] font-semibold text-white">Translation</h3>
                            <p className="text-[7px] text-slate-500">Powered by the MyMemory public translation service</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-amber-200/10 bg-amber-200/[0.04] px-2 py-1 text-[7px] text-amber-100/70">Text is sent to the service</span>
                      </div>
                      <form onSubmit={event => void translateText(event)} className="flex min-h-0 flex-1 flex-col gap-2">
                        <div className="flex shrink-0 items-center gap-2">
                          <label className="min-w-0 flex-1">
                            <span className="sr-only">Translate from</span>
                            <select value={translationSource} onChange={event => { setTranslationSource(event.target.value); setTranslationOutput(''); }} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12151b] px-2 text-[9px] font-semibold text-slate-200 outline-none transition focus:border-sky-300/40">
                              {TRANSLATION_LANGUAGES.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
                            </select>
                          </label>
                          <button type="button" aria-label="Swap translation languages" onClick={() => {
                            setTranslationSource(translationTarget);
                            setTranslationTarget(translationSource === 'auto' ? 'en' : translationSource);
                            setTranslationOutput('');
                            setTranslationError(null);
                          }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:rotate-180 hover:border-sky-300/30 hover:bg-sky-300/10 hover:text-sky-100">
                            <Repeat2 className="h-3.5 w-3.5" />
                          </button>
                          <label className="min-w-0 flex-1">
                            <span className="sr-only">Translate to</span>
                            <select value={translationTarget} onChange={event => { setTranslationTarget(event.target.value); setTranslationOutput(''); }} className="h-8 w-full rounded-lg border border-white/[0.08] bg-[#12151b] px-2 text-[9px] font-semibold text-slate-200 outline-none transition focus:border-sky-300/40">
                              {TRANSLATION_LANGUAGES.filter(language => language.code !== 'auto').map(language => <option key={language.code} value={language.code}>{language.label}</option>)}
                            </select>
                          </label>
                        </div>
                        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
                          <label className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-black/20 p-2 transition focus-within:border-sky-300/30">
                            <span className="mb-1 text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Text to translate</span>
                            <textarea value={translationInput} onChange={event => setTranslationInput(event.target.value)} maxLength={500} placeholder="Type or paste text…" className="min-h-0 flex-1 resize-none bg-transparent text-[10px] leading-relaxed text-slate-100 outline-none placeholder:text-slate-600" />
                            <span className="pt-1 text-right text-[7px] text-slate-600">{translationInput.length}/500</span>
                          </label>
                          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025] p-2">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-[7px] font-semibold uppercase tracking-[.12em] text-slate-500">Translation</span>
                              <button type="button" onClick={() => void copyTranslation()} disabled={!translationOutput} className="rounded-md px-1.5 py-0.5 text-[7px] text-slate-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30">{translationCopied ? 'Copied' : 'Copy'}</button>
                            </div>
                            <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-[10px] leading-relaxed text-slate-100">
                              {translationLoading ? <span className="text-sky-200">Translating…</span> : translationOutput || <span className="text-slate-600">Your translated text will appear here.</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center justify-between gap-2">
                          <p role={translationError ? 'alert' : undefined} className={`min-w-0 truncate text-[8px] ${translationError ? 'text-rose-300' : 'text-slate-600'}`}>
                            {translationError ?? 'Only sent when you press Translate.'}
                          </p>
                          <button type="submit" disabled={translationLoading || !translationInput.trim()} className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-sky-300 px-3 text-[9px] font-semibold text-slate-950 transition hover:-translate-y-px hover:bg-sky-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45">
                            {translationLoading ? 'Translating…' : 'Translate'}
                          </button>
                        </div>
                      </form>
                    </motion.section>
                  )}

                  {view === 'windowSnap' && settings.jellyNotchWidgets.windowSnap && (
                    <motion.section
                      key="windowSnap"
                      initial={{ opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={reduceMotion || settings.lowPowerMode ? { duration: 0.12 } : { type: 'spring', stiffness: 360, damping: 30 }}
                      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-black/25 p-3"
                    >
                      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200"><Monitor className="h-3.5 w-3.5" /></span>
                          <div>
                            <h3 className="text-[11px] font-semibold text-white">Snap Zones</h3>
                            <p className="max-w-[330px] truncate text-[7px] text-slate-500">{focusedWindow ? `Target: ${focusedWindow.title}` : 'Open or focus an app window to use snap zones.'}</p>
                          </div>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[7px] ${focusedWindow ? 'border-emerald-200/10 bg-emerald-200/[0.04] text-emerald-100/70' : 'border-white/[0.07] bg-white/[0.03] text-slate-500'}`}>
                          {focusedWindow ? 'Ready' : 'No active window'}
                        </span>
                      </div>
                      <div className="grid min-h-0 flex-1 grid-cols-5 gap-2">
                        {SNAP_ZONES.map(zone => (
                          <button
                            key={zone.id}
                            type="button"
                            disabled={!focusedWindow}
                            aria-label={`Snap active window: ${zone.label}`}
                            title={`Snap ${focusedWindow?.title ?? 'active window'}: ${zone.label}`}
                            onClick={() => {
                              if (!focusedWindow) return;
                              snapWindow(focusedWindow.id, zone.id);
                              if (!settings.jellyNotchDashboard) setView('overview');
                            }}
                            className="group flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-1 py-2 text-center transition duration-150 hover:-translate-y-0.5 hover:border-sky-300/25 hover:bg-sky-300/[0.07] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="grid h-7 w-10 grid-cols-3 grid-rows-2 gap-[2px] rounded-md border border-white/[0.09] bg-black/30 p-1 transition-colors group-hover:border-sky-200/30">
                              {[0, 1, 2, 3, 4, 5].map(cell => (
                                <span key={cell} className={`rounded-[2px] transition-colors ${zone.cells.includes(cell) ? 'bg-sky-300/75 group-hover:bg-sky-200' : 'bg-white/[0.07]'}`} />
                              ))}
                            </span>
                            <span className="w-full truncate text-[8px] font-medium text-slate-300 group-hover:text-white">{zone.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {view === 'notifications' && (
                    <motion.div key="notifications" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="scrollbar-none h-full w-full space-y-2 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <Bell className="h-5 w-5 text-slate-600" />
                          <div className="mt-2 text-[10px] font-semibold text-slate-300">You’re all caught up</div>
                          <div className="mt-1 text-[9px] text-slate-500">New Arlo OS alerts appear here.</div>
                        </div>
                      ) : notifications.slice(0, 4).map(item => (
                        <div key={item.id} className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.035] p-2.5">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300"><Bell className="h-3.5 w-3.5" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-semibold">{item.title}</div>
                            <div className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-slate-400">{item.message}</div>
                          </div>
                          <button type="button" aria-label={`Dismiss ${item.title}`} onClick={() => dismissNotification(item.id)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-white/10 hover:text-white"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {view === 'calendar' && (
                    <motion.div key="calendar" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="h-full w-full">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400">
                            {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(now)}
                          </div>
                          <div className="mt-1 text-lg font-semibold">{calendarTitle}</div>
                        </div>
                        <div className="flex gap-1">
                          <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">‹</button>
                          <button type="button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white">›</button>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <span key={day} className="pb-1 text-[8px] font-medium text-slate-500">{day}</span>)}
                        {calendarDays.map((day, index) => (
                          <span
                            key={`${calendarMonth.getFullYear()}-${calendarMonth.getMonth()}-${index}`}
                            className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[9px] ${
                              day === now.getDate() && calendarMonth.getMonth() === now.getMonth() && calendarMonth.getFullYear() === now.getFullYear()
                                ? 'bg-sky-400 font-bold text-slate-950'
                                : day ? 'text-slate-300' : ''
                            }`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {view === 'weather' && (
                    <motion.div key="weather" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="h-full w-full">
                      {weatherLoading ? (
                        <div className="flex h-full items-center justify-center text-[10px] text-slate-500">Checking your local forecast…</div>
                      ) : weatherError || !weather ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                          <Cloud className="h-6 w-6 text-slate-500" />
                          <div className="mt-2 text-[10px] font-semibold text-slate-300">Weather is unavailable</div>
                          <div className="mt-1 text-[9px] text-slate-500">Check your connection or saved location.</div>
                        </div>
                      ) : (() => {
                        const visual = getWeatherVisual(weather.current.weatherCode, weather.current.isDay);
                        const WeatherIcon = visual.icon === 'sun' ? Sun
                          : visual.icon === 'cloud-sun' ? CloudSun
                            : visual.icon === 'rain' ? CloudRain
                              : Cloud;
                        return (
                          <div className="flex h-full flex-col justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-300/[0.09] text-amber-200">
                                <WeatherIcon className="h-9 w-9" />
                              </div>
                              <div>
                                <div className="text-3xl font-light">{Math.round(weather.current.temperature)}°</div>
                                <div className="mt-1 text-[10px] text-slate-300">{weather.location.name}</div>
                                <div className="text-[9px] text-slate-500">{visual.condition}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {weather.hourly.slice(0, 4).map((hour, index) => {
                                const hourVisual = getWeatherVisual(hour.weatherCode, hour.isDay);
                                const HourIcon = hourVisual.icon === 'sun' ? Sun : hourVisual.icon === 'cloud-sun' ? CloudSun : hourVisual.icon === 'rain' ? CloudRain : Cloud;
                                return (
                                  <div key={`${hour.time}-${index}`} className="rounded-xl bg-white/[0.04] px-2 py-2 text-center">
                                    <div className="text-[8px] text-slate-500">{new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).format(new Date(hour.time))}</div>
                                    <HourIcon className="mx-auto my-1 h-4 w-4 text-sky-200" />
                                    <div className="text-[9px] font-medium">{Math.round(hour.temperature)}°</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {view === 'spaces' && (
                    <motion.div key="spaces" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex h-full w-full flex-col justify-center">
                      <div className="text-[9px] font-medium uppercase tracking-[.16em] text-slate-500">Your workspaces</div>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {spaces.map((space, index) => (
                          <motion.button
                            key={space.id}
                            type="button"
                            aria-pressed={activeSpaceId === space.id}
                            onClick={() => setActiveSpaceId(space.id)}
                            whileTap={{ scale: 0.94 }}
                            className={`rounded-xl border p-3 text-center transition ${
                              activeSpaceId === space.id
                                ? 'border-sky-300/40 bg-sky-300/[0.1] text-white'
                                : 'border-white/[0.07] bg-white/[0.025] text-slate-400 hover:bg-white/[0.06]'
                            }`}
                          >
                            <span className={`mx-auto block h-2 w-2 rounded-full ${activeSpaceId === space.id ? 'bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,.8)]' : 'bg-slate-600'}`} />
                            <span className="mt-2 block truncate text-[9px] font-semibold">{space.name}</span>
                            <span className="mt-0.5 block text-[8px] text-slate-600">{index + 1}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {expanded && !launchIntroActive && !notchSettingsOpen && (
          <motion.button
            type="button"
            aria-label="Open Dynamic Workspace settings"
            title="Dynamic Workspace settings"
            onClick={openNotchSettings}
            whileHover={{ scale: 1.08, rotate: 24 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="group/settings absolute bottom-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full border-0 bg-white/[0.06] p-0 text-slate-300/75 shadow-none transition-colors duration-200 hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/70"
            style={{
              background: settings.jellyNotchStyle === 'aurora'
                ? 'rgba(255,255,255,.1)'
                : settings.jellyNotchStyle === 'transparent'
                  ? 'rgba(255,255,255,.08)'
                  : 'rgba(255,255,255,.06)',
            }}
          >
            <Settings className="h-3.5 w-3.5 transition-transform duration-300 group-hover/settings:rotate-12" />
          </motion.button>
        )}
        </motion.section>
      </div>
      {notchSettingsOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={notchSettingsOverlayRef}
            className="fixed inset-0 z-[14000] flex items-center justify-center bg-black/20 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={event => {
              if (event.target === event.currentTarget) setNotchSettingsOpen(false);
            }}
            onContextMenu={event => event.preventDefault()}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="dynamic-workspace-settings-title"
              initial={{ opacity: 0, scale: 0.96, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 14 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              drag={!notchSettingsMaximized}
              dragListener={false}
              dragControls={notchSettingsDragControls}
              dragConstraints={notchSettingsOverlayRef}
              dragMomentum={false}
              whileDrag={{ scale: 1.003 }}
              className="relative flex min-h-0 max-w-full overflow-hidden rounded-[28px] border border-white/20 bg-[#111722]/75 text-white shadow-[0_32px_100px_rgba(0,0,0,.48),inset_0_1px_0_rgba(255,255,255,.1)] backdrop-blur-2xl backdrop-saturate-150"
              style={{
                width: notchSettingsMaximized ? Math.max(320, window.innerWidth - 32) : notchSettingsSize.width,
                height: notchSettingsMaximized ? Math.max(320, window.innerHeight - 32) : notchSettingsSize.height,
                maxWidth: 'calc(100vw - 32px)',
                maxHeight: 'calc(100dvh - 32px)',
                transition: 'width 220ms ease, height 220ms ease, border-radius 220ms ease',
                borderRadius: notchSettingsMaximized ? 20 : 28,
              }}
              onMouseDown={event => event.stopPropagation()}
            >
              <aside className="hidden w-48 shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.025] p-3 lg:flex">
                <div className="mb-7 flex items-center gap-3 px-2 pt-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-sky-400/20 to-violet-400/15">
                    <Activity className="h-4 w-4 text-sky-200" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold">Dynamic Workspace</div>
                    <div className="mt-0.5 text-[9px] text-slate-500">Preferences</div>
                  </div>
                </div>
                {([
                  { id: 'general', label: 'General', icon: Settings2 },
                  { id: 'widgets', label: 'Widgets', icon: Layers },
                  { id: 'detectives', label: 'Detectives', icon: Bot },
                  { id: 'files', label: 'Files Tray', icon: FolderOpen },
                  { id: 'appearance', label: 'Customize', icon: Activity },
                ] as const).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={settingsTab === tab.id ? 'page' : undefined}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[10px] font-medium transition ${
                        settingsTab === tab.id ? 'bg-sky-400/15 text-sky-100' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
                <div className="mt-auto rounded-2xl border border-white/[0.07] bg-black/20 p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-slate-500">Quick tip</div>
                  <p className="mt-1.5 text-[9px] leading-relaxed text-slate-400">Hover the island to reveal your live activities. Right-click it anytime to return to these preferences.</p>
                </div>
              </aside>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent px-4 py-3 sm:px-6">
                  <div>
                    <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-sky-300/80">Appearance & behavior</div>
                    <h2 id="dynamic-workspace-settings-title" className="mt-1 text-base font-semibold tracking-tight">
                      {settingsTab === 'general' ? 'General' : settingsTab === 'widgets' ? 'Choose your widgets' : settingsTab === 'detectives' ? 'Choose a Detective' : settingsTab === 'files' ? 'Files Tray' : 'Customize the island'}
                    </h2>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onPointerDown={event => notchSettingsDragControls.start(event)}
                      aria-label="Move Dynamic Workspace settings"
                      title="Drag to move settings"
                      className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white active:cursor-grabbing focus-visible:outline-none"
                    >
                      <Move className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotchSettingsMaximized(value => !value)}
                      aria-label={notchSettingsMaximized ? 'Restore settings size' : 'Maximize settings'}
                      title={notchSettingsMaximized ? 'Restore size' : 'Expand settings'}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none"
                    >
                      {notchSettingsMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  <button
                    type="button"
                    aria-label="Close Dynamic Workspace settings"
                    onClick={() => setNotchSettingsOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  </div>
                </header>

                <nav className="scrollbar-none flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.07] px-4 py-2 lg:hidden" aria-label="Notch settings">
                  {([
                    { id: 'general', label: 'General' },
                    { id: 'widgets', label: 'Widgets' },
                    { id: 'detectives', label: 'Detectives' },
                    { id: 'files', label: 'Files' },
                    { id: 'appearance', label: 'Customize' },
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      aria-current={settingsTab === tab.id ? 'page' : undefined}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`shrink-0 rounded-lg px-3 py-2 text-[9px] font-medium transition-colors ${
                        settingsTab === tab.id ? 'bg-sky-300/15 text-sky-100' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div className="scrollbar-none min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5">
                  {settingsTab === 'general' ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                        <div>
                          <div className="text-xs font-semibold">Show Dynamic Workspace</div>
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">Keep the island attached to the top edge and ready for live activity.</p>
                        </div>
                        <JellySwitch checked={settings.jellyNotchEnabled} label="Show Dynamic Workspace" onChange={enabled => updateSettings({ jellyNotchEnabled: enabled })} />
                      </div>
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-sky-300/15 bg-gradient-to-r from-sky-400/[0.08] via-white/[0.025] to-violet-400/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]">
                        <div>
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <Activity className="h-3.5 w-3.5 text-sky-200" />
                            Show Dashboard
                          </div>
                          <p className="mt-1 max-w-md text-[10px] leading-relaxed text-slate-400">Add the full dashboard and feature bar to the expanded island. Turn it off to keep the compact live-widget view.</p>
                        </div>
                        <JellySwitch
                          checked={settings.jellyNotchDashboard}
                          label="Show Dashboard"
                          onChange={enabled => {
                            updateSettings({ jellyNotchDashboard: enabled });
                            if (enabled) {
                              setView('overview');
                              setPinned(true);
                              setExpanded(true);
                              setNotchSettingsOpen(false);
                            }
                          }}
                        />
                      </div>
                      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-xs font-semibold">Open animation</h3>
                            <p className="mt-1 text-[10px] text-slate-400">Choose how the Dynamic Workspace expands and closes.</p>
                          </div>
                          <span className="rounded-full border border-white/[0.08] px-2 py-1 text-[8px] text-slate-500">10 styles</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {NOTCH_OPEN_ANIMATIONS.map(animation => (
                            <button
                              key={animation.id}
                              type="button"
                              aria-pressed={settings.jellyNotchAnimation === animation.id}
                              onClick={() => updateSettings({ jellyNotchAnimation: animation.id })}
                              className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                                settings.jellyNotchAnimation === animation.id
                                  ? 'border-sky-300/35 bg-sky-300/[0.1] text-sky-100'
                                  : 'border-white/[0.07] bg-black/10 text-slate-300 hover:border-white/15 hover:bg-white/[0.045]'
                              }`}
                            >
                              <span className="block text-[9px] font-semibold">{animation.label}</span>
                              <span className="mt-1 block text-[8px] leading-relaxed text-slate-500">{animation.description}</span>
                            </button>
                          ))}
                        </div>
                        {(reduceMotion || settings.lowPowerMode || settings.animationLevel !== 'full') && (
                          <p className="mt-2 text-[9px] text-slate-500">Reduced motion or power saving is enabled, so expansion uses a gentle transition.</p>
                        )}
                      </section>
                      <button
                        type="button"
                        onClick={() => setSettingsTab('widgets')}
                        className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left transition hover:border-sky-300/30 hover:bg-white/[0.055]"
                      >
                        <span>
                          <span className="block text-xs font-semibold">Choose what appears in the island</span>
                          <span className="mt-1 block text-[10px] text-slate-400">Turn individual live widgets on or off.</span>
                        </span>
                        <ChevronDown className="h-4 w-4 -rotate-90 text-slate-500 transition group-hover:text-sky-200" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettingsTab('appearance')}
                        className="group flex w-full items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-left transition hover:border-sky-300/30 hover:bg-white/[0.055]"
                      >
                        <span>
                          <span className="block text-xs font-semibold">Customize shape and glass</span>
                          <span className="mt-1 block text-[10px] text-slate-400">Choose the island shape, material, transparency, and blur.</span>
                        </span>
                        <ChevronDown className="h-4 w-4 -rotate-90 text-slate-500 transition group-hover:text-sky-200" />
                      </button>
                      <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
                        <div className="mb-3 text-[9px] font-semibold uppercase tracking-[.14em] text-slate-500">Live preview</div>
                        <div className="flex h-20 items-start justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-700/40 to-slate-950/80 pt-0">
                          <div className="flex h-8 min-w-40 items-center justify-center gap-2 rounded-b-2xl border border-white/10 px-4 text-[9px] font-medium shadow-xl" style={{ background: menuBarSurface, backdropFilter: `blur(${settings.jellyNotchBlur}px)` }}>
                            <Activity className="h-3 w-3 text-sky-200" />
                            <span>Hover to expand</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : settingsTab === 'widgets' ? (
                    <div className="space-y-2.5">
                      <p className="mb-4 text-[10px] leading-relaxed text-slate-400">Choose which live activities and tools are available when you hover over the island. Enabled items appear in a smooth, horizontally scrolling row.</p>
                      {NOTCH_WIDGETS.map(widget => {
                        const Icon = widget.icon;
                        const checked = settings.jellyNotchWidgets[widget.id];
                        return (
                          <div key={widget.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                            checked ? 'border-sky-300/20 bg-sky-300/[0.045]' : 'border-white/[0.06] bg-white/[0.02]'
                          }`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] ${
                              checked ? 'bg-sky-300/10 text-sky-200' : 'bg-white/[0.035] text-slate-500'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-semibold text-slate-100">{widget.label}</span>
                              <span className="mt-0.5 block text-[9px] leading-relaxed text-slate-500">{widget.description}</span>
                            </span>
                            <JellySwitch
                              checked={checked}
                              label={`Show ${widget.label}`}
                              onChange={enabled => updateSettings({
                                jellyNotchWidgets: { ...settings.jellyNotchWidgets, [widget.id]: enabled },
                              })}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : settingsTab === 'detectives' ? (
                    <section className="min-w-0 space-y-4">
                      <div className="rounded-2xl border border-sky-300/15 bg-gradient-to-br from-sky-300/[0.08] to-violet-400/[0.04] p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={appearanceIdlePath}
                            alt=""
                            aria-hidden="true"
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-12 rounded-xl object-contain"
                          />
                          <div>
                            <h3 className="text-[11px] font-semibold text-white">{appearanceDetective[0].toUpperCase() + appearanceDetective.slice(1)} appearance</h3>
                            <p className="mt-1 text-[9px] leading-relaxed text-slate-400">Choose a color. The matching animated detective appears in the compact notch.</p>
                          </div>
                        </div>
                      </div>
                      <div className="scrollbar-none flex min-w-0 gap-1.5 overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                        {DETECTIVES.map(({ id, name }) => (
                          <button
                            key={id}
                            type="button"
                            aria-pressed={appearanceDetective === id}
                            onClick={() => {
                              setAppearanceDetective(id);
                              updateDetectiveConfig({ selectedId: id });
                            }}
                            className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-medium capitalize transition-colors ${
                              appearanceDetective === id ? 'bg-sky-300/15 text-sky-100' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                        {detectiveConfig.customDetectives.map(profile => (
                          <button
                            key={profile.id}
                            type="button"
                            aria-pressed={selectedDetective.id === profile.id}
                            onClick={() => updateDetectiveConfig({ selectedId: profile.id })}
                            className={`max-w-36 shrink-0 truncate rounded-lg px-3 py-2 text-[10px] font-medium transition-colors ${
                              selectedDetective.id === profile.id ? 'bg-sky-300/15 text-sky-100' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {profile.name}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {appearanceColors.map(option => {
                          const selected = appearanceColor === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                if (appearanceDetective === 'scout' && isScoutColor(option.id)) {
                                  updateDetectiveConfig({ scoutColor: option.id });
                                } else if (appearanceDetective === 'ember' && isEmberColor(option.id)) {
                                  updateDetectiveConfig({ emberColor: option.id });
                                } else if (appearanceDetective === 'mint' && isMintColor(option.id)) {
                                  updateDetectiveConfig({ mintColor: option.id });
                                } else if (appearanceDetective === 'ruby' && isRubyColor(option.id)) {
                                  updateDetectiveConfig({ rubyColor: option.id });
                                } else if (appearanceDetective === 'petal' && isPetalColor(option.id)) {
                                  updateDetectiveConfig({ petalColor: option.id });
                                } else if (appearanceDetective === 'violet' && isVioletColor(option.id)) {
                                  updateDetectiveConfig({ violetColor: option.id });
                                } else if (appearanceDetective === 'sunny' && isSunnyColor(option.id)) {
                                  updateDetectiveConfig({ sunnyColor: option.id });
                                } else if (appearanceDetective === 'mocha' && isMochaColor(option.id)) {
                                  updateDetectiveConfig({ mochaColor: option.id });
                                }
                              }}
                              className={`group flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-2 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                                selected ? 'border-sky-300/50 bg-sky-300/[0.1] shadow-[0_0_18px_rgba(56,189,248,.12)]' : 'border-white/[0.07] bg-white/[0.02]'
                              }`}
                            >
                              <img
                                src={option.idlePath}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-110"
                              />
                              <span className="flex items-center gap-1.5 text-[9px] font-medium text-slate-200">
                                <span className="h-2 w-2 rounded-full ring-1 ring-white/15" style={{ backgroundColor: option.swatch }} />
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="break-words text-[11px] font-semibold text-white">{selectedDetective.name} · {selectedDetective.role}</h3>
                            <p className="mt-1 break-words text-[9px] leading-relaxed text-slate-400">{selectedDetective.description}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] ${ghostBusy ? 'bg-sky-300/10 text-sky-200' : 'bg-emerald-300/10 text-emerald-200'}`}>
                            {ghostBusy ? 'Working' : 'Available'}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-[8px] text-slate-500">Current task: {ghostBusy
                          ? [...ghostMessages].reverse().find(message => message.role === 'user')?.content ?? 'Working on your request'
                          : 'None'}</p>
                        <p className="mt-2 break-words text-[9px] leading-relaxed text-slate-400">Capabilities: {selectedDetective.permittedTools.map(tool => tool.replaceAll('_', ' ')).join(' · ') || 'Chat only'}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={createCustomDetective}
                            disabled={detectiveConfig.customDetectives.length >= 12}
                            className="rounded-lg border border-sky-300/20 bg-sky-300/[0.08] px-3 py-2 text-[9px] font-medium text-sky-100 transition hover:bg-sky-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Create custom detective
                          </button>
                          {selectedCustomDetective && (
                            <button
                              type="button"
                              onClick={() => updateDetectiveConfig({
                                selectedId: 'scout',
                                customDetectives: detectiveConfig.customDetectives.filter(profile => profile.id !== selectedCustomDetective.id),
                              })}
                              className="rounded-lg border border-rose-300/15 px-3 py-2 text-[9px] text-rose-200/80 transition hover:bg-rose-300/[0.08]"
                            >
                              Remove custom detective
                            </button>
                          )}
                        </div>
                        {selectedCustomDetective && (
                          <div className="mt-4 space-y-3 border-t border-white/[0.07] pt-4">
                            <label className="block text-[9px] text-slate-400">
                              Name
                              <input
                                value={selectedCustomDetective.name}
                                maxLength={32}
                                onChange={event => updateCustomDetective({ name: event.target.value })}
                                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-[10px] text-white outline-none focus:border-sky-300/30"
                              />
                            </label>
                            <label className="block text-[9px] text-slate-400">
                              Avatar
                              <select
                                value={selectedCustomDetective.avatarId}
                                onChange={event => {
                                  const avatar = DETECTIVES.find(detective => detective.id === event.target.value);
                                  if (avatar) updateCustomDetective({ avatarId: avatar.id });
                                }}
                                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-[#10131b] px-3 py-2 text-[10px] text-white outline-none focus:border-sky-300/30"
                              >
                                {DETECTIVES.map(detective => <option key={detective.id} value={detective.id}>{detective.name}</option>)}
                              </select>
                            </label>
                            <label className="block text-[9px] text-slate-400">
                              Instructions
                              <textarea
                                value={selectedCustomDetective.instructions}
                                maxLength={1000}
                                rows={3}
                                onChange={event => updateCustomDetective({ instructions: event.target.value })}
                                placeholder="Describe this detective's tone and approach."
                                className="mt-1 w-full resize-y rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-[10px] leading-relaxed text-white outline-none focus:border-sky-300/30"
                              />
                            </label>
                            <fieldset>
                              <legend className="mb-2 text-[9px] text-slate-400">Permitted tools</legend>
                              <div className="grid grid-cols-2 gap-1.5">
                                {SUPPORTED_DETECTIVE_TOOLS.map(tool => {
                                  const checked = selectedCustomDetective.permittedTools.includes(tool);
                                  return (
                                    <label key={tool} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-black/10 px-2 py-1.5 text-[8px] text-slate-300">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                          const permittedTools = checked
                                            ? selectedCustomDetective.permittedTools.filter(item => item !== tool)
                                            : [...selectedCustomDetective.permittedTools, tool];
                                          updateCustomDetective({ permittedTools });
                                        }}
                                        className="accent-sky-300"
                                      />
                                      {tool.replaceAll('_', ' ')}
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
                            <p className="text-[8px] leading-relaxed text-slate-500">Only checked, registered tools can perform desktop actions. Instructions cannot grant additional permissions.</p>
                          </div>
                        )}
                      </section>
                    </section>
                  ) : settingsTab === 'files' ? (
                    <div className="space-y-4">
                      <div
                        onDragEnter={event => { event.preventDefault(); setTrayDragActive(true); }}
                        onDragOver={event => event.preventDefault()}
                        onDragLeave={event => {
                          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTrayDragActive(false);
                        }}
                        onDrop={event => {
                          event.preventDefault();
                          setTrayDragActive(false);
                          void addDroppedItems(event.dataTransfer);
                        }}
                        className={`flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition-colors ${
                          trayDragActive ? 'border-sky-200 bg-sky-300/15' : 'border-sky-300/30 bg-sky-300/[0.045]'
                        }`}
                      >
                        <motion.span animate={trayDragActive ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.6, repeat: trayDragActive ? Infinity : 0 }} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200/20 bg-sky-300/10 text-sky-100">
                          <FolderOpen className="h-5 w-5" />
                        </motion.span>
                        <div className="mt-3 text-[12px] font-semibold text-slate-100">Drop files, apps, or folders</div>
                        <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-slate-400">Drop files, apps, or folders here. Return moved desktop items anytime.</p>
                        {trayError && <p role="alert" className="mt-2 text-[10px] text-rose-300">{trayError}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-semibold text-slate-200">{trayItems.length} {trayItems.length === 1 ? 'item' : 'items'}</div>
                        {trayItems.length > 0 && <button type="button" onClick={clearTray} className="rounded-lg px-2 py-1 text-[9px] font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-rose-200">Clear tray</button>}
                      </div>
                      {trayItems.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {trayItems.map(item => {
                            const ItemIcon = item.isDirectory ? Folder : item.appId || item.type === 'app' ? Layers : item.type.startsWith('image/') ? FileImage : /zip|compressed|archive/i.test(item.type) ? FileArchive : FileText;
                            return (
                              <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] p-2.5"
                              >
                                {item.previewUrl ? <img src={item.previewUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-sky-200"><ItemIcon className="h-4 w-4" /></span>}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[10px] font-medium text-slate-100" title={item.relativePath}>{item.name}</span>
                                  <span className="mt-0.5 block truncate text-[8px] text-slate-500">{item.isDirectory ? 'Folder' : item.appId || item.type === 'app' ? 'App shortcut' : `${formatFileSize(item.size)} · ${item.type.split('/').pop() || 'file'}`}</span>
                                </span>
                                {!item.isDirectory && item.file && (
                                  <a
                                    href={item.objectUrl}
                                    download={item.name}
                                    aria-label={`Download ${item.name}`}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-300/10 hover:text-sky-100"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {(item.virtualFileId || item.appId) ? (
                                  <button
                                    type="button"
                                    aria-label={`Move ${item.name} back to Desktop`}
                                    onClick={() => returnTrayItemToDesktop(item)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-sky-300/10 hover:text-sky-100"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button type="button" aria-label={`Remove ${item.name} from tray`} onClick={() => removeTrayItem(item.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-300/10 hover:text-rose-200"><X className="h-3.5 w-3.5" /></button>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-black/10 px-4 py-8 text-center">
                          <FileIcon className="h-5 w-5 text-slate-600" />
                          <span className="mt-2 text-[10px] text-slate-400">Your dropped items will appear here</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <section>
                        <div className="mb-3 text-[9px] font-semibold uppercase tracking-[.15em] text-slate-500">Surface material</div>
                        <div className="grid grid-cols-2 gap-2">
                          {NOTCH_STYLES.map(style => (
                            <button
                              key={style.id}
                              type="button"
                              aria-pressed={settings.jellyNotchStyle === style.id}
                              onClick={() => updateSettings({ jellyNotchStyle: style.id })}
                              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                                settings.jellyNotchStyle === style.id ? 'border-sky-300/50 bg-sky-300/[0.08]' : 'border-white/[0.08] bg-white/[0.025] hover:border-white/20'
                              }`}
                            >
                              <span className="h-9 w-12 shrink-0 rounded-lg border border-white/15" style={{ background: style.background, backdropFilter: 'blur(10px)' }} />
                              <span className="min-w-0 flex-1 text-[10px] font-medium">{style.label}</span>
                              {settings.jellyNotchStyle === style.id && <Check className="h-3.5 w-3.5 text-sky-200" />}
                            </button>
                          ))}
                        </div>
                      </section>
                      <section>
                        <div className="mb-3 text-[9px] font-semibold uppercase tracking-[.15em] text-slate-500">Shape</div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {NOTCH_SHAPES.map(shape => {
                            const shapeSize = SHAPE_SIZES[shape.id];
                            return (
                              <button
                                key={shape.id}
                                type="button"
                                aria-pressed={settings.jellyNotchShape === shape.id}
                                onClick={() => updateSettings({ jellyNotchShape: shape.id })}
                                className={`flex min-h-[68px] flex-col items-center justify-center gap-2 rounded-xl border p-2 transition ${
                                  settings.jellyNotchShape === shape.id ? 'border-sky-300/50 bg-sky-300/[0.08] text-white' : 'border-white/[0.07] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                                }`}
                              >
                                <span
                                  className="block max-w-14 bg-gradient-to-br from-slate-600 to-black shadow-[0_2px_12px_rgba(56,189,248,.15)]"
                                  style={{ width: Math.min(shapeSize.width / 6, 52), height: Math.min(shapeSize.height / 2, 24), borderRadius: shapeSize.radius }}
                                />
                                <span className="text-[9px]">{shape.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                      {settings.jellyNotchShape === 'custom' && (
                        <div className="grid gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 sm:grid-cols-2">
                          <label className="space-y-2 text-[10px] text-slate-400">
                            <span className="flex justify-between"><span>Width</span><span>{settings.jellyNotchWidth}px</span></span>
                            <input aria-label="Island width" type="range" min="120" max="480" step="4" value={settings.jellyNotchWidth} onChange={event => updateSettings({ jellyNotchWidth: Number(event.target.value) })} className="w-full accent-sky-400" />
                          </label>
                          <label className="space-y-2 text-[10px] text-slate-400">
                            <span className="flex justify-between"><span>Height</span><span>{settings.jellyNotchHeight}px</span></span>
                            <input aria-label="Island height" type="range" min="40" max="96" step="2" value={settings.jellyNotchHeight} onChange={event => updateSettings({ jellyNotchHeight: Number(event.target.value) })} className="w-full accent-sky-400" />
                          </label>
                        </div>
                      )}
                      <div className="grid gap-4 border-t border-white/[0.08] pt-4 sm:grid-cols-2">
                        <label className="space-y-2 text-[10px] text-slate-400">
                          <span className="flex justify-between"><span>Transparency</span><span>{settings.jellyNotchOpacity}%</span></span>
                          <input aria-label="Island transparency" type="range" min="35" max="100" value={settings.jellyNotchOpacity} onChange={event => updateSettings({ jellyNotchOpacity: Number(event.target.value) })} className="w-full accent-sky-400" />
                        </label>
                        <label className="space-y-2 text-[10px] text-slate-400">
                          <span className="flex justify-between"><span>Glass blur</span><span>{settings.jellyNotchBlur}px</span></span>
                          <input aria-label="Island glass blur" type="range" min="0" max="40" value={settings.jellyNotchBlur} onChange={event => updateSettings({ jellyNotchBlur: Number(event.target.value) })} className="w-full accent-sky-400" />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.08] py-3 pl-5 pr-12 text-[9px] text-slate-500 sm:pl-7">
                  <span>{settingsTab === 'files' ? 'Tray items stay here while ARLO OS is open' : 'Changes are saved automatically'}</span>
                  <button type="button" onClick={() => setNotchSettingsOpen(false)} className="rounded-lg bg-white/[0.08] px-3 py-1.5 font-medium text-slate-200 transition hover:bg-white/[0.14] focus-visible:outline-none">Done</button>
                </footer>
              </div>
              {!notchSettingsMaximized && (
                <div
                  role="separator"
                  aria-label="Resize Dynamic Workspace settings"
                  aria-orientation="horizontal"
                  title="Drag to resize"
                  onPointerDown={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    notchSettingsResizeRef.current = {
                      x: event.clientX,
                      y: event.clientY,
                      width: notchSettingsSize.width,
                      height: notchSettingsSize.height,
                    };
                  }}
                  onPointerMove={event => {
                    const start = notchSettingsResizeRef.current;
                    if (!start) return;
                    setNotchSettingsSize({
                      width: Math.min(window.innerWidth - 32, Math.max(600, start.width + event.clientX - start.x)),
                      height: Math.min(window.innerHeight - 32, Math.max(480, start.height + event.clientY - start.y)),
                    });
                  }}
                  onPointerUp={event => {
                    notchSettingsResizeRef.current = null;
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                    }
                  }}
                  onPointerCancel={() => {
                    notchSettingsResizeRef.current = null;
                  }}
                  className="absolute bottom-1 right-1 z-20 flex h-8 w-8 cursor-nwse-resize touch-none items-end justify-end rounded-tl-xl p-2 text-slate-400 transition hover:text-sky-100"
                >
                  <span className="h-3 w-3 border-b-2 border-r-2 border-current opacity-70" />
                </div>
              )}
            </motion.section>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
      {eyeBreakEndAt !== null && createPortal(
        <AnimatePresence>
          <motion.div
            key="health-eye-break"
            role="dialog"
            aria-modal="true"
            aria-labelledby="health-eye-break-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-[#070809] px-6 text-center text-white"
          >
            <div className="relative flex h-32 w-32 items-center justify-center">
              <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
                <circle cx="56" cy="56" r="49" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="3" />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="49"
                  fill="none"
                  stroke="rgba(226,232,240,.72)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 49}
                  animate={{ strokeDashoffset: 2 * Math.PI * 49 * (1 - eyeBreakRemainingSeconds / Math.max(1, settings.health.eyeBreakDurationSeconds)) }}
                  transition={{ duration: 0.35 }}
                />
              </svg>
              <span className="font-mono text-[36px] font-light tabular-nums text-slate-100">{eyeBreakRemainingSeconds}</span>
            </div>
            <h2 id="health-eye-break-title" className="mt-5 text-xl font-semibold tracking-tight">Eye break</h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">Look at something about 20 feet (6 metres) away.</p>
            <button
              type="button"
              autoFocus
              onClick={skipEyeBreak}
              className="mt-8 rounded-full bg-slate-100 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.03] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Skip
            </button>
            <p className="mt-5 text-[11px] text-slate-600">Press Esc or select Skip to end the break.</p>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

const MusicGlyph = () => (
  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/30 to-violet-500/30">
    <Activity className="h-5 w-5 text-sky-200" />
  </div>
);

const StatusItem: React.FC<{ icon: React.ElementType; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="min-w-0 flex-1">
    <div className="flex items-center gap-1 text-[8px] text-slate-500"><Icon className="h-3 w-3" />{label}</div>
    <div className="mt-1 truncate text-[9px] font-medium text-slate-300">{value}</div>
  </div>
);

const JellySwitch: React.FC<{
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}> = ({ checked, label, onChange }) => (
  <motion.button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    whileTap={{ scale: 0.94 }}
    className={`relative h-6 w-11 shrink-0 overflow-hidden rounded-full border border-white/[0.08] transition-colors duration-200 ${
      checked ? 'bg-sky-500' : 'bg-white/15'
    }`}
  >
    <motion.span
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.55 }}
      className="absolute left-1 top-1 block h-4 w-4 rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,.32)]"
    />
  </motion.button>
);
