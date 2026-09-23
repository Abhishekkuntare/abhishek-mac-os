import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useOS } from '../../context/OSContext';

export const BootScreen: React.FC = () => {
  const { isBooting } = useOS();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isBooting) {
      setProgress(0);
      return;
    }
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 4;
      });
    }, 90);
    return () => clearInterval(interval);
  }, [isBooting]);

  if (!isBooting) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center select-none text-white">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-pink-500 flex items-center justify-center shadow-2xl p-0.5 mb-8"
      >
        <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
          <svg className="w-12 h-12 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
          </svg>
        </div>
      </motion.div>

      <div className="w-64 h-1.5 rounded-full bg-white/10 overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-slate-400 font-mono tracking-wider">
        Starting Abhishek OS...
      </p>
    </div>
  );
};
