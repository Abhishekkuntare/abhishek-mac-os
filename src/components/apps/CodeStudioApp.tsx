
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import Editor, {
  Monaco,
  OnMount,
} from '@monaco-editor/react';
import type { CSSProperties } from 'react';

import {
  Activity,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Code2,
  Copy,
  Download,
  FileCode,
  FilePlus2,
  Folder,
  FolderOpen,
  Globe,
  Hash,
  Keyboard,
  Maximize2,
  Minimize2,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sparkles,
  SquareTerminal,
  Sun,
  Terminal,
  Trash2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

import { sound } from '../../services/soundService';

/* =========================================================
   TYPES
========================================================= */

type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'cpp'
  | 'c'
  | 'java'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'plaintext';

interface ProjectFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  code: string;
  path: string;
  saved: boolean;
}

interface ContextMenuItem {
  label: string;
  shortcut?: string;
  danger?: boolean;
  action: () => void | Promise<void>;
}

interface StudioContextMenu {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ConsoleEntry {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'system';
  text: string;
  timestamp: string;
}

interface EditorSettings {
  theme: 'abyss' | 'vs-dark' | 'hc-black' | 'light' | 'one-dark' | 'dracula' | 'monokai' | 'github-dark';
  fontSize: number;
  fontFamily: string;
  fontLigatures: boolean;
  tabSize: number;
  minimap: boolean;
  wordWrap: 'off' | 'on' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative';
  bracketPairColorization: boolean;
  smoothScrolling: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
}

/* =========================================================
   DEFAULT FILES
========================================================= */

const LEGACY_SAMPLE_FILE_IDS = new Set([
  'app-tsx',
  'physics-ts',
  'welcome-js',
  'main-py',
  'main-cpp',
  'Main-java',
  'index-html',
  'style-css',
  'script-js',
]);

const createUntitledFile = (): ProjectFile => ({
  id: 'untitled-initial',
  name: 'Untitled.js',
  language: 'javascript',
  path: '/Photos/Code Studio/Untitled.js',
  code: '',
  saved: false,
});

/* =========================================================
   LANGUAGE HELPERS
========================================================= */

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  cpp: 'C++',
  c: 'C',
  java: 'Java',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  markdown: 'Markdown',
  plaintext: 'Text',
};

const STUDIO_PALETTES: Record<EditorSettings['theme'], {
  background: string;
  panel: string;
  toolbar: string;
  surface: string;
  border: string;
  foreground: string;
  muted: string;
  accent: string;
}> = {
  abyss: { background: '#020617', panel: '#07111f', toolbar: '#0b1726', surface: '#0f1e30', border: '#1e344b', foreground: '#e2e8f0', muted: '#94a3b8', accent: '#38bdf8' },
  'vs-dark': { background: '#1e1e1e', panel: '#181818', toolbar: '#252526', surface: '#2d2d30', border: '#3e3e42', foreground: '#cccccc', muted: '#9d9d9d', accent: '#007acc' },
  'hc-black': { background: '#000000', panel: '#050505', toolbar: '#101010', surface: '#181818', border: '#6f6f6f', foreground: '#ffffff', muted: '#d0d0d0', accent: '#f38518' },
  light: { background: '#f3f5f8', panel: '#ffffff', toolbar: '#e9edf3', surface: '#f8fafc', border: '#cbd5e1', foreground: '#1e293b', muted: '#64748b', accent: '#0284c7' },
  'one-dark': { background: '#282c34', panel: '#21252b', toolbar: '#282c34', surface: '#2c313a', border: '#3e4451', foreground: '#abb2bf', muted: '#7f848e', accent: '#61afef' },
  dracula: { background: '#282a36', panel: '#21222c', toolbar: '#282a36', surface: '#343746', border: '#44475a', foreground: '#f8f8f2', muted: '#a8a8b3', accent: '#bd93f9' },
  monokai: { background: '#272822', panel: '#1e1f1c', toolbar: '#272822', surface: '#34352f', border: '#494a43', foreground: '#f8f8f2', muted: '#a6a69c', accent: '#a6e22e' },
  'github-dark': { background: '#0d1117', panel: '#010409', toolbar: '#161b22', surface: '#21262d', border: '#30363d', foreground: '#e6edf3', muted: '#8b949e', accent: '#2f81f7' },
};

const STUDIO_THEME_IDS: Record<EditorSettings['theme'], string> = {
  abyss: 'studio-abyss',
  'vs-dark': 'vs-dark',
  'hc-black': 'hc-black',
  light: 'vs',
  'one-dark': 'studio-one-dark',
  dracula: 'studio-dracula',
  monokai: 'studio-monokai',
  'github-dark': 'studio-github-dark',
};

const LANGUAGE_ICONS: Record<SupportedLanguage, string> = {
  typescript: 'TS',
  javascript: 'JS',
  python: 'PY',
  cpp: 'C++',
  c: 'C',
  java: 'JAVA',
  html: 'HTML',
  css: 'CSS',
  json: '{}',
  markdown: 'MD',
  plaintext: 'TXT',
};

const getLanguageFromFilename = (
  filename: string
): SupportedLanguage => {
  const extension =
    filename.split('.').pop()?.toLowerCase() || '';

  switch (extension) {
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return 'javascript';
    case 'py':
    case 'pyw':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hh':
    case 'hxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'java':
      return 'java';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
};

const getMonacoLanguage = (
  language: SupportedLanguage
) => {
  return language;
};

const getMonacoTheme = (theme: EditorSettings['theme']) => STUDIO_THEME_IDS[theme];

/* =========================================================
   INDEXED DB
   Imported files are persisted locally.
========================================================= */

const DB_NAME = 'abhishek-os-code-studio';

const DB_VERSION = 1;

const STORE_NAME = 'project-files';
const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'abyss',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  fontLigatures: true,
  tabSize: 2,
  minimap: true,
  wordWrap: 'off',
  lineNumbers: 'on',
  bracketPairColorization: true,
  smoothScrolling: true,
  cursorBlinking: 'smooth',
};

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () =>
      reject(request.error);
  });
};

const saveFilesToDB = async (
  files: ProjectFile[]
) => {
  try {
    const db = await openDatabase();

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        'readwrite'
      );

      const store =
        transaction.objectStore(STORE_NAME);

      store.clear();
      files.forEach((file) => {
        store.put(file);
      });

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };

      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch {
    // IndexedDB can be unavailable in restricted environments.
  }
};

const loadFilesFromDB = async (): Promise<
  ProjectFile[]
> => {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        STORE_NAME,
        'readonly'
      );

      const store =
        transaction.objectStore(STORE_NAME);

      const request = store.getAll();

      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };

      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return [];
  }
};

/* =========================================================
   CONSOLE HELPERS
========================================================= */

const nowTime = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const makeConsoleEntry = (
  type: ConsoleEntry['type'],
  text: string
): ConsoleEntry => ({
  id:
    typeof crypto !== 'undefined' &&
    'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  type,
  text,
  timestamp: nowTime(),
});

/* =========================================================
   COMPONENT
========================================================= */

export const CodeStudioApp: React.FC = () => {
  const [files, setFiles] =
    useState<ProjectFile[]>(
      [createUntitledFile()]
    );

  const [filesLoaded, setFilesLoaded] =
    useState(false);

  const [openFileIds, setOpenFileIds] =
    useState(['untitled-initial']);

  const [activeFileId, setActiveFileId] =
    useState('untitled-initial');

  const [contextMenu, setContextMenu] =
    useState<StudioContextMenu | null>(null);

  const [renameFileId, setRenameFileId] =
    useState<string | null>(null);

  const [consoleLogs, setConsoleLogs] =
    useState<ConsoleEntry[]>([
      makeConsoleEntry(
        'system',
        'Code Studio v3.0 initialized.'
      ),
      makeConsoleEntry(
        'info',
        'Ctrl+Enter → Run • Ctrl+S → Save • Ctrl+P → Quick Open • Ctrl+Shift+P → Commands'
      ),
    ]);

  const [isRunning, setIsRunning] =
    useState(false);

  const [runtimeInstallNeeded, setRuntimeInstallNeeded] =
    useState<'cpp' | 'java' | null>(null);

  const [isInstallingRuntime, setIsInstallingRuntime] =
    useState(false);

  const [isPreviewOpen, setIsPreviewOpen] =
    useState(false);

  const [previewHtml, setPreviewHtml] =
    useState('');

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [commandOpen, setCommandOpen] =
    useState(false);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  const [newFileOpen, setNewFileOpen] =
    useState(false);

  const [newFileName, setNewFileName] =
    useState('NewFile.py');

  const [newFileError, setNewFileError] =
    useState('');

  const [renameFileName, setRenameFileName] =
    useState('');

  const [input, setInput] =
    useState('');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [showExplorer, setShowExplorer] =
    useState(true);

  const [showConsole, setShowConsole] =
    useState(true);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [isMonacoReady, setIsMonacoReady] =
    useState(false);

  const [editorSettings, setEditorSettings] =
    useState<EditorSettings>(() => {
      try {
        const saved = localStorage.getItem('code-studio-editor-settings');
        return saved
          ? { ...DEFAULT_EDITOR_SETTINGS, ...JSON.parse(saved) }
          : DEFAULT_EDITOR_SETTINGS;
      } catch {
        return DEFAULT_EDITOR_SETTINGS;
      }
    });

  const editorRef =
    useRef<any>(null);

  const monacoRef =
    useRef<Monaco | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const activeFile = useMemo(
    () =>
      files.find(
        (file) =>
          file.id === activeFileId
      ) || files[0],
    [files, activeFileId]
  );
  const openFiles = useMemo(
    () => files.filter(file => openFileIds.includes(file.id)),
    [files, openFileIds]
  );
  const hasActiveFile = openFileIds.includes(activeFileId);

  /* =====================================================
     LOAD LOCAL FILES
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const stored = (await loadFilesFromDB()).filter(
        file => !LEGACY_SAMPLE_FILE_IDS.has(file.id)
      );

      if (!cancelled && stored.length > 0) {
        setFiles(stored);
        setActiveFileId(stored[0].id);
        setOpenFileIds(stored.map(file => file.id));
      } else if (!cancelled) {
        const blankFile = createUntitledFile();
        setFiles([blankFile]);
        setActiveFileId(blankFile.id);
        setOpenFileIds([blankFile.id]);
      }
      if (!cancelled) setFilesLoaded(true);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    type OpenFileRequest = { name: string; content: string; path: string };
    const openRequestedFile = (request?: OpenFileRequest) => {
      if (!filesLoaded) return;
      let pending = request;
      if (!pending) {
        try {
          const saved = localStorage.getItem('code-studio-pending-open-file');
          pending = saved ? JSON.parse(saved) as OpenFileRequest : undefined;
        } catch (error) {
          console.error('Unable to read the file request from Finder.', error);
          return;
        }
      }
      if (!pending || typeof pending.name !== 'string' || typeof pending.content !== 'string') return;

      localStorage.removeItem('code-studio-pending-open-file');
      const fileId = `finder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const file: ProjectFile = {
        id: fileId,
        name: pending.name,
        language: getLanguageFromFilename(pending.name),
        path: pending.path || `/Photos/Code Studio/${pending.name}`,
        code: pending.content,
        saved: true,
      };
      setFiles(current => [...current.filter(item => item.path !== file.path), file]);
      setOpenFileIds(current => [...new Set([...current, fileId])]);
      setActiveFileId(fileId);
    };
    const handleOpenRequest = (event: Event) => {
      openRequestedFile((event as CustomEvent<OpenFileRequest>).detail);
    };

    window.addEventListener('code-studio:open-file', handleOpenRequest);
    openRequestedFile();
    return () => window.removeEventListener('code-studio:open-file', handleOpenRequest);
  }, [filesLoaded]);

  /* =====================================================
     PERSIST FILES
  ===================================================== */

  useEffect(() => {
    if (!filesLoaded) return;
    const timer = window.setTimeout(() => {
      saveFilesToDB(files);
    }, 500);

    return () =>
      window.clearTimeout(timer);
  }, [files, filesLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'code-studio-editor-settings',
        JSON.stringify(editorSettings)
      );
    } catch (error) {
      console.error('Unable to save Code Studio editor settings.', error);
    }
  }, [editorSettings]);

  /* =====================================================
     MONACO MOUNT
  ===================================================== */

  const handleEditorMount: OnMount = (
    editor,
    monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsMonacoReady(true);
  };

  /* =====================================================
     UPDATE ACTIVE FILE
  ===================================================== */

  const updateActiveFile = (
    value: string
  ) => {
    setFiles((current) =>
      current.map((file) =>
        file.id === activeFileId
          ? {
              ...file,
              code: value,
              saved: false,
            }
          : file
      )
    );
  };

  /* =====================================================
     SELECT FILE
  ===================================================== */

  const handleSelectFile = (
    id: string
  ) => {
    sound.playClick();

    setOpenFileIds(current =>
      current.includes(id) ? current : [...current, id]
    );
    setActiveFileId(id);

    window.setTimeout(() => {
      editorRef.current?.focus();
    }, 50);
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = useCallback(() => {
    if (!activeFileId || !activeFile) return;

    setFiles((current) =>
      current.map((file) =>
        file.id === activeFileId
          ? {
              ...file,
              saved: true,
            }
          : file
      )
    );

    sound.playClick();

    setConsoleLogs((current) => [
      ...current,
      makeConsoleEntry(
        'system',
        `${activeFile.name} saved successfully.`
      ),
    ]);
  }, [activeFileId, activeFile.name]);

  /* =====================================================
     JAVASCRIPT LOCAL EXECUTION
  ===================================================== */

  const executeJavaScript = async (
    code: string
  ) => {
    const logs: ConsoleEntry[] = [];

    const customConsole = {
      log: (...args: unknown[]) => {
        logs.push(
          makeConsoleEntry(
            'log',
            args
              .map((value) =>
                typeof value ===
                'object'
                  ? JSON.stringify(
                      value,
                      null,
                      2
                    )
                  : String(value)
              )
              .join(' ')
          )
        );
      },

      info: (...args: unknown[]) => {
        logs.push(
          makeConsoleEntry(
            'info',
            args
              .map(String)
              .join(' ')
          )
        );
      },

      warn: (...args: unknown[]) => {
        logs.push(
          makeConsoleEntry(
            'warn',
            args
              .map(String)
              .join(' ')
          )
        );
      },

      error: (...args: unknown[]) => {
        logs.push(
          makeConsoleEntry(
            'error',
            args
              .map(String)
              .join(' ')
          )
        );
      },

      table: (value: unknown) => {
        logs.push(
          makeConsoleEntry(
            'info',
            `[TABLE]\\n${JSON.stringify(
              value,
              null,
              2
            )}`
          )
        );
      },
    };

    try {
      const runner = new Function(
        'console',
        `"use strict";\n${code}`
      );

      runner(customConsole);

      if (logs.length === 0) {
        logs.push(
          makeConsoleEntry(
            'system',
            'Process finished successfully with no output.'
          )
        );
      }

      return logs;
    } catch (error: any) {
      return [
        makeConsoleEntry(
          'error',
          `JavaScript Error: ${
            error?.message ||
            String(error)
          }`
        ),
      ];
    }
  };

  /* =====================================================
     WEB PREVIEW
  ===================================================== */

  const buildWebPreview = () => {
    const htmlFile =
      files.find(
        (file) =>
          file.name.toLowerCase() ===
            'index.html' ||
          file.language === 'html'
      );

    const cssFile =
      files.find(
        (file) =>
          file.language === 'css'
      );

    const jsFile =
      files.find(
        (file) =>
          file.language ===
          'javascript'
      );

    let html =
      htmlFile?.code ||
      '<h1>ARLO OS Preview</h1>';

    if (cssFile) {
      html = html.replace(
        /<link[^>]*href=["']style\.css["'][^>]*>/gi,
        `<style>${cssFile.code}</style>`
      );

      if (
        !html.includes(
          '<style>'
        )
      ) {
        html =
          `<style>${cssFile.code}</style>` +
          html;
      }
    }

    if (jsFile) {
      html = html.replace(
        /<script[^>]*src=["']script\.js["'][^>]*><\/script>/gi,
        `<script>${jsFile.code}<\/script>`
      );
    }

    return html;
  };

  /* =====================================================
     RUN CODE
  ===================================================== */

  const handleRunCode = useCallback(
    async () => {
      if (!activeFile || !hasActiveFile) return;

      sound.playClick();

      setIsRunning(true);
      setRuntimeInstallNeeded(null);

      setShowConsole(true);

      setConsoleLogs([
        makeConsoleEntry(
          'system',
          `▶ Running ${activeFile.name}...`
        ),
      ]);

      try {
        if (
          activeFile.language ===
          'html' ||
          activeFile.language ===
          'css'
        ) {
          setPreviewHtml(
            buildWebPreview()
          );

          setIsPreviewOpen(true);

          setConsoleLogs([
            makeConsoleEntry(
              'system',
              'Web preview started successfully.'
            ),
          ]);
        } else {
          if (!window.electronAPI?.runCode) {
            throw new Error(
              'Run code in the ARLO OS desktop app to use the local program runners.'
            );
          }

          let language: CodeExecutionRequest['language'];
          let code = activeFile.code;
          if (activeFile.language === 'typescript') {
            const model = editorRef.current?.getModel();
            const monaco = monacoRef.current;
            if (!model || !monaco) {
              throw new Error(
                'The TypeScript editor is not ready. Wait for it to load, then run again.'
              );
            }
            const getWorker = await monaco.languages.typescript.getTypeScriptWorker();
            const worker = await getWorker(model.uri);
            const fileName = model.uri.toString();
            const diagnostics = await worker.getSyntacticDiagnostics(fileName);
            if (diagnostics.length > 0) {
              throw new Error(
                diagnostics
                  .map((diagnostic: { messageText: unknown }) =>
                    String(diagnostic.messageText)
                  )
                  .join('\n')
              );
            }
            const output = await worker.getEmitOutput(fileName);
            if (output.emitSkipped || output.outputFiles.length === 0) {
              throw new Error(
                'TypeScript could not generate JavaScript for this file.'
              );
            }
            language = 'javascript';
            code = output.outputFiles[0].text;
          } else if (
            activeFile.language === 'javascript' ||
            activeFile.language === 'python' ||
            activeFile.language === 'c' ||
            activeFile.language === 'cpp' ||
            activeFile.language === 'java'
          ) {
            language = activeFile.language;
          } else {
            throw new Error(
              `${LANGUAGE_LABELS[activeFile.language]} files are not executable. Run JavaScript, TypeScript, Python, C, C++, or Java code.`
            );
          }

          const result = await window.electronAPI.runCode({
            language,
            code,
            stdin: input,
          });
          const entries: ConsoleEntry[] = [
            makeConsoleEntry(
              'system',
              result.exitCode === 0
                ? `${LANGUAGE_LABELS[activeFile.language]} finished successfully.`
                : `${LANGUAGE_LABELS[activeFile.language]} exited with code ${result.exitCode ?? 'unknown'}.`
            ),
          ];

          if (result.stdout) {
            entries.push(makeConsoleEntry('log', result.stdout));
          }
          if (result.stderr) {
            entries.push(makeConsoleEntry('error', result.stderr));
          }
          if (result.exitCode !== 0 && activeFile.language === 'cpp' &&
            /C\+\+ compiler .* was not found/i.test(result.stderr)) {
            setRuntimeInstallNeeded('cpp');
          } else if (result.exitCode !== 0 && activeFile.language === 'java' &&
            /Java JDK .* was not found/i.test(result.stderr)) {
            setRuntimeInstallNeeded('java');
          }
          if (!result.stdout && !result.stderr && result.exitCode === 0) {
            entries.push(
              makeConsoleEntry('info', 'Program finished successfully with no output.')
            );
          }
          setConsoleLogs(entries);
        }
      } catch (error: any) {
        setConsoleLogs([
          makeConsoleEntry(
            'error',
            error?.message ||
              'Unable to execute code.'
          ),
        ]);
      } finally {
        setIsRunning(false);
      }
    },
    [
      activeFile,
      hasActiveFile,
      input,
      files,
    ]
  );

  const installRequiredRuntime = async () => {
    if (!runtimeInstallNeeded || !window.electronAPI?.installCodeRuntime) {
      setConsoleLogs(current => [
        ...current,
        makeConsoleEntry('error', 'Runtime installation is unavailable. Update and restart the desktop app, then try again.'),
      ]);
      return;
    }

    setIsInstallingRuntime(true);
    setConsoleLogs([
      makeConsoleEntry('system', `Installing ${runtimeInstallNeeded === 'cpp' ? 'the C++ compiler' : 'the Java JDK'} with Windows winget. This may take several minutes...`),
    ]);
    try {
      const message = await window.electronAPI.installCodeRuntime(runtimeInstallNeeded);
      setRuntimeInstallNeeded(null);
      setConsoleLogs([makeConsoleEntry('system', `${message} Running your program...`)]);
      await handleRunCode();
    } catch (error) {
      setConsoleLogs([
        makeConsoleEntry('error', error instanceof Error ? error.message : String(error)),
        makeConsoleEntry('info', 'Check that Windows App Installer (winget) is available and try again.'),
      ]);
    } finally {
      setIsInstallingRuntime(false);
    }
  };

  /* =====================================================
     IMPORT FILES
  ===================================================== */

  const handleImportFiles = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected =
      Array.from(
        event.target.files || []
      );

    if (!selected.length) return;

    const imported: ProjectFile[] =
      [];

    for (const file of selected) {
      try {
        const code =
          await file.text();

        const language =
          getLanguageFromFilename(
            file.name
          );

        imported.push({
          id: `import-${Date.now()}-${file.name}-${Math.random()}`,
          name: file.name,
          language,
          code,
          path: `/Photos/Code Studio/${file.name}`,
          saved: true,
        });
      } catch {
        // Ignore unreadable files.
      }
    }

    if (imported.length) {
      setFiles((current) => [
        ...current,
        ...imported,
      ]);

      setOpenFileIds(current => [
        ...current,
        ...imported.map(file => file.id),
      ]);
      setActiveFileId(
        imported[0].id
      );

      setConsoleLogs((current) => [
        ...current,
        makeConsoleEntry(
          'system',
          `${imported.length} file(s) imported into Photos/Code Studio.`
        ),
      ]);

      sound.playClick();
    }

    event.target.value = '';
  };

  /* =====================================================
     CREATE FILE
  ===================================================== */

  const createNewFile = () => {
    setRenameFileId(null);
    setNewFileName('NewFile.py');
    setNewFileError('');
    setNewFileOpen(true);
  };

  const confirmCreateFile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = newFileName.trim();
    if (
      !trimmedName ||
      /[<>:"/\\|?*\x00-\x1f]/.test(trimmedName) ||
      trimmedName.endsWith('.')
    ) {
      setNewFileError('Enter a valid file name without reserved characters.');
      return;
    }
    if (files.some(file =>
      file.id !== renameFileId &&
      file.name.toLowerCase() === trimmedName.toLowerCase()
    )) {
      setNewFileError(`${trimmedName} already exists in this workspace.`);
      return;
    }

    if (renameFileId) {
      setFiles(current => current.map(file =>
        file.id === renameFileId
          ? {
              ...file,
              name: trimmedName,
              language: getLanguageFromFilename(trimmedName),
              path: `/Photos/Code Studio/${trimmedName}`,
              saved: false,
            }
          : file
      ));
      setRenameFileId(null);
      setNewFileOpen(false);
      return;
    }

    const language =
      getLanguageFromFilename(trimmedName);

    const newFile: ProjectFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      language,
      path: `/Photos/Code Studio/${trimmedName}`,
      code: '',
      saved: true,
    };

    setFiles((current) => [
      ...current,
      newFile,
    ]);

    setOpenFileIds(current => [...current, newFile.id]);
    setActiveFileId(newFile.id);
    setNewFileOpen(false);

    sound.playClick();
  };

  /* =====================================================
     DELETE FILE
  ===================================================== */

  const beginRenameFile = (file: ProjectFile) => {
    setNewFileName(file.name);
    setNewFileError('');
    setRenameFileId(file.id);
    setNewFileOpen(true);
    setContextMenu(null);
  };

  const closeFile = (fileId: string) => {
    const closingIndex = openFileIds.indexOf(fileId);
    const nextOpen = openFileIds.filter(id => id !== fileId);
    setOpenFileIds(nextOpen);
    if (activeFileId === fileId) {
      setActiveFileId(nextOpen[Math.min(closingIndex, nextOpen.length - 1)] || '');
    }
    setContextMenu(null);
  };

  const deleteFile = (fileId: string) => {
    const file = files.find(item => item.id === fileId);
    if (!file || !window.confirm(`Delete ${file.name} from this workspace?`)) return;
    setFiles(current => current.filter(item => item.id !== fileId));
    const index = openFileIds.indexOf(fileId);
    const nextOpen = openFileIds.filter(id => id !== fileId);
    setOpenFileIds(nextOpen);
    if (activeFileId === fileId) {
      setActiveFileId(nextOpen[Math.min(index, nextOpen.length - 1)] || '');
    }
    setContextMenu(null);
  };

  /* =====================================================
     DOWNLOAD FILE
  ===================================================== */

  const downloadCurrentFile =
    () => {
      if (!activeFile) return;

      const blob =
        new Blob(
          [activeFile.code],
          {
            type: 'text/plain',
          }
        );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement(
          'a'
        );

      anchor.href = url;

      anchor.download =
        activeFile.name;

      anchor.click();

      URL.revokeObjectURL(url);
    };

  /* =====================================================
     COPY CODE
  ===================================================== */

  const copyCode = async () => {
    if (!activeFile) return;

    await writeClipboardText(activeFile.code);

    setConsoleLogs((current) => [
      ...current,
      makeConsoleEntry(
        'system',
        'Current file copied to clipboard.'
      ),
    ]);
  };

  const pasteClipboardIntoEditor = async () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model) return;

    const text = await readClipboardText();
    const selection = editor.getSelection();
    if (!selection) return;

    editor.pushUndoStop();
    editor.executeEdits('clipboard-paste', [{
      range: selection,
      text,
      forceMoveMarkers: true,
    }]);
    editor.pushUndoStop();
    editor.focus();
  };

  const copySelectionToClipboard = async (cut = false) => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    const selection = editor?.getSelection();
    if (!editor || !model || !selection) return;

    const selectedText = model.getValueInRange(selection);
    const text = selectedText || model.getLineContent(selection.startLineNumber);
    await writeClipboardText(text);

    if (cut && selectedText) {
      editor.executeEdits('clipboard-cut', [{
        range: selection,
        text: '',
        forceMoveMarkers: true,
      }]);
    } else if (cut && !selectedText) {
      const lineCount = model.getLineCount();
      editor.executeEdits('clipboard-cut-line', [{
        range: {
          startLineNumber: selection.startLineNumber,
          startColumn: 1,
          endLineNumber: Math.min(selection.startLineNumber + 1, lineCount),
          endColumn: selection.startLineNumber < lineCount
            ? 1
            : model.getLineMaxColumn(selection.startLineNumber),
        },
        text: '',
        forceMoveMarkers: true,
      }]);
    }
    editor.focus();
  };

  const openFileContextMenu = (
    event: React.MouseEvent,
    file: ProjectFile
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        {
          label: 'Open File',
          shortcut: 'Enter',
          action: () => handleSelectFile(file.id),
        },
        {
          label: 'Close File',
          action: () => closeFile(file.id),
        },
        {
          label: 'Copy Path',
          action: async () => {
            await writeClipboardText(file.path);
            setContextMenu(null);
          },
        },
        {
          label: 'Rename...',
          shortcut: 'F2',
          action: () => beginRenameFile(file),
        },
        {
          label: 'Delete',
          shortcut: 'Del',
          danger: true,
          action: () => deleteFile(file.id),
        },
      ],
    });
  };

  const openEditorContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [
        { label: 'Cut', shortcut: 'Ctrl+X', action: () => copySelectionToClipboard(true) },
        { label: 'Copy', shortcut: 'Ctrl+C', action: () => copySelectionToClipboard() },
        { label: 'Paste', shortcut: 'Ctrl+V', action: pasteClipboardIntoEditor },
        { label: 'Select All', shortcut: 'Ctrl+A', action: () => editorRef.current?.trigger('contextmenu', 'editor.action.selectAll', null) },
        { label: 'Format Document', shortcut: 'Shift+Alt+F', action: async () => {
          const action = editorRef.current?.getAction('editor.action.formatDocument');
          if (!action) {
            setConsoleLogs(current => [...current, makeConsoleEntry('info', 'No formatter is installed for this language.')]);
            return;
          }
          await action.run();
        } },
        { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => setCommandOpen(true) },
      ],
    });
  };

  /* =====================================================
     COMMAND PALETTE
  ===================================================== */

  const commands = [
    {
      label: 'Run Code',
      shortcut: 'Ctrl + Enter',
      action: () =>
        handleRunCode(),
    },
    {
      label: 'Save File',
      shortcut: 'Ctrl + S',
      action: () =>
        handleSave(),
    },
    {
      label: 'Import Files',
      shortcut: 'Ctrl + O',
      action: () =>
        fileInputRef.current?.click(),
    },
    {
      label: 'New File',
      shortcut: 'Ctrl + N',
      action: () =>
        createNewFile(),
    },
    {
      label: 'Close File',
      shortcut: 'Ctrl + W',
      action: () => {
        if (activeFileId) closeFile(activeFileId);
      },
    },
    {
      label: 'Toggle Explorer',
      shortcut: 'Ctrl + B',
      action: () =>
        setShowExplorer(
          (value) => !value
        ),
    },
    {
      label: 'Toggle Console',
      shortcut: 'Ctrl + `',
      action: () =>
        setShowConsole(
          (value) => !value
        ),
    },
    {
      label: 'Web Preview',
      shortcut: '',
      action: () => {
        setPreviewHtml(
          buildWebPreview()
        );
        setIsPreviewOpen(true);
      },
    },
    {
      label: 'Copy Code',
      shortcut: '',
      action: () =>
        copyCode(),
    },
  ];

  const filteredCommands =
    commands.filter(
      (command) =>
        command.label
          .toLowerCase()
          .includes(
            searchQuery.toLowerCase()
          )
    );

  const readClipboardText = async () => {
    const readFromElectron = window.electronAPI?.readClipboardText;
    if (typeof readFromElectron === 'function') {
      return readFromElectron();
    }
    if (navigator.clipboard?.readText) {
      return navigator.clipboard.readText();
    }
    throw new Error('Clipboard reading is unavailable in this environment.');
  };

  const writeClipboardText = async (text: string) => {
    const writeFromElectron = window.electronAPI?.writeClipboardText;
    if (typeof writeFromElectron === 'function') {
      await writeFromElectron(text);
      return;
    }
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    throw new Error('Clipboard writing is unavailable in this environment.');
  };

  /* =====================================================
     KEYBOARD SHORTCUTS
  ===================================================== */

  useEffect(() => {
    const handler = (
      event: KeyboardEvent
    ) => {
      const modifier =
        event.ctrlKey ||
        event.metaKey;
      const key = event.key.toLowerCase();
      const target = event.target;
      const isTypingInUiField =
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]') !== null &&
        target.closest('.monaco-editor') === null;

      if (event.key === 'Escape') {
        setCommandOpen(false);
        setSearchOpen(false);
        setSettingsOpen(false);
        setNewFileOpen(false);
        setRenameFileId(null);
        return;
      }
      if (newFileOpen) return;
      const fileId = target instanceof HTMLElement
        ? target.closest<HTMLElement>('[data-studio-file]')?.dataset.studioFile
        : undefined;
      if (fileId && key === 'f2') {
        event.preventDefault();
        const file = files.find(item => item.id === fileId);
        if (file) beginRenameFile(file);
        return;
      }
      if (fileId && key === 'delete') {
        event.preventDefault();
        deleteFile(fileId);
        return;
      }
      if (!modifier || isTypingInUiField) return;

      if (key === 's' && !event.shiftKey) {
        event.preventDefault();
        handleSave();
      } else if (key === 's' && event.shiftKey) {
        event.preventDefault();
        downloadCurrentFile();
      } else if (key === 'n') {
        event.preventDefault();
        createNewFile();
      } else if (key === 'o') {
        event.preventDefault();
        fileInputRef.current?.click();
      } else if (key === 'b') {
        event.preventDefault();
        setShowExplorer(value => !value);
      } else if (key === 'w') {
        event.preventDefault();
        if (activeFileId) closeFile(activeFileId);
      } else if (event.code === 'Backquote') {
        event.preventDefault();
        setShowConsole(value => !value);
      } else if (key === 'f' && event.shiftKey) {
        event.preventDefault();
        setSearchQuery('');
        setSearchOpen(true);
      } else if (key === 'f') {
        editorRef.current?.trigger('keyboard', 'actions.find', null);
      } else if (key === 'h') {
        editorRef.current?.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
      } else if (key === 'p' && event.shiftKey) {
        event.preventDefault();
        setSearchQuery('');
        setCommandOpen(true);
      } else if (key === 'p') {
        event.preventDefault();
        setSearchQuery('');
        setCommandOpen(false);
        setSearchOpen(true);
      } else if (key === 'enter') {
        event.preventDefault();
        handleRunCode();
      }
    };

    window.addEventListener(
      'keydown',
      handler
    );

    return () =>
      window.removeEventListener(
        'keydown',
        handler
      );
  }, [
    handleSave,
    handleRunCode,
    createNewFile,
    downloadCurrentFile,
    newFileOpen,
    activeFileId,
    files,
    beginRenameFile,
    deleteFile,
  ]);

  useEffect(() => {
    const pasteHandler = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.closest('.monaco-editor') ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== 'v' ||
        typeof window.electronAPI?.readClipboardText !== 'function'
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      pasteClipboardIntoEditor().catch(error => {
        setConsoleLogs(current => [
          ...current,
          makeConsoleEntry(
            'error',
            `Unable to paste from clipboard: ${error instanceof Error ? error.message : String(error)}`
          ),
        ]);
        setShowConsole(true);
      });
    };

    window.addEventListener('keydown', pasteHandler, true);
    return () => window.removeEventListener('keydown', pasteHandler, true);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    window.addEventListener('mousedown', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('mousedown', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [contextMenu]);

  /* =====================================================
     CUSTOM MONACO THEME
  ===================================================== */

  useEffect(() => {
    if (!isMonacoReady || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const syntaxColors: Record<EditorSettings['theme'], string[]> = {
      abyss: ['38BDF8', 'A3E635', 'FBBF24', 'C084FC'],
      'vs-dark': ['569CD6', 'CE9178', 'B5CEA8', '4EC9B0'],
      'hc-black': ['FFFF00', '00FF00', 'FFAA00', '00FFFF'],
      light: ['0000FF', 'A31515', '098658', '267F99'],
      'one-dark': ['C678DD', '98C379', 'D19A66', '56B6C2'],
      dracula: ['FF79C6', 'F1FA8C', 'BD93F9', '8BE9FD'],
      monokai: ['F92672', 'E6DB74', 'AE81FF', '66D9EF'],
      'github-dark': ['FF7B72', 'A5D6FF', '79C0FF', 'D2A8FF'],
    };
    (Object.keys(STUDIO_PALETTES) as EditorSettings['theme'][]).forEach(theme => {
      if (theme === 'vs-dark' || theme === 'hc-black' || theme === 'light') return;
      const palette = STUDIO_PALETTES[theme];
      const [keyword, string, number, type] = syntaxColors[theme];
      monaco.editor.defineTheme(STUDIO_THEME_IDS[theme], {
        base: 'vs-dark',
        inherit: true,
        rules: [
          {
            token: 'comment',
            foreground: '64748B',
            fontStyle: 'italic',
          },
          { token: 'keyword', foreground: keyword },
          { token: 'string', foreground: string },
          { token: 'number', foreground: number },
          { token: 'type', foreground: type },
        ],
        colors: {
          'editor.background': palette.background,
          'editor.foreground': palette.foreground,
          'editorLineNumber.foreground': palette.muted,
          'editorLineNumber.activeForeground': palette.accent,
          'editorCursor.foreground': palette.accent,
          'editor.selectionBackground': `${palette.accent}44`,
          'editor.lineHighlightBackground': palette.panel,
          'editorIndentGuide.background': palette.border,
          'editorIndentGuide.activeBackground': palette.muted,
        },
      });
    });
  }, [isMonacoReady]);

  /* =====================================================
     CHANGE MONACO THEME
  ===================================================== */

  useEffect(() => {
    if (!isMonacoReady || !monacoRef.current) return;

    monacoRef.current.editor.setTheme(getMonacoTheme(editorSettings.theme));
  }, [editorSettings.theme, isMonacoReady]);

  /* =====================================================
     RENDER
  ===================================================== */

  const palette = STUDIO_PALETTES[editorSettings.theme];
  const studioStyle = {
    '--studio-bg': palette.background,
    '--studio-panel': palette.panel,
    '--studio-toolbar': palette.toolbar,
    '--studio-surface': palette.surface,
    '--studio-border': palette.border,
    '--studio-foreground': palette.foreground,
    '--studio-muted': palette.muted,
    '--studio-accent': palette.accent,
    backgroundColor: palette.background,
    color: palette.foreground,
  } as CSSProperties;

  return (
    <div
      style={studioStyle}
      className={`code-studio-root relative flex h-full w-full overflow-hidden font-sans ${
        isFullscreen
          ? 'fixed inset-0 z-[9999]'
          : ''
      }`}
    >
      <style>{`
        .code-studio-root [class*="bg-slate-"] { background-color: var(--studio-panel) !important; }
        .code-studio-root [class*="bg-white/"] { background-color: var(--studio-surface) !important; }
        .code-studio-root [class*="border-white/"] { border-color: var(--studio-border) !important; }
        .code-studio-root [class*="text-slate-"] { color: var(--studio-muted) !important; }
        .code-studio-root [class*="text-white"] { color: var(--studio-foreground) !important; }
        .code-studio-root [class*="text-cyan-"] { color: var(--studio-accent) !important; }
        .code-studio-root [class*="border-cyan-"] { border-color: var(--studio-accent) !important; }
      `}</style>
      {/* =================================================
          BACKGROUND 3D LIGHT
      ================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]"
        />

        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[120px]"
        />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize:
              '32px 32px',
          }}
        />
      </div>

      {/* =================================================
          TOP BAR
      ================================================= */}

      <div className="absolute left-0 right-0 top-0 z-50 h-12 border-b border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="flex h-full items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{
                rotate: 8,
                scale: 1.05,
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
            >
              <Code2 className="h-4 w-4 text-cyan-400" />
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-white">
                  Code Studio
                </span>

                <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-cyan-300">
                  PRO
                </span>
              </div>

              <div className="text-[9px] text-slate-500">
                ARLO OS Development Environment
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Import files"
              className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-300"
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>

            <button
              onClick={createNewFile}
              title="New file"
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              New
            </button>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>

            <motion.button
              whileHover={{
                scale: 1.03,
              }}
              whileTap={{
                scale: 0.97,
              }}
              onClick={handleRunCode}
              disabled={isRunning}
              className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-3.5 py-1.5 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20 disabled:cursor-wait disabled:opacity-60"
            >
              <motion.div
                animate={{
                  x: [
                    '-120%',
                    '120%',
                  ],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-y-0 w-12 bg-white/20 blur-md"
              />

              {isRunning ? (
                <RefreshCw className="relative h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="relative h-3.5 w-3.5 fill-current" />
              )}

              <span className="relative">
                {isRunning
                  ? 'Running...'
                  : 'Run Code'}
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="relative z-10 flex min-h-0 w-full flex-1 pt-12">
        {/* =================================================
            EXPLORER
        ================================================= */}

        <AnimatePresence initial={false}>
          {showExplorer && (
            <motion.aside
              initial={{
                width: 0,
                opacity: 0,
              }}
              animate={{
                width: 225,
                opacity: 1,
              }}
              exit={{
                width: 0,
                opacity: 0,
              }}
              className="flex shrink-0 flex-col overflow-hidden border-r border-white/10 bg-slate-950/70 backdrop-blur-xl"
            >
              <div className="flex h-10 items-center justify-between border-b border-white/10 px-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />

                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Explorer
                  </span>
                </div>

                <button
                  onClick={createNewFile}
                  className="rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="border-b border-white/10 px-3 py-2">
                <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  <ChevronDown className="h-3 w-3" />
                  <Folder className="h-3 w-3 text-cyan-400" />
                  <span>Photos / Code Studio</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-0.5">
                  {files.map(
                    (
                      file
                    ) => {
                      const active =
                        file.id ===
                        activeFileId;

                      return (
                        <motion.button
                          key={
                            file.id
                          }
                          data-studio-file={file.id}
                          layout
                          onClick={() =>
                            handleSelectFile(
                              file.id
                            )
                          }
                          onContextMenu={event => openFileContextMenu(event, file)}
                          className={`group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition ${
                            active
                              ? 'border border-cyan-400/20 bg-cyan-400/10 text-white shadow-lg shadow-cyan-500/5'
                              : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
                          }`}
                        >
                          <span
                            className={`flex h-5 min-w-7 items-center justify-center rounded-md text-[7px] font-black ${
                              active
                                ? 'bg-cyan-400/15 text-cyan-300'
                                : 'bg-white/5 text-slate-500'
                            }`}
                          >
                            {
                              LANGUAGE_ICONS[
                                file.language
                              ]
                            }
                          </span>

                          <span className="min-w-0 flex-1 truncate">
                            {
                              file.name
                            }
                          </span>

                          {!file.saved && (
                            <Circle className="h-1.5 w-1.5 fill-amber-400 text-amber-400" />
                          )}
                        </motion.button>
                      );
                    }
                  )}
                </div>
                {files.length === 0 && (
                  <button
                    onClick={createNewFile}
                    className="mt-2 w-full rounded-lg border border-dashed border-white/10 px-3 py-4 text-left text-[10px] text-slate-400 hover:bg-white/5"
                  >
                    No files yet. Create a new file.
                  </button>
                )}
              </div>

              <div className="border-t border-white/10 p-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />

                    <span className="text-[9px] font-bold text-slate-300">
                      LOCAL PROJECT STORAGE
                    </span>
                  </div>

                  <p className="mt-1 text-[8px] leading-relaxed text-slate-500">
                    Imported files are persisted locally in your Code Studio storage.
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* =================================================
            EDITOR AREA
        ================================================= */}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* TOOL STRIP */}

          <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/50">
            <div className="flex min-w-0 items-center">
              <button
                onClick={() =>
                  setShowExplorer(
                    (value) =>
                      !value
                  )
                }
                className="mx-1 rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                title="Toggle Explorer"
              >
                <Folder className="h-3.5 w-3.5" />
              </button>

              <div className="h-5 w-px bg-white/10" />

              <div className="flex h-full min-w-0 items-center overflow-x-auto">
                {openFiles.map(file => (
                  <div
                    key={file.id}
                    onContextMenu={event => openFileContextMenu(event, file)}
                    className={`flex h-full max-w-56 items-center gap-2 border-r border-white/10 px-3 ${
                      file.id === activeFileId ? 'bg-slate-950/60' : 'hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => handleSelectFile(file.id)}
                      className="flex min-w-0 items-center gap-2 text-left"
                    >
                      <FileCode className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                      <span className="max-w-40 truncate text-[10px] font-medium">
                        {file.name}
                      </span>
                      {!file.saved && (
                        <Circle className="h-1.5 w-1.5 shrink-0 fill-amber-400 text-amber-400" />
                      )}
                    </button>
                    <button
                      onClick={() => closeFile(file.id)}
                      title={`Close ${file.name}`}
                      aria-label={`Close ${file.name}`}
                      className="rounded p-0.5 text-slate-500 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-0.5 px-2">
              <button
                onClick={() =>
                  setSearchOpen(true)
                }
                title="Find (Ctrl+F)"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={copyCode}
                title="Copy"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() =>
                  setSettingsOpen(
                    (value) =>
                      !value
                  )
                }
                title="Editor Settings"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() =>
                  setIsFullscreen(
                    (value) =>
                      !value
                  )
                }
                title="Fullscreen"
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* EDITOR */}

          <div
            className="relative min-h-0 flex-1"
            onContextMenu={openEditorContextMenu}
          >
            {hasActiveFile && activeFile ? <Editor
              height="100%"
              language={getMonacoLanguage(
                activeFile.language
              )}
              value={
                activeFile.code
              }
              onChange={(
                value
              ) =>
                updateActiveFile(
                  value || ''
                )
              }
              onMount={
                handleEditorMount
              }
              theme={getMonacoTheme(editorSettings.theme)}
              options={{
                automaticLayout: true,

                fontSize:
                  editorSettings.fontSize,

                fontFamily:
                  editorSettings.fontFamily,

                fontLigatures: editorSettings.fontLigatures,

                tabSize:
                  editorSettings.tabSize,

                insertSpaces: true,

                minimap: {
                  enabled:
                    editorSettings.minimap,
                },

                wordWrap:
                  editorSettings.wordWrap,

                lineNumbers:
                  editorSettings.lineNumbers,

                bracketPairColorization: {
                  enabled:
                    editorSettings.bracketPairColorization,
                },

                smoothScrolling:
                  editorSettings.smoothScrolling,

                cursorBlinking:
                  editorSettings.cursorBlinking,

                cursorSmoothCaretAnimation:
                  'on',

                renderWhitespace:
                  'selection',

                renderControlCharacters:
                  false,

                guides: {
                  bracketPairs: true,
                  indentation:
                    true,
                },

                stickyScroll: {
                  enabled: true,
                },

                folding: true,

                foldingHighlight:
                  true,

                showFoldingControls:
                  'mouseover',

                contextmenu: false,

                quickSuggestions:
                  true,

                suggestOnTriggerCharacters:
                  true,

                parameterHints: {
                  enabled: true,
                },

                formatOnPaste:
                  true,

                formatOnType:
                  true,

                scrollBeyondLastLine:
                  false,

                padding: {
                  top: 12,
                  bottom: 24,
                },

                overviewRulerBorder:
                  false,

                hideCursorInOverviewRuler:
                  true,

                scrollbar: {
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },

                selectionHighlight:
                  true,

                occurrencesHighlight:
                  'singleFile',

                unicodeHighlight: {
                  ambiguousCharacters:
                    false,
                },

                accessibilitySupport:
                  'off',
              }}
            /> : (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <Code2 className="mx-auto h-10 w-10 text-slate-500" />
                  <p className="mt-3 text-sm font-medium">No file is open</p>
                  <button
                    onClick={() => {
                      const firstFile = files[0];
                      if (firstFile) handleSelectFile(firstFile.id);
                      else createNewFile();
                    }}
                    className="mt-3 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950"
                  >
                    Open a file
                  </button>
                </div>
              </div>
            )}

            {/* LANGUAGE BADGE */}

            <div className="pointer-events-none absolute bottom-3 left-3 z-20">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/80 px-2.5 py-1.5 shadow-xl backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

                <span className="text-[9px] font-bold text-slate-400">
                  {
                    LANGUAGE_LABELS[
                      activeFile.language
                    ]
                  }
                </span>
              </div>
            </div>

            {/* SETTINGS */}

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -8,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    scale: 0.98,
                  }}
                  className="absolute right-3 top-3 z-50 max-h-[calc(100%-24px)] w-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-white">
                        Editor Settings
                      </div>

                      <div className="text-[9px] text-slate-500">
                        Customize your coding environment
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setSettingsOpen(
                          false
                        )
                      }
                      className="rounded-lg p-1 text-slate-500 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Theme
                      </span>

                      <select
                        value={
                          editorSettings.theme
                        }
                        onChange={(event) =>
                          setEditorSettings(
                            (current) => ({
                              ...current,
                              theme: event
                                .target
                                .value as EditorSettings['theme'],
                            })
                          )
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-200 outline-none"
                      >
                        <option value="abyss">
                          Abhishek Neon
                        </option>
                        <option value="vs-dark">
                          VS Dark
                        </option>
                        <option value="hc-black">
                          High Contrast
                        </option>
                        <option value="light">
                          Light
                        </option>
                        <option value="one-dark">One Dark</option>
                        <option value="dracula">Dracula</option>
                        <option value="monokai">Monokai</option>
                        <option value="github-dark">GitHub Dark</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Editor Font
                      </span>
                      <select
                        value={editorSettings.fontFamily}
                        onChange={event =>
                          setEditorSettings(current => ({
                            ...current,
                            fontFamily: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-200 outline-none"
                      >
                        <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                        <option value="'Fira Code', monospace">Fira Code</option>
                        <option value="Consolas, monospace">Consolas</option>
                        <option value="'Courier New', monospace">Courier New</option>
                      </select>
                    </label>

                    <label className="block">
                      <div className="mb-1 flex justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Font Size
                        </span>

                        <span className="text-[9px] text-cyan-400">
                          {
                            editorSettings.fontSize
                          }px
                        </span>
                      </div>

                      <input
                        type="range"
                        min="10"
                        max="24"
                        value={
                          editorSettings.fontSize
                        }
                        onChange={(event) =>
                          setEditorSettings(
                            (current) => ({
                              ...current,
                              fontSize:
                                Number(
                                  event
                                    .target
                                    .value
                                ),
                            })
                          )
                        }
                        className="w-full accent-cyan-400"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Word Wrap
                      </span>
                      <select
                        value={editorSettings.wordWrap}
                        onChange={event =>
                          setEditorSettings(current => ({
                            ...current,
                            wordWrap: event.target.value as EditorSettings['wordWrap'],
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-200 outline-none"
                      >
                        <option value="off">Off</option>
                        <option value="on">On</option>
                        <option value="bounded">Bounded</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Tab Size
                      </span>
                      <select
                        value={editorSettings.tabSize}
                        onChange={event =>
                          setEditorSettings(current => ({
                            ...current,
                            tabSize: Number(event.target.value),
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-200 outline-none"
                      >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                        <option value={8}>8 spaces</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Line Numbers
                      </span>
                      <select
                        value={editorSettings.lineNumbers}
                        onChange={event =>
                          setEditorSettings(current => ({
                            ...current,
                            lineNumbers: event.target.value as EditorSettings['lineNumbers'],
                          }))
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-200 outline-none"
                      >
                        <option value="on">On</option>
                        <option value="relative">Relative</option>
                        <option value="off">Off</option>
                      </select>
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300">
                        Minimap
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          editorSettings.minimap
                        }
                        onChange={(event) =>
                          setEditorSettings(
                            (current) => ({
                              ...current,
                              minimap:
                                event
                                  .target
                                  .checked,
                            })
                          )
                        }
                        className="accent-cyan-400"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300">
                        Bracket Colors
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          editorSettings.bracketPairColorization
                        }
                        onChange={(event) =>
                          setEditorSettings(
                            (current) => ({
                              ...current,
                              bracketPairColorization:
                                event
                                  .target
                                  .checked,
                            })
                          )
                        }
                        className="accent-cyan-400"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300">
                        Font Ligatures
                      </span>
                      <input
                        type="checkbox"
                        checked={editorSettings.fontLigatures}
                        onChange={event =>
                          setEditorSettings(current => ({
                            ...current,
                            fontLigatures: event.target.checked,
                          }))
                        }
                        className="accent-cyan-400"
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300">
                        Smooth Scrolling
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          editorSettings.smoothScrolling
                        }
                        onChange={(event) =>
                          setEditorSettings(
                            (current) => ({
                              ...current,
                              smoothScrolling:
                                event
                                  .target
                                  .checked,
                            })
                          )
                        }
                        className="accent-cyan-400"
                      />
                    </label>

                    <div className="border-t border-white/10 pt-2">
                      <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        <Keyboard className="h-3 w-3" />
                        Shortcuts
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-400">
                        <span>New file</span><kbd>Ctrl+N</kbd>
                        <span>Open file</span><kbd>Ctrl+O</kbd>
                        <span>Save</span><kbd>Ctrl+S</kbd>
                        <span>Run</span><kbd>Ctrl+Enter</kbd>
                        <span>Quick open</span><kbd>Ctrl+P</kbd>
                        <span>Commands</span><kbd>Ctrl+Shift+P</kbd>
                        <span>Find / replace</span><kbd>Ctrl+F / H</kbd>
                        <span>Search files</span><kbd>Ctrl+Shift+F</kbd>
                        <span>Explorer</span><kbd>Ctrl+B</kbd>
                        <span>Terminal</span><kbd>Ctrl+`</kbd>
                        <span>Select all</span><kbd>Ctrl+A</kbd>
                        <span>Copy / Paste</span><kbd>Ctrl+C / V</kbd>
                        <span>Undo / Redo</span><kbd>Ctrl+Z / Y</kbd>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* =================================================
              CONSOLE
          ================================================= */}

          <AnimatePresence initial={false}>
            {showConsole && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: 190,
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                className="shrink-0 overflow-hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-xl"
              >
                <div className="flex h-9 items-center justify-between border-b border-white/10 bg-white/[0.03] px-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />

                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                      Terminal
                    </span>

                    <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400">
                      OUTPUT
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setConsoleLogs([])
                      }
                      title="Clear console"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        setShowConsole(
                          false
                        )
                      }
                      className="rounded-md p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex h-36 min-h-0">
                  <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[10px]">
                    {consoleLogs.map(
                      (entry) => (
                        <div
                          key={
                            entry.id
                          }
                          className="group mb-1 flex gap-3 rounded-md px-1.5 py-1 hover:bg-white/[0.03]"
                        >
                          <span className="shrink-0 text-slate-700">
                            {
                              entry.timestamp
                            }
                          </span>

                          <span
                            className={`whitespace-pre-wrap break-words ${
                              entry.type ===
                              'error'
                                ? 'text-red-400'
                                : entry.type ===
                                  'warn'
                                ? 'text-amber-400'
                                : entry.type ===
                                  'system'
                                ? 'text-cyan-400'
                                : entry.type ===
                                  'info'
                                ? 'text-blue-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {
                              entry.text
                            }
                          </span>
                        </div>
                      )
                    )}

                    {consoleLogs.length ===
                      0 && (
                      <div className="py-8 text-center text-slate-700">
                        Terminal output is empty.
                      </div>
                    )}

                    {runtimeInstallNeeded && (
                      <div className="ml-1 mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-2">
                        <span className="text-[10px] text-slate-300">
                          {runtimeInstallNeeded === 'cpp'
                            ? 'C++ needs a compiler (MSYS2/GCC).'
                            : 'Java needs a JDK (Temurin 21).'}
                        </span>
                        <button
                          type="button"
                          onClick={() => void installRequiredRuntime()}
                          disabled={isInstallingRuntime}
                          className="rounded-md bg-cyan-500/20 px-2.5 py-1 text-[9px] font-bold text-cyan-200 hover:bg-cyan-500/30 disabled:cursor-wait disabled:opacity-60"
                        >
                          {isInstallingRuntime ? 'Installing…' : 'Install and Run'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="w-56 border-l border-white/10 p-2">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      <Keyboard className="h-3 w-3" />
                      STDIN
                    </div>

                    <textarea
                      value={input}
                      onChange={(event) =>
                        setInput(
                          event.target
                            .value
                        )
                      }
                      placeholder="                      LOCALgram input..."
                      className="h-24 w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] p-2 font-mono text-[9px] text-slate-300 outline-none placeholder:text-slate-700 focus:border-cyan-400/30"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showConsole && (
            <button
              onClick={() =>
                setShowConsole(true)
              }
              className="absolute bottom-7 right-3 z-30 rounded-lg border border-white/10 bg-slate-900/90 px-2.5 py-1.5 text-[9px] font-bold text-slate-400 shadow-xl backdrop-blur-xl hover:text-white"
            >
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-emerald-400" />
                Show Terminal
              </div>
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          STATUS BAR
      ================================================= */}

      <div className="absolute bottom-0 left-0 right-0 z-40 flex h-6 items-center justify-between border-t border-white/10 bg-cyan-950/40 px-3 text-[9px] font-mono text-slate-500 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
            Ready
          </span>

          <span>
            Local workspace
          </span>

          <span>
            {
              files.length
            } files
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            UTF-8
          </span>

          <span>
            {
              LANGUAGE_LABELS[
                activeFile.language
              ]
            }
          </span>

          <span>
            Spaces: {
              editorSettings.tabSize
            }
          </span>

          <span className="hidden sm:inline">
            Ctrl+S Save
          </span>

          <span className="hidden sm:inline">
            Ctrl+Enter Run
          </span>
        </div>
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: -10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="absolute left-1/2 top-16 z-[100] w-[min(520px,calc(100%-30px))] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/70 backdrop-blur-2xl">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
                <Search className="h-4 w-4 text-cyan-400" />

                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Quick Open files..."
                  className="h-10 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                />

                <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] text-slate-500">
                  ESC
                </kbd>
              </div>

              <div className="mt-2 max-h-64 overflow-y-auto">
                {files
                  .filter((file) =>
                    file.name
                      .toLowerCase()
                      .includes(
                        searchQuery.toLowerCase()
                      )
                  )
                  .map((file) => (
                    <button
                      key={file.id}
                      onClick={() => {
                        handleSelectFile(
                          file.id
                        );
                        setSearchOpen(
                          false
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/5"
                    >
                      <FileCode className="h-4 w-4 text-cyan-400" />

                      <div className="min-w-0">
                        <div className="truncate text-[11px] text-white">
                          {
                            file.name
                          }
                        </div>

                        <div className="truncate text-[9px] text-slate-600">
                          {
                            file.path
                          }
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          COMMAND PALETTE
      ================================================= */}

      <AnimatePresence>
        {commandOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: -10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: -10,
            }}
            className="absolute left-1/2 top-16 z-[110] w-[min(600px,calc(100%-30px))] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
                <Sparkles className="h-4 w-4 text-cyan-400" />

                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Type a command..."
                  className="h-10 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-600"
                />
              </div>

              <div className="mt-2 space-y-0.5">
                {filteredCommands.map(
                  (
                    command
                  ) => (
                    <button
                      key={
                        command.label
                      }
                      onClick={() => {
                        command.action();
                        setCommandOpen(
                          false
                        );
                        setSearchQuery(
                          ''
                        );
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-cyan-400/10"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-cyan-400" />

                        <span className="text-[11px] text-slate-200">
                          {
                            command.label
                          }
                        </span>
                      </div>

                      {command.shortcut && (
                        <kbd className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[8px] text-slate-500">
                          {
                            command.shortcut
                          }
                        </kbd>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onMouseDown={event => event.stopPropagation()}
            className="studio-context-menu fixed z-[150] min-w-56 overflow-hidden rounded-lg border border-white/10 bg-slate-950 py-1 shadow-2xl shadow-black/50"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 240),
              top: Math.min(contextMenu.y, window.innerHeight - contextMenu.items.length * 34 - 12),
            }}
            role="menu"
          >
            {contextMenu.items.map(item => (
              <button
                key={item.label}
                role="menuitem"
                onClick={async () => {
                  try {
                    await item.action();
                    setContextMenu(null);
                  } catch (error) {
                    setConsoleLogs(current => [
                      ...current,
                      makeConsoleEntry(
                        'error',
                        error instanceof Error ? error.message : String(error)
                      ),
                    ]);
                    setShowConsole(true);
                    setContextMenu(null);
                  }
                }}
                className={`flex h-8 w-full items-center justify-between px-3 text-left text-[11px] transition hover:bg-white/10 ${
                  item.danger ? 'text-red-400' : 'text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <kbd className="ml-6 text-[9px] text-slate-500">{item.shortcut}</kbd>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newFileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onMouseDown={event => {
              if (event.target === event.currentTarget) {
                setNewFileOpen(false);
                setRenameFileId(null);
              }
            }}
          >
            <motion.form
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              onSubmit={confirmCreateFile}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/60"
              aria-label="Create a new file"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <FilePlus2 className="h-4 w-4 text-cyan-400" />
                    {renameFileId ? 'Rename File' : 'New File'}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {renameFileId
                      ? 'Change the file name and language extension.'
                      : 'Choose a name and extension, such as app.py or Main.java.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewFileOpen(false);
                    setRenameFileId(null);
                  }}
                  aria-label="Close new file dialog"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                File name
                <input
                  autoFocus
                  value={newFileName}
                  onChange={event => {
                    setNewFileName(event.target.value);
                    setNewFileError('');
                  }}
                  placeholder="example.py"
                  className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 font-mono text-xs normal-case tracking-normal text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </label>
              {newFileError && (
                <p role="alert" className="mt-2 text-xs text-red-400">
                  {newFileError}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewFileOpen(false);
                    setRenameFileId(null);
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400"
                >
                  {renameFileId ? 'Rename File' : 'Create File'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          WEB PREVIEW
      ================================================= */}

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.94,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: 20,
            }}
            className="absolute inset-5 z-[120] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/80"
          >
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/90 px-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />

                <span className="text-xs font-bold text-white">
                  Live Web Preview
                </span>

                <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400">
                  SANDBOX
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setPreviewHtml(
                      buildWebPreview()
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() =>
                    setIsPreviewOpen(
                      false
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 bg-white">
              <iframe
                title="ARLO OS Web Preview"
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                className="h-full w-full border-0"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          HIDDEN IMPORT INPUT
      ================================================= */}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".ts,.tsx,.js,.mjs,.cjs,.jsx,.py,.pyw,.cpp,.cc,.cxx,.hpp,.hh,.hxx,.c,.java,.html,.htm,.css,.json,.md,.txt"
        onChange={
          handleImportFiles
        }
        className="hidden"
      />
    </div>
  );
};

export default CodeStudioApp;
