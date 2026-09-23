import { useEffect, useState } from 'react';
import { getPhotoLibraryItems, PhotoLibraryItem } from './photoLibrary';

/**
 * Shared hook for the Photos app.
 * It automatically refreshes when Camera saves a new photo/video.
 */
export const useOSPhotoLibrary = () => {
  const [items, setItems] = useState<PhotoLibraryItem[]>([]);

  const refresh = async () => setItems(await getPhotoLibraryItems());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('abhishek-os-photo-added', handler);
    return () => window.removeEventListener('abhishek-os-photo-added', handler);
  }, []);

  return { items, refresh };
};
