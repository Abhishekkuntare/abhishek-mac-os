import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Search,
  Sliders,
  Bell,
  Moon,
  Lock,
  Power,
  RefreshCw,
  Info,
  Settings,
  Folder,
  Terminal,
  Code2,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  ListChecks,
  LayoutGrid,
  Maximize2,
  Minimize2,
  HardDrive,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';
import { MascotMark } from '../system/MascotMark';
import { BatteryStatusIcon } from '../system/BatteryStatusIcon';

export const MenuBar: React.FC = () => {
  const {
    user,
    settings,
    resolvedTheme,
    updateSettings,
    openApp,
    lockSystem,
    sleepSystem,
    restartSystem,
    setShowPowerDialog,
    setShowAboutModal,
    setShowSpotlight,
    showControlCenter,
    setShowControlCenter,
    showNotificationCenter,
    setShowNotificationCenter,
    setShowMissionControl,
    notifications,
    isFullscreen,
    toggleFullscreen,
  } = useOS();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [localAccessResponse, setLocalAccessResponse] = useState(
    () => localStorage.getItem('abhishek_os_local_access_response_v2'),
  );

  const menuBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncLocalAccessResponse = () => {
      setLocalAccessResponse(localStorage.getItem('abhishek_os_local_access_response_v2'));
    };

    window.addEventListener('local-access-changed', syncLocalAccessResponse);
    return () => window.removeEventListener('local-access-changed', syncLocalAccessResponse);
  }, []);

  // Live time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        menuBarRef.current &&
        !menuBarRef.current.contains(e.target as Node)
      ) {
        setActiveMenu(null);
      }
    };

    window.addEventListener('mousedown', handleOutside);

    return () => {
      window.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  const toggleMenu = (menuName: string) => {
    sound.playClick();

    setActiveMenu((prev) =>
      prev === menuName ? null : menuName
    );
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  const isLight = resolvedTheme === 'light';

  const requestLocalAccess = () => {
    sound.playClick();
    window.dispatchEvent(new Event('request-local-access-prompt'));
  };

  // Format time
  const formatTime = (date: Date) => {
    const day = date.toLocaleDateString('en-US', {
      weekday: 'short',
    });

    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !settings.clock24h,
    });

    return `${day} ${time}`;
  };

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const verticalMenuBar = settings.menuBarPosition === 'left' || settings.menuBarPosition === 'right';
  const menuBarPositionClass = settings.menuBarPosition === 'bottom'
    ? 'bottom-0 left-0 right-0 h-8'
    : settings.menuBarPosition === 'left'
      ? 'left-0 top-0 bottom-0 w-12 flex-col justify-start gap-3 px-1 py-2'
      : settings.menuBarPosition === 'right'
        ? 'right-0 top-0 bottom-0 w-12 flex-col justify-start gap-3 px-1 py-2'
        : 'top-0 left-0 right-0 h-8';

  // ---------------------------------------------------------
  // EDIT ACTIONS
  // ---------------------------------------------------------

  const handleEditAction = (
    action: 'undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'selectAll'
  ) => {
    sound.playClick();

    try {
      switch (action) {
        case 'undo':
          document.execCommand('undo');
          break;

        case 'redo':
          document.execCommand('redo');
          break;

        case 'cut':
          document.execCommand('cut');
          break;

        case 'copy':
          document.execCommand('copy');
          break;

        case 'paste':
          document.execCommand('paste');
          break;

        case 'selectAll':
          document.execCommand('selectAll');
          break;
      }
    } catch {
      // Editing commands should never break the desktop.
    }

    setActiveMenu(null);
  };

  // ---------------------------------------------------------
  // WINDOW ACTIONS
  // ---------------------------------------------------------

  const handleWindowAction = (
    action:
      | 'missionControl'
      | 'finder'
      | 'codeStudio'
      | 'terminal'
      | 'settings'
  ) => {
    sound.playClick();

    switch (action) {
      case 'missionControl':
        setShowMissionControl(true);
        break;

      case 'finder':
        openApp('finder');
        break;

      case 'codeStudio':
        openApp('codestudio');
        break;

      case 'terminal':
        openApp('terminal');
        break;

      case 'settings':
        openApp('settings');
        break;
    }

    setActiveMenu(null);
  };

  return (
    <div
      ref={menuBarRef}
      data-menu-bar-orientation={verticalMenuBar ? 'vertical' : 'horizontal'}
      className={`fixed ${menuBarPositionClass} px-3 flex items-center justify-between z-[10000] electron-drag-region text-xs font-medium select-none transition-colors duration-200 ${
        isLight
          ? 'glass-menubar-light text-slate-800'
          : 'glass-menubar text-white'
      }`}
    >
      {verticalMenuBar ? (
        <div className="electron-no-drag flex h-full w-full flex-col items-center gap-2">
          <button
            type="button"
            aria-label="Abhishek OS menu"
            title="Abhishek OS"
            onClick={() => setShowAboutModal(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl hover:bg-white/10"
          >
            <MascotMark className="h-7 w-7" />
          </button>
          <button type="button" aria-label="Search" title="Search" onClick={() => setShowSpotlight(true)} className="rounded-lg p-2 hover:bg-white/10"><Search className="h-4 w-4" /></button>
          <button type="button" aria-label="Control Center" title="Control Center" onClick={() => setShowControlCenter(!showControlCenter)} className="rounded-lg p-2 hover:bg-white/10"><Sliders className="h-4 w-4" /></button>
          <button type="button" aria-label="Notifications" title="Notifications" onClick={() => setShowNotificationCenter(!showNotificationCenter)} className="rounded-lg p-2 hover:bg-white/10"><Bell className="h-4 w-4" /></button>
          <button type="button" aria-label="Settings" title="Settings" onClick={() => openApp('settings')} className="rounded-lg p-2 hover:bg-white/10"><Settings className="h-4 w-4" /></button>
          <AnimatePresence>
            {localAccessResponse === 'deferred' && (
              <motion.button
                type="button"
                aria-label="Allow Finder access"
                title="Allow access to all drives"
                onClick={requestLocalAccess}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className="rounded-lg border border-sky-400/20 bg-sky-400/10 p-2 text-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.12)] hover:bg-sky-400/20"
              >
                <HardDrive className="h-4 w-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <button type="button" aria-label="Fullscreen" title="Fullscreen" onClick={toggleFullscreen} className="rounded-lg p-2 hover:bg-white/10"><Maximize2 className="h-4 w-4" /></button>
          <div className="mt-auto flex flex-col items-center gap-1 pb-1 text-[9px] text-slate-400">
            <span>{formatTime(currentTime).split(' ').at(-1)}</span>
            <span>{settings.brightness}%</span>
          </div>
        </div>
      ) : (
        <>
      {/* =====================================================
          LEFT MENUS
      ====================================================== */}

      <div className="flex items-center gap-1">
        {/* =====================================================
            ABHISHEK OS LOGO MENU
        ====================================================== */}

        <div className="relative">
          <button
            type="button"
            aria-label="Abhishek OS menu"
            title="Abhishek OS"
            className={`electron-no-drag flex items-center justify-center px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'os'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
            onClick={() => toggleMenu('os')}
          >
            <MascotMark className="h-7 w-7" />
          </button>

          <AnimatePresence>
            {activeMenu === 'os' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-56 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                  onClick={() => {
                    setShowAboutModal(true);
                    setActiveMenu(null);
                    sound.playClick();
                  }}
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>About Abhishek OS</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                  onClick={() => {
                    openApp('settings');
                    setActiveMenu(null);
                  }}
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>System Settings...</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                  onClick={() => {
                    openApp('appstore');
                    setActiveMenu(null);
                  }}
                >
                  <span className="w-3.5 h-3.5 rounded bg-sky-500 flex items-center justify-center text-[9px] font-bold">
                    A
                  </span>
                  <span>App Store...</span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                  onClick={() => {
                    sleepSystem();
                    setActiveMenu(null);
                  }}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sleep</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                  onClick={() => {
                    restartSystem();
                    setActiveMenu(null);
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restart...</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-red-500/20 text-red-300 transition-colors"
                  onClick={() => {
                    setShowPowerDialog(true);
                    setActiveMenu(null);
                  }}
                >
                  <Power className="w-3.5 h-3.5 text-red-400" />
                  <span>Shut Down...</span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  type="button"
                  className="electron-no-drag w-full px-3.5 py-1.5 flex items-center justify-between text-left hover:bg-white/15 transition-colors"
                  onClick={() => {
                    lockSystem();
                    setActiveMenu(null);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Lock Screen</span>
                  </div>

                  <kbd className="text-[10px] text-slate-400 font-mono">
                    ⌃⌘Q
                  </kbd>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            FINDER
        ====================================================== */}

        <button
          type="button"
          onClick={() => {
            openApp('finder');
            sound.playClick();
          }}
          className="electron-no-drag font-bold px-2 py-0.5 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
        >
          Finder
        </button>

        {/* =====================================================
            FILE
        ====================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('file')}
            className={`electron-no-drag px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'file'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            File
          </button>

          <AnimatePresence>
            {activeMenu === 'file' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-48 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                  onClick={() => {
                    openApp('finder');
                    setActiveMenu(null);
                  }}
                >
                  <span>New Finder Window</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌘N
                  </span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                  onClick={() => {
                    openApp('notes');
                    setActiveMenu(null);
                  }}
                >
                  <span>New Note</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌥⌘N
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            EDIT
        ====================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('edit')}
            className={`electron-no-drag px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'edit'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            Edit
          </button>

          <AnimatePresence>
            {activeMenu === 'edit' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-52 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() => handleEditAction('undo')}
                >
                  <div className="flex items-center gap-2">
                    <Undo2 className="w-3.5 h-3.5 text-slate-300" />
                    <span>Undo</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌘Z
                  </span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() => handleEditAction('redo')}
                >
                  <div className="flex items-center gap-2">
                    <Redo2 className="w-3.5 h-3.5 text-slate-300" />
                    <span>Redo</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⇧⌘Z
                  </span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() => handleEditAction('cut')}
                >
                  <div className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-slate-300" />
                    <span>Cut</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌘X
                  </span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() => handleEditAction('copy')}
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌘C
                  </span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() => handleEditAction('paste')}
                >
                  <div className="flex items-center gap-2">
                    <Clipboard className="w-3.5 h-3.5 text-slate-300" />
                    <span>Paste</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌘V
                  </span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() => handleEditAction('selectAll')}
                >
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5 text-slate-300" />
                    <span>Select All</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌘A
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            VIEW
        ====================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('view')}
            className={`electron-no-drag px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'view'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            View
          </button>

          <AnimatePresence>
            {activeMenu === 'view' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-48 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                  onClick={() => {
                    setShowMissionControl(true);
                    setActiveMenu(null);
                  }}
                >
                  <span>Mission Control</span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ⌃↑
                  </span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                  onClick={() => {
                    updateSettings({
                      theme: isLight ? 'dark' : 'light',
                    });

                    setActiveMenu(null);

                    sound.playToggle(!isLight);
                  }}
                >
                  <span>
                    Toggle Theme ({isLight ? 'Dark' : 'Light'})
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            GO
        ====================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('go')}
            className={`electron-no-drag px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'go'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            Go
          </button>

          <AnimatePresence>
            {activeMenu === 'go' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-48 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center gap-2 hover:bg-white/15"
                  onClick={() => {
                    openApp('finder');
                    setActiveMenu(null);
                  }}
                >
                  <Folder className="w-3.5 h-3.5 text-sky-400" />
                  <span>Documents</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center gap-2 hover:bg-white/15"
                  onClick={() => {
                    openApp('codestudio');
                    setActiveMenu(null);
                  }}
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code Studio</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1 flex items-center gap-2 hover:bg-white/15"
                  onClick={() => {
                    openApp('terminal');
                    setActiveMenu(null);
                  }}
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            WINDOW
        ====================================================== */}

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu('window')}
            className={`electron-no-drag px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'window'
                ? 'bg-white/20'
                : 'hover:bg-white/10'
            }`}
          >
            Window
          </button>

          <AnimatePresence>
            {activeMenu === 'window' && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-52 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors"
                  onClick={() =>
                    handleWindowAction('missionControl')
                  }
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
                    <span>Mission Control</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Win+Tab
                  </span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/15 transition-colors"
                  onClick={() =>
                    handleWindowAction('finder')
                  }
                >
                  <Folder className="w-3.5 h-3.5 text-sky-400" />
                  <span>Finder</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/15 transition-colors"
                  onClick={() =>
                    handleWindowAction('codeStudio')
                  }
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code Studio</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/15 transition-colors"
                  onClick={() =>
                    handleWindowAction('terminal')
                  }
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal</span>
                </button>

                <button
                  type="button"
                  className="electron-no-drag w-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/15 transition-colors"
                  onClick={() =>
                    handleWindowAction('settings')
                  }
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>System Settings</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            HELP
        ====================================================== */}

        <button
          type="button"
          onClick={() => {
            setShowAboutModal(true);
            sound.playClick();
          }}
          className="electron-no-drag px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          Help
        </button>

        <span className="mx-1 h-4 w-px bg-white/15" aria-hidden="true" />

        <button
          type="button"
          onClick={() => {
            toggleFullscreen();
            sound.playClick();
          }}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="electron-no-drag inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold text-white/85 transition-colors hover:bg-white/10"
        >
          {isFullscreen ? (
            <Minimize2 className="h-3.5 w-3.5 text-sky-300" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5 text-sky-300" />
          )}
          <span className="hidden sm:inline">
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </span>
        </button>

        <AnimatePresence>
          {localAccessResponse === 'deferred' && (
            <motion.button
              type="button"
              onClick={requestLocalAccess}
              title="Allow access to all drives"
              aria-label="Allow Finder access"
              initial={{ opacity: 0, x: 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.96 }}
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`electron-no-drag inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                isLight
                  ? 'border-sky-600/15 bg-sky-600/10 text-sky-800 hover:bg-sky-600/15'
                  : 'border-sky-300/20 bg-sky-400/10 text-sky-200 shadow-[0_0_16px_rgba(56,189,248,0.12)] hover:bg-sky-400/20'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5 shrink-0" />
              <span>Allow Finder Access</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================
          RIGHT STATUS CONTROLS
      ====================================================== */}

      <div className="flex items-center gap-2">

        {/* Sound Volume */}
        <button
          type="button"
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            sound.playClick();
          }}
          className="electron-no-drag p-1 rounded-md hover:bg-white/10 transition-colors"
          title={`Volume: ${Math.round(
            settings.soundVolume * 100
          )}%`}
        >
          {settings.soundVolume > 0 ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          )}
        </button>

        {/* Wi-Fi */}
        <button
          type="button"
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            sound.playClick();
          }}
          className="electron-no-drag p-1 rounded-md hover:bg-white/10 transition-colors"
          title={
            settings.wifiEnabled
              ? `Wi-Fi: ${settings.wifiNetwork}`
              : 'Wi-Fi: Disconnected'
          }
        >
          <span className="relative inline-flex h-5 w-5 items-center justify-center">
            {settings.wifiEnabled ? (
              <motion.span
                animate={settings.wifiConnected ? { opacity: [0.72, 1, 0.72], scale: [0.96, 1.04, 0.96] } : { opacity: 1, scale: 1 }}
                transition={settings.wifiConnected ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                className={settings.wifiConnected ? 'text-sky-200' : 'text-slate-400'}
              >
                <Wifi className="h-3.5 w-3.5" />
              </motion.span>
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-slate-500" />
            )}
            {settings.wifiConnected && (
              <motion.span
                animate={{ opacity: [0.55, 1, 0.55], scale: [0.8, 1.15, 0.8] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_rgba(52,211,153,.8)]"
              />
            )}
          </span>
        </button>

        {/* Battery */}
        <button
          type="button"
          className="electron-no-drag flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-white/10 transition-colors"
          title={
            settings.batteryAvailable
              ? `Battery: ${settings.batteryLevel}%${settings.batteryCharging ? ' (Charging)' : settings.batteryPlugged ? ' (Plugged in)' : ''}`
              : 'Battery status unavailable on this device'
          }
          onClick={() => openApp('settings')}
        >
          {settings.batteryAvailable && (
            <span className="text-[11px] font-mono">{settings.batteryLevel}%</span>
          )}
          <BatteryStatusIcon
            level={settings.batteryLevel}
            charging={settings.batteryCharging}
            plugged={settings.batteryPlugged}
            style={settings.batteryIconStyle}
            className="h-[17px] w-[22px]"
          />
        </button>

        {/* Live Date & Time */}
        <button
          type="button"
          onClick={() => {
            setShowNotificationCenter(
              !showNotificationCenter
            );
            sound.playClick();
          }}
          className="electron-no-drag px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          {formatTime(currentTime)}
        </button>

        {/* Spotlight */}
        <button
          type="button"
          onClick={() => {
            setShowSpotlight(true);
            sound.playClick();
          }}
          className="electron-no-drag p-1 rounded-md hover:bg-white/10 transition-colors"
          title="Spotlight Search (Ctrl + Space)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Control Center */}
        <button
          type="button"
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            sound.playClick();
          }}
          className={`electron-no-drag p-1 rounded-md transition-colors ${
            showControlCenter
              ? 'bg-sky-500/30 text-sky-400'
              : 'hover:bg-white/10'
          }`}
          title="Control Center"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Notification Center */}
        <button
          type="button"
          onClick={() => {
            setShowNotificationCenter(
              !showNotificationCenter
            );
            sound.playClick();
          }}
          className={`electron-no-drag relative p-1 rounded-md transition-colors ${
            showNotificationCenter
              ? 'bg-sky-500/30 text-sky-400'
              : 'hover:bg-white/10'
          }`}
          title="Notification Center"
        >
          <Bell className="w-3.5 h-3.5" />

          {unreadNotifs > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
          )}
        </button>

        {/* User Profile Avatar */}
        <button
          type="button"
          onClick={() => {
            openApp('settings');
            sound.playClick();
          }}
          className="electron-no-drag w-5 h-5 rounded-full overflow-hidden border border-white/30 flex items-center justify-center bg-gradient-to-tr from-sky-500 to-indigo-600 text-[10px] font-bold text-white hover:scale-105 transition-transform"
          title={`Signed in as ${user.fullName}`}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{user.fullName.charAt(0)}</span>
          )}
        </button>
      </div>
        </>
      )}
    </div>
  );
};

export default MenuBar;