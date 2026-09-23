import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Lock, KeyRound } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const LockScreen: React.FC = () => {
  const { isLocked, unlockSystem, user, currentWallpaper } = useOS();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isLocked) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = unlockSystem(pin);
    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 800);
      setPin('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[105] bg-cover bg-center flex flex-col items-center justify-between p-12 select-none text-white overflow-hidden"
      style={{ backgroundImage: `url(${currentWallpaper.url})` }}
    >
      {/* Background glass blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />

      {/* Top Clock */}
      <div className="relative z-10 text-center mt-8">
        <div className="text-7xl font-extrabold tracking-tight drop-shadow-lg">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-base font-medium text-slate-200 mt-1 drop-shadow">
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Center User Profile & Unlock Field */}
      <motion.div
        animate={error ? { x: [-12, 12, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center w-full max-w-xs"
      >
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/40 shadow-2xl mb-4 bg-slate-800 flex items-center justify-center text-3xl font-bold">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{user.fullName.charAt(0)}</span>
          )}
        </div>

        <h3 className="text-lg font-bold drop-shadow mb-0.5">{user.fullName}</h3>
        <p className="text-xs text-slate-300 drop-shadow mb-4">
          {user.roles.slice(0, 2).join(' • ') || 'User'}
        </p>

        <form onSubmit={handleSubmit} className="w-full relative flex items-center">
          <input
            type="password"
            autoFocus
            placeholder="Enter PIN (Default: 1234)"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full py-2.5 px-4 rounded-2xl glass-panel text-white placeholder:text-slate-400 text-center text-sm outline-none border border-white/20 focus:border-sky-400 transition-colors shadow-lg"
          />
          <button
            type="submit"
            className="absolute right-2 w-7 h-7 rounded-xl bg-sky-500 hover:bg-sky-400 flex items-center justify-center text-white transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <p className="text-xs text-rose-400 mt-2 font-medium">Incorrect PIN. Try 1234.</p>
        )}
      </motion.div>

      {/* Bottom hint */}
      <div className="relative z-10 text-xs text-slate-400 flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" />
        <span>Abhishek OS Session Protected</span>
      </div>
    </div>
  );
};
