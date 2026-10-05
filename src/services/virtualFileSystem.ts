import { VirtualFile } from '../types/desktop';
import { INITIAL_FILES } from '../data/sampleData';
import { deleteMediaBlob, readMediaBlob, storeMediaBlob } from './mediaStore';
import { clearUndoHistory, pushUndoAction } from './undoManager';

const VFS_STORAGE_KEY = 'abhishek_os_vfs_v1';

export class VirtualFileSystem {
  private files: VirtualFile[] = [];
  private clipboard: { ids: string[]; mode: 'copy' | 'cut' } | null = null;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(VFS_STORAGE_KEY);
      if (stored) {
        this.files = JSON.parse(stored);
        void this.hydrateMediaPreviews();
      } else {
        this.files = [...INITIAL_FILES];
        this.save();
      }
    } catch {
      this.files = [...INITIAL_FILES];
    }
  }

  private async hydrateMediaPreviews() {
    let changed = false;
    for (const file of this.files) {
      if (!file.mediaBlobId || file.isDeleted) continue;
      try {
        const blob = await readMediaBlob(file.mediaBlobId);
        if (!blob) continue;
        file.previewUrl = URL.createObjectURL(blob);
        changed = true;
      } catch (error) {
        console.error(`[VFS] Could not restore media preview for "${file.name}":`, error);
      }
    }
    if (changed) this.notify();
  }

  private removeStoredMedia(files: VirtualFile[]) {
    files.forEach(file => {
      if (!file.mediaBlobId) return;
      void deleteMediaBlob(file.mediaBlobId).catch(error => {
        console.error(`[VFS] Could not delete stored media for "${file.name}":`, error);
      });
    });
  }

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('VFS subscriber error:', err);
      }
    });
  }

  public save() {
    try {
      localStorage.setItem(
        VFS_STORAGE_KEY,
        JSON.stringify(this.files.map(({ previewUrl: _previewUrl, ...file }) => file)),
      );
    } catch (e) {
      console.warn('Failed to persist VFS', e);
    }
    this.notify();
  }

  private snapshotFiles(): VirtualFile[] {
    return this.files.map(file => ({ ...file }));
  }

  private recordFilesUndo(label: string, before: VirtualFile[]): void {
    const after = this.snapshotFiles();
    const beforeById = new Map(before.map(file => [file.id, file]));
    const afterById = new Map(after.map(file => [file.id, file]));
    const beforeIndex = new Map(before.map((file, index) => [file.id, index]));
    const afterIndex = new Map(after.map((file, index) => [file.id, index]));
    const changedIds = new Set([...beforeById.keys(), ...afterById.keys()]);
    const changes = [...changedIds]
      .filter(id => JSON.stringify(beforeById.get(id)) !== JSON.stringify(afterById.get(id)))
      .map(id => ({
        id,
        before: beforeById.get(id),
        after: afterById.get(id),
        beforeIndex: beforeIndex.get(id) ?? 0,
        afterIndex: afterIndex.get(id) ?? 0,
      }));

    const applyChanges = (direction: 'before' | 'after') => {
      changes.forEach(change => {
        const target = change[direction];
        const other = direction === 'before' ? change.after : change.before;
        const currentIndex = this.files.findIndex(file => file.id === change.id);

        if (!target) {
          if (currentIndex >= 0) this.files.splice(currentIndex, 1);
          return;
        }

        if (currentIndex < 0) {
          const targetIndex = direction === 'before' ? change.beforeIndex : change.afterIndex;
          this.files.splice(Math.min(targetIndex, this.files.length), 0, { ...target });
          return;
        }

        const current = this.files[currentIndex];
        if (!other) {
          this.files[currentIndex] = { ...target };
          return;
        }

        const keys = new Set([
          ...Object.keys(other),
          ...Object.keys(target),
        ]) as Set<keyof VirtualFile>;
        keys.forEach(key => {
          if (JSON.stringify(other[key]) === JSON.stringify(target[key])) return;
          if (key in target) {
            Object.assign(current, { [key]: target[key] });
          } else {
            delete (current as Partial<VirtualFile>)[key];
          }
        });
      });
      this.save();
    };

    pushUndoAction({
      label,
      undo: () => applyChanges('before'),
      redo: () => applyChanges('after'),
    });
  }

  public resetToDefault() {
    clearUndoHistory();
    this.files = [...INITIAL_FILES];
    this.save();
    return this.files;
  }

  public getFiles(path: string): VirtualFile[] {
    return this.files.filter(f => f.path === path && !f.isDeleted);
  }

  public getAllActiveFiles(): VirtualFile[] {
    return this.files.filter(f => !f.isDeleted);
  }

  public getActivitySnapshot(): VirtualFile[] {
    return this.files.map(file => ({ ...file, waveform: file.waveform ? [...file.waveform] : undefined }));
  }

  public getFavorites(): VirtualFile[] {
    return this.files.filter(f => f.isFavorite && !f.isDeleted);
  }

  public getTrash(): VirtualFile[] {
    return this.files.filter(f =>
      f.isDeleted && (!f.trashGroupId || f.trashGroupId === f.id)
    );
  }

  public getFileById(id: string): VirtualFile | undefined {
    return this.files.find(f => f.id === id);
  }

  public createFolder(name: string, currentPath: string): VirtualFile {
    const before = this.snapshotFiles();
    const newFolder: VirtualFile = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || 'Untitled Folder',
      path: currentPath,
      size: 0,
      type: 'folder',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.files.unshift(newFolder);
    this.recordFilesUndo(`Create folder "${newFolder.name}"`, before);
    this.save();
    return newFolder;
  }

  public createFile(
    name: string,
    currentPath: string,
    type: VirtualFile['type'] = 'document',
    content = '',
    extension = 'txt'
  ): VirtualFile {
    const before = this.snapshotFiles();
    const newFile: VirtualFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Untitled.${extension}`,
      path: currentPath,
      size: new TextEncoder().encode(content).byteLength,
      type,
      extension,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.files.unshift(newFile);
    this.recordFilesUndo(`Create "${newFile.name}"`, before);
    this.save();
    return newFile;
  }

  public async importBlob(
    blob: Blob,
    name: string,
    targetPath: string,
    type: Extract<VirtualFile['type'], 'image' | 'video' | 'audio'>,
  ): Promise<VirtualFile> {
    if (blob.size === 0) throw new Error('Cannot save an empty media file.');
    const safeName = name.trim();
    if (!safeName) throw new Error('A name is required to save media.');
    const before = this.snapshotFiles();
    const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await storeMediaBlob(id, blob);
    const file: VirtualFile = {
      id,
      name: safeName,
      path: targetPath,
      size: blob.size,
      type,
      extension: safeName.split('.').pop()?.toLowerCase() || (type === 'image' ? 'jpg' : type === 'video' ? 'webm' : 'audio'),
      mediaBlobId: id,
      previewUrl: URL.createObjectURL(blob),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.files.unshift(file);
    this.recordFilesUndo(`Import "${file.name}"`, before);
    this.save();
    return file;
  }

  public async readMedia(file: VirtualFile): Promise<Blob> {
    if (file.mediaBlobId) {
      const blob = await readMediaBlob(file.mediaBlobId);
      if (blob) return blob;
      throw new Error(`Stored media for "${file.name}" could not be found.`);
    }
    if (file.previewUrl) {
      const response = await fetch(file.previewUrl);
      if (!response.ok) throw new Error(`Could not read "${file.name}".`);
      return response.blob();
    }
    throw new Error(`"${file.name}" has no media data to save.`);
  }

  public updateFileContent(id: string, content: string): VirtualFile | undefined {
    const file = this.files.find(candidate =>
      candidate.id === id && !candidate.isDeleted && candidate.type !== 'folder'
    );
    if (!file) return undefined;

    file.content = content;
    file.size = new TextEncoder().encode(content).byteLength;
    file.updatedAt = new Date().toISOString();
    this.save();
    return file;
  }

  public moveFiles(
    ids: string[],
    targetPath: string
  ): { moved: VirtualFile[]; error?: string } {
    const selected = this.files.filter(file => ids.includes(file.id) && !file.isDeleted);
    if (selected.length !== ids.length) {
      return { moved: [], error: 'One or more items are no longer available.' };
    }

    const selectedIds = new Set(ids);
    const folders = selected.filter(file => file.type === 'folder');
    const invalidFolder = folders.find(folder => {
      const folderPath = `${folder.path.replace(/\/+$/, '')}/${folder.name}`.replace(/\/+/g, '/');
      return targetPath === folderPath || targetPath.startsWith(`${folderPath}/`);
    });
    if (invalidFolder) {
      return { moved: [], error: 'A folder cannot be moved into itself or one of its subfolders.' };
    }

    const directlyMoved = selected.filter(file =>
      !selected.some(parent => {
        if (parent.type !== 'folder' || parent.id === file.id) return false;
        const parentPath = `${parent.path.replace(/\/+$/, '')}/${parent.name}`.replace(/\/+/g, '/');
        return file.path === parentPath || file.path.startsWith(`${parentPath}/`);
      })
    );
    const collisions = directlyMoved.filter(file =>
      file.path !== targetPath &&
      this.files.some(candidate =>
        !candidate.isDeleted &&
        !selectedIds.has(candidate.id) &&
        candidate.path === targetPath &&
        candidate.name.toLocaleLowerCase() === file.name.toLocaleLowerCase()
      )
    );
    if (collisions.length > 0) {
      return {
        moved: [],
        error: `An item named "${collisions[0].name}" already exists on the Desktop.`,
      };
    }

    const before = this.snapshotFiles();
    const now = new Date().toISOString();
    directlyMoved.forEach(file => {
      const previousItemPath = `${file.path.replace(/\/+$/, '')}/${file.name}`.replace(/\/+/g, '/');
      const nextItemPath = `${targetPath.replace(/\/+$/, '')}/${file.name}`.replace(/\/+/g, '/');
      file.path = targetPath;
      file.updatedAt = now;
      if (file.type === 'folder') {
        this.files.forEach(descendant => {
          if (descendant.path === previousItemPath || descendant.path.startsWith(`${previousItemPath}/`)) {
            descendant.path = `${nextItemPath}${descendant.path.slice(previousItemPath.length)}`;
            descendant.updatedAt = now;
          }
        });
      }
    });

    this.recordFilesUndo(`Move ${directlyMoved.length} item(s)`, before);
    this.save();
    return { moved: directlyMoved };
  }

  public createHostShortcut(
    file: Pick<VirtualFile, 'hostPath' | 'name' | 'type' | 'size' | 'extension'>,
    targetPath: string
  ): VirtualFile {
    const before = this.snapshotFiles();
    const shortcut: VirtualFile = {
      id: `host-shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      hostPath: file.hostPath,
      name: file.name,
      path: targetPath,
      type: file.type,
      size: file.size,
      extension: file.extension,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.files.unshift(shortcut);
    this.recordFilesUndo(`Add "${shortcut.name}" to Desktop`, before);
    this.save();
    return shortcut;
  }

  public copyFiles(ids: string[]): void {
    this.clipboard = { ids: [...ids], mode: 'copy' };
  }

  public cutFiles(ids: string[]): void {
    this.clipboard = { ids: [...ids], mode: 'cut' };
  }

  public getClipboard(): { ids: string[]; mode: 'copy' | 'cut' } | null {
    return this.clipboard;
  }

  public clearClipboard(): void {
    this.clipboard = null;
  }

  public duplicate(id: string): VirtualFile | undefined {
    const original = this.files.find(f => f.id === id);
    if (!original) return undefined;

    const before = this.snapshotFiles();
    let newName = original.name;
    const parts = original.name.split('.');
    if (parts.length > 1 && original.type !== 'folder') {
      const ext = parts.pop();
      newName = `${parts.join('.')} copy.${ext}`;
    } else {
      newName = `${original.name} copy`;
    }

    const dup: VirtualFile = {
      ...original,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.files.unshift(dup);
    this.recordFilesUndo(`Duplicate "${original.name}"`, before);
    this.save();
    return dup;
  }

  public paste(targetPath: string): VirtualFile[] {
    if (!this.clipboard || this.clipboard.ids.length === 0) return [];
    const before = this.snapshotFiles();
    const results: VirtualFile[] = [];

    for (const id of this.clipboard.ids) {
      const file = this.files.find(f => f.id === id);
      if (!file) continue;

      if (this.clipboard.mode === 'cut') {
        file.path = targetPath;
        file.updatedAt = new Date().toISOString();
        results.push(file);
      } else {
        let newName = file.name;
        if (file.path === targetPath) {
          const parts = file.name.split('.');
          if (parts.length > 1 && file.type !== 'folder') {
            const ext = parts.pop();
            newName = `${parts.join('.')} copy.${ext}`;
          } else {
            newName = `${file.name} copy`;
          }
        }

        const copyFile: VirtualFile = {
          ...file,
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: newName,
          path: targetPath,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.files.unshift(copyFile);
        results.push(copyFile);
      }
    }

    if (this.clipboard.mode === 'cut') {
      this.clipboard = null;
    }
    if (results.length > 0) {
      this.recordFilesUndo(`Paste ${results.length} item(s)`, before);
    }
    this.save();
    return results;
  }

  public rename(id: string, newName: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file || !newName.trim()) return false;
    const before = this.snapshotFiles();
    const previousName = file.name;
    file.name = newName.trim();
    file.updatedAt = new Date().toISOString();
    this.recordFilesUndo(`Rename "${previousName}"`, before);
    this.save();
    return true;
  }

  public toggleFavorite(id: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file) return false;
    const before = this.snapshotFiles();
    file.isFavorite = !file.isFavorite;
    this.recordFilesUndo(`${file.isFavorite ? 'Favorite' : 'Unfavorite'} "${file.name}"`, before);
    this.save();
    return !!file.isFavorite;
  }

  public moveToTrash(id: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file || file.isDeleted) return false;
    const before = this.snapshotFiles();
    const trashGroupId = file.id;
    const now = new Date().toISOString();
    const affectedFiles = file.type === 'folder'
      ? this.files.filter(candidate => {
          if (candidate === file || candidate.isDeleted) return candidate === file;
          const folderPath = `${file.path.replace(/\/+$/, '')}/${file.name}`.replace(/\/+/g, '/');
          return candidate.path === folderPath || candidate.path.startsWith(`${folderPath}/`);
        })
      : [file];
    affectedFiles.forEach(candidate => {
      candidate.isDeleted = true;
      candidate.trashGroupId = trashGroupId;
      candidate.updatedAt = now;
    });
    this.recordFilesUndo(`Move "${file.name}" to Trash`, before);
    this.save();
    return true;
  }

  public restoreFromTrash(id: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file || !file.isDeleted) return false;
    const before = this.snapshotFiles();
    const now = new Date().toISOString();
    const groupId = file.trashGroupId || file.id;
    this.files
      .filter(candidate => candidate.isDeleted && candidate.trashGroupId === groupId)
      .forEach(candidate => {
        candidate.isDeleted = false;
        delete candidate.trashGroupId;
        candidate.updatedAt = now;
      });
    if (!file.trashGroupId) {
      file.isDeleted = false;
      file.updatedAt = now;
    }
    this.recordFilesUndo(`Restore "${file.name}"`, before);
    this.save();
    return true;
  }

  public deletePermanently(id: string): boolean {
    const file = this.files.find(f => f.id === id && f.isDeleted);
    if (!file) return false;
    clearUndoHistory();
    const groupId = file.trashGroupId || file.id;
    const removedFiles = this.files.filter(candidate =>
      (candidate.isDeleted && candidate.trashGroupId === groupId) || candidate.id === id
    );
    this.removeStoredMedia(removedFiles);
    this.files = this.files.filter(candidate =>
      !(candidate.isDeleted && candidate.trashGroupId === groupId) &&
      candidate.id !== id
    );
    this.save();
    return true;
  }

  public emptyTrash(): number {
    const initialCount = this.files.length;
    if (this.files.some(file => file.isDeleted)) clearUndoHistory();
    this.removeStoredMedia(this.files.filter(file => file.isDeleted));
    this.files = this.files.filter(f => !f.isDeleted);
    this.save();
    return initialCount - this.files.length;
  }

  public search(query: string): VirtualFile[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.files.filter(
      f => !f.isDeleted && (f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
    );
  }

  public ensureDirectoryExists(folderPath: string): void {
    const parts = folderPath.split('/').filter(Boolean);
    let current = '';
    for (let i = 0; i < parts.length; i++) {
      const parent = current ? current : '/';
      current = current ? `${current}/${parts[i]}` : `/${parts[i]}`;
      const exists = this.files.some(f => f.type === 'folder' && f.path === parent && f.name === parts[i]);
      if (!exists && parts[i] !== 'Users' && parts[i] !== 'abhishek') {
        this.createFolder(parts[i], parent);
      }
    }
  }

  /**
   * Imports files from the user's computer into ARLO OS.
   * Reads real files (images, audio, videos, code, documents) preserving folder hierarchy
   */
  public async importLocalFiles(
    files: FileList | File[],
    targetPath = '/Users/abhishek/Desktop'
  ): Promise<VirtualFile[]> {
    const before = this.snapshotFiles();
    const fileArray = Array.from(files);
    const createdFiles: VirtualFile[] = [];

    for (const file of fileArray) {
      try {
        const relativePath = file.webkitRelativePath || '';
        let destPath = targetPath;

        if (relativePath) {
          const pathParts = relativePath.split('/');
          pathParts.pop(); // Remove file name
          if (pathParts.length > 0) {
            destPath = `${targetPath}/${pathParts.join('/')}`;
            this.ensureDirectoryExists(destPath);
          }
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const type = this.detectFileType(file.name, file.type);

        let previewUrl: string | undefined = undefined;
        let mediaBlobId: string | undefined;
        let content = '';

        if (type === 'image' || type === 'video' || type === 'audio') {
          mediaBlobId = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          await storeMediaBlob(mediaBlobId, file);
          previewUrl = URL.createObjectURL(file);
        } else if (file.size < 500000) {
          // Text/code file
          try {
            content = await file.text();
          } catch {
            content = '';
          }
        }

        const newFile: VirtualFile = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          name: file.name,
          path: destPath,
          size: file.size,
          type,
          extension: ext,
          content,
          previewUrl,
          mediaBlobId,
          createdAt: new Date(file.lastModified || Date.now()).toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.files.unshift(newFile);
        createdFiles.push(newFile);
      } catch (err) {
        console.warn('Failed to import file:', file.name, err);
      }
    }

    if (createdFiles.length > 0) {
      this.recordFilesUndo(`Import ${createdFiles.length} item(s)`, before);
    }
    this.save();
    return createdFiles;
  }

  /**
   * Modern File System Access API: Recursively scan a selected folder from user's laptop/PC
   */
  public async importFromDirectoryPicker(
    dirHandle: any,
    targetPath = '/Users/abhishek/Local Computer'
  ): Promise<number> {
    let count = 0;
    const folderPath = `${targetPath}/${dirHandle.name}`;
    this.createFolder(dirHandle.name, targetPath);

    const scanDirectory = async (handle: any, currentPath: string) => {
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          try {
            const file = await entry.getFile();
            await this.importLocalFiles([file], currentPath);
            count++;
          } catch (e) {
            console.warn('Error reading file from handle', e);
          }
        } else if (entry.kind === 'directory') {
          const subPath = `${currentPath}/${entry.name}`;
          this.createFolder(entry.name, currentPath);
          await scanDirectory(entry, subPath);
        }
      }
    };

    await scanDirectory(dirHandle, folderPath);
    this.save();
    return count;
  }

  private detectFileType(name: string, mimeType: string): VirtualFile['type'] {
    const ext = name.split('.').pop()?.toLowerCase() || '';

    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) {
      return 'image';
    }
    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)) {
      return 'video';
    }
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'].includes(ext)) {
      return 'audio';
    }
    if (
      ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'sh', 'sql', 'md'].includes(ext)
    ) {
      return 'code';
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return 'archive';
    }
    if (['exe', 'app', 'dmg', 'deb', 'rpm'].includes(ext)) {
      return 'app';
    }
    return 'document';
  }
}

export const vfs = new VirtualFileSystem();
