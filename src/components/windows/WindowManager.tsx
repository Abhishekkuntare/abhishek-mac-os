import React, { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useOS } from '../../context/OSContext';
import { WindowFrame } from './WindowFrame';

const FinderApp = lazy(() => import('../apps/FinderApp').then(module => ({ default: module.FinderApp })));
const SettingsApp = lazy(() => import('../apps/SettingsApp').then(module => ({ default: module.SettingsApp })));
const BrowserApp = lazy(() => import('../apps/BrowserApp').then(module => ({ default: module.BrowserApp })));
const TerminalApp = lazy(() => import('../apps/TerminalApp').then(module => ({ default: module.TerminalApp })));
const CodeStudioApp = lazy(() => import('../apps/CodeStudioApp').then(module => ({ default: module.CodeStudioApp })));
const MusicApp = lazy(() => import('../apps/MusicApp').then(module => ({ default: module.MusicApp })));
const PhotosApp = lazy(() => import('../apps/PhotosApp').then(module => ({ default: module.PhotosApp })));
const TVApp = lazy(() => import('../apps/TVApp').then(module => ({ default: module.TVApp })));
const GhostAIApp = lazy(() => import('../apps/GhostAIApp').then(module => ({ default: module.GhostAIApp })));
const NotesApp = lazy(() => import('../apps/NotesApp').then(module => ({ default: module.NotesApp })));
const NextpadApp = lazy(() => import('../apps/NextpadApp').then(module => ({ default: module.NextpadApp })));
const CalendarApp = lazy(() => import('../apps/CalendarApp').then(module => ({ default: module.CalendarApp })));
const RemindersApp = lazy(() => import('../apps/RemindersApp').then(module => ({ default: module.RemindersApp })));
const CalculatorApp = lazy(() => import('../apps/CalculatorApp').then(module => ({ default: module.CalculatorApp })));
const ClockApp = lazy(() => import('../apps/ClockApp').then(module => ({ default: module.ClockApp })));
const WeatherApp = lazy(() => import('../apps/WeatherApp').then(module => ({ default: module.WeatherApp })));
const ActivityMonitorApp = lazy(() => import('../apps/ActivityMonitorApp').then(module => ({ default: module.ActivityMonitorApp })));
const AppStoreApp = lazy(() => import('../apps/AppStoreApp').then(module => ({ default: module.AppStoreApp })));
const ScreenshotApp = lazy(() => import('../apps/ScreenshotApp').then(module => ({ default: module.ScreenshotApp })));
const MobileLinkApp = lazy(() => import('../apps/MobileLinkApp').then(module => ({ default: module.MobileLinkApp })));
const CameraApp = lazy(() => import('../apps/CameraApp').then(module => ({ default: module.CameraApp })));
const GameCenterApp = lazy(() => import('../apps/GameCenterApp').then(module => ({ default: module.GameCenterApp })));
const DoomScrollApp = lazy(() => import('../apps/DoomScrollApp').then(module => ({ default: module.DoomScrollApp })));
const UniversalShareApp = lazy(() => import('../apps/UniversalShareApp').then(module => ({ default: module.UniversalShareApp })));

const AppLoading: React.FC = () => (
  <div className="flex h-full min-h-40 flex-1 items-center justify-center bg-slate-950/40 text-sm text-slate-400">
    <span className="animate-pulse">Opening app…</span>
  </div>
);

export const WindowManager: React.FC = () => {
  const { windows, minimizeWindow } = useOS();

  useEffect(() => {
    const handleMinimizeShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'm' ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey
      ) {
        return;
      }

      const focusedWindow = windows
        .filter(window => !window.isMinimized)
        .sort((a, b) => Number(b.isFocused) - Number(a.isFocused) || b.zIndex - a.zIndex)[0];
      if (!focusedWindow) return;

      event.preventDefault();
      minimizeWindow(focusedWindow.id);
    };

    window.addEventListener('keydown', handleMinimizeShortcut);
    return () => window.removeEventListener('keydown', handleMinimizeShortcut);
  }, [minimizeWindow, windows]);

  const renderAppContent = (appId: string) => {
    switch (appId) {
      case 'mobile':
        return <MobileLinkApp />;
      case 'camera':
        return <CameraApp />;
      case 'finder':
        return <FinderApp />;
      case 'settings':
        return <SettingsApp />;
      case 'browser':
        return <BrowserApp />;
      case 'terminal':
        return <TerminalApp />;
      case 'codestudio':
        return <CodeStudioApp />;
      case 'music':
        return <MusicApp />;
      case 'photos':
        return <PhotosApp />;
      case 'tv':
        return <TVApp />;
      case 'ghostai':
        return <GhostAIApp />;
      case 'notes':
        return <NotesApp />;
      case 'nextpad':
        return <NextpadApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'reminders':
        return <RemindersApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'clock':
        return <ClockApp />;
      case 'weather':
        return <WeatherApp />;
      case 'activitymonitor':
        return <ActivityMonitorApp />;
      case 'appstore':
        return <AppStoreApp />;
      case 'gamecenter':
        return <GameCenterApp />;
      case 'doomscroll':
        return <DoomScrollApp />;
      case 'universalshare':
        return <UniversalShareApp />;
      case 'screenshot':
        return <ScreenshotApp />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            <div>
              <p className="text-sm font-semibold text-white">Application Initialized</p>
              <p className="text-xs text-slate-500 mt-1">Ready for input on ARLO OS.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence initial={false}>
      {windows.map(win => (
        <WindowFrame key={win.id} window={win}>
          <Suspense fallback={<AppLoading />}>
            {renderAppContent(win.appId)}
          </Suspense>
        </WindowFrame>
      ))}
    </AnimatePresence>
  );
};
