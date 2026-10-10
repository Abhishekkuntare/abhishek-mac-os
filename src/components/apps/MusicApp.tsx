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
  ExternalLink,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { AUDIO_TRACKS } from '../../data/sampleData';
import { sound } from '../../services/soundService';
import { musicEngine } from '../../services/musicEngine';
import { searchJamendoTracks } from '../../services/jamendoMusic';
import type { AudioTrack } from '../../types/desktop';

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
const FAVORITES_STORAGE_KEY = 'abhishek_os_music_favorites_v1';

const EXTERNAL_MEDIA_PLAYERS = [
  { id: 'spotify', name: 'Spotify', subtitle: 'Listen on Spotify', mark: 'S', color: 'from-emerald-400 to-green-700' },
  { id: 'gaana', name: 'Gaana', subtitle: 'Listen on Gaana', mark: 'G', color: 'from-rose-400 to-red-700' },
  { id: 'youtubeMusic', name: 'YouTube Music', subtitle: 'Open YouTube Music', mark: 'YT', color: 'from-red-400 to-rose-700' },
  { id: 'jioSaavn', name: 'JioSaavn', subtitle: 'Listen on JioSaavn', mark: 'J', color: 'from-orange-300 to-amber-700' },
  { id: 'amazonMusic', name: 'Amazon Music', subtitle: 'Open Amazon Music', mark: 'a', color: 'from-sky-300 to-blue-700' },
  { id: 'vlc', name: 'VLC', subtitle: 'Open VLC player website', mark: 'V', color: 'from-orange-300 to-orange-700' },
] as const;

const EXTERNAL_MEDIA_URLS: Record<typeof EXTERNAL_MEDIA_PLAYERS[number]['id'], string> = {
  spotify: 'https://open.spotify.com/',
  gaana: 'https://gaana.com/',
  youtubeMusic: 'https://music.youtube.com/',
  jioSaavn: 'https://www.jiosaavn.com/',
  amazonMusic: 'https://music.amazon.com/',
  vlc: 'https://www.videolan.org/vlc/',
};

const getMediaSearchUrl = (player: typeof EXTERNAL_MEDIA_PLAYERS[number]['id'], query: string) => {
  const encodedQuery = encodeURIComponent(query.trim());
  if (!encodedQuery) return EXTERNAL_MEDIA_URLS[player];
  switch (player) {
    case 'spotify':
      return `https://open.spotify.com/search/${encodedQuery}`;
    case 'gaana':
      return `https://gaana.com/search/${encodedQuery}`;
    case 'youtubeMusic':
      return `https://music.youtube.com/search?q=${encodedQuery}`;
    case 'jioSaavn':
      return `https://www.jiosaavn.com/search/song/${encodedQuery}`;
    case 'amazonMusic':
      return `https://music.amazon.com/search/${encodedQuery}`;
    case 'vlc':
      return EXTERNAL_MEDIA_URLS.vlc;
  }
};

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

const JamendoCatalog: React.FC = () => {
  const { settings, playCustomTrack, openApp } = useOS();
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  const searchCatalog = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setLoading(true);
    setError('');
    try {
      setTracks(await searchJamendoTracks(settings.jamendoClientId, query, request.signal));
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return;
      setError(caught instanceof Error ? caught.message : 'Jamendo search failed. Please try again.');
      setTracks([]);
    } finally {
      if (requestRef.current === request) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  };

  const openMediaSettings = () => {
    openApp('settings');
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('arlo:open-settings-section', { detail: { tab: 'media' } }));
    }, 120);
  };

  return (
    <motion.div
      key="catalog"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22 }}
      className="h-full overflow-y-auto p-5 md:p-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[28px] border border-emerald-200/10 bg-gradient-to-br from-emerald-400/[0.1] via-sky-500/[0.06] to-violet-500/[0.08] p-5 md:p-7">
          <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-emerald-300/[0.12] blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-emerald-200">
              <Radio className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em]">Jamendo · free licensed music</span>
            </div>
            <h2 className="mt-3 text-xl font-black tracking-tight text-white md:text-2xl">Discover independent music</h2>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-300/75">
              Search and stream tracks from Jamendo’s catalog. Tracks retain their artist, source and license links; commercial streaming catalogs are not included.
            </p>
            <form onSubmit={event => void searchCatalog(event)} className="mt-5 flex gap-2">
              <input
                value={query}
                onChange={event => setQuery(event.currentTarget.value)}
                placeholder="Search a song, artist, or genre"
                aria-label="Search Jamendo music"
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/45 px-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-emerald-200/35"
              />
              <button
                type="submit"
                disabled={loading || !query.trim() || !settings.jamendoClientId.trim()}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-emerald-200/20 bg-emerald-300/10 px-4 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-100/30 border-t-emerald-100" /> : <Search className="h-3.5 w-3.5" />}
                {loading ? 'Searching' : 'Search'}
              </button>
            </form>
            {!settings.jamendoClientId.trim() && (
              <button type="button" onClick={openMediaSettings} className="mt-3 text-left text-[10px] font-semibold text-amber-200 transition hover:text-amber-100">
                Add your Jamendo client ID in Settings → Media to enable catalog search.
              </button>
            )}
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-[11px] text-rose-200">{error}</p>}

        <div className="mt-5 space-y-2">
          {tracks.map(track => (
            <motion.article
              key={track.id}
              layout
              whileHover={{ y: -1 }}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 transition-colors hover:border-emerald-200/20 hover:bg-white/[0.045]"
            >
              <img src={track.coverUrl || DEFAULT_COVER} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-lg" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold text-white">{track.title}</div>
                <div className="mt-0.5 truncate text-[10px] text-slate-400">{track.artist}{track.album ? ` · ${track.album}` : ''}</div>
                <div className="mt-1 flex items-center gap-2 text-[9px]">
                  {track.sourceUrl && <a href={track.sourceUrl} target="_blank" rel="noreferrer" className="text-emerald-200/80 transition hover:text-emerald-100">Jamendo source</a>}
                  {track.licenseUrl && <a href={track.licenseUrl} target="_blank" rel="noreferrer" className="text-slate-500 transition hover:text-slate-300">License</a>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => playCustomTrack(track)}
                aria-label={`Play ${track.title} by ${track.artist}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg shadow-emerald-400/10 transition hover:scale-105 hover:bg-emerald-100 active:scale-95"
              >
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </button>
            </motion.article>
          ))}
          {!loading && !error && tracks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-[11px] text-slate-500">
              Search Jamendo for music cleared for streaming and sharing.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
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
    repeatTrack,
    setRepeatTrack,
    shuffleTracks,
    setShuffleTracks,
    togglePlayMusic,
    playTrackAtIndex,
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

  const [activeTab, setActiveTab] = useState<'nowPlaying' | 'library' | 'catalog' | 'players'>('nowPlaying');
  const [playerSearch, setPlayerSearch] = useState('');

  const [search, setSearch] = useState('');
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'favorites' | 'imported'>('all');
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) && parsed.every(id => typeof id === 'string') ? parsed : [];
    } catch {
      return [];
    }
  });

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [isFullscreenPlayer, setIsFullscreenPlayer] =
    useState(false);

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

    return allTracks.filter(track => {
      const matchesSearch = !query || (
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        track.album.toLowerCase().includes(query)
      );
      const matchesFilter = libraryFilter === 'all' ||
        (libraryFilter === 'favorites' && favoriteTrackIds.includes(track.id)) ||
        (libraryFilter === 'imported' && importedLocalTracks.some(local => local.id === track.id));
      return matchesSearch && matchesFilter;
    });
  }, [allTracks, favoriteTrackIds, importedLocalTracks, libraryFilter, search]);

  const isTrackFavorite = useCallback(
    (trackId: string) => favoriteTrackIds.includes(trackId),
    [favoriteTrackIds],
  );

  const toggleFavorite = useCallback((trackId: string) => {
    setFavoriteTrackIds(current =>
      current.includes(trackId)
        ? current.filter(id => id !== trackId)
        : [...current, trackId],
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Toast                                                                  */
  /* ---------------------------------------------------------------------- */

  const showToast = useCallback((message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  const openExternalPlayer = useCallback(async (player: typeof EXTERNAL_MEDIA_PLAYERS[number]['id']) => {
    try {
      if (!window.electronAPI) throw new Error('Opening music services is only available in the desktop app.');
      await window.electronAPI.openExternal(getMediaSearchUrl(player, playerSearch));
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Could not open ${player}.`);
    }
  }, [playerSearch, showToast]);

  const sendWindowsMediaCommand = useCallback(async (command: 'previous' | 'playPause' | 'next') => {
    try {
      if (!window.electronAPI) throw new Error('Windows media controls are only available in the desktop app.');
      await window.electronAPI.sendWindowsMediaCommand(command);
      showToast('Media command sent to the active Windows player.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send a command to the Windows media player.');
    }
  }, [showToast]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteTrackIds));
    } catch {
      showToast('Could not save music favorites.');
    }
  }, [favoriteTrackIds, showToast]);

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

  const handleTrackSelect = (trackId: string) => {
    const index = allTracks.findIndex(track => track.id === trackId);
    if (index < 0) {
      showToast('This track is no longer in your library.');
      return;
    }

    if (index === currentTrackIndex && isPlayingMusic) return;
    playTrackAtIndex(index);
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
                  ARLO OS Music Library.
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
              ARLO OS Audio
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

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Explore
          </button>

          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              activeTab === 'players'
                ? 'bg-white/10 text-white shadow-lg'
                : 'text-slate-500 hover:text-white'
            }`}
          >
            Players
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
                          setShuffleTracks(!shuffleTracks)
                        }
                        aria-label={shuffleTracks ? 'Turn shuffle off' : 'Shuffle songs'}
                        title={shuffleTracks ? 'Shuffle is on' : 'Shuffle songs'}
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          shuffleTracks
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
                        onClick={() => setRepeatTrack(!repeatTrack)}
                        aria-label={repeatTrack ? 'Turn repeat off' : 'Repeat current song'}
                        title={repeatTrack ? 'Repeat current song is on' : 'Repeat current song'}
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          repeatTrack
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
                        onClick={() => toggleFavorite(currentTrack.id)}
                        aria-label={isTrackFavorite(currentTrack.id) ? 'Remove from favorites' : 'Add to favorites'}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                          isTrackFavorite(currentTrack.id)
                            ? 'bg-pink-500/10 border-pink-400/20 text-pink-400'
                            : 'bg-white/[0.04] border-white/[0.07] text-slate-500'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isTrackFavorite(currentTrack.id)
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
                          <button
                            type="button"
                            onClick={() => {
                              toggleFavorite(currentTrack.id);
                              setShowTrackMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-[11px] hover:bg-white/10"
                          >
                            {isTrackFavorite(currentTrack.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('library');
                              setLibraryFilter('all');
                              setSearch(currentTrack.album);
                              setShowTrackMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-[11px] hover:bg-white/10"
                          >
                            Find Album in Library
                          </button>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'catalog' ? (
            <JamendoCatalog />
          ) : activeTab === 'players' ? (
            <motion.div
              key="players"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="h-full overflow-y-auto p-5 md:p-8"
            >
              <div className="mx-auto max-w-4xl">
                <div className="mb-5">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet-300">Streaming & players</div>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-white">Jump in and listen</h2>
                  <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-slate-400">
                    Search a song and open its results on a music service. Availability and playback are handled by each provider.
                  </p>
                </div>

                <label className="mb-4 flex h-11 items-center gap-2.5 rounded-xl border border-violet-200/[0.12] bg-gradient-to-r from-violet-300/[0.07] via-white/[0.035] to-cyan-300/[0.045] px-3.5 shadow-[0_8px_24px_rgba(0,0,0,.12)] transition focus-within:border-violet-200/35 focus-within:shadow-[0_0_24px_rgba(167,139,250,.1)]">
                  <Search className="h-4 w-4 shrink-0 text-violet-200/75" />
                  <input
                    type="search"
                    value={playerSearch}
                    onChange={event => setPlayerSearch(event.currentTarget.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') void openExternalPlayer('spotify');
                    }}
                    placeholder="Search songs across services..."
                    aria-label="Search songs across streaming services"
                    className="h-full min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
                  />
                  {playerSearch && (
                    <button
                      type="button"
                      aria-label="Clear song search"
                      onClick={() => setPlayerSearch('')}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {EXTERNAL_MEDIA_PLAYERS.map((player, index) => (
                    <motion.button
                      key={player.id}
                      type="button"
                      onClick={() => void openExternalPlayer(player.id)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035, duration: 0.18 }}
                      whileHover={{ y: -3, scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative flex min-h-[112px] items-center gap-3 overflow-hidden rounded-2xl border border-violet-100/[0.1] bg-gradient-to-br from-[#29213b]/80 via-[#1a1728]/90 to-[#10111c]/95 p-4 text-left shadow-[0_12px_30px_rgba(0,0,0,.16)] transition-colors hover:border-violet-200/30 hover:from-[#39244b]/85 hover:via-[#201a34]/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70"
                    >
                      <span aria-hidden="true" className="pointer-events-none absolute -right-7 -top-9 h-24 w-24 rounded-full bg-violet-300/[0.07] blur-2xl transition duration-300 group-hover:bg-fuchsia-300/[0.14]" />
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br ${player.color} text-sm font-black text-white shadow-lg transition-transform duration-200 group-hover:rotate-[-5deg] group-hover:scale-110`}>
                        {player.mark}
                      </span>
                      <span className="relative min-w-0">
                        <span className="block truncate text-[11px] font-bold text-slate-100">{player.name}</span>
                        <span className="mt-1 block truncate text-[9px] text-slate-400">{player.id === 'vlc' ? player.subtitle : playerSearch.trim() ? `Search “${playerSearch.trim()}”` : player.subtitle}</span>
                      </span>
                      <ExternalLink className="relative ml-auto h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-200" />
                    </motion.button>
                  ))}
                </div>

                <section className="mt-5 rounded-2xl border border-violet-200/[0.12] bg-gradient-to-br from-[#29213b]/75 via-[#171522]/90 to-[#10111c]/95 p-4 shadow-[0_12px_30px_rgba(0,0,0,.14)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-bold text-white">Windows media controls</div>
                      <p className="mt-1 max-w-lg text-[9px] leading-relaxed text-slate-400">
                        Sends Previous, Play/Pause, or Next media keys to the active Windows player. Apps that do not respond to Windows media keys may ignore them.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {([
                        { command: 'previous', label: 'Previous', Icon: SkipBack },
                        { command: 'playPause', label: 'Play or pause', Icon: Play },
                        { command: 'next', label: 'Next', Icon: SkipForward },
                      ] as const).map(({ command, label, Icon }) => (
                        <button
                          key={command}
                          type="button"
                          aria-label={label}
                          title={label}
                          onClick={() => void sendWindowsMediaCommand(command)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.055] text-slate-200 transition duration-200 hover:scale-110 hover:border-violet-200/30 hover:bg-violet-200/[0.12] hover:text-white active:scale-95 ${command === 'playPause' ? 'h-10 w-10 bg-white text-slate-950 hover:bg-violet-100 hover:text-slate-950' : ''}`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
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

                      <p className="text-xs text-slate-400 mt-3 max-w-md">
                        Play built-in soundscapes or add songs from your device. Imported audio stays in your private local library.
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

                    <p className="text-[10px] text-slate-500 mt-1">
                      {filteredTracks.length} of {allTracks.length} {allTracks.length === 1 ? 'song' : 'songs'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <HardDrive className="w-3.5 h-3.5" />
                    Local Library
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {([
                    ['all', 'All songs', allTracks.length],
                    ['favorites', 'Favorites', favoriteTrackIds.filter(id => allTracks.some(track => track.id === id)).length],
                    ['imported', 'Your imports', importedLocalTracks.length],
                  ] as const).map(([filter, label, count]) => (
                    <motion.button
                      key={filter}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setLibraryFilter(filter)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-bold transition-colors ${
                        libraryFilter === filter
                          ? 'border-pink-400/30 bg-pink-400/15 text-pink-100 shadow-[0_6px_24px_rgba(236,72,153,0.12)]'
                          : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${libraryFilter === filter ? 'bg-pink-300/15 text-pink-100' : 'bg-white/[0.06] text-slate-500'}`}>{count}</span>
                    </motion.button>
                  ))}
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredTracks.map(
                      track => {
                        const isCurrent =
                          track.id === currentTrack.id;
                        const isFavorite = isTrackFavorite(track.id);

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
                            onClick={() => handleTrackSelect(track.id)}
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
                                type="button"
                                aria-label={isFavorite ? `Remove ${track.title} from favorites` : `Add ${track.title} to favorites`}
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleFavorite(track.id);
                                }}
                                className={`w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-white/10 flex items-center justify-center transition-all ${isFavorite ? 'text-pink-400 opacity-100' : 'text-slate-500 hover:text-pink-400'}`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
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
                      {libraryFilter === 'favorites'
                        ? 'Save tracks with the heart button to find them here.'
                        : libraryFilter === 'imported'
                          ? 'Import audio from your device to build your personal library.'
                          : 'Try another search or import audio from your device.'}
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
              onClick={() => toggleFavorite(currentTrack.id)}
              aria-label={isTrackFavorite(currentTrack.id) ? 'Remove from favorites' : 'Add to favorites'}
              className={`ml-auto ${
                isTrackFavorite(currentTrack.id)
                  ? 'text-pink-400'
                  : 'text-slate-600 hover:text-white'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isTrackFavorite(currentTrack.id)
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
                  setShuffleTracks(!shuffleTracks)
                }
                aria-label={shuffleTracks ? 'Turn shuffle off' : 'Shuffle songs'}
                title={shuffleTracks ? 'Shuffle is on' : 'Shuffle songs'}
                className={`hidden sm:block ${
                  shuffleTracks
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
                onClick={() => setRepeatTrack(!repeatTrack)}
                aria-label={repeatTrack ? 'Turn repeat off' : 'Repeat current song'}
                title={repeatTrack ? 'Repeat current song is on' : 'Repeat current song'}
                className={`hidden sm:block ${
                  repeatTrack
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