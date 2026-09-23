import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { VirtualFile } from '../../types/desktop';
import { vfs } from '../../services/virtualFileSystem';
import { sound } from '../../services/soundService';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  fileId: string | null;
}

type SortField = 'name' | 'updatedAt' | 'size' | 'type';
type SortOrder = 'asc' | 'desc';

export const FinderApp: React.FC = () => {
  const { setQuickLookFile, openApp, importLocalFiles, connectLocalDirectory, addNotification } = useOS();

  const [filesState, setFilesState] = useState<VirtualFile[]>(() => vfs.getAllActiveFiles());
  const [currentPath, setCurrentPath] = useState('/Users/abhishek');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>(['/Users/abhishek']);
  const [historyIndex, setHistoryIndex] = useState(0);

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDraggingOverFinder, setIsDraggingOverFinder] = useState(false);

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    fileId: null,
  });

  const localFileInputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const refreshFiles = () => {
    setFilesState(vfs.getAllActiveFiles());
  };

  const sideNavItems = [
    { label: 'Home', path: '/Users/abhishek', icon: HardDrive },
    { label: 'Desktop', path: '/Users/abhishek/Desktop', icon: Laptop },
    { label: 'Documents', path: '/Users/abhishek/Documents', icon: Folder },
    { label: 'Downloads', path: '/Users/abhishek/Downloads', icon: Download },
    { label: 'Local Computer (PC)', path: '/Users/abhishek/Local Computer', icon: Laptop },
    { label: 'Applications', path: '/Applications', icon: Folder },
    { label: 'iCloud Drive', path: '/Users/abhishek/Documents', icon: Cloud },
  ];

  const navigateTo = (path: string) => {
    sound.playClick();
    setCurrentPath(path);
    setSelectedFileIds([]);
    setRenamingId(null);
    const newHist = [...pathHistory.slice(0, historyIndex + 1), path];
    setPathHistory(newHist);
    setHistoryIndex(newHist.length - 1);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(pathHistory[historyIndex - 1]);
      setSelectedFileIds([]);
      setRenamingId(null);
      sound.playClick();
    }
  };

  const handleForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(pathHistory[historyIndex + 1]);
      setSelectedFileIds([]);
      setRenamingId(null);
      sound.playClick();
    }
  };

  // Only direct children when not searching, and full path search when searching
  const currentFiles = useMemo(() => {
    let list = filesState.filter((file: VirtualFile) => {
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
  }, [filesState, currentPath, searchQuery, sortField, sortOrder]);

  const selectedFiles = useMemo(() => {
    return filesState.filter(f => selectedFileIds.includes(f.id));
  }, [filesState, selectedFileIds]);

  const primarySelectedFile = selectedFiles[0] || null;

  // Auto focus rename input
  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Handle open file in correct app
  const handleOpenFile = (file: VirtualFile) => {
    sound.playClick();
    if (file.type === 'folder') {
      navigateTo(`${currentPath}/${file.name}`);
    } else if (file.type === 'image') {
      setQuickLookFile(file);
    } else if (file.type === 'code' || file.type === 'document') {
      // Open in Code Studio app
      openApp('codestudio');
    } else if (file.type === 'audio') {
      openApp('music');
    } else if (file.type === 'video') {
      openApp('tv');
    } else {
      setQuickLookFile(file);
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

      const isMod = e.ctrlKey || e.metaKey;

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
          vfs.copyFiles(selectedFileIds);
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
          vfs.cutFiles(selectedFileIds);
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
        if (selectedFileIds.length > 0) {
          e.preventDefault();
          selectedFileIds.forEach(id => vfs.moveToTrash(id));
          sound.playTrash();
          refreshFiles();
          setSelectedFileIds([]);
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

      // Rename: Enter or F2
      if (e.code === 'Enter' || e.code === 'F2') {
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
  }, [currentFiles, selectedFileIds, primarySelectedFile, currentPath, addNotification, setQuickLookFile]);

  // Confirm rename
  const handleSaveRename = () => {
    if (renamingId && renameValue.trim()) {
      vfs.rename(renamingId, renameValue.trim());
      sound.playClick();
      refreshFiles();
    }
    setRenamingId(null);
  };

  // Create new file
  const handleCreateNewFile = () => {
    const rawName = newFileName.trim() || 'Untitled';
    const finalName = rawName.includes('.') ? rawName : `${rawName}.${newFileExtension}`;
    const ext = finalName.split('.').pop() || newFileExtension;
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
  };

  // Close context menu on any global click
  useEffect(() => {
    const closeMenu = () => {
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
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ label: 'Macintosh HD', fullPath: '/Users/abhishek' }];
    let accum = '';
    for (const part of parts) {
      accum += `/${part}`;
      crumbs.push({ label: part === 'Users' ? 'Users' : part === 'abhishek' ? 'abhishek' : part, fullPath: accum });
    }
    return crumbs;
  }, [currentPath]);

  const hasClipboard = !!vfs.getClipboard() && vfs.getClipboard()!.ids.length > 0;

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
            onClick={() => {
              setNewFileName('');
              setNewFileExtension('txt');
              setNewFileType('document');
              setShowNewFileModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="New File (Cmd+N / Ctrl+N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New File</span>
          </button>

          {/* New Folder Button */}
          <button
            onClick={() => {
              setNewFolderName('New Folder');
              setShowNewFolderModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="New Folder (Cmd+Shift+N / Ctrl+Shift+N)"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Folder</span>
          </button>

          {/* Paste Button (Active if clipboard has content) */}
          {hasClipboard && (
            <button
              onClick={() => {
                const pasted = vfs.paste(currentPath);
                if (pasted.length > 0) {
                  sound.playClick();
                  refreshFiles();
                  setSelectedFileIds(pasted.map(f => f.id));
                }
              }}
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
              if ('showDirectoryPicker' in window) {
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
          <label className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-medium flex items-center gap-1.5 cursor-pointer transition-all">
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
          </label>

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

          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
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
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              <span>Abhishek OS Drive</span>
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
            setIsDraggingOverFinder(true);
          }}
          onDragLeave={e => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOverFinder(false);
          }}
          onDrop={async e => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOverFinder(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await importLocalFiles(e.dataTransfer.files, currentPath);
              refreshFiles();
            }
          }}
          className="flex-1 overflow-y-auto p-4 bg-slate-900/20 relative focus:outline-none"
        >
          {/* Drag & drop overlay */}
          {isDraggingOverFinder && (
            <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-sky-400 bg-sky-950/80 backdrop-blur-md flex flex-col items-center justify-center z-40 pointer-events-none">
              <Upload className="w-12 h-12 text-sky-400 animate-bounce mb-2" />
              <p className="text-base font-bold text-white">Drop files to import into {currentPath}</p>
              <p className="text-xs text-sky-200 mt-0.5">Supports images, audio, video, code, and documents</p>
            </div>
          )}

          {currentFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <Folder className="w-16 h-16 mb-3 opacity-20 text-sky-400" />
              <p className="text-sm font-semibold text-slate-300">This folder is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Click <strong>New File</strong>, <strong>Folder</strong>, or drag & drop files from your computer to get started.
              </p>
              <div className="flex gap-2 mt-4">
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
              </div>
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
                      handleOpenFile(file);
                    }}
                    onContextMenu={e => handleContextMenu(e, file.id)}
                    className={`group flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all duration-150 border relative ${
                      isSelected
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
                        handleOpenFile(file);
                      }}
                      onContextMenu={e => handleContextMenu(e, file.id)}
                      className={`grid grid-cols-12 py-2 px-2 items-center cursor-pointer rounded-xl transition-colors ${
                        isSelected ? 'bg-sky-500/30 text-white font-medium' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="col-span-6 flex items-center gap-2.5 truncate">
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {file.type === 'folder' ? (
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
                  <button
                    onClick={() => setQuickLookFile(primarySelectedFile)}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quick Look</span>
                  </button>
                  <button
                    onClick={() => {
                      vfs.moveToTrash(primarySelectedFile.id);
                      sound.playTrash();
                      refreshFiles();
                      setSelectedFileIds([]);
                    }}
                    className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>
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
          className="fixed w-56 rounded-2xl glass-panel bg-slate-900/95 border border-white/20 shadow-2xl p-1.5 z-50 text-xs text-slate-200"
          style={{ top: Math.min(window.innerHeight - 300, contextMenu.y), left: Math.min(window.innerWidth - 240, contextMenu.x) }}
        >
          {contextMenu.fileId ? (
            /* File Context Menu */
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  const f = vfs.getFileById(contextMenu.fileId!);
                  if (f) handleOpenFile(f);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                <span>Open</span>
              </button>
              <button
                onClick={() => {
                  const f = vfs.getFileById(contextMenu.fileId!);
                  if (f) setQuickLookFile(f);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Quick Look (Space)</span>
              </button>
              <button
                onClick={() => {
                  const f = vfs.getFileById(contextMenu.fileId!);
                  if (f) {
                    setRenamingId(f.id);
                    setRenameValue(f.name);
                  }
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Rename (Enter)</span>
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => {
                  vfs.copyFiles([contextMenu.fileId!]);
                  sound.playClick();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                  addNotification({ appId: 'finder', title: 'Finder', message: 'Item copied to clipboard', type: 'system' });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy (Cmd+C / Ctrl+C)</span>
              </button>
              <button
                onClick={() => {
                  vfs.cutFiles([contextMenu.fileId!]);
                  sound.playClick();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                  addNotification({ appId: 'finder', title: 'Finder', message: 'Item cut to clipboard', type: 'system' });
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Scissors className="w-3.5 h-3.5 text-slate-400" />
                <span>Cut (Cmd+X / Ctrl+X)</span>
              </button>
              <button
                onClick={() => {
                  vfs.duplicate(contextMenu.fileId!);
                  sound.playClick();
                  refreshFiles();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Files className="w-3.5 h-3.5 text-slate-400" />
                <span>Duplicate (Cmd+D / Ctrl+D)</span>
              </button>
              <div className="h-px bg-white/10 my-1" />
              <button
                onClick={() => {
                  vfs.moveToTrash(contextMenu.fileId!);
                  sound.playTrash();
                  refreshFiles();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-500/20 text-rose-300 text-left"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Move to Trash (Delete)</span>
              </button>
            </div>
          ) : (
            /* Empty Area Context Menu */
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setNewFileName('');
                  setNewFileExtension('txt');
                  setNewFileType('document');
                  setShowNewFileModal(true);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Plus className="w-3.5 h-3.5 text-sky-400" />
                <span>New File...</span>
              </button>
              <button
                onClick={() => {
                  setNewFolderName('New Folder');
                  setShowNewFolderModal(true);
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                <span>New Folder</span>
              </button>

              {hasClipboard && (
                <button
                  onClick={() => {
                    const pasted = vfs.paste(currentPath);
                    if (pasted.length > 0) {
                      sound.playClick();
                      refreshFiles();
                      setSelectedFileIds(pasted.map(f => f.id));
                    }
                    setContextMenu(prev => ({ ...prev, visible: false }));
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Paste Item(s)</span>
                </button>
              )}

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  localFileInputRef.current?.click();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import Files from PC...</span>
              </button>

              <button
                onClick={async () => {
                  setContextMenu(prev => ({ ...prev, visible: false }));
                  if ('showDirectoryPicker' in window) {
                    await connectLocalDirectory(currentPath);
                    refreshFiles();
                  } else {
                    localFileInputRef.current?.click();
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-emerald-300 text-left"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Connect PC Drive / Folder</span>
              </button>

              <div className="h-px bg-white/10 my-1" />

              <button
                onClick={() => {
                  refreshFiles();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/15 text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Refresh Folder</span>
              </button>
            </div>
          )}
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
    </div>
  );
};
