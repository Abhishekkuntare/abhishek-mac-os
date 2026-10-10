// import React, { useEffect, useMemo, useState } from 'react';
// import { AnimatePresence, motion } from 'motion/react';
// import {
//   ArrowRight,
//   ArrowUpRight,
//   Bot,
//   Check,
//   ChevronRight,
//   Command,
//   Search,
//   ShieldCheck,
//   Sparkles,
//   WandSparkles,
// } from 'lucide-react';
// import { useOS } from '../../context/OSContext';
// import { APP_REGISTRY } from '../../data/defaultApps';
// import { sound } from '../../services/soundService';
// import { AppIcon } from '../system/AppIcon';
// import { DetectiveAvatar } from '../system/DetectiveAvatar';
// import {
//   DETECTIVES,
//   DETECTIVE_CONFIG_UPDATED_EVENT,
//   getDetective,
//   loadDetectiveConfig,
//   saveDetectiveConfig,
//   type DetectiveConfig,
// } from '../system/detectiveModel';
// import { GhostActivityFeed } from '../system/GhostActivityFeed';

// const QUICK_APPS = [
//   'activitymonitor',
//   'appstore',
//   'browser',
//   'calendar',
//   'camera',
//   'codestudio',
//   'finder',
//   'photos',
//   'settings',
//   'terminal',
// ];

// export const GhostDetectivesApp: React.FC = () => {
//   const { openApp } = useOS();
//   const [detectiveConfig, setDetectiveConfig] = useState<DetectiveConfig>(loadDetectiveConfig);
//   const [search, setSearch] = useState('');

//   useEffect(() => {
//     const syncConfig = (event: Event) => {
//       const nextConfig = (event as CustomEvent<DetectiveConfig>).detail;
//       setDetectiveConfig(nextConfig ?? loadDetectiveConfig());
//     };
//     window.addEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, syncConfig);
//     return () => window.removeEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, syncConfig);
//   }, []);

//   const detectives = useMemo(() => [
//     ...DETECTIVES.map(detective => ({
//       ...detective,
//       avatarId: detective.id,
//       color: detectiveConfig.colors[detective.id],
//     })),
//     ...detectiveConfig.customDetectives.map(profile => {
//       const avatar = DETECTIVES.find(detective => detective.id === profile.avatarId) ?? DETECTIVES[0];
//       return {
//         ...avatar,
//         id: profile.id,
//         name: profile.name,
//         role: 'Custom detective',
//         description: profile.description || 'A detective configured for your workflow.',
//         skills: profile.permittedTools,
//         avatarId: avatar.id,
//         color: detectiveConfig.colors[avatar.id],
//       };
//     }),
//   ], [detectiveConfig]);

//   const selectedDetective = detectives.find(detective => detective.id === detectiveConfig.selectedId) ?? detectives[0];
//   const visibleDetectives = detectives.filter(detective =>
//     `${detective.name} ${detective.role} ${detective.description} ${detective.skills.join(' ')}`
//       .toLocaleLowerCase()
//       .includes(search.trim().toLocaleLowerCase()),
//   );

//   const selectDetective = (id: string) => {
//     if (id === detectiveConfig.selectedId) return;
//     const nextConfig = { ...detectiveConfig, selectedId: id };
//     setDetectiveConfig(nextConfig);
//     saveDetectiveConfig(nextConfig);
//     sound.playClick();
//   };

//   const openGhostAI = () => {
//     sound.playClick();
//     openApp('ghostai');
//   };

//   return (
//     <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#080d17] text-slate-100">
//       <div className="pointer-events-none absolute inset-0 overflow-hidden">
//         <motion.div
//           animate={{ x: [0, 35, -15, 0], y: [0, -20, 20, 0], scale: [1, 1.1, 0.96, 1] }}
//           transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
//           className="absolute -left-36 -top-48 h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[120px]"
//         />
//         <motion.div
//           animate={{ x: [0, -28, 20, 0], y: [0, 24, -14, 0] }}
//           transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
//           className="absolute -right-40 top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]"
//         />
//         <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:38px_38px]" />
//       </div>

//       <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.07] bg-[#0a1220]/75 px-6 py-4 backdrop-blur-2xl">
//         <div className="flex min-w-0 items-center gap-3">
//           <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[15px] border border-white/15 bg-[#11131b] shadow-[0_0_30px_rgba(139,92,246,.18)]">
//             <AppIcon appId="ghostdetectives" className="h-full w-full object-cover" />
//           </div>
//           <div className="min-w-0">
//             <div className="flex items-center gap-2">
//               <h1 className="truncate text-base font-bold tracking-tight">Ghost Detectives</h1>
//               <span className="hidden rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.16em] text-violet-200 sm:inline-flex">
//                 ARLO team
//               </span>
//             </div>
//             <p className="mt-0.5 truncate text-[11px] text-slate-400">A specialist for every desktop mystery.</p>
//           </div>
//         </div>
//         <motion.button
//           type="button"
//           whileHover={{ y: -1, scale: 1.02 }}
//           whileTap={{ scale: 0.97 }}
//           onClick={openGhostAI}
//           className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-300/20 bg-gradient-to-r from-violet-500/20 to-indigo-500/15 px-3.5 py-2.5 text-xs font-semibold text-violet-100 shadow-[0_8px_28px_rgba(109,40,217,.12)] transition hover:border-violet-200/40 hover:from-violet-500/30 hover:to-indigo-500/25"
//         >
//           Open Ghost AI <ArrowUpRight className="h-3.5 w-3.5" />
//         </motion.button>
//       </header>

//       <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
//         <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 py-6 md:px-7">
//           <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-gradient-to-br from-[#161c31]/90 via-[#111a2a]/85 to-[#101321]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] md:p-7">
//             <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[70px]" />
//             <div className="relative grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
//               <div className="max-w-2xl">
//                 <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.17em] text-emerald-200">
//                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.7)]" />
//                   Your desktop, your call
//                 </div>
//                 <h2 className="text-2xl font-semibold tracking-tight text-white md:text-[32px]">
//                   Meet the team behind the mission.
//                 </h2>
//                 <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
//                   Pick a detective whose strengths fit the task. Your choice syncs with Ghost AI, and you stay in control of which apps open.
//                 </p>
//                 <div className="mt-5 flex flex-wrap gap-2">
//                   <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/15 px-2.5 py-1.5 text-[10px] text-slate-300">
//                     <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> You choose every action
//                   </span>
//                   <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/15 px-2.5 py-1.5 text-[10px] text-slate-300">
//                     <Command className="h-3.5 w-3.5 text-violet-300" /> Works with Ghost AI
//                   </span>
//                 </div>
//               </div>

//               <AnimatePresence mode="wait">
//                 <motion.div
//                   key={selectedDetective.id}
//                   initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                   animate={{ opacity: 1, y: 0, scale: 1 }}
//                   exit={{ opacity: 0, y: -8, scale: 0.96 }}
//                   transition={{ duration: 0.24 }}
//                   className="mx-auto flex w-full max-w-[250px] items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3.5 shadow-xl md:mx-0"
//                 >
//                   <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
//                     <div className="absolute inset-1 rounded-xl opacity-25 blur-xl" style={{ backgroundColor: selectedDetective.color }} />
//                     <DetectiveAvatar
//                       shape={selectedDetective.shape}
//                       color={selectedDetective.color}
//                       detectiveId={selectedDetective.avatarId}
//                       scoutColor={detectiveConfig.scoutColor}
//                       emberColor={detectiveConfig.emberColor}
//                       mintColor={detectiveConfig.mintColor}
//                       rubyColor={detectiveConfig.rubyColor}
//                       petalColor={detectiveConfig.petalColor}
//                       violetColor={detectiveConfig.violetColor}
//                       sunnyColor={detectiveConfig.sunnyColor}
//                       mochaColor={detectiveConfig.mochaColor}
//                       className="relative h-[62px] w-[62px] drop-shadow-[0_10px_15px_rgba(0,0,0,.35)]"
//                     />
//                   </div>
//                   <div className="min-w-0">
//                     <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-slate-500">On the case</p>
//                     <h3 className="mt-1 truncate text-base font-semibold text-white">{selectedDetective.name}</h3>
//                     <p className="mt-0.5 truncate text-[11px]" style={{ color: selectedDetective.color }}>{selectedDetective.role}</p>
//                     <button type="button" onClick={openGhostAI} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 transition hover:text-white">
//                       Start a chat <ArrowRight className="h-3 w-3" />
//                     </button>
//                   </div>
//                 </motion.div>
//               </AnimatePresence>
//             </div>
//           </section>

//           <section aria-labelledby="detective-team-heading">
//             <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
//               <div>
//                 <div className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-violet-200">
//                   <Bot className="h-3.5 w-3.5" /> Choose your partner
//                 </div>
//                 <h2 id="detective-team-heading" className="text-lg font-semibold text-white">The detective team</h2>
//                 <p className="mt-1 text-xs text-slate-500">Select one to make them your active Ghost AI specialist.</p>
//               </div>
//               <label className="group relative block w-full sm:w-[260px]">
//                 <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-violet-300" />
//                 <input
//                   type="search"
//                   value={search}
//                   onChange={event => setSearch(event.target.value)}
//                   placeholder="Find a detective or skill"
//                   className="h-10 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/35 focus:bg-white/[0.055] focus:ring-4 focus:ring-violet-500/[0.08]"
//                 />
//               </label>
//             </div>

//             {visibleDetectives.length > 0 ? (
//               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
//                 {visibleDetectives.map((detective, index) => {
//                   const selected = detective.id === selectedDetective.id;
//                   return (
//                     <motion.button
//                       key={detective.id}
//                       type="button"
//                       initial={{ opacity: 0, y: 12 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: Math.min(index * 0.035, 0.2) }}
//                       whileHover={{ y: -4, scale: 1.012 }}
//                       whileTap={{ scale: 0.985 }}
//                       aria-pressed={selected}
//                       onClick={() => selectDetective(detective.id)}
//                       className={`group relative min-h-[176px] overflow-hidden rounded-2xl border p-4 text-left transition duration-200 ${
//                         selected
//                           ? 'border-violet-300/35 bg-violet-400/[0.075] shadow-[0_12px_35px_rgba(109,40,217,.12)]'
//                           : 'border-white/[0.075] bg-[#101725]/80 hover:border-white/15 hover:bg-[#141d2c]'
//                       }`}
//                     >
//                       <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20" style={{ backgroundColor: detective.color }} />
//                       <div className="relative flex items-start justify-between gap-2">
//                         <div className="flex min-w-0 items-center gap-3">
//                           <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 transition duration-300 group-hover:scale-105 group-hover:border-white/15">
//                             <DetectiveAvatar
//                               shape={detective.shape}
//                               color={detective.color}
//                               detectiveId={detective.avatarId}
//                               scoutColor={detectiveConfig.scoutColor}
//                               emberColor={detectiveConfig.emberColor}
//                               mintColor={detectiveConfig.mintColor}
//                               rubyColor={detectiveConfig.rubyColor}
//                               petalColor={detectiveConfig.petalColor}
//                               violetColor={detectiveConfig.violetColor}
//                               sunnyColor={detectiveConfig.sunnyColor}
//                               mochaColor={detectiveConfig.mochaColor}
//                               className="h-10 w-10"
//                             />
//                           </div>
//                           <div className="min-w-0">
//                             <h3 className="truncate text-sm font-semibold text-white">{detective.name}</h3>
//                             <p className="mt-0.5 truncate text-[10px]" style={{ color: detective.color }}>{detective.role}</p>
//                           </div>
//                         </div>
//                         <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
//                           selected
//                             ? 'border-violet-200/50 bg-violet-300 text-[#151021]'
//                             : 'border-white/10 text-transparent group-hover:border-white/25'
//                         }`}>
//                           <Check className="h-3 w-3" />
//                         </span>
//                       </div>
//                       <p className="relative mt-3 line-clamp-2 text-[11px] leading-5 text-slate-400">{detective.description}</p>
//                       <div className="relative mt-3 flex flex-wrap gap-1.5">
//                         {detective.skills.slice(0, 3).map(skill => (
//                           <span key={skill} className="rounded-md border border-white/[0.07] bg-black/15 px-1.5 py-1 text-[9px] text-slate-400">{skill.replaceAll('_', ' ')}</span>
//                         ))}
//                       </div>
//                     </motion.button>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-10 text-center">
//                 <Search className="mx-auto h-5 w-5 text-slate-500" />
//                 <p className="mt-2 text-sm font-medium text-slate-300">No detectives match that search.</p>
//                 <button type="button" onClick={() => setSearch('')} className="mt-2 text-xs font-medium text-violet-200 hover:text-white">Clear search</button>
//               </div>
//             )}
//           </section>

//           <section className="rounded-2xl border border-white/[0.075] bg-[#0d1420]/80 p-4 md:p-5">
//             <div className="mb-3 flex items-center justify-between gap-3">
//               <div>
//                 <div className="flex items-center gap-2">
//                   <WandSparkles className="h-4 w-4 text-cyan-200" />
//                   <h2 className="text-sm font-semibold text-white">Quick launch</h2>
//                 </div>
//                 <p className="mt-1 text-[10px] text-slate-500">Open an app yourself or ask your detective for help in Ghost AI.</p>
//               </div>
//               <button type="button" onClick={openGhostAI} className="hidden items-center gap-1 text-[10px] font-semibold text-violet-200 transition hover:text-white sm:inline-flex">
//                 Ask {selectedDetective.name} <ChevronRight className="h-3 w-3" />
//               </button>
//             </div>
//             <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
//               {QUICK_APPS.filter(id => APP_REGISTRY[id]?.installed).map(id => {
//                 const app = APP_REGISTRY[id];
//                 return (
//                   <motion.button
//                     key={id}
//                     type="button"
//                     whileHover={{ y: -2, scale: 1.025 }}
//                     whileTap={{ scale: 0.97 }}
//                     onClick={() => {
//                       sound.playClick();
//                       openApp(id);
//                     }}
//                     className="group flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
//                   >
//                     <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg border border-white/10" style={{ background: app.iconBg }}>
//                       <AppIcon appId={id} className="h-full w-full object-cover" fallback={<Sparkles className="h-3.5 w-3.5" style={{ color: app.iconColor }} />} />
//                     </span>
//                     <span className="whitespace-nowrap text-[10px] font-medium text-slate-300 transition group-hover:text-white">{app.name}</span>
//                     <ArrowUpRight className="h-3 w-3 text-slate-600 transition group-hover:text-slate-300" />
//                   </motion.button>
//                 );
//               })}
//               <motion.button
//                 type="button"
//                 whileHover={{ y: -2, scale: 1.025 }}
//                 whileTap={{ scale: 0.97 }}
//                 onClick={openGhostAI}
//                 className="group flex shrink-0 items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/[0.06] px-3 py-2.5 text-left transition hover:border-violet-200/35 hover:bg-violet-400/[0.12]"
//               >
//                 <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200/15 bg-violet-300/10 text-violet-200"><Sparkles className="h-4 w-4" /></span>
//                 <span className="whitespace-nowrap text-[10px] font-semibold text-violet-100">Ghost AI</span>
//                 <ArrowUpRight className="h-3 w-3 text-violet-200/60 transition group-hover:text-violet-100" />
//               </motion.button>
//             </div>
//           </section>

//           <GhostActivityFeed />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default GhostDetectivesApp;


import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Bot, CalendarDays, Check, CheckCircle2,
  Circle, Clipboard, Command, FileSearch, Focus, Globe2,
  Keyboard, ListTodo, MoreHorizontal, Pause, Play, Plus, Search, Settings2,
  ShieldCheck, Sparkles, Square, Trash2, WandSparkles, X, Zap,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { sound } from '../../services/soundService';
import { AppIcon } from '../system/AppIcon';
import { DetectiveAvatar } from '../system/DetectiveAvatar';
import {
  DETECTIVES, DETECTIVE_CONFIG_UPDATED_EVENT, loadDetectiveConfig,
  saveDetectiveConfig, type DetectiveConfig,
} from '../system/detectiveModel';
import { GhostActivityFeed } from '../system/GhostActivityFeed';

const QUICK_APPS = ['activitymonitor','appstore','browser','calendar','camera','codestudio','finder','photos','settings','terminal'];
const STORE_KEY = 'arlo.ghost-detectives.workspace.v1';
type Priority = 'Low' | 'Normal' | 'High';
type Task = { id: string; title: string; done: boolean; priority: Priority; due: string; createdAt: number };
type Routine = { id: string; name: string; description: string; steps: string[] };
type Clip = { id: string; text: string; createdAt: number };
type Workspace = { tasks: Task[]; routines: Routine[]; clipboardEnabled: boolean; clips: Clip[]; focusMinutes: number; focusSessions: number; completedSessions: number };
const DEFAULT_ROUTINES: Routine[] = [
  { id: 'start-work', name: 'Start Work', description: 'Set up a focused work session', steps: ['Review today’s priorities', 'Open your preferred work apps', 'Start a focus session'] },
  { id: 'study-mode', name: 'Study Mode', description: 'Prepare a distraction-light study block', steps: ['Choose one study goal', 'Open notes or study material', 'Start a 25-minute focus session'] },
  { id: 'developer-mode', name: 'Developer Mode', description: 'Get your development workspace ready', steps: ['Open Code Studio', 'Open Terminal', 'Review current project tasks'] },
  { id: 'end-day', name: 'End My Day', description: 'Wrap up and plan tomorrow', steps: ['Review completed tasks', 'Capture unfinished work', 'Prepare tomorrow’s top priority'] },
];
const initialWorkspace = (): Workspace => ({ tasks: [], routines: DEFAULT_ROUTINES, clipboardEnabled: false, clips: [], focusMinutes: 25, focusSessions: 0, completedSessions: 0 });
const readWorkspace = (): Workspace => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return initialWorkspace();
    const parsed = JSON.parse(raw) as Partial<Workspace>;
    return { ...initialWorkspace(), ...parsed, routines: Array.isArray(parsed.routines) ? parsed.routines : DEFAULT_ROUTINES, tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [], clips: Array.isArray(parsed.clips) ? parsed.clips : [] };
  } catch { return initialWorkspace(); }
};
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export const GhostDetectivesApp: React.FC = () => {
  const { openApp } = useOS();
  const [detectiveConfig, setDetectiveConfig] = useState<DetectiveConfig>(loadDetectiveConfig);
  const [workspace, setWorkspace] = useState<Workspace>(readWorkspace);
  const [search, setSearch] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('Normal');
  const [taskDue, setTaskDue] = useState(dateKey());
  const [activeTab, setActiveTab] = useState<'overview'|'planner'|'focus'|'routines'|'tools'>('overview');
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [focusRunning, setFocusRunning] = useState(false);
  const [focusRemaining, setFocusRemaining] = useState(25 * 60);
  const [focusDuration, setFocusDuration] = useState(25);
  const [focusLabel, setFocusLabel] = useState('Deep work');
  const [toast, setToast] = useState('');
  const [writingInput, setWritingInput] = useState('');
  const [writingOutput, setWritingOutput] = useState('');
  const [writingTone, setWritingTone] = useState('Professional');
  const [clipboardSearch, setClipboardSearch] = useState('');
  const [routineOpen, setRoutineOpen] = useState<string | null>(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineSteps, setNewRoutineSteps] = useState('Review priorities,Open my work apps,Start a focus timer');
  const [fileSummary, setFileSummary] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncConfig = (event: Event) => setDetectiveConfig((event as CustomEvent<DetectiveConfig>).detail ?? loadDetectiveConfig());
    window.addEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, syncConfig);
    return () => window.removeEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, syncConfig);
  }, []);
  useEffect(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(workspace)); } catch { /* storage can be disabled */ } }, [workspace]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => setFocusRemaining(value => {
      if (value <= 1) {
        window.clearInterval(id);
        setFocusRunning(false);
        setWorkspace(current => ({ ...current, completedSessions: current.completedSessions + 1 }));
        setToast('Focus session complete. Take a short break.');
        try { new Notification('ARLO OS · Focus complete', { body: 'Great work. Your focus session is complete.' }); } catch { /* notifications require permission */ }
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [focusRunning]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') { event.preventDefault(); setCommandOpen(true); }
      if (event.key === 'Escape') { setCommandOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (commandOpen) window.setTimeout(() => commandInputRef.current?.focus(), 40); }, [commandOpen]);

  const detectives = useMemo(() => [
    ...DETECTIVES.map(d => ({ ...d, avatarId: d.id, color: detectiveConfig.colors[d.id] })),
    ...detectiveConfig.customDetectives.map(profile => {
      const avatar = DETECTIVES.find(d => d.id === profile.avatarId) ?? DETECTIVES[0];
      return { ...avatar, id: profile.id, name: profile.name, role: 'Custom detective', description: profile.description || 'A detective configured for your workflow.', skills: profile.permittedTools, avatarId: avatar.id, color: detectiveConfig.colors[avatar.id] };
    }),
  ], [detectiveConfig]);
  const selectedDetective = detectives.find(d => d.id === detectiveConfig.selectedId) ?? detectives[0];
  const visibleDetectives = detectives.filter(d => `${d.name} ${d.role} ${d.description} ${d.skills.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()));
  const pendingTasks = workspace.tasks.filter(task => !task.done);
  const todayTasks = pendingTasks.filter(task => !task.due || task.due === dateKey());
  const completedToday = workspace.tasks.filter(task => task.done).length;
  const filteredTasks = workspace.tasks.filter(task => `${task.title} ${task.priority}`.toLowerCase().includes(search.toLowerCase()));
  const openGhostAI = () => { sound.playClick(); openApp('ghostai'); };
  const notify = (message: string) => { setToast(message); sound.playClick(); };
  const selectDetective = (id: string) => {
    if (id === detectiveConfig.selectedId) return;
    const next = { ...detectiveConfig, selectedId: id };
    setDetectiveConfig(next); saveDetectiveConfig(next); sound.playClick();
  };
  const addTask = (event?: React.FormEvent) => {
    event?.preventDefault();
    const title = taskInput.trim();
    if (!title) return;
    const parsed = title.match(/^(?:remind me to|add task|todo)\s+/i) ? title.replace(/^(?:remind me to|add task|todo)\s+/i, '') : title;
    setWorkspace(current => ({ ...current, tasks: [{ id: uid(), title: parsed, done: false, priority: taskPriority, due: taskDue, createdAt: Date.now() }, ...current.tasks] }));
    setTaskInput(''); notify('Task added to your planner');
  };
  const toggleTask = (id: string) => setWorkspace(current => ({ ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, done: !task.done } : task) }));
  const deleteTask = (id: string) => setWorkspace(current => ({ ...current, tasks: current.tasks.filter(task => task.id !== id) }));
  const launchApp = (id: string) => {
    if (APP_REGISTRY[id]?.installed) { openApp(id); notify(`${APP_REGISTRY[id].name} opened`); }
    else notify('This app is not available in the current app registry');
  };
  const runCommand = (raw: string) => {
    const q = raw.trim().toLowerCase(); if (!q) return;
    const appMatch = QUICK_APPS.find(id => q.includes((APP_REGISTRY[id]?.name ?? id).toLowerCase()) || q.includes(id));
    if (appMatch && (q.startsWith('open ') || q.startsWith('launch ') || q.startsWith('go to '))) { launchApp(appMatch); setCommandOpen(false); setCommandQuery(''); return; }
    if (q.includes('focus') || q.includes('pomodoro')) { setActiveTab('focus'); setCommandOpen(false); setFocusRunning(true); notify('Focus session started'); return; }
    if (q.includes('task') || q.includes('remind')) { setActiveTab('planner'); setCommandOpen(false); setTaskInput(raw.replace(/^(?:add task|remind me to)\s*/i, '')); return; }
    if (q.includes('detective') || q.includes('ghost ai') || q.includes('ask ghost')) { setCommandOpen(false); openGhostAI(); return; }
    setCommandOpen(false); openGhostAI();
  };
  const startFocus = () => { setFocusRemaining(focusDuration * 60); setWorkspace(current => ({ ...current, focusMinutes: focusDuration, focusSessions: current.focusSessions + 1 })); setFocusRunning(true); notify(`${focusDuration}-minute focus session started`); };
  const pauseFocus = () => setFocusRunning(false);
  const resetFocus = () => { setFocusRunning(false); setFocusRemaining(focusDuration * 60); };
  const saveClip = async () => {
    if (!workspace.clipboardEnabled) { notify('Enable clipboard history first'); return; }
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { notify('Clipboard is empty'); return; }
      setWorkspace(current => ({ ...current, clips: [{ id: uid(), text: text.slice(0, 3000), createdAt: Date.now() }, ...current.clips].slice(0, 30) }));
      notify('Clipboard snippet saved');
    } catch { notify('Clipboard access was denied by the system'); }
  };
  const readFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name); setFileSummary('');
    if (file.size > 2 * 1024 * 1024) { setFileSummary('This local preview is limited to files under 2 MB. Choose a smaller file.'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['txt','md','json','js','jsx','ts','tsx','css','html','csv','log','py'].includes(ext || '')) {
      const text = await file.text(); setFileSummary(text.slice(0, 12000));
    } else {
      setFileSummary('This file type needs a document parser or configured AI service. The file has not been uploaded. You can open Ghost AI to analyze it with a supported integration.');
    }
  };
  const addRoutine = (event: React.FormEvent) => {
    event.preventDefault(); if (!newRoutineName.trim()) return;
    const routine = { id: uid(), name: newRoutineName.trim(), description: 'Your custom daily workflow', steps: newRoutineSteps.split(',').map(s => s.trim()).filter(Boolean) };
    setWorkspace(current => ({ ...current, routines: [...current.routines, routine] })); setNewRoutineName(''); notify('Routine created');
  };
  const executeRoutine = (routine: Routine) => {
    setRoutineOpen(routine.id);
    if (routine.id === 'developer-mode') { launchApp('codestudio'); launchApp('terminal'); }
    else if (routine.id === 'study-mode') launchApp('browser');
    else if (routine.id === 'start-work') launchApp('calendar');
    else if (routine.id === 'end-day') setActiveTab('planner');
    notify(`Started routine: ${routine.name}`);
  };
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Sparkles },
    { id: 'planner' as const, label: 'Daily planner', icon: ListTodo, count: pendingTasks.length },
    { id: 'focus' as const, label: 'Focus', icon: Focus },
    { id: 'routines' as const, label: 'Routines', icon: Zap },
    { id: 'tools' as const, label: 'Everyday tools', icon: WandSparkles },
  ];

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#080d17] text-slate-100 selection:bg-violet-400/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div animate={{ x: [0, 35, -15, 0], y: [0, -20, 20, 0], scale: [1, 1.1, .96, 1] }} transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-36 -top-48 h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[120px]" />
        <motion.div animate={{ x: [0, -28, 20, 0], y: [0, 24, -14, 0] }} transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }} className="absolute -right-40 top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:38px_38px]" />
      </div>
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0a1220]/75 px-4 py-3 backdrop-blur-2xl md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border border-white/15 bg-[#11131b] shadow-[0_0_30px_rgba(139,92,246,.18)]"><AppIcon appId="ghostdetectives" className="h-full w-full object-cover" /></div>
          <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-sm font-bold tracking-tight md:text-base">Ghost Detectives</h1><span className="hidden rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.16em] text-violet-200 sm:inline-flex">ARLO intelligence</span></div><p className="mt-0.5 truncate text-[10px] text-slate-400">Your everyday AI workspace · {selectedDetective.name} is on the case</p></div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: .97 }} onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-slate-300 transition hover:border-violet-300/30 hover:bg-white/[0.07] sm:flex"><Search className="h-3.5 w-3.5" /> Quick command <kbd className="rounded border border-white/10 px-1 text-[9px] text-slate-500">Ctrl Space</kbd></motion.button>
          <motion.button whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: .97 }} onClick={openGhostAI} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-violet-300/20 bg-gradient-to-r from-violet-500/20 to-indigo-500/15 px-3 py-2.5 text-[11px] font-semibold text-violet-100 shadow-[0_8px_28px_rgba(109,40,217,.12)] transition hover:border-violet-200/40 hover:from-violet-500/30 hover:to-indigo-500/25">Open Ghost AI <ArrowUpRight className="h-3.5 w-3.5" /></motion.button>
        </div>
      </header>
      <nav className="relative z-10 flex shrink-0 gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0a1220]/55 px-3 py-2 backdrop-blur-xl md:px-6 scrollbar-none">
        {tabs.map(tab => { const Icon = tab.icon; return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-medium transition-all duration-200 ${activeTab === tab.id ? 'bg-violet-400/[0.12] text-violet-100' : 'text-slate-500 hover:bg-white/[0.045] hover:text-slate-200'}`}><Icon className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 ${activeTab === tab.id ? 'text-violet-200' : ''}`} />{tab.label}{tab.count ? <span className="rounded-full bg-violet-300/15 px-1.5 py-0.5 text-[9px] text-violet-100">{tab.count}</span> : null}{activeTab === tab.id && <motion.span layoutId="ghost-tab-indicator" className="absolute inset-x-3 -bottom-2 h-[2px] rounded-full bg-violet-300" />}</button>; })}
      </nav>
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 md:gap-6 md:px-7 md:py-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .2 }} className="flex flex-col gap-5 md:gap-6">
              <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-gradient-to-br from-[#161c31]/95 via-[#111a2a]/90 to-[#101321]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] md:p-7">
                <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[70px]" /><div className="pointer-events-none absolute bottom-[-100px] right-[20%] h-48 w-48 rounded-full bg-cyan-500/[0.07] blur-[70px]" />
                <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.17em] text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.7)]" />Your desktop, your call</div><h2 className="text-2xl font-semibold tracking-tight text-white md:text-[34px]">{greeting()}. Ready to make progress?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Your day, your tasks, your detectives. Turn everyday intentions into focused action — without losing control of your desktop.</p>
                    <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setActiveTab('planner')} className="group inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-[#151021] shadow-lg shadow-violet-950/20 transition hover:-translate-y-0.5 hover:bg-violet-200"><Plus className="h-4 w-4 transition-transform group-hover:rotate-90" /> Add a task <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></button><button onClick={() => { setActiveTab('focus'); if (!focusRunning) startFocus(); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-white/[0.08]"><Focus className="h-4 w-4 text-cyan-200" /> Start focus</button></div>
                    <div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/15 px-2.5 py-1.5 text-[10px] text-slate-300"><ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> You approve sensitive actions</span><span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/15 px-2.5 py-1.5 text-[10px] text-slate-300"><Command className="h-3.5 w-3.5 text-violet-300" /> Ctrl + Space command bar</span></div>
                  </div>
                  <AnimatePresence mode="wait"><motion.div key={selectedDetective.id} initial={{ opacity: 0, y: 10, scale: .95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .96 }} transition={{ duration: .24 }} className="mx-auto flex w-full max-w-[270px] items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3.5 shadow-xl lg:mx-0"><div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"><div className="absolute inset-1 rounded-xl opacity-25 blur-xl" style={{ backgroundColor: selectedDetective.color }} /><DetectiveAvatar shape={selectedDetective.shape} color={selectedDetective.color} detectiveId={selectedDetective.avatarId} scoutColor={detectiveConfig.scoutColor} emberColor={detectiveConfig.emberColor} mintColor={detectiveConfig.mintColor} rubyColor={detectiveConfig.rubyColor} petalColor={detectiveConfig.petalColor} violetColor={detectiveConfig.violetColor} sunnyColor={detectiveConfig.sunnyColor} mochaColor={detectiveConfig.mochaColor} className="relative h-[62px] w-[62px] drop-shadow-[0_10px_15px_rgba(0,0,0,.35)]" /></div><div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-slate-500">On the case</p><h3 className="mt-1 truncate text-base font-semibold text-white">{selectedDetective.name}</h3><p className="mt-0.5 truncate text-[11px]" style={{ color: selectedDetective.color }}>{selectedDetective.role}</p><button type="button" onClick={openGhostAI} className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 transition hover:text-white">Start a chat <ArrowRight className="h-3 w-3" /></button></div></motion.div></AnimatePresence>
                </div>
              </section>
              <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[{ label: 'Open tasks', value: pendingTasks.length, detail: `${todayTasks.length} due today`, icon: ListTodo, color: 'text-violet-200', glow: 'bg-violet-400/10' }, { label: 'Completed', value: completedToday, detail: 'Tasks marked done', icon: CheckCircle2, color: 'text-emerald-200', glow: 'bg-emerald-400/10' }, { label: 'Focus sessions', value: workspace.focusSessions, detail: `${workspace.completedSessions} completed`, icon: Focus, color: 'text-cyan-200', glow: 'bg-cyan-400/10' }, { label: 'Active detective', value: selectedDetective.name, detail: selectedDetective.role, icon: Bot, color: 'text-amber-200', glow: 'bg-amber-400/10' }].map((item, i) => { const Icon = item.icon; return <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .045 }} whileHover={{ y: -3 }} className="group relative overflow-hidden rounded-2xl border border-white/[0.075] bg-[#101725]/80 p-4 transition-colors duration-300 hover:border-white/15 hover:bg-[#141d2c]"><div className={`absolute -right-5 -top-5 h-20 w-20 rounded-full ${item.glow} opacity-70 blur-2xl transition group-hover:scale-150`} /><div className="relative flex items-start justify-between gap-2"><div><p className="text-[10px] text-slate-500">{item.label}</p><p className="mt-2 truncate text-2xl font-semibold tracking-tight text-white">{item.value}</p><p className="mt-1 truncate text-[10px] text-slate-500">{item.detail}</p></div><span className={`rounded-xl border border-white/[0.07] bg-black/20 p-2 ${item.color}`}><Icon className="h-4 w-4" /></span></div></motion.div>; })}
              </section>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
                <section className="rounded-2xl border border-white/[0.075] bg-[#0d1420]/80 p-4 md:p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-cyan-200" /><h2 className="text-sm font-semibold text-white">Today at a glance</h2></div><p className="mt-1 text-[10px] text-slate-500">Your next steps, without the noise.</p></div><button onClick={() => setActiveTab('planner')} className="text-[10px] font-semibold text-violet-200 transition hover:text-white">View planner →</button></div>{todayTasks.length ? <div className="space-y-2">{todayTasks.slice(0, 5).map(task => <div key={task.id} className="group flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.045]"><button onClick={() => toggleTask(task.id)} aria-label={task.done ? 'Mark task incomplete' : 'Complete task'} className="text-slate-500 transition hover:scale-110 hover:text-emerald-200">{task.done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Circle className="h-4 w-4" />}</button><span className={`min-w-0 flex-1 truncate text-xs ${task.done ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{task.title}</span><span className={`rounded-md px-1.5 py-1 text-[9px] ${task.priority === 'High' ? 'bg-rose-400/10 text-rose-200' : task.priority === 'Low' ? 'bg-slate-400/10 text-slate-400' : 'bg-cyan-400/10 text-cyan-200'}`}>{task.priority}</span></div>)}</div> : <div className="rounded-xl border border-dashed border-white/10 px-4 py-7 text-center"><ListTodo className="mx-auto h-5 w-5 text-slate-600" /><p className="mt-2 text-xs font-medium text-slate-300">A clear runway.</p><p className="mt-1 text-[10px] text-slate-500">Add a task to make your day intentional.</p><button onClick={() => setActiveTab('planner')} className="mt-3 rounded-lg border border-violet-300/20 bg-violet-300/[0.08] px-3 py-2 text-[10px] font-semibold text-violet-100 transition hover:bg-violet-300/[0.14]">Create first task</button></div>}</section>
                <section className="rounded-2xl border border-white/[0.075] bg-[#0d1420]/80 p-4 md:p-5"><div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-200" /><h2 className="text-sm font-semibold text-white">Quick launch</h2></div><p className="mt-1 text-[10px] text-slate-500">Your tools, one click away.</p></div><button onClick={() => setCommandOpen(true)} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"><Command className="h-4 w-4" /></button></div><div className="grid grid-cols-2 gap-2">{QUICK_APPS.filter(id => APP_REGISTRY[id]?.installed).slice(0, 6).map(id => { const app = APP_REGISTRY[id]; return <motion.button key={id} whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: .98 }} onClick={() => launchApp(id)} className="group flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-2.5 py-2.5 text-left transition hover:border-white/15 hover:bg-white/[0.06]"><span className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10" style={{ background: app.iconBg }}><AppIcon appId={id} className="h-full w-full object-cover" /></span><span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-300 transition group-hover:text-white">{app.name}</span><ArrowUpRight className="h-3 w-3 shrink-0 text-slate-600 transition group-hover:text-violet-200" /></motion.button>; })}<button onClick={openGhostAI} className="col-span-2 flex items-center justify-between rounded-xl border border-violet-300/15 bg-violet-400/[0.055] px-3 py-2.5 text-left transition hover:border-violet-200/30 hover:bg-violet-400/[0.1]"><span className="flex items-center gap-2 text-[11px] font-semibold text-violet-100"><Sparkles className="h-4 w-4" /> Ask {selectedDetective.name}</span><ArrowRight className="h-3.5 w-3.5 text-violet-200/70" /></button></div></section>
              </div>
              <section><div className="mb-3 flex items-end justify-between gap-3"><div><p className="mb-1 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.18em] text-violet-200"><Bot className="h-3.5 w-3.5" /> Choose your partner</p><h2 className="text-lg font-semibold text-white">The detective team</h2><p className="mt-1 text-xs text-slate-500">Select a specialist to sync your choice with Ghost AI.</p></div><label className="group relative hidden w-[230px] sm:block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-violet-300" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a detective or skill" className="h-10 w-full rounded-xl border border-white/[0.09] bg-white/[0.035] pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-violet-300/35 focus:ring-4 focus:ring-violet-500/[0.08]" /></label></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{visibleDetectives.map((d, index) => { const selected = d.id === selectedDetective.id; return <motion.button key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .025, .18) }} whileHover={{ y: -4, scale: 1.012 }} whileTap={{ scale: .985 }} aria-pressed={selected} onClick={() => selectDetective(d.id)} className={`group relative min-h-[160px] overflow-hidden rounded-2xl border p-4 text-left transition duration-200 ${selected ? 'border-violet-300/35 bg-violet-400/[0.075] shadow-[0_12px_35px_rgba(109,40,217,.12)]' : 'border-white/[0.075] bg-[#101725]/80 hover:border-white/15 hover:bg-[#141d2c]'}`}><div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20" style={{ backgroundColor: d.color }} /><div className="relative flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 transition duration-300 group-hover:scale-105"><DetectiveAvatar shape={d.shape} color={d.color} detectiveId={d.avatarId} scoutColor={detectiveConfig.scoutColor} emberColor={detectiveConfig.emberColor} mintColor={detectiveConfig.mintColor} rubyColor={detectiveConfig.rubyColor} petalColor={detectiveConfig.petalColor} violetColor={detectiveConfig.violetColor} sunnyColor={detectiveConfig.sunnyColor} mochaColor={detectiveConfig.mochaColor} className="h-10 w-10" /></div><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-white">{d.name}</h3><p className="mt-0.5 truncate text-[10px]" style={{ color: d.color }}>{d.role}</p></div></div><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${selected ? 'border-violet-200/50 bg-violet-300 text-[#151021]' : 'border-white/10 text-transparent group-hover:border-white/25'}`}><Check className="h-3 w-3" /></span></div><p className="relative mt-3 line-clamp-2 text-[11px] leading-5 text-slate-400">{d.description}</p><div className="relative mt-3 flex flex-wrap gap-1.5">{d.skills.slice(0, 3).map(skill => <span key={skill} className="rounded-md border border-white/[0.07] bg-black/15 px-1.5 py-1 text-[9px] text-slate-400">{skill.replaceAll('_', ' ')}</span>)}</div></motion.button>; })}</div></section>
              <GhostActivityFeed />
            </motion.div>}
            {activeTab === 'planner' && <motion.section key="planner" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]"><div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-4 md:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-violet-200">Your daily system</p><h2 className="mt-1 text-xl font-semibold text-white">Daily planner</h2><p className="mt-1 text-xs text-slate-500">Tasks are saved locally on this device.</p></div><span className="rounded-xl border border-violet-300/15 bg-violet-300/[0.08] p-2.5 text-violet-200"><CalendarDays className="h-5 w-5" /></span></div><form onSubmit={addTask} className="rounded-2xl border border-white/[0.08] bg-black/20 p-3"><div className="flex gap-2"><input value={taskInput} onChange={e => setTaskInput(e.target.value)} placeholder="Add a task… e.g. Finish the portfolio hero" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-slate-600" /><button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-violet-300 px-3 py-2 text-[11px] font-bold text-[#151021] transition hover:bg-violet-200"><Plus className="h-3.5 w-3.5" /> Add</button></div><div className="mt-2 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3"><label className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-[10px] text-slate-400">Due <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="bg-transparent text-[10px] text-slate-200 outline-none" /></label><label className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-[10px] text-slate-400">Priority <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as Priority)} className="bg-transparent text-[10px] text-slate-200 outline-none"><option>Low</option><option>Normal</option><option>High</option></select></label></div></form><div className="my-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-white">Your tasks</h3><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-slate-400">{workspace.tasks.length}</span></div><label className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-2"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks" className="w-28 bg-transparent text-[10px] text-white outline-none placeholder:text-slate-600" /></label></div><div className="space-y-2">{filteredTasks.length ? filteredTasks.map(task => <motion.div layout key={task.id} className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-white/15 hover:bg-white/[0.045]"><button onClick={() => toggleTask(task.id)} className="shrink-0 text-slate-500 transition hover:scale-110 hover:text-emerald-200">{task.done ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Circle className="h-4 w-4" />}</button><div className="min-w-0 flex-1"><p className={`truncate text-xs ${task.done ? 'text-slate-600 line-through' : 'text-slate-200'}`}>{task.title}</p><p className="mt-1 text-[9px] text-slate-600">{task.due ? `Due ${task.due}` : 'No due date'} · Created {new Date(task.createdAt).toLocaleDateString()}</p></div><span className={`rounded-md px-1.5 py-1 text-[9px] ${task.priority === 'High' ? 'bg-rose-400/10 text-rose-200' : task.priority === 'Low' ? 'bg-slate-400/10 text-slate-400' : 'bg-cyan-400/10 text-cyan-200'}`}>{task.priority}</span><button aria-label="Delete task" onClick={() => deleteTask(task.id)} className="rounded-lg p-1.5 text-slate-600 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-200 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button></motion.div>) : <div className="rounded-xl border border-dashed border-white/10 py-10 text-center"><ListTodo className="mx-auto h-6 w-6 text-slate-600" /><p className="mt-2 text-xs text-slate-400">No matching tasks. Add one above to get started.</p></div>}</div></div><div className="flex flex-col gap-4"><div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#17172a] to-[#0d1420] p-5"><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-200">Progress snapshot</p><h3 className="mt-2 text-lg font-semibold text-white">Small wins add up.</h3><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/[0.07] bg-black/15 p-3"><p className="text-[10px] text-slate-500">Open</p><p className="mt-1 text-2xl font-semibold text-white">{pendingTasks.length}</p></div><div className="rounded-xl border border-white/[0.07] bg-black/15 p-3"><p className="text-[10px] text-slate-500">Completed</p><p className="mt-1 text-2xl font-semibold text-emerald-200">{workspace.tasks.filter(t => t.done).length}</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div initial={{ width: 0 }} animate={{ width: `${workspace.tasks.length ? workspace.tasks.filter(t => t.done).length / workspace.tasks.length * 100 : 0}%` }} className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" /></div><p className="mt-2 text-[10px] text-slate-500">{workspace.tasks.length ? Math.round(workspace.tasks.filter(t => t.done).length / workspace.tasks.length * 100) : 0}% of your task list complete</p></div><div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-5"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-amber-200" /><h3 className="text-sm font-semibold text-white">Reminder note</h3></div><p className="mt-2 text-xs leading-5 text-slate-400">Tasks persist locally. This screen does not schedule background reminders while ARLO OS is closed; connect the Electron notification scheduler to enable reliable due-time notifications.</p><button onClick={openGhostAI} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-200 transition hover:text-white">Ask Ghost for help <ArrowRight className="h-3 w-3" /></button></div></div></motion.section>}
            {activeTab === 'focus' && <motion.section key="focus" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mx-auto grid w-full max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-gradient-to-br from-[#17152b] via-[#101827] to-[#0d1420] p-6 text-center md:p-10"><div className="pointer-events-none absolute left-1/2 top-[-120px] h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-[80px]" /><div className="relative"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/[0.08] text-violet-200"><Focus className="h-5 w-5" /></span><p className="mt-4 text-[9px] font-semibold uppercase tracking-[.2em] text-violet-200">Focus chamber</p><h2 className="mt-1 text-xl font-semibold text-white">Protect your attention.</h2><p className="mt-2 text-xs text-slate-500">One thing at a time. Let the rest wait.</p><div className="mx-auto mt-7 flex h-56 w-56 items-center justify-center rounded-full border border-violet-300/15 bg-black/10 p-3 shadow-[0_0_70px_rgba(139,92,246,.08)]"><div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/[0.06]" style={{ background: 'radial-gradient(circle at 50% 35%, rgba(139,92,246,.13), transparent 65%)' }}><svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="2" /><circle cx="100" cy="100" r="88" fill="none" stroke="url(#focus-gradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 88}`} strokeDashoffset={`${2 * Math.PI * 88 * (1 - focusRemaining / (focusDuration * 60))}`} className="transition-[stroke-dashoffset] duration-500" /><defs><linearGradient id="focus-gradient"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#67e8f9"/></linearGradient></defs></svg><div><p className="font-mono text-4xl font-light tracking-tight text-white">{`${String(Math.floor(focusRemaining / 60)).padStart(2,'0')}:${String(focusRemaining % 60).padStart(2,'0')}`}</p><p className="mt-2 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-500">{focusRunning ? 'In the zone' : focusRemaining === 0 ? 'Session complete' : 'Ready when you are'}</p></div></div></div><div className="mx-auto mt-6 flex max-w-sm flex-wrap justify-center gap-2">{[15,25,45,60].map(min => <button key={min} onClick={() => { if (!focusRunning) { setFocusDuration(min); setFocusRemaining(min * 60); } }} className={`rounded-lg border px-3 py-2 text-[10px] font-semibold transition ${focusDuration === min ? 'border-violet-300/30 bg-violet-300/[0.12] text-violet-100' : 'border-white/[0.08] bg-white/[0.025] text-slate-500 hover:text-white'}`}>{min} min</button>)}</div><input value={focusLabel} onChange={e => setFocusLabel(e.target.value)} className="mx-auto mt-4 block w-full max-w-xs rounded-lg border border-white/[0.07] bg-black/15 px-3 py-2 text-center text-xs text-slate-200 outline-none focus:border-violet-300/30" aria-label="Focus session label" /><div className="mt-5 flex justify-center gap-2">{focusRunning ? <button onClick={pauseFocus} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"><Pause className="h-4 w-4" /> Pause</button> : <button onClick={startFocus} className="inline-flex items-center gap-2 rounded-xl bg-violet-300 px-5 py-2.5 text-xs font-bold text-[#151021] transition hover:-translate-y-0.5 hover:bg-violet-200"><Play className="h-4 w-4" /> {focusRemaining === 0 ? 'Start again' : 'Start focus'}</button>}<button onClick={resetFocus} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"><Square className="h-3.5 w-3.5" /> Reset</button></div><p className="mt-4 text-[9px] text-slate-600">Focus timer runs while this app is open. Desktop-wide Focus Mode integration requires an OS service.</p></div></div><div className="flex flex-col gap-4"><div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-5"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-200" /><h3 className="text-sm font-semibold text-white">Your rhythm</h3></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[9px] text-slate-500">Sessions started</p><p className="mt-1 text-2xl font-semibold text-white">{workspace.focusSessions}</p></div><div className="rounded-xl bg-white/[0.03] p-3"><p className="text-[9px] text-slate-500">Completed</p><p className="mt-1 text-2xl font-semibold text-cyan-200">{workspace.completedSessions}</p></div></div><p className="mt-3 text-[10px] leading-5 text-slate-500">A consistent short session is better than waiting for a perfect long block.</p></div><div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-200" /><h3 className="text-sm font-semibold text-white">Distraction guard</h3></div><p className="mt-2 text-xs leading-5 text-slate-400">Use ARLO OS Focus Mode to reduce distractions. This panel won't silently change system settings or close apps.</p><button onClick={() => launchApp('settings')} className="mt-3 text-[10px] font-semibold text-violet-200 transition hover:text-white">Open Settings →</button></div></div></motion.section>}
            {activeTab === 'routines' && <motion.section key="routines" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="flex flex-col gap-5"><div><p className="text-[9px] font-semibold uppercase tracking-[.18em] text-violet-200">Make habits repeatable</p><h2 className="mt-1 text-xl font-semibold text-white">Daily routines</h2><p className="mt-1 text-xs text-slate-500">Save a flow you use often. Each routine shows what it will do before you run it.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{workspace.routines.map((routine, index) => <motion.article key={routine.id} layout whileHover={{ y: -3 }} className="group rounded-2xl border border-white/[0.08] bg-[#101725]/85 p-4 transition hover:border-violet-300/20 hover:bg-[#141d2c]"><div className="flex items-start justify-between"><span className="rounded-xl border border-violet-300/15 bg-violet-300/[0.07] p-2.5 text-violet-200"><Zap className="h-4 w-4" /></span><button onClick={() => setRoutineOpen(routineOpen === routine.id ? null : routine.id)} className="rounded-lg p-1.5 text-slate-600 transition hover:bg-white/5 hover:text-white"><MoreHorizontal className="h-4 w-4" /></button></div><h3 className="mt-4 text-sm font-semibold text-white">{routine.name}</h3><p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500">{routine.description}</p><div className="mt-4 space-y-2">{routine.steps.map((step, i) => <div key={`${routine.id}-${i}`} className="flex items-start gap-2 text-[10px] leading-4 text-slate-400"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/10 text-[8px] text-slate-500">{i + 1}</span>{step}</div>)}</div><AnimatePresence>{routineOpen === routine.id && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden rounded-lg border border-amber-300/10 bg-amber-300/[0.04] p-2 text-[9px] leading-4 text-amber-100/70">Some steps open registered apps. Other steps are a checklist until their integration is configured.</motion.div>}</AnimatePresence><div className="mt-4 flex gap-2"><button onClick={() => executeRoutine(routine)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-300 px-3 py-2 text-[10px] font-bold text-[#151021] transition hover:bg-violet-200"><Play className="h-3 w-3" /> Run routine</button>{!DEFAULT_ROUTINES.some(item => item.id === routine.id) && <button aria-label="Delete routine" onClick={() => setWorkspace(current => ({ ...current, routines: current.routines.filter(r => r.id !== routine.id) }))} className="rounded-lg border border-white/[0.08] px-2.5 text-slate-500 transition hover:border-rose-300/20 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /></button>}</div></motion.article>)}</div><form onSubmit={addRoutine} className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-4 md:p-5"><div className="flex items-center gap-2"><Plus className="h-4 w-4 text-cyan-200" /><h3 className="text-sm font-semibold text-white">Create your own routine</h3></div><div className="mt-3 grid gap-2 md:grid-cols-[.7fr_1.3fr_auto]"><input value={newRoutineName} onChange={e => setNewRoutineName(e.target.value)} placeholder="Routine name" className="rounded-xl border border-white/[0.08] bg-black/15 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-violet-300/30" /><input value={newRoutineSteps} onChange={e => setNewRoutineSteps(e.target.value)} placeholder="Steps separated by commas" className="rounded-xl border border-white/[0.08] bg-black/15 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-600 focus:border-violet-300/30" /><button type="submit" className="rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-[#151021] transition hover:bg-violet-200">Save routine</button></div><p className="mt-2 text-[9px] text-slate-600">Routines are stored locally. Scheduled background execution is not enabled by this renderer component.</p></form></motion.section>}
            {activeTab === 'tools' && <motion.section key="tools" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-4 md:p-5"><div className="flex items-center gap-2"><WandSparkles className="h-4 w-4 text-violet-200" /><h2 className="text-sm font-semibold text-white">Writing studio</h2></div><p className="mt-1 text-[10px] text-slate-500">Prepare a draft, then send it to your configured AI service for transformation.</p><textarea value={writingInput} onChange={e => setWritingInput(e.target.value)} placeholder="Paste text to rewrite, summarize, translate, or turn into an email…" rows={5} className="mt-4 w-full resize-y rounded-xl border border-white/[0.08] bg-black/20 p-3 text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-300/30" /><div className="mt-2 flex flex-wrap items-center gap-2"><label className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-2 py-2 text-[10px] text-slate-500">Tone <select value={writingTone} onChange={e => setWritingTone(e.target.value)} className="bg-transparent text-slate-200 outline-none"><option>Professional</option><option>Friendly</option><option>Concise</option><option>Persuasive</option></select></label><button onClick={() => { if (!writingInput.trim()) return; setWritingOutput(`Suggested ${writingTone.toLowerCase()} instruction:\n\nRewrite the following text in a ${writingTone.toLowerCase()} tone while preserving its meaning. Review the result before using it.\n\n${writingInput}`); }} className="rounded-lg bg-violet-300 px-3 py-2 text-[10px] font-bold text-[#151021] transition hover:bg-violet-200">Prepare prompt</button><button onClick={openGhostAI} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:bg-white/5">Open Ghost AI</button></div>{writingOutput && <div className="mt-3 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3"><p className="whitespace-pre-wrap text-[11px] leading-5 text-slate-300">{writingOutput}</p><button onClick={() => { void navigator.clipboard.writeText(writingOutput).then(() => notify('Prompt copied')).catch(() => notify('Clipboard write was blocked')); }} className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-cyan-200 hover:text-white"><Clipboard className="h-3 w-3" /> Copy prompt</button></div>}</div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-4 md:p-5"><div className="flex items-center gap-2"><Clipboard className="h-4 w-4 text-cyan-200" /><h2 className="text-sm font-semibold text-white">Clipboard snippets</h2></div><p className="mt-1 text-[10px] text-slate-500">Clipboard history is opt-in and stored locally on this device.</p><label className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-xs text-slate-300"><input type="checkbox" checked={workspace.clipboardEnabled} onChange={e => setWorkspace(current => ({ ...current, clipboardEnabled: e.target.checked, clips: e.target.checked ? current.clips : [] }))} className="accent-violet-300" /> Enable clipboard snippets <span className="ml-auto text-[9px] text-slate-600">Off by default</span></label><div className="mt-3 flex gap-2"><button onClick={() => void saveClip()} disabled={!workspace.clipboardEnabled} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-2 text-[10px] font-semibold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-3 w-3" /> Save current clipboard</button><button onClick={() => setWorkspace(current => ({ ...current, clips: [] }))} className="rounded-lg px-3 py-2 text-[10px] text-slate-500 transition hover:text-rose-200">Clear history</button></div><label className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] px-2.5 py-2"><Search className="h-3.5 w-3.5 text-slate-500" /><input value={clipboardSearch} onChange={e => setClipboardSearch(e.target.value)} placeholder="Search saved snippets" className="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none placeholder:text-slate-600" /></label><div className="mt-3 max-h-52 space-y-2 overflow-y-auto">{workspace.clips.filter(c => c.text.toLowerCase().includes(clipboardSearch.toLowerCase())).map(clip => <div key={clip.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><p className="line-clamp-3 whitespace-pre-wrap text-[10px] leading-4 text-slate-400">{clip.text}</p><div className="mt-2 flex items-center justify-between"><span className="text-[9px] text-slate-600">{new Date(clip.createdAt).toLocaleString()}</span><button onClick={() => void navigator.clipboard.writeText(clip.text).then(() => notify('Snippet copied')).catch(() => notify('Clipboard write was blocked'))} className="text-[9px] text-cyan-200 hover:text-white">Copy</button></div></div>)}{!workspace.clips.length && <p className="py-5 text-center text-[10px] text-slate-600">No saved snippets yet.</p>}</div><p className="mt-3 text-[9px] leading-4 text-slate-600">Avoid copying passwords, tokens, or sensitive personal information. Clipboard access may require permission.</p></div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-4 md:p-5"><div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-amber-200" /><h2 className="text-sm font-semibold text-white">Local file quick reader</h2></div><p className="mt-1 text-[10px] text-slate-500">Select a file explicitly. Text previews stay in this renderer; nothing is uploaded.</p><input ref={fileInputRef} type="file" accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.csv,.log,.py,.pdf,.docx" onChange={e => void readFile(e.target.files?.[0])} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-xs text-slate-300 transition hover:border-violet-300/30 hover:bg-violet-300/[0.035]"><FileSearch className="h-4 w-4 text-violet-200" /> Choose a local file</button>{fileName && <p className="mt-2 truncate text-[10px] text-cyan-200">Selected: {fileName}</p>}{fileSummary && <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/[0.07] bg-black/20 p-3"><pre className="whitespace-pre-wrap break-words font-sans text-[10px] leading-5 text-slate-400">{fileSummary}</pre></div>}<p className="mt-3 text-[9px] leading-4 text-slate-600">PDF/DOCX parsing, semantic folder search, and AI summaries need document-processing services. This panel intentionally does not claim those integrations are connected.</p></div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d1420]/85 p-4 md:p-5"><div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-emerald-200" /><h2 className="text-sm font-semibold text-white">Connected intelligence</h2></div><p className="mt-1 text-[10px] text-slate-500">Use configured providers for tasks that require live data or AI inference.</p><div className="mt-4 space-y-2">{[{name:'Ghost AI provider',detail:'Chat and model reasoning',status:'Open Ghost AI',icon:Bot},{name:'Web research',detail:'Current sources and citations',status:'Needs provider',icon:Globe2},{name:'Weather & calendar',detail:'Live personal information',status:'Needs integration',icon:CalendarDays},{name:'Screen context',detail:'Explicitly selected screenshots',status:'Needs secure OS bridge',icon:Settings2},{name:'System health',detail:'Battery, memory and disk metrics',status:'Needs Electron service',icon:Activity}].map(item => { const Icon = item.icon; return <div key={item.name} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><span className="rounded-lg border border-white/[0.07] bg-black/20 p-2 text-slate-400"><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-medium text-slate-200">{item.name}</p><p className="mt-0.5 text-[9px] text-slate-600">{item.detail}</p></div><span className="shrink-0 text-[9px] text-slate-500">{item.status}</span></div>; })}</div><button onClick={openGhostAI} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-violet-200 transition hover:text-white">Open Ghost AI <ArrowRight className="h-3 w-3" /></button></div>
            </motion.section>}
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>{commandOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-start justify-center bg-[#030610]/70 px-4 pt-[10vh] backdrop-blur-md" onMouseDown={e => { if (e.target === e.currentTarget) setCommandOpen(false); }}><motion.div initial={{ opacity: 0, y: -12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }} transition={{ type: 'spring', stiffness: 360, damping: 30 }} className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#101725]/95 shadow-[0_30px_120px_rgba(0,0,0,.6)]"><div className="flex items-center gap-3 border-b border-white/[0.07] px-4"><Search className="h-4 w-4 shrink-0 text-violet-200" /><input ref={commandInputRef} value={commandQuery} onChange={e => setCommandQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') runCommand(commandQuery); }} placeholder="Ask Ghost or run a command…" className="h-14 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" /><button onClick={() => setCommandOpen(false)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button></div><div className="p-3"><p className="px-2 pb-2 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-600">Suggested actions</p>{[{label:'Open Settings',hint:'Launch ARLO OS settings',icon:Settings2,command:'open settings'},{label:'Start a focus session',hint:'Start your selected focus timer',icon:Focus,command:'start focus'},{label:'Add a task',hint:'Create a task in your daily planner',icon:ListTodo,command:'add task'},{label:'Ask Ghost AI',hint:'Continue with your selected detective',icon:Sparkles,command:'ask ghost'}].filter(item => !commandQuery || `${item.label} ${item.hint}`.toLowerCase().includes(commandQuery.toLowerCase())).map(item => { const Icon = item.icon; return <button key={item.label} onClick={() => runCommand(commandQuery || item.command)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-violet-300/[0.08]"><span className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-slate-400 transition group-hover:border-violet-300/20 group-hover:text-violet-200"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-200">{item.label}</span><span className="mt-0.5 block text-[10px] text-slate-600">{item.hint}</span></span><ArrowUpRight className="h-3.5 w-3.5 text-slate-700 transition group-hover:text-violet-200" /></button>; })}<div className="mt-2 flex items-center justify-between border-t border-white/[0.06] px-2 pt-3 text-[9px] text-slate-600"><span className="flex items-center gap-1.5"><Keyboard className="h-3 w-3" /> Enter to run · Esc to close</span><span>ARLO Command</span></div></div></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .97 }} className="absolute bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#151d2b]/95 px-4 py-3 text-xs text-slate-200 shadow-2xl backdrop-blur-xl"><CheckCircle2 className="h-4 w-4 text-emerald-200" />{toast}</motion.div>}</AnimatePresence>
    </div>
  );
};

export default GhostDetectivesApp;
