import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AppWindow,
  CalendarDays,
  Download,
  FileClock,
  FileText,
  Folder,
  Image,
  Search,
  Settings2,
  Trash2,
  X,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import type { ActivityCategory, ActivityEntry } from '../../services/activityLog';
import { MascotMark } from './MascotMark';

type CategoryFilter = 'all' | ActivityCategory;

const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  session: 'Account',
  app: 'Apps',
  search: 'Searches',
  file: 'Files',
  setting: 'Settings',
  workspace: 'Navigation',
  system: 'System',
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const localDateKey = (value: string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const escapeMarkup = (value: string) =>
  value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character] || character);

const saveDownload = (filename: string, data: Blob) => {
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const makeCsv = (entries: ActivityEntry[]) => {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [
    ['Date and time', 'Category', 'Activity', 'Details'].map(escapeCell).join(','),
    ...entries.map(entry => [
      formatTimestamp(entry.timestamp),
      CATEGORY_LABELS[entry.category],
      entry.title,
      entry.details || '',
    ].map(escapeCell).join(',')),
  ].join('\r\n');
};

const makeSvg = (entries: ActivityEntry[]) => {
  const rowHeight = 66;
  const height = Math.max(240, 116 + entries.length * rowHeight);
  const rows = entries.map((entry, index) => {
    const y = 138 + index * rowHeight;
    const detail = entry.details ? escapeMarkup(entry.details) : '';
    return `
      <g transform="translate(52 ${y})">
        <circle cx="12" cy="12" r="5" fill="#38bdf8"/>
        <text x="32" y="9" fill="#f8fafc" font-family="Arial, sans-serif" font-size="17" font-weight="700">${escapeMarkup(entry.title)}</text>
        <text x="32" y="32" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">${escapeMarkup(CATEGORY_LABELS[entry.category])}${detail ? ` · ${detail}` : ''}</text>
        <text x="1148" y="9" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="12" text-anchor="end">${escapeMarkup(formatTimestamp(entry.timestamp))}</text>
        <path d="M32 48H1148" stroke="#ffffff" stroke-opacity=".08"/>
      </g>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}">
    <rect width="1200" height="${height}" rx="28" fill="#0b1220"/>
    <text x="52" y="57" fill="#f8fafc" font-family="Arial, sans-serif" font-size="27" font-weight="700">ARLO OS · Activity History</text>
    <text x="52" y="88" fill="#94a3b8" font-family="Arial, sans-serif" font-size="14">${entries.length} recorded activities · Stored on this device</text>
    ${rows || '<text x="52" y="150" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16">No matching activity</text>'}
  </svg>`;
};

const categoryIcon = (category: ActivityCategory) => {
  switch (category) {
    case 'app': return AppWindow;
    case 'file': return Folder;
    case 'setting': return Settings2;
    case 'search': return Search;
    case 'workspace': return CalendarDays;
    case 'session': return Activity;
    default: return FileClock;
  }
};

export const ActivityHistoryModal: React.FC = () => {
  const {
    showActivityHistory,
    setShowActivityHistory,
    activityEntries,
    activityError,
    activityTrackingEnabled,
    settings,
    deleteActivity,
    clearActivity,
  } = useOS();
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(80);
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredEntries = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase();
    return activityEntries.filter(entry => {
      if (category !== 'all' && entry.category !== category) return false;
      const day = localDateKey(entry.timestamp);
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      if (query && !`${entry.title} ${entry.details || ''} ${CATEGORY_LABELS[entry.category]}`.toLocaleLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [activityEntries, category, fromDate, searchText, toDate]);

  if (!showActivityHistory) return null;

  const downloadJson = () => {
    saveDownload('arlo-activity-history.json', new Blob([
      JSON.stringify(filteredEntries, null, 2),
    ], { type: 'application/json;charset=utf-8' }));
  };

  const downloadCsv = () => {
    saveDownload('arlo-activity-history.csv', new Blob([
      `\uFEFF${makeCsv(filteredEntries)}`,
    ], { type: 'text/csv;charset=utf-8' }));
  };

  const downloadImage = () => {
    saveDownload('arlo-activity-history.svg', new Blob([
      makeSvg(filteredEntries),
    ], { type: 'image/svg+xml;charset=utf-8' }));
  };

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    try {
      await clearActivity();
      setConfirmClear(false);
    } catch {
      setConfirmClear(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="activity-history-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-6"
        onMouseDown={event => {
          if (event.target === event.currentTarget) setShowActivityHistory(false);
        }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-history-title"
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
          className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#0d1421] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
        >
          <header className="relative flex items-start justify-between gap-4 border-b border-white/[0.08] bg-gradient-to-br from-sky-400/[0.055] via-transparent to-indigo-400/[0.04] px-5 py-4 sm:px-7 sm:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-400/[0.09] shadow-[0_0_22px_rgba(56,189,248,0.12)]"
              >
                <MascotMark
                  className="h-9 w-9"
                  interactive={false}
                  color={settings.mascotColor}
                />
              </motion.div>
              <div className="min-w-0">
                <h2 id="activity-history-title" className="text-lg font-bold tracking-tight sm:text-xl">Activity History</h2>
                <p className="mt-1 text-xs text-slate-400">A live timeline of what you do inside ARLO OS.</p>
                <p className={`mt-1.5 flex items-center gap-1.5 text-[10px] ${activityTrackingEnabled ? 'text-emerald-300/80' : 'text-amber-300/80'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${activityTrackingEnabled ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                  {activityTrackingEnabled ? 'Tracking on' : 'Tracking paused'} · stored only on this device · no outside-app monitoring
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close Activity History"
              onClick={() => setShowActivityHistory(false)}
              className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:rotate-90 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="grid gap-3 border-b border-white/[0.08] px-5 py-4 sm:grid-cols-[minmax(180px,1fr)_auto_auto] sm:px-7">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchText}
                onChange={event => {
                  setSearchText(event.target.value);
                  setVisibleCount(80);
                }}
                placeholder="Search your activity"
                aria-label="Search activity history"
                className="w-full rounded-xl border border-white/10 bg-white/[0.045] py-2.5 pl-9 pr-3 text-xs text-white outline-none transition-colors placeholder:text-slate-500 focus:border-sky-300/40"
              />
            </label>
            <select
              aria-label="Filter activity category"
              value={category}
              onChange={event => {
                setCategory(event.target.value as CategoryFilter);
                setVisibleCount(80);
              }}
              className="rounded-xl border border-white/10 bg-[#111b2b] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-sky-300/40"
            >
              <option value="all">All activity</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                type="date"
                aria-label="Activity from date"
                value={fromDate}
                onChange={event => {
                  setFromDate(event.target.value);
                  setVisibleCount(80);
                }}
                className="min-w-0 bg-transparent py-2 text-[10px] text-slate-300 outline-none"
              />
              <span className="text-slate-600">–</span>
              <input
                type="date"
                aria-label="Activity to date"
                value={toDate}
                onChange={event => {
                  setToDate(event.target.value);
                  setVisibleCount(80);
                }}
                className="min-w-0 bg-transparent py-2 text-[10px] text-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-3 sm:px-7">
            <p className="text-xs text-slate-400" aria-live="polite">
              <span className="font-semibold text-white">{filteredEntries.length}</span> {filteredEntries.length === 1 ? 'event' : 'events'}
              {filteredEntries.length !== activityEntries.length && <span> · {activityEntries.length} total</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadJson} disabled={!filteredEntries.length} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.07] disabled:opacity-40">
                <Download className="h-3.5 w-3.5" /> JSON
              </button>
              <button type="button" onClick={downloadCsv} disabled={!filteredEntries.length} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.07] disabled:opacity-40">
                <FileText className="h-3.5 w-3.5" /> CSV
              </button>
              <button type="button" onClick={downloadImage} disabled={!filteredEntries.length} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.07] disabled:opacity-40">
                <Image className="h-3.5 w-3.5" /> Image
              </button>
              <button type="button" onClick={() => void handleClear()} disabled={!activityEntries.length} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition-colors disabled:opacity-40 ${confirmClear ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-white/10 text-slate-400 hover:bg-rose-400/10 hover:text-rose-200'}`}>
                <Trash2 className="h-3.5 w-3.5" /> {confirmClear ? 'Confirm clear all' : 'Clear history'}
              </button>
              {confirmClear && (
                <button type="button" onClick={() => setConfirmClear(false)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-300 hover:bg-white/[0.07]">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {activityError && (
            <div role="alert" className="border-b border-rose-300/15 bg-rose-400/[0.07] px-5 py-2.5 text-xs text-rose-200 sm:px-7">
              {activityError}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-7">
            {filteredEntries.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-500">
                  <FileClock className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-200">No matching activity yet</p>
                <p className="mt-1 max-w-sm text-xs text-slate-500">
                  ARLO OS records app launches, searches when submitted, file changes, settings, and desktop navigation.
                </p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute bottom-5 left-[15px] top-5 w-px bg-gradient-to-b from-sky-300/25 via-white/10 to-transparent" />
                <div className="space-y-1">
                  {filteredEntries.slice(0, visibleCount).map((entry, index) => {
                    const Icon = categoryIcon(entry.category);
                    return (
                      <motion.article
                        key={entry.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.16, delay: Math.min(index % 8, 7) * 0.015 }}
                        className="group relative flex items-start gap-3 rounded-2xl px-2 py-3 transition-colors hover:bg-white/[0.035]"
                      >
                        <div                         className="z-[1] mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-sky-300/15 bg-[#0d1421] text-sky-300 transition-all duration-200 group-hover:border-sky-300/35 group-hover:bg-sky-400/10 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.12)]">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <h3 className="text-xs font-semibold text-slate-100">{entry.title}</h3>
                            <time dateTime={entry.timestamp} className="text-[10px] tabular-nums text-slate-500">
                              {formatTimestamp(entry.timestamp)}
                            </time>
                          </div>
                          {entry.details && <p className="mt-1 break-words text-[11px] leading-relaxed text-slate-400">{entry.details}</p>}
                          <span className="mt-1.5 inline-block rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 py-0.5 text-[9px] text-slate-500">
                            {CATEGORY_LABELS[entry.category]}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Delete activity: ${entry.title}`}
                          title="Delete this activity"
                          onClick={() => void deleteActivity(entry.id).catch(() => undefined)}
                          className="rounded-lg p-1.5 text-slate-600 opacity-100 transition-colors hover:bg-rose-400/10 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.article>
                    );
                  })}
                </div>
              </div>
            )}
            {filteredEntries.length > visibleCount && (
              <button
                type="button"
                onClick={() => setVisibleCount(count => count + 80)}
                className="my-3 w-full rounded-xl border border-white/10 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.06]"
              >
                Load older activity ({filteredEntries.length - visibleCount} remaining)
              </button>
            )}
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
};
