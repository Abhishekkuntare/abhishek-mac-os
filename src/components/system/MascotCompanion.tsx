import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Activity, Move, Palette, Pause, Pencil, Play, Power, Ruler, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';
import { MascotMark } from './MascotMark';
import {
  loadMascotCompanionConfig,
  MASCOT_COMPANION_CHANGE_EVENT,
  MASCOT_COMPANION_CONFIG_KEY,
  MASCOT_ACTIONS,
  type MascotActionMotion,
  type MascotCompanionConfig,
} from './mascotCompanionModel';

const MENU_EVENT = 'arlo:mascot-context';
const PLACE_EVENT = 'arlo:mascot-place';
const SETTINGS_EVENT = 'arlo:open-mascot-settings';

interface MascotMenuPosition {
  x: number;
  y: number;
}

const clampPosition = (x: number, y: number, size: number) => ({
  x: Math.max(8, Math.min(window.innerWidth - size - 8, x)),
  y: Math.max(44, Math.min(window.innerHeight - size * 1.58 - 8, y)),
});

const ACTION_POSES: Record<MascotActionMotion, { y: number[]; rotate: number[] }> = {
  sport: { y: [0, -7, 0, -3, 0], rotate: [0, -6, 4, -3, 0] },
  work: { y: [0, -1, 0, -2, 0], rotate: [0, 1, -1, 1, 0] },
  creative: { y: [0, -3, 0, -2, 0], rotate: [0, -4, 3, -2, 0] },
  reading: { y: [0, -1, 0, -1, 0], rotate: [0, 1, 0, -1, 0] },
  relax: { y: [0, -2, 0, -2, 0], rotate: [0, 2, 0, -2, 0] },
  movement: { y: [0, -8, 0, -6, 0], rotate: [0, 7, -7, 4, 0] },
  greeting: { y: [0, -4, 0, -3, 0], rotate: [0, 8, -7, 5, 0] },
  music: { y: [0, -5, 0, -5, 0], rotate: [0, 10, -10, 8, 0] },
  everyday: { y: [0, -2, 0, -2, 0], rotate: [0, 3, -3, 2, 0] },
  imagination: { y: [0, -10, -3, -12, 0], rotate: [0, -8, 7, -5, 0] },
};

const BODY_OUTFITS = {
  classic: { shirt: '#f5f8ff', trim: '#c4e6ff', pants: '#395779' },
  hoodie: { shirt: '#a78bfa', trim: '#ddd6fe', pants: '#433579' },
  sport: { shirt: '#38bdf8', trim: '#e0f2fe', pants: '#1e3a5f' },
  formal: { shirt: '#e8edf6', trim: '#60a5fa', pants: '#25334c' },
} as const;

const BODY_SHAPES = [
  'M39 13q-9 1-12 10l-5 28q9 7 28 7t28-7l-5-28q-3-9-12-10Z',
  'M37 14q-9 2-12 12l-3 25q12 8 28 8t28-8l-3-25q-3-10-12-12Z',
  'M39 13q-10 0-13 10l-4 27q10 9 28 9t28-9l-4-27q-3-10-13-10Z',
  'M37 13q-8 1-10 9l-3 25q12 13 26 13t26-13l-3-25q-2-8-10-9Z',
  'M37 14h26q7 0 8 8v30H29V22q1-8 8-8Z',
  'M38 13q-10 2-12 11l-4 26q11 9 28 9t28-9l-4-26q-2-9-12-11Z',
  'M38 13q-9 1-12 10l-4 27q11 9 28 9t28-9l-4-27q-3-9-12-10Z',
  'M36 14h28q7 0 8 8v30H28V22q1-8 8-8Z',
  'M39 13q-10 2-12 11l-4 24q9 11 27 11t27-11l-4-24q-2-9-12-11Z',
  'M39 13q-10 1-12 10l-4 27q10 8 27 8t27-8l-4-27q-2-9-12-10Z',
  'M38 13q-9 2-12 11l-4 26q11 8 28 8t28-8l-4-26q-3-9-12-11Z',
  'M37 14q-9 1-12 11l-3 25q12 8 28 8t28-8l-3-25q-3-10-12-11Z',
  'M38 13q-9 0-12 10l-4 27q11 8 28 8t28-8l-4-27q-3-10-12-10Z',
  'M39 13q-10 1-12 10l-4 26q10 9 27 9t27-9l-4-26q-2-9-12-10Z',
  'M40 12q-10 0-13 11l-4 26q10 10 27 10t27-10l-4-26q-3-11-13-11Z',
  'M38 13q-9 1-12 10l-4 27q11 8 28 8t28-8l-4-27q-3-9-12-10Z',
  'M39 13q-10 2-12 11l-4 26q10 9 27 9t27-9l-4-26q-2-9-12-11Z',
  'M38 13q-10 1-12 10l-4 27q11 8 28 8t28-8l-4-27q-2-9-12-10Z',
  'M37 14h26q8 0 9 8v30H28V22q1-8 9-8Z',
  'M38 13q-10 2-13 11l-3 26q11 8 28 8t28-8l-3-26q-3-9-13-11Z',
  'M38 13q-10 1-12 11l-4 26q10 9 28 9t28-9l-4-26q-2-10-12-11Z',
  'M38 13q-9 1-12 10l-4 27q11 9 28 9t28-9l-4-27q-3-9-12-10Z',
  'M37 14q-9 0-12 10l-4 26q13 11 29 11t29-11l-4-26q-3-10-12-10Z',
];

const CompanionBody: React.FC<{
  familyIndex: number;
  color: string;
  outfit: MascotCompanionConfig['outfit'];
  action: MascotActionMotion;
  actionLabel: string;
}> = ({ familyIndex, color, outfit, action, actionLabel }) => {
  const clothes = BODY_OUTFITS[outfit];
  const showProp = ['sport', 'work', 'creative', 'reading', 'music', 'everyday'].includes(action);
  const greeting = action === 'greeting';
  const activeMotion = action === 'sport' || action === 'imagination' || action === 'movement';
  const skinColor = familyIndex === 4 ? '#aab5c6' : '#efb79d';
  const leftArmPath = activeMotion
    ? 'M34 26q-8-4-13 3L12 41q-4 5 1 8 4 3 8-1l12-10'
    : 'M34 25q-8 1-11 10L15 48q-2 5 3 7 4 1 6-3l10-13';
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute left-1/2 top-[46%] h-[58%] w-[84%] -translate-x-1/2 overflow-visible">
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 56 36 84q-1 5 4 6h6q4 0 5-4l2-13 3 13q1 4 5 4h6q5-1 4-6l-5-28Z" fill={clothes.pants} stroke="rgba(255,255,255,.45)" strokeWidth="1.6" />
        <path d="M39 84q-6 0-7 5 0 3 4 3h12q3 0 3-3l-1-4m12 0-1 4q0 3 3 3h12q4 0 4-3-1-5-7-5l-6 1h-8Z" fill="#f7f8fc" stroke="#33445e" strokeWidth="1.7" />

        <path d={leftArmPath} fill="none" stroke={clothes.shirt} strokeWidth="11" />
        <path d={leftArmPath} fill="none" stroke={`color-mix(in srgb, ${clothes.shirt} 55%, white)`} strokeWidth="2" />
        <path d={activeMotion ? 'M20 40q-3 4-6 9-2 4 2 7 3 2 6-2l8-12' : 'M21 40q-3 5-6 10-2 4 2 6 3 2 6-2l8-12'} fill="none" stroke={skinColor} strokeWidth="7" />
        <path d="M15 50q-5 4-2 8 2 3 5 0l5-5m-5 5 1 4m1-6 3 4" fill="none" stroke={skinColor} strokeWidth="2" />
        {greeting ? (
          <>
            <path d="M64 24q8-1 11 7l5 9-8 6-9-11Z" fill={clothes.shirt} stroke={`color-mix(in srgb, ${clothes.shirt} 55%, white)`} strokeWidth="1.5" />
            <path d="M77 38q5-6 8-13l4-11q2-5 6-3 4 2 1 7l-5 15q-3 8-11 13" fill="none" stroke={skinColor} strokeWidth="7" />
            <path d="M90 15q-2-5 1-7m3 5q0-5 3-6m2 9 5-3" fill="none" stroke={skinColor} strokeWidth="2" />
          </>
        ) : (
          <>
            <path d={activeMotion ? 'M64 24q8-3 13 4l11 12q4 5-1 8-4 3-8-1L65 38' : 'M66 25q8 1 11 10l8 13q2 5-3 7-4 1-6-3L66 39'} fill="none" stroke={clothes.shirt} strokeWidth="11" />
            <path d={activeMotion ? 'M82 39q5 5 7 8 3 4-1 7-4 2-6-2l-7-10' : 'M82 44q3 5 4 7 2 4-2 6-4 1-5-3l-5-8'} fill="none" stroke={skinColor} strokeWidth="7" />
            <path d="M83 51q5 4 2 8-2 3-5 0l-5-5m5 5-1 4m-1-6-3 4" fill="none" stroke={skinColor} strokeWidth="2" />
          </>
        )}

        <path
          d={BODY_SHAPES[familyIndex] ?? BODY_SHAPES[0]}
          fill={familyIndex === 4 ? '#aab5c6' : clothes.shirt}
          stroke="rgba(255,255,255,.64)"
          strokeWidth="1.8"
        />
        {outfit === 'hoodie' && <path d="M40 23q10-14 20 0m-16 7q6 6 12 0m-7-3v18" fill="none" stroke={clothes.trim} strokeWidth="2.5" />}
        {outfit === 'formal' && <path d="m43 24 7 10 7-10-3 19h-8Z" fill="#60a5fa" />}
        {outfit === 'sport' && <path d="M31 33h38m-26-9v23m14-23v23" fill="none" stroke={clothes.trim} strokeWidth="2" />}
        {familyIndex === 4 && <><path d="M37 27v20m26-20v20" stroke="#66758a" strokeWidth="2" /><circle cx="50" cy="37" r="3" fill="#6ee7f9" /></>}
        {showProp && action === 'sport' && actionLabel.toLowerCase().includes('cricket')
          ? <><path d="M84 44 80 62" stroke="#c78b4a" strokeWidth="3" /><ellipse cx="84" cy="44" rx="2" ry="5" fill="#f5dfbc" /><circle cx="73" cy="62" r="3" fill="#e34d5b" /></>
          : showProp && action === 'sport' && actionLabel.toLowerCase().includes('tennis')
            ? <><circle cx="84" cy="55" r="8" fill="none" stroke="#f6d861" strokeWidth="2" /><path d="M78 49 90 61m0-12L78 61" stroke="#fff" strokeWidth="1" /></>
            : showProp && action === 'sport'
              ? <><circle cx="84" cy="57" r="7" fill="#fb923c" stroke="#fff1d6" /><path d="m80 54 8 6m-8 0 8-6" stroke="#a7491b" strokeWidth="1.2" /></>
              : null}
        {showProp && action === 'work' && <><rect x="75" y="49" width="15" height="10" rx="2" fill="#172b47" /><path d="M78 52h9m-9 3h6" stroke="#93d9ff" strokeWidth="1.2" /></>}
        {showProp && action === 'reading' && <><path d="M77 50q6-3 11 1 5-4 11-1v12q-6-3-11 1-5-4-11-1Z" fill="#fff1c2" /><path d="M88 51v11" stroke="#d29c46" strokeWidth="1" /></>}
        {showProp && action === 'everyday' && <><rect x="80" y="48" width="10" height="17" rx="3" fill="#202a40" /><rect x="82" y="51" width="6" height="10" rx="1" fill="#8de4ff" /><circle cx="85" cy="63" r=".8" fill="#fff" /></>}
        {showProp && action === 'creative' && <><path d="M84 48v15" stroke="#fda4af" strokeWidth="3" /><path d="m81 48 3-6 3 6Z" fill="#fde68a" /></>}
        {showProp && action === 'music' && <><path d="M81 48v11q-8-3-6 3 6 4 9-2V51l7-2v7q-8-3-6 3 6 4 9-2V45Z" fill="#f9a8d4" /></>}
      </g>
    </svg>
  );
};

export const MascotCompanion: React.FC = () => {
  const {
    settings,
    activityTrackingEnabled,
    setActivityTrackingEnabled,
    setShowActivityHistory,
    openApp,
  } = useOS();
  const [config, setConfig] = useState<MascotCompanionConfig>(() => {
    const loaded = loadMascotCompanionConfig();
    return { ...loaded, ...clampPosition(loaded.x, loaded.y, loaded.size) };
  });
  const [menu, setMenu] = useState<MascotMenuPosition | null>(null);
  const [editingName, setEditingName] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const suppressClickRef = useRef(false);
  const selectedAction = MASCOT_ACTIONS.find(action => action.id === config.actionId) ?? MASCOT_ACTIONS[0];
  const selectedActionNumber = Number(selectedAction.id.split('-').pop()) || 1;
  const actionPose = config.paused || shouldReduceMotion
    ? { y: 0, rotate: 0 }
    : {
      y: ACTION_POSES[selectedAction.motion].y.map(value => value * (selectedActionNumber % 3 === 0 ? 0.72 : 1)),
      rotate: ACTION_POSES[selectedAction.motion].rotate.map(value => value * (selectedActionNumber % 2 === 0 ? -1 : 1)),
    };

  useEffect(() => {
    try {
      localStorage.setItem(MASCOT_COMPANION_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('[Mascot] Could not save companion preferences:', error);
    }
  }, [config]);

  useEffect(() => {
    const receiveSettingsUpdate = (event: Event) => {
      const patch = (event as CustomEvent<Partial<MascotCompanionConfig>>).detail;
      if (patch) setConfig(current => ({ ...current, ...patch }));
    };
    window.addEventListener(MASCOT_COMPANION_CHANGE_EVENT, receiveSettingsUpdate);
    return () => window.removeEventListener(MASCOT_COMPANION_CHANGE_EVENT, receiveSettingsUpdate);
  }, []);

  useEffect(() => {
    const keepOnScreen = () => {
      setConfig(current => ({
        ...current,
        ...clampPosition(current.x, current.y, current.size),
      }));
    };
    window.addEventListener('resize', keepOnScreen);
    return () => window.removeEventListener('resize', keepOnScreen);
  }, []);

  const updateConfig = useCallback((patch: Partial<MascotCompanionConfig>) => {
    setConfig(current => {
      const next = { ...current, ...patch };
      const position = clampPosition(next.x, next.y, next.size);
      return { ...next, ...position };
    });
  }, []);

  const notchWasEnabled = useRef(settings.jellyNotchEnabled);
  useEffect(() => {
    if (notchWasEnabled.current && !settings.jellyNotchEnabled) {
      updateConfig({ visible: true });
    }
    notchWasEnabled.current = settings.jellyNotchEnabled;
  }, [settings.jellyNotchEnabled, updateConfig]);

  const openMenuAt = useCallback((x: number, y: number) => {
    const menuWidth = 292;
    const menuHeight = Math.min(window.innerHeight * 0.82, 450);
    setMenu({
      x: Math.max(12, Math.min(window.innerWidth - menuWidth - 12, x)),
      y: Math.max(12, Math.min(window.innerHeight - menuHeight - 12, y)),
    });
  }, []);

  useEffect(() => {
    const openMenu = (event: Event) => {
      const detail = (event as CustomEvent<MascotMenuPosition>).detail;
      if (detail) openMenuAt(detail.x, detail.y);
    };
    const placeCompanion = (event: Event) => {
      const detail = (event as CustomEvent<MascotMenuPosition>).detail;
      if (!detail) return;
      const position = clampPosition(detail.x - config.size / 2, detail.y - config.size / 2, config.size);
      updateConfig({ ...position, visible: true });
      sound.playNotification();
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (menu && !menuRef.current?.contains(event.target as Node)) setMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null);
    };

    window.addEventListener(MENU_EVENT, openMenu);
    window.addEventListener(PLACE_EVENT, placeCompanion);
    window.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener(MENU_EVENT, openMenu);
      window.removeEventListener(PLACE_EVENT, placeCompanion);
      window.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [config.size, menu, openMenuAt, updateConfig]);

  const openAppearanceSettings = () => {
    setMenu(null);
    try {
      sessionStorage.setItem('arlo_focus_mascot_settings_v1', 'true');
    } catch (error) {
      console.warn('[Mascot] Could not queue the appearance settings destination:', error);
    }
    openApp('settings');
    window.setTimeout(() => window.dispatchEvent(new CustomEvent(SETTINGS_EVENT)), 80);
  };

  const openActivity = () => {
    setMenu(null);
    setShowActivityHistory(true);
    sound.playClick();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-mascot-control], input')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: config.x,
      originY: config.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const position = clampPosition(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY,
      config.size,
    );
    if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 4) {
      suppressClickRef.current = true;
    }
    setConfig(current => ({ ...current, ...position }));
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 100);
    }
  };

  return (
    <>
      <AnimatePresence>
        {config.visible && !settings.jellyNotchEnabled && (
          <motion.div
            key="arlo-mascot-companion"
            initial={{ opacity: 0, scale: 0.6, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 23 }}
            className="group fixed z-[9500] touch-none select-none"
            style={{ left: config.x, top: config.y, width: config.size, height: config.size * 1.58 }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onContextMenu={event => {
              event.preventDefault();
              event.stopPropagation();
              openMenuAt(event.clientX, event.clientY);
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ y: actionPose.y, rotate: actionPose.rotate }}
              transition={config.paused || shouldReduceMotion
                ? { duration: 0.2 }
                : { duration: (selectedAction.motion === 'relax' || selectedAction.motion === 'reading' ? 2.8 : 1.45) + selectedActionNumber * 0.08, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.button
                type="button"
                aria-label={`Open ${config.name}'s Activity History`}
                title={`${config.name} · ${selectedAction.label} · drag to move · right-click for options`}
                onClick={() => {
                  if (suppressClickRef.current) return;
                  openActivity();
                }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="absolute inset-x-0 top-0 z-[1] flex h-[62%] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
              >
                <MascotMark
                  className="aspect-square h-full w-auto max-w-full"
                  color={settings.mascotColor}
                  hairStyle={config.hair}
                  accessory={config.accessory}
                  showTileBackground={false}
                />
              </motion.button>
              <CompanionBody
                familyIndex={Math.floor(settings.mascotStyle / 10)}
                color={settings.mascotColor}
                outfit={config.outfit}
                action={selectedAction.motion}
                actionLabel={selectedAction.label}
              />
            </motion.div>
            <span className="absolute -bottom-4 left-1/2 max-w-full -translate-x-1/2 truncate rounded-full border border-white/10 bg-slate-950/70 px-2 py-0.5 text-[9px] font-semibold text-white/85 opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
              {config.name} · {selectedAction.label}
            </span>
            <button
              type="button"
              aria-label={`${config.name} mascot options`}
              data-mascot-control
              onPointerDown={event => event.stopPropagation()}
              onClick={event => {
                event.stopPropagation();
                openMenuAt(event.clientX || config.x, event.clientY || config.y);
              }}
              className="absolute -right-1 -top-1 z-[2] flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-slate-900/90 text-white/70 opacity-0 shadow-lg transition-all hover:rotate-90 hover:bg-slate-800 hover:text-white focus:opacity-100 group-hover:opacity-100"
            >
              <span className="text-sm leading-none">···</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 27 }}
            style={{ left: menu.x, top: menu.y }}
            className="fixed z-[13000] max-h-[82vh] w-[292px] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#101827]/95 p-2.5 text-slate-100 shadow-[0_20px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
            onContextMenu={event => event.preventDefault()}
          >
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-gradient-to-br from-sky-400/[0.09] to-indigo-400/[0.04] p-2.5">
              <MascotMark className="h-11 w-11 shrink-0" color={settings.mascotColor} />
              <div className="min-w-0 flex-1">
                {editingName ? (
                  <input
                    autoFocus
                    value={config.name}
                    maxLength={24}
                    aria-label="Mascot name"
                    onChange={event => updateConfig({ name: event.target.value })}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') setEditingName(false);
                      if (event.key === 'Escape') setEditingName(false);
                    }}
                    className="w-full rounded-md border border-sky-300/20 bg-black/20 px-2 py-1 text-xs font-semibold text-white outline-none focus:border-sky-300/45"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="group/name flex max-w-full items-center gap-1.5 text-left text-xs font-bold text-white"
                  >
                    <span className="truncate">{config.name || 'Arlo'}</span>
                    <Pencil className="h-3 w-3 shrink-0 text-slate-500 opacity-0 transition-opacity group-hover/name:opacity-100" />
                  </button>
                )}
                <p className="mt-1 text-[10px] text-slate-400">Your desktop companion</p>
              </div>
              <button type="button" aria-label="Close mascot options" onClick={() => setMenu(null)} className="self-start rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-2 space-y-1">
              <button type="button" onClick={openActivity} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold text-slate-200 transition-colors hover:bg-sky-400/[0.09] hover:text-white">
                <Activity className="h-4 w-4 text-sky-300" />
                Open Activity History
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={activityTrackingEnabled}
                onClick={() => {
                  setActivityTrackingEnabled(!activityTrackingEnabled);
                  sound.playToggle(!activityTrackingEnabled);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.055]"
              >
                <Activity className={`h-4 w-4 ${activityTrackingEnabled ? 'text-emerald-300' : 'text-slate-500'}`} />
                <span className="flex-1">Track ARLO OS activity</span>
                <span className={`relative h-5 w-9 rounded-full transition-colors ${activityTrackingEnabled ? 'bg-emerald-400/70' : 'bg-slate-600'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${activityTrackingEnabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </span>
              </button>
              <button type="button" onClick={openAppearanceSettings} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.055] hover:text-white">
                <Palette className="h-4 w-4 text-violet-300" />
                Mascot appearance settings
              </button>
              <button
                type="button"
                onClick={() => updateConfig({ paused: !config.paused })}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.055] hover:text-white"
              >
                {config.paused ? <Play className="h-4 w-4 text-emerald-300" /> : <Pause className="h-4 w-4 text-amber-300" />}
                {config.paused ? 'Resume action' : 'Pause action'}
              </button>
            </div>

            <div className="mt-2 rounded-xl border border-white/[0.07] bg-black/10 p-2.5">
              <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1.5"><Ruler className="h-3.5 w-3.5" /> Companion size</span>
                <span className="font-mono text-slate-300">{config.size}px</span>
              </div>
              <input
                type="range"
                min="72"
                max="180"
                step="4"
                value={config.size}
                aria-label="Mascot companion size"
                onChange={event => updateConfig({ size: Number(event.target.value) })}
                className="w-full accent-sky-400"
              />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  updateConfig({ visible: !config.visible });
                  setMenu(null);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 py-2 text-[10px] font-semibold text-slate-300 transition hover:border-sky-300/25 hover:bg-sky-400/[0.07] hover:text-white"
              >
                {config.visible ? <X className="h-3.5 w-3.5" /> : <Move className="h-3.5 w-3.5" />}
                {config.visible ? 'Hide companion' : 'Show on desktop'}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateConfig({ visible: false });
                  setMenu(null);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 py-2 text-[10px] font-semibold text-slate-400 transition hover:border-rose-300/20 hover:bg-rose-400/[0.07] hover:text-rose-200"
              >
                <Power className="h-3.5 w-3.5" />
                Put away
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
