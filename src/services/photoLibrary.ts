export type PhotoLibraryKind = 'photo' | 'video';

export interface PhotoLibraryItem {
  id: string;
  kind: PhotoLibraryKind;
  url: string;
  thumbnailUrl?: string;
  createdAt: number;
  width?: number;
  height?: number;
  duration?: number;
  facingMode?: 'user' | 'environment';
  source: string;
}

const DB_NAME = 'abhishek_os_photo_library';
const STORE = 'media';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const createThumbnail = (blob: Blob, kind: PhotoLibraryKind): Promise<Blob | undefined> => {
  if (kind !== 'photo') return Promise.resolve(undefined);
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const max = 480;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(t => {
        URL.revokeObjectURL(url);
        resolve(t || undefined);
      }, 'image/jpeg', .82);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });
};

const putMedia = async (
  blob: Blob,
  meta: Omit<PhotoLibraryItem, 'id' | 'url' | 'thumbnailUrl' | 'createdAt'>,
) => {
  const db = await openDB();
  const id = `camera-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
  const thumbnailBlob = await createThumbnail(blob, meta.kind);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      ...meta,
      id,
      blob,
      thumbnailBlob,
      createdAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  const item = await getPhotoLibraryItem(id);
  if (!item) throw new Error('Could not save camera media.');

  window.dispatchEvent(new CustomEvent('abhishek-os-photo-added', { detail: item }));
  return item;
};

export const addPhotoToLibrary = (
  blob: Blob,
  meta: { width?: number; height?: number; facingMode?: 'user' | 'environment'; source?: string } = {},
) => putMedia(blob, {
  kind: 'photo',
  source: meta.source || 'Camera',
  width: meta.width,
  height: meta.height,
  facingMode: meta.facingMode,
});

export const addVideoToLibrary = (
  blob: Blob,
  meta: { duration?: number; facingMode?: 'user' | 'environment'; source?: string } = {},
) => putMedia(blob, {
  kind: 'video',
  source: meta.source || 'Camera',
  duration: meta.duration,
  facingMode: meta.facingMode,
});

export const getPhotoLibraryItem = async (id: string): Promise<PhotoLibraryItem | null> => {
  const db = await openDB();
  const raw: any = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!raw) return null;

  return {
    ...raw,
    url: URL.createObjectURL(raw.blob),
    thumbnailUrl: raw.thumbnailBlob ? URL.createObjectURL(raw.thumbnailBlob) : undefined,
  };
};

export const getPhotoLibraryItems = async (): Promise<PhotoLibraryItem[]> => {
  const db = await openDB();
  const rawItems: any[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).index('createdAt').getAll();
    request.onsuccess = () => resolve((request.result || []).reverse());
    request.onerror = () => reject(request.error);
  });
  db.close();

  return rawItems.map(raw => ({
    ...raw,
    url: URL.createObjectURL(raw.blob),
    thumbnailUrl: raw.thumbnailBlob ? URL.createObjectURL(raw.thumbnailBlob) : undefined,
  }));
};

export const deletePhotoLibraryItem = async (id: string) => {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};
