import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';

import {
  motion,
  AnimatePresence,
} from 'motion/react';

import {
  Folder,
  Compass,
  MessageCircle,
  Mail,
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
  Minus,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { sound } from '../../services/soundService';
import { AppFeaturesModal } from '../system/AppFeaturesModal';

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
  MessageCircle,
  Mail,
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
  type: 'folder' | 'file' | 'image' | 'code' | 'archive';
  size: string;
  deletedAt: string;
  originalLocation: string;
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

const TRASH_STORAGE_KEY =
  'abhishek-os-trash-items';

/* ============================================================
   DEFAULT TRASH DATA
============================================================ */

const DEFAULT_TRASH_ITEMS: TrashItem[] = [
  {
    id: 'trash-demo-1',
    name: 'Old Website',
    type: 'folder',
    size: '24.8 MB',
    deletedAt: 'Today, 10:42 AM',
    originalLocation: '/Users/Abhishek/Documents',
  },
  {
    id: 'trash-demo-2',
    name: 'design-final.fig',
    type: 'file',
    size: '8.4 MB',
    deletedAt: 'Yesterday, 8:15 PM',
    originalLocation: '/Users/Abhishek/Downloads',
  },
  {
    id: 'trash-demo-3',
    name: 'hero-section.png',
    type: 'image',
    size: '3.1 MB',
    deletedAt: 'Yesterday, 4:20 PM',
    originalLocation: '/Users/Abhishek/Desktop',
  },
];

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
  addNotification: (notification: any) => void;
}

const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  addNotification,
}) => {
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

  /* ============================================================
     LOAD TRASH
  ============================================================ */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    try {
      const saved =
        localStorage.getItem(
          TRASH_STORAGE_KEY,
        );

      if (saved) {
        const parsed = JSON.parse(
          saved,
        ) as TrashItem[];

        if (Array.isArray(parsed)) {
          setItems(parsed);
          return;
        }
      }

      setItems(DEFAULT_TRASH_ITEMS);

      localStorage.setItem(
        TRASH_STORAGE_KEY,
        JSON.stringify(
          DEFAULT_TRASH_ITEMS,
        ),
      );
    } catch {
      setItems(DEFAULT_TRASH_ITEMS);
    }
  }, [isOpen]);

  /* ============================================================
     SAVE TRASH
  ============================================================ */

  const saveItems = (
    nextItems: TrashItem[],
  ) => {
    setItems(nextItems);

    try {
      localStorage.setItem(
        TRASH_STORAGE_KEY,
        JSON.stringify(nextItems),
      );
    } catch {
      // Ignore storage errors.
    }
  };

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

  const restoreSelected = () => {
    if (
      selectedItems.length === 0
    ) {
      return;
    }

    const restoredCount =
      selectedItems.length;

    const remaining = items.filter(
      item =>
        !selectedItems.includes(
          item.id,
        ),
    );

    saveItems(remaining);
    setSelectedItems([]);

    sound.playClick();

    addNotification({
      appId: 'trash',
      title: 'Items Restored',
      message: `${restoredCount} item${
        restoredCount === 1
          ? ''
          : 's'
      } restored from Trash.`,
      type: 'system',
    });
  };

  /* ============================================================
     EMPTY TRASH
  ============================================================ */

  const emptyTrash = () => {
    saveItems([]);
    setSelectedItems([]);
    setShowEmptyConfirm(false);
    setPreviewItem(null);

    sound.playClick();

    addNotification({
      appId: 'trash',
      title: 'Trash Emptied',
      message:
        'All items have been permanently removed from Trash.',
      type: 'system',
    });
  };

  /* ============================================================
     DELETE SELECTED
  ============================================================ */

  const permanentlyDeleteSelected =
    () => {
      if (
        selectedItems.length === 0
      ) {
        return;
      }

      const remaining = items.filter(
        item =>
          !selectedItems.includes(
            item.id,
          ),
      );

      saveItems(remaining);
      setSelectedItems([]);

      sound.playClick();
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
          permanentlyDeleteSelected();
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

  if (!isOpen) {
    return null;
  }

  const windowClass = isMaximized
    ? 'fixed inset-3'
    : 'fixed left-1/2 top-1/2 w-[min(1050px,94vw)] h-[min(720px,86vh)] -translate-x-1/2 -translate-y-1/2';

  return (
    <AnimatePresence>
      <motion.div
        key="trash-modal"
        initial={{
          opacity: 0,
          scale: 0.94,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.94,
          y: 20,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 28,
        }}
        className={`${windowClass} z-[10000] overflow-hidden rounded-2xl border border-white/15 bg-[#15171c]/95 text-white shadow-[0_30px_100px_rgba(0,0,0,0.7)] backdrop-blur-3xl`}
      >
        {/* ======================================================
            TITLE BAR
        ======================================================= */}

        <div className="h-12 shrink-0 border-b border-white/10 bg-white/[0.035] flex items-center px-4">

          {/* MAC TRAFFIC LIGHTS */}

          <div className="flex items-center gap-2 mr-5">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Trash"
              className="w-3 h-3 rounded-full bg-red-500 hover:brightness-110 transition"
            />

            <button
              type="button"
              onClick={() => {}}
              aria-label="Minimize Trash"
              className="w-3 h-3 rounded-full bg-yellow-400 hover:brightness-110 transition"
            />

            <button
              type="button"
              onClick={() =>
                setIsMaximized(
                  previous => !previous,
                )
              }
              aria-label="Maximize Trash"
              className="w-3 h-3 rounded-full bg-green-500 hover:brightness-110 transition"
            />
          </div>

          {/* TITLE */}

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-slate-300" />
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
            onClick={
              restoreSelected
            }
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
                className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-700/60 to-slate-900/70 border border-white/10 flex items-center justify-center shadow-2xl mb-5"
              >
                <Trash2 className="w-14 h-14 text-slate-400" />
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
                        setSelectedItems([
                          previewItem.id,
                        ]);

                        restoreSelected();

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
                        setSelectedItems([
                          previewItem.id,
                        ]);

                        permanentlyDeleteSelected();

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
      </motion.div>
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
    bouncingAppId,
    settings,
    moveDockApp,
    toggleDockPin,
    addNotification,
  } = useOS();

  const dockRef =
    useRef<HTMLDivElement | null>(null);

  const [
    hoveredIndex,
    setHoveredIndex,
  ] = useState<number | null>(null);

  const [
    tooltipApp,
    setTooltipApp,
  ] = useState<string | null>(null);

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

  const isLight =
    settings.theme === 'light';

  /* ============================================================
     DOCK MAGNIFICATION
  ============================================================ */

  const getScale = (
    index: number,
  ) => {
    if (
      !settings.dockMagnification ||
      hoveredIndex === null ||
      draggedAppId !== null
    ) {
      return 1;
    }

    const distance = Math.abs(
      index - hoveredIndex,
    );

    if (distance === 0) {
      return 1.45;
    }

    if (distance === 1) {
      return 1.22;
    }

    if (distance === 2) {
      return 1.08;
    }

    return 1;
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

    setHoveredIndex(null);
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
        className="
          fixed
          bottom-3
          left-0
          right-0
          flex
          justify-center
          z-40
          pointer-events-none
          select-none
        "
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
          onMouseLeave={() => {
            setHoveredIndex(null);
            setTooltipApp(null);
          }}
          className={`
            pointer-events-auto
            px-3
            py-2
            rounded-2xl
            flex
            items-end
            gap-2.5
            transition-all
            duration-200
            max-w-[calc(100vw-20px)]
            overflow-visible
            ${
              isLight
                ? 'glass-dock-light'
                : 'glass-dock'
            }
          `}
          onContextMenu={e => {
            e.preventDefault();
          }}
        >
          {/* ==================================================
              APPLICATION ICONS
          =================================================== */}

          {dockAppIds.map(
            (appId, index) => {
              const app =
                APP_REGISTRY[appId];

              if (!app) {
                return null;
              }

              const IconComp =
                ICON_COMPONENTS[
                  app.iconName
                ] || Folder;

              const isRunning =
                isAppRunning(appId);

              const isBouncing =
                bouncingAppId ===
                appId;

              const scale =
                getScale(index);

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
                  onMouseEnter={() => {
                    if (
                      !draggedAppId
                    ) {
                      setHoveredIndex(
                        index,
                      );

                      setTooltipApp(
                        app.name,
                      );
                    }
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
                      !draggedAppId && (
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

                  {/* APP ICON */}

                  <motion.div
                    animate={{
                      scale: isTargeted
                        ? scale * 1.1
                        : scale,

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
                    style={{
                      background:
                        app.iconBg,
                    }}
                  >
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

                    <IconComp
                      className="
                        w-6
                        h-6
                        drop-shadow-md
                        z-10
                      "
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
              whileHover={{
                scale: 1.15,
              }}
              whileTap={{
                scale: 0.95,
              }}
              className="
                w-12
                h-12
                rounded-2xl
                bg-gradient-to-tr
                from-slate-700
                to-slate-500
                flex
                items-center
                justify-center
                text-white
                shadow-lg
                relative
                overflow-hidden
              "
            >
              <div
                className="
                  absolute
                  inset-0
                  bg-gradient-to-b
                  from-white/20
                  via-transparent
                  to-black/20
                  pointer-events-none
                "
              />

              <Trash2
                className="
                  w-6
                  h-6
                  drop-shadow-md
                  z-10
                "
              />
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
                    <Trash2 className="w-4 h-4 text-slate-300" />
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
        isOpen={trashModalOpen}
        onClose={() =>
          setTrashModalOpen(false)
        }
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