export const HEALTH_STORAGE_KEY = 'arlo_health_local_v1';

export interface HealthDay {
  breakCount: number;
  waterGlasses: number;
  mindfulMinutes: number;
  lastBreakAt: number | null;
  lastEyeBreakAt: number | null;
}

export type HealthHistory = Record<string, HealthDay>;

export const getHealthDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const emptyHealthDay = (): HealthDay => ({
  breakCount: 0,
  waterGlasses: 0,
  mindfulMinutes: 0,
  lastBreakAt: null,
  lastEyeBreakAt: null,
});

const isHealthDay = (value: unknown): value is HealthDay => {
  if (typeof value !== 'object' || value === null) return false;
  const day = value as Partial<HealthDay>;
  return Number.isFinite(day.breakCount)
    && Number.isFinite(day.waterGlasses)
    && Number.isFinite(day.mindfulMinutes)
    && (day.lastBreakAt === null || Number.isFinite(day.lastBreakAt))
    && (day.lastEyeBreakAt === null || Number.isFinite(day.lastEyeBreakAt));
};

export const readHealthHistory = (): HealthHistory => {
  try {
    const stored = localStorage.getItem(HEALTH_STORAGE_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Saved Health history is invalid.');
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([date, day]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) && isHealthDay(day),
      ),
    ) as HealthHistory;
  } catch (error) {
    console.warn('[Health] Could not restore local wellness history:', error);
    return {};
  }
};

export const getHealthDay = (history: HealthHistory, date = new Date()) =>
  history[getHealthDateKey(date)] ?? emptyHealthDay();

export const saveHealthHistory = (history: HealthHistory) => {
  try {
    const recentHistory = Object.fromEntries(
      Object.entries(history)
        .sort(([left], [right]) => right.localeCompare(left))
        .slice(0, 366),
    );
    localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(recentHistory));
  } catch (error) {
    console.error('[Health] Could not save local wellness history:', error);
  }
};

export const calculateHealthStreak = (history: HealthHistory, today = new Date()) => {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayData = history[getHealthDateKey(cursor)];
  if (!todayData || (todayData.breakCount === 0 && todayData.waterGlasses === 0 && todayData.mindfulMinutes === 0)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (streak < 366) {
    const day = history[getHealthDateKey(cursor)];
    if (!day || (day.breakCount === 0 && day.waterGlasses === 0 && day.mindfulMinutes === 0)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};
