import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  LocateFixed,
  MapPin,
  Moon,
  RefreshCw,
  Search,
  Snowflake,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { useOS } from '../../context/OSContext';
import {
  fetchWeather,
  getWeatherVisual,
  searchLocations,
  type WeatherData,
  type WeatherLocation,
  WEATHER_LOCATION_STORAGE_KEY,
  WEATHER_LOCATION_UPDATED_EVENT,
} from '../../services/weatherService';
import { sound } from '../../services/soundService';
import { AppIcon } from '../system/AppIcon';

type TemperatureUnit = 'C' | 'F';

const toFahrenheit = (celsius: number) => celsius * 9 / 5 + 32;

const formatHour = (value: string, timezone: string, hour12: boolean) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: 'numeric',
    hour12,
  }).format(date);
};

const formatDay = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));

const dateInTimezone = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

const formatClockTime = (value: string, timezone: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const WeatherMark: React.FC<{ kind: string; isDay: boolean; size?: number }> = ({
  kind,
  isDay,
  size = 42,
}) => {
  const iconProps = { size, strokeWidth: 1.6 };
  if (kind === 'storm') return <CloudLightning {...iconProps} className="text-violet-200" />;
  if (kind === 'rain') return <CloudRain {...iconProps} className="text-sky-200" />;
  if (kind === 'snow') return <CloudSnow {...iconProps} className="text-cyan-100" />;
  if (kind === 'fog') return <Cloud {...iconProps} className="text-slate-200" />;
  if (kind === 'cloud') return <Cloud {...iconProps} className="text-slate-100" />;
  if (kind === 'partly-cloudy') return <CloudSun {...iconProps} className="text-amber-100" />;
  return isDay
    ? <Sun {...iconProps} className="text-amber-200" />
    : <Moon {...iconProps} className="text-indigo-100" />;
};

const WeatherScene: React.FC<{ kind: string; isDay: boolean }> = ({ kind, isDay }) => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {kind === 'rain' || kind === 'storm' ? (
      <>
        {Array.from({ length: kind === 'storm' ? 34 : 24 }).map((_, index) => (
          <motion.span
            key={`rain-${index}`}
            className={`absolute -top-8 h-9 w-px rounded-full ${kind === 'storm' ? 'bg-blue-100/45' : 'bg-sky-100/40'}`}
            style={{ left: `${(index * 37) % 100}%` }}
            animate={{ y: [0, 260], opacity: [0, 0.8, 0] }}
            transition={{
              duration: (kind === 'storm' ? 0.55 : 0.8) + (index % 5) * 0.13,
              delay: (index % 8) * 0.19,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
        {kind === 'storm' && (
          <motion.div
            className="absolute inset-0 bg-white"
            animate={{ opacity: [0, 0, 0.14, 0, 0] }}
            transition={{ duration: 5, repeat: Infinity, times: [0, 0.48, 0.5, 0.53, 1] }}
          />
        )}
      </>
    ) : null}

    {kind === 'snow' && Array.from({ length: 28 }).map((_, index) => (
      <motion.span
        key={`snow-${index}`}
        className="absolute -top-3 h-1.5 w-1.5 rounded-full bg-white/75 shadow-[0_0_8px_rgba(255,255,255,.5)]"
        style={{ left: `${(index * 31) % 100}%` }}
        animate={{ y: [0, 270], x: [0, index % 2 ? 12 : -12, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 3.8 + (index % 5) * 0.7, delay: (index % 9) * 0.4, repeat: Infinity, ease: 'linear' }}
      />
    ))}

    {(kind === 'clear' || kind === 'partly-cloudy') && isDay && (
      <motion.div
        className="absolute -right-4 -top-14 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl"
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.45, 0.8, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    )}

    {kind === 'clear' && !isDay && Array.from({ length: 22 }).map((_, index) => (
      <motion.span
        key={`star-${index}`}
        className="absolute h-1 w-1 rounded-full bg-indigo-100"
        style={{ left: `${(index * 43) % 96}%`, top: `${(index * 29) % 78}%` }}
        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2.5 + (index % 4), delay: index * 0.11, repeat: Infinity }}
      />
    ))}

    {(kind === 'cloud' || kind === 'partly-cloudy' || kind === 'fog') && (
      <>
        <motion.div
          className="absolute -right-10 top-10 h-20 w-48 rounded-full bg-white/10 blur-xl"
          animate={{ x: [-12, 12, -12] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        {kind === 'fog' && (
          <motion.div
            className="absolute inset-x-[-10%] top-1/2 h-10 rounded-full bg-slate-100/10 blur-xl"
            animate={{ x: [-30, 30, -30], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </>
    )}
  </div>
);

export const WeatherApp: React.FC = () => {
  const { settings } = useOS();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState<TemperatureUnit>('C');
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showResults, setShowResults] = useState(false);

  const temperature = useCallback((value: number) => {
    const result = unit === 'C' ? value : toFahrenheit(value);
    return `${Math.round(result)}°`;
  }, [unit]);

  const loadLocation = useCallback(async (
    location: Pick<WeatherLocation, 'latitude' | 'longitude'> & Partial<WeatherLocation>,
    isRefresh = false,
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await fetchWeather(location.latitude, location.longitude, location);
      setWeather(data);
    } catch (loadError) {
      console.error('Could not load local weather conditions:', loadError);
      setError('Weather data could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Location services are not available in this environment. Search for a place instead.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      position => {
        const location: WeatherLocation = {
          name: 'Your location',
          country: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(location));
        } catch (storageError) {
          console.warn('Could not save the current weather location.', storageError);
        }
        window.dispatchEvent(new Event(WEATHER_LOCATION_UPDATED_EVENT));
        void loadLocation(location);
      },
      geoError => {
        setLoading(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError('Location access was denied. Search for your city to see its current weather.');
        } else if (geoError.code === geoError.TIMEOUT) {
          setError('Finding your location timed out. Try again or search for a city.');
        } else {
          setError('Your location is unavailable. Search for a city to see its current weather.');
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    );
  }, [loadLocation]);

  const loadSavedOrCurrent = useCallback(() => {
    try {
      const saved = localStorage.getItem(WEATHER_LOCATION_STORAGE_KEY);
      if (saved) {
        const location = JSON.parse(saved) as WeatherLocation;
        if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
          void loadLocation(location);
          return;
        }
      }
    } catch (storageError) {
      console.warn('Could not read the saved weather location.', storageError);
    }
    useCurrentLocation();
  }, [loadLocation, useCurrentLocation]);

  useEffect(() => {
    loadSavedOrCurrent();
  }, [loadSavedOrCurrent]);

  useEffect(() => {
    const handleLocationChange = () => loadSavedOrCurrent();
    window.addEventListener(WEATHER_LOCATION_UPDATED_EVENT, handleLocationChange);
    return () => window.removeEventListener(WEATHER_LOCATION_UPDATED_EVENT, handleLocationChange);
  }, [loadSavedOrCurrent]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (weather && Date.now() - weather.fetchedAt >= 10 * 60 * 1000) {
        void loadLocation(weather.location, true);
      }
    }, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [weather, loadLocation]);

  const searchPlace = async (event: React.FormEvent) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) {
      setSearchError('Type a city, state, or country to search.');
      setShowResults(true);
      return;
    }
    setSearching(true);
    setSearchError('');
    setShowResults(true);
    try {
      const results = await searchLocations(searchTerm);
      setLocations(results);
      if (results.length === 0) setSearchError('No locations found. Try a nearby city or a more specific search.');
    } catch (searchFailure) {
      console.error('Weather location search failed:', searchFailure);
      setLocations([]);
      setSearchError('Location search failed. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  const chooseLocation = (location: WeatherLocation) => {
    try {
      localStorage.setItem(WEATHER_LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (storageError) {
      console.warn('Could not save the selected weather location.', storageError);
    }
    window.dispatchEvent(new Event(WEATHER_LOCATION_UPDATED_EVENT));
    setShowResults(false);
    setLocations([]);
    setQuery('');
    sound.playClick();
    void loadLocation(location);
  };

  const visual = weather
    ? getWeatherVisual(weather.current.weatherCode, weather.current.isDay)
    : null;

  const currentHourIndex = useMemo(() => {
    if (!weather) return 0;
    const currentDate = new Date();
    const localDate = dateInTimezone(currentDate, weather.timezone);
    const localHour = new Intl.DateTimeFormat('en-GB', {
      timeZone: weather.timezone,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(currentDate);
    const targetHour = `${localDate}T${localHour}`;
    const index = weather.hourly.findIndex(hour => hour.time.slice(0, 13) >= targetHour);
    return Math.max(0, index);
  }, [weather]);

  const hourlyForecast = weather?.hourly.slice(currentHourIndex, currentHourIndex + 8) ?? [];
  const locationLabel = weather?.location.name || 'Your location';
  const locationDetail = [weather?.location.admin1, weather?.location.country].filter(Boolean).join(', ');
  const updatedAt = weather
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: weather.timezone,
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(weather.fetchedAt))
    : '';

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#07101c] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -15, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full blur-[120px] ${
            visual?.kind === 'rain' || visual?.kind === 'storm'
              ? 'bg-blue-500/15'
              : visual?.kind === 'snow'
                ? 'bg-cyan-200/10'
                : 'bg-sky-400/10'
          }`}
        />
        <div className="absolute -bottom-48 -left-40 h-[500px] w-[500px] rounded-full bg-teal-500/[0.07] blur-[120px]" />
      </div>

      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#07101c]/70 px-5 py-4 backdrop-blur-xl md:px-7">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotateY: -12, rotateX: 8, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="h-12 w-12 overflow-hidden rounded-[15px] shadow-[0_12px_30px_rgba(14,165,233,.28)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <AppIcon appId="weather" className="h-full w-full object-cover" />
          </motion.div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Weather</h1>
            <p className="text-[11px] text-slate-500">Live conditions for your world</p>
          </div>
        </div>

        <form onSubmit={searchPlace} className="relative order-3 w-full sm:order-none sm:w-[min(390px,45vw)]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-3 focus-within:border-sky-300/35">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search any city, state, or country..."
              aria-label="Search weather locations"
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-slate-600"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setLocations([]); setShowResults(false); }} aria-label="Clear search">
                <X className="h-3.5 w-3.5 text-slate-500 hover:text-white" />
              </button>
            )}
            <button type="submit" disabled={searching} className="text-sky-300 disabled:opacity-50" aria-label="Search">
              {searching ? <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Search className="h-3.5 w-3.5" />}
            </button>
          </div>
          <AnimatePresence>
            {showResults && (locations.length > 0 || searchError) && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4 }}
                className="absolute left-0 right-0 top-12 z-30 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#111b29]/95 p-2 shadow-2xl backdrop-blur-2xl"
              >
                {searchError && <p role="status" className="px-3 py-2 text-[10px] text-rose-300">{searchError}</p>}
                {locations.map((location, index) => (
                  <button
                    key={`${location.id ?? location.name}-${index}`}
                    type="button"
                    onClick={() => chooseLocation(location)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.07]"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-sky-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold">{location.name}</span>
                      <span className="mt-0.5 block truncate text-[9px] text-slate-500">{[location.admin1, location.country].filter(Boolean).join(', ')}</span>
                    </span>
                    {location.timezone && <span className="text-[8px] text-slate-600">{location.timezone}</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.035] p-1">
            {(['C', 'F'] as const).map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setUnit(value)}
                aria-pressed={unit === value}
                className={`h-7 w-8 rounded-md text-[10px] font-bold transition ${unit === value ? 'bg-sky-400/15 text-sky-200' : 'text-slate-500 hover:text-white'}`}
              >
                °{value}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (weather) void loadLocation(weather.location, true);
              else useCurrentLocation();
            }}
            aria-label="Refresh weather"
            title="Refresh weather"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4 md:p-7">
        {loading && !weather ? (
          <div className="mx-auto flex min-h-[420px] max-w-5xl flex-col items-center justify-center text-center">
            <motion.div
              animate={{ y: [0, -8, 0], rotateY: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-5 h-24 w-24 overflow-hidden rounded-[28px] shadow-[0_20px_50px_rgba(14,165,233,.25)]"
            >
              <AppIcon appId="weather" className="h-full w-full object-cover" />
            </motion.div>
            <p className="text-sm font-semibold">Finding your local forecast</p>
            <p className="mt-2 text-[10px] text-slate-500">Your location is only used to request nearby weather.</p>
            <button type="button" onClick={useCurrentLocation} className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-[10px] text-slate-300 hover:bg-white/[0.05]">
              <LocateFixed className="h-3.5 w-3.5" /> Try location again
            </button>
          </div>
        ) : !weather ? (
          <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/[0.07]">
              <MapPin className="h-7 w-7 text-sky-200" />
            </div>
            <h2 className="mt-5 text-lg font-bold">Set your weather location</h2>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">
              {error || 'Allow location access for local conditions, or search any city, state, or country above.'}
            </p>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="mt-5 flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-sky-400"
            >
              <LocateFixed className="h-4 w-4" /> Use my location
            </button>
          </div>
        ) : (
          <motion.div
            key={`${weather.location.latitude}-${weather.location.longitude}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-6xl space-y-4"
          >
            {error && (
              <div role="status" className="rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-4 py-3 text-[10px] text-rose-200">
                {error} Showing the last successfully loaded forecast.
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(270px,.8fr)]">
              <motion.section
                whileHover={{ rotateX: 0.7, rotateY: -0.35 }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                className={`relative min-h-[310px] overflow-hidden rounded-[30px] border border-white/10 p-5 shadow-[0_28px_80px_rgba(0,0,0,.35)] md:p-8 ${
                  visual?.kind === 'rain' ? 'bg-gradient-to-br from-[#12344c] via-[#10263a] to-[#111a2c]'
                    : visual?.kind === 'storm' ? 'bg-gradient-to-br from-[#28234d] via-[#17253e] to-[#101828]'
                      : visual?.kind === 'snow' ? 'bg-gradient-to-br from-[#315a70] via-[#20394f] to-[#121f34]'
                        : visual?.kind === 'clear' && !weather.current.isDay ? 'bg-gradient-to-br from-[#202d5c] via-[#182344] to-[#0c1429]'
                          : 'bg-gradient-to-br from-[#246b9a] via-[#164e75] to-[#10283e]'
                }`}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                <WeatherScene kind={visual?.kind ?? 'clear'} isDay={weather.current.isDay} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-black/20" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-sky-50/65">
                      <MapPin className="h-3.5 w-3.5" />
                      Current weather
                    </div>
                    <h2 className="mt-2 truncate text-2xl font-bold tracking-tight md:text-3xl">{locationLabel}</h2>
                    {locationDetail && <p className="mt-1 truncate text-xs text-white/55">{locationDetail}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/10 px-2.5 py-1.5 text-[9px] font-semibold text-white/65 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    LIVE
                  </div>
                </div>

                <div className="relative mt-8 flex flex-wrap items-center justify-between gap-5 md:mt-10">
                  <div>
                    <div className="flex items-start text-[84px] font-light leading-[.9] tracking-[-.09em] drop-shadow-lg md:text-[104px]">
                      {temperature(weather.current.temperature)}
                    </div>
                    <div className="mt-3 text-base font-semibold text-white/90">{visual?.condition ?? weather.current.condition}</div>
                    <div className="mt-1 text-[11px] text-white/55">
                      Feels like {temperature(weather.current.apparentTemperature)}
                    </div>
                  </div>
                  <motion.div
                    animate={{ y: [0, -8, 0], rotate: [0, 3, -2, 0], scale: [1, 1.04, 1] }}
                    transition={{ duration: visual?.kind === 'storm' ? 2 : 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex h-32 w-32 items-center justify-center rounded-[30px] border border-white/15 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,.2),0_20px_50px_rgba(0,0,0,.2)] backdrop-blur-xl md:h-40 md:w-40"
                    style={{ transform: 'translateZ(30px)' }}
                  >
                    <WeatherMark kind={visual?.kind ?? 'clear'} isDay={weather.current.isDay} size={82} />
                  </motion.div>
                </div>

                <div className="relative mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[10px] text-white/60">
                  <span>{weather.current.isDay ? 'Daytime' : 'Nighttime'} · {weather.timezone}</span>
                  <span>Updated {updatedAt}</span>
                </div>
              </motion.section>

              <section className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Humidity', value: `${weather.current.humidity}%`, icon: Droplets, tone: 'text-sky-200', sub: 'Relative humidity' },
                  { label: 'Wind', value: `${Math.round(weather.current.windSpeed)} km/h`, icon: Wind, tone: 'text-teal-200', sub: `${Math.round(weather.current.windDirection)}° direction` },
                  { label: 'Precipitation', value: `${weather.current.precipitation} mm`, icon: Umbrella, tone: 'text-blue-200', sub: `Chance ${weather.daily[0]?.precipitationProbability ?? 0}%` },
                  { label: 'Cloud cover', value: `${weather.current.cloudCover}%`, icon: CloudSun, tone: 'text-violet-200', sub: 'Sky coverage' },
                ].map(({ label, value, icon: Icon, tone, sub }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.045 }}
                    whileHover={{ y: -3, rotateX: 2 }}
                    className="flex min-h-[120px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-white/[0.02] p-4 shadow-[0_16px_40px_rgba(0,0,0,.18)]"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      {label}<Icon className={`h-4 w-4 ${tone}`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold tracking-tight">{value}</div>
                      <div className="mt-1 truncate text-[9px] text-slate-600">{sub}</div>
                    </div>
                  </motion.div>
                ))}
              </section>
            </div>

            <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold">Today, hour by hour</h3>
                  <p className="mt-1 text-[9px] text-slate-600">Local forecast for {locationLabel}</p>
                </div>
                <Thermometer className="h-4 w-4 text-sky-300" />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {hourlyForecast.map((hour, index) => {
                  const hourVisual = getWeatherVisual(hour.weatherCode, hour.isDay);
                  return (
                    <motion.div
                      key={hour.time}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                      className="rounded-xl border border-white/[0.05] bg-black/[0.12] px-2 py-3 text-center"
                    >
                      <div className="text-[9px] text-slate-500">{index === 0 ? 'Now' : formatHour(hour.time, weather.timezone, !settings.clock24h)}</div>
                      <div className="my-2 flex justify-center"><WeatherMark kind={hourVisual.kind} isDay={hour.isDay} size={18} /></div>
                      <div className="text-xs font-bold">{temperature(hour.temperature)}</div>
                      {hour.precipitationProbability > 0 && (
                        <div className="mt-1 flex items-center justify-center gap-0.5 text-[8px] text-sky-300">
                          <Droplets className="h-2.5 w-2.5" />{hour.precipitationProbability}%
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold">7-day forecast</h3>
                  <p className="mt-1 text-[9px] text-slate-600">The week ahead</p>
                </div>
                <Snowflake className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="space-y-1">
                {weather.daily.map((day, index) => {
                  const dayVisual = getWeatherVisual(day.weatherCode, true);
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.035 }}
                      className="grid grid-cols-[58px_30px_minmax(80px,1fr)_42px_42px] items-center gap-3 rounded-xl px-2 py-2.5 text-[10px] transition hover:bg-white/[0.035] sm:grid-cols-[70px_34px_minmax(100px,1fr)_48px_48px]"
                    >
                      <span className="font-semibold text-slate-300">{index === 0 ? 'Today' : formatDay(day.date)}</span>
                      <span className="flex justify-center"><WeatherMark kind={dayVisual.kind} isDay size={18} /></span>
                      <span className="truncate text-slate-500">{day.condition}</span>
                      <span className="text-right font-semibold">{temperature(day.max)}</span>
                      <span className="text-right text-slate-500">{temperature(day.min)}</span>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200"><Sunrise className="h-5 w-5" /></div>
                <div>
                  <div className="text-[9px] text-slate-500">Sunrise</div>
                  <div className="mt-1 text-xs font-bold">{weather.daily[0] ? formatClockTime(weather.daily[0].sunrise, weather.timezone) : '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-300/10 text-indigo-200"><Sunset className="h-5 w-5" /></div>
                <div>
                  <div className="text-[9px] text-slate-500">Sunset</div>
                  <div className="mt-1 text-xs font-bold">{weather.daily[0] ? formatClockTime(weather.daily[0].sunset, weather.timezone) : '—'}</div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 flex items-center justify-between border-t border-white/[0.06] px-5 py-2.5 text-[9px] text-slate-600 md:px-7">
        <span>{weather ? `Weather for ${locationLabel} · Open-Meteo` : 'Weather powered by Open-Meteo'}</span>
        <button type="button" onClick={useCurrentLocation} className="flex items-center gap-1.5 transition hover:text-slate-300">
          <LocateFixed className="h-3 w-3" /> Use current location
        </button>
      </footer>
    </div>
  );
};
