import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlarmClock,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Clock3,
  Globe2,
  MapPin,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import { useOS } from '../../context/OSContext';
import {
  searchLocations,
  type WeatherLocation,
} from '../../services/weatherService';
import { sound } from '../../services/soundService';
import { AppIcon } from '../system/AppIcon';

type ClockTab = 'world' | 'alarms' | 'stopwatch' | 'timer';

interface SavedClock {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  lastTriggeredDate?: string;
}

const CLOCKS_STORAGE_KEY = 'abhishek_os_world_clocks_v1';
const ALARMS_STORAGE_KEY = 'abhishek_os_alarms_v1';

const DEFAULT_CLOCKS: SavedClock[] = [
  { id: 'london', name: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, timezone: 'Europe/London' },
  { id: 'new-york', name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
];

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch (error) {
    console.warn(`Could not read Clock data from local storage (${key}).`, error);
    return fallback;
  }
};

const formatTime = (date: Date, timeZone?: string, hour12 = false) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  }).format(date);

const formatOffset = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    timeZoneName: 'short',
  }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value ?? timeZone;

const formatDuration = (milliseconds: number, showHundredths = false) => {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  const main = [hours, minutes, seconds]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
  return showHundredths ? `${main}.${String(centiseconds).padStart(2, '0')}` : main;
};

const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const dayNumberInZone = (date: Date, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(part => part.type === type)?.value);
  return Date.UTC(value('year'), value('month') - 1, value('day')) / 86400000;
};

const tabOptions: { id: ClockTab; label: string; icon: React.ElementType }[] = [
  { id: 'world', label: 'World clock', icon: Globe2 },
  { id: 'alarms', label: 'Alarms', icon: AlarmClock },
  { id: 'stopwatch', label: 'Stopwatch', icon: Timer },
  { id: 'timer', label: 'Timer', icon: Clock3 },
];

export const ClockApp: React.FC = () => {
  const { settings, addNotification } = useOS();
  const [now, setNow] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState<ClockTab>('world');
  const [clocks, setClocks] = useState<SavedClock[]>(() =>
    readStored(CLOCKS_STORAGE_KEY, DEFAULT_CLOCKS),
  );
  const [alarms, setAlarms] = useState<Alarm[]>(() =>
    readStored(ALARMS_STORAGE_KEY, []),
  );
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const stopwatchStartedAt = useRef<number | null>(null);
  const stopwatchBase = useRef(0);
  const [timerMinutes, setTimerMinutes] = useState('5');
  const [timerSeconds, setTimerSeconds] = useState('00');
  const [timerRemaining, setTimerRemaining] = useState(300000);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerDeadline = useRef<number | null>(null);
  const timerFired = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLOCKS_STORAGE_KEY, JSON.stringify(clocks));
    } catch (error) {
      console.warn('Could not save World Clock locations.', error);
    }
  }, [clocks]);

  useEffect(() => {
    try {
      localStorage.setItem(ALARMS_STORAGE_KEY, JSON.stringify(alarms));
    } catch (error) {
      console.warn('Could not save Clock alarms.', error);
    }
  }, [alarms]);

  useEffect(() => {
    if (!alarms.some(alarm => alarm.enabled)) return;
    const interval = window.setInterval(() => {
      const current = new Date();
      const time = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
      const dateKey = localDateKey(current);
      const due = alarms.filter(alarm =>
        alarm.enabled && alarm.time === time && alarm.lastTriggeredDate !== dateKey,
      );

      if (!due.length) return;
      const dueIds = new Set(due.map(alarm => alarm.id));
      setAlarms(previous => previous.map(alarm =>
        dueIds.has(alarm.id) ? { ...alarm, lastTriggeredDate: dateKey } : alarm,
      ));
      due.forEach(alarm => addNotification({
        appId: 'clock',
        appName: 'Clock',
        title: alarm.label || 'Alarm',
        message: `It's ${formatTime(current, undefined, !settings.clock24h)}.`,
        type: 'system',
      }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [alarms, addNotification, settings.clock24h]);

  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = window.setInterval(() => {
      if (stopwatchStartedAt.current !== null) {
        setStopwatchElapsed(stopwatchBase.current + Date.now() - stopwatchStartedAt.current);
      }
    }, 30);
    return () => window.clearInterval(interval);
  }, [stopwatchRunning]);

  useEffect(() => {
    if (!timerRunning || timerDeadline.current === null) return;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, timerDeadline.current! - Date.now());
      setTimerRemaining(remaining);
      if (remaining === 0 && !timerFired.current) {
        timerFired.current = true;
        setTimerRunning(false);
        addNotification({
          appId: 'clock',
          appName: 'Clock',
          title: 'Timer complete',
          message: 'Your countdown has finished.',
          type: 'system',
        });
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [timerRunning, addNotification]);

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(now),
    [now],
  );

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) {
      setLocations([]);
      setSearchError('Enter a city, state, or country to search.');
      return;
    }

    setSearching(true);
    setSearchError('');
    try {
      const results = await searchLocations(searchTerm);
      setLocations(results);
      if (!results.length) setSearchError('No matching places found. Try a nearby city or a more specific name.');
    } catch (error) {
      console.error('World Clock location search failed:', error);
      setSearchError('Could not search places right now. Check your connection and try again.');
      setLocations([]);
    } finally {
      setSearching(false);
    }
  };

  const addClock = (location: WeatherLocation) => {
    const timezone = location.timezone;
    if (!timezone) {
      setSearchError(`A time zone is unavailable for ${location.name}. Try another result.`);
      return;
    }
    setClocks(previous => {
      if (previous.some(clock => clock.timezone === timezone && clock.name === location.name)) {
        return previous;
      }
      return [{
        id: `${location.id ?? location.name}-${Date.now()}`,
        name: location.name,
        country: location.country,
        admin1: location.admin1,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone,
      }, ...previous];
    });
    setLocations([]);
    setQuery('');
    sound.playClick();
  };

  const addAlarm = (event: React.FormEvent) => {
    event.preventDefault();
    setAlarms(previous => [{
      id: `alarm-${Date.now()}`,
      time: alarmTime,
      label: alarmLabel.trim() || 'Alarm',
      enabled: true,
    }, ...previous]);
    setAlarmLabel('');
    sound.playClick();
  };

  const startStopwatch = () => {
    stopwatchStartedAt.current = Date.now();
    stopwatchBase.current = stopwatchElapsed;
    setStopwatchRunning(true);
    sound.playClick();
  };

  const pauseStopwatch = () => {
    let elapsed = stopwatchElapsed;
    if (stopwatchStartedAt.current !== null) {
      elapsed = stopwatchBase.current + Date.now() - stopwatchStartedAt.current;
    }
    stopwatchBase.current = elapsed;
    stopwatchStartedAt.current = null;
    setStopwatchElapsed(elapsed);
    setStopwatchRunning(false);
    sound.playClick();
  };

  const resetStopwatch = () => {
    stopwatchStartedAt.current = null;
    stopwatchBase.current = 0;
    setStopwatchRunning(false);
    setStopwatchElapsed(0);
    setLaps([]);
    sound.playClick();
  };

  const startTimer = () => {
    const duration = Math.max(1, Number(timerMinutes || 0) * 60 + Number(timerSeconds || 0)) * 1000;
    const remaining = timerRemaining > 0 && timerRemaining < duration && !timerFired.current
      ? timerRemaining
      : duration;
    timerDeadline.current = Date.now() + remaining;
    timerFired.current = false;
    setTimerRemaining(remaining);
    setTimerRunning(true);
    sound.playClick();
  };

  const pauseTimer = () => {
    if (timerDeadline.current !== null) {
      const remaining = Math.max(0, timerDeadline.current - Date.now());
      setTimerRemaining(remaining);
      timerDeadline.current = null;
    }
    setTimerRunning(false);
    sound.playClick();
  };

  const resetTimer = () => {
    timerDeadline.current = null;
    timerFired.current = false;
    setTimerRunning(false);
    setTimerRemaining(0);
    sound.playClick();
  };

  const timerInputSeconds = Math.max(
    1,
    (Number(timerMinutes) || 0) * 60 + (Number(timerSeconds) || 0),
  );
  const timerProgress = Math.max(0, Math.min(1, timerRemaining / (timerInputSeconds * 1000)));
  const localHours = now.getHours() % 12 + now.getMinutes() / 60;
  const localMinutes = now.getMinutes() + now.getSeconds() / 60;
  const localSeconds = now.getSeconds();

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#080b13] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 25, -10, 0], y: [0, -18, 12, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -left-28 -top-32 h-96 w-96 rounded-full bg-violet-600/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -16, 20, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 right-[-100px] h-[440px] w-[440px] rounded-full bg-sky-500/[0.08] blur-[110px]"
        />
      </div>

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotateY: 12, rotateX: -8, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="h-12 w-12 overflow-hidden rounded-[15px] shadow-[0_12px_30px_rgba(124,58,237,.35)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <AppIcon appId="clock" className="h-full w-full object-cover" />
          </motion.div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Clock</h1>
            <p className="text-[11px] text-slate-500">Time, wherever life takes you</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Local time</div>
          <div className="mt-0.5 text-xs font-bold tabular-nums text-slate-200">
            {formatTime(now, undefined, !settings.clock24h)}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
        <nav className="flex gap-1 overflow-x-auto border-b border-white/[0.07] p-2 md:w-52 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:p-4">
          {tabOptions.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActiveTab(id);
                sound.playClick();
              }}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors md:w-full ${
                activeTab === id
                  ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/20'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {id === 'alarms' && alarms.filter(alarm => alarm.enabled).length > 0 && (
                <span className="ml-auto hidden rounded-full bg-violet-400/15 px-2 py-0.5 text-[9px] text-violet-200 md:inline">
                  {alarms.filter(alarm => alarm.enabled).length}
                </span>
              )}
            </motion.button>
          ))}
          <div className="mt-auto hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 md:block">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
              <Bell className="h-3.5 w-3.5 text-violet-300" />
              Local alarms
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
              Alarm reminders run while ARLO OS is open.
            </p>
          </div>
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-7">
          <AnimatePresence mode="wait">
            {activeTab === 'world' && (
              <motion.section
                key="world"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-5xl space-y-6"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <motion.div
                    whileHover={{ rotateX: 1, rotateY: -0.5 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#1a1930] via-[#131a2a] to-[#0d1623] p-6 shadow-[0_26px_70px_rgba(0,0,0,.34)] md:p-8"
                    style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
                  >
                    <div className="pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
                    <div className="relative flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-violet-200/70">
                          <MapPin className="h-3.5 w-3.5" />
                          Your device
                        </div>
                        <div className="mt-4 text-5xl font-black tracking-[-.06em] tabular-nums md:text-6xl">
                          {formatTime(now, undefined, !settings.clock24h)}
                        </div>
                        <div className="mt-2 text-sm text-slate-400">{dateLabel}</div>
                      </div>
                      <div
                        className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border border-white/40 bg-gradient-to-br from-white via-slate-100 to-slate-300 shadow-[inset_0_3px_8px_rgba(255,255,255,.95),inset_0_-12px_24px_rgba(148,163,184,.2),0_20px_40px_rgba(0,0,0,.36)] md:h-44 md:w-44"
                        style={{ transform: 'translateZ(24px)' }}
                        aria-label={`Analog clock showing ${formatTime(now, undefined, !settings.clock24h)}`}
                      >
                        {Array.from({ length: 12 }).map((_, index) => (
                          <span
                            key={index}
                            className="absolute left-1/2 top-1/2 h-1.5 w-1 rounded-full bg-slate-400"
                            style={{
                              transform: `rotate(${index * 30}deg) translateY(-${index < 3 || index > 8 ? 59 : 57}px)`,
                              transformOrigin: 'center',
                            }}
                          />
                        ))}
                        <span
                          className="absolute bottom-1/2 left-1/2 h-[28%] w-1.5 origin-bottom rounded-full bg-slate-950 shadow-[0_2px_4px_rgba(0,0,0,.25)]"
                          style={{ transform: `translateX(-50%) rotate(${localHours * 30}deg)` }}
                        />
                        <span
                          className="absolute bottom-1/2 left-1/2 h-[38%] w-1 origin-bottom rounded-full bg-violet-600 shadow-[0_2px_4px_rgba(109,40,217,.25)]"
                          style={{ transform: `translateX(-50%) rotate(${localMinutes * 6}deg)` }}
                        />
                        <span
                          className="absolute bottom-1/2 left-1/2 h-[42%] w-px origin-bottom bg-rose-500"
                          style={{ transform: `translateX(-50%) rotate(${localSeconds * 6}deg)` }}
                        />
                        <span className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-950 shadow" />
                      </div>
                    </div>
                    <div className="relative mt-5 flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Synced with your device clock
                    </div>
                  </motion.div>

                  <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Globe2 className="h-4 w-4 text-violet-300" />
                      Find a place
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                      Search by city, state, or country to add its local time.
                    </p>
                    <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                      <label className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                        <input
                          value={query}
                          onChange={event => setQuery(event.target.value)}
                          placeholder="e.g. Mumbai, India"
                          className="h-10 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 text-[11px] outline-none placeholder:text-slate-600 focus:border-violet-400/40"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={searching}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:opacity-50"
                        aria-label="Search places"
                      >
                        {searching ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Search className="h-4 w-4" />}
                      </button>
                    </form>
                    {searchError && <p role="status" className="mt-2 text-[10px] text-rose-300">{searchError}</p>}
                    <AnimatePresence>
                      {locations.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-3 max-h-48 space-y-1 overflow-y-auto"
                        >
                          {locations.map((location, index) => (
                            <button
                              key={`${location.id ?? location.name}-${index}`}
                              type="button"
                              onClick={() => addClock(location)}
                              className="flex w-full items-center justify-between gap-2 rounded-xl border border-transparent px-2.5 py-2 text-left hover:border-violet-400/20 hover:bg-violet-400/[0.07]"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[11px] font-semibold">{location.name}</span>
                                <span className="mt-0.5 block truncate text-[9px] text-slate-500">
                                  {[location.admin1, location.country].filter(Boolean).join(', ')}
                                </span>
                              </span>
                              <Plus className="h-4 w-4 shrink-0 text-violet-300" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/10 p-3 text-[9px] leading-relaxed text-slate-600">
                      Time zone data follows the location's regional clock rules, including daylight-saving changes.
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold">Around the world</h2>
                      <p className="mt-1 text-[10px] text-slate-500">Live local time in your saved places</p>
                    </div>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[9px] text-slate-500">{clocks.length} places</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {clocks.map((clock, index) => {
                        const dayDifference = dayNumberInZone(now, clock.timezone) - dayNumberInZone(now);
                        return (
                          <motion.article
                            layout
                            key={clock.id}
                            initial={{ opacity: 0, scale: 0.96, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ delay: Math.min(index * 0.035, 0.2), duration: 0.22 }}
                            className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-4 shadow-[0_14px_35px_rgba(0,0,0,.18)] transition-colors hover:border-violet-300/20"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-xs font-bold">{clock.name}</div>
                                <div className="mt-1 truncate text-[9px] text-slate-500">{[clock.admin1, clock.country].filter(Boolean).join(', ')}</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setClocks(previous => previous.filter(item => item.id !== clock.id));
                                  sound.playClick();
                                }}
                                aria-label={`Remove ${clock.name}`}
                                className="rounded-lg p-1.5 text-slate-600 opacity-100 transition hover:bg-rose-400/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="mt-4 flex items-end justify-between gap-2">
                              <div className="text-2xl font-bold tracking-tight tabular-nums">
                                {formatTime(now, clock.timezone, !settings.clock24h)}
                              </div>
                              {dayDifference !== 0 && (
                                <div className={`mb-1 flex items-center gap-1 text-[9px] ${dayDifference > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                                  {dayDifference > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                  {dayDifference > 0 ? 'Next day' : 'Previous day'}
                                </div>
                              )}
                            </div>
                            <div className="mt-2 border-t border-white/[0.06] pt-2 text-[9px] text-slate-600">
                              {formatOffset(now, clock.timezone)} · {clock.timezone}
                            </div>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === 'alarms' && (
              <motion.section
                key="alarms"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-3xl space-y-5"
              >
                <div>
                  <h2 className="text-xl font-black">Alarms</h2>
                  <p className="mt-1 text-xs text-slate-500">Set reminders using your device's local time.</p>
                </div>
                <form onSubmit={addAlarm} className="grid gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:grid-cols-[150px_1fr_auto] sm:items-end">
                  <label className="text-[10px] font-semibold text-slate-400">
                    Time
                    <input
                      type="time"
                      required
                      value={alarmTime}
                      onChange={event => setAlarmTime(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white [color-scheme:dark]"
                    />
                  </label>
                  <label className="text-[10px] font-semibold text-slate-400">
                    Label
                    <input
                      value={alarmLabel}
                      onChange={event => setAlarmLabel(event.target.value)}
                      placeholder="Wake up, meeting, take a break..."
                      maxLength={48}
                      className="mt-1.5 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-violet-400/40"
                    />
                  </label>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-xs font-bold hover:bg-violet-400"
                  >
                    <Plus className="h-4 w-4" /> Add alarm
                  </motion.button>
                </form>
                <div className="space-y-2">
                  {alarms.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center">
                      <AlarmClock className="mx-auto h-7 w-7 text-slate-600" />
                      <p className="mt-3 text-sm font-semibold">No alarms yet</p>
                      <p className="mt-1 text-[10px] text-slate-500">Add an alarm above to get a reminder while ARLO OS is running.</p>
                    </div>
                  ) : alarms.map(alarm => (
                    <motion.article layout key={alarm.id} className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className={`text-3xl font-light tracking-tight tabular-nums ${alarm.enabled ? 'text-white' : 'text-slate-600'}`}>
                        {new Intl.DateTimeFormat(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: !settings.clock24h,
                        }).format(new Date(`2000-01-01T${alarm.time}:00`))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-xs font-semibold ${alarm.enabled ? 'text-slate-200' : 'text-slate-500'}`}>{alarm.label}</div>
                        <div className="mt-1 text-[9px] text-slate-600">Repeats daily · device local time</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAlarms(previous => previous.map(item =>
                            item.id === alarm.id ? { ...item, enabled: !item.enabled } : item,
                          ));
                          sound.playClick();
                        }}
                        aria-label={`${alarm.enabled ? 'Disable' : 'Enable'} ${alarm.label}`}
                        aria-pressed={alarm.enabled}
                        className={`flex h-8 w-14 items-center rounded-full border p-1 transition-colors ${alarm.enabled ? 'border-violet-400/30 bg-violet-500/30' : 'border-white/10 bg-white/5'}`}
                      >
                        <motion.span
                          layout
                          className={`h-5 w-5 rounded-full shadow ${alarm.enabled ? 'ml-auto bg-violet-200' : 'bg-slate-500'}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAlarms(previous => previous.filter(item => item.id !== alarm.id))}
                        aria-label={`Delete ${alarm.label}`}
                        className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.article>
                  ))}
                </div>
                <div className="flex gap-2 rounded-xl border border-amber-400/10 bg-amber-400/[0.035] p-3 text-[10px] leading-relaxed text-amber-100/55">
                  <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/70" />
                  Alarms trigger while the app is open. Keep ARLO OS running to receive reminders.
                </div>
              </motion.section>
            )}

            {activeTab === 'stopwatch' && (
              <motion.section
                key="stopwatch"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-3xl space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black">Stopwatch</h2>
                  <p className="mt-1 text-xs text-slate-500">Measure elapsed time and record laps.</p>
                </div>
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#21192e] via-[#151827] to-[#0d1421] p-7 text-center shadow-[0_24px_65px_rgba(0,0,0,.3)] md:p-10">
                  <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
                  <div className="relative text-5xl font-light tracking-[-.055em] tabular-nums md:text-7xl">
                    {formatDuration(stopwatchElapsed, true)}
                  </div>
                  <div className="relative mt-3 text-[10px] uppercase tracking-[.22em] text-slate-500">
                    {stopwatchRunning ? 'Timing in progress' : stopwatchElapsed ? 'Paused' : 'Ready'}
                  </div>
                  <div className="relative mt-8 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={stopwatchRunning ? pauseStopwatch : startStopwatch}
                      className={`flex h-12 min-w-32 items-center justify-center gap-2 rounded-2xl px-5 text-xs font-bold shadow-lg transition ${
                        stopwatchRunning ? 'bg-amber-400/15 text-amber-200 hover:bg-amber-400/20' : 'bg-violet-500 text-white shadow-violet-900/30 hover:bg-violet-400'
                      }`}
                    >
                      {stopwatchRunning ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4 fill-current" /> Start</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (stopwatchRunning) {
                          setLaps(previous => [
                            stopwatchElapsed - previous.reduce((total, lap) => total + lap, 0),
                            ...previous,
                          ]);
                        }
                        else resetStopwatch();
                      }}
                      className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-xs font-semibold text-slate-300 hover:bg-white/[0.09]"
                    >
                      {stopwatchRunning ? <><Plus className="h-4 w-4" /> Lap</> : <><RotateCcw className="h-4 w-4" /> Reset</>}
                    </button>
                  </div>
                </div>
                {laps.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Laps</div>
                    {laps.map((lap, index) => (
                      <div key={`${lap}-${index}`} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-xs">
                        <span className="text-slate-400">Lap {laps.length - index}</span>
                        <span className="font-mono tabular-nums text-slate-200">{formatDuration(lap, true)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {activeTab === 'timer' && (
              <motion.section
                key="timer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto max-w-3xl space-y-6"
              >
                <div>
                  <h2 className="text-xl font-black">Timer</h2>
                  <p className="mt-1 text-xs text-slate-500">Set a countdown for a focus session, recipe, or break.</p>
                </div>
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#182339] via-[#111827] to-[#0c1420] p-7 shadow-[0_24px_65px_rgba(0,0,0,.3)] md:p-10">
                  <div className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-sky-500/[0.09] blur-3xl" />
                  <div className="relative flex flex-col items-center">
                    <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-white/10 bg-black/20 shadow-[inset_0_10px_30px_rgba(0,0,0,.25),0_25px_50px_rgba(0,0,0,.24)]">
                      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
                        <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="5" />
                        <motion.circle
                          cx="100"
                          cy="100"
                          r="88"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 88}
                          animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - timerProgress) }}
                          transition={{ duration: 0.3 }}
                        />
                      </svg>
                      <div className="relative text-center">
                        <div className="text-4xl font-light tracking-tight tabular-nums">
                          {formatDuration(timerRemaining)}
                        </div>
                        <div className="mt-2 text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">
                          {timerRunning ? 'Time remaining' : timerRemaining > 0 ? 'Paused' : 'Ready'}
                        </div>
                      </div>
                    </div>

                    {!timerRunning && (
                      <div className="mt-6 flex items-center gap-3">
                        <label className="text-center text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                          Minutes
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={timerMinutes}
                            onChange={event => {
                              const value = event.target.value;
                              setTimerMinutes(value);
                              if (!timerRunning) {
                                timerFired.current = false;
                                setTimerRemaining(Math.max(
                                  1,
                                  (Number(value) || 0) * 60 + (Number(timerSeconds) || 0),
                                ) * 1000);
                              }
                            }}
                            className="mt-1 block h-10 w-20 rounded-xl border border-white/10 bg-black/20 text-center text-sm font-bold text-white outline-none focus:border-violet-400/40"
                          />
                        </label>
                        <span className="mt-4 text-xl text-slate-600">:</span>
                        <label className="text-center text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                          Seconds
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={timerSeconds}
                            onChange={event => {
                              const value = String(
                                Math.min(59, Math.max(0, Number(event.target.value) || 0)),
                              ).padStart(2, '0');
                              setTimerSeconds(value);
                              if (!timerRunning) {
                                timerFired.current = false;
                                setTimerRemaining(Math.max(
                                  1,
                                  (Number(timerMinutes) || 0) * 60 + Number(value),
                                ) * 1000);
                              }
                            }}
                            className="mt-1 block h-10 w-20 rounded-xl border border-white/10 bg-black/20 text-center text-sm font-bold text-white outline-none focus:border-violet-400/40"
                          />
                        </label>
                      </div>
                    )}

                    <div className="mt-7 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={timerRunning ? pauseTimer : startTimer}
                        className={`flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold transition ${
                          timerRunning ? 'bg-amber-400/15 text-amber-200 hover:bg-amber-400/20' : 'bg-violet-500 text-white hover:bg-violet-400'
                        }`}
                      >
                        {timerRunning ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4 fill-current" /> {timerRemaining > 0 ? 'Resume' : 'Start timer'}</>}
                      </button>
                      <button
                        type="button"
                        onClick={resetTimer}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-xs font-semibold text-slate-300 hover:bg-white/[0.09]"
                      >
                        <RotateCcw className="h-4 w-4" /> Reset
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
