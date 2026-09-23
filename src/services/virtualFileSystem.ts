import { VirtualFile } from '../types/desktop';
import { INITIAL_FILES } from '../data/sampleData';

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
      } else {
        this.files = [...INITIAL_FILES];
        this.save();
      }
    } catch {
      this.files = [...INITIAL_FILES];
    }
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
      localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(this.files));
    } catch (e) {
      console.warn('Failed to persist VFS', e);
    }
    this.notify();
  }

  public resetToDefault() {
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

  public getFavorites(): VirtualFile[] {
    return this.files.filter(f => f.isFavorite && !f.isDeleted);
  }

  public getTrash(): VirtualFile[] {
    return this.files.filter(f => f.isDeleted);
  }

  public getFileById(id: string): VirtualFile | undefined {
    return this.files.find(f => f.id === id);
  }

  public createFolder(name: string, currentPath: string): VirtualFile {
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
    const newFile: VirtualFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || `Untitled.${extension}`,
      path: currentPath,
      size: content.length || 1024,
      type,
      extension,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.files.unshift(newFile);
    this.save();
    return newFile;
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
    this.save();
    return dup;
  }

  public paste(targetPath: string): VirtualFile[] {
    if (!this.clipboard || this.clipboard.ids.length === 0) return [];
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
    this.save();
    return results;
  }

  public rename(id: string, newName: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file || !newName.trim()) return false;
    file.name = newName.trim();
    file.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public toggleFavorite(id: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file) return false;
    file.isFavorite = !file.isFavorite;
    this.save();
    return !!file.isFavorite;
  }

  public moveToTrash(id: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file) return false;
    file.isDeleted = true;
    file.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public restoreFromTrash(id: string): boolean {
    const file = this.files.find(f => f.id === id);
    if (!file) return false;
    file.isDeleted = false;
    file.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public deletePermanently(id: string): boolean {
    const index = this.files.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.files.splice(index, 1);
    this.save();
    return true;
  }

  public emptyTrash(): number {
    const initialCount = this.files.length;
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
   * Imports files from the user's computer into Abhishek OS.
   * Reads real files (images, audio, videos, code, documents) preserving folder hierarchy
   */
  public async importLocalFiles(
    files: FileList | File[],
    targetPath = '/Users/abhishek/Desktop'
  ): Promise<VirtualFile[]> {
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
        let content = '';

        if (type === 'image' || type === 'video' || type === 'audio') {
          // Create an object URL so media can be viewed/played natively
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
          createdAt: new Date(file.lastModified || Date.now()).toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.files.unshift(newFile);
        createdFiles.push(newFile);
      } catch (err) {
        console.warn('Failed to import file:', file.name, err);
      }
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

