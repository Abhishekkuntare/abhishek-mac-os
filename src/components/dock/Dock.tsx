import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react';

import {
  motion,
  AnimatePresence,
  useAnimationControls,
} from 'motion/react';

import {
  Folder,
  Compass,
  Sparkles,
  Calendar,
  Image,
  Music,
  Tv,
  FileText,
  CheckSquare,
  Terminal,
  Code2,
  Settings,
  ShoppingBag,
  Trash2,
  Activity,
  Gamepad2,
  Smartphone,
  Camera as CameraIcon,
  Info,
  Copy,
  PinOff,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Columns3,
  ArrowUpDown,
  X,
  RotateCcw,
  FolderOpen,
  File,
  FileImage,
  FileCode2,
  FileArchive,
  MoreHorizontal,
  Check,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Minus,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { sound } from '../../services/soundService';
import { vfs } from '../../services/virtualFileSystem';
import { AppFeaturesModal } from '../system/AppFeaturesModal';
import { AppIcon, getAppIconAsset } from '../system/AppIcon';
import { VirtualFile } from '../../types/desktop';
import {
  DESKTOP_ICON_SHAPE_EVENT,
  DESKTOP_ICON_SHAPE_KEY,
  getDesktopIconShapeStyle,
  isDesktopIconShape,
  type DesktopIconShape,
} from '../../utils/desktopIconShape';

/* ============================================================
   ICON REGISTRY
============================================================ */

const ICON_COMPONENTS: Record<
  string,
  React.FC<{ className?: string }>
> = {
  Smartphone,
  CameraIcon,
  Folder,
  Compass,
  Sparkles,
  Calendar,
  Image,
  Music,
  Tv,
  FileText,
  CheckSquare,
  Terminal,
  Code2,
  Settings,
  ShoppingBag,
  Activity,
  Gamepad2,
};

/* ============================================================
   TYPES
============================================================ */

interface DockContextMenuState {
  appId: string;
  x: number;
  y: number;
}

interface TrashItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'image' | 'code' | 'archive' | 'video' | 'audio';
  size: string;
  deletedAt: string;
  originalLocation: string;
  source: 'virtual' | 'local';
  sourceId: string;
}

type TrashViewMode =
  | 'icons'
  | 'list'
  | 'columns';

type TrashSortMode =
  | 'name'
  | 'date'
  | 'size'
  | 'kind';

/* ============================================================
   CONSTANTS
============================================================ */

const CONTEXT_MENU_WIDTH = 224;
const CONTEXT_MENU_HEIGHT = 235;
const SCREEN_PADDING = 10;
const DOCK_FILE_SHORTCUTS_KEY = 'abhishek_os_dock_file_shortcuts_v1';

/* ============================================================
   TRASH ICON
============================================================ */

const getTrashItemIcon = (
  item: TrashItem,
  className = 'w-10 h-10',
) => {
  switch (item.type) {
    case 'folder':
      return (
        <Folder
          className={`${className} text-sky-400 fill-sky-400/20`}
        />
      );

    case 'image':
      return (
        <FileImage
          className={`${className} text-purple-400`}
        />
      );

    case 'code':
      return (
        <FileCode2
          className={`${className} text-emerald-400`}
        />
      );

    case 'archive':
      return (
        <FileArchive
          className={`${className} text-orange-400`}
        />
      );

    default:
      return (
        <File
          className={`${className} text-slate-300`}
        />
      );
  }
};

/* ============================================================
   TRASH MODAL
============================================================ */

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  addNotification: (notification: any) => void;
}

const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  onMinimize,
  addNotification,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const animationControls = useAnimationControls();
  const dragRef = useRef<{
    mode: 'drag' | 'resize';
    pointerId: number;
    startX: number;
    startY: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [modalBounds, setModalBounds] = useState(() => {
    const width = Math.min(1050, typeof window === 'undefined' ? 1050 : window.innerWidth * 0.94);
    const height = Math.min(720, typeof window === 'undefined' ? 720 : window.innerHeight * 0.86);
    return {
      left: Math.max(12, ((typeof window === 'undefined' ? 1440 : window.innerWidth) - width) / 2),
      top: Math.max(12, ((typeof window === 'undefined' ? 900 : window.innerHeight) - height) / 2),
      width,
      height,
    };
  });
  const restoreBoundsRef = useRef(modalBounds);
  const [items, setItems] = useState<TrashItem[]>(
    [],
  );

  const [selectedItems, setSelectedItems] =
    useState<string[]>([]);

  const [viewMode, setViewMode] =
    useState<TrashViewMode>('icons');

  const [sortMode, setSortMode] =
    useState<TrashSortMode>('name');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showSortMenu, setShowSortMenu] =
    useState(false);

  const [showViewMenu, setShowViewMenu] =
    useState(false);

  const [showEmptyConfirm, setShowEmptyConfirm] =
    useState(false);

  const [previewItem, setPreviewItem] =
    useState<TrashItem | null>(null);

  const [isMaximized, setIsMaximized] =
    useState(false);

  const getDockAnimationOrigin = useCallback(() => {
    const bounds = modalRef.current?.getBoundingClientRect();
    const dockIcon = document.querySelector<HTMLElement>(
      '[data-dock-app-id="trash"] [data-dock-icon="true"]',
    );
    if (!bounds || !dockIcon) return null;

    const iconBounds = dockIcon.getBoundingClientRect();
    if (!iconBounds.width || !iconBounds.height) return null;

    return {
      opacity: 0.12,
      scale: Math.max(iconBounds.width / bounds.width, iconBounds.height / bounds.height),
      x: iconBounds.left + iconBounds.width / 2 - (bounds.left + bounds.width / 2),
      y: iconBounds.top + iconBounds.height / 2 - (bounds.top + bounds.height / 2),
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const origin = getDockAnimationOrigin();
    if (origin) {
      animationControls.set(origin);
    } else {
      animationControls.set({ opacity: 0, scale: 0.96, y: 14 });
    }

    void animationControls.start({
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.46, ease: [0.16, 1, 0.3, 1] },
    });
  }, [animationControls, getDockAnimationOrigin, isOpen]);

  const beginModalPointer = (
    event: React.PointerEvent<HTMLElement>,
    mode: 'drag' | 'resize',
  ) => {
    if (
      event.button !== 0 ||
      isMaximized ||
      (event.target instanceof Element &&
        event.target.closest('button, input, [data-no-window-drag="true"]'))
    ) {
      return;
    }

    const bounds = modalRef.current?.getBoundingClientRect();
    if (!bounds) return;

    event.preventDefault();
    dragRef.current = {
      mode,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleModalPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (drag.mode === 'resize') {
      const width = Math.min(Math.max(drag.width + deltaX, 440), window.innerWidth - 24);
      const height = Math.min(Math.max(drag.height + deltaY, 320), window.innerHeight - 24);
      setModalBounds({
        left: Math.min(drag.left, window.innerWidth - width - 12),
        top: Math.min(drag.top, window.innerHeight - height - 12),
        width,
        height,
      });
      return;
    }

    setModalBounds(previous => ({
      ...previous,
      left: Math.min(Math.max(drag.left + deltaX, 48 - drag.width), window.innerWidth - 48),
      top: Math.min(Math.max(drag.top + deltaY, 0), window.innerHeight - 48),
    }));
  };

  const handleModalPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setModalBounds(restoreBoundsRef.current);
      setIsMaximized(false);
      return;
    }

    restoreBoundsRef.current = modalBounds;
    setIsMaximized(true);
  };

  const loadTrash = useCallback(async () => {
    const virtualItems: TrashItem[] = vfs.getTrash().map(file => ({
      id: `virtual:${file.id}`,
      source: 'virtual',
      sourceId: file.id,
      name: file.name,
      type: file.type === 'app' || file.type === 'document' ? 'file' : file.type,
      size: file.size > 0 ? `${(file.size / 1024 ** 2).toFixed(1)} MB` : '—',
      deletedAt: file.updatedAt,
      originalLocation: file.path,
    }));

    let localItems: TrashItem[] = [];
    try {
      const entries = await window.electronAPI?.listLocalTrash?.();
      localItems = (entries || []).map(entry => ({
        id: `local:${entry.id}`,
        source: 'local',
        sourceId: entry.id,
        name: entry.name,
        type: entry.type,
        size: entry.size > 0 ? `${(entry.size / 1024 ** 2).toFixed(1)} MB` : '—',
        deletedAt: entry.deletedAt,
        originalLocation: entry.originalLocation,
      }));
    } catch (error) {
      addNotification({
        appId: 'trash',
        title: 'Unable to load local Trash',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
    setItems([...virtualItems, ...localItems]);
  }, [addNotification]);

  useEffect(() => {
    if (!isOpen) return;
    void loadTrash();
    return vfs.subscribe(() => {
      void loadTrash();
    });
  }, [isOpen, loadTrash]);

  /* ============================================================
     FILTER + SORT
  ============================================================ */

  const visibleItems = React.useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    let result = items.filter(item =>
      item.name
        .toLowerCase()
        .includes(query),
    );

    result = [...result].sort(
      (a, b) => {
        switch (sortMode) {
          case 'date':
            return (
              new Date(b.deletedAt).getTime() -
              new Date(a.deletedAt).getTime()
            );

          case 'size':
            return (
              parseFloat(b.size) -
              parseFloat(a.size)
            );

          case 'kind':
            return a.type.localeCompare(
              b.type,
            );

          case 'name':
          default:
            return a.name.localeCompare(
              b.name,
            );
        }
      },
    );

    return result;
  }, [
    items,
    searchQuery,
    sortMode,
  ]);

  /* ============================================================
     SELECT ITEM
  ============================================================ */

  const toggleItemSelection = (
    id: string,
    event?: React.MouseEvent,
  ) => {
    if (event?.metaKey || event?.ctrlKey) {
      setSelectedItems(previous =>
        previous.includes(id)
          ? previous.filter(
              itemId => itemId !== id,
            )
          : [...previous, id],
      );

      return;
    }

    setSelectedItems([id]);
  };

  /* ============================================================
     SELECT ALL
  ============================================================ */

  const selectAll = () => {
    setSelectedItems(
      visibleItems.map(item => item.id),
    );
  };

  /* ============================================================
     RESTORE
  ============================================================ */

  const restoreSelected = async (ids = selectedItems) => {
    if (ids.length === 0) return;
    let restoredCount = 0;
    const failures: string[] = [];
    for (const item of items.filter(current => ids.includes(current.id))) {
      try {
        if (item.source === 'local') {
          if (!window.electronAPI?.restoreLocalTrashEntry) {
            throw new Error('Local Trash is unavailable. Update and restart ARLO OS.');
          }
          await window.electronAPI.restoreLocalTrashEntry(item.sourceId);
        } else if (!vfs.restoreFromTrash(item.sourceId)) {
          throw new Error('This item is no longer in Trash.');
        }
        restoredCount += 1;
      } catch (error) {
        failures.push(`${item.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    setSelectedItems([]);
    await loadTrash();
    if (restoredCount > 0) sound.playClick();
    addNotification({
      appId: 'trash',
      title: failures.length ? 'Some items could not be restored' : 'Items Restored',
      message: failures.length
        ? `${restoredCount} restored. ${failures.join('; ')}`
        : `${restoredCount} item${restoredCount === 1 ? '' : 's'} restored from Trash.`,
      type: 'system',
    });
  };

  /* ============================================================
     EMPTY TRASH
  ============================================================ */

  const emptyTrash = async () => {
    vfs.emptyTrash();
    let failure: string | null = null;
    try {
      const localCount = items.filter(item => item.source === 'local').length;
      if (localCount > 0 && !window.electronAPI?.emptyLocalTrash) {
        throw new Error('Local Trash is unavailable. Update and restart ARLO OS.');
      }
      await window.electronAPI?.emptyLocalTrash?.();
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    setSelectedItems([]);
    setShowEmptyConfirm(false);
    setPreviewItem(null);
    await loadTrash();

    sound.playClick();

    addNotification({
      appId: 'trash',
      title: failure ? 'Some Trash items could not be deleted' : 'Trash Emptied',
      message: failure || 'All items in app Trash have been permanently deleted.',
      type: 'system',
    });
  };

  /* ============================================================
     DELETE SELECTED
  ============================================================ */

  const permanentlyDeleteSelected = async (ids = selectedItems) => {
    if (ids.length === 0) return;
    let deletedCount = 0;
    const failures: string[] = [];
    for (const item of items.filter(current => ids.includes(current.id))) {
      try {
        if (item.source === 'local') {
          if (!window.electronAPI?.deleteLocalTrashEntry) {
            throw new Error('Local Trash is unavailable. Update and restart ARLO OS.');
          }
          await window.electronAPI.deleteLocalTrashEntry(item.sourceId);
        } else if (!vfs.deletePermanently(item.sourceId)) {
          throw new Error('This item is no longer in Trash.');
        }
        deletedCount += 1;
      } catch (error) {
        failures.push(`${item.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    setSelectedItems([]);
    await loadTrash();
    if (deletedCount > 0) sound.playClick();
    if (failures.length) {
      addNotification({
        appId: 'trash',
        title: 'Some items could not be permanently deleted',
        message: `${deletedCount} deleted. ${failures.join('; ')}`,
        type: 'system',
      });
    }
  };

  /* ============================================================
     KEYBOARD
  ============================================================ */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        if (previewItem) {
          setPreviewItem(null);
          return;
        }

        if (showEmptyConfirm) {
          setShowEmptyConfirm(false);
          return;
        }

        onClose();
      }

      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() === 'a'
      ) {
        event.preventDefault();
        selectAll();
      }

      if (
        event.key === 'Delete' ||
        event.key === 'Backspace'
      ) {
        if (
          selectedItems.length > 0
        ) {
          void permanentlyDeleteSelected();
        }
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    isOpen,
    previewItem,
    showEmptyConfirm,
    selectedItems,
    visibleItems,
  ]);

  /* ============================================================
     CLOSE
  ============================================================ */

  return (
    <AnimatePresence>
      {isOpen && <motion.div
        ref={modalRef}
        key="trash-modal"
        initial={false}
        animate={animationControls}
        variants={{
          dockExit: () => ({
            ...(getDockAnimationOrigin() ?? { opacity: 0, scale: 0.92, y: 12 }),
            transition: { duration: 0.36, ease: [0.4, 0, 1, 1] },
          }),
        }}
        exit="dockExit"
        style={
          isMaximized
            ? { left: 12, top: 12, width: 'calc(100vw - 24px)', height: 'calc(100vh - 24px)' }
            : modalBounds
        }
        className="fixed z-[10000] overflow-hidden rounded-2xl border border-white/15 bg-[#15171c]/95 text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)] backdrop-blur-3xl"
      >
        {/* ======================================================
            TITLE BAR
        ======================================================= */}

        <div
          className="h-12 shrink-0 border-b border-white/10 bg-white/[0.035] flex items-center px-4 cursor-grab active:cursor-grabbing"
          onPointerDown={event => beginModalPointer(event, 'drag')}
          onPointerMove={handleModalPointerMove}
          onPointerUp={handleModalPointerUp}
          onPointerCancel={handleModalPointerUp}
        >

          {/* MAC TRAFFIC LIGHTS */}

          <div className="flex items-center gap-2 mr-5">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Trash"
              className="group/control w-3 h-3 rounded-full bg-red-500 hover:brightness-110 transition flex items-center justify-center text-red-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
            >
              <X className="w-2 h-2 opacity-0 group-hover/control:opacity-100 group-focus-visible/control:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize Trash"
              className="group/control w-3 h-3 rounded-full bg-yellow-400 hover:brightness-110 transition flex items-center justify-center text-yellow-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
            >
              <Minus className="w-2 h-2 opacity-0 group-hover/control:opacity-100 group-focus-visible/control:opacity-100 transition-opacity" />
            </button>

            <button
              type="button"
              onClick={toggleMaximize}
              aria-label="Maximize Trash"
              className="group/control w-3 h-3 rounded-full bg-green-500 hover:brightness-110 transition flex items-center justify-center text-green-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
            >
              {isMaximized ? (
                <Minimize2 className="w-2 h-2 opacity-0 group-hover/control:opacity-100 group-focus-visible/control:opacity-100 transition-opacity" />
              ) : (
                <Maximize2 className="w-2 h-2 opacity-0 group-hover/control:opacity-100 group-focus-visible/control:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          {/* TITLE */}

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <AppIcon appId="trash" className="w-4 h-4 object-contain" />
            <span className="text-sm font-semibold">
              Trash
            </span>
          </div>

          {/* SEARCH */}

          <div className="ml-auto relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />

            <input
              value={searchQuery}
              onChange={event =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search"
              className="w-40 h-7 rounded-lg bg-black/25 border border-white/10 pl-8 pr-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-white/20"
            />
          </div>
        </div>

        {/* ======================================================
            TOOLBAR
        ======================================================= */}

        <div className="h-14 shrink-0 border-b border-white/10 bg-white/[0.025] flex items-center px-4 gap-2">

          {/* BACK */}

          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* FORWARD */}

          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* RESTORE */}

          <button
            type="button"
            disabled={
              selectedItems.length === 0
            }
            onClick={() => void restoreSelected()}
            className="h-8 px-3 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Put Back</span>
          </button>

          {/* EMPTY */}

          <button
            type="button"
            disabled={items.length === 0}
            onClick={() =>
              setShowEmptyConfirm(true)
            }
            className="h-8 px-3 rounded-lg hover:bg-red-500/10 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 text-xs text-red-300"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Trash</span>
          </button>

          <div className="flex-1" />

          {/* VIEW MENU */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowViewMenu(
                  previous => !previous,
                );
                setShowSortMenu(false);
              }}
              className="h-8 px-2.5 rounded-lg hover:bg-white/10 flex items-center gap-2"
              title="View"
            >
              {viewMode === 'icons' && (
                <Grid2X2 className="w-4 h-4" />
              )}

              {viewMode === 'list' && (
                <List className="w-4 h-4" />
              )}

              {viewMode === 'columns' && (
                <Columns3 className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showViewMenu && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                    scale: 0.96,
                  }}
                  className="absolute right-0 top-10 z-30 w-40 rounded-xl border border-white/10 bg-[#202228]/95 backdrop-blur-2xl shadow-2xl p-1"
                >
                  {[
                    {
                      id: 'icons',
                      label: 'Icon View',
                      icon: Grid2X2,
                    },
                    {
                      id: 'list',
                      label: 'List View',
                      icon: List,
                    },
                    {
                      id: 'columns',
                      label: 'Column View',
                      icon: Columns3,
                    },
                  ].map(option => {
                    const Icon =
                      option.icon;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setViewMode(
                            option.id as TrashViewMode,
                          );
                          setShowViewMenu(
                            false,
                          );
                        }}
                        className="w-full h-9 px-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-xs"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>
                          {option.label}
                        </span>

                        {viewMode ===
                          option.id && (
                          <Check className="w-3.5 h-3.5 ml-auto text-sky-400" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SORT MENU */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSortMenu(
                  previous => !previous,
                );
                setShowViewMenu(false);
              }}
              className="h-8 w-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
              title="Sort"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                    scale: 0.96,
                  }}
                  className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-white/10 bg-[#202228]/95 backdrop-blur-2xl shadow-2xl p-1"
                >
                  {[
                    ['name', 'Name'],
                    ['date', 'Date Deleted'],
                    ['size', 'Size'],
                    ['kind', 'Kind'],
                  ].map(
                    ([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSortMode(
                            id as TrashSortMode,
                          );
                          setShowSortMenu(
                            false,
                          );
                        }}
                        className="w-full h-9 px-2 rounded-lg hover:bg-white/10 flex items-center text-xs"
                      >
                        {label}

                        {sortMode === id && (
                          <Check className="w-3.5 h-3.5 ml-auto text-sky-400" />
                        )}
                      </button>
                    ),
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
            title="More"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================
            CONTENT
        ======================================================= */}

        <div
          className="absolute top-[106px] bottom-10 left-0 right-0 overflow-auto"
          onClick={event => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedItems([]);
            }
          }}
        >
          {visibleItems.length === 0 ? (
            /* EMPTY TRASH */
            <div className="h-full flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                className="w-28 h-28 flex items-center justify-center mb-5"
              >
                <AppIcon appId="trash" className="w-full h-full object-contain" />
              </motion.div>

              <h2 className="text-lg font-semibold text-white">
                Trash is Empty
              </h2>

              <p className="mt-2 text-sm text-slate-500 max-w-xs">
                Items you move to the Trash
                will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* ==================================================
                  ICON VIEW
              =================================================== */}

              {viewMode === 'icons' && (
                <div className="p-6 grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-5">
                  {visibleItems.map(
                    item => {
                      const selected =
                        selectedItems.includes(
                          item.id,
                        );

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileHover={{
                            y: -2,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          onClick={event =>
                            toggleItemSelection(
                              item.id,
                              event,
                            )
                          }
                          onDoubleClick={() =>
                            setPreviewItem(
                              item,
                            )
                          }
                          className={`relative min-h-[150px] rounded-xl p-4 flex flex-col items-center justify-center transition ${
                            selected
                              ? 'bg-sky-500/15 ring-2 ring-sky-400/60'
                              : 'hover:bg-white/[0.055]'
                          }`}
                        >
                          {getTrashItemIcon(
                            item,
                            'w-14 h-14',
                          )}

                          <span className="mt-3 max-w-full truncate text-xs text-white">
                            {item.name}
                          </span>

                          <span className="mt-1 text-[10px] text-slate-500">
                            {item.size}
                          </span>
                        </motion.button>
                      );
                    },
                  )}
                </div>
              )}

              {/* ==================================================
                  LIST VIEW
              =================================================== */}

              {viewMode === 'list' && (
                <div className="p-4">
                  <div className="grid grid-cols-[1fr_140px_120px_180px] px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
                    <span>Name</span>
                    <span>Kind</span>
                    <span>Size</span>
                    <span>Date Deleted</span>
                  </div>

                  {visibleItems.map(
                    item => {
                      const selected =
                        selectedItems.includes(
                          item.id,
                        );

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={event =>
                            toggleItemSelection(
                              item.id,
                              event,
                            )
                          }
                          onDoubleClick={() =>
                            setPreviewItem(
                              item,
                            )
                          }
                          className={`w-full grid grid-cols-[1fr_140px_120px_180px] px-4 py-3 text-left items-center rounded-lg transition ${
                            selected
                              ? 'bg-sky-500/15'
                              : 'hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getTrashItemIcon(
                              item,
                              'w-7 h-7',
                            )}

                            <span className="text-xs truncate">
                              {item.name}
                            </span>
                          </div>

                          <span className="text-xs text-slate-400 capitalize">
                            {item.type}
                          </span>

                          <span className="text-xs text-slate-400">
                            {item.size}
                          </span>

                          <span className="text-xs text-slate-400">
                            {item.deletedAt}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              {/* ==================================================
                  COLUMN VIEW
              =================================================== */}

              {viewMode ===
                'columns' && (
                <div className="h-full flex">
                  <div className="w-[260px] shrink-0 border-r border-white/10 overflow-auto p-2">
                    {visibleItems.map(
                      item => {
                        const selected =
                          selectedItems.includes(
                            item.id,
                          );

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={event =>
                              toggleItemSelection(
                                item.id,
                                event,
                              )
                            }
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left ${
                              selected
                                ? 'bg-sky-500/15'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            {getTrashItemIcon(
                              item,
                              'w-6 h-6',
                            )}

                            <span className="text-xs truncate">
                              {item.name}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-center p-10">
                    {selectedItems.length ===
                    1 ? (
                      (() => {
                        const item =
                          items.find(
                            current =>
                              current.id ===
                              selectedItems[0],
                          );

                        if (!item) {
                          return null;
                        }

                        return (
                          <div className="text-center">
                            {getTrashItemIcon(
                              item,
                              'w-28 h-28',
                            )}

                            <h3 className="mt-5 text-lg font-semibold">
                              {item.name}
                            </h3>

                            <p className="mt-2 text-xs text-slate-500">
                              {item.size}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Deleted{' '}
                              {item.deletedAt}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              Originally located at{' '}
                              {
                                item.originalLocation
                              }
                            </p>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="text-center text-slate-500">
                        <FolderOpen className="w-12 h-12 mx-auto opacity-40" />

                        <p className="mt-3 text-sm">
                          Select an item to
                          preview it.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ======================================================
            STATUS BAR
        ======================================================= */}

        <div className="absolute bottom-0 left-0 right-0 h-10 border-t border-white/10 bg-white/[0.025] px-4 flex items-center text-[11px] text-slate-500">
          <span>
            {items.length}{' '}
            {items.length === 1
              ? 'item'
              : 'items'}
          </span>

          {selectedItems.length >
            0 && (
            <>
              <span className="mx-2">
                •
              </span>

              <span className="text-sky-400">
                {selectedItems.length}{' '}
                selected
              </span>
            </>
          )}

          <div className="ml-auto">
            {items.length === 0
              ? 'Trash is Empty'
              : 'Items are permanently deleted when Trash is emptied'}
          </div>
        </div>

        {/* ======================================================
            ITEM PREVIEW
        ======================================================= */}

        <AnimatePresence>
          {previewItem && (
            <>
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() =>
                  setPreviewItem(null)
                }
              />

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.94,
                  y: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  y: 15,
                }}
                className="absolute z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(520px,90%)] rounded-2xl border border-white/10 bg-[#1d1f24]/95 backdrop-blur-3xl shadow-2xl p-6"
              >
                <button
                  type="button"
                  onClick={() =>
                    setPreviewItem(null)
                  }
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                  {getTrashItemIcon(
                    previewItem,
                    'w-20 h-20',
                  )}

                  <h2 className="mt-5 text-lg font-semibold">
                    {previewItem.name}
                  </h2>

                  <p className="mt-2 text-xs text-slate-400">
                    {previewItem.size}
                  </p>

                  <div className="mt-5 w-full rounded-xl bg-black/20 border border-white/5 p-4 text-left space-y-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-slate-500">
                        Kind
                      </span>

                      <span className="text-xs text-slate-300 capitalize">
                        {previewItem.type}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-slate-500">
                        Deleted
                      </span>

                      <span className="text-xs text-slate-300">
                        {previewItem.deletedAt}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-xs text-slate-500">
                        Original Location
                      </span>

                      <span className="text-xs text-slate-300 truncate">
                        {
                          previewItem.originalLocation
                        }
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void restoreSelected([previewItem.id]);
                        setPreviewItem(
                          null,
                        );
                      }}
                      className="px-4 h-9 rounded-lg bg-sky-500/15 border border-sky-400/20 hover:bg-sky-500/25 text-xs flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Put Back
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void permanentlyDeleteSelected([previewItem.id]);
                        setPreviewItem(
                          null,
                        );
                      }}
                      className="px-4 h-9 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-300 text-xs flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Permanently
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ======================================================
            EMPTY TRASH CONFIRMATION
        ======================================================= */}

        <AnimatePresence>
          {showEmptyConfirm && (
            <>
              <motion.div
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="absolute inset-0 z-[60] bg-black/45 backdrop-blur-sm"
              />

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                }}
                className="absolute z-[61] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,90%)] rounded-2xl border border-white/10 bg-[#22242a] shadow-2xl p-6"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                  </div>

                  <h2 className="mt-4 text-base font-semibold">
                    Empty Trash?
                  </h2>

                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    Are you sure you want to
                    permanently delete all
                    items in the Trash?
                    This action cannot be
                    undone.
                  </p>

                  <div className="mt-6 flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() =>
                        setShowEmptyConfirm(
                          false,
                        )
                      }
                      className="flex-1 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        emptyTrash
                      }
                      className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm font-semibold"
                    >
                      Empty Trash
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {!isMaximized && (
          <div
            role="presentation"
            onPointerDown={event => beginModalPointer(event, 'resize')}
            onPointerMove={handleModalPointerMove}
            onPointerUp={handleModalPointerUp}
            onPointerCancel={handleModalPointerUp}
            className="absolute bottom-0 right-0 z-[70] h-5 w-5 cursor-nwse-resize touch-none"
            aria-label="Resize Trash window"
          >
            <span className="absolute bottom-1 right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-white/35" />
          </div>
        )}
      </motion.div>}
    </AnimatePresence>
  );
};

/* ============================================================
   DOCK
============================================================ */

export const Dock: React.FC = () => {
  const {
    dockAppIds,
    windows,
    openApp,
    focusWindow,
    bouncingAppId,
    settings,
    resolvedTheme,
    moveDockApp,
    toggleDockPin,
    addNotification,
    setQuickLookFile,
  } = useOS();

  const dockRef =
    useRef<HTMLDivElement | null>(null);

  const [dockFileIds, setDockFileIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(DOCK_FILE_SHORTCUTS_KEY);
      return stored ? [...new Set(JSON.parse(stored) as string[])] : [];
    } catch (error) {
      console.warn('Could not load Dock file shortcuts.', error);
      return [];
    }
  });
  const [availableFiles, setAvailableFiles] = useState<VirtualFile[]>(() => vfs.getAllActiveFiles());
  const dockFiles = dockFileIds
    .map(id => availableFiles.find(file => file.id === id))
    .filter((file): file is VirtualFile => Boolean(file));
  const [isDesktopItemOverDock, setIsDesktopItemOverDock] = useState(false);
  const [desktopIconShape, setDesktopIconShape] = useState<DesktopIconShape>(() => {
    try {
      const stored = localStorage.getItem(DESKTOP_ICON_SHAPE_KEY);
      return isDesktopIconShape(stored) ? stored : 'rounded';
    } catch (error) {
      console.warn('Could not load the desktop icon shape for the Dock.', error);
      return 'rounded';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DOCK_FILE_SHORTCUTS_KEY, JSON.stringify(dockFileIds));
    } catch (error) {
      console.warn('Could not save Dock file shortcuts.', error);
    }
    window.dispatchEvent(new CustomEvent('dock:file-shortcuts-changed', {
      detail: dockFileIds,
    }));
  }, [dockFileIds]);

  useEffect(() => {
    const handleShapeChange = (event: Event) => {
      const shape: unknown = (event as CustomEvent<unknown>).detail;
      if (isDesktopIconShape(shape)) setDesktopIconShape(shape);
    };
    window.addEventListener(DESKTOP_ICON_SHAPE_EVENT, handleShapeChange);
    return () => window.removeEventListener(DESKTOP_ICON_SHAPE_EVENT, handleShapeChange);
  }, []);

  useEffect(() => vfs.subscribe(() => {
    setAvailableFiles(vfs.getAllActiveFiles());
  }), []);

  useEffect(() => {
    const handleDesktopDrop = (event: Event) => {
      const detail = (event as CustomEvent<{ appId?: string; fileId?: string }>).detail;
      if (detail?.appId) {
        const app = APP_REGISTRY[detail.appId];
        if (!app?.installed || dockAppIds.includes(detail.appId)) return;
        toggleDockPin(detail.appId);
        sound.playClick();
        addNotification({
          appId: detail.appId,
          title: 'Added to Dock',
          message: `${app.name} is now available in the Dock.`,
          type: 'system',
        });
        return;
      }

      if (detail?.fileId) {
        const file = vfs.getFileById(detail.fileId);
        if (!file || file.isDeleted) return;
        setDockFileIds(previous =>
          previous.includes(file.id) ? previous : [...previous, file.id],
        );
        sound.playClick();
      }
    };
    const handleDesktopRemove = (event: Event) => {
      const detail = (event as CustomEvent<{ fileId?: string }>).detail;
      if (detail?.fileId) {
        setDockFileIds(previous => previous.filter(id => id !== detail.fileId));
      }
    };
    const handleDragState = (event: Event) => {
      const detail = (event as CustomEvent<{ overDock?: boolean }>).detail;
      setIsDesktopItemOverDock(detail?.overDock === true);
    };

    window.addEventListener('desktop:item-drop-to-dock', handleDesktopDrop);
    window.addEventListener('desktop:item-remove-from-dock', handleDesktopRemove);
    window.addEventListener('desktop:item-drag-state', handleDragState);
    return () => {
      window.removeEventListener('desktop:item-drop-to-dock', handleDesktopDrop);
      window.removeEventListener('desktop:item-remove-from-dock', handleDesktopRemove);
      window.removeEventListener('desktop:item-drag-state', handleDragState);
    };
  }, [addNotification, dockAppIds, toggleDockPin]);

  const dockPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dockMagnificationFrameRef = useRef<number | null>(null);

  const [
    tooltipApp,
    setTooltipApp,
  ] = useState<string | null>(null);

  const [previewWindowId, setPreviewWindowId] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);
  const [previewCaptureFailed, setPreviewCaptureFailed] = useState(false);
  const previewRequestRef = useRef(0);

  const [
    draggedAppId,
    setDraggedAppId,
  ] = useState<string | null>(null);

  const [
    dragOverAppId,
    setDragOverAppId,
  ] = useState<string | null>(null);

  const [
    featuresModalAppId,
    setFeaturesModalAppId,
  ] = useState<string | null>(null);

  const [
    dockContextMenu,
    setDockContextMenu,
  ] = useState<DockContextMenuState | null>(
    null,
  );

  /* ============================================================
     TRASH MODAL STATE
  ============================================================ */

  const [
    trashModalOpen,
    setTrashModalOpen,
  ] = useState(false);
  const [trashModalMinimized, setTrashModalMinimized] = useState(false);

  const isLight = resolvedTheme === 'light';
  const dockSharesMenuBarEdge = settings.dockPosition === settings.menuBarPosition;

  /* ============================================================
     DOCK MAGNIFICATION
  ============================================================ */

  const resetDockMagnification = () => {
    if (dockMagnificationFrameRef.current !== null) {
      cancelAnimationFrame(dockMagnificationFrameRef.current);
      dockMagnificationFrameRef.current = null;
    }

    dockPointerRef.current = null;
    dockRef.current
      ?.querySelectorAll<HTMLElement>('[data-dock-icon="true"]')
      .forEach(icon => {
        icon.style.scale = '1';
      });
  };

  useEffect(() => () => {
    if (dockMagnificationFrameRef.current !== null) {
      cancelAnimationFrame(dockMagnificationFrameRef.current);
    }
  }, []);

  const handleDockPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return;

    dockPointerRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    if (dockMagnificationFrameRef.current !== null) return;

    dockMagnificationFrameRef.current = requestAnimationFrame(() => {
      dockMagnificationFrameRef.current = null;
      const pointer = dockPointerRef.current;
      const dock = dockRef.current;
      if (!pointer || !dock) return;

      const icons = dock.querySelectorAll<HTMLElement>('[data-dock-icon="true"]');
      const vertical = settings.dockPosition === 'left' || settings.dockPosition === 'right';
      const pointerAxis = vertical ? pointer.y : pointer.x;
      const radius = 58;

      icons.forEach(icon => {
        const bounds = (icon.parentElement ?? icon).getBoundingClientRect();
        const center = vertical
          ? bounds.top + bounds.height / 2
          : bounds.left + bounds.width / 2;
        const distance = Math.abs(pointerAxis - center);
        const scale = settings.dockMagnification && !settings.lowPowerMode && draggedAppId === null
          ? 1 + 0.18 * Math.exp(-(distance * distance) / (2 * radius * radius))
          : 1;

        icon.style.scale = scale.toFixed(3);
      });
    });
  };

  const getDockIconOrigin = () => {
    switch (settings.dockPosition) {
      case 'top':
        return 'top center';
      case 'left':
        return 'center left';
      case 'right':
        return 'center right';
      default:
        return 'bottom center';
    }
  };

  /* ============================================================
     RUNNING APP
  ============================================================ */

  const isAppRunning = (
    appId: string,
  ) => {
    return windows.some(
      window =>
        window.appId === appId,
    );
  };

  /* ============================================================
     DRAG START
  ============================================================ */

  const handleDragStart = (
    e: React.DragEvent,
    appId: string,
  ) => {
    setDraggedAppId(appId);

    e.dataTransfer.effectAllowed =
      'move';

    e.dataTransfer.setData(
      'text/plain',
      appId,
    );
    e.dataTransfer.setData(
      'application/x-abhishek-os-dock-app',
      appId,
    );
    e.dataTransfer.setData(
      'application/x-abhishek-os-dock-app-name',
      APP_REGISTRY[appId]?.name ?? appId,
    );

    sound.playClick();
  };

  /* ============================================================
     DRAG OVER
  ============================================================ */

  const handleDragOver = (
    e: React.DragEvent,
    appId: string,
  ) => {
    e.preventDefault();

    e.dataTransfer.dropEffect =
      'move';

    if (
      dragOverAppId !== appId
    ) {
      setDragOverAppId(appId);
    }
  };

  /* ============================================================
     DRAG LEAVE
  ============================================================ */

  const handleDragLeave = (
    _e: React.DragEvent,
    appId: string,
  ) => {
    if (
      dragOverAppId === appId
    ) {
      setDragOverAppId(null);
    }
  };

  /* ============================================================
     DROP
  ============================================================ */

  const handleDrop = (
    e: React.DragEvent,
    targetAppId: string,
  ) => {
    e.preventDefault();

    if (
      draggedAppId &&
      draggedAppId !== targetAppId
    ) {
      const sourceIndex =
        dockAppIds.indexOf(
          draggedAppId,
        );

      const targetIndex =
        dockAppIds.indexOf(
          targetAppId,
        );

      if (
        sourceIndex !== -1 &&
        targetIndex !== -1
      ) {
        moveDockApp(
          sourceIndex,
          targetIndex,
        );

        sound.playClick();
      }
    }

    setDraggedAppId(null);
    setDragOverAppId(null);
  };

  /* ============================================================
     DRAG END
  ============================================================ */

  const handleDragEnd = () => {
    setDraggedAppId(null);
    setDragOverAppId(null);
  };

  /* ============================================================
     CLOSE CONTEXT MENU
  ============================================================ */

  const closeContextMenu =
    useCallback(() => {
      setDockContextMenu(null);
    }, []);

  /* ============================================================
     ESCAPE CLOSE
  ============================================================ */

  useEffect(() => {
    const handleKeyDown = (
      e: KeyboardEvent,
    ) => {
      if (
        e.key === 'Escape' &&
        dockContextMenu
      ) {
        e.preventDefault();
        closeContextMenu();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    dockContextMenu,
    closeContextMenu,
  ]);

  /* ============================================================
     CLOSE MENU ON RESIZE
  ============================================================ */

  useEffect(() => {
    if (!dockContextMenu) {
      return;
    }

    const handleResize = () => {
      closeContextMenu();
    };

    window.addEventListener(
      'resize',
      handleResize,
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize,
      );
    };
  }, [
    dockContextMenu,
    closeContextMenu,
  ]);

  /* ============================================================
     CONTEXT MENU POSITION
  ============================================================ */

  const calculateContextMenuPosition =
    (
      clientX: number,
      clientY: number,
    ) => {
      const viewportWidth =
        window.innerWidth;

      const viewportHeight =
        window.innerHeight;

      let x =
        clientX -
        CONTEXT_MENU_WIDTH / 2;

      let y =
        clientY -
        CONTEXT_MENU_HEIGHT -
        12;

      x = Math.max(
        SCREEN_PADDING,
        Math.min(
          x,
          viewportWidth -
            CONTEXT_MENU_WIDTH -
            SCREEN_PADDING,
        ),
      );

      if (
        y < SCREEN_PADDING
      ) {
        y = clientY + 12;
      }

      y = Math.max(
        SCREEN_PADDING,
        Math.min(
          y,
          viewportHeight -
            CONTEXT_MENU_HEIGHT -
            SCREEN_PADDING,
        ),
      );

      return {
        x,
        y,
      };
    };

  /* ============================================================
     APP CONTEXT MENU
  ============================================================ */

  const handleDockContextMenu = (
    e: React.MouseEvent,
    appId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedAppId) {
      return;
    }

    const position =
      calculateContextMenuPosition(
        e.clientX,
        e.clientY,
      );

    resetDockMagnification();
    setTooltipApp(null);

    sound.playClick();

    setDockContextMenu({
      appId,
      x: position.x,
      y: position.y,
    });
  };

  /* ============================================================
     OPEN APP
  ============================================================ */

  const handleOpenApp = (
    appId: string,
  ) => {
    openApp(appId);
    sound.playClick();
    closeContextMenu();
  };

  /* ============================================================
     FEATURES
  ============================================================ */

  const handleOpenFeatures = (
    appId: string,
  ) => {
    setFeaturesModalAppId(appId);
    sound.playClick();
    closeContextMenu();
  };

  /* ============================================================
     COPY APP NAME
  ============================================================ */

  const handleCopyAppName = async (
    appId: string,
  ) => {
    const name =
      APP_REGISTRY[appId]?.name ||
      appId;

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          name,
        );

        addNotification({
          appId,
          title: 'App Name Copied',
          message: `Copied "${name}" to clipboard.`,
          type: 'system',
        });
      } else {
        const textarea =
          document.createElement(
            'textarea',
          );

        textarea.value = name;
        textarea.style.position =
          'fixed';
        textarea.style.left =
          '-9999px';
        textarea.style.top =
          '-9999px';

        document.body.appendChild(
          textarea,
        );

        textarea.focus();
        textarea.select();

        const copied =
          document.execCommand(
            'copy',
          );

        textarea.remove();

        if (copied) {
          addNotification({
            appId,
            title: 'App Name Copied',
            message: `Copied "${name}" to clipboard.`,
            type: 'system',
          });
        }
      }
    } catch {
      // Clipboard can fail.
    }

    sound.playClick();
    closeContextMenu();
  };

  /* ============================================================
     DOCK PIN
  ============================================================ */

  const handleToggleDockPin = (
    appId: string,
  ) => {
    toggleDockPin(appId);
    sound.playClick();
    closeContextMenu();
  };

  /* ============================================================
     TRASH CLICK
     IMPORTANT: DOES NOT OPEN FINDER
  ============================================================ */

  const handleTrashClick = () => {
    closeContextMenu();

    setTooltipApp(null);

    setTrashModalMinimized(false);
    setTrashModalOpen(true);

    sound.playClick();
  };

  /* ============================================================
     TRASH RIGHT CLICK
  ============================================================ */

  const handleTrashContextMenu = (
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setTooltipApp(null);

    sound.playClick();

    // Trash gets its own context menu.
    // We use a fake app id so the normal
    // application menu does not open.
    setDockContextMenu({
      appId: '__trash__',
      x: calculateContextMenuPosition(
        e.clientX,
        e.clientY,
      ).x,
      y: calculateContextMenuPosition(
        e.clientX,
        e.clientY,
      ).y,
    });
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <>
      {/* ======================================================
          DOCK
      ======================================================= */}

      <div
        data-os-dock-container
        className={`fixed flex justify-center z-40 pointer-events-none select-none ${
          settings.dockPosition === 'top'
            ? dockSharesMenuBarEdge
              ? 'top-10 left-0 right-0'
              : 'top-3 left-0 right-0'
            : settings.dockPosition === 'left'
              ? dockSharesMenuBarEdge
                ? 'left-[3.75rem] top-0 bottom-0 flex-col'
                : 'left-3 top-0 bottom-0 flex-col'
              : settings.dockPosition === 'right'
                ? dockSharesMenuBarEdge
                  ? 'right-[3.75rem] top-0 bottom-0 flex-col'
                  : 'right-3 top-0 bottom-0 flex-col'
                : dockSharesMenuBarEdge
                  ? 'bottom-10 left-0 right-0'
                  : 'bottom-3 left-0 right-0'
        }`}
      >
        <motion.div
          ref={dockRef}
          initial={{
            y: 80,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 25,
          }}
          onPointerMove={handleDockPointerMove}
          onMouseLeave={() => {
            resetDockMagnification();
            setTooltipApp(null);
            setPreviewWindowId(null);
            setPreviewSnapshot(null);
            setPreviewCaptureFailed(false);
            previewRequestRef.current += 1;
          }}
          className={`
            pointer-events-auto
            px-3
            py-2
            rounded-2xl
            flex
            ${settings.dockPosition === 'left' || settings.dockPosition === 'right' ? 'flex-col items-center max-h-[calc(100vh-24px)] overflow-y-auto' : 'flex-row items-end max-w-[calc(100vw-20px)]'}
            gap-2.5
            transition-all
            duration-200
            overflow-visible
            ${isDesktopItemOverDock ? 'ring-2 ring-sky-400/80 bg-sky-400/10' : ''}
            ${
              isLight
                ? 'glass-dock-light'
                : 'glass-dock'
            }
          `}
          data-dock-drop-zone="true"
          onContextMenu={e => {
            e.preventDefault();
          }}
        >
          {/* ==================================================
              APPLICATION ICONS
          =================================================== */}

          {dockAppIds.map(
            appId => {
              const app =
                APP_REGISTRY[appId];

              if (!app) {
                return null;
              }

              const IconComp =
                ICON_COMPONENTS[
                  app.iconName
                ] || Folder;
              const iconAsset = getAppIconAsset(appId);

              const isRunning =
                isAppRunning(appId);

              const isBouncing =
                bouncingAppId ===
                appId;

              const isBeingDragged =
                draggedAppId ===
                appId;

              const isTargeted =
                dragOverAppId ===
                  appId &&
                draggedAppId !==
                  appId;

              return (
                <div
                  key={appId}
                  data-dock-app-id={appId}
                  draggable
                  onDragStart={e =>
                    handleDragStart(
                      e,
                      appId,
                    )
                  }
                  onDragOver={e =>
                    handleDragOver(
                      e,
                      appId,
                    )
                  }
                  onDragLeave={e =>
                    handleDragLeave(
                      e,
                      appId,
                    )
                  }
                  onDrop={e =>
                    handleDrop(
                      e,
                      appId,
                    )
                  }
                  onDragEnd={
                    handleDragEnd
                  }
                  className={`
                    relative
                    flex
                    flex-col
                    items-center
                    group
                    cursor-grab
                    active:cursor-grabbing
                    transition-all
                    duration-150
                    ${
                      isBeingDragged
                        ? 'opacity-30 scale-95'
                        : 'opacity-100'
                    }
                  `}
                  onMouseEnter={async () => {
                    if (
                      !draggedAppId
                    ) {
                      setTooltipApp(
                        app.name,
                      );
                      const appWindow = windows
                        .filter(window => window.appId === appId)
                        .sort((a, b) => b.zIndex - a.zIndex)[0];
                      setPreviewWindowId(appWindow?.id ?? null);
                      setPreviewSnapshot(null);
                      setPreviewCaptureFailed(false);
                      const requestId = ++previewRequestRef.current;
                      if (appWindow && !appWindow.isMinimized && window.electronAPI?.captureWindowPreview) {
                        const target = Array.from(
                          document.querySelectorAll<HTMLElement>('[data-window-id]'),
                        ).find(element => element.dataset.windowId === appWindow.id);
                        if (target) {
                          const bounds = target.getBoundingClientRect();
                          if (bounds.width <= 0 || bounds.height <= 0) {
                            setPreviewCaptureFailed(true);
                            return;
                          }
                          try {
                            const snapshot = await window.electronAPI.captureWindowPreview({
                              x: bounds.x,
                              y: bounds.y,
                              width: bounds.width,
                              height: bounds.height,
                            });
                            if (previewRequestRef.current === requestId) {
                              setPreviewSnapshot(snapshot);
                            }
                          } catch (error) {
                            console.error('Could not capture the Dock window preview:', error);
                            if (previewRequestRef.current === requestId) {
                              setPreviewCaptureFailed(true);
                            }
                          }
                        } else setPreviewCaptureFailed(true);
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    setPreviewWindowId(null);
                    setPreviewSnapshot(null);
                    setPreviewCaptureFailed(false);
                    previewRequestRef.current += 1;
                  }}
                  onClick={() => {
                    if (
                      !draggedAppId
                    ) {
                      handleOpenApp(
                        appId,
                      );
                    }
                  }}
                  onContextMenu={e =>
                    handleDockContextMenu(
                      e,
                      appId,
                    )
                  }
                >
                  {/* DROP INDICATOR */}

                  <AnimatePresence>
                    {isTargeted && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          scaleY: 0.5,
                        }}
                        animate={{
                          opacity: 1,
                          scaleY: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scaleY: 0.5,
                        }}
                        className="
                          absolute
                          -left-1.5
                          top-2
                          bottom-4
                          w-1
                          bg-sky-400
                          rounded-full
                          shadow-[0_0_8px_rgba(56,189,248,0.8)]
                          z-50
                          pointer-events-none
                        "
                      />
                    )}
                  </AnimatePresence>

                  {/* TOOLTIP */}

                  <AnimatePresence>
                    {tooltipApp ===
                      app.name &&
                      !draggedAppId &&
                      previewWindowId === null && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 5,
                          }}
                          animate={{
                            opacity: 1,
                            y: -10,
                          }}
                          exit={{
                            opacity: 0,
                            y: 5,
                          }}
                          transition={{
                            duration: 0.12,
                          }}
                          className="
                            absolute
                            -top-10
                            px-2.5
                            py-1
                            rounded-lg
                            glass-panel
                            text-white
                            text-[11px]
                            font-medium
                            shadow-xl
                            border
                            border-white/20
                            whitespace-nowrap
                            pointer-events-none
                            z-50
                          "
                        >
                          {app.name}
                        </motion.div>
                      )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {previewWindowId && windows.some(window =>
                      window.id === previewWindowId && window.appId === appId
                    ) && !draggedAppId && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, y: 10, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                        onClick={event => {
                          event.stopPropagation();
                          focusWindow(previewWindowId);
                          setPreviewWindowId(null);
                          setTooltipApp(null);
                        }}
                        className="absolute bottom-full left-1/2 z-[120] w-[min(280px,80vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/20 bg-[#11131d]/95 p-1.5 text-left text-white shadow-[0_20px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
                        aria-label={`Restore ${app.name}`}
                      >
                        {(() => {
                          const previewWindow = windows.find(window => window.id === previewWindowId);
                          if (!previewWindow) return null;
                          return (
                            <>
                              <div className="flex items-center gap-2 rounded-t-xl border-b border-white/[0.08] px-2.5 py-2">
                                <span
                                  className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-black"
                                  style={{ background: app.iconBg }}
                                >
                                  {previewWindow.title.charAt(0).toUpperCase()}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">{previewWindow.title}</span>
                                <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold ${previewWindow.isMinimized ? 'bg-amber-300/15 text-amber-200' : 'bg-emerald-300/15 text-emerald-200'}`}>
                                  {previewWindow.isMinimized ? 'MINIMIZED' : 'OPEN'}
                                </span>
                              </div>
                              <div className="relative flex h-[142px] items-center justify-center overflow-hidden rounded-b-xl bg-slate-950">
                                {previewSnapshot ? (
                                  <img src={previewSnapshot} alt={`${previewWindow.title} live window preview`} className="h-full w-full object-fill" />
                                ) : (
                                  <span className="px-4 text-center text-[10px] text-white/55">
                                    {previewWindow.isMinimized
                                      ? 'Window minimized — click to restore'
                                      : previewCaptureFailed
                                        ? 'Could not capture this window preview'
                                      : window.electronAPI?.captureWindowPreview
                                        ? 'Capturing window preview…'
                                        : 'Window preview is available in the desktop app'}
                                  </span>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[9px] font-medium text-white/80">
                                  Click to bring {app.name} to front
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* APP ICON */}

                  <motion.div
                    animate={{
                      scale: isTargeted
                        ? 1.1
                        : 1,

                      y: isBouncing
                        ? [
                            0,
                            -18,
                            0,
                            -10,
                            0,
                          ]
                        : 0,
                    }}
                    transition={{
                      scale: {
                        type: 'spring',
                        stiffness: 350,
                        damping: 25,
                      },

                      y: isBouncing
                        ? {
                            duration: 0.8,
                            repeat: Infinity,
                          }
                        : {
                            duration: 0.2,
                          },
                    }}
                    className={`
                      w-12
                      h-12
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-white
                      shadow-lg
                      transition-all
                      duration-200
                      hover:shadow-sky-500/30
                      overflow-hidden
                      relative
                      ${
                        isTargeted
                          ? `
                            ring-2
                            ring-sky-400
                            shadow-sky-500/40
                          `
                          : ''
                      }
                    `}
                    data-desktop-icon-shape={desktopIconShape}
                    style={{
                      ...getDesktopIconShapeStyle(desktopIconShape),
                      background: iconAsset
                        ? 'transparent'
                        : app.iconBg,
                      transformOrigin: getDockIconOrigin(),
                      transition: 'scale 90ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                    data-dock-icon="true"
                  >
                    {!iconAsset && (
                      <div
                        className="
                        absolute
                        inset-0
                        bg-gradient-to-b
                        from-white/25
                        via-transparent
                        to-black/20
                        pointer-events-none
                      "
                      />
                    )}

                    <AppIcon
                      appId={appId}
                      className="relative z-10 h-full w-full object-contain"
                      style={getDesktopIconShapeStyle(desktopIconShape)}
                      fallback={
                        <IconComp
                          className="
                            relative
                            z-10
                            w-6
                            h-6
                            drop-shadow-md
                          "
                        />
                      }
                    />
                  </motion.div>

                  {/* RUNNING DOT */}

                  <div className="h-1.5 flex items-center justify-center mt-1">
                    <AnimatePresence>
                      {isRunning && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            scale: 0,
                          }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0,
                          }}
                          layoutId={`dot-${appId}`}
                          className="
                            w-1.5
                            h-1.5
                            rounded-full
                            bg-white/90
                            shadow-[0_0_6px_rgba(255,255,255,0.8)]
                          "
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            },
          )}

          <AnimatePresence>
            {dockFiles.map(file => {
              const hasArtwork = file.type === 'folder' || file.extension?.toLowerCase() === 'pdf';
              const icon = file.type === 'folder'
                ? <AppIcon assetId="folder" className="h-full w-full object-contain" style={getDesktopIconShapeStyle(desktopIconShape)} />
                : file.extension?.toLowerCase() === 'pdf'
                  ? <AppIcon assetId="pdf" className="h-full w-full object-contain" style={getDesktopIconShapeStyle(desktopIconShape)} />
                  : file.type === 'image'
                    ? <FileImage className="h-6 w-6 text-amber-200" strokeWidth={1.8} />
                    : file.type === 'code'
                      ? <FileCode2 className="h-6 w-6 text-sky-200" strokeWidth={1.8} />
                      : file.type === 'archive'
                        ? <FileArchive className="h-6 w-6 text-violet-200" strokeWidth={1.8} />
                        : <FileText className="h-6 w-6 text-white/90" strokeWidth={1.8} />;

              return (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.65, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.65, y: 10 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  data-dock-file-id={file.id}
                  className="group/dockfile relative flex shrink-0 flex-col items-center"
                  onMouseEnter={() => setTooltipApp(file.name)}
                  onMouseLeave={() => setTooltipApp(null)}
                >
                  <button
                    type="button"
                    data-dock-icon="true"
                    title={file.name}
                    aria-label={`Open ${file.name}`}
                    onClick={() => {
                      if (file.type === 'folder') {
                        const folderPath = `${file.path.replace(/\/+$/, '')}/${file.name}`.replace(/\/+/g, '/');
                        try {
                          localStorage.setItem('finder-pending-open-path', folderPath);
                        } catch (error) {
                          console.warn('Could not save the folder to open in Finder.', error);
                        }
                        openApp('finder');
                        window.dispatchEvent(new CustomEvent('finder:open-host-path', { detail: folderPath }));
                      } else {
                        setQuickLookFile(file);
                      }
                      sound.playClick();
                    }}
                    className={`relative flex h-12 w-12 appearance-none items-center justify-center overflow-hidden p-0 outline-none transition-[filter,scale] duration-150 hover:brightness-110 focus-visible:outline-none ${
                      hasArtwork
                        ? 'border-0 bg-transparent shadow-none'
                        : 'border border-white/15 bg-gradient-to-br from-white/[0.17] via-white/[0.08] to-slate-950/45 shadow-[0_8px_20px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.18)]'
                    }`}
                    data-desktop-icon-shape={desktopIconShape}
                    style={getDesktopIconShapeStyle(desktopIconShape)}
                  >
                    {icon}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name} from Dock`}
                    title="Remove from Dock"
                    onClick={() => {
                      setDockFileIds(previous => previous.filter(id => id !== file.id));
                      setTooltipApp(null);
                      sound.playClick();
                    }}
                    className="absolute -right-1 -top-1 z-20 hidden h-[18px] w-[18px] items-center justify-center rounded-full border border-white/25 bg-slate-950/95 text-white shadow-[0_3px_10px_rgba(0,0,0,0.45)] transition-transform hover:scale-110 group-hover/dockfile:flex group-focus-within/dockfile:flex"
                  >
                    <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </button>
                  <AnimatePresence>
                    {tooltipApp === file.name && !isDesktopItemOverDock && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: -10 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="pointer-events-none absolute -top-10 z-50 max-w-48 truncate whitespace-nowrap rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl glass-panel"
                      >
                        {file.name}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="mt-1.5 flex h-1.5 items-center justify-center" aria-hidden="true" />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ==================================================
              DIVIDER
          =================================================== */}

          <div
            className="
              w-px
              h-8
              bg-white/20
              my-auto
              mx-1
              shrink-0
            "
          />

          {/* ==================================================
              TRASH
          =================================================== */}

          <div
            data-dock-app-id="trash"
            className="
              relative
              flex
              flex-col
              items-center
              group
              cursor-pointer
              shrink-0
            "
            onMouseEnter={() => {
              setTooltipApp('Trash');
            }}
            onClick={
              handleTrashClick
            }
            onContextMenu={
              handleTrashContextMenu
            }
          >
            {/* TRASH TOOLTIP */}

            <AnimatePresence>
              {tooltipApp ===
                'Trash' && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: -10,
                  }}
                  exit={{
                    opacity: 0,
                    y: 5,
                  }}
                  transition={{
                    duration: 0.12,
                  }}
                  className="
                    absolute
                    -top-10
                    px-2.5
                    py-1
                    rounded-lg
                    glass-panel
                    text-white
                    text-[11px]
                    font-medium
                    shadow-xl
                    border
                    border-white/20
                    whitespace-nowrap
                    pointer-events-none
                    z-50
                  "
                >
                  Trash
                </motion.div>
              )}
            </AnimatePresence>

            {/* TRASH ICON */}

            <motion.div
              whileTap={{
                scale: 0.95,
              }}
              className="
                w-12
                h-12
                flex
                items-center
                justify-center
                text-white
                shadow-lg
                relative
                overflow-hidden
              "
              style={{
                ...getDesktopIconShapeStyle(desktopIconShape),
                transformOrigin: getDockIconOrigin(),
                transition: 'scale 90ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              data-dock-icon="true"
            >
              <AppIcon appId="trash" className="relative z-10 h-full w-full object-contain" style={getDesktopIconShapeStyle(desktopIconShape)} />
            </motion.div>

            <div className="h-1.5 mt-1" />
          </div>
        </motion.div>
      </div>

      {/* ======================================================
          DOCK CONTEXT MENU
      ======================================================= */}

      <AnimatePresence>
        {dockContextMenu && (
          <>
            {/* BACKDROP */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                fixed
                inset-0
                z-[9998]
                pointer-events-auto
                bg-transparent
              "
              onPointerDown={e => {
                if (
                  e.target ===
                  e.currentTarget
                ) {
                  closeContextMenu();
                }
              }}
              onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
                closeContextMenu();
              }}
            />

            {/* ==================================================
                TRASH CONTEXT MENU
            =================================================== */}

            {dockContextMenu.appId ===
            '__trash__' ? (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.94,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  y: 8,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 28,
                }}
                style={{
                  left: dockContextMenu.x,
                  top: dockContextMenu.y,
                  transformOrigin:
                    'bottom center',
                }}
                className="
                  fixed
                  z-[9999]
                  w-56
                  rounded-2xl
                  glass-panel
                  text-white
                  py-1.5
                  shadow-[0_20px_60px_rgba(0,0,0,0.55)]
                  border
                  border-white/20
                  backdrop-blur-3xl
                  text-xs
                  font-medium
                  pointer-events-auto
                  overflow-hidden
                "
                onPointerDown={e =>
                  e.stopPropagation()
                }
                onClick={e =>
                  e.stopPropagation()
                }
                onContextMenu={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* HEADER */}

                <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                    <AppIcon appId="trash" className="w-4 h-4 object-contain" />
                  </div>

                  <div>
                    <div className="font-bold">
                      Trash
                    </div>

                    <div className="text-[10px] text-slate-400">
                      System Folder
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  {/* OPEN */}

                  <button
                    type="button"
                    onClick={() => {
                      setTrashModalOpen(
                        true,
                      );
                      setTrashModalMinimized(false);

                      closeContextMenu();

                      sound.playClick();
                    }}
                    className="
                      w-full
                      px-3.5
                      py-2
                      flex
                      items-center
                      gap-2.5
                      text-left
                      hover:bg-white/15
                      transition-colors
                    "
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400" />

                    <span>
                      Open Trash
                    </span>
                  </button>

                  {/* EMPTY */}

                  <button
                    type="button"
                    onClick={() => {
                      setTrashModalOpen(
                        true,
                      );
                      setTrashModalMinimized(false);

                      closeContextMenu();

                      sound.playClick();
                    }}
                    className="
                      w-full
                      px-3.5
                      py-2
                      flex
                      items-center
                      gap-2.5
                      text-left
                      hover:bg-white/15
                      transition-colors
                    "
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />

                    <span>
                      Empty Trash...
                    </span>
                  </button>

                  <div className="h-px bg-white/10 my-1 mx-2" />

                  {/* CANCEL */}

                  <button
                    type="button"
                    onClick={
                      closeContextMenu
                    }
                    className="
                      w-full
                      px-3.5
                      py-2
                      text-left
                      hover:bg-white/10
                    "
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ==================================================
                  NORMAL APP CONTEXT MENU
              =================================================== */

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.94,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                  y: 8,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 28,
                }}
                style={{
                  left: dockContextMenu.x,
                  top: dockContextMenu.y,
                  transformOrigin:
                    'bottom center',
                }}
                className="
                  fixed
                  z-[9999]
                  w-56
                  rounded-2xl
                  glass-panel
                  text-white
                  py-1.5
                  shadow-[0_20px_60px_rgba(0,0,0,0.55)]
                  border
                  border-white/20
                  backdrop-blur-3xl
                  text-xs
                  font-medium
                  pointer-events-auto
                  overflow-hidden
                "
                onPointerDown={e =>
                  e.stopPropagation()
                }
                onClick={e =>
                  e.stopPropagation()
                }
                onContextMenu={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {/* HEADER */}

                <div
                  className="
                    px-3
                    py-2
                    border-b
                    border-white/10
                    flex
                    items-center
                    gap-2
                    min-w-0
                  "
                >
                  <div
                    className="
                      w-7
                      h-7
                      rounded-lg
                      bg-white/10
                      border
                      border-white/10
                      flex
                      items-center
                      justify-center
                      shrink-0
                    "
                  >
                    {(() => {
                      const app =
                        APP_REGISTRY[
                          dockContextMenu
                            .appId
                        ];

                      const IconComp =
                        ICON_COMPONENTS[
                          app?.iconName
                        ] || Folder;

                      return (
                        <IconComp className="w-4 h-4 text-white" />
                      );
                    })()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate">
                      {APP_REGISTRY[
                        dockContextMenu
                          .appId
                      ]?.name ||
                        dockContextMenu.appId}
                    </div>

                    <div className="text-[10px] text-slate-400">
                      Application
                    </div>
                  </div>
                </div>

                {/* MENU ITEMS */}

                <div className="py-1">
                  {/* OPEN */}

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenApp(
                        dockContextMenu.appId,
                      );
                    }}
                    className="
                      w-full
                      px-3.5
                      py-2
                      flex
                      items-center
                      gap-2.5
                      text-left
                      hover:bg-white/15
                      active:bg-white/20
                      transition-colors
                    "
                  >
                    <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />

                    <span>
                      Open Application
                    </span>
                  </button>

                  {/* FEATURES */}

                  <button
                    type="button"
                    onClick={() => {
                      handleOpenFeatures(
                        dockContextMenu.appId,
                      );
                    }}
                    className="
                      w-full
                      px-3.5
                      py-2
                      flex
                      items-center
                      gap-2.5
                      text-left
                      hover:bg-white/15
                      active:bg-white/20
                      text-indigo-300
                      transition-colors
                      font-semibold
                    "
                  >
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />

                    <span>
                      App Features & Details...
                    </span>
                  </button>

                  {/* COPY NAME */}

                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyAppName(
                        dockContextMenu.appId,
                      );
                    }}
                    className="
                      w-full
                      px-3.5
                      py-2
                      flex
                      items-center
                      gap-2.5
                      text-left
                      hover:bg-white/15
                      active:bg-white/20
                      transition-colors
                    "
                  >
                    <Copy className="w-4 h-4 text-slate-400 shrink-0" />

                    <span>
                      Copy App Name
                    </span>
                  </button>

                  <div className="h-px bg-white/10 my-1 mx-2" />

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={() => {
                      handleToggleDockPin(
                        dockContextMenu.appId,
                      );
                    }}
                    className="
                      w-full
                      px-3.5
                      py-2
                      flex
                      items-center
                      gap-2.5
                      text-left
                      hover:bg-amber-500/10
                      active:bg-amber-500/20
                      text-amber-300
                      transition-colors
                    "
                  >
                    <PinOff className="w-4 h-4 text-amber-400 shrink-0" />

                    <span>
                      Remove from Dock
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* ======================================================
          TRASH WINDOW
      ======================================================= */}

      <TrashModal
        isOpen={trashModalOpen && !trashModalMinimized}
        onClose={() => {
          setTrashModalOpen(false)
          setTrashModalMinimized(false)
        }}
        onMinimize={() => setTrashModalMinimized(true)}
        addNotification={
          addNotification
        }
      />

      {/* ======================================================
          FEATURES MODAL
      ======================================================= */}

      <AppFeaturesModal
        appId={featuresModalAppId}
        isOpen={
          !!featuresModalAppId
        }
        onClose={() =>
          setFeaturesModalAppId(null)
        }
      />
    </>
  );
};