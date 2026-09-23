import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Folder,
  FileText,
  Terminal,
  Settings,
  Calculator,
  Play,
  Moon,
  Lock,
  Power,
  ArrowRight,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { vfs } from '../../services/virtualFileSystem';
import { sound } from '../../services/soundService';

export const Spotlight: React.FC = () => {
  const {
    showSpotlight,
    setShowSpotlight,
    openApp,
    lockSystem,
    sleepSystem,
    setShowPowerDialog,
    updateSettings,
    settings,
  } = useOS();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showSpotlight) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [showSpotlight]);

  if (!showSpotlight) return null;

  // Build filtered items
  const q = query.toLowerCase().trim();

  // 1. Math evaluation test
  let mathResult: string | null = null;
  if (/^[0-9+\-*/().\s^%]+$/.test(q) && q.length >= 2) {
    try {
      // Safe math evaluator
      const res = Function(`"use strict"; return (${q})`)();
      if (typeof res === 'number' && !isNaN(res)) {
        mathResult = `${res}`;
      }
    } catch {}
  }

  // 2. Apps
  const matchedApps = Object.values(APP_REGISTRY)
    .filter(
      app =>
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q)
    )
    .slice(0, 5);

  // 3. Files from VFS
  const matchedFiles = q ? vfs.search(q).slice(0, 4) : [];

  // 4. System commands
  const systemCommands = [
    {
      id: 'cmd-dark',
      title: 'Toggle Dark Mode',
      desc: 'Switch system appearance',
      action: () => updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' }),
    },
    { id: 'cmd-lock', title: 'Lock Screen', desc: 'Secure this session', action: () => lockSystem() },
    { id: 'cmd-sleep', title: 'Sleep Abhishek OS', desc: 'Low power sleep mode', action: () => sleepSystem() },
    {
      id: 'cmd-power',
      title: 'Shut Down...',
      desc: 'Power off computer',
      action: () => setShowPowerDialog(true),
    },
  ].filter(cmd => !q || cmd.title.toLowerCase().includes(q));

  // Flatten all items for keyboard navigation
  const allResults: { id: string; type: string; title: string; subtitle: string; onSelect: () => void }[] = [];

  if (mathResult) {
    allResults.push({
      id: 'math',
      type: 'calc',
      title: mathResult,
      subtitle: `Calculation: ${query}`,
      onSelect: () => openApp('calculator'),
    });
  }

  matchedApps.forEach(app => {
    allResults.push({
      id: app.id,
      type: 'app',
      title: app.name,
      subtitle: app.description,
      onSelect: () => openApp(app.id),
    });
  });

  matchedFiles.forEach(file => {
    allResults.push({
      id: file.id,
      type: 'file',
      title: file.name,
      subtitle: file.path,
      onSelect: () => openApp('finder'),
    });
  });

  systemCommands.forEach(cmd => {
    allResults.push({
      id: cmd.id,
      type: 'command',
      title: cmd.title,
      subtitle: cmd.desc,
      onSelect: cmd.action,
    });
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        sound.playClick();
        allResults[selectedIndex].onSelect();
        setShowSpotlight(false);
      }
    } else if (e.key === 'Escape') {
      setShowSpotlight(false);
    }
  };

  return (
    <div
      onClick={() => setShowSpotlight(false)}
      className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-28 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: -20 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl glass-panel text-white shadow-2xl border border-white/20 overflow-hidden"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3.5 px-5 py-4 border-b border-white/10">
          <Search className="w-6 h-6 text-sky-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Spotlight Search applications, files, calculations..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-slate-400 text-white"
          />
          <kbd className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-400 font-mono">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-white/5">
          {allResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            allResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    item.onSelect();
                    setShowSpotlight(false);
                  }}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-sky-500/30 text-white' : 'hover:bg-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'calc'
                          ? 'bg-amber-500/30 text-amber-300'
                          : item.type === 'file'
                          ? 'bg-indigo-500/30 text-indigo-300'
                          : item.type === 'command'
                          ? 'bg-emerald-500/30 text-emerald-300'
                          : 'bg-sky-500/30 text-sky-300'
                      }`}
                    >
                      {item.type === 'calc' ? (
                        <Calculator className="w-5 h-5" />
                      ) : item.type === 'file' ? (
                        <FileText className="w-5 h-5" />
                      ) : item.type === 'command' ? (
                        <Settings className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{item.title}</div>
                      <div className="text-xs text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 transition-opacity ${
                      isSelected ? 'opacity-100 text-sky-300' : 'opacity-0'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
