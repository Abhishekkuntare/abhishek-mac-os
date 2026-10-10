import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Music,
  Code2,
  HardDrive,
  Download,
  Search,
  Grid,
  List,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  Cloud,
  Laptop,
  Copy,
  Scissors,
  ClipboardPaste,
  Files,
  Edit3,
  SortAsc,
  ChevronDown,
  Info,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Film,
  FileCode,
  FileSpreadsheet,
  ListFilter,
  Terminal,
  Code,
  ArrowUpDown,
  Star,
  Share2,
  Printer,
  Save,
  LockKeyhole,
  Play,
  Pause,
  Keyboard,
  AppWindow,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { VirtualFile } from '../../types/desktop';
import { vfs } from '../../services/virtualFileSystem';
import { sound } from '../../services/soundService';
import { openVirtualFile } from '../../services/fileAssociations';
import { AppIcon } from '../system/AppIcon';
import { APP_REGISTRY } from '../../data/defaultApps';

interface LocalApplicationShortcut {
  path: string;
  name: string;
  iconUrl?: string;
}

const readLocalApplicationShortcuts = (): LocalApplicationShortcut[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('finder-local-applications') || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item): item is LocalApplicationShortcut =>
      typeof item === 'object' &&
      item !== null &&
      'path' in item && typeof item.path === 'string' &&
      'name' in item && typeof item.name === 'string' &&
      (!('iconUrl' in item) || typeof item.iconUrl === 'string' && item.iconUrl.startsWith('data:image/')),
    );
  } catch (error) {
    console.warn('[Finder] Could not restore local application shortcuts:', error);
    return [];
  }
};

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fileId: string | null;
}

type SortField = 'name' | 'updatedAt' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';

const getHostParentPath = (targetPath: string) => {
  const separatorIndex = Math.max(targetPath.lastIndexOf('\\'), targetPath.lastIndexOf('/'));
  if (separatorIndex < 0) return targetPath;
  if (separatorIndex === 2 && /^[a-z]:/i.test(targetPath)) return targetPath.slice(0, 3);
  return targetPath.slice(0, separatorIndex) || targetPath.slice(0, 1);
};

const mapLocalFolderEntries = async (entries: LocalFolderEntry[], currentPath: string): Promise<VirtualFile[]> => {
  const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif']);
  const videoExtensions = new Set(['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v']);
  const audioExtensions = new Set(['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus']);
  const codeExtensions = new Set(['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'sql', 'md']);

  return Promise.all(entries.map(async entry => {
    const type: VirtualFile['type'] = entry.isDirectory
      ? 'folder'
      : imageExtensions.has(entry.extension)
        ? 'image'
        : videoExtensions.has(entry.extension)
          ? 'video'
          : audioExtensions.has(entry.extension)
            ? 'audio'
            : codeExtensions.has(entry.extension)
              ? 'code'
              : ['exe', 'msi', 'appx'].includes(entry.extension)
                ? 'app'
                : ['zip', 'rar', '7z', 'tar', 'gz'].includes(entry.extension)
                  ? 'archive'
                  : 'document';
    let previewUrl: string | undefined;
    if (type === 'image' && window.electronAPI?.getMediaUrl) {
      try {
        previewUrl = await window.electronAPI.getMediaUrl(entry.hostPath);
      } catch (error) {
        console.error(`[Finder] Could not load thumbnail for "${entry.name}":`, error);
      }
    }
    return {
      id: `host:${entry.hostPath}`,
      hostPath: entry.hostPath,
      name: entry.name,
      path: currentPath,
      size: entry.size,
      type,
      extension: entry.extension,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      previewUrl,
    };
  }));
};

const imageUrlToLockWallpaper = async (url: string) => {
  const image = new window.Image();
  image.src = url;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not load the selected image.'));
  });
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the lock screen wallpaper.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
};

export const FinderApp: React.FC = () => {
  const {
    setQuickLookFile,
    openApp,
    importLocalFiles,
    connectLocalDirectory,
    addNotification,
    uploadCustomWallpaper,
    setLockScreenWallpaper,
    recordActivity,
  } = useOS();

  const [filesState, setFilesState] = useState<VirtualFile[]>(() => vfs.getAllActiveFiles());
  const [localFolders, setLocalFolders] = useState<LocalFolderGrant[]>([]);
  const [localFiles, setLocalFiles] = useState<VirtualFile[]>([]);
  const [favoriteHostPaths, setFavoriteHostPaths] = useState<Array<{
    path: string;
    name: string;
    isDirectory: boolean;
  }>>(() => {
    try {
      const saved = localStorage.getItem('finder-favorite-host-paths');
      const parsed: unknown = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap(item => {
        if (typeof item === 'string') {
          return [{
            path: item,
            name: item.split(/[\\/]+/).filter(Boolean).pop() || item,
            isDirectory: false,
          }];
        }
        if (
          item &&
          typeof item === 'object' &&
          'path' in item &&
          typeof item.path === 'string' &&
          'name' in item &&
          typeof item.name === 'string' &&
          'isDirectory' in item &&
          typeof item.isDirectory === 'boolean'
        ) {
          return [{ path: item.path, name: item.name, isDirectory: item.isDirectory }];
        }
        return [];
      });
    } catch {
      return [];
    }
  });
  const [currentPath, setCurrentPath] = useState('/Users/abhishek');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [hostClipboard, setHostClipboard] = useState<{ paths: string[]; move: boolean } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [localApplications, setLocalApplications] = useState<LocalApplicationShortcut[]>(readLocalApplicationShortcuts);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [pathHistory, setPathHistory] = useState<string[]>(['/Users/abhishek']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const previousPathRef = useRef(currentPath);

  useEffect(() => {
    if (previousPathRef.current === currentPath) return;
    previousPathRef.current = currentPath;
    const folderName = currentPath.split(/[\\/]+/).filter(Boolean).pop() || 'Computer';
    void recordActivity({
      category: 'workspace',
      title: 'Opened Finder location',
      details: folderName,
      context: {
        appId: 'finder',
        appName: 'Finder',
        itemName: folderName,
        itemType: 'Folder',
      },
    });
  }, [currentPath, recordActivity]);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Modals / Panels
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'document' | 'code'>('document');
  const [newFileExtension, setNewFileExtension] = useState('txt');

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [showInspector, setShowInspector] = useState(false);
  const [showFolderProperties, setShowFolderProperties] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDraggingOverFinder, setIsDraggingOverFinder] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    fileId: null,
  });
  const [contextSubmenu, setContextSubmenu] = useState<'view' | 'sort' | 'new' | null>(null);
  const [saveToAppFile, setSaveToAppFile] = useState<VirtualFile | null>(null);
  const [saveDestination, setSaveDestination] = useState('/Users/abhishek/Pictures');
  const [imageFilmstrip, setImageFilmstrip] = useState<{
    files: VirtualFile[];
    index: number;
    playing: boolean;
  } | null>(null);
  const [imageSlideDirection, setImageSlideDirection] = useState<1 | -1>(1);
  const imageSwipeStart = useRef<number | null>(null);
  const filmstripThumbsRef = useRef<HTMLDivElement | null>(null);

  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const refreshFiles = () => {
    setFilesState(vfs.getAllActiveFiles());
  };

  useEffect(() => {
    try {
      localStorage.setItem('finder-favorite-host-paths', JSON.stringify(favoriteHostPaths));
    } catch (error) {
      console.warn('[Finder] Could not save favorite locations:', error);
    }
  }, [favoriteHostPaths]);

  useEffect(() => {
    try {
      localStorage.setItem('finder-local-applications', JSON.stringify(localApplications));
    } catch (error) {
      console.error('[Finder] Could not save local application shortcuts:', error);
    }
  }, [localApplications]);

  const isBrowsingLocal = currentPath === 'local://drives' || localFolders.some(folder => {
    const root = folder.path.toLowerCase().replace(/[\\/]+$/, '');
    const current = currentPath.toLowerCase();
    return current === root || current.startsWith(`${root}\\`) || current.startsWith(`${root}/`);
  });

  const refreshLocalFolders = async () => {
    const folders = await window.electronAPI?.getLocalFolders?.();
    if (folders) {
      setLocalFolders(folders);
      if (folders.some(folder => folder.isDriveRoot) && currentPath === '/Users/abhishek') {
        setCurrentPath('local://drives');
        setPathHistory(['local://drives']);
        setHistoryIndex(0);
      }
    }
  };

  useEffect(() => {
    const handleLocalAccessChanged = () => void refreshLocalFolders();
    void refreshLocalFolders();
    window.addEventListener('local-access-changed', handleLocalAccessChanged);
    return () => window.removeEventListener('local-access-changed', handleLocalAccessChanged);
  }, []);

  useEffect(() => {
    if (!isBrowsingLocal || !window.electronAPI?.listLocalFolder) {
      setLocalFiles([]);
      return;
    }

    let cancelled = false;
    window.electronAPI.listLocalFolder(currentPath).then(entries => {
      if (cancelled) return;
      void mapLocalFolderEntries(entries, currentPath).then(files => {
        if (!cancelled) setLocalFiles(files);
      }).catch(error => {
        console.warn('[Finder] Could not load local media previews:', error);
        if (!cancelled) setLocalFiles([]);
      });
    }).catch(error => {
      console.warn('[Finder] Could not list local folder:', error);
      if (!cancelled) setLocalFiles([]);
    });

    return () => {
      cancelled = true;
    };
  }, [currentPath, isBrowsingLocal]);

  const sideNavItems = [
    ...(localFolders.some(folder => folder.isDriveRoot)
      ? [{ label: 'This PC', path: 'local://drives', icon: HardDrive }]
      : []),
    { label: 'Home', path: '/Users/abhishek', icon: HardDrive },
    { label: 'Desktop', path: localFolders.find(folder => folder.label.toLowerCase() === 'desktop')?.path || '/Users/abhishek/Desktop', icon: Laptop },
    { label: 'Documents', path: localFolders.find(folder => folder.label.toLowerCase() === 'documents')?.path || '/Users/abhishek/Documents', icon: Folder },
    { label: 'Downloads', path: localFolders.find(folder => folder.label.toLowerCase() === 'downloads')?.path || '/Users/abhishek/Downloads', icon: Download },
    { label: 'Local Computer (PC)', path: '/Users/abhishek/Local Computer', icon: Laptop },
    { label: 'Applications', path: '/Applications', icon: Folder },
    { label: 'iCloud Drive', path: '/Users/abhishek/Documents', icon: Cloud },
    ...favoriteHostPaths.map(favorite => ({
      label: favorite.name,
      path: favorite.isDirectory
        ? favorite.path
        : getHostParentPath(favorite.path),
      icon: Star,
      fileId: favorite.isDirectory ? undefined : `host:${favorite.path}`,
    })),
    ...filesState.filter(file => file.isFavorite).map(file => ({
      label: file.name,
      path: file.path,
      icon: Star,
      fileId: file.id,
    })),
  ];

  const navigateTo = useCallback((path: string) => {
    sound.playClick();
    setCurrentPath(path);
    setSelectedFileIds([]);
    setRenamingId(null);
    const newHist = [...pathHistory.slice(0, historyIndex + 1), path];
    setPathHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  }, [pathHistory, historyIndex]);

  useEffect(() => {
    const openHostPath = (path: string) => {
      navigateTo(path);
    };
    const handleOpenPath = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      if (typeof path !== 'string' || path.length === 0) return;
      try {
        if (localStorage.getItem('finder-pending-open-path') === path) {
          localStorage.removeItem('finder-pending-open-path');
        }
      } catch (error) {
        console.warn('[Finder] Could not clear the pending folder request:', error);
      }
      openHostPath(path);
    };

    try {
      const pendingPath = localStorage.getItem('finder-pending-open-path');
      if (pendingPath) {
        localStorage.removeItem('finder-pending-open-path');
        openHostPath(pendingPath);
      }
    } catch (error) {
      console.warn('[Finder] Could not read the pending folder request:', error);
    }

    window.addEventListener('finder:open-host-path', handleOpenPath);
    return () => window.removeEventListener('finder:open-host-path', handleOpenPath);
  }, [navigateTo]);

  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(pathHistory[historyIndex - 1]);
      setSelectedFileIds([]);
      setRenamingId(null);
      sound.playClick();
    }
  }, [historyIndex, pathHistory]);

  const handleForward = useCallback(() => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(pathHistory[historyIndex + 1]);
      setSelectedFileIds([]);
      setRenamingId(null);
      sound.playClick();
    }
  }, [historyIndex, pathHistory]);

  // Only direct children when not searching, and full path search when searching
  const currentFiles = useMemo(() => {
    const sourceFiles = isBrowsingLocal ? localFiles : filesState;
    let list = sourceFiles.filter((file: VirtualFile) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          file.name.toLowerCase().includes(q) ||
          file.type.toLowerCase().includes(q) ||
          file.extension?.toLowerCase().includes(q)
        );
      }
      return file.path === currentPath;
    });

    // Apply sorting
    list = [...list].sort((a, b) => {
      // Folders always first
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;

      let compareVal = 0;
      if (sortField === 'name') {
        compareVal = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'updatedAt') {
        compareVal = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      } else if (sortField === 'size') {
        compareVal = (a.size || 0) - (b.size || 0);
      } else if (sortField === 'type') {
        compareVal = a.type.localeCompare(b.type);
      }

      return sortOrder === 'asc' ? compareVal : -compareVal;
    });

    return list;
  }, [filesState, localFiles, isBrowsingLocal, currentPath, searchQuery, sortField, sortOrder]);
  const isApplicationsView = currentPath === '/Applications';
  const applicationResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const builtInApps = Object.values(APP_REGISTRY)
      .filter(app => app.installed)
      .filter(app => !query || `${app.name} ${app.category} ${app.description}`.toLowerCase().includes(query))
      .map(app => ({ kind: 'arlo' as const, id: app.id, name: app.name, description: app.description }));
    const personalApps = localApplications
      .filter(app => !query || `${app.name} ${app.path}`.toLowerCase().includes(query))
      .map(app => ({ kind: 'local' as const, id: app.path, name: app.name, description: app.path, iconUrl: app.iconUrl }));
    return [...builtInApps, ...personalApps];
  }, [localApplications, searchQuery]);

  const selectedFiles = useMemo(() => {
    const sourceFiles = isBrowsingLocal ? localFiles : filesState;
    return sourceFiles.filter(f => selectedFileIds.includes(f.id));
  }, [filesState, localFiles, isBrowsingLocal, selectedFileIds]);

  const primarySelectedFile = selectedFiles[0] || null;
  const contextFile = contextMenu.fileId
    ? currentFiles.find(file => file.id === contextMenu.fileId) ||
      filesState.find(file => file.id === contextMenu.fileId) ||
      null
    : null;
  const contextFileIsDriveRoot = !!contextFile?.hostPath && /^[a-z]:\\?$/i.test(contextFile.hostPath);
  const browsingDriveList = currentPath === 'local://drives';

  const refreshCurrentLocalFiles = async () => {
    if (!window.electronAPI?.listLocalFolder || !isBrowsingLocal) return;
    const entries = await window.electronAPI.listLocalFolder(currentPath);
    setLocalFiles(await mapLocalFolderEntries(entries, currentPath));
  };

  // Auto focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Handle open file in correct app
  const recordOpenedFile = (file: VirtualFile) => {
    void recordActivity({
      category: 'file',
      title: file.type === 'folder' ? 'Opened folder' : 'Opened file',
      details: file.name,
      context: {
        appId: 'finder',
        appName: 'Finder',
        itemName: file.name,
        itemType: file.type,
      },
    });
  };

  const addLocalApplication = async () => {
    try {
      if (!window.electronAPI?.chooseLocalApplication) {
        throw new Error('Adding desktop applications requires the installed ARLO OS desktop app.');
      }
      const result = await window.electronAPI.chooseLocalApplication();
      if (result.canceled || !result.application) return;
      setLocalApplications(current => [
        result.application!,
        ...current.filter(item => item.path.toLowerCase() !== result.application!.path.toLowerCase()),
      ]);
      addNotification({
        appId: 'finder',
        title: 'Application added',
        message: `${result.application.name} is now available in Applications.`,
        type: 'system',
      });
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: 'Could not add application',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  const openApplicationShortcut = async (application: (typeof applicationResults)[number]) => {
    if (application.kind === 'arlo') {
      openApp(application.id);
      return;
    }
    try {
      if (!window.electronAPI?.openLocalPath) {
        throw new Error('Opening local applications requires the installed ARLO OS desktop app.');
      }
      await window.electronAPI.openLocalPath(application.id);
      sound.playClick();
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: `Unable to open ${application.name}`,
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  const removeLocalApplication = (applicationPath: string) => {
    setLocalApplications(current => current.filter(application => application.path !== applicationPath));
  };

  const openInCodeStudio = (file: VirtualFile, content = file.content || '') => {
    const request = {
      name: file.name,
      content,
      path: file.hostPath || `${file.path}/${file.name}`,
      vfsFileId: file.hostPath ? undefined : file.id,
    };
    try {
      localStorage.setItem('code-studio-pending-open-file', JSON.stringify(request));
      recordOpenedFile(file);
      openApp('codestudio');
      window.dispatchEvent(new CustomEvent('code-studio:open-file', { detail: request }));
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: 'Unable to open in Code Studio',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  const openCodeFile = async (file: VirtualFile) => {
    if (!file.hostPath || !window.electronAPI?.openLocalCodeFile) {
      if (!file.hostPath) {
        openInCodeStudio(file);
        return;
      }
      try {
        if (window.electronAPI?.openLocalPath) {
          await window.electronAPI.openLocalPath(file.hostPath);
          recordOpenedFile(file);
        }
        addNotification({
          appId: 'finder',
          title: 'Opened with your default app',
          message: 'Update and restart ARLO OS to enable VS Code detection and Code Studio fallback.',
          type: 'system',
        });
      } catch (error) {
        addNotification({
          appId: 'finder',
          title: 'Unable to open code file',
          message: error instanceof Error ? error.message : String(error),
          type: 'system',
        });
      }
      return;
    }
    try {
      const result = await window.electronAPI.openLocalCodeFile(file.hostPath);
      if (!result.opened) openInCodeStudio(file, result.content || '');
      else recordOpenedFile(file);
    } catch (error) {
      try {
        await window.electronAPI.openLocalPath(file.hostPath);
        recordOpenedFile(file);
        addNotification({
          appId: 'finder',
          title: 'Opened with your default app',
          message: 'The VS Code/Code Studio bridge is missing. Rebuild and restart ARLO OS to enable its editor integration.',
          type: 'system',
        });
      } catch (fallbackError) {
        addNotification({
          appId: 'finder',
          title: 'Unable to open code file',
          message: fallbackError instanceof Error
            ? fallbackError.message
            : error instanceof Error ? error.message : String(error),
          type: 'system',
        });
      }
    }
  };

  const handleOpenFile = (file: VirtualFile) => {
    sound.playClick();
    if (file.type === 'folder') {
      if (file.hostPath) {
        navigateTo(file.hostPath);
      } else {
        setQuickLookFile(file);
        recordOpenedFile(file);
      }
    } else if (file.type === 'code') {
      if (file.hostPath) void openCodeFile(file);
      else {
        setQuickLookFile(file);
        recordOpenedFile(file);
      }
    } else if (file.type === 'image' && file.hostPath) {
      void openFinderImage(file)
        .then(() => recordOpenedFile(file))
        .catch(error => {
          addNotification({
            appId: 'finder',
            title: 'Unable to preview image',
            message: error instanceof Error ? error.message : String(error),
            type: 'system',
          });
        });
    } else if (file.extension?.toLowerCase() === 'pdf' && file.hostPath && window.electronAPI?.getMediaUrl) {
      void window.electronAPI.getMediaUrl(file.hostPath)
        .then(previewUrl => {
          setQuickLookFile({ ...file, previewUrl });
          recordOpenedFile(file);
        })
        .catch(error => {
          addNotification({
            appId: 'finder',
            title: 'Unable to preview PDF',
            message: error instanceof Error ? error.message : String(error),
            type: 'system',
          });
        });
    } else if (file.hostPath) {
      if (!window.electronAPI?.openLocalPath) {
        addNotification({
          appId: 'finder',
          title: 'Desktop app update required',
          message: 'Restart or reinstall the latest ARLO OS build to open local files.',
          type: 'system',
        });
        return;
      }
      void window.electronAPI.openLocalPath(file.hostPath)
        .then(() => recordOpenedFile(file))
        .catch(error => {
          addNotification({
            appId: 'finder',
            title: 'Unable to open item',
            message: error instanceof Error ? error.message : String(error),
            type: 'system',
          });
        });
    } else {
      openVirtualFile(file, openApp, setQuickLookFile);
      recordOpenedFile(file);
    }
  };

  const handleFileDragStart = (event: React.DragEvent, file: VirtualFile) => {
    const draggedFiles = selectedFileIds.includes(file.id)
      ? selectedFiles
      : [file];
    event.dataTransfer.setData(
      'application/x-abhishek-os-items',
      JSON.stringify({
        items: draggedFiles.map(({ id, hostPath, name, type, size, extension }) => ({
          id,
          hostPath,
          name,
          type,
          size,
          extension,
        })),
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const moveDraggedItems = async (transfer: DataTransfer, destinationPath: string, destinationIsLocal: boolean) => {
    const payload = transfer.getData('application/x-abhishek-os-items');
    if (!payload) return false;

    let items: Array<{ id: string; hostPath?: string }>;
    try {
      const parsed: unknown = JSON.parse(payload);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('items' in parsed) ||
        !Array.isArray(parsed.items)
      ) {
        throw new Error('The dragged item information is invalid.');
      }
      items = parsed.items.filter((item): item is { id: string; hostPath?: string } =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item && typeof item.id === 'string' &&
        (!('hostPath' in item) || typeof item.hostPath === 'string'),
      );
      if (items.length !== parsed.items.length || items.length === 0) {
        throw new Error('One or more dragged items could not be identified.');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'The dragged item information is invalid.');
    }

    if (destinationIsLocal) {
      const paths = items.flatMap(item => item.hostPath ? [item.hostPath] : []);
      if (paths.length !== items.length || !window.electronAPI?.transferLocalEntries) {
        throw new Error('Move between ARLO Drive and PC folders is not supported. Copy files between locations instead.');
      }
      await window.electronAPI.transferLocalEntries(paths, destinationPath, true);
      await refreshCurrentLocalFiles();
    } else {
      const fileIds = items.flatMap(item =>
        !item.hostPath && vfs.getFileById(item.id) ? [item.id] : [],
      );
      if (fileIds.length !== items.length) {
        throw new Error('Move between PC folders and ARLO Drive is not supported. Copy files between locations instead.');
      }
      const result = vfs.moveFiles(fileIds, destinationPath);
      if (result.error) throw new Error(result.error);
      refreshFiles();
    }

    sound.playClick();
    setSelectedFileIds([]);
    addNotification({
      appId: 'finder',
      title: 'Items moved',
      message: `${items.length} ${items.length === 1 ? 'item was' : 'items were'} moved to ${destinationPath.split(/[\\/]+/).filter(Boolean).pop() || 'this folder'}.`,
      type: 'system',
    });
    return true;
  };

  const handleFinderDrop = async (event: React.DragEvent, destinationPath: string, destinationIsLocal: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOverFinder(false);
    setDragOverFolderId(null);
    try {
      const moved = await moveDraggedItems(event.dataTransfer, destinationPath, destinationIsLocal);
      if (moved) return;
      if (event.dataTransfer.files.length > 0) {
        if (destinationIsLocal) {
          addNotification({
            appId: 'finder',
            title: 'Drop into an authorized folder',
            message: 'Files from other apps can be imported into ARLO Drive. To move PC files, drag them from a connected Finder folder.',
            type: 'system',
          });
          return;
        }
        await importLocalFiles(event.dataTransfer.files, destinationPath);
        refreshFiles();
      }
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: 'Could not move items',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  const pasteHostClipboard = async () => {
    if (!hostClipboard || !window.electronAPI?.transferLocalEntries) return;
    try {
      const pasted = await window.electronAPI.transferLocalEntries(
        hostClipboard.paths,
        currentPath,
        hostClipboard.move,
      );
      if (hostClipboard.move) setHostClipboard(null);
      await refreshCurrentLocalFiles();
      setSelectedFileIds(pasted.map(filePath => `host:${filePath}`));
      addNotification({
        appId: 'finder',
        title: 'Finder',
        message: `${pasted.length} item(s) ${hostClipboard.move ? 'moved' : 'copied'} successfully`,
        type: 'system',
      });
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: 'Paste failed',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  // Keyboard Shortcuts for Finder
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is currently typing in an input/modal, skip global hotkeys
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          setRenamingId(null);
        }
        return;
      }

      if (showKeyboardShortcuts) {
        if (e.key === 'Escape') setShowKeyboardShortcuts(false);
        return;
      }

      if (e.metaKey && e.code === 'Enter') return;
      if (e.key === 'Escape') {
        setSelectedFileIds([]);
        setSearchQuery('');
        return;
      }

      if (isBrowsingLocal && (e.key === 'Delete' || e.key === 'Backspace')) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;

      if (e.code === 'F1' || e.key === '?') {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }

      if ((isMod && e.code === 'KeyF') || (e.code === 'Slash' && !isMod)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.code === 'F5') {
        e.preventDefault();
        if (isBrowsingLocal) void refreshCurrentLocalFiles();
        else refreshFiles();
        return;
      }

      if (isMod && e.code === 'KeyI') {
        e.preventDefault();
        setShowInspector(value => !value);
        return;
      }

      if (e.altKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
        return;
      }

      if (e.altKey && e.code === 'ArrowRight') {
        e.preventDefault();
        handleForward();
        return;
      }

      // Select All: Cmd/Ctrl + A
      if (isMod && e.code === 'KeyA') {
        e.preventDefault();
        setSelectedFileIds(currentFiles.map(f => f.id));
        sound.playClick();
        return;
      }

      // Copy: Cmd/Ctrl + C
      if (isMod && e.code === 'KeyC') {
        if (selectedFileIds.length > 0) {
          e.preventDefault();
          if (isBrowsingLocal) {
            const paths = selectedFiles.flatMap(file =>
              file.hostPath && !/^[a-z]:\\?$/i.test(file.hostPath) ? [file.hostPath] : []
            );
            if (paths.length) setHostClipboard({ paths, move: false });
          } else {
            vfs.copyFiles(selectedFileIds);
          }
          sound.playClick();
          addNotification({
            appId: 'finder',
            title: 'Finder',
            message: `Copied ${selectedFileIds.length} item(s) to clipboard`,
            type: 'system',
          });
        }
        return;
      }

      // Cut: Cmd/Ctrl + X
      if (isMod && e.code === 'KeyX') {
        if (selectedFileIds.length > 0) {
          e.preventDefault();
          if (isBrowsingLocal) {
            const paths = selectedFiles.flatMap(file =>
              file.hostPath && !/^[a-z]:\\?$/i.test(file.hostPath) ? [file.hostPath] : []
            );
            if (paths.length) setHostClipboard({ paths, move: true });
          } else {
            vfs.cutFiles(selectedFileIds);
          }
          sound.playClick();
          addNotification({
            appId: 'finder',
            title: 'Finder',
            message: `Cut ${selectedFileIds.length} item(s) to clipboard`,
            type: 'system',
          });
        }
        return;
      }

      // Paste: Cmd/Ctrl + V
      if (isMod && e.code === 'KeyV') {
        e.preventDefault();
        if (isBrowsingLocal) {
          void pasteHostClipboard();
          return;
        }
        const pasted = vfs.paste(currentPath);
        if (pasted.length > 0) {
          sound.playClick();
          refreshFiles();
          setSelectedFileIds(pasted.map(f => f.id));
          addNotification({
            appId: 'finder',
            title: 'Finder',
            message: `Pasted ${pasted.length} item(s) into ${currentPath.split('/').pop() || 'folder'}`,
            type: 'system',
          });
        }
        return;
      }

      // Duplicate: Cmd/Ctrl + D
      if (isMod && e.code === 'KeyD') {
        if (isBrowsingLocal) return;
        if (primarySelectedFile) {
          e.preventDefault();
          const dup = vfs.duplicate(primarySelectedFile.id);
          if (dup) {
            sound.playClick();
            refreshFiles();
            setSelectedFileIds([dup.id]);
          }
        }
        return;
      }

      // Delete / Move to Trash: Delete, Backspace, or Cmd+Backspace
      if (e.code === 'Delete' || (isMod && e.code === 'Backspace') || e.code === 'Backspace') {
        if (selectedFiles.length > 0) {
          e.preventDefault();
          void trashFinderFiles(selectedFiles);
        }
        return;
      }

      // Quick Look: Space
      if (e.code === 'Space') {
        if (primarySelectedFile) {
          e.preventDefault();
          setQuickLookFile(primarySelectedFile);
        }
        return;
      }

      // Open selected item: Enter
      if (e.code === 'Enter') {
        if (primarySelectedFile) {
          e.preventDefault();
          handleOpenFile(primarySelectedFile);
        }
        return;
      }

      // Rename: F2
      if (e.code === 'F2') {
        if (primarySelectedFile) {
          e.preventDefault();
          setRenamingId(primarySelectedFile.id);
          setRenameValue(primarySelectedFile.name);
        }
        return;
      }

      // New Folder: Cmd/Ctrl + Shift + N
      if (isMod && e.shiftKey && e.code === 'KeyN') {
        e.preventDefault();
        setNewFolderName('New Folder');
        setShowNewFolderModal(true);
        return;
      }

      // New File: Cmd/Ctrl + N
      if (isMod && !e.shiftKey && e.code === 'KeyN') {
        e.preventDefault();
        setNewFileName('Untitled');
        setNewFileExtension('txt');
        setNewFileType('document');
        setShowNewFileModal(true);
        return;
      }

      // Arrow navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        if (currentFiles.length === 0) return;
        const currentIndex = currentFiles.findIndex(f => f.id === selectedFileIds[0]);
        let nextIndex = 0;
        if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
          nextIndex = currentIndex < currentFiles.length - 1 ? currentIndex + 1 : 0;
        } else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentFiles.length - 1;
        }
        setSelectedFileIds([currentFiles[nextIndex].id]);
        sound.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFiles, selectedFileIds, selectedFiles, primarySelectedFile, currentPath, addNotification, setQuickLookFile, isBrowsingLocal, hostClipboard, trashFinderFiles, showKeyboardShortcuts, handleBack, handleForward]);

  // Confirm rename
  const handleSaveRename = () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const file = currentFiles.find(item => item.id === renamingId);
    if (file?.name === renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    if (file?.hostPath && window.electronAPI?.renameLocalEntry) {
      void window.electronAPI.renameLocalEntry(file.hostPath, renameValue.trim())
        .then(() => refreshCurrentLocalFiles())
        .then(() => {
          sound.playClick();
          setRenamingId(null);
        })
        .catch(error => addNotification({
          appId: 'finder',
          title: 'Rename failed',
          message: error instanceof Error ? error.message : String(error),
          type: 'system',
        }));
      return;
    }
    vfs.rename(renamingId, renameValue.trim());
    sound.playClick();
    refreshFiles();
    setRenamingId(null);
  };

  // Create new file
  const handleCreateNewFile = () => {
    const rawName = newFileName.trim() || 'Untitled';
    const finalName = rawName.includes('.') ? rawName : `${rawName}.${newFileExtension}`;
    const ext = finalName.split('.').pop() || newFileExtension;
    if (isBrowsingLocal && window.electronAPI?.createLocalEntry) {
      void window.electronAPI.createLocalEntry(currentPath, finalName, false)
        .then(() => refreshCurrentLocalFiles())
        .then(() => {
          setShowNewFileModal(false);
          setNewFileName('');
          sound.playClick();
        })
        .catch(error => addNotification({
          appId: 'finder',
          title: 'File creation failed',
          message: error instanceof Error ? error.message : String(error),
          type: 'system',
        }));
      return;
    }
    const created = vfs.createFile(finalName, currentPath, newFileType, '', ext);
    refreshFiles();
    setSelectedFileIds([created.id]);
    setShowNewFileModal(false);
    setNewFileName('');
    sound.playClick();
    addNotification({
      appId: 'finder',
      title: 'File Created',
      message: `Created "${finalName}" successfully`,
      type: 'system',
    });
  };

  // Create new folder
  const handleCreateNewFolder = () => {
    const name = newFolderName.trim() || 'Untitled Folder';
    if (isBrowsingLocal && window.electronAPI?.createLocalEntry) {
      void window.electronAPI.createLocalEntry(currentPath, name, true)
        .then(() => refreshCurrentLocalFiles())
        .then(() => {
          setShowNewFolderModal(false);
          sound.playClick();
        })
        .catch(error => addNotification({
          appId: 'finder',
          title: 'Folder creation failed',
          message: error instanceof Error ? error.message : String(error),
          type: 'system',
        }));
      return;
    }
    const created = vfs.createFolder(name, currentPath);
    refreshFiles();
    setSelectedFileIds([created.id]);
    setShowNewFolderModal(false);
    setNewFolderName('');
    sound.playClick();
    addNotification({
      appId: 'finder',
      title: 'Folder Created',
      message: `Created folder "${name}"`,
      type: 'system',
    });
  };

  // Context menu actions
  const handleContextMenu = (e: React.MouseEvent, fileId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileId && !selectedFileIds.includes(fileId)) {
      setSelectedFileIds([fileId]);
    }
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      fileId,
    });
    setContextSubmenu(null);
  };

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    setContextSubmenu(null);
  };

  const copyPath = async (file: VirtualFile) => {
    const target = file.hostPath || `${file.path}/${file.name}`;
    await copyText(target);
    addNotification({ appId: 'finder', title: 'Path copied', message: file.name, type: 'system' });
  };

  const copyText = async (target: string) => {
    if (window.electronAPI?.writeClipboardText) {
      await window.electronAPI.writeClipboardText(target);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(target);
    } else {
      throw new Error('Clipboard access is unavailable.');
    }
  };

  const toggleFinderFavorite = (file: VirtualFile) => {
    if (file.hostPath) {
      setFavoriteHostPaths(current =>
        current.some(item => item.path === file.hostPath)
          ? current.filter(item => item.path !== file.hostPath)
          : [...current, {
              path: file.hostPath!,
              name: file.name,
              isDirectory: file.type === 'folder',
            }]
      );
      return;
    }
    vfs.toggleFavorite(file.id);
    refreshFiles();
  };

  async function trashFinderFiles(requestedFiles: VirtualFile[]) {
    const filesToTrash = requestedFiles.filter(file => file.type !== 'app');
    if (filesToTrash.length === 0) {
      addNotification({
        appId: 'finder',
        title: 'Cannot move app icons to Trash',
        message: 'System and application icons are protected.',
        type: 'system',
      });
      return;
    }
    const names = filesToTrash.map(file => file.name).join(', ');
    if (!window.confirm(`Move ${names} to the app Trash?`)) return;

    const failures: string[] = [];
    let movedCount = 0;
    for (const file of filesToTrash) {
      try {
        if (file.hostPath) {
          if (!window.electronAPI?.trashLocalEntry) {
            throw new Error('Local file deletion is unavailable. Update and restart ARLO OS.');
          }
          await window.electronAPI.trashLocalEntry(file.hostPath);
        } else if (!vfs.moveToTrash(file.id)) {
          throw new Error('This item is no longer available.');
        }
        movedCount += 1;
      } catch (error) {
        failures.push(`${file.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    refreshFiles();
    if (filesToTrash.some(file => file.hostPath)) {
      try {
        await refreshCurrentLocalFiles();
      } catch (error) {
        failures.push(error instanceof Error ? error.message : String(error));
      }
    }
    setSelectedFileIds([]);
    if (movedCount > 0) sound.playTrash();
    if (failures.length > 0) {
      addNotification({
        appId: 'finder',
        title: movedCount > 0 ? 'Some items could not be moved to Trash' : 'Unable to move items to Trash',
        message: failures.join('; '),
        type: 'system',
      });
    } else if (movedCount > 0) {
      addNotification({
        appId: 'finder',
        title: 'Moved to Trash',
        message: `${movedCount} item${movedCount === 1 ? '' : 's'} moved to the app Trash.`,
        type: 'system',
      });
    }
  }

  const deleteFinderFile = async (file: VirtualFile) => {
    await trashFinderFiles([file]);
  };

  const openFinderImage = async (file: VirtualFile, asWallpaper = false) => {
    let previewUrl = file.previewUrl;
    if (!previewUrl && file.hostPath) {
      if (!window.electronAPI?.getMediaUrl) {
        if (window.electronAPI?.openLocalPath) {
          await window.electronAPI.openLocalPath(file.hostPath);
          return;
        }
        throw new Error('Image preview is unavailable. Update and restart ARLO OS.');
      }
      try {
        previewUrl = await window.electronAPI.getMediaUrl(file.hostPath);
      } catch (error) {
        if (window.electronAPI?.openLocalPath) {
          await window.electronAPI.openLocalPath(file.hostPath);
          return;
        }
        throw error;
      }
    }
    if (!previewUrl) throw new Error('This image has no preview data.');
    if (asWallpaper) uploadCustomWallpaper(previewUrl, file.name);
    else setQuickLookFile({ ...file, previewUrl });
  };

  const openImageFilmstrip = async (file: VirtualFile, playing = false) => {
    const images = currentFiles.filter(item => item.type === 'image');
    if (!images.some(item => item.id === file.id)) images.unshift(file);
    const withPreviews = await Promise.all(images.map(async item => {
      if (item.previewUrl) return item;
      if (item.hostPath && window.electronAPI?.getMediaUrl) {
        return { ...item, previewUrl: await window.electronAPI.getMediaUrl(item.hostPath) };
      }
      return null;
    }));
    const files = withPreviews.filter((item): item is VirtualFile => !!item?.previewUrl);
    if (!files.length) throw new Error('No image previews are available in this folder.');
    const index = Math.max(0, files.findIndex(item => item.id === file.id));
    setImageFilmstrip({ files, index, playing });
  };

  const stepImageFilmstrip = (direction: 1 | -1) => {
    setImageSlideDirection(direction);
    setImageFilmstrip(current => current
      ? { ...current, index: (current.index + direction + current.files.length) % current.files.length }
      : null);
  };

  useEffect(() => {
    if (!imageFilmstrip) return;
    const handleFilmstripKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopImmediatePropagation();
        stepImageFilmstrip(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopImmediatePropagation();
        stepImageFilmstrip(1);
      }
    };
    window.addEventListener('keydown', handleFilmstripKey, true);
    return () => window.removeEventListener('keydown', handleFilmstripKey, true);
  }, [imageFilmstrip?.files.length]);

  useEffect(() => {
    filmstripThumbsRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [imageFilmstrip?.index]);

  useEffect(() => {
    if (!imageFilmstrip?.playing || imageFilmstrip.files.length < 2) return;
    const timer = window.setInterval(() => {
      setImageSlideDirection(1);
      setImageFilmstrip(current => current
        ? { ...current, index: (current.index + 1) % current.files.length }
        : null);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [imageFilmstrip?.playing, imageFilmstrip?.files.length]);

  const getMediaBlob = async (file: VirtualFile) => {
    if (!file.hostPath) return vfs.readMedia(file);
    const previewUrl = file.previewUrl || await window.electronAPI?.getMediaUrl?.(file.hostPath);
    if (!previewUrl) throw new Error('Media preview is unavailable for this file.');
    const response = await fetch(previewUrl);
    if (!response.ok) throw new Error(`Could not read "${file.name}".`);
    return response.blob();
  };

  const saveMediaIntoApp = async (file: VirtualFile, destination: string) => {
    if (file.type !== 'image' && file.type !== 'video' && file.type !== 'audio') {
      throw new Error('Only image, video, or audio files can be saved to the app library.');
    }
    const targetPath = destination.startsWith('/Users/abhishek/')
      ? destination
      : '/Users/abhishek/Pictures';
    vfs.ensureDirectoryExists(targetPath);
    const copy = await vfs.importBlob(await getMediaBlob(file), file.name, targetPath, file.type);
    refreshFiles();
    setSelectedFileIds([copy.id]);
    addNotification({
      appId: 'finder',
      title: 'Saved in ARLO OS',
      message: `${file.name} was saved in ${targetPath.replace('/Users/abhishek/', '')}.`,
      type: 'system',
    });
    setSaveToAppFile(null);
  };

  const copyImage = async (file: VirtualFile) => {
    const blob = await getMediaBlob(file);
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new Error('Image clipboard is not available in this browser. Use Save to ARLO OS instead.');
    }
    const clipboardType = blob.type === 'image/png' ? 'image/png' : 'image/png';
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the image for copying.');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not encode the image for copying.')), clipboardType);
    });
    await navigator.clipboard.write([new ClipboardItem({ [pngBlob.type]: pngBlob })]);
  };

  const shareMedia = async (file: VirtualFile) => {
    const blob = await getMediaBlob(file);
    if (!navigator.share) throw new Error('Sharing is not supported by this device.');
    const sharedFile = new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
    if (navigator.canShare && !navigator.canShare({ files: [sharedFile] })) {
      throw new Error('This device cannot share this file type.');
    }
    await navigator.share({ files: [sharedFile], title: file.name });
  };

  const printImage = async (file: VirtualFile) => {
    const blob = await getMediaBlob(file);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare image for printing.'));
      reader.onerror = () => reject(reader.error || new Error('Could not prepare image for printing.'));
      reader.readAsDataURL(blob);
    });
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Allow pop-ups to print this image.');
    printWindow.opener = null;
    printWindow.document.title = file.name;
    const style = printWindow.document.createElement('style');
    style.textContent = 'html,body{margin:0;height:100%;display:grid;place-items:center}img{max-width:100%;max-height:100%;object-fit:contain}@media print{img{max-width:100%;max-height:100vh}}';
    const image = printWindow.document.createElement('img');
    image.alt = file.name;
    image.onload = () => printWindow.print();
    image.src = dataUrl;
    printWindow.document.head.append(style);
    printWindow.document.body.append(image);
  };

  const resizeImage = async (file: VirtualFile) => {
    const image = await createImageBitmap(await getMediaBlob(file));
    const widthInput = window.prompt('New image width in pixels', String(image.width));
    if (!widthInput) {
      image.close();
      return;
    }
    const width = Number(widthInput);
    const heightInput = window.prompt('New image height in pixels', String(Math.max(1, Math.round(image.height * width / image.width))));
    if (!heightInput) {
      image.close();
      return;
    }
    const height = Number(heightInput);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 12000 || height > 12000) {
      image.close();
      throw new Error('Image dimensions must be between 1 and 12,000 pixels.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      image.close();
      throw new Error('Could not resize the selected image.');
    }
    context.drawImage(image, 0, 0, width, height);
    image.close();
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not export the resized image.')), 'image/jpeg', 0.9);
    });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    await vfs.importBlob(blob, `${baseName}-${width}x${height}.jpg`, '/Users/abhishek/Pictures', 'image');
    refreshFiles();
    addNotification({ appId: 'finder', title: 'Image resized', message: 'The resized image was saved in Pictures.', type: 'system' });
  };

  const setImageAsLockWallpaper = async (file: VirtualFile) => {
    const url = file.previewUrl || (file.hostPath ? await window.electronAPI?.getMediaUrl?.(file.hostPath) : undefined);
    if (!url) throw new Error('Image preview is unavailable.');
    setLockScreenWallpaper(await imageUrlToLockWallpaper(url));
    addNotification({ appId: 'finder', title: 'Lock screen updated', message: 'The lock screen background was changed. Its blur effect is unchanged.', type: 'system' });
  };

  const contextAction = async (action: () => void | Promise<void>) => {
    closeContextMenu();
    try {
      await action();
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: 'Finder action failed',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  // Close context menu on any global click
  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-finder-context-menu]')
      ) return;
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
      if (showSortDropdown) {
        setShowSortDropdown(false);
      }
    };
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [contextMenu.visible, showSortDropdown]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '--';
    if (bytes > 1000000) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const getFileIcon = (file: VirtualFile) => {
    if (file.hostPath && /^[a-z]:\\?$/i.test(file.hostPath)) {
      return <AppIcon assetId="pcdrive" className="h-14 w-14 object-contain" />;
    }
    if (file.type === 'folder') return <Folder className="w-10 h-10 text-sky-400 fill-sky-400/20" />;
    switch (file.type) {
      case 'image':
        return <ImageIcon className="w-10 h-10 text-purple-400" />;
      case 'code':
        return <Code2 className="w-10 h-10 text-indigo-400" />;
      case 'audio':
        return <Music className="w-10 h-10 text-emerald-400" />;
      case 'video':
        return <Film className="w-10 h-10 text-rose-400" />;
      default:
        return <FileText className="w-10 h-10 text-slate-300" />;
    }
  };

  // Clickable path segments
  const pathSegments = useMemo(() => {
    if (currentPath === 'local://drives') {
      return [{ label: 'This PC', fullPath: 'local://drives' }];
    }

    if (isBrowsingLocal) {
      const parts = currentPath.split(/[\\/]+/).filter(Boolean);
      const crumbs: { label: string; fullPath: string }[] = [];
      let accum = parts[0]?.endsWith(':') ? `${parts[0]}\\` : '';
      parts.forEach((part, index) => {
        accum = index === 0 ? accum || part : `${accum.replace(/[\\/]$/, '')}\\${part}`;
        crumbs.push({ label: part, fullPath: accum });
      });
      return crumbs;
    }

    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ label: 'Macintosh HD', fullPath: '/Users/abhishek' }];
    let accum = '';
    for (const part of parts) {
      accum += `/${part}`;
      if (accum === '/Users/abhishek') continue;
      crumbs.push({ label: part === 'Users' ? 'Users' : part === 'abhishek' ? 'abhishek' : part, fullPath: accum });
    }
    return crumbs;
  }, [currentPath, isBrowsingLocal]);

  const hasVirtualClipboard = !!vfs.getClipboard() && vfs.getClipboard()!.ids.length > 0;
  const hasClipboard = isBrowsingLocal ? !!hostClipboard : hasVirtualClipboard;
  const contextItem = (
    label: string,
    icon: React.ReactNode,
    action: () => void | Promise<void>,
    danger = false,
  ) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => void contextAction(action)}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
        danger ? 'text-rose-300 hover:bg-rose-500/15' : 'text-slate-200 hover:bg-white/10'
      }`}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-sky-300">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
  const contextDivider = <div className="my-1 h-px bg-white/10" />;

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-slate-950 select-none overflow-hidden text-white font-sans text-xs relative"
      onClick={() => {
        setSelectedFileIds([]);
        setRenamingId(null);
      }}
      onContextMenu={e => handleContextMenu(e, null)}
    >
      {/* Hidden local file picker */}
      <input
        ref={localFileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async e => {
          if (e.target.files && e.target.files.length > 0) {
            await importLocalFiles(e.target.files, currentPath);
            refreshFiles();
          }
        }}
      />

      {/* Top Finder Navigation & Action Bar */}
      <div
        className="h-12 px-3 sm:px-4 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl flex items-center justify-between gap-2 overflow-x-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(prev => !prev)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 text-slate-300 disabled:pointer-events-none transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= pathHistory.length - 1}
            className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 text-slate-300 disabled:pointer-events-none transition-colors"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Breadcrumbs Path */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 ml-1 font-medium overflow-x-auto max-w-xs">
            {pathSegments.slice(-3).map((seg, idx, arr) => (
              <React.Fragment key={seg.fullPath}>
                <button
                  onClick={() => navigateTo(seg.fullPath)}
                  className="hover:text-white hover:underline truncate max-w-[100px]"
                >
                  {seg.label}
                </button>
                {idx < arr.length - 1 && <span className="text-slate-600">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* New File Button */}
          <button
            disabled={isBrowsingLocal || isApplicationsView}
            onClick={() => {
              setNewFileName('');
              setNewFileExtension('txt');
              setNewFileType('document');
              setShowNewFileModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            title="New File (Cmd+N / Ctrl+N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>

          {/* New Folder Button */}
          <button
            disabled={isBrowsingLocal || isApplicationsView}
            onClick={() => {
              setNewFolderName('New Folder');
              setShowNewFolderModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            title="New Folder (Cmd+Shift+N / Ctrl+Shift+N)"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Folder</span>
          </button>

          {/* Paste Button (Active if clipboard has content) */}
          {hasClipboard && (
            <button
              onClick={() => isBrowsingLocal
                ? void pasteHostClipboard()
                : (() => {
                    const pasted = vfs.paste(currentPath);
                    if (pasted.length > 0) {
                      sound.playClick();
                      refreshFiles();
                      setSelectedFileIds(pasted.map(file => file.id));
                    }
                  })()}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-medium flex items-center gap-1.5 transition-all"
              title="Paste (Cmd+V / Ctrl+V)"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Paste</span>
            </button>
          )}

          {/* Connect PC Disk */}
          <button
            onClick={async () => {
              if (window.electronAPI?.chooseLocalFolders) {
                const result = await window.electronAPI.chooseLocalFolders();
                setLocalFolders(result.folders);
              } else if ('showDirectoryPicker' in window) {
                await connectLocalDirectory(currentPath);
                refreshFiles();
              } else {
                localFileInputRef.current?.click();
              }
            }}
            className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold items-center gap-1.5 transition-all cursor-pointer"
            title="Connect your real PC Drive or Folder"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connect PC</span>
          </button>

          {/* Upload Button */}
          {!isBrowsingLocal && <label className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-medium flex items-center gap-1.5 cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Upload</span>
            <input
              type="file"
              multiple
              onChange={async e => {
                if (e.target.files && e.target.files.length > 0) {
                  await importLocalFiles(e.target.files, currentPath);
                  refreshFiles();
                }
              }}
              className="hidden"
            />
          </label>}

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(prev => !prev)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 flex items-center gap-1 border border-white/10"
              title="Sort items"
            >
              <SortAsc className="w-3.5 h-3.5" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-9 w-44 rounded-xl glass-panel bg-slate-900/95 border border-white/15 shadow-2xl p-1 z-50 text-xs">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sort By
                </div>
                {(['name', 'updatedAt', 'size', 'type'] as SortField[]).map(field => (
                  <button
                    key={field}
                    onClick={() => {
                      if (sortField === field) {
                        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setSortField(field);
                        setSortOrder('asc');
                      }
                      setShowSortDropdown(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between ${
                      sortField === field ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="capitalize">{field === 'updatedAt' ? 'Date' : field}</span>
                    {sortField === field && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/10 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${viewMode === 'grid' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white/20 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Inspector Toggle */}
          <button
            onClick={() => setShowInspector(prev => !prev)}
            className={`p-1.5 rounded-xl border border-white/10 ${
              showInspector ? 'bg-sky-500/30 text-sky-300 border-sky-400/40' : 'bg-white/10 hover:bg-white/15 text-slate-300'
            }`}
            title="Toggle Details Inspector"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowKeyboardShortcuts(true)}
            aria-label="Show Finder keyboard shortcuts"
            className="p-1.5 rounded-xl border border-white/10 bg-white/10 text-slate-300 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={isApplicationsView ? 'Search apps' : 'Search'}
              aria-label={isApplicationsView ? 'Search applications' : 'Search files'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  void recordActivity({
                    category: 'search',
                    title: 'Searched in Finder',
                    details: 'Search submitted',
                    context: {
                      appId: 'finder',
                      appName: 'Finder',
                      itemType: 'Search',
                    },
                  });
                }
              }}
              className="w-28 sm:w-36 md:w-44 py-1 pl-8 pr-2.5 rounded-xl bg-white/10 text-xs text-white placeholder:text-slate-400 outline-none border border-white/10 focus:border-sky-400 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar + Content + Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Finder Sidebar (Desktop + Mobile overlay) */}
        <div
          className={`w-52 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl p-3 flex flex-col justify-between flex-shrink-0 transition-transform duration-200 z-30 ${
            mobileSidebarOpen
              ? 'absolute inset-y-0 left-0 shadow-2xl translate-x-0'
              : 'hidden md:flex'
          }`}
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Favorites
              </span>
              {mobileSidebarOpen && (
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="md:hidden text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {sideNavItems.map(item => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      navigateTo(item.path);
                      if ('fileId' in item && item.fileId) {
                        setSelectedFileIds([item.fileId]);
                      }
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/20'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-sky-400" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            {localFolders.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {localFolders.some(folder => folder.isDriveRoot) ? 'Drives' : 'Connected folders'}
                </div>
                {localFolders.map(folder => (
                  <div key={folder.path} className="group flex items-center rounded-xl hover:bg-white/5">
                    <button
                      onClick={() => {
                        navigateTo(folder.path);
                        setMobileSidebarOpen(false);
                      }}
                      title={folder.path}
                      className={`min-w-0 flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${currentPath === folder.path ? 'bg-sky-500 text-white font-semibold' : 'text-slate-300 hover:text-white'}`}
                    >
                      <Folder className="w-4 h-4 shrink-0 text-emerald-300" />
                      <span className="truncate">{folder.label}</span>
                    </button>
                    {!folder.isDriveRoot && <button
                      type="button"
                      title={`Revoke access to ${folder.label}`}
                      aria-label={`Revoke access to ${folder.label}`}
                      onClick={async event => {
                        event.stopPropagation();
                        const remaining = await window.electronAPI?.removeLocalFolder?.(folder.path);
                        if (remaining) setLocalFolders(remaining);
                        if (currentPath.toLowerCase().startsWith(folder.path.toLowerCase())) {
                          navigateTo('/Users/abhishek');
                        }
                      }}
                      className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 opacity-0 transition-opacity hover:bg-rose-400/15 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>}
                  </div>
                ))}
                {localFolders.some(folder => folder.isDriveRoot) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const remaining = await window.electronAPI?.revokeAllDrives?.();
                      if (remaining) setLocalFolders(remaining);
                      navigateTo('/Users/abhishek');
                    }}
                    className="mt-1 w-full rounded-lg px-2.5 py-2 text-left text-[10px] text-rose-300 hover:bg-rose-400/10"
                  >
                    Revoke all-drive access
                  </button>
                )}
              </div>
            )}
            {!localFolders.some(folder => folder.isDriveRoot) && (
              <button
                onClick={async () => {
                  const drives = await window.electronAPI?.grantAllDrives?.();
                  if (drives?.length) {
                    setLocalFolders(drives);
                    navigateTo('local://drives');
                  }
                }}
                className="mt-2 w-full rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-2 text-left text-[10px] text-emerald-200 hover:bg-emerald-400/15"
              >
                Allow access to all drives
              </button>
            )}
            <button
              onClick={async () => {
                const result = await window.electronAPI?.chooseLocalFolders?.();
                if (result) setLocalFolders(result.folders);
              }}
              className="mt-2 w-full rounded-lg border border-dashed border-white/15 px-2.5 py-2 text-left text-[10px] text-slate-400 hover:border-emerald-300/40 hover:text-emerald-200"
            >
              + Connect folders
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>ARLO OS Drive</span>
            </div>
            <div className="text-[10px]">824 GB free of 1 TB</div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="w-1/5 h-full bg-sky-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Center File Grid / List Content */}
        <div
          onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.dataTransfer.types.includes('application/x-abhishek-os-items') && e.dataTransfer.types.includes('Files')) {
              setIsDraggingOverFinder(true);
            }
          }}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setIsDraggingOverFinder(false);
            }
          }}
          onDrop={e => void handleFinderDrop(e, currentPath, isBrowsingLocal)}
          className="flex-1 overflow-y-auto p-4 bg-slate-900/20 relative focus:outline-none"
        >
          {/* Drag & drop overlay */}
          {isDraggingOverFinder && !isBrowsingLocal && (
            <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-950/80 backdrop-blur-md flex flex-col items-center justify-center z-40 pointer-events-none">
              <Upload className="w-12 h-12 text-sky-400 animate-bounce mb-2" />
              <p className="text-base font-bold text-white">Drop files to import into {currentPath}</p>
              <p className="text-xs text-sky-200 mt-0.5">Supports images, audio, video, code, and documents</p>
            </div>
          )}

          {isApplicationsView ? (
            <div className="mx-auto max-w-6xl space-y-5 pb-6">
              <div className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-sky-500/[0.12] via-indigo-500/[0.08] to-transparent p-5 shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200 shadow-inner">
                    <AppWindow className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight text-white">Applications</h1>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-400">
                      Your ARLO OS apps, together with desktop apps you choose to add from connected folders.
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-slate-500">
                      {applicationResults.length} {applicationResults.length === 1 ? 'application' : 'applications'}
                      {localApplications.length > 0 ? ` · ${localApplications.length} from this PC` : ' · Add apps from this PC'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void addLocalApplication()}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-sky-300/25 bg-sky-400/15 px-4 text-xs font-semibold text-sky-100 shadow-lg shadow-sky-950/20 transition-all hover:-translate-y-0.5 hover:border-sky-200/50 hover:bg-sky-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  title="Choose an .exe or .lnk inside a Finder-connected folder"
                >
                  <Plus className="h-4 w-4" />
                  Add app from PC
                </button>
              </div>

              {applicationResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {applicationResults.map((application, index) => {
                    const metadata = application.kind === 'arlo' ? APP_REGISTRY[application.id] : undefined;
                    return (
                      <motion.div
                        key={`${application.kind}-${application.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.16) }}
                        whileHover={{ y: -3 }}
                        className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] shadow-lg shadow-black/10 transition-colors hover:border-sky-300/25 hover:bg-white/[0.055] hover:shadow-sky-950/20"
                      >
                        <button
                          type="button"
                          onClick={() => void openApplicationShortcut(application)}
                          title={`Open ${application.name}`}
                          className="flex min-h-36 w-full flex-col items-center justify-center gap-3 p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300"
                        >
                          <span
                            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-slate-900 shadow-xl transition-transform duration-200 group-hover:scale-105"
                            style={metadata ? { background: metadata.iconBg } : undefined}
                          >
                            {application.kind === 'arlo' ? (
                              <AppIcon
                                appId={application.id}
                                className="h-full w-full object-cover"
                                fallback={<AppWindow className="h-7 w-7 text-sky-200" />}
                              />
                            ) : application.iconUrl ? (
                              <img src={application.iconUrl} alt="" className="h-full w-full object-contain p-1" />
                            ) : (
                              <AppWindow className="h-7 w-7 text-sky-200" />
                            )}
                          </span>
                          <span className="w-full min-w-0">
                            <span className="block truncate text-xs font-semibold text-slate-100">{application.name}</span>
                            <span className="mt-1 block truncate text-[10px] text-slate-500">
                              {application.kind === 'arlo' ? metadata?.category : 'This PC'}
                            </span>
                          </span>
                        </button>
                        {application.kind === 'local' && (
                          <button
                            type="button"
                            onClick={() => removeLocalApplication(application.id)}
                            aria-label={`Remove ${application.name} from Finder`}
                            title="Remove from Finder"
                            className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-500 opacity-0 transition hover:bg-rose-400/15 hover:text-rose-200 focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
                  <Search className="mb-3 h-8 w-8 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-200">No applications match “{searchQuery}”</p>
                  <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">Clear the search to browse your apps, or add a desktop app from a Finder-connected folder.</p>
                </div>
              )}
            </div>
          ) : currentFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <Folder className="w-16 h-16 mb-3 opacity-20 text-sky-400" />
              <p className="text-sm font-semibold text-slate-300">This folder is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {isBrowsingLocal ? 'No items are currently in this folder.' : <>Click <strong>New File</strong>, <strong>Folder</strong>, or drag &amp; drop files from your computer to get started.</>}
              </p>
              {!isBrowsingLocal && <div className="flex gap-2 mt-4">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowNewFileModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create File</span>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowNewFolderModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Folder className="w-3.5 h-3.5 text-amber-400" />
                  <span>Create Folder</span>
                </button>
              </div>}
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {currentFiles.map(file => {
                const isSelected = selectedFileIds.includes(file.id);
                const isRenaming = renamingId === file.id;

                return (
                  <div
                    key={file.id}
                    draggable={!isRenaming}
                    onDragStart={event => handleFileDragStart(event, file)}
                    onDragOver={event => {
                      if (file.type !== 'folder') return;
                      event.preventDefault();
                      event.stopPropagation();
                      setDragOverFolderId(file.id);
                    }}
                    onDragLeave={event => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setDragOverFolderId(current => current === file.id ? null : current);
                      }
                    }}
                    onDrop={event => {
                      if (file.type !== 'folder') return;
                      const destinationPath = file.hostPath
                        ? file.hostPath
                        : `${file.path.replace(/\/+$/, '')}/${file.name}`.replace(/\/+/g, '/');
                      void handleFinderDrop(event, destinationPath, Boolean(file.hostPath));
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      if (e.metaKey || e.ctrlKey) {
                        setSelectedFileIds(prev =>
                          prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
                        );
                      } else {
                        setSelectedFileIds([file.id]);
                      }
                      sound.playClick();
                    }}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      if (file.type === 'image') void contextAction(() => openImageFilmstrip(file));
                      else handleOpenFile(file);
                    }}
                    onContextMenu={e => handleContextMenu(e, file.id)}
                    className={`group flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all duration-150 border relative ${
                      dragOverFolderId === file.id
                        ? 'bg-sky-500/25 border-sky-300 shadow-lg shadow-sky-950/30 text-white scale-[1.02]'
                        : isSelected
                        ? 'bg-sky-500/25 border-sky-400/80 shadow-lg text-white'
                        : 'border-transparent hover:bg-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {/* Thumbnail / Icon */}
                    <div className="w-16 h-16 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      {file.type === 'image' && file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="w-14 h-14 object-cover rounded-xl shadow-md border border-white/10"
                        />
                      ) : (
                        getFileIcon(file)
                      )}
                    </div>

                    {/* File Name / Inline Rename Input */}
                    {isRenaming ? (
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onClick={e => e.stopPropagation()}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleSaveRename}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="w-full text-center px-1.5 py-0.5 rounded bg-sky-900/90 border border-sky-400 text-xs text-white outline-none font-medium"
                      />
                    ) : (
                      <span className="text-xs font-medium text-center line-clamp-2 break-all max-w-full">
                        {file.name}
                      </span>
                    )}

                    <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {file.type === 'folder' ? 'Folder' : formatFileSize(file.size)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="w-full text-xs">
              <div className="grid grid-cols-12 pb-2 border-b border-white/10 text-slate-400 font-semibold px-2">
                <div className="col-span-6">Name</div>
                <div className="col-span-3">Date Modified</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-1">Kind</div>
              </div>
              <div className="divide-y divide-white/5">
                {currentFiles.map(file => {
                  const isSelected = selectedFileIds.includes(file.id);
                  const isRenaming = renamingId === file.id;

                  return (
                    <div
                      key={file.id}
                      draggable={!isRenaming}
                      onDragStart={event => handleFileDragStart(event, file)}
                      onDragOver={event => {
                        if (file.type !== 'folder') return;
                        event.preventDefault();
                        event.stopPropagation();
                        setDragOverFolderId(file.id);
                      }}
                      onDragLeave={event => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                          setDragOverFolderId(current => current === file.id ? null : current);
                        }
                      }}
                      onDrop={event => {
                        if (file.type !== 'folder') return;
                        const destinationPath = file.hostPath
                          ? file.hostPath
                          : `${file.path.replace(/\/+$/, '')}/${file.name}`.replace(/\/+/g, '/');
                        void handleFinderDrop(event, destinationPath, Boolean(file.hostPath));
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (e.metaKey || e.ctrlKey) {
                          setSelectedFileIds(prev =>
                            prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
                          );
                        } else {
                          setSelectedFileIds([file.id]);
                        }
                        sound.playClick();
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        if (file.type === 'image') void contextAction(() => openImageFilmstrip(file));
                        else handleOpenFile(file);
                      }}
                      onContextMenu={e => handleContextMenu(e, file.id)}
                      className={`grid grid-cols-12 py-2 px-2 items-center cursor-pointer rounded-xl transition-colors ${
                        dragOverFolderId === file.id ? 'bg-sky-500/25 text-white ring-1 ring-sky-300/70' : isSelected ? 'bg-sky-500/30 text-white font-medium' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="col-span-6 flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {file.hostPath && /^[a-z]:\\?$/i.test(file.hostPath) ? (
                            <AppIcon assetId="pcdrive" className="h-6 w-6 object-contain" />
                          ) : file.type === 'folder' ? (
                            <Folder className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                          ) : file.type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-purple-400" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-300" />
                          )}
                        </div>

                        {isRenaming ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setRenameValue(e.target.value)}
                            onBlur={handleSaveRename}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveRename();
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            className="px-1 py-0.5 rounded bg-sky-900 border border-sky-400 text-xs text-white outline-none font-medium"
                          />
                        ) : (
                          <span className="truncate">{file.name}</span>
                        )}
                      </div>
                      <div className="col-span-3 text-slate-400 truncate">
                        {new Date(file.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="col-span-2 font-mono text-slate-400 truncate">
                        {file.type === 'folder' ? '--' : formatFileSize(file.size)}
                      </div>
                      <div className="col-span-1 capitalize text-slate-400 truncate">{file.type}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Details Inspector Panel */}
        {showInspector && (
          <div
            className="w-64 border-l border-white/10 p-4 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between text-xs flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            {primarySelectedFile ? (
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-3 overflow-hidden shadow-lg">
                  {primarySelectedFile.type === 'image' && primarySelectedFile.previewUrl ? (
                    <img
                      src={primarySelectedFile.previewUrl}
                      alt={primarySelectedFile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(primarySelectedFile)
                  )}
                </div>
                <h4 className="font-bold text-white break-all">{primarySelectedFile.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                  {primarySelectedFile.type}
                </p>

                <div className="w-full mt-4 space-y-2 text-left bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size</span>
                    <span className="font-mono text-white">
                      {primarySelectedFile.type === 'folder' ? '--' : formatFileSize(primarySelectedFile.size)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Modified</span>
                    <span className="text-white">
                      {new Date(primarySelectedFile.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="text-white truncate max-w-[120px]" title={primarySelectedFile.path}>
                      {primarySelectedFile.path}
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-2 mt-4">
                  <button
                    onClick={() => handleOpenFile(primarySelectedFile)}
                    className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>
                  {!primarySelectedFile.hostPath && <button
                    onClick={() => setQuickLookFile(primarySelectedFile)}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quick Look</span>
                  </button>}
                  {primarySelectedFile.type !== 'app' && <button
                    onClick={() => void deleteFinderFile(primarySelectedFile)}
                    className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to App Trash</span>
                  </button>}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <Info className="w-10 h-10 mb-2 opacity-30 text-sky-400" />
                <p className="font-semibold text-slate-300">No Item Selected</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Select any file or folder to inspect its details and preview.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 px-4 bg-slate-900/90 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-shrink-0">
        <span>{currentFiles.length} items</span>
        <span>
          {primarySelectedFile
            ? `${primarySelectedFile.name} ${primarySelectedFile.type !== 'folder' ? `(${formatFileSize(primarySelectedFile.size)})` : ''}`
            : 'No selection'}
        </span>
      </div>

      {/* Custom Context Menu */}
      {contextMenu.visible && (
        <div
          onClick={e => e.stopPropagation()}
          data-finder-context-menu
          className="fixed z-[150] max-h-[min(75vh,560px)] w-64 overflow-y-auto rounded-xl border border-white/15 bg-slate-900/95 p-1.5 text-xs text-slate-200 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          style={{
            top: Math.max(8, Math.min(contextMenu.y, window.innerHeight - 420)),
            left: Math.max(8, Math.min(contextMenu.x, window.innerWidth - 280)),
          }}
          role="menu"
        >
          {contextFile ? (
            <div className="space-y-0.5">
              {contextItem('Open', <ExternalLink className="h-4 w-4" />, () => handleOpenFile(contextFile))}
              {contextFile.type === 'code' && contextItem(
                contextFile.hostPath ? 'Open with Code' : 'Open in Code Studio',
                <Code className="h-4 w-4" />,
                () => openCodeFile(contextFile),
              )}
              {contextFile.type === 'folder' && contextFile.hostPath &&
                !contextFileIsDriveRoot && contextItem(
                  'Open with Code',
                  <Code className="h-4 w-4" />,
                  async () => {
                    if (!window.electronAPI?.openLocalCodePath) throw new Error('VS Code integration is unavailable.');
                    const result = await window.electronAPI.openLocalCodePath(contextFile.hostPath!);
                    if (!result.opened) {
                      addNotification({
                        appId: 'finder',
                        title: 'VS Code not found',
                        message: 'Open a code file to edit it in Code Studio.',
                        type: 'system',
                      });
                    }
                  },
                )}
              {(!contextFile.hostPath || contextFile.type === 'image') && contextItem(
                'Quick Look',
                <Eye className="h-4 w-4" />,
                () => contextFile.type === 'image'
                  ? openFinderImage(contextFile)
                  : setQuickLookFile(contextFile),
              )}
              {(contextFile.type === 'image' || contextFile.type === 'video') && contextItem(
                'Save to ARLO OS…',
                <Save className="h-4 w-4" />,
                () => setSaveToAppFile(contextFile),
              )}
              {contextFile.type === 'image' && (
                <>
                  {contextItem('Share', <Share2 className="h-4 w-4" />, () => shareMedia(contextFile))}
                  {contextItem('Print', <Printer className="h-4 w-4" />, () => printImage(contextFile))}
                  {contextItem('Resize image', <ImageIcon className="h-4 w-4" />, () => resizeImage(contextFile))}
                  {contextItem('Set as lock screen', <LockKeyhole className="h-4 w-4" />, () => setImageAsLockWallpaper(contextFile))}
                  {contextItem('Show filmstrip', <Film className="h-4 w-4" />, () => openImageFilmstrip(contextFile))}
                  {contextItem('Start slideshow', <Play className="h-4 w-4" />, () => openImageFilmstrip(contextFile, true))}
                </>
              )}
              {contextDivider}
              {!contextFile.hostPath && contextItem(
                'Cut',
                <Scissors className="h-4 w-4" />,
                () => {
                  vfs.cutFiles([contextFile.id]);
                  addNotification({ appId: 'finder', title: 'Finder', message: 'Item cut to clipboard', type: 'system' });
                },
              )}
              {!contextFile.hostPath && contextItem(
                'Copy',
                <Copy className="h-4 w-4" />,
                async () => {
                  if (contextFile.type === 'image') {
                    await copyImage(contextFile);
                    addNotification({ appId: 'finder', title: 'Image copied', message: `${contextFile.name} was copied to the clipboard.`, type: 'system' });
                    return;
                  }
                  vfs.copyFiles([contextFile.id]);
                  addNotification({ appId: 'finder', title: 'Finder', message: 'Item copied to clipboard', type: 'system' });
                },
              )}
              {contextFile.hostPath && !contextFileIsDriveRoot && contextItem(
                'Copy',
                <Copy className="h-4 w-4" />,
                async () => {
                  if (contextFile.type === 'image') {
                    await copyImage(contextFile);
                    addNotification({ appId: 'finder', title: 'Image copied', message: `${contextFile.name} was copied to the clipboard.`, type: 'system' });
                    return;
                  }
                  setHostClipboard({ paths: [contextFile.hostPath!], move: false });
                  addNotification({ appId: 'finder', title: 'Finder', message: 'Item copied. Paste it into a connected folder.', type: 'system' });
                },
              )}
              {contextFile.hostPath && !contextFileIsDriveRoot && contextItem(
                'Cut',
                <Scissors className="h-4 w-4" />,
                () => {
                  setHostClipboard({ paths: [contextFile.hostPath!], move: true });
                  addNotification({ appId: 'finder', title: 'Finder', message: 'Item cut. Paste it into a connected folder to move it.', type: 'system' });
                },
              )}
              {contextFile.hostPath && contextItem(
                'Copy as path',
                <Copy className="h-4 w-4" />,
                () => copyPath(contextFile),
              )}
              {!contextFileIsDriveRoot && contextItem(
                'Rename',
                <Edit3 className="h-4 w-4" />,
                () => {
                  setRenamingId(contextFile.id);
                  setRenameValue(contextFile.name);
                },
              )}
              {!contextFile.hostPath && contextItem(
                'Duplicate',
                <Files className="h-4 w-4" />,
                () => {
                  vfs.duplicate(contextFile.id);
                  refreshFiles();
                },
              )}
              {contextFile.type === 'image' && contextItem(
                'Set as desktop background',
                <ImageIcon className="h-4 w-4" />,
                () => openFinderImage(contextFile, true),
              )}
              {!contextFileIsDriveRoot && contextItem(
                (contextFile.hostPath
                  ? favoriteHostPaths.some(item => item.path === contextFile.hostPath)
                  : !!contextFile.isFavorite)
                  ? 'Remove from Favorites'
                  : 'Add to Favorites',
                <Star className="h-4 w-4" />,
                () => toggleFinderFavorite(contextFile),
              )}
              {contextDivider}
              {contextItem(
                'Properties',
                <Info className="h-4 w-4" />,
                () => {
                  setSelectedFileIds([contextFile.id]);
                  setShowInspector(true);
                },
              )}
              {!contextFileIsDriveRoot && contextFile.type !== 'app' && contextItem(
                contextFile.hostPath ? 'Move to Recycle Bin' : 'Move to Trash',
                <Trash2 className="h-4 w-4" />,
                () => deleteFinderFile(contextFile),
                true,
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => setContextSubmenu(current => current === 'view' ? null : 'view')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/10"
              >
                <Eye className="h-4 w-4 text-slate-300" />
                <span className="flex-1">View</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => setContextSubmenu(current => current === 'sort' ? null : 'sort')}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/10"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-300" />
                <span className="flex-1">Sort by</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
              {contextDivider}
              <button
                type="button"
                role="menuitem"
                onClick={() => setContextSubmenu(current => current === 'new' ? null : 'new')}
                disabled={browsingDriveList}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-white/10"
              >
                <Plus className="h-4 w-4 text-slate-300" />
                <span className="flex-1">New</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
              {hasClipboard && contextItem(
                'Paste item(s)',
                <ClipboardPaste className="h-4 w-4" />,
                () => isBrowsingLocal
                  ? pasteHostClipboard()
                  : (() => {
                  const pasted = vfs.paste(currentPath);
                  if (pasted.length) {
                    refreshFiles();
                    setSelectedFileIds(pasted.map(file => file.id));
                  }
                  })(),
              )}
              {isBrowsingLocal && !browsingDriveList && contextDivider}
              {isBrowsingLocal && !browsingDriveList && contextItem(
                'Open in Terminal',
                <Terminal className="h-4 w-4" />,
                async () => {
                  if (!window.electronAPI?.openLocalTerminal) throw new Error('Terminal integration is unavailable.');
                  await window.electronAPI.openLocalTerminal(currentPath);
                },
              )}
              {isBrowsingLocal && !browsingDriveList && contextItem(
                'Open with Code',
                <Code className="h-4 w-4" />,
                async () => {
                  if (!window.electronAPI?.openLocalCodePath) throw new Error('VS Code integration is unavailable.');
                  const result = await window.electronAPI.openLocalCodePath(currentPath);
                  if (!result.opened) {
                    addNotification({
                      appId: 'finder',
                      title: 'VS Code not found',
                      message: 'VS Code is not installed or could not be located on this computer.',
                      type: 'system',
                    });
                  }
                },
              )}
              {contextDivider}
              {contextItem(
                'Folder properties',
                <Info className="h-4 w-4" />,
                () => setShowFolderProperties(true),
              )}
              {contextItem(
                'Refresh',
                <Sparkles className="h-4 w-4" />,
                () => isBrowsingLocal ? refreshCurrentLocalFiles() : refreshFiles(),
              )}
            </div>
          )}

          {contextSubmenu && (
            <div className="mt-1 border-t border-white/10 pt-1">
              {contextSubmenu === 'view' && (
                <>
                  {contextItem('Large icons', <Grid className="h-4 w-4" />, () => setViewMode('grid'))}
                  {contextItem('Details', <List className="h-4 w-4" />, () => setViewMode('list'))}
                </>
              )}
              {contextSubmenu === 'sort' && (
                <>
                  {(['name', 'updatedAt', 'size', 'type'] as SortField[]).map(field =>
                    contextItem(
                      field === 'updatedAt' ? 'Date modified' : `Sort by ${field}`,
                      <ListFilter className="h-4 w-4" />,
                      () => {
                        if (sortField === field) setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortField(field);
                          setSortOrder('asc');
                        }
                      },
                    )
                  )}
                </>
              )}
              {contextSubmenu === 'new' && (
                <>
                  {contextItem('Folder', <Folder className="h-4 w-4" />, () => {
                    setNewFolderName('New Folder');
                    setShowNewFolderModal(true);
                  })}
                  {contextItem('Text file', <FileText className="h-4 w-4" />, () => {
                    setNewFileName('');
                    setNewFileExtension('txt');
                    setNewFileType('document');
                    setShowNewFileModal(true);
                  })}
                  {contextItem('Code file', <FileCode className="h-4 w-4" />, () => {
                    setNewFileName('');
                    setNewFileExtension('js');
                    setNewFileType('code');
                    setShowNewFileModal(true);
                  })}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {showFolderProperties && (
        <div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowFolderProperties(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="finder-folder-properties-title"
            className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900/95 p-5 text-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="finder-folder-properties-title" className="flex items-center gap-2 text-sm font-bold">
                <Folder className="h-4 w-4 text-sky-400" />
                Folder properties
              </h2>
              <button
                type="button"
                aria-label="Close folder properties"
                onClick={() => setShowFolderProperties(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-slate-400">Location</dt>
                <dd className="mt-1 break-all font-mono text-slate-200">{currentPath}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3">
                <dt className="text-slate-400">Items in this view</dt>
                <dd>{currentFiles.length}</dd>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3">
                <dt className="text-slate-400">Total size of visible files</dt>
                <dd>{formatFileSize(currentFiles.reduce((total, file) => total + (file.size || 0), 0))}</dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => void contextAction(() => copyText(currentPath))}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
              >
                Copy location
              </button>
              <button
                type="button"
                onClick={() => setShowFolderProperties(false)}
                className="rounded-lg bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/30"
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}

      {imageFilmstrip && (
        <div
          className="absolute inset-0 z-[200] flex flex-col bg-black/95 text-white"
          onClick={event => event.stopPropagation()}
        >
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <div className="min-w-0 truncate text-xs font-semibold">
              {imageFilmstrip.files[imageFilmstrip.index]?.name}
              <span className="ml-2 text-slate-500">{imageFilmstrip.index + 1} / {imageFilmstrip.files.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous image" onClick={() => stepImageFilmstrip(-1)} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" aria-label={imageFilmstrip.playing ? 'Pause slideshow' : 'Start slideshow'} onClick={() => setImageFilmstrip(current => current ? { ...current, playing: !current.playing } : null)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10">{imageFilmstrip.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button type="button" aria-label="Next image" onClick={() => stepImageFilmstrip(1)} className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
              <button type="button" aria-label="Close filmstrip" onClick={() => setImageFilmstrip(null)} className="ml-2 rounded-lg p-2 text-slate-300 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
          </header>
          <div
            className="group/preview relative flex min-h-0 flex-1 touch-pan-y items-center justify-center overflow-hidden p-4 sm:p-8"
            onPointerDown={event => {
              imageSwipeStart.current = event.clientX;
            }}
            onPointerUp={event => {
              if (imageSwipeStart.current === null) return;
              const distance = event.clientX - imageSwipeStart.current;
              imageSwipeStart.current = null;
              if (Math.abs(distance) > 55) stepImageFilmstrip(distance < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              imageSwipeStart.current = null;
            }}
          >
            <AnimatePresence mode="wait" initial={false} custom={imageSlideDirection}>
              <motion.img
                key={imageFilmstrip.files[imageFilmstrip.index]?.id}
                custom={imageSlideDirection}
                src={imageFilmstrip.files[imageFilmstrip.index]?.previewUrl}
                alt={imageFilmstrip.files[imageFilmstrip.index]?.name ?? 'Image preview'}
                initial={{ opacity: 0, x: imageSlideDirection * 42, scale: 0.985 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: imageSlideDirection * -42, scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                draggable={false}
                className="max-h-full max-w-full select-none rounded-lg object-contain shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
              />
            </AnimatePresence>
            <button type="button" aria-label="Previous image" onClick={() => stepImageFilmstrip(-1)} className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/75 opacity-0 shadow-lg backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-black/55 hover:text-white focus-visible:opacity-100 focus-visible:outline-none group-hover/preview:opacity-100">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Next image" onClick={() => stepImageFilmstrip(1)} className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white/75 opacity-0 shadow-lg backdrop-blur-md transition duration-200 hover:scale-105 hover:bg-black/55 hover:text-white focus-visible:opacity-100 focus-visible:outline-none group-hover/preview:opacity-100">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div ref={filmstripThumbsRef} className="flex h-24 shrink-0 gap-2 overflow-x-auto border-t border-white/10 bg-white/[0.025] p-2">
            {imageFilmstrip.files.map((file, index) => (
              <button key={file.id} type="button" onClick={() => {
                setImageSlideDirection(index >= imageFilmstrip.index ? 1 : -1);
                setImageFilmstrip(current => current ? { ...current, index } : null);
              }} data-active={imageFilmstrip.index === index} aria-label={`Show ${file.name}`} aria-current={imageFilmstrip.index === index} className={`h-full w-24 shrink-0 overflow-hidden rounded-lg border transition duration-200 hover:scale-[1.03] ${imageFilmstrip.index === index ? 'border-white/40 opacity-100 shadow-[0_0_18px_rgba(255,255,255,0.12)]' : 'border-white/10 opacity-65 hover:opacity-100'}`}>
                <img src={file.previewUrl} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New File Modal */}
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
                <span>Create New File</span>
              </h3>
              <button
                onClick={() => setShowNewFileModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
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
                  { label: 'TypeScript', ext: 'ts', type: 'code', icon: FileCode },
                  { label: 'JavaScript', ext: 'js', type: 'code', icon: Code2 },
                  { label: 'Python', ext: 'py', type: 'code', icon: Code2 },
                  { label: 'HTML Web', ext: 'html', type: 'code', icon: Code2 },
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
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-sky-500/25 border-sky-400 text-white font-semibold shadow-md'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
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
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewFile}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowNewFolderModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl glass-panel bg-slate-900/95 border border-white/20 p-6 shadow-2xl text-white space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-400 fill-amber-400/30" />
                <span>New Folder</span>
              </h3>
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Folder Name</label>
              <input
                type="text"
                autoFocus
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateNewFolder();
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs outline-none focus:border-sky-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewFolder}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {saveToAppFile && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setSaveToAppFile(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-media-title"
            className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-950/95 p-5 text-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="save-media-title" className="text-base font-bold">Save in ARLO OS</h2>
                <p className="mt-1 max-w-[300px] truncate text-xs text-slate-400">{saveToAppFile.name}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSaveToAppFile(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-400">Choose an app folder. This creates an internal copy and does not save to your computer’s folders.</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['/Users/abhishek/Desktop', 'Desktop'],
                ['/Users/abhishek/Documents', 'Documents'],
                ['/Users/abhishek/Pictures', 'Pictures'],
                ['/Users/abhishek/Videos', 'Videos'],
              ].map(([path, label]) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => setSaveDestination(path)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${saveDestination === path ? 'border-sky-400/60 bg-sky-500/15 text-sky-100' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSaveToAppFile(null)} className="rounded-xl px-4 py-2 text-xs text-slate-300 hover:bg-white/10">Cancel</button>
              <button type="button" onClick={() => void contextAction(() => saveMediaIntoApp(saveToAppFile, saveDestination))} className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-400">Save here</button>
            </div>
          </div>
        </div>
      )}

      {showKeyboardShortcuts && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="finder-shortcuts-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 text-white shadow-[0_32px_100px_rgba(0,0,0,0.6)]"
            onClick={event => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-400/10 text-sky-200">
                  <Keyboard className="h-5 w-5" />
                </span>
                <div>
                  <h2 id="finder-shortcuts-title" className="text-sm font-semibold">Finder keyboard shortcuts</h2>
                  <p className="mt-0.5 text-[11px] text-slate-400">Use Ctrl on Windows; Cmd on Mac.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowKeyboardShortcuts(false)} aria-label="Close shortcuts" className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="grid gap-x-8 gap-y-1 p-5 sm:grid-cols-2">
              {[
                ['Open selected item', 'Enter'],
                ['Quick Look preview', 'Space'],
                ['Rename selected item', 'F2'],
                ['Select all items', 'Ctrl / Cmd + A'],
                ['Copy / Cut / Paste', 'Ctrl / Cmd + C / X / V'],
                ['Duplicate in ARLO Drive', 'Ctrl / Cmd + D'],
                ['Move selected to Trash', 'Delete'],
                ['Create a new file', 'Ctrl / Cmd + N'],
                ['Create a new folder', 'Ctrl / Cmd + Shift + N'],
                ['Find files in this location', 'Ctrl / Cmd + F or /'],
                ['Go back / forward', 'Alt + ← / →'],
                ['Refresh this location', 'F5'],
                ['Show / hide details', 'Ctrl / Cmd + I'],
                ['Move selection', 'Arrow keys'],
                ['Clear selection / search', 'Esc'],
                ['Show this shortcut list', '? or F1'],
              ].map(([label, shortcut]) => (
                <div key={label} className="flex min-h-10 items-center justify-between gap-3 border-b border-white/[0.05] py-2">
                  <span className="text-xs text-slate-300">{label}</span>
                  <kbd className="shrink-0 rounded-lg border border-white/10 bg-white/[0.045] px-2 py-1 font-mono text-[10px] text-slate-200">{shortcut}</kbd>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
              <p className="text-[10px] text-slate-500">Drag ARLO items onto folders to move them. Drop files from your PC into ARLO Drive to import.</p>
              <button type="button" onClick={() => setShowKeyboardShortcuts(false)} className="shrink-0 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">Done</button>
            </div>
          </motion.section>
        </div>
      )}
    </div>
  );
};
