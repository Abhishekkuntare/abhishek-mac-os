import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X, Monitor, Music, Pencil, Check } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { sound } from '../../services/soundService';
import { AppIcon } from '../system/AppIcon';
import { getWindowPreview } from '../../utils/windowPreview';

export const MissionControl: React.FC = () => {
  const {
    showMissionControl,
    setShowMissionControl,
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    addSpace,
    renameSpace,
    removeSpace,
    windows,
    focusWindow,
    closeWindow,
    moveWindowToSpace,
  } = useOS();
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingSpaceName, setEditingSpaceName] = useState('');
  const [draggedWindowId, setDraggedWindowId] = useState<string | null>(null);
  const [dropTargetSpaceId, setDropTargetSpaceId] = useState<string | null>(null);

  const beginSpaceRename = (event: React.MouseEvent, spaceId: string, name: string) => {
    event.stopPropagation();
    setEditingSpaceId(spaceId);
    setEditingSpaceName(name);
  };

  const saveSpaceRename = () => {
    if (editingSpaceId) renameSpace(editingSpaceId, editingSpaceName);
    setEditingSpaceId(null);
    setEditingSpaceName('');
  };

  const activeWindows = windows.filter(
    window => !window.desktopSpaceId || window.desktopSpaceId === activeSpaceId
  );

  return (
    <AnimatePresence>
      {showMissionControl && <motion.div
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
        {spaces.map(space => {
          const isActive = space.id === activeSpaceId;
          const spaceWindowCount = windows.filter(w => w.desktopSpaceId === space.id).length;

          return (
            <div
              key={space.id}
              onDragOver={event => {
                if (!draggedWindowId || space.id === activeSpaceId) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetSpaceId(space.id);
              }}
              onDragLeave={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTargetSpaceId(current => current === space.id ? null : current);
                }
              }}
              onDrop={event => {
                event.preventDefault();
                const windowId = event.dataTransfer.getData('text/plain') || draggedWindowId;
                if (windowId && space.id !== activeSpaceId) {
                  moveWindowToSpace(windowId, space.id);
                  sound.playClick();
                }
                setDraggedWindowId(null);
                setDropTargetSpaceId(null);
              }}
              onClick={() => {
                if (draggedWindowId) return;
                setActiveSpaceId(space.id);
                setShowMissionControl(false);
                sound.playClick();
              }}
              className={`group relative flex h-20 w-36 flex-col items-center justify-center rounded-xl border px-3 transition-all duration-200 cursor-pointer overflow-hidden ${
                dropTargetSpaceId === space.id
                  ? 'scale-105 border-emerald-300 bg-emerald-400/20 ring-2 ring-emerald-300/50'
                  : isActive
                  ? 'border-sky-400 ring-2 ring-sky-400/40 bg-sky-500/10'
                  : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              {editingSpaceId === space.id ? (
                <div
                className="z-10 flex w-full flex-col items-center gap-1"
                onClick={event => event.stopPropagation()}
                >
                <div className="flex w-full items-center gap-1">
                  <input
                    autoFocus
                    maxLength={32}
                    value={editingSpaceName}
                    onChange={event => setEditingSpaceName(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        saveSpaceRename();
                      } else if (event.key === 'Escape') {
                        setEditingSpaceId(null);
                        setEditingSpaceName('');
                      }
                    }}
                    aria-label="Desktop name"
                    className="min-w-0 flex-1 rounded-md border border-sky-300/40 bg-slate-950/80 px-2 py-1 text-center text-xs font-semibold text-white outline-none focus:border-sky-300/70"
                  />
                  <button
                    type="button"
                    onClick={saveSpaceRename}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-300 text-slate-950 transition hover:bg-sky-200"
                    title="Save desktop name"
                    aria-label="Save desktop name"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSpaceId(null);
                      setEditingSpaceName('');
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                    title="Cancel rename"
                    aria-label="Cancel rename"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[9px] text-white/45">Enter to save · Esc to cancel</span>
                </div>
              ) : (
                <>
                  <div className="flex max-w-full items-center gap-1.5 text-xs font-semibold text-white">
                    <Monitor className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                    <span className="truncate">{space.name}</span>
                  </div>
                  <span className="mt-1 text-[10px] text-slate-400">
                    {dropTargetSpaceId === space.id
                      ? 'Drop to move window'
                      : `${spaceWindowCount} ${spaceWindowCount === 1 ? 'window' : 'windows'}`}
                  </span>
                </>
              )}

              {editingSpaceId !== space.id && (
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={event => beginSpaceRename(event, space.id, space.name)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/65 text-white/75 transition hover:bg-sky-400 hover:text-slate-950"
                    title={`Rename ${space.name}`}
                    aria-label={`Rename ${space.name}`}
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {spaces.length > 1 && (
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        removeSpace(space.id);
                        sound.playClick();
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/65 text-white/75 transition hover:bg-red-500 hover:text-white"
                      title="Remove Space"
                      aria-label={`Remove ${space.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => {
            addSpace();
            setShowMissionControl(false);
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
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-h-[65vh] overflow-y-auto p-4">
            <AnimatePresence mode="popLayout">
            {activeWindows.map(win => {
              const meta = APP_REGISTRY[win.appId];

              return (
                <motion.div
                  key={win.id}
                  layout
                  draggable
                  onDragStartCapture={event => {
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', win.id);
                    setDraggedWindowId(win.id);
                  }}
                  onDragEndCapture={() => {
                    setDraggedWindowId(null);
                    setDropTargetSpaceId(null);
                  }}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => {
                    focusWindow(win.id);
                    setShowMissionControl(false);
                    sound.playClick();
                  }}
                  className={`group relative flex flex-col rounded-2xl glass-panel border border-white/25 shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden transition-all duration-200 ${
                    draggedWindowId === win.id ? 'opacity-45 scale-[0.98]' : ''
                  }`}
                >
                  {/* Miniature window header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/10 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <AppIcon
                        appId={win.appId}
                        className="h-5 w-5 rounded-md object-cover"
                        fallback={
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
                            style={{ background: meta?.iconBg || '#3b82f6' }}
                          >
                            {win.title.charAt(0)}
                          </span>
                        }
                      />
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

                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-950">
                    {getWindowPreview(win.id) ? (
                      <img
                        src={getWindowPreview(win.id)}
                        alt={`${win.title} window preview`}
                        className="h-full w-full bg-slate-950 object-contain"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: meta?.iconBg || 'linear-gradient(135deg, #1e293b, #020617)' }}
                      >
                        <AppIcon
                          appId={win.appId}
                          className="h-24 w-24 object-contain drop-shadow-2xl"
                          fallback={win.appId === 'music'
                            ? <Music className="h-20 w-20 text-white drop-shadow-2xl" />
                            : <span className="text-5xl font-semibold text-white">{win.title.charAt(0).toUpperCase()}</span>}
                        />
                      </div>
                    )}
                    {win.isMinimized && (
                      <span className="absolute bottom-2 left-2 rounded-full border border-white/15 bg-slate-950/75 px-2.5 py-1 text-[10px] font-medium text-white/90 shadow-lg">
                        Minimized
                      </span>
                    )}
                  </div>
                  </motion.div>
              );
            })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="text-xs text-slate-400 font-medium">
        Drag a window onto a desktop above to move it · Press <kbd className="px-2 py-0.5 rounded bg-white/15 text-white font-mono">Esc</kbd> or click the background to exit
      </div>
      </motion.div>}
    </AnimatePresence>
  );
};
