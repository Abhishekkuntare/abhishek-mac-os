import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownRight, ArrowUp, Grip, Mic, X } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { detectGhostCommandLanguage, executeGhostCommand, PendingCreateType } from '../../services/ghostCommands';
import { runGhostChat } from '../../services/ghostChatClient';
import { configureGhostUtterance } from '../../services/ghostVoice';
import { GhostChatError } from '../../types/ghostAgent';
import type { GhostToolHost } from '../../types/ghostAgent';
import { requestNotchCameraCapture } from '../../services/notchCameraBridge';
import { isMeaningfulGhostTranscript, matchGhostWakePhrase } from '../../services/ghostWakePhrases';
import {
  createGhostDesktopItem,
  deleteGhostDesktopItem,
  getGhostLocalTime,
  renameGhostDesktopItem,
  searchGhostAuthorizedFiles,
} from '../../services/ghostDesktopActions';
import { APP_REGISTRY } from '../../data/defaultApps';
import { routeGhostRequest } from '../../services/ghostOrchestrator';
import { AppIcon } from './AppIcon';
import { DetectiveAvatar } from './DetectiveAvatar';
import { GhostActivityFeed } from './GhostActivityFeed';
import {
  DETECTIVES,
  DETECTIVE_CONFIG_UPDATED_EVENT,
  getDetective,
  loadDetectiveConfig,
  saveDetectiveConfig,
  type DetectiveConfig,
} from './detectiveModel';

const DETECTIVE_APPS = Object.values(APP_REGISTRY)
  .filter(app => app.installed && app.id !== 'trash')
  .sort((left, right) => left.name.localeCompare(right.name));

interface QuickMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface PanelPosition {
  x: number;
  y: number;
}

const LilyOrb: React.FC<{ active: boolean }> = ({ active }) => (
  <span className="relative isolate block h-full w-full overflow-hidden rounded-full bg-[#080718] shadow-[0_0_34px_rgba(138,91,255,.42),inset_0_0_18px_rgba(255,255,255,.14)]">
    <motion.span
      aria-hidden="true"
      className="absolute inset-[-15%] rounded-full bg-[radial-gradient(ellipse_at_38%_44%,rgba(122,74,255,.56),transparent_42%),radial-gradient(ellipse_at_65%_48%,rgba(32,221,255,.46),transparent_43%)] blur-md"
      animate={{ rotate: active ? [0, 14, -10, 0] : [0, 8, 0], scale: active ? [1, 1.1, 0.98, 1] : [1, 1.04, 1] }}
      transition={{ duration: active ? 2.6 : 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <span
      aria-hidden="true"
      className="absolute inset-[7%] rounded-full border border-violet-100/35 bg-[radial-gradient(circle_at_32%_22%,rgba(255,255,255,.46),transparent_18%),radial-gradient(ellipse_at_50%_82%,rgba(6,8,26,.96),transparent_70%)]"
    />
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="absolute inset-[15%] h-[70%] w-[70%] overflow-visible"
      animate={{ scaleY: active ? [0.82, 1.12, 0.9] : [0.92, 1.02, 0.92], rotate: active ? [0, -2, 2, 0] : [0, 1, 0] }}
      transition={{ duration: active ? 1.15 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M3 52 C12 14 19 84 29 49 S45 18 53 49 S68 82 77 49 S91 21 97 51" fill="none" stroke="#d5a8ff" strokeWidth="2.4" opacity=".9" />
      <path d="M2 49 C12 25 20 73 29 48 S44 27 53 48 S68 70 77 48 S90 29 98 49" fill="none" stroke="#74f4ff" strokeWidth="1.8" opacity=".95" />
      <path d="M3 55 C13 37 20 66 29 53 S44 39 53 53 S67 68 77 53 S90 39 97 54" fill="none" stroke="#ffffff" strokeWidth=".8" opacity=".75" />
    </motion.svg>
    <span aria-hidden="true" className="absolute inset-[7%] rounded-full border border-white/20" />
  </span>
);

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
    snapWindow,
  } = useOS();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [heardCommand, setHeardCommand] = useState('');
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
  const [detectiveConfig, setDetectiveConfig] = useState<DetectiveConfig>(loadDetectiveConfig);
  const selectedDetective = getDetective(detectiveConfig);
  const selectedDetectiveAvatarId = 'avatarId' in selectedDetective ? selectedDetective.avatarId : selectedDetective.id;
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{ pointerId: number; x: number; y: number; width: number; height: number; orbSize: number } | null>(null);
  const skipOrbClickRef = useRef(false);
  const activeConversationRef = useRef(false);
  const pausedRecognitionRef = useRef(false);
  const wakeStateRequestRef = useRef<Promise<void>>(Promise.resolve());
  const pendingCreateRef = useRef<PendingCreateType | undefined>(undefined);
  const conversationLanguageRef = useRef<'en' | 'hi' | 'mr'>('en');
  const conversationTimerRef = useRef<number | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const activeSpeechRef = useRef<HTMLAudioElement | null>(null);
  const speechGenerationRef = useRef(0);
  const userRef = useRef(user);
  userRef.current = user;
  const shortcut = settings.ghostShortcut;

  useEffect(() => {
    const receiveDetectiveConfig = (event: Event) => {
      const next = (event as CustomEvent<DetectiveConfig>).detail;
      if (next) setDetectiveConfig(next);
    };
    window.addEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, receiveDetectiveConfig);
    return () => window.removeEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, receiveDetectiveConfig);
  }, []);

  const updateDetective = (patch: Partial<DetectiveConfig>) => {
    const next = { ...detectiveConfig, ...patch };
    setDetectiveConfig(next);
    saveDetectiveConfig(next);
  };

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
    renameDesktopItem: renameGhostDesktopItem,
    deleteDesktopItem: deleteGhostDesktopItem,
    showDesktop,
    getLocalTime: getGhostLocalTime,
    getBatteryStatus: () => ({
      available: settings.batteryAvailable,
      level: settings.batteryLevel,
      charging: settings.batteryCharging,
      plugged: settings.batteryPlugged,
    }),
    setFocusMode: enabled => updateSettings({ doNotDisturb: enabled }),
    requestCameraCapture: requestNotchCameraCapture,
    searchAuthorizedFiles: searchGhostAuthorizedFiles,
    getSystemInfo: async () => {
      if (!window.electronAPI?.getResourceUsage) throw new Error('System resource information is unavailable.');
      const usage = await window.electronAPI.getResourceUsage();
      const cpu = usage.cpuPercent === null ? 'unavailable' : `${Math.round(usage.cpuPercent)}%`;
      const memory = usage.memoryUsedBytes === null || usage.memoryTotalBytes === null
        ? 'unavailable'
        : `${(usage.memoryUsedBytes / 1024 ** 3).toFixed(1)} GB of ${(usage.memoryTotalBytes / 1024 ** 3).toFixed(1)} GB`;
      return `CPU usage: ${cpu}. Memory: ${memory}.`;
    },
    arrangeWindow: (appId, position) => {
      const candidates = windows.filter(win => win.appId === appId && !win.isMinimized);
      const focused = candidates.filter(win => win.isFocused);
      const target = focused.length === 1 ? focused[0] : candidates.length === 1 ? candidates[0] : null;
      if (!target) {
        return {
          success: false,
          result: candidates.length
            ? `There are multiple open ${APP_REGISTRY[appId as keyof typeof APP_REGISTRY]?.name ?? 'app'} windows. Specify which one to arrange.`
            : 'That app does not have an open window.',
        };
      }
      snapWindow(target.id, position);
      return { success: true, result: `${APP_REGISTRY[appId as keyof typeof APP_REGISTRY].name} moved to ${position}.` };
    },
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
    speechGenerationRef.current += 1;
    activeSpeechRef.current?.pause();
    activeSpeechRef.current = null;
    void pauseWakeListener(false);
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
    const generation = ++speechGenerationRef.current;
    let hasResumed = false;
    const resumeRecognition = () => {
      if (hasResumed || generation !== speechGenerationRef.current) return;
      hasResumed = true;
      activeSpeechRef.current = null;
      void pauseWakeListener(false).then(() => onEnd?.());
    };
    if (!settings.ghostVoiceResponses) {
      resumeRecognition();
      return;
    }
    let localFallbackStarted = false;
    const speakLocalFemaleVoice = (reason?: string) => {
      if (generation !== speechGenerationRef.current || localFallbackStarted) return;
      localFallbackStarted = true;
      if (reason) console.info('[Ghost AI] Using local female voice for Lily:', reason);
      void pauseWakeListener(true).then(() => {
        if (generation !== speechGenerationRef.current) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        configureGhostUtterance(utterance, conversationLanguageRef.current);
        utterance.onend = resumeRecognition;
        utterance.onerror = resumeRecognition;
        utterance.onstart = () => {
          if (conversationTimerRef.current !== null) {
            window.clearTimeout(conversationTimerRef.current);
            conversationTimerRef.current = null;
          }
        };
        window.speechSynthesis.speak(utterance);
      }).catch(error => {
        console.error('[Ghost AI] Could not pause recognition for local Lily speech:', error);
        resumeRecognition();
      });
    };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      speakLocalFemaleVoice('offline');
      return;
    }
    void pauseWakeListener(true).then(async () => {
      const synthesize = window.electronAPI?.ghostAISynthesizeSpeech;
      if (!synthesize) throw new Error('Online voice is only available in the desktop app.');
      const audioData = await synthesize(text);
      if (generation !== speechGenerationRef.current) return;
      const audio = new Audio(`data:audio/wav;base64,${audioData}`);
      activeSpeechRef.current = audio;
      audio.onended = resumeRecognition;
      audio.onerror = () => {
        console.error('[Ghost AI] Could not play Gemini-generated Lily speech.');
        speakLocalFemaleVoice('online speech playback failed');
      };
      audio.onplay = () => {
        if (conversationTimerRef.current !== null) {
          window.clearTimeout(conversationTimerRef.current);
          conversationTimerRef.current = null;
        }
      };
      await audio.play();
    }).catch(error => {
      if (generation !== speechGenerationRef.current) return;
      const reason = error instanceof Error ? error.message : String(error);
      console.warn('[Ghost AI] Gemini-generated Lily speech failed; using local female voice:', reason);
      speakLocalFemaleVoice(reason);
    });
  };

  const addAssistantMessage = (content: string, onEnd?: () => void) => {
    setHeardCommand('');
    setMessages(current => [...current, { role: 'assistant', content }]);
    speak(content, onEnd);
  };

  const submitPrompt = async (value = prompt, isWakeCommand = false, recognizedLanguage?: string) => {
    const content = value.trim();
    if (!isMeaningfulGhostTranscript(content) || isThinking) return;
    const requestDetective = routeGhostRequest(content, selectedDetective);
    conversationLanguageRef.current = detectGhostCommandLanguage(content, recognizedLanguage);
    setPrompt('');
    setErrorMessage('');
    setErrorDetails('');
    if (!isWakeCommand) setHeardCommand('');
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
        renameDesktopItem: renameGhostDesktopItem,
        deleteDesktopItem: deleteGhostDesktopItem,
        getBatteryStatus: () => ({
          available: settings.batteryAvailable,
          level: settings.batteryLevel,
          charging: settings.batteryCharging,
          plugged: settings.batteryPlugged,
        }),
      }, pendingCreateRef.current, recognizedLanguage, requestDetective.permittedTools);
      if (commandReply) {
        pendingCreateRef.current = commandReply.pendingCreate;
        addAssistantMessage(commandReply.reply, isWakeCommand ? () => armConversationTimeout() : undefined);
        return;
      }

      if (settings.ghostWakeEnabled) await pauseWakeListener(true);
      const conversation = [...messages, { role: 'user' as const, content }];
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new GhostChatError('OFFLINE', 'Gemini chat is unavailable while offline.');
      }
      const answer = await runGhostChat(conversation.slice(-20), user.displayName, ghostToolHost, {
        name: requestDetective.name,
        role: requestDetective.role,
        personality: requestDetective.personality,
        description: requestDetective.description,
        skills: [...requestDetective.skills],
        instructions: 'instructions' in requestDetective ? requestDetective.instructions : '',
        permittedTools: [...requestDetective.permittedTools],
      }, requestId);
      addAssistantMessage(answer, isWakeCommand ? () => armConversationTimeout() : undefined);
    } catch (error) {
      if (error instanceof GhostChatError) {
        console.error('[Ghost AI] The quick assistant request failed:', error.code);
        setErrorMessage('');
        setErrorDetails('');
        addAssistantMessage(
          error.details ? `${error.message}\n${error.details}` : error.message,
          isWakeCommand ? () => armConversationTimeout() : undefined,
        );
      } else {
        console.error('[Ghost AI] The quick assistant command failed:', error);
        setErrorMessage('');
        setErrorDetails('');
        addAssistantMessage(
          error instanceof Error ? error.message : 'That action could not be completed.',
          isWakeCommand ? () => armConversationTimeout() : undefined,
        );
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
      if (!isMeaningfulGhostTranscript(heard)) return;
      conversationLanguageRef.current = transcript.language === 'hi' || transcript.language === 'mr'
        ? transcript.language
        : 'en';

      if (!activeConversationRef.current) {
        const wakeMatch = matchGhostWakePhrase(heard, [selectedDetective.name]);
        if (!wakeMatch) return;
        activeConversationRef.current = true;
        setPanelPosition(null);
        setIsCollapsed(false);
        setShowGhostAssistant(true);
        setErrorMessage('');
        void api.ghostAIWakeDetected().catch(error => {
          console.error('[Ghost AI] Could not focus ARLO OS after wake phrase:', error);
        });
        const assistantName = 'Lily';
        if (wakeMatch.command) {
          setHeardCommand(wakeMatch.command);
          void submitPromptRef.current(wakeMatch.command, true, transcript.language);
          return;
        }
        const greeting = conversationLanguageRef.current === 'hi'
          ? `नमस्ते ${userRef.current.displayName}, मैं ${assistantName} हूँ। बताइए, मैं क्या करूँ?`
          : conversationLanguageRef.current === 'mr'
            ? `नमस्कार ${userRef.current.displayName}, मी ${assistantName} आहे. मी काय मदत करू?`
            : `Hi, ${userRef.current.displayName}. I'm Lily. What can I do for you?`;
        setMessages(current => [...current, { role: 'assistant', content: greeting }]);
        setHeardCommand('');
        armConversationTimeout();
        return;
      }

      setHeardCommand(heard);
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
    speechGenerationRef.current += 1;
    activeSpeechRef.current?.pause();
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
          aria-label={wakeStatus === 'ready' ? 'Lily is listening for Hey Lily or Hey Ghost' : `Lily wake listener ${wakeStatus}`}
          onClick={() => setShowGhostAssistant(true)}
          title={wakeStatus === 'error' ? 'Lily voice listener needs attention' : 'Open Lily · say “Hey Lily” or “Hey Ghost”'}
          className={`group fixed z-[99998] flex h-14 w-14 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
            settings.dockPosition === 'bottom'
              ? 'bottom-24 right-6'
              : settings.dockPosition === 'right'
                ? 'bottom-6 right-24'
                : 'bottom-6 right-6'
          }`}
        >
          <LilyOrb active={wakeStatus === 'ready'} />
          {wakeStatus === 'error' && <Mic size={15} className="absolute text-rose-100 drop-shadow-[0_0_8px_rgba(251,113,133,.9)]" />}
          <span className="sr-only">
            {wakeStatus === 'ready' ? 'Hey Lily or Hey Ghost · listening locally' : wakeStatus === 'error' ? 'Wake listener error' : wakeStatus === 'paused' ? 'Lily is speaking' : wakeStatus === 'stopped' ? 'Wake listener off' : 'Wake listener starting'}
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
            aria-label="Detective desktop assistant"
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
                  title={`Open ${selectedDetective.name} · drag to move`}
                  onClick={() => {
                    if (skipOrbClickRef.current) {
                      skipOrbClickRef.current = false;
                      return;
                    }
                    expandPanel();
                  }}
                  className="relative flex h-[calc(100%-12px)] w-[calc(100%-12px)] touch-none cursor-grab items-center justify-center rounded-full border border-white/25 transition duration-300 hover:scale-105 hover:shadow-[0_0_48px_rgba(139,92,246,.75)] active:cursor-grabbing"
                >
                  <DetectiveAvatar
                    shape={selectedDetective.shape}
                    color={selectedDetective.color}
                    className="h-full w-full rounded-full border border-white/25 p-2 shadow-[0_0_30px_rgba(56,189,248,.24)]"
                    detectiveId={selectedDetectiveAvatarId}
                    scoutColor={detectiveConfig.scoutColor}
                    emberColor={detectiveConfig.emberColor}
                    mintColor={detectiveConfig.mintColor}
                    rubyColor={detectiveConfig.rubyColor}
                    petalColor={detectiveConfig.petalColor}
                    violetColor={detectiveConfig.violetColor}
                    sunnyColor={detectiveConfig.sunnyColor}
                    mochaColor={detectiveConfig.mochaColor}
                  />
                  <span className="sr-only">{isThinking ? `${selectedDetective.name} is thinking` : isListening ? `${selectedDetective.name} is listening` : `${selectedDetective.name} Detective`}</span>
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
              title="Drag Detective to move it"
            >
              <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] shadow-[0_0_24px_rgba(56,189,248,.18)] ${isListening ? 'animate-pulse' : ''}`}>
                <DetectiveAvatar
                  shape={selectedDetective.shape}
                  color={selectedDetective.color}
                  className="h-8 w-8"
                  detectiveId={selectedDetectiveAvatarId}
                  scoutColor={detectiveConfig.scoutColor}
                  emberColor={detectiveConfig.emberColor}
                  mintColor={detectiveConfig.mintColor}
                  rubyColor={detectiveConfig.rubyColor}
                  petalColor={detectiveConfig.petalColor}
                  violetColor={detectiveConfig.violetColor}
                  sunnyColor={detectiveConfig.sunnyColor}
                  mochaColor={detectiveConfig.mochaColor}
                />
                {isListening && <span className="absolute inset-0 rounded-full border-2 border-sky-300/70 animate-ping" />}
              </div>
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold text-white">{selectedDetective.name} · Detective</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {heardCommand
                    ? <span className="text-violet-200">Heard: “{heardCommand}”</span>
                    : wakeStatus === 'error'
                    ? <span className="text-rose-300">Local microphone error</span>
                    : isListening
                      ? <span className="text-rose-300">Listening · speak your command</span>
                      : isThinking
                        ? 'Thinking…'
                        : `Ready · ${shortcutLabel}`}
                </p>
              </div>
              <button
                type="button"
                data-no-drag
                aria-label="Minimize Detective to orb"
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

            <section className="shrink-0 border-b border-white/[0.06] px-4 py-2.5" aria-label="Choose detective and open an app">
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[.12em] text-slate-500">Detectives</span>
                  <div className="flex min-w-0 items-center gap-1 overflow-x-auto scrollbar-none">
                    {DETECTIVES.map(detective => (
                      <button
                        key={detective.id}
                        type="button"
                        data-no-drag
                        aria-label={`Select ${detective.name} detective`}
                        aria-pressed={detective.id === selectedDetective.id}
                        title={detective.name}
                        onClick={() => updateDetective({ selectedId: detective.id })}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition duration-150 hover:scale-105 ${
                          detective.id === selectedDetective.id
                            ? 'border-sky-200/30 bg-sky-200/[0.1] shadow-[0_0_14px_rgba(56,189,248,.12)]'
                            : 'border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.06]'
                        }`}
                      >
                        <DetectiveAvatar
                          shape={detective.shape}
                          color={detectiveConfig.colors[detective.id]}
                          className="h-6 w-6"
                          detectiveId={detective.id}
                          scoutColor={detectiveConfig.scoutColor}
                          emberColor={detectiveConfig.emberColor}
                          mintColor={detectiveConfig.mintColor}
                          rubyColor={detectiveConfig.rubyColor}
                          petalColor={detectiveConfig.petalColor}
                          violetColor={detectiveConfig.violetColor}
                          sunnyColor={detectiveConfig.sunnyColor}
                          mochaColor={detectiveConfig.mochaColor}
                        />
                      </button>
                    ))}
                    {detectiveConfig.customDetectives.map(profile => {
                      const avatar = DETECTIVES.find(detective => detective.id === profile.avatarId) ?? DETECTIVES[0];
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          data-no-drag
                          aria-label={`Select ${profile.name} detective`}
                          aria-pressed={profile.id === selectedDetective.id}
                          title={`${profile.name} · Custom detective`}
                          onClick={() => updateDetective({ selectedId: profile.id })}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition duration-150 hover:scale-105 ${
                            profile.id === selectedDetective.id
                              ? 'border-sky-200/30 bg-sky-200/[0.1] shadow-[0_0_14px_rgba(56,189,248,.12)]'
                              : 'border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.06]'
                          }`}
                        >
                          <DetectiveAvatar
                            shape={avatar.shape}
                            color={detectiveConfig.colors[avatar.id]}
                            className="h-6 w-6"
                            detectiveId={avatar.id}
                            scoutColor={detectiveConfig.scoutColor}
                            emberColor={detectiveConfig.emberColor}
                            mintColor={detectiveConfig.mintColor}
                            rubyColor={detectiveConfig.rubyColor}
                            petalColor={detectiveConfig.petalColor}
                            violetColor={detectiveConfig.violetColor}
                            sunnyColor={detectiveConfig.sunnyColor}
                            mochaColor={detectiveConfig.mochaColor}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2" role="status" aria-live="polite">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-slate-200">{selectedDetective.name} · {selectedDetective.role}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] ${isThinking ? 'bg-sky-300/10 text-sky-200' : 'bg-emerald-300/10 text-emerald-200'}`}>
                    {isThinking ? 'Working' : 'Available'}
                  </span>
                </div>
                <p className="mt-1 text-[9px] leading-relaxed text-slate-400">{selectedDetective.description}</p>
                <p className="mt-1 truncate text-[8px] text-slate-500">Current task: {isThinking
                  ? [...messages].reverse().find(message => message.role === 'user')?.content ?? 'Working on your request'
                  : 'None'}</p>
                <p className="mt-1 text-[8px] leading-relaxed text-slate-500">Capabilities: {selectedDetective.permittedTools.map(tool => tool.replaceAll('_', ' ')).join(' · ') || 'Chat only'}</p>
              </div>
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="mr-1 shrink-0 text-[9px] font-semibold uppercase tracking-[.12em] text-slate-500">Apps</span>
                {DETECTIVE_APPS.map(app => (
                  <button
                    key={app.id}
                    type="button"
                    data-no-drag
                    title={`Open ${app.name}`}
                    aria-label={`Open ${app.name}`}
                    onClick={() => openAppFromGhost(app.id)}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 text-[9px] text-slate-300 transition hover:-translate-y-0.5 hover:border-sky-200/20 hover:bg-sky-200/[0.06] hover:text-white"
                  >
                    <AppIcon appId={app.id} className="h-4 w-4 object-contain" />
                    {app.name}
                  </button>
                ))}
              </div>
            </section>

            <div className="min-h-[130px] flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <GhostActivityFeed />
              {messages.length === 0 ? (
                <div className="flex min-h-[150px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-sky-200/15 bg-[radial-gradient(circle_at_35%_30%,rgba(125,211,252,.3),rgba(14,116,144,.14)_45%,rgba(8,47,73,.28))] shadow-[0_0_36px_rgba(14,165,233,.14)]">
                    <DetectiveAvatar
                      shape={selectedDetective.shape}
                      color={selectedDetective.color}
                      className="h-10 w-10"
                      detectiveId={selectedDetectiveAvatarId}
                      scoutColor={detectiveConfig.scoutColor}
                      emberColor={detectiveConfig.emberColor}
                      mintColor={detectiveConfig.mintColor}
                      rubyColor={detectiveConfig.rubyColor}
                      petalColor={detectiveConfig.petalColor}
                      violetColor={detectiveConfig.violetColor}
                      sunnyColor={detectiveConfig.sunnyColor}
                      mochaColor={detectiveConfig.mochaColor}
                    />
                  </div>
                  <p className="text-[14px] font-medium text-slate-100">{selectedDetective.name} is ready to help</p>
                  <p className="mt-1 max-w-md text-[11px] text-slate-500">Choose an app above or describe a desktop task. Your detective can open apps, organize desktop files, and change Focus Mode.</p>
                </div>
              ) : messages.slice(-8).map((message, index) => (
                <div key={`${index}-${message.role}-${message.content.slice(0, 12)}`} className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                      <DetectiveAvatar
                        shape={selectedDetective.shape}
                        color={selectedDetective.color}
                        className="h-6 w-6"
                        detectiveId={selectedDetectiveAvatarId}
                        scoutColor={detectiveConfig.scoutColor}
                        emberColor={detectiveConfig.emberColor}
                        mintColor={detectiveConfig.mintColor}
                        rubyColor={detectiveConfig.rubyColor}
                        petalColor={detectiveConfig.petalColor}
                        violetColor={detectiveConfig.violetColor}
                        sunnyColor={detectiveConfig.sunnyColor}
                        mochaColor={detectiveConfig.mochaColor}
                      />
                    </span>
                  )}
                  <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[12px] leading-5 ${message.role === 'user' ? 'rounded-br-md bg-sky-300/15 text-slate-100' : 'rounded-bl-md border border-white/[0.06] bg-white/[0.04] text-slate-300'}`}>
                    {message.content}
                  </p>
                </div>
              ))}
              {isThinking && <p className="pl-9 text-[11px] text-sky-200/70">{selectedDetective.name} is working…</p>}
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
                placeholder="Describe a desktop task or ask your detective…"
                className="h-10 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3.5 text-[12px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-300/25"
                aria-label="Ask Lily"
              />
              <button type="submit" data-no-drag disabled={!prompt.trim() || isThinking} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-300 text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-600" aria-label="Send to Detective">
                <ArrowUp size={17} />
              </button>
            </form>
            <footer className="px-5 pb-3 text-center text-[9px] text-slate-600">
              Say “Hey Lily” or “Hey Ghost”. English, Hindi, and Marathi recognition runs locally; online Lily voice replies and AI requests use your Gemini API key.
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
