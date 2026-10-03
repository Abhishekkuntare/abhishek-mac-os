
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';

import {

  Folder,

  FileText,

  Terminal,

  Code2,

  Trash2,

  Image,

  RefreshCw,

  Monitor,

  Tv,

  Maximize2,

  HardDrive,

  UploadCloud,

  Laptop,

  Plus,

  Grid,

  Copy,

  ClipboardPaste,

  Scissors,

  Files,

  X,

  FileSpreadsheet,

  FileCode,

  Sparkles,

  Smartphone,

  Info,

  Pin,

  PinOff,

  ExternalLink,

  Camera as CameraIcon,
  Pencil,
  Star,
  StarOff,
  Archive,
  Keyboard,
  MousePointer2,
  ChevronRight,
  Check,
  ArrowDownAZ,
  ArrowUpAZ,
  FileType2,
  CalendarDays,

} from 'lucide-react';

import { useOS } from '../../context/OSContext';

import { LiveWallpaper } from './LiveWallpaper';

import { DesktopWidgets } from './DesktopWidgets';

import { vfs } from '../../services/virtualFileSystem';

import { sound } from '../../services/soundService';

import { VirtualFile } from '../../types/desktop';
import { APP_REGISTRY } from '../../data/defaultApps';
import { AppFeaturesModal } from '../system/AppFeaturesModal';
import { AppIcon } from '../system/AppIcon';



interface ContextMenuState {

  x: number;

  y: number;

  visible: boolean;

  targetId?: string | null;

}



interface Position {

  x: number;

  y: number;

}



type DesktopItem =

  | {

      id: string;

      name: string;

      isSystem: true;

      type: string;

      appId: string;
      iconAssetId?: string;
      icon: React.ComponentType<{ className?: string }>;

      gradient: string;

    }

  | {

      id: string;

      name: string;

      isSystem: false;

      type: string;

      file: VirtualFile;

    };



const DESKTOP_POS_KEY = 'abhishek_os_desktop_icon_positions_v2';
const DESKTOP_DOCK_SHORTCUTS_KEY = 'abhishek_os_desktop_dock_shortcuts_v1';
const DOCK_APP_DRAG_TYPE = 'application/x-abhishek-os-dock-app';

interface ContextMenuItemProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  shortcut?: string;
  accent?: string;
  danger?: boolean;
  hasSubmenu?: boolean;
  onClick: () => void;
}

const ContextMenuSeparator: React.FC = () => (
  <div className="h-px bg-white/[0.14] mx-1.5 my-1.5" />
);

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({
  icon: Icon,
  label,
  shortcut,
  accent,
  danger = false,
  hasSubmenu = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      group/menuitem relative w-full h-[40px] px-3.5
      rounded-[9px] flex items-center gap-3 text-left
      outline-none select-none transition-all duration-150
      hover:bg-white/[0.105] active:bg-white/[0.14] active:scale-[0.985]
      ${danger ? 'text-rose-100 hover:bg-rose-500/[0.16]' : 'text-white/[0.94]'}
    `}
  >
    <Icon
      className={`
        h-[18px] w-[18px] shrink-0 transition-transform duration-150
        group-hover/menuitem:scale-[1.06]
        ${danger ? 'text-rose-300' : accent || 'text-white/80'}
      `}
      strokeWidth={1.9}
    />

    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-[-0.01em]">
      {label}
    </span>

    {shortcut && (
      <span className="ml-3 shrink-0 text-[11px] font-medium text-white/45">
        {shortcut}
      </span>
    )}

    {hasSubmenu && (
      <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-white/55 transition-transform duration-150 group-hover/menuitem:translate-x-0.5" strokeWidth={1.8} />
    )}
  </button>
);



export const Desktop: React.FC = () => {

  const {

    currentWallpaper,

    settings,

    openApp,

    setQuickLookFile,

    importLocalFiles,

    connectLocalDirectory,

    addNotification,

    toggleDockPin,

    dockAppIds,

  } = useOS();



  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const desktopContainerRef = useRef<HTMLDivElement | null>(null);



  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false });

  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const [contextMenuSize, setContextMenuSize] = useState({
    width: 320,
    height: 500,
  });

  // Desktop View / Sort controls used by the main right-click menu.
  const [desktopIconSize, setDesktopIconSize] = useState<'large' | 'medium' | 'small'>('medium');
  const [showDesktopIcons, setShowDesktopIcons] = useState(true);
  const [desktopSortBy, setDesktopSortBy] = useState<'name' | 'type' | 'date'>('name');
  const [desktopSortDirection, setDesktopSortDirection] = useState<'asc' | 'desc'>('asc');
  const [openDesktopSubmenu, setOpenDesktopSubmenu] = useState<'view' | 'sort' | null>(null);

  const [selectedIconIds, setSelectedIconIds] = useState<string[]>([]);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isDockAppDragOver, setIsDockAppDragOver] = useState(false);
  const [desktopDockShortcuts, setDesktopDockShortcuts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DESKTOP_DOCK_SHORTCUTS_KEY);
      return saved ? [...new Set(JSON.parse(saved) as string[])] : [];
    } catch (error) {
      console.warn('Could not load desktop app shortcuts.', error);
      return [];
    }
  });

  const [featuresModalAppId, setFeaturesModalAppId] = useState<string | null>(null);



  // Modals

  const [showNewFileModal, setShowNewFileModal] = useState(false);

  const [newFileName, setNewFileName] = useState('');

  const [newFileType, setNewFileType] = useState<'document' | 'code'>('document');

  const [newFileExtension, setNewFileExtension] = useState('txt');

  // Custom rename modal (never use the browser/Electron default prompt)
  const [renameModal, setRenameModal] = useState<{
    open: boolean;
    fileId: string | null;
    currentName: string;
    value: string;
    extension: string;
  }>({
    open: false,
    fileId: null,
    currentName: '',
    value: '',
    extension: '',
  });

  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const [showShortcutPanel, setShowShortcutPanel] = useState(true);



  // Desktop files

  const [desktopFiles, setDesktopFiles] = useState(() => vfs.getFiles('/Users/abhishek/Desktop'));



  // Saved movable icon positions

  const [customPositions, setCustomPositions] = useState<Record<string, Position>>(() => {

    try {

      const stored = localStorage.getItem(DESKTOP_POS_KEY);

      return stored ? JSON.parse(stored) : {};

    } catch {

      return {};

    }

  });



  // Drag state tracker

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const dragTrackerRef = useRef<{

    itemId: string;

    startX: number;

    startY: number;

    startPos: Position;

    hasMoved: boolean;

  } | null>(null);

  const selectionBoxRef = useRef<{
    startX: number;
    startY: number;
    additive: boolean;
  } | null>(null);

  const marqueeJustFinishedRef = useRef(false);

  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);



  const savePositions = (newPositions: Record<string, Position>) => {

    setCustomPositions(newPositions);

    try {

      localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify(newPositions));

    } catch {

      // ignore

    }

  };

  useEffect(() => {
    try {
      localStorage.setItem(
        DESKTOP_DOCK_SHORTCUTS_KEY,
        JSON.stringify(desktopDockShortcuts),
      );
    } catch (error) {
      console.warn('Could not save desktop app shortcuts.', error);
    }
  }, [desktopDockShortcuts]);



  // Find the first genuinely free desktop slot before adding newly-created/imported items.
  // Existing icons are never moved; only the new item gets a safe position.
  const ensureNewItemsHavePositions = (nextFiles: VirtualFile[]) => {
    const nextFileIds = new Set(nextFiles.map(file => file.id));
    const currentFileIds = new Set(desktopFiles.map(file => file.id));
    const newFiles = nextFiles.filter(file => !currentFileIds.has(file.id));

    if (newFiles.length === 0) return;

    const occupied: Array<{ x: number; y: number; width: number; height: number }> = [];

    // Use the current rendered positions for every existing desktop icon.
    allDesktopItems.forEach((item, index) => {
      const position = getItemPosition(item.id, index);
      occupied.push({
        x: position.x,
        y: position.y,
        width: 104,
        height: 104,
      });
    });

    const nextPositions: Record<string, Position> = { ...customPositions };
    const containerW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;
    const startX = 24;
    const startY = 48;
    const slotW = 104;
    const slotH = 104;
    const iconW = 96;
    const iconH = 104;
    const gap = 8;
    const maxX = Math.max(startX, containerW - 108);
    const maxY = Math.max(startY, containerH - 128);

    const overlaps = (x: number, y: number) =>
      occupied.some(rect =>
        x < rect.x + rect.width + gap &&
        x + iconW + gap > rect.x &&
        y < rect.y + rect.height + gap &&
        y + iconH + gap > rect.y
      );

    newFiles.forEach(file => {
      let found: Position | null = null;

      // Scan the desktop from the top-left in normal icon-grid order.
      // This keeps new files predictable while respecting existing custom positions.
      const maxColumns = Math.max(1, Math.floor((maxX - startX) / slotW) + 1);
      const maxRows = Math.max(1, Math.floor((maxY - startY) / slotH) + 1);
      const maxSlots = Math.max(1, maxColumns * maxRows);

      for (let slot = 0; slot < maxSlots; slot += 1) {
        const col = Math.floor(slot / maxRows);
        const row = slot % maxRows;
        const x = Math.min(maxX, startX + col * slotW);
        const y = Math.min(maxY, startY + row * slotH);

        if (!overlaps(x, y)) {
          found = { x, y };
          break;
        }
      }

      // If the visible grid is full, continue searching to the right/bottom.
      if (!found) {
        let slot = maxSlots;
        while (slot < maxSlots + 5000 && !found) {
          const col = Math.floor(slot / maxRows);
          const row = slot % maxRows;
          const x = Math.min(maxX, startX + col * slotW);
          const y = Math.min(maxY, startY + row * slotH);

          if (!overlaps(x, y)) {
            found = { x, y };
          }
          slot += 1;
        }
      }

      const position = found ?? { x: startX, y: startY };
      nextPositions[file.id] = position;
      occupied.push({
        x: position.x,
        y: position.y,
        width: iconW,
        height: iconH,
      });
    });

    // Remove saved positions for files that no longer exist, but keep system icon positions.
    Object.keys(nextPositions).forEach(id => {
      if (id.startsWith('icon-')) return;
      if (!nextFileIds.has(id)) delete nextPositions[id];
    });

    savePositions(nextPositions);
  };

  const refreshFiles = () => {
    const nextFiles = vfs.getFiles('/Users/abhishek/Desktop');
    ensureNewItemsHavePositions(nextFiles);
    setDesktopFiles(nextFiles);
  };



  // Keep all icons within screen bounds on window resize

  useEffect(() => {

    const handleResize = () => {

      const maxX = Math.max(16, window.innerWidth - 108);

      const maxY = Math.max(40, window.innerHeight - 128);



      setCustomPositions(prev => {

        let changed = false;

        const next = { ...prev };

        Object.entries(next).forEach(([id, pos]) => {

          const clampedX = Math.max(16, Math.min(maxX, pos.x));

          const clampedY = Math.max(40, Math.min(maxY, pos.y));

          if (clampedX !== pos.x || clampedY !== pos.y) {

            next[id] = { x: clampedX, y: clampedY };

            changed = true;

          }

        });

        if (changed) {

          savePositions(next);

        }

        return next;

      });

    };



    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);



  // Fixed desktop shortcuts

  const systemShortcuts = useMemo(

    () => [

      {

        id: 'icon-finder',

        label: 'Documents',

        type: 'app',

        appId: 'finder',
        iconAssetId: 'finder',
        icon: Folder,

        gradient: 'from-sky-500 to-cyan-300',

      },

      {

        id: 'icon-mobile',

        label: 'iPhone Mirroring',

        type: 'app',

        appId: 'mobile',
        iconAssetId: 'mobile',
        icon: Smartphone,

        gradient: 'from-indigo-600 via-purple-600 to-pink-500',

      },

      {

        id: 'icon-local-pc',

        label: 'My PC Drive',

        type: 'app',

        appId: 'finder',
        iconAssetId: 'pcdrive',

        icon: HardDrive,

        gradient: 'from-emerald-600 to-teal-400',

      },

      {

        id: 'icon-tv',

        label: 'Abhishek TV',

        type: 'app',

        appId: 'tv',
        iconAssetId: 'tv',
        icon: Tv,

        gradient: 'from-purple-600 to-pink-400',

      },

      // {

      //   id: 'icon-camera',

      //   label: 'Camera',

      //   type: 'app',

      //   appId: 'camera',

      //   icon: CameraIcon,

      //   gradient: 'from-zinc-900 via-slate-800 to-black',

      // },

      {

        id: 'icon-code',

        label: 'Code Studio',

        type: 'app',

        appId: 'codestudio',
        iconAssetId: 'codestudio',
        icon: Code2,

        gradient: 'from-indigo-700 to-sky-400',

      },
      

      {

        id: 'icon-terminal',

        label: 'Terminal',

        type: 'app',

        appId: 'terminal',
        iconAssetId: 'terminal',
        icon: Terminal,

        gradient: 'from-slate-900 to-slate-800',

      },

    ],

    []

  );



  // Combined list of all desktop icons. View > Sort by controls the presentation order.
  const allDesktopItems: DesktopItem[] = useMemo(() => {
    const existingShortcutAppIds = new Set(systemShortcuts.map(shortcut => shortcut.appId));
    const dockShortcuts = desktopDockShortcuts
      .filter(appId => Boolean(APP_REGISTRY[appId]) && !existingShortcutAppIds.has(appId))
      .map(appId => {
        const app = APP_REGISTRY[appId];
        return {
          id: `dock-app-${appId}`,
          name: app.name,
          isSystem: true as const,
          type: 'app',
          appId,
          iconAssetId: appId,
          icon: Folder,
          gradient: 'from-sky-500 to-indigo-500',
        };
      });
    const items: DesktopItem[] = [
      ...systemShortcuts.map(s => ({
        id: s.id,
        name: s.label,
        isSystem: true as const,
        type: s.type,
        appId: s.appId,
        iconAssetId: s.iconAssetId,
        icon: s.icon,
        gradient: s.gradient,
      })),
      ...dockShortcuts,
      ...desktopFiles.map(f => ({
        id: f.id,
        name: f.name,
        isSystem: false as const,
        type: f.type,
        file: f,
      })),
    ];

    const direction = desktopSortDirection === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      if (desktopSortBy === 'type') {
        const result = a.type.localeCompare(b.type, undefined, { sensitivity: 'base' });
        if (result !== 0) return result * direction;
      } else if (desktopSortBy === 'date') {
        const getDate = (item: DesktopItem) => {
          if (item.isSystem) return 0;
          const file = item.file as any;
          const value = file?.updatedAt ?? file?.modifiedAt ?? file?.createdAt ?? 0;
          if (value instanceof Date) return value.getTime();
          const numeric = Number(value);
          if (Number.isFinite(numeric) && numeric > 0) return numeric;
          const parsed = Date.parse(String(value));
          return Number.isFinite(parsed) ? parsed : 0;
        };
        const result = getDate(a) - getDate(b);
        if (result !== 0) return result * direction;
      }

      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }) * direction;
    });
  }, [systemShortcuts, desktopDockShortcuts, desktopFiles, desktopSortBy, desktopSortDirection]);

  // Apply sorting immediately: update both the rendered order and the saved grid
  // positions in the same event so icons move without requiring a refresh.
  const applyDesktopSort = (
    nextSortBy: 'name' | 'type' | 'date',
    nextDirection: 'asc' | 'desc'
  ) => {
    const direction = nextDirection === 'asc' ? 1 : -1;

    const getItemDate = (item: DesktopItem) => {
      if (item.isSystem) return 0;
      const file = item.file as any;
      const value = file?.updatedAt ?? file?.modifiedAt ?? file?.createdAt ?? 0;
      if (value instanceof Date) return value.getTime();
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
      const parsed = Date.parse(String(value));
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const sortedItems = [...allDesktopItems].sort((a, b) => {
      if (nextSortBy === 'type') {
        const result = a.type.localeCompare(b.type, undefined, { sensitivity: 'base' });
        if (result !== 0) return result * direction;
      }

      if (nextSortBy === 'date') {
        const result = getItemDate(a) - getItemDate(b);
        if (result !== 0) return result * direction;
      }

      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: 'base',
      }) * direction;
    });

    const startX = 24;
    const startY = 48;
    const slotX = 104;
    const slotY = 104;
    const maxX = typeof window !== 'undefined'
      ? Math.max(startX, window.innerWidth - 108)
      : 1200;
    const maxY = typeof window !== 'undefined'
      ? Math.max(startY, window.innerHeight - 128)
      : 800;
    const availableHeight = Math.max(slotY, maxY - startY + slotY);
    const rowsPerColumn = Math.max(1, Math.floor(availableHeight / slotY));

    const nextPositions: Record<string, Position> = {};

    sortedItems.forEach((item, index) => {
      const column = Math.floor(index / rowsPerColumn);
      const row = index % rowsPerColumn;

      nextPositions[item.id] = {
        x: Math.min(maxX, startX + column * slotX),
        y: Math.min(maxY, startY + row * slotY),
      };
    });

    setDesktopSortBy(nextSortBy);
    setDesktopSortDirection(nextDirection);
    savePositions(nextPositions);
    setSelectedIconIds([]);
    setOpenDesktopSubmenu(null);
    sound.playClick();
  };

  // Compute coordinate for an item (saved or default non-overlapping grid)

  const getItemPosition = (itemId: string, index: number): Position => {

    if (customPositions[itemId]) {

      const maxX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 108) : 1200;

      const maxY = typeof window !== 'undefined' ? Math.max(40, window.innerHeight - 128) : 800;

      return {

        x: Math.max(16, Math.min(maxX, customPositions[itemId].x)),

        y: Math.max(40, Math.min(maxY, customPositions[itemId].y)),

      };

    }

    const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;

    const startX = 24;

    const startY = 48;

    const slotH = 104;

    const slotW = 104;

    const availableHeight = Math.max(slotH, containerH - startY - 110);

    const rowsPerCol = Math.max(1, Math.floor(availableHeight / slotH));

    const col = Math.floor(index / rowsPerCol);

    const row = index % rowsPerCol;

    return {

      x: startX + col * slotW,

      y: startY + row * slotH,

    };

  };



  // Pointer-based rock-solid drag handlers with strict screen bounds

  const handlePointerDown = (e: React.PointerEvent, item: DesktopItem, idx: number) => {

    if (e.button !== 0) return; // only left click initiates dragging

    const current = getItemPosition(item.id, idx);

    dragTrackerRef.current = {

      itemId: item.id,

      startX: e.clientX,

      startY: e.clientY,

      startPos: { ...current },

      hasMoved: false,

    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

  };



  const handlePointerMove = (e: React.PointerEvent) => {

    if (!dragTrackerRef.current) return;

    const tracker = dragTrackerRef.current;

    const dx = e.clientX - tracker.startX;

    const dy = e.clientY - tracker.startY;



    if (!tracker.hasMoved && Math.hypot(dx, dy) > 4) {

      tracker.hasMoved = true;

      setDraggingItemId(tracker.itemId);

    }



    if (tracker.hasMoved) {

      const maxX = Math.max(16, window.innerWidth - 108);

      const maxY = Math.max(40, window.innerHeight - 128);

      const clampedX = Math.max(16, Math.min(maxX, tracker.startPos.x + dx));

      const clampedY = Math.max(40, Math.min(maxY, tracker.startPos.y + dy));



      setCustomPositions(prev => ({

        ...prev,

        [tracker.itemId]: { x: Math.round(clampedX), y: Math.round(clampedY) },

      }));

    }

  };



  const handlePointerUp = (e: React.PointerEvent) => {

    if (!dragTrackerRef.current) return;

    const tracker = dragTrackerRef.current;

    try {

      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    } catch {}



    if (tracker.hasMoved) {

      setCustomPositions(prev => {

        savePositions(prev);

        return prev;

      });

    }

    setDraggingItemId(null);

    dragTrackerRef.current = null;

  };



  // Robust Auto-Arrange: snaps all icons to a strict non-overlapping grid within screen boundaries

  const handleAutoArrange = () => {

    const containerW = typeof window !== 'undefined' ? window.innerWidth : 1440;

    const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;



    const startX = 24;

    const startY = 48;

    const slotW = 104;

    const slotH = 104;



    const availableHeight = Math.max(slotH, containerH - startY - 110);

    const rowsPerCol = Math.max(1, Math.floor(availableHeight / slotH));



    const newPositions: Record<string, Position> = {};

    allDesktopItems.forEach((item, index) => {

      const col = Math.floor(index / rowsPerCol);

      const row = index % rowsPerCol;

      const x = startX + col * slotW;

      const y = startY + row * slotH;



      const maxX = Math.max(startX, containerW - 108);

      const maxY = Math.max(startY, containerH - 128);



      newPositions[item.id] = {

        x: Math.min(maxX, x),

        y: Math.min(maxY, y),

      };

    });



    savePositions(newPositions);

    sound.playClick();

    addNotification({

      appId: 'finder',

      title: 'Desktop Auto Arrange',

      message: `All ${allDesktopItems.length} desktop icons arranged in a clean, collision-free grid.`,

      type: 'system',

    });

  };



  const FAVORITES_STORAGE_KEY = 'abhishek_os_desktop_favorites_v1';

  const [favoriteItemIds, setFavoriteItemIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const saveFavoriteItemIds = (ids: string[]) => {
    setFavoriteItemIds(ids);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage errors.
    }
  };

  const toggleFavoriteItem = (itemId: string) => {
    const next = favoriteItemIds.includes(itemId)
      ? favoriteItemIds.filter(id => id !== itemId)
      : [...favoriteItemIds, itemId];

    saveFavoriteItemIds(next);
    sound.playClick();
  };

  const openRenameModal = (fileId: string, currentName: string) => {
    const extension = currentName.includes('.')
      ? `.${currentName.split('.').pop()}`
      : '';

    const baseName = extension
      ? currentName.slice(0, -extension.length)
      : currentName;

    setRenameModal({
      open: true,
      fileId,
      currentName,
      value: baseName,
      extension,
    });

    sound.playClick();
    window.setTimeout(() => renameInputRef.current?.focus(), 40);
  };

  const commitRename = () => {
    if (!renameModal.fileId) return;

    const trimmed = renameModal.value.trim();
    if (!trimmed) {
      renameInputRef.current?.focus();
      return;
    }

    const nextName = renameModal.extension &&
      !trimmed.toLowerCase().endsWith(renameModal.extension.toLowerCase())
      ? `${trimmed}${renameModal.extension}`
      : trimmed;

    const api = vfs as any;
    const renameMethod = api.renameFile || api.rename || api.updateFileName;

    if (typeof renameMethod !== 'function') {
      addNotification({
        appId: 'finder',
        title: 'Rename unavailable',
        message: 'The current Virtual File System does not expose a rename operation yet.',
        type: 'system',
      });
      return;
    }

    try {
      renameMethod.call(api, renameModal.fileId, nextName);
      refreshFiles();
      setSelectedIconIds([renameModal.fileId]);
      setRenameModal({ open: false, fileId: null, currentName: '', value: '', extension: '' });
      sound.playClick();
      addNotification({
        appId: 'finder',
        title: 'Renamed',
        message: `Renamed to "${nextName}".`,
        type: 'system',
      });
    } catch {
      addNotification({
        appId: 'finder',
        title: 'Rename failed',
        message: `Could not rename "${renameModal.currentName}".`,
        type: 'system',
      });
    }
  };


  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc ^= bytes[i];
      for (let bit = 0; bit < 8; bit++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  const uint16 = (value: number) => {
    const a = new Uint8Array(2);
    new DataView(a.buffer).setUint16(0, value, true);
    return a;
  };

  const uint32 = (value: number) => {
    const a = new Uint8Array(4);
    new DataView(a.buffer).setUint32(0, value >>> 0, true);
    return a;
  };

  const textBytes = (value: string) => new TextEncoder().encode(value);

  const contentToBytes = (content: unknown): Uint8Array => {
    if (content instanceof Uint8Array) return content;
    if (content instanceof ArrayBuffer) return new Uint8Array(content);

    if (typeof content === 'string') {
      const dataUrl = content.match(/^data:[^;]+;base64,(.*)$/s);
      if (dataUrl) {
        const binary = atob(dataUrl[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
      }
      return textBytes(content);
    }

    return new Uint8Array();
  };

  const createZipBlob = (entries: { name: string; data: Uint8Array }[]) => {
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    entries.forEach(entry => {
      const name = textBytes(entry.name.replace(/\\/g, '/'));
      const data = entry.data;
      const crc = crc32(data);

      const localHeader = new Uint8Array([
        ...uint32(0x04034b50),
        ...uint16(20),
        ...uint16(0),
        ...uint16(0),
        ...uint16(0),
        ...uint16(0),
        ...uint32(crc),
        ...uint32(data.length),
        ...uint32(data.length),
        ...uint16(name.length),
        ...uint16(0),
        ...name,
      ]);

      localParts.push(localHeader, data);

      const centralHeader = new Uint8Array([
        ...uint32(0x02014b50),
        ...uint16(20),
        ...uint16(20),
        ...uint16(0),
        ...uint16(0),
        ...uint16(0),
        ...uint16(0),
        ...uint32(crc),
        ...uint32(data.length),
        ...uint32(data.length),
        ...uint16(name.length),
        ...uint16(0),
        ...uint16(0),
        ...uint16(0),
        ...uint16(0),
        ...uint32(0),
        ...uint32(offset),
        ...name,
      ]);

      centralParts.push(centralHeader);
      offset += localHeader.length + data.length;
    });

    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array([
      ...uint32(0x06054b50),
      ...uint16(0),
      ...uint16(0),
      ...uint16(entries.length),
      ...uint16(entries.length),
      ...uint32(centralSize),
      ...uint32(centralOffset),
      ...uint16(0),
    ]);

    const blobParts: BlobPart[] = [...localParts, ...centralParts, end].map(part => {
      const ownedBytes = new Uint8Array(part.byteLength);
      ownedBytes.set(part);
      return ownedBytes.buffer;
    });
    return new Blob(blobParts, { type: 'application/zip' });
  };

  const compressDesktopItemToZip = async (item: DesktopItem) => {
    if (item.isSystem) return;

    const file = vfs.getFileById(item.id);
    if (!file) return;

    const entries: { name: string; data: Uint8Array }[] = [];
    const apiFile = file as any;
    const isFolder = file.type === 'folder';

    if (isFolder) {
      const collectFolder = (folder: any, prefix: string) => {
        const children = vfs.getFiles(folder.path || folder.parentPath || `/Users/abhishek/Desktop/${folder.name}`) as any[];
        children.forEach(child => {
          const childName = `${prefix}${child.name}`;
          if (child.type === 'folder') {
            collectFolder(child, `${childName}/`);
          } else {
            entries.push({
              name: childName,
              data: contentToBytes(child.content),
            });
          }
        });
      };

      collectFolder(apiFile, `${file.name}/`);
    } else {
      entries.push({
        name: file.name,
        data: contentToBytes(apiFile.content),
      });
    }

    if (entries.length === 0) {
      entries.push({ name: `${file.name}/`, data: new Uint8Array() });
    }

    const blob = createZipBlob(entries);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${file.name}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    sound.playClick();
    addNotification({
      appId: 'finder',
      title: 'Compressed',
      message: `Created "${file.name}.zip" with ${entries.length} item${entries.length === 1 ? '' : 's'}.`,
      type: 'system',
    });
  };

  const getDesktopSelectionRect = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  });

  const updateMarqueeSelection = (clientX: number, clientY: number) => {
    const root = desktopContainerRef.current;
    const box = selectionBoxRef.current;
    if (!root || !box) return;

    const rootRect = root.getBoundingClientRect();
    const current = { x: clientX - rootRect.left, y: clientY - rootRect.top };
    const start = { x: box.startX, y: box.startY };
    const rect = getDesktopSelectionRect(start, current);

    setSelectionBox({
      x: rect.left,
      y: rect.top,
      width: rect.right - rect.left,
      height: rect.bottom - rect.top,
    });

    const selected = Array.from(
      root.querySelectorAll<HTMLElement>('[data-desktop-icon="true"]')
    )
      .filter(el => {
        const r = el.getBoundingClientRect();
        const elLeft = r.left - rootRect.left;
        const elTop = r.top - rootRect.top;
        const elRight = elLeft + r.width;
        const elBottom = elTop + r.height;
        return !(
          elRight < rect.left ||
          elLeft > rect.right ||
          elBottom < rect.top ||
          elTop > rect.bottom
        );
      })
      .map(el => el.dataset.desktopItemId)
      .filter((id): id is string => Boolean(id));

    const next = box.additive
      ? Array.from(new Set([...selectedIconIds, ...selected]))
      : selected;

    setSelectedIconIds(next);
  };

  const handleDesktopSelectionPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('[data-desktop-widget="true"]') ||
      target.closest('[data-desktop-icon="true"]') ||
      target.closest('button, input, textarea, select, a, [role="button"]')
    ) {
      return;
    }

    const root = desktopContainerRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setContextMenu(prev => ({ ...prev, visible: false }));

    selectionBoxRef.current = {
      startX: x,
      startY: y,
      additive: e.ctrlKey || e.metaKey || e.shiftKey,
    };

    if (!(e.ctrlKey || e.metaKey || e.shiftKey)) {
      setSelectedIconIds([]);
    }

    setSelectionBox({ x, y, width: 0, height: 0 });

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleDesktopSelectionPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectionBoxRef.current) return;
    updateMarqueeSelection(e.clientX, e.clientY);
  };

  const handleDesktopSelectionPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectionBoxRef.current) return;

    updateMarqueeSelection(e.clientX, e.clientY);
    selectionBoxRef.current = null;
    marqueeJustFinishedRef.current = true;
    setSelectionBox(null);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    sound.playClick();
  };

  const handleContextMenu = (e: React.MouseEvent, targetId: string | null = null) => {
    e.preventDefault();
    e.stopPropagation();

    sound.playClick();

    const padding = 10;
    const estimatedWidth = contextMenuSize.width || 320;
    const estimatedHeight = contextMenuSize.height || 420;

    let x = e.clientX;
    let y = e.clientY;

    if (x + estimatedWidth > window.innerWidth - padding) {
      x = window.innerWidth - estimatedWidth - padding;
    }

    if (y + estimatedHeight > window.innerHeight - padding) {
      y = window.innerHeight - estimatedHeight - padding;
    }

    x = Math.max(padding, x);
    y = Math.max(padding, y);

    if (targetId && !selectedIconIds.includes(targetId)) {
      setSelectedIconIds([targetId]);
    }

    setOpenDesktopSubmenu(null);

    setContextMenu({
      x,
      y,
      visible: true,
      targetId,
    });
  };

  useLayoutEffect(() => {
    if (!contextMenu.visible || !contextMenuRef.current) return;

    const rect = contextMenuRef.current.getBoundingClientRect();

    setContextMenuSize({
      width: rect.width,
      height: rect.height,
    });

    const padding = 10;
    const nextX = Math.max(
      padding,
      Math.min(contextMenu.x, window.innerWidth - rect.width - padding)
    );
    const nextY = Math.max(
      padding,
      Math.min(contextMenu.y, window.innerHeight - rect.height - padding)
    );

    if (nextX !== contextMenu.x || nextY !== contextMenu.y) {
      setContextMenu(prev => ({
        ...prev,
        x: nextX,
        y: nextY,
      }));
    }
  }, [contextMenu.visible, contextMenu.targetId, contextMenu.x, contextMenu.y]);




  const handleDesktopClick = () => {
    if (contextMenu.visible) {
      setContextMenu(prev => ({ ...prev, visible: false }));
    }

    // A marquee selection should remain selected after the pointer-up/click cycle.
    if (marqueeJustFinishedRef.current) {
      marqueeJustFinishedRef.current = false;
      return;
    }

    setSelectedIconIds([]);
  };



  const handleAlignIconsToGrid = () => {
    const gridX = 104;
    const gridY = 104;
    const startX = 24;
    const startY = 48;
    const maxX = Math.max(startX, window.innerWidth - 108);
    const maxY = Math.max(startY, window.innerHeight - 128);

    const next = { ...customPositions };
    allDesktopItems.forEach((item, index) => {
      const current = getItemPosition(item.id, index);
      next[item.id] = {
        x: Math.min(maxX, Math.max(startX, Math.round((current.x - startX) / gridX) * gridX + startX)),
        y: Math.min(maxY, Math.max(startY, Math.round((current.y - startY) / gridY) * gridY + startY)),
      };
    });

    savePositions(next);
    sound.playClick();
  };

  const handleCreateFolder = () => {

    const created = vfs.createFolder('New Folder', '/Users/abhishek/Desktop');

    const nextFiles = vfs.getFiles('/Users/abhishek/Desktop');
    ensureNewItemsHavePositions(nextFiles);
    setDesktopFiles(nextFiles);

    setSelectedIconIds([created.id]);

    setContextMenu(prev => ({ ...prev, visible: false }));

    sound.playClick();

  };



  const handleCreateNewFile = () => {

    const rawName = newFileName.trim() || 'Untitled';

    const finalName = rawName.includes('.') ? rawName : `${rawName}.${newFileExtension}`;

    const ext = finalName.split('.').pop() || newFileExtension;

    const created = vfs.createFile(finalName, '/Users/abhishek/Desktop', newFileType, '', ext);

    const nextFiles = vfs.getFiles('/Users/abhishek/Desktop');
    ensureNewItemsHavePositions(nextFiles);
    setDesktopFiles(nextFiles);

    setSelectedIconIds([created.id]);

    setShowNewFileModal(false);

    setNewFileName('');

    sound.playClick();

    addNotification({

      appId: 'finder',

      title: 'Desktop',

      message: `Created "${finalName}" on Desktop`,

      type: 'system',

    });

  };



  // Desktop Drag & Drop from PC files

  const handleDragOver = (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setIsDragOver(true);
    setIsDockAppDragOver(Array.from(e.dataTransfer.types).includes(DOCK_APP_DRAG_TYPE));

  };



  const handleDragLeave = (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setIsDragOver(false);
    setIsDockAppDragOver(false);

  };



  const handleDrop = async (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setIsDragOver(false);
    setIsDockAppDragOver(false);

    const dockAppId = e.dataTransfer.getData(DOCK_APP_DRAG_TYPE);
    const dockApp = APP_REGISTRY[dockAppId];
    if (dockAppId && dockApp?.installed) {
      const existingShortcut = systemShortcuts.find(shortcut => shortcut.appId === dockAppId);
      const desktopItemId = existingShortcut?.id ?? `dock-app-${dockAppId}`;
      if (!existingShortcut) {
        setDesktopDockShortcuts(previous =>
          previous.includes(dockAppId) ? previous : [...previous, dockAppId],
        );
      }

      const root = desktopContainerRef.current;
      const bounds = root?.getBoundingClientRect();
      if (bounds) {
        const nextPositions = {
          ...customPositions,
          [desktopItemId]: {
            x: Math.max(16, Math.min(bounds.width - 108, e.clientX - bounds.left - 48)),
            y: Math.max(40, Math.min(bounds.height - 128, e.clientY - bounds.top - 48)),
          },
        };
        savePositions(nextPositions);
      }

      setSelectedIconIds([desktopItemId]);
      sound.playClick();
      addNotification({
        appId: dockAppId,
        title: 'Desktop shortcut added',
        message: `${dockApp.name} is now available on your Desktop.`,
        type: 'system',
      });
      return;
    }

    const internalItems = e.dataTransfer.getData('application/x-abhishek-os-items');
    if (internalItems) {
      try {
        const parsed: unknown = JSON.parse(internalItems);
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !('items' in parsed) ||
          !Array.isArray(parsed.items)
        ) {
          throw new Error('The dragged Finder items could not be read.');
        }

        const items = parsed.items.filter((item): item is {
          id: string;
          hostPath?: string;
          name: string;
          type: VirtualFile['type'];
          size: number;
          extension?: string;
        } =>
          !!item &&
          typeof item === 'object' &&
          'id' in item && typeof item.id === 'string' &&
          'name' in item && typeof item.name === 'string' &&
          'type' in item &&
          (item.type === 'folder' || item.type === 'image' || item.type === 'video' ||
            item.type === 'audio' || item.type === 'document' || item.type === 'code' ||
            item.type === 'archive' || item.type === 'app') &&
          'size' in item && typeof item.size === 'number' &&
          (!('hostPath' in item) || typeof item.hostPath === 'undefined' || typeof item.hostPath === 'string') &&
          (!('extension' in item) || typeof item.extension === 'undefined' || typeof item.extension === 'string')
        );
        if (items.length !== parsed.items.length || items.length === 0) {
          throw new Error('The dragged Finder items contain unsupported data.');
        }

        const internalIds = items
          .filter(item => !item.hostPath && !item.id.startsWith('host:'))
          .map(item => item.id);
        const movingIds = new Set(internalIds);
        const targetNames = new Set(
          vfs.getFiles('/Users/abhishek/Desktop')
            .filter(file => !movingIds.has(file.id))
            .map(file => file.name.toLocaleLowerCase())
        );
        for (const item of items) {
          const normalizedName = item.name.toLocaleLowerCase();
          if (targetNames.has(normalizedName)) {
            throw new Error(`An item named "${item.name}" already exists on the Desktop.`);
          }
          targetNames.add(normalizedName);
        }

        const moved = internalIds.length
          ? vfs.moveFiles(internalIds, '/Users/abhishek/Desktop')
          : { moved: [] as VirtualFile[] };
        if (moved.error) throw new Error(moved.error);

        const shortcuts = items
          .filter(item => item.hostPath)
          .map(item => vfs.createHostShortcut(item, '/Users/abhishek/Desktop'));
        const added = [...moved.moved, ...shortcuts];
        ensureNewItemsHavePositions(vfs.getFiles('/Users/abhishek/Desktop'));
        setDesktopFiles(vfs.getFiles('/Users/abhishek/Desktop'));
        setSelectedIconIds(added.map(file => file.id));
        sound.playClick();
      } catch (error) {
        addNotification({
          appId: 'finder',
          title: 'Could not move items to Desktop',
          message: error instanceof Error ? error.message : String(error),
          type: 'system',
        });
      }
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {

      await importLocalFiles(e.dataTransfer.files, '/Users/abhishek/Desktop');

      refreshFiles();

    }

  };



  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files.length > 0) {

      await importLocalFiles(e.target.files, '/Users/abhishek/Desktop');

      refreshFiles();

    }

  };



  const openHostShortcut = async (file: VirtualFile) => {
    if (!file.hostPath) return;
    try {
      if (file.type === 'folder') {
        localStorage.setItem('finder-pending-open-path', file.hostPath);
        openApp('finder');
        window.dispatchEvent(new CustomEvent('finder:open-host-path', { detail: file.hostPath }));
        return;
      }

      if (file.type === 'image' && window.electronAPI?.readLocalImage) {
        const previewUrl = await window.electronAPI.readLocalImage(file.hostPath);
        setQuickLookFile({ ...file, previewUrl });
        return;
      }

      if (file.type === 'code' && window.electronAPI?.openLocalCodeFile) {
        const result = await window.electronAPI.openLocalCodeFile(file.hostPath);
        if (result.opened) return;
        const request = {
          name: file.name,
          content: result.content || '',
          path: file.hostPath,
        };
        localStorage.setItem('code-studio-pending-open-file', JSON.stringify(request));
        openApp('codestudio');
        window.dispatchEvent(new CustomEvent('code-studio:open-file', { detail: request }));
        return;
      }

      if (!window.electronAPI?.openLocalPath) {
        throw new Error('Opening files from this PC requires the desktop app.');
      }
      await window.electronAPI.openLocalPath(file.hostPath);
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: `Unable to open ${file.name}`,
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  const handleOpenItem = (itemId: string, type: string, file?: VirtualFile) => {

    sound.playClick();

    if (itemId === 'icon-finder') {

      openApp('finder');

    } else if (file?.hostPath) {

      void openHostShortcut(file);

    } else if (file?.type === 'folder') {

      setQuickLookFile(file);

    } else if (type === 'folder') {

      openApp('finder');

    } else if (itemId === 'icon-mobile') {

      openApp('mobile');

    } else if (itemId === 'icon-local-pc') {

      openApp('finder');

    } else if (itemId === 'icon-tv') {

      openApp('tv');

    // } else if (itemId === 'icon-camera') {

    //   openApp('camera');

    } else if (itemId === 'icon-code') {

      openApp('codestudio');

    } else if (itemId === 'icon-terminal') {

      openApp('terminal');

    } else if (file) {

      if (file.extension === 'txt' || file.type === 'code' || file.type === 'document') {

        openApp('codestudio');

      } else if (file.type === 'audio') {

        openApp('music');

      } else if (file.type === 'video') {

        openApp('tv');

      } else {

        setQuickLookFile(file);

      }

    }

  };



  // Global & Desktop Keyboard Shortcuts

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {

        return;

      }

      if (e.key === 'Escape' && renameModal.open) {
        e.preventDefault();
        setRenameModal(prev => ({ ...prev, open: false }));
        sound.playClick();
        return;
      }

      if (e.key === 'Escape' && contextMenu.visible) {
        e.preventDefault();
        setContextMenu(prev => ({ ...prev, visible: false }));
        sound.playClick();
        return;
      }



      const isMod = e.ctrlKey || e.metaKey;



      // Select All: Cmd/Ctrl + A

      if (isMod && e.code === 'KeyA') {

        e.preventDefault();

        setSelectedIconIds(allDesktopItems.map(item => item.id));

        sound.playClick();

        return;

      }



      // Copy: Cmd/Ctrl + C

      if (isMod && e.code === 'KeyC') {

        const fileIdsToCopy = selectedIconIds.filter(id => !id.startsWith('icon-'));

        if (fileIdsToCopy.length > 0) {

          e.preventDefault();

          vfs.copyFiles(fileIdsToCopy);

          sound.playClick();

          addNotification({

            appId: 'finder',

            title: 'Desktop',

            message: `Copied ${fileIdsToCopy.length} item(s) to clipboard`,

            type: 'system',

          });

        }

        return;

      }



      // Paste: Cmd/Ctrl + V

      if (isMod && e.code === 'KeyV') {

        e.preventDefault();

        const pasted = vfs.paste('/Users/abhishek/Desktop');

        if (pasted.length > 0) {

          sound.playClick();

          refreshFiles();

          setSelectedIconIds(pasted.map(f => f.id));

          addNotification({

            appId: 'finder',

            title: 'Desktop',

            message: `Pasted ${pasted.length} item(s) onto Desktop`,

            type: 'system',

          });

        }

        return;

      }



      // Rename selected desktop item: F2
      if (e.code === 'F2') {
        const selectedFileId = selectedIconIds.find(id => {
          const item = allDesktopItems.find(current => current.id === id);
          return item && !item.isSystem;
        });

        if (selectedFileId) {
          e.preventDefault();
          const item = allDesktopItems.find(current => current.id === selectedFileId);
          if (item && !item.isSystem) {
            openRenameModal(item.id, item.name);
          }
        }
        return;
      }

      // Duplicate: Cmd/Ctrl + D
      if (isMod && e.code === 'KeyD') {
        const fileIds = selectedIconIds.filter(id => {
          const item = allDesktopItems.find(current => current.id === id);
          return item && !item.isSystem;
        });

        if (fileIds.length > 0) {
          e.preventDefault();
          fileIds.forEach(id => vfs.duplicate(id));
          refreshFiles();
          sound.playClick();
          return;
        }
      }

      // Delete: Delete / Backspace / Cmd+Backspace

      if (e.code === 'Delete' || (isMod && e.code === 'Backspace')) {

        const fileIdsToDelete = selectedIconIds.filter(id => {
          const item = allDesktopItems.find(current => current.id === id);
          return !!item && !item.isSystem && item.file.type !== 'app';
        });

        if (fileIdsToDelete.length > 0) {

          e.preventDefault();

          fileIdsToDelete.forEach(id => vfs.moveToTrash(id));

          sound.playTrash();

          refreshFiles();

          setSelectedIconIds([]);

        }

        return;

      }



      // Quick Look: Space

      if (e.code === 'Space') {

        const firstFileId = selectedIconIds.find(id => !id.startsWith('icon-'));

        if (firstFileId) {

          const file = vfs.getFileById(firstFileId);

          if (file) {

            e.preventDefault();

            setQuickLookFile(file);

          }

        }

        return;

      }



      // New Folder: Cmd/Ctrl + Shift + N

      if (isMod && e.shiftKey && e.code === 'KeyN') {

        e.preventDefault();

        handleCreateFolder();

        return;

      }



      // New File: Cmd/Ctrl + N

      if (isMod && !e.shiftKey && e.code === 'KeyN') {

        e.preventDefault();

        setNewFileName('');

        setShowNewFileModal(true);

        return;

      }

      // Keyboard shortcut reference: ?
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setShowShortcutPanel(prev => !prev);
        return;
      }

    };



    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [allDesktopItems, selectedIconIds, addNotification, setQuickLookFile, contextMenu.visible, renameModal.open]);



  const hasClipboard = !!vfs.getClipboard() && vfs.getClipboard()!.ids.length > 0;



  return (

    <div

      ref={desktopContainerRef}

      className="relative w-full h-full overflow-hidden select-none"

      onContextMenu={e => handleContextMenu(e, null)}

      onClick={handleDesktopClick}

      onPointerDown={handleDesktopSelectionPointerDown}

      onPointerMove={handleDesktopSelectionPointerMove}

      onPointerUp={handleDesktopSelectionPointerUp}

      onPointerCancel={() => {
        selectionBoxRef.current = null;
        marqueeJustFinishedRef.current = false;
        setSelectionBox(null);
      }}

      onDragOver={handleDragOver}

      onDragLeave={handleDragLeave}

      onDrop={handleDrop}

    >

      {/* Hidden local file picker */}

      <input

        ref={fileInputRef}

        type="file"

        multiple

        className="hidden"

        onChange={handleFileInputChange}

      />



      {/* Real Computer Files Dropzone Overlay */}

      <AnimatePresence>

        {isDragOver && (

          <motion.div

            initial={{ opacity: 0, scale: 0.98 }}

            animate={{ opacity: 1, scale: 1 }}

            exit={{ opacity: 0, scale: 0.98 }}

            className="absolute inset-4 rounded-3xl border-2 border-dashed border-sky-400/90 bg-sky-950/70 backdrop-blur-xl z-50 flex flex-col items-center justify-center pointer-events-none shadow-2xl"

          >

            {isDockAppDragOver ? (
              <motion.div
                animate={{ y: [0, -7, 0], rotateY: [0, 12, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 shadow-[0_0_30px_rgba(56,189,248,0.32)]"
              >
                <Smartphone className="h-8 w-8 text-sky-200" />
              </motion.div>
            ) : (
              <UploadCloud className="w-16 h-16 text-sky-400 animate-bounce mb-3 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            )}

            <h3 className="text-2xl font-bold text-white drop-shadow">

              {isDockAppDragOver ? 'Add an app to your Desktop' : 'Drop your computer files or folders here'}

            </h3>

            <p className="text-sm text-sky-200 mt-1 max-w-md text-center">

              {isDockAppDragOver
                ? 'Create a shortcut exactly where you drop it.'
                : 'All files, images, videos, audio, and code will be mounted directly into Abhishek OS Desktop.'}

            </p>

          </motion.div>

        )}

      </AnimatePresence>



      {/* Desktop marquee-selection visual layer (input is handled by the root) */}
      <AnimatePresence>
        {selectionBox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-[6] rounded-[6px] border border-sky-300/80 bg-sky-400/[0.14] shadow-[0_0_0_1px_rgba(125,211,252,0.08)] pointer-events-none"
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.width,
              height: selectionBox.height,
            }}
          />
        )}
      </AnimatePresence>

      {/* Wallpaper Layer */}

      {settings.liveWallpapers && currentWallpaper.isLive && currentWallpaper.liveType ? (

        <LiveWallpaper type={currentWallpaper.liveType} performanceMode={settings.performanceMode} />

      ) : (

        <div

          className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"

          style={{ backgroundImage: `url(${currentWallpaper.url})` }}

        />

      )}



      {/* Night Shift Warmth Filter */}

      {settings.nightShift && (

        <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn z-0" />

      )}



      {/* Movable Desktop Widgets (weather, now-playing, system stats on right side) */}

      <DesktopWidgets />



      {/* Draggable Desktop Icons Canvas */}

      {showDesktopIcons && (
      <div className="absolute inset-0 pointer-events-none z-10">

        {allDesktopItems.map((item, idx) => {

          const pos = getItemPosition(item.id, idx);

          const isSelected = selectedIconIds.includes(item.id);

          const isDraggingThis = draggingItemId === item.id;



          return (

            <div

              key={item.id}

              data-desktop-icon="true"

              data-desktop-item-id={item.id}

              onPointerDown={e => handlePointerDown(e, item, idx)}

              onPointerMove={handlePointerMove}

              onPointerUp={handlePointerUp}

              onPointerCancel={handlePointerUp}

              style={{

                position: 'absolute',

                left: `${pos.x}px`,

                top: `${pos.y}px`,

                touchAction: 'none',

              }}

              onClick={e => {

                e.stopPropagation();

                if (dragTrackerRef.current?.hasMoved) return;

                if (e.metaKey || e.ctrlKey) {

                  setSelectedIconIds(prev =>

                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]

                  );

                } else {

                  setSelectedIconIds([item.id]);

                }

                sound.playClick();

              }}

              onDoubleClick={e => {

                e.stopPropagation();

                if (dragTrackerRef.current?.hasMoved) return;

                handleOpenItem(item.id, item.type, 'file' in item ? item.file : undefined);

              }}

              onContextMenu={e => {
                handleContextMenu(e, item.id);
              }}

              className={`pointer-events-auto select-none group flex flex-col items-center justify-center w-24 p-2 rounded-2xl cursor-grab active:cursor-grabbing transition-shadow duration-150 ${

                isDraggingThis ? 'z-50 scale-105 shadow-2xl opacity-90' : 'z-10'

              } ${

                isSelected

                  ? 'bg-sky-500/35 ring-2 ring-sky-400 shadow-xl'

                  : 'hover:bg-white/15'

              }`}

              title={
                item.isSystem
                  ? `Open ${item.name}`
                  : item.type === 'folder'
                    ? `Open ${item.name} folder`
                    : item.type === 'image'
                      ? `Open ${item.name} image`
                      : item.type === 'code'
                        ? `Open ${item.name} code file`
                        : `Open ${item.name}`
              }

            >

              {/* Icon Graphic */}

              {item.isSystem ? (

                <div

                  className={`${desktopIconSize === 'large' ? 'w-16 h-16' : desktopIconSize === 'small' ? 'w-11 h-11' : 'w-14 h-14'} ${item.iconAssetId ? '' : `rounded-2xl bg-gradient-to-tr ${item.gradient} shadow-lg text-white`} flex items-center justify-center group-hover:scale-105 transition-transform pointer-events-none`}

                >

                  <AppIcon
                    assetId={item.iconAssetId}
                    className="h-full w-full object-contain"
                    fallback={React.createElement(item.icon, { className: desktopIconSize === 'large' ? 'w-8 h-8' : desktopIconSize === 'small' ? 'w-5 h-5' : 'w-7 h-7' })}
                  />

                </div>

              ) : (

                <div className={`${desktopIconSize === 'large' ? 'w-16 h-16' : desktopIconSize === 'small' ? 'w-11 h-11' : 'w-14 h-14'} ${item.type === 'folder' || item.file.extension?.toLowerCase() === 'pdf' ? '' : 'rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-lg'} flex items-center justify-center text-white group-hover:scale-105 transition-transform pointer-events-none`}>

                  {item.type === 'folder' ? (

                    <AppIcon assetId="folder" className="h-full w-full object-contain" />

                  ) : item.file.extension?.toLowerCase() === 'pdf' ? (

                    <AppIcon assetId="pdf" className="h-full w-full object-contain" />

                  ) : item.type === 'image' ? (

                    <Image className={`${desktopIconSize === 'large' ? 'w-8 h-8' : desktopIconSize === 'small' ? 'w-5 h-5' : 'w-7 h-7'} text-amber-400` } />

                  ) : item.type === 'code' ? (

                    <Code2 className={`${desktopIconSize === 'large' ? 'w-8 h-8' : desktopIconSize === 'small' ? 'w-5 h-5' : 'w-7 h-7'} text-indigo-300` } />

                  ) : (

                    <FileText className={`${desktopIconSize === 'large' ? 'w-8 h-8' : desktopIconSize === 'small' ? 'w-5 h-5' : 'w-7 h-7'} text-slate-200` } />

                  )}

                </div>

              )}



              {/* Label */}
<span
  className={`
    mt-1.5
    w-24
    max-w-24
    text-xs
    font-medium
    text-white
    drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]
    text-center
    leading-[15px]
    pointer-events-none
    overflow-hidden
    ${
      item.name.length <= 11
        ? 'whitespace-nowrap'
        : 'line-clamp-2 break-words [overflow-wrap:anywhere]'
    }
  `}
>
  {item.name}
</span>

            </div>

          );

        })}

      </div>
      )}



      {/* Keyboard Shortcuts — always available on the desktop, toggle with ? */}
      {/* <AnimatePresence>
        {showShortcutPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="absolute left-5 bottom-5 z-[35] w-[290px] overflow-hidden rounded-[18px] border border-white/[0.14] bg-slate-950/[0.36] backdrop-blur-[30px] backdrop-saturate-[160%] shadow-[0_22px_70px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] text-white pointer-events-auto"
            onPointerDown={e => e.stopPropagation()}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.10]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-white/[0.08] border border-white/[0.08]">
                  <Keyboard className="h-4 w-4 text-sky-300" />
                </span>
                <div>
                  <div className="text-[12px] font-semibold">Keyboard Shortcuts</div>
                  <div className="text-[9px] text-white/40">Desktop controls</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutPanel(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-white/45 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="Hide shortcuts (press ?)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-2.5 grid grid-cols-2 gap-1">
              {[
                ['Ctrl/Cmd + A', 'Select all'],
                ['Ctrl/Cmd + C', 'Copy'],
                ['Ctrl/Cmd + V', 'Paste'],
                ['Ctrl/Cmd + D', 'Duplicate'],
                ['Ctrl/Cmd + N', 'New file'],
                ['Ctrl/Cmd + Shift + N', 'New folder'],
                ['F2', 'Rename'],
                ['Delete', 'Move to Trash'],
                ['Space', 'Quick Look'],
                ['Esc', 'Close menu / cancel'],
                ['Ctrl/Cmd + Click', 'Multi-select'],
                ['Drag on desktop', 'Box select'],
              ].map(([key, action]) => (
                <div key={key} className="rounded-[9px] px-2.5 py-2 hover:bg-white/[0.06] transition-colors">
                  <div className="text-[10px] font-mono text-sky-200/85 truncate">{key}</div>
                  <div className="mt-0.5 text-[9px] text-white/45 truncate">{action}</div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-white/[0.08] flex items-center gap-2 text-[9px] text-white/35">
              <MousePointer2 className="h-3.5 w-3.5 text-sky-300/70" />
              <span>Drag an empty desktop area to select multiple icons.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}

{/* Short cut pannel is here */}
{/* Short cut pannel is here */}
      {/* {!showShortcutPanel && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          onClick={() => setShowShortcutPanel(true)}
          className="absolute left-5 bottom-5 z-[35] h-10 w-10 rounded-xl border border-white/[0.14] bg-slate-950/[0.35] backdrop-blur-2xl shadow-xl text-white/70 hover:text-white hover:bg-white/[0.10] flex items-center justify-center transition-all pointer-events-auto"
          title="Show keyboard shortcuts (?)"
        >
          <Keyboard className="h-4 w-4" />
        </motion.button>
      )} */}


      {/* Desktop Right-Click Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.94, y: -5, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.97, y: -3, filter: 'blur(3px)' }}
            transition={{
              type: 'spring',
              stiffness: 560,
              damping: 34,
              mass: 0.72,
            }}
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              transformOrigin: 'top left',
            }}
            className="
              fixed z-[99999] w-[320px] max-w-[calc(100vw-24px)]
              overflow-visible rounded-[20px] relative
              border border-white/[0.16]
              bg-slate-950/[0.38]
              text-white
              p-2
              shadow-[0_26px_75px_rgba(0,0,0,0.34),0_8px_28px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.10)]
              backdrop-blur-[34px]
              backdrop-saturate-[155%]
              font-medium
            "
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onContextMenu={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {(() => {
              const targetItem = allDesktopItems.find(
                i => i.id === contextMenu.targetId
              );

              const isApp =
                !!targetItem &&
                (targetItem.isSystem || targetItem.type === 'app');

              const appId =
                targetItem && targetItem.isSystem
                  ? targetItem.appId
                  : targetItem?.type === 'app'
                    ? targetItem.id
                    : null;

              const closeMenu = () =>
                setContextMenu(prev => ({ ...prev, visible: false }));

              /* ----------------------------------------------------------
               * APPLICATION ICON MENU
               * Same visual language as the empty-desktop menu.
               * ---------------------------------------------------------- */
              if (isApp && targetItem) {
                return (
                  <div>
                    <ContextMenuItem
                      icon={ExternalLink}
                      label={`Open ${targetItem.name}`}
                      shortcut="Enter"
                      accent="text-sky-300"
                      onClick={() => {
                        handleOpenItem(targetItem.id, targetItem.type);
                        closeMenu();
                      }}
                    />

                    <ContextMenuItem
                      icon={Sparkles}
                      label="App Features & Details..."
                      accent="text-indigo-300"
                      onClick={() => {
                        setFeaturesModalAppId(appId || 'finder');
                        sound.playClick();
                        closeMenu();
                      }}
                    />

                    <ContextMenuItem
                      icon={Copy}
                      label="Copy App Name"
                      accent="text-slate-300"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(targetItem.name);
                          addNotification({
                            appId: appId || 'system',
                            title: 'Copied App Info',
                            message: `Copied "${targetItem.name}" to clipboard.`,
                            type: 'system',
                          });
                        } catch {
                          // Clipboard can be unavailable in some contexts.
                        }
                        sound.playClick();
                        closeMenu();
                      }}
                    />

                    {appId && (
                      <ContextMenuItem
                        icon={dockAppIds.includes(appId) ? PinOff : Pin}
                        label={
                          dockAppIds.includes(appId)
                            ? 'Remove from Dock'
                            : 'Keep in Dock'
                        }
                        accent="text-amber-300"
                        onClick={() => {
                          toggleDockPin(appId);
                          sound.playClick();
                          closeMenu();
                        }}
                      />
                    )}

                    <ContextMenuItem
                      icon={favoriteItemIds.includes(targetItem.id) ? StarOff : Star}
                      label={favoriteItemIds.includes(targetItem.id) ? 'Remove from Favourites' : 'Add to Favourites'}
                      accent="text-yellow-300"
                      onClick={() => {
                        toggleFavoriteItem(targetItem.id);
                        closeMenu();
                      }}
                    />

                    <ContextMenuSeparator />

                    <ContextMenuItem
                      icon={Info}
                      label="Get Info & Specs"
                      accent="text-white/70"
                      onClick={() => {
                        setFeaturesModalAppId(appId || 'finder');
                        sound.playClick();
                        closeMenu();
                      }}
                    />
                  </div>
                );
              }

              /* ----------------------------------------------------------
               * FILE / FOLDER ICON MENU
               * ---------------------------------------------------------- */
              if (targetItem && !targetItem.isSystem) {
                const isFolder = targetItem.type === 'folder';
                const isImage = targetItem.type === 'image';

                return (
                  <div>
                    <ContextMenuItem
                      icon={isFolder ? Folder : ExternalLink}
                      label="Open"
                      shortcut="Enter"
                      accent="text-sky-300"
                      onClick={() => {
                        const f = vfs.getFileById(contextMenu.targetId!);
                        if (f) handleOpenItem(f.id, f.type, f);
                        closeMenu();
                      }}
                    />

                    <ContextMenuItem
                      icon={Maximize2}
                      label="Quick Look"
                      shortcut="Space"
                      accent="text-purple-300"
                      onClick={() => {
                        const f = vfs.getFileById(contextMenu.targetId!);
                        if (f) setQuickLookFile(f);
                        sound.playClick();
                        closeMenu();
                      }}
                    />

                    {isImage && (
                      <ContextMenuItem
                        icon={Monitor}
                        label="Preview Image"
                        accent="text-amber-300"
                        onClick={() => {
                          const f = vfs.getFileById(contextMenu.targetId!);
                          if (f) setQuickLookFile(f);
                          sound.playClick();
                          closeMenu();
                        }}
                      />
                    )}

                    <ContextMenuSeparator />

                    <ContextMenuItem
                      icon={Copy}
                      label="Copy"
                      shortcut="Ctrl+C"
                      accent="text-white/70"
                      onClick={() => {
                        vfs.copyFiles([contextMenu.targetId!]);
                        sound.playClick();
                        addNotification({
                          appId: 'finder',
                          title: 'Desktop',
                          message: `"${targetItem.name}" copied to clipboard.`,
                          type: 'system',
                        });
                        closeMenu();
                      }}
                    />

                    <ContextMenuItem
                      icon={Files}
                      label="Duplicate"
                      shortcut="Ctrl+D"
                      accent="text-white/70"
                      onClick={() => {
                        vfs.duplicate(contextMenu.targetId!);
                        sound.playClick();
                        refreshFiles();
                        closeMenu();
                      }}
                    />

                    <ContextMenuItem
                      icon={Pencil}
                      label="Rename"
                      shortcut="F2"
                      accent="text-sky-300"
                      onClick={() => {
                        openRenameModal(contextMenu.targetId!, targetItem.name);
                        closeMenu();
                      }}
                    />

                    <ContextMenuItem
                      icon={favoriteItemIds.includes(targetItem.id) ? StarOff : Star}
                      label={favoriteItemIds.includes(targetItem.id) ? 'Remove from Favourites' : 'Add to Favourites'}
                      accent="text-amber-300"
                      onClick={() => {
                        toggleFavoriteItem(targetItem.id);
                        closeMenu();
                      }}
                    />

                    <ContextMenuSeparator />

                    <ContextMenuItem
                      icon={Archive}
                      label="Compress to ZIP File"
                      accent="text-indigo-300"
                      onClick={async () => {
                        await compressDesktopItemToZip(targetItem);
                        closeMenu();
                      }}
                    />

                    <ContextMenuSeparator />

                    <ContextMenuItem
                      icon={Trash2}
                      label="Move to Trash"
                      shortcut="Delete"
                      danger
                      onClick={() => {
                        vfs.moveToTrash(contextMenu.targetId!);
                        sound.playTrash();
                        refreshFiles();
                        setSelectedIconIds(prev =>
                          prev.filter(id => id !== contextMenu.targetId)
                        );
                        closeMenu();
                      }}
                    />
                  </div>
                );
              }

              /* ----------------------------------------------------------
               * EMPTY DESKTOP MENU
               * Matches the supplied reference: same gradient, spacing,
               * typography, icon treatment and separators.
               * ---------------------------------------------------------- */
              return (
                <div>
                  {/* VIEW SUBMENU */}
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDesktopSubmenu('view')}
                  >
                    <ContextMenuItem
                      icon={Grid}
                      label="View"
                      accent="text-sky-300"
                      hasSubmenu
                      onClick={() => setOpenDesktopSubmenu(prev => prev === 'view' ? null : 'view')}
                    />

                    <AnimatePresence>
                      {openDesktopSubmenu === 'view' && (
                        <motion.div
                          initial={{ opacity: 0, x: -5, scale: 0.97 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -4, scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                          onMouseEnter={() => setOpenDesktopSubmenu('view')}
                          className="absolute left-[calc(100%-4px)] top-0 z-[100000] w-[300px] rounded-[16px] border border-white/[0.16] bg-slate-950/[0.42] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-[34px] backdrop-saturate-[155%]"
                        >
                          <ContextMenuItem
                            icon={Maximize2}
                            label="Large icons"
                            shortcut="Ctrl+Shift+2"
                            accent="text-white/80"
                            onClick={() => { setDesktopIconSize('large'); setOpenDesktopSubmenu(null); sound.playClick(); }}
                          />
                          <ContextMenuItem
                            icon={Monitor}
                            label="Medium icons"
                            shortcut="Ctrl+Shift+3"
                            accent="text-white/80"
                            onClick={() => { setDesktopIconSize('medium'); setOpenDesktopSubmenu(null); sound.playClick(); }}
                          />
                          <ContextMenuItem
                            icon={Grid}
                            label="Small icons"
                            shortcut="Ctrl+Shift+4"
                            accent="text-white/80"
                            onClick={() => { setDesktopIconSize('small'); setOpenDesktopSubmenu(null); sound.playClick(); }}
                          />

                          <ContextMenuSeparator />

                          <ContextMenuItem
                            icon={Grid}
                            label="Auto arrange icons"
                            accent="text-sky-300"
                            onClick={() => { handleAutoArrange(); setOpenDesktopSubmenu(null); closeMenu(); }}
                          />
                          <ContextMenuItem
                            icon={Grid}
                            label="Align icons to grid"
                            accent="text-cyan-300"
                            onClick={() => { handleAlignIconsToGrid(); setOpenDesktopSubmenu(null); closeMenu(); }}
                          />

                          <ContextMenuSeparator />

                          <ContextMenuItem
                            icon={showDesktopIcons ? Monitor : X}
                            label={showDesktopIcons ? 'Hide desktop icons' : 'Show desktop icons'}
                            accent={showDesktopIcons ? 'text-sky-300' : 'text-white/70'}
                            onClick={() => { setShowDesktopIcons(prev => !prev); setOpenDesktopSubmenu(null); sound.playClick(); }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* SORT BY SUBMENU */}
                  <div
                    className="relative"
                    onMouseEnter={() => setOpenDesktopSubmenu('sort')}
                  >
                    <ContextMenuItem
                      icon={ArrowDownAZ}
                      label="Sort by"
                      accent="text-cyan-300"
                      hasSubmenu
                      onClick={() => setOpenDesktopSubmenu(prev => prev === 'sort' ? null : 'sort')}
                    />                 <AnimatePresence>
                      {openDesktopSubmenu === 'sort' && (
                        <motion.div
                          initial={{ opacity: 0, x: -5, scale: 0.97 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: -4, scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                          onMouseEnter={() => setOpenDesktopSubmenu('sort')}
                          className="absolute left-[calc(100%-4px)] top-0 z-[100000] w-[300px] rounded-[16px] border border-white/[0.16] bg-slate-950/[0.42] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-[34px] backdrop-saturate-[155%]"
                        >
                          <ContextMenuItem
                            icon={ArrowDownAZ}
                            label="Name (A → Z)"
                            accent="text-sky-300"
                            onClick={() => applyDesktopSort('name', 'asc')}
                          />
                          <ContextMenuItem
                            icon={ArrowUpAZ}
                            label="Name (Z → A)"
                            accent="text-sky-300"
                            onClick={() => applyDesktopSort('name', 'desc')}
                          />
                          <ContextMenuItem
                            icon={FileType2}
                            label="Type"
                            accent="text-indigo-300"
                            onClick={() => applyDesktopSort('type', 'asc')}
                          />
                          <ContextMenuItem
                            icon={CalendarDays}
                            label="Date modified"
                            accent="text-emerald-300"
                            onClick={() => applyDesktopSort('date', 'desc')}
                          />

                          <ContextMenuSeparator />

                          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                            Current: {desktopSortBy === 'name' ? (desktopSortDirection === 'asc' ? 'Name A → Z' : 'Name Z → A') : desktopSortBy === 'type' ? 'Type' : 'Date modified'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    icon={RefreshCw}
                    label="Refresh"
                    accent="text-white/75"
                    onClick={() => { refreshFiles(); sound.playClick(); closeMenu(); }}
                  />

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    icon={Plus}
                    label="New File..."
                    accent="text-sky-300"
                    onClick={() => {
                      setNewFileName('');
                      setShowNewFileModal(true);
                      closeMenu();
                    }}
                  />

                  <ContextMenuItem
                    icon={Folder}
                    label="New Folder"
                    accent="text-amber-300"
                    onClick={() => {
                      handleCreateFolder();
                      closeMenu();
                    }}
                  />

                  {hasClipboard && (
                    <ContextMenuItem
                      icon={ClipboardPaste}
                      label="Paste Items"
                      accent="text-indigo-300"
                      onClick={() => {
                        const pasted = vfs.paste('/Users/abhishek/Desktop');
                        if (pasted.length > 0) {
                          sound.playClick();
                          refreshFiles();
                          setSelectedIconIds(pasted.map(f => f.id));
                        }
                        closeMenu();
                      }}
                    />
                  )}

                  <ContextMenuItem
                    icon={HardDrive}
                    label="Connect PC Drive / Folder..."
                    accent="text-emerald-300"
                    onClick={async () => {
                      closeMenu();
                      if ('showDirectoryPicker' in window) {
                        await connectLocalDirectory();
                        refreshFiles();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                  />

                  <ContextMenuItem
                    icon={UploadCloud}
                    label="Import Files from PC..."
                    accent="text-sky-300"
                    onClick={() => {
                      closeMenu();
                      fileInputRef.current?.click();
                    }}
                  />

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    icon={Image}
                    label="Personalize"
                    accent="text-pink-300"
                    onClick={() => {
                      openApp('settings');
                      closeMenu();
                    }}
                  />


                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Custom Rename Modal — replaces browser prompt */}
      <AnimatePresence>
        {renameModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/[0.34] backdrop-blur-[5px] p-4"
            onPointerDown={() => setRenameModal(prev => ({ ...prev, open: false }))}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(3px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="w-full max-w-[430px] overflow-hidden rounded-[22px] border border-white/[0.15] bg-slate-950/[0.52] backdrop-blur-[34px] backdrop-saturate-[170%] shadow-[0_30px_100px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.10)] text-white"
              onPointerDown={e => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-[12px] bg-sky-400/[0.12] border border-sky-300/[0.18] flex items-center justify-center shrink-0">
                    <Pencil className="h-[18px] w-[18px] text-sky-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold">Rename item</div>
                    <div className="mt-1 text-[10px] text-white/40 truncate">
                      {renameModal.currentName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRenameModal(prev => ({ ...prev, open: false }))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/45 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40">New name</label>
                  <div className="mt-2 flex items-center rounded-[13px] border border-white/[0.12] bg-white/[0.055] focus-within:border-sky-300/60 focus-within:bg-white/[0.075] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <input
                      ref={renameInputRef}
                      autoFocus
                      value={renameModal.value}
                      onChange={e => setRenameModal(prev => ({ ...prev, value: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          commitRename();
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setRenameModal(prev => ({ ...prev, open: false }));
                        }
                      }}
                      className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-white/25"
                      placeholder="Enter a new name"
                    />
                    {renameModal.extension && (
                      <span className="pr-3.5 text-[12px] font-mono text-white/35">
                        {renameModal.extension}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 border-t border-white/[0.08] flex items-center justify-end gap-2 bg-white/[0.018]">
                <button
                  type="button"
                  onClick={() => setRenameModal(prev => ({ ...prev, open: false }))}
                  className="h-9 px-4 rounded-[10px] text-[11px] font-medium text-white/65 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={commitRename}
                  className="h-9 px-4 rounded-[10px] bg-sky-400/[0.88] hover:bg-sky-300 text-slate-950 text-[11px] font-semibold shadow-[0_8px_24px_rgba(56,189,248,0.20)] transition-colors"
                >
                  Rename
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* New File Modal on Desktop */}

      {showNewFileModal && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"

          onClick={() => setShowNewFileModal(false)}

        >

          <div

            className="w-full max-w-md rounded-3xl glass-panel bg-slate-900/95 border border-white/20 p-6 shadow-2xl text-white space-y-4"

            onClick={e => e.stopPropagation()}

          >

            <div className="flex items-center justify-between">

              <h3 className="text-base font-bold flex items-center gap-2">

                <FileText className="w-5 h-5 text-sky-400" />

                <span>Create New File on Desktop</span>

              </h3>

              <button

                onClick={() => setShowNewFileModal(false)}

                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"

              >

                <X className="w-4 h-4" />

              </button>

            </div>



            <div>

              <label className="text-xs font-semibold text-slate-300 block mb-1.5">File Name</label>

              <input

                type="text"

                autoFocus

                placeholder="e.g. notes, script, document"

                value={newFileName}

                onChange={e => setNewFileName(e.target.value)}

                onKeyDown={e => {

                  if (e.key === 'Enter') handleCreateNewFile();

                }}

                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs outline-none focus:border-sky-400"

              />

            </div>



            <div>

              <label className="text-xs font-semibold text-slate-300 block mb-2">File Template / Type</label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                {[

                  { label: 'Plain Text', ext: 'txt', type: 'document', icon: FileText },

                  { label: 'Markdown', ext: 'md', type: 'document', icon: FileSpreadsheet },

                  { label: 'PDF Document', ext: 'pdf', type: 'document', icon: FileType2 },

                  { label: 'TypeScript', ext: 'ts', type: 'code', icon: FileCode },

                  { label: 'JavaScript', ext: 'js', type: 'code', icon: Code2 },

                  { label: 'Python', ext: 'py', type: 'code', icon: Code2 },

                  { label: 'JSON Data', ext: 'json', type: 'code', icon: FileCode },

                ].map(tmpl => {

                  const isSelected = newFileExtension === tmpl.ext;

                  const Icon = tmpl.icon;

                  return (

                    <button

                      key={tmpl.ext}

                      type="button"

                      onClick={() => {

                        setNewFileExtension(tmpl.ext);

                        setNewFileType(tmpl.type as 'document' | 'code');

                      }}

                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${

                        isSelected

                          ? 'bg-sky-500/25 border-sky-400 text-white font-semibold shadow-md'

                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'

                      }`}

                    >

                      {tmpl.ext === 'pdf' ? (
                        <AppIcon
                          assetId="pdf"
                          className="w-5 h-5 flex-shrink-0"
                          fallback={<Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                        />
                      ) : (
                        <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      )}

                      <div className="truncate">

                        <div className="text-xs truncate">{tmpl.label}</div>

                        <div className="text-[10px] text-slate-400 font-mono">.{tmpl.ext}</div>

                      </div>

                    </button>

                  );

                })}

              </div>

            </div>



            <div className="flex justify-end gap-2 pt-2">

              <button

                type="button"

                onClick={() => setShowNewFileModal(false)}

                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs cursor-pointer"

              >

                Cancel

              </button>

              <button

                type="button"

                onClick={handleCreateNewFile}

                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20 cursor-pointer"

              >

                Create File

              </button>

            </div>

          </div>

        </div>

      )}



      {/* App Features & Details Modal */}

      <AppFeaturesModal

        appId={featuresModalAppId}

        isOpen={!!featuresModalAppId}

        onClose={() => setFeaturesModalAppId(null)}

      />

    </div>

  );

};
