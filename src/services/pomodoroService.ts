export const POMODORO_STORAGE_KEY = 'arlo_dynamic_workspace_pomodoro_v1';
export const POMODORO_UPDATED_EVENT = 'arlo:pomodoro-updated';
export const OPEN_POMODORO_EVENT = 'arlo:open-pomodoro';

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroStatus {
  phase: PomodoroPhase;
  endAt: number | null;
}

export const readPomodoroStatus = (): PomodoroStatus | null => {
  try {
    const stored = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!stored) return null;
    const value: unknown = JSON.parse(stored);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const phase = 'phase' in value ? value.phase : null;
    const endAt = 'endAt' in value ? value.endAt : undefined;
    if ((phase !== 'work' && phase !== 'shortBreak' && phase !== 'longBreak')
      || (endAt !== null && (typeof endAt !== 'number' || !Number.isFinite(endAt)))) return null;
    return { phase, endAt };
  } catch (error) {
    console.warn('[Pomodoro] Could not read the menu bar status:', error);
    return null;
  }
};

export const savePomodoroState = (state: object) => {
  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(POMODORO_UPDATED_EVENT));
  } catch (error) {
    console.error('[Pomodoro] Could not save timer state:', error);
  }
};
