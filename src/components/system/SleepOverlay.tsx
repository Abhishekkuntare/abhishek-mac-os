import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useOS } from '../../context/OSContext';

export const SleepOverlay: React.FC = () => {
  const { isSleeping, wakeSystem } = useOS();

  useEffect(() => {
    if (!isSleeping) return;
    const handleWake = () => {
      wakeSystem();
    };
    window.addEventListener('keydown', handleWake);
    window.addEventListener('mousedown', handleWake);
    return () => {
      window.removeEventListener('keydown', handleWake);
      window.removeEventListener('mousedown', handleWake);
    };
  }, [isSleeping, wakeSystem]);

  if (!isSleeping) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center select-none cursor-pointer"
    >
      <div className="text-center text-slate-500 text-xs font-mono animate-pulse">
        Press any key or click to wake Abhishek OS
      </div>
    </motion.div>
  );
};
