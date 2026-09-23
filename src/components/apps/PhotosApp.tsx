import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AnimatePresence, motion } from 'motion/react';

import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  FileImage,
  Heart,
  Image as ImageIcon,
  Images,
  Info,
  Maximize2,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

interface PhotoItem {
  id: string;
  title: string;
  url: string;
  category: string;
  fav: boolean;
  source: 'sample' | 'imported';
  createdAt: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

const SAMPLE_PHOTOS: PhotoItem[] = [
  {
    id: 'p1',
    title: 'Aurora Horizon',
    url: 'https://images.unsplash.com/photo-1579033461380-adb47c3eb938?q=90&w=1800&auto=format&fit=crop',
    category: 'Nature',
    fav: true,
    source: 'sample',
    createdAt: Date.now() - 100000,
  },
  {
    id: 'p2',
    title: 'Glass Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=90&w=1800&auto=format&fit=crop',
    category: 'Architecture',
    fav: true,
    source: 'sample',
    createdAt: Date.now() - 200000,
  },
  {
    id: 'p3',
    title: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=90&w=1800&auto=format&fit=crop',
    category: 'Urban',
    fav: false,
    source: 'sample',
    createdAt: Date.now() - 300000,
  },
  {
    id: 'p4',
    title: 'Deep Cosmic Nebula',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=90&w=1800&auto=format&fit=crop',
    category: 'Space',
    fav: true,
    source: 'sample',
    createdAt: Date.now() - 400000,
  },
  {
    id: 'p5',
    title: 'Glacial Alpine Peak',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=90&w=1800&auto=format&fit=crop',
    category: 'Nature',
    fav: false,
    source: 'sample',
    createdAt: Date.now() - 500000,
  },
  {
    id: 'p6',
    title: 'Sunset Coastline',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=90&w=1800&auto=format&fit=crop',
    category: 'Nature',
    fav: false,
    source: 'sample',
    createdAt: Date.now() - 600000,
  },
  {
    id: 'p7',
    title: 'Modern City',
    url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=90&w=1800&auto=format&fit=crop',
    category: 'Urban',
    fav: false,
    source: 'sample',
    createdAt: Date.now() - 700000,
  },
  {
    id: 'p8',
    title: 'Mountain Clouds',
    url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=90&w=1800&auto=format&fit=crop',
    category: 'Nature',
    fav: false,
    source: 'sample',
    createdAt: Date.now() - 800000,
  },
  {
    id: 'p9',
    title: 'Future Architecture',
    url: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=90&w=1800&auto=format&fit=crop',
    category: 'Architecture',
    fav: false,
    source: 'sample',
    createdAt: Date.now() - 900000,
  },
  {
    id: 'p10',
    title: 'Galaxy Dreams',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=90&w=1800&auto=format&fit=crop',
    category: 'Space',
    fav: true,
    source: 'sample',
    createdAt: Date.now() - 1000000,
  },
];

const CATEGORIES = [
  'All Photos',
  'Favorites',
  'Recently Added',
  'Nature',
  'Architecture',
  'Space',
  'Urban',
  'Imported',
];

const DB_NAME = 'abhishek-os-photos';
const DB_VERSION = 1;
const STORE_NAME = 'photos';

const openPhotoDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Could not open photo database.'));
  });
};

const getStoredPhotos = async (): Promise<PhotoItem[]> => {
  const db = await openPhotoDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve((request.result || []) as PhotoItem[]);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
};

const saveStoredPhoto = async (photo: PhotoItem) => {
  const db = await openPhotoDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.put(photo);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const deleteStoredPhoto = async (id: string) => {
  const db = await openPhotoDB();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

const updateStoredPhoto = async (photo: PhotoItem) => {
  if (photo.source !== 'imported') return;

  try {
    await saveStoredPhoto(photo);
  } catch {
    // Keep the UI functional even if persistence is unavailable.
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (timestamp: number) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
};

interface TiltCardProps {
  photo: PhotoItem;
  index: number;
  onClick: () => void;
  onFavorite: (event: React.MouseEvent) => void;
}

const TiltPhotoCard: React.FC<TiltCardProps> = ({
  photo,
  index,
  onClick,
  onFavorite,
}) => {
  const [rotation, setRotation] = useState({
    x: 0,
    y: 0,
  });

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = ((y / rect.height) - 0.5) * -10;

    setRotation({
      x: rotateX,
      y: rotateY,
    });
  };

  const resetRotation = () => {
    setRotation({
      x: 0,
      y: 0,
    });
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
        scale: 0.94,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay: Math.min(index * 0.035, 0.35),
        duration: 0.45,
      }}
      className="group relative"
      style={{
        perspective: '1200px',
      }}
    >
      <motion.div
        onPointerMove={handlePointerMove}
        onPointerLeave={resetRotation}
        onClick={onClick}
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
        }}
        whileHover={{
          y: -8,
          scale: 1.015,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 22,
        }}
        className="relative aspect-[1.12] rounded-[22px] overflow-hidden cursor-pointer bg-slate-900 border border-white/[0.08] shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
      >
        {/* Image */}
        <img
          src={photo.url}
          alt={photo.title}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Cinematic image treatment */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/90 pointer-events-none" />

        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Glass reflection */}
        <motion.div
          className="absolute -top-1/2 -left-1/3 w-[60%] h-[180%] bg-white/[0.08] rotate-[25deg] blur-xl pointer-events-none"
          animate={{
            x: ['-30%', '250%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
        />

        {/* Top controls */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10 text-[9px] text-white/80">
            {photo.category}
          </div>

          <button
            type="button"
            onClick={onFavorite}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                photo.fav
                  ? 'fill-rose-500 text-rose-500'
                  : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Bottom information */}
        <div className="absolute left-0 right-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate drop-shadow-lg">
                {photo.title}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-white/60">
                  {formatDate(photo.createdAt)}
                </span>

                {photo.source === 'imported' && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-[10px] text-cyan-300">
                      Imported
                    </span>
                  </>
                )}
              </div>
            </div>

            <motion.div
              whileHover={{
                scale: 1.1,
              }}
              className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center shrink-0"
            >
              <Expand className="w-3.5 h-3.5 text-white" />
            </motion.div>
          </div>
        </div>

        {/* 3D edge glow */}
        <div className="absolute inset-0 rounded-[22px] border border-white/10 pointer-events-none" />

        <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

export const PhotosApp: React.FC = () => {
  const { setWallpaper } = useOS();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const slideshowTimerRef = useRef<number | null>(null);

  const [photos, setPhotos] = useState<PhotoItem[]>(SAMPLE_PHOTOS);

  const [activeCategory, setActiveCategory] = useState('All Photos');

  const [search, setSearch] = useState('');

  const [selectedPhoto, setSelectedPhoto] =
    useState<PhotoItem | null>(null);

  const [showInfo, setShowInfo] = useState(false);

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);

  const [isSlideshow, setIsSlideshow] = useState(false);

  const [setSuccess, setSetSuccess] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [sortMode, setSortMode] = useState<
    'newest' | 'oldest' | 'name'
  >('newest');

  const showToast = useCallback((message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  /*
   * Load imported Photos from IndexedDB.
   */
  useEffect(() => {
    let mounted = true;

    const loadLibrary = async () => {
      try {
        const stored = await getStoredPhotos();

        if (mounted && stored.length) {
          setPhotos(prev => {
            const importedIds = new Set(stored.map(photo => photo.id));

            return [
              ...stored,
              ...prev.filter(photo => !importedIds.has(photo.id)),
            ];
          });
        }
      } catch {
        // IndexedDB may not be available in some environments.
      } finally {
        if (mounted) {
          setIsLoadingLibrary(false);
        }
      }
    };

    loadLibrary();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Keyboard shortcuts.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'f'
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === 'Escape') {
        setSelectedPhoto(null);
        setShowInfo(false);
        setIsSlideshow(false);
      }

      if (
        selectedPhoto &&
        event.key === 'ArrowRight'
      ) {
        navigatePhoto(1);
      }

      if (
        selectedPhoto &&
        event.key === 'ArrowLeft'
      ) {
        navigatePhoto(-1);
      }

      if (
        selectedPhoto &&
        event.key.toLowerCase() === 'f'
      ) {
        toggleFavorite(selectedPhoto.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  /*
   * Filter and sorting.
   */
  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    if (activeCategory === 'Favorites') {
      result = result.filter(photo => photo.fav);
    } else if (activeCategory === 'Recently Added') {
      result = result
        .filter(photo => photo.source === 'imported')
        .sort((a, b) => b.createdAt - a.createdAt);
    } else if (activeCategory === 'Imported') {
      result = result.filter(photo => photo.source === 'imported');
    } else if (activeCategory !== 'All Photos') {
      result = result.filter(
        photo => photo.category === activeCategory,
      );
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(photo =>
        `${photo.title} ${photo.category} ${photo.fileName || ''}`
          .toLowerCase()
          .includes(query),
      );
    }

    if (sortMode === 'newest') {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (sortMode === 'oldest') {
      result.sort((a, b) => a.createdAt - b.createdAt);
    }

    if (sortMode === 'name') {
      result.sort((a, b) =>
        a.title.localeCompare(b.title),
      );
    }

    return result;
  }, [
    photos,
    activeCategory,
    search,
    sortMode,
  ]);

  const importedCount = photos.filter(
    photo => photo.source === 'imported',
  ).length;

  const favoriteCount = photos.filter(
    photo => photo.fav,
  ).length;

  const toggleFavorite = useCallback(
    async (id: string) => {
      sound.playClick();

      let updatedPhoto: PhotoItem | undefined;

      setPhotos(prev =>
        prev.map(photo => {
          if (photo.id !== id) return photo;

          updatedPhoto = {
            ...photo,
            fav: !photo.fav,
          };

          return updatedPhoto;
        }),
      );

      if (updatedPhoto) {
        await updateStoredPhoto(updatedPhoto);
      }
    },
    [],
  );

  const handlePhotoSelect = (photo: PhotoItem) => {
    setSelectedPhoto(photo);
    setShowInfo(false);
    sound.playClick();
  };

  const navigatePhoto = useCallback(
    (direction: number) => {
      if (!selectedPhoto || filteredPhotos.length === 0) {
        return;
      }

      const currentIndex = filteredPhotos.findIndex(
        photo => photo.id === selectedPhoto.id,
      );

      if (currentIndex === -1) return;

      let nextIndex =
        currentIndex + direction;

      if (nextIndex < 0) {
        nextIndex = filteredPhotos.length - 1;
      }

      if (nextIndex >= filteredPhotos.length) {
        nextIndex = 0;
      }

      setSelectedPhoto(filteredPhotos[nextIndex]);
      sound.playClick();
    },
    [filteredPhotos, selectedPhoto],
  );

  const handleSetWallpaper = async (
    photo: PhotoItem,
  ) => {
    setWallpaper({
      id: photo.id,
      name: photo.title,
      url: photo.url,
      thumbnail: photo.url,
      category: 'nature',
    });

    sound.playClick();

    setSetSuccess(true);

    showToast('Desktop wallpaper updated');

    window.setTimeout(() => {
      setSetSuccess(false);
    }, 2200);
  };

  const handleDownload = (photo: PhotoItem) => {
    sound.playClick();

    const link = document.createElement('a');

    link.href = photo.url;
    link.download =
      photo.fileName ||
      `${photo.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;

    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Preparing photo download');
  };

  const handleDeletePhoto = async (
    photo: PhotoItem,
  ) => {
    if (photo.source !== 'imported') {
      showToast('Built-in Photos cannot be deleted');
      return;
    }

    const confirmed = window.confirm(
      `Move "${photo.title}" to Trash?`,
    );

    if (!confirmed) return;

    sound.playClick();

    await deleteStoredPhoto(photo.id);

    setPhotos(prev =>
      prev.filter(item => item.id !== photo.id),
    );

    setSelectedPhoto(null);

    showToast('Photo moved to Trash');
  };

  const importFiles = async (
    files: FileList | File[],
  ) => {
    const fileArray = Array.from(files);

    const imageFiles = fileArray.filter(file =>
      file.type.startsWith('image/'),
    );

    if (!imageFiles.length) {
      showToast('Please choose an image file');
      return;
    }

    sound.playClick();

    for (const file of imageFiles) {
      try {
        const dataUrl = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(
                  new Error('Invalid image result'),
                );
              }
            };

            reader.onerror = () =>
              reject(reader.error);

            reader.readAsDataURL(file);
          },
        );

        const newPhoto: PhotoItem = {
          id: `import-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
          title:
            file.name.replace(/\.[^/.]+$/, '') ||
            'Imported Photo',
          url: dataUrl,
          category: 'Imported',
          fav: false,
          source: 'imported',
          createdAt: Date.now(),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };

        await saveStoredPhoto(newPhoto);

        setPhotos(prev => [
          newPhoto,
          ...prev,
        ]);

        setSelectedPhoto(newPhoto);
      } catch {
        showToast(
          `Could not import ${file.name}`,
        );
      }
    }

    showToast(
      imageFiles.length === 1
        ? 'Photo added to Photos'
        : `${imageFiles.length} photos added to Photos`,
    );
  };

  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;

    if (files?.length) {
      importFiles(files);
    }

    event.target.value = '';
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    setIsDraggingFile(false);

    if (event.dataTransfer.files?.length) {
      importFiles(event.dataTransfer.files);
    }
  };

  const startSlideshow = () => {
    if (!filteredPhotos.length) return;

    setIsSlideshow(true);

    if (!selectedPhoto) {
      setSelectedPhoto(filteredPhotos[0]);
    }

    sound.playClick();
  };

  /*
   * Slideshow engine.
   */
  useEffect(() => {
    if (!isSlideshow) {
      if (slideshowTimerRef.current) {
        window.clearInterval(
          slideshowTimerRef.current,
        );

        slideshowTimerRef.current = null;
      }

      return;
    }

    slideshowTimerRef.current =
      window.setInterval(() => {
        setSelectedPhoto(current => {
          if (!current) {
            return filteredPhotos[0] || null;
          }

          const index = filteredPhotos.findIndex(
            photo => photo.id === current.id,
          );

          if (index === -1) {
            return filteredPhotos[0] || null;
          }

          return (
            filteredPhotos[
              (index + 1) %
                filteredPhotos.length
            ] || null
          );
        });
      }, 4000);

    return () => {
      if (slideshowTimerRef.current) {
        window.clearInterval(
          slideshowTimerRef.current,
        );

        slideshowTimerRef.current = null;
      }
    };
  }, [isSlideshow, filteredPhotos]);

  const selectedIndex = selectedPhoto
    ? filteredPhotos.findIndex(
        photo => photo.id === selectedPhoto.id,
      )
    : -1;

  return (
    <div
      className="relative flex-1 flex h-full min-h-0 bg-[#080b12] text-white select-none overflow-hidden"
      onDragOver={event => {
        event.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={event => {
        if (
          event.currentTarget ===
          event.target
        ) {
          setIsDraggingFile(false);
        }
      }}
      onDrop={handleDrop}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]"
          animate={{
            x: ['-10%', '15%', '-10%'],
            y: ['-10%', '20%', '-10%'],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="absolute right-0 bottom-0 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px]"
          animate={{
            x: ['10%', '-15%', '10%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      {/* Sidebar */}
      <motion.aside
        animate={{
          width: sidebarCollapsed ? 68 : 220,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="relative z-10 shrink-0 border-r border-white/[0.08] bg-black/25 backdrop-blur-2xl flex flex-col overflow-hidden"
      >
        <div className="h-14 px-3 border-b border-white/[0.08] flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -10,
                }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Images className="w-4 h-4" />
                </div>

                <div>
                  <div className="text-xs font-bold">
                    Photos
                  </div>
                  <div className="text-[9px] text-white/40">
                    Abhishek OS
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed(
                value => !value,
              );
              sound.playClick();
            }}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Library */}
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="space-y-1">
            {CATEGORIES.map(category => {
              const active =
                activeCategory === category;

              const Icon =
                category === 'All Photos'
                  ? Images
                  : category === 'Favorites'
                    ? Heart
                    : category ===
                        'Recently Added'
                      ? Archive
                      : category === 'Imported'
                        ? Upload
                        : ImageIcon;

              return (
                <motion.button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(
                      category,
                    );
                    sound.playClick();
                  }}
                  whileHover={{
                    x: 2,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  className={`relative w-full h-10 rounded-xl flex items-center gap-3 px-3 text-left transition-colors ${
                    active
                      ? 'text-white'
                      : 'text-white/45 hover:text-white/90 hover:bg-white/[0.05]'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="photos-sidebar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/25 to-indigo-500/10 border border-purple-400/10"
                    />
                  )}

                  <Icon
                    className={`relative z-10 w-4 h-4 shrink-0 ${
                      active
                        ? 'text-purple-300'
                        : ''
                    }`}
                  />

                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{
                          opacity: 0,
                        }}
                        animate={{
                          opacity: 1,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        className="relative z-10 text-[11px] font-medium whitespace-nowrap"
                      >
                        {category}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {!sidebarCollapsed &&
                    category ===
                      'Favorites' && (
                      <span className="relative z-10 ml-auto text-[9px] text-white/30">
                        {favoriteCount}
                      </span>
                    )}

                  {!sidebarCollapsed &&
                    category ===
                      'Imported' && (
                      <span className="relative z-10 ml-auto text-[9px] text-white/30">
                        {importedCount}
                      </span>
                    )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {!sidebarCollapsed && (
          <div className="p-3 border-t border-white/[0.08]">
            <div className="rounded-2xl bg-white/[0.035] border border-white/[0.07] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40">
                  Library
                </span>

                <span className="text-[10px] text-white/70">
                  {photos.length}
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        8,
                        photos.length * 4,
                      ),
                    )}%`,
                  }}
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400"
                />
              </div>

              <p className="text-[9px] text-white/30 mt-2">
                Imported photos are saved locally.
              </p>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 min-h-0">
        {/* Toolbar */}
        <header className="h-14 shrink-0 border-b border-white/[0.08] bg-black/20 backdrop-blur-2xl flex items-center gap-3 px-4">
          <div className="flex items-center gap-2 min-w-0">
            <motion.div
              animate={{
                rotate: [0, 4, -4, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
              className="hidden sm:flex w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 border border-white/10 items-center justify-center"
            >
              <ImageIcon className="w-4 h-4 text-purple-300" />
            </motion.div>

            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">
                {activeCategory}
              </h1>

              <p className="text-[9px] text-white/35">
                {filteredPhotos.length} photos
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 group-focus-within:text-purple-300 transition-colors" />

              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={event =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search your photos"
                className="w-full h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] focus:border-purple-400/40 focus:bg-white/[0.09] outline-none pl-9 pr-8 text-[11px] text-white placeholder:text-white/30 transition-all"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white/50" />
                </button>
              )}
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortMode}
            onChange={event => {
              setSortMode(
                event.target.value as
                  | 'newest'
                  | 'oldest'
                  | 'name',
              );
              sound.playClick();
            }}
            className="hidden md:block h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/70 px-2 outline-none"
          >
            <option
              value="newest"
              className="bg-slate-900"
            >
              Newest
            </option>
            <option
              value="oldest"
              className="bg-slate-900"
            >
              Oldest
            </option>
            <option
              value="name"
              className="bg-slate-900"
            >
              Name
            </option>
          </select>

          {/* Import */}
          <motion.label
            whileHover={{
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.96,
            }}
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer text-[10px] font-bold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              Import
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </motion.label>
        </header>

        {/* Hero strip */}
        <div className="px-4 pt-4">
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative h-24 rounded-[24px] overflow-hidden border border-white/[0.08] bg-gradient-to-r from-purple-950/50 via-indigo-950/30 to-cyan-950/30"
          >
            <motion.div
              animate={{
                x: ['-10%', '110%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute top-0 bottom-0 w-32 bg-white/[0.035] blur-2xl -skew-x-12"
            />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_80%_50%,rgba(34,211,238,0.12),transparent_30%)]" />

            <div className="relative h-full flex items-center justify-between px-5 sm:px-7">
              <div className="flex items-center gap-4 min-w-0">
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    transformStyle:
                      'preserve-3d',
                  }}
                  className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/[0.03] border border-white/10 items-center justify-center shadow-2xl"
                >
                  <Sparkles className="w-6 h-6 text-purple-300" />
                </motion.div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-400/15 text-[8px] text-purple-300 font-bold uppercase tracking-widest">
                      Photos
                    </span>

                    {isLoadingLibrary && (
                      <span className="text-[8px] text-white/30">
                        Syncing library...
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm sm:text-base font-bold truncate">
                    Your visual universe
                  </h2>

                  <p className="text-[9px] sm:text-[10px] text-white/40 mt-1">
                    Import, organize and turn your favorite moments into wallpapers.
                  </p>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={startSlideshow}
                className="hidden sm:flex h-9 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 items-center gap-2 text-[10px] font-bold backdrop-blur-xl"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Slideshow
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Photo grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPhotos.map(
                (photo, index) => (
                  <TiltPhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onClick={() =>
                      handlePhotoSelect(
                        photo,
                      )
                    }
                    onFavorite={event => {
                      event.stopPropagation();
                      toggleFavorite(
                        photo.id,
                      );
                    }}
                  />
                ),
              )}
            </div>
          ) : (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="h-full min-h-[350px] flex items-center justify-center"
            >
              <div className="text-center max-w-sm">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, 3, -3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                  }}
                  className="w-20 h-20 mx-auto rounded-[28px] bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-white/10 flex items-center justify-center shadow-2xl"
                >
                  <Images className="w-8 h-8 text-white/40" />
                </motion.div>

                <h3 className="mt-5 text-sm font-bold">
                  No photos here
                </h3>

                <p className="mt-2 text-[10px] text-white/35 leading-relaxed">
                  Import photos from your computer or try another category.
                </p>

                <label className="inline-flex mt-5 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-[10px] font-bold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 mr-2" />
                  Import Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Drag & drop overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="absolute inset-0 z-[80] bg-purple-950/70 backdrop-blur-xl flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{
                scale: 0.85,
                y: 20,
              }}
              animate={{
                scale: 1,
                y: 0,
              }}
              className="w-80 rounded-[32px] bg-white/[0.08] border border-white/20 p-8 text-center shadow-2xl"
            >
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                }}
                className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center shadow-2xl"
              >
                <Upload className="w-8 h-8" />
              </motion.div>

              <h3 className="text-base font-bold mt-5">
                Drop your photos here
              </h3>

              <p className="text-[10px] text-white/45 mt-2">
                They'll be saved inside your Photos library.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Photo Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6"
            onClick={() => {
              if (!isSlideshow) {
                setSelectedPhoto(null);
              }
            }}
          >
            {/* Viewer window */}
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.92,
                y: 30,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 20,
              }}
              transition={{
                type: 'spring',
                stiffness: 240,
                damping: 25,
              }}
              onClick={event =>
                event.stopPropagation()
              }
              className="relative w-full max-w-6xl h-[92vh] rounded-[28px] overflow-hidden bg-[#090c13]/95 border border-white/15 shadow-[0_40px_120px_rgba(0,0,0,0.7)] flex flex-col"
            >
              {/* Viewer toolbar */}
              <div className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPhoto(
                        null,
                      );
                      setIsSlideshow(false);
                    }}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {selectedPhoto.title}
                    </div>

                    <div className="text-[9px] text-white/35">
                      {selectedIndex + 1} of{' '}
                      {filteredPhotos.length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      toggleFavorite(
                        selectedPhoto.id,
                      )
                    }
                    className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 ${
                      selectedPhoto.fav
                        ? 'text-rose-400'
                        : 'text-white/50'
                    }`}
                    title="Favorite"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        selectedPhoto.fav
                          ? 'fill-current'
                          : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowInfo(
                        value => !value,
                      )
                    }
                    className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 ${
                      showInfo
                        ? 'bg-white/10 text-white'
                        : 'text-white/50'
                    }`}
                    title="Info"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        selectedPhoto,
                      )
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSetWallpaper(
                        selectedPhoto,
                      )
                    }
                    className="hidden sm:flex h-8 px-3 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/15 items-center gap-1.5 text-[9px] text-purple-200 font-bold"
                  >
                    {setSuccess ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Wallpaper
                  </button>
                </div>
              </div>

              {/* Viewer body */}
              <div className="flex-1 min-h-0 relative flex">
                {/* Image */}
                <div className="relative flex-1 min-w-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.10),transparent_50%)]">
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg,#fff 25%,transparent 25%),linear-gradient(-45deg,#fff 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#fff 75%),linear-gradient(-45deg,transparent 75%,#fff 75%)',
                      backgroundSize:
                        '20px 20px',
                      backgroundPosition:
                        '0 0,0 10px,10px -10px,-10px 0px',
                    }}
                  />

                  <AnimatePresence
                    mode="wait"
                  >
                    <motion.img
                      key={selectedPhoto.id}
                      initial={{
                        opacity: 0,
                        scale: 0.96,
                        x: 20,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.96,
                        x: -20,
                      }}
                      transition={{
                        duration: 0.35,
                      }}
                      src={selectedPhoto.url}
                      alt={selectedPhoto.title}
                      className="relative z-10 max-w-[92%] max-h-[82%] object-contain rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
                    />
                  </AnimatePresence>

                  {/* Previous */}
                  <button
                    type="button"
                    onClick={() =>
                      navigatePhoto(-1)
                    }
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/35 backdrop-blur-xl border border-white/10 hover:bg-black/55 flex items-center justify-center transition-all hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Next */}
                  <button
                    type="button"
                    onClick={() =>
                      navigatePhoto(1)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/35 backdrop-blur-xl border border-white/10 hover:bg-black/55 flex items-center justify-center transition-all hover:scale-105"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Slideshow indicator */}
                  {isSlideshow && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                      <motion.div
                        animate={{
                          scale: [1, 1.25, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                      />

                      <span className="text-[9px] text-white/70">
                        Slideshow
                      </span>
                    </div>
                  )}
                </div>

                {/* Info panel */}
                <AnimatePresence>
                  {showInfo && (
                    <motion.aside
                      initial={{
                        width: 0,
                        opacity: 0,
                      }}
                      animate={{
                        width: 260,
                        opacity: 1,
                      }}
                      exit={{
                        width: 0,
                        opacity: 0,
                      }}
                      className="shrink-0 overflow-hidden border-l border-white/10 bg-black/25 backdrop-blur-2xl"
                    >
                      <div className="w-[260px] p-5">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-xs font-bold">
                            Photo Info
                          </h3>

                          <Info className="w-4 h-4 text-white/30" />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">
                              Name
                            </div>

                            <div className="text-[11px] text-white/80 break-words">
                              {selectedPhoto.title}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">
                              Category
                            </div>

                            <div className="text-[11px] text-purple-300">
                              {selectedPhoto.category}
                            </div>
                          </div>

                          <div>
                            <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">
                              Added
                            </div>

                            <div className="text-[11px] text-white/60">
                              {formatDate(
                                selectedPhoto.createdAt,
                              )}
                            </div>
                          </div>

                          {selectedPhoto.fileName && (
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">
                                Original File
                              </div>

                              <div className="text-[11px] text-white/60 break-all">
                                {
                                  selectedPhoto.fileName
                                }
                              </div>
                            </div>
                          )}

                          {selectedPhoto.fileSize && (
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">
                                Size
                              </div>

                              <div className="text-[11px] text-white/60">
                                {formatFileSize(
                                  selectedPhoto.fileSize,
                                )}
                              </div>
                            </div>
                          )}

                          {selectedPhoto.mimeType && (
                            <div>
                              <div className="text-[9px] uppercase tracking-widest text-white/25 mb-1">
                                Format
                              </div>

                              <div className="text-[11px] text-white/60">
                                {
                                  selectedPhoto.mimeType
                                }
                              </div>
                            </div>
                          )}

                          <div className="pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <FileImage className="w-3.5 h-3.5 text-purple-300" />
                              </div>

                              <div>
                                <div className="text-[10px] font-semibold">
                                  {selectedPhoto.source ===
                                  'imported'
                                    ? 'Stored in Photos'
                                    : 'Built-in Photo'}
                                </div>

                                <div className="text-[8px] text-white/30">
                                  {selectedPhoto.source ===
                                  'imported'
                                    ? 'Persistent local library'
                                    : 'Abhishek OS collection'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedPhoto.source ===
                          'imported' && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeletePhoto(
                                selectedPhoto,
                              )
                            }
                            className="w-full mt-6 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-400/10 text-red-300 text-[10px] font-semibold flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Move to Trash
                          </button>
                        )}
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom filmstrip */}
              <div className="h-20 shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-xl px-4 flex items-center gap-2 overflow-x-auto">
                {filteredPhotos.map(
                  photo => (
                    <button
                      type="button"
                      key={photo.id}
                      onClick={() =>
                        setSelectedPhoto(
                          photo,
                        )
                      }
                      className={`relative shrink-0 w-14 h-12 rounded-lg overflow-hidden border transition-all ${
                        photo.id ===
                        selectedPhoto.id
                          ? 'border-purple-400 ring-2 ring-purple-400/20'
                          : 'border-white/10 opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      {photo.id ===
                        selectedPhoto.id && (
                        <div className="absolute inset-0 bg-purple-500/10" />
                      )}
                    </button>
                  ),
                )}

                <div className="ml-auto shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setIsSlideshow(
                        value => !value,
                      )
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSlideshow
                        ? 'bg-purple-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                    title="Slideshow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownload(
                        selectedPhoto,
                      )
                    }
                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 15,
              scale: 0.95,
            }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] px-4 py-2.5 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/15 shadow-2xl flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-purple-300" />
            </div>

            <span className="text-[10px] font-semibold text-white/85">
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};