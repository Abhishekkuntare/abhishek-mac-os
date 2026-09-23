import React, { useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';

import {
  ArrowDown,
  Check,
  CheckCheck,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Info,
  Mic,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Video,
  Volume2,
  X,
  Zap,
} from 'lucide-react';

import {
  INITIAL_CONVERSATIONS,
  MessageConversation,
} from '../../data/sampleData';

import { sound } from '../../services/soundService';

interface MessageItem {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

const QUICK_REPLIES = [
  'Sounds good! 🚀',
  'I will check it.',
  'Perfect!',
  'Give me a few minutes.',
  'Thanks! 🙌',
];

const REPLY_MESSAGES = [
  'Absolutely! The latest build is looking really polished. 🚀',
  'Nice! I just checked it. Everything is looking great.',
  'That sounds good. Let’s keep pushing it forward! ✨',
  'Got it! I’ll take a look and get back to you.',
  'This is looking phenomenal. Keep going! 🔥',
];

const formatTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();

const avatarGradients = [
  'from-sky-400 via-blue-500 to-indigo-600',
  'from-violet-400 via-purple-500 to-fuchsia-600',
  'from-emerald-400 via-teal-500 to-cyan-600',
  'from-orange-400 via-pink-500 to-rose-600',
  'from-cyan-400 via-sky-500 to-blue-700',
];

const getAvatarGradient = (index: number) =>
  avatarGradients[index % avatarGradients.length];

const Avatar3D: React.FC<{
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  index?: number;
}> = ({ name, src, size = 'md', online = true, index = 0 }) => {
  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{
        scale: 1.08,
        rotateY: 8,
        rotateX: -5,
      }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 22,
      }}
      className="relative shrink-0"
      style={{
        perspective: 800,
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className={`${sizes[size]} relative rounded-full p-[2px] bg-gradient-to-br ${getAvatarGradient(
          index
        )} shadow-[0_10px_30px_rgba(0,0,0,0.35)]`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border border-white/20">
          {src ? (
            <img
              src={src}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getAvatarGradient(
                index
              )} text-white font-bold text-xs`}
            >
              {getInitials(name)}
            </div>
          )}
        </div>

        <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/35 via-transparent to-transparent pointer-events-none" />

        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-[-3px] rounded-full border border-white/10 pointer-events-none"
        />
      </div>

      {online && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[3px] border-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
        />
      )}
    </motion.div>
  );
};

const FloatingOrb: React.FC<{
  className: string;
}> = ({ className }) => (
  <motion.div
    animate={{
      y: [0, -18, 0],
      x: [0, 8, 0],
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
  />
);

export const MessagesApp: React.FC = () => {
  const [conversations, setConversations] =
    useState<MessageConversation[]>(INITIAL_CONVERSATIONS);

  const [activeChatId, setActiveChatId] = useState<string>(
    INITIAL_CONVERSATIONS[0]?.id ?? ''
  );

  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /*
   * 3D mouse movement for the conversation area.
   */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 80,
    damping: 20,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 80,
    damping: 20,
  });

  const rotateX = useTransform(smoothY, [-300, 300], [1.5, -1.5]);
  const rotateY = useTransform(smoothX, [-300, 300], [-1.5, 1.5]);

  const handleMouseMove = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    mouseX.set(
      event.clientX - (rect.left + rect.width / 2)
    );

    mouseY.set(
      event.clientY - (rect.top + rect.height / 2)
    );
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const activeChat =
    conversations.find(
      (conversation: MessageConversation) =>
        conversation.id === activeChatId
    ) || conversations[0];

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter(
      (chat: MessageConversation) =>
        chat.name.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const selectConversation = (id: string) => {
    setActiveChatId(id);
    setShowInfo(false);
    setShowQuickReplies(false);
    sound.playClick();

    setTimeout(() => {
      scrollToBottom();
    }, 50);
  };

  const addMessage = (
    chatId: string,
    message: MessageItem
  ) => {
    setConversations(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              lastMessage: message.text,
              time: message.time,
              messages: [...chat.messages, message],
            }
          : chat
      )
    );
  };

  const simulateReply = (chatId: string) => {
    setIsTyping(true);

    const replyText =
      REPLY_MESSAGES[
        Math.floor(Math.random() * REPLY_MESSAGES.length)
      ];

    setTimeout(() => {
      const replyMessage: MessageItem = {
        id: `reply-${Date.now()}`,
        sender: 'them',
        text: replyText,
        time: formatTime(),
      };

      addMessage(chatId, replyMessage);
      setIsTyping(false);
      sound.playNotification();

      setTimeout(scrollToBottom, 100);
    }, 1400);
  };

  const handleSend = (
    e?: React.FormEvent,
    customText?: string
  ) => {
    e?.preventDefault();

    const text = (customText ?? inputMsg).trim();

    if (!text || !activeChat) return;

    sound.playClick();

    const chatId = activeChat.id;

    const userMessage: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'me',
      text,
      time: formatTime(),
    };

    addMessage(chatId, userMessage);

    setInputMsg('');
    setShowQuickReplies(false);

    setTimeout(scrollToBottom, 100);

    simulateReply(chatId);
  };

  const handleAttachment = () => {
    sound.playClick();

    const attachmentMessage: MessageItem = {
      id: `attachment-${Date.now()}`,
      sender: 'me',
      text: '📎 Attachment ready to share',
      time: formatTime(),
    };

    if (activeChat) {
      addMessage(activeChat.id, attachmentMessage);
      setTimeout(scrollToBottom, 100);
      simulateReply(activeChat.id);
    }
  };

  const handleVoiceMessage = () => {
    sound.playClick();

    if (!activeChat) return;

    const message: MessageItem = {
      id: `voice-${Date.now()}`,
      sender: 'me',
      text: '🎙️ Voice message • 0:08',
      time: formatTime(),
    };

    addMessage(activeChat.id, message);
    setTimeout(scrollToBottom, 100);
    simulateReply(activeChat.id);
  };

  const handlePhoneCall = () => {
    sound.playClick();
  };

  const handleVideoCall = () => {
    sound.playClick();
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070a10] text-white">
        <div className="text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-sky-400" />
          <p className="font-semibold">No conversations</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex-1 flex h-full min-h-0 overflow-hidden bg-[#070a10] text-white select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* =========================================================
          AMBIENT 3D BACKGROUND
      ========================================================= */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingOrb className="w-72 h-72 bg-sky-500/10 -top-32 -left-32" />

        <FloatingOrb className="w-96 h-96 bg-purple-500/10 top-1/3 -right-48" />

        <FloatingOrb className="w-64 h-64 bg-cyan-500/5 bottom-[-120px] left-1/3" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(14,165,233,0.08),transparent_35%)]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* =========================================================
          SIDEBAR
      ========================================================= */}

      <motion.aside
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-20 w-[285px] shrink-0 flex flex-col border-r border-white/[0.08] bg-slate-950/70 backdrop-blur-3xl shadow-[20px_0_60px_rgba(0,0,0,0.2)]"
      >
        {/* Sidebar header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{
                    rotate: 10,
                    scale: 1.1,
                  }}
                  className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-[0_5px_20px_rgba(14,165,233,0.35)]"
                >
                  <span className="text-white text-xs font-black">
                    M
                  </span>
                </motion.div>

                <h2 className="text-[15px] font-bold tracking-tight">
                  Messages
                </h2>
              </div>

              <p className="text-[10px] text-slate-500 mt-1 ml-9">
                Abhishek OS
              </p>
            </div>

            <motion.button
              whileHover={{
                scale: 1.08,
                rotate: 90,
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sound.playClick()}
              className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />

            <input
              type="text"
              placeholder="Search messages"
              value={searchQuery}
              onChange={e =>
                setSearchQuery(e.target.value)
              }
              className="w-full h-9 pl-9 pr-9 rounded-xl bg-white/[0.055] border border-white/[0.08] outline-none text-[11px] text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:bg-white/[0.08] transition-all"
            />

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Favorites */}
        <div className="px-4 pt-2 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-[0.16em] font-bold text-slate-500">
              Favorites
            </span>

            <Sparkles className="w-3 h-3 text-sky-400" />
          </div>

          <div className="flex gap-3 overflow-hidden">
            {conversations.slice(0, 4).map((chat, index) => (
              <motion.button
                key={chat.id}
                whileHover={{
                  y: -4,
                  scale: 1.05,
                }}
                whileTap={{ scale: 0.94 }}
                onClick={() =>
                  selectConversation(chat.id)
                }
                className="relative shrink-0"
              >
                <Avatar3D
                  name={chat.name}
                  src={chat.avatar}
                  size="sm"
                  index={index}
                />

                <span className="block text-[8px] text-slate-500 max-w-10 truncate mt-1">
                  {chat.name.split(' ')[0]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Conversation title */}
        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[0.16em] font-bold text-slate-500">
            Conversations
          </span>

          <span className="text-[9px] text-slate-600">
            {filteredConversations.length}
          </span>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin scrollbar-thumb-white/10">
          <AnimatePresence initial={false}>
            {filteredConversations.map(
              (chat: MessageConversation, index) => {
                const isActive =
                  chat.id === activeChatId;

                return (
                  <motion.button
                    layout
                    key={chat.id}
                    initial={{
                      opacity: 0,
                      x: -15,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -15,
                    }}
                    transition={{
                      delay: index * 0.025,
                    }}
                    onClick={() =>
                      selectConversation(chat.id)
                    }
                    className="relative w-full text-left mb-1"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeConversation"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-sky-500/[0.18] via-blue-500/[0.10] to-transparent border border-sky-400/15 shadow-[0_8px_30px_rgba(14,165,233,0.08)]"
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 32,
                        }}
                      />
                    )}

                    <div className="relative flex items-center gap-3 p-2.5 rounded-2xl">
                      <Avatar3D
                        name={chat.name}
                        src={chat.avatar}
                        size="md"
                        index={index}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-semibold truncate ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-300'
                            }`}
                          >
                            {chat.name}
                          </span>

                          <span className="text-[8px] text-slate-600 shrink-0">
                            {chat.time}
                          </span>
                        </div>

                        <p
                          className={`text-[10px] truncate mt-1 ${
                            isActive
                              ? 'text-slate-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {chat.lastMessage}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                );
              }
            )}
          </AnimatePresence>

          {filteredConversations.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <Search className="w-7 h-7 mx-auto mb-2 text-slate-700" />

              <p className="text-[11px] font-semibold text-slate-500">
                No conversations found
              </p>

              <p className="text-[9px] text-slate-600 mt-1">
                Try another search
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar bottom */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/[0.035]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-[9px] font-black">
              AK
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold text-white">
                Abhishek
              </div>
              <div className="text-[8px] text-emerald-400">
                Available
              </div>
            </div>

            <MoreHorizontal className="w-4 h-4 text-slate-600" />
          </div>
        </div>
      </motion.aside>

      {/* =========================================================
          MAIN CHAT
      ========================================================= */}

      <motion.main
        style={{
          rotateX,
          rotateY,
          transformPerspective: 1400,
        }}
        className="relative z-10 flex-1 min-w-0 flex flex-col bg-slate-950/30"
      >
        {/* Header */}
        <motion.header
          initial={{ y: -15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative h-[66px] shrink-0 flex items-center justify-between px-5 border-b border-white/[0.08] bg-slate-950/50 backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar3D
              name={activeChat.name}
              src={activeChat.avatar}
              size="md"
              index={0}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[13px] font-bold text-white truncate">
                  {activeChat.name}
                </h1>

                <motion.span
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.8)]"
                />
              </div>

              <div className="text-[9px] text-emerald-400 mt-0.5">
                Online
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{
                scale: 1.08,
                y: -2,
              }}
              whileTap={{ scale: 0.92 }}
              onClick={handlePhoneCall}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Audio call"
            >
              <Phone className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.08,
                y: -2,
              }}
              whileTap={{ scale: 0.92 }}
              onClick={handleVideoCall}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Video call"
            >
              <Video className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.08,
              }}
              whileTap={{ scale: 0.92 }}
              onClick={() =>
                setIsMuted(prev => !prev)
              }
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isMuted
                  ? 'text-rose-400 bg-rose-400/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Mute conversation"
            >
              <Volume2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{
                scale: 1.08,
              }}
              whileTap={{ scale: 0.92 }}
              onClick={() =>
                setShowInfo(prev => !prev)
              }
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                showInfo
                  ? 'bg-sky-500/15 text-sky-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Info className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.header>

        {/* Profile mini card */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{
                opacity: 0,
                y: -15,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -15,
                scale: 0.97,
              }}
              className="absolute z-50 top-[72px] right-5 w-72 rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-3xl shadow-2xl p-5"
            >
              <div className="flex flex-col items-center text-center">
                <Avatar3D
                  name={activeChat.name}
                  src={activeChat.avatar}
                  size="lg"
                  index={0}
                />

                <h3 className="mt-3 text-sm font-bold">
                  {activeChat.name}
                </h3>

                <p className="text-[10px] text-emerald-400 mt-1">
                  Active now
                </p>

                <div className="grid grid-cols-2 gap-2 w-full mt-5">
                  <button className="py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-slate-300">
                    Contact
                  </button>

                  <button className="py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] text-slate-300">
                    Details
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =====================================================
            MESSAGE AREA
        ===================================================== */}

        <div
          ref={messagesContainerRef}
          className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-6 scrollbar-thin scrollbar-thumb-white/10"
          onScroll={event => {
            const target = event.currentTarget;

            const distance =
              target.scrollHeight -
              target.scrollTop -
              target.clientHeight;

            setShowScrollButton(distance > 180);
          }}
        >
          {/* Date separator */}
          <div className="flex items-center justify-center mb-7">
            <div className="flex items-center gap-3">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-white/10" />

              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[8px] font-semibold text-slate-500">
                TODAY
              </span>

              <div className="w-12 h-px bg-gradient-to-l from-transparent to-white/10" />
            </div>
          </div>

          {/* Messages */}
          <div className="max-w-3xl mx-auto space-y-3">
            <AnimatePresence initial={false}>
              {activeChat.messages.map(
                (msg: MessageItem, index: number) => {
                  const isMe = msg.sender === 'me';

                  return (
                    <motion.div
                      layout
                      key={msg.id}
                      initial={{
                        opacity: 0,
                        y: 18,
                        scale: 0.92,
                        x: isMe ? 20 : -20,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        x: 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 25,
                        delay: Math.min(
                          index * 0.02,
                          0.15
                        ),
                      }}
                      className={`flex items-end gap-2 ${
                        isMe
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      {!isMe && (
                        <Avatar3D
                          name={activeChat.name}
                          src={activeChat.avatar}
                          size="sm"
                          online={false}
                          index={0}
                        />
                      )}

                      <div
                        className={`group max-w-[72%] ${
                          isMe ? 'items-end' : 'items-start'
                        } flex flex-col`}
                      >
                        <motion.div
                          whileHover={{
                            y: -2,
                            scale: 1.01,
                          }}
                          className={`relative px-4 py-3 text-[11px] leading-relaxed shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${
                            isMe
                              ? 'rounded-[20px] rounded-br-[6px] bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white border border-sky-300/20'
                              : 'rounded-[20px] rounded-bl-[6px] bg-white/[0.07] backdrop-blur-xl text-slate-200 border border-white/[0.09]'
                          }`}
                        >
                          {/* Bubble shine */}
                          <div
                            className={`absolute inset-0 rounded-[inherit] pointer-events-none ${
                              isMe
                                ? 'bg-gradient-to-br from-white/20 via-transparent to-transparent'
                                : 'bg-gradient-to-br from-white/[0.07] via-transparent to-transparent'
                            }`}
                          />

                          <span className="relative">
                            {msg.text}
                          </span>

                          <div
                            className={`relative flex items-center justify-end gap-1 mt-1.5 text-[8px] ${
                              isMe
                                ? 'text-sky-100/70'
                                : 'text-slate-500'
                            }`}
                          >
                            <span>{msg.time}</span>

                            {isMe && (
                              <CheckCheck className="w-3 h-3" />
                            )}
                          </div>
                        </motion.div>

                        {/* Reaction placeholder */}
                        <motion.button
                          initial={{ opacity: 0 }}
                          whileHover={{
                            opacity: 1,
                          }}
                          className="opacity-0 group-hover:opacity-100 mt-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-slate-500 hover:text-white transition-all"
                        >
                          ♡ React
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                }
              )}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                    scale: 0.9,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 5,
                  }}
                  className="flex items-end gap-2"
                >
                  <Avatar3D
                    name={activeChat.name}
                    src={activeChat.avatar}
                    size="sm"
                    online
                  />

                  <div className="px-4 py-3 rounded-[20px] rounded-bl-[6px] bg-white/[0.07] border border-white/[0.09]">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          animate={{
                            y: [0, -4, 0],
                            opacity: [0.35, 1, 0.35],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.12,
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-sky-400"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{
                  opacity: 0,
                  scale: 0.7,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.7,
                  y: 10,
                }}
                onClick={scrollToBottom}
                className="fixed bottom-28 right-7 w-9 h-9 rounded-full bg-slate-800/90 border border-white/10 shadow-xl flex items-center justify-center text-slate-300 hover:text-white"
              >
                <ArrowDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* =====================================================
            QUICK REPLIES
        ===================================================== */}

        <AnimatePresence>
          {showQuickReplies && (
            <motion.div
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 12,
              }}
              className="px-5 pb-2"
            >
              <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto">
                {QUICK_REPLIES.map(reply => (
                  <motion.button
                    key={reply}
                    whileHover={{
                      y: -2,
                      scale: 1.02,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    onClick={() =>
                      handleSend(undefined, reply)
                    }
                    className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-[9px] text-slate-300 hover:bg-sky-500/10 hover:border-sky-400/20 hover:text-sky-300 transition-colors"
                  >
                    {reply}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =====================================================
            COMPOSER
        ===================================================== */}

        <motion.div
          initial={{
            y: 20,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          className="relative shrink-0 px-5 pt-2 pb-4 border-t border-white/[0.07] bg-slate-950/65 backdrop-blur-3xl"
        >
          <div className="max-w-3xl mx-auto">
            {/* Composer toolbar */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{
                    scale: 1.08,
                    rotate: 5,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={handleAttachment}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-white/5"
                  title="Attach"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={handleAttachment}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-white/5"
                  title="Photos"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={() =>
                    setShowQuickReplies(prev => !prev)
                  }
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    showQuickReplies
                      ? 'text-sky-400 bg-sky-400/10'
                      : 'text-slate-500 hover:text-sky-400 hover:bg-white/5'
                  }`}
                  title="Quick replies"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={() => sound.playClick()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-white/5"
                >
                  <FileText className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <span className="text-[8px] text-slate-600">
                Messages are simulated
              </span>
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="relative flex items-end gap-2 p-2 rounded-2xl bg-white/[0.055] border border-white/[0.09] shadow-[0_10px_40px_rgba(0,0,0,0.25)] focus-within:border-sky-400/30 focus-within:bg-white/[0.07] transition-all"
            >
              <textarea
                rows={1}
                value={inputMsg}
                onChange={e =>
                  setInputMsg(e.target.value)
                }
                onKeyDown={e => {
                  if (
                    e.key === 'Enter' &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Message ${activeChat.name}...`}
                className="flex-1 resize-none bg-transparent outline-none px-2 py-2 text-[11px] text-white placeholder:text-slate-600 max-h-24"
              />

              <div className="flex items-center gap-1 pb-0.5">
                <motion.button
                  type="button"
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={() => sound.playClick()}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-yellow-400 hover:bg-white/5"
                >
                  <Smile className="w-4 h-4" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  onClick={handleVoiceMessage}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-sky-400 hover:bg-white/5"
                >
                  <Mic className="w-4 h-4" />
                </motion.button>

                <motion.button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  whileHover={
                    inputMsg.trim()
                      ? {
                          scale: 1.08,
                          rotate: -3,
                        }
                      : {}
                  }
                  whileTap={
                    inputMsg.trim()
                      ? {
                          scale: 0.88,
                        }
                      : {}
                  }
                  className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all overflow-hidden ${
                    inputMsg.trim()
                      ? 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white shadow-[0_5px_20px_rgba(14,165,233,0.35)]'
                      : 'bg-white/5 text-slate-700'
                  }`}
                >
                  {inputMsg.trim() && (
                    <motion.div
                      animate={{
                        x: ['-120%', '120%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]"
                    />
                  )}

                  <Send className="relative w-4 h-4" />
                </motion.button>
              </div>
            </form>

            <div className="flex justify-center mt-2">
              <span className="text-[8px] text-slate-700">
                Press Enter to send • Shift + Enter for a new line
              </span>
            </div>
          </div>
        </motion.div>
      </motion.main>

      {/* =========================================================
          RIGHT INFORMATION PANEL
      ========================================================= */}

      <AnimatePresence>
        {showInfo && (
          <motion.aside
            initial={{
              width: 0,
              opacity: 0,
              x: 30,
            }}
            animate={{
              width: 225,
              opacity: 1,
              x: 0,
            }}
            exit={{
              width: 0,
              opacity: 0,
              x: 30,
            }}
            className="relative z-20 shrink-0 overflow-hidden border-l border-white/[0.08] bg-slate-950/70 backdrop-blur-3xl"
          >
            <div className="w-[225px] p-5">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500">
                  Contact
                </span>

                <button
                  onClick={() => setShowInfo(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Avatar3D
                    name={activeChat.name}
                    src={activeChat.avatar}
                    size="lg"
                    index={0}
                  />
                </motion.div>

                <h3 className="mt-3 text-sm font-bold">
                  {activeChat.name}
                </h3>

                <span className="mt-1 text-[9px] text-emerald-400">
                  Online
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6">
                <button
                  onClick={handlePhoneCall}
                  className="h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex flex-col items-center justify-center gap-1 hover:bg-white/[0.08]"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[8px] text-slate-500">
                    Call
                  </span>
                </button>

                <button
                  onClick={handleVideoCall}
                  className="h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex flex-col items-center justify-center gap-1 hover:bg-white/[0.08]"
                >
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[8px] text-slate-500">
                    Video
                  </span>
                </button>

                <button
                  onClick={() =>
                    setIsMuted(prev => !prev)
                  }
                  className="h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex flex-col items-center justify-center gap-1 hover:bg-white/[0.08]"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[8px] text-slate-500">
                    {isMuted ? 'Unmute' : 'Mute'}
                  </span>
                </button>
              </div>

              <div className="mt-7">
                <div className="text-[9px] uppercase tracking-[0.14em] font-bold text-slate-600 mb-3">
                  Shared
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(item => (
                    <motion.div
                      key={item}
                      whileHover={{
                        scale: 1.05,
                        rotateY: 8,
                      }}
                      className="aspect-square rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.07] flex items-center justify-center"
                    >
                      <ImageIcon className="w-4 h-4 text-slate-700" />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-7 p-3 rounded-2xl bg-gradient-to-br from-sky-500/10 to-purple-500/5 border border-sky-400/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />

                  <span className="text-[9px] font-bold text-sky-300">
                    Abhishek OS
                  </span>
                </div>

                <p className="text-[9px] leading-relaxed text-slate-500">
                  Conversations are stored inside the
                  virtual messaging environment.
                </p>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};