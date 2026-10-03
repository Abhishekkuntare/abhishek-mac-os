import React from 'react';
import { motion } from 'motion/react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';

export const AppSwitcher: React.FC = () => {
  const {
    showAppSwitcher,
    setShowAppSwitcher,
    windows,
    activeSpaceId,
    focusWindow,
  } = useOS();

  if (!showAppSwitcher) return null;

  const availableWindows = windows
    .filter(window => !window.desktopSpaceId || window.desktopSpaceId === activeSpaceId)
    .sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div
      className="fixed inset-0 z-[2147482000] flex items-center justify-center bg-black/25 p-6 backdrop-blur-[2px]"
      onClick={() => setShowAppSwitcher(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-[min(90vw,900px)] rounded-3xl border border-white/15 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="mb-3 px-1 text-xs font-medium text-white/50">
          Switch window · release Alt to select
        </div>
        <div className="flex max-w-full gap-3 overflow-x-auto pb-1">
          {availableWindows.map((window, index) => {
            const metadata = APP_REGISTRY[window.appId];
            const isSelected = window.isFocused;
            return (
              <button
                type="button"
                key={window.id}
                onClick={() => {
                  focusWindow(window.id);
                  setShowAppSwitcher(false);
                }}
                className={`flex w-40 shrink-0 flex-col items-center gap-3 rounded-2xl border p-4 text-center transition ${
                  isSelected
                    ? 'border-sky-300 bg-sky-400/15 ring-2 ring-sky-300/40'
                    : 'border-white/10 bg-white/[0.04] hover:bg-white/10'
                }`}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg"
                  style={{ background: metadata?.iconBg || '#334155' }}
                >
                  {window.title.charAt(0).toUpperCase()}
                </span>
                <span className="w-full truncate text-xs font-semibold text-white">
                  {window.title}
                </span>
                <span className="text-[10px] text-white/45">
                  {window.isMinimized ? 'Minimized' : metadata?.name || window.appId}
                </span>
                <span className="sr-only">Window {index + 1} of {availableWindows.length}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
