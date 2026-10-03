import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  LoaderCircle,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AppIcon } from '../system/AppIcon';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

const CHAT_STORAGE_KEY = 'abhishek_os_ghost_ai_chat_v1';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];
const STARTER_PROMPTS = [
  'Help me plan a focused workday',
  'Explain a tricky idea in simple terms',
  'Write a friendly project update',
];

const readChat = (): ChatMessage[] => {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
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
  const [messages, setMessages] = useState<ChatMessage[]>(readChat);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [model, setModel] = useState(MODELS[0]);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('[Ghost AI] Could not save the conversation on this device:', error);
      setErrorMessage('This conversation could not be saved on this device.');
    }
  }, [messages]);

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
    setPrompt('');
    textareaRef.current?.focus();
  };

  const submitPrompt = async (value = prompt) => {
    const content = value.trim();
    if (!content || isThinking) return;
    if (!isConfigured) {
      setErrorMessage('Gemini is not configured. Set GEMINI_API_KEY in .env and restart Abhishek OS.');
      return;
    }

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
    setIsThinking(true);

    try {
      if (!window.electronAPI?.ghostAIChat) {
        throw new Error('Ghost AI chat is only available in the Abhishek OS desktop app.');
      }
      const answer = await window.electronAPI.ghostAIChat({
        model,
        messages: nextMessages.map(message => ({
          role: message.role,
          content: message.content,
        })),
      });

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
      console.error('[Ghost AI] The Gemini request failed:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Ghost could not reach the AI service. Check your connection and try again.',
      );
    } finally {
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
              <div className="flex items-start gap-2 px-2.5 pb-1 text-[9px] leading-4 text-slate-600">
                <ShieldCheck size={12} className="mt-0.5 shrink-0" />
                API key remains in the desktop main process.
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
                <p className="mt-5 rounded-full border border-amber-200/10 bg-amber-200/[0.05] px-3 py-1.5 text-center text-[10px] text-amber-100/80">
                  Configure GEMINI_API_KEY in .env and restart Abhishek OS.
                </p>
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
                    <span>{errorMessage}</span>
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
      </main>

    </div>
  );
};

export default GhostAIApp;
