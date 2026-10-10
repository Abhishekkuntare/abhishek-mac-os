import { useEffect, useState } from 'react';
import { getPhotoLibraryItems, type PhotoLibraryItem } from './photoLibrary';

/**
 * Shared media hook for Photos and Videos.
 * It automatically refreshes when Camera saves a new photo/video.
 */
export const useOSPhotoLibrary = () => {
  const [items, setItems] = useState<PhotoLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    try {
      setItems(await getPhotoLibraryItems());
    } catch (error) {
      console.error('[Media Library] Could not load saved media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('abhishek-os-photo-added', handler);
    return () => window.removeEventListener('abhishek-os-photo-added', handler);
  }, []);

  return { items, isLoading, refresh };
};
