import React from 'react';
import { motion } from 'motion/react';
import { X, Cpu, HardDrive, Monitor, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const AboutModal: React.FC = () => {
  const { showAboutModal, setShowAboutModal, openApp } = useOS();

  if (!showAboutModal) return null;

  return (
    <div
      onClick={() => setShowAboutModal(false)}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl glass-panel text-white p-6 shadow-2xl border border-white/20 relative"
      >
        <button
          onClick={() => {
            setShowAboutModal(false);
            sound.playClick();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-pink-500 flex items-center justify-center shadow-xl p-0.5 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <svg className="w-8 h-8 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
              </svg>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Abhishek OS</h2>
            <p className="text-xs text-slate-300 font-medium">Version 1.0.0 Pro (Build 26A382)</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-sky-400 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>Crafted by Abhishek Kuntare</span>
            </div>
          </div>
        </div>

        {/* Specs Table */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2 text-xs mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Chip</span>
            </span>
            <span className="font-medium text-slate-200">12-Core High-Efficiency Neural Engine</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Memory</span>
            </span>
            <span className="font-medium text-slate-200">32 GB Unified RAM</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Storage</span>
            </span>
            <span className="font-medium text-slate-200">1 TB High-Speed Solid State Drive</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-pink-400" />
              <span>Display</span>
            </span>
            <span className="font-medium text-slate-200">Liquid Retina XDR ProMotion 120Hz</span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Creator Contact</span>
            </span>
            <span className="font-mono text-[11px] text-sky-300">abhishekkuntare02@gmail.com</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => {
              setShowAboutModal(false);
              openApp('settings');
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 transition-colors"
          >
            System Settings...
          </button>
          <button
            onClick={() => {
              setShowAboutModal(false);
              sound.playClick();
            }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
