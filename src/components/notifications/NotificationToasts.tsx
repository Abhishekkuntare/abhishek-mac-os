import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Calendar, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import type { NotificationItem } from '../../types/desktop';

const TOAST_DURATION_MS = 6500;
const MAX_VISIBLE_TOASTS = 3;

const NotificationToast = ({
  notification,
  style,
  onDismiss,
  onOpen,
}: {
  notification: NotificationItem;
  style: 'glass' | 'midnight' | 'aurora';
  onDismiss: (id: string) => void;
  onOpen: (notification: NotificationItem) => void;
}) => {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timeout = window.setTimeout(() => onDismiss(notification.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [notification.id, onDismiss, paused]);

  const Icon = notification.type === 'calendar'
    ? Calendar
    : notification.type === 'message'
      ? MessageCircle
      : notification.type === 'system'
        ? CheckCircle2
        : AlertCircle;
  const surfaces = {
    glass: 'border-white/[0.16] bg-slate-950/[0.62] shadow-[0_16px_50px_rgba(0,0,0,.3)]',
    midnight: 'border-white/[0.1] bg-[#11131a]/90 shadow-[0_16px_50px_rgba(0,0,0,.42)]',
    aurora: 'border-sky-200/[0.2] bg-[linear-gradient(125deg,rgba(14,116,144,.58),rgba(76,29,149,.55),rgba(8,12,24,.78))] shadow-[0_16px_50px_rgba(0,0,0,.34)]',
  }[style];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: 42, y: -6, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 30, scale: 0.96, filter: 'blur(6px)' }}
      transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
      onHoverStart={() => setPaused(true)}
      onHoverEnd={() => setPaused(false)}
      className={`pointer-events-auto group relative w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[20px] border p-3.5 text-white backdrop-blur-2xl ${surfaces}`}
      style={{ WebkitBackdropFilter: 'blur(24px) saturate(160%)' }}
      role="status"
      aria-live="polite"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/[0.11] via-white/[0.025] to-transparent"
        initial={false}
        animate={{ opacity: paused ? 0.9 : 0.55 }}
        transition={{ duration: 0.2 }}
      />
      <div className="relative flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.09] text-sky-200 shadow-[inset_0_1px_0_rgba(255,255,255,.12)]">
          <Icon className="h-4 w-4" />
        </span>
        <button
          type="button"
          className="min-w-0 flex-1 text-left outline-none"
          onClick={() => onOpen(notification)}
          disabled={!notification.appId}
          aria-label={notification.appId ? `Open ${notification.appName ?? notification.title}` : undefined}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="truncate text-[10px] font-semibold tracking-wide text-slate-300">{notification.appName || 'ARLO OS'}</span>
            <span className="shrink-0 text-[9px] text-slate-400">{notification.timestamp}</span>
          </span>
          <span className="mt-1 block text-[13px] font-semibold leading-snug tracking-tight">{notification.title}</span>
          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-slate-200/85">{notification.message}</span>
        </button>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(notification.id)}
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/55 text-slate-300 opacity-0 shadow-md transition duration-200 hover:bg-white/20 hover:text-white focus:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-sky-200/50 via-white/25 to-transparent"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: paused ? 1 : 0 }}
        transition={{ duration: TOAST_DURATION_MS / 1000, ease: 'linear' }}
      />
    </motion.article>
  );
};

export const NotificationToasts = () => {
  const { notifications, settings, setShowNotificationCenter, openApp } = useOS();
  const seenNotificationIds = useRef(new Set(notifications.map(notification => notification.id)));
  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const activeNotificationIds = new Set(notifications.map(notification => notification.id));
    setToasts(current => current.filter(notification => activeNotificationIds.has(notification.id)));

    const freshNotifications = notifications.filter(notification => {
      if (seenNotificationIds.current.has(notification.id)) return false;
      seenNotificationIds.current.add(notification.id);
      return true;
    });

    if (!settings.doNotDisturb && freshNotifications.length > 0) {
      setToasts(current => [...freshNotifications.reverse(), ...current].slice(0, MAX_VISIBLE_TOASTS));
    }
  }, [notifications, settings.doNotDisturb]);

  const dismissToast = useCallback((id: string) => {
    setToasts(current => current.filter(notification => notification.id !== id));
  }, []);

  const openNotification = useCallback((notification: NotificationItem) => {
    if (notification.appId) {
      openApp(notification.appId);
      setShowNotificationCenter(false);
    }
    dismissToast(notification.id);
  }, [dismissToast, openApp, setShowNotificationCenter]);

  return (
    <div className="pointer-events-none fixed right-4 top-12 z-[13000] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            style={settings.notificationStyle}
            onDismiss={dismissToast}
            onOpen={openNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
