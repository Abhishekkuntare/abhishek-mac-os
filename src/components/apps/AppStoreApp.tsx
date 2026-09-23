
import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Gamepad2,
  Grid3X3,
  Layers3,
  Search,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { sound } from '../../services/soundService';

type Category = 'All' | 'Productivity' | 'Developer' | 'Creative' | 'Utilities';

const CATEGORY_ICONS = {
  All: Grid3X3,
  Productivity: Layers3,
  Developer: Zap,
  Creative: Sparkles,
  Utilities: Gamepad2,
};

const APP_DESCRIPTIONS: Record<string, string> = {
  finder: 'Browse files, folders and everything on your Mac.',
  browser: 'A fast and beautiful browser for your everyday web.',
  messages: 'Stay connected with your conversations.',
  mail: 'All your important email, beautifully organized.',
  calendar: 'Plan your days, meetings and important events.',
  photos: 'Keep your favorite memories organized.',
  music: 'Discover and enjoy your favorite music.',
  tv: 'Watch movies, shows and entertainment.',
  notes: 'Capture ideas, thoughts and important information.',
  reminders: 'Keep track of everything that matters.',
  terminal: 'A powerful command-line environment for developers.',
  codestudio: 'Build, test and experiment with code.',
  settings: 'Customize your Abhishek OS experience.',
  appstore: 'Discover applications designed for Abhishek OS.',
};

const getAppDescription = (app: any) =>
  APP_DESCRIPTIONS[app.id] ||
  `A beautifully designed ${app.category?.toLowerCase() || 'application'} for Abhishek OS.`;

const getAppCategory = (app: any): Category => {
  const category = String(app.category || '').toLowerCase();

  if (
    category.includes('develop') ||
    category.includes('code') ||
    category.includes('program')
  ) {
    return 'Developer';
  }

  if (
    category.includes('creative') ||
    category.includes('photo') ||
    category.includes('music') ||
    category.includes('media')
  ) {
    return 'Creative';
  }

  if (
    category.includes('utility') ||
    category.includes('system') ||
    category.includes('tool')
  ) {
    return 'Utilities';
  }

  return 'Productivity';
};

interface AppCardProps {
  app: any;
  index: number;
  installed: boolean;
  onOpen: (id: string) => void;
}

const AppCard: React.FC<AppCardProps> = ({
  app,
  index,
  installed,
  onOpen,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 25,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.045,
        duration: 0.45,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -7,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="
        group
        relative
        rounded-[24px]
        overflow-hidden
        bg-white/[0.045]
        border border-white/[0.09]
        hover:border-white/[0.18]
        shadow-[0_15px_45px_rgba(0,0,0,0.22)]
        hover:shadow-[0_25px_65px_rgba(0,0,0,0.38)]
        transition-shadow
        duration-500
      "
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Ambient glow */}
      <motion.div
        animate={{
          opacity: hovered ? 0.5 : 0,
          scale: hovered ? 1.1 : 0.9,
        }}
        transition={{ duration: 0.5 }}
        className="
          absolute
          -top-20
          -right-20
          w-44
          h-44
          rounded-full
          bg-sky-500/20
          blur-3xl
          pointer-events-none
        "
      />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          {/* App icon */}
          <motion.div
            animate={{
              rotate: hovered ? -3 : 0,
              scale: hovered ? 1.06 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 18,
            }}
            className="
              relative
              w-[68px]
              h-[68px]
              rounded-[19px]
              shrink-0
              flex
              items-center
              justify-center
              text-white
              shadow-[0_12px_30px_rgba(0,0,0,0.35)]
              overflow-hidden
            "
            style={{
              background:
                app.iconBg ||
                'linear-gradient(135deg,#334155,#64748b)',
            }}
          >
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-br
                from-white/35
                via-transparent
                to-black/25
                pointer-events-none
              "
            />

            <div
              className="
                absolute
                -top-8
                -left-8
                w-20
                h-20
                rounded-full
                bg-white/20
                blur-xl
              "
            />

            <span className="relative z-10 text-2xl font-black drop-shadow-lg">
              {app.name?.charAt(0)?.toUpperCase()}
            </span>
          </motion.div>

          {/* Rating */}
          <div
            className="
              flex
              items-center
              gap-1
              px-2
              py-1
              rounded-full
              bg-black/20
              border border-white/5
              text-[10px]
              text-amber-300
            "
          >
            <Star className="w-3 h-3 fill-current" />
            <span className="font-bold">4.9</span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-white truncate">
              {app.name}
            </h3>

            {index < 3 && (
              <span
                className="
                  px-1.5
                  py-0.5
                  rounded-md
                  bg-sky-400/10
                  border border-sky-400/20
                  text-[8px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-sky-300
                "
              >
                Featured
              </span>
            )}
          </div>

          <p className="mt-1 text-[11px] text-slate-400">
            {app.category || 'Application'}
          </p>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400 line-clamp-2 min-h-[32px]">
            {getAppDescription(app)}
          </p>
        </div>

        {/* Bottom action */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Download className="w-3 h-3" />
            <span>Abhishek OS</span>
          </div>

          <motion.button
            whileHover={{
              scale: 1.04,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={() => onOpen(app.id)}
            className="
              relative
              min-w-[70px]
              px-4
              py-2
              rounded-full
              bg-white
              text-slate-950
              text-[10px]
              font-black
              shadow-[0_5px_18px_rgba(255,255,255,0.12)]
              hover:bg-slate-100
              transition-colors
              overflow-hidden
            "
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              {installed ? (
                <>
                  <Check className="w-3 h-3" />
                  OPEN
                </>
              ) : (
                <>
                  GET
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export const AppStoreApp: React.FC = () => {
  const { openApp, dockAppIds } = useOS();

  const [activeCategory, setActiveCategory] =
    useState<Category>('All');

  const [search, setSearch] = useState('');

  const storeApps = useMemo(
    () => Object.values(APP_REGISTRY),
    [],
  );

  const filteredApps = useMemo(() => {
    return storeApps.filter(app => {
      const matchesCategory =
        activeCategory === 'All' ||
        getAppCategory(app) === activeCategory;

      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        app.name?.toLowerCase().includes(query) ||
        app.category?.toLowerCase().includes(query) ||
        getAppDescription(app)
          .toLowerCase()
          .includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [storeApps, activeCategory, search]);

  const featuredApps = storeApps.slice(0, 3);

  const handleOpen = (id: string) => {
    openApp(id);
    sound.playClick();
  };

  return (
    <div
      className="
        flex-1
        h-full
        min-h-0
        overflow-y-auto
        overflow-x-hidden
        bg-[#080b12]
        text-white
        select-none
      "
    >
      {/* ============================================================
          BACKGROUND
      ============================================================ */}

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -40, 50, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute
            -top-40
            left-[15%]
            w-[420px]
            h-[420px]
            rounded-full
            bg-sky-500/[0.07]
            blur-[100px]
          "
        />

        <motion.div
          animate={{
            x: [0, -80, 40, 0],
            y: [0, 50, -30, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="
            absolute
            top-[35%]
            right-[-100px]
            w-[420px]
            h-[420px]
            rounded-full
            bg-purple-500/[0.06]
            blur-[110px]
          "
        />
      </div>

      <div className="relative z-10 max-w-[1450px] mx-auto px-5 md:px-8 lg:px-10 py-6">
        {/* ============================================================
            TOP BAR
        ============================================================ */}

        <motion.div
          initial={{
            opacity: 0,
            y: -15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            justify-between
            gap-4
            mb-7
          "
        >
          <div>
            <div className="flex items-center gap-2">
              <div
                className="
                  w-8
                  h-8
                  rounded-[10px]
                  bg-gradient-to-br
                  from-sky-400
                  via-blue-500
                  to-purple-600
                  flex
                  items-center
                  justify-center
                  shadow-lg
                  shadow-sky-500/20
                "
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>

              <h1 className="text-2xl font-black tracking-tight">
                App Store
              </h1>
            </div>

            <p className="text-xs text-slate-500 mt-1 ml-10">
              Discover apps for your Abhishek OS
            </p>
          </div>

          {/* Search */}
          <div
            className="
              relative
              w-full
              md:w-[280px]
              lg:w-[330px]
            "
          >
            <Search
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                w-4
                h-4
                text-slate-500
              "
            />

            <input
              value={search}
              onChange={e =>
                setSearch(e.target.value)
              }
              placeholder="Search apps..."
              className="
                w-full
                h-10
                pl-10
                pr-4
                rounded-xl
                bg-white/[0.055]
                border border-white/[0.09]
                text-xs
                text-white
                placeholder:text-slate-500
                outline-none
                focus:border-sky-400/40
                focus:bg-white/[0.07]
                transition-all
              "
            />
          </div>
        </motion.div>

        {/* ============================================================
            CATEGORY BAR
        ============================================================ */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{ delay: 0.1 }}
          className="
            flex
            items-center
            gap-2
            overflow-x-auto
            pb-1
            scrollbar-none
            mb-7
          "
        >
          {(Object.keys(
            CATEGORY_ICONS,
          ) as Category[]).map(category => {
            const Icon =
              CATEGORY_ICONS[category];

            const active =
              activeCategory === category;

            return (
              <motion.button
                key={category}
                whileTap={{
                  scale: 0.96,
                }}
                onClick={() => {
                  setActiveCategory(category);
                  sound.playClick();
                }}
                className={`
                  shrink-0
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-full
                  text-[11px]
                  font-bold
                  border
                  transition-all
                  ${
                    active
                      ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10'
                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {category}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ============================================================
            HERO
        ============================================================ */}

        <motion.section
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="
            relative
            min-h-[310px]
            md:min-h-[350px]
            rounded-[30px]
            overflow-hidden
            border border-white/[0.12]
            bg-gradient-to-br
            from-[#172554]
            via-[#111827]
            to-[#170f2e]
            shadow-[0_30px_100px_rgba(0,0,0,0.38)]
            mb-10
          "
        >
          {/* Moving light */}
          <motion.div
            animate={{
              x: ['-20%', '120%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="
              absolute
              top-0
              bottom-0
              w-32
              bg-white/[0.035]
              blur-2xl
              skew-x-12
            "
          />

          {/* Glow orbs */}
          <div
            className="
              absolute
              -right-24
              -top-28
              w-[390px]
              h-[390px]
              rounded-full
              bg-blue-500/20
              blur-[80px]
            "
          />

          <div
            className="
              absolute
              right-[25%]
              bottom-[-150px]
              w-[330px]
              h-[330px]
              rounded-full
              bg-purple-500/20
              blur-[80px]
            "
          />

          <div
            className="
              relative
              z-10
              h-full
              min-h-[310px]
              md:min-h-[350px]
              p-7
              md:p-10
              flex
              items-center
            "
          >
            <div className="max-w-2xl">
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: 0.15,
                }}
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  rounded-full
                  bg-white/[0.08]
                  border border-white/[0.12]
                  backdrop-blur-xl
                  text-sky-300
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-widest
                "
              >
                <Sparkles className="w-3.5 h-3.5" />
                Curated for Abhishek OS
              </motion.div>

              <h2
                className="
                  mt-5
                  text-3xl
                  md:text-5xl
                  lg:text-6xl
                  font-black
                  tracking-[-0.04em]
                  leading-[0.95]
                  text-white
                "
              >
                Apps that feel
                <br />
                <span
                  className="
                    text-transparent
                    bg-clip-text
                    bg-gradient-to-r
                    from-sky-300
                    via-blue-400
                    to-purple-400
                  "
                >
                  right at home.
                </span>
              </h2>

              <p
                className="
                  mt-5
                  text-xs
                  md:text-sm
                  text-slate-300
                  max-w-xl
                  leading-relaxed
                "
              >
                Discover powerful tools, creative
                experiences and developer utilities
                designed to work beautifully inside
                your desktop.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{
                    scale: 1.04,
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  onClick={() => {
                    if (storeApps[0]) {
                      handleOpen(storeApps[0].id);
                    }
                  }}
                  className="
                    px-5
                    py-2.5
                    rounded-full
                    bg-white
                    text-slate-950
                    text-[11px]
                    font-black
                    shadow-xl
                    shadow-black/20
                    flex
                    items-center
                    gap-2
                  "
                >
                  Explore Apps
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>

                <div
                  className="
                    px-4
                    py-2.5
                    rounded-full
                    bg-white/[0.06]
                    border border-white/[0.1]
                    text-[10px]
                    text-slate-300
                    flex
                    items-center
                    gap-2
                  "
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  {storeApps.length} apps available
                </div>
              </div>
            </div>

            {/* 3D floating app stack */}
            <div
              className="
                hidden
                lg:block
                absolute
                right-12
                top-1/2
                -translate-y-1/2
                w-[330px]
                h-[270px]
              "
              style={{
                perspective: '1000px',
              }}
            >
              {[2, 1, 0].map((offset, index) => {
                const app = featuredApps[offset];

                if (!app) return null;

                return (
                  <motion.div
                    key={app.id}
                    initial={{
                      opacity: 0,
                      y: 80,
                      rotateX: 40,
                      rotateZ: -10,
                    }}
                    animate={{
                      opacity: 1,
                      y: offset * 22,
                      rotateX: 0,
                      rotateZ:
                        offset === 0
                          ? -4
                          : offset === 1
                            ? 3
                            : 8,
                    }}
                    transition={{
                      delay: 0.25 + index * 0.15,
                      type: 'spring',
                      stiffness: 120,
                      damping: 15,
                    }}
                    whileHover={{
                      y: offset * 22 - 10,
                      rotateZ: 0,
                      scale: 1.04,
                    }}
                    onClick={() => handleOpen(app.id)}
                    className="
                      absolute
                      right-0
                      w-[245px]
                      h-[155px]
                      rounded-[25px]
                      border border-white/15
                      bg-white/[0.08]
                      backdrop-blur-2xl
                      shadow-[0_25px_60px_rgba(0,0,0,0.4)]
                      p-5
                      cursor-pointer
                    "
                    style={{
                      zIndex: 10 - offset,
                      transformStyle:
                        'preserve-3d',
                    }}
                  >
                    <div
                      className="
                        absolute
                        inset-0
                        rounded-[25px]
                        bg-gradient-to-br
                        from-white/10
                        via-transparent
                        to-black/20
                        pointer-events-none
                      "
                    />

                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-12
                          h-12
                          rounded-[14px]
                          flex
                          items-center
                          justify-center
                          text-white
                          font-black
                          shadow-lg
                        "
                        style={{
                          background:
                            app.iconBg,
                        }}
                      >
                        {app.name?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {app.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {app.category}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 text-[10px] text-slate-400 line-clamp-2">
                      {getAppDescription(app)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        {/* ============================================================
            FEATURED
        ============================================================ */}

        {activeCategory === 'All' &&
          !search && (
            <section className="mb-10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black">
                    Featured
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hand-picked experiences for your desktop
                  </p>
                </div>

                <button
                  onClick={() =>
                    setActiveCategory('All')
                  }
                  className="
                    flex
                    items-center
                    gap-1
                    text-[10px]
                    font-bold
                    text-sky-400
                    hover:text-sky-300
                  "
                >
                  See All
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  md:grid-cols-3
                  gap-4
                "
              >
                {featuredApps.map((app, index) => (
                  <motion.button
                    key={app.id}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    whileHover={{
                      y: -5,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={() =>
                      handleOpen(app.id)
                    }
                    className="
                      text-left
                      relative
                      overflow-hidden
                      rounded-[22px]
                      p-5
                      min-h-[150px]
                      bg-white/[0.045]
                      border border-white/[0.09]
                      hover:border-white/[0.17]
                      transition-all
                    "
                  >
                    <div
                      className="
                        absolute
                        -right-12
                        -top-12
                        w-36
                        h-36
                        rounded-full
                        blur-3xl
                        opacity-30
                      "
                      style={{
                        background:
                          app.iconBg,
                      }}
                    />

                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="
                          w-14
                          h-14
                          rounded-[17px]
                          flex
                          items-center
                          justify-center
                          shrink-0
                          text-white
                          font-black
                          text-xl
                          shadow-xl
                        "
                        style={{
                          background:
                            app.iconBg,
                        }}
                      >
                        {app.name?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {app.name}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {app.category}
                        </div>

                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-3 h-3 text-amber-400 fill-current" />
                          <span className="text-[10px] text-slate-400">
                            4.9
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="relative z-10 mt-4 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {getAppDescription(app)}
                    </p>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

        {/* ============================================================
            ALL APPS
        ============================================================ */}

        <section className="pb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-xl font-black">
                {search
                  ? 'Search Results'
                  : activeCategory === 'All'
                    ? 'All Applications'
                    : activeCategory}
              </h2>

              <p className="text-[11px] text-slate-500 mt-1">
                {filteredApps.length}{' '}
                {filteredApps.length === 1
                  ? 'application'
                  : 'applications'}
              </p>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {filteredApps.length > 0 ? (
              <motion.div
                layout
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  xl:grid-cols-3
                  gap-4
                "
              >
                {filteredApps.map(
                  (app, index) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      index={index}
                      installed={dockAppIds.includes(
                        app.id,
                      )}
                      onOpen={handleOpen}
                    />
                  ),
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="
                  min-h-[280px]
                  rounded-[28px]
                  border border-white/[0.08]
                  bg-white/[0.025]
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  px-6
                "
              >
                <div
                  className="
                    w-16
                    h-16
                    rounded-[20px]
                    bg-white/[0.06]
                    border border-white/[0.08]
                    flex
                    items-center
                    justify-center
                    mb-4
                  "
                >
                  <Search className="w-7 h-7 text-slate-500" />
                </div>

                <h3 className="text-sm font-bold text-white">
                  No apps found
                </h3>

                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Try another search or browse a
                  different category.
                </p>

                <button
                  onClick={() => {
                    setSearch('');
                    setActiveCategory('All');
                  }}
                  className="
                    mt-5
                    px-4
                    py-2
                    rounded-full
                    bg-white
                    text-slate-950
                    text-[10px]
                    font-bold
                  "
                >
                  Browse All Apps
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};
