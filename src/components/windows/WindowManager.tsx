import React from 'react';
import { useOS } from '../../context/OSContext';
import { WindowFrame } from './WindowFrame';

// Native Applications
import { FinderApp } from '../apps/FinderApp';
import { SettingsApp } from '../apps/SettingsApp';
import { BrowserApp } from '../apps/BrowserApp';
import { TerminalApp } from '../apps/TerminalApp';
import { CodeStudioApp } from '../apps/CodeStudioApp';
import { MusicApp } from '../apps/MusicApp';
import { PhotosApp } from '../apps/PhotosApp';
import { TVApp } from '../apps/TVApp';
import { MessagesApp } from '../apps/MessagesApp';
import { NotesApp } from '../apps/NotesApp';
import { MailApp } from '../apps/MailApp';
import { CalendarApp } from '../apps/CalendarApp';
import { RemindersApp } from '../apps/RemindersApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { ActivityMonitorApp } from '../apps/ActivityMonitorApp';
import { AppStoreApp } from '../apps/AppStoreApp';
import { ScreenshotApp } from '../apps/ScreenshotApp';
import { MobileLinkApp } from '../apps/MobileLinkApp';
import { CameraApp } from '../apps/CameraApp';

export const WindowManager: React.FC = () => {
  const { windows, activeSpaceId } = useOS();

  // Filter windows by current desktop space (or windows visible on all)
  const currentSpaceWindows = windows.filter(
    w => !w.desktopSpaceId || w.desktopSpaceId === activeSpaceId
  );

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
      case 'messages':
        return <MessagesApp />;
      case 'notes':
        return <NotesApp />;
      case 'mail':
        return <MailApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'reminders':
        return <RemindersApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'activitymonitor':
        return <ActivityMonitorApp />;
      case 'appstore':
        return <AppStoreApp />;
      case 'screenshot':
        return <ScreenshotApp />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400">
            <div>
              <p className="text-sm font-semibold text-white">Application Initialized</p>
              <p className="text-xs text-slate-500 mt-1">Ready for input on Abhishek OS.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {currentSpaceWindows.map(win => (
        <WindowFrame key={win.id} window={win}>
          {renderAppContent(win.appId)}
        </WindowFrame>
      ))}
    </>
  );
};
