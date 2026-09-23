import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { motion } from 'motion/react';

import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudLightning,
  Sun,
  Wind,
  Music,
  Play,
  Pause,
  SkipForward,
  Activity,
  Cpu,
  HardDrive,
  Droplets,
  RefreshCw,
  MapPin,
  Umbrella,
  Minus,
  GripVertical,
  Maximize2,
} from 'lucide-react';

import { useOS } from '../../context/OSContext';

import {
  fetchWeather,
  searchLocations,
  getWeatherVisual,
  type WeatherData,
} from '../../services/weatherService';

/* ============================================================
   TYPES
============================================================ */

type WidgetId = 'weather' | 'music' | 'system';

type WidgetPosition = {
  x: number;
  y: number;
};

type WidgetPositions = Record<WidgetId, WidgetPosition>;

type MinimizedState = Record<WidgetId, boolean>;

/* ============================================================
   DEFAULT POSITIONS
   All widgets start on the RIGHT side.
   They are vertically separated so they don't overlap.
============================================================ */

const DEFAULT_POSITIONS: WidgetPositions = {
  weather: {
    x: 0,
    y: 48,
  },

  music: {
    x: 0,
    y: 350,
  },

  system: {
    x: 0,
    y: 575,
  },
};

const DEFAULT_MINIMIZED: MinimizedState = {
  weather: false,
  music: false,
  system: false,
};

/* ============================================================
   WEATHER ICON
============================================================ */

const WeatherIcon: React.FC<{
  weather: WeatherData | null;
  size?: number;
}> = ({ weather, size = 32 }) => {
  if (!weather) {
    return <CloudSun size={size} />;
  }

  const visual = getWeatherVisual(
    weather.current.weatherCode,
    weather.current.isDay
  );

  switch (visual.icon) {
    case 'sun':
      return <Sun size={size} />;

    case 'cloud':
      return <Cloud size={size} />;

    case 'cloud-sun':
      return <CloudSun size={size} />;

    case 'rain':
      return <CloudRain size={size} />;

    case 'snow':
      return <CloudSnow size={size} />;

    case 'storm':
      return <CloudLightning size={size} />;

    default:
      return <CloudSun size={size} />;
  }
};

/* ============================================================
   MINI WEATHER SCENE
============================================================ */

const MiniWeatherScene: React.FC<{
  weather: WeatherData | null;
}> = ({ weather }) => {
  if (!weather) {
    return null;
  }

  const visual = getWeatherVisual(
    weather.current.weatherCode,
    weather.current.isDay
  );

  /* ---------------- RAIN ---------------- */

  if (visual.kind === 'rain') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={`rain-${index}`}
            className="
              absolute
              -top-8
              h-8
              w-px
              rounded-full
              bg-sky-300/30
            "
            style={{
              left: `${(index * 29) % 100}%`,
            }}
            animate={{
              y: [0, 150],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 0.7 + (index % 4) * 0.15,
              repeat: Infinity,
              ease: 'linear',
              delay: (index % 8) * 0.12,
            }}
          />
        ))}

        <motion.div
          className="
            absolute
            -right-8
            -top-10
            h-24
            w-32
            rounded-full
            bg-sky-400/10
            blur-2xl
          "
          animate={{
            x: [-10, 10, -10],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    );
  }

  /* ---------------- SNOW ---------------- */

  if (visual.kind === 'snow') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={`snow-${index}`}
            className="
              absolute
              -top-3
              h-1.5
              w-1.5
              rounded-full
              bg-white/60
              shadow-[0_0_8px_rgba(255,255,255,0.4)]
            "
            style={{
              left: `${(index * 37) % 100}%`,
            }}
            animate={{
              y: [0, 150],
              x: [0, index % 2 === 0 ? 10 : -10, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + (index % 4) * 0.7,
              repeat: Infinity,
              ease: 'linear',
              delay: (index % 8) * 0.35,
            }}
          />
        ))}
      </div>
    );
  }

  /* ---------------- CLOUDS ---------------- */

  if (
    visual.kind === 'cloud' ||
    visual.kind === 'partly-cloudy'
  ) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="
            absolute
            -right-8
            top-1
            h-12
            w-32
            rounded-full
            bg-white/10
            blur-md
          "
          animate={{
            x: [-10, 12, -10],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="
            absolute
            right-12
            top-8
            h-7
            w-20
            rounded-full
            bg-white/10
            blur-md
          "
          animate={{
            x: [10, -10, 10],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <motion.div
          className="
            absolute
            right-[-30px]
            bottom-[-25px]
            h-24
            w-24
            rounded-full
            bg-sky-400/10
            blur-2xl
          "
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    );
  }

  /* ---------------- STORM ---------------- */

  if (visual.kind === 'storm') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, index) => (
          <motion.span
            key={`storm-rain-${index}`}
            className="
              absolute
              -top-8
              h-9
              w-px
              bg-sky-300/30
            "
            style={{
              left: `${(index * 41) % 100}%`,
            }}
            animate={{
              y: [0, 160],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 0.65 + (index % 3) * 0.15,
              repeat: Infinity,
              ease: 'linear',
              delay: index * 0.08,
            }}
          />
        ))}

        <motion.div
          className="
            absolute
            inset-0
            bg-white/20
          "
          animate={{
            opacity: [0, 0, 0.12, 0, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.55, 0.57, 0.6, 1],
          }}
        />
      </div>
    );
  }

  /* ---------------- SUNNY ---------------- */

  if (visual.icon === 'sun') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="
            absolute
            -right-5
            -top-8
            h-28
            w-28
            rounded-full
            bg-amber-400/15
            blur-2xl
          "
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {Array.from({ length: 8 }).map((_, index) => (
          <motion.span
            key={`sun-particle-${index}`}
            className="
              absolute
              h-1
              w-1
              rounded-full
              bg-amber-300/50
            "
            style={{
              right: `${20 + ((index * 13) % 55)}%`,
              top: `${10 + ((index * 17) % 60)}%`,
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 2 + (index % 3),
              repeat: Infinity,
              delay: index * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    );
  }

  return null;
};

/* ============================================================
   DESKTOP WEATHER WIDGET
============================================================ */

const DesktopWeatherMini: React.FC<{
  onMinimize: () => void;
}> = ({ onMinimize }) => {
  const { settings } = useOS();

  const [weather, setWeather] =
    useState<WeatherData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState(false);

  /* ==========================================================
     FALLBACK USING OS REGION
  ========================================================== */

  const loadFromRegion = useCallback(async () => {
    try {
      const query =
        settings.region?.trim() || 'Pune';

      const locations =
        await searchLocations(query);

      if (!locations || locations.length === 0) {
        throw new Error('Location not found');
      }

      const location = locations[0];

      const data = await fetchWeather(
        location.latitude,
        location.longitude
      );

      setWeather({
        ...data,
        location: {
          ...data.location,
          name: location.name,
          country: location.country,
          admin1: location.admin1,
        },
      });

      setError(false);
    } catch {
      setError(true);
    }
  }, [settings.region]);

  /* ==========================================================
     LIVE WEATHER
  ========================================================== */

  const loadWeather = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(false);

        if (
          typeof navigator !== 'undefined' &&
          'geolocation' in navigator
        ) {
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                try {
                  const data =
                    await fetchWeather(
                      position.coords.latitude,
                      position.coords.longitude
                    );

                  setWeather(data);
                  setError(false);
                } catch {
                  await loadFromRegion();
                } finally {
                  resolve();
                }
              },

              async () => {
                await loadFromRegion();
                resolve();
              },

              {
                enableHighAccuracy: false,
                timeout: 7000,
                maximumAge: 10 * 60 * 1000,
              }
            );
          });
        } else {
          await loadFromRegion();
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadFromRegion]
  );

  /* ==========================================================
     INITIAL LOAD + AUTO REFRESH
  ========================================================== */

  useEffect(() => {
    loadWeather();

    const timer = window.setInterval(() => {
      loadWeather();
    }, 10 * 60 * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadWeather]);

  const visual = weather
    ? getWeatherVisual(
        weather.current.weatherCode,
        weather.current.isDay
      )
    : null;

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading && !weather) {
    return (
      <motion.div
        className="
          relative
          w-[280px]
          overflow-hidden
          rounded-[24px]
          border
          border-white/10
          bg-black/35
          backdrop-blur-2xl
          shadow-[0_20px_70px_rgba(0,0,0,0.35)]
        "
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-cyan-500/10" />

        <div className="relative">
          <WidgetHeader
            title="Weather"
            subtitle="Detecting location..."
            onMinimize={onMinimize}
          />

          <div className="px-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white/70">
                  Finding your location
                </div>

                <div className="mt-1 text-[10px] text-white/35">
                  Loading live conditions...
                </div>
              </div>

              <motion.div
                animate={{
                  y: [0, -5, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/10
                "
              >
                <CloudSun className="h-8 w-8 text-sky-300" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (!weather && error) {
    return (
      <motion.div
        className="
          relative
          w-[280px]
          overflow-hidden
          rounded-[24px]
          border
          border-white/10
          bg-black/35
          backdrop-blur-2xl
          shadow-[0_20px_70px_rgba(0,0,0,0.35)]
        "
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-blue-500/10" />

        <div className="relative">
          <WidgetHeader
            title="Weather"
            subtitle="Weather unavailable"
            onMinimize={onMinimize}
          />

          <div className="px-4 pb-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                loadWeather(true);
              }}
              className="
                flex
                w-full
                items-center
                justify-between
                rounded-xl
                border
                border-white/10
                bg-white/5
                p-3
                text-left
                transition-all
                hover:bg-white/10
                active:scale-[0.98]
              "
            >
              <div>
                <div className="text-sm font-semibold text-white">
                  Try again
                </div>

                <div className="mt-1 text-[10px] text-white/40">
                  Unable to load weather
                </div>
              </div>

              <RefreshCw className="h-6 w-6 text-sky-300" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ==========================================================
     MAIN WEATHER CARD
  ========================================================== */

  return (
    <motion.div
      className="
        relative
        w-[280px]
        overflow-hidden
        rounded-[24px]
        border
        border-white/10
        bg-black/35
        backdrop-blur-2xl
        shadow-[0_20px_70px_rgba(0,0,0,0.35)]
      "
    >
      <MiniWeatherScene weather={weather} />

      <div
        className={`
          absolute
          inset-0
          pointer-events-none
          bg-gradient-to-br
          ${
            visual?.kind === 'rain'
              ? 'from-sky-500/10 via-transparent to-blue-500/10'
              : visual?.kind === 'snow'
                ? 'from-white/10 via-transparent to-sky-300/10'
                : visual?.kind === 'storm'
                  ? 'from-violet-500/10 via-transparent to-blue-600/10'
                  : visual?.icon === 'sun'
                    ? 'from-amber-400/10 via-transparent to-orange-500/10'
                    : 'from-sky-500/10 via-transparent to-cyan-500/10'
          }
        `}
      />

      <div className="relative">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <WidgetHeader
              title="Live Weather"
              subtitle={
                weather?.location.name ||
                'Your Location'
              }
              icon={
                <MapPin className="h-3 w-3" />
              }
              onMinimize={onMinimize}
              extraAction={
                <button
                  type="button"
                  onPointerDown={(event) =>
                    event.stopPropagation()
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    loadWeather(true);
                  }}
                  className="
                    group
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    text-white/50
                    transition-all
                    hover:bg-white/10
                    hover:text-white
                    active:scale-90
                  "
                  title="Refresh weather"
                >
                  <RefreshCw
                    className={`
                      h-3.5
                      w-3.5
                      ${
                        refreshing
                          ? 'animate-spin'
                          : ''
                      }
                    `}
                  />
                </button>
              }
            />
          </div>
        </div>

        <div className="px-4 pb-4">
          {/* COUNTRY */}

          {weather?.location.country && (
            <div className="ml-5 -mt-2 text-[9px] text-white/35 truncate max-w-[170px]">
              {weather.location.admin1
                ? `${weather.location.admin1}, `
                : ''}
              {weather.location.country}
            </div>
          )}

          {/* TEMPERATURE */}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-end">
              <span
                className="
                  text-[42px]
                  leading-none
                  font-black
                  tracking-[-0.05em]
                  text-white
                "
              >
                {weather
                  ? Math.round(
                      weather.current.temperature
                    )
                  : '--'}
              </span>

              <span
                className="
                  mb-1
                  ml-1
                  text-lg
                  font-semibold
                  text-white/60
                "
              >
                °C
              </span>
            </div>

            <motion.div
              animate={{
                y: [0, -5, 0],
                rotate: [0, 2, -2, 0],
                scale: [1, 1.04, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                bg-white/10
                shadow-lg
              "
            >
              <WeatherIcon
                weather={weather}
                size={30}
              />
            </motion.div>
          </div>

          {/* CONDITION */}

          <div className="mt-1 text-xs font-medium text-white/60">
            {weather?.current.condition ||
              'Loading...'}
          </div>

          {/* FEELS LIKE */}

          {weather && (
            <div className="mt-1 text-[10px] text-white/35">
              Feels like{' '}
              {Math.round(
                weather.current.apparentTemperature
              )}
              °C
            </div>
          )}

          {/* DETAILS */}

          {weather && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {/* HIGH */}

              <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-white/30">
                  High
                </div>

                <div className="mt-1 text-xs font-bold text-white/80">
                  {weather.daily?.[0]
                    ? Math.round(
                        weather.daily[0].max
                      )
                    : '--'}
                  °
                </div>
              </div>

              {/* LOW */}

              <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                <div className="text-[8px] uppercase tracking-wider text-white/30">
                  Low
                </div>

                <div className="mt-1 text-xs font-bold text-white/80">
                  {weather.daily?.[0]
                    ? Math.round(
                        weather.daily[0].min
                      )
                    : '--'}
                  °
                </div>
              </div>

              {/* HUMIDITY */}

              <div className="rounded-xl border border-white/5 bg-white/5 p-2">
                <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-white/30">
                  <Droplets className="h-2.5 w-2.5" />
                  Humidity
                </div>

                <div className="mt-1 text-xs font-bold text-white/80">
                  {Math.round(
                    weather.current.humidity
                  )}
                  %
                </div>
              </div>
            </div>
          )}

          {/* BOTTOM INFO */}

          {weather && (
            <div className="mt-3 flex items-center justify-between text-[9px] text-white/40">
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />

                {Math.round(
                  weather.current.windSpeed
                )}{' '}
                km/h
              </div>

              <div className="flex items-center gap-1">
                <Umbrella className="h-3 w-3" />

                {weather.daily?.[0]
                  ? Math.round(
                      weather.daily[0]
                        .precipitationProbability
                    )
                  : 0}
                %
              </div>

              <div>
                {weather.current.isDay
                  ? 'Day'
                  : 'Night'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIVE */}

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-white/5 bg-black/20 px-2 py-0.5">
        <motion.span
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
        />

        <span className="text-[7px] uppercase tracking-[0.15em] text-white/30">
          Live
        </span>
      </div>
    </motion.div>
  );
};

/* ============================================================
   REUSABLE WIDGET HEADER
============================================================ */

const WidgetHeader: React.FC<{
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onMinimize: () => void;
  extraAction?: React.ReactNode;
}> = ({
  title,
  subtitle,
  icon,
  onMinimize,
  extraAction,
}) => {
  return (
    <div
      className="
        widget-drag-handle
        flex
        items-center
        justify-between
        gap-2
        px-4
        py-3
        cursor-grab
        active:cursor-grabbing
      "
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-sky-300/80 font-bold">
          {icon}
          {title}
        </div>

        <div className="mt-1 truncate text-sm font-semibold text-white">
          {subtitle}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {extraAction}

        <button
          type="button"
          onPointerDown={(event) =>
            event.stopPropagation()
          }
          onClick={(event) => {
            event.stopPropagation();
            onMinimize();
          }}
          className="
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-xl
            border
            border-white/10
            bg-white/5
            text-white/40
            transition-all
            hover:bg-white/10
            hover:text-white
            active:scale-90
          "
          title="Minimize widget"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   MINIMIZED WIDGET
============================================================ */

const MinimizedWidget: React.FC<{
  id: WidgetId;
  title: string;
  icon: React.ReactNode;
  position: WidgetPosition;
  onRestore: () => void;
  onPointerDown: (
    event: React.PointerEvent<HTMLDivElement>,
    id: WidgetId
  ) => void;
}> = ({
  id,
  title,
  icon,
  onRestore,
  onPointerDown,
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      className="
        w-[150px]
        overflow-hidden
        rounded-2xl
        border
        border-white/10
        bg-black/45
        backdrop-blur-2xl
        shadow-[0_15px_50px_rgba(0,0,0,0.35)]
      "
      onPointerDown={(event) =>
        onPointerDown(event, id)
      }
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-white/10
            text-cyan-300
          "
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-bold text-white/80">
            {title}
          </div>

          <div className="text-[8px] text-white/30">
            Minimized
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(event) =>
            event.stopPropagation()
          }
          onClick={(event) => {
            event.stopPropagation();
            onRestore();
          }}
          className="
            flex
            h-7
            w-7
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-white/5
            text-white/50
            transition
            hover:bg-white/10
            hover:text-white
          "
          title="Restore widget"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

/* ============================================================
   WIDGET DRAG SYSTEM
============================================================ */

const useWidgetManager = () => {
  const [positions, setPositions] =
    useState<WidgetPositions>(
      DEFAULT_POSITIONS
    );

  const [minimized, setMinimized] =
    useState<MinimizedState>(
      DEFAULT_MINIMIZED
    );

  const dragRef = useRef<{
    id: WidgetId;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [dragging, setDragging] =
    useState<WidgetId | null>(null);

  /* ==========================================================
     RIGHT-SIDE INITIAL POSITION
  ========================================================== */

  useEffect(() => {
    const setInitialRightPositions = () => {
      const widgetWidth = 280;
      const rightMargin = 24;

      const rightX =
        Math.max(
          8,
          window.innerWidth -
            widgetWidth -
            rightMargin
        );

      setPositions((current) => ({
        ...current,
        weather: {
          ...current.weather,
          x: rightX,
        },
        music: {
          ...current.music,
          x: rightX,
        },
        system: {
          ...current.system,
          x: rightX,
        },
      }));
    };

    setInitialRightPositions();

    window.addEventListener(
      'load',
      setInitialRightPositions
    );

    return () => {
      window.removeEventListener(
        'load',
        setInitialRightPositions
      );
    };
  }, []);

  /* ==========================================================
     CLAMP POSITION
  ========================================================== */

  const clampPosition = useCallback(
    (
      x: number,
      y: number,
      width = 280,
      height = 220
    ) => {
      const maxX = Math.max(
        8,
        window.innerWidth - width - 8
      );

      const maxY = Math.max(
        8,
        window.innerHeight - height - 8
      );

      return {
        x: Math.min(
          Math.max(8, x),
          maxX
        ),

        y: Math.min(
          Math.max(8, y),
          maxY
        ),
      };
    },
    []
  );

  /* ==========================================================
     START DRAG
  ========================================================== */

  const startDrag = useCallback(
    (
      event: React.PointerEvent<HTMLDivElement>,
      id: WidgetId
    ) => {
      if (event.button !== 0) {
        return;
      }

      const current =
        positions[id];

      dragRef.current = {
        id,

        offsetX:
          event.clientX - current.x,

        offsetY:
          event.clientY - current.y,
      };

      setDragging(id);

      event.currentTarget.setPointerCapture?.(
        event.pointerId
      );
    },
    [positions]
  );

  /* ==========================================================
     DRAG MOVEMENT
  ========================================================== */

  useEffect(() => {
    const handlePointerMove = (
      event: PointerEvent
    ) => {
      const drag = dragRef.current;

      if (!drag) {
        return;
      }

      const next = clampPosition(
        event.clientX - drag.offsetX,
        event.clientY - drag.offsetY,
        minimized[drag.id]
          ? 150
          : 280,
        minimized[drag.id]
          ? 50
          : 260
      );

      setPositions((current) => ({
        ...current,
        [drag.id]: next,
      }));
    };

    const stopDrag = () => {
      dragRef.current = null;
      setDragging(null);
    };

    window.addEventListener(
      'pointermove',
      handlePointerMove
    );

    window.addEventListener(
      'pointerup',
      stopDrag
    );

    window.addEventListener(
      'pointercancel',
      stopDrag
    );

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove
      );

      window.removeEventListener(
        'pointerup',
        stopDrag
      );

      window.removeEventListener(
        'pointercancel',
        stopDrag
      );
    };
  }, [clampPosition, minimized]);

  /* ==========================================================
     KEEP WIDGETS INSIDE VIEWPORT
  ========================================================== */

  useEffect(() => {
    const handleResize = () => {
      setPositions((current) => {
        const next = {
          ...current,
        };

        (
          Object.keys(
            next
          ) as WidgetId[]
        ).forEach((id) => {
          const size = minimized[id]
            ? {
                width: 150,
                height: 50,
              }
            : {
                width: 280,
                height: 260,
              };

          next[id] = clampPosition(
            next[id].x,
            next[id].y,
            size.width,
            size.height
          );
        });

        return next;
      });
    };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );
    };
  }, [clampPosition, minimized]);

  /* ==========================================================
     MINIMIZE
  ========================================================== */

  const minimize = useCallback(
    (id: WidgetId) => {
      setMinimized((current) => ({
        ...current,
        [id]: true,
      }));
    },
    []
  );

  /* ==========================================================
     RESTORE
  ========================================================== */

  const restore = useCallback(
    (id: WidgetId) => {
      setMinimized((current) => ({
        ...current,
        [id]: false,
      }));
    },
    []
  );

  return {
    positions,
    minimized,
    dragging,
    startDrag,
    minimize,
    restore,
  };
};

/* ============================================================
   MAIN DESKTOP WIDGETS
============================================================ */

export const DesktopWidgets: React.FC = () => {
  const {
    currentTrack,
    isPlayingMusic,
    togglePlayMusic,
    nextTrack,
    settings,
  } = useOS();

  const isLight =
    settings.theme === 'light';

  const {
    positions,
    minimized,
    dragging,
    startDrag,
    minimize,
    restore,
  } = useWidgetManager();

  return (
    <div
      className="
        absolute
        inset-0
        z-10
        pointer-events-none
        select-none
      "
    >
      {/* ======================================================
          WEATHER WIDGET
      ====================================================== */}

      {!minimized.weather && (
        <motion.div
          className={`
            absolute
            pointer-events-auto
            ${
              dragging === 'weather'
                ? 'z-[100] cursor-grabbing'
                : 'z-10'
            }
          `}
          style={{
            left: positions.weather.x,
            top: positions.weather.y,
          }}
          onPointerDown={(event) => {
            const target =
              event.target as HTMLElement;

            if (
              target.closest('button')
            ) {
              return;
            }

            startDrag(event, 'weather');
          }}
        >
          <DesktopWeatherMini
            onMinimize={() =>
              minimize('weather')
            }
          />
        </motion.div>
      )}

      {/* ======================================================
          MINIMIZED WEATHER
      ====================================================== */}

      {minimized.weather && (
        <motion.div
          className="
            absolute
            pointer-events-auto
            z-10
          "
          style={{
            left: positions.weather.x,
            top: positions.weather.y,
          }}
          onPointerDown={(event) => {
            if (
              (event.target as HTMLElement).closest(
                'button'
              )
            ) {
              return;
            }

            startDrag(event, 'weather');
          }}
        >
          <MinimizedWidget
            id="weather"
            title="Weather"
            icon={
              <CloudSun className="h-4 w-4" />
            }
            position={positions.weather}
            onRestore={() =>
              restore('weather')
            }
            onPointerDown={startDrag}
          />
        </motion.div>
      )}

      {/* ======================================================
          NOW PLAYING
      ====================================================== */}

      {!minimized.music && (
        <motion.div
          className={`
            absolute
            pointer-events-auto
            w-[280px]
            rounded-[24px]
            border
            border-white/10
            p-4
            backdrop-blur-2xl
            shadow-xl
            ${
              isLight
                ? 'glass-panel-light text-slate-800'
                : 'glass-panel text-white'
            }
            ${
              dragging === 'music'
                ? 'z-[100] cursor-grabbing'
                : 'z-10'
            }
          `}
          style={{
            left: positions.music.x,
            top: positions.music.y,
          }}
          onPointerDown={(event) => {
            const target =
              event.target as HTMLElement;

            if (
              target.closest('button')
            ) {
              return;
            }

            startDrag(event, 'music');
          }}
        >
          {/* DRAG HEADER */}

          <div
            className="
              flex
              items-center
              justify-between
              mb-3
              cursor-grab
              active:cursor-grabbing
            "
          >
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />

              <span className="text-xs font-bold uppercase tracking-wider">
                Now Playing
              </span>

              <GripVertical className="h-3 w-3 text-white/20" />
            </div>

            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />

              <button
                type="button"
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) => {
                  event.stopPropagation();
                  minimize('music');
                }}
                className="
                  ml-1
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-white/5
                  text-white/40
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
                title="Minimize"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* MUSIC */}

          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gradient-to-br
                from-cyan-400
                to-blue-600
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Music className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">
                {currentTrack?.title ||
                  'No Track'}
              </div>

              <div className="text-[10px] text-white/40 truncate">
                {currentTrack?.artist ||
                  'Abhishek OS Music'}
              </div>
            </div>

            <button
              type="button"
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) => {
                event.stopPropagation();
                togglePlayMusic();
              }}
              className="
                w-8
                h-8
                rounded-full
                bg-white/10
                hover:bg-white/20
                flex
                items-center
                justify-center
                transition
                active:scale-90
              "
            >
              {isPlayingMusic ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) => {
                event.stopPropagation();
                nextTrack();
              }}
              className="
                w-8
                h-8
                rounded-full
                bg-white/10
                hover:bg-white/20
                flex
                items-center
                justify-center
                transition
                active:scale-90
              "
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ======================================================
          MINIMIZED MUSIC
      ====================================================== */}

      {minimized.music && (
        <motion.div
          className="absolute pointer-events-auto"
          style={{
            left: positions.music.x,
            top: positions.music.y,
          }}
          onPointerDown={(event) => {
            if (
              (event.target as HTMLElement).closest(
                'button'
              )
            ) {
              return;
            }

            startDrag(event, 'music');
          }}
        >
          <MinimizedWidget
            id="music"
            title="Now Playing"
            icon={
              <Music className="h-4 w-4" />
            }
            position={positions.music}
            onRestore={() =>
              restore('music')
            }
            onPointerDown={startDrag}
          />
        </motion.div>
      )}

      {/* ======================================================
          SYSTEM RESOURCE WIDGET
      ====================================================== */}

      {!minimized.system && (
        <motion.div
          className={`
            absolute
            pointer-events-auto
            w-[280px]
            rounded-[24px]
            border
            border-white/10
            p-4
            backdrop-blur-2xl
            shadow-xl
            ${
              isLight
                ? 'glass-panel-light text-slate-800'
                : 'glass-panel text-white'
            }
            ${
              dragging === 'system'
                ? 'z-[100] cursor-grabbing'
                : 'z-10'
            }
          `}
          style={{
            left: positions.system.x,
            top: positions.system.y,
          }}
          onPointerDown={(event) => {
            const target =
              event.target as HTMLElement;

            if (
              target.closest('button')
            ) {
              return;
            }

            startDrag(event, 'system');
          }}
        >
          {/* HEADER */}

          <div className="flex items-center justify-between mb-3">
            <div
              className="
                flex
                items-center
                gap-2
                cursor-grab
                active:cursor-grabbing
              "
            >
              <Cpu className="w-4 h-4 text-cyan-400" />

              <span className="text-xs font-bold uppercase tracking-wider">
                System
              </span>

              <GripVertical className="h-3 w-3 text-white/20" />
            </div>

            <button
              type="button"
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) => {
                event.stopPropagation();
                minimize('system');
              }}
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-white/5
                text-white/40
                transition
                hover:bg-white/10
                hover:text-white
              "
              title="Minimize"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* RESOURCES */}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <Cpu className="w-3 h-3" />
                CPU
              </div>

              <div className="mt-1 text-lg font-bold">
                18%
              </div>
            </div>

            <div className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <HardDrive className="w-3 h-3" />
                RAM
              </div>

              <div className="mt-1 text-lg font-bold">
                5.8 GB
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ======================================================
          MINIMIZED SYSTEM
      ====================================================== */}

      {minimized.system && (
        <motion.div
          className="absolute pointer-events-auto"
          style={{
            left: positions.system.x,
            top: positions.system.y,
          }}
          onPointerDown={(event) => {
            if (
              (event.target as HTMLElement).closest(
                'button'
              )
            ) {
              return;
            }

            startDrag(event, 'system');
          }}
        >
          <MinimizedWidget
            id="system"
            title="System"
            icon={
              <Cpu className="h-4 w-4" />
            }
            position={positions.system}
            onRestore={() =>
              restore('system')
            }
            onPointerDown={startDrag}
          />
        </motion.div>
      )}
    </div>
  );
};

export default DesktopWidgets;