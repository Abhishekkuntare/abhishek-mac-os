import type { VirtualFile } from '../types/desktop';

export type FileOpenTarget = 'nextpad' | 'codestudio' | 'quicklook' | 'music' | 'tv';

const TEXT_EXTENSIONS = new Set(['txt', 'md']);
const CODE_EXTENSIONS = new Set([
  'c', 'cc', 'cpp', 'cs', 'css', 'cjs', 'cxx', 'go', 'h', 'hh', 'hpp', 'hxx',
  'html', 'java', 'js', 'jsx', 'json', 'mjs', 'php', 'py', 'pyw', 'rb', 'rs',
  'sh', 'sql', 'swift', 'ts', 'tsx', 'xml', 'yaml', 'yml',
]);

export const getFileOpenTarget = (
  name: string,
  extension?: string,
  mediaType?: VirtualFile['type'],
): FileOpenTarget => {
  const normalizedExtension = (extension || name.split('.').pop() || '').toLowerCase();
  if (normalizedExtension === 'pdf') return 'quicklook';
  if (TEXT_EXTENSIONS.has(normalizedExtension)) return 'nextpad';
  if (CODE_EXTENSIONS.has(normalizedExtension) || mediaType === 'code') return 'codestudio';
  if (mediaType === 'audio') return 'music';
  if (mediaType === 'video') return 'tv';
  return 'quicklook';
};

export const openVirtualFile = (
  file: VirtualFile,
  openApp: (appId: string) => void,
  setQuickLookFile: (file: VirtualFile) => void,
): void => {
  if (file.type === 'folder') {
    try {
      localStorage.setItem('finder-pending-open-path', `${file.path.replace(/\/+$/, '')}/${file.name}`);
    } catch (error) {
      console.error('[File Associations] Could not save the folder destination.', error);
    }
    openApp('finder');
    window.dispatchEvent(new CustomEvent('finder:open-host-path', {
      detail: `${file.path.replace(/\/+$/, '')}/${file.name}`,
    }));
    return;
  }

  const target = getFileOpenTarget(file.name, file.extension, file.type);
  if (target === 'quicklook') {
    setQuickLookFile(file);
    return;
  }

  if (target === 'music' || target === 'tv') {
    openApp(target);
    return;
  }

  const request = {
    name: file.name,
    content: file.content ?? '',
    path: `${file.path.replace(/\/+$/, '')}/${file.name}`,
    vfsFileId: file.id,
  };
  const appId = target === 'nextpad' ? 'nextpad' : 'codestudio';
  const storageKey = target === 'nextpad'
    ? 'nextpad-pending-open-file'
    : 'code-studio-pending-open-file';
  const eventName = target === 'nextpad'
    ? 'nextpad:open-file'
    : 'code-studio:open-file';

  try {
    localStorage.setItem(storageKey, JSON.stringify(request));
  } catch (error) {
    console.error(`[File Associations] Could not queue "${file.name}" for ${appId}.`, error);
  }
  openApp(appId);
  window.dispatchEvent(new CustomEvent(eventName, { detail: request }));
};
