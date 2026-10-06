// import React, { useRef, useEffect, useCallback, useState } from 'react';

// import { motion, AnimatePresence } from 'motion/react';

// import {
//   Wifi,
//   WifiOff,
//   Bluetooth,
//   Radio,
//   Moon,
//   Sun,
//   Volume2,
//   VolumeX,
//   Play,
//   Pause,
//   SkipForward,
//   SkipBack,
//   Camera,
//   Lock,
//   Power,
//   Settings,
//   Eye,
//   RefreshCw,
// } from 'lucide-react';

// import { useOS } from '../../context/OSContext';
// import { sound } from '../../services/soundService';

// const getNativeAPI = () => {
//   if (typeof window === 'undefined') {
//     return null;
//   }

//   return window.electronAPI ?? null;
// };

// export const ControlCenter: React.FC = () => {
//   const {
//     showControlCenter,
//     setShowControlCenter,
//     settings,
//     updateSettings,
//     currentTrack,
//     isPlayingMusic,
//     togglePlayMusic,
//     nextTrack,
//     prevTrack,
//     lockSystem,
//     setShowPowerDialog,
//     openApp,
//   } = useOS();

//   const panelRef = useRef<HTMLDivElement | null>(null);
//   const [connectivity, setConnectivity] = useState<ConnectivityState | null>(null);
//   const [nearbyDevices, setNearbyDevices] = useState<NearbyBluetoothDevice[]>([]);
//   const [radioAction, setRadioAction] = useState<'wifi' | 'bluetooth' | null>(null);
//   const [isBluetoothScanning, setIsBluetoothScanning] = useState(false);
//   const [connectivityError, setConnectivityError] = useState('');

//   const nativeSyncTimerRef = useRef<ReturnType<typeof setInterval> | null>(
//     null
//   );

//   useEffect(() => {
//     const unsubscribe = window.electronAPI?.onBluetoothDevices?.(devices => {
//       setNearbyDevices(devices);
//     });
//     return () => unsubscribe?.();
//   }, []);

//   /**
//    * Keep the Control Center synchronized with the real host machine.
//    */
//   const syncNativeSystemState = useCallback(async () => {
//     const api = getNativeAPI();

//     if (!api?.getConnectivityState) {
//       return;
//     }

//     try {
//       const state = await api.getConnectivityState();

//       if (!state) {
//         return;
//       }

//       setConnectivity(state);

//       /**
//        * Wi-Fi
//        */
//       updateSettings({
//         wifiEnabled: state.wifi.enabled ?? false,
//         wifiConnected: state.wifi.connected ?? false,
//         wifiNetwork:
//           state.wifi.connected && state.wifi.ssid
//             ? state.wifi.ssid
//             : state.wifi.enabled === true
//               ? 'Not connected'
//               : state.wifi.enabled === false
//                 ? 'Off'
//                 : 'Unavailable',
//       });

//       /**
//        * Bluetooth
//        */
//       updateSettings({
//         bluetoothEnabled: state.bluetooth.enabled ?? false,
//         bluetoothConnected: state.bluetooth.connected ?? false,
//         bluetoothDeviceName: state.bluetooth.deviceName || '',
//       });
//     } catch (error) {
//       console.warn(
//         '[ControlCenter] Unable to synchronize native system state:',
//         error
//       );
//     }
//   }, [updateSettings]);

//   /**
//    * Synchronize native system information whenever
//    * the Control Center becomes visible.
//    */
//   useEffect(() => {
//     if (!showControlCenter) {
//       if (nativeSyncTimerRef.current) {
//         clearInterval(nativeSyncTimerRef.current);
//         nativeSyncTimerRef.current = null;
//       }

//       return;
//     }

//     void syncNativeSystemState();

//     nativeSyncTimerRef.current = setInterval(() => {
//       void syncNativeSystemState();
//     }, 2000);

//     return () => {
//       if (nativeSyncTimerRef.current) {
//         clearInterval(nativeSyncTimerRef.current);
//         nativeSyncTimerRef.current = null;
//       }
//     };
//   }, [showControlCenter, syncNativeSystemState]);

//   /**
//    * Close when clicking outside.
//    */
//   useEffect(() => {
//     const handleOutside = (e: MouseEvent) => {
//       if (
//         panelRef.current &&
//         !panelRef.current.contains(e.target as Node)
//       ) {
//         const target = e.target as HTMLElement;

//         if (!target.closest('.glass-menubar')) {
//           setShowControlCenter(false);
//         }
//       }
//     };

//     if (showControlCenter) {
//       window.addEventListener('mousedown', handleOutside);
//     }

//     return () => {
//       window.removeEventListener('mousedown', handleOutside);
//     };
//   }, [showControlCenter, setShowControlCenter]);

//   if (!showControlCenter) {
//     return null;
//   }

//   const isLight = settings.theme === 'light';

//   const nativeAPI = getNativeAPI();

//   const handleRadioToggle = async (radio: 'wifi' | 'bluetooth') => {
//     const enabled = connectivity?.[radio].enabled;
//     if (enabled == null || radioAction) return;

//     setRadioAction(radio);
//     setConnectivityError('');
//     sound.playToggle(!enabled);
//     try {
//       if (radio === 'wifi') {
//         await nativeAPI?.setWifiEnabled(!enabled);
//       } else {
//         await nativeAPI?.setBluetoothEnabled(!enabled);
//       }
//       await syncNativeSystemState();
//     } catch (error) {
//       setConnectivityError(error instanceof Error
//         ? `Windows could not change ${radio === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}. Approve the Windows administrator prompt; if cancelled, no change was made.`
//         : 'Windows could not change the radio state.');
//       await syncNativeSystemState();
//     } finally {
//       setRadioAction(null);
//     }
//   };

//   const handleBluetoothScan = async () => {
//     if (isBluetoothScanning) {
//       await nativeAPI?.selectBluetoothDevice('');
//       setIsBluetoothScanning(false);
//       return;
//     }

//     const bluetooth = (navigator as unknown as {
//       bluetooth?: {
//         requestDevice: (options: { acceptAllDevices: boolean }) => Promise<{
//           id: string;
//           name?: string;
//           gatt?: { connected: boolean; connect: () => Promise<{ connected: boolean }> };
//         }>;
//       };
//     }).bluetooth;

//     if (!bluetooth?.requestDevice) {
//       setConnectivityError('Nearby Bluetooth scanning is not available in this Windows or Electron version.');
//       return;
//     }

//     setNearbyDevices([]);
//     setConnectivityError('');
//     setIsBluetoothScanning(true);
//     try {
//       const device = await bluetooth.requestDevice({ acceptAllDevices: true });
//       const gattServer = device.gatt ? await device.gatt.connect() : null;
//       setNearbyDevices(previous => {
//         const selected = {
//           deviceId: device.id,
//           deviceName: device.name || 'Unnamed Bluetooth device',
//           deviceType: 0,
//           paired: false,
//           connected: Boolean(gattServer?.connected),
//         };
//         return [selected, ...previous.filter(item => item.deviceId !== device.id)];
//       });
//       await syncNativeSystemState();
//     } catch (error) {
//       if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
//         setConnectivityError('Bluetooth scan or connection failed. Check that Bluetooth is on and try again.');
//       }
//     } finally {
//       setIsBluetoothScanning(false);
//     }
//   };

//   /**
//    * AirDrop.
//    *
//    * There is no native Apple AirDrop API available to a Windows
//    * Electron application. The next native layer will report this
//    * honestly instead of pretending that AirDrop is available.
//    */
//   const handleAirDropToggle = async () => {
//     if (!nativeAPI?.setAirDropEnabled) {
//       return;
//     }

//     const next = !settings.airDropEnabled;

//     sound.playToggle(next);

//     updateSettings({
//       airDropEnabled: next,
//     });

//     try {
//       await nativeAPI.setAirDropEnabled(next);
//       await syncNativeSystemState();
//     } catch (error) {
//       console.warn(
//         '[ControlCenter] AirDrop is not available on this host:',
//         error
//       );

//       await syncNativeSystemState();
//     }
//   };

//   /**
//    * Focus / Do Not Disturb
//    */
//   const handleFocusToggle = async () => {
//     const next = !settings.doNotDisturb;

//     sound.playToggle(next);

//     updateSettings({
//       doNotDisturb: next,
//     });

//     if (nativeAPI?.setFocus) {
//       try {
//         await nativeAPI.setFocus(next);
//         await syncNativeSystemState();
//       } catch (error) {
//         console.warn(
//           '[ControlCenter] Unable to change native Focus state:',
//           error
//         );
//       }
//     }
//   };

//   /**
//    * Brightness
//    */
//   const handleBrightnessChange = async (value: number) => {
//     const brightness = Math.max(0, Math.min(100, value));

//     updateSettings({
//       brightness,
//     });

//     if (nativeAPI?.setBrightness) {
//       try {
//         await nativeAPI.setBrightness(brightness);
//       } catch (error) {
//         console.warn(
//           '[ControlCenter] Unable to change display brightness:',
//           error
//         );
//       }
//     }
//   };

//   /**
//    * Volume
//    */
//   const handleVolumeChange = async (value: number) => {
//     const volume = Math.max(0, Math.min(1, value));

//     updateSettings({
//       soundVolume: volume,
//     });

//     if (nativeAPI?.setVolume) {
//       try {
//         await nativeAPI.setVolume(volume);
//       } catch (error) {
//         console.warn(
//           '[ControlCenter] Unable to change system volume:',
//           error
//         );
//       }
//     }
//   };

//   return (
//     <AnimatePresence>
//       {showControlCenter && (
//         <motion.div
//           ref={panelRef}
//           initial={{ opacity: 0, y: -12, scale: 0.96 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           exit={{ opacity: 0, y: -12, scale: 0.96 }}
//           transition={{ duration: 0.18, ease: 'easeOut' }}
//           className={`fixed top-10 right-3 w-80 z-50 p-4 rounded-3xl shadow-2xl select-none backdrop-blur-3xl border ${
//             isLight
//               ? 'glass-panel-light text-slate-800 border-white/60'
//               : 'glass-panel text-white border-white/15'
//           }`}
//         >
//           {/* Top Connectivity Grid */}
//           <div className="grid grid-cols-2 gap-2.5 mb-3">
//             {/* Connectivity Group Box */}
//             <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 flex flex-col gap-2.5">
//               {/* Wi-Fi */}
//               <button
//                 type="button"
//                 onClick={() => void handleRadioToggle('wifi')}
//                 disabled={connectivity?.wifi.enabled == null || radioAction !== null}
//                 aria-pressed={connectivity?.wifi.enabled === true}
//                 title={connectivity?.wifi.enabled ? 'Turn Wi-Fi off' : 'Turn Wi-Fi on'}
//                 className="flex items-center gap-2.5 text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 <div
//                   className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
//                     connectivity?.wifi.enabled
//                       ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
//                       : 'bg-white/15 text-slate-400'
//                   }`}
//                 >
//                   {connectivity?.wifi.enabled ? (
//                     <Wifi className="w-4 h-4" />
//                   ) : (
//                     <WifiOff className="w-4 h-4" />
//                   )}
//                 </div>

//                 <div className="min-w-0">
//                   <div className="text-[11px] font-bold truncate">
//                     Wi-Fi
//                   </div>

//                   <div className="text-[9px] text-slate-400 truncate">
//                     {connectivity?.wifi.enabled === false
//                       ? 'Off'
//                       : connectivity?.wifi.connected
//                       ? connectivity.wifi.ssid || 'Connected'
//                       : connectivity?.wifi.enabled === true
//                         ? 'Not connected'
//                         : connectivity?.wifi.enabled === false
//                           ? 'Off'
//                           : 'Status unavailable'}
//                   </div>
//                 </div>
//               </button>

//               {/* Bluetooth */}
//               <button
//                 type="button"
//                 onClick={() => void handleRadioToggle('bluetooth')}
//                 disabled={connectivity?.bluetooth.enabled == null || radioAction !== null}
//                 aria-pressed={connectivity?.bluetooth.enabled === true}
//                 title={connectivity?.bluetooth.enabled ? 'Turn Bluetooth off' : 'Turn Bluetooth on'}
//                 className="flex items-center gap-2.5 text-left transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 <div
//                   className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
//                     connectivity?.bluetooth.enabled
//                       ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
//                       : 'bg-white/15 text-slate-400'
//                   }`}
//                 >
//                   <Bluetooth className="w-4 h-4" />
//                 </div>

//                 <div className="min-w-0">
//                   <div className="text-[11px] font-bold truncate">
//                     Bluetooth
//                   </div>

//                   <div className="text-[9px] text-slate-400 truncate">
//                     {connectivity?.bluetooth.enabled === false
//                       ? 'Off'
//                       : connectivity?.bluetooth.enabled === true
//                         ? connectivity.bluetooth.connected === true
//                           ? connectivity.bluetooth.deviceName || 'Device connected'
//                           : connectivity.bluetooth.connected === false
//                             ? 'No device connected'
//                             : 'Connection status unavailable'
//                         : 'Status unavailable'}
//                   </div>
//                 </div>
//               </button>

//               <button
//                 type="button"
//                 onClick={() => void handleBluetoothScan()}
//                 disabled={connectivity?.bluetooth.enabled !== true}
//                 className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-left text-[10px] text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
//               >
//                 <RefreshCw className={`h-3 w-3 ${isBluetoothScanning ? 'animate-spin' : ''}`} />
//                 {isBluetoothScanning ? 'Stop nearby scan' : 'Scan nearby BLE devices'}
//               </button>

//               {nearbyDevices.length > 0 && (
//                 <div className="max-h-24 space-y-1 overflow-y-auto pr-1">
//                   {nearbyDevices.map(device => (
//                     <button
//                       type="button"
//                       key={device.deviceId}
//                       onClick={() => void nativeAPI?.selectBluetoothDevice(device.deviceId)}
//                       disabled={!isBluetoothScanning}
//                       className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[10px] text-slate-300 hover:bg-white/10"
//                     >
//                       <span className="truncate">{device.deviceName}</span>
//                       <span className="shrink-0 text-[9px] text-slate-500">
//                         {device.connected ? 'Connected' : device.paired ? 'Paired' : 'Nearby'}
//                       </span>
//                     </button>
//                   ))}
//                 </div>
//               )}

//               {/* AirDrop / Local Share */}
//               <div
//                 onClick={() => {
//                   void handleAirDropToggle();
//                 }}
//                 className={`flex items-center gap-2.5 ${
//                   nativeAPI?.setAirDropEnabled
//                     ? 'cursor-pointer'
//                     : 'cursor-default'
//                 } group`}
//               >
//                 <div
//                   className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
//                     settings.airDropEnabled
//                       ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
//                       : 'bg-white/15 text-slate-400'
//                   }`}
//                 >
//                   <Radio className="w-4 h-4" />
//                 </div>

//                 <div className="min-w-0">
//                   <div className="text-[11px] font-bold truncate">
//                     AirDrop
//                   </div>

//                   <div className="text-[9px] text-slate-400 truncate">
//                     {nativeAPI?.setAirDropEnabled
//                       ? settings.airDropEnabled
//                         ? 'Available'
//                         : 'Off'
//                       : 'Not available'}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Right Side Stack */}
//             <div className="flex flex-col gap-2.5">
//               {/* Focus */}
//               <div
//                 onClick={() => {
//                   void handleFocusToggle();
//                 }}
//                 className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2.5 ${
//                   settings.doNotDisturb
//                     ? 'bg-purple-600/30 border-purple-500/40 text-purple-300'
//                     : 'bg-white/10 dark:bg-slate-900/40 border-white/10'
//                 }`}
//               >
//                 <div
//                   className={`w-7 h-7 rounded-full flex items-center justify-center ${
//                     settings.doNotDisturb
//                       ? 'bg-purple-500 text-white'
//                       : 'bg-white/15 text-slate-300'
//                   }`}
//                 >
//                   <Moon className="w-4 h-4" />
//                 </div>

//                 <div>
//                   <div className="text-[11px] font-bold leading-tight">
//                     Focus
//                   </div>

//                   <div className="text-[9px] text-slate-400">
//                     {settings.doNotDisturb
//                       ? 'Do Not Disturb'
//                       : 'Off'}
//                   </div>
//                 </div>
//               </div>

//               {/* Night Shift & Dark Mode */}
//               <div className="grid grid-cols-2 gap-2 flex-1">
//                 <div
//                   onClick={() => {
//                     const next = !settings.nightShift;

//                     updateSettings({
//                       nightShift: next,
//                     });

//                     sound.playToggle(next);
//                   }}
//                   className={`p-2 rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
//                     settings.nightShift
//                       ? 'bg-amber-500/30 border-amber-500/50 text-amber-300'
//                       : 'bg-white/10 border-white/10'
//                   }`}
//                 >
//                   <Eye className="w-4 h-4 mb-1" />

//                   <span className="text-[10px] font-semibold">
//                     Night Shift
//                   </span>
//                 </div>

//                 <div
//                   onClick={() => {
//                     const nextTheme =
//                       settings.theme === 'light'
//                         ? 'dark'
//                         : 'light';

//                     updateSettings({
//                       theme: nextTheme,
//                     });

//                     sound.playToggle(nextTheme === 'dark');
//                   }}
//                   className="p-2 rounded-2xl bg-white/10 border border-white/10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/15 transition-colors"
//                 >
//                   {settings.theme === 'light' ? (
//                     <Moon className="w-4 h-4 mb-1 text-indigo-400" />
//                   ) : (
//                     <Sun className="w-4 h-4 mb-1 text-amber-400" />
//                   )}

//                   <span className="text-[10px] font-semibold">
//                     {settings.theme === 'light'
//                       ? 'Dark'
//                       : 'Light'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {connectivityError && (
//             <div role="status" className="mb-2.5 rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[10px] leading-4 text-rose-200">
//               {connectivityError}
//             </div>
//           )}

//           {/* Display Brightness */}
//           <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-2.5">
//             <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-slate-300">
//               <span className="flex items-center gap-1.5">
//                 <Sun className="w-3.5 h-3.5 text-amber-400" />

//                 <span>Display Brightness</span>
//               </span>

//               <span className="font-mono text-[10px]">
//                 {Math.round(settings.brightness)}%
//               </span>
//             </div>

//             <input
//               type="range"
//               min="0"
//               max="100"
//               value={settings.brightness}
//               onChange={(e) => {
//                 void handleBrightnessChange(
//                   Number(e.target.value)
//                 );
//               }}
//               className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
//             />
//           </div>

//           {/* Sound Volume */}
//           <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-2.5">
//             <div className="flex items-center justify-between text-[11px] font-bold mb-1.5 text-slate-300">
//               <span className="flex items-center gap-1.5">
//                 {settings.soundVolume > 0 ? (
//                   <Volume2 className="w-3.5 h-3.5 text-sky-400" />
//                 ) : (
//                   <VolumeX className="w-3.5 h-3.5 text-red-400" />
//                 )}

//                 <span>Sound Volume</span>
//               </span>

//               <span className="font-mono text-[10px]">
//                 {Math.round(settings.soundVolume * 100)}%
//               </span>
//             </div>

//             <input
//               type="range"
//               min="0"
//               max="1"
//               step="0.01"
//               value={settings.soundVolume}
//               onChange={(e) => {
//                 void handleVolumeChange(
//                   Number(e.target.value)
//                 );
//               }}
//               className="w-full accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-white/20"
//             />
//           </div>

//           {/* Media Player */}
//           <div className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 mb-3 flex items-center gap-3">
//             <img
//               src={currentTrack.coverUrl}
//               alt={currentTrack.title}
//               className="w-11 h-11 rounded-xl object-cover shadow-md"
//             />

//             <div className="flex-1 min-w-0">
//               <div className="text-xs font-bold truncate">
//                 {currentTrack.title}
//               </div>

//               <div className="text-[10px] text-slate-400 truncate">
//                 {currentTrack.artist}
//               </div>
//             </div>

//             <div className="flex items-center gap-1">
//               <button
//                 onClick={prevTrack}
//                 className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
//               >
//                 <SkipBack className="w-3.5 h-3.5" />
//               </button>

//               <button
//                 onClick={togglePlayMusic}
//                 className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
//               >
//                 {isPlayingMusic ? (
//                   <Pause className="w-4 h-4 fill-current" />
//                 ) : (
//                   <Play className="w-4 h-4 fill-current ml-0.5" />
//                 )}
//               </button>

//               <button
//                 onClick={nextTrack}
//                 className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center text-white transition-colors"
//               >
//                 <SkipForward className="w-3.5 h-3.5" />
//               </button>
//             </div>
//           </div>

//           {/* Quick System Actions */}
//           <div className="grid grid-cols-4 gap-2 pt-1 border-t border-white/10">
//             <button
//               onClick={() => {
//                 openApp('screenshot');
//                 setShowControlCenter(false);
//               }}
//               className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
//               title="Take Screenshot"
//             >
//               <Camera className="w-4 h-4 text-purple-400 mb-0.5" />

//               <span className="text-[9px]">
//                 Capture
//               </span>
//             </button>

//             <button
//               onClick={() => {
//                 lockSystem();
//               }}
//               className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
//               title="Lock Screen"
//             >
//               <Lock className="w-4 h-4 text-amber-300 mb-0.5" />

//               <span className="text-[9px]">
//                 Lock
//               </span>
//             </button>

//             <button
//               onClick={() => {
//                 openApp('settings');
//                 setShowControlCenter(false);
//               }}
//               className="p-2 rounded-xl bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center transition-colors"
//               title="System Settings"
//             >
//               <Settings className="w-4 h-4 text-sky-400 mb-0.5" />

//               <span className="text-[9px]">
//                 Settings
//               </span>
//             </button>

//             <button
//               onClick={() => {
//                 setShowPowerDialog(true);
//                 setShowControlCenter(false);
//               }}
//               className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 flex flex-col items-center justify-center transition-colors"
//               title="Shut Down..."
//             >
//               <Power className="w-4 h-4 text-red-400 mb-0.5" />

//               <span className="text-[9px]">
//                 Power
//               </span>
//             </button>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// export default ControlCenter;


import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AnimatePresence,
  motion,
} from 'motion/react';

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
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Search,
  Signal,
  Smartphone,
  Laptop,
  Headphones,
  Speaker,
  Monitor,
  X,
  Zap,
  ShieldCheck,
  Share2,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

/* =========================================================
   TYPES
========================================================= */

type RadioName = 'wifi' | 'bluetooth';

type ConnectivityState = {
  wifi: {
    enabled: boolean;
    connected: boolean;
    ssid?: string;
  };

  bluetooth: {
    enabled: boolean;
    connected: boolean;
    deviceName?: string;
  };
};

type NearbyBluetoothDevice = {
  deviceId: string;
  deviceName: string;
  deviceType?: number;
  paired?: boolean;
  connected?: boolean;
};

type WifiNetwork = {
  ssid: string;
  signal?: number;
  security?: string;
  connected?: boolean;
  saved?: boolean;
};

type WifiScanResult = {
  networks: WifiNetwork[];
};

type BluetoothWebDevice = {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<{
      connected: boolean;
    }>;
    disconnect?: () => void;
  };
};

type ExtendedElectronAPI = {
  getConnectivityState?: () => Promise<ConnectivityState | null>;

  setWifiEnabled?: (
    enabled: boolean
  ) => Promise<unknown>;

  setBluetoothEnabled?: (
    enabled: boolean
  ) => Promise<unknown>;

  setAirDropEnabled?: (
    enabled: boolean
  ) => Promise<unknown>;

  setFocus?: (
    enabled: boolean
  ) => Promise<unknown>;

  setBrightness?: (
    value: number
  ) => Promise<unknown>;

  setVolume?: (
    value: number
  ) => Promise<unknown>;

  selectBluetoothDevice?: (
    deviceId: string
  ) => Promise<unknown>;

  openBluetoothSettings?: () => Promise<unknown>;

  onBluetoothDevices?: (
    callback: (
      devices: NearbyBluetoothDevice[]
    ) => void
  ) => (() => void) | void;

  /**
   * Optional Wi-Fi APIs.
   *
   * If these are exposed by your Electron preload,
   * the Wi-Fi modal becomes fully functional.
   */
  scanWifiNetworks?: () => Promise<
    WifiNetwork[] | WifiScanResult
  >;

  connectWifi?: (
    ssid: string
  ) => Promise<unknown>;

  disconnectWifi?: () => Promise<unknown>;
};

/* =========================================================
   HELPERS
========================================================= */

const getNativeAPI = (): ExtendedElectronAPI | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    window.electronAPI as unknown as ExtendedElectronAPI
  ) ?? null;
};

const getWifiSignalIcon = (
  signal: number | undefined
) => {
  if (signal == null) {
    return Signal;
  }

  return Signal;
};

const getBluetoothDeviceIcon = (
  deviceName: string
) => {
  const name = deviceName.toLowerCase();

  if (
    name.includes('airpod') ||
    name.includes('headphone') ||
    name.includes('buds') ||
    name.includes('headset')
  ) {
    return Headphones;
  }

  if (
    name.includes('speaker') ||
    name.includes('sound')
  ) {
    return Speaker;
  }

  if (
    name.includes('iphone') ||
    name.includes('android') ||
    name.includes('phone')
  ) {
    return Smartphone;
  }

  if (
    name.includes('mac') ||
    name.includes('laptop') ||
    name.includes('pc')
  ) {
    return Laptop;
  }

  if (
    name.includes('monitor') ||
    name.includes('display')
  ) {
    return Monitor;
  }

  return Bluetooth;
};

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

const IconButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}> = ({
  children,
  onClick,
  title,
  disabled,
  className = '',
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{
        scale: disabled ? 1 : 1.04,
      }}
      whileTap={{
        scale: disabled ? 1 : 0.92,
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 25,
      }}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex items-center justify-center rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </motion.button>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export const ControlCenter: React.FC = () => {
  const {
    showControlCenter,
    setShowControlCenter,
    settings,
    resolvedTheme,
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

  const panelRef =
    useRef<HTMLDivElement | null>(null);

  const nativeSyncTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const wifiScanTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /* =====================================================
     STATE
  ===================================================== */

  const [connectivity, setConnectivity] =
    useState<ConnectivityState | null>(null);

  const [nearbyDevices, setNearbyDevices] =
    useState<NearbyBluetoothDevice[]>([]);

  const bluetoothWebDevicesRef =
    useRef(new Map<string, BluetoothWebDevice>());

  const pendingBluetoothSelectionRef =
    useRef<Promise<BluetoothWebDevice> | null>(null);

  const [wifiNetworks, setWifiNetworks] =
    useState<WifiNetwork[]>([]);

  const [radioAction, setRadioAction] =
    useState<RadioName | null>(null);

  const [isBluetoothScanning, setIsBluetoothScanning] =
    useState(false);

  const [isWifiScanning, setIsWifiScanning] =
    useState(false);

  const [isWifiConnecting, setIsWifiConnecting] =
    useState<string | null>(null);

  const [connectivityError, setConnectivityError] =
    useState('');

  const [activeSheet, setActiveSheet] = useState<
    'wifi' | 'bluetooth' | null
  >(null);

  /* =====================================================
     NATIVE BLUETOOTH EVENTS
  ===================================================== */

  useEffect(() => {
    const api = getNativeAPI();

    const unsubscribe =
      api?.onBluetoothDevices?.(devices => {
        setNearbyDevices(devices);
      });

    return () => {
      unsubscribe?.();
    };
  }, []);

  /* =====================================================
     SYNC NATIVE STATE
  ===================================================== */

  const syncNativeSystemState =
    useCallback(async () => {
      const api = getNativeAPI();

      if (!api?.getConnectivityState) {
        return;
      }

      try {
        const state =
          await api.getConnectivityState();

        if (!state) {
          return;
        }

        setConnectivity(state);
        if (!state.bluetooth.enabled) {
          bluetoothWebDevicesRef.current.forEach(device => {
            if (device.gatt?.connected) device.gatt.disconnect?.();
          });
          bluetoothWebDevicesRef.current.clear();
          setNearbyDevices([]);
          setIsBluetoothScanning(false);
        }

        updateSettings({
          wifiEnabled:
            state.wifi.enabled ?? false,

          wifiConnected:
            state.wifi.connected ?? false,

          wifiNetwork:
            state.wifi.connected &&
            state.wifi.ssid
              ? state.wifi.ssid
              : state.wifi.enabled
                ? 'Not connected'
                : 'Off',
        });

        updateSettings({
          bluetoothEnabled:
            state.bluetooth.enabled ?? false,

          bluetoothConnected:
            state.bluetooth.connected ?? false,

          bluetoothDeviceName:
            state.bluetooth.deviceName || '',
        });
      } catch (error) {
        console.warn(
          '[ControlCenter] Native sync failed:',
          error
        );
      }
    }, [updateSettings]);

  /* =====================================================
     CONTROL CENTER SYNC
  ===================================================== */

  useEffect(() => {
    if (!showControlCenter) {
      if (nativeSyncTimerRef.current) {
        clearInterval(
          nativeSyncTimerRef.current
        );

        nativeSyncTimerRef.current = null;
      }

      return;
    }

    void syncNativeSystemState();

    nativeSyncTimerRef.current =
      setInterval(() => {
        void syncNativeSystemState();
      }, 2000);

    return () => {
      if (nativeSyncTimerRef.current) {
        clearInterval(
          nativeSyncTimerRef.current
        );

        nativeSyncTimerRef.current = null;
      }
    };
  }, [
    showControlCenter,
    syncNativeSystemState,
  ]);

  /* =====================================================
     OUTSIDE CLICK
  ===================================================== */

  useEffect(() => {
    if (!showControlCenter) {
      return;
    }

    const handleOutside = (event: PointerEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setShowControlCenter(false);
      }
    };

    window.addEventListener(
      'pointerdown',
      handleOutside
    );

    return () => {
      window.removeEventListener(
        'pointerdown',
        handleOutside
      );
    };
  }, [
    showControlCenter,
    setShowControlCenter,
  ]);

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      if (wifiScanTimerRef.current) {
        clearTimeout(
          wifiScanTimerRef.current
        );
      }
    };
  }, []);

  /* =====================================================
     RADIO TOGGLE
  ===================================================== */

  const handleRadioToggle = async (
    radio: RadioName
  ) => {
    const api = getNativeAPI();

    const enabled =
      connectivity?.[radio]?.enabled;

    if (
      enabled == null ||
      radioAction ||
      !api
    ) {
      return;
    }

    setRadioAction(radio);
    setConnectivityError('');

    sound.playToggle(!enabled);

    try {
      if (radio === 'wifi') {
        await api.setWifiEnabled?.(
          !enabled
        );
      } else {
        await api.setBluetoothEnabled?.(
          !enabled
        );
      }

      await syncNativeSystemState();

      if (
        radio === 'wifi' &&
        !enabled
      ) {
        setActiveSheet('wifi');
      }

      if (
        radio === 'bluetooth' &&
        !enabled
      ) {
        setActiveSheet('bluetooth');
      }
    } catch (error) {
      setConnectivityError(
        error instanceof Error
          ? error.message
          : `Windows could not change ${
              radio === 'wifi'
                ? 'Wi-Fi'
                : 'Bluetooth'
            }.`
      );

      await syncNativeSystemState();
    } finally {
      setRadioAction(null);
    }
  };

  /* =====================================================
     WIFI SCANNING
  ===================================================== */

  const scanWifiNetworks = useCallback(async () => {
    const api = getNativeAPI();

    setConnectivityError('');

    if (!api?.scanWifiNetworks) {
      setConnectivityError(
        'Wi-Fi network scanning is not exposed by the Electron native layer yet.'
      );
      return;
    }

    setIsWifiScanning(true);

    try {
      const result =
        await api.scanWifiNetworks();

      const networks = Array.isArray(result)
        ? result
        : result.networks;

      setWifiNetworks(
        networks.filter(
          network =>
            network.ssid.trim().length > 0
        )
      );
    } catch (error) {
      console.warn(
        '[ControlCenter] Wi-Fi scan failed:',
        error
      );

      setConnectivityError(
        error instanceof Error
          ? error.message
          : 'Unable to scan nearby Wi-Fi networks.'
      );
    } finally {
      setIsWifiScanning(false);
    }
  }, []);

  useEffect(() => {
    if (
      activeSheet === 'wifi' &&
      connectivity?.wifi.enabled === true &&
      wifiNetworks.length === 0
    ) {
      void scanWifiNetworks();
    }
  }, [activeSheet, connectivity?.wifi.enabled, scanWifiNetworks, wifiNetworks.length]);

  /* =====================================================
     WIFI CONNECT
  ===================================================== */

  const handleWifiConnect = async (
    network: WifiNetwork
  ) => {
    const api = getNativeAPI();

    if (
      !api?.connectWifi ||
      isWifiConnecting
    ) {
      return;
    }

    setIsWifiConnecting(network.ssid);
    setConnectivityError('');

    try {
      await api.connectWifi(
        network.ssid
      );

      sound.playToggle(true);

      await syncNativeSystemState();

      setWifiNetworks(previous =>
        previous.map(item => ({
          ...item,
          connected:
            item.ssid === network.ssid,
        }))
      );
    } catch (error) {
      setConnectivityError(
        error instanceof Error
          ? error.message
          : `Could not connect to ${network.ssid}.`
      );
    } finally {
      setIsWifiConnecting(null);
    }
  };

  /* =====================================================
     WIFI DISCONNECT
  ===================================================== */

  const handleWifiDisconnect =
    async () => {
      const api = getNativeAPI();

      if (!api?.disconnectWifi) {
        return;
      }

      try {
        await api.disconnectWifi();

        sound.playToggle(false);

        await syncNativeSystemState();
      } catch (error) {
        setConnectivityError(
          error instanceof Error
            ? error.message
            : 'Could not disconnect Wi-Fi.'
        );
      }
    };

  /* =====================================================
     BLUETOOTH SCAN
  ===================================================== */

  const handleBluetoothScan =
    async () => {
      const api = getNativeAPI();

      if (isBluetoothScanning) {
        setIsBluetoothScanning(false);

        return;
      }

      const bluetooth =
        (
          navigator as unknown as {
            bluetooth?: {
              requestDevice: (
                options: {
                  acceptAllDevices: boolean;
                }
              ) => Promise<BluetoothWebDevice>;
            };
          }
        ).bluetooth;

      if (!bluetooth?.requestDevice) {
        setConnectivityError(
          'Nearby Bluetooth scanning is not available in this Electron/Windows environment.'
        );

        return;
      }

      setNearbyDevices([]);
      setConnectivityError('');
      setIsBluetoothScanning(true);

      try {
        const selection = bluetooth.requestDevice({
          acceptAllDevices: true,
        });
        pendingBluetoothSelectionRef.current = selection;
        const device = await selection;
        pendingBluetoothSelectionRef.current = null;

        bluetoothWebDevicesRef.current.set(device.id, device);

        setNearbyDevices(
          previous => [
            {
              deviceId: device.id,
              deviceName:
                device.name ||
                'Unnamed Bluetooth device',
              deviceType: 0,
              paired: false,
              connected: Boolean(device.gatt?.connected),
            },
            ...previous.filter(
              item =>
                item.deviceId !==
                device.id
            ),
          ]
        );

        await syncNativeSystemState();
      } catch (error) {
        if (
          !(
            error instanceof DOMException &&
            error.name ===
              'NotFoundError'
          )
        ) {
          setConnectivityError(
            'Bluetooth scan was cancelled or failed. Make sure Bluetooth is enabled and try again.'
          );
        }
      } finally {
        pendingBluetoothSelectionRef.current = null;
        setIsBluetoothScanning(false);
      }
    };

  /* =====================================================
     BLUETOOTH SELECT
  ===================================================== */

  const handleBluetoothDevice =
    async (
      device: NearbyBluetoothDevice
    ) => {
      let webDevice = bluetoothWebDevicesRef.current.get(device.deviceId);
      if (!webDevice) {
        const api = getNativeAPI();
        const selection = pendingBluetoothSelectionRef.current;
        if (!api?.selectBluetoothDevice || !selection) {
          setConnectivityError('Bluetooth selection has expired. Scan again and choose a device.');
          return;
        }
        try {
          const selected = await api.selectBluetoothDevice(device.deviceId);
          if (!selected) {
            setConnectivityError('Windows is no longer discovering Bluetooth devices. Scan again.');
            return;
          }
          webDevice = await selection;
          bluetoothWebDevicesRef.current.set(webDevice.id, webDevice);
        } catch (error) {
          setConnectivityError(
            error instanceof Error
              ? error.message
              : 'Unable to select this Bluetooth device.',
          );
          return;
        }
      }
      if (!webDevice?.gatt) {
        setConnectivityError(
          `${device.deviceName} cannot be connected by the in-app Bluetooth interface. Use Windows Bluetooth settings to pair this device.`,
        );
        return;
      }

      try {
        if (webDevice.gatt.connected) {
          webDevice.gatt.disconnect?.();
        } else {
          await webDevice.gatt.connect();
        }
        setNearbyDevices(previous =>
          previous.map(item => item.deviceId === device.deviceId
            ? { ...item, connected: Boolean(webDevice.gatt?.connected) }
            : item),
        );
      } catch (error) {
        setConnectivityError(
          error instanceof Error
            ? error.message
            : 'Unable to connect to this Bluetooth device.'
        );
      }
    };

  /* =====================================================
     AIRDROP
  ===================================================== */

  const handleAirDropToggle =
    async () => {
      const api = getNativeAPI();

      if (!api?.setAirDropEnabled) {
        return;
      }

      const next =
        !settings.airDropEnabled;

      sound.playToggle(next);

      updateSettings({
        airDropEnabled: next,
      });

      try {
        await api.setAirDropEnabled(
          next
        );

        await syncNativeSystemState();
      } catch {
        await syncNativeSystemState();
      }
    };

  /* =====================================================
     FOCUS
  ===================================================== */

  const handleFocusToggle =
    async () => {
      const api = getNativeAPI();

      const next =
        !settings.doNotDisturb;

      sound.playToggle(next);

      updateSettings({
        doNotDisturb: next,
      });

      try {
        await api?.setFocus?.(next);
      } catch (error) {
        console.warn(
          '[ControlCenter] Focus failed:',
          error
        );
      }
    };

  /* =====================================================
     BRIGHTNESS
  ===================================================== */

  const handleBrightnessChange =
    async (value: number) => {
      const brightness =
        Math.max(
          0,
          Math.min(100, value)
        );

      updateSettings({
        brightness,
      });

      try {
        await getNativeAPI()?.setBrightness?.(
          brightness
        );
      } catch (error) {
        console.warn(
          '[ControlCenter] Brightness failed:',
          error
        );
      }
    };

  /* =====================================================
     VOLUME
  ===================================================== */

  const handleVolumeChange =
    async (value: number) => {
      const volume =
        Math.max(
          0,
          Math.min(1, value)
        );

      updateSettings({
        soundVolume: volume,
      });

      try {
        await getNativeAPI()?.setVolume?.(
          volume
        );
      } catch (error) {
        console.warn(
          '[ControlCenter] Volume failed:',
          error
        );
      }
    };

  /* =====================================================
     THEME
  ===================================================== */

  const toggleTheme = () => {
    const nextTheme =
      settings.theme === 'light'
        ? 'dark'
        : 'light';

    updateSettings({
      theme: nextTheme,
    });

    sound.playToggle(
      nextTheme === 'dark'
    );
  };

  /* =====================================================
     NIGHT SHIFT
  ===================================================== */

  const toggleNightShift = () => {
    const next =
      !settings.nightShift;

    updateSettings({
      nightShift: next,
    });

    sound.playToggle(next);
  };

  /* =====================================================
     CLOSE
  ===================================================== */

  const closeControlCenter = () => {
    setShowControlCenter(false);
  };

  if (!showControlCenter) {
    return null;
  }

  const isLight = resolvedTheme === 'light';

  const wifiEnabled =
    connectivity?.wifi.enabled === true;

  const wifiConnected =
    connectivity?.wifi.connected === true;

  const bluetoothEnabled =
    connectivity?.bluetooth.enabled ===
    true;

  const connectedBluetoothDevices = nearbyDevices.filter(device => device.connected);
  const bluetoothConnected =
    connectivity?.bluetooth.connected === true ||
    connectedBluetoothDevices.length > 0;
  const connectedBluetoothName =
    connectivity?.bluetooth.deviceName ||
    connectedBluetoothDevices.map(device => device.deviceName).join(', ');

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AnimatePresence>
      {showControlCenter && (
        <>
          {/* =================================================
              CONTROL CENTER
          ================================================= */}

          <motion.div
            ref={panelRef}
            initial={{
              opacity: 0,
              y: -18,
              scale: 0.94,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              y: -14,
              scale: 0.96,
              filter: 'blur(8px)',
            }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 30,
              mass: 0.7,
            }}
            className={`
              fixed top-[46px] right-3 z-[999]
              w-[390px]
              max-h-[calc(100vh-60px)]
              overflow-hidden
              rounded-[28px]
              border
              shadow-[0_30px_100px_rgba(0,0,0,0.45)]
              backdrop-blur-[40px]
              select-none
              ${
                isLight
                  ? 'border-black/10 bg-white/80 text-slate-900'
                  : 'border-white/[0.10] bg-[#111923]/90 text-white'
              }
            `}
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative max-h-[calc(100vh-60px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {/* =================================================
                  HEADER
              ================================================= */}

              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <div>
                  <div className="text-[15px] font-bold tracking-tight">
                    Control Center
                  </div>

                  <div className="mt-0.5 text-[9px] text-white/40">
                    System controls
                  </div>
                </div>

                <motion.div
                  animate={{
                    rotate: [0, 8, -8, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.07] text-sky-400"
                >
                  <Zap className="h-4 w-4" />
                </motion.div>
              </div>

              {/* =================================================
                  CONNECTIVITY
              ================================================= */}

              <div className="grid grid-cols-[1.18fr_1fr] gap-2.5 px-3.5">
                {/* LEFT */}
                <div
                  className={`
                    overflow-hidden rounded-[22px]
                    border border-white/[0.08]
                    bg-white/[0.045]
                    p-2.5
                  `}
                >
                  {/* Wi-Fi */}
                  <motion.button
                    type="button"
                    whileHover={{
                      backgroundColor:
                        'rgba(255,255,255,0.07)',
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={() =>
                      setActiveSheet('wifi')
                    }
                    className="group flex w-full items-center gap-2.5 rounded-2xl p-2 text-left"
                  >
                    <div
                      className={`
                        flex h-9 w-9 shrink-0 items-center justify-center
                        rounded-full
                        ${
                          wifiEnabled
                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                            : 'bg-white/[0.08] text-white/40'
                        }
                      `}
                    >
                      {wifiEnabled ? (
                        <Wifi className="h-[17px] w-[17px]" />
                      ) : (
                        <WifiOff className="h-[17px] w-[17px]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">
                          Wi-Fi
                        </span>

                        <ChevronRight className="h-3.5 w-3.5 text-white/25 transition-transform group-hover:translate-x-0.5" />
                      </div>

                      <div className="mt-0.5 truncate text-[9px] text-white/40">
                        {wifiConnected
                          ? connectivity?.wifi
                              .ssid ||
                            'Connected'
                          : wifiEnabled
                            ? 'Not connected'
                            : 'Off'}
                      </div>
                    </div>
                  </motion.button>

                  {/* Divider */}
                  <div className="mx-2 border-t border-white/[0.06]" />

                  {/* Bluetooth */}
                  <motion.button
                    type="button"
                    whileHover={{
                      backgroundColor:
                        'rgba(255,255,255,0.07)',
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={() =>
                      setActiveSheet(
                        'bluetooth'
                      )
                    }
                    className="group flex w-full items-center gap-2.5 rounded-2xl p-2 text-left"
                  >
                    <div
                      className={`
                        flex h-9 w-9 shrink-0 items-center justify-center
                        rounded-full
                        ${
                          bluetoothEnabled
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-white/[0.08] text-white/40'
                        }
                      `}
                    >
                      <Bluetooth className="h-[17px] w-[17px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold">
                          Bluetooth
                        </span>

                        <ChevronRight className="h-3.5 w-3.5 text-white/25 transition-transform group-hover:translate-x-0.5" />
                      </div>

                      <div className="mt-0.5 truncate text-[9px] text-white/40">
                        {bluetoothConnected
                          ? connectedBluetoothName || 'Connected'
                          : bluetoothEnabled
                            ? 'No device connected'
                            : 'Off'}
                      </div>
                    </div>
                  </motion.button>

                  {/* Local Share */}
                  <motion.button
                    type="button"
                    disabled={
                      !getNativeAPI()
                        ?.setAirDropEnabled
                    }
                    whileHover={{
                      backgroundColor:
                        'rgba(255,255,255,0.07)',
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={() =>
                      void handleAirDropToggle()
                    }
                    className="flex w-full items-center gap-2.5 rounded-2xl p-2 text-left disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div
                      className={`
                        flex h-9 w-9 shrink-0 items-center justify-center
                        rounded-full
                        ${
                          settings.airDropEnabled
                            ? 'bg-sky-500 text-white'
                            : 'bg-white/[0.08] text-white/40'
                        }
                      `}
                    >
                      <Radio className="h-[17px] w-[17px]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[11px] font-bold">
                        AirDrop
                      </div>

                      <div className="mt-0.5 truncate text-[9px] text-white/40">
                        {getNativeAPI()
                          ?.setAirDropEnabled
                          ? settings.airDropEnabled
                            ? 'Available'
                            : 'Off'
                          : 'Not available'}
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-2.5">
                  {/* Focus */}
                  <motion.button
                    type="button"
                    whileTap={{
                      scale: 0.97,
                    }}
                    onClick={() =>
                      void handleFocusToggle()
                    }
                    className={`
                      flex min-h-[76px] items-center gap-2.5
                      rounded-[22px]
                      border p-3 text-left
                      transition-colors
                      ${
                        settings.doNotDisturb
                          ? 'border-purple-400/30 bg-purple-500/20'
                          : 'border-white/[0.08] bg-white/[0.045]'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                        ${
                          settings.doNotDisturb
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-white/[0.08] text-white/50'
                        }
                      `}
                    >
                      <Moon className="h-4 w-4" />
                    </div>

                    <div>
                      <div className="text-[11px] font-bold">
                        Focus
                      </div>

                      <div className="mt-0.5 text-[9px] text-white/40">
                        {settings.doNotDisturb
                          ? 'Do Not Disturb'
                          : 'Off'}
                      </div>
                    </div>
                  </motion.button>

                  {/* Night / Light */}
                  <div className="grid flex-1 grid-cols-2 gap-2.5">
                    <motion.button
                      type="button"
                      whileHover={{
                        y: -2,
                      }}
                      whileTap={{
                        scale: 0.96,
                      }}
                      onClick={
                        toggleNightShift
                      }
                      className={`
                        flex min-h-[92px] flex-col items-center justify-center
                        rounded-[22px]
                        border
                        ${
                          settings.nightShift
                            ? 'border-amber-400/30 bg-amber-400/15'
                            : 'border-white/[0.08] bg-white/[0.045]'
                        }
                      `}
                    >
                      <Eye
                        className={`mb-2 h-5 w-5 ${
                          settings.nightShift
                            ? 'text-amber-300'
                            : 'text-white/65'
                        }`}
                      />

                      <span className="text-[10px] font-semibold">
                        Night Shift
                      </span>
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{
                        y: -2,
                      }}
                      whileTap={{
                        scale: 0.96,
                      }}
                      onClick={toggleTheme}
                      className="flex min-h-[92px] flex-col items-center justify-center rounded-[22px] border border-white/[0.08] bg-white/[0.045]"
                    >
                      {isLight ? (
                        <Moon className="mb-2 h-5 w-5 text-indigo-300" />
                      ) : (
                        <Sun className="mb-2 h-5 w-5 text-amber-300" />
                      )}

                      <span className="text-[10px] font-semibold">
                        {isLight
                          ? 'Dark'
                          : 'Light'}
                      </span>
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* =================================================
                  ERROR
              ================================================= */}

              <AnimatePresence>
                {connectivityError && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      y: -5,
                    }}
                    className="px-3.5 pt-2.5"
                  >
                    <div className="flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-[9px] leading-4 text-red-200">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                      <span className="flex-1">
                        {connectivityError}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setConnectivityError(
                            ''
                          )
                        }
                        className="text-white/40 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* =================================================
                  BRIGHTNESS
              ================================================= */}

              <div className="px-3.5 pt-2.5">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.045] p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-300" />

                      <span className="text-[11px] font-bold">
                        Display Brightness
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-white/50">
                      {Math.round(
                        settings.brightness
                      )}
                      %
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={
                      settings.brightness
                    }
                    onChange={event => {
                      void handleBrightnessChange(
                        Number(
                          event.target.value
                        )
                      );
                    }}
                    className="control-slider w-full"
                    style={
                      {
                        '--value': `${settings.brightness}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              {/* =================================================
                  VOLUME
              ================================================= */}

              <div className="px-3.5 pt-2.5">
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.045] p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {settings.soundVolume >
                      0 ? (
                        <Volume2 className="h-4 w-4 text-sky-400" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-red-400" />
                      )}

                      <span className="text-[11px] font-bold">
                        Sound Volume
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-white/50">
                      {Math.round(
                        settings.soundVolume *
                          100
                      )}
                      %
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={
                      settings.soundVolume
                    }
                    onChange={event => {
                      void handleVolumeChange(
                        Number(
                          event.target.value
                        )
                      );
                    }}
                    className="control-slider w-full"
                    style={
                      {
                        '--value': `${
                          settings.soundVolume *
                          100
                        }%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>

              {/* =================================================
                  MEDIA
              ================================================= */}

              <div className="px-3.5 pt-2.5">
                <motion.div
                  whileHover={{
                    y: -1,
                  }}
                  className="flex items-center gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.045] p-3"
                >
                  <motion.img
                    whileHover={{
                      scale: 1.05,
                    }}
                    src={
                      currentTrack.coverUrl
                    }
                    alt={
                      currentTrack.title
                    }
                    className="h-11 w-11 rounded-xl object-cover shadow-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold">
                      {currentTrack.title}
                    </div>

                    <div className="mt-0.5 truncate text-[9px] text-white/40">
                      {currentTrack.artist}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <IconButton
                      onClick={prevTrack}
                      className="h-8 w-8 text-white/65 hover:bg-white/10 hover:text-white"
                      title="Previous"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </IconButton>

                    <motion.button
                      type="button"
                      whileHover={{
                        scale: 1.08,
                      }}
                      whileTap={{
                        scale: 0.9,
                      }}
                      onClick={
                        togglePlayMusic
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.13] text-white shadow-lg"
                    >
                      {isPlayingMusic ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                      )}
                    </motion.button>

                    <IconButton
                      onClick={nextTrack}
                      className="h-8 w-8 text-white/65 hover:bg-white/10 hover:text-white"
                      title="Next"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                </motion.div>
              </div>

              {/* =================================================
                  QUICK ACTIONS
              ================================================= */}

              <div className="px-3.5 pb-3.5 pt-2.5">
                <div className="grid grid-cols-5 gap-2 border-t border-white/[0.07] pt-3">
                  {/* Capture */}
                  <motion.button
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    onClick={() => {
                      openApp(
                        'screenshot'
                      );

                      closeControlCenter();
                    }}
                    className="flex min-h-[58px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] hover:bg-white/[0.09]"
                  >
                    <Camera className="mb-1 h-4 w-4 text-purple-300" />

                    <span className="text-[9px]">
                      Capture
                    </span>
                  </motion.button>

                  {/* Universal Share */}
                  <motion.button
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    onClick={() => {
                      openApp('universalshare');
                      closeControlCenter();
                    }}
                    aria-label="Open Universal Share"
                    title="Universal Share"
                    className="flex min-h-[58px] flex-col items-center justify-center rounded-2xl border border-cyan-300/10 bg-cyan-500/[0.09] text-cyan-100 hover:bg-cyan-500/[0.16]"
                  >
                    <Share2 className="mb-1 h-4 w-4 text-cyan-300" />

                    <span className="whitespace-nowrap text-[8px]">
                      Universal Share
                    </span>
                  </motion.button>

                  {/* Lock */}
                  <motion.button
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    onClick={() => {
                      lockSystem();
                    }}
                    className="flex min-h-[58px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] hover:bg-white/[0.09]"
                  >
                    <Lock className="mb-1 h-4 w-4 text-amber-300" />

                    <span className="text-[9px]">
                      Lock
                    </span>
                  </motion.button>

                  {/* Settings */}
                  <motion.button
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    onClick={() => {
                      openApp(
                        'settings'
                      );

                      closeControlCenter();
                    }}
                    className="flex min-h-[58px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.05] hover:bg-white/[0.09]"
                  >
                    <Settings className="mb-1 h-4 w-4 text-sky-300" />

                    <span className="text-[9px]">
                      Settings
                    </span>
                  </motion.button>

                  {/* Power */}
                  <motion.button
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    onClick={() => {
                      setShowPowerDialog(
                        true
                      );

                      closeControlCenter();
                    }}
                    className="flex min-h-[58px] flex-col items-center justify-center rounded-2xl border border-red-300/10 bg-red-500/[0.13] text-red-200 hover:bg-red-500/[0.2]"
                  >
                    <Power className="mb-1 h-4 w-4 text-red-400" />

                    <span className="text-[9px]">
                      Power
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* =================================================
                WIFI SHEET
            ================================================= */}

            <AnimatePresence>
              {activeSheet ===
                'wifi' && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 35,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: 35,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                  }}
                  className="absolute inset-0 z-20 overflow-hidden rounded-[28px] bg-[#101923]/[0.98] backdrop-blur-3xl"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-4">
                    <IconButton
                      onClick={() =>
                        setActiveSheet(null)
                      }
                      className="h-8 w-8 bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </IconButton>

                    <div className="flex-1">
                      <div className="text-[13px] font-bold">
                        Wi-Fi
                      </div>

                      <div className="text-[9px] text-white/40">
                        {wifiConnected
                          ? connectivity?.wifi
                              .ssid ||
                            'Connected'
                          : wifiEnabled
                            ? 'Not connected'
                            : 'Wi-Fi is off'}
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.92,
                      }}
                      onClick={() =>
                        void handleRadioToggle(
                          'wifi'
                        )
                      }
                      disabled={
                        radioAction !==
                          null ||
                        connectivity?.wifi
                          .enabled ==
                          null
                      }
                      className={`
                        relative h-6 w-11 rounded-full
                        ${
                          wifiEnabled
                            ? 'bg-sky-500'
                            : 'bg-white/[0.12]'
                        }
                      `}
                    >
                      <motion.div
                        animate={{
                          x: wifiEnabled
                            ? 20
                            : 2,
                        }}
                        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-md"
                      />
                    </motion.button>
                  </div>

                  {/* Current Network */}
                  {wifiConnected && (
                    <div className="px-3.5 pt-3">
                      <div className="rounded-2xl border border-sky-400/20 bg-sky-400/[0.08] p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-white">
                            <Wifi className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-bold">
                              {connectivity?.wifi
                                .ssid ||
                                'Connected network'}
                            </div>

                            <div className="mt-0.5 text-[9px] text-sky-300/70">
                              Connected
                            </div>
                          </div>

                          {getNativeAPI()
                            ?.disconnectWifi && (
                            <button
                              type="button"
                              onClick={() =>
                                void handleWifiDisconnect()
                              }
                              className="rounded-lg bg-white/[0.08] px-2 py-1.5 text-[8px] font-semibold text-white/60 hover:bg-white/[0.12]"
                            >
                              Disconnect
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scan */}
                  <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <div className="text-[10px] font-semibold text-white/50">
                      Nearby Networks
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.92,
                      }}
                      onClick={() =>
                        void scanWifiNetworks()
                      }
                      disabled={
                        !wifiEnabled ||
                        isWifiScanning
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-white/[0.07] px-2.5 py-1.5 text-[9px] font-semibold text-white/70 hover:bg-white/[0.11] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isWifiScanning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}

                      {isWifiScanning
                        ? 'Scanning'
                        : 'Scan'}
                    </motion.button>
                  </div>

                  {/* Network List */}
                  <div className="max-h-[330px] overflow-y-auto px-3.5 pb-4">
                    {!wifiEnabled ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
                          <WifiOff className="h-6 w-6 text-white/30" />
                        </div>

                        <div className="text-[11px] font-semibold">
                          Wi-Fi is turned off
                        </div>

                        <div className="mt-1 max-w-[220px] text-[9px] leading-4 text-white/35">
                          Turn Wi-Fi on to search for nearby networks.
                        </div>
                      </div>
                    ) : wifiNetworks.length ===
                      0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <motion.div
                          animate={
                            isWifiScanning
                              ? {
                                  rotate: 360,
                                }
                              : {}
                          }
                          transition={{
                            duration: 1.2,
                            repeat:
                              isWifiScanning
                                ? Infinity
                                : 0,
                            ease: 'linear',
                          }}
                          className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/[0.08]"
                        >
                          {isWifiScanning ? (
                            <Loader2 className="h-6 w-6 text-sky-400" />
                          ) : (
                            <Search className="h-6 w-6 text-sky-400/60" />
                          )}
                        </motion.div>

                        <div className="text-[11px] font-semibold">
                          {isWifiScanning
                            ? 'Searching nearby networks...'
                            : 'No networks scanned'}
                        </div>

                        <div className="mt-1 max-w-[220px] text-[9px] leading-4 text-white/35">
                          {isWifiScanning
                            ? 'Looking for available Wi-Fi networks.'
                            : 'Press Scan to search for networks around you.'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {wifiNetworks.map(
                          (
                            network,
                            index
                          ) => {
                            const SignalIcon =
                              getWifiSignalIcon(
                                network.signal
                              );

                            const connecting =
                              isWifiConnecting ===
                              network.ssid;

                            return (
                              <motion.button
                                key={`${network.ssid}-${index}`}
                                type="button"
                                initial={{
                                  opacity: 0,
                                  y: 8,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  delay:
                                    index *
                                    0.025,
                                }}
                                whileHover={{
                                  x: 2,
                                  backgroundColor:
                                    'rgba(255,255,255,0.07)',
                                }}
                                whileTap={{
                                  scale: 0.985,
                                }}
                                disabled={
                                  network.connected ||
                                  connecting ||
                                  !network.saved ||
                                  !getNativeAPI()
                                    ?.connectWifi
                                }
                                title={!network.saved && !network.connected
                                  ? 'Connect to this network in Windows Wi-Fi settings to save its profile.'
                                  : undefined}
                                onClick={() =>
                                  void handleWifiConnect(
                                    network
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-left disabled:cursor-default"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                                  <SignalIcon className="h-4 w-4 text-white/65" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-[10px] font-semibold">
                                      {
                                        network.ssid
                                      }
                                    </span>

                                    {network.connected && (
                                      <Check className="h-3 w-3 shrink-0 text-sky-400" />
                                    )}
                                  </div>

                                  <div className="mt-0.5 text-[8px] text-white/30">
                                    {network.connected
                                      ? network.security || 'Connected network'
                                      : network.saved
                                        ? `${network.security || 'Network'} · Saved`
                                        : `${network.security || 'Network'} · Not saved in Windows`}
                                  </div>
                                </div>

                                {connecting ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                                ) : network.connected ? (
                                  <span className="text-[8px] font-semibold text-sky-400">
                                    Connected
                                  </span>
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                                )}
                              </motion.button>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* =================================================
                BLUETOOTH SHEET
            ================================================= */}

            <AnimatePresence>
              {activeSheet ===
                'bluetooth' && (
                <motion.div
                  initial={{
                    opacity: 0,
                    x: 35,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: 35,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 32,
                  }}
                  className="absolute inset-0 z-20 overflow-hidden rounded-[28px] bg-[#101923]/[0.98] backdrop-blur-3xl"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-4">
                    <IconButton
                      onClick={() =>
                        setActiveSheet(null)
                      }
                      className="h-8 w-8 bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </IconButton>

                    <div className="flex-1">
                      <div className="text-[13px] font-bold">
                        Bluetooth
                      </div>

                      <div className="text-[9px] text-white/40">
                        {bluetoothConnected
                          ? connectedBluetoothName || 'Connected'
                          : bluetoothEnabled
                            ? 'Ready to connect'
                            : 'Bluetooth is off'}
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      whileTap={{
                        scale: 0.92,
                      }}
                      onClick={() =>
                        void handleRadioToggle(
                          'bluetooth'
                        )
                      }
                      disabled={
                        radioAction !==
                          null ||
                        connectivity?.bluetooth
                          .enabled ==
                          null
                      }
                      className={`
                        relative h-6 w-11 rounded-full
                        ${
                          bluetoothEnabled
                            ? 'bg-indigo-500'
                            : 'bg-white/[0.12]'
                        }
                      `}
                    >
                      <motion.div
                        animate={{
                          x: bluetoothEnabled
                            ? 20
                            : 2,
                        }}
                        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-md"
                      />
                    </motion.button>
                  </div>

                  {/* Connected */}
                  {bluetoothConnected && (
                    <div className="px-3.5 pt-3">
                      <div className="rounded-2xl border border-indigo-400/20 bg-indigo-400/[0.08] p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white">
                            <Bluetooth className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-bold">
                              {connectedBluetoothName || 'Bluetooth device'}
                            </div>

                            <div className="mt-0.5 text-[9px] text-indigo-300/70">
                              Connected
                            </div>
                          </div>

                          <Check className="h-4 w-4 text-indigo-300" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scan Header */}
                  <div className="flex items-center justify-between px-4 pb-2 pt-4">
                    <div>
                      <div className="text-[10px] font-semibold text-white/50">
                        Nearby Devices
                      </div>

                      <div className="mt-0.5 text-[8px] text-white/25">
                        Discover Bluetooth devices
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <motion.button
                        type="button"
                        whileTap={{
                          scale: 0.92,
                        }}
                        onClick={() =>
                          void handleBluetoothScan()
                        }
                        disabled={
                          !bluetoothEnabled
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-500/[0.15] px-2.5 py-1.5 text-[9px] font-semibold text-indigo-300 hover:bg-indigo-500/[0.22] disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {isBluetoothScanning ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Search className="h-3 w-3" />
                        )}

                        {isBluetoothScanning
                          ? 'Scanning'
                          : 'Scan'}
                      </motion.button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                          setConnectivityError('');
                          void getNativeAPI()?.openBluetoothSettings?.().catch(error => {
                            setConnectivityError(
                              error instanceof Error
                                ? error.message
                                : 'Unable to open Windows Bluetooth settings.',
                            );
                          });
                        }}
                        disabled={!getNativeAPI()?.openBluetoothSettings}
                        title="Pair Bluetooth audio and classic devices in Windows"
                        className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1.5 text-[9px] font-semibold text-white/55 hover:bg-white/[0.1] disabled:opacity-30"
                      >
                        <Settings className="h-3 w-3" />
                        Pair classic
                      </motion.button>
                    </div>
                  </div>

                  {/* Devices */}
                  <div className="max-h-[370px] overflow-y-auto px-3.5 pb-4">
                    {!bluetoothEnabled ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
                          <Bluetooth className="h-6 w-6 text-white/30" />
                        </div>

                        <div className="text-[11px] font-semibold">
                          Bluetooth is off
                        </div>

                        <div className="mt-1 max-w-[220px] text-[9px] leading-4 text-white/35">
                          Turn Bluetooth on to discover nearby devices.
                        </div>
                      </div>
                    ) : nearbyDevices.length ===
                      0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <motion.div
                          animate={
                            isBluetoothScanning
                              ? {
                                  scale: [
                                    1,
                                    1.08,
                                    1,
                                  ],
                                }
                              : {}
                          }
                          transition={{
                            duration: 1.2,
                            repeat:
                              isBluetoothScanning
                                ? Infinity
                                : 0,
                          }}
                          className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/[0.08]"
                        >
                          <Bluetooth className="h-6 w-6 text-indigo-400" />
                        </motion.div>

                        <div className="text-[11px] font-semibold">
                          {isBluetoothScanning
                            ? 'Searching for devices...'
                            : 'No nearby devices'}
                        </div>

                        <div className="mt-1 max-w-[220px] text-[9px] leading-4 text-white/35">
                          {isBluetoothScanning
                            ? 'Keep your Bluetooth device nearby and discoverable.'
                            : 'Press Scan to discover nearby Bluetooth devices.'}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {nearbyDevices.map(
                          (
                            device,
                            index
                          ) => {
                            const DeviceIcon =
                              getBluetoothDeviceIcon(
                                device.deviceName
                              );

                            return (
                              <motion.button
                                key={
                                  device.deviceId
                                }
                                type="button"
                                initial={{
                                  opacity: 0,
                                  y: 8,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                transition={{
                                  delay:
                                    index *
                                    0.035,
                                }}
                                whileHover={{
                                  x: 2,
                                  backgroundColor:
                                    'rgba(255,255,255,0.07)',
                                }}
                                whileTap={{
                                  scale: 0.985,
                                }}
                                onClick={() =>
                                  void handleBluetoothDevice(
                                    device
                                  )
                                }
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
                                  <DeviceIcon className="h-4 w-4 text-indigo-300" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-[10px] font-semibold">
                                    {
                                      device.deviceName
                                    }
                                  </div>

                                  <div className="mt-0.5 text-[8px] text-white/30">
                                    {device.connected
                                      ? 'Connected'
                                      : device.paired
                                        ? 'Paired'
                                        : 'Nearby'}
                                  </div>
                                </div>

                                {device.connected ? (
                                  <Check className="h-4 w-4 text-indigo-300" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-white/20" />
                                )}
                              </motion.button>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ControlCenter;