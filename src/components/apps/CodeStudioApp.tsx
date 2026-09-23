
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
  | 'markdown';

interface ProjectFile {
  id: string;
  name: string;
  language: SupportedLanguage;
  code: string;
  path: string;
  saved: boolean;
}

interface ConsoleEntry {
  id: string;
  type: 'log' | 'error' | 'warn' | 'info' | 'system';
  text: string;
  timestamp: string;
}

interface EditorSettings {
  theme: 'abyss' | 'vs-dark' | 'hc-black' | 'light';
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  wordWrap: 'off' | 'on' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative';
  bracketPairColorization: boolean;
  smoothScrolling: boolean;
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
}

/* =========================================================
   EXECUTION API
   IMPORTANT:
   Replace this with your own sandbox/compiler endpoint.
========================================================= */

const CODE_EXECUTION_API =
  import.meta.env.VITE_CODE_EXECUTION_API ||
  'http://localhost:8000/api/execute';

/* =========================================================
   DEFAULT FILES
========================================================= */

const SAMPLE_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'app-tsx',
    name: 'App.tsx',
    language: 'typescript',
    path: '/src/App.tsx',
    saved: true,
    code: `import React from 'react';
import { OSProvider } from './context/OSContext';
import { Desktop } from './components/desktop/Desktop';

export default function App() {
  return (
    <OSProvider>
      <main className="w-screen h-screen overflow-hidden select-none">
        <Desktop />
      </main>
    </OSProvider>
  );
}`,
  },

  {
    id: 'physics-ts',
    name: 'physicsEngine.ts',
    language: 'typescript',
    path: '/src/physicsEngine.ts',
    saved: true,
    code: `// Abhishek OS Particle Simulation

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export function updateParticles(
  particles: Particle[],
  bounds: { w: number; h: number }
) {
  return particles.map((p) => {
    let nextX = p.x + p.vx;
    let nextY = p.y + p.vy;

    let nextVx = p.vx;
    let nextVy = p.vy;

    if (nextX < 0 || nextX > bounds.w) {
      nextVx *= -0.95;
    }

    if (nextY < 0 || nextY > bounds.h) {
      nextVy *= -0.95;
    }

    return {
      ...p,
      x: nextX,
      y: nextY,
      vx: nextVx,
      vy: nextVy,
    };
  });
}`,
  },

  {
    id: 'welcome-js',
    name: 'welcome.js',
    language: 'javascript',
    path: '/src/welcome.js',
    saved: true,
    code: `// Welcome to Code Studio

console.log("🚀 Welcome to Code Studio on Abhishek OS!");

const author = "Abhishek Kuntare";

const features = [
  "Window Manager",
  "Glassmorphism",
  "Virtual File System",
  "Native Apps"
];

console.log(\`Designed and engineered with passion by \${author}.\`);

console.table(features);

const result = Array.from(
  { length: 5 },
  (_, i) => ({
    id: i + 1,
    power: Math.pow(2, i + 1)
  })
);

console.log("Calculated Powers of 2:", result);`,
  },

  {
    id: 'main-py',
    name: 'main.py',
    language: 'python',
    path: '/src/main.py',
    saved: true,
    code: `print("Hello from Python!")
print("Welcome to Abhishek OS Code Studio")

numbers = [1, 2, 3, 4, 5]

for number in numbers:
    print("Number:", number)`,
  },

  {
    id: 'main-cpp',
    name: 'main.cpp',
    language: 'cpp',
    path: '/src/main.cpp',
    saved: true,
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello from C++!" << endl;
    cout << "Abhishek OS Code Studio" << endl;

    for (int i = 1; i <= 5; i++) {
        cout << "Number: " << i << endl;
    }

    return 0;
}`,
  },

  {
    id: 'Main-java',
    name: 'Main.java',
    language: 'java',
    path: '/src/Main.java',
    saved: true,
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        System.out.println("Abhishek OS Code Studio");

        for (int i = 1; i <= 5; i++) {
            System.out.println("Number: " + i);
        }
    }
}`,
  },

  {
    id: 'index-html',
    name: 'index.html',
    language: 'html',
    path: '/web/index.html',
    saved: true,
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>Abhishek OS Preview</title>

  <link rel="stylesheet" href="style.css" />
</head>

<body>
  <div class="card">
    <h1>Abhishek OS</h1>
    <p>Live HTML / CSS preview.</p>

    <button onclick="sayHello()">
      Run JavaScript
    </button>
  </div>

  <script src="script.js"></script>
</body>
</html>`,
  },

  {
    id: 'style-css',
    name: 'style.css',
    language: 'css',
    path: '/web/style.css',
    saved: true,
    code: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 20% 20%, #0ea5e955, transparent 35%),
    radial-gradient(circle at 80% 80%, #6366f155, transparent 35%),
    #020617;
  color: white;
  font-family: Inter, system-ui, sans-serif;
}

.card {
  padding: 48px;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 32px;
  background: rgba(15,23,42,.7);
  backdrop-filter: blur(30px);
  box-shadow:
    0 30px 100px rgba(0,0,0,.45),
    inset 0 1px rgba(255,255,255,.1);
  text-align: center;
}

button {
  margin-top: 20px;
  padding: 12px 20px;
  border: 0;
  border-radius: 12px;
  background: #0ea5e9;
  color: white;
  cursor: pointer;
}`,
  },

  {
    id: 'script-js',
    name: 'script.js',
    language: 'javascript',
    path: '/web/script.js',
    saved: true,
    code: `function sayHello() {
  alert("Hello from Abhishek OS!");
}`,
  },
];

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
    case 'jsx':
      return 'javascript';
    case 'py':
      return 'python';
    case 'cpp':
    case 'cc':
    case 'cxx':
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
      return 'javascript';
  }
};

const getMonacoLanguage = (
  language: SupportedLanguage
) => {
  return language;
};

/* =========================================================
   INDEXED DB
   Imported files are persisted locally.
========================================================= */

const DB_NAME = 'abhishek-os-code-studio';

const DB_VERSION = 1;

const STORE_NAME = 'project-files';

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
      SAMPLE_PROJECT_FILES
    );

  const [activeFileId, setActiveFileId] =
    useState('welcome-js');

  const [consoleLogs, setConsoleLogs] =
    useState<ConsoleEntry[]>([
      makeConsoleEntry(
        'system',
        'Code Studio v3.0 initialized.'
      ),
      makeConsoleEntry(
        'info',
        'Ctrl+Enter → Run • Ctrl+S → Save • Ctrl+P → Command Palette'
      ),
    ]);

  const [isRunning, setIsRunning] =
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

  const [editorSettings, setEditorSettings] =
    useState<EditorSettings>({
      theme: 'abyss',
      fontSize: 14,
      tabSize: 2,
      minimap: true,
      wordWrap: 'off',
      lineNumbers: 'on',
      bracketPairColorization: true,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
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

  /* =====================================================
     LOAD LOCAL FILES
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const stored =
        await loadFilesFromDB();

      if (
        !cancelled &&
        stored.length > 0
      ) {
        setFiles((current) => {
          const map = new Map(
            current.map((file) => [
              file.id,
              file,
            ])
          );

          stored.forEach((file) => {
            map.set(file.id, file);
          });

          return Array.from(
            map.values()
          );
        });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================================================
     PERSIST FILES
  ===================================================== */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveFilesToDB(files);
    }, 500);

    return () =>
      window.clearTimeout(timer);
  }, [files]);

  /* =====================================================
     MONACO MOUNT
  ===================================================== */

  const handleEditorMount: OnMount = (
    editor,
    monaco
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(
      monaco.KeyMod.Ctrl |
        monaco.KeyCode.Enter,
      () => {
        handleRunCode();
      }
    );

    editor.addCommand(
      monaco.KeyMod.Ctrl |
        monaco.KeyCode.KeyS,
      () => {
        handleSave();
      }
    );

    editor.addCommand(
      monaco.KeyMod.Ctrl |
        monaco.KeyCode.KeyP,
      () => {
        setCommandOpen(true);
      }
    );

    editor.addCommand(
      monaco.KeyMod.Ctrl |
        monaco.KeyCode.KeyF,
      () => {
        setSearchOpen(true);
      }
    );
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

    setActiveFileId(id);

    window.setTimeout(() => {
      editorRef.current?.focus();
    }, 50);
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = useCallback(() => {
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
      '<h1>Abhishek OS Preview</h1>';

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
     REMOTE EXECUTION
  ===================================================== */

  const executeRemoteCode = async (
    file: ProjectFile
  ) => {
    const response =
      await fetch(
        CODE_EXECUTION_API,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            language:
              file.language,
            filename:
              file.name,
            code: file.code,
            stdin: input,
          }),
        }
      );

    if (!response.ok) {
      throw new Error(
        `Execution server returned ${response.status}`
      );
    }

    const data =
      await response.json();

    const entries: ConsoleEntry[] =
      [];

    if (data.compile?.stderr) {
      entries.push(
        makeConsoleEntry(
          'error',
          data.compile.stderr
        )
      );
    }

    if (data.compile?.stdout) {
      entries.push(
        makeConsoleEntry(
          'info',
          data.compile.stdout
        )
      );
    }

    if (data.stdout) {
      entries.push(
        makeConsoleEntry(
          'log',
          data.stdout
        )
      );
    }

    if (data.stderr) {
      entries.push(
        makeConsoleEntry(
          'error',
          data.stderr
        )
      );
    }

    if (data.output) {
      entries.push(
        makeConsoleEntry(
          'log',
          data.output
        )
      );
    }

    if (data.run?.stdout) {
      entries.push(
        makeConsoleEntry(
          'log',
          data.run.stdout
        )
      );
    }

    if (data.run?.stderr) {
      entries.push(
        makeConsoleEntry(
          'error',
          data.run.stderr
        )
      );
    }

    if (entries.length === 0) {
      entries.push(
        makeConsoleEntry(
          'system',
          'Process finished successfully.'
        )
      );
    }

    return entries;
  };

  /* =====================================================
     RUN CODE
  ===================================================== */

  const handleRunCode = useCallback(
    async () => {
      if (!activeFile) return;

      sound.playClick();

      setIsRunning(true);

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
          'javascript'
        ) {
          const logs =
            await executeJavaScript(
              activeFile.code
            );

          setConsoleLogs([
            makeConsoleEntry(
              'system',
              `JavaScript execution completed.`
            ),
            ...logs,
          ]);
        } else if (
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
          const logs =
            await executeRemoteCode(
              activeFile
            );

          setConsoleLogs([
            makeConsoleEntry(
              'system',
              `${LANGUAGE_LABELS[
                activeFile.language
              ]} execution completed.`
            ),
            ...logs,
          ]);
        }
      } catch (error: any) {
        setConsoleLogs([
          makeConsoleEntry(
            'error',
            error?.message ||
              'Unable to execute code.'
          ),
          makeConsoleEntry(
            'info',
            'Configure VITE_CODE_EXECUTION_API to connect your sandbox compiler.'
          ),
        ]);
      } finally {
        setIsRunning(false);
      }
    },
    [
      activeFile,
      input,
      files,
    ]
  );

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
    const name =
      window.prompt(
        'Enter file name',
        'NewFile.py'
      );

    if (!name) return;

    const language =
      getLanguageFromFilename(name);

    const newFile: ProjectFile = {
      id: `new-${Date.now()}`,
      name,
      language,
      path: `/Photos/Code Studio/${name}`,
      code: '',
      saved: true,
    };

    setFiles((current) => [
      ...current,
      newFile,
    ]);

    setActiveFileId(newFile.id);

    sound.playClick();
  };

  /* =====================================================
     DELETE FILE
  ===================================================== */

  const deleteActiveFile = () => {
    if (!activeFile) return;

    if (
      files.length <= 1
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${activeFile.name}?`
      );

    if (!confirmed) return;

    const remaining =
      files.filter(
        (file) =>
          file.id !==
          activeFile.id
      );

    setFiles(remaining);

    setActiveFileId(
      remaining[0].id
    );
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

    await navigator.clipboard.writeText(
      activeFile.code
    );

    setConsoleLogs((current) => [
      ...current,
      makeConsoleEntry(
        'system',
        'Current file copied to clipboard.'
      ),
    ]);
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
      shortcut: '',
      action: () =>
        fileInputRef.current?.click(),
    },
    {
      label: 'New File',
      shortcut: '',
      action: () =>
        createNewFile(),
    },
    {
      label: 'Toggle Explorer',
      shortcut: '',
      action: () =>
        setShowExplorer(
          (value) => !value
        ),
    },
    {
      label: 'Toggle Console',
      shortcut: '',
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

      if (
        modifier &&
        event.key.toLowerCase() ===
          's'
      ) {
        event.preventDefault();
        handleSave();
      }

      if (
        modifier &&
        event.key ===
          'Enter'
      ) {
        event.preventDefault();
        handleRunCode();
      }

      if (
        modifier &&
        event.key.toLowerCase() ===
          'p'
      ) {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (
        modifier &&
        event.key.toLowerCase() ===
          'f'
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (
        event.key === 'Escape'
      ) {
        setCommandOpen(false);
        setSearchOpen(false);
        setSettingsOpen(false);
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
  ]);

  /* =====================================================
     CUSTOM MONACO THEME
  ===================================================== */

  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.editor.defineTheme(
      'abhishek-neon',
      {
        base: 'vs-dark',
        inherit: true,
        rules: [
          {
            token: 'comment',
            foreground: '64748B',
            fontStyle: 'italic',
          },
          {
            token: 'keyword',
            foreground: '38BDF8',
          },
          {
            token: 'string',
            foreground: 'A3E635',
          },
          {
            token: 'number',
            foreground: 'FBBF24',
          },
          {
            token: 'type',
            foreground: 'C084FC',
          },
        ],
        colors: {
          'editor.background':
            '#020617',
          'editor.foreground':
            '#E2E8F0',
          'editorLineNumber.foreground':
            '#334155',
          'editorLineNumber.activeForeground':
            '#38BDF8',
          'editorCursor.foreground':
            '#38BDF8',
          'editor.selectionBackground':
            '#0EA5E944',
          'editor.lineHighlightBackground':
            '#0F172A',
          'editorIndentGuide.background':
            '#1E293B',
          'editorIndentGuide.activeBackground':
            '#334155',
        },
      }
    );
  }, []);

  /* =====================================================
     CHANGE MONACO THEME
  ===================================================== */

  useEffect(() => {
    if (!monacoRef.current) return;

    monacoRef.current.editor.setTheme(
      editorSettings.theme ===
        'abyss'
        ? 'abhishek-neon'
        : editorSettings.theme
    );
  }, [editorSettings.theme]);

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className={`relative flex h-full w-full overflow-hidden bg-[#020617] text-slate-200 font-sans ${
        isFullscreen
          ? 'fixed inset-0 z-[9999]'
          : ''
      }`}
    >
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
                Abhishek OS Development Environment
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
                          layout
                          onClick={() =>
                            handleSelectFile(
                              file.id
                            )
                          }
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

              <div className="flex h-full min-w-0 items-center">
                {activeFile && (
                  <div className="flex h-full items-center gap-2 border-r border-white/10 bg-slate-950/60 px-3">
                    <FileCode className="h-3.5 w-3.5 text-cyan-400" />

                    <span className="max-w-44 truncate text-[10px] font-medium text-slate-200">
                      {
                        activeFile.name
                      }
                    </span>

                    {!activeFile.saved && (
                      <Circle className="h-1.5 w-1.5 fill-amber-400 text-amber-400" />
                    )}

                    {activeFile.saved && (
                      <Check className="h-3 w-3 text-emerald-400" />
                    )}
                  </div>
                )}
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

          <div className="relative min-h-0 flex-1">
            <Editor
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
              theme={
                editorSettings.theme ===
                'abyss'
                  ? 'abhishek-neon'
                  : editorSettings.theme
              }
              options={{
                automaticLayout: true,

                fontSize:
                  editorSettings.fontSize,

                fontFamily:
                  "'JetBrains Mono', 'Fira Code', Consolas, monospace",

                fontLigatures: true,

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

                contextmenu: true,

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
            />

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
                  className="absolute right-3 top-3 z-50 w-72 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl"
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
                      placeholder="Program input..."
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
            Git: main
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
                  placeholder="Search in Code Studio..."
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
                title="Abhishek OS Web Preview"
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
        accept=".ts,.tsx,.js,.jsx,.py,.cpp,.cc,.cxx,.c,.java,.html,.htm,.css,.json,.md"
        onChange={
          handleImportFiles
        }
        className="hidden"
      />
    </div>
  );
};

export default CodeStudioApp;

