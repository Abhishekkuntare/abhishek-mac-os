import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Braces,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  FilePlus2,
  FileText,
  FolderOpen,
  Search,
  Save,
  Settings2,
  X,
} from 'lucide-react';

interface EditorDocument {
  id: string;
  name: string;
  content: string;
  language: string;
  dirty: boolean;
}

const STORAGE_KEY = 'abhishek_os_nextpad_documents_v1';
const LANGUAGE_MODES = [
  'Plain Text',
  'JavaScript',
  'TypeScript',
  'HTML',
  'CSS',
  'JSON',
  'Python',
  'Markdown',
  'C++',
  'Shell',
];

const extensionLanguage = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const languages: Record<string, string> = {
    c: 'C++',
    cc: 'C++',
    cpp: 'C++',
    css: 'CSS',
    h: 'C++',
    hpp: 'C++',
    html: 'HTML',
    htm: 'HTML',
    js: 'JavaScript',
    jsx: 'JavaScript',
    json: 'JSON',
    md: 'Markdown',
    mjs: 'JavaScript',
    py: 'Python',
    sh: 'Shell',
    ts: 'TypeScript',
    tsx: 'TypeScript',
  };
  return languages[extension ?? ''] ?? 'Plain Text';
};

const createDocument = (name = 'untitled.txt', content = ''): EditorDocument => ({
  id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name,
  content,
  language: extensionLanguage(name),
  dirty: false,
});

const readDocuments = (): EditorDocument[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [createDocument()];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error('Saved documents are not a list.');
    const validDocuments = parsed.filter(
      (document): document is EditorDocument =>
        typeof document === 'object' &&
        document !== null &&
        typeof document.id === 'string' &&
        typeof document.name === 'string' &&
        typeof document.content === 'string' &&
        typeof document.language === 'string',
    );
    return validDocuments.length
      ? validDocuments.map(document => ({ ...document, dirty: false }))
      : [createDocument()];
  } catch (error) {
    console.error('[Nextpad++] Could not restore saved documents:', error);
    return [createDocument()];
  }
};

export const NextpadApp: React.FC = () => {
  const [documents, setDocuments] = useState<EditorDocument[]>(readDocuments);
  const [activeId, setActiveId] = useState(() => documents[0]?.id);
  const [showFind, setShowFind] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [wrapLines, setWrapLines] = useState(true);
  const [caret, setCaret] = useState({ line: 1, column: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const editorActionsRef = useRef<{ save: () => void; find: () => void }>({
    save: () => undefined,
    find: () => undefined,
  });

  const activeDocument = documents.find(document => document.id === activeId) ?? documents[0];
  const lineCount = useMemo(() => (activeDocument?.content.match(/\n/g)?.length ?? 0) + 1, [activeDocument?.content]);
  const matchCount = useMemo(() => {
    if (!query || !activeDocument) return 0;
    return activeDocument.content.split(query).length - 1;
  }, [activeDocument, query]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
      setStorageError(false);
    } catch (error) {
      console.error('[Nextpad++] Could not save documents:', error);
      setStorageError(true);
    }
  }, [documents]);

  useEffect(() => {
    if (activeId && !documents.some(document => document.id === activeId)) {
      setActiveId(documents[0]?.id);
    }
  }, [activeId, documents]);

  const updateActiveDocument = (update: Partial<EditorDocument>) => {
    if (!activeDocument) return;
    setDocuments(current =>
      current.map(document =>
        document.id === activeDocument.id
          ? { ...document, ...update, dirty: update.dirty ?? true }
          : document,
      ),
    );
  };

  const createNewDocument = () => {
    const nextDocument = createDocument(`untitled-${documents.length + 1}.txt`);
    setDocuments(current => [...current, nextDocument]);
    setActiveId(nextDocument.id);
    setCaret({ line: 1, column: 1 });
    setShowFind(false);
  };

  const closeDocument = (documentId: string) => {
    const remaining = documents.filter(document => document.id !== documentId);
    if (!remaining.length) {
      const nextDocument = createDocument();
      setDocuments([nextDocument]);
      setActiveId(nextDocument.id);
      return;
    }
    if (activeId === documentId) {
      const closedIndex = documents.findIndex(document => document.id === documentId);
      setActiveId(remaining[Math.max(0, closedIndex - 1)]?.id);
    }
    setDocuments(remaining);
  };

  const openFile = async (file?: File) => {
    if (!file) return;
    try {
      const content = await file.text();
      const existing = documents.find(document => document.name === file.name);
      if (existing) {
        setDocuments(current =>
          current.map(document =>
            document.id === existing.id
              ? { ...document, content, language: extensionLanguage(file.name), dirty: false }
              : document,
          ),
        );
        setActiveId(existing.id);
      } else {
        const opened = createDocument(file.name, content);
        setDocuments(current => [...current, opened]);
        setActiveId(opened.id);
      }
      setCaret({ line: 1, column: 1 });
    } catch (error) {
      console.error('[Nextpad++] Could not open the selected file:', error);
      window.alert('That file could not be opened. Please try a text-based file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveDocument = () => {
    if (!activeDocument) return;
    try {
      const blob = new Blob([activeDocument.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = activeDocument.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDocuments(current =>
        current.map(document =>
          document.id === activeDocument.id ? { ...document, dirty: false } : document,
        ),
      );
    } catch (error) {
      console.error('[Nextpad++] Could not save the current document:', error);
      window.alert('The document could not be saved.');
    }
  };

  const openFind = () => {
    setShowFind(value => !value);
    requestAnimationFrame(() => editorRef.current?.focus());
  };

  const replaceAll = () => {
    if (!query || !activeDocument) return;
    const content = editorRef.current?.getValue() ?? activeDocument.content;
    updateActiveDocument({ content: content.split(query).join(replacement) });
  };

  editorActionsRef.current = {
    save: saveDocument,
    find: () => setShowFind(true),
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => editorActionsRef.current.save());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => editorActionsRef.current.find());
    editor.onDidChangeCursorPosition(event =>
      setCaret({ line: event.position.lineNumber, column: event.position.column }),
    );
  };

  const getEditorLanguage = (language: string) => {
    const languages: Record<string, string> = {
      'Plain Text': 'plaintext',
      JavaScript: 'javascript',
      TypeScript: 'typescript',
      HTML: 'html',
      CSS: 'css',
      JSON: 'json',
      Python: 'python',
      Markdown: 'markdown',
      'C++': 'cpp',
      Shell: 'shell',
    };
    return languages[language] ?? 'plaintext';
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#101114] text-slate-200">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#17181b] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-300/10 text-lime-300">
          <Braces size={16} />
        </div>
        <div className="mr-3 leading-tight">
          <div className="text-[12px] font-semibold text-white">Nextpad++</div>
          <div className="text-[9px] text-slate-500">Text & code workspace</div>
        </div>
        <div className="h-5 w-px bg-white/10" />
        <button onClick={createNewDocument} className="editor-toolbar-button" title="New file">
          <FilePlus2 size={14} /><span>New</span>
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="editor-toolbar-button" title="Open a local text file">
          <FolderOpen size={14} /><span>Open</span>
        </button>
        <button onClick={saveDocument} className="editor-toolbar-button" title="Download current document (Ctrl/Cmd+S)">
          <Save size={14} /><span>Save</span>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={openFind}
            className={`editor-icon-button ${showFind ? 'bg-lime-300/10 text-lime-200' : ''}`}
            title="Find and replace (Ctrl/Cmd+F)"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => setWrapLines(value => !value)}
            className={`editor-icon-button ${wrapLines ? 'text-lime-200' : ''}`}
            title={wrapLines ? 'Turn off line wrap' : 'Turn on line wrap'}
          >
            <Settings2 size={15} />
          </button>
          <button className="editor-icon-button" title="Nextpad++ local editor">
            <CircleHelp size={15} />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.html,.css,.py,.sh,.c,.cpp,.h,.hpp"
          className="hidden"
          onChange={event => void openFile(event.target.files?.[0])}
        />
      </div>

      <div className="flex h-10 shrink-0 items-stretch gap-1 overflow-x-auto border-b border-white/[0.07] bg-[#141518] px-2">
        {documents.map(document => (
          <button
            key={document.id}
            onClick={() => setActiveId(document.id)}
            className={`group relative flex min-w-32 max-w-56 items-center gap-2 px-3 text-[11px] transition-colors ${
              document.id === activeId
                ? 'bg-[#101114] text-white'
                : 'text-slate-400 hover:bg-white/[0.035] hover:text-slate-200'
            }`}
          >
            {document.language === 'Plain Text' ? <FileText size={13} /> : <Code2 size={13} />}
            <span className="truncate">{document.name}</span>
            {document.dirty && <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />}
            <span
              role="button"
              tabIndex={0}
              onClick={event => {
                event.stopPropagation();
                closeDocument(document.id);
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  closeDocument(document.id);
                }
              }}
              className="ml-auto rounded p-0.5 opacity-0 transition hover:bg-white/10 group-hover:opacity-100"
              aria-label={`Close ${document.name}`}
            >
              <X size={12} />
            </span>
          </button>
        ))}
        <button onClick={createNewDocument} className="my-auto rounded p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white" title="New tab">
          <FilePlus2 size={14} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFind && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.07] bg-[#1b1c20]"
          >
            <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
              <Search size={14} className="text-lime-300" />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Find"
                className="h-8 min-w-36 flex-1 rounded-md border border-white/10 bg-black/20 px-2.5 text-[11px] outline-none focus:border-lime-300/40"
                aria-label="Find text"
              />
              <input
                value={replacement}
                onChange={event => setReplacement(event.target.value)}
                placeholder="Replace with"
                className="h-8 min-w-36 flex-1 rounded-md border border-white/10 bg-black/20 px-2.5 text-[11px] outline-none focus:border-lime-300/40"
                aria-label="Replacement text"
              />
              <span className="min-w-14 text-center text-[10px] text-slate-500">{matchCount} matches</span>
              <button onClick={replaceAll} className="h-8 rounded-md bg-lime-300/10 px-3 text-[10px] font-semibold text-lime-200 transition hover:bg-lime-300/20">
                Replace all
              </button>
              <button onClick={() => { setShowFind(false); setQuery(''); }} className="rounded p-1.5 text-slate-500 hover:bg-white/10 hover:text-white" title="Close find">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-0 flex-1 overflow-hidden bg-[#101114]" aria-label="Text editor">
        <Editor
          height="100%"
          language={getEditorLanguage(activeDocument?.language ?? 'Plain Text')}
          value={activeDocument?.content ?? ''}
          onMount={handleEditorMount}
          onChange={value => updateActiveDocument({ content: value ?? '' })}
          theme="vs-dark"
          options={{
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            fontFamily: "'Cascadia Code', 'SFMono-Regular', Consolas, monospace",
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            padding: { top: 18, bottom: 18 },
            renderLineHighlight: 'gutter',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            tabSize: 2,
            wordWrap: wrapLines ? 'on' : 'off',
          }}
        />
      </div>

      <div className="flex h-8 shrink-0 items-center justify-between border-t border-white/[0.07] bg-[#17181b] px-4 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" />Ready</span>
          <span className={storageError ? 'text-rose-300' : ''}>
            {storageError ? 'Could not save locally' : activeDocument?.dirty ? 'Unsaved changes' : 'Saved on this device'}
          </span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln {caret.line}, Col {caret.column}</span>
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(value => !value)}
              className="flex items-center gap-1 rounded px-2 py-1 transition hover:bg-white/5 hover:text-slate-200"
            >
              {activeDocument?.language ?? 'Plain Text'}<ChevronDown size={11} />
            </button>
            <AnimatePresence>
              {showLanguageMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-8 right-0 z-20 max-h-64 w-36 overflow-y-auto rounded-lg border border-white/10 bg-[#202126] p-1 shadow-xl"
                >
                  {LANGUAGE_MODES.map(language => (
                    <button
                      key={language}
                      onClick={() => { updateActiveDocument({ language }); setShowLanguageMenu(false); }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[10px] transition hover:bg-white/[0.06] ${
                        language === activeDocument?.language ? 'text-lime-200' : 'text-slate-300'
                      }`}
                    >
                      {language}{language === activeDocument?.language && <Check size={12} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span>{lineCount} lines</span>
        </div>
      </div>
      <style>{`
        .editor-toolbar-button { display:flex; align-items:center; gap:6px; border-radius:7px; padding:6px 9px; color:#a1a1aa; font-size:10px; transition:background .18s,color .18s; }
        .editor-toolbar-button:hover { background:rgba(255,255,255,.07); color:#fff; }
        .editor-icon-button { display:flex; height:30px; width:30px; align-items:center; justify-content:center; border-radius:7px; color:#9ca3af; transition:background .18s,color .18s; }
        .editor-icon-button:hover { background:rgba(255,255,255,.08); color:#fff; }
      `}</style>
    </div>
  );
};

export default NextpadApp;
