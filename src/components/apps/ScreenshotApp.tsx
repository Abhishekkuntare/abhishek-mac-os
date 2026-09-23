import React, { useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { vfs } from '../../services/virtualFileSystem';
import { sound } from '../../services/soundService';

export const ScreenshotApp: React.FC = () => {
  const { currentWallpaper } = useOS();
  const [captured, setCaptured] = useState(false);
  const [lastScreenshotUrl, setLastScreenshotUrl] = useState<string | null>(null);

  const takeCapture = () => {
    sound.playShutter();
    setCaptured(true);
    setLastScreenshotUrl(currentWallpaper.url);

    const filename = `Screenshot ${new Date().toLocaleTimeString().replace(/:/g, '.')}.png`;
    const created = vfs.createFile(filename, '/Users/abhishek/Desktop', 'image', '', 'png');
    created.previewUrl = currentWallpaper.url;
    vfs.save();

    setTimeout(() => setCaptured(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-white select-none text-center">
      <div className="w-20 h-20 rounded-3xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-xl">
        <Camera className="w-10 h-10" />
      </div>

      <h3 className="text-xl font-bold mb-2">Abhishek OS Screen Capture</h3>
      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
        Instantly capture high-resolution screenshots of the workspace. Captured screenshots are
        saved directly to your Virtual Desktop.
      </p>

      <button
        onClick={takeCapture}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-purple-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
      >
        {captured ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
        <span>{captured ? 'Captured & Saved to Desktop!' : 'Capture Entire Screen'}</span>
      </button>

      {lastScreenshotUrl && (
        <div className="mt-8 p-3 rounded-2xl bg-white/5 border border-white/10 max-w-xs">
          <div className="text-[11px] font-semibold text-slate-300 mb-2">Latest Capture Preview</div>
          <img src={lastScreenshotUrl} alt="Preview" className="rounded-xl aspect-video object-cover" />
        </div>
      )}
    </div>
  );
};
