import { useSyncExternalStore } from 'react';

export interface StopwatchSnapshot {
  elapsedMs: number;
  startedAt: number | null;
  laps: number[];
}

const STORAGE_KEY = 'arlo_os_stopwatch_v1';
const TICK_MS = 30;

const readSnapshot = (): StopwatchSnapshot => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { elapsedMs: 0, startedAt: null, laps: [] };

    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Saved stopwatch data is not an object.');
    }

    const value = parsed as Record<string, unknown>;
    const elapsedMs = typeof value.elapsedMs === 'number' && Number.isFinite(value.elapsedMs)
      ? Math.max(0, value.elapsedMs)
      : 0;
    const startedAt = typeof value.startedAt === 'number' && Number.isFinite(value.startedAt)
      ? value.startedAt
      : null;
    const laps = Array.isArray(value.laps)
      ? value.laps.filter((lap): lap is number => typeof lap === 'number' && Number.isFinite(lap) && lap >= 0)
      : [];

    return {
      elapsedMs: startedAt === null ? elapsedMs : Math.max(elapsedMs, Date.now() - startedAt),
      startedAt,
      laps,
    };
  } catch (error) {
    console.warn('Could not restore stopwatch state.', error);
    return { elapsedMs: 0, startedAt: null, laps: [] };
  }
};

let snapshot = readSnapshot();
const listeners = new Set<() => void>();
let tickInterval: number | null = null;

const persistSnapshot = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Could not save stopwatch state.', error);
  }
};

const publishSnapshot = (persist = false) => {
  if (persist) persistSnapshot();
  listeners.forEach(listener => listener());
};

const stopTicking = () => {
  if (tickInterval === null) return;
  window.clearInterval(tickInterval);
  tickInterval = null;
};

const startTicking = () => {
  if (tickInterval !== null) return;
  tickInterval = window.setInterval(() => {
    if (snapshot.startedAt === null) return;
    snapshot = {
      ...snapshot,
      elapsedMs: Math.max(0, Date.now() - snapshot.startedAt),
    };
    publishSnapshot();
  }, TICK_MS);
};

if (snapshot.startedAt !== null) startTicking();

export const subscribeToStopwatch = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getStopwatchSnapshot = () => snapshot;

export const useStopwatch = () => useSyncExternalStore(
  subscribeToStopwatch,
  getStopwatchSnapshot,
  getStopwatchSnapshot,
);

export const startStopwatch = () => {
  if (snapshot.startedAt !== null) return;
  snapshot = {
    ...snapshot,
    startedAt: Date.now() - snapshot.elapsedMs,
  };
  persistSnapshot();
  startTicking();
  publishSnapshot();
};

export const pauseStopwatch = () => {
  if (snapshot.startedAt === null) return;
  snapshot = {
    ...snapshot,
    elapsedMs: Math.max(0, Date.now() - snapshot.startedAt),
    startedAt: null,
  };
  stopTicking();
  publishSnapshot(true);
};

export const resetStopwatch = () => {
  snapshot = { elapsedMs: 0, startedAt: null, laps: [] };
  stopTicking();
  publishSnapshot(true);
};

export const recordStopwatchLap = () => {
  if (snapshot.startedAt === null) return;
  const elapsedMs = Math.max(0, Date.now() - snapshot.startedAt);
  const completedLaps = snapshot.laps.reduce((total, lap) => total + lap, 0);
  snapshot = {
    ...snapshot,
    elapsedMs,
    laps: [elapsedMs - completedLaps, ...snapshot.laps],
  };
  publishSnapshot(true);
};