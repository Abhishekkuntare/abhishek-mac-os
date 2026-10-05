import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownRight, ArrowUp, AudioLines, Bot, Grip, Mic, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { detectGhostCommandLanguage, executeGhostCommand, PendingCreateType } from '../../services/ghostCommands';
import { runGhostChat } from '../../services/ghostChatClient';
import { GhostChatError } from '../../types/ghostAgent';
import type { GhostToolHost } from '../../types/ghostAgent';
import { configureGhostUtterance, type GhostSpeechLanguage } from '../../services/ghostVoice';
import { matchGhostWakePhrase } from '../../services/ghostWakePhrases';
import { createGhostDesktopItem, getGhostLocalTime } from '../../services/ghostDesktopActions';
import { APP_REGISTRY } from '../../data/defaultApps';
import { AppIcon } from './AppIcon';
import { vfs } from '../../services/virtualFileSystem';

interface QuickMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PanelPosition {
  x: number;
  y: number;
}

export const GhostAssistantOverlay: React.FC = () => {
  const {
    isLocked,
    isSleeping,
    isShuttingDown,
    showGhostAssistant,
    setShowGhostAssistant,
    settings,
    user,
    openApp,
    showDesktop,
    updateSettings,
    windows,
    closeWindow,
  } = useOS();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wakeStatus, setWakeStatus] = useState<'starting' | 'ready' | 'paused' | 'stopped' | 'error'>(
    settings.ghostWakeEnabled ? 'starting' : 'stopped',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(440);
  const [panelHeight, setPanelHeight] = useState(520);
  const [orbSize, setOrbSize] = useState(88);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{ pointerId: number; x: number; y: number; width: number; height: number; orbSize: number } | null>(null);
  const skipOrbClickRef = useRef(false);
  const activeConversationRef = useRef(false);
  const pausedRecognitionRef = useRef(false);
  const wakeStateRequestRef = useRef<Promise<void>>(Promise.resolve());
  const pendingCreateRef = useRef<PendingCreateType | undefined>(undefined);
  const conversationLanguageRef = useRef<GhostSpeechLanguage>('en');
  const conversationTimerRef = useRef<number | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const userRef = useRef(user);
  const voiceRef = useRef(settings.ghostVoice);
  userRef.current = user;
  voiceRef.current = settings.ghostVoice;
  const shortcut = settings.ghostShortcut;

  const movePanelToSide = (width = panelWidth, height = panelHeight) => {
    const actualWidth = isCollapsed ? orbSize : Math.min(width, window.innerWidth - 32);
    const actualHeight = isCollapsed ? orbSize : height;
    setPanelPosition({
      x: Math.max(16, window.innerWidth - actualWidth - 24),
      y: Math.max(40, Math.min(88, window.innerHeight - actualHeight - 16)),
    });
  };

  const openAppFromGhost = (appId: string) => {
    if (!Object.hasOwn(APP_REGISTRY, appId) || !APP_REGISTRY[appId].installed || appId === 'trash') return false;
    openApp(appId);
    setIsCollapsed(true);
    window.setTimeout(() => movePanelToSide(orbSize, orbSize), 160);
    return true;
  };

  const closeAppFromGhost = (appId: string) => {
    const target = [...windows].reverse().find(win =>
      (appId ? win.appId === appId : win.isFocused) && !win.isMinimized,
    );
    if (!target) return false;
    closeWindow(target.id);
    return true;
  };

  const ghostToolHost: GhostToolHost = {
    openApp: openAppFromGhost,
    closeApp: closeAppFromGhost,
    createDesktopItem: createGhostDesktopItem,
    showDesktop,
    getLocalTime: getGhostLocalTime,
    getBatteryStatus: () => ({
      available: settings.batteryAvailable,
      level: settings.batteryLevel,
      charging: settings.batteryCharging,
      plugged: settings.batteryPlugged,
    }),
    setFocusMode: enabled => updateSettings({ doNotDisturb: enabled }),
  };

  const beginPanelDrag = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('[data-no-drag], input')) return;
    const bounds = panelRef.current?.getBoundingClientRect();
    if (!bounds) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: bounds.left,
      top: bounds.top,
      moved: false,
    };
    setPanelPosition({ x: bounds.left, y: bounds.top });
  };

  const movePanelDrag = (event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 6) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const bounds = panelRef.current?.getBoundingClientRect();
    const width = bounds?.width ?? (isCollapsed ? orbSize : panelWidth);
    const height = bounds?.height ?? (isCollapsed ? orbSize : 520);
    setPanelPosition({
      x: Math.max(12, Math.min(window.innerWidth - width - 12, drag.left + event.clientX - drag.x)),
      y: Math.max(12, Math.min(window.innerHeight - height - 12, drag.top + event.clientY - drag.y)),
    });
  };

  const endPanelDrag = (event: React.PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      skipOrbClickRef.current = dragRef.current.moved;
      dragRef.current = null;
      window.setTimeout(() => { skipOrbClickRef.current = false; }, 100);
    }
  };

  const beginPanelResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: panelWidth,
      height: panelHeight,
      orbSize,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const movePanelResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (isCollapsed) {
      const delta = (event.clientX - resize.x + event.clientY - resize.y) / 2;
      setOrbSize(Math.max(64, Math.min(152, resize.orbSize + delta)));
      return;
    }
    const nextWidth = Math.max(360, Math.min(Math.min(720, window.innerWidth - 24), resize.width + event.clientX - resize.x));
    const nextHeight = Math.max(360, Math.min(Math.min(760, window.innerHeight - 32), resize.height + event.clientY - resize.y));
    setPanelWidth(nextWidth);
    setPanelHeight(nextHeight);
    setPanelPosition(position => position ? {
      x: Math.max(12, Math.min(window.innerWidth - nextWidth - 12, position.x)),
      y: Math.max(12, Math.min(window.innerHeight - nextHeight - 12, position.y)),
    } : position);
  };
  const endPanelResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (resizeRef.current?.pointerId === event.pointerId) {
      resizeRef.current = null;
      setIsResizing(false);
    }
  };
  const expandPanel = () => {
    setPanelPosition(position => position ? {
      ...position,
      x: Math.max(12, Math.min(
        window.innerWidth - panelWidth - 12,
        position.x + orbSize - panelWidth,
      )),
    } : position);
    setIsCollapsed(false);
    window.setTimeout(() => inputRef.current?.focus(), 120);
  };

  useEffect(() => {
    if (showGhostAssistant && !panelPosition) setIsCollapsed(false);
  }, [showGhostAssistant, panelPosition]);

  useEffect(() => {
    if (!isCollapsed) return;
    setPanelPosition(position => position ? {
      x: Math.max(12, Math.min(window.innerWidth - orbSize - 12, position.x)),
      y: Math.max(12, Math.min(window.innerHeight - orbSize - 12, position.y)),
    } : position);
  }, [isCollapsed, orbSize]);

  useEffect(() => () => {
    if (activeRequestIdRef.current) {
      void window.electronAPI?.ghostAICancelChat(activeRequestIdRef.current).catch(error => {
        console.error('[Ghost AI] Could not cancel the pending request:', error);
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onGhostAIToggle(() => {
      if (isLocked || isSleeping || isShuttingDown) return;
      setShowGhostAssistant(!showGhostAssistant);
    });
    return () => unsubscribe?.();
  }, [isLocked, isShuttingDown, isSleeping, showGhostAssistant, setShowGhostAssistant]);

  useEffect(() => {
    if (!window.electronAPI?.ghostAISetGlobalShortcut) return;
    let cancelled = false;
    window.electronAPI.ghostAISetGlobalShortcut(shortcut).then(registered => {
      if (!cancelled && !registered) {
        setErrorMessage('That keyboard shortcut is already used by another app. Choose a different one in Settings.');
      }
    }).catch(error => {
      console.error('[Ghost AI] Could not register the global shortcut:', error);
      if (!cancelled) setErrorMessage('Ghost could not register its global keyboard shortcut.');
    });
    return () => {
      cancelled = true;
    };
  }, [shortcut]);

  useEffect(() => {
    let cancelled = false;
    if (!window.electronAPI?.ghostAIIsConfigured) {
      setIsConfigured(false);
      return;
    }
    window.electronAPI.ghostAIIsConfigured().then(configured => {
      if (!cancelled) setIsConfigured(configured);
    }).catch(error => {
      console.error('[Ghost AI] Could not check the Gemini configuration:', error);
      if (!cancelled) {
        setIsConfigured(false);
        setErrorMessage('Ghost could not check its AI connection. Open the Ghost AI app to review its configuration.');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showGhostAssistant || isLocked || isSleeping || isShuttingDown) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [showGhostAssistant, isLocked, isShuttingDown, isSleeping]);

  const pauseWakeListener = (paused: boolean) => {
    const api = window.electronAPI?.ghostAISetWakePaused;
    const request = wakeStateRequestRef.current.then(async () => {
      if (pausedRecognitionRef.current === paused) return;
      if (api) await api(paused);
      pausedRecognitionRef.current = paused;
    });
    wakeStateRequestRef.current = request.catch(error => {
      console.error('[Ghost AI] Could not update local wake listener state:', error);
    });
    return wakeStateRequestRef.current;
  };

  useEffect(() => {
    if (showGhostAssistant) return;
    activeConversationRef.current = false;
    pendingCreateRef.current = undefined;
    if (conversationTimerRef.current !== null) {
      window.clearTimeout(conversationTimerRef.current);
      conversationTimerRef.current = null;
    }
  }, [showGhostAssistant]);

  const closeAssistant = () => {
    activeConversationRef.current = false;
    pendingCreateRef.current = undefined;
    if (conversationTimerRef.current !== null) {
      window.clearTimeout(conversationTimerRef.current);
      conversationTimerRef.current = null;
    }
    setPanelPosition(null);
    setIsCollapsed(false);
    setShowGhostAssistant(false);
  };

  const armConversationTimeout = () => {
    activeConversationRef.current = true;
    if (conversationTimerRef.current !== null) {
      window.clearTimeout(conversationTimerRef.current);
    }
    conversationTimerRef.current = window.setTimeout(() => {
      activeConversationRef.current = false;
      pendingCreateRef.current = undefined;
      setIsCollapsed(true);
      window.setTimeout(() => movePanelToSide(orbSize, orbSize), 0);
    }, 12_000);
  };

  const speak = (text: string, onEnd?: () => void) => {
    const resumeRecognition = () => {
      void pauseWakeListener(false).then(() => onEnd?.());
    };
    if (!settings.ghostVoiceResponses || !('speechSynthesis' in window)) {
      resumeRecognition();
      return;
    }
    void pauseWakeListener(true).then(() => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      configureGhostUtterance(utterance, settings.ghostVoice, conversationLanguageRef.current);
      utterance.onend = resumeRecognition;
      utterance.onerror = resumeRecognition;
      utterance.onstart = () => {
        if (conversationTimerRef.current !== null) {
          window.clearTimeout(conversationTimerRef.current);
          conversationTimerRef.current = null;
        }
      };
      window.speechSynthesis.speak(utterance);
    });
  };

  const addAssistantMessage = (content: string, onEnd?: () => void) => {
    setMessages(current => [...current, { role: 'assistant', content }]);
    speak(content, onEnd);
  };

  const submitPrompt = async (value = prompt, isWakeCommand = false, recognizedLanguage?: string) => {
    const content = value.trim();
    if (!content || isThinking) return;
    conversationLanguageRef.current = detectGhostCommandLanguage(content, recognizedLanguage);
    setPrompt('');
    setErrorMessage('');
    setErrorDetails('');
    setMessages(current => [...current, { role: 'user', content }]);
    setIsThinking(true);
    const requestId = crypto.randomUUID();
    activeRequestIdRef.current = requestId;

    try {
      const commandReply = await executeGhostCommand(content, {
        openApp: openAppFromGhost,
        closeApp: closeAppFromGhost,
        showDesktop,
        createDesktopItem: createGhostDesktopItem,
        updateSettings,
        renameDesktopItem: (name, newName) => {
          const target = vfs.getFiles('/Users/abhishek/Desktop')
            .find(file => file.name.toLocaleLowerCase() === name.toLocaleLowerCase());
          if (!target) return null;
          if (!newName.trim() || newName.length > 100 || /[\\/]/.test(newName)) {
            throw new Error('Desktop names must be 1–100 characters and cannot contain slashes.');
          }
          if (!vfs.rename(target.id, newName)) throw new Error(`Could not rename "${name}".`);
          return `Renamed "${name}" to "${newName}".`;
        },
        deleteDesktopItem: name => {
          const target = vfs.getFiles('/Users/abhishek/Desktop')
            .find(file => file.name.toLocaleLowerCase() === name.toLocaleLowerCase());
          if (!target) return null;
          if (!vfs.moveToTrash(target.id)) throw new Error(`Could not move "${name}" to Trash.`);
          return `Moved "${name}" to Trash. You can restore it from Trash or undo with Ctrl+Z.`;
        },
        getBatteryStatus: () => ({
          available: settings.batteryAvailable,
          level: settings.batteryLevel,
          charging: settings.batteryCharging,
          plugged: settings.batteryPlugged,
        }),
      }, pendingCreateRef.current, recognizedLanguage);
      if (commandReply) {
        pendingCreateRef.current = commandReply.pendingCreate;
        addAssistantMessage(commandReply.reply, isWakeCommand ? () => armConversationTimeout() : undefined);
        return;
      }

      if (settings.ghostWakeEnabled) await pauseWakeListener(true);
      const conversation = [...messages, { role: 'user' as const, content }];
      const answer = await runGhostChat(conversation.slice(-20), user.displayName, ghostToolHost, requestId);
      addAssistantMessage(answer, isWakeCommand ? () => armConversationTimeout() : undefined);
    } catch (error) {
      if (error instanceof GhostChatError) {
        console.error('[Ghost AI] The quick assistant request failed:', error.code);
        setErrorMessage(error.message);
        setErrorDetails(error.details ?? '');
        if (isWakeCommand) addAssistantMessage(error.message, () => armConversationTimeout());
      } else {
        console.error('[Ghost AI] The quick assistant command failed:', error);
        const message = error instanceof Error ? error.message : 'Ghost could not complete that request.';
        setErrorMessage(message);
        setErrorDetails('');
        if (isWakeCommand) addAssistantMessage(message, () => armConversationTimeout());
      }
    } finally {
      if (activeRequestIdRef.current === requestId) activeRequestIdRef.current = null;
      setIsThinking(false);
    }
  };

  const submitPromptRef = useRef(submitPrompt);
  submitPromptRef.current = submitPrompt;

  useEffect(() => {
    const api = window.electronAPI;
    if (!settings.ghostWakeEnabled || isLocked || isSleeping || isShuttingDown) {
      activeConversationRef.current = false;
      setIsListening(false);
      if (!settings.ghostWakeEnabled) {
        setWakeStatus('stopped');
        void api?.ghostAIStopWakeListener().catch(error => {
          console.error('[Ghost AI] Could not stop the disabled wake listener:', error);
        });
      }
      return;
    }
    if (!api?.ghostAIStartWakeListener || !api.onGhostAITranscript || !api.onGhostAIWakeState) {
      setErrorMessage('Hey Ghost voice activation requires the installed Windows desktop app.');
      return;
    }

    let active = true;
    const unsubscribeTranscript = api.onGhostAITranscript(transcript => {
      if (!active || pausedRecognitionRef.current) return;
      const heard = transcript.text.trim();
      if (!heard) return;
      conversationLanguageRef.current = transcript.language === 'hi' || transcript.language === 'mr'
        ? transcript.language
        : 'en';

      if (!activeConversationRef.current) {
        const wakeMatch = matchGhostWakePhrase(heard, voiceRef.current);
        if (!wakeMatch) return;
        activeConversationRef.current = true;
        setPanelPosition(null);
        setIsCollapsed(false);
        setShowGhostAssistant(true);
        setErrorMessage('');
        void api.ghostAIWakeDetected().catch(error => {
          console.error('[Ghost AI] Could not focus ARLO OS after wake phrase:', error);
        });
        const assistantName = voiceRef.current === 'lily' ? 'Lily' : 'Brad';
        const greeting = conversationLanguageRef.current === 'hi'
          ? `नमस्ते ${userRef.current.displayName}, मैं ${assistantName} हूँ। आप मुझे ${assistantName} कह सकते हैं। बताइए, मैं क्या करूँ?`
          : conversationLanguageRef.current === 'mr'
            ? `नमस्कार ${userRef.current.displayName}, मी ${assistantName} आहे. तुम्ही मला ${assistantName} म्हणू शकता. मी काय मदत करू?`
            : `Hi, ${userRef.current.displayName}. I'm ${assistantName}; you can call me ${assistantName}. What can I do for you?`;
        setMessages(current => [...current, { role: 'assistant', content: greeting }]);
        speak(greeting, () => {
          armConversationTimeout();
          const followUp = wakeMatch.command;
          if (followUp) void submitPromptRef.current(followUp, true, transcript.language);
        });
        return;
      }

      if (conversationTimerRef.current !== null) {
        window.clearTimeout(conversationTimerRef.current);
        conversationTimerRef.current = null;
      }
      void submitPromptRef.current(heard, true, transcript.language);
    });

    const unsubscribeState = api.onGhostAIWakeState(state => {
      if (!active) return;
      if (state.status === 'ready') {
        setWakeStatus('ready');
        setIsListening(true);
        setErrorMessage('');
      } else if (state.status === 'paused' || state.status === 'starting') {
        setWakeStatus(state.status);
        setIsListening(false);
      } else if (state.status === 'stopped') {
        setWakeStatus('stopped');
        setIsListening(false);
      } else if (state.status === 'error') {
        setWakeStatus('error');
        setIsListening(false);
        setErrorMessage(`Local Hey Ghost recognition failed${state.message ? `: ${state.message}` : '.'}`);
      }
    });

    const wakeListenerStartTimer = window.setTimeout(() => {
      void api.ghostAIStartWakeListener().catch(error => {
        console.error('[Ghost AI] Could not start local wake-word detection:', error);
        if (active) {
          setWakeStatus('error');
          setIsListening(false);
          setErrorMessage(error instanceof Error ? error.message : 'Could not start local microphone recognition.');
        }
      });
    }, 1200);

    return () => {
      active = false;
      window.clearTimeout(wakeListenerStartTimer);
      activeConversationRef.current = false;
      pausedRecognitionRef.current = false;
      if (conversationTimerRef.current !== null) {
        window.clearTimeout(conversationTimerRef.current);
        conversationTimerRef.current = null;
      }
      unsubscribeTranscript();
      unsubscribeState();
      void api.ghostAIStopWakeListener().catch(error => {
        console.error('[Ghost AI] Could not stop local wake-word detection:', error);
      });
    };
  }, [
    settings.ghostWakeEnabled,
    isLocked,
    isSleeping,
    isShuttingDown,
    setShowGhostAssistant,
  ]);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
  }, []);

  const shortcutLabel = shortcut === 'ctrl-shift-space'
    ? 'Ctrl + Shift + Space'
    : shortcut === 'ctrl-alt-space'
      ? 'Ctrl + Alt + Space'
      : 'Ctrl + Shift + G';

  return (
    <>
      {settings.ghostWakeEnabled && !showGhostAssistant && !isLocked && !isSleeping && !isShuttingDown && (
        <button
          type="button"
          role="status"
          aria-label={wakeStatus === 'ready' ? 'Ghost is listening for Hey Ghost' : `Ghost wake listener ${wakeStatus}`}
          onClick={() => setShowGhostAssistant(true)}
          title={wakeStatus === 'error' ? 'Ghost voice listener needs attention' : 'Open Ghost assistant'}
          className="group fixed bottom-6 right-6 z-[99998] flex h-14 w-14 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
        >
          <span className={`absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,.55),transparent_22%),radial-gradient(ellipse_at_30%_40%,rgba(232,87,255,.95),transparent_48%),radial-gradient(ellipse_at_67%_42%,rgba(47,220,255,.9),transparent_51%),radial-gradient(ellipse_at_50%_75%,rgba(73,99,255,.92),transparent_56%),#101026] shadow-[0_0_28px_rgba(117,101,255,.55)] transition-transform duration-300 group-hover:scale-110`} />
          <motion.span
            aria-hidden="true"
            className="absolute inset-[3px] rounded-full border border-white/35"
            animate={wakeStatus === 'ready' ? { scale: [1, 1.12, 1], opacity: [0.5, 0.12, 0.5] } : { scale: 1, opacity: 0.45 }}
            transition={{ duration: 2.2, repeat: wakeStatus === 'ready' ? Infinity : 0, ease: 'easeInOut' }}
          />
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/35 text-white/90 backdrop-blur-sm">
            {wakeStatus === 'error' ? <Mic size={15} className="text-rose-200" /> : <AudioLines size={17} />}
          </span>
          <span className="sr-only">
            {wakeStatus === 'ready' ? 'Hey Ghost · listening locally' : wakeStatus === 'error' ? 'Wake listener error' : wakeStatus === 'paused' ? 'Ghost is speaking' : wakeStatus === 'stopped' ? 'Wake listener off' : 'Wake listener starting'}
          </span>
        </button>
      )}
      <AnimatePresence>
      {showGhostAssistant && !isLocked && !isSleeping && !isShuttingDown && (
        <div className={`fixed inset-0 z-[100000] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh] ${panelPosition ? 'pointer-events-none' : ''}`}>
          {!panelPosition && (
            <motion.button
              type="button"
              aria-label="Close Ghost assistant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAssistant}
              className="absolute inset-0 cursor-default bg-slate-950/20 backdrop-blur-[2px]"
            />
          )}
          <motion.section
            ref={panelRef}
            role="dialog"
            aria-modal={!panelPosition}
            aria-label="Ghost AI assistant"
            onPointerDown={beginPanelDrag}
            onPointerMove={movePanelDrag}
            onPointerUp={endPanelDrag}
            onPointerCancel={endPanelDrag}
            initial={{ opacity: 0, y: -14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            style={{
              ...(panelPosition ? {
                position: 'fixed' as const,
                left: panelPosition.x,
                top: panelPosition.y,
                width: isCollapsed ? orbSize : Math.min(panelWidth, window.innerWidth - 32),
                height: isCollapsed ? orbSize : Math.min(panelHeight, window.innerHeight - 32),
              } : {}),
              ...(!panelPosition && !isCollapsed ? {
                width: Math.min(panelWidth, window.innerWidth - 32),
                height: Math.min(panelHeight, window.innerHeight - 32),
              } : {}),
              ...(isCollapsed ? { height: orbSize } : {}),
            }}
            className={`pointer-events-auto relative z-10 flex max-h-[min(760px,calc(100vh-32px))] flex-col border border-sky-200/15 bg-[#0a1320]/95 text-slate-100 shadow-[0_30px_100px_rgba(0,0,0,.55),0_0_60px_rgba(14,165,233,.1)] backdrop-blur-2xl ${
              isResizing ? 'transition-none' : 'transition-[width,height,border-radius] duration-300 ease-out'
            } ${
              isCollapsed
                ? 'items-center justify-center overflow-visible rounded-full'
                : 'w-full max-w-[680px] overflow-hidden rounded-[26px]'
            }`}
          >
            {isCollapsed ? (
              <div className="relative flex h-full w-full items-center justify-center">
                <button
                  type="button"
                  aria-label="Expand Ghost assistant"
                  title="Open Ghost · drag to move"
                  onClick={() => {
                    if (skipOrbClickRef.current) {
                      skipOrbClickRef.current = false;
                      return;
                    }
                    expandPanel();
                  }}
                  className="relative flex h-[calc(100%-12px)] w-[calc(100%-12px)] touch-none cursor-grab items-center justify-center rounded-full border border-white/25 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,.58),transparent_21%),radial-gradient(ellipse_at_30%_42%,rgba(232,87,255,.92),transparent_49%),radial-gradient(ellipse_at_67%_42%,rgba(47,220,255,.9),transparent_52%),radial-gradient(ellipse_at_50%_75%,rgba(73,99,255,.95),transparent_58%),#100e2b] shadow-[0_0_34px_rgba(117,101,255,.5),inset_0_0_18px_rgba(255,255,255,.12)] transition hover:scale-105 active:cursor-grabbing"
                >
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-[4px] rounded-full border border-white/40"
                    animate={isListening || isThinking ? { scale: [1, 1.15, 1], opacity: [0.65, 0.16, 0.65], rotate: [0, 45, 90] } : { scale: 1, opacity: 0.45 }}
                    transition={{ duration: isThinking ? 1.3 : 2.1, repeat: isListening || isThinking ? Infinity : 0, ease: 'easeInOut' }}
                  />
                  <motion.span
                    aria-hidden="true"
                    className="absolute h-[54%] w-[54%] rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,.95),rgba(151,225,255,.68)_18%,rgba(127,94,255,.42)_48%,rgba(236,91,255,.38)_68%,transparent_74%)] blur-[1px]"
                    animate={{ scale: isThinking ? [0.92, 1.1, 0.92] : [0.98, 1.04, 0.98], rotate: [0, 12, 0] }}
                    transition={{ duration: isThinking ? 1.1 : 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <AudioLines className="relative h-[24%] w-[24%] text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,.8)]" />
                  <span className="sr-only">{isThinking ? 'Ghost is thinking' : isListening ? 'Ghost is listening' : 'Ghost AI'}</span>
                </button>
                <button
                  type="button"
                  data-no-drag
                  aria-label="Close Ghost assistant"
                  onClick={closeAssistant}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-slate-900 text-slate-400 shadow-lg transition hover:text-white"
                >
                  <X size={12} />
                </button>
                <button
                  type="button"
                  data-no-drag
                  aria-label="Drag to resize Ghost"
                  title="Drag to resize"
                  onPointerDown={beginPanelResize}
                  onPointerMove={movePanelResize}
                  onPointerUp={endPanelResize}
                  onPointerCancel={endPanelResize}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-nwse-resize touch-none items-center justify-center rounded-full border border-white/35 bg-slate-950/90 text-white/75 shadow-lg hover:text-white"
                >
                  <Grip size={12} />
                </button>
              </div>
            ) : (
            <>
            <header
              className="flex h-[68px] shrink-0 touch-none cursor-grab items-center gap-3 border-b border-white/[0.07] px-5 active:cursor-grabbing"
              title="Drag Ghost to move it"
            >
              <div className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-sky-200/25 bg-sky-300/10 shadow-[0_0_24px_rgba(56,189,248,.18)] ${isListening ? 'animate-pulse' : ''}`}>
                <AppIcon appId="ghostai" className="h-full w-full object-contain" />
                {isListening && <span className="absolute inset-0 rounded-full border-2 border-sky-300/70 animate-ping" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold text-white">Ghost AI</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {wakeStatus === 'error'
                    ? <span className="text-rose-300">Local microphone error</span>
                    : isListening
                      ? <span className="text-rose-300">Microphone active · listening locally</span>
                      : isThinking
                        ? 'Thinking…'
                        : `Ready · ${shortcutLabel}`}
                </p>
              </div>
              <button
                type="button"
                data-no-drag
                aria-label="Minimize Ghost to orb"
                onClick={() => {
                  setIsCollapsed(true);
                  window.setTimeout(() => movePanelToSide(orbSize, orbSize), 0);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowDownRight size={15} />
              </button>
              <button
                type="button"
                data-no-drag
                onClick={() => { openApp('ghostai'); closeAssistant(); }}
                className="ml-auto rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[10px] text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100"
              >
                Open Ghost AI
              </button>
              <button type="button" data-no-drag onClick={closeAssistant} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white" aria-label="Close">
                <X size={15} />
              </button>
            </header>

            <div className="min-h-[130px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-sky-200/15 bg-[radial-gradient(circle_at_35%_30%,rgba(125,211,252,.3),rgba(14,116,144,.14)_45%,rgba(8,47,73,.28))] shadow-[0_0_36px_rgba(14,165,233,.14)]">
                    <AudioLines size={22} className="text-sky-200" />
                  </div>
                  <p className="text-[14px] font-medium text-slate-100">What can I help you with?</p>
                  <p className="mt-1 text-[11px] text-slate-500">Try “Open Music”, “Create a folder named Projects”, or “What’s my battery?”.</p>
                </div>
              ) : messages.slice(-8).map((message, index) => (
                <div key={`${index}-${message.role}-${message.content.slice(0, 12)}`} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-300/10 text-sky-200"><Bot size={13} /></span>}
                  <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[12px] leading-5 ${message.role === 'user' ? 'rounded-br-md bg-sky-300/15 text-slate-100' : 'rounded-bl-md border border-white/[0.06] bg-white/[0.04] text-slate-300'}`}>
                    {message.content}
                  </p>
                </div>
              ))}
              {isThinking && <p className="pl-9 text-[11px] text-sky-200/70">Ghost is working…</p>}
            </div>

            {errorMessage && (
              <div role="alert" className="mx-5 mb-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.06] px-3 py-2 text-[10px] leading-4 text-rose-200">
                <p>{errorMessage}</p>
                {errorDetails && (
                  <details className="mt-1 text-[9px] text-rose-100/60">
                    <summary className="cursor-pointer select-none">Technical details</summary>
                    <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono">{errorDetails}</pre>
                  </details>
                )}
              </div>
            )}

            <form
              className="flex shrink-0 items-center gap-2 border-t border-white/[0.07] p-4"
              onSubmit={event => { event.preventDefault(); void submitPrompt(); }}
            >
              <div
                role="status"
                aria-label={isListening ? 'Microphone listening for Hey Ghost' : 'Wake listener starting'}
                title={wakeStatus === 'error' ? 'Local speech recognition error' : isListening ? 'Listening locally for “Hey Ghost”' : 'Starting local wake-word listener'}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isListening ? 'border-rose-300/20 bg-rose-300/[0.06] text-rose-200' : 'border-white/[0.08] bg-white/[0.035] text-amber-200'}`}
              >
                <Mic size={16} />
              </div>
              <input
                ref={inputRef}
                value={prompt}
                onChange={event => setPrompt(event.target.value)}
                placeholder="Ask Ghost or tell it what to open…"
                className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 text-[12px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-300/25"
                aria-label="Ask Ghost AI"
              />
              <button type="submit" data-no-drag disabled={!prompt.trim() || isThinking} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300 text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-600" aria-label="Send to Ghost">
                <ArrowUp size={17} />
              </button>
            </form>
            <footer className="px-5 pb-3 text-center text-[9px] text-slate-600">
              Say “Hey Ghost” or your selected voice name. English, Hindi, and Marathi speech recognition runs locally; recognized text is sent to Gemini only for requests that need AI.
            </footer>
            <button
              type="button"
              data-no-drag
              aria-label="Drag to resize Ghost panel"
              title="Drag to resize"
              onPointerDown={beginPanelResize}
              onPointerMove={movePanelResize}
              onPointerUp={endPanelResize}
              onPointerCancel={endPanelResize}
              className="absolute bottom-1 right-1 z-10 flex h-6 w-6 cursor-nwse-resize touch-none items-center justify-center rounded-full border border-white/20 bg-slate-950/90 text-white/60 transition hover:text-white"
            >
              <Grip size={12} />
            </button>
            </>
            )}
          </motion.section>
        </div>
      )}
      </AnimatePresence>
    </>
  );
};
