// import React, {
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from 'react';

// import {
//   User,
//   Palette,
//   Image as ImageIcon,
//   Monitor,
//   Layout,
//   Volume2,
//   Wifi,
//   Bluetooth,
//   Moon,
//   Battery,
//   Info,
//   Check,
//   Upload,
//   RefreshCw,
//   Camera,
//   Trash2,
//   Signal,
//   Globe2,
//   ShieldCheck,
//   Bell,
//   BellOff,
//   Zap,
//   BatteryCharging,
//   Power,
//   Laptop,
//   Smartphone,
//   Search,
//   ChevronRight,
//   Sparkles,
//   SlidersHorizontal,
//   Sun,
//   Lock,
//   UserRound,
//   CheckCircle2,
//   Circle,
//   Gauge,
//   Network,
//   Headphones,
//   Keyboard,
//   Cpu,
//   HardDrive,
//   MemoryStick,
//   Shield,
//   ExternalLink,
//   RotateCcw,
//   MonitorSmartphone,
//   VolumeX,
//   WifiOff,
//   BluetoothOff,
//   X,
//   Save,
// } from 'lucide-react';

// import { motion, AnimatePresence } from 'motion/react';

// import { useOS } from '../../context/OSContext';
// import { WALLPAPERS } from '../../data/wallpapers';
// import {
//   AccentColor,
//   ThemeMode,
//   Wallpaper,
// } from '../../types/desktop';
// import { sound } from '../../services/soundService';
import {
  applyUITheme,
  clearUITheme,
  getStoredUITheme,
  persistAndApplyUITheme,
  resetUIThemeToOriginal,
  UI_THEMES,
  UITheme,
} from '../../services/uiTheme';

// /* ============================================================
//    TYPES
// ============================================================ */

// type SettingsTab =
//   | 'profile'
//   | 'appearance'
//   | 'wallpaper'
//   | 'dock'
//   | 'displays'
//   | 'sound'
//   | 'wifi'
//   | 'bluetooth'
//   | 'focus'
//   | 'battery'
//   | 'about';

// interface PhotoLibraryItem {
//   id: string;
//   name: string;
//   url: string;
//   thumbnail: string;
//   createdAt: string;
//   source: string;
// }

// /* ============================================================
//    CONSTANTS
// ============================================================ */

// const PHOTO_LIBRARY_KEY = 'abhishek-os-photos';


// interface BatteryManager extends EventTarget {
//   charging: boolean;
//   level: number;
//   chargingTime: number;
//   dischargingTime: number;
// }


// const ACCENTS: {
//   id: AccentColor;
//   label: string;
//   color: string;
// }[] = [
//   {
//     id: 'blue',
//     label: 'Blue',
//     color: '#3b82f6',
//   },
//   {
//     id: 'purple',
//     label: 'Purple',
//     color: '#a855f7',
//   },
//   {
//     id: 'pink',
//     label: 'Pink',
//     color: '#ec4899',
//   },
//   {
//     id: 'orange',
//     label: 'Orange',
//     color: '#f97316',
//   },
//   {
//     id: 'green',
//     label: 'Green',
//     color: '#22c55e',
//   },
//   {
//     id: 'cyan',
//     label: 'Cyan',
//     color: '#06b6d4',
//   },
// ];

// const NAV_ITEMS: {
//   id: SettingsTab;
//   label: string;
//   icon: React.ElementType;
//   description: string;
// }[] = [
//   {
//     id: 'profile',
//     label: 'User Profile',
//     icon: User,
//     description: 'Account, avatar and personal details',
//   },
//   {
//     id: 'appearance',
//     label: 'Appearance',
//     icon: Palette,
//     description: 'Theme, colors and visual effects',
//   },
//   {
//     id: 'wallpaper',
//     label: 'Wallpaper',
//     icon: ImageIcon,
//     description: 'Desktop wallpapers and photos',
//   },
//   {
//     id: 'dock',
//     label: 'Dock & Menu Bar',
//     icon: Layout,
//     description: 'Dock and menu bar behavior',
//   },
//   {
//     id: 'displays',
//     label: 'Displays',
//     icon: Monitor,
//     description: 'Brightness and Night Shift',
//   },
//   {
//     id: 'sound',
//     label: 'Sound',
//     icon: Volume2,
//     description: 'Volume and system sounds',
//   },
//   {
//     id: 'wifi',
//     label: 'Wi-Fi & Network',
//     icon: Wifi,
//     description: 'Wireless networks',
//   },
//   {
//     id: 'bluetooth',
//     label: 'Bluetooth',
//     icon: Bluetooth,
//     description: 'Connected devices',
//   },
//   {
//     id: 'focus',
//     label: 'Focus & Notifications',
//     icon: Moon,
//     description: 'Focus and alerts',
//   },
//   {
//     id: 'battery',
//     label: 'Battery',
//     icon: Battery,
//     description: 'Power and battery',
//   },
//   {
//     id: 'about',
//     label: 'About ARLO OS',
//     icon: Info,
//     description: 'System information',
//   },
// ];

// /* ============================================================
//    HELPERS
// ============================================================ */

// const getPhotoLibrary = (): PhotoLibraryItem[] => {
//   try {
//     const raw = localStorage.getItem(PHOTO_LIBRARY_KEY);

//     if (!raw) {
//       return [];
//     }

//     const parsed = JSON.parse(raw);

//     return Array.isArray(parsed) ? parsed : [];
//   } catch {
//     return [];
//   }
// };

// const savePhotoToLibrary = (
//   item: PhotoLibraryItem,
// ) => {
//   try {
//     const existing = getPhotoLibrary();

//     const updated = [
//       item,
//       ...existing.filter(photo => photo.id !== item.id),
//     ];

//     localStorage.setItem(
//       PHOTO_LIBRARY_KEY,
//       JSON.stringify(updated),
//     );

//     window.dispatchEvent(
//       new CustomEvent('abhishek-os-photos-updated', {
//         detail: item,
//       }),
//     );
//   } catch {
//     // Ignore storage failures.
//   }
// };

// const formatFileName = (name: string) => {
//   const cleaned = name
//     .replace(/\.[^/.]+$/, '')
//     .replace(/[-_]+/g, ' ')
//     .trim();

//   return cleaned || 'Custom Wallpaper';
// };

// /* ============================================================
//    ANIMATION
// ============================================================ */

// const pageVariants = {
//   initial: {
//     opacity: 0,
//     y: 12,
//     scale: 0.985,
//   },
//   animate: {
//     opacity: 1,
//     y: 0,
//     scale: 1,
//     transition: {
//       duration: 0.32,
//       ease: [0.22, 1, 0.36, 1],
//     },
//   },
//   exit: {
//     opacity: 0,
//     y: -8,
//     scale: 0.99,
//     transition: {
//       duration: 0.18,
//     },
//   },
// };

// const cardHover = {
//   y: -3,
//   scale: 1.005,
//   transition: {
//     duration: 0.22,
//     ease: [0.22, 1, 0.36, 1],
//   },
// };

// /* ============================================================
//    TOGGLE
// ============================================================ */

// const Toggle: React.FC<{
//   enabled: boolean;
//   onChange: () => void;
//   accent?: 'blue' | 'green' | 'amber' | 'purple';
// }> = ({
//   enabled,
//   onChange,
//   accent = 'blue',
// }) => {
//   const backgroundClass =
//     accent === 'green'
//       ? 'bg-emerald-500'
//       : accent === 'amber'
//         ? 'bg-amber-500'
//         : accent === 'purple'
//           ? 'bg-purple-500'
//           : 'bg-sky-500';

//   return (
//     <motion.button
//       type="button"
//       onClick={onChange}
//       aria-pressed={enabled}
//       whileTap={{ scale: 0.9 }}
//       className={`
//         w-12 h-7 rounded-full
//         transition-colors relative p-1 shrink-0
//         border border-white/10
//         shadow-inner
//         ${
//           enabled
//             ? backgroundClass
//             : 'bg-white/15'
//         }
//       `}
//     >
//       <motion.div
//         layout
//         transition={{
//           type: 'spring',
//           stiffness: 500,
//           damping: 30,
//         }}
//         className={`
//           w-5 h-5 rounded-full
//           bg-white
//           shadow-lg
//           ${
//             enabled
//               ? 'ml-5'
//               : 'ml-0'
//           }
//         `}
//       />
//     </motion.button>
//   );
// };

// /* ============================================================
//    SETTING ROW
// ============================================================ */

// const SettingRow: React.FC<{
//   icon: React.ElementType;
//   title: string;
//   description: string;
//   children: React.ReactNode;
// }> = ({
//   icon: Icon,
//   title,
//   description,
//   children,
// }) => {
//   return (
//     <motion.div
//       whileHover={{
//         backgroundColor:
//           'rgba(255,255,255,0.025)',
//       }}
//       className="
//         flex items-center justify-between
//         gap-4 py-4
//         border-b border-white/10
//         last:border-b-0
//         rounded-xl px-2
//       "
//     >
//       <div className="flex items-start gap-3 min-w-0">
//         <div
//           className="
//             w-10 h-10 rounded-xl
//             bg-gradient-to-br
//             from-white/15 to-white/5
//             border border-white/10
//             flex items-center justify-center
//             shrink-0 shadow-lg
//           "
//         >
//           <Icon className="w-4 h-4 text-sky-400" />
//         </div>

//         <div className="min-w-0">
//           <div className="font-semibold text-xs text-white">
//             {title}
//           </div>

//           <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
//             {description}
//           </div>
//         </div>
//       </div>

//       {children}
//     </motion.div>
//   );
// };

// /* ============================================================
//    SECTION CARD
// ============================================================ */

// const SectionCard: React.FC<{
//   children: React.ReactNode;
//   className?: string;
// }> = ({
//   children,
//   className = '',
// }) => {
//   return (
//     <motion.div
//       whileHover={cardHover}
//       className={`
//         relative overflow-hidden
//         rounded-3xl
//         bg-gradient-to-br
//         from-white/[0.09]
//         via-white/[0.045]
//         to-white/[0.025]
//         border border-white/10
//         shadow-2xl
//         backdrop-blur-2xl
//         ${className}
//       `}
//     >
//       <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

//       <div className="relative">
//         {children}
//       </div>
//     </motion.div>
//   );
// };

// /* ============================================================
//    HEADER
// ============================================================ */

// const PageHeader: React.FC<{
//   title: string;
//   description: string;
//   icon?: React.ElementType;
// }> = ({
//   title,
//   description,
//   icon: Icon,
// }) => {
//   return (
//     <div className="flex items-start gap-4">
//       {Icon && (
//         <motion.div
//           initial={{
//             rotate: -8,
//             scale: 0.8,
//           }}
//           animate={{
//             rotate: 0,
//             scale: 1,
//           }}
//           className="
//             w-12 h-12
//             rounded-2xl
//             bg-gradient-to-br
//             from-sky-400
//             via-blue-500
//             to-indigo-600
//             flex items-center justify-center
//             shadow-xl
//             shadow-sky-500/20
//             shrink-0
//           "
//         >
//           <Icon className="w-5 h-5 text-white" />
//         </motion.div>
//       )}

//       <div>
//         <h2 className="text-2xl font-black tracking-tight text-white">
//           {title}
//         </h2>

//         <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
//           {description}
//         </p>
//       </div>
//     </div>
//   );
// };

// /* ============================================================
//    SETTINGS APP
// ============================================================ */

// export const SettingsApp: React.FC = () => {
//   const {
//     user,
//     updateUser,
//     settings,
//     updateSettings,
//     setShowControlCenter,
//     currentWallpaper,
//     setWallpaper,
//   } = useOS();

//   const avatarInputRef =
//     useRef<HTMLInputElement | null>(null);

//   const wallpaperInputRef =
//     useRef<HTMLInputElement | null>(null);

//   const [activeTab, setActiveTab] =
//     useState<SettingsTab>('profile');

//   const [search, setSearch] =
//     useState('');

//   const wifiEnabled = settings.wifiEnabled;
//   const wifiNetwork = settings.wifiNetwork;
//   const bluetoothEnabled = settings.bluetoothEnabled;
//   const [radioError, setRadioError] = useState('');
//   const [radioBusy, setRadioBusy] = useState(false);

//   const [focusEnabled, setFocusEnabled] =
//     useState(false);

//   const [allowCalls, setAllowCalls] =
//     useState(true);

//   const [allowRepeatedCalls, setAllowRepeatedCalls] =
//     useState(false);

//   const [scheduledFocus, setScheduledFocus] =
//     useState(false);

//   // const [batteryPercentage, setBatteryPercentage] =
//   //   useState(94);

//   const [lowPowerMode, setLowPowerMode] =
//     useState(false);

//   const toggleHostRadio = async (radio: 'wifi' | 'bluetooth') => {
//     if (radioBusy) return;
//     setRadioBusy(true);
//     setRadioError('');
//     sound.playToggle(radio === 'wifi' ? !wifiEnabled : !bluetoothEnabled);
//     try {
//       const state = radio === 'wifi'
//         ? await window.electronAPI?.setWifiEnabled(!wifiEnabled)
//         : await window.electronAPI?.setBluetoothEnabled(!bluetoothEnabled);
//       if (state) {
//         updateSettings({
//           wifiEnabled: state.wifi.enabled ?? false,
//           wifiConnected: state.wifi.connected ?? false,
//           wifiNetwork: state.wifi.connected && state.wifi.ssid
//             ? state.wifi.ssid
//             : state.wifi.enabled === true
//               ? 'Not connected'
//               : state.wifi.enabled === false
//                 ? 'Off'
//                 : 'Unavailable',
//           bluetoothEnabled: state.bluetooth.enabled ?? false,
//           bluetoothConnected: state.bluetooth.connected ?? false,
//           bluetoothDeviceName: state.bluetooth.deviceName || '',
//         });
//       }
//     } catch {
//       setRadioError(`Windows could not change ${radio === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}. Approve the Windows administrator prompt; if cancelled, no change was made.`);
//     } finally {
//       setRadioBusy(false);
//     }
//   };

//   const [optimizedCharging, setOptimizedCharging] =
//     useState(true);

//   const [photoCount, setPhotoCount] =
//     useState(0);

//   const [showMobileNav, setShowMobileNav] =
//     useState(false);

//   /* ==========================================================
//      LOAD PHOTO LIBRARY COUNT
//   ========================================================== */

//   useEffect(() => {
//     const updatePhotoCount = () => {
//       setPhotoCount(getPhotoLibrary().length);
//     };

//     updatePhotoCount();

//     window.addEventListener(
//       'abhishek-os-photos-updated',
//       updatePhotoCount,
//     );

//     return () => {
//       window.removeEventListener(
//         'abhishek-os-photos-updated',
//         updatePhotoCount,
//       );
//     };
//   }, []);

//   /* ==========================================================
//      FILTER SETTINGS
//   ========================================================== */

//   const filteredNavItems = useMemo(() => {
//     const query = search
//       .trim()
//       .toLowerCase();

//     if (!query) {
//       return NAV_ITEMS;
//     }

//     return NAV_ITEMS.filter(item =>
//       `${item.label} ${item.description}`
//         .toLowerCase()
//         .includes(query),
//     );
//   }, [search]);

//   /* ==========================================================
//      AVATAR
//   ========================================================== */

//   const handleAvatarUpload = (
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       sound.playClick();
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       sound.playClick();
//       return;
//     }

//     const reader = new FileReader();

//     reader.onload = () => {
//       if (typeof reader.result === 'string') {
//         updateUser({
//           avatarUrl: reader.result,
//         });

//         sound.playClick();
//       }
//     };

//     reader.onerror = () => {
//       sound.playClick();
//     };

//     reader.readAsDataURL(file);

//     e.target.value = '';
//   };

//   const handleRemoveAvatar = () => {
//     updateUser({
//       avatarUrl: '',
//     });

//     sound.playClick();
//   };

//   /* ==========================================================
//      CUSTOM WALLPAPER + PHOTOS LIBRARY
//   ========================================================== */

//   const handleCustomWallpaper = (
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];

//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       sound.playClick();
//       return;
//     }

//     if (file.size > 12 * 1024 * 1024) {
//       sound.playClick();
//       return;
//     }

//     const reader = new FileReader();

//     reader.onload = () => {
//       if (typeof reader.result !== 'string') {
//         return;
//       }

//       const imageUrl = reader.result;

//       const customWp: Wallpaper = {
//         id: `custom-${Date.now()}`,
//         name:
//           formatFileName(file.name) ||
//           'Custom Wallpaper',
//         url: imageUrl,
//         thumbnail: imageUrl,
//         category: 'custom',
//       };

//       /* Apply wallpaper */
//       setWallpaper(customWp);

//       /* Save to Photos */
//       const photo: PhotoLibraryItem = {
//         id: `settings-photo-${Date.now()}`,
//         name: formatFileName(file.name),
//         url: imageUrl,
//         thumbnail: imageUrl,
//         createdAt: new Date().toISOString(),
//         source: 'Settings • Custom Wallpaper',
//       };

//       savePhotoToLibrary(photo);

//       sound.playClick();
//     };

//     reader.onerror = () => {
//       sound.playClick();
//     };

//     reader.readAsDataURL(file);

//     e.target.value = '';
//   };

//   /* ==========================================================
//      NAVIGATION
//   ========================================================== */

//   const changeTab = (
//     tab: SettingsTab,
//   ) => {
//     setActiveTab(tab);
//     setShowMobileNav(false);
//     sound.playClick();
//   };

//   /* ==========================================================
//      HEADER
//   ========================================================== */

//   const currentNav = NAV_ITEMS.find(
//     item => item.id === activeTab,
//   );

//   /* ==========================================================
//      RENDER
//   ========================================================== */


//   const [batteryPercentage, setBatteryPercentage] = useState<number>( Math.max( 0, Math.min( 100, settings.batteryLevel ?? 0, ), ), ); const [batteryCharging, setBatteryCharging] = useState<boolean>( settings.batteryCharging ?? false, ); useEffect(() => { let batteryManager: BatteryManager | null = null; const updateBattery = () => { if (!batteryManager) return; const percentage = Math.round( batteryManager.level * 100, ); const charging = batteryManager.charging; setBatteryPercentage(percentage); setBatteryCharging(charging); updateSettings({ batteryLevel: percentage, batteryCharging: charging, }); }; const setupBattery = async () => { try { if ( typeof navigator === 'undefined' || !('getBattery' in navigator) ) { return; } batteryManager = await ( navigator as Navigator & { getBattery: () => Promise<BatteryManager>; } ).getBattery(); updateBattery(); batteryManager.addEventListener( 'levelchange', updateBattery, ); batteryManager.addEventListener( 'chargingchange', updateBattery, ); } catch (error) { console.warn( 'Unable to read real laptop battery:', error, ); } }; setupBattery(); return () => { if (!batteryManager) return; batteryManager.removeEventListener( 'levelchange', updateBattery, ); batteryManager.removeEventListener( 'chargingchange', updateBattery, ); }; }, [updateSettings]);

//   return (
//     <div
//       className="
//         flex-1
//         flex
//         h-full
//         min-h-0
//         bg-[#070b12]
//         select-none
//         overflow-hidden
//         text-white
//         relative
//       "
//     >
//       {/* ======================================================
//           AMBIENT 3D BACKGROUND
//       ====================================================== */}

//       <div className="absolute inset-0 pointer-events-none overflow-hidden">
//         <motion.div
//           animate={{
//             x: [0, 40, 0],
//             y: [0, -25, 0],
//             scale: [1, 1.08, 1],
//           }}
//           transition={{
//             duration: 12,
//             repeat: Infinity,
//             ease: 'easeInOut',
//           }}
//           className="
//             absolute
//             -top-32
//             -left-32
//             w-96
//             h-96
//             rounded-full
//             bg-sky-500/10
//             blur-3xl
//           "
//         />

//         <motion.div
//           animate={{
//             x: [0, -50, 0],
//             y: [0, 35, 0],
//           }}
//           transition={{
//             duration: 15,
//             repeat: Infinity,
//             ease: 'easeInOut',
//           }}
//           className="
//             absolute
//             -bottom-40
//             right-0
//             w-[500px]
//             h-[500px]
//             rounded-full
//             bg-indigo-600/10
//             blur-3xl
//           "
//         />

//         <div
//           className="
//             absolute inset-0
//             opacity-[0.025]
//             bg-[linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)]
//             bg-[size:40px_40px]
//           "
//         />
//       </div>

//       {/* ======================================================
//           MOBILE TOP BAR
//       ====================================================== */}

//       <div
//         className="
//           md:hidden
//           absolute
//           top-0
//           left-0
//           right-0
//           z-40
//           h-16
//           px-4
//           flex
//           items-center
//           justify-between
//           bg-black/40
//           backdrop-blur-2xl
//           border-b border-white/10
//         "
//       >
//         <button
//           type="button"
//           onClick={() =>
//             setShowMobileNav(prev => !prev)
//           }
//           className="
//             flex items-center gap-2
//             px-3 py-2
//             rounded-xl
//             bg-white/10
//             border border-white/10
//           "
//         >
//           <SlidersHorizontal className="w-4 h-4" />

//           <span className="text-xs font-semibold">
//             Settings
//           </span>
//         </button>

//         <div className="text-xs font-bold text-slate-300">
//           {currentNav?.label}
//         </div>
//       </div>

//       {/* ======================================================
//           SIDEBAR
//       ====================================================== */}

//       <aside
//         className={`
//           ${
//             showMobileNav
//               ? 'translate-x-0'
//               : '-translate-x-full md:translate-x-0'
//           }
//           fixed md:relative
//           z-50
//           md:z-10
//           top-0
//           bottom-0
//           left-0
//           w-72
//           md:w-64
//           shrink-0
//           border-r
//           border-white/10
//           bg-[#0b1018]/95
//           md:bg-white/[0.035]
//           backdrop-blur-3xl
//           p-4
//           flex
//           flex-col
//           transition-transform
//           duration-300
//           overflow-hidden
//         `}
//       >
//         {/* Sidebar title */}

//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <div className="text-lg font-black tracking-tight">
//               Settings
//             </div>

//             <div className="text-[10px] text-slate-500 mt-0.5">
//               ARLO OS
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={() =>
//               setShowMobileNav(false)
//             }
//             className="md:hidden w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>

//         {/* User mini profile */}

//         <motion.div
//           whileHover={{
//             scale: 1.02,
//             y: -1,
//           }}
//           className="
//             relative
//             p-3
//             rounded-2xl
//             bg-gradient-to-br
//             from-white/10
//             to-white/[0.035]
//             border border-white/10
//             mb-4
//             overflow-hidden
//           "
//         >
//           <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-sky-500/10 blur-2xl" />

//           <div className="relative flex items-center gap-3">
//             <div
//               className="
//                 w-11 h-11
//                 rounded-2xl
//                 overflow-hidden
//                 bg-gradient-to-br
//                 from-sky-500
//                 via-blue-600
//                 to-indigo-700
//                 flex
//                 items-center
//                 justify-center
//                 font-bold
//                 shadow-xl
//                 shadow-blue-500/20
//                 shrink-0
//               "
//             >
//               {user.avatarUrl ? (
//                 <img
//                   src={user.avatarUrl}
//                   alt="User"
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 user.fullName
//                   ?.charAt(0)
//                   ?.toUpperCase() || 'A'
//               )}
//             </div>

//             <div className="min-w-0">
//               <div className="font-bold text-xs truncate">
//                 {user.fullName}
//               </div>

//               <div className="text-[10px] text-slate-400 truncate mt-0.5">
//                 @{user.username}
//               </div>
//             </div>

//             <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
//           </div>
//         </motion.div>

//         {/* Search */}

//         <div className="relative mb-4">
//           <Search
//             className="
//               absolute
//               left-3
//               top-1/2
//               -translate-y-1/2
//               w-3.5
//               h-3.5
//               text-slate-500
//             "
//           />

//           <input
//             value={search}
//             onChange={e =>
//               setSearch(e.target.value)
//             }
//             placeholder="Search settings..."
//             className="
//               w-full
//               h-9
//               pl-9
//               pr-3
//               rounded-xl
//               bg-white/[0.06]
//               border border-white/10
//               outline-none
//               text-xs
//               text-white
//               placeholder:text-slate-600
//               focus:border-sky-400/50
//               transition-colors
//             "
//           />
//         </div>

//         {/* Navigation */}

//         <div className="flex-1 overflow-y-auto pr-1 space-y-1">
//           {filteredNavItems.map(item => {
//             const Icon = item.icon;
//             const isActive =
//               activeTab === item.id;

//             return (
//               <motion.button
//                 key={item.id}
//                 type="button"
//                 onClick={() =>
//                   changeTab(item.id)
//                 }
//                 whileHover={{
//                   x: 2,
//                 }}
//                 whileTap={{
//                   scale: 0.98,
//                 }}
//                 className={`
//                   relative
//                   w-full
//                   flex
//                   items-center
//                   gap-3
//                   px-3
//                   py-2.5
//                   rounded-xl
//                   text-left
//                   transition-all
//                   ${
//                     isActive
//                       ? 'text-white'
//                       : 'text-slate-400 hover:text-white'
//                   }
//                 `}
//               >
//                 {isActive && (
//                   <motion.div
//                     layoutId="settings-active"
//                     className="
//                       absolute
//                       inset-0
//                       rounded-xl
//                       bg-gradient-to-r
//                       from-sky-500
//                       to-blue-600
//                       shadow-lg
//                       shadow-sky-500/20
//                     "
//                     transition={{
//                       type: 'spring',
//                       stiffness: 400,
//                       damping: 30,
//                     }}
//                   />
//                 )}

//                 <div className="relative z-10 flex items-center gap-3 w-full">
//                   <Icon
//                     className={`
//                       w-4 h-4 shrink-0
//                       ${
//                         isActive
//                           ? 'text-white'
//                           : 'text-slate-500'
//                       }
//                     `}
//                   />

//                   <span className="truncate text-xs font-medium">
//                     {item.label}
//                   </span>

//                   {isActive && (
//                     <ChevronRight className="w-3.5 h-3.5 ml-auto" />
//                   )}
//                 </div>
//               </motion.button>
//             );
//           })}
//         </div>

//         {/* Footer */}

//         <div className="pt-4 mt-3 border-t border-white/10">
//           <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-600">
//             <Sparkles className="w-3 h-3" />
//             ARLO OS 1.0.0 Pro
//           </div>
//         </div>
//       </aside>

//       {/* Mobile backdrop */}

//       <AnimatePresence>
//         {showMobileNav && (
//           <motion.button
//             type="button"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() =>
//               setShowMobileNav(false)
//             }
//             className="
//               md:hidden
//               fixed
//               inset-0
//               z-40
//               bg-black/60
//               backdrop-blur-sm
//             "
//             aria-label="Close settings navigation"
//           />
//         )}
//       </AnimatePresence>

//       {/* ======================================================
//           MAIN CONTENT
//       ====================================================== */}

//       <main
//         className="
//           relative
//           flex-1
//           min-w-0
//           min-h-0
//           overflow-y-auto
//           pt-16
//           md:pt-0
//         "
//       >
//         <div
//           className="
//             max-w-5xl
//             mx-auto
//             px-4
//             sm:px-6
//             lg:px-10
//             py-6
//             md:py-8
//           "
//         >
//           <AnimatePresence mode="wait">
//             {/* =================================================
//                 PROFILE
//             ================================================= */}

//             {activeTab === 'profile' && (
//               <motion.div
//                 key="profile"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6"
//               >
//                 <PageHeader
//                   title="User Profile"
//                   description="Manage your ARLO OS identity, profile picture and personal information."
//                   icon={UserRound}
//                 />

//                 {/* Hero profile */}

//                 <SectionCard className="p-6">
//                   <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />

//                   <div className="relative flex flex-col lg:flex-row gap-8 items-center lg:items-start">
//                     <motion.div
//                       initial={{
//                         rotateY: -15,
//                         rotateX: 8,
//                       }}
//                       animate={{
//                         rotateY: 0,
//                         rotateX: 0,
//                       }}
//                       whileHover={{
//                         rotateY: 8,
//                         rotateX: -5,
//                         scale: 1.04,
//                       }}
//                       style={{
//                         transformStyle: 'preserve-3d',
//                       }}
//                       className="
//                         relative
//                         w-36
//                         h-36
//                         shrink-0
//                       "
//                     >
//                       <div
//                         className="
//                           absolute
//                           inset-2
//                           rounded-[2rem]
//                           bg-sky-500/30
//                           blur-2xl
//                         "
//                       />

//                       <div
//                         className="
//                           relative
//                           w-full
//                           h-full
//                           rounded-[2rem]
//                           overflow-hidden
//                           border
//                           border-white/20
//                           bg-gradient-to-br
//                           from-sky-500
//                           via-blue-600
//                           to-indigo-800
//                           shadow-2xl
//                         "
//                       >
//                         {user.avatarUrl ? (
//                           <img
//                             src={user.avatarUrl}
//                             alt="Profile"
//                             className="w-full h-full object-cover"
//                           />
//                         ) : (
//                           <div className="w-full h-full flex items-center justify-center text-6xl font-black">
//                             {user.fullName
//                               ?.charAt(0)
//                               ?.toUpperCase() || 'A'}
//                           </div>
//                         )}

//                         <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 pointer-events-none" />
//                       </div>

//                       <motion.button
//                         type="button"
//                         whileHover={{
//                           scale: 1.12,
//                           rotate: 5,
//                         }}
//                         whileTap={{
//                           scale: 0.9,
//                         }}
//                         onClick={() =>
//                           avatarInputRef.current?.click()
//                         }
//                         className="
//                           absolute
//                           -right-2
//                           -bottom-2
//                           w-11
//                           h-11
//                           rounded-2xl
//                           bg-sky-500
//                           border-4
//                           border-[#090e15]
//                           flex
//                           items-center
//                           justify-center
//                           shadow-xl
//                         "
//                       >
//                         <Camera className="w-4 h-4" />
//                       </motion.button>
//                     </motion.div>

//                     <div className="flex-1 min-w-0 text-center lg:text-left">
//                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[10px] font-bold mb-3">
//                         <CheckCircle2 className="w-3 h-3" />
//                         PERSONAL PROFILE
//                       </div>

//                       <h3 className="text-2xl font-black truncate">
//                         {user.displayName ||
//                           user.fullName ||
//                           'Abhishek'}
//                       </h3>

//                       <p className="text-xs text-slate-400 mt-1">
//                         @{user.username}
//                       </p>

//                       <p className="text-xs text-slate-300 mt-4 max-w-xl leading-relaxed">
//                         {user.bio ||
//                           'Create your personal identity inside ARLO OS.'}
//                       </p>

//                       <div className="flex flex-wrap gap-2 mt-5 justify-center lg:justify-start">
//                         <button
//                           type="button"
//                           onClick={() =>
//                             avatarInputRef.current?.click()
//                           }
//                           className="
//                             px-4
//                             py-2
//                             rounded-xl
//                             bg-sky-500
//                             hover:bg-sky-400
//                             text-xs
//                             font-bold
//                             flex
//                             items-center
//                             gap-2
//                             shadow-lg
//                             shadow-sky-500/20
//                             transition-colors
//                           "
//                         >
//                           <Upload className="w-3.5 h-3.5" />
//                           Change Picture
//                         </button>

//                         {user.avatarUrl && (
//                           <button
//                             type="button"
//                             onClick={handleRemoveAvatar}
//                             className="
//                               px-4
//                               py-2
//                               rounded-xl
//                               bg-rose-500/10
//                               border
//                               border-rose-400/20
//                               text-rose-300
//                               text-xs
//                               font-bold
//                               flex
//                               items-center
//                               gap-2
//                               hover:bg-rose-500/20
//                               transition-colors
//                             "
//                           >
//                             <Trash2 className="w-3.5 h-3.5" />
//                             Remove
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>

//                   <input
//                     ref={avatarInputRef}
//                     type="file"
//                     accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
//                     className="hidden"
//                     onChange={handleAvatarUpload}
//                   />
//                 </SectionCard>

//                 {/* Account details */}

//                 <SectionCard className="p-6">
//                   <div className="flex items-center gap-3 mb-5">
//                     <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
//                       <User className="w-4 h-4 text-sky-400" />
//                     </div>

//                     <div>
//                       <h3 className="font-bold text-sm">
//                         Personal Information
//                       </h3>

//                       <p className="text-[10px] text-slate-500">
//                         Update how your identity appears across the OS.
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                         Full Name
//                       </label>

//                       <input
//                         type="text"
//                         value={user.fullName}
//                         onChange={e =>
//                           updateUser({
//                             fullName: e.target.value,
//                           })
//                         }
//                         className="
//                           mt-2
//                           w-full
//                           p-3
//                           rounded-xl
//                           bg-black/20
//                           border border-white/10
//                           outline-none
//                           focus:border-sky-400/60
//                           text-sm
//                           text-white
//                         "
//                       />
//                     </div>

//                     <div>
//                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                         Display Name
//                       </label>

//                       <input
//                         type="text"
//                         value={user.displayName}
//                         onChange={e =>
//                           updateUser({
//                             displayName: e.target.value,
//                           })
//                         }
//                         className="
//                           mt-2
//                           w-full
//                           p-3
//                           rounded-xl
//                           bg-black/20
//                           border border-white/10
//                           outline-none
//                           focus:border-sky-400/60
//                           text-sm
//                           text-white
//                         "
//                       />
//                     </div>

//                     <div className="md:col-span-2">
//                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                         Bio / Status
//                       </label>

//                       <textarea
//                         value={user.bio}
//                         onChange={e =>
//                           updateUser({
//                             bio: e.target.value,
//                           })
//                         }
//                         rows={3}
//                         className="
//                           mt-2
//                           w-full
//                           p-3
//                           rounded-xl
//                           bg-black/20
//                           border border-white/10
//                           outline-none
//                           focus:border-sky-400/60
//                           text-sm
//                           text-white
//                           resize-none
//                         "
//                       />
//                     </div>

//                     <div>
//                       <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
//                         Screen Lock PIN
//                       </label>

//                       <div className="relative mt-2">
//                         <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

//                         <input
//                           type="password"
//                           value={user.pin}
//                           onChange={e =>
//                             updateUser({
//                               pin: e.target.value,
//                             })
//                           }
//                           maxLength={6}
//                           className="
//                             w-full
//                             p-3
//                             pl-10
//                             rounded-xl
//                             bg-black/20
//                             border border-white/10
//                             outline-none
//                             focus:border-sky-400/60
//                             text-sm
//                             text-white
//                             font-mono
//                             tracking-widest
//                           "
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 APPEARANCE
//             ================================================= */}

//             {activeTab === 'appearance' && (
//               <motion.div
//                 key="appearance"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6"
//               >
//                 <PageHeader
//                   title="Appearance"
//                   description="Customize the visual identity of ARLO OS."
//                   icon={Palette}
//                 />

//                 <SectionCard className="p-6">
//                   <div className="flex items-center gap-3 mb-5">
//                     <Palette className="w-5 h-5 text-sky-400" />

//                     <div>
//                       <h3 className="font-bold text-sm">
//                         Theme Mode
//                       </h3>

//                       <p className="text-[10px] text-slate-500">
//                         Choose how the operating system looks.
//                       </p>
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                     {(
//                       ['dark', 'light', 'auto'] as ThemeMode[]
//                     ).map(mode => (
//                       <motion.button
//                         key={mode}
//                         type="button"
//                         whileHover={{
//                           y: -4,
//                           scale: 1.02,
//                         }}
//                         whileTap={{
//                           scale: 0.97,
//                         }}
//                         onClick={() => {
//                           updateSettings({
//                             theme: mode,
//                           });

//                           sound.playToggle(
//                             mode === 'dark',
//                           );
//                         }}
//                         className={`
//                           relative
//                           overflow-hidden
//                           h-28
//                           rounded-2xl
//                           border
//                           ${
//                             settings.theme === mode
//                               ? 'border-sky-400 shadow-xl shadow-sky-500/20'
//                               : 'border-white/10'
//                           }
//                           ${
//                             mode === 'dark'
//                               ? 'bg-[#070b12]'
//                               : mode === 'light'
//                                 ? 'bg-slate-200'
//                                 : 'bg-gradient-to-br from-slate-900 via-slate-500 to-slate-100'
//                           }
//                         `}
//                       >
//                         <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />

//                         <div
//                           className={`
//                             relative
//                             z-10
//                             h-full
//                             flex
//                             flex-col
//                             items-center
//                             justify-center
//                             gap-2
//                             ${
//                               mode === 'light'
//                                 ? 'text-slate-900'
//                                 : 'text-white'
//                             }
//                           `}
//                         >
//                           <Monitor className="w-6 h-6" />

//                           <span className="text-xs font-bold capitalize">
//                             {mode}
//                           </span>

//                           {settings.theme === mode && (
//                             <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-sky-400" />
//                           )}
//                         </div>
//                       </motion.button>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 <SectionCard className="p-6">
//                   <h3 className="font-bold text-sm mb-2">
//                     Accent Color
//                   </h3>

//                   <p className="text-[10px] text-slate-500 mb-5">
//                     Select the primary highlight color used throughout the OS.
//                   </p>

//                   <div className="flex flex-wrap gap-5">
//                     {ACCENTS.map(acc => (
//                       <motion.button
//                         key={acc.id}
//                         type="button"
//                         whileHover={{
//                           scale: 1.15,
//                           y: -3,
//                         }}
//                         whileTap={{
//                           scale: 0.9,
//                         }}
//                         onClick={() => {
//                           updateSettings({
//                             accent: acc.id,
//                           });

//                           sound.playClick();
//                         }}
//                         title={acc.label}
//                         className={`
//                           relative
//                           w-12
//                           h-12
//                           rounded-2xl
//                           flex
//                           items-center
//                           justify-center
//                           transition-all
//                           ${
//                             settings.accent === acc.id
//                               ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070b12] shadow-xl'
//                               : ''
//                           }
//                         `}
//                         style={{
//                           background: acc.color,
//                         }}
//                       >
//                         <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/20" />

//                         {settings.accent === acc.id && (
//                           <Check className="relative w-5 h-5 text-white drop-shadow" />
//                         )}
//                       </motion.button>
//                     ))}
//                   </div>
//                 </SectionCard>

//                 <SectionCard className="p-2">
//                   <SettingRow
//                     icon={Sparkles}
//                     title="Vibrant Glass Effects"
//                     description="Enable glass reflections, blur and depth effects throughout the interface."
//                   >
//                     <Toggle
//                       enabled={
//                         !!settings.glassEffects
//                       }
//                       onChange={() =>
//                         updateSettings({
//                           glassEffects:
//                             !settings.glassEffects,
//                         })
//                       }
//                     />
//                   </SettingRow>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 WALLPAPER
//             ================================================= */}

//             {activeTab === 'wallpaper' && (
//               <motion.div
//                 key="wallpaper"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6"
//               >
//                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                   <PageHeader
//                     title="Wallpaper"
//                     description="Transform your desktop with immersive wallpapers and custom images."
//                     icon={ImageIcon}
//                   />

//                   <button
//                     type="button"
//                     onClick={() =>
//                       wallpaperInputRef.current?.click()
//                     }
//                     className="
//                       px-4
//                       py-2.5
//                       rounded-xl
//                       bg-sky-500
//                       hover:bg-sky-400
//                       text-xs
//                       font-bold
//                       flex
//                       items-center
//                       justify-center
//                       gap-2
//                       shadow-lg
//                       shadow-sky-500/20
//                       transition-colors
//                     "
//                   >
//                     <Upload className="w-4 h-4" />
//                     Import to Photos
//                   </button>

//                   <input
//                     ref={wallpaperInputRef}
//                     type="file"
//                     accept="image/*"
//                     onChange={handleCustomWallpaper}
//                     className="hidden"
//                   />
//                 </div>

//                 {/* Current wallpaper */}

//                 <SectionCard className="p-0 overflow-hidden">
//                   <div className="relative h-64 sm:h-80">
//                     <img
//                       src={currentWallpaper.url}
//                       alt={currentWallpaper.name}
//                       className="w-full h-full object-cover"
//                     />

//                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

//                     <div className="absolute left-6 bottom-6 right-6 flex items-end justify-between gap-4">
//                       <div>
//                         <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold mb-2">
//                           <CheckCircle2 className="w-3 h-3 text-emerald-400" />
//                           ACTIVE WALLPAPER
//                         </div>

//                         <h3 className="text-xl font-black">
//                           {currentWallpaper.name}
//                         </h3>

//                         <p className="text-xs text-slate-300 mt-1">
//                           Currently applied to your desktop
//                         </p>
//                       </div>

//                       <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 items-center justify-center">
//                         <Monitor className="w-5 h-5" />
//                       </div>
//                     </div>
//                   </div>
//                 </SectionCard>

//                 {/* Photos information */}

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                   <SectionCard className="p-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center">
//                         <ImageIcon className="w-4 h-4 text-sky-400" />
//                       </div>

//                       <div>
//                         <div className="text-lg font-black">
//                           {WALLPAPERS.length}
//                         </div>

//                         <div className="text-[10px] text-slate-500">
//                           System Wallpapers
//                         </div>
//                       </div>
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
//                         <Camera className="w-4 h-4 text-purple-400" />
//                       </div>

//                       <div>
//                         <div className="text-lg font-black">
//                           {photoCount}
//                         </div>

//                         <div className="text-[10px] text-slate-500">
//                           Photos Library
//                         </div>
//                       </div>
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-4">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
//                         <Save className="w-4 h-4 text-emerald-400" />
//                       </div>

//                       <div>
//                         <div className="text-sm font-black">
//                           Auto Saved
//                         </div>

//                         <div className="text-[10px] text-slate-500">
//                           Imported images persist locally
//                         </div>
//                       </div>
//                     </div>
//                   </SectionCard>
//                 </div>

//                 {/* Wallpaper grid */}

//                 <SectionCard className="p-5">
//                   <div className="flex items-center justify-between mb-5">
//                     <div>
//                       <h3 className="font-bold text-sm">
//                         Curated Wallpapers
//                       </h3>

//                       <p className="text-[10px] text-slate-500 mt-1">
//                         Choose a wallpaper for your desktop.
//                       </p>
//                     </div>

//                     <Sparkles className="w-4 h-4 text-sky-400" />
//                   </div>

//                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
//                     {WALLPAPERS.map(wp => {
//                       const isActive =
//                         currentWallpaper.id === wp.id;

//                       return (
//                         <motion.button
//                           key={wp.id}
//                           type="button"
//                           whileHover={{
//                             y: -6,
//                             scale: 1.025,
//                           }}
//                           whileTap={{
//                             scale: 0.98,
//                           }}
//                           onClick={() => {
//                             setWallpaper(wp);
//                             sound.playClick();
//                           }}
//                           className={`
//                             group
//                             relative
//                             aspect-video
//                             rounded-2xl
//                             overflow-hidden
//                             border-2
//                             ${
//                               isActive
//                                 ? 'border-sky-400 shadow-xl shadow-sky-500/20'
//                                 : 'border-white/10'
//                             }
//                           `}
//                         >
//                           <img
//                             src={wp.thumbnail}
//                             alt={wp.name}
//                             className="
//                               w-full
//                               h-full
//                               object-cover
//                               transition-transform
//                               duration-500
//                               group-hover:scale-110
//                             "
//                           />

//                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

//                           <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-2">
//                             <span className="text-xs font-bold text-white truncate">
//                               {wp.name}
//                             </span>

//                             {isActive && (
//                               <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-lg">
//                                 <Check className="w-3.5 h-3.5" />
//                               </div>
//                             )}
//                           </div>
//                         </motion.button>
//                       );
//                     })}
//                   </div>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 DOCK
//             ================================================= */}

//             {activeTab === 'dock' && (
//               <motion.div
//                 key="dock"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-3xl"
//               >
//                 <PageHeader
//                   title="Dock & Menu Bar"
//                   description="Customize how the desktop dock and menu bar behave."
//                   icon={Layout}
//                 />

//                 <SectionCard className="p-6">
//                   <SettingRow
//                     icon={Layout}
//                     title="Dock Magnification"
//                     description="Magnify dock icons when the pointer moves across them."
//                   >
//                     <Toggle
//                       enabled={
//                         !!settings.dockMagnification
//                       }
//                       onChange={() =>
//                         updateSettings({
//                           dockMagnification:
//                             !settings.dockMagnification,
//                         })
//                       }
//                     />
//                   </SettingRow>

//                   <SettingRow
//                     icon={RefreshCw}
//                     title="24-Hour Clock"
//                     description="Use a 24-hour clock in the top menu bar."
//                   >
//                     <Toggle
//                       enabled={!!settings.clock24h}
//                       onChange={() =>
//                         updateSettings({
//                           clock24h:
//                             !settings.clock24h,
//                         })
//                       }
//                     />
//                   </SettingRow>
//                 </SectionCard>

//                 <SectionCard className="p-6">
//                   <div className="flex items-center gap-4">
//                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
//                       <Layout className="w-6 h-6 text-sky-400" />
//                     </div>

//                     <div>
//                       <div className="font-bold text-sm">
//                         Dock Experience
//                       </div>

//                       <div className="text-xs text-slate-500 mt-1">
//                         Your dock uses smooth magnification, glass depth and animated application states.
//                       </div>
//                     </div>
//                   </div>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 DISPLAYS
//             ================================================= */}

//             {activeTab === 'displays' && (
//               <motion.div
//                 key="displays"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-3xl"
//               >
//                 <PageHeader
//                   title="Displays"
//                   description="Control brightness and display comfort features."
//                   icon={Monitor}
//                 />

//                 <SectionCard className="p-6">
//                   <div className="flex items-center justify-between mb-4">
//                     <div className="flex items-center gap-3">
//                       <Sun className="w-5 h-5 text-amber-400" />

//                       <div>
//                         <div className="font-bold text-sm">
//                           Brightness
//                         </div>

//                         <div className="text-[10px] text-slate-500">
//                           Adjust simulated display brightness.
//                         </div>
//                       </div>
//                     </div>

//                     <div className="text-sm font-black text-sky-400">
//                       {settings.brightness}%
//                     </div>
//                   </div>

//                   <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
//                     <motion.div
//                       animate={{
//                         width: `${settings.brightness}%`,
//                       }}
//                       className="
//                         absolute
//                         inset-y-0
//                         left-0
//                         rounded-full
//                         bg-gradient-to-r
//                         from-sky-500
//                         to-cyan-400
//                       "
//                     />
//                   </div>

//                   <input
//                     type="range"
//                     min="20"
//                     max="100"
//                     value={settings.brightness}
//                     onChange={e =>
//                       updateSettings({
//                         brightness:
//                           Number(e.target.value),
//                       })
//                     }
//                     className="w-full mt-3 accent-sky-400"
//                   />
//                 </SectionCard>

//                 <SectionCard className="p-2">
//                   <SettingRow
//                     icon={Moon}
//                     title="Night Shift"
//                     description="Warm the display during night hours."
//                   >
//                     <Toggle
//                       enabled={!!settings.nightShift}
//                       accent="amber"
//                       onChange={() =>
//                         updateSettings({
//                           nightShift:
//                             !settings.nightShift,
//                         })
//                       }
//                     />
//                   </SettingRow>
//                 </SectionCard>

//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                   <SectionCard className="p-4">
//                     <MonitorSmartphone className="w-5 h-5 text-sky-400 mb-3" />
//                     <div className="text-xs font-bold">
//                       Built-in Display
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       Primary display
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-4">
//                     <Gauge className="w-5 h-5 text-purple-400 mb-3" />
//                     <div className="text-xs font-bold">
//                       60 Hz
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       Refresh rate
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-4">
//                     <Shield className="w-5 h-5 text-emerald-400 mb-3" />
//                     <div className="text-xs font-bold">
//                       HDR Ready
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       Display profile
//                     </div>
//                   </SectionCard>
//                 </div>
//               </motion.div>
//             )}

//             {/* =================================================
//                 SOUND
//             ================================================= */}

//             {activeTab === 'sound' && (
//               <motion.div
//                 key="sound"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-3xl"
//               >
//                 <PageHeader
//                   title="Sound"
//                   description="Control system audio, interface sounds and volume."
//                   icon={Volume2}
//                 />

//                 <SectionCard className="p-6">
//                   <div className="flex items-center gap-4 mb-6">
//                     <motion.div
//                       animate={{
//                         scale:
//                           settings.soundVolume > 0
//                             ? [1, 1.05, 1]
//                             : 1,
//                       }}
//                       transition={{
//                         duration: 1.5,
//                         repeat:
//                           settings.soundVolume > 0
//                             ? Infinity
//                             : 0,
//                       }}
//                       className="
//                         w-16
//                         h-16
//                         rounded-3xl
//                         bg-gradient-to-br
//                         from-sky-500
//                         to-indigo-600
//                         flex
//                         items-center
//                         justify-center
//                         shadow-xl
//                         shadow-sky-500/20
//                       "
//                     >
//                       {settings.soundVolume === 0 ? (
//                         <VolumeX className="w-7 h-7" />
//                       ) : (
//                         <Volume2 className="w-7 h-7" />
//                       )}
//                     </motion.div>

//                     <div>
//                       <div className="text-2xl font-black">
//                         {Math.round(
//                           settings.soundVolume * 100,
//                         )}
//                         %
//                       </div>

//                       <div className="text-xs text-slate-500">
//                         Output Volume
//                       </div>
//                     </div>
//                   </div>

//                   <input
//                     type="range"
//                     min="0"
//                     max="1"
//                     step="0.05"
//                     value={settings.soundVolume}
//                     onChange={e =>
//                       updateSettings({
//                         soundVolume:
//                           Number(e.target.value),
//                       })
//                     }
//                     className="w-full accent-sky-400"
//                   />
//                 </SectionCard>

//                 <SectionCard className="p-2">
//                   <SettingRow
//                     icon={Volume2}
//                     title="Interface Sound Effects"
//                     description="Play clicks, window sounds, app interactions and system feedback."
//                   >
//                     <Toggle
//                       enabled={
//                         !!settings.soundEffects
//                       }
//                       onChange={() =>
//                         updateSettings({
//                           soundEffects:
//                             !settings.soundEffects,
//                         })
//                       }
//                     />
//                   </SettingRow>
//                 </SectionCard>

//                 <SectionCard className="p-5">
//                   <button
//                     type="button"
//                     onClick={() =>
//                       sound.playClick()
//                     }
//                     className="
//                       w-full
//                       py-3
//                       rounded-xl
//                       bg-white/10
//                       hover:bg-white/15
//                       border border-white/10
//                       text-xs
//                       font-bold
//                       transition-colors
//                       flex
//                       items-center
//                       justify-center
//                       gap-2
//                     "
//                   >
//                     <Volume2 className="w-4 h-4" />
//                     Test System Sound
//                   </button>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 WIFI
//             ================================================= */}

//             {activeTab === 'wifi' && (
//               <motion.div
//                 key="wifi"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-3xl"
//               >
//                 <PageHeader
//                   title="Wi-Fi & Network"
//                   description="View and control this laptop's Windows Wi-Fi adapter."
//                   icon={Wifi}
//                 />

//                 <SectionCard className="p-6">
//                   <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/10">
//                     <div className="flex items-center gap-4">
//                       <motion.div
//                         animate={
//                           wifiEnabled
//                             ? {
//                                 boxShadow: [
//                                   '0 0 0 rgba(14,165,233,0)',
//                                   '0 0 30px rgba(14,165,233,0.25)',
//                                   '0 0 0 rgba(14,165,233,0)',
//                                 ],
//                               }
//                             : {}
//                         }
//                         transition={{
//                           duration: 2,
//                           repeat: Infinity,
//                         }}
//                         className={`
//                           w-14
//                           h-14
//                           rounded-2xl
//                           flex
//                           items-center
//                           justify-center
//                           ${
//                             wifiEnabled
//                               ? 'bg-sky-500/15'
//                               : 'bg-white/5'
//                           }
//                         `}
//                       >
//                         {wifiEnabled ? (
//                           <Wifi className="w-6 h-6 text-sky-400" />
//                         ) : (
//                           <WifiOff className="w-6 h-6 text-slate-500" />
//                         )}
//                       </motion.div>

//                       <div>
//                         <div className="text-lg font-black">
//                           Wi-Fi
//                         </div>

//                         <div className="text-xs text-slate-400 mt-1">
//                           {!wifiEnabled
//                             ? 'Wi-Fi is turned off'
//                             : settings.wifiConnected
//                             ? `Connected to ${wifiNetwork}`
//                             : 'Wi-Fi is on, but not connected'}
//                         </div>
//                       </div>
//                     </div>

//                     <Toggle
//                       enabled={wifiEnabled}
//                       onChange={() => void toggleHostRadio('wifi')}
//                     />
//                   </div>

//                   {radioError && <p role="alert" className="mt-4 text-xs text-rose-300">{radioError}</p>}

//                   {wifiEnabled && (
//                     <div className="pt-5 space-y-2">
//                       <div className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-3">
//                         Current Connection
//                       </div>
//                       <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
//                         <div className="flex items-center gap-3">
//                           <Wifi className="h-4 w-4 text-sky-400" />
//                           <div>
//                             <div className="text-xs font-bold">{settings.wifiConnected ? wifiNetwork : 'No active Wi-Fi connection'}</div>
//                             <div className="mt-1 text-[10px] text-slate-500">Reported by Windows</div>
//                           </div>
//                         </div>
//                         {settings.wifiConnected && <Check className="h-4 w-4 text-sky-400" />}
//                       </div>
//                     </div>
//                   )}
//                 </SectionCard>

//                 <SectionCard className="p-2">
//                   <SettingRow
//                     icon={Globe2}
//                     title="Private Network"
//                     description="Use simulated private network protection for this OS."
//                   >
//                     <Toggle
//                       enabled={true}
//                       onChange={() =>
//                         sound.playClick()
//                       }
//                     />
//                   </SettingRow>

//                   <SettingRow
//                     icon={RefreshCw}
//                     title="Auto-Join Networks"
//                     description="Automatically connect to known networks."
//                   >
//                     <Toggle
//                       enabled={true}
//                       onChange={() =>
//                         sound.playClick()
//                       }
//                     />
//                   </SettingRow>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 BLUETOOTH
//             ================================================= */}

//             {activeTab === 'bluetooth' && (
//               <motion.div
//                 key="bluetooth"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-3xl"
//               >
//                 <PageHeader
//                   title="Bluetooth"
//                   description="View this laptop's Bluetooth adapter and connected device."
//                   icon={Bluetooth}
//                 />

//                 <SectionCard className="p-6">
//                   <div className="flex items-center justify-between pb-5 border-b border-white/10">
//                     <div className="flex items-center gap-4">
//                       <div
//                         className={`
//                           w-14
//                           h-14
//                           rounded-2xl
//                           flex
//                           items-center
//                           justify-center
//                           ${
//                             bluetoothEnabled
//                               ? 'bg-blue-500/15'
//                               : 'bg-white/5'
//                           }
//                         `}
//                       >
//                         {bluetoothEnabled ? (
//                           <Bluetooth className="w-6 h-6 text-blue-400" />
//                         ) : (
//                           <BluetoothOff className="w-6 h-6 text-slate-500" />
//                         )}
//                       </div>

//                       <div>
//                         <div className="text-lg font-black">
//                           Bluetooth
//                         </div>

//                         <div className="text-xs text-slate-400 mt-1">
//                           {!bluetoothEnabled
//                             ? 'Bluetooth is turned off'
//                             : settings.bluetoothConnected
//                             ? `Connected to ${settings.bluetoothDeviceName || 'Bluetooth device'}`
//                             : 'On, no device connected'}
//                         </div>
//                       </div>
//                     </div>

//                     <Toggle
//                       enabled={bluetoothEnabled}
//                       onChange={() => void toggleHostRadio('bluetooth')}
//                     />
//                   </div>

//                   {radioError && <p role="alert" className="mt-4 text-xs text-rose-300">{radioError}</p>}

//                   {bluetoothEnabled && (
//                     <div className="pt-5">
//                       <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
//                         <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current connection</div>
//                         <div className="mt-2 text-xs font-bold">
//                           {settings.bluetoothConnected
//                             ? settings.bluetoothDeviceName || 'Bluetooth device connected'
//                             : 'No Bluetooth device connected'}
//                         </div>
//                         <button
//                           type="button"
//                           onClick={() => setShowControlCenter(true)}
//                           className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
//                         >
//                           Scan nearby BLE devices
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </SectionCard>

//                 <SectionCard className="p-4 text-xs text-slate-400">
//                   Nearby Bluetooth Low Energy discovery is available from Control Center. Windows will request permission before scanning; classic accessories appear when Windows reports them as connected.
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 FOCUS
//             ================================================= */}

//             {activeTab === 'focus' && (
//               <motion.div
//                 key="focus"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-3xl"
//               >
//                 <PageHeader
//                   title="Focus & Notifications"
//                   description="Control interruptions, alerts and Focus Mode."
//                   icon={Moon}
//                 />

//                 <SectionCard className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                       <motion.div
//                         animate={
//                           focusEnabled
//                             ? {
//                                 rotate: [0, -5, 5, 0],
//                               }
//                             : {}
//                         }
//                         transition={{
//                           duration: 1.5,
//                           repeat: Infinity,
//                         }}
//                         className="
//                           w-14
//                           h-14
//                           rounded-2xl
//                           bg-purple-500/15
//                           flex
//                           items-center
//                           justify-center
//                         "
//                       >
//                         {focusEnabled ? (
//                           <Moon className="w-6 h-6 text-purple-400" />
//                         ) : (
//                           <Bell className="w-6 h-6 text-slate-400" />
//                         )}
//                       </motion.div>

//                       <div>
//                         <div className="text-lg font-black">
//                           Focus Mode
//                         </div>

//                         <div className="text-xs text-slate-400 mt-1">
//                           {focusEnabled
//                             ? 'Focus mode is active'
//                             : 'Notifications are delivered normally'}
//                         </div>
//                       </div>
//                     </div>

//                     <Toggle
//                       enabled={focusEnabled}
//                       accent="purple"
//                       onChange={() => {
//                         setFocusEnabled(
//                           prev => !prev,
//                         );

//                         sound.playToggle(
//                           !focusEnabled,
//                         );
//                       }}
//                     />
//                   </div>
//                 </SectionCard>

//                 <SectionCard className="p-2">
//                   <SettingRow
//                     icon={Bell}
//                     title="Allow Notifications"
//                     description="Show application notifications and system alerts."
//                   >
//                     <Toggle
//                       enabled={!focusEnabled}
//                       onChange={() => {
//                         setFocusEnabled(
//                           prev => !prev,
//                         );

//                         sound.playClick();
//                       }}
//                     />
//                   </SettingRow>

//                   <SettingRow
//                     icon={Volume2}
//                     title="Allow Calls"
//                     description="Allow incoming calls while Focus is active."
//                   >
//                     <Toggle
//                       enabled={allowCalls}
//                       onChange={() => {
//                         setAllowCalls(
//                           prev => !prev,
//                         );

//                         sound.playClick();
//                       }}
//                     />
//                   </SettingRow>

//                   <SettingRow
//                     icon={Bell}
//                     title="Repeated Calls"
//                     description="Allow a second call from the same person within 3 minutes."
//                   >
//                     <Toggle
//                       enabled={allowRepeatedCalls}
//                       onChange={() => {
//                         setAllowRepeatedCalls(
//                           prev => !prev,
//                         );

//                         sound.playClick();
//                       }}
//                     />
//                   </SettingRow>

//                   <SettingRow
//                     icon={RefreshCw}
//                     title="Scheduled Focus"
//                     description="Automatically activate Focus during scheduled hours."
//                   >
//                     <Toggle
//                       enabled={scheduledFocus}
//                       onChange={() => {
//                         setScheduledFocus(
//                           prev => !prev,
//                         );

//                         sound.playClick();
//                       }}
//                     />
//                   </SettingRow>
//                 </SectionCard>

//                 <SectionCard className="p-5">
//                   <div className="flex items-center gap-3">
//                     {focusEnabled ? (
//                       <BellOff className="w-5 h-5 text-purple-400" />
//                     ) : (
//                       <Bell className="w-5 h-5 text-sky-400" />
//                     )}

//                     <div>
//                       <div className="text-xs font-bold">
//                         Current Notification Status
//                       </div>

//                       <div className="text-[10px] text-slate-500 mt-1">
//                         {focusEnabled
//                           ? 'Notifications are being silenced by Focus Mode.'
//                           : 'Notifications are currently allowed.'}
//                       </div>
//                     </div>
//                   </div>
//                 </SectionCard>
//               </motion.div>
//             )}

//             {/* =================================================
//                 BATTERY
//             ================================================= */}


//        {activeTab === 'battery' && ( <motion.div key="battery" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-3xl" > <PageHeader title="Battery" description="Monitor your laptop's current battery status and power management." icon={Battery} /> <SectionCard className="p-6"> <div className="flex flex-col sm:flex-row items-center gap-8"> <div className="relative w-40 h-40"> <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" > <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" /> <motion.circle cx="80" cy="80" r="68" fill="none" stroke={ batteryPercentage <= 20 ? 'rgb(248,113,113)' : batteryPercentage <= 40 ? 'rgb(251,191,36)' : 'rgb(52,211,153)' } strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 68} animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - batteryPercentage / 100), }} transition={{ duration: 0.5, }} /> </svg> <div className="absolute inset-0 flex flex-col items-center justify-center"> {batteryCharging ? ( <BatteryCharging className={`w-5 h-5 mb-1 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} /> ) : ( <Battery className={`w-5 h-5 mb-1 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} /> )} <div className="text-3xl font-black"> {batteryPercentage}% </div> <div className="text-[9px] text-slate-500"> {batteryCharging ? 'Charging' : 'Battery'} </div> </div> </div> <div className="flex-1 text-center sm:text-left"> <div className="flex items-center justify-center sm:justify-start gap-2"> <CheckCircle2 className={`w-4 h-4 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} /> <span className="font-black text-sm"> {batteryPercentage <= 20 ? 'Low Battery' : batteryCharging ? 'Battery Charging' : 'Good Battery Health'} </span> </div> <div className="text-xs text-slate-400 mt-2"> {batteryCharging ? `Currently charging at ${batteryPercentage}%` : 'Running on battery power'} </div> <div className={`text-[10px] mt-2 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} > {batteryCharging ? 'Your laptop is connected to power.' : batteryPercentage <= 20 ? 'Connect your charger soon.' : 'Battery is operating normally.'} </div> </div> </div> <div className="mt-7"> <div className="flex justify-between text-[10px] mb-2"> <span className="text-slate-500"> Current Battery Level </span> <span className={`font-mono ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} > {batteryPercentage}% </span> </div> <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"> <motion.div className={`absolute left-0 top-0 h-full rounded-full ${ batteryPercentage <= 20 ? 'bg-red-400' : batteryPercentage <= 40 ? 'bg-amber-400' : 'bg-emerald-400' }`} animate={{ width: `${batteryPercentage}%`, }} transition={{ duration: 0.5, }} /> </div> <div className="flex justify-between mt-2 text-[9px] text-slate-600"> <span>0%</span> <span>50%</span> <span>100%</span> </div> </div> </SectionCard> <SectionCard className="p-2"> <SettingRow icon={Zap} title="Low Power Mode" description="Reduce animations and background activity to extend battery life." > <Toggle enabled={lowPowerMode} accent="amber" onChange={() => { setLowPowerMode(prev => !prev); sound.playToggle( !lowPowerMode, ); }} /> </SettingRow> <SettingRow icon={BatteryCharging} title="Optimized Battery Charging" description="Reduce battery aging by learning your charging routine." > <Toggle enabled={optimizedCharging} accent="green" onChange={() => { setOptimizedCharging( prev => !prev, ); sound.playClick(); }} /> </SettingRow> <SettingRow icon={Power} title="Power Saving When Idle" description="Lower display activity when the system is not being used." > <Toggle enabled={true} accent="green" onChange={() => sound.playClick() } /> </SettingRow> </SectionCard> </motion.div> )}
//             {/* =================================================
//                 ABOUT
//             ================================================= */}

//             {activeTab === 'about' && (
//               <motion.div
//                 key="about"
//                 variants={pageVariants}
//                 initial="initial"
//                 animate="animate"
//                 exit="exit"
//                 className="space-y-6 max-w-4xl"
//               >
//                 <PageHeader
//                   title="About ARLO OS"
//                   description="System information, hardware profile and creator information."
//                   icon={Info}
//                 />

//                 <SectionCard className="p-8 overflow-hidden">
//                   <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl" />

//                   <div className="relative flex flex-col md:flex-row gap-7 items-center md:items-start">
//                     <motion.div
//                       animate={{
//                         rotateY: [0, 5, 0, -5, 0],
//                         rotateX: [0, -3, 0, 3, 0],
//                       }}
//                       transition={{
//                         duration: 8,
//                         repeat: Infinity,
//                         ease: 'easeInOut',
//                       }}
//                       className="
//                         w-32
//                         h-32
//                         rounded-[2rem]
//                         bg-gradient-to-br
//                         from-sky-400
//                         via-blue-600
//                         to-indigo-800
//                         flex
//                         items-center
//                         justify-center
//                         shadow-2xl
//                         shadow-sky-500/20
//                       "
//                     >
//                       <Sparkles className="w-12 h-12 text-white" />
//                     </motion.div>

//                     <div className="text-center md:text-left">
//                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[10px] font-bold mb-3">
//                         <CheckCircle2 className="w-3 h-3" />
//                         PRO EDITION
//                       </div>

//                       <h3 className="text-3xl font-black">
//                         ARLO OS
//                       </h3>

//                       <div className="text-sm text-slate-400 mt-1">
//                         Version 1.0.0 Pro
//                       </div>

//                       <p className="text-xs text-slate-300 mt-5 max-w-xl leading-relaxed">
//                         Designed and engineered by Abhishek Kuntare.
//                         A full-featured desktop operating system experience built with React, TypeScript, Electron and Tailwind CSS.
//                       </p>
//                     </div>
//                   </div>
//                 </SectionCard>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
//                   <SectionCard className="p-5">
//                     <Cpu className="w-5 h-5 text-sky-400 mb-4" />
//                     <div className="text-lg font-black">
//                       12-Core
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       Neural Architecture
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-5">
//                     <MemoryStick className="w-5 h-5 text-purple-400 mb-4" />
//                     <div className="text-lg font-black">
//                       32 GB
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       Unified Memory
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-5">
//                     <HardDrive className="w-5 h-5 text-emerald-400 mb-4" />
//                     <div className="text-lg font-black">
//                       1 TB
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       NVMe Storage
//                     </div>
//                   </SectionCard>

//                   <SectionCard className="p-5">
//                     <Shield className="w-5 h-5 text-amber-400 mb-4" />
//                     <div className="text-lg font-black">
//                       Secure
//                     </div>
//                     <div className="text-[10px] text-slate-500 mt-1">
//                       Protected System
//                     </div>
//                   </SectionCard>
//                 </div>

//                 <SectionCard className="p-6">
//                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                     <div>
//                       <div className="text-sm font-bold">
//                         Creator
//                       </div>

//                       <div className="text-xs text-slate-400 mt-1">
//                         Abhishek Kuntare
//                       </div>

//                       <div className="text-[10px] text-slate-600 mt-1">
//                         abhishekkuntare02@gmail.com
//                       </div>
//                     </div>

//                     <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400">
//                       © 2026 Abhishek Kuntare
//                     </div>
//                   </div>
//                 </SectionCard>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>
//       </main>
//     </div>
//   );
// };

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  User,
  Palette,
  Image as ImageIcon,
  Monitor,
  Layout,
  Volume2,
  Wifi,
  Bluetooth,
  Moon,
  Battery,
  Info,
  Check,
  Upload,
  RefreshCw,
  Camera,
  Trash2,
  Signal,
  Globe2,
  ShieldCheck,
  Bell,
  BellOff,
  Zap,
  BatteryCharging,
  Power,
  Laptop,
  Smartphone,
  Search,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Sun,
  Lock,
  Eye,
  EyeOff,
  UserRound,
  CheckCircle2,
  Circle,
  Gauge,
  Network,
  Headphones,
  Keyboard,
  Cpu,
  HardDrive,
  MemoryStick,
  Shield,
  ExternalLink,
  RotateCcw,
  MonitorSmartphone,
  VolumeX,
  WifiOff,
  BluetoothOff,
  X,
  Save,
  Grid3X3,
  Layers3,
  SearchX,
  Type,
  MousePointer2,
  CloudSun,
  Music,
  Clock3,
  Pin,
  PinOff,
  Bot,
  Mic,
  Share2,
  ArrowUpRight,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { WALLPAPERS } from '../../data/wallpapers';
import {
  MascotMark,
  MASCOT_FAMILY_NAMES,
  MASCOT_VARIATIONS,
  MASCOT_STYLE_COUNT,
} from '../system/MascotMark';
import {
  AccentColor,
  BatteryIconStyle,
  CursorStyle,
  DockPosition,
  GhostShortcut,
  ThemeMode,
  Wallpaper,
} from '../../types/desktop';
import { sound } from '../../services/soundService';
import { syncProfileToCloud } from '../../services/profileSync';
import { APP_VERSION, getInstalledAppVersion } from '../../services/appVersion';
import { AppIcon } from '../system/AppIcon';
import { BatteryStatusIcon } from '../system/BatteryStatusIcon';
import instagramLogo from '../../assets/doom-scroll/instagram.jpg';
import snapchatLogo from '../../assets/doom-scroll/snapchat.png';
import whatsappLogo from '../../assets/doom-scroll/whatsapp.png';
import xLogo from '../../assets/doom-scroll/x.jpg';
import threadsLogo from '../../assets/doom-scroll/threads.png';
import linkedinLogo from '../../assets/doom-scroll/linkedin.png';
import discordLogo from '../../assets/doom-scroll/discord.png';
import telegramLogo from '../../assets/doom-scroll/telegram.png';
import spotifyLogo from '../../assets/doom-scroll/spotify.png';
import pinterestLogo from '../../assets/doom-scroll/pinterest.png';
import {
  loadMascotCompanionConfig,
  MASCOT_ACTIONS,
  updateMascotCompanionConfig,
  type MascotCompanionConfig,
} from '../system/mascotCompanionModel';

/* ============================================================
   TYPES
============================================================ */

type SettingsTab =
  | 'profile'
  | 'connections'
  | 'appearance'
  | 'themes'
  | 'wallpaper'
  | 'dock'
  | 'displays'
  | 'sound'
  | 'wifi'
  | 'bluetooth'
  | 'focus'
  | 'ghost'
  | 'battery'
  | 'about';

interface PhotoLibraryItem {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  createdAt: string;
  source: string;
}

/* ============================================================
   CONSTANTS
============================================================ */

const PHOTO_LIBRARY_KEY = 'abhishek-os-photos';
const MASCOT_COLOR_SWATCHES = [
  '#159eff',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#64748b',
  '#f8fafc',
  '#111827',
];


interface BatteryManager extends EventTarget {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
}


const ACCENTS: {
  id: AccentColor;
  label: string;
  color: string;
}[] = [
  {
    id: 'blue',
    label: 'Blue',
    color: '#3b82f6',
  },
  {
    id: 'purple',
    label: 'Purple',
    color: '#a855f7',
  },
  {
    id: 'pink',
    label: 'Pink',
    color: '#ec4899',
  },
  {
    id: 'orange',
    label: 'Orange',
    color: '#f97316',
  },
  {
    id: 'green',
    label: 'Green',
    color: '#22c55e',
  },
  {
    id: 'cyan',
    label: 'Cyan',
    color: '#06b6d4',
  },
];

const FONT_FAMILIES = [
  'Plus Jakarta Sans',
  'Arial',
  'Segoe UI',
  'Calibri',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Georgia',
  'Times New Roman',
  'Cambria',
  'Garamond',
  'Palatino Linotype',
  'Courier New',
  'Consolas',
  'Candara',
  'Comic Sans MS',
  'Impact',
];

const LAYOUT_POSITIONS: { id: DockPosition; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

const ThemeCard: React.FC<{
  theme: UITheme;
  selected: boolean;
  onSelect: () => void;
}> = ({ theme, selected, onSelect }) => {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setPointer({ x, y });
  };

  return (
    <motion.button
      type="button"
      data-theme-preview
      onClick={onSelect}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      whileTap={{ scale: 0.97 }}
      animate={{
        rotateX: -pointer.y * 4,
        rotateY: pointer.x * 5,
        y: selected ? -3 : 0,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      style={{
        transformStyle: 'preserve-3d',
        background: theme.background,
        borderColor: selected ? theme.accent : 'rgba(255,255,255,.12)',
        boxShadow: selected
          ? `0 18px 50px ${theme.accent}45, 0 0 0 1px ${theme.accent}55, inset 0 1px 0 rgba(255,255,255,.2)`
          : '0 18px 40px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.10)',
        borderRadius: theme.radius,
      }}
      className="group relative min-h-[190px] overflow-hidden border p-3 text-left"
    >
      <motion.div
        animate={{ rotate: pointer.x * 3, scale: selected ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="absolute -right-10 -top-12 h-32 w-32 rounded-full blur-2xl opacity-70"
        style={{ background: theme.accent }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            `linear-gradient(135deg, ${theme.accent}22, transparent 48%, ${theme.accent2}22)`,
        }}
      />
      <div
        className="absolute left-3 right-3 top-3 h-2 rounded-full opacity-70"
        style={{
          background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})`,
        }}
      />
      <div className="relative z-10 mt-3" style={{ transform: 'translateZ(28px)' }}>
        <div className="flex items-center justify-between gap-2">
          <div
            className="truncate text-[13px] font-black"
            style={{ color: theme.text }}
          >
            {theme.name}
          </div>
          {selected && (
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: theme.accent, color: theme.onAccent }}
            >
              <Check className="h-3.5 w-3.5" />
            </motion.div>
          )}
        </div>
        <div
          className="mt-3 rounded-[18px] p-3"
          style={{
            background: theme.panel,
            border: `1px solid ${theme.text}18`,
            boxShadow: `inset 0 1px 0 ${theme.text}12`,
          }}
        >
          <div className="grid grid-cols-4 gap-1.5">
            {[theme.accent, theme.accent2, theme.text, theme.muted].map(
              (color, index) => (
                <motion.div
                  key={`${theme.id}-${index}`}
                  whileHover={{ scale: 1.12, z: 8 }}
                  className="h-9 rounded-lg"
                  style={{ background: color }}
                />
              ),
            )}
          </div>
          <div className="mt-2 flex items-end gap-1.5">
            <div
              className="h-11 flex-1 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}55, ${theme.panel})`,
              }}
            />
            <div
              className="h-7 w-1/3 rounded-lg"
              style={{ background: theme.accent2 }}
            />
          </div>
        </div>
        <div
          className="mt-3 text-[9px] font-bold uppercase tracking-[.16em]"
          style={{ color: theme.muted }}
        >
          {String(UI_THEMES.indexOf(theme) + 1).padStart(2, '0')} / 29
        </div>
      </div>
      <motion.div
        animate={{ opacity: selected ? 0.8 : 0.35 }}
        className="pointer-events-none absolute bottom-2 right-3 text-[8px] font-black uppercase tracking-[.2em]"
        style={{ color: theme.accent }}
      >
        {selected ? 'ACTIVE' : 'PREVIEW'}
      </motion.div>
    </motion.button>
  );
};



const NAV_ITEMS: {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'profile',
    label: 'User Profile',
    icon: User,
    description: 'Account, avatar and personal details',
  },
  {
    id: 'connections',
    label: 'Connections',
    icon: Share2,
    description: 'Connect social and music accounts securely',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme, colors and visual effects',
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: Sparkles,
    description: '29 immersive UI/UX themes for the entire OS',
  },
  {
    id: 'wallpaper',
    label: 'Wallpaper',
    icon: ImageIcon,
    description: 'Desktop wallpapers and photos',
  },
  {
    id: 'dock',
    label: 'Dock & Menu Bar',
    icon: Layout,
    description: 'Dock and menu bar behavior',
  },
  {
    id: 'displays',
    label: 'Displays',
    icon: Monitor,
    description: 'Brightness and Night Shift',
  },
  {
    id: 'sound',
    label: 'Sound',
    icon: Volume2,
    description: 'Volume and system sounds',
  },
  {
    id: 'wifi',
    label: 'Wi-Fi & Network',
    icon: Wifi,
    description: 'Wireless networks',
  },
  {
    id: 'bluetooth',
    label: 'Bluetooth',
    icon: Bluetooth,
    description: 'Connected devices',
  },
  {
    id: 'focus',
    label: 'Focus & Notifications',
    icon: Moon,
    description: 'Focus and alerts',
  },
  {
    id: 'ghost',
    label: 'Ghost AI',
    icon: Bot,
    description: 'Assistant shortcut and voice privacy',
  },
  {
    id: 'battery',
    label: 'Battery',
    icon: Battery,
    description: 'Power and battery',
  },
  {
    id: 'about',
    label: 'About ARLO OS',
    icon: Info,
    description: 'System information',
  },
];

const SOCIAL_PROVIDERS = [
  { id: 'instagram', name: 'Instagram', logo: instagramLogo, url: 'https://www.instagram.com/', color: '#e1306c', description: 'Photos, reels and messages' },
  { id: 'snapchat', name: 'Snapchat', logo: snapchatLogo, url: 'https://www.snapchat.com/', color: '#facc15', description: 'Snaps and conversations' },
  { id: 'whatsapp', name: 'WhatsApp', logo: whatsappLogo, url: 'https://www.whatsapp.com/', color: '#22c55e', description: 'Private chats and calls' },
  { id: 'x', name: 'X', logo: xLogo, url: 'https://x.com/', color: '#e2e8f0', description: 'Posts and conversations' },
  { id: 'threads', name: 'Threads', logo: threadsLogo, url: 'https://www.threads.net/', color: '#f8fafc', description: 'Join public conversations' },
  { id: 'linkedin', name: 'LinkedIn', logo: linkedinLogo, url: 'https://www.linkedin.com/', color: '#38bdf8', description: 'Professional network' },
  { id: 'discord', name: 'Discord', logo: discordLogo, url: 'https://discord.com/app', color: '#818cf8', description: 'Communities and voice chat' },
  { id: 'telegram', name: 'Telegram', logo: telegramLogo, url: 'https://telegram.org/', color: '#38bdf8', description: 'Messaging across devices' },
  { id: 'spotify', name: 'Spotify', logo: spotifyLogo, url: 'https://open.spotify.com/', color: '#4ade80', description: 'Music, podcasts and playlists' },
  { id: 'pinterest', name: 'Pinterest', logo: pinterestLogo, url: 'https://www.pinterest.com/', color: '#fb7185', description: 'Ideas and inspiration' },
] as const;

interface SocialWebviewElement extends HTMLElement {
  getURL: () => string;
}

type SocialWebviewTagProps = {
  src: string;
  partition: string;
  ref: React.Ref<SocialWebviewElement>;
  style: React.CSSProperties;
};

const SocialWebviewTag = 'webview' as unknown as React.ComponentType<SocialWebviewTagProps>;

const SocialSignInView: React.FC<{
  src: string;
  onNavigate: (url: string) => void;
  onError: (message: string) => void;
}> = ({ src, onNavigate, onError }) => {
  const webviewRef = useRef<SocialWebviewElement | null>(null);
  const handlersRef = useRef({ onNavigate, onError });
  handlersRef.current = { onNavigate, onError };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    const navigated = (event: Event) => {
      const url = (event as Event & { url?: string }).url;
      if (url) handlersRef.current.onNavigate(url);
    };
    const failed = (event: Event) => {
      const detail = event as Event & {
        errorCode?: number;
        errorDescription?: string;
        isMainFrame?: boolean;
      };
      if (detail.isMainFrame && detail.errorCode !== -3) {
        handlersRef.current.onError(detail.errorDescription || 'This service does not allow sign-in in an embedded browser. Open its website externally instead.');
      }
    };
    webview.addEventListener('did-navigate', navigated);
    webview.addEventListener('did-navigate-in-page', navigated);
    webview.addEventListener('did-fail-load', failed);
    return () => {
      webview.removeEventListener('did-navigate', navigated);
      webview.removeEventListener('did-navigate-in-page', navigated);
      webview.removeEventListener('did-fail-load', failed);
    };
  }, []);

  return (
    <SocialWebviewTag
      ref={webviewRef}
      src={src}
      partition="persist:abhishek-browser"
      style={{ display: 'flex', height: '100%', width: '100%' }}
    />
  );
};

/* ============================================================
   HELPERS
============================================================ */

const getPhotoLibrary = (): PhotoLibraryItem[] => {
  try {
    const raw = localStorage.getItem(PHOTO_LIBRARY_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const savePhotoToLibrary = (
  item: PhotoLibraryItem,
) => {
  try {
    const existing = getPhotoLibrary();

    const updated = [
      item,
      ...existing.filter(photo => photo.id !== item.id),
    ];

    localStorage.setItem(
      PHOTO_LIBRARY_KEY,
      JSON.stringify(updated),
    );

    window.dispatchEvent(
      new CustomEvent('abhishek-os-photos-updated', {
        detail: item,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
};

const formatFileName = (name: string) => {
  const cleaned = name
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  return cleaned || 'Custom Wallpaper';
};

/* ============================================================
   ANIMATION
============================================================ */

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.18,
    },
  },
};

const cardHover = {
  y: -3,
  scale: 1.005,
  transition: {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

/* ============================================================
   TOGGLE
============================================================ */

const Toggle: React.FC<{
  enabled: boolean;
  onChange: () => void;
  accent?: 'blue' | 'green' | 'amber' | 'purple';
}> = ({
  enabled,
  onChange,
  accent = 'blue',
}) => {
  const backgroundClass =
    accent === 'green'
      ? 'bg-emerald-500'
      : accent === 'amber'
        ? 'bg-amber-500'
        : accent === 'purple'
          ? 'bg-purple-500'
          : 'bg-sky-500';

  return (
    <motion.button
      type="button"
      onClick={onChange}
      aria-pressed={enabled}
      whileTap={{ scale: 0.9 }}
      className={`
        w-12 h-7 rounded-full
        transition-colors relative p-1 shrink-0
        border border-white/10
        shadow-inner
        ${
          enabled
            ? backgroundClass
            : 'bg-white/15'
        }
      `}
    >
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
        className={`
          w-5 h-5 rounded-full
          bg-white
          shadow-lg
          ${
            enabled
              ? 'ml-5'
              : 'ml-0'
          }
        `}
      />
    </motion.button>
  );
};

/* ============================================================
   SETTING ROW
============================================================ */

const SettingRow: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({
  icon: Icon,
  title,
  description,
  children,
}) => {
  return (
    <motion.div
      whileHover={{
        backgroundColor:
          'rgba(255,255,255,0.025)',
      }}
      className="
        flex items-center justify-between
        gap-4 py-4
        border-b border-white/10
        last:border-b-0
        rounded-xl px-2
      "
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className="
            w-10 h-10 rounded-xl
            bg-gradient-to-br
            from-white/15 to-white/5
            border border-white/10
            flex items-center justify-center
            shrink-0 shadow-lg
          "
        >
          <Icon className="w-4 h-4 text-sky-400" />
        </div>

        <div className="min-w-0">
          <div className="font-semibold text-xs text-white">
            {title}
          </div>

          <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            {description}
          </div>
        </div>
      </div>

      {children}
    </motion.div>
  );
};

/* ============================================================
   SECTION CARD
============================================================ */

const SectionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({
  children,
  className = '',
  id,
}) => {
  return (
    <motion.div
      id={id}
      whileHover={cardHover}
      className={`
        relative overflow-hidden
        rounded-3xl
        bg-gradient-to-br
        from-white/[0.09]
        via-white/[0.045]
        to-white/[0.025]
        border border-white/10
        shadow-2xl
        backdrop-blur-2xl
        ${className}
      `}
    >
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />

      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
};

/* ============================================================
   HEADER
============================================================ */

const PageHeader: React.FC<{
  title: string;
  description: string;
  icon?: React.ElementType;
}> = ({
  title,
  description,
  icon: Icon,
}) => {
  return (
    <div className="flex items-start gap-4">
      {Icon && (
        <motion.div
          initial={{
            rotate: -8,
            scale: 0.8,
          }}
          animate={{
            rotate: 0,
            scale: 1,
          }}
          className="
            w-12 h-12
            rounded-2xl
            bg-gradient-to-br
            from-sky-400
            via-blue-500
            to-indigo-600
            flex items-center justify-center
            shadow-xl
            shadow-sky-500/20
            shrink-0
          "
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>
      )}

      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          {title}
        </h2>

        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

/* ============================================================
   SETTINGS APP
============================================================ */

export const SettingsApp: React.FC = () => {
  const {
    user,
    updateUser,
    settings,
    updateSettings,
    resolvedTheme,
    dockAppIds,
    toggleDockPin,
    setShowControlCenter,
    currentWallpaper,
    setWallpaper,
  } = useOS();

  const avatarInputRef =
    useRef<HTMLInputElement | null>(null);

  const wallpaperInputRef =
    useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] =
    useState<SettingsTab>('profile');
  const [cloudProfileBusy, setCloudProfileBusy] = useState(false);
  const [cloudProfileMessage, setCloudProfileMessage] = useState('');
  const [appVersion, setAppVersion] = useState(APP_VERSION);
  const [showLockPassword, setShowLockPassword] = useState(false);
  const [updateChannel, setUpdateChannel] = useState<'store' | 'direct' | 'development'>('development');
  const [updateStatus, setUpdateStatus] = useState<
    'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error' | 'store-opened'
  >('idle');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updatePercent, setUpdatePercent] = useState(0);
  const [updateActionBusy, setUpdateActionBusy] = useState(false);

  useEffect(() => {
    const openMascotSettings = () => {
      try {
        sessionStorage.removeItem('arlo_focus_mascot_settings_v1');
      } catch (error) {
        console.warn('[Settings] Could not clear the mascot settings destination:', error);
      }
      setActiveTab('appearance');
      setShowMobileNav(false);
      window.setTimeout(() => {
        document.getElementById('arlo-mascot-settings')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 180);
    };
    window.addEventListener('arlo:open-mascot-settings', openMascotSettings);
    try {
      if (sessionStorage.getItem('arlo_focus_mascot_settings_v1') === 'true') {
        openMascotSettings();
      }
    } catch (error) {
      console.warn('[Settings] Could not read the mascot settings destination:', error);
    }
    return () => window.removeEventListener('arlo:open-mascot-settings', openMascotSettings);
  }, []);

  useEffect(() => {
    let active = true;
    const api = window.electronAPI;
    void getInstalledAppVersion().then(version => {
      if (active) setAppVersion(version);
    });
    if (!api) return () => {
      active = false;
    };

    void api.updateChannel().then(channel => {
      if (active) setUpdateChannel(channel);
    }).catch(error => {
      console.error('[Settings] Could not detect the app update channel:', error);
      if (active) {
        setUpdateStatus('error');
        setUpdateMessage('Could not determine how this installation receives updates.');
      }
    });

    const unsubscribe = api.onUpdate(event => {
      if (!active) return;
      switch (event.channel) {
        case 'checking':
          setUpdateStatus('checking');
          setUpdateMessage('Checking for the latest ARLO OS release…');
          break;
        case 'available':
          setUpdateStatus('available');
          setUpdateMessage(`Version ${event.version || 'new'} is available. Downloading in the background…`);
          break;
        case 'not-available':
          setUpdateStatus('not-available');
          setUpdateMessage(`You’re up to date${event.version ? ` on version ${event.version}` : ''}.`);
          break;
        case 'downloading':
          setUpdateStatus('downloading');
          setUpdatePercent(Math.max(0, Math.min(100, Math.round(event.percent || 0))));
          setUpdateMessage(`Downloading update… ${Math.max(0, Math.min(100, Math.round(event.percent || 0)))}%`);
          break;
        case 'downloaded':
          setUpdateStatus('downloaded');
          setUpdateMessage(`Version ${event.version || 'update'} is ready to install. Restart ARLO OS to finish.`);
          break;
        case 'error':
          setUpdateStatus('error');
          setUpdateMessage(event.message || 'Could not check for updates. Check your connection and try again.');
          break;
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleUpdateAction = async () => {
    const api = window.electronAPI;
    if (!api || updateActionBusy) return;
    setUpdateActionBusy(true);
    setUpdateMessage('');
    try {
      if (updateChannel === 'store') {
        const opened = await api.openStoreUpdates();
        if (!opened) throw new Error('Could not open Microsoft Store updates on this device.');
        setUpdateStatus('store-opened');
        setUpdateMessage('Microsoft Store opened. Choose Get updates in Library; Store updates arrive after the published submission is approved.');
      } else if (updateChannel === 'direct') {
        setUpdateStatus('checking');
        setUpdateMessage('Checking for the latest ARLO OS release…');
        const result = await api.checkForUpdates();
        if (!result.success) {
          if (result.reason === 'development') {
            setUpdateStatus('error');
            setUpdateMessage('Update checks are available in the installed desktop app.');
          } else {
            setUpdateStatus('error');
            setUpdateMessage(result.error || 'Could not check for updates.');
          }
        }
      } else {
        setUpdateStatus('error');
        setUpdateMessage('Update checks are available in the installed desktop app.');
      }
    } catch (error) {
      console.error('[Settings] Update action failed:', error);
      setUpdateStatus('error');
      setUpdateMessage(error instanceof Error ? error.message : 'Could not open the update service.');
    } finally {
      setUpdateActionBusy(false);
    }
  };

  const installDownloadedUpdate = async () => {
    try {
      const installed = await window.electronAPI?.installUpdate();
      if (!installed) throw new Error('The downloaded update could not be started.');
    } catch (error) {
      console.error('[Settings] Could not install downloaded update:', error);
      setUpdateStatus('error');
      setUpdateMessage(error instanceof Error ? error.message : 'Could not install the downloaded update.');
    }
  };

  const [selectedThemeId, setSelectedThemeId] =
    useState<string | null>(() => getStoredUITheme()?.id ?? null);

  const [themeSearch, setThemeSearch] =
    useState('');

  const [mascotPage, setMascotPage] = useState(0);
  const [companionConfig, setCompanionConfig] = useState<MascotCompanionConfig>(loadMascotCompanionConfig);
  const updateCompanion = (patch: Partial<MascotCompanionConfig>) => {
    updateMascotCompanionConfig(patch);
    setCompanionConfig(current => ({ ...current, ...patch }));
  };
  const selectedMascotStyle = Number.isInteger(settings.mascotStyle)
    ? Math.max(0, Math.min(MASCOT_STYLE_COUNT - 1, settings.mascotStyle))
    : 0;

  const [search, setSearch] =
    useState('');
  const [connectionsError, setConnectionsError] = useState('');
  const [selectedSocialProvider, setSelectedSocialProvider] = useState<(typeof SOCIAL_PROVIDERS)[number] | null>(null);
  const [socialCurrentUrl, setSocialCurrentUrl] = useState('');
  const [socialLoadError, setSocialLoadError] = useState('');

  const [dockAppSearch, setDockAppSearch] = useState('');
  const dockApps = useMemo(
    () =>
      Object.values(APP_REGISTRY)
        .filter(app => app.installed && app.id !== 'trash')
        .sort((a, b) => {
          const aDockIndex = dockAppIds.indexOf(a.id);
          const bDockIndex = dockAppIds.indexOf(b.id);
          const aIsPinned = aDockIndex !== -1;
          const bIsPinned = bDockIndex !== -1;

          if (aIsPinned && bIsPinned) return aDockIndex - bDockIndex;
          if (aIsPinned) return -1;
          if (bIsPinned) return 1;
          return a.name.localeCompare(b.name);
        }),
    [dockAppIds],
  );
  const filteredDockApps = useMemo(() => {
    const query = dockAppSearch.trim().toLowerCase();
    if (!query) return dockApps;

    return dockApps.filter(app =>
      `${app.name} ${app.category} ${app.description}`
        .toLowerCase()
        .includes(query),
    );
  }, [dockApps, dockAppSearch]);
  const pinnedDockAppsCount = dockApps.filter(app =>
    dockAppIds.includes(app.id),
  ).length;

  const wifiEnabled = settings.wifiEnabled;
  const wifiNetwork = settings.wifiNetwork;
  const bluetoothEnabled = settings.bluetoothEnabled;
  const [radioError, setRadioError] = useState('');
  const [radioBusy, setRadioBusy] = useState(false);
  const [ghostShortcutError, setGhostShortcutError] = useState('');
  const [ghostVoicePreviewError, setGhostVoicePreviewError] = useState('');
  const ghostVoicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  const updateGhostShortcut = async (shortcut: GhostShortcut) => {
    setGhostShortcutError('');
    if (window.electronAPI?.ghostAISetGlobalShortcut) {
      try {
        const registered = await window.electronAPI.ghostAISetGlobalShortcut(shortcut);
        if (!registered) {
          setGhostShortcutError('That shortcut is already registered by another application. Your current shortcut is unchanged.');
          return;
        }
      } catch (error) {
        console.error('[Ghost AI] Could not update the global shortcut:', error);
        setGhostShortcutError(error instanceof Error ? error.message : 'Could not register that shortcut.');
        return;
      }
    }
    updateSettings({ ghostShortcut: shortcut });
    sound.playClick();
  };
  const toggleGhostWakePhrase = () => {
    const enabled = !settings.ghostWakeEnabled;
    try {
      localStorage.setItem('abhishek_os_ghost_wake_enabled_v1', String(enabled));
    } catch (error) {
      console.error('[Ghost AI] Could not save the wake phrase preference:', error);
      setGhostShortcutError('Could not save the wake phrase setting on this device.');
      return;
    }
    updateSettings({ ghostWakeEnabled: enabled });
  };
  const previewGhostVoice = async () => {
    setGhostVoicePreviewError('');
    ghostVoicePreviewAudioRef.current?.pause();
    const synthesize = window.electronAPI?.ghostAISynthesizeSpeech;
    if (!synthesize) {
      setGhostVoicePreviewError('Lily’s online voice is only available in the ARLO OS desktop app.');
      return;
    }
    try {
      const audioData = await synthesize('Hello, I’m Lily. I’m here and ready to help.');
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      ghostVoicePreviewAudioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('[Ghost AI] Online Lily voice preview failed:', error);
      setGhostVoicePreviewError(error instanceof Error ? error.message : 'Could not preview Lily’s online voice.');
    }
  };

  const focusEnabled = settings.doNotDisturb;

  const [allowCalls, setAllowCalls] =
    useState(true);

  const [allowRepeatedCalls, setAllowRepeatedCalls] =
    useState(false);

  const [scheduledFocus, setScheduledFocus] =
    useState(false);

  // const [batteryPercentage, setBatteryPercentage] =
  //   useState(94);

  const lowPowerMode = settings.lowPowerMode;

  const toggleHostRadio = async (radio: 'wifi' | 'bluetooth') => {
    if (radioBusy) return;
    setRadioBusy(true);
    setRadioError('');
    sound.playToggle(radio === 'wifi' ? !wifiEnabled : !bluetoothEnabled);
    try {
      const state = radio === 'wifi'
        ? await window.electronAPI?.setWifiEnabled(!wifiEnabled)
        : await window.electronAPI?.setBluetoothEnabled(!bluetoothEnabled);
      if (state) {
        updateSettings({
          wifiEnabled: state.wifi.enabled ?? false,
          wifiConnected: state.wifi.connected ?? false,
          wifiNetwork: state.wifi.connected && state.wifi.ssid
            ? state.wifi.ssid
            : state.wifi.enabled === true
              ? 'Not connected'
              : state.wifi.enabled === false
                ? 'Off'
                : 'Unavailable',
          bluetoothEnabled: state.bluetooth.enabled ?? false,
          bluetoothConnected: state.bluetooth.connected ?? false,
          bluetoothDeviceName: state.bluetooth.deviceName || '',
        });
      }
    } catch {
      setRadioError(`Windows could not change ${radio === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}. Approve the Windows administrator prompt; if cancelled, no change was made.`);
    } finally {
      setRadioBusy(false);
    }
  };

  const [optimizedCharging, setOptimizedCharging] =
    useState(true);

  const [photoCount, setPhotoCount] =
    useState(0);

  const [showMobileNav, setShowMobileNav] =
    useState(false);

  /* ==========================================================
     GLOBAL UI THEME ENGINE
  ========================================================== */

  useEffect(() => {
    const initialTheme = getStoredUITheme();

    if (initialTheme) {
      setSelectedThemeId(initialTheme.id);
      applyUITheme(initialTheme);
    } else {
      setSelectedThemeId(null);
      clearUITheme();
    }

    const handleThemeUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<string | null>;
      const nextTheme = customEvent.detail
        ? UI_THEMES.find(theme => theme.id === customEvent.detail) || null
        : null;

      if (nextTheme) {
        setSelectedThemeId(nextTheme.id);
        applyUITheme(nextTheme);
      } else {
        setSelectedThemeId(null);
        clearUITheme();
      }
    };

    window.addEventListener('abhishek-os-theme-updated', handleThemeUpdate);

    return () => {
      window.removeEventListener('abhishek-os-theme-updated', handleThemeUpdate);
    };
  }, []);

  // Preview only. This does NOT modify the desktop.
  const originalThemePreview: UITheme = {
    id: 'original-abhishek-os',
    name: 'Original ARLO OS',
    background: '#070b12',
    panel: '#111827',
    text: '#ffffff',
    muted: '#64748b',
    accent: '#38bdf8',
    accent2: '#6366f1',
    radius: '18px',
    onAccent: '#ffffff',
  };

  const activeUITheme =
    UI_THEMES.find(theme => theme.id === selectedThemeId) ||
    originalThemePreview;

  const filteredThemes = useMemo(() => {
    const query = themeSearch.trim().toLowerCase();

    if (!query) {
      return UI_THEMES;
    }

    return UI_THEMES.filter(theme =>
      theme.name.toLowerCase().includes(query),
    );
  }, [themeSearch]);

  const handleThemeSelect = (theme: UITheme) => {
    setSelectedThemeId(theme.id);
    persistAndApplyUITheme(theme);
    sound.playClick();
  };

  const handleThemeReset = () => {
    setSelectedThemeId(null);
    resetUIThemeToOriginal();
    sound.playClick();
  };

  /* ==========================================================
     LOAD PHOTO LIBRARY COUNT
  ========================================================== */

  useEffect(() => {
    const updatePhotoCount = () => {
      setPhotoCount(getPhotoLibrary().length);
    };

    updatePhotoCount();

    window.addEventListener(
      'abhishek-os-photos-updated',
      updatePhotoCount,
    );

    return () => {
      window.removeEventListener(
        'abhishek-os-photos-updated',
        updatePhotoCount,
      );
    };
  }, []);

  /* ==========================================================
     FILTER SETTINGS
  ========================================================== */

  const filteredNavItems = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return NAV_ITEMS;
    }

    return NAV_ITEMS.filter(item =>
      `${item.label} ${item.description}`
        .toLowerCase()
        .includes(query),
    );
  }, [search]);

  /* ==========================================================
     AVATAR
  ========================================================== */

  const handleAvatarUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      sound.playClick();
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      sound.playClick();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateUser({
          avatarUrl: reader.result,
          avatarType: 'upload',
          avatarPreset: undefined,
        });

        sound.playClick();
      }
    };

    reader.onerror = () => {
      sound.playClick();
    };

    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    updateUser({
      avatarUrl: '',
      avatarType: 'initials',
      avatarPreset: undefined,
    });

    sound.playClick();
  };

  const syncCurrentProfileToCloud = async () => {
    if (cloudProfileBusy) return;
    setCloudProfileBusy(true);
    setCloudProfileMessage('');
    try {
      await syncProfileToCloud(user);
      setCloudProfileMessage('Your profile was shared with the project and saved to private storage.');
    } catch (error) {
      setCloudProfileMessage(error instanceof Error ? error.message : 'Could not save your profile to the cloud.');
    } finally {
      setCloudProfileBusy(false);
    }
  };

  /* ==========================================================
     CUSTOM WALLPAPER + PHOTOS LIBRARY
  ========================================================== */

  const handleCustomWallpaper = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      sound.playClick();
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      sound.playClick();
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return;
      }

      const imageUrl = reader.result;

      const customWp: Wallpaper = {
        id: `custom-${Date.now()}`,
        name:
          formatFileName(file.name) ||
          'Custom Wallpaper',
        url: imageUrl,
        thumbnail: imageUrl,
        category: 'custom',
      };

      /* Apply wallpaper */
      setWallpaper(customWp);

      /* Save to Photos */
      const photo: PhotoLibraryItem = {
        id: `settings-photo-${Date.now()}`,
        name: formatFileName(file.name),
        url: imageUrl,
        thumbnail: imageUrl,
        createdAt: new Date().toISOString(),
        source: 'Settings • Custom Wallpaper',
      };

      savePhotoToLibrary(photo);

      sound.playClick();
    };

    reader.onerror = () => {
      sound.playClick();
    };

    reader.readAsDataURL(file);

    e.target.value = '';
  };

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const changeTab = (
    tab: SettingsTab,
  ) => {
    setActiveTab(tab);
    setShowMobileNav(false);
    sound.playClick();
  };

  const openSocialWebsite = async (url: string) => {
    setConnectionsError('');
    try {
      if (window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(url);
        return;
      }
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) throw new Error('The website could not be opened. Check your browser popup settings.');
    } catch (error) {
      console.error('[Settings] Could not open social platform website:', error);
      setConnectionsError(error instanceof Error ? error.message : 'Could not open that website.');
    }
  };

  const openSocialSignIn = (provider: (typeof SOCIAL_PROVIDERS)[number]) => {
    setSocialLoadError('');
    setSocialCurrentUrl(provider.url);
    setSelectedSocialProvider(provider);
  };

  /* ==========================================================
     HEADER
  ========================================================== */

  const currentNav = NAV_ITEMS.find(
    item => item.id === activeTab,
  );

  /* ==========================================================
     RENDER
  ========================================================== */


  const [batteryPercentage, setBatteryPercentage] = useState<number>( Math.max( 0, Math.min( 100, settings.batteryLevel ?? 0, ), ), ); const [batteryCharging, setBatteryCharging] = useState<boolean>( settings.batteryCharging ?? false, ); useEffect(() => { let batteryManager: BatteryManager | null = null; const updateBattery = () => { if (!batteryManager) return; const percentage = Math.round( batteryManager.level * 100, ); const charging = batteryManager.charging; setBatteryPercentage(percentage); setBatteryCharging(charging); updateSettings({ batteryLevel: percentage, batteryCharging: charging, }); }; const setupBattery = async () => { try { if ( typeof navigator === 'undefined' || !('getBattery' in navigator) ) { return; } batteryManager = await ( navigator as Navigator & { getBattery: () => Promise<BatteryManager>; } ).getBattery(); updateBattery(); batteryManager.addEventListener( 'levelchange', updateBattery, ); batteryManager.addEventListener( 'chargingchange', updateBattery, ); } catch (error) { console.warn( 'Unable to read real laptop battery:', error, ); } }; setupBattery(); return () => { if (!batteryManager) return; batteryManager.removeEventListener( 'levelchange', updateBattery, ); batteryManager.removeEventListener( 'chargingchange', updateBattery, ); }; }, [updateSettings]);
  useEffect(() => {
    setBatteryPercentage(settings.batteryLevel);
    setBatteryCharging(settings.batteryCharging);
  }, [settings.batteryLevel, settings.batteryCharging]);

  return (
    <div
      data-theme={resolvedTheme}
      className="
        settings-app-root
        flex-1
        flex
        h-full
        min-h-0
        bg-[#070b12]
        select-none
        overflow-hidden
        text-white
        relative
      "
    >
      {/* ======================================================
          AMBIENT 3D BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -25, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute
            -top-32
            -left-32
            w-96
            h-96
            rounded-full
            bg-sky-500/10
            blur-3xl
          "
        />

        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 35, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute
            -bottom-40
            right-0
            w-[500px]
            h-[500px]
            rounded-full
            bg-indigo-600/10
            blur-3xl
          "
        />

        <div
          className="
            absolute inset-0
            opacity-[0.025]
            bg-[linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)]
            bg-[size:40px_40px]
          "
        />
      </div>

      {/* ======================================================
          MOBILE TOP BAR
      ====================================================== */}

      <div
        className="
          md:hidden
          absolute
          top-0
          left-0
          right-0
          z-40
          h-16
          px-4
          flex
          items-center
          justify-between
          bg-black/40
          backdrop-blur-2xl
          border-b border-white/10
        "
      >
        <button
          type="button"
          onClick={() =>
            setShowMobileNav(prev => !prev)
          }
          className="
            flex items-center gap-2
            px-3 py-2
            rounded-xl
            bg-white/10
            border border-white/10
          "
        >
          <SlidersHorizontal className="w-4 h-4" />

          <span className="text-xs font-semibold">
            Settings
          </span>
        </button>

        <div className="text-xs font-bold text-slate-300">
          {currentNav?.label}
        </div>
      </div>

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          ${
            showMobileNav
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'
          }
          fixed md:relative
          z-50
          md:z-10
          top-0
          bottom-0
          left-0
          w-72
          md:w-64
          shrink-0
          border-r
          border-white/10
          bg-[#0b1018]/95
          md:bg-white/[0.035]
          backdrop-blur-3xl
          p-4
          flex
          flex-col
          transition-transform
          duration-300
          overflow-hidden
        `}
      >
        {/* Sidebar title */}

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-black tracking-tight">
              Settings
            </div>

            <div className="text-[10px] text-slate-500 mt-0.5">
              ARLO OS
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowMobileNav(false)
            }
            className="md:hidden w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User mini profile */}

        <motion.div
          whileHover={{
            scale: 1.02,
            y: -1,
          }}
          className="
            relative
            p-3
            rounded-2xl
            bg-gradient-to-br
            from-white/10
            to-white/[0.035]
            border border-white/10
            mb-4
            overflow-hidden
          "
        >
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-sky-500/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div
              className="
                w-11 h-11
                rounded-2xl
                overflow-hidden
                bg-gradient-to-br
                from-sky-500
                via-blue-600
                to-indigo-700
                flex
                items-center
                justify-center
                font-bold
                shadow-xl
                shadow-blue-500/20
                shrink-0
              "
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="User"
                  className={`w-full h-full object-cover ${user.avatarType === 'preset' ? 'object-[center_25%]' : 'object-center'}`}
                />
              ) : (
                user.fullName
                  ?.charAt(0)
                  ?.toUpperCase() || 'A'
              )}
            </div>

            <div className="min-w-0">
              <div className="font-bold text-xs truncate">
                {user.fullName}
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                @{user.username}
              </div>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-500 ml-auto" />
          </div>
        </motion.div>

        {/* Search */}

        <div className="relative mb-4">
          <Search
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              w-3.5
              h-3.5
              text-slate-500
            "
          />

          <input
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
            placeholder="Search settings..."
            className="
              w-full
              h-9
              pl-9
              pr-3
              rounded-xl
              bg-white/[0.06]
              border border-white/10
              outline-none
              text-xs
              text-white
              placeholder:text-slate-600
              focus:border-sky-400/50
              transition-colors
            "
          />
        </div>

        {/* Navigation */}

        <div className="flex-1 overflow-y-auto pr-1 space-y-1">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() =>
                  changeTab(item.id)
                }
                whileHover={{
                  x: 2,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className={`
                  relative
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3
                  py-2.5
                  rounded-xl
                  text-left
                  transition-all
                  ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-active"
                    className="
                      absolute
                      inset-0
                      rounded-xl
                      bg-gradient-to-r
                      from-sky-500
                      to-blue-600
                      shadow-lg
                      shadow-sky-500/20
                    "
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3 w-full">
                  <Icon
                    className={`
                      w-4 h-4 shrink-0
                      ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500'
                      }
                    `}
                  />

                  <span className="truncate text-xs font-medium">
                    {item.label}
                  </span>

                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}

        <div className="pt-4 mt-3 border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-600">
            <Sparkles className="w-3 h-3" />
            ARLO OS {appVersion} Pro
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}

      <AnimatePresence>
        {showMobileNav && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setShowMobileNav(false)
            }
            className="
              md:hidden
              fixed
              inset-0
              z-40
              bg-black/60
              backdrop-blur-sm
            "
            aria-label="Close settings navigation"
          />
        )}
      </AnimatePresence>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main
        className="
          relative
          flex-1
          min-w-0
          min-h-0
          overflow-y-auto
          pt-16
          md:pt-0
        "
      >
        <div
          className="
            max-w-5xl
            mx-auto
            px-4
            sm:px-6
            lg:px-10
            py-6
            md:py-8
          "
        >
          <AnimatePresence mode="wait">
            {/* =================================================
                PROFILE
            ================================================= */}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <PageHeader
                  title="User Profile"
                  description="Manage your ARLO OS identity, profile picture and personal information."
                  icon={UserRound}
                />

                {/* Hero profile */}

                <SectionCard className="p-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />

                  <div className="relative flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                    <motion.div
                      initial={{
                        rotateY: -15,
                        rotateX: 8,
                      }}
                      animate={{
                        rotateY: 0,
                        rotateX: 0,
                      }}
                      whileHover={{
                        rotateY: 8,
                        rotateX: -5,
                        scale: 1.04,
                      }}
                      style={{
                        transformStyle: 'preserve-3d',
                      }}
                      className="
                        relative
                        w-36
                        h-36
                        shrink-0
                      "
                    >
                      <div
                        className="
                          absolute
                          inset-2
                          rounded-[2rem]
                          bg-sky-500/30
                          blur-2xl
                        "
                      />

                      <div
                        className="
                          relative
                          w-full
                          h-full
                          rounded-[2rem]
                          overflow-hidden
                          border
                          border-white/20
                          bg-gradient-to-br
                          from-sky-500
                          via-blue-600
                          to-indigo-800
                          shadow-2xl
                        "
                      >
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt="Profile"
                            className={`w-full h-full object-cover ${user.avatarType === 'preset' ? 'object-[center_25%]' : 'object-center'}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-6xl font-black">
                            {user.fullName
                              ?.charAt(0)
                              ?.toUpperCase() || 'A'}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/30 pointer-events-none" />
                      </div>

                      <motion.button
                        type="button"
                        whileHover={{
                          scale: 1.12,
                          rotate: 5,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={() =>
                          avatarInputRef.current?.click()
                        }
                        className="
                          absolute
                          -right-2
                          -bottom-2
                          w-11
                          h-11
                          rounded-2xl
                          bg-sky-500
                          border-4
                          border-[#090e15]
                          flex
                          items-center
                          justify-center
                          shadow-xl
                        "
                      >
                        <Camera className="w-4 h-4" />
                      </motion.button>
                    </motion.div>

                    <div className="flex-1 min-w-0 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[10px] font-bold mb-3">
                        <CheckCircle2 className="w-3 h-3" />
                        PERSONAL PROFILE
                      </div>

                      <h3 className="text-2xl font-black truncate">
                        {user.displayName ||
                          user.fullName ||
                          'Abhishek'}
                      </h3>

                      <p className="text-xs text-slate-400 mt-1">
                        @{user.username}
                      </p>

                      <p className="text-xs text-slate-300 mt-4 max-w-xl leading-relaxed">
                        {user.bio ||
                          'Create your personal identity inside ARLO OS.'}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-5 justify-center lg:justify-start">
                        <button
                          type="button"
                          onClick={() =>
                            avatarInputRef.current?.click()
                          }
                          className="
                            px-4
                            py-2
                            rounded-xl
                            bg-sky-500
                            hover:bg-sky-400
                            text-xs
                            font-bold
                            flex
                            items-center
                            gap-2
                            shadow-lg
                            shadow-sky-500/20
                            transition-colors
                          "
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Change Picture
                        </button>

                        {user.avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="
                              px-4
                              py-2
                              rounded-xl
                              bg-rose-500/10
                              border
                              border-rose-400/20
                              text-rose-300
                              text-xs
                              font-bold
                              flex
                              items-center
                              gap-2
                              hover:bg-rose-500/20
                              transition-colors
                            "
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </SectionCard>

                {/* Account details */}

                <SectionCard className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-sky-400" />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm">
                        Personal Information
                      </h3>

                      <p className="text-[10px] text-slate-500">
                        Update how your identity appears across the OS.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Full Name
                      </label>

                      <input
                        type="text"
                        value={user.fullName}
                        onChange={e =>
                          updateUser({
                            fullName: e.target.value,
                          })
                        }
                        className="
                          mt-2
                          w-full
                          p-3
                          rounded-xl
                          bg-black/20
                          border border-white/10
                          outline-none
                          focus:border-sky-400/60
                          text-sm
                          text-white
                        "
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Display Name
                      </label>

                      <input
                        type="text"
                        value={user.displayName}
                        onChange={e =>
                          updateUser({
                            displayName: e.target.value,
                          })
                        }
                        className="
                          mt-2
                          w-full
                          p-3
                          rounded-xl
                          bg-black/20
                          border border-white/10
                          outline-none
                          focus:border-sky-400/60
                          text-sm
                          text-white
                        "
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Email Address
                      </label>

                      <input
                        type="email"
                        value={user.email}
                        onChange={e =>
                          updateUser({
                            email: e.target.value,
                          })
                        }
                        autoComplete="email"
                        className="
                          mt-2
                          w-full
                          p-3
                          rounded-xl
                          bg-black/20
                          border border-white/10
                          outline-none
                          focus:border-sky-400/60
                          text-sm
                          text-white
                        "
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Bio / Status
                      </label>

                      <textarea
                        value={user.bio}
                        onChange={e =>
                          updateUser({
                            bio: e.target.value,
                          })
                        }
                        rows={3}
                        className="
                          mt-2
                          w-full
                          p-3
                          rounded-xl
                          bg-black/20
                          border border-white/10
                          outline-none
                          focus:border-sky-400/60
                          text-sm
                          text-white
                          resize-none
                        "
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Screen Lock Password
                      </label>

                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                        <input
                          type={showLockPassword ? 'text' : 'password'}
                          value={user.pin}
                          onChange={e =>
                            updateUser({
                              pin: e.target.value,
                            })
                          }
                          maxLength={64}
                          autoComplete="new-password"
                          className="
                            w-full
                            p-3
                            pl-10
                            pr-11
                            rounded-xl
                            bg-black/20
                            border border-white/10
                            outline-none
                            focus:border-sky-400/60
                            text-sm
                            text-white
                            font-mono
                            tracking-widest
                          "
                        />
                        <button
                          type="button"
                          aria-label={showLockPassword ? 'Hide screen lock password' : 'Show screen lock password'}
                          aria-pressed={showLockPassword}
                          onClick={() => setShowLockPassword(visible => !visible)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
                        >
                          {showLockPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-2xl">
                      <h3 className="text-sm font-bold text-white">Optional cloud profile</h3>
                      <p className="mt-1 text-[10px] leading-4 text-slate-400">
                        Choosing this button shares your name, display name, selected roles, email, and profile photo with the ARLO OS project administrator. Your screen-lock password is never sent. A different email gets its own dashboard entry; syncing the same email updates that entry. Approximate location may be inferred from your connection.
                      </p>
                      {cloudProfileMessage && (
                        <p className="mt-2 text-[10px] leading-4 text-slate-300" role="status">
                          {cloudProfileMessage}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void syncCurrentProfileToCloud()}
                      disabled={cloudProfileBusy}
                      className="shrink-0 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {cloudProfileBusy ? 'Saving profile…' : 'Share and sync my profile'}
                    </button>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                APPEARANCE
            ================================================= */}

            {activeTab === 'appearance' && (
              <motion.div
                key="appearance"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <PageHeader
                  title="Appearance"
                  description="Customize the visual identity of ARLO OS."
                  icon={Palette}
                />

                <SectionCard className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <Palette className="w-5 h-5 text-sky-400" />

                    <div>
                      <h3 className="font-bold text-sm">
                        Theme Mode
                      </h3>

                      <p className="text-[10px] text-slate-500">
                        Choose how the operating system looks.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      ['dark', 'light', 'auto'] as ThemeMode[]
                    ).map(mode => (
                      <motion.button
                        key={mode}
                        type="button"
                        whileHover={{
                          y: -4,
                          scale: 1.02,
                        }}
                        whileTap={{
                          scale: 0.97,
                        }}
                        onClick={() => {
                          updateSettings({
                            theme: mode,
                          });

                          sound.playToggle(
                            mode === 'dark',
                          );
                        }}
                        className={`
                          relative
                          overflow-hidden
                          h-28
                          rounded-2xl
                          border
                          ${
                            settings.theme === mode
                              ? 'border-sky-400 shadow-xl shadow-sky-500/20'
                              : 'border-white/10'
                          }
                          ${
                            mode === 'dark'
                              ? 'bg-[#070b12]'
                              : mode === 'light'
                                ? 'bg-slate-200'
                                : 'bg-gradient-to-br from-slate-900 via-slate-500 to-slate-100'
                          }
                        `}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent" />

                        <div
                          className={`
                            relative
                            z-10
                            h-full
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-2
                            ${
                              mode === 'light'
                                ? 'text-slate-900'
                                : 'text-white'
                            }
                          `}
                        >
                          <Monitor className="w-6 h-6" />

                          <span className="text-xs font-bold capitalize">
                            {mode}
                          </span>

                          {settings.theme === mode && (
                            <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-sky-400" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard className="p-6">
                  <h3 className="font-bold text-sm mb-2">
                    Accent Color
                  </h3>

                  <p className="text-[10px] text-slate-500 mb-5">
                    Select the primary highlight color used throughout the OS.
                  </p>

                  <div className="flex flex-wrap gap-5">
                    {ACCENTS.map(acc => (
                      <motion.button
                        key={acc.id}
                        type="button"
                        whileHover={{
                          scale: 1.15,
                          y: -3,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={() => {
                          updateSettings({
                            accent: acc.id,
                          });

                          sound.playClick();
                        }}
                        title={acc.label}
                        className={`
                          relative
                          w-12
                          h-12
                          rounded-2xl
                          flex
                          items-center
                          justify-center
                          transition-all
                          ${
                            settings.accent === acc.id
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-[#070b12] shadow-xl'
                              : ''
                          }
                        `}
                        style={{
                          background: acc.color,
                        }}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-black/20" />

                        {settings.accent === acc.id && (
                          <Check className="relative w-5 h-5 text-white drop-shadow" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard id="arlo-mascot-settings" className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Sparkles className="h-4 w-4 text-sky-400" />
                        ARLO OS mascot
                      </div>
                      <p className="mt-1 max-w-xl text-[10px] leading-relaxed text-slate-500">
                        Choose from 23 original character designs—including the original blue mascot—with 10 expressions per design. The companion uses the selected design on your desktop.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 sm:self-auto">
                      <MascotMark
                        className="h-14 w-14"
                        styleId={selectedMascotStyle}
                        color={settings.mascotColor}
                        hairStyle={companionConfig.hair}
                        accessory={companionConfig.accessory}
                      />
                      <div>
                        <div className="text-[10px] font-bold text-white">
                          {MASCOT_FAMILY_NAMES[Math.floor(selectedMascotStyle / MASCOT_VARIATIONS.length)]}
                        </div>
                        <div className="mt-0.5 text-[10px] capitalize text-slate-400">
                          {MASCOT_VARIATIONS[selectedMascotStyle % MASCOT_VARIATIONS.length]} expression
                        </div>
                        <div className="mt-1 font-mono text-[9px] text-slate-500">
                          Style {String(selectedMascotStyle + 1).padStart(3, '0')} / {MASCOT_STYLE_COUNT}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateSettings({ mascotStyle: 0, mascotColor: '#159eff' });
                            setMascotPage(0);
                            sound.playClick();
                          }}
                          className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-sky-300 transition-colors hover:text-sky-200"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                          Reset default
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Mascot color</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">Choose a preset or use the color picker for any color.</div>
                    </div>
                    <label className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] text-slate-300">
                      <span>Custom color</span>
                      <input
                        type="color"
                        value={settings.mascotColor}
                        onChange={event => updateSettings({ mascotColor: event.target.value })}
                        aria-label="Choose any mascot color"
                        className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2" aria-label="Mascot color presets">
                    {MASCOT_COLOR_SWATCHES.map(swatch => (
                      <motion.button
                        key={swatch}
                        type="button"
                        aria-label={`Set mascot color ${swatch}`}
                        aria-pressed={settings.mascotColor.toLowerCase() === swatch}
                        title={swatch}
                        whileHover={{ scale: 1.12, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          updateSettings({ mascotColor: swatch });
                          sound.playClick();
                        }}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-shadow ${
                          settings.mascotColor.toLowerCase() === swatch
                            ? 'border-white/90 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]'
                            : 'border-white/15'
                        }`}
                        style={{ backgroundColor: swatch }}
                      >
                        {settings.mascotColor.toLowerCase() === swatch && (
                          <Check className="h-4 w-4 text-white drop-shadow" />
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                    <div className="text-[10px] text-slate-400">
                      Family {mascotPage + 1} of {MASCOT_FAMILY_NAMES.length} · {MASCOT_FAMILY_NAMES[mascotPage]} · 10 expressions
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMascotPage(page => Math.max(0, page - 1))}
                        disabled={mascotPage === 0}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        Previous
                      </button>
                      <span className="min-w-12 text-center text-[10px] font-mono text-slate-500">
                        {mascotPage + 1} / {MASCOT_FAMILY_NAMES.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMascotPage(page => Math.min(MASCOT_FAMILY_NAMES.length - 1, page + 1))}
                        disabled={mascotPage >= MASCOT_FAMILY_NAMES.length - 1}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mascotPage}
                    initial={{ opacity: 0, x: 12, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -8, filter: 'blur(2px)' }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5"
                  >
                    {Array.from({ length: MASCOT_VARIATIONS.length }, (_, index) => mascotPage * MASCOT_VARIATIONS.length + index).map(styleId => {
                      const familyIndex = Math.floor(styleId / MASCOT_VARIATIONS.length);
                      const variantIndex = styleId % MASCOT_VARIATIONS.length;
                      const family = MASCOT_FAMILY_NAMES[familyIndex];
                      const mood = MASCOT_VARIATIONS[variantIndex];
                      const selected = selectedMascotStyle === styleId;

                      return (
                        <motion.button
                          key={styleId}
                          type="button"
                          aria-label={`Choose ${family}, ${mood} expression`}
                          aria-pressed={selected}
                          whileHover={{ y: -2, scale: 1.025 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                          onClick={() => {
                            updateSettings({ mascotStyle: styleId });
                            sound.playClick();
                          }}
                          className={`group relative flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border p-2 text-left transition-[border-color,background-color,box-shadow] duration-200 ${
                            selected
                              ? 'border-sky-400/70 bg-gradient-to-br from-sky-500/[0.16] to-indigo-500/[0.06] shadow-[0_0_22px_rgba(56,189,248,0.12)]'
                              : 'border-white/[0.08] bg-white/[0.025] hover:border-sky-300/35 hover:bg-white/[0.055] hover:shadow-[0_8px_24px_rgba(2,8,23,0.22)]'
                          }`}
                        >
                          {selected && <motion.span layoutId="mascot-selected-glow" className="pointer-events-none absolute inset-y-2 left-0 w-0.5 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.75)]" />}
                          <MascotMark
                            className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-110"
                            interactive={false}
                            styleId={styleId}
                            color={settings.mascotColor}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[9px] font-bold text-slate-200">
                              {mood}
                            </span>
                            <span className="mt-0.5 block truncate text-[9px] capitalize text-slate-500">
                              {family}
                            </span>
                          </span>
                          {selected && <Check className="ml-auto h-3 w-3 shrink-0 text-sky-300" />}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                  </AnimatePresence>
                </SectionCard>

                <SectionCard className="space-y-4 p-5 sm:p-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="h-4 w-4 text-violet-300" />
                      Companion actions & styling
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      Pick from 100 animated moments, then customize the desktop companion’s hair, outfit, and accessory. Pause or resume its animation from the companion’s right-click menu.
                    </p>
                  </div>
                  <label className="block text-[10px] font-semibold text-slate-300">
                    Desktop action
                    <select
                      value={companionConfig.actionId}
                      onChange={event => updateCompanion({ actionId: event.target.value, paused: false })}
                      className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none focus:border-sky-400/50"
                    >
                      {Array.from(new Set(MASCOT_ACTIONS.map(action => action.category))).map(category => (
                        <optgroup key={category} label={category}>
                          {MASCOT_ACTIONS.filter(action => action.category === category).map(action => (
                            <option key={action.id} value={action.id}>{action.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="text-[10px] font-semibold text-slate-300">
                      Hair
                      <select
                        value={companionConfig.hair}
                        onChange={event => updateCompanion({ hair: event.target.value as MascotCompanionConfig['hair'] })}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-sky-400/50"
                      >
                        <option value="soft">Soft</option>
                        <option value="spiky">Spiky</option>
                        <option value="curly">Curly</option>
                        <option value="none">No hair</option>
                      </select>
                    </label>
                    <label className="text-[10px] font-semibold text-slate-300">
                      Outfit
                      <select
                        value={companionConfig.outfit}
                        onChange={event => updateCompanion({ outfit: event.target.value as MascotCompanionConfig['outfit'] })}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-sky-400/50"
                      >
                        <option value="classic">Classic</option>
                        <option value="hoodie">Hoodie</option>
                        <option value="sport">Sportswear</option>
                        <option value="formal">Formal</option>
                      </select>
                    </label>
                    <label className="text-[10px] font-semibold text-slate-300">
                      Accessory
                      <select
                        value={companionConfig.accessory}
                        onChange={event => updateCompanion({ accessory: event.target.value as MascotCompanionConfig['accessory'] })}
                        className="mt-1.5 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-sky-400/50"
                      >
                        <option value="none">None</option>
                        <option value="glasses">Glasses</option>
                        <option value="headphones">Headphones</option>
                        <option value="crown">Crown</option>
                      </select>
                    </label>
                  </div>
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Sparkles}
                    title="Vibrant Glass Effects"
                    description="Enable glass reflections, blur and depth effects throughout the interface."
                  >
                    <Toggle
                      enabled={
                        !!settings.glassEffects
                      }
                      onChange={() =>
                        updateSettings({
                          glassEffects:
                            !settings.glassEffects,
                        })
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard className="space-y-5 p-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Type className="h-4 w-4 text-sky-400" />
                      Desktop font
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Choose from 16 additional system fonts. Changes apply immediately throughout the desktop.
                    </p>
                    <select
                      value={settings.fontFamily}
                      onChange={event => updateSettings({ fontFamily: event.target.value })}
                      className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400/50"
                    >
                      {FONT_FAMILIES.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-white/10 pt-5">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <MousePointer2 className="h-4 w-4 text-sky-400" />
                      Cursor style and color
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {([
                        ['system', 'System'],
                        ['arrow', 'Colored arrow'],
                        ['crosshair', 'Crosshair'],
                      ] as [CursorStyle, string][]).map(([style, label]) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => updateSettings({ cursorStyle: style })}
                          className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                            settings.cursorStyle === style
                              ? 'border-sky-400/60 bg-sky-500/15 text-sky-200'
                              : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <label className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-300">
                      <span>Cursor color</span>
                      <input
                        type="color"
                        value={settings.cursorColor}
                        onChange={event => updateSettings({ cursorColor: event.target.value })}
                        aria-label="Choose cursor color"
                        className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
                      />
                    </label>
                  </div>
                </SectionCard>

                <SectionCard className="p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <Layout className="mt-0.5 h-5 w-5 text-sky-400" />
                    <div>
                      <h3 className="text-sm font-bold">Custom desktop layout</h3>
                      <p className="mt-1 text-[10px] text-slate-500">Drag each bar onto an edge, or choose an edge below. Side positions automatically become vertical.</p>
                    </div>
                  </div>
                  <div className="relative mx-auto mb-4 h-36 max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950">
                    <div className="absolute inset-5 rounded-xl border border-white/10 bg-white/[0.025]" />
                    <div
                      draggable
                      onDragStart={event => event.dataTransfer.setData('text/plain', 'menuBar')}
                      title="Drag the menu bar to a screen edge"
                      className={`absolute z-30 flex cursor-grab items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-sky-500 text-[8px] font-bold text-white shadow-lg active:cursor-grabbing ${
                        settings.menuBarPosition === 'left' || settings.menuBarPosition === 'right'
                          ? `top-3 bottom-3 w-3 ${settings.menuBarPosition === 'left' ? 'left-1' : 'right-1'}`
                          : `left-8 right-8 h-3 ${settings.menuBarPosition === 'top' ? 'top-1' : 'bottom-1'}`
                      }`}
                    >
                      {settings.menuBarPosition === 'left' || settings.menuBarPosition === 'right' ? '' : 'MENU BAR'}
                    </div>
                    <div
                      draggable
                      onDragStart={event => event.dataTransfer.setData('text/plain', 'dock')}
                      title="Drag the dock to a screen edge"
                      className={`absolute z-30 flex cursor-grab items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-[8px] font-bold text-white shadow-lg active:cursor-grabbing ${
                        settings.dockPosition === 'left' || settings.dockPosition === 'right'
                          ? `top-7 bottom-7 w-3 ${settings.dockPosition === 'left' ? 'left-5' : 'right-5'}`
                          : `left-12 right-12 h-3 ${settings.dockPosition === 'top' ? 'top-5' : 'bottom-5'}`
                      }`}
                    >
                      {settings.dockPosition === 'left' || settings.dockPosition === 'right' ? '' : 'DOCK'}
                    </div>
                    {LAYOUT_POSITIONS.map(position => (
                      <div
                        key={position.id}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                          event.preventDefault();
                          const bar = event.dataTransfer.getData('text/plain');
                          if (bar === 'menuBar') updateSettings({ menuBarPosition: position.id });
                          if (bar === 'dock') updateSettings({ dockPosition: position.id });
                        }}
                        className={`absolute z-20 flex items-center justify-center text-[8px] font-bold text-white/70 ${
                          position.id === 'top' ? 'inset-x-8 top-0 h-5' :
                          position.id === 'bottom' ? 'inset-x-8 bottom-0 h-5' :
                          position.id === 'left' ? 'inset-y-5 left-0 w-5' : 'inset-y-5 right-0 w-5'
                        }`}
                      >
                        <span className={`rounded-md px-1 py-0.5 ${
                          settings.menuBarPosition === position.id || settings.dockPosition === position.id
                            ? 'bg-white/15'
                            : 'opacity-0'
                        }`}>{position.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {([
                      ['Menu bar', 'menuBarPosition'],
                      ['Dock', 'dockPosition'],
                    ] as const).map(([label, settingKey]) => (
                      <label key={settingKey} className="text-[10px] font-semibold text-slate-400">
                        {label} position
                        <select
                          value={settings[settingKey]}
                          onChange={event => updateSettings({ [settingKey]: event.target.value as DockPosition })}
                          className="mt-1.5 w-full rounded-lg border border-white/10 bg-slate-900 px-2.5 py-2 text-xs text-white outline-none focus:border-sky-400/50"
                        >
                          {LAYOUT_POSITIONS.map(position => <option key={position.id} value={position.id}>{position.label}</option>)}
                        </select>
                      </label>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                THEMES
            ================================================= */}

            {activeTab === 'themes' && (
              <motion.div
                key="themes"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <PageHeader
                  title="Themes"
                  description="Choose an immersive visual language for the entire ARLO OS experience. Every selection updates the desktop UI globally and is remembered."
                  icon={Sparkles}
                />

                <SectionCard className="overflow-hidden p-0">
                  <div className="relative overflow-hidden p-5 sm:p-6">
                    <motion.div
                      aria-hidden="true"
                      animate={{
                        x: [0, 35, 0],
                        y: [0, -18, 0],
                        scale: [1, 1.12, 1],
                      }}
                      transition={{
                        duration: 9,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-3xl"
                      style={{
                        background: activeUITheme.accent,
                        opacity: 0.18,
                      }}
                    />

                    <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0">
                        <div
                          className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[.18em]"
                          style={{
                            color: activeUITheme.accent,
                            borderColor: `${activeUITheme.accent}35`,
                            background: `${activeUITheme.accent}12`,
                          }}
                        >
                          <Layers3 className="h-3 w-3" />
                          Active visual system
                        </div>

                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{
                              rotate: [0, 6, -6, 0],
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                            style={{
                              background: `linear-gradient(135deg, ${activeUITheme.accent}, ${activeUITheme.accent2})`,
                              borderColor: `${activeUITheme.text}20`,
                              boxShadow: `0 18px 45px ${activeUITheme.accent}30`,
                              color: activeUITheme.onAccent,
                            }}
                          >
                            <Sparkles className="h-6 w-6" />
                          </motion.div>

                          <div className="min-w-0">
                            <h3
                              className="truncate text-2xl font-black tracking-tight"
                              style={{ color: activeUITheme.text }}
                            >
                              {activeUITheme.name}
                            </h3>
                            <p
                              className="mt-1 text-[10px]"
                              style={{ color: activeUITheme.muted }}
                            >
                              Select a theme to apply it across the desktop. Your original ARLO OS design stays unchanged until you choose one.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                        {selectedThemeId && (
                          <motion.button
                            type="button"
                            whileHover={{ y: -1, scale: 1.01 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleThemeReset}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-[10px] font-black uppercase tracking-[.12em] transition-all"
                            style={{
                              color: activeUITheme.text,
                              borderColor: `${activeUITheme.text}18`,
                              background: `${activeUITheme.panel}cc`,
                            }}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Original Desktop
                          </motion.button>
                        )}

                        <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: activeUITheme.muted }} />
                        <input
                          value={themeSearch}
                          onChange={event => setThemeSearch(event.target.value)}
                          placeholder="Search 29 themes..."
                          className="h-11 w-full rounded-2xl border pl-10 pr-10 text-xs font-semibold outline-none transition-all"
                          style={{
                            background: `${activeUITheme.panel}cc`,
                            color: activeUITheme.text,
                            borderColor: `${activeUITheme.text}18`,
                          }}
                        />
                        {themeSearch && (
                          <button
                            type="button"
                            onClick={() => setThemeSearch('')}
                            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl"
                            style={{
                              color: activeUITheme.muted,
                              background: `${activeUITheme.text}08`,
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredThemes.map(theme => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      selected={selectedThemeId === theme.id}
                      onSelect={() => handleThemeSelect(theme)}
                    />
                  ))}
                </div>

                {filteredThemes.length === 0 && (
                  <SectionCard className="p-12 text-center">
                    <SearchX
                      className="mx-auto h-8 w-8"
                      style={{ color: activeUITheme.accent }}
                    />
                    <div
                      className="mt-3 text-sm font-black"
                      style={{ color: activeUITheme.text }}
                    >
                      No themes found
                    </div>
                    <div
                      className="mt-1 text-[10px]"
                      style={{ color: activeUITheme.muted }}
                    >
                      Try a different theme name.
                    </div>
                  </SectionCard>
                )}
              </motion.div>
            )}

            {/* =================================================
                WALLPAPER
            ================================================= */}

            {activeTab === 'wallpaper' && (
              <motion.div
                key="wallpaper"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <PageHeader
                    title="Wallpaper"
                    description="Transform your desktop with immersive wallpapers and custom images."
                    icon={ImageIcon}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      wallpaperInputRef.current?.click()
                    }
                    className="
                      px-4
                      py-2.5
                      rounded-xl
                      bg-sky-500
                      hover:bg-sky-400
                      text-xs
                      font-bold
                      flex
                      items-center
                      justify-center
                      gap-2
                      shadow-lg
                      shadow-sky-500/20
                      transition-colors
                    "
                  >
                    <Upload className="w-4 h-4" />
                    Import to Photos
                  </button>

                  <input
                    ref={wallpaperInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomWallpaper}
                    className="hidden"
                  />
                </div>

                {/* Current wallpaper */}

                <SectionCard className="p-0 overflow-hidden">
                  <div className="relative h-64 sm:h-80">
                    <img
                      src={currentWallpaper.url}
                      alt={currentWallpaper.name}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                    <div className="absolute left-6 bottom-6 right-6 flex items-end justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[9px] font-bold mb-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ACTIVE WALLPAPER
                        </div>

                        <h3 className="text-xl font-black">
                          {currentWallpaper.name}
                        </h3>

                        <p className="text-xs text-slate-300 mt-1">
                          Currently applied to your desktop
                        </p>
                      </div>

                      <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 items-center justify-center">
                        <Monitor className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Photos information */}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SectionCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-sky-400" />
                      </div>

                      <div>
                        <div className="text-lg font-black">
                          {WALLPAPERS.length}
                        </div>

                        <div className="text-[10px] text-slate-500">
                          System Wallpapers
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <Camera className="w-4 h-4 text-purple-400" />
                      </div>

                      <div>
                        <div className="text-lg font-black">
                          {photoCount}
                        </div>

                        <div className="text-[10px] text-slate-500">
                          Photos Library
                        </div>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                        <Save className="w-4 h-4 text-emerald-400" />
                      </div>

                      <div>
                        <div className="text-sm font-black">
                          Auto Saved
                        </div>

                        <div className="text-[10px] text-slate-500">
                          Imported images persist locally
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* Wallpaper grid */}

                <SectionCard className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-sm">
                        Curated Wallpapers
                      </h3>

                      <p className="text-[10px] text-slate-500 mt-1">
                        Choose a wallpaper for your desktop.
                      </p>
                    </div>

                    <Sparkles className="w-4 h-4 text-sky-400" />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {WALLPAPERS.map(wp => {
                      const isActive =
                        currentWallpaper.id === wp.id;

                      return (
                        <motion.button
                          key={wp.id}
                          type="button"
                          whileHover={{
                            y: -6,
                            scale: 1.025,
                          }}
                          whileTap={{
                            scale: 0.98,
                          }}
                          onClick={() => {
                            setWallpaper(wp);
                            sound.playClick();
                          }}
                          className={`
                            group
                            relative
                            aspect-video
                            rounded-2xl
                            overflow-hidden
                            border-2
                            ${
                              isActive
                                ? 'border-sky-400 shadow-xl shadow-sky-500/20'
                                : 'border-white/10'
                            }
                          `}
                        >
                          <img
                            src={wp.thumbnail}
                            alt={wp.name}
                            className="
                              w-full
                              h-full
                              object-cover
                              transition-transform
                              duration-500
                              group-hover:scale-110
                            "
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                          <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {wp.name}
                            </span>

                            {isActive && (
                              <div className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center shrink-0 shadow-lg">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                DOCK
            ================================================= */}

            {activeTab === 'dock' && (
              <motion.div
                key="dock"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Dock & Menu Bar"
                  description="Choose which apps appear in your Dock and customize its behavior."
                  icon={Layout}
                />

                <SectionCard className="p-6">
                  <SettingRow
                    icon={Layout}
                    title="Dock Magnification"
                    description="Magnify dock icons when the pointer moves across them."
                  >
                    <Toggle
                      enabled={
                        !!settings.dockMagnification
                      }
                      onChange={() =>
                        updateSettings({
                          dockMagnification:
                            !settings.dockMagnification,
                        })
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={RefreshCw}
                    title="24-Hour Clock"
                    description="Use a 24-hour clock in the top menu bar."
                  >
                    <Toggle
                      enabled={!!settings.clock24h}
                      onChange={() =>
                        updateSettings({
                          clock24h:
                            !settings.clock24h,
                        })
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard className="p-5">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-bold">Apps in your Dock</div>
                      <p className="mt-1 text-xs text-slate-500">
                        Add your favorite apps to the bottom Dock, or remove ones you no longer need.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full border border-sky-400/20 bg-sky-400/[0.08] px-3 py-1.5 text-[10px] font-bold text-sky-300">
                        {pinnedDockAppsCount} in Dock
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold text-slate-400">
                        {dockApps.length - pinnedDockAppsCount} available
                      </span>
                    </div>
                  </div>

                  <label className="relative mb-4 block">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="search"
                      value={dockAppSearch}
                      onChange={event => setDockAppSearch(event.target.value)}
                      placeholder="Find an installed app..."
                      aria-label="Search installed apps"
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-xs text-white outline-none transition-colors placeholder:text-slate-600 focus:border-sky-400/40 focus:bg-black/30"
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {filteredDockApps.map((app, index) => {
                        const isPinned = dockAppIds.includes(app.id);

                        return (
                          <motion.div
                            key={app.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{
                              duration: 0.2,
                              delay: Math.min(index * 0.025, 0.2),
                            }}
                            className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 transition-colors ${
                              isPinned
                                ? 'border-sky-400/20 bg-sky-400/[0.045]'
                                : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg"
                              style={{ background: app.iconBg }}
                            >
                              <AppIcon
                                appId={app.id}
                                className="h-full w-full object-contain p-1"
                                fallback={
                                  <span
                                    className="text-sm font-black"
                                    style={{ color: app.iconColor }}
                                  >
                                    {app.name.charAt(0)}
                                  </span>
                                }
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-bold text-white">
                                {app.name}
                              </div>
                              <div className="mt-1 truncate text-[10px] capitalize text-slate-500">
                                {app.category}
                              </div>
                            </div>

                            <motion.button
                              type="button"
                              whileTap={{ scale: 0.92 }}
                              whileHover={{ scale: 1.04 }}
                              onClick={() => {
                                toggleDockPin(app.id);
                                sound.playClick();
                              }}
                              aria-label={`${isPinned ? 'Remove' : 'Add'} ${app.name} ${isPinned ? 'from' : 'to'} Dock`}
                              aria-pressed={isPinned}
                              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[10px] font-bold transition-colors ${
                                isPinned
                                  ? 'border-sky-400/20 bg-sky-400/10 text-sky-300 hover:border-rose-400/25 hover:bg-rose-400/10 hover:text-rose-300'
                                  : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-sky-400/25 hover:bg-sky-400/10 hover:text-sky-300'
                              }`}
                            >
                              {isPinned ? (
                                <>
                                  <PinOff className="h-3.5 w-3.5" />
                                  Remove
                                </>
                              ) : (
                                <>
                                  <Pin className="h-3.5 w-3.5" />
                                  Add
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {filteredDockApps.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                      <SearchX className="mx-auto h-5 w-5 text-slate-500" />
                      <p className="mt-2 text-xs font-semibold text-slate-300">No apps found</p>
                      <p className="mt-1 text-[10px] text-slate-500">Try another name or search term.</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[10px] text-slate-500">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                    <span>Changes appear in your Dock right away. Trash stays available at the end of the Dock.</span>
                  </div>
                </SectionCard>

                <SectionCard className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
                      <Layout className="w-6 h-6 text-sky-400" />
                    </div>

                    <div>
                      <div className="font-bold text-sm">
                        Dock Experience
                      </div>

                      <div className="text-xs text-slate-500 mt-1">
                        Your dock uses smooth magnification, glass depth and animated application states.
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                DISPLAYS
            ================================================= */}

            {activeTab === 'displays' && (
              <motion.div
                key="displays"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Displays"
                  description="Control brightness and display comfort features."
                  icon={Monitor}
                />

                <SectionCard className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Sun className="w-5 h-5 text-amber-400" />

                      <div>
                        <div className="font-bold text-sm">
                          Brightness
                        </div>

                        <div className="text-[10px] text-slate-500">
                          Adjust simulated display brightness.
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-black text-sky-400">
                      {settings.brightness}%
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.brightness}
                    onChange={e =>
                      updateSettings({
                        brightness:
                          Number(e.target.value),
                      })
                    }
                    className="control-slider w-full mt-3"
                    style={{ '--value': `${settings.brightness}%` } as React.CSSProperties}
                  />
                  <p className="mt-2 text-[10px] text-slate-500">Brightness affects the whole ARLO OS screen.</p>
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Moon}
                    title="Night Shift"
                    description="Warm the display during night hours."
                  >
                    <Toggle
                      enabled={!!settings.nightShift}
                      accent="amber"
                      onChange={() =>
                        updateSettings({
                          nightShift:
                            !settings.nightShift,
                        })
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold">Desktop widgets</div>
                      <p className="mt-1 text-xs text-slate-500">
                        Add or remove live widgets from your desktop. Drag any widget to reposition it.
                      </p>
                    </div>
                    <Layers3 className="h-5 w-5 shrink-0 text-sky-400" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      {
                        id: 'weather' as const,
                        title: 'Weather',
                        description: 'Local conditions at a glance',
                        icon: <CloudSun className="h-5 w-5 text-sky-400" />,
                      },
                      {
                        id: 'music' as const,
                        title: 'Now Playing',
                        description: 'Control your current music',
                        icon: <Music className="h-5 w-5 text-cyan-400" />,
                      },
                      {
                        id: 'system' as const,
                        title: 'System',
                        description: 'Live CPU and memory usage',
                        icon: <Cpu className="h-5 w-5 text-emerald-400" />,
                      },
                      {
                        id: 'clock' as const,
                        title: 'Clock & date',
                        description: 'A live clock with today’s date',
                        icon: <Clock3 className="h-5 w-5 text-violet-400" />,
                      },
                    ].map((widget) => {
                      const enabled = settings.desktopWidgets[widget.id];
                      return (
                        <div
                          key={widget.id}
                          className={`
                            flex items-center gap-3 rounded-2xl border p-3
                            transition-colors
                            ${enabled
                              ? 'border-sky-400/25 bg-sky-400/[0.06]'
                              : 'border-white/10 bg-white/[0.025]'}
                          `}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                            {widget.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold">{widget.title}</div>
                            <div className="mt-1 text-[10px] text-slate-500">{widget.description}</div>
                          </div>
                          <Toggle
                            enabled={enabled}
                            onChange={() =>
                              updateSettings({
                                desktopWidgets: {
                                  ...settings.desktopWidgets,
                                  [widget.id]: !enabled,
                                },
                              })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SectionCard className="p-4">
                    <MonitorSmartphone className="w-5 h-5 text-sky-400 mb-3" />
                    <div className="text-xs font-bold">
                      Built-in Display
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Primary display
                    </div>
                  </SectionCard>

                  <SectionCard className="p-4">
                    <Gauge className="w-5 h-5 text-purple-400 mb-3" />
                    <div className="text-xs font-bold">
                      60 Hz
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Refresh rate
                    </div>
                  </SectionCard>

                  <SectionCard className="p-4">
                    <Shield className="w-5 h-5 text-emerald-400 mb-3" />
                    <div className="text-xs font-bold">
                      HDR Ready
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Display profile
                    </div>
                  </SectionCard>
                </div>
              </motion.div>
            )}

            {/* =================================================
                SOUND
            ================================================= */}

            {activeTab === 'sound' && (
              <motion.div
                key="sound"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Sound"
                  description="Control system audio, interface sounds and volume."
                  icon={Volume2}
                />

                <SectionCard className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      animate={{
                        scale:
                          settings.soundVolume > 0
                            ? [1, 1.05, 1]
                            : 1,
                      }}
                      transition={{
                        duration: 1.5,
                        repeat:
                          settings.soundVolume > 0
                            ? Infinity
                            : 0,
                      }}
                      className="
                        w-16
                        h-16
                        rounded-3xl
                        bg-gradient-to-br
                        from-sky-500
                        to-indigo-600
                        flex
                        items-center
                        justify-center
                        shadow-xl
                        shadow-sky-500/20
                      "
                    >
                      {settings.soundVolume === 0 ? (
                        <VolumeX className="w-7 h-7" />
                      ) : (
                        <Volume2 className="w-7 h-7" />
                      )}
                    </motion.div>

                    <div>
                      <div className="text-2xl font-black">
                        {Math.round(
                          settings.soundVolume * 100,
                        )}
                        %
                      </div>

                      <div className="text-xs text-slate-500">
                        Output Volume
                      </div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.soundVolume}
                    onChange={e =>
                      updateSettings({
                        soundVolume:
                          Number(e.target.value),
                      })
                    }
                    className="w-full accent-sky-400"
                  />
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Volume2}
                    title="Interface Sound Effects"
                    description="Play clicks, window sounds, app interactions and system feedback."
                  >
                    <Toggle
                      enabled={
                        !!settings.soundEffects
                      }
                      onChange={() =>
                        updateSettings({
                          soundEffects:
                            !settings.soundEffects,
                        })
                      }
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard className="p-5">
                  <button
                    type="button"
                    onClick={() =>
                      sound.playClick()
                    }
                    className="
                      w-full
                      py-3
                      rounded-xl
                      bg-white/10
                      hover:bg-white/15
                      border border-white/10
                      text-xs
                      font-bold
                      transition-colors
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >
                    <Volume2 className="w-4 h-4" />
                    Test System Sound
                  </button>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                WIFI
            ================================================= */}

            {activeTab === 'wifi' && (
              <motion.div
                key="wifi"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Wi-Fi & Network"
                  description="View and control this laptop's Windows Wi-Fi adapter."
                  icon={Wifi}
                />

                <SectionCard className="p-6">
                  <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={
                          wifiEnabled
                            ? {
                                boxShadow: [
                                  '0 0 0 rgba(14,165,233,0)',
                                  '0 0 30px rgba(14,165,233,0.25)',
                                  '0 0 0 rgba(14,165,233,0)',
                                ],
                              }
                            : {}
                        }
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                        className={`
                          w-14
                          h-14
                          rounded-2xl
                          flex
                          items-center
                          justify-center
                          ${
                            wifiEnabled
                              ? 'bg-sky-500/15'
                              : 'bg-white/5'
                          }
                        `}
                      >
                        {wifiEnabled ? (
                          <Wifi className="w-6 h-6 text-sky-400" />
                        ) : (
                          <WifiOff className="w-6 h-6 text-slate-500" />
                        )}
                      </motion.div>

                      <div>
                        <div className="text-lg font-black">
                          Wi-Fi
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          {!wifiEnabled
                            ? 'Wi-Fi is turned off'
                            : settings.wifiConnected
                            ? `Connected to ${wifiNetwork}`
                            : 'Wi-Fi is on, but not connected'}
                        </div>
                      </div>
                    </div>

                    <Toggle
                      enabled={wifiEnabled}
                      onChange={() => void toggleHostRadio('wifi')}
                    />
                  </div>

                  {radioError && <p role="alert" className="mt-4 text-xs text-rose-300">{radioError}</p>}

                  {wifiEnabled && (
                    <div className="pt-5 space-y-2">
                      <div className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-3">
                        Current Connection
                      </div>
                      <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
                        <div className="flex items-center gap-3">
                          <Wifi className="h-4 w-4 text-sky-400" />
                          <div>
                            <div className="text-xs font-bold">{settings.wifiConnected ? wifiNetwork : 'No active Wi-Fi connection'}</div>
                            <div className="mt-1 text-[10px] text-slate-500">Reported by Windows</div>
                          </div>
                        </div>
                        {settings.wifiConnected && <Check className="h-4 w-4 text-sky-400" />}
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Globe2}
                    title="Private Network"
                    description="Use simulated private network protection for this OS."
                  >
                    <Toggle
                      enabled={true}
                      onChange={() =>
                        sound.playClick()
                      }
                    />
                  </SettingRow>

                  <SettingRow
                    icon={RefreshCw}
                    title="Auto-Join Networks"
                    description="Automatically connect to known networks."
                  >
                    <Toggle
                      enabled={true}
                      onChange={() =>
                        sound.playClick()
                      }
                    />
                  </SettingRow>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                BLUETOOTH
            ================================================= */}

            {activeTab === 'bluetooth' && (
              <motion.div
                key="bluetooth"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Bluetooth"
                  description="View this laptop's Bluetooth adapter and connected device."
                  icon={Bluetooth}
                />

                <SectionCard className="p-6">
                  <div className="flex items-center justify-between pb-5 border-b border-white/10">
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          w-14
                          h-14
                          rounded-2xl
                          flex
                          items-center
                          justify-center
                          ${
                            bluetoothEnabled
                              ? 'bg-blue-500/15'
                              : 'bg-white/5'
                          }
                        `}
                      >
                        {bluetoothEnabled ? (
                          <Bluetooth className="w-6 h-6 text-blue-400" />
                        ) : (
                          <BluetoothOff className="w-6 h-6 text-slate-500" />
                        )}
                      </div>

                      <div>
                        <div className="text-lg font-black">
                          Bluetooth
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          {!bluetoothEnabled
                            ? 'Bluetooth is turned off'
                            : settings.bluetoothConnected
                            ? `Connected to ${settings.bluetoothDeviceName || 'Bluetooth device'}`
                            : 'On, no device connected'}
                        </div>
                      </div>
                    </div>

                    <Toggle
                      enabled={bluetoothEnabled}
                      onChange={() => void toggleHostRadio('bluetooth')}
                    />
                  </div>

                  {radioError && <p role="alert" className="mt-4 text-xs text-rose-300">{radioError}</p>}

                  {bluetoothEnabled && (
                    <div className="pt-5">
                      <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current connection</div>
                        <div className="mt-2 text-xs font-bold">
                          {settings.bluetoothConnected
                            ? settings.bluetoothDeviceName || 'Bluetooth device connected'
                            : 'No Bluetooth device connected'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowControlCenter(true)}
                          className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
                        >
                          Scan nearby BLE devices
                        </button>
                      </div>
                    </div>
                  )}
                </SectionCard>

                <SectionCard className="p-4 text-xs text-slate-400">
                  Nearby Bluetooth Low Energy discovery is available from Control Center. Windows will request permission before scanning; classic accessories appear when Windows reports them as connected.
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                FOCUS
            ================================================= */}

            {activeTab === 'connections' && (
              <motion.div
                key="connections"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <PageHeader
                  title="Social connections"
                  description="Keep your favorite communities and music services together in ARLO OS."
                  icon={Share2}
                />

                <SectionCard className="p-5 sm:p-7">
                  <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
                  <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-3 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-violet-200">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Official websites
                      </div>
                      <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">Sign in directly with each service.</h3>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Open the genuine website in this window and enter your details there. ARLO OS does not collect or store your social passwords. Some services may require opening in your system browser.
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-center">
                      <div className="text-2xl font-black text-white">10</div>
                      <div className="mt-1 text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Services available</div>
                    </div>
                  </div>
                </SectionCard>

                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Your services</h3>
                    <p className="mt-1 text-[10px] text-slate-500">Select a service to open its official sign-in page.</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-1.5 text-[9px] font-semibold text-emerald-200/80">
                    Provider-hosted sign-in
                  </span>
                </div>

                {connectionsError && (
                  <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-xs text-rose-200">
                    {connectionsError}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {SOCIAL_PROVIDERS.map((provider, index) => (
                    <motion.article
                      key={provider.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.035, 0.28), duration: 0.28 }}
                      whileHover={{ y: -3, scale: 1.01 }}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-4 shadow-lg shadow-black/10 transition-colors hover:border-white/20"
                    >
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25"
                        style={{ backgroundColor: provider.color }}
                      />
                      <div className="relative flex items-start gap-3">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-white/10 bg-black/25 shadow-inner"
                        >
                          <img
                            src={provider.logo}
                            alt=""
                            className="h-full w-full object-cover"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="truncate text-xs font-bold text-white">{provider.name}</h4>
                            <span className="shrink-0 rounded-full border border-slate-300/10 bg-slate-300/[0.06] px-2 py-1 text-[8px] font-semibold text-slate-400">
                              Official site
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[10px] text-slate-500">{provider.description}</p>
                        </div>
                      </div>
                      <div className="relative mt-4 flex items-center gap-2">
                        <motion.button
                          type="button"
                          onClick={() => openSocialSignIn(provider)}
                          aria-label={`Open ${provider.name} website`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 text-[10px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                          Open {provider.name}
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </motion.article>
                  ))}
                </div>

                <SectionCard className="flex items-start gap-3 p-4">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p className="text-[10px] leading-5 text-slate-400">
                    Sign-in is provided by the selected service itself. Passwords are entered on that service’s page and are not read or saved by ARLO OS. Some providers block embedded browsers; use “Open in browser” if their sign-in page does not load here.
                  </p>
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'ghost' && (
              <motion.div
                key="ghost"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="max-w-3xl space-y-6"
              >
                <PageHeader
                  title="Ghost AI"
                  description="Configure global access and choose how Ghost can use voice."
                  icon={Bot}
                />

                <SectionCard className="space-y-6 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Global assistant shortcut</h3>
                      <p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-400">
                        Open or dismiss Ghost from anywhere, including when ARLO OS is in the background.
                      </p>
                    </div>
                    <select
                      value={settings.ghostShortcut}
                      onChange={event => void updateGhostShortcut(event.target.value as GhostShortcut)}
                      className="min-h-10 rounded-lg border border-white/10 bg-slate-900 px-3 text-xs text-slate-200 outline-none focus:border-sky-300/30"
                      aria-label="Ghost AI global keyboard shortcut"
                    >
                      <option value="ctrl-shift-space">Ctrl + Shift + Space</option>
                      <option value="ctrl-alt-space">Ctrl + Alt + Space</option>
                      <option value="ctrl-shift-g">Ctrl + Shift + G</option>
                    </select>
                  </div>
                  {ghostShortcutError && <p role="alert" className="text-[11px] text-rose-300">{ghostShortcutError}</p>}

                  <div className="border-t border-white/[0.07]" />

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Mic className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <div>
                        <h3 className="text-sm font-bold text-white">Always listen for “Hey Lily” or “Hey Ghost”</h3>
                        <p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-400">
                          Say “Hey Ghost” or “Hey Lily” to start. Speech recognition runs locally; the microphone is paused while the OS is locked, sleeping, or shut down.
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.ghostWakeEnabled}
                      onChange={toggleGhostWakePhrase}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
                    <div className="flex items-start gap-3">
                      <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <div>
                        <h3 className="text-sm font-bold text-white">Speak Lily’s replies</h3>
                        <p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-400">
                          Lily’s natural voice is generated online by Gemini. The reply text is sent to Google for speech generation.
                        </p>
                      </div>
                    </div>
                    <Toggle
                      enabled={settings.ghostVoiceResponses}
                      onChange={() => updateSettings({ ghostVoiceResponses: !settings.ghostVoiceResponses })}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
                    <div className="flex items-start gap-3">
                      <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <div>
                        <h3 className="text-sm font-bold text-white">Lily’s voice</h3>
                        <p className="mt-1 max-w-lg text-[11px] leading-5 text-slate-400">
                          Lily is the only voice. Replies use Gemini’s natural Kore voice when available, with a local female voice fallback if Gemini is offline or rate-limited.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" role="group" aria-label="Lily's voice">
                      <div className="rounded-xl border border-sky-200/30 bg-sky-300/10 px-3.5 py-2 text-left text-sky-100">
                        <span className="block text-[11px] font-semibold">Lily</span>
                        <span className="mt-0.5 block text-[9px] opacity-65">Natural · Gemini AI</span>
                      </div>
                      <button
                        type="button"
                        onClick={previewGhostVoice}
                        className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] font-medium text-slate-300 transition hover:border-sky-200/20 hover:text-white"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                  {ghostVoicePreviewError && <p role="alert" className="text-right text-[10px] text-rose-300">{ghostVoicePreviewError}</p>}
                </SectionCard>

                <SectionCard className="border border-sky-300/10 p-4 text-[11px] leading-5 text-slate-400">
                  “Hey Ghost” and “Hey Lily” wake listening are active by default. Voice recognition runs locally; online spoken replies are generated by Gemini.
                </SectionCard>
              </motion.div>
            )}

            {activeTab === 'focus' && (
              <motion.div
                key="focus"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Focus & Notifications"
                  description="Control interruptions, alerts and Focus Mode."
                  icon={Moon}
                />

                <SectionCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={
                          focusEnabled
                            ? {
                                rotate: [0, -5, 5, 0],
                              }
                            : {}
                        }
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                        className="
                          w-14
                          h-14
                          rounded-2xl
                          bg-purple-500/15
                          flex
                          items-center
                          justify-center
                        "
                      >
                        {focusEnabled ? (
                          <Moon className="w-6 h-6 text-purple-400" />
                        ) : (
                          <Bell className="w-6 h-6 text-slate-400" />
                        )}
                      </motion.div>

                      <div>
                        <div className="text-lg font-black">
                          Focus Mode
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          {focusEnabled
                            ? 'Focus mode is active'
                            : 'Notifications are delivered normally'}
                        </div>
                      </div>
                    </div>

                    <Toggle
                      enabled={focusEnabled}
                      accent="purple"
                      onChange={() => {
                        updateSettings({ doNotDisturb: !focusEnabled });

                        sound.playToggle(
                          !focusEnabled,
                        );
                      }}
                    />
                  </div>
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Bell}
                    title="Allow Notifications"
                    description="Show application notifications and system alerts."
                  >
                    <Toggle
                      enabled={!focusEnabled}
                      onChange={() => {
                        updateSettings({ doNotDisturb: !focusEnabled });

                        sound.playClick();
                      }}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Volume2}
                    title="Allow Calls"
                    description="Allow incoming calls while Focus is active."
                  >
                    <Toggle
                      enabled={allowCalls}
                      onChange={() => {
                        setAllowCalls(
                          prev => !prev,
                        );

                        sound.playClick();
                      }}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Bell}
                    title="Repeated Calls"
                    description="Allow a second call from the same person within 3 minutes."
                  >
                    <Toggle
                      enabled={allowRepeatedCalls}
                      onChange={() => {
                        setAllowRepeatedCalls(
                          prev => !prev,
                        );

                        sound.playClick();
                      }}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={RefreshCw}
                    title="Scheduled Focus"
                    description="Automatically activate Focus during scheduled hours."
                  >
                    <Toggle
                      enabled={scheduledFocus}
                      onChange={() => {
                        setScheduledFocus(
                          prev => !prev,
                        );

                        sound.playClick();
                      }}
                    />
                  </SettingRow>
                </SectionCard>

                <SectionCard className="p-5">
                  <div className="flex items-center gap-3">
                    {focusEnabled ? (
                      <BellOff className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-sky-400" />
                    )}

                    <div>
                      <div className="text-xs font-bold">
                        Current Notification Status
                      </div>

                      <div className="text-[10px] text-slate-500 mt-1">
                        {focusEnabled
                          ? 'Notifications are being silenced by Focus Mode.'
                          : 'Notifications are currently allowed.'}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                BATTERY
            ================================================= */}

       
       {activeTab === 'battery' && ( <motion.div key="battery" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 max-w-3xl" > <PageHeader title="Battery" description="Monitor your laptop's current battery status and power management." icon={Battery} /> <SectionCard className="p-6"> <div className="flex flex-col sm:flex-row items-center gap-8"> <div className="relative w-40 h-40"> <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" > <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" /> <motion.circle cx="80" cy="80" r="68" fill="none" stroke={ batteryPercentage <= 20 ? 'rgb(248,113,113)' : batteryPercentage <= 40 ? 'rgb(251,191,36)' : 'rgb(52,211,153)' } strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 68} animate={{ strokeDashoffset: 2 * Math.PI * 68 * (1 - batteryPercentage / 100), }} transition={{ duration: 0.5, }} /> </svg> <div className="absolute inset-0 flex flex-col items-center justify-center"> {batteryCharging ? ( <BatteryCharging className={`w-5 h-5 mb-1 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} /> ) : ( <Battery className={`w-5 h-5 mb-1 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} /> )} <div className="text-3xl font-black"> {batteryPercentage}% </div> <div className="text-[9px] text-slate-500"> {batteryCharging ? 'Charging' : 'Battery'} </div> </div> </div> <div className="flex-1 text-center sm:text-left"> <div className="flex items-center justify-center sm:justify-start gap-2"> <CheckCircle2 className={`w-4 h-4 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} /> <span className="font-black text-sm"> {batteryPercentage <= 20 ? 'Low Battery' : batteryCharging ? 'Battery Charging' : 'Good Battery Health'} </span> </div> <div className="text-xs text-slate-400 mt-2"> {batteryCharging ? `Currently charging at ${batteryPercentage}%` : 'Running on battery power'} </div> <div className={`text-[10px] mt-2 ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} > {batteryCharging ? 'Your laptop is connected to power.' : batteryPercentage <= 20 ? 'Connect your charger soon.' : 'Battery is operating normally.'} </div> </div> </div> <div className="mt-7"> <div className="flex justify-between text-[10px] mb-2"> <span className="text-slate-500"> Current Battery Level </span> <span className={`font-mono ${ batteryPercentage <= 20 ? 'text-red-400' : batteryPercentage <= 40 ? 'text-amber-400' : 'text-emerald-400' }`} > {batteryPercentage}% </span> </div> <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.08]"> <motion.div className={`absolute left-0 top-0 h-full rounded-full ${ batteryPercentage <= 20 ? 'bg-red-400' : batteryPercentage <= 40 ? 'bg-amber-400' : 'bg-emerald-400' }`} animate={{ width: `${batteryPercentage}%`, }} transition={{ duration: 0.5, }} /> </div> <div className="flex justify-between mt-2 text-[9px] text-slate-600"> <span>0%</span> <span>50%</span> <span>100%</span> </div> </div> </SectionCard> <SectionCard className="p-2"> <SettingRow icon={Zap} title="Low Power Mode" description="Reduce animations and background activity to extend battery life." > <Toggle enabled={lowPowerMode} accent="amber"        onChange={() => { updateSettings({ lowPowerMode: !lowPowerMode }); sound.playToggle(!lowPowerMode); }} /> </SettingRow> <SettingRow icon={BatteryCharging} title="Optimized Battery Charging" description="Reduce battery aging by learning your charging routine." > <Toggle enabled={optimizedCharging} accent="green" onChange={() => { setOptimizedCharging( prev => !prev, ); sound.playClick(); }} /> </SettingRow> <SettingRow icon={Power} title="Power Saving When Idle" description="Lower display activity when the system is not being used." > <Toggle enabled={true} accent="green" onChange={() => sound.playClick() } /> </SettingRow> </SectionCard> </motion.div> )}
            {activeTab === 'battery' && (
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="max-w-3xl"
              >
                <SectionCard className="space-y-5 p-5">
                  <div>
                    <h3 className="text-sm font-bold">Menu bar battery design</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                      Choose the battery shape shown beside Wi-Fi. Charge level and plug state are read from Windows.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {([
                      ['classic', 'Classic'],
                      ['rounded', 'Rounded'],
                      ['square', 'Square'],
                      ['circle', 'Circle'],
                    ] as const satisfies ReadonlyArray<readonly [BatteryIconStyle, string]>).map(([style, label]) => (
                      <button
                        key={style}
                        type="button"
                        aria-pressed={settings.batteryIconStyle === style}
                        onClick={() => {
                          updateSettings({ batteryIconStyle: style });
                          sound.playClick();
                        }}
                        className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border text-[10px] font-semibold transition ${
                          settings.batteryIconStyle === style
                            ? 'border-sky-300/40 bg-sky-300/10 text-sky-100 shadow-[0_0_20px_rgba(56,189,248,.08)]'
                            : 'border-white/[0.08] bg-white/[0.025] text-slate-400 hover:border-white/15 hover:bg-white/[0.05]'
                        }`}
                      >
                        <BatteryStatusIcon
                          level={settings.batteryAvailable ? settings.batteryLevel : 68}
                          charging={settings.batteryAvailable && settings.batteryCharging}
                          plugged={settings.batteryAvailable && settings.batteryPlugged}
                          style={style}
                          className={style === 'circle' ? 'h-7 w-7' : 'h-5 w-8'}
                        />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.04] p-3">
                    <p className="text-[10px] font-semibold text-amber-100">Low Power Mode</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                      When enabled, the desktop dims to at most 55% brightness, slows live wallpapers, and shortens repeating UI animations. Your preferred brightness and performance setting are preserved.
                    </p>
                  </div>
                  {!settings.batteryAvailable && (
                    <p className="text-[10px] leading-relaxed text-slate-500">
                      Windows did not detect a built-in battery on this device. The menu bar will show the selected design without an invented charge percentage.
                    </p>
                  )}
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                ABOUT
            ================================================= */}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-4xl"
              >
                <PageHeader
                  title="About ARLO OS"
                  description="System information, hardware profile and creator information."
                  icon={Info}
                />

                <SectionCard className="p-8 overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-sky-500/15 blur-3xl" />

                  <div className="relative flex flex-col md:flex-row gap-7 items-center md:items-start">
                    <motion.div
                      animate={{
                        rotateY: [0, 5, 0, -5, 0],
                        rotateX: [0, -3, 0, 3, 0],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="flex h-32 w-32 items-center justify-center drop-shadow-[0_20px_28px_rgba(14,165,233,0.2)]"
                    >
                      <MascotMark className="h-32 w-32" />
                    </motion.div>

                    <div className="text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[10px] font-bold mb-3">
                        <CheckCircle2 className="w-3 h-3" />
                        PRO EDITION
                      </div>

                      <h3 className="text-3xl font-black">
                        ARLO OS
                      </h3>

                      <div className="text-sm text-slate-400 mt-1">
                        Version {appVersion} Pro
                      </div>

                      <p className="text-xs text-slate-300 mt-5 max-w-xl leading-relaxed">
                        Designed and engineered by Abhishek Kuntare.
                        A full-featured desktop operating system experience built with React, TypeScript, Electron and Tailwind CSS.
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard className="relative overflow-hidden p-5 sm:p-6">
                  <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-sky-400/[0.08] blur-3xl" />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/[0.08] text-sky-200">
                        <RefreshCw className={`h-5 w-5 ${updateStatus === 'checking' || updateStatus === 'downloading' ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">Software updates</h3>
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                            {updateChannel === 'store' ? 'Microsoft Store' : updateChannel === 'direct' ? 'Direct install' : 'Desktop app'}
                          </span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">Installed version <span className="font-semibold text-slate-200">{appVersion}</span></p>
                        <p aria-live="polite" className={`mt-2 max-w-2xl text-[10px] leading-4 ${updateStatus === 'error' ? 'text-rose-300' : updateStatus === 'downloaded' || updateStatus === 'not-available' ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {updateMessage || (updateChannel === 'store'
                            ? 'Microsoft Store delivers updates after a new Store submission is approved. Check the Store Library for updates.'
                            : updateChannel === 'direct'
                              ? 'ARLO OS checks for direct-download releases and can install updates from here.'
                              : 'Update controls are available in the installed desktop application.')}
                        </p>
                        {updateStatus === 'downloading' && (
                          <div
                            role="progressbar"
                            aria-label="Update download progress"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={updatePercent}
                            className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-white/10"
                          >
                            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-[width]" style={{ width: `${updatePercent}%` }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {updateChannel === 'development' ? (
                      <span className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-[10px] font-semibold text-slate-500">
                        <ShieldCheck className="h-3.5 w-3.5" /> Installed build required
                      </span>
                    ) : updateStatus === 'downloaded' && updateChannel === 'direct' ? (
                      <button
                        type="button"
                        onClick={() => void installDownloadedUpdate()}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-[10px] font-bold text-white transition-colors hover:bg-sky-400"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Restart to update
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleUpdateAction()}
                        disabled={updateActionBusy || updateStatus === 'checking' || updateStatus === 'downloading'}
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/[0.08] px-4 text-[10px] font-bold text-sky-100 transition-colors hover:bg-sky-300/[0.14] disabled:cursor-wait disabled:opacity-50"
                      >
                        {updateChannel === 'store' ? <ExternalLink className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        {updateActionBusy || updateStatus === 'checking'
                          ? 'Checking…'
                          : updateChannel === 'store' ? 'Open Store updates' : 'Check for updates'}
                      </button>
                    )}
                  </div>
                </SectionCard>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <SectionCard className="p-5">
                    <Cpu className="w-5 h-5 text-sky-400 mb-4" />
                    <div className="text-lg font-black">
                      12-Core
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Neural Architecture
                    </div>
                  </SectionCard>

                  <SectionCard className="p-5">
                    <MemoryStick className="w-5 h-5 text-purple-400 mb-4" />
                    <div className="text-lg font-black">
                      32 GB
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Unified Memory
                    </div>
                  </SectionCard>

                  <SectionCard className="p-5">
                    <HardDrive className="w-5 h-5 text-emerald-400 mb-4" />
                    <div className="text-lg font-black">
                      1 TB
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      NVMe Storage
                    </div>
                  </SectionCard>

                  <SectionCard className="p-5">
                    <Shield className="w-5 h-5 text-amber-400 mb-4" />
                    <div className="text-lg font-black">
                      Secure
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Protected System
                    </div>
                  </SectionCard>
                </div>

                <SectionCard className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-bold">
                        Creator
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        Abhishek Kuntare
                      </div>

                      <div className="text-[10px] text-slate-600 mt-1">
                        abhishekkuntare02@gmail.com
                      </div>
                    </div>

                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400">
                      © 2026 Abhishek Kuntare
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <AnimatePresence>
        {selectedSocialProvider && (
          <motion.div
            key="social-sign-in-modal"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={event => {
              if (event.target === event.currentTarget) setSelectedSocialProvider(null);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedSocialProvider.name} sign-in`}
              className="flex h-[min(820px,94vh)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#090d16] shadow-[0_30px_120px_rgba(0,0,0,.75)]"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3 sm:px-5">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  <img
                    src={selectedSocialProvider.logo}
                    alt=""
                    className="h-full w-full object-cover"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-white">{selectedSocialProvider.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-slate-400">
                    <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-300" />
                    Official website · {(() => {
                      try {
                        return new URL(socialCurrentUrl).host;
                      } catch {
                        return 'secure website';
                      }
                    })()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void openSocialWebsite(socialCurrentUrl)}
                  className="hidden h-9 items-center gap-2 rounded-xl border border-white/10 px-3 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white sm:flex"
                >
                  Open in browser
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Close sign-in window"
                  onClick={() => setSelectedSocialProvider(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>
              <div className="relative min-h-0 flex-1 bg-white">
                <SocialSignInView
                  key={selectedSocialProvider.id}
                  src={selectedSocialProvider.url}
                  onNavigate={url => {
                    setSocialCurrentUrl(url);
                    setSocialLoadError('');
                  }}
                  onError={setSocialLoadError}
                />
                {socialLoadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#090d16]/95 p-6 text-center">
                    <div className="max-w-md">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
                        <Globe2 className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-white">This service blocked the in-app sign-in window</h3>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{socialLoadError}</p>
                      <button
                        type="button"
                        onClick={() => void openSocialWebsite(socialCurrentUrl)}
                        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-xs font-bold text-white transition hover:bg-sky-400"
                      >
                        Continue in system browser
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <footer className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-white/[0.025] px-4 py-2.5 text-[9px] text-slate-500 sm:px-5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                Enter sign-in details only on the provider’s page. ARLO OS does not read or store them.
              </footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};