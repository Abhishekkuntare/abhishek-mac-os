import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Circle, Clock3, ListTodo, Moon, Bell } from 'lucide-react';
import type { SystemSettings } from '../../types/desktop';
import {
  DAY_PROGRESS_UPDATED_EVENT,
  getLocalDayKey,
  readDayProgressCalendar,
  readDayProgressReminders,
  type DayProgressCalendarEvent,
  type DayProgressReminder,
} from '../../services/dayProgressService';

interface DashboardTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

interface DayProgressPanelProps {
  now: Date;
  settings: SystemSettings['dayProgress'];
  tasks: DashboardTask[];
  onToggleTask: (taskId: string) => void;
}

type TimelineItem = {
  id: string;
  title: string;
  source: 'calendar' | 'reminder' | 'task';
  time: number | null;
  label: string;
  completed: boolean;
};

const isTodayReminder = (reminder: DayProgressReminder, now: Date): boolean => {
  const due = reminder.dueDate.trim().toLowerCase();
  if (due === 'today') return true;
  const parsed = new Date(reminder.dueDate);
  return !Number.isNaN(parsed.getTime()) && getLocalDayKey(parsed) === getLocalDayKey(now);
};

const getCalendarTime = (event: DayProgressCalendarEvent, now: Date): number | null => {
  if (event.allDay) return null;
  const [hours, minutes] = event.startTime.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime();
};

const formatTime = (timestamp: number, locale?: string): string =>
  new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(timestamp);

export const DayProgressPanel: React.FC<DayProgressPanelProps> = ({
  now,
  settings,
  tasks,
  onToggleTask,
}) => {
  const [calendarEvents, setCalendarEvents] = useState(readDayProgressCalendar);
  const [reminders, setReminders] = useState(readDayProgressReminders);

  useEffect(() => {
    const refresh = () => {
      setCalendarEvents(readDayProgressCalendar());
      setReminders(readDayProgressReminders());
    };
    window.addEventListener(DAY_PROGRESS_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DAY_PROGRESS_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const items = useMemo(() => {
    const dateKey = getLocalDayKey(now);
    const result: TimelineItem[] = [];
    if (settings.sources.calendar) {
      for (const event of calendarEvents) {
        if (event.year !== now.getFullYear() || event.month !== now.getMonth() || event.day !== now.getDate()) continue;
        const time = getCalendarTime(event, now);
        result.push({
          id: `calendar-${event.id}`,
          title: event.title,
          source: 'calendar',
          time,
          label: event.allDay || time === null ? 'All day' : formatTime(time),
          completed: false,
        });
      }
    }
    if (settings.sources.reminders) {
      for (const reminder of reminders) {
        if (!isTodayReminder(reminder, now)) continue;
        result.push({
          id: `reminder-${reminder.id}`,
          title: reminder.title,
          source: 'reminder',
          time: null,
          label: 'Anytime',
          completed: reminder.completed,
        });
      }
    }
    if (settings.sources.tasks) {
      for (const task of tasks) {
        if (getLocalDayKey(new Date(task.createdAt)) !== dateKey) continue;
        result.push({
          id: `task-${task.id}`,
          title: task.title,
          source: 'task',
          time: null,
          label: 'Anytime',
          completed: task.completed,
        });
      }
    }
    if (settings.bedtimeMarkerEnabled) {
      const [hours, minutes] = settings.bedtimeTime.split(':').map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes).getTime();
        result.push({
          id: 'bedtime',
          title: 'Bedtime',
          source: 'calendar',
          time,
          label: formatTime(time),
          completed: false,
        });
      }
    }
    return result.sort((left, right) =>
      (left.time ?? Number.MAX_SAFE_INTEGER) - (right.time ?? Number.MAX_SAFE_INTEGER));
  }, [calendarEvents, now, reminders, settings, tasks]);

  const pendingCount = items.filter(item => !item.completed && item.id !== 'bedtime').length;
  const doneCount = items.filter(item => item.completed).length;
  const sourceIcons = { calendar: CalendarDays, reminder: Bell, task: ListTodo };

  return (
    <div className={`grid h-full w-full min-h-0 gap-2 ${settings.showSummaryColumn ? 'grid-cols-[minmax(0,1fr)_112px]' : 'grid-cols-1'}`}>
      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.015] p-3">
        <header className="flex shrink-0 items-center justify-between">
          <div>
            <h3 className="text-[11px] font-semibold text-white">Today’s timeline</h3>
            <p className="mt-0.5 text-[8px] text-slate-500">
              {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(now)}
            </p>
          </div>
          <span className="rounded-full border border-sky-300/15 bg-sky-300/[0.07] px-2 py-1 text-[8px] font-medium text-sky-200">
            {items.length} items
          </span>
        </header>
        <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="flex h-full min-h-24 flex-col items-center justify-center text-center">
              <CalendarDays className="h-5 w-5 text-slate-600" />
              <p className="mt-2 text-[9px] font-medium text-slate-300">A clear day</p>
              <p className="mt-1 text-[8px] text-slate-500">Calendar events and today’s tasks will appear here.</p>
            </div>
          ) : items.map(item => {
            const Icon = item.id === 'bedtime' ? Moon : sourceIcons[item.source];
            return (
              <div key={item.id} className={`group flex min-h-10 items-center gap-2 rounded-xl border px-2 py-1.5 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035] ${item.id === 'bedtime' ? 'border-violet-300/15 bg-violet-300/[0.035]' : 'border-white/[0.05] bg-black/10'}`}>
                {item.source === 'task' ? (
                  <button
                    type="button"
                    aria-label={`${item.completed ? 'Reopen' : 'Complete'} ${item.title}`}
                    onClick={() => onToggleTask(item.id.slice('task-'.length))}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${item.completed ? 'border-emerald-300/35 bg-emerald-300/15 text-emerald-200' : 'border-white/15 text-slate-500 hover:border-sky-300/40 hover:text-sky-200'}`}
                  >
                    {item.completed ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}
                  </button>
                ) : (
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${item.id === 'bedtime' ? 'text-violet-200' : item.source === 'calendar' ? 'text-sky-200' : 'text-amber-200'}`} />
                )}
                <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-slate-200" title={item.title}>
                  {item.title}
                </span>
                <span className="shrink-0 text-[8px] tabular-nums text-slate-500">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>
      {settings.showSummaryColumn && (
        <aside className="flex min-h-0 flex-col gap-2">
          <div className="flex flex-1 flex-col justify-center rounded-2xl border border-sky-300/10 bg-sky-300/[0.04] p-3">
            <Clock3 className="h-4 w-4 text-sky-200" />
            <div className="mt-3 font-mono text-xl font-semibold tabular-nums text-white">
              {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now)}
            </div>
            <div className="mt-1 text-[8px] uppercase tracking-wider text-slate-500">Local time</div>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Up next</div>
            <div className="mt-1.5 line-clamp-2 text-[9px] font-semibold text-slate-200">
              {items.find(item => item.time !== null && item.time >= now.getTime())?.title ?? 'Nothing scheduled'}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.035] p-3">
            <div className="text-[8px] font-medium uppercase tracking-wider text-slate-500">Tasks done</div>
            <div className="mt-1 font-mono text-lg font-semibold text-emerald-200">{doneCount}<span className="text-slate-500">/{doneCount + pendingCount}</span></div>
          </div>
        </aside>
      )}
    </div>
  );
};
