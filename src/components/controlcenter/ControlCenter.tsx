import React, { useRef, useEffect, useCallback } from 'react';

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
  Settings,
  Eye,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

/**
 * Native system bridge.
 *
 * The actual implementation will be added to Electron's
 * preload/main process in the next files.
 */
interface NativeSystemState {
  wifi: {
    enabled: boolean;
    connected: boolean;
    ssid: string | null;
  };

  bluetooth: {
    enabled: boolean;
    connected: boolean;
    deviceName: string | null;
  };

  brightness: number | null;

  volume: {
    level: number;
    muted: boolean;
  };

  focus: {
    enabled: boolean;
    supported: boolean;
  };

  /**
   * Windows does not provide Apple's AirDrop.
   * This remains explicit rather than showing fake data.
   */
  airDrop: {
    supported: boolean;
    enabled: boolean;
    label: string;
  };
}

interface NativeSystemAPI {
  getSystemState?: () => Promise<NativeSystemState>;

  setWifiEnabled?: (enabled: boolean) => Promise<NativeSystemState | void>;

  setBluetoothEnabled?: (
    enabled: boolean
  ) => Promise<NativeSystemState | void>;

  setBrightness?: (brightness: number) => Promise<NativeSystemState | void>;

  setVolume?: (volume: number) => Promise<NativeSystemState | void>;

  setMuted?: (muted: boolean) => Promise<NativeSystemState | void>;

  setFocus?: (enabled: boolean) => Promise<NativeSystemState | void>;

  setAirDropEnabled?: (
    enabled: boolean
  ) => Promise<NativeSystemState | void>;
}

declare global {
  interface Window {
    electronAPI?: NativeSystemAPI;
  }
}

const getNativeAPI = (): NativeSystemAPI | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.electronAPI ?? null;
};

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
    setShowPowerDialog,
    openApp,
  } = useOS();

  const panelRef = useRef<HTMLDivElement | null>(null);

  const nativeSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  /**
   * Keep the Control Center synchronized with the real host machine.
   */
  const syncNativeSystemState = useCallback(async () => {
    const api = getNativeAPI();

    if (!api?.getSystemState) {
      return;
    }

    try {
      const state = await api.getSystemState();

      if (!state) {
        return;
      }

      /**
       * Wi-Fi
       */
      updateSettings({
        wifiEnabled: state.wifi.connected || state.wifi.enabled,
        wifiNetwork:
          state.wifi.connected && state.wifi.ssid
            ? state.wifi.ssid
            : state.wifi.enabled
              ? 'Not connected'
              : 'Off',
      });

      /**
       * Bluetooth
       */
      updateSettings({
        bluetoothEnabled: state.bluetooth.enabled,
      });

      /**
       * Brightness
       */
      if (
        typeof state.brightness === 'number' &&
        Number.isFinite(state.brightness)
      ) {
        updateSettings({
          brightness: Math.max(0, Math.min(100, state.brightness)),
        });
      }

      /**
       * Master volume.
       */
      if (
        state.volume &&
        typeof state.volume.level === 'number' &&
        Number.isFinite(state.volume.level)
      ) {
        updateSettings({
          soundVolume: Math.max(0, Math.min(1, state.volume.level)),
        });
      }

      /**
       * Focus / Do Not Disturb.
       */
      if (state.focus?.supported) {
        updateSettings({
          doNotDisturb: Boolean(state.focus.enabled),
        });
      }
    } catch (error) {
      console.warn(
        '[ControlCenter] Unable to synchronize native system state:',
        error
      );
    }
  }, [updateSettings]);

  /**
   * Synchronize native system information whenever
   * the Control Center becomes visible.
   */
  useEffect(() => {
    if (!showControlCenter) {
      if (nativeSyncTimerRef.current) {
        clearInterval(nativeSyncTimerRef.current);
        nativeSyncTimerRef.current = null;
      }

      return;
    }

    void syncNativeSystemState();

    nativeSyncTimerRef.current = setInterval(() => {
      void syncNativeSystemState();
    }, 2000);

    return () => {
      if (nativeSyncTimerRef.current) {
        clearInterval(nativeSyncTimerRef.current);
        nativeSyncTimerRef.current = null;
      }
    };
  }, [showControlCenter, syncNativeSystemState]);

  /**
   * Close when clicking outside.
   */
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        const target = e.target as HTMLElement;

        if (!target.closest('.glass-menubar')) {
          setShowControlCenter(false);
        }
      }
    };

    if (showControlCenter) {
      window.addEventListener('mousedown', handleOutside);
    }

    return () => {
      window.removeEventListener('mousedown', handleOutside);
    };
  }, [showControlCenter, setShowControlCenter]);

  if (!showControlCenter) {
    return null;
  }

  const isLight = settings.theme === 'light';

  const nativeAPI = getNativeAPI();

  /**
   * Wi-Fi
   */
  const handleWifiToggle = async () => {
    const next = !settings.wifiEnabled;

    sound.playToggle(next);

    updateSettings({
      wifiEnabled: next,
    });

    if (nativeAPI?.setWifiEnabled) {
      try {
        const state = await nativeAPI.setWifiEnabled(next);

        if (state) {
          await syncNativeSystemState();
        }
      } catch (error) {
        console.warn(
          '[ControlCenter] Unable to change Wi-Fi state:',
          error
        );

        await syncNativeSystemState();
      }
    }
  };

  /**
   * Bluetooth
   */
  const handleBluetoothToggle = async () => {
    const next = !settings.bluetoothEnabled;

    sound.playToggle(next);

    updateSettings({
      bluetoothEnabled: next,
    });

    if (nativeAPI?.setBluetoothEnabled) {
      try {
        const state = await nativeAPI.setBluetoothEnabled(next);

        if (state) {
          await syncNativeSystemState();
        }
      } catch (error) {
        console.warn(
          '[ControlCenter] Unable to change Bluetooth state:',
          error
        );

        await syncNativeSystemState();
      }
    }
  };

  /**
   * AirDrop.
   *
   * There is no native Apple AirDrop API available to a Windows
   * Electron application. The next native layer will report this
   * honestly instead of pretending that AirDrop is available.
   */
  const handleAirDropToggle = async () => {
    if (!nativeAPI?.setAirDropEnabled) {
      return;
    }

    const next = !settings.airDropEnabled;

    sound.playToggle(next);

    updateSettings({
      airDropEnabled: next,
    });

    try {
      await nativeAPI.setAirDropEnabled(next);
      await syncNativeSystemState();
    } catch (error) {
      console.warn(
        '[ControlCenter] AirDrop is not available on this host:',
        error
      );

      await syncNativeSystemState();
    }
  };

  /**
   * Focus / Do Not Disturb
   */
  const handleFocusToggle = async () => {
    const next = !settings.doNotDisturb;

    sound.playToggle(next);

    updateSettings({
      doNotDisturb: next,
    });

    if (nativeAPI?.setFocus) {
      try {
        await nativeAPI.setFocus(next);
        await syncNativeSystemState();
      } catch (error) {
        console.warn(
          '[ControlCenter] Unable to change native Focus state:',
          error
        );
      }
    }
  };

  /**
   * Brightness
   */
  const handleBrightnessChange = async (value: number) => {
    const brightness = Math.max(0, Math.min(100, value));

    updateSettings({
      brightness,
    });

    if (nativeAPI?.setBrightness) {
      try {
        await nativeAPI.setBrightness(brightness);
      } catch (error) {
        console.warn(
          '[ControlCenter] Unable to change display brightness:',
          error
        );
      }
    }
  };

  /**
   * Volume
   */
  const handleVolumeChange = async (value: number) => {
    const volume = Math.max(0, Math.min(1, value));

    updateSettings({
      soundVolume: volume,
    });

    if (nativeAPI?.setVolume) {
      try {
        await nativeAPI.setVolume(volume);
      } catch (error) {
        console.warn(
          '[ControlCenter] Unable to change system volume:',
          error
        );
      }
    }
  };

  return (
    <AnimatePresence>
      {showControlCenter && (
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
          {/* Top Connectivity Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {/* Connectivity Group Box */}
            <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 flex flex-col gap-2.5">
              {/* Wi-Fi */}
              <div
                onClick={() => {
                  void handleWifiToggle();
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
                  {settings.wifiEnabled ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[11px] font-bold truncate">
                    Wi-Fi
                  </div>

                  <div className="text-[9px] text-slate-400 truncate">
                    {settings.wifiEnabled
                      ? settings.wifiNetwork || 'Connected'
                      : 'Off'}
                  </div>
                </div>
              </div>

              {/* Bluetooth */}
              <div
                onClick={() => {
                  void handleBluetoothToggle();
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
                  <div className="text-[11px] font-bold truncate">
                    Bluetooth
                  </div>

                  <div className="text-[9px] text-slate-400 truncate">
                    {settings.bluetoothEnabled
                      ? 'On'
                      : 'Off'}
                  </div>
                </div>
              </div>

              {/* AirDrop / Local Share */}
              <div
                onClick={() => {
                  void handleAirDropToggle();
                }}
                className={`flex items-center gap-2.5 ${
                  nativeAPI?.setAirDropEnabled
                    ? 'cursor-pointer'
                    : 'cursor-default'
                } group`}
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
                  <div className="text-[11px] font-bold truncate">
                    AirDrop
                  </div>

                  <div className="text-[9px] text-slate-400 truncate">
                    {nativeAPI?.setAirDropEnabled
                      ? settings.airDropEnabled
                        ? 'Available'
                        : 'Off'
                      : 'Not available'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Stack */}
            <div className="flex flex-col gap-2.5">
              {/* Focus */}
              <div
                onClick={() => {
                  void handleFocusToggle();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
                  settings.doNotDisturb
                    ? 'bg-purple-600/30 border-purple-500/40 text-purple-300'
                    : 'bg-white/10 dark:bg-slate-900/40 border-white/10'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    settings.doNotDisturb
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/15 text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </div>

                <div>
                  <div className="text-[11px] font-bold leading-tight">
                    Focus
                  </div>

                  <div className="text-[9px] text-slate-400">
                    {settings.doNotDisturb
                      ? 'Do Not Disturb'
                      : 'Off'}
                  </div>
                </div>
              </div>

              {/* Night Shift & Dark Mode */}
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div
                  onClick={() => {
                    const next = !settings.nightShift;

                    updateSettings({
                      nightShift: next,
                    });

                    sound.playToggle(next);
                  }}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    settings.nightShift
                      ? 'bg-amber-500/30 border-amber-500/50 text-amber-300'
                      : 'bg-white/10 border-white/10'
                  }`}
                >
                  <Eye className="w-4 h-4 mb-1" />

                  <span className="text-[10px] font-semibold">
                    Night Shift
                  </span>
                </div>

                <div
                  onClick={() => {
                    const nextTheme =
                      settings.theme === 'light'
                        ? 'dark'
                        : 'light';

                    updateSettings({
                      theme: nextTheme,
                    });

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
                    {settings.theme === 'light'
                      ? 'Dark'
                      : 'Light'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Display Brightness */}
          <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />

                <span>Display Brightness</span>
              </span>

              <span className="font-mono text-[10px]">
                {Math.round(settings.brightness)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={settings.brightness}
              onChange={(e) => {
                void handleBrightnessChange(
                  Number(e.target.value)
                );
              }}
              className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
            />
          </div>

          {/* Sound Volume */}
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

              <span className="font-mono text-[10px]">
                {Math.round(settings.soundVolume * 100)}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={settings.soundVolume}
              onChange={(e) => {
                void handleVolumeChange(
                  Number(e.target.value)
                );
              }}
              className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
            />
          </div>

          {/* Media Player */}
          <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-3 flex items-center gap-3">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-11 h-11 rounded-xl object-cover shadow-md"
            />

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">
                {currentTrack.title}
              </div>

              <div className="text-[10px] text-slate-400 truncate">
                {currentTrack.artist}
              </div>
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
                {isPlayingMusic ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick System Actions */}
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

              <span className="text-[9px]">
                Capture
              </span>
            </button>

            <button
              onClick={() => {
                lockSystem();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
              title="Lock Screen"
            >
              <Lock className="w-4 h-4 text-amber-300 mb-0.5" />

              <span className="text-[9px]">
                Lock
              </span>
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

              <span className="text-[9px]">
                Settings
              </span>
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

              <span className="text-[9px]">
                Power
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ControlCenter;