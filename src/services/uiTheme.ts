export interface UITheme {
  id: string;
  name: string;
  background: string;
  panel: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  radius: string;
  onAccent: string;
}

// Themes are opt-in. The original ARLO OS desktop remains unchanged until the user explicitly selects a theme.
const LEGACY_UI_THEME_STORAGE_KEY = 'abhishek-os-ui-theme';
const UI_THEME_STORAGE_KEY = 'abhishek-os-selected-ui-theme-v2';

export const UI_THEMES: UITheme[] = [
  { id: 'minimalism', name: 'Minimalism', background: '#0f1115', panel: '#181b21', text: '#f5f7fa', muted: '#9aa4b2', accent: '#ffffff', accent2: '#94a3b8', radius: '14px', onAccent: '#111111' },
  { id: 'maximalism', name: 'Maximalism', background: '#17051f', panel: '#2a0b36', text: '#fff7ff', muted: '#d8b4fe', accent: '#ff4ecd', accent2: '#ff8bdc', radius: '20px', onAccent: '#ffffff' },
  { id: 'swiss-design', name: 'Swiss Design', background: '#f3f1eb', panel: '#ffffff', text: '#141414', muted: '#5f6368', accent: '#e53935', accent2: '#ff6b57', radius: '4px', onAccent: '#ffffff' },
  { id: 'brutalism', name: 'Brutalism', background: '#f4efe2', panel: '#fffdf5', text: '#111111', muted: '#4b5563', accent: '#ff3b30', accent2: '#000000', radius: '0px', onAccent: '#ffffff' },
  { id: 'surrealism', name: 'Surrealism', background: '#08071a', panel: '#17152d', text: '#fff8ff', muted: '#b8b1cf', accent: '#c084fc', accent2: '#22d3ee', radius: '28px', onAccent: '#10051b' },
  { id: 'neo-brutalism', name: 'Neo-Brutalism', background: '#f8f0d8', panel: '#fffdf4', text: '#111111', muted: '#55514a', accent: '#ffcc00', accent2: '#ff5c5c', radius: '8px', onAccent: '#111111' },
  { id: 'neo-classical', name: 'Neo-classical', background: '#17110d', panel: '#251b14', text: '#fff4dc', muted: '#c9b9a4', accent: '#d4af72', accent2: '#f4d6a0', radius: '12px', onAccent: '#21130b' },
  { id: 'neumorphism', name: 'Neumorphism', background: '#d9dee7', panel: '#e7ebf2', text: '#1e293b', muted: '#64748b', accent: '#64748b', accent2: '#94a3b8', radius: '22px', onAccent: '#ffffff' },
  { id: 'scrapbook', name: 'Scrapbook', background: '#201914', panel: '#2d241d', text: '#fff7e8', muted: '#c9bca9', accent: '#f59e0b', accent2: '#fb7185', radius: '6px', onAccent: '#20140a' },
  { id: 'glassmorphism', name: 'Glassmorphism', background: '#07111d', panel: '#ffffff18', text: '#f8fbff', muted: '#9fb1c5', accent: '#7dd3fc', accent2: '#a78bfa', radius: '22px', onAccent: '#06101a' },
  { id: 'claymorphism', name: 'Claymorphism', background: '#17151c', panel: '#2a2732', text: '#fffaff', muted: '#b9afc8', accent: '#f0abfc', accent2: '#c4b5fd', radius: '28px', onAccent: '#26122a' },
  { id: 'bento-grid', name: 'Bento Grid', background: '#080b12', panel: '#111827', text: '#f8fafc', muted: '#94a3b8', accent: '#38bdf8', accent2: '#a78bfa', radius: '18px', onAccent: '#03111c' },
  { id: 'pixel-art', name: 'Pixel Art', background: '#101522', panel: '#1b2435', text: '#e6fffb', muted: '#83a7a1', accent: '#00e5a8', accent2: '#facc15', radius: '2px', onAccent: '#00130e' },
  { id: 'conceptual-sketch', name: 'Conceptual Sketch', background: '#f5f1e8', panel: '#fffdf7', text: '#222222', muted: '#777066', accent: '#5b6ee1', accent2: '#d97757', radius: '10px', onAccent: '#ffffff' },
  { id: 'luxury-typography', name: 'Luxury Typography', background: '#090909', panel: '#171717', text: '#f8f1df', muted: '#a8a29e', accent: '#d4af37', accent2: '#f5e6b3', radius: '10px', onAccent: '#16100a' },
  { id: 'editorial-design', name: 'Editorial Design', background: '#101010', panel: '#1c1c1c', text: '#f5f2e9', muted: '#a3a3a3', accent: '#f97316', accent2: '#ef4444', radius: '6px', onAccent: '#1a0c02' },
  { id: 'y2k-aesthetic', name: 'Y2K Aesthetic', background: '#17052d', panel: '#29104a', text: '#fff7ff', muted: '#d8b4fe', accent: '#60a5fa', accent2: '#f472b6', radius: '24px', onAccent: '#081326' },
  { id: 'ethereal', name: 'Ethereal', background: '#0c1020', panel: '#17213b', text: '#eef6ff', muted: '#a8b7d1', accent: '#a5b4fc', accent2: '#67e8f9', radius: '30px', onAccent: '#11132a' },
  { id: 'bohemian', name: 'Bohemian', background: '#20130d', panel: '#302019', text: '#fff5e6', muted: '#cbb8a0', accent: '#d97706', accent2: '#eab308', radius: '18px', onAccent: '#241105' },
  { id: 'dark-mode-ui', name: 'Dark Mode UI', background: '#05070a', panel: '#0d1117', text: '#f3f4f6', muted: '#8b949e', accent: '#3b82f6', accent2: '#8b5cf6', radius: '14px', onAccent: '#ffffff' },
  { id: 'cyberpunk', name: 'Cyberpunk', background: '#08000e', panel: '#180021', text: '#f8f7ff', muted: '#a5a0b5', accent: '#ff00c8', accent2: '#00f6ff', radius: '10px', onAccent: '#130014' },
  { id: 'anthropomorphic', name: 'Anthropomorphic', background: '#0d1513', panel: '#17231f', text: '#f1fff8', muted: '#9db4a8', accent: '#34d399', accent2: '#f59e0b', radius: '22px', onAccent: '#03150d' },
  { id: 'victoria', name: 'Victoria', background: '#120b10', panel: '#21141b', text: '#fff0e5', muted: '#bca5ad', accent: '#b76e79', accent2: '#e7b7a8', radius: '14px', onAccent: '#210d13' },
  { id: 'cybercore', name: 'Cybercore', background: '#030b13', panel: '#071a28', text: '#e7fbff', muted: '#7ea4b4', accent: '#00e5ff', accent2: '#7c3aed', radius: '4px', onAccent: '#001218' },
  { id: 'synthwave', name: 'Synthwave', background: '#12051e', panel: '#211039', text: '#fff1ff', muted: '#bda7c9', accent: '#ff2bd6', accent2: '#6d5dfc', radius: '16px', onAccent: '#22001d' },
  { id: 'graffiti', name: 'Graffiti', background: '#130b09', panel: '#21140f', text: '#fff7ed', muted: '#c5b6a5', accent: '#ff6b00', accent2: '#00d4ff', radius: '8px', onAccent: '#211003' },
  { id: 'gothic', name: 'Gothic', background: '#08070b', panel: '#15121a', text: '#eee8f1', muted: '#93899d', accent: '#a855f7', accent2: '#ef4444', radius: '8px', onAccent: '#14061f' },
  { id: 'mixed-media', name: 'Mixed Media', background: '#11110f', panel: '#201f1b', text: '#fff8e7', muted: '#b9b09c', accent: '#f97316', accent2: '#22c55e', radius: '18px', onAccent: '#1c0900' },
  { id: 'wabi-sabi', name: 'Wabi Sabi', background: '#111310', panel: '#1c211a', text: '#ece8d9', muted: '#a6a58e', accent: '#b7a77a', accent2: '#d1d5b7', radius: '14px', onAccent: '#1b160b' },
];

export const getStoredUITheme = (): UITheme | null => {
  try {
    const stored = localStorage.getItem(UI_THEME_STORAGE_KEY);

    if (!stored) return null;

    return UI_THEMES.find(theme => theme.id === stored) || null;
  } catch {
    return null;
  }
};

const THEME_STYLE_ID = 'abhishek-os-theme-engine';

export const applyUITheme = (theme: UITheme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  root.dataset.abhishekTheme = theme.id;
  root.style.setProperty('--os-theme-bg', theme.background);
  root.style.setProperty('--os-theme-panel', theme.panel);
  root.style.setProperty('--os-theme-text', theme.text);
  root.style.setProperty('--os-theme-muted', theme.muted);
  root.style.setProperty('--os-theme-accent', theme.accent);
  root.style.setProperty('--os-theme-accent-2', theme.accent2);
  root.style.setProperty('--os-theme-radius', theme.radius);
  root.style.setProperty('--os-theme-on-accent', theme.onAccent);
  root.style.setProperty('--os-theme-border', `color-mix(in srgb, ${theme.text} 14%, transparent)`);
  root.style.setProperty('--os-theme-input', `color-mix(in srgb, ${theme.panel} 86%, ${theme.background})`);

  let style = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    :root[data-abhishek-theme] {
      color-scheme: dark;
      --os-theme-glow: color-mix(in srgb, var(--os-theme-accent) 28%, transparent);
    }

    :root[data-abhishek-theme="swiss-design"],
    :root[data-abhishek-theme="brutalism"],
    :root[data-abhishek-theme="neo-brutalism"],
    :root[data-abhishek-theme="neumorphism"],
    :root[data-abhishek-theme="conceptual-sketch"] {
      color-scheme: light;
    }

    :root[data-abhishek-theme] body {
      background: var(--os-theme-bg) !important;
      color: var(--os-theme-text) !important;
      transition:
        background-color 420ms ease,
        color 420ms ease,
        filter 420ms ease;
    }

    :root[data-abhishek-theme] #root,
    :root[data-abhishek-theme] #root > div {
      background-color: var(--os-theme-bg) !important;
      color: var(--os-theme-text);
      transition: background-color 420ms ease, color 420ms ease;
    }

    :root[data-abhishek-theme] body::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      pointer-events: none;
      background:
        radial-gradient(circle at 12% 8%, var(--os-theme-glow), transparent 32%),
        radial-gradient(circle at 88% 92%, color-mix(in srgb, var(--os-theme-accent-2) 20%, transparent), transparent 34%);
      mix-blend-mode: screen;
      opacity: .72;
      transition: opacity 420ms ease;
    }

    :root[data-abhishek-theme] ::selection {
      background: var(--os-theme-accent) !important;
      color: var(--os-theme-on-accent) !important;
    }

    :root[data-abhishek-theme] .glass-panel,
    :root[data-abhishek-theme] [class*="backdrop-blur"]:not([data-theme-preview] *) {
      background-color: color-mix(in srgb, var(--os-theme-panel) 88%, transparent) !important;
      border-color: var(--os-theme-border) !important;
      border-radius: var(--os-theme-radius);
      box-shadow:
        0 18px 60px color-mix(in srgb, var(--os-theme-bg) 48%, transparent),
        inset 0 1px 0 color-mix(in srgb, var(--os-theme-text) 9%, transparent) !important;
      backdrop-filter: blur(26px) saturate(150%);
      transition:
        background-color 420ms ease,
        border-color 420ms ease,
        box-shadow 420ms ease;
    }

    :root[data-abhishek-theme] [class*="border-white"],
    :root[data-abhishek-theme] [class*="border-slate"] {
      border-color: var(--os-theme-border) !important;
    }

    :root[data-abhishek-theme] [class*="text-white"]:not([data-theme-preview] *) {
      color: var(--os-theme-text) !important;
    }

    :root[data-abhishek-theme] [class*="text-slate-400"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="text-slate-500"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="text-slate-600"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="text-slate-700"]:not([data-theme-preview] *) {
      color: var(--os-theme-muted) !important;
    }

    :root[data-abhishek-theme] [class*="text-slate-100"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="text-slate-200"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="text-gray-100"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="text-gray-200"]:not([data-theme-preview] *) {
      color: var(--os-theme-text) !important;
    }

    :root[data-abhishek-theme] [class*="bg-white/"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-black/"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-black"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-slate-900"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-slate-800"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-slate-950"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-gray-900"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-gray-800"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-neutral-900"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-[#070b12]"]:not([data-theme-preview] *) {
      background-color: color-mix(in srgb, var(--os-theme-panel) 86%, transparent) !important;
    }

    :root[data-abhishek-theme] [class*="bg-slate-700"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-gray-700"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-white/5"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-white/10"]:not([data-theme-preview] *) {
      background-color: color-mix(in srgb, var(--os-theme-panel) 72%, var(--os-theme-bg)) !important;
    }

    :root[data-abhishek-theme] input,
    :root[data-abhishek-theme] textarea,
    :root[data-abhishek-theme] select {
      background-color: var(--os-theme-input) !important;
      color: var(--os-theme-text) !important;
      border-color: var(--os-theme-border) !important;
    }

    :root[data-abhishek-theme] input::placeholder,
    :root[data-abhishek-theme] textarea::placeholder {
      color: var(--os-theme-muted) !important;
      opacity: .72;
    }

    :root[data-abhishek-theme] button:hover {
      --tw-ring-color: var(--os-theme-accent);
    }

    :root[data-abhishek-theme] ::-webkit-scrollbar {
      width: 9px;
      height: 9px;
    }

    :root[data-abhishek-theme] ::-webkit-scrollbar-track {
      background: transparent;
    }

    :root[data-abhishek-theme] ::-webkit-scrollbar-thumb {
      background: color-mix(in srgb, var(--os-theme-accent) 35%, transparent);
      border: 2px solid transparent;
      background-clip: padding-box;
      border-radius: 999px;
    }

    :root[data-abhishek-theme] ::-webkit-scrollbar-thumb:hover {
      background: var(--os-theme-accent);
      background-clip: padding-box;
    }

    :root[data-abhishek-theme] [class*="bg-sky-"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-blue-"]:not([data-theme-preview] *),
    :root[data-abhishek-theme] [class*="bg-indigo-"]:not([data-theme-preview] *) {
      background-color: var(--os-theme-accent) !important;
      color: var(--os-theme-on-accent) !important;
    }

    :root[data-abhishek-theme] [class*="text-sky-"],
    :root[data-abhishek-theme] [class*="text-blue-"],
    :root[data-abhishek-theme] [class*="text-indigo-"] {
      color: var(--os-theme-accent) !important;
    }

    :root[data-abhishek-theme] [class*="shadow-sky-"],
    :root[data-abhishek-theme] [class*="shadow-blue-"] {
      --tw-shadow-color: var(--os-theme-glow) !important;
    }

    :root[data-abhishek-theme] [data-theme-preview] {
      isolation: isolate;
    }

    :root[data-abhishek-theme] [data-theme-preview] [class*="text-white"] {
      color: inherit !important;
    }

    :root[data-abhishek-theme] [data-theme-preview] [class*="bg-white/"] {
      background-color: rgba(255,255,255,.12) !important;
    }
  `;
};

export const clearUITheme = () => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  delete root.dataset.abhishekTheme;

  [
    '--os-theme-bg', '--os-theme-panel', '--os-theme-text',
    '--os-theme-muted', '--os-theme-accent', '--os-theme-accent-2',
    '--os-theme-radius', '--os-theme-on-accent', '--os-theme-border',
    '--os-theme-input', '--os-theme-glow',
  ].forEach(variable => root.style.removeProperty(variable));

  document.getElementById(THEME_STYLE_ID)?.remove();

  // Ignore any selection saved by the previous theme implementation.
  try {
    localStorage.removeItem(LEGACY_UI_THEME_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const resetUIThemeToOriginal = () => {
  try {
    localStorage.removeItem(UI_THEME_STORAGE_KEY);
    localStorage.removeItem(LEGACY_UI_THEME_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }

  clearUITheme();

  window.dispatchEvent(
    new CustomEvent('abhishek-os-theme-updated', { detail: null }),
  );
};

export const persistAndApplyUITheme = (theme: UITheme) => {
  try {
    localStorage.setItem(UI_THEME_STORAGE_KEY, theme.id);
  } catch {
    // Ignore storage failures.
  }

  applyUITheme(theme);

  window.dispatchEvent(
    new CustomEvent('abhishek-os-theme-updated', {
      detail: theme.id,
    }),
  );
};


export const initializeUITheme = (): UITheme | null => {
  const theme = getStoredUITheme();
  if (theme) applyUITheme(theme);
  else clearUITheme();
  return theme;
};
