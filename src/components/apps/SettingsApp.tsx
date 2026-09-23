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
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

import { useOS } from '../../context/OSContext';
import { WALLPAPERS } from '../../data/wallpapers';
import {
  AccentColor,
  ThemeMode,
  Wallpaper,
} from '../../types/desktop';
import { sound } from '../../services/soundService';

/* ============================================================
   TYPES
============================================================ */

type SettingsTab =
  | 'profile'
  | 'appearance'
  | 'wallpaper'
  | 'dock'
  | 'displays'
  | 'sound'
  | 'wifi'
  | 'bluetooth'
  | 'focus'
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
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Theme, colors and visual effects',
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
    id: 'battery',
    label: 'Battery',
    icon: Battery,
    description: 'Power and battery',
  },
  {
    id: 'about',
    label: 'About Abhishek OS',
    icon: Info,
    description: 'System information',
  },
];

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
      ease: [0.22, 1, 0.36, 1],
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
    ease: [0.22, 1, 0.36, 1],
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
}> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
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
    currentWallpaper,
    setWallpaper,
  } = useOS();

  const avatarInputRef =
    useRef<HTMLInputElement | null>(null);

  const wallpaperInputRef =
    useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] =
    useState<SettingsTab>('profile');

  const [search, setSearch] =
    useState('');

  const [wifiEnabled, setWifiEnabled] =
    useState(true);

  const [wifiNetwork, setWifiNetwork] =
    useState('Abhishek Home Wi-Fi');

  const [bluetoothEnabled, setBluetoothEnabled] =
    useState(true);

  const [discoverable, setDiscoverable] =
    useState(false);

  const [focusEnabled, setFocusEnabled] =
    useState(false);

  const [allowCalls, setAllowCalls] =
    useState(true);

  const [allowRepeatedCalls, setAllowRepeatedCalls] =
    useState(false);

  const [scheduledFocus, setScheduledFocus] =
    useState(false);

  const [batteryPercentage, setBatteryPercentage] =
    useState(94);

  const [lowPowerMode, setLowPowerMode] =
    useState(false);

  const [optimizedCharging, setOptimizedCharging] =
    useState(true);

  const [photoCount, setPhotoCount] =
    useState(0);

  const [showMobileNav, setShowMobileNav] =
    useState(false);

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
    });

    sound.playClick();
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

  /* ==========================================================
     HEADER
  ========================================================== */

  const currentNav = NAV_ITEMS.find(
    item => item.id === activeTab,
  );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="
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
              Abhishek OS
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
                  className="w-full h-full object-cover"
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
            Abhishek OS 1.0.0 Pro
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
                  description="Manage your Abhishek OS identity, profile picture and personal information."
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
                            className="w-full h-full object-cover"
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
                          'Create your personal identity inside Abhishek OS.'}
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
                        Screen Lock PIN
                      </label>

                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

                        <input
                          type="password"
                          value={user.pin}
                          onChange={e =>
                            updateUser({
                              pin: e.target.value,
                            })
                          }
                          maxLength={6}
                          className="
                            w-full
                            p-3
                            pl-10
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
                      </div>
                    </div>
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
                  description="Customize the visual identity of Abhishek OS."
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
                  description="Customize how the desktop dock and menu bar behave."
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

                  <div className="relative h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      animate={{
                        width: `${settings.brightness}%`,
                      }}
                      className="
                        absolute
                        inset-y-0
                        left-0
                        rounded-full
                        bg-gradient-to-r
                        from-sky-500
                        to-cyan-400
                      "
                    />
                  </div>

                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={settings.brightness}
                    onChange={e =>
                      updateSettings({
                        brightness:
                          Number(e.target.value),
                      })
                    }
                    className="w-full mt-3 accent-sky-400"
                  />
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
                  description="Manage simulated wireless connectivity and network preferences."
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
                          {wifiEnabled
                            ? `Connected to ${wifiNetwork}`
                            : 'Wi-Fi is turned off'}
                        </div>
                      </div>
                    </div>

                    <Toggle
                      enabled={wifiEnabled}
                      onChange={() => {
                        setWifiEnabled(
                          prev => !prev,
                        );

                        sound.playToggle(
                          !wifiEnabled,
                        );
                      }}
                    />
                  </div>

                  {wifiEnabled && (
                    <div className="pt-5 space-y-2">
                      <div className="text-[10px] uppercase tracking-widest text-slate-600 font-black mb-3">
                        Known Networks
                      </div>

                      {[
                        {
                          name: 'Abhishek Home Wi-Fi',
                          strength: 4,
                          secure: true,
                        },
                        {
                          name: 'Office Network',
                          strength: 3,
                          secure: true,
                        },
                        {
                          name: 'Guest Network',
                          strength: 2,
                          secure: false,
                        },
                      ].map(network => (
                        <motion.button
                          type="button"
                          key={network.name}
                          whileHover={{
                            x: 3,
                            scale: 1.005,
                          }}
                          onClick={() => {
                            setWifiNetwork(
                              network.name,
                            );

                            sound.playClick();
                          }}
                          className={`
                            w-full
                            flex
                            items-center
                            justify-between
                            p-4
                            rounded-2xl
                            border
                            transition-colors
                            ${
                              wifiNetwork ===
                              network.name
                                ? 'bg-sky-500/10 border-sky-400/30'
                                : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Wifi className="w-4 h-4 text-sky-400" />

                            <div className="text-left">
                              <div className="text-xs font-bold">
                                {network.name}
                              </div>

                              <div className="text-[10px] text-slate-500 mt-1">
                                {network.secure
                                  ? 'Secured network'
                                  : 'Open network'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {network.secure && (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            )}

                            <div className="flex items-end gap-0.5 h-4">
                              {[1, 2, 3, 4].map(
                                level => (
                                  <div
                                    key={level}
                                    className={`
                                      w-1
                                      rounded-full
                                      ${
                                        level <=
                                        network.strength
                                          ? 'bg-sky-400'
                                          : 'bg-white/15'
                                      }
                                    `}
                                    style={{
                                      height: `${level * 4}px`,
                                    }}
                                  />
                                ),
                              )}
                            </div>

                            {wifiNetwork ===
                              network.name && (
                              <Check className="w-4 h-4 text-sky-400" />
                            )}
                          </div>
                        </motion.button>
                      ))}
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
                  description="Connect and manage wireless accessories around Abhishek OS."
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
                          {bluetoothEnabled
                            ? 'Bluetooth is available'
                            : 'Bluetooth is turned off'}
                        </div>
                      </div>
                    </div>

                    <Toggle
                      enabled={bluetoothEnabled}
                      onChange={() => {
                        setBluetoothEnabled(
                          prev => !prev,
                        );

                        sound.playToggle(
                          !bluetoothEnabled,
                        );
                      }}
                    />
                  </div>

                  {bluetoothEnabled && (
                    <div className="pt-5 space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-slate-600 font-black">
                        My Devices
                      </div>

                      {[
                        {
                          name: 'Magic Keyboard',
                          type: 'Keyboard',
                          icon: Keyboard,
                          connected: true,
                        },
                        {
                          name: 'Abhishek AirPods',
                          type: 'Headphones',
                          icon: Headphones,
                          connected: false,
                        },
                        {
                          name: 'iPhone',
                          type: 'Mobile Device',
                          icon: Smartphone,
                          connected: false,
                        },
                      ].map(device => {
                        const DeviceIcon =
                          device.icon;

                        return (
                          <motion.div
                            key={device.name}
                            whileHover={{
                              y: -2,
                            }}
                            className="
                              flex
                              items-center
                              justify-between
                              p-4
                              rounded-2xl
                              bg-white/[0.035]
                              border
                              border-white/10
                            "
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <DeviceIcon className="w-5 h-5 text-blue-400" />
                              </div>

                              <div>
                                <div className="text-xs font-bold">
                                  {device.name}
                                </div>

                                <div className="text-[10px] text-slate-500 mt-1">
                                  {device.type}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                sound.playClick()
                              }
                              className={`
                                px-3
                                py-1.5
                                rounded-lg
                                text-[10px]
                                font-bold
                                ${
                                  device.connected
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/15'
                                }
                              `}
                            >
                              {device.connected
                                ? 'Connected'
                                : 'Connect'}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Bluetooth}
                    title="Discoverable"
                    description="Allow nearby devices to discover Abhishek OS."
                  >
                    <Toggle
                      enabled={discoverable}
                      onChange={() => {
                        setDiscoverable(
                          prev => !prev,
                        );

                        sound.playClick();
                      }}
                    />
                  </SettingRow>
                </SectionCard>
              </motion.div>
            )}

            {/* =================================================
                FOCUS
            ================================================= */}

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
                        setFocusEnabled(
                          prev => !prev,
                        );

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
                        setFocusEnabled(
                          prev => !prev,
                        );

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

            {activeTab === 'battery' && (
              <motion.div
                key="battery"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6 max-w-3xl"
              >
                <PageHeader
                  title="Battery"
                  description="Monitor simulated battery status and power management."
                  icon={Battery}
                />

                <SectionCard className="p-6">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative w-40 h-40">
                      <svg
                        viewBox="0 0 160 160"
                        className="w-full h-full -rotate-90"
                      >
                        <circle
                          cx="80"
                          cy="80"
                          r="68"
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="12"
                        />

                        <motion.circle
                          cx="80"
                          cy="80"
                          r="68"
                          fill="none"
                          stroke="rgb(52,211,153)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 68}
                          animate={{
                            strokeDashoffset:
                              2 *
                              Math.PI *
                              68 *
                              (1 -
                                batteryPercentage /
                                  100),
                          }}
                          transition={{
                            duration: 0.5,
                          }}
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <BatteryCharging className="w-5 h-5 text-emerald-400 mb-1" />

                        <div className="text-3xl font-black">
                          {batteryPercentage}%
                        </div>

                        <div className="text-[9px] text-slate-500">
                          Battery
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                        <span className="font-black text-sm">
                          Good Battery Health
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mt-2">
                        Approximately{' '}
                        {Math.max(
                          1,
                          Math.round(
                            batteryPercentage *
                              0.064,
                          ),
                        )}{' '}
                        hours remaining
                      </div>

                      <div className="text-[10px] text-emerald-400 mt-2">
                        Battery is operating normally.
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    <div className="flex justify-between text-[10px] mb-2">
                      <span className="text-slate-500">
                        Simulated Battery Level
                      </span>

                      <span className="font-mono text-emerald-400">
                        {batteryPercentage}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={batteryPercentage}
                      onChange={e =>
                        setBatteryPercentage(
                          Number(e.target.value),
                        )
                      }
                      className="w-full accent-emerald-400"
                    />
                  </div>
                </SectionCard>

                <SectionCard className="p-2">
                  <SettingRow
                    icon={Zap}
                    title="Low Power Mode"
                    description="Reduce animations and background activity to extend battery life."
                  >
                    <Toggle
                      enabled={lowPowerMode}
                      accent="amber"
                      onChange={() => {
                        setLowPowerMode(
                          prev => !prev,
                        );

                        sound.playToggle(
                          !lowPowerMode,
                        );
                      }}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={BatteryCharging}
                    title="Optimized Battery Charging"
                    description="Reduce battery aging by learning your charging routine."
                  >
                    <Toggle
                      enabled={optimizedCharging}
                      accent="green"
                      onChange={() => {
                        setOptimizedCharging(
                          prev => !prev,
                        );

                        sound.playClick();
                      }}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Power}
                    title="Power Saving When Idle"
                    description="Lower display activity when the system is not being used."
                  >
                    <Toggle
                      enabled={true}
                      accent="green"
                      onChange={() =>
                        sound.playClick()
                      }
                    />
                  </SettingRow>
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
                  title="About Abhishek OS"
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
                      className="
                        w-32
                        h-32
                        rounded-[2rem]
                        bg-gradient-to-br
                        from-sky-400
                        via-blue-600
                        to-indigo-800
                        flex
                        items-center
                        justify-center
                        shadow-2xl
                        shadow-sky-500/20
                      "
                    >
                      <Sparkles className="w-12 h-12 text-white" />
                    </motion.div>

                    <div className="text-center md:text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-[10px] font-bold mb-3">
                        <CheckCircle2 className="w-3 h-3" />
                        PRO EDITION
                      </div>

                      <h3 className="text-3xl font-black">
                        Abhishek OS
                      </h3>

                      <div className="text-sm text-slate-400 mt-1">
                        Version 1.0.0 Pro
                      </div>

                      <p className="text-xs text-slate-300 mt-5 max-w-xl leading-relaxed">
                        Designed and engineered by Abhishek Kuntare.
                        A full-featured desktop operating system experience built with React, TypeScript, Electron and Tailwind CSS.
                      </p>
                    </div>
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
    </div>
  );
};