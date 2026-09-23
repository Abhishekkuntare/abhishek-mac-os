import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Camera,
  Download,
  Image as ImageIcon,
  Video,
  SwitchCamera,
  X,
  Maximize2,
  Minimize2,
  Circle,
  Play,
  Pause,
  Sparkles,
  Timer,
  Zap,
  ZapOff,
  Smile,
  Type,
  Music2,
  Wand2,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Hand,
  Clock3,
  Film,
  Layers3,
  Undo2,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../../services/soundService';

type CameraMode = 'photo' | 'video';
type CaptureType = 'image' | 'video';

type FilterType =
  | 'normal'
  | 'noir'
  | 'vintage'
  | 'dream'
  | 'horror'
  | 'funny'
  | 'neon'
  | 'cyber';

type StickerType =
  | 'fire'
  | 'heart'
  | 'star'
  | 'cool'
  | 'laugh'
  | 'ghost'
  | 'sparkle'
  | 'camera';

type AudioTrack =
  | 'none'
  | 'original'
  | 'midnight'
  | 'dreamscape'
  | 'neon-drive'
  | 'funny-pop';

type CountdownValue = 0 | 3 | 5 | 10;

type VideoDuration = 10 | 30 | 60 | 0;

interface Sticker {
  id: number;
  type: StickerType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TextLayer {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface CapturedMedia {
  url: string;
  type: CaptureType;
  createdAt: number;
}

const FILTERS: {
  id: FilterType;
  name: string;
  preview: string;
  css: string;
}[] = [
  {
    id: 'normal',
    name: 'Normal',
    preview: '✨',
    css: '',
  },
  {
    id: 'noir',
    name: 'Noir',
    preview: '🖤',
    css: 'grayscale(1) contrast(1.25)',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    preview: '📷',
    css: 'sepia(.65) saturate(.8) contrast(1.08)',
  },
  {
    id: 'dream',
    name: 'Dream',
    preview: '☁️',
    css: 'brightness(1.08) saturate(1.25) blur(.15px)',
  },
  {
    id: 'horror',
    name: 'Horror',
    preview: '👻',
    css: 'contrast(1.45) saturate(1.55) hue-rotate(285deg)',
  },
  {
    id: 'funny',
    name: 'Funny',
    preview: '😂',
    css: 'saturate(1.8) contrast(1.05) hue-rotate(8deg)',
  },
  {
    id: 'neon',
    name: 'Neon',
    preview: '💜',
    css: 'saturate(2) contrast(1.2) hue-rotate(245deg)',
  },
  {
    id: 'cyber',
    name: 'Cyber',
    preview: '⚡',
    css: 'saturate(1.6) contrast(1.4) hue-rotate(165deg)',
  },
];

const STICKERS: {
  id: StickerType;
  emoji: string;
  label: string;
}[] = [
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'cool', emoji: '😎', label: 'Cool' },
  { id: 'laugh', emoji: '😂', label: 'LOL' },
  { id: 'ghost', emoji: '👻', label: 'Ghost' },
  { id: 'sparkle', emoji: '✨', label: 'Sparkle' },
  { id: 'camera', emoji: '📸', label: 'Camera' },
];

const AUDIO_TRACKS: {
  id: AudioTrack;
  name: string;
  icon: string;
}[] = [
  { id: 'none', name: 'No Music', icon: '🔇' },
  { id: 'original', name: 'Original Audio', icon: '🎙️' },
  { id: 'midnight', name: 'Midnight', icon: '🌙' },
  { id: 'dreamscape', name: 'Dreamscape', icon: '☁️' },
  { id: 'neon-drive', name: 'Neon Drive', icon: '⚡' },
  { id: 'funny-pop', name: 'Funny Pop', icon: '🎉' },
];

const FILTER_OVERLAYS: Record<FilterType, string> = {
  normal: 'transparent',
  noir: 'rgba(0,0,0,.05)',
  vintage: 'rgba(180,120,50,.10)',
  dream: 'rgba(190,160,255,.10)',
  horror: 'rgba(70,0,20,.18)',
  funny: 'rgba(255,180,0,.07)',
  neon: 'rgba(100,0,255,.13)',
  cyber: 'rgba(0,255,220,.10)',
};

const CameraApp: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const [mode, setMode] = useState<CameraMode>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'user',
  );

  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');

  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flash, setFlash] = useState(false);

  const [zoom, setZoom] = useState(1);

  const [countdown, setCountdown] = useState<CountdownValue>(0);
  const [countdownLeft, setCountdownLeft] = useState(0);

  const [videoDuration, setVideoDuration] =
    useState<VideoDuration>(30);

  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const [gestureMode, setGestureMode] = useState(false);

  const [lastCapture, setLastCapture] =
    useState<CapturedMedia | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] =
    useState(false);

  const [isStudioOpen, setIsStudioOpen] = useState(false);

  const [activeStudioTab, setActiveStudioTab] = useState<
    'filters' | 'stickers' | 'text' | 'music'
  >('filters');

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>('normal');

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);

  const [selectedAudio, setSelectedAudio] =
    useState<AudioTrack>('original');

  const [studioVolume, setStudioVolume] = useState(true);

  const [textInput, setTextInput] = useState('');

  const [isCapturingGesture, setIsCapturingGesture] =
    useState(false);

  const [lastGestureAction, setLastGestureAction] =
    useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      setIsReady(false);

      stopCamera();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not available.');
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: mode === 'video',
        });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsReady(true);
    } catch (err) {
      console.error(err);
      setIsReady(false);
      setError(
        'Camera access was blocked. Please allow camera permission and try again.',
      );
    }
  }, [facingMode, mode, stopCamera]);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }

      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPreviewOpen(false);
        setIsPreviewFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPreviewOpen]);

  useEffect(() => {
    if (!isPreviewOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreviewOpen]);

  const triggerFlash = useCallback(() => {
    if (!flashEnabled && mode === 'photo') return;

    setFlash(true);

    window.setTimeout(() => {
      setFlash(false);
    }, 180);
  }, [flashEnabled, mode]);

  const saveCapture = useCallback(
    (blob: Blob, type: CaptureType) => {
      const url = URL.createObjectURL(blob);

      setLastCapture((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.url);
        }

        return {
          url,
          type,
          createdAt: Date.now(),
        };
      });
    },
    [],
  );

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isReady) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.filter = FILTERS.find(
      (item) => item.id === selectedFilter,
    )?.css || '';

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    if (facingMode === 'user') {
      ctx.restore();
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        saveCapture(blob, 'image');

        triggerFlash();

        sound.playClick();

        setIsStudioOpen(true);
      },
      'image/jpeg',
      0.95,
    );
  }, [
    facingMode,
    isReady,
    saveCapture,
    selectedFilter,
    triggerFlash,
  ]);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;

    if (!stream || typeof MediaRecorder === 'undefined') return;

    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported(
      'video/webm;codecs=vp9,opus',
    )
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, {
      mimeType,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType,
      });

      saveCapture(blob, 'video');

      chunksRef.current = [];

      setIsRecording(false);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }

      setIsStudioOpen(true);
    };

    recorder.start();

    recorderRef.current = recorder;

    setIsRecording(true);
    setRecordingSeconds(0);

    recordingTimerRef.current = window.setInterval(() => {
      setRecordingSeconds((previous) => {
        const next = previous + 1;

        if (
          videoDuration !== 0 &&
          next >= videoDuration
        ) {
          window.setTimeout(() => {
            stopRecording();
          }, 0);
        }

        return next;
      });
    }, 1000);
  }, [saveCapture, videoDuration]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop();
    }

    recorderRef.current = null;

    setIsRecording(false);

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const executeCapture = useCallback(() => {
    if (mode === 'photo') {
      capturePhoto();
    } else if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [
    capturePhoto,
    isRecording,
    mode,
    startRecording,
    stopRecording,
  ]);

  const handleMainAction = useCallback(() => {
    if (!isReady || countdownLeft > 0) return;

    if (countdown === 0) {
      executeCapture();
      return;
    }

    setCountdownLeft(countdown);

    let remaining = countdown;

    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;

      setCountdownLeft(remaining);

      if (remaining <= 0) {
        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current);
        }

        countdownTimerRef.current = null;

        executeCapture();
      }
    }, 1000);
  }, [
    countdown,
    countdownLeft,
    executeCapture,
    isReady,
  ]);

  const switchCamera = () => {
    if (isRecording) return;

    sound.playClick();

    setFacingMode((previous) =>
      previous === 'user' ? 'environment' : 'user',
    );
  };

  const addSticker = (type: StickerType) => {
    sound.playClick();

    setStickers((items) => [
      ...items,
      {
        id: Date.now(),
        type,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
      },
    ]);
  };

  const removeSticker = (id: number) => {
    setStickers((items) =>
      items.filter((item) => item.id !== id),
    );
  };

  const addTextLayer = () => {
    const cleanText = textInput.trim();

    if (!cleanText) return;

    sound.playClick();

    setTextLayers((items) => [
      ...items,
      {
        id: Date.now(),
        text: cleanText,
        x: 50,
        y: 35,
        color: '#ffffff',
        size: 28,
        rotation: 0,
      },
    ]);

    setTextInput('');
  };

  const removeTextLayer = (id: number) => {
    setTextLayers((items) =>
      items.filter((item) => item.id !== id),
    );
  };

  const resetStudio = () => {
    sound.playClick();

    setSelectedFilter('normal');
    setStickers([]);
    setTextLayers([]);
    setSelectedAudio('original');
    setIsStudioOpen(false);
  };

  const downloadLastCapture = () => {
    if (!lastCapture) return;

    const extension =
      lastCapture.type === 'image' ? 'jpg' : 'webm';

    const link = document.createElement('a');

    link.href = lastCapture.url;
    link.download = `ABHISHEK-OS-${Date.now()}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openLastCapture = () => {
    if (!lastCapture) return;

    setIsPreviewFullscreen(false);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setIsPreviewFullscreen(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');

    const secs = (seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${mins}:${secs}`;
  };

  const selectedFilterData = useMemo(
    () =>
      FILTERS.find(
        (filter) => filter.id === selectedFilter,
      ),
    [selectedFilter],
  );

  const stickerEmoji = (type: StickerType) =>
    STICKERS.find((item) => item.id === type)?.emoji || '✨';

  return (
    <div className="relative h-full min-h-[560px] w-full overflow-hidden bg-[#030407] text-white select-none">
      {/* =========================================================
          CAMERA STAGE
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden bg-black">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/10 bg-white/5 shadow-2xl">
              <Camera className="h-10 w-10 text-white/40" />
            </div>

            <h2 className="mb-2 text-xl font-semibold">
              Camera unavailable
            </h2>

            <p className="max-w-sm text-sm leading-6 text-white/40">
              {error}
            </p>

            <button
              onClick={startCamera}
              className="mt-6 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-105 hover:bg-white/90 active:scale-95"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <motion.video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              animate={{
                scale: zoom,
              }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 18,
              }}
              className="h-full w-full object-cover"
              style={{
                transform:
                  facingMode === 'user'
                    ? `scaleX(-1) scale(${zoom})`
                    : `scale(${zoom})`,
                filter: selectedFilterData?.css || 'none',
              }}
            />

            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Filter overlay */}
            <div
              className="pointer-events-none absolute inset-0 transition-all duration-500"
              style={{
                background:
                  FILTER_OVERLAYS[selectedFilter],
              }}
            />

            {/* Cinematic vignette */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,.2)_65%,rgba(0,0,0,.75)_100%)]" />

            {/* Top cinematic glow */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />

            {/* Bottom cinematic glow */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black via-black/50 to-transparent" />

            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="relative h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-white" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================================
          FLASH
      ========================================================= */}

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-[200] bg-white"
          />
        )}
      </AnimatePresence>

      {/* =========================================================
          COUNTDOWN
      ========================================================= */}

      <AnimatePresence>
        {countdownLeft > 0 && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.4,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 1.5,
            }}
            className="absolute inset-0 z-[100] flex items-center justify-center"
          >
            <motion.div
              key={countdownLeft}
              initial={{
                scale: 1.5,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className="flex h-36 w-36 items-center justify-center rounded-full border border-white/20 bg-black/40 text-7xl font-bold shadow-[0_0_80px_rgba(255,255,255,.15)] backdrop-blur-xl"
            >
              {countdownLeft}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          TOP BAR
      ========================================================= */}

      <div className="absolute left-0 right-0 top-0 z-40 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate: -8,
                scale: 1.05,
              }}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35 shadow-2xl backdrop-blur-2xl"
            >
              <Camera className="h-5 w-5" />
            </motion.div>

            <div>
              <div className="text-sm font-semibold tracking-wide">
                Camera Studio
              </div>

              <div className="text-[9px] uppercase tracking-[0.25em] text-white/35">
                ABHISHEK OS
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                sound.playClick();
                setFlashEnabled((value) => !value);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition ${
                flashEnabled
                  ? 'border-amber-300/30 bg-amber-400/20 text-amber-200'
                  : 'border-white/10 bg-black/35 text-white/70'
              }`}
              title="Flash"
            >
              {flashEnabled ? (
                <Zap className="h-4 w-4" />
              ) : (
                <ZapOff className="h-4 w-4" />
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={switchCamera}
              disabled={isRecording || !isReady}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white backdrop-blur-xl transition hover:bg-white/10 disabled:opacity-30"
              title="Switch camera"
            >
              <SwitchCamera className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* =========================================================
          RECORDING HUD
      ========================================================= */}

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{
              opacity: 0,
              y: -15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -15,
            }}
            className="absolute left-1/2 top-20 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-red-500/20 bg-black/50 px-4 py-2 backdrop-blur-2xl">
              <motion.span
                animate={{
                  opacity: [1, 0.35, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                }}
                className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,.8)]"
              />

              <span className="font-mono text-xs font-semibold">
                {formatTime(recordingSeconds)}
              </span>

              <span className="text-[10px] text-white/40">
                REC
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          ZOOM CONTROL
      ========================================================= */}

      {!isStudioOpen && (
        <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-black/35 p-1.5 backdrop-blur-2xl">
            {[1, 1.5, 2, 3].map((value) => (
              <button
                key={value}
                onClick={() => {
                  sound.playClick();
                  setZoom(value);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-semibold transition ${
                  zoom === value
                    ? 'bg-white text-black'
                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}
              >
                {value}x
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          GESTURE MODE INDICATOR
      ========================================================= */}

      {gestureMode && (
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="absolute bottom-40 left-1/2 z-30 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-cyan-300/20 bg-black/50 px-4 py-2 text-xs text-cyan-200 backdrop-blur-xl">
            <Hand className="h-4 w-4" />
            Gesture capture enabled
          </div>
        </motion.div>
      )}

      {/* =========================================================
          MODE SELECTOR
      ========================================================= */}

      {!isStudioOpen && (
        <div className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/45 p-1 backdrop-blur-2xl shadow-2xl">
            <button
              onClick={() =>
                !isRecording && setMode('photo')
              }
              className={`rounded-full px-6 py-2 text-[11px] font-bold tracking-wider transition ${
                mode === 'photo'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              PHOTO
            </button>

            <button
              onClick={() =>
                !isRecording && setMode('video')
              }
              className={`rounded-full px-6 py-2 text-[11px] font-bold tracking-wider transition ${
                mode === 'video'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              VIDEO
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          CAPTURE BUTTON
      ========================================================= */}

      {!isStudioOpen && (
        <div className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2">
          <motion.button
            whileHover={{
              scale: 1.06,
            }}
            whileTap={{
              scale: 0.9,
            }}
            onClick={handleMainAction}
            disabled={!isReady || countdownLeft > 0}
            className="relative flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-white/90 bg-white/10 shadow-[0_0_60px_rgba(255,255,255,.12)] backdrop-blur-xl disabled:opacity-30"
          >
            <motion.div
              animate={
                isRecording
                  ? {
                      scale: [1, 0.92, 1],
                    }
                  : {}
              }
              transition={{
                repeat: Infinity,
                duration: 1.2,
              }}
              className={`${
                isRecording
                  ? 'h-9 w-9 rounded-xl bg-red-500 shadow-[0_0_30px_rgba(239,68,68,.5)]'
                  : mode === 'video'
                    ? 'h-16 w-16 rounded-full bg-red-500 shadow-[0_0_35px_rgba(239,68,68,.35)]'
                    : 'h-16 w-16 rounded-full bg-white shadow-[0_0_35px_rgba(255,255,255,.25)]'
              }`}
            />
          </motion.button>
        </div>
      )}

      {/* =========================================================
          QUICK OPTIONS
      ========================================================= */}

      {!isStudioOpen && (
        <div className="absolute bottom-8 right-5 z-30 flex flex-col gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setGestureMode((value) => !value);
            }}
            className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-xl transition ${
              gestureMode
                ? 'border-cyan-300/30 bg-cyan-400/20 text-cyan-200'
                : 'border-white/10 bg-black/35 text-white/60'
            }`}
            title="Gesture capture"
          >
            <Hand className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCountdown(
                countdown === 0
                  ? 3
                  : countdown === 3
                    ? 5
                    : countdown === 5
                      ? 10
                      : 0,
              );
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/60 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
            title="Countdown"
          >
            <Timer className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Countdown label */}
      {!isStudioOpen && countdown > 0 && (
        <div className="absolute bottom-[170px] left-1/2 z-30 -translate-x-1/2">
          <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] text-white/60 backdrop-blur-xl">
            Timer: {countdown}s
          </div>
        </div>
      )}

      {/* =========================================================
          LAST CAPTURE
      ========================================================= */}

      <AnimatePresence>
        {lastCapture && !isStudioOpen && (
          <motion.button
            initial={{
              opacity: 0,
              scale: 0.7,
              x: -15,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.7,
              x: -15,
            }}
            onClick={openLastCapture}
            className="group absolute bottom-8 left-5 z-30 h-16 w-16 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl"
          >
            {lastCapture.type === 'image' ? (
              <img
                src={lastCapture.url}
                alt="Last capture"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
            ) : (
              <video
                src={lastCapture.url}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            )}

            {lastCapture.type === 'video' && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                </span>
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* =========================================================
          SNAP STUDIO
      ========================================================= */}

      <AnimatePresence>
        {isStudioOpen && lastCapture && (
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
            className="absolute inset-0 z-[120] flex flex-col bg-[#050609]"
          >
            {/* Studio top bar */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] bg-black/40 px-4 backdrop-blur-2xl">
              <button
                onClick={resetStudio}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
                Camera
              </button>

              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-[0.18em]">
                  Snap Studio
                </span>
              </div>

              <button
                onClick={downloadLastCapture}
                className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:scale-105 active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                Save
              </button>
            </div>

            {/* Studio workspace */}
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              {/* Preview */}
              <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#020204] p-3 sm:p-6">
                <div className="relative h-full max-h-[700px] w-full max-w-[900px] overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_30px_100px_rgba(0,0,0,.7)]">
                  {lastCapture.type === 'image' ? (
                    <img
                      src={lastCapture.url}
                      alt="Studio preview"
                      className="h-full w-full object-contain"
                      style={{
                        filter:
                          selectedFilterData?.css || 'none',
                      }}
                    />
                  ) : (
                    <video
                      src={lastCapture.url}
                      controls
                      autoPlay
                      muted={!studioVolume}
                      loop
                      playsInline
                      className="h-full w-full object-contain"
                      style={{
                        filter:
                          selectedFilterData?.css || 'none',
                      }}
                    />
                  )}

                  {/* Filter overlay */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        FILTER_OVERLAYS[selectedFilter],
                    }}
                  />

                  {/* Stickers */}
                  {stickers.map((sticker) => (
                    <motion.div
                      key={sticker.id}
                      drag
                      dragConstraints="parent"
                      initial={{
                        scale: 0,
                        rotate: -20,
                      }}
                      animate={{
                        scale: sticker.scale,
                        rotate: sticker.rotation,
                      }}
                      whileHover={{
                        scale: sticker.scale * 1.12,
                      }}
                      className="absolute cursor-grab touch-none text-5xl drop-shadow-[0_10px_15px_rgba(0,0,0,.45)] active:cursor-grabbing"
                      style={{
                        left: `${sticker.x}%`,
                        top: `${sticker.y}%`,
                        transform:
                          'translate(-50%, -50%)',
                      }}
                    >
                      {stickerEmoji(sticker.type)}

                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removeSticker(sticker.id);
                        }}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Text layers */}
                  {textLayers.map((layer) => (
                    <motion.div
                      key={layer.id}
                      drag
                      dragConstraints="parent"
                      initial={{
                        scale: 0,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      className="group absolute cursor-grab active:cursor-grabbing"
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                      }}
                    >
                      <div
                        className="rounded-xl px-3 py-1.5 font-bold drop-shadow-[0_5px_15px_rgba(0,0,0,.6)]"
                        style={{
                          color: layer.color,
                          fontSize: layer.size,
                          textShadow:
                            '0 3px 12px rgba(0,0,0,.8)',
                        }}
                      >
                        {layer.text}
                      </div>

                      <button
                        onClick={() =>
                          removeTextLayer(layer.id)
                        }
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 opacity-0 transition group-hover:opacity-100 hover:bg-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Studio badge */}
                  <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-white/50 backdrop-blur-xl">
                    ABHISHEK OS
                  </div>

                  {/* Video sound control */}
                  {lastCapture.type === 'video' && (
                    <button
                      onClick={() =>
                        setStudioVolume((value) => !value)
                      }
                      className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-xl"
                    >
                      {studioVolume ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Studio tools */}
              <div className="flex h-[290px] shrink-0 flex-col border-t border-white/[0.07] bg-[#08090d] lg:h-auto lg:w-[360px] lg:border-l lg:border-t-0">
                {/* Tool navigation */}
                <div className="grid grid-cols-4 border-b border-white/[0.07]">
                  {[
                    {
                      id: 'filters' as const,
                      icon: Wand2,
                      label: 'Filters',
                    },
                    {
                      id: 'stickers' as const,
                      icon: Smile,
                      label: 'Stickers',
                    },
                    {
                      id: 'text' as const,
                      icon: Type,
                      label: 'Text',
                    },
                    {
                      id: 'music' as const,
                      icon: Music2,
                      label: 'Audio',
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          sound.playClick();
                          setActiveStudioTab(item.id);
                        }}
                        className={`relative flex flex-col items-center gap-1.5 py-3 text-[9px] font-semibold transition ${
                          activeStudioTab === item.id
                            ? 'text-white'
                            : 'text-white/35 hover:text-white/70'
                        }`}
                      >
                        <Icon className="h-4 w-4" />

                        {item.label}

                        {activeStudioTab === item.id && (
                          <motion.div
                            layoutId="studioTab"
                            className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-amber-400"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tools content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  {/* FILTERS */}
                  {activeStudioTab === 'filters' && (
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold">
                            Camera Filters
                          </h3>

                          <p className="text-[10px] text-white/30">
                            Transform your snap
                          </p>
                        </div>

                        <SlidersHorizontal className="h-4 w-4 text-white/25" />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {FILTERS.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedFilter(filter.id);
                            }}
                            className={`group relative overflow-hidden rounded-2xl border p-2 transition ${
                              selectedFilter === filter.id
                                ? 'border-amber-300/50 bg-amber-400/10 shadow-[0_0_20px_rgba(245,158,11,.12)]'
                                : 'border-white/[0.06] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="mb-1 flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-black text-2xl">
                              {filter.preview}
                            </div>

                            <div className="truncate text-[9px] text-white/55">
                              {filter.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STICKERS */}
                  {activeStudioTab === 'stickers' && (
                    <div>
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold">
                          Stickers
                        </h3>

                        <p className="text-[10px] text-white/30">
                          Drag stickers anywhere on your snap
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {STICKERS.map((sticker) => (
                          <motion.button
                            key={sticker.id}
                            whileHover={{
                              scale: 1.06,
                            }}
                            whileTap={{
                              scale: 0.9,
                            }}
                            onClick={() =>
                              addSticker(sticker.id)
                            }
                            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.025] text-3xl transition hover:border-white/15 hover:bg-white/[0.06]"
                          >
                            <span>
                              {sticker.emoji}
                            </span>

                            <span className="text-[8px] text-white/30">
                              {sticker.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>

                      {stickers.length > 0 && (
                        <button
                          onClick={() => setStickers([])}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/5 py-2 text-[10px] text-red-300/70 transition hover:bg-red-400/10"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove all stickers
                        </button>
                      )}
                    </div>
                  )}

                  {/* TEXT */}
                  {activeStudioTab === 'text' && (
                    <div>
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold">
                          Add Text
                        </h3>

                        <p className="text-[10px] text-white/30">
                          Add captions to your snap
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          value={textInput}
                          onChange={(event) =>
                            setTextInput(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              addTextLayer();
                            }
                          }}
                          placeholder="Type something..."
                          maxLength={80}
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-amber-300/30"
                        />

                        <button
                          onClick={addTextLayer}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:scale-105 active:scale-95"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          '✨ Amazing',
                          '🔥 Vibes',
                          'POV: Me',
                          'Hello 👋',
                          'Weekend!',
                        ].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              setTextInput(preset);
                              window.setTimeout(
                                addTextLayer,
                                0,
                              );
                            }}
                            className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[10px] text-white/55 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AUDIO */}
                  {activeStudioTab === 'music' && (
                    <div>
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold">
                          Sounds
                        </h3>

                        <p className="text-[10px] text-white/30">
                          Choose the audio mood
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        {AUDIO_TRACKS.map((track) => (
                          <button
                            key={track.id}
                            onClick={() => {
                              sound.playClick();
                              setSelectedAudio(track.id);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                              selectedAudio === track.id
                                ? 'border-amber-300/30 bg-amber-400/[0.08]'
                                : 'border-white/[0.05] bg-white/[0.025] hover:bg-white/[0.05]'
                            }`}
                          >
                            <span className="text-xl">
                              {track.icon}
                            </span>

                            <span className="flex-1 text-xs">
                              {track.name}
                            </span>

                            {selectedAudio ===
                              track.id && (
                              <Check className="h-4 w-4 text-amber-300" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Studio bottom actions */}
                <div className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] p-3">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setSelectedFilter('normal');
                      setStickers([]);
                      setTextLayers([]);
                      setSelectedAudio('original');
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:bg-white/[0.07] hover:text-white"
                    title="Reset edits"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    onClick={downloadLastCapture}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold text-black shadow-[0_8px_25px_rgba(245,158,11,.2)] transition hover:scale-[1.02] active:scale-[.98]"
                  >
                    <Download className="h-4 w-4" />
                    SAVE SNAP
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          FULL QUICK LOOK
      ========================================================= */}

      <AnimatePresence>
        {isPreviewOpen && lastCapture && (
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
            className="absolute inset-0 z-[300] flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl sm:p-8"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closePreview();
              }
            }}
          >
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl">
                  {lastCapture.type === 'image' ? (
                    <ImageIcon className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="text-sm font-semibold">
                    {lastCapture.type === 'image'
                      ? 'Photo'
                      : 'Video'}
                  </div>

                  <div className="text-[10px] text-white/35">
                    ABHISHEK OS Quick Look
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={downloadLastCapture}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() =>
                    setIsPreviewFullscreen(
                      (value) => !value,
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition hover:bg-white/20"
                >
                  {isPreviewFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={closePreview}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-xl transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <motion.div
              initial={{
                scale: 0.92,
                opacity: 0,
              }}
              animate={{
                scale: 1,
                opacity: 1,
              }}
              className={`relative flex items-center justify-center overflow-hidden bg-black shadow-[0_40px_120px_rgba(0,0,0,.8)] ${
                isPreviewFullscreen
                  ? 'h-full w-full'
                  : 'h-full max-h-[760px] w-full max-w-[1100px] rounded-[28px] border border-white/10'
              }`}
            >
              {lastCapture.type === 'image' ? (
                <img
                  src={lastCapture.url}
                  alt="Captured photo"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  src={lastCapture.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CameraApp;
export { CameraApp };

