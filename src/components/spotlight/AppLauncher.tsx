import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { ArrowRight, FileText, Folder, Maximize2, Minimize2, Move, Search, Settings2, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { AppIcon } from '../system/AppIcon';
import { vfs } from '../../services/virtualFileSystem';
import { openVirtualFile } from '../../services/fileAssociations';
import { openSettingsDestination, searchSettingsDestinations } from '../../services/settingsSearch';
import type { VirtualFile } from '../../types/desktop';

type LauncherResult =
  | { id: string; kind: 'app'; title: string; subtitle: string; appId: string }
  | { id: string; kind: 'file'; title: string; subtitle: string; file: VirtualFile }
  | { id: string; kind: 'settings'; title: string; subtitle: string; destination: ReturnType<typeof searchSettingsDestinations>[number] };

export const AppLauncher: React.FC = () => {
  const { openApp, setQuickLookFile, setShowSpotlight, settings } = useOS();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const resizeStart = useRef<{ pointerX: number; pointerY: number; width: number; height: number } | null>(null);
  const dragControls = useDragControls();
  const [size, setSize] = useState(() => ({
    width: Math.min(920, Math.max(420, window.innerWidth - 48)),
    height: Math.min(680, Math.max(400, window.innerHeight - 96)),
  }));
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.repeat || event.code !== 'Enter' || !event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(open => !open);
      setShowSpotlight(false);
    };
    const handleOpenRequest = () => {
      setIsOpen(true);
      setShowSpotlight(false);
    };
    window.addEventListener('keydown', handleShortcut, true);
    window.addEventListener('arlo:open-app-launcher', handleOpenRequest);
    return () => {
      window.removeEventListener('keydown', handleShortcut, true);
      window.removeEventListener('arlo:open-app-launcher', handleOpenRequest);
    };
  }, [setShowSpotlight]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const results = useMemo<LauncherResult[]>(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const settings = searchSettingsDestinations(normalizedQuery);
    const apps = Object.values(APP_REGISTRY)
      .filter(app =>
        app.installed &&
        (!normalizedQuery ||
          app.name.toLowerCase().includes(normalizedQuery) ||
          app.category.toLowerCase().includes(normalizedQuery) ||
          app.description.toLowerCase().includes(normalizedQuery)),
      )
      .slice(0, normalizedQuery ? 6 : 30)
      .map(app => ({
        id: `app-${app.id}`,
        kind: 'app' as const,
        title: app.name,
        subtitle: app.description,
        appId: app.id,
      }));
    const files = normalizedQuery
      ? vfs.getAllActiveFiles()
          .filter(file => {
            const searchable = `${file.name} ${file.path} ${file.extension ?? ''}`.toLowerCase();
            return searchable.includes(normalizedQuery);
          })
          .slice(0, 6)
          .map(file => ({
            id: `file-${file.id}`,
            kind: 'file' as const,
            title: file.name,
            subtitle: `${file.path}${file.type === 'folder' ? ' · Folder' : ` · ${(file.extension || file.type).toUpperCase()}`}`,
            file,
          }))
      : [];

    return [
      ...settings.map(destination => ({
        id: `settings-${destination.id}`,
        kind: 'settings' as const,
        title: destination.title,
        subtitle: destination.subtitle,
        destination,
      })),
      ...apps,
      ...files,
    ];
  }, [query]);

  useEffect(() => {
    setSelectedIndex(index => Math.min(index, Math.max(0, results.length - 1)));
  }, [results.length]);

  const activateResult = (result: LauncherResult) => {
    if (result.kind === 'app') openApp(result.appId);
    else if (result.kind === 'file') openVirtualFile(result.file, openApp, setQuickLookFile);
    else openSettingsDestination(result.destination, openApp);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleNavigation = (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'Enter') {
        return;
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(index => (index + 1) % Math.max(1, results.length));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(index => (index - 1 + results.length) % Math.max(1, results.length));
      } else if (event.key === 'Enter' && results[selectedIndex]) {
        event.preventDefault();
        activateResult(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [activateResult, isOpen, results, selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden bg-slate-950/25 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
          role="presentation"
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label="App launcher"
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            drag={!isMaximized}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={overlayRef}
            dragMomentum={false}
            whileDrag={{ scale: 1.005, cursor: 'grabbing' }}
            className="relative flex max-w-full flex-col overflow-hidden border border-white/20 text-white shadow-[0_35px_120px_rgba(0,0,0,0.48)]"
            style={{
              width: isMaximized ? Math.max(320, window.innerWidth - 32) : size.width,
              height: isMaximized ? Math.max(320, window.innerHeight - 32) : size.height,
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100dvh - 32px)',
              transition: 'width 220ms ease, height 220ms ease, border-radius 220ms ease',
              borderRadius: isMaximized ? 20 : 28,
              background: settings.glassEffects
                ? `rgba(15, 23, 42, ${Math.max(0.28, 0.62 - settings.glassIntensity * 0.28)})`
                : 'rgba(15, 23, 42, 0.96)',
              backdropFilter: settings.glassEffects ? 'blur(36px) saturate(165%)' : undefined,
              WebkitBackdropFilter: settings.glassEffects ? 'blur(36px) saturate(165%)' : undefined,
            }}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.08] p-4 sm:px-6">
              <Search size={19} className="shrink-0 text-sky-300" />
              <input
                ref={inputRef}
                value={query}
                onChange={event => {
                  setQuery(event.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search apps, files, or settings…"
                aria-label="Search apps, files, or settings"
                className="app-launcher-search h-11 min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-slate-300/60 focus:outline-none focus-visible:outline-none focus-visible:ring-0 sm:text-lg"
              />
              <kbd className="hidden rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400 sm:block">ALT + ENTER</kbd>
              <button
                type="button"
                onPointerDown={event => dragControls.start(event)}
                aria-label="Drag launcher"
                title="Drag to move"
                className="cursor-grab rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <Move size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsMaximized(value => !value)}
                aria-label={isMaximized ? 'Restore launcher size' : 'Maximize launcher'}
                title={isMaximized ? 'Restore size' : 'Fill screen'}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close app launcher"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <X size={17} />
              </button>
            </div>

            {results.length === 0 ? (
              <div className="flex min-h-60 flex-1 flex-col items-center justify-center overflow-y-auto px-6 text-center">
                <Search className="mb-3 h-8 w-8 text-slate-600" />
                <p className="text-sm font-semibold text-slate-200">No matches found</p>
                <p className="mt-1 text-xs text-slate-500">Try an app name, file name, or setting like “Notch”.</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {!query.trim() ? (
                  <h2 className="mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Applications</h2>
                ) : (
                  <h2 className="mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Search results</h2>
                )}
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {results.map((result, index) => {
                    if (result.kind === 'file' || result.kind === 'settings') return null;
                    const app = APP_REGISTRY[result.appId];
                    return (
                      <motion.button
                        key={result.id}
                        type="button"
                        onClick={() => activateResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        whileHover={{ y: -3, scale: 1.025 }}
                        whileTap={{ scale: 0.97 }}
                        className={`group flex min-h-28 min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                          selectedIndex === index
                            ? 'border-sky-300/45 bg-sky-400/[0.12]'
                            : 'border-transparent hover:border-white/10 hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[15px] bg-white/5 shadow-lg transition-transform duration-200 group-hover:scale-105">
                          <AppIcon appId={result.appId} className="h-full w-full object-cover" fallback={<span className="text-lg font-semibold">{result.title.charAt(0)}</span>} />
                        </span>
                        <span className="w-full truncate text-[11px] font-medium text-slate-200">{result.title}</span>
                        <span className="sr-only">{app?.category}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {results.some(result => result.kind === 'settings' || result.kind === 'file') && (
                  <div className="mt-5 space-y-1">
                    {results.map((result, index) => {
                      if (result.kind === 'app') return null;
                      const isSelected = index === selectedIndex;
                      const Icon = result.kind === 'settings'
                        ? Settings2
                        : result.file.type === 'folder'
                          ? Folder
                          : FileText;
                      return (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => activateResult(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                            isSelected ? 'bg-sky-400/[0.13]' : 'hover:bg-white/[0.06]'
                          }`}
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            result.kind === 'settings' ? 'bg-indigo-400/10 text-indigo-300' : 'bg-white/[0.06] text-sky-300'
                          }`}>
                            <Icon size={17} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-slate-100">{result.title}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-500">{result.subtitle}</span>
                          </span>
                          <ArrowRight size={14} className="shrink-0 text-slate-600" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="flex shrink-0 items-center justify-between border-t border-white/[0.07] px-5 py-3 text-[10px] text-slate-500">
              <span>{query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Installed apps'}</span>
              <span className="hidden sm:inline">↑↓ Navigate <span className="mx-1 text-slate-700">·</span> Enter Open <span className="mx-1 text-slate-700">·</span> Esc Close</span>
            </div>
            {!isMaximized && (
              <div
                role="separator"
                aria-label="Resize launcher"
                aria-orientation="horizontal"
                title="Drag to resize"
                onPointerDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  resizeStart.current = {
                    pointerX: event.clientX,
                    pointerY: event.clientY,
                    width: size.width,
                    height: size.height,
                  };
                }}
                onPointerMove={event => {
                  const start = resizeStart.current;
                  if (!start) return;
                  setSize({
                    width: Math.min(window.innerWidth - 32, Math.max(420, start.width + event.clientX - start.pointerX)),
                    height: Math.min(window.innerHeight - 32, Math.max(400, start.height + event.clientY - start.pointerY)),
                  });
                }}
                onPointerUp={event => {
                  resizeStart.current = null;
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
                onPointerCancel={() => {
                  resizeStart.current = null;
                }}
                className="absolute bottom-0 right-0 z-10 flex h-7 w-7 cursor-nwse-resize touch-none items-end justify-end rounded-tl-xl p-1.5 text-slate-500 transition hover:text-sky-200"
              >
                <span className="h-3 w-3 border-b-2 border-r-2 border-current opacity-70" />
              </div>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
