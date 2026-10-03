import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Code2,
  Copy,
  FileText,
  Film,
  Folder,
  FolderPlus,
  Image,
  LockKeyhole,
  Music,
  Pause,
  Play,
  Printer,
  Plus,
  Save,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { VirtualFile } from '../../types/desktop';
import { vfs } from '../../services/virtualFileSystem';

type CreateKind = 'file' | 'folder';

const codeExtensions = new Set([
  'c', 'cc', 'cpp', 'cs', 'css', 'go', 'html', 'java', 'js', 'jsx',
  'json', 'php', 'py', 'rb', 'rs', 'sh', 'sql', 'swift', 'ts', 'tsx',
]);

const getFileIcon = (file: VirtualFile) => {
  if (file.type === 'folder') return Folder;
  if (file.type === 'image') return Image;
  if (file.type === 'video') return Film;
  if (file.type === 'audio') return Music;
  if (file.type === 'code') return Code2;
  return FileText;
};

export const QuickLookModal: React.FC = () => {
  const {
    quickLookFile,
    setQuickLookFile,
    addNotification,
    openApp,
    uploadCustomWallpaper,
    setLockScreenWallpaper,
  } = useOS();
  const [fileStack, setFileStack] = useState<VirtualFile[]>([]);
  const [files, setFiles] = useState<VirtualFile[]>(() => vfs.getAllActiveFiles());
  const [draft, setDraft] = useState('');
  const [createKind, setCreateKind] = useState<CreateKind | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [imageMenu, setImageMenu] = useState<{ x: number; y: number } | null>(null);
  const [showFilmstrip, setShowFilmstrip] = useState(false);
  const [slideshowFiles, setSlideshowFiles] = useState<VirtualFile[] | null>(null);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [saveDestination, setSaveDestination] = useState<string | null>(null);

  useEffect(() => {
    setFileStack(quickLookFile ? [quickLookFile] : []);
    setCreateKind(null);
    setNewItemName('');
  }, [quickLookFile?.id]);

  useEffect(() => vfs.subscribe(() => setFiles(vfs.getAllActiveFiles())), []);

  const activeFile = fileStack[fileStack.length - 1] ?? quickLookFile;
  const parentFolder = fileStack.length > 1 ? fileStack[fileStack.length - 2] : null;
  const folderPath = activeFile?.type === 'folder'
    ? `${activeFile.path.replace(/\/+$/, '')}/${activeFile.name}`.replace(/\/+/g, '/')
    : '';
  const folderItems = useMemo(
    () => folderPath ? files.filter(file => file.path === folderPath) : [],
    [files, folderPath],
  );
  const imageFiles = useMemo(
    () => {
      if (!activeFile) return [];
      const folderImages = files.filter(file =>
        file.path === activeFile.path && file.type === 'image' && !!file.previewUrl
      );
      return folderImages.some(file => file.id === activeFile.id) ||
        activeFile.type !== 'image' || !activeFile.previewUrl
        ? folderImages
        : [activeFile, ...folderImages];
    },
    [activeFile, files],
  );
  const isEditable = !!activeFile &&
    !activeFile.hostPath &&
    (activeFile.type === 'document' || activeFile.type === 'code');

  useEffect(() => {
    setDraft(activeFile?.content ?? '');
    setSaveError('');
    setImageMenu(null);
  }, [activeFile?.id]);

  useEffect(() => {
    if (!imageMenu) return;
    const closeMenu = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-quick-look-image-menu]')) return;
      setImageMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImageMenu(null);
    };
    window.addEventListener('click', closeMenu);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [imageMenu]);

  useEffect(() => {
    if (!slideshowFiles?.length) return;
    const timer = window.setInterval(() => {
      setSlideshowIndex(index => (index + 1) % slideshowFiles.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [slideshowFiles]);

  useEffect(() => {
    if (slideshowFiles?.[slideshowIndex]) {
      setQuickLookFile(slideshowFiles[slideshowIndex]);
    }
  }, [slideshowFiles, slideshowIndex, setQuickLookFile]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (quickLookFile && event.key === 'Escape') {
        event.preventDefault();
        if (imageMenu) {
          setImageMenu(null);
          return;
        }
        if (saveDestination) {
          setSaveDestination(null);
          return;
        }
        if (slideshowFiles) {
          setSlideshowFiles(null);
          return;
        }
        if (showFilmstrip) {
          setShowFilmstrip(false);
          return;
        }
        if (createKind) {
          setCreateKind(null);
          return;
        }
        if (fileStack.length > 1) {
          setFileStack(stack => stack.slice(0, -1));
          return;
        }
        setQuickLookFile(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [quickLookFile, createKind, fileStack.length, imageMenu, saveDestination, slideshowFiles, showFilmstrip, setQuickLookFile]);

  if (!quickLookFile || !activeFile) return null;

  const formattedSize =
    activeFile.size > 1000000
      ? `${(activeFile.size / (1024 * 1024)).toFixed(1)} MB`
      : activeFile.size === 0
        ? 'Empty'
        : `${Math.max(1, Math.round(activeFile.size / 1024))} KB`;
  const Icon = getFileIcon(activeFile);
  const isDirty = isEditable && draft !== (activeFile.content ?? '');
  const imageMenuItem = (
    label: string,
    icon: React.ReactNode,
    action: () => Promise<void> | void,
    danger = false,
    disabled = false,
  ) => (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => void runImageAction(action)}
      className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
        danger
          ? 'text-rose-300 hover:bg-rose-500/15'
          : 'text-slate-100 hover:bg-white/10'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-sky-300">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );

  const saveContent = () => {
    const saved = vfs.updateFileContent(activeFile.id, draft);
    if (!saved) {
      setSaveError('This file could not be saved. It may have been removed.');
      return;
    }
    setFileStack(stack => stack.map(file => file.id === saved.id ? saved : file));
    setSaveError('');
  };

  const runImageAction = async (action: () => Promise<void> | void) => {
    setImageMenu(null);
    try {
      await action();
    } catch (error) {
      addNotification({
        appId: 'finder',
        title: 'Image action failed',
        message: error instanceof Error ? error.message : String(error),
        type: 'system',
      });
    }
  };

  const readActiveImage = async () => {
    if (!activeFile) throw new Error('No image is selected.');
    if (!activeFile.hostPath) return vfs.readMedia(activeFile);
    const url = activeFile.previewUrl || await window.electronAPI?.getMediaUrl?.(activeFile.hostPath);
    if (!url) throw new Error('Image preview is unavailable.');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Could not read "${activeFile.name}".`);
    return response.blob();
  };

  const copyActiveImage = async () => {
    const blob = await readActiveImage();
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      throw new Error('Image clipboard is not available in this browser.');
    }
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      throw new Error('Could not prepare the image for copying.');
    }
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not encode the image.')), 'image/png');
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  };

  const shareActiveImage = async () => {
    if (!activeFile) return;
    const blob = await readActiveImage();
    if (!navigator.share) throw new Error('Sharing is not supported by this device.');
    const sharedFile = new File([blob], activeFile.name, { type: blob.type || 'application/octet-stream' });
    if (navigator.canShare && !navigator.canShare({ files: [sharedFile] })) {
      throw new Error('This device cannot share this image.');
    }
    await navigator.share({ files: [sharedFile], title: activeFile.name });
  };

  const printActiveImage = async () => {
    if (!activeFile) return;
    const blob = await readActiveImage();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not prepare image for printing.'));
      reader.onerror = () => reject(reader.error || new Error('Could not prepare image for printing.'));
      reader.readAsDataURL(blob);
    });
    const printWindow = window.open('', '_blank');
    if (!printWindow) throw new Error('Allow pop-ups to print this image.');
    printWindow.opener = null;
    printWindow.document.title = activeFile.name;
    const image = printWindow.document.createElement('img');
    image.alt = activeFile.name;
    image.style.maxWidth = '100%';
    image.style.maxHeight = '100%';
    image.onload = () => printWindow.print();
    image.src = dataUrl;
    printWindow.document.body.style.cssText = 'margin:0;height:100vh;display:grid;place-items:center';
    printWindow.document.body.append(image);
  };

  const copyImagePath = async () => {
    if (!activeFile) return;
    const path = activeFile.hostPath || `${activeFile.path}/${activeFile.name}`;
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard access is unavailable.');
    await navigator.clipboard.writeText(path);
  };

  const setImageWallpaper = async (lockScreen: boolean) => {
    if (!activeFile?.previewUrl) throw new Error('Image preview is unavailable.');
    const image = new window.Image();
    image.src = activeFile.previewUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not load the selected image.'));
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the selected image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    if (lockScreen) {
      setLockScreenWallpaper(dataUrl);
      addNotification({ appId: 'finder', title: 'Lock screen updated', message: 'The lock screen background was changed. Its blur effect is unchanged.', type: 'system' });
    } else {
      uploadCustomWallpaper(dataUrl, activeFile.name);
      addNotification({ appId: 'finder', title: 'Desktop background updated', message: 'The selected image is now your desktop background.', type: 'system' });
    }
  };

  const saveImageToApp = async (destination: string) => {
    if (!activeFile) return;
    vfs.ensureDirectoryExists(destination);
    await vfs.importBlob(await readActiveImage(), activeFile.name, destination, 'image');
    addNotification({
      appId: 'finder',
      title: 'Saved in Abhishek OS',
      message: `${activeFile.name} was saved in ${destination.split('/').pop()}.`,
      type: 'system',
    });
    setSaveDestination(null);
  };

  const deleteActiveImage = async () => {
    if (!activeFile) return;
    if (activeFile.hostPath) {
      if (!window.electronAPI?.trashLocalEntry) throw new Error('Moving this computer file to Trash is unavailable.');
      await window.electronAPI.trashLocalEntry(activeFile.hostPath);
    } else if (!vfs.moveToTrash(activeFile.id)) {
      throw new Error('This image could not be moved to Trash.');
    }
    setQuickLookFile(null);
  };

  const resizeActiveImage = async () => {
    if (!activeFile) return;
    const image = await createImageBitmap(await readActiveImage());
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
    const resized = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not export the resized image.')), 'image/jpeg', 0.9);
    });
    const name = `${activeFile.name.replace(/\.[^.]+$/, '')}-${width}x${height}.jpg`;
    vfs.ensureDirectoryExists('/Users/abhishek/Pictures');
    await vfs.importBlob(resized, name, '/Users/abhishek/Pictures', 'image');
    addNotification({ appId: 'finder', title: 'Image resized', message: 'The resized image was saved in Pictures.', type: 'system' });
  };

  const createItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeFile || activeFile.type !== 'folder') return;
    const name = newItemName.trim();
    if (!name) return;

    if (createKind === 'folder') {
      const created = vfs.createFolder(name, folderPath);
      setFileStack(stack => [...stack, created]);
    } else if (createKind === 'file') {
      const finalName = name.includes('.') ? name : `${name}.txt`;
      const extension = finalName.split('.').pop()?.toLowerCase() || 'txt';
      const type = codeExtensions.has(extension) ? 'code' : 'document';
      const created = vfs.createFile(finalName, folderPath, type, '', extension);
      setFileStack(stack => [...stack, created]);
    }
    setNewItemName('');
    setCreateKind(null);
  };

  const imageQuickActions: { label: string; icon: React.ReactNode; action: () => Promise<void> }[] = [
    { label: 'Copy', icon: <Copy className="h-5 w-5" />, action: copyActiveImage },
    { label: 'Share', icon: <Share2 className="h-5 w-5" />, action: shareActiveImage },
    { label: 'Delete', icon: <Trash2 className="h-5 w-5" />, action: deleteActiveImage },
    { label: 'Print', icon: <Printer className="h-5 w-5" />, action: printActiveImage },
  ];

  return (
    <div
      onClick={() => setQuickLookFile(null)}
      className="fixed inset-0 z-[2147483000] flex select-none items-center justify-center bg-black/65 p-4 backdrop-blur-md sm:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={event => event.stopPropagation()}
        className="flex max-h-[88vh] min-h-[420px] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-slate-950/95 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.04] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            {fileStack.length > 1 && (
              <button
                type="button"
                aria-label="Go back"
                onClick={() => setFileStack(stack => stack.slice(0, -1))}
                className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <Icon className="h-5 w-5 shrink-0 text-sky-300" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold">{activeFile.name}</h3>
              <p className="truncate text-[10px] text-slate-400">
                {activeFile.type === 'folder' ? folderPath : `${activeFile.path}/${activeFile.name}`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-[11px] font-mono text-slate-300">{formattedSize}</span>
            {isDirty && (
              <button
                type="button"
                onClick={saveContent}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-400"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            )}
            <button
              type="button"
              aria-label="Close"
              onClick={() => setQuickLookFile(null)}
              className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {activeFile.type === 'folder' ? (
          <div className="flex min-h-0 flex-1 flex-col bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
              <div>
                <h4 className="text-sm font-semibold">Folder contents</h4>
                <p className="mt-0.5 text-xs text-slate-400">
                  {folderItems.length === 0
                    ? 'This folder is empty'
                    : `${folderItems.length} ${folderItems.length === 1 ? 'item' : 'items'}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setCreateKind('folder'); setNewItemName(''); }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                >
                  <FolderPlus className="h-4 w-4 text-amber-300" />
                  New folder
                </button>
                <button
                  type="button"
                  onClick={() => { setCreateKind('file'); setNewItemName(''); }}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500/15 px-3 py-2 text-xs font-medium text-sky-200 transition hover:bg-sky-500/25"
                >
                  <Plus className="h-4 w-4" />
                  New file
                </button>
              </div>
            </div>

            {createKind && (
              <form onSubmit={createItem} className="flex gap-2 border-b border-white/10 px-5 py-3">
                <input
                  autoFocus
                  value={newItemName}
                  onChange={event => setNewItemName(event.target.value)}
                  placeholder={createKind === 'folder' ? 'Folder name' : 'File name (e.g. notes.txt)'}
                  aria-label={createKind === 'folder' ? 'Folder name' : 'File name'}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-sky-400/60"
                />
                <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold hover:bg-sky-400">
                  Create
                </button>
                <button type="button" onClick={() => setCreateKind(null)} className="rounded-xl px-3 py-2 text-xs text-white/60 hover:bg-white/10">
                  Cancel
                </button>
              </form>
            )}

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {folderItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {folderItems.map(item => {
                    const ItemIcon = getFileIcon(item);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setFileStack(stack => [...stack, item])}
                        className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 text-left transition hover:border-sky-300/20 hover:bg-white/[0.08]"
                      >
                        <ItemIcon className="h-5 w-5 shrink-0 text-sky-300" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
                        <span className="shrink-0 text-[10px] text-white/35">
                          {item.type === 'folder' ? 'Folder' : item.extension?.toUpperCase() || 'File'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : !createKind ? (
                <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-2xl bg-white/[0.05] p-4">
                    <Folder className="h-8 w-8 text-sky-300/80" />
                  </div>
                  <p className="text-sm font-semibold text-white/85">Nothing here yet</p>
                  <p className="mt-1 text-xs text-white/45">Create a file or folder to get started.</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : activeFile.type === 'image' && activeFile.previewUrl ? (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-black/20 p-6"
            onContextMenu={event => {
              event.preventDefault();
              event.stopPropagation();
              setImageMenu({ x: event.clientX, y: event.clientY });
            }}
          >
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <img
                src={activeFile.previewUrl}
                alt={activeFile.name}
                draggable={false}
                className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
            {showFilmstrip && imageFiles.length > 0 && (
              <div className="mt-3 flex h-16 max-w-full shrink-0 gap-2 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-1.5">
                {imageFiles.map(file => (
                  <button
                    key={file.id}
                    type="button"
                    aria-label={`Open ${file.name}`}
                    onClick={() => setQuickLookFile(file)}
                    className={`h-full w-16 shrink-0 overflow-hidden rounded-lg border ${
                      file.id === activeFile.id ? 'border-sky-400' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={file.previewUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeFile.type === 'audio' ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-black/20 p-8 text-center">
            <Music className="mb-4 h-16 w-16 text-emerald-400" />
            <p className="text-base font-bold">{activeFile.name}</p>
            <p className="mt-1 text-xs text-slate-400">Audio preview</p>
          </div>
        ) : isEditable ? (
          <div className="flex min-h-0 flex-1 flex-col bg-black/20 p-4">
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              aria-label={`Edit ${activeFile.name}`}
              placeholder="This file is empty. Start typing here..."
              spellCheck={false}
              className="min-h-0 flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/40"
            />
            {saveError && <p role="alert" className="pt-2 text-xs text-rose-300">{saveError}</p>}
            <div className="flex items-center justify-between px-1 pt-3 text-[11px] text-slate-400">
              <span>{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
              {isDirty && (
                <button type="button" onClick={saveContent} className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200">
                  <Save className="h-3.5 w-3.5" />
                  Save changes
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-black/20 p-8 text-center text-slate-400">
            <Icon className="mb-4 h-16 w-16 opacity-40" />
            <p className="text-sm font-medium text-white/80">{activeFile.name}</p>
            <p className="mt-1 text-xs">{formattedSize}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs text-slate-400">
          <span>{parentFolder ? `Inside ${parentFolder.name}` : `Updated ${new Date(activeFile.updatedAt).toLocaleDateString()}`}</span>
          <span>Press Esc to go back or close</span>
        </div>
      </motion.div>
      {imageMenu && activeFile.type === 'image' && createPortal(
        <div
          data-quick-look-image-menu
          role="menu"
          onClick={event => event.stopPropagation()}
          onContextMenu={event => event.preventDefault()}
          className="fixed z-[2147483647] w-[min(340px,calc(100vw-16px))] max-h-[min(75vh,560px)] overflow-y-auto rounded-2xl border border-white/15 bg-slate-900/95 p-2 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,.65)] backdrop-blur-2xl"
          style={{
            top: Math.max(8, Math.min(imageMenu.y, window.innerHeight - 440)),
            left: Math.max(8, Math.min(imageMenu.x, window.innerWidth - 348)),
          }}
        >
          <div className="grid grid-cols-4 gap-1 border-b border-white/10 pb-2">
            {imageQuickActions.map(({ label, icon, action }) => (
              <button
                key={label}
                type="button"
                role="menuitem"
                onClick={() => void runImageAction(action)}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition ${
                  label === 'Delete' ? 'text-rose-300 hover:bg-rose-500/15' : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <span className="text-sky-300">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-0.5 py-1">
            {imageMenuItem('Save to Abhishek OS…', <Save className="h-4 w-4" />, () => {
              setSaveDestination('choose');
            })}
            {imageMenuItem('Open in Photos app', <Image className="h-4 w-4" />, () => {
              setQuickLookFile(null);
              openApp('photos');
            })}
            {imageMenuItem('Copy as path', <Copy className="h-4 w-4" />, copyImagePath)}
            <div className="my-1 h-px bg-white/10" />
            {imageMenuItem('Resize image', <Image className="h-4 w-4" />, resizeActiveImage)}
            <div className="my-1 h-px bg-white/10" />
            {imageMenuItem('Set as lock screen', <LockKeyhole className="h-4 w-4" />, () => setImageWallpaper(true))}
            {imageMenuItem('Set as desktop background', <Image className="h-4 w-4" />, () => setImageWallpaper(false))}
            <div className="my-1 h-px bg-white/10" />
            {imageMenuItem('Show filmstrip', <Film className="h-4 w-4" />, () => setShowFilmstrip(true))}
            {imageMenuItem(
              slideshowFiles ? 'Stop slideshow' : 'Start slideshow',
              slideshowFiles ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />,
              () => {
                if (slideshowFiles) {
                  setSlideshowFiles(null);
                  return;
                }
                if (imageFiles.length < 2) throw new Error('Add at least two images to this app folder to start a slideshow.');
                const index = Math.max(0, imageFiles.findIndex(file => file.id === activeFile.id));
                setSlideshowIndex(index);
                setSlideshowFiles(imageFiles);
              },
              false,
              !slideshowFiles && imageFiles.length < 2,
            )}
          </div>
        </div>,
        document.body,
      )}
      {saveDestination === 'choose' && createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={event => {
            event.stopPropagation();
            if (event.target === event.currentTarget) setSaveDestination(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-look-save-title"
            className="w-full max-w-sm rounded-3xl border border-white/15 bg-slate-950 p-5 text-white shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <h2 id="quick-look-save-title" className="text-base font-bold">Save in Abhishek OS</h2>
            <p className="mt-1 text-xs text-slate-400">Choose an app folder. This saves a copy inside Abhishek OS.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                ['/Users/abhishek/Desktop', 'Desktop'],
                ['/Users/abhishek/Documents', 'Documents'],
                ['/Users/abhishek/Pictures', 'Pictures'],
                ['/Users/abhishek/Videos', 'Videos'],
              ].map(([path, label]) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => void saveImageToApp(path).catch(error => addNotification({
                    appId: 'finder',
                    title: 'Could not save image',
                    message: error instanceof Error ? error.message : String(error),
                    type: 'system',
                  }))}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-left text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-500/10"
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setSaveDestination(null)} className="mt-4 w-full rounded-xl px-3 py-2 text-xs text-slate-400 hover:bg-white/10">
              Cancel
            </button>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
};
