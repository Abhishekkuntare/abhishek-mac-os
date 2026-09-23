import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  ArchiveRestore,
  ChevronDown,
  Clock3,
  Edit3,
  Inbox,
  Mail,
  MailOpen,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Reply,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

import { sound } from '../../services/soundService';

interface Email {
  id: string;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  unread: boolean;
  starred: boolean;
}

type MailFolder = 'inbox' | 'sent' | 'archive' | 'trash';

const SAMPLE_EMAILS: Email[] = [
  {
    id: 'e1',
    sender: 'Velosa Studio Partner',
    email: 'partners@velosa.studio',
    subject: 'Abhishek OS 1.0 Milestone Review & Launch',
    preview:
      'Hi Abhishek, the new glassmorphic UI and windowing architecture look breathtaking...',
    body: `Hi Abhishek,

The new glassmorphic UI and windowing architecture look breathtaking! The community and investors are super eager for the public demonstration.

Let us know when you'd like to schedule the preview keynote session.

Warm regards,

Velosa Studio Team`,
    time: '10:42 AM',
    unread: true,
    starred: true,
  },
  {
    id: 'e2',
    sender: 'Google AI Studio Team',
    email: 'cloud-apps@google.com',
    subject: 'Deployment Authorization Successful',
    preview:
      'Your application container for Abhishek OS has been allocated dedicated runtime resources...',
    body: `Hello Abhishek,

Your application container for Abhishek OS has been allocated dedicated runtime resources on Google Cloud Run containers.

Everything is running with optimal latency and high availability.

Cheers,

AI Studio Platform Operations`,
    time: 'Yesterday',
    unread: false,
    starred: false,
  },
  {
    id: 'e3',
    sender: 'GitHub Notifications',
    email: 'notifications@github.com',
    subject: '[AbhishekOS/core] 12 pull requests merged to main branch',
    preview:
      'All automated continuous integration checks passed with 100% build green status...',
    body: `All automated continuous integration checks passed with 100% build green status.

• WindowManager snap animations

• Web Audio sound chimes

• Virtual File System indexed storage

All checks completed successfully.`,
    time: 'Sep 17',
    unread: false,
    starred: false,
  },
  {
    id: 'e4',
    sender: 'Apple Developer',
    email: 'developer@apple.com',
    subject: 'Designing fluid macOS experiences',
    preview:
      'Explore new interaction patterns, materials and animation principles...',
    body: `Hello Abhishek,

Explore new interaction patterns, materials and animation principles for creating beautiful desktop experiences.

Your Abhishek OS project continues to push interesting ideas around spatial interfaces.

Apple Developer Team`,
    time: 'Sep 16',
    unread: false,
    starred: true,
  },
  {
    id: 'e5',
    sender: 'Vercel',
    email: 'notifications@vercel.com',
    subject: 'Production deployment completed',
    preview:
      'Your latest deployment was successfully completed and is now available...',
    body: `Your latest production deployment was completed successfully.

Build:
abhishek-os-production

Status:
Ready

Environment:
Production

Deployment completed successfully.`,
    time: 'Sep 15',
    unread: false,
    starred: false,
  },
];

const folderMeta: Record<
  MailFolder,
  {
    label: string;
    icon: React.ElementType;
  }
> = {
  inbox: {
    label: 'Inbox',
    icon: Inbox,
  },
  sent: {
    label: 'Sent',
    icon: Send,
  },
  archive: {
    label: 'Archive',
    icon: Archive,
  },
  trash: {
    label: 'Trash',
    icon: Trash2,
  },
};

const initialsFor = (name: string) => {
  const parts = name.split(' ').filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const avatarGradient = (index: number) => {
  const gradients = [
    'from-sky-400 via-blue-500 to-indigo-600',
    'from-violet-400 via-purple-500 to-fuchsia-600',
    'from-emerald-400 via-cyan-500 to-sky-600',
    'from-orange-400 via-pink-500 to-purple-600',
    'from-cyan-400 via-blue-500 to-violet-600',
  ];

  return gradients[index % gradients.length];
};

export const MailApp: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>(SAMPLE_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<string>(
    SAMPLE_EMAILS[0].id,
  );

  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState<MailFolder>('inbox');

  const [isComposing, setIsComposing] = useState(false);

  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const [showDetails, setShowDetails] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);

  const unreadCount = emails.filter(mail => mail.unread).length;

  const filteredEmails = useMemo(() => {
    const query = search.trim().toLowerCase();

    let folderEmails = emails;

    /*
     * In this simulator all sample messages start in Inbox.
     * Sent messages are represented by the local "sent-" prefix.
     * Archived/trash messages are tracked using internal id prefixes.
     */

    if (folder === 'sent') {
      folderEmails = emails.filter(mail => mail.id.startsWith('sent-'));
    } else if (folder === 'archive') {
      folderEmails = emails.filter(mail => mail.id.startsWith('archive-'));
    } else if (folder === 'trash') {
      folderEmails = emails.filter(mail => mail.id.startsWith('trash-'));
    } else {
      folderEmails = emails.filter(
        mail =>
          !mail.id.startsWith('archive-') &&
          !mail.id.startsWith('trash-'),
      );
    }

    if (!query) return folderEmails;

    return folderEmails.filter(mail =>
      [
        mail.sender,
        mail.email,
        mail.subject,
        mail.preview,
        mail.body,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [emails, folder, search]);

  const selectedEmail =
    emails.find(email => email.id === selectedEmailId) ||
    filteredEmails[0] ||
    emails[0];

  const selectEmail = (email: Email) => {
    setSelectedEmailId(email.id);

    setEmails(previous =>
      previous.map(item =>
        item.id === email.id
          ? {
              ...item,
              unread: false,
            }
          : item,
      ),
    );

    sound.playClick();
  };

  const toggleStar = (id: string) => {
    setEmails(previous =>
      previous.map(mail =>
        mail.id === id
          ? {
              ...mail,
              starred: !mail.starred,
            }
          : mail,
      ),
    );

    sound.playClick();
  };

  const archiveEmail = (id: string) => {
    setEmails(previous =>
      previous.map(mail =>
        mail.id === id
          ? {
              ...mail,
              id: mail.id.startsWith('archive-')
                ? mail.id
                : `archive-${mail.id}`,
            }
          : mail,
      ),
    );

    sound.playClick();
  };

  const trashEmail = (id: string) => {
    setEmails(previous =>
      previous.map(mail =>
        mail.id === id
          ? {
              ...mail,
              id: mail.id.startsWith('trash-')
                ? mail.id
                : `trash-${mail.id}`,
            }
          : mail,
      ),
    );

    sound.playClick();
  };

  const restoreEmail = (id: string) => {
    setEmails(previous =>
      previous.map(mail =>
        mail.id === id
          ? {
              ...mail,
              id: mail.id.replace(/^(archive-|trash-)/, ''),
            }
          : mail,
      ),
    );

    sound.playClick();
  };

  const deletePermanently = (id: string) => {
    setEmails(previous => previous.filter(mail => mail.id !== id));

    const nextEmail = filteredEmails.find(mail => mail.id !== id);

    if (nextEmail) {
      setSelectedEmailId(nextEmail.id);
    }

    sound.playClick();
  };

  const handleSendMail = (event: React.FormEvent) => {
    event.preventDefault();

    if (!composeTo.trim()) return;

    sound.playClick();

    const newMail: Email = {
      id: `sent-${Date.now()}`,
      sender: 'Abhishek Kuntare',
      email: 'abhishekkuntare02@gmail.com',
      subject: composeSubject || '(No Subject)',
      preview: composeBody.slice(0, 100),
      body: composeBody || '(No message body)',
      time: 'Just now',
      unread: false,
      starred: false,
    };

    setEmails(previous => [newMail, ...previous]);

    setSelectedEmailId(newMail.id);

    setIsComposing(false);

    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');

    setFolder('sent');
  };

  const openReply = () => {
    if (!selectedEmail) return;

    setComposeTo(selectedEmail.email);
    setComposeSubject(
      selectedEmail.subject.startsWith('Re:')
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`,
    );

    setComposeBody(
      `\n\n\n--- Original Message ---\n${selectedEmail.body}`,
    );

    setIsComposing(true);

    sound.playClick();
  };

  return (
    <div className="relative flex h-full w-full flex-1 overflow-hidden bg-[#070b12] text-white select-none">
      {/* =========================================================
          AMBIENT 3D BACKGROUND
      ========================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
        />

        <motion.div
          animate={{
            x: [0, -50, 25, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-3xl"
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.07),transparent_35%)]" />
      </div>

      {/* =========================================================
          MAIL SIDEBAR
      ========================================================== */}

      <motion.aside
        animate={{
          width: isSidebarCollapsed ? 68 : 205,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 28,
        }}
        className="relative z-20 flex shrink-0 flex-col border-r border-white/[0.08] bg-white/[0.035] backdrop-blur-3xl"
      >
        {/* Sidebar top */}
        <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-3">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-sky-500/20">
                  <Mail className="h-4 w-4 text-white" />
                </div>

                <div>
                  <div className="text-[12px] font-bold tracking-tight">
                    Mail
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Abhishek OS
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => {
              setIsSidebarCollapsed(value => !value);
              sound.playClick();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
            title="Toggle Sidebar"
          >
            {isSidebarCollapsed ? (
              <ArrowRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Compose */}
        <div className="p-3">
          <motion.button
            whileHover={{
              scale: 1.025,
              y: -1,
            }}
            whileTap={{
              scale: 0.97,
            }}
            onClick={() => {
              setIsComposing(true);
              sound.playClick();
            }}
            className={`relative flex w-full items-center overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-white shadow-xl shadow-sky-500/20 ${
              isSidebarCollapsed
                ? 'h-10 justify-center'
                : 'h-10 justify-center gap-2'
            }`}
          >
            <motion.div
              animate={{
                x: ['-120%', '120%'],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute inset-y-0 w-1/3 bg-white/20 blur-md"
            />

            <PenLine className="relative z-10 h-4 w-4" />

            {!isSidebarCollapsed && (
              <span className="relative z-10 text-[11px]">Compose</span>
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-1 px-2">
          {(
            Object.keys(folderMeta) as MailFolder[]
          ).map(currentFolder => {
            const meta = folderMeta[currentFolder];
            const Icon = meta.icon;
            const isActive = folder === currentFolder;

            const count =
              currentFolder === 'inbox'
                ? unreadCount
                : currentFolder === 'trash'
                  ? emails.filter(email =>
                      email.id.startsWith('trash-'),
                    ).length
                  : 0;

            return (
              <button
                key={currentFolder}
                onClick={() => {
                  setFolder(currentFolder);
                  sound.playClick();
                }}
                className={`relative flex h-10 w-full items-center rounded-xl transition-colors ${
                  isSidebarCollapsed
                    ? 'justify-center'
                    : 'justify-start gap-3 px-3'
                } ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMailFolder"
                    className="absolute inset-0 rounded-xl bg-white/[0.09] shadow-inner shadow-white/[0.03]"
                    transition={{
                      type: 'spring',
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}

                <Icon
                  className={`relative z-10 h-4 w-4 ${
                    isActive ? 'text-sky-400' : ''
                  }`}
                />

                {!isSidebarCollapsed && (
                  <>
                    <span className="relative z-10 flex-1 text-left text-[11px] font-medium">
                      {meta.label}
                    </span>

                    {count > 0 && (
                      <span className="relative z-10 rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Account */}
        <div className="border-t border-white/[0.07] p-3">
          {!isSidebarCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-2.5"
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-[9px] font-bold">
                  AK
                </div>

                <div className="min-w-0">
                  <div className="truncate text-[10px] font-semibold">
                    Abhishek Kuntare
                  </div>
                  <div className="truncate text-[8px] text-slate-500">
                    Gmail Account
                  </div>
                </div>
              </div>

              <div className="mt-2 truncate text-[8px] text-slate-500">
                abhishekkuntare02@gmail.com
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-[9px] font-bold">
                AK
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* =========================================================
          EMAIL LIST
      ========================================================== */}

      <section className="relative z-10 flex w-[300px] shrink-0 flex-col border-r border-white/[0.07] bg-black/10 backdrop-blur-2xl">
        {/* List header */}
        <div className="border-b border-white/[0.07] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold">
                {folderMeta[folder].label}
              </div>

              <div className="mt-0.5 text-[9px] text-slate-500">
                {filteredEmails.length} messages
              </div>
            </div>

            <button
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
              title="Mail settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="group relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400" />

            <input
              type="text"
              placeholder="Search Mail"
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.045] pl-9 pr-3 text-[10px] text-white outline-none transition-all placeholder:text-slate-600 focus:border-sky-400/40 focus:bg-white/[0.07] focus:shadow-lg focus:shadow-sky-500/5"
            />
          </div>
        </div>

        {/* Email cards */}
        <div className="relative flex-1 overflow-y-auto p-2">
          <AnimatePresence mode="popLayout">
            {filteredEmails.map((mail, index) => {
              const isActive = mail.id === selectedEmailId;
              const isHovered = hoveredEmail === mail.id;

              return (
                <motion.div
                  layout
                  key={mail.id}
                  initial={{
                    opacity: 0,
                    x: -20,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    x: -30,
                    scale: 0.95,
                  }}
                  transition={{
                    delay: Math.min(index * 0.035, 0.2),
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                  }}
                  onMouseEnter={() => setHoveredEmail(mail.id)}
                  onMouseLeave={() => setHoveredEmail(null)}
                  onClick={() => selectEmail(mail)}
                  className="relative mb-1 cursor-pointer"
                >
                  <motion.div
                    animate={{
                      y: isHovered ? -2 : 0,
                      scale: isHovered ? 1.01 : 1,
                    }}
                    className={`relative overflow-hidden rounded-xl border p-3 transition-colors ${
                      isActive
                        ? 'border-sky-400/25 bg-gradient-to-br from-sky-500/[0.14] to-blue-500/[0.05] shadow-lg shadow-sky-500/[0.05]'
                        : 'border-transparent bg-transparent hover:border-white/[0.06] hover:bg-white/[0.035]'
                    }`}
                  >
                    {/* Active glow */}
                    {isActive && (
                      <motion.div
                        layoutId="activeMailGlow"
                        className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sky-400 shadow-lg shadow-sky-400"
                      />
                    )}

                    <div className="flex gap-2.5">
                      {/* Avatar */}
                      <motion.div
                        animate={{
                          rotateX: isHovered ? 5 : 0,
                          rotateY: isHovered ? -5 : 0,
                          scale: isHovered ? 1.05 : 1,
                        }}
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarGradient(
                          index,
                        )} text-[9px] font-black shadow-lg`}
                        style={{
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {initialsFor(mail.sender)}
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div
                            className={`truncate text-[10px] ${
                              mail.unread
                                ? 'font-bold text-white'
                                : 'font-medium text-slate-300'
                            }`}
                          >
                            {mail.sender}
                          </div>

                          <span className="shrink-0 text-[8px] text-slate-600">
                            {mail.time}
                          </span>
                        </div>

                        <div
                          className={`truncate text-[10px] ${
                            mail.unread
                              ? 'font-semibold text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {mail.subject}
                        </div>

                        <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-slate-600">
                          {mail.preview}
                        </p>

                        <div className="mt-2 flex items-center justify-between">
                          {mail.unread ? (
                            <span className="flex items-center gap-1 text-[8px] font-semibold text-sky-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow shadow-sky-400" />
                              Unread
                            </span>
                          ) : (
                            <span />
                          )}

                          <motion.button
                            whileHover={{
                              scale: 1.2,
                              rotate: 8,
                            }}
                            whileTap={{
                              scale: 0.8,
                            }}
                            onClick={event => {
                              event.stopPropagation();
                              toggleStar(mail.id);
                            }}
                            className="text-slate-600 hover:text-yellow-400"
                          >
                            <Star
                              className={`h-3 w-3 ${
                                mail.starred
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : ''
                              }`}
                            />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredEmails.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col items-center justify-center px-8 text-center"
            >
              <motion.div
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.04] shadow-2xl"
              >
                <MailOpen className="h-7 w-7 text-slate-600" />
              </motion.div>

              <div className="text-xs font-semibold text-slate-400">
                No messages found
              </div>

              <div className="mt-1 text-[9px] text-slate-600">
                Try another search or folder.
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================
          EMAIL READER
      ========================================================== */}

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-br from-transparent via-white/[0.01] to-sky-500/[0.015]">
        {selectedEmail ? (
          <>
            {/* Toolbar */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 backdrop-blur-xl">
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSelectedEmailId('');
                    sound.playClick();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                  title="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                  title="Archive"
                  onClick={() => archiveEmail(selectedEmail.id)}
                >
                  <Archive className="h-4 w-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                  title="Delete"
                  onClick={() => trashEmail(selectedEmail.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleStar(selectedEmail.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10"
                >
                  <Star
                    className={`h-4 w-4 ${
                      selectedEmail.starred
                        ? 'fill-yellow-400 text-yellow-400'
                        : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => setShowDetails(value => !value)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reader */}
            <div className="relative flex-1 overflow-y-auto">
              {/* 3D ambient mail glow */}
              <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-sky-500/[0.06] blur-3xl" />

              <motion.article
                key={selectedEmail.id}
                initial={{
                  opacity: 0,
                  y: 18,
                  rotateX: 2,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 180,
                  damping: 22,
                }}
                className="mx-auto w-full max-w-4xl px-7 py-8"
                style={{
                  perspective: '1200px',
                }}
              >
                {/* Subject */}
                <div className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-full border border-sky-400/15 bg-sky-400/[0.08] px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest text-sky-400">
                      {folderMeta[folder].label}
                    </span>

                    {selectedEmail.unread && (
                      <span className="flex items-center gap-1 text-[8px] font-medium text-sky-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                        New message
                      </span>
                    )}
                  </div>

                  <motion.h1
                    initial={{
                      opacity: 0,
                      x: -15,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl"
                  >
                    {selectedEmail.subject}
                  </motion.h1>
                </div>

                {/* Sender card */}
                <motion.div
                  whileHover={{
                    y: -2,
                    rotateX: 1,
                  }}
                  className="mb-8 flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-xl shadow-black/10 backdrop-blur-xl"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-xs font-black shadow-lg shadow-blue-500/20">
                      {initialsFor(selectedEmail.sender)}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold text-white">
                        {selectedEmail.sender}
                      </div>

                      <div className="truncate text-[9px] text-slate-500">
                        {selectedEmail.email}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[8px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Verified sender
                      </div>
                    </div>
                  </div>

                  <div className="hidden text-right sm:block">
                    <div className="text-[9px] text-slate-500">
                      {selectedEmail.time}
                    </div>

                    <button
                      onClick={() => setShowDetails(value => !value)}
                      className="mt-1 flex items-center gap-1 text-[8px] text-sky-400 hover:text-sky-300"
                    >
                      Details
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>

                {/* Details */}
                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        height: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        height: 'auto',
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        y: -10,
                      }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-[9px] text-slate-500">
                        <div className="grid grid-cols-[70px_1fr] gap-y-2">
                          <span>From</span>
                          <span className="text-slate-300">
                            {selectedEmail.email}
                          </span>

                          <span>To</span>
                          <span className="text-slate-300">
                            abhishekkuntare02@gmail.com
                          </span>

                          <span>Date</span>
                          <span className="text-slate-300">
                            {selectedEmail.time}
                          </span>

                          <span>Security</span>
                          <span className="text-emerald-400">
                            Encrypted connection
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email body */}
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.08,
                  }}
                  className="rounded-3xl border border-white/[0.06] bg-white/[0.018] p-6 shadow-2xl shadow-black/10"
                >
                  <div className="whitespace-pre-wrap text-[13px] leading-7 text-slate-300">
                    {selectedEmail.body}
                  </div>
                </motion.div>

                {/* Reply area */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    onClick={openReply}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[10px] font-semibold text-slate-300 transition-colors hover:border-sky-400/20 hover:bg-sky-400/[0.08] hover:text-white"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Reply
                  </motion.button>

                  <motion.button
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    onClick={() => setIsComposing(true)}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[10px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Forward
                  </motion.button>
                </div>
              </motion.article>
            </div>
          </>
        ) : (
          /* Empty reader state */
          <div className="flex flex-1 items-center justify-center">
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.85,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="text-center"
            >
              <motion.div
                animate={{
                  rotateY: [0, 8, -8, 0],
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-2xl"
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <Mail className="h-8 w-8 text-slate-600" />
              </motion.div>

              <div className="text-sm font-semibold text-slate-400">
                No message selected
              </div>

              <div className="mt-1 text-[10px] text-slate-600">
                Select an email to start reading.
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* =========================================================
          COMPOSE WINDOW
      ========================================================== */}

      <AnimatePresence>
        {isComposing && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-end justify-end bg-black/35 p-4 backdrop-blur-[2px] sm:p-6"
            onMouseDown={event => {
              if (event.target === event.currentTarget) {
                setIsComposing(false);
              }
            }}
          >
            <motion.form
              initial={{
                opacity: 0,
                y: 80,
                scale: 0.9,
                rotateX: 8,
                rotateY: -3,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
                rotateY: 0,
              }}
              exit={{
                opacity: 0,
                y: 60,
                scale: 0.92,
              }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 24,
              }}
              onSubmit={handleSendMail}
              className="relative w-full max-w-[520px] overflow-hidden rounded-3xl border border-white/[0.14] bg-[#101722]/90 shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-3xl"
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1200px',
              }}
            >
              {/* Compose ambient glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />

              {/* Header */}
              <div className="relative flex h-12 items-center justify-between border-b border-white/[0.08] bg-white/[0.035] px-4">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      rotate: [0, -5, 5, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                  </motion.div>

                  <div>
                    <div className="text-[11px] font-bold">
                      New Message
                    </div>

                    <div className="text-[8px] text-slate-500">
                      Abhishek Mail
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Fields */}
              <div className="relative p-4">
                <div className="space-y-2">
                  <div className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-3">
                    <span className="mr-3 text-[9px] font-semibold text-slate-600">
                      To
                    </span>

                    <input
                      type="email"
                      required
                      placeholder="recipient@example.com"
                      value={composeTo}
                      onChange={event => setComposeTo(event.target.value)}
                      className="h-9 min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.025] px-3">
                    <span className="mr-3 text-[9px] font-semibold text-slate-600">
                      Subject
                    </span>

                    <input
                      type="text"
                      placeholder="What is this about?"
                      value={composeSubject}
                      onChange={event =>
                        setComposeSubject(event.target.value)
                      }
                      className="h-9 min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <div className="relative">
                    <textarea
                      rows={9}
                      placeholder="Write your message..."
                      value={composeBody}
                      onChange={event =>
                        setComposeBody(event.target.value)
                      }
                      className="w-full resize-none rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-[11px] leading-6 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-sky-400/30"
                    />
                  </div>
                </div>

                {/* Compose toolbar */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{
                      scale: 1.03,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    type="submit"
                    className="relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-[10px] font-bold shadow-lg shadow-sky-500/20"
                  >
                    <motion.div
                      animate={{
                        x: ['-100%', '150%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute inset-y-0 w-1/3 bg-white/20 blur-md"
                    />

                    <Send className="relative z-10 h-3.5 w-3.5" />

                    <span className="relative z-10">
                      Send Message
                    </span>

                    <Zap className="relative z-10 h-3 w-3" />
                  </motion.button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};