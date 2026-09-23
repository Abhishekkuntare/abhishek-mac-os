import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Battery,
  BatteryCharging,
  Search,
  Sliders,
  Bell,
  Sun,
  Moon,
  Lock,
  Power,
  RefreshCw,
  Info,
  Settings,
  Folder,
  Terminal,
  Code2,
  Tv,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const MenuBar: React.FC = () => {
  const {
    user,
    settings,
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
  } = useOS();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const menuBarRef = useRef<HTMLDivElement | null>(null);

  // Live time ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleMenu = (menuName: string) => {
    sound.playClick();
    setActiveMenu(prev => (prev === menuName ? null : menuName));
  };

  const isLight = settings.theme === 'light';

  // Format time (e.g., "Sat Sep 19  9:41 AM" or "Tue 18:01" as in Reference 1 & 2)
  const formatTime = (date: Date) => {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !settings.clock24h,
    });
    return `${day} ${time}`;
  };

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <div
      ref={menuBarRef}
      className={`fixed top-0 left-0 right-0 h-8 px-3 flex items-center justify-between z-50 electron-drag-region text-xs font-medium select-none transition-colors duration-200 ${
        isLight ? 'glass-menubar-light text-slate-800' : 'glass-menubar text-white'
      }`}
    >
      {/* Left Menus */}
      <div className="flex items-center gap-1">
        {/* Abhishek OS Logo Menu */}
        <div className="relative">
          <button
            className="electron-no-drag"
            onClick={() => toggleMenu('os')}
            className={`flex items-center justify-center px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'os' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {/* Signature Abhishek OS Geometric "A" glyph */}
            <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
            </svg>
          </button>

          <AnimatePresence>
            {activeMenu === 'os' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-56 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    setShowAboutModal(true);
                    setActiveMenu(null);
                    sound.playClick();
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-sky-400" />
                  <span>About Abhishek OS</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('settings');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>System Settings...</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('appstore');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                >
                  <span className="w-3.5 h-3.5 rounded bg-sky-500 flex items-center justify-center text-[9px] font-bold">A</span>
                  <span>App Store...</span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  className="electron-no-drag"
                  onClick={() => {
                    sleepSystem();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sleep</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    restartSystem();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-white/15 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Restart...</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    setShowPowerDialog(true);
                    setActiveMenu(null);
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center gap-2 text-left hover:bg-red-500/20 text-red-300 transition-colors"
                >
                  <Power className="w-3.5 h-3.5 text-red-400" />
                  <span>Shut Down...</span>
                </button>

                <div className="h-px bg-white/10 my-1 mx-2" />

                <button
                  className="electron-no-drag"
                  onClick={() => {
                    lockSystem();
                    setActiveMenu(null);
                  }}
                  className="w-full px-3.5 py-1.5 flex items-center justify-between text-left hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Lock Screen</span>
                  </div>
                  <kbd className="text-[10px] text-slate-400 font-mono">⌃⌘Q</kbd>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Primary App Menus */}
        <span className="font-bold px-2 py-0.5 rounded-md hover:bg-white/10 cursor-pointer">
          Finder
        </span>

        <div className="relative">
          <button
            onClick={() => toggleMenu('file')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'file' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            File
          </button>
          <AnimatePresence>
            {activeMenu === 'file' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-48 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('finder');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                >
                  <span>New Finder Window</span>
                  <span className="text-[10px] text-slate-400 font-mono">⌘N</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('notes');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                >
                  <span>New Note</span>
                  <span className="text-[10px] text-slate-400 font-mono">⌥⌘N</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => sound.playClick()}
          className="px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          Edit
        </button>

        <div className="relative">
          <button
            onClick={() => toggleMenu('view')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'view' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            View
          </button>
          <AnimatePresence>
            {activeMenu === 'view' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-48 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    setShowMissionControl(true);
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                >
                  <span>Mission Control</span>
                  <span className="text-[10px] text-slate-400 font-mono">⌃↑</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    updateSettings({ theme: isLight ? 'dark' : 'light' });
                    setActiveMenu(null);
                    sound.playToggle(!isLight);
                  }}
                  className="w-full px-3 py-1 flex items-center justify-between hover:bg-white/15"
                >
                  <span>Toggle Theme ({isLight ? 'Dark' : 'Light'})</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => toggleMenu('go')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              activeMenu === 'go' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            Go
          </button>
          <AnimatePresence>
            {activeMenu === 'go' && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 top-8 w-48 rounded-xl glass-panel text-white py-1 shadow-2xl border border-white/15 backdrop-blur-2xl z-50"
              >
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('finder');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1 flex items-center gap-2 hover:bg-white/15"
                >
                  <Folder className="w-3.5 h-3.5 text-sky-400" />
                  <span>Documents</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('codestudio');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1 flex items-center gap-2 hover:bg-white/15"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Code Studio</span>
                </button>
                <button
                  className="electron-no-drag"
                  onClick={() => {
                    openApp('terminal');
                    setActiveMenu(null);
                  }}
                  className="w-full px-3 py-1 flex items-center gap-2 hover:bg-white/15"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terminal</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => sound.playClick()}
          className="px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          Window
        </button>

        <button
          onClick={() => {
            setShowAboutModal(true);
            sound.playClick();
          }}
          className="px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          Help
        </button>
      </div>

      {/* Right Status Controls */}
      <div className="flex items-center gap-2">
        {/* Sound Volume status */}
        <button
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            sound.playClick();
          }}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
          title={`Volume: ${Math.round(settings.soundVolume * 100)}%`}
        >
          {settings.soundVolume > 0 ? (
            <Volume2 className="w-3.5 h-3.5" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
          )}
        </button>

        {/* Wi-Fi status */}
        <button
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            sound.playClick();
          }}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
          title={settings.wifiEnabled ? `Wi-Fi: ${settings.wifiNetwork}` : 'Wi-Fi: Disconnected'}
        >
          {settings.wifiEnabled ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Battery */}
        <div
          className="flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-white/10 cursor-pointer"
          title={`Battery: ${settings.batteryLevel}% ${settings.batteryCharging ? '(Charging)' : ''}`}
          onClick={() => openApp('settings')}
        >
          <span className="text-[11px] font-mono">{settings.batteryLevel}%</span>
          {settings.batteryCharging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Battery className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Live Date & Time */}
        <button
          onClick={() => {
            setShowNotificationCenter(!showNotificationCenter);
            sound.playClick();
          }}
          className="px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
        >
          {formatTime(currentTime)}
        </button>

        {/* Spotlight Trigger */}
        <button
          onClick={() => {
            setShowSpotlight(true);
            sound.playClick();
          }}
          className="p-1 rounded-md hover:bg-white/10 transition-colors"
          title="Spotlight Search (Ctrl + Space)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Control Center Toggle */}
        <button
          onClick={() => {
            setShowControlCenter(!showControlCenter);
            sound.playClick();
          }}
          className={`p-1 rounded-md transition-colors ${
            showControlCenter ? 'bg-sky-500/30 text-sky-400' : 'hover:bg-white/10'
          }`}
          title="Control Center"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Notification Center Trigger */}
        <button
          onClick={() => {
            setShowNotificationCenter(!showNotificationCenter);
            sound.playClick();
          }}
          className={`relative p-1 rounded-md transition-colors ${
            showNotificationCenter ? 'bg-sky-500/30 text-sky-400' : 'hover:bg-white/10'
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
          onClick={() => {
            openApp('settings');
            sound.playClick();
          }}
          className="w-5 h-5 rounded-full overflow-hidden border border-white/30 flex items-center justify-center bg-gradient-to-tr from-sky-500 to-indigo-600 text-[10px] font-bold text-white hover:scale-105 transition-transform"
          title={`Signed in as ${user.fullName}`}
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{user.fullName.charAt(0)}</span>
          )}
        </button>
      </div>
    </div>
  );
};
