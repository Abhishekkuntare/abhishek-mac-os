import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Trash2, Calendar, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { sound } from '../../services/soundService';

export const NotificationCenter: React.FC = () => {
  const {
    showNotificationCenter,
    setShowNotificationCenter,
    notifications,
    dismissNotification,
    clearAllNotifications,
    openApp,
    settings,
  } = useOS();

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.glass-menubar')) {
          setShowNotificationCenter(false);
        }
      }
    };
    if (showNotificationCenter) {
      window.addEventListener('mousedown', handleOutside);
    }
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [showNotificationCenter, setShowNotificationCenter]);

  if (!showNotificationCenter) return null;

  const isLight = settings.theme === 'light';

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.2 }}
        className={`fixed top-10 right-3 bottom-20 w-84 z-50 p-4 rounded-3xl shadow-2xl flex flex-col backdrop-blur-3xl border select-none ${
          isLight
            ? 'glass-panel-light text-slate-800 border-white/60'
            : 'glass-panel text-white border-white/15'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-bold">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                {notifications.length}
              </span>
            )}
          </div>

          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <CheckCircle2 className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
              <p className="text-sm font-semibold text-slate-300">No New Notifications</p>
              <p className="text-xs text-slate-500 mt-0.5">You&apos;re completely up to date.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 border border-white/10 relative transition-all hover:bg-white/15"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {notif.type === 'calendar' ? (
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                    ) : notif.type === 'message' ? (
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span className="text-[11px] font-bold text-slate-300">
                      {notif.appName || 'Abhishek OS'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                </div>

                <div className="text-xs font-semibold text-white mb-0.5">{notif.title}</div>
                <div className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                  {notif.message}
                </div>

                {notif.appId && (
                  <button
                    onClick={() => {
                      if (notif.appId) openApp(notif.appId);
                      setShowNotificationCenter(false);
                      sound.playClick();
                    }}
                    className="mt-2 text-[10px] font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    Open {notif.appName} &rarr;
                  </button>
                )}

                <button
                  onClick={e => {
                    e.stopPropagation();
                    dismissNotification(notif.id);
                  }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Dismiss"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
