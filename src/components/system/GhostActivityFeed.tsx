import { useEffect, useState } from 'react';
import { Check, CircleAlert, LoaderCircle } from 'lucide-react';
import {
  getGhostActivityTasks,
  subscribeGhostActivity,
  type GhostActivityTask,
} from '../../services/ghostOrchestrator';

const statusLabel: Record<GhostActivityTask['status'], string> = {
  planning: 'Planning',
  running: 'In progress',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Stopped',
};

export const GhostActivityFeed = () => {
  const [tasks, setTasks] = useState(getGhostActivityTasks);

  useEffect(() => {
    const refresh = () => setTasks(getGhostActivityTasks());
    return subscribeGhostActivity(refresh);
  }, []);

  const task = tasks[0];
  if (!task) return null;
  const active = task.status === 'planning' || task.status === 'running';

  return (
    <details className="mx-4 mb-2 rounded-xl border border-white/[0.07] bg-white/[0.025] text-[9px] text-slate-300">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2">
        {active
          ? <LoaderCircle className="h-3 w-3 shrink-0 animate-spin text-sky-200" />
          : task.status === 'completed'
            ? <Check className="h-3 w-3 shrink-0 text-emerald-200" />
            : <CircleAlert className="h-3 w-3 shrink-0 text-amber-200" />}
        <span className="min-w-0 flex-1 truncate">{task.detectiveName} · {statusLabel[task.status]} · {task.request}</span>
        <span className="text-[8px] text-slate-500">Activity</span>
      </summary>
      <ol className="space-y-1 border-t border-white/[0.06] px-3 py-2">
        {task.events.map(event => (
          <li key={event.id} className="flex items-start gap-2 leading-relaxed">
            <time className="mt-px shrink-0 text-[8px] tabular-nums text-slate-600">
              {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </time>
            <span className="min-w-0">{event.summary}</span>
          </li>
        ))}
      </ol>
    </details>
  );
};
