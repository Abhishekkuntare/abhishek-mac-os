import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  ShieldCheck,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AppIcon } from '../system/AppIcon';
import { useOS } from '../../context/OSContext';
import { executeGhostCommand } from '../../services/ghostCommands';
import { runGhostChat } from '../../services/ghostChatClient';
import { GhostChatError } from '../../types/ghostAgent';
import type { GhostToolHost } from '../../types/ghostAgent';
import { routeGhostRequest } from '../../services/ghostOrchestrator';
import { GhostActivityFeed } from '../system/GhostActivityFeed';
import { requestNotchCameraCapture } from '../../services/notchCameraBridge';
import { APP_REGISTRY } from '../../data/defaultApps';
import { vfs } from '../../services/virtualFileSystem';
import {
  createGhostDesktopItem,
  deleteGhostDesktopItem,
  getGhostLocalTime,
  renameGhostDesktopItem,
  searchGhostAuthorizedFiles,
} from '../../services/ghostDesktopActions';
import { GHOST_CHAT_STORAGE_KEY, GHOST_CHAT_UPDATED_EVENT } from '../../services/ghostChatHistory';
import {
  DETECTIVE_CONFIG_UPDATED_EVENT,
  getDetective,
  loadDetectiveConfig,
  type DetectiveConfig,
} from '../system/detectiveModel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

const MODELS = ['gemini-3.8-flash'];
const STARTER_PROMPTS = [
  'Help me plan a focused workday',
  'Explain a tricky idea in simple terms',
  'Write a friendly project update',
];

const readChat = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(GHOST_CHAT_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Saved chat is not a list.');
    return parsed.filter(
      (message): message is ChatMessage =>
        typeof message === 'object' &&
        message !== null &&
        typeof message.id === 'string' &&
        (message.role === 'assistant' || message.role === 'user') &&
        typeof message.content === 'string' &&
        typeof message.createdAt === 'number',
    );
  } catch (error) {
    console.error('[Ghost AI] Could not restore the saved conversation:', error);
    return [];
  }
};

const displayTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const GhostAIApp: React.FC = () => {
  const { openApp, showDesktop, updateSettings, windows, closeWindow, user, settings, snapWindow } = useOS();
  const [messages, setMessages] = useState<ChatMessage[]>(readChat);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState(MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isKeySettingsOpen, setIsKeySettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [detectiveConfig, setDetectiveConfig] = useState<DetectiveConfig>(loadDetectiveConfig);
  const selectedDetective = getDetective(detectiveConfig);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const activeRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleDetectiveConfig = (event: Event) => {
      const config = (event as CustomEvent<DetectiveConfig>).detail;
      if (config) setDetectiveConfig(config);
    };
    window.addEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, handleDetectiveConfig);
    return () => window.removeEventListener(DETECTIVE_CONFIG_UPDATED_EVENT, handleDetectiveConfig);
  }, []);

  useEffect(() => () => {
    if (activeRequestIdRef.current) {
      void window.electronAPI?.ghostAICancelChat(activeRequestIdRef.current).catch(error => {
        console.error('[Ghost AI] Could not cancel the pending request:', error);
      });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GHOST_CHAT_STORAGE_KEY, JSON.stringify(messages));
      window.dispatchEvent(new Event(GHOST_CHAT_UPDATED_EVENT));
    } catch (error) {
      console.error('[Ghost AI] Could not save the conversation on this device:', error);
      setErrorMessage('This conversation could not be saved on this device.');
    }
  }, [messages]);

  useEffect(() => {
    const refreshChat = () => {
      const nextMessages = readChat();
      setMessages(current =>
        JSON.stringify(current) === JSON.stringify(nextMessages) ? current : nextMessages);
    };
    window.addEventListener(GHOST_CHAT_UPDATED_EVENT, refreshChat);
    window.addEventListener('storage', refreshChat);
    return () => {
      window.removeEventListener(GHOST_CHAT_UPDATED_EVENT, refreshChat);
      window.removeEventListener('storage', refreshChat);
    };
  }, []);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  useEffect(() => {
    let cancelled = false;
    const checkConfiguration = async () => {
      if (!window.electronAPI?.ghostAIIsConfigured) {
        setIsConfigured(false);
        return;
      }
      try {
        const configured = await window.electronAPI.ghostAIIsConfigured();
        if (!cancelled) setIsConfigured(configured);
      } catch (error) {
        console.error('[Ghost AI] Could not check the Gemini configuration:', error);
        if (!cancelled) {
          setIsConfigured(false);
          setErrorMessage('Ghost AI could not read its Gemini configuration. Restart the desktop app and try again.');
        }
      }
    };
    void checkConfiguration();
    return () => {
      cancelled = true;
    };
  }, []);

  const startNewChat = () => {
    if (isThinking) return;
    setMessages([]);
    setErrorMessage('');
    setErrorDetails('');
    setPrompt('');
    textareaRef.current?.focus();
  };

  const saveApiKey = async () => {
    const apiKey = apiKeyInput.trim();
    if (!apiKey || isSavingApiKey) return;
    if (!window.electronAPI?.ghostAISetApiKey) {
      setErrorMessage('Secure Gemini key storage is only available in the installed ARLO OS app.');
      return;
    }
    setIsSavingApiKey(true);
    setErrorMessage('');
    setErrorDetails('');
    try {
      await window.electronAPI.ghostAISetApiKey(apiKey);
      setApiKeyInput('');
      setShowApiKey(false);
      setIsConfigured(true);
      setIsKeySettingsOpen(false);
    } catch (error) {
      console.error('[Ghost AI] Could not save the Gemini API key:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not save the Gemini API key securely.');
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const removeApiKey = async () => {
    if (!window.electronAPI?.ghostAIRemoveApiKey) {
      setErrorMessage('Secure Gemini key storage is only available in the installed ARLO OS app.');
      return;
    }
    setIsSavingApiKey(true);
    setErrorMessage('');
    setErrorDetails('');
    try {
      await window.electronAPI.ghostAIRemoveApiKey();
      const stillConfigured = await window.electronAPI.ghostAIIsConfigured();
      setIsConfigured(stillConfigured);
      setIsKeySettingsOpen(false);
    } catch (error) {
      console.error('[Ghost AI] Could not remove the saved Gemini API key:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not remove the saved Gemini API key.');
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const submitPrompt = async (value = prompt) => {
    const content = value.trim();
    if (!content || isThinking) return;
    const requestDetective = routeGhostRequest(content, selectedDetective);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setPrompt('');
    setErrorMessage('');
    setErrorDetails('');
    setIsThinking(true);
    const requestId = crypto.randomUUID();
    activeRequestIdRef.current = requestId;

    try {
      const commandReply = await executeGhostCommand(content, {
        openApp: appId => {
          if (!Object.hasOwn(APP_REGISTRY, appId) || !APP_REGISTRY[appId].installed || appId === 'trash') return false;
          openApp(appId);
          return true;
        },
        closeApp: appId => {
          const target = [...windows].reverse().find(win =>
            (appId ? win.appId === appId : win.isFocused) && !win.isMinimized,
          );
          if (!target) return false;
          closeWindow(target.id);
          return true;
        },
        showDesktop,
        createDesktopItem: (type, name) => {
          const safeName = name.trim();
          if (!safeName || safeName.length > 100 || /[\\/]/.test(safeName)) {
            throw new Error('Desktop names must be 1–100 characters and cannot contain slashes.');
          }
          if (vfs.getFiles('/Users/abhishek/Desktop').some(file =>
            file.name.toLocaleLowerCase() === safeName.toLocaleLowerCase(),
          )) {
            throw new Error(`A desktop item named "${safeName}" already exists.`);
          }
          if (type === 'folder') {
            vfs.createFolder(safeName, '/Users/abhishek/Desktop');
          } else {
            const extension = safeName.includes('.') ? safeName.split('.').pop()!.toLowerCase() : 'txt';
            const code = ['py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'java', 'c', 'cpp'].includes(extension);
            vfs.createFile(safeName.includes('.') ? safeName : `${safeName}.txt`, '/Users/abhishek/Desktop', code ? 'code' : 'document', '', extension);
          }
          return `Created ${type} "${safeName}" on the desktop.`;
        },
        renameDesktopItem: renameGhostDesktopItem,
        deleteDesktopItem: deleteGhostDesktopItem,
        updateSettings,
        getBatteryStatus: () => ({
          available: settings.batteryAvailable,
          level: settings.batteryLevel,
          charging: settings.batteryCharging,
          plugged: settings.batteryPlugged,
        }),
      }, undefined, undefined, requestDetective.permittedTools);
      if (commandReply) {
        setMessages(current => [
          ...current,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: commandReply.reply,
            createdAt: Date.now(),
          },
        ]);
        return;
      }
      const toolHost: GhostToolHost = {
        openApp: appId => {
          if (!Object.hasOwn(APP_REGISTRY, appId) || !APP_REGISTRY[appId].installed || appId === 'trash') return false;
          openApp(appId);
          return true;
        },
        closeApp: appId => {
          const target = [...windows].reverse().find(win =>
            (appId ? win.appId === appId : win.isFocused) && !win.isMinimized,
          );
          if (!target) return false;
          closeWindow(target.id);
          return true;
        },
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
      const answer = await runGhostChat(nextMessages.map(message => ({
          role: message.role,
          content: message.content,
        })), user.displayName, toolHost, {
          name: requestDetective.name,
          role: requestDetective.role,
          personality: requestDetective.personality,
          description: requestDetective.description,
          skills: [...requestDetective.skills],
          instructions: 'instructions' in requestDetective ? requestDetective.instructions : '',
          permittedTools: [...requestDetective.permittedTools],
        }, requestId);

      setMessages(current => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answer,
          createdAt: Date.now(),
        },
      ]);
    } catch (error) {
      if (error instanceof GhostChatError) {
        console.error('[Ghost AI] The Gemini request failed:', error.code);
        setErrorMessage(error.message);
        setErrorDetails(error.details ?? '');
      } else {
        console.error('[Ghost AI] The request failed:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Ghost could not complete that request.');
        setErrorDetails('');
      }
    } finally {
      if (activeRequestIdRef.current === requestId) activeRequestIdRef.current = null;
      setIsThinking(false);
    }
  };

  const renderMessage = (message: ChatMessage) => (
    <motion.article
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={`flex w-full gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.role === 'assistant' && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sky-200/10 bg-sky-300/10">
          <AppIcon appId="ghostai" className="h-full w-full object-contain" />
        </div>
      )}
      <div className={`max-w-[min(78%,720px)] ${message.role === 'user' ? 'text-right' : ''}`}>
        <div className={`mb-1 flex items-center gap-2 text-[10px] text-slate-500 ${message.role === 'user' ? 'justify-end' : ''}`}>
          <span className="font-medium text-slate-300">{message.role === 'user' ? 'You' : 'Ghost'}</span>
          <span>{displayTime(message.createdAt)}</span>
        </div>
        <div
          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[13px] leading-6 ${
            message.role === 'user'
              ? 'rounded-br-md border border-sky-300/10 bg-sky-400/[0.13] text-slate-100'
              : 'rounded-bl-md border border-white/[0.07] bg-white/[0.045] text-slate-200'
          }`}
        >
          {message.content}
        </div>
      </div>
    </motion.article>
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-[#0b1019] text-slate-100">
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 248, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="flex shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#0d1420]"
          >
            <div className="flex h-16 shrink-0 items-center gap-3 px-4">
              <div className="h-10 w-10 overflow-hidden rounded-xl border border-sky-200/10 bg-sky-300/10 shadow-[0_0_25px_rgba(56,189,248,.12)]">
                <AppIcon appId="ghostai" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-tight text-white">Ghost AI</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className={`h-1.5 w-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {isConfigured === null ? 'Checking connection' : isConfigured ? 'Ready to chat' : 'Gemini unavailable'}
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="ml-auto rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-white" title="Hide sidebar">
                <PanelLeftClose size={15} />
              </button>
            </div>
            <div className="px-3">
              <button
                onClick={startNewChat}
                disabled={isThinking}
                className="flex h-10 w-full items-center gap-2 rounded-xl border border-sky-200/10 bg-sky-300/[0.07] px-3 text-[11px] font-medium text-sky-100 transition hover:border-sky-200/20 hover:bg-sky-300/[0.12] disabled:opacity-50"
              >
                <MessageSquarePlus size={14} /> New conversation <Plus size={13} className="ml-auto" />
              </button>
              {import.meta.env.DEV && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => void submitPrompt('Hello Ghost')}
                    disabled={isThinking}
                    className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-sky-200/10 bg-sky-300/[0.04] px-2 text-[9px] text-sky-100/80 transition hover:bg-sky-300/[0.09] disabled:opacity-50"
                    title="Send Hello Ghost to Gemini and verify a response"
                  >
                    Test Gemini
                  </button>
                  <button
                    onClick={() => void submitPrompt('Can you open music for me?')}
                    disabled={isThinking}
                    className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-sky-200/10 bg-sky-300/[0.04] px-2 text-[9px] text-sky-100/80 transition hover:bg-sky-300/[0.09] disabled:opacity-50"
                    title="Test the Gemini open_app tool request for Music"
                  >
                    Test open Music
                  </button>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center gap-2 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              <Clock3 size={12} /> Recent
            </div>
            <div className="mt-2 flex-1 overflow-auto px-3">
              {messages.length > 0 ? (
                <button className="flex w-full items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 py-2 text-left text-[11px] text-slate-300">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
                  <span className="truncate">{messages.find(message => message.role === 'user')?.content ?? 'Conversation'}</span>
                  <MoreHorizontal size={13} className="ml-auto shrink-0 text-slate-600" />
                </button>
              ) : (
                <p className="px-2 py-2 text-[10px] leading-5 text-slate-600">Your current chat will appear here.</p>
              )}
            </div>
            <div className="space-y-2 border-t border-white/[0.06] p-3">
              <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] text-slate-400">
                <span className={`h-1.5 w-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isConfigured ? 'Gemini connected' : 'Gemini not configured'}
              </div>
              <button
                onClick={() => { setIsKeySettingsOpen(true); setErrorMessage(''); }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <KeyRound size={13} className="text-sky-300" />
                Configure Gemini API key
              </button>
              <div className="flex items-start gap-2 px-2.5 pb-1 text-[9px] leading-4 text-slate-600">
                <ShieldCheck size={12} className="mt-0.5 shrink-0" />
                API key is encrypted for this Windows account.
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-white/[0.06] px-4 sm:px-6">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="mr-3 rounded-md p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white" title="Show sidebar">
              <PanelLeftClose size={15} className="rotate-180" />
            </button>
          )}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles size={14} className="text-sky-300" />
            <span>Assistant</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300">New chat</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setIsKeySettingsOpen(true); setErrorMessage(''); }}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-[10px] text-slate-300 transition hover:border-white/15 hover:bg-white/[0.05]"
              title="Configure Gemini API key"
              aria-label="Configure Gemini API key"
            >
              <KeyRound size={13} className={isConfigured ? 'text-emerald-300' : 'text-amber-300'} />
              <span className="hidden sm:inline">API key</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setIsModelMenuOpen(value => !value)}
                className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2.5 text-[10px] text-slate-300 transition hover:border-white/15 hover:bg-white/[0.05]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                {model}<ChevronDown size={12} className="text-slate-500" />
              </button>
              <AnimatePresence>
                {isModelMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-10 z-20 w-40 rounded-xl border border-white/10 bg-[#17202c] p-1 shadow-2xl"
                  >
                    {MODELS.map(option => (
                      <button
                        key={option}
                        onClick={() => { setModel(option); setIsModelMenuOpen(false); }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[10px] text-slate-300 transition hover:bg-white/[0.06]"
                      >
                        {option}{option === model && <Check size={12} className="text-sky-300" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={startNewChat} disabled={isThinking} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50" title="Clear conversation">
              <Trash2 size={14} />
            </button>
          </div>
        </header>

        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <GhostActivityFeed />
          {messages.length === 0 ? (
            <div className="relative flex flex-1 flex-col items-center justify-center overflow-auto px-5 py-10">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,.12),transparent_68%)]" />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative mb-5 h-28 w-28 overflow-hidden rounded-[30px] border border-sky-100/10 bg-sky-300/[0.06] shadow-[0_0_70px_rgba(56,189,248,.12)]"
              >
                <AppIcon appId="ghostai" className="h-full w-full object-contain" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h1 className="text-center text-2xl font-semibold tracking-tight text-white sm:text-[28px]">What’s on your mind?</h1>
                <p className="mt-2 max-w-md text-center text-[12px] leading-5 text-slate-500">
                  Ask Ghost to explain, brainstorm, write, or help you work through a problem.
                </p>
              </motion.div>
              {isConfigured === false && (
                <button
                  onClick={() => setIsKeySettingsOpen(true)}
                  className="mt-5 rounded-full border border-amber-200/10 bg-amber-200/[0.05] px-3 py-1.5 text-center text-[10px] text-amber-100/80 transition hover:bg-amber-200/[0.09]"
                >
                  Add your Gemini API key to start chatting · Configure
                </button>
              )}
              <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-3">
                {STARTER_PROMPTS.map((starter, index) => (
                  <motion.button
                    key={starter}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.16 + index * 0.07 }}
                    onClick={() => { setPrompt(starter); textareaRef.current?.focus(); }}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left text-[10px] leading-4 text-slate-400 transition hover:-translate-y-0.5 hover:border-sky-200/15 hover:bg-sky-300/[0.045] hover:text-slate-200"
                  >
                    <Sparkles size={13} className="mb-2 text-sky-300/75" />{starter}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto px-4 py-6 sm:px-8">
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {messages.map(renderMessage)}
                {isThinking && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 text-[11px] text-slate-500">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-sky-200/10 bg-sky-300/10">
                      <AppIcon appId="ghostai" className="h-full w-full object-contain" />
                    </div>
                    <span>Ghost is thinking</span>
                    <span className="flex gap-1">
                      {[0, 1, 2].map(dot => <motion.i key={dot} animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }} className="h-1 w-1 rounded-full bg-sky-300" />)}
                    </span>
                  </motion.div>
                )}
                <div ref={endOfChatRef} />
              </div>
            </div>
          )}

          <div className="shrink-0 px-4 pb-4 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="mb-2 flex items-start gap-2 rounded-lg border border-rose-300/15 bg-rose-300/[0.06] px-3 py-2 text-[10px] leading-4 text-rose-200/90"
                  >
                    <CircleHelp size={13} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p>{errorMessage}</p>
                      {errorDetails && (
                        <details className="mt-1 text-[9px] text-rose-100/60">
                          <summary className="cursor-pointer select-none">Technical details</summary>
                          <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono">{errorDetails}</pre>
                        </details>
                      )}
                    </div>
                    <button onClick={() => setErrorMessage('')} className="ml-auto rounded p-0.5 hover:bg-white/10" aria-label="Dismiss error"><X size={12} /></button>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="rounded-2xl border border-white/[0.1] bg-[#121a25] shadow-[0_12px_50px_rgba(0,0,0,.2)] transition focus-within:border-sky-200/25 focus-within:shadow-[0_12px_55px_rgba(14,165,233,.06)]">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={event => setPrompt(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void submitPrompt();
                    }
                  }}
                  placeholder="Message Ghost…"
                  rows={2}
                  className="max-h-36 min-h-[58px] w-full resize-none bg-transparent px-4 pt-4 text-[12px] leading-5 text-slate-100 outline-none placeholder:text-slate-600"
                  aria-label="Message Ghost AI"
                />
                <div className="flex items-center justify-between px-3 pb-2.5">
                  <div className="flex items-center gap-2 text-[9px] text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {isConfigured ? 'Connected to Gemini' : 'Gemini unavailable'}
                    <span className="hidden sm:inline">· Enter to send, Shift+Enter for a new line</span>
                  </div>
                  <button
                    onClick={() => void submitPrompt()}
                    disabled={!prompt.trim() || isThinking}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-300 text-slate-950 shadow-[0_4px_16px_rgba(56,189,248,.18)] transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-600 disabled:shadow-none"
                    title="Send message"
                  >
                    {isThinking ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUp size={16} />}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-[9px] text-slate-600">
                Prompts are sent to Google Gemini. This app can make mistakes; check important information.
              </p>
            </div>
          </div>
        </section>
        <AnimatePresence>
          {isKeySettingsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
              onMouseDown={event => {
                if (event.target === event.currentTarget) setIsKeySettingsOpen(false);
              }}
            >
              <motion.section
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ghost-ai-key-title"
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121a25] p-5 shadow-2xl"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl border border-sky-200/15 bg-sky-300/10 p-2 text-sky-200">
                    <KeyRound size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 id="ghost-ai-key-title" className="text-sm font-semibold text-white">Configure Gemini</h2>
                    <p className="mt-1 text-[10px] leading-4 text-slate-400">
                      Paste your Gemini API key. It is encrypted and stored on this Windows account; it is not included in the app installer.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsKeySettingsOpen(false)}
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                    aria-label="Close Gemini settings"
                  >
                    <X size={15} />
                  </button>
                </div>

                <form
                  className="mt-5 space-y-3"
                  onSubmit={event => { event.preventDefault(); void saveApiKey(); }}
                >
                  <label htmlFor="ghost-ai-api-key" className="block text-[10px] font-medium text-slate-300">
                    Gemini API key
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b1019] px-3 focus-within:border-sky-200/30">
                    <input
                      id="ghost-ai-api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={event => setApiKeyInput(event.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={512}
                      placeholder={isConfigured ? 'Enter a new key to replace the saved one' : 'Paste your API key'}
                      className="min-w-0 flex-1 bg-transparent py-3 text-xs text-white outline-none placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(value => !value)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[9px] leading-4 text-slate-500">
                    Gemini usage is subject to Google AI Studio quotas and billing. Never share this key or commit it to source control.
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div>
                      {isConfigured && (
                        <button
                          type="button"
                          onClick={() => void removeApiKey()}
                          disabled={isSavingApiKey}
                          className="rounded-lg px-2.5 py-2 text-[10px] font-medium text-rose-300 transition hover:bg-rose-300/10 disabled:opacity-50"
                        >
                          Remove saved key
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsKeySettingsOpen(false)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-medium text-slate-300 transition hover:bg-white/[0.05]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!apiKeyInput.trim() || isSavingApiKey}
                        className="flex items-center gap-1.5 rounded-lg bg-sky-300 px-3 py-2 text-[10px] font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingApiKey ? <LoaderCircle size={12} className="animate-spin" /> : <Save size={12} />}
                        Save securely
                      </button>
                    </div>
                  </div>
                </form>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
};

export default GhostAIApp;
