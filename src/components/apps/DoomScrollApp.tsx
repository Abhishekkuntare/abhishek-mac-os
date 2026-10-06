import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Compass,
  ExternalLink,
  Grip,
  Globe2,
  Music2,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import doomScrollLogoVideo from '../../assets/doom-scroll/doomscroll-logo.mp4';
import { useOS } from '../../context/OSContext';
import instagramLogo from '../../assets/doom-scroll/instagram.jpg';
import snapchatLogo from '../../assets/doom-scroll/snapchat.png';
import whatsappLogo from '../../assets/doom-scroll/whatsapp.png';
import threadsLogo from '../../assets/doom-scroll/threads.png';
import linkedinLogo from '../../assets/doom-scroll/linkedin.png';
import xLogo from '../../assets/doom-scroll/x.jpg';
import discordLogo from '../../assets/doom-scroll/discord.png';
import telegramLogo from '../../assets/doom-scroll/telegram.png';
import spotifyLogo from '../../assets/doom-scroll/spotify.png';
import pinterestLogo from '../../assets/doom-scroll/pinterest.png';
import facebookLogo from '../../assets/doom-scroll/facebook.png';
import redditLogo from '../../assets/doom-scroll/reddit.png';
import youtubeLogo from '../../assets/doom-scroll/youtube.png';

interface SocialPlatform {
  id: string;
  name: string;
  category: 'social' | 'music';
  tagline: string;
  url: string;
  logo: string;
  accent: string;
}

interface SiteModalBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SiteModalGesture {
  kind: 'drag' | 'resize';
  pointerId: number;
  startX: number;
  startY: number;
  bounds: SiteModalBounds;
}

interface OpenSocialWindow {
  instanceId: number;
  platform: SocialPlatform;
  bounds: SiteModalBounds;
  currentUrl: string;
  loadError: string;
  isLoading: boolean;
}

const PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', category: 'social', tagline: 'Photos, reels & messages', url: 'https://www.instagram.com/', logo: instagramLogo, accent: '#f472b6' },
  { id: 'snapchat', name: 'Snapchat', category: 'social', tagline: 'Snaps & conversations', url: 'https://www.snapchat.com/', logo: snapchatLogo, accent: '#facc15' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'social', tagline: 'Private chats & calls', url: 'https://web.whatsapp.com/', logo: whatsappLogo, accent: '#4ade80' },
  { id: 'x', name: 'X', category: 'social', tagline: 'What’s happening now', url: 'https://x.com/', logo: xLogo, accent: '#f8fafc' },
  { id: 'threads', name: 'Threads', category: 'social', tagline: 'Join the conversation', url: 'https://www.threads.net/', logo: threadsLogo, accent: '#f8fafc' },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', tagline: 'Your professional network', url: 'https://www.linkedin.com/', logo: linkedinLogo, accent: '#38bdf8' },
  { id: 'discord', name: 'Discord', category: 'social', tagline: 'Communities & voice chat', url: 'https://discord.com/app', logo: discordLogo, accent: '#818cf8' },
  { id: 'telegram', name: 'Telegram', category: 'social', tagline: 'Fast messaging, everywhere', url: 'https://web.telegram.org/', logo: telegramLogo, accent: '#38bdf8' },
  { id: 'spotify', name: 'Spotify', category: 'music', tagline: 'Music, podcasts & playlists', url: 'https://open.spotify.com/', logo: spotifyLogo, accent: '#4ade80' },
  { id: 'pinterest', name: 'Pinterest', category: 'social', tagline: 'Ideas worth saving', url: 'https://www.pinterest.com/', logo: pinterestLogo, accent: '#fb7185' },
  { id: 'facebook', name: 'Facebook', category: 'social', tagline: 'Friends, groups & updates', url: 'https://www.facebook.com/', logo: facebookLogo, accent: '#60a5fa' },
  { id: 'reddit', name: 'Reddit', category: 'social', tagline: 'Communities for everything', url: 'https://www.reddit.com/', logo: redditLogo, accent: '#fb713d' },
  { id: 'youtube', name: 'YouTube', category: 'social', tagline: 'Videos, creators & live', url: 'https://www.youtube.com/', logo: youtubeLogo, accent: '#f87171' },
];

interface SocialWebviewElement extends HTMLElement {
  getURL: () => string;
  reload: () => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

type SocialWebviewTagProps = {
  src: string;
  partition: string;
  ref: React.Ref<SocialWebviewElement>;
  style: React.CSSProperties;
};

const SocialWebviewTag = 'webview' as unknown as React.ComponentType<SocialWebviewTagProps>;

const PlatformWebview: React.FC<{
  platform: SocialPlatform;
  onAttach: (webview: SocialWebviewElement | null) => void;
  onUrlChange: (url: string) => void;
  onLoadError: (message: string) => void;
  onLoading: (loading: boolean) => void;
}> = ({ platform, onAttach, onUrlChange, onLoadError, onLoading }) => {
  const webviewRef = useRef<SocialWebviewElement | null>(null);
  const handlersRef = useRef({ onUrlChange, onLoadError, onLoading });
  handlersRef.current = { onUrlChange, onLoadError, onLoading };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    const navigated = (event: Event) => {
      const url = (event as Event & { url?: string }).url;
      if (url) handlersRef.current.onUrlChange(url);
    };
    const failed = (event: Event) => {
      const detail = event as Event & {
        errorCode?: number;
        errorDescription?: string;
        isMainFrame?: boolean;
      };
      if (detail.isMainFrame && detail.errorCode !== -3) {
        handlersRef.current.onLoadError(
          detail.errorDescription || 'This provider may not allow sign-in inside an embedded window.',
        );
        handlersRef.current.onLoading(false);
      }
    };
    const started = () => handlersRef.current.onLoading(true);
    const stopped = () => handlersRef.current.onLoading(false);
    webview.addEventListener('did-navigate', navigated);
    webview.addEventListener('did-navigate-in-page', navigated);
    webview.addEventListener('did-fail-load', failed);
    webview.addEventListener('did-start-loading', started);
    webview.addEventListener('did-stop-loading', stopped);
    return () => {
      webview.removeEventListener('did-navigate', navigated);
      webview.removeEventListener('did-navigate-in-page', navigated);
      webview.removeEventListener('did-fail-load', failed);
      webview.removeEventListener('did-start-loading', started);
      webview.removeEventListener('did-stop-loading', stopped);
    };
  }, []);

  return (
    <SocialWebviewTag
      ref={element => {
        webviewRef.current = element;
        onAttach(element);
      }}
      src={platform.url}
      partition="persist:abhishek-browser"
      style={{ display: 'flex', width: '100%', height: '100%' }}
    />
  );
};

const SocialServiceWindow: React.FC<{
  siteWindow: OpenSocialWindow;
  zIndex: number;
  appRoot: HTMLDivElement | null;
  onFocus: () => void;
  onClose: () => void;
  onBoundsChange: (bounds: SiteModalBounds) => void;
  onUrlChange: (url: string) => void;
  onLoadError: (message: string) => void;
  onLoading: (loading: boolean) => void;
  onOpenExternal: (url: string) => void;
}> = ({
  siteWindow,
  zIndex,
  appRoot,
  onFocus,
  onClose,
  onBoundsChange,
  onUrlChange,
  onLoadError,
  onLoading,
  onOpenExternal,
}) => {
  const webviewRef = useRef<SocialWebviewElement | null>(null);
  const gestureRef = useRef<SiteModalGesture | null>(null);

  const beginGesture = (event: React.PointerEvent<HTMLElement>, kind: SiteModalGesture['kind']) => {
    if (event.button !== 0) return;
    if (kind === 'drag' && (event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    gestureRef.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      bounds: siteWindow.bounds,
    };
    onFocus();
  };

  const moveGesture = (event: React.PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const rootBounds = appRoot?.getBoundingClientRect();
    const rootWidth = rootBounds?.width ?? window.innerWidth;
    const rootHeight = rootBounds?.height ?? window.innerHeight;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (gesture.kind === 'drag') {
      onBoundsChange({
        ...gesture.bounds,
        x: Math.min(Math.max(0, rootWidth - 96), Math.max(0, gesture.bounds.x + deltaX)),
        y: Math.min(Math.max(0, rootHeight - 56), Math.max(0, gesture.bounds.y + deltaY)),
      });
      return;
    }
    const maxWidth = Math.max(240, rootWidth - gesture.bounds.x);
    const maxHeight = Math.max(220, rootHeight - gesture.bounds.y);
    onBoundsChange({
      ...gesture.bounds,
      width: Math.min(maxWidth, Math.max(Math.min(420, maxWidth), gesture.bounds.width + deltaX)),
      height: Math.min(maxHeight, Math.max(Math.min(320, maxHeight), gesture.bounds.height + deltaY)),
    });
  };

  const endGesture = (event: React.PointerEvent<HTMLElement>) => {
    if (gestureRef.current?.pointerId === event.pointerId) gestureRef.current = null;
  };

  return (
    <motion.section
      role="dialog"
      aria-label={`${siteWindow.platform.name} website`}
      onMouseDown={onFocus}
      className="absolute flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0b0d14] shadow-[0_35px_140px_rgba(0,0,0,.8)]"
      style={{
        left: siteWindow.bounds.x,
        top: siteWindow.bounds.y,
        width: siteWindow.bounds.width,
        height: siteWindow.bounds.height,
        zIndex,
      }}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 290, damping: 27 }}
    >
      <header
        onPointerDown={event => beginGesture(event, 'drag')}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        className="flex shrink-0 touch-none cursor-grab items-center gap-2.5 border-b border-white/[0.08] bg-[#10121b] px-3 py-2.5 active:cursor-grabbing sm:gap-3 sm:px-4"
        title={`Drag to move ${siteWindow.platform.name}`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-0.5">
          <img src={siteWindow.platform.logo} alt="" className="h-full w-full rounded-[9px] object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-white">{siteWindow.platform.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 truncate text-[9px] text-slate-500">
            <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-300" />
            {(() => {
              try { return new URL(siteWindow.currentUrl).host; } catch { return 'Official website'; }
            })()}
          </div>
        </div>
        <button
          type="button"
          aria-label="Go back"
          onClick={() => {
            if (webviewRef.current?.canGoBack()) webviewRef.current.goBack();
          }}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Go forward"
          onClick={() => {
            if (webviewRef.current?.canGoForward()) webviewRef.current.goForward();
          }}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Reload page"
          onClick={() => webviewRef.current?.reload()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${siteWindow.isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={() => onOpenExternal(siteWindow.currentUrl)}
          className="hidden h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[9px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white md:flex"
        >
          Open in browser
          <ExternalLink className="h-3 w-3" />
        </button>
        <button
          type="button"
          aria-label={`Close ${siteWindow.platform.name}`}
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="relative min-h-0 flex-1 bg-white">
        <PlatformWebview
          key={siteWindow.instanceId}
          platform={siteWindow.platform}
          onAttach={webview => {
            webviewRef.current = webview;
          }}
          onUrlChange={onUrlChange}
          onLoadError={onLoadError}
          onLoading={onLoading}
        />
        {siteWindow.loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0b0d14]/95 p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                <Globe2 className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-white">This service blocked the in-app window</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">{siteWindow.loadError}</p>
              <button
                type="button"
                onClick={() => onOpenExternal(siteWindow.currentUrl)}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-500 px-4 text-xs font-bold text-white transition hover:bg-violet-400"
              >
                Continue in system browser
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      <footer className="flex shrink-0 items-center gap-2 border-t border-white/[0.08] bg-[#10121b] px-4 py-2 text-[9px] text-slate-500">
        <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-300" />
        Provider-hosted sign-in · Your password is not stored by Doom Scroll
      </footer>
      <button
        type="button"
        aria-label={`Resize ${siteWindow.platform.name} window`}
        title="Drag to resize"
        onPointerDown={event => beginGesture(event, 'resize')}
        onPointerMove={moveGesture}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        className="absolute bottom-0 right-0 z-20 flex h-6 w-6 touch-none cursor-nwse-resize items-center justify-center rounded-tl-lg border-l border-t border-white/10 bg-[#171a25] text-slate-400 transition hover:text-white"
      >
        <Grip className="h-3.5 w-3.5" />
      </button>
    </motion.section>
  );
};

export const DoomScrollApp: React.FC = () => {
  const { recordActivity } = useOS();
  const [filter, setFilter] = useState<'all' | 'social' | 'music'>('all');
  const [search, setSearch] = useState('');
  const [openWindows, setOpenWindows] = useState<OpenSocialWindow[]>([]);
  const nextWindowIdRef = useRef(1);
  const appRootRef = useRef<HTMLDivElement | null>(null);

  const visiblePlatforms = PLATFORMS.filter(platform => {
    const matchesFilter = filter === 'all' || platform.category === filter;
    const matchesSearch = `${platform.name} ${platform.tagline}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openPlatform = (platform: SocialPlatform) => {
    const alreadyOpen = openWindows.some(item => item.platform.id === platform.id);
    if (!alreadyOpen) {
      void recordActivity({
        category: 'app',
        title: 'Opened service',
        details: platform.name,
        context: {
          appId: 'doomscroll',
          appName: 'Doom Scroll',
          windowTitle: platform.name,
          itemName: platform.name,
          itemType: 'Website',
        },
      });
    }
    const root = appRootRef.current;
    const rootWidth = root?.clientWidth ?? window.innerWidth;
    const rootHeight = root?.clientHeight ?? window.innerHeight;
    const width = Math.min(760, Math.max(320, rootWidth - 32));
    const height = Math.min(500, Math.max(280, rootHeight - 32));
    const instanceId = nextWindowIdRef.current++;
    setOpenWindows(current => {
      const existingIndex = current.findIndex(item => item.platform.id === platform.id);
      if (existingIndex >= 0) {
        const next = [...current];
        const [existing] = next.splice(existingIndex, 1);
        next.push(existing);
        return next;
      }
      const offset = (current.length % 8) * 34;
      return [...current, {
        instanceId,
        platform,
        bounds: {
          x: Math.max(0, Math.min(Math.round((rootWidth - width) / 2) + offset, rootWidth - width)),
          y: Math.max(0, Math.min(Math.round((rootHeight - height) / 2) + offset, rootHeight - height)),
          width,
          height,
        },
        currentUrl: platform.url,
        loadError: '',
        isLoading: true,
      }];
    });
  };

  const updateSocialWindow = (windowId: number, update: Partial<OpenSocialWindow>) => {
    setOpenWindows(current => current.map(item =>
      item.instanceId === windowId ? { ...item, ...update } : item,
    ));
  };

  const closeSocialWindow = (windowId: number) => {
    const closingWindow = openWindows.find(item => item.instanceId === windowId);
    if (closingWindow) {
      void recordActivity({
        category: 'app',
        title: 'Closed service',
        details: closingWindow.platform.name,
        context: {
          appId: 'doomscroll',
          appName: 'Doom Scroll',
          windowTitle: closingWindow.platform.name,
          itemName: closingWindow.platform.name,
          itemType: 'Website',
        },
      });
    }
    setOpenWindows(current => current.filter(item => item.instanceId !== windowId));
  };

  const focusSocialWindow = (windowId: number) => {
    setOpenWindows(current => {
      const index = current.findIndex(item => item.instanceId === windowId);
      if (index < 0 || index === current.length - 1) return current;
      const next = [...current];
      const [focused] = next.splice(index, 1);
      next.push(focused);
      return next;
    });
  };

  const openExternal = async (url: string, windowId: number) => {
    try {
      if (!/^https?:\/\//i.test(url)) throw new Error('Only secure web links can be opened.');
      if (window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(url);
      } else {
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) throw new Error('The website could not be opened by your browser.');
      }
    } catch (error) {
      console.error('[Doom Scroll] Could not open provider website:', error);
      updateSocialWindow(windowId, {
        loadError: error instanceof Error ? error.message : 'Could not open that website.',
      });
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openWindows.length > 0) {
        closeSocialWindow(openWindows[openWindows.length - 1].instanceId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openWindows]);

  useEffect(() => {
    const root = appRootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const resizeObserver = new ResizeObserver(() => {
      const width = root.clientWidth;
      const height = root.clientHeight;
      setOpenWindows(current => current.map(item => {
        const nextWidth = Math.min(item.bounds.width, Math.max(240, width));
        const nextHeight = Math.min(item.bounds.height, Math.max(220, height));
        return {
          ...item,
          bounds: {
            x: Math.max(0, Math.min(item.bounds.x, width - nextWidth)),
            y: Math.max(0, Math.min(item.bounds.y, height - nextHeight)),
            width: nextWidth,
            height: nextHeight,
          },
        };
      }));
    });
    resizeObserver.observe(root);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={appRootRef} className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#080913] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/[0.08] blur-[120px]" />

      <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_8px_35px_rgba(124,58,237,.24)]">
            <video
              src={doomScrollLogoVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-black tracking-tight sm:text-base">Doom Scroll</h1>
              <span className="rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.15em] text-violet-200">Social hub</span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-slate-500">Your internet, one little universe.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-[9px] text-slate-400 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
          Sign in on official websites
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative mb-7 overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#201733]/90 via-[#151328]/90 to-[#101626]/90 p-5 shadow-2xl shadow-black/20 sm:p-8"
          >
            <div aria-hidden="true" className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-[75px]" />
            <div aria-hidden="true" className="absolute bottom-[-8rem] right-1/3 h-64 w-64 rounded-full bg-indigo-400/10 blur-[75px]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <div className="mb-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-violet-200/80">
                  <Compass className="h-3.5 w-3.5" />
                  A portal to your favorites
                </div>
                <h2 className="text-3xl font-black leading-tight tracking-[-.04em] sm:text-4xl">
                  One place.
                  <span className="block bg-gradient-to-r from-fuchsia-300 via-violet-200 to-sky-200 bg-clip-text text-transparent">All your scrolls.</span>
                </h2>
                <p className="mt-3 max-w-lg text-xs leading-5 text-slate-300/70">
                  Jump into your favorite social spaces and music. Each tile opens the real service; sign-in stays with that provider.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex -space-x-2">
                  {PLATFORMS.slice(0, 4).map(platform => (
                    <span key={platform.id} className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-[#18152a] bg-white/10">
                      <img src={platform.logo} alt="" className="h-full w-full object-cover" />
                    </span>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-black">{PLATFORMS.length} destinations</div>
                  <div className="mt-0.5 text-[9px] text-slate-500">Ready when you are</div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold">Pick your next stop</h3>
              <p className="mt-1 text-[10px] text-slate-500">Open a service in its own in-app window.</p>
            </div>
            <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-3 transition focus-within:border-violet-300/35 sm:max-w-[230px]">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Find a service"
                aria-label="Search services"
                className="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none placeholder:text-slate-600"
              />
            </label>
          </div>

          <div className="mb-5 flex items-center gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1.5 sm:w-fit">
            {([
              ['all', 'All services', PLATFORMS.length],
              ['social', 'Social', PLATFORMS.filter(platform => platform.category === 'social').length],
              ['music', 'Music', PLATFORMS.filter(platform => platform.category === 'music').length],
            ] as const).map(([id, label, count]) => (
              <button
                type="button"
                key={id}
                onClick={() => setFilter(id)}
                className={`flex h-8 items-center gap-2 rounded-xl px-3 text-[10px] font-semibold transition ${filter === id ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'}`}
              >
                {id === 'music' && <Music2 className="h-3.5 w-3.5" />}
                {label}
                <span className={`text-[9px] ${filter === id ? 'text-violet-200' : 'text-slate-600'}`}>{count}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visiblePlatforms.map((platform, index) => (
                <motion.button
                  type="button"
                  key={platform.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.24, delay: Math.min(index * 0.035, 0.21) }}
                  whileHover={{ y: -4, rotateX: 1.5, rotateY: -1.5, scale: 1.012 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => openPlatform(platform)}
                  className="group relative overflow-hidden rounded-[22px] border border-white/[0.085] bg-gradient-to-br from-white/[0.06] to-white/[0.018] p-4 text-left shadow-lg shadow-black/10 transition-colors hover:border-white/20 hover:from-white/[0.085]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full opacity-[0.12] blur-[45px] transition-opacity duration-300 group-hover:opacity-30"
                    style={{ backgroundColor: platform.accent }}
                  />
                  <span className="relative flex items-center gap-3.5">
                    <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[17px] border border-white/10 bg-white/5 p-1 shadow-lg shadow-black/20 transition duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]">
                      <img src={platform.logo} alt="" className="h-full w-full rounded-[12px] object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-bold text-white">{platform.name}</span>
                        {platform.category === 'music' && <Music2 className="h-3 w-3 text-emerald-300" />}
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-slate-500">{platform.tagline}</span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-500 transition group-hover:border-white/15 group-hover:bg-white/10 group-hover:text-white">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </span>
                  <span className="relative mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[9px] text-slate-600">
                    <span className="flex items-center gap-1.5"><Globe2 className="h-3 w-3" /> Official website</span>
                    <span className="font-semibold text-slate-400 transition group-hover:text-white">Open service</span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          {visiblePlatforms.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-xs text-slate-500">
              No services match “{search}”.
            </div>
          )}

          <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" />
            <p className="text-[10px] leading-5 text-slate-500">
              Sign in only on the official provider page. Doom Scroll does not collect or store passwords. If a service blocks embedded sign-in, open it in your system browser from the sign-in window.
            </p>
          </div>
        </div>
      </main>

      {openWindows.length > 0 && (
        <nav
          aria-label="Open social service windows"
          className="absolute right-3 top-[72px] z-[10000] flex max-w-[calc(100%-24px)] items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/10 bg-[#0c0e18]/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl"
        >
          {openWindows.map(siteWindow => (
            <div
              key={siteWindow.instanceId}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.035] pl-2 pr-1"
            >
              <button
                type="button"
                onClick={() => focusSocialWindow(siteWindow.instanceId)}
                className="flex h-7 items-center gap-1.5 text-[9px] font-semibold text-slate-300 transition hover:text-white"
                aria-label={`Bring ${siteWindow.platform.name} to front`}
              >
                <img src={siteWindow.platform.logo} alt="" className="h-4 w-4 rounded object-cover" />
                {siteWindow.platform.name}
              </button>
              <button
                type="button"
                onClick={() => closeSocialWindow(siteWindow.instanceId)}
                aria-label={`Close ${siteWindow.platform.name}`}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </nav>
      )}

      <AnimatePresence>
        {openWindows.map((siteWindow, index) => (
          <SocialServiceWindow
            key={siteWindow.instanceId}
            siteWindow={siteWindow}
            zIndex={50 + index}
            appRoot={appRootRef.current}
            onFocus={() => focusSocialWindow(siteWindow.instanceId)}
            onClose={() => closeSocialWindow(siteWindow.instanceId)}
            onBoundsChange={bounds => updateSocialWindow(siteWindow.instanceId, { bounds })}
            onUrlChange={currentUrl => updateSocialWindow(siteWindow.instanceId, { currentUrl, loadError: '' })}
            onLoadError={loadError => updateSocialWindow(siteWindow.instanceId, { loadError })}
            onLoading={isLoading => updateSocialWindow(siteWindow.instanceId, { isLoading })}
            onOpenExternal={url => void openExternal(url, siteWindow.instanceId)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
