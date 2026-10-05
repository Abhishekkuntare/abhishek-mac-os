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
