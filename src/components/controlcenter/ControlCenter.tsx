import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wifi,
  WifiOff,
  Bluetooth,
  Radio,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Camera,
  Lock,
  Power,
  RefreshCw,
  Settings,
  Cast,
  Eye,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const ControlCenter: React.FC = () => {
  const {
    showControlCenter,
    setShowControlCenter,
    settings,
    updateSettings,
    currentTrack,
    isPlayingMusic,
    togglePlayMusic,
    nextTrack,
    prevTrack,
    lockSystem,
    sleepSystem,
    setShowPowerDialog,
    openApp,
  } = useOS();

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // if clicked outside menubar as well
        const target = e.target as HTMLElement;
        if (!target.closest('.glass-menubar')) {
          setShowControlCenter(false);
        }
      }
    };
    if (showControlCenter) {
      window.addEventListener('mousedown', handleOutside);
    }
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [showControlCenter, setShowControlCenter]);

  if (!showControlCenter) return null;

  const isLight = settings.theme === 'light';

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`fixed top-10 right-3 w-80 z-50 p-4 rounded-3xl shadow-2xl select-none backdrop-blur-3xl border ${
          isLight
            ? 'glass-panel-light text-slate-800 border-white/60'
            : 'glass-panel text-white border-white/15'
        }`}
      >
        {/* Top Connectivity Grid (Inspired by Reference Image #2 & #4) */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Connectivity Group Box */}
          <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 flex flex-col gap-2.5">
            {/* Wi-Fi Toggle */}
            <div
              onClick={() => {
                const next = !settings.wifiEnabled;
                updateSettings({ wifiEnabled: next });
                sound.playToggle(next);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  settings.wifiEnabled
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-white/15 text-slate-400'
                }`}
              >
                {settings.wifiEnabled ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate">Wi-Fi</div>
                <div className="text-[9px] text-slate-400 truncate">
                  {settings.wifiEnabled ? settings.wifiNetwork : 'Off'}
                </div>
              </div>
            </div>

            {/* Bluetooth Toggle */}
            <div
              onClick={() => {
                const next = !settings.bluetoothEnabled;
                updateSettings({ bluetoothEnabled: next });
                sound.playToggle(next);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  settings.bluetoothEnabled
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                    : 'bg-white/15 text-slate-400'
                }`}
              >
                <Bluetooth className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate">Bluetooth</div>
                <div className="text-[9px] text-slate-400 truncate">
                  {settings.bluetoothEnabled ? 'Connected' : 'Off'}
                </div>
              </div>
            </div>

            {/* AirDrop / Local Share Toggle */}
            <div
              onClick={() => {
                const next = !settings.airDropEnabled;
                updateSettings({ airDropEnabled: next });
                sound.playToggle(next);
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  settings.airDropEnabled
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : 'bg-white/15 text-slate-400'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold truncate">AirDrop</div>
                <div className="text-[9px] text-slate-400 truncate">
                  {settings.airDropEnabled ? 'Contacts Only' : 'Off'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Stack: Do Not Disturb & Display Modes */}
          <div className="flex flex-col gap-2.5">
            {/* Do Not Disturb Card */}
            <div
              onClick={() => {
                const next = !settings.doNotDisturb;
                updateSettings({ doNotDisturb: next });
                sound.playToggle(next);
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                settings.doNotDisturb
                  ? 'bg-purple-600/30 border-purple-500/40 text-purple-300'
                  : 'bg-white/10 dark:bg-slate-900/40 border-white/10'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  settings.doNotDisturb ? 'bg-purple-500 text-white' : 'bg-white/15 text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold leading-tight">Focus</div>
                <div className="text-[9px] text-slate-400">
                  {settings.doNotDisturb ? 'Do Not Disturb' : 'Off'}
                </div>
              </div>
            </div>

            {/* Night Shift & Dark Mode row */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div
                onClick={() => {
                  const next = !settings.nightShift;
                  updateSettings({ nightShift: next });
                  sound.playToggle(next);
                }}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  settings.nightShift
                    ? 'bg-amber-500/30 border-amber-500/50 text-amber-300'
                    : 'bg-white/10 border-white/10'
                }`}
              >
                <Eye className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-semibold">Night Shift</span>
              </div>

              <div
                onClick={() => {
                  const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
                  updateSettings({ theme: nextTheme });
                  sound.playToggle(nextTheme === 'dark');
                }}
                className="p-2 rounded-2xl bg-white/10 border border-white/10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/15 transition-colors"
              >
                {settings.theme === 'light' ? (
                  <Moon className="w-4 h-4 mb-1 text-indigo-400" />
                ) : (
                  <Sun className="w-4 h-4 mb-1 text-amber-400" />
                )}
                <span className="text-[10px] font-semibold">
                  {settings.theme === 'light' ? 'Dark' : 'Light'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Display Brightness Slider */}
        <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Display Brightness</span>
            </span>
            <span className="font-mono text-[10px]">{settings.brightness}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            value={settings.brightness}
            onChange={e => updateSettings({ brightness: Number(e.target.value) })}
            className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
          />
        </div>

        {/* Sound Volume Slider */}
        <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-slate-300">
            <span className="flex items-center gap-1.5">
              {settings.soundVolume > 0 ? (
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
              )}
              <span>Sound Volume</span>
            </span>
            <span className="font-mono text-[10px]">{Math.round(settings.soundVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.soundVolume}
            onChange={e => {
              const val = Number(e.target.value);
              updateSettings({ soundVolume: val });
            }}
            className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
          />
        </div>

        {/* Media Player Card (Direct from Reference #2 & #4) */}
        <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-3 flex items-center gap-3">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-11 h-11 rounded-xl object-cover shadow-md"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold truncate">{currentTrack.title}</div>
            <div className="text-[10px] text-slate-400 truncate">{currentTrack.artist}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevTrack}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={togglePlayMusic}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            >
              {isPlayingMusic ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <button
              onClick={nextTrack}
              className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick System Action Icons */}
        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/10">
          <button
            onClick={() => {
              openApp('screenshot');
              setShowControlCenter(false);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
            title="Take Screenshot"
          >
            <Camera className="w-4 h-4 text-purple-400 mb-0.5" />
            <span className="text-[9px]">Capture</span>
          </button>

          <button
            onClick={() => {
              lockSystem();
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
            title="Lock Screen"
          >
            <Lock className="w-4 h-4 text-amber-300 mb-0.5" />
            <span className="text-[9px]">Lock</span>
          </button>

          <button
            onClick={() => {
              openApp('settings');
              setShowControlCenter(false);
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
            title="System Settings"
          >
            <Settings className="w-4 h-4 text-sky-400 mb-0.5" />
            <span className="text-[9px]">Settings</span>
          </button>

          <button
            onClick={() => {
              setShowPowerDialog(true);
              setShowControlCenter(false);
            }}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 flex flex-col items-center justify-center transition-colors"
            title="Shut Down..."
          >
            <Power className="w-4 h-4 text-red-400 mb-0.5" />
            <span className="text-[9px]">Power</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
