import { vfs } from './virtualFileSystem';

export type GhostDesktopItemType = 'file' | 'folder';

export const createGhostDesktopItem = (type: GhostDesktopItemType, name: string): string => {
  const safeName = name.trim();
  if (!safeName || safeName.length > 100 || /[\\/]/.test(safeName)) {
    throw new Error('Desktop names must be 1–100 characters and cannot contain slashes.');
  }

  const itemName = type === 'file' && !safeName.includes('.') ? `${safeName}.txt` : safeName;
  const desktop = '/Users/abhishek/Desktop';
  if (vfs.getFiles(desktop).some(file => file.name.toLocaleLowerCase() === itemName.toLocaleLowerCase())) {
    throw new Error(`A desktop item named "${itemName}" already exists.`);
  }

  if (type === 'folder') {
    vfs.createFolder(safeName, desktop);
  } else {
    const extension = itemName.includes('.') ? itemName.split('.').pop()!.toLowerCase() : 'txt';
    const code = ['py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'java', 'c', 'cpp'].includes(extension);
    vfs.createFile(itemName, desktop, code ? 'code' : 'document', '', extension);
  }
  return `Created ${type} "${itemName}" on the desktop.`;
};

export const getGhostLocalTime = () =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date());

export const renameGhostDesktopItem = (name: string, newName: string): string | null => {
  const target = vfs.getFiles('/Users/abhishek/Desktop')
    .find(file => file.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (!target) return null;
  if (!newName.trim() || newName.length > 100 || /[\\/]/.test(newName)) {
    throw new Error('Desktop names must be 1–100 characters and cannot contain slashes.');
  }
  if (!vfs.rename(target.id, newName)) throw new Error(`Could not rename "${name}".`);
  return `Renamed "${name}" to "${newName}".`;
};

export const deleteGhostDesktopItem = (name: string): string | null => {
  const target = vfs.getFiles('/Users/abhishek/Desktop')
    .find(file => file.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (!target) return null;
  if (!vfs.moveToTrash(target.id)) throw new Error(`Could not move "${name}" to Trash.`);
  return `Moved "${name}" to Trash.`;
};

export const searchGhostAuthorizedFiles = async (query: string): Promise<string[]> => {
  if (!window.electronAPI?.getLocalFolders || !window.electronAPI.searchAuthorizedFiles) {
    throw new Error('Authorized file search is unavailable in this ARLO OS build.');
  }
  const folders = await window.electronAPI.getLocalFolders();
  if (folders.length === 0) {
    throw new Error('Add an authorized folder in Finder settings before searching local files.');
  }
  const terms = query.split(/\s+/).filter(Boolean).slice(0, 8);
  if (terms.length === 0) throw new Error('A search term is required.');
  const results = await window.electronAPI.searchAuthorizedFiles(terms);
  return results.slice(0, 5).map(result =>
    `${result.name} — ${result.path}${result.snippet ? `\n${result.snippet.slice(0, 240)}` : ''}`,
  );
};
