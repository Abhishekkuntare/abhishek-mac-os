import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Activity,
  Archive,
  ArrowDown,
  ArrowUp,
  Bot,
  Check,
  ChevronRight,
  Circle,
  CloudUpload,
  Code2,
  Command,
  Cpu,
  Download,
  File,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Info,
  Keyboard,
  Layers3,
  List,
  Maximize2,
  MemoryStick,
  Minimize2,
  MoreHorizontal,
  Network,
  Play,
  Power,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal as TerminalIcon,
  Trash2,
  Upload,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

import { useOS } from '../../context/OSContext';
import { vfs } from '../../services/virtualFileSystem';
import { sound } from '../../services/soundService';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'ascii' | 'system';
  text: string;
  timestamp: number;
}

interface ImportedTerminalFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  importedAt: string;
  path: string;
}

const IMPORT_STORAGE_KEY = 'abhishek-os-terminal-imported-files';

const QUICK_COMMANDS = [
  {
    command: 'neofetch',
    label: 'System',
    icon: Server,
  },
  {
    command: 'ls',
    label: 'Files',
    icon: FolderOpen,
  },
  {
    command: 'pwd',
    label: 'Location',
    icon: Network,
  },
  {
    command: 'whoami',
    label: 'User',
    icon: ShieldCheck,
  },
  {
    command: 'date',
    label: 'Date',
    icon: Activity,
  },
];

const COMMANDS = [
  'help',
  'neofetch',
  'ls',
  'cd',
  'pwd',
  'cat',
  'touch',
  'mkdir',
  'rm',
  'whoami',
  'date',
  'echo',
  'theme',
  'matrix',
  'clear',
  'reboot',
];

const createLine = (
  type: TerminalLine['type'],
  text: string
): TerminalLine => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  text,
  timestamp: Date.now(),
});

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1
  )} ${units[index]}`;
};

const readImportedFiles = (): ImportedTerminalFile[] => {
  try {
    const stored = localStorage.getItem(IMPORT_STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getParentPath = (path: string) => {
  const normalized = path.replace(/\/+$/, '');

  if (!normalized || normalized === '/') return '/';

  const pieces = normalized.split('/').filter(Boolean);

  pieces.pop();

  return pieces.length ? `/${pieces.join('/')}` : '/';
};

const normalizePath = (
  path: string,
  currentDir: string
): string => {
  let target = path.trim();

  if (!target || target === '~') {
    return '/Users/abhishek';
  }

  target = target.replace(/^~(?=\/|$)/, '/Users/abhishek');

  if (!target.startsWith('/')) {
    target = `${currentDir}/${target}`;
  }

  const parts = target.split('/');
  const normalized: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;

    if (part === '..') {
      normalized.pop();
    } else {
      normalized.push(part);
    }
  }

  return `/${normalized.join('/')}` || '/';
};

export const TerminalApp: React.FC = () => {
  const {
    user,
    restartSystem,
    updateSettings,
  } = useOS();

  const [history, setHistory] = useState<TerminalLine[]>([
    createLine(
      'system',
      'ABHISHEK OS TERMINAL // Neural Shell initialized'
    ),
    createLine(
      'output',
      'Abhishek OS [Version 1.0.0 Pro (x86_64-apple-darwin26)]'
    ),
    createLine(
      'output',
      '(c) 2026 Abhishek Kuntare. All rights reserved.'
    ),
    createLine(
      'output',
      'Type "help" or use the command palette below to explore.'
    ),
  ]);

  const [inputVal, setInputVal] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number | null>(
    null
  );

  const [currentDir, setCurrentDir] = useState(
    '/Users/abhishek'
  );

  const [isMatrixMode, setIsMatrixMode] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showFiles, setShowFiles] = useState(false);
  const [showCommandPalette, setShowCommandPalette] =
    useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [importedFiles, setImportedFiles] = useState<
    ImportedTerminalFile[]
  >(readImportedFiles);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /*
   * ---------------------------------------------------------
   * Persist imported files
   * ---------------------------------------------------------
   */

  useEffect(() => {
    try {
      localStorage.setItem(
        IMPORT_STORAGE_KEY,
        JSON.stringify(importedFiles)
      );
    } catch {
      // LocalStorage quota can be reached with large files.
    }
  }, [importedFiles]);

  /*
   * ---------------------------------------------------------
   * Auto scroll
   * ---------------------------------------------------------
   */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [history]);

  /*
   * ---------------------------------------------------------
   * Focus terminal
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (modifier && event.key.toLowerCase() === 'l') {
        event.preventDefault();

        setHistory([
          createLine(
            'system',
            'Terminal screen cleared.'
          ),
        ]);
      }

      if (modifier && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        fileInputRef.current?.click();
      }

      if (event.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKey);

    return () =>
      window.removeEventListener(
        'keydown',
        handleGlobalKey
      );
  }, []);

  /*
   * ---------------------------------------------------------
   * VFS helpers
   * ---------------------------------------------------------
   */

  const getFilesForDirectory = useCallback(
    (directory: string) => {
      try {
        return vfs.getFiles(directory);
      } catch {
        return [];
      }
    },
    []
  );

  /*
   * ---------------------------------------------------------
   * Import files
   * ---------------------------------------------------------
   */

  const handleImportFiles = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    sound.playClick();

    const imported: ImportedTerminalFile[] = [];

    for (const file of files) {
      try {
        /*
         * Persist the actual file as a data URL so it remains
         * available after the terminal is closed/reopened.
         */
        const dataUrl = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve(String(reader.result || ''));

            reader.onerror = () =>
              reject(reader.error);

            reader.readAsDataURL(file);
          }
        );

        const id = `import-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

        const importedFile: ImportedTerminalFile = {
          id,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          importedAt: new Date().toISOString(),
          path: `${currentDir}/${file.name}`,
        };

        imported.push(importedFile);

        /*
         * Also copy the file into the simulated VFS.
         *
         * For text files we save their readable content.
         * For binary files the imported-file data URL is retained
         * in the terminal's persistent library.
         */
        try {
          const isText =
            file.type.startsWith('text/') ||
            /\.(txt|md|json|js|jsx|ts|tsx|css|html|xml|csv|log)$/i.test(
              file.name
            );

          let content = '';

          if (isText) {
            content = await file.text();
          } else {
            content = `[Binary file imported]\nName: ${file.name}\nType: ${
              file.type || 'unknown'
            }\nSize: ${formatBytes(file.size)}\n`;
          }

          vfs.createFile(
            file.name,
            currentDir,
            'document',
            content,
            file.name.split('.').pop() || 'bin'
          );
        } catch {
          // VFS import failure should not prevent persistent import storage.
        }
      } catch {
        setHistory(prev => [
          ...prev,
          createLine(
            'error',
            `Import failed: ${file.name}`
          ),
        ]);
      }
    }

    if (imported.length) {
      setImportedFiles(prev => [
        ...imported,
        ...prev.filter(
          existing =>
            !imported.some(
              incoming =>
                incoming.name === existing.name &&
                incoming.path === existing.path
            )
        ),
      ]);

      setShowFiles(true);

      setHistory(prev => [
        ...prev,
        createLine(
          'system',
          `${imported.length} file${
            imported.length === 1 ? '' : 's'
          } imported successfully.`
        ),
        ...imported.map(file =>
          createLine(
            'output',
            `✓ ${file.name} → ${file.path}`
          )
        ),
      ]);
    }

    event.target.value = '';
  };

  /*
   * ---------------------------------------------------------
   * Download imported file
   * ---------------------------------------------------------
   */

  const downloadImportedFile = (
    file: ImportedTerminalFile
  ) => {
    sound.playClick();

    const anchor = document.createElement('a');

    anchor.href = file.dataUrl;
    anchor.download = file.name;
    anchor.click();
  };

  /*
   * ---------------------------------------------------------
   * Remove imported file
   * ---------------------------------------------------------
   */

  const removeImportedFile = (id: string) => {
    sound.playClick();

    setImportedFiles(prev =>
      prev.filter(file => file.id !== id)
    );

    setHistory(prev => [
      ...prev,
      createLine(
        'output',
        'Imported file removed from Terminal storage.'
      ),
    ]);
  };

  /*
   * ---------------------------------------------------------
   * Command execution
   * ---------------------------------------------------------
   */

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();

    if (!trimmed) {
      setHistory(prev => [
        ...prev,
        createLine(
          'input',
          `${user.username}@abhishek-os:${currentDir.replace(
            '/Users/abhishek',
            '~'
          )}$`
        ),
      ]);

      return;
    }

    setIsExecuting(true);

    setCommandHistory(prev => [
      ...prev,
      trimmed,
    ]);

    setHistoryPointer(null);

    const parts = trimmed.match(
      /(?:[^\s"]+|"[^"]*")+/g
    ) || [];

    const root = (parts[0] || '').toLowerCase();

    const arg = parts
      .slice(1)
      .join(' ')
      .replace(/^"(.*)"$/, '$1');

    const promptPath = currentDir.replace(
      '/Users/abhishek',
      '~'
    );

    const newEntries: TerminalLine[] = [
      createLine(
        'input',
        `${user.username}@abhishek-os:${promptPath}$ ${cmd}`
      ),
    ];

    /*
     * Small execution delay makes the terminal feel alive
     * without becoming annoying.
     */
    await new Promise(resolve =>
      window.setTimeout(resolve, 80)
    );

    switch (root) {
      case 'help': {
        newEntries.push(
          createLine(
            'ascii',
            `
╭──────────────────────────────────────────────────────╮
│                 ABHISHEK OS SHELL                    │
├──────────────────────────────────────────────────────┤
│ help          Command reference                      │
│ neofetch      System information                     │
│ ls            List directory contents                │
│ cd <dir>      Change directory                       │
│ pwd           Print working directory                │
│ cat <file>    Read a file                            │
│ touch <file>  Create a file                          │
│ mkdir <dir>   Create a directory                     │
│ rm <file>     Remove a file                          │
│ whoami        Current user                           │
│ date          Current date/time                      │
│ echo <text>   Print text                             │
│ theme <mode>  Set dark/light theme                   │
│ matrix        Toggle Matrix mode                     │
│ clear         Clear terminal                         │
│ reboot        Restart Abhishek OS                    │
│                                                      │
│ Keyboard:                                             │
│ Ctrl/Cmd + K  Focus terminal                         │
│ Ctrl/Cmd + L  Clear terminal                        │
│ Ctrl/Cmd + I  Import files                           │
╰──────────────────────────────────────────────────────╯`
          )
        );

        break;
      }

      case 'neofetch': {
        newEntries.push(
          createLine(
            'ascii',
            `
        █████╗ ██████╗ ██╗  ██╗
       ██╔══██╗██╔══██╗██║  ██║
       ███████║██████╔╝███████║
       ██╔══██║██╔══██╗██╔══██║
       ██║  ██║██████╔╝██║  ██║
       ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝

  ┌─────────────────────────────────────────────┐
  │ OS        Abhishek OS 1.0.0 Pro             │
  │ Kernel    Darwin 26.0.0 Pro                 │
  │ Shell     zsh 5.9                           │
  │ Host      Neural Studio Pro                 │
  │ Desktop   Abhishek Glass Workspace          │
  │ WM        Quartz Compositor                 │
  │ Terminal  Abhishek Terminal                 │
  │ CPU       12-Core Neural Core Engine        │
  │ GPU       38-Core Ultra GPU                 │
  │ Memory    8420MiB / 32768MiB                │
  │ Display   Liquid Retina XDR                 │
  │ User      ${user.username}                  │
  │ Creator   Abhishek Kuntare                  │
  └─────────────────────────────────────────────┘`
          )
        );

        break;
      }

      case 'ls': {
        const files =
          getFilesForDirectory(currentDir);

        if (!files.length) {
          newEntries.push(
            createLine(
              'output',
              '(empty directory)'
            )
          );
        } else {
          const lines = files.map(file => {
            if (file.type === 'folder') {
              return `📁 ${file.name}/`;
            }

            return `📄 ${file.name}  ${formatBytes(
              file.size || 0
            )}`;
          });

          newEntries.push(
            createLine(
              'output',
              lines.join('\n')
            )
          );
        }

        const persistentHere = importedFiles.filter(
          file => file.path.startsWith(`${currentDir}/`)
        );

        if (persistentHere.length) {
          newEntries.push(
            createLine(
              'system',
              `Imported library: ${persistentHere.length} persistent file${
                persistentHere.length === 1
                  ? ''
                  : 's'
              }`
            )
          );
        }

        break;
      }

      case 'pwd':
        newEntries.push(
          createLine('output', currentDir)
        );
        break;

      case 'cd': {
        const target = normalizePath(
          arg,
          currentDir
        );

        if (target === currentDir) {
          break;
        }

        if (
          target === '/' ||
          target === '/Users' ||
          target === '/Users/abhishek'
        ) {
          setCurrentDir(target);

          newEntries.push(
            createLine(
              'output',
              `Changed directory to ${target}`
            )
          );

          break;
        }

        const targetFiles =
          getFilesForDirectory(target);

        const looksLikeKnownDirectory =
          targetFiles.length > 0 ||
          target.endsWith('/Users') ||
          target.includes('/Desktop') ||
          target.includes('/Documents') ||
          target.includes('/Downloads');

        if (looksLikeKnownDirectory) {
          setCurrentDir(target);

          newEntries.push(
            createLine(
              'output',
              `Changed directory to ${target}`
            )
          );
        } else {
          newEntries.push(
            createLine(
              'error',
              `cd: no such file or directory: ${arg}`
            )
          );
        }

        break;
      }

      case 'cat': {
        if (!arg) {
          newEntries.push(
            createLine(
              'error',
              'Usage: cat <filename>'
            )
          );

          break;
        }

        const files =
          getFilesForDirectory(currentDir);

        const found = files.find(
          file =>
            file.name.toLowerCase() ===
            arg.toLowerCase()
        );

        if (found) {
          newEntries.push(
            createLine(
              'output',
              found.content ||
                '(empty or non-text file)'
            )
          );

          break;
        }

        const imported = importedFiles.find(
          file =>
            file.name.toLowerCase() ===
              arg.toLowerCase() &&
            file.path.startsWith(
              `${currentDir}/`
            )
        );

        if (imported) {
          newEntries.push(
            createLine(
              'output',
              `Imported file\nName: ${imported.name}\nType: ${
                imported.type
              }\nSize: ${formatBytes(
                imported.size
              )}\nImported: ${new Date(
                imported.importedAt
              ).toLocaleString()}`
            )
          );
        } else {
          newEntries.push(
            createLine(
              'error',
              `cat: ${arg}: No such file or directory`
            )
          );
        }

        break;
      }

      case 'touch': {
        if (!arg) {
          newEntries.push(
            createLine(
              'error',
              'Usage: touch <filename>'
            )
          );

          break;
        }

        try {
          vfs.createFile(
            arg,
            currentDir,
            'document',
            '',
            arg.split('.').pop() || 'txt'
          );

          newEntries.push(
            createLine(
              'output',
              `Created ${arg}`
            )
          );
        } catch {
          newEntries.push(
            createLine(
              'error',
              `touch: unable to create ${arg}`
            )
          );
        }

        break;
      }

      case 'mkdir': {
        if (!arg) {
          newEntries.push(
            createLine(
              'error',
              'Usage: mkdir <dirname>'
            )
          );

          break;
        }

        try {
          vfs.createFolder(
            arg,
            currentDir
          );

          newEntries.push(
            createLine(
              'output',
              `Directory created: ${arg}`
            )
          );
        } catch {
          newEntries.push(
            createLine(
              'error',
              `mkdir: unable to create ${arg}`
            )
          );
        }

        break;
      }

      case 'rm': {
        if (!arg) {
          newEntries.push(
            createLine(
              'error',
              'Usage: rm <filename>'
            )
          );

          break;
        }

        const files =
          getFilesForDirectory(currentDir);

        const found = files.find(
          file =>
            file.name.toLowerCase() ===
            arg.toLowerCase()
        );

        if (found) {
          try {
            vfs.deletePermanently(found.id);

            newEntries.push(
              createLine(
                'output',
                `Removed ${arg}`
              )
            );
          } catch {
            newEntries.push(
              createLine(
                'error',
                `rm: failed to remove ${arg}`
              )
            );
          }
        } else {
          newEntries.push(
            createLine(
              'error',
              `rm: ${arg}: No such file`
            )
          );
        }

        break;
      }

      case 'whoami':
        newEntries.push(
          createLine(
            'output',
            `${user.username} (${user.fullName})`
          )
        );
        break;

      case 'date':
        newEntries.push(
          createLine(
            'output',
            new Date().toString()
          )
        );
        break;

      case 'echo':
        newEntries.push(
          createLine(
            'output',
            arg
          )
        );
        break;

      case 'theme': {
        if (
          arg === 'light' ||
          arg === 'dark'
        ) {
          updateSettings({
            theme: arg,
          });

          newEntries.push(
            createLine(
              'output',
              `Theme set to ${arg}`
            )
          );
        } else {
          newEntries.push(
            createLine(
              'error',
              'Usage: theme light | theme dark'
            )
          );
        }

        break;
      }

      case 'matrix': {
        setIsMatrixMode(
          previous => !previous
        );

        newEntries.push(
          createLine(
            'system',
            'Matrix mode toggled.'
          )
        );

        break;
      }

      case 'clear':
        setHistory([]);
        setIsExecuting(false);
        return;

      case 'reboot':
        setHistory(prev => [
          ...prev,
          ...newEntries,
          createLine(
            'system',
            'Restarting Abhishek OS...'
          ),
        ]);

        setIsExecuting(false);

        window.setTimeout(() => {
          restartSystem();
        }, 600);

        return;

      default:
        newEntries.push(
          createLine(
            'error',
            `zsh: command not found: ${root}\nType "help" for available commands.`
          )
        );
    }

    setHistory(prev => [
      ...prev,
      ...newEntries,
    ]);

    setIsExecuting(false);
  };

  /*
   * ---------------------------------------------------------
   * Keyboard handler
   * ---------------------------------------------------------
   */

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      handleCommand(inputVal);

      setInputVal('');

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (!commandHistory.length) return;

      const nextIndex =
        historyPointer === null
          ? commandHistory.length - 1
          : Math.max(
              0,
              historyPointer - 1
            );

      setHistoryPointer(nextIndex);

      setInputVal(
        commandHistory[nextIndex]
      );

      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (historyPointer === null) return;

      if (
        historyPointer <
        commandHistory.length - 1
      ) {
        const nextIndex =
          historyPointer + 1;

        setHistoryPointer(nextIndex);

        setInputVal(
          commandHistory[nextIndex]
        );
      } else {
        setHistoryPointer(null);
        setInputVal('');
      }

      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();

      const matchingCommand =
        COMMANDS.find(command =>
          command.startsWith(
            inputVal.toLowerCase()
          )
        );

      if (matchingCommand) {
        setInputVal(matchingCommand);
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * Command suggestions
   * ---------------------------------------------------------
   */

  const commandSuggestions = useMemo(() => {
    const query = inputVal
      .trim()
      .toLowerCase();

    if (!query) return [];

    return COMMANDS.filter(command =>
      command.startsWith(query)
    ).slice(0, 5);
  }, [inputVal]);

  /*
   * ---------------------------------------------------------
   * Statistics
   * ---------------------------------------------------------
   */

  const currentFiles = useMemo(
    () => getFilesForDirectory(currentDir),
    [currentDir, getFilesForDirectory, history]
  );

  const fileCount = currentFiles.length;

  const importedSize = importedFiles.reduce(
    (total, file) =>
      total + file.size,
    0
  );

  /*
   * ---------------------------------------------------------
   * Prompt
   * ---------------------------------------------------------
   */

  const promptPath = currentDir.replace(
    '/Users/abhishek',
    '~'
  );

  return (
    <div
      onClick={() =>
        inputRef.current?.focus()
      }
      className={`relative flex-1 h-full overflow-hidden ${
        isMatrixMode
          ? 'bg-black'
          : 'bg-[#06090f]'
      } text-white`}
    >
      {/* =====================================================
          AMBIENT BACKGROUND
      ====================================================== */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {!isMatrixMode && (
          <>
            <motion.div
              animate={{
                x: [0, 50, -20, 0],
                y: [0, -25, 30, 0],
                scale: [1, 1.08, 0.96, 1],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-56 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/[0.055] blur-[130px]"
            />

            <motion.div
              animate={{
                x: [0, -40, 25, 0],
                y: [0, 20, -30, 0],
                scale: [1, 0.95, 1.08, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-64 -right-40 w-[650px] h-[650px] rounded-full bg-violet-500/[0.05] blur-[140px]"
            />
          </>
        )}

        {isMatrixMode && (
          <div className="absolute inset-0 opacity-30">
            {Array.from({
              length: 28,
            }).map((_, index) => (
              <motion.div
                key={index}
                initial={{
                  y: -100,
                  opacity: 0,
                }}
                animate={{
                  y: '110%',
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration:
                    2.5 +
                    (index % 7) * 0.45,
                  repeat: Infinity,
                  delay:
                    (index % 10) * 0.3,
                  ease: 'linear',
                }}
                className="absolute top-0 text-emerald-400/30 text-[10px] font-mono whitespace-pre"
                style={{
                  left: `${(index / 28) * 100}%`,
                }}
              >
                {`01 10 01 11 00\n10 01 11\n01 00 10\n11 01`}
              </motion.div>
            ))}
          </div>
        )}

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
            backgroundSize:
              '40px 40px',
          }}
        />
      </div>

      {/* =====================================================
          TERMINAL WINDOW
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.97,
          y: 12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          ease: 'easeOut',
        }}
        className={`relative z-10 h-full flex flex-col overflow-hidden ${
          isMaximized
            ? ''
            : 'rounded-[20px]'
        } border border-white/[0.08] bg-[#080b11]/90 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,.45)]`}
      >
        {/* ===================================================
            HEADER
        ==================================================== */}

        <div className="relative z-30 h-12 shrink-0 border-b border-white/[0.07] bg-white/[0.025] backdrop-blur-2xl flex items-center justify-between px-3">
          <div className="flex items-center gap-3">
            {/* Traffic lights */}
            <div className="flex items-center gap-1.5 px-1">
              <button
                onClick={() => {
                  sound.playClick();
                  setHistory(prev => [
                    ...prev,
                    createLine(
                      'system',
                      'Terminal remains active. Use reboot to restart the OS.'
                    ),
                  ]);
                }}
                className="w-3 h-3 rounded-full bg-rose-500/90 hover:brightness-125 transition"
              />

              <button
                onClick={() => {
                  setShowSidebar(v => !v);
                  sound.playClick();
                }}
                className="w-3 h-3 rounded-full bg-amber-400/90 hover:brightness-125 transition"
              />

              <button
                onClick={() => {
                  setIsMaximized(v => !v);
                  sound.playClick();
                }}
                className="w-3 h-3 rounded-full bg-emerald-400/90 hover:brightness-125 transition"
              />
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <motion.div
                animate={{
                  rotateY: [0, 12, -12, 0],
                  rotateX: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/15 flex items-center justify-center shadow-lg shadow-cyan-500/10"
              >
                <TerminalIcon className="w-3.5 h-3.5 text-cyan-300" />
              </motion.div>

              <div>
                <div className="text-[10px] font-bold text-white">
                  Abhishek Terminal
                </div>

                <div className="text-[8px] text-slate-600">
                  zsh • Neural Shell
                </div>
              </div>
            </div>
          </div>

          {/* Center status */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[9px] text-slate-500">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>

              SYSTEM ONLINE
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setShowFiles(v => !v);
                sound.playClick();
              }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                showFiles
                  ? 'bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Imported Files"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setShowCommandPalette(v => !v);
                sound.playClick();
              }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                showCommandPalette
                  ? 'bg-cyan-400/10 text-cyan-300'
                  : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Command Palette"
            >
              <Command className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setShowSidebar(v => !v);
                sound.playClick();
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06]"
              title="Toggle Sidebar"
            >
              <Layers3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsMaximized(v => !v);
                sound.playClick();
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/[0.06]"
              title="Maximize"
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* ===================================================
            MAIN CONTENT
        ==================================================== */}

        <div className="relative flex-1 min-h-0 flex">
          {/* =================================================
              SIDEBAR
          ================================================== */}

          <AnimatePresence initial={false}>
            {showSidebar && (
              <motion.aside
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  width: 210,
                  opacity: 1,
                }}
                exit={{
                  width: 0,
                  opacity: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className="shrink-0 overflow-hidden border-r border-white/[0.07] bg-black/[0.18] backdrop-blur-2xl"
              >
                <div className="w-[210px] h-full p-3 flex flex-col">
                  {/* System card */}
                  <motion.div
                    whileHover={{
                      y: -2,
                      rotateX: 1,
                    }}
                    className="relative p-3 rounded-2xl bg-gradient-to-br from-cyan-500/[0.09] to-blue-500/[0.03] border border-cyan-400/[0.1] overflow-hidden"
                  >
                    <div className="absolute -right-8 -top-8 w-20 h-20 rounded-full bg-cyan-400/10 blur-2xl" />

                    <div className="relative flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Cpu className="w-4 h-4 text-white" />
                      </div>

                      <div>
                        <div className="text-[10px] font-bold">
                          Neural Terminal
                        </div>

                        <div className="text-[8px] text-slate-500">
                          x86_64 • Darwin
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Quick actions */}
                  <div className="mt-5">
                    <div className="px-2 mb-2 text-[8px] uppercase tracking-[0.18em] text-slate-600 font-bold">
                      Quick Commands
                    </div>

                    <div className="space-y-1">
                      {QUICK_COMMANDS.map(
                        item => {
                          const Icon =
                            item.icon;

                          return (
                            <motion.button
                              key={item.command}
                              whileHover={{
                                x: 3,
                              }}
                              whileTap={{
                                scale: 0.98,
                              }}
                              onClick={() => {
                                setInputVal(
                                  item.command
                                );

                                handleCommand(
                                  item.command
                                );

                                setInputVal(
                                  ''
                                );

                                sound.playClick();
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-[9px] text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
                            >
                              <Icon className="w-3.5 h-3.5 text-cyan-400" />
                              <span>
                                {item.label}
                              </span>

                              <ChevronRight className="w-3 h-3 ml-auto text-slate-700" />
                            </motion.button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Workspace */}
                  <div className="mt-5">
                    <div className="px-2 mb-2 text-[8px] uppercase tracking-[0.18em] text-slate-600 font-bold">
                      Workspace
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/[0.035] border border-white/[0.05]">
                        <Folder className="w-3.5 h-3.5 text-amber-300" />

                        <div className="min-w-0">
                          <div className="text-[9px] text-slate-300 truncate">
                            {promptPath}
                          </div>

                          <div className="text-[8px] text-slate-600">
                            {fileCount} items
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setShowFiles(true)
                        }
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[9px] text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      >
                        <Archive className="w-3.5 h-3.5 text-violet-300" />

                        Imported Files

                        <span className="ml-auto text-[8px] text-slate-600">
                          {importedFiles.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* System stats */}
                  <div className="mt-auto space-y-2">
                    <div className="p-3 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] text-slate-600 uppercase tracking-wider">
                          CPU
                        </span>

                        <span className="text-[8px] text-cyan-300">
                          24%
                        </span>
                      </div>

                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          animate={{
                            width: [
                              '18%',
                              '32%',
                              '24%',
                            ],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                      <div className="flex items-center gap-2 text-[8px] text-slate-600">
                        <MemoryStick className="w-3 h-3" />

                        Memory

                        <span className="ml-auto text-cyan-300">
                          8.4 GB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* =================================================
              TERMINAL CONTENT
          ================================================== */}

          <div className="relative flex-1 min-w-0 flex flex-col">
            {/* Breadcrumb */}
            <div className="h-9 shrink-0 px-4 flex items-center justify-between border-b border-white/[0.05] bg-black/[0.12]">
              <div className="flex items-center gap-1.5 min-w-0">
                <TerminalIcon className="w-3 h-3 text-cyan-400 shrink-0" />

                <span className="text-[9px] text-slate-600">
                  shell
                </span>

                <ChevronRight className="w-3 h-3 text-slate-700" />

                <span className="text-[9px] text-slate-400 truncate">
                  {promptPath}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[8px] text-slate-600">
                <span className="hidden sm:flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  Connected
                </span>

                <span className="hidden sm:flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {formatBytes(
                    importedSize
                  )}
                </span>
              </div>
            </div>

            {/* Output */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 font-mono text-[11px] ${
                isMatrixMode
                  ? 'text-emerald-300'
                  : 'text-slate-300'
              }`}
            >
              <div className="max-w-5xl mx-auto">
                <AnimatePresence initial={false}>
                  {history.map(
                    (line, index) => (
                      <motion.div
                        key={line.id}
                        initial={{
                          opacity: 0,
                          y: 4,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        transition={{
                          duration: 0.16,
                          delay:
                            index > history.length - 4
                              ? 0.025
                              : 0,
                        }}
                        className={`whitespace-pre-wrap leading-relaxed mb-1 ${
                          line.type ===
                          'error'
                            ? 'text-rose-400'
                            : line.type ===
                              'ascii'
                            ? 'text-cyan-300'
                            : line.type ===
                              'input'
                            ? 'text-white font-semibold'
                            : line.type ===
                              'system'
                            ? 'text-violet-300'
                            : isMatrixMode
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {line.type ===
                          'system' && (
                          <span className="text-violet-400 mr-2">
                            ◆
                          </span>
                        )}

                        {line.text}
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                {/* Active prompt */}
                <div className="relative mt-3 flex items-start gap-2">
                  <span
                    className={`shrink-0 ${
                      isMatrixMode
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                    } font-bold`}
                  >
                    {user.username}
                    @abhishek-os:
                    {promptPath}$
                  </span>

                  <div className="relative flex-1 min-w-0">
                    <input
                      ref={inputRef}
                      value={inputVal}
                      onChange={event =>
                        setInputVal(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      autoFocus
                      spellCheck={false}
                      autoComplete="off"
                      className={`w-full bg-transparent outline-none text-white font-mono text-[11px] caret-cyan-400 ${
                        isMatrixMode
                          ? 'text-emerald-300 caret-emerald-400'
                          : ''
                      }`}
                    />

                    {/* Suggestions */}
                    <AnimatePresence>
                      {commandSuggestions.length >
                        0 &&
                        inputVal.length >
                          0 && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: 5,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                            }}
                            className="absolute left-0 top-6 z-50 w-56 rounded-xl border border-white/10 bg-[#11151d]/95 backdrop-blur-2xl shadow-2xl p-1"
                          >
                            {commandSuggestions.map(
                              command => (
                                <button
                                  key={
                                    command
                                  }
                                  onClick={event => {
                                    event.stopPropagation();

                                    setInputVal(
                                      command
                                    );

                                    inputRef.current?.focus();
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg text-left text-[9px] text-slate-400 hover:text-white hover:bg-white/[0.07]"
                                >
                                  <span className="text-cyan-300">
                                    $
                                  </span>{' '}
                                  {command}
                                </button>
                              )
                            )}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>

                  {isExecuting && (
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    </motion.div>
                  )}
                </div>

                <div ref={bottomRef} />
              </div>
            </div>

            {/* Bottom toolbar */}
            <div className="relative z-20 shrink-0 h-10 px-3 border-t border-white/[0.06] bg-black/[0.2] backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="h-7 px-2.5 rounded-lg text-[9px] text-slate-500 hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5"
                >
                  <Upload className="w-3 h-3 text-cyan-400" />
                  Import
                </button>

                <button
                  onClick={() =>
                    setShowCommandPalette(
                      v => !v
                    )
                  }
                  className="hidden sm:flex h-7 px-2.5 rounded-lg text-[9px] text-slate-500 hover:text-white hover:bg-white/[0.06] items-center gap-1.5"
                >
                  <Command className="w-3 h-3" />
                  Commands
                </button>

                <button
                  onClick={() => {
                    setIsMatrixMode(
                      value => !value
                    );
                    sound.playClick();
                  }}
                  className={`h-7 px-2.5 rounded-lg text-[9px] flex items-center gap-1.5 ${
                    isMatrixMode
                      ? 'text-emerald-300 bg-emerald-400/10'
                      : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  Matrix
                </button>
              </div>

              <div className="flex items-center gap-3 text-[8px] text-slate-600">
                <span className="hidden sm:flex items-center gap-1">
                  <Keyboard className="w-3 h-3" />
                  ↑↓ History
                </span>

                <span>
                  {commandHistory.length} commands
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              IMPORTED FILES PANEL
          ================================================== */}

          <AnimatePresence>
            {showFiles && (
              <motion.aside
                initial={{
                  width: 0,
                  opacity: 0,
                }}
                animate={{
                  width: 290,
                  opacity: 1,
                }}
                exit={{
                  width: 0,
                  opacity: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                }}
                className="shrink-0 overflow-hidden border-l border-white/[0.07] bg-[#0c1017]/95 backdrop-blur-3xl"
              >
                <div className="w-[290px] h-full flex flex-col">
                  <div className="h-11 px-3 border-b border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold">
                        Imported Files
                      </div>

                      <div className="text-[8px] text-slate-600">
                        Persistent terminal library
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setShowFiles(false)
                      }
                      className="w-6 h-6 rounded-lg hover:bg-white/[0.07] flex items-center justify-center text-slate-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3">
                    <motion.button
                      whileHover={{
                        y: -1,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[9px] font-bold shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      Import Files
                    </motion.button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-2 pb-3">
                    {importedFiles.length ===
                    0 ? (
                      <div className="h-full flex flex-col items-center justify-center px-5 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/[0.035] border border-white/[0.06] flex items-center justify-center mb-3">
                          <Archive className="w-6 h-6 text-slate-700" />
                        </div>

                        <div className="text-[10px] font-bold text-slate-500">
                          No imported files
                        </div>

                        <div className="text-[8px] text-slate-700 mt-1 leading-relaxed">
                          Imported files are saved
                          locally inside the
                          Terminal app.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {importedFiles.map(
                          file => (
                            <motion.div
                              layout
                              key={file.id}
                              whileHover={{
                                y: -1,
                                scale: 1.01,
                              }}
                              className="group p-2.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.05] hover:border-cyan-400/10"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/10 flex items-center justify-center shrink-0">
                                  {file.type.startsWith(
                                    'image/'
                                  ) ? (
                                    <File className="w-3.5 h-3.5 text-cyan-300" />
                                  ) : file.type.includes(
                                      'javascript'
                                    ) ||
                                    /\.(js|ts|tsx|jsx)$/i.test(
                                      file.name
                                    ) ? (
                                    <FileCode2 className="w-3.5 h-3.5 text-amber-300" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-violet-300" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-[9px] font-semibold text-slate-300 truncate">
                                    {file.name}
                                  </div>

                                  <div className="text-[7px] text-slate-600 mt-0.5">
                                    {formatBytes(
                                      file.size
                                    )}
                                  </div>

                                  <div className="text-[7px] text-slate-700 truncate mt-0.5">
                                    {file.path}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() =>
                                    downloadImportedFile(
                                      file
                                    )
                                  }
                                  className="flex-1 h-6 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-[8px] text-slate-400 hover:text-white flex items-center justify-center gap-1"
                                >
                                  <Download className="w-3 h-3" />
                                  Download
                                </button>

                                <button
                                  onClick={() =>
                                    removeImportedFile(
                                      file.id
                                    )
                                  }
                                  className="w-6 h-6 rounded-lg bg-rose-500/[0.05] hover:bg-rose-500/10 text-rose-400 flex items-center justify-center"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </motion.div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[8px] text-slate-600">
                      <span>
                        {importedFiles.length}{' '}
                        files
                      </span>

                      <span>
                        {formatBytes(
                          importedSize
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* ===================================================
            COMMAND PALETTE
        ==================================================== */}

        <AnimatePresence>
          {showCommandPalette && (
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
              className="absolute inset-0 z-[100] bg-black/45 backdrop-blur-sm flex items-start justify-center pt-16 px-4"
              onClick={() =>
                setShowCommandPalette(false)
              }
            >
              <motion.div
                initial={{
                  opacity: 0,
                  y: -20,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -10,
                  scale: 0.97,
                }}
                onClick={event =>
                  event.stopPropagation()
                }
                className="w-full max-w-lg rounded-3xl bg-[#11151d]/95 backdrop-blur-3xl border border-white/10 shadow-[0_35px_100px_rgba(0,0,0,.65)] overflow-hidden"
              >
                <div className="p-3 border-b border-white/[0.07]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

                    <input
                      autoFocus
                      value={searchTerm}
                      onChange={event =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search commands..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.045] border border-white/[0.07] outline-none text-xs text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {COMMANDS.filter(
                    command =>
                      !searchTerm ||
                      command
                        .includes(
                          searchTerm.toLowerCase()
                        )
                  ).map(command => (
                    <motion.button
                      key={command}
                      whileHover={{
                        x: 3,
                      }}
                      onClick={() => {
                        setShowCommandPalette(
                          false
                        );
                        setSearchTerm('');

                        if (
                          command ===
                          'clear'
                        ) {
                          setHistory([]);
                          return;
                        }

                        handleCommand(
                          command
                        );

                        inputRef.current?.focus();

                        sound.playClick();
                      }}
                      className="w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                        <TerminalIcon className="w-3.5 h-3.5 text-cyan-300" />
                      </div>

                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-white">
                          {command}
                        </div>

                        <div className="text-[8px] text-slate-600">
                          Execute terminal command
                        </div>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                    </motion.button>
                  ))}
                </div>

                <div className="px-3 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-[8px] text-slate-600">
                  <span>
                    Enter to execute
                  </span>

                  <span>
                    Esc to close
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleImportFiles}
        />
      </motion.div>
    </div>
  );
};