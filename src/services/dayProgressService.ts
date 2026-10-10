export const DAY_PROGRESS_CALENDAR_KEY = 'arlo_day_progress_calendar_v1';
export const DAY_PROGRESS_REMINDERS_KEY = 'arlo_day_progress_reminders_v1';
export const DAY_PROGRESS_TASKS_KEY = 'arlo_dynamic_workspace_tasks_v1';
export const DAY_PROGRESS_UPDATED_EVENT = 'arlo:day-progress-updated';

export interface DayProgressCalendarEvent {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
  startTime: string;
  endTime: string;
  allDay?: boolean;
}

export interface DayProgressReminder {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface DayProgressTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

const readArray = <T>(
  key: string,
  isRecord: (value: unknown) => value is T,
): T[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter(isRecord) : [];
  } catch (error) {
    console.warn(`[Day Progress] Could not read ${key}:`, error);
    return [];
  }
};

export const readDayProgressCalendar = (): DayProgressCalendarEvent[] =>
  readArray(DAY_PROGRESS_CALENDAR_KEY, (value): value is DayProgressCalendarEvent =>
    typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'title' in value && typeof value.title === 'string' &&
    'day' in value && typeof value.day === 'number' &&
    'month' in value && typeof value.month === 'number' &&
    'year' in value && typeof value.year === 'number' &&
    !/^\d+$/.test(value.id) &&
    'startTime' in value && typeof value.startTime === 'string' &&
    'endTime' in value && typeof value.endTime === 'string');

export const readDayProgressReminders = (): DayProgressReminder[] =>
  readArray(DAY_PROGRESS_REMINDERS_KEY, (value): value is DayProgressReminder =>
    typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    value.id.startsWith('rem-') &&
    'title' in value && typeof value.title === 'string' &&
    'dueDate' in value && typeof value.dueDate === 'string' &&
    'completed' in value && typeof value.completed === 'boolean');

export const readDayProgressTasks = (): DayProgressTask[] =>
  readArray(DAY_PROGRESS_TASKS_KEY, (value): value is DayProgressTask =>
    typeof value === 'object' && value !== null &&
    'id' in value && typeof value.id === 'string' &&
    'title' in value && typeof value.title === 'string' &&
    'completed' in value && typeof value.completed === 'boolean' &&
    'createdAt' in value && typeof value.createdAt === 'number');

export const notifyDayProgressUpdated = (): void => {
  window.dispatchEvent(new Event(DAY_PROGRESS_UPDATED_EVENT));
};

export const getLocalDayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
