import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, AppWindow, Music, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { AppIcon } from '../system/AppIcon';
import { getWindowPreview } from '../../utils/windowPreview';

export const AppSwitcher: React.FC = () => {
  const {
    showAppSwitcher,
    setShowAppSwitcher,
    windows,
    activeSpaceId,
    focusWindow,
  } = useOS();

  const availableWindows = windows
    .filter(window => !window.desktopSpaceId || window.desktopSpaceId === activeSpaceId)
    .sort((a, b) => b.zIndex - a.zIndex);

  return (
    <AnimatePresence>
      {showAppSwitcher && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[2147482000] flex items-center justify-center bg-black/25 p-5 backdrop-blur-[3px]"
          onClick={() => setShowAppSwitcher(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 5 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className={`w-fit max-w-[min(94vw,980px)] overflow-hidden rounded-[28px] border border-white/15 bg-slate-950/85 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:p-5 ${
              availableWindows.length === 0
                ? 'max-w-[440px]'
                : availableWindows.length === 1
                  ? 'max-w-[560px]'
                  : 'max-w-[980px]'
            }`}
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-white">App Switcher</h2>
                <p className="mt-0.5 text-[11px] text-white/50">
                  {availableWindows.length
                    ? `Choose a window · ${availableWindows.length} open`
                    : 'Switch between your open app windows'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAppSwitcher(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close App Switcher"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {availableWindows.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-6 py-8 text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200 shadow-[0_8px_30px_rgba(14,165,233,0.12)]">
                  <AppWindow className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <h3 className="text-sm font-semibold text-white">No open windows</h3>
                <p className="mx-auto mt-1.5 max-w-[260px] text-xs leading-relaxed text-white/50">
                  Open an app from the Dock, then use this switcher to jump between windows.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAppSwitcher(false)}
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-sky-300 px-4 text-xs font-semibold text-slate-950 transition hover:bg-sky-200"
                >
                  Return to desktop
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className="flex max-h-[72vh] max-w-[min(90vw,940px)] flex-wrap justify-center gap-4 overflow-y-auto pb-1"
              >
                {availableWindows.map((window, index) => {
            const metadata = APP_REGISTRY[window.appId];
            const preview = getWindowPreview(window.id);
            const isSelected = window.isFocused;
            return (
              <motion.button
                layout
                type="button"
                key={window.id}
                onClick={() => {
                  focusWindow(window.id);
                  setShowAppSwitcher(false);
                }}
                whileHover={{ y: -4, scale: 1.025 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                className={`group w-[min(280px,80vw)] shrink-0 overflow-hidden rounded-2xl border text-left shadow-lg transition-colors duration-200 ${
                  isSelected
                    ? 'border-sky-300/80 bg-sky-400/10 ring-2 ring-sky-300/35 shadow-[0_14px_36px_rgba(14,165,233,0.16)]'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)]'
                }`}
              >
                <span className="relative block aspect-[16/10] overflow-hidden bg-slate-900">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`${window.title} window preview`}
                      className="h-full w-full bg-slate-950 object-contain transition-transform duration-500 group-hover:scale-[1.035]"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: metadata?.iconBg || 'linear-gradient(135deg, #1e293b, #0f172a)' }}
                    >
                      <AppIcon
                        appId={window.appId}
                        className="h-20 w-20 object-contain drop-shadow-2xl"
                        fallback={window.appId === 'music'
                          ? <Music className="h-16 w-16 text-white drop-shadow-2xl" />
                          : <span className="text-4xl font-semibold text-white">{window.title.charAt(0).toUpperCase()}</span>}
                      />
                    </span>
                  )}
                  {window.isMinimized && (
                    <span className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-slate-950/75 px-2.5 py-1 text-[10px] font-medium text-white/90 shadow-lg">
                      Minimized
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent" />
                </span>
                <span className="flex min-w-0 items-center gap-2.5 px-3.5 py-3">
                  <AppIcon
                    appId={window.appId}
                    className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-lg"
                    fallback={
                      window.appId === 'music'
                        ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white"><Music className="h-4 w-4" /></span>
                        : <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                            style={{ background: metadata?.iconBg || '#334155' }}
                          >
                            {window.title.charAt(0).toUpperCase()}
                          </span>
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">{window.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-white/45">
                      {window.isMinimized ? 'Minimized' : metadata?.name || window.appId}
                    </span>
                  </span>
                  <span className="sr-only">Window {index + 1} of {availableWindows.length}</span>
                </span>
              </motion.button>
            );
                })}
              </motion.div>
            )}
            {availableWindows.length > 0 && (
              <p className="mt-3 text-center text-[10px] text-white/35">
                Select a preview to bring that window forward
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
