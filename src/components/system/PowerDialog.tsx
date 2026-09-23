import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power, RefreshCw, Moon, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const PowerDialog: React.FC = () => {
  const {
    showPowerDialog,
    setShowPowerDialog,
    restartSystem,
    sleepSystem,
    lockSystem,
  } = useOS();

  if (!showPowerDialog) return null;

  return (
    <div
      onClick={() => setShowPowerDialog(false)}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl glass-panel text-white p-6 shadow-2xl border border-white/20 text-center relative"
      >
        <button
          onClick={() => setShowPowerDialog(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
          <Power className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold mb-1">Shut Down Abhishek OS?</h3>
        <p className="text-xs text-slate-400 mb-6">
          Are you sure you want to shut down your computer now?
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => {
              setShowPowerDialog(false);
              sleepSystem();
            }}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center transition-colors group"
          >
            <Moon className="w-5 h-5 text-indigo-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Sleep</span>
          </button>

          <button
            onClick={() => {
              setShowPowerDialog(false);
              restartSystem();
            }}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center transition-colors group"
          >
            <RefreshCw className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Restart</span>
          </button>

          <button
            onClick={() => {
              setShowPowerDialog(false);
              restartSystem(); // Simulated complete shutdown/reboot
            }}
            className="p-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 flex flex-col items-center justify-center transition-colors group"
          >
            <Power className="w-5 h-5 text-red-400 mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Shut Down</span>
          </button>
        </div>

        <button
          onClick={() => setShowPowerDialog(false)}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
};
