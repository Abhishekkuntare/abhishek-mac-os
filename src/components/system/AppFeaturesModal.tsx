import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Smartphone,
  Folder,
  Compass,
  MessageCircle,
  Mail,
  Calendar,
  Image as ImageIcon,
  Music,
  Tv,
  FileText,
  CheckSquare,
  Terminal,
  Camera as CameraIcon,
  Code2,
  Settings,
  ShoppingBag,
  Activity,
  HardDrive,
  Camera,
  DownloadCloud,
  Clock,
  CloudSun,
  Layers,
  Sparkles,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Cpu,
  Pin,
  PinOff,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { APP_REGISTRY } from '../../data/defaultApps';
import { getAppFeatureDetails } from '../../data/appFeatures';
import { sound } from '../../services/soundService';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Smartphone,
  Folder,
  Compass,
  MessageCircle,
  Mail,
  Calendar,
  Image: ImageIcon,
  Music,
  Tv,
  FileText,
  CheckSquare,
  Terminal,
  CameraIcon,
  Code2,
  Settings,
  ShoppingBag,
  Activity,
  HardDrive,
  Camera,
  DownloadCloud,
  Clock,
  CloudSun,
};

interface AppFeaturesModalProps {
  appId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AppFeaturesModal: React.FC<AppFeaturesModalProps> = ({ appId, isOpen, onClose }) => {
  const { openApp, dockAppIds, toggleDockPin, addNotification } = useOS();
  const [activeTab, setActiveTab] = useState<'features' | 'permissions' | 'storage'>('features');
  const [copied, setCopied] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!isOpen || !appId) return null;

  const meta = APP_REGISTRY[appId];
  const details = getAppFeatureDetails(appId, meta?.name);
  const IconComponent = ICON_MAP[meta?.iconName || 'Folder'] || Layers;
  const isPinnedToDock = dockAppIds.includes(appId);

  const handleCopyDetails = async () => {
    const summary = `Application: ${details.name} (${details.version})\nDeveloper: ${details.developer}\nCategory: ${details.category}\nTagline: ${details.tagline}\n\nFeatures:\n${details.features.map(f => `• ${f.title}: ${f.description}`).join('\n')}\n\nPermissions:\n${details.permissions.map(p => `• ${p.name}: ${p.status} - ${p.description}`).join('\n')}\n\nStorage:\nBundle: ${details.bundleSize} | Cache: ${details.cacheSize} | Memory: ${details.memoryEstimate}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      sound.playClick();
      addNotification({
        appId: 'finder',
        title: 'App Specs Copied',
        message: `Specifications for "${details.name}" copied to clipboard.`,
        type: 'system',
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleClearCache = () => {
    sound.playTrash();
    setCacheCleared(true);
    addNotification({
      appId: 'finder',
      title: 'Cache Cleared',
      message: `Cleared ${details.cacheSize} cached data for ${details.name}.`,
      type: 'system',
    });
    setTimeout(() => setCacheCleared(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-xl rounded-3xl glass-panel text-white overflow-hidden shadow-2xl border border-white/20 backdrop-blur-3xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="relative p-6 pb-4 border-b border-white/10 flex items-start justify-between bg-gradient-to-b from-white/10 to-transparent">
            <div className="flex items-center gap-4">
              {/* App Icon Tile */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl relative overflow-hidden border border-white/20 shrink-0"
                style={{ background: meta?.iconBg || 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/30 pointer-events-none" />
                <IconComponent className="w-8 h-8 drop-shadow-md z-10" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">{details.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                    {details.version}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{details.tagline}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span className="capitalize">{details.category}</span>
                  <span>•</span>
                  <span>{details.developer}</span>
                  {details.offlineCapable && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">Offline Capable</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-6 border-b border-white/10 bg-black/20 text-xs font-semibold gap-6">
            <button
              onClick={() => setActiveTab('features')}
              className={`py-3 relative cursor-pointer transition-colors ${
                activeTab === 'features' ? 'text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Features & Capabilities</span>
              {activeTab === 'features' && (
                <motion.div
                  layoutId="modal-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-3 relative cursor-pointer transition-colors ${
                activeTab === 'permissions' ? 'text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Permissions & Privacy</span>
              {activeTab === 'permissions' && (
                <motion.div
                  layoutId="modal-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`py-3 relative cursor-pointer transition-colors ${
                activeTab === 'storage' ? 'text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Storage & System Footprint</span>
              {activeTab === 'storage' && (
                <motion.div
                  layoutId="modal-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                />
              )}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 max-h-[340px] overflow-y-auto space-y-4">
            {activeTab === 'features' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {details.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <h4 className="text-xs font-bold text-white">{feat.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed pl-7">{feat.description}</p>
                    </div>
                  ))}
                </div>

                {details.supportedFormats && details.supportedFormats.length > 0 && (
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 mt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Supported Formats & Protocols:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {details.supportedFormats.map(fmt => (
                        <span
                          key={fmt}
                          className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[10px] font-mono"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-3">
                {details.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{perm.name}</h4>
                        <p className="text-[11px] text-slate-400">{perm.description}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {perm.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">App Binary</p>
                    <p className="text-base font-extrabold text-white mt-1">{details.bundleSize}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">RAM Usage</p>
                    <p className="text-base font-extrabold text-sky-400 mt-1">{details.memoryEstimate}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Cache Data</p>
                    <p className="text-base font-extrabold text-amber-400 mt-1">
                      {cacheCleared ? '0 KB' : details.cacheSize}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Application Cache & Temporary Files</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clear cached assets, cookies, and temporary computation states
                    </p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    disabled={cacheCleared}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {cacheCleared ? <Check className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{cacheCleared ? 'Cache Emptied' : 'Clear Cache'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 px-6 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Copy App Info Button */}
              <button
                onClick={handleCopyDetails}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                title="Copy all app features and specifications to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Specs!' : 'Copy App Details'}</span>
              </button>

              {/* Pin / Unpin from Dock */}
              <button
                onClick={() => {
                  toggleDockPin(appId);
                  sound.playClick();
                }}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isPinnedToDock
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                }`}
                title={isPinnedToDock ? 'Unpin from Dock' : 'Pin to Dock'}
              >
                {isPinnedToDock ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                <span>{isPinnedToDock ? 'Remove from Dock' : 'Keep in Dock'}</span>
              </button>
            </div>

            {/* Launch App Button */}
            <button
              onClick={() => {
                openApp(appId);
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Application</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
