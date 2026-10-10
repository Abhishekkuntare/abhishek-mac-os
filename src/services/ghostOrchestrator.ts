import { DETECTIVES } from '../components/system/detectiveModel';

export type GhostActivityStatus = 'planning' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface GhostActivityEvent {
  id: string;
  status: GhostActivityStatus;
  summary: string;
  createdAt: number;
}

export interface GhostActivityTask {
  id: string;
  request: string;
  detectiveName: string;
  detectiveRole: string;
  status: GhostActivityStatus;
  createdAt: number;
  events: GhostActivityEvent[];
}

export const GHOST_ACTIVITY_UPDATED_EVENT = 'arlo:ghost-activity-updated';
const MAX_TASKS = 12;
const tasks = new Map<string, GhostActivityTask>();

export const routeGhostRequest = <T extends {
  id?: string;
  name: string;
  role: string;
  personality: string;
  description: string;
  skills: readonly string[];
  instructions?: string;
  permittedTools: readonly string[];
}>(
  request: string,
  currentDetective: T,
): T => {
  const text = request.toLocaleLowerCase();
  const selectedRole = /(?:\b(?:debug|debugging|code review|coding|programming|compile|stack trace|code)\b)|\b(?:typescript|javascript|python)\b.*\b(?:error|issue|bug|script|function|program)\b/i.test(text)
    ? 'Coding assistant'
    : /(?:\b(?:find|search|locate|look for)\b.*\b(?:file|document|folder|pdf)\b|\b(?:file|document|folder|pdf)\b.*\b(?:find|search|locate)\b)/i.test(text)
      ? 'File investigator'
      : /(?:\b(?:design|creative|brainstorm|story|artwork|write a poem)\b)/i.test(text)
        ? 'Creative assistant'
        : /(?:\b(?:workflow|automate|then|after that|and then|multiple apps|arrange my workspace)\b)/i.test(text)
          ? 'Workflow automation'
          : null;
  if (!selectedRole) return currentDetective;
  const specialist = DETECTIVES.find(detective => detective.role === selectedRole);
  if (!specialist || (specialist.name === currentDetective.name && specialist.role === currentDetective.role)) {
    return currentDetective;
  }
  return {
    ...currentDetective,
    ...specialist,
    id: specialist.id,
    color: specialist.color,
    instructions: currentDetective.instructions ?? '',
    permittedTools: [...specialist.permittedTools],
  } as T;
};

export const startGhostActivity = (
  id: string,
  request: string,
  detectiveName: string,
  detectiveRole: string,
): GhostActivityTask => {
  const task: GhostActivityTask = {
    id,
    request: request.trim().slice(0, 140),
    detectiveName,
    detectiveRole,
    status: 'planning',
    createdAt: Date.now(),
    events: [],
  };
  tasks.delete(id);
  tasks.set(id, task);
  appendGhostActivity(id, 'planning', `Assigned ${detectiveName} · ${detectiveRole}.`);
  appendGhostActivity(id, 'planning', 'Plan: understand the request, use only permitted ARLO capabilities, verify the result.');
  while (tasks.size > MAX_TASKS) tasks.delete(tasks.keys().next().value!);
  return task;
};

export const appendGhostActivity = (
  id: string,
  status: GhostActivityStatus,
  summary: string,
) => {
  const task = tasks.get(id);
  if (!task) return;
  task.status = status;
  task.events.push({
    id: `${id}-${task.events.length + 1}`,
    status,
    summary: summary.slice(0, 300),
    createdAt: Date.now(),
  });
  task.events = task.events.slice(-16);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(GHOST_ACTIVITY_UPDATED_EVENT));
  }
};

export const getGhostActivityTasks = (): GhostActivityTask[] =>
  [...tasks.values()].reverse();

export const subscribeGhostActivity = (listener: () => void) => {
  if (
    typeof window === 'undefined' ||
    typeof window.addEventListener !== 'function' ||
    typeof window.removeEventListener !== 'function'
  ) return () => undefined;
  window.addEventListener(GHOST_ACTIVITY_UPDATED_EVENT, listener);
  return () => window.removeEventListener(GHOST_ACTIVITY_UPDATED_EVENT, listener);
};
