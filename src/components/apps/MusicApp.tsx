import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { motion, AnimatePresence } from 'motion/react';

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Heart,
  Repeat,
  Shuffle,
  ListMusic,
  FolderOpen,
  Radio,
  Sparkles,
  Disc3,
  MoreHorizontal,
  Search,
  X,
  Upload,
  Headphones,
  Waves,
  Library,
  HardDrive,
  Trash2,
  ChevronRight,
  Mic2,
  Maximize2,
  Minimize2,
  Check,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { AUDIO_TRACKS } from '../../data/sampleData';
import { sound } from '../../services/soundService';
import { musicEngine } from '../../services/musicEngine';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface PersistedLocalTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}

interface LocalTrackRecord {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  isLocal?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DB_NAME = 'abhishek-os-music-library';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';

const LOCAL_COVERS = [
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1521337581100-8ca9a73a5f79?q=80&w=800&auto=format&fit=crop',
];

/* -------------------------------------------------------------------------- */
/* IndexedDB                                                                  */
/* -------------------------------------------------------------------------- */

const openMusicDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

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
      reject(request.error || new Error('Unable to open music database.'));
  });
};

const saveLocalTrack = async (
  track: PersistedLocalTrack
): Promise<void> => {
  const db = await openMusicDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.put(track);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error('Unable to save imported audio.')
      );
    };
  });
};

const getLocalTracks = async (): Promise<PersistedLocalTrack[]> => {
  const db = await openMusicDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };

    request.onerror = () => {
      db.close();
      reject(
        request.error ||
          new Error('Unable to read music library.')
      );
    };
  });
};

const deleteLocalTrack = async (id: string): Promise<void> => {
  const db = await openMusicDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    store.delete(id);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };

    transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ||
          new Error('Unable to remove track.')
      );
    };
  });
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatTime = (secs: number) => {
  if (!Number.isFinite(secs) || secs < 0) {
    return '0:00';
  }

  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise(resolve => {
    const audio = document.createElement('audio');
    const objectUrl = URL.createObjectURL(file);

    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration)
        ? audio.duration
        : 210;

      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(210);
    };

    audio.src = objectUrl;
  });
};

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const MusicApp: React.FC = () => {
  const {
    currentTrackIndex,
    currentTrack,
    isPlayingMusic,
    musicProgress,
    togglePlayMusic,
    nextTrack,
    prevTrack,
    setMusicProgress,
    userTracks,
    addCustomTrack,
    settings,
    updateSettings,
  } = useOS();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const restoredTracksRef = useRef(false);

  const [visualizerBars, setVisualizerBars] = useState<number[]>(
    () => Array.from({ length: 36 }, () => 5)
  );

  const [activeTab, setActiveTab] = useState<
    'nowPlaying' | 'library'
  >('nowPlaying');

  const [search, setSearch] = useState('');

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isFullscreenPlayer, setIsFullscreenPlayer] =
    useState(false);

  const [isShuffle, setIsShuffle] = useState(false);

  const [isRepeat, setIsRepeat] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);

  const [showTrackMenu, setShowTrackMenu] = useState(false);

  const [importedLocalTracks, setImportedLocalTracks] =
    useState<LocalTrackRecord[]>([]);

  const [toast, setToast] = useState<string | null>(null);

  /* ---------------------------------------------------------------------- */
  /* Tracks                                                                 */
  /* ---------------------------------------------------------------------- */

  const allTracks = useMemo(() => {
    return [...AUDIO_TRACKS, ...userTracks];
  }, [userTracks]);

  const filteredTracks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return allTracks;
    }

    return allTracks.filter(track => {
      return (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
      );
    });
  }, [allTracks, search]);

  /* ---------------------------------------------------------------------- */
  /* Toast                                                                  */
  /* ---------------------------------------------------------------------- */

  const showToast = useCallback((message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Restore imported music from IndexedDB                                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (restoredTracksRef.current) {
      return;
    }

    restoredTracksRef.current = true;

    const restoreTracks = async () => {
      try {
        const stored = await getLocalTracks();

        const restored: LocalTrackRecord[] = [];

        for (const track of stored) {
          const audioUrl = URL.createObjectURL(track.blob);

          const restoredTrack: LocalTrackRecord = {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            coverUrl:
              LOCAL_COVERS[
                restored.length % LOCAL_COVERS.length
              ],
            audioUrl,
            isLocal: true,
          };

          restored.push(restoredTrack);

          const alreadyExists = userTracks.some(
            existing => existing.id === track.id
          );

          if (!alreadyExists) {
            addCustomTrack(restoredTrack);
          }
        }

        setImportedLocalTracks(restored);
      } catch {
        showToast('Could not restore local music.');
      }
    };

    restoreTracks();
  }, [addCustomTrack, showToast, userTracks]);

  /* ---------------------------------------------------------------------- */
  /* Visualizer                                                             */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isPlayingMusic) {
      setVisualizerBars(
        Array.from({ length: 36 }, () => 5)
      );

      return;
    }

    const interval = window.setInterval(() => {
      try {
        const data = musicEngine.getVisualizerData();

        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.slice(0, 36).map(value =>
            Math.max(5, Math.min(64, value))
          );

          while (normalized.length < 36) {
            normalized.push(5);
          }

          setVisualizerBars(normalized);
        } else {
          setVisualizerBars(
            Array.from({ length: 36 }, () =>
              Math.floor(Math.random() * 45) + 8
            )
          );
        }
      } catch {
        setVisualizerBars(
          Array.from({ length: 36 }, () =>
            Math.floor(Math.random() * 45) + 8
          )
        );
      }
    }, 70);

    return () => window.clearInterval(interval);
  }, [isPlayingMusic]);

  /* ---------------------------------------------------------------------- */
  /* Scrubbing                                                              */
  /* ---------------------------------------------------------------------- */

  const handleScrubClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect =
      e.currentTarget.getBoundingClientRect();

    const clickX = e.clientX - rect.left;

    const pct = Math.max(
      0,
      Math.min(100, (clickX / rect.width) * 100)
    );

    setMusicProgress(pct);
  };

  /* ---------------------------------------------------------------------- */
  /* Import audio                                                           */
  /* ---------------------------------------------------------------------- */

  const handleImportLocalAudio = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const imported: LocalTrackRecord[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith('audio/')) {
        continue;
      }

      try {
        const duration = await getAudioDuration(file);

        const id = `local-track-${Date.now()}-${i}`;

        const audioUrl = URL.createObjectURL(file);

        const track: LocalTrackRecord = {
          id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'My Local Music',
          album: 'Imported from Computer',
          duration,
          coverUrl:
            LOCAL_COVERS[i % LOCAL_COVERS.length] ||
            DEFAULT_COVER,
          audioUrl,
          isLocal: true,
        };

        imported.push(track);

        await saveLocalTrack({
          id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration,
          fileName: file.name,
          mimeType: file.type,
          blob: file,
          createdAt: Date.now(),
        });

        addCustomTrack(track);
      } catch {
        showToast(`Could not import ${file.name}`);
      }
    }

    if (imported.length > 0) {
      setImportedLocalTracks(prev => [
        ...imported,
        ...prev,
      ]);

      sound.playNotification();

      showToast(
        `${imported.length} ${
          imported.length === 1 ? 'song' : 'songs'
        } added to your library`
      );

      setActiveTab('library');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Drag and Drop                                                          */
  /* ---------------------------------------------------------------------- */

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    setIsDraggingFile(true);
  };

  const handleDragLeave = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    if (
      e.currentTarget === dropZoneRef.current
    ) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      return;
    }

    const fakeEvent = {
      target: {
        files,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await handleImportLocalAudio(fakeEvent);
  };

  /* ---------------------------------------------------------------------- */
  /* Track selection                                                        */
  /* ---------------------------------------------------------------------- */

  const handleTrackSelect = (index: number) => {
    const difference =
      index - currentTrackIndex;

    if (difference === 0) {
      if (!isPlayingMusic) {
        togglePlayMusic();
      }

      return;
    }

    /*
     * OSContext currently exposes nextTrack/prevTrack rather than
     * setCurrentTrackIndex. We therefore navigate using the existing
     * music API instead of changing OSContext.
     */
    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        nextTrack();
      }
    } else {
      for (let i = 0; i < Math.abs(difference); i++) {
        prevTrack();
      }
    }

    if (!isPlayingMusic) {
      togglePlayMusic();
    }

    sound.playClick();
  };

  /* ---------------------------------------------------------------------- */
  /* Keyboard shortcuts                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayMusic();
      }

      if (e.code === 'ArrowRight') {
        nextTrack();
      }

      if (e.code === 'ArrowLeft') {
        prevTrack();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyboard
      );
    };
  }, [
    nextTrack,
    prevTrack,
    togglePlayMusic,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Time                                                                   */
  /* ---------------------------------------------------------------------- */

  const currentSeconds = Math.round(
    ((musicProgress || 0) / 100) *
      (currentTrack.duration || 180)
  );

  const progress =
    Math.min(
      100,
      Math.max(0, musicProgress || 0)
    );

  /* ---------------------------------------------------------------------- */
  /* UI                                                                      */
  /* ---------------------------------------------------------------------- */

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col h-full overflow-hidden select-none text-white bg-[#06070c]"
    >
      {/* ---------------------------------------------------------------- */}
      {/* Ambient 3D background                                             */}
      {/* ---------------------------------------------------------------- */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: isPlayingMusic
              ? [1, 1.15, 1]
              : 1,
            opacity: isPlayingMusic
              ? [0.16, 0.28, 0.16]
              : 0.12,
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-[650px] h-[650px] rounded-full bg-pink-500/20 blur-[130px] -top-72 left-1/2 -translate-x-1/2"
        />

        <motion.div
          animate={{
            x: isPlayingMusic
              ? [-30, 40, -30]
              : 0,
            y: isPlayingMusic
              ? [20, -20, 20]
              : 0,
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute w-[450px] h-[450px] rounded-full bg-purple-600/15 blur-[120px] bottom-[-180px] left-[-100px]"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Drag overlay                                                       */}
      {/* ---------------------------------------------------------------- */}

      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full" />

              <motion.div
                animate={{
                  y: [-8, 8, -8],
                  rotate: [-2, 2, -2],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="relative w-72 rounded-[32px] border border-pink-300/30 bg-white/10 backdrop-blur-2xl p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-[0_15px_50px_rgba(236,72,153,0.45)] mb-5">
                  <Upload className="w-9 h-9" />
                </div>

                <h3 className="text-xl font-black">
                  Drop your music
                </h3>

                <p className="text-xs text-slate-400 mt-2">
                  Your audio will be stored in the
                  Abhishek OS Music Library.
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* Header                                                             */}
      {/* ---------------------------------------------------------------- */}

      <header className="relative z-20 h-16 shrink-0 px-5 flex items-center justify-between border-b border-white/[0.08] bg-black/25 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{
              rotate: -8,
              scale: 1.08,
            }}
            className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_30px_rgba(168,85,247,0.35)]"
          >
            <Music className="w-4 h-4" />

            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute -right-1 -top-1 w-3 h-3 rounded-full border border-white/40 bg-white/20 backdrop-blur-md"
            />
          </motion.div>

          <div>
            <div className="text-sm font-black tracking-tight">
              Music
            </div>

            <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
              Abhishek OS Audio
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-white/[0.045] border border-white/[0.07]">
          <button
            onClick={() => setActiveTab('nowPlaying')}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'nowPlaying'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Now Playing
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'library'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Library
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex relative items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />

            <input
              value={search}
              onChange={e =>
                setSearch(e.target.value)
              }
              placeholder="Search music"
              className="w-44 lg:w-56 h-8 pl-9 pr-3 rounded-xl bg-white/[0.06] border border-white/[0.08] outline-none text-[11px] placeholder:text-slate-600 focus:border-pink-400/40 transition-all"
            />
          </div>

          <button
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/10 flex items-center justify-center transition-all"
            title="Import music"
          >
            <Upload className="w-3.5 h-3.5 text-pink-300" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            multiple
            onChange={handleImportLocalAudio}
            className="hidden"
          />
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Main                                                               */}
      {/* ---------------------------------------------------------------- */}

      <div className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'nowPlaying' ? (
            <motion.div
              key="now-playing"
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -12,
              }}
              transition={{
                duration: 0.25,
              }}
              className="h-full overflow-y-auto"
            >
              <div className="min-h-full flex items-center justify-center p-5 md:p-8">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-8 items-center">
                  {/* Left info */}
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: -25,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    className="hidden lg:block"
                  >
                    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-600 mb-4">
                      Currently Playing
                    </div>

                    <h1 className="text-3xl font-black tracking-tight max-w-sm">
                      {currentTrack.title}
                    </h1>

                    <p className="text-sm text-pink-300 mt-2 font-semibold">
                      {currentTrack.artist}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {currentTrack.album}
                    </p>

                    <div className="mt-8 flex gap-2">
                      <div className="px-3 py-2 rounded-xl bg-white/[0.045] border border-white/[0.07]">
                        <div className="text-[9px] text-slate-600 uppercase">
                          Library
                        </div>
                        <div className="text-xs font-bold mt-1">
                          {allTracks.length} tracks
                        </div>
                      </div>

                      <div className="px-3 py-2 rounded-xl bg-white/[0.045] border border-white/[0.07]">
                        <div className="text-[9px] text-slate-600 uppercase">
                          Engine
                        </div>
                        <div className="text-xs font-bold mt-1">
                          Web Audio
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{
                        x: 4,
                      }}
                      onClick={() =>
                        setActiveTab('library')
                      }
                      className="mt-6 flex items-center gap-2 text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      Browse Library
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </motion.div>

                  {/* 3D Album Art */}
                  <div className="relative flex justify-center">
                    <motion.div
                      animate={{
                        y: isPlayingMusic
                          ? [-5, 5, -5]
                          : 0,
                        rotateY: isPlayingMusic
                          ? [-2, 2, -2]
                          : 0,
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        perspective: 1200,
                      }}
                      className="relative"
                    >
                      {/* Back glow */}
                      <motion.div
                        animate={{
                          scale: isPlayingMusic
                            ? [1, 1.12, 1]
                            : 1,
                          opacity: isPlayingMusic
                            ? [0.35, 0.55, 0.35]
                            : 0.2,
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                        }}
                        className="absolute -inset-12 rounded-full bg-pink-500/20 blur-3xl"
                      />

                      {/* Vinyl disc */}
                      <motion.div
                        animate={{
                          rotate: isPlayingMusic
                            ? 360
                            : 0,
                        }}
                        transition={{
                          duration: 9,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="absolute w-[250px] h-[250px] md:w-[320px] md:h-[320px] rounded-full -right-24 top-8 bg-[radial-gradient(circle_at_center,#17171d_0,#09090d_43%,#1b1b22_44%,#050508_47%,#15151a_50%,#060609_70%,#15151a_71%,#050508_100%)] shadow-2xl"
                      >
                        <div className="absolute inset-[48%] rounded-full bg-gradient-to-br from-pink-400 to-purple-600 border-4 border-black/50" />
                      </motion.div>

                      {/* Album card */}
                      <motion.div
                        whileHover={{
                          rotateX: -4,
                          rotateY: 5,
                          scale: 1.025,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 180,
                          damping: 16,
                        }}
                        className="relative z-10 w-[270px] h-[270px] md:w-[340px] md:h-[340px] rounded-[36px] overflow-hidden border border-white/20 shadow-[0_35px_100px_rgba(0,0,0,0.7)]"
                        style={{
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        <img
                          src={currentTrack.coverUrl}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-white/20" />

                        <motion.div
                          animate={{
                            x: ['-120%', '160%'],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: 'easeInOut',
                          }}
                          className="absolute top-0 bottom-0 w-24 bg-white/20 blur-xl skew-x-12"
                        />

                        <div className="absolute inset-0 border border-white/10 rounded-[36px]" />

                        {isPlayingMusic && (
                          <div className="absolute left-4 top-4 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-xl border border-white/15 flex items-center gap-2">
                            <motion.span
                              animate={{
                                scale: [1, 1.4, 1],
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                              }}
                              className="w-1.5 h-1.5 rounded-full bg-pink-400"
                            />

                            <span className="text-[9px] font-black tracking-wider">
                              PLAYING
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  </div>

                  {/* Right controls */}
                  <div className="flex flex-col items-center lg:items-start">
                    <div className="lg:hidden text-center mb-6">
                      <h1 className="text-2xl font-black">
                        {currentTrack.title}
                      </h1>

                      <p className="text-sm text-pink-300 mt-1">
                        {currentTrack.artist}
                      </p>
                    </div>

                    {/* Visualizer */}
                    <div className="w-full max-w-sm h-20 px-4 rounded-3xl bg-white/[0.035] border border-white/[0.07] flex items-center justify-center gap-[3px] overflow-hidden">
                      {visualizerBars.map(
                        (height, index) => (
                          <motion.div
                            key={index}
                            animate={{
                              height: isPlayingMusic
                                ? height
                                : 4,
                            }}
                            transition={{
                              duration: 0.08,
                            }}
                            className="w-1 rounded-full bg-gradient-to-t from-pink-500 via-purple-400 to-cyan-300 shadow-[0_0_10px_rgba(236,72,153,0.25)]"
                          />
                        )
                      )}
                    </div>

                    {/* Progress */}
                    <div className="w-full max-w-sm mt-7">
                      <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-2">
                        <span>
                          {formatTime(currentSeconds)}
                        </span>

                        <span>
                          {formatTime(
                            currentTrack.duration ||
                              180
                          )}
                        </span>
                      </div>

                      <div
                        onClick={handleScrubClick}
                        className="group relative h-2 rounded-full bg-white/[0.08] cursor-pointer"
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400"
                          style={{
                            width: `${progress}%`,
                          }}
                        />

                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            left: `calc(${progress}% - 7px)`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Main controls */}
                    <div className="flex items-center gap-4 mt-8">
                      <motion.button
                        whileHover={{
                          scale: 1.12,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={() =>
                          setIsShuffle(!isShuffle)
                        }
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isShuffle
                            ? 'text-pink-400 bg-pink-500/10'
                            : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        <Shuffle className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.12,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={prevTrack}
                        className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"
                      >
                        <SkipBack className="w-4 h-4 fill-current" />
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.08,
                        }}
                        whileTap={{
                          scale: 0.92,
                        }}
                        onClick={() => {
                          togglePlayMusic();
                          sound.playClick();
                        }}
                        className="relative w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_15px_45px_rgba(255,255,255,0.2)]"
                      >
                        {isPlayingMusic && (
                          <motion.div
                            animate={{
                              scale: [1, 1.25, 1],
                              opacity: [0.3, 0, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                            className="absolute inset-0 rounded-full border border-white"
                          />
                        )}

                        {isPlayingMusic ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.12,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={nextTrack}
                        className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center"
                      >
                        <SkipForward className="w-4 h-4 fill-current" />
                      </motion.button>

                      <motion.button
                        whileHover={{
                          scale: 1.12,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={() =>
                          setIsRepeat(!isRepeat)
                        }
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isRepeat
                            ? 'text-pink-400 bg-pink-500/10'
                            : 'text-slate-500 hover:text-white'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Secondary controls */}
                    <div className="flex items-center gap-2 mt-7">
                      <motion.button
                        whileHover={{
                          scale: 1.08,
                        }}
                        whileTap={{
                          scale: 0.95,
                        }}
                        onClick={() =>
                          setIsFavorite(!isFavorite)
                        }
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                          isFavorite
                            ? 'bg-pink-500/10 border-pink-400/20 text-pink-400'
                            : 'bg-white/[0.04] border-white/[0.07] text-slate-500'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite
                              ? 'fill-current'
                              : ''
                          }`}
                        />
                      </motion.button>

                      <button
                        onClick={() =>
                          setIsFullscreenPlayer(
                            !isFullscreenPlayer
                          )
                        }
                        className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-500 hover:text-white"
                      >
                        {isFullscreenPlayer ? (
                          <Minimize2 className="w-4 h-4" />
                        ) : (
                          <Maximize2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setShowTrackMenu(
                            !showTrackMenu
                          )
                        }
                        className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-slate-500 hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showTrackMenu && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 8,
                            scale: 0.96,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                          }}
                          exit={{
                            opacity: 0,
                            y: 8,
                            scale: 0.96,
                          }}
                          className="absolute mt-2 top-[calc(100%-100px)] lg:top-auto lg:mt-[235px] z-50 w-48 rounded-2xl border border-white/10 bg-[#15161d]/95 backdrop-blur-2xl shadow-2xl p-1"
                        >
                          <button className="w-full text-left px-3 py-2 rounded-xl text-[11px] hover:bg-white/10">
                            Add to Playlist
                          </button>

                          <button className="w-full text-left px-3 py-2 rounded-xl text-[11px] hover:bg-white/10">
                            Show Album
                          </button>

                          <button className="w-full text-left px-3 py-2 rounded-xl text-[11px] hover:bg-white/10">
                            Get Track Info
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ------------------------------------------------------------ */
            /* Library                                                        */
            /* ------------------------------------------------------------ */
            <motion.div
              key="library"
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -12,
              }}
              className="h-full overflow-y-auto p-5 md:p-8"
            >
              <div className="max-w-6xl mx-auto">
                {/* Library hero */}
                <div className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-gradient-to-br from-pink-500/10 via-purple-500/[0.07] to-cyan-500/[0.05] p-6 md:p-8 mb-7">
                  <div className="absolute right-[-60px] top-[-100px] w-72 h-72 rounded-full bg-pink-500/10 blur-3xl" />

                  <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2 text-pink-300 mb-3">
                        <Library className="w-4 h-4" />
                        <span className="text-[10px] uppercase tracking-[0.25em] font-black">
                          Your Library
                        </span>
                      </div>

                      <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                        Your Music.
                        <br />
                        Your Space.
                      </h2>

                      <p className="text-xs text-slate-500 mt-3 max-w-md">
                        Local music imported from your computer
                        stays inside the Abhishek OS Music Library
                        using persistent local storage.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="px-4 py-3 rounded-2xl bg-white text-black text-xs font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                    >
                      <Upload className="w-4 h-4" />
                      Import Music
                    </button>
                  </div>
                </div>

                {/* Search mobile */}
                <div className="sm:hidden relative mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                  <input
                    value={search}
                    onChange={e =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search your library"
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/[0.05] border border-white/[0.08] outline-none text-xs"
                  />
                </div>

                {/* Track list */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black">
                      All Tracks
                    </h3>

                    <p className="text-[10px] text-slate-600 mt-1">
                      {filteredTracks.length} songs
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <HardDrive className="w-3.5 h-3.5" />
                    Local Library
                  </div>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredTracks.map(
                      (track, index) => {
                        const isCurrent =
                          index === currentTrackIndex;

                        const isLocal =
                          importedLocalTracks.some(
                            local =>
                              local.id === track.id
                          );

                        return (
                          <motion.div
                            key={track.id}
                            layout
                            initial={{
                              opacity: 0,
                              y: 8,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            whileHover={{
                              y: -2,
                              scale: 1.005,
                            }}
                            onClick={() =>
                              handleTrackSelect(index)
                            }
                            className={`group relative overflow-hidden flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                              isCurrent
                                ? 'bg-pink-500/[0.10] border-pink-400/20 shadow-[0_10px_40px_rgba(236,72,153,0.08)]'
                                : 'bg-white/[0.025] border-white/[0.055] hover:bg-white/[0.05] hover:border-white/[0.1]'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <img
                                src={track.coverUrl}
                                alt=""
                                className="w-12 h-12 rounded-xl object-cover shadow-lg"
                              />

                              {isCurrent && (
                                <div className="absolute inset-0 rounded-xl bg-black/35 flex items-center justify-center">
                                  {isPlayingMusic ? (
                                    <div className="flex items-end gap-[2px] h-4">
                                      {[1, 2, 3].map(
                                        bar => (
                                          <motion.span
                                            key={bar}
                                            animate={{
                                              height: [
                                                5,
                                                14,
                                                8,
                                                16,
                                                5,
                                              ],
                                            }}
                                            transition={{
                                              duration:
                                                0.8 +
                                                bar * 0.1,
                                              repeat:
                                                Infinity,
                                            }}
                                            className="w-[3px] rounded-full bg-white"
                                          />
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <Play className="w-4 h-4 fill-white" />
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-bold truncate">
                                  {track.title}
                                </div>

                                {isLocal && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-cyan-400/10 text-cyan-300 text-[8px] font-black">
                                    LOCAL
                                  </span>
                                )}
                              </div>

                              <div className="text-[10px] text-slate-500 mt-1 truncate">
                                {track.artist} ·{' '}
                                {track.album}
                              </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3">
                              <span className="text-[10px] text-slate-600 font-mono">
                                {formatTime(
                                  track.duration
                                )}
                              </span>

                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setIsFavorite(
                                    !isFavorite
                                  );
                                }}
                                className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-pink-400 transition-all"
                              >
                                <Heart className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      }
                    )}
                  </AnimatePresence>
                </div>

                {/* Empty state */}
                {filteredTracks.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                      <Music className="w-7 h-7 text-slate-600" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold">
                      No music found
                    </h3>

                    <p className="text-xs text-slate-600 mt-2">
                      Try another search or import audio
                      from your computer.
                    </p>
                  </div>
                )}

                {/* Local library info */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4">
                    <HardDrive className="w-4 h-4 text-cyan-300 mb-3" />
                    <div className="text-xs font-bold">
                      Persistent Storage
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      Imported music is stored locally using
                      IndexedDB.
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4">
                    <Headphones className="w-4 h-4 text-pink-300 mb-3" />
                    <div className="text-xs font-bold">
                      Local Playback
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      Your imported files remain available
                      without uploading them to a server.
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4">
                    <Waves className="w-4 h-4 text-purple-300 mb-3" />
                    <div className="text-xs font-bold">
                      Audio Visualizer
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">
                      Real-time visual effects react to the
                      music engine.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Bottom mini-player                                                */}
      {/* ---------------------------------------------------------------- */}

      <div className="relative z-30 shrink-0 border-t border-white/[0.08] bg-[#0d0e14]/90 backdrop-blur-3xl">
        <div className="h-[78px] px-4 md:px-6 flex items-center gap-4">
          {/* Track */}
          <div className="flex items-center gap-3 w-[230px] min-w-0">
            <motion.img
              animate={{
                scale: isPlayingMusic
                  ? [1, 1.03, 1]
                  : 1,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              src={currentTrack.coverUrl}
              alt=""
              className="w-11 h-11 rounded-xl object-cover shadow-lg border border-white/10"
            />

            <div className="min-w-0">
              <div className="text-[11px] font-black truncate">
                {currentTrack.title}
              </div>

              <div className="text-[9px] text-pink-300 truncate mt-0.5">
                {currentTrack.artist}
              </div>
            </div>

            <button
              onClick={() =>
                setIsFavorite(!isFavorite)
              }
              className={`ml-auto ${
                isFavorite
                  ? 'text-pink-400'
                  : 'text-slate-600 hover:text-white'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite
                    ? 'fill-current'
                    : ''
                }`}
              />
            </button>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setIsShuffle(!isShuffle)
                }
                className={`hidden sm:block ${
                  isShuffle
                    ? 'text-pink-400'
                    : 'text-slate-600 hover:text-white'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={prevTrack}
                className="text-slate-400 hover:text-white"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <motion.button
                whileHover={{
                  scale: 1.08,
                }}
                whileTap={{
                  scale: 0.92,
                }}
                onClick={togglePlayMusic}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg"
              >
                {isPlayingMusic ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </motion.button>

              <button
                onClick={nextTrack}
                className="text-slate-400 hover:text-white"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={() =>
                  setIsRepeat(!isRepeat)
                }
                className={`hidden sm:block ${
                  isRepeat
                    ? 'text-pink-400'
                    : 'text-slate-600 hover:text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 w-full max-w-[430px] mt-2">
              <span className="text-[8px] text-slate-600 font-mono">
                {formatTime(currentSeconds)}
              </span>

              <div
                onClick={handleScrubClick}
                className="relative flex-1 h-1 rounded-full bg-white/[0.08] cursor-pointer"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <span className="text-[8px] text-slate-600 font-mono">
                {formatTime(
                  currentTrack.duration || 180
                )}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center justify-end gap-2 w-[220px]">
            {settings.soundVolume > 0 ? (
              <Volume2 className="w-4 h-4 text-slate-500" />
            ) : (
              <VolumeX className="w-4 h-4 text-pink-400" />
            )}

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={e =>
                updateSettings({
                  soundVolume: Number(
                    e.target.value
                  ),
                })
              }
              className="w-24 accent-pink-400 cursor-pointer"
            />

            <button
              onClick={() =>
                setActiveTab('library')
              }
              className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Toast                                                              */}
      {/* ---------------------------------------------------------------- */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.94,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.94,
            }}
            className="absolute z-[200] bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl bg-[#181920]/95 backdrop-blur-2xl border border-white/10 shadow-2xl flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <span className="text-[11px] font-semibold">
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------- */}
      {/* Fullscreen cinematic player                                       */}
      {/* ---------------------------------------------------------------- */}

      <AnimatePresence>
        {isFullscreenPlayer && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
            }}
            className="absolute inset-0 z-[150] bg-black/85 backdrop-blur-3xl flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.img
                animate={{
                  scale: [1.05, 1.15, 1.05],
                  opacity: [0.16, 0.24, 0.16],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                }}
                src={currentTrack.coverUrl}
                alt=""
                className="w-full h-full object-cover blur-[80px]"
              />

              <div className="absolute inset-0 bg-black/75" />
            </div>

            <button
              onClick={() =>
                setIsFullscreenPlayer(false)
              }
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
              <motion.div
                animate={{
                  y: isPlayingMusic
                    ? [-8, 8, -8]
                    : 0,
                  rotateY: isPlayingMusic
                    ? [-2, 2, -2]
                    : 0,
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                }}
                className="w-[min(65vw,430px)] aspect-square rounded-[42px] overflow-hidden border border-white/20 shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
              >
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <div className="text-center mt-8">
                <h2 className="text-3xl md:text-5xl font-black">
                  {currentTrack.title}
                </h2>

                <p className="text-pink-300 mt-2 font-semibold">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-end gap-1 h-14 mt-8">
                {visualizerBars.map(
                  (height, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        height: isPlayingMusic
                          ? height
                          : 4,
                      }}
                      className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 via-purple-500 to-cyan-300"
                    />
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};