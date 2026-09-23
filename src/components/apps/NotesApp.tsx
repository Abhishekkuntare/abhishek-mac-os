import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Plus,
  Trash2,
  Folder,
  FileText,
  Search,
  Pin,
  PinOff,
  MoreHorizontal,
  Clock3,
  Hash,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Check,
  X,
  PanelLeft,
  Sparkles,
  Command,
  Archive,
  Star,
  Copy,
  AlignLeft,
  Minus,
  Save,
  RotateCcw,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'motion/react';

import { sound } from '../../services/soundService';

interface Note {
  id: string;
  title: string;
  body: string;
  date: string;
  folder: string;
  pinned?: boolean;
}

const STORAGE_KEY = 'abhishek-os-notes';

const DEFAULT_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Abhishek OS Architecture Blueprint',
    date: 'Sep 19, 2026',
    folder: 'Work',
    pinned: true,
    body: `
      <h1>Abhishek OS Architecture</h1>
      <p>Engineered by Abhishek Kuntare (abhishekkuntare02@gmail.com).</p>

      <h2>Core Principles:</h2>

      <ul>
        <li>Glassmorphic UI with zero visual compromises.</li>
        <li>Window manager with 8-direction live resizing and screen-edge snapping.</li>
        <li>Fully simulated Virtual File System (VFS) with persistent localStorage backplane.</li>
        <li>Sound synthesis engine using Web Audio API oscillators.</li>
        <li>Native apps ecosystem: Code Studio, Finder, Terminal, Browser, Music, Settings.</li>
      </ul>
    `,
  },

  {
    id: 'n2',
    title: 'Velosa Design Studio Goals',
    date: 'Sep 18, 2026',
    folder: 'Work',
    body: `
      <ol>
        <li>Deliver iconic digital interfaces for next-generation products.</li>
        <li>Maintain high craft in micro-interactions, responsive typography, and tactile motion.</li>
        <li>Expand design system tokens for cross-platform engineering.</li>
      </ol>
    `,
  },

  {
    id: 'n3',
    title: 'Books & Resources to Revisit',
    date: 'Sep 15, 2026',
    folder: 'Personal',
    body: `
      <ul>
        <li>Designing Data-Intensive Applications</li>
        <li>The Design of Everyday Things</li>
        <li>Refactoring UI</li>
        <li>Fluid Interfaces & Gesture Dynamics</li>
      </ul>
    `,
  },
];

const FOLDERS = [
  {
    name: 'All Notes',
    icon: FileText,
  },
  {
    name: 'Work',
    icon: Folder,
  },
  {
    name: 'Personal',
    icon: Folder,
  },
  {
    name: 'Ideas',
    icon: Sparkles,
  },
];

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Converts the old Markdown/plain-text notes into HTML.
 * This also means older notes stored by your previous version
 * can continue to work.
 */
const markdownToHtml = (value: string) => {
  if (!value) {
    return '<p><br /></p>';
  }

  // Already HTML.
  if (/<\/?(p|h1|h2|h3|ul|ol|li|strong|em|u|div|br)\b/i.test(value)) {
    return value;
  }

  const lines = value.replace(/\r\n/g, '\n').split('\n');

  let html = '';
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = null;
    }
  };

  lines.forEach(line => {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      html += '<p><br /></p>';
      return;
    }

    // Heading 1
    if (/^#\s+/.test(trimmed)) {
      closeList();

      const text = trimmed.replace(/^#\s+/, '');

      html += `<h1>${escapeHtml(text)}</h1>`;
      return;
    }

    // Heading 2
    if (/^##\s+/.test(trimmed)) {
      closeList();

      const text = trimmed.replace(/^##\s+/, '');

      html += `<h2>${escapeHtml(text)}</h2>`;
      return;
    }

    // Heading 3
    if (/^###\s+/.test(trimmed)) {
      closeList();

      const text = trimmed.replace(/^###\s+/, '');

      html += `<h3>${escapeHtml(text)}</h3>`;
      return;
    }

    // Bullet
    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') {
        closeList();
        html += '<ul>';
        listType = 'ul';
      }

      const text = trimmed.replace(/^[-*]\s+/, '');

      html += `<li>${escapeHtml(text)}</li>`;
      return;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'ol') {
        closeList();
        html += '<ol>';
        listType = 'ol';
      }

      const text = trimmed.replace(/^\d+\.\s+/, '');

      html += `<li>${escapeHtml(text)}</li>`;
      return;
    }

    closeList();

    html += `<p>${escapeHtml(trimmed)}</p>`;
  });

  closeList();

  return html || '<p><br /></p>';
};

const htmlToText = (html: string) => {
  const temp = document.createElement('div');

  temp.innerHTML = html;

  return (
    temp.innerText ||
    temp.textContent ||
    ''
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const getInitialNotes = (): Note[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0
      ) {
        return parsed.map((note: Note) => ({
          ...note,
          body: markdownToHtml(note.body || ''),
        }));
      }
    }
  } catch {
    // Use defaults.
  }

  return DEFAULT_NOTES;
};

export const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(
    getInitialNotes
  );

  const [selectedNoteId, setSelectedNoteId] =
    useState<string>(
      notes[0]?.id || ''
    );

  const [search, setSearch] = useState('');

  const [activeFolder, setActiveFolder] =
    useState('All Notes');

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [showMoreMenu, setShowMoreMenu] =
    useState(false);

  const [saveState, setSaveState] =
    useState<'saved' | 'saving'>('saved');

  const [showFormatting, setShowFormatting] =
    useState(true);

  const [formatTick, setFormatTick] =
    useState(0);

  const [toast, setToast] =
    useState<string | null>(null);

  const editorRef =
    useRef<HTMLDivElement | null>(null);

  const saveTimerRef =
    useRef<number | null>(null);

  const selectedNote =
    notes.find(
      note => note.id === selectedNoteId
    ) || null;

  /*
   * ---------------------------------------------------------
   * Toast
   * ---------------------------------------------------------
   */

  const showToast = (message: string) => {
    setToast(message);

    window.setTimeout(() => {
      setToast(current =>
        current === message ? null : current
      );
    }, 1800);
  };

  /*
   * ---------------------------------------------------------
   * Persist
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setSaveState('saving');

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(notes)
        );

        setSaveState('saved');
      } catch {
        setSaveState('saved');
        showToast(
          'Could not save notes locally'
        );
      }
    }, 400);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [notes]);

  /*
   * ---------------------------------------------------------
   * Load selected note into editor
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!editorRef.current || !selectedNote) {
      return;
    }

    const html = markdownToHtml(
      selectedNote.body || ''
    );

    if (
      editorRef.current.innerHTML !== html
    ) {
      editorRef.current.innerHTML = html;
    }
  }, [selectedNoteId]);

  /*
   * ---------------------------------------------------------
   * Derived data
   * ---------------------------------------------------------
   */

  const filteredNotes = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return [...notes]
      .filter(note => {
        const folderMatches =
          activeFolder === 'All Notes' ||
          note.folder === activeFolder;

        if (!folderMatches) {
          return false;
        }

        if (!query) {
          return true;
        }

        const plainText =
          typeof document !== 'undefined'
            ? htmlToText(note.body)
            : note.body;

        return (
          note.title
            .toLowerCase()
            .includes(query) ||
          plainText
            .toLowerCase()
            .includes(query) ||
          note.folder
            .toLowerCase()
            .includes(query)
        );
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        return b.id.localeCompare(a.id);
      });
  }, [
    notes,
    search,
    activeFolder,
  ]);

  const plainSelectedBody = useMemo(() => {
    if (!selectedNote) return '';

    if (
      typeof document === 'undefined'
    ) {
      return selectedNote.body;
    }

    return htmlToText(
      selectedNote.body
    );
  }, [selectedNote]);

  const totalWords = useMemo(() => {
    if (!plainSelectedBody.trim()) {
      return 0;
    }

    return plainSelectedBody
      .trim()
      .split(/\s+/)
      .length;
  }, [plainSelectedBody]);

  const characterCount =
    plainSelectedBody.length;

  /*
   * ---------------------------------------------------------
   * Selection / editor helpers
   * ---------------------------------------------------------
   */

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const updateEditorState = () => {
    if (!editorRef.current || !selectedNote) {
      return;
    }

    const html =
      editorRef.current.innerHTML;

    const plainText =
      editorRef.current.innerText || '';

    const firstLine =
      plainText
        .split('\n')
        .map(line => line.trim())
        .find(Boolean) ||
      'Untitled Note';

    setNotes(prev =>
      prev.map(note =>
        note.id === selectedNote.id
          ? {
              ...note,
              body: html,
              title:
                note.title === 'New Note'
                  ? firstLine
                  : note.title,
            }
          : note
      )
    );

    setFormatTick(value => value + 1);
  };

  /*
   * ---------------------------------------------------------
   * REAL RICH TEXT FORMATTING
   * ---------------------------------------------------------
   *
   * Important:
   * The old implementation inserted:
   *
   * **text**
   * _text_
   * ~~text~~
   *
   * Those are Markdown characters, not actual formatting.
   *
   * Here we use contentEditable + execCommand.
   * This creates real <strong>, <em>, <u>,
   * <ul>, <li> etc.
   */

  const executeFormat = (
    command:
      | 'bold'
      | 'italic'
      | 'underline'
      | 'insertUnorderedList'
  ) => {
    focusEditor();

    try {
      document.execCommand(
        command,
        false
      );
    } catch {
      // Browser fallback not required.
    }

    updateEditorState();
    sound.playClick();
  };

  const handleBold = () => {
    executeFormat('bold');
  };

  const handleItalic = () => {
    executeFormat('italic');
  };

  const handleUnderline = () => {
    executeFormat('underline');
  };

  const handleBulletList = () => {
    executeFormat(
      'insertUnorderedList'
    );
  };

  const handleParagraph = () => {
    focusEditor();

    try {
      document.execCommand(
        'formatBlock',
        false,
        'p'
      );
    } catch {
      // Ignore.
    }

    updateEditorState();
    sound.playClick();
  };

  /*
   * ---------------------------------------------------------
   * Keyboard shortcuts
   * ---------------------------------------------------------
   */

  const handleEditorKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    const modifier =
      event.ctrlKey || event.metaKey;

    if (!modifier) {
      return;
    }

    const key =
      event.key.toLowerCase();

    if (key === 'b') {
      event.preventDefault();
      handleBold();
      return;
    }

    if (key === 'i') {
      event.preventDefault();
      handleItalic();
      return;
    }

    if (key === 'u') {
      event.preventDefault();
      handleUnderline();
      return;
    }

    if (key === 's') {
      event.preventDefault();

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(notes)
        );

        setSaveState('saved');
        showToast('Note saved');
      } catch {
        showToast(
          'Unable to save note'
        );
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * New note
   * ---------------------------------------------------------
   */

  const handleNewNote = () => {
    sound.playClick();

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      body: '<p><br /></p>',
      date: new Date().toLocaleDateString(
        [],
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }
      ),
      folder:
        activeFolder === 'All Notes'
          ? 'Work'
          : activeFolder,
      pinned: false,
    };

    setNotes(prev => [
      newNote,
      ...prev,
    ]);

    setSelectedNoteId(
      newNote.id
    );

    setActiveFolder(
      'All Notes'
    );

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        editorRef.current?.focus();
      });
    });
  };

  /*
   * ---------------------------------------------------------
   * Title
   * ---------------------------------------------------------
   */

  const handleUpdateTitle = (
    title: string
  ) => {
    if (!selectedNote) return;

    setNotes(prev =>
      prev.map(note =>
        note.id === selectedNote.id
          ? {
              ...note,
              title:
                title ||
                'Untitled Note',
            }
          : note
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * Select note
   * ---------------------------------------------------------
   */

  const selectNote = (
    id: string
  ) => {
    setSelectedNoteId(id);
    setShowMoreMenu(false);
    sound.playClick();
  };

  /*
   * ---------------------------------------------------------
   * Delete
   * ---------------------------------------------------------
   */

  const handleDeleteNote = () => {
    if (!selectedNote) {
      return;
    }

    sound.playClick();

    if (notes.length <= 1) {
      setNotes([]);
      setSelectedNoteId('');
      setShowDeleteConfirm(false);
      return;
    }

    const remaining =
      notes.filter(
        note =>
          note.id !==
          selectedNote.id
      );

    setNotes(remaining);

    setSelectedNoteId(
      remaining[0]?.id || ''
    );

    setShowDeleteConfirm(false);
  };

  /*
   * ---------------------------------------------------------
   * Pin
   * ---------------------------------------------------------
   */

  const handleTogglePin = () => {
    if (!selectedNote) {
      return;
    }

    sound.playClick();

    setNotes(prev =>
      prev.map(note =>
        note.id === selectedNote.id
          ? {
              ...note,
              pinned:
                !note.pinned,
            }
          : note
      )
    );

    setShowMoreMenu(false);
  };

  /*
   * ---------------------------------------------------------
   * Duplicate
   * ---------------------------------------------------------
   */

  const handleDuplicate = () => {
    if (!selectedNote) {
      return;
    }

    sound.playClick();

    const duplicate: Note = {
      ...selectedNote,
      id: `note-${Date.now()}`,
      title: `${selectedNote.title} Copy`,
      date: new Date().toLocaleDateString(
        [],
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }
      ),
      pinned: false,
    };

    setNotes(prev => [
      duplicate,
      ...prev,
    ]);

    setSelectedNoteId(
      duplicate.id
    );

    setShowMoreMenu(false);
  };

  /*
   * ---------------------------------------------------------
   * Reset formatting
   * ---------------------------------------------------------
   */

  const handleClearFormatting = () => {
    focusEditor();

    try {
      document.execCommand(
        'removeFormat'
      );
    } catch {
      // Ignore.
    }

    updateEditorState();
    sound.playClick();
    showToast(
      'Formatting cleared'
    );
  };

  /*
   * ---------------------------------------------------------
   * Empty state
   * ---------------------------------------------------------
   */

  if (!selectedNote) {
    return (
      <div className="flex-1 h-full bg-[#070a10] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -20, 30, 0],
            }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-[500px] h-[500px] -top-48 left-1/2 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]"
          />

          <div className="absolute w-[300px] h-[300px] bottom-0 right-0 rounded-full bg-sky-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <motion.div
            initial={{
              scale: 0.7,
              opacity: 0,
              rotateX: 25,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateX: 0,
            }}
            className="w-28 h-28 rounded-[30px] bg-gradient-to-br from-amber-400/30 to-orange-600/20 border border-white/15 shadow-[0_25px_80px_rgba(245,158,11,0.18)] flex items-center justify-center mb-6"
          >
            <FileText className="w-12 h-12 text-amber-300" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">
            No Notes
          </h2>

          <p className="text-sm text-slate-400 mb-6">
            Create your first note and start writing.
          </p>

          <motion.button
            whileHover={{
              scale: 1.05,
              y: -2,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={
              handleNewNote
            }
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-sm font-bold shadow-[0_15px_40px_rgba(245,158,11,0.25)]"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Note
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full overflow-hidden bg-[#070a10] text-white select-none">
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            x: [0, 35, -20, 0],
            y: [0, -25, 20, 0],
            scale: [1, 1.08, 0.96, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-52 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/[0.07] blur-[120px]"
        />

        <motion.div
          animate={{
            x: [0, -40, 20, 0],
            y: [0, 20, -30, 0],
            scale: [1, 0.94, 1.06, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-56 -right-48 w-[650px] h-[650px] rounded-full bg-sky-500/[0.06] blur-[130px]"
        />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      {/* =====================================================
          TOP BAR
      ====================================================== */}

      <div className="relative z-50 h-12 flex items-center justify-between px-3 border-b border-white/[0.08] bg-black/25 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{
              scale: 1.08,
            }}
            whileTap={{
              scale: 0.94,
            }}
            onClick={() => {
              setSidebarCollapsed(
                value => !value
              );
              sound.playClick();
            }}
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.07] flex items-center justify-center text-slate-300"
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </motion.button>

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <FileText className="w-3.5 h-3.5 text-black" />
            </div>

            <div>
              <div className="text-[11px] font-bold text-white leading-none">
                Notes
              </div>

              <div className="text-[9px] text-slate-500 mt-0.5">
                Abhishek OS
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {saveState === 'saving' ? (
              <motion.div
                key="saving"
                initial={{
                  opacity: 0,
                  y: -4,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400"
              >
                <motion.span
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <Clock3 className="w-3 h-3" />
                </motion.span>

                Saving...
              </motion.div>
            ) : (
              <motion.div
                key="saved"
                initial={{
                  opacity: 0,
                  y: -4,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-400"
              >
                <Check className="w-3 h-3" />
                Saved
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{
              scale: 1.08,
              y: -1,
            }}
            whileTap={{
              scale: 0.94,
            }}
            onClick={
              handleNewNote
            }
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[11px] font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Note
          </motion.button>
        </div>
      </div>

      {/* =====================================================
          THREE PANE
      ====================================================== */}

      <div className="relative z-10 flex h-[calc(100%-48px)] min-h-0">

        {/* =================================================
            SIDEBAR
        ================================================== */}

        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.aside
              initial={{
                width: 0,
                opacity: 0,
              }}
              animate={{
                width: 190,
                opacity: 1,
              }}
              exit={{
                width: 0,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 30,
              }}
              className="shrink-0 overflow-hidden border-r border-white/[0.08] bg-black/20 backdrop-blur-2xl"
            >
              <div className="w-[190px] h-full flex flex-col p-3">

                <div className="px-2 pb-4">
                  <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/[0.035] border border-white/[0.06]">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-[11px] font-black shadow-lg">
                        AK
                      </div>

                      <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#11151d]" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[10px] font-bold truncate">
                        Abhishek
                      </div>

                      <div className="text-[9px] text-slate-500 truncate">
                        Local Notes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-1 mb-2">
                  <div className="px-2 mb-2 text-[9px] uppercase tracking-[0.16em] font-bold text-slate-600">
                    Folders
                  </div>

                  <div className="space-y-1">
                    {FOLDERS.map(
                      folder => {
                        const Icon =
                          folder.icon;

                        const isActive =
                          activeFolder ===
                          folder.name;

                        const count =
                          folder.name ===
                          'All Notes'
                            ? notes.length
                            : notes.filter(
                                note =>
                                  note.folder ===
                                  folder.name
                              ).length;

                        return (
                          <motion.button
                            key={
                              folder.name
                            }
                            whileHover={{
                              x: 2,
                            }}
                            whileTap={{
                              scale: 0.98,
                            }}
                            onClick={() => {
                              setActiveFolder(
                                folder.name
                              );
                              sound.playClick();
                            }}
                            className={`relative w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-[10px] transition-all ${
                              isActive
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-400/15 shadow-inner'
                                : 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon
                                className={`w-3.5 h-3.5 ${
                                  isActive
                                    ? 'text-amber-300'
                                    : 'text-slate-500'
                                }`}
                              />

                              {
                                folder.name
                              }
                            </span>

                            <span
                              className={`text-[9px] ${
                                isActive
                                  ? 'text-amber-300'
                                  : 'text-slate-600'
                              }`}
                            >
                              {count}
                            </span>
                          </motion.button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="mt-4 px-1">
                  <div className="px-2 mb-2 text-[9px] uppercase tracking-[0.16em] font-bold text-slate-600">
                    Quick Access
                  </div>

                  <button
                    onClick={() => {
                      setSearch('');
                      setActiveFolder(
                        'All Notes'
                      );
                      sound.playClick();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[10px] text-slate-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    All Notes
                  </button>

                  <button
                    onClick={() => {
                      const pinned =
                        notes.find(
                          note =>
                            note.pinned
                        );

                      if (pinned) {
                        setActiveFolder(
                          'All Notes'
                        );

                        setSelectedNoteId(
                          pinned.id
                        );
                      }

                      sound.playClick();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[10px] text-slate-400 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Pinned
                  </button>
                </div>

                <div className="mt-auto p-2 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] to-sky-500/[0.05] border border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Rich Text Notes
                  </div>

                  <div className="text-[8px] text-slate-600 mt-1 leading-relaxed">
                    Bold, italic, underline and real bullet lists are supported.
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* =================================================
            NOTE LIST
        ================================================== */}

        <div className="w-[280px] shrink-0 border-r border-white/[0.08] bg-white/[0.018] backdrop-blur-xl flex flex-col min-h-0">

          <div className="p-3 border-b border-white/[0.07]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />

              <input
                value={search}
                onChange={e =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search Notes"
                className="w-full h-8 pl-8 pr-8 rounded-xl bg-white/[0.055] border border-white/[0.07] outline-none text-[10px] text-white placeholder:text-slate-600 focus:border-amber-400/40 focus:bg-white/[0.07] transition-all"
              />

              {search && (
                <button
                  onClick={() =>
                    setSearch('')
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="px-3 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-white">
                {activeFolder}
              </div>

              <div className="text-[9px] text-slate-600 mt-0.5">
                {filteredNotes.length}{' '}
                {filteredNotes.length ===
                1
                  ? 'note'
                  : 'notes'}
              </div>
            </div>

            <button
              onClick={
                handleNewNote
              }
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.07] flex items-center justify-center text-amber-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1.5 scrollbar-thin">
            <AnimatePresence initial={false}>
              {filteredNotes.map(
                (
                  note,
                  index
                ) => {
                  const isActive =
                    note.id ===
                    selectedNoteId;

                  const preview =
                    typeof document !==
                    'undefined'
                      ? htmlToText(
                          note.body
                        )
                      : note.body;

                  return (
                    <motion.button
                      layout
                      key={note.id}
                      initial={{
                        opacity: 0,
                        x: -15,
                        scale: 0.97,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        x: -20,
                        scale: 0.95,
                      }}
                      transition={{
                        delay:
                          index *
                          0.025,
                      }}
                      whileHover={{
                        x: 2,
                        scale: 1.005,
                      }}
                      whileTap={{
                        scale: 0.99,
                      }}
                      onClick={() =>
                        selectNote(
                          note.id
                        )
                      }
                      className={`relative w-full text-left p-3 rounded-2xl overflow-hidden transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-amber-500/[0.16] via-orange-500/[0.08] to-transparent border border-amber-400/20 shadow-[0_12px_35px_rgba(245,158,11,0.08)]'
                          : 'bg-transparent border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNote"
                          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-gradient-to-b from-amber-300 to-orange-500"
                        />
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className={`text-[11px] font-bold truncate ${
                              isActive
                                ? 'text-white'
                                : 'text-slate-300'
                            }`}
                          >
                            {note.title ||
                              'Untitled Note'}
                          </div>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[8px] text-slate-600">
                              {note.date}
                            </span>

                            <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />

                            <span className="text-[8px] text-slate-600">
                              {note.folder}
                            </span>
                          </div>
                        </div>

                        {note.pinned && (
                          <Pin className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-[9px] leading-relaxed text-slate-500 line-clamp-2 mt-2">
                        {preview ||
                          'No additional text'}
                      </p>
                    </motion.button>
                  );
                }
              )}
            </AnimatePresence>

            {filteredNotes.length ===
              0 && (
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                className="flex flex-col items-center justify-center py-16 px-6 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-slate-600" />
                </div>

                <div className="text-[11px] font-bold text-slate-400">
                  No notes found
                </div>

                <div className="text-[9px] text-slate-600 mt-1">
                  Try another search.
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* =================================================
            EDITOR
        ================================================== */}

        <main className="relative flex-1 min-w-0 min-h-0 overflow-hidden bg-black/[0.08]">

          <div className="absolute pointer-events-none w-[500px] h-[500px] rounded-full bg-amber-500/[0.025] blur-[120px] -top-64 left-1/2 -translate-x-1/2" />

          {/* =================================================
              EDITOR TOOLBAR
          ================================================== */}

          <div className="relative z-30 h-12 px-4 border-b border-white/[0.07] flex items-center justify-between bg-black/[0.12] backdrop-blur-xl">

            <div className="flex items-center gap-2 min-w-0">
              <motion.div
                animate={{
                  rotateY: [
                    0,
                    8,
                    -8,
                    0,
                  ],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300/20 to-orange-500/10 border border-amber-400/10 flex items-center justify-center"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
              </motion.div>

              <div className="min-w-0">
                <div className="text-[9px] text-slate-600 uppercase tracking-wider">
                  {selectedNote.folder}
                </div>

                <div className="text-[10px] font-medium text-slate-400 truncate">
                  {selectedNote.date}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">

              <button
                onClick={() => {
                  setShowFormatting(
                    value =>
                      !value
                  );
                  sound.playClick();
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  showFormatting
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'text-slate-500 hover:bg-white/[0.06] hover:text-white'
                }`}
                title="Formatting"
              >
                <Type className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setShowDetails(
                    value =>
                      !value
                  );
                  sound.playClick();
                }}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  showDetails
                    ? 'bg-white/[0.08] text-white'
                    : 'text-slate-500 hover:bg-white/[0.06] hover:text-white'
                }`}
                title="Note Details"
              >
                <Hash className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowMoreMenu(
                      value =>
                        !value
                    );
                    sound.playClick();
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/[0.06] hover:text-white"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMoreMenu && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        scale: 0.92,
                        y: -5,
                      }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        y: -4,
                      }}
                      className="absolute right-0 top-9 w-48 rounded-2xl border border-white/10 bg-[#151922]/95 backdrop-blur-2xl shadow-2xl p-1.5 z-50"
                    >
                      <button
                        onClick={
                          handleTogglePin
                        }
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.07] text-left text-[10px] text-slate-300 flex items-center gap-2"
                      >
                        {selectedNote.pinned ? (
                          <PinOff className="w-3.5 h-3.5" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}

                        {selectedNote.pinned
                          ? 'Unpin Note'
                          : 'Pin Note'}
                      </button>

                      <button
                        onClick={
                          handleDuplicate
                        }
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.07] text-left text-[10px] text-slate-300 flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate
                      </button>

                      <div className="h-px bg-white/[0.07] my-1" />

                      <button
                        onClick={
                          handleClearFormatting
                        }
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-white/[0.07] text-left text-[10px] text-slate-300 flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear Formatting
                      </button>

                      <div className="h-px bg-white/[0.07] my-1" />

                      <button
                        onClick={() => {
                          setShowDeleteConfirm(
                            true
                          );
                          setShowMoreMenu(
                            false
                          );
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-500/10 text-left text-[10px] text-rose-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Move to Trash
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{
                  scale: 1.06,
                }}
                whileTap={{
                  scale: 0.95,
                }}
                onClick={() =>
                  setShowDeleteConfirm(
                    true
                  )
                }
                className="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          {/* =================================================
              REAL RICH TEXT TOOLBAR
          ================================================== */}

          <AnimatePresence>
            {showFormatting && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -10,
                  scale: 0.94,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.96,
                }}
                className="relative z-30 mx-auto mt-3 w-fit max-w-[calc(100%-24px)] px-2 py-1.5 rounded-2xl bg-[#151922]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,.45)] flex items-center gap-1"
              >

                {/* BOLD */}

                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleBold();
                  }}
                  className="w-8 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white"
                  title="Bold — Ctrl/Cmd + B"
                >
                  <Bold className="w-3.5 h-3.5" />
                </motion.button>

                {/* ITALIC */}

                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleItalic();
                  }}
                  className="w-8 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white"
                  title="Italic — Ctrl/Cmd + I"
                >
                  <Italic className="w-3.5 h-3.5" />
                </motion.button>

                {/* UNDERLINE */}

                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleUnderline();
                  }}
                  className="w-8 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white"
                  title="Underline — Ctrl/Cmd + U"
                >
                  <Underline className="w-3.5 h-3.5" />
                </motion.button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* BULLET */}

                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleBulletList();
                  }}
                  className="w-8 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white"
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </motion.button>

                {/* PARAGRAPH */}

                <motion.button
                  whileHover={{
                    scale: 1.08,
                    y: -1,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleParagraph();
                  }}
                  className="w-8 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white"
                  title="Paragraph"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </motion.button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* CLEAR FORMATTING */}

                <motion.button
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onMouseDown={event => {
                    event.preventDefault();
                    handleClearFormatting();
                  }}
                  className="w-8 h-7 rounded-lg hover:bg-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white"
                  title="Clear Formatting"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* =================================================
              EDITOR
          ================================================== */}

          <div className="relative z-10 h-[calc(100%-108px)] overflow-y-auto">

            <motion.div
              key={selectedNote.id}
              initial={{
                opacity: 0,
                y: 12,
                rotateX: 1,
              }}
              animate={{
                opacity: 1,
                y: 0,
                rotateX: 0,
              }}
              transition={{
                duration: 0.28,
                ease: 'easeOut',
              }}
              className="max-w-4xl mx-auto px-8 sm:px-12 lg:px-20 py-12"
            >

              {/* TITLE */}

              <input
                value={
                  selectedNote.title
                }
                onChange={event =>
                  handleUpdateTitle(
                    event.target.value
                  )
                }
                className="w-full bg-transparent outline-none text-3xl sm:text-4xl font-bold tracking-tight text-white placeholder:text-slate-700"
                placeholder="Untitled Note"
              />

              {/* METADATA */}

              <div className="flex flex-wrap items-center gap-3 mt-3 mb-8">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
                  <Clock3 className="w-3 h-3" />
                  Edited {selectedNote.date}
                </div>

                <span className="w-1 h-1 rounded-full bg-slate-700" />

                <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
                  <Hash className="w-3 h-3" />
                  {totalWords} words
                </div>

                {selectedNote.pinned && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />

                    <div className="flex items-center gap-1 text-[9px] text-amber-400">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </div>
                  </>
                )}
              </div>

              {/* =================================================
                  RICH TEXT WRITING SURFACE
              ================================================== */}

              <div className="relative">

                <div className="absolute -inset-6 rounded-[35px] bg-gradient-to-br from-amber-500/[0.025] via-transparent to-sky-500/[0.02] pointer-events-none" />

                <div
                  key={formatTick}
                  className="pointer-events-none absolute -top-8 right-0 text-[8px] text-slate-700"
                >
                  Rich Text
                </div>

                <div
                  ref={editorRef}
                  id="abhishek-notes-editor"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck
                  onInput={
                    updateEditorState
                  }
                  onKeyDown={
                    handleEditorKeyDown
                  }
                  onFocus={() => {
                    setShowFormatting(
                      true
                    );
                  }}
                  className="
                    rich-note-editor
                    relative
                    w-full
                    min-h-[520px]
                    bg-transparent
                    text-[14px]
                    leading-8
                    tracking-[0.005em]
                    text-slate-200
                    outline-none
                    resize-none
                    placeholder:text-slate-700
                    selection:bg-amber-400/20
                    cursor-text
                  "
                  data-placeholder="Start writing your thoughts..."
                />
              </div>

              {/* HELP */}

              <div className="mt-6 p-3 rounded-2xl bg-white/[0.025] border border-white/[0.05]">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Bold className="w-3 h-3" />
                    Bold
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Italic className="w-3 h-3" />
                    Italic
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Underline className="w-3 h-3" />
                    Underline
                  </span>

                  <span className="flex items-center gap-1.5">
                    <List className="w-3 h-3" />
                    Bullet list
                  </span>

                  <span className="ml-auto hidden sm:flex items-center gap-1">
                    <Command className="w-3 h-3" />
                    B / I / U
                  </span>
                </div>
              </div>

              {/* BOTTOM STATS */}

              <div className="mt-8 pt-4 border-t border-white/[0.05] flex items-center justify-between text-[9px] text-slate-700">
                <div className="flex items-center gap-4">
                  <span>
                    {totalWords} words
                  </span>

                  <span>
                    {characterCount} characters
                  </span>

                  <span>
                    Rich text
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Save className="w-3 h-3" />

                  <span>
                    Local storage
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* =================================================
              DETAILS PANEL
          ================================================== */}

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: 30,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: 30,
                }}
                className="absolute right-4 top-16 bottom-4 w-56 z-40 rounded-3xl bg-[#141820]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[11px] font-bold">
                    Note Details
                  </div>

                  <button
                    onClick={() =>
                      setShowDetails(
                        false
                      )
                    }
                    className="w-6 h-6 rounded-lg hover:bg-white/[0.07] flex items-center justify-center text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">

                  <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.06]">
                    <div className="text-[8px] uppercase tracking-wider text-slate-600 mb-1">
                      Folder
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-300">
                      <Folder className="w-3.5 h-3.5 text-amber-400" />

                      {selectedNote.folder}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.06]">
                    <div className="text-[8px] uppercase tracking-wider text-slate-600 mb-1">
                      Created
                    </div>

                    <div className="text-[10px] text-slate-300">
                      {selectedNote.date}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.06]">
                    <div className="text-[8px] uppercase tracking-wider text-slate-600 mb-1">
                      Statistics
                    </div>

                    <div className="space-y-1.5 text-[10px] text-slate-400">
                      <div className="flex justify-between">
                        <span>
                          Words
                        </span>

                        <span className="text-white">
                          {totalWords}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>
                          Characters
                        </span>

                        <span className="text-white">
                          {characterCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{
                      y: -1,
                    }}
                    whileTap={{
                      scale: 0.98,
                    }}
                    onClick={
                      handleTogglePin
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-400/10 text-amber-300 text-[10px] font-semibold flex items-center justify-center gap-2"
                  >
                    {selectedNote.pinned ? (
                      <PinOff className="w-3.5 h-3.5" />
                    ) : (
                      <Pin className="w-3.5 h-3.5" />
                    )}

                    {selectedNote.pinned
                      ? 'Unpin Note'
                      : 'Pin Note'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* =====================================================
          DELETE CONFIRMATION
      ====================================================== */}

      <AnimatePresence>
        {showDeleteConfirm && (
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
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-5"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.86,
                y: 20,
                rotateX: 8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotateX: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 10,
              }}
              transition={{
                type: 'spring',
                stiffness: 350,
                damping: 25,
              }}
              className="w-full max-w-sm rounded-[28px] bg-[#151922]/95 backdrop-blur-3xl border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,.65)] p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-400/10 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>

              <h3 className="text-lg font-bold text-white">
                Move Note to Trash?
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                “{selectedNote.title}” will be removed from your Notes collection.
              </p>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() =>
                    setShowDeleteConfirm(
                      false
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>

                <motion.button
                  whileHover={{
                    scale: 1.03,
                  }}
                  whileTap={{
                    scale: 0.96,
                  }}
                  onClick={
                    handleDeleteNote
                  }
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-500/20"
                >
                  Move to Trash
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          TOAST
      ====================================================== */}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 10,
              scale: 0.95,
            }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[200] px-4 py-2.5 rounded-2xl bg-[#151922]/95 backdrop-blur-2xl border border-white/10 shadow-2xl text-[10px] font-semibold text-white flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================
          RICH TEXT EDITOR STYLES
      ====================================================== */}

      <style>{`
        .rich-note-editor {
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .rich-note-editor:empty:before {
          content: attr(data-placeholder);
          color: rgb(51 65 85);
          pointer-events: none;
        }

        .rich-note-editor p {
          margin: 0 0 0.9rem 0;
        }

        .rich-note-editor h1 {
          margin: 0 0 1rem 0;
          font-size: 1.65rem;
          line-height: 1.25;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }

        .rich-note-editor h2 {
          margin: 1.35rem 0 0.7rem 0;
          font-size: 1.15rem;
          line-height: 1.35;
          font-weight: 750;
          color: rgb(226 232 240);
        }

        .rich-note-editor h3 {
          margin: 1rem 0 0.55rem 0;
          font-size: 1rem;
          line-height: 1.4;
          font-weight: 700;
          color: rgb(226 232 240);
        }

        .rich-note-editor strong,
        .rich-note-editor b {
          font-weight: 800;
          color: white;
        }

        .rich-note-editor em,
        .rich-note-editor i {
          font-style: italic;
          color: rgb(226 232 240);
        }

        .rich-note-editor u {
          text-decoration-thickness: 1.5px;
          text-underline-offset: 3px;
          text-decoration-color: rgb(251 191 36 / 0.85);
        }

        .rich-note-editor ul,
        .rich-note-editor ol {
          margin: 0.5rem 0 1rem 1.5rem;
          padding-left: 1.25rem;
        }

        .rich-note-editor ul {
          list-style-type: disc;
        }

        .rich-note-editor ol {
          list-style-type: decimal;
        }

        .rich-note-editor li {
          padding-left: 0.35rem;
          margin: 0.25rem 0;
        }

        .rich-note-editor li::marker {
          color: rgb(251 191 36 / 0.9);
        }

        .rich-note-editor blockquote {
          margin: 1rem 0;
          padding: 0.6rem 1rem;
          border-left: 3px solid rgb(251 191 36 / 0.65);
          background: rgb(255 255 255 / 0.025);
          border-radius: 0 12px 12px 0;
          color: rgb(148 163 184);
        }

        .rich-note-editor:focus {
          outline: none;
        }

        .rich-note-editor::selection {
          background: rgb(251 191 36 / 0.25);
        }

        .rich-note-editor a {
          color: rgb(56 189 248);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .rich-note-editor::-webkit-scrollbar {
          width: 6px;
        }

        .rich-note-editor::-webkit-scrollbar-track {
          background: transparent;
        }

        .rich-note-editor::-webkit-scrollbar-thumb {
          background: rgb(255 255 255 / 0.08);
          border-radius: 999px;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgb(255 255 255 / 0.07);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
};