import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X, FileText, Image, Music, Film, Code2 } from 'lucide-react';
import { useOS } from '../../context/OSContext';

export const QuickLookModal: React.FC = () => {
  const { quickLookFile, setQuickLookFile } = useOS();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (quickLookFile && (e.key === 'Escape' || e.code === 'Space')) {
        e.preventDefault();
        setQuickLookFile(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [quickLookFile, setQuickLookFile]);

  if (!quickLookFile) return null;

  const formattedSize =
    quickLookFile.size > 1000000
      ? `${(quickLookFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(quickLookFile.size / 1024))} KB`;

  return (
    <div
      onClick={() => setQuickLookFile(null)}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[85vh] rounded-3xl glass-panel text-white shadow-2xl border border-white/20 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            {quickLookFile.type === 'image' ? (
              <Image className="w-5 h-5 text-purple-400" />
            ) : quickLookFile.type === 'code' ? (
              <Code2 className="w-5 h-5 text-indigo-400" />
            ) : quickLookFile.type === 'audio' ? (
              <Music className="w-5 h-5 text-emerald-400" />
            ) : quickLookFile.type === 'video' ? (
              <Film className="w-5 h-5 text-amber-400" />
            ) : (
              <FileText className="w-5 h-5 text-sky-400" />
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">{quickLookFile.name}</h3>
              <p className="text-[10px] text-slate-400 truncate">{quickLookFile.path}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-300">{formattedSize}</span>
            <button
              onClick={() => setQuickLookFile(null)}
              className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/20 min-h-[350px]">
          {quickLookFile.type === 'image' && quickLookFile.previewUrl ? (
            <img
              src={quickLookFile.previewUrl}
              alt={quickLookFile.name}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          ) : quickLookFile.type === 'audio' ? (
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Music className="w-10 h-10" />
              </div>
              <p className="text-base font-bold">{quickLookFile.name}</p>
              <p className="text-xs text-slate-400 mt-1">Ready for high-fidelity audio playback</p>
            </div>
          ) : quickLookFile.type === 'code' || quickLookFile.type === 'document' ? (
            <pre className="w-full h-full font-mono text-xs text-slate-200 bg-slate-950/80 p-4 rounded-xl overflow-auto border border-white/10 whitespace-pre-wrap leading-relaxed">
              {quickLookFile.content || '// Empty document'}
            </pre>
          ) : (
            <div className="text-center p-8 text-slate-400">
              <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">{quickLookFile.name}</p>
              <p className="text-xs text-slate-500 mt-1">{formattedSize}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Updated: {new Date(quickLookFile.updatedAt).toLocaleDateString()}</span>
          <span>Press Space or Esc to close</span>
        </div>
      </motion.div>
    </div>
  );
};
