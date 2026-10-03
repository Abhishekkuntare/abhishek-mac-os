import React from 'react';
import { motion } from 'motion/react';
import { Plus, X, Monitor } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { sound } from '../../services/soundService';

export const MissionControl: React.FC = () => {
  const {
    showMissionControl,
    setShowMissionControl,
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    addSpace,
    removeSpace,
    windows,
    focusWindow,
    closeWindow,
  } = useOS();

  if (!showMissionControl) return null;

  const activeWindows = windows.filter(
    window => !window.desktopSpaceId || window.desktopSpaceId === activeSpaceId
  );

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      transition={{ duration: 0.25 }}
      onClick={() => setShowMissionControl(false)}
      className="fixed inset-0 z-[20000] bg-black/60 flex flex-col items-center justify-between p-8 select-none"
    >
      {/* Top Spaces Bar */}
      <div
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-4 py-3 px-6 rounded-2xl glass-panel shadow-2xl border border-white/20"
      >
        {spaces.map((space, idx) => {
          const isActive = space.id === activeSpaceId;
          const spaceWindowCount = windows.filter(w => w.desktopSpaceId === space.id).length;

          return (
            <div
              key={space.id}
              onClick={() => {
                setActiveSpaceId(space.id);
                sound.playClick();
              }}
              className={`group relative flex flex-col items-center justify-center w-36 h-22 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                isActive
                  ? 'border-sky-400 ring-2 ring-sky-400/40 bg-sky-500/10'
                  : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate">{space.name}</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {spaceWindowCount} {spaceWindowCount === 1 ? 'window' : 'windows'}
              </span>

              {spaces.length > 1 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeSpace(space.id);
                    sound.playClick();
                  }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove Space"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => {
            addSpace();
            sound.playClick();
          }}
          className="flex flex-col items-center justify-center w-22 h-22 rounded-xl border border-dashed border-white/25 hover:border-sky-400 hover:bg-sky-500/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Add New Space"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium">New Space</span>
        </button>
      </div>

      {/* Main Grid: Scaled down active windows */}
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-6xl flex-1 flex items-center justify-center my-6"
      >
        {activeWindows.length === 0 ? (
          <div className="text-center text-slate-400">
            <Monitor className="w-16 h-16 mx-auto mb-3 opacity-30 text-sky-400" />
            <p className="text-base font-semibold text-white">No active windows in this space</p>
            <p className="text-xs text-slate-400 mt-1">Open an application from the Dock or Spotlight</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-h-[65vh] overflow-y-auto p-4">
            {activeWindows.map(win => {
              const meta = APP_REGISTRY[win.appId];

              return (
                <motion.div
                  key={win.id}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => {
                    focusWindow(win.id);
                    setShowMissionControl(false);
                    sound.playClick();
                  }}
                  className="group relative flex flex-col rounded-2xl glass-panel border border-white/25 shadow-2xl cursor-pointer overflow-hidden transition-all duration-200"
                >
                  {/* Miniature window header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/10 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: meta?.iconBg || '#3b82f6' }}
                      >
                        {win.title.charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                        {win.title}
                      </span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        closeWindow(win.id);
                      }}
                      className="w-5 h-5 rounded-full bg-white/15 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                      title="Close"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div
                    className={`relative flex h-44 flex-col justify-between overflow-hidden bg-gradient-to-br p-4 ${
                      win.isMinimized ? 'from-slate-900/80 to-slate-950/90' : 'from-slate-800/90 to-slate-950/90'
                    }`}
                  >
                    <div
                      className="absolute -right-8 -top-12 h-40 w-40 rounded-full opacity-20 blur-2xl"
                      style={{ background: meta?.iconBg || '#3b82f6' }}
                    />
                    <div className="relative flex items-center gap-3 text-left">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg"
                        style={{ background: meta?.iconBg || '#3b82f6' }}
                      >
                        <span className="text-lg font-bold">{win.title.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{win.title}</p>
                        <p className="text-[10px] text-slate-400">{meta?.name || win.appId}</p>
                      </div>
                    </div>
                    <div className="relative rounded-xl border border-white/10 bg-black/25 p-3 text-left">
                      <div className="mb-2 flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400/80" />
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/80" />
                      </div>
                      <div className="h-1.5 w-3/4 rounded bg-white/20" />
                      <div className="mt-2 h-1.5 w-1/2 rounded bg-white/10" />
                      <div className="mt-2 h-1.5 w-2/3 rounded bg-white/10" />
                    </div>
                    <span className="relative self-end rounded-full bg-white/10 px-2 py-1 text-[9px] text-slate-300">
                      {win.isMinimized ? 'Minimized · click to restore' : 'Open · click to focus'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 font-medium">
        Press <kbd className="px-2 py-0.5 rounded bg-white/15 text-white font-mono">Esc</kbd> or click background to exit Mission Control
      </div>
    </motion.div>
  );
};
