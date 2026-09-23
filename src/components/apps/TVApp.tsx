import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AnimatePresence, motion } from 'motion/react';

import {
  Play,
  Pause,
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Film,
  Sparkles,
  Search,
  ChevronRight,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  X,
  Clock3,
  Eye,
  Layers3,
  Radio,
  Settings,
  PictureInPicture2,
  RotateCcw,
  Check,
  Loader2,
} from 'lucide-react';

import { sound } from '../../services/soundService';

type VideoItem = {
  id: string;
  title: string;
  category: string;
  duration: string;
  description: string;
  thumbnail: string;
  video: string;
  creator: string;
  views: string;
  accent: string;
};

const SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: 'v1',
    title: 'Abhishek OS — Cinematic System Showcase',
    duration: '00:30',
    category: 'Technology',
    thumbnail:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop',
    video:
      'https://storage.googleapis.com/coverr-main/mp4/ForBiggerBlazes.mp4',
    description:
      'A cinematic technology showcase designed as the flagship experience for Abhishek TV.',
    creator: 'Abhishek Studio',
    views: '1.2M',
    accent: 'from-cyan-500 to-blue-600',
  },

  {
    id: 'v2',
    title: 'Earth From Space — A Journey Beyond',
    duration: '00:30',
    category: 'Space',
    thumbnail:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
    video:
      'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4',
    description:
      'A cinematic visual journey inspired by orbital views of our planet.',
    creator: 'Abhishek Originals',
    views: '892K',
    accent: 'from-indigo-500 to-violet-600',
  },

  {
    id: 'v3',
    title: 'The Future of Digital Creation',
    duration: '00:30',
    category: 'Future',
    thumbnail:
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1600&auto=format&fit=crop',
    video:
      'https://storage.googleapis.com/coverr-main/mp4/ForBiggerEscapes.mp4',
    description:
      'A futuristic visual experience exploring creativity, technology and digital worlds.',
    creator: 'Abhishek TV',
    views: '654K',
    accent: 'from-fuchsia-500 to-purple-600',
  },

  {
    id: 'v4',
    title: 'Deep Focus — Creative Coding Session',
    duration: '00:30',
    category: 'Coding',
    thumbnail:
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop',
    video:
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    description:
      'A calm visual session for developers, designers and digital creators.',
    creator: 'Focus Lab',
    views: '428K',
    accent: 'from-emerald-500 to-cyan-600',
  },

  {
    id: 'v5',
    title: 'Beyond The Horizon',
    duration: '00:30',
    category: 'Cinematic',
    thumbnail:
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=1600&auto=format&fit=crop',
    video:
      'https://storage.googleapis.com/coverr-main/mp4/ForBiggerJoyrides.mp4',
    description:
      'A cinematic escape into motion, atmosphere and endless horizons.',
    creator: 'Cinema Lab',
    views: '318K',
    accent: 'from-orange-500 to-rose-600',
  },

  {
    id: 'v6',
    title: 'Digital Dreams',
    duration: '00:30',
    category: 'Art',
    thumbnail:
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1600&auto=format&fit=crop',
    video:
      'https://storage.googleapis.com/coverr-main/mp4/ForBiggerFun.mp4',
    description:
      'An abstract visual experience combining art, motion and digital imagination.',
    creator: 'Digital Artists',
    views: '287K',
    accent: 'from-pink-500 to-violet-600',
  },
];

const CATEGORIES = [
  'All',
  'Featured',
  'Technology',
  'Space',
  'Future',
  'Coding',
  'Cinematic',
  'Art',
];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '00:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0',
  )}`;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const TVApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const [activeVideo, setActiveVideo] = useState<VideoItem>(
    SAMPLE_VIDEOS[0],
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [showSettings, setShowSettings] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const [toast, setToast] = useState('');

  const [isPictureInPicture, setIsPictureInPicture] =
    useState(false);

  /*
   * ------------------------------------------------------------
   * Toast
   * ------------------------------------------------------------
   */

  const showToast = useCallback((message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast('');
    }, 1800);
  }, []);

  /*
   * ------------------------------------------------------------
   * Play / Pause
   * ------------------------------------------------------------
   */

  const togglePlay = useCallback(() => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          showToast('Playback could not be started');
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }

    sound.playClick();
  }, [showToast]);

  /*
   * ------------------------------------------------------------
   * Change Video
   * ------------------------------------------------------------
   */

  const changeVideo = useCallback(
    (video: VideoItem, autoPlay = true) => {
      setActiveVideo(video);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);

      sound.playClick();

      window.setTimeout(() => {
        const player = videoRef.current;

        if (!player) return;

        player.load();

        if (autoPlay) {
          player
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        }
      }, 80);
    },
    [],
  );

  /*
   * ------------------------------------------------------------
   * Next Video
   * ------------------------------------------------------------
   */

  const playNext = useCallback(() => {
    const currentIndex = SAMPLE_VIDEOS.findIndex(
      video => video.id === activeVideo.id,
    );

    const nextIndex =
      currentIndex === SAMPLE_VIDEOS.length - 1
        ? 0
        : currentIndex + 1;

    changeVideo(SAMPLE_VIDEOS[nextIndex], true);
  }, [activeVideo.id, changeVideo]);

  /*
   * ------------------------------------------------------------
   * Previous Video
   * ------------------------------------------------------------
   */

  const playPrevious = useCallback(() => {
    const currentIndex = SAMPLE_VIDEOS.findIndex(
      video => video.id === activeVideo.id,
    );

    const previousIndex =
      currentIndex === 0
        ? SAMPLE_VIDEOS.length - 1
        : currentIndex - 1;

    changeVideo(SAMPLE_VIDEOS[previousIndex], true);
  }, [activeVideo.id, changeVideo]);

  /*
   * ------------------------------------------------------------
   * Seek
   * ------------------------------------------------------------
   */

  const seekBy = (amount: number) => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = clamp(
      video.currentTime + amount,
      0,
      video.duration || duration,
    );

    setCurrentTime(video.currentTime);
  };

  const handleProgressClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const video = videoRef.current;
    const bar = progressRef.current;

    if (!video || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();

    const percentage = clamp(
      (event.clientX - rect.left) / rect.width,
      0,
      1,
    );

    video.currentTime = percentage * duration;
    setCurrentTime(video.currentTime);
  };

  /*
   * ------------------------------------------------------------
   * Volume
   * ------------------------------------------------------------
   */

  const handleVolumeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextVolume = Number(event.target.value);

    setVolume(nextVolume);

    if (videoRef.current) {
      videoRef.current.volume = nextVolume;
      videoRef.current.muted = nextVolume === 0;
    }

    setIsMuted(nextVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.muted || video.volume === 0) {
      video.muted = false;

      if (video.volume === 0) {
        video.volume = 0.85;
        setVolume(0.85);
      }

      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }

    sound.playClick();
  };

  /*
   * ------------------------------------------------------------
   * Fullscreen
   * ------------------------------------------------------------
   */

  const toggleFullscreen = async () => {
    if (!playerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      showToast('Fullscreen unavailable');
    }
  };

  /*
   * ------------------------------------------------------------
   * Picture in Picture
   * ------------------------------------------------------------
   */

  const togglePictureInPicture = async () => {
    const video = videoRef.current as
      | (HTMLVideoElement & {
          requestPictureInPicture?: () => Promise<void>;
        })
      | null;

    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
        return;
      }

      if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setIsPictureInPicture(true);
      } else {
        showToast('Picture-in-Picture is not supported');
      }
    } catch {
      showToast('Picture-in-Picture unavailable');
    }
  };

  /*
   * ------------------------------------------------------------
   * Video Events
   * ------------------------------------------------------------
   */

  const handleLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    setDuration(video.duration);
    setIsLoading(false);

    video.volume = volume;
    video.muted = isMuted;
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(video.currentTime);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    playNext();
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  /*
   * ------------------------------------------------------------
   * Keyboard Shortcuts
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }

      if (event.key === 'ArrowRight') {
        seekBy(10);
      }

      if (event.key === 'ArrowLeft') {
        seekBy(-10);
      }

      if (event.key.toLowerCase() === 'm') {
        toggleMute();
      }

      if (event.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [togglePlay]);

  /*
   * ------------------------------------------------------------
   * Fullscreen Events
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const handleFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreen,
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreen,
      );
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * Search / Category
   * ------------------------------------------------------------
   */

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return SAMPLE_VIDEOS.filter(video => {
      const matchesCategory =
        category === 'All' ||
        category === 'Featured' ||
        video.category === category;

      const matchesSearch =
        !query ||
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const featuredVideos = SAMPLE_VIDEOS.slice(0, 3);

  /*
   * ------------------------------------------------------------
   * Progress
   * ------------------------------------------------------------
   */

  const progressPercentage =
    duration > 0
      ? clamp((currentTime / duration) * 100, 0, 100)
      : 0;

  /*
   * ------------------------------------------------------------
   * Render
   * ------------------------------------------------------------
   */

  return (
    <div className="relative flex-1 h-full overflow-hidden bg-[#060910] text-white select-none">
      {/* Ambient background */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 80, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-48 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[120px]"
        />

        <motion.div
          animate={{
            x: [0, -100, 40, 0],
            y: [0, 50, -30, 0],
            scale: [1, 0.9, 1.12, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/3 -right-60 w-[650px] h-[650px] rounded-full bg-violet-500/10 blur-[130px]"
        />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '45px 45px',
          }}
        />
      </div>

      {/* Main content */}

      <div className="relative z-10 flex h-full flex-col overflow-hidden">
        {/* Header */}

        <header className="shrink-0 border-b border-white/[0.07] bg-black/20 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{
                  rotate: 8,
                  scale: 1.08,
                }}
                whileTap={{ scale: 0.95 }}
                className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[15px] border border-white/15 bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-[0_10px_40px_rgba(59,130,246,.3)]"
              >
                <Tv className="relative z-10 h-5 w-5" />

                <motion.div
                  animate={{
                    x: ['-120%', '150%'],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                  className="absolute inset-y-0 w-1/2 rotate-12 bg-white/30 blur-md"
                />
              </motion.div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[15px] font-black tracking-tight">
                    Abhishek TV
                  </h1>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-cyan-300">
                    Studio
                  </span>
                </div>

                <p className="text-[10px] text-slate-500">
                  Cinematic experiences for your desktop
                </p>
              </div>
            </div>

            {/* Search */}

            <div className="hidden max-w-md flex-1 md:block">
              <div className="group relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-cyan-400" />

                <input
                  value={search}
                  onChange={event =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search videos..."
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.045] pl-10 pr-4 text-xs text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-400/30 focus:bg-white/[0.07] focus:ring-4 focus:ring-cyan-500/5"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  showToast('Abhishek TV is live')
                }
                className="hidden items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-[10px] font-bold text-red-300 transition hover:bg-red-500/20 sm:flex"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>

                LIVE
              </button>

              <button
                onClick={() =>
                  showToast('Your watchlist is ready')
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Layers3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category navigation */}

          <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-none">
            {CATEGORIES.map(item => {
              const selected = category === item;

              return (
                <motion.button
                  key={item}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCategory(item);
                    sound.playClick();
                  }}
                  className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-[10px] font-bold transition-all ${
                    selected
                      ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                      : 'border border-white/[0.08] bg-white/[0.035] text-slate-500 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {item}
                </motion.button>
              );
            })}
          </div>
        </header>

        {/* Scrollable body */}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Cinematic Player */}

          <section className="px-4 pb-5 pt-5 md:px-6">
            <div
              ref={playerRef}
              className={`group relative mx-auto max-w-[1450px] overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,.6)] ${
                isFullscreen ? 'rounded-none' : ''
              }`}
            >
              {/* Video */}

              <div className="relative aspect-video w-full overflow-hidden bg-black">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeVideo.id}
                    initial={{
                      opacity: 0,
                      scale: 1.04,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      duration: 0.55,
                    }}
                    className="absolute inset-0"
                  >
                    <video
                      ref={videoRef}
                      key={activeVideo.video}
                      src={activeVideo.video}
                      poster={activeVideo.thumbnail}
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                      onLoadedMetadata={
                        handleLoadedMetadata
                      }
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnded}
                      onPlay={handleVideoPlay}
                      onPause={handleVideoPause}
                      onWaiting={() => setIsLoading(true)}
                      onCanPlay={() => setIsLoading(false)}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Cinematic overlays */}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(0,0,0,.28)_100%)]" />

                {/* Loading */}

                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />

                        <span className="text-[10px] font-bold uppercase tracking-[.2em] text-white/60">
                          Loading stream
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Center play */}

                <AnimatePresence>
                  {!isPlaying && !isLoading && (
                    <motion.button
                      initial={{
                        opacity: 0,
                        scale: 0.75,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 1.2,
                      }}
                      whileHover={{
                        scale: 1.1,
                      }}
                      whileTap={{
                        scale: 0.9,
                      }}
                      onClick={togglePlay}
                      className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-[0_20px_70px_rgba(0,0,0,.5)] backdrop-blur-xl"
                    >
                      <Play className="ml-1 h-8 w-8 fill-current" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Top title */}

                <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
                  <div className="max-w-xl">
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      key={activeVideo.id}
                      className="flex items-center gap-2"
                    >
                      <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.18em] text-cyan-300 backdrop-blur-xl">
                        {activeVideo.category}
                      </span>

                      <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[8px] font-bold text-white/60 backdrop-blur-xl">
                        4K
                      </span>
                    </motion.div>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <button
                      onClick={togglePictureInPicture}
                      className="rounded-xl border border-white/10 bg-black/25 p-2 text-white/70 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
                      title="Picture in Picture"
                    >
                      <PictureInPicture2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() =>
                        setShowMore(previous => !previous)
                      }
                      className="rounded-xl border border-white/10 bg-black/25 p-2 text-white/70 backdrop-blur-xl transition hover:bg-white/15 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* More menu */}

                <AnimatePresence>
                  {showMore && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -8,
                        scale: 0.96,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                        scale: 0.96,
                      }}
                      className="absolute right-5 top-16 z-30 w-48 rounded-2xl border border-white/10 bg-[#11151f]/95 p-2 shadow-2xl backdrop-blur-2xl"
                    >
                      {[
                        'Add to Watchlist',
                        'Share Video',
                        'Copy Video Link',
                        'Report',
                      ].map(item => (
                        <button
                          key={item}
                          onClick={() => {
                            setShowMore(false);
                            showToast(item);
                          }}
                          className="flex w-full rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          {item}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom controls */}

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Progress */}

                  <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="group/progress relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20"
                  >
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                      style={{
                        width: `${progressPercentage}%`,
                      }}
                    />

                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100"
                      style={{
                        left: `calc(${progressPercentage}% - 6px)`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <button
                        onClick={togglePlay}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-xl transition hover:bg-white/20"
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        )}
                      </button>

                      <button
                        onClick={() => seekBy(-10)}
                        className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white sm:flex"
                        title="Back 10 seconds"
                      >
                        <SkipBack className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => seekBy(10)}
                        className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white sm:flex"
                        title="Forward 10 seconds"
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>

                      <button
                        onClick={toggleMute}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/80 transition hover:bg-white/15 hover:text-white"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>

                      <div className="hidden w-20 md:block">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="h-1 w-full cursor-pointer accent-cyan-400"
                        />
                      </div>

                      <span className="ml-1 whitespace-nowrap font-mono text-[9px] text-white/60">
                        {formatTime(currentTime)} /{' '}
                        {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={togglePictureInPicture}
                        className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white sm:flex"
                      >
                        <PictureInPicture2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() =>
                          showToast('Playback settings')
                        }
                        className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white sm:flex"
                      >
                        <Settings className="h-4 w-4" />
                      </button>

                      <button
                        onClick={toggleFullscreen}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video information */}

            <div className="mx-auto mt-4 max-w-[1450px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeVideo.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.35,
                  }}
                  className="flex flex-col justify-between gap-4 md:flex-row md:items-start"
                >
                  <div className="min-w-0">
                    <h2 className="text-xl font-black tracking-tight text-white md:text-2xl">
                      {activeVideo.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-300">
                        {activeVideo.creator}
                      </span>

                      <span>•</span>

                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {activeVideo.views} views
                      </span>

                      <span>•</span>

                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {activeVideo.duration}
                      </span>
                    </div>

                    <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-500">
                      {activeVideo.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() =>
                        showToast('Added to Watchlist')
                      }
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      WATCHLIST
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(window.location.href)
                          .catch(() => {});

                        showToast('Link copied');
                      }}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[10px] font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      SHARE
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* Featured */}

          <section className="px-4 pb-7 md:px-6">
            <div className="mx-auto max-w-[1450px]">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />

                    <span className="text-[9px] font-black uppercase tracking-[.22em] text-cyan-400">
                      Curated For You
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">
                    Featured experiences
                  </h3>
                </div>

                <button
                  onClick={() => setCategory('Featured')}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 transition hover:text-white"
                >
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {featuredVideos.map((video, index) => {
                  const active = activeVideo.id === video.id;

                  return (
                    <motion.div
                      key={video.id}
                      initial={{
                        opacity: 0,
                        y: 25,
                      }}
                      whileInView={{
                        opacity: 1,
                        y: 0,
                      }}
                      viewport={{
                        once: true,
                        margin: '-50px',
                      }}
                      transition={{
                        delay: index * 0.08,
                      }}
                      whileHover={{
                        y: -8,
                        rotateX: 2,
                        rotateY: index === 1 ? 0 : index === 0 ? 1.5 : -1.5,
                        scale: 1.015,
                      }}
                      onMouseEnter={() =>
                        setHoveredVideo(video.id)
                      }
                      onMouseLeave={() =>
                        setHoveredVideo(null)
                      }
                      onClick={() =>
                        changeVideo(video, true)
                      }
                      style={{
                        transformPerspective: 1000,
                      }}
                      className={`group relative cursor-pointer overflow-hidden rounded-[22px] border ${
                        active
                          ? 'border-cyan-400/40 bg-cyan-400/[0.06]'
                          : 'border-white/[0.08] bg-white/[0.035]'
                      } shadow-2xl transition-colors`}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <motion.img
                          src={video.thumbnail}
                          alt={video.title}
                          animate={{
                            scale:
                              hoveredVideo === video.id
                                ? 1.08
                                : 1,
                          }}
                          transition={{
                            duration: 0.6,
                          }}
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${video.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-10`}
                        />

                        <div className="absolute left-3 top-3">
                          <span className="rounded-full border border-white/15 bg-black/35 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white/80 backdrop-blur-md">
                            {video.category}
                          </span>
                        </div>

                        <div className="absolute bottom-3 right-3 rounded-md bg-black/80 px-1.5 py-1 font-mono text-[8px] text-white">
                          {video.duration}
                        </div>

                        <AnimatePresence>
                          {hoveredVideo === video.id && (
                            <motion.div
                              initial={{
                                opacity: 0,
                                scale: 0.8,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              exit={{
                                opacity: 0,
                                scale: 0.8,
                              }}
                              className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-xl"
                            >
                              <Play className="ml-0.5 h-5 w-5 fill-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="p-4">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-cyan-400">
                            {video.creator}
                          </span>

                          {active && (
                            <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400">
                              <Radio className="h-2.5 w-2.5" />
                              PLAYING
                            </span>
                          )}
                        </div>

                        <h4 className="line-clamp-1 text-xs font-black text-white">
                          {video.title}
                        </h4>

                        <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-slate-500">
                          {video.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* All videos */}

          <section className="px-4 pb-12 md:px-6">
            <div className="mx-auto max-w-[1450px]">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-blue-400" />

                  <h3 className="text-lg font-black">
                    {search
                      ? `Results for "${search}"`
                      : category === 'All'
                        ? 'All videos'
                        : category}
                  </h3>
                </div>

                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  {filteredVideos.length} videos
                </span>
              </div>

              {filteredVideos.length === 0 ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="flex min-h-[250px] flex-col items-center justify-center rounded-[24px] border border-white/[0.08] bg-white/[0.025]"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Search className="h-6 w-6 text-slate-600" />
                  </div>

                  <h4 className="text-sm font-bold text-white">
                    No videos found
                  </h4>

                  <p className="mt-1 text-[10px] text-slate-600">
                    Try another search or category.
                  </p>

                  <button
                    onClick={() => {
                      setSearch('');
                      setCategory('All');
                    }}
                    className="mt-4 rounded-xl bg-white px-4 py-2 text-[10px] font-bold text-slate-950"
                  >
                    Reset
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredVideos.map((video, index) => {
                    const active =
                      activeVideo.id === video.id;

                    return (
                      <motion.div
                        key={video.id}
                        initial={{
                          opacity: 0,
                          y: 20,
                        }}
                        whileInView={{
                          opacity: 1,
                          y: 0,
                        }}
                        viewport={{
                          once: true,
                        }}
                        transition={{
                          delay: Math.min(index * 0.04, 0.2),
                        }}
                        whileHover={{
                          y: -6,
                          scale: 1.01,
                        }}
                        onClick={() =>
                          changeVideo(video, true)
                        }
                        className={`group cursor-pointer overflow-hidden rounded-[20px] border ${
                          active
                            ? 'border-cyan-400/30 bg-cyan-400/[0.05]'
                            : 'border-white/[0.07] bg-white/[0.025]'
                        } transition-colors hover:border-white/15`}
                      >
                        <div className="relative aspect-video overflow-hidden">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-1 font-mono text-[8px]">
                            {video.duration}
                          </div>

                          <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-1 text-[7px] font-bold uppercase tracking-widest text-white/70 backdrop-blur">
                            {video.category}
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-xl">
                              <Play className="ml-0.5 h-4 w-4 fill-white" />
                            </div>
                          </div>
                        </div>

                        <div className="p-3.5">
                          <h4 className="line-clamp-1 text-[11px] font-black text-white">
                            {video.title}
                          </h4>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[8px] font-semibold text-slate-600">
                              {video.creator}
                            </span>

                            <span className="text-[8px] text-slate-600">
                              {video.views}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Mobile search */}

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-40 md:hidden">
        <div className="pointer-events-auto relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

          <input
            value={search}
            onChange={event =>
              setSearch(event.target.value)
            }
            placeholder="Search Abhishek TV..."
            className="h-11 w-full rounded-2xl border border-white/10 bg-[#10151f]/90 pl-10 pr-10 text-xs text-white shadow-2xl outline-none backdrop-blur-2xl placeholder:text-slate-600"
          />

          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

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
              y: 20,
              scale: 0.95,
            }}
            className="pointer-events-none absolute bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-white/10 bg-[#111722]/95 px-4 py-2.5 text-[10px] font-bold text-white shadow-2xl backdrop-blur-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};